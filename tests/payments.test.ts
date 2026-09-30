import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeSupabase } from './fake-supabase';

const fake = new FakeSupabase();
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: () => true,
  supabase: () => fake,
}));

import { GET as getConfig } from '@/app/api/config/route';
import { POST as createGift } from '@/app/api/gifts/route';
import { GET as readGift, PATCH } from '@/app/api/gifts/[id]/route';
import { GET as ownerGet } from '@/app/api/gifts/[id]/owner/route';
import { GET as statsGet } from '@/app/api/gifts/[id]/stats/route';
import { POST as viewPost } from '@/app/api/gifts/[id]/views/route';
import { POST as reactionPost } from '@/app/api/gifts/[id]/reactions/route';
import { POST as checkoutPost } from '@/app/api/gifts/[id]/checkout/route';
import { GET as cleanup } from '@/app/api/cron/cleanup/route';
import { findGift, markPaid } from '@/lib/gifts';

const ID = 'a1b2c3d4e5f6a1b2c3d4e5f6';
const KEY = 'f'.repeat(64);
const DAY = 86_400_000;
const ctx = (id = ID) => ({ params: Promise.resolve({ id }) });

function req(path: string, method: string, body?: unknown, key?: string) {
  return new Request(`https://luv4u.test${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(key ? { authorization: `Bearer ${key}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
const gift = (extra: Record<string, unknown> = {}) => ({ name: 'Sarah', occasion: 'love', vibe: 'Romantic', photos: [], ...extra });
const create = (body: Record<string, unknown> = {}) =>
  createGift(req('/api/gifts', 'POST', { id: ID, editKey: KEY, gift: gift(), expiresDays: 90, ...body }));
const daysUntil = (iso: string | null) => Math.round((new Date(iso as string).getTime() - Date.now()) / DAY);

beforeEach(() => {
  fake.tables = {};
  fake.files.clear();
  process.env.RATE_SALT = 'test-salt';
  process.env.CRON_SECRET = 'cron-secret';
  delete process.env.PREVIEW_TTL_DAYS;
});
afterEach(() => {
  delete process.env.PAYMENTS_REQUIRED;
});

describe('with payments off (the default)', () => {
  it('creates unlocked gifts and writes nothing new to the database', async () => {
    const data = await (await create()).json();
    expect(data.status).toBe('paid');
    const row = fake.tables.gifts[0];
    expect(row).not.toHaveProperty('status');
    expect(row).not.toHaveProperty('live_days');
    expect((await readGift(req('/x', 'GET'), ctx())).status).toBe(200);
    expect((await (await getConfig()).json()).payments).toEqual({ required: false });
  });

  it('treats rows from before the status column as unlocked', async () => {
    await create();
    delete fake.tables.gifts[0].status;
    expect((await readGift(req('/x', 'GET'), ctx())).status).toBe(200);
  });
});

describe('with payments required', () => {
  beforeEach(() => {
    process.env.PAYMENTS_REQUIRED = 'true';
  });

  it('advertises the requirement', async () => {
    expect((await (await getConfig()).json()).payments).toEqual({ required: true, priceInr: 149, linkDays: 365 });
  });

  it('takes the price from PAYMENT_PRICE_INR and falls back to the default for nonsense', async () => {
    process.env.PAYMENT_PRICE_INR = '199';
    expect((await (await getConfig()).json()).payments.priceInr).toBe(199);
    process.env.PAYMENT_PRICE_INR = 'free';
    expect((await (await getConfig()).json()).payments.priceInr).toBe(149);
    delete process.env.PAYMENT_PRICE_INR;
  });

  it('creates a private preview that expires soon with a fixed one-year link once unlocked', async () => {
    const data = await (await create()).json();
    expect(data.status).toBe('preview');
    const row = fake.tables.gifts[0];
    expect(row.status).toBe('preview');
    expect(row.live_days).toBe(365); // the client's 90 is ignored: paid links have one fixed lifetime
    expect(daysUntil(row.expires_at as string)).toBe(7);
  });

  it('honours PREVIEW_TTL_DAYS within limits', async () => {
    process.env.PREVIEW_TTL_DAYS = '3';
    await create();
    expect(daysUntil(fake.tables.gifts[0].expires_at as string)).toBe(3);
    fake.tables = {};
    process.env.PREVIEW_TTL_DAYS = '999';
    await create();
    expect(daysUntil(fake.tables.gifts[0].expires_at as string)).toBe(7);
  });

  it('keeps a preview invisible to everyone but its owner', async () => {
    await create();
    const publicRead = await readGift(req('/x', 'GET'), ctx());
    expect(publicRead.status).toBe(402);
    expect(JSON.stringify(await publicRead.json())).not.toContain('Sarah');

    const owner = await (await ownerGet(req('/x', 'GET', undefined, KEY), ctx())).json();
    expect(owner.status).toBe('preview');
    expect(owner.gift.name).toBe('Sarah');
    expect((await ownerGet(req('/x', 'GET', undefined, 'a'.repeat(64)), ctx())).status).toBe(403);
    expect((await (await statsGet(req('/x', 'GET', undefined, KEY), ctx())).json()).status).toBe('preview');
  });

  it('does not count openings or accept replies for a preview', async () => {
    await create();
    await viewPost(req('/x', 'POST', { visitor: 'v1' }), ctx());
    expect(fake.tables.gift_views ?? []).toHaveLength(0);
    expect((await reactionPost(req('/x', 'POST', { visitor: 'v1', reaction: '🥹' }), ctx())).status).toBe(404);
    expect(fake.tables.gift_replies ?? []).toHaveLength(0);
  });

  it('lets the owner keep editing a preview, extending its life; a client-sent lifetime is ignored', async () => {
    await create();
    fake.tables.gifts[0].expires_at = new Date(Date.now() + DAY).toISOString();
    const edited = await (await PATCH(req('/x', 'PATCH', { gift: gift({ name: 'Sara' }), expiresDays: 30 }, KEY), ctx())).json();
    expect(edited.status).toBe('preview');
    expect(edited.gift.name).toBe('Sara');
    expect(fake.tables.gifts[0].live_days).toBe(365);
    expect(daysUntil(fake.tables.gifts[0].expires_at as string)).toBe(7);
  });

  it('unlocks with markPaid: the link opens and its lifetime starts from payment', async () => {
    await create();
    const row = await markPaid(ID);
    expect(row?.status).toBe('paid');
    expect(row?.paid_at).toBeTruthy();
    expect(daysUntil(row?.expires_at as string)).toBe(365);

    const opened = await readGift(req('/x', 'GET'), ctx());
    expect(opened.status).toBe(200);
    await viewPost(req('/x', 'POST', { visitor: 'v1' }), ctx());
    expect(fake.tables.gift_views).toHaveLength(1);
    expect((await reactionPost(req('/x', 'POST', { visitor: 'v1', reaction: '🥹' }), ctx())).status).toBe(200);
  });

  it('markPaid is idempotent and ignores unknown gifts', async () => {
    await create();
    const first = await markPaid(ID);
    await new Promise((r) => setTimeout(r, 5));
    const second = await markPaid(ID);
    expect(second?.paid_at).toBe(first?.paid_at);
    expect(second?.expires_at).toBe(first?.expires_at);
    expect(await markPaid('0'.repeat(24))).toBeNull();
  });

  it('does not let an unlocked gift shorten or extend its paid lifetime by editing', async () => {
    await create();
    await markPaid(ID);
    const before = fake.tables.gifts[0].expires_at;
    const edited = await (await PATCH(req('/x', 'PATCH', { gift: gift(), expiresDays: 7 }, KEY), ctx())).json();
    expect(edited.status).toBe('paid');
    expect(edited.expiresAt).toBe(before);
  });

  it('retrying a create answers with the stored status', async () => {
    await create();
    const retry = await (await create()).json();
    expect(retry.status).toBe('preview');
    expect(fake.tables.gifts).toHaveLength(1);
  });

  it('cleanup removes previews that were never unlocked, and keeps unlocked and fresh ones', async () => {
    await create();
    await create.call(null, { id: 'b'.repeat(24), editKey: 'e'.repeat(64) });
    const other = 'c'.repeat(24);
    await create.call(null, { id: other, editKey: 'd'.repeat(64) });
    await markPaid(other);
    fake.tables.gifts[0].expires_at = new Date(Date.now() - 1000).toISOString(); // stale preview
    const res = await cleanup(req('/x', 'GET', undefined, 'cron-secret'));
    expect((await res.json()).expired).toBe(1);
    expect(fake.tables.gifts.map((g) => g.id)).toEqual(['b'.repeat(24), other]);
  });
});

describe('checkout placeholder', () => {
  beforeEach(() => {
    process.env.PAYMENTS_REQUIRED = 'true';
  });

  it('needs the owner key', async () => {
    await create();
    expect((await checkoutPost(req('/x', 'POST'), ctx())).status).toBe(401);
    expect((await checkoutPost(req('/x', 'POST', undefined, 'a'.repeat(64)), ctx())).status).toBe(403);
  });

  it('says payments are not set up yet, and never unlocks anything by itself', async () => {
    await create();
    const res = await checkoutPost(req('/x', 'POST', undefined, KEY), ctx());
    expect(res.status).toBe(503);
    expect((await findGift(ID))?.status).toBe('preview');
  });

  it('answers ok for a gift that is already unlocked', async () => {
    await create();
    await markPaid(ID);
    const res = await checkoutPost(req('/x', 'POST', undefined, KEY), ctx());
    expect(await res.json()).toMatchObject({ ok: true, status: 'paid' });
  });
});

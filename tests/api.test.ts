import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeSupabase } from './fake-supabase';

const fake = new FakeSupabase();
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: () => true,
  supabase: () => fake,
}));

import { GET as getConfig } from '@/app/api/config/route';
import { POST as createGift } from '@/app/api/gifts/route';
import { DELETE, GET as readGift, PATCH } from '@/app/api/gifts/[id]/route';
import { GET as ownerGet } from '@/app/api/gifts/[id]/owner/route';
import { GET as statsGet } from '@/app/api/gifts/[id]/stats/route';
import { POST as viewPost } from '@/app/api/gifts/[id]/views/route';
import { POST as reactionPost } from '@/app/api/gifts/[id]/reactions/route';
import { POST as mediaPost } from '@/app/api/gifts/[id]/media/route';
import { GET as cleanup } from '@/app/api/cron/cleanup/route';
import { markPaid } from '@/lib/gifts';

const ID = 'a1b2c3d4e5f6a1b2c3d4e5f6';
const KEY = 'f'.repeat(64);
const ctx = (id = ID) => ({ params: Promise.resolve({ id }) });
// 1x1 transparent PNG
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

function req(path: string, method: string, body?: unknown, key?: string) {
  return new Request(`https://luv4u.test${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(key ? { authorization: `Bearer ${key}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const gift = (extra: Record<string, unknown> = {}) => ({ name: 'Sarah', occasion: 'love', vibe: 'Romantic', photos: [], ...extra });
const create = (body: Record<string, unknown> = {}) =>
  createGift(req('/api/gifts', 'POST', { id: ID, editKey: KEY, gift: gift(), ...body }));

beforeEach(() => {
  fake.tables = {};
  fake.files.clear();
  process.env.RATE_SALT = 'test-salt';
  process.env.CRON_SECRET = 'cron-secret';
});

describe('config', () => {
  it('advertises product, version, hosted mode and all 8 occasions', async () => {
    const data = await (await getConfig()).json();
    expect(data).toMatchObject({ product: 'luv4u', version: 3, hosted: true });
    expect(data.occasions).toHaveLength(8);
    expect(data.mediaBase).toBe('https://fake.supabase.co/storage/v1/object/public/gift-media/gifts/');
  });
});

describe('creating gifts', () => {
  it('stores a gift and returns its short link', async () => {
    const res = await create();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toMatchObject({ ok: true, url: `https://luv4u.test/g/${ID}`, revision: 1 });
    expect(data.gift).toMatchObject({ id: ID, server: true, name: 'Sarah' });
  });

  it('never stores the edit key, only its salted hash', async () => {
    await create();
    const row = fake.tables.gifts[0];
    expect(row.owner_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(row)).not.toContain(KEY);
  });

  it('requires a recipient name, a known occasion and well-formed ids', async () => {
    expect((await create({ gift: gift({ name: '  ' }) })).status).toBe(400);
    expect((await create({ gift: gift({ occasion: 'nope' }) })).status).toBe(400);
    expect((await create({ id: 'short' })).status).toBe(400);
    expect((await create({ editKey: 'short' })).status).toBe(400);
  });

  it('keeps apology gifts to the Emotional and Elegant vibes', async () => {
    expect((await create({ gift: gift({ occasion: 'apology', vibe: 'Funny' }) })).status).toBe(400);
    expect((await create({ gift: gift({ occasion: 'apology', vibe: 'Elegant' }) })).status).toBe(200);
  });

  it('is idempotent for the same key and refuses a different key', async () => {
    await create();
    const retry = await create();
    expect(retry.status).toBe(200);
    expect(fake.tables.gifts).toHaveLength(1);
    const other = await createGift(req('/api/gifts', 'POST', { id: ID, editKey: 'e'.repeat(64), gift: gift() }));
    expect(other.status).toBe(409);
  });

  it('moves embedded data-URI media into Storage and keeps the JSON small', async () => {
    const res = await create({ gift: gift({ photos: [{ src: PNG, caption: 'us' }] }), cover: PNG });
    const data = await res.json();
    expect(data.gift.photos[0].src).toMatch(new RegExp(`/gift-media/gifts/${ID}/[a-f0-9]{24}\\.png$`));
    expect(data.gift.coverUrl).toBe(`https://fake.supabase.co/storage/v1/object/public/gift-media/gifts/${ID}/cover.png`);
    expect(JSON.stringify(fake.tables.gifts[0].gift)).not.toContain('base64');
    expect(fake.files.size).toBe(2);
  });

  it('honours a discreet preview by dropping the cover', async () => {
    const data = await (await create({ gift: gift({ sharePreview: false }), cover: PNG })).json();
    expect(data.gift.coverUrl).toBe('');
  });

  it('only accepts a cover URL inside the gift’s own storage folder', async () => {
    const own = `https://fake.supabase.co/storage/v1/object/public/gift-media/gifts/${ID}/cover.png`;
    expect((await (await create({ coverUrl: own })).json()).gift.coverUrl).toBe(own);
    fake.tables = {};
    const foreign = await (await create({ coverUrl: 'https://evil.example/x.png' })).json();
    expect(foreign.gift.coverUrl).toBe('');
  });

  it('rejects unsupported or oversized media', async () => {
    const bad = await create({ gift: gift({ voice: 'data:application/pdf;base64,AAAA' }) });
    expect(bad.status).toBe(415);
    const huge = 'data:image/png;base64,' + Buffer.alloc(1_100_000).toString('base64');
    expect((await create({ gift: gift({ photos: [{ src: huge }] }) })).status).toBe(413);
  });
});

describe('reading and owning gifts', () => {
  // Gifts start as private previews; these tests are about a gift that has been paid for.
  beforeEach(async () => { await create(); await markPaid(ID); });

  it('serves the public gift without any secrets', async () => {
    const res = await readGift(req(`/api/gifts/${ID}`, 'GET'), ctx());
    const text = await res.text();
    expect(res.status).toBe(200);
    expect(text).not.toContain('owner_hash');
    expect(JSON.parse(text).gift.name).toBe('Sarah');
  });

  it('404s for unknown and malformed ids, 410s once expired', async () => {
    expect((await readGift(req('/x', 'GET'), ctx('0'.repeat(24)))).status).toBe(404);
    expect((await readGift(req('/x', 'GET'), ctx('nope'))).status).toBe(404);
    fake.tables.gifts[0].expires_at = new Date(Date.now() - 1000).toISOString();
    expect((await readGift(req('/x', 'GET'), ctx())).status).toBe(410);
  });

  it('lets only the edit key recover, update and delete', async () => {
    const wrong = 'a'.repeat(64);
    expect((await ownerGet(req('/x', 'GET', undefined, wrong), ctx())).status).toBe(403);
    expect((await ownerGet(req('/x', 'GET'), ctx())).status).toBe(401);
    expect((await ownerGet(req('/x', 'GET', undefined, KEY), ctx())).status).toBe(200);
    expect((await PATCH(req('/x', 'PATCH', { gift: gift() }, wrong), ctx())).status).toBe(403);
    expect((await DELETE(req('/x', 'DELETE', undefined, wrong), ctx())).status).toBe(403);
    expect(fake.tables.gifts).toHaveLength(1);
  });

  it('updates a gift, bumps the revision and prunes replaced media', async () => {
    const first = await (await PATCH(req('/x', 'PATCH', { gift: gift({ photos: [{ src: PNG }] }) }, KEY), ctx())).json();
    expect(first.revision).toBe(2);
    expect(fake.files.size).toBe(1);
    const second = await (await PATCH(req('/x', 'PATCH', { gift: gift({ name: 'Sara', photos: [] }) }, KEY), ctx())).json();
    expect(second.revision).toBe(3);
    expect(second.gift.name).toBe('Sara');
    expect(fake.files.size).toBe(0);
  });

  it('keeps the existing cover when an edit sends none', async () => {
    fake.tables = {};
    await create({ cover: PNG });
    const res = await (await PATCH(req('/x', 'PATCH', { gift: gift({ name: 'Sara' }) }, KEY), ctx())).json();
    expect(res.gift.coverUrl).toContain('/cover.png');
  });

  it('deletes the gift together with its media', async () => {
    fake.tables = {};
    await create({ gift: gift({ photos: [{ src: PNG }] }), cover: PNG });
    expect(fake.files.size).toBe(2);
    expect((await DELETE(req('/x', 'DELETE', undefined, KEY), ctx())).status).toBe(200);
    expect(fake.tables.gifts).toHaveLength(0);
    expect(fake.files.size).toBe(0);
  });
});

describe('recipient interactions', () => {
  beforeEach(async () => { await create(); await markPaid(ID); });

  it('counts each visitor once and reports replies to the owner only', async () => {
    for (const visitor of ['v1', 'v1', 'v2']) await viewPost(req('/x', 'POST', { visitor }), ctx());
    await reactionPost(req('/x', 'POST', { visitor: 'v1', reaction: '🥹', message: 'thank you' }), ctx());
    await reactionPost(req('/x', 'POST', { visitor: 'v2', reaction: '🥹' }), ctx());

    expect((await statsGet(req('/x', 'GET'), ctx())).status).toBe(401);
    expect((await statsGet(req('/x', 'GET', undefined, 'a'.repeat(64)), ctx())).status).toBe(403);
    const stats = await (await statsGet(req('/x', 'GET', undefined, KEY), ctx())).json();
    expect(stats.opens).toBe(2);
    expect(stats.reactions).toEqual([{ reaction: '🥹', count: 2 }]);
    expect(stats.replies).toHaveLength(2);
    expect(stats.replies[0].message).toBe('');
  });

  it('rejects empty replies, replies to missing gifts and reply floods', async () => {
    expect((await reactionPost(req('/x', 'POST', { visitor: 'v' }), ctx())).status).toBe(400);
    expect((await reactionPost(req('/x', 'POST', { reaction: '❤️' }), ctx('0'.repeat(24)))).status).toBe(404);
    for (let i = 0; i < 10; i++) await reactionPost(req('/x', 'POST', { visitor: 'spam', reaction: '❤️' }), ctx());
    expect((await reactionPost(req('/x', 'POST', { visitor: 'spam', reaction: '❤️' }), ctx())).status).toBe(429);
  });

  it('truncates long replies to 500 characters', async () => {
    await reactionPost(req('/x', 'POST', { visitor: 'v', message: 'x'.repeat(900) }), ctx());
    expect((fake.tables.gift_replies[0].message as string).length).toBe(500);
  });
});

describe('media uploads', () => {
  it('lets a new gift id receive media, then locks it to the owner', async () => {
    const ok = await mediaPost(req('/x', 'POST', { dataUri: PNG, kind: 'image' }, KEY), ctx());
    expect(ok.status).toBe(200);
    expect((await ok.json()).url).toContain(`/gifts/${ID}/`);

    await create();
    const intruder = await mediaPost(req('/x', 'POST', { dataUri: PNG, kind: 'image' }, 'a'.repeat(64)), ctx());
    expect(intruder.status).toBe(403);
  });

  it('validates kind, payload and key format', async () => {
    expect((await mediaPost(req('/x', 'POST', { dataUri: PNG, kind: 'video' }, KEY), ctx())).status).toBe(400);
    expect((await mediaPost(req('/x', 'POST', { dataUri: 'nope', kind: 'image' }, KEY), ctx())).status).toBe(400);
    expect((await mediaPost(req('/x', 'POST', { dataUri: PNG, kind: 'image' }, 'short'), ctx())).status).toBe(401);
    expect((await mediaPost(req('/x', 'POST', { dataUri: PNG, kind: 'audio' }, KEY), ctx())).status).toBe(415);
  });

  it('caps the number of files per gift', async () => {
    for (let i = 0; i < 12; i++) fake.files.set(`gifts/${ID}/f${i}.png`, { bytes: Buffer.from('x'), contentType: 'image/png', createdAt: new Date().toISOString() });
    expect((await mediaPost(req('/x', 'POST', { dataUri: PNG, kind: 'image' }, KEY), ctx())).status).toBe(409);
  });
});

describe('cleanup cron', () => {
  it('requires the cron secret', async () => {
    expect((await cleanup(req('/x', 'GET'))).status).toBe(401);
    expect((await cleanup(req('/x', 'GET', undefined, 'wrong'))).status).toBe(401);
  });

  it('removes expired gifts and day-old orphaned uploads, keeping fresh ones', async () => {
    await create({ cover: PNG });
    fake.tables.gifts[0].expires_at = new Date(Date.now() - 1000).toISOString();
    const orphan = 'b'.repeat(24);
    const fresh = 'c'.repeat(24);
    const old = new Date(Date.now() - 2 * 86_400_000).toISOString();
    fake.files.set(`gifts/${orphan}/a.png`, { bytes: Buffer.from('x'), contentType: 'image/png', createdAt: old });
    fake.files.set(`gifts/${fresh}/a.png`, { bytes: Buffer.from('x'), contentType: 'image/png', createdAt: new Date().toISOString() });

    const res = await cleanup(req('/x', 'GET', undefined, 'cron-secret'));
    expect(await res.json()).toMatchObject({ ok: true, expired: 1, orphans: 1 });
    expect(fake.tables.gifts).toHaveLength(0);
    expect([...fake.files.keys()]).toEqual([`gifts/${fresh}/a.png`]);
  });
});

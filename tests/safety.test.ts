import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeSupabase } from './fake-supabase';

const fake = new FakeSupabase();
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: () => true,
  supabase: () => fake,
}));

import { POST as createGift } from '@/app/api/gifts/route';
import { GET as readGift } from '@/app/api/gifts/[id]/route';
import { POST as reactionPost } from '@/app/api/gifts/[id]/reactions/route';
import { POST as reportPost } from '@/app/api/gifts/[id]/report/route';
import { POST as takedown } from '@/app/api/admin/takedown/route';
import { GET as listReports } from '@/app/api/admin/reports/route';
import { GET as health } from '@/app/api/health/route';
import { GET as cleanup } from '@/app/api/cron/cleanup/route';
import { findGift } from '@/lib/gifts';

const ID = 'a1b2c3d4e5f6a1b2c3d4e5f6';
const KEY = 'f'.repeat(64);
const ADMIN = 'admin-token-admin-token-1234';
const ctx = (id = ID) => ({ params: Promise.resolve({ id }) });

function req(path: string, method: string, body?: unknown, headers: Record<string, string> = {}) {
  return new Request(`https://luv4u.test${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
const ip = (n: number) => ({ 'x-forwarded-for': `203.0.113.${n}` });
const gift = { name: 'Sarah', occasion: 'love', vibe: 'Romantic', photos: [] };
const create = (id = ID, headers: Record<string, string> = ip(1)) =>
  createGift(req('/api/gifts', 'POST', { id, editKey: KEY, gift }, headers));
const admin = { authorization: `Bearer ${ADMIN}` };

beforeEach(() => {
  fake.tables = {};
  fake.files.clear();
  process.env.RATE_SALT = 'test-salt';
  process.env.CRON_SECRET = 'cron-secret';
  process.env.ADMIN_TOKEN = ADMIN;
});

describe('rate limiting', () => {
  it('stops one address creating gifts in a flood, but not other addresses', async () => {
    for (let i = 0; i < 12; i++) {
      const id = (i.toString(16).padStart(2, '0') + 'b'.repeat(22)).slice(0, 24);
      expect((await create(id)).status).toBe(200);
    }
    expect((await create('c'.repeat(24))).status).toBe(429);
    expect((await create('d'.repeat(24), ip(2))).status).toBe(200);
  });

  it('does not count a retry of a gift that already exists', async () => {
    for (let i = 0; i < 20; i++) expect((await create()).status).toBe(200);
  });

  it('stores only a hash of the address', async () => {
    await create();
    const hits = fake.tables.rate_hits;
    expect(hits).toHaveLength(1);
    expect(JSON.stringify(hits)).not.toContain('203.0.113');
  });

  it('does not limit requests that carry no address (local development)', async () => {
    for (let i = 0; i < 15; i++) {
      const id = (i.toString(16).padStart(2, '0') + 'e'.repeat(22)).slice(0, 24);
      expect((await create(id, {})).status).toBe(200);
    }
  });

  it('limits replies per address', async () => {
    await create();
    let last = 200;
    for (let i = 0; i < 21; i++) last = (await reactionPost(req('/x', 'POST', { reaction: '❤️' }, ip(3)), ctx())).status;
    expect(last).toBe(429);
  });

  it('fails open when the limiter itself breaks', async () => {
    const original = fake.from.bind(fake);
    fake.from = ((table: string) => {
      if (table === 'rate_hits') throw new Error('database blip');
      return original(table);
    }) as typeof fake.from;
    expect((await create()).status).toBe(200);
    fake.from = original;
  });
});

describe('reports and takedown', () => {
  it('records a report with a hashed reporter and no change to the gift', async () => {
    await create();
    const res = await reportPost(req('/x', 'POST', { reason: 'harassment', details: 'unwanted and upsetting' }, ip(9)), ctx());
    expect(res.status).toBe(200);
    expect(fake.tables.gift_reports).toHaveLength(1);
    expect(JSON.stringify(fake.tables.gift_reports)).not.toContain('203.0.113');
    expect((await readGift(req('/x', 'GET'), ctx())).status).toBe(200);
  });

  it('rejects an unknown reason, and says nothing about gifts that do not exist', async () => {
    await create();
    expect((await reportPost(req('/x', 'POST', { reason: 'because' }, ip(9)), ctx())).status).toBe(400);
    const ghost = await reportPost(req('/x', 'POST', { reason: 'spam' }, ip(9)), ctx('9'.repeat(24)));
    expect(ghost.status).toBe(200);
    expect(fake.tables.gift_reports ?? []).toHaveLength(0);
  });

  it('limits reports per address', async () => {
    await create();
    let last = 200;
    for (let i = 0; i < 9; i++) last = (await reportPost(req('/x', 'POST', { reason: 'spam' }, ip(4)), ctx())).status;
    expect(last).toBe(429);
  });

  it('admin endpoints are closed without the right token', async () => {
    await create();
    expect((await takedown(req('/x', 'POST', { id: ID }))).status).toBe(401);
    expect((await takedown(req('/x', 'POST', { id: ID }, { authorization: 'Bearer wrong' }))).status).toBe(401);
    expect((await listReports(req('/x', 'GET'))).status).toBe(401);
    process.env.ADMIN_TOKEN = '';
    expect((await takedown(req('/x', 'POST', { id: ID }, admin))).status).toBe(401);
  });

  it('takedown wipes content and media, answers 410, and closes the reports', async () => {
    await create();
    fake.files.set(`gifts/${ID}/photo.jpg`, { bytes: Buffer.from('x'), contentType: 'image/jpeg', createdAt: new Date().toISOString() });
    await reportPost(req('/x', 'POST', { reason: 'hate' }, ip(9)), ctx());
    expect(((await (await listReports(req('/x', 'GET', undefined, admin))).json()).reports as unknown[]).length).toBe(1);

    const res = await takedown(req('/x', 'POST', { id: ID, reason: 'reviewed report' }, admin));
    expect(res.status).toBe(200);
    expect(fake.files.size).toBe(0);
    expect(fake.tables.gifts[0].gift).toEqual({});
    expect((await readGift(req('/x', 'GET'), ctx())).status).toBe(410);
    expect(await findGift(ID)).toBeNull();
    expect(((await (await listReports(req('/x', 'GET', undefined, admin))).json()).reports as unknown[]).length).toBe(0);
  });

  it('a removed gift link cannot be re-created', async () => {
    await create();
    await takedown(req('/x', 'POST', { id: ID }, admin));
    expect((await create()).status).toBe(409);
  });
});

describe('health and housekeeping', () => {
  it('health answers ok', async () => {
    expect((await health()).status).toBe(200);
  });

  it('cleanup trims old rate-limit hits', async () => {
    fake.tables.rate_hits = [
      { id: 1, bucket: 'create', ip_hash: 'a', at: new Date(Date.now() - 2 * 86_400_000).toISOString() },
      { id: 2, bucket: 'create', ip_hash: 'a', at: new Date().toISOString() },
    ];
    const res = await cleanup(req('/x', 'GET', undefined, { authorization: 'Bearer cron-secret' }));
    expect(res.status).toBe(200);
    expect(fake.tables.rate_hits).toHaveLength(1);
  });
});

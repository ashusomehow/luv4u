import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeSupabase } from './fake-supabase';

const fake = new FakeSupabase();
vi.mock('@/lib/supabase', () => ({ supabase: () => fake, isSupabaseConfigured: () => true }));

import { GET, POST } from '@/app/api/admin/daily/route';

const REPORT = 'r'.repeat(32);
const ADMIN = 'a'.repeat(32);
const req = (path: string, method = 'GET', body?: unknown, token: string | null = REPORT) =>
  new Request(`https://kholona.test${path}`, {
    method,
    headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const day = (d: string, extra: Record<string, unknown> = {}) => ({
  day: d, spend: null, meta_purchases: null, visitors: 0, ad_visitors: 0, makers: 0, gifts_made: 0, unlock_views: 0, pay_clicks: 0,
  checkouts: 0, sales: 0, revenue: '0', ad_sales: 0, ad_revenue: '0', creator_sales: 0, birthday_sales: 0, sorry_sales: 0, free_unlocks: 0, ...extra,
});

beforeEach(() => {
  fake.tables = {}; fake.rpcCalls = []; fake.functions = {};
  process.env.REPORT_TOKEN = REPORT; process.env.ADMIN_TOKEN = ADMIN;
  process.env.SUPABASE_URL = 'https://fake.supabase.co'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
});

describe('daily money report', () => {
  it('is closed without the report key or the admin key', async () => {
    expect((await GET(req('/api/admin/daily', 'GET', undefined, null))).status).toBe(401);
    expect((await GET(req('/api/admin/daily', 'GET', undefined, 'x'.repeat(32)))).status).toBe(401);
    expect((await POST(req('/api/admin/daily', 'POST', { spend: [] }, 'x'.repeat(32)))).status).toBe(401);
    fake.functions.daily_report = () => ({ data: [] });
    expect((await GET(req('/api/admin/daily', 'GET', undefined, ADMIN))).status).toBe(200);
  });

  it('returns one row per day with numbers, as JSON or CSV, and caps the range', async () => {
    fake.functions.daily_report = () => ({ data: [day('2026-11-06', { spend: '812.40', meta_purchases: 1, sales: 2, revenue: '378.00', ad_sales: 1 }), day('2026-11-05')] });
    const data = await (await GET(req('/api/admin/daily?days=9999'))).json();
    expect(fake.rpcCalls[0]).toEqual({ name: 'daily_report', args: { days: 400 } });
    expect(data.rows[0]).toMatchObject({ day: '2026-11-06', spend: 812.4, meta_purchases: 1, sales: 2, revenue: 378, ad_sales: 1 });
    expect(data.rows[1].spend).toBeNull();
    const csv = await (await GET(req('/api/admin/daily?format=csv'))).text();
    expect(csv.split('\n')[0]).toMatch(/^day,spend,meta_purchases,visitors/);
    expect(csv.split('\n')[1]).toMatch(/^2026-11-06,812\.4,1,0/);
  });

  it('says which migration to run when the report is not installed', async () => {
    const res = await GET(req('/api/admin/daily'));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/0010_daily_report/);
  });

  it('saves typed ad spend, updates a day, and a blank removes it', async () => {
    let res = await POST(req('/api/admin/daily', 'POST', { spend: [{ date: '2026-11-05', spend: 640, metaPurchases: 0 }, { date: '2026-11-06', spend: '812.456', note: ' new hook ' }] }));
    expect(await res.json()).toEqual({ ok: true, saved: 2, removed: 0 });
    expect(fake.tables.ad_spend.find((r) => r.day === '2026-11-06')).toMatchObject({ spend: 812.46, meta_purchases: null, note: 'new hook' });
    res = await POST(req('/api/admin/daily', 'POST', { spend: [{ date: '2026-11-05', spend: 700 }, { date: '2026-11-06', spend: null }] }));
    expect(await res.json()).toEqual({ ok: true, saved: 1, removed: 1 });
    expect(fake.tables.ad_spend.map((r) => [r.day, r.spend])).toEqual([['2026-11-05', 700]]);
  });

  it('refuses bad dates, amounts and counts', async () => {
    for (const bad of [{ date: '2026-02-30', spend: 1 }, { date: '05/11/2026', spend: 1 }, { date: '2099-01-01', spend: 1 }, { date: '2026-11-05', spend: -5 }, { date: '2026-11-05', spend: 'abc' }, { date: '2026-11-05', spend: 5, metaPurchases: 1.5 }]) {
      expect((await POST(req('/api/admin/daily', 'POST', { spend: [bad] }))).status).toBe(400);
    }
    expect((await POST(req('/api/admin/daily', 'POST', { nope: 1 }))).status).toBe(400);
    expect(fake.tables.ad_spend ?? []).toHaveLength(0);
  });
});

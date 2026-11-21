import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeSupabase } from './fake-supabase';

const fake = new FakeSupabase();
vi.mock('@/lib/supabase', () => ({ supabase: () => fake, isSupabaseConfigured: () => true }));

import { GET } from '@/app/api/admin/checkout/route';

const REPORT = 'r'.repeat(32);
const req = (path: string, token: string | null = REPORT) =>
  new Request(`https://kholona.test${path}`, { headers: token ? { authorization: `Bearer ${token}` } : {} });

beforeEach(() => {
  fake.tables = {}; fake.rpcCalls = []; fake.functions = {};
  process.env.REPORT_TOKEN = REPORT; process.env.ADMIN_TOKEN = 'a'.repeat(32);
  process.env.SUPABASE_URL = 'https://fake.supabase.co'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
});

describe('checkout report (where buyers stop)', () => {
  it('is closed without the report key', async () => {
    expect((await GET(req('/api/admin/checkout', null))).status).toBe(401);
  });

  it('returns the payment step by browser and phone, the failure reasons and the maker steps, as numbers', async () => {
    fake.functions.checkout_report = () => ({ data: [{ day: '2026-11-20', env: 'inapp', os: 'android', pay_clicks: '19', windows_opened: 18, dismissed: 9, failed: 4, paid_events: 3, browser_taps: 2, browser_arrivals: 1, checkouts: 19, paid: '5' }] });
    fake.functions.payment_failures = () => ({ data: [{ code: 'BAD_REQUEST_ERROR', env: 'inapp', os: 'android', failures: '4' }] });
    fake.functions.creator_steps = () => ({ data: [{ occasion: 'apology', step: 'opened', sessions: '100' }] });
    const data = await (await GET(req('/api/admin/checkout?days=9999'))).json();
    expect(fake.rpcCalls.map((c) => c.name).sort()).toEqual(['checkout_report', 'creator_steps', 'payment_failures']);
    expect(fake.rpcCalls[0].args).toEqual({ days: 400 });
    expect(data.checkout[0]).toEqual({ day: '2026-11-20', env: 'inapp', os: 'android', pay_clicks: 19, windows_opened: 18, dismissed: 9, failed: 4, paid_events: 3, browser_taps: 2, browser_arrivals: 1, checkouts: 19, paid: 5 });
    expect(data.failures[0]).toEqual({ code: 'BAD_REQUEST_ERROR', env: 'inapp', os: 'android', failures: 4 });
    expect(data.steps[0]).toEqual({ occasion: 'apology', step: 'opened', sessions: 100 });
  });

  it('says which migration to run when the report is not installed', async () => {
    const res = await GET(req('/api/admin/checkout'));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/0012_checkout_report/);
  });
});

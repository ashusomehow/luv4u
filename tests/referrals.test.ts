import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeSupabase } from './fake-supabase';

const fake = new FakeSupabase();
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: () => true,
  supabase: () => fake,
}));

import { POST as createGift } from '@/app/api/gifts/route';
import { POST as checkout } from '@/app/api/gifts/[id]/checkout/route';
import { POST as webhook } from '@/app/api/webhooks/razorpay/route';
import { GET as adminGet, POST as adminPost } from '@/app/api/admin/referrals/route';
import { GET as checkCode } from '@/app/api/referral/route';
import { GET as creatorLink } from '@/app/r/[code]/route';
import { classifySales, dueNow, nextTier, rateFor, weekStart, weekStats, type SaleRow } from '@/lib/referrals';
import { createHash, createHmac } from 'node:crypto';

const ADMIN = 'a'.repeat(32);
const KEY = 'f'.repeat(64);
const HOOK = 'hook-secret-not-real';
const ids = ['a1b2c3d4e5f6a1b2c3d4e5f6', 'b1b2c3d4e5f6a1b2c3d4e5f6', 'c1b2c3d4e5f6a1b2c3d4e5f6'];
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const sign = (data: string, secret: string) => createHmac('sha256', secret).update(data).digest('hex');

function req(path: string, method = 'GET', body?: unknown, headers: Record<string, string> = {}) {
  return new Request(`https://kholona.test${path}`, {
    method,
    headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
const admin = (body?: unknown) => (body === undefined ? adminGet(req('/api/admin/referrals', 'GET', undefined, { authorization: `Bearer ${ADMIN}` })) : adminPost(req('/api/admin/referrals', 'POST', body, { authorization: `Bearer ${ADMIN}` })));
const addCreator = (code = 'PRIYA', extra: Record<string, unknown> = {}) => admin({ action: 'create', code, name: 'Priya S', phone: '+91 98765 43210', ...extra });
const makeGift = (id: string) => createGift(req('/api/gifts', 'POST', { id, editKey: KEY, gift: { name: 'Sam', occasion: 'birthday', photos: [] } }));
const startCheckout = (id: string, body?: unknown, cookie?: string) =>
  checkout(req('/x', 'POST', body, { authorization: `Bearer ${KEY}`, ...(cookie ? { cookie } : {}) }), ctx(id));

/* A tiny stand-in for Razorpay's orders API. */
const orders = new Map<string, { id: string; amount: number; currency: string }>();
function installRazorpay() {
  vi.stubGlobal('fetch', async (url: string, init: RequestInit = {}) => {
    const path = new URL(url).pathname;
    if (init.method === 'POST' && path === '/v1/orders') {
      const body = JSON.parse(String(init.body));
      const order = { id: `order_R${orders.size + 1}test`, amount: body.amount, currency: body.currency, status: 'created' };
      orders.set(order.id, order);
      return new Response(JSON.stringify(order));
    }
    if (/\/payments$/.test(path)) return new Response(JSON.stringify({ items: [] }));
    return new Response(JSON.stringify({ error: { description: 'unhandled' } }), { status: 404 });
  });
}
const captured = (orderId: string, amount: number, contact = '+919000000001') => {
  const raw = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: `pay_${orderId.slice(6)}`, order_id: orderId, amount, currency: 'INR', status: 'captured', contact } } } });
  return webhook(new Request('https://kholona.test/api/webhooks/razorpay', { method: 'POST', headers: { 'x-razorpay-signature': sign(raw, HOOK) }, body: raw }));
};

beforeEach(() => {
  fake.tables = {};
  orders.clear();
  Object.assign(process.env, {
    ADMIN_TOKEN: ADMIN,
    RATE_SALT: 'test-salt',
    RAZORPAY_KEY_ID: 'rzp_test_unit',
    RAZORPAY_KEY_SECRET: 'unit-secret-not-real',
    RAZORPAY_WEBHOOK_SECRET: HOOK,
    RAZORPAY_API_BASE: 'https://rzp.test',
  });
  delete process.env.REFERRAL_DISCOUNT_INR;
  installRazorpay();
});
afterEach(() => {
  vi.unstubAllGlobals();
  for (const k of ['ADMIN_TOKEN', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET', 'RAZORPAY_API_BASE']) delete process.env[k];
});

describe('commission rules', () => {
  it('pays 20% for 1-9 sales, 30% from 10, 50% from 20, on every sale of the week', () => {
    expect([0, 1, 9, 10, 19, 20, 45].map(rateFor)).toEqual([0, 20, 20, 30, 30, 50, 50]);
    expect(nextTier(0)).toEqual({ needed: 1, rate: 20 });
    expect(nextTier(7)).toEqual({ needed: 3, rate: 30 });
    expect(nextTier(12)).toEqual({ needed: 8, rate: 50 });
    expect(nextTier(25)).toBeNull();
  });

  it('weeks run Monday to Sunday in India time', () => {
    expect(weekStart('2026-10-12T00:00:00+05:30')).toBe('2026-10-12'); // Monday, just after midnight IST
    expect(weekStart('2026-10-11T23:59:00+05:30')).toBe('2026-10-05'); // Sunday night IST belongs to the week before
    expect(weekStart('2026-10-11T19:00:00Z')).toBe('2026-10-12'); // 00:30 Monday in India, still Sunday in UTC
  });

  it('works out the amount on what buyers paid, and rolls small amounts over', () => {
    const sale = (i: number, at = '2026-10-06T10:00:00Z'): SaleRow => ({ order_id: `order_${i}xxxxxx`, ref_code: 'PRIYA', amount: 16900, discount: 3000, paid_at: at, buyer_phone_hash: `p${i}`, buyer_email_hash: null, ref_excluded: false });
    const ten = classifySales(Array.from({ length: 10 }, (_, i) => sale(i)), undefined);
    const week = weekStats('2026-10-05', ten, 0, 0, null, new Date('2026-10-14T00:00:00Z'));
    expect(week).toMatchObject({ sales: 10, revenue: 169000, rate: 30, amount: 50700, over: true });
    const small = weekStats('2026-10-05', classifySales([sale(1)], undefined), 0, 0, null, new Date('2026-10-14T00:00:00Z'));
    expect(small.amount).toBe(3400); // 20% of ₹169, to the nearest rupee
    expect(dueNow([small])).toEqual({ amount: 3400, weeks: ['2026-10-05'], payable: false });
  });

  it('never counts the creator’s own purchase, and flags a buyer buying again the same week', () => {
    const own = { phone: '9876543210', email: null };
    const rows: SaleRow[] = [
      { order_id: 'order_1aaaaaa', ref_code: 'PRIYA', amount: 16900, discount: 3000, paid_at: '2026-10-06T10:00:00Z', buyer_phone_hash: null, buyer_email_hash: null, ref_excluded: false },
      { order_id: 'order_2aaaaaa', ref_code: 'PRIYA', amount: 16900, discount: 3000, paid_at: '2026-10-06T11:00:00Z', buyer_phone_hash: 'x', buyer_email_hash: null, ref_excluded: false },
      { order_id: 'order_3aaaaaa', ref_code: 'PRIYA', amount: 16900, discount: 3000, paid_at: '2026-10-06T12:00:00Z', buyer_phone_hash: 'x', buyer_email_hash: null, ref_excluded: false },
    ];
    // The creator's phone, hashed the way buyer phones are.
    rows[0].buyer_phone_hash = createHash('sha256').update('919876543210').digest('hex');
    const sales = classifySales(rows, own);
    expect(sales.map((s) => [s.flag, s.counts])).toEqual([['self', false], [null, true], ['repeat', true]]);
  });
});

describe('creator links and codes', () => {
  it('a creator link remembers the code, counts the click and opens the gift maker', async () => {
    await addCreator();
    const res = await creatorLink(req('/r/priya?to=proposal', 'GET', undefined, { 'user-agent': 'Mozilla/5.0 (Linux; Android 14)' }), { params: Promise.resolve({ code: 'priya' }) });
    expect(res.status).toBe(302);
    const to = new URL(res.headers.get('location')!);
    expect(to.pathname).toBe('/for/romantic-proposal');
    expect(to.searchParams.get('ref')).toBe('PRIYA');
    expect(to.searchParams.get('utm_campaign')).toBe('PRIYA');
    expect(res.headers.get('set-cookie')).toMatch(/kholona_ref=PRIYA/);
    expect(fake.tables.referral_clicks).toHaveLength(1);

    // Link previews are not clicks.
    await creatorLink(req('/r/PRIYA', 'GET', undefined, { 'user-agent': 'WhatsApp/2.23' }), { params: Promise.resolve({ code: 'PRIYA' }) });
    expect(fake.tables.referral_clicks).toHaveLength(1);
  });

  it('an unknown or paused code opens the home page with no discount', async () => {
    const res = await creatorLink(req('/r/NOBODY'), { params: Promise.resolve({ code: 'NOBODY' }) });
    expect(new URL(res.headers.get('location')!).pathname).toBe('/');
    expect(res.headers.get('set-cookie')).toBeNull();
    await addCreator();
    await admin({ action: 'update', code: 'PRIYA', active: false });
    expect((await checkCode(req('/api/referral?code=priya'))).status).toBe(404);
  });

  it('checks a typed code and tells only the discount', async () => {
    await addCreator();
    const res = await checkCode(req('/api/referral?code=priya'));
    expect(await res.json()).toEqual({ ok: true, code: 'PRIYA', discountInr: 30, priceInr: 169 });
  });
});

describe('checkout with a creator code', () => {
  it('charges ₹169 with a code from the link cookie or the page, ₹199 when the buyer removed it', async () => {
    await addCreator();
    for (const id of ids) await makeGift(id);

    const viaCookie = await (await startCheckout(ids[0], undefined, 'kholona_ref=PRIYA')).json();
    expect(viaCookie.order.amount).toBe(16900);
    expect(viaCookie.referral).toEqual({ code: 'PRIYA', discountInr: 30 });

    const typed = await (await startCheckout(ids[1], { ref: 'priya' })).json();
    expect(typed.order.amount).toBe(16900);

    const removed = await (await startCheckout(ids[2], { ref: '' }, 'kholona_ref=PRIYA')).json();
    expect(removed.order.amount).toBe(19900);
    expect(removed.referral).toBeNull();

    const rows = fake.tables.payments;
    expect(rows.map((r) => [r.ref_code ?? null, r.discount ?? 0])).toEqual([['PRIYA', 3000], ['PRIYA', 3000], [null, 0]]);
  });

  it('a bogus code is ignored: full price, nothing credited', async () => {
    await makeGift(ids[0]);
    const res = await (await startCheckout(ids[0], { ref: 'FAKECODE' })).json();
    expect(res.order.amount).toBe(19900);
    expect(fake.tables.payments[0].ref_code).toBeUndefined();
  });

  it('switching code opens a new order credited to the right creator', async () => {
    await addCreator('PRIYA');
    await addCreator('RAHUL', { phone: '9000000002' });
    await makeGift(ids[0]);
    const a = await (await startCheckout(ids[0], { ref: 'PRIYA' })).json();
    const b = await (await startCheckout(ids[0], { ref: 'RAHUL' })).json();
    expect(a.order.id).not.toBe(b.order.id);
    const again = await (await startCheckout(ids[0], { ref: 'RAHUL' })).json();
    expect(again.order.id).toBe(b.order.id);
  });

  it('a paid referred sale shows in the tracker, and the creator can be paid once the week is over', async () => {
    await addCreator();
    await makeGift(ids[0]);
    const { order } = await (await startCheckout(ids[0], { ref: 'PRIYA' })).json();
    expect((await captured(order.id, order.amount)).status).toBe(200);
    const row = fake.tables.payments[0];
    expect(row.status).toBe('paid');
    expect(row.buyer_phone_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(row)).not.toContain('9000000001');

    let report = await (await admin()).json();
    const [creator] = report.creators;
    expect(creator.weeks[0]).toMatchObject({ sales: 1, revenue: 16900, rate: 20, amount: 3400 });
    expect(creator.referrer.stats_key).toMatch(/^[\w-]{20,}$/);
    expect(creator.due.amount).toBe(0); // the week is still running

    // Pretend the sale was last week: it becomes due (and rolls over, being under ₹100), and can be paid.
    row.paid_at = new Date(Date.now() - 8 * 86400000).toISOString();
    report = await (await admin()).json();
    expect(report.creators[0].due).toMatchObject({ amount: 3400, payable: false });
    expect((await admin({ action: 'paid', code: 'PRIYA', reference: '' })).status).toBe(400);
    expect((await admin({ action: 'paid', code: 'PRIYA', reference: 'UTR123' })).status).toBe(200);
    report = await (await admin()).json();
    expect(report.creators[0].due.amount).toBe(0);
    expect(fake.tables.referral_payouts[0]).toMatchObject({ code: 'PRIYA', amount: 3400, reference: 'UTR123' });
    expect((await admin({ action: 'paid', code: 'PRIYA', reference: 'UTR124' })).status).toBe(409);
  });

  it('a left-out sale stops counting', async () => {
    await addCreator();
    await makeGift(ids[0]);
    const { order } = await (await startCheckout(ids[0], { ref: 'PRIYA' })).json();
    await captured(order.id, order.amount);
    await admin({ action: 'exclude', order_id: order.id, excluded: true });
    const report = await (await admin()).json();
    expect(report.creators[0].weeks[0].sales).toBe(0);
  });
});

describe('free codes (100% off, for testing and gifting)', () => {
  const addFree = (code: string, max_uses: number | null = null, active = true) =>
    (fake.tables.free_codes ??= []).push({ code, note: 'test', max_uses, uses: 0, active });

  it('the code box answers "free" for a free code, and nothing for a paused one', async () => {
    addFree('KHOLONAGIFTTEST1');
    addFree('PAUSEDFREECODE1', null, false);
    expect(await (await checkCode(req('/api/referral?code=kholonagifttest1'))).json()).toEqual({ ok: true, code: 'KHOLONAGIFTTEST1', discountInr: 199, priceInr: 0, free: true });
    expect((await checkCode(req('/api/referral?code=PAUSEDFREECODE1'))).status).toBe(404);
  });

  it('unlocks the gift with no order, no charge and no creator credit, and logs the use', async () => {
    addFree('KHOLONAGIFTTEST1');
    await makeGift(ids[0]);
    const res = await (await startCheckout(ids[0], { ref: 'kholonagifttest1' }, 'kholona_ref=PRIYA')).json();
    expect(res).toEqual({ ok: true, status: 'paid', free: true });
    expect(fake.tables.gifts[0].status).toBe('paid');
    expect(fake.tables.payments ?? []).toEqual([]);
    expect(orders.size).toBe(0);
    expect(fake.tables.free_codes[0].uses).toBe(1);
    expect(fake.tables.free_code_uses.map((r) => [r.code, r.gift_id])).toEqual([['KHOLONAGIFTTEST1', ids[0]]]);
  });

  it('a code with one use unlocks one gift; the next buyer pays as usual', async () => {
    addFree('ONEUSEFREECODE1', 1);
    await makeGift(ids[0]);
    await makeGift(ids[1]);
    expect((await (await startCheckout(ids[0], { ref: 'ONEUSEFREECODE1' })).json()).status).toBe('paid');
    const second = await (await startCheckout(ids[1], { ref: 'ONEUSEFREECODE1' })).json();
    expect(second.status).toBe('pending');
    expect(second.order.amount).toBe(19900);
    expect((await checkCode(req('/api/referral?code=ONEUSEFREECODE1'))).status).toBe(404);
  });

  it('never unlocks two gifts with the last use, even at the same moment', async () => {
    addFree('ONEUSEFREECODE1', 1);
    const { redeemFreeCode } = await import('@/lib/free-codes');
    const results = await Promise.all([redeemFreeCode('ONEUSEFREECODE1', ids[0]), redeemFreeCode('ONEUSEFREECODE1', ids[1])]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(fake.tables.free_codes[0].uses).toBe(1);
  });
});

describe('admin', () => {
  it('needs the admin token', async () => {
    expect((await adminGet(req('/api/admin/referrals'))).status).toBe(401);
    expect((await adminPost(req('/api/admin/referrals', 'POST', { action: 'create', code: 'X1Y', name: 'x' }, { authorization: 'Bearer wrong' }))).status).toBe(401);
  });

  it('rejects bad codes and missing names', async () => {
    expect((await admin({ action: 'create', code: 'a b', name: 'x' })).status).toBe(400);
    expect((await admin({ action: 'create', code: 'GOOD', name: '' })).status).toBe(400);
  });
});

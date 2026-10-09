import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeSupabase } from './fake-supabase';

const fake = new FakeSupabase();
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: () => true,
  supabase: () => fake,
}));

import { GET as getConfig } from '@/app/api/config/route';
import { POST as createGift } from '@/app/api/gifts/route';
import { GET as readGift } from '@/app/api/gifts/[id]/route';
import { POST as checkout } from '@/app/api/gifts/[id]/checkout/route';
import { POST as verify } from '@/app/api/gifts/[id]/verify/route';
import { POST as webhook } from '@/app/api/webhooks/razorpay/route';

const ID = 'a1b2c3d4e5f6a1b2c3d4e5f6';
const ID2 = 'b1b2c3d4e5f6a1b2c3d4e5f6';
const KEY = 'f'.repeat(64);
const KEY_ID = 'rzp_test_unit';
const SECRET = 'unit-secret-not-real';
const HOOK = 'hook-secret-not-real';
const ctx = (id = ID) => ({ params: Promise.resolve({ id }) });

function req(path: string, method: string, body?: unknown, key?: string) {
  return new Request(`https://kholona.test${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(key ? { authorization: `Bearer ${key}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
const sign = (data: string, secret: string) => createHmac('sha256', secret).update(data).digest('hex');
const gift = { name: 'Sarah', occasion: 'love', vibe: 'Romantic', photos: [] };
const create = (id = ID, key = KEY) => createGift(req('/api/gifts', 'POST', { id, editKey: key, gift }));
const start = (id = ID, key: string | null = KEY) => checkout(req('/x', 'POST', undefined, key ?? undefined), ctx(id));
const isPublic = async (id = ID) => (await readGift(req('/x', 'GET'), ctx(id))).status === 200;

/* A stand-in for api.razorpay.com that remembers orders and payments. */
interface P { id: string; order_id: string; amount: number; currency: string; status: string }
const rzp = {
  orders: new Map<string, { id: string; amount: number; currency: string; status: string }>(),
  payments: new Map<string, P>(),
  calls: [] as string[],
  lastOrderBody: '',
  seq: 0,
  down: false,
};
function installRazorpay() {
  vi.stubGlobal('fetch', async (url: string, init: RequestInit = {}) => {
    const path = new URL(url).pathname;
    const method = init.method ?? 'GET';
    rzp.calls.push(`${method} ${path}`);
    if (rzp.down) throw new Error('network down');
    const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
    const expected = 'Basic ' + Buffer.from(`${KEY_ID}:${SECRET}`).toString('base64');
    if ((init.headers as Record<string, string>).Authorization !== expected) return reply({ error: { code: 'BAD_REQUEST_ERROR', description: 'Authentication failed' } }, 401);
    let m: RegExpExecArray | null;
    if (method === 'POST' && path === '/v1/orders') {
      rzp.lastOrderBody = String(init.body);
      const body = JSON.parse(String(init.body));
      const order = { id: `order_T${++rzp.seq}test`, amount: body.amount, currency: body.currency, status: 'created' };
      rzp.orders.set(order.id, order);
      return reply(order);
    }
    if ((m = /^\/v1\/orders\/([^/]+)\/payments$/.exec(path))) return reply({ items: [...rzp.payments.values()].filter((p) => p.order_id === m![1]) });
    if ((m = /^\/v1\/payments\/([^/]+)\/capture$/.exec(path))) {
      const p = rzp.payments.get(m[1]);
      if (!p) return reply({ error: { description: 'not found' } }, 404);
      p.status = 'captured';
      return reply(p);
    }
    if ((m = /^\/v1\/payments\/([^/]+)$/.exec(path))) {
      const p = rzp.payments.get(m[1]);
      return p ? reply(p) : reply({ error: { description: 'not found' } }, 404);
    }
    return reply({ error: { description: 'unhandled' } }, 404);
  });
}
/** The customer pays an order: returns what Razorpay Checkout would hand the browser. */
function pay(orderId: string, status = 'captured', amount?: number) {
  const order = rzp.orders.get(orderId)!;
  const id = `pay_T${++rzp.seq}test`;
  rzp.payments.set(id, { id, order_id: orderId, amount: amount ?? order.amount, currency: order.currency, status });
  return { razorpay_order_id: orderId, razorpay_payment_id: id, razorpay_signature: sign(`${orderId}|${id}`, SECRET) };
}
const confirm = (body: unknown, id = ID, key: string | null = KEY) => verify(req('/x', 'POST', body, key ?? undefined), ctx(id));
const hook = (event: unknown, secret = HOOK) => {
  const raw = JSON.stringify(event);
  return webhook(new Request('https://kholona.test/api/webhooks/razorpay', { method: 'POST', headers: { 'x-razorpay-signature': sign(raw, secret) }, body: raw }));
};
const capturedEvent = (p: P, name = 'payment.captured') => ({ event: name, payload: { payment: { entity: p }, order: { entity: { id: p.order_id } } } });
const openOrder = async (id = ID, key = KEY) => (await (await start(id, key)).json()).order.id as string;

beforeEach(() => {
  fake.tables = {};
  fake.files.clear();
  Object.assign(process.env, {
    RATE_SALT: 'test-salt',
    RAZORPAY_KEY_ID: KEY_ID,
    RAZORPAY_KEY_SECRET: SECRET,
    RAZORPAY_WEBHOOK_SECRET: HOOK,
    RAZORPAY_API_BASE: 'https://rzp.test',
  });
  delete process.env.PAYMENT_PRICE_INR;
  delete process.env.PAYMENT_SIMULATE;
  rzp.orders.clear();
  rzp.payments.clear();
  rzp.calls.length = 0;
  rzp.lastOrderBody = '';
  rzp.seq = 0;
  rzp.down = false;
  installRazorpay();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  for (const k of ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET', 'RAZORPAY_API_BASE', 'PAYMENT_PRICE_INR', 'PAYMENT_SIMULATE']) delete process.env[k];
});

describe('config', () => {
  it('announces Razorpay and test mode, without any secret', async () => {
    const res = await getConfig();
    const text = JSON.stringify(await res.json());
    expect(JSON.parse(text).payments).toEqual({ required: true, priceInr: 199, linkDays: 365, provider: 'razorpay', testMode: true });
    expect(text).not.toContain(SECRET);
    expect(text).not.toContain(KEY_ID);
  });

  it('shares a few real reviews for the unlock page, best rated first, one per occasion, none too long', async () => {
    const reviews = (await (await getConfig()).json()).reviews;
    expect(reviews.count).toBeGreaterThanOrEqual(5);
    expect(Number(reviews.average)).toBeGreaterThan(0);
    expect(reviews.quotes.length).toBeGreaterThan(1);
    expect(reviews.quotes.length).toBeLessThanOrEqual(6);
    expect(new Set(reviews.quotes.map((q: { occasion: string }) => q.occasion)).size).toBe(reviews.quotes.length);
    for (const q of reviews.quotes) expect(q.quote.length).toBeLessThanOrEqual(320);
    const ratings = reviews.quotes.map((q: { rating: number }) => q.rating);
    expect(ratings).toEqual([...ratings].sort((a: number, b: number) => b - a));
  });

  it('says live mode for live keys, and prefers Razorpay over test-mode simulation', async () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_live_unit';
    process.env.PAYMENT_SIMULATE = 'true';
    const payments = (await (await getConfig()).json()).payments;
    expect(payments.testMode).toBe(false);
    expect(payments.simulated).toBeUndefined();
  });

  it('shows no provider when Razorpay is not configured', async () => {
    delete process.env.RAZORPAY_KEY_SECRET;
    expect((await (await getConfig()).json()).payments).toEqual({ required: true, priceInr: 199, linkDays: 365 });
  });
});

describe('starting a payment', () => {
  it('needs the owner key', async () => {
    await create();
    expect((await start(ID, null)).status).toBe(401);
    expect((await start(ID, 'a'.repeat(64))).status).toBe(403);
    expect(rzp.orders.size).toBe(0);
  });

  it('creates an order at the server price, with no personal details sent to Razorpay', async () => {
    await create();
    const res = await start();
    const text = await res.text();
    const data = JSON.parse(text);
    expect(res.status).toBe(200);
    expect(data).toMatchObject({ ok: true, status: 'pending', keyId: KEY_ID, testMode: true, order: { amount: 19900, currency: 'INR' } });
    expect(text).not.toContain(SECRET);
    expect(JSON.parse(rzp.lastOrderBody)).toEqual({ amount: 19900, currency: 'INR', receipt: `k_${ID}`, notes: { gift_id: ID } });
    expect(rzp.lastOrderBody).not.toContain('Sarah');
    expect(fake.tables.payments).toHaveLength(1);
    expect(fake.tables.payments[0]).toMatchObject({ gift_id: ID, amount: 19900, status: 'created' });
    expect(await isPublic()).toBe(false);
  });

  it('follows PAYMENT_PRICE_INR, and ignores any amount the browser sends', async () => {
    process.env.PAYMENT_PRICE_INR = '149';
    await create();
    const res = await checkout(req('/x', 'POST', { amount: 1, price: 1 }, KEY), ctx());
    expect((await res.json()).order.amount).toBe(14900);
  });

  it('reuses the open order instead of piling up new ones, and makes a new one if the price changed', async () => {
    await create();
    const first = await openOrder();
    expect(await openOrder()).toBe(first);
    expect(rzp.orders.size).toBe(1);
    process.env.PAYMENT_PRICE_INR = '149';
    expect(await openOrder()).not.toBe(first);
    expect(rzp.orders.size).toBe(2);
  });

  it('answers 502 and records nothing when Razorpay is unreachable, without leaking the secret into logs', async () => {
    const logs = vi.spyOn(console, 'error').mockImplementation(() => {});
    await create();
    rzp.down = true;
    const res = await start();
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/Nothing was charged/);
    expect(fake.tables.payments ?? []).toHaveLength(0);
    expect(JSON.stringify(logs.mock.calls)).not.toContain(SECRET);
  });

  it('still says "not set up" when there is no provider and no test mode', async () => {
    delete process.env.RAZORPAY_KEY_ID;
    await create();
    expect((await start()).status).toBe(503);
  });

  it('uses the real provider, not the free test-mode unlock, when both are set', async () => {
    process.env.PAYMENT_SIMULATE = 'true';
    await create();
    expect((await (await start()).json()).status).toBe('pending');
    expect(await isPublic()).toBe(false);
  });
});

describe('confirming a payment in the browser', () => {
  it('unlocks the gift, records the payment, and is safe to repeat', async () => {
    await create();
    const body = pay(await openOrder());
    const res = await confirm(body);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, status: 'paid', paymentId: body.razorpay_payment_id });
    expect(await isPublic()).toBe(true);
    expect(fake.tables.payments[0]).toMatchObject({ status: 'paid', payment_id: body.razorpay_payment_id });
    expect((await confirm(body)).status).toBe(200);
    expect(fake.tables.payments).toHaveLength(1);
  });

  it('rejects a wrong signature and leaves the gift locked', async () => {
    await create();
    const body = pay(await openOrder());
    const res = await confirm({ ...body, razorpay_signature: sign('forged', SECRET) });
    expect(res.status).toBe(400);
    expect(await isPublic()).toBe(false);
    expect(fake.tables.payments[0].status).toBe('created');
  });

  it('rejects a signature made with the wrong secret', async () => {
    await create();
    const body = pay(await openOrder());
    const forged = sign(`${body.razorpay_order_id}|${body.razorpay_payment_id}`, 'someone-elses-secret');
    expect((await confirm({ ...body, razorpay_signature: forged })).status).toBe(400);
    expect(await isPublic()).toBe(false);
  });

  it('rejects junk, unknown orders and another gift’s order', async () => {
    await create();
    await create(ID2, 'e'.repeat(64));
    const mine = pay(await openOrder());
    expect((await confirm({})).status).toBe(400);
    expect((await confirm({ ...mine, razorpay_order_id: 'order_doesnotexist' })).status).toBe(400);
    // a perfectly valid payment, but for the other gift's order, cannot unlock this one
    const theirs = pay(await openOrder(ID2, 'e'.repeat(64)));
    expect((await confirm(theirs)).status).toBe(400);
    expect(await isPublic(ID)).toBe(false);
    expect(await isPublic(ID2)).toBe(false);
  });

  it('needs the owner key', async () => {
    await create();
    const body = pay(await openOrder());
    expect((await confirm(body, ID, null)).status).toBe(401);
    expect((await confirm(body, ID, 'a'.repeat(64))).status).toBe(403);
  });

  it('does not unlock a payment that failed or is still pending', async () => {
    await create();
    expect((await confirm(pay(await openOrder(), 'failed'))).status).toBe(402);
    expect((await confirm(pay(await openOrder(), 'created'))).status).toBe(402);
    expect(await isPublic()).toBe(false);
  });

  it('captures an authorized payment before unlocking', async () => {
    await create();
    const body = pay(await openOrder(), 'authorized');
    expect((await confirm(body)).status).toBe(200);
    expect(rzp.calls).toContain(`POST /v1/payments/${body.razorpay_payment_id}/capture`);
    expect(await isPublic()).toBe(true);
  });

  it('does not unlock when the paid amount is not the order amount', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await create();
    expect((await confirm(pay(await openOrder(), 'captured', 100))).status).toBe(402);
    expect(await isPublic()).toBe(false);
    expect(warn).toHaveBeenCalled();
  });
});

describe('the webhook', () => {
  it('is off without a secret, and refuses a bad signature', async () => {
    await create();
    const p = pay(await openOrder());
    const event = capturedEvent(rzp.payments.get(p.razorpay_payment_id)!);
    expect((await hook(event, 'wrong-secret')).status).toBe(400);
    expect(await isPublic()).toBe(false);
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    expect((await hook(event)).status).toBe(503);
  });

  it('unlocks the gift when the browser never came back, and is idempotent', async () => {
    await create();
    const p = rzp.payments.get(pay(await openOrder()).razorpay_payment_id)!;
    expect((await hook(capturedEvent(p))).status).toBe(200);
    expect(await isPublic()).toBe(true);
    expect(fake.tables.payments[0]).toMatchObject({ status: 'paid', payment_id: p.id });
    expect((await hook(capturedEvent(p))).status).toBe(200); // Razorpay retries
    expect((await hook(capturedEvent(p, 'order.paid'))).status).toBe(200);
    expect(fake.tables.payments).toHaveLength(1);
  });

  it('acknowledges and ignores events it does not act on', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await create();
    const orderId = await openOrder();
    const p = rzp.payments.get(pay(orderId).razorpay_payment_id)!;
    expect((await (await hook(capturedEvent(p, 'payment.failed'))).json()).ignored).toBe(true);
    expect((await (await hook(capturedEvent({ ...p, order_id: 'order_unknownzzz' }))).json()).ignored).toBe(true);
    expect((await (await hook(capturedEvent({ ...p, amount: 100 }))).json()).ignored).toBe(true);
    expect((await (await hook(capturedEvent({ ...p, status: 'authorized' }))).json()).ignored).toBe(true);
    expect(await isPublic()).toBe(false);
    expect(warn).toHaveBeenCalled();
  });

  it('rejects a body that is not JSON even with a valid signature', async () => {
    const raw = 'not json';
    const res = await webhook(new Request('https://kholona.test/api/webhooks/razorpay', { method: 'POST', headers: { 'x-razorpay-signature': sign(raw, HOOK) }, body: raw }));
    expect(res.status).toBe(400);
  });
});

describe('payments that happen while the page is away', () => {
  it('unlocks on the next "Unlock" press if Razorpay already has the money', async () => {
    await create();
    const orderId = await openOrder();
    pay(orderId); // paid in another tab, or the browser died before reporting back
    const res = await start();
    expect((await res.json()).status).toBe('paid');
    expect(await isPublic()).toBe(true);
    expect(fake.tables.payments[0].status).toBe('paid');
  });

  it('does not unlock if no payment went through', async () => {
    await create();
    await openOrder();
    pay([...rzp.orders.keys()][0], 'failed');
    expect((await (await start()).json()).status).toBe('pending');
    expect(await isPublic()).toBe(false);
  });

  it('flags a second payment for the same gift so it can be refunded', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await create();
    const first = await openOrder();
    process.env.PAYMENT_PRICE_INR = '149'; // a second order for the same gift
    const second = await openOrder();
    expect(second).not.toBe(first);
    expect((await confirm(pay(first))).status).toBe(200);
    const late = rzp.payments.get(pay(second).razorpay_payment_id)!;
    expect((await hook(capturedEvent(late))).status).toBe(200);
    expect(fake.tables.payments.filter((r) => r.status === 'paid')).toHaveLength(2);
    expect(warn.mock.calls.some((c) => String(c[0]).includes('Duplicate payment'))).toBe(true);
  });

  it('shouts when money arrives for a gift that has been deleted', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    await create();
    const orderId = await openOrder();
    const p = rzp.payments.get(pay(orderId).razorpay_payment_id)!;
    fake.tables.gifts = [];
    expect((await hook(capturedEvent(p))).status).toBe(200);
    expect(err.mock.calls.some((c) => String(c[0]).includes('refund needed'))).toBe(true);
    expect(fake.tables.payments[0].status).toBe('paid');
  });
});

/* ----------------------------------------------------- Meta (ads) conversions */

import { hashEmail, hashPhone, readAttribution, settleMeta } from '@/lib/meta';

const PIXEL = '123456789012345';
const FBC = 'fb.1.1700000000000.IwAR0abcdef123456';
const FBP = 'fb.1.1700000000000.1234567890';
const ATTR = Buffer.from(JSON.stringify({ s: 'meta', m: 'paid', c: 'diwali', n: 'reel1' })).toString('base64url');
const cookie = `_fbc=${FBC}; _fbp=${FBP}; kholona_attr=${ATTR}`;

describe('Meta conversions', () => {
  const sent: { url: string; body: Record<string, any> }[] = [];
  let graphDown = false;
  const adReq = (path: string, body?: unknown, extra: Record<string, string> = {}) =>
    new Request(`https://kholona.test${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}`, cookie, 'x-forwarded-for': '203.0.113.9', 'user-agent': 'Mozilla/5.0 Instagram', ...extra },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  const startAd = (extra: Record<string, string> = {}) => checkout(adReq('/x', undefined, extra), ctx());

  beforeEach(() => {
    sent.length = 0;
    graphDown = false;
    Object.assign(process.env, { NEXT_PUBLIC_META_PIXEL_ID: PIXEL, META_CAPI_TOKEN: 'capi-token-not-real-0123456789', META_GRAPH_BASE: 'https://graph.test' });
    delete process.env.META_TEST_EVENT_CODE;
    const razorpayFetch = globalThis.fetch;
    vi.stubGlobal('fetch', async (url: string, init: RequestInit = {}) => {
      if (String(url).startsWith('https://graph.test')) {
        if (graphDown) throw new Error('meta down');
        sent.push({ url: String(url), body: JSON.parse(String(init.body)) });
        return new Response('{"events_received":1}', { status: 200 });
      }
      return razorpayFetch(url, init);
    });
  });
  afterEach(() => {
    for (const k of ['NEXT_PUBLIC_META_PIXEL_ID', 'META_CAPI_TOKEN', 'META_GRAPH_BASE', 'META_TEST_EVENT_CODE']) delete process.env[k];
  });

  it('hashes email and phone the way Meta wants, and drops what is not valid', () => {
    expect(hashEmail('  Sarah@Example.COM ')).toBe(hashEmail('sarah@example.com'));
    expect(hashEmail('not an email')).toBeUndefined();
    expect(hashPhone('+91 98765 43210')).toBe(hashPhone('9876543210'));
    expect(hashPhone('12')).toBeUndefined();
  });

  it('reads only well-formed ad cookies and nothing when the visitor opted out', () => {
    const ok = readAttribution(adReq('/x'));
    expect(ok).toMatchObject({ fbc: FBC, fbp: FBP, utm_source: 'meta', utm_medium: 'paid', utm_campaign: 'diwali', utm_content: 'reel1', ip: '203.0.113.9' });
    const junk = readAttribution(new Request('https://kholona.test/x', { headers: { cookie: '_fbc=<script>; _fbp=nope; kholona_attr=%%%', 'user-agent': 'Mozilla/5.0', 'x-forwarded-for': '203.0.113.9' } }));
    expect(junk).toEqual({ ip: '203.0.113.9', ua: 'Mozilla/5.0', url: expect.stringMatching(/^https?:\/\//) }); // bad cookies are dropped, connection details kept
    delete process.env.META_CAPI_TOKEN;
    expect(readAttribution(adReq('/x'))).toBeNull(); // nothing is read while ad measurement is off
    process.env.META_CAPI_TOKEN = 'capi-token-not-real-0123456789';
    expect(readAttribution(adReq('/x', undefined, { dnt: '1' }))).toBeNull();
    expect(readAttribution(adReq('/x', undefined, { 'sec-gpc': '1' }))).toBeNull();
  });

  it('records the click on the order, sends InitiateCheckout once, and gives the browser the same id', async () => {
    await create();
    const first = await (await startAd()).json();
    await settleMeta();
    expect(first.meta).toEqual({ event: 'InitiateCheckout', id: `ic_${first.order.id}`, value: 199, currency: 'INR' });
    expect(fake.tables.payments[0].attribution).toMatchObject({ fbc: FBC, fbp: FBP, utm_campaign: 'diwali' });
    expect(sent).toHaveLength(1);
    const ev = sent[0].body.data[0];
    expect(sent[0].url).toBe(`https://graph.test/v21.0/${PIXEL}/events`);
    expect(ev).toMatchObject({ event_name: 'InitiateCheckout', event_id: first.meta.id, action_source: 'website' });
    expect(ev.user_data).toMatchObject({ fbc: FBC, fbp: FBP, client_ip_address: '203.0.113.9' });
    expect(ev.custom_data).toMatchObject({ value: 199, currency: 'INR', content_category: 'love' });
    // Pressing the button again reuses the order and does not report a second checkout.
    const again = await (await startAd()).json();
    await settleMeta();
    expect(again.order.id).toBe(first.order.id);
    expect(again.meta).toBeUndefined();
    expect(sent).toHaveLength(1);
  });

  it('sends one Purchase for a confirmed payment, with hashed buyer details and the browser sharing its id', async () => {
    await create();
    const orderId = (await (await startAd()).json()).order.id as string;
    const proof = pay(orderId);
    Object.assign(rzp.payments.get(proof.razorpay_payment_id)!, { email: 'Sarah@Example.com', contact: '+919876543210' });
    sent.length = 0;
    const res = await verify(adReq('/x', proof), ctx());
    const body = await res.json();
    await settleMeta();
    expect(body.meta).toEqual({ event: 'Purchase', id: `purchase_${orderId}`, value: 199, currency: 'INR' });
    expect(sent).toHaveLength(1);
    const ev = sent[0].body.data[0];
    expect(ev).toMatchObject({ event_name: 'Purchase', event_id: `purchase_${orderId}`, action_source: 'website' });
    expect(ev.event_source_url).toMatch(/^https?:\/\/[^/]+\/$/);
    expect(ev.user_data.em).toEqual([hashEmail('sarah@example.com')]);
    expect(ev.user_data.ph).toEqual([hashPhone('+919876543210')]);
    expect(ev.custom_data).toMatchObject({ value: 199, currency: 'INR', order_id: orderId });
    expect(JSON.stringify(ev)).not.toMatch(/sarah@|9876543210/i); // only hashes leave the server
    // The webhook for the same payment, and a repeated confirmation, do not send it again.
    const p = rzp.payments.get(proof.razorpay_payment_id)!;
    expect((await hook(capturedEvent(p))).status).toBe(200);
    expect((await verify(adReq('/x', proof), ctx())).status).toBe(200);
    await settleMeta();
    expect(sent).toHaveLength(1);
  });

  it('still reports the sale when only the webhook arrives (buyer never came back)', async () => {
    await create();
    const orderId = (await (await startAd()).json()).order.id as string;
    const p = rzp.payments.get(pay(orderId).razorpay_payment_id)!;
    sent.length = 0;
    expect((await hook(capturedEvent(p))).status).toBe(200);
    await settleMeta();
    expect(sent.map((s) => s.body.data[0].event_name)).toEqual(['Purchase']);
    expect(sent[0].body.data[0].user_data.fbc).toBe(FBC);
  });

  it('still reports a buyer who has no ad cookies, using their address and browser', async () => {
    await create();
    const plain = { 'x-forwarded-for': '198.51.100.4', 'user-agent': 'Mozilla/5.0 Chrome' };
    const orderId = (await (await checkout(new Request('https://kholona.test/x', { method: 'POST', headers: { authorization: `Bearer ${KEY}`, ...plain } }), ctx())).json()).order.id as string;
    expect(fake.tables.payments[0].attribution).toMatchObject({ ip: '198.51.100.4', ua: 'Mozilla/5.0 Chrome' });
    sent.length = 0;
    expect((await verify(new Request('https://kholona.test/x', { method: 'POST', headers: { authorization: `Bearer ${KEY}`, 'content-type': 'application/json', ...plain }, body: JSON.stringify(pay(orderId)) }), ctx())).status).toBe(200);
    await settleMeta();
    expect(sent).toHaveLength(1);
    expect(sent[0].body.data[0].user_data).toMatchObject({ client_ip_address: '198.51.100.4', client_user_agent: 'Mozilla/5.0 Chrome' });
    expect(sent[0].body.data[0].user_data.fbc).toBeUndefined();
  });

  it('later adds the ad click to an order that was opened without one', async () => {
    await create();
    await checkout(new Request('https://kholona.test/x', { method: 'POST', headers: { authorization: `Bearer ${KEY}`, 'user-agent': 'Mozilla/5.0' } }), ctx());
    expect((fake.tables.payments[0].attribution as Record<string, unknown>).fbp).toBeUndefined();
    await startAd();
    expect(fake.tables.payments).toHaveLength(1);
    expect(fake.tables.payments[0].attribution).toMatchObject({ fbc: FBC, fbp: FBP });
  });

  it('does not report anything for a buyer who opted out, and keeps the response clean', async () => {
    await create();
    const res = await (await startAd({ dnt: '1' })).json();
    expect(res.meta).toBeUndefined();
    expect(fake.tables.payments[0].attribution).toBeUndefined();
    const proof = pay(res.order.id);
    expect((await verify(adReq('/x', proof, { dnt: '1' }), ctx())).status).toBe(200);
    await settleMeta();
    expect(sent).toHaveLength(0);
  });

  it('never lets Meta break a payment: an outage changes nothing for the buyer', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    graphDown = true;
    await create();
    const orderId = (await (await startAd()).json()).order.id as string;
    const res = await verify(adReq('/x', pay(orderId)), ctx());
    await settleMeta();
    expect(res.status).toBe(200);
    expect(await isPublic()).toBe(true);
    expect(fake.tables.payments[0].status).toBe('paid');
  });

  it('adds the test event code when set, so events can be checked in Meta Events Manager', async () => {
    process.env.META_TEST_EVENT_CODE = 'TEST12345';
    await create();
    await startAd();
    await settleMeta();
    expect(sent[0].body.test_event_code).toBe('TEST12345');
  });

  it('is completely off without a Pixel id and token', async () => {
    delete process.env.META_CAPI_TOKEN;
    await create();
    const res = await (await startAd()).json();
    const orderId = res.order.id as string;
    expect(res.meta).toBeUndefined();
    expect((await verify(adReq('/x', pay(orderId)), ctx())).status).toBe(200);
    await settleMeta();
    expect(sent).toHaveLength(0);
  });
});

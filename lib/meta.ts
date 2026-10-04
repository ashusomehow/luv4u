import { createHash } from 'node:crypto';
import { after } from 'next/server';
import { siteUrl } from './env';
import { clientAddress } from './rate-limit';

/**
 * Meta (Facebook / Instagram) ads measurement, server side: the Conversions API.
 *
 * The browser Pixel (public/legacy/meta.js) reports the early funnel; this module reports the sale itself
 * from the server, once Razorpay has confirmed the money, so ad blockers, Instagram's in-app browser and
 * app switches during UPI payment cannot hide a purchase. Both sides send the same `event_id`, so Meta counts
 * each event once.
 *
 * It never affects the product: with no Pixel id or token configured everything here is a no-op, and a
 * failure to reach Meta is logged and swallowed. Nothing typed by a person (names, messages) is ever sent;
 * email and phone, when Razorpay has them, go only as SHA-256 hashes as Meta requires.
 */

const GRAPH_VERSION = 'v21.0';
const graphBase = () => (process.env.META_GRAPH_BASE || 'https://graph.facebook.com').replace(/\/$/, '');

export const metaPixelId = (): string => (process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '').trim();
const accessToken = (): string => (process.env.META_CAPI_TOKEN ?? '').trim();
/** Server events are sent only when both the Pixel id and the Conversions API token are set. */
export const metaConfigured = (): boolean => /^\d{8,20}$/.test(metaPixelId()) && accessToken().length > 20;

export type MetaEventName = 'InitiateCheckout' | 'Purchase';

/** What the browser needs to fire the matching Pixel event with the same id. */
export interface MetaBrowserEvent {
  event: MetaEventName;
  id: string;
  value: number;
  currency: string;
}

/** What we remember about the ad click that led to an order. Stored on the payment row, never on the gift. */
export interface Attribution {
  fbc?: string;
  fbp?: string;
  ip?: string;
  ua?: string;
  url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
}

export const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

/** Meta wants lowercase, trimmed email. */
export function hashEmail(email: unknown): string | undefined {
  const value = typeof email === 'string' ? email.trim().toLowerCase() : '';
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value) ? sha256(value) : undefined;
}

/** Meta wants digits only with the country code: "+91 98765 43210" and "9876543210" both become 919876543210. */
export function hashPhone(phone: unknown): string | undefined {
  let digits = typeof phone === 'string' ? phone.replace(/\D/g, '') : '';
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) digits = `91${digits.slice(1)}`;
  return digits.length >= 11 && digits.length <= 15 ? sha256(digits) : undefined;
}

/* ------------------------------------------------------------- attribution */

const FBC = /^fb\.[0-2]\.\d{10,13}\.[A-Za-z0-9_-]{6,300}$/;
const FBP = /^fb\.[0-2]\.\d{10,13}\.\d{6,20}$/;
const UTM = /^[\w .:+~%-]{1,100}$/;

function cookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i < 1) continue;
    const key = part.slice(0, i).trim();
    if (!(key in out)) out[key] = part.slice(i + 1).trim();
  }
  return out;
}

/** Do Not Track and Global Privacy Control switch all ad measurement off, as they do for our own counts. */
export function adsOptedOut(headers: Headers): boolean {
  return headers.get('dnt') === '1' || headers.get('sec-gpc') === '1';
}

/** The page the buyer is on: the Referer if it is our own site, otherwise our home page. Never a gift link. */
function pageUrl(request: Request): string {
  const own = siteUrl();
  try {
    const ref = new URL(request.headers.get('referer') ?? '');
    if (ref.origin === new URL(own).origin && !/^\/(g|edit)\//.test(ref.pathname)) return `${ref.origin}${ref.pathname}`;
  } catch {
    /* fall through */
  }
  return `${own}/`;
}

/**
 * Reads the ad-click identifiers from the request: Meta's own `_fbc` / `_fbp` cookies and our `kholona_attr`
 * cookie (UTM tags). Everything is validated against a strict pattern, so a hand-made cookie cannot smuggle
 * anything else into the record. Returns null when the visitor opted out or there is nothing to remember.
 */
export function readAttribution(request: Request): Attribution | null {
  if (adsOptedOut(request.headers)) return null;
  const jar = cookies(request.headers.get('cookie'));
  const out: Attribution = {};
  if (FBC.test(jar._fbc ?? '')) out.fbc = jar._fbc;
  if (FBP.test(jar._fbp ?? '')) out.fbp = jar._fbp;

  try {
    const raw = jar.kholona_attr ? JSON.parse(Buffer.from(jar.kholona_attr, 'base64url').toString('utf8')) : null;
    if (raw && typeof raw === 'object') {
      for (const [key, short] of [['utm_source', 's'], ['utm_medium', 'm'], ['utm_campaign', 'c'], ['utm_content', 'n']] as const) {
        const value = (raw as Record<string, unknown>)[short];
        if (typeof value === 'string' && UTM.test(value)) out[key] = value;
      }
    }
  } catch {
    /* a broken cookie is just ignored */
  }

  // Only keep the connection details when there is a click to match them to.
  if (out.fbc || out.fbp || out.utm_source) {
    const ip = clientAddress(request);
    if (ip && ip.length <= 64) out.ip = ip;
    const ua = request.headers.get('user-agent');
    if (ua) out.ua = ua.slice(0, 400);
    out.url = pageUrl(request);
    return out;
  }
  return null;
}

/* ------------------------------------------------------------------ sending */

export interface MetaEventInput {
  name: MetaEventName;
  id: string;
  attribution?: Attribution | null;
  giftId: string;
  value: number;
  occasion?: string | null;
  orderId?: string;
  email?: unknown;
  phone?: unknown;
  /** Unix seconds; defaults to now. */
  time?: number;
}

export function buildServerEvent(input: MetaEventInput) {
  const a = input.attribution ?? {};
  const user: Record<string, unknown> = { external_id: sha256(input.giftId) };
  if (a.fbc) user.fbc = a.fbc;
  if (a.fbp) user.fbp = a.fbp;
  if (a.ip) user.client_ip_address = a.ip;
  if (a.ua) user.client_user_agent = a.ua;
  const em = hashEmail(input.email);
  if (em) user.em = [em];
  const ph = hashPhone(input.phone);
  if (ph) user.ph = [ph];

  const custom: Record<string, unknown> = {
    value: input.value,
    currency: 'INR',
    content_type: 'product',
    content_ids: ['kholona_gift'],
    content_name: 'Kholona gift',
    num_items: 1,
  };
  if (input.occasion) custom.content_category = input.occasion;
  if (input.orderId) custom.order_id = input.orderId;

  return {
    event_name: input.name,
    event_time: input.time ?? Math.floor(Date.now() / 1000),
    event_id: input.id,
    action_source: 'website',
    event_source_url: a.url || `${siteUrl()}/`,
    user_data: user,
    custom_data: custom,
  };
}

/** Sends one event to the Conversions API. Never throws; returns whether Meta accepted it. */
export async function sendMetaEvent(input: MetaEventInput): Promise<boolean> {
  if (!metaConfigured()) return false;
  const body: Record<string, unknown> = { data: [buildServerEvent(input)], access_token: accessToken() };
  const test = (process.env.META_TEST_EVENT_CODE ?? '').trim();
  if (test) body.test_event_code = test;
  try {
    const res = await fetch(`${graphBase()}/${GRAPH_VERSION}/${metaPixelId()}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
    if (!res.ok) {
      // The access token is in the request, never in the response, so the reply is safe to log.
      console.warn('Meta Conversions API rejected an event:', input.name, res.status, (await res.text().catch(() => '')).slice(0, 300));
      return false;
    }
    return true;
  } catch (error) {
    console.warn('Meta Conversions API unreachable:', input.name, error instanceof Error ? error.message : error);
    return false;
  }
}

/* ------------------------------------------------------------ event ids */

export const purchaseEventId = (orderId: string): string => `purchase_${orderId}`;
export const checkoutEventId = (orderId: string): string => `ic_${orderId}`;

/** What the checkout and verify responses tell the browser, so its Pixel event shares the server's id. */
export function browserEvent(request: Request, event: MetaEventName, orderId: string, amountPaise: number): MetaBrowserEvent | undefined {
  if (!metaConfigured() || adsOptedOut(request.headers)) return undefined;
  return { event, id: event === 'Purchase' ? purchaseEventId(orderId) : checkoutEventId(orderId), value: amountPaise / 100, currency: 'INR' };
}

/* -------------------------------------------------------- deferred sending */

const pending = new Set<Promise<unknown>>();

/**
 * Runs `work` after the response has gone out (so Meta can never slow a payment down), using Next's `after`
 * where there is a request to hang it on, and a plain tracked promise elsewhere (scripts, tests).
 */
export function defer(work: () => Promise<unknown>): void {
  let resolve: () => void = () => undefined;
  const tracked = new Promise<void>((r) => (resolve = r));
  pending.add(tracked);
  void tracked.finally(() => pending.delete(tracked));
  const run = () => work().catch(() => undefined).then(() => resolve());
  try {
    after(run);
  } catch {
    void run();
  }
}

/** Waits for deferred sends already started. For tests and scripts. */
export async function settleMeta(): Promise<void> {
  await Promise.all([...pending]);
}

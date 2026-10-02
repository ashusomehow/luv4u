import { createHmac, timingSafeEqual } from 'node:crypto';
import { ApiError } from './http';

/**
 * A small Razorpay client: just the four calls Kholona needs, over plain fetch, so there is no SDK to keep
 * patched. Server-side only: the key secret must never reach the browser or a log line.
 */
export const CURRENCY = 'INR';

const apiBase = () => (process.env.RAZORPAY_API_BASE || 'https://api.razorpay.com').replace(/\/$/, '');

export const razorpayConfigured = (): boolean => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
export const razorpayKeyId = (): string => process.env.RAZORPAY_KEY_ID ?? '';
/** Test keys start with rzp_test_ : nothing charged with them moves real money. */
export const razorpayTestMode = (): boolean => razorpayKeyId().startsWith('rzp_test_');
export const webhookSecret = (): string => process.env.RAZORPAY_WEBHOOK_SECRET ?? '';

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}
export interface RazorpayPayment {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  status: string;
}

async function call<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  let res: Response;
  try {
    res = await fetch(`${apiBase()}${path}`, {
      method,
      headers: { Authorization: `Basic ${auth}`, ...(body ? { 'content-type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(12_000),
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Razorpay request failed:', method, path, error instanceof Error ? error.message : error);
    throw new ApiError(502, 'We could not reach the payment provider. Nothing was charged. Please try again in a moment.');
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* handled below */
  }
  if (!res.ok || !data || typeof data !== 'object') {
    const detail = (data as { error?: { code?: string; description?: string } } | null)?.error;
    console.error('Razorpay error:', res.status, method, path, detail?.code, detail?.description);
    throw new ApiError(502, 'The payment provider could not complete that. Nothing was charged. Please try again in a moment.');
  }
  return data as T;
}

export const createOrder = (giftId: string, amountPaise: number) =>
  call<RazorpayOrder>('POST', '/v1/orders', {
    amount: amountPaise,
    currency: CURRENCY,
    receipt: `k_${giftId}`, // up to 40 characters; 24-character gift id plus prefix
    notes: { gift_id: giftId }, // an id only: no names, no message text ever go to the provider
  });

export const fetchPayment = (paymentId: string) => call<RazorpayPayment>('GET', `/v1/payments/${encodeURIComponent(paymentId)}`);

export const capturePayment = (paymentId: string, amountPaise: number) =>
  call<RazorpayPayment>('POST', `/v1/payments/${encodeURIComponent(paymentId)}/capture`, { amount: amountPaise, currency: CURRENCY });

export async function orderPayments(orderId: string): Promise<RazorpayPayment[]> {
  const data = await call<{ items?: RazorpayPayment[] }>('GET', `/v1/orders/${encodeURIComponent(orderId)}/payments`);
  return Array.isArray(data.items) ? data.items : [];
}

const hmac = (secret: string, data: string) => createHmac('sha256', secret).update(data).digest('hex');
const sameHex = (a: string, b: string) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

/** The signature Razorpay Checkout hands the browser: HMAC-SHA256 of "order_id|payment_id" with the key secret. */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !signature) return false;
  return sameHex(hmac(secret, `${orderId}|${paymentId}`), signature.toLowerCase());
}

/** Webhook signature: HMAC-SHA256 of the exact raw request body with the webhook secret you set in the dashboard. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = webhookSecret();
  if (!secret || !signature) return false;
  return sameHex(hmac(secret, rawBody), signature.toLowerCase());
}

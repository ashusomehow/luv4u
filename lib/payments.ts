/**
 * Payment settings. Sending a gift always costs money: a new gift starts as a private `preview` that only its
 * owner can see, and becomes public only when it is unlocked (see markPaid in lib/gifts.ts). There is no
 * switch to turn that off. Without a payment provider an unlock fails closed (503), so a misconfigured
 * deployment cannot hand out free links; local development and preview deployments use PAYMENT_SIMULATE.
 */

/** How long a gift's link stays live after it is unlocked. Fixed, so buyers have one less decision. */
export const PAID_LINK_DAYS = 365;

/** One-time price in whole rupees: ₹199. PAYMENT_PRICE_INR can override it (for a price test or a seasonal price). */
export const DEFAULT_PRICE_INR = 199;

/** A wedding invite reaches a whole guest list and replaces printed cards, so it is priced on its own: ₹499. */
export const WEDDING_PRICE_INR = 499;

const envPrice = (value: string | undefined, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 && n <= 100000 ? Math.round(n) : fallback;
};

/** The price for a gift of this occasion. PAYMENT_PRICE_INR (gifts) and PAYMENT_PRICE_WEDDING_INR can override it. */
export function priceInr(occasion?: unknown): number {
  if (occasion === 'wedding') return envPrice(process.env.PAYMENT_PRICE_WEDDING_INR, WEDDING_PRICE_INR);
  return envPrice(process.env.PAYMENT_PRICE_INR, DEFAULT_PRICE_INR);
}

/** How long an unpaid preview is kept before the daily cleanup removes it. */
export function previewTtlDays(): number {
  const n = Number(process.env.PREVIEW_TTL_DAYS);
  return Number.isFinite(n) && n >= 1 && n <= 30 ? Math.trunc(n) : 7;
}

/**
 * Test mode: the checkout marks the gift paid without charging anything, so the whole flow can be tried
 * before a payment provider is connected. Refused on the Vercel production deployment whatever the setting.
 */
export function simulatePayments(): boolean {
  return process.env.PAYMENT_SIMULATE === 'true' && process.env.VERCEL_ENV !== 'production';
}

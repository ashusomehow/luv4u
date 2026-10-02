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

export function priceInr(): number {
  const n = Number(process.env.PAYMENT_PRICE_INR);
  return Number.isFinite(n) && n >= 1 && n <= 100000 ? Math.round(n) : DEFAULT_PRICE_INR;
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

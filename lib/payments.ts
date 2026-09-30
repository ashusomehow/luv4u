/**
 * Payment settings. With PAYMENTS_REQUIRED unset (the default) nothing changes: every gift is
 * created unlocked. When it is "true", new gifts start as `preview` and only their owner can see
 * them until they are unlocked (see markPaid in lib/gifts.ts).
 */
export function paymentsRequired(): boolean {
  return process.env.PAYMENTS_REQUIRED === 'true';
}

/** How long a gift's link stays live after it is unlocked. Fixed, so buyers have one less decision. */
export const PAID_LINK_DAYS = 365;

/** One-time price shown to buyers, in whole rupees. Override with PAYMENT_PRICE_INR. */
export function priceInr(): number {
  const n = Number(process.env.PAYMENT_PRICE_INR);
  return Number.isFinite(n) && n >= 1 && n <= 100000 ? Math.round(n) : 99;
}

/** How long an unpaid preview is kept before the daily cleanup removes it. */
export function previewTtlDays(): number {
  const n = Number(process.env.PREVIEW_TTL_DAYS);
  return Number.isFinite(n) && n >= 1 && n <= 30 ? Math.trunc(n) : 7;
}

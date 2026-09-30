/**
 * Payment settings. With PAYMENTS_REQUIRED unset (the default) nothing changes: every gift is
 * created unlocked. When it is "true", new gifts start as `preview` and only their owner can see
 * them until they are unlocked (see markPaid in lib/gifts.ts).
 */
export function paymentsRequired(): boolean {
  return process.env.PAYMENTS_REQUIRED === 'true';
}

/** How long an unpaid preview is kept before the daily cleanup removes it. */
export function previewTtlDays(): number {
  const n = Number(process.env.PREVIEW_TTL_DAYS);
  return Number.isFinite(n) && n >= 1 && n <= 30 ? Math.trunc(n) : 7;
}

import { requireReportAccess } from '@/lib/admin';
import { ApiError, handle, json, requireBackend } from '@/lib/http';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const MAX_DAYS = 400;
const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

function missingMigration(error: { code?: string; message?: string }): boolean {
  return /PGRST202|42883|42P01|checkout_report|payment_failures|creator_steps/.test(`${error.code ?? ''} ${error.message ?? ''}`);
}

async function call(name: 'checkout_report' | 'payment_failures' | 'creator_steps', days: number): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase().rpc(name, { days });
  if (error) {
    if (missingMigration(error)) throw new ApiError(503, 'Run supabase/migrations/0012_checkout_report.sql first.');
    throw error;
  }
  return (data ?? []) as Record<string, unknown>[];
}

/**
 * GET: where buyers stop (migration 0012), for the last `days` days (default 28, at most 400). Needs REPORT_TOKEN.
 *  - checkout: per day x browser (in-app / browser / unknown) x phone: taps on pay, payment windows opened, closed,
 *    failed, paid (as seen by the page), "Pay in Chrome" taps and arrivals, and orders opened and paid (the truth).
 *  - failures: Razorpay's failure codes by browser and phone.
 *  - steps: sessions per gift type that reached each milestone in the maker.
 */
export const GET = handle(async (request: Request) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  requireReportAccess(request);
  const days = Math.min(MAX_DAYS, Math.max(1, Math.floor(Number(new URL(request.url).searchParams.get('days')) || 28)));
  const [checkout, failures, steps] = await Promise.all([call('checkout_report', days), call('payment_failures', days), call('creator_steps', days)]);
  return json({
    ok: true,
    days,
    timeZone: 'Asia/Kolkata',
    generatedAt: new Date().toISOString(),
    checkout: checkout.map((r) => ({
      day: String(r.day ?? '').slice(0, 10), env: String(r.env ?? 'unknown'), os: String(r.os ?? 'unknown'),
      pay_clicks: num(r.pay_clicks), windows_opened: num(r.windows_opened), dismissed: num(r.dismissed), failed: num(r.failed),
      paid_events: num(r.paid_events), browser_taps: num(r.browser_taps), browser_arrivals: num(r.browser_arrivals),
      checkouts: num(r.checkouts), paid: num(r.paid),
    })),
    failures: failures.map((r) => ({ code: String(r.code ?? ''), env: String(r.env ?? 'unknown'), os: String(r.os ?? 'unknown'), failures: num(r.failures) })),
    steps: steps.map((r) => ({ occasion: String(r.occasion ?? 'unknown'), step: String(r.step ?? ''), sessions: num(r.sessions) })),
  });
});

import { requireAdmin } from '@/lib/admin';
import { siteUrl } from '@/lib/env';
import { ApiError, handle, json, readJson, requireBackend } from '@/lib/http';
import { priceInr } from '@/lib/payments';
import { MIN_PAYOUT_PAISE, TIERS, newStatsKey, normalizeCode, referralDiscountInr, referralReport } from '@/lib/referrals';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/** The fields an admin may set on a creator. Everything is trimmed text, at most 200 characters. */
const FIELDS = ['name', 'handle', 'phone', 'email', 'payout_name', 'account_number', 'ifsc', 'upi', 'pan', 'notes'] as const;

function fields(body: Record<string, unknown>): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const key of FIELDS) {
    if (!(key in body)) continue;
    const value = typeof body[key] === 'string' ? (body[key] as string).trim().slice(0, key === 'notes' ? 1000 : 200) : '';
    out[key] = value || null;
  }
  if (out.ifsc) out.ifsc = out.ifsc.toUpperCase();
  if (out.pan) out.pan = out.pan.toUpperCase();
  return out;
}

/** GET: every creator with weekly numbers, sales, and what is due. Admin only. */
export const GET = handle(async (request: Request) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  requireAdmin(request);
  const weeks = Number(new URL(request.url).searchParams.get('weeks')) || 8;
  const report = await referralReport({ count: weeks });
  return json({
    ok: true,
    site: siteUrl(),
    rules: { tiers: TIERS, minPayoutInr: MIN_PAYOUT_PAISE / 100, discountInr: referralDiscountInr(), priceInr: priceInr() },
    creators: report,
  });
});

/**
 * POST actions, admin only:
 *  { action: 'create', code, name, ... }   add a creator (code is letters and digits, 3 to 20)
 *  { action: 'update', code, ...fields, active? }
 *  { action: 'paid', code, reference }     records every finished, unpaid week as paid with this IMPS reference
 *  { action: 'exclude', order_id, excluded } leaves a sale out of (or back into) the creator's numbers (refund, abuse)
 *  { action: 'rotate_key', code }          a new private stats link, if the old one leaked
 */
export const POST = handle(async (request: Request) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  requireAdmin(request);
  const body = (await readJson(request)) ?? {};
  const db = supabase();
  const code = normalizeCode(body.code);

  switch (body.action) {
    case 'create': {
      if (!code) throw new ApiError(400, 'A code is 3 to 20 letters or digits.');
      const row: Record<string, unknown> = { ...fields(body), code, stats_key: newStatsKey(), active: true };
      if (!row.name) throw new ApiError(400, 'A name is needed.');
      const { error } = await db.from('referrers').insert(row);
      if (error) throw error.code === '23505' ? new ApiError(409, 'That code is taken.') : error;
      return json({ ok: true, code });
    }
    case 'update': {
      if (!code) throw new ApiError(400, 'Which creator?');
      const change: Record<string, unknown> = fields(body);
      if ('name' in change && !change.name) throw new ApiError(400, 'A name is needed.');
      if (typeof body.active === 'boolean') change.active = body.active;
      const { error } = await db.from('referrers').update(change).eq('code', code);
      if (error) throw error;
      return json({ ok: true });
    }
    case 'rotate_key': {
      if (!code) throw new ApiError(400, 'Which creator?');
      const { error } = await db.from('referrers').update({ stats_key: newStatsKey() }).eq('code', code);
      if (error) throw error;
      return json({ ok: true });
    }
    case 'exclude': {
      const orderId = typeof body.order_id === 'string' && /^order_[A-Za-z0-9]{6,40}$/.test(body.order_id) ? body.order_id : null;
      if (!orderId) throw new ApiError(400, 'Which sale?');
      const { error } = await db.from('payments').update({ ref_excluded: body.excluded === true }).eq('order_id', orderId);
      if (error) throw error;
      return json({ ok: true });
    }
    case 'paid': {
      if (!code) throw new ApiError(400, 'Which creator?');
      const reference = typeof body.reference === 'string' ? body.reference.trim().slice(0, 60) : '';
      if (!reference) throw new ApiError(400, 'Add the IMPS reference (UTR) so the payment can be traced.');
      const [creator] = await referralReport({ code });
      if (!creator) throw new ApiError(404, 'No such creator.');
      const open = creator.weeks.filter((w) => creator.due.weeks.includes(w.week));
      if (!open.length) throw new ApiError(409, 'Nothing is due for this creator.');
      for (const w of open) {
        const { error } = await db.from('referral_payouts').insert({ code, week_start: w.week, sales: w.sales, revenue: w.revenue, rate: w.rate, amount: w.amount, reference });
        if (error && error.code !== '23505') throw error;
      }
      return json({ ok: true, weeks: open.map((w) => w.week), amount: creator.due.amount });
    }
    default:
      throw new ApiError(400, 'Unknown action.');
  }
});

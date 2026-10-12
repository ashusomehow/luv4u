import { json } from '@/lib/http';
import { priceInr } from '@/lib/payments';
import { overMemoryLimit } from '@/lib/rate-limit';
import { findReferrer, normalizeCode, referralDiscountInr } from '@/lib/referrals';
import { isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Checks a creator code typed on the unlock page: GET /api/referral?code=PRIYA. Answers with the discount and
 * the price after it, never anything about the creator. The checkout checks the code again and sets the price itself.
 */
export async function GET(request: Request) {
  if (!isSupabaseConfigured()) return json({ ok: false, error: 'Codes are not available right now.' }, 503);
  if (overMemoryLimit(request, 'referral', 30, 600)) return json({ ok: false, error: 'Too many tries. Please wait a few minutes.' }, 429);
  const code = normalizeCode(new URL(request.url).searchParams.get('code'));
  const referrer = await findReferrer(code);
  if (!referrer) return json({ ok: false, error: 'That code is not valid.' }, 404);
  const discountInr = referralDiscountInr();
  return json({ ok: true, code: referrer.code, discountInr, priceInr: priceInr() - discountInr });
}

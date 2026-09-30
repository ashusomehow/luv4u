import { assertId, findGift } from '@/lib/gifts';
import { ApiError, handle, json, readJson, requireBackend } from '@/lib/http';
import { addressHash, LIMITS, rateLimit } from '@/lib/rate-limit';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export const REPORT_REASONS = ['harassment', 'threat', 'sexual', 'hate', 'impersonation', 'privacy', 'spam', 'other'] as const;

/**
 * Anyone holding a gift link can report it: no account, no key. A report does not change the gift;
 * a person reviews it and removes the gift through the admin takedown endpoint.
 */
export const POST = handle(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  const { id } = await params;
  assertId(id);
  await rateLimit(request, 'report', LIMITS.report.max, LIMITS.report.window);

  const body = await readJson<{ reason?: unknown; details?: unknown }>(request);
  const reason = String(body?.reason ?? '');
  if (!(REPORT_REASONS as readonly string[]).includes(reason)) throw new ApiError(400, 'Please choose a reason.');
  const details = String(body?.details ?? '').trim().slice(0, 1000);

  // Reporting a gift that is already gone is fine and says nothing about whether it ever existed.
  const row = await findGift(id);
  if (row) {
    const { error } = await supabase()
      .from('gift_reports')
      .insert({ gift_id: id, reason, details, reporter_hash: addressHash(request) ?? 'unknown' });
    if (error) throw error;
  }
  return json({ ok: true });
});

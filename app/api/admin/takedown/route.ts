import { requireAdmin } from '@/lib/admin';
import { assertId, deleteAllMedia, findGift } from '@/lib/gifts';
import { ApiError, handle, json, readJson, requireBackend } from '@/lib/http';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Removes a gift after review. The content and every stored photo and recording are erased; the
 * row stays so the link answers "removed" and the decision is recorded. Needs ADMIN_TOKEN.
 * Body: { id, reason }. Also marks the gift's open reports as handled.
 */
export const POST = handle(async (request: Request) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  requireAdmin(request);

  const body = await readJson<{ id?: unknown; reason?: unknown }>(request);
  const id = String(body?.id ?? '');
  assertId(id);
  const row = await findGift(id, { includeRemoved: true });
  if (!row) throw new ApiError(404, 'No such gift.');

  const now = new Date().toISOString();
  const db = supabase();
  const { error } = await db
    .from('gifts')
    .update({ gift: {}, taken_down_at: now, takedown_reason: String(body?.reason ?? '').slice(0, 300), updated_at: now })
    .eq('id', id);
  if (error) throw error;
  await deleteAllMedia(id).catch((err) => console.error('Media delete failed:', err));
  await db.from('gift_reports').update({ handled_at: now }).eq('gift_id', id);
  return json({ ok: true, id, removedAt: now });
});

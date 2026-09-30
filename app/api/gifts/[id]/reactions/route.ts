import { assertId, findGift, hashSecret, isExpired, isUnlocked } from '@/lib/gifts';
import { ApiError, handle, json, readJson, requireBackend } from '@/lib/http';
import { LIMITS, rateLimit } from '@/lib/rate-limit';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const MAX_REPLIES_PER_VISITOR = 10;

/** The recipient explicitly sends a reaction and/or a few words to the creator. */
export const POST = handle(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  const { id } = await params;
  assertId(id);

  await rateLimit(request, 'reply', LIMITS.reply.max, LIMITS.reply.window);
  const body = await readJson<{ visitor?: unknown; reaction?: unknown; message?: unknown }>(request);
  const reaction = String(body?.reaction ?? '').slice(0, 16);
  const message = String(body?.message ?? '').slice(0, 500);
  if (!reaction && !message.trim()) throw new ApiError(400, 'Pick a little feeling, or write a few words.');

  const gift = await findGift(id);
  if (!gift || isExpired(gift.expires_at) || !isUnlocked(gift)) throw new ApiError(404, 'Gift not found or has been removed.');

  const db = supabase();
  const visitor = typeof body?.visitor === 'string' && body.visitor ? hashSecret(body.visitor) : 'anonymous';
  if (visitor !== 'anonymous') {
    const { count, error } = await db
      .from('gift_replies')
      .select('id', { count: 'exact', head: true })
      .eq('gift_id', id)
      .eq('visitor_hash', visitor);
    if (error) throw error;
    if ((count ?? 0) >= MAX_REPLIES_PER_VISITOR) throw new ApiError(429, 'That’s plenty of replies for now.');
  }

  const { error } = await db.from('gift_replies').insert({ gift_id: id, visitor_hash: visitor, reaction, message });
  if (error) throw error;
  return json({ ok: true });
});

import { findGift, hashSecret, ID_PATTERN, isScheduled, isUnlocked } from '@/lib/gifts';
import { handle, json, readJson, requireBackend } from '@/lib/http';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/** Approximate opening counter. Counting must never block opening a gift, so it never fails loudly. */
export const POST = handle(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  const { id } = await params;
  const body = await readJson<{ visitor?: unknown }>(request);
  const row = ID_PATTERN.test(id) ? await findGift(id).catch(() => null) : null;
  if (row && isUnlocked(row) && !isScheduled(row) && typeof body?.visitor === 'string' && body.visitor) {
    await supabase()
      .from('gift_views')
      .upsert(
        { gift_id: id, visitor_hash: hashSecret(body.visitor) },
        { onConflict: 'gift_id,visitor_hash', ignoreDuplicates: true },
      );
  }
  return json({ ok: true });
});

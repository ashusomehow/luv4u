import { hashSecret, ID_PATTERN } from '@/lib/gifts';
import { handle, json, readJson, requireBackend } from '@/lib/http';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/** Approximate opening counter. Counting must never block opening a gift, so it never fails loudly. */
export const POST = handle(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  const { id } = await params;
  const body = await readJson<{ visitor?: unknown }>(request);
  if (ID_PATTERN.test(id) && typeof body?.visitor === 'string' && body.visitor) {
    await supabase()
      .from('gift_views')
      .upsert(
        { gift_id: id, visitor_hash: hashSecret(body.visitor) },
        { onConflict: 'gift_id,visitor_hash', ignoreDuplicates: true },
      );
  }
  return json({ ok: true });
});

import { findOwnedGift } from '@/lib/gifts';
import { ApiError, bearer, handle, json, requireBackend } from '@/lib/http';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/** Private inbox: approximate opening count, reaction totals and the latest replies. */
export const GET = handle(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  const { id } = await params;
  const key = bearer(request);
  if (!key) throw new ApiError(401, 'Missing edit key.');
  const row = await findOwnedGift(id, key);

  const db = supabase();
  const [views, replies, reactionRows] = await Promise.all([
    db.from('gift_views').select('id', { count: 'exact', head: true }).eq('gift_id', id),
    db
      .from('gift_replies')
      .select('reaction, message, created_at')
      .eq('gift_id', id)
      .order('id', { ascending: false })
      .limit(50),
    db.from('gift_replies').select('reaction').eq('gift_id', id).neq('reaction', '').limit(1000),
  ]);
  if (views.error) throw views.error;
  if (replies.error) throw replies.error;
  if (reactionRows.error) throw reactionRows.error;

  const totals = new Map<string, number>();
  for (const { reaction } of reactionRows.data ?? []) {
    if (reaction) totals.set(reaction, (totals.get(reaction) ?? 0) + 1);
  }

  return json({
    opens: views.count ?? 0,
    reactions: [...totals].map(([reaction, count]) => ({ reaction, count })),
    replies: replies.data ?? [],
    expiresAt: row.expires_at,
  });
});

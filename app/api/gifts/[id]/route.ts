import {
  assertGiftSize,
  assertId,
  deleteAllMedia,
  findGift,
  inDays,
  isUnlocked,
  LOCKED_MESSAGE,
  findOwnedGift,
  normalizeGift,
  offloadEmbeddedMedia,
  pruneMedia,
  resolveCover,
  isExpired,
  isScheduled,
  liveUntilAfter,
  parseOpensAt,
} from '@/lib/gifts';
import { ApiError, bearer, handle, json, readJson, requireBackend } from '@/lib/http';
import { previewTtlDays } from '@/lib/payments';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

/** Public read of a gift for its recipient. */
export const GET = handle(async (_request: Request, { params }: Context) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  const { id } = await params;
  assertId(id);

  const row = await findGift(id, { includeRemoved: true });
  if (!row) throw new ApiError(404, 'Gift not found or has been removed.');
  if (row.taken_down_at) throw new ApiError(410, 'This gift was removed.');
  if (isExpired(row.expires_at)) throw new ApiError(410, 'This gift has expired.');
  // A preview is visible to its owner only (through the private owner endpoint), never to the public.
  if (!isUnlocked(row)) throw new ApiError(402, LOCKED_MESSAGE);
  // Not yet: say when, and nothing about what is inside.
  if (isScheduled(row)) return json({ scheduled: true, opensAt: row.opens_at });
  return json({ gift: row.gift });
});

interface UpdateBody {
  gift?: unknown;
  cover?: unknown;
  coverUrl?: unknown;
  opensAt?: unknown;
}

export const PATCH = handle(async (request: Request, { params }: Context) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  const { id } = await params;
  const key = bearer(request);
  if (!key) throw new ApiError(401, 'Missing owner edit key.');

  const row = await findOwnedGift(id, key);
  const body = await readJson<UpdateBody>(request);
  if (!body?.gift) throw new ApiError(400, 'Invalid gift data provided.');

  let gift = normalizeGift(body.gift, id);
  gift = await offloadEmbeddedMedia(id, gift);
  const previousCover = typeof row.gift.coverUrl === 'string' ? row.gift.coverUrl : '';
  const sharePreview = gift.sharePreview !== false;
  gift.coverUrl = (await resolveCover(id, body, sharePreview)) || (sharePreview ? previousCover : '');
  assertGiftSize(gift);

  // The link's lifetime is fixed when the gift is bought, so a lifetime sent by the browser is ignored.
  // Every edit to a preview keeps it alive a little longer.
  const unlocked = isUnlocked(row);
  const changes: Record<string, unknown> = {};
  let expiresAt = row.expires_at;
  if (!unlocked) expiresAt = inDays(previewTtlDays());
  // `opensAt` only changes when the request carries it: a string sets it, null clears it.
  const opensAt = parseOpensAt(body.opensAt);
  if (opensAt !== undefined) changes.opens_at = opensAt;
  const effectiveOpensAt = opensAt === undefined ? row.opens_at : opensAt;
  expiresAt = liveUntilAfter(expiresAt, effectiveOpensAt);
  const revision = row.revision + 1;

  // Optimistic concurrency: only update if nobody else saved since we read the row.
  const { data, error } = await supabase()
    .from('gifts')
    .update({ gift, revision, expires_at: expiresAt, updated_at: new Date().toISOString(), ...changes })
    .eq('id', id)
    .eq('revision', row.revision)
    .select('id');
  if (error) throw error;
  if (!data?.length) throw new ApiError(409, 'This gift was changed somewhere else. Reload it and try again.');

  await pruneMedia(id, gift, String(gift.coverUrl ?? '')).catch((err) => console.error('Media prune failed:', err));
  return json({ ok: true, gift, url: `${new URL(request.url).origin}/g/${id}`, revision, expiresAt, opensAt: effectiveOpensAt ?? null, status: unlocked ? 'paid' : 'preview' });
});

export const DELETE = handle(async (request: Request, { params }: Context) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  const { id } = await params;
  const key = bearer(request);
  if (!key) throw new ApiError(401, 'Missing edit key.');

  await findOwnedGift(id, key);
  const { error } = await supabase().from('gifts').delete().eq('id', id);
  if (error) throw error;
  await deleteAllMedia(id).catch((err) => console.error('Media delete failed:', err));
  return json({ ok: true });
});

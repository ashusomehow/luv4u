import {
  assertGiftSize,
  assertId,
  deleteAllMedia,
  expiryFrom,
  findGift,
  findOwnedGift,
  normalizeGift,
  offloadEmbeddedMedia,
  pruneMedia,
  resolveCover,
  isExpired,
} from '@/lib/gifts';
import { ApiError, bearer, handle, json, readJson, requireBackend } from '@/lib/http';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

/** Public read of a gift for its recipient. */
export const GET = handle(async (_request: Request, { params }: Context) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  const { id } = await params;
  assertId(id);

  const row = await findGift(id);
  if (!row) throw new ApiError(404, 'Gift not found or has been removed.');
  if (isExpired(row.expires_at)) throw new ApiError(410, 'This gift has expired.');
  return json({ gift: row.gift });
});

interface UpdateBody {
  gift?: unknown;
  cover?: unknown;
  coverUrl?: unknown;
  expiresDays?: unknown;
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

  const expiresAt = body.expiresDays ? expiryFrom(body.expiresDays) : row.expires_at;
  const revision = row.revision + 1;

  // Optimistic concurrency: only update if nobody else saved since we read the row.
  const { data, error } = await supabase()
    .from('gifts')
    .update({ gift, revision, expires_at: expiresAt, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('revision', row.revision)
    .select('id');
  if (error) throw error;
  if (!data?.length) throw new ApiError(409, 'This gift was changed somewhere else. Reload it and try again.');

  await pruneMedia(id, gift, String(gift.coverUrl ?? '')).catch((err) => console.error('Media prune failed:', err));
  return json({ ok: true, gift, url: `${new URL(request.url).origin}/g/${id}`, revision, expiresAt });
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

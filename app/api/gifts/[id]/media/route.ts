import { assertId, findGift, hashSecret, KEY_PATTERN, storeDataUri, type MediaKind } from '@/lib/gifts';
import { ApiError, bearer, handle, json, readJson, requireBackend } from '@/lib/http';
import { LIMITS, rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const KINDS: MediaKind[] = ['image', 'audio', 'cover'];

/**
 * Uploads one photo, voice note, music file or share cover to Supabase Storage.
 *
 * The browser calls this before publishing so each request stays well under Vercel's
 * 4.5 MB body limit. The gift row does not exist yet on first publish, so authorization is
 * "the edit key that will own it": once a gift exists, only its own key may add media.
 */
export const POST = handle(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  const { id } = await params;
  assertId(id);
  const key = bearer(request);
  if (!key || !KEY_PATTERN.test(key)) throw new ApiError(401, 'Missing owner edit key.');

  const existing = await findGift(id, { includeRemoved: true });
  if (existing?.taken_down_at) throw new ApiError(403, 'That gift link is not available.');
  await rateLimit(request, 'media', LIMITS.media.max, LIMITS.media.window);
  if (existing && existing.owner_hash !== hashSecret(key)) {
    throw new ApiError(403, 'Incorrect edit key or gift not found.');
  }

  const body = await readJson<{ dataUri?: unknown; kind?: unknown }>(request);
  const kind = body?.kind as MediaKind;
  if (!body || typeof body.dataUri !== 'string' || !KINDS.includes(kind)) {
    throw new ApiError(400, 'Invalid media upload.');
  }
  return json({ ok: true, url: await storeDataUri(id, body.dataUri, kind) });
});

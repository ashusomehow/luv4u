import {
  assertGiftSize,
  expiryFrom,
  findGift,
  hashSecret,
  ID_PATTERN,
  KEY_PATTERN,
  normalizeGift,
  offloadEmbeddedMedia,
  resolveCover,
} from '@/lib/gifts';
import { ApiError, handle, json, readJson, requireBackend } from '@/lib/http';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface CreateBody {
  id?: unknown;
  editKey?: unknown;
  gift?: unknown;
  cover?: unknown;
  coverUrl?: unknown;
  expiresDays?: unknown;
}

export const POST = handle(async (request: Request) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;

  const body = await readJson<CreateBody>(request);
  const id = String(body?.id ?? '');
  const editKey = String(body?.editKey ?? '');
  if (!body || !ID_PATTERN.test(id) || !KEY_PATTERN.test(editKey) || !body.gift) {
    throw new ApiError(400, 'Invalid gift data provided.');
  }

  const origin = new URL(request.url).origin;
  const ownerHash = hashSecret(editKey);

  // The creator retries with the same id after a network failure; make that idempotent.
  const existing = await findGift(id);
  if (existing) {
    if (existing.owner_hash !== ownerHash) throw new ApiError(409, 'That gift link is already taken.');
    return json({
      ok: true,
      gift: existing.gift,
      url: `${origin}/g/${id}`,
      revision: existing.revision,
      expiresAt: existing.expires_at,
    });
  }

  let gift = normalizeGift(body.gift, id);
  gift = await offloadEmbeddedMedia(id, gift);
  gift.coverUrl = await resolveCover(id, body, gift.sharePreview !== false);
  assertGiftSize(gift);

  const expiresAt = expiryFrom(body.expiresDays);
  const { error } = await supabase()
    .from('gifts')
    .insert({ id, owner_hash: ownerHash, gift, revision: 1, expires_at: expiresAt });
  if (error) {
    if (error.code === '23505') throw new ApiError(409, 'That gift link is already taken.');
    throw error;
  }

  return json({ ok: true, gift, url: `${origin}/g/${id}`, revision: 1, expiresAt });
});

import {
  assertGiftSize,
  findGift,
  inDays,
  isUnlocked,
  hashSecret,
  liveUntilAfter,
  parseOpensAt,
  ID_PATTERN,
  KEY_PATTERN,
  normalizeGift,
  offloadEmbeddedMedia,
  resolveCover,
} from '@/lib/gifts';
import { ApiError, handle, json, readJson, requireBackend } from '@/lib/http';
import { LIMITS, rateLimit } from '@/lib/rate-limit';
import { PAID_LINK_DAYS, previewTtlDays } from '@/lib/payments';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface CreateBody {
  id?: unknown;
  editKey?: unknown;
  gift?: unknown;
  cover?: unknown;
  coverUrl?: unknown;
  opensAt?: unknown;
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
  const existing = await findGift(id, { includeRemoved: true });
  if (existing?.taken_down_at) throw new ApiError(409, 'That gift link is already taken.');
  if (existing) {
    if (existing.owner_hash !== ownerHash) throw new ApiError(409, 'That gift link is already taken.');
    return json({
      ok: true,
      gift: existing.gift,
      url: `${origin}/g/${id}`,
      revision: existing.revision,
      expiresAt: existing.expires_at,
      opensAt: existing.opens_at ?? null,
      status: isUnlocked(existing) ? 'paid' : 'preview',
    });
  }

  await rateLimit(request, 'create', LIMITS.create.max, LIMITS.create.window);
  let gift = normalizeGift(body.gift, id);
  gift = await offloadEmbeddedMedia(id, gift);
  gift.coverUrl = await resolveCover(id, body, gift.sharePreview !== false);
  assertGiftSize(gift);

  // A new gift is always a private preview that expires if never unlocked, and remembers how long its link
  // should live once it is. The lifetime is fixed (a year), so anything the browser sends for it is ignored.
  const opensAt = parseOpensAt(body.opensAt) ?? null;
  const expiresAt = liveUntilAfter(inDays(previewTtlDays()), opensAt);
  const row: Record<string, unknown> = { id, owner_hash: ownerHash, gift, revision: 1, expires_at: expiresAt, status: 'preview', live_days: PAID_LINK_DAYS };
  // Only written when used.
  if (opensAt) row.opens_at = opensAt;
  const { error } = await supabase().from('gifts').insert(row);
  if (error) {
    if (error.code === '23505') throw new ApiError(409, 'That gift link is already taken.');
    throw error;
  }

  return json({ ok: true, gift, url: `${origin}/g/${id}`, revision: 1, expiresAt, opensAt, status: 'preview' });
});

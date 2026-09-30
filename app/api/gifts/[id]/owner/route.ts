import { findOwnedGift } from '@/lib/gifts';
import { ApiError, bearer, handle, json, requireBackend } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** Owner recovery: returns the gift for someone holding the private edit key. */
export const GET = handle(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  const { id } = await params;
  const key = bearer(request);
  if (!key) throw new ApiError(401, 'Missing edit key.');

  const row = await findOwnedGift(id, key);
  return json({
    gift: row.gift,
    revision: row.revision,
    url: `${new URL(request.url).origin}/g/${id}`,
    expiresAt: row.expires_at,
  });
});

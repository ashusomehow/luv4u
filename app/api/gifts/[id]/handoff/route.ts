import { findOwnedGift, KEY_PATTERN } from '@/lib/gifts';
import { openHandoff, sealHandoff } from '@/lib/handoff';
import { ApiError, bearer, handle, json, readJson, requireBackend } from '@/lib/http';
import { LIMITS, rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * Pay in the real browser. Inside Instagram's or Facebook's in-app browser UPI apps often fail to open, so the
 * unlock page offers to continue in Chrome or Safari.
 *  - POST with the owner's edit key (Bearer): returns a short-lived sealed token for this gift (lib/handoff.ts).
 *  - POST { token } without a key, from the real browser: trades a valid token back for the edit key, so that
 *    browser can open the same unlock page. The key itself never appears in a URL.
 */
export const POST = handle(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  const { id } = await params;
  await rateLimit(request, 'handoff', LIMITS.handoff.max, LIMITS.handoff.window);
  const key = bearer(request);
  if (key) {
    await findOwnedGift(id, key);
    return json({ ok: true, ...sealHandoff(id, key) });
  }
  const body = await readJson<{ token?: unknown }>(request);
  const opened = openHandoff(id, body?.token);
  if (!opened || !KEY_PATTERN.test(opened)) throw new ApiError(410, 'That link has expired. Go back to the app and tap the button again.');
  await findOwnedGift(id, opened); // still this gift's owner (the gift may have been deleted since)
  return json({ ok: true, key: opened });
});

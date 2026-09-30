import { findOwnedGift, isUnlocked, markPaid } from '@/lib/gifts';
import { ApiError, bearer, handle, json, requireBackend } from '@/lib/http';
import { simulatePayments } from '@/lib/payments';

export const dynamic = 'force-dynamic';

/**
 * Starts payment for a preview gift. Only the owner (edit key) may call it.
 * Already unlocked: answers ok. Test mode (PAYMENT_SIMULATE=true, never on production) unlocks without charging. No payment provider connected yet: answers 503, and the gift stays
 * saved as a preview. The Razorpay integration replaces the 503 with a real checkout order.
 */
export const POST = handle(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  const { id } = await params;
  const key = bearer(request);
  if (!key) throw new ApiError(401, 'Missing owner edit key.');

  const row = await findOwnedGift(id, key);
  if (isUnlocked(row)) return json({ ok: true, status: 'paid' });
  if (simulatePayments()) {
    await markPaid(id);
    return json({ ok: true, status: 'paid', simulated: true });
  }
  throw new ApiError(503, 'Payments are not set up yet. Your gift is saved and stays ready for a few days.');
});

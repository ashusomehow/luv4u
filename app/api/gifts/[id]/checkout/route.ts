import { openOrderFor, reconcileGift } from '@/lib/checkout';
import { findOwnedGift, isUnlocked, markPaid } from '@/lib/gifts';
import { ApiError, bearer, handle, json, requireBackend } from '@/lib/http';
import { simulatePayments } from '@/lib/payments';
import { browserEvent, checkoutEventId, defer, readAttribution, sendMetaEvent } from '@/lib/meta';
import { LIMITS, rateLimit } from '@/lib/rate-limit';
import { razorpayConfigured, razorpayKeyId, razorpayTestMode } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

/**
 * Starts payment for a preview gift. Only the owner (edit key) may call it.
 *  - already unlocked: answers paid.
 *  - Razorpay configured: first looks for a payment that already went through (page closed mid-payment),
 *    otherwise returns a checkout order whose amount the server fixed. The browser then opens Razorpay.
 *  - not configured, test mode (PAYMENT_SIMULATE=true, never on production): unlocks without charging.
 *  - not configured at all: 503, and the gift stays saved as a preview.
 */
export const POST = handle(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  const { id } = await params;
  const key = bearer(request);
  if (!key) throw new ApiError(401, 'Missing owner edit key.');

  const row = await findOwnedGift(id, key);
  if (isUnlocked(row)) return json({ ok: true, status: 'paid' });

  if (razorpayConfigured()) {
    await rateLimit(request, 'checkout', LIMITS.checkout.max, LIMITS.checkout.window);
    if (await reconcileGift(id)) return json({ ok: true, status: 'paid' });
    const attribution = readAttribution(request);
    const { fresh, ...order } = await openOrderFor(id, attribution);
    // Ad measurement: a new order is a "checkout started". The browser fires the same event with the same id.
    const meta = fresh ? browserEvent(request, 'InitiateCheckout', order.id, order.amount) : undefined;
    if (meta) {
      defer(() =>
        sendMetaEvent({ name: 'InitiateCheckout', id: checkoutEventId(order.id), attribution, giftId: id, value: order.amount / 100, occasion: row.gift?.occasion as string | undefined, orderId: order.id }),
      );
    }
    return json({ ok: true, status: 'pending', order, keyId: razorpayKeyId(), testMode: razorpayTestMode(), ...(meta ? { meta } : {}) });
  }
  if (simulatePayments()) {
    await markPaid(id);
    return json({ ok: true, status: 'paid', simulated: true });
  }
  throw new ApiError(503, 'Payments are not set up yet. Your gift is saved and stays ready for a few days.');
});

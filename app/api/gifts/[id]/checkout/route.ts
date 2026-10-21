import { openOrderFor, reconcileGift } from '@/lib/checkout';
import { findFreeCode, redeemFreeCode } from '@/lib/free-codes';
import { findOwnedGift, isUnlocked, markPaid } from '@/lib/gifts';
import { ApiError, bearer, handle, json, readJson, requireBackend } from '@/lib/http';
import { simulatePayments } from '@/lib/payments';
import { browserEvent, checkoutEventId, defer, readAttribution, sendMetaEvent } from '@/lib/meta';
import { LIMITS, rateLimit } from '@/lib/rate-limit';
import { razorpayConfigured, razorpayKeyId, razorpayTestMode } from '@/lib/razorpay';
import { normalizeCode, referralFor } from '@/lib/referrals';

export const dynamic = 'force-dynamic';

/**
 * Starts payment for a preview gift. Only the owner (edit key) may call it.
 *  - already unlocked: answers paid.
 *  - a free code (migration 0009) in the body: uses it and unlocks without payment. Not a sale: no order, no Meta event.
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

  const body = await readJson<{ ref?: unknown }>(request);
  const typed = normalizeCode(body?.ref);
  if (typed && (await findFreeCode(typed))) {
    await rateLimit(request, 'checkout', LIMITS.checkout.max, LIMITS.checkout.window);
    if (!(await redeemFreeCode(typed, id))) throw new ApiError(409, 'That free code has just been used up. Remove it to pay as usual.');
    await markPaid(id);
    console.info('Gift unlocked with a free code.', { gift: id, code: typed });
    return json({ ok: true, status: 'paid', free: true });
  }

  if (razorpayConfigured()) {
    await rateLimit(request, 'checkout', LIMITS.checkout.max, LIMITS.checkout.window);
    if (await reconcileGift(id)) return json({ ok: true, status: 'paid' });
    const attribution = readAttribution(request);
    // A creator code: the one the page sends, else the one remembered from the creator's link. Checked here, priced here.
    const referral = await referralFor(request, body && 'ref' in body ? body.ref : undefined);
    const { fresh, ...order } = await openOrderFor(id, attribution, referral);
    // Ad measurement: a new order is a "checkout started". The browser fires the same event with the same id.
    const meta = fresh ? browserEvent(request, 'InitiateCheckout', order.id, order.amount) : undefined;
    if (meta) {
      defer(() =>
        sendMetaEvent({ name: 'InitiateCheckout', id: checkoutEventId(order.id), attribution, giftId: id, value: order.amount / 100, occasion: row.gift?.occasion as string | undefined, orderId: order.id }),
      );
    }
    return json({ ok: true, status: 'pending', order, referral: referral ? { code: referral.code, discountInr: referral.discount / 100 } : null, keyId: razorpayKeyId(), testMode: razorpayTestMode(), ...(meta ? { meta } : {}) });
  }
  if (simulatePayments()) {
    await markPaid(id);
    return json({ ok: true, status: 'paid', simulated: true });
  }
  throw new ApiError(503, 'Payments are not set up yet. Your gift is saved and stays ready for a few days.');
});

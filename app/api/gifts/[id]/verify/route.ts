import { completeOrder, findOrder } from '@/lib/checkout';
import { findOwnedGift, isUnlocked } from '@/lib/gifts';
import { ApiError, bearer, handle, json, readJson, requireBackend } from '@/lib/http';
import { browserEvent } from '@/lib/meta';
import { LIMITS, rateLimit } from '@/lib/rate-limit';
import { razorpayConfigured, verifyCheckoutSignature } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

const ID = /^[A-Za-z0-9_]{6,40}$/;

/**
 * The browser reports a finished payment: Razorpay's order id, payment id and signature. Nothing here is
 * trusted until the signature checks out, the order is one we created for this very gift, and Razorpay itself
 * confirms the payment settled for the right amount. Only then is the gift unlocked.
 */
export const POST = handle(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  const { id } = await params;
  const key = bearer(request);
  if (!key) throw new ApiError(401, 'Missing owner edit key.');

  const gift = await findOwnedGift(id, key);
  if (isUnlocked(gift)) return json({ ok: true, status: 'paid' });
  if (!razorpayConfigured()) throw new ApiError(503, 'Payments are not set up yet.');
  await rateLimit(request, 'checkout', LIMITS.checkout.max, LIMITS.checkout.window);

  const body = await readJson<{ razorpay_order_id?: unknown; razorpay_payment_id?: unknown; razorpay_signature?: unknown }>(request);
  const orderId = String(body?.razorpay_order_id ?? '');
  const paymentId = String(body?.razorpay_payment_id ?? '');
  const signature = String(body?.razorpay_signature ?? '');
  const invalid = new ApiError(400, 'That payment confirmation is not valid.');
  if (!ID.test(orderId) || !ID.test(paymentId) || !/^[a-f0-9]{64}$/i.test(signature)) throw invalid;

  const order = await findOrder(orderId);
  if (!order || order.gift_id !== id) throw invalid;
  if (!verifyCheckoutSignature(orderId, paymentId, signature)) {
    throw new ApiError(400, 'We could not verify that payment. If you were charged, your gift unlocks on its own within a few minutes. Otherwise please try again.');
  }
  if (!(await completeOrder(order, paymentId))) {
    throw new ApiError(402, 'The payment has not completed yet. If you were charged, your gift unlocks on its own within a few minutes.');
  }
  // Same event id the server used for the Conversions API, so Meta counts this purchase once.
  const meta = browserEvent(request, 'Purchase', orderId, order.amount);
  return json({ ok: true, status: 'paid', paymentId, ...(meta ? { meta } : {}) });
});

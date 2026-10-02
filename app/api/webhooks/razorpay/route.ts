import { findOrder, recordPaid } from '@/lib/checkout';
import { ApiError, handle, json, requireBackend } from '@/lib/http';
import { verifyWebhookSignature, webhookSecret } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

interface Entity {
  id?: string;
  order_id?: string | null;
  amount?: number;
  currency?: string;
  status?: string;
}
interface Event {
  event?: string;
  payload?: { payment?: { entity?: Entity }; order?: { entity?: Entity } };
}

/**
 * Razorpay's server-to-server notice that a payment was captured. It is what unlocks a gift when the buyer's
 * browser never came back (closed the tab, switched apps to pay by UPI). The body is only believed if its
 * signature matches the webhook secret. A valid event for an order we do not know is acknowledged and ignored.
 * Unexpected failures answer 500, so Razorpay retries, and every step is safe to repeat.
 */
export const POST = handle(async (request: Request) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  if (!webhookSecret()) throw new ApiError(503, 'Webhook secret is not configured.');

  const raw = await request.text();
  if (!verifyWebhookSignature(raw, request.headers.get('x-razorpay-signature') ?? '')) throw new ApiError(400, 'Bad signature.');
  

  let event: Event;
  try {
    event = JSON.parse(raw) as Event;
  } catch {
    throw new ApiError(400, 'Bad payload.');
  }
  if (event.event !== 'payment.captured' && event.event !== 'order.paid') return json({ ok: true, ignored: true });

  const payment = event.payload?.payment?.entity;
  const orderId = payment?.order_id ?? event.payload?.order?.entity?.id;
  if (!payment?.id || !orderId) return json({ ok: true, ignored: true });

  const order = await findOrder(orderId);
  if (!order) return json({ ok: true, ignored: true });
  if (payment.status !== 'captured' || payment.amount !== order.amount || payment.currency !== order.currency) {
    console.warn('Webhook payment does not match its order; not unlocking.', { order: orderId, payment: payment.id });
    return json({ ok: true, ignored: true });
  }
  await recordPaid(order, payment.id);
  return json({ ok: true });
});

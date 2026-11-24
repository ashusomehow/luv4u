import { completeOrder, findOrder } from '@/lib/checkout';
import { findGift } from '@/lib/gifts';
import { ApiError, handle, json, readJson, requireBackend } from '@/lib/http';
import { LIMITS, rateLimit } from '@/lib/rate-limit';
import { fetchPayment, razorpayConfigured, type RazorpayPayment } from '@/lib/razorpay';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const PAY_ID = /^pay_[A-Za-z0-9]{6,30}$/;
const RRN = /^\d{12}$/;
const NOT_FOUND = 'We could not find a paid gift with those details. Check the reference, and use the phone number (or email) you typed into the payment window.';

/** The phone's last ten digits, or a lowercased email, so "+91 98765 43210" and "9876543210" match. */
function contactKey(value: unknown): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.includes('@')) return text.toLowerCase();
  const digits = text.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
}

async function paymentFor(ref: string): Promise<RazorpayPayment | null> {
  if (PAY_ID.test(ref)) return fetchPayment(ref).catch(() => null);
  // A UPI reference: saved with the order when the payment was confirmed (migration 0013).
  const { data, error } = await supabase().from('payments').select('payment_id').eq('rrn', ref).limit(5);
  const paymentId = error ? null : (data as { payment_id: string | null }[] | null)?.find((row) => row.payment_id)?.payment_id;
  return paymentId ? fetchPayment(paymentId).catch(() => null) : null;
}

/**
 * POST { ref, contact }: a buyer who paid but lost the page (Instagram closed its browser on the way back from the
 * UPI app, the tab was lost, another phone) gets the gift's link back. `ref` is the Razorpay payment id (pay_…) or
 * the 12-digit UPI reference number; `contact` is the phone number or email they gave Razorpay. Both must match the
 * payment Razorpay holds. A payment that went through but was never recorded is recorded now (the gift unlocks).
 * Answers only with the gift's own link and name, never the private edit key (the server does not keep it).
 */
export const POST = handle(async (request: Request) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  if (!razorpayConfigured()) throw new ApiError(503, 'Payments are not set up on this site.');
  await rateLimit(request, 'find', LIMITS.find.max, LIMITS.find.window);

  const body = await readJson<{ ref?: unknown; contact?: unknown }>(request);
  const ref = String(body?.ref ?? '').replace(/\s+/g, '');
  const contact = contactKey(body?.contact);
  if (!PAY_ID.test(ref) && !RRN.test(ref)) throw new ApiError(400, 'Type the UPI reference number (12 digits) or the payment id that starts with pay_.');
  if (!contact) throw new ApiError(400, 'Type the phone number (or email) you gave in the payment window.');

  const payment = await paymentFor(ref);
  if (!payment || ![contactKey(payment.contact), contactKey(payment.email)].includes(contact)) throw new ApiError(404, NOT_FOUND);
  const order = payment.order_id ? await findOrder(payment.order_id) : null;
  if (!order) throw new ApiError(404, NOT_FOUND);
  if (order.status !== 'paid') {
    if (!['captured', 'authorized'].includes(payment.status) || !(await completeOrder(order, payment.id))) {
      throw new ApiError(409, 'That payment has not gone through. If money left your account, it is returned automatically within 5 to 7 working days.');
    }
  }
  const gift = await findGift(order.gift_id);
  if (!gift) throw new ApiError(410, 'That gift is no longer available. Write to us and we will sort out a refund.');
  const name = typeof gift.gift?.name === 'string' ? gift.gift.name : '';
  return json({ ok: true, url: `${new URL(request.url).origin}/g/${gift.id}`, name, occasion: gift.gift?.occasion ?? null });
});

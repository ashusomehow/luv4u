import { findGift, isUnlocked, markPaid } from './gifts';
import { priceInr } from './payments';
import { CURRENCY, capturePayment, createOrder, fetchPayment, orderPayments } from './razorpay';
import { supabase } from './supabase';

/** One checkout order. Rows are written when an order is created and updated once, when it is confirmed paid. */
export interface PaymentRow {
  id: number;
  gift_id: string;
  order_id: string;
  payment_id: string | null;
  amount: number; // paise
  currency: string;
  status: 'created' | 'paid';
}

export const pricePaise = (): number => Math.round(priceInr() * 100);

export async function findOrder(orderId: string): Promise<PaymentRow | null> {
  const { data, error } = await supabase().from('payments').select('*').eq('order_id', orderId).maybeSingle();
  if (error) throw error;
  return (data as PaymentRow | null) ?? null;
}

/**
 * The order the buyer pays against. The amount always comes from the server's own price, never from the
 * browser. A still-open order for the same gift and price is reused, so reopening the payment window does
 * not create a pile of orders (and an order can only be paid once).
 */
export async function openOrderFor(giftId: string): Promise<{ id: string; amount: number; currency: string }> {
  const amount = pricePaise();
  const db = supabase();
  const { data, error } = await db
    .from('payments')
    .select('*')
    .eq('gift_id', giftId)
    .eq('status', 'created')
    .eq('amount', amount)
    .order('id', { ascending: false })
    .limit(1);
  if (error) throw error;
  const existing = (data as PaymentRow[] | null)?.[0];
  if (existing) return { id: existing.order_id, amount: existing.amount, currency: existing.currency };

  const order = await createOrder(giftId, amount);
  const { error: insertError } = await db.from('payments').insert({ gift_id: giftId, order_id: order.id, amount, currency: CURRENCY, status: 'created' });
  if (insertError) throw insertError;
  return { id: order.id, amount: order.amount, currency: order.currency };
}

/**
 * Asks Razorpay whether this payment really settled for this order and this amount. A payment that is only
 * "authorized" is captured now; otherwise it would be released back to the buyer after a few days.
 */
async function confirmWithProvider(row: PaymentRow, paymentId: string): Promise<boolean> {
  let payment = await fetchPayment(paymentId);
  if (payment.order_id !== row.order_id || payment.amount !== row.amount || payment.currency !== row.currency) {
    console.warn('Payment does not match its order; not unlocking.', { order: row.order_id, payment: paymentId });
    return false;
  }
  if (payment.status === 'authorized') payment = await capturePayment(paymentId, row.amount);
  return payment.status === 'captured';
}

/**
 * Marks an order paid and unlocks its gift. Safe to call any number of times (browser confirmation, webhook
 * retries and the owner pressing Unlock again can all land here). The gift is unlocked first, so a failure
 * halfway can only leave a payment record to repair, never a paid customer with a locked gift.
 */
export async function recordPaid(row: PaymentRow, paymentId: string): Promise<void> {
  if (row.status === 'paid') {
    await markPaid(row.gift_id);
    return;
  }
  const gift = await findGift(row.gift_id);
  if (!gift) console.error('Payment captured for a gift that no longer exists: refund needed.', { order: row.order_id, payment: paymentId });
  await markPaid(row.gift_id);

  const db = supabase();
  const { data: others, error: othersError } = await db.from('payments').select('id').eq('gift_id', row.gift_id).eq('status', 'paid').neq('id', row.id);
  if (othersError) throw othersError;
  if (others?.length) console.warn('Duplicate payment for one gift: refund the extra one.', { gift: row.gift_id, order: row.order_id, payment: paymentId });

  const { error } = await db.from('payments').update({ status: 'paid', payment_id: paymentId, paid_at: new Date().toISOString() }).eq('id', row.id);
  if (error) throw error;
}

/** Confirms a payment with the provider and, if it settled, records it. Returns whether the gift is paid for. */
export async function completeOrder(row: PaymentRow, paymentId: string): Promise<boolean> {
  if (row.status === 'paid' && row.payment_id === paymentId) {
    await markPaid(row.gift_id);
    return true;
  }
  if (!(await confirmWithProvider(row, paymentId))) return false;
  await recordPaid(row, paymentId);
  return true;
}

/**
 * For a gift that is still locked: looks at its open orders for a payment that went through while the page
 * was closed or offline (an app switch on mobile, a lost connection) and unlocks it. Returns true if it did.
 */
export async function reconcileGift(giftId: string): Promise<boolean> {
  const { data, error } = await supabase().from('payments').select('*').eq('gift_id', giftId).eq('status', 'created').order('id', { ascending: false }).limit(5);
  if (error) throw error;
  for (const row of (data as PaymentRow[] | null) ?? []) {
    const paid = (await orderPayments(row.order_id)).find((p) => p.status === 'captured' || p.status === 'authorized');
    if (paid && (await completeOrder(row, paid.id))) return true;
  }
  return false;
}

export async function giftIsUnlocked(giftId: string): Promise<boolean> {
  const gift = await findGift(giftId);
  return !!gift && isUnlocked(gift);
}

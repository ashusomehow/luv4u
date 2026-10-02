# Payments (Razorpay)

Making and previewing a gift is free. Sending it costs a one-time ₹99 (`PAYMENT_PRICE_INR`). This page is how the money part works and how to run it.

## How a payment flows

1. The owner presses **Unlock**. The browser asks `POST /api/gifts/<id>/checkout` (with the owner's private key).
2. The server first checks Razorpay for a payment that already went through (see "Closed the tab" below). If there is none, it creates, or reuses, a Razorpay **order**. The **amount is the server's own price**; nothing the browser sends can change it. Only an order id and the public key id go back. Nothing about the recipient (name, message) is sent to Razorpay: just the gift's random id.
3. The browser opens **Razorpay Checkout** (UPI, cards, netbanking). The Razorpay script is loaded only at this moment.
4. Razorpay hands the browser the order id, payment id and a **signature**. The browser sends them to `POST /api/gifts/<id>/verify`.
5. The server unlocks the gift only if all of this holds: the owner key is right, the order is one we made for this exact gift, the signature checks out against the key secret, and **Razorpay itself confirms** the payment settled for the right amount and currency (an "authorized" payment is captured first). Then the gift becomes public and the link is shown.

### Closed the tab, switched apps, lost connection
Paying with a UPI app takes people out of the browser, and sometimes they never come back. Two safety nets unlock the gift anyway:
- **The webhook** (`/api/webhooks/razorpay`): Razorpay tells the server a payment was captured. It is only believed if its signature matches `RAZORPAY_WEBHOOK_SECRET`.
- **Unlock again**: pressing Unlock again first asks Razorpay about the gift's open orders and unlocks if money arrived.

All of it is idempotent. A webhook delivered five times, or the browser and webhook both reporting, unlocks once and records one payment.

### What is stored
One row per order in `payments` (migration `0006`): gift id, Razorpay order and payment ids, amount in paise, status, times. **No card, UPI or bank details, and no names or messages.** Rows are kept after a gift is deleted because they are accounting records (the privacy page says so).

## Setting it up

**1. Database.** Run `supabase/migrations/0006_payments.sql` in the Supabase SQL editor (safe to run twice).

**2. Keys.** Razorpay Dashboard → Account & Settings → API keys. In Vercel → Settings → Environment Variables:

| Name | Value |
| --- | --- |
| `RAZORPAY_KEY_ID` | `rzp_test_…` (later `rzp_live_…`) |
| `RAZORPAY_KEY_SECRET` | the matching secret (mark **Sensitive**) |
| `RAZORPAY_WEBHOOK_SECRET` | a long random string you make up (see step 3) |
| `PAYMENTS_REQUIRED` | `true` when you want the paywall on |

Never paste the secret into chat, an issue or a commit. It lives only in Vercel and your local `.env.local` (git-ignored). Redeploy after changing variables.

**3. Webhook.** Dashboard → Account & Settings → Webhooks → Add:
- URL: `https://kholona.in/api/webhooks/razorpay`
- Secret: the same string as `RAZORPAY_WEBHOOK_SECRET`
- Events: **`payment.captured`** and **`order.paid`**

Test-mode and live-mode have separate keys *and* separate webhooks. Add the webhook in each mode you use.

## Test mode
With `rzp_test_` keys the payment window shows "Test mode" and **no real money moves**. Use the test card and test UPI details from Razorpay's own documentation (search their docs for "test card details"); the payment window also shows them. To check it works:
1. Make a gift, press Unlock, pay with a test card or the test UPI success id. The gift unlocks and the link appears.
2. In Razorpay Dashboard (test mode) → Transactions → Payments you see the payment, and in Supabase `select * from payments order by id desc;` shows `status = 'paid'`.
3. Test the safety net: start a payment, close the tab right after paying, then open the gift's edit link and press Unlock: it should unlock. Check Dashboard → Webhooks for delivery status.

**Do not run test keys on a public site that is promoting itself:** with `PAYMENTS_REQUIRED=true` and test keys, visitors "pay" with fake cards and get real links. Use test keys on a Preview deployment or while the site is private.

## Going live
1. Complete Razorpay's activation (KYC, bank account, the website's Terms, Privacy, Refund and Contact pages, which exist).
2. In Vercel Production replace the key id and secret with the **live** pair, add the live-mode webhook, and set `PAYMENTS_REQUIRED=true`. Make sure `PAYMENT_SIMULATE` is unset.
3. Redeploy. Make one real ₹99 payment yourself, check the dashboard, and refund it (below).
4. Watch the first days: Vercel logs for `Razorpay error`, Razorpay Dashboard → Webhooks for failed deliveries.

## Refunds and duplicates
The policy (no change-of-mind refunds; duplicate or failed charges and our-fault failures are refunded) is on the Refund page. Refunds are made **in the Razorpay dashboard** (Transactions → Payments → Refund). They go back to the buyer's original method, normally in 5–7 working days. The app does not refund by itself.

**Duplicate payments.** The server logs `Duplicate payment for one gift: refund the extra one` and `Payment captured for a gift that no longer exists: refund needed`. To list gifts with more than one payment:

```sql
select gift_id, count(*) as payments, array_agg(payment_id) as payment_ids
from public.payments where status = 'paid'
group by gift_id having count(*) > 1;
```

**Payments with no unlock** (rare: the unlock step failed after payment). Orders that stayed `created` for more than a day, to compare with the Razorpay dashboard:

```sql
select * from public.payments where status = 'created' and created_at < now() - interval '1 day' order by id desc;
```

## Invoices and GST
Razorpay emails the buyer a payment receipt to the address they enter at checkout. Kholona does not yet generate its own GST invoice. If you are GST-registered, issue invoices from your accounting tool using the payment records (`payments` table plus the Razorpay dashboard export) until that is built.

## If something goes wrong
| Symptom | Likely cause |
| --- | --- |
| "We could not reach the payment provider" | Razorpay outage or wrong `RAZORPAY_KEY_*` (check Vercel logs for `Razorpay error` with status 401) |
| Modal shows no "Test mode" note although you use test keys | The new variables are not live yet: Vercel applies environment changes only after a redeploy |
| Paid but gift stays locked | Webhook not set up or wrong secret: pressing Unlock on the edit link still recovers it; fix the webhook |
| Webhook shows 400 in Razorpay | `RAZORPAY_WEBHOOK_SECRET` differs from the secret typed in the dashboard |
| Webhook shows 503 | `RAZORPAY_WEBHOOK_SECRET` is not set on that deployment |

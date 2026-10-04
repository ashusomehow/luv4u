# Meta (Facebook / Instagram) ad tracking

Kholona reports ad results to Meta two ways at once, so Meta can optimise for real ₹199 purchases:

| Where | What it sends | Why |
| --- | --- | --- |
| Browser Pixel (`public/legacy/meta.js`) | `PageView`, `ViewContent` (an occasion was picked), `Lead` (a gift was created), `InitiateCheckout`, `Purchase` | early funnel signals |
| Server, Conversions API (`lib/meta.ts`) | `InitiateCheckout` when a payment order is opened, `Purchase` once Razorpay has confirmed the money | works when the browser cannot report: ad blockers, Instagram's in-app browser, UPI app switches, closed tabs |

Both send the same `event_id` (`ic_<order id>` and `purchase_<order id>`), so Meta counts each event once.

## How a sale is matched to an ad

1. Someone taps an ad. Meta adds `?fbclid=...` to the link. On landing, `meta.js` stores it as the `_fbc` cookie, makes a `_fbp` browser id, and stores the UTM tags in `kholona_attr` (first-party cookies, up to 90 days).
2. When the buyer presses Unlock, the server reads those cookies and saves them on the payment row (`payments.attribution`).
3. When the payment is confirmed (by the browser or by the Razorpay webhook, whichever comes first), the server sends `Purchase` with the stored `fbc`/`fbp`, IP address, browser, and a SHA-256 hash of the payer's email and phone if Razorpay has them.

Because the server does this, a purchase is reported even if the buyer closed the tab after paying. The webhook must be set up (see `docs/PAYMENTS.md`).

## What is never sent

Gift ids (only a hash, as `external_id`), names, messages, photos, gift links, or any typed text. Recipient pages (`/g/...`), downloaded gifts and the unlock-page phone preview never load the Pixel or set cookies. Nothing runs, and no cookie is set, when the browser sends Do Not Track or Global Privacy Control. Buyers who opted out are not reported at all. Buyers with no ad cookies (blocked Pixel, typed the address) are still reported, with their network address and browser only, which Meta can sometimes match.

## Set up (one time)

1. **Meta Events Manager → Data sources → your Pixel.** Copy the Pixel id.
2. **Settings → Conversions API → Generate access token.** Copy it.
3. In Vercel (Production and Preview) add:
   - `NEXT_PUBLIC_META_PIXEL_ID` = the Pixel id
   - `META_CAPI_TOKEN` = the token
   - optional while testing: `META_TEST_EVENT_CODE` = the code shown under **Test events**
4. Redeploy. The Pixel id is baked into pages at build time, so a redeploy is required after changing it.
5. Run `supabase/migrations/0007_meta_attribution.sql` in the Supabase SQL editor. Without it everything still works but the ad click is not saved with the order, so server `Purchase` events lose their ad match.
6. **Test:** open `https://kholona.in/?fbclid=test123456&utm_source=meta&utm_campaign=test`, make a gift and pay with Razorpay test keys. In Events Manager → **Test events** you should see `PageView`, `ViewContent`, `Lead`, `InitiateCheckout` and `Purchase`, each marked as received from both **Browser** and **Server** and deduplicated.
7. Remove `META_TEST_EVENT_CODE` before running real ads (test events are not used for optimisation).
8. **Domain verification and event priority:** in Business Settings → Brand safety → Domains verify `kholona.in`, then in Events Manager → Aggregated Event Measurement set `Purchase` as the highest priority event.

## Ads setup

- In Ads Manager, set the campaign objective to **Sales**, conversion event **Purchase**, and the Pixel above.
- Add this URL parameter string to every ad so campaigns show up in our own data:
  `utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}`
- Send traffic to `/` or an occasion page such as `/for/birthday-wish`.

## Our own numbers

`supabase/queries/ads.sql` lists paid orders and revenue per campaign and ad, and how many started checkouts finish paying. Divide by spend from Ads Manager for cost per purchase.

## Privacy and consent

The privacy page describes this. Setting the cookies and sending data to Meta is a decision for the business: if you want a consent banner before the Pixel loads (recommended once ads scale, and for the DPDP Act), gate the `meta.js` script on it. Do Not Track and Global Privacy Control are already honoured.

## Troubleshooting

- **Events show only "Browser" or only "Server":** the other side is not matching event ids or is blocked. Server-only is normal for ad-blocker users; browser-only means the token is wrong or `META_CAPI_TOKEN` is missing.
- **Nothing in Test events:** check the token, the test event code, and the Vercel logs for `Meta Conversions API rejected an event` (the log never contains the token).
- **Purchases missing for some buyers:** buyers with Do Not Track or Global Privacy Control on are intentionally not reported, and neither are orders made before the Pixel ID and token were set.

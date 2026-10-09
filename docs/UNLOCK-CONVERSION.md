# Unlock-page conversion pass

Context: paid Meta traffic reached the site (about 1,000 visits) with no purchases, although payment itself works.
This note records what was found in a phone walk-through of the real flow and what changed. Target: 20% of
people who reach the unlock page pay. Measure it with the queries at the end of `supabase/queries/funnel.sql`.

## What was getting in the way

Found by walking the live flow as an Android Chrome visitor (412 × 780) from an ad link.

| # | Friction | Fix |
|---|---|---|
| 1 | The phone preview on the unlock page was shown at 70% size, so the words inside were about 9px and hard to read | The preview is a true 360 × 660 phone layout shown at 90 to 100% |
| 2 | The preview took touches, so a thumb on the phone could get stuck in it and the page would not scroll | Until the viewer taps **Play** the preview ignores touches, so swiping over it scrolls the page |
| 3 | The first thing in the phone was a dark screen with a small bulb and "Click to light up" | A large Play button with "Tap to open {name}'s gift"; tapping it also lights the room, so the gift starts moving at once |
| 4 | "Your saved gift is kept for 7 more days. After that it is deleted." was bold red text under the button, which reads as an error | The same honest sentence, as a calm amber note inside the price card, above the button |
| 5 | A grey "not refundable" line sat at the bottom with no context | Kept (it is the policy and must be visible) but readable, with a link to the refund details |
| 6 | Nothing near the price said other people had done this and liked it | Real, consented reviews (rating, count, two quotes closest to the gift's occasion) beside the button, from `content/testimonials.json` through `/api/config` |
| 7 | Sharing tools (cover picture, "More apps", QR code) were visible but disabled below the paywall | Hidden while the gift is locked |
| 8 | The payment window was fetched only when the button was pressed, so the first press waited | Razorpay's script is fetched as soon as the unlock page shows |
| 9 | Much of the interface used 10 to 13px text | Every interface rule from 8 to 13px was raised by 1 to 3px (see `scripts` note below); base text is 16px; main buttons are 17 to 19px |
| 10 | The three-step progress row wrapped onto two lines on small phones | On phones only the current step keeps its name |
| 11 | No way to see where people stop | New anonymous events for each payment step, tagged with `env` (`inapp` for Instagram or Facebook, `browser` for the rest) |

## Reading the funnel

Run query 1 in `supabase/queries/funnel.sql` for the whole funnel, then query 6 for the payment steps, split by
browser. Read down the column and find the first step where the number collapses:

| Collapse between | Likely cause |
|---|---|
| `page_view` and `occasion_selected` | The landing page does not match the ad. Send each ad to the page for its occasion (`/for/birthday-wish`) |
| `occasion_selected` and `publish_clicked` | The creator feels like work, or it fails in the in-app browser |
| `publish_clicked` and `unlock_viewed` | Saving the gift fails (check Vercel logs for the create call) |
| `unlock_viewed` and `preview_played` | People do not trust or notice the preview |
| `preview_played` and `pay_clicked` | The price or the offer is the problem |
| `pay_clicked` and `razorpay_opened` | The payment window is slow or blocked |
| `razorpay_opened` and `payment_succeeded` | Payment itself fails; query 7 lists the reasons. Compare `in_app` with `browser` |

## Font sizes

`app/legacy.css`, `app/creator.css`, `app/effects.css` and `app/seo.css` had many rules at 8 to 13px. Rules outside
the gift scenes and phone mockup were raised: 8 and 9 to 12, 10 and 11 to 13, 12 to 14, 13 to 15; base text 15 to
16px. The gift scenes themselves keep their tuned sizes.

## Ads

Send both Meta ads to `https://kholona.in/for/birthday-wish?...`: one tap from there reaches the creator. The home
page adds a step.

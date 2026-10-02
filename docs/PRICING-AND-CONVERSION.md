# Pricing and conversion

Decisions, evidence and design for turning a finished preview into a purchase.

## Decision

| | |
| --- | --- |
| **Price** | **₹199**, one time, for any of the eight gifts. No subscription. Set by the owner on 2 Oct 2026 (history: ₹149, then ₹99, then ₹199). |
| **Included** | A private link only the recipient gets; the link stays live for a full year; their reply comes to you privately; you can edit the gift any time on the same link. |
| **Free** | Building, editing and previewing as often as you like. The gift is saved for 7 days. |
| **Refunds** | None once a gift is unlocked, stated before payment (see [Refund policy](#refund-policy)). |
| **Config** | Payment is always required (no switch). `PAYMENT_PRICE_INR` (optional, default 199) and `PREVIEW_TTL_DAYS`. Checkout is Razorpay: see [Payments](PAYMENTS.md). |

These are starting points to test, not permanent truths. See [Experiments](#experiments).

## What others charge

Prices are from search results, not from the sites themselves (this environment could not open them), so **check each page before you rely on a number**.

| Product | Model | Price |
| --- | --- | --- |
| [Lovely](https://www.lovelydesign.in/blog/birthday-website-for-boyfriend) (India) | One time | Birthday website ₹49; animated card ₹19 |
| [Cutiepage](https://www.cutiepage.in/) (India) | One time per design; no subscription, watermark or expiry; optional password; custom domain +₹20 | From ₹79; birthday ₹100–₹149; anniversary ₹179; Girlfriend's Day ₹349 |
| [WishCupid](https://www.wishcupid.in/) (India) | **Free to build, pay to publish** | From ₹99; birthday ₹199; Valentine's ₹299 |
| [GiftFeels](https://giftfeels.com/birthday-gifts) (India) | Free | Free |
| Etsy Canva templates | You edit a template yourself | Varies |
| [JibJab](https://cinematiccard.com/blog/cinematiccard-vs-jibjab) (US) | Annual subscription | About $18–$48 a year |
| Punchbowl (US) | Monthly subscription | About $2.99–$5.99 a month |
| [Kudoboard](https://www.kudoboard.com/blog/best-ecards/) (US) | Free basic boards | Free |

What this says:

- Indian one-time prices cluster between **₹49 and ₹349**, with **₹99–₹199** the common middle. WishCupid already uses the same model we want (build free, pay to publish), so the model is proven, and so is the risk that free alternatives exist.
- Cutiepage offers a link that never expires. Our one-year link is a real difference; we will need to say clearly why (see [Open decisions](#open-decisions)).

## Why ₹199, and what to watch

₹199 is the owner's decision. For the record, the evidence and the risk:

- **Where it sits.** Indian one-time prices from search results run ₹49–₹349, with ₹99–₹199 the common middle. ₹199 is the **top of that middle**: level with WishCupid's birthday price and above Cutiepage's birthday pages (₹100–₹149). Check those pages yourself, since the numbers came from search snippets.
- **The case for it.** The gift is far richer than a template (eight interactive journeys, a sealed-envelope opening, a photo-reel ending, voice notes, a private reply inbox, scheduled delivery, editing on the same link), and a higher price signals a more serious gift. At ₹199 fees are about 2.4% of the price (Razorpay's standard 2% plus 18% GST on the fee is about ₹4.70, per [Razorpay](https://razorpay.com/blog/razorpay-payment-gateway-pricing-explained/); their page also mentions zero platform fees for new merchants activated on or after 1 July 2026, for up to ₹5 lakh of sales or 90 days: confirm when you sign up).
- **The risk.** Earlier the owner's own reaction to ₹149 was "not worth it". Price is the biggest lever on conversion, and nothing here is proven until real people reach the paywall. Treat ₹199 as a hypothesis and measure it (see [Experiments](#experiments)).

Revenue at 100,000 monthly visitors, for different visitor-to-purchase rates (net of the standard fee, before any offer):

| Visit → paid | Orders / month | Net revenue / month |
| --- | --- | --- |
| 1% | 1,000 | about ₹1.94 lakh |
| 2% | 2,000 | about ₹3.9 lakh |
| 3% | 3,000 | about ₹5.8 lakh |
| 5% | 5,000 | about ₹9.7 lakh |

## The 80% question

**80% of all visitors buying is not a realistic target for any site.** Most visitors are browsing, on the wrong page, or not gifting today. What we can influence is how many people who *build a gift and see it* go on to buy. That is where the design work goes, and where 40–60% is a serious target, because they have put in effort, they are emotionally invested, and the price is small.

| Step | Realistic aim |
| --- | --- |
| Visitor starts a gift | 15–25% |
| Started → finished preview | 50–65% |
| **Finished preview → paid** | **40–60%** (the number to push) |
| Visitor → paid overall | 3–6% |

Measure each step with the funnel events; improve the weakest first.

## Conversion design

The product already does the hardest part: people build the gift **before** paying. The design keeps every honest reason to buy in front of them at the moments they feel it most.

| Principle | What they see | Built |
| --- | --- | --- |
| **Ownership (effort already spent)** | Their gift, named, with their photo and a list of what they made ("your own words · 2 photos · a voice note") at the top of the unlock panel | Yes |
| **The gift is blocked, not absent** | "Sarah can't open it yet." | Yes |
| **A real deadline** | "Your saved gift is kept for 7 more days. After that it is deleted." Every word is true: the daily cleanup deletes it | Yes |
| **Peak-end timing** | A bar during the preview says "Preview · not sent yet · Unlock · ₹199"; at the ending scene it becomes "This is what Sarah will feel. Unlock it and send it." | Yes |
| **Price and terms up front** | Price stated on the last step before saving, on the unlock panel and on the button; "one-time · no subscription"; refund rule shown before payment | Yes |
| **Low perceived risk** | "Previewing is free, so look as often as you like" | Yes |
| **Less to decide** | One price, one link lifetime, no plans to compare | Yes |
| **Fewer steps to pay** | UPI one-tap on phones, no account, no login | With Razorpay |
| **Bring them back** | A reminder before the saved gift is deleted | Later: needs an email or WhatsApp opt-in |
| **A date that matters** | "When should they open it?" ties the purchase to a real day | Later |
| **Real social proof** | "Gifts sent this month", recipient reactions with consent. Only real numbers | Later, once there is data |

### What we will not do

These work in the short term and are prohibited or risky. India's Central Consumer Protection Authority issued guidelines in 2023 naming 13 "dark patterns" ([IAPP](https://iapp.org/news/a/india-s-ccpa-guidelines-on-dark-patterns-welcome-signal-but-law-is-still-soft), [Legal500](https://www.legal500.com/intelligence/india/consumer-protection/ccpas-guidelines-on-dark-patterns-an-overview)), including false urgency, confirm-shaming, basket sneaking, forced action and trick questions. Beyond the law, they cost trust, and this product sells trust.

- No fake countdown timers, "only N left", or invented "X people are viewing".
- No confirm-shaming ("No, I don't love her enough").
- No hidden fees, pre-ticked add-ons or price changes at the last step.
- No forced account creation, and no making it hard to leave.
- No invented testimonials or numbers.

If a tactic needs to be false to work, it is not in.

## Refund policy

You asked for no refunds. That is a clear, fair policy for a digital product **when it is disclosed before payment**, and previewing is free, so a buyer has already seen exactly what they get. The rule appears in the unlock panel above the button, and will also be in the Terms and Refund pages and at checkout.

My recommendation, for you to confirm: **no refunds for change of mind, but** refund automatically for (1) a duplicate or failed charge, and (2) a gift that cannot be delivered because of a fault on our side. Payment providers and consumer rules expect a clear policy, and these two cases protect you from chargebacks at no real cost.

## Experiments

Start at ₹199, then test with real traffic. Measure **revenue per paywall view**, not conversion alone: a cheaper price converts more but may earn less.

1. **Price:** ₹149 vs ₹199 vs ₹249 (about 300 paywall views each before deciding). `PAYMENT_PRICE_INR` changes it without a code change.
2. **Seasonal:** ₹199 or a themed price in the days before Valentine's Day, Raksha Bandhan and Diwali.
3. **Panel copy:** "Sarah can't open it yet" vs a neutral headline.
4. **Deadline framing:** "7 more days" vs a date.
5. **Optional add-ons at checkout,** never pre-selected: for example a printable QR card.

## Open decisions

- **Link lifetime.** One year is included. Cutiepage advertises a link that never expires, and storage costs are tiny, so "never expires" is affordable. The trade-off is a permanent public link to personal photos and a promise you would have to keep. Decide before launch.
- **The refund carve-outs** above.
- **The "No automatic expiry" option** in the old creator now does not apply once payments are on, because the paid lifetime is fixed.
- **Sign-up for reminders:** email or WhatsApp opt-in, needed for the "saved gift about to be deleted" nudge.

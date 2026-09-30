# Conversion levers

What moves a visitor to a purchase, what evidence backs it, what is built, and how each lever is measured. Pricing and the paywall itself are in [Pricing and conversion](PRICING-AND-CONVERSION.md).

## The levers and the evidence

Evidence comes from published guides and studies; treat the percentages as direction, not promises. Your own funnel data outranks all of it.

| Lever | What the research says | What we built |
| --- | --- | --- |
| **Speed** | A 0.1 s faster mobile load improved retail conversion about 8% in the Google/Deloitte study of 37 brands and 30 million sessions ([web.dev](https://web.dev/case-studies/milliseconds-make-millions)). Other guides report pages under 3 s converting markedly better ([Passionfruit](https://www.getpassionfruit.com/blog/how-to-optimize-landing-pages-for-higher-conversions-the-2026-guide-with-industry-benchmarks)) | Motion is transform and opacity only; the first screen is never animated in; layout shift is tested (< 0.1) on every run; the JavaScript budget stays near 220 KB |
| **A clear headline and one focused call to action** | Headline clarity, one CTA and short simple copy top the lists of high-impact fixes ([Apexure](https://www.apexure.com/blog/what-is-landing-page-optimization-and-how-to-get-started), [ConvertCart](https://www.convertcart.com/blog/landing-page-optimization)) | One main button that says what you get ("Make a gift, free preview"); the eight occasions as chips in the first screen; the same call to action repeats in the sticky bar and the price strip |
| **Try before you decide** | Showing value before the paywall, at a moment of high motivation, and stating the price plainly are the common thread of high-converting paywalls ([RevenueCat](https://www.revenuecat.com/blog/growth/guide-to-mobile-paywalls-subscription-apps), [Apphud](https://apphud.com/blog/design-high-converting-subscription-app-paywalls)) | Building and previewing are free; the demo button sits beside the main button; the unlock bar during preview grows at the ending scene; the price is on the landing page, the last step, the panel and the button |
| **Action-oriented, transparent buttons** | Say what the user gets, not "Subscribe"; hard-to-find pricing destroys trust (same sources) | "Make a gift, free preview", "Unlock & get link · ₹149", "Save & continue"; terms above the button |
| **Few choices** | More than about three plans usually lowers conversion (same sources) | One price, one link lifetime |
| **Mobile and India checkout** | Full-width buttons, 44 px targets, UPI intent (opens the customer's UPI app with details filled in), few fields and speed under about 2.5 s ([Razorpay](https://razorpay.com/blog/mobile-optimized-checkout-flows/), [UPI intent vs collect](https://razorpay.com/blog/upi-intent-vs-collect-success-rates/)) | 44 px targets and full-width primary buttons everywhere; sticky bar on phones; UPI intent arrives with the Razorpay integration |
| **Motion that helps** | 100 ms feels instant, 200–300 ms suits panels, ~500 ms starts to feel like a drag ([NN/g](https://www.nngroup.com/articles/animation-duration/)) | Press feedback 100 ms, panels 260–320 ms, chips 340 ms; nothing near 500 ms except one slow scroll-in |
| **Pick up where you left off** | Hypothesis: people who started are the warmest visitors you will ever get | A resume card for a saved gift, fixed at the bottom so it never moves the page |

## What is built

**Landing page**

- Trust row: "Preview it free · One link, works on WhatsApp · No account needed", plus "Pay only when you send it" once payments are on.
- Demo button beside the main button ("Step inside this little surprise").
- Occasion chips in the first screen, with a short staggered entrance.
- "How it works" rewritten to describe what actually happens (make it, preview it free, send one link).
- Price strip ("Free to build. ₹149 to send.") with the terms, shown only when payments are on.
- Sticky call to action on phones once the hero button is out of view; it steps aside while the gift chooser or the resume card is on screen.
- Resume card for a gift someone started, with a dismiss button.
- Sections below the first screen fade and rise into view as they arrive (once, 420 ms).

**Creator and paywall**

- Each step slides in; the mood you pick pops; the Next button gets a soft pulse once the name is in.
- The unlock panel slides up and the price pops; the main buttons breathe with a soft ring (compositor-only, calm enough to ignore).
- A small celebration (confetti) on a successful unlock.

**Guardrails**

- Everything degrades: without JavaScript nothing is hidden; with reduced motion nothing animates.
- Layout shift under 0.1 and colour contrast are checked in the automated tests.

## Measuring each lever

New events (anonymous, no typed text): `occasion_selected` with `kind` = chip, card or page_link; `demo_opened`; `resume_clicked`; `sticky_cta_clicked`; `price_strip_cta_clicked`; `unlock_clicked` with `kind` = panel or preview_bar. Query 4 in [`supabase/queries/funnel.sql`](../supabase/queries/funnel.sql) shows which are used.

Judge each lever by revenue and completed gifts, not clicks: a lever that gets attention but doesn't lift completed gifts should go.

## What we will not do

No fake urgency or scarcity, no confirm-shaming, no hidden costs or pre-ticked extras, no invented numbers or testimonials. See [Pricing and conversion](PRICING-AND-CONVERSION.md#what-we-will-not-do).

## Next levers

1. **UPI intent checkout** (with Razorpay): the biggest checkout lever for Indian mobile buyers.
2. **A reminder before a saved gift is deleted**, by email or WhatsApp opt-in.
3. **Real social proof** once there is data: gifts sent, reactions shared with consent.
4. **"When should they open it?"** to tie the purchase to a real date.
5. **A/B tests** on the headline, the button label, the price and the unlock panel copy (see the experiments list).
6. **Speed work:** measure Largest Contentful Paint on a mid-range Android phone on a throttled connection and split the gift engine so the landing page loads less code.

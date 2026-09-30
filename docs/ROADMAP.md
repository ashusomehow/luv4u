# Luv4u roadmap: organic growth → paid product

Goal: become a discoverable, paid product. Build order matters: SEO has a long lag, so it starts early; payments come last but the data model is prepared earlier.

## Targets (measure, don't assume)

| Metric | Target | Reality check |
| --- | --- | --- |
| Monthly organic visitors | 100K | Typically 6–18 months of consistent SEO work for a new site |
| Visitor → started a gift | 15–25% | Strong for a tool with instant value |
| Started → finished preview | 50–65% | Needs a fast, low-friction wizard |
| Preview → paid | **10–25%** | This is the paywall conversion to optimise |
| Visitor → paid (overall) | **1–3%** | 100K × 2% ≈ 2,000 orders/month |

A 70% purchase rate is not a realistic target for any funnel with cold organic traffic. E-commerce averages 2–4% of visitors. A more useful stretch goal: 30–40% of people who *reach the paywall with a finished, personalised preview*, because emotional, personalised, time-boxed purchases convert far above average. Track each step and improve the weakest one.

## Phase 0: Foundations

- [x] Privacy-friendly analytics with funnel events (landing → occasion chosen → name typed → preview → paywall → paid → shared → recipient opened → recipient clicked "make one")
- [x] CI on GitHub Actions: typecheck, lint, tests, build on every PR
- [ ] Separate Supabase project for Preview deployments; production keys only on Production (documented in `docs/DEPLOYMENT.md`; needs you to create the project)
- [ ] Set `NEXT_PUBLIC_SITE_URL`, rotate the Supabase service key, back up `RATE_SALT` (owner actions)
- [x] Playwright end-to-end smoke test in CI (create → open → reply → delete)

## Phase 1: UX research and audit

- [x] Heuristic review of the full flow on mobile and desktop: see `docs/UX-AUDIT.md`
- [x] Map the funnel and write hypotheses per drop-off point (in `docs/UX-AUDIT.md`)
- [ ] 5-user moderated tests: script and note sheet are ready in `docs/UX-AUDIT.md`; the sessions themselves need real people
- [x] Redesign the creator: three steps, occasion chips on the first screen, compact live card on phones, first preview in about 12 seconds with only a name (scripted). Desktop side preview still generic: see `docs/UX-AUDIT.md`
- [ ] Copy pass: step names and internal jargon done; benefit-led headlines and sample gifts still to do, then validate wording with real users
- [ ] Accessibility pass: contrast and tap targets done and guarded by tests; keyboard, screen-reader and reduced-motion review still to do

## Phase 2: Visual polish and motion

- [x] Design tokens and a short design guide (`app/tokens.css`, `docs/DESIGN.md`); older stylesheets map onto the same palette
- [~] Landing page: demo button beside the main button, trust row, chips, sticky CTA, resume card, price strip (see `docs/CONVERSION-LEVERS.md`). A truly playable demo inside the hero is still to do
- [x] Panel transitions, micro-interactions and an unlock celebration (CSS + small JS, transform/opacity only, honouring `prefers-reduced-motion`). Recipient-scene effects are unchanged
- [x] Performance: Lighthouse (mobile settings, local build) Performance 97–99, Accessibility 100, SEO 100 on the home, occasion and idea pages. The fade-in on the first screen was delaying the headline (LCP 3.2 s → 2.4 s) and is gone
- [ ] Progressive move of the engine from one imperative script to typed React components (creator first)

## Phase 3: Organic traffic (starts early)

- [x] **Fix duplicate content**: each `/for/<occasion>` page gets its own server-rendered H1, lead, button, intro, journey, tips, example lines, FAQ (with FAQPage/Breadcrumb structured data), internal links and share image
- [x] 14 long-tail pages under `/ideas` (person × moment, each with real advice, example lines and FAQ), an index, sitemap entries and links from the occasion pages. More can be added in `lib/ideas.ts`; tests guard uniqueness and depth
- [x] `/examples`: a sample of every gift people can open (`/#demo=<occasion>`), each explained on an indexable page
- [ ] Structured data (Product/FAQ/HowTo), per-page Open Graph images, clean sitemap
- [ ] Blog and templates: gift ideas, message wording, occasion calendars (Valentine's, Raksha Bandhan, Diwali, Mother's Day, and so on)
- [x] Recipient growth loop: the end screen offers "Make someone else's day", tracked as `make_your_own_clicked`
- [ ] Search Console and Bing Webmaster setup, index-coverage monitoring: **do this once, after the custom domain is bought** (attach it in Vercel, set `NEXT_PUBLIC_SITE_URL`, redirect the `vercel.app` address, verify a Domain property via DNS, submit `/sitemap.xml`)
- [ ] Localisation: Hindi and other regional languages

## Phase 4: Preview first, pay after (Razorpay)

Order in the product: make gift → full preview → pay → get shareable link.

- [x] Gift status model: `preview → paid → expired`, enforced server-side (an unpaid gift never gets a public recipient link). Behind `PAYMENTS_REQUIRED`, off by default; see `docs/DEPLOYMENT.md`
- [x] Pricing decision (single price, INR) and a clear "what you get" screen: ₹99 one-time, see `docs/PRICING-AND-CONVERSION.md`
- [ ] Razorpay Orders API: create order server-side, verify the payment signature server-side, handle webhooks idempotently
- [ ] Paywall UX: unlock panel, unlock bar during preview and the ending-scene nudge are built (behind `PAYMENTS_REQUIRED`); UPI-first checkout arrives with Razorpay
- [ ] Payment success: unlock link, receipt/invoice email, edit-key recovery email
- [ ] Refund and failed-payment handling; test mode → live mode checklist
- [x] Terms, Privacy, Refund/Cancellation and Contact pages (fill in business name, contact email and grievance officer; get them read by a lawyer). GST invoice details are still to do with Razorpay
- [x] Update all "no payment" copy across landing pages, metadata and README (done, and a test guards it)

## Phase 5: Growth and retention

- [ ] Optional email capture at checkout (edit link, anniversary/birthday reminders → repeat purchases)
- [x] Scheduled delivery: pick an opening time (up to 120 days ahead); until then the link says "not yet" and reveals nothing
- [ ] Share formats: WhatsApp message, Instagram Story image, QR code for printed cards
- [ ] Referral: "give a friend a discount"
- [ ] Social proof: anonymised counts, testimonials, recipient reactions (with consent)
- [ ] A/B tests on price, paywall copy and preview length

## Phase 6: Launch readiness

- [x] Rate limiting on create, upload, reply and report
- [x] Abuse reporting and admin takedown; moderation rules in the Terms; runbook in `docs/OPERATIONS.md`
- [~] `/api/health` and error boundaries are in; add the uptime monitor and (optionally) Sentry: see `docs/OPERATIONS.md`
- [~] Procedure written (`docs/OPERATIONS.md`); the drill itself needs you
- [~] `scripts/loadtest.js` (k6) is ready; run it against a Preview deployment
- [ ] Physical iOS/Android device pass (audio, microphone, tilt, share sheets)

## Suggested order

1. Phase 0 (a few hours)
2. Phase 3 "fix duplicate content" and the first programmatic pages (indexing takes weeks, so start now)
3. Phase 1 research and redesign, in parallel with content work
4. Phase 2 polish on the redesigned screens
5. Phase 4 payments
6. Phases 5 and 6 before public promotion

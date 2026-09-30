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

- [ ] Heuristic review of the full flow on mobile and desktop (most gift traffic arrives from WhatsApp on phones)
- [ ] Map the funnel and write hypotheses per drop-off point
- [ ] Usability script and 5-user moderated tests (recruit people who recently gave a gift); record where they hesitate
- [ ] Redesign the creator: live preview always visible, fewer steps, first preview in under 60 seconds with only a name
- [ ] Copy pass: benefit-led headlines, remove jargon ("little touches", "vibe"), clear sample gifts
- [ ] Accessibility pass: keyboard, screen reader, contrast, reduced motion

## Phase 2: Visual polish and motion

- [ ] UI review and design tokens (type scale, spacing, colour, radius) so new screens stay consistent
- [ ] Landing page redesign with a live, playable demo above the fold
- [ ] Page and scene transitions, micro-interactions, celebratory finales (CSS + small JS, GPU-friendly, honouring `prefers-reduced-motion`)
- [ ] Performance budget: the 250 KB inline engine is split and lazy-loaded; Lighthouse ≥ 90 on mobile
- [ ] Progressive move of the engine from one imperative script to typed React components (creator first)

## Phase 3: Organic traffic (starts early)

- [x] **Fix duplicate content**: each `/for/<occasion>` page gets its own server-rendered H1, lead, button, intro, journey, tips, example lines, FAQ (with FAQPage/Breadcrumb structured data), internal links and share image
- [ ] Programmatic long-tail pages: occasion × relationship × intent (for example "birthday website for girlfriend", "apology message for friend", "anniversary gift ideas for husband")
- [ ] Public example gallery: real demos people can open, each indexable
- [ ] Structured data (Product/FAQ/HowTo), per-page Open Graph images, clean sitemap
- [ ] Blog and templates: gift ideas, message wording, occasion calendars (Valentine's, Raksha Bandhan, Diwali, Mother's Day, and so on)
- [ ] Recipient-page growth loop: "Make one for someone" CTA on every gift page, plus a small "Made with Luv4u" mark
- [ ] Search Console and Bing Webmaster setup, index-coverage monitoring: **do this once, after the custom domain is bought** (attach it in Vercel, set `NEXT_PUBLIC_SITE_URL`, redirect the `vercel.app` address, verify a Domain property via DNS, submit `/sitemap.xml`)
- [ ] Localisation: Hindi and other regional languages

## Phase 4: Preview first, pay after (Razorpay)

Order in the product: make gift → full preview → pay → get shareable link.

- [ ] Gift status model: `draft → preview → paid → expired`, enforced server-side (an unpaid gift never gets a public recipient link)
- [ ] Pricing decision (single price vs tiers; INR first) and a clear "what you get" screen
- [ ] Razorpay Orders API: create order server-side, verify the payment signature server-side, handle webhooks idempotently
- [ ] Paywall UX: preview shown with a soft lock, not a wall; UPI-first on mobile
- [ ] Payment success: unlock link, receipt/invoice email, edit-key recovery email
- [ ] Refund and failed-payment handling; test mode → live mode checklist
- [ ] Legal pages Razorpay needs for activation: Terms, Privacy, Refund/Cancellation, Contact; GST invoice details
- [ ] Update all "no payment" copy across landing pages, metadata and README

## Phase 5: Growth and retention

- [ ] Optional email capture at checkout (edit link, anniversary/birthday reminders → repeat purchases)
- [ ] Scheduled delivery ("open at midnight on their birthday")
- [ ] Share formats: WhatsApp message, Instagram Story image, QR code for printed cards
- [ ] Referral: "give a friend a discount"
- [ ] Social proof: anonymised counts, testimonials, recipient reactions (with consent)
- [ ] A/B tests on price, paywall copy and preview length

## Phase 6: Launch readiness

- [ ] Rate limiting and bot protection on create/upload/reply endpoints
- [ ] Abuse reporting and takedown flow; content moderation policy
- [ ] Error monitoring and uptime alerts
- [ ] Backups and a restore drill for Supabase
- [ ] Load test around a viral spike (a WhatsApp forward can send thousands of visits in an hour)
- [ ] Physical iOS/Android device pass (audio, microphone, tilt, share sheets)

## Suggested order

1. Phase 0 (a few hours)
2. Phase 3 "fix duplicate content" and the first programmatic pages (indexing takes weeks, so start now)
3. Phase 1 research and redesign, in parallel with content work
4. Phase 2 polish on the redesigned screens
5. Phase 4 payments
6. Phases 5 and 6 before public promotion

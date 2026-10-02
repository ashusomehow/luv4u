# Kholona v4 — Launch Checklist (Next.js · Supabase · Vercel)

## 1. Code

- [x] Next.js (App Router) + TypeScript project, Tailwind v4, Vercel config
- [x] Backend ported from Cloudflare Worker to Next.js route handlers on Supabase (Postgres + Storage)
- [x] `npm run typecheck`, `npm run lint`, `npm test` (API tests against an in-memory Supabase fake) and `npm run build` pass
- [x] Verified in Chromium against a local Supabase-compatible mock: create with photo upload, recipient link, share metadata, standalone HTML export (offline), edit, replies inbox, delete
- [ ] Run the same manual pass against your real Supabase project and a Vercel preview deployment

## 2. Accounts and configuration — operator

- [ ] Create the Supabase project; apply `supabase/migrations/0001_init.sql`
- [ ] Confirm the `gift-media` bucket exists and is public, and RLS is enabled on the three tables
- [ ] Create the Vercel project from the GitHub repo
- [ ] Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RATE_SALT`, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET` (see `docs/DEPLOYMENT.md`)
- [ ] Save `RATE_SALT` somewhere safe; changing it invalidates every edit key
- [ ] Go live on kholona.in: follow `docs/DOMAIN.md` (attach domain, set `NEXT_PUBLIC_SITE_URL`, redirect the old address, Search Console and Bing)
- [ ] Set usage and billing alerts on both Vercel and Supabase
- [ ] Designate a support/abuse contact

## 3. Post-deploy smoke test

- [ ] `/api/config` reports `hosted: true` and eight occasions
- [ ] `/robots.txt` and `/sitemap.xml` use the production origin
- [ ] Each `/for/<slug>` page has its own title, description and canonical URL
- [ ] Create a gift with a photo and a voice note; open the `/g/<id>` link on a second device
- [ ] Paste the link into WhatsApp/iMessage and confirm the social preview (and the discreet-preview option)
- [ ] Send a reply; confirm it appears in the private inbox
- [ ] Edit the gift; confirm the same link updates
- [ ] Delete the gift; confirm the link 404s and its files are gone from Storage
- [ ] Trigger `/api/cron/cleanup` once with the cron secret and check the response

## 4. Safety and operations

- [x] Gift pages and API responses are `noindex`; bearer-link and permanent-copy notices are in the creator UI
- [x] Wrong edit key is rejected on edit, delete, recovery and stats
- [x] Server-side limits: field lengths, media types and sizes, files per gift, reply length and per-visitor cap
- [ ] Physical iOS/Android checks: audio, microphone, tilt, sharing
- [ ] Keyboard and screen-reader pass
- [x] Rate limiting on create, upload, reply and report (database-backed, fails open): see `docs/OPERATIONS.md`
- [x] Abuse reporting (`/report`, link on every opening screen) and admin takedown; Terms, Privacy, Refund and Contact pages
- [x] `/api/health` for uptime monitors; error pages in place
- [ ] Run `supabase/migrations/0003`, `0004` and `0005` (all safe to run any time, in order)
- [ ] Set `ADMIN_TOKEN`, `NEXT_PUBLIC_BUSINESS_NAME`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_GRIEVANCE_OFFICER` in Vercel
- [ ] Have a lawyer read Terms, Privacy and Refunds before you take payments
- [ ] Payments: run `supabase/migrations/0006_payments.sql`; set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`; add the webhook (events `payment.captured`, `order.paid`); do one real test-mode payment; then follow the go-live list in `docs/PAYMENTS.md` (live keys, live webhook, `PAYMENTS_REQUIRED=true`)
- [ ] Add an uptime monitor on `/api/health`; set Vercel and Supabase usage alerts
- [ ] Take a manual database backup and do one restore drill (`docs/OPERATIONS.md`)
- [ ] Run `scripts/loadtest.js` against a Preview deployment
- [ ] Send yourself a test report and practise the takedown with `curl` on a throwaway gift

## 5. Distribution

See `LAUNCH-PLAN.md` sections 4–8 (safety, device testing, measurement, distribution, search). Sections 2, 3 and 9 there describe the previous Cloudflare stack and are superseded by `docs/DEPLOYMENT.md`.

# Session handover: Kholona

Written 2026-10-17 for whoever (or whichever session) picks this up next. No secrets are in this file; env var
values live in Vercel and the Supabase dashboard.

## 1. What this is

**Kholona** (kholona.in) sells small interactive gift websites. A sender picks an occasion, adds a name, a note and
photos, previews free, pays **₹199** once through Razorpay, and shares one link. Stack: Next.js 16 App Router +
TypeScript, Supabase (Postgres and Storage), Vercel, Razorpay. The gift engine itself is an imperative client script
(`public/legacy/app.js`) behind the React shell.

- Repo: `ashusomehow/luv4u`. `main` is deployed to production on Vercel.
- Working branch for this session: `claude/friendly-gauss-zxyik3`. It is **fully merged**; the last merge is PR #22
  (`9d971a7`). To continue, restart it from the latest `origin/main`
  (`git fetch origin main && git checkout -B claude/friendly-gauss-zxyik3 origin/main`).
- Standing user rules: open a PR and merge **only when asked** ("create PR and merge" = open PR, wait for green CI
  check `check`, merge with a merge commit, say what to verify). Commit trailers and PR footers follow the
  attribution reminder in the session. Do not put ad or creator marketing files in git.

## 2. What shipped this stretch (all merged to `main`)

| PR | What |
|---|---|
| #19, #20 | Meta Pixel plus Conversions API tracking (`lib/meta.ts`, `public/legacy/meta.js`), shared event ids `ic_<order>` / `purchase_<order>`; brand kit (`docs/BRAND.md`) |
| #21 | Unlock-page conversion pass: true 360x660 phone preview with tap-to-play (no scroll trap), amber "saved for N days" note, real reviews beside the price, Razorpay script preloaded, font sizes raised across CSS, shorter gift journeys (tilt button removed, auto-advance after hearts and bouquet), payment funnel events (`unlock_viewed`, `preview_played`, `pay_clicked`, `razorpay_opened`, `payment_dismissed`, `payment_failed`, `payment_succeeded`, all with `env` = `inapp`/`browser`). Notes: `docs/UNLOCK-CONVERSION.md`; SQL queries 6 and 7 in `supabase/queries/funnel.sql` |
| #22 | **Creator referral programme** (see section 3) |

Razorpay is **live** (user switched keys and the live webhook, and made one real payment). Meta events appear in
Events Manager.

## 3. Referral programme (built, merged, needs one DB step if not yet done)

- Migration `supabase/migrations/0008_referrals.sql` (tables `referrers`, `referral_clicks`, `referral_payouts`;
  columns `ref_code`, `discount`, `buyer_phone_hash`, `buyer_email_hash`, `ref_excluded` on `payments`).
  **The user reported adding a test creator and that it works, so the migration has been run.** Until it is run, codes
  are silently ignored (everyone pays ₹199).
- Rules (also in `app/terms/page.tsx` and `docs/REFERRALS.md`): buyer gets **₹30 off (₹169)**, env
  `REFERRAL_DISCOUNT_INR`. Weekly (Mon to Sun, India time) tiers on **every** sale that week: 1 to 9 = 20%, 10 to 19 =
  30%, 20+ = 50%. Commission on what the buyer paid. Paid manually by **IMPS every Friday**; under ₹100 rolls over.
  Creator's own purchases never count; repeat buyers the same week are flagged. Constants are in `lib/referrals.ts`
  (`TIERS`, `MIN_PAYOUT_PAISE`).
- Surfaces: `/r/CODE` (cookie `kholona_ref`, 30 days, `?to=proposal` etc.), unlock page auto-applies the code or
  lets the buyer type/remove it, `/api/referral?code=` (checks a code), `/admin/referrals` (tracker, needs
  `ADMIN_TOKEN`), `/r/CODE/stats?key=...` (creator's private page), `/api/admin/referrals` (JSON for both).
- Same PR also made checkout requests send cookies (`credentials` option in `api()`), which is what lets Meta
  `_fbc`/`_fbp` reach the Conversions API.
- Reel-gift refund (a business rule the user added, not in code): a creator makes one gift for their reel, pays with
  their code, posts the reel and shares the link, then the user refunds it manually in the Razorpay dashboard and, if
  the sale is not auto-flagged as the creator's own, presses **Yes · leave out** on it in the tracker. A "Refund
  reel gift" button was offered and deferred.

## 4. Marketing assets (NOT in git)

Made in the session scratchpad, which is **ephemeral**; copy them out if you need them:

- `/tmp/claude-0/-home-user-luv4u/39e4be48-4821-5945-a694-b931e3f91e79/scratchpad/pitch/Kholona-Creator-Programme.pdf`:
  8-page creator pitch, 9:16. The user's PDF viewer showed boxes on pages 1 and 2 (blurred shadows, tilted phones,
  gradient background), so the PDF is now built from page images (JPEG, about 3 MB) to look identical everywhere.
  Gradient-clipped headline text also produced outlined boxes in real PDF output; keep headlines a solid colour.
- `.../pitch/Kholona-Creator-Earnings.png`: 1080x1350 earnings image for Instagram DMs.
- Source HTML: `.../pitch/pitch.html`, `.../pitch/earnings.html`; renderers `.../pitch/render2.mjs` (page images),
  PyMuPDF venv at `.../pitch/venv` (assembles the PDF). Fonts in `.../pitch/fonts`.
- Earlier ad work (videos, end cards, brand artifact) is in the same scratchpad (`vid/`, `brand.html`).

Earnings content decisions: **no cap** on earnings; example table shows 10/20/40/60/100 sales a week, with 60 a week =
₹20,280 a month (month = 4 weeks, on ₹169). The user asked to claim "people are already earning" and "more than
20k easily"; the first was **not** used because no creator has earned yet, and "easily" was replaced with a footnote
that earnings are examples, not a promise (advertising-regulator risk). Once real payouts exist, an "creators are
earning ₹X a week" line using tracker numbers would be fine.

Creator outreach is handled by the user's **agency** (Phase 3 was skipped by request). Welcome-message template with
link, code and private stats link was given in chat.

## 5. Open items for the user

1. Pause the `TEST` creator in the tracker so it does not show in numbers.
2. Open the ad link **inside Instagram/Facebook**, play the preview and pay with UPI. This in-app-browser path is the
   biggest unverified suspect for ~1,000 visits with no purchase (it could not be tested from the sandbox).
3. After a day of traffic, run funnel queries 1 and 6 (Supabase SQL editor) and look for the first big drop.
4. `NEXT_PUBLIC_CONTACT_EMAIL` is set to `kholonasupport` (not a full address). Fix it; optionally set
   `NEXT_PUBLIC_GRIEVANCE_OFFICER`.
5. Send both Meta ads to `https://kholona.in/for/birthday-wish?utm_...`.
6. Confirm the TDS wording (section 194H, PAN) with a CA; the tracker does not calculate TDS.
7. Search Console and Bing setup (steps in `docs/DOMAIN.md`) is still not done; Valentine's week is the biggest search
   peak.

## 6. Research finding on cheaper ad channels (advisory only)

Public India pricing is thin and vendor-written, so nothing is proven cheaper than Meta, which is already cheap (CPM
roughly ₹60 to ₹250, Reels lower). At about ₹195 per sale, cost per **sale**, not per click, decides it: the unlock-page
conversion matters more than the platform. Suggested order: keep Meta but judge cost per purchase; test **Snapchat**
(best audience match, about ₹500 a day for 5 to 7 days, stop at about ₹3,000 with no purchase); Google Search on exact
festive phrases with a tight budget; Google Display/Demand Gen as an in-app experiment with placement exclusions.
Skip dating-app ads (no self-serve; reseller list prices are high or conflicting), Telegram Ads (large minimums),
paid-flat-fee influencers (about ₹3,000 to ₹25,000 a reel needs 25+ sales to break even). The commission model pays per
sale. Offered but not written: a one-page test plan with budgets, kill rules and UTM tags.

## 7. How to work in the repo

- Checks: `npx tsc --noEmit -p .`, `npx eslint .`, `npx vitest run` (146 tests).
- End-to-end: build with `NEXT_PUBLIC_SITE_URL=http://localhost:3100 npx next build`, then
  `CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node tests/e2e/run.mjs`
  (ports 3100/3101/3102 and mock Supabase on 54321 must be free). It prints `e2e smoke passed`. The mock
  (`tests/e2e/mock-supabase.mjs`) lists the tables it knows; add new tables there. `./scripts/ci-site-audit.sh` runs
  the page audit.
- Gotchas hit: running a local server may inherit Razorpay keys from a local env file (blank them with
  `RAZORPAY_KEY_ID= RAZORPAY_KEY_SECRET=` for simulated payments); do not put `ps | grep` kill patterns inside a
  shell command that also contains them (kills the shell; use a script file); matching only
  `e2e smoke passed|AssertionError` in monitors avoids `NoFallbackError` noise; `pip` is available through the proxy
  (used for PyMuPDF in a venv).
- Env var names (values in Vercel): `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`,
  `META_CAPI_TOKEN`, `NEXT_PUBLIC_META_PIXEL_ID`, `ADMIN_TOKEN`, `LEGACY_HOST`, `NEXT_PUBLIC_SITE_URL`,
  `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `RATE_SALT`, `CRON_SECRET`,
  `NEXT_PUBLIC_CONTACT_EMAIL`, optional `REFERRAL_DISCOUNT_INR`, `PAYMENT_PRICE_INR`, `META_TEST_EVENT_CODE`
  (removed after testing).
- Docs worth reading first: `docs/REFERRALS.md`, `docs/UNLOCK-CONVERSION.md`, `docs/META-ADS.md`,
  `docs/GIFT-EXPERIENCE.md`, `docs/PAYMENTS.md`, `docs/OPERATIONS.md`, `docs/BRAND.md`.

## 8. Not built / ideas on the shelf

Refund button for reel gifts in the tracker; TDS calculation; GST invoices and automatic refunds; hero visual or demo on
the landing page; in-app-browser handling beyond a UPI failure hint; proposal/sorry/miss-you ad clips; one-page ad test
plan; real "creators are earning" proof line once payouts exist.

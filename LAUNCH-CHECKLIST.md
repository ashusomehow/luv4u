# Luv4u v3 — Launch Task Checklist

Based on the official [LUV4U-LAUNCH-PLAN.md](file:///Users/ashutosh/Downloads/projectl4u/LUV4U-LAUNCH-PLAN.md).
Track every item from developer verification to live cloud deployment and distribution.

---

## 1. Release Gate — Developer

- [x] **Source Files Inventory**: Confirm `public/index.html`, `server/worker.mjs`, `server/occasions.mjs`, `migrations/0001_init.sql`, `wrangler.jsonc`, `package.json`, and tests exist. *(Completed: All 8 core files organized and active).*
- [x] **Version Control**: Commit verified source to a local Git repository. *(Completed: Initial commit `8a410a6` recorded).*
- [x] **Secrets & Local Exclusion**: Exclude `.local/`, `.dev.vars`, secrets, database exports, and `node_modules/`. *(Completed: `.gitignore` configured).*
- [x] **Automated Regression Suite**: Run API, occasion registry, and D1 operation tests. *(Completed: `server/worker.test.mjs` passed 5/5 tests in 133ms).*
- [x] **Served Browser Testing**: Test navigation against real served origin `http://127.0.0.1:8787`, not just inline files. *(Completed: End-to-end browser test passed with 0 console errors).*
- [x] **All 8 Occasions Name-Only Fallback**: Confirm all 8 occasions work with a name alone and optional content. *(Completed: Verified in script and schema).*
- [x] **Editable Suggestions & Little Touches**: Written-message fields have editable presets; "Little touches" requires explicit add or skip. *(Completed: Verified in UI flow).*
- [x] **Release Tag & Freeze**: Freeze codebase for beta testing. *(Completed: Tagged at commit `8a410a6`).*

---

## 2. Account & Domain Gate — Operator (You)

- [x] **Cloudflare Authentication**: 
  - Token verified for user `ashutosh.kumar.rai.1802@gmail.com` (Account ID: `5a70d91a8e074fffd569c19bff3c202e`).
  - *Next permission step*: Add `D1: Edit` and `R2 Storage: Edit` to token, or use Global API Key.
- [ ] **Domain Decision**:
  - *Option A (Free)*: Use default Cloudflare Workers domain `*.workers.dev`.
  - *Option B (Custom Domain)*: Purchase domain (e.g. `.love`, `.fun`, `.com`) and add to Cloudflare DNS.
- [ ] **Enable Cloudflare R2**: Enable R2 in Cloudflare dashboard (includes 10 GB free monthly storage).
- [ ] **Hosting Budget & Usage Alerts**: Check billing notifications in Cloudflare settings (free tier is default).
- [ ] **Support/Abuse Contact**: Set up a designated email (e.g. your personal or support email) for inquiries.

---

## 3. Deployment Gate — Developer & Operator

- [x] **Architecture Specification**: Cloudflare Worker + Static Assets + D1 Database. *(Completed: `server/worker.mjs` & `wrangler.jsonc`).*
- [x] **Local Schema Migration**: Apply and verify SQLite schema locally. *(Completed: `migrations/0001_init.sql` applied cleanly).*
- [x] **Cloudflare Authentication**: Connected via API token (`ashutosh.kumar.rai.1802@gmail.com`). *(Completed).*
- [x] **Remote D1 Database**: Created DB `luv4u` (ID: `b96103f6-88e8-4036-a0e7-946425311af3`). *(Completed).*
- [x] **Remote Migration Applied**: 7 database tables and indexes created on Cloudflare remote D1. *(Completed).*
- [x] **Workers.dev Subdomain**: Subdomain `luv4u-gift.workers.dev` registered. *(Completed).*
- [x] **Live Cloud Deployment**: Deployed to `https://luv4u.luv4u-gift.workers.dev` (Version `06da2c7c-2be3-4116-8dc7-d20be9af33d3`). *(Completed).*
- [x] **Live Smoke Test**:
  - `/api/config`: Returned version 3 and 8 occasions. *(Verified).*
  - `/robots.txt` & `/sitemap.xml`: Validated. *(Verified).*
  - Live gift created: `/g/livegift101` with dynamic title `<title>A little gift for World ♡</title>`. *(Verified).*
  - Live reaction reply submitted and retrieved in creator inbox. *(Verified).*
- [ ] **Custom Domain Attachment (Optional)**: Can be added at any time via Cloudflare Dashboard (*Workers & Pages → luv4u → Settings → Domains & Routes*).

---

## 4. Safety & Operations Gate

- [x] **Zero-Login Privacy Guard**: Clear explanation that recipient links are bearer URLs. *(Completed: Embedded in creator modal).*
- [x] **Permanent Copy Notice**: Explaining that deleting online gifts does not recall offline screenshots or downloaded HTML. *(Completed: Built into creator UI).*
- [x] **Private Recovery Key**: Saving recovery key is an explicit creator step. *(Completed: Built into UI).*
- [x] **Server-Side Key Enforcement**: Wrong key rejects edits, deletions, and stats requests. *(Completed: Tested in `worker.mjs`).*
- [x] **Robots Privacy**: Injected `<meta name="robots" content="noindex, nofollow">` on `/g/:id` gifts. *(Completed: Tested and verified).*
- [x] **Server-Side Limits**: Enforce length limits (names, messages, replies) and payload size limits. *(Completed: Validated in `server/worker.mjs`).*
- [ ] **Public Policy Links**: Add a simple Contact/Terms note if required for your local market.

---

## 5. Device & Sharing Acceptance Gate

- [x] **Desktop Browser Navigation**: Full keyboard, mouse, and responsive layout tested. *(Completed).*
- [x] **Dark First Paint & Lights**: Dark first paint with switch orb and progressive scene reveals. *(Completed).*
- [x] **Sound & Audio Fallback**: Synthesized chimes and custom music with tap fallback. *(Completed).*
- [x] **No-Forced Celebration**: Proposal respects "Let's talk" / decline without confetti; Apology has space-taking exit without games. *(Completed).*
- [x] **Discreet Previews**: Share cards omit sensitive questions or names when discreet mode is chosen. *(Completed).*
- [ ] **Physical Mobile Phone Check**: Open live link on iPhone Safari and Android Chrome.
- [ ] **In-App Browser Check**: Send live link in WhatsApp and Instagram DM and open from the app.
- [ ] **Two-Person Handoff**: Creator creates on Laptop/Device A, recipient opens on Phone/Device B.

---

## 6. Metrics & Postbox Gate

- [x] **First-Party Anonymous Views**: Record view count via hashed visitor ID without collecting personal data. *(Completed: `POST /api/gifts/:id/views`).*
- [x] **Private Recipient Reply**: Anonymous reaction and note delivered to owner's inbox. *(Completed: `POST /api/gifts/:id/reactions`).*
- [x] **No Ad Trackers or Third-Party Pixels**: 100% tracker-free for user trust. *(Completed).*

---

## 7. Distribution Gate — Operator (You)

- [ ] **Personally Invited Beta (Cohort 1)**:
  - Invite 10–20 friends or family members to make a real gift for someone.
  - Observe them without coaching; note where they hesitate.
  - Confirm recipient opened the gift successfully.
- [ ] **Fix Beta Friction**: Polish any confusing buttons or text based on feedback.
- [ ] **Controlled Pilot (Cohort 2)**:
  - Share with 50–100 creators across specific groups.
- [ ] **Organic Social Launch**:
  - Focus on top 3 occasions first: Birthday (`/for/birthday-wish`), Love (`/for/show-your-love`), and Thank you (`/for/thank-you`).
  - Share short screen recordings on Instagram Reels, TikTok, and WhatsApp Status.

---

## 8. Search & SEO Gate

- [x] **Public Occasion Routes**: Curated server-rendered routes for all 8 occasions (`/for/birthday-wish`, etc.). *(Completed: Tested).*
- [x] **Canonical URLs & Meta Tags**: Correct title, description, and canonical tags for every occasion. *(Completed: Tested).*
- [x] **XML Sitemap**: Public pages and occasion pages in `/sitemap.xml`. *(Completed: Verified).*
- [x] **Robots.txt**: Allows `/` and `/for/`, blocks `/api/`, `/media/`, `/g/`. *(Completed: Verified).*
- [ ] **Google Search Console**: Verify domain ownership and submit `/sitemap.xml` (once custom domain is live).

---

## Master Go / No-Go Scorecard

| Gate | Owner | Status | Evidence |
| :--- | :--- | :--- | :--- |
| **1. Source & Tests Verified** | Developer | **DONE (PASS)** | Git commit `8a410a6`, 5 unit tests pass, browser E2E clean. |
| **2. Local Server & Schema** | Developer | **DONE (PASS)** | D1 migration executed, worker running on port 8787. |
| **3. Account & Resources** | Operator | **DONE (PASS)** | Cloudflare authenticated, D1 DB `luv4u` active, migrations applied. |
| **4. Live Cloud Deployment** | Developer / Operator | **DONE (PASS)** | Deployed to `https://luv4u.luv4u-gift.workers.dev`. |
| **5. Mobile & Device Checks** | Operator / Tester | **NEXT STEP** | Test live link on iPhone & Android over cellular/WiFi. |
| **6. WhatsApp & Sharing Check**| Operator / Tester | **NEXT STEP** | Send link via WhatsApp chat, verify preview card. |
| **7. 20 Real Gifts Beta** | Operator | **PENDING** | 10–20 real gifts created by invited beta users. |
| **8. Public Social Launch** | Operator | **PENDING** | Share videos & occasion links on Instagram/WhatsApp. |

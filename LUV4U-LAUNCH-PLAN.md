# Luv4u — deployment and launch plan

Prepared: 10 September 2026
Status: planning document, not a record of a completed deployment.

## The decision

Deploy the complete application on one Cloudflare origin: Workers with Static Assets, D1 for gift data and replies, and a private R2 bucket for uploaded media. Start with a personally invited beta, then promote the birthday, show-your-love and thank-you journeys. Keep every other tested occasion available without marketing all eight at once.

First milestone: **20 gifts made by people other than the developer and opened on their recipients' devices.** These are proposed product milestones, not traffic forecasts or industry benchmarks.

The gift experience stays free of accounts and payment. The operator still needs a hosting account, control of the domain, and responsibility for hosting charges.

## Important release status

The files available for this review include the v3 README and the complete older v2.1 archive. The actual v3 HTML/source archive was not available for inspection. The preceding v3 delivery also described unfinished end-to-end verification.

Do not mistake documentation or screenshots for a deployable, tested release. Obtain or reconstruct the actual v3 source, verify it against the README, and put that release into version control before deploying. Do not combine a v3 frontend with the older birthday-only backend for non-birthday gifts.

Project facts below follow `luv4u-v3/README.md`; the deployment commands and binding names also follow the available v2.1 deployment configuration. Reconcile them with the verified v3 package before running them. Cloudflare commands and pricing were checked against official documentation on the preparation date. [1–9]

## 1. Release gate — developer

- [ ] Confirm `public/index.html`, `server/worker.mjs`, `server/occasions.mjs`, `migrations/0001_init.sql`, `wrangler.jsonc`, `package.json`, and tests exist.
- [ ] Commit the verified source to a private repository, together with a reviewed dependency lockfile.
- [ ] Exclude `.local/`, `.dev.vars`, environment secret files, private media, database exports, edit/recovery files and `node_modules/`.
- [ ] Run the API, birthday, creator-template and occasion regression suites.
- [ ] Test browser navigation against a real served origin, not only the inline test harness.
- [ ] Confirm all eight occasions work with a name alone and with optional content.
- [ ] Confirm every written-message field has editable suggestions and Little touches requires an explicit add-or-skip decision.
- [ ] Tag the tested release and record its commit ID. Freeze new features until the beta completes.

The README specifies Node.js 22.16 or newer. Select a maintained Node release supported by both this project and the installed deployment tooling; record the version used for testing.

```bash
cd luv4u-v3
npm install
npm test
npm run dev
```

Use `npm ci` for repeatable installs once the reviewed lockfile exists. `npm run dev` is a development server, not the production hosting method.

The README documents these additional browser tests. Install their development dependencies in a Python virtual environment, then run them against the verified package:

```bash
python -m pip install playwright pillow
python -m playwright install chromium
python tests/browser_smoke.py
python tests/creator_templates.py
python tests/occasions.py

# In a separate terminal, keep npm run dev running for these:
python tests/browser_smoke.py --connected
python tests/creator_templates.py --connected
python tests/occasions.py --connected
```

These local tests do not replace physical-device, HTTPS, WhatsApp or Cloudflare-runtime checks.

## 2. Account and domain gate — operator

- [ ] Create or secure the Cloudflare account, enable multifactor authentication, and save recovery credentials privately.
- [ ] Choose a domain after checking availability, renewal price and potential brand conflicts. No domain availability is assumed in this plan.
- [ ] Activate the domain in Cloudflare DNS and select one canonical hostname.
- [ ] Activate R2 and review its subscription/billing setup. Its included usage is not a promise of unlimited free storage. [7–8]
- [ ] Set a hosting budget and establish how usage alerts reach the operator.
- [ ] Create a monitored support/abuse contact.
- [ ] Keep staging and production on separate Worker configurations, D1 databases and R2 buckets. Never let test cleanup run on production resources.

Do not add operator-only access protection across the production recipient routes: recipients must still open gifts without accounts. Private development staging can have stricter access.

## 3. Deployment gate — developer and operator

### Architecture

```text
Final HTTPS domain
  └── Cloudflare Worker + frontend static assets
        ├── /                  public landing page
        ├── /for/<occasion>    public occasion pages
        ├── /g/<id>            recipient gifts
        ├── /api/*             publish, edit, replies and configuration
        ├── /media/*           Worker-mediated media delivery
        ├── D1                 gift JSON, ownership hashes, replies
        └── private R2         images, voice, music, share artwork
```

Cloudflare deploys Worker code and Static Assets together. Keep the frontend and API on the same origin rather than introducing another hosting provider and cross-origin configuration for the first release. [1]

### One-time production resource setup

The following assumes the verified configuration uses the documented resource names `luv4u` and `luv4u-media`, with bindings `DB`, `MEDIA`, and `ASSETS`. Stop and reconcile any differences first. Test the equivalent setup with separate staging resources before using the production configuration.

```bash
npx wrangler login
npx wrangler d1 create luv4u
npx wrangler r2 bucket create luv4u-media
```

Copy the returned D1 database ID into `wrangler.jsonc`. Preserve the frontend directory, Worker entry point and resource binding names. Resource names may be changed, but configuration and commands must agree. Keep R2 private; do not enable direct public bucket access. The app's Worker must remain responsible for expiry and deletion checks. [2–3]

Generate a fresh rate-limit privacy secret locally:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Store that value using the secret prompt; never place it in the HTML, repository, public configuration or screenshots:

```bash
npx wrangler secret put RATE_SALT
npx wrangler d1 migrations apply luv4u --remote
npx wrangler deploy
```

`wrangler secret put` can create/deploy a Worker version. Run first-time provisioning before public promotion; treat later secret changes as deployments. [4]

For an existing live installation, do not create replacement resources casually. The v3 README states that the existing schema can store v3 data without a new migration: preserve the existing database, bucket, domain and `RATE_SALT`, back up first, and deploy frontend and backend together.

### Attach the final domain

In Cloudflare: **Workers & Pages → your Worker → Settings → Domains & Routes → Add → Custom Domain**. The domain must be an active zone you control. Cloudflare provisions the associated DNS/certificate for a Worker custom domain. [5]

Attach and test the final origin before creating gifts intended for real sharing. The project documentation says stored media URLs contain the publishing origin. Editing the hostname in a localhost link does not move its database record or media.

- [ ] Open `/api/config` on the deployed domain and verify version 3 and supported occasions, as documented.
- [ ] Confirm the creator UI detects connected mode.
- [ ] Create a fresh gift on the final domain; open its short URL on another device.
- [ ] Confirm the private recovery link is different from the recipient link and is never copied by the recipient Share action.
- [ ] Verify the expiry cleanup schedule and monitor its successful execution.

## 4. Safety and operations gate — before accepting personal media

- [ ] Publish readable privacy, acceptable-use, retention/deletion and contact information, reviewed for the intended launch markets.
- [ ] Explain that anyone with a gift link can read or forward it; no login does not mean no data collection or end-to-end encryption.
- [ ] Explain that deleting the hosted gift cannot erase screenshots, exported HTML or copies already received by others.
- [ ] Make saving the private edit/recovery key an explicit creator action. Explain that loss of both browser storage and the recovery key means losing editing access.
- [ ] Verify wrong-key requests cannot edit, delete or read a gift's private replies.
- [ ] Verify deletion/expiry blocks both gift data and associated media, without exposing R2 directly.
- [ ] Keep request/media limits enforced server-side, not just in the browser.
- [ ] Add publish abuse protection before unrestricted public creation: retain rate limits and consider Turnstile on publishing, not on the recipient's opening scene. Validate Turnstile server-side; the widget alone is insufficient. [10]
- [ ] Establish a monitored report/takedown process and an operator-only removal procedure.
- [ ] Decide and display the gift retention policy; test the corresponding cleanup. Do not silently delete gifts earlier than promised.
- [ ] Add a server-side switch to pause new publishing/uploads during an incident while preserving existing gift reads where safe.
- [ ] Configure sanitized error monitoring and usage alerts. Exclude names, messages, replies, audio, full gift URLs, edit tokens, request bodies and authorization headers. Review provider-level logging defaults too.
- [ ] Back up both database and media, restrict backup access, and test a restore using non-sensitive test data.
- [ ] Test rollback to a version compatible with existing gift payloads. A Worker rollback does not roll back D1 or R2 contents. [14]

These operational additions are requirements of the launch plan, not claims that they are already implemented in v3. Keep consent/privacy explanations in the creator and help surfaces rather than interrupting the recipient's cinematic scenes unnecessarily.

## 5. Device and sharing acceptance gate — tester

Use iPhone Safari, Android Chrome, and the actual browsers opened from WhatsApp and Instagram where available, plus desktop keyboard navigation. Use a modest Android phone and a constrained connection as well as a high-end phone.

| Area | Required evidence |
| --- | --- |
| Name-only | Every occasion reaches a complete, appropriate ending without optional content. |
| Customization | Suggestions fill editable fields, replacements can be undone, optional sections do not trap the creator. |
| Opening | Dark first paint, usable light-up target and progressive reveal; sound-off still works. |
| Media | Photos and cross-device voice playback succeed; missing/unsupported media has a useful fallback. |
| Permissions | Denying microphone or motion never blocks completion; tap candles remain available. |
| Sharing | Copy Link, WhatsApp and native share are tested; manual copy remains available when an API is unsupported. |
| Real handoff | A creator publishes on one device and a second person opens the gift on another network/device. |
| Previews | Shared metadata loads on the final HTTPS origin; discreet mode does not reveal names or private words. |
| Ownership | Recovery, same-link edits, inbox and deletion are checked with both correct and incorrect keys. |
| Proposal | Yes, Let's talk, decline and no-answer paths behave respectfully; replies are never sent automatically. |
| Apology | No forced forgiveness or celebratory confetti; taking space and leaving without replying work. |
| Accessibility | Keyboard, visible focus, screen-reader labels, reduced motion and small-screen layouts are usable. |
| Failure | Interrupted uploads, storage failures and retries do not lose drafts or create confusing duplicate gifts. |
| Compatibility | Old birthday gifts still open after the v3 deployment. |

Native sharing requires a secure context and browser support varies. Retain copy fallbacks. A resolved share operation is not evidence that the recipient received or read the gift. [13]

Do not announce an occasion that has not passed its journey checks. Pause promotion for data-loss, private-key exposure, wrong-recipient content, or widespread publishing/media failures.

## 6. Measure the useful actions — not private content

Add minimal, disclosed first-party instrumentation before broad promotion. The v3 README does not describe an installed analytics tracker; treat this as additional work.

Proposed funnel:

```text
public visit → occasion chosen → creation started → gift published
             → share action → recipient light-up → appropriate ending
             → voluntary creation of another gift
```

- [ ] Record only allowlisted event names and coarse properties such as occasion, campaign source, browser family and success/error category.
- [ ] Do not record field values, recipient/sender names, messages, replies, uploaded media, raw URLs or edit keys.
- [ ] Count the first explicit light-up as a story start instead of treating every gift-page request as a human open.
- [ ] Keep story starts/finishes approximate and separate preview/test activity from recipient activity.
- [ ] Name sharing events `share_intent` or `copy_link`, not `gift_delivered`.
- [ ] Avoid session replay and advertising pixels on private recipient experiences.
- [ ] Review completion separately by occasion. A respectful early exit from an apology or proposal is not automatically a product failure.

For a small beta, direct tester confirmation is better evidence of successful delivery than pretending the app can prove recipient identity. The documented no-login access model does not verify the recipient's identity.

Suggested scorecard: valid publish success, unassisted creation, cross-device media success, appropriate story completion, reported bugs, and voluntary repeat creation. Record raw counts alongside percentages and separate device/occasion differences. Do not optimize reply submission or proposal acceptance as a growth goal.

## 7. Distribution gate — operator

### Personally invited beta

Invite roughly 10–20 creators and ask each to make one real gift. Start with people who genuinely have a birthday, thank-you or affectionate message to send. Observe a few creators without coaching them, then ask what felt unclear, what they expected to happen next, and whether their recipient opened it successfully.

Invitation copy:

> I made Luv4u — a tiny surprise website you can send to someone you care about. It is free to use, and you do not need an account. Would you try making one for a real person and tell me where anything feels confusing? Here is a sample and the create page: [public links]

Use fictional/synthetic demo gifts rather than exposing a real person's gift as the sample. Do not share owner recovery links.

### Controlled pilot

After fixing beta blockers, invite the next 50–100 creators. These are proposed cohort sizes, not promised acquisition results. Promote only the occasions that have passed acceptance testing; keep a monitored feedback contact and review failures during the pilot.

### Organic public promotion

Focus initial messaging rather than advertising eight categories at once:

| Campaign | Creative idea | Destination |
| --- | --- | --- |
| Birthday | Show the real dark-to-fairy-lights moment and a cake tap. | `/for/birthday-wish` |
| Show your love | Unfold a paper heart with an editable affectionate note. | `/for/show-your-love` |
| Thank you | Show a small bouquet reveal and a genuine appreciation message. | `/for/thank-you` |

Treat channel choices as experiments, not established conversion guarantees. Use short vertical screen recordings in WhatsApp Status and Instagram, invite relevant small creators to try the app, and share in communities only with permission. Use music and visual assets you have permission to publish. Obtain explicit permission before using anyone's reactions, names or personal content in promotion.

Suggested hook:

> Not another birthday text. A little world made just for them. ✨

Show the experience before explaining the product. Link to the matching public occasion page. Add campaign parameters only to public acquisition links; do not put recipient identities or recovery keys into campaign tracking.

A proposed tracking path:

```text
/for/birthday-wish?utm_source=instagram&utm_medium=organic&utm_campaign=launch_birthday
```

The recipient-to-creator loop should be a quiet optional “Make a little surprise for someone” action after the ending. Do not gate gifts behind sharing, add a referral pop-up during the story, or insert a promotional prompt into a sensitive apology/decline ending. This is a design requirement, not an assumption about the current UI.

Delay paid ads until you can demonstrate reliable gifting and voluntary sharing in the pilot. Prefer one measured campaign over simultaneous spending across many channels.

## 8. Search launch — public pages only

The v3 README documents `/for/birthday-wish`, `/for/romantic-proposal`, `/for/show-your-love`, `/for/apology-card`, `/for/anniversary`, `/for/thank-you`, `/for/congratulations`, and `/for/miss-you`.

- [ ] Verify these routes really render on the deployed backend and have correct canonical URLs, useful occasion-specific text and a matching create action.
- [ ] Include only public, intended-for-search pages in `/sitemap.xml`.
- [ ] Verify domain ownership in Google Search Console and submit that sitemap. Submission does not guarantee indexing or rankings. [11]
- [ ] Verify gift pages, media and private endpoints have the intended `noindex` controls; keep them out of the sitemap.
- [ ] Do not rely on `robots.txt` alone for privacy or block crawling in a way that prevents a crawler from seeing `noindex`. `noindex` controls search appearance, not access to a bearer gift URL. [12]
- [ ] Compare actual occasion impressions, visits and completed creations before commissioning lots of content or adding more categories.

Maintain the existing visual language. Useful public copy should support the create experience, not turn the landing page into a keyword directory.

## 9. Budget and ongoing operation

Official published allowances checked on 10 September 2026:

| Component | Relevant pricing/limits |
| --- | --- |
| Workers Free | 100,000 requests/day and 10 ms CPU time per invocation. [6] |
| Workers Paid | $5 USD/month minimum account charge; included usage plus usage-based overages. [6] |
| D1 | Free allowance includes 5 million rows read/day, 100,000 written/day and 5 GB total storage. Paid-plan allowances differ. [9] |
| R2 Standard | Included monthly usage: 10 GB-month storage, 1 million Class A operations and 10 million Class B operations; usage beyond allowances is charged. [8] |
| Domain | Separate registration/renewal expense; check the chosen domain's actual price. |

For a public media-enabled beta, reserve at least the Workers Paid base cost plus possible storage/request usage and domain costs. This is a planning recommendation, not a fixed total quote. Test maximum-size uploads before relying on the Free plan's CPU allowance.

The available configuration has `run_worker_first: true`. Requests through that Worker count as Worker invocations; do not interpret free Static Assets as unlimited free traffic for this routing design. [1, 15]

Define an acceptable monthly operating budget and review actual usage before widening promotion. Use application publishing/storage limits as well as provider alerts; alerts should not be treated as a guaranteed spend cap. Retention determines accumulated media storage, so model stored gifts over time rather than only new monthly visits.

- [ ] Review publish errors, media failures, support reports and spend during each rollout cohort.
- [ ] Confirm scheduled cleanup succeeds and queues/backlogs remain bounded.
- [ ] Test a synthetic create/open/edit/delete cycle after every release without using real private gifts in third-party monitoring.
- [ ] Keep deploys reproducible, test before production, and preserve compatibility with previously shared URLs.
- [ ] Expand promotion only after the current cohort's serious issues are resolved.

## Final go/no-go record

| Gate | Owner | Evidence to record | Status |
| --- | --- | --- | --- |
| Source verified | Developer | v3 commit/tag and source inventory | Pending |
| Local and served-browser checks | Developer | Reproducible test results | Pending |
| HTTPS deployment | Developer/operator | Final domain and version-3 config response | Pending |
| Privacy/abuse/retention | Operator/developer | Public policies and tested operations | Pending |
| Cross-device acceptance | Tester | Device, occasion and media test matrix | Pending |
| Monitoring/restore/rollback | Developer/operator | Alert, restore and rollback exercise | Pending |
| 20 real gifts | Operator | Creator/recipient-confirmed outcomes without private content | Pending |
| Controlled pilot | Operator | Reliability and feedback scorecard | Pending |
| Public promotion | Operator | Passed gates, demo assets and public campaign links | Pending |

**Launch sequence: verified source → separate staging → final domain → safety checks → real-device handoff → invited beta → controlled pilot → broader sharing.**

## References

Project sources inspected: `luv4u-v3/README.md`; `luv4u-v2.1.zip` containing `docs/DEPLOYMENT.md`, `docs/SECURITY.md`, `wrangler.jsonc`, and `package.json`. v3 implementation claims remain subject to source and deployed acceptance verification.

Official references checked on 10 September 2026:

1. Cloudflare Workers Static Assets — `https://developers.cloudflare.com/workers/static-assets/`
2. Wrangler D1 commands — `https://developers.cloudflare.com/workers/wrangler/commands/d1/`
3. Wrangler R2 commands — `https://developers.cloudflare.com/workers/wrangler/commands/r2/`
4. Workers secrets — `https://developers.cloudflare.com/workers/configuration/secrets/`
5. Worker custom domains — `https://developers.cloudflare.com/workers/configuration/routing/custom-domains/`
6. Workers pricing — `https://developers.cloudflare.com/workers/platform/pricing/`
7. R2 subscription setup — `https://developers.cloudflare.com/r2/get-started/`
8. R2 pricing — `https://developers.cloudflare.com/r2/pricing/`
9. D1 pricing — `https://developers.cloudflare.com/d1/platform/pricing/`
10. Turnstile server-side validation — `https://developers.cloudflare.com/turnstile/get-started/server-side-validation/`
11. Google: build and submit a sitemap — `https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap`
12. Google: noindex — `https://developers.google.com/search/docs/crawling-indexing/block-indexing`
13. MDN: Navigator.share — `https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share`
14. Cloudflare Worker rollbacks — `https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/`
15. Workers Static Assets billing — `https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/`

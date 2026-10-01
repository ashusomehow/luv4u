# Kholona v4 ♡

**Eight little ways to say it.**

Kholona turns a name and a feeling into a small, interactive gift website. Start from a warm, illustrated landing page, choose an occasion, and make something the recipient opens a little at a time.

No creator or recipient account. **The recipient’s name is the only required detail.** Every journey works with that name alone; personal messages, photos, memories, audio and extra surprises remain optional.

Kholona is a **Next.js** app written in **TypeScript**, styled with CSS (plus Tailwind for new components), animated with CSS and lightweight JavaScript, storing gifts in **Supabase** (Postgres) and photos/audio in **Supabase Storage**, and hosted on **Vercel**. No external font service or generative API is required.

| Layer | Choice |
| --- | --- |
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Hand-written CSS for the gift engine; Tailwind CSS v4 (utilities only, no Preflight) for new UI |
| Animation | CSS animations + a small imperative JS engine |
| Database | Supabase Postgres |
| Images and audio | Supabase Storage |
| Hosting | Vercel (with a daily Vercel Cron cleanup job) |

## Start here

Use **Node.js 22 or newer**.

```sh
npm install
cp .env.example .env.local   # then fill in the Supabase values, see docs/DEPLOYMENT.md
npm run dev                  # http://localhost:3000
```

Without Supabase credentials the app still runs in **standalone mode**: you can create, preview, save local drafts and download a gift as a single HTML file. Hosted short links, uploaded media, editing, the private inbox and opening counts switch on automatically once `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set (the frontend reads `/api/config`).

Deploy to Vercel and connect Supabase by following [Deployment](docs/DEPLOYMENT.md). Hosting accounts and any infrastructure charges are separate from the gift experience itself.

## The eight gifts

| Gift | Its own recipient interaction | Optional occasion-specific detail |
| --- | --- | --- |
| Birthday wish | Light the room, make a wish, extinguish candles, open a gift and celebrate. | Existing birthday photo, note, memory, audio and surprise controls. |
| Romantic proposal | Open an envelope, read the note, reveal an honest question and choose how to respond. | Relationship, date or marriage question; editable wording. A ring appears only for marriage. |
| Show your love | Unfold three little paper hearts with reasons tucked inside. | Up to three personal reasons; blank hearts receive thoughtful fallback lines. |
| Apology card | Open a quieter note, read an optional concrete next step and leave with space. | One realistic commitment, not a request for forgiveness. |
| Happy anniversary | Turn the pages of a miniature storybook, then read a note for this chapter. | A meaningful starting date; photos and memories use the common optional controls. |
| Thank you | Gather three flowers in an interactive gratitude bouquet. | Up to three things you appreciate about the recipient. |
| Congratulations | Step into a warm spotlight and untie a celebration ribbon. | The achievement, milestone or brave step you are celebrating. |
| Miss you | Send a paper hug across a little illustrated route, then read a note from afar. | An extra “until the next hello” message. |

All retain the two-stage **“Click to light up”** opening, warm lighting, room-like full-screen scenes and an optional reply. These are different interactions and story orders, not just different page titles.

## Creator journey

**Landing (pick an occasion from the first screen) → 1. Name & mood → 2. Words & photos → 3. Preview & send → create → share.**

The landing page shows eight occasion chips in its first screen; each starts that gift directly. A small selected-gift ribbon and (on desktop) a side preview keep the choice visible while creating. “Change gift” returns to the chooser; each occasion keeps its own local draft so changing direction does not mix one person’s words with another gift.

Creating takes three steps: **Name & mood** (six moods, with a sensible default per occasion; the apology flow offers only Emotional and Elegant and enforces that when importing or publishing data), **Words & photos** (everything optional), and **Preview & send**. On phones a compact live card on step 2 reflects the note and first photo. The audit behind this design is in [UX audit](docs/UX-AUDIT.md).

### Little touches stay optional, and easy to find

Step 2 opens on the note, followed by photos and voice; memories, a soundtrack, a playful surprise and a final surprise sit under **More little touches**. Suggested wording is collapsed behind a tap on its heading. Skipping never erases what was already added: “Preview & send” is always available.

Every occasion has a complete name-only fallback. The additional proposal question, love reasons, gratitude flowers, anniversary date, milestone and reunion chapter are offered here rather than becoming required setup fields. Technical choices (link type, expiry, name in link previews, WhatsApp reply number) are under **More options** on step 3.

### Editable words, without the blank-page problem

Written-message fields include tap-to-use suggestions. This covers notes, captions, memory labels/stories, hidden messages, quiz questions/answers, final notes, recipient replies and all new occasion-specific written fields. Factual names, dates, URLs and phone numbers are not message-template fields.

Suggestions are occasion-aware; creator message banks also use the selected vibe and recipient name where appropriate. Choosing a preset never sends or publishes it. Text stays editable. Existing handwritten words are protected by **Replace my words / Keep mine**, with **Undo** after replacement. Merely changing the name, vibe, question kind or occasion does not silently overwrite authored words.

Quiz presets insert a complete compatible question/answer set. Date inputs stay date inputs; the anniversary date is validated rather than supplied with invented factual templates.

## Thoughtful response design

**Proposals:** Yes, Let’s talk and Not for me use equally sized, stationary buttons. Continuing without answering is equally possible. A selection creates a local editable response draft, not an automatic notification. A decline, a request to talk, or no answer ends quietly rather than triggering a success celebration.

**Apologies:** No games, confetti, deadline, moving refusal button or forced forgiveness. An early “need some space” route allows the recipient to stop before reading the whole note. A concrete commitment is optional and is only shown when supplied. The recipient can finish without sending a reply.

**All replies:** Emoji selection and template selection do not transmit a reaction. In hosted mode, the recipient explicitly sends the chosen words to the creator. Otherwise they prepare, copy or share a reply themselves. Opening counts are a separate approximate hosted feature; they are not evidence of acceptance or agreement.

## What continues to work from v2.1 and v3

Photo compression and framing; photo/memory reordering with button alternatives to dragging; browser voice recording; uploaded or directly linked audio; music preview/volume; tap-to-extinguish candles and optional microphone blowing; reduced-motion support; optional phone tilt; birthday story-order choices; balloons, scratch reveal, quizzes and mystery gifts; final notes and optional real-world surprise links; downloadable artwork; WhatsApp/native sharing; same-link hosted editing, expiry, deletion and a private creator inbox.

Games are intentionally excluded from apology gifts. New occasions use their own core interaction instead of inheriting birthday candles or birthday-specific language. The birthday branch remains birthday-only.

## Standalone versus connected

| Capability | Standalone (no Supabase) | Connected (Supabase configured) |
| --- | --- | --- |
| All eight creator and recipient journeys | Yes | Yes |
| Local drafts, preview, editable templates | Yes, subject to browser storage | Yes, subject to browser storage |
| Download gift HTML | Yes | Yes; own hosted uploads are packed into the export |
| Encoded gift links | Yes; payload size limits apply | Available as standalone alternative |
| Short `/g/<id>` links and uploaded media | No | Yes |
| Same-link edits, expiry and deletion | No; downloaded copies cannot be revoked | Yes for the hosted original |
| Direct creator inbox and opening counts | No | Yes |
| Recipient-specific social metadata | No for fragment-only links | Yes, with a discreet-preview option |
| Curated `/for/<occasion>` routes, sitemap and server-rendered metadata | Yes | Yes |

External photo/audio URLs remain external in either mode. If those resources require authentication, disappear, have incompatible codecs or reject requests, they may not work for the recipient. Their failure does not prevent the remaining gift scenes from continuing.

## Public pages, private gifts

Next.js serves eight curated public entry routes:

```text
/for/birthday-wish
/for/romantic-proposal
/for/show-your-love
/for/apology-card
/for/anniversary
/for/thank-you
/for/congratulations
/for/miss-you
```

Each has its own title, description, heading, canonical URL and matching create action. These public pages and `/` are in `/sitemap.xml`. Unknown occasion routes return 404; trailing slashes redirect to the canonical path. The standalone fallback uses `#occasion=<key>` instead of requiring server routing. `#make=<key>` enters a selected creator directly.

Gift pages, gift API responses and media are marked `noindex`; recipient names, letters, uploaded photos, reply content and edit secrets are not added to the public sitemap. Gift social previews never use the private proposal question or personal letter. Discreet previews also omit the recipient’s name and cover image.

**Noindex is not access control.** A gift link grants bearer access: anyone holding it can read the gift. The content is not end-to-end encrypted.

There are no asserted search-volume figures, ranking promises or analytics trackers in this build.

## Data, limits and ownership

The common payload now includes `version: 3` and an allowlisted `occasion`. Optional occasion fields are normalized on both client and server. Unsupported occasions are rejected by the backend, and irrelevant extra fields are not retained as another occasion’s content.

| Data | Current limit |
| --- | --- |
| Recipient / sender names | 40 characters each |
| Main note / final note | 1,200 / 500 characters |
| Photos | 4; JPG/PNG/WebP input; browser resizing to a 960px longest edge |
| Photo source uploads | Up to 15 MiB before processing; the server accepts processed images up to 1,000,000 bytes |
| Memories | 3; 40-character label and 200-character text |
| Voice / custom music | Up to 3 MiB each; direct browser recording has a 60-second limit |
| Proposal question / each reason | 140 / 160 characters; up to 3 reasons |
| Apology commitment / reunion thought | 300 / 200 characters |
| Achievement label | 80 characters |
| Hosted media upload | One request per file, each under Vercel’s 4.5 MB request-body limit; images ≤ 1,000,000 bytes and audio ≤ 3.2 MiB after decoding |
| Hosted gift JSON (after media moves to Storage) | 64 KiB |
| Media files per gift | 12 |
| Recipient reply | 500 characters |
| Portable-link UI threshold | 8,000 characters; not a guarantee that every messaging app accepts that length |

A separate random **256-bit edit secret** controls updating, deletion and viewing the inbox. Save the private recovery link/file. Public recipient URLs and gift exports exclude the secret. No account-based password reset or secret-recovery bypass exists. Losing both local storage and the recovery secret means losing editing access.

Read the security notes in [Deployment](docs/DEPLOYMENT.md#security-notes) before using real personal media or launching publicly.

## Migrating from the Cloudflare version (v3.0)

v4 replaces the Cloudflare Worker, D1 and R2 backend with Next.js route handlers, Supabase and Vercel. The gift experience, API paths and payload shape are unchanged, so existing frontend behaviour carries over.

- **No automatic data migration.** Gifts and media created on the old `luv4u.pages.dev` deployment stay in D1/R2 and do not appear in Supabase. Keep the old deployment serving until you have decided what to do with its data; stored media URLs include their publishing origin.
- **Edit keys are salted with `RATE_SALT`.** If you ever import old rows, keep the same salt the old Worker used, otherwise owners' recovery links will stop working.
- **Previously downloaded gift HTML files** are independent and keep working.
- **Media now lives in Supabase Storage.** The browser uploads each photo, voice note and share cover through `POST /api/gifts/:id/media` before publishing, which keeps every request under Vercel's body limit.

## Project layout

```text
app/                       Next.js App Router: pages, metadata, API route handlers
  page.tsx                 Landing + creator (hosts the gift engine)
  for/[slug]/page.tsx      Eight public occasion pages (static, with SEO metadata)
  g/[id]/page.tsx          Recipient gift page (noindex, per-gift social preview)
  api/                     config, gifts CRUD, media upload, views, reactions, stats, cron cleanup
  legacy.css               Gift engine styles
  globals.css              Tailwind (theme + utilities only)
components/LegacyApp.tsx   Server-rendered markup + loader for the gift engine
lib/                       Occasion registry, gift validation, Supabase + Storage helpers
lib/legacy-body.ts         Markup (icons, views, dialogs) the engine binds to
public/legacy/app.js       The v3 gift engine: creator wizard and the eight journeys
supabase/migrations/       Postgres schema, RLS and the Storage bucket
tests/                     API tests with an in-memory Supabase fake
docs/DEPLOYMENT.md         Supabase + Vercel setup and security notes
vercel.json                Framework and cron schedule
```

The gift engine is deliberately kept as one imperative script for now: it is the verified v3 experience, and it is served from `public/legacy/app.js` so downloaded gift files can inline it. Moving individual scenes to typed React components is possible piece by piece without changing the API.

## Tests and verification

```sh
npm run typecheck
npm run lint
npm test          # API behaviour against an in-memory Supabase fake
npm run build
```

The API tests cover creation, idempotent retries, validation, media offloading, ownership checks, optimistic-concurrency updates, deletion, views, replies and the cleanup cron. They do not talk to a real Supabase project. Before launch, run a manual pass against your own Supabase project and a physical iOS/Android device (audio, microphone and tilt).

## Customization and launch boundaries

In `public/legacy/app.js`, `OCCASIONS` defines the frontend occasion copy and defaults; `buildScenes()` defines inclusion/order; `renderOccasionScene()` implements the new interactions; `occasionArt()` draws the original SVG objects; `renderOccasionDetails()` and the template banks define optional fields. `THEMES` retains the six visual personalities.

Update both `OCCASIONS` in `public/legacy/app.js` and `lib/occasions.ts` when adding a type. Extend client/server validation, templates, public routing and tests together. Never use unescaped user text as HTML or add arbitrary server-side media fetching to work around broken third-party links.

Before a public launch, finish HTTPS deployment, live social-preview verification, physical iOS/Android audio/microphone/tilt checks, keyboard/screen-reader review, monitoring, abuse handling and storage-budget planning. The repository includes implementation and automated API coverage, not a compliance certification or a guarantee of free hosting or search traffic.

Made for the people who make your world brighter. ♡

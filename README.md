# Luv4u v3 ♡

**Eight little ways to say it.**

Luv4u turns a name and a feeling into a small, interactive gift website. Start from a warm, illustrated landing page, choose an occasion, and make something the recipient opens a little at a time.

No creator or recipient account. No payment screen. **The recipient’s name is the only required detail.** Every journey works with that name alone; personal messages, photos, memories, audio and extra surprises remain optional.

The frontend is one HTML file with embedded CSS, JavaScript and original inline SVG artwork. The companion backend adds short gift links, media storage, account-free editing and private replies. No frontend build step, UI framework, external font service or generative API is required.

## Start here

### Open the single-file version

Open `public/index.html` in a current browser, or open the separately distributed `luv4u-v3.html`. They are the same file.

You can create, preview, save local drafts and download standalone gift HTML without a backend. A `file://` address cannot become a public cross-device link merely by copying it. Export the gift as a file, or put the frontend on a public static host to use encoded-state links. Large gifts are offered as HTML downloads rather than oversized links.

### Run the complete local application

Use **Node.js 22.16 or newer**:

```sh
npm run dev
```

Open `http://localhost:8787`. The included Node adapter runs the production request handler with local SQLite and filesystem media. No `npm install` is required for this command or `npm test`.

Local data is written to `.local/`. Keep that directory private; do not publish it with the app. A localhost gift is only in your local database and does not work on another person’s device.

### Deploy public short links

Follow [Deployment](docs/DEPLOYMENT.md) to deploy the included Cloudflare Worker, D1 database, private R2 bucket and frontend on the same origin. The frontend detects `/api/config` automatically. Hosting configuration, a hosting account and possible infrastructure charges are separate from the account-free, payment-free gift experience.

**This package is not already deployed to a public domain.**

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

See [Journey and UX specification](docs/JOURNEYS.md) for the complete implemented sequence, default behavior, response branches and sensitive-occasion decisions.

## Creator journey

**Landing → choose a gift → their name → the feeling → Little touches: add or skip → review/preview → create → share.**

The landing’s main action introduces the occasion chooser before entering the builder. A small selected-gift ribbon, matching preview illustration and chapter outline keep the choice visible throughout creation. “Change gift” returns to the chooser; each occasion keeps its own local draft so changing direction does not mix one person’s words with another gift.

The existing four-stage builder is retained. Six familiar vibes remain available: Romantic, Cute, Funny, Emotional, Crazy and Elegant. The apology flow offers only Emotional and Elegant and enforces that restriction when importing or publishing data.

### Little touches cannot disappear into the flow

The feeling step explicitly says **“Next: little touches.”** Before review or publishing, the creator sees what extras exist and chooses **Add little touches** or **Skip for now**. A direct shortcut opens a specific addition. Jumping ahead does not bypass the choice, and skipping does not erase already-added content.

Every occasion has a complete name-only fallback. The additional proposal question, love reasons, gratitude flowers, anniversary date, milestone and reunion chapter are offered here rather than becoming required setup fields.

### Editable words, without the blank-page problem

Written-message fields include tap-to-use suggestions. This covers notes, captions, memory labels/stories, hidden messages, quiz questions/answers, final notes, recipient replies and all new occasion-specific written fields. Factual names, dates, URLs and phone numbers are not message-template fields.

Suggestions are occasion-aware; creator message banks also use the selected vibe and recipient name where appropriate. Choosing a preset never sends or publishes it. Text stays editable. Existing handwritten words are protected by **Replace my words / Keep mine**, with **Undo** after replacement. Merely changing the name, vibe, question kind or occasion does not silently overwrite authored words.

Quiz presets insert a complete compatible question/answer set. Date inputs stay date inputs; the anniversary date is validated rather than supplied with invented factual templates.

## Thoughtful response design

**Proposals:** Yes, Let’s talk and Not for me use equally sized, stationary buttons. Continuing without answering is equally possible. A selection creates a local editable response draft, not an automatic notification. A decline, a request to talk, or no answer ends quietly rather than triggering a success celebration.

**Apologies:** No games, confetti, deadline, moving refusal button or forced forgiveness. An early “need some space” route allows the recipient to stop before reading the whole note. A concrete commitment is optional and is only shown when supplied. The recipient can finish without sending a reply.

**All replies:** Emoji selection and template selection do not transmit a reaction. In hosted mode, the recipient explicitly sends the chosen words to the creator. Otherwise they prepare, copy or share a reply themselves. Opening counts are a separate approximate hosted feature; they are not evidence of acceptance or agreement.

## What continues to work from v2.1

Photo compression and framing; photo/memory reordering with button alternatives to dragging; browser voice recording; uploaded or directly linked audio; music preview/volume; tap-to-extinguish candles and optional microphone blowing; reduced-motion support; optional phone tilt; birthday story-order choices; balloons, scratch reveal, quizzes and mystery gifts; final notes and optional real-world surprise links; downloadable artwork; WhatsApp/native sharing; same-link hosted editing, expiry, deletion and a private creator inbox.

Games are intentionally excluded from apology gifts. New occasions use their own core interaction instead of inheriting birthday candles or birthday-specific language. The birthday branch remains birthday-only.

## Standalone versus connected

| Capability | Single HTML / static hosting | Included backend deployed |
| --- | --- | --- |
| All eight creator and recipient journeys | Yes | Yes |
| Local drafts, preview, editable templates | Yes, subject to browser storage | Yes, subject to browser storage |
| Download gift HTML | Yes | Yes; own hosted uploads are packed into the export |
| Encoded gift links | Public static origin; payload size limits apply | Available as standalone alternative |
| Short `/g/<id>` links and remote uploaded media | No | Yes |
| Same-link edits, expiry and deletion | No; downloaded copies cannot be revoked | Yes for the hosted original |
| Direct creator inbox and opening counts | No | Yes |
| Recipient-specific social metadata | No for fragment-only links | Yes, with a discreet-preview option |
| Curated `/for/<occasion>` routes, sitemap and server-rendered metadata | Not supplied by a generic file host | Yes |

External photo/audio URLs remain external in either mode. If those resources require authentication, disappear, have incompatible codecs or reject requests, they may not work for the recipient. Their failure does not prevent the remaining gift scenes from continuing.

## Public pages, private gifts

The Worker provides eight curated public entry routes:

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

[Occasion and growth plan](docs/OCCASIONS_AND_GROWTH.md) explains the extra categories and a measurement plan. There are no asserted search-volume figures, ranking promises or new analytics trackers in this build.

## Data, limits and ownership

The common payload now includes `version: 3` and an allowlisted `occasion`. Optional occasion fields are normalized on both client and server. Unsupported occasions are rejected by the backend, and irrelevant extra fields are not retained as another occasion’s content.

| Data | Current limit |
| --- | --- |
| Recipient / sender names | 40 characters each |
| Main note / final note | 1,200 / 500 characters |
| Photos | 4; JPG/PNG/WebP input; browser resizing to a 960px longest edge |
| Photo source uploads | Up to 15 MiB before processing; server raster limit 1,000,000 bytes per processed file |
| Memories | 3; 40-character label and 200-character text |
| Voice / custom music | Up to 3 MiB each; direct browser recording has a 60-second limit |
| Proposal question / each reason | 140 / 160 characters; up to 3 reasons |
| Apology commitment / reunion thought | 300 / 200 characters |
| Achievement label | 80 characters |
| Hosted publish request | 9 MiB total |
| Recipient reply | 500 characters |
| Portable-link UI threshold | 8,000 characters; not a guarantee that every messaging app accepts that length |

A separate random **256-bit edit secret** controls updating, deletion and viewing the inbox. Save the private recovery link/file. Public recipient URLs and gift exports exclude the secret. No account-based password reset or secret-recovery bypass exists. Losing both local storage and the recovery secret means losing editing access.

Read [Security and privacy](docs/SECURITY.md) before using real personal media or launching publicly.

## Upgrade from v2 / v2.1

Deploy **both** the v3 frontend and the v3 backend. The API capability response is now version 3 and lists the supported occasions. A v3 frontend can still use a birthday-only v2 server for birthdays, but explicitly refuses to silently publish a new occasion to it. Standalone export remains available.

**No database migration is required for existing installations.** The existing JSON gift column stores the new optional fields. Retain your existing D1/R2 resources, domain and `RATE_SALT`. Missing `occasion` in old gifts is interpreted as `birthday`; existing birthday URLs remain valid.

Previously downloaded HTML gifts are independent files and do not change retroactively. New exports include the current journey and recipient templates, start in the dark, remove creator template pickers/private edit controls from serialized state, and can return to the eight-gift chooser without duplicate controls.

Do not change a local link’s hostname and expect its database record to move. Back up real data and keep the old origin serving during any domain migration; stored media URLs include their publishing origin.

## Project layout

```text
public/index.html          Single-file frontend, illustrations, styles and journeys
server/worker.mjs         Production same-origin API, media, metadata and public routes
server/occasions.mjs      Server occasion registry and safe public copy
server/dev.mjs           Local Node HTTP adapter
server/local-adapter.mjs Local SQLite/filesystem adapters for D1/R2/ASSETS
migrations/0001_init.sql  Existing schema; unchanged for v3
wrangler.jsonc           Cloudflare resources and static-assets routing
.dev.vars.example        Local Worker secret example, not a production secret
TASKS.md                 Completed implementation checklist and remaining launch checks
docs/                    Journeys, deployment, privacy, growth and QA scope
tests/                   API, creator-template, birthday and occasion regressions
qa/v3/                   Recorded results and reviewed screenshots
```


## Tests and verification

```sh
npm test

# Optional browser development tools:
python -m pip install playwright pillow
python -m playwright install chromium

python tests/browser_smoke.py
python tests/creator_templates.py
python tests/occasions.py

# Start npm run dev in another terminal before connected runs:
python tests/browser_smoke.py --connected
python tests/creator_templates.py --connected
python tests/occasions.py --connected
```

`LUV4U_TEST_URL` changes the local API origin. `LUV4U_QA_DIR` changes the result directory. `CHROMIUM_EXECUTABLE` can select an installed Chromium binary.

See [QA record](docs/QA.md) for the actual counts, reproducible commands and limitations. Browser checks render the real HTML in an inline Chromium document with isolated storage/URL doubles; connected calls are bridged to the real local API. This is not represented as physical-device, cloud-deployment, real IndexedDB or complete cross-browser verification.

## Customization and launch boundaries

In the embedded script, `OCCASIONS` defines the frontend occasion copy and defaults; `buildScenes()` defines inclusion/order; `renderOccasionScene()` implements the new interactions; `occasionArt()` draws the original SVG objects; `renderOccasionDetails()` and the template banks define optional fields. `THEMES` retains the six visual personalities. The CSS contains labeled occasion styles and the gift first-paint guard.

Update both `OCCASIONS` and `server/occasions.mjs` when adding a type. Extend client/server validation, templates, public routing and tests together. Never use unescaped user text as HTML or add arbitrary server-side media fetching to work around broken third-party links.

Before a public launch, finish HTTPS deployment, live social-preview verification, physical iOS/Android audio/microphone/tilt checks, keyboard/screen-reader review, monitoring, abuse handling and storage-budget planning. The package includes implementation and automated regression coverage, not a compliance certification or a guarantee of free hosting or search traffic.

Made for the people who make your world brighter. ♡

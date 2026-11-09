# The recipient experience: audit and redesign

Goal: the person who opens a gift should think "this is far too much for ₹199", with the fewest possible touches.

## Audit (before)
Measured with an automated player on a 390 px phone, engaging every affordance. "Touches" include the press-and-hold on the envelope.

| Gift | Touches before | Where they went |
|---|---|---|
| Birthday | 9 | light the room (2 touches), "First, make a wish", blow the candles, "Now, your gift", open the present, "Read your note", continue |
| Proposal | 11 | light (2), "Step a little closer", open envelope, "Read the words", continue, open the box, answer, continue |
| Love note | 9 | light (2), "A few little reasons", three hearts, continue, continue |
| Apology | 7 | light (2), "Read when you're ready", open envelope, "Read the words", continue |
| Anniversary | 8 | light (2), "Open our story", three page turns, continue |
| Thank you | 9 | light (2), "A little bouquet", three flowers, continue, continue |
| Congratulations | 7 | light (2), "Step closer", untie ribbon, continue (2) |
| Miss you | 7 | light (2), "Catch a hug", continue (2) |

Findings:
1. Lighting the room took two touches (spark, then "one more touch"), after an envelope that was already a ritual.
2. Title cards ("Happy Birthday, name", "A little bouquet") existed only to hold a "next" button.
3. A payoff (candles out, present opened, ribbon untied) was followed by a second tap to move on.
4. Envelopes were opened twice: the seal, then a second envelope scene for the letter.
5. Three of the interactions (hearts, flowers, storybook) were three separate taps for one idea.
6. The ending asked for a tap to reach a reply screen, then an emoji, then text, then a send: four steps to say "I loved it".
7. Replay started from the beginning with another two taps.

## Principles
- One gesture per moment. A payoff carries on by itself; a small "continue" stays for anyone who wants to go sooner.
- Reading scenes stay in the reader's hands. Nothing that has to be read moves on without a tap, except a short pause after a payoff.
- Nothing auto-advances under reduced motion. (The old apology rule, never automatic and never celebrating, went with the apology card: see "The sorry gift" below.)
- Every touch answers with light, sound and a short vibration (all synthesised, soft, silent when muted).

## After
| Gift | Touches now | The experience |
|---|---|---|
| Birthday | **4** (seal, blow, present, continue) | The envelope lights the room by itself. Greeting and wish are one scene. Blow once: smoke, a fanfare, confetti from the cake, balloons rise, and it moves on to the present. Open the present: burst of light, confetti, and the letter appears and writes itself. |
| Proposal | **4** (seal, continue, open the box, answer) | The letter comes first and builds to the question. A "yes" is a celebration (fanfare, confetti, balloons) that carries on by itself; "talk" and "no" stay quiet and in their hands. |
| Love note | **3** (seal, one heart, then the note's own continue) | One touch and all three reasons unfold one after another, each with a rising note and a ring of light, then it moves on by itself after a reading pause (the button stays for anyone who wants to go sooner). |
| Apology (retired, now the sorry gift) | **3** (seal, "Read when you're ready", continue) | Slower, quieter, never automatic. The letter unfolds on arrival instead of behind a second envelope. |
| Anniversary | **2-5** (seal, then the pages turn themselves; touch to turn sooner, continue) | The book opens and turns its own pages with a soft page sound. |
| Thank you | **3** (seal, one flower, then the note's own continue) | One touch blooms the bouquet; the three thank-yous gather as cards, then it moves on by itself after a reading pause. |
| Congratulations | **3** (seal, ribbon, continue) | Untie the ribbon: fanfare, confetti, balloons; it carries on. |
| Miss you | **3** (seal, hug, continue) | The paper hug flies across, a heartbeat (sound and vibration), then on. |

Everywhere:
- **The ending is the shareable moment.** "How did that feel?": one touch on an emoji sends it straight to the sender. Tapping anywhere throws confetti from that spot. "Watch it again" lights the room itself (no taps). "Share the feeling" opens the phone's share sheet with a link to Kholona (never the private gift link) where the browser supports it, and "Make someone's day" starts a gift of their own.
- **The letter writes itself** (about three seconds however long it is, readable as it appears).
- **Sound kit**: spark, glow, whoosh, pop, rising notes, bloom, page, heartbeat, fanfare. **Haptics** on every payoff, off under reduced motion.
- New gifts no longer ask "which do you want first?" before the cake. The option stays for gifts that chose it.

## Measuring it
`gift_opened` → `reply_sent` is the recipient funnel. The one-touch ending should raise the share of recipients who reply (it is now one touch instead of four steps). Compare before and after launch. Replies reach the sender, which is what makes the gift travel.

Risks to watch: auto-advance pace (if people say it moves too fast, lengthen the pauses in `autoAdvance` calls in `public/legacy/app.js`), and whether the shorter path makes the gift feel less substantial (more wow, fewer taps is the bet).

## Second pass: fewer things in the way

Measured with a patient player (`only touches the gift's own moments, waits to see what moves on by itself`) on a 390 px phone, with a name-only gift:

| Gift | Touches | Notes |
|---|---|---|
| Birthday | 4 | seal, blow, open the present, then the letter's continue |
| Proposal | 4 | seal, continue after the letter, open the box, answer |
| Love note | 3 | the three reasons now move on by themselves |
| Apology (retired) | 3 | never automatic, by design |
| Anniversary | 2 to 5 | pages turn themselves |
| Thank you | 3 | the three thank-yous now move on by themselves |
| Congratulations | 3 | |
| Miss you | 3 | |

Removed: the unlabelled round "tilt" button in the top corner (the room still tilts; there was nothing to explain), and the extra tap after the three hearts and the bouquet. What stays on purpose: the seal, every payoff moment, and one continue after the letter, because reading stays in the reader's hands.

## The sorry gift (replaced the apology card)

Competitors' "sorry" sites convert well from ads, and ours was a quiet, therapist-style apology that nobody screen-records. The apology card is now a cute, romantic **sorry gift** for couples after a small fight. The internal key stays `apology`, so every gift already made keeps working (an old gift's one "commitment" shows as its first coupon). The public page moved to `/for/sorry-gift`; `/for/apology-card` redirects there permanently, and creator links take `?to=sorry`.

| Moment | What happens | Touches |
|---|---|---|
| Seal | "Someone is very sorry 🥺" | 1 |
| Welcome | The chosen character pouts with a tear and a sorry sign: "I'm so sorry, Priya." Button: "Open it, please? 🥺" | 1 |
| Sorry meter | One tap: the meter climbs a little, very, extremely, "emotionally down bad 😭", overflows and shakes, hearts burst. Moves on by itself. | 1 (+ optional continue) |
| Note | The letter writes itself, signed "Your very sorry, …" | 1 |
| Sorry coupons | One tap claims all three ("One free hug. No expiry date.") with a stamp each. Moves on by itself. | 1 (+ optional continue) |
| Photos, memories, voice, games, final note | As other gifts, with sorry wording ("Exhibit A: we're cute together.") | optional |
| Forgive me? | Yes and No. **No runs away** from a finger, a mouse or a key press, says something sadder each time ("Are you sure?", "Pleeease 🥺", "I'll cry 😭"), shrinks a little, and Yes grows. Only Yes can be pressed. Yes: the character turns happy, fanfare, confetti, balloons, and a "💗 I forgive you 💗" reply is sent to the sender (hosted gifts, not previews). Moves on by itself. | 1 (+ optional continue) |
| Ending | Happy character, "Forgiven. Best. Person. Ever.", photos reel, four sorry reactions (💗 🤗 🙄 🥺), and **Save our "Forgiven" card 📸**: a 9:16 PNG made on the phone (happy character, "Forgiven", "Priya forgave Ashu", "made on kholona.in") through the share sheet or as a download. | |

The sender picks the character (teddy, kitty or just stickers), up to three coupons and the question (defaults: "Will you forgive me? 🥺"); all have ready-made options and every look (mood) is allowed. Colours: blush `#ffd6e0`, petal `#ff8fab`, deep rose `#d6336c`, lavender `#e7d9ff`. Characters are inline SVG in `sorryArt()` in `public/legacy/app.js`; styles are in `app/sorry.css`.

The runaway No is a deliberate product choice (it is what the category's ads show). It only suits small fights, which the landing page, its FAQ and the ideas articles say plainly. The recipient can still close the page at any time.

Funnel events: `forgive_no_tried` (once per opening), `forgive_yes`, `story_card_saved`, all with the usual `occasion` (`apology`) and `env`.

## The birthday, made for Instagram

The birthday was soft and quiet: small text, an empty pink pause after the lights, a present that did little, and nothing a recipient would post. It now has one moment per scene that looks good in a screen recording, and an ending made to be shared.

| Moment | What happens | Touches |
|---|---|---|
| Seal | As every gift. | 1 |
| Countdown | Dark room: "11:59 PM · Just for Priya", "It's almost your day…". The seal starts a big **3 · 2 · 1** (a rising note and a buzz on each beat). Skipped on replay and for reduced motion. | 0 |
| The big moment | Night sky, fireworks, **HAPPY BIRTHDAY** letter by letter, their name in neon, and "turning 22 ✨" if the sender chose to show the age. Confetti, then on to the cake by itself (a tap skips it). | 0 |
| Cake | "Make a wish, Priya." Tap or blow into the mic. Three candles, or **number candles with their age** when the sender switched that on. Then "Wish sealed 🤫", fanfare, balloons. | 1 (+ optional continue) |
| Photos | If added: the polaroids drop in one by one with a pop each. "Look what I kept." | 1 |
| Birthday Wrapped | Bold full-screen cards with story-style bars, one every ~2.7 s (tap for the next): "Priya's birthday, wrapped." · "You've been alive for 8,035 days" · "That's 1,92,840 hours of being iconic." · "Level 22" (only with age shown) · "Your top trait: Main character energy" · "Most played: Your laugh 🎶" · "Up next: Your best year yet." Numbers count up, in Indian grouping. The last card says "Screenshot this one 📸"; every card carries a small kholona.in. | 1 |
| Note, memories, voice, games, final | As before. | |
| Ending | The finale as before, with **Add to your story 📸** first: a 9:16 PNG made on the phone ("IT'S MY BIRTHDAY 🎂", "Someone made me a whole website for my birthday 🥹", their name in neon, the cake with their candles, "8,035 days of being iconic ✨", "made with kholona.in ♡") through the share sheet or as a download. | |

The present scene is gone from new and old birthday gifts alike; "let them choose what to open first" now offers their Birthday Wrapped or the note.

**For the sender, everything is optional and costs no extra step.** A name is still all it takes. One collapsed panel, "Birthday Wrapped & age candles · all optional", holds: their birthday (`birthDate`, unlocks the day and hour numbers), "Show their age as number candles 🎂" (`ageCandles`, off by default, only with a birthday; the panel says the age they are turning), "Their top trait" (`topTrait`) and "Most played" (`mostPlayed`), each with ready-made picks. Blank answers follow the mood (Cute: "Main character energy", Funny: "Certified chaos 🤪", …). The age is the one they are turning when the birthday is today or within a month, otherwise the one they turned.

Styles are in `app/birthday.css`; the scenes are `hbd` and `wrapped` in `public/legacy/app.js`. Funnel: `story_card_saved` with `occasion: birthday`.

## The wedding invite

A product of its own, not a gift: the couple buys one invite (₹499, `PAYMENT_PRICE_WEDDING_INR`) and sends it to the
whole guest list, so every guest sees kholona.in. It lives at `/for/wedding-invite` and under **Big days** on the home
page. The internal key is `wedding`. (The first version reused the gift room, a light switch and a long form; it was
rebuilt from scratch around how Indian e-invites are actually shared: full-screen, page by page, screenshot-worthy.)

### What a guest sees (one tap, then it plays)

| Page | What it is |
|---|---|
| Envelope | Velvet maroon. Who is inviting, and whom: "THE SHARMA & VERMA FAMILIES · *invite* · **Mehta family** · *to the wedding of Aanya & Aditya*" (the guest from their personal link, `?to=`; "you" without one; the couple invite when no family names are given), an ivory envelope with a maroon wax seal of the couple's initials, gently floating. **One tap**: the seal breaks, the flap opens, the card rises, a flash of ivory, and the invitation begins. (No press-and-hold, no light switch.) |
| Blessing | Ivory, a slowly turning mandala, a brass kalash with mango leaves, ॥ शुभ विवाह ॥ (or ॥ श्री गणेशाय नमः ॥, or none), "*Dear Mehta family,* with joy in their hearts, THE SHARMA & VERMA FAMILIES invite you to celebrate the wedding of" |
| The couple | Maroon under a marigold toran and an arch: the invitation line, **Aanya · weds · Aditya** in shining gold script, the hashtag. Falling petals. |
| Save the date | Blush: "*Save the date*", SATURDAY · **19** · DECEMBER, 2026 · Jaipur, and a live countdown (40 days 4 hrs 32 min 47 sec to go). |
| One poster per function | Each in its own palette with its own motif: Haldi turmeric (a brass bowl, marigolds), Mehendi henna green (a mandala), Sangeet magenta (a dholak, notes), Wedding crimson (a marigold mandap with the sacred fire), Reception midnight (a chandelier), Engagement blush (rings). "THE *Haldi*", the day, the time, the venue, the dress code, **📍 Directions** and **📅 Save the date** (a calendar file on iPhones, Google Calendar elsewhere). |
| Photos, a note | If added: polaroids taped to ivory; a short letter signed by the couple. |
| Finale | Maroon: rings under a marigold arch, "We can’t wait to celebrate with you", the names, date, place, hashtag; **Send your blessings 💌** (to the couple's inbox), **Add every function to my calendar**, **Post “I’m invited” to your story 📸**, ↻ Watch again. |

The pages play like stories: progress bars on top, about 4 to 7 seconds each, **tap** (right) for the next, tap the left
third for the previous one, **hold** to pause, arrow keys too. Every page is a 9:16 poster with a double gold frame, made
to be screenshotted. On a laptop the poster stays a centred 9:16 story on the velvet room instead of stretching.
The music starts on the tap that breaks the seal (phones only allow sound inside a tap). After the finale, **Send your
blessings** has its own feelings (🙏 Blessings to you both · 🎉 We’ll be there · 💛 So happy for you · 🥹 So emotional)
and three ready-made blessings. Fonts: Great Vibes (names, titles), Cinzel (capitals), Cormorant Garamond (words), self-hosted (OFL).

### What the couple does (about a minute)

One screen, in six short cards, with a live poster of the names beside it:

1. **The couple**: Bride, Groom (⇄ swaps the order). "Guests see *Aanya weds Aditya*". Optional: each side's family
   name ("Sharma", "Verma family" and "The Verma Parivar" all work), shown live as "The envelope reads *The Sharma &
   Verma families invite you*". The same line opens the WhatsApp message and the link preview.
2. **The wedding** (always included): date, muhurat time (7 pm unless changed), venue, an optional Google Maps link.
3. **Functions**: one tap each, **already filled in** from the wedding: Engagement 2 days before at 6 pm, Haldi the day
   before at 10 am, Mehendi at 3 pm, Sangeet at 7:30 pm, Reception the day after at 7:30 pm; same venue and map; a dress
   code (shades of yellow, shades of green, glam & sparkle…). Change the wedding date and every function moves with it;
   change the venue and every function at that venue follows. "Edit" opens a function; "+ Other" adds any ceremony.
4. **The words**: the invitation line, the blessing, a hashtag (three suggestions from the names, like #AanyaWedsAditya
   and #AdityaKiAanya), and an optional note, each with ready-made choices.
5. **Music**, tap to listen: **Shehnai** (Raag Yaman over a tanpura drone with a soft dholak), **Baraat band** (brass
   and dhol), **Sitar evening**, or none. All three are original and made live in the browser (no files, no rights
   to clear); new invites start with the shehnai. Or **upload your own song** (MP3/M4A/AAC/OGG/WAV, up to 12 MB) and
   drag **Start from** to the hook; it loops from there. Licensed tracks can be offered too: put the files in
   `public/music/wedding/` and list them in `WEDDING_TRACKS` in `public/legacy/app.js`.
6. Optional photos.

Only the two names and the date are needed (and a song still uploading waits); a missing one is pointed out where it goes. The price is stated before
creating. After unlocking: **Personal invites 💌** (paste the guest list, one WhatsApp message and link per guest).

Data (validated on the server, `normalizeWedding`): `name`, `partner`, `groomFirst`, `family1`, `family2` (≤ 40 each), `weddingDate`, `city`, `families`,
`hashtag`, `blessing` (`shubh` · `ganesh` · `none`), `events[]` (≤ 8: title, date, time, venue, https Maps link, dress),
`message`, `photos`, `music` (`shehnai` · `baraat` · `sitar` · `custom` · `none`), `musicSrc`, `musicName`, `musicStart` (seconds, 0 to 900).
A song is too big for the API's 4.5 MB body, so `POST /api/gifts/:id/media` with `{kind:'song', type, size}` returns a
one-time signed Storage URL; the browser PUTs the file straight to it (with a progress bar) and keeps the public URL.
Needs migration `0011_song_uploads.sql` (bucket limit 12 MB, M4A types). `GET /api/gifts/:id/calendar[?e=n]` serves the functions as a calendar file (unlocked invites only,
India time). Styles: `app/wedding.css`. Funnel: `guest_links_made`, `story_card_saved`. Next: RSVP per function, more
palettes, Hindi wording.

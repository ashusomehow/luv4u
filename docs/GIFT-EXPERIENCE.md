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

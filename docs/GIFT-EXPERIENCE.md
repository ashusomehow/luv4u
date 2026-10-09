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
- An apology never moves on by itself, never celebrates, and keeps its consent step ("Read when you're ready"). Nothing auto-advances under reduced motion either.
- Every touch answers with light, sound and a short vibration (all synthesised, soft, silent when muted).

## After
| Gift | Touches now | The experience |
|---|---|---|
| Birthday | **4** (seal, blow, present, continue) | The envelope lights the room by itself. Greeting and wish are one scene. Blow once: smoke, a fanfare, confetti from the cake, balloons rise, and it moves on to the present. Open the present: burst of light, confetti, and the letter appears and writes itself. |
| Proposal | **4** (seal, continue, open the box, answer) | The letter comes first and builds to the question. A "yes" is a celebration (fanfare, confetti, balloons) that carries on by itself; "talk" and "no" stay quiet and in their hands. |
| Love note | **3** (seal, one heart, then the note's own continue) | One touch and all three reasons unfold one after another, each with a rising note and a ring of light, then it moves on by itself after a reading pause (the button stays for anyone who wants to go sooner). |
| Apology | **3** (seal, "Read when you're ready", continue) | Slower, quieter, never automatic. The letter unfolds on arrival instead of behind a second envelope. |
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
| Apology | 3 | never automatic, by design |
| Anniversary | 2 to 5 | pages turn themselves |
| Thank you | 3 | the three thank-yous now move on by themselves |
| Congratulations | 3 | |
| Miss you | 3 | |

Removed: the unlabelled round "tilt" button in the top corner (the room still tilts; there was nothing to explain), and the extra tap after the three hearts and the bouquet. What stays on purpose: the seal, every payoff moment, the apology's consent step, and one continue after the letter, because reading stays in the reader's hands.

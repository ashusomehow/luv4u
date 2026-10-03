# The journey to the preview page: audit and redesign

Scope: landing → gift creation. The preview and payment page (the unlock screen) is deliberately untouched.

## Before (measured on a 390 px phone, best case)
| # | What the person does | Screen |
|---|---|---|
| 1 | Tap an occasion chip | Landing |
| 2 | Type a name | Step 1 "Name & mood" |
| 3 | Tap "Next: your words" | Step 1 |
| 4 | Tap "Next: preview & send" | Step 2 "Words & photos" (a stack of folded sections, nothing written for them) |
| 5 | Tap "Continue with words only" | A modal that interrupts the move forward |
| 6 | Tap "Create" | Step 3 "Take a look" (a summary, then the real preview comes next anyway) |

**6 actions, 4 screens, and a gift that was "empty" until the person wrote something.**

Frictions found:
- Three steps for what is one idea (a name, then optional extras). Step 3 repeated a summary that the unlock page, with its live phone preview, does better.
- The interstitial "add a photo?" modal cost a tap and a context switch to protect a choice that can be shown inline.
- The note, the most valuable personal element, was invisible: "we'll tuck one in". People could not see what they were sending.
- Mood used two screen-heights of large cards for a choice that already has a sensible default per occasion.
- Photos and voice sat behind folded sections, with long help text and an image-link field in front of the common path.
- The name field did not have the cursor, Enter did nothing, and the sender had to retype their name for every gift.

## After
**3 actions, 1 screen** (tap an occasion → type a name → press Go / tap Create). Everything else is optional and visible.

| Change | Why |
|---|---|
| One page replaces the three steps and the Next buttons | Fewer screens and taps; nothing to "get through" |
| Cursor is in the name field when the creator opens | Typing starts at once; no extra tap |
| A ready-made note, written with their name, appears as soon as a name is typed, and follows the name and the mood until the sender writes their own words | Smart default and template: the gift is complete and the sender sees exactly what will be said. Not used for an apology, where words must be the sender's own |
| "↻ Try another" cycles the occasion's templates; a soft glow shows the swap | One-tap personalisation instead of a list to read |
| Mood is a single row of chips with the occasion's default already selected | Same choice, a fraction of the space; the default is right most of the time |
| Photos and voice are open on the page; the image-link and audio-link fields are tucked under "Use … link instead" | The common path first |
| The skippable "add a photo?" modal is replaced by one line in the sticky bar ("Words only so far. Add a photo or voice note") | Leaving media out stays a visible choice, but costs no tap |
| Enter in the name field (the phone's Go key) creates the gift; Enter in any other field never does | The fastest path for people who want it, no accidental sends mid-sentence |
| Sender name is remembered on this device | Never retype it |
| Button says "Create & preview" and the sticky bar always shows it | The next action, and what it leads to, is obvious on every screen size |
| Occasion guide hidden on phones | It pushed the note below the fold; desktop keeps it beside the live preview |

Unchanged on purpose: the unlock page (live phone preview, price, payment, failure handling), the gift engine, payment, the landing page's look and copy, and all the optional extras (memories, soundtrack, surprises, scheduling, WhatsApp replies), which remain under "More little touches" and "More options".

## How to know it worked
Events (`lib/events.ts`): `creator_opened` → `publish_clicked` → `gift_published` is now the whole creation funnel. New: `note_shuffled` (do people use the templates?) and `media_nudge_clicked` (does the sticky-bar line add photos?). Compare, before and after launch of this change:
- creator_opened → publish_clicked rate (expect up: fewer steps to abandon)
- median time from creator_opened to gift_published (expect well under a minute)
- share of gifts with at least one photo or voice note (the risk: skipping gets easier; the sticky-bar line and the open photo section are there to hold this up)
- unlock rate downstream (a ready-made note must not make gifts feel generic: watch it, and if it drops, test a shorter prefilled note or an "add one line of your own" prompt)

# Kholona brand kit

One reference for how Kholona looks, sounds and moves. Code values live in `app/tokens.css` (new work) and
`app/legacy.css` / `app/effects.css` (older screens); this document says which to use and why.
Colour details per occasion and mood are also in `PALETTE.md`.

## 1. Who and what

- **Product:** Kholona (kholona.in) makes small interactive gift websites. You pick an occasion, add a name, a note and
  a photo, preview it free, pay ₹199 and share one link.
- **Category:** digital gifts and e-cards, competing with greeting cards, WhatsApp forwards, Canva cards and reels.
- **Audience:** urban India, 18 to 35, sharing over WhatsApp. Couples, friends, siblings, parents, people far apart.
  Mostly on a phone, often at the last minute.
- **Promise:** "little gifts, big feelings". Something that feels made just for one person, for the price of a chai and
  a samosa.
- **Personality:** warm, sincere, playful, a little shy. Never loud, never salesy, never corporate.

## 2. Design principles

1. **Feeling first.** Every screen serves the moment between two people, not the product.
2. **One gesture per moment.** One tap, hold or swipe does the whole thing. No stacked confirmations.
3. **Warm paper, deep ink.** The base is a soft paper with plum-brown ink. Colour arrives with the occasion.
4. **Colour has a job.** Raspberry is Kholona. Each occasion adds its own colour. Mood palettes tint the gift scene.
5. **Round and generous.** Pills, arches and large radii. No sharp corners, no hairline-thin UI.
6. **Drawn, not photographed.** Illustrated objects (cake, envelope, hearts) and line icons. Photos belong to the user.
7. **Soft motion, small sound.** Springy easing, short durations, synthesised sound and haptics, all optional.
8. **Honest.** No fake scarcity, no countdowns, no dark patterns. Say what is free and what costs ₹199.
9. **Readable for everyone.** Text contrast 4.5:1 or better, tap targets 44px, motion respects reduced-motion.

## 3. Logo

- **Wordmark:** `kholona♡` in the serif face, always lowercase, with the **o** in brand rose and a small heart after
  the **a**. Markup: `khol<span>o</span>na`, see `.wordmark` and `.logo-heart` in `app/legacy.css`.
- **Mark:** a cream rounded square (`#faf7f2`, corner radius 8 of 64), raspberry heart (`#d6265d`), gold sparkle
  (`#ffbb5d`). Files: `public/icon.svg`, `public/favicon.svg`.
- **Lockup:** mark left of the wordmark, gap equal to half the mark height. Use the mark alone for favicons, avatars
  and app icons, the wordmark alone inside gift pages.
- **Clear space:** the height of the heart on every side.
- **Minimum size:** mark 16px, wordmark 80px wide.
- **Backgrounds:** paper, white, or a soft occasion tint. On dark or saturated backgrounds use the mark on its cream
  tile and a white wordmark with the heart in gold.
- **Never:** capitalise it, stretch it, outline it, recolour the **o**, add shadows or gradients to the wordmark, put it
  on a photo without a tile, or change the heart.

## 4. Colour

### Core

| Role | Token | Hex | Use |
| --- | --- | --- | --- |
| Paper | `--c-paper` | `#faf7f2` | page background, theme colour |
| Surface | `--c-surface` | `#fffdfa` | cards, sheets, inputs |
| Ink | `--c-ink` | `#432d32` | headings, body |
| Ink soft | `--c-ink-soft` | `#5b4549` | secondary text, 7:1 on paper |
| Brand | `--c-brand` | `#d6265d` | buttons, wordmark o, key accents |
| Brand deep | `--c-brand-deep` | `#b4184b` | links and small brand text, 6:1 on paper |
| Line | `--c-line` | `#f0dcd1` | borders and dividers |
| Gold | `--c-gold` | `#ffbb5d` | sparkles, stars, highlights (never text on paper) |

### Gradients

- **Primary button / brand glow:** `--g-brand`, `135deg #d92a5f → #c42a74 → #a62f92`.
- **Headline accent word:** `--g-headline`, `#d92a5f → #f0683c → #f2a516`. One or two words per page, never a
  whole paragraph.

### Occasions

Each occasion has a **swatch** (shapes, glows), a **soft** tint (backgrounds, chips) and an **ink** (text and small
icons, 4.5:1 on its soft tint).

| Occasion | Swatch | Soft | Ink |
| --- | --- | --- | --- |
| Birthday | `#f2683c` | `#ffe3d6` | `#c2410c` |
| Proposal | `#e11d48` | `#ffe1e7` | `#be123c` |
| Love | `#ec4899` | `#ffe1f0` | `#be185d` |
| Apology | `#5b8def` | `#e1ecff` | `#2f5fc4` |
| Anniversary | `#e5a010` | `#fff0c9` | `#a16207` |
| Thank you | `#16a36e` | `#d9f6e8` | `#0f7a52` |
| Congratulations | `#8b5cf6` | `#ebe3ff` | `#6d3fd6` |
| Miss you | `#3b82f6` | `#dfeaff` | `#1d5fd1` |

### Moods

Mood palettes tint the recipient scene only: Romantic `#e0446a`, Cute `#ff7eb6`, Funny `#f5a623`,
Emotional `#8d74e8`, Crazy `#ff6a3d`, Elegant `#cfa233` (swatches). Accents used for text are darker
(`#d0204f`, `#d62f82`, `#b85a00`, `#6a4bd0`, `#d93a14`, `#8f6a0d`).

### Status

OK `#e1f1e0` / `#155522`, warning `#fff6dc` / `#705300`, error `#ffe2e2` / `#9d0027` (background / text).
Status colours never double as occasion colours.

### Rules

- 60 / 30 / 10: paper and surface 60, ink and neutrals 30, brand and occasion colour 10.
- One occasion colour per screen. Never mix two occasions.
- Text on colour needs 4.5:1. Check with the ink column, not the swatch.
- Dark mode is not offered for the product. Marketing assets may use deep plum `#2b1929` as a background.

## 5. Typography

| Role | Stack | Use |
| --- | --- | --- |
| Display / voice | Georgia, 'Times New Roman', serif (`--f-serif`) | headlines, gift messages, the wordmark |
| Interface | 'Avenir Next', Avenir, 'Segoe UI', sans-serif (`--f-sans`) | buttons, forms, labels, body |

System stacks keep pages fast on budget phones and need no font download. If a web font is added later, keep a
warm humanist serif plus a rounded geometric sans and the same sizes.

| Step | Size | Use |
| --- | --- | --- |
| `--t-2xl` | clamp(34px, 6vw, 46px) | page headline (serif) |
| `--t-xl` | 26px | section title (serif) |
| `--t-lg` | 20px | card title, gift message |
| `--t-md` | 16px | body, inputs (never smaller on inputs, avoids iOS zoom) |
| `--t-sm` | 14px | helper text, captions |
| `--t-xs` | 12px | legal, badges |

- Headlines 1.1 to 1.2 line height, body 1.5. Body width 60 to 70 characters.
- Sentence case everywhere. Uppercase only for tiny labels with 0.08em tracking.
- Numbers and prices use tabular figures: ₹199.

## 6. Spacing, shape, depth

- **Spacing:** 4px base. `--s-1` 4, `--s-2` 8, `--s-3` 12, `--s-4` 16, `--s-5` 24, `--s-6` 32, `--s-7` 48.
  Side gutters 16px on phones, content width 480px for flows and 1120px for marketing pages.
- **Radii:** `--r-sm` 12 (chips, inputs), `--r-md` 16 (cards), `--r-lg` 22 (sheets, phone mockup), `--r-pill` (buttons,
  tags).
- **Shadows:** `--shadow-card` for resting cards, `--shadow-pop` for floating sheets and the phone mockup. Shadows are
  soft, warm and low opacity, never grey.
- **Touch:** `--tap` 44px minimum for anything pressable.

## 7. Imagery and illustration

- **Illustration:** flat SVG objects with rounded shapes and 2 to 3 tones from the active palette: cake, candles,
  envelope, hearts, book, bouquet, medal, plane, olive branch. No outlines heavier than 2px, no gradients on objects
  except a soft highlight.
- **Photography:** only what the sender uploads. Show photos in rounded frames (`--r-md`), slightly tilted polaroid
  style is allowed. Stock photos of couples or families are not used in marketing.
- **Marketing visuals:** phone mockups showing real gift screens, real WhatsApp-style reviews, paper-and-confetti
  backgrounds. Always show the product in use.
- **Particles:** hearts, confetti, balloons, petals in the occasion palette. Short bursts, never a constant storm.

## 8. Icons

- Single line-icon sprite in the app (28 icons: arrow, back, heart, spark, gift, link, pen, photo, mic, music, clock,
  check, lock, copy, whatsapp, mail and more).
- 24px grid, **stroke 1.6, round caps and joins**, `currentColor`, no fills except the heart and sparkle accents.
- Size 20px inline, 24px standalone. Pair with a text label whenever the meaning is not universal.
- New icons must match the stroke, corner rounding and 24px grid, and be added to the sprite, not inlined.

## 9. UI components

- **Primary button:** `--g-brand` fill, white text, pill, 48px high, soft glow on hover, 98% scale on press. One
  per screen.
- **Secondary button:** surface fill, ink text, `--c-line` border, pill.
- **Text link:** `--c-brand-deep`, underline on hover and focus.
- **Inputs:** surface fill, 1px `--c-line` border, `--r-sm`, 16px text, brand focus ring (2px, 2px offset).
- **Chips (occasions, moods):** soft tint fill, ink text, pill, swatch dot on the left. Selected adds a 2px swatch ring.
- **Cards:** surface fill, `--r-md`, `--shadow-card`. Not every block is a card.
- **Sheets and modals:** `--r-lg`, `--shadow-pop`, slide up from the bottom on phones.
- **Feedback:** inline text first, a short toast second. Errors say what happened and what to do, in ink on the error
  background, never red alone.
- **Focus:** always visible. Never remove outlines without a replacement.

## 10. Motion and sound

- Easing `--m-ease` (`cubic-bezier(.22,1,.36,1)`). Durations 150 / 240 / 400ms.
- One moment of delight per screen: a burst, a glow, a rise. Everything else is quiet.
- Sound is synthesised in the browser, soft and short, off until the person interacts. Haptics are a light tap.
- Always honour `prefers-reduced-motion`: swap movement for fades.

## 11. Voice and tone

- Plain, warm, specific. Talk like a friend who wrote the card, not like a brand.
- Use "a little", "made just for you", "someone you love". Prices and steps are always stated exactly.
- Lowercase wordmark, sentence case headings, no exclamation marks in errors, at most one emoji per message.
- Do say: "Preview it free. Pay ₹199 only when you love it."
- Do not say: "Limited time!", "Hurry!", "Revolutionary", "Best in class".
- Hindi and Hinglish touches are welcome in marketing ("khol do", "dil se") when they feel natural, never forced.

## 12. Accessibility

- Text 4.5:1, large text and icons 3:1. Verified with axe in CI (`./scripts/ci-site-audit.sh`).
- 44px touch targets, visible focus, labelled controls, alt text for meaningful images.
- Colour is never the only signal. Pair with text or an icon.
- Gift pages work without sound, and animations respect reduced motion.

## 13. Marketing assets

- **Social post (1080×1350):** paper background, one phone mockup showing a gift moment, one serif headline with a
  gradient word, wordmark bottom left, kholona.in bottom right.
- **WhatsApp status / story (1080×1920):** occasion-soft background, large occasion illustration, 6 words max.
- **Testimonials:** real reviews only (`content/testimonials.json`), initials and first name, quote in serif.
- **Open Graph (1200×630):** paper, wordmark and mark, tagline "little gifts, big feelings".
- **Ads:** the first frame shows the gift being opened. End frame: wordmark, ₹199, "preview it free".
- Keep one occasion colour per asset. Never place the logo on a busy photo without its cream tile.

## 14. Where it lives in code

| Need | Where |
| --- | --- |
| Tokens (new work) | `app/tokens.css` |
| Legacy variables and mood palettes | `app/legacy.css` |
| Colour layer, gradients, occasion overrides | `app/effects.css` |
| Creator and unlock page styles | `app/creator.css` |
| Recipient gift effects | `app/gift.css` |
| Logo files | `public/icon.svg`, `public/favicon.svg` |
| Icon sprite | `lib/legacy-body.ts` |

# Design system (small, on purpose)

Tokens live in `app/tokens.css`. New UI should use them; older stylesheets keep their own variables and map onto the same palette.

**Colour.** Paper `#faf7f2`, ink `#432d32`, brand rose `#aa5265`. Secondary text is `--c-ink-soft` and small brand text is `--c-brand-deep`; both clear 4.5:1 on paper. Axe runs on the main screens in the end-to-end test, so a low-contrast colour fails CI. On dark scenes use light text and never darken it.

**Type.** Georgia for headings and the gift's voice, system sans for interface text. Nothing below 12px; body is 16px on forms and legal pages.

**Spacing and shape.** 4px base. Cards 16–22px radius, buttons fully rounded, tap targets at least 44px.

**Motion.** `transform` and `opacity` only, 150–400ms, the first screen never animated, content visible without JavaScript, everything off under `prefers-reduced-motion`. The one deliberate exception is the hover sheen on primary buttons, which animates a background position on hover only.

**Buttons.** One primary button per screen, in the brand gradient. Secondary is an outline. A screen must not offer two buttons that do the same job (see `docs/UX-AUDIT.md`).

**Copy.** Plain and warm, no invented numbers, no urgency that is not true, no price claims in search pages.

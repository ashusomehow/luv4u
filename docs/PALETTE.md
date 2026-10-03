# Palette

The brand is unchanged (warm paper, deep rose, quiet ink); the colours are a little more vibrant.

How it was done, so it can be dialled up or down: every coloured value (about 900 across the stylesheets, the gift engine and its inline SVG art, the share cards and the icons) was remapped by role, with no images involved.
- Paper, near-whites, near-blacks, greys and the warm ink are untouched, so text stays as readable as before.
- Rose and red tones: saturation x1.3, hue nudged about 3 degrees toward berry. Other colours (gold, sage and the like): saturation x1.2. Pale tints change least.

| Role | Before | Now |
|---|---|---|
| Brand | #aa5265 | #bb4161 |
| Brand deep (links, small brand text) | #8d3f51 | #9c304e |
| Paper / surface / ink | #faf7f2 / #fffdfa / #432d32 | unchanged |
| Success / warning / error text | #22482a / #5e4a12 / #7a2330 | #1d4d27 / #664e0a / #89142b |

Colour contrast is checked by the browser test (landing page, creator and the unlock page must have no contrast failures).

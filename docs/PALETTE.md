# Palette

Same warm paper and ink, a much livelier brand, and a colour for every occasion. Nothing here uses generated images: it is CSS variables, gradients and inline SVG.

## Brand
| Role | Before | Now |
|---|---|---|
| Brand | #aa5265 | #d6265d (vivid raspberry) |
| Brand deep (links, small text) | #8d3f51 | #b4184b |
| Primary button | flat rose | gradient #d92a5f > #c42a74 > #a62f92 |
| Headline accent word | rose | gradient #d92a5f > #f0683c > #f2a516 |
| Paper / surface / ink | #faf7f2 / #fffdfa / #432d32 | unchanged |

Every coloured value in the app (stylesheets, gift engine and its SVG art, share cards, icons) was remapped by role: rose and red saturation x1.3 then x1.38, other colours x1.2 then x1.32, with a slight berry hue shift. Paper, near-whites, greys and the warm ink are untouched.

## Occasions
Each occasion has its own colour on the landing page chips, the chooser cards and the creator (ribbon, focus rings, headline accent), and its own room in the gift:

| Occasion | Colour | Room |
|---|---|---|
| Birthday | coral #f2683c | bubblegum pink (the Cute look) |
| Proposal | crimson #e11d48 | rose (the Romantic look) |
| Love note | pink #ec4899 | hot pink to blush |
| Apology | blue #5b8def | calm periwinkle blue |
| Anniversary | gold #e5a010 | warm amber |
| Thank you | emerald #16a36e | mint green |
| Congratulations | violet #8b5cf6 | violet to pink to gold |
| Miss you | sky #3b82f6 | twilight blue |

A sender who picks a different look keeps that look's palette instead (six looks: Romantic, Cute, Funny, Emotional, Crazy, Elegant, each with its own accent, soft tone, room gradient and petal colour). The mood dots in the creator show them.

Where to change things: occasion colours and rooms are the `--occ` and `data-palette` rules at the end of `app/effects.css`; the six looks are the `.experience[data-vibe=...]` rules in `app/legacy.css`; brand tokens are in `app/tokens.css` and the `:root` block of `app/legacy.css`.

Button text and accents are chosen so white text on them keeps at least 4.5:1 contrast. The browser test checks contrast on the landing page, the creator and the unlock page.

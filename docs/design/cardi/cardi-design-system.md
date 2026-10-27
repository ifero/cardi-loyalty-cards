---
name: Cardì
colors:
  background: '#F0F0E8'
  surface: '#FFFFFF'
  surface-container-lowest: '#FFFFFF'
  surface-container-low: '#F7F7F1'
  surface-container: '#F0F0E8'
  surface-container-high: '#E8E8DE'
  surface-container-highest: '#E0E0D5'
  surface-dim: '#E0E0D5'
  surface-bright: '#FFFFFF'
  surface-variant: '#E8E8DE'
  on-surface: '#181824'
  on-surface-variant: '#55555F'
  on-background: '#181824'
  outline: '#9A9A93'
  outline-variant: '#D6D6CB'
  inverse-surface: '#181824'
  inverse-on-surface: '#F0F0E8'
  primary: '#181824'
  on-primary: '#FFFFFF'
  primary-container: '#2A2A3A'
  on-primary-container: '#FFFFFF'
  inverse-primary: '#FCCC0C'
  tertiary: '#FCCC0C'
  on-tertiary: '#181824'
  tertiary-container: '#FCCC0C'
  on-tertiary-container: '#181824'
  error: '#C41E1E'
  on-error: '#FFFFFF'
  error-container: '#FBDDDD'
  on-error-container: '#7A0E0E'
  ink: '#181824'
  beam: '#FCCC0C'
  cream: '#F0F0E8'
  card-red: '#E42424'
  card-blue: '#0C3C84'
  card-azure: '#0C84CC'
  card-green: '#0C843C'
  card-yellow: '#FCCC0C'
  dark-background: '#000000'
  dark-surface: '#181824'
  dark-surface-container: '#20202E'
  dark-on-surface: '#F0F0E8'
  dark-outline: '#3A3A48'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.03em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  label-bold:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
  mono-code:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
rounded:
  sm: 0.5rem
  DEFAULT: 0.75rem
  md: 0.75rem
  lg: 1rem
  xl: 1.25rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  touch-target: 48px
  screen-margin: 24px
---

## Brand & Style

**Cardì** is a loyalty-card wallet. Its entire job is one moment: a person is at a
checkout, someone is waiting behind them, and the right barcode must be on screen and
scannable in under three seconds. Everything in this system serves that moment or gets cut.

The name is _card_ + the Italian **ì**. The grave accent on that ì is the brand's only
ornament: at rest it is a dot, in motion it is a **scan beam** passing over a barcode.
That single idea — _you hold it up, and it is seen_ — is the whole identity.

**The accent descends.** A grave falls left to right: its high end is on the **left**, like
a backslash. An acute rises, and `Cardí` is a different word — so this is spelling, not
styling, and there is no variant where it leans the other way. The mechanical form of the
rule matters more than the typographic one, because the trap is a sign convention: in both
SVG and CSS the y-axis points **down**, so a _positive_ rotation is the correct one.

    rotate(35)     ✓  grave — descends to the right.  Cardì
    rotate(-35)    ✗  acute — rises to the right.     Cardí

Every exploration sheet in `frames/` was drawn with the negative angle until 2026-08-25,
while this document said "grave" throughout. Prose naming the accent did not prevent it;
only the sign does. If the shape is sheared rather than round-capped, flipping the sign is
also not sufficient on its own — mirror the outline, or the beam silently changes length
(at 24 × 9 units and 35°, a naive negation grows it to 30.3 and breaks containment).

**The ì sits on the baseline, and the anchoring ships with the glyph.** When the mark
replaces the letter inside live type, it is an inline SVG in a box exactly `1em` tall whose
own baseline is drawn at `y = 70` of a 100-unit viewBox. Left alone, an inline SVG aligns
its **box bottom** to the text baseline, which floats the glyph by the remaining
`(100 − 70) / 100 = 0.30em` — 15.6px at 52px, and unmistakable. The correction is therefore
not a tuned nudge but a derived one:

    vertical-align: -0.30em      /* = (100 − BASELINE) / 100 */

Carry it as an **inline `style` on the `<svg>`**, never as a stylesheet rule. This has been
wrong twice: first as a guessed `translateY(size * 0.28)`, then because a new sheet reused
the glyph markup without copying the `.wglyph` CSS. An `<svg>` missing its `vertical-align`
does not look broken in review — it looks like an `<svg>` — so the only reliable fix is to
make the anchoring inseparable from the markup it corrects.

The visual language is **warm, flat and structural**. Paper, not glass. No gradients, no
drop shadows, no glassmorphism, no neon. Depth comes from tonal layers and hairline
outlines. The app should feel like good stationery: calm, tactile, obviously useful.

## Navigation — HARD RULES, NEVER VIOLATE

These are product constraints, not preferences. A design that breaks them is wrong even
if it is beautiful.

- **There is NO bottom tab bar.** Never draw one. Not "Cards / Search / Settings", not
  any variant, not even a subtle one.
- **There is NO floating action button (FAB).** Never draw one.
- The real navigation is: **one Home screen** with a header carrying `+` on the **left**
  and a **gear** on the **right**. Everything else is a **stack push** from Home, or a
  **full-screen modal** for the barcode.
- Never invent global navigation chrome. If a screen seems to need a new nav pattern, the
  screen is wrong — simplify the screen instead.

## Colors

### The content is the colour — read this before anything else

This app's home screen already carries **45 distinct brand colours**: Esselunga yellow,
Coop red, IKEA blue, Lidl blue, Decathlon cyan, and fifty more. They arrive with the data.
The wallet is _already_ vivid, and it is vivid in a way we do not control.

So the palette below is **not there to make the app colourful — it is there to stay out of
the way of colour that already exists.** Chrome is quiet so the brands can be loud. Any
proposal that tints, washes, overlays or recolours a card surface is overpainting somebody
else's identity and making the screen harder to scan, not more playful. Playfulness in
Cardì comes from **big, uncropped, correctly-coloured brand marks** — a layout decision,
never a palette one.

One concrete collision to respect: **Esselunga is `#FFCC00` and the beam is `#FCCC0C`** —
effectively the same yellow, and Esselunga is likely the most-used card in the app. Never
put a large yellow chrome surface adjacent to the grid, or that tile disappears into the
furniture. Beam stays small, and stays away from the tiles.

### Three roles, and they never trade jobs

- **Ink `#181824`** — structure, body text, borders, and **all primary actions in light
  mode**. Buttons are ink with white text. This is the brand's dark, not a neutral grey.
- **Beam `#FCCC0C`** — the signature. The ì accent, the scan-beam motif, focus rings,
  active/selected states, and **all primary actions in dark mode**. Always pair with ink
  text (`#181824`), never white.
- **Cream `#F0F0E8`** — the light-mode ground. Cards sit on cream as pure white
  `#FFFFFF`. Cream is where the warmth comes from; do not replace it with grey or white.

**There is no fourth chrome colour, and `#0C3C84` is not one — RETIRED 2026-09-16 (Story 21.2).**
Deep blue was listed here as _"secondary structure only (barcode-modal chrome, informational
emphasis)"_, and the frontmatter carried it as `secondary` / `secondary-container` /
`on-secondary-container`. That role contradicted this document twice over, so the contradiction is
resolved by removing the role rather than by softening either rule:

- `#0C3C84` **is one of the five card accents** (see below), and Forbidden carries _"card accent
  colours used as chrome"_. A colour cannot be both the fallback fill of a user's card and the
  app's secondary structure — on a card-detail screen for a deep-blue custom card, the chrome and
  the content would be the same value, which is the one thing the accents exist not to do.
- The role's only named use — **barcode-modal chrome** — is independently forbidden by
  _Barcode view_: _"The surround must be neutral — black, ink, cream or white only. Never a
  saturated field around the scan target."_ `#0C3C84` is saturated.

The two prompts that reason from the retired role (`stitch-prompts-auth.txt:96`,
`stitch-prompts-onboarding.txt:87-89`) cite it **only to rule it out** before settling on ink, so
their conclusions stand unchanged and are in fact strengthened: deep blue was the one alternative
they had to argue against, and it is now simply not available. `theme.link` and `theme.info` take
**ink** in light and, since a link is an action, **beam** in dark — the same pair as `primary`.

**A card accent is legal as the card's OWN full-bleed detail field, and illegal everywhere else.**
This is the one exemption to _"card accent colours used as chrome"_, and it is narrow on purpose.
The card-detail screen's inset, header and hero are a single unbroken region filled with **that
card's** accent — the spec's _"three separately filled boxes leave visible hairlines where they
meet"_ — and the 56px header with its back chevron and favourite star is part of that region, not
chrome laid over it. The test is ownership, not geometry: the field belongs to the card being
looked at. An accent tinting a button, a link, an icon, a nav bar, a badge, or any surface that
outlives the card on screen is still forbidden, and a card accent is never the value of a theme
token. `#0C843C` is bound by exactly the same logic, which is why `theme.success` does not take it.

**Never darken, desaturate or tint the beam.** Olive, mustard, gold, amber and brown are
forbidden — they are the failure mode of tonal colour generation, not design choices. If a
darker yellow seems needed, use **ink** instead. `#FCCC0C` appears at exactly that value or
not at all.

**Beam under alpha is the rule's blind spot, and it has a threshold — ADDED 2026-09-16 (Story
21.2).** "Never darken the beam" is easy to keep when you are choosing a hex and easy to break when
you are writing `theme.primary + '33'`, because the token still says `#FCCC0C` and only the
_rendered_ pixels are a darker yellow. The composite is measurable, and what decides it is how
light it gets — not how saturated, which over a black ground stays high at every alpha and tells
you nothing:

| alpha | over black | over ink  | reads as          |
| ----- | ---------- | --------- | ----------------- |
| 8 %   | `#141001`  | `#2A2622` | warm near-black ✓ |
| 10 %  | `#1A1501`  | `#2F2A22` | warm near-black ✓ |
| 20 %  | `#322902`  | `#463C1F` | **olive** ✗       |
| 45 %  | `#725C05`  | `#7F6919` | **olive** ✗       |
| 75 %  | `#BD9909`  | `#C39F12` | **mustard** ✗     |

So: **beam may be washed at 10 % or less**, where it is a tonal layer and reads as warmth rather
than as a colour, and **not above it**, where it becomes exactly the olive-to-mustard ramp the
Forbidden list names. A shape that must read _as_ beam is drawn at full `#FCCC0C`; a shape that
must be a quiet layer takes ink, cream or `surface-container`. This only bites in dark mode,
because in light `primary` is ink and an ink wash is a grey.

**Coral, salmon, terracotta and orange are banned from this system entirely.**

### Card accents — CUSTOM CARDS ONLY

Five colours, taken directly from the logo's five bars:
`#E42424` red · `#0C3C84` deep blue · `#0C84CC` azure · `#0C843C` green · `#FCCC0C` yellow.

These are the **fallback fill for a card with no catalogue brand**, chosen by the user from
a 5-colour picker. A card that _has_ a brand uses the brand's hex instead — the five
accents never override it.

They are **never** used for buttons, links, chrome, headers, icons or any interactive
element, and never as a tint or wash over a branded tile — with the single exemption named
under _Three roles_: an accent may fill **its own card's** full-bleed detail field, header
included, because there it is the content rather than the chrome.

> ## ⛔ OPEN — RAISED 2026-09-17 (Story 21.2a). AZURE CANNOT CARRY AA TEXT.
>
> **This document owes an answer before the rebrand release ships.** It is not an
> implementation question; the code is complete and gated either way.
>
> `#0C84CC` sits in the contrast dead zone: **no** foreground reaches WCAG AA 4.5:1 on it.
> White is 4.05:1 and ink — the better of the two — is 4.34:1. Choosing differently cannot
> fix it.
>
> | accent              | foreground the app picks | contrast   | AA 4.5:1  |
> | ------------------- | ------------------------ | ---------- | --------- |
> | `#0C3C84` deep blue | white                    | 10.53:1    | ✅        |
> | `#E42424` red       | white                    | 4.59:1     | ✅ (thin) |
> | `#0C843C` green     | white                    | 4.79:1     | ✅        |
> | `#FCCC0C` yellow    | ink                      | 11.53:1    | ✅        |
> | **`#0C84CC` azure** | white (best: ink 4.34)   | **4.05:1** | ❌        |
>
> Why it matters rather than being academic:
>
> - It is **reachable in ordinary use**, though less than when this was raised. Since Story 22.3
>   no small text sits on the accent at rest — the card-detail bar has no title over the field,
>   and a custom card's initial in the hero is large text, 28px bold — but the condensed title, the card's name at 17px weight 600 (under both WCAG large-text
>   thresholds, 24px regular and 18.66px bold), still crosses it mid-blend, fading in as the
>   field fades out, and the filled favourite star sits on it (below). See _Card detail_.
> - It is the **default**. Azure is the accent an unresolvable card colour falls back to, so it
>   is not only what a user picks, it is what they get when nothing was picked.
> - It is a **regression**. The colour it replaced was `#64748B`, which passed at 4.76:1.
> - There is **no OTA remedy**. `runtimeVersion.policy` is `appVersion`, so this ships in a
>   store release that cannot be corrected without another one.
> - The same colour puts the favourite star at 2.66:1 against a 3:1 non-text floor. In
>   aggregate the star still improves — the retired palette failed on two accents and this one
>   fails on one — but azure specifically regressed.
>
> Three ways out, all measured:
>
> 1. **Accept the exception**, on the grounds that a card's own field is content rather than
>    chrome. Costs nothing and changes no colour; ships a real AA failure on a default.
> 2. **Darken the azure to `#0B7CC0`** — about 6% down its own hue, where white clears at
>    4.51:1 (`#0C7FC4` is still short at 4.33:1). Fixes every surface at once — phone, both
>    watches, the picker — but amends this palette, so the frames and generators under
>    `docs/design/cardi/` that cite `#0C84CC` drift until regenerated.
> 3. **Give the card-detail header large text** (≥18.66px bold), moving that surface's floor to
>    3:1 so 4.05:1 passes legitimately. Narrowest change, touches no token — but it fixes one
>    screen and leaves the tile and both watch avatars where they are, and the type scale
>    belongs to Story 21.6.
>
> The numbers are pinned in `shared/theme/colors.contrast.test.ts` (`Card accent contrast`), so
> they cannot drift while this stays open. ⚠️ **That test PASSES** — it records the measurement
> rather than failing on it, so nothing mechanical blocks a merge. The only thing holding this
> open is this note.

## Typography

**Space Grotesk** for display and large headlines — it carries the personality; its slightly technical, quirky letterforms echo the barcode.
**Inter** for everything else — it carries the legibility. **JetBrains Mono** for card
numbers, so digits align and don't jitter while someone reads them aloud.

Thin weights are prohibited. Minimum body size is 15px. Headlines use tight tracking;
small labels use slightly open tracking.

**`display-lg` is weight 700, not 800 — AMENDED 2026-09-27 (Story 22.1, from Story 21.6's
hand-off).** The frontmatter said 800, but Space Grotesk's heaviest master is 700 (its weight axis
runs 300–700), so the app has never been able to draw 800 — a generator reading that value would
synthesise a weight the product does not render.

**Form field labels are UPPERCASE** — `label-bold` (Inter 13px, weight 600, +0.02em
tracking), ink, sitting above the field. This ratifies deliberately what the generator
originally chose by accident, on two grounds: that positive tracking already in the token is
an uppercase idiom, and casing the label differently from its value is what lets someone
parse a form's structure at a glance — which is exactly how a read-only row is kept from
reading as a control. Both locales' labels are short enough that the extra width costs
nothing (`Store name` / `Nome negozio`, `Card number` / `Numero carta`), so this is a voice
decision, not a constraint. Placeholders, values and error messages stay sentence case.

## Layout & Spacing

- **Frames — and this rule governs SCREEN designs only.** A screen design is a drawing of a
  surface the app renders. **Artwork canvases are not screens** and this rule has never been
  aimed at them; they are listed at the end of this section so that no reading of it can
  forbid the icons and banners the app has to ship. Three screen classes exist, and only
  three:

  | class       | frame                                             | unit    |
  | ----------- | ------------------------------------------------- | ------- |
  | **Phone**   | **393 × 852** — iPhone-class portrait             | pt / dp |
  | **Wear OS** | **192 × 192**, drawn **round _and_ square**       | dp      |
  | **watchOS** | seven size classes, **162 × 197** → **205 × 251** | pt      |

  No desktop, no tablet, no arbitrary heights. The two watch classes are not licence to
  invent a third layout language: what may be drawn inside them is
  [`cardi-watch-grammar.md`](cardi-watch-grammar.md), which is **part of this system**, not
  an appendix to it.

  **The Wear frame is stated in dp deliberately.** `384 × 384` is the same screen counted in
  **pixels**, at the ×2 density every current Wear device uses; it circulates because Play's
  store-screenshot floor happens to be 384 px. Setting that number beside `393 × 852` — which
  is points — makes a watch look as wide as a phone. It is **less than half**. Google's own
  guidance is dp and round-first: draw at **192 dp**, the smallest supported round screen,
  and let 225 dp and above grow into the space.

  **The watchOS classes, measured** — from Xcode's own simulator device profiles. The table
  lives in `targets/watch/__tests__/watch-layout-contract.test.ts` and in no source file.
  40 mm is the floor because the watch target deploys to watchOS 10:

  | 40 mm     | 41 mm     | 42 mm     | 44 mm     | 45 mm     | 46 mm     | 49 mm     |
  | --------- | --------- | --------- | --------- | --------- | --------- | --------- |
  | 162 × 197 | 176 × 215 | 187 × 223 | 184 × 224 | 198 × 242 | 208 × 248 | 205 × 251 |

  Two traps in that table. The **widest** watch is the **46 mm at 208 pt**, not the 49 mm
  Ultra — "design for the biggest" picks the wrong device. And the 44 mm is **narrower** than
  the 42 mm (184 against 187) while being taller, so the classes do not order by one
  dimension. Draw against **40 mm**, then check the **46 mm** and the **49 mm**.

  **Artwork canvases, which this rule does not govern:** the 1024² app-icon masters — watchOS
  has its own, while Wear's densities are downscaled from the phone's shared 1024² source, and
  **both mask to a circle**, not the phone's squircle — the four Android launcher
  mipmaps at 162² / 216² / 324² / 432², the 512² Play icon and its alpha variant, the
  1024 × 500 Play banner and the 4096 × 2304 developer banner. Square or landscape by
  requirement, every one of them.

- Strict **8px grid**; 4px only for micro-adjustment.
- Screen margin **24px**. Vertical gap between list rows **8px**.
- Every interactive element is at least **48 × 48pt**.

> **Both of those numbers were settled by the grid above, on 2026-08-21, and each artefact
> lost one.** This document said margin 20 / target 48; the generated tokens said margin 24 /
> target 44. Neither "the code is the truth" nor "the design system is the truth" gets both
> right — each frame scores exactly half. The grid does better, and the grid is stated here, so
> this document adjudicated against itself:
>
> | value                                | ×8   | verdict      |
> | ------------------------------------ | ---- | ------------ |
> | `TOUCH_TARGET.min` = 44              | 5.50 | **off grid** |
> | touch target 48                      | 6.00 | on grid      |
> | screen margin 20                     | 2.50 | **off grid** |
> | `LAYOUT.screenHorizontalMargin` = 24 | 3.00 | on grid      |
> | grid margin 16 (derived, tested)     | 2.00 | on grid      |
>
> **Margin is 24, not 20.** 20 is 2.5 × 8. The "4px for micro-adjustment" clause does not
> rescue it: a screen margin is the most structural measurement on a page, and if _that_ is a
> micro-adjustment the grid means nothing. This also retires the "margin drift" note kept
> against settings and the scanner — both sit at 24 because they follow the token, and the token
> was right. `CardForm` at 32 and the old document 48 were the only genuine one-offs.
>
> **✅ RESOLVED 2026-10-14 (Story 22.6) — `CardForm`'s 32.** Card edit's form now draws
> `FormScreen` (_Forms_) on the 24px margin, so that one-off is gone.
>
> **✅ RESOLVED 2026-10-19 (Story 22.8) — the document screens' 48.** Help, the privacy policy and
> What We Collect now draw `DocumentScreen` (_Documents_) on the 24px margin, so the last one-off is
> gone.
>
> **Touch target is 48, not 44** — and here the token is the one that moves. Two independent
> grounds. `app.json` declares **both** platforms, and a minimum binding on two platforms is the
> **max** of their minimums: Apple HIG 44pt, Material 48dp, so 48. And 44 is off the grid, by
> the same test and with the same non-defence available to it.
>
> **The two margins that remain are 24 and 16**, and 16 is not a style choice: `TILE_WIDTH` 171
> in `features/cards/utils/gridLayout.ts` is `(390 − 2×16 − 16) / 2`, frozen with tests. Both
> are on the grid.
>
> **⚠️ APPLIED 2026-09-24 (Story 21.5) — the ruling above had never been applied to the block it
> ruled on.** This document's own frontmatter still said `screen-margin: 20px` a month after
> adjudicating that margin is 24, so the file contradicted itself on the one value the
> adjudication was written to settle. It now reads 24, matching both the prose here and
> `LAYOUT.screenHorizontalMargin` in `tokens/spacing.json`. Nothing parses this frontmatter — the
> generators and frame tools cite this file in comments only — so the correction changes no
> generated output; it removes a contradiction a reader would otherwise have to adjudicate again.
>
> **✅ The touch-target half — APPLIED 2026-09-27 (Story 22.1, absorbing 16.33).**
> `TOUCH_TARGET.min` in `tokens/spacing.json` is now **48**, and every layout that wrote a literal
> 44 beside it now reads the token. `TOUCH_TARGET.watch` (32) is **retired rather than corrected**,
> as [`cardi-watch-grammar.md`](cardi-watch-grammar.md) §5.4 decided: it had no reader, and neither
> watch app — Swift and Kotlin — can read a TypeScript token, so a corrected 48 would have been an
> unreachable constant that looks authoritative. Two layouts had to change shape, not just size:
> five 48pt colour swatches no longer fit a fixed gap on a 375pt screen, so both pickers now spread
> them across the width, as the form frame always drew them.

- The **phone** home screen is a **2-column grid of brand tiles** (see Card tile). This is the
  shipped layout and it is correct — do not replace it with a single-column list of rows. **The
  watch list is single-column rows and is correct too**, for the opposite reason: a 192 dp screen
  fits one tile, so there is nothing for a grid to be a grid of. See
  [`cardi-watch-grammar.md`](cardi-watch-grammar.md) §7.1.
- Stack-pushed screens (detail, add, edit, settings) are single-column, content-first.

## Shape

- Cards and sheets: **16px** radius.
- Buttons and inputs: **12px** radius.
- Virtual-logo tiles and chips: **fully round**.
- Consistent everywhere; no mixed radii within one screen.
- **On the watch the card row is 14, not 16** — a radius is a proportion of what it rounds, and 16
  on a 48 pt row reads as a pill. Excepted, with the reason, in
  [`cardi-watch-grammar.md`](cardi-watch-grammar.md) §5.5.
- **The single-card tile is 20, not 16** — a wallet holding one card draws it alone at 220 × 180,
  about the proportion 16 is on 171, and no 16px tile shares its screen (Story 22.2; see _Card
  tile_).

## Elevation

Flat. **No drop shadows anywhere.** Hierarchy is colour blocking plus a **1px** hairline
outline (`#D6D6CB` in light, `#3A3A48` in dark). Tap feedback is a **0.98× scale**, never a
shadow bloom.

**The one exception: text set directly on a camera feed — AMENDED 2026-10-12 (Story 22.5).** The
scanner's instruction and its "Scanning image…" line carry a text shadow, 0 / 1 / 3 at 75 % black.
It is legibility over a background nobody controls, not decoration — the same class of exception as
the barcode's quiet zone. It goes on nothing else: not on the scanner's action rows, its pill or its
banner's plate, and never on the app's own ground (_Capture_).

## Components

**Every component below exists as a primitive in `shared/components/ui/` — BUILT 2026-09-27
(Story 22.1), joined by the form pattern's three in Story 22.6, by settings' two in Story 22.7 and
by the document screens' three in Story 22.8, the search field among them, moved from
`features/cards`.**
That directory is the only one Storybook and Chromatic see, so a primitive placed anywhere else gets
no story and no visual coverage. Screens compose these; they do not re-draw them.

| component                     | primitive                                                            |
| ----------------------------- | -------------------------------------------------------------------- |
| Card tile                     | `Tile` (+ `FavouriteBadge`)                                          |
| Buttons                       | `Button`                                                             |
| The primary-action footer     | `PrimaryActionFooter`                                                |
| Input fields                  | `TextField` (+ `FieldLabel`, `FieldError`)                           |
| Section header                | `SectionHeader`                                                      |
| The hairline-outlined surface | `Surface`                                                            |
| Sheets                        | `BottomSheet`                                                        |
| Forms                         | `FormScreen` (+ `FormField`), the auth screens' too since Story 22.9 |
| A failed request              | `RequestErrorBanner`                                                 |
| A header's icon button        | `HeaderIconButton`                                                   |
| A screen's own header         | `ScreenHeader`                                                       |
| A pick-one list               | `OptionList`                                                         |
| A document's ground           | `DocumentScreen`                                                     |
| A bulleted list               | `BulletList`                                                         |
| A search field                | `SearchBar`                                                          |

### Card tile (the core component)

A **2-column grid** of tiles at a **171 : 140** ratio, 16px radius, width derived from the
viewport. The card name sits in `label-bold` **below** the tile, never inside it.

A wallet holding exactly one card draws it alone as a **220 × 180** tile at radius **20** — about
the same proportion as 16 on 171 (Story 22.2).

**The tile is filled with the brand's own colour and carries the brand's own logo**, sized
generously — roughly 85% of the tile. A card belonging to a catalogue brand shows that
brand's hex and mark, not ours. Only a **custom** card (no brand) falls back to one of the
five card accents with a first-letter avatar.

**The mark is 85 % of the tile, not 60 % — RULED 2026-09-27 (Story 22.1, AC11).**
`stitch-prompts-wallet.txt` said _"about 60% of the tile width"_, twice, against this document's
85 %. The shipped tile implements 85 % — a box 85 % of the tile's width **and** height — and
building against the prompt would have shrunk every brand mark by about 30 % on the screen this
system calls the point of the product. This document wins; both prompt sites now say 85 %.

Legibility rules that follow from filling with 45 different brand colours: a very light
brand takes a 1px hairline outline so it doesn't dissolve into cream; a near-black brand
takes a `#3A3A48` outline in dark mode. Foreground glyphs flip to white or ink by the
tile's luminance. A favourite shows as a **beam `#FCCC0C` star on an opaque ink `#181824`
plate**, 24px, pinned top-right, so it stays legible on any brand colour including yellow.

**The light-brand hairline is the system hairline, `#D6D6CB` light / `#3A3A48` dark — AMENDED
2026-09-27 (Story 22.1, AC3).** It was an 8 % black wash, and the tile also carried a light-mode
drop shadow, which this document forbids. With the shadow removed the hairline is the ONLY thing
between a white brand and the cream ground, so it takes the same value as every other outline.
Tap feedback is the 0.98× scale from _Elevation_, not the 70 % dim the tile used to do.

**The plate is opaque and it is ink — AMENDED 2026-09-16 (Story 21.2, AC9), replacing "an opaque
white plate".** White was invisible on a light brand, which is the case the plate exists for, and
the star it carried was an amber outside this palette. Opacity is load-bearing rather than
stylistic: Esselunga is `#FFCC00`, three points from beam, so the plate is the only thing between
the star and the tile people open most. On the **card-detail header** there is no plate and none is
added — a plate there would break the single filled region above — so the star is drawn straight on
the brand's colour and falls back from beam to ink on a light field.

### Card detail

**RULED 2026-10-09 (Story 22.3)**, from `frames/cardi-card-detail-frames.html` and
`stitch-prompts-card-detail.txt`. The screen you pass through to reach the barcode, and the only
scroll-linked screen in the app. Where the frames and prompts are silent, or this document overrules
them, the ruling is recorded here, so the screen cannot drift from either without saying so.

**One field, then a blend.** At rest the status-bar inset, the bar and the 200px hero are one region
in the card's own colour — its brand's hex, or a custom card's accent (_Three roles_) — carrying the
mark and no title (frame A). While any of the hero is still under the bar, the bar IS the hero. Once
the hero has gone, the bar blends from the field to the ground over **48px** of scroll as the title
fades in, in step (frame B: Esselunga half-way over cream is `#F8DE74`), and it then rests on the
ground with a **1px hairline**, never a shadow (frame C). The blend follows the scroll and is never
timed: scrolling back reverses every step, and Reduce Motion needs nothing.

- **No resting mid-blend.** A scroll that comes to rest inside the band — a drag released with no
  momentum, or a fling whose momentum runs out there — settles to the band's nearer end, so the bar
  is never left half-faded: red over cream would rest on salmon, yellow over black on olive, both
  banned. A scroll that rests outside the band is left exactly where it stops. Scrolls that are not
  drags — a screen reader bringing a row into view, a hardware keyboard — can still stop inside the
  band; that is recorded, not engineered around.
- **The midpoint flip.** The back chevron, the favourite star and the status bar take the field's
  contrast foreground — white or ink — at rest, and the scheme's past the blend's midpoint, where the
  bar is more ground than field. A favourited star is beam on a dark field and ink on a light one,
  with no plate (_Card tile_); past the midpoint it is measured against the ground the same way —
  **ink on cream, beam on black** — because the beam rule lists the filled favourite star.
- **The title** is the card's name in `body-lg` semibold, `on-surface`, one line, clear of both
  controls. It does not scale with Dynamic Type, as a native bar title does not, and it is hidden from
  screen readers until the midpoint: until then the name heading the content below the hero, in
  `headline-md` and two lines at most, is the screen's title.
- **Dark.** The field stays the brand's own colour, and the condensed bar is the black ground with
  the `#3A3A48` hairline.
- **The hero** carries only the mark: the brand's logo straight on its colour, or a custom card's
  first letter in an 80px circle, fading out over the first 100px of scroll. On a dark field the
  circle is a 16 % white wash (frame D); on a light one it is a **1px ring in the foreground, with no
  wash**, because an ink wash over the beam-yellow accent paints mustard. A very light field takes
  the system hairline along the hero's bottom edge on cream, as a light brand's tile does, and the
  bar keeps it through the blend. A field-coloured extension above the hero keeps the field — never
  the ground — in view when iOS bounces the scroll at the top. ⛔ **OPEN:** the logo sits in an 80px
  square slot, so a wide wordmark (Decathlon's, IKEA's) reads smaller than frame A's stand-in, a
  wordmark about 170px wide; no rule yet sizes it.
- **Loading and error.** Before the card has loaded, and when it cannot, the bar is transparent from
  the first frame of the push over the ground — an opaque bar turned transparent only as the push
  ended, and the card jumped up under it — with the same back chevron in `on-surface`. There is no
  title while loading, which would linger over the field until the push ended; an error is titled
  "Card Details".

**The barcode card** is the first thing below the name, so the barcode is on screen at rest, and the
whole card opens the full-screen barcode. It stays **white in both schemes**, so its "Tap to enlarge"
hint is the light scheme's muted `#55555F` in dark too. Its padding is **16, not the frame's 20**:
16 is a spacing token and 20 is not. Its side padding is the barcode renderer's own 16px white
margin, so on a phone too slim for a 280px code and that margin, the bars narrow rather than the
white overrunning the card's hairline. Card detail asks for QR codes at the renderer's **220px
floor** — the renderer raises any smaller request to it. Nothing is drawn over the bars at any scroll
position. The brightness bulb (Story 16.39) sits below the card, outside it: off, an outline in
`textSecondary` (`#55555F` in light, `#B5B5AB` in dark) inside a `border` ring; on, **filled**, in
`primary` — ink in light, beam in dark.

**The details card** — Number, Color, Added — is a hairline-outlined surface, as MANAGE is. The
number is set in **`mono-code`**, this document's card-number face, over the frame's Inter, and it is
grouped in fours **only when it is all digits**: a QR code's URL or an alphanumeric Code 128 is shown,
and spoken, exactly as it is. **The Color row is for custom cards only** — the frames draw one for
Esselunga, but a branded card's colour is its brand's, never the accent its stored key names — and it
shows the accent's name and nothing else.

### Buttons

- **Primary:** ink fill, white text, 12px radius, 52px tall, full width, anchored in the
  footer (see below).
- **Secondary:** transparent with a 1px ink outline.
- **Destructive:** borderless, `#C41E1E` text, **no icon**.
- **No FAB. Ever.**

**The destructive button carries no icon — AMENDED 2026-09-27 (Story 22.1, AC11).** This line
said _"trailing icon"_ while every card-detail and settings prompt says _"no red fill, no border,
no outline, no trash icon"_. The frames are the later and more specific answer, so this document
follows them. It is text only, in `#C41E1E` — `#FF453A` in dark, because the light red fails AA
there (3.55:1 on black, 2.97:1 on an ink sheet, against 5.16:1 for `#FF453A` on ink) — and it
acknowledges a press like every other transparent button, with an 8 % wash of its own label colour. Until Story 22.1 it was a solid red slab with a white label and a border, whose
pressed colour equalled its fill.

**Every button is 12px, unconditionally.** The shared button was 14; it is corrected, not
justified. Heights split by role: the primary action in a footer and a sheet's actions (_Sheets_)
are **52px**, and every other button takes the **48px** touch target — settings' guest Create
Account and Sign In among them, over the settings frame's 52 (Story 22.7).

**One control in the whole system is drawn disabled — the type-to-confirm delete gate — RECORDED
2026-09-27 (Story 22.1, AC11).** `stitch-prompts-settings.txt` specs the delete-account sheet's
button as _"the ONE place in this system where a control is drawn disabled, because the gate is
the whole point"_: the borderless destructive label at **40 %**, inert until the word is typed.
That is a deliberate carve-out from _"the primary action is always enabled"_ and from Forbidden's
_"a disabled button as a form's resting state"_, and it is the only one: a gate that EXISTS to
refuse is not a form refusing to say which field is wrong. Nothing else takes this rendering.

### The primary-action footer

Every screen with a primary action **anchors it to the bottom of the frame**, separated from
the content above by a **1px hairline rule** (`#D6D6CB` light, `#3A3A48` dark) spanning the
full frame width. This is not a floating button and not a FAB — it is the last _region_ of
the page, in flow. The bottom is where the thumb already is, and holding one position across
all eight form-pattern screens is worth more than any single screen's composition.

The space this leaves above the rule on a short form is **composition, not absence.** The
hairline is what makes it read that way. Do not close the gap by letting the button rise to
meet the last field — that trades a predictable commit position for a per-screen one.

**Never `position: absolute`.** Either make the footer a **flex sibling below the scroll
area** inside the `KeyboardAvoidingView` (the reference implementation — see `FormScreen`
(_Forms_), where the footer sits outside the `ScrollView` and therefore never scrolls away), or,
when the button must live inside scrollable content, anchor it with `marginTop: 'auto'` in a
`flexGrow: 1` container. An absolutely-positioned footer instead
either hides beneath the keyboard or rides above it, stealing height from the field being
typed into.

**The primary action is always enabled.** Pressing it on an incomplete form reveals the
field errors; it never sits inert. A permanently visible disabled button is a permanent
refusal that never says which field is wrong — and once the action is anchored, that refusal
is in the eye line for the whole session. The form-pattern screens — card setup, card edit and the
six auth screens — work this way, with validation raised on press.

**A way out under the primary (Story 22.9).** The auth screens' footer also holds a link row, 8px
under the primary: "Don't have an account? Create one". From a font scale of 1.5 it leaves the
footer and closes the body instead, so the footer that rides the keyboard holds the primary alone
(_Authentication_, decision 3).

> **CORRECTED 2026-10-14 (Story 22.6).** This said `CardForm` was the outlier and gated on
> `!isValid`. That has been false since Story 22.1 made its Save always enabled, and setup's
> `disabled={isLoading}` is gone too: both now draw `FormScreen`, whose action is never disabled.

**Busy is not disabled.** While a submit is in flight the button is non-interactive to
prevent a double submit, but it keeps its **ink fill** and swaps its label for a spinner.
Greying it out re-introduces the refusal read this rule exists to remove — a busy control
says "working", a grey one says "no".

### Barcode view (the hero moment)

A full-screen modal that **always renders light regardless of theme**: pure white
container, true-black bars, maximum screen brightness. The store name sits above, the card
number below in `mono-code`. Nothing else on this screen — no nav, no chrome, no ads.

**Nothing may overlay the bars. Ever.** No beam, no scan-line, no shimmer, no watermark, no
logo, no gradient, no rounded mask cropping the code. Every pixel drawn on a barcode costs
contrast on the one screen that cannot afford any, and a first-try scan is the whole product.

**The surround must be neutral** — black, ink, cream or white only. Never a saturated field
around the scan target: at maximum brightness that is glare next to the thing a cashier is
trying to read.

**The beam is not ours to draw here.** The ì carries the beam as the brand's promise; the
real beam comes from the scanner at the till. On this screen the app's job is to hold up a
perfect white field and get out of the way. The beam motif belongs to the logo, the splash,
focus rings and loading states — never to the barcode.

**RULED 2026-10-09 (Story 22.4)**, from `frames/cardi-barcode-frames.html` and
`stitch-prompts-barcode.txt` — frames A (EAN-13), B (QR) and C (card not found). Where they are silent,
or this document overrules them, the ruling is recorded here, so the screen cannot drift from either
without saying so.

**One view, two ways in.** Card detail's barcode card and the `cardi://barcode/<id>` link open the same
view. Card detail presents it in place, in a full-screen modal that leaves card detail focused beneath
it, so closing it returns there as it was: no reload, no second usage count, no dip in brightness. The
`barcode/[id]` route renders it for the link. The two copies it replaced had already drifted apart.

**The stack** sits centred as a group between the system insets, on the 24px screen margin. Top to
bottom: the store name in `headline-sm` ink, two lines at most; 24px; the code; 16px; the number; 40px;
"Tap anywhere to close" in Inter 14, muted `#55555F`. Nothing else — no header, close button, icon,
logo, brightness hint or toast. At the largest text sizes, where the group no longer fits, it starts
at the top inset instead of spilling over both: the name stays clear of the clock, and the code stays
whole and unshrunk on screen. Below the code, **the number and the hint can run off the bottom of a
small phone** — a three-line number under a QR code does — and this record says so rather than
promising otherwise.

- **The box.** A linear code sits in a box `min(0.8 × window width, 320)` wide — 314px on a 393 phone —
  and **200px tall, its bars running the box's full height**: the code is stretched to the box, with no
  white above or below the bars. The width is the shipped rule, which the frames ratify: the white
  either side is the quiet zone (the prompts' finding 6). The barcode renderer's own 16px white padding
  either side is white on white, so it does not show.
- **The stretch is on both axes.** Where the box's width already limits the code — EAN-13, a long Code
  128 — the bars keep their width and only grow taller. A short code such as EAN-8 widens to the box
  too, every module by the same factor, as frame A draws its code. Its 67 modules and the renderer's
  12 units of side padding, stretched across 314px, make a module of about 3.98px — about 0.66mm on a
  460ppi phone, about 200 % of EAN's nominal 0.33mm and so at the top of its 80–200 % range — and of
  about 4.05px at the 320px cap: about 203 %, just past it.
- **QR codes are as wide as linear ones**: a square box of the same width, 314px on a 393 phone against
  the frame's 200. The symbol inside it draws at about 288px, up from card detail's 220, and the stack
  ends up about 114px taller than frame B.
- **The number is shown exactly as stored**, never grouped — unlike card detail's Number row — in
  `mono-code` as this document has it, without the frame's extra 1px of tracking. A long one wraps to
  three lines at most; a longer one is cut there with an ellipsis on screen, while its spoken label and
  the copy carry it whole.
- **White edge to edge, in both schemes**: `#FFFFFF` under both insets, true-black bars, and text in the
  light scheme's roles — ink, `#55555F` and `#C41E1E` — whatever the theme, under a dark status bar.
  One exception is recorded, as the loading state's is below: on Android, card detail's modal may keep
  card detail's own status-bar style, because its dialog copies the window's style once, as it opens.

**The ground never moves.** The white field is there from the view's first frame and never fades or
slides; only the content above it does. So nothing but white shows behind the code while the link
loads, while the content fades in, or while it leaves — with one exception, on the route: on a warm
link its content can show in the last frames of the route's own fade (_Opening_). The content fades
in over 200ms; a tap fades it out over 150ms, and a swipe slides it away over 200ms. Every timed
animation follows the system's Reduce Motion.

**Opening: from card detail, the code is never drawn over the screen beneath. The route has one
recorded exception.**

- **Card detail on iOS.** The modal fades in. It reports that it is showing once that fade has ended,
  and only then does the content fade in, so the fade brings in the white alone.
- **Card detail on Android.** The modal has no animation. Android reports it showing as the dialog's
  own fade starts, so content waiting for that would still fade in over card detail; with no window
  animation the white is there at once, and only the content fades.
- **The route** reveals its content at once, because on Android a cold link's first screen reports no
  end to its transition to wait for. On a warm link the content can therefore show in the last frames
  of the route's own fade. That is accepted: the route has no caller inside the app, only the link.

**Closing: the content goes first, then the screen.** Every close runs the content's exit over the
white — a fade on a tap, on VoiceOver's escape gesture or on Android back, a slide on a swipe — and
only then is the screen removed: card detail's modal is hidden, which on iOS fades out from the white
and on Android goes at once, and the route goes back. A close marks the view as closing, the swipe's
included, so a modal that reports it has finished showing after one does not bring the content back.

**Loading and frame C.** While the link loads its card, the screen is an ink spinner on white. On a cold
launch by the link, the loading state alone may show the scheme's status bar, because the app's root
bar mounts after it and wins; that is accepted. A card that cannot be loaded is frame C: its message in
`body-lg` semibold, `#C41E1E`, centred on the 24px margins, with **"Go back" 32px below it in `body-lg`
ink** — plain text on a 48px target. The frame says Inter 16, which no token is, and the shipped screen
already used 17. A press on "Go back" shows an 8 % ink wash behind it, on the 12px radius, as on every
transparent button (_Buttons_).

**The gestures.** Story 2.5's, kept:

- a **tap anywhere** closes;
- a **swipe down** past 100px, or flung down, closes;
- a **long press on the number** copies it, with a success haptic.

Added by this story:

- a tap on **the number** closes too, where its long press used to swallow the tap;
- **VoiceOver's escape gesture** closes, as a tap does;
- **Android back** closes from either way in, through the content's exit like any other close. From
  card detail it did nothing before: the modal's dialog takes the press, and the modal now asks the
  view to close. On the route the view takes the press itself, before the router could pop the screen
  with the code still on it — but only while the route is the screen on top, so a screen pushed over
  it by a second link keeps its own back;
- a copy shows **no toast**, since the screen draws nothing but the code, its labels and the hint.
  Card detail's Number row keeps its toast.

**Screen readers** get the store name as a heading, the code by the barcode renderer's own label, the
number with its copy hint, and one full-screen close button that sits behind the content rather than
around it, so it hides none of it. The visible hint is for touch only; the button carries its words.

### The beam rule, both halves

The prohibition above is only half a rule, and half a rule invites the wrong reading — that
because the brand's ornament _is_ a scan beam, a beam at the till would be on-brand. It would
not. The rule turns on **which way the light is travelling**:

| the barcode is…                                    | the beam                                                                         |
| -------------------------------------------------- | -------------------------------------------------------------------------------- |
| **displayed** — your card held up at the checkout  | **NEVER.** Nothing overlays the code, and the real beam comes from their scanner |
| **read** — someone else's code, through our camera | **REQUIRED.** We are the scanner, so the beam is ours to draw                    |

So the same 2px `#FCCC0C` line is forbidden on `barcode/[id]` and mandatory on
`add-card/scan`. Same mark, opposite verdict, and the deciding question is never "is this
on-brand?" but "who is doing the scanning?"

**On the two barcode surfaces** beam is drawn in exactly three places, and a fourth is a
bug: the scan line and the banner links on our own viewfinder, and a filled favourite star
where a card row shows one. It appears nowhere on the flash-at-checkout screen — not as a
line, not as a tint, not on the insets, not on the dismiss hint.

**That count is local to this section, and it is not a whole-system inventory.** It has
been read as one, which is why it needs saying. There is no fixed number of beam sites,
because beam is a **role** — named under _Three roles_ above — and it is drawn wherever the
role appears: the ì accent, the logo, the splash and loading states, focus rings, active and
selected states, the filled favourite star, and **every primary action in dark mode**. That
last entry alone exceeds three. So the rule to carry away is the role and its two
constraints — beam is always paired with ink text, never darkened or tinted, and never on a
barcode — not an arithmetic that was only ever true of the viewfinder.

### Capture

**RULED 2026-10-12 (Story 22.5)**, from `frames/cardi-capture-frames.html` and
`stitch-prompts-capture.txt` — frames A (choose), B (aim), C (no camera), D (many codes) and E (no
code). Where they are silent, or this document overrules them, the ruling is recorded here, so the
flow cannot drift from either without saying so.

**Frame A — the brand list.** Our furniture stays quiet so the brand colours carry the page.

- **Header.** 48px with no rule: the back chevron in `on-surface` on a 48px target, its drawn stroke
  starting on the 24px margin; "Add Card" centred in `body-lg` semibold, announced as the screen's
  heading; a 48px spacer on the right keeps it centred.
- **Search.** The wallet's search field (_Icons_), 16px below the header and pinned: only the list
  scrolls. A screen reader announces it as a search field.
- **Sections.** Each section header sits 24px below the field or the surface above it, and 8px above
  its rows. Each section is one hairline-outlined surface divided by full-width rules: POPULAR
  CARDS, then ALL CARDS with **"Other card" as its last row**, as frame A draws it — the untitled
  "Other card" section that sat between the two is gone. While searching, one RESULTS surface holds
  the matches, with "Other card" as its last row; "No cards found" and "Showing results…" keep their
  copy, on the 24px margin.
- **Rows.** 64px, padded 0 16, with a 16px gap: a 40px circle in the brand's own hex holding its
  initial in `body-md` semibold, white or ink by luminance; the name in `body-lg` `on-surface`, one
  line at default sizes and wrapping under large text rather than clipping; a chevron at 24 / 1.5 in
  muted — the size of every other row chevron in the app, not the
  frame's drawn 9 × 16. The circle takes the card tile's rule: a very light brand takes the 1px
  hairline in either scheme, and a near-black one takes it in dark. Rows grow under large text
  rather than clipping; an initial is a mark sized to its circle, so it does not scale. These
  initials, and the pill's dot initial in frame B, draw Inter as the frames do, not the display
  face `monogram()` gives other avatars (Story 22.5).
- **Other card.** The same row: its circle is the ground inside a 1px hairline, holding a "+" in
  `body-md` semibold `on-surface`, and "Add a custom loyalty card" sits beneath its label in Inter 13
  muted.
- **Bottom.** The list's content ends 24px above the bottom inset.

**Frame B — the viewfinder.** The camera surfaces ignore the scheme, so their colours are fixed
roles, never theme tokens (`CAMERA_OVERLAY` in `shared/theme/colors.ts`): a `#000000` ground under
both insets, a flat 40 % black scrim with no cut-out, cream `#F0F0E8` text and white corners. While
the scanner is the focused screen it draws a light status bar.

- **Back.** A 40px disc in the scrim, holding a cream chevron at 24 / 1.5, centred in a 48px
  target, so the disc's corner sits at the left inset + 24 and the top inset + 8.
- **Pill.** Its top at the top inset + 8 + 40 + 16. Filled with the brand's hex and padded
  6 / 12 / 6 / 6 with an 8px gap: a 24px white dot carrying the initial in `label-bold` ink, then
  the name in `body-md` semibold, white or ink by luminance. On a light brand the dot takes the
  tile's rule: a 1px hairline in the light scheme's `#D6D6CB`, in either scheme. It draws no logo. A
  custom card has no pill.
- **Viewfinder.** Story 16.31's geometry, unchanged — 300 × 120 at 393 for a linear code, a square
  for QR, corners 32 / 4 / 12 — and the box is centred on the whole screen.
- **Beam.** The 2px `#FCCC0C` line sweeping the box's height, 2s each way, easing in and out. Under
  Reduce Motion — which Reanimated reads once, at launch — it stands still at 46/120 of the box's
  height, where the frame draws it.
- **Instruction.** Absolute, so it no longer shifts the box: its top sits 64px below the box's bottom
  edge, as frame B places it to clear the card being scanned. `body-md` semibold cream, because Inter
  500 is not bundled, with the feed's text shadow (_Elevation_).
- **Rows.** At least 48px, growing with their labels, which wrap rather than clip; the shipped
  rule and padding. Each holds the image or keyboard glyph and a chevron, all at 24 / 1.5, and its
  label in `body-lg` semibold with no shadow, as the frame has them. Everything is cream.
- **Bottom region — DECIDED 2026-10-13 (ifero).** The banner and the rows share one container at
  the bottom: the overlay's only in-flow child, never `position: absolute`. While the banner shows
  it sits 16px above the rows because they share the container, not by a measured offset, so it
  never waits for a measurement. The region grows with the text and, once it would come within 16px
  of the brand pill's bottom — the back disc's, for a custom card with no pill — it scrolls instead.
  At default sizes it draws exactly as before: the banner keeps its 24px margins and the rows their
  24px padding. This replaces Story 16.30's measured offset with the shared container its
  acceptance criterion 3 allows; its outcome stands — the banner 16px above the rows, never over
  them.
- **Pending.** Until the person has answered the system prompt — permission `null` or
  `undetermined` — the scanner draws this frame with no camera behind it. The camera mounts only once
  permission is granted, so a native session never starts before the answer, and no refusal is shown
  for a question nobody has answered yet.
- **Processing.** A cream spinner over "Scanning image…" in `body-md` semibold cream, with the
  shadow.

**Frame C — no camera — and the camera-error state.** No camera, so no dark: the scheme's own ground,
with no status-bar override. A refusal is a choice, not an error, and neither state draws any red.

- **Back.** The same disc in the same place, in `surface` inside a 1px hairline, with an `on-surface`
  chevron.
- **Content.** Centred between the top inset and the footer: the camera-off glyph at 48, drawn with a
  2px stroke, in muted; 16px below it the title in `headline-sm` `on-surface`; 8px below that the
  body in `body-md` muted, centred.
- **Footer.** The actions anchor in the primary-action footer, as this document requires of every
  screen with a primary action and as the wallet's empty state does — frame C's centred 52px pair is
  overruled. A refusal: "Open Settings" as the 52px primary, then "Enter card number manually". The
  camera-error state keeps its shipped buttons and roles: "Scan from image" as the 52px primary when
  it is offered, then Retry — the primary when it is not — then manual entry.
- **Open Settings** that fails is logged, never thrown: the failure goes to `logger.notify` with
  bounded tags and no message text, because `logger.warn` is a no-op in release. **The error body**
  is always the localised "Unable to start the camera preview."; the native message stays with
  telemetry.

**Frame D — many codes.** The shared sheet, as it is (_Sheets_): the frame's centred title, its
12 / 4 / 20 spacing and its flat 60 % black scrim yield to it. Behind the sheet the viewfinder, beam
and instruction hide and the camera stops scanning; the back disc and the pill stay.

- **Rows.** 64px, edge to edge, with a rule under each and the 0.98× press: a barcode glyph — a QR
  glyph for a QR code — at 24 / 1.5 in `on-surface`; 16px on, the value in `mono-code` `on-surface`,
  exactly as decoded and cut at 28 characters with an ellipsis, with its format beneath in Inter 13
  muted; nothing at the right. The frame's miniature bars are decoration, and a drawn strip that is
  not the code would be a fake barcode. The list always scrolls, with no bounce at rest, because the
  rows grow with the text.
- **Names.** Format names come from a map over every format, with no English fallback, and a screen
  reader hears each row as "{format}, code {value}" in the active language, the value whole.
- **Cancel.** Centred plain `body-lg` `on-surface` on a 48px row — never red.

**Frame E — no code.** The banner over frame B, 16px above the action rows in the bottom region it
shares with them, dismissed by its × or after five seconds. The camera never stops.

- **Plate.** 80 % black, 12px radius, padded 16, on the 24px margins — and no icon: the plate and the
  sentence are the whole message.
- **Message.** `body-md` in cream.
- **Dismiss.** An 18px × in 60 % white, at the search field's 1.8 stroke (_Icons_), on a 48px target
  of its own that does not grow the plate.
- **Links.** Inter 13 in beam, 8px below the message and 16px apart. Each is at least 48px wide and
  reaches 48px tall through its slop, without growing the plate. When they wrap, a row gap of twice
  the slop keeps their targets apart.

**Known limits.**

- On a 667pt-tall phone with the square viewfinder, the instruction ends within a few points of the
  action rows, and the banner covers it for its five seconds (#251 item 12).
- At the largest text sizes — or on a short phone with the square box — the bottom region rises
  over the viewfinder, and the instruction hides beneath it once the region overlaps its glyphs,
  not the empty leading beneath them, so the plate-less rows never draw over it. The camera still
  reads the whole frame.

### Forms

**RULED 2026-10-14 (Story 22.6)**, from `frames/cardi-form-frames.html` and
`stitch-prompts-form-states.txt` — frames 1 (default), 2 (error), 3 (filled) and 4 (saving). Card
setup's custom form is the drawn exemplar; catalogue setup and card edit derive from it. Where the
frames and prompts are silent or conflict, or this document overrules them, the ruling is recorded
here, so the pattern cannot drift from either without saying so. **AMENDED 2026-10-21 (Story
22.9):** the six auth screens have moved onto it (_Authentication_), and `AuthScreenLayout` and its
tinted `ErrorBanner` are gone. The pattern took four extensions for them — an opening block, a
header without a title, the footer's link row and the busy name from the caller — which a caller
that passes none of them never sees, and the focused field brought into view, an option a caller
takes, with a field brought into view on request. Review pass 1 added three rules the auth
screens keep: a refused press reveals its first invalid field, a request dismisses the keyboard as
it starts, and the code screen's Confirm is busy during either of its requests (_Authentication_).

**One shape — `FormScreen`.** A header, a top-aligned body and the anchored footer: never centred,
never the action inside the scroll, and no trailing padding under the last field.

- **Ground.** `background` under every inset, in a safe-area view on all four edges. That view sits
  outside the keyboard-avoiding view, so the footer adds no bottom inset of its own.
- **Header.** `ScreenHeader` since Story 22.7, which settings draws too: capture frame A's
  (_Capture_), not the form frame's 56px bar with its 24px display
  title: on iOS every stack-pushed screen's bar title is 17px, the native ones by default and
  capture's by token, while Android's native titles keep the toolbar's own size
  (`NAVIGATION_TITLE_FONT` sets no size). Home's `headline-md` title, 24px, is the one exception, and
  setup follows capture in one stack. At least 48px tall with no rule; `HeaderIconButton` holding Lucide `chevron-left` in `on-surface`,
  named "Go back", its drawn stroke on the 24px margin; the title in `body-lg` semibold `on-surface`, centred,
  announced as the heading, and wrapping rather than clipping under large text; a 48px spacer on
  the right keeps it centred. **A header without a title (Story 22.9):** a screen whose heading
  leads its body — the auth screens' brand block — passes no title, and the row holds the back
  alone, where the titled header puts it. With no back either — nothing beneath it on the stack —
  there is no header row at all, and the body starts at the top inset.
- **Body.** A scroll view that lets a field keep its taps, its content padded 24px at the top, the
  sides and the bottom. Fields sit **32px** apart, and each label sits **8px** above its control.
  **The opening block (Story 22.9)** is what leads the body when the caller passes one — the auth
  screens' brand block — drawn first, above the banner and the fields, and 32px above whichever of
  them comes first.
- **Footer.** _The primary-action footer_, holding one primary `Button` at 52px. It is always
  enabled. While busy it keeps its fill, shows a spinner, is named for what it is doing and ignores
  further presses; nothing else on the screen dims. **The busy name is the caller's (Story 22.9)** —
  "Signing in..." — and "Saving..." when none is given; the button may also take a fuller name of
  its own, which must contain the visible label's words (WCAG 2.5.3, Label in Name): forgot
  password's "Send password reset code" over "Send Reset Code" does not yet (_Authentication_, gap
  18). **The footer's link row (Story 22.9):** a way out, such as "Don't have an account? Create
  one", sits under the primary, 8px below it, and only with one. From a font scale of 1.5 it closes
  the body instead — the last thing in the scroll, 32px below the last field — so the footer that
  rides the keyboard holds the primary alone (_Authentication_, decision 3).
- **Keyboard.** The body and the footer share one keyboard-avoiding view below the header, so the
  footer rests on the keyboard's top edge and the body scrolls above it. The view's frame starts
  below the header, inside the full-screen ground, so it needs no vertical offset. iOS takes
  `padding`. Android takes `padding` too — read from the installed sources, not run on a device:
  SDK 55's mandatory edge-to-edge puts the root view at the top of the screen, as on iOS, and with
  no behaviour the view does nothing and the keyboard covers the footer. React Native reports the
  keyboard's top edge when it shows but the visible frame's height when it hides, which would leave
  the status bar's height of padding under the footer, so on Android the view is on only while the
  keyboard is up. ⚠️ Unverified on an Android device.
- **The focused field in view (Story 22.9)** — an option a caller takes; the auth screens do, and
  setup and edit, which do not, are unchanged. When a field takes the focus, when the keyboard
  showing or changing leaves the body a new height, and when the focused field itself moves or
  grows, a field below the visible body — behind the footer that rides the keyboard — rises until
  it sits 24px above the footer, its label with it. One that is already wholly in view does not
  move; one scrolled above the body comes down to 24px below its top. Where the body cannot spare
  24px on both sides — iOS's strong-password panel leaves a 375pt phone about 90px of it — the
  margins shrink evenly, so the field still shows whole (found on the simulator); one taller than
  the body shows its top, flush, where its label and input are. React Native does none of this here: Fabric's iOS
  scroll view moves a focused input only with `automaticallyAdjustKeyboardInsets`, and then above
  the keyboard's top, not above a footer riding it, and the scroll responder's own helper assumes a
  full-screen scroll view. So the form keeps its own geometry, from layout and scroll events, and
  learns which field holds the focus from the focus and blur events that bubble up from its input.
  Each child of the form is one field for this — a field and what hangs under it, such as the
  strength meter. **A failed request below an opening block** scrolls the body to the banner, 24px
  below its top, rather than to the top, so a tall block, large text or the keyboard cannot leave
  it below the fold. The keyboard goes first, and no field is kept in view any more (review
  pass 2): a field focused while the request ran would otherwise sit under the footer once the body
  scrolls, and a field kept in view would draw the body away from the banner at the next relayout.
  The keyboard goes only when one of the form's own fields holds it (code-review loop, round 1):
  dismissing it blurs whichever field has the focus, and a screen beneath a push still runs, so a
  request failing there would close the keyboard of the screen in front.
- **A field brought into view on request (Story 22.9, review pass 1)** — through the form's `ref`,
  where the focused field is kept in view. The caller names a field by its place among the form's
  children, counted from the first, and the form brings it into view by the focused field's rule,
  whether or not it can take the focus: a field and its label, and whatever hangs under it, rise
  above the footer, and one already in view stays. The form then keeps it there as it grows — the
  message that lays it out again — and as the body changes height, until another field takes the
  focus or a failed request's banner takes the body. A refused press uses it
  (_Errors have a direction_, below): the consent row takes no focus, and a text field that already
  has it sends no focus event when focused again, so nothing else would move either into view.
- **A request and the keyboard (Story 22.9, review pass 1).** The auth screens dismiss the keyboard
  as each request starts — the primary's press on a valid form, or a screen's own request, such as
  the code's 8th digit or a resend — and again if it fails, since a field can be focused while it
  runs. The footer comes down with it, and a failed request's banner is brought into view with the
  fields below it, none behind the footer. With the keyboard up, the banner and the focused field
  could not both be in view on a 393pt phone. A refused press keeps the keyboard. Card setup and
  card edit are unchanged and keep neither rule: a save that succeeds leaves the screen, but a
  failed one can still leave a focused field under the footer with the keyboard up (Story 22.9,
  Found, not fixed 19).
- **Nothing to submit.** A state with no form — card edit's loading and error — draws the header over
  the ground, with no footer.
- **Strings and test IDs.** The back's name (`sharedUi.screenHeader`, which moved out with the
  header in Story 22.7) and the default busy name (`sharedUi.formScreen`) are shared strings, as
  `BottomSheet`'s are, rather than a feature's. The caller names the
  parts, so setup's back keeps `setup-back-button`, card edit's scrolling body keeps
  `edit-card-form`, and an auth screen's banner keeps `server-error`.
- **Errors have a direction** (the design README, 2026-08-21). Validation sits on the field it
  concerns: its outline and its message in the error colour, no icon, no tint, the label still ink.
  Pressing the primary action reveals it. A failed request sits in one banner for the submission
  and never reddens a field. **No press is refused out of sight (Story 22.9, review pass 1):** on
  the auth screens a refused press brings its first invalid field into view — its label, its
  control and its message — whether or not that field can take the focus. A text field takes the
  focus and is brought into view even when it already had it; the consent row, which takes none,
  is brought into view on its own.

**Fields (`TextField`)** — the frame's input, closing #251 item 1. These reach every `TextField`,
the auth screens' included.

- **Fill and outline.** The fill is `surface` — white on cream, ink in dark — not the raised
  `surface-container-low` it was drawn on. The 1px outline is `outline-variant`; focused it is
  `primary`, ink in light and beam in dark, since beam would vanish on white; in error it is
  `error`.
- **Spacing.** 16px of horizontal padding, or 52px on the side of a control inside the box (the
  password toggle). 8px from the label to the control.
- **Placeholder.** `on-surface-variant` `#55555F`, the frame's, not the lighter tertiary.
- **A card number** sets its value in `mono-code` and its placeholder in the body face, as the frame
  sets them.
- **A trailing slot**, outside the box, for the scan button: 8px right of the input and aligned with
  it, top edge on top edge. The label spans the whole row; the message sits under the input alone.
- **The announcement.** A new error is announced on iOS as it appears, queued behind whatever
  VoiceOver is already saying (_Input fields_), matching Android's polite live region, which stays.

**A failed request (`RequestErrorBanner`).** A `surface` card with a 1px `error` outline, radius 12,
padding 16, full width; its message in `body-md` `error` — the save hooks' "Failed to add card" or
"Failed to update card". No icon, no tint and no dismiss, so the error colour is drawn twice, by the
outline and the sentence. It is the first thing in the body, 16px above the first field, and the
body scrolls to the top to show it. Below an opening block (Story 22.9) it follows the block
instead, and the body scrolls to the banner itself, the keyboard dismissed first when one of the
form's fields holds it. It is an alert: a
polite live region on Android, and announced on iOS, queued in the same way, when it appears or its
message changes. It clears when the next press starts a save, because each hook resets its error
then — on the auth screens, because each screen clears it as its next request starts — and a second
failure shows it again. A failed save shows **no toast** — two error surfaces for one failure are
noise — and keeps its error haptic and its log.

**The colour picker (`ColorPicker`)** — the app's only one; card edit's copy is gone.

- **Order.** The logo's bars, as the frame and _Card accents_ list them: red, deep blue, azure, green,
  yellow — the frozen keys `red`, `blue`, `grey`, `green`, `orange`.
- **Swatch.** A 48px disc in its accent, the five spread across the width, with the 0.98× press.
- **Selected.** A 2px ring in `primary`, held off the disc by a 2px gap in `background`. It sits
  outside the disc, so the disc stays 48px. Lucide `check` at 20 with a 3 stroke, in the accent's
  contrast foreground: ink on yellow, where the frame's white is 1.52:1, and white on the other four.
- Its accessibility labels and its `selected` state are unchanged (Story 21.2a). Each swatch's
  test ID is the picker's own plus its key, `<testID>-<key>`, as setup's always were, so card edit's
  moved from `color-option-<key>` to `color-picker-<key>`.

**The scan button (`InlineScanButton`).** The frame's 48px square: a `surface` fill inside a 1px
`outline-variant` outline at radius 12, holding Lucide `camera` at 24 / 1.5 in `on-surface`, with
the 0.98× press in place of the 60 % opacity it had. No hit slop: at 48px it needs none, and a slop
would take taps from the input beside it. Its accessibility label is unchanged.

**Card setup.**

- **Custom** (frames 1–4). STORE NAME, capped at the card schema's 50 characters, with no counter, as
  the frame draws none; CARD NUMBER, with the scan button; CARD COLOR, its label over the picker,
  with deep blue selected. The gap below is left empty: no card preview and no helper text.
- **Catalogue — DECIDED 2026-10-14 (ifero).** The brand's own wallet tile, then CARD NUMBER 32px
  below it, pre-filled from the scan and with no scan button. The tile is the wallet's (_Card tile_):
  the brand's hex, its mark — the logo, or the two-letter plate for a brand without one — the light
  and near-black outline rules, and the brand's name beneath in `label-bold`, at the wallet grid's
  size on the device (171 × 140 at 390) and its radius, centred. It is a picture of the card, not a
  control: no press, no button role and no hint, read once by the brand's name. It shares its mark
  with the wallet's tile rather than copying it. A brand known only by the scanner's params still
  draws; with no resolvable brand there is no tile.
- **Done.** `common.actions.done`, never disabled: its `disabled={isLoading}` is gone (#251 item 11).
- **Validation.** On Done, an empty store name errs and takes focus; from then on it re-validates as
  the person types. The card number stays optional (Story 13.4).

**Card edit.**

- **Header.** The route hides the native header and the form draws the pattern's, as setup does.
  That gives the two form screens one look, and makes the back the screen's own, so it runs the same
  discard check as Android's back, which the native header's back skipped. iOS's swipe back still
  skips it.
- **The form.** CARD NAME with its counter, BARCODE NUMBER on a number pad, the read-only format and
  CARD COLOR, on the 24px margin — retiring the 32px one-off _Layout & Spacing_ names. Save,
  `cards.edit.save`, is the footer's.
- **Validation.** Errors appear at the first Save, then follow the typing (react-hook-form's
  `onSubmit` mode with `onChange` re-validation), rather than on every keystroke from the start.
  The first invalid field takes focus.
- **Not ready.** Loading, an invalid id, a missing card and a failed load keep their copy, under the
  same header, with no footer.

**Dark** — no frame draws it. Every value is the theme role named above: the ground black `#000000`;
the fields and the scan button ink `#181824`, outlined `#3A3A48`; the banner ink too, but outlined
and worded in the error `#FF453A`; cream text, with the placeholder `#B5B5AB`; the error `#FF453A`;
beam for the focus outline and the selection ring; and the primary in beam, with an ink label and
spinner.

### Settings

**RULED 2026-10-15 (Story 22.7)**, from `frames/cardi-settings-frames.html` and
`stitch-prompts-settings.txt` — frames A (signed in), B (guest), C (pick one), D (confirm), E
(acknowledge) and F (type to confirm). Where they are silent, or this document overrules them, the
ruling is recorded here, so the screen and its sheets cannot drift from either without saying so.

**The screen.**

- **Ground.** `background` in a safe-area view on the top, left and right edges. The list scrolls on
  under the home indicator, so the bottom inset goes into its padding instead.
- **Header.** `ScreenHeader`, which is capture frame A's header and the form pattern's (_Forms_):
  "Settings" in `body-lg` semibold, centred and announced as the heading, its back going back. The
  frame's 56px bar with a 24px display title is overruled — every stack-pushed screen has a 17px
  title, and Home is the one exception. The route hides the native header, so none flashes in the
  push.
- **Body.** A scroll view, its content padded 16px at the top, 24px at the sides, and 24px plus the
  bottom inset at the bottom. The groups sit 24px apart, each section header 8px above its group.
- **Groups.** A section header over a hairline-outlined surface divided by full-width rules (_The
  hairline-outlined surface_); each row a plain `ActionRow` with no rule of its own.
- **Order (frame A).** The account group, with no head; PREFERENCES — Theme, Language, then the
  full-brightness switch; DATA — Export Data, Import Data, then Sync; ABOUT — Help & FAQ, Privacy
  Policy, What We Collect, App Version, then Catalogue.
  - **Sync stays hidden from a guest — DECIDED 2026-10-15 (ifero)**, as shipped (Stories 7.7 and
    13.6). Frame B, which draws it, is overruled.
  - **What We Collect — DECIDED 2026-10-15 (ifero)** — is restored as an About row after Privacy
    Policy, opening the data summary: one row more than frame A.
- **Icons.** Only PREFERENCES' rows lead with one, each Lucide at 24 / 1.5 in `on-surface`: Theme
  takes `moon`, the frame's crescent; Language takes `globe`; the switch takes `lightbulb`, filled
  only while it is on — the brightness bulb of _Icons_, and card detail's glyph.

**The account group (frame A).** One hairline-outlined surface with no head above it: identity, not
a category.

- **Its head**, padded 12/16: "Signed in" in `overline` muted, then the email 2px below in `body-lg`
  `on-surface`, wrapping rather than clipping. A screen reader reads it as one element, "Signed in,
  <email>".
- **Its rows:** Change Password, with its chevron; then Sign Out and Delete Account, destructive
  text with no chevron.
- **Gone:** the avatar, the green "Synced" mark — hard-coded whatever the sync state — and the row
  icons.

**The guest group (frame B).** A surface padded 24, centred: "Not signed in yet" in `sheetTitle`,
announced as a heading; its body 8px below in `body-md` muted; then, 24px below, Create Account
(primary) above Sign In (secondary), full width and 8px apart. They take the default 48px, not the
frame's 52: _Buttons_ gives 52 only to a footer's primary and to a sheet's actions. The shield is
gone.

**Rows (`ActionRow`)** — settings', and card detail's MANAGE block, its other caller.

- **Shape.** A plain row is padded 12/16 with 12px between its parts, so a one-line row is 48px.
- **Chevron.** Lucide `chevron-right` at 24 / 1.5 in muted: the chevron of every row (_Capture_).
- **Text.** The label wraps rather than clipping, and the row grows. The value stays one line,
  ellipsised, and never takes more than 46 % of the row, as frame A sets it. On a crowded line the
  value gives way before the label, which breaks a word only when that word alone is wider than its
  room. At the accessibility text sizes the value moves under the label and wraps, and the chevron
  stays at the row's end.
- **Name.** Each row is named by its label, then its value.
- **Information.** A row with no action — App Version, Catalogue — is not a control: no button role,
  no press and no chevron, at full strength, read as its label and its value. A row that shows a
  value but does nothing must not look tappable.
- **Busy.** The spinner takes the chevron's place; the row keeps its look, ignores presses and is
  announced busy — Change Password while its code is sent, Import Data while the document picker
  prepares, Sync while it syncs. `disabled` stays as it was, for card detail's Edit during a delete.
- **DATA.** Export Data keeps "JSON"; Import Data has no value, as the frame draws it. Sync keeps
  its shipped label and the time it last ran: the frame's "Sync Now" is not a string, and its
  "Synced" is not real data.
- **The switch row.** The bulb, then `ToggleSwitch` with its label, padded 12/16. The label shrinks
  and wraps beside the track rather than pushing the track off the row.

**Sheets.** Every settings sheet is one of four shapes on the shared `BottomSheet` (_Sheets_). Each
passes its own title, so it is announced by its title and the title is a heading, and its own
description where it has one — the pickers and the import preview have none. A sheet draws no chip,
no tint, and no icon but the selected option's check.

- **Pick one (frame C), `OptionList`.** Each option is at least 48px, padded 12/24 and edge to edge:
  its rule spans the sheet, its label sits on the 24px margin, and a rule sits above every option,
  none after the last. The label is `body-lg` `on-surface` and wraps. The selected option takes
  Lucide `check` at 20 / 2 in `primary` — ink in light, beam in dark — and reports `selected`. An
  option takes `surface-container-low` while held, as a row does, and the options scroll when they
  do not fit. Theme lists Light, Dark, then System, its helper 20px below the last option in Inter
  13 muted, scrolling with the options so they take the room first; the preview chips, which
  overflowed a 320pt screen, are gone. Language lists the
  languages its preference supplies, with no helper. Choosing applies, saves, announces and closes,
  as it did.
- **Confirm (frame D).** Sign Out; delete's first step, with Continue; Export; and the import
  preview, whose file name and counts are plain text on the margin — the counts in `body-md` muted,
  the invalid line only when there are invalid entries. Import is never disabled: with no new card
  it imports nothing, and its toast says so.
- **Acknowledge (frame E).** One primary OK: nothing to export, and the import error in the hook's
  own title and message. The import error's icons, its variant and its tinted banner are gone.
- **Type to confirm (frame F)**, delete's second step: a `TextField` whose form label sits 8px above
  the input — this document's spacing over the frame's 16 — with no placeholder, with the hint and
  capitals, and editable while the delete runs. Delete Account is disabled until the field holds
  exactly the keyword, case included; busy wins over it. The sheet changes in place, so Continue
  announces this step's title, and Delete Account is a control of its own, not Continue's
  relabelled, so a screen reader's focus does not stay on a button that has changed under it.
- **Actions.** The sheet's action — destructive for Sign Out and both delete steps, primary for
  Export, Import and OK — at 52px. A confirm sheet puts an outlined secondary Cancel beneath it,
  also 52px and 8px apart; an acknowledge sheet holds its OK alone.
- **Busy.** The pressed button keeps its look, shows a spinner and ignores presses; nothing else in
  the sheet dims or locks.
- **A failed request** — sign out, delete, export — is one `RequestErrorBanner` (_Forms_), the first
  thing in the content, 16px below the text, and announced. The sheet stays open and no toast
  repeats it: the export hook's failure toast is gone, as Story 22.6 dropped the save hooks'. Each
  error clears when its sheet opens, and when the next press starts.
- **Closing.** A sheet keeps its content while it slides out. Delete resets its step and its text
  when it opens, never when it closes, and the screen keeps the last preview and the last import
  error until their sheets have gone.

**The confirmation rule — DECIDED 2026-10-15 (ifero).** Every confirmation is the confirm sheet.
Settings moves now; card detail's Delete and card edit's Discard keep the platform alert until their
follow-up.

**Dark** — no frame draws it. Every value is the theme role named above: the ground black `#000000`;
the groups and the sheets ink `#181824`, outlined `#3A3A48`; cream text, muted `#B5B5AB`; the error
`#FF453A`; the icons cream, the check beam, and the primary in beam with an ink label; the scrim
stays ink at 40 %.

**Unverified.** Android, for which this host has no phone emulator, and with it a sheet's keyboard
on Android (_Sheets_); VoiceOver and TalkBack.

### Documents

**RULED 2026-10-19 (Story 22.8)**, from `frames/cardi-document-frames.html` and
`stitch-prompts-document.txt` — frames A (prose: the privacy policy), B (searchable FAQ: help) and
C (two-column table: What We Collect). Where they are silent, or this document overrules them, the
ruling is recorded here, so the three screens cannot drift from either without saying so.

**What they say — DECIDED 2026-10-18 (ifero).** A redraw only: every word stays as it shipped — the
policy, the FAQ in both languages, What We Collect's description and its six rows. The claims the
code contradicts wait for a story of their own, which also takes the website and the store forms.

**One ground — `DocumentScreen`.** All three draw it: settings' header, ground and scroll.

- **Ground.** `background`, in a safe-area view on the top, left and right edges. The page scrolls
  on under the home indicator, so the bottom inset goes into its padding instead.
- **Header.** `ScreenHeader`, its back going back: "Help & FAQ", the policy's own title in each
  language, and "What We Collect". The frames' 56px bar with a 24px display title is overruled —
  every stack-pushed screen has a 17px title (_Forms_). The routes hide the native header, so none
  flashes in the push.
- **Body.** A scroll view, its content padded 16px at the top, 24px at the sides, and 24px plus the
  bottom inset at the bottom: the system margin, not the 48px the three drew (_Layout & Spacing_).
  No title in the body (frames A–C). A press while the keyboard is up acts at once, as on the
  wallet and the brand list.
- **Type.** Every sentence is at the 15px floor or above (Story 21.2). Only the policy's meta line
  and the table's head take the 12px chrome tier.

**Bullets (`BulletList`).** The frames' hanging indent: each item's "•" starts 18px in from the
list's edge and its text 32px in, so a wrapped line aligns under the text, not the bullet.
`body-md`, items 8px apart, in `on-surface` or muted as the caller asks. The glyph is not read:
each item is read as its text. **The space after the glyph is type**, as frame A's "•&nbsp; " is: a
non-breaking space set with the glyph, in its size, so it stays with the glyph and in its measure.
So it grows with the text, and the glyph's column — at least the 14px between the two insets —
widens to hold both: at the accessibility sizes the bullet never closes up against its text. At
iOS's largest size the column measures 45px, where the glyph alone would take 30.

**Frame A — prose (the privacy policy).** No link, icon, card or box: the e-mail address stays plain
text.

- **Source.** The bundled policy, parsed as it always was: its first two lines — the title and "Last
  updated" — are not drawn, a numbered line is a section head, a `•` line a bullet and any other
  line a paragraph. A blank line draws nothing; the blocks carry the spacing.
- **Meta.** The version and the date, in `caption-sm` muted: document metadata, the chrome tier.
- **Section head.** `body-lg` semibold `on-surface`, announced as a heading, 32px below the block
  before it and 8px above the next. The frame's 16 / 700 maps to 17 / 600, as Story 21.6 moved the
  frames' 16px type to 17 or 15 by role. The frame's CSS collapses the 8px under a paragraph into
  the 32px over a head; React Native does not collapse margins, so every block but the last leaves
  8px below it and a head takes the 24px that remain.
- **Paragraph.** `body-md` `on-surface`, 8px below.
- **Bullets.** Consecutive bullet lines are one `BulletList` in `on-surface`, 8px below.
- **The end.** The last block leaves nothing below it, so the policy ends at the body's 24px plus
  the bottom inset, as help and the table do.

**Frame B — searchable FAQ (help).**

- **Subtitle.** `body-md` muted.
- **Search.** The wallet's field, `SearchBar`, moved to `shared/components/ui/` unchanged, 24px
  below the subtitle. Its placeholder, "Search help", also names it for assistive technology, and
  its clear × is "Clear search", as the wallet's is. It matches each question's question, answer
  and tags, trimmed and ignoring case, as it always did, and folds no accents.
- **List.** 24px below the field, one hairline-outlined surface (_The hairline-outlined surface_)
  with a full-width rule between questions: tappable rows sit on a card, as the frames' own note has
  it.
- **Question row.** At least 48px, padded 12/16, with 12px between its parts: the question in
  `body-lg` semibold `on-surface`, wrapping, then the chevron, centred on the row — the system row's
  17px and 48px over the frame's 16 / 600 and 14/16. It takes `surface-container-low` while held,
  as a row does.
- **Its chevron turns.** One Lucide `chevron-down`, at 24 / 1.5 in muted: the chevron of every row
  (_Settings_), over the frame's 18 / 2. It turns with its answer — half a circle, to point up, as
  the answer opens, on the answer's own motion, and back as it closes; under Reduce Motion, at once
  — so it never swaps glyphs in one frame while its answer moves. Turned half a circle,
  `chevron-down` is exactly `chevron-up`'s glyph, so an open question draws frame B's chevron.
- **Its name.** A button named by its question, saying expanded or collapsed: in the app's own
  strings on iOS, and on Android in TalkBack's own words, in the system's language.
  - **iOS.** React Native's view voices "expanded" only while the state is true, and in English
    whatever the app's language: its strings fall back to English unless an `RCTI18nStrings` bundle
    holds them, and every `Localizable.strings` this build ships is empty. So on iOS the question
    takes no expanded state, and its accessibility value says the state both ways, from the app's
    own strings — "expanded" or "collapsed", "aperto" or "chiuso" — which VoiceOver reads after the
    name.
  - **Android.** The state stays: TalkBack voices it both ways, in its own words and the system's
    language, so a value would be heard twice. TalkBack also offers Expand while closed and
    Collapse while open, and on either React Native sets the state natively, reaching JS only for
    an action JS declares. So the question declares the one TalkBack offers, and it opens or closes
    the question as a press does: the state TalkBack reports is always the answer's.
- **Answer.** Beneath its question, padded 0 16 16: the answer in `body-md` muted, then its steps
  8px below as a muted `BulletList`. Frame B draws no steps, but every item has two to four
  (Story 4.3), and they stay. No tint and no fill.
- **Several open at once — DECIDED 2026-10-19 (ifero).** Opening a question closes no other, and
  pressing an open question closes it. At rest all are closed, and an open question stays open
  through a search, even one that hides it. Frame B's prompt asks for one open at a time; that
  closed the answer above a tapped question, and moved the question by up to 300px, sometimes off
  the screen.
- **Motion — DECIDED 2026-10-19 (ifero): animated, not jumpy.** The answer grows from beneath its
  question to its full height, and everything below it moves with it, over 220 ms, ease-out, on the
  UI thread: the sheet's timing (_Sheets_). Closing runs the same motion in reverse, so no press
  makes the page jump, and under Reduce Motion it opens and closes at once. A closed answer holds no
  space and is not read.
  - **The route.** Reanimated animates the height of a clipping window over the answer, from 0 to
    the height the answer's content measures. The content is laid out closed or open, so the motion
    knows its distance from its first frame. At rest an open answer takes its natural height, so it
    comes back whole from a search that hid it, and grows with its text.
  - **The content lies out of the flow while the answer is closed or moving**, pinned to the
    window's top and sides, and in the flow at rest when open, in the same frame either way. In the
    flow, a window held to a height clamps its content's measure to that height — Yoga hands the
    children of a 0-tall view an at-most-0 height, and React Native's text measures to it — so a
    closed answer measured 16px, its padding, and opened by creeping a line or two and then
    snapping whole. Found on the simulator, where the tests cannot see layout.
  - **What the iOS simulator showed, and all it showed.** Tracked frame by frame, an answer opened
    in about 230 ms, each step smaller than the last, and closed the same way in reverse; under
    Reduce Motion it opened and closed in one frame. The switch of `position` and height at each
    end never showed there. None of this was seen on Android (_Unverified_, below).
  - **Not `LayoutAnimation`.** In this app it does nothing on Android, where
    `enableLayoutAnimationsOnAndroid` is off, and it ignores Reduce Motion.
- **No match.** In the list's place, one line — "No answers matching “…”", the query trimmed — in
  `body-md` muted, centred, 80px below the field: the wallet's frame D. A miss is not an error, and
  the actions stay.
- **Actions.** 32px below the list or the line, full width and 8px apart: Contact Support (primary)
  above Submit Feedback (secondary), at the default 48px, not the frame's 52 — _Buttons_ gives 52
  only to a footer's primary and a sheet's actions.

**Frame C — two-column table (What We Collect).** This document had no table; this is the table.

- **Who sees it — DECIDED 2026-10-18 (ifero).** Everyone, signed in or a guest, with no guard and
  no spinner; Story 6.11 had made it signed-in only. The screen reads no session, so nothing waits
  and nothing redirects.
- **Description.** `body-md` muted.
- **Table,** 32px below: ruled, not boxed. No outer border, card, fill, zebra stripe, vertical rule
  or colour.
  - **Rows.** Each row, the head's included: 16px between the columns, padded 12px above and below
    and 0 at the sides, with a 1px hairline rule beneath — the last row's included, so the table
    ends rather than trails off. A data row stands at least 48px tall. The head row takes no
    minimum, so it stands 40px, its 16px line between 12 and 12, as frame C draws it.
  - **Head.** "Category" and "Data Collected" in `overline` muted, uppercased by style:
    _Section header_ gives table heads the `overline` tier and its one colour, over the frame's ink.
  - **Columns.** The category takes 40 % of the width, in `body-md` semibold `on-surface`; the data
    takes the rest, in `body-md` muted, top-aligned and wrapping. A row not collected draws like
    every other row: "Not collected" is neither a warning nor a success.
  - **Large text.** From a font scale of 1.5, each row sets its data under its category, full width,
    as `ActionRow` sets a value (_Settings_), so no word breaks in a 40 % column.
  - **Reading.** Each row is one element, read as its category, then its data; the head row is read
    as its two labels.
- **After the table, nothing — DECIDED 2026-10-18 (ifero).** Frame C's "Download my data" link and
  its footnote are not drawn, and the disabled "Download My Data (coming soon)" is gone with its
  footnote: Settings' Export Data has shipped (Story 13.6).

**Dark** — no frame draws it. Every value is the theme role named above: the ground black `#000000`;
the FAQ's surface ink `#181824`, outlined `#3A3A48`, as are the table's rules; cream text, muted
`#B5B5AB`; the primary button in beam with an ink label, and the secondary outlined in beam.

**Known gaps**, each recorded under _Found, not fixed_ in Story 22.8
(`docs/sprint-artifacts/stories/22-8-document-screens.md`), by its number there:

- **The keyboard** (11, 19). While the field is focused nothing insets the scroll view, so the lower
  answers and the actions stay under the keyboard until it is dismissed, and dragging the page never
  dismisses it. The wallet and the brand list do the same, so one fix should take all three.
- **A search is silent to a screen reader** (12): nothing is announced when the results change or
  when nothing matches.
- **An answer opened near the bottom grows out of view** (18): nothing scrolls it in.
- **Contact Support may never open Mail** (5): `app.json` declares no `mailto` query, on iOS or on
  Android, so `canOpenURL` likely answers false and shows "No email app available". Inferred from
  the source, not run.

**Unverified.** Android, for which this host has no phone emulator, and with it the answer's motion
there — its switch of `position` and height in one frame at each end, and its chevron's turn — and
Reduce Motion there. What VoiceOver and TalkBack actually speak of a question: the iOS value, and
TalkBack's state and its Expand and Collapse.

### Authentication

**RULED 2026-10-21 (Story 22.9)**, from `frames/cardi-auth-frames.html` and
`stitch-prompts-auth.txt` — frames A (sign in, the exemplar), B (create account), C (forgot
password), D (the code, which serves `/verify-email` and `/recovery-otp` as one component), E (new
password) and F (a failed request). Where they are silent, or this document overrules them, the
ruling is recorded here, so the six screens cannot drift from either without saying so. Where the
frames and the prompts disagree, the frames win.

**One shape — `FormScreen`.** All six draw the form pattern (_Forms_): its ground, body padding,
32px field gap, banner, anchored footer, keyboard handling and always-enabled primary. The centred
`AuthScreenLayout`, with its button inside the scroll, and the tinted `ErrorBanner` with its icon
are gone. Every screen keeps its calls, its success navigation and params, its links' routes, its
ways in (welcome, mode selection, settings, the guest banner), its validation rules, each failure's
message and its test IDs.

- **The top — DECIDED 2026-10-21 (ifero).** A back-only header, with the brand block leading the
  body. The header row holds only the back chevron — `ScreenHeader` with no title (_Forms_), its
  stroke on the 24px margin — and only where the stack has a screen beneath, as the native header's
  did; it goes back, as Android's back and the iOS swipe do. New password after recovery begun from
  Home is alone on the stack, so it has no header row, and its body starts at the top inset; begun
  from welcome, `dismissTo('/')` finds no Home, so the screens beneath stay and its back shows, as
  the native header's did (gap 22). The six routes hide the native header and keep their titles,
  so none flashes in the push. The frames draw no header at all; where there is a screen to go back
  to, that is overruled.
- **The way out — DECIDED 2026-10-21 (ifero).** In the footer, 8px under the primary: "Don't have
  an account? Create one", "Already have an account? Sign in", "Back to Sign In", "Wrong email? Go
  back". New password has none (frame E). The frames put the button and its link in the body. From
  a font scale of 1.5 the link closes the body instead (decision 3, _Large text_ below).

**The brand block** (frames A–E) is the screens' opening block (_Forms_).

- **The mark.** `AppIconHeader` as shipped, centred: the 40px mark in its 80px ink circle, ink in
  both schemes (Story 20.4). The frames' hand-built ì is a stand-in for it. Its 48px below became
  32px, as the frames draw it.
- **The heading.** `headline-md` in `on-surface`, centred, announced as the screen's heading — its
  only one, since the header holds no title. It wraps under large text.
- **The subtitle.** `body-md` muted, centred, 8px below the heading. On the code screen the address
  is set in `body-md` semibold `on-surface` within the sentence (frame D): the thing worth checking.
  The sentence's words do not change.
- 32px below the subtitle comes the first field or, after a failed request, the banner, with the
  first field 16px below it (frame F). Forgot password draws the mark too (frame C), where it used
  to hide it.

**Fields.** `TextField` as _Forms_ rules it: labels uppercased by style, at least 48px tall, values
in `body-lg`, 32px apart. That overrules the frames' Title Case labels, 52px fields, 15px values and
16px gaps. Every field keeps its keyboard, autofill, name and hint.

- **The eye** (`PasswordInput`). Lucide `eye` while the password is hidden and `eye-off` while it is
  shown, at 24 / 1.5 in muted, centred in its 48px target at the field's end; a press scales it to
  0.98. "Show password" and "Hide password" stay its names. A failed request never reddens it.
- **"Forgot password?"** A solo link at the end of its row, 8px below the password field — below its
  message when one shows — `body-md` semibold in `link`, in a 48px row.

**Links** (`AuthLink`). The lead-in in `body-md` muted, the action in `body-md` semibold in `link` —
ink in light, beam in dark — with no underline, since it is not inside prose. A solo link ("Back to
Sign In") is the action alone. The row is at least 48px tall, centred, and one button named as
before. A press scales it to 0.98, as the system's text rows do; until now no link acknowledged a
press.

**The strength meter** (`PasswordStrengthIndicator`, frames B and E) counts rather than judges.

- 8px below the password field (below its message when one shows), full width: a track of three
  equal segments, then the word, 8px after it.
- Each segment 4px tall, fully rounded, 4px apart. Weak fills one, fair two and strong three, so the
  fill spans a third, two thirds or all of the track. Filled segments are `on-surface` and empty
  ones `outline-variant`, at every strength. There is no green, amber or red and no colour ramp: the
  palette has no "good" colour, and in light the old meter's fair and strong were the same ink.
- The word in `label-bold` `on-surface`: a label, the chrome tier. It wraps under large text.
- One element for assistive technology: "Password strength: Fair". Nothing animates.
- `getPasswordStrength`'s rule and its three words are unchanged. Create account shows the meter once
  a password is typed; new password always mounts it; on both it draws nothing for an empty
  password.

**The consent row** (`ConsentCheckbox`, frame B), 32px below the confirm field.

- **The box,** drawn 24 × 24 at radius 4: the frame's proportion, since 12 would make it a radio.
  Unticked, it is `surface` inside a 1px `outline-variant` outline. Ticked, it is `primary` with
  Lucide `check` at 16 / 2 in `on-primary` — white on ink, ink on beam, where the old white check was
  1.52:1 — the glyph sized to its box, as the colour picker's check is to its swatch (_Forms_).
- **Its target** is 48 × 48 with the box centred, so the drawn box sits on the margin and the
  sentence starts 12px after it. The box is centred on the sentence's first line at every text size.
  It stays the checkbox, with its name, hint, state and test IDs.
- **The sentence** is `body-md` muted. "Privacy Policy" is `body-md` semibold in `link`, underlined,
  since it is a link inside prose; it keeps its role, hint and route, and stays the one tappable
  under 48px, as before.
- **Unticked at the press,** "You must agree to the Privacy Policy." shows under the row in the
  field-error idiom, and the box's outline turns `error` until it is ticked. Create Account is never
  disabled: it used to ignore every press until consent was ticked, looking enabled and saying
  nothing.

**The code field** (frame D) — a `TextField`, extended only as far as it needs.

- It is labelled VERIFICATION CODE, since _Input fields_ gives every field a label; the frame draws
  none. It keeps its name, "8-digit verification code", and its hint.
- The digits are in `mono-code-lg`, centred, and tracked only once there are digits. The placeholder,
  "8-digit code", is in the body face, centred. The field is at least 48px tall, over the frame's 56.
- One field, never eight boxes. It keeps the number pad, `one-time-code` autofill (React Native maps
  it to iOS's `oneTimeCode` and Android's `sms-otp`), room for a formatted paste of up to 16
  characters, sanitised to its digits, selecting its text on focus, and the focus on mount.
- The 8th digit submits at once, and a request already running refuses another. While either of the
  screen's requests runs — a code check or a resend — the field takes no input and does not dim
  (review pass 1).
- **Confirm** is always enabled; it used to ignore presses until eight digits were typed. Pressed
  with fewer, "Enter the 8-digit code." shows under the field, and the field takes the focus and
  comes into view with the message, even when it already had the focus (_Validation_). A check
  that starts clears that message's trigger, as a successful resend does, so a code typed again
  after a rejected one is not called short before its eighth digit (review pass 2).

**The resend row**, 16px below the field (below its message when one shows), centred, at least 48px
tall.

- While it counts down it is text: "Resend in 0:42" in `body-md` muted, with no spinner and no ring;
  the countdown is what says why it cannot be pressed. While a request runs it is text too: after
  the cooldown it reads "Resend code" in the countdown's muted `body-md`, disabled, where the old
  row read "Resend in 0:00" (#248 item 14). Once available it is "Resend code" in `body-md` semibold
  `link`, and a press scales it to 0.98. Otherwise its names and states are as before. The 60s
  cooldown keeps its absolute expiry across a remount; an expired code unlocks it, a failed resend
  leaves it, and a successful one clears the field, focuses it and restarts it.
- **A resent code** shows as one plain line, 8px below the row: `body-md` muted, centred, with no
  box, icon or tint, and announced politely. Typing clears it, as before.
- **Busy during either request (review pass 1).** While a code check or a resend runs, Confirm is
  busy, named for the request running — "Verifying..." for a check and "Sending code..." for a
  resend — and the resend row reports busy, as before. The old screen's one shared `loading` made
  Confirm busy during a resend too; without that, a press on Confirm, or a keystroke, would be
  refused while the screen showed nothing at work. The two requests guard each other: while one
  runs, the other is not sent.

**Busy.** The primary keeps its fill and shows a spinner, named for what it is doing; further presses
do nothing, and nothing dims.

| Screen         | English              | Italian                         |
| -------------- | -------------------- | ------------------------------- |
| Sign in        | Signing in...        | Accesso in corso...             |
| Create account | Creating account...  | Creazione dell'account...       |
| Forgot         | Sending code...      | Invio del codice...             |
| Code           | Verifying...         | Verifica in corso...            |
| Code, resend   | Sending code...      | Invio del codice...             |
| New password   | Updating password... | Aggiornamento della password... |

**Validation** is the form pattern's: errors appear at the first press of the primary, then follow
the typing, clearing or erring, and the first invalid text field takes the focus. Nothing is sent
while a field is invalid, and the button stays enabled. Create account's email no longer errs on
blur. The password-requirements caption is gone from create account and new password, as frames B
and E draw them: the rule stays in the placeholder, the validation message and the field's hint.

**A refused press reveals its first invalid field — review pass 1.** It brings that field into view
— its label, its control and its message — whether or not the field can take the focus, through the
form's field brought into view on request (_Forms_). A text field takes the focus and is brought
into view even when it already had the focus and the body had been scrolled away from it; the
consent row, which takes none, is brought into view with its message, and the field that had the
focus keeps it. The keyboard stays. No press is refused out of sight: with consent the only
refusal, the row could sit below the visible body with the keyboard up, and the press would seem to
do nothing.

**A failed request** (frame F) is one `RequestErrorBanner` (_Forms_) with the message it always
had, kept as `server-error` — or `verify-email-banner` on the code screen — brought into view and
announced. No field reddens: sign in used to redden both fields for any failure, a dropped
connection included. There is no toast. It stays until the next request starts, and typing no
longer clears it. On the code screen it carries a wrong code, an expired one (which also unlocks
resend), a check that cannot be made and a failed resend; a wrong or expired code used to redden
the field, and a resent code sat in a tinted box with an icon. The banner and the resent line never
show together.

**The keyboard.** The footer rests on the keyboard, and the focused field, with its label, is
brought into view above it (_Forms_) — on the code screen, the moment the keyboard opens. **Every
request dismisses it as it starts (review pass 1):** the primary's press on a valid form, the code's
8th digit and a resend. A field can still be focused while the request runs, so the keyboard goes
again if it fails (review pass 2). The footer comes down with it, and a failed request's banner is
brought into view with the fields below it, none behind the footer; with the keyboard up, the
banner and the focused field could not both be in view on a 393pt phone. A refused press keeps the
keyboard, and its first invalid field takes the focus. A successful resend focuses the code's field
again, and the keyboard comes back with it.

**Large text.** From a font scale of 1.5 the way-out link closes the body (decision 3, below). The
heading, the subtitle, the labels, the links and the meter's word wrap; the fields, the banner and
the footer grow; the body scrolls. The mark keeps its size. Nothing clips, but for two known gaps
(below): the heading breaks mid-word at the largest sizes, one word wider than the column (11), and
the code's digits outgrow their field from a font scale of about 2.6 (12). A hint wider than its
field shrinks to fit rather than growing, as UIKit sets it (24).

**The way out at the largest sizes — DECIDED 2026-10-21 (ifero), decision 3.** From a font scale of
1.5 the way-out link leaves the footer and closes the body instead: the last thing in the scroll,
32px below the last field, as the fields are spaced, and scrolling with them. The footer then holds
the primary alone. Below 1.5 the link stays in the footer, under the primary (the way out, above).
1.5 is a cut-off, not an accessibility size: it sits between iOS's xxxLarge (1.353) and its first
accessibility size (1.786), where Android's 150% setting sits, and it is the breakpoint settings'
rows (`ActionRow`) and What We Collect already restack at. Found on the simulator: at the largest
size on a 375 × 667 iPhone the footer, holding the primary and the link, both wrapping, took nearly
the whole screen — create account's body shrank to about 60px, and with the keyboard up sign in's
body had no room at all, the focused field out of sight and the link's last line under the keyboard.

**Dark** — no frame draws it. Every value is a theme role: the ground black `#000000`; the fields
`surface` ink `#181824`, outlined `#3A3A48`, with the focus outline in beam; cream text, muted
`#B5B5AB`, and links in beam; the primary in beam, with an ink label and spinner; the banner ink,
outlined and worded in `#FF453A`; the meter cream on `#3A3A48`; the consent box ink, outlined
`#3A3A48`, and ticked in beam with an ink check; the mark's ink circle unchanged.

**Never.** A control drawn disabled, or a press ignored without saying why; a tinted, boxed or
iconed message; a meter coloured by strength; a field reddened by a failed request; a toast for a
failed request; another sign-in method.

**Known gaps**, each recorded under _Found, not fixed_ in Story 22.9
(`docs/sprint-artifacts/stories/22-9-authentication.md`), by its number there:

- **Consent never reaches the server from a device's first account** (1): `signUp` reads the stored
  consent before it sends, and create account stores it only after `signUp` returns.
- **A mistyped code probably reads as expired** (2), and so unlocks resend: inferred from the
  code, and one wrong code sent to the dev project during the device check came back expired.
- **"Please verify your email address first." leads nowhere** (3): nothing takes that user to the
  code screen.
- **"An account with this email already exists" is likely unreachable** (4) with confirmations on.
- **The cross-links push** (5): toggling between sign in and create account grows the stack, and
  "Back to Sign In" pushes a new sign in rather than returning to the one beneath.
- **The policy link has no 48px target** (6): it is a nested text inside the sentence.
- **`TextField`'s `hasError` has no caller** (7): sign in was its only user.
- **Connected but offline, a submit spins until the system's fetch timeout** (8).
- **The guest-migration flag ignores the user** (9).
- **Three design sources still describe the old icon or the hand-built ì** (10): the design README's
  dated entry, `stitch-prompts-auth.txt` and frames A–F.
- **The heading breaks mid-word at the largest text size** (11) — "Welcom / e Back" — on the 375pt
  and 393pt phones, one word wider than the column. It wraps rather than clipping, as the old layout
  set it.
- **The code's digits outgrow their field at the largest sizes** (12): eight JetBrains Mono digits
  at 22px, tracked 8, need about 340px at a font scale of 2.643 and about 440px at 3.571, against a
  313px input. The old field set the same face, tracking and width.
- **A change of strength is never announced** (13): the meter is one labelled element with no live
  region, as the old meter's word was plain text.
- **"Wrong email? Go back" leaves a stale form beneath** (14): it replaces only the code screen, so
  create account's back returns to the old address, password and ticked consent, and recovery's
  puts a new forgot password over the first, which keeps the old address.
- **The code suites still depend on their fake-timer tests running last** (15), #248 item 13.
- **After a rejected code, a digit typed after the eighth sends the same code again** (16), on every
  keystroke, as the old handler did: it keeps the first eight digits and submits them.
- **`ActionRow`'s comment still calls 1.5 "the first of the accessibility sizes"** (17), the wording
  corrected here; the file is Story 22.7's.
- **Send Reset Code's spoken name lacks its visible words** (18): "Send password reset code" over
  "Send Reset Code", against WCAG 2.5.3 (Label in Name).
- **Setup and edit can leave a focused field under the footer after a failed save** (19), with the
  keyboard up, as Story 22.6 left them; neither keeps the rules this story gave auth.
- **A request that finishes after the user has left still navigates** (20): the handlers navigate
  after the await without checking the screen is still focused.
- **The return key moves nowhere and submits nothing** (21), #268 item 17.
- **Recovery begun from welcome leaves forgot password beneath new password** (22): `dismissTo('/')`
  finds no Home there, so its back shows and returns to forgot password.
- **At the largest sizes a hint wider than its field shrinks to fit** (24): new password's "Min 8
  chars, 1 letter, 1 number" and "Re-enter your new password" read near the regular size while
  their labels grow. React Native sets no font fitting on a single-line iOS input, so it is UIKit's,
  and the old screens set the same hints in the same fields.
- **New password's Italian confirm hint truncates** (25): to "Inserisci di nuovo la nuova pass…" at
  393px, and sooner at 375px, as main's screen truncates it.
- **Italian's consent sentence has a space after its elision** (26): "Accetto l' Informativa sulla
  privacy", the prefix joined to the link with a space, while its spoken name has none.

**Unverified.** Android, for which this host has no phone emulator — and with it the keyboard and the
focused field's scroll there; VoiceOver and TalkBack; one-time-code autofill from a real e-mail.

### Onboarding

**RULED 2026-10-26 (Story 22.10)**, from `frames/cardi-onboarding-frames.html` — frames A (welcome),
B (mode selection), C (the difference) and D–F (the three highlights) — and the canvas the
illustration set was adopted on (_Illustrations_). This document is canonical, the adopted canvas
places the drawings, and the frames give the rest; where they differ, the ruling is recorded here.
The flow is unchanged — the first-launch gate, each screen's guard, welcome → mode selection →
highlights or create account, sign in from welcome, and the highlights' end completing the first
launch and replacing to Home. The copy is kept but for three changes: the difference's body is
split into its three paragraphs; the dots' name, hardcoded English until now, is in both
languages; and the difference announces as every sheet does (below). The test IDs are kept but for
two: `info-tooltip-close` went with the modal's ×, which frame C does not draw, and `welcome-screen`
now names Welcome's root view, which holds the scroll (`welcome-scroll`) and the footer, where it
named the scroll; new parts take new IDs. `BrandedIcon`, the `FannedCardIllustration` placeholder
and the centred `InfoTooltipModal` are gone.

**Welcome** (frame A, the canvas). A body that scrolls without bouncing, padded 24, holds the mark's
intro (`cardi-mark-intro.json`, 100 × 100) 64px below the top inset, with the mark at the app icon's
proportion: its box takes 58.6 of the field, as it takes 600.06 of 1024 in `cardi-mark.svg`
(**decided 2026-10-26, ifero**), where the adopted intro fitted it into a 34 box. "Cardì" sits 32px
below it in `display-lg` `on-surface`; the subtitle 8px below in `body-lg` muted; and the welcome
drawing (280 × 190) 40px below that. Both animations start together once Welcome's entrance has
ended (_Motion_, below), so the drawing's fan opens as the accent settles. The primary-action footer
holds "Get Started", the 52px primary, and 16px below it "I already have an account": `body-md`
semibold in `link`, 48px tall, with no underline. Overruled: frame A's in-flow button, as capture's
footer ruling overruled frame C's (_Capture_), its 230 × 110 band, and its hand-built ì, which is a
stand-in for the mark.

**Mode selection** (frame B). `ScreenHeader` titled "Get Started", whose back goes back. The body
scrolls without bouncing, padded 24: the heading in `headline-md`, centred, 24px below the header;
the subtitle 8px below in `body-md` muted. The cards come 24px below the subtitle, 16px apart.

- **The cards.** `surface`, radius 16, padded 20, and no wash: the recommended (local) card takes a
  2px `primary` outline, the other a 1px `outline-variant` one. The recommended card carries the
  beam "Recommended" pill on its top edge, at top −11 and right 16: `label-bold` in ink on beam,
  padded 4 / 12, fully round. It is beam with ink in both schemes — the brand's own pair, as the
  favourite badge's plate is — because no theme role is beam in light: the one value on these
  screens that is not a role (**decided 2026-10-26, ifero**). Under large text the pill grows, and
  the card's top padding grows with it, so the pill never sits on the title.
- **Inside.** A 48px disc, the ground inside a 1px hairline, holding Lucide `smartphone` or
  `cloud-upload` at 24 / 1.5 in `on-surface`; 16px on, the title in `body-lg` semibold, the subtitle
  4px below in `body-md` muted, and the eyebrow 8px below in `label-bold` — `on-surface` on the
  recommended card, muted on the other.
- **Below.** The footer sentence 32px below the cards in `body-md` muted, centred, and 8px below it
  "What's the difference?" in `body-md` semibold `link`, underlined, on a 48px row. The screen still
  announces itself on mount.

**The difference** (frame C) is the shared sheet (_Sheets_), titled "What's the difference?". It
holds the explanation as three paragraphs in `body-md` `on-surface`, 16px apart, and one action, "Got
it", the 52px primary. "Got it", the scrim, Android back and the VoiceOver escape close it; the
grabber stays decoration, as on every sheet (**decided 2026-10-26, ifero**). It announces as every
sheet does, by its name: "Storage options information opened" and "… closed", and in Italian
"Pannello informativo sull'archiviazione aperto" and "… chiuso" — a masculine singular name, so
the shared participle agrees. That replaces the modal's own "Storage options info opened", and its
close, which said nothing (**decided 2026-10-26, ifero**). Overruled: the frame's flat black scrim,
its 12px grabber offset, its 24 / 32 title and its fixed 400px height.

**Highlights** (frames D–F, the canvas). No header: Skip at the top right, `body-md` semibold in
`link`, on a 48px row whose label ends on the margin. Each page scrolls on its own, without
bouncing: its drawing (280 × 190) 96px below the Skip row, the title 48px below in `headline-md`,
centred, and the body 12px below in `body-md` muted, centred and at most 310px wide. The
primary-action footer holds the dots — 8px across and 8px apart, the shown page's `primary` and the
rest `outline-variant`, one element named "Page 2 of 3" in the active language — 24px above Next or
"Let's go!", the 52px primary. Overruled: the frames' 160px cream discs and the drawings in them.

**Motion.** Every drawing plays once, never looping, and rests on its last frame, which is the
static drawing (_Illustrations_). The welcome pair starts together once Welcome's entrance has ended
— on the stack's first `transitionEnd` that is not closing — so brand moment D never plays under the
entrance's fade (**decided 2026-10-26, ifero**). Leaving Welcome before then, or mid-play — Get
Started before the drawing ends — rests both on their last frames, so coming back replays nothing.
The first highlight's drawing plays on mount. A highlight's drawing plays the first time its page is
shown — at once on Next, as the page slides in rather than once it settles, or when a swipe settles
on it — and a page shown again rests on its last frame, so going back is quiet (**decided
2026-10-25, ifero**, worded 2026-10-26). A page swiped away mid-play settles on its last frame too,
so it is still when it comes back. Under Reduce Motion — which Reanimated reads once, at launch —
each shows its last frame at once and nothing plays; lottie-ios would otherwise play in full. A
scheme change shows the new scheme's file, at its last frame if the drawing had started. The player
lives in `features/onboarding/`, never `shared/components/ui/`: Storybook loads its stories from
that directory and cannot bundle the player, because lottie-react-native's web entry imports the
optional peer `@lottiefiles/dotlottie-react`, which is not installed.

- **Decorative.** The mark and the drawings are hidden from assistive technology; the titles carry
  the meaning.
- **A file that fails to load** leaves its box empty, at its size, and throws and announces nothing.

**Dark.** Every value but the pill's is a role: the black ground, ink cards and sheet, cream text,
muted `#B5B5AB`, `#3A3A48` hairlines and dots; beam for the links, the recommended card's outline,
the shown page's dot and the primary, with its ink label; and the `-dark` file of each drawing. The
pill stays beam with its ink label, as in light (**decided 2026-10-26, ifero**), and the mark keeps
its own ink field in both schemes, so one file serves both.

**Icons.** Onboarding left MaterialIcons here: mode selection's hand-rolled `chevron-left`, for
`ScreenHeader`'s Lucide one; its cards' `smartphone` and `cloud-upload`, now Lucide's at 24 / 1.5;
the difference modal's `close` and `info-outline`, which went with it; and the third highlight's
`verified-user`, which its drawing replaces. Onboarding draws no other icon.

**Unverified.** Android, for which this host has no phone emulator, and with it the drawings and
their motion there; VoiceOver and TalkBack — what they speak of the difference's announcements, in
either language, and where focus lands when the sheet closes: the modal returned it to "What's the
difference?", and the shared sheet moves it nowhere; and a release build, with how these screens
draw in a binary that lacks the player's native module.

### Input fields

1px outline, 12px radius, label **always visible above** the field (never floating), 48px
minimum height.

- **The label is the form label from _Typography_** — `label-bold`, uppercase, ink — and every
  field in a form wears it, including the ones that are not text inputs: the colour picker and a
  read-only value. A read-only value is that label over **plain text, with no box**; a box is
  what makes a value read as a control.
- **A card number is set in `mono-code`** (JetBrains Mono 16, weight 500), in the input as on the
  barcode, so the digits align while someone reads them aloud. Both the add and the edit flow do
  it — ADDED 2026-09-27 (Story 22.1, taking Story 21.6's hand-off).
- **The error idiom:** `captionMd` (Inter 13) in the error colour, 4px below the field, whose
  outline turns the same colour. Android announces it as it appears, through a polite live
  region. iOS has no live region, so the message is announced there as it appears and whenever
  it changes, queued behind whatever VoiceOver is already saying, so the errors one press raises are
  all heard rather than each cutting off the one before — CORRECTED 2026-10-14 (Story 22.6), where this said iOS had no equivalent and read
  it only with the field. Field validation lives here; a failed request is a different idiom
  (`RequestErrorBanner`, _Forms_) and is not drawn under a field.
- **The rest of the field** — its fill, padding, placeholder and trailing slot — is ruled under
  _Forms_.
- The height is the touch-target token, never a literal, so it moves with the token.

### Section header

The uppercase label above a group of rows — TRANSCRIBED 2026-09-27 (Story 22.1, AC11) from
`stitch-prompts-settings.txt`, which carried it while this document did not:

- **`overline`: Inter 12px, weight 600, uppercase, +0.05em tracking** (0.6pt in React Native,
  where `letterSpacing` is in points), **muted `#55555F`** (`textSecondary`; `#B5B5AB` in dark),
  sitting **8px above its rows**. The 8px is the parent's gap, not the header's margin.
- **It is chrome, and it is below the 15px body floor on purpose.** Story 21.6 (AC8b) carved it
  out by name as part of the chrome tier — a label for the rows beneath it, never a sentence.
- **The colour belongs to the component, not the call site.** The four copies it replaced split
  1-vs-3 — `textTertiary` in Settings, `textSecondary` in the brand list, card detail and conflict
  card, each injected inline — and there is one colour, so the component takes no override.
- **The capitals are a style, never the string.** Uppercasing the string makes a screen reader
  spell out letters; the brand list did both.

**Two uppercase labels exist, and the rule is the TIER, not the component** (Story 22.1, AC11):

| label                     | treatment                 | for                                                         |
| ------------------------- | ------------------------- | ----------------------------------------------------------- |
| `overline` 12 / +0.05em   | a label for a **group**   | section heads, table heads, the account block's "Signed in" |
| `label-bold` 13 / +0.02em | a label for **one field** | every input, the colour picker, a read-only value           |

So the type-to-confirm label inside the delete-account sheet is `label-bold`, because it labels
one input — the settings frame drew it at 12 / +0.05em, which would have built that sheet twice.
The frame and its prompt are corrected to match.

### The hairline-outlined surface

A container that sits on the ground as a **tonal layer** — **white `#FFFFFF` on cream, ink
`#181824` on black** — bounded by a **1px hairline** (`#D6D6CB` / `#3A3A48`) at the **16px card
radius**, never by a shadow. It has no padding of its own, because what it holds pads itself
(settings rows are 12 / 16, the account block 12 / 16, the guest block 24), and it clips to its
radius. Rows inside it are separated by **full-width 1px hairline rules**, not by gaps. This is
the settings list, the account block, card detail's details card and MANAGE block, and the brand
list's sections (_Capture_).

### Sheets

TRANSCRIBED 2026-09-27 (Story 22.1, AC11) from `stitch-prompts-settings.txt` and the settings
frames, which carried the whole spec while this document gave a sheet only a radius:

- **Anchored to the bottom edge, full width**, white `#FFFFFF` — **ink `#181824` in dark** —
  with a **16px radius on the TOP two corners only**; the bottom corners are square. The home
  indicator sits ON the sheet: it pads 8px above the bottom safe-area inset.
- **The scrim is ink `#181824` at 40 %** across the whole frame, never a flat black. The status bar
  stays legible above it — it is the system's layer, not the app's.
- **The grabber: 36 × 4, fully rounded, solid `#D6D6CB`** (`#3A3A48` in dark), **8px from the
  top.** It is decoration — there is no drag gesture behind it — so it is not an accessibility
  element. ⚠️ The shared sheet drew 40 × 4 at 40 % opacity until Story 22.1; the one hand-rolled
  sheet (the multi-code picker) had the spec size all along.
- **24px margins.** The title is **`sheetTitle` — Space Grotesk 20 / 28, bold** — the eighth token
  Story 21.6 (AC5b) derived for sheet, dialog and panel titles; `headline-sm` stays Inter, because
  the same 20px sets the barcode store name, which does not wear the display face. A description
  follows **8px** below in Inter 15, muted; content **16px** below that. The actions are a slot
  of their own, **24px** below what precedes them — the description, or the content — as the
  confirm, acknowledge and type-to-confirm frames draw them (Story 22.7).
- **Rows are 48px minimum**, divided by hairline rules. An option list runs **edge to edge**, its
  rules spanning the sheet and its content on the 24px margin, in line with the title.
- **Actions are full-width 52px buttons, 8px apart.** A destructive action is the borderless text
  button (_Buttons_) and sits **above** Cancel, which carries the visible outline — the bordered
  control is the safe one. **The shipped sign-out and delete-account sheets are the reference —
  REBUILT 2026-10-15 (Story 22.7).** Until then they stacked Cancel above the destructive action —
  Story 13.6's deliberate "inverted CTA order", which these frames reverse — at the default 48px,
  10px apart. Every confirmation is this sheet (_Settings_).
- **It never grows past 80 % of the window**; a long list inside it scrolls.
- **With actions, the text scrolls and the actions stay — ADDED 2026-10-15 (Story 22.7).** The
  title, the description and the content scroll within the 80 % cap, and the actions stay pinned
  beneath them, so at the largest text sizes no button leaves the sheet. The scrolling body never
  grows: React Native lays out with Yoga's legacy stretch, which hands a height-capped container's
  spare height to a growing child, and a scroll view grows by default, so a short sheet would stand
  80 % tall. A sheet without actions draws as before — the multi-code picker, the sort sheet and the
  pickers hold their own lists, which scroll inside its shrinking body.
- **The keyboard — ADDED 2026-10-15 (Story 22.7).** While it is up, the sheet rests on the
  keyboard's top edge and may take all the space above it, below the top safe-area inset, so a
  field shows whole above its actions at the largest text sizes. Its bottom padding drops to
  **20px**, since the keyboard covers the home indicator. The keyboard-avoiding view is the modal's
  full-screen root: it measures its overlap from its own frame, relative to its parent, against the
  keyboard's top edge in screen coordinates, and only a view whose frame is the modal's whole screen
  gets the two to agree — one inside the sheet pads about nothing. iOS takes `padding`; its keyboard
  events reach JavaScript while a modal is up. Android takes `padding` too, on only while the
  keyboard is up, as _Forms_ rules for `FormScreen`. ⚠️ Unverified on an Android device, and not
  settled by the sources alone: the modal's dialog window is edge-to-edge, so the system does not
  resize it, and its keyboard events reach JavaScript only through the activity's root view.
- **Motion: the scrim fades and only the sheet slides**, 220 ms, ease-out, on the UI thread, and
  under Reduce Motion it simply appears — SETTLED 2026-09-27 (Story 22.1, AC8). **The sheet stays
  opaque and travels exactly its own height**, in and out. Neither earlier motion did: the shared
  sheet used the native `slide` modal, which carried the dark scrim up the screen with it, and the
  multi-code picker faded its whole modal, so the rows behind a rising sheet showed through it, and
  travelled a full window height, so a short sheet spent most of the 220 ms off the screen.
- **The scrim is touch-only.** It is hidden from assistive technology, which dismisses through the
  platform instead — Android back, the VoiceOver escape gesture — and the sheet is a modal
  **container**, never a single accessibility element, so every control in it stays reachable.

### Icons

One family, **outline style, 1.5px stroke, 24px** on a 48px target, ink-coloured, square
corners softened. Icons are chrome — they take ink or beam, never a card accent. No filled
icons, no duotone, no emoji as iconography.

**The family is Lucide — `lucide-react-native`, DECIDED 2026-10-05 (Story 22.2), starting on the
wallet.** Import each icon from its own module (`lucide-react-native/icons/<name>`), never from the
package root, which Metro cannot tree-shake; `eslint.config.mjs` refuses a root import. Screens move
off MaterialIcons as their Epic 22 story redesigns them, and the wallet has not moved entirely: the
favourite badge's filled star (`FavouriteBadge` in `Tile`) and the guest, migration and sync
banners' icons are still `@expo/vector-icons` — MaterialIcons, and MaterialCommunityIcons for the
guest banner's shield. Card detail moved in Story 22.3, all but the `ActionRow` chevron it shares
with settings (add-card no longer draws `ActionRow` since Story 22.5); that chevron moved with
settings in Story 22.7, to Lucide `chevron-right` at 24 / 1.5. The full-screen barcode card detail
opens draws no icon at all since Story 22.4, which dropped its close ×. Capture moved in
Story 22.5 — the brand list, the scanner, its banner and the multi-code picker — and card setup and
card edit in Story 22.6: the form header's `chevron-left`, the colour picker's `check`, and
`InlineScanButton`'s `camera`, which replaced MaterialCommunityIcons' `barcode-scan`. Settings
moved in Story 22.7 — its rows' `moon`, `globe` and `lightbulb`, the row chevron, the pick-one
list's `check` and its own header's `chevron-left` — and draws no other icon: its sheets' 40px
icons, its account avatar and its guest shield are gone. The screens that keep the native header
still take the root stack's MaterialIcons back chevron (#258 item 11). Help, the privacy policy
and What We Collect left it in Story 22.8: each draws `DocumentScreen`'s header, whose back is
`ScreenHeader`'s `chevron-left`, and help's questions take `chevron-down`, turned to point up while
open (_Documents_). With the search field's own glyphs, those are the only icons the three draw.
**The six auth screens left MaterialIcons in Story 22.9** (_Authentication_): the root stack's back
chevron, which their routes no longer show, for `ScreenHeader`'s `chevron-left`; forgot password's
own second chevron, which is gone; the password field's eye, now Lucide `eye` and `eye-off` at
24 / 1.5; the code screen's notices, which lost their `error-outline` and `check-circle` with their
tints, since no message carries an icon; and the consent box's check, now Lucide `check` at 16 / 2.
They draw no other icon.

**A glyph is filled only where the fill is its state — RULED 2026-10-09 (Story 22.3).** Two glyphs
are: the favourited star and the brightness bulb while it is on. Neither fill is decoration — the
outline-or-filled difference is the whole of what each says — so neither is a "filled icon". And on
card detail's own field, the controls take the field's contrast foreground, white or ink, until the
bar has blended to the ground (_Card detail_): the field is the card's content, not chrome, so this
is not an icon taking a card accent.

**A glyph inside a control is smaller — RULED 2026-10-05 (Story 22.2, from the wallet frame).** The
24 / 1.5 rule is for an icon that owns its 48px target. A glyph inside a field or beside a label
takes the frame's size and stroke, the stroke in the icon's 24-unit grid: the search field's
magnifier **20** and clear × **18** at **1.8** (1.5px rendered at 20), the pick-one list's check
**20** at **2** (_Settings_), and the sort row's chevron
**14** at **2**. The × still sits on a 48px target of its own; the chevron is part of its text
button's.

**On the watch, 14–18 rather than 24** — 24-on-48 is a 50 % fill, which works only when the target
is otherwise empty, and a watch row is not. The part that carries unchanged is the sentence above
it: an icon is chrome and never takes a card accent. See
[`cardi-watch-grammar.md`](cardi-watch-grammar.md) §5.5.

### Illustrations

Illustrations come from **one set**, not per-screen decoration. They appear **only**
in onboarding and true empty states — never on the wallet, barcode, settings or forms.
The set is flat, two-tone (ink line-work on cream) with **beam yellow as the single
accent**, no gradients and no third colour. Do not invent a new illustration style per
screen; if no illustration from the set fits, use none.

**The set — ADOPTED 2026-10-24 (ifero).** Four onboarding drawings: welcome (a hand holding a
fan of cards), all your cards, scan or type, and your data. They were drawn rather than
commissioned, and adopting them is what unblocked Story 22.10. The drawings live in
[`lottie/onboarding-illustrations.source.html`](lottie/onboarding-illustrations.source.html)
and ship as Lottie in `assets/animations/onboarding/`, built by
[`lottie/build-onboarding-lottie.py`](lottie/build-onboarding-lottie.py) (see its
[README](lottie/README.md)). A new drawing joins the set by being drawn in it, with the same
classes and line weights (3 for silhouettes, 2.5 for small objects, 2 for detail), not by
being made for one screen.

- **Dark** is a rule, not a second drawing: cream lines on black, the beam unchanged, every
  stroke 0.25 lighter. The fills that hide what is behind go black, never ink.
- **Motion** plays once and rests on exactly the static drawing, so Reduce Motion shows that
  frame and loses nothing. The beam never fades: it cuts on, then draws, sweeps or scales. A
  scan beam appears full width and sweeps top to bottom.
- **The Welcome brand moment** is the accent arriving as the scan beam it is in motion ("scan,
  then settle"): the beam sweeps the mark's bars, comes back, and turns 35° into the accent
  (`cardi-mark-intro.json`). It belongs to onboarding alone; the launch surface stays
  anti-spectacle.

## Dark mode

Dark is not an inversion, it is the app's night face and it must be specified whenever a
dark screen is produced.

- Ground: **true black `#000000`** (OLED, zero power draw).
- Cards and sheets: **ink `#181824`**.
- Raised containers: `#20202E`. Outlines: `#3A3A48`.
- Body text: **cream `#F0F0E8`**, never pure white — it keeps the warmth.
- **Primary actions become beam `#FCCC0C` with ink text.** This inversion is deliberate:
  when the lights go out, the beam is the only thing left.
- The barcode modal ignores dark mode entirely and stays white.

## Forbidden

**An accent that rises to the right (`Cardí`)** · Bottom tab bars · floating action buttons · coral, salmon, terracotta or orange · drop
shadows · gradients · glassmorphism · darkened or muddied yellow · card accent colours used
as chrome (except a card's own detail field — see _Three roles_) · **a card accent as the value
of a theme token** · **anything overlaying a barcode, especially a drawn beam or scan-line** (a
DISPLAYED code, ours held up at the till — our own viewfinder must draw the beam over the code it
reads; see _The beam rule, both halves_ and _Capture_) ·
**a saturated surround on the barcode screen** · **tinting, washing or recolouring a
branded card tile** · **replacing the PHONE home grid with a single-column list of rows** (the watch list is
single-column rows and is correct — see the watch grammar) ·
**a large yellow chrome surface next to the card grid** · **beam washed above 10 % alpha over a
dark ground** · thin font weights · desktop or
tablet frames · **a phone screen at any frame other than 393 × 852** · **a watch screen at
any frame not in the Frames table** · per-screen invented illustration styles ·
**a primary action that floats over content or is positioned absolutely** · **a disabled
button as a form's resting state** (the type-to-confirm delete gate is the one sanctioned
disabled control — see _Buttons_).

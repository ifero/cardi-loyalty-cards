"""Shared layer for the two watch frame generators.

LEADING UNDERSCORE IS LOAD-BEARING. `verify.py` runs every `*.py` in this folder as
a generator and reports anything that writes no frame as NO-OUTPUT, turning the gate
red. A helper module must therefore be named `_something.py`. Sibling imports work:
the checker puts each generator's own directory on `sys.path`, which
`runpy.run_path` does not do by default.

WHY A SHARED MODULE, WHEN THE FRAMES THEMSELVES MUST NOT SHARE A STYLESHEET

`cardi-design-system.md` and the existing frames record a hard-won rule: a frame's
token block is INLINED, never linked, because any viewer that inlines the HTML
(preview panes, the Artifact CSP, pasting it anywhere) silently drops a linked
stylesheet and renders a broken frame — which reads as "the reference is wrong".

That rule is about the OUTPUT. It is satisfied here: both emitted files carry the
full token block inline and are completely self-contained. What this module removes
is duplication in the SOURCE, which the rule never asked for. Previous frame files
had to duplicate by hand and keep the copies in step; a generator does not.

Neither file is the source of truth for these values either way. `cardi-design-system.md`
and `cardi-watch-grammar.md` are; both of these are copies of them.
"""

# ---- the mark, exactly as mark_locked.py builds it -------------------------
# Re-stated rather than imported so this module cannot be broken by an edit to a
# sibling generator, and identical to it by construction — every value below is
# the table in tools/README.md.
BASELINE, XHEIGHT = 70.0, 49.6
STEM_TOP = BASELINE - XHEIGHT          # 20.4
ADV = 30
CX = ADV / 2

ANGLE = 35        # POSITIVE = descends to the right = grave. NEVER negative.
LEN_WORD = 24
WEIGHT = 9


def beam(angle=ANGLE, length=LEN_WORD, weight=WEIGHT, cy=10.5, fill="var(--beam)"):
    """The accent bar, round-capped, rotated about its own centre.

    `rotate(35)` is the grave. `rotate(-35)` draws an ACUTE, which is a different
    word — see cardi-design-system.md. In SVG the y-axis points down, so the
    positive angle is the one that descends.
    """
    x, y = CX - length / 2, cy - weight / 2
    return (f'<rect x="{x:.2f}" y="{y:.2f}" width="{length}" height="{weight}" '
            f'rx="{weight / 2:.2f}" fill="{fill}" '
            f'transform="rotate({angle} {CX} {cy})" />')


def stem(w=12, fill="var(--cream)"):
    return (f'<rect x="{CX - w / 2:.1f}" y="{STEM_TOP:.1f}" width="{w}" '
            f'height="{BASELINE - STEM_TOP:.1f}" rx="{w / 2:.1f}" fill="{fill}" />')


# ---- the SHIPPED mark: three bars, the beam crossing them ------------------
# The standalone mark is NOT the ì above. `stem()` + `beam()` draw the ì inside the
# wordmark's live type; the mark that ships as the app icon and in every complication
# family is variant C of cardi-icon-explore.html: the stem is a barcode of three bars
# and the beam crosses them high. Story 23.4 chose it for the complication over a
# one-bar reduction (ifero, 2026-10-29). Every value below is re-stated from
# scripts/build-brand-icons.mjs, the generator of record for the shipped artwork, so a
# frame shows the pixels `OpenAppIcon` and `OpenAppIconGlyph` actually carry.
ICON_BEAM_LENGTH, ICON_BEAM_WEIGHT, ICON_BEAM_CY = 52, 9, 30
ICON_BARS = [            # (x, width, corner radius), from STEM_TOP to BASELINE
    (CX - 11, 4.5, 2.2),
    (CX - 4.5, 9, 4.5),
    (CX + 7, 4, 2),
]
ICON_CANVAS = 100        # the icon canvas, in em units: the mark at ~76 % of the frame
TIGHT_MARGIN = 1         # the inline glyph's frame: the mark's own box plus one unit


def _icon_bounds():
    """The mark's bounding box, as the generator's `bounds()` computes it."""
    import math

    a = math.radians(ANGLE)
    hw = ICON_BEAM_LENGTH / 2 * math.cos(a) + ICON_BEAM_WEIGHT / 2 * math.sin(a)
    hh = ICON_BEAM_LENGTH / 2 * math.sin(a) + ICON_BEAM_WEIGHT / 2 * math.cos(a)
    x0 = min(CX - hw, ICON_BARS[0][0])
    x1 = max(CX + hw, ICON_BARS[2][0] + ICON_BARS[2][1])
    y0 = min(ICON_BEAM_CY - hh, STEM_TOP)
    y1 = max(ICON_BEAM_CY + hh, BASELINE)
    return x0, y0, x1, y1


def mark(px, tight=False, bar_fill="var(--white)", beam_fill="var(--beam)"):
    """The shipped mark, centred in a square box `px` on a side.

    By default the box is the icon canvas, framed exactly as `OpenAppIcon` is: drop it
    into a round disc of the same size and the mark sits where the artwork puts it, at
    0.672 of the radius and inside the inscribed square (§7.2) -- the canvas carries the
    padding, so the caller adds none. `tight=True` frames the mark's own box instead, as
    `OpenAppIconGlyph` does for the inline family, which sizes its image to the line.

    The bars are white because the shipped artwork's are (the generator's `FULL`). Pass
    one colour for both fills to draw the silhouette a tinted or template slot shows.
    """
    x0, y0, x1, y1 = _icon_bounds()
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    side = (max(x1 - x0, y1 - y0) + 2 * TIGHT_MARGIN) if tight else ICON_CANVAS
    vb = f"{cx - side / 2:.2f} {cy - side / 2:.2f} {side:.2f} {side:.2f}"
    bars = "".join(
        f'<rect x="{x:.2f}" y="{STEM_TOP:.1f}" width="{w}" '
        f'height="{BASELINE - STEM_TOP:.1f}" rx="{r}" fill="{bar_fill}" />'
        for x, w, r in ICON_BARS)
    return (f'<svg viewBox="{vb}" width="{px}" height="{px}" aria-hidden="true" '
            f'style="display:block">{bars}'
            f'{beam(length=ICON_BEAM_LENGTH, weight=ICON_BEAM_WEIGHT, cy=ICON_BEAM_CY, fill=beam_fill)}'
            f'</svg>')


def wordglyph(stem_fill="currentColor", beam_fill="var(--beam)"):
    """The ì inside live type.

    The `vertical-align` is DERIVED, not tuned — (100 − BASELINE) / 100 — and it
    ships as an INLINE style on the <svg>, never as a stylesheet rule. Both have
    gone wrong before: once as a guessed translateY, once because a new sheet
    reused the markup without copying the CSS.
    """
    return (f'<svg viewBox="0 0 {ADV} 100" width="{ADV / 100:.2f}em" height="1em" '
            f'style="display:inline;vertical-align:-{(100 - BASELINE) / 100:.2f}em;overflow:visible" '
            f'aria-hidden="true">{stem(fill=stem_fill)}{beam(fill=beam_fill)}</svg>')


def wordmark(size, color="var(--ink)"):
    return (f'<span style="font:700 {size}px/1 \'Space Grotesk\',Inter,sans-serif;'
            f'color:{color};letter-spacing:-0.01em">Card{wordglyph()}</span>')


# ---- devices ---------------------------------------------------------------
# watchOS, measured from Xcode's own simulator device profiles. The table lives in
# targets/watch/__tests__/watch-layout-contract.test.ts and in no source file.
# 40 mm is the floor because the watch target deploys to watchOS 10.
#
# Two traps: the WIDEST is the 46 mm at 208, not the 49 mm Ultra; and the 44 mm is
# NARROWER than the 42 mm (184 vs 187) while being taller.
WATCHOS = {
    "40 mm": (162, 197),
    "41 mm": (176, 215),
    "42 mm": (187, 223),
    "44 mm": (184, 224),
    "45 mm": (198, 242),
    "46 mm": (208, 248),
    "49 mm": (205, 251),
}

# Wear OS. 192 dp is Google's smallest supported round screen and the size it tells
# you to design at first. 384 px is the SAME screen counted in pixels at the x2
# density every current Wear device uses -- do not mix the two numbers.
WEAR = 192

# Real catalogue hexes (catalogue/italy.json), not invented ones. Esselunga is here
# on purpose: #FFCC00 against beam #FCCC0C is the collision the design system names.
BRANDS = [
    ("Esselunga", "#FFCC00", "E"),
    ("Coop", "#E2231A", "C"),
    ("Lidl", "#0050AA", "L"),
    ("IKEA", "#0051BA", "IK"),
    ("Decathlon", "#0082C3", "D"),
    ("Conad", "#DA291C", "CO"),
]


def luminance(hex_color):
    """WCAG relative luminance, same formula ColorHelpers.swift uses."""
    def channel(component):
        srgb = int(component, 16) / 255
        return srgb / 12.92 if srgb <= 0.03928 else ((srgb + 0.055) / 1.055) ** 2.4

    h = hex_color.lstrip("#")
    r, g, b = channel(h[0:2]), channel(h[2:4]), channel(h[4:6])
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def on_color(hex_color):
    """Ink or cream over a brand fill, by luminance -- the shipped watch rule."""
    return "#181824" if luminance(hex_color) > 0.4 else "#F0F0E8"


# ---- the page --------------------------------------------------------------
TOKENS = """      :root {
        /* The three roles. Values from cardi-design-system.md; this is a copy. */
        --ink: #181824;
        --beam: #fccc0c;
        --cream: #f0f0e8;

        /* The watch ground is true black, permanently. It is never cream. */
        --black: #000000;
        --white: #ffffff;
        --outline: #3a3a48;

        /* Card accents -- by HEX, never by key. Story 21.2a owns the key set. */
        --card-red: #e42424;
        --card-blue: #0c3c84;
        --card-azure: #0c84cc;
        --card-green: #0c843c;
        --card-yellow: #fccc0c;

        /* The row is DERIVED, not gridded:
           rowHeight = max(max(accentHeight, avatarSize) + 2*verticalPadding, tap)
                     = max(max(28, 30) + 18, 48) = 48
           -- which lands on the system's own touch target from the other side. */
        --avatar: 30px;
        --accent-w: 5px;
        --accent-h: 28px;
        --accent-r: 3px;
        --pad-h: 10px;
        --pad-v: 9px;
        --row-h: 48px;
        --row-radius: 14px;
        --row-gap: 4px;

        /* Type. 15 is the body floor and it is met. 12 and 10 are the two named
           exceptions -- a mark and an escape hatch, not body text. */
        --t-body: 15px;
        --t-initials: 12px;
        --t-digits: 10px;
      }
"""

BASE_CSS = """      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        background: #c9c9c2;
        font-family: Inter, system-ui, sans-serif;
        color: #23232b;
        padding: 40px 28px 64px;
      }

      h1 {
        font:
          700 26px/1.2 'Space Grotesk',
          Inter,
          sans-serif;
        letter-spacing: -0.02em;
        margin-bottom: 8px;
      }

      h2 {
        font:
          700 15px/1.3 Inter,
          sans-serif;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #3d3d46;
        margin: 44px 0 4px;
        padding-top: 20px;
        border-top: 1px solid #a9a9a2;
      }

      p.note {
        max-width: 78ch;
        font-size: 13px;
        line-height: 1.55;
        color: #3d3d46;
        margin-bottom: 18px;
      }

      p.note b {
        color: #23232b;
      }

      .row-of-plates {
        display: flex;
        flex-wrap: wrap;
        gap: 34px;
        align-items: flex-start;
        margin-bottom: 8px;
      }

      .plate {
        display: flex;
        flex-direction: column;
        gap: 9px;
        align-items: center;
      }

      .plate figcaption {
        font:
          600 11px/1.35 Inter,
          sans-serif;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        color: #3d3d46;
        text-align: center;
        max-width: 22ch;
      }

      .plate figcaption em {
        display: block;
        font:
          400 10px/1.4 Inter,
          sans-serif;
        letter-spacing: 0.02em;
        text-transform: none;
        color: #5a5a62;
      }

      /* ---- the frames themselves --------------------------------------- */
      /* Every frame is drawn at 1:1 in its OWN unit: dp for Wear, pt for watchOS.
         Nothing here is scaled, so a measurement taken off the screen is real. */
      .screen {
        background: var(--black);
        color: var(--cream);
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .round {
        border-radius: 50%;
      }

      .square {
        border-radius: 4px;
      }

      /* Wear square: the corners become usable and the rule is to LEAVE THEM
         EMPTY. The dotted circle is the round layout's envelope, drawn so the
         two frames can be checked against each other rather than diverging. */
      .envelope::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 1px dashed rgba(240, 240, 232, 0.22);
        pointer-events: none;
      }

      .listhead {
        font:
          600 13px/1 Inter,
          sans-serif;
        color: var(--cream);
        opacity: 0.75;
        text-align: center;
        flex: 0 0 auto;
      }

      .rows {
        display: flex;
        flex-direction: column;
        gap: var(--row-gap);
        overflow: hidden;
      }

      /* THE CARD ROW. Ink fill (not #1C1C1F), cream text (not white),
         beam star (not #FFCC00, not #F59E0B), and no plate behind it. */
      .row {
        display: flex;
        align-items: center;
        gap: 8px;
        height: var(--row-h);
        padding: var(--pad-v) var(--pad-h);
        border-radius: var(--row-radius);
        background: var(--ink);
        flex: 0 0 auto;
      }

      .row .accent {
        width: var(--accent-w);
        height: var(--accent-h);
        border-radius: var(--accent-r);
        flex: 0 0 auto;
      }

      /* The avatar is a circular mask, so artwork fills the INSCRIBED SQUARE --
         1/sqrt(2) = 70.7% of the diameter. That is not a reduction from the
         phone's 85%: it is the largest square the mask cannot clip. */
      .row .avatar {
        width: var(--avatar);
        height: var(--avatar);
        border-radius: 50%;
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        font:
          700 var(--t-initials) / 1 Inter,
          sans-serif;
      }

      .row .name {
        font:
          600 var(--t-body) / 1.1 Inter,
          sans-serif;
        color: var(--cream);
        flex: 1 1 auto;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .row .star {
        flex: 0 0 auto;
        line-height: 0;
      }

      /* THE BARCODE FIELD. White, true-black bars, nothing overlaid, ever. */
      .flash {
        background: var(--white);
        color: #000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .flash .title {
        font:
          600 13px/1.2 Inter,
          sans-serif;
        color: #000;
        text-align: center;
        max-width: 92%;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .flash .digits {
        font:
          500 var(--t-digits) / 1 'JetBrains Mono',
          ui-monospace,
          monospace;
        color: #000;
        letter-spacing: 0.06em;
      }

      /* Bars drawn as a hard-edged repeating gradient: no anti-aliasing between
         modules, which is the drawn equivalent of .interpolation(.none) /
         FilterQuality.None. A blurred module edge is the defect Story 16.23
         spent its whole budget on. */
      .bars {
        background:
          repeating-linear-gradient(
            90deg,
            #000 0 2px,
            #fff 2px 4px,
            #000 4px 7px,
            #fff 7px 9px,
            #000 9px 10px,
            #fff 10px 13px,
            #000 13px 17px,
            #fff 17px 18px,
            #000 18px 20px,
            #fff 20px 23px
          );
      }

      /* The watchOS reserved strip. The system draws the clock here and there is
         no API to suppress it, so the screen keeps the strip rather than letting
         white glyphs fall through the bars. Part of the BLACK surround -- which
         is why the title is cream and not ink. */
      .strip {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 0 6px;
        font:
          600 12px/1 Inter,
          sans-serif;
        color: var(--cream);
        background: var(--black);
      }

      .strip .chev {
        opacity: 0.8;
      }

      .strip .clock {
        margin-left: auto;
        opacity: 0.9;
        font-variant-numeric: tabular-nums;
      }

      .strip .cardname {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      /* Sort picker. The selected row is beam -- shape AND colour, never colour
         alone: the control and the weight both move with it. */
      .opt {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: var(--row-h);
        padding: 0 10px;
        border-radius: var(--row-radius);
        background: var(--ink);
        font:
          400 var(--t-body) / 1.15 Inter,
          sans-serif;
        color: var(--cream);
        flex: 0 0 auto;
      }

      .opt.sel {
        font-weight: 600;
        color: var(--beam);
      }

      .opt .dot {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid rgba(240, 240, 232, 0.55);
        flex: 0 0 auto;
      }

      .opt.sel .dot {
        border-color: var(--beam);
        background:
          radial-gradient(
            circle,
            var(--beam) 0 4px,
            transparent 4px
          );
      }

      .callout {
        max-width: 78ch;
        border-left: 3px solid var(--ink);
        padding: 10px 0 10px 14px;
        margin: 14px 0 22px;
        font-size: 13px;
        line-height: 1.55;
        color: #3d3d46;
      }

      .callout b {
        color: #23232b;
      }

      .ban {
        border-left-color: #c41e1e;
      }
"""


def head(title, extra_css=""):
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@500&family=Space+Grotesk:wght@700&display=swap"
      rel="stylesheet"
    />
    <style>
      /* ==================================================================
         GENERATED FILE -- do not hand-edit.

           python3 docs/design/cardi/tools/{title.split('--')[0].strip().lower().replace(' ', '_')}.py
           yarn frames:check          # asserts this file still matches

         The token block below is INLINED on purpose and must stay that way:
         any viewer that inlines the HTML drops a linked stylesheet and renders
         a broken frame, which reads as "the reference is wrong". The source
         duplication is removed in tools/_watch_shared.py instead.

         Source of truth for every value here: cardi-design-system.md and
         cardi-watch-grammar.md. This file is a copy of them.
         ================================================================== */

{TOKENS}
{BASE_CSS}{extra_css}    </style>
  </head>
"""

"""Build cardi-complication-frames.html -- the complication across all four
accessory families, and the 76 px budget that governs every one of them.

Story 23.1, AC12, as Story 23.4 shipped it. `WatchComplicationWidget.swift`
declares all four families, so all four are designed here.
(`ComplicationProvider.swift` declares none -- it is the App-Group snapshot the
widget reads, not a widget.)

The complication has ONE job: get you into the wallet in one tap. It is not a
data readout, and at these sizes anything that tries to be one is a smudge.

Every family draws the SHIPPED mark -- three bars, the beam crossing them --
which ifero chose over a one-bar reduction at Story 23.4's halt. The word-form
ì these frames drew before is the wordmark's glyph, not the mark.

Spec: ../cardi-watch-grammar.md, section 10.
"""
# Lives in docs/design/cardi/tools/ and writes into ../frames/.
# Output is COMMITTED and prettier-ignored; this script is the generator of
# record. `yarn frames:check` asserts they still match byte for byte.
import pathlib

import _watch_shared as S

OUT = (pathlib.Path(__file__).resolve().parent.parent / "frames"
       / "cardi-complication-frames.html")

EXTRA_CSS = """
      .face {
        background: radial-gradient(circle at 50% 38%, #101018 0%, #000 72%);
        color: var(--cream);
        position: relative;
        overflow: hidden;
        border-radius: 34px;
      }

      /* The corner family's arc follows the bezel and therefore sits close to the
         face's own rounded clip. Inset the slot rather than widening the arc --
         a clipped arc stops mid-word silently, which is the failure this whole
         family is most prone to. */
      .face .slot svg {
        overflow: visible;
      }

      .face .facetime {
        position: absolute;
        top: 8px;
        right: 12px;
        font:
          600 13px/1 Inter,
          sans-serif;
        color: var(--cream);
        opacity: 0.85;
        font-variant-numeric: tabular-nums;
      }

      .face .hands {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font:
          700 54px/1 'Space Grotesk',
          Inter,
          sans-serif;
        color: var(--cream);
        opacity: 0.9;
        letter-spacing: -0.03em;
      }

      .slot {
        position: absolute;
      }

      /* The specimens ------------------------------------------------------ */
      .spec {
        background: #000;
        border-radius: 10px;
        padding: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .circ {
        border-radius: 50%;
        background: var(--ink);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .rect {
        background: var(--ink);
        border-radius: 10px;
        padding: 6px 9px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .rect .lines {
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
      }

      .l1 {
        font:
          600 10px/1.2 Inter,
          sans-serif;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--beam);
      }

      .l2 {
        font:
          600 15px/1.15 Inter,
          sans-serif;
        color: var(--cream);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .inline-c {
        display: flex;
        align-items: center;
        gap: 5px;
        font:
          500 14px/1 Inter,
          sans-serif;
        color: var(--cream);
      }

      /* Tinted mode: the system recolours complication content, so nothing may
         depend on its own hue. Everything below must still read as SHAPE. */
      .tinted {
        filter: grayscale(1) brightness(1.25);
      }

      .budget {
        font:
          500 11px/1.4 'JetBrains Mono',
          ui-monospace,
          monospace;
        color: #3d3d46;
      }
"""


def mark_circle(px):
    """The mark on an ink disc, as `OpenAppIcon` draws it: the artwork's canvas at
    the disc's full size, clipped round. The canvas already pads the mark into
    the INSCRIBED SQUARE of the circle -- its farthest point is 0.672 of the
    radius -- so the disc adds no reduction of its own (§7.2)."""
    return (f'<span class="circ" style="width:{px}px;height:{px}px">'
            f'{S.mark(px)}</span>')


def corner(px, label="Esselunga", font=10, arc_deg=140):
    """accessoryCorner: a disc tucked into the corner plus a text arc following
    the bezel. The TIGHTEST image budget of the four -- which is exactly why the
    disc carries the mark alone and never text.

    The arc is sized from its own geometry rather than eyeballed, because the
    failure is silent: an arc shorter than its label does not wrap or ellipsis,
    it just stops drawing mid-word. arcLength = (deg/360) x 2*pi*r, and Inter at
    this weight runs about 0.52 em per character, so the check is one line.
    """
    import math

    r = px / 2 - 8
    arc_len = (arc_deg / 360) * 2 * math.pi * r
    est_text = len(label or "") * font * 0.52
    if est_text > arc_len:                      # truncate rather than draw a stub
        keep = max(1, int(arc_len / (font * 0.52)) - 1)
        label = label[:keep] + "\u2026"

    # Sweep the arc symmetrically about the top-left diagonal, so the disc sits
    # in the corner the family is named for.
    start = 180 - (arc_deg - 90) / 2
    end = start + arc_deg
    cx = cy = px / 2

    def point(deg):
        rad = math.radians(deg)
        return cx + r * math.cos(rad), cy + r * math.sin(rad)

    x0, y0 = point(start)
    x1, y1 = point(end)
    large = 1 if arc_deg > 180 else 0
    disc = (f'<span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)">'
            f'{mark_circle(round(px * 0.46))}</span>')
    if label is None:                           # no card: no arc, only the mark
        return (f'<span style="position:relative;width:{px}px;height:{px}px;display:block">'
                f'{disc}</span>')
    return (f'<span style="position:relative;width:{px}px;height:{px}px;display:block">'
            f'<svg width="{px}" height="{px}" viewBox="0 0 {px} {px}" aria-hidden="true" '
            f'style="position:absolute;inset:0;overflow:visible">'
            f'<path id="arc{px}" fill="none" d="M {x0:.1f} {y0:.1f} '
            f'A {r:.1f} {r:.1f} 0 {large} 1 {x1:.1f} {y1:.1f}" />'
            f'<text font-family="Inter,sans-serif" font-size="{font}" font-weight="600" '
            f'fill="var(--cream)"><textPath href="#arc{px}" startOffset="50%" '
            f'text-anchor="middle">{label}</textPath></text></svg>'
            f'{disc}</span>')


def rectangular(card="Esselunga"):
    """The mark in a 30 pt disc beside TWO lines: the app name over the card's
    name. No third line -- no store and no card number reach the face (Story
    23.4, decision 2). With no card, the disc beside the open-app title alone:
    the app name labels a card's name, and there is none to label."""
    if card is None:
        return ('<span class="rect" style="width:156px">'
                f'{mark_circle(30)}'
                '<span class="lines"><span class="l2">Open app</span></span></span>')
    return ('<span class="rect" style="width:156px">'
            f'{mark_circle(30)}'
            '<span class="lines">'
            '<span class="l1">Cardì</span>'
            f'<span class="l2">{card}</span>'
            '</span></span>')


def inline(text="Esselunga"):
    """The glyph as the image, the card's name as the text. watchOS draws the
    inline image as a TEMPLATE, from its alpha alone, on every face -- so the
    glyph is drawn here as the one-colour silhouette the face shows, in the
    text's colour, framed tight on the mark (`OpenAppIconGlyph`)."""
    glyph = S.mark(15, tight=True, bar_fill="currentColor", beam_fill="currentColor")
    return f'<span class="inline-c">{glyph}<span>{text}</span></span>'


def plate(inner, caption, sub="", tinted=False):
    em = f"<em>{sub}</em>" if sub else ""
    cls = "spec tinted" if tinted else "spec"
    return (f'    <figure class="plate"><span class="{cls}">{inner}</span>'
            f'<figcaption>{caption}{em}</figcaption></figure>')


# ---- the watch face, 45 mm (198 x 242 pt), with all four slots in situ ------
FW, FH = S.WATCHOS["45 mm"]
# Slots are placed EXPLICITLY rather than centred, because the first attempt let
# the inline complication land on top of the clock and the corner arc get
# guillotined by the face's own overflow. A watch face is a packing problem; a
# flex "centre" is not a placement.
face = (
    f'    <figure class="plate">'
    f'<span class="face" style="width:{FW}px;height:{FH}px;display:block">'
    f'<span class="facetime">10:09</span>'
    f'<span class="slot" style="left:9px;top:9px">{corner(64, font=8, arc_deg=115)}</span>'
    f'<span class="slot" style="right:14px;top:30px">{mark_circle(32)}</span>'
    f'<span class="slot" style="left:0;right:0;top:96px;text-align:center;'
    f'font:700 44px/1 \'Space Grotesk\',Inter,sans-serif;color:var(--cream);'
    f'letter-spacing:-0.03em">10:09</span>'
    f'<span class="slot" style="left:50%;top:150px;transform:translateX(-50%)">'
    f'{inline()}</span>'
    f'<span class="slot" style="left:50%;bottom:12px;transform:translateX(-50%)">'
    f'{rectangular()}</span>'
    f'</span>'
    f'<figcaption>In situ &mdash; 45 mm, 198 &times; 242 pt'
    f'<em>A composite: no real face carries all four at once. Corner top-left, '
    f'circular top-right, inline centre, rectangular bottom — at true scale.</em>'
    f'</figcaption></figure>')

families = [
    plate(mark_circle(44), "accessoryCircular",
          "The mark alone, beam on ink. No text — at this size a word is a smudge."),
    plate(corner(84), "accessoryCorner",
          "Disc + curved arc in cream. The tightest image budget of the four."),
    plate(corner(84, label="Metro Supermercati"), "accessoryCorner — long name",
          "The arc TRUNCATES rather than stopping mid-word. On the watch the system "
          "truncates it; here it is sized from arc length — the failure is silent."),
    plate(rectangular(), "accessoryRectangular",
          "The mark in a 30 pt disc beside two lines. No third line: no store, no card number."),
    plate(inline(), "accessoryInline",
          "The glyph + the card's name. watchOS draws the image as a template, so it is "
          "the mark's silhouette."),
]

no_card = [
    plate(mark_circle(44), "Circular, no card", "The mark."),
    plate(corner(84, label=None), "Corner, no card", "The mark; no arc."),
    plate(rectangular(card=None), "Rectangular, no card",
          "The disc and “Open app” on one line. “CARDÌ” labels a "
          "card's name; there is none."),
    plate(inline("Open Cardì"), "Inline, no card", "The glyph and “Open Cardì”."),
]

tinted = [
    plate(mark_circle(44), "Circular, tinted", "", tinted=True),
    plate(corner(84), "Corner, tinted", "", tinted=True),
    plate(rectangular(), "Rectangular, tinted", "", tinted=True),
    plate(inline(), "Inline, tinted", "", tinted=True),
]

HTML = f"""{S.head('Cardì on the watch — the complication, four families', EXTRA_CSS)}  <body>
    <h1>{S.wordmark(26)} &mdash; the complication, all four families</h1>
    <p class="note">
      Story 23.1, AC12, as Story 23.4 shipped it. <code>WatchComplicationWidget.swift</code>
      declares <b>all four</b> accessory families, so all four are designed. They name the
      <b>top card</b>, which the widget reads from the App-Group snapshot the watch app writes
      (<code>ComplicationProvider.swift</code>) after every sync. The complication has
      <b>one job</b>: get you into the wallet in one tap. It is not a data readout.
    </p>
    <div class="callout">
      <b>The mark is the shipped one</b>: three bars, the beam crossing them &mdash; the artwork
      <code>OpenAppIcon</code>, drawn here from the same constants as
      <code>scripts/build-brand-icons.mjs</code>. At Story 23.4&rsquo;s halt ifero compared it with
      a one-bar reduction in all four families, full colour and tinted, at 40 mm and 46 mm, and
      chose the full mark (2026-10-29). In the 40 mm corner disc its bars start to merge; that
      was accepted. The inline family carries <code>OpenAppIconGlyph</code>, the same mark,
      transparent and framed tight.
    </div>

    <h2>The four families</h2>
    <div class="row-of-plates">
{chr(10).join(families)}
    </div>

    <h2>No card</h2>
    <p class="note">
      With no card, or no snapshot yet, every family falls back to the mark and the open-app
      strings. If the mark itself fails to load, the slot shows text alone &mdash; never a
      stand-in glyph.
    </p>
    <div class="row-of-plates">
{chr(10).join(no_card)}
    </div>

    <h2>The 76 px budget is a gate, not a guideline</h2>
    <div class="callout ban">
      <code class="budget">ComplicationImage.swift</code> downsamples to
      <b>maxPoint 38 &times; scale 2 = 76 px</b>. WidgetKit measures a raster image's
      <b>native</b> pixel size and rejects anything over the per-family budget with
      <code>imageTooLarge</code>, which renders the slot as a <b>grey placeholder</b>.
      <code>.frame</code> and <code>.scaledToFit</code> change layout, not the archived bitmap
      &mdash; <b>they do not help</b>.
      <br /><br />
      The source comment states the budget <b>once</b>, as 76 px, since Story 23.4: it archives
      in all four families, <code>accessoryCorner</code> included, the tightest of them.
      <b>76 px is the shipped, working value; design to it.</b> Both the mark and the glyph
      are downsampled to it.
    </div>

    <h2>In situ</h2>
    <div class="row-of-plates">
{face}
    </div>

    <h2>The tinted check &mdash; every family must read as SHAPE</h2>
    <p class="note">
      Watch faces render complications in a <b>tinted</b> mode where the system recolours the
      content, so <b>no design may depend on its own hue</b>. Below is the same set with colour
      removed. The <b>mark survives</b> because it is a shape &mdash; the beam crosses the bars
      and extends past them on both sides; a design that separated beam from ink by colour alone
      would collapse into one flat tone here. On the watch the mark is drawn by its luminance
      (<code>.accentedDesaturated</code>). In circular and rectangular the bars and the beam take
      the face&rsquo;s tint and the ink field falls away; the corner shows the mark white on a
      grey disc instead. The &ldquo;CARD&Igrave;&rdquo; label takes the tint too. Draw them in
      beam on ink, then verify them desaturated.
    </p>
    <div class="row-of-plates">
{chr(10).join(tinted)}
    </div>

    <div class="callout">
      <b>The accent, and the one thing it must not reach.</b> The watch accent colour is
      <b>beam #FCCC0C</b> (both <code>AccentColor.colorset</code> files were empty stubs, so
      Story 21.3 <em>added</em> a definition rather than changing one). Apple applies the accent
      to <b>the app's title string in the status bar</b> &mdash; which on the watchOS barcode
      screen is the card's name. <b>The barcode screen therefore overrides the tint to
      cream</b>, as it already overrides dark mode.
    </div>
  </body>
</html>
"""

OUT.write_text(HTML, encoding="utf-8")
# 4 families, 5 specimens: accessoryCorner is drawn twice so the arc's
# truncation branch is SHOWN working rather than only described.
print(f"wrote {OUT.name} — {len(HTML.splitlines())} lines, "
      f"4 families in {len(families)} specimens")

import { ANGLE, CARD, STEM, cardBars, cardCorners } from './brand-mark.mjs';

/**
 * The Cardì WORDMARK: `Card` in Space Grotesk Bold, converted to outlines, plus
 * the drawn `ì` that replaces the letter.
 *
 * THE ì CARRIES THE MARK'S OWN CARD (Story 20.6). Its stem is the word's single
 * 12-unit bar, from the x-height to the baseline, and its accent is the icon's
 * card scaled to that stem — the icon's 156-unit stem becomes 12 — with the same
 * five bars cut through it. The card, its bars and its angle come from
 * `brand-mark.mjs`, the one definition the icon generator reads too, so the word
 * and the icon cannot carry two different cards. Only its PLACE is the word's
 * own: see {@link WORD_CARD_GAP}.
 *
 * ⛔ THE ACCENT DESCENDS. `rotate(35)` is a grave and spells Cardì; `rotate(-35)`
 * rises and spells a different word. SVG's y-axis points down, so the POSITIVE
 * angle is the correct one. Every exploration sheet in `docs/design/cardi/frames/`
 * was drawn wrong until 2026-08-25. The angle comes from `brand-mark.mjs` rather
 * than a literal here precisely so it comes from the one place that owns it.
 *
 * ⚠️ `vertical-align: -0.30em` DOES NOT APPLY HERE, and copying it in would do
 * nothing. That correction exists because an inline `<svg>` in a line of HTML
 * aligns its box bottom to the text baseline; it is a CSS property with no effect
 * inside a standalone `.svg` and none at all in a rasteriser. This module places
 * the glyph by its geometry instead — everything is BASELINE-RELATIVE, so the
 * caller's own baseline is the only anchor and there is nothing left to float.
 *
 * ## Where the letterforms come from
 *
 * Space Grotesk Bold, version 2.000, SIL Open Font License 1.1, as served by
 * Google Fonts:
 *
 *   https://fonts.gstatic.com/s/spacegrotesk/v22/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj4PVksj.ttf
 *   sha256 3e756954468ff1cb302dae0414262e72f76a67d87bef3fa1f3226cd0fb9b2d85
 *
 * The four glyphs were converted to outlines with fontTools' `SVGPathPen` under
 * the transform `(0.1, 0, 0, -0.1, 0, 0)`: 1000 font units to the em becomes 100,
 * and the y-axis flips to SVG's downward one with the baseline left at y=0.
 *
 * OUTLINES RATHER THAN A `font-family`, because the artwork is RASTERISED. An SVG
 * that says `font-family="Space Grotesk"` renders in whatever the renderer has —
 * the file this replaced asked for `Avenir Next, SF Pro Display, Arial` and got
 * one of those — and the store would then show the wordmark in the wrong
 * typeface. It also means no font file has to be committed to draw a banner;
 * bundling the typefaces for the APP is Story 21.6.
 *
 * The extracted em geometry agrees with `docs/design/cardi/`, measured rather than
 * assumed: the drawn `x` is 49.6 units tall ({@link X_HEIGHT}), `d` reaches 70.0
 * above the baseline, and `r`'s x-height shoulder lands exactly on the ì's stem top.
 */

/**
 * `Card`, baseline-relative: 100 units to the em, y DOWN, baseline at y = 0.
 * `bounds` is the glyph's exact outline extent from the font, not a flattened
 * approximation of it, so the caller can frame the wordmark without rasterising.
 */
export const SPACE_GROTESK_BOLD_GLYPHS = {
  C: {
    advance: 64.4,
    bounds: { x0: 5, y0: -71.4, x1: 60.2, y1: 1.4 },
    path: 'M33.2 1.4Q20.2 1.4 12.6 -5.85Q5 -13.1 5 -26.6V-43.4Q5 -56.9 12.6 -64.15Q20.2 -71.4 33.2 -71.4Q46.1 -71.4 53.15 -64.35Q60.2 -57.3 60.2 -45V-44.4H47.2V-45.4Q47.2 -51.6 43.75 -55.6Q40.3 -59.6 33.2 -59.6Q26.2 -59.6 22.2 -55.3Q18.2 -51 18.2 -43.6V-26.4Q18.2 -19.1 22.2 -14.75Q26.2 -10.4 33.2 -10.4Q40.3 -10.4 43.75 -14.45Q47.2 -18.5 47.2 -24.6V-26.4H60.2V-25Q60.2 -12.7 53.15 -5.65Q46.1 1.4 33.2 1.4Z'
  },
  a: {
    advance: 57.8,
    bounds: { x0: 3.8, y0: -51, x1: 55.6, y1: 1.4 },
    path: 'M22.4 1.4Q17.1 1.4 12.9 -0.45Q8.7 -2.3 6.25 -5.85Q3.8 -9.4 3.8 -14.5Q3.8 -19.6 6.25 -23.05Q8.7 -26.5 13.05 -28.25Q17.4 -30 23 -30H36.6V-32.8Q36.6 -36.3 34.4 -38.55Q32.2 -40.8 27.4 -40.8Q22.7 -40.8 20.4 -38.65Q18.1 -36.5 17.4 -33.1L5.8 -37Q7 -40.8 9.65 -43.95Q12.3 -47.1 16.75 -49.05Q21.2 -51 27.6 -51Q37.4 -51 43.1 -46.1Q48.8 -41.2 48.8 -31.9V-13.4Q48.8 -10.4 51.6 -10.4H55.6V0H47.2Q43.5 0 41.1 -1.8Q38.7 -3.6 38.7 -6.6V-6.7H36.8Q36.4 -5.5 35 -3.55Q33.6 -1.6 30.6 -0.1Q27.6 1.4 22.4 1.4ZM24.6 -8.8Q29.9 -8.8 33.25 -11.75Q36.6 -14.7 36.6 -19.6V-20.6H23.9Q20.4 -20.6 18.4 -19.1Q16.4 -17.6 16.4 -14.9Q16.4 -12.2 18.5 -10.5Q20.6 -8.8 24.6 -8.8Z'
  },
  r: {
    advance: 39.6,
    bounds: { x0: 7, y0: -49.8, x1: 36.8, y1: 0 },
    path: 'M7 0V-49.6H19.4V-44H21.2Q22.3 -47 24.85 -48.4Q27.4 -49.8 30.8 -49.8H36.8V-38.6H30.6Q25.8 -38.6 22.7 -36.05Q19.6 -33.5 19.6 -28.2V0Z'
  },
  d: {
    advance: 63.8,
    bounds: { x0: 4.6, y0: -70, x1: 56.8, y1: 1.4 },
    path: 'M27 1.4Q21.1 1.4 15.95 -1.55Q10.8 -4.5 7.7 -10.2Q4.6 -15.9 4.6 -24V-25.6Q4.6 -33.7 7.7 -39.4Q10.8 -45.1 15.9 -48.05Q21 -51 27 -51Q31.5 -51 34.55 -49.95Q37.6 -48.9 39.5 -47.3Q41.4 -45.7 42.4 -43.9H44.2V-70H56.8V0H44.4V-6H42.6Q40.9 -3.2 37.35 -0.9Q33.8 1.4 27 1.4ZM30.8 -9.6Q36.6 -9.6 40.5 -13.35Q44.4 -17.1 44.4 -24.3V-25.3Q44.4 -32.5 40.55 -36.25Q36.7 -40 30.8 -40Q25 -40 21.1 -36.25Q17.2 -32.5 17.2 -25.3V-24.3Q17.2 -17.1 21.1 -13.35Q25 -9.6 30.8 -9.6Z'
  }
};

/**
 * The font's own kerning for the one pair in `Cardì` that carries any: GPOS asks
 * for -18/1000 em between `r` and `d`. Dropping it is what leaves a wordmark
 * looking loose in the middle, and it is 1.8 units at this scale.
 */
export const KERNING = { rd: -1.8 };

/**
 * Tracking, in em units, applied between letters. The wordmark's, not the font's.
 *
 * `-0.03em` is `display-lg`'s value — the tightest in the type scale, and the scale
 * already tightens as size grows (`headline-md` at 24px is `-0.01em`, `display-lg` at
 * 34px is `-0.03em`). The banner draws the wordmark at roughly 600px, far past either,
 * so the tightest end is the right one to take.
 *
 * ⚠️ The lockup sheets do NOT agree with each other and cannot settle this:
 * `mark_locked.py`, `grave_vs_acute.py`, `icon_decision.py` and `icon_explore.py` set
 * `-0.02em`; `brand_lockup.py` and `mark_sweep35.py` set `-0.03em`. All six set it for
 * specimens between 16 and 84px rather than for a logotype, so this follows the token
 * rather than any one sheet.
 */
export const LETTER_SPACING = -3;

/** Space Grotesk Bold's drawn x-height, in em units: the height of the ì's stem. */
export const X_HEIGHT = 49.6;

/** The drawn ì's advance, in em units: the room the stem is centred in. */
export const MARK_ADVANCE = 30;

/** `stem_single(w=12)`: one rounded bar from the x-height to the baseline. */
export const WORD_STEM_WIDTH = 12;

/**
 * The space between the card and the stem's top, in em units, measured from the
 * card's TURNED BOX — the corners of its sharp rectangle once turned, which the
 * rounded card never quite reaches. The word's own value, from the reference
 * wordmark (`docs/design/cardi/logo-concepts/final/wordmark-*.svg`): a quarter of
 * the stem's width, where the icon's card sits about a third of its stem's width
 * clear.
 */
export const WORD_CARD_GAP = 3;

const radians = (degrees) => (degrees * Math.PI) / 180;

/** @typedef {{x: number, y: number, width: number, height: number, radius: number}} WordRect */

/**
 * Position `Cardì` on a baseline, in em units.
 *
 * The caller owns only `baseline`. The x-height and the ì's advance are the
 * word's own metrics, above; the card and its angle are the mark's, from
 * `brand-mark.mjs`.
 *
 * @param {{baseline: number}} em
 * @returns {{
 *   letters: {glyph: string, path: string, dx: number}[],
 *   stem: WordRect,
 *   card: {rect: WordRect, pivot: {x: number, y: number}, angle: number, bars: WordRect[]},
 *   advance: number,
 *   ink: {x0: number, y0: number, x1: number, y1: number}
 * }} The card's `rect` and `bars` are LEVEL: turn them together by `angle` about
 *   `pivot`, the card's centre. The bars are holes through the card, never paint.
 *   `ink` is the drawn extent, which is what to centre on. It is WIDER than
 *   `advance` on neither side, but it is narrower on both, because `C` has a left
 *   side bearing and the turned card stops short of the ì's advance.
 */
export const layoutWordmark = ({ baseline }) => {
  const letters = [];
  let pen = 0;
  let previous = null;
  for (const glyph of 'Card') {
    if (previous !== null) pen += LETTER_SPACING + (KERNING[previous + glyph] ?? 0);
    letters.push({ glyph, path: SPACE_GROTESK_BOLD_GLYPHS[glyph].path, dx: pen });
    pen += SPACE_GROTESK_BOLD_GLYPHS[glyph].advance;
    previous = glyph;
  }
  const markX = pen + LETTER_SPACING;

  const centreX = markX + MARK_ADVANCE / 2;
  const stem = {
    x: centreX - WORD_STEM_WIDTH / 2,
    y: baseline - X_HEIGHT,
    width: WORD_STEM_WIDTH,
    height: X_HEIGHT,
    radius: WORD_STEM_WIDTH / 2
  };

  // The icon's card, scaled by the ratio of the two stems. Across, it keeps the
  // icon's offset from the stem: 22 of the icon's 156 stem units left of the stem's
  // centre. Down, its turned box sits WORD_CARD_GAP above the stem's top.
  const k = WORD_STEM_WIDTH / STEM.w;
  const width = CARD.w * k;
  const height = CARD.h * k;
  const pivot = {
    x: centreX + (CARD.cx - (STEM.x + STEM.w / 2)) * k,
    y: stem.y - WORD_CARD_GAP - Math.max(...cardCorners(k).map((corner) => corner.y))
  };
  const rect = {
    x: pivot.x - width / 2,
    y: pivot.y - height / 2,
    width,
    height,
    radius: CARD.r * k
  };
  const card = {
    rect,
    pivot,
    angle: ANGLE,
    bars: cardBars(k).map((bar) => ({
      x: rect.x + bar.x,
      y: rect.y + bar.y,
      width: bar.w,
      height: bar.h,
      radius: bar.r
    }))
  };

  // The card's DRAWN extent once turned, closed-form — no need to flatten it to
  // find out how far it reaches. A rounded rect is its inner rect, shorter than it
  // by one corner radius at each end, swept by a disc of that radius; its bounding
  // box is the turned inner rect plus that radius on each axis, NOT the turned
  // corners of the sharp rectangle, which overstate it by about 0.85 units here.
  //
  // ⚠️ This deliberately differs from the turned box that places the card above.
  // Both are right for their own job: the box is the measure the reference states
  // the gap in, and the same bound `build-brand-icons.mjs` frames the mark with,
  // while this is the drawn extent the banner CENTRES on, where erring outward
  // pushes the wordmark off centre.
  //
  // ⚠️ The card's top lands 73.86 above the baseline, past the 70 the design
  // system's inline-ì recipe allows: in its 1em box, baseline at y = 70 of 100,
  // the card's top is at y = −3.86 and is clipped. An inline `<svg>` drawn from
  // this layout needs `overflow: visible`, or a taller box, to show the card whole.
  // The banners are unaffected: they frame the wordmark on `ink`, which includes it.
  const a = radians(ANGLE);
  const innerW = width / 2 - rect.radius;
  const innerH = height / 2 - rect.radius;
  const halfWidth = innerW * Math.cos(a) + innerH * Math.sin(a) + rect.radius;
  const halfHeight = innerW * Math.sin(a) + innerH * Math.cos(a) + rect.radius;

  const ink = {
    x0: Math.min(...letters.map((l) => l.dx + SPACE_GROTESK_BOLD_GLYPHS[l.glyph].bounds.x0)),
    x1: Math.max(
      ...letters.map((l) => l.dx + SPACE_GROTESK_BOLD_GLYPHS[l.glyph].bounds.x1),
      stem.x + stem.width,
      pivot.x + halfWidth
    ),
    y0: Math.min(
      ...letters.map((l) => baseline + SPACE_GROTESK_BOLD_GLYPHS[l.glyph].bounds.y0),
      pivot.y - halfHeight
    ),
    y1: Math.max(
      ...letters.map((l) => baseline + SPACE_GROTESK_BOLD_GLYPHS[l.glyph].bounds.y1),
      baseline
    )
  };

  return { letters, stem, card, advance: markX + MARK_ADVANCE, ink };
};

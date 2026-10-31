/**
 * THE Cardì MARK, "3C Tessera" (Story 20.6): the one definition every drawing of it reads.
 *
 * A cream capsule stem under a beam ID-1 card turned to the grave's 35°, the card carrying a
 * five-bar barcode set low under a plain band, so it reads as a loyalty card rather than a bank
 * card. ifero chose it on 2026-10-30 over the barcode stem crossed by a beam that Story 20.3
 * shipped.
 *
 * Every number is on the 1024 design grid of
 * `docs/design/cardi/logo-concepts/final/cardi-icon.svg`, the reference the generated assets are
 * drawn to match. That file is a reference and not a source: no generator reads it. Only
 * `test/brand-mark-reference.test.ts` does, to compare the generated icon with it.
 *
 * Two generators read this module, so the mark has no second copy to drift:
 *
 *   - `scripts/build-brand-icons.mjs` draws the icons, the splash, the in-app SVGs and the watch
 *     and Wear rasters from it, centred on the mark's own box;
 *   - `scripts/lib/brand-wordmark.mjs` scales the same card into the wordmark's drawn ì.
 *
 * POSITIONS ARE RELATIVE. The reference sits the mark where it was drawn on its canvas; the
 * generator centres the mark's box instead, so only the shapes' positions relative to each other
 * are binding here.
 */

/**
 * ⛔ THE CARD DESCENDS. `rotate(35)` is a grave and spells Cardì; `rotate(-35)` rises and spells a
 * different word. SVG's y-axis points down, so the POSITIVE angle is the correct one.
 */
export const ANGLE = 35;

/** The stem: a capsule, its radius half its width. */
export const STEM = { x: 456, y: 462, w: 156, h: 400, r: 78 };

/** The card: the shape of an ID-1 card (85.60 × 53.98 mm), turned about its centre. */
export const CARD = { cx: 512, cy: 270, w: 264, h: 166, r: 28 };

/**
 * The barcode on the card. Bar widths left to right, the space between them, their corner
 * radius, the plain band above them and the margin below them. The bars are centred across the
 * card and run from the band down to the margin.
 *
 * A fixed, deliberately NON-ENCODING pattern, for the same reason the banner's is: a brand mark
 * that resolved to a real number would be an invitation to point a scanner at it.
 */
export const BARCODE = { widths: [26, 40, 18, 32, 22], gap: 18, r: 3, band: 62, margin: 26 };

const radians = (degrees) => (degrees * Math.PI) / 180;

/** The card's level rect on the grid, before it turns about its centre. */
export const cardRect = () => ({
  x: CARD.cx - CARD.w / 2,
  y: CARD.cy - CARD.h / 2,
  w: CARD.w,
  h: CARD.h,
  r: CARD.r
});

/**
 * The bars in the CARD'S OWN FRAME: level, relative to the card's top-left corner, scaled by
 * `scale` with the card. Place them on the card's level rect and turn them with it.
 */
export const cardBars = (scale = 1) => {
  const total =
    BARCODE.widths.reduce((sum, width) => sum + width, 0) +
    BARCODE.gap * (BARCODE.widths.length - 1);
  const height = CARD.h - BARCODE.band - BARCODE.margin;
  let x = (CARD.w - total) / 2;
  // The bars must fit on the card inside the margin, on the sides as below them.
  if (x < BARCODE.margin || height <= 0) {
    throw new Error(
      `brand-mark: the barcode does not fit the card (side margin ${x}, bar height ${height})`
    );
  }
  return BARCODE.widths.map((width) => {
    const bar = {
      x: x * scale,
      y: BARCODE.band * scale,
      w: width * scale,
      h: height * scale,
      r: BARCODE.r * scale
    };
    x += width + BARCODE.gap;
    return bar;
  });
};

/** A point turned about the origin by `degrees`, y down. */
const turn = (x, y, degrees) => {
  const a = radians(degrees);
  return { x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) };
};

/**
 * The corners of the card's SHARP rectangle once turned, as offsets from the card's centre,
 * scaled by `scale`. Their extent is the mark's box: an upper bound on the drawn card, which the
 * rounded corners never quite reach, and the box every generated viewBox and frame is cut to.
 */
export const cardCorners = (scale = 1, angle = ANGLE) =>
  [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1]
  ].map(([sx, sy]) => turn((sx * CARD.w * scale) / 2, (sy * CARD.h * scale) / 2, angle));

/**
 * The furthest DRAWN point of the mark from `(cx, cy)`, on the grid.
 *
 * Exact for the true rounded shapes, not their boxes: a rounded rect is its inner rect swept by
 * a disc of its corner radius, so its furthest point from anywhere is one corner circle's centre
 * plus that radius. The stem is a capsule, so two of its four corner centres coincide.
 */
export const drawnRadius = (cx, cy) => {
  const corners = (halfW, halfH) => [
    [-halfW, -halfH],
    [halfW, -halfH],
    [halfW, halfH],
    [-halfW, halfH]
  ];
  const stemCentre = { x: STEM.x + STEM.w / 2, y: STEM.y + STEM.h / 2 };
  const stem = corners(STEM.w / 2 - STEM.r, STEM.h / 2 - STEM.r).map(
    ([dx, dy]) => Math.hypot(stemCentre.x + dx - cx, stemCentre.y + dy - cy) + STEM.r
  );
  const card = corners(CARD.w / 2 - CARD.r, CARD.h / 2 - CARD.r).map(([dx, dy]) => {
    const p = turn(dx, dy, ANGLE);
    return Math.hypot(CARD.cx + p.x - cx, CARD.cy + p.y - cy) + CARD.r;
  });
  return Math.max(...stem, ...card);
};

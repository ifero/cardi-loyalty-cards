/**
 * @jest-environment node
 */
// Unit tests for brand-mark.mjs, the one definition of the Tessera mark (Story 20.6).
//
// WHY A SUBPROCESS: brand-mark.mjs is a plain Node ESM module in scripts/, and Jest compiles
// through babel.config.test.js, which targets Hermes/React Native and emits CommonJS;
// `moduleFileExtensions` also omits `mjs`. Every case is therefore evaluated in one real
// `node --input-type=module` child — the pattern path-raster.test.js and story-refs.test.js use.
//
// WHY THESE PINS: `yarn icons:check` compares the committed assets with whatever this module
// says, so it would defend a wrong number forever. These state the reference instead —
// docs/design/cardi/logo-concepts/final/cardi-icon.svg — so a change to the mark has to change
// them on purpose.

const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');

const MODULE_URL = pathToFileURL(require.resolve('./brand-mark.mjs')).href;

const run = () => {
  const harness = `
    const mark = await import(${JSON.stringify(MODULE_URL)});
    const { STEM, CARD, BARCODE, cardRect, cardBars, cardCorners, drawnRadius } = mark;

    const corners = cardCorners();
    const xs = [STEM.x, STEM.x + STEM.w, ...corners.map((c) => CARD.cx + c.x)];
    const ys = [STEM.y, STEM.y + STEM.h, ...corners.map((c) => CARD.cy + c.y)];
    const centre = {
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      y: (Math.min(...ys) + Math.max(...ys)) / 2
    };
    // The stem's foot: the centre of its round end, plus its radius.
    const foot =
      Math.hypot(STEM.x + STEM.w / 2 - centre.x, STEM.y + STEM.h - STEM.r - centre.y) + STEM.r;

    // A BARCODE edit that overflows the card must fail, not draw bars off its edge.
    const widths = [...BARCODE.widths];
    BARCODE.widths.push(40);
    let overflow = null;
    try {
      cardBars();
    } catch (error) {
      overflow = String(error.message);
    }
    BARCODE.widths.splice(0, BARCODE.widths.length, ...widths);

    process.stdout.write(
      JSON.stringify({
        card: cardRect(),
        bars: cardBars(),
        halfBars: cardBars(0.5),
        corners,
        centre,
        drawn: drawnRadius(centre.x, centre.y),
        foot,
        overflow
      })
    );
  `;
  let stdout;
  try {
    stdout = execFileSync(process.execPath, ['--input-type=module', '-e', harness], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } catch (err) {
    throw new Error(`brand-mark harness failed:\n${err.stderr || err.message}`);
  }
  return JSON.parse(stdout);
};

describe('brand-mark', () => {
  let r;

  beforeAll(() => {
    r = run();
  });

  describe('cardBars', () => {
    it('puts the bars where the reference does, at its widths', () => {
      // In the reference the card is level at (380, 187); its bars sit at these x on the grid.
      expect(r.card).toEqual({ x: 380, y: 187, w: 264, h: 166, r: 28 });
      expect(r.bars.map((bar) => [r.card.x + bar.x, bar.w])).toEqual([
        [407, 26],
        [451, 40],
        [509, 18],
        [545, 32],
        [595, 22]
      ]);
      expect(r.bars.every((bar) => bar.r === 3)).toBe(true);
    });

    it('runs them from under the 62 band to 26 above the card’s foot', () => {
      for (const bar of r.bars) {
        expect(bar.y).toBe(62);
        expect(r.card.h - (bar.y + bar.h)).toBe(26);
      }
    });

    it('keeps every bar inside the card', () => {
      for (const bar of r.bars) {
        expect(bar.x).toBeGreaterThanOrEqual(26);
        expect(bar.x + bar.w).toBeLessThanOrEqual(r.card.w - 26);
        expect(bar.y + bar.h).toBeLessThanOrEqual(r.card.h - 26);
      }
    });

    it('throws when the barcode no longer fits the card', () => {
      expect(r.overflow).toMatch(/does not fit the card/);
    });

    it('scales the bars with the card', () => {
      expect(r.halfBars).toEqual(
        r.bars.map((bar) => ({
          x: bar.x / 2,
          y: bar.y / 2,
          w: bar.w / 2,
          h: bar.h / 2,
          r: bar.r / 2
        }))
      );
    });
  });

  describe('cardCorners', () => {
    it('turns the sharp card +35° about its centre', () => {
      // 132·cos 35° + 83·sin 35° across, 132·sin 35° + 83·cos 35° down.
      const across = Math.max(...r.corners.map((c) => Math.abs(c.x)));
      const down = Math.max(...r.corners.map((c) => Math.abs(c.y)));
      expect(across).toBeCloseTo(155.735, 3);
      expect(down).toBeCloseTo(143.702, 3);
      // A grave: the top-most corner is left of the centre.
      const top = r.corners.reduce((a, b) => (b.y < a.y ? b : a));
      expect(top.x).toBeLessThan(0);
    });

    it('gives the mark a box centred on x 512, from y 126.30 to the stem’s foot at 862', () => {
      expect(r.centre.x).toBeCloseTo(512, 6);
      expect(r.centre.y).toBeCloseTo((126.298 + 862) / 2, 3);
    });
  });

  describe('drawnRadius', () => {
    it('is about 368.68 from the box’s centre, at the stem’s foot', () => {
      expect(r.drawn).toBeCloseTo(368.68, 2);
      expect(r.drawn).toBeCloseTo(r.foot, 9);
    });
  });
});

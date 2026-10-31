import fs from 'node:fs';
import path from 'node:path';

import { IDENTITY_COLORS } from '@/shared/theme/tokens.generated';

/**
 * The shipped icon is the approved drawing (Story 20.6, its first acceptance criterion).
 *
 * `yarn icons:check` pins the assets to whatever the generator writes, and `brand-mark.test.js`
 * pins the generator's numbers to the reference; neither would notice the generator mapping
 * those numbers wrongly onto the canvas. This compares the generated `cardi-icon.svg` with
 * `docs/design/cardi/logo-concepts/final/cardi-icon.svg`, the drawing ifero chose, and allows
 * exactly one difference: the generator centres the mark's box, so every shape moves by the same
 * vertical offset and nothing else. Boxes, the turn, the corner radii and the colours are compared.
 */
const repoRoot = path.resolve(__dirname, '..');
const read = (relative: string) => fs.readFileSync(path.join(repoRoot, relative), 'utf8');

type Box = { x0: number; y0: number; x1: number; y1: number };

const attr = (tag: string, name: string): number =>
  Number(new RegExp(`\\s${name}="([-\\d.]+)"`).exec(tag)?.[1] ?? NaN);
const fillOf = (tag: string) => /fill="(#[0-9A-Fa-f]{6})"/.exec(tag)?.[1]?.toUpperCase();
const rotateOf = (tag: string) =>
  (/rotate\(([-\d.]+) ([-\d.]+) ([-\d.]+)\)/.exec(tag) ?? []).slice(1).map(Number);
const rectBox = (tag: string): Box => ({
  x0: attr(tag, 'x'),
  y0: attr(tag, 'y'),
  x1: attr(tag, 'x') + attr(tag, 'width'),
  y1: attr(tag, 'y') + attr(tag, 'height')
});

/**
 * Each subpath's box, and the radii of its arcs (rx and ry of each, in order). The generator
 * writes M, H, V and quarter-circle A commands only.
 */
const subpathBoxes = (d: string): (Box & { radii: number[] })[] =>
  d
    .split('M')
    .filter((part) => part.trim())
    .map((part) => {
      const tokens = `M${part}`.match(/[MHVAZ]|-?[\d.]+/g) ?? [];
      const xs: number[] = [];
      const ys: number[] = [];
      const radii: number[] = [];
      let x = 0;
      let y = 0;
      for (let i = 0; i < tokens.length; ) {
        const command = tokens[i++];
        const next = () => Number(tokens[i++]);
        if (command === 'M') [x, y] = [next(), next()];
        else if (command === 'H') x = next();
        else if (command === 'V') y = next();
        else if (command === 'A') {
          radii.push(next(), next());
          i += 3; // rotation large-arc sweep
          [x, y] = [next(), next()];
        } else continue;
        xs.push(x);
        ys.push(y);
      }
      return {
        x0: Math.min(...xs),
        y0: Math.min(...ys),
        x1: Math.max(...xs),
        y1: Math.max(...ys),
        radii
      };
    });

const shifted = (box: Box, dy: number): Box => ({ ...box, y0: box.y0 + dy, y1: box.y1 + dy });

/** Equal to the generator's three printed decimals. */
const expectBox = (actual: Box | undefined, expected: Box) => {
  for (const edge of ['x0', 'y0', 'x1', 'y1'] as const) {
    expect(actual?.[edge]).toBeCloseTo(expected[edge], 3);
  }
};

describe('the shipped icon is the approved Tessera drawing (Story 20.6)', () => {
  const reference = read('docs/design/cardi/logo-concepts/final/cardi-icon.svg');
  const generated = read('assets/images/cardi-icon.svg');

  const referenceRects = reference.match(/<rect [^>]*\/>/g) ?? [];
  const referenceStem = referenceRects.find((tag) => fillOf(tag) === IDENTITY_COLORS.cream) ?? '';
  const referenceCard = referenceRects.find((tag) => fillOf(tag) === IDENTITY_COLORS.beam) ?? '';
  const referenceBars = referenceRects.filter((tag) => /rx="3"/.test(tag));

  const generatedStem = /<rect x[^>]*\/>/.exec(generated)?.[0] ?? '';
  const generatedGroup = /<g transform="[^"]*">/.exec(generated)?.[0] ?? '';
  const generatedPath = /<path [^>]*\/>/.exec(generated)?.[0] ?? '';
  const [generatedCard, ...generatedBars] = subpathBoxes(
    /\sd="([^"]+)"/.exec(generatedPath)?.[1] ?? ''
  );

  // The one allowed difference, read off the stem and then required of every other shape.
  const dy = rectBox(generatedStem).y0 - rectBox(referenceStem).y0;

  it('moves the drawing only by the centring of its box', () => {
    expect(dy).toBeCloseTo(17.851, 3);
    expectBox(rectBox(generatedStem), shifted(rectBox(referenceStem), dy));
    expect(attr(generatedStem, 'rx')).toBe(attr(referenceStem, 'rx'));
  });

  it('turns the card by the same angle about the same centre', () => {
    const [angle, px, py] = rotateOf(referenceCard);
    const [gAngle, gx, gy] = rotateOf(generatedGroup);
    expect(gAngle).toBe(angle);
    expect(gx).toBeCloseTo(px ?? NaN, 3);
    expect(gy).toBeCloseTo((py ?? NaN) + dy, 3);
  });

  it('draws the same card and the same five bars, cut through it', () => {
    expect(generatedPath).toContain('fill-rule="evenodd"');
    expectBox(generatedCard, shifted(rectBox(referenceCard), dy));
    expect(referenceBars).toHaveLength(5);
    expect(generatedBars).toHaveLength(5);
    referenceBars.forEach((tag, n) => expectBox(generatedBars[n], shifted(rectBox(tag), dy)));
  });

  it('rounds the card and each bar with the reference corner radius', () => {
    // Four quarter arcs, each with an rx and an ry equal to the reference rect's rx.
    const corners = (tag: string) => new Array<number>(8).fill(attr(tag, 'rx'));
    expect(generatedCard?.radii).toEqual(corners(referenceCard));
    referenceBars.forEach((tag, n) => expect(generatedBars[n]?.radii).toEqual(corners(tag)));
  });

  it('keeps the reference colours: an ink field, a cream stem, a beam card', () => {
    expect(fillOf(/<rect width[^>]*\/>/.exec(generated)?.[0] ?? '')).toBe(IDENTITY_COLORS.ink);
    expect(fillOf(generatedStem)).toBe(IDENTITY_COLORS.cream);
    expect(fillOf(generatedPath)).toBe(IDENTITY_COLORS.beam);
  });
});

import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { COLOR_TYPE_RGB, COLOR_TYPE_RGBA, decodeScanlines, readHeader } from './png-scanlines';
import { silhouette } from './silhouette';

/**
 * The Play Store artwork under `assets/store/` (Story 21.5).
 *
 * ⚠️ NOTHING ELSE CHECKS THESE FILES. They are uploaded to Play Console **by hand** — this
 * repository has no `fastlane/metadata/`, and every `skip_upload_images` / `skip_upload_screenshots`
 * flag is set in the Fastfile — so no build, no lane and no reviewer's diff ever renders them.
 * That is exactly how they came to sit three and a half months stale wearing the pre-rebrand blue
 * wallet, with the wordmark clipped by the artwork beside it.
 *
 * `yarn icons:check` now byte-compares them against the generator, which catches DRIFT. It cannot
 * catch the generator being wrong about Google's requirements, because it would defend whatever
 * the generator produces. This file is the other half: it asserts the published specification and
 * the brand's own rules against the committed bytes.
 *
 * The specification, quoted from Google's Play Console help and icon design pages:
 *
 *   app icon        512 x 512   "Format: 32-bit PNG"   "Max file size: 1024KB"
 *                   "Shape: Full square — Google Play dynamically handles masking."
 *                   "Shadow: None — Google Play dynamically handles shadows."
 *                   "pick a background colour … that doesn't include any transparency.
 *                    Transparent assets will display the background colour of Google Play UI."
 *   feature graphic 1024 x 500  "JPEG or 24-bit PNG (no alpha)"
 *   developer header 4096 x 2304, same formats.
 */

const ROOT = join(__dirname, '..');

const ICON = 'assets/store/android-app-icon-512x512.png';
const ICON_ALPHA = 'assets/store/android-app-icon-512x512-alpha.png';
const FEATURE = 'assets/store/android-store-banner-1024x500.png';
const HEADER = 'assets/store/google-developer-banner-4096x2304.png';
const SOURCE = 'assets/images/android-store-banner.svg';

const read = (relative: string): Buffer => readFileSync(join(ROOT, relative));

const INK = [0x18, 0x18, 0x24] as const;
const BEAM = [0xfc, 0xcc, 0x0c] as const;
const WHITE = [0xff, 0xff, 0xff] as const;

/** Every colour the banners are allowed to contain, as `rrggbb`. */
const PALETTE = new Set([
  '181824', // ink — the field, which also shows through the ì's card where its bars are cut
  'ffffff', // the wordmark's letters and stem
  'fccc0c', // beam — the ì's card
  'e42424', // card red
  '0c3c84', // card deep blue
  '0c84cc', // card azure
  '0c843c' // card green
]);

type Pixels = { width: number; height: number; channels: number; pixels: Buffer };

const at = ({ pixels, width, channels }: Pixels, x: number, y: number): number[] => {
  const i = (Math.round(y) * width + Math.round(x)) * channels;
  return [
    pixels[i] ?? 0,
    pixels[i + 1] ?? 0,
    pixels[i + 2] ?? 0,
    channels === 4 ? (pixels[i + 3] ?? 0) : 255
  ];
};

const hex = (rgb: number[]): string =>
  rgb
    .slice(0, 3)
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');

/**
 * Every `<rect>` in the committed SVG, in document order.
 *
 * Deliberately a regex rather than an XML parser: the file is this repo's own generated output in
 * a known shape, and a parser would hide a malformed attribute behind a helpful recovery.
 */
const svgRects = (svg: string) =>
  [...svg.matchAll(/<rect([^>]*)\/>/g)].map((match) => {
    const attr = (name: string): string | null =>
      (match[1] ?? '').match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? null;
    return {
      x: Number(attr('x') ?? 0),
      y: Number(attr('y') ?? 0),
      width: Number(attr('width')),
      height: Number(attr('height')),
      // `rx` is what separates a barcode bar (square, 0) from a card (rounded).
      r: Number(attr('rx') ?? 0),
      fill: (attr('fill') ?? '').replace('#', '').toLowerCase()
    };
  });

/**
 * The ì's card: the one even-odd `<path>`, inside the group that turns it. Its first subpath is the
 * card and every other subpath one of its bars, cut through it — the shape `brand-mark.mjs` defines
 * and the Lottie builder reads.
 */
const svgCard = (svg: string) => {
  const match = svg.match(
    /<g transform="rotate\((-?[\d.]+) [^"]*">\s*<path fill-rule="evenodd" d="([^"]*)" fill="([^"]*)"/
  );
  if (!match) throw new Error('No turned even-odd card path found in the banner SVG');
  return {
    angle: Number(match[1]),
    subpaths: (match[2] ?? '').split('M').filter((subpath) => subpath.trim() !== '').length,
    fill: (match[3] ?? '').replace('#', '').toLowerCase()
  };
};

describe('Play Store artwork', () => {
  const feature = decodeScanlines(read(FEATURE), FEATURE);
  const svg = read(SOURCE).toString('utf8');

  describe('the listing icon', () => {
    it('is 512 square, as Play specifies', () => {
      for (const relative of [ICON, ICON_ALPHA]) {
        const header = readHeader(read(relative));
        expect([relative, header.width, header.height]).toEqual([relative, 512, 512]);
      }
    });

    it('ships the 32-bit PNG Play asks for, and a 24-bit twin for everything else', () => {
      // The whole reason the pair exists. Google specifies "Format: 32-bit PNG", so `-alpha` is
      // the file to upload; the unsuffixed one is the universally-safe raster for any tool that
      // rejects an alpha channel. They are otherwise the same image.
      expect(readHeader(read(ICON)).colorType).toBe(COLOR_TYPE_RGB);
      expect(readHeader(read(ICON_ALPHA)).colorType).toBe(COLOR_TYPE_RGBA);
    });

    it('is FULLY OPAQUE despite carrying an alpha channel', () => {
      // ⚠️ The specific regression this exists to stop. The file this replaced was a transparent
      // export — the mark with its field removed — and that mark's stem was white, so Play would
      // have composited white bars onto its own white surface and shown an empty tile. The mark's
      // stem is cream now and its bars are holes, so a transparent upload would still lose the
      // stem and show Play's surface through the card. Google says it in as many words:
      // "Transparent assets will display the background colour of Google Play UI."
      const decoded = decodeScanlines(read(ICON_ALPHA), ICON_ALPHA);
      expect(decoded.channels).toBe(4);
      let transparent = 0;
      for (let i = 3; i < decoded.pixels.length; i += 4) {
        if ((decoded.pixels[i] ?? 0) !== 255) transparent += 1;
      }
      expect(transparent).toBe(0);
    });

    it('is full-bleed ink to the corners, with no rounding of its own', () => {
      // "Shape: Full square — Google Play dynamically handles masking. Radius will be equivalent
      // to 30% of icon size." An asset that pre-rounds its corners gets rounded twice.
      const decoded = decodeScanlines(read(ICON), ICON);
      const corners: [number, number][] = [
        [0, 0],
        [511, 0],
        [0, 511],
        [511, 511]
      ];
      for (const [x, y] of corners) {
        expect([x, y, at(decoded, x, y).slice(0, 3)]).toEqual([x, y, [...INK]]);
      }
    });

    it('stays well inside Play’s 1024 KB ceiling', () => {
      // "Max file size: 1024KB". Both are a couple of kilobytes of flat colour, so
      // the headroom is enormous — the value of the check is that it is stated at
      // all, since nothing else in the repo reads Google's limits.
      for (const relative of [ICON, ICON_ALPHA]) {
        expect([relative, statSync(join(ROOT, relative)).size < 1024 * 1024]).toEqual([
          relative,
          true
        ]);
      }
    });
  });

  describe('the banners', () => {
    it('are the exact frames Play specifies', () => {
      expect(readHeader(read(FEATURE))).toMatchObject({ width: 1024, height: 500 });
      expect(readHeader(read(HEADER))).toMatchObject({ width: 4096, height: 2304 });
    });

    it('carry NO alpha channel, which the banner slots require', () => {
      // "JPEG or 24-bit PNG (no alpha)" — for both. The file this replaced was RGBA, so it was
      // out of spec as well as out of date.
      expect(readHeader(read(FEATURE)).colorType).toBe(COLOR_TYPE_RGB);
      expect(readHeader(read(HEADER)).colorType).toBe(COLOR_TYPE_RGB);
    });

    it('left no superseded JPEG behind when the format changed', () => {
      expect(existsSync(join(ROOT, 'assets/store/google-developer-banner-4096x2304.jpg'))).toBe(
        false
      );
    });

    it('are FLAT — no gradient, and no colour from outside the system', () => {
      // Two of the Forbidden list in one measurement. A gradient field would put thousands of
      // distinct values on the canvas instead of seven; coral, salmon, terracotta and orange —
      // all four of which the previous artwork used — would appear as a value not in PALETTE.
      // Antialiased edge pixels are blends and are excluded by the 0.1 % floor.
      const counts = new Map<string, number>();
      for (let i = 0; i < feature.pixels.length; i += feature.channels) {
        const key = hex([
          feature.pixels[i] ?? 0,
          feature.pixels[i + 1] ?? 0,
          feature.pixels[i + 2] ?? 0
        ]);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      const total = feature.width * feature.height;
      const dominant = [...counts.entries()]
        .filter(([, count]) => count > total * 0.001)
        .map(([key]) => key);
      expect(dominant.length).toBeLessThanOrEqual(PALETTE.size);
      expect(dominant.filter((key) => !PALETTE.has(key))).toEqual([]);
    });
  });

  describe('the raster agrees with the SVG it was generated from', () => {
    // The pair the old files got wrong: `android-store-banner.svg` and its PNG drifted so far
    // apart that the raster showed a CLIPPED wordmark the source does not describe. Both now come
    // from one layout, and these probe the committed SVG's own numbers against committed pixels.

    it('names Cardì in its accessible label', () => {
      expect(svg).toMatch(/aria-label="Cardì[^"]*"/);
      expect(svg).not.toMatch(/myLoyaltyCards/);
    });

    it('asks for no font, because the wordmark is outlines', () => {
      // ⚠️ The source this replaced set `font-family="Avenir Next, SF Pro Display, Arial"`, so
      // whatever rendered it picked a typeface that is not the brand's.
      expect(svg).not.toMatch(/font-family/);
      expect(svg).not.toMatch(/<text/);
      // The four letters, placed by their own transforms, and the ì's card: five paths in all.
      expect(svg.match(/<path transform="translate\(/g) ?? []).toHaveLength(4);
      expect(svg.match(/<path /g) ?? []).toHaveLength(5);
    });

    it('uses no gradient and no filter, which the system forbids', () => {
      for (const forbidden of ['linearGradient', 'radialGradient', 'feDropShadow', '<filter']) {
        expect([forbidden, svg.includes(forbidden)]).toEqual([forbidden, false]);
      }
    });

    it('renders every card colour the SVG declares', () => {
      // Probed by COUNT rather than at each card's centre: the wallet is a fan, so
      // a back card's centre is behind the front one and sampling it would read
      // white. What must hold is that a colour the source declares actually
      // reaches the raster.
      const declared = [
        ...new Set([...svgRects(svg).map((rect) => rect.fill), svgCard(svg).fill])
      ].filter((fill) => fill !== '181824' && fill !== 'ffffff');
      expect(declared.sort()).toEqual(['0c3c84', '0c843c', 'e42424', 'fccc0c']);
      const counts = new Map<string, number>();
      for (let i = 0; i < feature.pixels.length; i += feature.channels) {
        const key = hex([
          feature.pixels[i] ?? 0,
          feature.pixels[i + 1] ?? 0,
          feature.pixels[i + 2] ?? 0
        ]);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      for (const fill of declared) {
        expect([fill, (counts.get(fill) ?? 0) > 200]).toEqual([fill, true]);
      }
    });

    it('lets NOTHING overlay the barcode, or crowd its quiet zone', () => {
      // ⛔ A Forbidden-list rule, tested in the pixels: "anything overlaying a
      // barcode, especially a drawn beam or scan-line".
      //
      // The region swept is the BARS' own bounding box grown by a quiet zone, not
      // the front card's rectangle — the card has 16px-scale rounded corners, so a
      // fanned card behind it legitimately shows through the corner cut-outs,
      // which are inside the rect and outside the card. Sweeping the rect failed
      // on exactly that and would have been a false alarm about a real rule.
      const bars = svgRects(svg).filter(
        (rect) => rect.fill === '181824' && rect.r === 0 && rect.height > 40 && rect.width < 40
      );
      expect(bars.length).toBeGreaterThan(10);
      const quiet = 16;
      const x0 = Math.min(...bars.map((b) => b.x)) - quiet;
      const x1 = Math.max(...bars.map((b) => b.x + b.width)) + quiet;
      const y0 = Math.min(...bars.map((b) => b.y)) - quiet;
      const y1 = Math.max(...bars.map((b) => b.y + b.height)) + quiet;
      const seen = new Set<string>();
      for (let y = Math.ceil(y0); y < y1; y += 1) {
        for (let x = Math.ceil(x0); x < x1; x += 1) seen.add(hex(at(feature, x, y)));
      }
      // Antialiased bar edges are ink-to-white blends, so only the two endpoints
      // are asserted PRESENT; what matters is that no accent or beam is.
      expect(seen.has('ffffff')).toBe(true);
      expect(seen.has('181824')).toBe(true);
      for (const banned of ['fccc0c', 'e42424', '0c3c84', '0c843c', '0c84cc']) {
        expect([banned, seen.has(banned)]).toEqual([banned, false]);
      }
    });

    it('paints the field ink where the SVG says the field is', () => {
      expect(at(feature, 8, 8).slice(0, 3)).toEqual([...INK]);
      expect(at(feature, 1015, 8).slice(0, 3)).toEqual([...INK]);
    });
  });

  describe('the accent is a GRAVE', () => {
    /**
     * ⛔ The brand's one spelling rule, checked in the PIXELS.
     *
     * `rotate(35)` descends left to right and spells Cardì; `rotate(-35)` rises and spells a
     * different word. Every exploration sheet in `docs/design/cardi/frames/` was drawn with the
     * negative angle for months while the prose said "grave", because prose cannot catch a sign.
     * Asserting the markup would only re-read the same number the generator wrote, so this
     * measures where the accent's ink actually IS: the ì's card is the banner's only beam.
     */
    const accentPixels = () => {
      const points: { x: number; y: number }[] = [];
      for (let y = 0; y < feature.height; y += 1) {
        for (let x = 0; x < feature.width; x += 1) {
          const [r, g, b] = at(feature, x, y) as [number, number, number, number];
          if (r === BEAM[0] && g === BEAM[1] && b === BEAM[2] && y < feature.height / 2) {
            points.push({ x, y });
          }
        }
      }
      return points;
    };

    it('puts the accent’s high end on the LEFT and its low end on the RIGHT', () => {
      const points = accentPixels();
      expect(points.length).toBeGreaterThan(100);
      const xs = points.map((p) => p.x);
      const middle = (Math.min(...xs) + Math.max(...xs)) / 2;
      const topOf = (half: (x: number) => boolean) =>
        Math.min(...points.filter((p) => half(p.x)).map((p) => p.y));
      // y grows downward, so "descends to the right" means the right half starts LOWER.
      expect(topOf((x) => x < middle)).toBeLessThan(topOf((x) => x >= middle));
    });

    it('states a POSITIVE rotation on the group that carries the ì’s card', () => {
      // Scoped to the card's own group. The wallet cards are fanned and one of them
      // legitimately carries `rotate(-5)` — the sign rule governs the ACCENT, where
      // a negative angle spells a different word, and a wallet card leaning either way
      // is just a card. A blanket "no negative rotation anywhere" would forbid the fan
      // and, worse, would pass for the wrong reason if the accent ever lost its group.
      expect(svgCard(svg).angle).toBeGreaterThan(0);
    });

    it('cuts the card’s five bars through it, rather than painting them', () => {
      // The card is one even-odd path: its own subpath and one per bar. Painted ink bars would be
      // a second colour on top of the accent; holes show the ink field through it instead.
      expect(svgCard(svg).subpaths).toBe(6);
    });

    it('draws the accent in beam and the letters in white, never the other way round', () => {
      // "Beam … always pair with ink text, never white" — and the letters are the structure, so
      // they take white on the ink field. A swap would still look like a wordmark.
      const stem = svgRects(svg).at(-1);
      expect(stem?.fill).toBe(hex([...WHITE]));
      expect(svgCard(svg).fill).toBe(hex([...BEAM]));
    });
  });

  describe('the ì’s card, in the raster (Story 20.6)', () => {
    // The card's pixels: the ì's card is the banner's only beam, and it sits in the upper half.
    const card = () => {
      const points: { x: number; y: number }[] = [];
      for (let y = 0; y < feature.height / 2; y += 1) {
        for (let x = 0; x < feature.width; x += 1) {
          if (hex(at(feature, x, y)) === hex([...BEAM])) points.push({ x, y });
        }
      }
      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);
      return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
    };

    /** The `d`'s right edge, in device pixels: its glyph's widest x, placed by its transform. */
    const dRightEdge = () => {
      const letter = [
        ...svg.matchAll(
          /<path transform="translate\(([\d.]+) [\d.]+\) scale\(([\d.]+)\)" d="([^"]*)"/g
        )
      ][3];
      const [, x = '0', scale = '1', d = ''] = letter ?? [];
      // Every x in the glyph: each pair after M, L or Q, and each H.
      const xs: number[] = [];
      for (const [, command, args] of d.matchAll(/([MLQHVZ])([^MLQHVZ]*)/g)) {
        const values = (args ?? '').trim().split(/\s+/).filter(Boolean).map(Number);
        if (command === 'H') xs.push(...values);
        else if (command !== 'V' && command !== 'Z')
          xs.push(...values.filter((_, i) => i % 2 === 0));
      }
      return Number(x) + Math.max(...xs) * Number(scale);
    };

    it('sits above the stem’s top and clear of the `d`', () => {
      const box = card();
      const stem = svgRects(svg).at(-1);
      expect(box.y1).toBeLessThan(stem?.y ?? 0);
      expect(box.x0).toBeGreaterThan(dRightEdge());
    });

    it('reads as one card with its five bars cut through it', () => {
      // A pixel is the card's when it is more beam than ink — red past half way, blue kept low so
      // the white stem and letters never count.
      const box = card();
      const side = Math.max(box.x1 - box.x0, box.y1 - box.y0) + 5;
      const left = Math.round((box.x0 + box.x1 - side) / 2);
      const top = Math.round((box.y0 + box.y1 - side) / 2);
      const shape = silhouette(side, (x, y) => {
        const [r = 0, , b = 0] = at(feature, left + x, top + y);
        return r > (INK[0] + BEAM[0]) / 2 && b < 100 ? 255 : 0;
      });
      expect(shape).toEqual({ pieces: 1, holes: 5 });
    });
  });
});

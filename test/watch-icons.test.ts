import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import {
  COLOR_TYPE_RGB,
  COLOR_TYPE_RGBA,
  decodeScanlines,
  readHeader,
  type Header
} from './png-scanlines';
import { silhouette } from './silhouette';
import { IDENTITY_COLORS } from '../shared/theme/tokens.generated';

/**
 * The watchOS icon artefacts, and the one property the phone's icons never have to
 * satisfy (Story 21.3).
 *
 * **watchOS masks every one of these to a CIRCLE.** The phone gets a squircle, which
 * trims corners; a circle trims everything outside the inscribed disc, so artwork that
 * is comfortably inside an iOS mask can still lose its ends on a watch — silently, and
 * reading as a badly-cropped drawing rather than as a bug. `yarn icons:check` compares
 * bytes and would not notice: it proves the artefacts match the GENERATOR, not that the
 * generator's geometry survives the mask. That is what this suite adds.
 *
 * ⚠️ **This deliberately lives in `test/` rather than `targets/watch/__tests__/`**, for
 * the same reason `app-display-name.test.ts` does: the watch contract tests are excluded
 * from `yarn test` (`jest.config.js` `testPathIgnorePatterns`) and run only in the
 * path-filtered `watchos-tests.yml`. Half of what is asserted here lives in `scripts/`
 * and `targets/watch-widget/`, so a PR that broke the geometry by editing only the
 * generator could miss that workflow entirely.
 */
const repoRoot = path.resolve(__dirname, '..');
const read = (relative: string): Buffer => fs.readFileSync(path.join(repoRoot, relative));
const readText = (relative: string): string =>
  fs.readFileSync(path.join(repoRoot, relative), 'utf8');

const WATCH_APP_ICON = 'targets/watch/AppIcon.png';
const WATCH_APPICONSET = 'targets/watch/Assets.xcassets/AppIcon.appiconset';
const WIDGET_APPICONSET = 'targets/watch-widget/Assets.xcassets/AppIcon.appiconset';
const OPEN_APP_ICON = 'targets/watch-widget/Assets.xcassets/OpenAppIcon.imageset';
const OPEN_APP_ICON_GLYPH = 'targets/watch-widget/Assets.xcassets/OpenAppIconGlyph.imageset';

/** Every artefact this story added, with the size it must be. */
const GENERATED: ReadonlyArray<readonly [string, number]> = [
  [WATCH_APP_ICON, 1024],
  [`${WIDGET_APPICONSET}/App-Icon-1024x1024@1x.png`, 1024],
  [`${OPEN_APP_ICON}/open-app-icon@1x.png`, 64],
  [`${OPEN_APP_ICON}/open-app-icon@2x.png`, 128],
  [`${OPEN_APP_ICON}/open-app-icon@3x.png`, 192]
];

/**
 * The complication's inline glyph (Story 23.4): the same mark, TRANSPARENT and framed on the mark's
 * own bounding box. `accessoryInline` draws its image as a template from the alpha channel, so it
 * must carry one, at `OpenAppIcon`'s sizes and under the same 76 px downsample.
 */
const GLYPH: ReadonlyArray<readonly [string, number]> = [
  [`${OPEN_APP_ICON_GLYPH}/open-app-icon-glyph@1x.png`, 64],
  [`${OPEN_APP_ICON_GLYPH}/open-app-icon-glyph@2x.png`, 128],
  [`${OPEN_APP_ICON_GLYPH}/open-app-icon-glyph@3x.png`, 192]
];

const header = (relative: string): Header => readHeader(read(relative));

/**
 * Indexed read with strict mode's `undefined` narrowed away.
 *
 * `noUncheckedIndexedAccess` widens every byte-array read to `number | undefined`, which
 * is right in general and noise here: each index below is derived from the decoded image's
 * own dimensions, so it is in bounds by construction.
 */
const at = (bytes: Uint8Array, index: number): number => bytes[index] ?? 0;

/**
 * The RGB view these artefacts need.
 *
 * They are OPAQUE marks on a flat ink field, so the question this suite asks is "which pixels
 * are not the field" and any alpha a source carried is not part of it. `decodeScanlines` does
 * the PNG work — including the filter-type-0 invariant, which is the encoder's guarantee rather
 * than this suite's.
 */
const decode = (relative: string): { size: number; rgb: Uint8Array } => {
  const { width: size, channels, pixels } = decodeScanlines(read(relative), relative);
  const rgb = new Uint8Array(size * size * 3);
  for (let i = 0; i < size * size; i += 1) {
    rgb[i * 3] = at(pixels, i * channels);
    rgb[i * 3 + 1] = at(pixels, i * channels + 1);
    rgb[i * 3 + 2] = at(pixels, i * channels + 2);
  }
  return { size, rgb };
};

const hex = (r: number, g: number, b: number): string =>
  `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();

/** `'#181824'` -> `[24, 24, 36]`. */
const rgbOf = (value: string): [number, number, number] => [
  Number.parseInt(value.slice(1, 3), 16),
  Number.parseInt(value.slice(3, 5), 16),
  Number.parseInt(value.slice(5, 7), 16)
];

/**
 * The farthest inked pixel from the centre, as a FRACTION of the inscribed circle's
 * radius. Anything above 1 is outside the mask and would be clipped by watchOS.
 *
 * "Inked" means "not the field colour". These artefacts are opaque marks on a flat ink
 * field, so the field is the background and everything else is artwork — including the
 * antialiased boundary, which is why the comparison is a tolerance rather than equality.
 */
const farthestInkedRadiusFraction = (relative: string): number => {
  const { size, rgb } = decode(relative);
  const centre = size / 2;
  const radius = size / 2;
  // Taken from the token rather than restated, so the field can never drift out from
  // under this measurement: if the identity ink changes, the generator and this both move.
  const [fieldR, fieldG, fieldB] = rgbOf(IDENTITY_COLORS.ink);
  let farthest = 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 3;
      const isField =
        Math.abs(at(rgb, i) - fieldR) <= 2 &&
        Math.abs(at(rgb, i + 1) - fieldG) <= 2 &&
        Math.abs(at(rgb, i + 2) - fieldB) <= 2;
      if (isField) continue;
      // Measure to the far corner of the pixel, so a mark grazing the mask counts as out.
      const dx = Math.abs(x + 0.5 - centre) + 0.5;
      const dy = Math.abs(y + 0.5 - centre) + 0.5;
      farthest = Math.max(farthest, Math.hypot(dx, dy));
    }
  }
  return farthest / radius;
};

describe('watchOS icon artefacts (Story 21.3)', () => {
  describe('the artefacts exist at the sizes the watch renders (AC1, AC3, AC5)', () => {
    it.each(GENERATED)('%s is a %ipx square', (relative, size) => {
      const png = header(relative);
      expect(png.width).toBe(size);
      expect(png.height).toBe(size);
      expect(png.depth).toBe(8);
    });

    it.each(GENERATED)('%s carries NO alpha channel', (relative) => {
      // The App Store rejects an app icon with an alpha channel. The complication clips its
      // artwork to a round disc itself, so the artwork's ink field is the disc, and a
      // transparent field would show the watch face through it. Both want colour type 2.
      expect(header(relative).colorType).toBe(COLOR_TYPE_RGB);
    });

    it('paints the field in the identity ink, not a literal that can drift', () => {
      const { rgb } = decode(WATCH_APP_ICON);
      // The top-left pixel is always field: the mark is centred and never reaches a corner.
      expect(hex(at(rgb, 0), at(rgb, 1), at(rgb, 2))).toBe(IDENTITY_COLORS.ink);
    });

    it('is the same mark the phone ships, because there is one geometry definition', () => {
      // Not a copy — both are rendered from the same constants by the same generator, at
      // the same size and on the same field, so identical bytes are the RESULT rather
      // than the method. The story's premise is that one glance at both devices must not
      // show two brands; this is that, asserted.
      const sha = (relative: string) => createHash('sha256').update(read(relative)).digest('hex');
      expect(sha(WATCH_APP_ICON)).toBe(sha('assets/icon.png'));
    });

    it('keeps the complication artwork under its 76px archiving budget', () => {
      // `ComplicationImage.swift` downsamples to maxPoint 38 x scale 2 = 76px because
      // WidgetKit measures the NATIVE pixel size and rejects anything over the
      // `accessoryCorner` budget with `imageTooLarge` — which renders the slot as a grey
      // placeholder. watchOS selects @2x, so 128 is the buffer downsampling starts from;
      // these sizes are the contract that keeps 76 reachable.
      expect(header(`${OPEN_APP_ICON}/open-app-icon@2x.png`).width).toBe(128);
      const swift = readText('targets/watch-widget/ComplicationImage.swift');
      expect(swift).toContain('maxPoint: CGFloat = 38');
      expect(swift).toContain('scale: CGFloat = 2');
    });
  });

  describe('the mark survives the CIRCULAR mask (AC8)', () => {
    // Containment is scale-invariant — the mask is always the inscribed circle of the
    // square — so proving it once per artefact proves it at every size the watch renders
    // it at, including the 76px complication and the home-screen thumbnail.
    it.each(GENERATED)('%s keeps every inked pixel inside the inscribed circle', (relative) => {
      expect(farthestInkedRadiusFraction(relative)).toBeLessThan(1);
    });

    it('leaves real margin rather than grazing the mask', () => {
      // Measured 0.722 of the radius for the Tessera mark (Story 20.6): its furthest drawn point,
      // the stem's foot, is 0.720 of it, and antialiasing adds the rest. That is BELOW the 0.780
      // the mark's bounding box implies (corner radius 399.46 of the canvas's 512), and the gap
      // is not an error in either number: the box is a rectangle whose corners the turned card
      // never reaches, so it is an upper bound on the mark rather than a measurement of one.
      //
      // A regression that merely GREW the mark would keep passing the containment check
      // above right up to the moment it clipped. This fails first, while there is still
      // something to discuss.
      expect(farthestInkedRadiusFraction(WATCH_APP_ICON)).toBeLessThan(0.85);
    });
  });

  describe('the inline glyph is the mark as a silhouette (Story 23.4)', () => {
    /** The inked box of an RGBA artefact: every pixel whose alpha is not zero. */
    const inkedBox = (relative: string) => {
      const { width: size, channels, pixels } = decodeScanlines(read(relative), relative);
      let x0 = size;
      let y0 = size;
      let x1 = -1;
      let y1 = -1;
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          if (at(pixels, (y * size + x) * channels + 3) === 0) continue;
          x0 = Math.min(x0, x);
          y0 = Math.min(y0, y);
          x1 = Math.max(x1, x);
          y1 = Math.max(y1, y);
        }
      }
      return { size, x0, y0, x1, y1 };
    };

    it.each(GLYPH)('%s is a %ipx square with an alpha channel', (relative, size) => {
      const png = header(relative);
      expect(png.width).toBe(size);
      expect(png.height).toBe(size);
      expect(png.colorType).toBe(COLOR_TYPE_RGBA);
    });

    it.each(GLYPH)('%s is not clipped by its tight frame', (relative) => {
      // Framed on the mark's own box with a 16-unit margin, so no inked pixel touches an edge.
      const { size, x0, y0, x1, y1 } = inkedBox(relative);
      expect(Math.min(x0, y0)).toBeGreaterThan(0);
      expect(Math.max(x1, y1)).toBeLessThan(size - 1);
    });

    it.each(GLYPH)('%s fills its height, which the padded icon canvas would shrink', (relative) => {
      // watchOS sizes the inline image to the line of text, so the mark's height is the glyph's.
      const { size, y0, y1 } = inkedBox(relative);
      expect((y1 - y0 + 1) / size).toBeGreaterThan(0.9);
    });

    it.each(GLYPH.slice(1))(
      '%s reads as a card with five bars cut through it, the stem apart',
      (relative) => {
        // Story 20.6. A template is drawn from the alpha alone, so the barcode survives only as
        // HOLES through the card: five enclosed alpha-zero regions, and the stem as a second piece
        // of ink. @1x is left out: at 64 px the bars are 1.5 to 3.4 px wide, so the transparent
        // pixels inside a turned bar break into separate runs and count as more than five holes.
        // watchOS picks @2x, which is what the 76 px downsample starts from.
        const { width: size, channels, pixels } = decodeScanlines(read(relative), relative);
        expect(silhouette(size, (x, y) => at(pixels, (y * size + x) * channels + 3))).toEqual({
          pieces: 2,
          holes: 5
        });
      }
    );

    it.each(GLYPH)('%s is listed in the generator', (relative) => {
      expect(readText('scripts/build-brand-icons.mjs')).toContain(`'${relative}'`);
    });
  });

  describe('the mark is a cream stem under a beam card (Story 20.6)', () => {
    /**
     * The geometry, from `cardi-mark.svg`: the same padded 1024 canvas as `icon.png` and the
     * watch icon, so its numbers are pixel positions there. The card is the first subpath of the
     * turned even-odd path; its box comes from the endpoints, which all lie on its edges.
     */
    const geometry = () => {
      const svg = readText('assets/images/cardi-mark.svg');
      const attr = (name: string) =>
        Number(svg.match(new RegExp(`<rect[^>]*\\s${name}="([\\d.]+)"`))?.[1]);
      const turn = svg.match(/rotate\(([\d.]+) ([\d.]+) ([\d.]+)\)/);
      const card = (svg.match(/ d="([^"]*)"/)?.[1] ?? '').split('Z')[0] ?? '';
      // M and A end on a point, V on a y; H moves along x only.
      const ys: number[] = [];
      for (const [, command, args] of card.matchAll(/([MHVA])([^MHVAZ]*)/g)) {
        const values = (args ?? '').trim().split(/\s+/).map(Number);
        if (command === 'V') ys.push(values[0] ?? NaN);
        else if (command !== 'H') ys.push(values[values.length - 1] ?? NaN);
      }
      return {
        stem: { x: attr('x'), y: attr('y'), w: attr('width'), h: attr('height') },
        angle: Number(turn?.[1]),
        pivot: { x: Number(turn?.[2]), y: Number(turn?.[3]) },
        card: { top: Math.min(...ys), bottom: Math.max(...ys) }
      };
    };

    it('fills the in-app mark’s stem cream and its card beam', () => {
      const svg = readText('assets/images/cardi-mark-inline.svg');
      expect(svg.match(/<rect [^>]*fill="([^"]+)"/)?.[1]).toBe(IDENTITY_COLORS.cream);
      expect(svg.match(/<path fill-rule="evenodd" [^>]*fill="([^"]+)"/)?.[1]).toBe(
        IDENTITY_COLORS.beam
      );
    });

    it('paints cream at the stem’s centre and beam in the card’s plain band, in the app icon', () => {
      const { size, rgb } = decode('assets/icon.png');
      const sample = (x: number, y: number) => {
        const i = (Math.round(y) * size + Math.round(x)) * 3;
        return hex(at(rgb, i), at(rgb, i + 1), at(rgb, i + 2));
      };
      const { stem, angle, pivot, card } = geometry();
      expect(sample(stem.x + stem.w / 2, stem.y + stem.h / 2)).toBe(IDENTITY_COLORS.cream);

      // Half way down the band above the bars (62 of the card's 166), on the card's centre line,
      // turned with the card about its centre.
      const height = card.bottom - card.top;
      const down = -height / 2 + (height * 31) / 166;
      const a = (angle * Math.PI) / 180;
      expect(sample(pivot.x - down * Math.sin(a), pivot.y + down * Math.cos(a))).toBe(
        IDENTITY_COLORS.beam
      );
    });
  });

  describe('only the chosen mark ships (Story 23.4, decision 1)', () => {
    it('keeps the full mark and its glyph as the widget’s only mark imagesets', () => {
      // ifero picked the full mark over the one-bar reduction (2026-10-29). The reduction was
      // rendered for the comparison alone; its imagesets and generator entries left with the pick.
      const sets = fs
        .readdirSync(path.join(repoRoot, 'targets/watch-widget/Assets.xcassets'))
        .filter((name) => name.startsWith('OpenAppIcon'))
        .sort();
      expect(sets).toEqual(['OpenAppIcon.imageset', 'OpenAppIconGlyph.imageset']);
      expect(readText('scripts/build-brand-icons.mjs')).not.toMatch(/ONE_BAR|OneBar|one-bar/);
    });

    it.each<readonly [string, ReadonlyArray<readonly [string, number]>]>([
      [OPEN_APP_ICON, GENERATED.filter(([relative]) => relative.startsWith(`${OPEN_APP_ICON}/`))],
      [OPEN_APP_ICON_GLYPH, GLYPH]
    ])('%s/Contents.json names exactly the generated PNGs, at 1x, 2x and 3x', (set, table) => {
      // `actool` passes a mistyped filename with a warning only, and the slot then has no image.
      const { images } = JSON.parse(readText(`${set}/Contents.json`)) as {
        images: ReadonlyArray<{ filename: string; scale: string }>;
      };
      expect(images.map(({ filename, scale }) => ({ filename, scale }))).toEqual(
        table.map(([relative], index) => ({
          filename: path.basename(relative),
          scale: `${index + 1}x`
        }))
      );
    });
  });

  describe('the asset catalogues declare watchOS, not iOS (AC2, AC4)', () => {
    it('the watch appiconset is the single-size watchOS form', () => {
      const contents = JSON.parse(readText(`${WATCH_APPICONSET}/Contents.json`));
      expect(contents.images).toEqual([
        {
          filename: 'App-Icon-1024x1024@1x.png',
          idiom: 'universal',
          size: '1024x1024',
          platform: 'watchos'
        }
      ]);
    });

    it('the watch appiconset keeps prebuild’s byte form, with NO trailing newline', () => {
      // `@bacons/apple-targets` writes this file itself via `JSON.stringify(…, null, 2)`,
      // which emits no trailing newline, and it is `.prettierignore`d precisely so the
      // two tools cannot fight over that one byte. If this fails, something re-formatted
      // a file prebuild owns and `yarn watch:prebuild` will report it modified forever.
      // Asserted on the tail itself rather than on a boolean, so a failure prints what the
      // file actually ends with instead of "expected true, received false".
      expect(readText(`${WATCH_APPICONSET}/Contents.json`).slice(-3)).toBe('}\n}');
    });

    it('the prebuild-written appiconset PNG is a 1024 square with no alpha', () => {
      // The file `expo prebuild` derives from `targets/watch/AppIcon.png`, and the one that
      // actually SHIPS — yet it is the one artefact here that no other gate covers.
      // `icons:check` cannot: prebuild owns this copy, so it is not in the generator's list.
      //
      // ⚠️ Deliberately a HEADER check and not one of the pixel assertions above. Prebuild
      // re-encodes rather than copying — `@expo/image-utils` dispatches to sharp when it can
      // resolve it and to `jimp-compact` otherwise (this repo has neither installed at the top
      // level, so it is jimp today) — and its output uses ADAPTIVE scanline filtering where the
      // generator writes filter 0 throughout. `decode()` throws on any filter but 0, so reusing
      // it here would fail for a decoder reason while looking like a broken icon. The IHDR is
      // filter-agnostic, so this holds whichever backend runs.
      const png = header(`${WATCH_APPICONSET}/App-Icon-1024x1024@1x.png`);
      expect(png.width).toBe(1024);
      expect(png.height).toBe(1024);
      expect(png.depth).toBe(8);
      expect(png.colorType).toBe(COLOR_TYPE_RGB);
    });

    it('the widget appiconset declares the watchOS idiom and no iOS idioms', () => {
      // It arrived as the `@bacons/apple-targets` scaffold default: a flat #80FF80
      // placeholder across fifteen PNGs declaring iphone / ipad / ios-marketing, inside a
      // watchOS extension. `icon:` is NOT the fix — `withIosIcon` emits the watchOS
      // single-size form only for `type: 'watch'`, so setting it on a `watch-widget`
      // target reproduces the same iOS idioms in Cardì colours.
      const contents = JSON.parse(readText(`${WIDGET_APPICONSET}/Contents.json`));
      expect(contents.images).toHaveLength(1);
      expect(contents.images[0]).toMatchObject({ idiom: 'universal', platform: 'watchos' });
      const idioms = contents.images.map((image: { idiom: string }) => image.idiom);
      expect(idioms).not.toContain('iphone');
      expect(idioms).not.toContain('ipad');
      expect(idioms).not.toContain('ios-marketing');
    });

    it('leaves no orphaned iOS-sized PNG behind in the widget appiconset', () => {
      // Deleting the entries without deleting the files would leave sixteen unreferenced
      // placeholders in the repo that nothing renders and nothing checks.
      expect(fs.readdirSync(path.join(repoRoot, WIDGET_APPICONSET)).sort()).toEqual([
        'App-Icon-1024x1024@1x.png',
        'Contents.json'
      ]);
    });
  });

  describe('prebuild is wired to the generator, and only where it should be (AC1, AC2, AC7)', () => {
    /**
     * The target config as `expo prebuild` sees it — EVALUATED, not read as text.
     *
     * A first draft matched the source with its comments regex-stripped, and that was wrong in a
     * way worth recording: a `//` sequence inside a string on the same physical line as a real
     * `icon:` key would have hidden that key from the absence assertion below, so the test would
     * have passed at precisely the moment it mattered. Evaluating the module removes the class of
     * hole rather than narrowing it, and it is the more faithful assertion anyway — `withIosIcon`
     * fires on a TRUTHY `props.icon`, not on the presence of those characters.
     *
     * `jest.requireActual` rather than a bare `require`: these are CommonJS modules outside the
     * TypeScript project, and `@typescript-eslint/no-require-imports` forbids the latter here.
     */
    const targetConfig = (relative: string): { icon?: unknown; type?: unknown } =>
      jest.requireActual(path.join(repoRoot, relative));

    it('points the watch target at the file the generator writes', () => {
      // The seam between AC1 and AC2: that file is the generator's output, and `icon:` is what
      // makes prebuild copy it into the appiconset. Repoint it and both ACs stop being true
      // together, quietly — `yarn icons:check` would still pass, because it only checks that
      // `targets/watch/AppIcon.png` matches its OWN recipe, never that anything reads it.
      const config = targetConfig('targets/watch/expo-target.config.js');
      expect(config.type).toBe('watch');
      expect(config.icon).toBe('./AppIcon.png');
      expect(WATCH_APP_ICON).toBe('targets/watch/AppIcon.png');
    });

    it('gives the widget target NO icon, which is the AC7 spike pinned', () => {
      // ⛔ The watch target has this key and the widget deliberately does not, so the asymmetry
      // reads as an oversight and invites a "fix". It is not one: `withIosIcon` branches on
      // `type === "watch"` alone, so setting it here regenerates fifteen
      // iphone/ipad/ios-marketing PNGs inside a watchOS extension — the placeholder set this
      // story deleted, differing only in being Cardi-coloured instead of green, which makes the
      // regression HARDER to notice rather than easier. Nothing else would catch it: the
      // appiconset changes only on the next `yarn watch:prebuild`.
      const config = targetConfig('targets/watch-widget/expo-target.config.js');
      expect(config.type).toBe('watch-widget');
      expect(config.icon).toBeUndefined();
    });
  });

  describe('the artefacts are under `yarn icons:check` (AC9)', () => {
    const generator = readText('scripts/build-brand-icons.mjs');

    it.each(GENERATED)('%s is listed in the generator', (relative) => {
      // Being generated is not the same as being CHECKED. Every path in the generator's
      // output list is hashed against a freshly rendered buffer by `icons:check`, which
      // the pre-push hook and `ci-quality-gates.yml` both run — so membership of that
      // list is what stops these drifting from the phone's icons.
      expect(generator).toContain(`'${relative}'`);
    });
  });
});

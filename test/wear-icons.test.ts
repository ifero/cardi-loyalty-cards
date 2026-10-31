import fs from 'node:fs';
import path from 'node:path';

import { COLOR_TYPE_RGBA, decodeScanlines, readHeader, type Header } from './png-scanlines';
import { silhouette } from './silhouette';
import { IDENTITY_COLORS } from '../shared/theme/tokens.generated';

/**
 * The Wear OS launcher icon (Story 21.4).
 *
 * **This suite exists because a COMMENT was the only thing holding the invariant.**
 * `colors.xml` declared an opaque white launcher background under a comment saying it
 * matched `app.json`'s `adaptiveIcon.backgroundColor`. The rebrand changed that value to
 * ink and nothing noticed, because nothing could: `watch-android` is a standalone Gradle
 * project that deliberately cannot read the JS app's assets, so the two sides were kept in
 * step by hand. Every assertion below is one of those hand-kept claims, moved somewhere
 * that can fail.
 *
 * ⚠️ **It lives in `test/` rather than under `watch-android/`, deliberately** — the same
 * call `watch-icons.test.ts` makes for the watchOS side. `wear-os-build.yml` is path-filtered
 * to `watch-android/**`, so a PR that broke these by editing only `scripts/build-brand-icons.mjs`
 * would never run it. `ci-quality-gates.yml` is not filtered, and neither is the pre-push hook.
 */
const repoRoot = path.resolve(__dirname, '..');
const read = (relative: string): Buffer => fs.readFileSync(path.join(repoRoot, relative));
const readText = (relative: string): string =>
  fs.readFileSync(path.join(repoRoot, relative), 'utf8');

/**
 * ⚠️ The PNGs below have TWO gates and `colors.xml` has ONE.
 *
 * Every artefact in the generator's list is hashed against a freshly rendered buffer by
 * `yarn icons:check` AND measured here. `colors.xml` is hand-authored — the generator writes no
 * XML — so this suite is the only thing standing between it and the exact bug this story fixes: a
 * colour that silently stops matching the phone's. Weaken the AC2 assertions below and nothing
 * else notices.
 */
const RES = 'watch-android/app/src/main/res';
const MIPMAP_XML = `${RES}/mipmap-anydpi-v26/ic_launcher.xml`;
const COLORS_XML = `${RES}/values/colors.xml`;
const MANIFEST = 'watch-android/app/src/main/AndroidManifest.xml';
const PHONE_FOREGROUND = 'assets/adaptive-icon.png';
const PHONE_MONOCHROME = 'assets/adaptive-icon-monochrome.png';

/**
 * The density buckets, with their pixel sizes written out rather than derived.
 *
 * The generator computes these as `108 × the density multiplier`, because an adaptive-icon
 * layer is 108dp square. Repeating that arithmetic here would produce a check that agrees
 * with the generator by construction and therefore cannot catch a wrong multiplier — so
 * these are the four numbers from Android's own density table, stated independently.
 */
const DENSITIES: ReadonlyArray<readonly [string, number]> = [
  ['hdpi', 162],
  ['xhdpi', 216],
  ['xxhdpi', 324],
  ['xxxhdpi', 432]
];

/** Every artefact the generator writes into `watch-android/`, with the size it must be. */
const GENERATED: ReadonlyArray<readonly [string, number]> = DENSITIES.flatMap(
  ([bucket, size]) =>
    [
      [`${RES}/mipmap-${bucket}/ic_launcher_foreground.png`, size],
      [`${RES}/mipmap-${bucket}/ic_launcher_monochrome.png`, size]
    ] as const
);

/**
 * An adaptive-icon layer is 108dp square. Of that, the inner **72dp** appears within the
 * masked viewport (`AdaptiveIconDrawable`), and the logo itself is asked to stay within the
 * inner **66dp** so it survives every mask shape the launcher may apply — on Wear OS that
 * shape is a CIRCLE, which trims everything outside the inscribed disc rather than just the
 * corners a squircle takes.
 */
const LAYER_DP = 108;
const MASKED_VIEWPORT_DP = 72;
const MAX_LOGO_DP = 66;

const header = (relative: string): Header => readHeader(read(relative));

/**
 * Indexed read with strict mode's `undefined` narrowed away. `noUncheckedIndexedAccess`
 * widens every byte-array read to `number | undefined`; each index below is derived from the
 * decoded image's own dimensions, so it is in bounds by construction.
 */
const at = (bytes: Uint8Array, index: number): number => bytes[index] ?? 0;

/**
 * The RGBA view these artefacts need.
 *
 * Both layers are TRANSPARENT marks on a field the system paints, so alpha is the entire signal
 * and the RGB-only view `watch-icons.test.ts` builds would report a black rectangle here. An
 * opaque source is widened to alpha 255 so the two colour types stay comparable; in practice
 * every artefact this suite reads is already RGBA, and a regression to RGB fails the header
 * assertions before it reaches this.
 */
const decode = (relative: string): { size: number; rgba: Uint8Array } => {
  const { width: size, channels, pixels } = decodeScanlines(read(relative), relative);
  const rgba = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i += 1) {
    rgba[i * 4] = at(pixels, i * channels);
    rgba[i * 4 + 1] = at(pixels, i * channels + 1);
    rgba[i * 4 + 2] = at(pixels, i * channels + 2);
    rgba[i * 4 + 3] = channels === 4 ? at(pixels, i * channels + 3) : 255;
  }
  return { size, rgba };
};

/** Where the artwork actually is: the inked bounding box, and its farthest point from centre. */
type Extent = {
  /** Farthest inked pixel from the centre, in dp of the 108dp layer. */
  radiusDp: number;
  /** Inked bounding box as fractions of the layer, so densities compare directly. */
  box: { x0: number; x1: number; y0: number; y1: number };
};

const extentOf = (relative: string): Extent => {
  const { size, rgba } = decode(relative);
  const centre = size / 2;
  const dpPerPixel = LAYER_DP / size;
  let farthest = 0;
  let minX = size;
  let maxX = 0;
  let minY = size;
  let maxY = 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      // "Inked" is any non-zero alpha, which includes the antialiased boundary — the
      // conservative reading, since the launcher composites those pixels too.
      if (at(rgba, (y * size + x) * 4 + 3) === 0) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      // Measure to the far corner of the pixel, so a mark grazing the mask counts as out.
      const dx = Math.abs(x + 0.5 - centre) + 0.5;
      const dy = Math.abs(y + 0.5 - centre) + 0.5;
      farthest = Math.max(farthest, Math.hypot(dx, dy));
    }
  }
  return {
    radiusDp: farthest * dpPerPixel,
    box: { x0: minX / size, x1: (maxX + 1) / size, y0: minY / size, y1: (maxY + 1) / size }
  };
};

describe('Wear OS launcher icon (Story 21.4)', () => {
  describe('the artefacts are generated at every density (AC1)', () => {
    it.each(GENERATED)('%s is a %ipx square', (relative, size) => {
      const png = header(relative);
      expect(png.width).toBe(size);
      expect(png.height).toBe(size);
      expect(png.depth).toBe(8);
    });

    it.each(GENERATED)('%s keeps its alpha channel', (relative) => {
      // Both layers are marks on a field somebody ELSE paints: the foreground sits on
      // `@color/ic_launcher_background`, and the monochrome layer replaces both other layers
      // and sits on whatever the theme supplies. Flattening either to RGB would paint a black
      // square across the whole 108dp layer.
      expect(header(relative).colorType).toBe(COLOR_TYPE_RGBA);
    });

    it('draws the same mark at the same scale as the phone, at every density', () => {
      // The story's premise, asserted: one glance at a phone and a watch must not show two
      // brands. `watch-icons.test.ts` could prove this by hash because its artefact and the
      // phone's are the same size; these are four smaller renders of the same geometry, so
      // the comparable quantity is WHERE the ink lands as a fraction of the layer.
      //
      // Tolerance is 2px at the coarsest density (2/162), which is what analytic antialiasing
      // costs at the boundary. A wrong scale — `...FULL` where `...ANDROID` was meant, a
      // one-token slip — moves the box by ~13% and fails this by an order of magnitude.
      const tolerance = 2 / 162;
      const phone = extentOf(PHONE_FOREGROUND).box;
      for (const [bucket] of DENSITIES) {
        const wear = extentOf(`${RES}/mipmap-${bucket}/ic_launcher_foreground.png`).box;
        for (const edge of ['x0', 'x1', 'y0', 'y1'] as const) {
          expect(Math.abs(wear[edge] - phone[edge])).toBeLessThan(tolerance);
        }
      }
    });
  });

  describe('the mark survives the CIRCULAR launcher mask (AC5)', () => {
    // Containment is scale-invariant — the mask is always the inscribed circle of the layer —
    // so proving it per artefact proves it at every size the launcher renders, including the
    // smallest slot on a 384px round device.
    it.each(GENERATED)('%s stays inside the %ipx layer’s masked viewport', (relative) => {
      expect(extentOf(relative).radiusDp).toBeLessThan(MASKED_VIEWPORT_DP / 2);
    });

    it.each(GENERATED)('%s also honours the 66dp maximum logo size', (relative) => {
      // The stricter of the two rules, and the one that matters on a watch: the 72dp viewport
      // is what a circular mask CLIPS at, while 66dp is what Android asks the logo to stay
      // within so it survives masking plus the parallax and pulse effects a launcher may add.
      // Measured worst case is 64.68dp of ink at hdpi, where one pixel of antialiasing buys
      // the most dp — inside, with the least room of the four. The generator derives
      // `ANDROID_SCALE` from the drawn mark against 66dp less one mdpi pixel, 1dp, so the mark is
      // as large as this rule allows rather than shrunk by a guess. That margin is set by the
      // phone's mdpi mipmaps, which Expo's prebuild resizes and `android-phone-icons.test.ts`
      // measures; Wear starts at hdpi, so here it leaves room to spare.
      expect(extentOf(relative).radiusDp).toBeLessThan(MAX_LOGO_DP / 2);
    });
  });

  describe('the background colour is the phone’s, and now provably (AC2)', () => {
    const declaredBackground = (): string => {
      const match = /<color name="ic_launcher_background">(#[0-9A-Fa-f]{6,8})<\/color>/.exec(
        readText(COLORS_XML)
      );
      if (!match?.[1]) throw new Error(`${COLORS_XML}: no ic_launcher_background colour found`);
      return match[1].toUpperCase();
    };

    it('is opaque Cardì ink', () => {
      // Taken from the generated token rather than restated, so the identity cannot drift out
      // from under this: if the ink moves, the token moves and this fails.
      expect(declaredBackground()).toBe(`#FF${IDENTITY_COLORS.ink.slice(1).toUpperCase()}`);
    });

    it('is the same value the phone paints behind ITS adaptive icon', () => {
      // The claim the old comment made and nothing checked. `#FFRRGGBB` and `#RRGGBB` are the
      // same colour written two ways — Android defaults the alpha to opaque — so the
      // comparison is on the RGB, not on the literal.
      const appJson = JSON.parse(readText('app.json'));
      const phone: string = appJson.expo.android.adaptiveIcon.backgroundColor;
      expect(phone.toUpperCase()).toBe(IDENTITY_COLORS.ink.toUpperCase());
      expect(declaredBackground().slice(3)).toBe(phone.slice(1).toUpperCase());
    });
  });

  describe('the adaptive icon declares all three layers (AC3, AC4)', () => {
    /**
     * The declaration, with XML comments stripped first — and that is load-bearing rather than
     * tidiness, exactly as it is in `docs-brand-badge.test.ts`. This file carries a long comment
     * ABOUT the `<monochrome>` layer, and commenting a layer OUT is valid XML and a plausible
     * leftover from a "disable it for a second and see what lint says" edit. Matching the raw text
     * would accept both, and nothing else in CI would notice: no workflow runs Android lint.
     */
    const layers = (): string => readText(MIPMAP_XML).replace(/<!--[\s\S]*?-->/g, '');

    it('points background, foreground and monochrome at the right resources', () => {
      expect(layers()).toContain('<background android:drawable="@color/ic_launcher_background" />');
      expect(layers()).toContain(
        '<foreground android:drawable="@mipmap/ic_launcher_foreground" />'
      );
      expect(layers()).toContain(
        '<monochrome android:drawable="@mipmap/ic_launcher_monochrome" />'
      );
    });

    it('is the icon the manifest actually declares', () => {
      // The seam that makes any of the above reach a device. `android:roundIcon` is deliberately
      // absent: minSdk is 30, so the v26-qualified adaptive icon always matches and the launcher
      // applies its own mask — a round variant would be a second artwork to keep in step.
      const manifest = readText(MANIFEST);
      expect(manifest).toContain('android:icon="@mipmap/ic_launcher"');
      expect(manifest).not.toContain('android:roundIcon');
    });

    it('gives the monochrome layer ONE colour, which is what makes it monochrome', () => {
      // `AdaptiveIconDrawable.getMonochrome()` only promises that callers CAN tint this layer.
      // A launcher that draws it untinted gets whatever colour is in the file — so the layer
      // has to be a silhouette on its own terms, not merely a tint target.
      const { size, rgba } = decode(`${RES}/mipmap-xxxhdpi/ic_launcher_monochrome.png`);
      const hues = new Set<string>();
      for (let i = 0; i < size * size; i += 1) {
        // Skip the antialiased edge: partial coverage is composited against a transparent
        // black backdrop, so its RGB is legitimately darker without being a second colour.
        if (at(rgba, i * 4 + 3) < 255) continue;
        hues.add(`${at(rgba, i * 4)},${at(rgba, i * 4 + 1)},${at(rgba, i * 4 + 2)}`);
      }
      expect([...hues]).toEqual(['255,255,255']);
    });

    /** The opaque colours of a layer, and the shape its alpha draws above `clearUpTo`. */
    const coloursAndSilhouette = (relative: string, clearUpTo = 0) => {
      const { size, rgba } = decode(relative);
      const hues = new Set<string>();
      for (let i = 0; i < size * size; i += 1) {
        if (at(rgba, i * 4 + 3) < 255) continue;
        hues.add(`${at(rgba, i * 4)},${at(rgba, i * 4 + 1)},${at(rgba, i * 4 + 2)}`);
      }
      return {
        hues: [...hues],
        shape: silhouette(size, (x, y) => {
          const alpha = at(rgba, (y * size + x) * 4 + 3);
          return alpha > clearUpTo ? alpha : 0;
        })
      };
    };

    it.each([
      PHONE_MONOCHROME,
      ...DENSITIES.filter(([bucket]) => bucket !== 'hdpi').map(
        ([bucket]) => `${RES}/mipmap-${bucket}/ic_launcher_monochrome.png`
      )
    ])('%s is one colour, with the five bars cut through the card as holes', (relative) => {
      // Story 20.6. With one colour there is no ink left to paint bars in, so the barcode survives
      // only as HOLES: five alpha-zero regions enclosed by the card. The stem stands apart from the
      // card, so the ink is exactly two pieces. Painted bars would leave one solid card here, which
      // this would read as zero holes.
      const { hues, shape } = coloursAndSilhouette(relative);
      expect(hues).toEqual(['255,255,255']);
      expect(shape).toEqual({ pieces: 2, holes: 5 });
    });

    it(`${RES}/mipmap-hdpi/ic_launcher_monochrome.png is one colour, with five bar holes once alpha 1 counts as clear`, () => {
      // hdpi is the one density where the raster does not resolve the barcode into exactly five
      // holes. At 162 px and ×0.823 the narrowest bar is a slot 2.3 px wide at 35°, and one pixel
      // inside it carries an alpha of 1 (0.4%), which splits that slot in two. ifero accepted that
      // pixel on 2026-10-31 (Story 20.6, Review Triage Log #35): nobody can see it, and the glyph's
      // @1x is left out of `watch-icons.test.ts` for the same reason. Read with alpha 1 as clear,
      // the layer is still exactly the matrix's shape, so a slot painted shut or split by visible
      // ink fails here.
      const { hues, shape } = coloursAndSilhouette(
        `${RES}/mipmap-hdpi/ic_launcher_monochrome.png`,
        1
      );
      expect(hues).toEqual(['255,255,255']);
      expect(shape).toEqual({ pieces: 2, holes: 5 });
    });

    it.each([
      PHONE_FOREGROUND,
      ...DENSITIES.map(([bucket]) => `${RES}/mipmap-${bucket}/ic_launcher_foreground.png`)
    ])('%s paints a cream stem and a beam card, and nothing else', (relative) => {
      // Story 20.6. Where the foreground is opaque it is one of the mark's two colours; the
      // antialiased edges are partly transparent and the bars are holes, so neither shows up here.
      const { size, rgba } = decode(relative);
      const colours = new Set<string>();
      for (let i = 0; i < size * size; i += 1) {
        if (at(rgba, i * 4 + 3) < 255) continue;
        const hexOf = (offset: number) =>
          at(rgba, i * 4 + offset)
            .toString(16)
            .padStart(2, '0');
        colours.add(`#${hexOf(0)}${hexOf(1)}${hexOf(2)}`.toUpperCase());
      }
      expect([...colours].sort()).toEqual(
        [IDENTITY_COLORS.cream, IDENTITY_COLORS.beam].map((c) => c.toUpperCase()).sort()
      );
    });

    it.each(DENSITIES)(
      'is a separate asset from the %s foreground for a reason visible in the bytes',
      (bucket) => {
        // Why `<monochrome>` does not simply point at `@mipmap/ic_launcher_foreground`: the two
        // files have IDENTICAL alpha and differ only in RGB, so a launcher that tints by alpha
        // renders them the same and the separate asset costs nothing. A launcher that does NOT
        // tint renders the foreground's card in beam yellow and its stem in cream — two colours,
        // and therefore not a monochrome icon. This pins both halves of that argument.
        //
        // Counted rather than compared with `toEqual`: these are up to 186k pixels, so a Jest
        // diff over them is both slow and unreadable, while "how many bytes disagree" is a
        // number you can act on.
        const foreground = decode(`${RES}/mipmap-${bucket}/ic_launcher_foreground.png`);
        const monochrome = decode(`${RES}/mipmap-${bucket}/ic_launcher_monochrome.png`);
        const disagreements = (channel: 0 | 1 | 2 | 3): number => {
          let count = 0;
          for (let i = channel; i < foreground.rgba.length; i += 4) {
            if (at(foreground.rgba, i) !== at(monochrome.rgba, i)) count += 1;
          }
          return count;
        };
        expect(disagreements(3)).toBe(0);
        expect(disagreements(0) + disagreements(1) + disagreements(2)).toBeGreaterThan(0);
      }
    );
  });

  describe('nothing else is hiding in the density buckets (AC1, AC7)', () => {
    it.each(DENSITIES)('mipmap-%s holds exactly the two generated layers', (bucket) => {
      // `icons:check` hashes the paths it KNOWS about, so a hand-added file is invisible to it —
      // and an extra qualified resource is not a Gradle error either. That is precisely the
      // hand-copy failure mode this story exists to retire, so it gets a gate rather than a
      // convention. `watch-icons.test.ts` makes the same check on the widget appiconset.
      //
      // A reintroduced `mdpi` bucket would also land here: it is deliberately absent (no Wear OS
      // device ships below hdpi), and adding one silently ships a fifth copy of the artwork.
      const files = fs.readdirSync(path.join(repoRoot, `${RES}/mipmap-${bucket}`)).sort();
      expect(files).toEqual(['ic_launcher_foreground.png', 'ic_launcher_monochrome.png']);
    });

    it('has no density bucket beyond the four the generator writes', () => {
      const buckets = fs
        .readdirSync(path.join(repoRoot, RES))
        .filter((entry) => entry.startsWith('mipmap-'))
        .sort();
      expect(buckets).toEqual([
        'mipmap-anydpi-v26',
        'mipmap-hdpi',
        'mipmap-xhdpi',
        'mipmap-xxhdpi',
        'mipmap-xxxhdpi'
      ]);
    });
  });

  describe('the artefacts are under `yarn icons:check` (AC7)', () => {
    const generator = readText('scripts/build-brand-icons.mjs');

    it.each(GENERATED)('%s is listed in the generator', (relative) => {
      // Being GENERATED is not the same as being CHECKED. Every path in the generator's output
      // list is hashed against a freshly rendered buffer by `icons:check`, which both the
      // pre-push hook and `ci-quality-gates.yml` run — so membership of that list is the thing
      // that stops these drifting from the phone's icons a second time. This is the criterion
      // that fixes the bug; regenerating today's artwork only fixes today's symptom.
      expect(generator).toContain(`'${relative}'`);
    });
  });
});

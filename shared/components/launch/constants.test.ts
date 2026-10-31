/**
 * Launch constants — cross-module invariants (Story 16.17).
 *
 * `SPLASH_LOGO_WIDTH` has to equal the `imageWidth` of the `expo-splash-screen`
 * plugin entry in `app.json`, and the story asks for each site to name the other
 * in a comment. `app.json` is strict JSON, so it cannot carry one — this suite is
 * the substitute, and a strictly stronger one: it fails CI if the two ever drift,
 * where a comment could only ask politely.
 *
 * The equality is load-bearing rather than cosmetic. `setOptions({ fade })` is
 * documented iOS-only, so on Android the native splash is removed in a hard cut and
 * agreement between the two layers — same size, same field colour — is the ONLY
 * thing concealing the handoff. Drift converts an invisible transition into a
 * visible flicker.
 *
 * The suite also pins the ABSENCE of a `dark` variant. That is not tidiness: a
 * per-scheme native background cannot track the user's runtime theme preference
 * (it is baked at build time), which is what produced a measured white-to-black
 * launch inversion before the field became scheme-independent.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  BREATH_DELAY_MS,
  BREATH_DURATION_MS,
  BREATH_FADE_IN_MS,
  BREATH_MIN_OPACITY,
  EXIT_FADE_MS,
  LAUNCH_FIELD_COLOR,
  SPLASH_HIDE_FALLBACK_MS,
  SPLASH_LOGO_WIDTH
} from './constants';
import appConfig from '../../../app.json';

/** NFR-U5 (`docs/prd.md:1055`): indicators required beyond this many ms. */
const NFR_U5_LOADING_INDICATOR_FLOOR_MS = 500;

type SplashPluginProps = {
  image: string;
  imageWidth: number;
  backgroundColor: string;
  /** Must stay absent — a per-scheme variant is the defect, not a feature. */
  dark?: { image: string; backgroundColor: string };
};

const findSplashPlugin = (): SplashPluginProps => {
  const entry = appConfig.expo.plugins.find(
    (plugin): plugin is [string, SplashPluginProps] =>
      Array.isArray(plugin) && plugin[0] === 'expo-splash-screen'
  );
  if (!entry) {
    throw new Error('expo-splash-screen plugin entry missing from app.json');
  }
  return entry[1];
};

describe('launch constants', () => {
  describe('app.json agreement (AC2, AC4)', () => {
    it('is configured through the expo-splash-screen plugin', () => {
      expect(findSplashPlugin()).toBeDefined();
    });

    it('sizes the native mark to exactly SPLASH_LOGO_WIDTH', () => {
      expect(findSplashPlugin().imageWidth).toBe(SPLASH_LOGO_WIDTH);
    });

    it('paints the same brand field as the JS surface', () => {
      // The native and JS layers must agree exactly: `setOptions({ fade })` is
      // iOS-only, so on Android the native layer is removed in a hard cut and only
      // identical colour hides the seam.
      expect(findSplashPlugin().backgroundColor).toBe(LAUNCH_FIELD_COLOR);
    });

    it('declares NO dark variant, which is the whole point', () => {
      // A `dark` block is what made this launch broken. The native background is
      // baked from `userInterfaceStyle: "automatic"`, i.e. the SYSTEM scheme, while
      // the app renders the user's PERSISTED preference — so for any user who has
      // overridden the system the two disagree and the launch inverts luminance
      // (measured: ~1.75 s white, then black content). One scheme-independent brand
      // colour removes the disagreement instead of shrinking it.
      expect(findSplashPlugin().dark).toBeUndefined();
    });

    it('points at the generated foreground raster', () => {
      expect(findSplashPlugin().image).toBe('./assets/splash-icon.png');
    });

    it('no longer carries the deprecated expo.splash block', () => {
      // SDK 55 deprecated it, and its `resizeMode: 'contain'` is what stretched
      // the 1×1 placeholder pixel into a full-width green square.
      expect(appConfig.expo).not.toHaveProperty('splash');
    });

    it('leaves userInterfaceStyle automatic, which the launch no longer depends on', () => {
      // Pinned as documentation rather than as a dependency. AD-16-17-05 originally
      // had the JS surface mirror this value; that is retired — the launch field is
      // now one brand colour, so `automatic` governs only the APP's chrome, never the
      // launch. This assertion exists so the next reader can see that the coupling
      // was deliberately removed rather than forgotten.
      expect(appConfig.expo.userInterfaceStyle).toBe('automatic');
    });
  });

  describe('motion values (AC7)', () => {
    it('clears NFR-U5s 500 ms floor without landing on it', () => {
      // Exactly 500 would flash the affordance on and straight off again for
      // users landing in the 500–700 ms band; a blink reads as a glitch.
      expect(BREATH_DELAY_MS).toBeGreaterThan(NFR_U5_LOADING_INDICATOR_FLOOR_MS);
    });

    it('reveals the breath faster than one breath cycle, so it fades in', () => {
      expect(BREATH_FADE_IN_MS).toBeLessThan(BREATH_DURATION_MS);
    });

    it('keeps the breath trough visible rather than blinking to transparent', () => {
      expect(BREATH_MIN_OPACITY).toBeGreaterThan(0);
      expect(BREATH_MIN_OPACITY).toBeLessThan(1);
    });
  });

  describe('splash artwork (AC1, AC8)', () => {
    /** Parse an IHDR without a PNG library: dimensions, bit depth, colour type. */
    const header = (relativePath: string) => {
      const png = readFileSync(join(__dirname, '../../../', relativePath));
      return {
        width: png.readUInt32BE(16),
        height: png.readUInt32BE(20),
        depth: png.readUInt8(24),
        colorType: png.readUInt8(25),
        byteLength: png.byteLength
      };
    };

    const COLOR_TYPE_RGB = 2;
    const COLOR_TYPE_RGBA = 6;

    const sha256 = (relativePath: string) =>
      createHash('sha256')
        .update(readFileSync(join(__dirname, '../../../', relativePath)))
        .digest('hex');

    it('is a real 1024-square raster, not the 1x1 placeholder it replaced', () => {
      // The original asset was 70 bytes: a single #00FF00 pixel at alpha 127 that
      // `resizeMode: 'contain'` stretched into a full-screen-width green square.
      const splash = header('assets/splash-icon.png');
      expect(splash.width).toBe(1024);
      expect(splash.height).toBe(1024);
      expect(splash.byteLength).toBeGreaterThan(1000);
    });

    it('carries an alpha channel, because it is a foreground on a brand field', () => {
      // THE regression guard. The mark is the wallet foreground and the field is
      // painted by the plugin's `backgroundColor`, so everything outside the artwork
      // must be transparent. Two earlier attempts failed here: `assets/icon.png`
      // copied verbatim (opaque, full-bleed — the OS masks app icons ITSELF, so a
      // splash gets a hard-edged blue square), then that icon merely corner-masked
      // (still a box inside a box). This colour-type split catches any `cp
      // assets/icon.png assets/splash-icon.png` putting either back.
      expect(header('assets/icon.png').colorType).toBe(COLOR_TYPE_RGB);
      expect(header('assets/splash-icon.png').colorType).toBe(COLOR_TYPE_RGBA);
    });

    it('is not a copy of the app icon', () => {
      // Continuity comes from shared GEOMETRY rather than from shared bytes:
      // `yarn icons:build` renders the splash mark, the app icon, the Android
      // foreground and the themed layer from one definition in
      // `scripts/lib/brand-mark.mjs`, rendered by `scripts/build-brand-icons.mjs`,
      // and `yarn icons:check` regenerates them
      // in CI and compares hashes, so none of them can drift from the others.
      // They must still differ as FILES -- the icon is opaque and full-bleed
      // because the OS masks it itself, the splash is a transparent foreground
      // on a field the plugin paints.
      expect(sha256('assets/splash-icon.png')).not.toBe(sha256('assets/icon.png'));
    });
  });

  describe('strand safety (AC5)', () => {
    it('gives the fallback hide a deadline longer than the exit fade', () => {
      // The fallback must not pre-empt the normal `onLayout`-driven handoff; it is
      // a net under it, not a race with it.
      expect(SPLASH_HIDE_FALLBACK_MS).toBeGreaterThan(EXIT_FADE_MS);
    });
  });
});

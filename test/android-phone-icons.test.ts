/**
 * @jest-environment node
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { getJimpImageAsync } from '@expo/image-utils/build/jimp';

import { silhouette } from './silhouette';

/**
 * The Android PHONE's launcher icon and splash icon, measured as Expo's prebuild makes them
 * (Story 20.6, amended 2026-10-31).
 *
 * **The generator does not draw these.** `build-brand-icons.mjs` writes one 1024 px foreground,
 * one monochrome layer and one splash icon; `expo prebuild` resizes each into the phone's density
 * buckets, from mdpi up, with `@expo/image-utils`. That resizing spreads the antialiased edge by
 * most of a pixel, and a pixel is worth the most dp at mdpi. `wear-icons.test.ts` cannot see it:
 * Wear's mipmaps are drawn by the generator, from hdpi up. With a margin of one hdpi pixel, the
 * phone's mdpi foreground and monochrome put ink at 33.24dp, past the 66dp guideline, and nothing
 * failed. This suite runs the same resizing on the committed assets and measures the result.
 *
 * - **The arguments are prebuild's.** `@expo/prebuild-config`'s `withAndroidIcons` resizes each
 *   adaptive layer to 108dp × the density with `resizeMode: 'cover'` on a transparent field, and
 *   its `withAndroidSplashImages` resizes the splash icon to `imageWidth` × the density with
 *   `resizeMode: 'contain'` and centres it on a 288dp canvas. The asset paths and `imageWidth`
 *   come from `app.json`, which is what prebuild reads.
 * - **So is the copy of `@expo/image-utils`.** The repository installs more than one, and the
 *   child loads each the way prebuild reaches it, with `require.resolve` from each package in turn
 *   rather than from the repository root:
 *   - the adaptive layers: `expo` → `@expo/cli` → that CLI's own `@expo/prebuild-config`, which
 *     applies `withAndroidIcons` → `@expo/image-utils`;
 *   - the splash: `expo-splash-screen`, the config plugin `app.json` names, → the
 *     `@expo/prebuild-config` it requires `withAndroidSplashImages` from → `@expo/image-utils`.
 * - **The cache is a temporary directory**, not the project's `.expo/`, and is removed afterwards.
 * - **The resizer is pinned to Jimp.** `@expo/image-utils` switches to sharp when a global
 *   `sharp-cli` is installed. This repository installs none and neither does CI, so prebuild runs
 *   Jimp, and pinning it keeps the result the same on every machine. The sharp path is not
 *   measured.
 * - **The output is decoded with that package's `getJimpImageAsync`.** Prebuild's PNGs use
 *   adaptive scanline filters, which `png-scanlines.ts` refuses by design.
 * - **Ink is measured as `wear-icons.test.ts` measures it**: any non-zero alpha, out to the far
 *   corner of the pixel, so a mark that grazes the limit counts as outside it.
 *
 * WHY A SUBPROCESS: Jimp ENCODES every step as a PNG, and inside Jest's sandbox its encoder runs
 * about twenty times slower than under plain Node — the splash alone took 16 s at xxxhdpi. One
 * `node` child runs prebuild's resizing for every case in about two seconds and writes the PNGs to
 * the temporary directory. Decoding and measuring them here is fast, so the assertions stay in this
 * file.
 */
const repoRoot = path.resolve(__dirname, '..');

/**
 * Android's density buckets and their multipliers, written out from Android's density table
 * rather than read from `@expo/prebuild-config`, so a bucket prebuild dropped would still be
 * measured here.
 */
const DENSITIES: ReadonlyArray<readonly [string, number]> = [
  ['mdpi', 1],
  ['hdpi', 1.5],
  ['xhdpi', 2],
  ['xxhdpi', 3],
  ['xxxhdpi', 4]
];

/** An adaptive-icon layer is 108dp square; the logo is asked to stay within its centre 66dp. */
const LAYER_DP = 108;
const MAX_LOGO_DP = 66;

/**
 * `expo-splash-screen` centres the splash icon on a 288dp canvas, with no icon background. On
 * Android 12 and later the system crops that canvas to a 192dp circle, so ink outside it is cut
 * natively and reappears when the JavaScript launch screen takes over.
 */
const SPLASH_CANVAS_DP = 288;
const SPLASH_CIRCLE_DP = 192;

type AppJson = {
  expo: {
    android: { adaptiveIcon: { foregroundImage: string; monochromeImage: string } };
    plugins: ReadonlyArray<string | readonly [string, Record<string, unknown>]>;
  };
};

const appJson: AppJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'app.json'), 'utf8'));

const splashConfig = (): { image: string; imageWidth: number } => {
  const entry = appJson.expo.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen'
  );
  const options = Array.isArray(entry) ? entry[1] : undefined;
  if (typeof options?.image !== 'string' || typeof options.imageWidth !== 'number') {
    throw new Error('app.json: no expo-splash-screen plugin with an image and an imageWidth');
  }
  return { image: options.image, imageWidth: options.imageWidth };
};

/** One resize the child runs. `out` is the file name it writes, in the temporary directory. */
type Job =
  | { kind: 'adaptive'; out: string; src: string; cacheType: string; size: number }
  | { kind: 'splash'; out: string; src: string; size: number; canvas: number };

/**
 * The child: prebuild's two resizes, verbatim in their arguments. The adaptive call is
 * `withAndroidIcons`' `generateIconAsync`; the splash calls are `withAndroidSplashImages`'
 * `setSplashImageDrawablesForThemeAsync`, except that the canvas is transparent rather than the
 * splash's ink field: it puts the icon in the same place and leaves its alpha readable.
 */
const RESIZE = `
const fs = require('node:fs');
const path = require('node:path');

/** The directory of package \`name\`, as Node resolves it from inside \`from\`. */
const packageDir = (name, from) =>
  path.dirname(require.resolve(name + '/package.json', { paths: [from] }));
/** \`@expo/image-utils\`, as the \`@expo/prebuild-config\` in \`prebuildConfig\` requires it. */
const imageUtilsOf = (prebuildConfig) =>
  require(require.resolve('@expo/image-utils', { paths: [prebuildConfig] }));

const cli = packageDir('@expo/cli', packageDir('expo', process.cwd()));
const icons = imageUtilsOf(packageDir('@expo/prebuild-config', cli));
const splash = imageUtilsOf(
  packageDir('@expo/prebuild-config', packageDir('expo-splash-screen', process.cwd()))
);

const { projectRoot, jobs } = JSON.parse(process.env.PHONE_ICONS_JSON);

const resize = async (job) => {
  if (job.kind === 'adaptive') {
    const { source } = await icons.generateImageAsync(
      { projectRoot, cacheType: job.cacheType },
      {
        src: job.src,
        width: job.size,
        height: job.size,
        resizeMode: 'cover',
        backgroundColor: 'transparent',
        borderRadius: undefined
      }
    );
    return source;
  }
  const { source: foreground } = await splash.generateImageAsync(
    { projectRoot, cacheType: 'splash-android' },
    { src: job.src, resizeMode: 'contain', width: job.size, height: job.size }
  );
  const background = await splash.generateImageBackgroundAsync({
    width: job.canvas,
    height: job.canvas,
    backgroundColor: 'transparent',
    resizeMode: 'cover'
  });
  return splash.compositeImagesAsync({
    background,
    foreground,
    x: (job.canvas - job.size) / 2,
    y: (job.canvas - job.size) / 2
  });
};

(async () => {
  for (const job of jobs) fs.writeFileSync(path.join(projectRoot, job.out), await resize(job));
})().catch((error) => {
  process.stderr.write(String(error && error.stack ? error.stack : error));
  process.exit(1);
});
`;

/** The decoded image. `jimp-compact` ships no types, so this states the part read here. */
type Bitmap = { width: number; height: number; data: Buffer };

/** Where the ink is: the image's size, and its farthest inked point from the centre, in dp. */
const measure = async (png: Buffer, dpPerPixel: number) => {
  const image: { bitmap: Bitmap } = await getJimpImageAsync(png);
  const { width, height, data } = image.bitmap;
  let farthest = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if ((data[(y * width + x) * 4 + 3] ?? 0) === 0) continue;
      const dx = Math.abs(x + 0.5 - width / 2) + 0.5;
      const dy = Math.abs(y + 0.5 - height / 2) + 0.5;
      farthest = Math.max(farthest, Math.hypot(dx, dy));
    }
  }
  return { width, height, radiusDp: farthest * dpPerPixel };
};

const { foregroundImage, monochromeImage } = appJson.expo.android.adaptiveIcon;
const splash = splashConfig();

const LAYERS = DENSITIES.flatMap(([bucket, multiplier]) =>
  (
    [
      ['foreground', foregroundImage, 'android-adaptive-foreground'],
      ['monochrome', monochromeImage, 'android-adaptive-monochrome']
    ] as const
  ).map(([layer, src, cacheType]) => ({
    layer,
    bucket,
    multiplier,
    job: {
      kind: 'adaptive',
      out: `${layer}-${bucket}.png`,
      src: path.join(repoRoot, src),
      cacheType,
      size: LAYER_DP * multiplier
    } satisfies Job
  }))
);

const SPLASHES = DENSITIES.map(([bucket, multiplier]) => ({
  bucket,
  multiplier,
  job: {
    kind: 'splash',
    out: `splash-${bucket}.png`,
    src: path.join(repoRoot, splash.image),
    size: splash.imageWidth * multiplier,
    canvas: SPLASH_CANVAS_DP * multiplier
  } satisfies Job
}));

describe('the Android phone icons, as Expo’s prebuild resizes them (Story 20.6)', () => {
  let projectRoot = '';
  const output = (job: Job) => fs.readFileSync(path.join(projectRoot, job.out));

  beforeAll(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cardi-phone-icons-'));
    const jobs: Job[] = [...LAYERS.map(({ job }) => job), ...SPLASHES.map(({ job }) => job)];
    try {
      execFileSync(process.execPath, ['-e', RESIZE], {
        cwd: repoRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          EXPO_IMAGE_UTILS_NO_SHARP: '1',
          PHONE_ICONS_JSON: JSON.stringify({ projectRoot, jobs })
        },
        // A synchronous spawn blocks the event loop, so no Jest timeout can fire while it runs;
        // kill a stalled child instead.
        timeout: 60_000
      });
    } catch (error) {
      const { stderr, message } = error as { stderr?: Buffer; message: string };
      throw new Error(`prebuild resize failed:\n${stderr?.toString() || message}`);
    }
  });

  afterAll(() => {
    if (projectRoot) fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  it.each(LAYERS)(
    'the $layer layer keeps its ink inside the 66dp logo circle at $bucket',
    async ({ multiplier, job }) => {
      const ink = await measure(output(job), 1 / multiplier);
      expect([ink.width, ink.height]).toEqual([job.size, job.size]);
      expect(ink.radiusDp).toBeGreaterThan(0);
      expect(ink.radiusDp).toBeLessThan(MAX_LOGO_DP / 2);
    }
  );

  it.each(
    LAYERS.filter(
      ({ layer, bucket }) =>
        layer === 'monochrome' && ['xhdpi', 'xxhdpi', 'xxxhdpi'].includes(bucket)
    )
  )(
    'the monochrome layer reads as a card with five bars cut through it, the stem apart, at $bucket',
    async ({ job }) => {
      // The themed icon is drawn from the alpha alone, so the barcode survives only as five holes
      // through the card. mdpi and hdpi are left out: there the resized bar slots are 1.5 to 2 px
      // wide at 35° and break into more than five holes (Review Triage Log #34).
      const image: { bitmap: Bitmap } = await getJimpImageAsync(output(job));
      const { width, data } = image.bitmap;
      expect(silhouette(width, (x, y) => data[(y * width + x) * 4 + 3] ?? 0)).toEqual({
        pieces: 2,
        holes: 5
      });
    }
  );

  it.each(SPLASHES)(
    'the splash icon keeps its ink inside Android 12’s 192dp splash-icon circle at $bucket',
    async ({ multiplier, job }) => {
      const ink = await measure(output(job), 1 / multiplier);
      expect([ink.width, ink.height]).toEqual([job.canvas, job.canvas]);
      expect(ink.radiusDp).toBeGreaterThan(0);
      expect(ink.radiusDp).toBeLessThan(SPLASH_CIRCLE_DP / 2);
    }
  );
});

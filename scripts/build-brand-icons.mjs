#!/usr/bin/env node
/**
 * Build every shipped Cardì brand asset from ONE geometry definition.
 *
 *   yarn icons:build     write the assets
 *   yarn icons:check     fail if any is out of sync (pre-push + CI)
 *
 * WHAT IT PRODUCES
 *
 *   assets/images/cardi-mark.svg        the mark, transparent — the in-app source
 *   assets/icon.png              1024   opaque ink field; iOS and Android mask it themselves
 *   assets/adaptive-icon.png     1024   Android foreground, transparent, scaled to the safe zone
 *   assets/adaptive-icon-monochrome.png
 *                                1024   Android 13+ themed layer: one colour, transparent
 *   assets/favicon.png             48   opaque
 *   assets/splash-icon.png       1024   transparent; the field comes from the splash config
 *   targets/watch/AppIcon.png    1024   opaque; the watchOS app icon PREBUILD reads (Story 21.3)
 *   targets/watch-widget/…/OpenAppIcon.imageset/open-app-icon@{1,2,3}x.png
 *                          64/128/192   opaque; the artwork the COMPLICATION draws (Story 21.3)
 *   targets/watch-widget/…/OpenAppIconGlyph.imageset/open-app-icon-glyph@{1,2,3}x.png
 *                          64/128/192   transparent, framed on the mark's own box; the
 *                                       complication's INLINE glyph (Story 23.4)
 *   watch-android/…/mipmap-{h,x,xx,xxx}dpi/ic_launcher_foreground.png
 *                  162/216/324/432   Wear OS adaptive foreground, transparent (Story 21.4)
 *   watch-android/…/mipmap-{h,x,xx,xxx}dpi/ic_launcher_monochrome.png
 *                  162/216/324/432   Wear OS themed layer, one colour (Story 21.4)
 *
 * WHY THERE IS A RASTERISER IN HERE
 *
 * This repo has no image library and no rasteriser — sharp, rsvg-convert,
 * ImageMagick, Inkscape and pyobjc are all absent, and Chrome is not installed
 * for Playwright. `build-splash-icon.mjs` (which this supersedes) established the
 * answer: draw the handful of primitives the artwork actually uses via signed
 * distance fields, take antialiasing analytically from the distance rather than by
 * supersampling, and write the PNG by hand. Cheaper and cleaner than supersampling,
 * and it keeps the build dependency-free so CI can verify it.
 *
 * The Cardì mark needs exactly two primitives: a rounded rect, and a ROTATED
 * rounded rect. Rotation is applied to the sample point rather than the shape,
 * which is exact — rotation is an isometry, so it preserves the distance the SDF
 * returns. Scaling is applied to the shape instead, because scaling a rounded rect
 * about a point yields another rounded rect exactly, and transforming the sample
 * point would have left the returned distance in the scaled space and skewed the
 * antialiasing.
 *
 * It is NOT a general SVG renderer. If the mark ever gains a primitive this does
 * not know about, this script must be updated; it will not silently approximate.
 *
 * WHY THE SVG IS GENERATED TOO
 *
 * `build-splash-icon.mjs` transcribed its geometry from a hand-authored SVG and
 * carried an `assertSvgMatches` drift check to catch the transcription going
 * stale. Generating both from the same constants removes the failure mode instead
 * of detecting it: there is no second copy of the numbers to drift.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
import { layoutWordmark } from './lib/brand-wordmark.mjs';
import { flattenPath, rasterizeContours } from './lib/path-raster.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// THE MARK, in the design system's own em space: 100 units to the em, the
// glyph's baseline at y=70. These are the numbers in docs/design/cardi/, not a
// separate set that happens to look the same — variant C of
// docs/design/cardi/frames/cardi-icon-explore.html.
// ---------------------------------------------------------------------------
const BASELINE = 70;
const XHEIGHT = 49.6;
const STEM_TOP = BASELINE - XHEIGHT; // 20.4
const CX = 15; // half the ì's 30-unit advance

/**
 * The accent DESCENDS left to right: a grave, which is what "Cardì" spells.
 * Positive is the correct sign because SVG's y-axis points down. A negative
 * angle draws an acute and spells a different word — see
 * docs/design/cardi/cardi-design-system.md.
 */
const ANGLE = 35;

/** Variant C: the beam crosses the bars HIGH, where an accent belongs. */
const BEAM = { length: 52, weight: 9, cy: 30 };

/** The stem is a barcode: three bars of different widths. */
const BARS = [
  { x: CX - 11, w: 4.5, r: 2.2 },
  { x: CX - 4.5, w: 9, r: 4.5 },
  { x: CX + 7, w: 4, r: 2 }
];

const INK = [0x18, 0x18, 0x24];
const BEAM_YELLOW = [0xfc, 0xcc, 0x0c];
const WHITE = [0xff, 0xff, 0xff];

/** Android crops the adaptive foreground to the centre 66%. iOS has no such mask. */
const SAFE_FRACTION = 0.66;
/** The icon canvas, in em units. 100 puts the mark at ~76% of the frame. */
const CANVAS = 100;

// ---------------------------------------------------------------------------
// Derived geometry. Everything below falls out of the constants above, so
// changing the artwork updates the SVG, every PNG, and the Android scale
// together — there is no hardcoded scale factor to go quietly stale.
// ---------------------------------------------------------------------------
const rad = (deg) => (deg * Math.PI) / 180;

/** Half-extents of a rounded bar of this length and weight after rotation. */
const beamExtent = () => ({
  hw: (BEAM.length / 2) * Math.cos(rad(ANGLE)) + (BEAM.weight / 2) * Math.sin(rad(ANGLE)),
  hh: (BEAM.length / 2) * Math.sin(rad(ANGLE)) + (BEAM.weight / 2) * Math.cos(rad(ANGLE))
});

const bounds = () => {
  const { hw, hh } = beamExtent();
  const x0 = Math.min(CX - hw, BARS[0].x);
  const x1 = Math.max(CX + hw, BARS[2].x + BARS[2].w);
  const y0 = Math.min(BEAM.cy - hh, STEM_TOP);
  const y1 = Math.max(BEAM.cy + hh, BASELINE);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  let radius = 0;
  for (const px of [x0, x1]) {
    for (const py of [y0, y1]) radius = Math.max(radius, Math.hypot(px - cx, py - cy));
  }
  return { x0, x1, y0, y1, cx, cy, radius };
};

const B = bounds();

/**
 * How far the Android foreground must shrink for the whole mark to clear the
 * safe circle. Clamped at 1 because this may only ever reduce: "scale up to
 * fill the safe circle" is a different instruction from "fit inside it".
 */
const ANDROID_SCALE = Math.min(1, (SAFE_FRACTION * CANVAS) / 2 / B.radius);

/** em units -> canvas units, with the mark centred. */
const originX = B.cx - CANVAS / 2;
const originY = B.cy - CANVAS / 2;

/**
 * A square framed on the mark's own bounding box, for a raster that must not carry the icon
 * canvas's padding: the complication's inline glyph, which watchOS sizes to the line of text, so
 * the canvas's padding would shrink the mark to about half that height. The margin is one unit,
 * enough that the antialiased edge is not cut at the 64 px size.
 */
const TIGHT_MARGIN = 1;
const TIGHT_SIDE = Math.max(B.x1 - B.x0, B.y1 - B.y0) + 2 * TIGHT_MARGIN;
const TIGHT_FRAME = { x: B.cx - TIGHT_SIDE / 2, y: B.cy - TIGHT_SIDE / 2, side: TIGHT_SIDE };

/** Scaling a rounded rect about a point yields another rounded rect, exactly. */
const scaleRect = (rect, s) => ({
  x: B.cx + (rect.x - B.cx) * s,
  y: B.cy + (rect.y - B.cy) * s,
  w: rect.w * s,
  h: rect.h * s,
  r: rect.r * s
});

/** The four shapes, in canvas units, at a given scale. */
const shapes = (scale) => {
  const bars = BARS.map((bar) =>
    scaleRect({ x: bar.x, y: STEM_TOP, w: bar.w, h: BASELINE - STEM_TOP, r: bar.r }, scale)
  );
  const beam = scaleRect(
    {
      x: CX - BEAM.length / 2,
      y: BEAM.cy - BEAM.weight / 2,
      w: BEAM.length,
      h: BEAM.weight,
      r: BEAM.weight / 2
    },
    scale
  );
  const pivot = {
    x: B.cx + (CX - B.cx) * scale,
    y: B.cy + (BEAM.cy - B.cy) * scale
  };
  return { bars, beam, pivot };
};

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/** Signed distance to a rounded rect; negative inside. */
const roundedRectSdf = (px, py, { x, y, w, h, r }) => {
  const dx = Math.abs(px - (x + w / 2)) - (w / 2 - r);
  const dy = Math.abs(py - (y + h / 2)) - (h / 2 - r);
  if (dx <= 0 && dy <= 0) return Math.max(dx, dy) - r;
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) - r;
};

/**
 * The same, rotated about `pivot`. The sample point is rotated by the INVERSE
 * angle into the rect's own frame; because rotation is an isometry the distance
 * that comes back is already correct in screen space, with no correction.
 */
const rotatedRoundedRectSdf = (px, py, rect, degrees, pivot) => {
  const a = rad(-degrees);
  const dx = px - pivot.x;
  const dy = py - pivot.y;
  return roundedRectSdf(
    pivot.x + dx * Math.cos(a) - dy * Math.sin(a),
    pivot.y + dx * Math.sin(a) + dy * Math.cos(a),
    rect
  );
};

/** Coverage in 0..1 from a signed distance — one-pixel-wide analytic AA. */
const coverage = (distance) => Math.min(1, Math.max(0, 0.5 - distance));

/**
 * Render one asset.
 *
 * `field` is the opaque background, or null for transparent. `stem` and `accent`
 * are the two ink colours; passing the same value for both is what produces the
 * Android themed layer, where there is no hue left to tell them apart.
 *
 * `tight` frames the square on the mark's own bounding box instead of the padded
 * icon canvas — see {@link TIGHT_FRAME}.
 * Unlike `buildSvg`'s `tight` (the exact, non-square box, no margin), this is a centred SQUARE on
 * that box with a one-unit margin.
 */
const render = ({ size, scale, field, stem, accent, tight = false }) => {
  const { bars, beam, pivot } = shapes(scale);
  const px = Buffer.alloc(size * size * 4);
  const frame = tight ? TIGHT_FRAME : { x: originX, y: originY, side: CANVAS };
  const perPixel = frame.side / size; // canvas units per device pixel

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      // Sample at the pixel CENTRE, in canvas units offset to the mark's frame.
      const sx = (x + 0.5) * perPixel + frame.x;
      const sy = (y + 0.5) * perPixel + frame.y;
      // The SDF is in canvas units; AA wants it in device pixels.
      const toPixels = 1 / perPixel;

      let r = field ? field[0] : 0;
      let g = field ? field[1] : 0;
      let b = field ? field[2] : 0;
      let a = field ? 1 : 0;

      const over = (colour, cov) => {
        if (cov <= 0) return;
        const outA = cov + a * (1 - cov);
        if (outA <= 0) return;
        r = (colour[0] * cov + r * a * (1 - cov)) / outA;
        g = (colour[1] * cov + g * a * (1 - cov)) / outA;
        b = (colour[2] * cov + b * a * (1 - cov)) / outA;
        a = outA;
      };

      for (const bar of bars) over(stem, coverage(roundedRectSdf(sx, sy, bar) * toPixels));
      over(accent, coverage(rotatedRoundedRectSdf(sx, sy, beam, ANGLE, pivot) * toPixels));

      const i = (y * size + x) * 4;
      px[i] = Math.round(r);
      px[i + 1] = Math.round(g);
      px[i + 2] = Math.round(b);
      px[i + 3] = Math.round(a * 255);
    }
  }
  return px;
};

// ---------------------------------------------------------------------------
// PNG encoding — carried over from build-splash-icon.mjs, parameterised by size
// ---------------------------------------------------------------------------
const crcTable = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

const crc32 = (buffer) => {
  let c = -1;
  for (let i = 0; i < buffer.length; i += 1) c = crcTable[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};

const chunk = (type, data) => {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
};

/**
 * Encode RGBA pixels, dropping the alpha channel when the asset is opaque.
 *
 * The colour type is not cosmetic. **iOS rejects an app icon that carries an
 * alpha channel**, so `icon.png` must be RGB; the splash and the Android
 * foreground are transparent marks on a field the platform paints, so they must
 * be RGBA. `constants.test.ts` asserts exactly that split, and it caught this
 * script writing RGBA for everything — which is also the guard that catches
 * somebody "fixing" a missing splash with `cp assets/icon.png
 * assets/splash-icon.png`, since an opaque full-bleed square on the launch
 * field reads as a broken placeholder.
 *
 * `width`/`height` are separate because the store banners are not square. Every
 * icon still passes the same value twice; nothing else changed.
 */
const encodePng = (pixels, width, height, opaque) => {
  const channels = opaque ? 3 : 4;
  const stride = width * channels;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1) + 1;
    if (opaque) {
      for (let x = 0; x < width; x += 1) {
        const src = (y * width + x) * 4;
        raw[rowStart + x * 3] = pixels[src];
        raw[rowStart + x * 3 + 1] = pixels[src + 1];
        raw[rowStart + x * 3 + 2] = pixels[src + 2];
      }
    } else {
      pixels.copy(raw, rowStart, y * width * 4, (y + 1) * width * 4);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(opaque ? 2 : 6, 9); // 2 = RGB, 6 = RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
};

// ---------------------------------------------------------------------------
// The SVG, from the same numbers
// ---------------------------------------------------------------------------
/**
 * A colour is either an RGB triple or the literal string `currentColor`, which
 * only the in-app SVG uses: react-native-svg resolves it from the `color` prop,
 * so one asset works on a cream surface and on an ink one. The PNGs never see
 * it — a rasteriser has no cascade to inherit from.
 */
const hex = (colour) =>
  typeof colour === 'string'
    ? colour
    : `#${colour.map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();

const n = (value) => Number(value.toFixed(3)).toString();

/**
 * Round to the precision {@link n} prints at.
 *
 * The banner layout quantises with this BEFORE rendering, so the raster draws
 * exactly the geometry the committed SVG states. Left unrounded, the two agree
 * only to three decimals of a scale factor that then multiplies 234 em units —
 * about a twentieth of a pixel at the wordmark's far end. Invisible, and still a
 * disagreement between a source and the raster that is supposed to BE that
 * source, which is the one thing generating both from one definition exists to
 * rule out.
 */
const quantise = (value) => Number(value.toFixed(3));

/** {@link quantise} applied to a device-pixel rounded rect. */
const quantiseRect = (rect) => ({
  x: quantise(rect.x),
  y: quantise(rect.y),
  w: quantise(rect.w),
  h: quantise(rect.h),
  r: quantise(rect.r)
});

/**
 * `tight` crops the viewBox to the artwork instead of the icon canvas.
 *
 * The icon canvas carries deliberate padding — the mark fills ~48% × 59% of it,
 * which is right for something the OS masks and wrong for something a component
 * sizes. An in-app `<CardiMark width={34} />` on the padded box draws a mark
 * about half the size of the Material glyph it replaced, which is exactly what
 * happened at both call sites. The launch surface had been compensated for the
 * same effect by hand (`SPLASH_LOGO_WIDTH` 200 → 260); a tight box removes the
 * need to compensate at all.
 *
 * The padded box is NOT merely legacy: `cardi-mark.svg` must stay pixel-identical
 * to `splash-icon.png` at the same width, because that identity is what conceals
 * the native→JS splash handoff. So both boxes exist, on purpose.
 */
const buildSvg = ({ size, scale, field, stem, accent, tight = false }) => {
  const { bars, beam, pivot } = shapes(scale);
  const w = tight ? B.x1 - B.x0 : CANVAS;
  const h = tight ? B.y1 - B.y0 : CANVAS;
  const k = size / Math.max(w, h);
  const ox = tight ? B.x0 : originX;
  const oy = tight ? B.y0 : originY;
  const vw = w * k;
  const vh = h * k;
  const map = (rect) => ({
    x: (rect.x - ox) * k,
    y: (rect.y - oy) * k,
    w: rect.w * k,
    h: rect.h * k,
    r: rect.r * k
  });
  const rect = (r_, colour) =>
    `  <rect x="${n(r_.x)}" y="${n(r_.y)}" width="${n(r_.w)}" height="${n(r_.h)}" ` +
    `rx="${n(r_.r)}" fill="${hex(colour)}" />`;
  const p = { x: (pivot.x - ox) * k, y: (pivot.y - oy) * k };
  const beamRect = map(beam);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(vw)} ${n(vh)}" ` +
      `width="${n(vw)}" height="${n(vh)}" role="img" aria-label="Cardì">`,
    field ? `  <rect width="${n(vw)}" height="${n(vh)}" fill="${hex(field)}" />` : null,
    ...bars.map((bar) => rect(map(bar), stem)),
    `  <g transform="rotate(${ANGLE} ${n(p.x)} ${n(p.y)})">`,
    `  ${rect(beamRect, accent)}`,
    '  </g>',
    '</svg>',
    ''
  ]
    .filter((line) => line !== null)
    .join('\n');
};

// ---------------------------------------------------------------------------
// The assets
// ---------------------------------------------------------------------------
const FULL = { scale: 1, stem: WHITE, accent: BEAM_YELLOW };
const ANDROID = { scale: ANDROID_SCALE, stem: WHITE, accent: BEAM_YELLOW };

/**
 * The Android themed layer, on both form factors. One colour and no hue to lean
 * on, so the beam has to survive as a SHAPE. It does, because it crosses the bars
 * and extends past them on both sides.
 *
 * It is a SEPARATE asset rather than a second reference to the colour foreground,
 * and the difference shows only when a launcher declines to tint. `getMonochrome()`
 * promises nothing stronger than "callers CAN use a tinted version of this
 * drawable", so an untinted draw is within contract — and untinted, the colour
 * foreground puts a YELLOW beam on a themed field, which is two colours and
 * therefore not a monochrome icon. It costs nothing under a launcher that does
 * tint: the two assets' alpha channels are byte-identical and only their RGB
 * differs, so a SRC_IN tint collapses them to the same image.
 *
 * ⚠️ NO WEAR LAUNCHER APPEARS TO CONSUME IT, measured rather than assumed. The
 * Wear OS 5 stock launcher (`ClockworkSysUiGoogle.apk`, API 34) references
 * `getForeground`, `getBackground`, `loadIcon` and `AdaptiveIconDrawable` and
 * contains NO reference to `getMonochrome` — and framework method names are the
 * one thing R8 cannot rename, so the absence is evidence rather than an artefact
 * of minification. Not a closed proof, and `docs/design/wear-launcher-verification/`
 * states the limits. It is generated anyway because it satisfies Android lint's
 * `MonochromeLauncherIcon`, matches what the phone declares, and costs ~7 KB
 * across four densities. It is NOT here on a belief that Wear tints it.
 */
const MONOCHROME = { scale: ANDROID_SCALE, stem: WHITE, accent: WHITE };

/**
 * An adaptive-icon layer is 108dp square, so a density bucket's pixel size is
 * 108 x its multiplier: 162 / 216 / 324 / 432. Derived rather than written out,
 * because a transposed pair is invisible — each file is still a valid PNG at a
 * size some other bucket wanted, and only the launcher ever notices.
 */
const ADAPTIVE_ICON_DP = 108;
const HDPI = ADAPTIVE_ICON_DP * 1.5;
const XHDPI = ADAPTIVE_ICON_DP * 2;
const XXHDPI = ADAPTIVE_ICON_DP * 3;
const XXXHDPI = ADAPTIVE_ICON_DP * 4;

const PNGS = [
  ['assets/icon.png', { size: 1024, field: INK, ...FULL }],
  ['assets/adaptive-icon.png', { size: 1024, field: null, ...ANDROID }],
  ['assets/adaptive-icon-monochrome.png', { size: 1024, field: null, ...MONOCHROME }],
  ['assets/favicon.png', { size: 48, field: INK, ...FULL }],
  ['assets/splash-icon.png', { size: 1024, field: null, ...FULL }],

  // ---------------------------------------------------------------------
  // The Play Store listing icon (Story 21.5).
  //
  // Not an icon the APP ships — it is uploaded to Play Console by hand and shown
  // beside the listing. Nothing in this repo referenced these two files, which is
  // exactly why they sat three and a half months stale wearing the old blue
  // wallet: generating them is what puts them under `yarn icons:check`.
  //
  // BOTH ARE OPAQUE, FULL-BLEED INK, and that is Google's own instruction rather
  // than a preference. The Play icon specification says "Shape: Full square —
  // Google Play dynamically handles masking… Shadow: None — Google Play
  // dynamically handles shadows", and, on transparency, "pick a background colour
  // for your asset that's appropriate for your brand and doesn't include any
  // transparency. Transparent assets will display the background colour of Google
  // Play UI." The mark's stem is WHITE, so a transparent upload would put white
  // bars on Play's white surface and erase the icon — the previous `-alpha` file,
  // which dropped the field entirely, would have done precisely that.
  //
  // The two differ ONLY in colour type, which is the whole reason the pair
  // exists. Google specifies "Format: 32-bit PNG", so `-alpha` is the file to
  // upload: RGBA with every alpha byte at 255. The unsuffixed one is 24-bit RGB,
  // the universally-safe raster for anything that rejects an alpha channel.
  // `keepAlpha` is what separates "has an alpha channel" from "is transparent";
  // everywhere else in this file those two still coincide.
  ['assets/store/android-app-icon-512x512.png', { size: 512, field: INK, ...FULL }],
  [
    'assets/store/android-app-icon-512x512-alpha.png',
    { size: 512, field: INK, keepAlpha: true, ...FULL }
  ],

  // ---------------------------------------------------------------------
  // The watch (Story 21.3). Both surfaces below are masked to a CIRCLE by
  // watchOS, which is the phone squircle's opposite failure mode: a squircle
  // trims corners, a circle trims everything outside the inscribed disc.
  //
  // They still take the SAME geometry as the phone, and that is a measured
  // result rather than an assumption. The mark's bounding-box corner radius is
  // 37.798 canvas units against the inscribed circle's 50 — 24.4 % of the
  // radius to spare — and its half-extents (23.879 x 29.299) also sit inside
  // the inscribed SQUARE's 35.355, which is the containment rule the watch
  // grammar states for circular masks (cardi-watch-grammar.md 7.2). So no
  // watch-specific scale is needed, and inventing one would break the single
  // geometry definition this file exists to keep. `watch-icons.test.ts`
  // decodes the rendered pixels and asserts the containment rather than
  // trusting this comment.
  // ---------------------------------------------------------------------

  // Read by `expo prebuild` (targets/watch/expo-target.config.js `icon:`),
  // which copies it into AppIcon.appiconset as the single 1024 watchOS entry.
  // Generating the SOURCE rather than the copy is what keeps AC2 true: prebuild
  // stays the generator of record for the catalogue, and this file stays the
  // generator of record for the artwork.
  ['targets/watch/AppIcon.png', { size: 1024, field: INK, ...FULL }],

  // The complication's artwork — what `WatchComplicationWidget.swift` renders on
  // the WATCH FACE, not an app icon. Opaque, because the widget clips the artwork
  // to a round disc itself, and the artwork's own ink field is that disc. A
  // transparent field would show the watch face through the disc, and on a tinted
  // face the ink field's luminance is what falls away.
  //
  // The three scales stay 64/128/192. `ComplicationImage.swift` downsamples to
  // 38pt x 2 = 76 px because `accessoryCorner` rejects anything larger with
  // `imageTooLarge` and renders the slot GREY, so these must not grow: watchOS
  // picks @2x, and 128 px is the buffer that downsampling starts from.
  [
    'targets/watch-widget/Assets.xcassets/OpenAppIcon.imageset/open-app-icon@1x.png',
    { size: 64, field: INK, ...FULL }
  ],
  [
    'targets/watch-widget/Assets.xcassets/OpenAppIcon.imageset/open-app-icon@2x.png',
    { size: 128, field: INK, ...FULL }
  ],
  [
    'targets/watch-widget/Assets.xcassets/OpenAppIcon.imageset/open-app-icon@3x.png',
    { size: 192, field: INK, ...FULL }
  ],

  // The complication's INLINE glyph (Story 23.4): the same mark, TRANSPARENT and framed tight.
  //
  // `accessoryInline` draws its image as a template, from the alpha channel alone, on every face
  // — so the opaque artwork above renders there as a solid square, measured on the watchOS 26.5
  // simulator. Transparent, the alpha IS the mark, and the template reads as its silhouette: the
  // beam still crosses the bars and extends past them on both sides, the argument `MONOCHROME`
  // makes for Android. The beam keeps its colour for any surface that draws the image untinted.
  // Same sizes as `OpenAppIcon`, under the same 76 px downsample.
  [
    'targets/watch-widget/Assets.xcassets/OpenAppIconGlyph.imageset/open-app-icon-glyph@1x.png',
    { size: 64, field: null, tight: true, ...FULL }
  ],
  [
    'targets/watch-widget/Assets.xcassets/OpenAppIconGlyph.imageset/open-app-icon-glyph@2x.png',
    { size: 128, field: null, tight: true, ...FULL }
  ],
  [
    'targets/watch-widget/Assets.xcassets/OpenAppIconGlyph.imageset/open-app-icon-glyph@3x.png',
    { size: 192, field: null, tight: true, ...FULL }
  ],

  // The widget extension's app icon.
  //
  // ⚠️ IT SHIPS NOWHERE, and that is measured rather than assumed. The
  // watch-widget target carries no `ASSETCATALOG_COMPILER_APPICON_NAME`, so Xcode
  // invokes `actool` for that catalogue WITHOUT `--app-icon`; the built
  // `watchwidget.appex` has no `AppIcon` in its `Assets.car` (only `OpenAppIcon`
  // and the brand logos) and no icon key of any kind in its `Info.plist`. A
  // watchOS widget extension is represented by its CONTAINING app's icon.
  //
  // It is generated anyway, at the single 1024 watchOS size, for two reasons. The
  // file was a flat `#80FF80` placeholder inherited from the `@bacons/apple-targets`
  // scaffold, declaring iPhone/iPad/ios-marketing idioms inside a watchOS
  // extension — so it was wrong twice over and nothing in the repo would have
  // caught either. And `icon:` is NOT the fix: `withIosIcon` only emits the
  // watchOS single-size form for `type: 'watch'`, so setting it on a
  // `watch-widget` target regenerates exactly the same iOS-idiom set in Cardì
  // colours. Generating it here puts it under `yarn icons:check` instead, which
  // is the only thing that keeps it from drifting back.
  [
    'targets/watch-widget/Assets.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png',
    { size: 1024, field: INK, ...FULL }
  ],

  // ---------------------------------------------------------------------
  // Wear OS (Story 21.4).
  //
  // `watch-android` is a STANDALONE Gradle project and its README calls that
  // self-containment deliberate: it "cannot reach into the JS app's assets
  // without giving up being self-contained". So these four densities were
  // HAND-COPIED, and hand-copying is exactly how they drifted — the phone
  // icon changed on 2026-09-13 and these did not, leaving the companion app
  // wearing the old blue wallet ever since. Generating them WRITES INTO
  // `watch-android/`; the Gradle project still reads nothing but its own
  // `res/`, so the self-containment survives and the drift does not.
  //
  // The Wear launcher masks to a CIRCLE, and the phone's own `ANDROID_SCALE`
  // already clears it — measured rather than assumed. The scaled mark's inked
  // bounding circle is 64.55dp at its WORST density (hdpi, where one pixel of
  // analytic antialiasing is worth the most dp), against the 66dp maximum logo
  // size and the 72dp masked viewport of a 108dp adaptive layer. No Wear scale
  // is needed, and inventing one would break the single geometry definition
  // this file exists to keep. `test/wear-icons.test.ts` decodes the rendered
  // pixels and asserts the containment rather than trusting this comment.
  //
  // There is no `mdpi` bucket and that is not an omission: `minSdk` is 30 and
  // no Wear OS device ships below hdpi, so the bucket would be dead weight in
  // every APK. Android downsamples from hdpi if one ever appeared.
  // ---------------------------------------------------------------------
  [
    'watch-android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png',
    { size: HDPI, field: null, ...ANDROID }
  ],
  [
    'watch-android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png',
    { size: XHDPI, field: null, ...ANDROID }
  ],
  [
    'watch-android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png',
    { size: XXHDPI, field: null, ...ANDROID }
  ],
  [
    'watch-android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png',
    { size: XXXHDPI, field: null, ...ANDROID }
  ],

  // The themed layer the `<monochrome>` element points at. Inert below API 33
  // — `AdaptiveIconDrawable` on Android 11 matches the child tag against
  // "background" and "foreground" and `continue`s past anything else — so it is
  // free on the Wear OS 3 devices `minSdk` 30 admits. It appears to be unread on
  // Wear OS 4 and 5 as well, for a different reason: see the `MONOCHROME`
  // comment above, which is the one place that argument lives.
  [
    'watch-android/app/src/main/res/mipmap-hdpi/ic_launcher_monochrome.png',
    { size: HDPI, field: null, ...MONOCHROME }
  ],
  [
    'watch-android/app/src/main/res/mipmap-xhdpi/ic_launcher_monochrome.png',
    { size: XHDPI, field: null, ...MONOCHROME }
  ],
  [
    'watch-android/app/src/main/res/mipmap-xxhdpi/ic_launcher_monochrome.png',
    { size: XXHDPI, field: null, ...MONOCHROME }
  ],
  [
    'watch-android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_monochrome.png',
    { size: XXXHDPI, field: null, ...MONOCHROME }
  ]
];

const SVGS = [
  ['assets/images/cardi-mark.svg', { size: 1024, field: null, ...FULL }],
  ['assets/images/cardi-icon.svg', { size: 1024, field: INK, ...FULL }],
  [
    // The in-app mark: tight box, WHITE stem, on whatever ink field the component
    // paints behind it.
    //
    // This replaced a `currentColor` variant whose stem followed the theme. That
    // idea does not survive contact with the palette: the beam is only legible on
    // ink. Measured — beam on ink 11.53:1, on white 1.52:1, on cream 1.33:1. A
    // theme-following stem therefore buys nothing, because the accent that makes
    // the mark "Cardì" disappears on every light ground regardless of what the
    // stem does. The design system already says this: beam is a FILL that carries
    // dark text, never a stroke on a light surface.
    'assets/images/cardi-mark-inline.svg',
    { size: 1024, field: null, scale: 1, stem: WHITE, accent: BEAM_YELLOW, tight: true }
  ],
  [
    // The same tight mark again, published under `docs/`.
    //
    // Not a stray duplicate: GitHub Pages serves the site from `main:/docs` ONLY, so
    // `../assets/images/` is simply not reachable from a published page. A copy has to
    // exist inside `docs/` for the site to show the mark at all, and generating it here
    // is what puts it under `yarn icons:check` — a hand-copied file would drift the
    // moment the geometry changed, silently and only on the public site.
    'docs/assets/cardi-mark-inline.svg',
    { size: 1024, field: null, scale: 1, stem: WHITE, accent: BEAM_YELLOW, tight: true }
  ]
];

// ---------------------------------------------------------------------------
// The store banners (Story 21.5)
//
// Two rasters and the SVG they come from, all three from the geometry below —
// the same argument the mark makes: generating the vector and the bitmap from
// one set of numbers removes the drift instead of detecting it. The file this
// replaces had drifted badly. Its 1024x500 raster showed the wordmark CLIPPED by
// the artwork beside it, letterboxed inside transparent bands, on a blue gradient
// with a drop shadow — three things the Cardì system forbids outright — and its
// source asked for `font-family="Avenir Next, SF Pro Display, Arial"`, so the
// typeface was whatever the renderer happened to own.
// ---------------------------------------------------------------------------

/**
 * `Cardì`, baseline-relative, in this file's own em space.
 *
 * The four letters are Space Grotesk Bold outlines; the `ì` is the wordmark's
 * single stem and CONTAINED accent, which is a different artefact from the
 * barcode-and-beam mark above. `brand-wordmark.mjs` explains why, and takes
 * `BASELINE`, `XHEIGHT`, the advance and `ANGLE` from here so there is no second
 * copy of them to drift.
 */
const WORDMARK = layoutWordmark({
  baseline: 0,
  xHeight: XHEIGHT,
  markAdvance: CX * 2,
  angle: ANGLE
});

/**
 * The card accents, back to front, as the design system lists them.
 *
 * Drawn as CARDS, which is the one place an accent is allowed outside a theme:
 * "a card accent is legal as the card's OWN full-bleed detail field", because
 * there it is the content rather than the chrome. A card filled with that card's
 * colour is exactly that case, and it is the system's own thesis — the content is
 * the colour — stated as plainly as it can be.
 *
 * `angle` fans them. ⚠️ These tilts are UNRELATED to the accent's sign rule: that
 * rule governs the ì's beam alone, where a negative angle spells a different word.
 * A card leaning either way is just a card.
 */
const WALLET_CARDS = [
  { colour: [0x0c, 0x84, 0x3c], dx: 0.1, dy: -0.155, angle: 10 }, // green
  { colour: [0x0c, 0x3c, 0x84], dx: 0.035, dy: -0.075, angle: 5 }, // deep blue
  { colour: [0xe4, 0x24, 0x24], dx: -0.03, dy: -0.01, angle: -5 } // red
];

/** Card width as a fraction of the banner's width, and height as a fraction of that. */
const CARD_ASPECT = 0.63;
/** Corner radius as a fraction of a card's width — the system's 16px on a 171px tile. */
const CARD_RADIUS = 0.094;

/**
 * The barcode on the front card: bar widths in module units, and the quiet zone.
 *
 * A fixed, deliberately NON-ENCODING pattern. It has to read as a barcode at a
 * glance and it must not be a scannable number — a store graphic that resolves to
 * a real EAN is an invitation to point a scanner at it. The rhythm is a plausible
 * mix of 1-, 2- and 3-module bars with the guard pairs a real symbol would carry.
 */
const BARCODE_MODULES = [
  1, 1, 1, 2, 1, 3, 1, 1, 2, 2, 1, 1, 3, 1, 1, 2, 1, 1, 1, 3, 2, 1, 1, 1, 2, 3, 1, 1, 1, 2, 1, 2, 1,
  1, 3, 1, 2, 1, 1, 1
];
/** Fraction of the card's width left white on each side of the bars. */
const BARCODE_QUIET = 0.11;
/** Bar height as a fraction of the card's height. */
const BARCODE_HEIGHT = 0.52;

const bannerLayout = ({
  width,
  height,
  wordmarkWidth,
  wordmarkCentreX,
  wordmarkCentreY,
  wallet
}) => {
  const ink = WORDMARK.ink;
  const scale = quantise((width * wordmarkWidth) / (ink.x1 - ink.x0));
  // Device position of em point (ex, ey) is (originX + ex*scale, baselineY + ey*scale).
  const originX = quantise(width * wordmarkCentreX - ((ink.x0 + ink.x1) / 2) * scale);
  const baselineY = quantise(height * wordmarkCentreY - ((ink.y0 + ink.y1) / 2) * scale);
  const toDevice = (rect) =>
    quantiseRect({
      x: originX + rect.x * scale,
      y: baselineY + rect.y * scale,
      w: rect.width * scale,
      h: rect.height * scale,
      r: rect.radius * scale
    });

  // The wallet: accent cards fanned behind one white card carrying a barcode.
  // Drawn back to front, so the front card is composited last and nothing lands
  // on top of the bars.
  const cardWidth = width * wallet.cardWidth;
  const cardHeight = cardWidth * CARD_ASPECT;
  const centreX = width * wallet.centreX;
  const centreY = height * wallet.centreY;
  const card = (dx, dy, angle, colour) => {
    const rect = quantiseRect({
      x: centreX - cardWidth / 2 + cardWidth * dx,
      y: centreY - cardHeight / 2 + cardHeight * dy,
      w: cardWidth,
      h: cardHeight,
      r: cardWidth * CARD_RADIUS
    });
    return { colour, rect, angle, pivot: { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 } };
  };
  const cards = WALLET_CARDS.map((c) => card(c.dx, c.dy, c.angle, c.colour));

  // The front card stays at angle 0. Two reasons, both deliberate: axis-aligned
  // bars read as a barcode at any size, and rotating it would mean rotating every
  // bar about the same pivot for no gain.
  const front = card(0, 0.075, 0, WHITE);
  const quiet = front.rect.w * BARCODE_QUIET;
  // The array ALREADY alternates bar, gap, bar, gap — even indices are the bars —
  // so the pattern spans its own module total. Sizing the unit as though bars and
  // gaps were two separate lists halves the barcode and leaves it marooned in the
  // middle of the card, which is exactly what the first draft did.
  const unit = (front.rect.w - 2 * quiet) / BARCODE_MODULES.reduce((total, m) => total + m, 0);
  const barHeight = front.rect.h * BARCODE_HEIGHT;
  const bars = [];
  let penX = front.rect.x + quiet;
  BARCODE_MODULES.forEach((m, index) => {
    if (index % 2 === 0) {
      bars.push(
        quantiseRect({
          x: penX,
          y: front.rect.y + (front.rect.h - barHeight) / 2,
          w: m * unit,
          h: barHeight,
          r: 0
        })
      );
    }
    penX += m * unit;
  });

  return {
    width,
    height,
    letters: WORDMARK.letters.map((letter) => ({
      path: letter.path,
      x: quantise(originX + letter.dx * scale),
      y: baselineY,
      scale
    })),
    stem: toDevice(WORDMARK.stem),
    beam: toDevice(WORDMARK.beam),
    pivot: {
      x: quantise(originX + WORDMARK.beam.pivotX * scale),
      y: quantise(baselineY + WORDMARK.beam.pivotY * scale),
      angle: WORDMARK.beam.angle
    },
    cards,
    front,
    bars
  };
};

/**
 * Composite one rounded rect, optionally rotated, onto RGBA pixels.
 *
 * Only the shape's own bounding box is walked. At 4096 x 2304 the difference is
 * not cosmetic: the banner routes 26 shapes through here — three wallet cards, the
 * white card, twenty barcode bars, the stem and the beam — and walking the full
 * frame for each would be 245 million distance evaluations for artwork that covers
 * a fraction of it. Most of those 26 are barcode bars a few pixels wide.
 *
 * `margin` is the rect's own half-diagonal, which is the furthest any of its points
 * can be from its centre; rotation about that centre preserves the distance at any
 * angle, so the bound holds for the negative tilt on one wallet card as well as for
 * the beam.
 */
const overRoundedRect = (px, width, height, rect, colour, rotation) => {
  const margin = rotation ? Math.hypot(rect.w, rect.h) / 2 + 2 : 2;
  const x0 = Math.max(0, Math.floor(rect.x - margin));
  const x1 = Math.min(width, Math.ceil(rect.x + rect.w + margin));
  const y0 = Math.max(0, Math.floor(rect.y - margin));
  const y1 = Math.min(height, Math.ceil(rect.y + rect.h + margin));
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const sx = x + 0.5;
      const sy = y + 0.5;
      const distance = rotation
        ? rotatedRoundedRectSdf(sx, sy, rect, rotation.angle, rotation.pivot)
        : roundedRectSdf(sx, sy, rect);
      const cov = coverage(distance);
      if (cov <= 0) continue;
      const i = (y * width + x) * 4;
      px[i] = Math.round(colour[0] * cov + px[i] * (1 - cov));
      px[i + 1] = Math.round(colour[1] * cov + px[i + 1] * (1 - cov));
      px[i + 2] = Math.round(colour[2] * cov + px[i + 2] * (1 - cov));
    }
  }
};

/** Composite a coverage tile, produced by the path rasteriser, at an offset. */
const overCoverage = (px, width, coverageMap, box, colour) => {
  for (let y = 0; y < box.h; y += 1) {
    for (let x = 0; x < box.w; x += 1) {
      const cov = coverageMap[y * box.w + x];
      if (cov <= 0) continue;
      const i = ((box.y + y) * width + box.x + x) * 4;
      px[i] = Math.round(colour[0] * cov + px[i] * (1 - cov));
      px[i + 1] = Math.round(colour[1] * cov + px[i + 1] * (1 - cov));
      px[i + 2] = Math.round(colour[2] * cov + px[i + 2] * (1 - cov));
    }
  }
};

/** Render one banner to opaque RGBA pixels. */
const renderBanner = (options) => {
  const { width, height, letters, stem, beam, pivot, cards, front, bars } = bannerLayout(options);
  const px = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    px[i * 4] = INK[0];
    px[i * 4 + 1] = INK[1];
    px[i * 4 + 2] = INK[2];
    px[i * 4 + 3] = 255;
  }

  // Back to front: the fanned accent cards, then the white card, then its bars.
  for (const c of cards) {
    overRoundedRect(px, width, height, c.rect, c.colour, { angle: c.angle, pivot: c.pivot });
  }
  overRoundedRect(px, width, height, front.rect, WHITE);
  for (const bar of bars) overRoundedRect(px, width, height, bar, INK);

  // The letters go through the path rasteriser into a tile the size of their own
  // bounding box rather than the whole frame — at 4096 x 2304 a full-frame
  // coverage map would be 37 MB of floats to hold a few per cent ink.
  const ink = WORDMARK.ink;
  const { scale, y: baselineY } = letters[0];
  const box = {
    x: Math.max(0, Math.floor(letters[0].x + ink.x0 * scale) - 2),
    y: Math.max(0, Math.floor(baselineY + ink.y0 * scale) - 2)
  };
  box.w = Math.min(width, Math.ceil(letters[0].x + ink.x1 * scale) + 2) - box.x;
  box.h = Math.min(height, Math.ceil(baselineY + ink.y1 * scale) + 2) - box.y;
  const contours = letters.flatMap((letter) =>
    flattenPath(letter.path, { scale, dx: letter.x - box.x, dy: letter.y - box.y })
  );
  overCoverage(px, width, rasterizeContours(contours, box.w, box.h), box, WHITE);

  // Stem first, then the accent over it — the order `mark_locked.py` draws them.
  overRoundedRect(px, width, height, stem, WHITE);
  overRoundedRect(px, width, height, beam, BEAM_YELLOW, { angle: pivot.angle, pivot });
  return px;
};

/** The same composition as SVG, from the same layout, for the committed source. */
const buildBannerSvg = (options) => {
  const { width, height, letters, stem, beam, pivot, cards, front, bars } = bannerLayout(options);
  const rect = (r, colour) =>
    `  <rect x="${n(r.x)}" y="${n(r.y)}" width="${n(r.w)}" height="${n(r.h)}" ` +
    `rx="${n(r.r)}" fill="${hex(colour)}" />`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(width)} ${n(height)}" ` +
      `width="${n(width)}" height="${n(height)}" role="img" ` +
      `aria-label="Cardì — Google Play feature graphic">`,
    `  <rect width="${n(width)}" height="${n(height)}" fill="${hex(INK)}" />`,
    ...cards.map(
      (c) =>
        `  <g transform="rotate(${n(c.angle)} ${n(c.pivot.x)} ${n(c.pivot.y)})">\n  ` +
        `${rect(c.rect, c.colour)}\n  </g>`
    ),
    rect(front.rect, WHITE),
    ...bars.map((bar) => rect(bar, INK)),
    ...letters.map(
      (letter) =>
        `  <path transform="translate(${n(letter.x)} ${n(letter.y)}) scale(${n(letter.scale)})" ` +
        `d="${letter.path}" fill="${hex(WHITE)}" />`
    ),
    rect(stem, WHITE),
    `  <g transform="rotate(${pivot.angle} ${n(pivot.x)} ${n(pivot.y)})">`,
    `  ${rect(beam, BEAM_YELLOW)}`,
    '  </g>',
    '</svg>',
    ''
  ].join('\n');
};

/**
 * The feature graphic: 1024 x 500, the image at the top of the Play listing.
 *
 * Play renders it at many sizes and crops it, and tells you so — "keep prominent
 * visuals and the focal point towards the centre". Hence the two halves straddle
 * the centre rather than either one owning it: the wordmark sits left of it and
 * the wallet right of it, so a centre crop keeps part of both and no element is
 * near enough to an edge to be the first thing lost.
 *
 * ⚠️ The composition SHOWS THE PRODUCT, which the first draft did not. That draft
 * was a centred wordmark over a row of five flat accent tiles: on brand, and a
 * picture of a logo rather than of what the app is for. A feature graphic has one
 * job, and Google's own guidance warns against "prominent branding duplicating
 * your app icon" — which is exactly what a wordmark alone is.
 *
 * NO TAGLINE, deliberately. Play does not localise one graphic across locales, so
 * English words here would appear on the Italian listing; ifero settled the same
 * question the same way for the launch surface in Story 16.17 ("mark only, no
 * text"). The listing's own title and short description carry the words.
 */
const FEATURE_GRAPHIC = {
  width: 1024,
  height: 500,
  wordmarkWidth: 0.34,
  wordmarkCentreX: 0.265,
  wordmarkCentreY: 0.5,
  wallet: { cardWidth: 0.35, centreX: 0.685, centreY: 0.5 }
};

/**
 * The developer-page header: 4096 x 2304.
 *
 * The same composition in a 16:9 frame, which is much taller for its width than
 * the feature graphic's 2.048:1 — so the wordmark and the wallet each take a
 * smaller fraction of the width, and the extra room becomes quiet ink above and
 * below rather than larger artwork. That is the right way round for this slot:
 * Google crops the header on a phone and draws the developer's name over it.
 *
 * Both banners centre their content vertically (`wordmarkCentreY: 0.5`). They did
 * not always: the tile-row draft ran its cards off the bottom edge, so each frame
 * needed its own vertical offset to keep the crop sensible. The wallet is a
 * self-contained cluster, so one value serves both.
 */
const DEVELOPER_HEADER = {
  width: 4096,
  height: 2304,
  wordmarkWidth: 0.3,
  wordmarkCentreX: 0.27,
  wordmarkCentreY: 0.5,
  wallet: { cardWidth: 0.3, centreX: 0.69, centreY: 0.5 }
};

const BANNERS = [
  ['assets/store/android-store-banner-1024x500.png', FEATURE_GRAPHIC],
  // ⚠️ A PNG, where this file used to be a JPEG, and the extension changed with
  // it. Play accepts "JPEG or 24-bit PNG (no alpha)" for both banner slots, and
  // on flat colour a PNG is smaller AND better: no chroma subsampling to ring the
  // wordmark's edges. It also keeps every committed raster on the one encoder
  // this file already owns, rather than adding a baseline JPEG encoder to write a
  // worse image. Nothing in the repo referenced the old filename.
  ['assets/store/google-developer-banner-4096x2304.png', DEVELOPER_HEADER]
];

const sha = (buffer) => createHash('sha256').update(buffer).digest('hex');

const artefacts = [
  ...SVGS.map(([path, opts]) => [path, Buffer.from(buildSvg(opts), 'utf8')]),
  ['assets/images/android-store-banner.svg', Buffer.from(buildBannerSvg(FEATURE_GRAPHIC), 'utf8')],
  // `field` decides the colour type: an opaque field means an opaque PNG. The one
  // exception is the Play listing icon, which Google specifies as 32-bit AND
  // fully opaque, so it asks for the alpha channel back with `keepAlpha`.
  ...PNGS.map(([path, opts]) => [
    path,
    encodePng(render(opts), opts.size, opts.size, opts.field !== null && !opts.keepAlpha)
  ]),
  ...BANNERS.map(([path, opts]) => [
    path,
    encodePng(renderBanner(opts), opts.width, opts.height, true)
  ])
];

/**
 * Paths this script REPLACED, deleted on a build and reported on a check.
 *
 * Without this, `yarn icons:build` would leave the superseded file sitting beside
 * its replacement, and nothing would ever notice — which is how `assets/store/`
 * got into the state Story 21.5 found it in.
 */
const SUPERSEDED = ['assets/store/google-developer-banner-4096x2304.jpg'];

const check = process.argv.includes('--check');
let failed = 0;

for (const [relative, buffer] of artefacts) {
  const target = join(ROOT, relative);
  if (check) {
    let current = null;
    try {
      current = readFileSync(target);
    } catch {
      console.error(`✗ ${relative} is missing — run \`yarn icons:build\``);
      failed += 1;
      continue;
    }
    if (sha(current) !== sha(buffer)) {
      console.error(`✗ ${relative} is out of sync with the mark — run \`yarn icons:build\``);
      failed += 1;
    }
  } else {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, buffer);
    console.log(`✓ ${relative} (${buffer.length} bytes)`);
  }
}

for (const relative of SUPERSEDED) {
  const target = join(ROOT, relative);
  // `existsSync` rather than a swallowed `readFileSync`: reading a 365 KB file to
  // discard it is wasteful, and catching the read would also treat a permission
  // error as "already gone" and pass the check on a file that is still there.
  if (!existsSync(target)) continue;
  if (check) {
    console.error(`✗ ${relative} was superseded and should be gone — run \`yarn icons:build\``);
    failed += 1;
  } else {
    rmSync(target);
    console.log(`✗ ${relative} (superseded, removed)`);
  }
}

if (check) {
  if (failed) process.exit(1);
  console.log(`✓ all ${artefacts.length} brand assets are in sync with the mark`);
} else {
  console.log(
    `\nmark bounding radius ${B.radius.toFixed(2)} of ${CANVAS} units · ` +
      `Android foreground scale ×${ANDROID_SCALE.toFixed(3)}`
  );
}

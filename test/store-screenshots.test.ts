import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { COLOR_TYPE_RGB, readHeader } from './png-scanlines';

/**
 * The store screenshots under `assets/store/screenshots/` (Story 24.6).
 *
 * Like the artwork beside them, they are uploaded to App Store Connect and the Play Console by
 * hand, so nothing else ever opens them. This suite asserts each console's rules against the
 * committed bytes, so a wrong export (a 6.7" iPhone frame, a 20:9 Android capture, a PNG that
 * kept its alpha channel, a missing locale) fails here rather than in the console.
 *
 * Layout: `assets/store/screenshots/<store>/<locale>/<set>-NN-<screen>.png`.
 *
 * The rules, from Apple's "Screenshot specifications" and Google's "Add preview assets":
 *
 *   App Store  iPhone 6.9"        1320 x 2868 portrait                    3 to 6 per locale (story)
 *   App Store  Apple Watch        422 x 514 (Ultra 3, the largest size)   2 per locale (story)
 *   Play       phone              9:16, each side 320 to 3840 px          3 to 6 per locale (story)
 *   Play       Wear OS            1:1, 384 to 3840 px (story: above 384)  2 per locale (story)
 *
 * Both consoles reject or flatten an alpha channel, so every file is a plain RGB PNG (colour type
 * 2, 8-bit) with no `tRNS` chunk.
 */

const ROOT = join(__dirname, '..');
const DIR = join(ROOT, 'assets/store/screenshots');
const LOCALES = ['en', 'it'] as const;

type SetRule = {
  store: 'app-store' | 'play';
  set: string;
  min: number;
  max: number;
  fits: (width: number, height: number) => boolean;
  rule: string;
};

const SETS: SetRule[] = [
  {
    store: 'app-store',
    set: 'iphone',
    min: 3,
    max: 6,
    fits: (w, h) => w === 1320 && h === 2868,
    rule: '1320 x 2868'
  },
  {
    store: 'app-store',
    set: 'watch',
    min: 2,
    max: 2,
    fits: (w, h) => w === 422 && h === 514,
    rule: '422 x 514'
  },
  {
    store: 'play',
    set: 'phone',
    min: 3,
    max: 6,
    fits: (w, h) => w * 16 === h * 9 && w >= 320 && h <= 3840,
    rule: '9:16, 320 to 3840 px'
  },
  {
    store: 'play',
    set: 'wear',
    min: 2,
    max: 2,
    fits: (w, h) => w === h && w > 384 && w <= 3840,
    rule: '1:1, above 384 px'
  }
];

const FILE_NAME = /^(iphone|watch|phone|wear)-\d{2}-[a-z0-9-]+\.png$/;

const filesIn = (store: string, locale: string): string[] => {
  const dir = join(DIR, store, locale);
  return existsSync(dir)
    ? readdirSync(dir)
        .filter((name) => !name.startsWith('.'))
        .sort()
    : [];
};

const chunkTypes = (png: Buffer): string[] => {
  const types: string[] = [];
  let offset = 8;
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    types.push(png.toString('ascii', offset + 4, offset + 8));
    offset += 12 + length;
  }
  return types;
};

describe('store screenshots (Story 24.6)', () => {
  it.each(['app-store', 'play'])('%s has exactly the en and it locales', (store) => {
    expect(
      readdirSync(join(DIR, store))
        .filter((name) => !name.startsWith('.'))
        .sort()
    ).toEqual([...LOCALES]);
  });

  it.each(['app-store', 'play'].flatMap((store) => LOCALES.map((locale) => [store, locale])))(
    '%s/%s holds only named PNG screenshots of a known set',
    (store, locale) => {
      filesIn(store, locale).forEach((name) => expect(name).toMatch(FILE_NAME));
    }
  );

  describe.each(SETS.flatMap((rule) => LOCALES.map((locale) => ({ ...rule, locale }))))(
    '$store $set ($locale)',
    ({ store, set, locale, min, max, fits, rule }) => {
      const files = filesIn(store, locale).filter((name) => name.startsWith(`${set}-`));

      it(`has ${min === max ? min : `${min} to ${max}`} screenshots`, () => {
        expect(files.length).toBeGreaterThanOrEqual(min);
        expect(files.length).toBeLessThanOrEqual(max);
      });

      it('numbers them 01, 02, … without gaps', () => {
        expect(files.map((name) => name.slice(set.length + 1, set.length + 3))).toEqual(
          files.map((_, i) => String(i + 1).padStart(2, '0'))
        );
      });

      it('matches the other locale screen for screen', () => {
        const other = LOCALES.find((l) => l !== locale) ?? locale;
        expect(files).toEqual(filesIn(store, other).filter((name) => name.startsWith(`${set}-`)));
      });

      it.each(files)(`%s is ${rule}, 8-bit RGB with no alpha`, (name) => {
        const png = readFileSync(join(DIR, store, locale, name));
        const { width, height, depth, colorType } = readHeader(png);
        expect(fits(width, height)).toBe(true);
        expect(depth).toBe(8);
        expect(colorType).toBe(COLOR_TYPE_RGB);
        expect(chunkTypes(png)).not.toContain('tRNS');
      });
    }
  );
});

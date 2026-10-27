import fs from 'node:fs';
import path from 'node:path';

import { DEFAULT_CARD_COLOR } from '@/core/schemas/card';

import appJson from '../app.json';
import { CARD_COLORS, DARK_THEME_COLORS, IDENTITY_COLORS } from '../shared/theme/tokens.generated';

/**
 * The watchOS accent colour, and the three separate things that have to agree for it to
 * exist at all (Story 21.3, specified by `docs/design/cardi/cardi-watch-grammar.md` §4.5).
 *
 * Both `AccentColor.colorset` files were EMPTY Xcode stubs — `{"colors":[{"idiom":
 * "universal"}]}` with no colour key — so watchOS had no theme layer whatsoever. Story
 * 23.1 decided the value: beam `#FCCC0C`, because a watch runs on black permanently and
 * the system already says primary actions become beam with ink text when the lights go
 * out.
 *
 * ⚠️ **Filling the colorset is necessary and NOT sufficient**, which is the part that
 * cost this story a build to find out. Measured on a 46 mm watchOS 26.4 simulator, with
 * the colorset filled and nothing else: `assetutil --info` showed the colour correctly
 * compiled into `Assets.car`, and `Color.accentColor` on screen was still flat grey
 * `#808080`. `actool` writes `NSAccentColorName` only when
 * `ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME` names a colorset, and prebuild
 * generates no such setting. `plugins/with-watch-accent-color.js` supplies it.
 *
 * ⚠️ The story and the grammar both describe the before-state as "system default blue".
 * It is not; it is grey. Same fix, wrong symptom — do not use blue to check this.
 *
 * So there are three halves, and each one alone is inert:
 *   1. the two colorsets carry sRGB beam;
 *   2. the config plugin names them, and is ORDERED so it runs after the targets exist;
 *   3. the barcode screen opts back out, because the accent tints the navigation title
 *      and on that screen the title is the card's name.
 */
const repoRoot = path.resolve(__dirname, '..');
const readText = (...segments: string[]): string =>
  fs.readFileSync(path.join(repoRoot, ...segments), 'utf8');

const COLORSETS = [
  ['watch app', 'targets/watch/Assets.xcassets/AccentColor.colorset/Contents.json'],
  ['watch widget', 'targets/watch-widget/Assets.xcassets/AccentColor.colorset/Contents.json']
] as const;

const ACCENT_PLUGIN = './plugins/with-watch-accent-color';
const APPLE_TARGETS_PLUGIN = '@bacons/apple-targets';

/** `"0xFC"` -> 252. Xcode writes colorset components as hex strings. */
const channel = (component: string): number => Number.parseInt(component, 16);

describe('watchOS accent colour (Story 21.3, AC6)', () => {
  describe('the colorsets carry beam, in sRGB', () => {
    it.each(COLORSETS)('the %s colorset defines beam', (_label, relative) => {
      const contents = JSON.parse(readText(relative));
      expect(contents.colors).toHaveLength(1);
      const [entry] = contents.colors;
      expect(entry.idiom).toBe('universal');

      const { red, green, blue, alpha } = entry.color.components;
      const beam = `#${[red, green, blue]
        .map((c: string) => channel(c).toString(16).padStart(2, '0'))
        .join('')}`.toUpperCase();
      expect(beam).toBe(IDENTITY_COLORS.beam);
      expect(Number(alpha)).toBe(1);
    });

    it.each(COLORSETS)('the %s colorset is sRGB, never display-p3', (_label, relative) => {
      // NOT cosmetic, and the reason this colorset is hand-authored rather than written by
      // `@bacons/apple-targets`' own `colors: { $accent }` mechanism — which does work, and
      // does land the build setting, but hardcodes `display-p3`. The same components in P3
      // are a visibly more saturated yellow on the P3 display every modern Apple Watch has,
      // and the design system says beam "appears at exactly that value or not at all".
      expect(JSON.parse(readText(relative)).colors[0].color['color-space']).toBe('srgb');
    });

    it.each(COLORSETS)('the %s colorset is no longer an empty stub', (_label, relative) => {
      // The failure mode this replaces: a colorset with an `idiom` and no `color` key at
      // all compiles to nothing, and `actool` drops it from `Assets.car` silently.
      expect(JSON.parse(readText(relative)).colors[0]).toHaveProperty('color');
    });
  });

  describe('the config plugin names the colorset, and is ordered to work', () => {
    const plugins: unknown[] = appJson.expo.plugins;
    const nameOf = (plugin: unknown): string =>
      Array.isArray(plugin) ? String(plugin[0]) : String(plugin);
    const names = plugins.map(nameOf);

    it('is registered in app.json', () => {
      expect(names).toContain(ACCENT_PLUGIN);
    });

    it('is registered BEFORE @bacons/apple-targets, which is what makes it run after', () => {
      // ⚠️ THE WHOLE POINT OF THIS SUITE. Expo's `withMod` wraps the previously registered
      // mod and calls it AFTER its own action, so within one mod chain the last-registered
      // plugin runs first. The watch targets do not exist until `@bacons/apple-targets`
      // creates them, so the accent plugin has to run after it — which means being listed
      // before it.
      //
      // Get this backwards and nothing goes red: the plugin runs against a project with no
      // watch targets yet. The plugin itself throws in that case rather than skipping, but
      // that only fires during `expo prebuild`, which neither `yarn test` nor the
      // always-on quality gates run. This assertion is the gate that does.
      expect(names.indexOf(ACCENT_PLUGIN)).toBeGreaterThanOrEqual(0);
      expect(names.indexOf(ACCENT_PLUGIN)).toBeLessThan(names.indexOf(APPLE_TARGETS_PLUGIN));
    });

    it('names the same colorset the catalogues actually define', () => {
      // Read as source rather than imported: the plugin is CommonJS, outside the
      // TypeScript project, and `require`-ing it from a `.ts` file is a lint error. The
      // cross-check is what matters — the plugin could name a colorset that does not
      // exist and `actool` would simply not emit `NSAccentColorName`, with no warning.
      const plugin = readText('plugins/with-watch-accent-color.js');
      const constant = (name: string): string | undefined =>
        plugin.match(new RegExp(`const ${name} = '([^']+)'`))?.[1];

      expect(constant('BUILD_SETTING')).toBe('ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME');
      const colorsetName = constant('ACCENT_COLORSET_NAME');
      expect(colorsetName).toBeDefined();
      COLORSETS.forEach(([, relative]) => {
        expect(relative).toContain(`${colorsetName}.colorset`);
      });
    });
  });

  describe('the barcode screen opts out of the accent', () => {
    const barcodeView = readText('targets/watch/BarcodeFlashView.swift');
    const colorHelpers = readText('targets/watch/ColorHelpers.swift');

    /**
     * The same source with `//` comments removed.
     *
     * The absence assertion below is about CODE, and the first draft of it failed on the
     * carve-out's own doc comment — which names beam in order to explain what it is
     * substituting. Stripping prose is the honest fix: banning the value from the
     * explanation would make the comment worse to read and the test no stronger.
     *
     * Deliberately blunt. It would also strip a `//` inside a string literal, and this
     * file contains none (checked: no `://`, and no block comments at all). If that ever
     * changes, this needs a real lexer rather than a wider regex.
     */
    const barcodeCode = barcodeView
      .split('\n')
      .map((line) => line.replace(/\/\/.*$/, ''))
      .join('\n');

    it('substitutes cream for the tint', () => {
      // watchOS applies the accent to the app's title string in the navigation bar, and on
      // this screen that string is the card's NAME. Verified on a 46 mm simulator: without
      // the override the name renders beam over the barcode surface, which the design
      // system forbids outright.
      //
      // Story 23.2 repointed the cream: it is the watch's one shared `WatchColor.cream`, the
      // same body-text cream the list paints, rather than a second literal held here. So the
      // pin is in two halves — the bar takes the shared cream, and the shared cream is the
      // identity cream — and the old private literal is gone.
      expect(barcodeCode).toContain(
        '.toolbarForegroundStyle(WatchColor.cream, for: .navigationBar)'
      );
      expect(colorHelpers).toContain(
        `static let cream = parseHexColor("${IDENTITY_COLORS.cream}")`
      );
      expect(barcodeCode).not.toContain('barcodeTitleTint');
      expect(barcodeCode.toUpperCase()).not.toContain(IDENTITY_COLORS.cream.slice(1));
    });

    it.each([
      ['ground', DARK_THEME_COLORS.background],
      ['ink', IDENTITY_COLORS.ink],
      ['beam', IDENTITY_COLORS.beam],
      ['hairline', DARK_THEME_COLORS.border]
    ])('pins the shared watch %s to its design token, in the always-on gate', (name, hex) => {
      // The watch contract suites pin these too, but they run only in `watchos-tests.yml`,
      // whose path filter does not include `tokens/` or `shared/` — so a token change would
      // drift from the watch silently. This file runs in `yarn test` on every change, and
      // already reads `ColorHelpers.swift` for the cream above.
      expect(colorHelpers).toContain(`static let ${name} = parseHexColor("${hex}")`);
    });

    it('pins the watch fallback accent to the phone default, in the always-on gate', () => {
      // Story 23.2: an unresolvable card colour is azure on the watch, as on the phone and Wear
      // (whose twin is in `core/wear-sync-contract.test.ts`). Changing `DEFAULT_CARD_COLOR` or the
      // azure token touches neither watch path, so it is pinned here too.
      const rgb = /private let defaultCardAccentRGB: UInt64 = 0x([0-9A-Fa-f]{6})\b/.exec(
        colorHelpers
      )?.[1];

      expect(`#${rgb}`.toUpperCase()).toBe(CARD_COLORS[DEFAULT_CARD_COLOR].toUpperCase());
    });

    it('overrides the BAR, not the view, because `.tint` does not reach the title', () => {
      // Measured, not assumed: `.tint(BARCODE_TITLE_TINT)` was the first attempt and the
      // card name still rendered beam on a 46 mm simulator. This view is a
      // `navigationDestination` of the card list's `NavigationStack`, so the bar belongs
      // to the stack and a tint set inside the destination never reaches it. Pinning the
      // absence matters because the wrong modifier compiles, ships, and looks deliberate.
      expect(barcodeCode).not.toContain('.tint(');
    });

    it('uses cream rather than ink, which is the instinctive wrong answer', () => {
      // On watchOS the reserved title strip is part of the BLACK surround, not part of the
      // white barcode field — the field starts below it. Ink on black is invisible, so an
      // ink override would read as "the card name disappeared" rather than as a wrong hue.
      expect(barcodeCode).not.toContain('WatchColor.ink');
      expect(barcodeCode).not.toContain(`parseHexColor("${IDENTITY_COLORS.ink}")`);
      expect(barcodeCode.toUpperCase()).not.toContain(IDENTITY_COLORS.ink.slice(1));
    });

    it('draws no beam anywhere on the barcode screen', () => {
      // The absence is the valuable half. "Anything overlaying a barcode, especially a
      // drawn beam" is forbidden by name, and the shipped colours are all literals, so
      // "the banned value is not here" is the only assertion that catches a half-done
      // change. Since Story 23.2 beam also has a NAME in the target, so the name is barred
      // too, along with the accent colour that resolves to it.
      expect(barcodeCode).not.toContain(IDENTITY_COLORS.beam);
      expect(barcodeCode.toUpperCase()).not.toContain('FCCC0C');
      expect(barcodeCode).not.toContain('WatchColor.beam');
      expect(barcodeCode).not.toContain('accentColor');
    });

    it('reads no shared watch colour but the cream title', () => {
      // The screen's white field, true-black bars and black surround are the barcode rule's
      // own values, not chrome; the title is the one thing the shared palette reaches here.
      expect([...barcodeCode.matchAll(/WatchColor\.\w+/g)].map((match) => match[0])).toEqual([
        'WatchColor.cream'
      ]);
    });
  });
});

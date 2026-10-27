import fs from 'node:fs';
import path from 'node:path';

import { DEFAULT_CARD_COLOR } from '@/core/schemas/card';

import { CARD_COLORS, DARK_THEME_COLORS, IDENTITY_COLORS } from '@/shared/theme/tokens.generated';

import { describeOnMac, runSwiftProgram, swiftDeclaration } from './swift-source-helpers';

/**
 * Story 16.41 — one card is one colour, on every surface, and the hairline means what it says.
 *
 * The phone sends the palette KEY, not a hex: `core/watch-connectivity.ts` sets
 * `colorHex: card.color`, and `card.color` is a required `cardColorSchema` enum
 * (`core/schemas/card.ts:54`), so the field is a key for catalogue and custom cards alike. The
 * canonical wire fixture says so out loud — `test-fixtures/sync-message-v1.json:31` carries
 * `"colorHex": "green"` on a `conad` card.
 *
 * ⚠️ That makes `relativeLuminance`'s invalid-input default load-bearing, and it is the worst
 * possible one. It guards `h.count == 6` and returns `0.0` — which reads as BLACK. So the shipped
 * row asked `isNearBlack(hex: "blue")`, got `0.0 < 0.05`, and drew the near-black hairline on
 * EVERY row on the watch; and it asked `shouldUseWhiteText(onBackgroundHex: "orange")`, got
 * `0.0 < 0.4`, and painted white initials on the amber accent — 2.15:1, where black is 9.78:1.
 * Both defects are invisible to a compiler and to a green test suite, which is why this file runs
 * the shipped Swift rather than describing it.
 *
 * Swift XCTests do not auto-run in this repo (there is no test action for `watch-ios/Tests/`), so
 * the enforceable technique is the one Stories 16.26/16.27/16.37 established: lift the shipped
 * declarations and execute them under `xcrun swift`.
 */

const repoRoot = path.resolve(__dirname, '../../..');
const watchDir = path.join(repoRoot, 'targets', 'watch');
const colorHelpersPath = path.join(watchDir, 'ColorHelpers.swift');
const cardListViewPath = path.join(watchDir, 'CardListView.swift');
const contentViewPath = path.join(watchDir, 'ContentView.swift');
const HELPERS = 'ColorHelpers.swift';

const readSource = (filePath: string) => fs.readFileSync(filePath, 'utf8');

/**
 * `source` with its comments removed. Several comments in the watch target quote the values
 * Story 23.2 retired, in order to explain them; an absence assertion has to read code only. A
 * `//` straight after a `:` is kept, so a URL inside a string literal is not cut short.
 */
const codeOnly = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/** Every Swift file the watch app compiles — `Generated/` included — as code only, by name. */
const watchSwiftCode = () =>
  fs
    .readdirSync(watchDir, { recursive: true, encoding: 'utf8' })
    .filter((relative) => relative.endsWith('.swift') && !relative.includes('__tests__'))
    .sort()
    .map((relative) => ({
      file: relative,
      code: codeOnly(readSource(path.join(watchDir, relative)))
    }));

/**
 * A system or semantic colour, or a colour not built through the shared palette: the system set
 * (`.blue` … `.brown`), the semantic styles (`.primary`, `.secondary`, `.tertiary`), the accent
 * colour, white/hue/colour-space initialisers, an asset-catalogue `Color("…")`, and `.tint(`.
 */
const SYSTEM_OR_UNSHARED_COLOUR = new RegExp(
  [
    String.raw`(?:\bColor)?\.(?:blue|red|green|orange|gray|grey|yellow|cyan|purple|pink|mint|teal|indigo|brown|primary|secondary|tertiary|accentColor)\b`,
    String.raw`\bColor\(\s*(?:white:|hue:|\.sRGB\b|\.displayP3\b|")`,
    String.raw`\.tint\(`
  ].join('|'),
  'g'
);

/** The argument of every `.foregroundColor(…)` / `.foregroundStyle(…)`, whitespace-collapsed. */
const foregroundArguments = (code: string) =>
  [...code.matchAll(/\.foreground(?:Color|Style)\(/g)].map((match) => {
    const start = (match.index ?? 0) + match[0].length;
    let depth = 1;
    let end = start;

    while (end < code.length && depth > 0) {
      if (code[end] === '(') depth += 1;
      if (code[end] === ')') depth -= 1;
      end += 1;
    }

    return code
      .slice(start, end - 1)
      .replace(/\s+/g, ' ')
      .trim();
  });

/** How many times `needle` occurs in the code of the whole watch target, case-insensitively. */
const occurrencesInTarget = (needle: string) =>
  watchSwiftCode().reduce(
    (total, { code }) => total + (code.toUpperCase().split(needle.toUpperCase()).length - 1),
    0
  );

/** A `CardListView` computed property or view function, sliced whole and whitespace-normalised. */
const rowProperty = (source: string, signature: string) =>
  swiftDeclaration(source, signature, 'CardListView.swift')
    .replace(/\/\/.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Lift the framework-free half of `ColorHelpers.swift` and drive it from stdin.
 *
 * Only the declarations that need no SwiftUI are taken, so the harness runs under the macOS SDK
 * without dragging `Color` in. `namedCardHex` is `private` at file scope, which is exactly the
 * scope the harness gives it.
 */
const buildHarness = () => {
  const source = readSource(colorHelpersPath);

  return [
    'import Foundation',
    swiftDeclaration(source, 'private let namedCardHex: [String: String] = [', HELPERS),
    swiftDeclaration(source, 'func resolvedCardHex(_ raw: String?) -> String? {', HELPERS),
    swiftDeclaration(source, 'func relativeLuminance(hex: String) -> Double {', HELPERS),
    swiftDeclaration(
      source,
      'func shouldUseWhiteText(onBackgroundHex hex: String) -> Bool {',
      HELPERS
    ),
    swiftDeclaration(source, 'func isNearBlack(hex: String) -> Bool {', HELPERS),
    // The row's two decisions, reproduced from `CardListView`'s `needsNearBlackHairline` and
    // `prefersCreamInitials`. They cannot be lifted — they are properties of a view that owns a
    // `card` — so the `?? false` / `?? true` defaults are pinned separately, in the static test
    // below, and a flip there fails that test rather than silently passing this harness.
    'func hairline(_ raw: String?) -> Bool { resolvedCardHex(raw).map(isNearBlack(hex:)) ?? false }',
    'func creamInitials(_ raw: String?) -> Bool {',
    '    resolvedCardHex(raw).map(shouldUseWhiteText(onBackgroundHex:)) ?? true',
    '}',
    [
      'while let line = readLine() {',
      '    let raw = line == "<empty>" ? "" : (line == "<blank>" ? "   " : line)',
      '    let hex = resolvedCardHex(raw) ?? "nil"',
      '    print("\\(line)~hex=\\(hex)~hairline=\\(hairline(raw))~cream=\\(creamInitials(raw))")',
      '}'
    ].join('\n')
  ].join('\n\n');
};

/** Run every raw colour value through the shipped resolver in one `xcrun swift` process. */
const runHarness = (values: readonly string[]) => {
  const stdout = runSwiftProgram({
    program: buildHarness(),
    input: values.join('\n'),
    label: HELPERS,
    hint:
      'These helpers decide what colour every card row paints, whether it takes the near-black ' +
      'hairline, and whether its initials are legible. A failure here means the watch is drawing ' +
      'a different colour from the one the user picked on the phone.'
  });

  const rows = new Map<string, string[]>();

  for (const line of stdout.split('\n').filter(Boolean)) {
    const [key, ...fields] = line.split('~');

    if (key) {
      rows.set(key, fields);
    }
  }

  return (key: string) => {
    const row = rows.get(key);

    if (!row) {
      throw new Error(`The harness returned no row for "${key}"`);
    }

    return row;
  };
};

describe('watch card colour contract (Story 16.41)', () => {
  it('never hands a raw wire value to a luminance helper', () => {
    const cardListView = readSource(cardListViewPath);

    // The defect in one line: `isNearBlack(hex: resolvedColorHex)` scored a palette key. Both
    // helpers take a hex and BOTH have a silent wrong answer for anything else, so the row must
    // reach them only through the resolved optional.
    expect(cardListView).toContain('resolvedAccentHex.map(isNearBlack(hex:)) ?? false');
    expect(cardListView).toContain(
      'resolvedAccentHex.map(shouldUseWhiteText(onBackgroundHex:)) ?? true'
    );

    // `?? ""` is the trap dressed as a fix: an empty string is not six characters, so it scores
    // 0.0 and lands back on "black". The decision is defaulted, never the string.
    expect(cardListView).not.toMatch(/resolvedCardHex\([^)]*\)\s*\?\?\s*""/);

    // And nothing else in the view may score a value directly. Matches only a call that PASSES an
    // argument — `[^)\s]` after the label excludes the bare method references `isNearBlack(hex:)`
    // and `shouldUseWhiteText(onBackgroundHex:)` asserted above, which are the correct shape. The
    // `\s*` after `(` is deliberate: without it a violation wrapped across lines by a formatter
    // slips through, which is a guard that reports clean rather than one that reports nothing.
    const luminanceCalls = [
      ...cardListView.matchAll(
        /(?:isNearBlack|shouldUseWhiteText)\(\s*(?:hex|onBackgroundHex):\s*[^)\s]/g
      )
    ].map((match) => match[0].replace(/\s+/g, ' '));

    expect(luminanceCalls).toEqual([]);
  });

  it('pins the whole derivation chain, not just the two calls at the end of it', () => {
    // ⚠️ THIS TEST EXISTS BECAUSE THE GUARD ABOVE IS NOT ENOUGH, and that was proven rather than
    // guessed. Changing `resolvedAccentHex` to return `rawColorValue` — dropping the resolution
    // entirely — reintroduces the exact reported defect (hairline on every row, white initials on
    // amber) while the Swift typecheck AND all four assertions above stay green: they pin the
    // shape of the two call sites that READ `resolvedAccentHex`, and say nothing about what it
    // computes. Pinning the leaves of a chain does not pin the chain.
    //
    // So the five properties are pinned whole. They are deliberately exact rather than
    // `toContain`: this region resolves a value the type system cannot distinguish from a hex
    // (both are `String`), so a compiler can never object to getting it wrong, and every defect in
    // this story lived here. A failure prints the property that moved.
    const cardListView = readSource(cardListViewPath);

    expect({
      rawColorValue: rowProperty(cardListView, 'private var rawColorValue: String {'),
      resolvedAccentHex: rowProperty(cardListView, 'private var resolvedAccentHex: String? {'),
      accentColor: rowProperty(cardListView, 'private var accentColor: Color {'),
      needsNearBlackHairline: rowProperty(
        cardListView,
        'private var needsNearBlackHairline: Bool {'
      ),
      prefersCreamInitials: rowProperty(cardListView, 'private var prefersCreamInitials: Bool {')
    }).toEqual({
      // The raw wire value, and the ONLY property allowed to hold one.
      rawColorValue:
        'private var rawColorValue: String { if let brand = resolvedBrand { return card.colorHex ?? "#\\(String(format: "%06X", abs(brand.id.hashValue) % 0xFFFFFF))" } return card.colorHex ?? "" }',
      // The single resolution. Everything below reads THIS, never `rawColorValue`.
      resolvedAccentHex:
        'private var resolvedAccentHex: String? { resolvedCardHex(rawColorValue) }',
      // Story 23.2: an unresolvable colour takes the palette's azure default, no longer the
      // system `.gray` — a system colour is not a value (watch grammar §4.2).
      accentColor:
        'private var accentColor: Color { resolvedAccentHex.map(parseHexColor) ?? defaultCardAccent }',
      needsNearBlackHairline:
        'private var needsNearBlackHairline: Bool { resolvedAccentHex.map(isNearBlack(hex:)) ?? false }',
      // Story 23.2: cream and ink, not white and black — renamed so the name says what it picks.
      prefersCreamInitials:
        'private var prefersCreamInitials: Bool { resolvedAccentHex.map(shouldUseWhiteText(onBackgroundHex:)) ?? true }'
    });
  });

  it('pins the four places the view actually READS those properties', () => {
    // ⚠️ AGAIN PROVEN, NOT GUESSED, AND BY THE SAME METHOD AS THE TEST ABOVE. Pinning the five
    // property definitions still leaves them ignorable: changing only `.fill(accentColor)` to
    // `.fill(Color.gray)` and the stroke to `.stroke(Color.clear, …)` — touching no property body —
    // renders EVERY card flat grey and removes the hairline permanently, including for a genuinely
    // black accent, and the Swift typecheck plus every other assertion here stays green. That is a
    // worse regression than the one this story fixed.
    //
    // So the chain is pinned at both ends: what the properties compute (above) and where the view
    // consumes them (here). ⚠️ Honest limit: these are still TEXT pins. They catch a property that
    // stops being read, which is the realistic regression; they cannot catch a colour masked by
    // some later modifier. Only a rendered-view assertion would, and watchOS has no snapshot
    // harness in this repo — the simulator pass in the story's AC8 is what covers that today.
    const cardListView = readSource(cardListViewPath);

    // The accent bar and the hairline, in `body`. Counted, not merely present, so a second
    // conflicting `fill`/`stroke` cannot be introduced alongside the pinned one. The hairline is
    // the system's dark outline `#3A3A48` since Story 23.2, and the old white-at-15 % is gone.
    expect({
      accentBar: cardListView.split('.fill(accentColor)').length - 1,
      hairline:
        cardListView.split(
          '.stroke(needsNearBlackHairline ? WatchColor.hairline : Color.clear, lineWidth: 1)'
        ).length - 1,
      oldHairline: cardListView.split('Color.white.opacity(0.15)').length - 1
    }).toEqual({ accentBar: 1, hairline: 1, oldHairline: 0 });

    // The avatar fill and its initials colour, pinned whole — both live in this one small function.
    // Cream on a dark accent, ink on a light one: the watch frames' rule (Story 23.2), which
    // replaced white and black.
    expect(
      rowProperty(cardListView, 'private func initialsAvatar(text: String) -> some View {')
    ).toBe(
      'private func initialsAvatar(text: String) -> some View { ZStack { accentColor Text(text) ' +
        '.font(.system(size: 12, weight: .bold)) .foregroundColor(prefersCreamInitials ? WatchColor.cream : WatchColor.ink) } }'
    );
  });

  it('documents the field as a key rather than the hex its name promises', () => {
    // `colorHex` is named for a hex and carries a key. The comment is the only thing standing
    // between the next reader and the same mistake.
    expect(readSource(cardListViewPath)).toMatch(/let colorHex: String\?\s+\/\/ palette KEY/);
  });

  describeOnMac('executed against the real Swift resolver', () => {
    it('scores each key on its RESOLVED hex rather than on the key text', () => {
      // The regression, stated as data: before the fix every one of these returned
      // hairline=true AND light initials, because no key is six characters long so all six
      // scored luminance 0 — black. These are the adjudicated per-accent outcomes under the
      // Cardì palette (Story 21.2a), written out rather than recomputed from the thresholds,
      // because recomputing them here would just re-implement the code under test. `cream` is
      // the light side of the initials decision since Story 23.2 (it was white); `false` is ink.
      const expected = {
        // ⚠️ Deep blue is GENUINELY near-black — L=0.049758, `0.00024` under the 0.05 threshold —
        // so it keeps the hairline, and that is correct: at that luminance the avatar really does
        // recede into the near-black row. It is the only accent that does.
        blue: { hairline: true, cream: true },
        red: { hairline: false, cream: true },
        green: { hairline: false, cream: true },
        // ⚠️ `orange` is the beam YELLOW (the key is deliberately misnamed — see `namedCardHex`).
        // A light letter on it is unreadable (white was 1.52:1); ink is the dark side. This is the
        // single most legible-or-not decision in the row, and the pre-fix code got it wrong in the
        // unreadable direction.
        orange: { hairline: false, cream: false },
        grey: { hairline: false, cream: true },
        gray: { hairline: false, cream: true }
      } as const;

      const keys = Object.keys(expected) as (keyof typeof expected)[];
      const row = runHarness(keys);

      for (const key of keys) {
        const hex =
          key === 'gray' ? CARD_COLORS.grey : CARD_COLORS[key as keyof typeof CARD_COLORS];

        expect({ key, fields: row(key) }).toEqual({
          key,
          fields: [
            `hex=${hex.toUpperCase()}`,
            `hairline=${expected[key].hairline}`,
            `cream=${expected[key].cream}`
          ]
        });
      }
    });

    it('still draws the hairline for a genuinely near-black accent', () => {
      // The feature itself, which the fix must not remove: a brand that really is black still
      // needs the border to separate it from the near-black row. `#111111` is the last step
      // inside the 0.05 threshold; `#808080` is comfortably outside it.
      const values = ['#000000', '#0A0A0A', '#111111', '#808080'] as const;
      const row = runHarness(values);

      expect(values.map((value) => `${value} ${row(value)[1]}`)).toEqual([
        '#000000 hairline=true',
        '#0A0A0A hairline=true',
        '#111111 hairline=true',
        '#808080 hairline=false'
      ]);
    });

    it('defaults an unusable colour to no hairline and cream initials', () => {
      // Absent or malformed input must not fabricate a border. Light initials on the fallback
      // fill match the complication's `WidgetCardPalette.prefersWhiteForeground`, which also
      // defaults to light for an unknown colour.
      const values = ['<empty>', '<blank>', 'not-a-colour', '#badhex', '#FFF'] as const;
      const row = runHarness(values);

      for (const value of values) {
        expect({ value, fields: row(value) }).toEqual({
          value,
          fields: ['hex=nil', 'hairline=false', 'cream=true']
        });
      }
    });

    it('defaults those two decisions to exactly what the azure fallback itself scores', () => {
      // Story 23.2 made the fallback FILL azure (it was the system `.gray`). The two defaulted
      // DECISIONS — `?? false` for the hairline, `?? true` for cream initials — are still taken
      // without a hex, so they must agree with what azure would score were it resolved. If a
      // later default accent were near black, or light, this is where the mismatch shows.
      const azure = CARD_COLORS[DEFAULT_CARD_COLOR];
      const row = runHarness([azure]);

      expect(row(azure)).toEqual([`hex=${azure.toUpperCase()}`, 'hairline=false', 'cream=true']);
    });

    it('normalises a named key the way it normalises a hex', () => {
      // Defensive rather than reachable: `CARD_COLOR_KEYS` on the wire is always lower-case
      // (`core/schemas/card.ts:23`). Covered anyway because the hex branch IS covered, and a
      // resolver that normalises one input shape but not the other is a trap for the next reader.
      const values = ['BLUE', ' green ', 'Grey', 'GRAY'] as const;
      const row = runHarness(values);

      expect(values.map((value) => `${value.trim()} ${row(value)[0]}`)).toEqual([
        `BLUE hex=${CARD_COLORS.blue.toUpperCase()}`,
        `green hex=${CARD_COLORS.green.toUpperCase()}`,
        `Grey hex=${CARD_COLORS.grey.toUpperCase()}`,
        `GRAY hex=${CARD_COLORS.grey.toUpperCase()}`
      ]);
    });

    it('reads an arbitrary brand hex through the same door as a key', () => {
      // Catalogue artwork and user colours share one resolver, so a `#RRGGBB` still works and
      // normalises — case and a missing `#` included.
      const values = ['#1a73e8', '1A73E8', '#F59E0B'] as const;
      const row = runHarness(values);

      expect(values.map((value) => row(value).join(' '))).toEqual([
        'hex=#1A73E8 hairline=false cream=true',
        'hex=#1A73E8 hairline=false cream=true',
        'hex=#F59E0B hairline=false cream=false'
      ]);
    });
  });
});

describe('Cardì watch colours (Story 23.2, watch grammar §4)', () => {
  it('defines each colour once, in ColorHelpers.swift, at the design-token value', () => {
    // The grammar's chrome values, read from the tokens rather than retyped: ink, beam and cream
    // are the identity colours, and the ground and the hairline are the dark theme's background
    // and border. A drifted hex, a reordered member or a site-local copy all fail here.
    expect(rowProperty(readSource(colorHelpersPath), 'enum WatchColor {')).toBe(
      [
        'enum WatchColor {',
        `static let ground = parseHexColor("${DARK_THEME_COLORS.background}")`,
        `static let ink = parseHexColor("${IDENTITY_COLORS.ink}")`,
        `static let beam = parseHexColor("${IDENTITY_COLORS.beam}")`,
        `static let cream = parseHexColor("${IDENTITY_COLORS.cream}")`,
        'static let creamSecondary = cream.opacity(0.6)',
        `static let hairline = parseHexColor("${DARK_THEME_COLORS.border}")`,
        '}'
      ].join(' ')
    );

    // ONCE: no view parses a colour literal of its own, and each value is spelled exactly once
    // in the whole target. Beam's hex is also the `orange` card accent's in `namedCardHex` — two
    // roles on one value — so it is counted as one chrome definition plus that one accent entry.
    const parsedLiterals = watchSwiftCode().flatMap(({ file, code }) =>
      [...code.matchAll(/parseHexColor\("#[0-9A-Fa-f]{6}"\)/g)].map(
        (match) => `${file} ${match[0]}`
      )
    );

    expect(parsedLiterals).toEqual([
      `ColorHelpers.swift parseHexColor("${DARK_THEME_COLORS.background}")`,
      `ColorHelpers.swift parseHexColor("${IDENTITY_COLORS.ink}")`,
      `ColorHelpers.swift parseHexColor("${IDENTITY_COLORS.beam}")`,
      `ColorHelpers.swift parseHexColor("${IDENTITY_COLORS.cream}")`,
      `ColorHelpers.swift parseHexColor("${DARK_THEME_COLORS.border}")`
    ]);
    expect({
      ink: occurrencesInTarget(IDENTITY_COLORS.ink.slice(1)),
      cream: occurrencesInTarget(IDENTITY_COLORS.cream.slice(1)),
      hairline: occurrencesInTarget(DARK_THEME_COLORS.border.slice(1)),
      beam: occurrencesInTarget(IDENTITY_COLORS.beam.slice(1)),
      beamAsTheOrangeAccent: occurrencesInTarget(`"orange": "${IDENTITY_COLORS.beam}"`)
    }).toEqual({ ink: 1, cream: 1, hairline: 1, beam: 2, beamAsTheOrangeAccent: 1 });

    // And no view builds a colour from components, which is how `#1C1C1F` used to be written.
    expect(
      watchSwiftCode()
        .filter(({ code }) => /Color\(\s*red:/.test(code))
        .map(({ file }) => file)
    ).toEqual(['ColorHelpers.swift']);
  });

  it('keeps the five card accents, as hexes, and removes every pre-Cardì value', () => {
    // The five Cardì accents stay where Story 21.2a put them; the grammar's compliance table
    // asks for them present and for every value they replaced absent.
    for (const hex of Object.values(CARD_COLORS)) {
      expect(occurrencesInTarget(hex.slice(1))).toBeGreaterThan(0);
    }

    // `1C1C1F` the old row fill, `F59E0B` the banned orange, `FFCC00` the system yellow that is
    // Esselunga's own — and the two retired greys. Absent from the code of the whole target.
    for (const retired of ['1C1C1F', 'F59E0B', 'FFCC00', '9CA3AF', '64748B']) {
      expect({ retired, occurrences: occurrencesInTarget(retired) }).toEqual({
        retired,
        occurrences: 0
      });
    }

    // No system colour stands in for a card, a star or a fallback anywhere (`.yellow`, `.gray`,
    // `Color.blue/.red/.green/.orange` and the rest of the system set, the semantic styles), no
    // colour is built any other way (white or hue components, a colour space, an asset-catalogue
    // lookup — `parseHexColor("` is word-joined, so `\bColor\(` does not match it), no view
    // reads the accent colour, and nothing re-tints a subtree.
    const systemColours = watchSwiftCode().flatMap(({ file, code }) =>
      [...code.matchAll(SYSTEM_OR_UNSHARED_COLOUR)].map((match) => `${file} ${match[0]}`)
    );

    expect(systemColours).toEqual([]);
  });

  it('adds no custom typeface, press scale or shadow anywhere in the watch app', () => {
    // The frozen block's other absences (grammar's Forbidden list): no custom typeface (§5.2), no
    // hand-rolled 0.98 press scale (§3.1, the platform's own feedback stays) and no shadow. The
    // barcode digits' `UIFont.monospacedDigitSystemFont` is the system face and does not match.
    const forbiddenTreatments = watchSwiftCode().flatMap(({ file, code }) =>
      [
        ...code.matchAll(/\.shadow\(|\bscaleEffect\(|\bFont\.custom\(|\.custom\("|UIFont\(name:/g)
      ].map((match) => `${file} ${match[0]}`)
    );

    expect(forbiddenTreatments).toEqual([]);
  });

  it('paints the row, the list, the empty state and the picker from those colours only', () => {
    const cardListCode = codeOnly(readSource(cardListViewPath));

    // Every foreground in the file, in order, pinned whole — argument read to its balanced
    // closing paren, so a call wrapped across lines is caught too. A new label painted any other
    // way — a bare `.white`, an opacity of white, a literal — adds an entry here and fails.
    const foregrounds = foregroundArguments(cardListCode);

    expect(foregrounds).toEqual([
      'WatchColor.cream', // the card name
      'WatchColor.beam', // the favourite star
      'prefersCreamInitials ? WatchColor.cream : WatchColor.ink', // the initials
      'WatchColor.creamSecondary', // the "unavailable" line
      'WatchColor.cream.opacity(0.5)', // the empty-state glyph
      'WatchColor.cream', // the empty-state title
      'WatchColor.creamSecondary', // the empty-state subtitle
      'isSelected ? WatchColor.beam : WatchColor.cream', // a sort option
      'WatchColor.beam' // the sort checkmark
    ]);

    // Ink rows (the card row and the sort option) on the true-black ground (the list, the
    // "unavailable" screen, the picker, and the app's root view).
    expect(cardListCode.split('.fill(WatchColor.ink)').length - 1).toBe(2);
    expect(cardListCode.split('.background(WatchColor.ground)').length - 1).toBe(3);
    expect(codeOnly(readSource(contentViewPath))).toContain('.background(WatchColor.ground)');

    // The only white or black left in the file is the logo chip's own backing, which the story
    // keeps: it is the plate a brand's artwork was drawn for, not chrome.
    const whiteOrBlack = cardListCode
      .split('\n')
      .filter((line) => /\.(?:white|black)\b/.test(line))
      .map((line) => line.trim());

    expect(whiteOrBlack).toEqual(['prefersDarkBacking ? Color.black : Color.white']);
  });

  it('draws the favourite star in beam, 13, trailing, with no plate behind it', () => {
    // Pinned whole so a plate (a background, a circle, a ZStack) or a second colour cannot be
    // added around the glyph without failing (grammar §4.4: "no plate on the watch").
    expect(rowProperty(readSource(cardListViewPath), 'if card.isFavorite {')).toBe(
      'if card.isFavorite { Image(systemName: "star.fill") .font(.system(size: 13)) ' +
        '.foregroundColor(WatchColor.beam) .accessibilityHidden(true) }'
    );

    // Trailing: the row's `Spacer()` sits straight before the star and pushes it to the end.
    expect(codeOnly(readSource(cardListViewPath))).toMatch(/Spacer\(\)\s*if card\.isFavorite \{/);
  });

  it('double-encodes the selected sort option: beam label, semibold, beam checkmark, a trait', () => {
    const cardListCode = codeOnly(readSource(cardListViewPath));
    const pickerCode = cardListCode.slice(
      cardListCode.indexOf('struct WatchSortPickerView: View {')
    );

    expect(pickerCode).toContain('struct WatchSortPickerView: View {');

    // Grammar §8.1: the colour changes, not the control — and the weight moves with it, so the
    // selection is never carried by colour alone.
    expect(pickerCode).toContain('.fontWeight(isSelected ? .semibold : .regular)');
    expect(pickerCode).toContain(
      '.foregroundStyle(isSelected ? WatchColor.beam : WatchColor.cream)'
    );
    expect(pickerCode).toContain('Image(systemName: "checkmark")');
    expect(pickerCode).toContain('.accessibilityAddTraits(isSelected ? .isSelected : [])');
    expect(pickerCode).not.toContain('Circle()');
  });

  it('falls back to azure, the palette default, never a system colour', () => {
    const helpers = readSource(colorHelpersPath);
    const rgb = /private let defaultCardAccentRGB: UInt64 = 0x([0-9A-Fa-f]{6})\b/.exec(
      codeOnly(helpers)
    )?.[1];

    // The phone's named default (Story 21.2a, AC4) — the same accent Wear's `DEFAULT_CARD_ACCENT`
    // mirrors — so all three surfaces draw an unreadable colour alike.
    expect(`#${rgb}`.toUpperCase()).toBe(CARD_COLORS[DEFAULT_CARD_COLOR].toUpperCase());
    expect(codeOnly(helpers)).toContain('let defaultCardAccent = rgbColor(defaultCardAccentRGB)');

    // Both helpers' unparseable branches take it — and so does the row (pinned above).
    expect(rowProperty(helpers, 'func parseHexColor(_ hex: String) -> Color {')).toContain(
      'guard h.count == 6, let rgb = UInt64(h, radix: 16) else { return defaultCardAccent }'
    );
    expect(rowProperty(helpers, 'func mapColor(hex: String?) -> Color? {')).toContain(
      'guard let resolved = resolvedCardHex(raw) else { return defaultCardAccent }'
    );
  });
});

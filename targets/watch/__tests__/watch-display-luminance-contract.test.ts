import fs from 'node:fs';
import path from 'node:path';

import { describeOnMac, runSwiftProgram, swiftDeclaration } from './swift-source-helpers';

/**
 * Story 16.26 — hold the barcode readable while the Apple Watch display dims.
 *
 * watchOS exposes no way to force full luminance. Compile-probed against
 * `WatchOS26.5.sdk` at the target's own deployment floor (watchOS 10.0): `UIScreen` is
 * `API_UNAVAILABLE(watchos)`, `WKInterfaceDevice` has no `brightness`, and the only
 * keep-awake property that ever existed — `WKExtension.frontmostTimeoutExtended` — is
 * `WK_DEPRECATED_WATCHOS(4.0, 7.0, "No longer supported")`. `WKExtendedRuntimeSession`
 * links, but it keeps the *app* running "even after the watch's screen turns off": it
 * never holds the display, so it cannot deliver the story's AC2 even setting aside the
 * `WKBackgroundModes` claim Apple's own guidance forbids ("Select a session type based
 * on the app's intended use—not based on the features that the session provides").
 *
 * What the platform does give is NOTICE. `WKSupportsAlwaysOnDisplay` defaults to true
 * for watchOS 8+, so on wrist-down the system keeps this view on screen — dimmed, not
 * blurred — and sets `\isLuminanceReduced`. The symbol is therefore still in front of
 * the scanner, and what the app draws in that state is the one real lever.
 *
 * ⚠️ These tests exist because the OBVIOUS implementation is wrong twice over, and both
 * mistakes are silent:
 *
 *  1. Apple's `isLuminanceReduced` guidance is to "lower the overall brightness of your
 *     view … change large, filled shapes to be stroked, and choose less bright colors."
 *     On a barcode that is destructive — the pure-black/pure-white pair is the signal a
 *     1D decoder normalises its narrow element against (Story 16.23). So the symbol's
 *     ink is pinned here, and following the platform example has to fail this suite.
 *  2. Branching the LAYOUT on luminance re-plans the module — and possibly the
 *     orientation — at the exact moment the wrist drops. `showsValueLabel` feeds
 *     `footerReservedHeight`, which feeds the height the module divides
 *     (`WatchPresentationLayout.swift`), so a naive `showsValueLabel: !isLuminanceReduced`
 *     flips geometry mid-scan. The invariance test below runs the SHIPPED solver in both
 *     luminance states across all seven watches and demands identical pixels.
 *
 * Neither is a runtime display state this suite can observe — that is AC5, on real
 * hardware. What it can do is run the pure policy and the pure geometry solver, which is
 * the same standard Stories 16.27 and 16.37 set for the watch's untested Swift.
 */

const repoRoot = path.resolve(__dirname, '../../..');
const watchDir = path.join(repoRoot, 'targets', 'watch');
const barcodeViewPath = path.join(watchDir, 'BarcodeFlashView.swift');
const layoutPath = path.join(watchDir, 'WatchPresentationLayout.swift');
const generatorPath = path.join(watchDir, 'BarcodeGenerator.swift');
const infoPlistPath = path.join(watchDir, 'Info.plist');

const LAYOUT = 'WatchPresentationLayout.swift';
const GENERATOR = 'BarcodeGenerator.swift';

/**
 * Every Apple Watch that runs watchOS 10, in points, with the ×2 scale — the same table
 * `watch-layout-contract.test.ts` derives from Xcode's simulator device profiles. The
 * invariance claim has to hold on all of them, not on one.
 */
const WATCH_SCREENS = [
  { name: '40 mm', width: 162, height: 197 },
  { name: '41 mm', width: 176, height: 215 },
  { name: '42 mm', width: 187, height: 223 },
  { name: '44 mm', width: 184, height: 224 },
  { name: '45 mm', width: 198, height: 242 },
  { name: '46 mm', width: 208, height: 248 },
  { name: '49 mm', width: 205, height: 251 }
] as const;

const WATCH_SCALE = 2;

/**
 * Symbol widths in module units, quiet zones excluded — as
 * `BarcodeGenerator.symbolModuleUnits` reports them. EAN-13 is the common case, Code128
 * the widest, EAN-8 the shortest; QR takes the square-fit branch with no module plan.
 */
const SYMBOLS = [
  { label: 'EAN-13', format: 'EAN13', units: 95 },
  { label: 'Code128 13-digit', format: 'CODE128', units: 123 },
  { label: 'EAN-8', format: 'EAN8', units: 67 },
  { label: 'QR', format: 'QR', units: null }
] as const;

/**
 * `source` with comments stripped.
 *
 * Assertions that a construct is ABSENT must read code only: the doc comments below
 * quote the modifiers they exist to forbid, so a naive `not.toContain` would match the
 * prose and fail for the wrong reason.
 */
const withoutComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const readSwift = (filePath: string) => fs.readFileSync(filePath, 'utf8');

/**
 * The luminance policy and the geometry solver, lifted out of the shipped source and
 * assembled into a runnable program.
 *
 * The geometry types come along because the invariance test has to run the REAL
 * composition — policy feeding `WatchBarcodeLayoutMetrics.make` — rather than a
 * restatement of it. Proving the policy alone would leave the part that actually moves
 * pixels untested.
 */
const buildHarness = () => {
  const layout = readSwift(layoutPath);
  const generator = readSwift(generatorPath);

  return [
    'import CoreGraphics',
    'import Foundation',
    swiftDeclaration(generator, 'enum WatchBarcodeFormat: String {', GENERATOR),
    swiftDeclaration(generator, 'struct WatchBarcodeQuietZone: Equatable {', GENERATOR),
    swiftDeclaration(layout, 'enum WatchDisplayMetrics {', LAYOUT),
    swiftDeclaration(layout, 'enum WatchBarcodeOrientation: String {', LAYOUT),
    swiftDeclaration(layout, 'struct WatchBarcodeAxisBudget: Equatable {', LAYOUT),
    swiftDeclaration(layout, 'struct WatchBarcodeModulePlan: Equatable {', LAYOUT),
    swiftDeclaration(layout, 'struct WatchBarcodeBar: Equatable {', LAYOUT),
    swiftDeclaration(layout, 'enum WatchBarcodeBarLayout {', LAYOUT),
    swiftDeclaration(layout, 'struct WatchBarcodeLuminancePresentation: Equatable {', LAYOUT),
    swiftDeclaration(layout, 'struct WatchBarcodeLayoutMetrics {', LAYOUT),
    // Two modes keyed by the first field. A line the harness cannot parse is skipped
    // rather than guessed, so a malformed case surfaces as a missing row instead of a
    // passing assertion about nothing.
    `func geometry(
  width: Double, height: Double, format: String, units: Int?, showsValueLabel: Bool
) -> String {
  let metrics = WatchBarcodeLayoutMetrics.make(
    containerSize: CGSize(width: width, height: height),
    formatString: format,
    symbolUnits: units,
    showsValueLabel: showsValueLabel,
    scale: CGFloat(${WATCH_SCALE}),
    currentOrientation: nil)

  return [
    "\\(Int(metrics.barcodePixelSize.width))x\\(Int(metrics.barcodePixelSize.height))px",
    metrics.modulePlan?.orientation.rawValue ?? "none",
    "module=\\(metrics.modulePlan?.modulePixelWidth ?? 0)",
    "footer=\\(Double(metrics.footerReservedHeight))"
  ].joined(separator: ",")
}

while let line = readLine(strippingNewline: true) {
  let f = line.split(separator: "|", omittingEmptySubsequences: false).map(String.init)

  if f.first == "policy" {
    guard f.count == 4 else { continue }
    let p = WatchBarcodeLuminancePresentation.make(
      isLuminanceReduced: f[1] == "1", hasValue: f[2] == "1",
      orientation: WatchBarcodeOrientation(rawValue: f[3]))

    print(line + "~glyphs=\\(p.drawsValueGlyphs)~strip=\\(p.reservesValueStrip)")
    continue
  }

  if f.first == "invariance" {
    guard f.count == 6, let width = Double(f[1]), let height = Double(f[2]),
      let units = Int(f[4])
    else { continue }
    let symbolUnits: Int? = units < 0 ? nil : units
    // The composition under test: the policy decides what the layout is told, for each
    // luminance state, and the shipped solver plans from that.
    // The dimmed case is asked with the ROTATED orientation on purpose: that is the one
    // combination that suppresses the glyphs, so if the strip could ever follow the
    // glyphs this is where it would show. Backticks are avoided in this block — it is
    // inside a TS template literal.
    let awake = WatchBarcodeLuminancePresentation.make(
      isLuminanceReduced: false, hasValue: f[5] == "1", orientation: .horizontal)
    let dimmed = WatchBarcodeLuminancePresentation.make(
      isLuminanceReduced: true, hasValue: f[5] == "1", orientation: .rotated)

    print(
      line
        + "~" + geometry(
          width: width, height: height, format: f[3], units: symbolUnits,
          showsValueLabel: awake.reservesValueStrip)
        + "~" + geometry(
          width: width, height: height, format: f[3], units: symbolUnits,
          showsValueLabel: dimmed.reservesValueStrip))
    continue
  }
}`
  ].join('\n\n');
};

/** Run every case through the shipped policy and solver in one `xcrun swift` process. */
const runHarness = (keys: readonly string[]) => {
  const stdout = runSwiftProgram({
    program: buildHarness(),
    input: keys.join('\n'),
    label: LAYOUT,
    hint:
      'The luminance policy decides what the barcode screen draws when the wrist drops, ' +
      'and feeds the geometry solver. A failure here means the symbol can be re-planned ' +
      'or re-inked mid-scan — which is the whole defect Story 16.26 exists to prevent.'
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

describe('watch display luminance contract (Story 16.26)', () => {
  it('observes the one display-state signal watchOS actually offers', () => {
    const barcodeView = readSwift(barcodeViewPath);

    // The AC3 branch. There is no brightness API to call, so the screen reacts to the
    // dimmed Always-On state instead of trying to prevent it.
    expect(barcodeView).toContain('@Environment(\\.isLuminanceReduced)');
  });

  it('never claims a WKBackgroundModes session type it cannot honestly describe (AC1)', () => {
    const infoPlist = readSwift(infoPlistPath);
    const targetConfig = readSwift(path.join(watchDir, 'expo-target.config.js'));

    // AC1 ruled out `WKExtendedRuntimeSession` three times over: it keeps the app alive
    // rather than the display, Apple says to pick a session type by intended use and not
    // by its side-effects, and Apple invalidates a frontmost session when the user PRESSES
    // the Digital Crown (Story 16.26 counted that press as this screen's dismissal; the
    // crown's rotation, which also dismissed it, went in Story 23.2). The determination is
    // only durable if the artifact stays clean — an entitlement added later would ship the
    // App Review risk for none of the benefit.
    expect(infoPlist).not.toContain('WKBackgroundModes');
    expect(targetConfig).not.toContain('WKBackgroundModes');

    for (const source of [
      readSwift(barcodeViewPath),
      readSwift(path.join(watchDir, 'BarcodePagerView.swift')),
      readSwift(layoutPath)
    ]) {
      expect(withoutComments(source)).not.toContain('WKExtendedRuntimeSession');
    }
  });

  it('leaves Always On enabled so wrist-down dims the barcode instead of blurring it', () => {
    const infoPlist = readSwift(infoPlistPath);

    // `WKSupportsAlwaysOnDisplay` defaults to true for watchOS 8+, which is why the
    // symbol stays on screen — and readable — when the wrist drops. Setting it false
    // restores the pre-watchOS-8 behaviour and BLURS the view, which would defeat this
    // story outright. Absent is correct; the assertion guards against a later addition.
    expect(infoPlist).not.toContain('WKSupportsAlwaysOnDisplay');
  });

  it('holds the symbol at maximum contrast, refusing the platform dimming example (AC3)', () => {
    const code = withoutComments(readSwift(barcodeViewPath));

    // Apple's own `isLuminanceReduced` example strokes filled shapes and picks "less
    // bright colors". For a barcode that is the defect, not the fix: the black/white
    // pair IS the signal. So the white backing stays a full-opacity white fill and the
    // symbol carries no luminance-dependent ink.
    expect(code).toContain('.fill(Color.white)');

    // The flag is READ once and CONSUMED once: the environment declaration, and the
    // argument to the pure policy. Any other line mentioning it is the screen branching
    // its own rendering on luminance — the thing this suite exists to stop — so the
    // assertion names the offending lines rather than counting occurrences, which would
    // go stale on any harmless reformat.
    const luminanceLines = code
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.includes('isLuminanceReduced'));

    expect(luminanceLines).toEqual([
      '@Environment(\\.isLuminanceReduced) private var isLuminanceReduced',
      'isLuminanceReduced: isLuminanceReduced,'
    ]);

    for (const forbidden of [
      'isLuminanceReduced ? Color',
      'isLuminanceReduced ? .gray',
      '.opacity(isLuminanceReduced',
      '.grayscale(',
      '.brightness(',
      '.stroke(Color.white'
    ]) {
      expect(code).not.toContain(forbidden);
    }
  });

  it('hides the digits and nothing else — the modifier is pinned to that node', () => {
    const code = withoutComments(readSwift(barcodeViewPath));

    // The presentation's own field name is not the flag, so neither the forbidden-string
    // list nor the `luminanceLines` check above can see WHERE the opacity is applied. Moved
    // onto `barcodeImage` it would dim the SYMBOL while luminance is reduced — the exact
    // inverse of AC3, and invisible to every other assertion in this file. So the
    // modifier is anchored to its node here rather than merely being known to exist.
    //
    // View-level opacity is distinguished from a colour's alpha by chain position: a
    // trimmed line STARTING with `.opacity(` is a modifier, whereas the placeholder's
    // `.stroke(Color.black.opacity(0.3), …)` is a fill and is left alone.
    const modifierLines = code
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('.opacity('));

    expect(modifierLines).toEqual(['.opacity(presentation.drawsValueGlyphs ? 1 : 0)']);

    // ...and it sits inside the digits node. `Text(value)` occurs twice in this file —
    // the body's digits row and the placeholder's manual-keying fallback — so the span
    // is taken from the FIRST one to the identifier that is unique to it.
    const digitsStart = code.indexOf('Text(value)');
    const digitsEnd = code.indexOf('.accessibilityIdentifier("barcode-number")');

    expect(digitsStart).toBeGreaterThan(-1);
    expect(digitsEnd).toBeGreaterThan(digitsStart);
    expect(code.slice(digitsStart, digitsEnd)).toContain(
      '.opacity(presentation.drawsValueGlyphs ? 1 : 0)'
    );

    // The symbol itself is never fed the presentation at all. Sliced from the drawn
    // image to the placeholder call that closes its `else`.
    const symbolBlock = code.slice(
      code.indexOf('if let barcodeImage = barcodeImage {'),
      code.indexOf('barcodePlaceholder(layout: layout)')
    );

    expect(symbolBlock).not.toContain('drawsValueGlyphs');
    expect(symbolBlock).not.toContain('.opacity(');

    // Nor is the placeholder. It is the manual-keying fallback for a payload no encoder
    // accepts, so fading it while dimmed would remove the only readable thing left.
    const placeholder = code.slice(code.indexOf('private func barcodePlaceholder'));

    expect(placeholder).not.toContain('drawsValueGlyphs');
  });

  it('routes the luminance state through the pure policy, never straight into the layout', () => {
    const code = withoutComments(readSwift(barcodeViewPath));

    // `showsValueLabel` feeds `footerReservedHeight`, which feeds the height the module
    // divides. Handing it the raw flag re-plans the symbol the instant the wrist drops.
    // Every `make` call site must be fed the policy's answer instead.
    const callSites = [...code.matchAll(/showsValueLabel:\s*([^\n,)]+)/g)].flatMap((match) =>
      match[1] ? [match[1].trim()] : []
    );

    // Both of them: the body's layout and the `onChange` re-plan. Asserting a count
    // rather than "at least one" is what stops a second call site being added and fed
    // the raw flag while this test keeps passing on the first.
    expect(callSites).toHaveLength(2);

    for (const argument of callSites) {
      expect(argument).toContain('reservesValueStrip');
      expect(argument).not.toContain('isLuminanceReduced');
    }
  });

  it('leaves the screen only by the system ways back: no tap and no crown dismisses it', () => {
    const code = withoutComments(readSwift(barcodeViewPath));
    const pagerCode = withoutComments(readSwift(path.join(watchDir, 'BarcodePagerView.swift')));

    // INVERTED by Story 23.2. This used to pin the opposite: a tap dismissing from all three
    // barcode presentations and a single-shot crown latch. Decision 1 (ifero, 2026-10-25)
    // removed the three taps — the image and both placeholders — so a stray touch while the
    // code is held to a scanner cannot close it; the watch grammar (§8) removed the crown's
    // dismissal, which fired on a single detent. The swipe from the left and the back chevron
    // remain, and both are the system's, not code here — nor in the pager that hosts this view.
    for (const source of [code, pagerCode]) {
      expect([...source.matchAll(/\.onTapGesture/g)]).toHaveLength(0);
      expect([...source.matchAll(/dismiss\(\)/g)]).toHaveLength(0);
      expect(source).not.toContain('crownTriggered');
    }

    // The crown now scrolls through the cards (decisions 2–4), and it is read one level up, by
    // `BarcodePagerView` — the target's one crown reader (pinned in the layout suite). This view
    // draws one card and reads no crown.
    expect(code).not.toContain('crownRotation');
    expect(code).not.toContain('digitalCrownRotation');
    expect(pagerCode).toContain('.digitalCrownRotation(');

    // The three presentations are still there and still DECLARE `barcode-image` — only their
    // tap went. (At runtime the screen's outer `barcode-view` identifier currently masks those
    // three, a pre-existing quirk `CardListUITests.swift` works around.)
    expect([...code.matchAll(/\.accessibilityIdentifier\("barcode-image"\)/g)]).toHaveLength(3);

    // No crown, so no focus here: the pager's crown reader holds it.
    expect(code).not.toContain('isFocused');
    expect(code).not.toContain('@FocusState');

    // The Story 9.6 usage event shares the appear hook, and is not this story's to disturb.
    expect(code).toContain('recordCardUsed(cardId: card.id)');
  });

  it('adds no locale keys — the scope decision was a rendering change, not a message', () => {
    const barcodeView = readSwift(barcodeViewPath);

    for (const locale of ['en', 'it']) {
      const strings = readSwift(path.join(watchDir, `${locale}.lproj`, 'Localizable.strings'));

      expect(strings).not.toContain('luminance');
      expect(strings).not.toContain('brightness');
      expect(strings).not.toContain('wake');
    }

    // No hint copy, so no new key lookups either (ifero, 2026-08-02 — the "point the
    // user at Settings" variant was explicitly rejected).
    //
    // Collected as key LITERALS rather than from `WatchL10n.format("…")` call sites:
    // the rotated-symbol label picks its key with a ternary and passes the result by
    // variable, so anchoring on the call would silently miss it — and a suite that
    // claims to enumerate the screen's keys while seeing two of three would pass a
    // third one added the same way.
    const keys = [...barcodeView.matchAll(/"(watch\.[a-z0-9_.]+)"/g)].map((match) => match[1]);

    expect(new Set(keys)).toEqual(
      new Set([
        'watch.barcode.accessibility.image_format',
        'watch.barcode.accessibility.image_rotated_format',
        'watch.barcode.accessibility.value_format'
      ])
    );
  });

  describeOnMac('executed against the real Swift luminance policy', () => {
    it('drops the digits only where they compete — dimmed AND rotated', () => {
      // The complete truth table — all 12 combinations of the three inputs. The single
      // `true`-for-suppression row is the whole behaviour: dimmed AND rotated AND there
      // are digits to draw.
      const cases = [
        { dimmed: false, hasValue: true, orientation: 'horizontal', glyphs: true },
        { dimmed: false, hasValue: true, orientation: 'rotated', glyphs: true },
        { dimmed: false, hasValue: true, orientation: 'none', glyphs: true },
        // Dimmed but horizontal: the strip is ACROSS the bars, so a scan line that
        // reads the symbol never crosses it. Keeping the number costs the scanner
        // nothing and preserves manual keying — the wrist can be flat on a counter
        // rather than lowered mid-scan.
        { dimmed: true, hasValue: true, orientation: 'horizontal', glyphs: true },
        // Dimmed and rotated: the strip is ALONG the reading axis, just past the
        // trailing quiet zone, where black glyph strokes are marks a decoder can take
        // for bars. This is the one case that suppresses.
        { dimmed: true, hasValue: true, orientation: 'rotated', glyphs: false },
        // Nothing drawn yet (QR, or a value no encoder accepts): keep them.
        { dimmed: true, hasValue: true, orientation: 'none', glyphs: true },
        // No payload at all — no digits row exists in any state. Enumerated in full
        // rather than sampled: `hasValue` short-circuits, so these six are degenerate by
        // construction, and asserting that is cheaper than a comment claiming it.
        { dimmed: false, hasValue: false, orientation: 'horizontal', glyphs: false },
        { dimmed: false, hasValue: false, orientation: 'rotated', glyphs: false },
        { dimmed: false, hasValue: false, orientation: 'none', glyphs: false },
        { dimmed: true, hasValue: false, orientation: 'horizontal', glyphs: false },
        { dimmed: true, hasValue: false, orientation: 'rotated', glyphs: false },
        { dimmed: true, hasValue: false, orientation: 'none', glyphs: false }
      ] as const;
      const key = ({
        dimmed,
        hasValue,
        orientation
      }: {
        dimmed: boolean;
        hasValue: boolean;
        orientation: string;
      }) => `policy|${dimmed ? 1 : 0}|${hasValue ? 1 : 0}|${orientation}`;
      const row = runHarness(cases.map(key));

      for (const testCase of cases) {
        const { dimmed, hasValue, orientation, glyphs } = testCase;
        const label = `dimmed=${dimmed} hasValue=${hasValue} orientation=${orientation}`;

        expect({ label, fields: row(key(testCase)) }).toEqual({
          label,
          // `strip` tracks `hasValue` and nothing else, in every row above — that is
          // what keeps luminance and orientation out of the geometry.
          fields: [`glyphs=${glyphs}`, `strip=${hasValue}`]
        });
      }
    });

    it('plans identical pixels awake and dimmed, on every watch and symbology', () => {
      const keys = WATCH_SCREENS.flatMap(({ width, height }) =>
        SYMBOLS.map(
          ({ format, units }) => `invariance|${width}|${height}|${format}|${units ?? -1}|1`
        )
      );
      const row = runHarness(keys);

      for (const { name, width, height } of WATCH_SCREENS) {
        for (const { label, format, units } of SYMBOLS) {
          const [awake, dimmed] = row(`invariance|${width}|${height}|${format}|${units ?? -1}|1`);

          // THE load-bearing assertion of this story. If these ever differ, the wrist
          // dropping re-plans the module — and on a watch near a module boundary, the
          // orientation too — so the symbol the scanner was mid-read on is replaced by
          // a differently quantised one. Same pixels, same orientation, same module,
          // same reserved footer: only the glyphs change.
          expect({ watch: name, symbol: label, geometry: dimmed }).toEqual({
            watch: name,
            symbol: label,
            geometry: awake
          });
        }
      }
    });

    it('keeps the digits reserved in the layout even when it is not drawing them', () => {
      const row = runHarness(['policy|1|1|rotated', 'invariance|162|197|EAN13|95|1']);

      // The two halves of the invariant, stated together so the reason cannot drift from
      // the mechanism: the strip is still reserved (so the geometry above cannot move)
      // at the same time as the glyphs are suppressed.
      expect(row('policy|1|1|rotated')).toEqual(['glyphs=false', 'strip=true']);

      const [, dimmed] = row('invariance|162|197|EAN13|95|1');

      // 12 pt of label plus 4 pt of spacing, held whether or not the glyphs are drawn.
      expect(dimmed).toContain('footer=16.0');
    });
  });
});

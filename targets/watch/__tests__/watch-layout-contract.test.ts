import fs from 'node:fs';
import path from 'node:path';

import { describeOnMac, runSwiftProgram, swiftDeclaration } from './swift-source-helpers';

const repoRoot = path.resolve(__dirname, '../../..');
const barcodeViewPath = path.join(repoRoot, 'targets', 'watch', 'BarcodeFlashView.swift');
const cardListViewPath = path.join(repoRoot, 'targets', 'watch', 'CardListView.swift');
const barcodeGeneratorPath = path.join(repoRoot, 'targets', 'watch', 'BarcodeGenerator.swift');
const layoutPath = path.join(repoRoot, 'targets', 'watch', 'WatchPresentationLayout.swift');

const LAYOUT = 'WatchPresentationLayout.swift';
const GENERATOR = 'BarcodeGenerator.swift';

/**
 * Every Apple Watch that runs watchOS 10, measured — not derived.
 *
 * Point sizes and the ×2 scale come from Xcode's own simulator device profiles
 * (`/Library/Developer/CoreSimulator/Profiles/DeviceTypes/Apple Watch *.simdevicetype
 * /Contents/Resources/profile.plist`: `mainScreenWidth`/`mainScreenHeight` in pixels,
 * `mainScreenScale`). The same files report `mainScreenWidthDPI` = 326 for all seven,
 * which is where `WatchBarcodeModulePlan.pixelsPerMillimetre` comes from.
 *
 * 40 mm is the floor because `targets/watch/expo-target.config.js` deploys to
 * watchOS 10, whose oldest supported hardware is the 40 mm Series 4.
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
 * Modules of quiet zone the layout guarantees on each side, matching
 * `WatchBarcodeModulePlan.minimumQuietZoneUnitsPerSide`.
 *
 * Asserted against the Swift below rather than trusted, because it is the one number
 * that trades quiet zone for module width and a silent drift would be invisible.
 */
const MINIMUM_QUIET_UNITS_PER_SIDE = 4;

/**
 * Container height used to isolate the WIDTH axis for the quiet-zone trade table.
 *
 * Short enough that the rotated axis affords no module at all, so the plan can only
 * resolve horizontally. Necessary because at the full screen the taller axis reaches a
 * module step the shipped layout cannot — it keeps the top strip, which shortens
 * exactly that axis.
 */
const TRADE_TABLE_HEIGHT = 60;

/**
 * How much of the screen the safe area takes off the `GeometryReader`, in points.
 *
 * Anchored on measurement, then swept. `BarcodeFlashView` ignores the horizontal and
 * bottom safe-area edges and keeps the top one (the navigation bar and the system
 * clock live there), and its DEBUG `BarcodeGeometry` log — read off booted watchOS
 * 26.4 simulators — reports the barcode destination then receiving **162 x 149.5 pt on
 * the 40 mm** (screen 162 x 197) and **208 x 186 pt on the 46 mm** (screen 208 x 248).
 * Width is fully reclaimed; the top strip costs 47.5 pt and 62 pt respectively.
 *
 * For reference, wholly inside the safe area those same devices reported 158 x 130.5
 * and 204 x 150 — a third of the display unused — and wholly outside it the full
 * screen, which is the first pass `GeometryReader` reports before the inset lands.
 *
 * Every geometry assertion has to hold across the whole range: two measurements do
 * not pin five other watch sizes, and the inset is not a constant across them.
 */
const CONTAINER_INSETS = [
  { label: 'full screen', width: 0, height: 0 },
  { label: 'top strip, 40 mm measured', width: 0, height: 47.5 },
  { label: 'top strip, 46 mm measured', width: 0, height: 62 },
  { label: 'top strip, deepest modelled', width: 0, height: 80 },
  // Paranoia: the horizontal edge IS reclaimed and both measured devices reported the
  // full screen width, so this models a device that does not honour that. The module
  // floor below is asserted against the shipped configuration, not against this.
  { label: 'unexpected horizontal inset', width: 8, height: 100 }
] as const;

/**
 * Symbol widths in module units — bars and spaces only, quiet zones EXCLUDED.
 *
 * Excluded because the layout divides the screen by the symbol, not by the symbol plus
 * its margins: a quiet zone is white space and takes whatever the bars leave over.
 * Making it compete for pixels at a bar's price is what held a 40 mm EAN-13 to a 2 px
 * module when its screen affords 3.
 *
 * These are the symbologies' own fixed widths, and the sibling
 * `watch-barcode-symbology-contract.test.ts` proves the encoders emit exactly them by
 * executing them against BWIPP: EAN-13 and UPC-A are 95 modules, EAN-8 is 67.
 */
const SYMBOL_UNITS = {
  EAN13: 95,
  EAN8: 67,
  UPCA: 95
} as const;

/**
 * A stand-in for EAN-13's symbol: 95 single-module elements.
 *
 * The realised quiet-zone margins depend only on the symbol's TOTAL units and the
 * symbology's ratio, never on how the modules are arranged, so this reproduces a real
 * EAN-13's margins exactly. 95 is odd, so it starts and ends on a bar — as every real
 * linear symbology does, and as the trailing-margin measurement requires.
 */
const EAN13_STAND_IN = Array.from({ length: SYMBOL_UNITS.EAN13 }, () => 1);

/**
 * Symbol widths to sweep the solver over, in module units.
 *
 * Code 128 and Code 39 have no fixed symbol width — it depends on the payload and, for
 * Code 128, on code-set switching — so they are covered as a RANGE rather than by
 * guessing a number. 43 is under EAN-8's 67; 253 is what a 20-character alphanumeric
 * Code 128 measures (executed, not estimated), the "illegible at any orientation" end
 * of the story's boundary question. Every width in between must behave.
 */
const UNIT_SWEEP = [43, 53, 67, 77, 95, 105, 121, 133, 145, 165, 185, 205, 231, 253];

/**
 * Declarations the geometry harness needs.
 *
 * All are pure — Foundation and CoreGraphics only, no SwiftUI, UIKit or WatchKit —
 * which is why the barcode geometry can be lifted out of the layout and RUN here
 * instead of mirrored in TypeScript. A mirror is a second implementation that drifts
 * silently; this is the shipped one, executing.
 */
const GEOMETRY_DECLARATIONS = [
  'enum WatchDisplayMetrics {',
  'enum WatchBarcodeOrientation: String {',
  'struct WatchBarcodeAxisBudget: Equatable {',
  'struct WatchBarcodeModulePlan: Equatable {',
  'struct WatchBarcodeBar: Equatable {',
  'enum WatchBarcodeBarLayout {',
  'struct WatchBarcodeLayoutMetrics {'
];

/** One planned layout, as the harness reports it. */
type GeometryRow = {
  pixelWidth: number;
  pixelHeight: number;
  pointWidth: number;
  pointHeight: number;
  orientation: 'horizontal' | 'rotated' | 'none';
  module: number;
  symbolUnits: number;
  symbolPixelLength: number;
  lengthPixels: number;
  widthFillRatio: number;
  lengthFillRatio: number;
  moduleMillimetres: number;
  boxInnerPadding: number;
  footerReservedHeight: number;
};

/** One question for the harness: a container, a format and a symbol to fit in it. */
type GeometryCase = {
  width: number;
  height: number;
  format: string;
  units: number | null;
  showsValueLabel?: boolean;
  current?: 'horizontal' | 'rotated' | null;
};

/**
 * `source` with its comments removed.
 *
 * Assertions that a construct is ABSENT have to read code only: several comments here
 * quote the modifier they explain, and a naive `not.toContain` would match the prose
 * rather than the code and pass for the wrong reason (or fail for it).
 */
const withoutComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

/**
 * Every way SwiftUI offers to hide the navigation bar or its back button — the bar that carries
 * the barcode screen's back chevron and its cream title. A pattern rather than exact spellings,
 * so another placement list or a sibling modifier cannot slip past it.
 */
const HIDES_THE_NAVIGATION_BAR =
  /\.toolbar\(\s*\.hidden\b|\.toolbarVisibility\(\s*\.hidden\b|\.navigationBarHidden\(|\.navigationBarBackButtonHidden\b/;

/**
 * The modifier chain applied to the container that opens at `signature`: the lines straight
 * after its closing brace that start with `.`, up to the next sibling. A modifier written inside
 * the container — on a row, a link or a stack — is not in it.
 */
const containerModifiers = (code: string, signature: string) => {
  const body = swiftDeclaration(code, signature, 'CardListView.swift');
  const after = code.slice(code.indexOf(body) + body.length).split('\n');
  const chain: string[] = [];

  for (const line of after.slice(1)) {
    if (!line.trim().startsWith('.')) {
      break;
    }

    chain.push(line.trim());
  }

  return { body, chain };
};

const caseKey = ({
  width,
  height,
  format,
  units,
  showsValueLabel = true,
  current = null
}: GeometryCase) =>
  [
    width,
    height,
    format,
    units ?? -1,
    showsValueLabel ? 1 : 0,
    WATCH_SCALE,
    current ?? 'none'
  ].join('|');

const buildGeometryHarness = () => {
  const layout = fs.readFileSync(layoutPath, 'utf8');
  const generator = fs.readFileSync(barcodeGeneratorPath, 'utf8');

  return [
    'import CoreGraphics',
    'import Foundation',
    swiftDeclaration(generator, 'enum WatchBarcodeFormat: String {', GENERATOR),
    swiftDeclaration(generator, 'struct WatchBarcodeQuietZone: Equatable {', GENERATOR),
    ...GEOMETRY_DECLARATIONS.map((declaration) => swiftDeclaration(layout, declaration, LAYOUT)),
    // Two modes, keyed by the first field. Anything the harness cannot parse is
    // skipped rather than guessed, so a malformed case shows up as a missing row.
    `while let line = readLine(strippingNewline: true) {
  let f = line.split(separator: "|", omittingEmptySubsequences: false).map(String.init)

  if f.first == "bars" {
    guard f.count == 7, let leading = Int(f[2]), let trailing = Int(f[3]),
      let w = Int(f[4]), let h = Int(f[5]),
      let orientation = WatchBarcodeOrientation(rawValue: f[6])
    else { continue }

    let modules = f[1].split(separator: ",").compactMap { Int($0) }
    let bars = WatchBarcodeBarLayout.bars(
      modules: modules,
      quietZone: WatchBarcodeQuietZone(leading: leading, trailing: trailing),
      widthPixels: w, heightPixels: h, orientation: orientation)

    print(line + "~" + bars.map { "\\($0.x),\\($0.y),\\($0.width),\\($0.height)" }
      .joined(separator: ";"))
    continue
  }

  guard f.count == 7, let width = Double(f[0]), let height = Double(f[1]),
    let units = Int(f[3]), let scale = Double(f[5])
  else { continue }

  let metrics = WatchBarcodeLayoutMetrics.make(
    containerSize: CGSize(width: width, height: height),
    formatString: f[2],
    symbolUnits: units < 0 ? nil : units,
    showsValueLabel: f[4] == "1",
    scale: CGFloat(scale),
    currentOrientation: WatchBarcodeOrientation(rawValue: f[6]))
  let plan = metrics.modulePlan

  print(
    ([
      line,
      "\\(Int(metrics.barcodePixelSize.width))",
      "\\(Int(metrics.barcodePixelSize.height))",
      "\\(Double(metrics.barcodeSize.width))",
      "\\(Double(metrics.barcodeSize.height))",
      plan?.orientation.rawValue ?? "none",
      "\\(plan?.modulePixelWidth ?? 0)",
      "\\(plan?.symbolUnits ?? 0)",
      "\\(plan?.symbolPixelLength ?? 0)",
      "\\(plan?.lengthPixels ?? 0)",
      "\\(Double(metrics.widthFillRatio))",
      "\\(plan?.lengthFillRatio ?? 0)",
      "\\(plan?.moduleMillimetres ?? 0)",
      "\\(Double(metrics.boxInnerPadding))",
      "\\(Double(metrics.footerReservedHeight))"
    ] as [String]).joined(separator: "~"))
}`
  ].join('\n\n');
};

/** One question about where the bars go. */
type BarCase = {
  modules: readonly number[];
  leading: number;
  trailing: number;
  widthPixels: number;
  heightPixels: number;
  orientation: 'horizontal' | 'rotated';
};

type Bar = { x: number; y: number; width: number; height: number };

const barKey = ({ modules, leading, trailing, widthPixels, heightPixels, orientation }: BarCase) =>
  ['bars', modules.join(','), leading, trailing, widthPixels, heightPixels, orientation].join('|');

/** Run every case through the shipped solver in one `xcrun swift` process. */
const runGeometry = (cases: readonly GeometryCase[], barCases: readonly BarCase[] = []) => {
  const stdout = runSwiftProgram({
    program: buildGeometryHarness(),
    input: [...cases.map(caseKey), ...barCases.map(barKey)].join('\n'),
    label: `${LAYOUT} + ${GENERATOR}`,
    hint:
      'The barcode geometry is planned here and drawn by BarcodeGenerator against the ' +
      'same numbers, so a failure means the frame and the bitmap can disagree — which ' +
      'SwiftUI resolves by duplicating a pixel column.'
  });

  const rows = new Map<string, GeometryRow>();
  const barRows = new Map<string, Bar[]>();

  for (const line of stdout.split('\n').filter(Boolean)) {
    const [key, ...fields] = line.split('~');

    if (key?.startsWith('bars|')) {
      const payload = fields[0] ?? '';
      barRows.set(
        key,
        payload
          .split(';')
          .filter(Boolean)
          .map((bar) => {
            const [x, y, width, height] = bar.split(',').map(Number);

            return { x: x ?? 0, y: y ?? 0, width: width ?? 0, height: height ?? 0 };
          })
      );
      continue;
    }

    if (!key || fields.length !== 14) {
      throw new Error(`Unparseable harness row: ${line}`);
    }

    rows.set(key, {
      pixelWidth: Number(fields[0]),
      pixelHeight: Number(fields[1]),
      pointWidth: Number(fields[2]),
      pointHeight: Number(fields[3]),
      orientation: fields[4] as GeometryRow['orientation'],
      module: Number(fields[5]),
      symbolUnits: Number(fields[6]),
      symbolPixelLength: Number(fields[7]),
      lengthPixels: Number(fields[8]),
      widthFillRatio: Number(fields[9]),
      lengthFillRatio: Number(fields[10]),
      moduleMillimetres: Number(fields[11]),
      boxInnerPadding: Number(fields[12]),
      footerReservedHeight: Number(fields[13])
    });
  }

  const plan = (query: GeometryCase) => {
    const row = rows.get(caseKey(query));

    if (!row) {
      throw new Error(`The harness returned no row for ${caseKey(query)}`);
    }

    return row;
  };

  plan.bars = (query: BarCase) => {
    const row = barRows.get(barKey(query));

    if (!row) {
      throw new Error(`The harness returned no bars for ${barKey(query)}`);
    }

    return row;
  };

  return plan;
};

/** The screen width the container was derived from, for the module-floor assertion. */
const screenWidth = (container: { label: string }) =>
  WATCH_SCREENS.find((screen) => container.label.startsWith(screen.name))?.width ?? 0;

/** Container sizes to plan against: every watch, at every modelled inset. */
const CONTAINERS = WATCH_SCREENS.flatMap((screen) =>
  CONTAINER_INSETS.map((inset) => ({
    label: `${screen.name} (${inset.label})`,
    width: screen.width - inset.width,
    height: screen.height - inset.height
  }))
);

const parseCompactMetrics = (source: string) => {
  const match = source.match(
    /static let compact = WatchCardRowLayoutMetrics\(\s*rowSpacing: (\d+),\s*horizontalPadding: (\d+),\s*verticalPadding: (\d+),\s*accentWidth: (\d+),\s*accentHeight: (\d+),\s*avatarSize: (\d+),\s*cornerRadius: (\d+),\s*minimumTapHeight: (\d+)/s
  );

  if (!match) {
    throw new Error('Unable to parse compact watch row metrics');
  }

  return {
    rowSpacing: Number(match[1]),
    horizontalPadding: Number(match[2]),
    verticalPadding: Number(match[3]),
    accentWidth: Number(match[4]),
    accentHeight: Number(match[5]),
    avatarSize: Number(match[6]),
    cornerRadius: Number(match[7]),
    minimumTapHeight: Number(match[8])
  };
};

const visibleRows = (containerHeight: number, rowHeight: number, spacing: number) => {
  let count = 0;
  let usedHeight = 0;

  while (true) {
    const nextHeight = usedHeight === 0 ? rowHeight : usedHeight + spacing + rowHeight;

    if (nextHeight > containerHeight) {
      return count;
    }

    count += 1;
    usedHeight = nextHeight;
  }
};

describe('watch layout contract', () => {
  it('uses the selected card name as barcode title context', () => {
    const barcodeView = fs.readFileSync(barcodeViewPath, 'utf8');
    const layout = fs.readFileSync(layoutPath, 'utf8');

    expect(layout).toContain(
      'return trimmedName.isEmpty ? WatchL10n.string("watch.cards.fallback_name") : trimmedName'
    );
    expect(barcodeView).toContain('.navigationTitle(titleText)');
    expect(barcodeView).not.toContain('.navigationTitle("")');
  });

  it('keeps the list → barcode flow, and leaves the barcode only by the system ways back', () => {
    const barcodeCode = withoutComments(fs.readFileSync(barcodeViewPath, 'utf8'));
    const cardListView = fs.readFileSync(cardListViewPath, 'utf8');

    expect(cardListView).toContain('NavigationLink(value: WatchCardRoute(cardId: card.id))');
    expect(cardListView).toContain('.navigationDestination(for: WatchCardRoute.self) { route in');
    expect(cardListView).toContain('BarcodeFlashView(card: card)');

    // Story 23.2 INVERTED what this test used to pin. The barcode screen dismissed on a tap
    // (decision 1, ifero 2026-10-25) and on any crown movement (watch grammar §8); both are
    // gone, so a stray touch or a single detent while the code is held to a scanner cannot
    // close it. What is left is the system's swipe from the left and the navigation bar's
    // back chevron — neither of which is code in this file, which is the point: the screen
    // calls `dismiss()` nowhere, and does not even read the action.
    expect(barcodeCode).not.toContain('.onTapGesture');
    expect(barcodeCode).not.toContain('.digitalCrownRotation(');
    expect(barcodeCode).not.toContain('crownTriggered');
    expect(barcodeCode).not.toContain('dismiss()');
    expect(barcodeCode).not.toContain('@Environment(\\.dismiss)');
    // The navigation bar — which carries the back chevron — is still drawn, by any spelling.
    expect(barcodeCode).not.toMatch(HIDES_THE_NAVIGATION_BAR);
  });

  it('gives the crown to the list and the picker, explicitly, and to no handler at all', () => {
    // Watch grammar §8: "The crown and the rotary scroll. They never act." The list and the
    // picker scroll by the crown because each takes its focus by name — behaviour that only
    // works by inheritance silently disappears when a container is swapped. The barcode
    // screen takes nothing: it does not scroll, and no crown handler exists to act.
    const cardListCode = withoutComments(fs.readFileSync(cardListViewPath, 'utf8'));
    const barcodeCode = withoutComments(fs.readFileSync(barcodeViewPath, 'utf8'));

    // Pinned as the ScrollView's and the List's OWN modifiers — the chain after each one's
    // closing brace — so the pair cannot drift onto the LazyVStack, a NavigationLink or a
    // picker row inside, where it would focus something that does not scroll.
    const list = containerModifiers(cardListCode, 'ScrollView {');
    const pickerCode = cardListCode.slice(
      cardListCode.indexOf('struct WatchSortPickerView: View {')
    );
    const picker = containerModifiers(pickerCode, 'List {');

    expect(cardListCode).toContain('@FocusState private var listHasCrown: Bool');
    expect(list.body).toContain('LazyVStack(spacing: 4)');
    expect(list.chain).toEqual(['.focused($listHasCrown)', '.defaultFocus($listHasCrown, true)']);

    expect(pickerCode).toContain('@FocusState private var optionsHaveCrown: Bool');
    expect(picker.body).toContain('ForEach(WatchSortMode.allCases)');
    expect(picker.chain).toEqual([
      '.listStyle(.plain)',
      '.scrollContentBackground(.hidden)',
      '.focused($optionsHaveCrown)',
      '.defaultFocus($optionsHaveCrown, true)',
      '.background(WatchColor.ground)',
      '.navigationTitle(WatchL10n.string("watch.sort.title"))'
    ]);

    // And neither pair appears anywhere else — in particular not inside either container.
    for (const modifier of ['.focused(', '.defaultFocus(']) {
      expect(cardListCode.split(modifier).length - 1).toBe(2);
      expect(list.body).not.toContain(modifier);
      expect(picker.body).not.toContain(modifier);
    }

    // No surface reads the crown's value, so none can act on it — and in particular nothing
    // dismisses on it, which is what the barcode screen used to do.
    // Across the whole watch app, not just these two screens: the frozen "no crown action but
    // scrolling" is target-wide, and WatchKit's crown delegate and sequencer are readers too.
    const watchDir = path.join(repoRoot, 'targets', 'watch');
    const crownReaders = fs
      .readdirSync(watchDir, { recursive: true, encoding: 'utf8' })
      .filter((relative) => relative.endsWith('.swift') && !relative.includes('__tests__'))
      .filter((relative) =>
        /digitalCrownRotation|onCrownRotate|WKCrownSequencer|WKCrownDelegate|crownSequencer/.test(
          withoutComments(fs.readFileSync(path.join(watchDir, relative), 'utf8'))
        )
      );

    expect(crownReaders).toEqual([]);

    // The barcode screen holds no focus of its own any more: its only reason was the crown.
    expect(barcodeCode).not.toContain('@FocusState');
    expect(barcodeCode).not.toContain('.focusable(');
  });

  it('preserves watch-safe accessibility labels and minimum tap target sizing', () => {
    const barcodeView = fs.readFileSync(barcodeViewPath, 'utf8');
    const cardListView = fs.readFileSync(cardListViewPath, 'utf8');

    expect(cardListView).toContain('.frame(minHeight: metrics.minimumTapHeight)');
    expect(cardListView).toContain(
      '.accessibilityLabel(WatchL10n.format(cardRowAccessibilityKey(isFavorite: card.isFavorite), card.name))'
    );
    expect(barcodeView).toContain('.accessibilityIdentifier("barcode-view")');
    expect(barcodeView).toContain(
      '.accessibilityLabel(WatchL10n.format("watch.barcode.accessibility.image_format", titleText))'
    );
  });

  it('renders a favourite badge on the watch row and announces it to VoiceOver (Story 9.4 / C3)', () => {
    const cardListView = fs.readFileSync(cardListViewPath, 'utf8');
    const enStrings = fs.readFileSync(
      path.join(repoRoot, 'targets', 'watch', 'en.lproj', 'Localizable.strings'),
      'utf8'
    );
    const itStrings = fs.readFileSync(
      path.join(repoRoot, 'targets', 'watch', 'it.lproj', 'Localizable.strings'),
      'utf8'
    );

    // Badge is rendered only for favourites
    expect(cardListView).toContain('if card.isFavorite {');
    expect(cardListView).toContain('Image(systemName: "star.fill")');

    // Favourite-aware accessibility label is driven by the testable key helper
    expect(cardListView).toContain('func cardRowAccessibilityKey(isFavorite: Bool) -> String');
    expect(cardListView).toContain('"watch.card_row.favorite_accessibility_format"');

    // The favourite label key is localised in BOTH bundles (cross-file coupling)
    expect(enStrings).toContain('"watch.card_row.favorite_accessibility_format"');
    expect(itStrings).toContain('"watch.card_row.favorite_accessibility_format"');
  });

  it('routes QR cards through the native QR renderer instead of the placeholder path', () => {
    const generator = fs.readFileSync(barcodeGeneratorPath, 'utf8');

    expect(generator).toContain('case .QR:');
    expect(generator).toContain('renderQRCodeImage(text: value, pixelSize: pixelSize)');
    expect(generator).toContain('CIFilter(name: "CIQRCodeGenerator")');
  });

  it('reclaims every edge the system does not draw into, and keeps the one it does', () => {
    const barcodeView = fs.readFileSync(barcodeViewPath, 'utf8');
    const layout = fs.readFileSync(layoutPath, 'utf8');

    // Every padding is gone: the outer two were already 0, and the inner 2 pt was an
    // invisible white inset inside a white card costing 4 pt of the width the module
    // divides. On a 41 mm watch that is the difference between 344 px and 352 px,
    // against the 3 × 103 = 309 an EAN-13 needs at 3 px/module.
    expect(layout).toContain('let outerHorizontalPadding: CGFloat = 0');
    expect(layout).toContain('let outerVerticalPadding: CGFloat = 0');
    expect(layout).toContain('let boxInnerPadding: CGFloat = 0');

    // The horizontal and bottom safe-area edges are reclaimed — nothing is drawn
    // there, and inside them a 40 mm gave the barcode 158 x 130.5 pt of a 162 x 197 pt
    // screen. The TOP edge is kept: the navigation bar lives there, and so does the
    // system clock, which watchOS draws with no API to suppress. Measured with the
    // top edge also ignored, the clock renders white glyphs straight THROUGH the black
    // bars — a wider module bought by breaking the symbol is not a wider module.
    expect(barcodeView).toContain('.ignoresSafeArea(edges: [.horizontal, .bottom])');
    expect(withoutComments(barcodeView)).not.toMatch(HIDES_THE_NAVIGATION_BAR);
    expect(barcodeView).toContain('.navigationTitle(titleText)');
  });

  it('announces a rotated symbol to VoiceOver, which cannot see that it turned', () => {
    const barcodeView = fs.readFileSync(barcodeViewPath, 'utf8');
    const enStrings = fs.readFileSync(
      path.join(repoRoot, 'targets', 'watch', 'en.lproj', 'Localizable.strings'),
      'utf8'
    );
    const itStrings = fs.readFileSync(
      path.join(repoRoot, 'targets', 'watch', 'it.lproj', 'Localizable.strings'),
      'utf8'
    );

    // Rotation is new in this story. A sighted user reads it off the shape; a
    // VoiceOver user is told nothing unless the label says so.
    expect(barcodeView).toContain('.accessibilityLabel(barcodeAccessibilityLabel)');
    expect(barcodeView).toContain('renderedOrientation?.isRotated == true');

    for (const key of [
      'watch.barcode.accessibility.image_format',
      'watch.barcode.accessibility.image_rotated_format'
    ]) {
      expect(barcodeView).toContain(`"${key}"`);
      expect(enStrings).toContain(`"${key}" =`);
      expect(itStrings).toContain(`"${key}" =`);
    }
  });

  it('rerenders on every input the drawn bitmap depends on, and guards on the same set', () => {
    const barcodeView = fs.readFileSync(barcodeViewPath, 'utf8');
    const renderTaskID = barcodeView.slice(
      barcodeView.indexOf('private var renderTaskID: String {'),
      barcodeView.indexOf('var body: some View {')
    );

    // The render task's identity must carry the payload and its symbology, not just
    // the card id and the geometry. A card edited in place keeps its id, its pixel
    // size and its orientation, while the `Text(value)` under the image reads `card`
    // live from the body — so a subset key prints one number beside a barcode
    // encoding another.
    expect(renderTaskID).toContain('card.barcodeValue');
    expect(renderTaskID).toContain('card.barcodeFormat');
    expect(renderTaskID).toContain('card.id');
    expect(renderTaskID).toContain('barcodePixelSize');
    expect(renderTaskID).toContain('barcodeOrientation');

    // And the guard inside the task compares that WHOLE id. Comparing a subset of it
    // reintroduces the same skip one layer down: the task restarts and then returns
    // early, leaving the stale image on screen.
    expect(barcodeView).toContain(
      'guard barcodeImage == nil || renderedTaskID != renderTaskID else { return }'
    );
    expect(withoutComments(barcodeView)).not.toContain('renderedPixelSize');
  });

  it('waits for the container to settle so the symbol cannot flip on appear', () => {
    const barcodeView = fs.readFileSync(barcodeViewPath, 'utf8');

    // `GeometryReader` reports the full screen first and the safe-area container
    // ~60 ms later, and the two can resolve to different orientations (measured on a
    // 46 mm: rotated at 4 px/module, then horizontal at 3). `.task(id:)` cancels on
    // every target change, so sleeping before the render means a superseded geometry
    // never reaches the renderer — without it the user sees the symbol turn.
    expect(barcodeView).toContain('try? await Task.sleep(for: .milliseconds(120))');
    expect(barcodeView).toContain('if Task.isCancelled { return }');
  });

  it('plans the barcode in whole device pixels so the frame cannot rescale the bitmap', () => {
    const layout = fs.readFileSync(layoutPath, 'utf8');
    const barcodeView = fs.readFileSync(barcodeViewPath, 'utf8');
    const generator = fs.readFileSync(barcodeGeneratorPath, 'utf8');

    // The frame is the pixel size divided by the scale, and the renderer is handed
    // the pixel size itself — so `.frame()` and the bitmap are the same number twice
    // rather than two roundings of one number.
    expect(layout).toContain('let barcodePixelSize: CGSize');
    expect(layout).toContain('width: barcodePixelSize.width / safeScale');
    expect(layout).toContain('height: barcodePixelSize.height / safeScale');
    expect(layout).toContain('widthFillRatio: min(barcodeSize.width / safeWidth, 1)');
    expect(barcodeView).toContain(
      '.frame(width: layout.barcodeSize.width, height: layout.barcodeSize.height)'
    );
    expect(barcodeView).toContain('pixelSize: barcodePixelSize');
    expect(generator).toContain('pixelSize: CGSize');

    // The rounding that used to break the agreement: the view floored the target
    // while the frame used the unrounded size.
    expect(barcodeView).not.toContain('newSize.width.rounded(.down)');
    // A hardcoded first target renders one image against a guess and a second against
    // the real geometry — and with rotation in play, that is a visible flip on appear.
    expect(barcodeView).not.toContain('CGSize(width: 156, height: 88)');
    expect(barcodeView).toContain('@State private var barcodePixelSize: CGSize = .zero');
  });

  it('bumps the image cache version so no device serves a pre-uniform-module image', () => {
    const version = fs
      .readFileSync(barcodeGeneratorPath, 'utf8')
      .match(/private static let cacheVersion = "([^"]+)"/)?.[1];

    // The key carries the value, format, pixel size and orientation but not the
    // renderer, so both earlier generations drew bars this one does not.
    expect(version).toBeDefined();
    expect(['watch-barcode-v2', 'watch-barcode-v3']).not.toContain(version);
  });

  it('derives the symbol width from the encoder and its symbology, never from EAN-13', () => {
    const generator = fs.readFileSync(barcodeGeneratorPath, 'utf8');
    const barcodeView = fs.readFileSync(barcodeViewPath, 'utf8');

    // The unit count the layout divides by is the encoder's own module array plus the
    // symbology's own quiet zones. Both halves are pinned in the symbology contract,
    // so this is the seam that joins them.
    expect(generator).toContain(
      'static func symbolModuleUnits(value: String, formatString: String?)'
    );
    expect(generator).toContain('return mod.reduce(0, +)');
    // The quiet zone is NOT added here: it is white space, and adding it made the
    // margins compete with the bars for pixels at the same price.
    expect(generator).not.toContain('mod.reduce(0, +) + quietZone(for: fmt).total');
    expect(barcodeView).toContain('symbolUnits: symbolUnits');
    expect(barcodeView).toContain(
      'BarcodeGenerator.symbolModuleUnits(value: value, formatString: card.barcodeFormat)'
    );
  });

  it('improves 41mm list density by at least one visible row while keeping a watch-safe tap target', () => {
    const cardListView = fs.readFileSync(cardListViewPath, 'utf8');
    const layout = fs.readFileSync(layoutPath, 'utf8');
    const metrics = parseCompactMetrics(layout);
    const compactRowHeight = Math.max(
      Math.max(metrics.accentHeight, metrics.avatarSize) + metrics.verticalPadding * 2,
      metrics.minimumTapHeight
    );
    const baselineRowHeight = 68;
    const baselineSpacing = 8;
    const containerHeight = 160;

    expect(cardListView).toContain('private let metrics = WatchCardRowLayoutMetrics.compact');
    expect(cardListView).toContain('.frame(minHeight: metrics.minimumTapHeight)');

    // The list's own gap, read from the source rather than derived from the row's internal
    // `rowSpacing` — an unrelated metric this test once subtracted 4 from to land on 6.
    const listGap = Number(cardListView.match(/LazyVStack\(spacing: (\d+)\)/)?.[1]);

    expect(listGap).toBe(4);

    const compactVisibleRows = visibleRows(containerHeight, compactRowHeight, listGap);
    const baselineVisibleRows = visibleRows(containerHeight, baselineRowHeight, baselineSpacing);

    expect(compactRowHeight).toBe(48);
    expect(compactVisibleRows).toBeGreaterThanOrEqual(baselineVisibleRows + 1);
  });

  it('applies the watch grammar to the row: the declared 48, radius 14, gap 4 (Story 23.2)', () => {
    const cardListView = fs.readFileSync(cardListViewPath, 'utf8');
    const layout = fs.readFileSync(layoutPath, 'utf8');
    const metrics = parseCompactMetrics(layout);

    // §5.4: the declared floor is the system's 48, and the old 44 is gone. It never bound —
    // the content is already 30 + 2 × 9 = 48 — so the change states the intent and moves no
    // pixel. Pinning the equality is what proves "no pixel moves": were the content ever
    // shorter than the floor, the floor would start binding and the row would grow.
    expect(layout).toContain('minimumTapHeight: 48');
    expect(layout).not.toContain('minimumTapHeight: 44');
    expect(metrics.minimumTapHeight).toBe(48);
    expect(Math.max(metrics.accentHeight, metrics.avatarSize) + metrics.verticalPadding * 2).toBe(
      metrics.minimumTapHeight
    );

    // §5.5: 14, not the phone's 16 — and the relationship worth keeping is half the accent bar.
    expect(metrics.cornerRadius).toBe(14);
    expect(metrics.cornerRadius).toBe(metrics.accentHeight / 2);

    // And the card row draws that 14: its ink fill and its hairline both read the metric, and the
    // only literal radius in the file is the accent bar's 3 (§5.5: "14 for rows, 3 for the accent
    // bar … and nothing else"). A literal 16 on the row would pass every pin on the constant.
    const cardListCode = withoutComments(cardListView);

    expect(
      cardListCode.split('RoundedRectangle(cornerRadius: metrics.cornerRadius)').length - 1
    ).toBe(2);
    expect(
      [...cardListCode.matchAll(/RoundedRectangle\(cornerRadius: (\d+)\)/g)].map(
        (match) => match[1]
      )
    ).toEqual(['3']);

    // §5.3: gap 4, the tighter of the two shipped values; the old 6 is gone.
    expect(cardListView).toContain('LazyVStack(spacing: 4)');
    expect(cardListView).not.toContain('LazyVStack(spacing: 6)');

    // The sort picker's rows take the same 48 floor and the same 14 radius, read from the one
    // metric rather than restated — the old picker held its own `44` literal.
    const pickerCode = withoutComments(
      cardListView.slice(cardListView.indexOf('struct WatchSortPickerView: View {'))
    );

    expect(pickerCode).toContain(
      '.frame(minHeight: WatchCardRowLayoutMetrics.compact.minimumTapHeight)'
    );
    expect(pickerCode).toContain(
      'RoundedRectangle(cornerRadius: WatchCardRowLayoutMetrics.compact.cornerRadius)'
    );
    expect(pickerCode).not.toMatch(/minHeight: \d/);
  });

  it('exposes a selectable watch sort model with phone-mirrored variants (Story 9.5)', () => {
    const cardListView = fs.readFileSync(cardListViewPath, 'utf8');

    // The three modes mirror the phone's useCardSort SortOption union.
    expect(cardListView).toContain('enum WatchSortMode: String, CaseIterable, Identifiable {');
    expect(cardListView).toContain('case frequent');
    expect(cardListView).toContain('case recent');
    expect(cardListView).toContain('case az');

    // Watch-local persistence key + A-Z default (AC3, AC4).
    expect(cardListView).toContain('static let storageKey = "watch.sortMode"');
    expect(cardListView).toContain('static let defaultMode: WatchSortMode = .az');

    // A single comparator entry point; `.frequent` reuses the shared sortedForDisplay so the
    // complication "top card" can never drift from the list (AC2).
    expect(cardListView).toContain(
      'static func sorted(_ cards: [WatchCard], by mode: WatchSortMode) -> [WatchCard]'
    );
    expect(cardListView).toContain('return sortedForDisplay(cards)');
    expect(cardListView).toContain('cards.sorted { $0.createdAt > $1.createdAt }');
    // A-Z mirrors the phone's localeCompare(sensitivity:'base') — case- AND diacritic-insensitive.
    expect(cardListView).toContain('options: [.caseInsensitive, .diacriticInsensitive]');

    // The list is driven by the selected mode, not the fixed frequent ordering (AC2, AC5).
    expect(cardListView).toContain('return WatchCard.sorted(entities, by: sortMode)');
  });

  it('presents a sort control: toolbar button → picker sheet, double-encoded active row (Story 9.5)', () => {
    const cardListView = fs.readFileSync(cardListViewPath, 'utf8');
    const enStrings = fs.readFileSync(
      path.join(repoRoot, 'targets', 'watch', 'en.lproj', 'Localizable.strings'),
      'utf8'
    );
    const itStrings = fs.readFileSync(
      path.join(repoRoot, 'targets', 'watch', 'it.lproj', 'Localizable.strings'),
      'utf8'
    );

    // Watch-local persisted preference, default A-Z (AC3, AC4).
    expect(cardListView).toContain(
      '@AppStorage(WatchSortMode.storageKey) private var sortMode: WatchSortMode = WatchSortMode.defaultMode'
    );

    // Entry point: a top-trailing toolbar button with the sort glyph (UX spec §5, AC1).
    expect(cardListView).toContain('ToolbarItem(placement: .topBarTrailing)');
    expect(cardListView).toContain('Image(systemName: "arrow.up.arrow.down")');
    expect(cardListView).toContain('.accessibilityLabel(WatchL10n.string("watch.sort.title"))');

    // Presentation: a sheet hosting the picker (AC1).
    expect(cardListView).toContain('.sheet(isPresented: $showSortSheet)');
    expect(cardListView).toContain('WatchSortPickerView(selection: $sortMode)');
    expect(cardListView).toContain('struct WatchSortPickerView: View {');

    // Active row is double-encoded: checkmark + VoiceOver "selected" trait, never colour alone.
    expect(cardListView).toContain('Image(systemName: "checkmark")');
    expect(cardListView).toContain('.accessibilityAddTraits(isSelected ? .isSelected : [])');

    // Mode labels + control title are localised in BOTH bundles (cross-file coupling).
    for (const key of [
      'watch.sort.title',
      'watch.sort.frequent',
      'watch.sort.recent',
      'watch.sort.az'
    ]) {
      expect(cardListView).toContain(`"${key}"`);
      expect(enStrings).toContain(`"${key}" =`);
      expect(itStrings).toContain(`"${key}" =`);
    }
  });
  // Everything above reads the Swift source. Everything below RUNS it: the barcode
  // geometry is pure integer arithmetic, so the shipped solver is lifted out of
  // `WatchPresentationLayout.swift` and executed against the device table. CI has no
  // test action for `watch-ios/Tests/`, so without this a change that kept the names
  // and the shape while breaking the maths — a `round` for a `floor`, a swapped axis,
  // a tie that flips the orientation — would pass every other gate on a native path
  // that cannot be fixed over the air.
  describeOnMac('executed against the real Swift geometry solver', () => {
    // Every case runs in ONE `xcrun swift` process: compiling the harness costs a
    // couple of seconds, answering a few hundred cases costs nothing.
    const cases: GeometryCase[] = [];

    for (const container of CONTAINERS) {
      for (const units of UNIT_SWEEP) {
        cases.push({ ...container, format: 'EAN13', units });
        cases.push({ ...container, format: 'EAN13', units, current: 'horizontal' });
        cases.push({ ...container, format: 'EAN13', units, current: 'rotated' });
      }

      for (const units of Object.values(SYMBOL_UNITS)) {
        cases.push({ ...container, format: 'EAN13', units });
      }

      // The quiet-zone trade table is a WIDTH-axis fact, so query each watch's own
      // width against a container too short for the rotated axis to win. Querying the
      // full screen instead would let the taller axis pick up a module step the
      // shipped layout cannot reach, because it keeps the top strip.
      for (const screen of WATCH_SCREENS) {
        cases.push({
          width: screen.width,
          height: TRADE_TABLE_HEIGHT,
          format: 'EAN13',
          units: SYMBOL_UNITS.EAN13
        });
      }

      cases.push({ ...container, format: 'QR', units: null });
      cases.push({ ...container, format: 'EAN13', units: null });
    }

    // Sub-point wobble, aimed at a LIVE orientation boundary rather than a quiet
    // stretch: a 40 mm's screen width with a 165-unit symbol puts the crossing at
    // exactly 189 pt of height, where the rotated axis first reaches 2 px/module
    // against the horizontal axis's 1. Stepping 1/20 pt across it exercises the
    // tie-hold on one side, the switch on the other, and the transition between them.
    const WOBBLE_WIDTH = 162;
    const WOBBLE_UNITS = 165;
    const WOBBLE = Array.from({ length: 41 }, (_, step) => 188 + step * 0.05);

    for (const height of WOBBLE) {
      for (const current of ['horizontal', 'rotated'] as const) {
        cases.push({
          width: WOBBLE_WIDTH,
          height,
          format: 'EAN13',
          units: WOBBLE_UNITS,
          current
        });
      }
    }

    // A payload with no uniform rendering at any orientation, and its neighbour.
    const TINY = { width: 40, height: 60 };
    cases.push({ ...TINY, format: 'EAN13', units: 251 });
    cases.push({ ...TINY, format: 'EAN13', units: 80 });

    // A synthetic symbol for the bar-positioning queries: alternating bar/space widths
    // summing to 13 modules, plus EAN-13's asymmetric 11 + 7 quiet zone = 31 units.
    // Synthetic on purpose — what is under test is where the rectangles land, not
    // whether an encoder is right, which the symbology suite already proves against
    // BWIPP. Small enough that the expected rectangles can be derived by hand, and an
    // ODD number of elements so it starts and ends on a BAR, as every real linear
    // symbology does; with a trailing space the end gap is the quiet zone plus that
    // space, which is not the property under test.
    const SYMBOL = [1, 2, 1, 3, 1, 1, 2, 1, 1] as const;
    const QUIET = { leading: 11, trailing: 7 };
    const barCases: BarCase[] = [
      { modules: SYMBOL, ...QUIET, widthPixels: 100, heightPixels: 40, orientation: 'horizontal' },
      { modules: SYMBOL, ...QUIET, widthPixels: 40, heightPixels: 100, orientation: 'rotated' },
      // Exactly one pixel per module, and one pixel short of that.
      { modules: SYMBOL, ...QUIET, widthPixels: 21, heightPixels: 40, orientation: 'horizontal' },
      { modules: SYMBOL, ...QUIET, widthPixels: 20, heightPixels: 40, orientation: 'horizontal' },
      // A quiet zone lopsided enough that the SPEC RATIO ALONE would starve the
      // trailing side below the guaranteed floor, so the clamp has to bind. Without
      // it the 11:7 fixture above never asks the question — the proportional split
      // clears the floor on its own there, so removing the clamp changes nothing and
      // a regression would ship silently.
      {
        modules: SYMBOL,
        leading: 17,
        trailing: 1,
        widthPixels: 100,
        heightPixels: 40,
        orientation: 'horizontal'
      }
    ];

    // The trade table's realised margins, measured through the shipped bar layout at
    // each watch's own length axis, appended after the literal because they are
    // generated rather than written out.
    for (const screen of WATCH_SCREENS) {
      barCases.push({
        modules: EAN13_STAND_IN,
        ...QUIET,
        widthPixels: screen.width * WATCH_SCALE,
        heightPixels: 40,
        orientation: 'horizontal'
      });
    }

    let plan: ((query: GeometryCase) => GeometryRow) & { bars: (query: BarCase) => Bar[] };

    beforeAll(() => {
      plan = runGeometry(cases, barCases);
    });

    it('gives every module the same whole number of device pixels, and the largest that fits', () => {
      for (const container of CONTAINERS) {
        for (const units of UNIT_SWEEP) {
          const row = plan({ ...container, format: 'EAN13', units });
          const where = `${container.label}, ${units} units`;

          const guaranteed = units + MINIMUM_QUIET_UNITS_PER_SIDE * 2;

          expect(`${where}: ${row.module}`).toBe(`${where}: ${Math.trunc(row.module)}`);
          expect(row.module).toBeGreaterThanOrEqual(1);
          expect(row.symbolUnits).toBe(units);

          // Uniform: the symbol is exactly `units` modules of one width.
          expect(row.symbolPixelLength).toBe(row.module * units);
          // It fits, with the guaranteed quiet zone still clear on both sides …
          expect(
            row.symbolPixelLength + row.module * MINIMUM_QUIET_UNITS_PER_SIDE * 2
          ).toBeLessThanOrEqual(row.lengthPixels);
          // … and nothing wider does, so the module is maximised rather than merely
          // safe. This is the assertion that fails if the quiet zone ever goes back to
          // competing with the bars for pixels at the same price.
          expect((row.module + 1) * guaranteed).toBeGreaterThan(row.lengthPixels);
        }
      }
    });

    it('records the module width achieved instead of refusing to draw below a print floor', () => {
      for (const container of CONTAINERS) {
        for (const [format, units] of Object.entries(SYMBOL_UNITS)) {
          const row = plan({ ...container, format: 'EAN13', units });
          const where = `${format} on ${container.label}`;

          // Every watch affords at least three whole pixels per module for every
          // fixed-width symbology once the horizontal safe area is reclaimed —
          // measured at 3 px (0.234 mm) on a 40 mm and 4 px (0.312 mm) on a 46 mm.
          // Dividing by the symbol rather than the symbol plus its margins is worth
          // exactly one module step, and this is the assertion that holds it.
          const floor = container.width === screenWidth(container) ? 3 : 2;

          expect(`${where}: ${row.module >= floor}`).toBe(`${where}: true`);
          expect(row.moduleMillimetres).toBeCloseTo(row.module / (326 / 25.4), 6);
          expect(row.lengthFillRatio).toBeCloseTo(row.symbolPixelLength / row.lengthPixels, 6);
        }
      }
    });

    it('grows the module for a shorter symbol instead of leaving the space blank', () => {
      for (const container of CONTAINERS) {
        const short = plan({ ...container, format: 'EAN13', units: SYMBOL_UNITS.EAN8 });
        const long = plan({ ...container, format: 'EAN13', units: SYMBOL_UNITS.EAN13 });

        // EAN-8 is 67 symbol units against EAN-13's 95, so it must end up with a
        // wider module on the same screen — never the same symbol drawn smaller.
        expect(`${container.label}: ${short.module >= long.module}`).toBe(
          `${container.label}: true`
        );
        // A wider module is a physically wider bar, which is the claim that
        // matters. The fill RATIO is not: a short symbol quantises more coarsely, so
        // it can fill less of the box while printing wider bars than the long one.
        expect(short.moduleMillimetres).toBeGreaterThanOrEqual(long.moduleMillimetres);

        // What must fill the box is the IMAGE — that is the "use as much space as
        // possible" claim, and `widthFillRatio` is what measures it.
        if (long.orientation === 'horizontal') {
          expect(`${container.label}: ${long.widthFillRatio > 0.99}`).toBe(
            `${container.label}: true`
          );
        }
      }
    });

    it('frames the image at exactly the pixels it renders, inside the container', () => {
      for (const container of CONTAINERS) {
        for (const format of ['EAN13', 'QR']) {
          const units = format === 'QR' ? null : SYMBOL_UNITS.EAN13;
          const row = plan({ ...container, format, units });
          const where = `${format} on ${container.label}`;

          // Whole pixels, and the frame is exactly those pixels over the scale — so
          // `.frame()` and the bitmap are one number, not two roundings of one.
          expect(`${where}: ${Number.isInteger(row.pixelWidth)}`).toBe(`${where}: true`);
          expect(`${where}: ${Number.isInteger(row.pixelHeight)}`).toBe(`${where}: true`);
          expect(row.pointWidth * WATCH_SCALE).toBe(row.pixelWidth);
          expect(row.pointHeight * WATCH_SCALE).toBe(row.pixelHeight);

          // And it fits, with the value label's reserved strip still clear.
          expect(row.pointWidth).toBeLessThanOrEqual(container.width);
          expect(row.boxInnerPadding).toBe(0);

          // QR keeps its 112 pt floor (untouched by this story), which deliberately
          // wins over a container too short to hold it — so it is only held to the
          // fit where the floor leaves room. The linear path has no floor and must
          // fit everywhere.
          const floored = format === 'QR' && container.height < 112 + row.footerReservedHeight;

          if (!floored) {
            expect(row.pointHeight + row.footerReservedHeight).toBeLessThanOrEqual(
              container.height
            );
          }
        }
      }
    });

    it('rotates only where the long axis buys a wider module, and defaults to horizontal', () => {
      let sawRotation = false;

      for (const container of CONTAINERS) {
        for (const units of UNIT_SWEEP) {
          const row = plan({ ...container, format: 'EAN13', units });

          if (row.orientation === 'rotated') {
            sawRotation = true;

            // A rotated symbol must be running along the taller axis: its image is
            // taller than it is wide, and the length it divides is the height.
            expect(row.pixelHeight).toBeGreaterThan(row.pixelWidth);
            expect(row.lengthPixels).toBe(row.pixelHeight);
          } else {
            expect(row.orientation).toBe('horizontal');
            expect(row.lengthPixels).toBe(row.pixelWidth);
          }
        }
      }

      // The predicate is a computed consequence, so it must actually fire somewhere in
      // the supported line-up — otherwise this suite would pass on a stub that always
      // answered `horizontal`.
      expect(sawRotation).toBe(true);
    });

    it('never flips an orientation that is already on screen for a tie', () => {
      for (const container of CONTAINERS) {
        for (const units of UNIT_SWEEP) {
          const fromHorizontal = plan({
            ...container,
            format: 'EAN13',
            units,
            current: 'horizontal'
          });
          const fromRotated = plan({ ...container, format: 'EAN13', units, current: 'rotated' });
          const where = `${container.label}, ${units} units`;

          // Where the two incumbents disagree, each must have KEPT itself — that is a
          // tie, and keeping the incumbent is the whole hysteresis. The reverse
          // (`horizontal` incumbent leaving for rotated while the `rotated` incumbent
          // leaves for horizontal) is pure oscillation and must be impossible.
          if (fromHorizontal.orientation !== fromRotated.orientation) {
            expect(`${where}: ${fromHorizontal.orientation}/${fromRotated.orientation}`).toBe(
              `${where}: horizontal/rotated`
            );
          }

          // A linear symbol always resolves to one of the two orientations; `none`
          // belongs to QR and to a value with no symbol at all.
          expect(['horizontal', 'rotated']).toContain(fromHorizontal.orientation);

          // And a resolved orientation is a fixed point of its own resolution.
          const settled = plan({
            ...container,
            format: 'EAN13',
            units,
            current: fromHorizontal.orientation as 'horizontal' | 'rotated'
          });
          expect(settled.orientation).toBe(fromHorizontal.orientation);
        }
      }
    });

    it('does not let a fractional wobble in the container flip the symbol', () => {
      const sequences = Object.fromEntries(
        (['horizontal', 'rotated'] as const).map((current) => [
          current,
          WOBBLE.map(
            (height) =>
              plan({
                width: WOBBLE_WIDTH,
                height,
                format: 'EAN13',
                units: WOBBLE_UNITS,
                current
              }).orientation
          )
        ])
      ) as Record<'horizontal' | 'rotated', string[]>;

      for (const [current, sequence] of Object.entries(sequences)) {
        // Over two whole points of 1/20 pt steps the answer may move at most once, and
        // never back: a container drifting by a fraction of a point cannot make the
        // symbol oscillate.
        const changes = sequence.filter(
          (value, index) => index > 0 && value !== sequence[index - 1]
        );

        expect(`${current}: ${changes.length}`).toBe(`${current}: ${Math.min(changes.length, 1)}`);
      }

      // The sweep must actually STRADDLE the boundary, or the assertion above passes
      // for the wrong reason. A `horizontal` incumbent has to be seen switching …
      expect(new Set(sequences.horizontal)).toEqual(new Set(['horizontal', 'rotated']));

      // … while a `rotated` incumbent holds across the whole sweep, because below the
      // crossing the two orientations TIE and a tie keeps what is on screen. Those two
      // facts together are the hysteresis: the same inputs, two different answers,
      // each one stable.
      expect(new Set(sequences.rotated)).toEqual(new Set(['rotated']));
    });

    it('reports no drawable module when a payload cannot fit even one pixel per module', () => {
      // 251 units in a 40 pt box is 80 px: no uniform symbol exists at any
      // orientation, so the plan says so and `BarcodeGenerator` returns nil, which
      // sends the view to the human-readable placeholder for manual keying.
      const oversized = plan({ width: 40, height: 60, format: 'EAN13', units: 251 });
      expect(oversized.module).toBe(0);
      expect(oversized.symbolPixelLength).toBe(0);

      // One that does fit still draws — the boundary is "no uniform symbol exists",
      // never "the symbol is too small to satisfy a print spec".
      const drawable = plan({ width: 40, height: 60, format: 'EAN13', units: 80 });
      expect(drawable.module).toBeGreaterThanOrEqual(1);
    });

    it('leaves QR on its own square-fit branch with no module plan', () => {
      for (const container of CONTAINERS) {
        const qr = plan({ ...container, format: 'QR', units: null });

        expect(qr.orientation).toBe('none');
        expect(qr.module).toBe(0);
        expect(qr.pixelWidth).toBe(qr.pixelHeight);
        // The 112 pt floor still applies, so a QR is never planned smaller than that.
        expect(qr.pointWidth).toBeGreaterThanOrEqual(112);
      }
    });

    it('places every bar at a hand-derived pixel, horizontally and rotated', () => {
      const SYMBOL = [1, 2, 1, 3, 1, 1, 2, 1, 1] as const;
      const QUIET = { leading: 11, trailing: 7 };

      // 13 symbol units plus the guaranteed 4 + 4 quiet zone is a divisor of 21, so
      // 100 px gives a 4 px module and a 52 px symbol. The 48 px left over is the
      // quiet zone, split in EAN-13's 11:7 ratio — 48 x 11 / 18 = 29 leading, 19
      // trailing — so the first bar starts at 29 and each element is its module count
      // x 4. Derived by hand from the rule, not by re-running the implementation.
      expect(
        plan.bars({
          modules: SYMBOL,
          ...QUIET,
          widthPixels: 100,
          heightPixels: 40,
          orientation: 'horizontal'
        })
      ).toEqual([
        { x: 29, y: 0, width: 4, height: 40 },
        { x: 41, y: 0, width: 4, height: 40 },
        { x: 57, y: 0, width: 4, height: 40 },
        { x: 65, y: 0, width: 8, height: 40 },
        { x: 77, y: 0, width: 4, height: 40 }
      ]);

      // Rotated is the same walk down the other axis, measured from the top: a bar at
      // offset o of extent e lands at y = height - o - e, and spans the full width.
      expect(
        plan.bars({
          modules: SYMBOL,
          ...QUIET,
          widthPixels: 40,
          heightPixels: 100,
          orientation: 'rotated'
        })
      ).toEqual([
        { x: 0, y: 67, width: 40, height: 4 },
        { x: 0, y: 55, width: 40, height: 4 },
        { x: 0, y: 39, width: 40, height: 4 },
        { x: 0, y: 27, width: 40, height: 8 },
        { x: 0, y: 19, width: 40, height: 4 }
      ]);
    });

    it("gives the leftover to the quiet zone in the symbology's own ratio, in both axes", () => {
      const SYMBOL = [1, 2, 1, 3, 1, 1, 2, 1, 1] as const;
      const QUIET = { leading: 11, trailing: 7 };
      const symbolUnits = SYMBOL.reduce((sum, units) => sum + units, 0);

      for (const [orientation, widthPixels, heightPixels] of [
        ['horizontal', 100, 40],
        ['rotated', 40, 100]
      ] as const) {
        const bars = plan.bars({
          modules: SYMBOL,
          ...QUIET,
          widthPixels,
          heightPixels,
          orientation
        });
        const rotated = orientation === 'rotated';
        const lengthPixels = rotated ? heightPixels : widthPixels;
        const module = Math.floor(lengthPixels / (symbolUnits + MINIMUM_QUIET_UNITS_PER_SIDE * 2));

        // Reading order along the length axis. Rotated bars are emitted top-down, and
        // the bitmap's origin is bottom-left, so their `y` decreases.
        const spans = bars
          .map((bar) =>
            rotated
              ? { start: heightPixels - bar.y - bar.height, extent: bar.height }
              : { start: bar.x, extent: bar.width }
          )
          .sort((a, b) => a.start - b.start);

        expect(bars).toHaveLength(Math.ceil(SYMBOL.length / 2));

        // Every element is a whole number of modules — the property the whole story
        // exists to guarantee.
        for (const span of spans) {
          expect(span.extent % module).toBe(0);
        }

        // Bars never overlap and stay inside the bitmap.
        for (const [index, span] of spans.entries()) {
          expect(span.start).toBeGreaterThanOrEqual(0);
          expect(span.start + span.extent).toBeLessThanOrEqual(lengthPixels);

          const previous = spans[index - 1];

          if (previous) {
            expect(span.start).toBeGreaterThan(previous.start + previous.extent - 1);
          }
        }

        const first = spans[0];
        const last = spans[spans.length - 1];
        const leading = first?.start ?? 0;
        const trailing = lengthPixels - ((last?.start ?? 0) + (last?.extent ?? 0));

        // The three regions account for every pixel: quiet zone, symbol, quiet zone.
        expect(leading + module * symbolUnits + trailing).toBe(lengthPixels);

        // Each side keeps at least the guaranteed minimum, so a symbol can never sit
        // against the black bezel — which a decoder would read as another bar.
        expect(leading).toBeGreaterThanOrEqual(MINIMUM_QUIET_UNITS_PER_SIDE * module);
        expect(trailing).toBeGreaterThanOrEqual(MINIMUM_QUIET_UNITS_PER_SIDE * module);

        // And the split follows the symbology: EAN-13 asks for 11 leading against 7
        // trailing, so the leading zone must come out the wider of the two. Swapping
        // the two constants fails here.
        expect(leading).toBeGreaterThan(trailing);

        // The cross axis is spanned completely: a bar is full height horizontally and
        // full width rotated. A swapped axis fails here.
        for (const bar of bars) {
          expect(rotated ? bar.width : bar.height).toBe(rotated ? widthPixels : heightPixels);
          expect(rotated ? bar.x : bar.y).toBe(0);
        }
      }
    });

    it('clamps a lopsided split so neither side falls under the guaranteed floor', () => {
      const SYMBOL = [1, 2, 1, 3, 1, 1, 2, 1, 1] as const;
      const symbolUnits = SYMBOL.reduce((sum, units) => sum + units, 0);
      const module = Math.floor(100 / (symbolUnits + MINIMUM_QUIET_UNITS_PER_SIDE * 2));
      const floorPixels = MINIMUM_QUIET_UNITS_PER_SIDE * module;

      // 17:1 over a 48 px leftover would put 45 px leading and 3 px trailing — the
      // trailing side well under the 16 px floor. The clamp pulls it back to 32/16,
      // which is the closest the ratio can get while both sides keep their guarantee.
      const bars = plan.bars({
        modules: SYMBOL,
        leading: 17,
        trailing: 1,
        widthPixels: 100,
        heightPixels: 40,
        orientation: 'horizontal'
      });

      expect(bars).toEqual([
        { x: 32, y: 0, width: 4, height: 40 },
        { x: 44, y: 0, width: 4, height: 40 },
        { x: 60, y: 0, width: 4, height: 40 },
        { x: 68, y: 0, width: 8, height: 40 },
        { x: 80, y: 0, width: 4, height: 40 }
      ]);

      const first = bars[0];
      const last = bars[bars.length - 1];
      const leading = first?.x ?? 0;
      const trailing = 100 - ((last?.x ?? 0) + (last?.width ?? 0));

      // Both sides at or above the floor, and the trailing side pinned exactly to it —
      // which is what makes this case catch a removed clamp.
      expect(leading).toBeGreaterThanOrEqual(floorPixels);
      expect(trailing).toBe(floorPixels);
    });

    it('pins the quiet-zone floor to the trade it was chosen for', () => {
      // The floor is the one constant in this change with no published source, so the
      // table that justified it is enforced rather than just written down. At the
      // shipped value exactly one watch reaches 4 px/module and the tightest realised
      // margin stays above 4 X; lowering it would take the 45 mm and 49 mm up a step
      // at the cost of that margin. If this fails, the trade moved — re-derive it and
      // update `minimumQuietZoneUnitsPerSide`'s doc comment, which states the table.
      const wide: string[] = [];
      let tightestPerSide = Number.POSITIVE_INFINITY;

      for (const screen of WATCH_SCREENS) {
        const row = plan({
          width: screen.width,
          height: TRADE_TABLE_HEIGHT,
          format: 'EAN13',
          units: SYMBOL_UNITS.EAN13
        });

        // Short enough that the rotated axis cannot win, so this isolates the width.
        expect(row.orientation).toBe('horizontal');

        if (row.module >= 4) {
          wide.push(screen.name);
        }

        // The REALISED margins, from the shipped bar layout rather than from halving
        // the leftover — the ratio split and its clamp make the two sides unequal, and
        // an average would hide a trailing side sitting on the floor.
        const bars = plan.bars({
          modules: EAN13_STAND_IN,
          ...QUIET,
          widthPixels: screen.width * WATCH_SCALE,
          heightPixels: 40,
          orientation: 'horizontal'
        });
        const first = bars[0];
        const last = bars[bars.length - 1];
        const lengthPixels = screen.width * WATCH_SCALE;
        const leading = (first?.x ?? 0) / row.module;
        const trailing = (lengthPixels - ((last?.x ?? 0) + (last?.width ?? 0))) / row.module;

        expect(leading).toBeGreaterThanOrEqual(MINIMUM_QUIET_UNITS_PER_SIDE);
        expect(trailing).toBeGreaterThanOrEqual(MINIMUM_QUIET_UNITS_PER_SIDE);
        tightestPerSide = Math.min(tightestPerSide, leading, trailing);
      }

      expect(wide).toEqual(['46 mm']);

      // The floor is not a spare backstop: on whichever watch sits closest to a module
      // boundary the split clamps to it exactly, so the tightest realised margin in the
      // whole line-up EQUALS the floor. That is what makes choosing this constant a
      // direct choice of margin, and the table in its doc comment meaningful.
      expect(tightestPerSide).toBe(MINIMUM_QUIET_UNITS_PER_SIDE);
    });

    it('keeps the guaranteed quiet zone in step with the Swift that reserves it', () => {
      const layout = fs.readFileSync(layoutPath, 'utf8');
      const declared = layout.match(/static let minimumQuietZoneUnitsPerSide = (\d+)/)?.[1];

      // This constant is the one knob that trades quiet zone against module width, so
      // the suite must not quietly assert a different number from the one that ships.
      expect(Number(declared)).toBe(MINIMUM_QUIET_UNITS_PER_SIDE);
    });

    it('emits no bars at all when the symbol cannot fit one pixel per module', () => {
      const SYMBOL = [1, 2, 1, 3, 1, 1, 2, 1, 1] as const;
      const QUIET = { leading: 11, trailing: 7 };

      // 13 symbol units plus the 8 guaranteed quiet-zone units is a divisor of 21, so
      // exactly 21 px is a 1 px module — small, uniform, and drawn.
      expect(
        plan.bars({
          modules: SYMBOL,
          ...QUIET,
          widthPixels: 21,
          heightPixels: 40,
          orientation: 'horizontal'
        })
      ).toHaveLength(5);

      // One pixel less and no uniform symbol exists, so the renderer has nothing to
      // fill and `generateImage` returns nil — the placeholder contract.
      expect(
        plan.bars({
          modules: SYMBOL,
          ...QUIET,
          widthPixels: 20,
          heightPixels: 40,
          orientation: 'horizontal'
        })
      ).toEqual([]);
    });

    it('keeps the placeholder box for a value no encoder accepts', () => {
      for (const container of CONTAINERS) {
        const unencodable = plan({ ...container, format: 'EAN13', units: null });

        // No symbol to plan, so no orientation and no module — but a full-width box,
        // because the view still draws the human-readable number in it.
        expect(unencodable.orientation).toBe('none');
        expect(unencodable.module).toBe(0);
        expect(unencodable.pointWidth).toBe(container.width);
      }
    });
  });
});

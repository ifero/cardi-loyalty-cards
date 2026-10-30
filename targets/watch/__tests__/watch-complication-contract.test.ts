import fs from 'node:fs';
import path from 'node:path';

import { IDENTITY_COLORS } from '@/shared/theme/tokens.generated';

import { describeOnMac, runSwiftProgram, swiftDeclaration } from './swift-source-helpers';

const repoRoot = path.resolve(__dirname, '../../..');
const complicationPath = path.join(repoRoot, 'targets', 'watch', 'ComplicationProvider.swift');
const watchConfigPath = path.join(repoRoot, 'targets', 'watch', 'expo-target.config.js');
const watchWidgetConfigPath = path.join(
  repoRoot,
  'targets',
  'watch-widget',
  'expo-target.config.js'
);
const widgetDir = path.join(repoRoot, 'targets', 'watch-widget');
const watchWidgetSwiftPath = path.join(widgetDir, 'WatchComplicationWidget.swift');
const assetsDir = path.join(widgetDir, 'Assets.xcassets');
const watchWidgetEnLprojPath = path.join(widgetDir, 'en.lproj', 'Localizable.strings');
const watchWidgetItLprojPath = path.join(widgetDir, 'it.lproj', 'Localizable.strings');
const watchInfoPath = path.join(repoRoot, 'targets', 'watch', 'Info.plist');
const watchSessionPath = path.join(repoRoot, 'targets', 'watch', 'WatchSessionManager.swift');
const cardListViewPath = path.join(repoRoot, 'targets', 'watch', 'CardListView.swift');
const barcodePagerPath = path.join(repoRoot, 'targets', 'watch', 'BarcodePagerView.swift');
const watchEnLprojPath = path.join(repoRoot, 'targets', 'watch', 'en.lproj', 'Localizable.strings');
const watchItLprojPath = path.join(repoRoot, 'targets', 'watch', 'it.lproj', 'Localizable.strings');
const watchAppPath = path.join(repoRoot, 'targets', 'watch', 'MyLoyaltyCardsWatchApp.swift');
const contentViewPath = path.join(repoRoot, 'targets', 'watch', 'ContentView.swift');

const widgetLabel = 'WatchComplicationWidget.swift';

/**
 * The widget's source with its comments removed. Its comments explain what it replaced, so an
 * absence assertion has to read code only. A `//` straight after a `:` is kept, so the
 * `cardi://watch` URL is not cut short.
 */
const widgetCode = () =>
  fs
    .readFileSync(watchWidgetSwiftPath, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('watch complication contract', () => {
  it('keeps watch app URL scheme registration and disables legacy ClockKit registration', () => {
    const infoPlist = fs.readFileSync(watchInfoPath, 'utf8');

    expect(infoPlist).toContain('<key>CFBundleURLTypes</key>');
    expect(infoPlist).toContain('<string>cardi</string>');
    expect(infoPlist).not.toContain('<key>CLKComplicationPrincipalClass</key>');
    expect(infoPlist).not.toContain('<key>CLKComplicationSupportedFamilies</key>');
  });

  it('uses WidgetKit timeline reload and removes deprecated ClockKit provider usage', () => {
    const source = fs.readFileSync(complicationPath, 'utf8');

    expect(source).toContain('import WidgetKit');
    expect(source).not.toContain('import ClockKit');
    expect(source).toContain('enum ComplicationReloader');
    expect(source).toContain('static let widgetKind = "MyLoyaltyCardsWatchComplication"');
    expect(source).toContain('WidgetCenter.shared.reloadTimelines(ofKind: widgetKind)');
    expect(source).not.toContain('CLKComplicationServer.sharedInstance()');
    expect(source).not.toContain('CLKComplicationDataSource');
  });

  it('keeps shared complication state keys and persistence helpers for widget data', () => {
    const source = fs.readFileSync(complicationPath, 'utf8');

    expect(source).toContain('enum ComplicationSharedState');
    expect(source).toContain('static let topCardNameKey');
    expect(source).toContain('static let topCardIdKey = "watch.complication.topCardId"');
    expect(source).toContain('static let hasCardsKey');
    expect(source).toContain('static let cardsKey');
    expect(source).toContain('static func persistTopCardName');
    expect(source).toContain('static func persistTopCardId');
    expect(source).toContain('static func persistCards');
  });

  it('publishes the top card’s id beside its name at both call sites (decision 3)', () => {
    // Both sites write the cards snapshot first (the reader shows a name, and attaches an id, only
    // when that snapshot holds the card), then take ONE card from `sortedForDisplay` and write its
    // name and its id, so the id the widget opens is the id of the card it names; the one reload
    // follows the writes.
    for (const [file, cards] of [
      [cardListViewPath, 'decoded'],
      [watchSessionPath, 'cards']
    ] as const) {
      const source = fs.readFileSync(file, 'utf8');

      expect(source).toMatch(
        new RegExp(
          `ComplicationSharedState\\.persistCards\\(${cards}\\)\\s+` +
            `let topCard = WatchCard\\.sortedForDisplay\\(${cards}\\)\\.first\\s+` +
            'ComplicationSharedState\\.persistTopCardName\\(topCard\\?\\.name\\)\\s+' +
            'ComplicationSharedState\\.persistTopCardId\\(topCard\\?\\.id\\)\\s+' +
            'ComplicationReloader\\.reloadAllActiveComplications\\(\\)'
        )
      );
      expect(source.split('ComplicationSharedState.persistCards(').length - 1).toBe(1);
      expect(source.split('ComplicationSharedState.persistTopCardId(').length - 1).toBe(1);
      // The name-only write it replaces.
      expect(source).not.toContain('let topCardName = WatchCard.sortedForDisplay(');
    }
  });

  it('reloads active complications after sync and migration updates', () => {
    const source = fs.readFileSync(complicationPath, 'utf8');
    const session = fs.readFileSync(watchSessionPath, 'utf8');
    const cardList = fs.readFileSync(cardListViewPath, 'utf8');

    expect(source).toContain('WidgetCenter.shared.reloadTimelines(ofKind: widgetKind)');
    expect(session).toContain('ComplicationReloader.reloadAllActiveComplications()');
    expect(cardList).toContain('ComplicationReloader.reloadAllActiveComplications()');
  });

  it('treats empty phone snapshots as valid so stale cards are removed', () => {
    const session = fs.readFileSync(watchSessionPath, 'utf8');

    expect(session).toContain('if array.isEmpty {');
    expect(session).toContain('return []');
  });

  it('keeps complication tap launch flow anchored to card list root', () => {
    const watchApp = fs.readFileSync(watchAppPath, 'utf8');
    const contentView = fs.readFileSync(contentViewPath, 'utf8');

    expect(watchApp).toContain('WindowGroup {');
    expect(watchApp).toContain('ContentView()');
    expect(contentView).toContain('CardListView()');
  });

  it('keeps watch target config aligned with WidgetKit usage', () => {
    const config = fs.readFileSync(watchConfigPath, 'utf8');

    expect(config).toContain("type: 'watch'");
    expect(config).not.toContain("'ClockKit'");
    expect(config).toContain("'WidgetKit'");
    expect(config).toContain('com.apple.security.application-groups');
    expect(config).toContain('group.com.iferoporefi.myloyaltycards.watch-complication');
  });

  it('declares the widget as a static, non-configurable complication in all four families', () => {
    const config = fs.readFileSync(watchWidgetConfigPath, 'utf8');
    const source = fs.readFileSync(watchWidgetSwiftPath, 'utf8');

    expect(config).toContain("type: 'watch-widget'");
    expect(config).toContain('group.com.iferoporefi.myloyaltycards.watch-complication');
    expect(source).toContain('@main');
    expect(source).toContain('WidgetBundle');
    expect(source).toContain('StaticConfiguration(');
    // All four, corner included: cardi-watch-grammar.md §10 designs every family declared here.
    expect(swiftDeclaration(source, '.supportedFamilies([', widgetLabel)).toBe(
      '.supportedFamilies([\n' +
        '      .accessoryCircular,\n' +
        '      .accessoryRectangular,\n' +
        '      .accessoryInline,\n' +
        '      .accessoryCorner,\n' +
        '    ]'
    );
    // Non-configurable by design: the card it names is the watch app's `sortedForDisplay` top card.
    expect(source).not.toContain('AppIntentConfiguration');
    expect(source).not.toContain('selectedCard');
    expect(source).not.toContain('import ClockKit');
  });

  it('opens the named card from every family that names it, and the card list from circular or with none (decision 3)', () => {
    const code = widgetCode();
    const entry = swiftDeclaration(
      code,
      'struct WatchComplicationEntry: TimelineEntry {',
      widgetLabel
    );

    // Once, on the entry view's body, so no family can set its own or point anywhere else.
    expect(code.split('.widgetURL(').length - 1).toBe(1);
    expect(swiftDeclaration(code, 'var body: some View {', widgetLabel)).toContain(
      '.widgetURL(namesCard ? entry.tapURL : WatchComplicationEntry.cardListURL)'
    );
    // Corner, rectangular and inline show the card's name; circular draws only the mark, so it
    // names no card and opens the list.
    expect(swiftDeclaration(code, 'private var namesCard: Bool {', widgetLabel)).toMatch(
      /switch family \{\s+case \.accessoryInline, \.accessoryRectangular, \.accessoryCorner:\s+return true\s+default:\s+return false\s+\}/
    );
    // The card's barcode route when the entry carries an id, built with `URLComponents` so the id
    // is percent-encoded; the card list otherwise. The harness below parses it with the app's own
    // `WatchComplicationDeepLink`.
    expect(swiftDeclaration(entry, 'var tapURL: URL? {', widgetLabel)).toMatch(
      /guard let topCardId else \{\s+return Self\.cardListURL\s+\}\s+var card = URLComponents\(\)\s+card\.scheme = "cardi"\s+card\.host = "watch-card"\s+card\.queryItems = \[URLQueryItem\(name: "id", value: topCardId\)\]\s+return card\.url \?\? Self\.cardListURL\s+\}$/
    );
    expect(entry).toContain('static let cardListURL = URL(string: "cardi://watch")');
    // The fixed URL it replaces, which sent every family to the card list.
    expect(code).not.toContain('.widgetURL(URL(string:');
  });

  it('opens no barcode for a card the watch no longer holds (decision 3)', () => {
    // The tap lands in the watch app's existing route, which this story does not edit: a link to a
    // card the list does not hold only waits for that id, and the list stays on screen.
    const cardList = fs.readFileSync(cardListViewPath, 'utf8');

    expect(swiftDeclaration(cardList, '.onOpenURL {', 'CardListView.swift')).toMatch(
      /guard let cardId = WatchComplicationDeepLink\.cardId\(from: url\) else \{\s+return\s+\}\s+openCardRouteIfAvailable\(cardId\)/
    );
    expect(
      swiftDeclaration(
        cardList,
        'private func openCardRouteIfAvailable(_ cardId: String) {',
        'CardListView.swift'
      )
    ).toMatch(
      /^private func openCardRouteIfAvailable\(_ cardId: String\) \{\s+guard displayCards\.contains\(where: \{ \$0\.id == cardId \}\) else \{\s+pendingDeepLinkCardId = cardId\s+return\s+\}/
    );
  });

  it('reads the App Group snapshot under the writer’s own suite and keys', () => {
    // The widget cannot import the watch app's `ComplicationSharedState`, so it states the same
    // literals; a drift on either side would leave the complication on its fallback forever.
    const writer = swiftDeclaration(
      fs.readFileSync(complicationPath, 'utf8'),
      'enum ComplicationSharedState {',
      'ComplicationProvider.swift'
    );
    const reader = swiftDeclaration(widgetCode(), 'enum ComplicationSnapshot {', widgetLabel);

    for (const name of ['suiteName', 'topCardNameKey', 'topCardIdKey', 'hasCardsKey', 'cardsKey']) {
      const literal = new RegExp(`static let ${name} = "([^"]+)"`);
      const written = writer.match(literal)?.[1];

      expect(written).toBeDefined();
      expect(reader.match(literal)?.[1]).toBe(written);
    }

    expect(reader).toContain('UserDefaults(suiteName: suiteName)');
    expect(reader).toContain('defaults.bool(forKey: hasCardsKey)');
    expect(reader).toContain('defaults.string(forKey: topCardNameKey)');
    expect(reader).toContain('defaults.string(forKey: topCardIdKey)');
    expect(reader).toContain('defaults.data(forKey: cardsKey)');
  });

  it('reads the snapshot on every timeline request and reloads only when the watch app asks', () => {
    const code = widgetCode();
    const provider = swiftDeclaration(
      code,
      'struct WatchComplicationTimelineProvider: TimelineProvider {',
      widgetLabel
    );
    const reloader = fs.readFileSync(complicationPath, 'utf8');

    expect(provider).toMatch(
      /let topCard = ComplicationSnapshot\.topCard\(\)\s+return WatchComplicationEntry\(date: Date\(\), topCardName: topCard\?\.name, topCardId: topCard\?\.id\)/
    );
    expect(provider).toContain('completion(currentEntry())');
    expect(provider).toContain('Timeline(entries: [currentEntry()], policy: .never)');
    // The watch app's reload names this kind; a renamed kind would reload nothing.
    expect(code).toContain('let kind: String = "MyLoyaltyCardsWatchComplication"');
    expect(reloader).toContain('static let widgetKind = "MyLoyaltyCardsWatchComplication"');
  });

  it('draws the generated mark under the 76 px budget, and no stand-in glyph', () => {
    const code = widgetCode();
    const helper = fs.readFileSync(path.join(widgetDir, 'ComplicationImage.swift'), 'utf8');

    expect(code).toContain('let mark: Image? = ComplicationImage.make("OpenAppIcon")');
    expect(code).toContain('let glyph: Image? = ComplicationImage.make("OpenAppIconGlyph")');
    // Neither call widens the budget: both take `ComplicationImage`'s 38 pt x 2 defaults.
    expect(code.match(/ComplicationImage\.make\([^)]*\)/g)).toEqual([
      'ComplicationImage.make("OpenAppIcon")',
      'ComplicationImage.make("OpenAppIconGlyph")'
    ]);
    // The empty, name-colliding AppIcon imageset must not be referenced.
    expect(code).not.toContain('Image("AppIcon")');
    // Bitmaps are downsampled (full-size art fails WidgetKit archiving → grey).
    expect(helper).toContain('CGImageSourceCreateThumbnailAtIndex');
    for (const set of ['OpenAppIcon', 'OpenAppIconGlyph']) {
      expect(fs.existsSync(path.join(assetsDir, `${set}.imageset`, 'Contents.json'))).toBe(true);
    }
    expect(fs.existsSync(path.join(assetsDir, 'AppIcon.imageset'))).toBe(false);
    // The pre-Cardì fallback: a card symbol in the old blue, shown when the asset failed to load.
    // A missing mark now falls back to text, and the artwork is no longer forced to full colour.
    expect(code).not.toContain('creditcard.fill');
    expect(code).not.toContain('Image(systemName');
    expect(code).not.toContain('1A73E8');
    expect(code).not.toContain('.renderingMode(.original)');
  });

  it('states the 76 px budget once in the downsampler', () => {
    const helper = fs.readFileSync(path.join(widgetDir, 'ComplicationImage.swift'), 'utf8');

    expect(helper).toContain('The budget is 76 px: `maxPoint` 38 × `scale` 2.');
    // The comment it replaces gave the corner ceiling two ways that do not reconcile at x2.
    expect(helper).not.toContain('81.6');
    expect(helper).not.toContain('46pt');
  });

  it('paints in the grammar’s ink, beam and cream, and no system fill stands in for ink', () => {
    const code = widgetCode();

    // Read from the tokens rather than retyped, so a token change turns this red until the widget
    // follows it.
    expect(
      swiftDeclaration(code, 'enum ComplicationColor {', widgetLabel).match(/static let .+/g)
    ).toEqual([
      `static let ink = Color(hex: "${IDENTITY_COLORS.ink}")`,
      `static let beam = Color(hex: "${IDENTITY_COLORS.beam}")`,
      `static let cream = Color(hex: "${IDENTITY_COLORS.cream}")`
    ]);
    expect(code).toContain('.containerBackground(ComplicationColor.ink, for: .widget)');
    expect(code).not.toContain('.fill.tertiary');
    expect(code).not.toContain('AccessoryWidgetBackground');
    expect(code).not.toMatch(/Color\.(blue|red|green|orange|yellow|white|gray|black)\b/);
    // Every colour the families draw is one of the three.
    expect([...code.matchAll(/\.foregroundStyle\(([^)]+)\)/g)].map((match) => match[1])).toEqual([
      'ComplicationColor.beam',
      'ComplicationColor.cream',
      'ComplicationColor.cream',
      'ComplicationColor.cream',
      'ComplicationColor.cream'
    ]);
  });

  it('routes each family to its §10 design', () => {
    const content = swiftDeclaration(widgetCode(), 'private var content: some View {', widgetLabel);

    expect(content).toMatch(
      /case \.accessoryInline:\s+inline\s+case \.accessoryRectangular:\s+rectangular\s+case \.accessoryCorner:\s+corner\s+default:\s+disc\s+\}/
    );
  });

  it('draws circular and every disc as the mark clipped round, falling back to text', () => {
    const disc = swiftDeclaration(widgetCode(), 'private var disc: some View {', widgetLabel);

    // The app name stands IN PLACE of the mark when the asset fails to load, never beside it.
    expect(disc).toMatch(
      /if let mark \{\s+markArtwork\(mark\)\s+\.clipShape\(Circle\(\)\)\s+\} else \{\s+Text\(verbatim: WatchWidgetL10n\.string\("watch\.widget\.complication\.app_name"\)\)/
    );
  });

  it('puts the card’s name on the corner arc in cream, and only the mark with no card', () => {
    const corner = swiftDeclaration(widgetCode(), 'private var corner: some View {', widgetLabel);

    expect(corner).toMatch(
      /if let name = entry\.topCardName \{\s+disc\s+\.widgetLabel \{\s+Text\(verbatim: name\)\s+\.foregroundStyle\(ComplicationColor\.cream\)\s+\}\s+\} else \{\s+disc\s+\}/
    );
  });

  it('gives the rectangular family the mark and two lines, never a third (decision 2)', () => {
    const rectangular = swiftDeclaration(
      widgetCode(),
      'private var rectangular: some View {',
      widgetLabel
    );
    const branches = rectangular.match(
      /if let name = entry\.topCardName \{([\s\S]*)\} else \{([\s\S]*)\}\s+Spacer\(minLength: 0\)/
    );
    const card = branches?.[1] ?? '';

    expect(branches).not.toBeNull();
    // The disc is drawn before the branch, so it shows with a card and without one; with no mark it
    // is dropped and the text stands alone.
    expect(rectangular).toMatch(
      /if mark != nil \{\s+disc\s+\.frame\(width: 30, height: 30\)\s+\}\s+if let name/
    );
    // Line 1, the app name: beam, 10 pt, 600, uppercase, tracked 0.06 em (0.6 pt at 10 pt).
    // Each line is held to one line, so a long name truncates rather than wrapping into a third.
    expect(card).toMatch(
      /Text\(verbatim: WatchWidgetL10n\.string\("watch\.widget\.complication\.app_name"\)\)\s+\.font\(\.system\(size: 10, weight: \.semibold\)\)\s+\.tracking\(0\.6\)\s+\.textCase\(\.uppercase\)\s+\.foregroundStyle\(ComplicationColor\.beam\)\s+\.widgetAccentable\(\)\s+\.lineLimit\(1\)/
    );
    // Line 2, the card's name in cream.
    expect(card).toMatch(
      /Text\(verbatim: name\)\s+\.font\(\.system\(size: 15, weight: \.semibold\)\)\s+\.foregroundStyle\(ComplicationColor\.cream\)\s+\.lineLimit\(1\)/
    );
    expect(card.split('Text(').length - 1).toBe(2);
    // The shipped open-app row it replaces: a 24 pt rounded icon beside "Open app" in caption.
    expect(widgetCode()).not.toContain('.frame(width: 24, height: 24)');
    expect(widgetCode()).not.toContain('RoundedRectangle(cornerRadius: 5');
  });

  it('gives the rectangular family the disc and "Open app" on one line with no card', () => {
    const rectangular = swiftDeclaration(
      widgetCode(),
      'private var rectangular: some View {',
      widgetLabel
    );
    const noCard = rectangular.match(/\} else \{([\s\S]*)\}\s+Spacer\(minLength: 0\)/)?.[1] ?? '';

    // Today's open-app title alone, in the card name's place and style. ifero declined
    // "CARDÌ" over "Open app" (2026-10-29): the app name labels a card's name, and there is none.
    expect(noCard).toMatch(
      /^\s*Text\(verbatim: WatchWidgetL10n\.string\("watch\.widget\.complication\.entry\.open_app\.title"\)\)\s+\.font\(\.system\(size: 15, weight: \.semibold\)\)\s+\.foregroundStyle\(ComplicationColor\.cream\)\s+\.lineLimit\(1\)\s*$/
    );
    expect(noCard).not.toContain('app_name');
  });

  it('gives the inline family the glyph and the card’s name, or "Open Cardì"', () => {
    const inline = swiftDeclaration(widgetCode(), 'private var inline: some View {', widgetLabel);

    expect(inline).toContain(
      'let text = entry.topCardName ?? WatchWidgetL10n.string("watch.widget.complication.inline.open")'
    );
    // The glyph beside the text, and the text alone when the glyph fails to load.
    expect(inline).toMatch(
      /if let glyph \{\s+HStack\(spacing: 4\) \{\s+glyph\s+\.resizable\(\)\s+\.scaledToFit\(\)\s+Text\(verbatim: text\)\s+\}\s+\} else \{\s+Text\(verbatim: text\)\s+\}/
    );
    expect(inline).not.toContain('mark');
  });

  it('tints the mark by its shape, and the beam label with the face’s accent', () => {
    const artwork = swiftDeclaration(
      widgetCode(),
      'private func markArtwork(_ image: Image) -> some View {',
      widgetLabel
    );

    // Luminance becomes the tint's alpha, so the ink field falls away and the bars and beam stay.
    // On watchOS 10 the other branch joins the accent group instead (unverified on a device).
    expect(artwork).toMatch(
      /if #available\(watchOS 11\.0, \*\) \{\s+image\s+\.resizable\(\)\s+\.widgetAccentedRenderingMode\(\.accentedDesaturated\)\s+\.scaledToFit\(\)\s+\} else \{\s+image\s+\.resizable\(\)\s+\.scaledToFit\(\)\s+\.widgetAccentable\(\)\s+\}/
    );
    expect(widgetCode().split('.widgetAccentable()').length - 1).toBe(2);
  });

  it('carries no store and no card number to the face (decision 2)', () => {
    const code = widgetCode();
    const reader = swiftDeclaration(code, 'enum ComplicationSnapshot {', widgetLabel);

    // The two fields decoded from the writer's snapshot are the card's id, which only the tap's
    // URL carries (decision 3), and its name.
    expect(reader).toMatch(
      /private struct CardSnapshot: Decodable \{\s+let id: String\s+let name: String\s+\}/
    );
    expect(reader).not.toContain('struct CardName');
    for (const field of ['brandId', 'colorHex', 'barcode', 'store']) {
      expect(code).not.toContain(field);
    }
  });

  it('localizes the complication text in English and Italian, and keeps the unused keys', () => {
    const source = fs.readFileSync(watchWidgetSwiftPath, 'utf8');
    const en = fs.readFileSync(watchWidgetEnLprojPath, 'utf8');
    const it = fs.readFileSync(watchWidgetItLprojPath, 'utf8');

    for (const key of [
      'watch.widget.complication.inline.open',
      'watch.widget.complication.entry.open_app.title',
      'watch.widget.complication.entry.open_app.subtitle',
      'watch.widget.complication.app_name'
    ]) {
      expect(source).toContain(`WatchWidgetL10n.string("${key}")`);
      expect(en).toContain(`"${key}" =`);
      expect(it).toContain(`"${key}" =`);
    }

    expect(en).toContain('"watch.widget.complication.app_name" = "Cardì";');
    expect(it).toContain('"watch.widget.complication.app_name" = "Cardì";');
    // Twelve keys shipped before this story and stay; it adds one.
    expect(en.match(/^"watch\.widget\.complication\.[^"]+" = /gm)).toHaveLength(13);
    expect(it.match(/^"watch\.widget\.complication\.[^"]+" = /gm)).toHaveLength(13);
  });

  it('keeps the widget asset catalog well-formed (valid colorset Contents.json)', () => {
    for (const set of ['$widgetBackground.colorset', 'AccentColor.colorset']) {
      const contents = path.join(assetsDir, set, 'Contents.json');
      expect(fs.existsSync(contents)).toBe(true);
      expect(() => JSON.parse(fs.readFileSync(contents, 'utf8'))).not.toThrow();
    }
  });

  it('localizes watch app deep-link unavailable text in English and Italian', () => {
    // The line is drawn by the barcode route's host, the pager, since Story 23.2: it moved there
    // from the list's destination, where Story 23.2's first pass had already taken it from white at
    // 70 % on black to cream at 60 % on ground.
    const pager = fs.readFileSync(barcodePagerPath, 'utf8');
    const en = fs.readFileSync(watchEnLprojPath, 'utf8');
    const it = fs.readFileSync(watchItLprojPath, 'utf8');

    expect(pager).toContain('WatchL10n.string("watch.cards.unavailable")');
    expect(en).toContain('"watch.cards.unavailable" = "Card unavailable";');
    expect(it).toContain('"watch.cards.unavailable" = "Carta non disponibile";');
  });
});

/**
 * The snapshot round trip, run: the watch app's real writer writes, the widget's real reader reads,
 * and the watch app's real parser reads the URL the widget's tap would open.
 *
 * The declarations are lifted verbatim and run as one program over an in-memory stand-in for
 * their `UserDefaults` suite, so nothing is written to the machine's preferences: cfprefsd writes
 * a real suite's file back lazily, after any cleanup a test can do. The keys, the JSON snapshot and
 * the trimming all pass through untouched; only the store is swapped. `WatchCard` is stubbed with
 * the four fields `persistCards` maps, which is all of it the writer reads. The widget's own
 * provider builds each entry, and `WatchComplicationDeepLink` from `CardListView.swift` parses its
 * `tapURL`, so the id the face would open is the one the app's route receives. A failure here means
 * a sync can leave the face naming a card that is gone, or no card at all when there is one, or a
 * tap opening a card other than the one named.
 */
describeOnMac('the snapshot reader against the real writer', () => {
  /** Swap one call for the stand-in, and fail loudly if the call is not there to swap. */
  const swap = (declaration: string, call: string, replacement: string, label: string) => {
    if (!declaration.includes(call)) {
      throw new Error(`${label} no longer contains \`${call}\`; update the harness`);
    }
    return declaration.replaceAll(call, replacement);
  };

  const run = () => {
    const writerSource = fs.readFileSync(complicationPath, 'utf8');
    const widgetSource = fs.readFileSync(watchWidgetSwiftPath, 'utf8');
    const writer = swap(
      swiftDeclaration(
        writerSource,
        'enum ComplicationSharedState {',
        'ComplicationProvider.swift'
      ),
      'UserDefaults(suiteName: suiteName) ?? .standard',
      'MemoryDefaults.shared',
      'ComplicationProvider.swift'
    );
    const reader = swap(
      swiftDeclaration(widgetSource, 'enum ComplicationSnapshot {', widgetLabel),
      'let defaults = UserDefaults(suiteName: suiteName),',
      'let defaults = Optional(MemoryDefaults.shared),',
      widgetLabel
    );

    const program = [
      'import Foundation',
      'import WidgetKit',
      'final class MemoryDefaults {',
      '  static let shared = MemoryDefaults()',
      '  private var store: [String: Any] = [:]',
      '  func set(_ value: Any?, forKey key: String) { store[key] = value }',
      '  func removeObject(forKey key: String) { store[key] = nil }',
      '  func bool(forKey key: String) -> Bool { store[key] as? Bool ?? false }',
      '  func string(forKey key: String) -> String? { store[key] as? String }',
      '  func data(forKey key: String) -> Data? { store[key] as? Data }',
      '}',
      'struct WatchCard { let id: String; let name: String; let brandId: String?; let colorHex: String? }',
      swiftDeclaration(
        writerSource,
        'struct ComplicationCardSnapshot: Codable, Sendable {',
        'ComplicationProvider.swift'
      ),
      writer,
      reader,
      swiftDeclaration(widgetSource, 'struct WatchComplicationEntry: TimelineEntry {', widgetLabel),
      swiftDeclaration(
        widgetSource,
        'struct WatchComplicationTimelineProvider: TimelineProvider {',
        widgetLabel
      ),
      swiftDeclaration(
        fs.readFileSync(cardListViewPath, 'utf8'),
        'private enum WatchComplicationDeepLink {',
        'CardListView.swift'
      ),
      // `currentEntry()` is private to the provider; an extension in the same file may call it.
      'extension WatchComplicationTimelineProvider { func entry() -> WatchComplicationEntry { currentEntry() } }',
      'func card(_ id: String, _ name: String) -> WatchCard { WatchCard(id: id, name: name, brandId: nil, colorHex: nil) }',
      // As both call sites write: the cards, then the top card's name and its id.
      'func sync(_ cards: [WatchCard], name: String?, id: String?) {',
      '  ComplicationSharedState.persistCards(cards)',
      '  ComplicationSharedState.persistTopCardName(name)',
      '  ComplicationSharedState.persistTopCardId(id)',
      '}',
      'func read(_ label: String) {',
      '  let entry = WatchComplicationTimelineProvider().entry()',
      '  let stored = MemoryDefaults.shared.string(forKey: ComplicationSharedState.topCardIdKey)',
      '  let opened = entry.tapURL.flatMap(WatchComplicationDeepLink.cardId(from:))',
      '  print([label, entry.topCardName ?? "<none>", stored ?? "<unset>",',
      '         entry.tapURL?.absoluteString ?? "<nil>", opened ?? "<list>"].joined(separator: "|"))',
      '}',
      'read("fresh")',
      'sync([card("e1", "Esselunga"), card("c1", "Coop")], name: "Esselunga", id: "e1")',
      'read("synced")',
      'sync([card("c1", "Coop"), card("l1", "Lidl")], name: "Lidl", id: "l1")',
      'read("resynced")',
      'sync([card("c1", "Coop")], name: "  Coop  ", id: "  c1  ")',
      'read("trimmed")',
      'sync([card("c1", "Coop"), card("c2", "Coop")], name: "Coop", id: "c2")',
      'read("same-name")',
      'sync([card("c1", "Coop")], name: "Esselunga", id: "e1")',
      'read("not-in-snapshot")',
      'sync([card("e1", "Esselunga"), card("c1", "Coop")], name: "Coop", id: "e1")',
      'read("id-of-another-card")',
      'sync([card("c1", "Coop")], name: "Coop", id: nil)',
      'read("no-id-written")',
      'sync([card("a b&c=d", "Coop")], name: "Coop", id: "a b&c=d")',
      'read("encoded")',
      'sync([], name: nil, id: nil)',
      'read("emptied")',
      ''
    ].join('\n');

    return runSwiftProgram({
      program,
      input: '',
      label: `${widgetLabel} + ComplicationProvider.swift + CardListView.swift`,
      hint:
        'The widget reads what the watch app writes after every sync, and the app opens what the ' +
        'widget links to; a failure means the face can name the wrong card, a card that is gone, ' +
        'or none when there is one, or a tap can open a card other than the one named.'
    });
  };

  /** One row per read: label, name shown, id stored, the tap's URL, and the id the app opens. */
  let rows: string[][] = [];

  beforeAll(() => {
    rows = run()
      .trim()
      .split('\n')
      .map((line) => line.split('|'));
  });

  it('names the top card the last sync wrote, and nothing when there is none', () => {
    expect(rows.map(([label, name]) => `${label}=${name}`)).toEqual([
      'fresh=<none>',
      'synced=Esselunga',
      'resynced=Lidl',
      'trimmed=Coop',
      'same-name=Coop',
      'not-in-snapshot=<none>',
      'id-of-another-card=Coop',
      'no-id-written=Coop',
      'encoded=Coop',
      'emptied=<none>'
    ]);
  });

  it('opens the named card by its id, through the app’s own parser, and the list otherwise (decision 3)', () => {
    expect(rows.map(([label, , stored, url, opened]) => [label, stored, url, opened])).toEqual([
      ['fresh', '<unset>', 'cardi://watch', '<list>'],
      ['synced', 'e1', 'cardi://watch-card?id=e1', 'e1'],
      ['resynced', 'l1', 'cardi://watch-card?id=l1', 'l1'],
      // The writer trims the id as it trims the name.
      ['trimmed', 'c1', 'cardi://watch-card?id=c1', 'c1'],
      // Two cards share the name: the id, not the name, picks the one the sync put on top.
      ['same-name', 'c2', 'cardi://watch-card?id=c2', 'c2'],
      // No name on the face, so no card to open.
      ['not-in-snapshot', 'e1', 'cardi://watch', '<list>'],
      // The stored id belongs to a card other than the one named: the tap opens the list.
      ['id-of-another-card', 'e1', 'cardi://watch', '<list>'],
      // An App Group written before the id was published: the name shows, the tap opens the list.
      ['no-id-written', '<unset>', 'cardi://watch', '<list>'],
      // The id is percent-encoded into the URL and decoded back whole by the app.
      ['encoded', 'a b&c=d', 'cardi://watch-card?id=a%20b%26c%3Dd', 'a b&c=d'],
      ['emptied', '<unset>', 'cardi://watch', '<list>']
    ]);
  });
});

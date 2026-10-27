import fs from 'node:fs';
import path from 'node:path';

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
    expect(source).toContain('static let hasCardsKey');
    expect(source).toContain('static let cardsKey');
    expect(source).toContain('static func persistTopCardName');
    expect(source).toContain('static func persistCards');
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

  it('declares a dedicated watch-widget extension as a static open-app complication', () => {
    const config = fs.readFileSync(watchWidgetConfigPath, 'utf8');
    const source = fs.readFileSync(watchWidgetSwiftPath, 'utf8');

    expect(config).toContain("type: 'watch-widget'");
    expect(config).toContain('group.com.iferoporefi.myloyaltycards.watch-complication');
    expect(source).toContain('@main');
    expect(source).toContain('WidgetBundle');
    expect(source).toContain('StaticConfiguration(');
    expect(source).toContain('.supportedFamilies([');
    expect(source).toContain('.accessoryCircular');
    expect(source).toContain('.accessoryRectangular');
    expect(source).toContain('.accessoryInline');
    // It is intentionally a non-configurable, no-card complication now.
    expect(source).not.toContain('AppIntentConfiguration');
    expect(source).not.toContain('selectedCard');
    expect(source).not.toContain('import ClockKit');
  });

  it('opens the app when the complication is tapped', () => {
    const source = fs.readFileSync(watchWidgetSwiftPath, 'utf8');

    expect(source).toContain('.widgetURL(URL(string: "cardi://watch"))');
  });

  it('shows the real watch app icon, downsampled to avoid WidgetKit imageTooLarge', () => {
    const source = fs.readFileSync(watchWidgetSwiftPath, 'utf8');
    const helper = fs.readFileSync(path.join(widgetDir, 'ComplicationImage.swift'), 'utf8');

    expect(source).toContain('ComplicationImage.make("OpenAppIcon")');
    // The empty, name-colliding AppIcon imageset must not be referenced.
    expect(source).not.toContain('Image("AppIcon")');
    // Bitmaps are downsampled (full-size art fails WidgetKit archiving → grey).
    expect(helper).toContain('CGImageSourceCreateThumbnailAtIndex');
    expect(fs.existsSync(path.join(assetsDir, 'OpenAppIcon.imageset', 'Contents.json'))).toBe(true);
    expect(fs.existsSync(path.join(assetsDir, 'AppIcon.imageset'))).toBe(false);
  });

  it('localizes the open-app complication text in English and Italian', () => {
    const source = fs.readFileSync(watchWidgetSwiftPath, 'utf8');
    const en = fs.readFileSync(watchWidgetEnLprojPath, 'utf8');
    const it = fs.readFileSync(watchWidgetItLprojPath, 'utf8');

    for (const key of [
      'watch.widget.complication.inline.open',
      'watch.widget.complication.entry.open_app.title',
      'watch.widget.complication.entry.open_app.subtitle'
    ]) {
      expect(source).toContain(`WatchWidgetL10n.string("${key}")`);
      expect(en).toContain(`"${key}" =`);
      expect(it).toContain(`"${key}" =`);
    }
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

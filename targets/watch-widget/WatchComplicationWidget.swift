import SwiftUI
import WidgetKit

// The Cardì complication: the mark and the top card, in the four accessory families
// `docs/design/cardi/cardi-watch-grammar.md` §10 designs (Story 23.4). Its one job is to get you
// into the wallet in one tap. The families that name a card (corner, rectangular, inline) open the
// app on that card's barcode; circular, which names none, and every family with no card open the
// card list (decision 3).
//
// It is deliberately NOT configurable: a `StaticConfiguration` with no card selection, so there
// is nothing to misconfigure. The card it names is the watch app's top card by `sortedForDisplay`
// (favourites first, then most used), whatever order the list is sorted in. The watch app writes
// it to the App Group after every sync and then reloads this widget.
//
// Still dormant: `BrandLogoCatalog` and `WidgetCardPalette`'s per-card colours. No family draws a
// brand logo or a card colour; the rectangular family's disc carries the Cardì mark.

/// The App Group snapshot the watch app writes (`targets/watch/ComplicationProvider.swift`,
/// `ComplicationSharedState`), read here and never written. The literals are the writer's;
/// `watch-complication-contract.test.ts` holds the two sides together.
enum ComplicationSnapshot {
  static let suiteName = "group.com.iferoporefi.myloyaltycards.watch-complication"
  static let topCardNameKey = "watch.complication.topCardName"
  static let topCardIdKey = "watch.complication.topCardId"
  static let hasCardsKey = "watch.complication.hasCards"
  static let cardsKey = "watch.complication.cards"

  /// The two fields of the writer's `ComplicationCardSnapshot` this side needs.
  private struct CardSnapshot: Decodable {
    let id: String
    let name: String
  }

  /// The card the face names, and its id when a tap may open it.
  struct TopCard {
    let name: String
    let id: String?
  }

  /// The top card, or nil when there is no card or no data. `hasCards` gates it, `topCardName`
  /// names it, and the card must be in the `cards` snapshot written beside it, so a name the
  /// snapshot no longer holds is not shown.
  ///
  /// The id rides along only when the snapshot holds a card with that id AND that name, so a tap
  /// never opens a card other than the one named. Matching on the id keeps two cards with the same
  /// name apart. An App Group written before the id was published names the card and leaves the
  /// id nil, so the tap opens the list until the watch app next writes.
  static func topCard() -> TopCard? {
    guard
      let defaults = UserDefaults(suiteName: suiteName),
      defaults.bool(forKey: hasCardsKey),
      let name = trimmed(defaults.string(forKey: topCardNameKey)),
      let data = defaults.data(forKey: cardsKey),
      let cards = try? JSONDecoder().decode([CardSnapshot].self, from: data),
      cards.contains(where: { trimmed($0.name) == name })
    else {
      return nil
    }

    let id = trimmed(defaults.string(forKey: topCardIdKey))
    let idNamesThisCard = cards.contains(where: { $0.id == id && trimmed($0.name) == name })
    return TopCard(name: name, id: idNamesThisCard ? id : nil)
  }

  /// The value without surrounding whitespace, or nil when nothing is left.
  private static func trimmed(_ value: String?) -> String? {
    guard let value = value?.trimmingCharacters(in: .whitespacesAndNewlines), !value.isEmpty else {
      return nil
    }
    return value
  }
}

/// The grammar's colours (§4.1, §10), at the values the watch app's `WatchColor` holds.
enum ComplicationColor {
  /// Ink: the widget's ground where the system shows one. The disc's ink is the artwork's own field.
  static let ink = Color(hex: "#181824")
  /// Beam: the app-name label (the mark's own beam is in its artwork).
  static let beam = Color(hex: "#FCCC0C")
  /// Cream: the card's name.
  static let cream = Color(hex: "#F0F0E8")
}

struct WatchComplicationEntry: TimelineEntry {
  let date: Date
  /// The top card's name; nil shows the mark and the open-app strings.
  let topCardName: String?
  /// The named card's id, set only when the snapshot pairs it with that name; nil opens the list.
  let topCardId: String?

  /// Where a tap on a family that names the card goes (decision 3): the named card's barcode,
  /// through the watch app's `cardi://watch-card?id=<id>` route (`WatchComplicationDeepLink` in
  /// `CardListView.swift`), when the entry carries its id; otherwise the card list.
  /// `URLComponents` percent-encodes the id.
  var tapURL: URL? {
    guard let topCardId else {
      return Self.cardListURL
    }

    var card = URLComponents()
    card.scheme = "cardi"
    card.host = "watch-card"
    card.queryItems = [URLQueryItem(name: "id", value: topCardId)]
    return card.url ?? Self.cardListURL
  }

  static let cardListURL = URL(string: "cardi://watch")
}

struct WatchComplicationTimelineProvider: TimelineProvider {
  func placeholder(in context: Context) -> WatchComplicationEntry {
    WatchComplicationEntry(date: Date(), topCardName: nil, topCardId: nil)
  }

  func getSnapshot(in context: Context, completion: @escaping (WatchComplicationEntry) -> Void) {
    completion(currentEntry())
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<WatchComplicationEntry>) -> Void) {
    // Read on every request and never schedule one: the watch app reloads this kind after every
    // sync (`ComplicationReloader`), and nothing here changes with the time.
    completion(Timeline(entries: [currentEntry()], policy: .never))
  }

  private func currentEntry() -> WatchComplicationEntry {
    let topCard = ComplicationSnapshot.topCard()
    return WatchComplicationEntry(date: Date(), topCardName: topCard?.name, topCardId: topCard?.id)
  }
}

struct WatchComplicationEntryView: View {
  @Environment(\.widgetFamily) private var family
  let entry: WatchComplicationEntry

  /// The mark, downsampled to the 76 px budget so WidgetKit can archive it. Nil only if the asset
  /// fails to load, and then every family falls back to text rather than to a stand-in glyph.
  let mark: Image? = ComplicationImage.make("OpenAppIcon")

  /// The same mark, transparent and framed tight, for the inline family alone.
  let glyph: Image? = ComplicationImage.make("OpenAppIconGlyph")

  var body: some View {
    content
      .containerBackground(ComplicationColor.ink, for: .widget)
      .widgetURL(namesCard ? entry.tapURL : WatchComplicationEntry.cardListURL)
  }

  /// Corner, rectangular and inline show the card's name, so their tap opens it. Circular draws
  /// only the mark and names no card, so its tap opens the card list.
  private var namesCard: Bool {
    switch family {
    case .accessoryInline, .accessoryRectangular, .accessoryCorner:
      return true
    default:
      return false
    }
  }

  @ViewBuilder
  private var content: some View {
    switch family {
    case .accessoryInline:
      inline
    case .accessoryRectangular:
      rectangular
    case .accessoryCorner:
      corner
    default:
      // accessoryCircular: the mark alone. At this size a word is a smudge.
      disc
    }
  }

  // MARK: - The families

  /// The mark as the image, the card's name as the text; "Open Cardì" with no card. The image is
  /// the transparent glyph: inline draws its image as a template from the alpha channel, on every
  /// face, so the opaque artwork would read as a solid square there.
  @ViewBuilder
  private var inline: some View {
    let text = entry.topCardName ?? WatchWidgetL10n.string("watch.widget.complication.inline.open")
    if let glyph {
      HStack(spacing: 4) {
        glyph
          .resizable()
          .scaledToFit()
        Text(verbatim: text)
      }
    } else {
      Text(verbatim: text)
    }
  }

  /// The mark in a 30 pt disc beside two lines: the app name in beam over the card's name in
  /// cream. No third line — no store and no card number reach the face (decision 2).
  /// With no card, the disc beside today's open-app title on one line: the app name labels a
  /// card's name, and there is none to label.
  private var rectangular: some View {
    HStack(spacing: 8) {
      if mark != nil {
        disc
          .frame(width: 30, height: 30)
      }
      if let name = entry.topCardName {
        VStack(alignment: .leading, spacing: 1) {
          Text(verbatim: WatchWidgetL10n.string("watch.widget.complication.app_name"))
            .font(.system(size: 10, weight: .semibold))
            .tracking(0.6)
            .textCase(.uppercase)
            .foregroundStyle(ComplicationColor.beam)
            .widgetAccentable()
            .lineLimit(1)
          Text(verbatim: name)
            .font(.system(size: 15, weight: .semibold))
            .foregroundStyle(ComplicationColor.cream)
            .lineLimit(1)
        }
      } else {
        Text(verbatim: WatchWidgetL10n.string("watch.widget.complication.entry.open_app.title"))
          .font(.system(size: 15, weight: .semibold))
          .foregroundStyle(ComplicationColor.cream)
          .lineLimit(1)
      }
      Spacer(minLength: 0)
    }
  }

  /// The mark in the disc and the card's name on the arc, in cream; the system truncates it.
  /// With no card there is no arc, only the mark.
  @ViewBuilder
  private var corner: some View {
    if let name = entry.topCardName {
      disc
        .widgetLabel {
          Text(verbatim: name)
            .foregroundStyle(ComplicationColor.cream)
        }
    } else {
      disc
    }
  }

  // MARK: - The mark

  /// The mark on its round ink disc, in the inscribed square: the artwork's own ink field is the
  /// disc, so no fill sits under it for a tinted face to flatten into a solid blot.
  @ViewBuilder
  private var disc: some View {
    if let mark {
      markArtwork(mark)
        .clipShape(Circle())
    } else {
      Text(verbatim: WatchWidgetL10n.string("watch.widget.complication.app_name"))
        .font(.system(size: 12, weight: .semibold))
        .foregroundStyle(ComplicationColor.cream)
        .minimumScaleFactor(0.5)
        .lineLimit(1)
    }
  }

  /// On a tinted face the mark is drawn by its LUMINANCE, so it reads as shape. In circular and
  /// rectangular the stem and the card carry the face's tint, and the ink field falls away, and
  /// with it the card's bars, which are cut through to that field. In the corner the system draws
  /// the mark white on a grey disc instead. Both were seen for the watchOS 11+ branch on the
  /// watchOS 26.5 simulator, with the mark before Story 20.6's. The watchOS 10 branch
  /// (`.widgetAccentable()`) is unverified: no watchOS 10 runtime was available.
  @ViewBuilder
  private func markArtwork(_ image: Image) -> some View {
    if #available(watchOS 11.0, *) {
      image
        .resizable()
        .widgetAccentedRenderingMode(.accentedDesaturated)
        .scaledToFit()
    } else {
      image
        .resizable()
        .scaledToFit()
        .widgetAccentable()
    }
  }
}

struct MyLoyaltyCardsWatchComplicationWidget: Widget {
  let kind: String = "MyLoyaltyCardsWatchComplication"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: WatchComplicationTimelineProvider()) { entry in
      WatchComplicationEntryView(entry: entry)
    }
    .configurationDisplayName("Cardì")
    .description(Text(verbatim: WatchWidgetL10n.string("watch.widget.complication.entry.open_app.subtitle")))
    .supportedFamilies([
      .accessoryCircular,
      .accessoryRectangular,
      .accessoryInline,
      .accessoryCorner,
    ])
  }
}

@main
struct MyLoyaltyCardsWatchComplicationBundle: WidgetBundle {
  var body: some Widget {
    MyLoyaltyCardsWatchComplicationWidget()
  }
}

import Foundation
import SwiftData
import SwiftUI

// Simple watch-side card model (read-only snapshot for display)
struct WatchCard: Identifiable, Codable {
  let id: String
  let name: String
  let brandId: String?
  let colorHex: String?  // palette KEY ("blue", "red", …) or a "#RRGGBB" hex — resolve via `resolvedCardHex`
  // Optional barcode fields (may be absent for older persisted payloads)
  let barcodeValue: String?
  let barcodeFormat: String?  // values like "CODE128", "EAN13", "QR" etc.
  let barcodeImageBase64: String?
  // Sorting fields are decoded when present and defaulted when absent so
  // older persisted payloads remain compatible.
  var usageCount: Int = 0
  var lastUsedAt: Date? = nil
  var createdAt: Date = Date()
  var isFavorite: Bool = false

  init(
    id: String,
    name: String,
    brandId: String? = nil,
    colorHex: String? = nil,
    barcodeValue: String? = nil,
    barcodeFormat: String? = nil,
    barcodeImageBase64: String? = nil,
    usageCount: Int = 0,
    lastUsedAt: Date? = nil,
    createdAt: Date = Date(),
    isFavorite: Bool = false
  ) {
    self.id = id
    self.name = name
    self.brandId = brandId
    self.colorHex = colorHex
    self.barcodeValue = barcodeValue
    self.barcodeFormat = barcodeFormat
    self.barcodeImageBase64 = barcodeImageBase64
    self.usageCount = usageCount
    self.lastUsedAt = lastUsedAt
    self.createdAt = createdAt
    self.isFavorite = isFavorite
  }

  enum CodingKeys: String, CodingKey {
    case id, name, brandId, colorHex, barcodeValue, barcodeFormat, barcodeImageBase64, usageCount, lastUsedAt,
      createdAt, isFavorite
  }

  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    id = try container.decode(String.self, forKey: .id)
    name = try container.decode(String.self, forKey: .name)
    brandId = try container.decodeIfPresent(String.self, forKey: .brandId)
    colorHex = try container.decodeIfPresent(String.self, forKey: .colorHex)
    barcodeValue = try container.decodeIfPresent(String.self, forKey: .barcodeValue)
    barcodeFormat = try container.decodeIfPresent(String.self, forKey: .barcodeFormat)
    barcodeImageBase64 = try container.decodeIfPresent(String.self, forKey: .barcodeImageBase64)
    usageCount = try container.decodeIfPresent(Int.self, forKey: .usageCount) ?? 0
    lastUsedAt = try Self.decodeDateIfPresent(from: container, forKey: .lastUsedAt)
    createdAt = try Self.decodeDateIfPresent(from: container, forKey: .createdAt) ?? Date()
    isFavorite = try container.decodeIfPresent(Bool.self, forKey: .isFavorite) ?? false
  }

  func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(id, forKey: .id)
    try container.encode(name, forKey: .name)
    try container.encodeIfPresent(brandId, forKey: .brandId)
    try container.encodeIfPresent(colorHex, forKey: .colorHex)
    try container.encodeIfPresent(barcodeValue, forKey: .barcodeValue)
    try container.encodeIfPresent(barcodeFormat, forKey: .barcodeFormat)
    try container.encodeIfPresent(barcodeImageBase64, forKey: .barcodeImageBase64)
    try container.encode(usageCount, forKey: .usageCount)
    if let lastUsedAt {
      try container.encode(Self.encodeDate(lastUsedAt), forKey: .lastUsedAt)
    }
    try container.encode(Self.encodeDate(createdAt), forKey: .createdAt)
    try container.encode(isFavorite, forKey: .isFavorite)
  }

  private static func decodeDateIfPresent(
    from container: KeyedDecodingContainer<CodingKeys>,
    forKey key: CodingKeys
  ) throws -> Date? {
    if let value = try container.decodeIfPresent(String.self, forKey: key) {
      return decodeDate(value)
    }

    if let value = try container.decodeIfPresent(Double.self, forKey: key) {
      return Date(timeIntervalSinceReferenceDate: value)
    }

    return nil
  }

  private static func decodeDate(_ value: String) -> Date? {
    if let date = fractionalSecondsFormatter.date(from: value) {
      return date
    }

    return internetDateTimeFormatter.date(from: value)
  }

  private static func encodeDate(_ value: Date) -> String {
    fractionalSecondsFormatter.string(from: value)
  }

  private static let fractionalSecondsFormatter: ISO8601DateFormatter = {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return formatter
  }()

  private static let internetDateTimeFormatter: ISO8601DateFormatter = {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime]
    return formatter
  }()
}

/// User-selectable ordering for the Watch card list. Cases mirror the phone's
/// `useCardSort` (`features/cards/hooks/useCardSort.ts`) so the two surfaces share
/// one vocabulary. The watch persists its own choice — default `.az` — independently
/// of the phone (decision 2026-06-09). Declaration order is the picker row order.
enum WatchSortMode: String, CaseIterable, Identifiable {
  case frequent
  case recent
  case az

  var id: String { rawValue }

  /// UserDefaults key backing the watch-local `@AppStorage` preference. Watch-only:
  /// never written to card data, so the read-only watch rule (ADR-2026-06-09-001) holds.
  static let storageKey = "watch.sortMode"

  /// Default on a fresh install with no saved preference (AC3).
  static let defaultMode: WatchSortMode = .az

  /// Localized label key for this mode (resolved via `WatchL10n`).
  var localizationKey: String {
    switch self {
    case .frequent: return "watch.sort.frequent"
    case .recent: return "watch.sort.recent"
    case .az: return "watch.sort.az"
    }
  }
}

extension WatchCard {
  /// Shared ordering for every Watch surface that ranks cards (the card list and
  /// the complication "top card"): favourites first → usageCount desc →
  /// lastUsedAt desc → createdAt desc. Single source of truth so the surfaces
  /// can never drift apart. This is the `.frequent` mode.
  static func sortedForDisplay(_ cards: [WatchCard]) -> [WatchCard] {
    cards.sorted { a, b in
      if a.isFavorite != b.isFavorite { return a.isFavorite }
      if a.usageCount != b.usageCount { return a.usageCount > b.usageCount }
      // lastUsedAt desc — and a card that has been used outranks one that never has,
      // even at equal usageCount (mirrors useCardSort.ts: `if (a.lastUsedAt) return -1;
      // if (b.lastUsedAt) return 1;`). The earlier both-present-only check skipped this.
      switch (a.lastUsedAt, b.lastUsedAt) {
      case let (aLast?, bLast?) where aLast != bLast:
        return aLast > bLast
      case (.some, .none):
        return true
      case (.none, .some):
        return false
      default:
        break
      }
      return a.createdAt > b.createdAt
    }
  }

  /// Orders `cards` for the user-selected `mode`, mirroring the phone's `useCardSort`
  /// semantics exactly so the two surfaces never drift:
  /// - `.frequent`: favourites first → usageCount desc → lastUsedAt desc → createdAt desc
  /// - `.recent`:   createdAt desc (favourites are **not** pinned)
  /// - `.az`:       favourites first → name (locale-aware, case- & diacritic-insensitive)
  ///
  /// Swift's `sorted(by:)` is stable (Swift 5+), matching the phone's stable `Array.sort`.
  static func sorted(_ cards: [WatchCard], by mode: WatchSortMode) -> [WatchCard] {
    switch mode {
    case .frequent:
      return sortedForDisplay(cards)
    case .recent:
      return cards.sorted { $0.createdAt > $1.createdAt }
    case .az:
      return cards.sorted { a, b in
        if a.isFavorite != b.isFavorite { return a.isFavorite }
        // Locale-aware, case- AND diacritic-insensitive to mirror the phone's
        // localeCompare(…, { sensitivity: 'base' }) exactly (Italian-first audience).
        return a.name.compare(
          b.name,
          options: [.caseInsensitive, .diacriticInsensitive],
          range: nil,
          locale: .current
        ) == .orderedAscending
      }
    }
  }
}

final class CardStore: ObservableObject {
  @Published var cards: [WatchCard] = []

  init() {
    loadPersistedCards()
  }

  // Minimal loader: reads from UserDefaults (sync target) or keeps empty
  private func loadPersistedCards() {
    // Test hook: allow UI tests to inject cards via environment variable
    if let env = ProcessInfo.processInfo.environment["UITEST_CARDS"],
      let envData = env.data(using: .utf8),
      let decodedFromEnv = try? JSONDecoder().decode([WatchCard].self, from: envData)
    {
      self.cards = decodedFromEnv
      return
    }

    if let data = UserDefaults.standard.data(forKey: "watch.cards") {
      if let decoded = try? JSONDecoder().decode([WatchCard].self, from: data) {
        self.cards = decoded
        return
      }
    }

    // default: empty (empty-state should be visible)
    self.cards = []
  }

  // Migration helper — extracts migration logic so it can be unit-tested.
  func migrateUserDefaults(to modelContext: ModelContext) {
    guard let data = UserDefaults.standard.data(forKey: "watch.cards"),
      let decoded = try? JSONDecoder().decode([WatchCard].self, from: data)
    else {
      return
    }

    for c in decoded {
      let raw = try? JSONEncoder().encode(c)
      let entity = WatchCardEntity(
        id: c.id,
        name: c.name,
        barcode: c.barcodeValue ?? "",
        barcodeFormat: c.barcodeFormat ?? "CODE128",
        brandId: c.brandId,
        color: c.colorHex ?? "grey",
        isFavorite: c.isFavorite,
        lastUsedAt: c.lastUsedAt,
        usageCount: c.usageCount,
        createdAt: c.createdAt,
        updatedAt: Date(),
        rawPayload: raw
      )
      modelContext.insert(entity)
    }

    try? modelContext.save()
    UserDefaults.standard.removeObject(forKey: "watch.cards")
    ComplicationSharedState.persistCards(decoded)

    let topCardName = WatchCard.sortedForDisplay(decoded).first?.name

    ComplicationSharedState.persistTopCardName(topCardName)

    ComplicationReloader.reloadAllActiveComplications()
  }
}

// MARK: - Helpers moved to ColorHelpers.swift
// initials(from:), mapColor(hex:), parseHexColor(_:), contrast helpers
// are now in ColorHelpers.swift for reusability and testability.

/// Localization key for a card row's accessibility label. Favourites get a
/// distinct key so VoiceOver announces the pinned state. Extracted so the
/// favourite-vs-not branch is unit-testable without rendering the SwiftUI view.
func cardRowAccessibilityKey(isFavorite: Bool) -> String {
  isFavorite
    ? "watch.card_row.favorite_accessibility_format"
    : "watch.card_row.accessibility_format"
}

struct CardRowView: View {
  let card: WatchCard

  private let metrics = WatchCardRowLayoutMetrics.compact

  private func normalizedBrandId(_ brandId: String?) -> String? {
    guard let brandId = brandId?
      .trimmingCharacters(in: .whitespacesAndNewlines),
      !brandId.isEmpty
    else {
      return nil
    }

    return brandId.lowercased()
  }

  private var resolvedBrand: WatchBrand? {
    guard let brandId = normalizedBrandId(card.brandId) else {
      return nil
    }

    return WatchBrands.all.first(where: { $0.id == brandId })
  }

  /// The RAW color value the phone sent for this card. Despite `colorHex`'s name this is a palette
  /// KEY ("blue", "red", …) for every synced card, catalogue and custom alike —
  /// `core/watch-connectivity.ts` sets `colorHex: card.color` from a required enum. A catalogue
  /// card with no value at all falls back to a deterministic hex from its brand id.
  ///
  /// ⚠️ Never feed this to a luminance helper; go through `resolvedAccentHex`.
  private var rawColorValue: String {
    if let brand = resolvedBrand {
      return card.colorHex ?? "#\(String(format: "%06X", abs(brand.id.hashValue) % 0xFFFFFF))"
    }
    return card.colorHex ?? ""
  }

  /// The one `"#RRGGBB"` this row actually paints, or `nil` when the value is unusable.
  ///
  /// Every color decision below derives from this single resolution — fill, hairline and initials
  /// — mirroring Wear's `CardPresentation`, which resolves once and hands `CardRow` the answers.
  /// Deriving any of them from `rawColorValue` instead feeds a palette key to a hex-only luminance
  /// function, which reports "black" for all five keys (Story 16.41).
  private var resolvedAccentHex: String? {
    resolvedCardHex(rawColorValue)
  }

  /// Accent color, derived from the SAME resolution as the hairline and the initials rather than
  /// from a second `mapColor(hex: rawColorValue)` call. The two agree today — `mapColor` resolves
  /// through `resolvedCardHex` too — but two independent call sites of one resolver is the shape
  /// that produced this story's defect, and Wear's `presentationFor` resolves once for the same
  /// reason.
  ///
  /// An unresolvable color takes the palette's default, azure, never a system color (Story 23.2).
  private var accentColor: Color {
    resolvedAccentHex.map(parseHexColor) ?? defaultCardAccent
  }

  /// A near-black accent all but vanishes against the row's near-black surface, so the row takes a
  /// hairline instead. An unresolvable color gets NO hairline: the border remediates a color we
  /// know is dark, and defaulting the other way is the bug this property replaced.
  private var needsNearBlackHairline: Bool {
    resolvedAccentHex.map(isNearBlack(hex:)) ?? false
  }

  /// Whether the initials are drawn cream rather than ink, flipped on the SAME hex the circle is
  /// filled with: ink above luminance 0.4, cream otherwise (the watch frames' rule, Story 23.2).
  /// Defaults to cream for an unresolvable color: azure, its fallback, falls on the light side of
  /// the 0.4 rule, as the frames draw it on an azure accent, and the default matches the
  /// complication's `WidgetCardPalette.prefersWhiteForeground`.
  private var prefersCreamInitials: Bool {
    resolvedAccentHex.map(shouldUseWhiteText(onBackgroundHex:)) ?? true
  }

  var body: some View {
    HStack(spacing: metrics.rowSpacing) {
      RoundedRectangle(cornerRadius: 3)
        .fill(accentColor)
        .frame(width: metrics.accentWidth, height: metrics.accentHeight)

      logoView
        .frame(width: metrics.avatarSize, height: metrics.avatarSize)
        .clipShape(Circle())

      Text(card.name)
        .font(.system(size: 15, weight: .semibold))
        .foregroundColor(WatchColor.cream)
        .lineLimit(1)
        .minimumScaleFactor(0.85)
        .truncationMode(.tail)
        .layoutPriority(1)

      Spacer()

      // Beam, trailing and centred, with no plate behind it: the star sits on an ink row, never
      // on a brand fill, so the plate the phone needs has nothing to defeat (grammar §4.4).
      if card.isFavorite {
        Image(systemName: "star.fill")
          .font(.system(size: 13))
          .foregroundColor(WatchColor.beam)
          .accessibilityHidden(true)
      }
    }
    .padding(.horizontal, metrics.horizontalPadding)
    .padding(.vertical, metrics.verticalPadding)
    .frame(minHeight: metrics.minimumTapHeight)
    .background(
      RoundedRectangle(cornerRadius: metrics.cornerRadius)
        .fill(WatchColor.ink)
    )
    .overlay(
      RoundedRectangle(cornerRadius: metrics.cornerRadius)
        .stroke(needsNearBlackHairline ? WatchColor.hairline : Color.clear, lineWidth: 1)
    )
    .accessibilityElement(children: .combine)
    .accessibilityLabel(WatchL10n.format(cardRowAccessibilityKey(isFavorite: card.isFavorite), card.name))
  }

  @ViewBuilder
  private var logoView: some View {
    if let brand = resolvedBrand {
      if let assetName = BrandLogoCatalog.assetName(for: brand.id) {
        // Catalogue brand with bundled artwork — the real logo
        brandLogo(
          assetName: assetName,
          prefersDarkBacking: BrandLogoCatalog.prefersDarkBacking(for: brand.id)
        )
      } else {
        // Catalogue brand with no bundled imageset — initials on brand-colored circle
        initialsAvatar(text: initials(from: brand.name ?? brand.id))
      }
    } else {
      // Custom card — user-selected color with initials
      initialsAvatar(text: initials(from: card.name))
    }
  }

  /// Real brand artwork on a chip. Whether a logo needs a dark chip is the
  /// generator's luminance decision (`BrandLogoCatalogData.lightLogoBrandIds`),
  /// shared with the complication rather than re-derived here. The dark chip gets
  /// the same hairline the row uses for near-black accents, so the disc stays
  /// distinguishable from the row background.
  @ViewBuilder
  private func brandLogo(assetName: String, prefersDarkBacking: Bool) -> some View {
    ZStack {
      prefersDarkBacking ? Color.black : Color.white

      // Decorative on purpose: the row is a single combined accessibility element
      // labelled with the card name, so the logo must not add a second element.
      Image(decorative: assetName)
        .resizable()
        .scaledToFit()
        .padding(metrics.avatarLogoInset)
    }
    .overlay(
      Circle()
        .strokeBorder(prefersDarkBacking ? WatchColor.hairline : Color.clear, lineWidth: 1)
    )
  }

  /// Initials on the resolved accent color — the fallback for custom cards and for
  /// catalogue brands with no bundled artwork.
  ///
  /// The text color is derived from `resolvedAccentHex`, the same value that fills the circle,
  /// rather than from a passed-in raw string. Both call sites used to pass a palette key, which
  /// scored luminance 0 and announced white initials on every accent — including the amber one,
  /// where white lands at 2.15:1 and black at 9.78:1 (Story 16.41). Cream and ink replaced white
  /// and black in Story 23.2.
  @ViewBuilder
  private func initialsAvatar(text: String) -> some View {
    ZStack {
      accentColor
      Text(text)
        .font(.system(size: 12, weight: .bold))
        .foregroundColor(prefersCreamInitials ? WatchColor.cream : WatchColor.ink)
    }
  }
}

private struct WatchCardRoute: Hashable {
  let cardId: String
}

private enum WatchComplicationDeepLink {
  static let scheme = "cardi"
  static let cardHost = "watch-card"
  static let cardIdQueryItem = "id"

  static func cardId(from url: URL) -> String? {
    guard
      url.scheme?.lowercased() == scheme,
      url.host?.lowercased() == cardHost,
      let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
      let cardId = components.queryItems?.first(where: { $0.name == cardIdQueryItem })?.value?
        .trimmingCharacters(in: .whitespacesAndNewlines),
      !cardId.isEmpty
    else {
      return nil
    }

    return cardId
  }
}

struct CardListView: View {
  @Environment(\.modelContext) private var modelContext
  @Query private var persistedEntities: [WatchCardEntity]
  @StateObject private var store: CardStore
  @State private var navigationPath: [WatchCardRoute] = []
  @State private var pendingDeepLinkCardId: String?
  /// Bumped by every complication deep link, and the barcode pager's identity: each link opens a
  /// fresh barcode, as an open, whatever the pager was showing.
  @State private var deepLinkGeneration = 0
  // Watch-local, persisted sort preference (default A-Z), independent of the phone (AC3, AC4).
  @AppStorage(WatchSortMode.storageKey) private var sortMode: WatchSortMode = WatchSortMode.defaultMode
  @State private var showSortSheet = false
  // The list names itself the crown's owner here rather than leaving the crown to whichever
  // container holds focus (watch grammar §8: "explicitly, not inherited"); the contract suite pins
  // it. Focus only: no handler reads the crown, so it can never do anything but scroll.
  @FocusState private var listHasCrown: Bool

  init(store: CardStore = CardStore()) {
    _store = StateObject(wrappedValue: store)
  }

  /// Cards ordered by the user-selected `sortMode` (default A-Z). Ordering semantics
  /// mirror the phone's `useCardSort`; see `WatchCard.sorted(_:by:)`.
  private var displayCards: [WatchCard] {
    let entities: [WatchCard]
    if !persistedEntities.isEmpty {
      entities = persistedEntities.map { e in
        if let rawPayload = e.rawPayload,
          let decoded = try? JSONDecoder().decode(WatchCard.self, from: rawPayload)
        {
          return decoded
        }

        return WatchCard(
          id: e.id,
          name: e.name,
          brandId: e.brandId,
          colorHex: e.color,
          barcodeValue: e.barcode,
          barcodeFormat: e.barcodeFormat,
          usageCount: e.usageCount,
          lastUsedAt: e.lastUsedAt,
          createdAt: e.createdAt,
          isFavorite: e.isFavorite
        )
      }
    } else {
      entities = store.cards
    }
    return WatchCard.sorted(entities, by: sortMode)
  }

  var body: some View {
    NavigationStack(path: $navigationPath) {
      Group {
        if displayCards.isEmpty {
          emptyState
        } else {
          ScrollView {
            // Gap 4: the rows separate themselves by their ink fill on black, and every point of
            // gap costs a fraction of a row over a scroll (grammar §5.3).
            LazyVStack(spacing: 4) {
              ForEach(displayCards) { card in
                NavigationLink(value: WatchCardRoute(cardId: card.id)) {
                  CardRowView(card: card)
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("card-row-\(card.id)")
              }
            }
            .padding(.horizontal, 2)
            .padding(.vertical, 2)
            .animation(.default, value: sortMode)
          }
          .focused($listHasCrown)
          .defaultFocus($listHasCrown, true)
        }
      }
      .navigationTitle(WatchL10n.string("watch.cards.title"))
      .navigationDestination(for: WatchCardRoute.self) { route in
        // The barcode, and the crown paging through the cards from it (Story 23.2, decisions 2–5).
        // The pager takes the live cards on every update and holds their order at opening itself.
        // `.id` gives it a fresh identity on every deep link: a link to the card this route opened
        // sets the SAME route value, which SwiftUI would keep as it is — paged on and all.
        BarcodePagerView(openedCardId: route.cardId, liveCards: displayCards)
          .id(deepLinkGeneration)
      }
      .toolbar {
        if !displayCards.isEmpty {
          ToolbarItem(placement: .topBarTrailing) {
            Button {
              showSortSheet = true
            } label: {
              Image(systemName: "arrow.up.arrow.down")
            }
            .accessibilityLabel(WatchL10n.string("watch.sort.title"))
            .accessibilityIdentifier("sort-button")
          }
        }
        #if DEBUG
          // DEBUG-only seeder; shown only on the empty state (its actual purpose) so it never
          // crowds the sort control once cards are present. Compiled out of Release entirely.
          if displayCards.isEmpty {
            ToolbarItem(placement: .topBarLeading) {
              Button(action: importSampleCards) {
                Text(WatchL10n.string("watch.debug.import_sample_cards"))
              }
              .accessibilityIdentifier("import-sample-cards")
            }
          }
        #endif
      }
      .sheet(isPresented: $showSortSheet) {
        WatchSortPickerView(selection: $sortMode)
      }
    }
    .background(WatchColor.ground)
    .scrollContentBackground(.hidden)
    .onAppear {
      // If SwiftData contains records we prefer them. Otherwise migrate from older UserDefaults payload.
      if persistedEntities.isEmpty {
        store.migrateUserDefaults(to: modelContext)
      }

      // existing behavior: store still used as fallback for UI tests or older builds
    }
    .onOpenURL { url in
      guard let cardId = WatchComplicationDeepLink.cardId(from: url) else {
        return
      }

      openCardRouteIfAvailable(cardId)
    }
    .onChange(of: displayCards.map(\.id)) { _, _ in
      guard let pendingDeepLinkCardId else {
        return
      }

      openCardRouteIfAvailable(pendingDeepLinkCardId)
    }
  }

  private func openCardRouteIfAvailable(_ cardId: String) {
    guard displayCards.contains(where: { $0.id == cardId }) else {
      pendingDeepLinkCardId = cardId
      return
    }

    pendingDeepLinkCardId = nil
    deepLinkGeneration += 1
    navigationPath = [WatchCardRoute(cardId: cardId)]
  }

  private var emptyState: some View {
    VStack(spacing: 16) {
      // Icon — creditcard SF Symbol, prominent per watchOS HIG empty state guidance. Cream like
      // all watch body text: 50 % for the glyph, full for the title, 60 % for the subtitle
      // (grammar §3.2).
      Image(systemName: "creditcard")
        .font(.system(size: 48, weight: .light))
        .foregroundColor(WatchColor.cream.opacity(0.5))
        .accessibilityHidden(true)

      VStack(spacing: 8) {
        Text(WatchL10n.string("watch.cards.empty.title"))
          .font(.headline)
          .foregroundColor(WatchColor.cream)
          .accessibilityIdentifier("empty-state-title")

        Text(WatchL10n.string("watch.cards.empty.subtitle"))
          .font(.footnote)
          .foregroundColor(WatchColor.creamSecondary)
          .multilineTextAlignment(.center)
          .accessibilityIdentifier("empty-state-subtitle")
      }
    }
    .padding(.horizontal, 12)
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .accessibilityElement(children: .combine)
    .accessibilityLabel(WatchL10n.string("watch.cards.empty.accessibility"))
  }

  #if DEBUG
    private func importSampleCards() {
      let sample: [WatchCard] = [
        WatchCard(
          id: "1", name: "Esselunga", brandId: "brand-special", colorHex: "#1e90ff",
          barcodeValue: "5901234123457", barcodeFormat: "EAN13", isFavorite: true),
        WatchCard(
          id: "2", name: "Local Bakery", brandId: nil, colorHex: "#ff6b6b",
          barcodeValue: "012345678905", barcodeFormat: "UPCA"),
        WatchCard(
          id: "3", name: "Healthy Market", brandId: nil, colorHex: "green",
          barcodeValue: "https://example.com", barcodeFormat: "QR"),
      ]

      if let data = try? JSONEncoder().encode(sample) {
        UserDefaults.standard.set(data, forKey: "watch.cards")
      }

      // Immediately refresh visible store
      store.cards = sample
      WKInterfaceDevice.current().play(.success)
    }
  #endif
}

/// Compact watch sort picker presented as a sheet from the card list toolbar (Story 9.5,
/// UX spec §5). A native `List` of the three `WatchSortMode` rows, ink on black; the active row is
/// double-encoded — semibold beam label + trailing beam checkmark + a VoiceOver "selected" trait,
/// never colour alone, and the platform's own checkmark rather than a drawn dot (watch grammar
/// §8.1). Tapping a row sets the mode and dismisses immediately so the list re-orders (AC1, AC2,
/// AC5).
struct WatchSortPickerView: View {
  @Binding var selection: WatchSortMode
  @Environment(\.dismiss) private var dismiss
  // The crown scrolls the options, explicitly, as it does the card list (grammar §8).
  @FocusState private var optionsHaveCrown: Bool

  var body: some View {
    NavigationStack {
      List {
        ForEach(WatchSortMode.allCases) { mode in
          let isSelected = selection == mode
          Button {
            selection = mode
            dismiss()
          } label: {
            HStack(spacing: 8) {
              Text(WatchL10n.string(mode.localizationKey))
                .font(.body)
                .fontWeight(isSelected ? .semibold : .regular)
                .foregroundStyle(isSelected ? WatchColor.beam : WatchColor.cream)
                .lineLimit(1)
              Spacer()
              if isSelected {
                Image(systemName: "checkmark")
                  .foregroundStyle(WatchColor.beam)
                  .accessibilityHidden(true)
              }
            }
            .frame(minHeight: WatchCardRowLayoutMetrics.compact.minimumTapHeight)
            .contentShape(Rectangle())
          }
          .listRowBackground(
            RoundedRectangle(cornerRadius: WatchCardRowLayoutMetrics.compact.cornerRadius)
              .fill(WatchColor.ink)
          )
          .accessibilityAddTraits(isSelected ? .isSelected : [])
        }
      }
      .listStyle(.plain)
      .scrollContentBackground(.hidden)
      .focused($optionsHaveCrown)
      .defaultFocus($optionsHaveCrown, true)
      .background(WatchColor.ground)
      .navigationTitle(WatchL10n.string("watch.sort.title"))
    }
  }
}

struct CardListView_Previews: PreviewProvider {
  static var previews: some View {
    Group {
      CardListView()
        .previewDisplayName("Empty")

      CardListViewPreviewData()
        .previewDisplayName("With cards")
    }
    .preferredColorScheme(.dark)
  }

  struct CardListViewPreviewData: View {
    var body: some View {
      CardListViewMock(cards: [
        WatchCard(
          id: "1", name: "Esselunga", brandId: "brand-special", colorHex: "#1e90ff",
          barcodeValue: "5901234123457", barcodeFormat: "EAN13", isFavorite: true),
        WatchCard(
          id: "2", name: "Local Bakery", brandId: nil, colorHex: "#ff6b6b",
          barcodeValue: "012345678905", barcodeFormat: "UPCA"),
        WatchCard(
          id: "3", name: "Healthy Market", brandId: nil, colorHex: "green",
          barcodeValue: "https://example.com", barcodeFormat: "QR"),
      ])
    }
  }

  struct CardListViewMock: View {
    let cards: [WatchCard]
    var body: some View {
      let s = CardStore()
      s.cards = cards
      return CardListView(store: s)
    }
  }
}

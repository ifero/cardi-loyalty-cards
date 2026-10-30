import Foundation
import OSLog
import SwiftData
import WatchConnectivity

private let log = Logger(subsystem: "com.iferoporefi.myloyaltycards.watch", category: "WCSession")

/// Receives card snapshots from the paired iPhone via WatchConnectivity and
/// persists them into SwiftData so `CardListView`'s `@Query` picks them up.
///
/// Phone publishes the full card list via `updateApplicationContext` (snapshot,
/// last-write-wins). On activation we also send a `requestCards` ping so the
/// phone can immediately reply if it's reachable.
final class WatchSessionManager: NSObject, WCSessionDelegate {
  static let shared = WatchSessionManager()

  private var container: ModelContainer?

  /// CARD_USED events recorded before `WCSession` activation completes.
  /// `transferUserInfo` drops payloads on a non-activated session, so opens
  /// that race a cold launch are held here and flushed from
  /// `session(_:activationDidCompleteWith:error:)`. Guarded by
  /// `pendingUsageEventsLock`: SwiftUI records on the main thread while the
  /// activation callback arrives on a background queue.
  private var pendingUsageEvents: [[String: Any]] = []
  private let pendingUsageEventsLock = NSLock()

  /// `usedAt` MUST carry millisecond precision (ADR-2026-06-09-001): the phone
  /// dedups by `"<cardId>:<usedAt>"`, so sub-second resolution is what keeps
  /// two distinct opens of the same card from collapsing into one event id.
  private static let usageEventTimestampFormatter: ISO8601DateFormatter = {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    formatter.timeZone = TimeZone(identifier: "UTC")
    return formatter
  }()

  /// Wire up the persistence container and kick off `WCSession` activation.
  /// Cached `applicationContext` is intentionally NOT read here — the iOS API
  /// only populates `WCSession.default.receivedApplicationContext` after the
  /// activation handshake completes, so we apply it from
  /// `session(_:activationDidCompleteWith:error:)` instead.
  func bind(container: ModelContainer) {
    self.container = container
    activateIfNeeded()
  }

  private func activateIfNeeded() {
    guard WCSession.isSupported() else {
      log.notice("WCSession not supported on this device")
      return
    }
    let session = WCSession.default
    if session.delegate == nil {
      session.delegate = self
    }
    if session.activationState != .activated {
      log.info("activating WCSession (state was \(session.activationState.rawValue))")
      session.activate()
    }
  }

  private func applyCachedContextIfAvailable() {
    guard WCSession.isSupported() else { return }
    let cached = WCSession.default.receivedApplicationContext
    if !cached.isEmpty {
      log.info("applying cached applicationContext (keys=\(cached.keys.sorted().joined(separator: ",")))")
      handleIncoming(payload: cached)
    }
  }

  // MARK: - Usage events (Story 9.6, ADR-2026-06-09-001)

  /// Record that a card's barcode was opened on the watch. The event travels
  /// watch → phone via `transferUserInfo` — the OS queues it FIFO while the
  /// phone is unreachable and keeps it across relaunches, which is the
  /// offline-queue behaviour AC3 requires. Usage is telemetry, not a
  /// card-data edit: the phone applies it commutatively
  /// (`usageCount += 1`, `lastUsedAt = max`), so the watch stays read-only
  /// for card data.
  func recordCardUsed(cardId: String, at date: Date = Date()) {
    let usedAt = Self.usageEventTimestampFormatter.string(from: date)
    let event = makeCardUsedEvent(cardId: cardId, usedAt: usedAt)

    guard WCSession.isSupported() else { return }
    let session = WCSession.default

    pendingUsageEventsLock.lock()
    pendingUsageEvents.append(event)
    pendingUsageEventsLock.unlock()

    if session.activationState == .activated {
      flushPendingUsageEvents(session)
    } else {
      log.info("buffering CARD_USED until WCSession activation completes")
      activateIfNeeded()
    }
  }

  private func makeCardUsedEvent(cardId: String, usedAt: String) -> [String: Any] {
    [
      "version": 1,
      "type": "CARD_USED",
      "payload": ["id": cardId, "usedAt": usedAt]
    ]
  }

  private func flushPendingUsageEvents(_ session: WCSession) {
    guard session.activationState == .activated else { return }

    pendingUsageEventsLock.lock()
    let events = pendingUsageEvents
    pendingUsageEvents.removeAll()
    pendingUsageEventsLock.unlock()

    for event in events {
      transferUsageEvent(event, via: session)
    }
  }

  private func transferUsageEvent(_ event: [String: Any], via session: WCSession) {
    log.info("transferUserInfo CARD_USED (queued for phone)")
    _ = session.transferUserInfo(event)
  }

  // MARK: - WCSessionDelegate

  func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {
    if let error {
      log.error("WCSession activation error: \(error.localizedDescription, privacy: .public)")
    }
    log.info(
      "activation complete: state=\(activationState.rawValue) reachable=\(session.isReachable)"
    )
    if activationState == .activated {
      flushPendingUsageEvents(session)
      applyCachedContextIfAvailable()
      // Best-effort ping so the phone can reply with the latest list if it's
      // foregrounded right now. The applicationContext path covers the
      // unreachable case.
      if session.isReachable {
        log.info("pinging phone with requestCards")
        session.sendMessage(["type": "requestCards"], replyHandler: nil, errorHandler: nil)
      }
    }
  }

  func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
    log.info("didReceiveApplicationContext")
    handleIncoming(payload: applicationContext)
  }

  func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    log.info("didReceiveMessage")
    handleIncoming(payload: message)
  }

  func session(
    _ session: WCSession,
    didReceiveMessage message: [String: Any],
    replyHandler: @escaping ([String: Any]) -> Void
  ) {
    log.info("didReceiveMessage (reply expected)")
    handleIncoming(payload: message)
    replyHandler(["type": "ack"])
  }

  func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
    log.info("didReceiveUserInfo")
    handleIncoming(payload: userInfo)
  }

  // MARK: - Payload handling

  private func handleIncoming(payload: [String: Any]) {
    guard let cards = decodeCards(from: payload) else {
      log.notice("incoming payload had no decodable cards (type=\(payload["type"] as? String ?? "<nil>"))")
      return
    }
    log.info("decoded \(cards.count) card(s) from incoming payload — upserting")
    Task { @MainActor in
      self.upsert(cards: cards)
    }
  }

  /// Recognized payload shapes:
  /// - `{ "type": "cards", "payload": [WatchCard...] }` (snapshot via applicationContext)
  /// - `{ "type": "syncCards", "payload": [WatchCard...] }`
  /// - `{ "type": "syncCard", "payload": { "id": ..., "cardData": WatchCard } }`
  private func decodeCards(from payload: [String: Any]) -> [WatchCard]? {
    let type = payload["type"] as? String

    if type == "cards" || type == "syncCards" {
      if let array = payload["payload"] as? [Any], let cards = decodeArray(array) {
        return cards
      }
    }

    if type == "syncCard", let inner = payload["payload"] as? [String: Any] {
      let cardData = inner["cardData"] as? [String: Any] ?? inner
      if let card = decodeOne(cardData) {
        return [card]
      }
    }

    return nil
  }

  private func decodeArray(_ array: [Any]) -> [WatchCard]? {
    if array.isEmpty {
      // Empty snapshots are valid and should clear stale watch data.
      return []
    }

    var result: [WatchCard] = []
    for item in array {
      if let dict = item as? [String: Any], let card = decodeOne(dict) {
        result.append(card)
      }
    }
    return result.isEmpty ? nil : result
  }

  private func decodeOne(_ dict: [String: Any]) -> WatchCard? {
    guard let data = try? JSONSerialization.data(withJSONObject: dict, options: []) else {
      return nil
    }
    let decoder = JSONDecoder()
    return try? decoder.decode(WatchCard.self, from: data)
  }

  // MARK: - SwiftData persistence

  @MainActor
  private func upsert(cards: [WatchCard]) {
    guard let container else { return }
    Self.upsert(cards: cards, in: container.mainContext)
  }

  @MainActor
  static func upsert(cards: [WatchCard], in context: ModelContext) {

    let existing = (try? context.fetch(FetchDescriptor<WatchCardEntity>())) ?? []
    var byId: [String: WatchCardEntity] = [:]
    for entity in existing { byId[entity.id] = entity }

    let incomingIds = Set(cards.map { $0.id })

    for card in cards {
      let raw = try? JSONEncoder().encode(card)
      if let entity = byId[card.id] {
        entity.name = card.name
        entity.barcode = card.barcodeValue ?? entity.barcode
        entity.barcodeFormat = card.barcodeFormat ?? entity.barcodeFormat
        entity.brandId = card.brandId
        entity.color = card.colorHex ?? entity.color
        entity.usageCount = card.usageCount
        entity.lastUsedAt = card.lastUsedAt
        entity.createdAt = card.createdAt
        entity.isFavorite = card.isFavorite
        entity.updatedAt = Date()
        entity.rawPayload = raw
      } else {
        let entity = WatchCardEntity(
          id: card.id,
          name: card.name,
          barcode: card.barcodeValue ?? "",
          barcodeFormat: card.barcodeFormat ?? "CODE128",
          brandId: card.brandId,
          color: card.colorHex ?? "grey",
          isFavorite: card.isFavorite,
          lastUsedAt: card.lastUsedAt,
          usageCount: card.usageCount,
          createdAt: card.createdAt,
          updatedAt: Date(),
          rawPayload: raw
        )
        context.insert(entity)
      }
    }

    for entity in existing where !incomingIds.contains(entity.id) {
      context.delete(entity)
    }

    try? context.save()
    ComplicationSharedState.persistCards(cards)

    let topCard = WatchCard.sortedForDisplay(cards).first

    ComplicationSharedState.persistTopCardName(topCard?.name)
    ComplicationSharedState.persistTopCardId(topCard?.id)
    ComplicationReloader.reloadAllActiveComplications()
  }
}

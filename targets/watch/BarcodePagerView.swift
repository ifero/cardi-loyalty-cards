import SwiftUI

/// Which card the barcode pager has on screen, as a reference each card's usage task can read
/// after its delay (decision 3: a paged card counts only if it stayed 1 s).
///
/// ⚠️ `Task.isCancelled` alone is not enough, and that was measured, not assumed. A card that the
/// crown moves on from keeps its view — frozen, with no new inputs — for its whole exit slide, and
/// SwiftUI cancels its `.task` only when that slide ENDS; likewise a closed screen's cards only
/// when the pop ends. Filmed on a 40 mm with the slide slowed to 4 s and the delay at 8 s, a card
/// paged away after 5.4 s still sent its `CARD_USED` at 8.2 s, mid-exit. This reference is what
/// the frozen view can still read: the pager moves it on the instant the crown does, and clears it
/// the instant the screen starts to close.
final class WatchBarcodeOnScreen {
  var cardId: String?

  init(cardId: String?) {
    self.cardId = cardId
  }
}

private struct WatchBarcodeOnScreenKey: EnvironmentKey {
  static let defaultValue: WatchBarcodeOnScreen? = nil
}

extension EnvironmentValues {
  /// The barcode pager's on-screen card, handed to every card it shows; `nil` outside a pager.
  var barcodeOnScreen: WatchBarcodeOnScreen? {
    get { self[WatchBarcodeOnScreenKey.self] }
    set { self[WatchBarcodeOnScreenKey.self] = newValue }
  }
}

/// The barcode route's host: one card's barcode at a time, and the Digital Crown scrolling through
/// the cards (Story 23.2, decisions 2–5; watch grammar §8).
///
/// One card per detent, in the order the list showed when the barcode opened, held for the visit
/// so a sync or a usage re-sort under "Frequently used" cannot reshuffle it mid-scan. It stops at
/// the first and the last card (no wrap), and with one reachable card it takes no crown at all.
/// The crown is the only thing that changes the card — and VoiceOver's adjust gesture, standing in
/// for it. No tap, no swipe and no crown movement closes this screen: the ways back are the
/// system's swipe from the left edge and the navigation bar's back chevron, neither of which is
/// code here, so nothing in this file calls `dismiss()`.
///
/// `BarcodeFlashView` draws one card and reads no crown. This view owns the paging state and the
/// crown; `WatchBarcodePaging` owns the arithmetic, as pure Swift the contract suite runs.
///
/// Rejected: `TabView` with `.tabViewStyle(.verticalPage)`. It pages on any vertical swipe — the
/// stray-touch class decision 1 removed — and it preloads neighbouring pages, whose `.task` would
/// play the open haptic and send `CARD_USED` for cards never seen; and it wraps each barcode in a
/// page container the whole-pixel geometry was never measured in.
struct BarcodePagerView: View {
  /// The list's cards as they are now, in its current order, passed down on every list update. The
  /// pager reads it for what still exists and for each card's current data; the ORDER it pages in
  /// is `heldOrder`, never this one.
  let liveCards: [WatchCard]

  /// The ids of the list's cards at the moment the barcode opened. `@State`, so it is taken from
  /// the first `init` only: the list re-renders on every sync and re-sort, and a later `init`
  /// cannot reset it.
  @State private var heldOrder: [String]
  /// The card on screen.
  @State private var currentId: String
  /// The crown's detent: an index into the reachable cards, re-synced to the current card's
  /// position whenever a card drops out of them.
  @State private var detent: Int
  /// `.opened` for the opened card until the first page; `.paged` for every card after, including
  /// a return to the opened one (decision 3).
  @State private var arrival: WatchBarcodeArrival = .opened
  /// The direction of the last page, which decides the slide: onward, the new card enters from the
  /// bottom and the old leaves at the top; back, the reverse.
  @State private var pagesOnward = true
  /// The card on screen, as the reference every card's usage task reads (`WatchBarcodeOnScreen`).
  @State private var onScreen: WatchBarcodeOnScreen
  @FocusState private var pagerHasCrown: Bool
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @Environment(\.isPresented) private var isPresented

  init(openedCardId: String, liveCards: [WatchCard]) {
    let heldOrder = liveCards.map(\.id)

    self.liveCards = liveCards
    _heldOrder = State(initialValue: heldOrder)
    _currentId = State(initialValue: openedCardId)
    _detent = State(initialValue: heldOrder.firstIndex(of: openedCardId) ?? 0)
    _onScreen = State(initialValue: WatchBarcodeOnScreen(cardId: openedCardId))
  }

  private var reachable: [String] {
    WatchBarcodePaging.reachableIds(heldOrder: heldOrder, liveIds: liveCards.map(\.id))
  }

  private var currentCard: WatchCard? {
    liveCards.first { $0.id == currentId }
  }

  private var pages: Bool {
    WatchBarcodePaging.pages(currentId: currentId, reachable: reachable)
  }

  var body: some View {
    ZStack {
      WatchColor.ground.ignoresSafeArea()

      // The crown's reader is a sibling BEHIND the card rather than modifiers on it, and it exists
      // only while the crown has somewhere to go. Adding or removing it therefore never changes
      // the identity of the barcode on screen — which would re-create it, and re-run its open
      // haptic and its usage event, the moment a sync took the other cards away.
      if pages {
        crownReader
      }

      if let card = currentCard {
        page(card)
      } else {
        // The shown card has gone since the barcode opened (deleted on the phone mid-visit).
        Text(WatchL10n.string("watch.cards.unavailable"))
          .font(.footnote)
          .foregroundColor(WatchColor.creamSecondary)
          .frame(maxWidth: .infinity, maxHeight: .infinity)
          .background(WatchColor.ground)
      }
    }
    .onChange(of: detent) { previous, next in
      follow(onward: next > previous)
    }
    .onChange(of: reachable) { _, reachable in
      // A card dropped out of the held order: keep the crown on the card that is showing, so the
      // next detent moves from it rather than from where its old position now points.
      if let position = reachable.firstIndex(of: currentId), position != detent {
        detent = position
      }
    }
    // The screen is closing (the swipe or the chevron): no card on it counts from here on, though
    // its view stays — and its task runs — until the pop has finished.
    .onChange(of: isPresented) { _, presented in
      if !presented {
        onScreen.cardId = nil
      }
    }
    .onDisappear {
      onScreen.cardId = nil
    }
  }

  /// The card's barcode inside a clipped page: each card gets its own `BarcodeFlashView` — its own
  /// geometry settle, render and `.task` — by `.id(card.id)`, and the slide between two of them is
  /// cut at the top of the safe area so neither card ever passes under the title and the clock.
  ///
  /// The page reclaims the same horizontal and bottom edges the barcode does
  /// (`BarcodeFlashView`'s `.ignoresSafeArea(edges: [.horizontal, .bottom])`), so the clip never
  /// trims the barcode and the barcode's geometry is the one it has always measured.
  ///
  /// ⚠️ The clip goes INSIDE the reclaim, and the order is the whole point. `.ignoresSafeArea`
  /// lays its content out in the larger region but reports the safe-area size outward, so a
  /// `.clipped()` after it clips to the safe area — measured on a 40 mm: it cut 2 pt off each side
  /// of the white field and its bottom 19 pt, digits included. Before it, the clip is laid out in
  /// the reclaimed region and cuts only at the top, where the title strip begins.
  ///
  /// ⚠️ `.geometryGroup()` is what makes the barcode slide WITH its card. A card draws its symbol
  /// ~120 ms after it appears (`BarcodeFlashView`'s settle), so the image joins the card mid-slide;
  /// without the group it is placed at the card's final position at once and sits there while the
  /// field, the digits and the outgoing card slide under and around it — filmed on a 40 mm with
  /// the slide slowed to 4 s. The group moves the card's subtree as one, late image included.
  private func page(_ card: WatchCard) -> some View {
    ZStack {
      adjustable(BarcodeFlashView(card: card, arrival: arrival))
        .geometryGroup()
        .id(card.id)
        .transition(pageTransition)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .clipped()
    .ignoresSafeArea(edges: [.horizontal, .bottom])
    .environment(\.barcodeOnScreen, onScreen)
  }

  /// VoiceOver's adjust gesture pages as the crown does — increment onward, decrement back, through
  /// the same detent and so clamped the same way — for those who do not use the crown.
  ///
  /// Attached when the visit opened on two or more cards. That is fixed for the visit, so this
  /// branch never flips under the barcode on screen (which would re-create it); after a sync takes
  /// the others away the gesture is still offered and moves nothing, as the crown then does.
  @ViewBuilder
  private func adjustable(_ barcode: BarcodeFlashView) -> some View {
    if heldOrder.count >= 2 {
      barcode.accessibilityAdjustableAction { direction in
        switch direction {
        case .increment:
          step(by: 1)
        case .decrement:
          step(by: -1)
        @unknown default:
          break
        }
      }
    } else {
      barcode
    }
  }

  /// The crown, while two or more cards are reachable: one card per detent at low sensitivity,
  /// never continuous, the detent haptic on; focus taken by default and again on appear, as the
  /// pre-23.2 barcode screen took it for its crown. It scrolls through the cards and does nothing
  /// else: no handler here dismisses.
  ///
  /// ⚠️ `.scrollIndicators(.hidden)` is what keeps the barcode clean. Without it watchOS draws its
  /// crown indicator — a capsule with a green position dot — over the top-right corner of the
  /// white field for most of a second after every turn (filmed on a 40 mm).
  /// `.digitalCrownAccessory(.hidden)` does NOT hide it: that governs a custom accessory view, and
  /// the capsule stayed with it, with an empty accessory, and with `focusEffectDisabled()`. Nothing
  /// may overlay the barcode field (grammar §6); the title and the slide already say it moved.
  private var crownReader: some View {
    Color.clear
      .focusable()
      .focused($pagerHasCrown)
      .defaultFocus($pagerHasCrown, true)
      .digitalCrownRotation(
        detent: $detent, from: 0, through: reachable.count - 1, by: 1, sensitivity: .low,
        isContinuous: false, isHapticFeedbackEnabled: true
      )
      .scrollIndicators(.hidden)
      .accessibilityHidden(true)
      .onAppear {
        pagerHasCrown = true
      }
  }

  private var pageTransition: AnyTransition {
    if reduceMotion {
      return .opacity
    }

    return pagesOnward
      ? .asymmetric(insertion: .move(edge: .bottom), removal: .move(edge: .top))
      : .asymmetric(insertion: .move(edge: .top), removal: .move(edge: .bottom))
  }

  /// VoiceOver's move: the crown's detent, one step, clamped to the ends.
  private func step(by offset: Int) {
    guard pages else { return }

    detent = WatchBarcodePaging.clampedDetent(detent + offset, count: reachable.count)
  }

  /// Bring the card at the crown's detent on screen — the one move the crown and VoiceOver share.
  ///
  /// ⚠️ A card leaves by the transition it last RENDERED with. So when the direction reverses, the
  /// direction is set first and the move waits for the next update, which re-renders the outgoing
  /// card with the new direction; moved in one update, it would leave the way the previous page
  /// went. The deferred move reads the detent again rather than a captured target, so a burst of
  /// detents still lands on the last one.
  ///
  /// A detent that already points at the card on screen — the re-sync after a card dropped out —
  /// moves nothing and leaves the direction as it was.
  private func follow(onward: Bool) {
    guard pages, WatchBarcodePaging.id(atDetent: detent, in: reachable) != currentId else { return }

    if pagesOnward != onward {
      pagesOnward = onward

      if !reduceMotion {
        Task { @MainActor in
          showCardAtDetent()
        }
        return
      }
    }

    showCardAtDetent()
  }

  private func showCardAtDetent() {
    guard pages, let target = WatchBarcodePaging.id(atDetent: detent, in: reachable),
      target != currentId
    else { return }

    // Before the slide: the card leaving stops counting the instant the crown moves on.
    onScreen.cardId = target
    withAnimation(.easeInOut(duration: 0.25)) {
      currentId = target
      arrival = .paged
    }
  }
}

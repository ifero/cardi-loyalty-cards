import OSLog
import SwiftUI
import WatchKit

#if DEBUG
  /// The geometry a barcode actually resolved to on this device.
  ///
  /// Records the module width achieved — in pixels and in millimetres — rather than
  /// asserting a magnification floor: six of the seven supported watches cannot reach
  /// ISO 15420's 80 % print floor on their short axis, so enforcing it would blank the
  /// barcode on them (see `WatchBarcodeModulePlan.pixelsPerMillimetre`).
  /// DEBUG-only: it is a development instrument for re-measuring the geometry on real
  /// hardware, not telemetry.
  private let barcodeGeometryLog = Logger(
    subsystem: "com.iferoporefi.myloyaltycards.watch", category: "BarcodeGeometry")
#endif

// Full-screen barcode flash view — restyled to match Figma Apple Watch barcode design.
//
// ⚠️ NOTHING ON THIS SCREEN DISMISSES IT EXCEPT THE TWO SYSTEM WAYS BACK — the swipe from the
// left edge and the navigation bar's back chevron (Story 23.2, watch grammar §8). The Digital
// Crown used to dismiss it on any movement, and a tap on the code used to as well. Both bound
// an accidental input — a single detent, a sleeve, the other hand steadying the watch, a stray
// touch while the wrist is held to a scanner — to losing the barcode mid-scan, which is the
// failure this app exists to prevent.
//
// This view draws ONE card and reads no crown: no crown handler, no focus. The crown scrolls
// through the cards one level up, in `BarcodePagerView`, which shows each card by giving it its
// own instance of this view (decisions 2–5).
struct BarcodeFlashView: View {
  let card: WatchCard
  /// How the card got here: opened from the list or a complication, or paged to by the crown.
  /// It decides the haptic and when the card counts as used — see the `.task(id: card.id)` below.
  let arrival: WatchBarcodeArrival

  /// The card its pager has on screen now, read live by the usage task (`nil` outside a pager).
  @Environment(\.barcodeOnScreen) private var onScreen

  // The dimmed Always-On state, which is as close as watchOS lets an app get to the
  // display's luminance: there is no brightness API to call and no keep-awake API to
  // hold the wake period open (Story 16.26's AC1 determination, recorded in that
  // story's Dev Agent Record). The system sets this true when the wrist drops and keeps
  // this view on screen rather than blurring it, so the barcode is still being
  // presented to the scanner — just dimmer.
  @Environment(\.isLuminanceReduced) private var isLuminanceReduced
  @State private var barcodeImage: Image? = nil
  // `.zero` until the `GeometryReader` reports a size. It used to default to 156 x 88,
  // which rendered one image against a guess and a second against the real geometry —
  // and with an orientation to resolve, that first guess would be a visible flip on
  // appear. The render task is gated on a non-zero size instead.
  @State private var barcodePixelSize: CGSize = .zero
  @State private var barcodeOrientation: WatchBarcodeOrientation? = nil
  // What is actually ON SCREEN, as opposed to what was last planned.
  //
  // `renderedOrientation` — not `barcodeOrientation` — is the incumbent the rotation
  // hysteresis protects: the first `GeometryReader` pass reports the full screen and
  // is superseded ~60 ms later, so latching on a plan would let a measurement that
  // never reached the renderer pin an orientation the settled geometry would not have
  // chosen.
  //
  // `renderedTaskID` is the render guard's memory, and it is deliberately the WHOLE
  // task id rather than the pieces of geometry it used to compare. Comparing a subset
  // silently skipped a re-render whenever an input outside that subset changed — a
  // card whose payload was edited in place keeps its size and orientation, so the
  // guard would return early and leave the old symbol beside the new number.
  @State private var renderedTaskID: String = ""
  @State private var renderedOrientation: WatchBarcodeOrientation? = nil

  private var titleText: String {
    WatchBarcodePresentation.title(for: card)
  }

  /// Whether the pager still shows this card. Read through the shared reference, so it is current
  /// even while this view is frozen for its exit slide.
  private var isStillOnScreen: Bool {
    onScreen.map { $0.cardId == card.id } ?? true
  }

  /// The symbol's width in module units, quiet zones EXCLUDED — `nil` for QR and for
  /// a value no encoder accepts.
  ///
  /// Recomputed with the body rather than held in `@State`: it is one encoder pass
  /// over a short string, and as state the first frame would plan the layout without
  /// it and then visibly resize once it arrived.
  private var symbolUnits: Int? {
    guard let value = card.barcodeValue, !value.isEmpty else { return nil }

    return BarcodeGenerator.symbolModuleUnits(value: value, formatString: card.barcodeFormat)
  }

  /// What to draw for the display's current luminance state.
  ///
  /// The single place the luminance flag is consumed. Everything downstream reads the
  /// resolved presentation instead, which is what keeps the flag out of the geometry:
  /// see `WatchBarcodeLuminancePresentation.reservesValueStrip` for why feeding
  /// `showsValueLabel` the raw flag would re-plan the module mid-scan.
  private var luminancePresentation: WatchBarcodeLuminancePresentation {
    WatchBarcodeLuminancePresentation.make(
      isLuminanceReduced: isLuminanceReduced,
      hasValue: !(card.barcodeValue?.isEmpty ?? true),
      // The DRAWN orientation, for the same reason `barcodeAccessibilityLabel` uses it:
      // the digits are judged against the symbol the scanner is actually looking at, not
      // against a plan that may still be superseded.
      orientation: renderedOrientation
    )
  }

  /// Accessibility label for the drawn symbol.
  ///
  /// A rotated barcode has to be presented to the scanner sideways. A sighted user
  /// reads that off the shape — the symbol is visibly taller than it is wide — but a
  /// VoiceOver user gets nothing from the geometry, so the orientation has to be said
  /// out loud. Rotation is new in Story 16.27; before it, a barcode was always
  /// horizontal and one label was enough.
  private var barcodeAccessibilityLabel: String {
    let key =
      renderedOrientation?.isRotated == true
      ? "watch.barcode.accessibility.image_rotated_format"
      : "watch.barcode.accessibility.image_format"

    return WatchL10n.format(key, titleText)
  }

  /// Identity for the render task: everything the drawn bitmap depends on — the
  /// payload, its symbology, the pixel target and the orientation.
  ///
  /// The value and format are keyed even though they are usually fixed for a card id,
  /// because the alternative failure is silent and wrong rather than merely stale: the
  /// human-readable `Text(value)` under the image reads `card` live from the body, so
  /// a payload edited in place would print one number beside a barcode encoding
  /// another. Keying `card.id` alone would not notice.
  private var renderTaskID: String {
    let width = Int(barcodePixelSize.width)
    let height = Int(barcodePixelSize.height)
    let payload = "\(card.barcodeValue ?? "")|\(card.barcodeFormat ?? "")"

    return "\(card.id)-\(payload)-\(width)x\(height)-\(barcodeOrientation?.rawValue ?? "none")"
  }

  var body: some View {
    ZStack {
      Color.black.ignoresSafeArea()

      // Take every edge the system does not draw into, and keep the one it does.
      //
      // Left wholly inside the safe area this `GeometryReader` was handed 158 x 130.5 pt
      // of a 162 x 197 pt watch — a third of the display black and unused. Ignoring the
      // horizontal and bottom edges reclaims all of it except the top strip, taking the
      // 40 mm to 162 x 149.5 pt and the 46 mm from 204 x 150 to 208 x 186.
      //
      // The TOP edge is deliberately kept, and it is not free: at 40 mm it costs the
      // rotated length axis 95 px, which is most of a module step (3 px/module needs
      // 3 × 103 = 309 px along that axis). Two things live in that strip and both are
      // worth more. The navigation bar carries the back chevron and
      // the card's name. The system clock is drawn there by watchOS with no API to
      // suppress it — and measured on a 46 mm with the safe area fully ignored, it
      // renders white glyphs straight THROUGH the black bars, breaking them in the
      // top-right. A wider module bought by corrupting the symbol is not a wider module.
      //
      // Clearing the clock needs roughly 33 pt; the module step has 6 pt (46 mm) to
      // 11.5 pt (40 mm) of slack. There is no arrangement that buys both, so the symbol
      // stays intact and the reclaim is width plus bar height.
      GeometryReader { geometry in
        let presentation = luminancePresentation
        let layout = WatchBarcodeLayoutMetrics.make(
          containerSize: geometry.size,
          formatString: card.barcodeFormat,
          symbolUnits: symbolUnits,
          showsValueLabel: presentation.reservesValueStrip,
          currentOrientation: renderedOrientation
        )

        VStack(spacing: 0) {
          Spacer(minLength: 0)

          if let barcodeImage = barcodeImage {
            barcodeImage
              .resizable()
              .interpolation(.none)
              .scaledToFit()
              .frame(width: layout.barcodeSize.width, height: layout.barcodeSize.height)
              .accessibilityIdentifier("barcode-image")
              .accessibilityLabel(barcodeAccessibilityLabel)
          } else {
            barcodePlaceholder(layout: layout)
          }

          if let value = card.barcodeValue, !value.isEmpty {
            Text(value)
              .font(
                .system(
                  size: layout.valueFontSize,
                  weight: .medium,
                  design: .monospaced
                )
              )
              .foregroundColor(.black)
              .lineLimit(1)
              .minimumScaleFactor(0.5)
              .padding(.top, layout.contentSpacing)
              .padding(.horizontal, layout.valueHorizontalPadding)
              // Suppress the digits when the dimmed display is showing a ROTATED symbol
              // — see `WatchBarcodeLuminancePresentation.drawsValueGlyphs` for why the
              // pairing is the condition and why a horizontal symbol keeps its number.
              //
              // `opacity`, not `if` or `.hidden()`, and the difference matters three
              // times over. The strip keeps its height, so `layout` is untouched and the
              // symbol cannot be re-planned or re-centred as the wrist drops. It keeps
              // its WHITE fill, so the strip reads as extra clear space rather than the
              // black that removing it would expose — which on the rotated axis would
              // cut the effective quiet zone instead of extending it. And it stays in
              // the accessibility tree, which is deliberate: this is a change to what a
              // SCANNER sees, and a VoiceOver user — who cannot perceive the digits
              // going and still needs the number to key in — should not lose it because
              // the wrist is down. `.accessibilityHidden(true)` here would be a real
              // regression for them in exchange for nothing.
              //
              // Unanimated on purpose: no `.animation` modifier reaches this, so the
              // digits cut straight out rather than passing through partial alpha —
              // grey strokes in the quiet zone would be worse than either endpoint.
              .opacity(presentation.drawsValueGlyphs ? 1 : 0)
              .accessibilityIdentifier("barcode-number")
          }

          Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(layout.boxInnerPadding)
        .background(
          RoundedRectangle(cornerRadius: layout.cornerRadius)
            .fill(Color.white)
        )
        .onAppear {
          updateBarcodeGeometry(layout, container: geometry.size)
        }
        .onChange(of: geometry.size) { _, newSize in
          let updatedLayout = WatchBarcodeLayoutMetrics.make(
            containerSize: newSize,
            formatString: card.barcodeFormat,
            symbolUnits: symbolUnits,
            showsValueLabel: presentation.reservesValueStrip,
            currentOrientation: renderedOrientation
          )
          updateBarcodeGeometry(updatedLayout, container: newSize)
        }
        .padding(.horizontal, layout.outerHorizontalPadding)
        .padding(.vertical, layout.outerVerticalPadding)
      }
      .ignoresSafeArea(edges: [.horizontal, .bottom])
    }
    // The navigation bar and the card's name STAY (ifero's call, 2026-09-04): the back
    // chevron and the title are what make this screen navigable rather than a slab of
    // stripes, and the top inset they live in is the same inset that keeps the system
    // clock off the symbol — see the `.ignoresSafeArea` above for what that costs.
    .navigationTitle(titleText)
    // THE BARCODE-SCREEN TINT CARVE-OUT (Story 21.3, specified by
    // `docs/design/cardi/cardi-watch-grammar.md` §4.5).
    //
    // Story 21.3 names `AccentColor` as the watchOS global accent, and that colour
    // is beam `#FCCC0C`. watchOS applies the accent to the app's title string in the
    // navigation bar — and on THIS screen that string is the card's NAME. Verified on
    // a 46 mm simulator: without this line the name renders beam, directly over the
    // barcode surface, which the design system forbids outright ("anything overlaying
    // a barcode, especially a drawn beam"; "beam … never on a barcode").
    //
    // ⚠️ CREAM, NOT INK, and ink is the instinctive wrong answer. On watchOS the
    // reserved title strip is part of the BLACK surround, not part of the white
    // barcode field — the field starts below it. Ink on black is invisible.
    //
    // This is not a new exception. The system already says the barcode modal ignores
    // dark mode and stays white; it ignores the accent for the same reason and in the
    // same breath.
    //
    // The cream is the shared `WatchColor.cream` (Story 23.2), not a second literal: it
    // is the same body-text cream the list paints, and the only `WatchColor` this view
    // itself reads. Its host, `BarcodePagerView`, adds the ground under it and the
    // unavailable line's `creamSecondary`. `test/watch-accent.test.ts` asserts this line,
    // and that no ink and no beam appear anywhere in this file.
    //
    // ⚠️ `.tint()` DOES NOT WORK HERE, and it fails silently. It was the first attempt
    // and it changed nothing on a 46 mm simulator: this view is a `navigationDestination`
    // of the list's `NavigationStack`, and the bar is drawn by the STACK, so a tint set
    // inside the destination's own body never reaches it. `toolbarForegroundStyle` is the
    // modifier for bars SwiftUI manages — and it is watchOS-only (watchOS 9.0+,
    // explicitly unavailable on iOS, macOS and tvOS), which is the clue that it exists
    // precisely for this strip.
    .toolbarForegroundStyle(WatchColor.cream, for: .navigationBar)
    .accessibilityIdentifier("barcode-view")
    .task(id: card.id) {
      // The open haptic belongs to an OPEN. A card the crown paged to is marked by the crown's
      // own detent haptic instead, so it plays nothing here (Story 23.2, decision 3).
      if arrival == .opened {
        WKInterfaceDevice.current().play(.success)
      }

      // Story 9.6 (ADR-2026-06-09-001): a displayed barcode is a card "open" —
      // emit the usage event so the phone counts it toward shared sorting.
      //
      // The opened card counts at once, as it always has. A paged card counts only once it has
      // stayed on screen for the policy's delay, so skimming past cards sends nothing for them.
      // `try?` swallows the sleep's cancellation, so the check after it is what keeps a card the
      // crown moved on from — or a screen closed within the delay — from counting. Both checks,
      // because cancellation comes late: this view outlives the crown's move by its exit slide,
      // and the screen's close by the pop, and only the pager's `onScreen` moves on at once (see
      // `WatchBarcodeOnScreen` for the measurement).
      let usageDelay = WatchBarcodePaging.usageDelay(for: arrival)
      if usageDelay > .zero {
        try? await Task.sleep(for: usageDelay)
        if Task.isCancelled || !isStillOnScreen { return }
      }
      WatchSessionManager.shared.recordCardUsed(cardId: card.id)
    }

    .task(id: renderTaskID) {
      guard let value = card.barcodeValue, let format = card.barcodeFormat else { return }
      guard barcodePixelSize.width > 0, barcodePixelSize.height > 0 else { return }
      guard barcodeImage == nil || renderedTaskID != renderTaskID else { return }

      // Let the container settle before drawing anything.
      //
      // `GeometryReader` reports the FULL SCREEN on its first pass and the
      // safe-area-inset container about 60 ms later — measured on watchOS 26.4
      // simulators as 162x197 -> 158x130.5 pt (40 mm) and 208x248 -> 204x150 pt
      // (46 mm). Those two resolve to DIFFERENT geometry: on the 46 mm the first
      // says rotated at 4 px/module and the settled one says horizontal at 3, so
      // rendering the first paints a symbol that then visibly flips on appear.
      //
      // `.task(id:)` cancels and restarts whenever the target changes, so sleeping
      // first means a superseded geometry never reaches the renderer at all. 120 ms
      // is twice the observed settling gap; the cost is a barely perceptible delay
      // before the barcode appears, against a flip the user would certainly see.
      try? await Task.sleep(for: .milliseconds(120))
      if Task.isCancelled { return }

      if format.trimmingCharacters(in: .whitespacesAndNewlines).uppercased() == WatchBarcodeFormat.QR.rawValue,
        let syncedImage = syncedQRImage()
      {
        barcodeImage = syncedImage
        renderedTaskID = renderTaskID
        renderedOrientation = barcodeOrientation
        return
      }

      let img = await BarcodeGenerator.generateImage(
        value: value, formatString: format, pixelSize: barcodePixelSize,
        orientation: barcodeOrientation ?? .horizontal)
      if Task.isCancelled {
        return
      }
      if let img = img {
        barcodeImage = img
        renderedTaskID = renderTaskID
        renderedOrientation = barcodeOrientation
      } else {
        barcodeImage = nil
        renderedTaskID = ""
        renderedOrientation = nil
      }

      #if DEBUG
        // Paired with the `container=` line from `updateBarcodeGeometry`: that one
        // says what was PLANNED, this says what was DRAWN. Exactly one `drawn=` line
        // per presentation means the settle above did its job — two means a
        // superseded geometry reached the renderer and the symbol flipped on screen.
        barcodeGeometryLog.debug(
          """
          drawn=\(Int(barcodePixelSize.width), privacy: .public)x\
          \(Int(barcodePixelSize.height), privacy: .public)px \
          orientation=\(barcodeOrientation?.rawValue ?? "none", privacy: .public) \
          image=\(img == nil ? "placeholder" : "barcode", privacy: .public)
          """
        )
      #endif
    }
  }

  /// Adopt `layout`'s resolved geometry as the render target.
  ///
  /// Nothing is rounded here. The layout already produced whole device pixels, and
  /// rounding a second time is what used to break the frame/image agreement: this
  /// rounded the target DOWN while `.frame()` used the unrounded size, so SwiftUI
  /// rescaled the bitmap by a fraction of a pixel and `.interpolation(.none)`
  /// resolved that by duplicating a pixel column — putting back the ±1 px bar-width
  /// jitter the integer module exists to remove.
  private func updateBarcodeGeometry(_ layout: WatchBarcodeLayoutMetrics, container: CGSize) {
    if barcodePixelSize != layout.barcodePixelSize {
      barcodePixelSize = layout.barcodePixelSize
    }

    if let plan = layout.modulePlan {
      if barcodeOrientation != plan.orientation {
        barcodeOrientation = plan.orientation
      }

      #if DEBUG
        // Read with: `xcrun simctl spawn booted log stream --predicate
        // 'category == "BarcodeGeometry"'`. This is how the geometry gets re-measured
        // on real hardware instead of being derived from the screen dimensions —
        // `container` is what the safe area actually leaves the GeometryReader once
        // the horizontal and bottom edges are reclaimed, which no table can predict.
        barcodeGeometryLog.debug(
          """
          container=\(Double(container.width), privacy: .public)x\
          \(Double(container.height), privacy: .public)pt \
          image=\(Int(layout.barcodePixelSize.width), privacy: .public)x\
          \(Int(layout.barcodePixelSize.height), privacy: .public)px \
          orientation=\(plan.orientation.rawValue, privacy: .public) \
          units=\(plan.symbolUnits, privacy: .public) \
          module=\(plan.modulePixelWidth, privacy: .public)px \
          drawable=\(plan.canRender, privacy: .public) \
          (\(plan.moduleMillimetres, privacy: .public)mm) \
          lengthFill=\(plan.lengthFillRatio, privacy: .public)
          """
        )
      #endif
    } else if barcodeOrientation != nil {
      barcodeOrientation = nil
    }
  }

  private func syncedQRImage() -> Image? {
    guard let base64 = card.barcodeImageBase64,
      let data = Data(base64Encoded: base64),
      let uiImage = UIImage(data: data)
    else {
      return nil
    }

    return Image(uiImage: uiImage)
  }

  @ViewBuilder
  private func barcodePlaceholder(layout: WatchBarcodeLayoutMetrics) -> some View {
    if let value = card.barcodeValue, !value.isEmpty {
      ZStack {
        RoundedRectangle(cornerRadius: 6)
          .stroke(Color.black.opacity(0.3), lineWidth: 1)

        Text(value)
          .font(.system(size: 14, weight: .semibold, design: .monospaced))
          .foregroundColor(.black)
          .lineLimit(1)
          .minimumScaleFactor(0.5)
          .padding(.horizontal, layout.valueHorizontalPadding)
      }
      .frame(width: layout.barcodeSize.width, height: layout.barcodeSize.height)
      .accessibilityIdentifier("barcode-image")
      .accessibilityLabel(WatchL10n.format("watch.barcode.accessibility.value_format", titleText))
    } else {
      Image(systemName: "barcode")
        .resizable()
        .scaledToFit()
        .foregroundColor(.black)
        .frame(width: layout.barcodeSize.width, height: layout.barcodeSize.height)
        .accessibilityIdentifier("barcode-image")
        .accessibilityLabel(WatchL10n.format("watch.barcode.accessibility.image_format", titleText))
    }
  }
}

struct BarcodeFlashView_Previews: PreviewProvider {
  static var previews: some View {
    Group {
      BarcodeFlashView(
        card: WatchCard(
          id: "1", name: "Esselunga", brandId: "brand-special", colorHex: "#ff4d4d",
          barcodeValue: "5901234123457", barcodeFormat: "EAN13"),
        arrival: .opened
      )
      .previewDisplayName("Barcode 41mm")
      .previewDevice(PreviewDevice(rawValue: "Apple Watch Series 9 - 41mm"))

      BarcodeFlashView(
        card: WatchCard(
          id: "2", name: "Supermarket Loyalty Plus Rewards", brandId: nil, colorHex: "#ffb24d",
          barcodeValue: "041234567890", barcodeFormat: "CODE128"),
        arrival: .opened
      )
      .previewDisplayName("Barcode 45mm - Long Name")
      .previewDevice(PreviewDevice(rawValue: "Apple Watch Series 9 - 45mm"))
    }
  }
}

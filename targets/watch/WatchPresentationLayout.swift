import CoreGraphics
import Foundation

#if canImport(UIKit)
  import UIKit
#endif

#if canImport(WatchKit)
  import WatchKit
#endif

enum WatchBarcodePresentation {
  static func title(for card: WatchCard) -> String {
    let trimmedName = card.name.trimmingCharacters(in: .whitespacesAndNewlines)
    return trimmedName.isEmpty ? WatchL10n.string("watch.cards.fallback_name") : trimmedName
  }
}

struct WatchCardRowLayoutMetrics {
  let rowSpacing: CGFloat
  let horizontalPadding: CGFloat
  let verticalPadding: CGFloat
  let accentWidth: CGFloat
  let accentHeight: CGFloat
  let avatarSize: CGFloat
  let cornerRadius: CGFloat
  let minimumTapHeight: CGFloat

  var estimatedHeight: CGFloat {
    max(max(accentHeight, avatarSize) + (verticalPadding * 2), minimumTapHeight)
  }

  /// Inset for brand-logo artwork drawn in the circular avatar. The avatar is
  /// clipped to a circle, so artwork is confined to the circle's inscribed square
  /// (side = diameter / √2); without the inset a wide wordmark would have its ends
  /// clipped by the mask. Derived from `avatarSize` so the two cannot drift.
  var avatarLogoInset: CGFloat {
    (avatarSize * (1 - (1 / 2.0.squareRoot()))) / 2
  }

  /// The card row, derived from its content (watch grammar §5.3): `max(28, 30) + 2 × 9 = 48`,
  /// which is also the system's touch target. On the card row `minimumTapHeight` therefore never
  /// binds — it was 44 until Story 23.2 and moving it to 48 moved no row pixel; it states the
  /// intent, so nobody "fixes" it downwards. The sort picker's rows take the same floor, and
  /// there it DOES bind: their content is shorter, so they grew from 44 to 48 (measured at 40 mm).
  static let compact = WatchCardRowLayoutMetrics(
    rowSpacing: 10,
    horizontalPadding: 10,
    verticalPadding: 9,
    accentWidth: 5,
    accentHeight: 28,
    avatarSize: 30,
    cornerRadius: 14,
    minimumTapHeight: 48
  )
}

/// Device-pixel facts every barcode measurement is quantised against.
///
/// A barcode is the one thing on this watch whose correctness is measured in device
/// pixels rather than points: a 1-module bar drawn 2 px wide in one place and 3 px
/// wide in another is a 50 % error on the element every 1D decoder normalises its
/// digit classification against (Story 16.23). Points cannot express that, so the
/// geometry is planned in pixels and converted back only for `.frame()`.
enum WatchDisplayMetrics {
  /// Device pixels per point.
  ///
  /// Read from the device rather than hardcoded. It is 2 on every watchOS 10 device —
  /// verified against Xcode's own simulator profiles, where `mainScreenScale` is 2
  /// for all of 40/41/42/44/45/46/49 mm — but a future scale must widen the modules,
  /// not silently halve them.
  static var scale: CGFloat {
    #if os(watchOS)
      let deviceScale = WKInterfaceDevice.current().screenScale
    #elseif canImport(UIKit)
      let deviceScale = UIScreen.main.scale
    #else
      let deviceScale: CGFloat = 1
    #endif

    return deviceScale > 0 ? deviceScale : 1
  }

  /// Whole device pixels in `points`.
  ///
  /// Floored, never rounded: a measurement must not claim a pixel the container does
  /// not have, or the symbol overflows its box and SwiftUI rescales the bitmap —
  /// which `.interpolation(.none)` resolves by duplicating a pixel column, putting
  /// back the ±1 px jitter this whole path exists to remove. Never below one.
  static func pixels(_ points: CGFloat, scale: CGFloat) -> Int {
    max(Int((points * scale).rounded(.down)), 1)
  }
}

/// Which screen axis a linear symbol's bars are read along.
///
/// Horizontal is the default. `rotated` is the fallback the geometry forces when the
/// long axis is the only one that affords a wider module — a computed consequence of
/// the module arithmetic, never a hardcoded device list.
enum WatchBarcodeOrientation: String {
  case horizontal
  case rotated

  var isRotated: Bool { self == .rotated }
}

/// The pixel budget one orientation offers a linear symbol.
struct WatchBarcodeAxisBudget: Equatable {
  /// Pixels along the reading direction — what the module width divides.
  let lengthPixels: Int
  /// Pixels across it: the bar height.
  let thicknessPixels: Int
}

/// An integer-pixel plan for one linear symbol on one screen.
///
/// Every element of the drawn symbol is an exact multiple of `modulePixelWidth`, so a
/// 1-module bar has ONE width across the whole symbol. Its predecessor accumulated
/// fractional module boundaries and snapped each one with `Int(round(_:))`; because
/// the module width was not an integer, 1-module elements landed on 2 px in one place
/// and 3 px in another. Bar-width variance is now zero by construction rather than by
/// tuning. `renderQRCodeImage` has always worked this way — fit an integer multiple,
/// then centre it — and this is that pattern applied to the 1D path.
///
/// Pure integer arithmetic on purpose: the contract test lifts this type out of the
/// source and *runs* it, which a type touching CoreGraphics or WatchKit could not do.
struct WatchBarcodeModulePlan: Equatable {
  let orientation: WatchBarcodeOrientation
  /// Module-width units of the SYMBOL — its bars and spaces, quiet zones excluded.
  ///
  /// Excluded deliberately. Dividing the screen by symbol + the full spec quiet zone
  /// makes the margins compete with the bars for pixels at the same price, and on a
  /// 40 mm that is the whole difference: 324 px over EAN-13's 113 units (95 + 11 + 7)
  /// gives a 2 px module, while over its 95 symbol units plus the 8-module reservation
  /// — a divisor of 103 — it gives 3. The quiet zone is white space and takes the
  /// remainder, which `WatchBarcodeBarLayout` splits in the symbology's ratio.
  let symbolUnits: Int
  /// Device pixels per module — the same number for every element of the symbol.
  /// Zero only when not even a 1 px module fits; see `canRender`.
  let modulePixelWidth: Int
  /// The chosen orientation's budget, carried so callers need not re-derive it.
  let lengthPixels: Int
  let thicknessPixels: Int

  /// Pixels the symbol itself occupies. Never more than `lengthPixels`.
  var symbolPixelLength: Int { modulePixelWidth * symbolUnits }

  /// Fraction of the available length the symbol's bars and spaces fill. The
  /// remainder is the quiet zone — white, and required — so this never reaches 1.
  var lengthFillRatio: Double {
    lengthPixels > 0 ? Double(symbolPixelLength) / Double(lengthPixels) : 0
  }

  /// False only when the symbol plus its minimum quiet zone exceeds `lengthPixels` — a
  /// payload too long to draw at even one pixel per module, which therefore cannot be
  /// drawn with uniform bars at all. The caller then shows the human-readable value so
  /// the number can be keyed in by hand, the same contract Story 16.28 gave a value no
  /// encoder accepts.
  ///
  /// This is the *only* refusal. A magnification floor deliberately does **not** gate
  /// this path: see `pixelsPerMillimetre`.
  var canRender: Bool { modulePixelWidth >= Self.minimumModulePixelWidth }

  /// One whole device pixel — the smallest module that can be drawn at all.
  ///
  /// Shared with `WatchBarcodeBarLayout.bars`, which refuses below it. When the two
  /// carried the threshold separately they agreed by luck; a single constant means a
  /// change to the boundary cannot leave one of them behind.
  static let minimumModulePixelWidth = 1

  /// The module width achieved, in millimetres — the magnification record, in a unit
  /// that does not pretend a print specification governs an emissive screen.
  var moduleMillimetres: Double { Double(modulePixelWidth) / Self.pixelsPerMillimetre }

  /// Device pixels per millimetre.
  ///
  /// Every Apple Watch from the 40 mm Series 4 to the 49 mm Ultra reports 326 dpi
  /// (`mainScreenWidthDPI` / `mainScreenHeightDPI` in Xcode's simulator device
  /// profiles), so one constant covers the supported line-up: 326 / 25.4 ≈ 12.83
  /// px/mm, i.e. 1 px ≈ 0.078 mm.
  ///
  /// Used to REPORT the module width achieved, never to gate rendering.
  ///
  /// Clearing ISO 15420's 80 % floor — 0.264 mm against EAN-13's 0.33 mm nominal X —
  /// takes 4 px/module at this density, so `4 × 103 = 412 px` along the length axis
  /// once the guaranteed quiet zone is counted into the divisor. **Exactly one
  /// supported watch clears that on its short axis: the 46 mm, at 416 px.** The other
  /// six land on 3 px/module, 0.234 mm, about 71 % of nominal. Gating on the floor
  /// would therefore blank the barcode on six of the seven, which is why it is
  /// recorded and not enforced.
  ///
  /// It is in any case calibrated for ink spread on paper read by a laser at distance;
  /// an emissive high-contrast screen read at 10 cm is a different regime, which is
  /// why scanning off phone screens works at sizes print rejects. Uniformity and
  /// contrast are the levers here, not size.
  ///
  /// ⚠️ These figures move with `minimumQuietZoneUnitsPerSide`, which sets the
  /// divisor. Recompute them if it changes — an earlier revision of this comment went
  /// stale exactly that way, and its conclusion inverted without anyone noticing.
  static let pixelsPerMillimetre: Double = 326.0 / 25.4

  /// The quiet zone the symbol is guaranteed on **each** side, in modules.
  ///
  /// Whatever the symbol does not use beyond it also becomes quiet zone, so the
  /// realised margin is usually larger — 7.7 X leading / 5.3 X trailing on a 40 mm,
  /// 5.0 X / 4.0 X on a 46 mm, from the shipped arithmetic. Its job is to stop an
  /// exact fit putting a bar against the black bezel, which a decoder reads as
  /// another bar.
  ///
  /// **It is not merely a backstop.** On whichever watch sits closest to a module
  /// boundary the split clamps to it exactly, so in every configuration one device's
  /// trailing margin *is* this number. Choosing it is choosing that margin directly.
  ///
  /// **⚠️ This value is a judgement, not a sourced constant.** Unlike 326 dpi (Xcode's
  /// simulator profiles), the per-symbology quiet zones (GS1, ISO/IEC) or the 80 %
  /// magnification floor (ISO 15420), nothing published fixes it. It sets the divisor,
  /// so every step down buys a watch a wider module and costs a module off the
  /// tightest realised margin. Over the supported line-up with EAN-13 — the widest
  /// common case — on the **width axis**, which is the axis that decides here because
  /// the kept top strip shortens the rotated one below it on both measured devices:
  ///
  /// | Floor | Watches at 4 px/module | Tightest realised margin |
  /// | ----- | ---------------------- | ------------------------ |
  /// | 2 X   | 45, 46, 49 mm          | **2.0 X** (45 mm)        |
  /// | 3 X   | 46, 49 mm              | 3.0 X (49 mm)            |
  /// | 4 X   | 46 mm                  | 4.0 X (46 mm)            |
  ///
  /// The trade is one-for-one: each step down takes one more watch up a module and
  /// hands back exactly that much margin. 4 is chosen for being several times the
  /// single narrow element a decoder must distinguish the margin from, while every
  /// watch still gains 50 % of module width over what shipped before Story 16.27 — so
  /// the width is taken without putting a 2 X gap against a black bezel on the 45 mm.
  ///
  /// It is well under GS1's 11 X leading / 7 X trailing for EAN-13, which cannot be met
  /// at the next module up on any watch — and a wider narrow element is the lever every
  /// 1D decoder normalises against, while a quiet zone only has to be *clear*.
  ///
  /// **AC10 settles this.** A real scanner pass is what turns the table above from
  /// arithmetic into evidence: raise this to give the margin back, lower it to take
  /// the 45 mm and 49 mm up a step. `watch-layout-contract.test.ts` pins the row that
  /// ships, so changing it shows its own consequence.
  static let minimumQuietZoneUnitsPerSide = 4

  /// The largest integer module `lengthPixels` affords a symbol of `symbolUnits`,
  /// leaving `minimumQuietZoneUnitsPerSide` modules clear on each side.
  ///
  /// Integer division IS the floor for non-negative operands, and flooring is what
  /// makes the symbol fit: rounding up would overflow the container.
  static func module(symbolUnits: Int, lengthPixels: Int) -> Int {
    let divisor = symbolUnits + (minimumQuietZoneUnitsPerSide * 2)
    guard symbolUnits > 0, lengthPixels > 0, divisor > 0 else { return 0 }

    return lengthPixels / divisor
  }

  /// Resolve the orientation and module width for a symbol of `symbolUnits`.
  ///
  /// `current` is the orientation already on screen, and passing it is what makes the
  /// choice STABLE: **a tie keeps the incumbent.** The comparison is otherwise
  /// antisymmetric, so with ties pinned the only way the orientation can change is
  /// for one axis's integer module to genuinely overtake the other's — a whole-module
  /// move, not a fractional wobble in `geometry.size`. A symbol that flips
  /// orientation mid-presentation is worse than either orientation.
  ///
  /// On the first resolve (`current` is nil) a tie picks `.horizontal`, the default.
  static func resolve(
    symbolUnits: Int,
    horizontal: WatchBarcodeAxisBudget,
    rotated: WatchBarcodeAxisBudget,
    current: WatchBarcodeOrientation?
  ) -> WatchBarcodeModulePlan {
    let horizontalModule = module(symbolUnits: symbolUnits, lengthPixels: horizontal.lengthPixels)
    let rotatedModule = module(symbolUnits: symbolUnits, lengthPixels: rotated.lengthPixels)

    let orientation: WatchBarcodeOrientation
    if rotatedModule > horizontalModule {
      orientation = .rotated
    } else if horizontalModule > rotatedModule {
      orientation = .horizontal
    } else {
      orientation = current ?? .horizontal
    }

    let budget = orientation.isRotated ? rotated : horizontal

    return WatchBarcodeModulePlan(
      orientation: orientation,
      symbolUnits: symbolUnits,
      modulePixelWidth: orientation.isRotated ? rotatedModule : horizontalModule,
      lengthPixels: budget.lengthPixels,
      thicknessPixels: budget.thicknessPixels
    )
  }
}

/// One black bar of a drawn symbol, in whole device pixels, with the bitmap's
/// bottom-left origin already applied.
struct WatchBarcodeBar: Equatable {
  let x: Int
  let y: Int
  let width: Int
  let height: Int
}

/// Where every bar of a symbol goes, given a module plan and a bitmap to draw into.
///
/// Pure integer arithmetic and no CoreGraphics context, which is the point: this is
/// the code that actually positions pixels — including the rotated axis, the one thing
/// Story 16.27 added that had no way to be tested — and keeping it free of `UIColor`
/// lets the contract test lift it out of the source and RUN it. `renderCGImage` is
/// then a thin loop that fills these rects.
enum WatchBarcodeBarLayout {
  /// The bars for `modules` (alternating bar/space, first entry a bar), or an empty
  /// array when the symbol does not fit at even one pixel per module.
  ///
  /// The pixels the symbol cannot use are **centred**, so they read as extra quiet
  /// zone rather than as a bar drawn in the wrong place — the same "fit an integer
  /// multiple, then centre" shape `renderQRCodeImage` has always used.
  static func bars(
    modules: [Int],
    quietZone: WatchBarcodeQuietZone,
    widthPixels: Int,
    heightPixels: Int,
    orientation: WatchBarcodeOrientation
  ) -> [WatchBarcodeBar] {
    let widthPx = max(widthPixels, 1)
    let heightPx = max(heightPixels, 1)
    let symbolUnits = modules.reduce(0, +)
    let lengthPx = orientation.isRotated ? heightPx : widthPx
    let module = WatchBarcodeModulePlan.module(symbolUnits: symbolUnits, lengthPixels: lengthPx)

    guard module >= WatchBarcodeModulePlan.minimumModulePixelWidth else { return [] }

    // Everything the symbol does not use is quiet zone, split in the SYMBOLOGY's
    // ratio — EAN-13 asks for 11 leading against 7 trailing, so a short budget
    // degrades proportionally instead of arbitrarily, keeping the leading zone the
    // wider one as the specification intends. Each side keeps at least the guaranteed
    // minimum, which the module arithmetic above has already reserved room for.
    let symbolPx = module * symbolUnits
    let leftoverPx = max(lengthPx - symbolPx, 0)
    let floorPx = min(
      WatchBarcodeModulePlan.minimumQuietZoneUnitsPerSide * module, leftoverPx / 2)
    let proportional =
      quietZone.total > 0 ? (leftoverPx * quietZone.leading) / quietZone.total : leftoverPx / 2
    var offset = min(max(proportional, floorPx), leftoverPx - floorPx)
    var isBar = true
    var bars: [WatchBarcodeBar] = []

    for units in modules {
      let extent = units * module

      if isBar {
        // A rotated symbol reads top-to-bottom. The bitmap has a bottom-left origin,
        // so the offset is measured down from `heightPx` to put the first element —
        // and with it EAN-13's wider leading quiet zone — at the top. A 1D symbol
        // decodes in either direction, which is why omnidirectional lanes work at all,
        // so this is a convention rather than a requirement.
        bars.append(
          orientation.isRotated
            ? WatchBarcodeBar(
              x: 0, y: heightPx - offset - extent, width: widthPx, height: extent)
            : WatchBarcodeBar(x: offset, y: 0, width: extent, height: heightPx)
        )
      }

      offset += extent
      isBar.toggle()
    }

    return bars
  }
}

/// What the barcode screen draws while the display is in the dimmed Always-On state —
/// and, more importantly, what it refuses to change.
///
/// watchOS offers no way to hold the display at full luminance. Compile-probed against
/// `WatchOS26.5.sdk` at this target's own deployment floor: `UIScreen` is
/// `API_UNAVAILABLE(watchos)`, `WKInterfaceDevice` has no `brightness`, and the only
/// keep-awake property that ever existed, `WKExtension.frontmostTimeoutExtended`, has
/// been `"No longer supported"` since watchOS 7. `WKExtendedRuntimeSession` links, but
/// it keeps the *app* running "even after the watch's screen turns off" — it never holds
/// the display — so it cannot deliver the behaviour either, quite apart from the
/// `WKBackgroundModes` claim Apple's own guidance rules out ("Select a session type
/// based on the app's intended use—not based on the features that the session
/// provides"). See Story 16.26's Dev Agent Record for the full determination.
///
/// What the platform gives instead is NOTICE. `WKSupportsAlwaysOnDisplay` defaults to
/// true for watchOS 8 and later, so on wrist-down the system keeps this view on screen —
/// dimmed, not blurred — and sets `\.isLuminanceReduced`. The symbol is therefore still
/// in front of the scanner, which makes what the app draws in that state the one real
/// lever left.
///
/// ⚠️ **Apple's guidance for that notice is, for a barcode, the defect rather than the
/// fix.** The documentation says to "lower the overall brightness of your view … change
/// large, filled shapes to be stroked, and choose less bright colors". The pure-black /
/// pure-white pair IS the signal every 1D decoder normalises its narrow element against
/// (the mechanism Story 16.23 measured), so a stroked or greyed symbol is an unreadable
/// one. Holding maximum contrast here is a deliberate refusal of the platform example,
/// and this type is where the refusal is written down so a later edit has to argue with
/// it rather than reach for the example.
///
/// Pure and dependency-free on purpose, like `WatchBarcodeModulePlan` beside it: the
/// contract test lifts this type out of the source and *runs* it, which a type touching
/// SwiftUI could not do.
struct WatchBarcodeLuminancePresentation: Equatable {
  /// Draw the human-readable digits under the symbol?
  ///
  /// False while dimmed **and rotated** — that pairing, and not luminance alone, is the
  /// condition, because the reason is geometric rather than photometric. The digits are
  /// the only thing on screen that is neither the symbol nor its quiet zone, and for a
  /// **rotated** symbol their strip lies along the reading axis immediately past the
  /// trailing quiet zone, where black glyph strokes are marks a decoder can take for
  /// bars. Suppressing them leaves that strip clean white instead, which is why this is
  /// not in tension with `reservesValueStrip`: the space stays, the marks go.
  ///
  /// **A horizontal symbol keeps its digits, deliberately.** There the strip sits on the
  /// axis *across* the bars, so a scan line that reads the symbol never crosses it and
  /// there is nothing to suppress. Hiding them anyway would cost the user the number they
  /// can key in by hand — the wrist can be resting flat on a counter rather than lowered
  /// mid-scan — and would buy nothing: black glyphs on white *emit less* than the blank
  /// white that replaces them, so even Apple's "lower the overall brightness" ask does
  /// not argue for it. AC3 says to suppress what *competes* with the symbol; horizontally,
  /// the digits do not.
  ///
  /// The visible cost of that precision is that the behaviour now differs between two
  /// cards on the same watch. It is accepted: orientation is already per-card and per-watch
  /// (Story 16.27), and the alternative is taking the number away from everyone to protect
  /// the minority of layouts that need it.
  ///
  /// A `nil` orientation — nothing drawn yet — keeps the digits. On the usual path that
  /// costs nothing: the view appears because the wrist was just *raised* or the screen
  /// tapped, so the display is not dimmed and the pairing above is false regardless.
  ///
  /// The exception, stated rather than glossed: a view that mounts while the display is
  /// **already** dimmed shows its digits for the ~120 ms the renderer takes to settle, then
  /// stops drawing them if the resolved orientation turns out rotated. Accepted — it touches
  /// only the secondary digits row, never the symbol's geometry or ink, and erring towards
  /// *showing* the number is the safer default while nothing is drawn yet.
  ///
  /// Every such change is an instant cut, not an animated one, and deliberately so: nothing
  /// on this screen carries an `.animation` modifier, so SwiftUI does not interpolate the
  /// opacity. A barcode being read by a scanner is the last place to want an interpolated
  /// frame, and an animation here would also mean the digits spend time at *partial* alpha —
  /// grey strokes in the quiet zone, which is the one state worse than either endpoint.
  let drawsValueGlyphs: Bool

  /// Keep the digits' strip reserved in the layout?
  ///
  /// **Deliberately independent of `drawsValueGlyphs`, and that independence is the
  /// whole point of this type.** This is the field that feeds
  /// `WatchBarcodeLayoutMetrics.make(showsValueLabel:)`, where it becomes
  /// `footerReservedHeight` and so shortens the axis the module divides. Letting it
  /// follow the glyphs — the obvious `showsValueLabel: !isLuminanceReduced` — hands the
  /// solver a container 16 pt taller the instant the wrist drops.
  ///
  /// **That is not a theoretical hazard; it was measured.** Running the shipped solver
  /// both ways over all seven watches and four symbologies, **21 of the 28 combinations
  /// change the bitmap** — a 32 px height step, so a full re-render — and three of those
  /// re-resolve the symbol outright:
  ///
  /// | Watch | Symbol | Awake | Dimmed |
  /// | ----- | ------ | ----- | ------ |
  /// | 40 mm | Code128 | horizontal, module 2 | **rotated, module 3** |
  /// | 40 mm | EAN-8 | horizontal, module 4 | **rotated, module 5** |
  /// | 41 mm | EAN-13 | horizontal, module 3 | **rotated, module 4** |
  ///
  /// The last row is the common case on a common watch: the barcode would turn 90° and
  /// re-quantise while the cashier is mid-scan. The seven QR combinations are the ones
  /// that escape: QR's square fit is `min(contentWidth, max(contentHeight, 112))`, and
  /// every supported watch is more than 16 pt narrower than it is tall, so the footer
  /// delta never reaches the binding term. `watch-display-luminance-contract.test.ts`
  /// reproduces the whole table — QR included, since the invariant has to hold there
  /// too — so reintroducing the naive form fails loudly.
  ///
  /// So luminance must never reach the geometry. It does not reach it here.
  let reservesValueStrip: Bool

  /// `hasValue` is whether the card carries a payload at all — the same condition the
  /// view has always used to decide whether a digits row exists.
  ///
  /// `orientation` is the orientation of the symbol **already drawn**, not of the last
  /// layout planned — the same distinction `BarcodeFlashView.renderedOrientation` exists
  /// for. The digits are being judged against the symbol the scanner is actually looking
  /// at. `nil` means nothing is drawn yet (QR, or a value no encoder accepts).
  ///
  /// Note what this signature deliberately does **not** allow: `orientation` reaches
  /// `drawsValueGlyphs` only. `reservesValueStrip` still answers `hasValue` alone, so
  /// neither luminance nor orientation can travel from here back into the geometry that
  /// produced the orientation in the first place.
  static func make(
    isLuminanceReduced: Bool,
    hasValue: Bool,
    orientation: WatchBarcodeOrientation?
  ) -> Self {
    let competesWithSymbol = isLuminanceReduced && orientation?.isRotated == true

    return WatchBarcodeLuminancePresentation(
      drawsValueGlyphs: hasValue && !competesWithSymbol,
      reservesValueStrip: hasValue
    )
  }
}

struct WatchBarcodeLayoutMetrics {
  let outerHorizontalPadding: CGFloat
  let outerVerticalPadding: CGFloat
  let boxInnerPadding: CGFloat
  let cornerRadius: CGFloat
  let contentSpacing: CGFloat
  let footerReservedHeight: CGFloat
  /// The image's size in whole device pixels — exactly what the renderer is handed.
  let barcodePixelSize: CGSize
  /// `barcodePixelSize` back in points. Because the pixel size is integral and this
  /// is its exact quotient, `.frame(width:height:)` and the returned bitmap agree to
  /// the pixel and SwiftUI has nothing to rescale.
  let barcodeSize: CGSize
  let widthFillRatio: CGFloat
  let valueFontSize: CGFloat
  let valueHorizontalPadding: CGFloat
  /// The resolved plan, or `nil` for QR (2D, drawn by Core Image) and for a value no
  /// encoder accepts (the view draws the human-readable placeholder instead).
  let modulePlan: WatchBarcodeModulePlan?

  /// `symbolUnits` is the symbol's width in module units, quiet zones EXCLUDED, as
  /// reported by `BarcodeGenerator.symbolModuleUnits(value:formatString:)`. It is
  /// passed in rather than derived here so this stays pure geometry: the caller owns
  /// the encoders, this owns the box they have to fit in.
  ///
  /// `currentOrientation` is the orientation of the symbol already DRAWN — not of the
  /// last layout planned. See `WatchBarcodeModulePlan.resolve` for why supplying it is
  /// what keeps the choice from oscillating, and `BarcodeFlashView` for why it has to
  /// be the drawn one.
  static func make(
    containerSize: CGSize,
    formatString: String?,
    symbolUnits: Int?,
    showsValueLabel: Bool,
    scale: CGFloat = WatchDisplayMetrics.scale,
    currentOrientation: WatchBarcodeOrientation? = nil
  ) -> Self {
    let normalizedFormat = (formatString ?? "")
      .trimmingCharacters(in: .whitespacesAndNewlines)
      .uppercased()
    let isQR = normalizedFormat == WatchBarcodeFormat.QR.rawValue

    let safeScale = scale > 0 ? scale : 1
    let safeWidth = max(containerSize.width, 1)
    let safeHeight = max(containerSize.height, 1)
    let outerHorizontalPadding: CGFloat = 0
    let outerVerticalPadding: CGFloat = 0
    // Was 2. A 2 pt inset on a white box inside a white card was invisible and cost
    // 4 pt of the width the module divides. `containerSize` is now the FULL screen —
    // `BarcodeFlashView`'s `GeometryReader` ignores the safe area — so every point
    // here comes straight off the length the module divides.
    let boxInnerPadding: CGFloat = 0
    let contentSpacing: CGFloat = 4
    let valueLabelReservedHeight: CGFloat = showsValueLabel ? 12 : 0
    let footerReservedHeight = valueLabelReservedHeight + (showsValueLabel ? contentSpacing : 0)
    let contentWidth = max(safeWidth - (boxInnerPadding * 2), 1)
    let contentHeight = max(safeHeight - ((boxInnerPadding * 2) + footerReservedHeight), 1)

    let barcodePixelSize: CGSize
    let modulePlan: WatchBarcodeModulePlan?

    // Bar height is the WHOLE cross axis. It used to be 52 % of the screen clamped to
    // 88…110 pt, which left 26.5 pt of the box empty on a 40 mm for no benefit: bar
    // height costs the module nothing — the module divides the LENGTH axis — while a
    // taller bar is strictly easier for a scanner to intersect and to aim at.
    if isQR {
      // Unchanged: the square-fit branch and its 112 pt floor. Only the result is
      // snapped to a whole pixel, so the frame cannot rescale the bitmap.
      let squareSide = min(contentWidth, max(contentHeight, 112))
      let sidePixels = WatchDisplayMetrics.pixels(squareSide, scale: safeScale)
      barcodePixelSize = CGSize(width: sidePixels, height: sidePixels)
      modulePlan = nil
    } else if let symbolUnits, symbolUnits > 0 {
      let plan = WatchBarcodeModulePlan.resolve(
        symbolUnits: symbolUnits,
        horizontal: WatchBarcodeAxisBudget(
          lengthPixels: WatchDisplayMetrics.pixels(contentWidth, scale: safeScale),
          thicknessPixels: WatchDisplayMetrics.pixels(contentHeight, scale: safeScale)
        ),
        rotated: WatchBarcodeAxisBudget(
          lengthPixels: WatchDisplayMetrics.pixels(contentHeight, scale: safeScale),
          thicknessPixels: WatchDisplayMetrics.pixels(contentWidth, scale: safeScale)
        ),
        current: currentOrientation
      )

      modulePlan = plan
      barcodePixelSize =
        plan.orientation.isRotated
        ? CGSize(width: plan.thicknessPixels, height: plan.lengthPixels)
        : CGSize(width: plan.lengthPixels, height: plan.thicknessPixels)
    } else {
      // No encoder accepts the value, so no symbol exists to plan. Keep the full-width
      // box the human-readable placeholder has always been drawn in.
      barcodePixelSize = CGSize(
        width: WatchDisplayMetrics.pixels(contentWidth, scale: safeScale),
        height: WatchDisplayMetrics.pixels(contentHeight, scale: safeScale)
      )
      modulePlan = nil
    }

    let barcodeSize = CGSize(
      width: barcodePixelSize.width / safeScale,
      height: barcodePixelSize.height / safeScale
    )

    return WatchBarcodeLayoutMetrics(
      outerHorizontalPadding: outerHorizontalPadding,
      outerVerticalPadding: outerVerticalPadding,
      boxInnerPadding: boxInnerPadding,
      cornerRadius: 8,
      contentSpacing: contentSpacing,
      footerReservedHeight: footerReservedHeight,
      barcodePixelSize: barcodePixelSize,
      barcodeSize: barcodeSize,
      widthFillRatio: min(barcodeSize.width / safeWidth, 1),
      valueFontSize: 10,
      valueHorizontalPadding: 2,
      modulePlan: modulePlan
    )
  }
}

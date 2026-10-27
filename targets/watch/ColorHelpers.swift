import SwiftUI

// MARK: - Hex Color Parsing

/// Azure `#0C84CC`: what a card colour that cannot be resolved is drawn in.
///
/// It is the palette's own default, not a new choice. The phone falls back to
/// `DEFAULT_CARD_COLOR` (`'grey'`, `core/schemas/card.ts`), which resolves to this azure, and
/// Wear OS mirrors it as `DEFAULT_CARD_ACCENT` (`CardVisuals.kt`), so all three surfaces draw an
/// unreadable colour the same way. It replaced SwiftUI's `.gray` (Story 23.2, watch grammar §4.2):
/// a system colour is not a value, and grey is not in the palette.
///
/// Held as an integer rather than a hex string so `parseHexColor` can fall back to it without
/// calling itself.
private let defaultCardAccentRGB: UInt64 = 0x0C84CC

/// The default accent as a `Color` — the fallback of `parseHexColor`, `mapColor` and the card row.
let defaultCardAccent = rgbColor(defaultCardAccentRGB)

/// Parses an arbitrary 6-digit hex string (with or without `#` prefix) into a SwiftUI `Color`.
/// Returns `defaultCardAccent` (azure) for invalid / unparseable input — never a system colour.
func parseHexColor(_ hex: String) -> Color {
    var h = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    if h.hasPrefix("#") { h.removeFirst() }
    guard h.count == 6, let rgb = UInt64(h, radix: 16) else {
        return defaultCardAccent
    }
    return rgbColor(rgb)
}

private func rgbColor(_ rgb: UInt64) -> Color {
    Color(
        red: Double((rgb >> 16) & 0xFF) / 255.0,
        green: Double((rgb >> 8) & 0xFF) / 255.0,
        blue: Double(rgb & 0xFF) / 255.0
    )
}

// MARK: - Cardì Watch Colours

/// The Cardì colours of the watch app's own chrome, defined ONCE for the target (Story 23.2,
/// `docs/design/cardi/cardi-watch-grammar.md` §4.1, §4.4, §4.5). Every view reads them from here;
/// none holds a colour literal of its own.
///
/// They are chrome, and a card's accent is not: the accents stay in `namedCardHex` below, keyed
/// by what the phone sends. Beam and the `orange` key share a hex, and that is two roles meeting
/// on one value, not a second definition of either.
///
/// The barcode screen takes ONLY `cream`, for its title. Its white field, true-black bars and
/// black surround are the barcode rule's values (grammar §6), not chrome, and beam never appears
/// there.
enum WatchColor {
    /// True black, the OLED ground under every screen.
    static let ground = parseHexColor("#000000")

    /// Ink: card rows and sheet rows. It replaced `#1C1C1F`, which it is 1.03:1 against, so the
    /// change moves no pixel anyone can see and puts the fill in the system.
    static let ink = parseHexColor("#181824")

    /// Beam: the favourite star and the selected sort option (11.5:1 on ink, 13.8:1 on black).
    /// It also tints the list's navigation title, through `AccentColor.colorset` (Story 21.3).
    static let beam = parseHexColor("#FCCC0C")

    /// Cream: body text on dark, ≈15.3:1 on ink. Never pure white — it keeps the warmth.
    static let cream = parseHexColor("#F0F0E8")

    /// Secondary text: cream at 60 %. An opacity tracks the ground it sits on; a fixed grey would
    /// be one more grey.
    static let creamSecondary = cream.opacity(0.6)

    /// The system's dark outline: the border of a row whose accent is near black, and the ring of
    /// a dark logo chip.
    static let hairline = parseHexColor("#3A3A48")
}

// MARK: - Card Palette Resolution

/// The five-key card palette, canonical in `tokens/color.json` → `shared/theme/tokens.generated.ts`
/// (`CARD_COLORS`).
///
/// **The phone sends the KEY, not a hex.** `core/watch-connectivity.ts` sets
/// `colorHex: card.color`, and `card.color` is a required `cardColorSchema` enum
/// (`core/schemas/card.ts`) — so every value reaching this file is one of these keys, for catalogue
/// and custom cards alike. The canonical wire fixture shows it: `test-fixtures/sync-message-v1.json`
/// carries `"colorHex": "green"` on a `conad` card.
///
/// ⚠️ Story 21.2a replaced SwiftUI system colors here with the Cardì card accent hexes, which is a
/// correctness fix and not a repaint. `Color.orange` rendered a hue the design system bans outright,
/// and the other three were only approximately the colour the user had picked on the phone — the
/// same card read as a different colour on the two devices. The five keys are a FROZEN contract, so
/// never add, remove or rename one. Two are deliberately misnamed: `orange` is the beam yellow and
/// `grey` is the azure.
///
/// Story 16.41 moved these from a `switch` inside `mapColor` into this table so that ONE literal
/// serves both the `Color` path and the luminance path below — a second copy would be a second
/// thing to drift. `core/wear-sync-contract.test.ts` reads this table and fails if a key goes
/// missing or a hex drifts from the tokens; `targets/watch-widget/WidgetCardPalette.swift` and
/// `watch-android/…/CardVisuals.kt` hold the same values for the same no-shared-build reason.
private let namedCardHex: [String: String] = [
    "blue": "#0C3C84",
    "red": "#E42424",
    "green": "#0C843C",
    "orange": "#FCCC0C",
    "gray": "#0C84CC",
    "grey": "#0C84CC"
]

/// The normalized `"#RRGGBB"` a raw card color value resolves to — a palette key ("blue", "red", …)
/// **or** a hex string — or `nil` when the value is absent or unparseable.
///
/// ⚠️ **Every luminance decision must go through this.** `relativeLuminance` returns `0.0` for
/// input it cannot parse, and `0.0` reads as *black*, so handing it a raw palette key answers
/// "near-black" for all five (Story 16.41). Callers default the *decision*, never the string:
/// `resolvedCardHex(raw) ?? ""` walks straight back into the same trap.
///
/// Mirrors `WidgetCardPalette.hex(for:)` and Wear's `resolveCardColor`, so one card reads as one
/// color across the app, the complication and Wear OS.
func resolvedCardHex(_ raw: String?) -> String? {
    guard
        let trimmed = raw?.trimmingCharacters(in: .whitespacesAndNewlines),
        !trimmed.isEmpty
    else {
        return nil
    }

    if let named = namedCardHex[trimmed.lowercased()] {
        return named
    }

    var h = trimmed
    if h.hasPrefix("#") { h.removeFirst() }
    guard h.count == 6, UInt64(h, radix: 16) != nil else { return nil }
    return "#" + h.uppercased()
}

/// Resolves a named palette key or an arbitrary hex string to a `Color`.
/// Returns `nil` only when input is nil/empty, and `defaultCardAccent` (azure) when it is present
/// but unparseable.
///
/// Named keys resolve through `namedCardHex` — the exact palette hex the user picked on the phone.
/// They previously mapped to SwiftUI *system* colors, which made the same card render one color in
/// the list and another in its own complication; Wear's `CardVisuals.kt` had already called that
/// out as watchOS "approximat[ing] with system colours" (Story 16.41).
///
/// ⚠️ **The card row no longer calls this** — it resolves once into `resolvedAccentHex` and maps
/// that through `parseHexColor`, so fill, hairline and initials share one value. This stays as the
/// Color-returning convenience and is covered by `watch-ios/Tests/CardRowHelpersTests.swift`; it
/// cannot drift from the row, because both go through `resolvedCardHex`. Retiring it is a
/// judgement call left open rather than taken inside a bug fix.
func mapColor(hex: String?) -> Color? {
    guard let raw = hex?.trimmingCharacters(in: .whitespacesAndNewlines), !raw.isEmpty else {
        return nil
    }
    guard let resolved = resolvedCardHex(raw) else {
        return defaultCardAccent
    }
    return parseHexColor(resolved)
}

// MARK: - Contrast Helpers

/// Returns the relative luminance of a hex color string (0 = black, 1 = white).
/// Uses the WCAG formula: https://www.w3.org/TR/WCAG20/#relativeluminancedef
func relativeLuminance(hex: String) -> Double {
    var h = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    if h.hasPrefix("#") { h.removeFirst() }
    guard h.count == 6, let rgb = UInt64(h, radix: 16) else {
        return 0.0 // default to dark for invalid input
    }

    let r = Double((rgb >> 16) & 0xFF) / 255.0
    let g = Double((rgb >> 8) & 0xFF) / 255.0
    let b = Double(rgb & 0xFF) / 255.0

    let rLin = r <= 0.03928 ? r / 12.92 : pow((r + 0.055) / 1.055, 2.4)
    let gLin = g <= 0.03928 ? g / 12.92 : pow((g + 0.055) / 1.055, 2.4)
    let bLin = b <= 0.03928 ? b / 12.92 : pow((b + 0.055) / 1.055, 2.4)

    return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin
}

/// Returns `true` when text on a background of `hex` color should take the LIGHT side, `false`
/// for the dark side. Uses a luminance threshold: dark backgrounds (below 0.4) → light text,
/// light → dark text. The card row's light side is cream and its dark side ink (Story 23.2); the
/// name is kept because `WidgetCardPalette` and `CardRowHelpersTests` refer to it.
func shouldUseWhiteText(onBackgroundHex hex: String) -> Bool {
    return relativeLuminance(hex: hex) < 0.4
}

/// Detects near-black colors (luminance below threshold) that need special treatment
/// on an OLED-black background (e.g., subtle border or lighter accent).
func isNearBlack(hex: String) -> Bool {
    return relativeLuminance(hex: hex) < 0.05
}

// MARK: - Initials

/// Extracts one-letter or two-letter initials from a display name.
func initials(from name: String) -> String {
    let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return "" }
    let parts = trimmed.split(separator: " ")
    if parts.count >= 2 {
        let first = parts[0].first.map(String.init) ?? ""
        let second = parts[1].first.map(String.init) ?? ""
        return (first + second).uppercased()
    }
    return String(trimmed.prefix(2)).uppercased()
}

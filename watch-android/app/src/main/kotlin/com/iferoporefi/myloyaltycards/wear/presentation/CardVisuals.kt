package com.iferoporefi.myloyaltycards.wear.presentation

import kotlin.math.pow

/**
 * Framework-free colour/initials helpers for a card row, ported from watchOS's
 * `ColorHelpers.swift`. Kept free of Compose and Android types so the colour maths is unit-tested
 * directly (JVM, no Robolectric); [CardRow] converts an [Rgb] to a Compose `Color` at the edge.
 */

/** An 8-bit-per-channel RGB colour. */
data class Rgb(val red: Int, val green: Int, val blue: Int)

/**
 * The accent a card falls back to when its colour is missing or unparseable (Open Decision 6 —
 * never crash, never render an invisible avatar). This is the palette's `grey` key, and it mirrors
 * `DEFAULT_CARD_COLOR` / `DEFAULT_CARD_COLOR_HEX` on the phone so both devices agree on what an
 * unresolvable colour looks like.
 *
 * It was called `NEUTRAL_GREY` and held `#64748B` until Story 21.2a, which repainted the `grey`
 * key to the azure `#0C84CC` — the Cardì accents contain no neutral at all, so a constant named
 * "grey" holding an azure would have been exactly the misnaming that story exists to avoid.
 */
val DEFAULT_CARD_ACCENT: Rgb = Rgb(0x0C, 0x84, 0xCC)

/**
 * The phone's virtual-logo palette (`CARD_COLORS`), canonical in `tokens/color.json` →
 * `shared/theme/tokens.generated.ts`. Duplicated here because the Wear module shares no build
 * with the phone. A custom card's colour arrives as one of these keys
 * (`core/watch-connectivity.ts` sends `colorHex: card.color`), so resolving them to the exact
 * palette hex is what makes the watch avatar match the colour the user picked on the phone.
 *
 * ⛔ THE KEYS ARE A FROZEN WIRE CONTRACT, NOT COLOUR NAMES (Story 21.2a). This APK is versioned
 * and released independently of the phone app (see app/build.gradle.kts § versionCode bands), so a
 * key the phone renames but this map has not learned yet resolves to nothing and every affected
 * card falls back to [DEFAULT_CARD_ACCENT] — which is precisely why the phone froze them. Change a
 * VALUE when the tokens move; never add, remove or rename a key. Two are deliberately misnamed:
 * `orange` is the beam yellow and `grey` is the azure.
 *
 * `core/wear-sync-contract.test.ts` reads this literal and fails if it drops a key or drifts from
 * the tokens. That test runs under `yarn test`, which — unlike this module's Gradle job — is not
 * path-filtered, so it fires even on a PR that touches only the phone.
 */
private val NAMED_CARD_COLORS: Map<String, Rgb> = mapOf(
    "blue" to Rgb(0x0C, 0x3C, 0x84),
    "red" to Rgb(0xE4, 0x24, 0x24),
    "green" to Rgb(0x0C, 0x84, 0x3C),
    "orange" to Rgb(0xFC, 0xCC, 0x0C),
    "grey" to Rgb(0x0C, 0x84, 0xCC),
    "gray" to Rgb(0x0C, 0x84, 0xCC),
)

/**
 * Parses a `#RGB` or `#RRGGBB` hex string (with or without the `#`) into an [Rgb], or `null` if it
 * is not valid hex. The `#RGB` short form is accepted because `Brands.kt` documents brand colours
 * as `#RRGGBB` **or** `#RGB`.
 */
fun parseHexColor(hex: String): Rgb? {
    val stripped = hex.trim().removePrefix("#")
    val normalized = when (stripped.length) {
        3 -> stripped.map { "$it$it" }.joinToString(separator = "") // #RGB -> #RRGGBB
        6 -> stripped
        else -> return null
    }
    val value = normalized.toLongOrNull(radix = 16) ?: return null
    return Rgb(
        red = ((value shr 16) and 0xFF).toInt(),
        green = ((value shr 8) and 0xFF).toInt(),
        blue = (value and 0xFF).toInt(),
    )
}

/**
 * Resolves a card/brand colour string into an [Rgb], accepting either a named palette key
 * (`blue`, `red`, …) or a hex string, mirroring watchOS's `mapColor`. Returns `null` only for a
 * `null`/blank input so callers can apply the [DEFAULT_CARD_ACCENT] fallback deliberately.
 */
fun resolveCardColor(value: String?): Rgb? {
    val trimmed = value?.trim()
    if (trimmed.isNullOrEmpty()) return null
    NAMED_CARD_COLORS[trimmed.lowercase()]?.let { return it }
    return parseHexColor(trimmed)
}

/**
 * WCAG relative luminance (0 = black, 1 = white), ported verbatim from watchOS
 * `ColorHelpers.relativeLuminance` including the gamma-expansion step.
 */
fun relativeLuminance(rgb: Rgb): Double {
    fun linear(channel: Int): Double {
        val c = channel / 255.0
        return if (c <= 0.03928) c / 12.92 else ((c + 0.055) / 1.055).pow(2.4)
    }
    return 0.2126 * linear(rgb.red) + 0.7152 * linear(rgb.green) + 0.0722 * linear(rgb.blue)
}

/**
 * Whether text on a background of [rgb] should be white. Ports watchOS `shouldUseWhiteText`
 * (threshold 0.4) — AC2 names that function — and agrees with the phone's linear `luminance.ts`
 * decision across the virtual-logo palette and the black/white extremes (verified in `CardVisualsTest`).
 */
fun shouldUseWhiteText(rgb: Rgb): Boolean = relativeLuminance(rgb) < 0.4

/**
 * Near-black colours (e.g. `#000000`) all but disappear on the ink row over the OLED-black ground;
 * the row gives them a hairline border instead. Ports watchOS `isNearBlack` (threshold 0.05).
 */
fun isNearBlack(rgb: Rgb): Boolean = relativeLuminance(rgb) < 0.05

/**
 * One- or two-letter initials for an avatar, ported from watchOS `initials(from:)`: the first
 * letter of each of the first two words, or the first two letters of a single-word name, upper-cased.
 */
fun initials(name: String): String {
    val trimmed = name.trim()
    if (trimmed.isEmpty()) return ""
    val words = trimmed.split(Regex("\\s+")).filter { it.isNotEmpty() }
    return if (words.size >= 2) {
        (words[0].take(1) + words[1].take(1)).uppercase()
    } else {
        trimmed.take(2).uppercase()
    }
}

package com.iferoporefi.myloyaltycards.wear.presentation

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** Verifies the ported colour/initials/contrast helpers (AC2). */
class CardVisualsTest {
    @Test
    fun parseHex_sixDigit() {
        assertEquals(Rgb(0x0C, 0x3C, 0x84), parseHexColor("#0C3C84"))
        assertEquals(Rgb(0x0C, 0x3C, 0x84), parseHexColor("0C3C84"))
    }

    @Test
    fun parseHex_threeDigitExpands() {
        // Brands.kt documents colours as #RRGGBB OR #RGB.
        assertEquals(Rgb(0xAA, 0xBB, 0xCC), parseHexColor("#abc"))
    }

    @Test
    fun parseHex_invalidReturnsNull() {
        assertNull(parseHexColor("xyz"))
        assertNull(parseHexColor("#12"))
        assertNull(parseHexColor("#12345"))
        assertNull(parseHexColor("#GGGGGG"))
    }

    /**
     * The five Cardì card accents (Story 21.2a). The keys are a frozen wire contract, so this
     * test pins the KEY SET as much as the values: a key that stops resolving here renders every
     * card of that colour with [DEFAULT_CARD_ACCENT] on the watch while the phone still paints it
     * correctly.
     */
    @Test
    fun resolveCardColor_namedKeysMapToPalette() {
        assertEquals(Rgb(0x0C, 0x3C, 0x84), resolveCardColor("blue"))
        assertEquals(Rgb(0xE4, 0x24, 0x24), resolveCardColor("red"))
        assertEquals(Rgb(0x0C, 0x84, 0x3C), resolveCardColor("green"))
        // `orange` is the beam YELLOW and `grey` is the AZURE — deliberately misnamed keys.
        assertEquals(Rgb(0xFC, 0xCC, 0x0C), resolveCardColor("orange"))
        assertEquals(Rgb(0x0C, 0x84, 0xCC), resolveCardColor("grey"))
        assertEquals(Rgb(0x0C, 0x84, 0xCC), resolveCardColor("gray"))
    }

    @Test
    fun resolveCardColor_everyWireKeyResolves() {
        // The exact set core/schemas/card.ts CARD_COLOR_KEYS emits onto the wire.
        listOf("blue", "red", "green", "orange", "grey").forEach { key ->
            assertNotNull("wire key '$key' does not resolve on Wear OS", resolveCardColor(key))
        }
    }

    @Test
    fun defaultCardAccent_isThePaletteGreyKey() {
        assertEquals(DEFAULT_CARD_ACCENT, resolveCardColor("grey"))
    }

    @Test
    fun resolveCardColor_isCaseInsensitiveAndAcceptsHex() {
        assertEquals(Rgb(0x0C, 0x3C, 0x84), resolveCardColor("BLUE"))
        assertEquals(Rgb(0xFF, 0x00, 0x00), resolveCardColor("#FF0000"))
    }

    @Test
    fun resolveCardColor_nullBlankOrUnparseableReturnsNull() {
        assertNull(resolveCardColor(null))
        assertNull(resolveCardColor(""))
        assertNull(resolveCardColor("   "))
        assertNull(resolveCardColor("not-a-colour"))
    }

    @Test
    fun luminanceAndContrastExtremes() {
        assertEquals(0.0, relativeLuminance(Rgb(0, 0, 0)), 1e-9)
        assertTrue(relativeLuminance(Rgb(255, 255, 255)) > 0.99)
        assertTrue(shouldUseWhiteText(Rgb(0, 0, 0)))
        assertFalse(shouldUseWhiteText(Rgb(255, 255, 255)))
        assertTrue(isNearBlack(Rgb(0, 0, 0)))
        assertFalse(isNearBlack(Rgb(255, 255, 255)))
        assertFalse(isNearBlack(Rgb(0x0C, 0x84, 0xCC))) // azure, comfortably clear at 0.209
    }

    /**
     * ⚠️ A REAL BEHAVIOUR CHANGE FROM STORY 21.2a, PINNED SO IT CANNOT MOVE UNNOTICED.
     *
     * The Cardì deep blue lands at luminance **0.04976** — 0.00024 below the 0.05
     * [isNearBlack] threshold — where the retired `#1A73E8` sat at 0.183. So a deep-blue custom
     * card now draws the hairline border [CardRow] gives near-black avatars on the ink row over the
     * OLED-black ground, and the other four accents do not.
     *
     * That is the RIGHT outcome: at that luminance the avatar genuinely does recede into the
     * background, which is the whole reason the hairline exists. But the margin is 0.5% of the
     * threshold, so a later tweak to either the hex or the threshold flips it in silence. This
     * test is here to make that flip loud.
     */
    @Test
    fun deepBlueAccent_sitsJustInsideTheNearBlackThreshold() {
        val deepBlue = Rgb(0x0C, 0x3C, 0x84)

        assertEquals(0.04976, relativeLuminance(deepBlue), 1e-5)
        assertTrue("the deep blue accent should take the near-black hairline", isNearBlack(deepBlue))

        // It is the ONLY accent that does — a second one crossing over would mean the palette,
        // not just this colour, had drifted dark.
        listOf(
            Rgb(0xE4, 0x24, 0x24), Rgb(0x0C, 0x84, 0x3C),
            Rgb(0xFC, 0xCC, 0x0C), Rgb(0x0C, 0x84, 0xCC),
        ).forEach { assertFalse("unexpected near-black accent: \$it", isNearBlack(it)) }
    }

    @Test
    fun contrastDecisionMatchesPhoneLinearFormulaOnPalette() {
        // AC2/Task 2: the ported gamma-WCAG decision (threshold 0.4) agrees with the phone's
        // linear luminance.ts decision (threshold 0.5) across the virtual-logo palette + extremes,
        // so choosing the watchOS function does not diverge visibly from the phone.
        val palette = listOf(
            Rgb(0x0C, 0x3C, 0x84), Rgb(0xE4, 0x24, 0x24), Rgb(0x0C, 0x84, 0x3C),
            Rgb(0xFC, 0xCC, 0x0C), Rgb(0x0C, 0x84, 0xCC), Rgb(0, 0, 0), Rgb(255, 255, 255),
        )
        palette.forEach { rgb ->
            val phoneWantsWhite = phoneLinearLuminance(rgb) < 0.5
            assertEquals("contrast decision disagrees for $rgb", phoneWantsWhite, shouldUseWhiteText(rgb))
        }
    }

    @Test
    fun initials_matchesWatchOsRules() {
        assertEquals("LB", initials("Local Bakery"))
        assertEquals("ES", initials("Esselunga"))
        assertEquals("A", initials("a"))
        assertEquals("", initials(""))
        assertEquals("", initials("   "))
        assertEquals("FB", initials("  Foo   Bar  ")) // collapses runs of whitespace
        assertEquals("X", initials("X"))
    }

    /** The phone's simplified linear luminance (`shared/theme/luminance.ts` `getLuminance`). */
    private fun phoneLinearLuminance(rgb: Rgb): Double =
        (0.2126 * rgb.red + 0.7152 * rgb.green + 0.0722 * rgb.blue) / 255.0
}

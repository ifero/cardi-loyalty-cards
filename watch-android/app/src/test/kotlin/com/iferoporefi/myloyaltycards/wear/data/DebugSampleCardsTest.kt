package com.iferoporefi.myloyaltycards.wear.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The store-screenshot demo seed (Story 24.6).
 *
 * The flag swaps the set, and the demo set holds no test fixture name and no catalogue brand
 * except Esselunga and IKEA (decision 2 as revised on 2026-11-13), and its EAN-13 and EAN-8 values
 * carry GS1's restricted-circulation prefix `20`. That the flag is
 * off by default is pinned in `test/wear-demo-seed.test.ts`, not here: these tests also run in a
 * screenshot session's `-PwearDemoSeed=true` invocation.
 * That the release build type never seeds is pinned on two levels: `BuildConfig.WEAR_DEMO_SEED`
 * is forced to `false` for `release` in `app/build.gradle.kts`, and the seeder is reachable only
 * from a `BuildConfig.DEBUG` branch; `test/wear-demo-seed.test.ts` reads both from source.
 */
class DebugSampleCardsTest {
    @Test
    fun flagOn_seedsTheDemoSet() {
        assertSame(DebugSampleCards.DEMO, DebugSampleCards.forSeed(demo = true))
    }

    @Test
    fun flagOff_seedsTodaysFixtures() {
        assertSame(DebugSampleCards.CARDS, DebugSampleCards.forSeed(demo = false))
    }

    @Test
    fun demoSet_hasNoFixtureNames_andOnlyTheTwoApprovedBrands() {
        assertTrue(DebugSampleCards.DEMO.size >= 4)
        DebugSampleCards.DEMO.forEach { card ->
            assertFalse(card.name, card.name.contains("(unsupported)"))
            assertFalse(card.name, card.name.contains("(invalid)"))
            assertTrue(card.name, card.brandId == null || card.brandId in setOf("esselunga", "ikea"))
        }
        assertEquals(setOf("esselunga", "ikea"), DebugSampleCards.DEMO.mapNotNull { it.brandId }.toSet())
        assertTrue(DebugSampleCards.DEMO.none { demo -> DebugSampleCards.CARDS.any { it.id == demo.id } })
    }

    @Test
    fun demoSet_usesOnlyTheSixAppFormats_withValidCheckDigits() {
        val appFormats = setOf("EAN13", "EAN8", "UPCA", "CODE128", "CODE39", "QR")
        DebugSampleCards.DEMO.forEach { card ->
            val format = requireNotNull(card.barcodeFormat)
            val value = requireNotNull(card.barcodeValue)
            assertTrue(format, format in appFormats)
            if (format == "EAN13" || format == "EAN8") {
                assertTrue(value, value.startsWith("20"))
                assertEquals(value, gs1CheckDigit(value.dropLast(1)), value.last().digitToInt())
            }
        }
    }

    private fun gs1CheckDigit(body: String): Int {
        // GS1: weight 3 on the digit nearest the check digit, alternating with 1 leftwards.
        val sum = body.reversed().mapIndexed { i, c -> c.digitToInt() * if (i % 2 == 0) 3 else 1 }.sum()
        return (10 - sum % 10) % 10
    }
}

package com.iferoporefi.myloyaltycards.wear.barcode

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The module plan (Story 16.38): whole-pixel modules sized against the symbol, bars across the free
 * cross axis, quiet zones in the symbology's ratio with a 4-module floor, and on round the largest
 * module whose box fits the real screen circle with the bars at least half the symbol's width tall.
 *
 * Profiles are the real Wear sizes at density 2: round Ø192/227/240 dp (384/454/480 px) and the
 * 180 dp (360 px) square. Symbol widths come from the real generator, so the plan is tested against
 * what will actually be drawn.
 */
class BarcodeLayoutMetricsTest {
    private val generator = WearBarcodeGenerator()

    private data class Profile(val name: String, val sizePx: Int, val isRound: Boolean)

    private val round384 = Profile("round 192 dp", 384, isRound = true)
    private val round454 = Profile("round 227 dp", 454, isRound = true)
    private val round480 = Profile("round 240 dp", 480, isRound = true)
    private val square360 = Profile("square 180 dp", 360, isRound = false)
    private val profiles = listOf(round384, round454, round480, square360)

    private val values = mapOf(
        "EAN13" to "5901234123457",
        "EAN8" to "96385074",
        "UPCA" to "012345678905",
        "CODE39" to "CODE-39",
        "CODE128" to "ABC-1234",
        "QR" to "https://example.com",
    )

    /**
     * A long alphanumeric Code 128 (no digit runs, so no Code C compaction): 310 modules, about as long
     * as fits the 360 px square at 1 px with its quiet zones, and too long for the round floor at 2 px.
     */
    private val longCode128 = "LOYALTY-CARD-ABCDEFGHIJKL"

    /** Too long for 1 px per module plus 4-module quiet zones on any profile (≥ 480 + 8 modules). */
    private val tooLong = mapOf(
        "CODE128" to "LOYALTY-CARD-ABCDEFGHIJKLMNOPQRSTUVWXYZ-ABCDEFGHIJKL", // 51 chars, 596 modules
        "CODE39" to "LOYALTY-CARD-ABCDEFGHIJKLMNOPQRSTUVWXYZ", // 39 chars, 532 modules
    )

    private fun units(value: String, format: String): Int =
        (generator.measure(value, format) as BarcodeResult.Success).matrix.width

    private fun plan(
        profile: Profile,
        format: String,
        value: String = values.getValue(format),
        showsTitle: Boolean = true,
        showsValueLabel: Boolean = true,
        fontScale: Float = 1f,
    ) = BarcodeLayoutMetrics.make(
        screenWidthPx = profile.sizePx,
        screenHeightPx = profile.sizePx,
        density = DENSITY,
        fontScale = fontScale,
        isRound = profile.isRound,
        isQr = BarcodeFormats.isQr(format),
        symbolUnits = units(value, format),
        quietZone = BarcodeFormats.quietZone(format),
        showsTitle = showsTitle,
        showsValueLabel = showsValueLabel,
    )

    private fun assertNotClipped(profile: Profile, m: BarcodeLayoutMetrics, label: String) {
        assertTrue("$label: drawn", m.canRender)
        assertTrue("$label: leading quiet zone ${m.leadingQuietPx} ≥ 0", m.leadingQuietPx >= 0)
        assertTrue("$label: trailing quiet zone ${m.trailingQuietPx} ≥ 0", m.trailingQuietPx >= 0)
        if (!m.isQr) {
            // QR's quiet zone is inside its matrix; a linear symbol's is this white space.
            val floorPx = BarcodeLayoutMetrics.MIN_QUIET_ZONE_MODULES * m.modulePx
            assertTrue("$label: leading ${m.leadingQuietPx} px ≥ 4 modules", m.leadingQuietPx >= floorPx)
            assertTrue("$label: trailing ${m.trailingQuietPx} px ≥ 4 modules", m.trailingQuietPx >= floorPx)
        }
        assertTrue("$label: box fits the screen width", m.boxWidthPx <= profile.sizePx)
        assertTrue("$label: box fits the screen height", m.boxHeightPx <= profile.sizePx)
        if (profile.isRound) {
            val diagonalSq = m.boxWidthPx.toLong() * m.boxWidthPx + m.boxHeightPx.toLong() * m.boxHeightPx
            val diameterSq = profile.sizePx.toLong() * profile.sizePx
            assertTrue("$label: box ${m.boxWidthPx}×${m.boxHeightPx} fits Ø${profile.sizePx}", diagonalSq <= diameterSq)
        }
    }

    // --- I/O matrix: round 384 px, EAN-13 -------------------------------------------------------

    @Test
    fun round384_ean13_isAtLeast2pxPerModule_insideTheCircle_barAboveFloor() {
        val m = plan(round384, "EAN13")
        assertEquals(95, m.symbolUnits)
        assertTrue("module ${m.modulePx}px ≥ 2", m.modulePx >= 2)
        assertTrue("bar ${m.barHeightPx} ≥ half the symbol width ${m.symbolWidthPx}", m.barHeightPx * 2 >= m.symbolWidthPx)
        assertNotClipped(round384, m, "round 384 EAN-13")
    }

    @Test
    fun roundProfiles_linear_keepTheBarsAboveTheFloor() {
        for (profile in listOf(round384, round454, round480)) {
            for (format in listOf("EAN13", "EAN8", "UPCA", "CODE39", "CODE128")) {
                val m = plan(profile, format)
                val label = "${profile.name} $format"
                assertTrue("$label: bar ${m.barHeightPx} ≥ floor ${m.barHeightFloorPx}", m.barHeightPx >= m.barHeightFloorPx)
                assertTrue("$label: floor is half the symbol width", m.barHeightFloorPx * 2 >= m.symbolWidthPx)
                assertNotClipped(profile, m, label)
            }
        }
    }

    // --- Pinned modules: the device-log values, not re-derived from the solver's formula ----------

    @Test
    fun pinnedModules_perProfile() {
        // Measured on the API 34 AVDs (BarcodeGeometry log, Story 16.38): round 384 and square 360.
        assertEquals("round 384 EAN-13", 3, plan(round384, "EAN13").modulePx)
        assertEquals("round 384 QR", 6, plan(round384, "QR").modulePx)
        assertEquals("square 360 EAN-13", 3, plan(square360, "EAN13").modulePx)
        assertEquals("square 360 QR", 8, plan(square360, "QR").modulePx)
        assertEquals("round 454 EAN-13", 3, plan(round454, "EAN13").modulePx)
        assertEquals("round 454 QR", 8, plan(round454, "QR").modulePx)
        assertEquals("round 480 EAN-13", 3, plan(round480, "EAN13").modulePx)
        assertEquals("round 480 QR", 9, plan(round480, "QR").modulePx)
        // One module more does not fit the round 384 EAN-13: 4 × (95 + 8) = 412 px > 384 px.
        assertTrue(4 * (95 + 8) > 384)
    }

    @Test
    fun pinnedPlan_round384Ean13_matchesTheDeviceLog() {
        // Device log: 285×147 px symbol, 12/12 px quiet zone (4/4 modules), box 309×227, floor 143.
        val m = plan(round384, "EAN13")
        assertEquals(285, m.symbolWidthPx)
        assertEquals(147, m.barHeightPx)
        assertEquals(12, m.leadingQuietPx)
        assertEquals(12, m.trailingQuietPx)
        assertEquals(309, m.boxWidthPx)
        assertEquals(227, m.boxHeightPx)
        assertEquals(143, m.barHeightFloorPx)
    }

    @Test
    fun pinnedPlan_square360Ean13_matchesTheDeviceLog() {
        // Device log: 285×280 px symbol, 45/30 px quiet zone (15/10 modules).
        val m = plan(square360, "EAN13")
        assertEquals(285, m.symbolWidthPx)
        assertEquals(280, m.barHeightPx)
        assertEquals(45, m.leadingQuietPx)
        assertEquals(30, m.trailingQuietPx)
    }

    // --- I/O matrix: square 360 px --------------------------------------------------------------

    @Test
    fun square360_ean13_isAtLeast3pxPerModule_andBarsSpanTheFreeHeight() {
        val m = plan(square360, "EAN13")
        assertTrue("module ${m.modulePx}px ≥ 3", m.modulePx >= 3)
        assertEquals("bars span the height the title and value leave", 360 - m.headerPx - m.footerPx, m.barHeightPx)
        assertEquals("box is the full screen width", 360, m.boxWidthPx)
        assertNotClipped(square360, m, "square 360 EAN-13")
    }

    @Test
    fun square_moduleIsSizedAgainstTheSymbolPlusTheMinimumQuietZoneOnly() {
        for (format in listOf("EAN13", "EAN8", "UPCA", "CODE39", "CODE128")) {
            val m = plan(square360, format)
            assertEquals("$format module", 360 / (m.symbolUnits + 8), m.modulePx)
        }
    }

    // --- I/O matrix: long Code 128 -------------------------------------------------------------

    @Test
    fun longCode128_onASmallRound_isTheLargestWholeModule_withAtLeast4ModuleQuietZones() {
        for (profile in profiles) {
            val m = plan(profile, "CODE128", value = longCode128)
            val label = "${profile.name} long Code 128 (${m.symbolUnits} modules)"
            assertEquals("$label: symbol length", 310, m.symbolUnits)
            assertTrue("$label: ≥ 1 px", m.modulePx >= 1)
            assertTrue("$label: leading ≥ 4 modules", m.leadingQuietModules >= 4)
            assertTrue("$label: trailing ≥ 4 modules", m.trailingQuietModules >= 4)
            assertNotClipped(profile, m, label)
        }
    }

    // --- Quiet zones ---------------------------------------------------------------------------

    @Test
    fun quietZones_neverBelow4ModulesPerSide_andFollowTheSymbologyRatio() {
        for (profile in profiles) {
            for (format in listOf("EAN13", "EAN8", "UPCA", "CODE39", "CODE128")) {
                val m = plan(profile, format)
                val label = "${profile.name} $format"
                val floorPx = BarcodeLayoutMetrics.MIN_QUIET_ZONE_MODULES * m.modulePx
                assertTrue("$label: leading ${m.leadingQuietPx} px ≥ 4·${m.modulePx}", m.leadingQuietPx >= floorPx)
                assertTrue("$label: trailing ${m.trailingQuietPx} px ≥ 4·${m.modulePx}", m.trailingQuietPx >= floorPx)
                assertTrue("$label: trailing ${m.trailingQuietPx} px ≥ 0", m.trailingQuietPx >= 0)
            }
        }
    }

    @Test
    fun quietZones_splitTheLeftoverInTheSymbologyRatio_whereTheFloorDoesNotBind() {
        val ratios = mapOf("EAN13" to (11 to 7), "EAN8" to (7 to 7), "UPCA" to (9 to 9), "CODE39" to (10 to 10), "CODE128" to (10 to 10))
        val checked = mutableSetOf<String>()
        for (profile in profiles) {
            for ((format, ratio) in ratios) {
                val m = plan(profile, format)
                val label = "${profile.name} $format"
                val floorPx = BarcodeLayoutMetrics.MIN_QUIET_ZONE_MODULES * m.modulePx
                if (m.leadingQuietPx == floorPx || m.trailingQuietPx == floorPx) continue
                val leftover = m.leadingQuietPx + m.trailingQuietPx
                // The leftover split in the ratio, rounded down on the leading side.
                val expected = leftover * ratio.first / (ratio.first + ratio.second)
                assertEquals("$label: leading in ${ratio.first}:${ratio.second}", expected, m.leadingQuietPx)
                checked += label
            }
        }
        // Where the floor binds the split is clamped instead; these plans leave room for the ratio,
        // so the 11:7, 9:9, 7:7 and 10:10 splits are each exercised.
        assertTrue(checked.toString(), checked.containsAll(EXPECTED_RATIO_PLANS))
    }

    // --- I/O matrix: QR --------------------------------------------------------------------------

    @Test
    fun qr_isSquare_integerScaled_andInsideTheCircleOnRound() {
        for (profile in profiles) {
            val m = plan(profile, "QR")
            val label = "${profile.name} QR"
            assertEquals("$label: square", m.symbolWidthPx, m.barHeightPx)
            assertEquals("$label: integer multiple of its matrix", m.modulePx * m.symbolUnits, m.symbolWidthPx)
            assertNotClipped(profile, m, label)
        }
        val square = plan(square360, "QR")
        assertEquals(
            "square QR is the largest multiple of the free square",
            (360 - square.headerPx - square.footerPx) / square.symbolUnits,
            square.modulePx,
        )
    }

    // --- I/O matrix: title or value off -------------------------------------------------------

    @Test
    fun valueOff_freedHeightGoesToTheBarsOnSquare() {
        val withValue = plan(square360, "EAN13")
        val withoutValue = plan(square360, "EAN13", showsValueLabel = false)
        assertEquals(0, withoutValue.footerPx)
        assertEquals(withValue.barHeightPx + withValue.footerPx, withoutValue.barHeightPx)
    }

    @Test
    fun titleAndValueOff_freedHeightGoesToTheRoundModuleOrBars() {
        for (profile in listOf(round384, round454, round480)) {
            for (format in listOf("EAN13", "CODE128", "QR")) {
                val withChrome = plan(profile, format)
                val bare = plan(profile, format, showsTitle = false, showsValueLabel = false)
                assertEquals(0, bare.headerPx)
                assertEquals(0, bare.footerPx)
                assertTrue(
                    "${profile.name} $format: a bare box gets a larger module or taller bars",
                    bare.modulePx > withChrome.modulePx ||
                        (bare.modulePx == withChrome.modulePx && bare.barHeightPx > withChrome.barHeightPx),
                )
                assertNotClipped(profile, bare, "${profile.name} $format bare")
            }
        }
    }

    // --- No clipping anywhere ------------------------------------------------------------------

    @Test
    fun everyFormat_onEveryProfile_isNeverClipped() {
        for (profile in profiles) {
            for (format in values.keys) {
                for (showsValue in listOf(true, false)) {
                    val m = plan(profile, format, showsValueLabel = showsValue)
                    assertNotClipped(profile, m, "${profile.name} $format value=$showsValue")
                }
            }
        }
    }

    // --- I/O matrix: too long to draw ---------------------------------------------------------

    @Test
    fun tooLongCode128AndCode39_cannotRender_onEveryProfile() {
        for (profile in profiles) {
            for ((format, value) in tooLong) {
                val m = plan(profile, format, value = value)
                val label = "${profile.name} $format (${m.symbolUnits} modules)"
                assertTrue("$label: wider than 1 px allows", m.symbolUnits + 8 > profile.sizePx)
                assertFalse("$label: not drawn", m.canRender)
                assertEquals("$label: no module", 0, m.modulePx)
                assertEquals("$label: no symbol", 0, m.symbolWidthPx)
                assertEquals("$label: no quiet zone", 0, m.leadingQuietPx + m.trailingQuietPx)
                assertTrue("$label: title kept", m.headerPx > 0)
                assertTrue("$label: a free area for the value", m.boxWidthPx > 0 && m.barHeightPx > 0)
                assertTrue("$label: free area fits the width", m.boxWidthPx <= profile.sizePx)
                assertTrue("$label: free area fits the height", m.boxHeightPx <= profile.sizePx)
                if (profile.isRound) {
                    val diagonalSq = m.boxWidthPx.toLong() * m.boxWidthPx + m.boxHeightPx.toLong() * m.boxHeightPx
                    assertTrue("$label: free area inside the circle", diagonalSq <= profile.sizePx.toLong() * profile.sizePx)
                }
            }
        }
    }

    @Test
    fun square_canRender_exactlyWhenTheSymbolPlus8ModulesFitsAt1px() {
        val ok = BarcodeLayoutMetrics.make(360, 360, DENSITY, 1f, false, false, 352, BarcodeQuietZone(10, 10), true, true)
        assertTrue(ok.canRender)
        assertEquals(1, ok.modulePx)
        assertEquals(4, ok.leadingQuietPx)
        assertEquals(4, ok.trailingQuietPx)
        val tooLong = BarcodeLayoutMetrics.make(360, 360, DENSITY, 1f, false, false, 353, BarcodeQuietZone(10, 10), true, true)
        assertFalse(tooLong.canRender)
    }

    @Test
    fun round_canRender_whileAModuleLeavesABar_evenBelowTheFloor() {
        // Long Code 128 (310 modules) on round 384: no module meets the bar floor, but 1 px leaves a bar.
        val m = plan(round384, "CODE128", value = longCode128)
        assertTrue(m.canRender)
        assertEquals(1, m.modulePx)
        assertEquals("no floor met", 0, m.barHeightFloorPx)
        assertTrue(m.barHeightPx >= 1)
    }

    // --- Font scale -------------------------------------------------------------------------

    @Test
    fun textRows_scaleWithTheFontScale_andStayUnclipped() {
        val normal = plan(round384, "EAN13")
        val large = plan(round384, "EAN13", fontScale = 1.5f)
        // Title 20 dp × 1.5 + 4 dp = 34 dp = 68 px; value 12 dp × 1.5 + 4 dp = 22 dp = 44 px.
        assertEquals(68, large.headerPx)
        assertEquals(44, large.footerPx)
        assertTrue(large.headerPx > normal.headerPx && large.footerPx > normal.footerPx)
        for (profile in profiles) {
            for (format in values.keys) {
                assertNotClipped(profile, plan(profile, format, fontScale = 1.5f), "${profile.name} $format @1.5")
            }
        }
    }

    private companion object {
        const val DENSITY = 2f
        /** The square screen leaves the ratio room on these; on round the box is the chord at the
         *  symbol plus its floor, so the floor binds there. */
        val EXPECTED_RATIO_PLANS = setOf(
            "square 180 dp EAN13", // 11:7
            "square 180 dp EAN8", // 7:7
            "square 180 dp UPCA", // 9:9
            "square 180 dp CODE39", // 10:10
        )
    }
}

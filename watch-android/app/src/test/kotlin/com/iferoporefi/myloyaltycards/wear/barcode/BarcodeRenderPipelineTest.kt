package com.iferoporefi.myloyaltycards.wear.barcode

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The measure → plan → encode pipeline end to end (Story 16.38): the matrix the screen draws is
 * exactly the symbol the plan solved — same width, same height, the same narrowest element — and a
 * symbol too long to draw is never encoded.
 */
class BarcodeRenderPipelineTest {
    private val generator = WearBarcodeGenerator()

    private data class Profile(val name: String, val sizePx: Int, val isRound: Boolean)

    private val profiles = listOf(
        Profile("round 192 dp", 384, isRound = true),
        Profile("round 227 dp", 454, isRound = true),
        Profile("round 240 dp", 480, isRound = true),
        Profile("square 180 dp", 360, isRound = false),
    )

    private val values = mapOf(
        "EAN13" to "5901234123457",
        "EAN8" to "96385074",
        "UPCA" to "012345678905",
        "CODE39" to "CODE-39",
        "CODE128" to "ABC-1234",
        "QR" to "https://example.com",
    )

    private fun request(profile: Profile, format: String, value: String? = values.getValue(format)) =
        BarcodeRenderRequest(
            value = value,
            format = format,
            screenWidthPx = profile.sizePx,
            screenHeightPx = profile.sizePx,
            density = 2f,
            fontScale = 1f,
            isRound = profile.isRound,
            showsTitle = true,
            showsValueLabel = true,
        )

    @Test
    fun drawnMatrix_isExactlyThePlannedSymbol() {
        for (profile in profiles) {
            for (format in values.keys) {
                val label = "${profile.name} $format"
                val render = BarcodeRenderPipeline.render(generator, request(profile, format))
                assertTrue("$label: drawn", render is BarcodeRender.Drawn)
                val (m, matrix) = render as BarcodeRender.Drawn
                assertEquals("$label: width", m.symbolWidthPx, matrix.width)
                assertEquals("$label: height", m.barHeightPx, matrix.height)
                assertEquals("$label: whole modules", m.modulePx * m.symbolUnits, matrix.width)
                if (!m.isQr) {
                    assertEquals("$label: narrowest element is the module", m.modulePx, matrix.narrowestElementPx())
                }
            }
        }
    }

    @Test
    fun ean13_whiteEdgesAreThePlansQuietZone_inTheSymbologyRatio() {
        // The matrix carries no margin (it starts and ends on a bar): the white either side is the
        // plan's quiet zone, which the screen places as white space.
        val render = BarcodeRenderPipeline.render(generator, request(profiles.last(), "EAN13")) as BarcodeRender.Drawn
        val m = render.metrics
        val midRow = render.matrix.height / 2
        assertTrue("starts on a bar", render.matrix[0, midRow])
        assertTrue("ends on a bar", render.matrix[render.matrix.width - 1, midRow])
        assertEquals("square 360: 45 px leading (15 modules)", 45, m.leadingQuietPx)
        assertEquals("square 360: 30 px trailing (10 modules)", 30, m.trailingQuietPx)
        assertEquals(m.boxWidthPx, m.leadingQuietPx + render.matrix.width + m.trailingQuietPx)
    }

    @Test
    fun tooLong_isValueOnly_neverEncodedNorAnError() {
        val tooLong = mapOf(
            "CODE128" to "LOYALTY-CARD-ABCDEFGHIJKLMNOPQRSTUVWXYZ-ABCDEFGHIJKL",
            "CODE39" to "LOYALTY-CARD-ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        )
        for (profile in profiles) {
            for ((format, value) in tooLong) {
                val render = BarcodeRenderPipeline.render(generator, request(profile, format, value))
                assertTrue("${profile.name} $format: value only", render is BarcodeRender.ValueOnly)
                assertFalse((render as BarcodeRender.ValueOnly).metrics.canRender)
            }
        }
    }

    @Test
    fun badValueOrFormat_isTheErrorScreen() {
        val square = profiles.last()
        assertEquals(
            BarcodeRender.Failed(BarcodeResult.InvalidValue),
            BarcodeRenderPipeline.render(generator, request(square, "EAN13", "5901234123450")),
        )
        assertEquals(
            BarcodeRender.Failed(BarcodeResult.UnsupportedFormat),
            BarcodeRenderPipeline.render(generator, request(square, "AZTEC", "123")),
        )
    }
}

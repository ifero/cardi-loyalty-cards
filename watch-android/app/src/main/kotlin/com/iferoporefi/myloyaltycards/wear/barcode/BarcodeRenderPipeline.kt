package com.iferoporefi.myloyaltycards.wear.barcode

import com.google.zxing.common.BitMatrix

/**
 * Everything the module plan and the encode depend on: the card's symbol and the real screen it is
 * drawn on. Pure values, so the barcode screen keys its render on it and a JVM test can build one.
 *
 * @property screenWidthPx the whole screen's width in px — not a scaffold-padded box (Story 16.38).
 * @property screenHeightPx the whole screen's height in px.
 * @property density device pixels per dp.
 * @property fontScale the user's font scale; the title and value rows are sp text.
 * @property isRound whether the display is round.
 */
data class BarcodeRenderRequest(
    val value: String?,
    val format: String?,
    val screenWidthPx: Int,
    val screenHeightPx: Int,
    val density: Float,
    val fontScale: Float,
    val isRound: Boolean,
    val showsTitle: Boolean,
    val showsValueLabel: Boolean,
)

/** What the barcode screen draws for one card. */
sealed interface BarcodeRender {
    /** A symbol encoded at exactly the plan's size: [matrix] is [metrics]' symbol, quiet zone excluded
     *  for a linear code (the layout places it as white space). */
    data class Drawn(val metrics: BarcodeLayoutMetrics, val matrix: BitMatrix) : BarcodeRender

    /** The symbol is too long for 1 px per module ([BarcodeLayoutMetrics.canRender] false): nothing is
     *  encoded, and the value is shown as text in the plan's free area. Not an error. */
    data class ValueOnly(val metrics: BarcodeLayoutMetrics) : BarcodeRender

    /** The format or the value cannot be encoded at all — the error screen. */
    data class Failed(val result: BarcodeResult) : BarcodeRender
}

/**
 * The barcode's pure **measure → plan → encode** pipeline (Story 16.38): measures the symbol's modules,
 * solves the [BarcodeLayoutMetrics] module plan against the real screen, and encodes at exactly the
 * planned size. No Android types, so a JVM test drives it end to end and checks the plan and the drawn
 * matrix together; the barcode screen only turns the matrix into a bitmap and lays it out.
 */
object BarcodeRenderPipeline {
    fun render(generator: WearBarcodeGenerator, request: BarcodeRenderRequest): BarcodeRender {
        val measured = generator.measure(request.value, request.format)
        if (measured !is BarcodeResult.Success) return BarcodeRender.Failed(measured)
        val metrics = BarcodeLayoutMetrics.make(
            screenWidthPx = request.screenWidthPx,
            screenHeightPx = request.screenHeightPx,
            density = request.density,
            fontScale = request.fontScale,
            isRound = request.isRound,
            isQr = BarcodeFormats.isQr(request.format),
            symbolUnits = measured.matrix.width,
            quietZone = BarcodeFormats.quietZone(request.format),
            showsTitle = request.showsTitle,
            showsValueLabel = request.showsValueLabel,
        )
        if (!metrics.canRender) return BarcodeRender.ValueOnly(metrics)
        return when (
            val result = generator.generate(request.value, request.format, metrics.symbolWidthPx, metrics.barHeightPx)
        ) {
            is BarcodeResult.Success -> BarcodeRender.Drawn(metrics, result.matrix)
            else -> BarcodeRender.Failed(result)
        }
    }
}

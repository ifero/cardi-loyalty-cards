package com.iferoporefi.myloyaltycards.wear.barcode

import androidx.compose.runtime.Stable
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.MultiFormatWriter
import com.google.zxing.WriterException
import com.google.zxing.common.BitMatrix
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel

/**
 * Outcome of a barcode-generation request.
 *
 * The two error arms are deliberately distinct because their user remedies differ (Task 4): an
 * [UnsupportedFormat] card must be re-added on the phone, whereas an [InvalidValue] means the stored
 * barcode itself is wrong. Neither is ever a blank screen or a silently-wrong symbol (AC2).
 */
sealed interface BarcodeResult {
    /** A rendered symbol as a pure-JVM [BitMatrix] — `true` = a black module, `false` = white. */
    data class Success(val matrix: BitMatrix) : BarcodeResult

    /** The format string is not one of the six known symbologies (unknown, empty, or blank). */
    data object UnsupportedFormat : BarcodeResult

    /** The value is empty or invalid for its format — e.g. a bad EAN-13 check digit, or a CODE39
     *  value containing an out-of-charset character. ZXing validates and rejects these for us. */
    data object InvalidValue : BarcodeResult
}

/**
 * Generates scannable barcodes for the app's six formats using ZXing, caching the pure-JVM
 * [BitMatrix] per (value, format, size) so re-opening a card never re-encodes (AC10).
 *
 * ZXing does the encoding maths — deliberately **not** a port of watchOS's 500-line hand-rolled
 * EAN-13/Code128 encoders (`BarcodeGenerator.swift`), which exist only because watchOS ships no
 * barcode library. ZXing computes and validates check digits, so a wrong value fails loudly here
 * rather than producing a plausible-but-unscannable symbol.
 *
 * Every method is pure JVM (no Android types), so it is unit-tested without an emulator. The caller
 * converts a [BarcodeResult.Success] matrix to an `android.graphics.Bitmap` at the Compose edge
 * (see `BarcodeBitmap`), off the main thread.
 *
 * `@Stable`: held for the app's lifetime (stable identity) with no observable mutable public state —
 * the cache is a private implementation detail — so Compose can keep skip-optimisations for
 * composables that take it as a parameter. The annotation is Compose-runtime metadata only, not an
 * Android type, so the JVM unit tests still run without an emulator.
 *
 * @param maxCacheEntries retained-barcode cap; a watch shows one barcode at a time, so a handful
 *   covers re-opens, the cards the pager composes beside it and round/square resizes. Every card
 *   takes two entries — its [measure] and its planned symbol — so the cap counts both.
 */
@Stable
class WearBarcodeGenerator(maxCacheEntries: Int = DEFAULT_CACHE_ENTRIES) {
    private val cache = BarcodeCache<BarcodeResult>(maxCacheEntries)
    private val writer = MultiFormatWriter()

    /**
     * Encodes [value] as [format] into a [width]×[height]-pixel [BitMatrix] with a white background
     * and black bars. Returns a typed error instead of throwing, so the UI always has a state to
     * render.
     *
     * Every module is a whole number of pixels: ZXing draws `⌊width / modules⌋` px per module and
     * centres the remainder. A **linear** symbol carries **no** quiet zone (MARGIN 0, Story 16.38) —
     * request exactly `module × symbolUnits` wide and it fills the width edge to edge, while the
     * layout ([BarcodeLayoutMetrics]) draws the quiet zone as white space around it. A **QR** keeps
     * its own 4-module quiet zone inside the matrix.
     *
     * Runs the encode on the calling thread — call it from a background dispatcher (AC10). The result
     * is memoised, so a second call with the same arguments returns the cached instance without
     * re-encoding.
     */
    fun generate(value: String?, format: String?, width: Int, height: Int): BarcodeResult {
        val zxingFormat = BarcodeFormats.toZxing(format) ?: return BarcodeResult.UnsupportedFormat
        if (value.isNullOrEmpty()) return BarcodeResult.InvalidValue
        if (width <= 0 || height <= 0) return BarcodeResult.InvalidValue

        val key = BarcodeCacheKey(value, zxingFormat.name, width, height)
        return cache.getOrPut(key) { encode(value, zxingFormat, width, height) }
    }

    /**
     * The symbol's size in modules, as a 1-module-per-pixel [BitMatrix] whose `width` is the
     * module count [BarcodeLayoutMetrics.make] solves against (linear: bars and spaces only; QR: the
     * matrix with its quiet zone). The same typed errors as [generate], so a bad value fails here,
     * before any layout. Cached like any other request.
     */
    fun measure(value: String?, format: String?): BarcodeResult = generate(value, format, 1, 1)

    private fun encode(value: String, format: BarcodeFormat, width: Int, height: Int): BarcodeResult =
        try {
            BarcodeResult.Success(writer.encode(value, format, width, height, hintsFor(format)))
        } catch (_: WriterException) {
            // Content too large for the symbology, or otherwise unencodable.
            BarcodeResult.InvalidValue
        } catch (_: IllegalArgumentException) {
            // The 1D writers throw IAE for bad content (wrong length, failed checksum, out-of-charset).
            BarcodeResult.InvalidValue
        }

    /**
     * Encoding hints. QR leaves MARGIN unset, keeping its spec 4-module quiet zone, and adds UTF-8
     * (loyalty QRs are often URLs) and error-correction level M, matching the phone's render options.
     *
     * Linear codes set MARGIN 0. ZXing's 1D default margin (9 modules for UPC/EAN, 10 otherwise) sits
     * in its module divisor, so it competed with the bars for pixels at the same price; without it the
     * module is sized against the symbol alone and the layout gives the quiet zone the leftover, split
     * in the symbology's ratio with a 4-module floor per side (Story 16.38, as watchOS's 16.27).
     */
    private fun hintsFor(format: BarcodeFormat): Map<EncodeHintType, Any> =
        if (format == BarcodeFormat.QR_CODE) {
            mapOf(
                EncodeHintType.CHARACTER_SET to "UTF-8",
                EncodeHintType.ERROR_CORRECTION to ErrorCorrectionLevel.M,
            )
        } else {
            mapOf(EncodeHintType.MARGIN to 0)
        }

    companion object {
        /** Default retained-barcode cap: 8 cards, each a [measure] entry plus its planned symbol. */
        const val DEFAULT_CACHE_ENTRIES = 16
    }
}

/**
 * The narrowest run of same-coloured pixels across the matrix's middle row — the narrowest element a
 * decoder sees, i.e. the drawn module width. Logged by the barcode screen's `BarcodeGeometry` debug
 * line so the module can be measured on a device, and asserted by the tests. 0 for an empty matrix.
 */
internal fun BitMatrix.narrowestElementPx(): Int {
    if (width == 0 || height == 0) return 0
    val row = height / 2
    var narrowest = Int.MAX_VALUE
    var run = 1
    for (x in 1 until width) {
        if (this[x, row] == this[x - 1, row]) {
            run++
        } else {
            narrowest = minOf(narrowest, run)
            run = 1
        }
    }
    return minOf(narrowest, run)
}

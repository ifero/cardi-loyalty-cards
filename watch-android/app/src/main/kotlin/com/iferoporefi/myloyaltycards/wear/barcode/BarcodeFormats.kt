package com.iferoporefi.myloyaltycards.wear.barcode

import com.google.zxing.BarcodeFormat

/**
 * Maps the app's six cross-platform barcode-format strings to ZXing [BarcodeFormat].
 *
 * The strings (`CODE128`, `EAN13`, `EAN8`, `QR`, `CODE39`, `UPCA`) are the **cross-platform
 * contract** defined once in `core/schemas/card.ts` — "Swift/Kotlin use same string values". They
 * are matched here **exactly**, case-normalised the way watchOS's `BarcodeGenerator` normalises
 * (`trimmingCharacters(.whitespacesAndNewlines).uppercased()`), so a value that arrives padded or
 * lower-cased still resolves. Do not translate or alias the strings.
 *
 * Unlike watchOS — whose hand-rolled encoder returns `nil` for EAN8/CODE39/UPCA
 * (`BarcodeGenerator.swift:51-69`), leaving three formats blank on Apple Watch — ZXing covers all
 * six at no extra cost, so this table is complete (Story 10.4, Open Decision 2).
 */
internal object BarcodeFormats {
    /** ZXing's own name for the app's `QR` string; kept as a constant so callers never guess. */
    const val QR: String = "QR"

    /**
     * The ZXing [BarcodeFormat] for [format], or `null` when [format] is not one of the six known
     * symbologies (empty, blank, or unrecognised). A `null` here is an **unsupported-format** error,
     * distinct from a value that is invalid *for* a known format — the two have different user
     * remedies (Task 4).
     */
    fun toZxing(format: String?): BarcodeFormat? = when (normalize(format)) {
        "CODE128" -> BarcodeFormat.CODE_128
        "EAN13" -> BarcodeFormat.EAN_13
        "EAN8" -> BarcodeFormat.EAN_8
        QR -> BarcodeFormat.QR_CODE
        "CODE39" -> BarcodeFormat.CODE_39
        "UPCA" -> BarcodeFormat.UPC_A
        else -> null
    }

    /** Whether [format] is the QR symbology — the branch that drives square-vs-linear layout. */
    fun isQr(format: String?): Boolean = normalize(format) == QR

    /**
     * The quiet zone [format]'s specification asks for, in modules — the **ratio** the layout splits
     * its leftover white space in (Story 16.38), ported from watchOS's `quietZone(for:)`
     * (`BarcodeGenerator.swift`). EAN-13 is the one asymmetric case: 11 leading, 7 trailing. QR's own
     * 4-module quiet zone is part of its matrix, so it gets the symmetric fallback here.
     */
    fun quietZone(format: String?): BarcodeQuietZone = when (normalize(format)) {
        "EAN13" -> BarcodeQuietZone(leading = 11, trailing = 7)
        "EAN8" -> BarcodeQuietZone(leading = 7, trailing = 7)
        "UPCA" -> BarcodeQuietZone(leading = 9, trailing = 9)
        else -> BarcodeQuietZone(leading = 10, trailing = 10)
    }

    /** Trims and upper-cases, mirroring watchOS's format normalisation exactly. */
    private fun normalize(format: String?): String = format?.trim()?.uppercase().orEmpty()
}

/** A symbology's quiet zone in modules, leading (left) and trailing (right). */
data class BarcodeQuietZone(val leading: Int, val trailing: Int) {
    val total: Int
        get() = leading + trailing
}

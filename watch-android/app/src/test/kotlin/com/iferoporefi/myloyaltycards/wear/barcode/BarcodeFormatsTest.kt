package com.iferoporefi.myloyaltycards.wear.barcode

import com.google.zxing.BarcodeFormat
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** The six cross-platform format strings map to the right ZXing formats, case-/space-insensitively. */
class BarcodeFormatsTest {
    @Test
    fun allSixFormatsMap() {
        assertEquals(BarcodeFormat.CODE_128, BarcodeFormats.toZxing("CODE128"))
        assertEquals(BarcodeFormat.EAN_13, BarcodeFormats.toZxing("EAN13"))
        assertEquals(BarcodeFormat.EAN_8, BarcodeFormats.toZxing("EAN8"))
        assertEquals(BarcodeFormat.QR_CODE, BarcodeFormats.toZxing("QR"))
        assertEquals(BarcodeFormat.CODE_39, BarcodeFormats.toZxing("CODE39"))
        assertEquals(BarcodeFormat.UPC_A, BarcodeFormats.toZxing("UPCA"))
    }

    @Test
    fun normalisesLikeWatchOs_trimsAndUppercases() {
        assertEquals(BarcodeFormat.EAN_13, BarcodeFormats.toZxing("  ean13  "))
        assertEquals(BarcodeFormat.QR_CODE, BarcodeFormats.toZxing("qr"))
        assertEquals(BarcodeFormat.UPC_A, BarcodeFormats.toZxing("UpcA"))
    }

    @Test
    fun quietZone_normalisesLikeToZxing() {
        assertEquals(BarcodeQuietZone(leading = 11, trailing = 7), BarcodeFormats.quietZone(" ean13 "))
        assertEquals(BarcodeQuietZone(leading = 7, trailing = 7), BarcodeFormats.quietZone("ean8"))
        assertEquals(BarcodeQuietZone(leading = 9, trailing = 9), BarcodeFormats.quietZone("UpcA "))
        assertEquals(BarcodeQuietZone(leading = 10, trailing = 10), BarcodeFormats.quietZone(" code128"))
    }

    @Test
    fun unknownEmptyOrNullFormat_isNull() {
        assertNull(BarcodeFormats.toZxing("AZTEC")) // real ZXing format, but not one of our six
        assertNull(BarcodeFormats.toZxing("PDF417"))
        assertNull(BarcodeFormats.toZxing(""))
        assertNull(BarcodeFormats.toZxing("   "))
        assertNull(BarcodeFormats.toZxing(null))
    }

    @Test
    fun isQr_matchesOnlyTheQrString() {
        assertTrue(BarcodeFormats.isQr("QR"))
        assertTrue(BarcodeFormats.isQr(" qr "))
        assertFalse(BarcodeFormats.isQr("EAN13"))
        assertFalse(BarcodeFormats.isQr(null))
    }
}

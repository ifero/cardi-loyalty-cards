package com.iferoporefi.myloyaltycards.wear.data

/**
 * Sample cards for the DEBUG-only empty-state seeder.
 *
 * Mirrors watchOS's DEBUG `importSampleCards` (`CardListView.swift`). Every caller is either behind
 * `BuildConfig.DEBUG` (the empty-state seeder in `MainActivity`) or an unused `@Preview`-only function,
 * so R8 strips this object from the release APK either way — the seeder stays debug-only *and*
 * empty-state-gated from the start (watchOS had to retrofit that gating in 9-5).
 *
 * The first three exercise the whole list at a glance: a favourite, a catalogue brand (so the
 * avatar shows the real brand colour + brand-name initials), a never-used card, and an accented
 * name to eyeball the diacritic-insensitive A-Z ordering.
 *
 * The remainder were added for Story 10-4 so the barcode screen can be eyeballed for **every**
 * format ZXing renders (CODE128, EAN8, CODE39 join the EAN13/UPCA/QR above) and for **both** error
 * states — an unsupported format and an invalid value. All barcode values below are real and valid
 * except the two deliberately-broken cards, whose names say so.
 *
 * [DEMO] is the store-screenshot set (Story 24.6): a debug build made with `-PwearDemoSeed=true`
 * seeds it instead of [CARDS] (see [forSeed]). It holds two catalogue brands, Esselunga and IKEA
 * (decision 2 as revised by ifero on 2026-11-13), beside invented shops; every barcode value is
 * made up, and the EAN values use the GS1 restricted-circulation prefix `20`, which no real
 * retailer card carries.
 */
object DebugSampleCards {
    /**
     * The set the debug seeder writes: [DEMO] when the build's demo flag is on, else [CARDS].
     * `demo` is `BuildConfig.WEAR_DEMO_SEED`, which the release build type pins to `false`.
     */
    fun forSeed(demo: Boolean): List<WearCard> = if (demo) DEMO else CARDS

    /** Fictional store-listing cards (Story 24.6). Mirrors the phone and Apple Watch demo set. */
    val DEMO: List<WearCard> = listOf(
        WearCard(
            id = "demo-esselunga",
            name = "Esselunga",
            brandId = "esselunga",
            colorHex = "orange",
            barcodeValue = "2047182903512", // valid EAN-13, GS1 prefix 20 (restricted circulation)
            barcodeFormat = "EAN13",
            usageCount = 14,
            lastUsedAt = "2026-11-12T08:10:00.000Z",
            createdAt = "2026-09-02T09:00:00.000Z",
            isFavorite = true,
        ),
        WearCard(
            id = "demo-verde-mercato",
            name = "Verde Mercato",
            brandId = null,
            colorHex = "green",
            barcodeValue = "2091305748269", // valid EAN-13, prefix 20
            barcodeFormat = "EAN13",
            usageCount = 9,
            lastUsedAt = "2026-11-10T17:30:00.000Z",
            createdAt = "2026-09-05T09:00:00.000Z",
            isFavorite = true,
        ),
        WearCard(
            id = "demo-libreria-pagina",
            name = "Libreria Pagina",
            brandId = null,
            colorHex = "blue",
            barcodeValue = "LP-204816",
            barcodeFormat = "CODE128",
            usageCount = 4,
            lastUsedAt = "2026-11-03T15:00:00.000Z",
            createdAt = "2026-09-12T09:00:00.000Z",
            isFavorite = false,
        ),
        WearCard(
            id = "demo-caffe-lumen",
            name = "Caffè Lumen",
            brandId = null,
            colorHex = "red",
            barcodeValue = "CARDI-DEMO-LUMEN-0427",
            barcodeFormat = "QR",
            usageCount = 6,
            lastUsedAt = "2026-11-08T07:45:00.000Z",
            createdAt = "2026-09-20T09:00:00.000Z",
            isFavorite = false,
        ),
        WearCard(
            id = "demo-palestra-onda",
            name = "Palestra Onda",
            brandId = null,
            colorHex = "grey",
            barcodeValue = "ONDA-0427",
            barcodeFormat = "CODE39",
            usageCount = 2,
            lastUsedAt = "2026-10-28T19:00:00.000Z",
            createdAt = "2026-10-01T09:00:00.000Z",
            isFavorite = false,
        ),
        WearCard(
            id = "demo-ikea",
            name = "IKEA",
            brandId = "ikea",
            colorHex = "blue",
            barcodeValue = "CARDI-DEMO-IKEA-0815", // made up, not an IKEA Family number
            barcodeFormat = "QR",
            usageCount = 8,
            lastUsedAt = "2026-11-09T11:00:00.000Z",
            createdAt = "2026-09-08T09:00:00.000Z",
            isFavorite = false,
        ),
    )

    val CARDS: List<WearCard> = listOf(
        WearCard(
            id = "sample-esselunga",
            name = "Esselunga",
            brandId = "esselunga", // real catalogue slug → brand colour + "ES" from the brand name
            colorHex = "blue",
            barcodeValue = "5901234123457",
            barcodeFormat = "EAN13",
            usageCount = 12,
            lastUsedAt = "2026-08-01T09:00:00.000Z",
            createdAt = "2026-01-10T09:00:00.000Z",
            isFavorite = true,
        ),
        WearCard(
            id = "sample-bakery",
            name = "Local Bakery",
            brandId = null, // custom card → user-picked colour + "LB" from the card name
            colorHex = "red",
            barcodeValue = "012345678905",
            barcodeFormat = "UPCA",
            usageCount = 5,
            lastUsedAt = "2026-07-20T09:00:00.000Z",
            createdAt = "2026-03-15T09:00:00.000Z",
            isFavorite = false,
        ),
        WearCard(
            id = "sample-market",
            name = "Èsselunga Market", // accented leading char: must sort next to "Esselunga"
            brandId = null,
            colorHex = "#0C843C",
            barcodeValue = "https://example.com",
            barcodeFormat = "QR",
            usageCount = 0,
            lastUsedAt = null, // never used → tiers below used cards in `frequent`
            createdAt = "2026-05-01T09:00:00.000Z",
            isFavorite = false,
        ),
        WearCard(
            id = "sample-code128",
            name = "Code128 Store",
            brandId = null,
            colorHex = "orange",
            barcodeValue = "ABC-1234", // Code128 is alphanumeric
            barcodeFormat = "CODE128",
            usageCount = 3,
            lastUsedAt = "2026-07-25T09:00:00.000Z",
            createdAt = "2026-04-01T09:00:00.000Z",
            isFavorite = false,
        ),
        WearCard(
            id = "sample-ean8",
            name = "EAN-8 Kiosk",
            brandId = null,
            colorHex = "green",
            barcodeValue = "96385074", // valid EAN-8 (check digit 4)
            barcodeFormat = "EAN8",
            usageCount = 1,
            lastUsedAt = "2026-07-10T09:00:00.000Z",
            createdAt = "2026-04-05T09:00:00.000Z",
            isFavorite = false,
        ),
        WearCard(
            id = "sample-code39",
            name = "Code39 Club",
            brandId = null,
            colorHex = "grey",
            barcodeValue = "CODE-39", // Code39 charset: A–Z 0–9 and - . $ / + % space
            barcodeFormat = "CODE39",
            usageCount = 0,
            lastUsedAt = null,
            createdAt = "2026-04-06T09:00:00.000Z",
            isFavorite = false,
        ),
        WearCard(
            id = "sample-bad-value",
            name = "Bad Checksum (invalid)", // EAN-13 with a wrong check digit → invalid-value error
            brandId = null,
            colorHex = "red",
            barcodeValue = "5901234123450",
            barcodeFormat = "EAN13",
            usageCount = 0,
            lastUsedAt = null,
            createdAt = "2026-04-07T09:00:00.000Z",
            isFavorite = false,
        ),
        WearCard(
            id = "sample-bad-format",
            name = "Aztec (unsupported)", // not one of the six app formats → unsupported-format error
            brandId = null,
            colorHex = "blue",
            barcodeValue = "anything",
            barcodeFormat = "AZTEC",
            usageCount = 0,
            lastUsedAt = null,
            createdAt = "2026-04-08T09:00:00.000Z",
            isFavorite = false,
        ),
    )
}

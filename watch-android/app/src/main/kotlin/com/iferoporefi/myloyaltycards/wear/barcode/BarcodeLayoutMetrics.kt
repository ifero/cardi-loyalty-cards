package com.iferoporefi.myloyaltycards.wear.barcode

import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

/**
 * The barcode's **module plan**: how many device pixels each module gets, where the symbol sits, and
 * how tall its bars are — Wear's port of watchOS's `WatchBarcodeModulePlan.resolve`
 * (`WatchPresentationLayout.swift`, Story 16.27), and the one place that owns the geometry
 * (Story 16.38).
 *
 * Everything is in **whole device pixels**, because the module width is the only measurement that
 * decides whether a scan succeeds: every 1D decoder normalises against the narrowest element, so one
 * stray pixel on a 2–3 px module is a 30–50 % error (`cardi-watch-grammar.md` §6).
 *
 * The rules, as on watchOS since 16.27:
 * - **The module is sized against the symbol's own modules**, not the symbol plus its spec quiet
 *   zone. Only [MIN_QUIET_ZONE_MODULES] per side is reserved in the divisor; whatever the symbol does
 *   not use becomes quiet zone. On square it is split in the symbology's ratio ([BarcodeQuietZone]),
 *   each side clamped to the floor. On round the box is the chord at `units + 8` modules, so there is
 *   no leftover to split: both sides are exactly the [MIN_QUIET_ZONE_MODULES] floor.
 * - **The bars span the whole cross axis** that the title and value rows leave, and there is no inner
 *   padding: the white screen is the white box.
 * - **The whole screen is used.** The caller passes the real screen size, not a padded one.
 *
 * Wear adds the round screen, which watchOS never has. There the title + bars + value box is inscribed
 * in the real screen circle, `boxWidth² + boxHeight² ≤ D²`, and the solver picks the **largest whole
 * module** whose box still fits with the bars at least [ROUND_BAR_HEIGHT_FLOOR_RATIO] of the symbol's
 * drawn width tall (a common EAN truncation) — a wide, shallow symbol beats a narrow tall one, down to
 * that floor. When no module meets the floor, the largest module that leaves any bar (at least 1 px)
 * is taken, however shallow; no other shallowness limit is enforced.
 *
 * QR keeps its square fill: the largest integer multiple of its matrix (its own 4-module quiet zone
 * included) that fits the free square, or the circle on a round screen.
 *
 * **Too long to draw** ([canRender] false): a linear symbol whose modules plus
 * [MIN_QUIET_ZONE_MODULES] per side do not fit at even 1 px per module (square: `units + 8 > width`;
 * round: no module leaves a bar of at least 1 px inside the circle). Nothing is encoded then; as on
 * watchOS (`canRender`, Story 16.28's "key it in by hand"), the screen shows the value as text in
 * the free area this plan describes ([boxWidthPx] × [barHeightPx]), so the cashier can type it.
 *
 * **For a linear symbol the quiet-zone floor is a guarantee wherever [canRender] holds:** every side
 * then keeps at least [MIN_QUIET_ZONE_MODULES] modules, because the module is only ever chosen so that
 * the symbol plus that floor on both sides fits the box. A QR's 4-module quiet zone is inside its
 * matrix ([symbolWidthPx]), so its outer leftover is only centring and may be smaller. Where
 * [canRender] is false there is no symbol and no quiet zone ([modulePx], [symbolWidthPx] and both
 * quiet zones are 0).
 *
 * The title and value rows are sp text, so their reserved heights scale with the font scale as well
 * as the density.
 *
 * @property canRender whether a symbol is drawn: false when it is too long for 1 px per module.
 * @property modulePx device pixels per module, the same for every element. At least 1 when
 *   [canRender], 0 otherwise.
 * @property symbolUnits modules across the symbol (linear: bars and spaces, no quiet zone; QR: its
 *   matrix including its quiet zone).
 * @property symbolWidthPx the symbol's drawn width, `modulePx × symbolUnits`.
 * @property barHeightPx the symbol's drawn height (equal to [symbolWidthPx] for QR); when [canRender]
 *   is false, the height of the free area the value placeholder takes.
 * @property boxWidthPx the white box's width: the symbol plus its quiet zones. On round it is the
 *   circle's chord at the box's top and bottom edges; the title and value rows are capped to it.
 * @property leadingQuietPx white space left of the symbol inside [boxWidthPx].
 * @property trailingQuietPx white space right of the symbol inside [boxWidthPx].
 * @property headerPx height reserved above the symbol for the title, if shown.
 * @property footerPx height reserved below the symbol for the value, if shown.
 * @property barHeightFloorPx the round bar-height floor the module was solved against (0 elsewhere,
 *   and 0 when no module met it).
 */
data class BarcodeLayoutMetrics(
    val isQr: Boolean,
    val isRound: Boolean,
    val canRender: Boolean,
    val modulePx: Int,
    val symbolUnits: Int,
    val symbolWidthPx: Int,
    val barHeightPx: Int,
    val boxWidthPx: Int,
    val leadingQuietPx: Int,
    val trailingQuietPx: Int,
    val headerPx: Int,
    val footerPx: Int,
    val barHeightFloorPx: Int,
) {
    /** The full box height: title header + symbol + value footer. */
    val boxHeightPx: Int
        get() = headerPx + barHeightPx + footerPx

    /** Quiet zone per side in whole modules outside the symbol — for a linear symbol never below
     *  [MIN_QUIET_ZONE_MODULES] when [canRender]; a QR's own quiet zone is inside its matrix. */
    val leadingQuietModules: Int
        get() = if (modulePx > 0) leadingQuietPx / modulePx else 0
    val trailingQuietModules: Int
        get() = if (modulePx > 0) trailingQuietPx / modulePx else 0

    companion object {
        /** The quiet zone each side of a linear symbol keeps at the least, in modules (watchOS's
         *  `minimumQuietZoneUnitsPerSide`): it stops a bar landing against the black bezel. */
        const val MIN_QUIET_ZONE_MODULES = 4

        /** Round only: bars at least this fraction of the symbol's drawn width tall. */
        const val ROUND_BAR_HEIGHT_FLOOR_RATIO = 0.5f

        // Title header (Wear-only; watchOS shows the name in the nav bar): a 20 dp line at font scale
        // 1 + a 4 dp gap.
        const val TITLE_LABEL_HEIGHT_DP = 20f
        const val CONTENT_SPACING_DP = 4f

        // Value footer (watchOS's `valueLabelReservedHeight`): a 12 dp line for the 10 sp digits at font
        // scale 1 + 4 dp.
        const val VALUE_LABEL_HEIGHT_DP = 12f
        const val VALUE_FONT_SIZE_SP = 10f

        /**
         * Solves the module plan for a [screenWidthPx]×[screenHeightPx] screen.
         *
         * @param density device pixels per dp, to turn the title and value rows into pixels.
         * @param fontScale the user's font scale: the title and value are sp text, so their rows grow
         *   with it (a linear scale, the upper bound of Android 14's non-linear one).
         * @param isRound whether the display is round (`Configuration.isScreenRound`): the box is then
         *   inscribed in the circle of the screen's shorter side.
         * @param isQr whether the symbol is a QR code — the square branch.
         * @param symbolUnits the symbol's modules ([WearBarcodeGenerator.measure]).
         * @param quietZone the symbology's quiet-zone ratio; ignored for QR.
         * @param showsTitle whether the card name is drawn above the symbol.
         * @param showsValueLabel whether the value is drawn below it.
         */
        fun make(
            screenWidthPx: Int,
            screenHeightPx: Int,
            density: Float,
            fontScale: Float,
            isRound: Boolean,
            isQr: Boolean,
            symbolUnits: Int,
            quietZone: BarcodeQuietZone,
            showsTitle: Boolean,
            showsValueLabel: Boolean,
        ): BarcodeLayoutMetrics {
            val width = max(screenWidthPx, 1)
            val height = max(screenHeightPx, 1)
            val units = max(symbolUnits, 1)
            val scale = max(fontScale, 0f)
            val headerPx = if (showsTitle) rowPx(TITLE_LABEL_HEIGHT_DP, scale, density) else 0
            val footerPx = if (showsValueLabel) rowPx(VALUE_LABEL_HEIGHT_DP, scale, density) else 0
            val chrome = headerPx + footerPx
            val diameter = min(width, height)

            var module = 0
            var barHeight = 0
            var boxWidth = 0
            var barHeightFloor = 0

            if (isQr) {
                val side = if (isRound) maxSquareSideInCircle(diameter, chrome) else min(width, height - chrome)
                module = max(side, 0) / units
                barHeight = module * units
                boxWidth = if (isRound) chordAt(diameter, chrome + barHeight, width) else width
            } else if (isRound) {
                val reserved = units + MIN_QUIET_ZONE_MODULES * 2
                var fallback = 0
                var fallbackBar = 0
                for (candidate in diameter / reserved downTo 1) {
                    val freeBar = chordAt(diameter, candidate * reserved, height) - chrome
                    if (freeBar < 1) continue
                    if (fallback == 0) {
                        fallback = candidate
                        fallbackBar = freeBar
                    }
                    val floorPx = ceil(candidate * units * ROUND_BAR_HEIGHT_FLOOR_RATIO).toInt()
                    if (freeBar >= floorPx) {
                        module = candidate
                        barHeight = freeBar
                        barHeightFloor = floorPx
                        break
                    }
                }
                // No module meets the floor (a long symbol on a small circle): the largest module
                // that leaves a bar at all. If none does, the symbol is too long to draw.
                if (module == 0 && fallback > 0) {
                    module = fallback
                    barHeight = fallbackBar
                }
                if (module > 0) boxWidth = chordAt(diameter, chrome + barHeight, width)
            } else if (units + MIN_QUIET_ZONE_MODULES * 2 <= width && height - chrome >= 1) {
                module = width / (units + MIN_QUIET_ZONE_MODULES * 2)
                barHeight = height - chrome
                boxWidth = width
            }

            if (module == 0) return valueOnly(width, height, diameter, isRound, isQr, units, headerPx, footerPx)

            val symbolWidth = module * units
            val leftover = boxWidth - symbolWidth
            val leading = if (isQr) {
                leftover / 2
            } else {
                // The module was chosen so that the symbol plus the floor on both sides fits the box,
                // so `leftover ≥ 2 × floor` here: the symbology's ratio, each side clamped to the floor.
                val floorPx = MIN_QUIET_ZONE_MODULES * module
                val proportional = leftover * quietZone.leading / max(quietZone.total, 1)
                min(max(proportional, floorPx), leftover - floorPx)
            }

            return BarcodeLayoutMetrics(
                isQr = isQr,
                isRound = isRound,
                canRender = true,
                modulePx = module,
                symbolUnits = units,
                symbolWidthPx = symbolWidth,
                barHeightPx = barHeight,
                boxWidthPx = boxWidth,
                leadingQuietPx = leading,
                trailingQuietPx = leftover - leading,
                headerPx = headerPx,
                footerPx = footerPx,
                barHeightFloorPx = barHeightFloor,
            )
        }

        /**
         * The plan for a symbol too long to draw: no symbol, and the free area the value placeholder
         * takes in its place — the whole height the text rows leave on a square screen, and on a round
         * one the box inscribed in the circle's inscribed square, so it clears the mask.
         */
        private fun valueOnly(
            width: Int,
            height: Int,
            diameter: Int,
            isRound: Boolean,
            isQr: Boolean,
            units: Int,
            headerPx: Int,
            footerPx: Int,
        ): BarcodeLayoutMetrics {
            val chrome = headerPx + footerPx
            val freeHeight: Int
            val freeWidth: Int
            if (isRound) {
                val inscribed = floor(diameter / sqrt(2.0)).toInt()
                freeHeight = max(inscribed - chrome, 1)
                freeWidth = chordAt(diameter, chrome + freeHeight, width)
            } else {
                freeHeight = max(height - chrome, 1)
                freeWidth = width
            }
            return BarcodeLayoutMetrics(
                isQr = isQr,
                isRound = isRound,
                canRender = false,
                modulePx = 0,
                symbolUnits = units,
                symbolWidthPx = 0,
                barHeightPx = freeHeight,
                boxWidthPx = freeWidth,
                leadingQuietPx = 0,
                trailingQuietPx = 0,
                headerPx = headerPx,
                footerPx = footerPx,
                barHeightFloorPx = 0,
            )
        }

        /** A text row's reserved height in px: its sp line scaled by [fontScale], plus the dp gap. */
        private fun rowPx(lineDp: Float, fontScale: Float, density: Float): Int =
            ceil((lineDp * fontScale + CONTENT_SPACING_DP) * density).toInt()

        /**
         * The chord of a circle of [diameter] at a centred box of height [boxHeight]: the widest box
         * of that height inside the circle, `⌊√(D² − H²)⌋`, never wider than [cap]. Zero when the
         * height alone exceeds the diameter.
         */
        private fun chordAt(diameter: Int, boxHeight: Int, cap: Int): Int {
            val d = diameter.toDouble()
            val h = boxHeight.toDouble()
            val squared = d * d - h * h
            if (squared <= 0.0) return 0
            return min(floor(sqrt(squared)).toInt(), cap)
        }

        /**
         * Largest square side `s` whose box — `s` wide, `s + chrome` tall — fits a circle of
         * [diameter]: `s² + (s + k)² ≤ D²`, positive root `s = (−k + √(2D² − k²)) / 2`.
         */
        private fun maxSquareSideInCircle(diameter: Int, chrome: Int): Int {
            val d = diameter.toDouble()
            val k = chrome.toDouble()
            val discriminant = 2.0 * d * d - k * k
            if (discriminant <= 0.0) return 0
            return max(floor((-k + sqrt(discriminant)) / 2.0).toInt(), 0)
        }
    }
}

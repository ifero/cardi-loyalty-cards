package com.iferoporefi.myloyaltycards.wear.presentation.theme

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.wear.compose.material3.ColorScheme
import androidx.wear.compose.material3.MaterialTheme

/**
 * The Cardì roles on Wear OS, as the watch grammar decides them
 * (`docs/design/cardi/cardi-watch-grammar.md` §4.1, §4.4). Every chrome colour the app paints is
 * defined here, once; screens read these constants or the [ColorScheme] roles built from them,
 * never a literal of their own.
 *
 * Card accents are not chrome and do not live here: they come from the catalogue and
 * `CardVisuals.kt`. The barcode screen's white field and black bars are not chrome either (§6), so
 * it reads none of these.
 *
 * No `typography` and no `shapes` are passed to [MaterialTheme]: the watch ships no custom
 * typeface (§5.2), and the row radius lives in `CardRowMetrics`. The file name predates the
 * grammar and is kept.
 */

/** Row and sheet fill (§4.1). */
val Ink: Color = Color(0xFF181824)

/** Primary and interactive, always with [Ink] on it (§4.1, §4.5). */
val Beam: Color = Color(0xFFFCCC0C)

/** Body text on the black ground and on [Ink] (§4.1). Never pure white. */
val Cream: Color = Color(0xFFF0F0E8)

/** Secondary text: [Cream] at 60 %, one mechanism rather than a fixed grey (§4.1). */
val CreamSecondary: Color = Cream.copy(alpha = 0.6f)

/** The system's dark outline, for the near-black accent's hairline (§4.1). */
val Hairline: Color = Color(0xFF3A3A48)

/** The favourite star: beam, no plate (§4.4). */
val FavoriteStarTint: Color = Beam

// Declared after the roles above so top-level initialization order gives every role a real value.
private val CardiColorScheme: ColorScheme = ColorScheme(
    primary = Beam,
    onPrimary = Ink,
    // M3 derives a selected RadioButton's fill from primaryContainer and its label from
    // onPrimaryContainer. The sort picker names its colours, but these keep any such derivation on
    // the Cardì roles too: an ink row with beam on it, whichever option is selected (§8.1).
    primaryContainer = Ink,
    onPrimaryContainer = Beam,
    background = Color.Black,
    onBackground = Cream,
    surfaceContainer = Ink,
    onSurface = Cream,
    onSurfaceVariant = CreamSecondary,
)

/** Wraps the app in the Cardì [ColorScheme]. */
@Composable
fun MyLoyaltyCardsWearTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = CardiColorScheme, content = content)
}

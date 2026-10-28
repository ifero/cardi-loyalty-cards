package com.iferoporefi.myloyaltycards.wear.presentation

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.view.WindowManager
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.FilterQuality
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material3.MaterialTheme
import androidx.wear.compose.material3.ScreenScaffold
import androidx.wear.compose.material3.Text
import androidx.wear.compose.ui.tooling.preview.WearPreviewDevices
import com.iferoporefi.myloyaltycards.wear.R
import com.iferoporefi.myloyaltycards.wear.barcode.BarcodeFormats
import com.iferoporefi.myloyaltycards.wear.barcode.BarcodeLayoutMetrics
import com.iferoporefi.myloyaltycards.wear.barcode.BarcodeResult
import com.iferoporefi.myloyaltycards.wear.barcode.WearBarcodeGenerator
import com.iferoporefi.myloyaltycards.wear.barcode.toBarcodeImageBitmap
import com.iferoporefi.myloyaltycards.wear.data.WearCard
import com.iferoporefi.myloyaltycards.wear.usage.CardUsageRecorder
import com.iferoporefi.myloyaltycards.wear.usage.UsageTimestamps
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Full-screen barcode for a tapped card (AC1). Renders a scannable symbol on a **white** surface with
 * the card name as title-level context and, by default, the value beneath it (matching watchOS's
 * current behaviour). Everything scanner-facing is deliberate: white background, black bars, quiet
 * zone preserved, brightness maxed, screen held awake.
 *
 * Behaviour, all scoped to this screen:
 * - **On appear** — a confirm haptic, and the [CardUsageRecorder] seam fires once at the open time
 *   (ms precision), mirroring watchOS's emission point (the barcode appearing, not the list tap; AC8).
 * - **While a barcode is shown** — the screen is kept awake at full brightness, both restored on every
 *   exit path by a lifecycle-scoped effect (AC5). An error state does neither.
 * - **Dismissal** — only the swipe: the Wear system back gesture, from the host
 *   `SwipeDismissableNavHost`. A tap does nothing (Story 23.3, decision 1, as on watchOS), so a stray
 *   touch while the code is held to a scanner cannot close it.
 * - **Rotary input (crown or bezel)** — does nothing. No rotary handler is wired here and nothing on
 *   the screen scrolls, so a turn neither moves nor dismisses the code
 *   (`cardi-watch-grammar.md` §8: the crown and the rotary scroll; they never act).
 *
 * Generation runs on [Dispatchers.Default] and is cached, so the UI thread never encodes and
 * re-opening a card never re-encodes (AC10). Works entirely offline — nothing here touches the
 * network (AC7).
 *
 * @param card the tapped card, or `null` if it vanished from the snapshot mid-navigation (a sync
 *   race) — in which case the screen simply returns to the list rather than showing an empty screen.
 * @param onDismiss returns to the list. Called only for a vanished [card]: the user's way back is the
 *   host's swipe, which does not run through this screen.
 */
@Composable
fun BarcodeScreen(
    card: WearCard?,
    barcodeGenerator: WearBarcodeGenerator,
    usageRecorder: CardUsageRecorder,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val currentOnDismiss by rememberUpdatedState(onDismiss)

    // A vanished card is a sync race, not a user action: pop back to the list rather than render blank.
    if (card == null) {
        LaunchedEffect(Unit) { currentOnDismiss() }
        return
    }

    val haptics = LocalHapticFeedback.current
    // On appear: confirm haptic + usage seam, once per card open. Placed here — the barcode screen
    // appearing — so the two platforms count the same event (AC8), regardless of render outcome.
    LaunchedEffect(card.id) {
        haptics.performHapticFeedback(HapticFeedbackType.Confirm)
        usageRecorder.recordCardUsed(card.id, UsageTimestamps.now())
    }

    val isRound = LocalConfiguration.current.isScreenRound
    val density = LocalDensity.current
    val isQr = BarcodeFormats.isQr(card.barcodeFormat)
    val value = card.barcodeValue
    val showsValueLabel = !value.isNullOrEmpty()
    val title = barcodeScreenTitle(card.name, stringResource(R.string.barcode_untitled_card))

    // Hide the global clock on the full-screen barcode flash: a persistent TimeText overlaps the
    // title on a square screen and is clutter over a scannable surface. The list/sort keep theirs.
    ScreenScaffold(modifier = modifier, timeText = {}) { contentPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.White),
            contentAlignment = Alignment.Center,
        ) {
            BoxWithConstraints(modifier = Modifier.fillMaxSize().padding(contentPadding)) {
                val metrics = remember(maxWidth, maxHeight, isRound, isQr, showsValueLabel) {
                    BarcodeLayoutMetrics.make(
                        containerWidth = maxWidth.value,
                        containerHeight = maxHeight.value,
                        isRound = isRound,
                        isQr = isQr,
                        showsTitle = true,
                        showsValueLabel = showsValueLabel,
                    )
                }
                val widthPx = with(density) { metrics.barcodeWidth.dp.roundToPx() }
                val heightPx = with(density) { metrics.barcodeHeight.dp.roundToPx() }

                val state = rememberBarcodeRenderState(barcodeGenerator, value, card.barcodeFormat, widthPx, heightPx)

                if (state !is BarcodeRenderState.Failed) {
                    // Hold the screen awake at full brightness from the moment a barcode starts
                    // showing — Loading through Rendered, not gated on a successful render — and skip
                    // it for the error state, which needs neither (AC5). The call site is stable
                    // across Loading→Rendered, so brightness does not flicker between them.
                    KeepScreenAwakeAndBright()
                }

                when (state) {
                    BarcodeRenderState.Loading ->
                        // Reserve the symbol's footprint so the layout does not jump when it lands.
                        Spacer(Modifier.size(metrics.barcodeWidth.dp, metrics.barcodeHeight.dp))

                    is BarcodeRenderState.Rendered ->
                        BarcodeSuccessContent(
                            image = state.image,
                            title = title,
                            value = value,
                            metrics = metrics,
                            contentDescription = stringResource(R.string.barcode_content_description, title),
                        )

                    is BarcodeRenderState.Failed -> BarcodeErrorContent(state.result)
                }
            }
        }
    }
}

/** The UI state of the barcode area. */
private sealed interface BarcodeRenderState {
    data object Loading : BarcodeRenderState
    data class Rendered(val image: ImageBitmap) : BarcodeRenderState
    data class Failed(val result: BarcodeResult) : BarcodeRenderState
}

/**
 * Generates the barcode off the main thread (AC10) and exposes it as a [BarcodeRenderState]. Encoding
 * is cached in [generator]; the pixel→[ImageBitmap] copy runs on [Dispatchers.Default] too, so the UI
 * thread does no barcode work. Re-runs only when a key changes (value, format, or size).
 */
@Composable
private fun rememberBarcodeRenderState(
    generator: WearBarcodeGenerator,
    barcodeValue: String?,
    barcodeFormat: String?,
    widthPx: Int,
    heightPx: Int,
): BarcodeRenderState =
    produceState<BarcodeRenderState>(
        BarcodeRenderState.Loading,
        generator,
        barcodeValue,
        barcodeFormat,
        widthPx,
        heightPx,
    ) {
        // Wait for a real measurement before encoding.
        if (widthPx <= 0 || heightPx <= 0) return@produceState
        value = withContext(Dispatchers.Default) {
            when (val result = generator.generate(barcodeValue, barcodeFormat, widthPx, heightPx)) {
                is BarcodeResult.Success -> BarcodeRenderState.Rendered(result.matrix.toBarcodeImageBitmap())
                else -> BarcodeRenderState.Failed(result)
            }
        }
    }.value

/**
 * The scannable content: card name (title-level), the symbol at its measured size with no
 * interpolation (crisp modules, mirroring watchOS's `.interpolation(.none)`), and the value below.
 */
@Composable
private fun BarcodeSuccessContent(
    image: ImageBitmap,
    title: String,
    value: String?,
    metrics: BarcodeLayoutMetrics,
    contentDescription: String,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = metrics.boxInnerPadding.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            text = title,
            color = Color.Black,
            style = MaterialTheme.typography.titleSmall,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            textAlign = TextAlign.Center,
            modifier = Modifier
                .widthIn(max = metrics.usableWidth.dp)
                .padding(bottom = metrics.contentSpacing.dp),
        )
        Image(
            bitmap = image,
            contentDescription = contentDescription,
            contentScale = ContentScale.Fit,
            filterQuality = FilterQuality.None,
            modifier = Modifier.size(metrics.barcodeWidth.dp, metrics.barcodeHeight.dp),
        )
        if (!value.isNullOrEmpty()) {
            Text(
                text = value,
                color = Color.Black,
                fontFamily = FontFamily.Monospace,
                fontSize = metrics.valueFontSize.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .widthIn(max = metrics.usableWidth.dp)
                    .padding(
                        start = metrics.valueHorizontalPadding.dp,
                        top = metrics.contentSpacing.dp,
                        end = metrics.valueHorizontalPadding.dp,
                    ),
            )
        }
    }
}

/**
 * The localised error state (AC2): distinct copy for an unsupported format (re-add the card) versus
 * an invalid value (the stored barcode is wrong). Never a blank screen. Black text on the same white
 * surface, centered; the user swipes back to return.
 */
@Composable
private fun BarcodeErrorContent(result: BarcodeResult, modifier: Modifier = Modifier) {
    val (titleRes, messageRes) = when (result) {
        BarcodeResult.UnsupportedFormat ->
            R.string.barcode_error_unsupported_title to R.string.barcode_error_unsupported_message
        BarcodeResult.InvalidValue ->
            R.string.barcode_error_invalid_title to R.string.barcode_error_invalid_message
        // Unreachable — a Success renders as a barcode, not here — but matched explicitly so a new
        // BarcodeResult variant is a compile error rather than a silently-wrong error message.
        is BarcodeResult.Success ->
            R.string.barcode_error_invalid_title to R.string.barcode_error_invalid_message
    }
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            text = stringResource(titleRes),
            color = Color.Black,
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.SemiBold,
            textAlign = TextAlign.Center,
        )
        Text(
            text = stringResource(messageRes),
            color = Color.Black,
            style = MaterialTheme.typography.bodySmall,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = 4.dp),
        )
    }
}

/**
 * Holds the screen awake at full brightness for as long as this composable is in the tree, and
 * restores both on **every** exit path — swipe-dismiss, navigation, or composition teardown — via
 * [DisposableEffect]'s `onDispose` (AC5). Brightness is set as a window override
 * (no `WRITE_SETTINGS` permission needed) and restored to whatever it was before.
 */
@Composable
private fun KeepScreenAwakeAndBright() {
    val context = LocalContext.current
    DisposableEffect(context) {
        val window = context.findActivity()?.window ?: return@DisposableEffect onDispose {}
        val previousBrightness = window.attributes.screenBrightness
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        window.attributes = window.attributes.apply {
            screenBrightness = WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_FULL
        }
        onDispose {
            window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            window.attributes = window.attributes.apply { screenBrightness = previousBrightness }
        }
    }
}

/** Unwraps the [Activity] behind a Compose [Context] without assuming `LocalActivity` is present. */
private tailrec fun Context.findActivity(): Activity? = when (this) {
    is Activity -> this
    is ContextWrapper -> baseContext.findActivity()
    else -> null
}

// --- Previews -------------------------------------------------------------------------------------
// Deterministic: the success preview encodes a real barcode synchronously (no Dispatchers), and the
// error preview needs no async at all. Both render on round and square via @WearPreviewDevices.

@WearPreviewDevices
@Composable
private fun BarcodeSuccessPreview() {
    val metrics = BarcodeLayoutMetrics.make(
        containerWidth = 220f,
        containerHeight = 220f,
        isRound = true,
        isQr = false,
        showsTitle = true,
        showsValueLabel = true,
    )
    val density = LocalDensity.current
    val image = remember {
        val widthPx = with(density) { metrics.barcodeWidth.dp.roundToPx() }
        val heightPx = with(density) { metrics.barcodeHeight.dp.roundToPx() }
        (WearBarcodeGenerator().generate("5901234123457", "EAN13", widthPx, heightPx)
            as BarcodeResult.Success).matrix.toBarcodeImageBitmap()
    }
    Box(Modifier.fillMaxSize().background(Color.White), contentAlignment = Alignment.Center) {
        BarcodeSuccessContent(
            image = image,
            title = "Esselunga",
            value = "5901234123457",
            metrics = metrics,
            contentDescription = "Barcode for Esselunga",
        )
    }
}

@WearPreviewDevices
@Composable
private fun BarcodeErrorPreview() {
    Box(Modifier.fillMaxSize().background(Color.White)) {
        BarcodeErrorContent(BarcodeResult.UnsupportedFormat)
    }
}

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
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.pager.PagerState
import androidx.compose.foundation.pager.VerticalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.FilterQuality
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.foundation.LocalReduceMotion
import androidx.wear.compose.foundation.requestFocusOnHierarchyActive
import androidx.wear.compose.foundation.rotary.RotaryScrollableDefaults
import androidx.wear.compose.foundation.rotary.RotarySnapLayoutInfoProvider
import androidx.wear.compose.foundation.rotary.rotaryScrollable
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
import com.iferoporefi.myloyaltycards.wear.sort.CardSorter
import com.iferoporefi.myloyaltycards.wear.sort.WatchSortMode
import com.iferoporefi.myloyaltycards.wear.usage.CardUsageRecorder
import com.iferoporefi.myloyaltycards.wear.usage.UsageTimestamps
import kotlin.math.absoluteValue
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Full-screen barcode for a tapped card (AC1), and rotary paging through the cards beside it
 * (Story 23.3, decisions 4–6; `cardi-watch-grammar.md` §8). Renders a scannable symbol on a
 * **white** surface with the card name as title-level context and, by default, the value beneath
 * it (matching watchOS's current behaviour). Everything scanner-facing is deliberate: white
 * background, black bars, quiet zone preserved, nothing overlaid (no page indicator), brightness
 * maxed, screen held awake.
 *
 * Behaviour, all scoped to this screen:
 * - **Rotary input (crown or bezel) scrolls through the cards**, one card per detent, in the order
 *   the list showed when the barcode opened — held for the visit, so a sync or a usage re-sort
 *   cannot reshuffle it mid-scan. It stops at the first and the last card (no wrap), does nothing
 *   with one card, and never dismisses. Each card slides in from the way the rotary turned (the
 *   next from below, as the list's rows move), or crossfades in place under the system's reduce
 *   motion. The [VerticalPager] takes no swipe; its single rotary reader is the snap behaviour at
 *   low sensitivity, which brings the platform's detent haptic and the bezel's low-resolution path.
 *   TalkBack's "Next card" and "Previous card" actions page the same way, each offered only where
 *   that move exists. [BarcodePaging] holds the arithmetic.
 * - **Per card, on the card at rest on screen — never a page composed beside it.** The opened card
 *   plays a confirm haptic and fires the [CardUsageRecorder] seam at once (ms precision), mirroring
 *   watchOS's emission point (the barcode appearing, not the list tap; AC8). A card paging moves
 *   to plays no open haptic (the detent's is its own) and counts as used only after 1 s at rest on
 *   screen, cancelled if paging moves on or the screen closes first (decision 5).
 * - **While a barcode is shown** — the screen is kept awake at full brightness, held across
 *   rendered cards without a drop between them and restored on every exit path by a
 *   lifecycle-scoped effect (AC5). An error card does neither; paging on from it takes them back.
 * - **Dismissal** — only the swipe: the Wear system back gesture, from the host
 *   `SwipeDismissableNavHost`. A tap does nothing and a vertical swipe pages nothing (Story 23.3,
 *   decision 1, as on watchOS), so a stray touch while the code is held to a scanner cannot close
 *   it or change the card.
 *
 * Generation runs on [Dispatchers.Default] and is cached, so the UI thread never encodes and
 * re-opening a card never re-encodes (AC10). Works entirely offline — nothing here touches the
 * network (AC7).
 *
 * @param openedCardId the tapped card's id, or `null` if the route carried none.
 * @param cards the live cards, as the repository holds them now. Read for what still exists and
 *   for each card's current data; the order paging follows is the one taken from them at opening.
 * @param sortMode the list's sort mode, read once at opening to take that order.
 * @param onDismiss returns to the list. Called only when the card on screen has gone — vanished
 *   from the snapshot mid-navigation, or deleted mid-visit (a sync race) — rather than showing an
 *   empty screen. The user's way back is the host's swipe, which does not run through this screen.
 */
@Composable
fun BarcodeScreen(
    openedCardId: String?,
    cards: List<WearCard>,
    sortMode: WatchSortMode,
    barcodeGenerator: WearBarcodeGenerator,
    usageRecorder: CardUsageRecorder,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val currentOnDismiss by rememberUpdatedState(onDismiss)

    // The list's order at the moment the barcode opened, from the same sort the list runs, held
    // for the visit (decision 4). Saveable, so neither a recomposition nor a recreation retakes it.
    val heldOrder: List<String> = rememberSaveable {
        ArrayList(BarcodePaging.heldOrder(cards, sortMode, CardSorter()))
    }
    // The card at rest on screen; how it arrived; and whether that arrival has counted as used.
    var shownId by rememberSaveable { mutableStateOf(openedCardId) }
    var arrival by rememberSaveable { mutableStateOf(BarcodeArrival.Opened) }
    var counted by rememberSaveable { mutableStateOf(false) }

    // The card on screen has gone — vanished before opening, or deleted mid-visit (a sync race, not
    // a user action): pop back to the list rather than render blank.
    val shown = cards.firstOrNull { it.id == shownId }
    if (shown == null) {
        LaunchedEffect(Unit) { currentOnDismiss() }
        return
    }
    val shownCardId = shown.id

    val cardsById = remember(cards) { cards.associateBy { it.id } }
    val reachable = remember(heldOrder, cardsById) { BarcodePaging.reachableIds(heldOrder, cardsById.keys) }
    val currentReachable by rememberUpdatedState(reachable)
    val pagerState = rememberPagerState(initialPage = reachable.indexOf(shownCardId).coerceAtLeast(0)) {
        currentReachable.size
    }

    // A held card dropped out ahead of the one on screen: keep the pager on the card that is
    // showing, so the next detent moves from it rather than from where its old position now points.
    // It reads the live `shownId`, not this composition's `shownCardId`: a sync landing as the pager
    // settles on a new card would otherwise scroll it back to the card before.
    LaunchedEffect(reachable) {
        val position = reachable.indexOf(shownId ?: return@LaunchedEffect)
        if (position >= 0 && position != pagerState.currentPage && !pagerState.isScrollInProgress) {
            pagerState.scrollToPage(position)
        }
    }

    // A card counts as on screen only once the pager has come to rest on it: the pager composes
    // its neighbours too, and a card mid-slide is not yet (or no longer) the one being shown.
    LaunchedEffect(pagerState) {
        snapshotFlow { pagerState.isScrollInProgress to pagerState.settledPage }
            .collect { (moving, page) ->
                if (moving) return@collect
                val settledId = BarcodePaging.idAtPage(page, currentReachable) ?: return@collect
                if (settledId != shownId) {
                    shownId = settledId
                    arrival = BarcodeArrival.Paged
                    counted = false
                }
            }
    }

    // Per card, on the card at rest: the opened one plays the open haptic and counts at once, as
    // before paging existed; a paged one counts after 1 s at rest. Keyed on the pager moving, so
    // turning on (or closing the screen) before then cancels it, and nothing counts twice.
    val haptics = LocalHapticFeedback.current
    val pageMoving = pagerState.isScrollInProgress
    LaunchedEffect(shownCardId, arrival, counted, pageMoving) {
        if (counted || pageMoving) return@LaunchedEffect
        if (arrival == BarcodeArrival.Opened) haptics.performHapticFeedback(HapticFeedbackType.Confirm)
        delay(BarcodePaging.usageDelay(arrival))
        usageRecorder.recordCardUsed(shownCardId, UsageTimestamps.now())
        counted = true
    }

    // Hold the screen awake at full brightness from the moment a barcode starts showing — Loading
    // through Rendered, not gated on a successful render — and skip it for an error card, which
    // needs neither (AC5). Called here, once for the screen, and keyed on the card at rest, so
    // paging between two rendered cards never drops it and a card composed beside never takes it.
    val failedCardIds = remember { mutableStateMapOf<String, Boolean>() }
    if (failedCardIds[shownCardId] != true) {
        KeepScreenAwakeAndBright()
    }

    // TalkBack's stand-in for the rotary input: the same move, offered only where it exists.
    val scope = rememberCoroutineScope()
    val nextCardLabel = stringResource(R.string.barcode_next_card)
    val previousCardLabel = stringResource(R.string.barcode_previous_card)
    val pagingActions = remember(shownCardId, reachable, nextCardLabel, previousCardLabel) {
        val pageTo: (Int) -> Boolean = { target ->
            scope.launch { pagerState.animateScrollToPage(target) }
            true
        }
        buildList {
            BarcodePaging.pageAfter(shownCardId, reachable, step = 1)?.let { target ->
                add(CustomAccessibilityAction(nextCardLabel) { pageTo(target) })
            }
            BarcodePaging.pageAfter(shownCardId, reachable, step = -1)?.let { target ->
                add(CustomAccessibilityAction(previousCardLabel) { pageTo(target) })
            }
        }
    }

    // Under reduce motion a change of card is a crossfade in place, not a slide. Measured on the
    // API 34 AVD: the system setting also zeroes the animation scales, so the change is instant
    // there; and a targetSdk 35 app may not read that setting, so this reads false on API 34+.
    val reduceMotion = LocalReduceMotion.current
    val focusRequester = remember { FocusRequester() }
    val snapLayoutInfo = remember(pagerState) { PagerSnapLayoutInfo(pagerState) }

    // Hide the global clock on the full-screen barcode flash: a persistent TimeText overlaps the
    // title on a square screen and is clutter over a scannable surface. The list/sort keep theirs.
    ScreenScaffold(modifier = modifier, timeText = {}) { contentPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.White),
            contentAlignment = Alignment.Center,
        ) {
            // Compose foundation's pager, not wear-compose's: the wear one wraps every page in its own
            // hierarchical focus group, and on the AVD a page joining the active path cleared the
            // focus of a rotary reader wired outside its pages (its own reader only works with swipes
            // on). With no focus group in the pages, this one reader keeps the rotary for the visit.
            // It takes no swipe, and the neighbouring card on each side is composed, so it has
            // rendered by the time it slides in.
            VerticalPager(
                state = pagerState,
                modifier = Modifier
                    .fillMaxSize()
                    .requestFocusOnHierarchyActive()
                    .rotaryScrollable(
                        behavior = RotaryScrollableDefaults.snapBehavior(
                            scrollableState = pagerState,
                            layoutInfoProvider = snapLayoutInfo,
                            snapSensitivity = RotaryScrollableDefaults.LowSnapSensitivity,
                        ),
                        focusRequester = focusRequester,
                    ),
                beyondViewportPageCount = 1,
                userScrollEnabled = false,
                key = { page -> currentReachable[page] },
            ) { page ->
                val card = currentReachable.getOrNull(page)?.let(cardsById::get) ?: return@VerticalPager
                BarcodePage(
                    card = card,
                    barcodeGenerator = barcodeGenerator,
                    contentPadding = contentPadding,
                    accessibilityActions = if (card.id == shownCardId) pagingActions else emptyList(),
                    onRenderFailedChange = { failed -> failedCardIds[card.id] = failed },
                    modifier = if (reduceMotion) Modifier.crossfadeInPlace(pagerState, page) else Modifier,
                )
            }
        }
    }
}

/**
 * Where the pager is, in the terms the rotary snap behaviour reads: one item per page. The same
 * arithmetic wear-compose's own pager provider uses, over the Compose foundation [PagerState].
 */
private class PagerSnapLayoutInfo(private val state: PagerState) : RotarySnapLayoutInfoProvider {
    override val averageItemSize: Float
        get() = state.layoutInfo.pageSize.toFloat()

    override val currentItemIndex: Int
        get() = state.currentPage

    override val currentItemOffset: Float
        get() = state.currentPageOffsetFraction * averageItemSize

    override val totalItemCount: Int
        get() = state.pageCount
}

/**
 * Under reduce motion the pager still scrolls, but each page is held in place and faded by how far
 * it is from rest, so a change of card is a crossfade rather than a slide. Drawn in the layer, so
 * the pager's offset is read per frame without recomposing.
 */
private fun Modifier.crossfadeInPlace(pagerState: PagerState, page: Int): Modifier = graphicsLayer {
    val offset = (pagerState.currentPage - page) + pagerState.currentPageOffsetFraction
    translationY = offset * size.height
    alpha = 1f - offset.absoluteValue.coerceIn(0f, 1f)
}

/**
 * One card's barcode, as a page: its title, its symbol at its own measured size, its render state
 * and its error state. Carries no per-card effect — the haptic, the usage event and the awake call
 * belong to the screen and the card at rest on it — but reports whether it failed, so the screen
 * can release full brightness on an error card.
 */
@Composable
private fun BarcodePage(
    card: WearCard,
    barcodeGenerator: WearBarcodeGenerator,
    contentPadding: PaddingValues,
    accessibilityActions: List<CustomAccessibilityAction>,
    onRenderFailedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
) {
    val currentOnRenderFailedChange by rememberUpdatedState(onRenderFailedChange)
    val isRound = LocalConfiguration.current.isScreenRound
    val density = LocalDensity.current
    val isQr = BarcodeFormats.isQr(card.barcodeFormat)
    val value = card.barcodeValue
    val showsValueLabel = !value.isNullOrEmpty()
    val title = barcodeScreenTitle(card.name, stringResource(R.string.barcode_untitled_card))

    BoxWithConstraints(
        modifier = modifier
            .fillMaxSize()
            .semantics(mergeDescendants = true) { customActions = accessibilityActions }
            .padding(contentPadding),
    ) {
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
        val failed = state is BarcodeRenderState.Failed
        LaunchedEffect(failed) { currentOnRenderFailedChange(failed) }

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

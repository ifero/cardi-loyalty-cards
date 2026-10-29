package com.iferoporefi.myloyaltycards.wear.presentation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.wear.compose.foundation.lazy.TransformingLazyColumn
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.foundation.lazy.rememberTransformingLazyColumnState
import androidx.wear.compose.foundation.rotary.RotaryScrollableDefaults
import androidx.wear.compose.material3.Button
import androidx.wear.compose.material3.ButtonDefaults
import androidx.wear.compose.material3.Icon
import androidx.wear.compose.material3.ListHeader
import androidx.wear.compose.material3.MaterialTheme
import androidx.wear.compose.material3.ScreenScaffold
import androidx.wear.compose.material3.SurfaceTransformation
import androidx.wear.compose.material3.Text
import androidx.wear.compose.material3.lazy.rememberTransformationSpec
import com.iferoporefi.myloyaltycards.wear.R
import com.iferoporefi.myloyaltycards.wear.data.WearCard
import com.iferoporefi.myloyaltycards.wear.presentation.theme.Cream
import com.iferoporefi.myloyaltycards.wear.presentation.theme.CreamSecondary
import com.iferoporefi.myloyaltycards.wear.sort.CardSorter
import com.iferoporefi.myloyaltycards.wear.sort.WatchSortMode

/**
 * The card list (AC1). Renders each locally-stored card as a [CardRow] inside a
 * [TransformingLazyColumn] wired to [ScreenScaffold] — so the list scales/fades toward the bezel
 * and is never clipped on a round screen (AC8), with no hand-computed insets. Square screens get
 * the same layout, corners empty (`cardi-watch-grammar.md` §2.1).
 *
 * Rotary input (crown or bezel) scrolls the list and does nothing else. It is wired once, here,
 * by naming the column's [RotaryScrollableDefaults.behavior] at the call site rather than
 * inheriting the parameter's default, so swapping the container cannot silently drop it (§8).
 *
 * When there are no cards it shows [EmptyState] and hides the sort control (nothing to sort),
 * mirroring watchOS.
 *
 * @param onImportSampleCards DEBUG-only seeder; `null` in release, which hides the seed button.
 */
@Composable
fun CardListScreen(
    cards: List<WearCard>,
    sortMode: WatchSortMode,
    onCardClick: (String) -> Unit,
    onOpenSort: () -> Unit,
    onImportSampleCards: (() -> Unit)?,
    modifier: Modifier = Modifier,
) {
    val sorter = remember { CardSorter() }
    val sortedCards = remember(cards, sortMode) { sorter.sort(cards, sortMode) }

    if (sortedCards.isEmpty()) {
        ScreenScaffold(modifier = modifier) { contentPadding ->
            EmptyState(
                onImportSampleCards = onImportSampleCards,
                modifier = Modifier.padding(contentPadding),
            )
        }
        return
    }

    val listState = rememberTransformingLazyColumnState()
    val transformationSpec = rememberTransformationSpec()

    ScreenScaffold(scrollState = listState, modifier = modifier) { contentPadding ->
        TransformingLazyColumn(
            state = listState,
            contentPadding = contentPadding,
            verticalArrangement = Arrangement.spacedBy(4.dp),
            rotaryScrollableBehavior = RotaryScrollableDefaults.behavior(scrollableState = listState),
            modifier = Modifier.fillMaxSize(),
        ) {
            item(key = "list-title") {
                ListHeader { Text(text = stringResource(R.string.cards_title)) }
            }
            item(key = "sort-control") {
                SortControlButton(sortMode = sortMode, onClick = onOpenSort)
            }
            items(sortedCards, key = { it.id }) { card ->
                CardRow(
                    card = card,
                    transformation = SurfaceTransformation(transformationSpec),
                    onClick = { onCardClick(card.id) },
                )
            }
        }
    }
}

/**
 * The list-header control that opens the full-screen sort picker (Open Decision 4). Shows the
 * current mode's label so the active ordering is visible at a glance. Beam with ink label and
 * glyph, the watch's one primary (`cardi-watch-grammar.md` §4.1), named here rather than left to
 * M3's filled-button defaults.
 */
@Composable
private fun SortControlButton(
    sortMode: WatchSortMode,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val modeLabel = stringResource(sortMode.labelRes())
    val description = stringResource(R.string.sort_button_content_description, modeLabel)
    Button(
        onClick = onClick,
        colors = ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.primary,
            contentColor = MaterialTheme.colorScheme.onPrimary,
            iconColor = MaterialTheme.colorScheme.onPrimary,
        ),
        modifier = modifier
            .semantics(mergeDescendants = true) { contentDescription = description },
    ) {
        Icon(
            painter = painterResource(R.drawable.ic_sort),
            contentDescription = null,
            modifier = Modifier.size(18.dp),
        )
        Spacer(Modifier.width(6.dp))
        Text(text = modeLabel, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

/**
 * Empty state (AC10): a clear message that cards come from the phone — deliberately not phrased as
 * an error, because it is what a user sees before the first sync. In DEBUG builds it also offers
 * the sample-card seeder ([onImportSampleCards] non-null).
 *
 * One glyph, one title, one subtitle, all cream: the glyph at 50 %, the title full, the subtitle
 * at 60 % (`cardi-watch-grammar.md` §3.2).
 */
@Composable
private fun EmptyState(
    onImportSampleCards: (() -> Unit)?,
    modifier: Modifier = Modifier,
) {
    val description = stringResource(R.string.cards_empty_content_description)
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 12.dp)
            .semantics(mergeDescendants = true) { contentDescription = description },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(
            painter = painterResource(R.drawable.ic_cards_empty),
            contentDescription = null,
            tint = Cream.copy(alpha = 0.5f),
            modifier = Modifier.size(40.dp),
        )
        Spacer(Modifier.height(12.dp))
        Text(
            text = stringResource(R.string.cards_empty_title),
            textAlign = TextAlign.Center,
            style = MaterialTheme.typography.titleMedium,
            color = Cream,
        )
        Spacer(Modifier.height(6.dp))
        Text(
            text = stringResource(R.string.cards_empty_subtitle),
            textAlign = TextAlign.Center,
            style = MaterialTheme.typography.bodySmall,
            color = CreamSecondary,
        )
        if (onImportSampleCards != null) {
            Spacer(Modifier.height(12.dp))
            Button(onClick = onImportSampleCards) {
                Text(text = stringResource(R.string.debug_import_sample_cards), maxLines = 1)
            }
        }
    }
}

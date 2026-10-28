package com.iferoporefi.myloyaltycards.wear.presentation

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.wear.compose.foundation.lazy.TransformingLazyColumn
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.foundation.lazy.rememberTransformingLazyColumnState
import androidx.wear.compose.foundation.rotary.RotaryScrollableDefaults
import androidx.wear.compose.material3.ListHeader
import androidx.wear.compose.material3.MaterialTheme
import androidx.wear.compose.material3.RadioButton
import androidx.wear.compose.material3.RadioButtonDefaults
import androidx.wear.compose.material3.ScreenScaffold
import androidx.wear.compose.material3.SurfaceTransformation
import androidx.wear.compose.material3.Text
import androidx.wear.compose.material3.lazy.rememberTransformationSpec
import com.iferoporefi.myloyaltycards.wear.R
import com.iferoporefi.myloyaltycards.wear.sort.WatchSortMode

/**
 * Full-screen sort picker (AC5): the three [WatchSortMode]s as single-select [RadioButton] rows,
 * reached from the list's sort control (Open Decision 4).
 *
 * The rows are ink on the black ground and keep the platform's own Material 3 [RadioButton]
 * (`cardi-watch-grammar.md` §8.1 — the frames' dot is schematic, not a control to draw). What
 * changes is the colour: the selected radio and its label are beam, the others cream. Selection
 * is **double-encoded** — the radio's own state and the label's weight (semibold against regular)
 * both move, so it is never carried by colour alone.
 *
 * Rotary input (crown or bezel) scrolls the options and does nothing else; it is named at the call
 * site rather than inherited (§8).
 *
 * Rows appear in enum declaration order (frequent → recent → A-Z). Tapping a row invokes
 * [onModeSelected]; the caller persists the choice and pops back so the list re-orders immediately.
 */
@Composable
fun SortPickerScreen(
    selected: WatchSortMode,
    onModeSelected: (WatchSortMode) -> Unit,
    modifier: Modifier = Modifier,
) {
    val listState = rememberTransformingLazyColumnState()
    val transformationSpec = rememberTransformationSpec()
    val colorScheme = MaterialTheme.colorScheme
    val radioColors = RadioButtonDefaults.radioButtonColors(
        selectedContainerColor = colorScheme.surfaceContainer,
        selectedContentColor = colorScheme.primary,
        selectedControlColor = colorScheme.primary,
        unselectedContainerColor = colorScheme.surfaceContainer,
        unselectedContentColor = colorScheme.onSurface,
        unselectedControlColor = colorScheme.onSurfaceVariant,
    )

    ScreenScaffold(scrollState = listState, modifier = modifier) { contentPadding ->
        TransformingLazyColumn(
            state = listState,
            contentPadding = contentPadding,
            rotaryScrollableBehavior = RotaryScrollableDefaults.behavior(scrollableState = listState),
            modifier = Modifier.fillMaxSize(),
        ) {
            item(key = "sort-picker-title") {
                ListHeader { Text(text = stringResource(R.string.sort_title)) }
            }
            items(WatchSortMode.entries, key = { it.rawValue }) { mode ->
                val isSelected = mode == selected
                RadioButton(
                    selected = isSelected,
                    onSelect = { onModeSelected(mode) },
                    colors = radioColors,
                    transformation = SurfaceTransformation(transformationSpec),
                    modifier = Modifier.fillMaxWidth(),
                    // Up to 2 lines: "Frequently used" would otherwise truncate beside the radio
                    // control on a narrow round screen.
                    label = {
                        Text(
                            text = stringResource(mode.labelRes()),
                            fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                            maxLines = 2,
                        )
                    },
                )
            }
        }
    }
}

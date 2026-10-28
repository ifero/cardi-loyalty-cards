package com.iferoporefi.myloyaltycards.wear.presentation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.lifecycle.Lifecycle
import androidx.navigation.NavController
import androidx.navigation.NavType
import androidx.navigation.navArgument
import androidx.wear.compose.material3.AppScaffold
import androidx.wear.compose.navigation.SwipeDismissableNavHost
import androidx.wear.compose.navigation.composable
import androidx.wear.compose.navigation.rememberSwipeDismissableNavController
import com.iferoporefi.myloyaltycards.wear.barcode.WearBarcodeGenerator
import com.iferoporefi.myloyaltycards.wear.data.CardRepository
import com.iferoporefi.myloyaltycards.wear.prefs.SortPreferenceRepository
import com.iferoporefi.myloyaltycards.wear.presentation.theme.MyLoyaltyCardsWearTheme
import com.iferoporefi.myloyaltycards.wear.sort.WatchSortMode
import com.iferoporefi.myloyaltycards.wear.usage.CardUsageRecorder
import com.iferoporefi.myloyaltycards.wear.usage.NoOpCardUsageRecorder
import kotlinx.coroutines.launch

private const val ROUTE_CARDS = "cards"
private const val ROUTE_SORT = "sort"
private const val ROUTE_BARCODE = "barcode"
private const val ARG_CARD_ID = "cardId"

/**
 * Root of the Wear OS app. [AppScaffold] owns the time text across destinations; the
 * [SwipeDismissableNavHost] gives each screen the swipe-to-dismiss back gesture Wear users expect.
 *
 * State is hoisted here and read from the repositories: the cards ([CardRepository], read-only) and
 * the watch-local sort mode ([SortPreferenceRepository]). Three destinations: the list, the
 * full-screen sort picker, and the full-screen barcode (Story 10-4).
 *
 * @param usageRecorder the AC8 seam invoked when a barcode opens; defaults to the no-op recorder.
 *   Story 10-6 swaps in a Data Layer-backed implementation from `MainActivity` — no change here.
 * @param onImportSampleCards DEBUG-only seeder passed through to the empty state; `null` in release.
 */
@Composable
fun WearApp(
    cardRepository: CardRepository,
    sortPreferenceRepository: SortPreferenceRepository,
    usageRecorder: CardUsageRecorder = NoOpCardUsageRecorder,
    onImportSampleCards: (() -> Unit)? = null,
) {
    MyLoyaltyCardsWearTheme {
        val navController = rememberSwipeDismissableNavController()
        val scope = rememberCoroutineScope()
        val cards by cardRepository.cards.collectAsState()
        val sortMode by sortPreferenceRepository.sortMode.collectAsState(initial = WatchSortMode.DEFAULT)
        // One generator for the app's lifetime so its barcode cache survives open→close→re-open (AC10).
        val barcodeGenerator = remember { WearBarcodeGenerator() }

        AppScaffold {
            SwipeDismissableNavHost(
                navController = navController,
                startDestination = ROUTE_CARDS,
            ) {
                composable(ROUTE_CARDS) {
                    CardListScreen(
                        cards = cards,
                        sortMode = sortMode,
                        onCardClick = { cardId -> navController.navigateOnce("$ROUTE_BARCODE/$cardId") },
                        onOpenSort = { navController.navigateOnce(ROUTE_SORT) },
                        onImportSampleCards = onImportSampleCards,
                    )
                }
                composable(ROUTE_SORT) {
                    SortPickerScreen(
                        selected = sortMode,
                        onModeSelected = { mode ->
                            // Persist watch-locally (never transmitted to the phone — AC6), then pop
                            // once the write is applied so the list is already re-ordered on return.
                            scope.launch {
                                sortPreferenceRepository.setSortMode(mode)
                                navController.popBackStack()
                            }
                        },
                    )
                }
                composable(
                    route = "$ROUTE_BARCODE/{$ARG_CARD_ID}",
                    arguments = listOf(navArgument(ARG_CARD_ID) { type = NavType.StringType }),
                ) { backStackEntry ->
                    // The live cards and the sort mode, not one resolved card: the barcode pages
                    // through the list's order as it stood at opening (Story 23.3, decision 4), so
                    // it takes that order from the same cards and mode the list sorted.
                    BarcodeScreen(
                        openedCardId = backStackEntry.arguments?.getString(ARG_CARD_ID),
                        cards = cards,
                        sortMode = sortMode,
                        barcodeGenerator = barcodeGenerator,
                        usageRecorder = usageRecorder,
                        onDismiss = { navController.popBackStack() },
                    )
                }
            }
        }
    }
}

/**
 * Navigates to [route] only from a fully-resumed destination. Guards against a double-tap pushing the
 * same screen twice: the second tap fires before the first navigation completes, when the source is
 * no longer `RESUMED`. Without it, a double-tap on a card would open the barcode twice — a duplicate
 * confirm haptic and a duplicate `CARD_USED` usage event (AC8), which once Story 10-6 wires the real
 * transport would double-count a single open toward 10-3's "frequently used" sort.
 */
private fun NavController.navigateOnce(route: String) {
    if (currentBackStackEntry?.lifecycle?.currentState?.isAtLeast(Lifecycle.State.RESUMED) == true) {
        navigate(route)
    }
}

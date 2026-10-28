package com.iferoporefi.myloyaltycards.wear.presentation

import com.iferoporefi.myloyaltycards.wear.data.WearCard
import com.iferoporefi.myloyaltycards.wear.sort.CardSorter
import com.iferoporefi.myloyaltycards.wear.sort.WatchSortMode
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds

/**
 * How a card reached the barcode screen (Story 23.3, decision 5).
 *
 * [Opened] is the card the list opened: it plays the open haptic and counts as used at once, as
 * every barcode did before rotary paged. [Paged] is a card the rotary input — or TalkBack's "Next
 * card" / "Previous card", standing in for it — moved to: the rotary's own detent haptic marks it,
 * and it counts as used only once it has stayed on screen for [BarcodePaging.usageDelay]. A return
 * to the opened card by rotary is [Paged] too.
 */
enum class BarcodeArrival {
    Opened,
    Paged,
}

/**
 * The barcode screen's paging through the cards, as pure policy (`cardi-watch-grammar.md` §8;
 * Story 23.3, decisions 4–6), mirroring watchOS's `WatchBarcodePaging`.
 *
 * `BarcodeScreen` holds the state and reads the rotary input; this holds the arithmetic. No Compose
 * and no Android, so `BarcodePagingTest` runs it on the JVM.
 */
object BarcodePaging {
    /** How long a paged card has to stay on screen before it counts as used (decision 5). */
    val PAGED_USAGE_DELAY: Duration = 1.seconds

    /**
     * The order the list shows [cards] in under [sortMode] — the same [CardSorter] sort the list
     * runs — as ids. Taken once, when the barcode opens, and held for the visit.
     */
    fun heldOrder(cards: List<WearCard>, sortMode: WatchSortMode, sorter: CardSorter): List<String> =
        sorter.sort(cards, sortMode).map { it.id }

    /**
     * The cards paging can reach: the held order minus any card that has gone since — in the HELD
     * order, never the live one, so a sync or a usage re-sort under "Frequently used" cannot
     * reshuffle the cards mid-scan. A card added since is not in the held order, so it is not
     * reachable either.
     */
    fun reachableIds(heldOrder: List<String>, liveIds: Collection<String>): List<String> {
        val live = liveIds.toHashSet()
        return heldOrder.filter { it in live }
    }

    /**
     * [page] clamped to the first and the last of [count] cards: paging stops at both ends and
     * never wraps (decision 6). Zero when nothing is reachable.
     */
    fun clampedPage(page: Int, count: Int): Int =
        if (count <= 0) 0 else page.coerceIn(0, count - 1)

    /** The card at [page], clamped as above — `null` only when nothing is reachable. */
    fun idAtPage(page: Int, reachable: List<String>): String? =
        if (reachable.isEmpty()) null else reachable[clampedPage(page, reachable.size)]

    /**
     * Whether paging moves anything at all: two or more reachable cards, the one on screen among
     * them. With one card there is nowhere to go.
     */
    fun pages(currentId: String, reachable: List<String>): Boolean =
        reachable.size >= 2 && currentId in reachable

    /**
     * The page one move by [step] (+1 onward, -1 back) from [currentId] lands on, or `null` where
     * that move does not exist: at either end (no wrap), with one card, or with the card on screen
     * gone. TalkBack offers "Next card" and "Previous card" only where this is non-null.
     */
    fun pageAfter(currentId: String, reachable: List<String>, step: Int): Int? {
        if (!pages(currentId, reachable)) return null
        val current = reachable.indexOf(currentId)
        val target = clampedPage(current + step, reachable.size)
        return target.takeIf { it != current }
    }

    /**
     * How long a card has to stay on screen before it counts as used (decision 5): at once for the
     * opened card, as before rotary paged; one second for a card paging moved to, so skimming past
     * cards sends nothing and cannot inflate "Frequently used".
     */
    fun usageDelay(arrival: BarcodeArrival): Duration =
        when (arrival) {
            BarcodeArrival.Opened -> Duration.ZERO
            BarcodeArrival.Paged -> PAGED_USAGE_DELAY
        }
}

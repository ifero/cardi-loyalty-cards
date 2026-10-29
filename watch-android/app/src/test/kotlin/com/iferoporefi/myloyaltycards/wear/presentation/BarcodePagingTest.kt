package com.iferoporefi.myloyaltycards.wear.presentation

import com.iferoporefi.myloyaltycards.wear.data.WearCard
import com.iferoporefi.myloyaltycards.wear.sort.CardSorter
import com.iferoporefi.myloyaltycards.wear.sort.WatchSortMode
import java.text.Collator
import java.util.Locale
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The barcode's paging policy (Story 23.3, decisions 4–6; `cardi-watch-grammar.md` §8), mirroring
 * watchOS's `WatchBarcodePaging`: the held order under a re-sort, gone and new cards, both ends, one
 * card, and both usage delays.
 */
class BarcodePagingTest {
    private val sorter = CardSorter(
        Collator.getInstance(Locale.ITALIAN).apply { strength = Collator.PRIMARY },
    )

    private fun card(id: String, usageCount: Int = 0, isFavorite: Boolean = false) = WearCard(
        id = id,
        name = id,
        usageCount = usageCount,
        createdAt = "2026-01-01T00:00:00.000Z",
        isFavorite = isFavorite,
    )

    // --- The held order --------------------------------------------------------------------------

    @Test
    fun heldOrder_isTheListsOwnSortAtOpening() {
        val cards = listOf(card("low", usageCount = 1), card("high", usageCount = 9), card("fav", isFavorite = true))
        val listOrder = sorter.sort(cards, WatchSortMode.FREQUENT).map { it.id }

        assertEquals(listOf("fav", "high", "low"), listOrder)
        assertEquals(listOrder, BarcodePaging.heldOrder(cards, WatchSortMode.FREQUENT, sorter))
    }

    @Test
    fun heldOrder_followsTheSortModeTheListShowed() {
        val cards = listOf(card("Coop", usageCount = 9), card("Auchan", usageCount = 1))

        assertEquals(listOf("Coop", "Auchan"), BarcodePaging.heldOrder(cards, WatchSortMode.FREQUENT, sorter))
        assertEquals(listOf("Auchan", "Coop"), BarcodePaging.heldOrder(cards, WatchSortMode.AZ, sorter))
    }

    @Test
    fun reachable_keepsTheHeldOrderWhenTheLiveListReSorts() {
        // Opened under "Frequently used": a, b, c. Using c while the barcode is open re-sorts the
        // live list to c, a, b — the cards paging reaches stay in the order the visit opened with.
        val opened = listOf(card("a", usageCount = 3), card("b", usageCount = 2), card("c", usageCount = 1))
        val held = BarcodePaging.heldOrder(opened, WatchSortMode.FREQUENT, sorter)
        val reSorted = sorter.sort(
            listOf(card("a", usageCount = 3), card("b", usageCount = 2), card("c", usageCount = 9)),
            WatchSortMode.FREQUENT,
        ).map { it.id }

        assertEquals(listOf("c", "a", "b"), reSorted)
        assertEquals(listOf("a", "b", "c"), BarcodePaging.reachableIds(held, reSorted))
    }

    @Test
    fun reachable_skipsACardGoneSinceOpening() {
        assertEquals(
            listOf("a", "c"),
            BarcodePaging.reachableIds(heldOrder = listOf("a", "b", "c"), liveIds = listOf("c", "a")),
        )
    }

    @Test
    fun reachable_neverIncludesACardAddedSinceOpening() {
        assertEquals(
            listOf("a", "b"),
            BarcodePaging.reachableIds(heldOrder = listOf("a", "b"), liveIds = listOf("new", "b", "a")),
        )
    }

    @Test
    fun reachable_isEmptyWhenEveryHeldCardIsGone() {
        assertEquals(emptyList<String>(), BarcodePaging.reachableIds(listOf("a", "b"), listOf("x")))
    }

    // --- The ends: no wrap -----------------------------------------------------------------------

    @Test
    fun clampedPage_stopsAtBothEnds() {
        assertEquals(0, BarcodePaging.clampedPage(-1, count = 3))
        assertEquals(0, BarcodePaging.clampedPage(0, count = 3))
        assertEquals(1, BarcodePaging.clampedPage(1, count = 3))
        assertEquals(2, BarcodePaging.clampedPage(2, count = 3))
        assertEquals(2, BarcodePaging.clampedPage(3, count = 3))
        assertEquals(2, BarcodePaging.clampedPage(99, count = 3))
    }

    @Test
    fun clampedPage_isZeroWithNothingReachable() {
        assertEquals(0, BarcodePaging.clampedPage(5, count = 0))
        assertEquals(0, BarcodePaging.clampedPage(-5, count = 0))
    }

    @Test
    fun idAtPage_neverWrapsPastEitherEnd() {
        val reachable = listOf("a", "b", "c")

        assertEquals("a", BarcodePaging.idAtPage(-1, reachable))
        assertEquals("b", BarcodePaging.idAtPage(1, reachable))
        assertEquals("c", BarcodePaging.idAtPage(3, reachable))
        assertNull(BarcodePaging.idAtPage(0, emptyList()))
    }

    @Test
    fun pageAfter_movesOneCardEitherWay() {
        val reachable = listOf("a", "b", "c")

        assertEquals(2, BarcodePaging.pageAfter("b", reachable, step = 1))
        assertEquals(0, BarcodePaging.pageAfter("b", reachable, step = -1))
    }

    @Test
    fun pageAfter_hasNoMovePastTheLastOrBeforeTheFirst() {
        val reachable = listOf("a", "b", "c")

        assertNull(BarcodePaging.pageAfter("c", reachable, step = 1))
        assertNull(BarcodePaging.pageAfter("a", reachable, step = -1))
        assertEquals(1, BarcodePaging.pageAfter("c", reachable, step = -1))
        assertEquals(1, BarcodePaging.pageAfter("a", reachable, step = 1))
    }

    @Test
    fun pageAfter_movesFromTheCardOnScreenAfterAGoneCardIsSkipped() {
        // b was deleted mid-visit: from a, the next move lands on c, at its new position.
        val reachable = BarcodePaging.reachableIds(listOf("a", "b", "c"), liveIds = listOf("a", "c"))

        assertEquals(1, BarcodePaging.pageAfter("a", reachable, step = 1))
        assertEquals("c", BarcodePaging.idAtPage(1, reachable))
    }

    // --- One card, and the card on screen gone ---------------------------------------------------

    @Test
    fun pages_needsTwoReachableCardsIncludingTheOneOnScreen() {
        assertTrue(BarcodePaging.pages("a", listOf("a", "b")))
        assertFalse(BarcodePaging.pages("a", listOf("a")))
        assertFalse(BarcodePaging.pages("a", emptyList()))
        assertFalse(BarcodePaging.pages("gone", listOf("a", "b")))
    }

    @Test
    fun oneCard_offersNoMoveEitherWay() {
        assertNull(BarcodePaging.pageAfter("a", listOf("a"), step = 1))
        assertNull(BarcodePaging.pageAfter("a", listOf("a"), step = -1))
    }

    @Test
    fun oneCardLeftAfterTheOthersWentMidVisit_offersNoMove() {
        val reachable = BarcodePaging.reachableIds(listOf("a", "b", "c"), liveIds = listOf("b"))

        assertEquals(listOf("b"), reachable)
        assertFalse(BarcodePaging.pages("b", reachable))
        assertNull(BarcodePaging.pageAfter("b", reachable, step = 1))
    }

    @Test
    fun cardOnScreenGone_offersNoMove() {
        assertNull(BarcodePaging.pageAfter("gone", listOf("a", "b"), step = 1))
        assertNull(BarcodePaging.pageAfter("gone", listOf("a", "b"), step = -1))
    }

    // --- The usage delays ------------------------------------------------------------------------

    @Test
    fun usageDelay_isImmediateForTheOpenedCard() {
        assertEquals(Duration.ZERO, BarcodePaging.usageDelay(BarcodeArrival.Opened))
    }

    @Test
    fun usageDelay_isOneSecondForAPagedCard() {
        assertEquals(1.seconds, BarcodePaging.usageDelay(BarcodeArrival.Paged))
    }
}

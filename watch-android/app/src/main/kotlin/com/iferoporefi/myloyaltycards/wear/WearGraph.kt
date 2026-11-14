package com.iferoporefi.myloyaltycards.wear

import android.content.Context
import com.iferoporefi.myloyaltycards.wear.data.CardRepository
import com.iferoporefi.myloyaltycards.wear.data.DebugSampleCards
import com.iferoporefi.myloyaltycards.wear.data.RoomCardRepository
import com.iferoporefi.myloyaltycards.wear.data.WearDatabase
import com.iferoporefi.myloyaltycards.wear.data.toEntity
import com.iferoporefi.myloyaltycards.wear.sync.DataLayerWearSyncTransport
import com.iferoporefi.myloyaltycards.wear.sync.SnapshotApplier
import com.iferoporefi.myloyaltycards.wear.sync.WearSyncCoordinator
import com.iferoporefi.myloyaltycards.wear.usage.CardUsageRecorder
import com.iferoporefi.myloyaltycards.wear.usage.OutboxCardUsageRecorder
import com.iferoporefi.myloyaltycards.wear.usage.UsageOutbox
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Minimal, process-lifetime dependency graph (manual DI — this module uses no Hilt).
 *
 * Everything here is a **process singleton**, deliberately: [MainActivity] is recreated on any
 * configuration change (locale, font scale, Wear theme) or with the "Don't keep activities"
 * developer option, and creating the repository/scope per `onCreate` would leak a scope on every
 * recreation and reset [RoomCardRepository.cards] to empty (a visible flash while Room re-queries).
 * A single instance owned here survives recreation, so `WhileSubscribed` on the card `StateFlow`
 * stays warm across it. Story 10-6 should hang its Data Layer singletons here for the same reason.
 */
object WearGraph {
    /**
     * Application-lifetime coroutine scope for the card `StateFlow` sharing and the DEBUG seed
     * write. It is never cancelled because it lives for the whole process — the standard shape for
     * an application-scoped scope; the OS reclaims it when the process dies.
     */
    val applicationScope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    @Volatile
    private var cardRepositoryInstance: RoomCardRepository? = null

    private fun repository(context: Context): RoomCardRepository =
        cardRepositoryInstance ?: synchronized(this) {
            cardRepositoryInstance
                ?: RoomCardRepository(WearDatabase.getInstance(context), applicationScope)
                    .also { cardRepositoryInstance = it }
        }

    /**
     * The process-singleton card repository as the **read-only** [CardRepository] interface — the
     * type the UI is wired with (`WearApp`). Returning the interface rather than the concrete
     * [RoomCardRepository] keeps the write surface (`upsertAll`/`deleteAll`/`seedIfEmpty`) off every
     * UI-facing reference, so the read-only invariant (AC9) holds structurally at the composition
     * root too — not only inside Composables. Created lazily on first use.
     */
    fun cardRepository(context: Context): CardRepository = repository(context)

    /**
     * DEBUG-only sample-card seed (AC12): atomic and empty-state-gated via
     * [RoomCardRepository.seedIfEmpty]. Call **only** from a `BuildConfig.DEBUG` branch — that is
     * what keeps this method, and with it [DebugSampleCards], unreachable in release, so R8 strips
     * both from the APK (verified: 0 references to `DebugSampleCards` in the release dex).
     *
     * `demo` selects the store-screenshot set (Story 24.6); the caller passes
     * `BuildConfig.WEAR_DEMO_SEED`.
     */
    fun seedSampleCardsIfEmpty(context: Context, demo: Boolean) {
        applicationScope.launch {
            repository(context).seedIfEmpty(DebugSampleCards.forSeed(demo).map { it.toEntity() })
        }
    }

    // --- Story 10-6: phone <-> watch sync -------------------------------------------------

    @Volatile
    private var usageOutboxInstance: UsageOutbox? = null

    @Volatile
    private var syncStarted = false

    private fun usageOutbox(context: Context): UsageOutbox =
        usageOutboxInstance ?: synchronized(this) {
            usageOutboxInstance ?: UsageOutbox(
                dao = WearDatabase.getInstance(context).usageOutboxDao(),
                transport = DataLayerWearSyncTransport(context),
            ).also { usageOutboxInstance = it }
        }

    /**
     * The `CARD_USED` recorder handed to the barcode screen — the one-line swap Story 10-4's
     * `NoOpCardUsageRecorder` was a placeholder for.
     */
    fun cardUsageRecorder(context: Context): CardUsageRecorder =
        OutboxCardUsageRecorder(outbox = usageOutbox(context), scope = applicationScope)

    /**
     * Begin phone ↔ watch sync. Idempotent, and a **process singleton** for the same reason the
     * repository is: `MainActivity` is recreated on every configuration change, and re-running
     * the start-up read plus re-registering the two Data Layer listeners (`DataClient` for
     * snapshots, `CapabilityClient` for reachability) each time would burn the radio for nothing.
     *
     * The [start] side effect is a parameter only so a test can substitute a counter for the real
     * coordinator, which would otherwise reach live Play services. Production always uses the
     * default; nothing else may pass this argument.
     */
    fun startSync(context: Context, start: (Context) -> Unit = ::startRealCoordinator) {
        if (syncStarted) return
        synchronized(this) {
            if (syncStarted) return
            syncStarted = true
        }
        start(context)
    }

    private fun startRealCoordinator(context: Context) {
        WearSyncCoordinator(
            transport = DataLayerWearSyncTransport(context),
            applier = SnapshotApplier(WearDatabase.getInstance(context)),
            outbox = usageOutbox(context),
            scope = applicationScope,
        ).start()
    }

    /**
     * Test-only: clear the once-only [syncStarted] latch. Required because [WearGraph] is a
     * process singleton whose state outlives an individual test, so a test asserting the latch
     * must start from a known state regardless of what ran before it.
     */
    @androidx.annotation.VisibleForTesting
    internal fun resetSyncStateForTests() {
        synchronized(this) { syncStarted = false }
    }
}

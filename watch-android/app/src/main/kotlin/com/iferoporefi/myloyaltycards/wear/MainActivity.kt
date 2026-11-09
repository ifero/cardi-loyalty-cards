package com.iferoporefi.myloyaltycards.wear

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.iferoporefi.myloyaltycards.wear.crash.WearCrashReporting
import com.iferoporefi.myloyaltycards.wear.prefs.DataStoreSortPreferenceRepository
import com.iferoporefi.myloyaltycards.wear.prefs.sortPreferencesDataStore
import com.iferoporefi.myloyaltycards.wear.presentation.WearApp

/**
 * Sole entry point of the Wear OS companion app — a thin `setContent` host that wires the
 * repositories and hands them to [WearApp].
 *
 * Manual dependency injection keeps the module's dependency surface minimal (no Hilt). The card
 * store is a **process singleton** owned by [WearGraph] — not created here per `onCreate` — so it
 * survives Activity recreation (see [WearGraph]). Story 10-5 wires the Room-backed store behind
 * Story 10-3's read-only [com.iferoporefi.myloyaltycards.wear.data.CardRepository] interface (the
 * type [WearGraph.cardRepository] returns), so this host cannot mutate card data and the UI is
 * unchanged.
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val cardRepository = WearGraph.cardRepository(applicationContext)
        val sortPreferenceRepository =
            DataStoreSortPreferenceRepository(applicationContext.sortPreferencesDataStore)

        // DEBUG-only, empty-state-gated sample-card seeder (AC12). BuildConfig.DEBUG is a
        // compile-time constant, so R8 removes this branch — and, via it, WearGraph.seedSampleCardsIfEmpty
        // and DebugSampleCards — from the release APK; the empty state only renders the seed button
        // when this callback is non-null. The seed itself is atomic + empty-state-gated inside
        // WearGraph, so it can never overwrite real cards that Story 10-6 syncs in concurrently.
        val onImportSampleCards: (() -> Unit)? =
            if (BuildConfig.DEBUG) {
                { WearGraph.seedSampleCardsIfEmpty(applicationContext) }
            } else {
                null
            }

        // Sentry test crash (Story 24.5), present only in a build made with -PsentryTestCrash=true.
        // A compile-time constant like DEBUG above, so R8 removes the trigger from every other build.
        val onTestCrash: (() -> Unit)? =
            if (BuildConfig.SENTRY_TEST_CRASH) {
                { WearCrashReporting.crashForTest() }
            } else {
                null
            }

        // Usage-event seam (AC8 of Story 10-4), now backed by Story 10-6's durable outbox: a card
        // open is persisted first and delivered whenever the phone is next reachable.
        val usageRecorder = WearGraph.cardUsageRecorder(applicationContext)

        // Phone -> watch sync (Story 10-6). Idempotent and process-scoped, so the repeated calls
        // an Activity recreation produces cost nothing.
        WearGraph.startSync(applicationContext)

        setContent {
            WearApp(
                cardRepository = cardRepository,
                sortPreferenceRepository = sortPreferenceRepository,
                usageRecorder = usageRecorder,
                onImportSampleCards = onImportSampleCards,
                onTestCrash = onTestCrash,
            )
        }
    }
}

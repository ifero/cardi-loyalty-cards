package com.iferoporefi.myloyaltycards.wear.crash

import android.content.Context
import com.iferoporefi.myloyaltycards.wear.BuildConfig
import io.sentry.SentryOptions
import io.sentry.android.core.SentryAndroid
import io.sentry.android.core.SentryAndroidOptions

/**
 * Sentry for the Wear OS app (Story 24.5): crash diagnostics only, sent to the Wear project in the
 * EU organisation, trimmed as Story 24-1 trims the phone.
 *
 * Initialised once, from [com.iferoporefi.myloyaltycards.wear.WearApplication], and only when a
 * DSN was baked into the build (`WEAR_SENTRY_DSN`) and the build is not DEBUG. Otherwise nothing is
 * initialised and the app reports nothing, with no log line. The SDK's own manifest auto-init is
 * switched off in `AndroidManifest.xml`, so this is the only way in.
 */
object WearCrashReporting {

    /**
     * The release prefix. Deliberately the code namespace, not the `applicationId`: the Wear app
     * shares `com.iferoporefi.myloyaltycards` with the phone, and the `.wear` suffix keeps the two
     * apps' releases apart in Sentry.
     */
    const val RELEASE_PACKAGE = "com.iferoporefi.myloyaltycards.wear"

    /** `com.iferoporefi.myloyaltycards.wear@<versionName>+<versionCode>`, the phone's shape. */
    fun release(versionName: String, versionCode: Int): String =
        "$RELEASE_PACKAGE@$versionName+$versionCode"

    /** Initialise only with a DSN, and never in a debug build. */
    fun shouldInit(dsn: String, isDebugBuild: Boolean): Boolean = dsn.isNotBlank() && !isDebugBuild

    /**
     * Every option this app sets. Kept apart from [init] so a JVM test can pin each one.
     *
     * Crash and error diagnostics only (Story 24-1, decision 1): no tracing, no profiling, no
     * session pings, no screenshots or view hierarchy, no user-interaction, system or network
     * breadcrumbs, no client reports. `sendDefaultPii` is off, and [WearEventScrubber] (as
     * `beforeSend` and `beforeBreadcrumb`) applies the phone's whole trim: the user, device and
     * installation identifiers the SDK still attaches, UUIDs in error text, sensitive keys, and
     * console / touch / UI breadcrumbs.
     */
    // `sendDefaultPii` is deprecated in 8.x in favour of `dataCollection`, and kept on purpose: the
    // spec names it, and its replacement is a trap. Configuring ANY `dataCollection` field flips
    // every unset one to its "collect" default (`DataCollectionResolver.explicitOrDefault`), so a
    // partial `dataCollection` would collect more than `sendDefaultPii = false` does. Revisit on 9.0.
    @Suppress("DEPRECATION")
    fun configure(options: SentryAndroidOptions, dsn: String, release: String) {
        options.dsn = dsn
        options.release = release
        options.environment = ENVIRONMENT

        options.isSendDefaultPii = false
        options.isAttachServerName = false

        options.tracesSampleRate = null
        options.profilesSampleRate = null
        options.isEnableAutoActivityLifecycleTracing = false
        options.isEnableUserInteractionTracing = false
        options.isEnableFramesTracking = false
        options.isEnableAppStartProfiling = false

        options.isEnableAutoSessionTracking = false
        options.isSendClientReports = false

        options.isAttachScreenshot = false
        options.isAttachViewHierarchy = false
        options.isEnableUserInteractionBreadcrumbs = false
        options.isEnableSystemEventBreadcrumbs = false
        options.isEnableNetworkEventBreadcrumbs = false

        options.beforeSend = SentryOptions.BeforeSendCallback { event, _ -> WearEventScrubber.scrub(event) }
        options.beforeBreadcrumb =
            SentryOptions.BeforeBreadcrumbCallback { breadcrumb, _ -> WearEventScrubber.scrubBreadcrumb(breadcrumb) }
    }

    fun init(context: Context) {
        if (!shouldInit(BuildConfig.SENTRY_DSN, BuildConfig.DEBUG)) return
        SentryAndroid.init(context) { options ->
            configure(
                options = options,
                dsn = BuildConfig.SENTRY_DSN,
                release = release(BuildConfig.VERSION_NAME, BuildConfig.VERSION_CODE),
            )
        }
    }

    /**
     * Throws [SentryTestCrashException] on the calling (main) thread, which crashes the app and
     * leaves a Sentry event behind for the next launch to send. Reachable only from a build made
     * with `-PsentryTestCrash=true` (`BuildConfig.SENTRY_TEST_CRASH`), never from a release lane.
     */
    fun crashForTest(): Nothing = throw SentryTestCrashException()

    private const val ENVIRONMENT = "production"
}

/**
 * The deliberate test crash (Story 24.5). Its own class so the deobfuscated stack in Sentry shows a
 * name R8 would otherwise have renamed: seeing `SentryTestCrashException` and
 * `WearCrashReporting.crashForTest` there is the proof the mapping upload worked.
 */
class SentryTestCrashException : RuntimeException("Wear OS Sentry test crash (Story 24.5)")

package com.iferoporefi.myloyaltycards.wear.crash

import io.sentry.Breadcrumb
import io.sentry.Hint
import io.sentry.SentryEvent
import io.sentry.android.core.SentryAndroidOptions
import io.sentry.protocol.User
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

/** Story 24.5: the Wear app's Sentry options, pinned one by one. */
class WearCrashReportingTest {

    private val dsn = "https://public@o0.ingest.de.sentry.io/0"

    private fun configured(): SentryAndroidOptions =
        SentryAndroidOptions().also {
            WearCrashReporting.configure(it, dsn, WearCrashReporting.release("1.0.0", 2_000_040))
        }

    @Test
    fun `initialises only with a DSN and never in a debug build`() {
        assertTrue(WearCrashReporting.shouldInit(dsn, isDebugBuild = false))
        assertFalse(WearCrashReporting.shouldInit(dsn, isDebugBuild = true))
        assertFalse(WearCrashReporting.shouldInit("", isDebugBuild = false))
        assertFalse(WearCrashReporting.shouldInit("   ", isDebugBuild = false))
    }

    @Test
    fun `names the release after the Wear namespace, version name and version code`() {
        assertEquals(
            "com.iferoporefi.myloyaltycards.wear@1.0.0+2000040",
            WearCrashReporting.release("1.0.0", 2_000_040),
        )
        assertEquals("com.iferoporefi.myloyaltycards.wear@1.0.0+2000040", configured().release)
    }

    @Test
    fun `sets the DSN and the production environment`() {
        val options = configured()
        assertEquals(dsn, options.dsn)
        assertEquals("production", options.environment)
    }

    @Suppress("DEPRECATION")
    @Test
    fun `sends no default PII and no server name`() {
        val options = configured()
        assertFalse(options.isSendDefaultPii)
        assertFalse(options.isAttachServerName)
        // Left unconfigured on purpose; see WearCrashReporting.configure.
        assertFalse(options.dataCollection.isExplicitlyConfigured)
    }

    @Test
    fun `turns tracing and profiling off`() {
        val options = configured()
        assertNull(options.tracesSampleRate)
        assertNull(options.profilesSampleRate)
        assertFalse(options.isTracingEnabled)
        assertFalse(options.isEnableAutoActivityLifecycleTracing)
        assertFalse(options.isEnableUserInteractionTracing)
        assertFalse(options.isEnableFramesTracking)
        assertFalse(options.isEnableAppStartProfiling)
    }

    @Test
    fun `turns automatic session tracking and client reports off`() {
        val options = configured()
        assertFalse(options.isEnableAutoSessionTracking)
        assertFalse(options.isSendClientReports)
    }

    @Test
    fun `attaches no screenshot or view hierarchy and records no interaction, system or network breadcrumbs`() {
        val options = configured()
        assertFalse(options.isAttachScreenshot)
        assertFalse(options.isAttachViewHierarchy)
        assertFalse(options.isEnableUserInteractionBreadcrumbs)
        assertFalse(options.isEnableSystemEventBreadcrumbs)
        assertFalse(options.isEnableNetworkEventBreadcrumbs)
    }

    @Test
    fun `routes every event through the scrubber`() {
        val beforeSend = assertNotNullAndGet(configured().beforeSend)
        val event = SentryEvent().apply { user = User().apply { id = "installation-id" } }

        val sent = beforeSend.execute(event, Hint())

        assertNotNull(sent)
        assertNull(sent!!.user)
    }

    @Test
    fun `routes every breadcrumb through the breadcrumb scrubber`() {
        val beforeBreadcrumb = assertNotNullAndGet(configured().beforeBreadcrumb)

        assertNull(beforeBreadcrumb.execute(Breadcrumb().apply { category = "ui.lifecycle" }, Hint()))
        val kept = beforeBreadcrumb.execute(
            Breadcrumb().apply {
                category = "navigation"
                message = "card 3f2b9c1e-8a4d-4f6e-9b7a-1c2d3e4f5a6b"
            },
            Hint(),
        )
        assertEquals("card [uuid]", kept?.message)
    }

    @Test
    fun `the test crash throws its own exception type`() {
        val thrown = assertThrows(SentryTestCrashException::class.java) { WearCrashReporting.crashForTest() }
        assertEquals("Wear OS Sentry test crash (Story 24.5)", thrown.message)
    }

    private fun <T> assertNotNullAndGet(value: T?): T {
        assertNotNull(value)
        return value!!
    }
}

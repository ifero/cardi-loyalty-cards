package com.iferoporefi.myloyaltycards.wear.crash

import android.content.pm.PackageManager
import com.iferoporefi.myloyaltycards.wear.WearApplication
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/**
 * Story 24.5: the wiring the pure helpers' tests cannot see. Robolectric reads the merged manifest,
 * so these fail if the `android:name=".WearApplication"` entry is dropped (crash reporting would
 * never start) or if Sentry's manifest auto-init is switched back on (the SDK's `SentryInitProvider`
 * would then init with no DSN, or skip [WearCrashReporting.configure]'s trimming).
 */
@RunWith(RobolectricTestRunner::class)
class WearCrashReportingWiringTest {

    private val application = RuntimeEnvironment.getApplication()

    @Test
    fun `the app's Application is WearApplication`() {
        assertTrue(
            "Expected WearApplication, got ${application.javaClass.name}",
            application is WearApplication,
        )
    }

    @Test
    fun `the merged manifest switches Sentry's auto-init off`() {
        val metaData = application.packageManager
            .getApplicationInfo(application.packageName, PackageManager.GET_META_DATA)
            .metaData
        assertNotNull("The merged manifest has no <meta-data> at all", metaData)
        assertTrue("io.sentry.auto-init is missing", metaData.containsKey("io.sentry.auto-init"))
        assertFalse(metaData.getBoolean("io.sentry.auto-init", true))
    }
}

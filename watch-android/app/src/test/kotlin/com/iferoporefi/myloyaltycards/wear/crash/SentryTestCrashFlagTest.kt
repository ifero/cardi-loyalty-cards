package com.iferoporefi.myloyaltycards.wear.crash

import com.iferoporefi.myloyaltycards.wear.BuildConfig
import org.junit.Assert.assertFalse
import org.junit.Test

/**
 * Story 24.5: the test-crash trigger exists only in a build made with `-PsentryTestCrash=true`.
 * CI's `testDebugUnitTest` passes no such property, so this fails if the build script's default
 * ever flips and an unflagged build would ship the crash button.
 */
class SentryTestCrashFlagTest {
    @Test
    fun `an unflagged build has the test-crash trigger off`() {
        assertFalse(BuildConfig.SENTRY_TEST_CRASH)
    }
}

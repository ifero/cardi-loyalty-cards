package com.iferoporefi.myloyaltycards.wear

import android.app.Application
import com.iferoporefi.myloyaltycards.wear.crash.WearCrashReporting

/**
 * The app's `Application` (Story 24.5). It exists for one reason: crash reporting has to start
 * before any Activity, so a crash during the first `onCreate` is still caught. Everything else
 * stays where it was ([WearGraph] owns the process singletons, [MainActivity] wires them).
 */
class WearApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        WearCrashReporting.init(this)
    }
}

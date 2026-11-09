/*
 * Wear OS companion app — pure Kotlin + Compose for Wear OS.
 *
 * No React Native, no JavaScript, no Expo module lives here, exactly as
 * `targets/watch/` is pure Swift/SwiftUI. See ../README.md.
 */
plugins {
    alias(libs.plugins.android.application)
    // The Compose compiler ships with Kotlin (2.0+) and is applied as its own
    // plugin. AGP 9's built-in Kotlin support covers plain Kotlin compilation,
    // but NOT the Compose compiler, so this is still required.
    alias(libs.plugins.compose.compiler)
    // KSP runs Room's annotation processor (Story 10.5). It coexists with AGP 9's
    // built-in Kotlin — built-in Kotlin only requires KGP >= 2.2.10 and does not
    // replace KSP — so it is applied here the normal way.
    alias(libs.plugins.ksp)
    // Room's schema-export plugin (configured in the `room { }` block below).
    alias(libs.plugins.room)
    // Sentry (Story 24.5): uploads the release R8 mapping so Wear crashes deobfuscate. Configured
    // in the `sentry { }` block below to install and instrument nothing.
    alias(libs.plugins.sentry.android.gradle)
}

/**
 * Play allocates `versionCode` per *application ID*, and this Wear APK shares
 * `com.iferoporefi.myloyaltycards` with the phone app — so it is a third
 * consumer of one shared counter space, after the phone's beta and production
 * bands. Story 16.7 introduced `PRODUCTION_VERSION_CODE_OFFSET = 1_000_000` in
 * `app.config.ts` for exactly this reason; the Wear APK takes the next band up.
 *
 * Bands (see ../README.md § versionCode bands):
 *   0         phone,   alpha/beta   (`beta-releases.yml`, bare run number)
 *   1_000_000 phone,   production   (`store-upload.yml`)
 *   2_000_000 Wear OS, alpha/beta   (`beta-releases.yml`)
 *   3_000_000 Wear OS, production   (`store-upload.yml`)
 *   4_000_000 phone,   nightly      (`nightly-builds.yml`, Story 16.36)
 *   5_000_000 Wear OS, nightly      (`nightly-builds.yml`, Story 16.36)
 *
 * ⚠️ THE NIGHTLY BANDS SIT ABOVE PRODUCTION, and that has a consequence worth
 * knowing before it surprises someone: a device on a nightly build carries a
 * HIGHER versionCode than any production release, so it will never receive a
 * production build as an update. That is acceptable for an internal track whose
 * testers opted in, and it is the price of keeping every pipeline's counter in
 * its own collision-free band. Leaving the internal track means reinstalling.
 *
 * Deliberately NOT read from `app.config.ts`: the two projects share no build
 * system, and coupling them would reintroduce the "anything in `android/` is
 * regenerated" trap that Story 16.7 exists to document.
 */
val wearVersionCodeBand = 2_000_000

/**
 * Offset added to {@link wearVersionCodeBand} for a **production** Wear release
 * (Story 16.35). It exists because `GITHUB_RUN_NUMBER` is scoped **per workflow
 * file**: `beta-releases.yml` run 40 and `store-upload.yml` run 40 are unrelated
 * releases, so feeding both into one band would have them both compute
 * `2_000_040` — the two-counters-one-band collision Story 16.7 documents.
 *
 * The offset is applied **here**, not as arithmetic in the workflow. That
 * deliberately diverges from the phone app, whose `PRODUCTION_VERSION_CODE_OFFSET`
 * is declared in `app.config.ts` but applied as `$((GITHUB_RUN_NUMBER + 1000000))`
 * in `store-upload.yml`, kept honest only by a "must stay in sync" comment. The
 * phone has to do that because `app.config.ts` runs at prebuild and reads a single
 * env var; Gradle has no such constraint, so the band, the offset and the
 * validation all stay in one file with nothing to keep in sync. Do not "restore
 * consistency" with the phone by moving the arithmetic into YAML.
 */
val wearProductionVersionCodeOffset = 1_000_000

/** Play rejects any `versionCode` above this. */
val playMaxVersionCode = 2_100_000_000

/**
 * Offset added to {@link wearVersionCodeBand} for a **nightly** Wear build
 * (Story 16.36), landing it in the `5_000_000` band.
 *
 * It exists for exactly the reason the production offset does: `GITHUB_RUN_NUMBER`
 * is scoped **per workflow file**, so `nightly-builds.yml` starts a FIFTH
 * independent counter at 1. Without its own band, nightly run 40 and RC run 40
 * would both compute `2_000_040` — the two-counters-one-band collision Story 16.7
 * documents. Applied here rather than as workflow arithmetic, same as the
 * production offset, and for the same reason: Gradle has no `app.config.ts`-style
 * single-env-var constraint, so the band, the offset and the validation stay in
 * one file with nothing to keep in sync.
 */
val wearNightlyVersionCodeOffset = 3_000_000

/**
 * Which release band this build targets, selected by `WEAR_RELEASE_TRACK`:
 *
 *   `production` -> `3_000_000` (band + production offset)
 *   `nightly`    -> `5_000_000` (band + nightly offset)
 *   anything else, including unset -> `2_000_000` (local and RC builds)
 *
 * Only an exact literal opts in, on a trimmed, case-insensitive value. **A typo
 * therefore lands on the beta band, deliberately**: colliding with a *future*
 * production or nightly release is a hard Play rejection you find immediately,
 * while colliding with an already-uploaded RC code is the plausible-looking
 * failure this whole band scheme exists to prevent. Do not "helpfully" add a
 * fuzzy match or a default-to-nightly branch.
 */
val wearReleaseTrack: String =
    providers.environmentVariable("WEAR_RELEASE_TRACK").orNull?.trim()?.lowercase() ?: ""

/** The band this build actually lands in, after the selected offset. */
val wearEffectiveBand: Int =
    wearVersionCodeBand +
        when (wearReleaseTrack) {
            "production" -> wearProductionVersionCodeOffset
            "nightly" -> wearNightlyVersionCodeOffset
            else -> 0
        }

/**
 * CI supplies the per-release counter in `WEAR_VERSION_CODE` (a distinct name
 * from the phone's `ANDROID_VERSION_CODE`, so a Wear build can never silently
 * inherit the phone's counter). When the variable is **absent** the build is a
 * local one and gets the bare band, which is fine: nothing built locally is
 * uploadable — release signing material is not in this repo.
 *
 * When the variable is **present but unusable** the build fails instead of
 * falling back. That distinction is the whole point. An empty, zero, negative or
 * non-numeric value almost always means CI wiring is broken (an unset GitHub
 * variable interpolates to the empty string), and silently substituting the bare
 * band would produce a *valid-looking* versionCode that is indistinguishable
 * from a legitimate first upload — which is precisely the class of failure
 * Story 16.7 exists to document.
 *
 * This deliberately **diverges** from `app.config.ts`'s `resolveAndroidVersionCode`,
 * which takes the opposite stance for the phone app: on an `ANDROID_VERSION_CODE`
 * that is present but invalid it silently falls back to a Unix-timestamp
 * versionCode. That behaviour is deliberate and tested there, and this story does
 * not touch it — but it is not a precedent worth copying into a fresh build.
 *
 * Read via `providers` rather than `System.getenv` so the value is a tracked
 * configuration-cache input instead of an untracked read.
 */
val wearVersionCounter: Int =
    providers.environmentVariable("WEAR_VERSION_CODE").orNull?.trim()?.let { raw ->
        raw.toIntOrNull()?.takeIf { it > 0 }
            ?: throw GradleException(
                "WEAR_VERSION_CODE is set to \"$raw\" but must be a positive integer. " +
                    "Refusing to fall back to the bare band ($wearEffectiveBand): a bad " +
                    "counter that still yields a plausible versionCode is exactly the " +
                    "failure mode Story 16.7 documents. Unset the variable for a local build.",
            )
    } ?: 0

/**
 * Computed in `Long` so a large counter cannot silently overflow `Int` into a
 * negative versionCode before the ceiling is checked.
 */
val wearVersionCode: Int =
    (wearEffectiveBand.toLong() + wearVersionCounter.toLong()).let { computed ->
        if (computed > playMaxVersionCode) {
            throw GradleException(
                "Computed versionCode $computed exceeds Play's maximum of " +
                    "$playMaxVersionCode (band $wearEffectiveBand + " +
                    "WEAR_VERSION_CODE $wearVersionCounter).",
            )
        }
        computed.toInt()
    }

/**
 * Crash reporting (Story 24.5). The Wear app reports to its OWN Sentry project, not the phone's
 * `react-native` one: a separate DSN, a separate R8 mapping, a separate release name.
 *
 * The DSN comes from the Gradle property `wearSentryDsn`, else the `WEAR_SENTRY_DSN` environment
 * variable (the release workflows set it from the repository secret of the same name). Blank or
 * absent means "no DSN": the app then never initialises Sentry and reports nothing, which is what
 * every local and CI build without the secret gets. An unset GitHub secret interpolates to the
 * empty string, so blank is treated exactly like absent rather than as an error.
 *
 * A present value must have the shape of a Sentry DSN, `https://<key>@<host>/<project-id>` (an
 * optional `:<secret>` after the key, `:<port>` after the host and path prefix before the numeric
 * project id, as the SDK's own parser allows), or the build fails. Two reasons: the value is baked
 * into a Java string literal in BuildConfig, so a stray quote or backslash would break or inject into
 * the source; and the SDK parses the DSN in `Application.onCreate`, so a malformed secret would
 * otherwise surface as a launch-time failure in the field instead of a red build.
 */
val sentryDsnShape =
    Regex("""^https://[A-Za-z0-9]+(:[A-Za-z0-9]+)?@[A-Za-z0-9.-]+(:\d{1,5})?(/[A-Za-z0-9._~-]+)*/\d+$""")
val wearSentryDsn: String =
    providers.gradleProperty("wearSentryDsn")
        // A blank property falls through to the environment variable rather than shadowing it.
        .filter { it.isNotBlank() }
        .orElse(providers.environmentVariable("WEAR_SENTRY_DSN"))
        .orNull?.trim().orEmpty()
        .also { dsn ->
            if (dsn.isNotEmpty() && !sentryDsnShape.matches(dsn)) {
                throw GradleException(
                    "wearSentryDsn / WEAR_SENTRY_DSN is not a Sentry DSN " +
                        "(https://<key>@<host>/<project-id>, no quotes, spaces or backslashes). " +
                        "Unset it to build without crash reporting.",
                )
            }
        }

/**
 * The test-crash trigger (Story 24.5) exists only in a build made with `-PsentryTestCrash=true`.
 * Nothing in CI sets it, and `test/sentry-test-crash-flags.test.ts` pins that. Exactly `true`
 * opts in; anything else, including unset, builds without the trigger.
 */
val sentryTestCrash: Boolean =
    providers.gradleProperty("sentryTestCrash").orNull?.trim() == "true"

/**
 * Whether this build uploads its R8 mapping to Sentry. Three conditions, each with its own skip
 * notice below:
 *
 * 1. `SENTRY_AUTH_TOKEN` is set, as on the phone lanes;
 * 2. `SENTRY_DISABLE_AUTO_UPLOAD` (which the workflows set to `true` when the token is missing) is
 *    not `true`, as on the phone lanes;
 * 3. a Wear DSN is set. The token alone is not enough: every Android release job already carries the
 *    phone's token, but the `wear-os` project exists only once ifero creates it, and an upload to a
 *    missing project fails `bundleRelease`. A DSN exists only once the project does, so it is the
 *    signal that there is somewhere to upload to.
 *
 * When any is missing the release build still succeeds; it just ships a mapping nobody can
 * deobfuscate with.
 */
val sentryAuthToken: String =
    providers.environmentVariable("SENTRY_AUTH_TOKEN").orNull?.trim().orEmpty()
val sentryUploadDisabled: Boolean =
    providers.environmentVariable("SENTRY_DISABLE_AUTO_UPLOAD").orNull?.trim()?.lowercase() == "true"
val sentryMappingSkipReason: String? =
    when {
        sentryAuthToken.isEmpty() -> "SENTRY_AUTH_TOKEN not set"
        sentryUploadDisabled -> "SENTRY_DISABLE_AUTO_UPLOAD=true"
        wearSentryDsn.isEmpty() -> "WEAR_SENTRY_DSN not set (no Wear OS Sentry project to upload to)"
        else -> null
    }
val sentryUploadMapping: Boolean = sentryMappingSkipReason == null

if (sentryMappingSkipReason != null && gradle.startParameter.taskNames.any { it.contains("Release") }) {
    logger.warn(
        "WARNING: $sentryMappingSkipReason — skipping the Wear OS R8 mapping upload to Sentry. " +
            "Release crashes from this build will not be deobfuscated.",
    )
}

android {
    // The R class / code package. Deliberately distinct from `applicationId`:
    // it namespaces Wear sources without changing the identity Play sees.
    namespace = "com.iferoporefi.myloyaltycards.wear"

    // compileSdk >= targetSdk. 36 is the newest platform this repo has installed
    // and AGP 9.3 supports up to API 37.
    compileSdk = 36

    defaultConfig {
        // MUST be identical to the phone app's `expo.android.package` in
        // app.json — no `.watch`/`.wear` suffix. Play associates the watch APK
        // with the phone app by application ID, and the Wearable Data Layer
        // will not connect two APKs with different IDs. This is the opposite of
        // targets/watch/expo-target.config.js, which suffixes the watchOS
        // bundle ID with `.watch` because Apple embeds that target instead.
        applicationId = "com.iferoporefi.myloyaltycards"

        // Wear OS 3 floor, and Play's Wear OS app-quality requirement.
        minSdk = 30
        // Play's 2026 rule is API 36 for new submissions, but Wear OS and
        // Android Automotive are explicitly carved out at API 35.
        targetSdk = 35

        versionCode = wearVersionCode
        // Independent of the phone app's `expo.version`; the two ship separately.
        versionName = "1.0.0"

        // Story 24.5 — see `wearSentryDsn` and `sentryTestCrash` above. The flag is a `boolean`
        // constant, so without it R8 strips the trigger. The DSN is a `String`, whose
        // `isNotBlank()` check is not constant-folded: the init path stays in the binary and
        // simply returns early when the DSN is empty.
        buildConfigField("String", "SENTRY_DSN", "\"$wearSentryDsn\"")
        buildConfigField("boolean", "SENTRY_TEST_CRASH", sentryTestCrash.toString())
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
            // No `signingConfig`: the release keystore is @ifero's and must be
            // the SAME key as the phone app (Play association + Data Layer both
            // require it). Nothing signing-related is committed to this repo.
        }
    }

    compileOptions {
        // AGP 9 defaults to Java 11; 17 matches the JDK the build requires.
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    // Kotlin's `jvmTarget` is not set explicitly: with AGP's built-in Kotlin it
    // defaults to `compileOptions.targetCompatibility`, so the two cannot drift.

    buildFeatures {
        compose = true
        // Generates BuildConfig.DEBUG, the compile-time flag that gates the sample-card
        // seeder so R8 strips it from the release APK (the Kotlin equivalent of `#if DEBUG`).
        buildConfig = true
    }

    testOptions {
        unitTests {
            // DataStore's read/write flows assert they are off the main thread; the default
            // returns 0 for unmocked android.* calls, which is enough for those pure-logic tests.
            isReturnDefaultValues = true
            // Robolectric needs the merged manifest and resources on the unit-test classpath to
            // stand up an Android runtime for the Room DAO tests.
            isIncludeAndroidResources = true
        }
    }
}

/**
 * Room schema export (Story 10.5, AC4). `exportSchema = true` on `@Database` writes the schema
 * as JSON here so future migrations can be generated and diffed; the v1 file is committed. The
 * directory is a tracked task output — a `.json` per database version — so a schema change that
 * forgets its migration is caught in review, not in the field.
 *
 * Using the Room Gradle plugin (not a raw `room.schemaLocation` KSP arg) on purpose: it registers
 * the export as a proper Gradle task output, which is what keeps it correct under the build cache
 * and configuration cache (both enabled in gradle.properties).
 */
room {
    schemaDirectory("$projectDir/schemas")
}

/**
 * Sentry Android Gradle plugin (Story 24.5), used for ONE thing: uploading the release build's R8
 * `mapping.txt` to the Wear project, so a crash from a minified build reads as source names.
 *
 * Everything else the plugin can do is switched off on purpose. It does not add the SDK (the
 * dependency below is declared by hand, core only), it does not rewrite bytecode for performance
 * tracing (tracing is off: crash diagnostics only, Story 24-1 decision 1), it does not bundle
 * source context or a dependency report, and it sends no build telemetry of its own.
 *
 * `org`, `projectName` and `url` name the EU organisation and the Wear project ifero creates. The
 * project slug defaults to `wear-os`; `WEAR_SENTRY_PROJECT` overrides it if the project was created
 * under another name.
 */
sentry {
    org.set("andrea-pacino")
    projectName.set(providers.environmentVariable("WEAR_SENTRY_PROJECT").orElse("wear-os"))
    url.set("https://de.sentry.io/")
    if (sentryAuthToken.isNotEmpty()) {
        authToken.set(sentryAuthToken)
    }

    includeProguardMapping.set(true)
    autoUploadProguardMapping.set(sentryUploadMapping)
    ignoredBuildTypes.set(setOf("debug"))

    uploadNativeSymbols.set(false)
    includeNativeSources.set(false)
    includeSourceContext.set(false)
    includeDependenciesReport.set(false)
    telemetry.set(false)

    tracingInstrumentation {
        enabled.set(false)
    }
    autoInstallation {
        enabled.set(false)
    }
}

dependencies {
    val composeBom = platform(libs.androidx.compose.bom)
    implementation(composeBom)

    implementation(libs.androidx.activity.compose)

    // Compose for Wear OS.
    // NOTE: do NOT add androidx.compose.material:material — androidx.wear.compose
    // is a replacement for it on Wear, not an addition. Foundation is additive,
    // so the Wear foundation sits alongside the general Compose artifacts.
    implementation(libs.wear.compose.material3)
    implementation(libs.wear.compose.foundation)
    // Wear navigation (SwipeDismissableNavHost): the card list, the sort picker,
    // and the inert row-tap barcode seam (Story 10-4 fills the barcode screen).
    implementation(libs.wear.compose.navigation)

    // Watch-local sort preference (Story 10.3). DataStore, not SharedPreferences:
    // async-safe and the current AndroidX recommendation.
    implementation(libs.androidx.datastore.preferences)

    // Wearable Data Layer. Declared here but UNUSED in this story so that
    // Story 10-6 (phone <-> watch sync, CARD_USED usage events) can wire sync up
    // without editing build files. Do not add sync logic before 10-6.
    implementation(libs.play.services.wearable)

    // Barcode generation (Story 10.4): the pure-JVM ZXing core covers all six card
    // formats. No Android dependency, so the encode/layout/cache logic is unit-tested
    // on the JVM (below) without an emulator.
    implementation(libs.zxing.core)

    // Room — the on-device card store (Story 10.5). This module OWNS the schema; nothing
    // Room-related lived here before. `room-runtime` is the library; `room-compiler` is the
    // KSP processor that generates the DAO/database implementations at compile time.
    implementation(libs.androidx.room.runtime)
    ksp(libs.androidx.room.compiler)

    // Crash reporting (Story 24.5): the Sentry Android SDK, core module only. Initialised by
    // WearApplication only when a DSN was baked in and the build is not DEBUG; see crash/.
    implementation(libs.sentry.android.core)

    // Wear-specific @Preview annotations, used by the card list previews.
    implementation(libs.wear.compose.ui.tooling)
    // The preview renderer itself is debug-only and never ships in the APK.
    debugImplementation(libs.androidx.compose.ui.tooling)

    // Unit tests (JVM, no device): sort comparators, colour maths, the read-only invariant,
    // and the sort-preference round-trip through a temp-file-backed DataStore.
    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(libs.androidx.datastore.preferences.core)
    // Room's DAO tests and the migration test both need an Android runtime — Room's Android
    // database builder needs a Context (the context-less KMP builder is not available to an app
    // module), and the migration test drives Room's default AndroidSQLiteDriver, whose SQLite is
    // an android.* type. Robolectric supplies both on the JVM, so `./gradlew testDebugUnitTest`
    // runs them in CI with no emulator (Story 10.5, AC13). AndroidSQLiteDriver itself comes
    // transitively from room-runtime, so no extra androidx.sqlite dependency is needed.
    testImplementation(libs.robolectric)
}

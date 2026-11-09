/*
 * Top-level build file for the Wear OS companion app.
 *
 * Plugins are declared here with `apply false` and applied in `app/build.gradle.kts`;
 * this keeps a single place where the plugin versions are resolved from
 * `gradle/libs.versions.toml`.
 *
 * Note there is no `org.jetbrains.kotlin.android` plugin: AGP 9 ships built-in
 * Kotlin support and enables it by default, so applying KGP separately is no
 * longer required. The Compose compiler plugin is still separate.
 */
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.compose.compiler) apply false
    // KSP (Room's annotation processor) and the Room schema-export plugin (Story 10.5),
    // both applied in app/build.gradle.kts. Declared here so their versions resolve from
    // gradle/libs.versions.toml in one place, like the plugins above.
    alias(libs.plugins.ksp) apply false
    alias(libs.plugins.room) apply false
    // Sentry's Gradle plugin uploads the release R8 mapping (Story 24.5).
    alias(libs.plugins.sentry.android.gradle) apply false
}

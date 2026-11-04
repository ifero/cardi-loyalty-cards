---
title: 'Store platform requirements'
type: 'chore'
created: '2026-11-04'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `app.json` declares no `ios.privacyManifests`, so the phone app's own privacy manifest is whatever the prebuild template writes, and neither watch bundle (`targets/watch`, `targets/watch-widget`) has one, although both read `UserDefaults` (a required-reason API). An App Store upload can then raise ITMS-91053. On Android nothing pins the phone's target SDK: it is inherited from React Native's default, so a dependency change could drop it below what Play requires.

**Approach:** Declare the phone app's privacy manifest in `app.json` and give both watch bundles a `PrivacyInfo.xcprivacy`, each covering the required-reason APIs its own code uses. Pin the phone's Android `compileSdkVersion` and `targetSdkVersion` to 36 in `expo-build-properties`. Check that Wear OS's existing `targetSdk = 35` meets Play's Wear rule, and lock all three values with a test.

## Boundaries & Constraints

**Always:**

- **Play's rules (2026):** phone apps target API 36 by 2026-08-31. Wear OS new apps and updates target API 35. Wear apps must support 64-bit from 2026-09-15; the Wear APK ships no native libraries, so it is 64-bit-safe as built.
- **Manifest content:**
  - `NSPrivacyTracking` is false and there are no tracking domains.
  - Every reason code is one of Apple's published codes for its category, chosen for this app's actual use: UserDefaults, file timestamp, system boot time and disk space, as used by the app and by dependencies that do not ship their own manifest.
  - Collected data types match Story 24.1's disclosures (email address and user content for account sync, crash data), all not linked to tracking.
- Prebuild must stay idempotent.

**Never:** Change the Wear `targetSdk`, the iOS deployment targets or any dependency version. Upload a build (that is 24-7). Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario         | Input / State                        | Expected Output / Behavior                                                                                 | Error Handling                                  |
| ---------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Phone prebuild   | `expo prebuild -p ios` (scratch)     | `ios/<app>/PrivacyInfo.xcprivacy` holds the declared categories, merged with the template's, no duplicates | N/A                                             |
| Watch bundles    | apple-targets generation             | Each watch target's built bundle contains its own `PrivacyInfo.xcprivacy`                                  | If apple-targets drops it, add it as a resource |
| Android prebuild | `expo prebuild -p android` (scratch) | `targetSdkVersion 36`, `compileSdkVersion 36`                                                              | N/A                                             |
| Wear             | `watch-android/app/build.gradle.kts` | `targetSdk = 35` unchanged, test-pinned                                                                    | N/A                                             |

</frozen-after-approval>

## Code Map

- `app.json` -- `expo.ios` has no `privacyManifests`. The `expo-build-properties` plugin sets only `ios.deploymentTarget: 18.0`; add `android.compileSdkVersion` and `android.targetSdkVersion`.
- `node_modules/@expo/config-plugins/build/ios/PrivacyInfo.js` -- `withPrivacyInfo` reads `ios.privacyManifests` and merges it into the template's `PrivacyInfo.xcprivacy`.
- Pods that already ship manifests (no app-level entry needed for their own use): react-native (React-Core, cxxreact, Folly, boost, glog), async-storage, expo-constants, expo-file-system, expo-localization, lottie-react-native. Sentry Cocoa ships its own.
- `targets/watch/CardListView.swift:136,226-265` -- `UserDefaults.standard` (`@AppStorage` preference, legacy `watch.cards` migration).
- `targets/watch/ComplicationProvider.swift`, `targets/watch-widget/WatchComplicationWidget.swift` -- App Group `UserDefaults` (`group.com.iferoporefi.myloyaltycards.watch-complication`).
- `targets/watch/expo-target.config.js`, `targets/watch-widget/expo-target.config.js` -- apple-targets config. Files in the target folder are added to the target; confirm `.xcprivacy` lands in Copy Bundle Resources.
- `watch-android/app/build.gradle.kts:169,184` -- `compileSdk = 36`, `targetSdk = 35`, with a comment on the Wear carve-out.
- `node_modules/react-native/gradle/libs.versions.toml:4` -- `targetSdk = "36"`, today's implicit phone source.
- `docs/sprint-artifacts/stories/24-1-privacy-copy-and-store-disclosures.md` -- the true data picture the collected types must match.

## Tasks & Acceptance

**Execution:**

- [ ] `app.json` -- add `ios.privacyManifests`: tracking false, accessed-API types with reasons, and collected data types per 24.1. Add Android SDK 36 to `expo-build-properties`. Rationale: this is the phone app's declared manifest and its pinned target.
- [ ] `targets/watch/PrivacyInfo.xcprivacy`, `targets/watch-widget/PrivacyInfo.xcprivacy` (new) -- UserDefaults with the App Group reason (`1C8F.1`) where the App Group suite is used, and `CA92.1` for app-only defaults. Tracking false. Rationale: each bundle is checked separately.
- [ ] `test/store-platform-requirements.test.ts` (new) -- read `app.json`, both `.xcprivacy` files and `build.gradle.kts`. Assert:
  - tracking is false and the categories and reasons are present;
  - the phone's target and compile SDK are 36;
  - Wear's `targetSdk` is at least 35;
  - a watch Swift file that uses `UserDefaults` sits beside a manifest declaring it.

  Rationale: keeps a dependency bump or a refactor from silently dropping a requirement.

- [ ] Scratch prebuild (in a temporary copy, or with `ios/` and `android/` deleted afterwards, both git-ignored) -- record the generated manifest and Gradle values in Implementation Notes.

**Acceptance Criteria:**

- Given a prebuild, when the generated phone manifest is read, then every required-reason category the app's own code uses is declared once, with a valid reason.
- Given the Xcode build of each watch target, when its product bundle is listed, then it contains `PrivacyInfo.xcprivacy`.
- Given the Android prebuild, when the app module's Gradle config is read, then the phone targets and compiles against API 36.
- Given the next TestFlight upload (in 24-7), when App Store Connect processes it, then no ITMS-91053 notice arrives. This criterion is recorded here and verified in 24-7.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors
- `yarn lint` -- expected: no errors
- `yarn format:check` -- expected: clean
- `yarn test` -- expected: all pass, including `test/store-platform-requirements.test.ts`

**Manual checks (if no CLI):**

- Scratch `npx expo prebuild --no-install` for each platform: inspect `ios/*/PrivacyInfo.xcprivacy` and the Android app module's SDK values, then delete the generated folders.
- Build each watch target once (simulator) and list the product bundle for `PrivacyInfo.xcprivacy`.

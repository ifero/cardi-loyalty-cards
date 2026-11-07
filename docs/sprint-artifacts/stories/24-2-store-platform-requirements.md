---
title: 'Store platform requirements'
type: 'chore'
created: '2026-11-04'
status: 'done'
baseline_commit: '89a72933f734309dfb106bd7ce3c477ddfc3e35b'
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
- `node_modules/react-native/scripts/cocoapods/privacy_manifest_utils.rb` -- React Native's `post_install` aggregation adds the phone's `PrivacyInfo.xcprivacy` to every application target, the watchOS app included.
- `plugins/with-watch-privacy-manifest.js` (new) -- appends a `post_install` step after `react_native_post_install` that removes that reference from watchOS targets.
- `watch-android/app/build.gradle.kts:169,184` -- `compileSdk = 36`, `targetSdk = 35`, with a comment on the Wear carve-out.
- `node_modules/react-native/gradle/libs.versions.toml:4` -- `targetSdk = "36"`, today's implicit phone source.
- `docs/sprint-artifacts/stories/24-1-privacy-copy-and-store-disclosures.md` -- the true data picture the collected types must match.

## Tasks & Acceptance

**Execution:**

- [x] `app.json` -- add `ios.privacyManifests`: tracking false, accessed-API types with reasons, and collected data types per 24.1. Add Android SDK 36 to `expo-build-properties`. Rationale: this is the phone app's declared manifest and its pinned target.
- [x] `targets/watch/PrivacyInfo.xcprivacy`, `targets/watch-widget/PrivacyInfo.xcprivacy` (new) -- UserDefaults with the App Group reason (`1C8F.1`) where the App Group suite is used, and `CA92.1` for app-only defaults. Tracking false. Rationale: each bundle is checked separately.
- [x] `test/store-platform-requirements.test.ts` (new) -- read `app.json`, both `.xcprivacy` files and `build.gradle.kts`. Assert:
  - tracking is false and the categories and reasons are present;
  - the phone's target and compile SDK are 36;
  - Wear's `targetSdk` is at least 35;
  - a watch Swift file that uses `UserDefaults` sits beside a manifest declaring it.

  Rationale: keeps a dependency bump or a refactor from silently dropping a requirement.

- [x] `plugins/with-watch-privacy-manifest.js` + `.test.js` (new), listed in `app.json` -- strip the phone's aggregated manifest from watchOS targets after `react_native_post_install`. Rationale: without it the watch build fails with two copies of `PrivacyInfo.xcprivacy` (device check, Review Triage Log 13).
- [x] Scratch prebuild (in a temporary copy, or with `ios/` and `android/` deleted afterwards, both git-ignored) -- record the generated manifest and Gradle values in Implementation Notes.

**Acceptance Criteria:**

- Given a prebuild, when the generated phone manifest is read, then every required-reason category the app's own code uses is declared once, with a valid reason.
- Given the Xcode build of each watch target, when its product bundle is listed, then it contains `PrivacyInfo.xcprivacy`.
- Given the Android prebuild, when the app module's Gradle config is read, then the phone targets and compiles against API 36.
- Given the next TestFlight upload (in 24-7), when App Store Connect processes it, then no ITMS-91053 notice arrives. This criterion is recorded here and verified in 24-7.

## Implementation Notes

- **Phone manifest (`app.json` `ios.privacyManifests`).** Reasons follow a scan of every iOS pod that ships no manifest of its own: UserDefaults `CA92.1` (expo-updates, expo-eas-client, react-native-unistyles, RN settings; the phone code never reads an App Group suite, so no `1C8F.1`); FileTimestamp `C617.1` (expo-sqlite `fstat` in the app container) and `3B52.1` (expo-document-picker reads the picked file's modification date); SystemBootTime `35F9.1`; DiskSpace `E174.1` (expo-sqlite `fstatvfs`). Pods with their own manifest (RN, async-storage, expo-constants, expo-file-system, expo-localization, lottie, Sentry) are not repeated.
- **Collected data types** mirror the full App Privacy table in `docs/store/privacy-disclosures.md`, not only the three types the Boundaries parenthetical names: EmailAddress, UserID, OtherUserContent, ProductInteraction (linked); DeviceID, CrashData, OtherDiagnosticData (not linked). All App Functionality, none tracking. A manifest narrower than the label would contradict 24.1's answers.
- **Watch manifests.** `targets/watch`: UserDefaults `CA92.1` (`UserDefaults.standard`, `@AppStorage`) and `1C8F.1` (App Group suite in `ComplicationProvider.swift`). `targets/watch-widget`: `1C8F.1` only. Both: tracking false, no collected data (the Apple Watch app sends nothing off the phone). apple-targets 4.0.6 adds each target folder as a `PBXFileSystemSynchronizedRootGroup`, so the file is copied as a resource with no config change.
- **Scratch prebuild, 2026-11-06** (`npx expo prebuild --no-install`, `ios/` and `android/` deleted afterwards). The SDK 55 template writes no `PrivacyInfo.xcprivacy` of its own, so `ios/Cardi/PrivacyInfo.xcprivacy` is exactly the declared manifest: four categories, each once, the reasons above, seven collected types, tracking false, no domains; referenced in the Xcode project. Android: `android/gradle.properties` holds `android.compileSdkVersion=36`, `android.targetSdkVersion=36`; `android/app/build.gradle` reads them through `rootProject.ext` (the expo-root-project plugin maps the properties onto the version catalogue). Not checked with a Gradle sync.
- **Idempotency.** `mergePrivacyInfo` applied twice to the declared manifest gives the same result, so re-running prebuild over an existing `ios/` adds no duplicate category or reason. A second non-clean `expo prebuild -p ios` fails in apple-targets (`withIosXcodeProjectBeta2BaseMod: Cannot read properties of undefined (reading 'removeFromProject')`); the same failure reproduces on the baseline commit without this change, so it is pre-existing and not caused here.
- **Watch bundles.** `xcodebuild -target watch -sdk watchsimulator CODE_SIGNING_ALLOWED=NO` on the scratch project: BUILD SUCCEEDED; `watch.app/PrivacyInfo.xcprivacy` and `watch.app/PlugIns/watchwidget.appex/PrivacyInfo.xcprivacy` are byte-identical to the source files.
- **Wear OS.** `watch-android/app/build.gradle.kts` unchanged (`compileSdk = 36`, `targetSdk = 35`); the test pins `targetSdk >= 35` and `compileSdk >= targetSdk`.
- **Test.** `test/store-platform-requirements.test.ts` (12 tests) parses the watch manifests with `@expo/plist` (the parser `withPrivacyInfo` itself uses; a transitive dependency of `expo`, not a direct one). Mutation check: removing `CA92.1` from the watch manifest fails the UserDefaults test.
- **Device check, 2026-11-06: the iOS build failed once CocoaPods had run (fixed, see next bullet).** `expo run:ios` on iPhone 17 Pro: `error: Multiple commands produce '.../watch.app/PrivacyInfo.xcprivacy'`. Cause: React Native's Podfile hook (`node_modules/react-native/scripts/cocoapods/privacy_manifest_utils.rb`, on by default via `apple.privacyManifestAggregationEnabled`) aggregates the pods' reasons into the phone's `Cardi/PrivacyInfo.xcprivacy` and adds that file to the Copy Resources phase of every `:application` target, and the watchOS app is one. The watch's own `targets/watch/PrivacyInfo.xcprivacy` (synchronized group) then writes the same path. Reproduced deterministically: a clean prebuild has one build-file entry, and `pod install` adds the second, to the watch target. The "Watch bundles" check above ran before `pod install`, which is why it passed. Side fact: before this story the watch bundle was already shipping the PHONE's aggregated manifest, which lacks the App Group reason `1C8F.1`. The widget is an app extension and is not affected.
- **Fix, 2026-11-07 (ifero chose stripping over disabling aggregation).** `plugins/with-watch-privacy-manifest.js` appends a `post_install` step after `react_native_post_install` that removes every `PrivacyInfo.xcprivacy` build file from targets with `SDKROOT = watchos` and saves the project if it changed. Aggregation stays on for the phone, so pods' reasons still reach the phone manifest. After `expo prebuild --clean -p ios` + `pod install`: resources-phase entries are Cardi 1, watch 0, watchwidget 0.
- **Device check, 2026-11-07.** iOS: `expo run:ios` on iPhone 17 Pro, Build Succeeded, app launches to the card list. `watch.app/PrivacyInfo.xcprivacy` and `watchwidget.appex/PrivacyInfo.xcprivacy` are byte-identical to the target-folder sources; the phone's `Cardi.app/PrivacyInfo.xcprivacy` carries the declared categories plus aggregated pod reasons (FileTimestamp `0A2A.1`, DiskSpace `85F4.1`). The app stayed light with the simulator in dark appearance (status bar dark too), consistent with the in-app theme preference overriding the system; this story changes no UI. Android: `expo run:android` on the pixel8_api37 emulator, BUILD SUCCESSFUL, `aapt dump badging` shows `targetSdkVersion 36`, `compileSdkVersion 36`; welcome screen correct in light and dark. Not run: the watchOS app on a watch simulator, and Wear OS (unchanged).

### Found, not fixed

Tracked in [ifero/cardi-loyalty-cards#294](https://github.com/ifero/cardi-loyalty-cards/issues/294).

- The built `watch.app` also ships `README.md` and `AppIcon.png` from `targets/watch/` as resources, because apple-targets' synchronized group copies every file in the folder. Harmless for review, but dead weight in the bundle.
- A second, non-clean `expo prebuild -p ios` fails in apple-targets (`withIosXcodeProjectBeta2BaseMod: Cannot read properties of undefined (reading 'removeFromProject')`). Reproduces on the baseline commit, so it predates this story; a clean prebuild works.
- Nothing automated checks prebuild or build output: the generated phone `PrivacyInfo.xcprivacy`, the Gradle SDK properties, and each watch bundle's copied manifest were verified once by hand (above). An apple-targets upgrade that stops copying the file, or an `expo-build-properties` option rename, would pass every test. Closing it needs a prebuild and `xcodebuild` step in CI; until then, repeat the manual checks before each store submission (24-7), including, after `pod install`, that the watch and watchwidget targets have no `PrivacyInfo.xcprivacy` entry in their Resources phase.

## Spec Change Log

## Review Triage Log

Review pass 1 (2026-11-06): blind, edge-case, verification-gap and project-conventions layers.

| #   | Source                             | Finding                                                                                              | Verdict | Evidence                                                                                                                                                                                                                                                                   | Route                   |
| --- | ---------------------------------- | ---------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 1   | blind                              | Phone reason test uses `arrayContaining`, so an over-declared reason or a fifth category passes      | low     | Confirmed at `test/store-platform-requirements.test.ts` `it.each`; adding `1C8F.1` would stay green. Fix is a direct correction (`toEqual`)                                                                                                                                | patch                   |
| 2   | blind                              | SystemBootTime `35F9.1` has no stated source                                                         | low     | Confirmed: no comment. Source verified: react-native calls `mach_absolute_time` (`ReactCommon/react/nativemodule/cputime/CPUTime.h:62`; in `RCTFrameTimingsObserver.mm` it is only a comment) and React-Core's own manifest omits SystemBootTime; only boost's declares it | patch                   |
| 3   | blind                              | Watch scan checks only UserDefaults, not other required-reason APIs                                  | low     | No watch Swift file uses another category today; the guard would add a symbol-to-category map for a hypothetical future                                                                                                                                                    | rejected                |
| 4   | blind, edge-case, verification-gap | App-only defaults regex misses `?? .standard`; suite regex misses `UserDefaults.init(suiteName:`     | low     | Confirmed: `ComplicationProvider.swift:22,39,50` use `?? .standard`, unmatched; today's pass rests on `CardListView.swift`'s `UserDefaults.standard`. Fix widens two regexes                                                                                               | patch                   |
| 5   | edge-case                          | `@AppStorage(key, store:)` would wrongly demand `CA92.1`                                             | low     | No `store:` argument anywhere in `targets/`; guard adds a branch for a hypothetical                                                                                                                                                                                        | rejected                |
| 6   | edge-case                          | Comments count as usage                                                                              | low     | `CardListView.swift:136` mentions `@AppStorage` in a doc comment, but the real use at :504 also matches; matching on `@AppStorage(` (finding 4's patch) removes the comment hit without a comment stripper                                                                 | rejected (covered by 4) |
| 7   | blind, verification-gap            | Collected-data expectation is a hand copy of `docs/store/privacy-disclosures.md`, never read from it | medium  | Confirmed: the test only comments the link, and that doc is the source of the App Store label answers; the two can drift with every test green                                                                                                                             | patch                   |
| 8   | blind, verification-gap            | No automated check of prebuild output or watch bundle contents                                       | medium  | Confirmed: tests read inputs only. Needs a prebuild/xcodebuild CI step, beyond this change                                                                                                                                                                                 | defer                   |
| 9   | blind                              | Test docstring says the phone manifest merges into the template's                                    | low     | Confirmed: the SDK 55 template writes none (scratch prebuild), so the comment misleads                                                                                                                                                                                     | patch                   |
| 10  | blind, conventions                 | `@expo/plist` imported but undeclared                                                                | low     | Real, but precedent: `test/android-phone-icons.test.ts:9` imports transitive `@expo/image-utils` the same way; adding a dependency is outside this story's Never list ("any dependency version")                                                                           | rejected                |
| 11  | blind                              | Assertions in loops give unhelpful failure messages                                                  | low     | Cosmetic; failures still fail. Restructuring into `it.each` per reason is more than a direct correction                                                                                                                                                                    | rejected                |
| 12  | blind                              | `APPLE_REASON_CODES` has no source link                                                              | low     | Confirmed; adding the Apple doc URL is a direct correction                                                                                                                                                                                                                 | patch                   |
| 13  | device check                       | iOS build fails after `pod install`: two commands produce `watch.app/PrivacyInfo.xcprivacy`          | high    | Reproduced: RN aggregation adds the phone manifest to the watch target. ifero chose to strip it in `post_install` (2026-11-07) over disabling aggregation                                                                                                                  | patch                   |
| 14  | loop 1 (code)                      | `@expo/plist` undeclared                                                                             | low     | Same as 10                                                                                                                                                                                                                                                                 | rejected                |
| 15  | loop 1 (code)                      | Plugin-registration test is misnamed and runs twice inside `describe.each`                           | low     | Confirmed                                                                                                                                                                                                                                                                  | patch                   |
| 16  | loop 1 (code)                      | Ruby would raise on an aggregate target with `SDKROOT = watchos`                                     | nit     | `PBXAggregateTarget` has no `resources_build_phase`; one `respond_to?` guard                                                                                                                                                                                               | patch                   |
| 17  | loop 1 (code)                      | Recursive Swift scan could pick up build artefacts                                                   | nit     | No build output lives under `targets/`; hypothetical                                                                                                                                                                                                                       | rejected                |
| 18  | loop QA 1                          | Plugin tests check the Ruby text, not its effect                                                     | nit     | Behaviour is proven by the device check; the 24-7 manual checklist now names the Resources-phase check                                                                                                                                                                     | patch (spec)            |
| 19  | loop QA 1                          | Wear regex is line-anchored                                                                          | nit     | A reformat yields `NaN` and the test fails loudly, which is the desired behaviour                                                                                                                                                                                          | rejected                |

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors
- `yarn lint` -- expected: no errors
- `yarn format:check` -- expected: clean
- `yarn test` -- expected: all pass, including `test/store-platform-requirements.test.ts`

**Manual checks (if no CLI):**

- Scratch `npx expo prebuild --no-install` for each platform: inspect `ios/*/PrivacyInfo.xcprivacy` and the Android app module's SDK values, then delete the generated folders.
- Build each watch target once (simulator) and list the product bundle for `PrivacyInfo.xcprivacy`.

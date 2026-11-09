---
title: 'Android and Wear OS crash reporting'
type: 'feature'
created: '2026-11-04'
status: 'done'
baseline_commit: '319aa1a7fc273bac5e3549365137713fd9b00c00'
route: 'dispatch'
review_loop_iteration: 1
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
  - '{project-root}/docs/sprint-artifacts/stories/24-1-privacy-copy-and-store-disclosures.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The story's premise, that Android has no telemetry, is out of date. Sentry holds 276 phone-Android events in 90 days, across the RC and nightly builds. What is really missing:

- **No proven phone crash.** No Android crash has ever been seen symbolicated in Sentry. The upload path exists (the Sentry Expo plugin's `sentry.gradle`, gated by `SENTRY_DISABLE_AUTO_UPLOAD`), but nobody has checked a crash through it.
- **Nothing at all on Wear OS.** The Wear app has no crash reporting: no SDK, no handler, and an R8 `mapping.txt` that nothing uploads. A Wear crash in the field produces no signal (Epic 10 retro: "Done when a Wear OS crash reaches a dashboard").
- **Undocumented.** `docs/cicd.md` does not mention Sentry.

**Approach:**

- **Phone:** prove one symbolicated release crash; change no code beyond a build-flagged test trigger.
- **Wear OS:** add the Sentry Android SDK with its own DSN, in its own EU project, trimmed exactly as 24-1 trims the phone. Upload its R8 mapping from the release lanes, behind the same token guard.
- **Docs:** document the whole Sentry pipeline.

## Boundaries & Constraints

**Decisions (ifero, 2026-11-04):**

1. **A separate Sentry project for Wear OS** (e.g. `wear-os`) in the `andrea-pacino` EU organisation. Creating it, adding its DSN as a repository secret (`WEAR_SENTRY_DSN`) and turning on "Prevent Storing of IP Addresses" on it are ifero's steps. Claude may do the first and the last through the Sentry connection only with ifero's explicit go-ahead.
2. **Disclose it.** The Wear app sends crash diagnostics straight to Sentry; Story 24-1's copy is amended in the same change. The Apple Watch app still sends nothing.

**Always:**

- **Wear Sentry config:**
  - init only when the DSN is set; disabled in debug builds;
  - `sendDefaultPii` false and tracing off;
  - automatic session tracking off;
  - a `beforeSend` that removes user, device and installation identifiers;
  - release `com.iferoporefi.myloyaltycards.wear@<versionName>+<versionCode>`.
- **R8 mapping upload:** uses `SENTRY_AUTH_TOKEN` and is skipped with a warning when the token is absent, as the phone lanes do. Try the Sentry Android Gradle plugin (6.x) on AGP 9.3.1 first. If it is incompatible, upload `mapping.txt` with `sentry-cli` after `build_wear_bundle!` in `fastlane/Fastfile`.
- **Test crashes:** the trigger exists only in a build made with an explicit flag (`EXPO_PUBLIC_SENTRY_TEST_CRASH=1` on the phone, the Gradle property `sentryTestCrash=true` on Wear). No workflow sets either flag, and a test pins that.

**Never:**

- Change the phone's Sentry options. That is 24-1's job.
- Upgrade `@sentry/react-native`. That is 16-20's job.
- Add Apple Watch reporting.
- Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario             | Input / State                    | Expected Output / Behavior                                                     | Error Handling         |
| -------------------- | -------------------------------- | ------------------------------------------------------------------------------ | ---------------------- |
| Phone test crash     | Flagged release build on a phone | Issue in `react-native` with a symbolicated JS stack, release `…@1.0.0+<code>` | N/A                    |
| Wear test crash      | Flagged release Wear build       | Issue in the Wear project, deobfuscated by the uploaded mapping                | N/A                    |
| No DSN               | `WEAR_SENTRY_DSN` unset          | Wear app runs and reports nothing                                              | No crash, no log spam  |
| No token             | `SENTRY_AUTH_TOKEN` unset        | Build succeeds, upload skipped                                                 | Warning in the job log |
| Event content (Wear) | Any event                        | No user, `device.id`, installation id or IP-derived location                   | N/A                    |

</frozen-after-approval>

## Code Map

- `core/observability/sentry.ts:89-102` -- phone init (defaults, native crash handling on). Read-only here. `app.json:102-109` -- the plugin (org `andrea-pacino`, project `react-native`, `https://de.sentry.io/`). `metro.config.js:3-5` -- `getSentryExpoConfig`.
- **Phone Android lanes**, each setting the DSN, the token and `SENTRY_DISABLE_AUTO_UPLOAD`:
  - `beta-releases.yml:146-147,184-191`
  - `store-upload.yml:160-161,198-205`
  - `nightly-builds.yml:338-339,372-379`
  - `android-release.yml:77-78,112-123`

  Phone R8 is off (no `expo-build-properties` android minify), so Java frames are readable as they are.

- `watch-android/app/build.gradle.kts`
  - `:7-18`: plugins.
  - `:47-158`: the versionCode bands.
  - `:186-188`: `versionName`.
  - `:191-198`: R8 on.

  `watch-android/gradle/libs.versions.toml:13`: AGP 9.3.1. `watch-android/app/src/main/AndroidManifest.xml:17-23`: no `Application` class.

- `fastlane/Fastfile:377-390` -- `build_wear_bundle!` (Gradle properties hash); `:571+` -- `upload_wear_bundle!`. These are called from `ship_android!` (beta), `upload_release` and `nightly`. Those jobs already carry `SENTRY_AUTH_TOKEN` at job level.
- `watch-android/README.md:793-795` -- the "Known gaps" Sentry line to retire.
- `docs/cicd.md` -- no Sentry section yet.
- `core/observability/sentry.test.ts` -- the phone tests (scrubber, init). Wear gets its own unit test of the `beforeSend` and the init options.
- `core/observability/sentry.ts` -- **the full phone trim the Wear scrubber must mirror** ("exactly as 24-1 trims the phone"), not only the user/device/app part:
  - `scrubEvent`: drop `user` and `request`; allow-list `device` and `app` contexts; drop `culture`; drop the `app.device` tag; mask every UUID (`UUID_PATTERN`, replaced by `[uuid]`) in exception values, the message and the log entry; redact `extra` and `contexts` by `SENSITIVE_KEY_PATTERN` and mask UUIDs in `extra`'s strings. Every other context (the OS one included) passes through.
  - `scrubBreadcrumb` (the `beforeBreadcrumb` hook, also applied to an event's breadcrumbs): drop categories `console`, `touch`, `ui` and their dotted children (`ui.lifecycle` included); strip the query and fragment from `url` data; mask UUIDs in the message and string data.
- **Mapping upload must not depend on the token alone.** Every Android release job already carries the phone's `SENTRY_AUTH_TOKEN`, but the `wear-os` project does not exist until ifero creates it, and an upload to a missing project fails `bundleRelease`. Upload only when the token is set, `SENTRY_DISABLE_AUTO_UPLOAD` is not `true`, **and** a Wear DSN is set (a DSN exists only once the project does).
- **DSN validation:** a value that passes the build check must also parse as a Sentry DSN (`https://<key>@<host>/<project-id>`, no quotes, spaces or backslashes), so a malformed secret fails the build rather than throwing in `Application.onCreate`.

## Tasks & Acceptance

**Execution:**

- [x] `watch-android/` (Gradle, a new `Application` subclass and manifest entry, the init and the scrubber, plus tests) -- the Wear SDK as above, with the DSN read from a Gradle property or environment variable into `BuildConfig`; the scrubber and a `beforeBreadcrumb` mirror the whole phone trim in the Code Map; a Robolectric test pins that the app's `Application` is the Wear one and that the merged manifest has `io.sentry.auto-init` false. Rationale: the Wear signal.
- [x] `fastlane/Fastfile` and the three Android release workflows -- pass `WEAR_SENTRY_DSN`; mapping upload behind the token guard plus the DSN condition in the Code Map; each skip notice names its actual cause (no token, upload disabled, or no DSN). Rationale: deobfuscated Wear stacks.
- [x] The phone test trigger (Settings, About, only when `EXPO_PUBLIC_SENTRY_TEST_CRASH === '1'`) and its Wear counterpart, plus a test that no workflow sets either flag; that test also scans `package.json` and `.env.example`. Rationale: proof without shipping a crash button.
- [x] Story 24-1's copy surfaces (`docs/store/privacy-disclosures.md` included) -- the Wear disclosure, if 24-1 has merged; otherwise record it there before 24-1 ships. Rationale: decision 2.
- [x] `docs/cicd.md`, `watch-android/README.md` -- the Sentry pipeline (projects, DSNs, tokens, the guard, what each lane uploads, how to read a crash). Rationale: the gap.

**Acceptance Criteria:**

- Given a flagged phone release build on a real Android phone, when the test crash fires, then Sentry shows it symbolicated. Implementation Notes record the device and the issue link.
- Given a flagged Wear release build on a round AVD (or a real watch), when the test crash fires, then the Wear project shows it deobfuscated. The Epic 10 action item's done condition is then met.
- Given a release lane run without `SENTRY_AUTH_TOKEN`, when it builds, then it succeeds with a skip warning.

## Implementation Notes

### Implementation, first pass (2026-11-09, reverted at review loop 1; see Spec Change Log)

- **Sentry Android Gradle plugin 6.26.0 works on AGP 9.3.1**, configuration cache on, so the `sentry-cli`-in-Fastfile fallback was not needed. Without a token the plugin runs `sentry-cli upload-proguard --no-upload` (seen with `--info`) and the build succeeds; Gradle logs a warning, `build_wear_bundle!` logs `UI.important`, and the workflows' existing guard step now names the Wear mapping in its `::warning::`.
- SDK `io.sentry:sentry-android-core` 8.63.0 only (no NDK, no replay). The plugin's auto-install, bytecode instrumentation, source context, dependency report and telemetry are off.
- `sendDefaultPii` is deprecated in 8.x in favour of `dataCollection`; it is kept on purpose (with `@Suppress`), because configuring any `dataCollection` field flips every unset one to its collecting default (`DataCollectionResolver.explicitOrDefault`). A test pins that `dataCollection` stays unconfigured.
- Manifest auto-init is off (`io.sentry.auto-init` false); `WearApplication` inits only with a DSN and outside DEBUG.
- Wear test crash: a "Test crash" button in the empty card list (what an unpaired AVD shows), thrown as `SentryTestCrashException`. Phone test crash: a last row in Settings → About, "Sentry test crash", throwing a JS `Error`.
- 24-1 had merged and already discloses Wear crash diagnostics in all copy surfaces; the only change there is the `docs/store/privacy-disclosures.md` checklist, which now says the `wear-os` project needs its own IP setting, scrubbing rules and retention check.
- The project slug defaults to `wear-os` (`WEAR_SENTRY_PROJECT` overrides). As of this run the `andrea-pacino` organisation holds only `react-native` (Sentry read), so the Wear project, its DSN secret and its IP setting are still ifero's steps.

### Implementation, after review loop 1 (2026-11-09)

- Re-derived from the first pass plus the loop-1 amendments. `WearEventScrubber` now mirrors the phone's whole trim: UUIDs masked in exception values and the message (`formatted`, `message`, `params`), `extra` and `contexts` redacted by the phone's `SENSITIVE_KEY_PATTERN` (depth limit, cycle guard), and `scrubBreadcrumb` wired as `beforeBreadcrumb` and applied to an event's breadcrumbs (drops `console`, `touch`, `ui` and children, cleans `url`, masks UUIDs). It edits in place, the Java SDK's callback convention, where the phone returns a copy.
- The mapping upload needs a token, uploads not disabled, **and** a Wear DSN; Gradle and `build_wear_bundle!` each name the first missing cause. The DSN check accepts only `https://<key>[:<secret>]@<host>[:port][/path]/<numeric id>`, checked against `io.sentry.Dsn`.
- `WearCrashReportingWiringTest` (Robolectric) pins the `Application` class and `io.sentry.auto-init` false; both tests were seen to fail with the manifest entry removed and auto-init flipped.
- Release-build matrix run locally, all green: no secrets (AC 3: "SENTRY_AUTH_TOKEN not set" warning); token without DSN ("WEAR_SENTRY_DSN not set"); token with upload disabled; DSN without token (DSN in `BuildConfig.SENTRY_DSN`). Malformed DSNs (`https://example.com/`, non-numeric id, embedded quote, `http://`) fail the build.

### Sentry setup (2026-11-09)

- ifero created the `wear-os` project in `andrea-pacino` (EU); its DSN is in ifero's local environment as `WEAR_SENTRY_DSN`, and `.env.example` documents the name (no `EXPO_PUBLIC_` prefix, so it never reaches the phone bundle).
- "Prevent Storing of IP Addresses" turned on for `wear-os` through the Sentry API, at ifero's explicit go-ahead (decision 1), and read back as on. Default data scrubbing is on; the advanced scrubbing rules 1–5 and the retention check stay ifero's console steps (`docs/store/privacy-disclosures.md`).
- Still ifero's: the `WEAR_SENTRY_DSN` repository secret.

### Device check (2026-11-09)

Screenshots are outside the repository, in the session scratchpad (`wear-empty-flagged*.png`, `wear-empty-plain.png`, `phone-about-flagged-{dark,light}.png`).

- **Wear, round AVD `wearos5_round_34` (Wear OS 5, 384×384):** a flagged release (`assembleRelease -PsentryTestCrash=true`, ifero's `WEAR_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` from ifero's admin token), debug-signed. The plugin uploaded mapping `442a22ad-fabf-3d50-8f31-34eb2d81fc0e`, which the Sentry API lists in `wear-os` as `proguard`. "Test crash" threw `bf1` with frames like `z1.a` in logcat; after a relaunch Sentry showed **WEAR-OS-1** (<https://andrea-pacino.sentry.io/issues/159693015/>), `SentryTestCrashException: Wear OS Sentry test crash (Story 24.5)`, deobfuscated `MainActivity.onCreate$lambda$1` → `WearCrashReporting.crashForTest` → `SentryTestCrashException.<init>`, release `com.iferoporefi.myloyaltycards.wear@1.0.0+2000000`. **AC 2 met.** The event held no user id or IP, `device` was model, family, manufacturer, brand and simulator only, `app` was version, build, name and identifier only, and its one breadcrumb category was `app.lifecycle`.
- **Device-check defect, fixed:** on the round screen the flagged empty state pushed "Test crash" past the bottom edge (clipped and half off-screen). The empty-state `Column` in `CardListScreen.kt` now scrolls (`fillMaxSize()` then `verticalScroll`, so the plain state stays centred); rechecked: the flagged build scrolls to a fully visible button, the unflagged release stays centred with no button. No automated test: the Wear module has no Compose UI test harness (no `ui-test` dependency, no `createComposeRule`), so the screenshots are the evidence.
- **R8 strips the trigger:** the unflagged release's `mapping.txt` has no `SentryTestCrashException` or `crashForTest`, while `WearCrashReporting` is kept.
- **Phone, iOS simulator iPhone 17 Pro (Debug build, this branch's JS through Metro with `EXPO_PUBLIC_SENTRY_TEST_CRASH=1`):** Settings → Informazioni ends with "Crash di prova Sentry", in the app's dark and light themes; tapping it raised `Cardì Sentry test crash (Story 24.5)` from `triggerSentryTestCrash` via `ActionRow` (the debug error screen, as a debug build does). ifero's app theme and brightness setting were restored afterwards.
- **Unchecked here:** the Android phone emulator (no debug build of the phone app is installed on `Pixel_7` / `pixel8_api37`; the change is JS only and identical on both platforms), and AC 1 itself, which needs a real Android phone.

### Review loops (2026-11-09)

- **Code review, round 1** (fresh Sonnet reviewer, diff since `baseline_commit` after the device-check fix): `VERDICT: APPROVED`, no comments.
- **QA review, round 1** (fresh Sonnet reviewer, every matrix row and acceptance criterion mapped to a running test, the device check or the named verification): `VERDICT: APPROVED`, no comments.

### To ifero

- **IP-derived location still reaches Sentry.** WEAR-OS-1 carries `user.geo` (a city in Italy) although `wear-os` has "Prevent Storing of IP Addresses" on and the app sends no user. The phone's `react-native` project shows the same on its recent events with the same setting on, so Sentry derives a coarse location from the connection IP server-side, whatever either app sends. The matrix row "no … IP-derived location" therefore needs a Sentry-side change (for example an Advanced Data Scrubbing rule on the user's geo data, in both projects), or the disclosure wording to admit a coarse country/city. That is ifero's call and touches 24-1's copy.

### Not done (needs ifero)

- **AC 1 (phone symbolicated crash):** needs a flagged release build on a real Android phone. Device and issue link to be recorded here.
- **AC 3** is shown locally (`bundleRelease` with no token: green, "SENTRY_AUTH_TOKEN not set" warning), not on a CI release run.

### Found, not fixed

- The Wear build-script branches (a non-blank DSN reaching `BuildConfig.SENTRY_DSN`, a malformed DSN failing the build, `autoUploadProguardMapping` true with a token) are only ever built in their empty/off state: `wear-os-build.yml` has no DSN and no token. A cheap follow-up: a CI step that runs `:app:generateReleaseBuildConfig` with a dummy DSN and greps the generated `BuildConfig.java`. Until then the release test crash in `docs/store/privacy-disclosures.md` is the check.
- The Wear mapping skip reason is computed twice, in `build_wear_bundle!` and in `build.gradle.kts`, in the same order, and neither has a test (`Fastfile.test.rb` has no case). It only affects log text; a change to one should change the other.
- Unverified (would be medium): whether the CI `SENTRY_AUTH_TOKEN` can write to `wear-os`, and whether a failed mapping upload fails `bundleRelease`. Settle it on the first nightly after `WEAR_SENTRY_DSN` is set as a secret; the phone's `sentry.gradle` upload already fails a build the same way.

## Spec Change Log

### Review loop 1 (2026-11-09)

- **Triggering findings:** the Wear scrubber trimmed only user, request, server name and the device/app contexts, while the Intent says "trimmed exactly as 24-1 trims the phone" (the phone also masks UUIDs in error text and filters breadcrumbs); the mapping upload was gated on the token alone, so every release lane, which already carries the phone's token, would fail `bundleRelease` uploading to a `wear-os` project that does not exist yet; the build-time DSN check accepted any `https://` URL.
- **Amended:** Code Map (the full phone trim to mirror, the upload's DSN condition, DSN-shaped validation) and the Execution tasks (a `beforeBreadcrumb`, the Robolectric wiring test, one skip notice per cause, the flag test also scanning `package.json` and `.env.example`).
- **Known-bad states avoided:** card or account UUIDs reaching Sentry from Wear error text; Wear release lanes breaking between this merge and ifero creating the project; a malformed secret crashing the Wear app at launch.
- **KEEP (worked, reproduce as before):**
  - Sentry Android Gradle plugin 6.26.0 on AGP 9.3.1 for the mapping upload, every other plugin feature off (auto-install, tracing instrumentation, native symbols/sources, source context, dependency report, telemetry); `sentry-android-core` 8.63.0 only; versions in `libs.versions.toml`.
  - DSN from `-PwearSentryDsn`, else `WEAR_SENTRY_DSN`, blank = absent, into `BuildConfig.SENTRY_DSN`; `-PsentryTestCrash=true` (exactly `true`) into `BuildConfig.SENTRY_TEST_CRASH`; `WEAR_SENTRY_PROJECT` overrides the `wear-os` slug.
  - `WearApplication` + `io.sentry.auto-init` false; `WearCrashReporting` with `shouldInit`, `release`, `configure` (every option off as before, `sendDefaultPii` kept with `@Suppress` and `dataCollection` pinned unconfigured, environment `production` as on the phone) and `crashForTest` throwing `SentryTestCrashException`; the "Test crash" button in the empty card list.
  - Phone: `core/observability/test-crash.ts` (+ test), the last About row, `settings.about.sentryTestCrash` in both locales, `AboutSection.test.tsx` cases.
  - `WEAR_SENTRY_DSN` in the three Android release workflows' job env and their guard warnings naming the Wear mapping; `test/sentry-test-crash-flags.test.ts`; the `docs/cicd.md` Sentry section, the `watch-android/README.md` Crash reporting section and known-gaps rewrite, the `privacy-disclosures.md` checklist item.
  - The OS context passes through whole, as on the phone.
  - A code comment must not claim R8 strips the init path with no DSN: a `String` `isNotBlank()` check is not constant-folded.

## Review Triage Log

| #   | Layer                              | Finding                                                                                                                     | Verdict     | Evidence                                                                                                                                                                                                                                   | Route                                           |
| --- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| 1   | edge-case                          | Mapping upload gated on the token alone; with the phone's token present and no `wear-os` project, `bundleRelease` fails     | high        | All three lanes carry `SENTRY_AUTH_TOKEN` at job level and the org holds only `react-native`, so `autoUploadProguardMapping` is true and the upload targets a missing project                                                              | bad_spec (loop 1)                               |
| 2   | edge-case                          | README/cicd claim "builds, ships and reports nothing" without the DSN                                                       | high        | Same root cause as #1                                                                                                                                                                                                                      | bad_spec (loop 1, with #1)                      |
| 3   | edge-case                          | DSN that passes the `https://` regex but is no DSN throws in `Application.onCreate`                                         | medium      | The regex accepts any https URL; whether `SentryAndroid.init` swallows the parse error is unverified, so the higher grade                                                                                                                  | bad_spec (loop 1)                               |
| 4   | edge-case                          | Build regex accepts any https URL                                                                                           | medium      | Same root cause as #3                                                                                                                                                                                                                      | bad_spec (loop 1, with #3)                      |
| 5   | edge-case, blind, verification-gap | Wear scrubber does not mask UUIDs in exception/message text or filter breadcrumbs; "trimmed exactly as the phone" is untrue | medium      | `sentry.ts` `scrubFreeText`, `scrubBreadcrumb` and `redactValue` have no Wear counterpart; no `beforeBreadcrumb` is set                                                                                                                    | bad_spec (loop 1)                               |
| 6   | blind                              | Lifecycle / app-component breadcrumbs left on                                                                               | medium      | Same root cause as #5: the phone filter drops `ui.*`, which covers `ui.lifecycle`                                                                                                                                                          | bad_spec (loop 1, with #5)                      |
| 7   | edge-case, blind, verification-gap | Fastfile notice says "SENTRY_AUTH_TOKEN not set" when the token is set but upload is disabled                               | low         | `fastlane/Fastfile` `build_wear_bundle!` joins both causes under one message                                                                                                                                                               | moot (re-derived; folded into the amended task) |
| 8   | verification-gap                   | Nothing tests that `WearApplication` is registered and auto-init is off                                                     | medium      | Tests cover only the pure helpers; no test names `WearApplication`                                                                                                                                                                         | moot (re-derived; folded into the amended task) |
| 9   | edge-case, blind                   | Flag test misses `package.json`, `.env.example`, `.github/actions`                                                          | low         | `package.json` and `.env.example` exist and are not scanned; `.github/actions` does not exist                                                                                                                                              | moot (re-derived; folded into the amended task) |
| 10  | blind                              | Comment claims R8 strips the init path with no DSN                                                                          | low         | `SENTRY_DSN` is a `String`; `isNotBlank()` is not constant-folded                                                                                                                                                                          | moot (re-derived; KEEP line)                    |
| 11  | verification-gap                   | Build-script DSN/upload branches only ever built empty/off                                                                  | medium      | `wear-os-build.yml` has neither DSN nor token                                                                                                                                                                                              | defer (Found, not fixed)                        |
| 12  | edge-case                          | Empty `WEAR_SENTRY_PROJECT` empties the slug                                                                                | low         | No workflow sets that variable; only a hand-run could                                                                                                                                                                                      | reject: unlikely                                |
| 13  | edge-case, blind                   | Gradle warning keyed on task names (`Release`) is too broad / misses `build`                                                | low         | Lanes call `bundleRelease` by name; extra warnings on `lintRelease` are harmless                                                                                                                                                           | reject: unlikely, fix adds complexity           |
| 14  | blind                              | Environment hard-coded `production`                                                                                         | false       | The phone uses `production` for every release build too (`sentry.ts` `initSentry`), so this is parity                                                                                                                                      | reject                                          |
| 15  | blind                              | OS context (kernel, build, rooted) passes through whole                                                                     | false       | The phone's `trimContexts` passes every other context through, OS included                                                                                                                                                                 | reject                                          |
| 16  | blind                              | ANR and root check left on                                                                                                  | false       | ANRs are crash diagnostics; root status lands in the OS context, kept as on the phone                                                                                                                                                      | reject                                          |
| 17  | blind                              | No Compose test for the Wear "Test crash" button                                                                            | low         | A single null check on `onTestCrash`; the gate is the BuildConfig constant                                                                                                                                                                 | reject: unlikely                                |
| 18  | blind                              | Phone label translated, Wear label `translatable="false"`                                                                   | low         | Cosmetic, developer-only control                                                                                                                                                                                                           | reject                                          |
| 19  | blind                              | `SentryAndroid.init` on the main thread may cost cold start                                                                 | maybe-false | Would need a startup trace on a watch; would only be low                                                                                                                                                                                   | reject (low if true)                            |
| 20  | blind                              | ProGuard UUID makes each AAB differ                                                                                         | low         | True, but nothing compares AAB bytes; `build_wear_bundle!` checks the signing certificate                                                                                                                                                  | reject                                          |
| 21  | project-conventions                | No violations                                                                                                               | —           | —                                                                                                                                                                                                                                          | —                                               |
| 22  | verification-gap (round 2)         | Only 4 of the phone's `SENSITIVE_KEY_PATTERN` alternatives are tested on Wear                                               | medium      | `WearEventScrubberTest` keys cover barcode, token, email, card number only; dropping `phone` from the Kotlin regex passes                                                                                                                  | patch                                           |
| 23  | verification-gap (round 2)         | Nothing asserts `BuildConfig.SENTRY_TEST_CRASH` is false in an unflagged build                                              | medium      | No test under `watch-android/app/src/test` reads `BuildConfig`; the flag test reads config text only                                                                                                                                       | patch                                           |
| 24  | verification-gap, blind (round 2)  | Fastfile and Gradle skip-reason order duplicated and untested                                                               | low         | Both implement token → disabled → DSN; `Fastfile.test.rb` has no case. Log text only; the decision lives in Gradle                                                                                                                         | defer (Found, not fixed)                        |
| 25  | blind (round 2)                    | `.env.example` assigns a placeholder that passes the DSN check                                                              | low         | `WEAR_SENTRY_DSN=https://examplePublicKey@o0…/0` matches `sentryDsnShape`; exporting the file would point release builds at a fake project                                                                                                 | patch                                           |
| 26  | edge-case (round 2)                | A blank `-PwearSentryDsn=` shadows a set `WEAR_SENTRY_DSN`                                                                  | low         | `gradleProperty(...).orElse(env)` keeps a present-but-blank property; direct one-line fix                                                                                                                                                  | patch                                           |
| 27  | edge-case (round 2)                | `maskUuidsDeep` leaves an `Array` value in breadcrumb data unmasked                                                         | low         | It handles `Map` and `Collection` but not `Array`, while `redact` does; direct one-branch fix                                                                                                                                              | patch                                           |
| 28  | blind, edge-case (round 2)         | Mapping-upload failure (token lacking `wear-os` access, wrong slug, Sentry down) fails `bundleRelease`                      | maybe-false | The slug `wear-os` exists (read 2026-11-09); whether the CI `SENTRY_AUTH_TOKEN` can write to it, and whether the plugin's upload failure is fatal, is unchecked. The phone's `sentry.gradle` upload is fatal the same way. Would be medium | defer (Found, not fixed)                        |
| 29  | blind (round 2)                    | Environment `production`, ANR left on, OS context whole                                                                     | false       | carried #14, #15, #16                                                                                                                                                                                                                      | reject                                          |
| 30  | blind (round 2)                    | `app.lifecycle` and `device.event` breadcrumbs reach Sentry                                                                 | false       | Parity: the phone's filter drops only `console`, `touch`, `ui`, and the RN SDK's native Android layer records the same categories; `isEnableSystemEventBreadcrumbs` is off as documented                                                   | reject                                          |
| 31  | blind, edge-case (round 2)         | Release-warning trigger keyed on task names                                                                                 | low         | carried #13                                                                                                                                                                                                                                | reject                                          |
| 32  | blind, verification-gap (round 2)  | No tests for the DSN regex or the other build-script branches                                                               | medium      | carried #11                                                                                                                                                                                                                                | defer (with #11)                                |
| 33  | blind (round 2)                    | No Compose test for the Wear button; R8 stripping unverified                                                                | low         | carried #17; #23 pins the constant the button hangs on                                                                                                                                                                                     | reject                                          |
| 34  | blind (round 2)                    | Test crashes report as `production` with a real release name                                                                | low         | A test issue is resolved by hand; separating it adds a branch per app                                                                                                                                                                      | reject: unlikely harm                           |
| 35  | blind, edge-case (round 2)         | Flag guard cannot see local `.env`, `~/.gradle`, nested `.github` dirs                                                      | low         | Release lanes run in CI from committed files, which the test scans                                                                                                                                                                         | reject: unlikely                                |
| 36  | blind (round 2)                    | Auth token stored eagerly in the configuration cache                                                                        | maybe-false | Whether Gradle persists an env value read via `.orNull` in the cache entry (vs. fingerprinting it) is unchecked; CI runners are ephemeral. Would be low                                                                                    | reject (low if true)                            |
| 37  | blind (round 2)                    | Test crash reachable only from the empty state                                                                              | low         | README says so ("what an unpaired emulator shows"); AC 2 runs on an AVD                                                                                                                                                                    | reject                                          |
| 38  | blind (round 2)                    | "Add rules 1–5" may not fit the Wear payload shape                                                                          | low         | A console checklist step for ifero; the rules key on field names Sentry normalises across SDKs                                                                                                                                             | reject                                          |
| 39  | blind (round 2)                    | Unwrapped README line; AGP compatibility claim unaudited                                                                    | false       | `yarn format:check` passes; the claim is backed by the green `bundleRelease` on AGP 9.3.1 recorded in Implementation Notes                                                                                                                 | reject                                          |
| 40  | edge-case (round 2)                | A malformed DSN in the shell fails every Gradle task, not only release                                                      | low         | A loud failure with a message that says how to fix it                                                                                                                                                                                      | reject                                          |
| 41  | edge-case (round 2)                | Robolectric `testReleaseUnitTest` with a DSN exported initialises real Sentry                                               | low         | Init sends nothing without an event; session tracking and client reports are off; CI runs only `testDebugUnitTest`                                                                                                                         | reject: unlikely                                |
| 42  | edge-case (round 2)                | `http.query` / `http.fragment` breadcrumb keys survive                                                                      | false       | No source: no OkHttp integration, plugin auto-install off, network-event breadcrumbs off                                                                                                                                                   | reject                                          |
| 43  | edge-case (round 2)                | Cyclic or very deep breadcrumb data                                                                                         | low         | The SDK's own breadcrumbs carry flat string data                                                                                                                                                                                           | reject: unlikely                                |
| 44  | edge-case (round 2)                | Typed contexts (`Response`, `Feedback`) not key-redacted                                                                    | low         | Neither is produced: no OkHttp failed-request integration, no feedback API used                                                                                                                                                            | reject: unlikely                                |
| 45  | project-conventions (round 2)      | No violations                                                                                                               | —           | —                                                                                                                                                                                                                                          | —                                               |

## Verification

**Commands:**

- `yarn typecheck`, `yarn lint`, `yarn format:check`, `yarn test` -- expected: pass
- `cd watch-android && ./gradlew testDebugUnitTest lintDebug assembleDebug bundleRelease` -- expected: green, with and without the DSN property

**Manual checks (if no CLI):**

- The two test crashes above, and one Wear event inspected for the removed fields. Not OTA-eligible (native).

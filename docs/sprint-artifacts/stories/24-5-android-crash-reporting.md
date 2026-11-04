---
title: 'Android and Wear OS crash reporting'
type: 'feature'
created: '2026-11-04'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
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

## Tasks & Acceptance

**Execution:**

- [ ] `watch-android/` (Gradle, a new `Application` subclass and manifest entry, the init and the scrubber, plus tests) -- the Wear SDK as above, with the DSN read from a Gradle property or environment variable into `BuildConfig`. Rationale: the Wear signal.
- [ ] `fastlane/Fastfile` and the three Android release workflows -- pass `WEAR_SENTRY_DSN`; mapping upload behind the token guard. Rationale: deobfuscated Wear stacks.
- [ ] The phone test trigger (Settings, About, only when `EXPO_PUBLIC_SENTRY_TEST_CRASH === '1'`) and its Wear counterpart, plus a test that no workflow sets either flag. Rationale: proof without shipping a crash button.
- [ ] Story 24-1's copy surfaces (`docs/store/privacy-disclosures.md` included) -- the Wear disclosure, if 24-1 has merged; otherwise record it there before 24-1 ships. Rationale: decision 2.
- [ ] `docs/cicd.md`, `watch-android/README.md` -- the Sentry pipeline (projects, DSNs, tokens, the guard, what each lane uploads, how to read a crash). Rationale: the gap.

**Acceptance Criteria:**

- Given a flagged phone release build on a real Android phone, when the test crash fires, then Sentry shows it symbolicated. Implementation Notes record the device and the issue link.
- Given a flagged Wear release build on a round AVD (or a real watch), when the test crash fires, then the Wear project shows it deobfuscated. The Epic 10 action item's done condition is then met.
- Given a release lane run without `SENTRY_AUTH_TOKEN`, when it builds, then it succeeds with a skip warning.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `yarn typecheck`, `yarn lint`, `yarn format:check`, `yarn test` -- expected: pass
- `cd watch-android && ./gradlew testDebugUnitTest lintDebug assembleDebug bundleRelease` -- expected: green, with and without the DSN property

**Manual checks (if no CLI):**

- The two test crashes above, and one Wear event inspected for the removed fields. Not OTA-eligible (native).

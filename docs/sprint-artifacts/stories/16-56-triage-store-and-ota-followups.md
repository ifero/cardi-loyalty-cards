---
baseline_commit: '4bbfcbd1cd08640a3a80b08f6614744ee6cb8aac'
title: 'The store and OTA follow-ups: nothing checks the generated privacy manifests, the runtime version never moves with a native change, and the Wear snapshot reports an expected failure as an error'
type: 'chore'
created: '2026-11-25'
status: 'backlog'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Three release-path hazards survive in the repository.

1. **Nothing verifies the store build output.** Story 24.2's tests read only *inputs* -- `app.json`, the `.xcprivacy` sources, `build.gradle.kts`. The generated phone `PrivacyInfo.xcprivacy`, the Gradle SDK properties, each watch bundle's copied manifest and the `with-watch-privacy-manifest` strip were verified once, by hand. An `expo-build-properties` option rename, an apple-targets upgrade or an RN aggregation change would pass every test and break the upload.
2. **The runtime version never moves with a native change.** `app.json` uses `runtimeVersion.policy: "appVersion"` and `version` has been `1.0.0` since the first commit. Story 24.4 moved `react-native-screens` to 4.25.2 -- a native change -- so an `eas update` from `main` would give installed 4.23.0 binaries JavaScript built for 4.25.2. **Until a new store binary ships, no OTA may be published from `main`.**
3. **The Wear snapshot reports an expected failure as an error.** `core/wear-connectivity.ts:251` sends a Sentry warning on every snapshot push from a phone without the Wearable API (`ApiException` 17, `API_UNAVAILABLE`). That is expected and permanent -- most phones do not have the API -- so the channel fills with noise that hides the real events.

**Approach:** Close the verification gap with a build-output check, move the runtime version off `appVersion` or make the policy one that tracks native changes, and stop reporting the expected Wearable-API absence as an error.

**Decisions (pending ifero's approval):**

- **The runtime version policy moves to `fingerprint`** rather than the version being bumped for every native change. A fingerprint-derived runtimeVersion tracks the native surface, so an OTA is only offered to binaries it actually matches. Bumping the version by hand is a discipline problem; a fingerprint is a mechanism. The alternative -- `expo.install.exclude` staying with an explicit exit condition -- is unaffected either way.
- **`expo.install.exclude` keeps its entry with a written exit condition**, rather than being lifted now. The exclusion exists because `react-native-screens` 4.25 needs a newer peer RN than the SDK 55 pin allows; it is lifted when Expo's `bundledNativeModules.json` pins `>= 4.25.0`.
- **The `API_UNAVAILABLE` snapshot failure is logged once, not reported.** It is an expected capability absence, not an error.

## Boundaries & Constraints

**Always:** The build-output check runs in CI and fails the same way the other gates do. The privacy manifests themselves are unchanged -- the story verifies what is generated, it does not change what is declared. The SDK-36 phone target and the Wear OS's 35 (which Play's Wear rule allows) are unchanged. The `expo.install.exclude` entry names the package and the reason, and AGENTS.md says plainly that an excluded package is installed with Yarn on purpose.

**Never:** Publish an OTA, a build or a store submission from this story. Change the phone's target SDK or the Wear OS's. Change the `react-native-screens` pin. Change the Sentry DSN, the sample rate or the scrubbing. Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| -------- | ------------- | ------------------------- | -------------- |
| A prebuild changes the manifest | The generated `PrivacyInfo.xcprivacy` differs from what the sources imply | The CI check fails with the difference | The job fails |
| A watch bundle loses its manifest | The copied manifest is missing after `pod install` | The CI check fails | The job fails |
| An OTA is published | The runtime version is fingerprint-derived | The OTA is offered only to binaries that match it | N/A |
| `expo install --check` runs | `react-native-screens` is excluded | The exclusion is skipped, as today, and the reason is written down | N/A |
| A phone without the Wearable API syncs | The snapshot publish fails with `API_UNAVAILABLE` | Nothing is reported to Sentry; the failure is logged once | N/A |
| A phone with the Wearable API syncs | The publish fails for another reason | The failure is reported, as today | N/A |

</frozen-after-approval>

## Code Map

- `test/store-platform-requirements.test.ts:6` -- `import appJson from '../app.json';`; `:158` -- `path.join('targets', target, 'PrivacyInfo.xcprivacy')`; the header at `:11-18` states the scope: *"phone app's manifest is declared in `app.json` and written by `withPrivacyInfo` at prebuild"*. It reads the **sources**, never the generated output.
- `app.json` -- the phone's privacy manifest declaration and the SDK pins; `:12` `"supportsTablet": false`; the `expo.privacyManifests` block.
- `targets/watch/PrivacyInfo.xcprivacy`, `targets/watch-widget/PrivacyInfo.xcprivacy` -- the watch bundles' own manifests.
- `package.json:164-170` -- `"expo": { "install": { "exclude": ["react-native-screens"] } }`; `:108` -- `"react-native-screens": "~4.25.2"`.
- `AGENTS.md:100-125` -- the "Library Installation (Expo Projects)" rule: *"ALWAYS use the following process … `npx expo install`"* and *"NEVER use `yarn add` or `npm install` directly"*. It does not mention the exclusion.
- `app.json:5` -- `"version": "1.0.0"`; `:213-215` -- `"runtimeVersion": { "policy": "appVersion" }`; `:216-218` -- the `updates.url`. `package.json:3` is also `1.0.0`.
- `core/wear-connectivity.ts:245-257` -- `catch (error) { logger.notify('Wear OS card snapshot publish failed', { tags: { surface: 'wear-sync', outcome: 'publish-error' }, context: [{ error: String(error) }] }); return false; }` -- no filter for `ApiException` 17 / `API_UNAVAILABLE`.
- `core/observability/sentry.ts` -- the `logger.notify` path; the Sentry configuration and the scrubbing are out of scope.
- `.github/workflows/` -- the workflows that run `npx expo prebuild` (`android-release.yml:126`, `beta-releases.yml:113,213`, `ios-release.yml:161`, `nightly-builds.yml:268,405`, `phone-wear-module-tests.yml:109`); none of them asserts the generated output.
- `scripts/verify-native-patches.mjs`, `scripts/verify-native-strings.mjs` -- the repo's existing "verify the native side" gates, and the shape a new one should take.
- Do not change: the declared manifests, the SDK pins, the Sentry configuration, the release workflows' triggers.

## Tasks & Acceptance

**Execution:**

- [ ] A CI check that runs a prebuild and asserts the **generated** output: the phone's `PrivacyInfo.xcprivacy`, each watch bundle's copied manifest, the Gradle SDK properties, and the `with-watch-privacy-manifest` strip (that the watch and watch-widget targets have their manifest in their Resources phase after `pod install`).
- [ ] `test/store-platform-requirements.test.ts` -- keep the input checks, and add the generated-output assertions to the new check (they need a prebuild, so they belong to a job that has one).
- [ ] `app.json` -- `runtimeVersion.policy` moves to `fingerprint`, or the version is bumped for every native change and the rule is recorded; whichever is decided, an OTA can no longer target a binary that lacks the native module it needs.
- [ ] `package.json` -- the `expo.install.exclude` entry carries its exit condition in a comment: it is lifted when Expo's `bundledNativeModules.json` pins `react-native-screens` `>= 4.25.0`.
- [ ] `AGENTS.md` -- the "Library Installation" rule says that a package in `expo.install.exclude` is installed with Yarn on purpose, and why.
- [ ] `core/wear-connectivity.ts` -- an `API_UNAVAILABLE` / `ApiException` 17 snapshot failure is logged once and not reported to Sentry; every other failure is reported as today.
- [ ] `core/wear-connectivity.ts` (+ test) -- a test that an `API_UNAVAILABLE` failure reports nothing and that another failure still reports.
- [ ] The Sentry REACT-NATIVE-B watch item: record the observation plan (one Android 17 Fabric `addViewAt` event, no `react-native-screens` frame) and the threshold that would make it its own story.
- [ ] `yarn lint`, `yarn typecheck`, `yarn test` -- green.

**Acceptance Criteria:**

- Given a change to `app.json`, the `.xcprivacy` sources or `build.gradle.kts`, when CI runs the prebuild and the build-output check, then a manifest or SDK property that no longer matches the sources fails the job.
- Given a watch bundle whose privacy manifest is not in its Resources phase after `pod install`, when the check runs, then it fails.
- Given an OTA is published from `main`, when Expo computes its runtime version, then the OTA is offered only to binaries it matches -- never to a binary that lacks the native module the OTA's JavaScript needs.
- Given `expo install --check`, when it runs, then `react-native-screens` is skipped as today, and the reason and the exit condition are written down where an agent will find them.
- Given AGENTS.md's "Library Installation" rule, when an agent reads it, then it says that a package in `expo.install.exclude` is installed with Yarn on purpose.
- Given a phone without the Wearable API that syncs to a watch, when the snapshot publish fails, then nothing is reported to Sentry.
- Given a phone with the Wearable API whose publish fails for another reason, when it fails, then the failure is reported as today.

## Design Notes

The verification gap is the most expensive of the three, because it is invisible until a store upload is rejected. Every other gate in this repository checks a source; this one checks the build product, and the build product is where an iOS manifest, an Android SDK property and a plugin's strip actually live.

The runtime version is the one with a live hazard. `appVersion` couples the OTA's target to a number a human bumps -- and Story 24.4 is exactly the case that breaks: a native dependency moved, the version did not. A fingerprint-derived runtimeVersion removes the human from the loop, which is the difference between a policy that works and a policy that is remembered.

The Wearable-API noise is the smallest of the three and the most certain: the API is absent on most phones, so the channel reports an expected absence on every sync. One filtered exception reclaims the signal.

## Implementation Notes

- Source issues: #294 (all three items) and #298 (all five items).
- The `expo.install.exclude` entry came from Story 24.4 (`f6d2df7 fix(deps): bump react-native-screens to
  4.25.2 for the Android DecorView crash (Story 24.4) (#299)`), whose tracker note records the reasoning:
  the SDK 55 pin would put `react-native-screens` back to `~4.23.0` and bring the crash back.
- The runtime version hazard is recorded in the 24.4 tracker note: *"Until a new store binary ships,
  publish no OTA update from main."* Moving to `fingerprint` is the lasting fix the issue asks for.
- `app.json:12` `"supportsTablet": false` is Story 24.6's decision (`da43fab`) and is unaffected.
- `core/wear-connectivity.ts:251` is the **only** `logger.notify` on the snapshot path; `logger.notify` is
  the Sentry-reporting wrapper (`core/utils/logger.ts`), so the filter belongs where the exception is
  classified, not in the Sentry configuration.
- The `API_UNAVAILABLE` constant is an Android API 17 (`ApiException` with code 17) -- the
  `android.companion.WearableDeviceProvider` service is absent. It is expected on any phone without a
  Wear OS companion, which is most of them.
- The REACT-NATIVE-B observation needs a Sentry query, which needs credentials this environment does not
  have; the story records the plan rather than a result.
- The build-output check needs a prebuild, so it belongs in a job that already runs one
  (`phone-wear-module-tests.yml` runs an Android prebuild on PRs and is the cheapest host for it) or in a
  new job that mirrors it for iOS.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors
- `yarn lint` -- expected: no errors
- `yarn format:check` -- expected: clean
- `yarn test` -- expected: all suites pass
- the new build-output check -- expected: the generated manifests and SDK properties match their sources

**Manual checks (if no CLI):**

- Run `npx expo prebuild --clean --platform ios`, then `pod install`, and confirm the generated phone
  `PrivacyInfo.xcprivacy` and both watch manifests are present where the upload expects them.

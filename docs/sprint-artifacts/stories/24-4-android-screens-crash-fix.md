---
title: 'Android screens crash fix'
type: 'bugfix'
created: '2026-11-04'
status: 'done'
baseline_commit: 'c9beef8a55bc80f8ba98492d48595e6640be9937'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `react-native-screens` is pinned at `~4.23.0` (Expo SDK 55's pin). That version carries a known fatal Android crash, upstream issue #4311: `Screen.onLayout` throws `IllegalArgumentException: [RNScreens] DecorView is required for applying inset correction, but was null`. It fires on a default native stack with a visible header, which is this app's configuration. One upstream reporter counted 26 crashes across 22 users in two weeks. Sentry shows no native crash from testers in the last 90 days, but the tester population is small. A public launch is where it would surface.

**Approach:** Start with a spike. Confirm that the fix is in 4.25.x (changelog or PR), then bump to the newest 4.25 patch. The 4.25 line declares `react-native >= 0.82`, and this app runs 0.83.6; 4.26.0 needs 0.84, so it is ruled out. Record the off-pin version in `expo.install.exclude` so `expo install --fix` does not revert it. Prove the bump on a real Android phone build, and check that iOS has not regressed.

## Boundaries & Constraints

**Always:**

- **Version:** the newest `4.25.x` only, installed with Yarn, the lockfile updated, and nothing else bumped.
- **Evidence:** the spike writes into Implementation Notes:
  - the upstream evidence that 4.25.x contains the #4311 fix, with its link;
  - the exact version chosen;
  - the `expo-doctor` and `npx expo install --check` output before and after.
- **Stop rule:** if any of the following holds, stop and report to ifero rather than working around it.
  - the fix is not in 4.25.x;
  - the build fails on SDK 55 or on the new architecture (`newArchEnabled: true`, which 4.25 requires);
  - a peer conflict appears with `expo-router` 55, `@react-navigation/native-stack` 7.14 or `bottom-tabs` 7.15.

  Pulling the SDK 57 thread (16-18) forward is not this story's call.

**Never:**

- Touch the other SDK 57 bumps: Reanimated, worklets, gesture-handler, safe-area-context.
- Upgrade React Navigation.
- Change navigation code beyond what the bump forces.
- Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario                  | Input / State                     | Expected Output / Behavior                                                            | Error Handling         |
| ------------------------- | --------------------------------- | ------------------------------------------------------------------------------------- | ---------------------- |
| Fix present in 4.25.x     | The spike finds the fix in 4.25.N | `~4.25.N` installed and recorded in `expo.install.exclude`                            | N/A                    |
| Fix absent or build fails | Either one                        | Nothing lands; ifero gets the findings                                                | Stop rule              |
| Android navigation        | Release build on a phone          | Every header-bearing stack push and pop, the tabs and the modals open without a crash | N/A                    |
| iOS navigation            | Simulator build                   | No visual or behavioural change, including card detail's `scrollEdgeEffects` gradient | Regression → stop rule |

</frozen-after-approval>

## Code Map

- `package.json:108` -- `"react-native-screens": "~4.23.0"`. It has no `expo.install` section yet; add one with `exclude: ["react-native-screens"]`.
- `node_modules/expo/bundledNativeModules.json` -- Expo's pin `~4.23.0`, the source of the doctor and install warnings.
- Peers, as read on 2026-11-04 with `npm view`:
  - 4.24.0: `react-native: *`;
  - 4.25.0–4.25.2: `>=0.82.0`;
  - 4.26.0: `>=0.84.0` (ruled out).
  - `expo-router` 55.0.13 accepts `*`; `@react-navigation/native-stack` and `bottom-tabs` accept `>= 4.0.0`.
- `app.json` -- `newArchEnabled: true`. 4.25 dropped the legacy architecture.
- `features/cards/screens/CardDetailScreen.tsx:103` -- depends on the screens library's `scrollEdgeEffects` on iOS. This is the iOS regression check.
- `app/` -- the Expo Router stacks and tabs to walk on device.
- No CI job runs `expo-doctor`, so the check is done by hand.

## Tasks & Acceptance

**Execution:**

- [x] Spike -- read the 4.25.x changelog and the fix PR for #4311; run `npx expo install --check` and `npx expo-doctor` before the bump. Record both. Rationale: evidence before change.
- [x] `package.json`, `yarn.lock` -- `react-native-screens@~4.25.N` and `expo.install.exclude`. Rationale: the fix, kept from being reverted.
- [ ] Verification build -- Android release (or preview) on a phone and an iOS simulator build; walk the matrix rows. Rationale: proof on hardware.

**Acceptance Criteria:**

- Given the bump, when `yarn typecheck`, `lint`, `test` and `check:native-patches` run, then all pass.
- Given `npx expo install --check` after the bump, when it runs, then `react-native-screens` is reported as excluded, not as a mismatch.
- Given an Android release build on a real phone, when every route in `app/` is opened and closed, then no crash occurs. Implementation Notes record the device and Android version. This is native, so a new store binary is needed; it cannot ship as an OTA update.

## Implementation Notes

### Spike: the #4311 fix is in 4.25.x (confirmed 2026-11-08)

- Issue: https://github.com/software-mansion/react-native-screens/issues/4311 (still open; it asks for a 4.23.1 backport). The issue states the crash is in 4.23.0 and 4.24.0 and fixed in 4.25.0. No 4.23.1 or 4.24.1 has been published to npm.
- Fix: PR #3793, "fix(Android, Stack v4): Add heuristic for applying inset only on top-level header", merged 2026-04-09 as `e74d69f0d08ae18a847abf4fcc4f4e51b800ee88`. https://github.com/software-mansion/react-native-screens/pull/3793
- It ships in 4.25.0: the GitHub compare puts `e74d69f0` behind the `4.25.0` tag by 63 commits (an ancestor) and 97 commits ahead of `4.24.0` (not in it); the 4.25.0 release notes list #3793.
- Shipped code: the throwing `requireNotNull` (`"[RNScreens] DecorView is required for applying inset correction, but was null."`) is at `Screen.kt:363` in the installed 4.23.0, and the string is absent from the published 4.25.2 tarball's `android/` sources.

### Version chosen

- `react-native-screens@~4.25.2` (resolved 4.25.2, the newest 4.25 patch; peer `react-native >=0.82.0`, `react *`). 4.26.x needs RN 0.84 and is ruled out.
- Installed with `yarn add react-native-screens@~4.25.2`. The `yarn.lock` diff is the one `react-native-screens` entry; nothing else moved. No new peer warning names `react-native-screens`; every warning `yarn add` printed was already there.
- `package.json` gains `expo.install.exclude: ["react-native-screens"]`.
- 4.25.0 drops the legacy architecture; `app.json` already has `newArchEnabled: true`. Its other breaking changes touch native Tabs (`freezeContents`/`placeholder` removed, Tabs `scrollEdgeEffects` moved to `ScrollViewMarker`). The app uses no native tabs (`expo-router/unstable-native-tabs` is not imported), and card detail sets the native-stack `scrollEdgeEffects` option, which was not changed.

### `npx expo install --check`

Before (exit 1): 22 patch mismatches already exist, all outside this story (`expo` 55.0.19 → ~55.0.32, `react-native` 0.83.6 → 0.83.10, `expo-router` 55.0.13 → ~55.0.18, `jest-expo`, and 18 `expo-*` modules). `react-native-screens` was not listed, since 4.23.0 matched the pin.

After (exit 1): the same 22 mismatches, plus one new line:

```
Skipped checking dependencies: react-native-screens. These dependencies are listed in expo.install.exclude in package.json.
```

### `npx expo-doctor` (expo-doctor 1.21.6)

Before and after are identical: 16/20 checks passed, 4 failed, all already failing before the bump:

1. package.json scripts conflict with `node_modules/.bin` (`chromatic`, `storybook`);
2. app.json schema: `ios.minimumOsVersion` is not allowed;
3. React Native Directory: `react-native-edge-to-edge` is unmaintained, and `wear-data-layer` and `react-native-image-code-scanner` have no metadata;
4. the same 22 patch mismatches as above; `react-native-screens` is not among them.

### Gates (worktree, after the bump)

`yarn install --frozen-lockfile` is clean. This is Yarn 1.22, so `--frozen-lockfile` stands in for `--immutable`. `yarn typecheck`, `lint`, `format:check` and `check:native-patches` (1 patch verified) all pass. `yarn test` passes: 225 suites, 4611 tests.

### Device check (2026-11-08)

Native builds can't run from a `.claude` worktree, so with ifero's approval this branch's `package.json` and `yarn.lock` were applied to the main checkout as a temporary uncommitted change. After the check the main checkout was put back: clean `main`, screens 4.23.0, and no generated `ios/` or `android/` folders.

**iOS: passed.**

- Setup: `expo run:ios` debug build on an iPhone 17 Pro simulator running iOS 26.4. `pod install` resolved `RNScreens (4.25.2)`, and the build reported "Build Succeeded". That settles the stop-rule build condition for iOS: 4.25.2 builds on SDK 55 with the new architecture.
- Routes walked, with no crash and no screens warning in the log:
  - home;
  - card detail: push, scroll, back button and swipe-back;
  - the full-screen barcode modal: open and close;
  - edit card;
  - settings, the theme sheet, sign in, forgot password and create account;
  - help, privacy policy and data summary;
  - add card: the catalogue, the nested scanner, then setup.
- Card detail's `scrollEdgeEffects`:
  - At rest the field shows no dark iOS 26 edge gradient, in both light and dark mode, so `top: 'hidden'` still applies.
  - On scroll the app's own `CardDetailHeaderBackground` and title fade in as designed.
- Not reachable on a device that has finished onboarding: `welcome`, `onboarding/*`, `verify-email`, `new-password` and `recovery-otp`. Their guards redirect home, which is the guard working as designed and not a crash.
- Log contents: only the existing `help-fallback.ts` default-export warning, an `onAnimatedValueUpdate` dev warning and simulator CoreMotion noise.

**Android: compiled; never ran on the emulator.**

- What passed: `./gradlew :app:assembleRelease` for arm64 built a release APK with 4.25.2. That settles the stop-rule build condition for Android. The first run failed only at the Sentry source-map upload (no local auth token), so the APK was built with `SENTRY_DISABLE_AUTO_UPLOAD=true`.
- What failed: the Pixel 7 emulator, an Android 37 Play Store image, hangs at boot on this Mac ("detected a hanging thread 'QEMU2 CPU0 thread'"). It hung with automatic, host and SwiftShader GPU rendering, and the second phone AVD uses the same image.
- **Unchecked, and goes to ifero:** the AC's real-phone pass (open and close every route, record the device and Android version). The debug-signed release APK from this run can be sideloaded for that pass (scratchpad: `cardi-24-4-screens-4.25.2-release-arm64.apk`).

Screenshots are kept outside the repository, in the session's tool-results folder (`~/.claude/projects/…/tool-results/`).

### Review loops (2026-11-08)

- Code review, round 1 (Sonnet): `VERDICT: APPROVED`, no findings.
- QA review, round 1 (Sonnet), which maps every matrix row and AC to its evidence: `VERDICT: APPROVED`, no findings. The Android real-phone pass is recorded above as going to ifero.

### Final verification (2026-11-08, final tree)

- `yarn install --frozen-lockfile`: clean.
- `yarn typecheck`, `lint`, `format:check` and `check:native-patches`: pass. `format:check` passed after Prettier reformatted this spec's triage table.
- `yarn test`: 225 suites, 4611 tests passed.
- `npx expo install --check`: reports "Skipped checking dependencies: react-native-screens" (excluded). It exits 1 only on the 22 mismatches that were there before this change.
- `npx expo-doctor`: 16/20, the same 4 failures as before the bump. No new failure.

### Sentry check (2026-11-08, at ifero's request)

Queried org `andrea-pacino`, project `react-native`, for `level:fatal` over 90 days and for `RNScreens DecorView`.

- **#4311 has not fired in production.** No event matches the DecorView message, so the bump is still preventive.
- **One fatal Android crash exists, and it is not #4311:**
  - Issue: [REACT-NATIVE-B](https://andrea-pacino.sentry.io/issues/REACT-NATIVE-B).
  - Error: `IllegalStateException: addViewAt: failed to insert view [942] into parent [978] at index 0`, caused by "The specified child already has a parent".
  - When and where: 2026-11-06 on a Samsung SM-S931B running Android 17, release `1.0.0+4000060`, installed from Play, with an OTA update running.
  - The stack is all React Native Fabric mounting (`SurfaceMountingManager.addViewAt` → `ReactClippingViewManager.addView`), with no `com.swmansion.rnscreens` frame. Nothing in it ties the crash to `react-native-screens`, so this story makes no claim to fix it. It has one occurrence, there are no breadcrumbs or JS stack, and it cannot be reproduced from this event alone.
- **The high-volume "notify" issues are not crashes.**
  - Issues: [REACT-NATIVE-6](https://andrea-pacino.sentry.io/issues/REACT-NATIVE-6) (555 events) and REACT-NATIVE-5.
  - They are `warning`-level `logger.notify` calls from `core/wear-connectivity.ts:251`, "Wear OS card snapshot publish failed".
  - The sample event comes from a phone with no Wear OS support (`ApiException: 17: API: Wearable.API is not available on this device`). The phone reports this on every card push, even though no watch can ever pair with it.

### Found, not fixed

- REACT-NATIVE-B, the Fabric `addViewAt` "child already has a parent" crash on Android 17. Watch whether it recurs on the 4.25.2 build. If it does, it needs its own story with a reproduction.
- `core/wear-connectivity.ts:251` notifies Sentry on every snapshot push from phones without the Wearable API (`ApiException` status 17, `API_UNAVAILABLE`). That outcome is expected and permanent, so it should be suppressed or logged once, not sent as a warning. Today it drowns real signal (REACT-NATIVE-5 and REACT-NATIVE-6).
- **OTA runtime version does not move with native changes.** `app.json` sets `runtimeVersion.policy: "appVersion"`, and `version` has been `1.0.0` since the first commit. Earlier native changes, such as the 21.6 fonts and the 21.1 rename, shipped under the same runtime too. An `eas update` published from main after this merge would deliver the 4.25.2 JavaScript to installed binaries built with 4.23.0 native code, because no workflow publishes updates and nothing blocks the pairing. Until the next binary is out, publish no OTA update from main. The lasting fix, a version bump per native change or the `fingerprint` policy, is a release-policy decision for ifero.
- **`expo.install.exclude` has no exit condition.** Once screens is excluded, `expo install --check`/`--fix` and expo-doctor skip it at every SDK upgrade. Remove the exclusion in the SDK upgrade story (16-18) once Expo's `bundledNativeModules.json` pins `>= 4.25.0`.
- **AGENTS.md has no note on excluded packages.** Its "Library Installation" rule says always use `npx expo install`. An agent that "fixes" the dependency that way, by adding the `~4.23.0` pin back explicitly, would bring the crash back. Add a line saying that packages listed in `expo.install.exclude` are installed with Yarn on purpose. That is an agent-context edit, so it is out of this story's scope.

## Spec Change Log

## Review Triage Log

Pass 1 (2026-11-08): blind hunter, edge-case hunter, verification gap, project conventions.

| #   | Source                                 | Finding                                                                                                             | Verdict | Route        | Evidence                                                                                                                                                                                                                             |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | verification gap                       | No native build or device pass proves 4.25.2 builds, fixes the crash, or keeps the iOS `scrollEdgeEffects` gradient | high    | to the human | True. Jest mocks `Stack.Screen`, and no PR workflow compiles native code. This is the spec's unchecked verification task and the DEVICE CHECK. Project-context forbids native builds from a `.claude` worktree, so it goes to ifero. |
| 2   | verification gap (other), blind hunter | `runtimeVersion` `appVersion` at a fixed `1.0.0` lets an OTA update pair 4.25 JS with 4.23 native code              | medium  | defer        | True, but not caused by this story: `version` has been `1.0.0` since `a0e47f3`, across every native change since. Recorded under Found, not fixed, and raised with ifero at the handback.                                            |
| 3   | edge-case hunter, blind hunter         | `expo.install.exclude` has no exit condition                                                                        | medium  | defer        | True: the exclusion is permanent until someone removes it. It belongs to the SDK upgrade (16-18); recorded under Found, not fixed.                                                                                                   |
| 4   | edge-case hunter, blind hunter         | `~4.25.2` should be the exact pin `4.25.2`                                                                          | low     | reject       | The frozen intent names `~4.25.N`, and the lockfile holds 4.25.2 (CI installs frozen). A later 4.25.x needs a deliberate lockfile change, so the risk is low and an exact pin would contradict the approved version line.            |
| 5   | blind hunter                           | Nothing guards against a downgrade below 4.25.0                                                                     | low     | reject       | A downgrade needs someone to explicitly reinstall screens at Expo's pin. That is unlikely in everyday use, and the fix adds a new check (complexity). Finding 6's AGENTS.md note covers the route by which it would happen.          |
| 6   | project conventions, blind hunter      | `yarn add` plus the exclusion departs from the AGENTS.md "use `npx expo install`" rule, with no note in AGENTS.md   | low     | defer        | The departure itself is false as a defect: the frozen intent mandates Yarn and the exclusion, because `expo install` would restore `~4.23.0`. The missing AGENTS.md note is real, but adding it edits an agent-context file.         |
| 7   | blind hunter                           | The reviewed diff leaves out the story spec and the tracker                                                         | false   | reject       | Excluded by design (DIFF FOR REVIEW): the spec reaches the edge-case layer as the claims file. Both files ship in the same PR.                                                                                                       |

## Verification

**Commands:**

- `yarn install --immutable` after the lockfile change -- expected: clean
- `yarn typecheck`, `yarn lint`, `yarn format:check`, `yarn test`, `yarn check:native-patches` -- expected: pass
- `npx expo install --check`, `npx expo-doctor` -- expected: screens excluded, no new failures

**Manual checks (if no CLI):**

- The Android phone pass and the iOS simulator pass above, light and dark, card detail included.

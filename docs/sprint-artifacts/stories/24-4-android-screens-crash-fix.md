---
title: 'Android screens crash fix'
type: 'bugfix'
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

- [ ] Spike -- read the 4.25.x changelog and the fix PR for #4311; run `npx expo install --check` and `npx expo-doctor` before the bump. Record both. Rationale: evidence before change.
- [ ] `package.json`, `yarn.lock` -- `react-native-screens@~4.25.N` and `expo.install.exclude`. Rationale: the fix, kept from being reverted.
- [ ] Verification build -- Android release (or preview) on a phone and an iOS simulator build; walk the matrix rows. Rationale: proof on hardware.

**Acceptance Criteria:**

- Given the bump, when `yarn typecheck`, `lint`, `test` and `check:native-patches` run, then all pass.
- Given `npx expo install --check` after the bump, when it runs, then `react-native-screens` is reported as excluded, not as a mismatch.
- Given an Android release build on a real phone, when every route in `app/` is opened and closed, then no crash occurs. Implementation Notes record the device and Android version. This is native, so a new store binary is needed; it cannot ship as an OTA update.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `yarn install --immutable` after the lockfile change -- expected: clean
- `yarn typecheck`, `yarn lint`, `yarn format:check`, `yarn test`, `yarn check:native-patches` -- expected: pass
- `npx expo install --check`, `npx expo-doctor` -- expected: screens excluded, no new failures

**Manual checks (if no CLI):**

- The Android phone pass and the iOS simulator pass above, light and dark, card detail included.

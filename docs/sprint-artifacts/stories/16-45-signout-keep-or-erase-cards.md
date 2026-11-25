---
title: 'Signing out leaves every card on the device, with no choice to erase them'
type: 'bugfix'
created: '2026-11-24'
baseline_commit: '1d255089bc10cdd6157936cf74bca972a76050fb'
status: 'in-review'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Sign Out (Settings → Account) clears only the local Supabase session and the last-sync timestamp. Every card in the local SQLite database, and on the paired watch, stays behind, and the sheet offers no way to remove them. On a shared or handed-on phone the next person sees the previous account's cards.

**Approach:** The existing sign-out sheet asks whether to keep or erase the cards on this device. Keep behaves exactly as today. Erase signs out first and, only once sign-out has succeeded, deletes every local card with the existing `deleteAllCards`, which also pushes the empty list to the watch. The cloud copy is never touched, so signing back in brings the cards back.

**Decisions (ifero, 2026-11-25):**

- **Three stacked buttons** in the existing sheet: "Sign out, keep cards" (secondary), "Sign out and erase cards" (destructive), then Cancel (outlined). The body says what each choice does to the cards on this device.
- **Erase does not sync first.** It works offline, and the body warns that cards not yet synced to the account are lost for good.

## Boundaries & Constraints

**Always:** Sign-out runs before any erase, and a failed sign-out erases nothing. Erasing deletes local rows only: no cloud request, and no entries in the pending-deletion queue (`core/sync/deletion-tracker.ts`), so the next sign-in downloads the cards again. English and Italian copy change together. Request failures stay in the sheet's banner, as today. `Pressable` rules and safe-area rules from AGENTS.md hold. Existing tests that pin the old two-button sheet or its copy are updated, not deleted.

**Never:** Change Delete Account (its own "local cards remain" behaviour is out of scope). Change the cloud-sync merge, the deletion tracker or the sync dirty flag. Add a dependency or a new modal component (reuse `BottomSheet` and `Button`). Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario                 | Input / State                                  | Expected Output / Behavior                                                                           | Error Handling                                 |
| ------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Keep                     | Signed in, 5 local cards; choose keep          | Signed out, sync timestamp cleared, back on `/`, 5 cards listed                                      | N/A                                            |
| Erase                    | Signed in, 5 local cards; choose erase         | Signed out, sync timestamp cleared, all local cards deleted, `/` shows empty state, watch list empty | N/A                                            |
| Erase, sign-out fails    | `signOut()` returns `success: false` or throws | Nothing deleted; sheet stays open                                                                    | Existing `signOutError` banner                 |
| Erase, delete fails      | Sign-out succeeds, `deleteAllCards` throws     | Signed out, sheet closes, `/`; cards still present                                                   | Logged; error toast says cards were not erased |
| Erase, no cards          | Signed in, 0 local cards; choose erase         | Same as Keep; no error                                                                               | N/A                                            |
| Erase, then sign back in | Erased locally, cards exist in cloud           | Next sync downloads every cloud card; none deleted from cloud                                        | N/A                                            |
| Busy                     | A sign-out (either choice) is in flight        | Both choices ignore presses; the pressed one shows its spinner                                       | N/A                                            |

</frozen-after-approval>

## Code Map

- `features/settings/components/SignOutSheet.tsx` -- the sheet (frame D, `docs/design/cardi/frames/cardi-settings-frames.html:1481-1495`); `onConfirm: () => void` becomes a choice-carrying confirm (e.g. `onConfirm(eraseCards: boolean)`); `isLoading` must say which action is busy. Tests: `SignOutSheet.test.tsx`.
- `features/settings/screens/SettingsScreen.tsx` -- `confirmSignOut` (173-198): `signOut()` → `clearLastSyncAt()` → close → `router.replace('/')`. Add the erase after `clearLastSyncAt` and before navigation; reuse `showToast` and `logger` already imported here. Tests: `SettingsScreen.test.tsx` (mocks at 23-45; add a `deleteAllCards` mock).
- `core/database/card-repository.ts:207` -- `deleteAllCards(db?)`: one transaction, then `pushSnapshotToWearable`. Import via `@/core/database`. Reuse as-is.
- `features/cards/components/CardList.tsx:111` -- `useFocusEffect` refetches on focus, so `/` shows the empty state after `router.replace('/')`; no change.
- `core/sync/cloud-sync.ts:483-530` -- a card missing locally is only deleted from cloud when it is in the pending-deletion queue, so an erase without queue entries leaves the cloud intact. No change.
- `shared/i18n/locales/en.ts:214`, `it.ts:215` -- `settings.signOutSheet.{title, body}`; the body "Your cards will remain on this device." is now wrong. Add copy for the two choices and the erase-failed toast.
- Do not change: `shared/supabase/auth.ts` `signOut`, Delete Account (`deleteAccountSheet`, `confirmDeleteAccount`), `BottomSheet`, `Button`.

## Tasks & Acceptance

**Execution:**

- [x] `shared/i18n/locales/en.ts`, `it.ts` -- new body (says what each choice does and warns that unsynced cards are lost on erase), choice labels, erase-failed toast -- copy must stop promising the cards remain.
- [x] `features/settings/components/SignOutSheet.tsx` (+ test) -- three stacked buttons per the frozen decision (keep, erase, Cancel); report the choice to `onConfirm`; only the busy action shows a spinner, and both choices are disabled while busy.
- [x] `features/settings/screens/SettingsScreen.tsx` (+ test) -- `confirmSignOut(eraseCards)`: erase only after a successful sign-out; on delete failure log, toast, and still navigate. Cover every matrix row except the sign-back-in row.
- [x] `core/sync/cloud-sync.test.ts` -- a test that an empty local database with an empty deletion queue deletes nothing from cloud and downloads every cloud card (the sign-back-in row).

**Acceptance Criteria:**

- Given a signed-in person on Settings, when they tap Sign Out, then the sheet shows both choices and says what each does to the cards on this device.
- Given the Italian locale, when the sheet opens or the erase-failed toast shows, then all copy is Italian.
- Given a paired watch, when erase succeeds, then the watch receives the empty card list.

## Design Notes

Erase-failure after a successful sign-out is not a sheet error: the account is already signed out, so the sheet cannot offer a retry that means anything. The person lands on `/` with their cards and a toast; they can delete cards individually or sign in and out again.

## Implementation Notes

- `SignOutSheet` takes `busyAction: 'keep' | 'erase' | null` in place of `isLoading`, and `onConfirm(eraseCards: boolean)`. Test IDs: `signout-keep`, `signout-erase` (the old `signout-confirm` is gone; existing `SettingsScreen` tests now press `signout-keep`, which behaves as the old Sign Out did). The busy choice gets `loading` (spinner, ignores presses, announced busy); the other gets `disabled`. Cancel and the sheet's own close are locked while busy (see the review fixes below).
- `confirmSignOut(eraseCards)`: `signOut()` → `clearLastSyncAt()` (its failure logged, as before) → `deleteAllCards()` when erasing (its failure logged, then an error toast `settings.signOutSheet.eraseFailed`) → close the sheet → `router.replace('/')`. A failed sign-out returns before any of this.
- New copy: `settings.signOutSheet.{body, keepCards, eraseCards, eraseFailed}` in `en` and `it`.
- Review fixes: while a sign-out is in flight, Cancel is disabled and the sheet's own close is a no-op. The erase-failed toast fires after `router.replace('/')` and is not awaited; a rejection is caught and logged. `clearLastSyncAt` now also removes the download cooldown key (`lastCloudSync`), so the first unforced sync after signing back in is not throttled and an erased list refills.

- **"Erase, no cards" matrix row** is covered by the erase-success test in `SettingsScreen.test.tsx` (an erase that resolves normally ends exactly as Keep does) plus the empty-database `deleteAllCards` test in `card-repository.test.ts`.

- **Device check (2026-11-25), iPhone 17 Pro simulator, iOS 26.4, Debug build with Metro from this branch, signed in as the App Review account by ifero.** The sheet shows the three stacked choices and the new body in Italian dark, Italian light and English light; Cancel closes it; "Sign out, keep cards" returns to `/` in guest mode with every card still listed. Screenshots are in the session scratchpad `16-45-shots/` (outside the repo). The theme and language were restored afterwards.
- **Unchecked on a device:** the erase path, at ifero's instruction not to erase on the App Review account (covered by `SettingsScreen.test.tsx`); the sign-back-in restore, which needs the erase; the paired-watch push (covered by `card-repository.test.ts`); English dark (the same sheet in Italian dark was checked); Android (no Debug build of this branch installed on an emulator).

- **Review loops, round 1.** Code review: approved, no comments. QA: two findings, both fixed. (1) Nothing pinned the Italian erase-failed toast: added a case to `shared/i18n/italian-rendering.test.tsx`, which fails when the Italian value falls back to English. (2) The "Erase, no cards" row had no named evidence: the empty-database `deleteAllCards` test is renamed for it, and the bullet above records its coverage. Test-only changes, so the device check stands; both loops run again.

- **Review loops, round 2.** Code review: approved, no comments. QA: approved with a trailing note (the test files it ran and their counts) and no finding; the loop rule counts that as not approved, so QA runs again on the unchanged diff.

- **Review loops, round 3.** QA: approved, no comments. Both loops closed (code review approved in rounds 1 and 2 with no change since).

- **Final verification (2026-11-25), on the final tree:** `yarn typecheck`, `yarn lint`, `yarn format:check` clean; `yarn test` 234 suites, 4876 tests passed. Typecheck was run after setting aside the Metro-generated files above (see Found, not fixed).

### Found, not fixed

- **A sync whose download is still in flight can bring erased cards back.** `performSync` (`shared/hooks/useCloudSync.ts`) calls `batchUpsertCards` after its cloud fetch, and nothing cancels or awaits it on sign-out, so a fetch that outlasts opening Settings, the sheet and the erase tap re-inserts the merged cards. Rare (it needs a slow network); the fix is a sync-cancellation or generation guard. Filed as #310.
- **Per-account sync state survives sign-out.** The pending-deletion queue is kept on every sign-out, so a different account signing in next drains the previous account's queued deletions. Pre-existing; the deletion tracker is out of this story's scope. Filed as #311.
- **`yarn typecheck` fails locally after `expo start`.** Metro writes the gitignored `expo-env.d.ts` and `.expo/types`; the `expo/types` reference narrows `process.env.NODE_ENV`, so `test/site-allow-list.test.ts:103` (`{ NODE_ENV: string }`) no longer type-checks. Pre-existing and local only (CI never has the files); the test's env literal needs a cast or `as const`. Filed as #312.
- **The design files still show the two-button sheet.** Frame D in `docs/design/cardi/frames/cardi-settings-frames.html` and `docs/design/cardi/stitch-prompts-settings.txt` need the keep / erase / Cancel layout. Filed as #313.

## Spec Change Log

## Review Triage Log

Pass 1 (blind, edge-case, verification-gap, project-conventions; conventions reported none):

| #   | Layer                  | Finding                                                                                                                                                           | Verdict | Route / evidence                                                                                                                                                                                                                                       |
| --- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | edge, verif-gap, blind | Sign back in within 5 min of the last cloud sync: the auto-sync download is throttled by `lastCloudSync`, so the erased list stays empty                          | medium  | patch: `downloadCloudCards` returns `throttled` when `lastCloudSync` < 5 min old (`cloud-sync.ts:568-578`); `useCloudSync` auto-sync never forces; `clearLastSyncAt` clears only `cloudSyncLastSyncAt`. Clear `lastCloudSync` in `clearLastSyncAt` too |
| 2   | verif-gap, blind       | The sign-back-in test passes `forceSync: true`, so it skips the throttle the real sign-in path meets                                                              | medium  | patch, with 1: prove the restore on the non-forced path after `clearLastSyncAt`                                                                                                                                                                        |
| 3   | edge                   | Cancel (or a swipe-down) while an erase is in flight closes the sheet as if cancelled, yet sign-out and erase still complete                                      | low     | patch: the sheet ignores close while a sign-out is busy; a direct guard                                                                                                                                                                                |
| 4   | blind                  | `await showToast` runs before `router.replace('/')`; a rejecting toast lands in the outer catch, shows "Unable to sign out" on a closed sheet and never navigates | low     | patch: navigate first, then fire the toast without awaiting it                                                                                                                                                                                         |
| 5   | verif-gap              | Nothing pins `deleteAllCards` pushing the empty list to the watch                                                                                                 | medium  | patch: `card-repository.test.ts` asserts `pushCardsToWearable` gets `[]` after `deleteAllCards`                                                                                                                                                        |
| 6   | blind, edge            | A sync already downloading when erase runs can `batchUpsertCards` after the DELETE and bring cards back                                                           | low     | rejected: real, but needs a sync whose cloud fetch is still in flight across opening Settings, the sheet and the tap; the fix is a new sync-cancellation guard. Recorded under Found, not fixed                                                        |
| 7   | blind, edge            | The watch push is best-effort, so an unreachable watch may keep the cards while the copy promises erasure                                                         | low     | rejected: the push uses the platform's queued delivery (application context / data layer), which lands when the watch reconnects; a failure surface would be new UI                                                                                    |
| 8   | blind                  | No check for unsynced cards before an irreversible erase                                                                                                          | false   | the frozen decision (erase does not sync first; the body warns) chose this                                                                                                                                                                             |
| 9   | blind                  | The pending-deletion queue and other per-account state survive the erase                                                                                          | low     | defer: pre-existing on every sign-out, and the frozen Never list keeps the deletion tracker out of scope                                                                                                                                               |
| 10  | blind                  | A failed erase leaves no retry path                                                                                                                               | low     | rejected: Design Notes decided it; a DELETE on the local table failing is rare                                                                                                                                                                         |
| 11  | blind                  | Keep and Cancel are both outlined `secondary` buttons and look the same                                                                                           | low     | to the human: the frozen decision names keep "secondary" and Cancel "outlined", which is the same variant                                                                                                                                              |
| 12  | blind                  | EN labels are not parallel ("Sign out, keep cards" / "Sign out and erase cards")                                                                                  | false   | both labels are the frozen decision's wording                                                                                                                                                                                                          |
| 13  | blind                  | Frame D and the Stitch settings prompt still show the two-button sheet; story 22-7 names `signout-confirm`                                                        | low     | defer the design files (Found, not fixed); 22-7 is a historical record of a merged story, not a live reference                                                                                                                                         |
| 14  | blind                  | The reviewed diff omits sprint-status.yaml and the spec                                                                                                           | false   | the DIFF FOR REVIEW fact excludes both by design                                                                                                                                                                                                       |

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors
- `yarn lint` -- expected: no errors
- `yarn format:check` -- expected: clean
- `yarn test` -- expected: all suites pass

**Manual checks (if no CLI):**

- On an iOS simulator and an Android emulator, light and dark: signed in with cards, Sign Out → keep leaves the list; Sign Out → erase shows the empty state; signing back in restores the cards.

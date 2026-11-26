---
baseline_commit: '4bbfcbd1cd08640a3a80b08f6614744ee6cb8aac'
title: 'A sync in flight can bring erased cards back, and the pending-deletion queue survives sign-out'
type: 'bugfix'
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

**Problem:** Sign-out leaves two pieces of per-account sync state on the device, and both of them act on the _next_ account that signs in.

1. **An in-flight sync can resurrect erased cards.** `performSync` (`shared/hooks/useCloudSync.ts:148-208`) awaits its cloud fetch and then writes the merged result with `await batchUpsertCards(downloadResult.mergeResult.merged)` (`:194`). Nothing cancels that write or checks that the session is still the one the sync started under. If the fetch outlasts opening Settings, the sign-out sheet and the "Sign out and erase cards" tap, the merged cards are re-inserted into a database that was just emptied -- so the person signs out, sees the empty state, and the cards come back.
2. **The pending-deletion queue survives sign-out.** `core/sync/deletion-tracker.ts:3` keys the queue on a single, account-agnostic AsyncStorage key (`syncPendingDeletions`). `clearPendingDeletions` has no production caller: it is defined at `:40`, exported at `core/sync/index.ts:39`, and called only from its own test. So a card deleted under account A stays queued, and account B signing in next drains A's queue against B's cloud data -- deleting cards B owns that happen to share a card id with A's queue.

**Approach:** One mechanism, two applications.

- A **sync generation guard** in the module-level sync store. The store already owns the sync lifecycle (`isRunning`, `autoTriggered`, `latestIsAuthenticated`); it gains a monotonically increasing generation counter that is bumped whenever the authenticated identity changes or a sync is explicitly invalidated. `performSync` captures the generation it started under and refuses to write if the generation moved on -- and the sign-out path invalidates the current sync before it deletes anything.
- **The pending-deletion queue is keyed by account** and cleared on sign-out, so nothing from a previous account can act against a new one.

**Decisions (pending ifero's approval):**

- **The guard is a generation counter, not an abort signal.** The download is a Supabase REST call that the client does not abort (`shared/supabase/client.ts:197-204` sets no timeout and no signal), so cancelling the request would mean changing the client for every caller. Refusing to _write_ after the fact is the smaller, safer change: the fetch still completes, it just cannot mutate the local database under a stale session.
- **The sign-out path invalidates the sync before `deleteAllCards`**, so the erase is the last writer, not a race between two writers.
- **The deletion queue is keyed by user id**, and a queue belonging to another account is ignored rather than drained. Clearing it wholesale on sign-out is the simpler alternative; keying it is what prevents a _concurrent_ sign-in from replaying it.

## Boundaries & Constraints

**Always:** The generation guard lives in the module-level sync store, next to `isRunning` -- the store already outlives any single component, so it is the only place that can hold a guard the whole app sees. A sync that finishes under a stale generation writes nothing to the local database and reports nothing as an error (it was not an error; the session changed). The deletion queue's key includes the account id; the existing `removePendingDeletions` semantics -- "remove only the ids that were actually drained" -- are preserved. Existing tests that pin the current single-key queue are updated, not deleted. The sign-out flow from Story 16.45 is unchanged: keep, erase, and the failed-sign-out path keep their behaviour.

**Never:** Change the cloud-sync merge semantics (`core/sync/cloud-sync.ts`), the throttle window, or the delta-sync logic. Change what "erase cards" deletes -- it stays local rows only, with no cloud request and no pending-deletion entries. Change the 16.45 copy. Add a dependency. Change `deleteAllCards` or the watch push. Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario                                 | Input / State                                                              | Expected Output / Behavior                                                       | Error Handling                                                      |
| ---------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Sync in flight, keep                     | Signed in, a cloud fetch in flight, the person signs out keeping the cards | The sync may complete its fetch but writes nothing; the cards stay on the device | No error surfaced; the write is skipped silently                    |
| Sync in flight, erase                    | Signed in, a cloud fetch in flight, the person signs out erasing the cards | The sync writes nothing after the erase; the list stays empty                    | No error surfaced                                                   |
| Sync in flight, another account signs in | Account A's fetch in flight; account B signs in and syncs                  | A's sync writes nothing; B's sync is unaffected                                  | No error surfaced                                                   |
| Sync in flight, no sign-out              | A normal sync completes                                                    | The merge is written as today                                                    | Unchanged                                                           |
| Deletion queue, other account            | Account A deleted a card (queued); account B signs in                      | B's sync ignores A's queued ids; B's own cloud data is untouched                 | No error surfaced                                                   |
| Deletion queue, same account             | Account A deleted a card; A signs out and back in                          | A's queue is still A's and drains as today                                       | Unchanged                                                           |
| Deletion queue, empty                    | No deletions queued                                                        | Nothing changes                                                                  | N/A                                                                 |
| Erase, sync not in flight                | Signed in, no sync running; the person signs out erasing                   | The cards are gone and stay gone                                                 | The existing 16.45 erase-failed toast still covers a failing delete |

</frozen-after-approval>

## Code Map

- `shared/hooks/useCloudSync.ts` -- the module-level store (`:60-100`: `snapshot`, `listeners`, `latestIsAuthenticated`, `autoTriggered`, `isRunning`) and `performSync` (`:148-208`). The write to guard is `:194` (`await batchUpsertCards(downloadResult.mergeResult.merged)`); the download it follows is `:172-179`. The store's auth mirror is pushed in from the hook -- that is where the generation advances on an identity change. Tests: `shared/hooks/useCloudSync.test.ts`.
- `features/settings/screens/SettingsScreen.tsx` -- `confirmSignOut` (`:177-215`): `signOut()` (`:182`) -> `clearLastSyncAt()` (`:190`) -> `deleteAllCards()` (`:198`). The invalidation call belongs between the successful sign-out and the delete. Tests: `features/settings/screens/SettingsScreen.test.tsx`.
- `core/sync/deletion-tracker.ts` -- `PENDING_DELETIONS_KEY` (`:3`), `addPendingDeletion` (`:9`), `getPendingDeletions` (`:20`), `clearPendingDeletions` (`:40`), `removePendingDeletions` (`:52`), `_PENDING_DELETIONS_KEY` (`:75`, the test-only export). The key gains the account id. Tests: `core/sync/deletion-tracker.test.ts`.
- `core/sync/sync-trigger.ts` -- the drain path: `getPendingDeletions` / `removePendingDeletionsFn` are injected at `:77-78`, read at `:114`, drained at `:150`. It is the caller that must scope the queue to the signed-in account.
- `core/sync/cloud-sync.ts` -- `getPendingDeletions` is taken from `options.deletions` at `:614`, and the same `deletionSyncDeps` object is built in `shared/hooks/useCloudSync.ts:138-142`.
- `shared/hooks/useAutoSync.ts` -- `:7` imports `getPendingDeletions, removePendingDeletions` from `@/core/sync`; it is the second consumer of the queue and must scope it the same way.
- `core/sync/index.ts` -- the barrel (`:37-40`) that re-exports the tracker's four functions; its signature change is a public surface for `shared/` and `features/`.
- `core/auth/guest-migration.ts` -- `MIGRATION_FLAG_KEY` (`:23`) and `setMigrationFlag(userId)` (`:88`) are the precedent for storing a user id alongside a flag, and `getSecureStore()` is the store the tracker could use instead of AsyncStorage.
- Do not change: `core/database/card-repository.ts` (`deleteAllCards`), `core/sync/cloud-sync.ts`'s merge, `features/settings/components/SignOutSheet.tsx`, the 16.45 copy.

## Tasks & Acceptance

**Execution:**

- [ ] `shared/hooks/useCloudSync.ts` -- add a generation counter to the module-level store; advance it when the authenticated identity changes and expose an explicit invalidation entry point for the sign-out path. `performSync` captures the generation it starts under and skips the `batchUpsertCards` write (and the upload that follows it) when the generation moved on.
- [ ] `shared/hooks/useCloudSync.ts` (+ test) -- a test that starts a sync, changes the identity mid-flight, and asserts nothing is written locally; and a test that a same-generation sync still writes.
- [ ] `features/settings/screens/SettingsScreen.tsx` (+ test) -- invalidate the in-flight sync after a successful sign-out and before `deleteAllCards`; cover the keep and erase rows of the matrix.
- [ ] `core/sync/deletion-tracker.ts` -- key the queue by account id; `getPendingDeletions` returns only the signed-in account's ids; `addPendingDeletion` records the account; `removePendingDeletions` drains only the ids it was given, as today.
- [ ] `core/sync/deletion-tracker.test.ts` -- the matrix rows: another account's queue is ignored, the same account's queue drains, an empty queue is a no-op.
- [ ] `core/sync/sync-trigger.ts`, `shared/hooks/useAutoSync.ts` (+ tests) -- pass the signed-in account to the queue; a drain under account B must not delete account A's queued ids.

**Acceptance Criteria:**

- Given a signed-in person with a cloud sync in flight, when they sign out and choose "erase cards", then the local card list is empty and stays empty -- no in-flight sync re-inserts the cards afterwards.
- Given the same situation, when they sign out and choose "keep cards", then the cards stay on the device and the in-flight sync does not add or remove any.
- Given account A deleted a card while signed in, when account B signs in on the same device, then B's sync does not delete any card from B's cloud data on A's behalf.
- Given account A deleted a card while signed in, when A signs out and back in, then the deletion still reaches the cloud as it does today.
- Given a sync that completes under a stale session, when it finishes, then it writes nothing locally and surfaces no error to the person.

## Design Notes

The two defects share one root: sync state that belongs to an account lives in a module or a storage key that does not name one. The generation counter fixes the _write_ half, the account-scoped key fixes the _queue_ half, and both are deliberately small.

A generation counter rather than an abort: the Supabase client is shared by every caller (`shared/supabase/client.ts`), and adding a timeout or a signal to it to solve a sign-out race would change behaviour everywhere. Refusing the write is local to the sync store.

The counter advances on an identity change, not only on sign-out. A person who switches accounts without signing out (an expired session, a refreshed token for a different user) gets the same protection.

The queue is keyed rather than cleared because clearing is a data-loss risk in the other direction: a person who signs out and back in to the same account would lose the deletions that had not yet drained. Keying preserves them for their own account and hides them from any other.

## Implementation Notes

- Source issues: #310 (in-flight sync) and #311 (pending deletions). Both were filed from
  `docs/sprint-artifacts/stories/16-45-signout-keep-or-erase-cards.md` section "Found, not fixed" and are
  deliberately one story: the guard and the key are one change to "sync state belongs to an account".
- The 16.45 review log already routed this: row 6 ("A sync already downloading when erase runs can
  `batchUpsertCards` after the DELETE and bring cards back") was **rejected** with the note _"the fix is
  a new sync-cancellation guard"_; row 9 ("The pending-deletion queue and other per-account state survive
  the erase") was **deferred** as _"pre-existing on every sign-out, and the frozen Never list keeps the
  deletion tracker out of scope"_. This story is that guard.
- `deleteAllCards` pushes the empty list to the watch (`core/database/card-repository.ts:207`); the
  generation guard must not interfere with that push.
- `clearLastSyncAt()` (`core/sync/sync-timestamp`) clears the throttle timestamp. The 16.45 review
  patched it to clear `lastCloudSync` too (triage row 1), so a sign-back-in download is not throttled --
  check the current implementation before assuming which timestamp it clears.
- `core/sync/deletion-tracker.ts` currently uses `@react-native-async-storage/async-storage`. AGENTS.md
  prescribes `expo-sqlite/kv-store` for key-value persistence, but the tracker's key is already
  established in AsyncStorage. Keeping AsyncStorage here is the smaller change; the AGENTS.md deviation is
  a separate chore (#258 item 6).

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors
- `yarn lint` -- expected: no errors
- `yarn format:check` -- expected: clean
- `yarn test` -- expected: all suites pass

**Manual checks (if no CLI):**

- On an iOS simulator with a throttled network (so the cloud fetch is slow): sign out while a sync is
  in flight, choose "erase cards", and confirm the list stays empty after the fetch completes.
- Sign out, keep the cards, and confirm the in-flight sync changes nothing.
- Delete a card under one account, sign out, sign in with another account, and confirm nothing is
  deleted from the second account's cloud data.

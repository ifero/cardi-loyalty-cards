---
baseline_commit: '4bbfcbd1cd08640a3a80b08f6614744ee6cb8aac'
title: 'The wallet follow-ups: two subscriptions for one list, an offline strip that can never show, hard-coded English, a 28pt retry target and an add-card that stacks a second Home'
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

**Problem:** Story 22.2 (the wallet redesign) left thirteen items behind. Eight are still open, and they are the same class of defect the other Epic 22 stories left: state read twice, a control wired to a constant, user-visible English that never goes through i18n, a touch target below the 48pt the design system now sets, and an error state with no way out. Two of them are visible to a person on an ordinary day: the migration banner's Retry and dismiss are ~28pt and ~16pt targets, and the load-error state prints a raw error string with no pull-to-refresh.

**Approach:** One pass over the items that need no decision. The two that do -- the raw error string and the ring that plays off-screen -- are called out with a recommendation.

**Decisions (pending ifero's approval):**

- **The two `useCards()` subscriptions collapse into one.** Home's copy loads once, so the guest banner's "more than four cards" threshold can lag behind the list; a single source removes the class of bug.
- **The migration banner's controls reach the 48pt minimum** the design system adjudicated (Story 16.33), by padding the pressable, not by growing the banner.
- **The load-error state offers a retry** instead of printing the raw error string, and the raw string goes to the log.

## Boundaries & Constraints

**Always:** The wallet's visual design is unchanged -- this story fixes behaviour, wiring and text, not layout. The sort preference and the guest-banner dismissal keep their current storage for now: moving them to `expo-sqlite/kv-store` is a separate chore with its own migration concern. Every user-visible string moves to `en.ts` and `it.ts` together. The test fixtures' palettes move to the real tokens, so the dark-mode assertions become real assertions.

**Never:** Change the wallet's frames, its grid, its empty state or its single-card state. Change the sort options or their order. Change the guest banner's threshold. Add a dependency. Touch the watch. Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| -------- | ------------- | ------------------------- | -------------- |
| Home and the list | The wallet mounts | One `useCards()` subscription feeds both; the guest banner's threshold matches the list | N/A |
| Offline with pending changes | The device is offline and changes are queued | The offline strip shows on Home | N/A |
| Migration banner | The banner is visible | Its Retry and dismiss are at least 48pt tall and wide | N/A |
| Load error | The cards fail to load | The state offers a retry; the raw message is logged, not printed | The failure is logged |
| Add a card | The person adds a card | One Home is on the stack; going back from the new wallet does not land on an older one | N/A |
| Just-added ring | The new card sorts below the viewport | The ring is not missed: either the card scrolls into view or the ring starts when the tile is visible | N/A |
| Sort preference | The person changes the sort | The preference persists as today | N/A |

</frozen-after-approval>

## Code Map

- `features/cards/screens/HomeScreen.tsx:27` -- `const { cards } = useCards();`; `features/cards/components/CardList.tsx:90` -- `const { cards, isLoading, error, refetch } = useCards();`. Two subscriptions for one list.
- `features/cards/screens/HomeScreen.tsx:107` -- `pendingChangeCount={0}` on the `SyncStatusContainer`; `shared/components/SyncStatusContainer.tsx:37` -- `if (isOffline && pendingChangeCount > 0) return 'offline';` -- so the offline strip can never show on Home.
- `features/auth/MigrationBanner.tsx:129-134` -- `retryButton: { marginLeft: 16, borderRadius: 6, paddingHorizontal: 24, paddingVertical: 8 }` (about 28pt tall); `:140-143` -- `dismissButton: { marginLeft: 16, paddingHorizontal: 8 }` with no vertical padding. The token is `TOUCH_TARGET.min = 48` (`shared/theme/tokens.generated.ts:83`).
- `features/cards/components/CardList.tsx:184-190` -- the `error` branch: `<Text>{error}</Text>` in a plain `View`, with no `refreshControl` (the empty, single and list branches carry one).
- `shared/hooks/useCloudSync.ts:29` -- `const GENERIC_SYNC_ERROR = 'Cloud sync failed. Pull to retry.';`; `shared/hooks/useAutoSync.ts:17` and `:76`; `features/cards/hooks/useCards.ts:55` -- `setError(err instanceof Error ? err.message : 'Failed to load cards');`.
- `features/cards/hooks/useCardSort.ts:5,9,84,97` -- the sort preference in AsyncStorage (`STORAGE_KEY`); `features/auth/components/GuestModeBanner.tsx:2,34,55` -- the banner's dismissal flag in AsyncStorage. AGENTS.md prescribes `expo-sqlite/kv-store`, which the repo already uses for the first-launch flag (`features/settings/settings-repository.ts`) and the consent state (`core/privacy/consent-repository.ts`).
- `features/cards/hooks/useAddCard.ts:93-96` -- `router.replace({ pathname: '/', params: { newCardId: card.id, newCardName: card.name } });` -- `replace` on the root pushes a second Home onto the stack.
- `features/cards/hooks/useCardSort.ts:39-51` -- `sortByFrequent`; a new card has no usage, so it sorts after every used card.
- `features/cards/components/CardList.tsx:238-250` -- the `FlashList`, with no `onViewableItemsChanged` and no `viewabilityConfig`; `:207` -- `highlighted={cards[0]!.id === highlightCardId}`.
- `features/cards/components/CardTile.tsx:136,138,162-163,195-196` -- the `highlighted` and `onHighlightEnd` props and how the tile is told.
- `features/cards/hooks/useCards.ts:35` -- `export function useCards(): UseCardsResult {` -- a `function` declaration, against AGENTS.md's arrow-function rule.
- `shared/i18n/locales/it.ts:315` -- `message_one: 'Offline • {{count}} modifica verra sincronizzata quando torni online'` -- "verra" without its accent.
- `features/cards/components/CardList.test.tsx:121` -- `primary: '#1A73E8',`; `:796-797` -- `tintColor: '#1A73E8', colors: ['#1A73E8'],`; `features/auth/components/GuestModeBanner.test.tsx:18,24,119` -- the same pre-rebrand blue.
- `app/_layout.tsx:124-134` -- the root `screenOptions` `headerLeft`, a raw `Pressable` under `app/`; `features/cards/components/HomeHeaderButtons.tsx` -- the `HeaderIconButton` that could serve it.
- `jest.setup.js:334-360` -- the Reanimated mock, already corrected: `useSharedValue` keeps one shared value for the component's life.
- `shared/components/SyncErrorBanner.test.tsx:19`, `shared/components/SyncStatusContainer.test.tsx:34` -- the retired `TOUCH_TARGET` mock (handled in `16-50`).
- Do not change: the wallet's frames, `features/cards/components/CardTile.tsx`'s visual design, the sort options.

## Tasks & Acceptance

**Execution:**

- [ ] `features/cards/screens/HomeScreen.tsx`, `features/cards/components/CardList.tsx` -- one `useCards()` feeds both; the guest banner's card-count threshold reads the same source as the list.
- [ ] `features/cards/screens/HomeScreen.tsx` -- `pendingChangeCount` is the real count of queued changes, so the offline strip can show.
- [ ] `features/auth/MigrationBanner.tsx` -- the Retry and the dismiss reach 48pt in both directions, by padding the pressable rather than growing the banner.
- [ ] `features/cards/components/CardList.tsx` -- the load-error state offers a retry (the existing `refetch`) and does not print the raw error string; the string goes to the logger.
- [ ] `shared/hooks/useCloudSync.ts`, `shared/hooks/useAutoSync.ts`, `features/cards/hooks/useCards.ts`, `features/auth/useGuestMigration.ts` -- the hard-coded English moves into `shared/i18n/locales/en.ts` and `it.ts`.
- [ ] `features/cards/hooks/useAddCard.ts` -- adding a card leaves exactly one Home on the stack; going back from the new wallet does not land on an older one.
- [ ] The just-added ring -- either the list scrolls the new card into view, or the ring starts when the tile becomes visible (FlashList's viewability). One of the two, decided and recorded.
- [ ] `features/cards/hooks/useCards.ts:35` -- `export const useCards = (): UseCardsResult => {` (the arrow-function rule).
- [ ] `shared/i18n/locales/it.ts:315` -- "verrà".
- [ ] `features/cards/components/CardList.test.tsx`, `features/auth/components/GuestModeBanner.test.tsx` -- the palette mocks use the real tokens, so the dark-mode assertions assert real colours.
- [ ] `app/_layout.tsx:124-134` -- the shared back button moves onto the shared `HeaderIconButton` (moved to `shared/components/ui/`), so the root header stops using a bare `Pressable` under `app/`.
- [ ] `yarn lint`, `yarn typecheck`, `yarn test` -- green.

**Acceptance Criteria:**

- Given the wallet, when it mounts, then exactly one card subscription is active, and the guest banner's "more than four cards" threshold matches the number of cards the list shows.
- Given the device is offline with queued changes, when the wallet is open, then the offline strip is visible.
- Given the migration banner, when it is visible, then its Retry and its dismiss are at least 48pt in both directions.
- Given the cards fail to load, when the error state renders, then it offers a retry and does not print the raw error message.
- Given a sync failure or a guest-migration message, when it is shown, then the text comes from the locale file and is Italian in the Italian locale.
- Given the person adds a card, when they then go back from the new wallet, then they do not land on a second Home.
- Given a new card that sorts below the viewport, when the ring is due, then it is not missed.
- Given the wallet's tests, when they run, then they assert the real theme colours rather than a pre-rebrand blue.

## Design Notes

Most of these are the same defect the other Epic 22 stories left: a value that was wired to a constant at design time and never wired to the real thing. `pendingChangeCount={0}` is the clearest example -- the prop exists, the consumer reads it, and nothing ever passes a count.

The two `useCards()` subscriptions are the one with a runtime cost as well as a correctness cost: the wallet subscribes twice to the same store, and the guest banner reads a copy that can lag.

The ring that plays off-screen is a design decision rather than a defect: scrolling the new card into view changes what the person sees after adding a card, while starting the ring on visibility preserves the "just added" moment but may not fire at all. The recommendation is the second -- the ring is a moment, not a navigation -- but it needs a ruling.

## Implementation Notes

- Source issue: #258 (items 1, 2, 4, 5, 6, 8, 10, 11, 12, 13).
- #258 items 3 (the same hard-coded English, also filed under #248) and 7 (the `useCards` arrow function and the "verra" accent) are in `16-49-triage-theme-followups.md`; this story keeps the wallet-specific parts.
- #258 item 9 is **closed**: `jest.setup.js:360` already keeps one shared value for the component's life.
- #258 item 12 is **closed** in `16-50-triage-design-system-followups.md` (the retired `TOUCH_TARGET` mocks).
- The AsyncStorage-to-kv-store move (#258 item 6) is explicitly **not** in this story: it changes where two
  persisted values live, which needs its own migration story (the values are per-install flags, and a
  reinstall already wipes them by design -- `app/_layout.tsx:97` records that for the first-launch flag).
- `features/cards/hooks/useCards.ts` is a `function` declaration because it predates the arrow-function rule
  in AGENTS.md; the conversion is mechanical and safe.
- The `refetch` the error state needs is already returned by `useCards()` (`features/cards/components/CardList.tsx:90`)
  and is currently unused by the error branch.
- `app/_layout.tsx`'s `headerLeft` is a `Pressable` under `app/`, where the Unistyles Babel plugin remaps
  `Pressable` -- the header flicker the house rules warn about. `HomeHeaderButtons.tsx` already has the
  `HeaderIconButton`; moving it to `shared/components/ui/` makes it usable from the root layout.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors
- `yarn lint` -- expected: no errors
- `yarn format:check` -- expected: clean
- `yarn test` -- expected: all suites pass

**Manual checks (if no CLI):**

- On a simulator: sign in as a guest with more than four cards and confirm the banner's threshold matches
  the list.
- On a simulator with the network off: confirm the offline strip appears on Home when changes are queued.
- On a simulator: add a card, then go back from the new wallet and confirm one Home is on the stack.

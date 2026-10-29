---
title: 'Story 23.3: Wear OS implementation — the list, the barcode and the sort picker on the watch grammar'
type: 'feature'
created: '2026-10-25'
status: 'in-review'
route: 'dispatch'
review_loop_iteration: 1
baseline_commit: 'd59cf49d00bd2f57f9102418c447a5a3f554d404'
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Wear OS app in the Cardì 1.0.0 build still paints the retired "Carbon Utility"
palette: `primary` `#4DA3FF` (the sort button and the picker's radios), surfaces `#1C1C1F`,
secondary text `#B0B3B8`, white text and hairlines, and an amber `#F59E0B` star that Cardì bans by
name. `CarbonTheme.kt` still cites the superseded spec. The picker shows its selection in one way
only. Rotary scrolling is inherited rather than wired. Someone who opened one card's barcode and
needs the card next to it has to go back to the list for it. The watch grammar
(`docs/design/cardi/cardi-watch-grammar.md`, Story 23.1, §8 amended 2026-10-27) settles each of
these, and Story 21.5's Wear store screenshots wait on this palette.

**Approach:** Put the Cardì roles into the Wear theme once and apply the grammar to
`CardListScreen`, `CardRow`, `SortPickerScreen` and `BarcodeScreen`, on round and square at 192 dp.
Rotary scrolls the list and the picker explicitly, and on the barcode it scrolls through the cards,
one card per detent, as decisions 4–6 rule it. Guard every change with source-text assertions in a
`test/` suite and the paging policy with JVM unit tests. Verify on round and square AVDs, then on
hardware.

## Boundaries & Constraints

**Always:**

- The values are the grammar's: ground `#000000`, rows and sheets ink `#181824`, text cream
  `#F0F0E8`, secondary text cream at 60 %, `primary` beam `#FCCC0C` with ink on it, the star beam,
  hairlines `#3A3A48`. They are defined once, in the theme file, and every site uses them or the
  scheme's roles.
- Card accents stay the five Cardì hexes in `CardVisuals.kt` (Story 21.2a); their keys are a wire
  contract and `core/wear-sync-contract.test.ts` reads them as text, so they do not move.
- Behaviour stays as shipped (sorting, sync, navigation, haptics, usage events, symbology, the
  barcode's geometry, full brightness and blanked clock), except what the grammar flags: the
  colours, the star, the picker's second encoding, explicit rotary and rotary paging on the
  barcode; and, for a card rotary pages to, its haptic and when its usage event is sent
  (decision 5).
- The barcode stays white edge to edge, true-black bars, `FilterQuality.None`, nothing overlaid (no
  page indicator), on every card it pages to; its title stays black inside the field (the cream
  carve-out is watchOS's strip, which Wear lacks).
- The open haptic, the usage event, full brightness and keep-awake follow the card on screen, never
  a page composed beside it.
- The paging policy (the held order, gone and new cards, the ends, the usage delay) is plain
  Kotlin with JVM unit tests, as watchOS's `WatchBarcodePaging` is.
- Square uses the round layout, its corners empty.
- Every old value is asserted absent and every new one present, in a suite under `test/` (it runs
  in `yarn test`; `wear-os-build.yml` is path-filtered); each new assertion is seen to fail under
  its mutation.

**Never:**

- Commit, push, or change `sprint-status.yaml` or any other tracker file: the orchestrator owns all
  three.
- Touch watchOS (Story 23.2), the Apple widget (Story 23.4) or the phone app.
- Give rotary any action but scrolling (on the barcode, scrolling through the cards): it never
  dismisses the barcode and never wraps past either end, and nothing but rotary, and TalkBack's
  actions standing in for it, changes the card shown (no tap, no swipe). Wire it once per screen.
- Add a custom typeface, a 0.98 scale, a shadow, a plate behind the star, a drawn dot in place of
  the radio, or a second design for square.
- Darken azure: that is the design system's open contrast item.

## I/O & Edge-Case Matrix

| Scenario         | Input / State                                       | Expected Output / Behavior                                                                                                                                                                                                  | Error Handling                                                  |
| ---------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| List             | Cards synced, round or square                       | Ink rows on black, 4 apart, 48 tall, radius 14; cream names; a beam star on favourites; "Cards" in cream                                                                                                                    | N/A                                                             |
| Sort control     | Second list item                                    | A beam button with ink label and glyph                                                                                                                                                                                      | N/A                                                             |
| Custom card      | Initials on an accent                               | 12 sp bold initials, ink or cream by the accent's luminance (0.4)                                                                                                                                                           | N/A                                                             |
| Near-black chip  | An accent below the near-black line                 | The 1 dp hairline in `#3A3A48`                                                                                                                                                                                              | N/A                                                             |
| Empty            | No cards                                            | Glyph cream 50 %, title cream, subtitle cream 60 %                                                                                                                                                                          | N/A                                                             |
| Sort picker      | Screen open                                         | Ink rows; the selected radio beam, its label semibold; others cream and regular                                                                                                                                             | N/A                                                             |
| Rotary on list   | Turn the crown or bezel                             | The list scrolls                                                                                                                                                                                                            | N/A                                                             |
| Rotary picker    | Turn                                                | The options scroll                                                                                                                                                                                                          | N/A                                                             |
| Rotary barcode   | One detent onward or back                           | The next or previous card's barcode, in the list's order at opening; its name the title; it slides in from the way the rotary turned (a crossfade when reduce motion is on); the rotary's own detent haptic, not the open's | N/A                                                             |
| Rotary at an end | First or last card, turned past                     | The card stays; no wrap (decision 6)                                                                                                                                                                                        | N/A                                                             |
| Rotary, one card | One reachable card                                  | Nothing; the barcode stays                                                                                                                                                                                                  | N/A                                                             |
| Order held       | The list re-sorts or syncs while a barcode is open  | Rotary keeps the order it opened with; a card gone since is skipped, a card added since is not reachable                                                                                                                    | Shown card gone: back to the list, as for a vanished card today |
| Usage on paging  | Rotary pages to a card                              | Its usage event once it has stayed 1 s; none if rotary moves on or the screen closes sooner; the opened card's at once, with the open haptic, as today (decision 5)                                                         | N/A                                                             |
| TalkBack         | The barcode's "Next card" or "Previous card" action | The next or previous card, as rotary; each offered only where that move exists                                                                                                                                              | N/A                                                             |
| Barcode          | Any card                                            | As today: white edge to edge, full brightness, the clock blanked, the title black                                                                                                                                           | Error states as today, per card; rotary pages on from them      |
| Swipe on barcode | Left to right; up or down                           | Left to right: back to the list, the only dismissal. Up or down: nothing                                                                                                                                                    | N/A                                                             |
| Tap on barcode   | A tap anywhere on it                                | Nothing; the barcode stays (decision 1)                                                                                                                                                                                     | N/A                                                             |

**Decisions (ifero, 2026-10-25):**

1. **A tap no longer leaves the barcode**, as on watchOS (Story 23.2, decision 1). Only the swipe
   (the system back) does. The tap-anywhere dismissal and its latch go, so a stray touch while the
   code is held to a scanner cannot close it. The grammar's Wear table is amended to match.
2. **No Wear OS device: the hardware pass is an accepted risk.** The epic's real-device check and
   rotary on hardware are not performed. Rotary is verified through the AVDs' emulated rotary input
   only, and the story records the accepted risk in its Implementation Notes, in the shape of
   DEC-E10-RETRO-001, rather than leaving the criterion silently unmet.
3. **Story 21.5 AC5 stays open.** This story ships the palette, clearing one of the Wear store
   screenshots' three blockers. The captures follow when the other two (a release
   `signingConfig`, and real cards from a phone signed with the same key) clear; this story does
   not take them.

**Decisions (ifero, 2026-10-28, building the grammar's 2026-10-27 ruling in this story):**

4. **Rotary scrolls through the cards on the barcode screen** (grammar §8). One card per detent, at
   low sensitivity, never continuous; the turn that scrolls the list onward shows the next card.
   The order is the list's at the moment the barcode opened, held for the visit. Only rotary moves
   it; taps and swipes still do nothing (decision 1 holds).
5. **A card rotary pages to counts as used after 1 s on screen.** The opened card counts at once,
   as today; skimming past cards sends nothing for them.
6. **Rotary stops at the first and the last card.** No wrap.

</frozen-after-approval>

## Code Map

Paths under `watch-android/app/src/main/kotlin/com/iferoporefi/myloyaltycards/wear/` (`wear/`).

- `wear/presentation/theme/CarbonTheme.kt` -- the scheme (`:37-45`): `background` black,
  `onBackground` white, `surfaceContainer` `CarbonSurface #1C1C1F` (`:16`), `onSurface` white,
  `onSurfaceVariant #B0B3B8` (`:42`), `primary` `BrandPrimaryDark #4DA3FF` (`:35`), `onPrimary`
  black; `FavoriteStarTint #F59E0B` (`:30`); both marked stale for this story (`:21`, `:33`). The
  KDoc (`:8-13`) cites "Carbon Utility" and an `EdgeButton` nothing uses. No `typography` or
  `shapes` passed. `MyLoyaltyCardsWearTheme` wraps the app.
- `wear/presentation/WearApp.kt` -- `AppScaffold` → `SwipeDismissableNavHost`; routes `cards`,
  `sort`, `barcode/{cardId}` (`:25-28`). `cards` (`:52`, the Room `StateFlow`) and `sortMode`
  (`:53`, DataStore) are collected here, but only `CardListScreen` sorts them
  (`remember(cards, sortMode) { sorter.sort(...) }`, `:66-67`) and a row hands back only its id
  (`:66`, `navigateOnce`, `:109-113`); the barcode route resolves its card by id (`:89`). No
  ViewModel, `SavedStateHandle` or `rememberSaveable` exists in the app. The barcode route needs
  the live cards and the sort mode, so it can capture the list's order once at opening and keep it
  in saveable state for the visit. Wear has no deep link into the barcode (the manifest's only
  intent filter is the launcher).
- `wear/presentation/CardListScreen.kt` -- `ScreenScaffold(scrollState = listState)` →
  `TransformingLazyColumn(spacedBy(4.dp))` (`:74-80`); `ListHeader "Cards"` (`:82`);
  `SortControlButton` (`:103-123`: M3 `Button`, 18 dp `ic_sort`, default colours); rows with
  `SurfaceTransformation(spec)` (`:90`); `EmptyState` (`:131-171`: 40 dp glyph `White @0.5`, title
  white, subtitle `White @0.6`). No rotary modifier anywhere.
- `wear/presentation/CardRow.kt` -- M3 `Card`, container `CarbonSurface` (`:68`), radius 14; the
  near-black border `White @0.15` (`:73`); padding 10 / 9, spacing 10; accent bar 5×28 radius 3;
  avatar 30 with initials `White`/`Black` (`:108`, threshold in `CardVisuals.kt:102`); name white
  15 SemiBold (`:117`); star `ic_star_filled` 14 dp `FavoriteStarTint` (`:125-132`).
  `CardRowMetrics.kt:14-24` holds the sizes (48 minimum).
- `wear/presentation/CardVisuals.kt` -- the palette (`:44-51`), `DEFAULT_CARD_ACCENT #0C84CC`
  (`:24`), luminance and near-black helpers. Unchanged.
- `wear/presentation/SortPickerScreen.kt` -- `ScreenScaffold` + `TransformingLazyColumn` →
  `ListHeader "Sort"`, one M3 `RadioButton` per mode (`selected`, `onSelect`, label up to 2 lines;
  default colours; the label never changes weight, `:54`).
- `wear/presentation/BarcodeScreen.kt` (as the first pass left it) --
  `BarcodeScreen(card: WearCard?, barcodeGenerator, usageRecorder, onDismiss, modifier)`
  (`:87-93`); a null card pops back (`:97-100`, the only `onDismiss` caller); the open haptic
  (`Confirm`) and `recordCardUsed` in `LaunchedEffect(card.id)` (`:105-108`), which would fire at
  once on every page if left as is; title `barcodeScreenTitle(...)` (`:115`); `ScreenScaffold(timeText
= {})` (`:119`) on a white `Box`; render state `rememberBarcodeRenderState` (`:140`, `:183-207`,
  encoded off the UI thread, `Loading` / `Rendered` / `Failed`); `KeepScreenAwakeAndBright` only
  when not `Failed` (`:142-148`, `:315-330`); two error states (`:273-307`). Per card: the haptic
  and usage, title, metrics, render state, content and the awake call. Per screen: the scaffold,
  the white ground and the vanished-card pop. Its KDoc says rotary does nothing (`:73-75`).
  `WearBarcodeGenerator.generate(...)` (`barcode/WearBarcodeGenerator.kt:65`) caches the last 8.
- Usage: `fun interface CardUsageRecorder { recordCardUsed(cardId, openedAt) }`
  (`usage/CardUsageRecorder.kt:16-27`), `UsageTimestamps.now()`.
- Rotary in wear-compose 1.6.2: `TransformingLazyColumn` takes a `rotaryScrollableBehavior`, which
  is why scrolling works today; making it explicit means passing it at the call site
  (`RotaryScrollableDefaults.behavior(state)`) or `Modifier.rotaryScrollable(...)` with a focus
  requester, not both. Confirm the parameter against the resolved 1.6.2 AAR before use.
- Paging in wear-compose 1.6.2 (resolved, unverified at runtime): `VerticalPager(state, …,
userScrollEnabled = true, …, rotaryScrollableBehavior = RotaryScrollableDefaults.snapBehavior(state),
content)` applies its rotary only while `userScrollEnabled` is true, so a pager with swipes off
  needs its own single `Modifier.rotaryScrollable(RotaryScrollableDefaults.snapBehavior(pagerState,
snapSensitivity = RotaryScrollableDefaults.LowSnapSensitivity), focusRequester)`; `PagerState`
  still scrolls programmatically. The snap behaviours carry the platform's rotary haptic and the
  low-resolution (bezel) path; a hand-written `RotaryScrollableBehavior` cannot reuse that haptic.
  The pager composes neighbouring pages (`beyondViewportPageCount`), so per-card effects must key
  on the settled current page. `LocalReduceMotion` (wear foundation) reads the system's
  reduce-motion setting. `VerticalPageIndicator` exists and is not used (nothing overlaid).
- watchOS reference (Story 23.2, `targets/watch/`; read, do not touch): `WatchBarcodePaging` in
  `WatchPresentationLayout.swift:36-79` (`reachableIds(heldOrder:liveIds:)`, `clampedDetent`,
  `id(atDetent:in:)`, `pages(currentId:reachable:)`, `usageDelay(for:)` with arrival `opened` /
  `paged`) and `BarcodePagerView.swift`. Paging needs two or more reachable cards including the
  current one; every rotary arrival counts after 1 s, a return to the opened card included.
- Tests: Kotlin unit tests under `watch-android/app/src/test/.../wear/` (JUnit 4,
  `kotlinx-coroutines-test`, Robolectric; none reference the theme, metrics or Compose;
  `CardPresentationTest` covers the contrast flip). No Compose UI or screenshot tests, and no
  Compose UI test dependency: do not add one. Source-text suites in `yarn test`:
  `core/wear-sync-contract.test.ts` (`:51`, `:270-311`, the palette), `test/wear-icons.test.ts`,
  and this story's `test/wear-cardi-palette.test.ts`, whose barcode cases (`wires nothing on the
barcode`, `binds rotary nowhere else`) assert the pre-amendment ruling and invert.
- Strings: `res/values/strings.xml` and `res/values-it/strings.xml` (the barcode's strings at
  `:34-40`).
- Previews: `wear/presentation/CardListPreviews.kt` (`@WearPreviewDevices`, round and square).
- Commands: from `watch-android/`, `./gradlew lintDebug testDebugUnitTest assembleDebug`
  (`wear-os-build.yml:155`); `./gradlew :app:compileDebugKotlin` for a fast check. AVD recipe:
  `watch-android/README.md:81-101` (round); a square AVD is made the same way from a square
  hardware profile.
- Design: grammar §1 (the KDoc), §2.1 (square), §3.1–§3.2, §4.1–§4.4, §5.1–§5.5, §6, §8, §8.1 and
  its testing section; `frames/cardi-watch-frames.html` (Wear, round and square). Its Wear line
  numbers and "shipped" palette predate Story 21.2a.
- Story 21.5 AC5: `docs/design/wear-store-screenshots/README.md` (the three blockers).

## Tasks & Acceptance

**Execution:**

- [x] `wear/presentation/theme/CarbonTheme.kt` -- the Cardì roles once (Design Notes); the scheme
      on them; `FavoriteStarTint` beam; the KDoc repointed to the grammar, `EdgeButton` dropped.
- [x] `wear/presentation/CardRow.kt` -- ink container, cream name, `#3A3A48` hairline, initials ink
      or cream, the star beam.
- [x] `wear/presentation/CardListScreen.kt` -- the empty state in cream; the sort button beam with
      ink; the list's rotary explicit.
- [x] `wear/presentation/SortPickerScreen.kt` -- ink rows, beam radios, the selected label
      semibold; rotary explicit.
- [x] `wear/presentation/BarcodeScreen.kt` -- remove the tap-anywhere dismissal and its latch
      (decision 1).
- [x] `wear/presentation/BarcodePaging.kt` -- new: the pure paging policy (Design Notes, Paging),
      with `BarcodePagingTest` under `watch-android/app/src/test/.../wear/presentation/`.
- [x] `wear/presentation/WearApp.kt` -- hand the barcode route the live cards and the sort mode.
- [x] `wear/presentation/BarcodeScreen.kt` -- page through the held order on rotary (decisions
      4–6); the per-card effects on the settled card; the slide, or the crossfade under reduce
      motion; the TalkBack actions; the KDoc.
- [x] `res/values/strings.xml`, `res/values-it/strings.xml` -- the two TalkBack action labels.
- [x] `test/wear-cardi-palette.test.ts` -- new: the grammar's compliance assertions over the Wear
      source (Design Notes).
- [x] `test/wear-cardi-palette.test.ts` -- invert the barcode's rotary cases to the paging wiring
      (Design Notes, Assertions).
- [x] `watch-android/README.md` -- the fallback is azure, not "a neutral grey" (`:310`); the
      rotary note; the square AVD.
- [x] `watch-android/README.md` -- the barcode pages on rotary; its rotary sentence corrected.
- [x] `docs/design/cardi/cardi-watch-grammar.md` -- record what this story applied; amend §8's Wear
      dismiss list to the swipe alone (decision 1); repoint its stale Wear line numbers and
      "shipped" palette.
- [x] `docs/design/cardi/cardi-watch-grammar.md` -- replace §8's "Not built by Story 23.3" with
      what was built, and the testing section's barcode row to match.

**Acceptance Criteria:**

- Given the list, the empty state, the sort picker and the barcode on a round and a square AVD,
  when each is shown, then it draws the Wear frames as Design Notes rule them.
- Given the Wear source, when it is searched, then `#4DA3FF`, `#1C1C1F`, `#B0B3B8` and `#F59E0B`
  are gone and the Cardì roles are defined once.
- Given a list, a picker and a barcode, when the crown or bezel turns, then the list and the
  picker scroll, and the barcode moves one card per detent through the order it opened with,
  stopping at both ends.
- Given the paging policy, when its JVM tests run, then they cover the held order under a re-sort,
  gone and new cards, both ends, one card, and both usage delays.
- Given no Wear OS device (decision 2), when the AVD passes are done, then Implementation Notes
  record the real-device check and rotary on hardware as an accepted risk, and the story does not
  claim them.

## Implementation Notes

**What changed.** `CarbonTheme.kt` defines `Ink`, `Beam`, `Cream`, `CreamSecondary` (cream at 0.6),
`Hairline` and `FavoriteStarTint` (= `Beam`) once and builds `CardiColorScheme` on them; its KDoc
cites the grammar, with no Carbon and no `EdgeButton`. `CardRow` reads them (ink container, cream
name, `Hairline` border on a near-black accent, initials `Cream`/`Ink` by the unchanged 0.4 line,
star `FavoriteStarTint`). `CardListScreen`'s empty state is `Cream` 50 % / `Cream` /
`CreamSecondary`, its sort button names `primary`/`onPrimary`, and its column names its rotary
behaviour. `SortPickerScreen` names the radio colours and weights the selected label. `BarcodeScreen`
lost the `pointerInput`/`detectTapGestures` dismissal and the `dismissed` latch; `onDismiss` is now
called only for a vanished card. `CardRowMetrics.kt` and `CardPresentation.kt` are unchanged (so
`useWhiteText` keeps its name; it now selects cream); `CardVisuals.kt` changed only in a KDoc
comment (Review Triage Log row 14), so no accent value or key moved.

**Choices the spec left open.**

- **The selected picker label is beam, not cream.** The I/O matrix contrasts it with "others cream
  and regular"; the frames draw it beam and watchOS ships it beam. The selection is still
  double-encoded by the radio's state and the semibold weight, never by colour alone.
- **The unselected radio ring is `onSurfaceVariant` (cream 60 %).** M3 derives it from `outline`,
  which this scheme does not set, so it would have been the M3 baseline grey — a non-Cardì value
  on a Cardì screen. The frames draw it cream at about that opacity.
- **The radio colours are named at the call site _and_ the scheme sets `primaryContainer` ink /
  `onPrimaryContainer` beam** (Design Notes: "if M3 would otherwise derive one" — it does,
  `RadioButtonTokens.SelectedContainerColor = PrimaryContainer`), so neither path can land a
  baseline colour on a picker row.
- **The sort button's colours are named** although M3's filled-button defaults (`primary`,
  `onPrimary`, verified in `FilledButtonTokens`) would give the same pixels: the assertion then
  reads what the code says rather than what a library default happens to be.
- **Rotary:** each list passes `rotaryScrollableBehavior =` the call
  `RotaryScrollableDefaults.behavior(scrollableState = listState)`. The parameter name and that
  default were confirmed in the resolved `compose-foundation-1.6.2.aar` (Compose source-info
  metadata), so the list's and the picker's rotary behaviour is exactly what they inherited, now
  named. Not also wired through `Modifier.rotaryScrollable`. (The first pass's "explicitly nothing"
  on the barcode is superseded by the paging below.)

**Paging on the barcode (review_loop_iteration 1, decisions 4–6).** Built on the first pass's tree,
nothing reverted.

- **`BarcodePaging.kt`** (new, pure Kotlin, mirroring `WatchBarcodePaging`): `heldOrder` (the
  list's own `CardSorter` sort of the cards and mode, as ids), `reachableIds(heldOrder, liveIds)`,
  `clampedPage`, `idAtPage`, `pages(currentId, reachable)` (two or more reachable, the current one
  among them), `pageAfter(currentId, reachable, step)` (the move rotary or TalkBack makes, `null`
  where it does not exist) and `usageDelay(arrival)` (`Opened` 0, `Paged` 1 s), with
  `BarcodeArrival { Opened, Paged }`. `BarcodePagingTest`: 18 JVM tests — the held order is the
  list's sort and follows its mode, it survives a re-sort, a gone card is skipped, a new one is
  unreachable, all gone is empty, both ends clamp and never wrap, a move skips a gone card, one card
  (from the start or left after a sync) and a gone current card offer no move, and both delays.
- **`WearApp.kt`** hands the barcode route `openedCardId`, the live `cards` and the `sortMode`
  rather than one resolved card.
- **`BarcodeScreen.kt`**: the held order in `rememberSaveable`, taken once at opening; the card at
  rest (`shownId`), its `arrival` and whether it has `counted`, all saveable. A Compose foundation
  `VerticalPager` (`userScrollEnabled = false`, `beyondViewportPageCount = 1`, keyed by card id) over
  the reachable cards, with one reader: `Modifier.rotaryScrollable` with
  `RotaryScrollableDefaults.snapBehavior` over the pager at `LowSnapSensitivity`, its focus requested
  by `requestFocusOnHierarchyActive()`. A `snapshotFlow` of the pager's
  `isScrollInProgress` and `settledPage` moves `shownId` only when the pager rests on another card,
  marking it `Paged`. One `LaunchedEffect(shownCardId, arrival, counted, pageMoving)` plays the open
  haptic for `Opened` only, waits `usageDelay(arrival)` and records the card — restarted (so
  cancelled) by any movement, never twice. `KeepScreenAwakeAndBright()` is called once, at the
  screen, unless the card at rest has reported a failed render; pages report it and carry no
  effect. A vanished card on screen still pops back (the only `onDismiss` caller). TalkBack's
  `CustomAccessibilityAction`s ("Next card" / "Previous card", `R.string.barcode_next_card` /
  `barcode_previous_card`, en and it) are set, merged, on the page at rest only, from
  `BarcodePaging.pageAfter`, and `animateScrollToPage` as rotary does. Under `LocalReduceMotion`
  each page gets a `graphicsLayer` that cancels the pager's offset and fades by it (a crossfade in
  place). The page body is the shipped success/error content, unchanged.

**Choices the spec left open, or where it was wrong (paging).**

- **Compose foundation's `VerticalPager`, not wear-compose's** (the Code Map names wear's, "resolved,
  unverified at runtime"). Run on the round API 34 AVD, wear's pager with swipes off and an outside
  `Modifier.rotaryScrollable` paged nothing: logging showed the reader take
  focus and lose it ~16 ms later, when the first page attached. wear's pager wraps every page in
  `hierarchicalFocusGroup(active = page == currentPage)`, and wear-compose's hierarchical-focus
  coordinator calls `FocusManager.clearFocus()` whenever the active path changes and no newly active
  node requests focus (read from the resolved 1.6.2 bytecode) — so the page group joining the path
  cleared the reader's focus. Moving the reader onto the white ground did not help, and the pager's
  own reader works only with swipes on, which decision 4 rules out. The foundation pager has no page
  focus groups; the wear snap behaviour drives it through a 4-line `RotarySnapLayoutInfoProvider`
  with the same arithmetic as wear's internal `PagerRotarySnapLayoutInfoProvider`. Same platform
  haptic and bezel path; no `Modifier.rotaryScrollable` overscroll (it defaults to `null`).
- **The card counts as on screen only once the pager rests**, not at slide start (watchOS starts
  its 1 s as the card enters). The spec's "1 s settled on screen" reads that way, and it makes the
  cancellation exact: any movement, the next turn included, restarts the effect. Measured cost: a
  paged card counts about 1.8 s after the turn (the snap's ~0.8 s, then 1 s).
- **A turn past an end** may start and stop a scroll without changing the card; for a paged card
  that only restarts its 1 s, and the opened card never re-counts (`counted` is saveable).
- **The TalkBack actions are on the page node, merged** (`semantics(mergeDescendants = true)`), so
  TalkBack focuses one node per card that reads its title, barcode label and value and carries the
  actions; before, the three were separate nodes. Pages beside carry no actions.
- **The neighbouring card on each side is composed** (`beyondViewportPageCount = 1`), so its barcode
  has rendered when it slides in; its render runs off the main thread and is cached (8 entries).

**Verification.**

- `./gradlew lintDebug testDebugUnitTest assembleDebug`: pass — lint 0 errors (2 pre-existing
  AGP/Gradle version notices), 177 JVM tests (159 + `BarcodePagingTest`'s 18), 0 failures.
- `test/wear-cardi-palette.test.ts`: 39 tests. A 54-mutation pass (each mutation applied to the real
  source, the suite run, the file restored and its hash checked) killed every mutation, and every
  one of the 39 tests failed under at least one of them.
- Paging pass: the suite is now 48 tests (the barcode's "wires nothing" case inverted into 10 paging
  cases, "binds rotary nowhere else" now expects the barcode too, the tap and vanished-card cases
  restated). A 35-mutation pass over the new and changed cases, run the same way, killed all 35, and
  each of the 13 new or changed cases failed under at least one; one survivor on the first run (the
  provider's page size halved) was closed by asserting the provider's whole body. After review the
  suite is 50 tests: the pager's opening page, the saveable visit state, the render-failure report,
  the merged TalkBack node, the composed neighbour and the re-anchor on the live `shownId` are
  pinned, and the colour check covers any `Color(` call; a 12-mutation pass killed all 12.
- AVDs (headless, no snapshot load or save): round API 30 (`wearos30_arm64`), round API 34
  (`wearos5_round_34`), square API 30 (`wear_square_30`), and a temporary square API 34 AVD made
  for rotary and deleted afterwards. Measured from screenshots, on every shape: rows `#181824`,
  names `#F0F0E8`, star `#FCCC0C`, hairline `#3A3A48` on the deep-blue (near-black) accent only,
  ink initials on yellow and cream on blue, rows 96 px (48 dp) 8 px (4 dp) apart; empty state glyph
  `#787874`, title `#F0F0E8`, subtitle `#90908B`; sort control beam with ink; picker rows ink, the
  selected label and radio beam, the unselected ring `#9A9A99`. Square uses the round layout with
  black corners. Barcode: white edge to edge, black title, no clock, `sbrt=1.0` with
  `KEEP_SCREEN_ON` on all four; both seen released after the swipe back on round API 30 and 34 and
  square API 34.
- Rotary, via `adb shell input rotaryencoder scroll` (API 34 only — API 30's `input` has no rotary
  source and these AVDs carry no rotary device): on round and square, three detents scroll the
  list's first row from y 256 to y 80 px and three back return it exactly; the picker scrolls and
  returns the same way; five detents either way leave the barcode pixel-identical; the crown
  scrolls the list again after the barcode pops.
- Taps: three taps (centre, title, corner) leave the barcode pixel-identical on all four AVDs, and
  the unsupported-format error state on round API 30 and square API 34; the system swipe returns.
- **Paging, on round API 34 (`wearos5_round_34`) and a temporary square API 34 AVD (made from
  `wearos_square`, deleted afterwards), with `adb shell input rotaryencoder scroll`:** one
  `SCROLL,-2` pages exactly one card onward and `SCROLL,2` one back, in the list's A–Z order
  (Esselunga → Aztec (unsupported) → Bad Checksum (invalid) → Code128 …); frames caught mid-turn show
  the next card entering from below and the previous leaving at the top, with the snap's small
  overshoot; turned past the first and the last card, the barcode stays pixel-identical; with the
  database cut to one card (pushed with `run-as`, restored afterwards), three turns leave it
  pixel-identical and send nothing. At rest the barcode is pixel-identical to the first pass's build
  (round API 34 `c255fd26…`). Swipes up and down and three taps change nothing; the swipe from the
  left returns to the list, which the crown scrolls again, and so the picker.
- **Usage, read from the `usage_outbox` table:** the opened card at once; a paged card ~1.8 s after
  the turn; skimming two detents 0.2 s apart sends nothing for the card between; a card turned away
  from 0.5 s after it settled sends nothing; a card whose screen was swiped closed 0.4 s after it
  settled sends nothing; a return to the opened card by rotary counts again after 1 s.
- **Brightness:** `sbrt=1.0` with `KEEP_SCREEN_ON` on Esselunga, both released on the next card (an
  error card), and back on Code128; released after the swipe back.
- **API 30 (round and square), the new build:** the barcode at rest is pixel-identical to the first
  pass's build on both; swipes and taps change nothing; full brightness, released on the swipe back.
  No rotary (no source).
- **Reduce motion.** On the API 34 image `settings put global reduce_motion 1` also sets the three
  animation scales to 0, so the change of card is instant (frames show no slide); and the app,
  targeting SDK 35, may not read `reduce_motion` there — wear-compose logs a `SecurityException`
  ("is only readable to apps with targetSdkVersion lower than or equal to: 34"), so
  `LocalReduceMotion` is false on API 34+. On API 30 the key is readable and the scales
  stay at 1, so the crossfade is the live path there, but API 30 cannot be turned. The crossfade was
  checked once by forcing the flag in a scratch build on round API 34: frames show both cards at
  rest, one fading out as the other fades in. The scratch build was not kept.
- **Not driven:** TalkBack's "Next card" / "Previous card" (the AVDs run no TalkBack; pinned by the
  source suite only), a card deleted or a list re-sorted mid-visit (needs the phone; covered by
  `BarcodePagingTest`), and rotary on API 30.
- **After the step-4 patches, on the whole tree:** `./gradlew lintDebug testDebugUnitTest
assembleDebug` pass (lint 0 errors, 177 JVM tests, 0 failures); `yarn typecheck`, `yarn lint`
  and `yarn format:check` pass; `yarn test` passes, 217 suites and 4,295 tests, among them
  `test/wear-cardi-palette.test.ts` (50) and `core/wear-sync-contract.test.ts`. The handback runs
  the four again on the final tree.
- **Device check on the final code (after the step-4 patches; APK `a1b54a3f…`).** Round API 34
  (`wearos5_round_34`) and a temporary square API 34 AVD made from the README's new recipe and
  deleted afterwards. List, picker and empty state measured as above on both shapes. A barcode
  opened from a card that is not first (Code128, 4th; Code39, 5th) shows that card. One detent
  pages one card each way (next from below), past either end is pixel-identical, error cards drop
  `sbrt`/`KEEP_SCREEN_ON` and the next rendered card takes them back, vertical swipes and taps
  change nothing, the system back (edge swipe, `KEYCODE_BACK`) returns and the crown scrolls the
  list again. `usage_outbox`: the opened card at once, a paged card ~1.8 s after its turn, nothing
  for a skimmed card or one turned away within 1 s, on both shapes. **Not re-run on the final code:
  round and square API 30** — the API 30 image would not boot on this host this session (QEMU hang,
  then exit 139, with every flag tried; the API 34 AVD booted in between), so those AVDs still hold
  the pre-patch build that the paging pass checked. The step-4 patches touched only
  `BarcodeScreen.kt`'s re-anchor effect and comments, so no API 30 rendering path changed.
  Screenshots: `/private/tmp/claude-501/-Users-ifero-Developer-cardi-loyalty-cards--claude-worktrees-bmad-build-galaxy-watch-approval-fe6a06/179cf89a-6da8-4f37-8391-979f5a924c25/scratchpad/device-check/`
  (outside the repository).

**Accepted risk — no hardware pass (decision 2).**

- **Context:** The epic's real-device check and rotary on hardware are not performed: there is no
  Wear OS device. Rotary was driven only through the API 34 AVDs' emulated `rotaryencoder` input,
  and not at all on API 30.
- **Decision:** Ship on the AVD passes and record the gap as an explicit accepted risk (ifero,
  2026-10-25), not as a pending checkbox. This story does not claim the real-device check or rotary
  on hardware.
- **Residual risk:** A physical crown's or bezel's event rate and haptics differ from a shell
  injection; a bezel device's detent size, rotary on Wear OS 3 (API 30) hardware, and the beam's
  look on a real OLED panel at full brightness are unverified. As with DEC-E10-RETRO-001,
  `watch-android` has no crash reporting, so a field failure produces no signal.
- **Mitigation:** The lists' rotary is the library's default path, unchanged from what shipped, now
  named; the barcode's is the library's snap behaviour at low sensitivity, driven on the API 34 AVDs
  one detent at a time; the colours are measured exactly on emulator framebuffers.
- **Added by the paging:** whether one physical detent (crown or bezel) pages exactly one card, the
  feel of the snap's ~0.8 s and its haptic, and whether a stray detent at a till pages a card, are
  unverified on hardware.
- **Owner:** ifero · **Status:** Accepted 2026-10-25 (decision 2).

**Story 21.5 AC5 stays open (decision 3).** This story ships the palette, clearing one of the Wear
store screenshots' three blockers; no captures were taken.

**Open, for ifero.**

- **An error card reached by paging shows no card name** (device check, final code). The error
  states are as today ("Invalid barcode", "Unsupported barcode", no title), which the matrix rules
  ("Error states as today, per card"); before paging, the user had just tapped that card, so the
  name was known. Now a turn can land on one with nothing saying which card failed. Adding the
  name would change that frozen row, so it is ifero's call, not fixed here.
- **The grammar now asks Wear to page through cards on the barcode; this spec says nothing.**
  _Resolved 2026-10-28: ifero chose to amend the spec and build it here (Spec Change Log)._
  `cardi-watch-grammar.md` §8 was amended on 2026-10-27 (after this spec was frozen on 2026-10-25)
  to have the crown page through the cards on both barcode screens, and says this spec "has to be
  amended to this before it is built". It was not amended, and this spec is the source of truth for
  the build, so rotary does **nothing** on the Wear barcode, as its I/O matrix rules. The grammar
  now records that the Wear paging is not built. Building it is a new story-sized change (held
  order, clamping, 1 s usage delay, slide and haptics, as watchOS's `BarcodePagerView`). _Built in
  review_loop_iteration 1; the grammar's §8 now records it as built._
- **`LocalReduceMotion` is false on API 34+ for this app** (targetSdk 35 may not read
  `reduce_motion`; measured), so the crossfade only runs where the key is readable (API 30). On the
  API 34 image the setting zeroes the animation scales anyway, so the change is instant, not a
  slide. Raising this with wear-compose, or reading another signal, is outside this spec.
- **The picker's rows keep M3's pill shape**, where watchOS's are radius 14 and the grammar's
  forbidden list names "14 for rows". Out of this spec's scope ("behaviour as shipped" except
  colour, star, second encoding and rotary), so left as shipped and flagged.
- **On API 30, a fling past either end of a list draws Compose's pre-Android-12 overscroll glow**
  (neutral `#666666` at low alpha), visible only in a square screen's corners. It clears as soon as
  the list scrolls back and is not drawn on a gentle scroll; platform behaviour, not this palette.
- The AVD passes left the debug APK installed, with seeded sample cards, on `wearos30_arm64`,
  `wearos5_round_34` and `wear_square_30`; the virtual battery was reset after each run. The paging
  pass reinstalled this build on all three, left `reduce_motion` at 0 and the animation scales at 1,
  and restored round API 34's full card set after the one-card check.

**Review loops.**

- Code review, round 1 (Sonnet): CHANGES_REQUESTED, 1 finding, not a nit.
  `docs/design/wear-store-screenshots/README.md` still listed blocker 3 (the stale Wear palette) as
  open, with values this story removed. Fixed: blocker 3 marked cleared by Story 23.3, the old text
  kept as what it said before, prerequisite 1 marked met. The PNGs and blockers 1 and 2 are
  untouched.
- Code review, round 2 (Sonnet): APPROVED, zero comments.
- QA, round 1 (Sonnet): CHANGES_REQUESTED, 2 findings on this record, no defect in the change.
  The `## Verification` yarn commands were not recorded (they had passed; now recorded above), and
  "What changed" called `CardVisuals.kt` unchanged after row 14's comment patch (now says comment
  only). Every matrix row and criterion otherwise mapped to evidence.
- QA, round 2 (Sonnet): APPROVED, zero comments. Both loops ended on an approval, not a nit-only
  round.

### Found, not fixed

- **No Compose UI test stack in `watch-android`, so `BarcodeScreen`'s effects never execute under
  test** (medium). The opened card's page, usage at once versus after 1 s at rest and its
  cancellation, no double count across a recreation, the error card's brightness release and the
  TalkBack actions are pinned as source text only. The module had no such stack before this story
  either (the previous barcode effects were untested too), and this spec's approach and Code Map
  keep it out. Follow-up: a Robolectric `ui-test-junit4` suite for the barcode screen.
- **Whether TalkBack announces the card a "Next card" / "Previous card" action or a rotary page lands
  on** (medium, unverified). The AVDs ran no TalkBack. Settle it by enabling TalkBack on an API 34
  AVD and paging with the actions; if nothing is announced, add a polite live region or move focus
  to the settled page.
- **Reduce motion cannot be read on API 34+** (medium, unverified on hardware). wear-compose's
  `LocalReduceMotion` is false for a targetSdk 35 app there (`SecurityException`, measured), so the
  crossfade runs only on API 30–33. On the API 34 image the setting also zeroes the animation
  scales, so the change is instant; whether a real Wear OS 5 device does the same is unknown.
  Follow-up: read reduce motion through a signal the app may read.
- **The debug-only "Import sample cards" button is clipped on square** (low, debug builds only),
  and the empty state does not scroll to it. Pre-existing layout; seen in the device check.
- **On square API 34, one list detent onward and one back left the list ~16 px off its start**
  (low). The list's rotary is the library's default fling behaviour, unchanged by this story (now
  only named); round returned exactly. Seen in the device check.

## Spec Change Log

- **2026-10-28, intent change by ifero (review_loop_iteration 1).** The first build followed this
  spec's ruling that rotary does nothing on the barcode, while grammar §8, amended on 2026-10-27
  during Story 23.2, says Wear pages through the cards and that this spec "has to be amended to
  this before it is built". Asked at the end of the first pass, ifero chose to amend the spec and
  build the paging here. Amended inside the frozen block, with ifero's approval: the Problem and
  the Approach, the Always lines on behaviour and the barcode, two new Always lines (per-card
  effects, the paging policy), the rotary Never line, the matrix (the rotary-on-barcode row
  replaced; ends, one card, held order, usage, TalkBack and swipe rows added; the barcode row's
  error handling per card) and decisions 4–6. Outside it: the Code Map, the tasks, the acceptance
  criteria, Design Notes (Rotary, Paging, Assertions) and Verification. Known bad state avoided:
  a Wear barcode that a turn cannot move while watchOS's can, or that moves on any input but
  rotary and its TalkBack stand-in. KEEP: everything the first pass built and verified (the
  palette, the rows, the picker's colours and weight, the list's and the picker's explicit rotary,
  the removed tap dismissal); paging is built on top of that tree, not re-derived, so nothing is
  reverted.

## Review Triage Log

Step 4, review_loop_iteration 1 (blind hunter, edge-case hunter, verification gap, project
conventions), on the paging diff. No intent_gap or bad_spec; patches applied by the implementation
subagent.

| #   | Layer                    | Location                                      | Claim                                                                                                                                                                                                                | Verdict                            | Evidence                                                                                                                                                                      | Route                                                                        |
| --- | ------------------------ | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | conventions, blind, edge | grammar §6(b)                                 | Cites `BarcodeScreen.kt:316-330`, which is `BarcodePage`'s KDoc, not the brightness code                                                                                                                             | low                                | `KeepScreenAwakeAndBright` sat at 523-539; the range matched neither version                                                                                                  | patch: repointed                                                             |
| 2   | verification gap, edge   | `wear-cardi-palette.test.ts`                  | Pager `initialPage`, the saveable `shownId`/`arrival`/`counted`, the failed-render report and its wiring, the TalkBack `semantics` and `beyondViewportPageCount = 1` were unpinned: deleting any left 48 tests green | medium                             | Pre-verified gap; confirmed no assertion read those lines                                                                                                                     | patch: pinned, 12 mutations all killed                                       |
| 3   | verification gap, blind  | `BarcodeScreen.kt`                            | Its effects run under no test (no Compose UI test stack)                                                                                                                                                             | medium                             | True; the module never had that stack, and this spec's approach and Code Map keep it out                                                                                      | defer: Found, not fixed                                                      |
| 4   | edge, blind              | `BarcodeScreen.kt:167-172`                    | `LaunchedEffect(reachable)` re-anchors on the captured `shownCardId`, so a sync as the pager settles scrolls it back                                                                                                 | low                                | The effect closed over the composition's value; one-line fix                                                                                                                  | patch: reads the live `shownId`                                              |
| 5   | blind                    | `BarcodeScreen.kt:167-172`                    | The re-anchor skips while the pager moves and never retries                                                                                                                                                          | low                                | Needs a sync deleting a card ahead within a ~0.8 s snap; the worst case lands one card further; the fix adds logic                                                            | reject: unlikely, not a direct fix                                           |
| 6   | edge                     | `BarcodeScreen.kt:194-200`                    | Backgrounded within 1 s of a paged card settling, the delay still completes and records it                                                                                                                           | low                                | True (the composition survives `onStop`), but needs a page then a palm or button inside 1 s, and the fix adds a lifecycle guard                                               | reject: unlikely, not a direct fix                                           |
| 7   | blind                    | grammar §8                                    | "What ships today" and "Why explicit" read as current but describe the code before 23.2/23.3, crediting a scaffold for the lists' rotary                                                                             | low                                | The barcode has a `rotaryScrollable` now; the lists' came from `TransformingLazyColumn`'s default                                                                             | patch: marked as before 23.2/23.3, attribution corrected                     |
| 8   | blind                    | grammar §8 dismiss table                      | Wear's "swipe alone" omits the back key and TalkBack's back                                                                                                                                                          | low                                | `SwipeDismissableNavHost`'s hosts register `BackHandler` / `PredictiveBackHandler` (1.6.2 bytecode)                                                                           | patch: Swipe row names them                                                  |
| 9   | conventions              | `wear-cardi-palette.test.ts:15-17`            | The suite is not co-located; its rationale is wrong                                                                                                                                                                  | low (rationale) / false (location) | The frozen Always line puts it under `test/`, as `wear-icons` and `watch-accent` are; but Jest would also run a file under `watch-android/`, so the stated contrast was wrong | patch: rationale reworded to Jest versus Gradle                              |
| 10  | conventions              | `wear-cardi-palette.test.ts:4`                | Relative cross-boundary import of `tokens.generated`                                                                                                                                                                 | low                                | project-context Import Convention; Jest maps `^@/`                                                                                                                            | patch: `@/shared/theme/tokens.generated`                                     |
| 11  | conventions              | `values-it/strings.xml:33-34`                 | New comment in Italian                                                                                                                                                                                               | low                                | AGENTS.md: documentation in English                                                                                                                                           | patch: English comment                                                       |
| 12  | blind                    | `watch-android/README.md`                     | Says rotary is checked on API 34 AVDs but only creates API 30 ones                                                                                                                                                   | low                                | True                                                                                                                                                                          | patch: API 34 image and round and square AVD lines                           |
| 13  | blind                    | `wear-cardi-palette.test.ts:181-186`          | Colour-literal check matches only `Color(0x`, narrower than the grammar's claim                                                                                                                                      | low                                | True                                                                                                                                                                          | patch: any `Color(` call; the row's accent conversion pinned as its one site |
| 14  | blind                    | `CardVisuals.kt:105`, `CardVisualsTest.kt:93` | Comments still say "Carbon surface"                                                                                                                                                                                  | low                                | True; comment-only                                                                                                                                                            | patch: reworded to the ink row                                               |
| 15  | conventions, blind       | `CardRow.kt:111-112`                          | `useWhiteText` now selects cream; the name misleads                                                                                                                                                                  | low                                | Documented at its one use site; renaming crosses `CardPresentation`/`CardVisuals` and their tests, which this spec holds unchanged                                            | reject: low, not a direct fix                                                |
| 16  | conventions              | `CarbonTheme.kt`                              | The file name still says Carbon                                                                                                                                                                                      | low                                | Design Notes: "The file keeps its name"                                                                                                                                       | reject: the fix edits the spec                                               |
| 17  | conventions              | `CarbonTheme.kt:24-36`                        | Hex literals instead of tokens                                                                                                                                                                                       | false                              | The frozen Always line defines them once in the theme file; project-context's rule governs the phone's unistyles; the suite pins them to `tokens.generated`                   | reject                                                                       |
| 18  | blind                    | `wear-cardi-palette.test.ts`                  | Verbatim pins are brittle; mutation evidence unrecorded                                                                                                                                                              | false                              | Source-text pins are the frozen approach; the 54-, 35- and 12-mutation passes are recorded under Verification                                                                 | reject                                                                       |
| 19  | blind                    | `BarcodeScreen.kt`                            | TalkBack is not told which card is now showing                                                                                                                                                                       | maybe-false (medium if true)       | No TalkBack on the AVDs; settle by paging with TalkBack on                                                                                                                    | defer: Found, not fixed, unverified                                          |
| 20  | blind                    | `BarcodeScreen.kt:233`                        | Reduce motion does nothing on API 34+                                                                                                                                                                                | maybe-false (medium if true)       | `LocalReduceMotion` false there (measured); the API 34 image zeroes the scales; hardware unknown                                                                              | defer: Found, not fixed, unverified                                          |
| 21  | blind                    | `BarcodeScreen.kt:141-143`                    | The barcode re-sorts instead of receiving the list's order                                                                                                                                                           | false                              | Same `CardSorter()` over the same cards and mode, as Design Notes' Order rule says                                                                                            | reject                                                                       |
| 22  | blind                    | `BarcodeScreen.kt:265`                        | `beyondViewportPageCount = 1` may slow the opened card's render                                                                                                                                                      | maybe-false (low if true)          | Three cached encodes on `Dispatchers.Default`; settle by timing the first frame                                                                                               | reject: would only be low                                                    |
| 23  | device check             | error states                                  | A paged-to error card shows no card name                                                                                                                                                                             | low                                | True; the matrix rules error states "as today", and adding the name changes that frozen row                                                                                   | to ifero: Open, for ifero                                                    |
| 24  | device check             | `BarcodeScreen.kt:194-200`                    | A paged-to error card counts as used after 1 s                                                                                                                                                                       | false                              | Decision 5 makes no exception for error cards, and opening one counted before this story                                                                                      | reject                                                                       |
| 25  | device check             | empty state (square)                          | The debug "Import sample cards" button is clipped                                                                                                                                                                    | low                                | Pre-existing layout, debug builds only                                                                                                                                        | defer: Found, not fixed                                                      |
| 26  | device check             | card list (square API 34)                     | One detent onward and back leaves the list ~16 px off                                                                                                                                                                | low                                | The library's default fling rotary, unchanged by this story                                                                                                                   | defer: Found, not fixed                                                      |

## Design Notes

The grammar governs; the frames encode it and are schematic where they differ (the radio's dot,
the header's opacity, the in-row 8 against the shipped 10, which stays).

**Theme** (`CarbonTheme.kt`, one place): `Ink #181824`, `Beam #FCCC0C`, `Cream #F0F0E8`,
`CreamSecondary` (cream at 0.6), `Hairline #3A3A48`. The scheme: `background` black,
`onBackground` and `onSurface` cream, `surfaceContainer` ink, `onSurfaceVariant` cream 60 %,
`primary` beam, `onPrimary` ink, and the picker's selected container ink if M3 would otherwise
derive one. The file keeps its name; its constants take the Cardì names.

**Rows** (§5.3, §4.4, §7.2). As today but ink, cream, `#3A3A48` and a beam star; initials ink above
the 0.4 luminance line, cream below. The M3 ripple is the press feedback.

**List** (§3, §3.2). "Cards" through the scheme (cream). The sort button keeps its place and
glyph, beam with ink. The empty state's 40 glyph cream 50 %, title cream, subtitle cream 60 %.

**Picker** (§8.1). M3 `RadioButton`s tinted beam on ink rows; the selected label semibold, so the
selection shows twice.

**Rotary** (§8). The list's and the picker's `TransformingLazyColumn` get their rotary behaviour
explicitly at the call site; the barcode has its own single reader, for paging.

**Paging** (§8, decisions 4–6), mirroring watchOS's `WatchBarcodePaging`:

- **Policy**, pure Kotlin in `BarcodePaging.kt`: the reachable ids are the held order filtered by
  the live ids (gone cards skipped, cards added since unreachable); the page is clamped to both
  ends; paging exists only with two or more reachable cards including the current one; the usage
  delay is 0 for the opened card and 1 s for a paged one.
- **Order**: captured once, at opening, from the same `CardSorter` sort of the live cards and sort
  mode the list showed, and kept in saveable state for the visit.
- **Input**: vertical, so a turn moves the cards the way it moves the list's rows; the next card
  enters from below. Swipe paging is off; one rotary reader with the snap behaviour at low
  sensitivity gives one card per detent, the platform's detent haptic and the bezel path. Under
  `LocalReduceMotion` the change is a crossfade in place, not a slide.
- **Per card**: the open haptic and the at-once usage event belong to the opened card only; a paged
  card plays no open haptic and sends its usage event after 1 s settled on screen, cancelled if
  rotary moves on or the screen closes; every rotary arrival counts, a return to the opened card
  included, as on watchOS. Full brightness and keep-awake follow the card on screen: held across
  rendered cards without a drop between them, released on an error card as today.
- **Gone mid-visit**: a paged-to card that disappears is skipped. If the card on screen
  disappears, the screen returns to the list, which is Wear's rule today for a card that vanished
  before opening (watchOS shows an "unavailable" line; Wear has no such string).
- **TalkBack**: the barcode offers two custom accessibility actions, "Next card" and "Previous
  card" (English and Italian), each only where that move exists, standing in for watchOS's
  VoiceOver adjust gesture. They page exactly as rotary does.

**Assertions** (the grammar's testing section), in `test/wear-cardi-palette.test.ts`: `181824`,
`F0F0E8`, `3A3A48`, `FCCC0C` present in the theme; `4DA3FF`, `1C1C1F`, `B0B3B8`, `F59E0B` absent
from the Wear source; no `Color.White` in `CardRow.kt` or the empty state; the star takes beam;
an explicit rotary behaviour in both lists; on the barcode exactly one rotary reader, at low
sensitivity, with swipe paging off, no page indicator, and still no tap dismissal (decision 1);
the usage effect keyed on the settled card with the policy's delay; no rotary anywhere else; row
48 and radius 14; the KDoc names the grammar, not Carbon.

## Verification

**Commands:**

- From `watch-android/`: `./gradlew lintDebug testDebugUnitTest assembleDebug` -- expected: pass.
- `yarn typecheck`, `yarn lint`, `yarn format:check`, `yarn test` -- expected: all pass, the new
  suite and `core/wear-sync-contract.test.ts` included.

**Manual checks (if no CLI):**

- On a round AVD (API 30 and 34) and a square AVD: the list with favourites and custom cards, the
  empty state, the picker, a barcode; rotary on each through the emulator's rotary input.
- On the barcode, through `adb shell input rotaryencoder` (API 34): one detent onward and back,
  both ends, a one-card list, an error card paged onto and off; swipes up and down page nothing.
  Rotary on API 30, whose `input` has no rotary source, is named as unchecked.
- No hardware pass (decision 2) and no store screenshots (decision 3); both are recorded, not
  performed.

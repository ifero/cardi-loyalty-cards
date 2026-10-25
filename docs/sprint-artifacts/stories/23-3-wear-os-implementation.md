---
title: 'Story 23.3: Wear OS implementation — the list, the barcode and the sort picker on the watch grammar'
type: 'feature'
created: '2026-10-25'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
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
only. Rotary scrolling is inherited rather than wired. The watch grammar
(`docs/design/cardi/cardi-watch-grammar.md`, Story 23.1) settles each of these, and Story 21.5's
Wear store screenshots wait on this palette.

**Approach:** Put the Cardì roles into the Wear theme once and apply the grammar to
`CardListScreen`, `CardRow`, `SortPickerScreen` and `BarcodeScreen`, on round and square at 192 dp.
Rotary scrolls the list and the picker explicitly and does nothing on the barcode. Guard every
change with source-text assertions in a `test/` suite. Verify on round and square AVDs, then on
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
  colours, the star, the picker's second encoding and explicit rotary.
- The barcode stays white edge to edge, true-black bars, `FilterQuality.None`, nothing overlaid; its
  title stays black inside the field (the cream carve-out is watchOS's strip, which Wear lacks).
- Square uses the round layout, its corners empty.
- Every old value is asserted absent and every new one present, in a suite under `test/` (it runs
  in `yarn test`; `wear-os-build.yml` is path-filtered); each new assertion is seen to fail under
  its mutation.

**Never:**

- Commit, push, or change `sprint-status.yaml` or any other tracker file: the orchestrator owns all
  three.
- Touch watchOS (Story 23.2), the Apple widget (Story 23.4) or the phone app.
- Bind rotary to anything but scrolling, or wire it twice.
- Add a custom typeface, a 0.98 scale, a shadow, a plate behind the star, a drawn dot in place of
  the radio, or a second design for square.
- Darken azure: that is the design system's open contrast item.

## I/O & Edge-Case Matrix

| Scenario        | Input / State                       | Expected Output / Behavior                                                                               | Error Handling        |
| --------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------- |
| List            | Cards synced, round or square       | Ink rows on black, 4 apart, 48 tall, radius 14; cream names; a beam star on favourites; "Cards" in cream | N/A                   |
| Sort control    | Second list item                    | A beam button with ink label and glyph                                                                   | N/A                   |
| Custom card     | Initials on an accent               | 12 sp bold initials, ink or cream by the accent's luminance (0.4)                                        | N/A                   |
| Near-black chip | An accent below the near-black line | The 1 dp hairline in `#3A3A48`                                                                           | N/A                   |
| Empty           | No cards                            | Glyph cream 50 %, title cream, subtitle cream 60 %                                                       | N/A                   |
| Sort picker     | Screen open                         | Ink rows; the selected radio beam, its label semibold; others cream and regular                          | N/A                   |
| Rotary on list  | Turn the crown or bezel             | The list scrolls                                                                                         | N/A                   |
| Rotary picker   | Turn                                | The options scroll                                                                                       | N/A                   |
| Rotary barcode  | Turn                                | Nothing                                                                                                  | N/A                   |
| Barcode         | Any card                            | As today: white edge to edge, full brightness, the clock blanked, the title black                        | Error states as today |
| Tap on barcode  | A tap anywhere on it                | Nothing; the barcode stays (decision 1)                                                                  | N/A                   |

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
  `sort`, `barcode/{cardId}`.
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
- `wear/presentation/BarcodeScreen.kt` -- `ScreenScaffold(timeText = {})` (`:130`); white surround
  (`:134`); title `titleSmall` black (`:241-251`); tap-anywhere dismissal with a latch
  (`:113-135`); `KeepScreenAwakeAndBright` (`:327-342`); two error states (`:286-319`).
- Rotary in wear-compose 1.6.2: `TransformingLazyColumn` takes a `rotaryScrollableBehavior`, which
  is why scrolling works today; making it explicit means passing it at the call site
  (`RotaryScrollableDefaults.behavior(state)`) or `Modifier.rotaryScrollable(...)` with a focus
  requester, not both. Confirm the parameter against the resolved 1.6.2 AAR before use.
- Tests: Kotlin unit tests under `watch-android/app/src/test/.../wear/` (Robolectric; none
  reference the theme, metrics or Compose; `CardPresentationTest` covers the contrast flip). No
  Compose UI or screenshot tests. Source-text suites in `yarn test`: `core/wear-sync-contract.test.ts`
  (`:51`, `:270-311`, the palette), `test/wear-icons.test.ts` (the precedent for a `test/` suite
  reading Kotlin).
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

- [ ] `wear/presentation/theme/CarbonTheme.kt` -- the Cardì roles once (Design Notes); the scheme
      on them; `FavoriteStarTint` beam; the KDoc repointed to the grammar, `EdgeButton` dropped.
- [ ] `wear/presentation/CardRow.kt` -- ink container, cream name, `#3A3A48` hairline, initials ink
      or cream, the star beam.
- [ ] `wear/presentation/CardListScreen.kt` -- the empty state in cream; the sort button beam with
      ink; the list's rotary explicit.
- [ ] `wear/presentation/SortPickerScreen.kt` -- ink rows, beam radios, the selected label
      semibold; rotary explicit.
- [ ] `wear/presentation/BarcodeScreen.kt` -- rotary does nothing, explicitly; remove the
      tap-anywhere dismissal and its latch (decision 1).
- [ ] `test/wear-cardi-palette.test.ts` -- new: the grammar's compliance assertions over the Wear
      source (Design Notes).
- [ ] `watch-android/README.md` -- the fallback is azure, not "a neutral grey" (`:310`); the
      rotary note; the square AVD.
- [ ] `docs/design/cardi/cardi-watch-grammar.md` -- record what this story applied; amend §8's Wear
      dismiss list to the swipe alone (decision 1); repoint its stale Wear line numbers and
      "shipped" palette.

**Acceptance Criteria:**

- Given the list, the empty state, the sort picker and the barcode on a round and a square AVD,
  when each is shown, then it draws the Wear frames as Design Notes rule them.
- Given the Wear source, when it is searched, then `#4DA3FF`, `#1C1C1F`, `#B0B3B8` and `#F59E0B`
  are gone and the Cardì roles are defined once.
- Given a list, a picker and a barcode, when the crown or bezel turns, then the list and the
  picker scroll and the barcode stays.
- Given no Wear OS device (decision 2), when the AVD passes are done, then Implementation Notes
  record the real-device check and rotary on hardware as an accepted risk, and the story does not
  claim them.

## Implementation Notes

## Spec Change Log

## Review Triage Log

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
explicitly at the call site; the barcode wires none, so nothing scrolls or acts there.

**Assertions** (the grammar's testing section), in `test/wear-cardi-palette.test.ts`: `181824`,
`F0F0E8`, `3A3A48`, `FCCC0C` present in the theme; `4DA3FF`, `1C1C1F`, `B0B3B8`, `F59E0B` absent
from the Wear source; no `Color.White` in `CardRow.kt` or the empty state; the star takes beam;
an explicit rotary behaviour in both lists and none in `BarcodeScreen.kt`, which also holds no tap
dismissal (decision 1); row 48 and radius 14;
the KDoc names the grammar, not Carbon.

## Verification

**Commands:**

- From `watch-android/`: `./gradlew lintDebug testDebugUnitTest assembleDebug` -- expected: pass.
- `yarn typecheck`, `yarn lint`, `yarn format:check`, `yarn test` -- expected: all pass, the new
  suite and `core/wear-sync-contract.test.ts` included.

**Manual checks (if no CLI):**

- On a round AVD (API 30 and 34) and a square AVD: the list with favourites and custom cards, the
  empty state, the picker, a barcode; rotary on each through the emulator's rotary input.
- No hardware pass (decision 2) and no store screenshots (decision 3); both are recorded, not
  performed.

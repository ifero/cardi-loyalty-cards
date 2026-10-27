---
title: 'Story 23.2: watchOS implementation — the list, the barcode and the sort picker on the watch grammar'
type: 'feature'
created: '2026-10-25'
status: 'in-review'
route: 'dispatch'
review_loop_iteration: 1
baseline_commit: '1ad92b2a4366da8e6b7b67beef19937ed20e1f43'
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The watchOS app still paints its pre-Cardì chrome. Rows are filled `#1C1C1F` with white
names and white hairlines; the favourite star is system yellow; the empty state, the sort sheet and
the "unavailable" line are white at assorted opacities; rows sit 6 apart; the row declares a 44
target it never uses. Every colour is a literal at its call site, with no definition for the target.
The Digital Crown dismisses the barcode screen, and nothing wires it to scroll the list. Someone who
opened one card's barcode and needs the card next to it has to go back to the list for it. The
watch grammar (`docs/design/cardi/cardi-watch-grammar.md`, Story 23.1) has settled each of these.

**Approach:** Define the Cardì watch colours once for the target and apply the grammar to
`CardListView` (rows, list, empty state), `WatchSortPickerView` and `BarcodeFlashView`. The crown
scrolls the list and the picker, and on the barcode screen it scrolls through the cards, one card
per detent, as decisions 2–4 rule it. Invert the contract tests that pin the old values and add the
grammar's compliance assertions. Verify on the simulator at 40, 46 and 49 mm, then on a real Apple
Watch, where the grammar's two device checks are made and the crown's feel is judged.

## Boundaries & Constraints

**Always:**

- The values are the grammar's (Design Notes): ground `#000000`, rows and sheets ink `#181824`,
  text cream `#F0F0E8`, secondary text cream at 60 %, beam `#FCCC0C` for the star and selection,
  hairlines `#3A3A48`. They are defined once, in `ColorHelpers.swift`, and every site uses them.
- Card accents stay the five Cardì hexes already in `namedCardHex` (Story 21.2a). Anything that
  cannot resolve takes azure `#0C84CC`, the palette's default, never a system colour.
- Behaviour stays as shipped (sorting, sync, deep links, haptics, `CARD_USED`, symbology, the
  barcode geometry and luminance rules), except the changes the grammar flags: the colours, the
  star, the crown, the 48 target and the 4 gap; and, for a card the crown pages to, its haptic and
  when its `CARD_USED` is sent (decision 3).
- The barcode field stays pure white with true-black bars, nothing overlaid, inside the reserved
  clock strip; its title stays cream (Story 21.3). Beam never appears on the barcode screen.
- Every old value a test pinned is asserted absent, and every new one present, in the existing
  contract suites; each new assertion is seen to fail under its mutation.
- Strings stay ASCII in the watch `.strings` files, as their convention is.

**Never:**

- Commit, push, or change `sprint-status.yaml` or any other tracker file: the orchestrator owns all
  three.
- Touch `targets/watch-widget/` or the complication (Story 23.4), Wear OS (Story 23.3), or the phone
  app.
- Change the clock strip's geometry: the grammar allows that only after a device measurement, and
  this story makes the measurement, not the change.
- Give the crown any action but scrolling (on the barcode screen, scrolling through the cards): it
  never dismisses the barcode, never wraps past either end, and nothing but the crown, and
  VoiceOver's adjust gesture standing in for it, changes the card shown (no tap, no swipe).
- Add a custom typeface, a 0.98 scale, a shadow, a plate behind the star, or a drawn dot in place of
  the picker's checkmark.
- Darken azure: that is the design system's open contrast item, not this story's.

## I/O & Edge-Case Matrix

| Scenario         | Input / State                                      | Expected Output / Behavior                                                                                                                                                                                       | Error Handling                          |
| ---------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| List             | Cards synced                                       | Ink rows on black, 4 apart, 48 tall, radius 14; cream names; a beam star on favourites                                                                                                                           | N/A                                     |
| Branded card     | A catalogue brand with artwork                     | Its logo on its chip, inset as today; the hairline `#3A3A48` where the chip is near black                                                                                                                        | N/A                                     |
| Custom card      | Initials on an accent                              | 12 pt bold initials, ink or cream by the accent's luminance                                                                                                                                                      | N/A                                     |
| Unknown colour   | A key or hex that does not resolve                 | Azure `#0C84CC`                                                                                                                                                                                                  | No system colour                        |
| Empty            | No cards                                           | Glyph cream 50 %, title cream, subtitle cream 60 %                                                                                                                                                               | N/A                                     |
| Unavailable      | Store failed to load                               | The line in cream 60 %                                                                                                                                                                                           | As today                                |
| Sort picker      | Sheet open                                         | Ink rows at least 48 tall; selected: beam label, semibold, beam checkmark; others cream                                                                                                                          | N/A                                     |
| Crown on list    | Rotate                                             | The list scrolls                                                                                                                                                                                                 | N/A                                     |
| Crown on picker  | Rotate                                             | The options scroll                                                                                                                                                                                               | N/A                                     |
| Crown on barcode | One detent onward or back                          | The next or previous card's barcode, in the list's order at opening; its name the title; it slides in from the way the crown turned (a crossfade under Reduce Motion); the crown's detent haptic, not the open's | N/A                                     |
| Crown at an end  | First or last card, turned past                    | The card stays; no wrap (decision 4)                                                                                                                                                                             | N/A                                     |
| Crown, one card  | One reachable card                                 | Nothing; the barcode stays                                                                                                                                                                                       | N/A                                     |
| Order held       | The list re-sorts or syncs while a barcode is open | The crown keeps the order it opened with; a card gone since is skipped                                                                                                                                           | Current card gone: the unavailable line |
| Usage on paging  | The crown pages to a card                          | Its `CARD_USED` once it has stayed 1 s; none if the crown moves on or the screen closes sooner; the opened card's at once, as today (decision 3)                                                                 | N/A                                     |
| Deep link        | A complication tap while a paged barcode shows     | The linked card, as a fresh open                                                                                                                                                                                 | N/A                                     |
| VoiceOver        | Adjust (swipe up or down) on the barcode           | The next or previous card, as the crown                                                                                                                                                                          | N/A                                     |
| Leave barcode    | Swipe from the left, or back chevron               | Back to the list                                                                                                                                                                                                 | N/A                                     |
| Tap on barcode   | A tap on the code or its placeholder               | Nothing; the barcode stays (decision 1)                                                                                                                                                                          | N/A                                     |
| Barcode title    | Any card                                           | Cream, never beam (confirmed on a real watch)                                                                                                                                                                    | N/A                                     |
| Wrist dimmed     | `isLuminanceReduced`, rotated symbol               | As today: the field stays white, the digits hide                                                                                                                                                                 | N/A                                     |

**Decisions (ifero, 2026-10-25):**

1. **A tap no longer leaves the barcode.** Only the swipe from the left and the back chevron do, as
   the grammar's watchOS list names them. All three `.onTapGesture { dismiss() }` go (the image and
   both placeholders), so a stray touch while the code is held to a scanner cannot close it.

**Decisions (ifero, 2026-10-27, renegotiating the crown on the barcode screen):**

2. **The crown scrolls through the cards on the barcode screen** (grammar §8 amended). One card per
   detent, at low sensitivity, never continuous; the turn that scrolls the list onward shows the
   next card. The order is the list's at the moment the barcode opened, held for the visit. Only the
   crown moves it; taps and swipes still do nothing (decision 1 holds).
3. **A card the crown pages to counts as used after 1 s on screen.** The opened card counts at
   once, as today; skimming past cards sends nothing for them.
4. **The crown stops at the first and the last card.** No wrap.
5. **Wear OS pages the same way**, on its rotary input. The grammar records it; Story 23.3 builds it,
   and this story touches no Wear code.

</frozen-after-approval>

## Code Map

- `targets/watch/ColorHelpers.swift` -- `parseHexColor` (bad input → `.gray`), `namedCardHex`
  (`:43-50`: blue `#0C3C84`, red `#E42424`, green `#0C843C`, orange `#FCCC0C`, gray/grey `#0C84CC`),
  `resolvedCardHex`, `mapColor`, the luminance, near-black and white-text helpers, `initials`. No
  ink, cream or `#3A3A48` anywhere in the target; cream only at `BarcodeFlashView.swift:24`.
- `targets/watch/CardListView.swift` -- `CardRowView` (`:289-459`): `HStack(spacing: 10)`, the 5×28
  accent bar (radius 3), the 30 avatar (logo on a white or black chip, inset ≈ 4.39; else initials),
  the name (15 semibold, `.white` `:371`), the star (`star.fill` 13, `.yellow` `:381-382`), fill
  `#1C1C1F` (`:391`), hairline `.white.opacity(0.15)` (`:395`, `:439`), accent fallback `.gray`
  (`:342`), initials `.white`/`.black` (`:456`), `.frame(minHeight: metrics.minimumTapHeight)`
  (`:388`). `CardListView` (`:486-680`): `LazyVStack(spacing: 6)` (`:538`), padding 2 (`:547-548`),
  rows as `NavigationLink` with `.buttonStyle(.plain)` (`:540-543`), the "unavailable" line
  `.white.opacity(0.7)` (`:560`), the empty state (`:630-655`: glyph 48 light `.white.opacity(0.5)`,
  title `.white`, subtitle `.white.opacity(0.6)`), the sort toolbar item (`:567-575`) and sheet
  (`:590-592`). `WatchSortPickerView` (`:687-726`): rows `.frame(minHeight: 44)` (`:713`),
  unselected `Color.white`, selected `Color.accentColor` (already beam) and a `checkmark`.
- `targets/watch/BarcodeFlashView.swift` -- black surround (`:131`), white field radius 8
  (`:219-222`), digits 10 mono (`:180-187`), the tap dismissals (`:173`, `:435`, `:444`), the crown
  dismissal (`:240-253`: `.focusable`, `.digitalCrownRotation`, the latch `abs > 0.01` →
  `crownTriggered = true; dismiss()`), the cream title through `.toolbarForegroundStyle` (`:24`,
  `:260-285`; `.tint` does not reach it).
- `targets/watch/WatchPresentationLayout.swift:41-50` -- `WatchCardRowLayoutMetrics.compact`,
  `minimumTapHeight: 44` (`:49`).
- `targets/watch/Assets.xcassets/AccentColor.colorset` -- already beam (Story 21.3), applied through
  `plugins/with-watch-accent-color.js`; it tints the list's and the sheet's titles.
- **Tests that pin the old values** (`targets/watch/__tests__/`, run by CI's
  `.github/workflows/watchos-tests.yml`, not by `yarn test`):
  - `watch-layout-contract.test.ts`: `minimumTapHeight: 44` (`:639`), `LazyVStack(spacing: 6)`
    (`:642`), the crown and tap dismissal (`:429-432`), the `parseCompactMetrics` regex (`:194`);
    no colour assertions yet. Its size table is `:27-35`.
  - `watch-card-colour-contract.test.ts`: the five row colour properties with `?? .gray`
    (`:146-183`), the `.white.opacity(0.15)` hairline (`:197-203`), the initials body (`:206-211`).
  - `watch-display-luminance-contract.test.ts`: three `.onTapGesture { dismiss() }` and the crown
    latch (`:361-375`).
  - `watch-brand-logo-contract.test.ts`: `star.fill`, the inset formula, the avatar frames.
- `test/watch-accent.test.ts` (in `yarn test`) -- both colorsets beam; the barcode file holds
  `parseHexColor("#F0F0E8")` and the `toolbarForegroundStyle` line, and no ink, no `FCCC0C`.
- `watch-ios/UITests/CardListUITests.swift:118` -- `test_crownRotation_dismissesToList`; no scheme
  runs it.
- `targets/watch/__tests__/swift-source-helpers.ts` -- `describeOnMac`, `swiftDeclaration`,
  `runSwiftProgram` (lift pure Swift into `xcrun swift`).
- Commands: `yarn watch:prebuild` once in a fresh worktree (no `ios/` yet; it changes no tracked
  file), then `yarn watch:build`. The contract suites:
  `npx jest --testPathPattern="$PWD/targets/watch/__tests__" --testPathIgnorePatterns=/node_modules/ --no-coverage`
  (an absolute pattern, or it reaches other worktrees; the ignore override, as CI's
  `watchos-tests.yml` passes it, because `jest.config.js` ignores `targets/watch/` and finds none).
- Design: `cardi-watch-grammar.md` §3.1–§3.2, §4.1–§4.5, §5.1–§5.5, §6, §8, §8.1 and its testing
  section; `frames/cardi-watch-frames.html` (watchOS list, barcode and sort at 40, 46, 49 mm). Its
  line references and "shipped" columns predate Stories 21.2a and 21.3.

**Crown paging (decisions 2–5), on the tree after the first pass:**

- `targets/watch/CardListView.swift` -- `WatchCardRoute(cardId:)` (`:468-470`, private). The
  destination (`:569-579`) looks the route's card up in `displayCards` and shows
  `BarcodeFlashView(card: card)`, else the unavailable line (`:573-577`: `creamSecondary` on
  `ground`, full frame). `displayCards` (`:513-540`) is sorted live by `sortMode`, and re-sorts
  whenever SwiftData or the store changes, including when the phone syncs back usage counts, which
  moves cards under "Frequently used". `openCardRouteIfAvailable` (`:635-643`), the complication's
  deep link, sets `navigationPath = [WatchCardRoute(cardId:)]`: the SAME value when the linked card
  is the one already open, so SwiftUI keeps the existing destination as it is.
- `targets/watch/BarcodeFlashView.swift` -- `.task(id: card.id)` (`:273-278`) plays `.success` and
  calls `WatchSessionManager.shared.recordCardUsed(cardId: card.id)`. The render task after it
  sleeps 120 ms for the `GeometryReader` to settle, so a newly created view shows its placeholder
  for a moment. Three presentations declare `barcode-image` (the image, both placeholders); the
  outer `barcode-view` identifier masks them at runtime (FNF 1), so UI tests find `barcode-view`.
- `targets/watch/WatchSessionManager.swift:81` -- `recordCardUsed` sends `CARD_USED` at once; the
  watch keeps no count of its own (the phone counts and syncs back).
- `targets/watch/WatchPresentationLayout.swift` -- holds the pure presentation policies
  (`WatchBarcodePresentation`, `WatchBarcodeLuminancePresentation`, the layout metrics) that the
  contract suites lift into `xcrun swift` with `swiftDeclaration` and `runSwiftProgram`.
- SwiftUI, verified in the watchOS 26.5 SDK's `SwiftUI.swiftinterface` (deployment target watchOS
  10.0): `digitalCrownRotation(detent:from:through:by:sensitivity:isContinuous:isHapticFeedbackEnabled:onChange:onIdle:)`
  exists with `V: BinaryInteger` (an `Int` index) since watchOS 9; the haptic plays per detent. It
  reaches a view only while that view is focusable and focused, which is how the pre-23.2 latch got
  it (`git show 1ad92b2:targets/watch/BarcodeFlashView.swift`, `.focusable(true)`,
  `.focused($isFocused)`, focus set in `.task`). XCUITest's `rotateDigitalCrown` drove that latch.
- New files under `targets/watch/` join the target without a prebuild: the generated project holds
  `watch` as a `PBXFileSystemSynchronizedRootGroup`.
- Tests that pin "the crown does nothing on the barcode": `watch-layout-contract.test.ts:451-532`
  (`BarcodeFlashView(card: card)` in the list; no `.digitalCrownRotation(`, `@FocusState` or
  `.focusable(` in the barcode file; the target-wide crown-reader scan `toEqual([])`);
  `watch-display-luminance-contract.test.ts:362-388` (no `crownRotation`, `digitalCrownRotation`
  or `isFocused` in the barcode file; `recordCardUsed(cardId: card.id)` present);
  `watch-usage-event-contract.test.ts:84-95` (`recordCardUsed` inside the `.task(id: card.id)`
  slice); `CardListUITests.swift:139` `test_crownRotation_keepsBarcode` (one card's barcode).

## Tasks & Acceptance

**Execution:**

- [x] `targets/watch/ColorHelpers.swift` -- the Cardì watch colours, once (Design Notes); the
      unresolvable fallback to azure.
- [x] `targets/watch/CardListView.swift` -- rows, list, empty state, "unavailable" line and sort
      sheet on those colours; gap 4; picker rows 48; the crown scrolls the list and the picker.
- [x] `targets/watch/WatchPresentationLayout.swift` -- `minimumTapHeight: 48`.
- [x] `targets/watch/BarcodeFlashView.swift` -- remove the crown dismissal and the three tap
      dismissals (decision 1); the title's cream from the shared definition.
- [x] `test/watch-accent.test.ts` -- repoint its cream pin to the shared definition; keep its
      assertions that the barcode file holds no ink and no beam.
- [x] `targets/watch/__tests__/watch-layout-contract.test.ts`, `watch-card-colour-contract.test.ts`,
      `watch-display-luminance-contract.test.ts`, `watch-brand-logo-contract.test.ts` -- invert
      every pin of an old value; add the grammar's compliance assertions (Design Notes).
- [x] `watch-ios/UITests/CardListUITests.swift` -- the crown test expects the barcode to stay.
- [ ] `docs/design/cardi/cardi-watch-grammar.md` -- record what this story applied and the two
      device results (§4.5, §6a); repoint its stale "shipped" notes for watchOS.

**Crown paging (decisions 2–5), added 2026-10-27 on top of the tasks above:**

- [x] `targets/watch/WatchPresentationLayout.swift` -- the pure paging policy (Design Notes, "Crown
      paging"): no SwiftUI, liftable into the Swift harness.
- [x] `targets/watch/BarcodePagerView.swift` (new) -- the barcode route's host: the held order, the
      current card, the crown, the transition, the unavailable line, the VoiceOver adjust action.
- [x] `targets/watch/BarcodeFlashView.swift` -- take the card's arrival (opened or paged); `.success`
      only when opened; a paged card's `CARD_USED` after the delay, in the same `.task(id: card.id)`.
      The file still reads no crown, holds no focus and calls `dismiss()` nowhere.
- [x] `targets/watch/CardListView.swift` -- the destination hosts the pager with the route's card id
      and the live `displayCards`; a deep link always opens a fresh pager.
- [x] Contract suites (`watch-layout-contract`, `watch-display-luminance-contract`,
      `watch-usage-event-contract`, `watch-card-colour-contract`) -- re-point every "the crown does
      nothing" pin to the pager as the target's one crown reader, and add the pins Design Notes
      lists; run the policy through the Swift harness. Each new assertion is seen to fail under its
      mutation.
- [x] `watch-ios/UITests/CardListUITests.swift` -- the crown pages onward and back, stops at the
      last card, and changes nothing with one card; the tap, edge-swipe and chevron tests stay.
- [x] `docs/design/cardi/cardi-watch-grammar.md` -- §8's APPLIED note and the testing section's
      watchOS paragraph say what was built (the barcode pager is the one crown reader). The device
      measurements are the orchestrator's, after the device check.

**Acceptance Criteria:**

- Given the list, the empty state, the sort picker and the barcode screen at 40, 46 and 49 mm, when
  each is shown, then it draws the watchOS frames as Design Notes rule them.
- Given the watch target, when its Swift is searched, then ink, beam, cream and `#3A3A48` are each
  defined once, and no view holds `#1C1C1F`, `.yellow`, `Color.white` text or a system card colour.
- Given a barcode opened from a list of several cards, when the crown turns one detent onward or
  back, then the next or previous card in the list's order at opening shows with its name as the
  title, and at the first or the last card a further turn changes nothing.
- Given a card the crown pages to, when it stays on screen 1 s, then one `CARD_USED` is sent for it;
  when the crown moves on or the screen closes sooner, then none is.
- Given the barcode screen, when it is tapped, or swiped anywhere but from the left edge, then the
  card shown does not change and the screen stays.
- Given VoiceOver on the barcode, when it adjusts up or down, then the card changes as with the
  crown.
- Given a real Apple Watch, when ifero checks the list and a barcode, then the title is cream, the
  clock-strip measurement (§6a) is recorded, and the crown pages one card per deliberate detent.

## Implementation Notes

**Step 3 (2026-10-27).** One context-free implementer derived the change from this spec (~58 min).
Audited against the diff, not its report:

- Tasks 1–7 done. Task 8 (the grammar) records what this story applied and repoints the stale
  watchOS notes; its two device results (§4.5 the title on hardware, §6a the clock strip) are
  written as "pending — ifero's check" and wait for AC4, which only ifero's Apple Watch can settle.
- `ContentView.swift`'s root `.background(Color.black)` also became `WatchColor.ground`, under
  "every site uses them".
- `watch-ios/UITests/CardListUITests.swift` used `XCUIRemote` (the tvOS remote, no rotation); the
  crown is now `XCUIDevice.shared.rotateDigitalCrown`. No scheme runs this file.
- The Verification command for the contract suites lacked `--testPathIgnorePatterns=/node_modules/`
  and found no tests (`jest.config.js` ignores `targets/watch/`); corrected here and in the Code Map
  to CI's form. With it: 8 suites, 153 tests, 0 skipped (the `describeOnMac` Swift harnesses ran).
- The implementer's mutation sweep (`mutate.py` in the session scratchpad): 116 KILLED lines, no
  SURVIVED line, the diff byte-identical before and after (same sha1).
- The 0.4 edge: no 8-bit hex scores luminance exactly 0.4 (all 16.7M checked), so
  `shouldUseWhiteText` (`< 0.4` → cream) and the frames' rule (ink above 0.4) agree on every input.
- Cream initials are lower contrast than white were (azure 4.05 → 3.53:1, red 4.6 → 4.0:1). The
  frozen block mandates cream and forbids darkening azure; recorded, not acted on.

**Baseline comparison (step 3, 40 mm).** The implementer built the baseline commit in a scratch
worktree and drove both builds with the same XCUITest (`rotateDigitalCrown`): on the baseline the
crown on the barcode screen returned to the list (`after crown: onBarcode=false`,
`shots/40base-results.txt`), and the list already scrolled by the crown with no focus modifier (row 1
from y 49 to −74 on +0.5), as did the sort picker's options (from y 47 to 38). The barcode screen, measured again at loop round 1: from the strip down,
0 of 96,876 pixels differ between `40base-barcode.png` and `40new-barcode.png`, and the strip holds
770 exact `#F0F0E8` pixels in both and no beam. The picker's rows measured 44 tall on the baseline
and 48 after.

**Matrix audit.** List, Custom card, Unknown colour, Empty, Unavailable, Sort picker →
`watch-card-colour-contract.test.ts` ("Cardì watch colours", the executed resolver harness) and
`watch-layout-contract.test.ts` (48, 14, gap 4); Branded card → `watch-brand-logo-contract.test.ts`
(chip kept, `#3A3A48` ring); Crown on list / picker / barcode, Leave barcode → the layout suite's
crown-focus and system-ways-back tests; Tap on barcode → the luminance and layout suites (no
`.onTapGesture`, no `dismiss()`); Barcode title → `test/watch-accent.test.ts` (on hardware: AC4);
Wrist dimmed → the unchanged Story 16.26 luminance suite. Behaviour only a device shows (the crown
scrolling, the chevron and swipe) is the DEVICE CHECK's.

**Device check (2026-10-27)**, from the tree after the step 4 patches, on watchOS 26.5 simulators
at 40 mm (SE 3), 46 mm (Series 11) and 49 mm (Ultra 3), driven by a throwaway XCUITest in the
gitignored `ios/` project with 12 seeded cards (every palette key, an unresolvable colour, a dark
brand chip, favourites, a QR card). watchOS renders dark only, so there is no light variant. The live
simulator panel was not available during this run (watch-simulator access not granted); ifero
attached it after the handback and a second pass ran on it (the live panel bullet below).

- Every listed state was shot at each size: the list at rest and after the crown; the sort picker and
  it after the crown; a 1D barcode after the crown both ways and after a tap; a QR placeholder after a
  tap; the list after the back chevron and after an edge swipe; the empty state. Read back against
  `cardi-watch-frames.html`: they draw the frames as the Design Notes rule them.
- Crown: one turn scrolls the list about 261 pt at every size; the picker's options move 21, 28 and
  36 pt. The barcode stays under the crown and a tap; the chevron and the edge swipe return to the
  list at its resting offsets.
- FNF 8, measured in row offsets: the list scrolls after the sheet closes by X and by picking an
  option, and after a barcode pops; a crown turn on the barcode screen leaves the list's offset
  identical; the list scrolls when cards replace the empty state without a relaunch.
- Pixels, identical at all three sizes: row fill `#181824`, names `#F0F0E8`, star `#FCCC0C`, row
  hairline and dark-chip ring `#3A3A48`; initials cream on blue, red, green, grey and the
  unresolvable azure fill, ink on orange; empty glyph `#787874` (cream 50 %), title `#F0F0E8`,
  subtitle `#90908B` (cream 60 %); sort rows ink, unselected cream, selected label and checkmark
  beam; barcode title cream, and no pixel within 60 of beam on any barcode screen.
- Unchecked, no control exists: the "unavailable" line (it needs an open card to vanish from the
  store mid-session) and the dimmed wrist (`isLuminanceReduced`; the simulator cannot force
  Always-On). Unchecked, hardware only: the title on a real watch and the §6a clock-strip scrim
  (AC4, ifero), haptics, real crown detents.
- The paired 46 mm and 49 mm simulators fought seeding (the pairing uninstalled the watch app
  mid-run; stored SwiftData cards outranked the seed), so the 46 mm edge swipe and crown steps and all
  of 49 mm ran on temporary unpaired devices of the same models, since deleted.
- Screenshots and measurements: `shots/dc-40-*`, `dc-46-*`, `dc-49-*` (contact sheets
  `dc-<size>-contact-sheet.png`) in the session scratchpad, outside the repository.
- Live panel pass (2026-10-27, after the handback, with ifero watching): Apple Watch SE 3 (40 mm),
  watchOS 26.5, this tree's `yarn watch:build`, seven seeded cards. The list scrolled under a swipe;
  the sort sheet drew cream rows on ink with the current option and its checkmark in beam, and
  picking Recently added closed it and re-sorted the list; the barcode title was cream with no beam;
  a tap on the bars and one on the white field below kept the barcode; the edge swipe and the back
  chevron each returned to the list at its scroll position. The panel cannot turn the crown, so the
  crown's evidence stays the XCUITest pass above.

**Review loops.**

- Code round 1 (Sonnet): CHANGES_REQUESTED, 3 findings, all verified true, none behavioural. (1) The
  row's own `RoundedRectangle(cornerRadius: metrics.cornerRadius)` (fill and hairline) and the
  star's trailing `Spacer()` were pinned nowhere: added to the layout and colour suites, each failing
  under its mutation (a literal 16 on the fill; the `Spacer()` deleted). (2) The grammar's §4.5 and
  §8 before/after claims had no record here: the baseline comparison above now records them, after
  re-measuring the barcode pair. (3) "Because the list takes the crown's focus" claimed a cause the
  evidence cannot show (the baseline list scrolled without the modifiers): reworded in
  `CardListView.swift` (comment only) and in grammar §8, which now says both lists scrolled before
  by inheritance and that the declaration is what is pinned. No device re-check: the Swift edit is a
  comment.
- Code round 2 (Sonnet): CHANGES_REQUESTED, 3 findings, all verified true. (1) The azure fallback
  `defaultCardAccentRGB` was pinned to `DEFAULT_CARD_COLOR` only in the path-filtered watch suite
  (Wear's twin is always-on): `test/watch-accent.test.ts` now pins it, failing under a changed hex.
  (2) Grammar §4.1 said every view reads `WatchColor`, which the barcode screen deliberately does not:
  its carve-out is now in that sentence. (3) Grammar §8's "both scrolled before" had a record only for
  the list: the picker's baseline measurement (47 → 38) is now in the baseline comparison above and in
  the grammar sentence. No Swift change.
- Code round 3 (Sonnet): APPROVED with zero comments. The code loop converged at 3, 3, 0.
- QA round 1 (Sonnet): CHANGES_REQUESTED, 1 finding, verified true. Every matrix row, AC1–AC3 and
  decision 1 mapped to a test that would fail or a device-check record, but the frozen Never's
  absences of a custom typeface, a 0.98 scale and a shadow were pinned nowhere: a new colour-suite
  test scans the whole target for them, failing under each of the three added to the card row.
  This change to the reviewed diff sends both loops round again.
- Code round 4 (Sonnet): CHANGES_REQUESTED, 2 findings, both verified true. (1) The luminance
  suite's AC1 comment still gave "the crown press that dismisses this screen" as a current reason:
  reworded to the past, comment only. (2) `.agents/skills/native-watchos/SKILL.md:52` still tells
  agents "Exit: Tap screen or crown to return", the opposite of decision 1: an agent-context file,
  so it goes to Found, not fixed (10) rather than being edited here. A repo-wide sweep for other
  stale crown-or-tap dismissal claims found only history (earlier stories' criteria in `epics.md`).
- Code round 5 (Sonnet): CHANGES_REQUESTED, 1 finding, verified true against Story 16.26's record:
  round 4's rewording said a frontmost session "died on the very crown movement", but Apple
  invalidates it on a crown PRESS, while the old dismissal fired on ROTATION. Restated to match
  16.26, comment only.
- Code round 6 (Sonnet): APPROVED with zero comments. The code loop converged at 3, 3, 0, 2, 1, 0.
- QA round 2 (Sonnet): CHANGES_REQUESTED, 1 finding, verified true. The frozen "no crown action but
  scrolling" and grammar §8's "no handler reads the crown anywhere in the target" were pinned in two
  files only: the layout suite now scans every Swift file in the target for a crown reader
  (`digitalCrownRotation`, `onCrownRotate`, WatchKit's crown delegate and sequencer), failing when
  one is added to `ContentView.swift`. Both loops go round again.
- Code round 7 (Sonnet): APPROVED with zero comments.
- QA round 3 (Sonnet): APPROVED with zero comments. Both loops converged: code 3, 3, 0, 2, 1, 0, 0
  (rounds 4–7 re-ran after QA's fixes); QA 1, 1, 0. Every loop fix after the device check edited
  tests, documents or a Swift comment, so no device re-check was needed.

**The first pass's final verification (2026-10-27), on its tree before the crown paging, each
command in full and unpiped:** the watch contract suites 8 suites / 154 tests passed; `yarn watch:build` BUILD SUCCEEDED, its only warnings
the two the baseline build also prints (manual target order; the Stroili artwork, FNF 9);
`yarn typecheck`, `yarn lint` and `yarn format:check` exit 0; `yarn test` 216 suites / 4245 tests
passed.

**Crown paging, step 3 (2026-10-27).** The same context-free implementer built decisions 2–5 on the
first pass's tree (~81 min); nothing was reverted. Audited against the diff, not its report: the
seven crown-paging tasks are done and ticked. Beyond the Design Notes, each found by measurement:

- `WatchBarcodeOnScreen`, a reference the pager hands each card through the environment. The Design
  Note's `Task.isCancelled` check alone came late: SwiftUI cancels a card's `.task` only when its
  exit slide ends, and a closed screen's only when the pop ends (a scratch build with an 8 s delay
  and a 4 s slide sent `CARD_USED` for a card paged away at 5.4 s). The pager moves the reference
  before the slide starts and clears it when `isPresented` turns false, so the usage task checks
  both. The "Usage and haptic" Design Note describes the cancellation check only; this is the
  record of the second.
- `.geometryGroup()` on each card (without it the late-drawn symbol sat at its final position while
  the card slid), `.scrollIndicators(.hidden)` on the crown reader (watchOS drew its crown capsule
  over the field after every turn; `.digitalCrownAccessory(.hidden)` did not hide it), and the clip
  before `.ignoresSafeArea` (the other order cut 2 pt off each side of the field and 19 pt off its
  bottom).
- `CardListUITests` pins A–Z with `-watch.sortMode az`: the simulator had kept another sort, which
  failed the list-scroll test on the pre-pager build too.
- Mutation sweeps over the new pins (logs `mutate3.log` to `mutate8.log` in the session
  scratchpad): 58 and 68 mutations at step 3, 16 for the pass 2 patches, 5 for QA round 4's pins,
  5 for QA round 5's and 7 for QA round 7's, every one KILLED and none SURVIVED; each sweep left the
  Swift sources byte-identical (sha1 before and after).

**Matrix audit, crown paging.** Crown on barcode → `test_crown_pagesOnwardAndBack` and the layout
suite's transition pin; Crown at an end → the Swift harness's clamp and
`test_crown_stopsAtTheLastCard`; Crown, one card → the harness's `pages` and
`test_crown_withOneCard_changesNothing`; Order held → the harness's `reachableIds` and the held-order
pins, the current card gone → the colour suite's unavailable-line pin; Usage on paging → the
harness's `usageDelay`, the usage-event suite's whole-task and on-screen pins; Deep link → the layout
suite's `deepLinkGeneration` pins; VoiceOver → the layout suite's adjust pin (on hardware: FNF 11);
Tap on barcode → `test_tapBarcode_keepsBarcode` (taps and swipes). The contract suites, run here: 8
suites, 165 tests, none skipped. The UI tests ran in the throwaway target only (FNF 3); the DEVICE
CHECK runs them again on the final build.

**Device check, crown paging (2026-10-27)**, from the tree after the pass 2 patches (their Swift
edits are comments only), built with `yarn watch:build`: Apple Watch SE 3 (40 mm, the live panel
open for ifero), Series 11 (46 mm) and Ultra 3 (49 mm) on temporary unpaired devices since deleted,
all watchOS 26.5. Seven seeded cards in A–Z with favourites first (Esselunga★, Libreria Blu★, Bar
Roma, Conad, Farmacia, Mystery Shop (QR), Palestra Verde), driven by a throwaway XCUITest and the
repo's `CardListUITests`. watchOS renders dark only, so there is no light variant.

- Identical at all three sizes: one 0.2 rotation pages one card in the held order (Bar Roma →
  Conad → Farmacia, and back through Conad and Bar Roma to Libreria Blu); turned past the first or
  the last card, the card stays; with one card a ±0.2 and a 1.0 turn change nothing; a tap and a
  swipe up and down keep Bar Roma, and a 0.1 turn after them pages nothing; the edge swipe and the
  chevron return to the list, and the crown scrolls the list after the pop (row 1 from y 49 to −76,
  −62 and −56).
- Usage, read from the app's info-level log against the test's timestamps: the opened card's
  `CARD_USED` at once (about 0.3 s after the tap); each paged card's once, about 1 s after its page;
  a two-detent turn (0.4) from Bar Roma past Conad to Farmacia sent one event, Farmacia's, about
  1 s after it landed, at every size; nothing after the chevron. XCUITest's crown call returns
  about 5 s after it starts, so single detents cannot leave a card within 1 s here; that case and
  the screen closed within 1 s rest on the implementer's slowed scratch build (8 s delay, 4 s
  slide). With the fix, its log (`pager-log.txt` in the session scratchpad, the 12:42 run) shows a
  card paged away after 5.4 s logged "skipped, not on screen" and recorded nothing; a card still
  within its delay when the back chevron closed the screen ("isPresented -> false", 5.3 s into its
  8 s) was cancelled and recorded nothing; and a two-detent turn cancelled the card it
  passed and recorded the one it landed on, 8.45 s after its page (QA round 6).
- The repo's UI tests: 8 of 10 pass at each size, the paging, tap and swipe, one-card, chevron and
  edge-swipe tests among them; the two failures are FNF 1 and 2, as on the baseline.
- Read back against the frames and this spec: the title cream, no beam, no crown indicator over the
  field. Conad shows the placeholder because its seed value fails the EAN-13 check digit; the QR
  card's placeholder and a faint haze at the white field's top-left corner are pre-existing (the
  baseline build's QR placeholder measures identical).
- Unchecked, hardware only: the real crown's detents and haptic and a stray click at a till (AC4),
  VoiceOver's adjust gesture (FNF 11), Always-On wake (FNF 12). Unchecked on the simulator: the
  Reduce Motion crossfade (pinned only), and the complication deep link (`simctl openurl` cannot
  reach a watch app; the implementer's timed scratch build opened a fresh pager on the linked card).
  Also unchecked at runtime: the order held while the list re-sorts or syncs under an open barcode
  (matrix "Order held"). Nothing on the simulator changes the list mid-visit (a sync needs the phone,
  and the sort is chosen on the list screen), so it rests on the `@State` held-order pins and the
  Swift harness's `reachableIds`; on a real watch and phone it goes to ifero with AC4 (open a
  barcode, change a card on the phone, then turn the crown).
- The barcode at rest against the screen before the pager, below the title strip (whose clock
  differs): Esselunga's EAN-13 and the QR card, the pre-pager build's shots (`pshots/pre-open-1`,
  `shots/40new-barcode-qr`, `shots/dc-46-*` and `dc-49-*` from the first pass's device check)
  against this build's (`dc2shots/<size>-open-1` and `-open-6`): 0 differing pixels in all six
  pairs (108,540 and 106,920 at 40 mm, 154,752 and 154,336 at 46 mm, 161,204 and 160,782 at
  49 mm). Grammar §8's "pixel-identical, from the strip down" rests on this (code round 8).
- Screenshots: `dc2shots/` in the session scratchpad, outside the repository (`sheet-40.png`,
  `sheet-46.png`, `sheet-49.png`, `smudge-compare.png`).

**Review loops, crown paging.** The count of nit-only rounds carries over from the first pass's
loops (none was nit-only), and the numbering continues.

- Code round 8 (Sonnet): CHANGES_REQUESTED, 4 findings, all verified true, none behavioural. (1) FNF
  5 was stale: the repin had already fixed the usage suite's slice; marked fixed, and the B16 row
  updated. (2) Grammar §8's "pixel-identical, from the strip down" had no record for the pager
  build: measured in six pairs and recorded in the device check above (0 pixels differ). (3) The
  usage suite's AC1 comment still said "one event per card shown", which decision 3 removed:
  reworded. (4) `pagerDeclaration` had been inserted between `containerModifiers` and its
  docblock: moved above it. Tests and records only; no Swift change, so no device re-check.
- Code round 9 (Sonnet): APPROVED with zero comments. The crown paging's code loop converged at 4, 0.
- QA round 4 (Sonnet): CHANGES_REQUESTED, 3 findings, all verified true. (1) Nothing pinned
  `WatchBarcodeOnScreen` as a class: as a struct it compiles, passes every suite, and lets a card
  frozen in its exit slide count early; the usage suite now pins `final class` and no `struct`. (2)
  The pager's `_currentId` and `_detent` initialisers, `currentCard` and the
  `if let card = currentCard … else` unavailable branch were pinned nowhere: the layout suite now
  pins all four, each failing under its mutation (open on the first card, detent 0, a stand-in card
  in either place). (3) The crown paging's mutation sweeps had no record here, and the first pass's
  final verification read as this tree's: both fixed above, and the final verification is re-run at
  the end. Tests and records only; no Swift change, so no device re-check. Both loops go round
  again.
- Code round 10 (Sonnet): APPROVED with zero comments.
- QA round 5 (Sonnet): CHANGES_REQUESTED, 1 finding, verified true. The matrix's "Custom card" rule
  (ink above luminance 0.4, cream below) had no evidence at the cut-over: every hex the harness
  scores sits far from it (cream up to 0.216, ink from 0.439), so the threshold could drift between
  them with every suite green. The colour suite now runs the two adjacent greys that straddle it
  (`#A9A9A9`, L 0.39676, cream; `#AAAAAA`, L 0.40198, ink), failing under `< 0.25`, `0.3`, `0.39`,
  `0.41` and `0.43`. A test only, so no device re-check. Both loops go round again.
- Code round 11 (Sonnet): APPROVED with zero comments.
- QA round 6 (Sonnet): CHANGES_REQUESTED, 1 finding, verified true. The device-check record named
  the slowed scratch build as the evidence for "none if the crown moves on or the screen closes
  sooner" but recorded only its pre-fix failure, not what the fixed build did: its log's three
  outcomes are now in the device-check bullet. A record in this spec only, outside the reviewed
  diff, so the code loop's round 11 approval stands and only the QA loop goes round again.
- QA round 7 (Sonnet): CHANGES_REQUESTED, 3 findings, all verified true. (1) The AC's "swiped
  anywhere but from the left edge" had evidence for vertical swipes only:
  `test_tapBarcode_keepsBarcode` now also swipes fast left and right from inside the screen. (2)
  `ANY_GESTURE_HANDLER` missed a `Button`, a `NavigationLink`, `.onDrag`, `.swipeActions` and
  `.contextMenu`, and nothing counted the writers of the card shown: the pattern now names them and
  the layout suite pins `currentId`'s one writer, each failing under its mutation. (3) The held
  order under a re-sort had no runtime record: named unchecked above, with why, and to ifero. Round
  6's "3.4 s" was also wrong (the close came 5.3 s into the 8 s delay): corrected. Tests and records
  only; no app change, so no device re-check beyond running the edited UI test: on the 40 mm SE 3,
  `test_tapBarcode_keepsBarcode` (now with the sideways swipes) and `test_edgeSwipe_returnsToList`
  both pass. The seven new mutations each fail (`mutate8.log`).
- **The loops ended here, by ifero's call (2026-10-27).** Shown the trend (code 4, 0, 0, 0; QA 3,
  1, 1, 3, every QA finding since the device check an evidence gap in tests or records, none an app
  defect, and no app code changed since), ifero chose to stop rather than run code round 12 and QA
  round 8 on round 7's fixes. Those fixes were verified as recorded above, and the final
  verification below ran on the tree that holds them.

**Final verification (2026-10-27), on the final tree, each command in full and unpiped:** the watch
contract suites 8 suites / 166 tests passed; `yarn watch:build` BUILD SUCCEEDED, its only warnings
the two the baseline build also prints (manual target order; the Stroili artwork, FNF 9);
`yarn typecheck`, `yarn lint` and `yarn format:check` exit 0; `yarn test` 216 suites / 4245 tests
passed.

### Found, not fixed

Filed on 2026-10-27 as one follow-up issue, ifero/myLoyaltyCards#284 (`backlog`, `needs-triage`),
every item below except 5 and 8; the PR links it without a closing keyword.

1. `BarcodeFlashView`'s outer `.accessibilityIdentifier("barcode-view")` replaces its children's
   `barcode-image` / `barcode-number` identifiers, so `test_tapCard_displaysBarcode` fails (as on
   the baseline). The updated UI tests find the screen by its `BackButton` instead.
2. `test_importSampleCards_buttonAddsCards` fails on the baseline too: the toolbar exposes each
   button three times, so the query matches several elements.
3. No scheme runs `watch-ios/UITests` (nor `watch-ios/Tests`), and several `watch-ios/Tests` cases
   assert nothing (`let _ =`, `XCTAssertNotNil` on a non-optional `Color`; review B7). That now
   includes the crown-paging UI tests (onward and back, the last card, one card, taps and swipes):
   they ran only in this session's throwaway UI-test target, and the usage timing and the deep link
   have no runtime test at all (review 2V3, 2B7); a CI job running watch XCUITests would catch them.
4. `core/schemas/card.ts:70-76` still says watchOS falls back to `.gray` (phone code, out of bounds).
5. (Fixed in this story, by the crown paging's repin.) `watch-usage-event-contract.test.ts` sliced
   to an anchor that did not exist (`indexOf` → -1), so its appearance-task slice ran to the end of
   the file; the task is now sliced brace-matched (`taskBody`). No follow-up needed.
6. Pre-existing cosmetics: favourite names truncate at 40 mm; the DEBUG-only import button overlaps
   the empty-state title; the list's sort toolbar glyph takes the system's white (the frames do not
   draw it).
7. Cream initials on azure (the default and fallback accent) score 3.53:1, where ink would score
   4.34:1; white scored 4.05:1 before (review B3). The frames draw cream on an azure accent and the
   frozen block names azure's contrast the design system's open item, so this story keeps the frames'
   rule; the threshold or azure itself is the design system's call.
8. (Settled, no defect.) Whether the crown still scrolls the list after the sort sheet closes, after
   a barcode pops or when the list replaces the empty state, and whether it moves the hidden list
   from the barcode screen (review B9, E1, E9): the DEVICE CHECK measured all four as correct.
9. `yarn watch:build` warns that `BrandLogo-stroili.imageset` rasterises to a uniform rectangle, so the
   Stroili row shows a bar on a black disc rather than its logo (seen at 49 mm). Pre-existing
   catalogue artwork; also warned on the baseline build.
10. `.agents/skills/native-watchos/SKILL.md:52` still says "Exit: Tap screen or crown to return",
    the behaviour decision 1 and grammar §8 removed; an agent reading it before touching
    `BarcodeFlashView` would be told to restore them. Agent-context file, so flagged here (code
    round 4) rather than edited: it should say the swipe from the left edge or the back chevron.
    Since the crown paging it should also say the crown scrolls through the cards there.
11. (Unverified, medium if real; review 2B4, 2E6.) VoiceOver after an adjust page: `.id(card.id)`
    replaces the adjustable barcode element on every page, so VoiceOver's focus may drop, the next
    adjust may not reach the pager, and the new card may go unannounced. Only VoiceOver on a real
    watch settles it (the simulator runs none). If it drops, restoring focus with
    `@AccessibilityFocusState`, or announcing the new card after the page, is the likely fix.
12. (Unverified, medium if real; review 2E8.) Whether a crown turn that wakes a dimmed barcode screen
    (`isLuminanceReduced`, Always-On) also reaches the pager and pages a card while the code is held
    to a scanner. The simulator cannot force Always-On; a real watch settles it. If it pages,
    detaching the crown reader while the luminance is reduced is the likely fix.
13. Story 23.3's spec (`docs/sprint-artifacts/stories/23-3-wear-os-implementation.md`, its intent,
    Never line and matrix row "Rotary barcode") still says rotary does nothing on the Wear barcode
    screen, where grammar §8 now says it pages the same way (decision 5); so does its
    `BarcodeScreen.kt` task. Its frozen block needs ifero's amendment before 23.3 is built (review
    2B11).

## Spec Change Log

- **2026-10-27, intent change by ifero (review_loop_iteration 1).** During the walkthrough, after the
  handback, ifero asked for the crown to scroll through the cards on the barcode screen, and chose
  the recommended answers: a paged card counts as used after 1 s, the crown stops at both ends, and
  Wear OS pages the same way through Story 23.3. Amended inside the frozen block, with ifero's
  approval: the Problem and the Approach, the Always line on behaviour, the crown's Never line, the
  matrix (the crown-on-barcode row replaced; ends, one card, held order, usage, deep link and
  VoiceOver rows added) and decisions 2–5. Outside it: the Code Map, the tasks, the acceptance
  criteria, Design Notes and Verification; grammar §8 and its Forbidden line carry the ruling. Known
  bad state avoided: a crown that leaves the barcode, or that moves it on any input but its own
  detents. KEEP: everything the first pass built and verified (the colours, the row metrics, the
  list's and the picker's crown focus, the removed tap dismissals, the cream title); this change is
  built on top of that tree, not re-derived, so nothing is reverted.

## Review Triage Log

**Pass 1 (2026-10-27)**: four layers on the step 3 diff (79 kB); 30 findings (the conventions layer reported none), no `intent_gap` or `bad_spec`, so no loopback. 13 patch items sent to the step 3 implementer, which fixed all of them (Swift comments only; no app
behaviour changed) and showed 28 new mutations each failing its test. Re-run after: watch suites 153
passed, `yarn test` 216 suites / 4244 tests, typecheck, lint, format check and `yarn watch:build` all
exit 0 (the build's two warnings are the baseline's).

| #   | Layer            | Location                                         | Claim                                                                                                 | Verdict     | Route                                                  | Evidence                                                                                                                                                     |
| --- | ---------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| B1  | blind            | grammar §8                                       | the grammar still says two dismissals per platform, untrue after decision 1                           | false       | reject                                                 | watchOS keeps its two system exits (swipe, chevron), as the table says; Wear's tap row is Story 23.3's to apply                                              |
| B2  | blind            | luminance suite comment; `CardListUITests.swift` | "still identified" contradicts the masked identifiers; `test_tapCard_displaysBarcode` left failing    | low         | patch (comment); the failing test is FNF 1             | identifiers declared ×3 in source but masked at runtime by `barcode-view`; that test fails on the baseline too                                               |
| B3  | blind            | `CardListView.swift` initials                    | cream lowers contrast: azure 4.05→3.53, red 4.59→4.01, green 4.79→4.18; azure would score 4.34 in ink | medium      | defer (FNF 7); patch the "dark enough" comment         | real, but every watchOS frame draws cream on the azure-like `#0082C3`, and the frozen block names azure's contrast the design system's open item             |
| B4  | blind            | grammar §4.1 note                                | "one beam, from one definition" is untrue                                                             | low         | patch                                                  | `AccentColor.colorset` also holds beam, for the list title                                                                                                   |
| B5  | blind            | `ColorHelpers.swift`                             | azure spelled three times; `0x0C84CC` escapes the once-only check                                     | low         | reject                                                 | the fallback test pins `defaultCardAccentRGB` to `CARD_COLORS[DEFAULT_CARD_COLOR]` and runs on every `ColorHelpers.swift` edit; deriving it adds indirection |
| B6  | blind            | `shouldUseWhiteText` doc                         | still says white and black                                                                            | low         | patch                                                  | its one app caller picks cream or ink; the name stays (the widget's doc and the XCTests cite it)                                                             |
| B7  | blind            | `CardRowHelpersTests.swift`                      | the azure comments are asserted by nothing                                                            | low         | defer (FNF 3)                                          | pre-existing vacuous tests; the diff changed comments only; no scheme runs them                                                                              |
| B8  | blind            | `test_list_showsCards_and_supportsScrolling`     | passes with the crown wired to nothing                                                                | low         | patch                                                  | three seeded rows exist in the tree before any rotation                                                                                                      |
| B9  | blind            | list and barcode focus                           | crown focus after the sheet closes or a barcode pops is unchecked                                     | maybe-false | settled by the DEVICE CHECK: no defect (FNF 8)         | `.defaultFocus` covers the first appearance; whether focus returns needs the simulator                                                                       |
| B10 | blind            | `CardListUITests.swift`                          | no test of the swipe from the left edge                                                               | low         | patch                                                  | one of the two remaining exits                                                                                                                               |
| B11 | blind            | layout suite chevron guard                       | bans two spellings of hiding the bar                                                                  | low         | patch                                                  | `.toolbarVisibility(.hidden` and `.navigationBarHidden(` escape it                                                                                           |
| B12 | blind            | three comment strippers                          | inconsistent; a trailing comment fails an absence spuriously                                          | low         | reject                                                 | a false positive fails loudly, never silently; hoisting the helper is a refactor                                                                             |
| B13 | blind            | colour suite regexes                             | foreground regex single-line; system-colour list narrow; white/black sweep covers one file            | low         | patch (first two); the third is false                  | the sweep's comment scopes it to the file, and white or black elsewhere in the target is only the barcode rule's own values                                  |
| B14 | blind            | `WatchPresentationLayout.swift` comment          | "moved no pixel" is untrue for the sort picker                                                        | low         | patch                                                  | the picker's floor binds: rows grew 44 → 48 (measured by the implementer)                                                                                    |
| B15 | blind            | grammar §4.5, §6(a)                              | "pending" placeholders name nothing that closes them                                                  | low         | patch                                                  | AC4 closes them before merge                                                                                                                                 |
| B16 | blind            | usage-event suite comment                        | describes a haptic the test never asserts                                                             | false       | reject; the slice anchor was FNF 5, fixed in pass 2    | the comment describes the code, whose appearance task does play the haptic                                                                                   |
| B17 | blind            | `core/schemas/card.ts`; complication basis       | still says `.gray`; the complication's fill differs                                                   | low         | card.ts: defer (FNF 4); the complication half is false | the comment claims only the light-text default matches the complication, which it does                                                                       |
| E1  | edge             | `CardListView.swift:547-564`                     | nothing re-asserts `listHasCrown` after the empty state, the sheet or a pop                           | maybe-false | settled by the DEVICE CHECK: no defect (FNF 8)         | as B9                                                                                                                                                        |
| E2  | edge             | `CardListUITests.swift:18-43`                    | the scroll test cannot fail                                                                           | low         | patch                                                  | as B8                                                                                                                                                        |
| E3  | edge             | `CardListUITests.swift:86-87`                    | `test_tapCard_displaysBarcode` waits on an identifier that never exists                               | low         | defer (FNF 1)                                          | fails on the baseline                                                                                                                                        |
| E4  | edge             | `CardListUITests.swift:146-147`                  | `isHittable` read mid-pop                                                                             | low         | patch                                                  | the row may already exist under the pushed screen                                                                                                            |
| E5  | edge             | layout suite crown slices                        | modifiers on any child still pass                                                                     | low         | patch                                                  | the slices span the containers' bodies                                                                                                                       |
| E6  | edge             | layout suite chevron guard                       | other spellings hide the chevron                                                                      | low         | patch                                                  | as B11                                                                                                                                                       |
| E7  | edge             | colour suite scans                               | `Color(white:)`, `.secondary` and kin escape                                                          | low         | patch                                                  | as B13                                                                                                                                                       |
| E8  | edge             | colour suite foreground regex                    | wrapped calls and `.tint(` escape                                                                     | low         | patch                                                  | as B13                                                                                                                                                       |
| E9  | edge             | `BarcodeFlashView.swift` focus removal           | the crown may scroll the hidden list                                                                  | maybe-false | settled by the DEVICE CHECK: no defect (FNF 8)         | the barcode screen no longer holds focus; the list's offset after a pop needs the simulator                                                                  |
| E10 | edge             | `ColorHelpers.swift` beam                        | `#FCCC0C` spelled twice against "defined once"                                                        | false       | reject                                                 | the `orange` accent keeps beam's hex by the frozen "Card accents stay the five Cardì hexes"; the test pins `beam: 2` and names both roles                    |
| V1  | verification-gap | `test/watch-accent.test.ts`                      | ink, ground and hairline token parity runs only on watch paths                                        | medium      | patch                                                  | `jest.config.js` ignores `targets/watch/`; `watchos-tests.yml` paths exclude `tokens/` and `shared/`                                                         |
| V2  | verification-gap | layout suite; `CardListUITests.swift`            | crown scroll: slices too wide, and the UI test cannot see a scroll                                    | low         | patch                                                  | as E5 and B8                                                                                                                                                 |
| V3  | verification-gap | layout suite; `watch-ios/UITests`                | chevron guarded by two spellings; the UI tests never run                                              | low         | patch (guard); the scheme gap is FNF 3                 | as B11                                                                                                                                                       |
| P0  | conventions      | the whole diff                                   | no violations                                                                                         | —           | —                                                      | the touched `__tests__` folder is allow-listed in `scripts/check-no-tests-folders.mjs`                                                                       |

**Pass 2 (2026-10-27, crown paging)**: four layers on the diff since the baseline (148 kB, the first
pass included); 39 findings, no `intent_gap` or `bad_spec`, so no loopback. Nine patch items went to
the step 3 implementer; four entries were deferred (FNF 3, 11, 12, 13), three of them also to ifero.
The implementer fixed all nine: whole-declaration pins on the pager's move logic, wider held-order
and colour patterns, the import, comments and the grammar; 16 new mutations each failed its test,
and the Swift diff's code lines are identical before and after (only comments changed). Re-run
after: watch suites 165 passed, `yarn test` 216 suites / 4245 tests, typecheck, lint, format check
and `yarn watch:build` all exit 0 (its two warnings are the baseline's).

| #    | Layer            | Location                                                    | Claim                                                                                                         | Verdict     | Route                                        | Evidence                                                                                                                                                                                                 |
| ---- | ---------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2P1  | conventions      | `BarcodeFlashView.swift:276`; `ColorHelpers.swift:49`; §4.1 | "the barcode screen reads only cream" is untrue now the pager hosts it; line 276 runs 150 columns             | low         | patch                                        | the pager reads `ground` twice and `creamSecondary`, which the colour suite's own pager test pins                                                                                                        |
| 2P2  | conventions      | colour, usage-event and layout suites                       | comment strippers and Swift-file walks written inline rather than in `swift-source-helpers.ts`                | low         | reject                                       | as B12: an over-strip fails loudly; the helper's header claims the slicing and the `xcrun` plumbing, not these; hoisting them refactors three suites                                                     |
| 2P3  | conventions      | `test/watch-accent.test.ts:5`                               | a relative import across a boundary into `core/`                                                              | low         | patch                                        | `docs/project-context.md`, Import Convention: cross-boundary imports are absolute                                                                                                                        |
| 2V1  | verification-gap | `BarcodePagerView.swift:281`; usage-event suite             | deleting `arrival = .paged` leaves every suite green                                                          | medium      | patch                                        | pre-verified: no pin names the assignment or the `.opened` initialiser, so a regression would count every paged card at once                                                                             |
| 2V2  | verification-gap | `BarcodePagerView.swift:126-131`                            | the detent's re-sync after a card drops out is pinned by nothing                                              | low         | patch                                        | pre-verified: no test names `of: reachable`; without the block the crown skips a card after a mid-visit delete                                                                                           |
| 2V3  | verification-gap | `watch-ios/UITests`; CI                                     | the pager's runtime tests never run                                                                           | low         | defer (FNF 3)                                | no workflow runs `xcodebuild test`; they ran in this session's throwaway UI-test target only                                                                                                             |
| 2V4  | verification-gap | `BarcodePagerView.swift:184-199`                            | VoiceOver's adjust direction is pinned by nothing                                                             | low         | patch                                        | pre-verified: swapping increment and decrement passes every suite; the gesture on hardware is FNF 11                                                                                                     |
| 2V5  | verification-gap | `CardRowHelpersTests.swift:61-75`                           | the azure comments claim more than the assertions see                                                         | low         | carried: defer (FNF 3)                       | carried B7                                                                                                                                                                                               |
| 2B1  | blind            | `CardListView.swift` initials                               | cream falls below 4.5:1 on red, green and azure                                                               | medium      | carried: defer (FNF 7)                       | carried B3                                                                                                                                                                                               |
| 2B2  | blind            | `BarcodeFlashView.swift:75-77, 304-309`                     | "stayed 1 s" is read at one instant: leave a paged card at 0.75–1 s, return before 1 s, and it counts (twice) | low         | reject                                       | real in that window (the outgoing view's task lives through its 0.25 s exit slide and compares card ids, not visits), but both moves must fall in one ~0.25 s window, and the fix adds a per-visit guard |
| 2B3  | blind            | `BarcodePagerView.swift:135-139`                            | an abandoned swipe-back leaves the on-screen card cleared, so a paged card never counts                       | maybe-false | reject                                       | settling it needs `isPresented` observed through an abandoned interactive pop (it may flip only when the pop commits); if real, one missed count, low                                                    |
| 2B4  | blind            | `BarcodePagerView.swift:166-199`                            | VoiceOver focus probably drops after one adjust page, and the new card is not announced                       | maybe-false | defer (FNF 11); to ifero                     | `.id(card.id)` replaces the adjustable element on every page; only VoiceOver on a real watch shows where focus goes; medium if real                                                                      |
| 2B5  | blind            | `CardListUITests.swift:94-102`                              | `test_tapCard_displaysBarcode` contradicts the new identifier note                                            | low         | carried: defer (FNF 1)                       | carried E3: it fails, on the baseline too                                                                                                                                                                |
| 2B6  | blind            | `CardListView.swift` crown focus                            | nothing proves the focus binding is ever true                                                                 | low         | reject                                       | the list scrolls either way (baseline measured); the declaration is what §8 asks for and the suite pins; a runtime probe needs instrumentation                                                           |
| 2B7  | blind            | usage and deep-link rules                                   | no runtime test of either                                                                                     | low         | defer (FNF 3)                                | as 2V3; the usage timing and the deep link were measured on the simulator (Implementation Notes)                                                                                                         |
| 2B8  | blind            | `CardRowHelpersTests.swift`                                 | renamed tests claim the azure fallback and assert nothing                                                     | low         | carried: defer (FNF 3)                       | carried B7                                                                                                                                                                                               |
| 2B9  | blind            | complication and colour suite comments                      | "moved unchanged" hides a colour change                                                                       | low         | patch                                        | white at 70 % on black became cream at 60 % on ground in the first pass                                                                                                                                  |
| 2B10 | blind            | `ColorHelpers.swift` doc; §4.1                              | "the barcode screen reads only cream"                                                                         | low         | patch                                        | as 2P1                                                                                                                                                                                                   |
| 2B11 | blind            | Story 23.3's spec                                           | still says rotary does nothing on the barcode                                                                 | medium      | defer (FNF 13); to ifero                     | another story's frozen block; §8 names the amendment it needs                                                                                                                                            |
| 2B12 | blind            | `epics.md:1161-1163, 1282`; UX spec `:389`                  | describe the retired dismissals and 44 pt rows                                                                | false       | reject                                       | the epics lines are earlier stories' criteria (history, as the first pass's sweep found); rows of 48 satisfy "≥44pt"                                                                                     |
| 2B13 | blind            | §8 APPLIED                                                  | the pending real-watch checks leave out the crown                                                             | low         | patch                                        | AC4 asks for it; the pending markers name only the title and the strip                                                                                                                                   |
| 2B14 | blind            | grammar `:644`                                              | "(decision 1)" cites nothing a reader of the grammar can find                                                 | low         | patch                                        | the decisions live in this story                                                                                                                                                                         |
| 2B15 | blind            | the contract suites                                         | duplicated, inconsistent comment strippers                                                                    | low         | reject                                       | as 2P2                                                                                                                                                                                                   |
| 2B16 | blind            | colour suite `SYSTEM_OR_UNSHARED_COLOUR`                    | misses `UIColor`, `Color(uiColor:)`, `Color(cgColor:)`, `.systemGray`, and white or black in the pager        | low         | patch                                        | a `.background(Color.black)` in the pager passes today                                                                                                                                                   |
| 2B17 | blind            | §8; `BarcodeFlashView.swift:276`                            | §8 APPLIED is an implementation log; new lines overrun the wrap                                               | low         | patch (the wrap); reject (the log)           | the APPLIED notes keep their evidence in this document, the first pass's approved pattern; lines 549, 702 and 840 run 111–129 columns                                                                    |
| 2B18 | blind            | `WatchSortPickerView`                                       | the picker borrows the card row's metrics                                                                     | low         | reject                                       | deliberate: the definition's doc says the picker takes the same floor and measured it binding there                                                                                                      |
| 2B19 | blind            | `WatchBarcodeOnScreen`                                      | relies on unstated main-actor isolation                                                                       | false       | reject                                       | the target builds in Swift 5 mode, and `View` bodies, `.onChange` and `.task` all run on the main actor, so nothing reaches it concurrently                                                              |
| 2E1  | edge             | `BarcodePagerView.swift:255-270`                            | the deferred move may run before the outgoing card re-renders                                                 | maybe-false | reject                                       | filmed correct on a 40 mm with the slide slowed to 4 s; if real, a slide in the wrong direction, low                                                                                                     |
| 2E2  | edge             | `BarcodePagerView.swift:135-139`                            | an abandoned swipe-back                                                                                       | maybe-false | reject                                       | as 2B3                                                                                                                                                                                                   |
| 2E3  | edge             | `BarcodeFlashView.swift:75-77, 304-309`                     | leaving and returning within the exit slide counts early, and twice                                           | low         | reject                                       | as 2B2                                                                                                                                                                                                   |
| 2E4  | edge             | `BarcodePagerView.swift:272-283`                            | returning to a card already counted counts it again                                                           | false       | reject                                       | by design: every arrival that stays 1 s is a use, as every open from the list is (Design Notes: `.paged` for every card after, a return to the opened one included)                                      |
| 2E5  | edge             | `CardListView.swift:578, 642`                               | a complication tap for the card already open, unpaged, plays the open haptic and counts it again              | low         | reject                                       | a complication tap is a deliberate open and now counts as one ("a deep link always opens a fresh pager"); it needs the watch face while the barcode stays open, and the fix adds a branch                |
| 2E6  | edge             | `BarcodePagerView.swift:166-199`                            | VoiceOver focus after a page                                                                                  | maybe-false | defer (FNF 11)                               | as 2B4                                                                                                                                                                                                   |
| 2E7  | edge             | `BarcodePagerView.swift:123-133`                            | a sync and a detent in one update land on shifted positions                                                   | maybe-false | reject                                       | needs a sync in the same update as a detent; if real, one skipped or repeated card, low                                                                                                                  |
| 2E8  | edge             | `BarcodePagerView.swift:212-226`                            | a crown turn that wakes a dimmed (Always-On) barcode may page a card at the till                              | maybe-false | defer (FNF 12); to ifero                     | the simulator cannot force Always-On; medium if real                                                                                                                                                     |
| 2E9  | edge             | `CardListView.swift:567-568`                                | the list's crown focus after the empty state                                                                  | maybe-false | carried: settled by the DEVICE CHECK (FNF 8) | carried E1                                                                                                                                                                                               |
| 2E10 | edge             | layout suite `:599-600`                                     | the held-order pin misses `+=`, a subscript assignment and `.shuffle()`                                       | low         | patch                                        | the patterns name plain assignment and five methods only                                                                                                                                                 |
| 2E11 | edge             | colour suite `:66-73`, `:480`                               | white text and the `UIColor` spellings escape                                                                 | low         | patch                                        | as 2B16                                                                                                                                                                                                  |
| 2E12 | edge             | `BarcodeFlashView.swift:304-309`                            | a card counted before 1 s of continuous dwell                                                                 | low         | reject                                       | as 2B2                                                                                                                                                                                                   |

## Design Notes

The grammar governs; the frames encode it; where they differ, the grammar's prose wins and the
frames are schematic (the sort dot, the strip's cream title on the list).

**Colours** (`ColorHelpers.swift`, one place): an `enum` holding `ground` `#000000`, `ink`
`#181824`, `beam` `#FCCC0C`, `cream` `#F0F0E8`, `creamSecondary` (cream at 0.6) and `hairline`
`#3A3A48`, parsed through `parseHexColor`. `parseHexColor`'s and the row's fallbacks become azure.

**Rows** (§5.3, §4.4, §7.2). Ink fill, radius 14; the name cream; the star beam, no plate, 13,
trailing and centred; the hairline `#3A3A48` wherever it is drawn today; initials ink when the
accent's luminance is above 0.4, otherwise cream (the frames' rule, replacing white and black).
The avatar, logo chip and inset stay. Gap 4. The declared target 48; no pixel moves (the content
is already 48). Presses keep the platform's own feedback.

**List** (§3, §3.2). The title keeps the accent (beam), as Story 21.3 landed it. Empty state: the
48 light glyph cream 50 %, the title cream, the subtitle cream 60 %; spacing as today.

**Sort picker** (§8.1). The native `List` and `checkmark`; rows at least 48, ink on black;
unselected labels cream; the selected label semibold beam with a beam checkmark; the selected trait
stays.

**Barcode** (§6, §4.5). As today, apart from the crown, a paged card's haptic and usage, and the
title's source. `BarcodeFlashView` draws one card and reads no crown: no `.digitalCrownRotation`,
no latch, no focus. The title stays cream through `.toolbarForegroundStyle`, its colour now the
shared cream rather than a second literal. The strip stays; on a real watch ifero checks whether the
clock draws its own scrim over white, and the result is recorded in the grammar, not acted on.

**Crown** (§8). The list's and the picker's scroll views take the crown explicitly (their focus),
and a contract assertion pins it. On the barcode screen the pager below is the target's one crown
reader, and it only scrolls through the cards. Nothing dismisses on the crown.

**Crown paging** (§8, decisions 2–5).

- _Policy_ (`WatchPresentationLayout.swift`, pure Swift): an `enum WatchBarcodeArrival { opened,
paged }`, and static functions for the reachable ids (the held order, minus ids no longer in the
  live cards, in held order), the id at a detent (clamped to the first and the last: no wrap), and
  the usage delay for an arrival (`.zero` when opened, `.seconds(1)` when paged).
- _Host_ (`BarcodePagerView.swift`): takes the opened card's id and the live `displayCards`. It
  holds, in `@State` initialised once, the ids of those cards at opening (the held order), the
  current id and an `Int` detent index. With two or more reachable cards it takes the crown:
  `.focusable()`, a `@FocusState` with `.focused` and `.defaultFocus(…, true)` (also set true on
  appear, as the pre-23.2 latch did), and `.digitalCrownRotation(detent: $index, from: 0, through:
reachable.count - 1, by: 1, sensitivity: .low, isContinuous: false, isHapticFeedbackEnabled:
true)`. With one, it attaches none of them. A detent change makes `reachable[index]` current;
  a change in the reachable list re-syncs the index to the current card's position. No crown
  handler calls `dismiss()`, and no tap or swipe handler is added.
- _Showing a card_: `BarcodeFlashView(card:arrival:)` with `.id(card.id)`, so each card gets its own
  geometry settle, render and `.task`, inside a clipped container. Onward, the new card enters from
  the bottom and the old leaves at the top; back, the reverse; under Reduce Motion, a crossfade.
  About 0.25 s, the move inside `withAnimation`. `arrival` is `.opened` for the opened card until
  the first page, and `.paged` for every card after, including a return to the opened one.
- _Usage and haptic_: in `BarcodeFlashView`'s `.task(id: card.id)`, `.opened` plays `.success` and
  records at once, as today; `.paged` plays nothing (the crown's detent haptic marks it), sleeps the
  policy's delay, and records only if `Task.isCancelled` is still false after it (`try? await
Task.sleep` swallows the cancellation), so paging on or leaving within 1 s sends nothing.
- _Card gone_: when the current id is no longer among the live cards, the pager shows the
  unavailable line, moved here unchanged from the list's destination.
- _VoiceOver_: the barcode element announced with the barcode label is adjustable
  (`.accessibilityAdjustableAction`): increment pages onward, decrement back, through the same
  move as the crown, and clamped the same way.
- _Deep link_: `CardListView` gives the pager an identity that changes on every deep link (a counter
  bumped in `openCardRouteIfAvailable` and applied with `.id`), so a link to the opened card while
  another is paged in shows the linked card as a fresh open.
- _Rejected_: `TabView` with `.tabViewStyle(.verticalPage)`. It pages on any vertical swipe, the
  stray-touch class decision 1 removed; it preloads neighbouring pages, whose `.task` would play
  the open haptic and send `CARD_USED` for cards never seen; and it wraps each barcode in a page
  container the whole-pixel geometry was never measured in.
- _Pins_ (contract suites): the crown-reader scan finds exactly `BarcodePagerView.swift`; the
  pager's crown call with `detent:`, `from: 0`, `by: 1`, `sensitivity: .low`, `isContinuous:
false`, `isHapticFeedbackEnabled: true`, attached only with two or more reachable cards; no
  `dismiss()`, `.onTapGesture` or gesture handler in the pager; `BarcodeFlashView.swift` still
  crown-free and focus-free; `.success` only for `.opened`; `recordCardUsed` inside
  `.task(id: card.id)` after the delay for `.paged`; the policy's clamping, reachable order and
  delays run in the Swift harness; the unavailable line keeps `creamSecondary` on `ground`; the
  pager holds no colour literal, no ink and no beam.

**Compliance assertions** (the grammar's testing section), in the suites above: `#181824`,
`F0F0E8`, `3A3A48` and the five accent hexes present; `1C1C1F`, `F59E0B`, `FFCC00`, `.yellow`,
`Color.white` in a row or label, `Color.blue/.red/.green/.orange/.gray` absent; no `dismiss()` in
any crown handler, and no `.onTapGesture { dismiss() }` in `BarcodeFlashView.swift` (decision 1); a crown modifier on the list; `minimumTapHeight: 48`; radius 14; spacing 4.

## Verification

**Commands:**

- `npx jest --testPathPattern="$PWD/targets/watch/__tests__" --testPathIgnorePatterns=/node_modules/ --no-coverage` -- expected: all pass.
- `yarn watch:build` (after `yarn watch:prebuild` in a fresh worktree) -- expected: builds; no new
  deprecation warnings in the log.
- `yarn typecheck`, `yarn lint`, `yarn format:check`, `yarn test` -- expected: all pass
  (`test/watch-accent.test.ts` included).

**Manual checks (if no CLI):**

- On the watch simulator at 40, 46 and 49 mm: the list with branded, custom and favourite cards,
  the empty state, the sort picker, a barcode; the crown on each, and on the barcode onward, back,
  past both ends and with a single card.
- On a real Apple Watch (ifero): the same, plus the barcode title's colour, the §6a clock-strip
  measurement, and whether a stray click of the crown pages.

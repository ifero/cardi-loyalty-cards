---
title: 'Story 23.2: watchOS implementation — the list, the barcode and the sort picker on the watch grammar'
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

**Problem:** The watchOS app still paints its pre-Cardì chrome. Rows are filled `#1C1C1F` with white
names and white hairlines; the favourite star is system yellow; the empty state, the sort sheet and
the "unavailable" line are white at assorted opacities; rows sit 6 apart; the row declares a 44
target it never uses. Every colour is a literal at its call site, with no definition for the target.
The Digital Crown dismisses the barcode screen, and nothing wires it to scroll the list. The watch
grammar (`docs/design/cardi/cardi-watch-grammar.md`, Story 23.1) has settled each of these.

**Approach:** Define the Cardì watch colours once for the target and apply the grammar to
`CardListView` (rows, list, empty state), `WatchSortPickerView` and `BarcodeFlashView`. The crown
scrolls the list and the picker and does nothing on the barcode screen. Invert the contract tests
that pin the old values and add the grammar's compliance assertions. Verify on the simulator at
40, 46 and 49 mm, then on a real Apple Watch, where the grammar's two device checks are made.

## Boundaries & Constraints

**Always:**

- The values are the grammar's (Design Notes): ground `#000000`, rows and sheets ink `#181824`,
  text cream `#F0F0E8`, secondary text cream at 60 %, beam `#FCCC0C` for the star and selection,
  hairlines `#3A3A48`. They are defined once, in `ColorHelpers.swift`, and every site uses them.
- Card accents stay the five Cardì hexes already in `namedCardHex` (Story 21.2a). Anything that
  cannot resolve takes azure `#0C84CC`, the palette's default, never a system colour.
- Behaviour stays as shipped (sorting, sync, deep links, haptics, `CARD_USED`, symbology, the
  barcode geometry and luminance rules), except the changes the grammar flags: the colours, the
  star, the crown, the 48 target and the 4 gap.
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
- Give the crown any action but scrolling; add a custom typeface, a 0.98 scale, a shadow, a plate
  behind the star, or a drawn dot in place of the picker's checkmark.
- Darken azure: that is the design system's open contrast item, not this story's.

## I/O & Edge-Case Matrix

| Scenario         | Input / State                        | Expected Output / Behavior                                                                | Error Handling   |
| ---------------- | ------------------------------------ | ----------------------------------------------------------------------------------------- | ---------------- |
| List             | Cards synced                         | Ink rows on black, 4 apart, 48 tall, radius 14; cream names; a beam star on favourites    | N/A              |
| Branded card     | A catalogue brand with artwork       | Its logo on its chip, inset as today; the hairline `#3A3A48` where the chip is near black | N/A              |
| Custom card      | Initials on an accent                | 12 pt bold initials, ink or cream by the accent's luminance                               | N/A              |
| Unknown colour   | A key or hex that does not resolve   | Azure `#0C84CC`                                                                           | No system colour |
| Empty            | No cards                             | Glyph cream 50 %, title cream, subtitle cream 60 %                                        | N/A              |
| Unavailable      | Store failed to load                 | The line in cream 60 %                                                                    | As today         |
| Sort picker      | Sheet open                           | Ink rows at least 48 tall; selected: beam label, semibold, beam checkmark; others cream   | N/A              |
| Crown on list    | Rotate                               | The list scrolls                                                                          | N/A              |
| Crown on picker  | Rotate                               | The options scroll                                                                        | N/A              |
| Crown on barcode | Rotate                               | Nothing; the barcode stays                                                                | N/A              |
| Leave barcode    | Swipe from the left, or back chevron | Back to the list                                                                          | N/A              |
| Tap on barcode   | A tap on the code or its placeholder | Nothing; the barcode stays (decision 1)                                                   | N/A              |
| Barcode title    | Any card                             | Cream, never beam (confirmed on a real watch)                                             | N/A              |
| Wrist dimmed     | `isLuminanceReduced`, rotated symbol | As today: the field stays white, the digits hide                                          | N/A              |

**Decisions (ifero, 2026-10-25):**

1. **A tap no longer leaves the barcode.** Only the swipe from the left and the back chevron do, as
   the grammar's watchOS list names them. All three `.onTapGesture { dismiss() }` go (the image and
   both placeholders), so a stray touch while the code is held to a scanner cannot close it.

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
  `npx jest --testPathPattern="$PWD/targets/watch/__tests__" --no-coverage` (an absolute pattern,
  or it reaches other worktrees).
- Design: `cardi-watch-grammar.md` §3.1–§3.2, §4.1–§4.5, §5.1–§5.5, §6, §8, §8.1 and its testing
  section; `frames/cardi-watch-frames.html` (watchOS list, barcode and sort at 40, 46, 49 mm). Its
  line references and "shipped" columns predate Stories 21.2a and 21.3.

## Tasks & Acceptance

**Execution:**

- [ ] `targets/watch/ColorHelpers.swift` -- the Cardì watch colours, once (Design Notes); the
      unresolvable fallback to azure.
- [ ] `targets/watch/CardListView.swift` -- rows, list, empty state, "unavailable" line and sort
      sheet on those colours; gap 4; picker rows 48; the crown scrolls the list and the picker.
- [ ] `targets/watch/WatchPresentationLayout.swift` -- `minimumTapHeight: 48`.
- [ ] `targets/watch/BarcodeFlashView.swift` -- remove the crown dismissal and the three tap
      dismissals (decision 1); the title's cream from the shared definition.
- [ ] `test/watch-accent.test.ts` -- repoint its cream pin to the shared definition; keep its
      assertions that the barcode file holds no ink and no beam.
- [ ] `targets/watch/__tests__/watch-layout-contract.test.ts`, `watch-card-colour-contract.test.ts`,
      `watch-display-luminance-contract.test.ts`, `watch-brand-logo-contract.test.ts` -- invert
      every pin of an old value; add the grammar's compliance assertions (Design Notes).
- [ ] `watch-ios/UITests/CardListUITests.swift` -- the crown test expects the barcode to stay.
- [ ] `docs/design/cardi/cardi-watch-grammar.md` -- record what this story applied and the two
      device results (§4.5, §6a); repoint its stale "shipped" notes for watchOS.

**Acceptance Criteria:**

- Given the list, the empty state, the sort picker and the barcode screen at 40, 46 and 49 mm, when
  each is shown, then it draws the watchOS frames as Design Notes rule them.
- Given the watch target, when its Swift is searched, then ink, beam, cream and `#3A3A48` are each
  defined once, and no view holds `#1C1C1F`, `.yellow`, `Color.white` text or a system card colour.
- Given the barcode screen, when the crown turns, then it stays.
- Given a real Apple Watch, when ifero checks the list and a barcode, then the title is cream and the
  clock-strip measurement (§6a) is recorded.

## Implementation Notes

## Spec Change Log

## Review Triage Log

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

**Barcode** (§6, §4.5). As today, apart from the crown and the title's source. The crown does
nothing here: no `.digitalCrownRotation` and no latch. The title stays cream through
`.toolbarForegroundStyle`, its colour now the shared cream rather than a second literal. The strip stays; on a real watch ifero checks whether the
clock draws its own scrim over white, and the result is recorded in the grammar, not acted on.

**Crown** (§8). The list's and the picker's scroll views take the crown explicitly (their focus),
and a contract assertion pins it. No handler acts.

**Compliance assertions** (the grammar's testing section), in the suites above: `#181824`,
`F0F0E8`, `3A3A48` and the five accent hexes present; `1C1C1F`, `F59E0B`, `FFCC00`, `.yellow`,
`Color.white` in a row or label, `Color.blue/.red/.green/.orange/.gray` absent; no `dismiss()` in
any crown handler, and no `.onTapGesture { dismiss() }` in `BarcodeFlashView.swift` (decision 1); a crown modifier on the list; `minimumTapHeight: 48`; radius 14; spacing 4.

## Verification

**Commands:**

- `npx jest --testPathPattern="$PWD/targets/watch/__tests__" --no-coverage` -- expected: all pass.
- `yarn watch:build` (after `yarn watch:prebuild` in a fresh worktree) -- expected: builds; no new
  deprecation warnings in the log.
- `yarn typecheck`, `yarn lint`, `yarn format:check`, `yarn test` -- expected: all pass
  (`test/watch-accent.test.ts` included).

**Manual checks (if no CLI):**

- On the watch simulator at 40, 46 and 49 mm: the list with branded, custom and favourite cards,
  the empty state, the sort picker, a barcode; the crown on each.
- On a real Apple Watch (ifero): the same, plus the barcode title's colour and the §6a clock-strip
  measurement.

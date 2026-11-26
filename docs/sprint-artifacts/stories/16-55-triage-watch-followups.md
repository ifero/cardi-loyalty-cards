---
baseline_commit: '4bbfcbd1cd08640a3a80b08f6614744ee6cb8aac'
title: 'The watch follow-ups: no CI runs the watch tests, the barcode UI tests fail on the baseline, and the agent-context file still says the tap dismisses the barcode'
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

**Problem:** Story 23.2 (the watchOS list, barcode and sort picker on the Cardì grammar) left twelve items behind. Two are closed. The most consequential of the ten open ones is that **nothing runs the watch tests**: `package.json`'s `watch:build:ci` is an `xcodebuild ... build`, not a test, and the CI job that runs it therefore proves the watch compiles and nothing else. The crown-paging UI tests, the usage-timing tests and the complication deep-link test have never run in CI. And two of the UI tests that do exist **fail on the baseline** -- `test_tapCard_displaysBarcode` (the outer `barcode-view` identifier replaces the children's) and `test_importSampleCards_buttonAddsCards` (the toolbar exposes the button more than once) -- so they would go red the moment a harness ran them.

The rest are stale documentation and small watch defects: the `native-watchos` skill still tells an agent that a tap dismisses the barcode (which Story 23.2's decision 1 removed), `core/schemas/card.ts`'s comment says watchOS falls back to grey when it has fallen back to azure since, the Stroili brand logo rasterises to a flat rectangle, and three cosmetic issues remain on the watch.

**Approach:** Get the watch tests into CI, starting by making the two failing tests pass -- a red suite is worse than no suite. Then correct the two stale documents and the three cosmetics. The two items that need a real Apple Watch (the VoiceOver focus after an adjust page, and the crown waking a dimmed barcode screen) are recorded as device-dependent and left open with that note.

**Decisions (pending ifero's approval):**

- **The watch unit tests run in CI before the UI tests.** `watch-ios/Tests` is a plain XCTest bundle and can run on the simulator without a UI-test scheme; the UI tests need a scheme and a longer runner, so they are a second step.
- **The two failing UI tests are fixed, not skipped.** A skipped test is a silent hole; both failures have a known cause and a known fix.
- **The agent-context skill file is corrected**, because an agent that reads it before touching `BarcodeFlashView` would restore the dismissals Story 23.2 removed.

## Boundaries & Constraints

**Always:** The watch's visual design is unchanged -- the Cardì grammar and the frames are the reference. The watch CI job keeps its existing catalogue checks (`yarn check:catalogue-generated`) and the Jest contract tests (`targets/watch/__tests__`), and the new test steps are added alongside them. The identifier changes fix the accessibility tree so the children are addressable, which is a correctness fix, not a test-only change.

**Never:** Change the crown's paging behaviour, the barcode's geometry, or the watch's colour resolution. Disable or skip a test to get a green board. Change the watch's deployment target or the build script's flags. Touch the Wear OS app (a separate target with its own build). Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario                    | Input / State                                            | Expected Output / Behavior                                                   | Error Handling              |
| --------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------- |
| PR to `main`                | The watch source changed                                 | The watch unit tests run and pass                                            | The job fails on a red test |
| PR to `main`                | The watch source changed                                 | The watch UI tests run and pass                                              | The job fails on a red test |
| Barcode screen              | A screen reader or the UI test looks for `barcode-image` | The image is addressable, not hidden behind the parent's identifier          | N/A                         |
| Empty state                 | The DEBUG import button is present                       | The UI test finds exactly one such button                                    | N/A                         |
| An agent reads the skill    | Before touching `BarcodeFlashView`                       | It is told the swipe or the back chevron dismisses, and that the crown pages | N/A                         |
| An unresolvable card colour | The card's colour cannot be resolved                     | The watch uses the azure fallback, and the schema's comment says so          | N/A                         |
| The Stroili row             | The catalogue row renders                                | The brand's own logo renders, not a flat rectangle                           | N/A                         |

</frozen-after-approval>

## Code Map

- `package.json:47` -- `"watch:build:ci": "xcodebuild -project ios/Cardi.xcodeproj -target watch -configuration Debug -sdk watchsimulator COMPILER_INDEX_STORE_ENABLE=NO build"` -- a build, not a test. `:38` -- `"test:watchos": "yarn watch:build"`, which also only builds.
- `.github/workflows/watchos-tests.yml:142-143` -- the Jest catalogue tests (`--testPathPattern='targets/watch/__tests__'`); `:156-158` -- `yarn check:catalogue-generated`; `:163` -- the build step. Nothing invokes `xcodebuild test`.
- `watch-ios/Tests/` -- `BarcodeGeneratorTests.swift` (31 tests, all meaningful), `CardRowHelpersTests.swift` (which contains the hollow ones), `CardStoreTests.swift`.
- `watch-ios/UITests/CardListUITests.swift` -- `test_emptyState_showsMessage` (`:10`), `test_list_showsCards_and_supportsScrolling` (`:18`), `test_importSampleCards_buttonAddsCards` (`:61`), `test_tapCard_displaysBarcode` (`:77`), `test_tapBarcode_keepsBarcode` (`:161`), `test_crown_pagesOnwardAndBack` (`:194`), `test_crown_stopsAtTheLastCard` (`:212`), `test_crown_withOneCard_changesNothing` (`:227`), `test_backChevron_returnsToList` (`:242`), `test_edgeSwipe_returnsToList` (`:251`).
- `watch-ios/UITests/CardListUITests.swift:94-104` -- the failing `test_tapCard_displaysBarcode`: it looks for `app.otherElements["barcode-view"]` **and** `app.images["barcode-image"]`; `targets/watch/BarcodeFlashView.swift:288` puts `.accessibilityIdentifier("barcode-view")` on the outer view, which contains `:182` `"barcode-image"` and `:222` `"barcode-number"` -- the outer identifier replaces the children's.
- `watch-ios/UITests/CardListUITests.swift:66` -- the failing `test_importSampleCards_buttonAddsCards`: `app.buttons["import-sample-cards"]`; `targets/watch/CardListView.swift:683-686` puts that identifier on the DEBUG toolbar button, in a `ToolbarItem(placement: .topBarLeading)` alongside the sort button (`:670-673`).
- `watch-ios/Tests/CardRowHelpersTests.swift:72,77,200` -- `XCTAssertNotNil(color)` on a non-optional `Color`; `:82,87,91,96` -- `let _ = parseHexColor(...)`, four tests that assert nothing.
- `.agents/skills/native-watchos/SKILL.md:52` -- _"**Exit**: Tap screen or crown to return."_ -- Story 23.2's decision 1 made a tap no longer dismiss the barcode, and the crown now pages.
- `core/schemas/card.ts:71-77` -- _"⚠️ watchOS does NOT yet agree … `CardListView` resolves `mapColor(hex:) ?? .gray`"_ -- the code moved on: `targets/watch/CardListView.swift:343-345` resolves to the azure default.
- `targets/watch/Assets.xcassets/BrandLogo-stroili.imageset/brand-logo-stroili@2x.png` -- 128x43 RGBA whose inflated scanline data holds only six distinct byte values: a flat rectangle. The same asset is duplicated in `targets/watch-widget/Assets.xcassets/BrandLogo-stroili.imageset/`. The source vector is `assets/images/brands/stroili.svg`.
- `targets/watch/CardListView.swift:670-673` -- the sort `Image(systemName: "arrow.up.arrow.down")` carries no `foregroundStyle`, so it takes the system's white; `:683-686` -- the DEBUG import button shares the leading toolbar slot.
- `targets/watch/BarcodePagerView.swift:172` -- `.id(card.id)` re-keys each page, with no `@AccessibilityFocusState` and no announcement (the VoiceOver item).
- `targets/watch/BarcodeFlashView.swift` -- the luminance-reduced path; the crown reader is not detached while the display is dim (the Always-On item).
- `docs/design/cardi/cardi-design-system.md:281,290` -- the azure contrast table: white 4.05:1, ink 4.34:1.
- Do not change: the crown's paging, the barcode geometry, `targets/watch/ColorHelpers.swift`'s palette rules, the Wear OS app.

## Tasks & Acceptance

**Execution:**

- [ ] `package.json` -- a `watch:test` script that runs the watch unit tests on the simulator (`xcodebuild test` against the watch test target), separate from `watch:build:ci`.
- [ ] `.github/workflows/watchos-tests.yml` -- a step that runs the watch unit tests, and a step that runs the watch UI tests; both after the existing catalogue checks, so a failing test is the last thing that fails.
- [ ] `targets/watch/BarcodeFlashView.swift` -- the `barcode-image` and `barcode-number` identifiers stay addressable (the outer `barcode-view` no longer replaces them), so the UI test can find the image.
- [ ] `watch-ios/UITests/CardListUITests.swift` -- `test_tapCard_displaysBarcode` passes against the fixed identifiers; `test_importSampleCards_buttonAddsCards` finds exactly one import button (the query is disambiguated, or the toolbar exposes it once).
- [ ] `watch-ios/Tests/CardRowHelpersTests.swift` -- the four `let _ =` tests and the `XCTAssertNotNil` on a non-optional `Color` become real assertions.
- [ ] `.agents/skills/native-watchos/SKILL.md:52` -- the exit rule says the swipe from the left edge or the back chevron, and the crown pages through the cards on the barcode screen.
- [ ] `core/schemas/card.ts:71-77` -- the comment describes the azure fallback the watch actually uses.
- [ ] `targets/watch/Assets.xcassets/BrandLogo-stroili.imageset/` -- the Stroili logo rasterises to the brand's mark, not a flat rectangle; the widget's copy is regenerated with it.
- [ ] `targets/watch/CardListView.swift` -- the sort glyph takes the theme's colour instead of the system's white; the DEBUG import button does not overlap the empty-state title; a favourite's name is not truncated at 40 mm.
- [ ] `yarn lint`, `yarn typecheck`, `yarn test` -- green.

**Acceptance Criteria:**

- Given a pull request that changes the watch source, when CI runs, then the watch unit tests run and pass -- not only a build.
- Given the same pull request, when CI runs, then the watch UI tests run and pass.
- Given the barcode screen, when the UI test looks for `barcode-image`, then it finds it.
- Given the empty state, when the UI test looks for the import button, then it finds exactly one.
- Given `watch-ios/Tests`, when it runs, then every test in it asserts something.
- Given an agent reading `.agents/skills/native-watchos/SKILL.md`, when it plans a change to the barcode screen, then it is told that the swipe or the back chevron dismisses and that the crown pages -- not that a tap dismisses.
- Given `core/schemas/card.ts`, when it is read, then its comment matches what the watch does with an unresolvable colour.
- Given the Stroili row on the watch, when it renders, then the brand's logo renders.

## Design Notes

The watch is the one target in this repository with no test gate at all. Everything else -- the phone's Jest suite, the Wear OS unit tests, the Fastfile tests, the design-frame checker, the token and icon checkers -- runs in CI. The watch compiles in CI and nothing more, which means a change to the crown's paging or the barcode's geometry can pass every gate and still be wrong. That is the same failure class the repository already fixed for Wear OS (16.43: "Android lint never runs in CI").

The two failing UI tests are the reason the harness was never wired up: they have failed since Story 23.2 was merged, because the story changed the view's accessibility tree and the tests were not updated with it. Fixing them is the precondition for the rest.

The agent-context file matters more than its size suggests. `.agents/skills/native-watchos/SKILL.md` is what an agent reads before touching the watch; a line that says "tap to dismiss" is an instruction to restore a behaviour Story 23.2 deliberately removed, and an agent that follows it would undo the decision.

## Implementation Notes

- Source issue: #284 (items 1, 2, 4, 5, 6, 8, 9, 10, 11).
- #284 item 3 is **closed**: `docs/sprint-artifacts/stories/23-3-wear-os-implementation.md` was amended before it
  was built -- `:29`, the matrix row at `:85` and decision 4 at `:111` all describe rotary paging on the Wear
  barcode screen, and Story 23.3 merged as `7f5cbb7 feat(watch): the Cardì watch grammar and rotary paging on
Wear OS (Story 23.3) (#286)`.
- #284 items 1 and 2 need a **real Apple Watch**: the simulator runs no VoiceOver and cannot force Always-On.
  They are recorded here as open and device-dependent, not as tasks this story can close.
- The watch UI tests need a shared scheme. `.github/workflows/watchos-tests.yml:94-95` records that no
  shared `watch` scheme exists (only `Cardi.xcscheme` is shared), so `xcodebuild` autocreates one in
  `-target` mode. A test step needs a scheme it can name, so the scheme work is part of the task.
- `watch-ios/Tests/BarcodeGeneratorTests.swift` is meaningful and needs no change: 31 tests, including the
  reference-symbol comparisons from Story 16.28.
- The Stroili asset is generated from `assets/images/brands/stroili.svg` by the catalogue generator
  (`scripts/generate-wear-catalogue.mjs`, gated by `yarn wear:catalogue:check`), so the fix belongs in the
  source vector or in the generator, and the generated assets are refreshed by the same command.
- `targets/watch/CardListView.swift:670-673` -- the sort `Image` has no `foregroundStyle`; the watch theme has
  a cream and an ink, so the fix is a theme colour rather than a literal.
- The azure contrast item (#284 item 7) is a **design decision** recorded in
  `docs/design/cardi/cardi-design-system.md:281,290`, not a code defect: the watch keeps the frames' rule
  (cream on azure), which scores 4.05:1 where ink would score 4.34:1. It is left for ifero's ruling and is
  not part of this story's scope.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors
- `yarn lint` -- expected: no errors
- `yarn format:check` -- expected: clean
- `yarn test` -- expected: all suites pass
- `yarn wear:catalogue:check` -- expected: the generated catalogue matches its source
- `yarn watch:test` -- expected: the watch unit tests pass on the simulator
- `yarn watch:uitest` -- expected: the watch UI tests pass on the simulator

**Manual checks (if no CLI):**

- On an Apple Watch (not the simulator): crown a dimmed barcode screen and confirm it does not page; VoiceOver
  a page change and confirm the new card is announced.

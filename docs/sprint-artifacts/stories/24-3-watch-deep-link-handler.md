---
title: 'Watch deep-link handler'
type: 'bugfix'
created: '2026-11-04'
status: 'done'
baseline_commit: 'c5cce6fd4429229e85f4ee72d427bc772c60593f'
route: 'dispatch'
review_loop_iteration: 1
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
  - '{project-root}/docs/design/cardi/cardi-watch-grammar.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Two cases in the Apple Watch app's deep-link handling go wrong.

- `CardListView`'s `.onOpenURL` ignores `cardi://watch`, the URL the no-card and circular complications open. So with the app suspended on a barcode, a tap on those faces brings the barcode back instead of the card list (23.4 SD1).
- A link to a card the watch does not hold yet parks its id in `pendingDeepLinkCardId`, and nothing clears it. If that card arrives later, its barcode opens on its own, even if the user has moved on in the meantime (23.4 SR4).

**Approach:**

- Parse both routes in one place: `cardi://watch` means the list, and `cardi://watch-card?id=<id>` means that card.
- On the list route, pop to the list and drop any parked id.
- Drop a parked id whenever the user navigates in any other way.
- Close the sort sheet on any deep link, so the route is not pushed underneath it (23.4 SR5).
- Put the decision logic in a pure value type, so the macOS contract harness can execute it.

## Boundaries & Constraints

**Always:**

- **Unchanged behaviour:** a link to a held card opens its barcode as a fresh pager, keeping the `deepLinkGeneration` identity bump.
- **Late cards:** a link to a card not yet held still waits for that id, but only until the next deep link or the next navigation by the user.
- Parsing stays case-insensitive on scheme and host and trims the id, as today.
- The crown and focus rules of the watch grammar (§8) are untouched.

**Never:**

- Edit the widget, `ComplicationProvider`, the phone app or the URL shapes.
- Add routes.
- Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario                      | Input / State                                      | Expected Output / Behavior                     | Error Handling |
| ----------------------------- | -------------------------------------------------- | ---------------------------------------------- | -------------- |
| List link on a barcode        | `cardi://watch`, path = [card A]                   | Path empty (the list), parked id cleared       | N/A            |
| List link on the list         | `cardi://watch`, path empty                        | Stays on the list, parked id cleared           | N/A            |
| Card link, card held          | `cardi://watch-card?id=A`, A held                  | Path = [A], generation bumped, nothing parked  | N/A            |
| Card link, card missing       | `…?id=Z`, Z not held                               | Path unchanged, Z parked                       | N/A            |
| Late card arrives             | Z parked, then Z syncs in                          | Path = [Z], parked cleared                     | N/A            |
| User navigates first          | Z parked, user opens B or pops back                | Parked cleared; Z arriving later opens nothing | N/A            |
| Deep link over the sort sheet | Any valid link, sheet open                         | Sheet closes, then the route applies           | N/A            |
| Unknown URL                   | `cardi://other`, `https://…`, card link with no id | Ignored, state unchanged                       | N/A            |

</frozen-after-approval>

## Code Map

- `targets/watch/CardListView.swift:469-492` -- `WatchCardRoute`, `WatchComplicationDeepLink.cardId(from:)`. Extend it, or replace it with a route parser returning list, card(id) or nil.
- `targets/watch/CardListView.swift:498-502` -- `navigationPath`, `pendingDeepLinkCardId`, `deepLinkGeneration`. Also the `showSortSheet` state.
- `targets/watch/CardListView.swift:620-645` -- `.onOpenURL`, `.onChange(of: displayCards.map(\.id))`, `openCardRouteIfAvailable`. The fix lives here. Distinguish user navigation from deep-link navigation; one way is to clear the parked id in `.onChange(of: navigationPath)` when the change was not made by the router.
- **Every user navigation, not only the path.** The user navigates in three places, and each one drops a parked id: (1) a `navigationPath` change the router did not make (a row tapped, a barcode popped); (2) the sort sheet opening (`showSortSheet` becoming `true`, set at `CardListView.swift:657`); (3) a page the user turns in the barcode pager. Give the routing type one transition for (2) and (3) that only drops the parked id.
- `targets/watch/BarcodePagerView.swift:51-86,271-281` -- the pager's `init` and `showCardAtDetent()`, the one place a page is turned (crown and VoiceOver both reach it). Add an `onPage` closure parameter with a default of `{}`, called from `showCardAtDetent()` after the guard, so the list hears a turned page. Nothing else in the pager changes: §8's crown and focus rules stay as they are.
- A late card's arrival does NOT touch the sort sheet: a link closes the sheet, and opening the sheet afterwards drops the parked id, so no parked card can arrive under a sheet.
- `targets/watch-widget/WatchComplicationWidget.swift:107,145` -- emits `cardi://watch` and the card URL. Read-only.
- `targets/watch/__tests__/watch-complication-contract.test.ts:197-212` -- source-regex pins of `.onOpenURL` and `openCardRouteIfAvailable`. Update them to the new shape.
- `targets/watch/__tests__/watch-complication-contract.test.ts:494-570` -- the `describeOnMac` harness that lifts Swift declarations verbatim (`swiftDeclaration`, `swap`) and runs them. Reuse it for the new pure type.
- `targets/watch/__tests__/swift-source-helpers.ts` -- shared helpers for lifting declarations.
- `.github/workflows/watchos-tests.yml` -- runs these suites on macOS for `targets/watch/**`.

## Tasks & Acceptance

**Execution:**

- [x] `targets/watch/CardListView.swift` -- a pure, `Equatable` routing state (path card id, parked id) with transitions for a link, a cards update, a path change and a user navigation off the path (sort sheet opened, page turned). Wire `CardListView` to it, close the sort sheet on any link, and feed all three user navigations to it. Rationale: one decision point that the harness can execute.
- [x] `targets/watch/BarcodePagerView.swift` -- an `onPage: () -> Void = {}` parameter, called when the user turns a page. Rationale: paging is a user navigation the list cannot otherwise see.
- [x] `targets/watch/__tests__/watch-complication-contract.test.ts` -- update the pins. Add a harness case that runs the lifted routing type through every I/O matrix row, plus rows for a parked id dropped by the sort sheet opening and by a page turn. Rationale: execution evidence rather than regex alone.
- [x] `targets/watch/__tests__/watch-layout-contract.test.ts` -- move the generation pins to the routing type, pinning `var deepLinkGeneration = 0` inside its declaration and asserting no `@State` generation remains. Rationale: a pin the old code would also pass proves nothing.

**Acceptance Criteria:**

- Given every I/O matrix row, when the harness runs on macOS, then the routing state matches the row.
- Given the watch simulator with the app left on a barcode, when the URL `cardi://watch` is opened (`xcrun simctl openurl`), then the card list shows.
- Given a parked id and a user navigation, when that card later syncs in, then no barcode opens.

## Implementation Notes

### Device check (2026-11-07)

Built from this branch (`yarn watch:build`, after `expo prebuild` in the worktree; `ios/` is gitignored) and installed on the Apple Watch Series 11 (46 mm) simulator, watchOS 26.5, with the debug seed (Esselunga, Healthy Market, Local Bakery). **`xcrun simctl openurl` is refused on watchOS** (LaunchServices error 115, as 23.4 found), so every link was sent the way a user sends it: by tapping the Cardì complications on the watch face, the rectangular one (names Esselunga, sends `cardi://watch-card?id=<id>`) and the circular one (sends `cardi://watch`). Screenshots, outside the repository, in `/private/tmp/claude-501/-Users-ifero-Developer-cardi-loyalty-cards--claude-worktrees-bmad-build-24-3-ff0bb9/5f984a7e-a2e5-4404-9564-a22758259985/scratchpad/device-check/`:

1. **List link on a barcode (AC2).** Local Bakery's barcode open, circular complication tapped: the card list shows. `1a`, `1b`. Passed.
2. **Card link over the sort sheet.** Sort sheet open, rectangular complication tapped: the sheet closes and Esselunga's barcode shows; back pops to the list with no sheet under it. `2a`, `2b`, `2c`. Passed; settles Review Triage #4 as false (the push is not dropped).
3. **List link over the sort sheet.** Sort sheet open, circular complication tapped: the sheet closes and the list shows. `3a`, `3b`. Passed.
4. **Card link from another barcode (unchanged behaviour).** Local Bakery's barcode open, rectangular complication tapped: Esselunga's barcode opens. `4a`, `4b`. Passed.

The face with both complications is `0`. watchOS has no light appearance, so every state is the one dark capture.

**Unchecked on a device, and why:** a parked card arriving later (with and without a user navigation first, AC3) needs a card the watch does not hold to sync in afterwards, which takes a paired phone; the simulator has only the debug seed. The macOS harness runs those rows through the lifted routing type. A page turned with the crown or VoiceOver while a link is parked is likewise harness-only. Real Apple Watch hardware was not used.

### Review loops (2026-11-07)

- Code review, round 1 (fresh Sonnet reviewer, diff since `baseline_commit` with the spec and tracker excluded): `VERDICT: APPROVED`, zero comments.
- QA review, round 1 (fresh Sonnet reviewer, every I/O matrix row and acceptance criterion mapped to the macOS harness or the device check): `VERDICT: APPROVED`, zero comments.

### Found, not fixed

- The watch UI tests (`watch-ios/UITests/CardListUITests.swift`) run in no CI job: `.github/workflows/watchos-tests.yml` only builds the watch target. A deep-link XCUITest (`XCUIApplication().open(URL)`) would not gate a merge until a job runs them. (Review 1, #6.)

## Spec Change Log

- **2026-11-07, review loop 1 (bad_spec).** Trigger: the Edge Case and Blind Hunter layers showed that a parked id survived two user navigations that do not touch `navigationPath`: paging the barcode pager, and opening the sort sheet. The late card then opened anyway, and in the sheet case it also closed a sheet the user had opened after the link. The frozen intent says "drop a parked id whenever the user navigates in any other way"; the Code Map named only the path. Amended: Code Map (the three navigation surfaces, `BarcodePagerView.swift`'s `onPage`, no sheet handling on a late card), Execution tasks (pager and layout-contract tasks added), Verification (the watch suites' real command). Known-bad state avoided: a late card yanking the user off a page or out of a sheet they chose after the link. KEEP:
  - `WatchComplicationDeepLink.link(from:)` returning `Link.cardList` / `.card(id:)` / nil, with the same case-insensitive scheme/host matching and id trimming.
  - `private struct WatchDeepLinkRouting: Equatable` with `pathCardId`, `parkedCardId`, `deepLinkGeneration`; `open`, `cardsChanged`, `pathChanged(to:)` (an echo of `pathCardId` changes nothing) and a private `openBarcode` that clears the parked id, bumps the generation and sets the path.
  - `applyDeepLinkRouting()` as the only assignment to `navigationPath`, writing only when the value differs; `.id(deepLinkRouting.deepLinkGeneration)` on the pager.
  - `.onOpenURL` closing the sort sheet before `open`.
  - The shared `withoutComments` test helper, and the macOS harness shape (lift both types verbatim, `given`/`openURL`/`sync`/`navigate`/`row`, one printed row per case, the unknown-URL loop).
  - The README sentence describing the routing.
  - Comment accuracy (from the same review): the parser's doc says it checks scheme, host and the id only (path segments are ignored, as before); the source pin's comment says the path is "assigned" nowhere else; comments on the generation say it is bumped by every card link that opens a barcode, not by every link.

## Review Triage Log

Review 1 (blind-hunter BH, edge-case-hunter EC, verification-gap VG, project-conventions PC):

| #   | Source        | Finding                                                                                                                                                                            | Verdict     | Route / evidence                                                                                                                                                                                                                                                                                               |
| --- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | EC1, EC6, BH2 | A parked id survives user navigation that does not change `navigationPath` (opening the sort sheet, paging the pager); the late card then opens and closes a sheet the user opened | medium      | bad_spec. `pathChanged` is the only clearing transition and is fed only by `.onChange(of: navigationPath)`; the pager's paging (`BarcodePagerView.swift:271-281`) and `showSortSheet = true` (`:657`) never reach it. Frozen intent says any other user navigation drops it; the Code Map named only the path. |
| 2   | EC4, BH3      | The harness never runs the sheet-close on the late-card path                                                                                                                       | low         | Moot after #1: the amended Code Map removes that branch.                                                                                                                                                                                                                                                       |
| 3   | EC2, BH1      | A parked card can open hours later while the user idles or the app is suspended; no timeout or scene-phase clear                                                                   | false       | The frozen Always clause decides it: a link "still waits for that id, but only until the next deep link or the next navigation by the user". Idling is neither, so waiting is the approved behaviour.                                                                                                          |
| 4   | EC3, BH7      | Closing the sheet and pushing the route in one update may drop the push on watchOS                                                                                                 | maybe-false | Only the simulator can show it; the DEVICE CHECK opens a card link with the sheet open and records the result.                                                                                                                                                                                                 |
| 5   | EC5           | A pop and re-push of the same card within one update coalesces, so the parked id survives                                                                                          | low         | Rejected: needs a pop and a re-push of the same card inside one SwiftUI update, which a user does not do, and the fix would replace the path observer with per-control hooks.                                                                                                                                  |
| 6   | VG1           | The SwiftUI wiring is pinned by regex only; no UI test opens a URL, and CI runs no watch UI tests                                                                                  | medium      | defer. Pre-existing: `CardListUITests` is in no CI job (`watchos-tests.yml:164` builds only). The DEVICE CHECK covers this story; the CI gap goes under Found, not fixed.                                                                                                                                      |
| 7   | BH4           | `toContain('var deepLinkGeneration = 0')` in the layout contract also matches the old `@State` line                                                                                | low         | Folded into the amended tasks (pin it inside the routing type's declaration).                                                                                                                                                                                                                                  |
| 8   | BH5           | Parser doc says "anything else is not a route", but path segments are ignored and `?id=&id=A` is nil                                                                               | low         | Behaviour unchanged from the old parser (the frozen block keeps parsing "as today"); the comment overstates it. Folded into KEEP as a comment correction.                                                                                                                                                      |
| 9   | BH6           | The test comment says the path is "written" nowhere else, but the binding writes it                                                                                                | low         | Folded into KEEP: say "assigned".                                                                                                                                                                                                                                                                              |
| 10  | BH8           | Comments say every deep link bumps the generation; `cardi://watch` does not                                                                                                        | low         | Folded into KEEP as a comment correction.                                                                                                                                                                                                                                                                      |
| 11  | BH9           | Routing state disagrees with the screen when the open card is removed by sync                                                                                                      | false       | `pathCardId` mirrors `navigationPath`, which a sync does not change; both still say A, so they agree. A later link to A goes through `open`, not `pathChanged`, and bumps the generation as it should.                                                                                                         |
| 12  | BH10          | The harness depends on the struct's memberwise init                                                                                                                                | low         | Rejected: a new stored property breaks the harness with a compile error on the macOS job, which is a loud failure, not a silent one.                                                                                                                                                                           |
| 13  | PC            | No convention violations                                                                                                                                                           | —           | Nothing to do.                                                                                                                                                                                                                                                                                                 |

Review 2, after the bad_spec re-derivation (same layer codes):

| #   | Source    | Finding                                                                                                                                | Verdict | Route / evidence                                                                                                                                                                                                                                                  |
| --- | --------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 14  | BH1       | A sync re-applies the route even when `cardsChanged` opened nothing; a pop that coincides with a sync can push the popped barcode back | medium  | patch. `.onChange(of: displayCards.map(\.id))` called `applyDeepLinkRouting()` unconditionally; if it runs before `.onChange(of: navigationPath)` in the same update, `pathCardId` still names the popped card. Fixed: apply only when the routing state changed. |
| 15  | BH2       | A parked link never expires                                                                                                            | false   | carried #3: the frozen Always clause makes waiting the approved behaviour.                                                                                                                                                                                        |
| 16  | BH5, EC1  | Closing the sheet and pushing the route in one update may drop the push                                                                | false   | carried #4, now settled: device check 2 closed the sheet and pushed the barcode in one link, and back popped to the list with no sheet under it.                                                                                                                  |
| 17  | EC7, BH12 | A user change coalesced to the same last card id is read as the router's echo                                                          | low     | carried #5, rejected.                                                                                                                                                                                                                                             |
| 18  | VG1       | The SwiftUI wiring is pinned by source text only                                                                                       | medium  | carried #6, defer.                                                                                                                                                                                                                                                |
| 19  | BH3       | `onPage()` may fire on a detent re-sync the user did not make                                                                          | false   | `.onChange(of: reachable)` (`BarcodePagerView.swift:130-135`) only moves the detent onto `currentId`'s new position, and `follow` returns when the detent already points at `currentId`, so `showCardAtDetent` and `onPage` are not reached.                      |
| 20  | BH4       | The VoiceOver page turn may not reach `onPage`                                                                                         | false   | VoiceOver's adjust calls `step(by:)` (`:193-195`), which changes `detent`; `.onChange(of: detent)` calls `follow`, then `showCardAtDetent`, which calls `onPage()`.                                                                                               |
| 21  | BH6       | Only the sort sheet is closed; other presentations stay over the route                                                                 | false   | The watch target has one presentation, `.sheet(isPresented: $showSortSheet)` (`CardListView.swift:689`); no other sheet, alert or dialog exists.                                                                                                                  |
| 22  | BH7       | Harness gaps (path B + link A, late card on a barcode, etc.)                                                                           | low     | Rejected: every I/O matrix row is executed; the extra rows exercise the same transitions with other values.                                                                                                                                                       |
| 23  | BH8       | The `id` query name is case-sensitive                                                                                                  | false   | Unchanged from the old parser, which the frozen block keeps "as today".                                                                                                                                                                                           |
| 24  | BH9, EC5  | The shared `withoutComments` keeps trailing `//` comments                                                                              | low     | Rejected: a leftover comment can only make an absence or count pin fail loudly, never pass falsely; the widget suite keeps its own trailing-aware stripper.                                                                                                       |
| 25  | BH10      | Whole-body `toBe` source pins are brittle                                                                                              | low     | Rejected: churn on a refactor is a loud failure, and it is the suite's established style.                                                                                                                                                                         |
| 26  | BH11      | `onPage`'s `{}` default hides missing wiring                                                                                           | low     | Rejected: the amended Code Map specifies the default; the one call site passes it and a pin holds it.                                                                                                                                                             |
| 27  | BH13      | The diff leaves out the spec                                                                                                           | false   | By design: the spec reaches only the edge-case layer.                                                                                                                                                                                                             |
| 28  | BH14      | The README routing sentence garbles the waiting rule                                                                                   | low     | patch: split into separate sentences.                                                                                                                                                                                                                             |
| 29  | EC2, EC3  | A deferred crown-reversal `Task`, or an outgoing pager's, calls `onPage` after a newer link parked                                     | low     | Rejected: a link arrives from a complication tap with the app in the background, so no crown turn is in flight; and a link that replaces the pager is a held card, which parks nothing.                                                                           |
| 30  | EC4       | The single-writer pin counts only `navigationPath =`, not mutators                                                                     | low     | Rejected: no mutator exists, and the pin's comment says "assigned".                                                                                                                                                                                               |
| 31  | EC6       | Closing the sheet does not feed the router                                                                                             | false   | Opening it already dropped the parked id, and a link closes it before parking, so nothing can be parked when the user closes it.                                                                                                                                  |
| 32  | PC        | No convention violations                                                                                                               | —       | Nothing to do.                                                                                                                                                                                                                                                    |

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors
- `yarn lint` -- expected: no errors
- `yarn format:check` -- expected: clean
- `npx jest --testPathPattern='targets/watch/__tests__' --testPathIgnorePatterns='/node_modules/' --no-coverage` -- expected: all pass, including the harness on macOS (the CI command; `jest.config.js` ignores `targets/watch/`, so `yarn test targets/watch` runs nothing)
- `yarn test` -- expected: all pass

**Manual checks (if no CLI):**

- Device check on the watchOS simulator, in light and dark: open each route with `simctl openurl` from the list, from a barcode and with the sort sheet open, and capture each result.

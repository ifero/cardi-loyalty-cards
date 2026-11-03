---
title: 'Watch deep-link handler'
type: 'bugfix'
created: '2026-11-04'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
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
- `targets/watch-widget/WatchComplicationWidget.swift:107,145` -- emits `cardi://watch` and the card URL. Read-only.
- `targets/watch/__tests__/watch-complication-contract.test.ts:197-212` -- source-regex pins of `.onOpenURL` and `openCardRouteIfAvailable`. Update them to the new shape.
- `targets/watch/__tests__/watch-complication-contract.test.ts:494-570` -- the `describeOnMac` harness that lifts Swift declarations verbatim (`swiftDeclaration`, `swap`) and runs them. Reuse it for the new pure type.
- `targets/watch/__tests__/swift-source-helpers.ts` -- shared helpers for lifting declarations.
- `.github/workflows/watchos-tests.yml` -- runs these suites on macOS for `targets/watch/**`.

## Tasks & Acceptance

**Execution:**

- [ ] `targets/watch/CardListView.swift` -- a pure, `Equatable` routing state (path card id, parked id) with transitions for a link, a cards update and a user navigation. Wire `CardListView` to it and close the sort sheet on any link. Rationale: one decision point that the harness can execute.
- [ ] `targets/watch/__tests__/watch-complication-contract.test.ts` -- update the pins. Add a harness case that runs the lifted routing type through every I/O matrix row. Rationale: execution evidence rather than regex alone.

**Acceptance Criteria:**

- Given every I/O matrix row, when the harness runs on macOS, then the routing state matches the row.
- Given the watch simulator with the app left on a barcode, when the URL `cardi://watch` is opened (`xcrun simctl openurl`), then the card list shows.
- Given a parked id and a user navigation, when that card later syncs in, then no barcode opens.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors
- `yarn lint` -- expected: no errors
- `yarn format:check` -- expected: clean
- `yarn test targets/watch` -- expected: all pass, including the harness on macOS
- `yarn test` -- expected: all pass

**Manual checks (if no CLI):**

- Device check on the watchOS simulator, in light and dark: open each route with `simctl openurl` from the list, from a barcode and with the sort sheet open, and capture each result.
  </content>
  </invoke>

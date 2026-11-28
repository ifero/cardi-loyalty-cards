---
baseline_commit: '4bbfcbd1cd08640a3a80b08f6614744ee6cb8aac'
title: 'The design-system follow-ups: an off-grid radius, a dead scanner, retired token mocks, a short Storybook canvas and the stale agent-context files'
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

**Problem:** Story 22.1 (design-system components) left fifteen items behind and the form pattern (22.6) and the auth redesign (22.9) added four more of the same kind. Nine are still open. Three are one-line defects: `ActionRow`'s outlined variant is radius 14, which is on neither of the design system's two radii; the confirm sheets stack Cancel _above_ the destructive action, the reverse of what the Cardì frames draw; and three shared tests mock a `TOUCH_TARGET` shape the theme no longer has. Three are structural: a scanner component with no production consumer, a Storybook canvas that is only as tall as its content (so a sheet's scrim lies over the bare iframe page), and two agent-context files that now contradict the code they describe. Two are the auth screens' `hasError` prop and the shared `TextField`'s monospace gap, which the form work made reachable but the auth work left dead.

**Approach:** One cleanup pass over the items that need no decision, plus an explicit decision on the two that do: the destructive-row pressed state, and whether the settings sheets keep drawing their own bodies or move onto the shared document ground.

**Decisions (pending ifero's approval):**

- **The dead scanner is deleted, not adopted.** `BarcodeScanner` was replaced by `ScannerOverlay`; keeping it alive costs the lint guard an exception on every migration.
- **The retired `TOUCH_TARGET` mocks are corrected, not removed.** The tests still assert a `recommended` key that the theme dropped; the assertions should use the shape that exists.
- **The agent-context files are corrected to the code that exists.** `docs/project-context.md` still lists the pre-rebrand palette and prescribes Unistyles' `StyleSheet.create((theme) => …)` for primitives that use React Native's `StyleSheet`; `docs/architecture.md` still names NativeWind as the styling engine.

## Boundaries & Constraints

**Always:** The radius, the sheet action order and the mock shapes are corrected against the design system as it is written today (`docs/design/cardi/cardi-design-system.md`), not against the frames. Every string that changes changes in `en.ts` and `it.ts` together. The deleted component's tests are deleted with it. The agent-context files are corrected where the code is the authority, and the corrections are minimal -- they are context for agents, not a design document.

**Never:** Change the design system's radii, the type scale or the colour scale. Change the settings sheets' behaviour. Adopt `BarcodeScanner` into a surface. Touch the watch or the Wear OS app. Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario              | Input / State                            | Expected Output / Behavior                                                                  | Error Handling |
| --------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------- | -------------- |
| `ActionRow` outlined  | The row renders                          | Its radius is 12 or 16, per the design system                                               | N/A            |
| Confirm sheet         | The sheet is open                        | The destructive action comes first, Cancel below -- the frames' order                       | N/A            |
| Theme mock            | A shared test renders the component      | The mock matches the real `TOUCH_TARGET` shape                                              | N/A            |
| Storybook sheet story | The story is opened                      | The canvas is tall enough for the sheet, so the scrim lies over the app, not over bare page | N/A            |
| `hasError`            | The auth screens render                  | The prop is either used by a caller or removed from `TextField`                             | N/A            |
| Agent context         | An agent reads `docs/project-context.md` | The palette and the styling instruction match the code                                      | N/A            |

</frozen-after-approval>

## Code Map

- `shared/components/ui/ActionRow.tsx:196-203` -- the `outlined` style: `borderRadius: 14`, `borderWidth: 1`, `paddingHorizontal: SPACING.smMd`, `paddingVertical: 6`. The `plain` style (`:193-197`) uses no radius.
- `shared/components/ui/ActionRow.tsx:104-105` -- the pressed fill: `backgroundColor: isPressed ? … : …` with `surfaceElevated` for a destructive row, where a destructive button takes an 8 % wash of its label colour.
- `shared/components/ui/ActionRow.tsx:17` -- the comment _"1.353 and the first accessibility size at 1.786, so 1.5 is the first of the accessibility sizes."_ -- 1.5 is a cut-off between them, not the first accessibility size.
- `features/settings/components/SignOutSheet.tsx:51` (`signout-keep`), `:62` (`signout-erase`), `:73` (`signout-cancel`) -- the shipped order is keep, erase, Cancel.
- `features/settings/components/DeleteAccountSheet.tsx:79` and `:91` (the destructive action), `:102` (`delete-cancel-step1` / `delete-cancel-step2`) -- the destructive action is above Cancel, while the frames draw it first.
- `docs/design/cardi/frames/cardi-settings-frames.html:1479-1497` -- frame D: the destructive action first, then the outlined Cancel.
- `shared/components/SyncStatusContainer.test.tsx:34`, `shared/components/SyncErrorBanner.test.tsx:19`, `shared/components/ConflictResolutionModal.test.tsx:59` -- all mock `TOUCH_TARGET: { min: 44, recommended: 48 }`; the real token is `shared/theme/tokens.generated.ts:83` -- `{ min: 48 }`.
- `features/cards/components/BarcodeScanner.tsx`, `features/cards/index.ts:32` -- the component and its barrel export; the only other hits are the file itself and `features/cards/hooks/useBarcodeScanner.ts` (a different symbol).
- `shared/components/ui/SearchBar.tsx:100`, `:103`, `:114` -- the shared search field's three default copy strings, all taken from the wallet's (`cards.home.searchPlaceholder`, `cards.home.searchAccessibilityLabel`, `cards.home.clearSearchAccessibilityLabel`).
- `shared/components/ui/SearchBar.tsx:133` -- `height: TOUCH_TARGET.min` -- a fixed 48pt field, which at the largest text size lets the typed text overflow it.
- `shared/components/ui/DocumentScreen.tsx:60-75` -- the shared document ground (a `ScreenHeader` plus a `ScrollView`); `features/settings/components/AboutSection.tsx` does not use it, so the settings screen builds its own ground.
- `shared/components/ui/TextField.tsx:31`, `:115`, `:143`, `:147` -- the `hasError` prop, declared, defaulted and consumed, with **no** caller outside `TextField.tsx` itself.
- `shared/components/ui/TextField.tsx:242-244` -- `gap: SPACING.sm` with the comment _"The form frame's label-to-control gap (Story 22.6; it was 6, off the grid)."_; `:19` `INPUT_PADDING_X = SPACING.md`; `:198` the fill is `theme.colors.surface`.
- `shared/components/ui/PrimaryActionFooter.tsx:16-20` -- the comment naming _"the `CardSetupScreen` shape"_; `shared/components/ui/Button.test.tsx:157` -- the comment naming `CardSetupScreen` passing `disabled` with `loading`.
- `.storybook/StoryDecorator.tsx:27` -- `<View testID="story-canvas" style={{ flex: 1, padding: 16, backgroundColor: theme.background }}>`. The sheet stories are 32pt tall, so their scrim lies over the bare iframe page.
- `docs/project-context.md:431` (`| Blue | \`#1A73E8\` |`), `:441` (`| Light | \`#1A73E8\` |`), `:225-243`(the Unistyles`StyleSheet.create((theme) => …)`prescription),`:26`and`:41` (NativeWind references).
- `docs/architecture.md:73` (_"NativeWind (Tailwind CSS) for styling ⚠️ **Under evaluation**"_), `:399`, `:500`, `:1488`.
- `docs/design/CONTRIBUTING-DESIGN.md:48`, `:92` -- the `SEMANTIC_COLORS` reference (also #248 item 5).
- Do not change: the design system's scales, `shared/theme/tokens.generated.ts` (generated), the watch.

## Tasks & Acceptance

**Execution:**

- [ ] `shared/components/ui/ActionRow.tsx` -- the outlined radius becomes one of the design system's two radii (12 or 16); the comment at `:17` is corrected to describe 1.5 as a cut-off between iOS's xxxLarge (1.353) and its first accessibility size (1.786).
- [ ] `features/settings/components/SignOutSheet.tsx`, `DeleteAccountSheet.tsx` -- the confirm sheets' action order follows the frames: the destructive action first, Cancel below. The shipped copy and behaviour are unchanged.
- [ ] `shared/components/SyncStatusContainer.test.tsx`, `SyncErrorBanner.test.tsx`, `ConflictResolutionModal.test.tsx` -- the `TOUCH_TARGET` mocks match the real token (`{ min: 48 }`); the assertions that depended on `min: 44` are updated to the real value.
- [ ] `features/cards/components/BarcodeScanner.tsx` -- delete the component and its test; remove the barrel export at `features/cards/index.ts:32`.
- [ ] `shared/components/ui/TextField.tsx` -- either wire `hasError` to a caller or remove the prop; the dead prop goes.
- [ ] `shared/components/ui/SearchBar.tsx` -- the three default copy strings become required props or neutral defaults, so a caller that forgets its own copy does not ship the wallet's wording.
- [ ] `shared/components/ui/SearchBar.tsx` -- the field's height grows with the text at the largest size, so the typed text does not overflow the 48pt field.
- [ ] `docs/project-context.md`, `docs/architecture.md` -- the palette and the styling instruction are corrected to the code that exists; `SEMANTIC_COLORS` is dropped from `docs/design/CONTRIBUTING-DESIGN.md`.
- [ ] `shared/components/ui/PrimaryActionFooter.tsx:18`, `shared/components/ui/Button.test.tsx:157` -- the two stale comments are corrected to name the components that are actually the reference.
- [ ] `.storybook/StoryDecorator.tsx` -- the canvas is tall enough for the sheet stories, so a sheet's scrim lies over the app rather than over bare page.
- [ ] `yarn frames:check`, `yarn lint`, `yarn typecheck`, `yarn test` -- green.

**Acceptance Criteria:**

- Given the design system, when `ActionRow`'s outlined variant is rendered, then its radius is one of the system's two radii -- 12 or 16 -- and never 14.
- Given the sign-out or delete-account confirm sheet, when it is open, then the destructive action is the first action, as the Cardì frames draw it.
- Given any shared component test, when it mocks `TOUCH_TARGET`, then the mock is the real shape (`{ min: 48 }`), and no assertion depends on a key the theme does not have.
- Given a search field rendered by a screen that forgot its own copy, when it renders, then it does not show the wallet's "Search loyalty cards" wording.
- Given the largest text size, when a person types into a search field, then the text stays inside the field's border.
- Given the Storybook sheet stories, when one is opened, then the sheet's scrim lies over the app surface, not over bare page.
- Given an agent reading `docs/project-context.md` or `docs/architecture.md`, when it plans a change, then the palette and the styling engine it is told about are the ones in the code.
- Given `grep` for `hasError` in `shared/` and `features/`, when it runs outside the tests, then either a caller exists or the prop is gone.

## Design Notes

Most of this is the residue of three redesigns moving surfaces around without cleaning up the ones they left. The recurring theme is a comment or a mock that records a state the code has since left -- which is worse than no comment, because it is confidently wrong.

The destructive-row pressed state and the settings sheets' hand-built document ground are the two items that need a ruling rather than a cleanup. The first is a design-system gap (what does "pressed" look like on a destructive row?). The second is an architectural choice (does the settings screen build its ground by hand, or move onto `DocumentScreen` with a content gap?).

The Storybook canvas is worth fixing for one reason: a Chromatic snapshot of a sheet story currently shows a dark scrim over a light page, which reads as a rendering bug in the visual-diff channel and hides real changes.

## Implementation Notes

- Source issues: #251 (items 2, 5, 6, 9, 14), #268 (items 2, 12), #275 (items 2, 12).
- #251 items 1, 3, 4, 7, 11, 13 and 15 are **closed** and must not be re-opened here: the `TextField` gap is
  `SPACING.sm` with the Story 22.6 note; `NoCodeFoundBanner` carries no icon; `MultiCodePickerSheet`'s rows
  are 64pt with a plain Cancel and localised labels; `CardTile` announces a favourite;
  `CardSetupScreen` passes `busy`, not `disabled` + `loading`; `BarcodeFlash` uses `scheduleOnRN`; and
  `HomeScreen` clears `highlightCardId` at `:96`.
- #251 items 8 and 12 are recorded as "no action expected" / "as designed" in the issue.
- #268 item 9 is **closed**: `features/auth/components/ErrorBanner.tsx` no longer exists and
  `features/auth/SignInScreen.tsx` no longer computes `hasFormError`.
- #275 item 7 (`hasError` with no caller) is included here because it is the same file and the same
  class of dead prop.
- The `Button`'s wrapped-label alignment is recorded under #248 item 10 and #271 item 18, and is
  **not** duplicated here -- it is fixed in `16-49-triage-theme-followups.md`.
- `docs/architecture.md:1774` records the 2026-04-11 decision that NativeWind was _under evaluation_;
  the rebrand and the Epic 22 redesign settled that in Unistyles. The correction is a documentation
  fix to match the code, not a new architectural decision.
- `.storybook/StoryDecorator.tsx` last changed in `8679b35 feat(storybook): add web component gallery with
Storybook + Chromatic (Story 16.5) (#146)`; the sheet stories came later, with the Epic 22 sheets.
- The Storybook dev-mode failure (#251 item 10) looks **fixed** by `.storybook/main.ts:83-110`, which now
  stubs Expo's type declarations and keeps `expo-modules-core` out of pre-bundling. It could not be
  re-run here (`node_modules/` was absent), so it is not part of this story's scope -- but it is worth
  re-checking once dependencies are installed.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors
- `yarn lint` -- expected: no errors
- `yarn format:check` -- expected: clean
- `yarn test` -- expected: all suites pass
- `yarn frames:check` -- expected: the frames match their generators
- `yarn build-storybook` -- expected: the storybook builds

**Manual checks (if no CLI):**

- Open a settings confirm sheet and compare its action order with frame D.
- Open the Storybook sheet story and confirm the scrim covers the app surface.
- At the largest text size, type into a search field and confirm the text stays inside its border.

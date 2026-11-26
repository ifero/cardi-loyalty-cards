---
baseline_commit: '4bbfcbd1cd08640a3a80b08f6614744ee6cb8aac'
title: 'The theme and typography follow-ups: dead components, token fallbacks, hard-coded English, a stale design doc and an unrun Android device pass'
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

**Problem:** Story 21.6 (bundle and adopt the brand typefaces) left fourteen items behind, and the wallet redesign (22.2) added two more of the same kind. Nine of them are still open: three components have no production consumer and exist only because they were migrated anyway; two files still hard-code English that the app otherwise routes through i18n; one component masks its own design tokens with `??` fallbacks; one design document names a token that was deleted; the app has no screen that credits the bundled fonts; a button label that wraps is not centred; the typefaces have never been run on an Android device; and one test suite depends on its own test order.

**Approach:** One pass over the items that do not need a decision, in the order that removes the most risk per change. The two items that _do_ need a decision -- the font credit screen and the wrapped-label alignment -- are called out and routed.

**Decisions (pending ifero's approval):**

- **The dead components are deleted, not adopted.** `VirtualLogo`, `FormatPicker` and `CatalogueGrid` have no production consumer; the Epic 22 redesigns replaced their surfaces. Deleting them removes the lint-guard exception that keeps them alive.
- **The hard-coded English moves into the locale files.** The strings in `useAutoSync` and `useGuestMigration` are user-visible banners and errors, so they belong in `shared/i18n/locales/`.
- **The Android device pass is recorded as a story with a device, not as a code change.** It cannot be closed by a diff; the story's acceptance is a filled table, like 21.7's AC8.

## Boundaries & Constraints

**Always:** Every user-visible string moves to `en.ts` and `it.ts` together. The token fallbacks are removed in favour of the tokens themselves, so a missing token is a type error rather than a silent default. The deleted components' tests are deleted with them; tests that pin shared behaviour are updated, not deleted. The SDK patch train is measured before it is fixed, so the number in the story is the one that was true on the day.

**Never:** Adopt `VirtualLogo`, `FormatPicker` or `CatalogueGrid` into a new surface -- that is a design decision, not a cleanup. Change any visual design. Change the Android minimum SDK. Touch the watch. Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario            | Input / State                         | Expected Output / Behavior                                              | Error Handling              |
| ------------------- | ------------------------------------- | ----------------------------------------------------------------------- | --------------------------- |
| Token fallback      | A theme without `spacing.xs`          | A type error at build time, not a silent `?? 4`                         | Build fails                 |
| Hard-coded English  | A sync failure or a migration message | The message comes from the locale file, in the active language          | N/A                         |
| Dead component      | Nothing imports it                    | It is gone, and the lint guard no longer needs an exception             | N/A                         |
| SDK patch train     | `npx expo install --check`            | The measured number is recorded, and each outdated package is updated   | N/A                         |
| Android device pass | The typefaces on an Android device    | Inter 400/600/700, Space Grotesk 700 and JetBrains Mono 500 all resolve | Recorded as a defect if not |

</frozen-after-approval>

## Code Map

- `features/cards/components/VirtualLogo.tsx`, `features/cards/components/FormatPicker.tsx`, `features/cards/components/CatalogueGrid.tsx` -- the three components; each is referenced only by itself and by the barrel `features/cards/index.ts:33` (`VirtualLogo`), `:41` (`CatalogueGrid`); `FormatPicker` is in the same barrel. `app/scan.tsx:4-8` names `CatalogueGrid` in its doc comment as the route that reaches the legacy `/scan` bridge -- that comment becomes false when the component is deleted.
- `features/auth/components/GuestModeBanner.tsx:21-26` -- `const { theme, spacing, touchTarget, isDark } = useTheme();` then `spacing?.xs ?? 4`, `spacing?.sm ?? 8`, `spacing?.md ?? 16`, `touchTarget?.min ?? TOUCH_TARGET.min`. `useTheme()`'s return type already declares `spacing` and `touchTarget` as non-optional (`shared/theme/ThemeProvider.tsx:27`), so the optional chaining is unnecessary.
- `shared/hooks/useAutoSync.ts:17` and `:76` -- `const MAX_RETRIES_EXCEEDED_MESSAGE = 'Sync failed. Changes saved locally.';` and `setSyncError('Session expired. Changes will sync after sign-in.');`.
- `features/auth/useGuestMigration.ts:105` (`'Your cards are being backed up…'`), `:112` (`'Your cards are safe — backed up to the cloud ✓'`), `:123` (`"Some cards couldn't be backed up. Tap to retry."`).
- `shared/i18n/locales/en.ts`, `it.ts` -- the destination for those strings; the locale files already hold the surrounding sync and migration keys.
- `docs/design/CONTRIBUTING-DESIGN.md:48` and `:92` -- both still name `SEMANTIC_COLORS`, deleted by Story 21.2.
- `shared/components/ui/Button.tsx:169-176` -- the label `<Text style={{ ...TYPOGRAPHY.bodyLgStrong, color: … }}>` with no `textAlign`, so a wrapped label inherits the container's alignment.
- `features/cards/components/SortFilterRow.tsx:68-77` -- the wallet's count row (`cardCountText` plus the sort control), which shares one row with no shrink allowance.
- `features/auth/VerifyEmailScreen.test.tsx:915` -- the comment _"Fake timers last: a fake-timer test early in a file can stall the async tests after it."_; the fake-timer `describe` block is at `:915-970` and calls `jest.useFakeTimers()` at `:918` and `:962`.
- `features/auth/VerifyEmailScreen.test.tsx:190-206` -- the `beforeEach`/`afterEach` pair; the `afterEach` calls `jest.useRealTimers()` at `:202`.
- `docs/design/cardi/cardi-design-system.md` -- the OFL FAQ's "good practice" credit line and the app's lack of a licences screen (no licence surface exists in `features/`, `app/` or `shared/i18n/locales/en.ts`).
- `shared/theme/tokens.generated.ts:83` -- `export const TOUCH_TARGET = { min: 48 } as const;` -- the token the fallbacks mask.
- Do not change: `shared/theme/tokens.generated.ts` (it is generated -- `yarn tokens:build` owns it), the design system's colour and type scales, any watch file.

## Tasks & Acceptance

**Execution:**

- [ ] `features/cards/components/VirtualLogo.tsx`, `FormatPicker.tsx`, `CatalogueGrid.tsx` -- delete the three components and their tests; remove the barrel exports; fix the `app/scan.tsx` doc comment that names `CatalogueGrid`; check whether the lint guard that exempted them needs updating.
- [ ] `features/auth/components/GuestModeBanner.tsx` -- drop the `??` fallbacks and the optional chaining on `spacing` and `touchTarget`; the tokens are non-optional in the theme's type.
- [ ] `shared/hooks/useAutoSync.ts`, `features/auth/useGuestMigration.ts` -- move the five hard-coded English strings into `shared/i18n/locales/en.ts` and `it.ts`; the components read them through `t()`.
- [ ] `docs/design/CONTRIBUTING-DESIGN.md:48` and `:92` -- replace `SEMANTIC_COLORS` with the token that exists today, or drop the reference.
- [ ] `shared/components/ui/Button.tsx` -- centre a wrapped label (`textAlign: 'center'`), and check the wallet's count row (`SortFilterRow.tsx`) for the same at the largest text size.
- [ ] `features/auth/VerifyEmailScreen.test.tsx` -- make the file independent of its test order: a real-timer warm-up render before the fake-timer block, so `jest --randomize` does not make the later suites time out. The fake-timer block no longer has to be last.
- [ ] `npx expo install --check` -- measure the SDK patch train and record the number; update the packages Expo reports as outdated, one at a time, so a green build is kept.
- [ ] The Android device pass (a story of its own, or a task here with a device): confirm Inter 400/600/700, Space Grotesk 700 and JetBrains Mono 500 resolve on a physical Android device; record the result.
- [ ] The font credit screen (a story of its own): add a licences surface listing the three OFL fonts, as the OFL FAQ asks.
- [ ] `yarn tokens:check`, `yarn lint`, `yarn typecheck`, `yarn test` -- green.

**Acceptance Criteria:**

- Given a repository search for `VirtualLogo`, `FormatPicker` and `CatalogueGrid`, when it runs, then no component file and no barrel export remains, and no comment claims a route that no longer exists.
- Given a sync failure or a guest-migration message, when it is shown, then the text comes from the locale file and is Italian in the Italian locale.
- Given the theme's type, when `GuestModeBanner` is compiled, then no `??` fallback on `spacing` or `touchTarget` remains -- a missing token is a compile error.
- Given `docs/design/CONTRIBUTING-DESIGN.md`, when it is read, then it names no token that has been deleted.
- Given a `Button` whose label wraps, when it renders, then the label stays centred.
- Given `jest --randomize --seed=5` on `features/auth/VerifyEmailScreen.test.tsx`, when it runs, then every test passes regardless of order.
- Given `npx expo install --check`, when it runs, then the number of outdated packages is recorded in the story, and each one it names is updated.
- Given a physical Android device, when the typefaces are rendered, then Inter 400/600/700, Space Grotesk 700 and JetBrains Mono 500 all resolve -- and the result is recorded.
- Given the app's About area, when a person looks for the font licences, then they find them, listing all three bundled faces as OFL.

## Design Notes

Three of these items are the same defect wearing different clothes: a component, a string or a token that the redesign left behind. Deleting them is cheaper than maintaining them, and the lint guard that keeps them alive is a cost the project pays on every migration.

The two items that need a human ruling are deliberately split out rather than folded in:

- **The font credit.** The OFL FAQ calls an About-box credit "good practice". The app has no About-box licence list today. Whether to add one is a product decision, and it is a small screen.
- **The wrapped label.** A `Button` whose label wraps at the largest text size is left-aligned. Centring it is one property, but it changes every button's look at that size, so it should be a deliberate change rather than a side effect of a cleanup.

The Android device pass and the SDK patch train are both "measure, then fix": the number in the issue is from 2026-09-26, and the honest thing is to record today's number before changing anything.

## Implementation Notes

- Source issues: #248 (items 1, 2, 3, 4, 5, 8, 10, 12, 13) and #258 (items 3, 7 -- the `useCards` function declaration and the same hard-coded English, which are recorded under the wallet's triage but are the same strings).
- #248 item 6 is **closed** and must not be re-opened here: `docs/design/cardi/cardi-design-system.md:48-52` already reads `fontWeight: '700'`, and `shared/components/ui/TextField.tsx` already has the monospace variant (`inputMono`, using `TYPOGRAPHY.monoCode`).
- #248 item 14 is **closed**: `features/auth/VerifyEmailScreen.tsx:547-549` picks the resend label on `remainingSeconds > 0` alone.
- #248 items 9 and 11 are **accepted platform limits**, recorded in the issue as such.
- #258 item 9 is **closed**: `jest.setup.js:360` keeps one shared value for the component's life.
- The token fallbacks in `GuestModeBanner` currently produce the _right_ values -- `spacing.xs` is 4, `spacing.sm` is 8, `spacing.md` is 16, and `TOUCH_TARGET.min` is 48 (`shared/theme/tokens.generated.ts:83`). Removing them changes nothing visually; it only makes the type system honest.
- `shared/theme/tokens.generated.ts` is **generated** (`yarn tokens:build` owns it, `yarn tokens:check` guards drift). Edit `tokens/*.json`, never the generated file.
- The `expo install --check` count could not be measured in the environment this spec was drafted in (`node_modules/` was absent), so the story's acceptance requires the measurement, not a fixed number.
- The `useCards` arrow-function conversion (#258 item 7) is a one-line change to
  `features/cards/hooks/useCards.ts:35` and can ride along with this pass.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors
- `yarn lint` -- expected: no errors
- `yarn format:check` -- expected: clean
- `yarn test` -- expected: all suites pass
- `yarn tokens:check` -- expected: the design tokens are in sync

**Manual checks (if no CLI):**

- On an Android device: render text in Inter 400/600/700, Space Grotesk 700 and JetBrains Mono 500, and
  confirm every weight resolves (the phone's custom-font weights collapse to regular/bold below API 28).
- On a simulator at the largest text size: a `Button` whose label wraps stays centred.

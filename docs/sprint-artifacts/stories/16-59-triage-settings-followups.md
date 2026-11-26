---
baseline_commit: '4bbfcbd1cd08640a3a80b08f6614744ee6cb8aac'
title: 'The settings follow-ups: a dead language screen, two import sheets that can show at once, a relative time outside i18n, and a delete that can be reported as failed'
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

**Problem:** Story 22.7 (the settings screen and its sheets) left twenty items behind. Four were closed by later work. Sixteen are still open, and they are the residue of a screen that was rebuilt without a cleanup pass: a screen that has been dead since Story 13.6 is still exported, a failed import can leave two sheets on screen at once, the Sync row's relative time is hard-coded in two languages outside i18n, a request keeps running after its sheet is closed, and a deletion that _succeeded_ can be reported as failed because the local sign-out is treated as part of the deletion.

**Approach:** One pass over the settings screen and its sheets. The three items that need a decision -- the destructive row's pressed state, the sheet's own copy of the action order, and the Italian `DELETE` keyword -- are called out with a recommendation.

**Decisions (pending ifero's approval):**

- **The dead `LanguageListScreen` is deleted.** The language picker is a sheet (`LanguagePickerSheet.tsx`); the list screen has had no route since Story 13.6.
- **The import flow shows one sheet at a time.** A failed import closes the preview and shows the error; it does not stack both.
- **The relative time moves into the locale files**, so the Sync row's text is translated like everything else.
- **A request that is running is not interrupted by closing its sheet, but the sheet says so.** The alternative -- a real cancel -- is a larger change and needs its own decision; this story makes the behaviour honest rather than changing it.

## Boundaries & Constraints

**Always:** Every user-visible string moves to `en.ts` and `it.ts` together. The sheets keep their frames' visual design; the action-order question is settled in the design system, and the shipped sheets follow it. The delete-account flow keeps its type-to-confirm gate and its existing copy. The settings screen's structure -- sections, rows and sheets -- is unchanged.

**Never:** Change what delete-account deletes (the cloud erasure and the local cards that remain). Change the sign-out sheet (16.45 owns it). Change the import file format or what an import does. Add a dependency. Change the account section's rows. Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario                                   | Input / State                                                              | Expected Output / Behavior                                         | Error Handling                             |
| ------------------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------ |
| The app starts                             | The routes register                                                        | No dead language list screen is registered                         | N/A                                        |
| An import fails                            | The preview sheet was open                                                 | The preview closes; the error sheet opens                          | The error sheet shows the message          |
| An import succeeds                         | The preview sheet was open                                                 | The preview closes; the result is reported                         | As today                                   |
| The Sync row                               | A last-sync time exists                                                    | The relative time comes from the locale file                       | N/A                                        |
| A sheet is closed mid-request              | The sign-out, delete or export request is running                          | The request completes; the sheet's busy state says so              | The request's own error path still applies |
| The delete succeeds but the sign-out fails | The server erased the account; the local sign-out returned a network error | The person is told the account is gone, not that the delete failed | The local session is cleared anyway        |
| The delete field                           | The person types the keyword                                               | The keyboard does not autocorrect or predict                       | N/A                                        |

</frozen-after-approval>

## Code Map

- `features/settings/screens/LanguageListScreen.tsx:8` and `features/settings/index.ts:5` -- the dead screen and its only reference. The live picker is `features/settings/components/LanguagePickerSheet.tsx`.
- `features/settings/hooks/useImportData.ts:33-39` -- `preview` and `errorState` are independent states; `:77` sets the preview, `:115` clears it on success, `:149-156` (the `catch`) sets `errorState` and **never** clears the preview. `features/settings/screens/SettingsScreen.tsx:380` renders `ImportPreviewSheet` and `:392` `ImportErrorSheet` on their own flags.
- `core/utils/relative-time.ts:1-40` -- `formatRelativeTime` hard-codes `'Never'`, `'Just now'`, `'min ago'`, `'hour(s) ago'`, `'day(s) ago'` and their Italian twins, with `const ENGLISH_LOCALE = 'en-US'` at `:1`.
- `shared/components/ui/BottomSheet.tsx:228` -- `accessibilityElementsHidden={!visible}`; React Native's `Modal` forwards a fixed prop list to its host view, so the prop only holds under Jest's mock.
- `features/cards/components/SortFilterRow.tsx:105-130` -- the sort sheet draws its own option rows with a hand-drawn `Check` at `:46-47` (`CHECK_SIZE = 24`, `CHECK_STROKE_WIDTH = 1.5`), while `shared/components/ui/OptionList.tsx` exists.
- `features/add-card/screens/CardTypeSelectionScreen.tsx:84-94` -- its own `<HeaderIconButton`.
- `shared/components/ui/Button.tsx:69-76` -- the `secondary` variant: `borderColor: theme.primary`, `textColor: theme.primary` -- in dark mode `theme.primary` is the beam, so every Cancel and every Sign In is beam.
- `shared/components/ui/ActionRow.tsx:104-105` -- the pressed fill is `surfaceElevated`, where a destructive button takes an 8 % wash of its label colour.
- `shared/i18n/locales/it.ts:223-229` -- `step2Body: "Digita DELETE per confermare l'eliminazione permanente dell'account."`, `confirmInputLabel: 'Digita DELETE per confermare'`, `confirmInputHint`, `confirmKeyword: 'DELETE'` -- the Italian asks for the English word.
- `features/settings/components/DeleteAccountSheet.tsx:118-126` -- the `TextField` sets `autoCapitalize="characters"` and no `autoCorrect={false}`, so iOS's predictive text can append a space to the exact, case-sensitive keyword.
- `features/settings/screens/SettingsScreen.tsx:167-172` (`confirmExport`), `:177-215` (`confirmSignOut`), `:221-250` (`confirmDeleteAccount`) -- no request is cancelled when the sheet closes; the sheet's close stays live while the request runs.
- `shared/supabase/auth.ts:439` -- `const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });` and, on an error, `return { success: false, error: toAuthError(signOutError) }` -- so a network failure in the server logout is reported as a failed deletion, after the account has already been erased.
- `features/cards/components/CardDetails.tsx:292` and `features/cards/screens/CardEditScreen.tsx:91` -- the platform `Alert` on card detail's Delete and edit's Discard, which 22.7's decision moved onto the confirm sheet "in a follow-up".
- `shared/components/ui/DetailRow.tsx:56` -- `numberOfLines={1}` with `ellipsizeMode="middle"`, so a card detail's values are cut at the largest text size.
- `shared/components/ui/Button.tsx:169-176` -- the label carries no `textAlign`, so a wrapped label is left-aligned.
- `features/settings/screens/SettingsScreen.tsx:341` -- `<AboutSection>`; the shared `shared/components/ui/DocumentScreen.tsx` is the document ground the settings screen does not use.
- `features/settings/hooks/useImportData.ts:24,67,87,94,154` -- the error's `variant`, which `features/settings/components/ImportErrorSheet.tsx` never reads.
- Do not change: `shared/supabase/auth.ts`'s `deleteAccount`'s server call, the sign-out sheet, the import's file handling, the account section's rows.

## Tasks & Acceptance

**Execution:**

- [ ] `features/settings/screens/LanguageListScreen.tsx` -- delete it and its barrel export; confirm no route reaches it.
- [ ] `features/settings/hooks/useImportData.ts` -- a failed import clears the preview before setting the error state, so only one sheet is ever visible; the `variant` that nothing reads is removed.
- [ ] `core/utils/relative-time.ts` -- the relative time comes from the locale files (English and Italian), with the locale chosen by the app's language rather than by a hard-coded `en-US` default.
- [ ] `shared/components/ui/BottomSheet.tsx` -- the hidden-while-leaving prop reaches the device (or is replaced by a mechanism that does), so a closing sheet's contents are not announced.
- [ ] `features/cards/components/SortFilterRow.tsx` -- the sort sheet uses the shared `OptionList` rather than its own rows and its own check glyph.
- [ ] `features/add-card/screens/CardTypeSelectionScreen.tsx` -- the capture screen's header uses the shared `ScreenHeader`/`HeaderIconButton` geometry.
- [ ] `shared/components/ui/Button.tsx` -- the dark-mode secondary variant is settled (the design system says nothing about a dark secondary), and the wrapped label stays centred.
- [ ] `shared/components/ui/ActionRow.tsx` -- the destructive row's pressed state is settled in the design system and applied.
- [ ] `shared/i18n/locales/it.ts:223-229` -- the Italian delete keyword is decided (an Italian keyword, or an explicit rule that the keyword is the English `DELETE` because the server's and the App Store's rules use it) and applied consistently to the hint, the label and the body.
- [ ] `features/settings/components/DeleteAccountSheet.tsx` -- the delete field sets `autoCorrect={false}` and `autoComplete="off"`, so the exact keyword is never "helpfully" changed.
- [ ] `features/settings/screens/SettingsScreen.tsx` -- the busy state of a request is explicit while its sheet is closing, and the sheet's close is either inert while the request runs or the request is cancelled (the decision is recorded).
- [ ] `shared/supabase/auth.ts` -- after a confirmed server-side deletion, a failed local sign-out is treated as success and the local session is cleared, so a successful deletion is never reported as a failure.
- [ ] `features/cards/components/CardDetails.tsx`, `features/cards/screens/CardEditScreen.tsx` -- the Delete and Discard confirmations move onto the shared confirm sheet, as 22.7's decision recorded.
- [ ] `features/cards/components/DetailRow.tsx` -- a card detail's values are not cut at the largest text size.
- [ ] `yarn lint`, `yarn typecheck`, `yarn test` -- green.

**Acceptance Criteria:**

- Given the app's routes, when they register, then no screen for the old language list exists.
- Given an import that fails, when the error appears, then only the error sheet is visible -- the preview sheet is not on screen behind it.
- Given the Sync row, when a last-sync time exists, then its relative text is translated with the rest of the app.
- Given a sheet that is closing, when a screen reader is active, then the sheet's contents are not announced after it closes.
- Given the wallet's sort sheet, when it opens, then its rows come from the shared option list, with the shared check glyph.
- Given the app in dark mode, when a secondary button is rendered, then it follows the settled dark-secondary rule rather than being beam by accident.
- Given the Italian delete-account sheet, when the person types the keyword, then the keyboard does not change it, and the copy tells them exactly what to type.
- Given a delete-account request whose server call succeeded but whose local sign-out failed, when the request finishes, then the person is told the account was deleted and the app is signed out.
- Given a card detail at the largest text size, when the values are shown, then none of them is cut.

## Design Notes

The most consequential of these is the deletion one. `deleteAccount` calls the server's erasure function and then signs out locally; the local sign-out is treated as part of the same operation, so a network blip after a successful erasure turns into "the delete failed" for an account that no longer exists. The person retries, the retry calls the function as a deleted user, and the account is now in a state neither the app nor the person can reason about. The fix is to treat the confirmed erasure as the outcome and clear the local session regardless.

The import double-sheet is the same class of defect at a smaller scale: two independent booleans, and a failure path that sets one without clearing the other.

The dark-mode secondary button is a design-system gap rather than a bug. The design system reserves beam for focus, selection and the dark primary, and says nothing about a dark secondary -- so the implementation's behaviour is a coincidence of `theme.primary` being the beam in dark mode, not a decision. It needs one.

## Implementation Notes

- Source issue: #271 (all sixteen still-open items). The issue's items 10 and 12 are closed or
  handled elsewhere: item 10 (signing out with unsynced changes) was closed by Story 16.45's sign-out body
  (`shared/i18n/locales/en.ts:216`), and item 12 (the fonts' licence credit) is in
  `16-49-triage-theme-followups.md`.
- #271 items 4, 6, 8 and 16 are the same class as items already covered elsewhere: the `BottomSheet`'s
  hidden-while-leaving prop, the capture screen's own header, the multi-code picker's scrolling sheet and the
  agent-context files. They are consolidated here so the settings screen's cleanup is one change; the
  overlapping items in `16-50-triage-design-system-followups.md` and
  `16-53-triage-capture-and-document-followups.md` are the same defects seen from another story.
- The `BottomSheet`'s prop-forwarding behaviour could not be read in the environment this spec was drafted
  in (`node_modules/react-native` was absent), so the item is recorded from the issue's reading of
  `Modal.js:326-347`. The fix does not depend on the diagnosis.
- `shared/supabase/auth.ts:439`'s `signOut({ scope: 'local' })` is the _local_ scope, which should not need
  the server at all -- but `@supabase/auth-js` 2.105.1 still calls the server's logout in that path
  (`dist/main/GoTrueClient.js:3191`), and a 404/401/403 is ignored while a network failure returns an error.
  The fix can be either to treat the confirmed erasure as the outcome, or to make the local sign-out genuinely
  local; the first is smaller and is the recommendation.
- `DeleteAccountSheet.tsx`'s `TextField` already forwards `autoCorrect` (`shared/components/ui/TextField.tsx`
  forwards it to the `TextInput`), so the fix is one prop on the call site.
- The `OptionList` primitive already exists with a test (`shared/components/ui/OptionList.test.tsx`), so
  moving the sort sheet onto it is an adoption, not a build.
- Card detail's Delete and edit's Discard use the platform `Alert` because 22.7's decision deferred them:
  _"every confirmation is the confirm sheet, with card detail's Delete and edit's Discard moving in a
  follow-up"_. This is that follow-up.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors
- `yarn lint` -- expected: no errors
- `yarn format:check` -- expected: clean
- `yarn test` -- expected: all suites pass

**Manual checks (if no CLI):**

- On a simulator: run an import that fails, and confirm only the error sheet is on screen.
- On a simulator: delete the account with the network dropped after the server call, and confirm the app
  reports the deletion as done.
- At the largest text size, open card detail and confirm no value is cut.

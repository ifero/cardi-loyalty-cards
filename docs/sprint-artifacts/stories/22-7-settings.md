---
title: 'Story 22.7: Settings — the list and its sheets on the Cardì system'
type: 'feature'
created: '2026-10-15'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '380507e13dadb6f3b65640b6cb91ed6b06e6c530'
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Settings still draws the pre-Cardì app:

- the header is the native one, with the root stack's MaterialIcons back;
- rows sit on the ground, spaced by gaps, with a MaterialIcons glyph on every row;
- the account card carries an avatar and a green "Synced" mark that is hard-coded whatever the
  sync state;
- About's version rows are dimmed, disabled buttons;
- the theme picker draws preview chips that overflow a 320pt screen;
- the six sheets that are not pickers each draw a 40pt icon and set their titles outside the
  sheet's own title, so each is announced as "Bottom sheet";
- the sign-out and delete sheets stack Cancel above the destructive action at 48pt, and those two
  and export show a failed request as loose red text;
- nothing moves the delete-account sheet above the keyboard.

**Approach:** Draw settings from `docs/design/cardi/frames/cardi-settings-frames.html` frames A–F
and `stitch-prompts-settings.txt`, in light and dark, with `cardi-design-system.md` winning any
conflict. That means the shared screen header, hairline groups of rows, and the four sheet shapes
(pick one, confirm, acknowledge and type to confirm) on the shared `BottomSheet`, with every
destructive action on 22.1's `destructive` variant. Record every ruling in the design system.

## Boundaries & Constraints

**Always:**

- **The six frames:**
  - A, signed in;
  - B, guest;
  - C, pick one: theme and language;
  - D, confirm: sign out, delete account's first step, export and the import preview;
  - E, acknowledge: nothing to export, and the import error;
  - F, type to confirm: delete account's second step.
- **Keep what shipped:**
  - every capability and side effect:
    - sign out, which is local, keeps the cards and then goes Home;
    - change password, by an emailed code (Story 6.20);
    - delete account, in two steps, behind the exact, case-sensitive `DELETE` (Story 6.10);
    - export through the share sheet, and import behind its preview;
    - the manual sync and its live relative time;
    - theme and language, each applied, saved, announced and closed on choosing;
    - the full-brightness switch, off by default (Story 16.39);
  - the success toasts, the haptics, the announcements and every navigation target;
  - every testID the Code Map keeps;
  - the wording of every string that stays. Each new string goes in `en.ts` and `it.ts`.
- **House rules:**
  - theme roles only, with no hex literal in a component. `shared/theme/tokens.generated.ts` wins
    over `docs/project-context.md`'s pre-rebrand colour list;
  - type from `TYPOGRAPHY`;
  - Lucide icons, each imported from `lucide-react-native/icons/<name>`;
  - every tappable at least `TOUCH_TARGET.min`;
  - no `Pressable` style callback. Pressed visuals come from `onPressIn`/`onPressOut` state;
  - safe-area insets on every edge control;
  - `const` arrow functions.
- **Library APIs.** Check every API against Context7 or the installed source in `node_modules/`
  before using it; nothing is implemented from memory. The pinned versions are:
  - Expo SDK 55, React Native 0.83.6, React 19.2.0, expo-router 55.0.13;
  - react-native-reanimated 4.2.1, react-native-safe-area-context 5.6.2;
  - react-native-unistyles 3.2.5, lucide-react-native 1.52.0.

**Decided (ifero, 2026-10-15):**

- **The guest Sync row:** kept hidden for guests, as shipped (Stories 7.7 and 13.6). Frame B is
  overruled.
- **Confirmations outside settings:** the rule is settled here and only settings moves. The record
  says every confirmation is the confirm sheet, and card detail's Delete and edit's Discard move in
  a follow-up.
- **"What We Collect":** restored as an About row after Privacy Policy, opening `/data-summary`. That
  is one row more than frame A.
- **Spec size:** kept whole, well over the 1,600-token target.

**Never:**

- Commit, push, or change `docs/sprint-artifacts/sprint-status.yaml` or any other tracker file. The
  orchestrator owns all three.
- Change any of these:
  - `Button`;
  - the root stack's `screenOptions`, whose MaterialIcons `headerLeft` belongs to #258 item 11, or
    any route's options other than `settings`';
  - how `MultiCodePickerSheet`, `SortFilterRow`'s sort sheet or card detail draw, beyond the shared
    row's chevron, its padding and its label wrapping under large text;
  - the auth screens, `core/`, the watch apps;
  - the settings hooks, beyond what Design Notes name for `useExportData`.
- Draw any control disabled other than the type-to-confirm gate. Never put a tint in a sheet, or an
  icon other than the selected option's check, or show a toast for a failure that its sheet already
  shows.

## I/O & Edge-Case Matrix

| Scenario       | Input / State                                 | Expected Output / Behavior                                                                                                                                                                                                                                                          | Error Handling                                                                        |
| -------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Signed in      | `/settings`, signed in, light or dark         | Frame A: the header "Settings" with its back; the account group; PREFERENCES (Theme, Language, the full-brightness switch); DATA (Export Data, Import Data, Sync); ABOUT (Help & FAQ, Privacy Policy, What We Collect, App Version, Catalogue), as Design Notes order and draw them | N/A                                                                                   |
| Guest          | signed out                                    | Frame B: the guest group ("Not signed in yet", its body, Create Account above Sign In), then PREFERENCES, DATA with no Sync row, and ABOUT                                                                                                                                          | N/A                                                                                   |
| Information    | App Version, Catalogue                        | at full strength with their values, not buttons, each read as its label and its value                                                                                                                                                                                               | N/A                                                                                   |
| Pick one       | Theme or Language pressed                     | Frame C: the sheet titled "Theme" or "Language", its options edge to edge with the current one checked, and Theme's helper beneath                                                                                                                                                  | choosing applies, saves, announces and closes, as today                               |
| Confirm        | Sign Out pressed                              | Frame D: "Sign Out?" and its body, then Sign Out (destructive) above an outlined Cancel, both 52 tall and 8 apart                                                                                                                                                                   | Cancel, the scrim and Android back close it, as today                                 |
| Delete         | Delete Account, then Continue, then the field | step 1 in frame D's shape: "Delete Account?", its body, Continue (destructive) above Cancel. Step 2 is frame F: its title and body, the labelled field, then Delete Account at 40 % above Cancel, live only while the field holds exactly `DELETE`                                  | any other text, case included, keeps the gate shut                                    |
| Keyboard       | the delete field focused                      | the sheet rests on the keyboard's top edge, showing the field and both actions                                                                                                                                                                                                      | Android is unverified on this host                                                    |
| Export         | Export Data pressed, with cards or with none  | with cards, frame D's shape: "Export Your Cards", Export (primary) above Cancel. With none, frame E: "Nothing to Export" and one OK                                                                                                                                                 | the share sheet and the success toasts, as today                                      |
| Import         | Import Data pressed                           | while the picker prepares, the Import row shows the spinner. A valid file opens the preview in frame D's shape: title, file name, counts, Import above Cancel. An invalid or empty file opens frame E with the hook's title and message, and one OK                                 | Import stays live with no new card; importing nothing new reports it in today's toast |
| Busy           | a sheet's action pressed                      | the pressed button keeps its look, shows a spinner and ignores presses; nothing else in the sheet dims or locks. The same holds for the Change Password row while its code is sent                                                                                                  | N/A                                                                                   |
| Request failed | sign out, delete or export rejects            | one `RequestErrorBanner`, the first thing in the sheet's content, announced; the sheet stays open; no toast for it                                                                                                                                                                  | the next press clears it while it runs; reopening the sheet starts without it         |
| Closing        | any sheet dismissed                           | it keeps its content while it slides out: delete stays on its step, the preview keeps its counts, the error keeps its title                                                                                                                                                         | N/A                                                                                   |
| Large text     | the largest accessibility size                | the header, labels and the switch's label grow or wrap; a value may truncate, as frame A sets it. In every sheet with actions, the text that does not fit in 80 % of the window scrolls and the actions stay on the sheet; a picker's options scroll                                | N/A                                                                                   |
| Screen reader  | VoiceOver or TalkBack                         | the screen title, the section heads, the guest title and every sheet title are headings; each sheet is announced by its title; rows are named by label and value; options report selected; the switch reports on or off                                                             | N/A                                                                                   |
| Shared rows    | card detail's MANAGE block                    | unchanged, apart from the shared row's Lucide chevron, its 12pt vertical padding, and labels that wrap under large text                                                                                                                                                             | N/A                                                                                   |

</frozen-after-approval>

## Code Map

- `features/settings/screens/SettingsScreen.tsx` -- the screen.
  - The state (`:44-56`), the hooks (`:58-102`) and the email load (`:104-118`).
  - The handlers:
    - `openExport` (`:123-130`);
    - `confirmSignOut` (`:139-165`) and `confirmDeleteAccount` (`:167-194`). Neither error is
      cleared when its sheet closes;
    - `startChangePassword` (`:205-231`).
  - The `ScrollView` (`:235-244`): 24 sides, 16 top, `gap` 24, and no top inset of its own, since
    the native header covers the top. An 8pt spacer follows (`:285`).
  - The sections (`:245-283`). The Sync row gets `isSyncing || isPreparing` (`:272`), so import's
    preparing state spins the Sync row, which guests do not have.
  - The sheets (`:288-351`). While closing, the preview and error props fall back to `0`, `''` and
    `invalidFileTitle` (`:317-335`).
  - Keep the testID `settings-screen-scroll`.
- `features/settings/components/` -- the sections:
  - `SettingsSection.tsx`: a `SectionHeader` and rows 8 apart, with no `Surface`;
  - `AccountSection.tsx`:
    - the card (`:30-70`): `surfaceElevated` at radius 12, a monogram avatar, "Signed in" in
      `captionMd`, and a hard-coded green dot with `settings.account.synced`;
    - its rows, in order: Sign Out; Change Password, which is `disabled` and `isLoading` while busy
      and hides its chevron; and Delete, which is destructive and named "Delete Account, destructive
      action";
  - `AccountSectionGuest.tsx`: a radius-12 card with a filled `verified-user` at 36, then Create
    Account (`flex: 1`) beside a 115-wide Sign In;
  - `PreferencesSection.tsx`: Theme (`brightness-6`) and Language (`language`), then the switch
    (`:52-86`) beside an always-filled MaterialIcons bulb that is hidden from assistive technology.
    Its comment explains why it is a `ToggleSwitch`;
  - `DataManagementSection.tsx`:
    - Export and Import, each with the value "JSON";
    - Sync: `common.actions.sync` and the relative time, with no chevron and a spinner, shown only
      when signed in (`:50`);
  - `AboutSection.tsx`: App Version and Catalogue first (`:28-48`), as `disabled` rows with a no-op
    `onPress`, then Help and Privacy. Nothing opens `/data-summary` today: only
    `app/_layout.tsx:268` declares it, titled `navigation.whatWeCollect` ("What We Collect",
    "Cosa raccogliamo").
  - Every one of these uses MaterialIcons (and `MaterialCommunityIcons` for Sync), inline style
    objects and `ActionRow` with `noPaddingHorizontal`.
  - Keep these testIDs:
    - `settings-account-card`, `settings-signout-row`, `settings-change-password-row`,
      `settings-delete-row`;
    - `settings-guest-card`, `settings-create-account-button`, `settings-sign-in-button`;
    - `settings-theme-row`, `settings-language-row`, `settings-auto-brightness-toggle`;
    - `settings-export-row`, `settings-import-row`, `settings-sync-row`;
    - `settings-app-version-row`, `settings-catalogue-row`, `settings-help-row`,
      `settings-privacy-row`.
- `features/settings/components/` -- the sheets. Each wraps the barrel's `BottomSheet` and keeps
  its testIDs. The three error texts' IDs move to their banners.
  - `ThemePickerSheet.tsx`: three 101-wide preview chips (`:42-107`) drawn from
    `LIGHT_THEME`/`DARK_THEME`, with a `check-circle`. Keep `theme-option-light|dark|system`.
  - `LanguagePickerSheet.tsx`: raw `Pressable`s with a MaterialIcons check, inset rules and no
    `selected` state (`:39-71`). Keep `language-option-<code>`.
  - `SignOutSheet.tsx`: a `logout` icon at 40, the title and body as children, Cancel above Sign
    Out at 48 and 10 apart, and the error text. Keep `signout-sheet`, `signout-cancel`,
    `signout-confirm` and `signout-error`.
  - `DeleteAccountSheet.tsx`:
    - it resets its step and text on `!visible` (`:30-35`). The sheet is still sliding out then,
      so step 2 flips back to step 1 on screen;
    - step 1: `warning-amber` at 40, Cancel above Continue;
    - step 2: a raw `TextInput` with `autoCapitalize="characters"` and no visible label, not
      editable while busy. Cancel sits above the confirm, which is labelled `common.actions.delete`
      and passes both `disabled={!canDelete || isLoading}` and `loading` (#268 item 13);
    - keep `delete-account-sheet`, `delete-cancel-step1`, `delete-continue-step1`,
      `delete-confirm-input`, `delete-cancel-step2`, `delete-confirm-step2` and `delete-error`.
  - `ExportConfirmationSheet.tsx`: `file-download` at 40, Export (primary) then a tertiary Cancel.
    Keep `export-confirmation-sheet`, `export-confirm-button`, `export-cancel-button` and
    `export-error-text`.
  - `ExportEmptyStateSheet.tsx`: OK at 48. Keep `export-empty-sheet` and `export-empty-close`.
  - `ImportPreviewSheet.tsx`: an icon and the title as children, a `surfaceElevated` file chip,
    centred count lines, then Import with `disabled={newCardsCount === 0}` and a tertiary Cancel.
    Keep `import-preview-sheet`, `import-preview-confirm` and `import-preview-cancel`.
  - `ImportErrorSheet.tsx`: icons, and a tinted banner of alpha composites (`warning + '1A'`,
    `info + '14'`, `:30-80`), chosen by its `variant` prop. Keep `import-error-sheet` and
    `import-error-ok`.
- `features/settings/hooks/useExportData.ts` -- on failure: `logger.error`, `setExportError` and an
  error toast (`:66-74`). `exportError` resets only when an export starts (`:30`). The other hooks
  stay as they are.
- `shared/components/ui/BottomSheet.tsx`:
  - its props (`:55-63`), the `Modal` (`:140-147`), the scrim (`:152-161`) and the sheet
    (`:162-194`);
  - `paddingBottom: max(20, insets.bottom + 8)` (`:170`) and `maxHeight: '80%'` (`:213`);
  - the content always sits 16 below the text (`:240-242`);
  - the title and description never scroll, and the content takes `flexShrink`, so at the largest
    sizes the content collapses (#266 item 15);
  - it handles no keyboard.
  - `MultiCodePickerSheet` holds a `FlatList` in its content, so the sheet's body cannot become a
    `ScrollView` for every caller; `SortFilterRow` is the other caller outside settings.
- `shared/components/ui/ActionRow.tsx`:
  - its props (`:11-26`); `onPress` is required;
  - the label is one line (`:97-102`), and the value one line (`:114-121`);
  - the name is `accessibilityLabel ?? label` (`:60`), so the value is never announced;
  - the spinner (`:122`) and the MaterialIcons chevron (`:123-125`);
  - plain rows pad 16 across and 6 down (`:49`, `:72-73`), and `disabled` draws at 0.6 (`:74`).
  - Its only other caller is card detail's MANAGE block (`CardDetails.tsx:437-462`): plain rows
    with `showBottomBorder={false}`, whose Edit is `disabled={isDeleting}`. That stays.
- `shared/components/ui/FormScreen.tsx`:
  - the header (`:175-190`) and its styles (`:240-253`);
  - `BACK_GLYPH_INK_INSET` and `HEADER_PADDING_X` (`:25-33`);
  - its strings, `sharedUi.formScreen.*`.
- Other shared primitives:
  - `HeaderIconButton.tsx`: the 48 target holding a 24/1.5 Lucide glyph, with the 0.98 press. It
    imports nothing from Unistyles, on purpose;
  - `Surface.tsx` (`divided`: full-width rules between its children, radius 16, no padding) and
    `SectionHeader.tsx` (`overline`, `textSecondary`, the header role). `CardDetails` is the
    precedent for using both;
  - `ToggleSwitch.tsx`: a label and a 52 × 32 track. The label does not shrink, so under large
    text it pushes the track;
  - `TextField.tsx`: the `label-bold` label 8 above the input, the field idiom, and its queued iOS
    announcement. Its testID lands on the `TextInput`;
  - `RequestErrorBanner.tsx`: the failed-request idiom;
  - `Button.tsx` (unchanged):
    - `destructive` is borderless error text, with an 8 % wash when pressed, and draws at 40 % when
      `disabled`;
    - `loading` wins over `disabled`, and `size="large"` is 52;
    - `secondary` is outlined in `primary`;
  - `stories.test.tsx:96-97` asserts 14 story modules, from the map at `:47-65`.
- `app/_layout.tsx`:
  - `settings` (`:193-198`) has only a title;
  - the root `headerLeft` (`:124-134`) is not ours;
  - `card/[id]/edit` (`:222-229`) is the `headerShown: false` precedent, pinned by
    `test/root-layout.home-header.test.tsx`.
- `app/settings.tsx` -- a one-line re-export. Unchanged.
- `node_modules/react-native/Libraries/Components/Keyboard/KeyboardAvoidingView.js:80-110` -- the
  keyboard overlap uses the view's frame relative to its parent. Only a view whose frame is the
  modal's full-screen root measures it truly; one inside the sheet pads about 0. iOS keyboard
  events reach JS while a modal is up (`RCTKeyboardObserver.mm:29-36`). On Android the modal's
  Dialog is edge-to-edge, and its keyboard may reach JS only through the activity's root view
  (`ReactModalHostView.kt:329,391`; `ReactRootView.java:908-950`), which cannot be settled from
  the source alone.
- **Tests that pin things:**
  - `PreferencesSection.test.tsx`: `:87` looks for `icon-lightbulb`, the MaterialIcons mock;
    `:96-118` uses `UNSAFE_getByType(View)`; and `:133-134` reads the props;
  - `AccountSection.test.tsx`: `:81-102` asserts the order Sign Out, Change Password, Delete, and
    `:115` reads a label;
  - `AboutSection.test.tsx:56-61` reads `accessibilityState` from the mock;
  - every component test mocks `@/shared/components/ui` with only the primitives it uses, so any
    other primitive taken from the barrel is `undefined` there;
  - `SettingsScreen.test.tsx` renders the real primitives. It covers the delete flow
    (`:273-276`) and matches exact strings (`:234-235`, `:344`, `:363`, `:382`);
  - `fireEvent.press` climbs to the nearest `onPress` prop, so press tests go through
    `userEvent.press`, as `BarcodeFlash.test.tsx` does.
- `shared/i18n/locales/en.ts:114-238`, `it.ts`:
  - every frame string exists except "Sync Now", and the shipped "Sync" stays. The What We Collect
    row's label is `navigation.whatWeCollect`;
  - `settings.account.synced` is left dead by this story.

## Tasks & Acceptance

**Execution:**

- [x] `shared/components/ui/ScreenHeader.tsx` (+ test, + stories) -- new: `FormScreen`'s header,
      moved out so settings shares it rather than copying it. Its back is named "Go back" by a
      shared string, and like `FormScreen` and `HeaderIconButton` it imports nothing from
      `react-native-unistyles`.
- [x] `shared/components/ui/FormScreen.tsx` (+ test) -- draws `ScreenHeader`. Pixel-identical,
      with every testID kept.
- [x] `shared/components/ui/ActionRow.tsx` (+ test, + stories) -- the row rulings in Design Notes.
- [x] `shared/components/ui/OptionList.tsx` (+ test, + stories) -- new: the pick-one list in Design
      Notes.
- [x] `shared/components/ui/BottomSheet.tsx` (+ test, + stories) -- the actions, their scrolling
      and the keyboard, per Design Notes. The stories cover all four shapes.
- [x] `shared/components/ui/ToggleSwitch.tsx` (+ test) -- its label wraps beside the track.
- [x] `shared/components/ui/index.ts`, `stories.test.tsx` -- export the new primitives, register
      their story modules, and raise the count from 14 to 16.
- [x] `features/settings/components/SettingsSection.tsx`, `AccountSection.tsx`,
      `AccountSectionGuest.tsx`, `PreferencesSection.tsx`, `DataManagementSection.tsx`,
      `AboutSection.tsx` (+ tests) -- frames A and B, per Design Notes.
- [x] The eight sheets in `features/settings/components/` (+ tests) -- frames C–F, per Design Notes.
- [x] `features/settings/hooks/useExportData.ts` (+ test) -- drop the failure toast, keeping the
      log and `exportError`, and let the screen clear the error when the sheet opens.
- [x] `features/settings/screens/SettingsScreen.tsx` (+ test) -- the header and the ground, the
      composition, errors cleared on open, the Import row's spinner, and sheets that keep their
      content while closing.
- [x] `app/_layout.tsx` (+ `test/root-layout.home-header.test.tsx`) -- `settings` takes
      `headerShown: false`, so no native header flashes in the push.
- [x] `shared/i18n/locales/en.ts`, `it.ts` -- delete the strings this story leaves dead; add any it
      needs.
- [x] `docs/design/cardi/cardi-design-system.md` -- the record in Design Notes.

Unit-test every I/O row a test can observe. Each new check must be seen to fail under its mutation.

**Acceptance Criteria:**

- **The frames:**
  - Given settings signed in and as a guest, in light and dark,
  - when the screen shows and when each sheet opens,
  - then each draws its frame as Design Notes rule it, and nothing in `features/settings` imports
    `@expo/vector-icons`.
- **Destructive actions:**
  - Given the sign-out sheet and both delete steps,
  - when each shows its actions,
  - then sign out, delete's Continue and delete's confirm are each `Button`
    `variant="destructive"` at 52, above an outlined Cancel, and the type-to-confirm gate is the
    only control in settings drawn disabled.
- **Shared primitives:**
  - Given card detail's MANAGE block, the capture multi-code picker and the wallet's sort sheet,
  - when each is shown on the simulator,
  - then each draws as it did on `main`, apart from the shared row's chevron, its padding and its
    label wrapping under large text.
- **The record:**
  - Given `cardi-design-system.md`,
  - when this story's change is read against it,
  - then it holds a `### Settings` ruling section; its _Sheets_ section no longer calls the shipped
    sign-out and delete sheets "not the reference"; and its _Icons_ section no longer lists
    settings or `ActionRow`'s chevron as still on MaterialIcons.

## Implementation Notes

**Step 3 (2026-10-15).** A context-free subagent built this from the spec in about 88 minutes. Its
work was then checked against the diff, not against its report.

- **The orchestrator's own run.** `yarn typecheck`, `yarn lint` and `yarn format:check` pass, and
  so does `yarn test`: 210 suites and 3,617 tests, none skipped.
- **Matrix audit.** At step 3, every row mapped to tests that ran and passed, and rows that only a
  device can show (geometry, the keyboard) also went to the device check. The QA loop later found
  clauses whose tests could not fail; they are listed, and fixed, under the review loops.
- **Mutation pass.** The subagent ran 120 single-line mutations, one per new check, and each made a
  test fail. Its runner restored every file.
- **On the simulator.** "DS22-7 iPhone 16" (393pt, iOS 26.5), with Metro running from this worktree.
  - **How.** The subagent drove the app over Metro's debugger. It forced the signed-in state by
    patching the Supabase client in the running bundle. Every outbound call was held or refused
    first: sign out, delete, the reset email and sync. Nothing real was touched.
  - **Checked:** frames A–F in light and dark, the busy and failed states, delete's second step with
    the keyboard up, and the largest text size. Screenshots are in the session scratchpad's `shots/`.
  - **Against `main`:**
    - for the sort sheet and the multi-code picker, both captures turned out to be the same iOS
      camera-permission alert, so this comparison showed nothing (QA round 1, finding 1). The
      re-shoot is recorded under the review loops;
    - card detail's MANAGE block differs only in the Lucide chevron, and in labels centred in the
      same 48pt rows, 6pt lower than `main`'s.
  - **Fixed during it:**
    - the value's 46 % was measured after the icon, so "System (English)" truncated. The row is now
      one flex line;
    - under large text the label and the value now give way in proportion.
  - The full DEVICE CHECK follows review.
- **Beyond the task list:**
  - `ActionRow`'s chevron defaults to whether the row has an action, and its dead
    `noPaddingHorizontal` prop is gone;
  - the busy sheet buttons (Sign Out, Delete Account, Export and Import) keep their names through
    an `accessibilityLabel`;
  - strings left dead were deleted from both locales: `settings.account.synced`,
    `settings.export.failedTitle`, `settings.theme.pickerAccessibilityLabel` and
    `settings.language.picker.accessibilityLabel`. `sharedUi.formScreen.backAccessibilityLabel`
    moved to `sharedUi.screenHeader.backAccessibilityLabel`;
  - `BottomSheet`'s `children` is optional, and an empty child leaves no gap;
  - a test scans `features/settings` for `@expo/vector-icons`.
- **Readings:**
  - the pickers are now announced by their titles ("Theme opened", "Language opened") rather than
    "Theme picker opened", as the Screen reader row asks;
  - at 393pt the switch row's label wraps to two lines, so that row is 72 tall;
  - the keyboard-avoiding root reaches every sheet. The sort sheet and the multi-code picker would
    also rest on a keyboard if one were up; at rest both are pixel-identical to `main`.
- **Risks the subagent reported:**
  - at the largest text size, a one-word label beside a value can break mid-word ("Syn/c"), because
    React Native's layout has no min-content width;
  - also at that size, the theme picker's helper keeps its place while the options scroll, so
    System starts out of view. Both go to the device check;
  - export busy and Change Password busy were not shot. Both are unit-tested;
  - Android (no phone emulator here), VoiceOver and TalkBack were not run.

**Step 4 (2026-10-15), review pass 1.** The four layers raised 28 findings, logged as 33 rows in the
Review Triage Log.

- **Patched:** 12 groups, A–J, L and M, by the same subagent. It checked each new or strengthened
  assertion fails when its code is broken.
- **Deferred:** 5 groups, K and N–Q (7 rows). They are in `deferred-work.md` and in Found, not
  fixed 14–17, with a re-find noted against item 2.
- **Rejected:** 11 rows, each with its refutation.
- **No loopback.** Nothing traced to the frozen intent, or to a spec-prescribed mechanism that needed
  re-deriving.
- **Final run:** the four gates pass, with 210 suites and 3,622 tests.

**Device check (2026-10-15).** It ran against the final code, after review pass 1's patches.

- **Device:** the "DS22-7 iPhone 16" simulator (393 × 852pt, iOS 26.5). The live panel was requested
  and not granted (no answer), so the check ran headless.
- **How:**
  - Metro ran from this worktree. The served bundle was grepped for review pass 1's markers
    (`spinner-slot`, `continueToConfirm`) before any screenshot.
  - The subagent drove the app over Metro's debugger, targeting this device alone; two other
    simulators connected to the same Metro on their own and were not driven.
  - The signed-in state was a fake session in memory. Every outbound call was held or refused
    before anything was pressed, so nothing real was signed out, deleted, emailed or synced.
  - The orchestrator read every screenshot back against the frames and Design Notes.
- **Screenshots:** the session scratchpad's `shots/dc/` (71 shots), tiled for reading in
  `shots/dc-sheets/`.
- **Checked, light and dark:** frames A and B; the Theme and Language sheets; sign out, delete's
  first step, export and the import preview; nothing to export and the import error; delete's
  second step, empty, typed and with the keyboard up; the failed sign-out, delete and export
  banners; the Sync row idle and busy; card detail's MANAGE block.
- **Checked, light:** sign out, delete, export and import busy; Change Password busy; the Import row
  while the picker prepares; the largest text size on the screen and on every sheet; the wallet's
  sort sheet opened with the keyboard up.
- **Measured:**
  - Sync's value does not move while it syncs: "Never" spans x 268.67–315.33 in every shot, idle
    and busy differ by 0 px outside the 24pt slot, and the spinner is centred in it;
  - with the keyboard up at the default size, the field sits at y 315–359 and Cancel ends at 497,
    above the keyboard's top at 517;
  - card detail's rows are 48 tall, their labels centred on the row and 16 inside the surface, and
    the chevron is Lucide's 24/1.5 glyph in `textSecondary`.
- **Review row 28 settled:** with the wallet's search focused, pressing sort closes the keyboard as
  the sheet's modal presents, so no flow seen presents a sheet over an open keyboard.
- **Found at the default size:** nothing.
- **Found at the largest text size,** routed as loop findings:
  1. **Rows** (fixed, see below): a short label broke mid-word because the value took its room
     ("Syn|c", "The|me", "Versio|n"), every value dropped to one letter, and two ellipses drew
     clipped ("S..", "J..").
  2. **The Theme sheet** (fixed): the helper, pinned under the scrolling options, hid the selected
     System.
  3. **Delete's second step with the keyboard up** (fixed): the field was clipped by about 6pt above
     the pinned actions, against the frozen Keyboard row.
  4. **Delete's second step at the largest size, to the human.**
     - It opens with its field below the fold, under a three-line title, while Delete Account is
       disabled. The frozen Large-text row has the text scroll and the actions stay, and the field
       is one scroll away (one swipe for a screen reader).
     - With the keyboard up, after fix 3, the field shows whole but for its 1pt bottom border: the
       body stops scrolling where the focused input ends, not where its bordered box does.
     - One change would settle both: the body scrolls to the field when step 2 opens and when the
       keyboard shows. It is new behaviour, so it is not made here.
  5. **Wrapped button labels align left** ("Create | Account", "Delete | Account"). `Button`'s own,
     and the frozen Never list keeps `Button` out of this story: Found, not fixed 18.
- **Fixed** by the same subagent, each with a test it saw fail under its mutation:
  1. `ActionRow`: on a crowded line the value gives way first (`flexShrink` weighted 1,000 to 1),
     and at a font scale of 1.5 and up a value moves under its label and wraps;
  2. `OptionList` takes an optional `footer` inside its scroll view, and the Theme sheet's helper is
     that footer;
  3. `BottomSheet`: while the keyboard is up the sheet may take all the space above it, below the top
     safe-area inset.
  - The design record and Design Notes now say so. Jest's React Native mock reports a font scale of
    2, so other suites now render rows stacked; `ActionRow`'s own suite pins 1.
- **Re-shot** (`shots/dc2/`, with markers from each fix grepped from the served bundle first):
  - the default size, light and dark, differs from the first pass by 0 px, and card detail's MANAGE
    block too;
  - at xxxLarge every label is whole and only Language's value truncates, its ellipsis whole;
  - at AX1 and AX5 every value sits under its label, uncut, with the chevrons centred at the rows'
    ends;
  - the Theme sheet at AX5 opens with System, checked, in view;
  - delete's second step with the keyboard up shows the field and both actions at AX5, but for the
    field's 1pt bottom border (finding 4).
- **Readings, at AX5:** a word wider than its whole line still breaks, as no hyphenation exists to
  stop it: "Langua|ge" (about 268pt of ink in a 239pt column, beside its icon), "Passwor|d",
  "(English|)", the switch row's "brightn|ess", and the email.
- **Unchecked:** Android, for which this host has no phone emulator, and with it a sheet's keyboard
  on Android; VoiceOver and TalkBack; a real touch, since every press went over the debugger.

**Review loops (2026-10-15).** Each round's reviewer is a new Sonnet subagent, given a fresh diff.

- **Code round 1:** `VERDICT: APPROVED`, with zero comments. The code loop ends here.
- **QA round 1:** `CHANGES_REQUESTED`, 4 findings, all verified real:
  1. the step-3 "against `main`" comparison of the sort sheet and the multi-code picker compared two
     byte-identical captures of an iOS camera-permission alert, so these notes' "0 pixels" had no
     evidence behind it. Both are re-shot with the camera granted;
  2. the screen's wiring to its pickers and sheets was untested: replacing those props with no-ops
     left the suite green. Tests now press through each one;
  3. the Pick-one row's "announces" (theme) and "applies, saves, announces and closes" (language)
     had no assertions in the hooks' tests, which now spy the announcements;
  4. nothing pinned each settings row's `variant="plain"` and `showBottomBorder={false}`. A test now
     checks every rendered `ActionRow`, signed in and as a guest.

  The fixes, by the same subagent, are tests and the re-shoot only:
  - `origin/main` (`380507e`, this branch's base) was served from a detached worktree into the same
    binary, with the camera granted first. The sort sheet and the multi-code picker each differ from
    `main` by 0 pixels below the status bar; only the clock differs (`shots/qa1/`, read back here);
  - 18 wiring tests in the screen's suite, the row-shape test, and the two hooks' new assertions.
    Each of 28 mutations failed its test, and every source was restored byte for byte;
  - no production code changed, so the device check stands. The change sends the code loop round
    again.

- **Code round 2:** `CHANGES_REQUESTED`, 2 findings, both verified real, each a test that could not
  fail, shown with mutants in a scratch jest config:
  1. no test had an import error or a preview arrive after mount, so deleting the screen's
     keep-the-last-content block passed. And the closing tests read the kept content through hidden
     elements, so a sheet that never closed passed too;
  2. six values the screen hands down were unpinned: the theme and language selections, the
     brightness switch's state, and the preview's total, duplicate and invalid counts.

  The fixes are 8 tests in the screen's suite, by the same subagent: content arriving after mount;
  each import sheet closing once the hook clears it, asserted without hidden elements; and the six
  values, with hook values that differ from each other and from the defaults. Each of 12 mutations
  of `SettingsScreen.tsx` fails, and the file was restored byte for byte. Tests only, so the device
  check stands.

- **Code round 3:** `CHANGES_REQUESTED`, 3 findings, all verified real. The reviewer ran about 270
  single-line mutants in scratch copies; these were the only survivors that mattered:
  1. the export, import-preview and delete sheets' suites never pinned that their buttons sit in
     `BottomSheet`'s `actions` slot, so moving them into the scrolling children passed. The other
     three sheets' suites already killed that mutant;
  2. the slide-out test for the preview checked the file name and only one of its four counts;
  3. `BottomSheet`'s `PickOne` story still set the helper beside the options, the layout the device
     check replaced.

  The fixes, by the same subagent: a test in each of the three sheets' suites that finds its
  buttons inside the actions slot; the slide-out test asserting all four counts; and the story
  passing the helper as `OptionList`'s `footer`. Each of 6 mutations fails, and every source was
  restored byte for byte. Tests and a story only, so the device check stands.

- **Code round 4:** `CHANGES_REQUESTED`, 3 findings, all verified real, from about 550 mutants run in
  scratch copies:
  1. no sheet's suite pinned its own close through the scrim, Android back or the VoiceOver escape:
     deleting `onClose` on any of the six sheets' `BottomSheet` passed, as did deleting
     `import-error-sheet`'s testID;
  2. the visible text of the pickers' options, and of the Cancel, Export and Import buttons, was
     asserted nowhere;
  3. nothing pinned the switch row's `flex: 1` wrapper, which bounds the switch to the room beside the
     bulb.

  The fixes, by the same subagent: a scrim-and-back test in each of the six sheets' suites, and
  `ImportErrorSheet`'s OK found in its actions slot; the options' and buttons' visible text asserted;
  and the switch's wrapper given `testID="settings-auto-brightness-switch"`, with its `flex: 1`
  asserted. Each of 23 mutations fails, and every source was restored byte for byte. The one
  production edit is that testID, which draws and does nothing, so the device check stands.

- **Code round 5:** `CHANGES_REQUESTED`, 3 findings, all verified real. This time the reviewer also
  mutated lines unchanged from the baseline, and swapped theme roles:
  1. the visible labels of Continue, both OKs, Create Account and Sign In were asserted nowhere;
  2. the sheet title's colour role, `textPrimary`, was pinned by no test;
  3. nothing asserted that a successful export resolves `true`, which is what closes the sheet. The
     line predates this story, but it is the evidence for the Export row's "as today", as QA round
     1's hook gaps were for the Pick-one row.

  The fixes, by the same subagent, are tests only: the five labels read through their buttons; the
  title's colour asserted against `textPrimary` in light and dark; and the success resolving `true`.
  Each of 12 mutations fails, and every source was restored byte for byte, so the device check
  stands.

- **The code loop ends here, at ifero's call (2026-10-16):** "stop the code loop here and run QA
  round 2". Its rounds found 0, 2, 3, 3 and 3 findings, every one real and fixed with tests; by
  rounds 4 and 5 they came from sweeps of about 550 single-line mutants. It ended after round 5's
  fixes, with no round 6.
- **QA round 2:** `CHANGES_REQUESTED`, 7 findings, all verified real:
  1. the switch's off state, and its 48pt target, were asserted nowhere;
  2. the import error, the one sheet whose title is not a constant, was never shown announcing by
     it;
  3. nothing stopped an ABOUT row from gaining an icon;
  4. the import hook's empty-file branch and its two close functions ran in no test, and the screen
     suite's hook mock dropped the options the screen hands it;
  5. the screen's sign-out and delete `catch` blocks never ran, and their sheets' closing on success,
     and the "Account deleted" toast, were unpinned;
  6. no screenshot of the final code showed the Theme sheet at the default size: the first pass's
     shots predate the helper moving into the list's footer;
  7. step 3's "every row maps to tests that ran and passed" overstated it. Reworded above.

  The fixes, by the same subagent, are tests and a re-shoot only: the switch's off state and 48pt
  target; the arriving import error announced by its title; ABOUT's rows counted icon-free; the
  import hook's empty-file branch and close functions, with the screen's mock forwarding what the
  screen hands the hook; and the sign-out and delete failure and success paths. Each of 21 mutations
  fails, and every source was restored byte for byte. The Theme sheet re-shot at the default size
  from the final bundle (`shots/qa2/`, read back here) differs from the first pass by 0 pixels below
  the status bar, in light and in dark.

- **QA round 3:** `CHANGES_REQUESTED`, 4 findings, all verified real:
  1. four sheets' "<title> opened" announcements were unasserted (delete, export, nothing to
     export, import preview), so overriding their announced name passed;
  2. nothing pinned that the failed-request banner is spoken: an unspoken alert view in its place
     passed the sign-out, export and delete suites;
  3. "the pressed button keeps its look" while busy was pinned for Export only, not for Import,
     delete or sign out;
  4. Design Notes still said every sheet passes a description, and that no sheet draws an icon.
     Reworded above.
  - The reviewer also noted, without filing it, that step 3's capture of card detail's MANAGE block
    on `main` was taken under the same camera alert as QA round 1's finding 1. It is re-shot with the
    round's fixes.

  The fixes, by the same subagent, are tests and a re-shoot only: the four sheets' opened
  announcements; the banner's queued iOS announcement in the sign-out, export and delete sheets; and
  the busy look of Import (its fill), delete and sign out (the spinner's error colour on a
  transparent fill). Each of 10 mutations fails, and every source was restored byte for byte. Card
  detail's MANAGE block, re-shot on this branch and on `origin/main` with no alert (`shots/qa3/`,
  read back here), differs below the status bar in exactly two regions: the Edit row (the Lucide
  chevron, and the label 6pt lower) and the Delete row (the label 6pt lower). The rules sit at the
  same y and the rows are 48 tall on both.

- **QA round 4:** `CHANGES_REQUESTED`, 6 findings, all verified real. The reviewer ran about 790
  mutants with new operators (sibling swaps and removals, logic flips, attribute removals); every
  survivor was an order or a prop-effect clause:
  1. a row's own rule being suppressed was pinned only as a prop handed in, never as its effect;
  2. no test showed a failed request's banner still drawn while its sheet slides out;
  3. nothing pinned the sheet's order of title, description, content and actions, nor the
     no-actions body's shrink and padding;
  4. the account head, the guest group, the import preview and the switch row pinned their own
     order only by gaps, and the preview's invalid line had no style assertion;
  5. placement inside a row (icon, label, value, chevron), an option (label, check) and the header
     (back, title) was pinned only by gaps;
  6. the delete field's capitals, hint and label were asserted on the props handed to `TextField`,
     not on the input it renders.

  The fixes, by the same subagent, are tests only: a row's rule asserted present by default and
  absent when suppressed; each failed-request banner still drawn while its sheet slides out; the
  sheet's order and its no-actions body; each group's own order and the preview's invalid line; the
  placement inside a row, an option and the header; and the delete field's props read off the input
  itself. Order is asserted by tree index on exact JSON needles, so an accessibility label holding
  the same words cannot match. Each of 26 mutations fails, and every source was restored byte for
  byte, so the device check stands.

- **The QA loop ends here, at ifero's call (2026-10-16):** "stop the QA loop here and go to the
  handback". Its rounds found 4, 7, 4 and 6 findings, every one real, and each fixed with tests or a
  re-shoot. By round 4 they came from about 790 mutants of sibling order and prop effect. It ended
  after round 4's fixes, with no round 5.

**Walkthrough (2026-10-16).** ifero walked the change with `bmad-walkthrough`, dug into the
delete-account flow, and approved it on 2026-10-17. The deep dive found Found, not fixed 20; nothing
was changed for it.

### Found, not fixed

Found while planning, outside this story's mechanisms or belonging to another story:

1. **`LanguageListScreen` has been dead since Story 13.6.** No route or import reaches it; only
   `features/settings/index.ts:5` re-exports it, and only it reads `settings.language.movedToSheet`.
2. **A failed import confirm can show both import sheets.** `useImportData.ts:149-155` keeps
   `preview` and sets `errorState` together. Inferred, not run. Review pass 1 re-found it (row 7), and adds that the
   failed-request rule names only sign out, delete and export, so no ruling covers the import
   preview's failure.
3. **The sync row's relative time is outside i18n.** It is hard-coded in English and Italian
   (`core/utils/relative-time.ts:7,23`).
4. **`BottomSheet`'s hidden-while-leaving prop never reaches a device.** `Modal.js:326-347` forwards
   a fixed list of props, so `accessibilityElementsHidden={!visible}` (`BottomSheet.tsx:146`) holds
   only under Jest's mock, which spreads every prop.
5. **The wallet's sort sheet draws its own option rows** (`SortFilterRow.tsx:105-127,158-171`), with
   a 24/1.5 check, rather than the shared pick-one list.
6. **Capture's `CardTypeSelectionScreen` keeps its own copy of the header** (#268 item 11). It could
   move onto `ScreenHeader`.
7. **In dark mode, every secondary `Button` is beam.** Every Cancel and Sign In is outlined in beam,
   with a beam label (`Button.tsx:69-75`), while the design system keeps beam for focus, selection
   and the dark primary. The design system says nothing about a dark secondary.
8. **#266 item 15 stays open for the multi-code picker.** The scrolling this story gives
   `BottomSheet` comes with actions, and that sheet has none: it holds a `FlatList`.
9. **The design system specifies no pressed state for a destructive row.** `ActionRow` fills it with
   `surfaceElevated` when pressed (Story 22.3's Found, not fixed 3), while a destructive button takes
   an 8 % wash of its label colour.
10. **No ruling covers signing out with unsynced changes.** Story 6.9 is silent, and
    `SettingsScreen.tsx:139-165` gives no warning.
11. **The Italian keyword is the English `DELETE`** (`it.ts:227`). No record says why.
12. **The bundled fonts' licence suggests a credit** (#248 item 8), and the app has no licences
    screen.
13. **Card detail's Delete and edit's Discard still use the platform alert** (`CardDetails.tsx:299`,
    `CardEditScreen.tsx:95`). By decision 2 they move onto the confirm sheet in a follow-up.

Deferred by review pass 1 (2026-10-15; Review Triage Log rows in brackets):

14. **A request keeps running after its sheet is closed** [6, 26].
    - Cancel, the scrim, Android back and the VoiceOver escape stay live while sign out, delete or
      export runs, as the frozen Busy row has it, and nothing stops the request.
    - A delete or a sign-out that then succeeds still completes and goes Home after the user
      pressed Cancel, and export's share sheet still opens.
    - Pre-existing: those controls were live during the request before this change. A fix, either
      inert while busy or a real cancel, needs the frozen Busy row reopened.
15. **The delete field leaves autocorrect and predictive text on** [10, 31]. Accepting iOS's
    suggested DELETE appends a space, and the exact, case-sensitive gate stays shut with nothing
    saying why. Pre-existing; `autoCorrect={false}` on the field would close it.
16. **`docs/project-context.md` § Styling & Theming contradicts the Epic 22 code** [2]. It
    prescribes Unistyles' `StyleSheet.create((theme) => …)`, while every Epic 22 primitive and
    screen styles its geometry with React Native's `StyleSheet` and takes colours from
    `useTheme()`. It is an agent-context file, so it is not edited here; it adds to Story 22.6's
    Found, not fixed 12.
17. **`useImportData` still computes the error's `variant`, which nothing reads now** [33]
    (`useImportData.ts:24,67,87,94,154`). The frozen Never list keeps the hook unchanged.

Found by the device check (2026-10-15):

18. **A wrapped `Button` label aligns left** at the largest text size ("Create | Account" in the
    guest group, "Delete | Account" in delete's second step). It re-finds #248 item 10; the frozen
    Never list keeps `Button` out of this story.
19. **Card detail's details rows cut their values at the largest size** ("Number 2…",
    "Color D…lue", "Added O…6"), the problem `ActionRow` had before this story. They are
    `DetailRow`, Story 22.3's, which this story does not touch.

Found in the walkthrough (2026-10-16):

20. **A deletion that worked can be reported as failed** (`shared/supabase/auth.ts:439`). After the
    delete-account function succeeds, `signOut({ scope: 'local' })` still calls the server's logout
    (auth-js 2.105.1, `GoTrueClient.js:3191`). A 404, 401 or 403 is ignored, but a network failure
    returns an error before the local session is removed. The sheet then says the delete failed for
    an account that is gone, the app stays signed in, and every retry calls the function as a
    deleted user. Pre-existing, and outside this story's mechanisms.

## Spec Change Log

## Review Triage Log

**Pass 1 (2026-10-15).** Four layers reviewed one diff:

- Project Conventions (PC);
- Blind Hunter (BH);
- Verification Gap (VG);
- Edge Case Hunter (EC).

They raised 28 findings. Two were split across routes, and one holds four separate claims, which
gives 33 rows. Every one was verified at its cited location before routing. Nothing routes to
`intent_gap` or `bad_spec`, so there is no loopback.

| #   | Layer | Location                                                                                 | Claim                                                                                                             | Verdict     | Evidence                                                                                                                                                                                                                                                      | Route     |
| --- | ----- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | PC    | `features/settings/**`, `OptionList.tsx`, `ScreenHeader.tsx`                             | New code styles with React Native's `StyleSheet`, not Unistyles'                                                  | false       | Every Epic 22 primitive and screen does the same: geometry in React Native's `StyleSheet`, colours as theme roles from `useTheme()`, and no hex. Story 22.6's triage (rows 1–4) ruled the same finding false                                                  | reject    |
| 2   | PC    | `docs/project-context.md` § Styling & Theming                                            | The written styling rule contradicts the Epic 22 practice                                                         | low         | Real: it prescribes Unistyles' `StyleSheet.create((theme) => …)`, which no Epic 22 file uses, so an agent reading it would diverge from the code around it. The fix edits an agent-context file                                                               | defer (P) |
| 3   | PC    | `ScreenHeader.tsx:11-13`, `ScreenHeader.test.tsx:125-129`, `FormScreen.test.tsx:197-198` | The comments give a false reason for keeping these files out of Unistyles                                         | low         | Real: the plugin rewrites only the processed file's own `react-native` imports (`plugin/index.js:856-861`). It would swap these files' `View` and `Text`, never `HeaderIconButton`'s `Pressable`, which is its own module with its own guard                  | patch (A) |
| 4   | PC    | `SettingsScreen.test.tsx:40,66-76`                                                       | The theme mock hand-copies 11 hex values, and the ground assertion checks the mock against itself                 | low         | Real: the copies go stale silently, as the mock's pre-rebrand ones did. `jest.requireActual` of `LIGHT_THEME` keeps them true                                                                                                                                 | patch (B) |
| 5   | BH    | `SettingsScreen.tsx` `confirmSignOut`, `confirmDeleteAccount`, `confirmExport`           | A failure that lands after its sheet was closed is never seen                                                     | low         | Real: the error is set on a closed sheet and cleared on reopen, and export no longer toasts. It needs a close inside the request's window and then a failure, and the outcome stays visible: still signed in, no share sheet. The fix adds state and branches | reject    |
| 6   | BH    | the same handlers                                                                        | A success that lands after Cancel still deletes or signs out, and navigates                                       | medium      | Real, and pre-existing: Cancel, the scrim and back were live while a request ran before this change. Making them inert would change the frozen Busy row                                                                                                       | defer (K) |
| 7   | BH    | `useImportData.ts:149-155`                                                               | A failed import stacks the error sheet on the preview, and nothing rules it                                       | medium      | Real, and pre-existing (Found, not fixed 2). The frozen Never list keeps the hook unchanged                                                                                                                                                                   | defer (N) |
| 8   | BH    | `PreferencesSection.tsx:117-122`                                                         | The switch row stands 72 tall beside 48pt rows                                                                    | low         | At 393pt the label wraps to two lines, so 72 is a two-line row's 12, 48 and 12, as `ActionRow` draws one. Only where the label fits one line, a tablet, does `ToggleSwitch`'s own 48 add to the padding                                                       | reject    |
| 9   | BH    | `ActionRow.tsx`, the busy spinner                                                        | The spinner replaces the chevron 4pt narrower, so the value shifts while the row is busy                          | low         | Real: `ActivityIndicator` `small` is 20 and the chevron 24, so Sync's value jumps at every sync, against "the row keeps its look"                                                                                                                             | patch (C) |
| 10  | BH    | `DeleteAccountSheet.tsx`, the field                                                      | Autocorrect and predictive text stay on, so a suggested DELETE adds a space and the gate stays shut               | medium      | Real, and pre-existing: the shipped `TextInput` passed the same props, and the exact, case-sensitive rule is Story 6.10's                                                                                                                                     | defer (O) |
| 11  | BH    | `DeleteAccountSheet.tsx`, `BottomSheet.tsx`                                              | Moving to step 2 is silent for a screen reader, and focus stays on what is now the disabled Delete Account        | medium      | Real: the actions slot reuses the same `Button` across the steps, where the shipped steps remounted theirs, and the sheet announces only a change of visibility                                                                                               | patch (D) |
| 12  | BH    | `BottomSheet.tsx`, `useIsKeyboardShown`                                                  | Every mounted sheet listens to the keyboard, visible or not                                                       | low         | Real, but nothing shows it: a hidden `Modal` re-renders on a keyboard event. The fix needs a subscription per presentation                                                                                                                                    | reject    |
| 13  | BH    | `cardi-design-system.md` § Settings                                                      | Two statements are false for some sheets: every sheet passes a description, and every action stack ends in Cancel | low         | Real: the pickers and the import preview pass no description, and the two acknowledge sheets hold only OK                                                                                                                                                     | patch (E) |
| 14  | BH    | `cardi-design-system.md` § Settings                                                      | Two clauses read as their opposite: the icon, chip and tint list, and "no placeholder, the hint and capitals"     | low         | Real: one can be read as permitting a chip or a tint, the other as forbidding the hint and the capitals the field has                                                                                                                                         | patch (F) |
| 15  | BH    | `cardi-design-system.md`, the confirmation rule                                          | Its follow-up names no issue                                                                                      | low         | The follow-up is Found, not fixed 13, which becomes the story's one follow-up issue at the handback. There is nothing to link yet                                                                                                                             | reject    |
| 16  | BH    | `PreferencesSection.test.tsx:52`                                                         | The test is named for the uppercase style but asserts only the heading                                            | low         | Real: no `textTransform` assertion                                                                                                                                                                                                                            | patch (G) |
| 17  | BH    | `SettingsScreen.test.tsx:553`                                                            | "At full strength" asserts no opacity                                                                             | low         | Real: it checks the names and the missing button role only                                                                                                                                                                                                    | patch (M) |
| 18  | BH    | `useExportData.test.ts:176`                                                              | The retry's clear is checked only after the retry                                                                 | medium      | Same defect as row 25                                                                                                                                                                                                                                         | patch (H) |
| 19  | BH    | `SettingsScreen.test.tsx`                                                                | Delete's clear on the next press is untested                                                                      | medium      | Same defect as row 24                                                                                                                                                                                                                                         | patch (I) |
| 20  | BH    | `AboutSection.tsx:50`                                                                    | The What We Collect row borrows the route's title string                                                          | false       | The row names the screen it opens by that screen's own title, so the two cannot drift apart, and Design Notes rule this string                                                                                                                                | reject    |
| 21  | BH    | `SettingsScreen.test.tsx:853`                                                            | The vector-icons ban walks the filesystem rather than using ESLint                                                | low         | A real difference, but the test enforces the criterion in CI as it stands. ESLint would need a new flat-config block that re-lists the Lucide root-import ban                                                                                                 | reject    |
| 22  | BH    | `SettingsScreen.tsx:289`                                                                 | While the email loads, the head reads "Signed in, Signed in user"                                                 | low         | Shown only until the local session read resolves, or for an account with no email, which email sign-up never makes. The fallback is shipped copy                                                                                                              | reject    |
| 23  | VG    | `SettingsScreen.tsx:166-171`                                                             | A failed export never runs through `confirmExport` in a test                                                      | medium      | Pre-verified: closing the sheet whatever the result passed 42 of 42                                                                                                                                                                                           | patch (J) |
| 24  | VG    | `SettingsScreen.tsx:201-203`                                                             | Delete's clear on the next press is untested                                                                      | medium      | Pre-verified: removing `setDeleteError(null)` passed 42 of 42                                                                                                                                                                                                 | patch (I) |
| 25  | VG    | `useExportData.test.ts:176-184`                                                          | The clear-on-retry test asserts only after the retry resolves                                                     | medium      | Pre-verified: moving the clear to the success path passed 7 of 7                                                                                                                                                                                              | patch (H) |
| 26  | EC    | `DeleteAccountSheet.tsx`, `SignOutSheet.tsx`, `ExportConfirmationSheet.tsx`              | Cancel, the scrim or back during a request lets the request complete                                              | medium      | Same as row 6                                                                                                                                                                                                                                                 | defer (K) |
| 27  | EC    | `SettingsScreen.tsx:173-228`                                                             | A failure after the sheet was dismissed is never shown                                                            | low         | Same as row 5                                                                                                                                                                                                                                                 | reject    |
| 28  | EC    | `BottomSheet.tsx`                                                                        | A sheet presented over an open keyboard never lifts, and its padding still drops to 20                            | maybe-false | Whether any flow presents a sheet over an open keyboard is open (the wallet's search field, then sort). If one does, it is low: the sheet was covered before this change too, and the 22pt it loses is under the keyboard. Settle it on the simulator         | reject    |
| 29  | EC    | `SettingsScreen.tsx:240-266`                                                             | Sign Out or Delete opened during Change Password's send pushes the OTP screen beneath the sheet                   | low         | Real, and pre-existing: the other rows were live during the send before this change. It needs a tap inside the send's window, and the fix adds guards                                                                                                         | reject    |
| 30  | EC    | `DeleteAccountSheet.tsx:66-87`                                                           | Step 2 is silent, and focus stays on a reused control                                                             | medium      | Same as row 11                                                                                                                                                                                                                                                | patch (D) |
| 31  | EC    | `DeleteAccountSheet.tsx:108-116`                                                         | A predictive suggestion adds a space and keeps the gate shut                                                      | medium      | Same as row 10                                                                                                                                                                                                                                                | defer (O) |
| 32  | EC    | `BottomSheet.tsx:204-205`                                                                | The comment says a child that renders nothing leaves no gap, but only null, undefined and booleans are dropped    | low         | Real: a component element that returns null still counts. No caller passes one today                                                                                                                                                                          | patch (L) |
| 33  | EC    | `useImportData.ts`, `variant`                                                            | The hook still computes a variant that nothing reads                                                              | low         | Real but harmless. The frozen Never list keeps `useImportData` unchanged, so it is out of scope by the intent itself                                                                                                                                          | defer (Q) |

**Groups.** Patches A–J, L and M go to the step-3 subagent. Deferrals K and N–Q go to
`deferred-work.md` and to Found, not fixed.

## Design Notes

Measurements are in pt. The frames are drawn at 393 × 852 in light; `cardi-design-system.md` wins
any conflict.

**The screen.**

- **Ground.** `background`, in a safe-area view on the top, left and right edges. The list scrolls
  under the home indicator, so the bottom inset goes into its padding instead.
- **Header.** `ScreenHeader`, which is capture frame A's header and `FormScreen`'s. It is titled
  `navigation.settings`, and its back runs `router.back()`. The frame's 56pt bar with a 24pt title
  is overruled by the design system's _Forms_ ruling (Story 22.6): every stack-pushed screen has a
  17pt title, and Home is the one exception.
- **Body.** A `ScrollView`, keeping `settings-screen-scroll`.
  - Its content is padded 16 at the top, 24 at the sides, and 24 plus the bottom inset at the
    bottom.
  - The groups sit 24 apart, and each `SectionHeader` sits 8 above its group.
- **Groups.** `SettingsSection` is a `SectionHeader` over a `Surface divided`. Each row in it is a
  plain `ActionRow` with `showBottomBorder={false}`.
- **Order (frame A).**
  - The account group, with no head.
  - PREFERENCES: Theme, Language, then the full-brightness switch.
  - DATA: Export Data, Import Data, then Sync, which a guest does not see (decision 1).
  - ABOUT: Help & FAQ, Privacy Policy, What We Collect (decision 3), App Version, then Catalogue.
- **Icons.** Only PREFERENCES' rows lead with one, each a Lucide glyph at 24/1.5 in `textPrimary`:
  - Theme takes `moon`, the frame's crescent;
  - Language takes `globe`;
  - the switch takes `lightbulb`, filled only while it is on. That is the design system's
    brightness-bulb ruling (Story 22.3), and card detail's glyph.

**The account group (frame A).** One `Surface divided`, keeping `settings-account-card`.

- **Its head** is padded 12/16:
  - "Signed in" in `overline` `textSecondary`;
  - the email 2 below it, in `bodyLg` `textPrimary`, wrapping rather than clipping;
  - one accessibility element, read as "Signed in, <email>".
- **Its rows:**
  - Change Password, with its chevron;
  - Sign Out, then Delete Account, each `destructive` with no chevron.
- **Gone:** the avatar, the "Synced" mark and the row icons. `settings.account.synced` is deleted
  from both locales.

**The guest group (frame B).** A `Surface` padded 24, centred, keeping `settings-guest-card`.

- "Not signed in yet" in `sheetTitle` `textPrimary`, announced as a heading.
- Its body 8 below, in `bodyMd` `textSecondary`.
- 24 below that, two full-width `Button`s 8 apart: Create Account (`primary`) above Sign In
  (`secondary`).
- **Size.** They take the default 48. The design system's _Buttons_ rule gives 52 only to a
  footer's primary and to a sheet's actions, which overrules the frame's 52.
- **Gone:** the shield.

**Rows (`ActionRow`).**

- **Shape.** Plain rows are padded 12/16, with 12 between their parts, so a one-line row stays 48.
- **Chevron.** Lucide `chevron-right` at 24/1.5 in `textSecondary`, the design system's chevron for
  every row (Story 22.5).
- **Text.** The label wraps rather than clipping. The value stays one line, ellipsised, at most
  46 % of the row, as frame A sets it.
  - On a crowded line the value gives way first, so the label breaks a word only when that word
    alone is wider than its room (device check, 2026-10-15).
  - At the accessibility text sizes (a font scale of 1.5 and up), the value moves under the label
    and wraps, and the chevron stays at the row's end (device check, 2026-10-15).
- **Name.** Each row is named by its label and its value.
- **With no `onPress`** a row is not a control. It has no button role and no press, draws at full
  strength, and is read as its label and value. Card detail always passes one.
- **`isLoading`.** The spinner takes the chevron's place. The row keeps its look, ignores presses,
  and is announced busy. Change Password's `disabled` while busy goes.
- **`disabled`** is unchanged, because card detail's Edit uses it.
- **DATA.**
  - Export Data keeps "JSON". Import Data has no value, as the frame draws it.
  - Sync keeps `common.actions.sync` and the relative time, takes the frame's chevron, and shows
    the spinner only while it syncs. The frame's "Sync Now" is not a string, and "Synced" is not
    real data.
  - While the document picker prepares, the Import row shows the spinner.
- **ABOUT.**
  - What We Collect is labelled `navigation.whatWeCollect`, takes its chevron and pushes
    `/data-summary`. Its testID is the new `settings-what-we-collect-row`.
  - App Version and Catalogue are the information rows.
- **The switch row.** The bulb, then `ToggleSwitch` with its label, padded 12/16. The label shrinks
  and wraps beside the track rather than pushing it off the row.

**Sheets (`BottomSheet`).**

- **Text.** Every sheet passes its own `title`, so it is announced by its title and the title is a
  heading, and its own `description` where it has one: the pickers and the import preview have none
  (QA round 3). No sheet draws a chip, a tint, or an icon other than the selected option's check.
- **An `actions` slot**, new and optional.
  - It sits 24 below what precedes it: the description, or the content. Its buttons are
    full-width at `size="large"` (52) and 8 apart.
  - Its order: the sheet's action (`destructive` for Sign Out and for both delete steps, `primary`
    for Export, Import and OK), then an outlined `secondary` Cancel.
  - With actions, the title, description and content scroll within the 80 % cap, and the actions
    stay pinned beneath them.
  - Without actions, a sheet draws exactly as today. That covers `MultiCodePickerSheet`,
    `SortFilterRow` and the pickers.
- **Keyboard.** While it is up, the sheet rests on the keyboard's top edge and may take all the
  space above it, below the top safe-area inset, and its bottom padding drops to 20. The device check
  (2026-10-15) replaced "within 80 % of the space above it", which clipped the field at the largest
  text size; the sheet still never exceeds 80 % of the window.
  - Use a keyboard-avoiding view whose frame is the modal's full-screen root. One inside the
    sheet pads about 0.
  - iOS takes `padding`. Android is reasoned from the installed sources, as `FormScreen` was, and
    recorded as unverified.
- **A failed request** is a `RequestErrorBanner`: the first thing in the content, 16 below the text.
  - Sign out, delete and export each show their error this way.
  - `useExportData` stops showing a toast for it, as Story 22.6 did for the save hooks: one failure
    gets one surface.
  - Each error clears when its sheet opens, and when the next press starts.
- **Closing.** A sheet keeps its content while it slides out:
  - delete resets its step and text when it opens, not when it closes;
  - the screen keeps the last preview and the last import error until their sheets have gone.

**Pick one (frame C), `OptionList`.**

- **Rows.** Each is at least 48, padded 12/24, and runs edge to edge: its rule spans the sheet and
  its label sits on the 24 margin. A rule sits above every option, none after the last.
- **Label.** `bodyLg` `textPrimary`, and it wraps.
- **Selected.** The option takes Lucide `check` at 20 with stroke 2, in `primary`: ink in light,
  beam in dark. It reports `selected`.
- **Press.** The row takes `surfaceElevated` while held, as `ActionRow` does.
- **Scroll.** When the options do not fit, they scroll.
- **Theme.** Light, Dark, then System. Its helper (`settings.theme.systemDescription`) sits 20
  below the last option, in `captionMd` `textSecondary`, and scrolls with the options, so they take
  the room first (device check, 2026-10-15). The preview chips go.
- **Language.** The options `useLanguagePreference` supplies, with no helper.
- Both keep their options' accessibility labels and testIDs.

**Confirm (frame D).**

- **Sign Out.** `signOutSheet.title` and `body`.
- **Delete, step 1.** `step1Title` and `step1Body`, with Continue.
- **Export.** `confirmTitle` and `confirmBody`, with Export.
- **Import preview.** `previewTitle`, then the file name and the counts as plain text on the
  margin. The counts are in `bodyMd` `textSecondary`, and the invalid line shows only when there
  are invalid entries.
  - Import is never disabled. With no new card, it imports nothing and today's
    `toastNoNewCards` toast says so.

**Acknowledge (frame E).** One `primary` OK.

- **Nothing to export.** `emptyTitle` and `emptyBody`.
- **Import error.** The hook's title and message. The `variant` prop goes, with the icons and the
  tint.

**Type to confirm (frame F), delete's step 2.**

- **Text.** `step2Title` and `step2Body`.
- **Field.** A `TextField` labelled `confirmInputLabel`: the `label-bold` label 8 above the input,
  the design system's spacing over the frame's 16. It has no placeholder, the `confirmInputHint`
  hint and `autoCapitalize="characters"`, and stays editable while deleting.
- **Delete Account** (`settings.account.deleteAccount`):
  - `disabled` until the field holds exactly `confirmKeyword`;
  - `loading` while deleting, which wins over `disabled`.

**Dark mode** (no frame draws it). Every value is a theme role:

- the ground `#000000`;
- the groups and the sheets in ink `#181824`, outlined `#3A3A48`;
- cream text, with muted `#B5B5AB`;
- the error `#FF453A`;
- the icons cream, the check beam, and the primary in beam with an ink label;
- the scrim stays ink at 40 %.

**Record** a `### Settings` section in `cardi-design-system.md`, headed "**RULED 2026-10-15
(Story 22.7)**, from `frames/cardi-settings-frames.html` and `stitch-prompts-settings.txt`". It
holds:

- every ruling above;
- `ScreenHeader` and `OptionList`, added to _Components_' table;
- _Sheets_: the actions slot, the scrolling and the keyboard. The shipped sign-out and delete
  sheets are now the reference;
- the confirmation rule (decision 2): every confirmation is the confirm sheet. Card detail's Delete
  and edit's Discard keep the platform alert until their follow-up;
- _Icons_: settings has moved, `ActionRow`'s chevron included.

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors.
- `yarn lint` -- expected: no errors, no warnings.
- `yarn format:check` -- expected: clean, untracked docs included.
- `yarn test` -- expected: all suites green.

**Manual checks:**

- **iOS simulator, 393pt, light and dark.** Check:
  - frames A and B;
  - Theme and Language (C);
  - sign out, delete's first step, export and the import preview (D);
  - nothing to export and the import error (E);
  - delete's second step, empty and typed, with the keyboard up (F);
  - the busy and failed states;
  - the largest text size, on the screen and on every sheet;
  - card detail's MANAGE block.
- **How.**
  - Shoot the signed-in frames by forcing the auth state over Metro's debugger: no real account
    and no real sign-in.
  - Hold or reject the sign-out, delete and export calls there, so nothing real is signed out or
    deleted.
  - The stories show every primitive in Storybook (`yarn storybook`).
- **Unchecked here:** Android, for which this host has no phone emulator, and with it Android's
  keyboard in a sheet; VoiceOver and TalkBack.

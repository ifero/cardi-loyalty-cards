---
title: 'Story 22.6: The Form Pattern — one form screen for card setup and card edit'
type: 'feature'
created: '2026-10-14'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'c0f47b32c772d97f95a177a66bf9e6e5590a6988'
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The app draws its forms three ways, and none anchors its primary action:

- `AuthScreenLayout` centres its content, with each screen's button inside the scroll;
- `CardForm` (card edit) is top-aligned on 32pt margins, with Save trailing the last field above
  `paddingBottom: 100`;
- card setup does not use `CardForm` at all. It hand-rolls its header, its fields and a footer with
  no rule and a 48pt Done.

On top of that, a field error is never announced on iOS, a failed save is only a toast, and no
primitive draws the request-failed banner the design system specifies.

**Approach:** Build the form pattern once, as a `shared/components/ui/` primitive drawn from
`docs/design/cardi/frames/cardi-form-frames.html` and `stitch-prompts-form-states.txt`, in light
and dark, with `cardi-design-system.md` winning any conflict. It has a header, a top-aligned body,
22.1's anchored footer, validation on the field and a failed request in one banner. Move
`add-card/setup` and `card/[id]/edit` onto it, and record every ruling in the design system.

## Boundaries & Constraints

**Always:**

- **The four states** are frames 1–4: default, error, filled and saving. Setup's custom mode is the
  drawn exemplar; catalogue setup and edit derive from it.
- **Errors have a direction** (design README, 2026-08-21):
  - validation sits on the field it concerns: its outline and its message in the error colour, no
    icon, no tint, the label still ink. Pressing the primary action reveals it, and that action is
    always enabled;
  - a failed request sits in one banner for the submission and never reddens a field.
- **Busy is not disabled.** The pressed primary keeps its fill, shows a spinner, is named
  "Saving...", and ignores further presses. Nothing else on the screen dims.
- **Keep what shipped:**
  - setup's params (`mode`, `brandId`, `brandName`, `brandColor`, `brandLogo`, `barcode`,
    `barcodeFormat`), its mount announcement, and the scan button's push to `/add-card/scan` with
    `returnToSetup`;
  - the validation rules. Setup requires a store name in custom mode and leaves the card number
    optional (Story 13.4). Edit requires a name of 1–50 characters, with its counter, and a card
    number, on a number pad;
  - edit's read-only format row, its dirty tracking, its discard prompt, its focus on the first
    invalid field, and the copy of its loading, invalid-id, not-found and load-failed states;
  - both save hooks' success paths: the haptic, the toast, `markDirty`, and the navigation
    (`router.replace('/')` with the highlight params after an add, `router.back()` after an edit);
  - the five colour keys and their accessibility labels, frozen by Story 21.2a;
  - every testID the Code Map keeps.
- **House rules:**
  - theme roles only, with no hex literal in a component. `docs/project-context.md`'s colour list
    predates the rebrand, and `shared/theme/tokens.generated.ts` wins over it;
  - type from `TYPOGRAPHY`;
  - Lucide icons, each imported from `lucide-react-native/icons/<name>`;
  - every tappable at least `TOUCH_TARGET.min`, with the 0.98 press scale driven by
    `onPressIn`/`onPressOut`;
  - safe-area insets on every edge control;
  - strings in `en.ts` and `it.ts`;
  - `const` arrow functions.
- Check every library API against Context7 or the installed source in `node_modules/` before using
  it. Nothing is implemented from memory. The pinned versions are:
  - Expo SDK 55, React Native 0.83.6, React 19.2.0, expo-router 55.0.13;
  - react-hook-form 7.74.0, @hookform/resolvers 5.2.2, zod 4.4.3;
  - react-native-safe-area-context 5.6.2, react-native-unistyles 3.2.5, lucide-react-native 1.52.0.

**Decided (ifero, 2026-10-14):**

- **Auth:** the card screens move onto `FormScreen` now. `AuthScreenLayout`, `ErrorBanner` and the
  auth screens stay as they are, and Story 22.9 moves them onto `FormScreen`. The field changes
  still reach the auth fields, because every form shares `TextField`.
- **Catalogue setup's brand block:** the brand's own wallet tile, at the wallet's 171 × 140,
  centred, with its name beneath: the card exactly as it will look in the wallet.
- **Spec size:** kept whole, well over the 1,600-token target.

**Never:**

- Commit, push, or change `docs/sprint-artifacts/sprint-status.yaml` or any other tracker file. The
  orchestrator owns all three.
- Change any of these:
  - the root stack's `screenOptions`, whose MaterialIcons `headerLeft` belongs to #258 item 11, or
    any route's options other than `card/[id]/edit`'s;
  - `AuthScreenLayout`, `ErrorBanner` or the auth screens (Decided);
  - `Button`, `PrimaryActionFooter`, `BottomSheet` or `Surface`, and `Tile` beyond drawing without a
    press when it is given no `onPress`;
  - the capture flow, beyond the import path that `HeaderIconButton`'s move needs:
    `BrandScannerScreen`, `ScannerOverlay`, `CardTypeSelectionScreen`'s behaviour,
    `useBarcodeScanner` and `useImageScan`;
  - format inference: `inferBarcodeFormat`, and when `CardForm` runs it;
  - `FormatPicker`, or the watch apps.
- Disable the primary action or draw a field disabled; add a card preview or helper text to the
  custom form's gap; add a scan button to edit; show a toast for a failed save.

## I/O & Edge-Case Matrix

| Scenario       | Input / State                                          | Expected Output / Behavior                                                                                                                                                                  | Error Handling                                                                |
| -------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| New card       | `/add-card/setup` with `mode: 'custom'`, light or dark | Frame 1: the header "New Card" with its back; STORE NAME; CARD NUMBER with the scan button beside the input; CARD COLOR with deep blue selected; the empty gap; Done in the anchored footer | N/A                                                                           |
| Catalogue card | `mode: 'catalogue'` with a resolvable brand            | "Card Setup", the brand's wallet tile with its name beneath (Decided), CARD NUMBER pre-filled from the scan and no scan button, Done                                                        | an unresolvable brand draws no tile, as today it draws no block               |
| Edit           | `/card/<id>/edit` for a saved card                     | "Edit Card" with its back; CARD NAME with its counter, BARCODE NUMBER, the read-only format and CARD COLOR; Save in the anchored footer                                                     | N/A                                                                           |
| Validation     | Done or Save pressed with a required field empty       | each invalid field takes the error outline and its message 4 below it; the first takes focus; the button stays enabled; nothing else turns red                                              | after that press the fields re-validate as the user types, clearing or erring |
| Filled         | every field holds a value                              | values in ink, the card number in mono, and no success mark of any kind                                                                                                                     | N/A                                                                           |
| Saving         | the primary pressed on a valid form                    | the button keeps its fill and shows a spinner, named "Saving..."; another press does nothing; the fields stay undimmed                                                                      | N/A                                                                           |
| Saved          | the save resolves                                      | add: the haptic, the toast, then Home with the new card highlighted. Edit: the haptic, the toast, then back to card detail. Both as today                                                   | N/A                                                                           |
| Request failed | the save rejects                                       | the banner shows the hook's message 16 above the first field, scrolled into view and announced; no field reddens; no toast; the button stays enabled                                        | the next press clears it while it saves; a second failure shows it again      |
| Scan           | the scan button on the custom form                     | the scanner opens with `returnToSetup`, as today                                                                                                                                            | N/A                                                                           |
| Keyboard       | a field focused                                        | the footer rests on the keyboard's top edge, and the body scrolls above it                                                                                                                  | N/A                                                                           |
| Leave edit     | the header's back, with unsaved changes or with none   | with changes, the discard prompt Android's back already shows; with none, straight back                                                                                                     | "Keep Editing" stays on the form                                              |
| Edit not ready | loading, an invalid id, not found, or a failed load    | the same header and back over the ground, with no footer and today's content                                                                                                                | N/A                                                                           |
| Large text     | the largest accessibility size                         | the header, labels, fields, banner and footer grow or wrap rather than clip; the body scrolls                                                                                               | N/A                                                                           |
| Screen reader  | VoiceOver or TalkBack                                  | the title is a heading; each field is named; a field error and the banner are announced as they appear, on both platforms; the busy button is named "Saving..."                             | N/A                                                                           |

</frozen-after-approval>

## Code Map

- `features/add-card/screens/CardSetupScreen.tsx` -- setup, which does NOT render `CardForm`:
  - its own `useState` form (`:112-117`), with the store name checked on Done only (`:119-128`) and
    the error cleared on the next keystroke (`:220-223`);
  - `BrandHeader` (`:58-77`), whose disc is `rgba(255, 255, 255, 0.2)` (`:318`);
  - its own header, with a MaterialIcons chevron 28 (`:185-204`);
  - a `KeyboardAvoidingView` with `behavior` `undefined` on Android (`:180-183`);
  - a footer with no rule, holding a 48pt `Button` with `loading` and `disabled` (`:259-270`);
  - React Native's `StyleSheet` (`:276-350`).
  - Keep: the params (`:48-56`), the announcement (`:87-93`), the brand resolution (`:95-110`), the
    catalogue colour and its fallback (`:115`, `:142`), the inline scan push (`:161-173`).
- `features/cards/components/CardForm.tsx` -- edit's form. `CardEditScreen` is its only consumer.
  - react-hook-form with zod (`:34-41`, `:91-108`), on `mode: 'onChange'` (`:107`).
  - Its own `KeyboardAvoidingView` and `ScrollView` on `paddingHorizontal: 32`, with
    `paddingBottom: 100` (`:149-158`, `:245-248`).
  - Save inside the scroll (`:226-235`), named "Saving..." while busy (`:232`).
  - The format row (`:205-210`) and the feature-local `ColorPicker` (`:27`, `:212-221`).
  - The inference skip (`:113-124`) stays as it is.
- `features/cards/screens/CardEditScreen.tsx` -- the load (`:48-72`); the discard prompt, wired to
  Android's `BackHandler` only (`:84-110`); `Stack.Screen` options (`:124-129`, `:148-152`,
  `:188-193`); the loading and error states (`:120-183`); the form (`:194-208`). A default export.
- `app/_layout.tsx`:
  - the root `headerLeft` (`:124-134`): MaterialIcons and `router.back()`. Not ours;
  - `add-card` hides its header (`:186-191`);
  - `card/[id]/edit` has only a title (`:222-227`). Its `headerShown: false` goes here, so no
    native header flashes during the push.
- `app/add-card/setup.tsx`, `app/card/[id]/edit.tsx` -- one-line re-exports. Unchanged.
- `features/add-card/screens/CardTypeSelectionScreen.tsx` -- the header precedent:
  - `BACK_GLYPH_INK_INSET` and `HEADER_PADDING_X` (`:36-43`) put the chevron's drawn stroke on the
    24pt margin;
  - the header itself (`:84-94`, styles `:130-143`), which takes `minHeight` 48.
- `features/cards/components/HeaderIconButton.tsx` (+ test) -- the 48pt target holding a 24/1.5
  Lucide icon, with the 0.98 press. It imports nothing from `react-native-unistyles`, on purpose.
  - The Babel plugin processes `app/` and every file that imports unistyles (`babel.config.js`), so
    the move must keep it that way.
  - Its importers are `CardTypeSelectionScreen.tsx`, `CardDetailScreen.tsx` (+ test) and
    `HomeHeaderButtons.tsx` (+ test). `CardDetailHeader.tsx` only names it in a comment, and the
    moved test's Unistyles guard still covers it.
  - `shared/` may import only `core`, `catalogue` and `shared` (`eslint.config.mjs:229-232`), and
    `auth` may not import `cards`.
- `shared/components/ui/PrimaryActionFooter.tsx` -- `insetBottom={false}` is this shape: a
  `SafeAreaView` with its bottom edge outside the `KeyboardAvoidingView` (`:17-21`).
- `shared/components/ui/TextField.tsx`:
  - the fill is `surfaceElevated` (`:163-165`), the padding 12 (`:206`), the label gap 6 (`:185`),
    and the placeholder `textTertiary` (`:145`);
  - the focus outline is `primary` (`:110-115`);
  - `rightAdornment` sits inside the box (`:166`, `:212-216`), and `mono` swaps the face
    (`:209-211`);
  - `FieldError`'s `accessibilityLiveRegion="polite"` (`:66-70`) is Android-only:
    `node_modules/react-native/Libraries/Components/View/ViewAccessibility.d.ts:241-245`.
- `shared/components/ui/Button.tsx` -- `loading` keeps the fill, swaps the label for a spinner,
  refuses presses and reports `busy` (`:120-167`). It has no accessible name while busy unless one
  is passed.
- `shared/components/ui/ColorPicker.tsx` -- today a 30pt disc in a 48pt ring, with inline styles,
  a `primary` ring and no check (`:45-73`). It iterates `CARD_COLOR_KEYS` (`:26`) and is used by
  setup and Storybook.
- `features/cards/components/ColorPicker.tsx` (+ test) -- the copy that goes: 48pt filled swatches,
  a contrast ring and a MaterialIcons check (`:54-82`), its own label (`:47`), and a `function`
  declaration (`:35`). Exported from `features/cards/index.ts`, whose barrel nothing imports.
- `features/add-card/components/InlineScanButton.tsx` -- MaterialCommunityIcons `barcode-scan`
  (`:9`, `:41`), a 0.6 opacity press (`:36`), and `hitSlop` 8 (`:39`).
- `features/cards/hooks/useAddCard.ts:97-109`, `useEditCard.ts:94-106` -- the failure toast that
  goes. Each hook already returns `error`, and resets it when a save starts (`useAddCard.ts:59`,
  `useEditCard.ts:55`); neither screen reads it.
- `features/cards/components/CardTile.tsx` -- the wallet's tile:
  - it always pushes `/card/<id>` on press (`:108-110`);
  - its size and radius (`:114-117`), and its fill (`:120`);
  - the mark it draws inside `Tile`: the logo at 85 % of the tile, the two-letter plate for a brand
    with no logo, or a custom card's initial (`:144-193`).
- `shared/components/ui/Tile.tsx` -- always a `Pressable` with the button role and the 0.98 press,
  even with no `onPress` (`:192-213`).
- `features/cards/utils/gridLayout.ts` -- `getGridTileWidth` and `getGridTileHeight` (`:141`,
  `:151`) give 171 × 140 at the 390 reference; `TILE_RADIUS` is 16 (`:99`).
- `features/auth/components/AuthScreenLayout.tsx` -- the centred treatment (`:60-70`).
  `features/auth/components/ErrorBanner.tsx` -- tinted, with an icon (`:29`, `:36`). Both stay
  (Decided).
- `shared/theme/tokens.generated.ts:30-70` -- the roles, light / dark:
  - `surface` `#FFFFFF` / `#181824`, `background` `#F0F0E8` / `#000000`, `border` `#D6D6CB` / `#3A3A48`;
  - `textPrimary` `#181824` / `#F0F0E8`, `textSecondary` `#55555F` / `#B5B5AB`;
  - `error` `#C41E1E` / `#FF453A`, `primary` `#181824` / `#FCCC0C`.

  `:9-15` maps the keys to the accents: `blue` is deep blue, `grey` azure, `orange` yellow.

- `shared/theme/typography.ts` -- `bodyLgStrong` 17/24/600 (`:101`), `bodyMd` 15/22 (`:103`),
  `labelBold` (`:115`), `captionMd` 13/18 (`:117`), `monoCode` 16/24/500 (`:125`).
- `node_modules/react-native/Libraries/Components/Keyboard/KeyboardAvoidingView.js`:
  - the overlap uses the view's parent-relative frame (`:98-110`);
  - Android listens only to `keyboardDidShow` and `keyboardDidHide` (`:211-212`);
  - with no `behavior` the view is a plain `View` (`:286-295`).
- `shared/components/ui/stories.test.tsx:88` -- asserts 11 story modules. `index.ts` holds the
  exports.
- **Tests that pin things:**
  - **Icon names asserted as text**, through the icon mock (`jest.setup.js:195-210`):
    `InlineScanButton.test.tsx:31` (`barcode-scan`), `CardForm.test.tsx:139` (`check`), and the
    cards `ColorPicker.test.tsx:76,83`. Lucide renders real SVGs, so assert on testIDs.
  - **Safe area.** `useSafeAreaInsets` throws without a provider. `CardForm.test.tsx` renders none,
    and `CardSetupScreen.test.tsx:49-57` mocks only `SafeAreaView`. Wrap the render in
    `StoryDecorator` (`EmptyState.test.tsx:29-32`) or mock the insets
    (`ScannerOverlay.test.tsx:58-60`).
  - **Narrow mocks:** `CardSetupScreen.test.tsx:98-100` mocks `@/core/utils`, and
    `CardEditScreen.test.tsx` mocks `CardForm` wholesale and `expo-router` with `back` only.
  - **Direct style reads:** the shared `ColorPicker.test.tsx:52,60` read `props.style.borderWidth`.
  - **Behaviour:**
    - the failure toast: `useAddCard.test.ts:223` asserts it, and `useEditCard.test.ts:79` (the
      missing-card path) expects one;
    - `CardForm.test.tsx`'s errors-while-typing tests (on `mode: 'onChange'`);
    - `CardSetupScreen.test.tsx:287`, where an empty card number saves. It must keep passing.
- **testIDs that stay:**
  - setup: `setup-back-button`, `store-name-field` (and `-error`), `card-number-field`,
    `inline-scan-button`, `color-picker` (and `-<key>`), `done-button`;
  - edit: `edit-card-form`, `card-name-input` (and `-error`), `barcode-input` (and `-error`),
    `format-display`, `save-button`;
  - edit's swatches move from `color-option-<key>` to the shared picker's `${testID}-<key>`.
- `shared/i18n/locales/en.ts`, `it.ts` (`common.actions.done`; `addCard.setup.*` `:546-558`;
  `cards.colors.*`, `cards.form.*`, `cards.add.*` `:583-630`; `cards.edit.*` `:672-687`) -- every
  string this story needs exists, including `addCard.selection.backAccessibilityLabel` ("Go back")
  for both backs. Review pass 1 gave the form its own shared strings instead (row 7):
  `sharedUi.formScreen.backAccessibilityLabel` and `sharedUi.formScreen.saving`.

## Tasks & Acceptance

**Execution:**

- [x] `features/cards/components/HeaderIconButton.tsx`, `HeaderIconButton.test.tsx` -- `git mv`
      both to `shared/components/ui/`, export the component from `index.ts`, and update the
      importers the Code Map lists. The form's header needs it, and `shared/` cannot import a
      feature.
- [x] `shared/components/ui/TextField.tsx` (+ test, + `TextField.stories.tsx`) -- the field rulings
      in Design Notes.
- [x] `shared/components/ui/RequestErrorBanner.tsx` (+ test, + stories) -- new: the banner in
      Design Notes.
- [x] `shared/components/ui/ColorPicker.tsx` (+ test, + story) -- the frame's picker, per Design
      Notes.
- [x] `shared/components/ui/FormScreen.tsx` (+ test, + stories) -- new: the pattern. Its stories are
      Default, Error, Filled, Saving and Request failed, which the smoke test renders in light and
      dark.
- [x] `shared/components/ui/index.ts`, `stories.test.tsx` -- export the new primitives, register the
      two new story modules, and raise the count from 11 to 13.
- [x] `features/add-card/components/InlineScanButton.tsx` (+ test) -- the frame's scan button.
- [x] `features/cards/hooks/useAddCard.ts`, `useEditCard.ts` (+ tests) -- drop the failure toast;
      keep `error`, the error haptic and `logger.error`.
- [x] `shared/components/ui/Tile.tsx` (+ test) -- with no `onPress`, draw without a press: no
      button role and no press scale. `CardTile` always passes one, so the wallet is unchanged.
- [x] `features/cards/components/CardTile.tsx` (+ test) -- share the brand mark it draws inside the
      tile, so setup's tile draws the same one. The wallet's tile is unchanged.
- [x] `features/add-card/screens/CardSetupScreen.tsx` (+ test) -- onto `FormScreen`, per Design
      Notes, with the brand's wallet tile (Decided).
- [x] `features/cards/components/CardForm.tsx` (+ test) -- onto `FormScreen`, with its header props;
      the validation timing; the shared picker under a `FieldLabel`.
- [x] `features/cards/screens/CardEditScreen.tsx` (+ test) -- the header's back runs the discard
      check; the loading and error states sit inside the pattern's header; its `Stack.Screen`
      options go; it hands the hook's `error` to the form.
- [x] `app/_layout.tsx` -- `card/[id]/edit` takes `headerShown: false`.
- [x] `features/cards/components/ColorPicker.tsx`, `ColorPicker.test.tsx`,
      `features/cards/index.ts` -- delete the copy and its export.
- [x] `docs/design/cardi/cardi-design-system.md` -- the record in Design Notes.

Unit-test every I/O row a test can observe. Each new check must be seen to fail under its mutation.

**Acceptance Criteria:**

- **The four states:**
  - Given setup's custom form and the edit form, in light and dark,
  - when each is shown empty, after an invalid press, filled, and while saving,
  - then each draws its frame: the pattern's header, fields 32 apart on 24pt margins, and the
    primary action anchored under its hairline. Errors sit only on the invalid fields, and the busy
    button keeps its fill.
- **One treatment:**
  - Given setup, in both modes, and edit,
  - then all three draw `FormScreen`: top-aligned, with the action in the footer and never in the
    scroll, and with no centring and no trailing padding.
- **The error idiom:**
  - Given an empty required field, when the primary is pressed, then the error is on that field
    and is announced on both platforms;
  - and given a save that rejects, then the banner carries the failure, no field turns red, and no
    toast shows.
- **Adoption:**
  - Given `add-card/setup` and `card/[id]/edit`,
  - then neither draws its own header, footer or keyboard handling.
- **The keyboard:**
  - Given a focused field,
  - then the footer rests on the keyboard. It is checked on iOS; Android is unverified on this
    host.
- **The record:** `cardi-design-system.md` holds every ruling below, and no longer says that
  `CardForm` gates on `!isValid` or that iOS never announces a field error.

## Implementation Notes

**Step 3 (2026-10-14).** A context-free subagent built this from the spec, and its work was then
checked against the diff, not against its report.

- **The orchestrator's own run of the four gates:** `yarn typecheck`, `yarn lint`,
  `yarn format:check` and `yarn test` (207 suites, 3,364 tests, none skipped) all pass.
- **Mutation pass.** The subagent ran about 76 single-line mutations, one per new check, and each
  made a test fail. One weak static-`Tile` test survived its mutation, and was strengthened until it
  failed.
- **On the simulator.** The subagent checked these on the "DS22-5 iPhone 16" simulator (393pt,
  iOS 26.5), with Metro running from this worktree. The screenshots are in the session scratchpad's
  `shots/` folder, 01–20. The full DEVICE CHECK is still to come, after review.
  - Setup's custom form: default, error, filled, saving and request failed.
  - Catalogue setup: a brand with a logo, and a params-only brand with no logo, which draws the
    plate.
  - Edit: default, error, saving, request failed and not found, plus the discard prompt from the
    header's back, with "Keep Editing".
  - A real add, which showed the toast and the new card on Home.
  - The keyboard: the footer rests on its top edge, and no padding is left after it hides.
  - The mono swap: the empty card number's placeholder in Inter and the typed value in JetBrains
    Mono, with no jump and no lost caret, so the `monoCode` fallback was not needed.
  - The largest text size: nothing clips and the body scrolls.
  - Dark: custom request failed, catalogue and edit default only.
- **Beyond the task list:**
  - three strings this story left dead were deleted from both locales: `cards.add.errorTitle`,
    `cards.edit.errorTitle` (the failure toasts' titles) and `cards.edit.cancel` (the native
    header's back title). Nothing references them;
  - `FormScreen` also exports `FormField`: a `FieldLabel` 8 above a control that is not a text
    input (the format row, the colour picker);
  - setup's two text fields gained an `accessibilityLabel`, so each is named by its label;
  - `test/root-layout.home-header.test.tsx` pins the edit route's `headerShown: false`.
- **Android's keyboard.** `FormScreen` gives Android `padding` too, but enables the
  keyboard-avoiding view only while the keyboard is up. Reading RN 0.83's `ReactRootView`, Android's
  `keyboardDidHide` reports the visible frame's height as `screenY`, and the view runs the hide
  through the same overlap sum, which would leave the status bar's height of padding under the
  footer. The reasoning is in the code and in the design record; it is unverified on a device.
- **Readings.**
  - At the largest text size the catalogue tile's name truncates ("Essel…"). That is the wallet
    tile's own one-line rule, kept because the tile is the wallet's. The full name stays in its
    accessibility label.
  - The scan button stays top-aligned against an input grown by large text, as the frame's row
    draws it.
- **Risks the subagent reported:**
  - VoiceOver and TalkBack were not run. When both of edit's fields err at once, iOS gets two
    announcements back to back, and the second may cut the first off;
    `AccessibilityInfo.announceForAccessibilityWithOptions` with `queue: true` exists in RN 0.83;
  - the dark screenshots are partial.

**Step 4 (2026-10-14), review pass 1.** The four layers raised 37 findings, logged as 43 rows in the
Review Triage Log.

- **Patched:** 14 groups, A–E and H–P, by the same subagent. It checked each new assertion fails
  when its code is broken.
- **Deferred:** 9 groups, F, G and Q–W (13 rows). They are in `deferred-work.md` and in Found, not
  fixed 13–19, with re-finds noted against items 2 and 8.
- **Rejected:** 9 rows, each with its refutation.
- **No loopback.** Nothing traced to the frozen intent, or to a spec-prescribed mechanism that needed
  re-deriving.
- **Design Notes updated** to match the patches: the form's shared strings, and the queued iOS
  announcements.
- **Final run:** the four gates pass, with 207 suites and 3,372 tests.

**Device check (2026-10-14).** It ran against the final code, after review pass 1's patches.

- **Devices:** the "DS22-5 iPhone 16" simulator (393 × 852pt, iOS 26.5), with the live panel
  open, and "DS22-4 iPhone 16" (the same size) for the keyboard, because DS22-5 had a hardware
  keyboard attached.
- **How:**
  - Metro ran from this worktree, and the served bundle was grepped for the review patches' strings
    before any screenshot.
  - The subagent drove the app over Metro's debugger. It forced the saving, failed and loading
    states by holding or rejecting the database calls, and restored them afterwards.
  - The orchestrator read every screenshot back against the frames.
- **Screenshots:** the session scratchpad's `shots/` folder, `R1-*` (one overwritten by mistake),
  and `R1b-*` after the fix.
- **Checked, light and dark:**
  - setup's custom form: default, error, filled, saving and request failed;
  - catalogue setup, with a logo and with the two-letter plate;
  - edit: default, error, saving, request failed, loading, not found, and the discard prompt from
    the header's back;
  - the wallet grid, card detail and sign in, which share the changed primitives.
- **Checked, light:**
  - the keyboard up on both forms: the footer rests on its top edge (keyboard top 517, footer
    416–517);
  - the largest text size, on setup's custom form, catalogue setup and edit.
- **Measured:**
  - the header 48, with the chevron's ink on 24;
  - fields on 24pt margins, 48 tall, 32 apart, with labels 8 above;
  - the scan button 48 square, 8 right of a 289-wide input;
  - the selected swatch's gap at 52 and its ring at 56;
  - the banner 16 above the first field;
  - Done 52 tall, in a 101 footer ending at the bottom inset.
- **Found and fixed:** at the largest text size, edit's character counter ran 34.67pt off the
  screen ("17/5"), against the frozen Large-text row.
  - The label row now wraps, with an 8pt gap, and the counter keeps the row's end. At the largest
    size it drops under the label, right-aligned on the margin; at the default size the row is
    pixel-identical.
  - A `TextField` test pins the wrap and fails without it. Jest does no layout, so it pins the
    mechanism rather than the geometry.
  - Re-shot as `R1b-*`. The four gates then pass, with 207 suites and 3,373 tests.
- **Not reproduced:** review row 34 (Found, not fixed 14).
- **To the human,** at the largest text size:
  - the catalogue tile's name truncates ("Essel…"), the wallet tile's one-line rule. Decision 2a
    keeps the tile as the wallet draws it, while the Large-text row says labels wrap rather than
    clip;
  - unfocused single-line values truncate ("Farmaci…", "20000123…"), as any single-line input
    does. The fields themselves grow.
- **Unchecked:** Android, for which this host has no phone emulator; VoiceOver and TalkBack, whose
  announcements only unit tests pin; a real camera scan.

**Review loops (2026-10-14).** Each round's reviewer is a new Sonnet subagent, given a fresh diff.

- **Code round 1:** `CHANGES_REQUESTED`, 6 findings, all verified real and fixed:
  1. `FormScreen`'s order and fill were unpinned: the root's and the keyboard view's `flex`, the
     content's and the fields' `flexGrow`, header before body before footer. So were edit's centred
     loading and error states;
  2. the trailing slot's order, and its input column's `flex`, were unpinned;
  3. the frames' field order was unpinned, in setup and in edit;
  4. the colour row's `flexDirection` was unpinned (the deleted picker's test had carried it);
  5. "every other screen title is 17px", in the design record and in Design Notes, was false: Home's
     title is `headline-md`. Both now name it as the one exception;
  6. `FormScreen`'s testID doc omitted `-banner-slot`.

  The fixes are tests and docs only, so the device check stands. Each of the 12 mutations the
  reviewer named now fails its new assertion. The four gates pass, with 207 suites and 3,378 tests.

- **Code round 2:** `CHANGES_REQUESTED`, 1 finding, verified real and fixed. Round 1's reworded
  title sentence held only on iOS: `NAVIGATION_TITLE_FONT` sets no size, and
  `react-native-screens` sizes an Android title only when given one (`ScreenStackHeaderConfig.kt:281`).
  The design record and Design Notes now scope it to iOS. It corrects a stated fact, so it is not a
  nit. Docs only.
- **Code round 3:** `CHANGES_REQUESTED`, 3 findings, all verified real and fixed by the orchestrator.
  The reviewer swept every style property and one-line attribute this story added. These were its
  only survivors that change what is drawn:
  1. the design record's and Design Notes' dark paragraph outlined the banner in `#3A3A48`, but the
     banner takes the error role, `#FF453A` in dark (`RequestErrorBanner.tsx:40`);
  2. the form header's `alignItems: 'center'` was unpinned, though without it the title sits about
     12pt above the chevron;
  3. the swatch's centring was unpinned, though without it the check draws at the disc's top-left.

  Removing the header's `alignItems` now fails 1 of `FormScreen.test`'s 26 tests, and removing the
  swatch's centring fails 1 of `ColorPicker.test`'s 16. Both sources were restored byte for byte.
  Tests and docs only.

- **Code round 4:** `CHANGES_REQUESTED`, 4 findings, all verified real and fixed by the orchestrator.
  Each was a test that could not fail. The reviewer found them by deleting lines in a copy of the
  repository, and each deletion was re-run here before any fix:
  1. `fireEvent.press` climbs to the nearest `onPress` prop, and `Swatch`, `Tile`, `InlineScanButton`
     and `HeaderIconButton` each take one. So their press tests passed with the Pressable's own
     `onPress` deleted, the back of both forms included. They now press through the control's own
     responder with `userEvent.press`, as `BarcodeFlash.test.tsx` has since Story 22.4;
  2. no test pressed edit's back while the card loads, though that state draws its own header. The
     back test now runs in both the loading and the error state;
  3. nothing pinned the cleanup of the Android keyboard listeners. A test now counts the keyboard
     listeners before the form mounts and after it unmounts;
  4. nothing pinned the logo's glyph colour: `CardTile.test`'s `BrandLogo` mock dropped `color`. It
     now forwards it, and the mark's logo test asserts it.

  Each of the seven deletions now fails exactly one test, and every source was restored byte for
  byte. Tests only, so the device check stands. The four gates pass, with 207 suites and 3,380 tests.

- **Code round 5:** `VERDICT: APPROVED`, with zero comments. The code loop ends here, after 6, 1, 3,
  4 and 0 findings. A fresh diff matched the reviewed one byte for byte, so the reviewer changed
  nothing.
- **QA round 1:** `CHANGES_REQUESTED`, 5 findings, all verified real and fixed by the orchestrator:
  1. the record lacked two Design Notes rulings: that iOS announcements are queued, and that the back
     is named "Go back". A sweep of every ruling against the record found three more missing: the
     test IDs, the scan button's unchanged label and edit's `cards.edit.save`. The record now holds
     all five;
  2. nothing pinned that edit hands the form the card's format and colour (the Edit row). The load
     test now matches every default value;
  3. nothing pinned the name taking focus on an invalid Save (the Validation row): the one focus
     test made the name valid first. A test now saves the empty form and expects the name focused;
  4. no test read the input's 1pt outline or its ink value (the Validation and Filled rows). A test
     now pins both, filled and in error;
  5. nothing showed the banner growing at the largest text size (the Large text row), since no shot
     at that size has a banner. A test now pins the mechanism: no line cap and no fixed height. The
     banner itself was not shot at that size.

  Each of the six mutations now fails, where before all six passed, and every source was restored
  byte for byte. Tests and docs only, so the device check stands. The change sends the code loop
  round again. The four gates pass, with 207 suites and 3,384 tests. The first test run lost
  `signing-fingerprints.test.js` to the known Jest worker SIGSEGV; that suite passes alone, and so
  did the rerun.

- **Code round 6:** `VERDICT: APPROVED`, with zero comments, on the diff with QA round 1's fixes.
  The reviewer changed nothing.
- **QA round 2:** `CHANGES_REQUESTED`, 4 findings, all verified real and fixed by the orchestrator.
  Each was an absence the frozen block or the matrix states, which no test enforced:
  1. the fields stay undimmed while saving (the Saving row; "Nothing else on the screen dims"). The
     setup and edit busy tests now expect every input editable, and `FormScreen`'s expects no
     opacity on the body or the fields;
  2. a filled field draws no success mark (the Filled row). A test now counts the host elements of
     a filled field against the same field idle, and expects the idle fill and outline;
  3. an invalid field has no icon and no tint (the Validation row, the error idiom). A test now
     expects the message as the only element added, on the idle fill;
  4. edit draws its four fields and nothing else, with no scan button (the Edit row, and the frozen
     "add a scan button to edit"). Its order test now counts the fields and finds no scan button.

  Ten mutations (a disabled field in setup and in edit, two each; dimmed fields; a success mark; a
  tint; an icon; a scan button on edit; a helper line between edit's fields) all passed before and
  all fail now, and every source was restored byte for byte. Tests only, so the device check stands.
  The four gates pass, with 207 suites and 3,386 tests.

- **Code round 7:** `VERDICT: APPROVED`, with zero comments, on the diff with QA round 2's fixes.
  The reviewer changed nothing.
- **QA round 3:** `VERDICT: APPROVED`, with zero comments, on the same diff. Both loops end
  approved: code after 6, 1, 3, 4, 0, 0 and 0 findings, QA after 5, 4 and 0. The reviewer changed
  nothing.

### Found, not fixed

Found while planning. Each is outside this story's mechanisms, or belongs to another story. Filed
at ifero's request as [#268](https://github.com/ifero/myLoyaltyCards/issues/268) (backlog,
needs-triage); the numbers match, and the pointers below were re-checked against the branch.

1. **Edit never re-detects the format.** `CardForm.tsx:135-143` skips inference whenever
   `defaultValues.barcodeFormat` is set, and `CardEditScreen.tsx:172` always sets it. Changing a
   card's number keeps its old format.
2. **iOS swipe-back on edit skips the discard prompt.** Nothing in the repository uses
   `usePreventRemove` or `beforeRemove`.
3. **Setup has no discard prompt** (`CardSetupScreen.tsx:190-192`), though Story 2.2's AC8 had one.
4. **The scan button's round trip loses the typed store name and colour.** The scanner
   `router.replace`s itself with a new setup screen, carrying only the brand params and the code
   (`BrandScannerScreen.tsx:66-98`). The old setup stays beneath it, holding what was typed.
   Inferred from the code, not run.
5. **A failure after the write is reported as a failed save.** Both hooks keep `markDirty` (`:83`)
   and the success haptic (`:87`) inside the `try`. If either rejects, the card is saved but the
   user sees the failure, and retrying setup inserts the card twice. Inferred.
6. **The error haptic can escape.** Its rejection inside the `catch` becomes an unhandled
   rejection (`useAddCard.ts:106`, `useEditCard.ts:103`). Inferred.
7. **Edit offers a colour that a catalogue card never shows.** `CardTile.tsx:183` draws the brand's
   colour whenever there is a brand.
8. **Back during a save pops twice.** Edit's `router.back()` runs after the user has already left.
   Inferred.
9. **Auth's `ErrorBanner` is tinted and has an icon** (`ErrorBanner.tsx:29,36`), and `SignInScreen`
   reddens both fields on a failed request (`:100,134,154`). Both are Story 22.9's.
10. **Setup can save an empty card number**, by Story 13.4's rule. Story 16.37 assumed that
    unreachable (`16-37:212,292`). What card detail, the flash and the watches draw for one is
    unverified.
11. **`CardTypeSelectionScreen` keeps its own copy of the header geometry** (`:35-44`). It could
    move onto the form's header later.
12. **Two agent-context files are stale.** `docs/project-context.md` still lists the pre-rebrand
    colours, and `docs/architecture.md` still names NativeWind.

Deferred by review pass 1 (2026-10-14; Review Triage Log rows in brackets). Rows 13 and 38 re-found
item 2, with a fix to try: one `usePreventRemove` from `@react-navigation/native` 7.2.2, whose
native stack (7.14.12) passes `preventNativeDismiss` on iOS, would cover the header's back,
Android's back and the swipe. It needs `isDirtyRef` as state, and the save's own `router.back()` let
through. Row 37 re-found item 8, and adds a double tap on back.

13. **Two comments in files the Never list protects are stale** [14, 30]. `PrimaryActionFooter.tsx:18`
    calls `insetBottom={false}` "the `CardSetupScreen` shape", and `Button.test.tsx:157` says setup
    passes `disabled={isLoading}` with `loading`. `FormScreen` is that shape now, and
    `DeleteAccountSheet` is the remaining caller passing both.
14. **A form mounted while the keyboard is up would leave its footer covered** [34], until the next
    keyboard event. `KeyboardAvoidingView` seeds nothing on mount (`KeyboardAvoidingView.js:192-196`),
    as both old forms' views did. Unverified: focus setup's card number, take the scan round trip,
    and see whether Done is covered. The device check tried that on iOS and it did not reproduce:
    the scanner dismissed the keyboard, and the new setup mounted with it down and Done uncovered.
    The gap stays theoretical, and unchecked on Android.
15. **TalkBack may not announce a live region that mounts already filled** [41, 42], so a failed
    save's banner, and a field error, may go unheard on Android. The failure toast this story
    removed was announced. Unverified: it needs TalkBack on a device.
16. **A card saved with no number cannot be re-saved from edit** [39], which requires one, so a
    rename or recolour of it errs on Save. Story 13.4's rule meets Story 2.7's, and the frozen block
    keeps both.
17. **No form chains its fields with the return key** [25]: setup, edit and the auth screens alike.
    `TextField` already forwards `returnKeyType` and `onSubmitEditing`.
18. **Edit's number pad cannot retype a card number with letters** [26], which setup accepts and
    `inferBarcodeFormat` maps to CODE128, CODE39 or QR.
19. **An unresolvable catalogue brand, or an odd `mode`, saves an empty name** [27, 40] with no field
    to fix it, as the shipped screen did. The scanner always passes a resolvable brand or custom
    mode, so only a malformed route reaches it, and a new test pins the unchanged behaviour.

Found by the device check (2026-10-14):

20. **The wallet tile's glyph colour can sit at about 1.8:1.** `getLuminance` is a plain weighted
    sum of the sRGB channels, not WCAG relative luminance, so the tile's near-black threshold (0.2)
    reads `#7A1F5C` as 0.215 and deep blue `#0C3C84` as 0.215. Both then draw an ink glyph, on a
    brand's two-letter plate or a custom card's initial, where white would read. It is the wallet's
    rule (Story 22.2), and catalogue setup's tile shares it by decision 2a (`R1-catalogue-plate-*`,
    `R1-home-grid-*`).

## Spec Change Log

## Review Triage Log

**Pass 1 (2026-10-14).** Four layers reviewed one diff:

- Project Conventions (PC);
- Blind Hunter (BH);
- Verification Gap (VG);
- Edge Case Hunter (EC).

They raised 37 findings. Three were split across routes, which gives 43 rows. Every one was
verified at its cited location before routing. Nothing routes to `intent_gap` or `bad_spec`, so
there is no loopback.

| #   | Layer | Location                                                  | Claim                                                                                               | Verdict     | Evidence                                                                                                                                                                                                                                                                                   | Route     |
| --- | ----- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| 1   | PC    | `shared/components/ui/ColorPicker.tsx:4`                  | The picker moved off Unistyles' `StyleSheet` onto React Native's, against project-context's Styling | false       | The checklist asks for Unistyles theme tokens and no hex, which `useTheme()` gives. React Native's `StyleSheet` for geometry is how 12 of the 14 primitives here are written, and project-context's own gotcha warns that importing Unistyles remaps `Pressable`, which the swatches press | reject    |
| 2   | PC    | `shared/components/ui/FormScreen.tsx:9`                   | A new primitive on React Native's `StyleSheet`                                                      | false       | As row 1: the directory's pattern (`Button`, `Surface`, `PrimaryActionFooter`, `BottomSheet`), theme roles throughout, no hex                                                                                                                                                              | reject    |
| 3   | PC    | `shared/components/ui/RequestErrorBanner.tsx:2`           | A new primitive on React Native's `StyleSheet`                                                      | false       | As row 2                                                                                                                                                                                                                                                                                   | reject    |
| 4   | PC    | `features/cards/screens/CardEditScreen.tsx:19`            | A React Native `StyleSheet`, with theme colours inline                                              | false       | The screen styled with `useTheme()` inline objects before this change. Only its static geometry moved into a `StyleSheet`, and every colour is still a role                                                                                                                                | reject    |
| 5   | PC    | `shared/components/ui/index.ts:12`                        | `HeaderIconButton` became a primitive with no story, and the count says 13                          | low         | Real: it is exported here and listed in the design system's Components table, but Storybook and Chromatic see nothing of it, against `stories.test.tsx`'s one-module-per-primitive rule                                                                                                    | patch (A) |
| 6   | PC    | `shared/components/ui/HeaderIconButton.test.tsx:129-130`  | The Unistyles guard for two feature files moved into `shared/`                                      | low         | Real: the rows for `HomeHeaderButtons` and `CardDetailHeader` now sit away from their subjects, against project-context's co-located tests                                                                                                                                                 | patch (B) |
| 7   | PC    | `shared/components/ui/FormScreen.tsx:178,222`             | A shared primitive borrows `addCard` and `cards` copy                                               | low         | Real: shared primitives take `sharedUi.*`, as `BottomSheet` does. Renaming either key silently breaks the back's or the busy button's name, and 22.9's auth screens would inherit "Saving...". The spec prescribed both keys, so Design Notes move with the fix                            | patch (C) |
| 8   | PC    | `shared/components/ui/TextField.tsx:88`                   | On iOS a second error's announcement interrupts the first                                           | medium      | Real: edit's first Save raises two errors in one commit, and each `announceForAccessibility` cuts off the last, so VoiceOver speaks one. React Native 0.83.6 has `announceForAccessibilityWithOptions` with `queue` (`AccessibilityInfo.js:480`)                                           | patch (D) |
| 9   | PC    | `features/cards/screens/CardEditScreen.tsx:12`            | "Uses shared CardForm" contradicts `CardForm`'s new header comment                                  | low         | Real: a direct rewording                                                                                                                                                                                                                                                                   | patch (E) |
| 10  | BH    | `shared/components/ui/`                                   | `HeaderIconButton` has no story                                                                     | low         | Same defect as row 5                                                                                                                                                                                                                                                                       | patch (A) |
| 11  | BH    | `shared/components/ui/FormScreen.tsx:178,222`             | Feature strings, and a fixed busy name                                                              | low         | Same defect as row 7. Its aside, `CardForm` reading `addCard.setup.colorLabel`, is unchanged: the deleted picker read the same key                                                                                                                                                         | patch (C) |
| 12  | BH    | `TextField.tsx:88`, `RequestErrorBanner.tsx:31`           | The new announcements interrupt each other, and drop the codebase's optional-call guard             | medium      | Same defect as row 8                                                                                                                                                                                                                                                                       | patch (D) |
| 13  | BH    | `CardEditScreen.tsx:113,121`                              | `usePreventRemove` would close the iOS swipe-back gap                                               | medium      | Real, and pre-existing: the swipe skipped the prompt before this change (Found, not fixed 2)                                                                                                                                                                                               | defer (F) |
| 14  | BH    | `PrimaryActionFooter.tsx:18`, `Button.test.tsx:157`       | Comments still describe setup's old footer                                                          | low         | Real, but both files sit under the frozen Never list                                                                                                                                                                                                                                       | defer (G) |
| 15  | BH    | `shared/theme/luminance.ts:8`, `CardForm.tsx:60,133,149`  | Comments still describe the shapes this change replaced                                             | low         | Real, and each is a direct rewording in a file this story may change                                                                                                                                                                                                                       | patch (E) |
| 16  | BH    | `docs/design/cardi/cardi-design-system.md:406,999`        | Two record statements are now false                                                                 | low         | Real: _Layout & Spacing_ still names `CardForm`'s 32 as live, and the picker line says its test IDs are unchanged, though edit's moved                                                                                                                                                     | patch (H) |
| 17  | BH    | `shared/components/ui/FormScreen.tsx:135-136`             | "This host has no Android emulator", in a source comment                                            | low         | Real: a remark about one machine, and inexact, since an emulator and Wear images are installed and only a phone image is missing. Running a phone emulator needs a system-image download, which goes to the human                                                                          | patch (I) |
| 18  | BH    | `FormScreen.stories.tsx:18`, `TextField.stories.tsx:13`   | The stories draw a stand-in scan button                                                             | low         | Real duplication of its look. The only fix is a new shared primitive, and drift would only mislead a Storybook reader                                                                                                                                                                      | reject    |
| 19  | BH    | `CardSetupScreen.tsx:47`, `CardForm.tsx:36,192`           | The 50-character cap is written four times                                                          | low         | Real, but the cap does not change in practice, and the fix is a new shared export                                                                                                                                                                                                          | reject    |
| 20  | BH    | `features/cards/components/CardForm.test.tsx:46`          | `rerenderWith` is unused, and typed edits surviving the banner are unpinned                         | low         | Real: the helper is dead. The behaviour holds, since react-hook-form reads `defaultValues` once and the banner's slot sits before the fields' view, but nothing pins it                                                                                                                    | patch (J) |
| 21  | BH    | `features/add-card/screens/CardSetupScreen.test.tsx:217`  | It re-tests `gridLayout` without rendering the screen                                               | low         | Real duplicate of `gridLayout.test.ts:130`                                                                                                                                                                                                                                                 | patch (K) |
| 22  | BH    | `features/cards/hooks/useEditCard.test.ts:155`            | It assumes exactly one `await` before the write                                                     | low         | Real: one more `await` in the hook would leave `resolveUpdate` undefined                                                                                                                                                                                                                   | patch (L) |
| 23  | BH    | `features/cards/hooks/useAddCard.test.ts:251`             | The spy is restored outside a `finally`                                                             | low         | Real: a failing assertion would leak the mocked logger into later tests                                                                                                                                                                                                                    | patch (M) |
| 24  | BH    | `shared/components/ui/TextField.tsx`                      | Default the accessible name to the label                                                            | false       | Every caller passes one (setup's two fields, `CardForm`'s two, sign in, create account, forgot password and `PasswordInput`), so no field is unnamed                                                                                                                                       | reject    |
| 25  | BH    | every form                                                | No return-key flow between fields                                                                   | low         | Real, and pre-existing: no form set `returnKeyType` or `onSubmitEditing` before this change                                                                                                                                                                                                | defer (U) |
| 26  | BH    | `features/cards/components/CardForm.tsx:213`              | Edit's number pad cannot retype a card number with letters                                          | medium      | Real, and pre-existing: the number pad dates from Story 2.2, setup's free keyboard from 13.4                                                                                                                                                                                               | defer (V) |
| 27  | BH    | `CardSetupScreen.tsx:163`, `CardSetupScreen.test.tsx:274` | An unresolvable catalogue brand saves an empty name, and a new test locks it in                     | low         | Real, and pre-existing: the shipped screen saved `name: ''` the same way, and the test pins the unchanged behaviour                                                                                                                                                                        | defer (W) |
| 28  | VG    | `shared/components/ui/FormScreen.tsx:192-195`             | Android's `padding` is never asserted while the platform is Android                                 | medium      | Pre-verified: mutating it to `undefined` or to `'height'` passed 191 of 191                                                                                                                                                                                                                | patch (N) |
| 29  | VG    | `features/add-card/screens/CardSetupScreen.tsx:80-86`     | The tile mark's colour and size are unasserted                                                      | medium      | Pre-verified: a white mark, or the reference size, passed all 42                                                                                                                                                                                                                           | patch (O) |
| 30  | VG    | `shared/components/ui/Button.test.tsx:157`                | A stale comment                                                                                     | low         | As row 14                                                                                                                                                                                                                                                                                  | defer (G) |
| 31  | VG    | `shared/theme/luminance.ts:8`                             | A stale comment                                                                                     | low         | As row 15                                                                                                                                                                                                                                                                                  | patch (E) |
| 32  | VG    | `shared/theme/colors.contrast.test.ts:65-75`              | The placeholder's contrast is justified by the old role, and its new pairing is ungated             | low         | Real: `TextField` now draws `textSecondary` on `surface`, about 7.5:1 in light and 8.5:1 in dark, and no test checks that pair                                                                                                                                                             | patch (P) |
| 33  | VG    | `shared/components/ui/`                                   | `HeaderIconButton` has no story                                                                     | low         | Same defect as row 5                                                                                                                                                                                                                                                                       | patch (A) |
| 34  | EC    | `shared/components/ui/FormScreen.tsx:97-98`               | A keyboard already up when a form mounts leaves the footer covered                                  | maybe-false | `KeyboardAvoidingView` seeds nothing on mount (`KeyboardAvoidingView.js:192-196`), and both old forms' views behaved the same. Whether any flow mounts a form with the keyboard up is open: the scan round trip pushes the scanner over a focused field. Settle it on the simulator        | defer (Q) |
| 35  | EC    | `shared/components/ui/FormScreen.tsx:98-110`              | A keyboard event lands between the first render and the subscription                                | false       | The effect subscribes at mount, during the push, before any field can be tapped, and neither form focuses a field on mount: setup has no autofocus, and edit passes `focusNameOnMount={false}`                                                                                             | reject    |
| 36  | EC    | `shared/components/ui/TextField.tsx:85-90`                | Simultaneous errors interrupt each other on iOS                                                     | medium      | Same defect as row 8                                                                                                                                                                                                                                                                       | patch (D) |
| 37  | EC    | `features/cards/screens/CardEditScreen.tsx:121-125`       | Back during a save, or a double tap, pops card detail too                                           | low         | Real, and pre-existing: the root header's back called `router.back()` the same way (Found, not fixed 8)                                                                                                                                                                                    | defer (R) |
| 38  | EC    | `app/_layout.tsx:222-229`                                 | iOS swipe-back skips the discard prompt                                                             | medium      | Same as row 13                                                                                                                                                                                                                                                                             | defer (F) |
| 39  | EC    | `features/cards/components/CardForm.tsx:37`               | A card saved with no number cannot be re-saved from edit                                            | medium      | Real, and pre-existing: Story 13.4's optional number against Story 2.7's required one, which the frozen block keeps                                                                                                                                                                        | defer (S) |
| 40  | EC    | `features/add-card/screens/CardSetupScreen.tsx:98-176`    | An odd `mode`, or an unresolvable brand, saves an empty name                                        | low         | Same as row 27                                                                                                                                                                                                                                                                             | defer (W) |
| 41  | EC    | `useAddCard.ts:98-106`, `useEditCard.ts:95-103`           | With the toast gone, TalkBack may not hear a failed save                                            | maybe-false | Burnt's Android toast was announced. Whether a polite live region announces when it mounts already filled is open on this host; if it does not, this is medium. Settle it with TalkBack on a device                                                                                        | defer (T) |
| 42  | EC    | `shared/components/ui/TextField.tsx:85-97`                | TalkBack may never hear a newly shown field error                                                   | maybe-false | The same open question as row 41, on `FieldError`'s Android path, which predates this story                                                                                                                                                                                                | defer (T) |
| 43  | EC    | `shared/components/ui/FormScreen.tsx:258-264`             | The 24pt under the last field breaks "no trailing padding"                                          | false       | The spec pads the body 24 on every side, and "trailing padding" is `CardForm`'s old 100pt. Its fix would also edit the spec                                                                                                                                                                | reject    |

**Groups.** Patches A–E and H–P go to the step-3 subagent. Deferrals F, G and Q–W go to
`deferred-work.md` and to Found, not fixed.

## Design Notes

The sources are silent, or conflict, on everything below, so it is ruled here. Measurements are in
pt.

**The form screen (`FormScreen`).**

- **Ground.** `background`, under every inset, in a `SafeAreaView` on all four edges. That view
  sits outside the keyboard-avoiding view, so the footer's own inset stays off.
- **Header.** It is capture frame A's header (`cardi-design-system.md` § _Capture_), not the form
  frame's 56pt bar with its 24pt display title. On iOS every stack-pushed screen's bar title is
  17pt, the native ones by default and capture's by token, while Android's native titles keep the
  toolbar's own size (`NAVIGATION_TITLE_FONT` sets no size). Home's `headline-md` title is the one
  exception, and setup follows capture in one stack (code-review rounds 1 and 2).
  - At least 48 tall, with no rule.
  - `HeaderIconButton` holds Lucide `chevron-left` in `textPrimary`, its drawn stroke on the 24
    margin.
  - The title is `bodyLgStrong` `textPrimary`, centred, announced as a heading, and wraps rather
    than clipping under large text.
  - A 48 spacer on the right keeps the title centred.
- **Body.** A `ScrollView` with `keyboardShouldPersistTaps="handled"`.
  - Its content is padded 24 at the top, the sides and the bottom.
  - Fields sit 32 apart, and each label sits 8 above its control.
- **Banner.** While there is a request error, it is the first thing in the body, 16 above the first
  field, and the body scrolls to the top to show it.
- **Footer.** `PrimaryActionFooter`, with `insetBottom={false}`, holds one `Button`
  (`variant="primary"`, `size="large"`).
  - It is always enabled.
  - While busy it is `loading`, with the accessible name `sharedUi.formScreen.saving`
    ("Saving...").
- **Keyboard.** The body and the footer share one `KeyboardAvoidingView` below the header, so the
  footer rests on the keyboard.
  - Its frame then starts below the header, inside a full-screen view, so no
    `keyboardVerticalOffset` is needed.
  - iOS takes `padding`.
  - Android takes a behaviour verified against the installed `KeyboardAvoidingView.js` and SDK 55's
    edge-to-edge. It is never none: with no behaviour the view does nothing, and the keyboard covers
    the footer, as it does on setup today.
  - Built (step 3): Android takes `padding` as well, and the view is enabled only while the keyboard
    is up. Android's `keyboardDidHide` reports the visible frame's height as its `screenY`, which
    would leave the status bar's height of padding under the footer once the keyboard had gone.
    That is reasoned from the installed sources and unverified on a device.
- **Nothing to submit.** Edit's loading and error states draw the header over the ground, with no
  footer.
- **testIDs.** The caller names the parts: setup's back keeps `setup-back-button`, and edit keeps
  `edit-card-form` on the scrolling body.
- **Strings.** The back is named by `sharedUi.formScreen.backAccessibilityLabel` ("Go back"), and
  the busy button by `sharedUi.formScreen.saving`. They are shared strings, as `BottomSheet`'s are,
  rather than a feature's (review row 7).

**Fields (`TextField`)** -- the frame's input, closing #251 item 1.

- **Fill and outline.** The fill is `surface` (white; ink in dark), not `surfaceElevated`. The 1pt
  outline is `border`; focused it is `primary`, ink in light and beam in dark, since beam would
  vanish on white; in error it is `error`.
- **Spacing.** 16 of horizontal padding, or 52 on the side of a `rightAdornment` as today. 8 from
  the label to the control.
- **Placeholder.** `textSecondary`, the frame's `#55555F`, not `textTertiary`.
- **`mono`.** The value is set in `monoCode` and the placeholder in the body face, as the frame
  sets them. If swapping faces makes the input jump or drop its caret on a device, keep `monoCode`
  for both and record it.
- **A trailing slot**, outside the box, for the scan button. It sits 8 right of the input and is
  aligned with the input; the label spans the whole row, and the message sits under the input.
- **Announcement.** A new error is announced on iOS as it appears, through
  `AccessibilityInfo.announceForAccessibilityWithOptions` with `queue: true`. Queued, errors raised
  by one press are all heard, where a plain announcement would cut off the one before (review row 8).
  That matches Android's polite live region, which stays.

These reach every `TextField`, the auth screens' included.

**The request banner (`RequestErrorBanner`).**

- `surface` fill, a 1pt `error` outline, radius 12, padding 16, full width.
- The message is `bodyMd` in `error`: "Failed to add card" or "Failed to update card", the hooks'
  existing strings.
- No icon, no tint, and no dismiss.
- It is an alert: a polite live region on Android, and announced on iOS, queued, when it appears or
  its message changes.
- It clears when the next press starts a save, because each hook resets `error` then.

**The colour picker.** `shared/components/ui/ColorPicker.tsx` becomes the only picker, and the cards
copy goes.

- **Order.** The logo's bars, as the frame and _Card accents_ list them: red, deep blue, azure,
  green, yellow. Those are the keys `red`, `blue`, `grey`, `green` and `orange`, a permutation of
  `CARD_COLOR_KEYS` that a test pins.
- **Swatch.** A 48 disc in its accent, spread across the width as today.
- **Selected.**
  - A 2 ring in `primary`, held off the disc by a 2 gap in `background`. It sits outside the disc,
    so the disc stays 48.
  - Lucide `check` at 20, stroke 3, in the accent's `getContrastForeground`: ink on yellow, where
    the frame's white is 1.52:1.
- **Unchanged:** the accessibility labels, the `selected` state, and the `${testID}-<key>` testIDs.

**The scan button (`InlineScanButton`).**

- The frame's 48 square: `surface` fill, a 1 `border` outline, radius 12.
- Lucide `camera` at 24/1.5 in `textPrimary`.
- The 0.98 press replaces the 0.6 opacity.
- No `hitSlop`: at 48 it needs none, and a slop would take taps from the input beside it.
- Its label is unchanged.

**Setup.**

- **Custom:**
  - STORE NAME takes `maxLength` 50. That is the schema's cap, which setup never applied. It has
    no counter, as the frame draws none;
  - CARD NUMBER, with the scan button;
  - CARD COLOR: a `FieldLabel` over the picker, with deep blue selected. That is today's default
    and the frame's.
- **Catalogue** (Decided): the brand's tile, then CARD NUMBER 32 below it.
  - The tile is the wallet's: the brand's hex, its mark (the logo, or the two-letter plate for a
    brand without one), the light and near-black outline rules, and the brand's name beneath in
    `label-bold`.
  - Its size is the wallet grid's on this device, from `getGridTileWidth` and `getGridTileHeight`
    (171 × 140 at the 390 reference), with `TILE_RADIUS`. It is centred.
  - It is not a control: no press, no button role and no hint. A screen reader reads the brand's
    name once. `Tile` draws without a press when it has no `onPress`.
  - It shares its mark with `CardTile` rather than copying it. `CardTile` pushes `/card/<id>` on
    press, so it is not reused as it is.
  - The brand is the one setup already resolves, from the catalogue and then from the params, so a
    brand known only by its params still draws.
  - With no resolvable brand there is no tile, as today there is no block.
- **Done.** `common.actions.done`. Its `disabled={isLoading}` goes (#251 item 11).
- **Validation.** On Done, an empty store name errs and takes focus. After that first press, the
  field re-validates as the user types.

**Edit.**

- **Header.** The route's native header is hidden, and the form draws the pattern's header as setup
  does. That gives the two form screens one look, and makes the back the screen's own, so it can run
  the discard check that the native header's `router.back()` skipped. iOS swipe-back still skips it
  (Found, not fixed 2).
- **The form.** `CardForm` draws `FormScreen` with its four fields. The 24 margin replaces its 32,
  the one-off the design README gives this story. Save is `cards.edit.save`.
- **Validation.** react-hook-form's `mode: 'onSubmit'`, with `reValidateMode: 'onChange'`.
  - Errors appear at the first Save, then update while the user types, rather than on every
    keystroke from the start.
  - `shouldFocusError` keeps the first invalid field's focus.
- **Colour.** The shared picker, under a `FieldLabel` reading `addCard.setup.colorLabel`, as today.

**Failed saves** (`useAddCard`, `useEditCard`). The `catch` keeps `setError`, `logger.error` and the
error haptic, and stops showing the toast. The banner is the idiom, and two error surfaces for one
failure are noise. The success path is untouched.

**Dark mode** (no frame draws it). Every value is the theme role named above:

- the ground `#000000`;
- the fields and the scan button in ink `#181824`, outlined `#3A3A48`;
- the banner in ink too, but outlined and worded in the error `#FF453A` (code-review round 3);
- cream text, with the placeholder `#B5B5AB`;
- the error `#FF453A`;
- beam for the focus outline and the selection ring;
- the primary in beam, with an ink label and spinner.

**Record** a `### Forms` section in `cardi-design-system.md`, headed "**RULED 2026-10-14 (Story
22.6)**, from `frames/cardi-form-frames.html` and `stitch-prompts-form-states.txt`". It holds:

- every ruling above;
- `FormScreen`, `RequestErrorBanner` and `HeaderIconButton`, added to _Components_' table;
- two corrections:
  - _The primary-action footer_'s "`CardForm` is the outlier and gates on `!isValid`", false since
    Story 22.1;
  - _Input fields_' "iOS has no equivalent", now that iOS announces the error;
- an update to _Icons_: capture and setup have both moved, `InlineScanButton` included.

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors.
- `yarn lint` -- expected: no errors, no warnings.
- `yarn format:check` -- expected: clean, untracked docs included.
- `yarn test` -- expected: all suites green.

**Manual checks:**

- **iOS simulator, 393pt, light and dark.** Check:
  - setup's custom form: default, error, filled, saving and request failed;
  - setup's catalogue form, for a brand with a logo and a brand without one;
  - edit: default, error, saving, request failed, loading and not found;
  - the keyboard up on both forms;
  - the largest text size.

  Saving and request failed: make the database write hang or reject over Metro's debugger. The
  `FormScreen` stories show every state in Storybook (`yarn storybook`).

- **Unchecked here:** Android, for which this host has no emulator, and with it Android's keyboard
  behaviour.

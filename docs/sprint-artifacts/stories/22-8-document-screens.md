---
title: 'Story 22.8: Document Screens — help, the privacy policy and What We Collect on the Cardì system'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
review_loop_iteration: 2
baseline_commit: 'a54b09cbd41ed4c420b7ad635cad26c2af2fad5b'
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The three long-form screens still draw the pre-Cardì app:

- `help` and `privacy-policy` have no route options, so their native headers read the raw route
  names "help" and "privacy-policy". `data-summary` names itself twice, in its native header and
  again in its body. All three take the root stack's MaterialIcons back;
- each repeats its title in the body, sits 48 in from each side where the system's margin is 24,
  and starts up to 80 below its header;
- the policy's section heads are not headings to a screen reader, and its wrapped bullets run back
  under the bullet;
- help's questions are separate cards with no chevron and no expanded state, its search is a raw
  field with no name and no clear button, and a search that matches nothing leaves a blank;
- What We Collect boxes its table on a card, dims the rows it does not collect, and ends in a
  disabled "Download My Data (coming soon)", although Settings' Export Data has shipped
  (Story 13.6).

**Approach:** Draw the three from `docs/design/cardi/frames/cardi-document-frames.html` frames A
(prose), B (searchable FAQ) and C (two-column table) and `stitch-prompts-document.txt`, in light
and dark, with `cardi-design-system.md` winning any conflict and the frames beating the prompts.
One shared document ground carries all three: settings' header, ground and scroll. Help's search
is the wallet's field, moved into `shared/components/ui/` unchanged. Body text keeps Story 21.2's
15pt floor. Record every ruling in the design system.

## Boundaries & Constraints

**Always:**

- **The three frames:** A, prose: `privacy-policy`; B, searchable FAQ: `help`; C, two-column
  table: `data-summary`.
- **Keep what shipped:**
  - the policy and the FAQ, bundled for offline use in English and Italian. The policy keeps the
    title and "Last updated" label it takes in each language today. `features/help/help-data.json`
    stays deep-equal to `docs/help.json`, and help keeps its fallback items and its
    `itemsOverride` seam;
  - help's search over each item's question, answer and tags, trimmed and ignoring case;
  - every item's steps, shown with its answer;
  - Contact Support (`mailto:support@myloyaltycards.app`) and Submit Feedback
    (`https://myloyaltycards.app/feedback`), each with today's alert when it cannot open;
  - every way in: settings' three About rows and the consent checkbox's policy link;
  - every testID the Code Map keeps;
  - every word of the policy, and What We Collect's description and its six rows, in order
    (decision 1);
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

**Decided (ifero, 2026-10-18):**

- **What the screens say:** redraw only. Every word stays. The claims the code contradicts are
  recorded under Found, not fixed, for a story of their own that also takes the website and the
  store forms. The redesigned screens ship still saying them.
- **"Download My Data (coming soon)":** removed, with its footnote. The table ends the screen.
- **Who opens What We Collect:** everyone, with no guard and no spinner. Story 6.11 made it
  signed-in only.
- **Spec size:** kept whole, well over the 1,600-token target.
- **FAQ answers (2026-10-19, from review pass 1):** several stay open at once, as help works today,
  and the opening is animated, not jumpy.

**Never:**

- Commit, push, or change `docs/sprint-artifacts/sprint-status.yaml` or any other tracker file. The
  orchestrator owns all three.
- Change any of these:
  - the policy's text, `PRIVACY_POLICY_VERSION` or its date (decision 1);
  - the FAQ's content, in either language or in `docs/help.json`;
  - how the wallet's and the brand list's search fields draw or behave: the field moves unchanged;
  - `Button`, `ScreenHeader`, `Surface` or `SectionHeader`;
  - the root stack's `screenOptions`, or any route's options other than `help`'s,
    `privacy-policy`'s and `data-summary`'s;
  - settings, the consent checkbox, `core/`, the watch apps.
- Draw a control disabled, a card, box or fill behind prose or the table, a tint, or an icon other
  than the FAQ's chevrons and the search field's own glyphs.

## I/O & Edge-Case Matrix

| Scenario      | Input / State                                           | Expected Output / Behavior                                                                                                                                                                                                                     | Error Handling                                                                                        |
| ------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Prose         | `/privacy-policy`, English or Italian, light or dark    | Frame A: the header names the policy and has its back; then the meta line and the policy's sections as Design Notes draw them, with no title in the body                                                                                       | N/A                                                                                                   |
| FAQ           | `/help`                                                 | Frame B: the header "Help & FAQ"; the subtitle; the search field; every question closed, on one outlined surface; Contact Support above Submit Feedback                                                                                        | N/A                                                                                                   |
| Open          | a question pressed                                      | its answer and steps open beneath it, animated, not jumpy; its chevron points up and it reports expanded; the other questions stay as they are; pressing it again closes it                                                                    | N/A                                                                                                   |
| Search        | text in the field                                       | only the questions whose question, answer or tags hold the trimmed text, ignoring case; the clear × empties the field and every question returns                                                                                               | nothing matches: one line, "No answers matching “<query>”", in the list's place, and the actions stay |
| Keyboard      | the field focused, then a question or an action pressed | the press acts at once, as on the wallet                                                                                                                                                                                                       | N/A                                                                                                   |
| Contact       | Contact Support or Submit Feedback pressed              | opens mail to `support@myloyaltycards.app` or the feedback page, as today                                                                                                                                                                      | cannot open: today's alert                                                                            |
| Table         | `/data-summary`, signed in or a guest                   | Frame C at once, with no spinner and no redirect: the header "What We Collect"; the description; the ruled table, its head row and then its six rows in order, with a rule under the head and under every row. The table ends the screen       | N/A                                                                                                   |
| Large text    | the largest accessibility size                          | the header title, the prose, the questions and the answers wrap and their rows grow; each chevron stays at its row's end; from a font scale of 1.5 each table row sets its data under its category; nothing clips                              | N/A                                                                                                   |
| Screen reader | VoiceOver or TalkBack                                   | each header title and each policy section head is a heading; the field is announced as a search field; each question is a button named by its question that reports expanded or collapsed; each table row reads as its category, then its data | N/A                                                                                                   |
| Back          | the header's back pressed                               | returns to where the screen was opened: settings, or create account for the policy                                                                                                                                                             | N/A                                                                                                   |
| Shared field  | the wallet's and the brand list's search fields         | each draws and behaves exactly as on `main`                                                                                                                                                                                                    | N/A                                                                                                   |

</frozen-after-approval>

## Code Map

- `features/privacy/PrivacyPolicyScreen.tsx` -- frame A's screen.
  - `renderPolicyContent` (`:40-75`) parses one string line by line. Lines 0 and 1 (the title and
    "Last updated") are skipped, a blank line is a 24pt spacer, a line matching
    `SECTION_HEADER_RE` (`:33`) is a section head in `bodyLgStrong` with no header role, a `•` line
    is one `Text` padded 32 on the left, and anything else is `bodyMd`.
  - The title and label (`:84-89`): Italian takes `PRIVACY_POLICY_TITLE_IT` and
    `PRIVACY_POLICY_LAST_UPDATED_LABEL_IT` from `assets/legal/privacy-policy.it.ts`, and English
    takes `privacy.title` and `privacy.lastUpdated`.
  - The `ScrollView` (`:97-102`) keeps `privacy-policy-screen`. The meta line (`:109-112`) is
    `privacy.version`, then the label and the raw `PRIVACY_POLICY_LAST_UPDATED`.
- `assets/legal/privacy-policy.ts`, `privacy-policy.it.ts` -- the policy. `PRIVACY_POLICY_VERSION`
  (`:14`) is stored with each consent (`core/privacy/consent-repository.ts:47`). The content
  (`:34-110`) is one string of a title line, a "Last updated" line, 10 numbered sections and 24
  bullets; the Italian file has the same shape.
- `features/help/HelpScreen.tsx` -- frame B's screen.
  - The data (`:9-31`): `help-data.json` and `help-data.it.json` hold 9 items each, typed
    `{ id, question, answer, steps, tags }` in `help-fallback.ts:1-7`. That file's 3 items stand in
    when a file is empty. Italian is chosen by `startsWith('it')` (`:13-16`). Only tests pass
    `itemsOverride` (`:33-45`).
  - The search (`:49-57`), and the open state (`:47`, `:59-64`), which lets several items be open.
  - `openExternal` (`:66-77`): `canOpenURL`, then `openURL`, else an `Alert` titled
    `help.openFailedTitle`.
  - The `ScrollView` keeps `help-screen`; the body title `help-title` (`:85-91`); the raw
    `TextInput` `help-search` (`:95-110`); a bordered card per item, whose `Pressable` is named by
    its question and has no testID (`:112-145`); the steps as `• step` texts (`:127-143`); the
    actions `help-contact-support` and `help-submit-feedback` (`:147-178`).
- `features/privacy/DataSummaryScreen.tsx` -- frame C's screen.
  - `DATA_ROWS` (`:33-70`): six `{ id, categoryKey, detailKey, collected }`. A row with
    `collected: false` is drawn in `textSecondary` (`:136-160`).
  - The guard (`:79-102`), which goes (decision 3). `useAuthState` starts `loading` on every mount
    and waits for Supabase's `INITIAL_SESSION`. A guest is sent to `/sign-in` with
    `router.replace`, and `loading` and `guest` draw `data-summary-loading`, a centred
    `ActivityIndicator` in `primary`.
  - The `ScrollView` keeps `data-summary-screen`. Then the body title `data-summary-title`
    (`:112-118`), the description (`:119-121`), the table `data-summary-table` on a `surface` card
    with rows `data-row-<id>`, the id lowercased (`:124-164`), the disabled
    `download-data-placeholder` (`:167-178`) and its footer (`:180-182`). The placeholder and the
    footer go (decision 2), with their four strings, `privacy.dataSummary.downloadButton`,
    `downloadButtonA11yLabel`, `downloadButtonA11yHint` and `downloadFooter`.
  - Its header comment (`:1-10`) describes the guard and the placeholder.
- `features/cards/components/SearchBar.tsx` (+ `SearchBar.test.tsx`) -- the system's search field
  (Stories 22.2 and 22.5). Its props are `value`, `onChangeText`, `onClear`, `testID`
  (`search-bar`, with `-icon`, `-input`, `-clear` and `-clear-icon`), and `placeholder`,
  `accessibilityLabel` and `clearAccessibilityLabel`, which default to the wallet's copy. Its input
  has the search role.
  - ESLint's boundaries (`eslint.config.mjs:193-245`) forbid `features/help` from importing
    `features/cards`, so it moves to `shared/components/ui/`.
  - Its importers: `features/cards/components/CardList.tsx:35`, whose test mocks `'./SearchBar'`
    (`CardList.test.tsx:179`); `features/add-card/screens/CardTypeSelectionScreen.tsx:28`, whose
    test imports it (`:16`) and finds it by type (`:305`); and `features/cards/index.ts:42`, a
    re-export nothing imports through.
- `shared/components/ui/` -- what the screens compose:
  - `ScreenHeader.tsx` (`:37-78`): `title`, `onBack`, `testID`, `titleTestID`, `backTestID`. It
    handles no insets;
  - `Surface.tsx`: with `divided`, a rule between non-empty children (`:22-40`);
  - `Button.tsx`: `primary`, and `secondary`, outlined in `primary`. The default size is 48;
  - `index.ts`, and `stories.test.tsx:104-105`, which asserts 16 story modules from the map at
    `:50-72`.
- `features/settings/screens/SettingsScreen.tsx:268-290`, `:398-408` -- the ground to copy: a
  `SafeAreaView` on the top, left and right edges in `background`, `ScreenHeader` with
  `router.back()`, and a `ScrollView` padded 16 at the top, 24 at the sides and
  `SPACING.lg + insets.bottom` at the bottom.
- `features/cards/components/CardList.tsx:134-142`, `:300-312` -- the wallet's no-results line:
  `bodyMd` in `textSecondary`, centred, 80 below the controls. The wallet's list and the brand list
  scroll with `keyboardShouldPersistTaps="handled"`.
- `app/_layout.tsx` -- the root `screenOptions` (`:123-147`, with the MaterialIcons `headerLeft` at
  `:124-134`) are not ours. `help` and `privacy-policy` have no `Stack.Screen`, so native-stack
  titles them by route name, and `data-summary` (`:270-275`) sets only its title. `settings`
  (`:193-201`) and `card/[id]/edit` are the `headerShown: false` precedent.
  `test/root-layout.home-header.test.tsx:225-228` pins the shared options, and `data-summary`'s as
  exactly its title.
- `shared/theme/typography.ts` -- `bodyLgStrong` 17/24 at 600, `bodyMd` 15/22, `bodyMdStrong`
  15/22 at 600, `overline` 12/16 at 600 with +0.6, and `captionSm` 12/16. No role carries a text
  transform. `typography.test.ts:168-174` allows only `CHROME_TIER` below 15.
- `shared/i18n/locales/en.ts:225-280`, `it.ts:226-281` -- `privacy.*` and `help.*`, and
  `navigation.whatWeCollect` (`:55`). `help` has no no-results string and no clear label. The
  wallet's are `cards.home.noResults` and `cards.home.clearSearchAccessibilityLabel`.
- **The answer's motion (review pass 1):**
  - `features/cards/components/BarcodeFlash.tsx:46`, `:148`, `:176` -- the app's timed motion,
    through Reanimated's `withTiming`, which follows Reduce Motion unless told otherwise;
  - `jest.setup.js:301-531` -- the Reanimated mock. `useAnimatedStyle` returns an empty style,
    `withTiming` finishes at once and calls back `true`, and it has no `useDerivedValue`,
    `ReduceMotion`, `LinearTransition` or `measure`;
  - `node_modules/react-native/React/Fabric/Mounting/ComponentViews/View/RCTViewComponentView.mm:1440-1457`
    -- iOS's accessibility value: "expanded" only while the state is true, then any
    `accessibilityValue` text.
- **The question's name (review pass 2):**
  - `node_modules/react-native/React/I18n/RCTLocalizedString.mm` -- React Native's own iOS strings
    fall back to English unless an `RCTI18nStrings` bundle holds them, and every
    `React/I18n/strings/*.lproj/Localizable.strings` in this build is an empty 64-byte header;
  - `node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/uimanager/ReactAccessibilityDelegate.kt:74-78`,
    `:220-263` -- Android's Expand and Collapse actions for `accessibilityState.expanded`, which set
    the state natively and reach JS only when it declares them.
- **Tests that pin things:**
  - `HelpScreen.test.tsx`: a pre-rebrand theme mock (`:16-29`), exact strings, the testIDs, the
    exact URLs (`:123`, `:128`), the alert (`:100-114`) and the docs parity (`:90-92`);
  - `PrivacyPolicyScreen.test.tsx` (`:40-82`): `privacy-policy-screen`, the title text, the
    version, three section heads, the scroll view's label and Italian;
  - `DataSummaryScreen.test.tsx`: an expo-router mock with only `replace` (`:31-34`), every testID
    and string, and the guest and loading paths (`:127-160`);
  - `SettingsScreen.test.tsx:569-578`, `AboutSection.test.tsx:51-81` and
    `ConsentCheckbox.test.tsx:83-87` pin the ways in;
  - React Native's Jest mock reports a font scale of 2, so a font-scale gate is pinned in tests, as
    `ActionRow.test.tsx:55-71` pins 1;
  - `fireEvent.press` climbs to the nearest `onPress`, so press tests go through
    `userEvent.press`, as `BarcodeFlash.test.tsx` does.

## Tasks & Acceptance

**Execution:**

- [x] `shared/components/ui/SearchBar.tsx` (+ test, + stories) -- moved unchanged from
      `features/cards/components/`, so help can use the system's field. Its importers and their
      tests change only their import and mock paths, and `features/cards/index.ts` drops its
      re-export.
- [x] `shared/components/ui/DocumentScreen.tsx` (+ test, + stories) -- new: the document ground in
      Design Notes.
- [x] `shared/components/ui/BulletList.tsx` (+ test, + stories) -- new: the hanging-indent list in
      Design Notes.
- [x] `shared/components/ui/index.ts`, `stories.test.tsx` -- export the three, register their story
      modules, and raise the count from 16 to 19.
- [x] `features/privacy/PrivacyPolicyScreen.tsx` (+ test) -- frame A, per Design Notes. Its suite
      pins each policy's first two lines as its title and its "Last updated" line (review pass 1,
      row 19).
- [x] `features/help/HelpScreen.tsx` (+ test; any new file stays in `features/help/`) -- frame B,
      per Design Notes. Its suite also has a search hide an open question and then clears it,
      finding it still open, and echoes a mixed-case query as typed, trimmed (review pass 1, rows 3
      and 4). Its tests measure the answer through the
      content view's own `onLayout`, called directly rather than by an event that climbs, and pin
      that the clipping window has none (review pass 2, row 29). They pin that the answer, the
      subtitle and the no-results line take no line limit (row 30), and they cite the dated rulings
      rather than this spec's numbers (row 24).
- [x] `features/privacy/DataSummaryScreen.tsx` (+ test) -- frame C, per Design Notes and decisions
      2 and 3. Its suite pins the stacking breakpoint from both
      sides, a scale just below 1.5 keeping two columns (review pass 2, row 34), pins that the
      description takes no line limit (row 30), and cites the dated rulings (row 24).
- [x] `app/_layout.tsx` (+ `test/root-layout.home-header.test.tsx`) -- `help` (`help.title`),
      `privacy-policy` (`privacy.title`) and `data-summary` (its current title) each take
      `headerShown: false`, as `settings` does, so no native header flashes in the push.
- [x] `shared/i18n/locales/en.ts`, `it.ts` -- add the strings this story needs; delete those it
      leaves dead.
- [x] `jest.setup.js` -- extend the Reanimated mock only for what the answer's motion uses and the
      mock lacks.
- [x] `docs/design/cardi/cardi-design-system.md` -- the record in Design Notes.

Unit-test every I/O row a test can observe. Each new check must be seen to fail under its mutation.

**Acceptance Criteria:**

- **The frames:**
  - Given help, the policy and What We Collect, in light and dark and in both languages,
  - when each is shown, and help at rest, with a question open, while searching and with no match,
  - then each draws its frame as Design Notes rule it.
- **One pattern:**
  - Given the three routes,
  - when each is pushed,
  - then each draws `DocumentScreen`, and no native header shows.
- **The size policy (Story 21.2):**
  - Given the three screens,
  - when their text is read against `TYPOGRAPHY`,
  - then every sentence is set at 15pt or more, and only the policy's meta line and the table's
    head row take the 12pt chrome tier.
- **The record:**
  - Given `cardi-design-system.md`,
  - when this story's change is read against it,
  - then it holds a `### Documents` ruling section; _Components_ lists `DocumentScreen`,
    `BulletList` and `SearchBar`; and _Icons_ records the three screens leaving the root stack's
    MaterialIcons back.

## Implementation Notes

**Step 3 (2026-10-19).** A context-free subagent built this from the spec in about 50 minutes. Its
work was then checked against the diff, not against its report.

- **The orchestrator's own run.** The 15 suites the matrix maps to pass, 492 tests, run unpiped:
  help, the policy, What We Collect, the three new primitives and the moved field, the stories
  registry, the root layout, the wallet's list, the brand list, settings, About, the consent
  checkbox and the type scale. The subagent's own run of `yarn typecheck`, `yarn lint`,
  `yarn format:check` and `yarn test` (213 suites, 3,826 tests) passed; all four run again before
  the handback.
- **Matrix audit.** Every row maps to tests that ran and passed. The rows only a device can show
  (wrapping at the largest size, the keyboard, VoiceOver) also go to the device check.
- **The move.** `SearchBar.tsx` and its test differ from the baseline's only in their header
  comments.
- **Mutation pass.** The subagent ran 87 single-line mutations. Two survived its first run, the
  actions hidden on a no-match and a question row named by its answer; their tests were tightened
  until all 87 failed. Every source was restored and hash-checked.
- **On the simulator.** "DS22-8 iPhone 16" (393pt, iOS 26.5), on this worktree's bundle. Frames
  A–C in light and dark, in English and Italian and at the largest text size, and the wallet's and
  the brand list's fields, are in the session scratchpad's `device/`. Frames A, B (open) and C in
  light were read back here. The full DEVICE CHECK follows review.
- **Choices the subagent made within the spec:**
  - a section head stands 24 above, because every block leaves 8 below it: React Native does not
    collapse margins, and the frame's 32 is their sum. The design record says so;
  - the policy and What We Collect drop their scroll views' `accessibilityLabel`, since the
    header's heading names the screen;
  - `help-search` names the field's container, and its input is `help-search-input`;
  - the table's head row is at least 48 and top-aligned, like the data rows;
  - new testIDs: `help-document`, `privacy-policy-document`, `data-summary-document`, each
    screen's `*-back-button`, `privacy-policy-meta` and `data-summary-table-head`. `BulletList`'s
    `tone` is required;
  - the design record also marks the document screens' 48pt margin resolved, under _Layout &
    Spacing_;
  - `test/root-layout.home-header.test.tsx`'s Story 22.7 case pins card detail's options where it
    pinned What We Collect's.
- **Readings:**
  - **VoiceOver never says "collapsed".** React Native's iOS view voices the expanded state only
    when it is true (`RCTViewComponentView.mm:1440-1443`), so a closed question is read as its
    name and "button"; TalkBack voices both states. The frozen Screen-reader row asks that each
    question report expanded or collapsed: the state is set and tested, and iOS speaks half of it.
    To step 4's triage.
  - **Help's actions can sit under the keyboard.** Like the wallet and the brand list, its scroll
    view does not inset for the keyboard, so with a short result list the actions stay under it
    until it is dismissed. The spec asks nothing here.
  - At the largest text size, a word longer than its line breaks mid-word: iOS's own wrapping.
- **Unchecked:** a press while typing, which tests alone cover, because the keyboard-up shot
  caught iOS's one-time keyboard tutorial over the keys; Android, VoiceOver and TalkBack; Mail.

**Review pass 1 (2026-10-19)** looped back: row 10 to ifero as an `intent_gap`, rows 7 and 20 as
`bad_spec` (see the Review Triage Log and the Spec Change Log). Derivation 1's diff was saved and
checked to re-apply, then its 31 implementation paths were reverted one by one to the baseline:
20 restored, 11 new files removed. The spec and the tracker were not touched. ifero answered "c —
let several answers stay open, as help works today" and "make the opening animated, not jumpy".

**Step 3, derivation 2 (2026-10-19).** A fresh context-free subagent re-derived the code from the
amended spec in about 50 minutes, starting from derivation 1's saved diff. Its work was checked
against the diff, not against its report.

- **Against derivation 1.** Derivation 1 was rebuilt in a scratch folder from its saved diff and
  compared path by path. 13 of the 31 paths differ, each a change the Spec Change Log lists;
  `SearchBar`, `DocumentScreen`, the routes, the stories registry and the rest are byte-identical.
- **The orchestrator's own run.** The 15 suites the matrix maps to pass, 518 tests, run unpiped.
  The subagent's run of the four gates passed: 213 suites, 3,853 tests. One earlier full run lost
  `test/svg-module-resolution.test.tsx` to the known worker SIGSEGV while Metro ran; that suite
  passed on its own and in the next full run.
- **Matrix audit.** Every row maps to tests that ran and passed. The motion, VoiceOver and the
  keyboard also go to the device check.
- **Mutation pass.** 50 single-line mutants in three rounds, each killed by its own test; review
  pass 1's row-3 mutant dies only to the new hide-and-clear test. Two first-round survivors were
  fixed before round two: a motion at mount masked the start value, so the effect now skips mount;
  and the mock's `Easing.out` and `Easing.inOut` are one function, so the test now spies on
  `Easing.out`.
- **On the simulator** ("DS22-8 iPhone 16", iOS 26.5, this worktree's bundle):
  - frames A–C in light and dark and in English and Italian; help with one question open and with
    two, searching, with no match and with the keyboard up; the largest text size; the wallet's
    and the brand list's fields. Screenshots are in the session scratchpad's `device2/shots/`;
  - the motion, recorded in `device2/motion/` and tracked frame by frame on the rule under question
    1: opening, 290 → 462pt over about 14 frames (about 230 ms), each step smaller than the last;
    closing, the same in reverse; under Reduce Motion, one frame each way;
  - read back here: the opening strip, and two questions open in dark.
- **Found by the device check, fixed in this derivation.** With the answer's content in the flow
  inside its 0-tall window, a closed answer measured 16pt, its padding, so the motion crept a line
  or two and then snapped whole: Yoga hands the children of a 0-tall view an at-most-0 height. The
  content now lies out of the flow, pinned to the window's top and sides, while closed or moving,
  and in the flow when open at rest, in the same frame either way. No unit test sees layout, so the
  two worklets that choose each style are tested on their own and the recording is the evidence.
- **Measured:** the table's head row 41pt (40 and its rule), one-line data rows 48 and two-line 69;
  the policy's last line ending at y 794 (852 − 34 − 24); the bullet's column 14pt at the default
  size and 45.3 at the largest, where the glyph alone would take about 30; closed questions
  carrying "collapsed" ("chiuso") as their value, and open ones none.
- **Unchecked:** what VoiceOver and TalkBack actually speak; Android, the motion included, with its
  switch of `position` in one frame at each end; a press while the keyboard is up, which tests
  alone cover; Mail.

**Review pass 2 (2026-10-19)** looped back: rows 26 and 32, and row 37, as `bad_spec` (see the
Review Triage Log and the Spec Change Log). Derivation 2's diff was checked to re-apply, then its 31
implementation paths were reverted one by one to the baseline. The spec and the tracker were not
touched.

**Step 3, derivation 3 (2026-10-19).** A fresh context-free subagent re-derived the code in about
33 minutes, applying derivation 2's saved diff and changing only what Loopback 2 lists.

- **Against derivation 2.** Derivation 2 was rebuilt in a scratch folder from its saved diff and
  compared path by path: the 8 paths Loopback 2 names differ, and the other 23 are byte-identical,
  the answer's motion included.
- **The orchestrator's own run.** The 15 suites the matrix maps to pass, 542 tests, run unpiped.
  The subagent's run of the four gates passed: 213 suites, 3,877 tests.
- **Matrix audit.** Every row maps to tests that ran and passed.
- **Mutation pass.** 39 single-point mutants over the new behaviour, each killed by a failing
  assertion rather than a crash; the glyph test also fails if the turn is dropped or mirrored.
- **On the simulator** (same device, this worktree's bundle, checked in the served code): 30 shots
  of frames A–C in light and English, dark and English, and light and Italian, and every help state,
  each pixel-identical below the status bar to derivation 2's matching shot, in separate captures.
  So the turned `chevron-down` draws exactly what `chevron-up` drew. On the device, iOS questions
  carry no expanded state, and their value is "collapsed" or "expanded" ("chiuso" or "aperto"). The
  motion, tracked frame by frame over frames 75–88 (about 230 ms): the chevron's share of its turn
  matches the answer's share of its height on every frame (71/180 = 0.394 against 0.395); closing
  is the same in reverse; under Reduce Motion both change in one frame. The turning strip
  (`device3/motion/turn-on-strip.png`) was read back here.
- **Choices the subagent made within the spec:**
  - on Android the question declares the one action TalkBack offers for its state, Expand while
    closed and Collapse while open, rather than both at once: React Native adds every declared
    action to the node, so both would show in TalkBack's menu at all times. An action that no
    longer fits does nothing. Unchecked on a device;
  - the design record's _Icons_ paragraph, outside the KEEP list's letter, was amended: it still
    said help draws `chevron-down` and `chevron-up`;
  - one sentence in `FaqItem.tsx`'s header says the chevron turns on the same motion.
- **Not re-shot:** the wallet's and the brand list's fields and the keyboard-up state, whose code
  is byte-identical to derivation 2's, which shot them.
- **Unchecked:** what VoiceOver and TalkBack actually speak; anything on Android; Mail.

**Review pass 3 (2026-10-19)** looped back on nothing. Its five patch rows (48, 50, 52, 54 and 55) went
to derivation 3's subagent, which renamed `BulletList`'s tones to `'default'` and `'muted'` in the
component, its callers, their tests and both stories; named the policy's title
`privacy-policy-title`; reworded the breakpoint's comments; and split the record's unverified
paragraph into known gaps and what is unverified, and promised the app's own words on iOS only. Its
patch was checked against a rebuild of derivation 3: 11 paths changed, each one these fixes imply.
The four gates then passed on the patched tree, each exit read directly: `yarn typecheck`,
`yarn lint`, `yarn format:check`, and `yarn test` with 213 suites and 3,877 tests.

**Device check (2026-10-19).** It ran on the final tree, after review pass 3's patches, by derivation
3's subagent with its toolkit.

- **Device:** "DS22-8 iPhone 16" (393 × 852pt, iOS 26.5), its live panel attached. Metro ran from
  this worktree, and the served bundle was grepped for pass 3's markers (`privacy-policy-title`
  and the `muted` tone) before any shot. Every press was a real tap through the panel.
- **Screenshots:** the session scratchpad's `device4/`, 67 shots, with recordings in
  `device4/motion/`. Read back here: the field at the largest size, the dark largest-size sheet,
  and the table in dark.
- **Checked, light and dark:**
  - frame A: its top, a run of bullets and the paragraph after it, and its end at y 794
    (852 − 34 − 24);
  - frame B: at rest, with one and two questions open, searching, and a mixed-case query matching
    nothing; and the keyboard up, then a question pressed, which opened at once while the keyboard
    stayed up;
  - frame C: the head row 41pt with its rule, data rows 48 and 69, and nothing after the table. As a
    guest it draws from the first frame of the push, with no spinner and no redirect, and the route
    is still `/data-summary` 3 s later;
  - the largest text size on all three: titles, prose, questions and answers wrap, each chevron
    stays at its row's end, the bullet's column widens to 45.3pt, and the table stacks;
  - back from each to settings, at the same scroll, and from the policy to create account through
    the consent link;
  - all three in Italian, light.
- **The motion:** recorded with Reduce Motion off and on, and tracked frame by frame on the rule
  under question 1 and the chevron. Opening takes about 217 ms (frames 81–94 in light), the same in
  dark, and on every frame the chevron's share of its turn equals the answer's share of its height
  (70/180 = 0.389 against 0.390). Under Reduce Motion both change in one frame, each way.
- **Against `main`:** the wallet's and the brand list's fields, with `main`'s bundle served from a
  detached worktree at `a54b09c` into the same binary. 14 pairs (at rest, filtered and matching
  nothing, in light and dark, and typed text at the largest size) differ by 0 pixels below the
  status bar, each pair two distinct captures (distinct hashes and clocks).
- **On the device:** a closed question carries the button role, its question as its label, no
  expanded state, the value "collapsed" ("chiuso"), and no actions; an open one the value
  "expanded" ("aperto").
- **Found:** typed text overflowing the search field at the largest size, which goes to the human
  (below) and is Found, not fixed 21.
- **Seen, pre-existing, outside this story:** the wallet's "0 cards / Frequently used" row
  overlapping at the largest size, identical on `main` (Found, not fixed 22); `Button`'s wrapped
  labels aligned left (Story 22.7's Found, not fixed 18); the keyboard drawn light in the app's dark
  theme while the system is light (Found, not fixed 23); iOS's own AutoFill callout; and Found, not
  fixed 1 and 2, on screen.
- **Unchecked:** what VoiceOver and TalkBack actually speak; Android, the motion, Reduce Motion and
  TalkBack's Expand and Collapse included; Mail; What We Collect signed in, which reads no session
  and so draws the same.

**To the human: the search field at the largest text size.** Typed text in help's search field
runs past the field's borders there: its ascenders above the top border and its descenders below the
bottom, and unfocused it truncates to "help a…". The placeholder fits
(`device4/shots/x2-help-typed-ax5-light-en-field.png`).

- It is the shared field's own: the wallet's and the brand list's are pixel-identical on `main`
  (`device4/shots/cmp-main/w4-wallet-typed-ax5-light.png`, `b4-brands-typed-ax5-light.png`). The
  field is a fixed 48 with `bodyLg` text and no cap on its scaling.
- For help it breaks the frozen Large-text row, "nothing clips", while the frozen Never list moves
  the field unchanged. So whether the field grows with its text, for all three callers, here or in
  a follow-up, is ifero's call.
- **Decided (ifero, 2026-10-20):** left to the follow-up issue, with the handback's defaults
  approved. It is Found, not fixed 21.

**Review loops (2026-10-19).** Each round's reviewer is a new Sonnet subagent, given a fresh diff.

- **Code round 1:** `CHANGES_REQUESTED`, 2 findings, both verified real, each a test that could not
  fail, shown with mutants in copies outside the repository:
  1. the three "15pt or more" sweeps filtered on `fontSize < 15` and compared with `toEqual([])`, so a
     `Text` with no size, which React Native draws at 14, passed: `undefined < 15` is false, and
     `toEqual` ignores `undefined` items;
  2. the table's order test compared its children's testIDs with `toEqual`, so a child with no
     testID, such as frame C's "Download my data" put back as the table's last child, passed.

  The fixes, by derivation 3's subagent, are tests only: each sweep now keeps every text whose own
  size is not a number of at least 15 and asserts there are none, with the chrome tier asserted
  positively (the policy's meta line, the table's two heads, at 12); the order test uses
  `toStrictEqual`. Each of 7 mutants fails its test, and every source was restored and hash-checked.
  One trade-off: a nested inline `Text` with no size of its own would trip the sweep, though it
  inherits its parent's size on the device; none of the three screens has one. No source changed, so
  the device check stands.

- **Code round 2:** `VERDICT: APPROVED`, with zero comments. The code loop ends here.
- **QA round 1:** `CHANGES_REQUESTED`, 3 findings, all verified real, each a frozen "never" clause
  with no failing test, shown with mutants:
  1. nothing pinned that a question is not drawn on its own card: a border on the item's wrapper or
     on its row passed every help suite;
  2. "no card, box or fill behind prose" was pinned for the table and the open answer only: a fill or
     border on the body, the policy's blocks, help's subtitle, What We Collect's description or
     `BulletList`'s list passed;
  3. nothing pinned help's icons: a Lucide `Plus` above the subtitle or inside an answer passed.

  The fixes, by derivation 3's subagent, are tests only, in six suites: each walks every host node
  under its screen's body and flags any fill, border or radius, sparing the FAQ surface, the field,
  the buttons and the table's rules; the FAQ row's style is pinned whole and its wrapper carries
  none; and help's icons are counted, one back, one magnifier and one `chevron-down` per question,
  with none in an open answer. Each of 13 mutants fails its test, and every file was restored and
  hash-checked. The six suites pass here, 180 tests, with Prettier and ESLint clean. No source
  changed, so the device check stands; the change to the reviewed diff sends the code loop round
  again.

- **Code round 3:** `CHANGES_REQUESTED`, 2 findings, both verified real, the absence checks of QA
  round 1 missing two spots, shown with 37 mutants in copies:
  1. help's walk spares the FAQ surface, and the open answer was checked for a fill only: a border
     on it, or a fill or rule on the answer's or the question's text, passed;
  2. neither the policy nor What We Collect counted its icons: a Lucide `Plus` in the table's head
     row or in the policy's bullets wrapper passed.

  The fixes, by derivation 3's subagent, are tests only: an open-state walk in `FaqItem.test.tsx`
  over everything under the answer's window and the question's text, expecting no fill, border or
  radius; and in each of the two privacy suites, exactly one icon root, inside the header's back.
  Each of 9 mutants fails its test, and every file was restored and hash-checked. No source changed,
  so the device check stands.

- **Code round 4:** `CHANGES_REQUESTED`, 5 findings, all verified real, each a test that could not
  fail, shown with mutants that passed all 747 tests in the suites around the change:
  1. help's walk spared the FAQ surface's whole subtree, so a bordered, filled wrapper `HelpScreen`
     put around each question passed;
  2. nothing pressed the actions while a search matched nothing, so both drawn disabled passed;
  3. the no-match state counted no icons and pinned no blocks, so an icon or a second line there
     passed;
  4. What We Collect's box walk ran at font scale 1 only, so a fill on the stacked rows passed;
  5. nothing pressed a question while the list was filtered, so opening the unfiltered list's
     question instead passed.

  The fixes, by derivation 3's subagent, are tests only, in two suites: the walk enters the FAQ
  surface, sparing only the surface and its rules, and the surface's children are pinned exactly;
  the no-match state presses both actions, counts its three icons and pins its four blocks; the
  table's walk and icon count run at 1, 1.5 and 3.571; and a press while filtered opens the question
  pressed. Each of 6 mutants fails its test, and every file was restored and hash-checked. No source
  changed, so the device check stands.

- **The code loop ends here, at ifero's call (2026-10-19):** "stop the code loop here and run QA
  round 2". Its rounds found 2, 0, 2 and 5 findings, every one real and fixed with tests, none in
  production code; by round 4 they came from mutants that wrap a caller, disable a prop or swap an
  index. It ended after round 4's fixes, with no round 5.
- **QA round 2:** `CHANGES_REQUESTED`, 1 finding, verified real: no `HelpScreen` test observed which
  question a press or a search moves, so the `key` that keeps each question's `FaqItem` with its
  question was unpinned. With `key={index}`, a search ran the closing motion on a question that was
  never open; with a key that changes when a question opens, the row remounted already open, and
  pressing ran no motion. Both passed all 109 help tests.

  The fix, by derivation 3's subagent, is one test in `HelpScreen.test.tsx`: `withTiming` spied
  before rendering, then nothing runs at mount, a press runs exactly one opening at 220 ms, and a
  search and its clearing run none. Each of 3 mutants fails it, and every file was restored and
  hash-checked. No source changed, so the device check stands.

- **QA round 3:** `CHANGES_REQUESTED`, 6 findings, all verified real and of one kind: styles read
  with `toMatchObject` or a single key, so a stray margin, padding or opacity added to them passed.
  The reviewer's sweep added one stray property to each style object, and 61 of 113 mutants
  survived, among them the shipped 48 under help's subtitle and What We Collect's description put
  back. The six were help's subtitle; What We Collect's description, head labels and stacked rows;
  the FAQ's question, answer content and answer text; `BulletList`'s item, glyph, text and list; the
  policy's meta line, head, paragraph, bullets wrapper and last block; and the document ground.

  The fixes, by derivation 3's subagent, are tests only: each of those styles is pinned whole with
  `toEqual`, at the values the source has. A sweep of 128 stray-property mutants, one per style
  entry in the six sources, is killed whole, and every file was restored and hash-checked. No source
  changed, so the device check stands.

- **The QA loop ends here, at ifero's call (2026-10-20):** "stop the QA loop here and go to the
  final checks and handback". Its rounds found 3, 1 and 6 findings, every one real and fixed with
  tests, none in production code; round 3 came from a sweep that added a stray property to every
  style object. It ended after round 3's fixes, with no round 4.

**Final run (2026-10-20),** on the final tree after the loops, each exit read directly and nothing
piped: `yarn typecheck`, `yarn lint` and `yarn format:check` pass, and `yarn test` passes 213 suites
and 3,897 tests. No source changed after the device check, so its screenshots show the final code.

**Handback (2026-10-20).** ifero approved the change with the handback's defaults: five commits (the
search field's move, the new primitives, the screens, the design record, then this spec and the
tracker), each replayed on its own in a scratch worktree first; the push; the PR; and one follow-up
issue for Found, not fixed 1–23.

### Found, not fixed

Found while planning, outside this story's mechanisms or belonging to another story:

1. **The FAQ's first answer names a screen that is gone.** `features/help/help-data.json:5`, its
   Italian twin and `docs/help.json` cite the "First-Card Guidance overlay", deleted in `92235b1b`
   (Story 13.7b). Frame B's prompt repeats it.
2. **Italian copy drops its accents**: `assets/legal/privacy-policy.it.ts` throughout
   ("conformita", "ne", "non e", "sara"), `features/help/help-fallback.ts:48` ("Perche") and
   `shared/i18n/locales/it.ts:279-280` ("piu").
3. **`app/help-fallback.ts` is a dead route file.** Nothing imports it and it has no default
   export, so Expo Router skips it with a warning in development and registers an empty route in
   production (`expo-router/build/getRoutesCore.js:307-317`).
4. **`features/privacy/index.ts` is used by nothing**, and it does not export `DataSummaryScreen`.
5. **Contact Support may never open Mail on iOS.** `app.json` declares no
   `LSApplicationQueriesSchemes` entry, nor an Android `<queries>` entry, for `mailto`, so
   `Linking.canOpenURL` may answer false and show "No email app available". Inferred from the
   source, not run; the iOS Simulator has no Mail app to settle it.
6. **Consent is never re-asked or revoked.** `needsReConsent` (`core/privacy/consent-repository.ts:79`)
   has no production caller, though `core/privacy/constants.ts:7-8` says the app re-prompts on the
   next launch; `revokeConsent` and `logConsentEvent` are never called.
7. **No search in the app folds accents, and help's skips the steps.** The wallet, the brand list
   and help each lower-case and match a substring (`useCardSearch.ts:36-45`,
   `useBrandSearch.ts:47-57`, `HelpScreen.tsx:49-57`). Whether this app's Hermes 0.14.1 implements
   `String.prototype.normalize` is unverified.
8. **Story 6.11's file still says `Status: in-progress`** (`6-11-privacy-consent.md:5`); the
   tracker says `done`.
9. **The Italian FAQ has no mirror in `docs/`**, and no parity test like the English one's.
10. **The policy and What We Collect make claims the code contradicts** (decision 1: they stay, for
    a story of their own that also takes the website and the store forms).
    - Sentry sends crash reports from every production build, guests' included, and performance
      traces from a fifth of sessions (`core/observability/sentry.ts:95-100`). The policy lists
      "Analytics or tracking data" under what it does not collect (`assets/legal/privacy-policy.ts:55`),
      names Supabase as its only processor (`:75-76`), and says guest mode stops all cloud
      processing (`:86`). What We Collect tells guests "everything stays on device".
    - Expo's update check sends a client ID kept per install (`EAS-Client-ID`,
      `expo-updates/ios/EXUpdates/AppLoader/FileDownloader.swift:442`), against the policy's
      "Device identifiers" (`:54`) and What We Collect's "Device ID: Not collected".
    - The policy calls the local database encrypted (`:69`); `expo-sqlite` opens it with no key.
      It says consent can be revoked in Settings (`:85`); no control or call does it.
    - The Italian policy says the same at its own lines, and so do `docs/privacy-policy.html` and
      `docs/index.html:224` ("No tracking, no analytics").
    - The PRD's NFR-S6 forbids analytics outright (`docs/prd.md:1049`), so the fix is a product
      decision, not a wording one. The tracker records it as owned by no story
      (`sprint-status.yaml:234-237`).

Deferred by review pass 1 (2026-10-19; Review Triage Log rows in brackets). The pass looped back, so
these rows are moot there; they are recorded here so they are not lost:

11. **Help's content can sit under the keyboard** [5]. With the field focused, nothing insets the
    scroll view, so the lower answers and the actions stay under the keyboard until it is
    dismissed. Pre-existing: the shipped help screen, the wallet's list and the brand list behave
    the same, so one fix should take all three.
12. **A screen reader hears nothing from a search** [9]: no live region and no announcement when the
    results change or nothing matches. Pre-existing, as in the wallet's frame-D line.
13. **Settings still builds the document ground by hand** [12] (`SettingsScreen.tsx:271-286`,
    `:398-407`), so it and `DocumentScreen` can drift. Moving settings onto it needs a content gap
    for its 24pt group spacing.
14. **The shared `SearchBar` defaults to the wallet's copy** [14] (`SearchBar.tsx:100,103,114`), so a
    caller that forgets its own ships "Search loyalty cards". Making the three copy props required,
    or neutral, is a follow-up.
15. **On iPad the reading column has no maximum width** [16] (`app.json:12` sets `supportsTablet`),
    so a line runs to 90–130 characters. Pre-existing.
16. **The policy's meta line shows the raw ISO date** [17], where frame A draws "12 August 2026".
    Pre-existing.
17. **The policy's contact address cannot be copied** [18]: its paragraphs are not `selectable`.
    Pre-existing.

Deferred by review pass 2 (2026-10-19), moot there by its loopback and recorded here:

18. **An answer opened near the screen's bottom grows out of view** [36]: only its chevron moves on
    screen, and `DocumentScreen` offers help no way to scroll it in. Pre-existing: the shipped help
    screen opened answers below the fold the same way.
19. **Dragging never dismisses the keyboard** [38]: no `keyboardDismissMode` on help's scroll view,
    as on the wallet's list and the brand list. With item 11's missing inset, the content under the
    keyboard is reachable only through the Search key or a tap on blank space. One fix should take
    both, on all three lists.
20. **`ActionRow`'s comment calls 1.5 "the first of the accessibility sizes"**
    (`shared/components/ui/ActionRow.tsx:17`), found by review pass 3 [55]. It is a cut-off between
    iOS's xxxLarge (1.353) and its first accessibility size (1.786), and Android's 150% sits on it.
    The file is outside this story.

Found by the device check (2026-10-19):

21. **Typed text overflows the shared search field at the largest text size**, on help, the wallet
    and the brand list alike: a fixed 48pt field with uncapped `bodyLg` text. Pre-existing on `main`;
    to the human, above.
22. **The wallet's "0 cards / Frequently used" row overlaps and clips at the largest text size**,
    identical on `main` (`device4/shots/cmp-branch/w4-wallet-typed-ax5-light.png`).
23. **No text field sets `keyboardAppearance`**, so in the app's dark theme with the system in light
    the keyboard draws light, here and on `main`.

## Spec Change Log

**Loopback 1 (2026-10-19), from review pass 1.**

- **Triggers.**
  - Row 10 (`intent_gap`): one question open at a time moved the tapped question by up to 300pt,
    sometimes off the screen, when the answer above it closed.
  - Row 7 (`bad_spec`): this spec gave the table's head row the data rows' 48pt minimum, where frame
    C draws it at 40.
  - Row 20 (`bad_spec`): the frozen Screen-reader row asks each question to report collapsed, which
    React Native's iOS view never voices, and this spec named no way to deliver it.
- **Amended.**
  - ifero renegotiated the frozen Open row: several answers stay open, and the opening is animated,
    not jumpy. Recorded under Decided.
  - Design Notes: several open at once; the motion, with its verified route and its Jest mock; the
    iOS "collapsed" value; the head row at 40.
  - Folded in as requirements, from the moot patch rows: the bullet's space grows with the type
    (row 8); the policy ends at 24 plus the inset (row 13); tests for a search that hides an open
    question (row 3), a mixed-case echo (row 4) and each policy's first two lines (row 19); the
    record's unverified list (row 21).
- **Known-bad states avoided:** a tapped question jumping off the top; a head row 8pt taller than
  frame C with its labels off-centre; VoiceOver silent on a closed question; bullets closing up
  against their text at the accessibility sizes; the policy ending 32 above the inset where the
  others end at 24; three tests that could not fail.
- **KEEP.** Derivation 1 passed the matrix audit, 87 single-line mutations and a first pass on the
  simulator. Its diff is saved at
  `/private/tmp/claude-501/-Users-ifero-Developer-myLoyaltyCards--claude-worktrees-bmad-build-22-8-2d88d0/1af9fa4d-f117-4c7a-87d1-22c241312183/scratchpad/diffs/22-8-derivation-1.diff`
  (sha1 `989139268853430ed426705ee655dde6b44d511c`), and it applies cleanly to the baseline. Start
  from it with `git apply`, then change only what this entry lists. Keep everything else:
  - `DocumentScreen`, and `BulletList` but for the space after its glyph;
  - the `SearchBar` move, whose two files differ from the baseline's only in their header comments;
  - `parsePolicy` and the policy's blocks, the meta line and the section heads' 24 + 8 spacing;
  - `FaqItem`'s row: its padding, chevrons, held fill, testIDs and colours;
  - the three routes' options and their test, the strings, the 19 story modules and the design
    record, amended for this entry;
  - every test in derivation 1's suites, extended for this entry, except those that pin what it
    reverses: one question open at a time, and an answer that appears and goes at once.

**Loopback 2 (2026-10-19), from review pass 2.**

- **Triggers.**
  - Rows 26 and 32 (`bad_spec`): this spec had iOS lean on React Native's own "expanded", which is
    English whatever the app's language, and pair it with an Italian "chiuso", so an Italian
    VoiceOver user hears the two states in two languages. Its claim that React Native's Italian pack
    says "chiuso" describes strings this build never loads.
  - Row 37 (`bad_spec`): the spec's chevron swaps glyphs in one frame while its answer moves for
    220 ms, against the decision "animated, not jumpy".
- **Amended** (Design Notes; the frozen block is unchanged):
  - the question's name: on iOS both states from the app's strings, as its accessibility value, with
    no `accessibilityState.expanded`; on Android the state, plus `expand` and `collapse` actions that
    toggle it (rows 25 and 31 folded in with 26);
  - the chevron: one `chevron-down` turning with its answer;
  - folded in as requirements, from the moot patch rows: the measuring and wrapping tests (rows 29
    and 30), the breakpoint pinned from both sides (row 34), comments that cite dated rulings (row
    24), and the record naming the motion on Android as unverified (row 35).
- **Known-bad states avoided:** an Italian VoiceOver user hearing "expanded" beside "chiuso";
  TalkBack's Expand or Collapse reporting a state the answer does not have; the chevron flipping in
  one frame while its answer moves; four tests that could not fail; test comments pointing at this
  spec's numbers.
- **KEEP.** Derivation 2 passed the matrix audit, 50 mutants and its device check, which found and
  fixed the creeping motion (the content out of the flow while closed or moving). Its diff is saved
  at
  `/private/tmp/claude-501/-Users-ifero-Developer-myLoyaltyCards--claude-worktrees-bmad-build-22-8-2d88d0/1af9fa4d-f117-4c7a-87d1-22c241312183/scratchpad/diffs/22-8-derivation-2.diff`
  (sha1 `77a41f85772d73c410bac187e82cafe5724ad050`), and it applies cleanly to the baseline. Start
  from it with `git apply`, then change only what this entry lists:
  - in `FaqItem.tsx`, the question's accessibility props and the chevron;
  - in `en.ts` and `it.ts`, the new `help.expandedAccessibilityValue`;
  - the tests named above, and tests for the new name and the turning chevron;
  - in the design record, the _Documents_ rulings on the question's name and its chevron, and the
    unverified list.

  Everything else stays byte for byte as derivation 2 has it, the answer's motion above all: its
  clipping window, the content out of the flow while closed or moving, the `'auto'` height at rest,
  the motion skipped at mount, and the sheet's 220 ms ease-out.

## Review Triage Log

**Pass 1 (2026-10-19).** Four layers reviewed one diff:

- Project Conventions (PC);
- Blind Hunter (BH);
- Verification Gap (VG);
- Edge Case Hunter (EC).

They raised 20 findings. One holds two separate claims, which gives 21 rows. Every one was verified
at its cited location before routing. Row 10 routes to `intent_gap` and rows 7 and 20 to
`bad_spec`, so this pass loops back: the patch and defer rows below it are moot.

| #   | Layer | Location                                                                                          | Claim                                                                                                              | Verdict | Evidence                                                                                                                                                                                                                                                                                                                              | Route        |
| --- | ----- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1   | PC    | `features/help/HelpScreen.tsx:15`, `DataSummaryScreen.tsx:14`, `PrivacyPolicyScreen.tsx:15`       | The screens style with React Native's `StyleSheet`, not Unistyles'                                                 | false   | Epic 22 does the same throughout: `SettingsScreen.tsx`, `CardTypeSelectionScreen.tsx` and `CardEditScreen.tsx` import `StyleSheet` from `react-native` and take colours as theme roles from `useTheme()`. Stories 22.6 (rows 1–4) and 22.7 (row 1) ruled the same finding false; the stale written rule is 22.7's Found, not fixed 16 | reject       |
| 2   | PC    | `features/help/FaqItem.tsx:11`                                                                    | The FAQ row styles with React Native's `StyleSheet`, not Unistyles'                                                | false   | As row 1. Its held fill comes from `onPressIn`/`onPressOut` state, not a style callback                                                                                                                                                                                                                                               | reject       |
| 3   | VG    | `features/help/HelpScreen.test.tsx:343-351`                                                       | No test has a search hide the open question and then clears it                                                     | medium  | Pre-verified: a mutant that closes the open question when a search hides it passed 39 of 39. The ruling "stays open through a search" is unprotected                                                                                                                                                                                  | patch (moot) |
| 4   | VG    | `features/help/HelpScreen.test.tsx:368-375`                                                       | The no-results line is tested with lower-case queries only                                                         | low     | Pre-verified: a mutant that lower-cases the echoed query passed 39 of 39                                                                                                                                                                                                                                                              | patch (moot) |
| 5   | EC    | `shared/components/ui/DocumentScreen.tsx:67-73`                                                   | With the field focused, the keyboard covers the lower content and the actions, and nothing insets for it           | medium  | Real, and pre-existing: the shipped help screen's scroll view had no keyboard inset either, and neither has the wallet's list or the brand list                                                                                                                                                                                       | defer        |
| 6   | EC    | `features/privacy/PrivacyPolicyScreen.tsx:65-73`                                                  | A bare bullet line would draw a glyph with an empty label                                                          | false   | Neither bundled policy has a bare bullet line: each has 24 bullet lines, every one with text, and they are the parser's only input                                                                                                                                                                                                    | reject       |
| 7   | BH    | `features/privacy/DataSummaryScreen.tsx:85`                                                       | The table's head row is at least 48 tall where frame C draws it at 40, so its labels sit off-centre                | low     | Real: frame C gives the minimum height and top alignment to `.tbl-row` only, so its head is 12 + 16 + 12. The spec's Design Notes prescribed "the head row and each data row … at least 48"                                                                                                                                           | bad_spec     |
| 8   | BH    | `shared/components/ui/BulletList.tsx:71`                                                          | The glyph closes up against its text at the accessibility sizes                                                    | low     | Real: the glyph's column is `minWidth: 14` with nothing after it, so once the glyph's advance outgrows 14 (font scale 1.786) the space falls to its own side bearing, about 0.12 em, where frame A's "•&nbsp; " scales with the type                                                                                                  | patch (moot) |
| 9   | BH    | `features/help/HelpScreen.tsx:136`                                                                | A screen reader hears nothing when a search matches nothing                                                        | medium  | Real, and pre-existing: the shipped search gave no feedback at all, and the wallet's frame-D line is silent too                                                                                                                                                                                                                       | defer        |
| 10  | BH    | `features/help/HelpScreen.tsx:82`                                                                 | Opening a question below an open one moves the tapped row up by the closing answer's height, sometimes off the top | medium  | Real: one open at a time (the frozen Open row) closes the answer above at once, and nothing holds the tapped row, so it moves by 120–300pt. Accepting it, holding the row, or letting several stay open is the human's call                                                                                                           | intent_gap   |
| 11  | BH    | `features/privacy/DataSummaryScreen.tsx:69`, `features/help/HelpScreen.tsx:31`                    | `ActionRow`'s stacking breakpoint and the wallet's no-results line are copied, not shared                          | low     | Real, developer-only: it bites only if one of the originals changes, and the fix adds a shared export or a primitive                                                                                                                                                                                                                  | reject       |
| 12  | BH    | `shared/components/ui/DocumentScreen.tsx`, `features/settings/screens/SettingsScreen.tsx:271-286` | Settings still builds the document ground by hand                                                                  | low     | Real: the two can drift. The frozen Never list keeps settings out of this story                                                                                                                                                                                                                                                       | defer        |
| 13  | BH    | `features/privacy/PrivacyPolicyScreen.tsx:152-171`                                                | The policy ends 32 above the inset, where the body's bottom padding is 24                                          | low     | Real: the last block's 8 adds to the body's 24, while help and the table end at 24                                                                                                                                                                                                                                                    | patch (moot) |
| 14  | BH    | `shared/components/ui/SearchBar.tsx:100,103,114`                                                  | The shared field still defaults to the wallet's copy                                                               | low     | Real: a caller that forgets its copy ships "Search loyalty cards". The frozen Never list moves the field unchanged                                                                                                                                                                                                                    | defer        |
| 15  | BH    | `features/help/FaqItem.tsx`, `shared/components/ui/DocumentScreen.stories.tsx`                    | Frame B has no visual baseline, and frame A's story draws stand-ins                                                | low     | Real, but the design system gives stories to `shared/components/ui/` primitives only, as settings' sections show, and the story is the ground's own baseline; the fix adds a primitive                                                                                                                                                | reject       |
| 16  | BH    | `shared/components/ui/DocumentScreen.tsx:85`                                                      | On iPad the reading column has no maximum width                                                                    | low     | Real, and pre-existing: the shipped screens had none either                                                                                                                                                                                                                                                                           | defer        |
| 17  | BH    | `features/privacy/PrivacyPolicyScreen.tsx:112-114`                                                | The meta line shows the raw ISO date where frame A draws "12 August 2026"                                          | low     | Real, and pre-existing: the shipped meta line shows the same                                                                                                                                                                                                                                                                          | defer        |
| 18  | BH    | `features/privacy/PrivacyPolicyScreen.tsx:129-134`                                                | The contact address cannot be copied                                                                               | low     | Real, and pre-existing: the shipped paragraphs were not selectable either                                                                                                                                                                                                                                                             | defer        |
| 19  | BH    | `features/privacy/PrivacyPolicyScreen.test.tsx:91-96`                                             | The test shares the parser's two-line assumption                                                                   | low     | Real: a policy that gained a leading line would draw "Last updated" as a paragraph, and the test would still pass                                                                                                                                                                                                                     | patch (moot) |
| 20  | BH    | `docs/design/cardi/cardi-design-system.md:1253`                                                   | The record says each question reports expanded or collapsed, which VoiceOver does not                              | medium  | Real: React Native's iOS view voices the expanded state only when it is true (`RCTViewComponentView.mm:1440-1443`), so a closed question is read as its name and "button". The frozen Screen-reader row asks for both states, and the spec named no way to deliver them on iOS                                                        | bad_spec     |
| 21  | BH    | `docs/design/cardi/cardi-design-system.md:1295`                                                   | The record's Unverified line omits that help's actions can sit under the keyboard                                  | low     | Real: it is only in the story's notes                                                                                                                                                                                                                                                                                                 | patch (moot) |

**Pass 2 (2026-10-19).** The same four layers reviewed derivation 2's diff. They raised 19 findings, one
row each. Four repeat pass 1's rows and are carried. Rows 26 and 32 (one defect) and row 37 route to
`bad_spec`, so this pass loops back too: its patch and defer rows are moot.

| #   | Layer | Location                                                                                           | Claim                                                                                                    | Verdict     | Evidence                                                                                                                                                                                                                                                                        | Route        |
| --- | ----- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 22  | PC    | `features/help/HelpScreen.tsx:15`, `DataSummaryScreen.tsx:14`, `PrivacyPolicyScreen.tsx:15`        | The screens move off Unistyles' `StyleSheet`                                                             | false       | carried: row 1. The reviewer adds Story 22.4's row 1, which moved `BarcodeScreen` back; 22.6 and 22.7 ruled the move false                                                                                                                                                      | reject       |
| 23  | PC    | `features/help/HelpScreen.tsx:31`                                                                  | The wallet's no-results offset is copied, not shared                                                     | low         | carried: row 11                                                                                                                                                                                                                                                                 | reject       |
| 24  | PC    | `DataSummaryScreen.test.tsx:44,306`, `PrivacyPolicyScreen.test.tsx:180`, `HelpScreen.test.tsx:342` | Four test comments cite this spec's local numbers (decision 1, Found, not fixed 7)                       | low         | Real: outside this spec those numbers point nowhere, while the diff's other comments cite the dated ruling                                                                                                                                                                      | patch (moot) |
| 25  | EC    | `features/help/FaqItem.tsx:115`                                                                    | TalkBack's Expand and Collapse actions flip the reported state without opening the answer                | medium      | Real: React Native Android adds Expand or Collapse for `accessibilityState.expanded` (`ReactAccessibilityDelegate.kt:74-78`), and on either it sets the native tag, then falls through unless JS declared the action (`:220-263`). FaqItem declares none                        | patch (moot) |
| 26  | EC    | `features/help/FaqItem.tsx:115-123`                                                                | On iOS an Italian VoiceOver user hears the open state in English and the closed one in Italian           | medium      | Real: `RCTLocalizedStringFromKey` returns the English default unless an `RCTI18nStrings` bundle has the string, and every `Localizable.strings` in this build is an empty 64-byte header. The spec prescribed relying on it, and called its Italian pack the source of "chiuso" | bad_spec     |
| 27  | EC    | `shared/components/ui/DocumentScreen.tsx:67-73`                                                    | With the field focused, the keyboard covers the lower content                                            | medium      | carried: row 5                                                                                                                                                                                                                                                                  | defer        |
| 28  | EC    | `features/privacy/PrivacyPolicyScreen.tsx:65-71`                                                   | A bare bullet line would draw an orphan glyph                                                            | false       | carried: row 6                                                                                                                                                                                                                                                                  | reject       |
| 29  | VG    | `features/help/FaqItem.test.tsx:89-90`                                                             | The motion tests cannot tell which view's layout sets the answer's height                                | medium      | Pre-verified: `fireEvent` climbs to the nearest ancestor with the handler, so a mutant that moves `onLayout` onto the clipping window passed 78 of 78; that mutant pauses the opening at 0 and then snaps                                                                       | patch (moot) |
| 30  | VG    | `FaqItem.test.tsx:302`, `HelpScreen.test.tsx:509`, `DataSummaryScreen.test.tsx:362`                | Nothing pins that the answer, help's subtitle and no-results line, or What We Collect's description wrap | medium      | Pre-verified: mutants that add `numberOfLines` to each passed every suite, against the frozen Large-text row's "nothing clips"                                                                                                                                                  | patch (moot) |
| 31  | BH    | `features/help/FaqItem.tsx:110-115`                                                                | On Android the question offers Expand and Collapse actions that do nothing                               | medium      | As row 25: the same defect                                                                                                                                                                                                                                                      | patch (moot) |
| 32  | BH    | `FaqItem.tsx:115-123`, `cardi-design-system.md:1260`, `HelpScreen.test.tsx:577`                    | On iOS the two states are spoken in two languages, and the record's reason is wrong                      | medium      | As row 26: the same defect                                                                                                                                                                                                                                                      | bad_spec     |
| 33  | BH    | `features/help/HelpScreen.tsx:118-119`                                                             | The field's name is its own placeholder, so VoiceOver may read "Search help" twice                       | maybe-false | Whether VoiceOver reads a field's placeholder after its label needs a VoiceOver pass, which this host cannot run. If true it is low: the wallet's name and placeholder are the same words too                                                                                   | reject       |
| 34  | BH    | `features/privacy/DataSummaryScreen.test.tsx:327-336`                                              | The stacking breakpoint is pinned only from above                                                        | low         | Real: the test below the line uses 1.353, so a breakpoint of 1.4 passes the suite                                                                                                                                                                                               | patch (moot) |
| 35  | BH    | `cardi-design-system.md:1281`, `:1324`                                                             | The record states the motion's riskiest parts as fact, and its Unverified line names only Android        | low         | Real: the one-frame switch of `position` and height, and Reduce Motion, were seen on the iOS simulator only                                                                                                                                                                     | patch (moot) |
| 36  | BH    | `FaqItem.tsx:110`, `DocumentScreen.tsx:67`                                                         | Nothing brings an answer opened near the screen's bottom into view                                       | low         | Real, and pre-existing: the shipped help screen opened answers below the fold the same way                                                                                                                                                                                      | defer        |
| 37  | BH    | `features/help/FaqItem.tsx:87`, `:130`                                                             | The chevron swaps at once while the answer moves for 220 ms                                              | low         | Real: the glyph swaps in the press's frame. The spec's chevron rule predates the motion decision, and rotated 180° `chevron-down` is exactly `chevron-up`, so one glyph can turn with the answer                                                                                | bad_spec     |
| 38  | BH    | `shared/components/ui/DocumentScreen.tsx:67-70`                                                    | Dragging never dismisses the keyboard                                                                    | low         | Real, and pre-existing: the shipped help screen, the wallet's list and the brand list set no `keyboardDismissMode` either. One fix with row 5's inset                                                                                                                           | defer        |
| 39  | BH    | `FaqItem.tsx:96-99`, `BottomSheet.tsx:167`                                                         | The sheet's easing is retyped, not shared                                                                | low         | Real, developer-only: it bites only if the sheet's curve changes, and the fix adds an export to `BottomSheet`                                                                                                                                                                   | reject       |
| 40  | BH    | `HelpScreen.test.tsx:49`, `FaqItem.test.tsx:75` and three more                                     | The suites each re-implement the same host-tree helpers                                                  | low         | Real, developer-only: the fix adds a shared test module                                                                                                                                                                                                                         | reject       |

**Pass 3 (2026-10-19).** The same four layers reviewed derivation 3's diff. Verification Gap found
nothing; the other three raised 16 findings, one row each, five of them carried. Nothing routes to
`intent_gap` or `bad_spec`, so there is no loopback: rows 48, 50, 52, 54 and 55 are patched by
derivation 3's subagent, and the deferred rows are carried, already recorded.

| #   | Layer | Location                                                                                        | Claim                                                                                              | Verdict     | Evidence                                                                                                                                                                                                                                                                                                                                                             | Route  |
| --- | ----- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 41  | PC    | `features/help/HelpScreen.tsx:15`, `DataSummaryScreen.tsx:14`, `PrivacyPolicyScreen.tsx:15`     | The screens move off Unistyles' `StyleSheet`                                                       | false       | carried: rows 1 and 22                                                                                                                                                                                                                                                                                                                                               | reject |
| 42  | PC    | `features/help/FaqItem.tsx:20`, `shared/components/ui/BulletList.tsx:2`, `DocumentScreen.tsx:2` | The new files style with React Native's `StyleSheet`                                               | false       | carried: row 2 for `FaqItem`. `BulletList` and `DocumentScreen` follow the pattern `FormScreen.test.tsx:195-206` and `ScreenHeader.test.tsx:131-150` pin for `shared/components/ui/`, which 22.6 and 22.7 ruled the same way                                                                                                                                         | reject |
| 43  | EC    | `features/help/HelpScreen.tsx:104`, `PrivacyPolicyScreen.tsx:106`, `DataSummaryScreen.tsx:100`  | A second press of the back before the first pop commits pops the screen beneath too                | maybe-false | `router.back()` queues an unscoped `GO_BACK` (`expo-router/build/global-state/routing.js:137-143`, `:203`), so two presses inside one transition would pop twice; whether a second press lands during the native pop is unchecked. If true it is low, and pre-existing: the native header's back these screens had, and settings', call `router.back()` the same way | reject |
| 44  | EC    | `features/help/FaqItem.tsx:112-119`                                                             | Reduce Motion switched on while the app runs is not seen until it restarts                         | low         | Real, and app-wide: Reanimated reads the setting once, at launch, as the design record already says for the scanner (`cardi-design-system.md:853`), and every timed motion in the app shares it. Switching it mid-session is rare, and the fix adds a listener                                                                                                       | reject |
| 45  | EC    | `shared/components/ui/DocumentScreen.tsx:67-70`                                                 | With the field focused, the keyboard covers the lower content                                      | medium      | carried: rows 5 and 27                                                                                                                                                                                                                                                                                                                                               | defer  |
| 46  | EC    | `features/privacy/PrivacyPolicyScreen.tsx:65-71`                                                | A bare bullet line would draw an orphan glyph                                                      | false       | carried: rows 6 and 28                                                                                                                                                                                                                                                                                                                                               | reject |
| 47  | BH    | `features/privacy/PrivacyPolicyScreen.tsx:77`, `:156`                                           | A paragraph after a list now stands 8 below it, so it reads as part of the list                    | false       | The device shot shows the paragraph starting at the text column's edge, 32 left of the list's text, so it reads as the next paragraph. 8 between blocks is frame A's paragraph rhythm, and the spec rules that a blank line draws nothing                                                                                                                            | reject |
| 48  | BH    | `cardi-design-system.md:1262`, `features/help/FaqItem.tsx:125`                                  | "In the app's language" is untrue on Android                                                       | low         | Real: the same paragraph says TalkBack voices the state in the system's language. The spec's Design Notes had the same words, amended with this row                                                                                                                                                                                                                  | patch  |
| 49  | BH    | `shared/components/ui/DocumentScreen.tsx:67-71`                                                 | The new document ground handles no keyboard, and the deferral's reason does not fit it             | medium      | carried: rows 5, 27 and 38                                                                                                                                                                                                                                                                                                                                           | defer  |
| 50  | BH    | `cardi-design-system.md:1339`                                                                   | The record's unverified list holds a known defect and leaves out the others                        | low         | Real: the keyboard covering help's lower content is seen, not untested, and the screen reader's silence on a search, drag-to-dismiss, an answer opened out of view and Contact Support's likely `mailto` failure are missing. The spec's Design Notes asked for the first, amended with this row                                                                     | patch  |
| 51  | BH    | `shared/components/ui/SearchBar.tsx:133`, `:148`                                                | The search field clips its text at the largest sizes                                               | false       | The largest-size shot (`device/b1-help-rest-ax5-en.png`, cropped at full resolution) shows the field's text whole inside its border: the input's text does not scale by the full factor the reviewer computed                                                                                                                                                        | reject |
| 52  | BH    | `shared/components/ui/BulletList.tsx:31`                                                        | `tone: 'primary'` reads as the theme's `primary` role, beam in dark, though it means `textPrimary` | low         | Real: on the same screen `Button`'s `primary` is beam in dark and the list's is cream                                                                                                                                                                                                                                                                                | patch  |
| 53  | BH    | `shared/i18n/locales/en.ts:232`                                                                 | Guests now read a claim the story knows is false, and no issue tracks it                           | low         | Real, but both halves are ifero's decisions, every word staying and everyone opening the screen, so the intent excludes changing the words. The follow-up issue is filed at the handback with every Found, not fixed item                                                                                                                                            | reject |
| 54  | BH    | `features/privacy/PrivacyPolicyScreen.tsx:104-110`                                              | The policy's title testID breaks the other two screens' pattern                                    | low         | Real: it takes the default `privacy-policy-document-title`, where help and What We Collect name theirs `help-title` and `data-summary-title`                                                                                                                                                                                                                         | patch  |
| 55  | BH    | `features/privacy/DataSummaryScreen.tsx:64-68`                                                  | The breakpoint's comment calls 1.5 an accessibility size and speaks of iOS only                    | low         | Real: 1.5 is a cut-off between iOS's xxxLarge (1.353) and its first accessibility size (1.786), shared with `ActionRow`, and Android's 150% setting sits on it                                                                                                                                                                                                       | patch  |
| 56  | BH    | `features/help/HelpScreen.tsx:119`                                                              | The field's name is tied to its placeholder string                                                 | low         | Real, developer-only: it bites only if the placeholder changes, and the spec chose it; row 33 holds the VoiceOver question                                                                                                                                                                                                                                           | reject |

**Correction (device check, 2026-10-19).** Row 51's refutation rested on the placeholder alone. The
device check found typed text overflowing the field at the largest size, pixel-identical on `main`;
it goes to the human (Implementation Notes) and is Found, not fixed 21.

## Design Notes

Measurements are in pt. The frames are drawn at 393 × 852 in light; `cardi-design-system.md` wins
any conflict.

**The document ground (`DocumentScreen`).** All three screens draw it.

- **Ground.** `background`, in a safe-area view on the top, left and right edges. The page scrolls
  under the home indicator, so the bottom inset goes into its padding instead (settings' recipe).
- **Header.** `ScreenHeader`, its back running `router.back()`. Help is titled `help.title`, the
  policy by the title it takes today, and What We Collect `privacy.dataSummary.title`. The frames'
  56pt bar with a 24pt title is overruled by _Forms_ (Story 22.6): every stack-pushed screen's
  title is 17pt.
- **Body.** A `ScrollView` padded 16 at the top, 24 at the sides, and 24 plus the bottom inset at
  the bottom. No title in the body (frames A–C). A press while the keyboard is up acts at once
  (`keyboardShouldPersistTaps="handled"`, as the wallet and the brand list scroll).
- **testIDs.** Each screen's scroll testID stays on its scroll view, and `help-title` and
  `data-summary-title` move to their header titles.

**Bullets (`BulletList`).** Each item is a "•" whose glyph starts 18 in from the list's edge, then
its text from 32 in; wrapped lines align under the text, not the bullet (the frames' hanging
indent). `bodyMd`, items 8 apart, in `textPrimary` or `textSecondary` as the caller asks. The glyph
is not read; each item is read as its text. The space after the glyph grows with the type, as frame
A's "•&nbsp; " does, so at the accessibility sizes the bullet never closes up against its text: the
glyph's column widens to hold both (review pass 1, row 8).

**Prose (frame A), the policy.**

- **Source.** The policy string, parsed as today: the first two lines are not drawn, a line
  matching `SECTION_HEADER_RE` is a section head, a `•` line is a bullet and any other non-blank
  line a paragraph. A blank line draws nothing; the blocks carry the spacing.
- **Meta.** As today, in `captionSm` `textSecondary`: document metadata, the chrome tier
  (Story 21.2).
- **Section head.** `bodyLgStrong` `textPrimary`, 32 above and 8 below, announced as a heading. The
  frame's 16 / 700 maps to 17 / 600: Story 21.6 moved the frames' 16pt type to 17 or 15 by role.
- **Paragraph.** `bodyMd` `textPrimary`, 8 below.
- **Bullets.** Consecutive bullet lines are one `BulletList` in `textPrimary`, 8 below.
- **The end.** The last block leaves nothing below it, so the policy ends at 24 plus the bottom
  inset, as help and the table do (review pass 1, row 13).
- No link, icon, card or box. The e-mail address stays plain text.

**Searchable FAQ (frame B), help.**

- **Subtitle.** `help.subtitle` in `bodyMd` `textSecondary`.
- **Search.** `SearchBar` with testID `help-search`, 24 below the subtitle. Its placeholder,
  `help.searchPlaceholder`, also names it for assistive technology, and its clear button is named
  by a new `help.clearSearchAccessibilityLabel`, "Clear search" ("Cancella ricerca"), as the
  wallet's is. It matches as today, and does not fold accents (Found, not fixed 7).
- **List.** 24 below the field, one `Surface divided`, an item per question with a full-width rule
  between items (testID `help-faq-list`).
- **Question row** (testID `help-question-<id>`). At least 48, padded 12/16, with 12 between its
  parts: the question in `bodyLgStrong` `textPrimary`, wrapping, then the chevron, centred on the
  row. The frame's 16 / 600 and 14/16 padding take the system row's 17pt and 48.
  - **Chevron.** Lucide `chevron-down` at 24 / 1.5 in `textSecondary`, the chevron of every row
    (_Settings_), over the frame's 18 / 2. It turns with its answer: it rotates to point up as the
    answer opens, on the answer's own motion, and back as it closes; under Reduce Motion it turns
    at once. Rotated 180°, `chevron-down` is exactly `chevron-up`'s glyph, so an open question
    draws frame B's chevron (review pass 2, row 37).
  - **Press.** The row takes `surfaceElevated` while held, as `ActionRow` does.
  - **Name.** A button named by its question, reporting expanded or collapsed: on iOS in the app's
    language, from its own strings; on Android in TalkBack's own words, in the system's language
    (review pass 3, row 48).
    - **iOS.** React Native's own "expanded" (`RCTViewComponentView.mm:1440-1443`) is English
      whatever the app's language: `RCTLocalizedStringFromKey` returns its English default unless
      an `RCTI18nStrings` bundle holds the string, and every `Localizable.strings` in this build is
      an empty 64-byte header (`node_modules/react-native/React/I18n/`). So on iOS the question
      carries no `accessibilityState.expanded`. Its accessibility value says the state instead, from
      a new `help.expandedAccessibilityValue` and `help.collapsedAccessibilityValue`: "expanded"
      and "collapsed", "aperto" and "chiuso". iOS reads the value after the name (`:1452-1457`).
    - **Android.** `accessibilityState.expanded` stays: TalkBack voices both states in the system's
      language. It also offers Expand and Collapse in its actions menu for that state, and on
      either sets the state natively, falling through unless JS declared the action
      (`ReactAccessibilityDelegate.kt:74-78`, `:220-263`). So the question declares `expand` and
      `collapse` accessibility actions, and each toggles it as a press does (review pass 2, rows 25
      and 26).
- **Answer** (testID `help-answer-<id>`). Beneath its question, padded 0 16 16: the answer in
  `bodyMd` `textSecondary`, then its steps 8 below as a `BulletList` in `textSecondary`. Frame B
  draws no steps, but every item has two to four (Story 4.3), and they stay. No tint and no fill.
- **Several open at once** (decision, 2026-10-19): opening a question closes no other, and pressing
  an open question closes it. At rest all are closed, and an open question stays open through a
  search. Frame B's prompt asks for one open at a time; closing the answer above moved the tapped
  question by up to 300pt, sometimes off the screen (review pass 1, row 10).
- **Motion** (decision, 2026-10-19: the opening is animated, not jumpy). The answer grows from
  beneath its question to its full height, and everything below it moves with it, over 220 ms,
  ease-out, on the UI thread: the sheet's timing (_Sheets_). Closing runs the same motion in
  reverse, so no press makes the page jump. Under Reduce Motion it opens and closes at once. A
  closed answer holds no space and is not read.
  - **Not `LayoutAnimation`.** In this app it does nothing on Android, where
    `enableLayoutAnimationsOnAndroid` is off
    (`react-native/src/private/featureflags/ReactNativeFeatureFlags.js:352`), and it ignores
    Reduce Motion.
  - **A verified route:** Reanimated 4.2.1 animating the answer's height to the height its content
    measures, as the app already times its motion with `withTiming` (`BarcodeFlash.tsx:46`, `:148`),
    which follows Reduce Motion unless told otherwise.
  - **In Jest** the Reanimated mock (`jest.setup.js:301-531`) returns an empty style from
    `useAnimatedStyle` and finishes `withTiming` at once, calling back `true`. It has no
    `useDerivedValue`, `ReduceMotion`, `LinearTransition` or `measure`, so extend it for anything
    else the code uses. Spy on `withTiming` before rendering: the worklets plugin captures the
    function at render time.
- **No match** (testID `help-no-results`). In the list's place, one line, `help.noResults`, "No
  answers matching “{{query}}”" ("Nessuna risposta corrisponde a “{{query}}”"), the query trimmed,
  in `bodyMd` `textSecondary`, centred, 80 below the field: the wallet's frame D. A miss is not an
  error.
- **Actions.** 32 below the list or the line, full width and 8 apart: Contact Support (`primary`)
  above Submit Feedback (`secondary`), keeping their testIDs, names and targets. They take the
  default 48, not the frame's 52: _Buttons_ gives 52 only to a footer's primary and a sheet's
  actions, as settings' guest buttons show (Story 22.7).

**Two-column table (frame C), What We Collect.**

- **Who sees it.** Everyone (decision 3). The screen reads no session, so nothing waits and nothing
  redirects; `data-summary-loading` goes.
- **Description.** `privacy.dataSummary.description` in `bodyMd` `textSecondary`.
- **Table,** 32 below: ruled, not boxed. No outer border, card, fill, zebra stripe, vertical rule or
  colour.
  - **Rows.** Each data row: 16 between the columns, padded 12 above and below and 0 at the sides,
    at least 48 tall, with a 1pt `border` rule beneath, the last row's included, so the table ends
    rather than trails off. The head row is the same but for its height: no minimum, so it stands
    40, its 16pt line between 12 and 12, as frame C draws it (review pass 1, row 7).
  - **Head.** "Category" and "Data Collected" in `overline` `textSecondary`, uppercased by style.
    _Section header_ gives table heads the `overline` tier and its one colour, over the frame's ink.
  - **Columns.** The category takes 40 % of the width, in `bodyMdStrong` `textPrimary`; the data
    takes the rest, in `bodyMd` `textSecondary`, top-aligned and wrapping. A row not collected draws
    like every other row.
  - **Large text.** From a font scale of 1.5, each row sets its data under its category, full width,
    as `ActionRow` does (Story 22.7), so no word breaks in a 40 % column.
  - **Reading.** Each row is one element, read as its category, then its data. The head row is read
    as its two labels.
  - `data-summary-table` and every `data-row-<id>` stay.
- **After the table, nothing** (decision 2). Frame C's "Download my data" link and its footnote are
  not drawn.

**Dark mode** (no frame draws it). Every value is a theme role: the ground `#000000`; the FAQ
surface ink `#181824`, outlined `#3A3A48`; cream text with muted `#B5B5AB`; the primary button in
beam with an ink label; the secondary outlined in beam (Story 22.7, Found, not fixed 7).

**Record** a `### Documents` section in `cardi-design-system.md`, after `### Settings`, headed
"**RULED 2026-10-19 (Story 22.8)**, from `frames/cardi-document-frames.html` and
`stitch-prompts-document.txt`". It holds:

- every ruling above;
- `DocumentScreen`, `BulletList` and `SearchBar` added to _Components_' table;
- _Icons_: help, the policy and What We Collect leave the root stack's MaterialIcons back;
- its known gaps, apart from what is unverified (review pass 3, row 50). The known gaps point at
  Found, not fixed: the keyboard's missing inset and drag-to-dismiss (11 and 19), a screen reader
  hearing nothing from a search (12), an answer opened near the bottom growing out of view (18), and
  Contact Support's `mailto` query, likely failing (5). The unverified list names Android, with the
  answer's motion, its one-frame switch of `position` and height, and Reduce Motion there (review
  pass 2, row 35), and what VoiceOver and TalkBack actually speak. The motion's rulings say what the
  iOS simulator showed, and no more.

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors.
- `yarn lint` -- expected: no errors, no warnings.
- `yarn format:check` -- expected: clean, untracked docs included.
- `yarn test` -- expected: all suites green.

**Manual checks:**

- **iOS simulator, 393pt, light and dark.** Check:
  - frame A, in English and in Italian;
  - frame B at rest, with one question open and with two, while searching, with no match, and with
    the keyboard up;
  - an answer opening and closing, caught mid-motion by a screen recording, with Reduce Motion off
    and on;
  - frame C;
  - the largest text size on all three;
  - the wallet's and the brand list's search fields, against `main`.
- **Unchecked here:** Android, for which this host has no phone emulator; VoiceOver and TalkBack;
  Mail on a real device (Found, not fixed 5).

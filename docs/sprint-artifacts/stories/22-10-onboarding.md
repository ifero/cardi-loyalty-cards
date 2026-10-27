---
title: 'Story 22.10: Onboarding — the four screens on the Cardì frames, with the adopted illustrations'
type: 'feature'
created: '2026-10-24'
status: 'done'
baseline_commit: '0c6ae9535df715b6f415bf366a0347511a66b09d'
route: 'dispatch'
review_loop_iteration: 1
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Onboarding still draws the pre-Cardì app. Welcome puts `BrandedIcon` over three tinted
rectangles, with its button in the scroll. Mode selection hand-rolls its header. The difference
explanation is a centred `Modal` with a flat black scrim. The highlights carousel builds its pictures
from tinted Views and a MaterialIcons glyph, and pins the old blue active dot. Nothing is anchored, and
nothing moves. The adopted illustration set and brand moment D exist as Lottie files
(`assets/animations/onboarding/`, #278) that nothing plays.

**Approach:** Redraw Welcome, mode selection, the difference sheet and the three highlights as the
design system and the adopted canvas rule them (Design Notes), on the shared primitives. Play the
adopted Lottie files once — the mark intro and the welcome drawing together, each highlight when its
slide is shown — and show their last frames under Reduce Motion. Keep the flow, routes, guards, copy
and testIDs.

## Boundaries & Constraints

**Always:**

- The flow is unchanged: the first-launch gate, each screen's guard, the routes (welcome → mode
  selection → highlights or create account; sign in from Welcome), and `completeFirstLaunch()` +
  `router.replace('/')` at the end of the highlights.
- Copy is unchanged, except the difference sheet's body, split into its three paragraphs (new keys in
  `en.ts` and `it.ts`), the dots' accessibility label, moved into i18n, and the difference sheet's
  announcements (decision 4).
- Existing testIDs stay; new parts take new ones.
- Every value is a theme role (`useTheme()`), except the "Recommended" pill (decision 3), and each
  drawing takes its `-light` or `-dark` file by `isDark`. `cardi-mark-intro.json` serves both
  schemes.
- Every animation plays once (`loop={false}`) and rests on its last frame. Under Reduce Motion
  (Reanimated's `useReducedMotion`) each shows its last frame at once (`progress={1}`, no play).
- The drawings and the mark are decorative: hidden from assistive technology. The titles carry the
  meaning.
- The Lottie player lives in `features/onboarding/`, never under `shared/components/ui/`, which
  Storybook bundles and cannot bundle it.
- New styling is React Native `StyleSheet` with `useTheme()`, never NativeWind, and no new Unistyles.
- `lottie-react-native` comes from `npx expo install lottie-react-native`, resolving `~7.3.4`;
  `yarn.lock` gains only it and its own dependencies.

**Never:**

- Commit, push, or change `sprint-status.yaml` or any other tracker file: the orchestrator owns all
  three.
- Edit `assets/animations/` or `docs/design/cardi/lottie/`, except for `cardi-mark-intro` as
  decision 6 allows.
- Loop an animation, or draw the frames' stand-in ì, their filled brand-colour tiles or their looping
  beam.
- Touch the launch screen, which Story 16.17 keeps anti-spectacle, or any screen outside onboarding.
- Add a config plugin or an `app.json` change for Lottie.

## I/O & Edge-Case Matrix

| Scenario         | Input / State                                          | Expected Output / Behavior                                                                                                                                          | Error Handling              |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Welcome          | First launch, signed out                               | The mark intro and the welcome drawing start together once Welcome's entrance ends (decision 5); the fan holds closed until 0.9 s; both rest on their static frames | N/A                         |
| Reduce Motion    | On, any onboarding screen                              | Every drawing and the mark show their last frame; nothing plays                                                                                                     | N/A                         |
| Dark             | Dark scheme                                            | `-dark` drawings on the black ground; the mark on its ink field                                                                                                     | N/A                         |
| First slide      | Highlights mount                                       | Slide 1's drawing plays once                                                                                                                                        | N/A                         |
| New slide        | Next, or a swipe that settles on a slide not yet shown | That slide's drawing plays once                                                                                                                                     | N/A                         |
| Seen slide       | A swipe back to a slide already shown                  | Its drawing rests on its last frame (decision 1)                                                                                                                    | N/A                         |
| Back to Welcome  | Mode selection → back                                  | Welcome rests on its last frames; nothing replays                                                                                                                   | N/A                         |
| Scheme change    | Light ↔ dark mid-onboarding                            | The new scheme's file, at its last frame if it had played                                                                                                           | N/A                         |
| Difference       | "What's the difference?"                               | `BottomSheet`: title, three paragraphs, "Got it"; the scrim, back or "Got it" closes it (decision 2)                                                                | N/A                         |
| Large text       | Font scale 1.5 and above                               | Each page's content scrolls; the footer stays anchored; nothing clips                                                                                               | N/A                         |
| Load failure     | `onAnimationFailure`                                   | The screen works; the drawing's box stays empty                                                                                                                     | Nothing thrown or announced |
| Not first launch | Any onboarding route                                   | The guard replaces to `/`, as today                                                                                                                                 | N/A                         |

**Decisions (ifero, 2026-10-25):**

1. **A slide shown again rests.** A drawing plays the first time its slide is shown: at once on
   Next, as its page slides in, or when a swipe settles on it. When a swipe brings back a slide
   already shown, it stays on its last frame. "Plays once" holds per visit to the screen, so going
   back is quiet. (Wording amended by ifero, 2026-10-26, to match Next starting at once.)

**Decisions (ifero, 2026-10-26, at the step-3 matrix audit):**

2. **The sheet's grabber stays decoration.** The scrim, back or "Got it" closes the difference
   sheet; the grabber does not.
3. **The "Recommended" pill is the one exception to theme roles:** beam with ink text, in both
   schemes.

**Decisions (ifero, 2026-10-26, at review pass 1):**

4. **The difference sheet announces as every sheet does.** The shared sheet's "opened" and "closed"
   announcements replace the screen's own opening line. Its Italian name becomes masculine
   singular, so the participle agrees: "Pannello informativo sull'archiviazione" (→ "…aperto",
   "…chiuso").

**Decisions (ifero, 2026-10-26, at the handback):**

5. **Welcome's two animations start once its entrance has finished,** not on mount, so brand moment
   D is not played under the entrance's fade.
6. **The mark intro is regenerated with the mark at the app icon's proportion.** The rule against
   editing the Lottie files and their generator is lifted for `cardi-mark-intro` only.

</frozen-after-approval>

## Code Map

- `app/_layout.tsx:164-185` -- the three routes, `headerShown: false`. `:106-117` the gate. Unchanged;
  `test/root-layout.welcome-gate.test.tsx` pins it.
- `core/settings/settings-repository.ts:13-40` -- `first_launch` in kv-store, `isFirstLaunch()`,
  `completeFirstLaunch()`. Unchanged.
- `features/onboarding/screens/WelcomeScreen.tsx` (+ test) -- guard `:23-27`; a non-bouncing
  `ScrollView` with `BrandedIcon size={100} iconSize={34}` (`:46`), title, subtitle,
  `FannedCardIllustration`, a `Button` and a hand-made `Pressable` link. testIDs `welcome-screen`,
  `welcome-branded-icon`, `welcome-title`, `welcome-subtitle`, `welcome-fanned-illustration`,
  `welcome-get-started`, `welcome-sign-in`.
- `features/onboarding/screens/ModeSelectionScreen.tsx` (+ test) -- guard `:27-31`; announces itself
  on mount (`:34`); hand-rolled header `:39-76`; two `ModeOptionCard`s (local `recommended`), the
  footer text, and the link opening `InfoTooltipModal`. testIDs `mode-selection-screen`,
  `mode-selection-back`, `mode-option-local`, `mode-option-cloud`,
  `mode-selection-whats-difference`, `info-tooltip-modal`.
- `features/onboarding/components/ModeOptionCard.tsx` (+ test) -- icon disc, title, subtitle,
  eyebrow, "Recommended" pill; pressed opacity 0.92.
- `features/onboarding/components/InfoTooltipModal.tsx` (+ test) -- the difference `Modal`. It goes.
- `features/onboarding/screens/FeatureHighlightsScreen.tsx` (+ test) -- guard `:63-67`; Skip top
  right; a paging horizontal `FlatList` of three slides (`all-cards`, `scan-or-manual`, `your-data`)
  with inline illustrations (`:105-186`); `onMomentumScrollEnd` → `goTo`, Next → `scrollToIndex`;
  `PaginationDots`; Next / "Let's go!". testIDs `feature-highlights-screen`, `highlights-skip`,
  `highlights-flatlist`, `highlight-slide-{i}`, `highlight-content-{i}`, `pagination-dots`,
  `highlight-next-button`.
- `features/onboarding/components/HighlightSlide.tsx` (+ test), `PaginationDots.tsx` (+ test) -- the
  slide and the dots; the dots' label is hardcoded English (`:19`) and its test pins `#1A73E8`.
- `features/onboarding/components/BrandedIcon.tsx`, `FannedCardIllustration.tsx` -- no tests;
  Welcome is their only caller. They go.
- `features/onboarding/hooks/useHighlightPagination.ts` (`TOTAL_HIGHLIGHT_SLIDES` 3),
  `useModeSelection.ts`, `index.ts` -- unchanged, apart from the barrel's deletions.
- `features/onboarding/onboarding.integration.test.tsx` -- welcome → modes → highlights → skip.
- `shared/components/ui/` -- `ScreenHeader` (`title`, `onBack`; no insets of its own, and its own
  back label `sharedUi.screenHeader.backAccessibilityLabel`), `PrimaryActionFooter` (`children`,
  `margin`, `insetBottom`, `testID`), `BottomSheet` (`visible`, `onClose`, `title`, `description`,
  `children`, `actions`, `testID`, `accessibilityLabel`), `Button`. `BottomSheet.tsx:181-203`
  announces `sharedUi.bottomSheet.openedAnnouncement` / `closedAnnouncement` with `accessibilityLabel`
  as `{{label}}` (`en.ts`, `it.ts:287-288`); leave those shared keys alone (decision 4). `shared/theme`: `useTheme()` → `{ theme, isDark }`;
  `TYPOGRAPHY` (`displayLg`, `headlineMd`, `sheetTitle`, `bodyLg`, `bodyMd`, `bodyMdStrong`,
  `labelBold`); `SPACING`, `TOUCH_TARGET`. Icons: `lucide-react-native/icons/smartphone`,
  `/cloud-upload`.
- **Lottie** (`lottie-react-native` 7.3.4, not installed; `node_modules/expo/bundledNativeModules.json:97`).
  `LottieView` defaults: `loop: true`, `autoPlay: false`, `progress: 0`, `resizeMode: 'contain'`.
  `progress={1}` shows the last frame on iOS and Android; `onAnimationFinish` fires only with
  `loop={false}`; `onAnimationFailure`; ref `play()` and `reset()`. No config plugin. It left Expo
  Go, so it needs a native build (`yarn ios`, `yarn android`). Sources are imported, not required:
  `import welcomeLight from '@/assets/animations/onboarding/onboarding-welcome-light.json'`
  (precedent `core/catalogue/catalogue-repository.ts:9`); add no `.json` mapper.
- **The files**, 60 fps: `cardi-mark-intro` 100×100, 52 frames; `onboarding-welcome` 280×190, 164;
  `-all-your-cards` 128; `-scan-or-type` 149; `-your-data` 135. Each `-light` and `-dark`.
- **The mark's size in its intro** (decision 6): `docs/design/cardi/lottie/build-onboarding-lottie.py:81-85`
  fits the mark into a 34 box in the 100 field (`MARK_ICON_SIZE = 34`, copied from the old
  `BrandedIcon`), and `mark_intro` (`:453-464`) centres the inline mark's bounding box
  (`assets/images/cardi-mark-inline.svg`, 834.556 × 1024) in the field at that size. In the app icon,
  `assets/images/cardi-mark.svg`, the same mark's bounding box (bar foot to the 35° beam's top
  corner) spans 600.06 of the 1024 field, centred, so the icon's proportion is the box at 58.6 of 100. At 58.6 every frame stays inside the disc: the beam's corners are 39pt from the centre above
  the bars and 43pt at their foot, within the 50pt radius. `assets/animations/` is prettier-ignored
  (`.prettierignore:64-68`); `README.md:26` states the 34 too.
- **Reduce Motion**: Reanimated's `useReducedMotion`, read once at launch (`AppLaunchScreen.tsx:46`,
  `:78`, `:95`). lottie-ios 4.5 plays in full under it unless gated; lottie-android jumps to the end
  by itself. Jest's global mock returns `false` (`jest.setup.js:523`); `AppLaunchScreen.test.tsx:63-87`
  replaces it per suite.
- `jest.setup.js:164-192` -- the inline native-module mock pattern. lottie-react-native ships none.
- **Welcome's entrance end** (decision 5): `@react-navigation/native-stack` 7.14.12 emits
  `transitionEnd` with `data.closing === false` for a route from react-native-screens' `onAppear`
  (`NativeStackView.native.tsx:581-587`), which iOS sends from `viewDidAppear`
  (`RNSScreen.mm:1707-1717`) and Android when the fragment's animation ends
  (`ScreenFragment.kt:285-308`): after the appear transition, animated or not, and again whenever
  the screen reappears. `useNavigation()` from `expo-router` gives `addListener`; its Jest mock is
  `addListener: jest.fn(() => jest.fn())` (`jest.setup.js:156-157`), so a test captures the
  `transitionEnd` listener and calls it.
- `.storybook/main.ts:17` -- stories load only from `shared/components/ui/`. Storybook cannot bundle
  the player because lottie-react-native's web entry (`src/LottieView/index.web.tsx`) imports the
  optional peer `@lottiefiles/dotlottie-react`, which is not installed; say that, not that the player
  cannot run on the web.
- Insets in tests: render with non-zero insets, as `SettingsScreen.test.tsx:43` does
  (`{ top: 59, right: 0, bottom: 34, left: 0 }`); every onboarding suite mocks zero today.
- `shared/i18n/locales/en.ts:57-113`, `it.ts:57-114` -- `onboarding.*`.
- Design: `docs/design/cardi/frames/cardi-onboarding-frames.html` (frames A–F),
  `cardi-design-system.md` (_The primary-action footer_ `:633`, _Sheets_ `:1747`, _Illustrations_
  `:1857`), `lottie/README.md`. Capture's footer ruling (`:899-903`) is the precedent for overruling a
  frame's in-flow buttons.

## Tasks & Acceptance

**Execution:**

- [x] `package.json`, `yarn.lock` -- `npx expo install lottie-react-native`; confirm `~7.3.4`.
- [x] `jest.setup.js` -- mock `lottie-react-native`: a `forwardRef` View forwarding props and
      `testID`, with `play`, `reset`, `pause`, `resume` as `jest.fn` through `useImperativeHandle`.
- [x] `features/onboarding/components/OnboardingAnimation.tsx` (+ test) -- new: plays a source once
      when `active` turns true and rests on its last frame; shows the last frame at once under Reduce
      Motion or once it has played; picks light or dark; decorative; empty on failure. Every matrix
      row it owns has a test. Its docs say when `active` turns true as Design Notes do (on Next at
      once, not once the page settles), and why it stays out of `shared/components/ui/` as the Code
      Map does.
- [x] `features/onboarding/screens/WelcomeScreen.tsx` (+ test) -- frame A, per Design Notes.
- [x] `features/onboarding/screens/ModeSelectionScreen.tsx`, `components/ModeOptionCard.tsx` (+ tests)
      -- frame B, and the difference on `BottomSheet` (frame C).
- [x] `features/onboarding/screens/FeatureHighlightsScreen.tsx`, `components/HighlightSlide.tsx`,
      `components/PaginationDots.tsx` (+ tests) -- frames D–F.
- [x] The three screen suites and the integration test render with non-zero insets and assert each
      inset is added: mode selection's root `paddingTop` (its header has none) and its scroll's
      `paddingBottom` (24 + bottom); Welcome's scroll `paddingTop` (top + 64); the Skip row's
      `paddingTop` (top + 8).
- [x] Every suite that overrides `isFirstLaunch` resets it in `beforeEach`, never at the end of a
      test body.
- [x] Delete `BrandedIcon.tsx`, `FannedCardIllustration.tsx`, `InfoTooltipModal.tsx` (+ test); update
      `features/onboarding/index.ts`.
- [x] `shared/i18n/locales/en.ts`, `it.ts` -- the three difference paragraphs, the dots' label, and
      the Italian `onboarding.infoTooltip.accessibilityLabel` per decision 4; remove the keys nothing
      reads any more (`infoTooltip.openedAnnouncement`, `closeAccessibilityLabel`, `body`,
      `modeSelection.backAccessibilityLabel`).
- [x] `features/onboarding/onboarding.integration.test.tsx` -- the path still runs end to end.
- [x] `docs/design/cardi/cardi-design-system.md` -- an `### Onboarding` section after
      `### Authentication`, recording Design Notes' rulings. It names what changed rather than
      claiming the copy and test IDs are unchanged (the announcements, `info-tooltip-close`,
      `welcome-screen`), gives the Storybook reason as the Code Map does, and ends with an
      **Unverified.** paragraph like its siblings' (`:1260`, `:1425`, `:1684`): what the device check
      could not reach.
- [x] Decision 5. `OnboardingAnimation.tsx` (+ test) -- an optional `rest` prop: once true, the player
      rests on its last frame for good without playing, from any phase. `WelcomeScreen.tsx` (+ test)
      -- both players take `active` = focused and entered, where entered latches on the first
      `transitionEnd` with `closing === false`, and `rest` = not focused, so leaving before the
      entrance ends (or mid-play) rests them and coming back replays nothing. Tests: nothing plays
      before the entrance ends; both start together on it; a closing `transitionEnd` starts nothing;
      leaving before it rests both, and they stay at rest on return; Reduce Motion as before.
- [x] Decision 1's and 5's wording in `cardi-design-system.md` `### Onboarding` (Motion): the
      welcome pair starts once Welcome's entrance ends, and the Next timing now sits inside ifero's
      decision.
- [x] Decision 6. `docs/design/cardi/lottie/build-onboarding-lottie.py` -- size the intro's mark so
      its bounding box takes the app icon's share of the field (58.6 of 100), derived from
      `assets/images/cardi-mark.svg` rather than typed, if the generator can read it as it reads the
      inline mark; then regenerate. Only `assets/animations/onboarding/cardi-mark-intro.json` may
      change: the other eight files stay byte-identical, and `--check` reports 9/9 up to date. Update
      the generator's comment and `docs/design/cardi/lottie/README.md:26` (its "at the same size"
      sentence only), and the `### Onboarding` ruling's Welcome sentence (decided 2026-10-26, ifero).

**Acceptance Criteria:**

- Given the four screens and the sheet, in light and dark, when each is shown at rest, then each
  draws its frame as Design Notes rule it.
- Given any onboarding animation with Reduce Motion off, when it finishes, then it rests on its last
  frame and never loops.
- Given the onboarding path, when it is walked to Skip or "Let's go!", then the routes, guards and
  `completeFirstLaunch()` behave as before, and no `BrandedIcon`, `FannedCardIllustration` or
  `InfoTooltipModal` component or import remains.
- Given `cardi-design-system.md`, when it is read, then it holds an `### Onboarding` section.

## Implementation Notes

### Device check

Run on derivation 2 with the pass-2 patches, on an iPhone 16 simulator (iOS 18.6) from a Debug
build with the native module, Metro serving this worktree (proved by grepping the served bundle for
`highlights-skip-row` and `Pannello informativo`, and by the `highlights-skip-row` fiber on the
device). Shots, frame bursts and contact sheets are outside the repository, under
`/private/tmp/claude-501/-Users-ifero-Developer-myLoyaltyCards--claude-worktrees-bmad-build-22-10-755f0f/754259f7-a2b3-42bf-a94f-89f2d486a032/scratchpad/shots-final/`.

- **At rest, light and dark:** Welcome, mode selection, the sheet (also in Italian) and the three
  highlights. Every ruled measure matched to the point (mark 64 below the inset; title 32, subtitle
  8, drawing 40; header, heading 24, cards 24 and 16 apart, pill at −11 / 16; Skip row, drawing 96,
  title 48, body 12 and ≤ 310; dots 8 and 8, 24 above Next) and every ruled colour to the hex.
  Against frames A–F, every difference is one the ruling overrules.
- **Motion (light):** brand moment D and the welcome drawing (fan closed until ~0.95 s, settled at
  2.70 s, nothing after); back to Welcome at rest; slide 1 on mount; Next starting slide 2 at once;
  a swipe starting slide 3 once it settles; a seen slide, and one taken away mid-play, back at rest;
  a scheme change showing the dark file at its last frame. **Dark:** Welcome from a fresh mount and
  slides 1 and 2 (on mount, then Next) play their `-dark` files within ~2 frames of light's timings
  and rest, nothing looping (`13-dark-motion/`).
- **Reduce Motion:** every player at progress 1 within 150 ms of mount; nothing moves.
- **Large text** (`accessibility-medium`, 1.786, and the largest, 3.571): every page scrolls to its
  end above an anchored footer; nothing clips; the pill keeps 5pt clear of the title at both sizes.
- **Leaving Welcome mid-play** (row 29): a single-frame pop of the drawing to its end state as the
  push starts, then the settled drawing slides out. Mild; no change.
- **The first-launch entrance** (row 4): the intro, started on mount, played its opening under
  Welcome's fade; ifero ruled decision 5.
- **Decision 5 pass** (`decision5/`, Metro restarted from this worktree; the bundle carried
  `shouldRest`): on every cold first launch, light and dark, a non-closing `transitionEnd` arrived
  and the players went from waiting to playing 585 ms after Welcome mounted, about 0.07 s after it
  reached full opacity; brand moment D then played whole at full strength (settled ~0.75 s after its
  start) with the fan opening ~0.87 s after it, and nothing moved after. Leaving during the fade
  rested both (`rest`), and back showed them at rest, pixel-identical to the rest shots; leaving
  mid-play, Reduce Motion and a highlights smoke test passed. Welcome at rest is pixel-identical to
  the earlier shots.
- **Decision 6 pass** (`decision6/`; the bundle carried the new mark scale `5.722575` and none of
  the old `3.3203125`): the drawn mark measures 44.7 × 57.0 pt in the 100.00 pt disc, centred
  (0.83 pt low, as the rounded beam ends put it), against 43.3 × 56.1% of the side in the
  home-screen icon, identical in light and dark; its farthest pixel is 16.5 pt inside the edge. On
  cold first launches, light and dark, brand moment D plays whole at the new size after the
  entrance, the beam's closest approach to the edge 9.05 pt (at the foot); Reduce Motion and back
  after leaving mid-play show it at rest. Everything below the disc is pixel-identical to the
  decision-5 shots.
- **Unchecked:** Android (no phone emulator on this host); VoiceOver and TalkBack, so the spoken
  announcements and the focus after the sheet closes; a release build.

### Review loops

- **Code, round 1** (Sonnet, on the device-checked tree): `VERDICT: APPROVED`, no comments. The
  code loop ends.
- **QA, round 1:** three findings, each a missing pin, all verified and fixed with tests that fail
  under a one-line mutation: `welcome-screen` (its old pin moved to `welcome-scroll`) and
  `feature-highlights-screen` read by no test, swept across every Code Map testID (the only two);
  the Load failure row's "nothing announced"; decision 2's grabber that does not close the sheet.
  Test files only, so no device re-check; the code loop runs again on the changed diff.
- **Code, round 2** (the four test files changed since round 1; every production file
  byte-identical): `VERDICT: APPROVED`, no comments.
- **QA, round 2:** `VERDICT: APPROVED`, no comments. Both loops have converged.
- Decisions 5 and 6 (the rulings at the handback) changed the reviewed diff, so both loops ran again.
- **Code, round 3** (decisions 5 and 6 in the diff): `VERDICT: APPROVED`, no comments.
- **QA, round 3:** one finding, verified: `## Verification` still expected the generator check to
  pass because "the files are untouched", which decision 6 made false. Corrected in the spec, which is
  outside the reviewed diff, so the code loop's approval stands.
- **QA, round 4:** two findings, both verified: the final-verification note below still gave the
  4,224 tests of the run before decisions 5 and 6 (rewritten from the last run); and mode
  selection's ruled gaps (heading 24, cards 24 and 16 apart, the card's row 16, subtitle 4, eyebrow 8) had no test, where every other screen pins its own. Pinned by tests that fail under a one-line
  mutation.
- **Code, round 4** (the two test files changed since round 3; every production file
  byte-identical): `VERDICT: APPROVED`, no comments.
- **QA, round 5:** one finding, verified: ruled values still covered by the device check alone (each
  screen's ground, the 24 side margins, the pill's padding, radius and type). With QA at 3, 0, 1, 2,
  1 across five rounds, one slice per round, the class was swept in one pass (test files only): 30
  mutations failed. The sweep's own harness log (`mutate.log`) also recorded 12 surviving mutants
  that its report left out, so the sweep did not close the class (QA round 6).
- **Code, round 5** (the five swept test files; every production file byte-identical):
  `VERDICT: APPROVED`, no comments.
- **QA, round 6:** two findings, both verified, as part of those 12 survivors: ten colour-role swaps
  no light-mode test can see, because `primary`, `textPrimary` and `link` are all ink there (the
  Welcome title and link, mode selection's heading and link, the card title and recommended
  eyebrow, Skip, the slide title, the active dot), and two centrings (the Welcome title's and mode
  selection's footer `textAlign`). The twelfth survivor is the carousel's `extraData`, which Jest's
  list re-renders without. The device check measured every one of these on the device. QA has run
  3, 0, 1, 2, 1, 2: the trend went to ifero.
- **The QA loop ended at ifero's call** after round 6 (2026-10-26), on the trend above. The 12
  surviving mutants are covered by the device check, not by tests: the ten colour roles were
  sampled to the hex in light and dark at rest (Welcome, mode selection, the sheet, the three
  highlights); the two centrings show in every rest shot; and Next starting the next page's drawing,
  which `extraData` carries, was recorded on the device in light and dark. The code loop's last
  round (5) approved with no comments.
- **Final verification**, each command run on its own on the final tree (the code QA round 6
  reviewed, after decisions 5 and 6 and the round-5 sweep), re-run after the loop ended: `yarn typecheck`, `yarn lint`, `yarn format:check`
  and `yarn test` (216 suites, 4,239 tests) exit 0; `build-onboarding-lottie.py --check` reports
  9/9 up to date.

### Found, not fixed

1. `docs/design/cardi/lottie/README.md:47` still says `lottie-react-native` is not installed; the
   story may not edit `docs/design/cardi/lottie/`.
2. `shared/components/launch/AppLaunchScreen.tsx:143` and `AppLaunchScreen.test.tsx:192` cite the
   deleted `FannedCardIllustration` in comments; the story may not touch the launch screen.
3. `features/cards/screens/HomeScreen.test.tsx:124` mocks `@/features/onboarding` with an
   `OnboardingOverlay` that does not exist (pre-existing).
4. Screen-reader focus after the difference sheet closes (triage rows 3, 16, 22). The old modal
   returned it to "What's the difference?"; the shared sheet moves none, and whether VoiceOver or
   TalkBack restore it on their own is unchecked. Deferred by ifero (2026-10-26) to a follow-up
   that covers every sheet.
5. The highlights carousel announces nothing on a page change, and its wrapper is `adjustable` with
   no actions (row 13, pre-existing).
6. This story adds a native module while `app.json` pins `runtimeVersion` to `appVersion` (1.0.0)
   with an updates URL (row 20). No OTA built from it may target 1.0.0 binaries; the next release
   bumps `expo.version`. How a missing Fabric view renders in a release build is unchecked.
7. The shared sheet's Italian announcements, `'{{label}} aperto'` / `'chiuso'`, disagree with most
   sheets' names: "Lingua aperto", "Ordina per aperto", "Trovati più codici a barre aperto".
8. `ModeOptionCard`'s accessibility label leaves out the eyebrow, and reads ".. Recommended option."
   because the subtitles end in a full stop and the suffix starts with one (row 30, pre-existing).
9. The three highlight titles carry no header role, unlike every other onboarding title (row 31,
   pre-existing).
10. At the largest text size the "Recommended" pill breaks mid-word ("Recommen / ded"). The pill had
    the same ~277pt of text width before this story, so the break predates it.
11. Shared primitives at the largest text size: the sheet title breaks mid-word ("differenc / e?");
    the primary button's label wraps left-aligned; `ScreenHeader` grows to 172pt; Welcome's footer
    takes 509 of 852pt. At `accessibility-medium` the sheet's third paragraph starts below the fold
    with no hint, and scrolled content passes under the grabber. Mode selection's heading breaks
    after "like" by its own hard line break (existing copy).
12. On first launch, Home's header and spinner show through Welcome's fade-in for about 0.4 s: the
    root gate replaces to `/welcome` under `animation: 'fade'` (`app/_layout.tsx`, unchanged).
13. Under Reduce Motion, Next still animates the carousel's page scroll (`scrollToIndex` with
    `animated: true`, unchanged).
14. The adopted Design canvas (the claude.ai artifact the set was adopted on; its MarkMotion and
    WelcomeBrand sheets) still draws the mark at the old 34-in-100 size; decision 6 changed only the
    repository's Lottie.

## Spec Change Log

**Loopback 1 (2026-10-26), from review pass 1.**

- **Trigger.** Rows 2, 15 and 21 (`intent_gap`): on the shared sheet the difference announced the
  sheet's own "opened" and "closed" in place of the screen's line, and in Italian "…aperto" after
  the feminine plural "Informazioni". The frozen copy rule allowed neither.
- **Amended.** ifero renegotiated the frozen copy rule: decision 4. Design Notes: the sheet's label
  and announcements, `info-tooltip-close` going with the ×, `welcome-screen` on the root view, Next
  starting its drawing at once, the pill's exception in dark. Code Map: the sheet's announcement
  keys, the Storybook reason, the insets test pattern. Folded in as requirements, from the moot
  patch rows: tests with non-zero insets (row 14); `isFirstLaunch` reset in `beforeEach` (rows 9,
  19); the player's docs on Next and on Storybook (rows 6, 10); the ruling naming what changed and
  ending with **Unverified.** (rows 7, 8, 24). AC3 now says component or import, since the launch
  screen's comments stay (Found, not fixed 2).
- **Known-bad states avoided:** an Italian announcement with the wrong agreement; a ruling that
  claims the copy and test IDs are unchanged; inset paddings no test observes; an override that
  leaks into later tests when an assertion fails; a doc saying the drawing waits for its page to
  settle when Next starts it at once.
- **KEEP.** Derivation 1 passed the matrix audit (99 onboarding tests) and a first pass on the iOS
  simulator, and the review refuted its play path (row 5). Its diff is saved at
  `/private/tmp/claude-501/-Users-ifero-Developer-myLoyaltyCards--claude-worktrees-bmad-build-22-10-755f0f/754259f7-a2b3-42bf-a94f-89f2d486a032/scratchpad/derivation-1.diff`
  (sha1 `209a640f2438dc18c064a74d8fdf78d6bb8b492f`), and it applies cleanly to the baseline. Start
  from it with `git apply`, then change only what this entry lists. Keep everything else, in
  particular:
  - `OnboardingAnimation`'s `waiting` / `playing` / `rested` phases, settled during render when
    `active` turns false mid-play, its player keyed by scheme, its box at the file's own size;
  - the `lottie-react-native` mock with per-player `commands`, and `useIsFocused` in the
    `expo-router` mock;
  - Welcome's `active={useIsFocused()}`; `ModeOptionCard`'s Lucide `icon` prop and
    `getRecommendedPaddingTop`, the device check's fix for a pill that grows into the title under
    large text;
  - `HighlightSlide` as a non-bouncing `ScrollView`, the carousel's `extraData`, the dots as one
    `accessible` element;
  - every testID it added.

**Rulings at the handback (2026-10-26).** Three items went to ifero after the gates converged.

- **Decision 1's wording** (rows 6, 28) said a drawing plays when its slide settles, while Next
  starts it at once. ifero amended the wording to match the code ("1a"); no code change.
- **Brand moment D on first launch** (row 4, the device check): starting on mount, the beam's cut-on
  happened while Welcome was still invisible under its entrance fade, and the scan to the bars' foot
  played at partial opacity. ifero chose to start Welcome's animations once its entrance has finished
  ("2b"): decision 5. Amended: the Welcome matrix row's reference, Design Notes (Welcome), the Code
  Map (the verified `transitionEnd` route), and two new tasks (the player's `rest`, Welcome's
  trigger, and the ruling's Motion wording). It reaches the app, so the device check and both review
  loops run again.
- **The mark lost in its disc** (ifero, watching the decision-5 device pass): the adopted intro fits
  the mark into a 34 box in the 100 field, so its bars are 29% of the disc against 50% of the field
  in the app icon, and during the entrance the bare bars read as a stub. ifero lifted the frozen
  asset rule for `cardi-mark-intro` only and asked for the icon's proportion: decision 6. Amended:
  the Never line's exception, the Code Map (the generator's size and the icon's geometry), Design
  Notes (Welcome), one new task; Found, not fixed 14 records the canvas that still draws 34.

## Review Triage Log

**Pass 1 (2026-10-26).** Four layers reviewed one diff: Project Conventions (PC), Blind Hunter (BH),
Verification Gap (VG) and Edge Case Hunter (EC). They raised 24 findings, each verified at its cited
location before routing. Rows 2, 15 and 21 (one defect) route to `intent_gap`, so this pass loops
back: its patch and defer rows are moot. The patch rows fold into the spec as requirements; the defer
rows go under Found, not fixed.

| #   | Layer | Location                                                                           | Claim                                                                                                                 | Verdict     | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                       | Route      |
| --- | ----- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | PC    | `shared/components/launch/AppLaunchScreen.tsx:143`, test `:192`                    | Two comments cite the deleted `FannedCardIllustration`                                                                | low         | True, but the comment-only fix lies in the launch screen, which the frozen Never forbids touching.                                                                                                                                                                                                                                                                                                                                             | defer      |
| 2   | BH    | `ModeSelectionScreen.tsx` (`BottomSheet`), `it.ts:287-288`                         | The sheet's announcements replace the screen's own: English reworded, a new "closed", Italian "…aperto" ungrammatical | medium      | The old modal announced `onboarding.infoTooltip.openedAnnouncement` ("Storage options info opened", "…aperte") and nothing on close. `BottomSheet` announces `'{{label}} opened'` / `'{{label}} closed'`, in Italian `'{{label}} aperto'` / `'chiuso'` after the feminine plural "Informazioni". The frozen copy rule allows neither change, and keeping both copy and `BottomSheet` needs a shared-primitive change the spec does not settle. | intent_gap |
| 3   | BH    | `ModeSelectionScreen.tsx`, `BottomSheet.tsx`                                       | Returning screen-reader focus to "What's the difference?" on close was dropped                                        | maybe-false | The old modal focused the trigger 50 ms after closing; `BottomSheet` moves no focus. Whether VoiceOver or TalkBack restore it on their own after the modal closes is unchecked; a screen-reader pass settles it. Medium if true.                                                                                                                                                                                                               | defer      |
| 4   | BH    | `WelcomeScreen.tsx`, `FeatureHighlightsScreen.tsx`                                 | The intro and slide 1 start while their screen still fades or slides in                                               | low         | Real: Welcome enters under the root 250 ms `FadeIn` (`EXIT_FADE_MS`) and the route's fade, so about a quarter of the 0.87 s intro runs under it. Once per install; the frozen block says start on mount; waiting for `transitionEnd` adds navigation state. The device check shoots the entrance.                                                                                                                                              | reject     |
| 5   | BH    | `OnboardingAnimation.tsx` effect                                                   | `play()` is fire-and-forget; a dropped play leaves the first frame                                                    | false       | iOS `setSourceJson` decodes synchronously and builds the animation view before any command (`ContainerView.swift:208-225`); Android posts `play` until attach and lottie-android queues it until the composition loads (`LottieAnimationViewManagerImpl.kt:108-119`).                                                                                                                                                                          | reject     |
| 6   | BH    | `FeatureHighlightsScreen.tsx` `handleNext`, `OnboardingAnimation.tsx` `active` doc | Next starts a drawing before its page settles; the comments say "settles"                                             | low         | Real: `next()` flips `currentIndex` before `scrollToIndex` animates. The frozen New slide row makes Next itself the trigger, so the timing meets the intent; only the `active` doc ("once a highlight's slide has settled") is wrong.                                                                                                                                                                                                          | patch      |
| 7   | BH    | `cardi-design-system.md` `### Onboarding`                                          | The ruling has no **Unverified.** paragraph                                                                           | low         | Settings, Documents and Authentication each end with one (`:1260`, `:1425`, `:1684`); Android, TalkBack and VoiceOver went unchecked here.                                                                                                                                                                                                                                                                                                     | patch      |
| 8   | BH    | `cardi-design-system.md` `### Onboarding`                                          | "and so are the copy and the test IDs" is inaccurate                                                                  | low         | `info-tooltip-close` went with the ×, the announcements changed (row 2), and `welcome-screen` moved from the scroll to the root view.                                                                                                                                                                                                                                                                                                          | patch      |
| 9   | BH    | four suites' `isFirstLaunch` overrides                                             | Each reset runs at the end of the test body, so a failure leaks into later tests                                      | low         | `mockReturnValue` survives `clearAllMocks`; an assertion that throws first leaves later tests redirecting home. Moving the reset into `beforeEach` is a direct correction.                                                                                                                                                                                                                                                                     | patch      |
| 10  | BH    | `cardi-design-system.md`, `OnboardingAnimation.tsx` header                         | "The native player cannot run" on web is the wrong reason                                                             | low         | lottie-react-native 7.3.8 ships `src/LottieView/index.web.tsx` on the optional peer `@lottiefiles/dotlottie-react`, which is not installed: Storybook cannot bundle it.                                                                                                                                                                                                                                                                        | patch      |
| 11  | BH    | `ModeOptionCard.tsx:69,83,124`                                                     | Under large text the pill covers the title until `onLayout` reports                                                   | low         | Real for the first layout of each mount at large text. A synchronous `fontScale` derivation is a different mechanism, not a correction.                                                                                                                                                                                                                                                                                                        | reject     |
| 12  | BH    | `OnboardingAnimation.tsx` `handleFailure`                                          | A failed load logs nothing                                                                                            | low         | The frozen Load failure row asks only that nothing is thrown or announced; the files are bundled imports kept by `build-onboarding-lottie.py --check`, and logging adds a branch.                                                                                                                                                                                                                                                              | reject     |
| 13  | BH    | `FeatureHighlightsScreen.tsx` carousel                                             | No announcement on a page change; `adjustable` with no actions                                                        | medium      | Pre-existing: the `adjustable` wrapper and the silent Next are unchanged context lines.                                                                                                                                                                                                                                                                                                                                                        | defer      |
| 14  | VG    | the three screen suites and the integration test                                   | Every suite mocks zero insets, so no inset is observed                                                                | medium      | Pre-verified gap: dropping `insets.top` from the mode-selection root, the Skip row or the Welcome body, or `insets.bottom` from the mode-selection scroll, passes every suite; AGENTS.md makes the rule mandatory.                                                                                                                                                                                                                             | patch      |
| 15  | VG    | as row 2                                                                           | The sheet's announcement wording, and the Italian agreement                                                           | medium      | As row 2.                                                                                                                                                                                                                                                                                                                                                                                                                                      | intent_gap |
| 16  | VG    | as row 3                                                                           | Focus return removed                                                                                                  | maybe-false | As row 3.                                                                                                                                                                                                                                                                                                                                                                                                                                      | defer      |
| 17  | EC    | `OnboardingAnimation.tsx:97`, `HighlightSlide.tsx`, `WelcomeScreen.tsx`            | A 280 drawing overruns the margins below 328pt                                                                        | low         | Only below 328pt: an iPhone SE with Display Zoom (320pt) puts it 4pt into each margin, and no device is under 280. The Design Notes size it 280; scaling adds width logic.                                                                                                                                                                                                                                                                     | reject     |
| 18  | EC    | as row 11                                                                          | The pill's first frame                                                                                                | low         | As row 11.                                                                                                                                                                                                                                                                                                                                                                                                                                     | reject     |
| 19  | EC    | as row 9                                                                           | The `isFirstLaunch` reset                                                                                             | low         | As row 9.                                                                                                                                                                                                                                                                                                                                                                                                                                      | patch      |
| 20  | EC    | `package.json:94`                                                                  | An OTA to 1.0.0 binaries without the module would break onboarding                                                    | maybe-false | `app.json` sets `runtimeVersion` `appVersion` (1.0.0) and an updates URL, but no workflow or `eas.json` publishes updates, and how an unregistered Fabric view renders in release is unchecked. High if true.                                                                                                                                                                                                                                  | defer      |
| 21  | EC    | as row 2                                                                           | The Italian announcement                                                                                              | medium      | As row 2.                                                                                                                                                                                                                                                                                                                                                                                                                                      | intent_gap |
| 22  | EC    | as row 3                                                                           | Focus return                                                                                                          | maybe-false | As row 3.                                                                                                                                                                                                                                                                                                                                                                                                                                      | defer      |
| 23  | EC    | as row 1                                                                           | The launch-screen comments                                                                                            | low         | As row 1.                                                                                                                                                                                                                                                                                                                                                                                                                                      | defer      |
| 24  | EC    | `ModeSelectionScreen.tsx:110-138`                                                  | The intent's "copy and testIDs" no longer hold                                                                        | low         | As row 8 for `info-tooltip-close`, which went with the × frame C does not draw; the announcement part is row 2.                                                                                                                                                                                                                                                                                                                                | patch      |

**Pass 2 (2026-10-26),** on derivation 2. The same four layers raised 17 findings. Rows were checked
against pass 1's first; rows 26 and 40 carry a pass-1 verdict, and the rest were verified at their
cited location. No row routes to `intent_gap` or `bad_spec`: six patch, five defer, six reject.

| #   | Layer | Location                                                            | Claim                                                                                         | Verdict | Evidence                                                                                                                                                                                                                                                                                            | Route  |
| --- | ----- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 25  | PC    | `docs/design/cardi/lottie/README.md:47`                             | The README still says `lottie-react-native` is not installed                                  | low     | True, but the frozen Never forbids editing `docs/design/cardi/lottie/` (Found, not fixed 1).                                                                                                                                                                                                        | defer  |
| 26  | PC    | `AppLaunchScreen.tsx:143`, test `:192`                              | The comments cite the deleted `FannedCardIllustration`                                        | low     | Carried: row 1.                                                                                                                                                                                                                                                                                     | defer  |
| 27  | VG    | the Welcome and Highlights footers                                  | Nothing asserts that either footer adds the bottom inset                                      | medium  | Pre-verified gap: with `insetBottom={false}` on both footers, the Welcome, Highlights and integration suites all pass (38/38), while dropping `insets.top` fails three. Only mode selection's bottom inset is asserted.                                                                             | patch  |
| 28  | BH    | `cardi-design-system.md` `### Onboarding`, Motion                   | The ruling stamps the Next timing as ifero's 2026-10-25 decision                              | low     | The stamp follows a sentence that includes "at once on Next … rather than once it settles"; ifero decided only that a page shown again rests. Decision 1's own wording ("plays the first time its slide settles") against the Design Notes approved at loopback 1 goes to the human.                | patch  |
| 29  | BH    | `WelcomeScreen.tsx` `active={isFocused}`                            | Leaving mid-play snaps both drawings to their end while Welcome slides out                    | low     | Real: focus is lost when the push is dispatched, so a tap within the drawing's 2.7 s settles it during the exit. Once per install, only for a tap mid-play; the approved Design Notes prescribe focus; settling on `transitionEnd` adds navigation state. The device check shoots the exit.         | reject |
| 30  | BH    | `ModeOptionCard.tsx` `accessibilityLabel`                           | The label leaves out the eyebrow and reads ".. Recommended option."                           | medium  | Pre-existing: the label template (`ModeOptionCard.tsx:42` at the baseline), the subtitles' final full stops and the suffix's leading one are all unchanged.                                                                                                                                         | defer  |
| 31  | BH    | `HighlightSlide.tsx` title                                          | The highlight titles are not headers                                                          | low     | Pre-existing: the baseline's title had no `accessibilityRole` either.                                                                                                                                                                                                                               | defer  |
| 32  | BH    | `onboarding.integration.test.tsx:108`                               | The home-indicator test checks mode selection only                                            | medium  | As row 27.                                                                                                                                                                                                                                                                                          | patch  |
| 33  | BH    | `ModeSelectionScreen.test.tsx:244`                                  | The VoiceOver escape is the one close path untested                                           | false   | The escape calls the same `onClose` (`BottomSheet.tsx:254`) that the scrim and back tests exercise, and `BottomSheet.test.tsx:372` pins that wiring: no change here can break the escape alone.                                                                                                     | reject |
| 34  | BH    | the Welcome and Highlights footers                                  | The footer's hairline is a frame change no ruling names                                       | false   | The ruling names the primary-action footer, whose canonical section draws the 1px hairline by rule (_The primary-action footer_); `PrimaryActionFooter.test.tsx` pins it.                                                                                                                           | reject |
| 35  | BH    | `PaginationDots.test.tsx:46`                                        | The dots' label is asserted in English only                                                   | low     | The ruling names it in both languages as one of three copy changes; the sheet's Italian announcement already has a `changeAppLanguage` test to follow.                                                                                                                                              | patch  |
| 36  | BH    | `OnboardingAnimation.tsx` box                                       | No dark test checks the drawing's size                                                        | low     | It needs a `-dark` file of another size, which this story cannot produce (the assets are frozen) and `build-onboarding-lottie.py --check` keeps paired; a guard for an undemonstrated state.                                                                                                        | reject |
| 37  | BH    | `cardi-design-system.md:1755`                                       | One line of the Motion paragraph runs to 164 columns                                          | low     | Real; the rest of the section wraps near 100. A reflow.                                                                                                                                                                                                                                             | patch  |
| 38  | BH    | `WelcomeScreen.tsx:140`, `:115`                                     | The ruled 40 is a bare literal, and `MARK_TOP` is declared after the component                | low     | `HighlightSlide.tsx` names its ruled measures above the component; Welcome's 40 is the one ruled measure there without a name.                                                                                                                                                                      | patch  |
| 39  | EC    | `FeatureHighlightsScreen.tsx` `FlatList`, `OnboardingAnimation.tsx` | On Android a page swiped away mid-play is detached, then replays from frame 0 when it returns | false   | FlatList does clip on Android by default (`FlatList.js:162-167`), but lottie-android 6.7.1, which the wrapper pins (`android/build.gradle:127`), overrides only `onAttachedToWindow`, and it plays only with `autoPlay` (`LottieAnimationView.java:370-375`); the player passes `autoPlay={false}`. | reject |
| 40  | EC    | `ModeSelectionScreen.tsx` (`BottomSheet`)                           | Focus return dropped                                                                          | low     | Carried: row 3, deferred by ifero.                                                                                                                                                                                                                                                                  | defer  |
| 41  | EC    | the frozen Approach                                                 | "Keep the … copy and testIDs" no longer holds                                                 | false   | The frozen copy rule lists every copy change (decision 4 among them); `info-tooltip-close` went with its ×, as the spec approved at loopback 1 records; `welcome-screen` still names the screen.                                                                                                    | reject |

## Design Notes

The design system is canonical; the adopted canvas places the drawings; the frames give the rest.
Where they differ, the ruling is recorded (`### Onboarding`, "RULED (Story 22.10)").

**Welcome** (frame A, the canvas). A non-bouncing scroll body, padded 24, holds: the mark intro
(100×100, `welcome-branded-icon`, the mark at the app icon's proportion: decision 6) 64 below the top inset; "Cardì" 32 below in `displayLg`,
`textPrimary`; the subtitle 8 below in `bodyLg`, `textSecondary`; the welcome drawing (280×190,
`welcome-fanned-illustration`) 40 below. Both animations start together once Welcome's entrance
ends (decision 5): on the stack's first `transitionEnd` that is not closing, while the screen is
focused. Leaving before then, or mid-play, rests them on their last frames, so coming back replays
nothing. `welcome-screen`
names the root view, which now holds the scroll (`welcome-scroll`) and the footer.
`PrimaryActionFooter` holds "Get Started" (large primary) and, 16 below it, "I already have an
account": `bodyMdStrong` in `link`, 48 tall, no underline. Overruled: frame A's in-flow button
(capture's precedent), its 230×110 band and its stand-in ì.

**Mode selection** (frame B). `ScreenHeader` titled "Get Started", back `router.back()`. The body
scrolls, padded 24: the heading in `headlineMd`, 24 below the header; the subtitle 8 below in
`bodyMd`, `textSecondary`. The cards come 24 below the subtitle, 16 apart. Each card is `surface`
with radius 16 and padding 20. The local card has a 2px `primary` outline and the beam "Recommended"
pill (`labelBold`, ink, at top −11 and right 16); the cloud card has a 1px `border`. The icon disc is
48, `background` with a 1px `border`, holding Lucide `smartphone` or `cloud-upload` at 24 / 1.5. Its
title is `bodyLgStrong`, its subtitle `bodyMd` `textSecondary` 4 below, its eyebrow `labelBold` 8
below (ink for local, `textSecondary` for cloud). The footer text comes 32 below in `bodyMd`
`textSecondary`; the link 8 below in `bodyMdStrong` `link`, underlined, 48 tall. The mount
announcement stays.

**The difference** (frame C, _Sheets_). `BottomSheet`, `info-tooltip-modal`, titled "What's the
difference?". Its content is the three paragraphs in `bodyMd` `textPrimary`, 16 apart; its action
is "Got it" (`info-tooltip-got-it`), a 52 primary. Its `accessibilityLabel` is
`onboarding.infoTooltip.accessibilityLabel`, so it announces as every sheet does (decision 4).
`info-tooltip-close` goes with the ×, which frame C does not draw. Overruled: the frame's black
scrim, 12 grabber offset, 24/32 title and fixed 400 height.

**Highlights** (frames D–F, the canvas). No header: Skip at the top right, `bodyMdStrong`, 48 tall.
Each page's content scrolls: the drawing (280×190) 96 below the Skip row, the title 48 below in
`headlineMd` centred, the body 12 below in `bodyMd` `textSecondary` centred, at most 310 wide. The
`PrimaryActionFooter` holds the dots, 8 across and 8 apart (active `primary`, others `border`),
24 above Next / "Let's go!". Each drawing plays the first time its page is shown: on mount for the
first, at once on Next (as its page slides in), or when a swipe settles. Overruled: the frames' 160
discs and their drawings.

**Dark.** Every value is a role but the pill's (decision 3); the black ground; `-dark` drawings.

## Verification

**Commands:**

- `yarn typecheck`, `yarn lint`, `yarn format:check`, `yarn test` -- expected: all pass.
- `python3 docs/design/cardi/lottie/build-onboarding-lottie.py --check` -- expected: all 9 up to date
  (`cardi-mark-intro.json` regenerated by decision 6, the other eight byte-identical, as
  `git diff --stat assets/animations/` shows). Where `python3` has no working `pyexpat`, run it as
  `uv run --python 3.12 --no-project python …`, as `docs/design/cardi/lottie/README.md` says.

**Manual checks (if no CLI):**

- On the iOS simulator, from a native build with the module: Welcome, both mode cards, the sheet and
  the three slides, in light and dark, at rest and mid-motion; Reduce Motion on; font scale 1.5.
  Android is checked if an emulator can run, otherwise named as unchecked.

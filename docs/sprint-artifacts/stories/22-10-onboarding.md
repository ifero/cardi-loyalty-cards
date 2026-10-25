---
title: 'Story 22.10: Onboarding — the four screens on the Cardì frames, with the adopted illustrations'
type: 'feature'
created: '2026-10-24'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
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
  `en.ts` and `it.ts`), and the dots' accessibility label, moved into i18n.
- Existing testIDs stay; new parts take new ones.
- Every value is a theme role (`useTheme()`), and each drawing takes its `-light` or `-dark` file by
  `isDark`. `cardi-mark-intro.json` serves both schemes.
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
- Edit `assets/animations/` or `docs/design/cardi/lottie/`.
- Loop an animation, or draw the frames' stand-in ì, their filled brand-colour tiles or their looping
  beam.
- Touch the launch screen, which Story 16.17 keeps anti-spectacle, or any screen outside onboarding.
- Add a config plugin or an `app.json` change for Lottie.

## I/O & Edge-Case Matrix

| Scenario         | Input / State                                          | Expected Output / Behavior                                                                                                | Error Handling              |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Welcome          | First launch, signed out                               | The mark intro and the welcome drawing start together; the fan holds closed until 0.9 s; both rest on their static frames | N/A                         |
| Reduce Motion    | On, any onboarding screen                              | Every drawing and the mark show their last frame; nothing plays                                                           | N/A                         |
| Dark             | Dark scheme                                            | `-dark` drawings on the black ground; the mark on its ink field                                                           | N/A                         |
| First slide      | Highlights mount                                       | Slide 1's drawing plays once                                                                                              | N/A                         |
| New slide        | Next, or a swipe that settles on a slide not yet shown | That slide's drawing plays once                                                                                           | N/A                         |
| Seen slide       | A swipe back to a slide already shown                  | Its drawing rests on its last frame (decision 1)                                                                          | N/A                         |
| Back to Welcome  | Mode selection → back                                  | Welcome rests on its last frames; nothing replays                                                                         | N/A                         |
| Scheme change    | Light ↔ dark mid-onboarding                            | The new scheme's file, at its last frame if it had played                                                                 | N/A                         |
| Difference       | "What's the difference?"                               | `BottomSheet`: title, three paragraphs, "Got it"; the scrim, grabber or back closes it                                    | N/A                         |
| Large text       | Font scale 1.5 and above                               | Each page's content scrolls; the footer stays anchored; nothing clips                                                     | N/A                         |
| Load failure     | `onAnimationFailure`                                   | The screen works; the drawing's box stays empty                                                                           | Nothing thrown or announced |
| Not first launch | Any onboarding route                                   | The guard replaces to `/`, as today                                                                                       | N/A                         |

**Decisions (ifero, 2026-10-25):**

1. **A slide shown again rests.** A drawing plays the first time its slide settles; when a swipe
   brings back a slide already shown, it stays on its last frame. "Plays once" holds per visit to
   the screen, so going back is quiet.

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
- `shared/components/ui/` -- `ScreenHeader` (`title`, `onBack`), `PrimaryActionFooter` (`children`,
  `margin`, `insetBottom`, `testID`), `BottomSheet` (`visible`, `onClose`, `title`, `description`,
  `children`, `actions`, `testID`), `Button`. `shared/theme`: `useTheme()` → `{ theme, isDark }`;
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
- **Reduce Motion**: Reanimated's `useReducedMotion`, read once at launch (`AppLaunchScreen.tsx:46`,
  `:78`, `:95`). lottie-ios 4.5 plays in full under it unless gated; lottie-android jumps to the end
  by itself. Jest's global mock returns `false` (`jest.setup.js:523`); `AppLaunchScreen.test.tsx:63-87`
  replaces it per suite.
- `jest.setup.js:164-192` -- the inline native-module mock pattern. lottie-react-native ships none.
- `.storybook/main.ts:17` -- stories load only from `shared/components/ui/`.
- `shared/i18n/locales/en.ts:57-113`, `it.ts:57-114` -- `onboarding.*`.
- Design: `docs/design/cardi/frames/cardi-onboarding-frames.html` (frames A–F),
  `cardi-design-system.md` (_The primary-action footer_ `:633`, _Sheets_ `:1747`, _Illustrations_
  `:1857`), `lottie/README.md`. Capture's footer ruling (`:899-903`) is the precedent for overruling a
  frame's in-flow buttons.

## Tasks & Acceptance

**Execution:**

- [ ] `package.json`, `yarn.lock` -- `npx expo install lottie-react-native`; confirm `~7.3.4`.
- [ ] `jest.setup.js` -- mock `lottie-react-native`: a `forwardRef` View forwarding props and
      `testID`, with `play`, `reset`, `pause`, `resume` as `jest.fn` through `useImperativeHandle`.
- [ ] `features/onboarding/components/OnboardingAnimation.tsx` (+ test) -- new: plays a source once
      when `active` turns true and rests on its last frame; shows the last frame at once under Reduce
      Motion or once it has played; picks light or dark; decorative; empty on failure. Every matrix
      row it owns has a test.
- [ ] `features/onboarding/screens/WelcomeScreen.tsx` (+ test) -- frame A, per Design Notes.
- [ ] `features/onboarding/screens/ModeSelectionScreen.tsx`, `components/ModeOptionCard.tsx` (+ tests)
      -- frame B, and the difference on `BottomSheet` (frame C).
- [ ] `features/onboarding/screens/FeatureHighlightsScreen.tsx`, `components/HighlightSlide.tsx`,
      `components/PaginationDots.tsx` (+ tests) -- frames D–F.
- [ ] Delete `BrandedIcon.tsx`, `FannedCardIllustration.tsx`, `InfoTooltipModal.tsx` (+ test); update
      `features/onboarding/index.ts`.
- [ ] `shared/i18n/locales/en.ts`, `it.ts` -- the three difference paragraphs and the dots' label.
- [ ] `features/onboarding/onboarding.integration.test.tsx` -- the path still runs end to end.
- [ ] `docs/design/cardi/cardi-design-system.md` -- an `### Onboarding` section after
      `### Authentication`, recording Design Notes' rulings.

**Acceptance Criteria:**

- Given the four screens and the sheet, in light and dark, when each is shown at rest, then each
  draws its frame as Design Notes rule it.
- Given any onboarding animation with Reduce Motion off, when it finishes, then it rests on its last
  frame and never loops.
- Given the onboarding path, when it is walked to Skip or "Let's go!", then the routes, guards and
  `completeFirstLaunch()` behave as before, and no `BrandedIcon`, `FannedCardIllustration` or
  `InfoTooltipModal` remains.
- Given `cardi-design-system.md`, when it is read, then it holds an `### Onboarding` section.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Design Notes

The design system is canonical; the adopted canvas places the drawings; the frames give the rest.
Where they differ, the ruling is recorded (`### Onboarding`, "RULED (Story 22.10)").

**Welcome** (frame A, the canvas). A non-bouncing scroll body, padded 24, holds: the mark intro
(100×100, `welcome-branded-icon`) 64 below the top inset; "Cardì" 32 below in `displayLg`,
`textPrimary`; the subtitle 8 below in `bodyLg`, `textSecondary`; the welcome drawing (280×190,
`welcome-fanned-illustration`) 40 below. Both animations start on mount. `PrimaryActionFooter` holds
"Get Started" (large primary) and, 16 below it, "I already have an account": `bodyMdStrong` in
`link`, 48 tall, no underline. Overruled: frame A's in-flow button (capture's precedent), its
230×110 band and its stand-in ì.

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
is "Got it" (`info-tooltip-got-it`), a 52 primary. Overruled: the frame's black scrim, 12 grabber
offset, 24/32 title and fixed 400 height.

**Highlights** (frames D–F, the canvas). No header: Skip at the top right, `bodyMdStrong`, 48 tall.
Each page's content scrolls: the drawing (280×190) 96 below the Skip row, the title 48 below in
`headlineMd` centred, the body 12 below in `bodyMd` `textSecondary` centred, at most 310 wide. The
`PrimaryActionFooter` holds the dots, 8 across and 8 apart (active `primary`, others `border`),
24 above Next / "Let's go!". Each drawing plays the first time its slide settles. Overruled: the
frames' 160 discs and their drawings.

**Dark.** Every value is a role; the black ground; `-dark` drawings.

## Verification

**Commands:**

- `yarn typecheck`, `yarn lint`, `yarn format:check`, `yarn test` -- expected: all pass.
- `python3 docs/design/cardi/lottie/build-onboarding-lottie.py --check` -- expected: all 9 up to date
  (the files are untouched). Where `python3` has no working `pyexpat`, run it as
  `uv run --python 3.12 --no-project python …`, as `docs/design/cardi/lottie/README.md` says.

**Manual checks (if no CLI):**

- On the iOS simulator, from a native build with the module: Welcome, both mode cards, the sheet and
  the three slides, in light and dark, at rest and mid-motion; Reduce Motion on; font scale 1.5.
  Android is checked if an emulator can run, otherwise named as unchecked.

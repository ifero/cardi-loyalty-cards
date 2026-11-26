---
baseline_commit: '4bbfcbd1cd08640a3a80b08f6614744ee6cb8aac'
title: 'The onboarding follow-ups: a carousel that announces nothing, a sheet that names itself wrong in Italian, a version that never moves with the native module, and two stale comments'
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

**Problem:** Story 22.10 (onboarding on the Cardì frames) left fourteen items behind. Eight are still open, and the most serious is the release one: the story added `lottie-react-native`, a native module, while `app.json` pins `runtimeVersion.policy` to `appVersion` and `version` is `1.0.0`. Any OTA built from that commit would target 1.0.0 binaries that do not have the native module -- so **no OTA may be published from `main` until the version moves**. That is a standing hazard, not a cosmetic mismatch.

The rest are accessibility and documentation defects in the shared primitives the onboarding screens use: the highlights carousel announces nothing when the page changes and its wrapper claims an "adjustable" role it does not have; `ModeOptionCard`'s spoken label reads ".. Recommended option." because two full stops meet; the highlight titles carry no header role while every other onboarding title does; the shared sheet's Italian announcements produce "Lingua aperto"; the reduce-motion setting does not stop the carousel's animated scroll; and two comments cite a component that no longer exists.

**Approach:** The release hazard first, because it blocks a whole channel. Then the accessibility items, which are small and share a mechanism (announce the change, or stop claiming a role the element does not have). The documentation items last.

**Decisions (pending ifero's approval):**

- **`expo.version` moves before any OTA is published from `main`.** The version bump is a release decision with a tag implication, so it is paired with the release story rather than done silently.
- **The carousel announces the new page** rather than losing its "adjustable" role: a page change is an announcement, not an adjustment.
- **The shared sheet's announcements are reworded**, so the Italian reads correctly with any sheet's name.

## Boundaries & Constraints

**Always:** The onboarding screens' visual design is unchanged -- the frames are the reference. Every string moves to `en.ts` and `it.ts` together. The accessibility fixes use the platform's own mechanisms (`accessibilityLiveRegion` / `AccessibilityInfo.announce` / `accessibilityRole`). The reduce-motion fix follows the platform's setting, as `features/onboarding/components/OnboardingAnimation.tsx:67` already does with `useReducedMotion()`.

**Never:** Change `app.json`'s `runtimeVersion.policy` -- the policy is a release decision, and only the version moves. Publish an OTA, a tag or a release from this story. Change the onboarding drawings or the Lottie files. Touch the watch. Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario                        | Input / State                                                                   | Expected Output / Behavior                                 | Error Handling                                         |
| ------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| An OTA is published from `main` | `app.json` still says `version: 1.0.0` with `runtimeVersion.policy: appVersion` | The publish is blocked, or the version has moved first     | The hazard is recorded in the story and in the tracker |
| Carousel page change            | The person swipes to the next highlight                                         | The new page is announced                                  | N/A                                                    |
| Carousel role                   | The carousel is focused                                                         | It does not claim an "adjustable" role with no actions     | N/A                                                    |
| Recommended option              | The recommended mode card is focused                                            | Its spoken name is one sentence, with no doubled full stop | N/A                                                    |
| Highlight title                 | The screen is read top to bottom                                                | The highlight title is announced as a heading              | N/A                                                    |
| Sheet opened in Italian         | A sheet with a noun label is opened                                             | The announcement reads correctly, e.g. "Lingua aperta"     | N/A                                                    |
| Reduce motion on                | The person taps Next on the highlights                                          | The carousel does not animate the scroll                   | N/A                                                    |
| Comments                        | The source is read                                                              | No comment cites a component that does not exist           | N/A                                                    |

</frozen-after-approval>

## Code Map

- `app.json:5` -- `"version": "1.0.0"`; `:213-215` -- `"runtimeVersion": { "policy": "appVersion" }`; `:216-218` -- the `updates.url`. `package.json:94` -- `"lottie-react-native": "~7.3.4"`, the native module Story 22.10 added.
- `features/onboarding/screens/FeatureHighlightsScreen.tsx:113` -- `flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });` -- no reduce-motion check (the file imports no `useReducedMotion`; the hook is used in `features/onboarding/components/OnboardingAnimation.tsx:67`).
- `features/onboarding/screens/FeatureHighlightsScreen.tsx:156-159` -- `<View style={styles.carousel} accessibilityRole="adjustable" accessibilityHint={t('onboarding.highlights.swipeAccessibilityHint')}>` -- an "adjustable" role with no `accessibilityActions`, and nothing announced when `currentIndex` changes.
- `features/onboarding/components/ModeOptionCard.tsx:78` -- ``accessibilityLabel={`${title}. ${subtitle}${recommended ? t('onboarding.modeOption.recommendedAccessibilitySuffix') : ''}`}`` with `shared/i18n/locales/en.ts:84` -- `recommendedAccessibilitySuffix: '. Recommended option.',` and `it.ts:85` -- `'. Opzione consigliata.'` -- so a subtitle ending in a full stop yields a doubled stop.
- `features/onboarding/components/HighlightSlide.tsx:44` -- `<Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>` with no `accessibilityRole="header"`, unlike `features/onboarding/screens/ModeSelectionScreen.tsx:64` and `features/onboarding/screens/WelcomeScreen.tsx:104`.
- `shared/i18n/locales/it.ts:284-285` -- `expandedAccessibilityValue: 'aperto', collapsedAccessibilityValue: 'chiuso'`; `:297-298` -- `openedAnnouncement: '{{label}} aperto', closedAnnouncement: '{{label}} chiuso'`. Applied to a label that is already a noun, the result is "Lingua aperto".
- `shared/components/ui/BottomSheet.tsx` -- the shared sheet; `grep -n "AccessibilityFocus\|focus"` returns nothing, so the sheet moves no screen-reader focus when it closes.
- `app/_layout.tsx:165-170` -- the welcome screen's `animation: 'fade'`; `:115` -- `router.replace('/welcome');` -- the gate that shows Home's header and spinner through the fade.
- `docs/design/cardi/lottie/README.md:49` -- _"`lottie-react-native` is not installed yet."_, while `package.json:94` lists it.
- `shared/components/launch/AppLaunchScreen.tsx:144` -- *"Both props, per FannedCardIllustration. _/"_; `shared/components/launch/AppLaunchScreen.test.tsx:192` -- the same. `grep -rn "FannedCardIllustration" shared/` finds only these two comments.
- `features/cards/screens/HomeScreen.test.tsx:124-126` -- `jest.mock('@/features/onboarding', () => ({ OnboardingOverlay: () => null }));`, while `features/onboarding/index.ts` exports `WelcomeScreen`, `ModeSelectionScreen`, `FeatureHighlightsScreen`, `ModeOptionCard`, `HighlightSlide`, `PaginationDots`, `useModeSelection`, `useHighlightPagination`, `TOTAL_HIGHLIGHT_SLIDES` -- and no `OnboardingOverlay`.
- `docs/design/cardi/frames/cardi-auth-frames.html:349-381` -- the hand-built mark in the auth frames; `docs/design/cardi/stitch-prompts-auth.txt:45` -- the stock glyphs (see also `16-50`, which records the same as the auth design sources).
- Do not change: the onboarding drawings, the Lottie files in `assets/animations/onboarding/`, `app.json`'s `runtimeVersion.policy`.

## Tasks & Acceptance

**Execution:**

- [ ] `app.json` -- the version moves off `1.0.0` **before any OTA is published from `main`**, so the runtimeVersion the OTA targets is one that has the `lottie-react-native` native module. The tag implication is recorded, and the release story (24.7) is told.
- [ ] `features/onboarding/screens/FeatureHighlightsScreen.tsx` -- the page change is announced (an `accessibilityLiveRegion` or `AccessibilityInfo.announce`), and the carousel's `accessibilityRole="adjustable"` is replaced with the role that matches what it does.
- [ ] `features/onboarding/components/ModeOptionCard.tsx` -- the spoken name is one sentence with no doubled full stop, in both locales.
- [ ] `features/onboarding/components/HighlightSlide.tsx` -- the title carries the header role the other onboarding titles carry.
- [ ] `shared/i18n/locales/it.ts:297-298` (and the English pair) -- the sheet announcements read correctly with any sheet's name; the announcement for a noun label is not a bare "aperto".
- [ ] `shared/components/ui/BottomSheet.tsx` -- screen-reader focus returns to the trigger when the sheet closes, for every sheet.
- [ ] `features/onboarding/screens/FeatureHighlightsScreen.tsx` -- under Reduce Motion, the carousel's page scroll is not animated.
- [ ] `app/_layout.tsx` -- the welcome transition does not show Home's header and spinner through the fade (the root gate's animation, or the header's visibility while the gate is up).
- [ ] `docs/design/cardi/lottie/README.md:49` -- the README says the module is installed, with the dev-build requirement it carries.
- [ ] `shared/components/launch/AppLaunchScreen.tsx:144`, `AppLaunchScreen.test.tsx:192` -- the two comments stop citing `FannedCardIllustration`.
- [ ] `features/cards/screens/HomeScreen.test.tsx:124-126` -- the mock matches the real `features/onboarding` exports.
- [ ] `yarn lint`, `yarn typecheck`, `yarn test` -- green.

**Acceptance Criteria:**

- Given `app.json`, when it is read, then the version is one that an OTA can safely target -- no OTA built from the current commit targets a 1.0.0 binary.
- Given the highlights carousel, when the person swipes to the next page, then the new page is announced to a screen reader.
- Given the carousel, when a screen reader focuses it, then it does not claim an "adjustable" role it does not support.
- Given the recommended mode card, when it is focused, then its spoken name contains no doubled full stop.
- Given the highlights screen, when it is read, then the slide title is announced as a heading.
- Given a sheet with a noun label opened in Italian, when it is announced, then the announcement is correct Italian.
- Given Reduce Motion is on, when the person taps Next on the highlights, then the carousel does not animate.
- Given any sheet closes, when the screen reader's focus is restored, then it lands on the control that opened it.
- Given `grep` for `FannedCardIllustration` and `OnboardingOverlay`, when it runs, then neither names anything that does not exist.

## Design Notes

The release hazard is the one item here that is not cosmetic, and it is easy to miss because the failure is silent: an OTA that targets a binary without the native module renders a missing view, and how badly depends on the build. The version bump is small, but the decision it implies -- which release carries the onboarding animations -- is not, so it is paired with the release story rather than done in passing.

The accessibility items share a mechanism worth naming: an element that claims a role it does not support (an "adjustable" carousel with no actions) is worse for a screen-reader user than one that claims nothing, because the person is told they can adjust something and then cannot. The carousel announces a page change; the sheet's announcements are reworded so they fit the label they are attached to.

The shared sheet is the widest-reaching of these, because every sheet in the app uses it. Fixing the focus restore there fixes it everywhere.

## Implementation Notes

- Source issue: #281 (all items). The story records its own list under **Implementation Notes -> Found, not
  fixed** in `docs/sprint-artifacts/stories/22-10-onboarding.md`.
- Item 6 (the sheet's Italian announcements) and item 7 (the largest-text-size items) overlap with
  `16-50-triage-design-system-followups.md`; the shared primitive changes live here, and the design-system
  document changes live there.
- The onboarding Lottie files are in `assets/animations/onboarding/` (nine files, added in `f888a3c chore(design):
add onboarding Lottie animations and their generator (#278)`), and `assets/animations/` is in
  `.prettierignore`.
- `docs/design/cardi/lottie/README.md` documents the generator's constraints (one shape layer per file, no
  masks, mattes, expressions, images or text) -- the "not installed" sentence at `:49` is the only stale part.
- The onboarding Design canvas item (the mark at the old 34-in-100 size) is an **external Figma asset** and
  cannot be verified or changed from this repository. It is recorded here as a known split between the
  repository's Lottie and the design canvas, and it needs ifero's hand.
- The `OnboardingOverlay` mock is harmless at runtime (the module is mocked, so the missing export never
  matters), but it misleads: a reader sees an export that does not exist and assumes one should.
- `app/_layout.tsx`'s welcome fade and the root gate are the "Home's header and spinner show through
  Welcome's fade-in for about 0.4 s" item. The fix is in the transition, not in the header.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors
- `yarn lint` -- expected: no errors
- `yarn format:check` -- expected: clean
- `yarn test` -- expected: all suites pass

**Manual checks (if no CLI):**

- On an iOS simulator with VoiceOver: swipe through the highlights and confirm each page is announced;
  open a sheet and confirm the focus returns to the control that opened it.
- On an iOS simulator with Reduce Motion on: confirm the highlights carousel does not animate.
- In Italian: open the language sheet and confirm the announcement reads correctly.

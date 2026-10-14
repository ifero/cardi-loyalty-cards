---
title: 'Story 22.5: Capture — the five Cardì capture frames'
type: 'feature'
created: '2026-10-12'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '8083e1b0202a2761ded448d3144a67d8877d2003'
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The add-card capture flow predates the Cardì frames. Its specific problems:

- The brand list draws MaterialIcons, inset rules and a fixed white monogram.
- The scanner sets white text on a dark disc at 80 %, under a light-mode status bar drawn dark on
  the black feed.
- The refused-camera screen shows before the user has answered the system prompt.
- The multi-code picker has 56pt rows, a red Cancel and English-only row labels.
- The scan banner carries an amber warning icon on 16pt margins.

**Approach:** Implement capture frames A–E from `docs/design/cardi/frames/cardi-capture-frames.html`
and `stitch-prompts-capture.txt`, in light and dark, with `cardi-design-system.md` winning any
conflict. Restyle the existing add-card components rather than rebuilding the flow. Record every
ruling in the design system.

## Boundaries & Constraints

**Always:**

- The five frames:
  - **A** is the brand list;
  - **B** is the viewfinder;
  - **C** is the refused camera;
  - **D** is the multiple-codes picker;
  - **E** is the scan banner over B, the acceptance criteria's 16-30 bullet.
- **Beam.** `IDENTITY_COLORS.beam` is drawn only as the 2pt scan line and as the banner's two
  links. Frames A, C and D carry none.
- **Camera states.** B and E look the same in both schemes:
  - a `#000000` ground, cream text and white corners;
  - their colours come from one fixed-role object in `shared/theme/colors.ts`;
  - the text shadow goes only on text set directly on the feed.

  With no camera (C, and the camera-error state) the screen takes the scheme's own ground.

- **Keep what shipped:**
  - Story 16.31's geometry: `getViewfinderSize`, the 32/4/12 corners and the sweep;
  - Story 16.30's outcome: the banner 16 above the action rows, never over them. Its placement
    changes, per the large-text decision below;
  - the mount-error telemetry and its classifier;
  - every navigation param, including the "Other card" route's exact `{ mode: 'custom' }`;
  - `useImageScan`'s outcomes and its six-code cap;
  - the banner's 5 s auto-dismiss;
  - the haptic on a camera scan;
  - every testID the Code Map lists, and the accessibility labels of controls that survive.
- **House rules:**
  - theme or fixed roles only, with no hex literal in a component;
  - type from `TYPOGRAPHY`;
  - Lucide icons, each imported from `lucide-react-native/icons/<name>`;
  - every tappable at least `TOUCH_TARGET.min`, with the 0.98 press scale driven by
    `onPressIn`/`onPressOut`;
  - safe-area insets on every edge control;
  - strings in `en.ts` and `it.ts`;
  - `scheduleOnRN`, never `runOnJS`.
- Check every library API against Context7 or the installed source in `node_modules/` before using
  it. The pinned versions are:
  - Expo SDK 55, expo-router 55.0.13, React Native 0.83.6;
  - expo-camera 55.0.16, expo-status-bar 55.0.5;
  - Reanimated 4.2.1, react-native-worklets 0.7.4, lucide-react-native 1.52.0.

  Nothing is implemented from memory.

**Decided (ifero, 2026-10-12):**

- **"Other card":** as frame A draws it. It is the last row inside the ALL CARDS surface, and the
  last row of RESULTS while searching.
- **Spec size:** kept whole, well over the 1,600-token target.

**Decided (ifero, 2026-10-13):**

- **Large text on the scanner:** one bottom region.
  - The banner and the two action rows share one container at the bottom. It grows with the text,
    and starts scrolling once it would reach the brand pill.
  - At default sizes it looks as it does now: the banner 16pt above the rows.
  - This replaces Story 16.30's measured offset with the shared container its acceptance criterion 3
    allows.

**Never:**

- Commit, push, or change `docs/sprint-artifacts/sprint-status.yaml` or any other tracker file. The
  orchestrator owns all three.
- Change any of these:
  - `CardSetupScreen`, `add-card/setup` or `InlineScanButton`, which belong to Story 22.6;
  - any primitive in `shared/components/ui/`;
  - `app/_layout.tsx`, or anything in `app/add-card/`;
  - `useBarcodeScanner`'s format mapping, `useImageScan`'s decode path, or the camera's
    `barcodeTypes`;
  - the legacy `BarcodeScanner`, `CatalogueGrid` or `app/scan.tsx`;
  - the watch apps.
- Draw anything frame B forbids: a torch, zoom, gallery thumbnail, format selector, camera flip,
  progress ring or shutter. Never filter scans by a region of interest.

## I/O & Edge-Case Matrix

| Scenario      | Input / State                                                 | Expected Output / Behavior                                                                                                                                                                        | Error Handling                                       |
| ------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Brand list    | `/add-card`, light or dark                                    | Frame A: the header, a pinned search field, POPULAR CARDS and ALL CARDS each above one outlined surface of 64pt rows, with "Other card" as the last row of ALL CARDS                              | N/A                                                  |
| Search        | a query                                                       | a RESULTS surface holding the matches, then "Other card" as its last row; with no match, "No cards found" and "Other card"                                                                        | N/A                                                  |
| Choose        | a brand row, or "Other card"                                  | the scanner opens with that brand's params, or with exactly `{ mode: 'custom' }`                                                                                                                  | N/A                                                  |
| Pending       | camera permission `null` or `undetermined`                    | frame B's chrome on the black ground; no camera is mounted and frame C does not show                                                                                                              | a failed request → the camera-error state            |
| Aim           | permission granted                                            | Frame B over the feed: the 40pt back disc, the brand pill (none for a custom card), the viewfinder shaped to the format, the moving beam, the instruction and both rows, under a light status bar | a mount error → the camera-error state               |
| Reduce Motion | the system setting on                                         | the beam stands still at 46/120 of the box's height                                                                                                                                               | N/A                                                  |
| Refused       | permission `denied`                                           | Frame C on the scheme's ground: the message centred above an anchored footer holding "Open Settings" and "Enter card number manually"                                                             | an `openSettings` failure is logged and never thrown |
| Camera error  | a mount error, or a failed request                            | frame C's layout with no red; the localised "Unable to start the camera preview."; the shipped fallback buttons                                                                                   | Retry clears it and asks again                       |
| No code       | an image scan ends `notFound`, `scanFailed` or `pickerFailed` | Frame E: the banner 16pt above the action stack, with no icon, on 24pt margins                                                                                                                    | its × or the 5 s timer dismisses it                  |
| Many codes    | an image holding 2–6 codes                                    | Frame D: the shared sheet of 64pt rows; behind it no viewfinder, beam or instruction, and no camera scanning                                                                                      | Cancel, the scrim and Android back close it          |
| Pick          | a row tapped                                                  | setup opens with that code, as today                                                                                                                                                              | N/A                                                  |
| Large text    | the largest accessibility size                                | rows grow rather than clip; the list and the scanner's bottom region scroll; the banner's plate grows                                                                                             | N/A                                                  |
| Screen reader | VoiceOver or TalkBack                                         | "Add Card" as a heading; each row named; each picker row as "{format}, code {value}" in the active language                                                                                       | N/A                                                  |

</frozen-after-approval>

## Code Map

- `features/add-card/screens/CardTypeSelectionScreen.tsx` -- frame A's screen.
  - `SafeAreaView edges={['top']}` at `:61`; nothing pads the bottom inset.
  - Hand-rolled header at `:63-77`: a MaterialIcons `chevron-left` 28, a `bodyLgStrong` title and
    a 48pt spacer. Its padding (`:111`) is `24 - 8`.
  - Search wrapper at `:128-132`. Navigation at `:37-54`.
- `features/add-card/components/BrandList.tsx`
  - A `SectionList` (`:138-151`): Popular, then an untitled "Other card" section, then All
    (`:65-78`). While searching, one RESULTS section with "Other card" appended (`:55-62`).
  - Footers at `:115-135`. `SectionHeader` inside 24/14/8 padding (`:106-113`, `:159-163`).
- `features/add-card/components/BrandRow.tsx`, `OtherCardRow.tsx` -- both are `ActionRow`
  (MaterialIcons chevron, inset rule).
  - The monogram is `monogram(22)` in a fixed `#FFFFFF` (`BrandRow.tsx:65-68`).
  - Other card holds a MaterialIcons `add` (`:33`).
- `features/add-card/components/BrandSearchBar.tsx` (+ 9 tests) -- MaterialIcons, no border width.
  - Its strings are `addCard.search.{placeholder,accessibilityLabel,clearAccessibilityLabel}`.
  - It is exported from `features/add-card/index.ts:17`, and nothing imports that barrel.
- `features/cards/components/SearchBar.tsx` -- Story 22.2's field, exactly frame A's: Lucide
  magnifier 20 and × 18 at 1.8.
  - Same props, and the same `${testID}-input`/`-clear` scheme.
  - Its strings are hardcoded `cards.home.*` (`:86`, `:89`, `:98`).
  - `add-card` may import from `cards` (`eslint.config.mjs:213-217`).
- `features/add-card/components/ScannerOverlay.tsx` -- frames B and C, and the error state:
  - the classifier at `:99-107`; `VIEWFINDER_SHAPE` and `getViewfinderSize` at `:113-153`;
  - the corners at `:155-237`; `ScanLine` at `:240-279`, with no Reduce Motion handling;
  - the request-on-null effect at `:345-349`;
  - the refused branch at `:352-385`, which matches ANY non-granted state, `undetermined` included;
  - the error branch at `:388-435`, whose body is the raw native message (`:401`);
  - the camera branch at `:438-542`: the `CameraView` mounted while permission is still `null`
    (`:441-449`), a hardcoded `#FFFFFF`, and the caption in the same flex column as the viewfinder
    (`:473-479`, `:561-575`), which shifts the box up;
  - the banner at `:492-504`, and the action stack at `:508-540`.
  - It sets no status bar.
- `features/add-card/components/FloatingBackButton.tsx` -- a 48pt disc at 80 % black, a
  MaterialIcons chevron, and a 0.7 opacity press.
- `features/add-card/components/BrandPill.tsx` -- 32 tall, a 16pt `BrandLogo`, and padding 16.
- `features/add-card/components/NoCodeFoundBanner.tsx`:
  - the `warning-amber` icon at `:100`;
  - margins of 16 (`:142`);
  - link targets of 24 (`:161`).
- `features/add-card/components/MultiCodePickerSheet.tsx`:
  - rows of 56 (`:176`) with MaterialIcons glyphs in `theme.primary` and a chevron (`:80-90`);
  - an English label at `:142`;
  - Cancel in `theme.error` (`:162`).
- `features/add-card/screens/BrandScannerScreen.tsx` -- renders the overlay and the picker
  (`:114-137`). `multiCodes.length > 0` is the picker's visibility.
- `features/cards/hooks/useBarcodeScanner.ts` -- its `enabled` option already gates
  `handleBarcodeScanned` (`:128`).
  - `ScannerOverlay` passes `true` (`:308`).
  - Toggling `onBarcodeScanned` instead would recreate the camera on Android
    (`ExpoCameraView.kt:677-680`).
- `node_modules/expo-camera` -- `useCameraPermissions` starts at `null`.
  - The response is `{ status: 'granted' | 'undetermined' | 'denied', granted, canAskAgain }`
    (`src/PermissionsInterface.ts`).
  - iOS starts its session's permission check only once a camera exists
    (`CameraSessionManager.swift:365-384`). So on the simulator the view paints black, with no
    mount error.
- `features/cards/components/HeaderIconButton.tsx` -- a 48 target with a Lucide 24/1.5 icon and
  the 0.98 press. Always pass `fill` through: Lucide fills black on an explicit `undefined`.
- `features/cards/screens/CardDetailScreen.tsx:312` -- the status-bar precedent:
  `{isFocused ? <StatusBar … /> : null}`, with `useIsFocused` from `expo-router`.
- `shared/components/ui/`:
  - `Surface` takes `divided` for full-width rules;
  - `SectionHeader`;
  - `PrimaryActionFooter` holds a stack 8 apart, and `features/cards/components/EmptyState.tsx` is
    its precedent;
  - `Button` takes `size="large"` for the 52pt footer primary;
  - `BottomSheet` takes `visible`, `onClose`, `title`, `description` and `testID`, and has a
    left-aligned title;
  - `getTileAppearance(fill)` returns `isLight` and `isNearBlack`.
- `shared/theme/colors.ts:113-116` -- `BARCODE_FLASH`, the fixed-role precedent.
  `IDENTITY_COLORS.cream` is `#F0F0E8`, and `getContrastForeground` is in `luminance.ts`.
- **testIDs that stay:**
  - brand list: `back-button`, `brand-search-bar` (with `-input` and `-clear`), `brand-list`,
    `brand-row-<id>`, `other-card-row`;
  - scanner: `brand-scanner-screen`, `floating-back-button`, `brand-pill`, `viewfinder`,
    `viewfinder-corner-tl`, `image-processing-indicator`, `scanner-bottom-actions`,
    `scan-from-image-row`, `manual-entry-row`;
  - refused and error states: `open-settings-button`, `manual-entry-button`,
    `scan-from-image-fallback-button`, `retry-button`, `manual-entry-fallback-button`;
  - banner: `no-code-found-banner-anchor`, `no-code-found-banner`, `banner-close`,
    `banner-retry-image`, `banner-manual-entry`;
  - picker: `multi-code-picker-sheet` (with `-root`, `-scrim`, `-content` and `-grabber`),
    `code-row-<n>`, `multi-code-cancel`.
- `shared/i18n/locales/en.ts:472-558`, `it.ts:474-558` -- the `addCard` strings.
  - `multiCode.formats` names all six formats.
  - Parity is gated by `card-colors.test.ts`.
  - `italian-rendering.test.tsx` pins `addCard.selection.heading`.
- Tests that pin things:
  - **MaterialIcons names asserted as text** (the global icon mock, `jest.setup.js:195-210`):
    `FloatingBackButton.test:24`, `OtherCardRow.test:42,47`, `BrandRow.test:66` and
    `BrandSearchBar.test:36`. Lucide renders real SVGs (`jest.config.js:27-32`), so assert on
    testIDs instead.
  - **`ScannerOverlay.test`:**
    - telemetry at `:146-265`;
    - `getViewfinderSize` at `:425-446`;
    - the box at `:464-473`;
    - `withTiming(height-4)` at `:475-480`;
    - the corners at `:482-493`;
    - the stack in flow at `:523-531`;
    - the banner at `:533-561`;
    - the 48pt rows at `:563-570`.
  - **`CardTypeSelectionScreen.test`:** `{ mode: 'custom' }` at `:169-172`.
  - **Narrow Reanimated mocks** that lack `useReducedMotion` and must gain it:
    `ScannerOverlay.test:56-81`, `BrandScannerScreen.test:56-81` and
    `MultiCodePickerSheet.test:36-60`.
  - **No `useIsFocused`.** The global `expo-router` mock (`jest.setup.js:145-162`) has none; each
    suite that renders the overlay mocks it, as `BarcodeFlash.test.tsx:73` does.

## Tasks & Acceptance

**Execution:**

- [x] `shared/theme/colors.ts` -- add `CAMERA_OVERLAY` beside `BARCODE_FLASH`, with the values in
      Design Notes. The camera surfaces ignore the scheme, so they take fixed roles.
- [x] `features/cards/components/SearchBar.tsx` (+ test) -- add optional `placeholder`,
      `accessibilityLabel` and `clearAccessibilityLabel` props. The wallet's defaults and behaviour
      stay unchanged. This reuses the frame's field rather than drawing it a second time.
- [x] `features/add-card/screens/CardTypeSelectionScreen.tsx` (+ test) -- frame A's header and
      search field: `HeaderIconButton` and `SearchBar` with the `addCard.search.*` strings.
- [x] `features/add-card/components/BrandList.tsx` -- each section's rows in one `Surface`, with
      "Other card" as the last row of ALL CARDS, and of RESULTS while searching (Decided). The
      footers stay. The bottom inset is added below the list.
- [x] `features/add-card/components/BrandRow.tsx`, `OtherCardRow.tsx` (+ tests) -- frame A's
      64pt rows, per Design Notes, no longer built on `ActionRow`.
- [x] `features/add-card/components/BrandSearchBar.tsx`, `BrandSearchBar.test.tsx`,
      `features/add-card/index.ts` -- delete the component and its export.
- [x] `features/add-card/components/FloatingBackButton.tsx` (+ test) -- the 40pt disc in a 48pt
      target, in two looks: on the feed, and on the ground.
- [x] `features/add-card/components/BrandPill.tsx` (+ test) -- frame B's pill.
- [x] `features/add-card/components/ScannerOverlay.tsx` (+ test) -- implement:
  - frame B, the pending state, frame C and the error state, per Design Notes;
  - an `isPickerVisible` prop that hides the viewfinder, beam and instruction, and passes
    `enabled: false` to the scanner hook;
  - Reduce Motion;
  - the status bar.
- [x] `features/add-card/components/NoCodeFoundBanner.tsx` (+ test) -- frame E's plate.
- [x] `features/add-card/components/MultiCodePickerSheet.tsx` (+ test) -- frame D's rows and
      Cancel.
- [x] `features/add-card/screens/BrandScannerScreen.tsx` (+ test) -- pass the picker's visibility
      to the overlay.
- [x] `shared/i18n/locales/en.ts`, `it.ts` -- in both locales:
  - add `addCard.multiCode.codeAccessibilityLabel` (`{{format}}, code {{value}}` /
    `{{format}}, codice {{value}}`);
  - change `addCard.noCodeFound.manualEntry` to "Enter it manually" / "Inseriscilo manualmente".
- [x] `docs/design/cardi/cardi-design-system.md` -- record the rulings in Design Notes' _Record_
      list.

Unit-test every I/O row a test can observe. Each new check must be seen to fail under its
mutation.

**Acceptance Criteria:**

- **Frame A:**
  - Given the brand list in light and dark,
  - when it opens or a query is typed,
  - then it draws frame A: no MaterialIcons, 64pt rows in outlined surfaces, and an initial that
    reads on its brand colour.
- **Frame B:**
  - Given camera access,
  - when the scanner opens for an EAN-13 brand, a QR brand or a custom card,
  - then frame B shows in both schemes: a wide or square viewfinder centred on the screen, the
    beam sweeping it (still under Reduce Motion), and cream text under a light status bar.
- **Frame C and the pending state:**
  - Given no answer to the camera prompt yet,
  - then no refused screen shows and no camera is mounted;
  - and given a refusal, frame C shows with its actions in an anchored footer.
- **Frame D:**
  - Given an image holding several codes,
  - when it is scanned,
  - then frame D lists them in localised 64pt rows, the camera stops scanning, and a pick opens
    setup.
- **Frame E:**
  - Given an image with no readable code,
  - then the banner shows above the action rows with no icon, and both its links reach 48pt
    targets.

## Implementation Notes

**Step 3 (2026-10-12).** A context-free subagent built this from the spec, and its work was then
checked against the diff, not against its report.

- **The orchestrator's own run of the four gates:** `yarn typecheck`, `yarn lint`,
  `yarn format:check` and `yarn test` (205 suites, 3,227 tests) all pass.
- **On the simulator.** The subagent checked frames A–E, plus the pending and camera-error states,
  on a "DS22-5 iPhone 16" simulator (393pt, iOS 26.5) in light and dark. The screenshots are in the
  session scratchpad. The full DEVICE CHECK is still to come, after review.
- **Beyond the task list:**
  - a shared `BrandListRow` for both of frame A's rows;
  - "Add Card" announced as a heading;
  - the brand list's safe area extended to the left and right edges;
  - added testIDs, with every testID in the Code Map kept;
  - two stale comments corrected, in `colors.contrast.test.ts` and `NoCodeFoundBanner`.
- **Readings.**
  - In dark mode the shared `Button` and `SearchBar` draw beam on frames A and C, as the primary
    role: the design system makes every primary action beam in dark.
  - That is read as outside "Frames A, C and D carry none", which names the `IDENTITY_COLORS.beam`
    this story draws. The Approach also lets the design system win.
- **Risks the subagent reported:**
  - the brand list renders all of its rows (about 62) with no virtualisation;
  - `enabled: false` under the picker clears the scanner hook's `error`.
- **To the human (step-3 matrix audit).** The Large-text row says "rows grow rather than clip".
  Design Notes keep "the shipped 48pt rows".
  - Grown rows pushed the scan banner, which is placed above them, off the screen at the largest
    sizes, so the subagent kept them fixed. Their labels clip instead.
  - ifero chose option (b) on 2026-10-13: one bottom region (frozen block, Design Notes). The same
    subagent was sent back to build it.
  - It built the region as one in-flow `ScrollView`, with its ceiling in the overlay's top padding:
    16pt under the pill's measured bottom.
  - The orchestrator re-read the diff and re-ran the four gates (205 suites, 3,232 tests), all
    green. Every I/O row now has a covering test that ran.
  - It found one thing on the simulator. At the largest sizes the instruction line shows through
    the plate-less action rows. The decision accepts the region rising over the instruction, so
    this is left to review.

**Step 4 (2026-10-13), review pass 1.** The four layers raised 36 findings; the Review Triage Log
has all of them.

- **Patched:** 14 groups, A–M and V, by the same subagent. Each new check was seen to fail under its
  mutation, 17 mutations in all.
- **Deferred:** 8. **Rejected:** 7.
- **No loopback.** Nothing traced to the frozen intent, or to a spec-prescribed mechanism that
  needed re-deriving.
- **Design Notes updated** to match the patches: the search role, the pill dot's hairline, the
  instruction hiding beneath the region, `logger.notify`, the always-scrolling picker, the link row
  gap and minimum width, `CAMERA_OVERLAY`'s derivation, and the Inter initials.
- **Final run:** the four gates pass, with 206 suites and 3,246 tests.

**Device check (2026-10-13).** It ran on the "DS22-5 iPhone 16" simulator (393 × 852pt, iOS 26.5)
in light and dark, against the final code. Metro ran from this worktree. The served bundle was
grepped for each latest edit before any screenshot, and the subagent drove the app over Metro's
debugger, because the live simulator panel was not granted. The orchestrator read every screenshot
back against the frames. The screenshots are in the session scratchpad's `shots/` folder: frame A
under `F-A*`, every scanner state under `G-*`, and the AX1–AX5 picker probes under `F-X5*`, `F-X6*`
and `F-probe-*`.

- **Checked:**
  - frame A, its search, and no results;
  - frame B for EAN-13, QR, a custom card and a white brand's pill;
  - the beam's live sweep: its position differs across successive `G-` captures;
  - Reduce Motion;
  - pending, including the real first-run prompt in `F-P2`;
  - frame C after a real revoke, and the camera-error state;
  - frame D;
  - frame E;
  - the largest text size, with and without the banner.
- **Found and fixed:** frame E hid the instruction at default size. The banner's region sat 0.33pt
  inside the instruction's line box, in the empty leading. The rule now counts only the glyphs,
  with a unit test at that 0.33pt case. The scanner states were re-shot, and frame E now matches.
- **Found, not caused by this story:** the picker shows no rows at AX4 and AX5. It is Found, not
  fixed item 15, and goes to the human.
- **Unchecked:**
  - Android, for which there is no emulator. Android 14's non-linear font scaling makes the
    instruction's scaled leading approximate there.
  - live camera scanning, because the simulator has no camera;
  - real touches, which mattered most for the banner's targets and slop;
  - the real image-picker flow. Frames D and E were set through `useImageScan`'s state.

**Review loops (2026-10-13).** Each round's reviewer is a new Sonnet subagent, given a fresh diff.

- **Code round 1:** `APPROVED`, zero comments.
- **QA round 1:** `CHANGES_REQUESTED`, 5 findings, all verified real and fixed. Four were test gaps
  and one a documentation gap:
  1. the design-system record missed five patch rulings;
  2. the live beam sweep was unpinned;
  3. frame C's anchored footer and centred message were unpinned;
  4. the header spacer was unpinned, under a test name that claimed it;
  5. the Italian "Inseriscilo manualmente" was unpinned.

  Those fixes change the reviewed diff, so both loops run again.

  After the fixes, the four gates pass (206 suites, 3,252 tests). The spacer's new testID reaches
  the app, so frame A was re-shot (`H-A1-*`): the spacer measures 48, and the title is centred at
  196.5 of 393.

- **Code round 2:** `CHANGES_REQUESTED`, 1 finding, verified real.
  - The picker's rows were meant to run edge to edge, but their negative margins sat inside the
    `FlatList`'s own clipping scroll view. The rules stopped 24pt short of each side (measured on
    `G-D1-*`).
  - The mechanism came from `main`. This story rebuilt those rows, so it is fixed here: the list
    takes the negative margin instead of the rows, and frame D is re-checked.
  - Re-shot as `I-D1-*`, light and dark: the rules now measure 0 to 393pt (24 to 369 before), and
    the rows' frames span the full width.
- **Code round 3:** `APPROVED`, zero comments. The gates pass (206 suites, 3,252 tests).
- **QA round 2:** `CHANGES_REQUESTED`, 1 finding, verified real.
  - Frame A's row label was capped at one line, so at the largest sizes the names were cut ("Essel…",
    "Other…"). That breaks the frozen Large-text row.
  - The fix lets the label wrap, which moves only the Design Notes' "on one line". The brand list
    is re-checked at the default and largest sizes, and both loops run again.
  - Re-shot as `J-A1-*` at the default size, unchanged with every row 64pt, and as `J-AX-*` at the
    largest size, light and dark. The names now wrap.
  - **To the human:** at the largest size iOS breaks a single word wider than the 215pt label in
    the middle, with no hyphen ("Esselu / nga", "Carref / our"). That follows the frozen
    "grow rather than clip"; whether it reads acceptably is a design call.
- **Code round 4:** `APPROVED`, zero comments. The gates pass (206 suites, 3,251 tests).
- **QA round 3:** `APPROVED`, zero comments.
- **Both loops converged** on the same final diff. The per-round findings were:
  - code: 0, then 1, then 0, then 0;
  - QA: 5, then 1, then 0.

  None was a nit.

### Found, not fixed

Found while planning. Each is outside this story's mechanisms, or needs hardware this host lacks.
Filed at ifero's request as
[#266](https://github.com/ifero/myLoyaltyCards/issues/266) (backlog, needs-triage); the numbers match. Items 10–15 were added after the story's own review and
device check.

1. **No re-check after Settings on Android.** After "Open Settings", nothing re-reads the camera
   permission when the app returns: `useCameraPermissions` does not refresh on foreground. iOS
   relaunches an app whose privacy setting changes, so it is unaffected.
2. **iOS Code 39 from the camera may be stored as Code 128.** ZXing reports the AVFoundation raw
   type (`ExpoCameraZXingProvider.swift:12,27-29`), which `BARCODE_FORMAT_MAP` does not map. The
   installed Swift lacks the fix that expo-camera 55.0.16's CHANGELOG claims. Needs a device.
3. **An image scan from the error state has no feedback.** Started from the camera-error state's
   "Scan from image", it shows neither the processing indicator nor the banner: both live only in
   the camera branch.
4. **The camera keeps running under setup.** Nothing gates it on focus or on `active`.
5. **Processing blocks the back button.** The image-processing layer sits above the back button
   and takes its touches while an image decodes.
6. **iOS UPC-E falls back to CODE128.** The iOS image decoder registers UPC-E alongside UPC-A, and
   the app has no `UPC_E`.
7. **Legacy files have no production consumer:** `BarcodeScanner`, `CatalogueGrid` and
   `app/scan.tsx`. Issue #248 item 2 and #251 item 6 track them.
8. **`function` declarations against the arrow-function rule:**
   - `useBarcodeScanner.ts:48`, `:96`;
   - `useImageScan.ts:68`.
9. **A stale design note.** `docs/ux-designs/2-9-scan-from-image.md:138` still describes the
   picker's removed `adjustable` handle.

Deferred by review pass 1 (2026-10-13; Review Triage Log rows in brackets). Rows 28 and 30 re-found
items 3 and 1, and row 25 adds to item 4: a re-armed scan there could push setup a second time.

10. **The brand list renders all of its rows at once** [3, 16]. About 63 rows sit in one
    `ScrollView`, with no virtualisation. Unverified: profile the first render, and a search-clear
    remount, on a low-end Android.
11. **Android may rebind the camera on every live scan** [9]. `onBarcodeScanned` still toggles on
    `hasScanned`, as on `main`. Unverified on a device.
12. **The scanner's action rows can lose contrast over a bright scene** [13]. Cream, unshadowed, at
    about 2.5:1; the shipped white rows were about 2.85:1. Frame B keeps them plain. A feed shadow or
    a plate for the rows is a design call.
13. **While searching, "Other card" and the results line can sit under the iOS keyboard** [17]. This
    predates the story. The return key dismisses the keyboard.
14. **The picker cuts a value at 28 UTF-16 code units** [34], which can split a surrogate pair. This
    predates the story.

Found by the device check (2026-10-13):

15. **The multi-code picker shows no rows at the two largest text sizes.** The shared `BottomSheet`'s
    title and description neither shrink nor scroll inside its 80 % cap. The list's visible height is
    360.67pt at AX1, 274 at AX2, 127 at AX3, and 0 at AX4 and AX5. Only the scrim and Android back
    can close it.
    - `BottomSheet` is unchanged from `main`, whose picker has the same structure. The settings
      sheets share the primitive.
    - The fix belongs to the primitive, which this spec's Never list protects, so it goes to ifero.
    - The I/O matrix's Large text row is met at AX1–AX3, where the list now always scrolls, but not
      at AX4–AX5.

## Spec Change Log

## Review Triage Log

**Pass 1 (2026-10-13).** Four layers reviewed one diff:

- Blind Hunter (BH);
- Edge Case Hunter (EC);
- Verification Gap (VG);
- Project Conventions (PC).

There are 36 findings. Every one was verified at its cited location before routing. Nothing routes
to `intent_gap` or `bad_spec`, so there is no loopback.

| #   | Layer | Location                                                     | Claim                                                                                                                | Verdict     | Evidence                                                                                                                                                                                                                                                 | Route        |
| --- | ----- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1   | PC    | `shared/theme/colors.ts:131-145`                             | `CAMERA_OVERLAY` hard-codes hex and rgba where `NEUTRAL_COLORS` and `toRgbChannels` exist                            | low         | Real duplication of the black and white sources, against project-context's "never hardcode". The fix is a direct substitution that keeps every value identical                                                                                           | patch (A)    |
| 2   | PC    | `ScannerOverlay.tsx:501`                                     | An Open Settings failure goes to `logger.warn`, a no-op in release                                                   | low         | `core/utils/logger.ts:10,99` gates `warn` on `__DEV__`, so the matrix's "logged" leaves no trace in production. The fix is one call                                                                                                                      | patch (B)    |
| 3   | PC    | `BrandList.tsx:90`                                           | A plain `ScrollView` mounts all 63 rows                                                                              | maybe-false | True that all rows mount. Whether any user feels it is open: it showed no lag on the simulator and was never profiled on a low-end Android                                                                                                               | defer (N)    |
| 4   | PC    | `CardTypeSelectionScreen.tsx:27-28`                          | UI imports from `features/cards` break the layer rule                                                                | low         | The enforced boundary allows add-card to import cards (`eslint.config.mjs:213-217`), and `BrandPill` already imported cards UI. Only a refactor of those components would meet it, and moving them to `shared/` is #258 item 11's work, not a direct fix | reject       |
| 5   | VG    | `ScannerOverlay.test.tsx` (refused block)                    | The refused state is never tested with the real hook's denial output, which carries an error                         | medium      | Pre-verified gap: the hook sets `error` on every denial (`useBarcodeScanner.ts:184`), and a guard mutation passed all 159 tests                                                                                                                          | patch (C)    |
| 6   | VG    | `ScannerOverlay.tsx:690`, `MultiCodePickerSheet.tsx:123-135` | The shipped labels of `scan-from-image-row` and `multi-code-cancel` are unpinned                                     | medium      | Pre-verified gap: removing both labels passed every add-card suite. The frozen block keeps the labels of controls that survive                                                                                                                           | patch (D)    |
| 7   | VG    | `ScannerOverlay.tsx:464`                                     | The picker opened from a failed request clears its error, leaving the pending state stuck                            | low         | Real, but only after `requestPermission()` throws, which the OS practically never does. A mount error is held separately and is unaffected. The fix adds overlay state                                                                                   | reject       |
| 8   | VG    | `SearchBar.tsx:92`                                           | The brand search lost `accessibilityRole="search"`                                                                   | low         | Real: the deleted `BrandSearchBar` set it, and nothing does now. Screen-reader users meet it on every visit. The fix is one prop                                                                                                                         | patch (E)    |
| 9   | BH    | `ScannerOverlay.tsx:606`                                     | `onBarcodeScanned` still toggles on `hasScanned`, rebinding Android's camera per scan                                | maybe-false | The toggle is on `main` unchanged, so it predates this story. Whether the rebind shows needs an Android device                                                                                                                                           | defer (O)    |
| 10  | BH    | `MultiCodePickerSheet.tsx:173`                               | `scrollEnabled` only past four rows strands rows that grow under large text                                          | medium      | Rows are now `minHeight` 64 and the value wraps, while `BottomSheet` caps the sheet at 80 %. At accessibility sizes three rows overflow a list that cannot scroll                                                                                        | patch (F)    |
| 11  | BH    | `SearchBar.tsx:92`                                           | The brand search lost its search role                                                                                | low         | Same defect as row 8                                                                                                                                                                                                                                     | patch (E)    |
| 12  | BH    | `BrandPill.tsx:75`                                           | The white dot vanishes on a white brand's pill                                                                       | low         | 9 of 57 catalogue brands are `#FFFFFF`. On those the dot has no edge. The fix is the tile's own light-fill hairline                                                                                                                                      | patch (G)    |
| 13  | BH    | `ScannerOverlay.tsx:772`, `colors.ts:129`                    | Unshadowed cream row labels fail contrast over a bright scene                                                        | medium      | Real, but the shipped rows were white and equally unshadowed (about 2.85:1). Frame B keeps the rows unshadowed and cream (about 2.5:1). Adding a shadow or a plate is a design call                                                                      | defer (P)    |
| 14  | BH    | `NoCodeFoundBanner.tsx:218`                                  | Wrapped links' slops overlap, and a tap on the first can fire the second                                             | medium      | Real: `linkRow` wraps with `columnGap` only. The Italian pair needs about 311pt against 280pt on a 360dp phone, and the later sibling wins the hit test                                                                                                  | patch (H)    |
| 15  | BH    | `BrandListRow.tsx:138`, `BrandPill.tsx:79`                   | Inter initials depart from `monogram()` without a record                                                             | low         | Real drift risk: `typography.ts` prescribes `monogram()` for avatar initials. The frames draw Inter, and only the token is recorded                                                                                                                      | patch (I)    |
| 16  | BH    | `BrandList.tsx:90`                                           | The list is no longer virtualised                                                                                    | maybe-false | Same claim as row 3                                                                                                                                                                                                                                      | defer (N)    |
| 17  | BH    | `BrandList.tsx:90`                                           | "Other card" sits under the iOS keyboard while searching                                                             | medium      | Real, and pre-existing: the shipped `SectionList` had no keyboard handling either, and "Other card" was already RESULTS' last row. The return key dismisses the keyboard                                                                                 | defer (Q)    |
| 18  | BH    | `CardTypeSelectionScreen.tsx:42`                             | The header hard-codes `HeaderIconButton`'s private 24 / 1.5                                                          | low         | Only a change to the design system's own icon size would break it. The fix adds public exports to a cards component                                                                                                                                      | reject       |
| 19  | BH    | 7 files                                                      | `PRESSED_SCALE` and the `isPressed` pattern are duplicated                                                           | low         | `HeaderIconButton` and `Tile` already declare their own. A shared constant or component is new public surface for a fixed design-system value                                                                                                            | reject       |
| 20  | BH    | `BrandListRow.tsx`, `FloatingBackButton.tsx`                 | `BRAND_LIST_ROW_HEIGHT`, `BRAND_LIST_CIRCLE_SIZE` and `FloatingBackButtonAppearance` are exported but never imported | low         | Real dead exports. The fix is a direct deletion                                                                                                                                                                                                          | patch (J)    |
| 21  | BH    | `BrandList.tsx:98`                                           | The empty-section rule is untested                                                                                   | low         | Real: no test renders an empty `popularBrands`, and dropping the filter would pass. The fix is one test                                                                                                                                                  | patch (K)    |
| 22  | BH    | `BrandListRow.tsx`                                           | No co-located test, and an uncovered no-testID branch                                                                | low         | Its behaviour is covered through both callers. The convention places tests beside a subject and does not demand one per file. The branch only omits a testID                                                                                             | reject       |
| 23  | BH    | `NoCodeFoundBanner.tsx:173`, its test at `:285`              | The comment says no platform delivers a touch outside a view's parent                                                | low         | Inaccurate on the new architecture: an overflowing frame is hit-tested, and only slop beyond the parent is not. The banner's own × relies on the frame case. The fix is a reword                                                                         | patch (L)    |
| 24  | EC    | `ScannerOverlay.tsx:464`                                     | The picker over a failed-request error leaves the pending state stuck                                                | low         | Same as row 7                                                                                                                                                                                                                                            | reject       |
| 25  | EC    | `ScannerOverlay.tsx:464`                                     | The camera keeps scanning under setup, so a re-arm could push setup twice                                            | maybe-false | Pre-existing (#266 item 4). Whether iOS keeps the session running under a pushed native-stack screen needs a device                                                                                                                                      | defer (R)    |
| 26  | EC    | `ScannerOverlay.tsx:750-757`                                 | On a 640dp-tall screen with the QR box, the instruction draws over the first row                                     | medium      | Real: the bottom region rises above the absolute instruction there, and at every phone's largest text sizes. The plate-less rows let both lines show, as the step-3 device run recorded. The decision's "covers" is not met                              | patch (M)    |
| 27  | EC    | `NoCodeFoundBanner.tsx:218-226`                              | Wrapped links' slops overlap                                                                                         | medium      | Same as row 14                                                                                                                                                                                                                                           | patch (H)    |
| 28  | EC    | `ScannerOverlay.tsx:550-580`                                 | An image scan from the error state shows no spinner or banner                                                        | medium      | Pre-existing (#266 item 3)                                                                                                                                                                                                                               | defer (S)    |
| 29  | EC    | `ScannerOverlay.tsx:497-503`                                 | An Open Settings failure in release leaves no trace                                                                  | low         | Same as row 2                                                                                                                                                                                                                                            | patch (B)    |
| 30  | EC    | `ScannerOverlay.tsx:505-510`                                 | Android never re-reads the permission after Settings                                                                 | medium      | Pre-existing (#266 item 1)                                                                                                                                                                                                                               | defer (T)    |
| 31  | EC    | `ScannerOverlay.tsx:572-576`                                 | Retry does not reset the once-per-mount report flag                                                                  | false       | The flag belongs to the overlay's mount, which Retry does not end, so reporting once matches its comment. The behaviour is unchanged from `main`                                                                                                         | reject       |
| 32  | EC    | `BrandPill.tsx:71-77`                                        | The white dot disappears on a light brand                                                                            | low         | Same as row 12                                                                                                                                                                                                                                           | patch (G)    |
| 33  | EC    | `BrandRow.tsx:32`                                            | A three-digit catalogue hex gives NaN luminance                                                                      | low         | The schema allows it, but all 57 shipped colours have six digits. The helper is the wallet tile's own, unchanged. The fix branches a shared helper                                                                                                       | reject       |
| 34  | EC    | `MultiCodePickerSheet.tsx:86-89`                             | Cutting at 28 code units can split a surrogate pair                                                                  | low         | Real, and pre-existing: `main` cut the same way                                                                                                                                                                                                          | defer (U)    |
| 35  | EC    | deleted `BrandSearchBar.tsx:58`                              | The brand field lost its search role                                                                                 | low         | Same as row 8                                                                                                                                                                                                                                            | patch (E)    |
| 36  | EC    | `NoCodeFoundBanner.tsx:119,218-226`                          | Frame E's "both links reach 48pt targets" fails for a wrapped link or a short label                                  | low         | The wrapped case is row 14's overlap. Separately, the slop is vertical only, and Italian "Riprova" is about 46pt wide                                                                                                                                    | patch (H, V) |

**Groups.** Patches A to M and V go to the step-3 subagent. Deferrals N to U go to `deferred-work.md`
and to Found, not fixed.

## Design Notes

The sources are silent or conflict on everything below, so it is decided here. Measurements are
in pt.

**Frame A.**

- **Header.** 48 tall, with no rule. `HeaderIconButton` holds Lucide `chevron-left` in
  `textPrimary`, its drawn stroke starting on the 24pt margin. The title "Add Card" is
  `bodyLgStrong`, centred, and a 48 spacer on the right keeps it centred.
- **Search.** The field sits 16 below the header, pinned; only the list scrolls. It is announced as
  a search field: `accessibilityRole="search"` on `SearchBar`'s input, for both of its screens
  (review row 8).
- **Sections.**
  - Each `SectionHeader` sits 24 below the field or the surface above it, and 8 above its own
    rows.
  - Each section is one `Surface divided`. The untitled "Other card" section goes, and its row
    becomes the last row of ALL CARDS.
  - RESULTS is one surface too. The "No cards found" and "Showing results…" lines keep their copy,
    on the 24pt margin.
- **Rows.** 64 tall, padding 0 16, gap 16. Left to right:
  - a 40 circle in the brand's hex, holding its initial in `bodyMdStrong`, coloured by
    `getContrastForeground`. The circle takes a 1pt `theme.border` when `getTileAppearance` says
    `isLight`, or `isNearBlack` in dark: the tile's rule;
  - the name in `bodyLg` `textPrimary`. It sits on one line at default sizes, and wraps rather
    than clipping under large text (the frozen Large-text row; QA round 2);
  - Lucide `chevron-right` at 24/1.5 in `textSecondary`. That is the size of every other row
    chevron in the app, not the frame's drawn 9 × 16.
- **Other card.** The same row. Its circle is `theme.background` with a 1pt `theme.border`,
  holding a "+" in `bodyMdStrong` `textPrimary`. The label is `bodyLg`, with the subtitle beneath
  it in `captionMd` `textSecondary`.
- **Bottom.** The list's content ends 24 above the bottom inset.

**Frame B.**

- **Ground.** `CAMERA_OVERLAY.ground` runs under both insets, with a flat `scrim` and no cut-out.
  While the screen is focused, it renders `<StatusBar style="light" />`.
- **Back.** A 40 disc in `scrim`, holding a cream Lucide `chevron-left` at 24/1.5. It is centred in
  a 48 target, so the disc's corner sits at the left inset + 24 and the top inset + 8.
- **Pill.**
  - Its top is at the top inset + 8 + 40 + 16. It is filled with the brand's hex, with padding
    6 / 12 / 6 / 6 and a gap of 8.
  - It holds a 24 white dot carrying the initial in `labelBold` ink, then the name in
    `bodyMdStrong`, coloured by `getContrastForeground`.
  - On a light brand (`getTileAppearance(...).isLight`) the dot takes a 1pt hairline in the light
    scheme's border, `LIGHT_THEME_COLORS.border`: the tile's rule (review row 12).
  - It draws no logo. A custom card has no pill.
- **Viewfinder.** The geometry is unchanged. The box is centred on the whole screen.
- **Instruction.** It is absolute, so it no longer shifts the box. Its top sits 64 below the box's
  bottom edge, as frame B places it to clear the card being scanned. It is set in `bodyMdStrong`
  cream, because Inter 500 is not bundled, with the shadow 0 / 1 / 3 at `textShadow`.
  - Once the bottom region overlaps the instruction's glyphs, the instruction hides: opacity 0, and
    hidden from screen readers.
  - Overlapping only the empty leading beneath the glyphs does not count: `(lineHeight - fontSize)
/ 2` of `bodyMdStrong`, scaled by `PixelRatio.getFontScale()` (device check, 2026-10-13).
  - It stays laid out while hidden, so its measurement stays live (review row 26).
- **Reduce Motion.** Reanimated's `useReducedMotion`, which is read once at start-up, stops the
  beam at 46/120 of the box's height.
- **Rows.**
  - At least 48 tall, growing with their labels, which wrap rather than clip. They keep the shipped
    divider and padding.
  - Each row has Lucide `image` or `keyboard` plus `chevron-right`, all at 24/1.5.
  - Labels are `bodyLgStrong`, with no shadow, as the frame has it. Everything is cream.
- **Bottom region** (Decided, 2026-10-13). The banner and the rows share one container at the
  bottom. It stays in flow, as the overlay's only in-flow child, and is never `position: absolute`.
  - The banner, while it shows, sits 16 above the rows. It no longer waits for a measurement.
  - The region grows with the text. Once it would come within 16 of the brand pill's bottom, it
    scrolls instead. With no pill, the limit is the back disc's bottom.
  - At default sizes it draws exactly as before.
  - The banner keeps its 24 margins, and the rows their 24 padding.
  - `no-code-found-banner-anchor` stays on the banner's wrapper, and `scanner-bottom-actions` on
    the rows' stack.
  - Story 16.30's tests change accordingly. "Measured offset" and "hidden until measured" are
    replaced by its acceptance criterion 4's structural invariant: one container, the banner
    first, 16 apart.
- **Pending.** Permission `null` or `undetermined` draws this frame with no `CameraView`. The
  camera mounts only once permission is `granted`, so a native session never starts before the
  user answers.
- **Processing.** A cream spinner, with "Scanning image…" in `bodyMdStrong` cream with the shadow.

**Frame C** (`status === 'denied'`) **and the camera-error state.**

- **Ground and back.** The scheme's ground, with no status-bar override. The disc is `surface` with
  a 1pt `border` and a `textPrimary` chevron, in the same place as frame B's.
- **Content.** Centred between the top inset and the footer:
  - Lucide `camera-off` at 48, drawn with a 2pt stroke, in `textSecondary`;
  - 16 below it, the title in `headlineSm` `textPrimary`;
  - 8 below that, the body in `bodyMd` `textSecondary`, centred.
- **Footer.** The actions sit in `PrimaryActionFooter`, as the design system requires of every
  screen with a primary action, and as the wallet's empty state does. Frame C's centred 52pt pair
  is overruled.
  - Frame C: "Open Settings" as the primary at `large`, then "Enter card number manually" as the
    secondary.
  - The error state keeps its shipped buttons and roles: "Scan from image" (primary `large`, when
    offered), then Retry, then manual entry.
- **Open Settings.** `Linking.openSettings()` is awaited inside a try/catch.
  - A failure goes to `logger.notify` with bounded tags and no message text, because `logger.warn`
    is a no-op in release (review row 2).
- **The error body.** It is always the localised `addCard.scanner.cameraStartError`. The native
  message stays with the classifier.

**Frame D.**

- **The shared sheet, as it is.** The frame's centred title, its 12 / 4 / 20 spacing and its flat
  60 % black scrim yield to the design system's sheet, which `BottomSheet` already draws.
- **Behind the sheet.** The viewfinder, beam and instruction hide, and scanning pauses. The back
  disc and the pill stay.
- **Rows.** 64 tall, edge to edge, with a rule under each and a 0.98 press. Left to right:
  - Lucide `barcode`, or `qr-code` for a QR, at 24/1.5 in `textPrimary`. The frame's miniature is
    decoration, and a drawn strip that is not the code would be a fake barcode;
  - after a gap of 16, the value in `monoCode` `textPrimary`, exactly as decoded and truncated as
    today;
  - the format beneath it in `captionMd` `textSecondary`;
  - nothing at the right.
- **Scrolling.** The list always scrolls, with no bounce at rest, because the rows grow with the
  text (review row 10).
- **Names.** Format names come from a `Record` over `BarcodeFormat`, with no English fallback.
- **Cancel.** Centred plain `bodyLg` `textPrimary` on a 48 row.

**Frame E.**

- **Plate.** `plate`, radius 12, padding 16, 24 margins, and no icon.
- **Message.** `bodyMd` in cream.
- **Dismiss.** The × is Lucide `x` at 18 in `dismiss`, on its own 48 target.
- **Links.** `captionMd` in beam, 8 below the message and 16 apart. Each reaches 48 tall through
  `hitSlop`, without growing the plate.
  - Each is at least 48 wide.
  - When they wrap, a row gap of twice the slop keeps their targets apart (review rows 14 and 36).

**`CAMERA_OVERLAY`**, each value derived from `NEUTRAL_COLORS` or `IDENTITY_COLORS` through
`toRgbChannels`. The values are unchanged (review row 1):

| role         | value                       |
| ------------ | --------------------------- |
| `ground`     | `#000000`                   |
| `scrim`      | `rgba(0, 0, 0, 0.4)`        |
| `plate`      | `rgba(0, 0, 0, 0.8)`        |
| `text`       | `IDENTITY_COLORS.cream`     |
| `mark`       | `#FFFFFF`                   |
| `divider`    | `rgba(255, 255, 255, 0.25)` |
| `dismiss`    | `rgba(255, 255, 255, 0.6)`  |
| `textShadow` | `rgba(0, 0, 0, 0.75)`       |

**Known limits.**

- On a 667pt-tall phone with the square viewfinder, the instruction ends within a few points of
  the action rows. The banner covers it for its five seconds (#251 item 12).
- At the largest text sizes the bottom region rises over the viewfinder, and the instruction hides
  beneath it. The camera still reads the whole frame.

**Record** a `### Capture` section in `cardi-design-system.md`, headed "**RULED 2026-10-12 (Story
22.5)**, from `frames/cardi-capture-frames.html` and `stitch-prompts-capture.txt`". It holds:

- every ruling above;
- an amendment to _Elevation_'s "No drop shadows anywhere": the feed's text shadow is the one
  exception;
- a clarification of _Forbidden_'s "a drawn beam or scan-line": it means over a displayed code;
- the initials' departure from `monogram()`: frame A's circles and frame B's dot draw Inter, as the
  frames do. This is noted in the record and beside `monogram` in `shared/theme/typography.ts`
  (review row 15);
- an update to _Icons_: capture has moved, except `InlineScanButton`, which setup keeps until 22.6,
  and `ActionRow`'s chevron is no longer shared with add-card.

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors.
- `yarn lint` -- expected: no errors, no warnings.
- `yarn format:check` -- expected: clean, untracked docs included.
- `yarn test` -- expected: all suites green.

**Manual checks:**

- **iOS simulator, 393pt, light and dark.** Check:
  - frame A, typing a query, and no results;
  - frame B for an EAN-13 brand, a QR brand and a custom card, plus the beam under Reduce Motion;
  - frame C: deny on a fresh simulator, or override the permission hook's state over Metro's
    debugger;
  - frame D: add a generated image holding two or more codes with `xcrun simctl addmedia`, then use
    Scan from image;
  - frame E: an image holding no code.
- **Unchecked here:**
  - Android, for which this host has no emulator;
  - live camera scanning, because the simulator has no camera;
  - the instant before the system prompt on a real first run.

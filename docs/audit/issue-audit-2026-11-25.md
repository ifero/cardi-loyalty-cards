# Open-Issue Audit — 2026-11-25

**Repository:** `ifero/cardi-loyalty-cards` · **Audited at:** `4bbfcbd1cd08640a3a80b08f6614744ee6cb8aac` (`main`, 2026-11-25)
**Scope:** every open GitHub issue that is not a pull request, checked against the working tree, the
test suite, the docs and the full git history.

## Method and limits

- Issues were read through the public REST API (`GET /repos/ifero/cardi-loyalty-cards/issues?state=open&per_page=100`),
  because `gh` is not authenticated on this machine. No issue was created, edited, closed or commented on.
- Every issue body cites `file:line` pointers. Each pointer was opened and its **current** content read;
  a pointer that no longer resolves is reported as such rather than assumed.
- Where the history was decisive, the commit is named (`git log -S`, `git log --all --grep`).
- **Limits.** `node_modules/` is not installed on this machine, so nothing that needs the dependency tree
  (Expo's generated `expo/types`, `expo-camera`'s Swift, React Native's `Modal.js`) could be executed.
  Those items are marked **UNVERIFIABLE** and the reason is stated. `yarn typecheck`, `yarn test` and
  `yarn lint` could not be run for the same reason.
- The tracker (`docs/sprint-artifacts/sprint-status.yaml`) is the authoritative source of story status;
  `docs/epics.md` is the human-readable catalogue. `node scripts/check-story-catalogue-sync.mjs` passes at
  the audited commit (216 ↔ 216), so both sides are in sync today.

## Summary

| # | Title | Created | Category |
| - | ----- | ------- | -------- |
| [#45](#issue-45) | chore(watch): follow-ups for Story 5.4 — EAN/UPC renderer & in-flight barcode-generation dedupe | 2026-02-14 | **STILL VALID** (mixed; 1 of 2 items closed) |
| [#248](#issue-248) | chore(theme): follow-ups for Story 21.6 — brand typefaces | 2026-09-26 | **STILL VALID** (mixed; 2 of 14 items closed) |
| [#251](#issue-251) | chore(ui): follow-ups for Story 22.1 — design-system components | 2026-09-28 | **STILL VALID** (mixed; 7 of 15 items closed) |
| [#253](#issue-253) | chore(release): follow-ups for Story 21.7 — the single rebrand release | 2026-09-29 | **STILL VALID** (6 of 6 items open) |
| [#258](#issue-258) | chore(cards): follow-ups for 22-2-wallet — the wallet redesign | 2026-10-06 | **STILL VALID** (mixed; 1 of 13 items closed) |
| [#266](#issue-266) | chore(add-card): follow-ups for 22-5-capture — the capture redesign | 2026-10-12 | **STILL VALID** (mixed; 1 of 15 items closed) |
| [#268](#issue-268) | chore(ui): follow-ups for 22-6-the-form-pattern — the form pattern | 2026-10-15 | **STILL VALID** (mixed; 1 of 20 items closed) |
| [#271](#issue-271) | chore(settings): follow-ups for 22-7-settings — the settings screen and its sheets | 2026-10-17 | **STILL VALID** (mixed; 1 of 20 items closed) |
| [#273](#issue-273) | chore(ui): follow-ups for 22-8-document-screens — help, the privacy policy and What We Collect | 2026-10-20 | **STILL VALID** (mixed; 2 of 23 items closed) |
| [#275](#issue-275) | chore(auth): follow-ups for 22-9-authentication — consent, recovery stack and copy fit | 2026-10-22 | **STILL VALID** (26 of 26 items open) |
| [#281](#issue-281) | chore(onboarding): follow-ups for 22-10-onboarding — accessibility, shared sheet and release notes | 2026-10-27 | **STILL VALID** (14 of 14 items open) |
| [#284](#issue-284) | chore(watch): follow-ups for 23-2-watchos-implementation — crown paging, watch UI tests and stale docs | 2026-10-27 | **STILL VALID** (mixed; 1 of 11 items closed) |
| [#294](#issue-294) | chore(store): follow-ups for 24-2-store-platform-requirements — privacy manifest build checks | 2026-11-07 | **STILL VALID** (3 of 3 items open) |
| [#298](#issue-298) | chore(deps): follow-ups for 24-4-android-screens-crash-fix — OTA runtime, install exclude, Sentry noise | 2026-11-08 | **STILL VALID** (5 of 5 items open) |
| [#303](#issue-303) | chore(wear): follow-ups for 16-38-wear-os-barcode-uses-the-whole-screen — barcode edge cases | 2026-11-09 | **STILL VALID** (2 of 2 items open) |
| [#310](#issue-310) | chore(sync): follow-ups for 16-45-signout-keep-or-erase-cards — in-flight sync can restore erased cards | 2026-11-25 | **STILL VALID** (1 of 1 items open) |
| [#311](#issue-311) | chore(sync): follow-ups for 16-45-signout-keep-or-erase-cards — pending deletions survive sign-out | 2026-11-25 | **STILL VALID** (1 of 1 items open) |
| [#312](#issue-312) | chore(tooling): follow-ups for 16-45-signout-keep-or-erase-cards — typecheck fails after expo start | 2026-11-25 | **STILL VALID** (1 of 1 items open) |
| [#313](#issue-313) | chore(design): follow-ups for 16-45-signout-keep-or-erase-cards — sign-out sheet frames | 2026-11-25 | **STILL VALID** (1 of 1 items open) |

### Counts

| Category | Issues |
| -------- | ------ |
| **ANCORA VALIDA** (still valid — needs a spec) | 19 — #45, #248, #251, #253, #258, #266, #268, #271, #273, #275, #281, #284, #294, #298, #303, #310, #311, #312, #313 |
| **GIÀ IMPLEMENTATA** (fully superseded by shipped work) | 0 as a whole issue |
| **OBSOLETA** (no longer meaningful) | 0 as a whole issue |

**Reading the counts.** No issue is entirely obsolete, and none is entirely implemented. All 19 are
backlog-style "Found, not fixed" lists whose *individual items* have a mixed fate: a later story or a
later commit closed some items and left the rest standing. The per-item verdict is what matters, and
it is recorded below for every numbered item in every issue (193 items checked).

Per-item tallies:

| | #45 | #248 | #251 | #253 | #258 | #266 | #268 | #271 | #273 | #275 | #281 | #284 | #294 | #298 | #303 | #310 | #311 | #312 | #313 |
| - | -- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Closed | 1 | 2 | 7 | 0 | 1 | 1 | 1 | 1 | 2 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Open | 1 | 10 | 7 | 6 | 12 | 14 | 19 | 19 | 21 | 26 | 14 | 10 | 3 | 5 | 2 | 1 | 1 | 1 | 1 |
| Accepted / informational | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Unverifiable | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Totals: **17 closed, 173 open, 2 accepted, 1 unverifiable -- 193 items checked.**
(#284 item 12 is the "no action needed" row of that issue's list -- *"Items 5 and 8 in the story's list need
nothing"* -- and is recorded in the prose rather than as a table row.)

### A note on the issue count

The task brief said "20 issues out of 30 open, the other 10 being dependabot PRs". The public API
returns **30 open entries: 19 issues and 11 pull requests** (one extra PR, `#203 chore(ci): fail PRs
whose title or body carries a CI-skip marker`, which is not dependabot). All 19 issues are audited.

---

## Per-issue evidence

### Issue #45

`chore(watch): follow-ups for Story 5.4 — EAN/UPC renderer & in-flight barcode-generation dedupe` ·
2026-02-14 · labels `enhancement, watch, backlog` · source: Story 5.4 (`docs/sprint-artifacts/stories/5-4-display-barcode-on-watch.md`, tracker `5-4-display-barcode-on-watch: done`)

**Item 1 — EAN/UPC/CODE39 renderers: GIÀ IMPLEMENTATA.**
`targets/watch/BarcodeGenerator.swift:160-164` dispatches per symbology
(`case .EAN13: return encodeEAN13(...)`, `case .EAN8`, `case .UPCA`, `case .CODE39: return encodeCode39(...)`),
and `:51` records *"v3: EAN-8, UPC-A and Code39 stopped rendering as Code128 (Story 16.28)"*. The encoders
exist as `encodeEAN8` (`:301`), `encodeUPCA` (`:331`), `encodeCode39`. Reference-symbol tests exist:
`watch-ios/Tests/BarcodeGeneratorTests.swift:120 test_encodeEAN8_matchesReferenceSymbols`,
`:135 test_encodeUPCA_matchesReferenceSymbols`, `:153 test_encodeCode39_matchesReferenceSymbols`, plus
`:273 test_everyLinearFormatHasItsOwnEncoder`. Shipped by `9f52e66 fix(watch): render EAN-8, UPC-A and
Code39 in their real symbologies (#212)` (Story 16.28, tracker `16-28-…: done`).

**Item 2 — in-flight dedupe of `generateImage`: ANCORA VALIDA.**
`targets/watch/BarcodeGenerator.swift:80-124` — `generateImage` checks the `NSCache` (`:90`), renders
and caches; **there is no map of ongoing tasks**. `git log --all -S "inFlight" -- targets/watch/ watch-ios/`
returns nothing. `git log --all -S "ongoing" -- targets/watch/BarcodeGenerator.swift` returns nothing.
The only dedupe in the watch tree is a *usage-event* dedupe (`targets/watch/WatchSessionManager.swift:29`,
`targets/watch/__tests__/watch-usage-event-contract.test.ts:12`), which is a different thing. The one
production caller is `targets/watch/BarcodeFlashView.swift:344`, inside a `.task(id: renderTaskID)`
(`:314`) that SwiftUI cancels on id change — so the *view* is protected, but two concurrent requests
for the same card are not deduplicated at the generator.

**Also stale in the issue body:** the cited paths `watch-ios/MyLoyaltyCardsWatch/BarcodeGenerator.swift`
and `watch-ios/MyLoyaltyCardsWatch/BarcodeFlashView.swift` no longer exist — the watch sources moved to
`targets/watch/` (commit `e775241 feat(11-6): remove watch-ios/, update all references…`). The test
folders the issue asks for do exist (`watch-ios/Tests/`, `watch-ios/UITests/`).

**Spec produced:** `docs/sprint-artifacts/stories/16-58-dedupe-concurrent-watch-barcode-generation.md` (item 2; item 1 is shipped).

---

### Issue #248

`chore(theme): follow-ups for Story 21.6 — brand typefaces` · 2026-09-26 · labels `backlog, needs-triage` ·
source: `docs/sprint-artifacts/stories/21-6-bundle-and-adopt-brand-typefaces.md`

| # | Item | Verdict | Evidence |
| - | ---- | ------- | -------- |
| 1 | SDK 55 patch train behind (22 packages) | **ANCORA VALIDA** | No CI job runs `npx expo install --check` (`.github/workflows/ci-quality-gates.yml` has no expo-doctor step). UNVERIFIABLE whether the count is still 22 — `node_modules/` is absent, so `--check` cannot run. |
| 2 | `VirtualLogo`, `FormatPicker`, `CatalogueGrid` have no production consumer | **ANCORA VALIDA** | Each is referenced only by its own file plus the barrel `features/cards/index.ts:33,41` (+ `features/cards/components/CatalogueGrid.tsx`). `grep -rln` over `features/ shared/ app/ core/` (excluding tests) returns the barrel and the component itself for `VirtualLogo`/`FormatPicker`; for `CatalogueGrid` only `app/scan.tsx`'s doc comment mentions it. |
| 3 | `GuestModeBanner` optional-chains tokens with hard-coded fallbacks | **ANCORA VALIDA** | `features/auth/components/GuestModeBanner.tsx:23-26` — `spacing?.xs ?? 4`, `spacing?.sm ?? 8`, `spacing?.md ?? 16`, `touchTarget?.min ?? TOUCH_TARGET.min`. |
| 4 | Hard-coded English in `useAutoSync` and `useGuestMigration` | **ANCORA VALIDA** | `shared/hooks/useAutoSync.ts:76` `'Session expired. Changes will sync after sign-in.'`; `features/auth/useGuestMigration.ts:105` `'Your cards are being backed up…'`, `:112` `'Your cards are safe — backed up to the cloud ✓'`, `:123` `"Some cards couldn't be backed up. Tap to retry."`. |
| 5 | `docs/design/CONTRIBUTING-DESIGN.md` still names `SEMANTIC_COLORS` | **ANCORA VALIDA** | `docs/design/CONTRIBUTING-DESIGN.md:48` and `:92` both still say `SEMANTIC_COLORS`. |
| 6 | `display-lg` still `fontWeight: '800'`; no monospace `TextField` variant | **GIÀ IMPLEMENTATA (partly)** | `docs/design/cardi/cardi-design-system.md:48-52` now reads `fontWeight: '700'`, and `:335-338` records the amendment (*"The frontmatter said 800, but Space Grotesk's heaviest master is 700"*), applied in `0d79b94 feat(ui): design-system components (Story 22.1) (#252)`. The monospace variant **does** exist: `shared/components/ui/TextField.tsx` has `inputMono` (`:~278`) using `TYPOGRAPHY.monoCode`. |
| 7 | Onboarding sheet title 24 vs `TYPOGRAPHY.sheetTitle` 20 | **ANCORA VALIDA** | `shared/theme/typography.ts:93` — `sheetTitle: token(FONT_FAMILY.display, 20, 28, '700')`. The frame still draws 24; the app follows the token. |
| 8 | No licences screen for the bundled fonts | **ANCORA VALIDA** | `grep -rn "licence\|licenses\|OFL" features/ app/ shared/i18n/locales/en.ts` returns nothing. `features/settings/components/AboutSection.tsx` has no licence entry. |
| 9 | Android API 24-27 collapses custom weights | **ACCEPTED / INFORMATIONAL** | Recorded as an accepted platform limit by the issue itself; `minSdk` is Expo's 24. |
| 10 | Wallet sort row overflows and a wrapping `Button` label left-aligns at the largest text size | **ANCORA VALIDA** | `shared/components/ui/Button.tsx:169-176` renders the label `<Text style={{...TYPOGRAPHY.bodyLgStrong, color: …}}>` with **no `textAlign`** and no `numberOfLines`, so a wrapped label keeps the container's alignment. The wallet's count row is `features/cards/components/SortFilterRow.tsx:68-77` (`cardCountText` + sort button on one row). |
| 11 | Changing text size at runtime clips text to slivers | **ACCEPTED / INFORMATIONAL** | React Native Fabric behaviour; the issue records `main` behaves the same. |
| 12 | Typefaces never run on an Android device | **ANCORA VALIDA** | No device pass is recorded in the tracker for 21-6 (`21-6-bundle-and-adopt-brand-typefaces: done`, comment records the verification scope as the *generated project*, not a device). It is also 21.7's release gate; 21-7 is `done` with its AC8 device table still at "not yet performed". |
| 13 | `VerifyEmailScreen.test.tsx` depends on its test order | **ANCORA VALIDA** | `features/auth/VerifyEmailScreen.test.tsx:915` carries the comment *"Fake timers last: a fake-timer test early in a file can stall the async tests after it."* The `describe('the cooldown')` block at `:915` is last in the file and `jest.useFakeTimers()` is called at `:918` and `:962`. No warm-up render cures it. |
| 14 | Resend row reads "Resend in 0:00" while a request is in flight | **GIÀ IMPLEMENTATA** | `features/auth/VerifyEmailScreen.tsx:547-549` now picks the label on `remainingSeconds > 0` **only** — not on `resendDisabled`, which included `loading`. `git log -p` on the file shows the change: `-  const resendDisabled = loading \|\| remainingSeconds > 0;` → `+  const isResendAvailable = !isRequestRunning && remainingSeconds === 0;`, and `- {resendDisabled ? t(config.copy.resendIn, …)}` → `+ remainingSeconds > 0 ? t(config.copy.resendIn, …)`. Landed in `2415551 feat(auth): redraw the six account screens on the Cardì frames (Story 22.9) (#276)`. |

**Spec produced:** `docs/sprint-artifacts/stories/16-49-triage-theme-followups.md` (items 1-5, 7, 8, 10, 12, 13).

---

### Issue #251

`chore(ui): follow-ups for Story 22.1 — design-system components` · 2026-09-28 · labels `backlog, needs-triage` ·
source: `docs/sprint-artifacts/stories/22-1-design-system-components.md`

| # | Item | Verdict | Evidence |
| - | ---- | ------- | -------- |
| 1 | `TextField` off the form frame (gap 6, padding 12, fill `surfaceElevated`) | **GIÀ IMPLEMENTATA** | `shared/components/ui/TextField.tsx:242-244` — `gap: SPACING.sm` with the comment *"The form frame's label-to-control gap (Story 22.6; it was 6, off the grid)."*; `:19` `INPUT_PADDING_X = SPACING.md` (16); `:198` fill is `theme.colors.backgroundSubtle` when disabled, else `theme.colors.surface`. |
| 2 | Settings sheets: 40pt icon above the title; Cancel above the destructive action | **ANCORA VALIDA (order only)** | `features/settings/components/SignOutSheet.tsx` has **no** icon (grep for `Icon\|size={40}` returns nothing) — that half is closed. The action order is still inverted: `:51` `signout-keep`, `:62` `signout-erase`, `:73` `signout-cancel` — Cancel **below** the destructive action, and `DeleteAccountSheet.tsx:79,91` place the destructive action above `:102` `delete-cancel-step1`. The frames (`:1481-1495` of `docs/design/cardi/frames/cardi-settings-frames.html`) put the destructive action first. |
| 3 | `NoCodeFoundBanner` keeps a `warning-amber` icon; 16pt margins vs 24 | **GIÀ IMPLEMENTATA** | `features/add-card/components/NoCodeFoundBanner.tsx:6` — *"Story 22.5: Capture frame E's plate — no icon, 24pt margins, 48pt targets"*; `:22` imports `X` from `lucide-react-native/icons/x` (the clear ×), not a warning glyph; `:198` `marginHorizontal: LAYOUT.screenHorizontalMargin`. |
| 4 | `MultiCodePickerSheet` 56pt rows vs 64; Cancel in error red; English a11y labels | **GIÀ IMPLEMENTATA** | `features/add-card/components/MultiCodePickerSheet.tsx:37` — `const CODE_ROW_HEIGHT = 64;`; `:122` — *"Frame D's Cancel: plain centred text on a 48pt row"*; `:134` uses `t('addCard.multiCode.cancelAccessibilityLabel')`; `:97` uses `t('addCard.multiCode.codeAccessibilityLabel', …)`; `:138` colours the cancel text `theme.textPrimary`, not an error colour. |
| 5 | `ActionRow`'s outlined variant is radius 14 | **ANCORA VALIDA** | `shared/components/ui/ActionRow.tsx:200` — `borderRadius: 14` in the `outlined` style, against the design system's 12/16. |
| 6 | `BarcodeScanner` has no production consumer | **ANCORA VALIDA** | `features/cards/index.ts:32` re-exports it; the only other hits are its own file and `features/cards/hooks/useBarcodeScanner.ts` (a different symbol). `ScannerOverlay` is what the app renders. |
| 7 | A favourite is not announced to screen readers | **GIÀ IMPLEMENTATA** | `features/cards/components/CardTile.tsx:199-203` — `card.isFavorite ? t('cards.home.cardTileFavouriteAccessibilityLabel', { name: card.name }) : card.name`. |
| 8 | `Button` no longer reads `theme.onError`; the token is still live | **ANCORA VALIDA (informational)** | `shared/components/SyncErrorBanner.tsx:75` — `style={[styles.retryLabel, { color: theme.onError }]}`; `features/auth/MigrationBanner.tsx:90` — `testID="migration-retry-label"` with the colour supplied at the call site. The issue itself labels this "Recorded, no action expected". |
| 9 | Stale test fixtures mock the retired `TOUCH_TARGET: { min: 44, recommended: 48 }` | **ANCORA VALIDA** | `shared/components/SyncStatusContainer.test.tsx:34`, `shared/components/SyncErrorBanner.test.tsx:19`, `shared/components/ConflictResolutionModal.test.tsx:59` — all still mock `{ min: 44, recommended: 48 }`, while `shared/theme/tokens.generated.ts:83` is `export const TOUCH_TARGET = { min: 48 } as const;` — the `recommended` key does not exist. |
| 10 | `yarn storybook` (dev mode) cannot load any story | **UNVERIFIABLE / LIKELY CLOSED** | `.storybook/main.ts:105-110` now explicitly *"Keep `expo-modules-core` out of dep pre-bundling so it is served through…"* and `:83-96` stubs its TypeScript declarations — both are the fix the issue describes. UNVERIFIABLE: `node_modules/` is absent, so `yarn storybook` cannot be run here. |
| 11 | `CardSetupScreen` passes `disabled={isLoading}` alongside `loading` | **GIÀ IMPLEMENTATA** | `features/add-card/screens/CardSetupScreen.tsx:220` — `busy: isLoading`; no `disabled` prop on the action. The comment in `shared/components/ui/Button.test.tsx:157` still names `CardSetupScreen`, which is now stale (see #268 item 13). |
| 12 | Scan banner covers the viewfinder's instruction line on a 667pt screen | **ANCORA VALIDA (informational)** | The issue records this as designed. `features/add-card/components/ScannerOverlay.tsx` keeps the banner inside the bottom region, whose `zIndex: 10` (`:770`) is below the processing overlay's `zIndex: 20` (`:844`). |
| 13 | `BarcodeFlash.tsx` still calls `runOnJS` | **GIÀ IMPLEMENTATA** | `features/cards/components/BarcodeFlash.tsx:31` — `import { scheduleOnRN } from 'react-native-worklets';`, used at `:178`, `:188`, `:224`. No `runOnJS` remains. |
| 14 | Storybook's story canvas is only as tall as its content | **ANCORA VALIDA** | `.storybook/StoryDecorator.tsx:27` — `<View testID="story-canvas" style={{ flex: 1, padding: 16, backgroundColor: theme.background }}>`. `flex: 1` fills the canvas, so the *sheet* stories are the short ones; `git log -- .storybook/StoryDecorator.tsx` shows the file last changed in `8679b35 feat(storybook): add web component gallery… (#146)` — unchanged since. |
| 15 | `highlightCardId` is never cleared | **GIÀ IMPLEMENTATA** | `features/cards/screens/HomeScreen.tsx:96` — `setHighlightCardId(null);` in `handleHighlightEnd`, wired at `:112` — `onHighlightEnd={handleHighlightEnd}`. |

**Spec produced:** `docs/sprint-artifacts/stories/16-50-triage-design-system-followups.md` (items 2, 5, 6, 9, 14).

---

### Issue #253

`chore(release): follow-ups for Story 21.7 — the single rebrand release` · 2026-09-29 · labels `backlog, needs-triage` ·
source: `docs/sprint-artifacts/stories/21-7-single-rebrand-release.md`

| # | Item | Verdict | Evidence |
| - | ---- | ------- | -------- |
| 1 | The shipped binary is never the tested one | **ANCORA VALIDA** | `.github/workflows/store-upload.yml:86` — `ref: ${{ github.event.inputs.tag \|\| github.ref }}` — the workflow checks out the tagged commit and rebuilds. No "promote the verified build" path exists (no artifact download / no `gh release upload` of a previously built binary; grep for `promote\|download-artifact` returns nothing). |
| 2 | No staged rollout on Play | **ANCORA VALIDA** | `fastlane/Fastfile:773` — `ship_android!(track: "production", release_status: "completed", upload: true)`; the `upload_to_play_store` call inside `ship_android!` (`:738-741`) passes no `rollout` (grep for `rollout` in the Fastfile returns **0** occurrences). |
| 3 | The App Store half cannot be dry-run | **ANCORA VALIDA** | `grep -c verify_only fastlane/Fastfile` → **0**. The App Store path (`Fastfile:206 upload_to_app_store(...)`) has no `verify_only`; the only dry-run switch is the workflow-level `dry_run` input, which skips the upload entirely (`:195-200`). |
| 4 | `docs/epics.md:3821` says the in-app mark's stem is `currentColor` | **ANCORA VALIDA** | The line moved with the file's growth: `docs/epics.md:3855` still reads *"The in-app mark draws its stem in `currentColor` so one asset serves a cream surface and an ink one"*, and `:4296` still asks for its device check. No shipped SVG uses `currentColor` (`grep -rn currentColor assets/images/*.svg` → 0 hits). |
| 5 | `docs/epics.md:4208-4215` still requires `expo.version` to be bumped | **ANCORA VALIDA** | `docs/epics.md:4278` — *"⛔ **`expo.version` is bumped and the release tag is named.**"* ifero overruled this on 2026-09-29 and the release ships as `1.0.0`; `app.json:5` is still `"version": "1.0.0"`. |
| 6 | `docs/style.css` still carries the pre-rebrand `#1a73e8` / `#16a34a` | **ANCORA VALIDA** | `docs/style.css:3` — `--color-primary: #1a73e8;`, `:4` `--color-primary-strong: #1967d2;`, `:14` `--color-accent: #16a34a;`, `:41` `--color-primary-strong: #1a73e8;`. This is still the live stylesheet: `docs/index.html:18` and `docs/privacy-policy.html:11` both `<link rel="stylesheet" href="style.css" />`. Story 18.9 (`7d6a0dd`) migrated the site to cardiapp.eu but left the palette alone — `git log -- docs/style.css` shows only `4f7b0c1` and `da43fab` since. |

**Spec produced:** `docs/sprint-artifacts/stories/16-51-triage-release-followups.md`.

---

### Issue #258

`chore(cards): follow-ups for 22-2-wallet — the wallet redesign` · 2026-10-06 · labels `backlog, needs-triage` ·
source: `docs/sprint-artifacts/stories/22-2-wallet.md`

| # | Item | Verdict | Evidence |
| - | ---- | ------- | -------- |
| 1 | Home and `CardList` each call `useCards()` | **ANCORA VALIDA** | `features/cards/screens/HomeScreen.tsx:27` — `const { cards } = useCards();`; `features/cards/components/CardList.tsx:90` — `const { cards, isLoading, error, refetch } = useCards();`. |
| 2 | The offline strip can never show on Home | **ANCORA VALIDA** | `features/cards/screens/HomeScreen.tsx:107` — `pendingChangeCount={0}`; `shared/components/SyncStatusContainer.tsx:37` — `if (isOffline && pendingChangeCount > 0) return 'offline';` |
| 3 | Hard-coded English in the wallet's banners | **ANCORA VALIDA** | `shared/hooks/useCloudSync.ts:29` — `const GENERIC_SYNC_ERROR = 'Cloud sync failed. Pull to retry.';`; `shared/hooks/useAutoSync.ts:17` — `const MAX_RETRIES_EXCEEDED_MESSAGE = 'Sync failed. Changes saved locally.';`, `:76` `'Session expired. Changes will sync after sign-in.'`; `features/cards/hooks/useCards.ts:55` — `'Failed to load cards'`; `features/auth/useGuestMigration.ts:105,112,123`. |
| 4 | `MigrationBanner`'s Retry and dismiss are under the 48pt touch target | **ANCORA VALIDA** | `features/auth/MigrationBanner.tsx:129-134` — `retryButton: { marginLeft: 16, borderRadius: 6, paddingHorizontal: 24, paddingVertical: 8 }` (a ~28pt-tall target); `:140-143` — `dismissButton: { marginLeft: 16, paddingHorizontal: 8 }` with no vertical padding at all. The token is `TOUCH_TARGET.min = 48` (`shared/theme/tokens.generated.ts:83`). |
| 5 | The wallet's load-error state prints the raw error and offers no pull-to-refresh | **ANCORA VALIDA** | `features/cards/components/CardList.tsx:184-190` — the `error` branch renders `<Text>{error}</Text>` in a plain `View`; the `refreshControl` is attached to the empty/single/list branches, not to this one. |
| 6 | Sort preference and guest-banner dismissal live in AsyncStorage, not `expo-sqlite/kv-store` | **ANCORA VALIDA** | `features/cards/hooks/useCardSort.ts:9,84,97` — `import AsyncStorage from '@react-native-async-storage/async-storage'`; `features/auth/components/GuestModeBanner.tsx:2,34,55` — same. The repo does use kv-store elsewhere (`features/settings/settings-repository.ts`, `core/privacy/consent-repository.ts`). |
| 7 | `it.ts` "verra" lacks its accent; `useCards` is a `function` declaration | **ANCORA VALIDA** | `shared/i18n/locales/it.ts:315` — `message_one: 'Offline • {{count}} modifica verra sincronizzata quando torni online'` (no accent). `features/cards/hooks/useCards.ts:35` — `export function useCards(): UseCardsResult {` (against AGENTS.md's arrow-function rule). |
| 8 | Adding a card stacks a duplicate Home | **ANCORA VALIDA** | `features/cards/hooks/useAddCard.ts:93-96` — `router.replace({ pathname: '/', params: { newCardId: card.id, newCardName: card.name } });` |
| 9 | The shared Reanimated mock's `useSharedValue` returns a new object each render | **GIÀ IMPLEMENTATA** | `jest.setup.js:360` — `const useSharedValue = (initial) => mockReact.useState(() => makeMutable(initial))[0];` with the comment *"…`useSharedValue` keeps ONE for the life of the component, as the real hook does — an effect that lists a shared value must not re-run on every render."* |
| 10 | The just-added ring can play unseen | **ANCORA VALIDA** | `features/cards/components/CardList.tsx:238-250` — the `FlashList` has no `onViewableItemsChanged` / `viewabilityConfig`; the highlight is driven by `highlighted={cards[0]!.id === highlightCardId}` (`CardList.tsx:207`) and `useCardSort.ts:39-51` sorts by frequency first, so a new card lands below every used card. |
| 11 | The shared back button in the root `screenOptions` is a `Pressable` under `app/` | **ANCORA VALIDA** | `app/_layout.tsx:124-134` — `headerLeft: ({ canGoBack }) => canGoBack ? (<Pressable onPress={() => router.back()} …>` — a raw `Pressable` in `app/`, where the Unistyles Babel plugin remaps `Pressable`. `features/cards/components/HomeHeaderButtons.tsx` has the `HeaderIconButton` the issue suggests moving to `shared/components/ui/`. |
| 12 | Two shared tests still mock the retired `TOUCH_TARGET` | **ANCORA VALIDA** | Same as #251 item 9 — `shared/components/SyncErrorBanner.test.tsx:19`, `shared/components/SyncStatusContainer.test.tsx:34`. |
| 13 | `CardList.test` / `GuestModeBanner.test` mock a pre-rebrand palette | **ANCORA VALIDA** | `features/cards/components/CardList.test.tsx:121` — `primary: '#1A73E8',`; `features/auth/components/GuestModeBanner.test.tsx:18,24,119` — `primary: '#1A73E8'`, `link: '#1A73E8'`. |

**Spec produced:** `docs/sprint-artifacts/stories/16-52-triage-wallet-followups.md` (items 1, 2, 4, 5, 6, 8, 10, 11, 12, 13).
The hard-coded English and the `useCards` declaration (items 3 and 7) are in
`docs/sprint-artifacts/stories/16-49-triage-theme-followups.md`; the retired `TOUCH_TARGET` mocks (item 12) are in
`docs/sprint-artifacts/stories/16-50-triage-design-system-followups.md`.

---

### Issue #266

`chore(add-card): follow-ups for 22-5-capture — the capture redesign` · 2026-10-12 · labels `backlog, needs-triage` ·
source: `docs/sprint-artifacts/stories/22-5-capture.md`

| # | Item | Verdict | Evidence |
| - | ---- | ------- | -------- |
| 1 | Android does not re-check the camera permission after "Open Settings" | **ANCORA VALIDA** | `features/cards/hooks/useBarcodeScanner.ts:101` — `const [permission, requestPermission] = useCameraPermissions();` — no `AppState` listener anywhere in the capture path (`grep -rn "AppState" features/ shared/ core/ app/` finds only `features/cards/hooks/useCardBrightnessBoost.ts`, a different hook). |
| 2 | On iOS a Code 39 read by the camera may be stored as Code 128 | **ANCORA VALIDA** | `features/cards/hooks/useBarcodeScanner.ts:20-27` — `BARCODE_FORMAT_MAP` has `code39: 'CODE39'` but **not** `org.iso.code39`, the raw AVFoundation type expo-camera's ZXing fallback reports. UNVERIFIABLE end-to-end: `node_modules/expo-camera` is absent, so the Swift fallback cannot be inspected here; the gap in the map is confirmed by reading. |
| 3 | An image scan started from the camera-error state gives no feedback | **ANCORA VALIDA** | `features/add-card/components/ScannerOverlay.tsx:584-618` — the camera-error branch returns early with `<CameraMessage>` (the "Scan from image" button at `:594-603`), so the `isProcessingImage` overlay (`:690-695`) and the `NoCodeFoundBanner` (`:713`) — both rendered *after* the camera branch — are unreachable from that state. |
| 4 | The camera keeps running under setup | **ANCORA VALIDA** | `features/add-card/components/ScannerOverlay.tsx:633` — `<CameraView` with no `active` prop (grep for `active=` in the file returns nothing). |
| 5 | The image-processing layer blocks the back button | **ANCORA VALIDA** | `features/add-card/components/ScannerOverlay.tsx:838-845` — `processingOverlay: { ...StyleSheet.absoluteFillObject, …, zIndex: 20 }` with no `pointerEvents`; the back disc's row is at `zIndex: 10` (`:770`). |
| 6 | A UPC-E read from an image falls back to CODE128 | **GIÀ IMPLEMENTATA** | `features/add-card/hooks/useImageScan.ts:108` — `if (rawFormat.toLowerCase() === 'upc_e')` → `expandUpcE(content)` (`:109`), routed to UPCA. Landed in `87b0808 fix(add-card): store UPC-E image scans as EAN-13 (Story 16.25) (#301)`; `core/utils/expandUpcE.ts:29` is the expansion. |
| 7 | `BarcodeScanner`, `CatalogueGrid` and `app/scan.tsx` have no production consumer | **ANCORA VALIDA** | `app/scan.tsx:4-8` — *"Backward-compatible bridge … Still reached from the catalogue grid (features/cards/components/CatalogueGrid.tsx)"*; `CatalogueGrid` itself is only re-exported from `features/cards/index.ts:41` (no production importer). `BarcodeScanner` — see #251 item 6. |
| 8 | `function` declarations against the arrow-function rule | **ANCORA VALIDA** | `features/cards/hooks/useBarcodeScanner.ts:48` — `function mapBarcodeFormat(...)`; `:96` — `export function useBarcodeScanner({`; `features/add-card/hooks/useImageScan.ts:68` — `function mapFormat(...)`. |
| 9 | `docs/ux-designs/2-9-scan-from-image.md:138` still describes the drag handle as `adjustable` | **ANCORA VALIDA** | `docs/ux-designs/2-9-scan-from-image.md:138` — *"The `MultiCodePickerSheet` drag handle is marked `accessibilityRole=\"adjustable\"`…"*; the same file's own table at `:338` already records that Story 22.1 removed it. |
| 10 | The brand list renders all of its rows at once | **ANCORA VALIDA** | `features/add-card/components/BrandList.tsx:90` — a plain `<ScrollView>` (no `FlatList`/virtualisation) with `keyboardShouldPersistTaps="handled"` (`:92`). |
| 11 | Android may rebind the camera on every live scan | **ANCORA VALIDA** | `features/add-card/components/ScannerOverlay.tsx:640` — `onBarcodeScanned={hasScanned ? undefined : handleBarcodeScanned}`. |
| 12 | The scanner's action rows can lose contrast over a bright scene | **ANCORA VALIDA (design decision)** | `features/add-card/components/ScannerOverlay.tsx:818-821` region — the action labels use the cream overlay token with no shadow. |
| 13 | "Other card" and the results line can sit under the iOS keyboard | **ANCORA VALIDA** | `features/add-card/components/BrandList.tsx:90-94` — the `ScrollView` has `keyboardShouldPersistTaps` but no `KeyboardAvoidingView` and no keyboard inset. |
| 14 | The multi-code picker cuts a value at 28 UTF-16 code units | **ANCORA VALIDA** | `features/add-card/components/MultiCodePickerSheet.tsx:40` — `const MAX_SHOWN_VALUE_LENGTH = 28;`, used at `:87-88` via `code.value.slice(0, MAX_SHOWN_VALUE_LENGTH)`. |
| 15 | At the two largest text sizes the multi-code picker shows no rows | **ANCORA VALIDA** | `shared/components/ui/BottomSheet.tsx:325` — `maxHeight: '80%'`; the sheet's title and description do not shrink or scroll inside that cap, while `MultiCodePickerSheet.tsx:169-171` holds a `FlatList` — so at AX4/AX5 the list has zero height and only the scrim or Android back can close it. |

**Spec produced:** `docs/sprint-artifacts/stories/16-53-triage-capture-and-document-followups.md` (items 1, 2, 3, 4, 5, 7, 9, 14, 15).

---

### Issue #268

`chore(ui): follow-ups for 22-6-the-form-pattern — the form pattern` · 2026-10-15 · labels `backlog, needs-triage` ·
source: `docs/sprint-artifacts/stories/22-6-the-form-pattern.md`

| # | Item | Verdict | Evidence |
| - | ---- | ------- | -------- |
| 1 | Edit never re-detects the format | **ANCORA VALIDA** | `features/cards/components/CardForm.tsx:135-143` — *"Skip auto-detection when `defaultValues` carries a format. Card edit always passes the saved card's, so an edited number keeps its old format."*; `features/cards/screens/CardEditScreen.tsx:172` — `barcodeFormat: card.barcodeFormat,`. |
| 2 | iOS swipe-back on card edit skips the discard prompt | **ANCORA VALIDA** | `grep -rn "usePreventRemove\|beforeRemove" --include=*.ts --include=*.tsx .` (excluding `node_modules`) returns **nothing**. `CardEditScreen.tsx:83-84` keeps `isDirtyRef`, but only the header back (`:91-98`, a platform `Alert`) consults it. |
| 3 | Card setup has no discard prompt | **ANCORA VALIDA** | `features/add-card/screens/CardSetupScreen.tsx:190-192` — `const handleBack = useCallback(() => { router.back(); }, []);` — no dirty check, and `CardSetupScreen` never passes `onDirtyChange` (grep returns nothing, while `CardEditScreen.tsx:179` does). |
| 4 | The scan round trip loses the typed store name and colour | **ANCORA VALIDA** | `features/add-card/screens/BrandScannerScreen.tsx:66-98` — `navigate({ pathname: '/add-card/setup', params: { mode, brandId, brandName, brandColor, brandLogo, barcode, barcodeFormat } })`. No store name or colour is carried; `CardSetupScreen.tsx:126-127` initialises `storeName` to `''` and the colour to its own default. |
| 5 | A failure after the write is reported as a failed save | **ANCORA VALIDA** | `features/cards/hooks/useAddCard.ts:79-98` — `await insertCard(card)` then `await markDirty()` (`:83`) then `await Haptics.notificationAsync(...)` (`:87`) are all inside the same `try`; a rejection from either lands in the `catch` at `:98` and calls `setError(t('cards.add.failedMessage'))`. `useEditCard.ts:83` has the same shape. |
| 6 | The error haptic can escape | **ANCORA VALIDA** | `features/cards/hooks/useAddCard.ts:106` — `await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);` inside the `catch` block, with no inner try/catch — a rejection there is an unhandled rejection. `useEditCard.ts:103` likewise. |
| 7 | Edit offers a colour a catalogue card never shows | **ANCORA VALIDA** | `features/cards/components/CardTile.tsx:183` — `const backgroundColor = brand ? brand.color : (CARD_COLORS[card.color] ?? DEFAULT_CARD_COLOR_HEX);` |
| 8 | Back during a save pops twice | **ANCORA VALIDA (inferred)** | `useAddCard.ts:93` — `router.replace({ pathname: '/', … })` after the save; `CardEditScreen.tsx` calls `router.back()` after its own await. The issue records this as inferred, not run; the code shape is unchanged. |
| 9 | Auth's `ErrorBanner` is tinted and has an icon | **GIÀ IMPLEMENTATA** | `features/auth/components/` no longer contains `ErrorBanner.tsx` (the directory listing shows `AppIconHeader`, `AuthBrandBlock`, `AuthLink`, `GuestModeBanner`, `PasswordInput`, `PasswordStrengthIndicator`). `features/auth/SignInScreen.tsx` no longer computes `hasFormError` (grep for `hasError\|hasFormError` returns nothing). |
| 10 | Setup can save an empty card number | **ANCORA VALIDA** | `features/add-card/screens/CardSetupScreen.tsx:180` — `barcode: cardNumber.trim(),`; the only validation is `validateStoreName` (`:136`, `:155`). `CardSetupScreen.tsx:214` sets `keyboardType="number-pad"`. |
| 11 | `CardTypeSelectionScreen` keeps its own copy of the header geometry | **ANCORA VALIDA** | `features/add-card/screens/CardTypeSelectionScreen.tsx:35-44` — its own comment about *"Where the back chevron's ink starts inside its 48pt target"*, and `:84-94` its own `<HeaderIconButton`. |
| 12 | `docs/project-context.md` and `docs/architecture.md` are stale | **ANCORA VALIDA** | `docs/project-context.md:431` — `| Blue | \`#1A73E8\` |`, `:441` — `| Light | \`#1A73E8\` |` (pre-rebrand); `docs/architecture.md:73` — *"NativeWind (Tailwind CSS) for styling ⚠️ **Under evaluation**"*, `:399` — `| Styling | NativeWind | ^4.x |`, `:500`, `:1488`. |
| 13 | Two stale comments | **ANCORA VALIDA** | `shared/components/ui/PrimaryActionFooter.tsx:18` — *"the `CardSetupScreen` shape, a `SafeAreaView`…"*; `shared/components/ui/Button.test.tsx:157` — *"`CardSetupScreen` passes `disabled={isLoading}` WITH `loading`"* — both untrue now (#251 item 11). |
| 14 | A form mounted while the keyboard is up would leave its footer covered | **ANCORA VALIDA (inferred)** | `shared/components/ui/PrimaryActionFooter.tsx` / `FormScreen` seed no keyboard state on mount. The issue records it as theoretical and unchecked on Android; no code change since. |
| 15 | TalkBack may not announce a live region that mounts already filled | **ANCORA VALIDA (unverifiable without a device)** | No `accessibilityLiveRegion` on the form's error banner or field error (`grep -rn "accessibilityLiveRegion" shared/ features/` returns nothing outside the help screen's resend notice). |
| 16 | A card saved with no number cannot be re-saved from edit | **ANCORA VALIDA** | Edit requires a number (`CardEditScreen.tsx:171-172` prefills the saved `card.barcode`), while setup accepts an empty one (#268 item 10). |
| 17 | No form chains its fields with the return key | **ANCORA VALIDA** | `shared/components/ui/TextField.tsx:50-51,186-187` forwards `returnKeyType` / `onSubmitEditing`, but no form uses them: `grep -n "returnKeyType\|onSubmitEditing" features/cards/components/CardForm.tsx features/cards/screens/CardEditScreen.tsx features/add-card/screens/CardSetupScreen.tsx` returns nothing. |
| 18 | Edit's number pad cannot retype a card number with letters | **ANCORA VALIDA** | `features/cards/components/CardForm.tsx:214` — `keyboardType="number-pad"`, applied in edit as well as setup, while setup's `inferBarcodeFormat` maps letters to CODE128/CODE39/QR. |
| 19 | An unresolvable catalogue brand, or an odd `mode`, saves an empty name | **ANCORA VALIDA** | `features/add-card/screens/CardSetupScreen.tsx:163` — `const name = mode === 'catalogue' ? (brand?.name ?? '') : storeName.trim();` — an unresolvable brand yields `''`, and `validateStoreName` is only consulted for the custom branch (`:155`). |
| 20 | The wallet tile's glyph colour can sit at about 1.8:1 | **ANCORA VALIDA** | `shared/theme/luminance.ts:28-34` — `getLuminance` is a plain weighted sum of the sRGB channels (`0.2126 * r + 0.7152 * g + 0.0722 * b`), not WCAG relative luminance, so `#7A1F5C` and `#0C3C84` both score just above the tile's `NEAR_BLACK_THRESHOLD = 0.2` (`shared/components/ui/Tile.tsx:26,63-64`) and are drawn with an ink glyph where white would read. |

**Spec produced:** `docs/sprint-artifacts/stories/16-50-triage-design-system-followups.md` (item 12 -- the stale agent-context files, shared with #268).

---

### Issue #271

`chore(settings): follow-ups for 22-7-settings — the settings screen and its sheets` · 2026-10-17 · labels `backlog, needs-triage` ·
source: `docs/sprint-artifacts/stories/22-7-settings.md`

| # | Item | Verdict | Evidence |
| - | ---- | ------- | -------- |
| 1 | `LanguageListScreen` has been dead since Story 13.6 | **ANCORA VALIDA** | `grep -rn "LanguageListScreen"` returns exactly two hits: `features/settings/screens/LanguageListScreen.tsx:8` and the barrel re-export `features/settings/index.ts:5`. No route, no importer. |
| 2 | A failed import confirm can show both import sheets | **ANCORA VALIDA** | `features/settings/hooks/useImportData.ts:149-156` — the `catch` sets `errorState` and never clears `preview`; `preview` is set at `:77` and cleared at `:115` (only on success). `features/settings/screens/SettingsScreen.tsx:380` renders `ImportPreviewSheet` and `:392` `ImportErrorSheet` unconditionally on their own flags. |
| 3 | The Sync row's relative time is outside i18n | **ANCORA VALIDA** | `core/utils/relative-time.ts:1-40` — the file hard-codes `'Never'`, `'Just now'`, `'min ago'`, `'hour… ago'`, `'day… ago'` and their Italian twins, with `const ENGLISH_LOCALE = 'en-US'` at `:1`. |
| 4 | `BottomSheet`'s hidden-while-leaving prop never reaches a device | **ANCORA VALIDA (needs the RN source)** | `shared/components/ui/BottomSheet.tsx:228` — `accessibilityElementsHidden={!visible}`. UNVERIFIABLE here: `node_modules/react-native/Libraries/Modal/Modal.js` is absent, so the prop-forwarding list cannot be read in this environment. |
| 5 | The wallet's sort sheet draws its own option rows | **ANCORA VALIDA** | `features/cards/components/SortFilterRow.tsx:105-130` maps `SORT_OPTIONS` onto its own `<Pressable>` rows with a hand-drawn `Check` at `:46-47` (`CHECK_SIZE = 24`, `CHECK_STROKE_WIDTH = 1.5`), while `shared/components/ui/OptionList.tsx` exists and is not used here. |
| 6 | `CardTypeSelectionScreen` keeps its own copy of the header | **ANCORA VALIDA** | `features/add-card/screens/CardTypeSelectionScreen.tsx:84-94` — its own `<HeaderIconButton` (see also #268 item 11). |
| 7 | In dark mode every secondary `Button` is beam | **ANCORA VALIDA** | `shared/components/ui/Button.tsx:69-76` — `case 'secondary': return { backgroundColor: 'transparent', pressedColor: theme.primary + PRESSED_WASH, borderColor: theme.primary, borderWidth: 1, textColor: theme.primary };` — in dark mode `theme.primary` is the beam. |
| 8 | #266 item 15 stays open for the multi-code picker | **ANCORA VALIDA** | `features/add-card/components/MultiCodePickerSheet.tsx:162-171` — the sheet's body is a `FlatList`, so the scrolling `BottomSheet` gained in 22.7 (whose actions slot it needs) does not apply. |
| 9 | The design system specifies no pressed state for a destructive row | **ANCORA VALIDA** | `shared/components/ui/ActionRow.tsx:104-105` — `backgroundColor: isPressed ? … : …` fills a destructive row with `surfaceElevated`, unlike the destructive button's 8 % wash. |
| 10 | No ruling covers signing out with unsynced changes | **GIÀ IMPLEMENTATA** | `shared/i18n/locales/en.ts:216` — the sign-out body now says *"cards not yet synced to it are lost for good if you erase"*; `features/settings/screens/SettingsScreen.tsx:177-215` implements the keep/erase choice (Story 16.45). |
| 11 | The Italian keyword is the English `DELETE` | **ANCORA VALIDA** | `shared/i18n/locales/it.ts:223` — `step2Body: "Digita DELETE per confermare l'eliminazione permanente dell'account."`, `:224` `confirmInputLabel: 'Digita DELETE per confermare'`, `:229` `confirmKeyword: 'DELETE'`. |
| 12 | The bundled fonts' licence suggests a credit; no licences screen | **ANCORA VALIDA** | Same as #248 item 8 — no licence surface exists in `features/`, `app/` or `shared/`. |
| 13 | Card detail's Delete and edit's Discard still use the platform alert | **ANCORA VALIDA** | `features/cards/components/CardDetails.tsx:292` — `Alert.alert(`; `features/cards/screens/CardEditScreen.tsx:91` — `Alert.alert(t('cards.edit.discardTitle'), …)`. |
| 14 | A request keeps running after its sheet is closed | **ANCORA VALIDA** | `features/settings/screens/SettingsScreen.tsx:167-172` (`confirmExport`) and `:177-215` (`confirmSignOut`) never cancel in-flight requests; the sheet's close stays live. |
| 15 | The delete field leaves autocorrect and predictive text on | **ANCORA VALIDA** | `features/settings/components/DeleteAccountSheet.tsx:118-126` — the `TextField` sets `autoCapitalize="characters"` but **no** `autoCorrect={false}`. |
| 16 | `docs/project-context.md` § Styling & Theming contradicts the Epic 22 code | **ANCORA VALIDA** | `docs/project-context.md:225-243` prescribes `import { StyleSheet } from 'react-native-unistyles'` and `StyleSheet.create((theme) => ({ … }))`, while the shared primitives use React Native's `StyleSheet` (`shared/components/ui/TextField.tsx:242` `StyleSheet.create({...})`) and take colours from `useTheme()`. |
| 17 | `useImportData` still computes the error's `variant`, which nothing reads | **ANCORA VALIDA** | `features/settings/hooks/useImportData.ts:24` declares `variant: 'invalid' \| 'empty'`, set at `:67`, `:87`, `:94`, `:154`; `features/settings/components/ImportErrorSheet.tsx` reads no `variant` prop (grep finds only a `Button variant="primary"`). |
| 18 | A wrapped `Button` label aligns left at the largest text size | **ANCORA VALIDA** | `shared/components/ui/Button.tsx:169-176` — the label `<Text>` carries no `textAlign`, so a wrapped label inherits the container's alignment. (Same mechanism as #248 item 10.) |
| 19 | Card detail's details rows cut their values at the largest size | **ANCORA VALIDA** | `features/cards/components/DetailRow.tsx:56` — `numberOfLines={1}` with `ellipsizeMode="middle"`. |
| 20 | A deletion that worked can be reported as failed | **ANCORA VALIDA** | `shared/supabase/auth.ts:439` — `const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });` followed by `if (signOutError) { return { success: false, error: toAuthError(signOutError) }; }` — a network failure in the server logout is reported as a failed deletion after the account is already gone. |

**Spec produced:** `docs/sprint-artifacts/stories/16-59-triage-settings-followups.md` (all sixteen open items).

---

### Issue #273

`chore(ui): follow-ups for 22-8-document-screens — help, the privacy policy and What We Collect` · 2026-10-20 · labels `backlog, needs-triage` ·
source: `docs/sprint-artifacts/stories/22-8-document-screens.md`

| # | Item | Verdict | Evidence |
| - | ---- | ------- | -------- |
| 1 | The FAQ's first answer names a deleted screen | **ANCORA VALIDA** | `features/help/help-data.json:5` and `docs/help.json:5` — *"...the First-Card Guidance overlay appears on the home screen."* The overlay was deleted in `92235b1b fix(onboarding): keep signed-in users out of the welcome redirect loop (Story 13.7b) (#119)`. |
| 2 | Italian copy drops its accents | **ANCORA VALIDA** | `features/help/help-fallback.ts:48` — `question: 'Perche la fotocamera non funziona?',` (no accent). `assets/legal/privacy-policy.it.ts` and `shared/i18n/locales/it.ts:279-280` no longer contain the cited strings (Story 24.1 rewrote them), so that half is closed; the help fallback is not. |
| 3 | `app/help-fallback.ts` is a dead route file | **ANCORA VALIDA** | `app/help-fallback.ts` is one line — `export { fallbackHelpItems, type HelpItem } from '@/features/help/help-fallback';` — with **no default export**, which Expo Router skips in development and registers as an empty route in production. No importer references the path. |
| 4 | `features/privacy/index.ts` is used by nothing | **ANCORA VALIDA** | `features/privacy/index.ts` — `export { default } from './PrivacyPolicyScreen';`; `grep -rn "from '@/features/privacy'"` returns **no** importer. It also exports no `DataSummaryScreen`. |
| 5 | Contact Support may never open Mail on iOS | **ANCORA VALIDA** | `app.json` has **no** `LSApplicationQueriesSchemes` entry and no Android `<queries>` block for `mailto` (the file's iOS block ends at `:16`; the only match for `mailto\|supportsTablet` is `:12 "supportsTablet": false`). `features/help/HelpScreen.tsx:27` — `const SUPPORT_MAIL_URL = 'mailto:support@cardiapp.eu';` and `:150` `openExternal(SUPPORT_MAIL_URL, …)`. |
| 6 | Consent is never re-asked or revoked | **ANCORA VALIDA** | `core/privacy/consent-repository.ts:79` — `export const needsReConsent = (): boolean => {` — its only callers are `core/privacy/consent-repository.test.ts:146,149`. `revokeConsent` and `logConsentEvent` appear only in that test file. |
| 7 | No search folds accents | **ANCORA VALIDA** | `features/cards/hooks/useCardSearch.ts:41-42`, `features/add-card/hooks/useBrandSearch.ts:51-53`, `features/help/HelpScreen.tsx:73-78` — all lower-case and match a substring; no `normalize('NFD')`. |
| 8 | Story 6.11's file still says `Status: in-progress` | **ANCORA VALIDA** | `docs/sprint-artifacts/stories/6-11-privacy-consent.md:5` — `**Status:** in-progress`, while the tracker says `6-11-privacy-consent: done`. |
| 9 | The Italian FAQ has no mirror in `docs/`, and no parity test | **ANCORA VALIDA** | `docs/` holds only `help.json` (the English one, `docs/help.json:5` matches the English string); the Italian lives at `features/help/help-data.it.json`. `test/privacy-copy.test.ts:29-30` lists both bundled FAQ files, but only for the retired-claims sweep — there is no EN↔IT parity test. |
| 10 | The privacy policy and What We Collect contradict the code | **GIÀ IMPLEMENTATA (mostly)** | Story 24.1 (`90f9de4 fix(privacy): true privacy copy, cardiapp.eu contacts and store disclosures (Story 24.1) (#293)`) rewrote them. `assets/legal/privacy-policy.ts:87` now says *"The database itself is **not** encrypted"*; `:56` discloses Expo's update identifier; `:95-97` name Supabase **and** Expo as processors; `shared/i18n/locales/en.ts:269` — `deviceId: { category: 'Device ID', detail: 'An install identifier, used only to deliver app updates' }`; `core/observability/sentry.ts:277` — `tracesSampleRate: __DEV__ ? 1.0 : 0` (release tracing off); `docs/index.html:232` — *"No ads, no advertising identifiers. Your cards stay on your device unless you sign in…"*; `docs/store/listing.md:315` — *"No ads, no in-app purchases, no tracking."* A guard now enforces it: `test/privacy-copy.test.ts:38-70` `RETIRED_CLAIMS` fails the build on the old wording. **One residue remains:** `docs/store/listing.md:315` still says "no tracking", which `RETIRED_CLAIMS` (line 47) would reject — the file is not in that test's `SURFACES` list (`test/privacy-copy.test.ts:20-33`), so it is unguarded. |
| 11 | Help's content can sit under the keyboard | **ANCORA VALIDA** | `shared/components/ui/DocumentScreen.tsx:67-70` — a `ScrollView` with `keyboardShouldPersistTaps="handled"` and no keyboard inset handling. |
| 12 | A screen reader hears nothing from a search | **ANCORA VALIDA** | `grep -rn "accessibilityLiveRegion\|AccessibilityInfo.announce" shared/components/ui/SearchBar.tsx features/help/HelpScreen.tsx features/cards/components/CardList.tsx` returns **nothing**. |
| 13 | Settings still builds the document ground by hand | **ANCORA VALIDA** | `features/settings/screens/SettingsScreen.tsx:341` renders `<AboutSection …>`; `features/settings/components/AboutSection.tsx` has no `DocumentScreen` (grep returns nothing), so the ground is hand-built and can drift from `shared/components/ui/DocumentScreen.tsx`. |
| 14 | The shared `SearchBar` defaults to the wallet's copy | **ANCORA VALIDA** | `shared/components/ui/SearchBar.tsx:100` — `placeholder={placeholder ?? t('cards.home.searchPlaceholder')}`; `:103` — `accessibilityLabel={accessibilityLabel ?? t('cards.home.searchAccessibilityLabel')}`; `:114` — the clear button's default label. |
| 15 | On iPad the reading column has no maximum width | **GIÀ IMPLEMENTATA** | `app.json:12` — `"supportsTablet": false` (Story 24.6's decision, `da43fab feat(store): store listings, screenshots and site captures (Story 24.6) (#308)`). The iPad premise no longer applies. |
| 16 | The policy's meta line shows the raw ISO date | **ANCORA VALIDA** | `features/privacy/PrivacyPolicyScreen.tsx:115` — `{PRIVACY_POLICY_LAST_UPDATED}`, with `assets/legal/privacy-policy.ts:26` — `export const PRIVACY_POLICY_LAST_UPDATED = '2026-11-05';`. |
| 17 | The policy's contact address cannot be copied | **ANCORA VALIDA** | `features/privacy/PrivacyPolicyScreen.tsx:136` — the paragraph `<Text key={index} style={[styles.paragraph, end, { color: theme.textPrimary }]}>` carries no `selectable`. |
| 18 | An answer opened near the screen's bottom grows out of view | **ANCORA VALIDA** | `features/help/FaqItem.tsx:121` `measureContent` / `:191 onLayout={measureContent}` — the answer's height is measured and animated, but nothing scrolls it into view. |
| 19 | Dragging never dismisses the keyboard | **ANCORA VALIDA** | `grep -rn "keyboardDismissMode" --include=*.tsx .` (excluding `node_modules`) returns **nothing** — not in `DocumentScreen.tsx`, not in `CardList.tsx`, not in `BrandList.tsx`. |
| 20 | `ActionRow`'s comment calls 1.5 "the first of the accessibility sizes" | **ANCORA VALIDA** | `shared/components/ui/ActionRow.tsx:17` — *"1.353 and the first accessibility size at 1.786, so 1.5 is the first of the accessibility sizes."* |
| 21 | Typed text overflows the shared search field at the largest text size | **ANCORA VALIDA** | `shared/components/ui/SearchBar.tsx:133` — `height: TOUCH_TARGET.min,` (a fixed 48pt) with the input's `bodyLg` text uncapped. |
| 22 | The wallet's "0 cards / Frequently used" row overlaps at the largest text size | **ANCORA VALIDA** | `features/cards/components/SortFilterRow.tsx:68-77` — `cardCountText` and the sort control share one row with no `numberOfLines` and no flex shrink. |
| 23 | No text field sets `keyboardAppearance` | **ANCORA VALIDA** | `grep -rn "keyboardAppearance" --include=*.tsx --include=*.ts shared/ features/` returns **nothing**; `shared/components/ui/TextField.tsx` does not forward the prop. |

**Spec produced:** `docs/sprint-artifacts/stories/16-53-triage-capture-and-document-followups.md` (items 2, 3, 4, 5, 6, 7, 9, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22, 23).

---

### Issue #275

`chore(auth): follow-ups for 22-9-authentication — consent, recovery stack and copy fit` · 2026-10-22 · labels `backlog, needs-triage` ·
source: `docs/sprint-artifacts/stories/22-9-authentication.md`

| # | Item | Verdict | Evidence |
| - | ---- | ------- | -------- |
| 1 | A device's first account sends the server no consent | **ANCORA VALIDA** | `shared/supabase/auth.ts:153` — `const consentGiven = getConsentStatus();` read **before** `supabase.auth.signUp(signUpPayload)` (`:167`), and `features/auth/CreateAccountScreen.tsx:172` — `setConsentGiven();` runs **after** `signUp` returns (`:165`). `CreateAccountScreen` is the only writer of consent. |
| 2 | A mistyped code probably reads as expired | **ANCORA VALIDA** | `shared/supabase/auth.ts:79-86` — `normalizeOtpError` maps `code?.includes('expired') \|\| message.includes('expired')` to `expired_otp`; GoTrue answers a wrong code with `otp_expired` / *"Token has expired or is invalid"*. The suite mocks a code auth-js never returns: `shared/supabase/auth.test.ts:442,717` — `code: 'otp_invalid'`. |
| 3 | Sign in's "Please verify your email address first." leads nowhere | **ANCORA VALIDA** | `features/auth/SignInScreen.tsx:49-50` — `if (code === 'email_not_confirmed') { return t('auth.signIn.emailNotConfirmed'); }` — a message with no navigation to the code screen. |
| 4 | "An account with this email already exists" is likely unreachable | **ANCORA VALIDA** | `supabase/config.toml:209` — `enable_confirmations = true`; the copy exists at `shared/i18n/locales/en.ts:417` — `accountExists: 'An account with this email already exists. Sign in instead.',` and is exercised by `features/auth/CreateAccountScreen.test.tsx:711,723`. |
| 5 | The cross-links push | **ANCORA VALIDA** | `features/auth/SignInScreen.tsx:156` — `onPress={() => router.push('/create-account')}`; `:193` — `router.push('/forgot-password')`; `features/auth/CreateAccountScreen.tsx:221` — `router.push('/sign-in')`; `features/auth/ForgotPasswordScreen.tsx:137` — `router.push('/sign-in')`. |
| 6 | The consent sentence's policy link has no 48pt target | **ANCORA VALIDA** | `shared/components/ConsentCheckbox.tsx:135-144` — the link is a nested `<Text testID="consent-policy-link" onPress={handlePolicyPress} accessibilityRole="link">` inside the sentence `<Text>`; a nested `Text` has no hit slop of its own. |
| 7 | `TextField`'s `hasError` has no caller | **ANCORA VALIDA** | `shared/components/ui/TextField.tsx:31` declares it, `:115` defaults it, `:143,147` consume it — but `grep -rn "hasError" --include=*.tsx shared/ features/` (excluding tests) finds no caller outside `TextField.tsx` itself. |
| 8 | Connected but offline, a submit spins until the system's fetch timeout | **ANCORA VALIDA** | `shared/supabase/client.ts:197-204` — `createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storage } })` — no timeout, no abort signal. |
| 9 | The guest-migration flag ignores the user | **ANCORA VALIDA** | `core/auth/guest-migration.ts:23` — `const MIGRATION_FLAG_KEY = 'guestMigrationCompleted';`; `:40-48` — `isMigrationCompleted` reads the key and returns `value !== null` without checking which user it belongs to, although `setMigrationFlag(userId)` (`:88`) stores the id in the payload. |
| 10 | Three design sources still describe the old icon or the hand-built ì | **ANCORA VALIDA** | `docs/design/cardi/README.md:1212-1213` — *"MaterialCommunityIcons 'card-account-details-outline' at 80px; onboarding's BrandedIcon renders MaterialIcons 'credit-card' at 100px. Two generic glyphs standing in for one missing…"*; `docs/design/cardi/stitch-prompts-auth.txt:45,47` — the same two stock glyphs; `docs/design/cardi/frames/cardi-auth-frames.html:321-322` — the same. The code was fixed: `features/auth/components/AppIconHeader.tsx:20` — *"This used to be `card-account-details-outline` from MaterialCommunityIcons —"*. |
| 11 | At the largest text size the 24pt heading breaks mid-word | **ANCORA VALIDA** | No cap or `adjustsFontSizeToFit` on the auth headings; the issue records it as device-verified on the 375pt and 393pt phones. |
| 12 | The code's digits outgrow their field at the largest sizes | **ANCORA VALIDA** | `shared/components/ui/TextField.tsx` uses `TYPOGRAPHY.monoCode` for the OTP field; the field's width is fixed and the eight digits at the largest font scale exceed it. The issue marks this as needing a decision; no decision is recorded in the story. |
| 13 | Strength changes are never announced | **ANCORA VALIDA** | `features/auth/components/PasswordStrengthIndicator.tsx` — no `accessibilityLiveRegion`, no `AccessibilityInfo.announce` (the file's own doc comment says *"Assistive technology reads it as one element"*, i.e. on focus, not on change). |
| 14 | "Wrong email? Go back" leaves the original form beneath it | **ANCORA VALIDA** | `features/auth/VerifyEmailScreen.tsx:120-121` — `onWrongEmail: (router, { email }) => router.replace({ pathname: '/create-account', params: { email } })` — `replace` swaps only the code screen. |
| 15 | The code suites still depend on their fake-timer tests running last | **ANCORA VALIDA** | Same as #248 item 13 — `features/auth/VerifyEmailScreen.test.tsx:915`. |
| 16 | After a rejected code, a digit typed after the eighth re-sends the same code on every keystroke | **ANCORA VALIDA** | The OTP field is capped at 8 digits and the screen keeps a resend cooldown; the behaviour is unchanged since `2415551`. |
| 17 | `ActionRow.tsx:17` still calls 1.5 "the first of the accessibility sizes" | **ANCORA VALIDA** | Same as #273 item 20. |
| 18 | Send Reset Code's spoken name lacks its visible words | **ANCORA VALIDA** | `shared/i18n/locales/en.ts:426` — `sendResetCode: 'Send Reset Code',` versus `:375` — `sendResetCode: 'Send password reset code',` (the accessibility copy). `features/auth/ForgotPasswordScreen.tsx:126-127` uses the label for the visible text and the accessibility label for the spoken name. |
| 19 | Card setup and card edit can leave a focused field under the footer after a failed save | **ANCORA VALIDA** | Same mechanism as #268 item 14 — nothing re-insets the footer when the keyboard stays up after a failed submit. |
| 20 | A request that finishes after the user has left still navigates | **ANCORA VALIDA** | `features/auth/CreateAccountScreen.tsx:175` — `router.replace('/')` after the await, with no focus check. |
| 21 | The return key moves nowhere and submits nothing | **ANCORA VALIDA** | Same as #268 item 17. |
| 22 | Recovery begun from welcome leaves forgot password beneath new password | **ANCORA VALIDA** | `features/auth/NewPasswordScreen.tsx:30` — *"`dismissTo('/')` finds no Home, so the screens beneath stay and its back shows"*; `:148` — `router.replace('/')` on success, with the forgot-password screen still on the stack. |
| 23 | `CardForm.test.tsx`'s AC2 test flaked once in a combined run | **ANCORA VALIDA (flaky)** | `features/cards/components/CardForm.test.tsx` — the test exists and the issue records a real flake; nothing in the tree changes its focus behaviour. |
| 24 | At the largest sizes UIKit shrinks a hint wider than its field | **ANCORA VALIDA** | No `adjustsFontSizeToFit` / `minimumFontScale` on the hint rows; React Native sets no font fitting on a single-line iOS input. |
| 25 | New password's Italian confirm hint truncates | **ANCORA VALIDA** | `shared/i18n/locales/it.ts:378` — `confirmNewPasswordHint: 'Inserisci di nuovo la nuova password per confermare',` — a long single-line hint in a fixed-height field. |
| 26 | Italian create account's consent sentence has a space after its elision | **ANCORA VALIDA** | `shared/components/ConsentCheckbox.tsx:135` — `` {`${t('auth.consent.labelPrefix')} `} `` — the template appends a space; `shared/i18n/locales/it.ts:492` — `labelPrefix: "Accetto l'"`, so the rendered text is *"Accetto l' Informativa…"* while the spoken name (`:141`, `accessibilityHint`) has no space. |

**Spec produced:** `docs/sprint-artifacts/stories/16-50-triage-design-system-followups.md` (item 12 -- the stale agent-context files, shared with #268). The remaining open items of this issue (the OTP suite's test order, the consent wording, the OTP error mapping, the sign-in dead end, the cross-link stack and the largest-text items) are covered by the same triage pass and are listed in that story's Code Map; the settings-side work is in `docs/sprint-artifacts/stories/16-59-triage-settings-followups.md`.

---

### Issue #281

`chore(onboarding): follow-ups for 22-10-onboarding — accessibility, shared sheet and release notes` · 2026-10-27 · labels `backlog, needs-triage` ·
source: `docs/sprint-artifacts/stories/22-10-onboarding.md`

| # | Item | Verdict | Evidence |
| - | ---- | ------- | -------- |
| 1 | Bump `expo.version` before any OTA | **ANCORA VALIDA** | `app.json:5` — `"version": "1.0.0"`; `:213-215` — `"runtimeVersion": { "policy": "appVersion" }`; `:216-218` — an `updates.url`. `package.json:94` — `"lottie-react-native": "~7.3.4"` is now a dependency (the native module Story 22.10 added), and `app.json`'s `runtimeVersion` is pinned to `appVersion` (1.0.0), so no OTA built from it may target 1.0.0 binaries. |
| 2 | Screen-reader focus after a sheet closes | **ANCORA VALIDA** | `grep -n "AccessibilityFocus\|focus" shared/components/ui/BottomSheet.tsx` returns nothing — the shared sheet moves no focus. |
| 3 | The highlights carousel announces nothing on a page change | **ANCORA VALIDA** | `features/onboarding/screens/FeatureHighlightsScreen.tsx:156-159` — `<View style={styles.carousel} accessibilityRole="adjustable" accessibilityHint={t('onboarding.highlights.swipeAccessibilityHint')}>` with no `accessibilityActions` and no announcement on the page change (`:113` `scrollToIndex`). |
| 4 | `ModeOptionCard`'s accessibility label reads ".. Recommended option." | **ANCORA VALIDA** | `features/onboarding/components/ModeOptionCard.tsx:78` — `` accessibilityLabel={`${title}. ${subtitle}${recommended ? t('onboarding.modeOption.recommendedAccessibilitySuffix') : ''}`} `` with `shared/i18n/locales/en.ts:84` — `recommendedAccessibilitySuffix: '. Recommended option.',` — so a subtitle ending in a full stop yields a double stop. |
| 5 | Highlight titles carry no header role | **ANCORA VALIDA** | `features/onboarding/components/HighlightSlide.tsx:44` — `<Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>` with no `accessibilityRole="header"`, unlike `features/onboarding/screens/ModeSelectionScreen.tsx:64` and `features/onboarding/screens/WelcomeScreen.tsx:104`. |
| 6 | The sheet's Italian announcements disagree with most sheets' names | **ANCORA VALIDA** | `shared/i18n/locales/it.ts:297-298` — `openedAnnouncement: '{{label}} aperto', closedAnnouncement: '{{label}} chiuso'`; `:284-285` — `expandedAccessibilityValue: 'aperto', collapsedAccessibilityValue: 'chiuso'`. Applied to a label already ending in a noun, the result reads *"Lingua aperto"*. |
| 7 | At the largest text size: sheet title breaks mid-word, footer takes 509 of 852pt, "Recommended" pill breaks | **ANCORA VALIDA** | `shared/theme/typography.ts:93` — `sheetTitle: token(FONT_FAMILY.display, 20, 28, '700')`; the onboarding sheet titles carry no cap. `features/onboarding/components/ModeOptionCard.tsx:78` builds the label from the subtitle + suffix with no size handling. |
| 8 | On first launch Home's header and spinner show through Welcome's fade-in | **ANCORA VALIDA** | `app/_layout.tsx:165-170` — `<Stack.Screen name="welcome" options={{ title: …, headerShown: false, animation: 'fade' }} />`; the gate at `:115` — `router.replace('/welcome');`. |
| 9 | Under Reduce Motion, Next still animates the carousel | **ANCORA VALIDA** | `features/onboarding/screens/FeatureHighlightsScreen.tsx:113` — `flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });` — no `useReducedMotion()` check in that file (the hook is used only in `features/onboarding/components/OnboardingAnimation.tsx:67`). |
| 10 | `docs/design/cardi/lottie/README.md:47` still says `lottie-react-native` is not installed | **ANCORA VALIDA** | `docs/design/cardi/lottie/README.md:49` — *"`lottie-react-native` is not installed yet. The SDK pins `~7.3.4`…"*, while `package.json:94` — `"lottie-react-native": "~7.3.4"` is a dependency. |
| 11 | `AppLaunchScreen` cites the deleted `FannedCardIllustration` | **ANCORA VALIDA** | `shared/components/launch/AppLaunchScreen.tsx:144` — *"Both props, per FannedCardIllustration. */"*; `shared/components/launch/AppLaunchScreen.test.tsx:192` — the same. `grep -rn "FannedCardIllustration" shared/` finds only these two comments — the component is gone. |
| 12 | `HomeScreen.test.tsx` mocks an `OnboardingOverlay` that does not exist | **ANCORA VALIDA** | `features/cards/screens/HomeScreen.test.tsx:124-126` — `jest.mock('@/features/onboarding', () => ({ OnboardingOverlay: () => null }));`, while `features/onboarding/index.ts` exports `WelcomeScreen`, `ModeSelectionScreen`, `FeatureHighlightsScreen`, `ModeOptionCard`, `HighlightSlide`, `PaginationDots`, `useModeSelection`, `useHighlightPagination`, `TOTAL_HIGHLIGHT_SLIDES` — no `OnboardingOverlay`. |
| 13 | The adopted onboarding Design canvas still draws the mark at the old 34-in-100 size | **ANCORA VALIDA (external asset)** | The repository's Lottie changed (Story 22.10 decision 6) but the design canvas is an external Figma asset; UNVERIFIABLE from this repository. |
| 14 | *(Sheet's Italian announcements, largest-text sizes — same items as 6 and 7 above.)* | **ANCORA VALIDA** | — |

**Spec produced:** `docs/sprint-artifacts/stories/16-54-triage-onboarding-followups.md`.

---

### Issue #284

`chore(watch): follow-ups for 23-2-watchos-implementation — crown paging, watch UI tests and stale docs` · 2026-10-27 · labels `backlog, needs-triage` ·
source: `docs/sprint-artifacts/stories/23-2-watchos-implementation.md`

| # | Item | Verdict | Evidence |
| - | ---- | ------- | -------- |
| 1 | VoiceOver after an adjust page | **ANCORA VALIDA (needs a real watch)** | `targets/watch/BarcodePagerView.swift:172` — `.id(card.id)` re-keys each page; no `@AccessibilityFocusState` and no announcement in the file (grep returns nothing). |
| 2 | A crown turn that wakes a dimmed barcode screen may page a card | **ANCORA VALIDA (needs a real watch)** | The pager's rotary reader is not detached while the luminance is reduced; `isLuminanceReduced` is not consulted in `BarcodePagerView.swift` (grep returns nothing). |
| 3 | Amend Story 23.3's spec before it is built | **GIÀ IMPLEMENTATA** | `docs/sprint-artifacts/stories/23-3-wear-os-implementation.md:29` — *"Rotary scrolls the list and the picker explicitly, and on the barcode it scrolls through the cards"*; the matrix row at `:85` — *"Rotary barcode \| One detent onward or back \| The next or previous card's barcode…"*; decision 4 at `:111`. Story 23.3 merged as `7f5cbb7 feat(watch): the Cardì watch grammar and rotary paging on Wear OS (Story 23.3) (#286)` with the amended spec. |
| 4 | No scheme or CI job runs `watch-ios/UITests` or `watch-ios/Tests` | **ANCORA VALIDA** | `package.json:47` — `"watch:build:ci": "xcodebuild -project ios/Cardi.xcodeproj -target watch -configuration Debug -sdk watchsimulator COMPILER_INDEX_STORE_ENABLE=NO build"` — a **build**, not a test. `.github/workflows/watchos-tests.yml:163` runs that script; `:142-143` runs only the Jest catalogue tests (`--testPathPattern='targets/watch/__tests__'`). `grep -rn "xcodebuild.*test\|xctest" .github/workflows/ scripts/ package.json` returns **no** test invocation. |
| 5 | `test_tapCard_displaysBarcode` fails on the baseline | **ANCORA VALIDA** | `watch-ios/UITests/CardListUITests.swift:94-104` looks for `app.otherElements["barcode-view"]` **and** `app.images["barcode-image"]`; `targets/watch/BarcodeFlashView.swift:288` puts `.accessibilityIdentifier("barcode-view")` on the outer view, which contains `:182` `"barcode-image"` and `:222` `"barcode-number"` — the outer identifier replaces the children's. |
| 6 | `test_importSampleCards_buttonAddsCards` fails on the baseline | **ANCORA VALIDA** | `watch-ios/UITests/CardListUITests.swift:66` — `app.buttons["import-sample-cards"]`; `targets/watch/CardListView.swift:684` sets that identifier on the DEBUG toolbar button, which sits in a `ToolbarItem(placement: .topBarLeading)` (`:683`) alongside the sort button (`:670-673`) — the query can match several elements. |
| 7 | Cream initials on azure score 3.53:1 | **ANCORA VALIDA (design decision)** | `docs/design/cardi/cardi-design-system.md:290` — *"| **`#0C84CC` azure** | white (best: ink 4.34) | **4.05:1** | ❌ |"*, and `:281` — *"White is 4.05:1 and ink — the better of the two — is 4.34:1."* The watch keeps the frames' rule: `targets/watch/CardListView.swift:357-360` — *"Defaults to cream for an unresolvable color: azure, its fallback, falls on the light side of the 0.4 rule, as the frames draw it on an azure accent."* |
| 8 | `.agents/skills/native-watchos/SKILL.md:52` still says "Exit: Tap screen or crown to return" | **ANCORA VALIDA** | `.agents/skills/native-watchos/SKILL.md:52` — *"**Exit**: Tap screen or crown to return."* Story 23.2 decision 1 made a tap no longer dismiss the barcode. |
| 9 | `core/schemas/card.ts:70-76` still says watchOS falls back to `.gray` | **ANCORA VALIDA** | `core/schemas/card.ts:71-77` — *"⚠️ watchOS does NOT yet agree … `CardListView` resolves `mapColor(hex:) ?? .gray`, so a card whose colour is absent or unreadable gets SwiftUI's system grey rather than the azure."* The code moved on: `targets/watch/CardListView.swift:343-345` — *"An unresolvable color takes the palette's default, azure, never a system color (Story 23.2)"* — so the **comment** is now false. |
| 10 | `BrandLogo-stroili.imageset` rasterises to a uniform rectangle | **ANCORA VALIDA** | `targets/watch/Assets.xcassets/BrandLogo-stroili.imageset/brand-logo-stroili@2x.png` — IHDR 128×43, RGBA, and the inflated scanline data contains only **6 distinct byte values** across 22 059 bytes — a flat rectangle, not a logo. The same asset is duplicated in `targets/watch-widget/Assets.xcassets/BrandLogo-stroili.imageset/`. The source vector `assets/images/brands/stroili.svg` exists. |
| 11 | Cosmetics: favourite names truncate at 40mm; the DEBUG import button overlaps the empty-state title; the sort glyph takes the system's white | **ANCORA VALIDA** | `targets/watch/CardListView.swift:670-673` — the sort `Image(systemName: "arrow.up.arrow.down")` carries no `foregroundStyle`, so it takes the system's white; the DEBUG import button is a second `ToolbarItem(placement: .topBarLeading)` (`:683`) alongside it. |

**Spec produced:** `docs/sprint-artifacts/stories/16-55-triage-watch-followups.md` (items 1, 2, 4, 5, 6, 8, 9, 10, 11).

---

### Issue #294

`chore(store): follow-ups for 24-2-store-platform-requirements — privacy manifest build checks` · 2026-11-07 · labels `backlog, needs-triage` ·
source: `docs/sprint-artifacts/stories/24-2-store-platform-requirements.md`

| # | Item | Verdict | Evidence |
| - | ---- | ------- | -------- |
| 1 | No automated check of the prebuild or build output | **ANCORA VALIDA** | `test/store-platform-requirements.test.ts` reads **inputs** only — `:6` `import appJson from '../app.json'`, `:158` `path.join('targets', target, 'PrivacyInfo.xcprivacy')`. No workflow runs a prebuild and asserts the generated output: the `prebuild` steps in `.github/workflows/` (`android-release.yml:126`, `beta-releases.yml:113,213`, `ios-release.yml:161`, `nightly-builds.yml:268,405`, `phone-wear-module-tests.yml:109`) all build for release; none diff the generated `PrivacyInfo.xcprivacy`, the Gradle SDK properties or the watch bundles' copied manifests. |
| 2 | `watch.app` ships `README.md` and `AppIcon.png` as resources | **ANCORA VALIDA** | `targets/watch/` holds `README.md` and `AppIcon.png` alongside the sources, and `targets/watch/expo-target.config.js` declares `icon: './AppIcon.png'` — the file lives in the same synchronized folder the plugin copies wholesale. |
| 3 | A second, non-clean `expo prebuild -p ios` fails in apple-targets | **ANCORA VALIDA (not reproducible here)** | `package.json:61` — `"@bacons/apple-targets": "^4.0.6"`. The failure (`withIosXcodeProjectBeta2BaseMod: Cannot read properties of undefined (reading 'removeFromProject')`) is in the plugin's own `withIosXcodeProjectBeta2BaseMod`. UNVERIFIABLE here: `node_modules/` is absent and the plugin is not vendored, so the call cannot be exercised. The issue records that a clean prebuild works. |

**Spec produced:** `docs/sprint-artifacts/stories/16-56-triage-store-and-ota-followups.md` (all three items).

---

### Issue #298

`chore(deps): follow-ups for 24-4-android-screens-crash-fix — OTA runtime, install exclude, Sentry noise` · 2026-11-08 · labels `backlog, needs-triage` ·
source: `docs/sprint-artifacts/stories/24-4-android-screens-crash-fix.md`

| # | Item | Verdict | Evidence |
| - | ---- | ------- | -------- |
| 1 | The OTA runtime version does not move with native changes | **ANCORA VALIDA** | `app.json:5` — `"version": "1.0.0"`; `:213-215` — `"runtimeVersion": { "policy": "appVersion" }`; `:216-218` — an `updates.url`. `package.json:3` is also `1.0.0`. Story 24.4 moved `react-native-screens` to `~4.25.2` (`package.json:108`) — a native change — with no version bump. |
| 2 | `expo.install.exclude` has no exit condition | **ANCORA VALIDA** | `package.json:164-170` — `"expo": { "install": { "exclude": ["react-native-screens"] } }`, with no note anywhere of when it is lifted. |
| 3 | AGENTS.md has no note on excluded packages | **ANCORA VALIDA** | `AGENTS.md:100-125` § "Library Installation (Expo Projects)" says *"ALWAYS use the following process… `npx expo install`"* and *"NEVER use `yarn add` or `npm install` directly"*; `grep -n "react-native-screens\|exclude" AGENTS.md` returns **nothing**. |
| 4 | Wear connectivity Sentry noise | **ANCORA VALIDA** | `core/wear-connectivity.ts:250-255` — `catch (error) { logger.notify('Wear OS card snapshot publish failed', { tags: { surface: 'wear-sync', outcome: 'publish-error' }, context: [{ error: String(error) }] }); return false; }` — no filter for `ApiException` 17 / `API_UNAVAILABLE`. |
| 5 | Sentry REACT-NATIVE-B, the Fabric `addViewAt` crash on Android 17 | **ANCORA VALIDA (observational)** | Nothing in the tree suppresses or classifies it; the issue records it as one event without a `react-native-screens` frame. Tracking it needs the Sentry query, which needs credentials this machine does not have. |

**Spec produced:** `docs/sprint-artifacts/stories/16-56-triage-store-and-ota-followups.md` (all five items).

---

### Issue #303

`chore(wear): follow-ups for 16-38-wear-os-barcode-uses-the-whole-screen — barcode edge cases` · 2026-11-09 · labels `backlog, needs-triage` ·
source: `docs/sprint-artifacts/stories/16-38-wear-os-barcode-uses-the-whole-screen.md`

| # | Item | Verdict | Evidence |
| - | ---- | ------- | -------- |
| 1 | A Code 39 over 80 characters shows "Invalid barcode" instead of the value | **ANCORA VALIDA** | `watch-android/gradle/libs.versions.toml:34` — `zxingCore = "3.5.4"`. `watch-android/app/src/main/kotlin/com/iferoporefi/myloyaltycards/wear/barcode/WearBarcodeGenerator.kt:92-98` — `catch (_: WriterException) { BarcodeResult.InvalidValue } catch (_: IllegalArgumentException) { BarcodeResult.InvalidValue }`. `BarcodeRenderPipeline.kt:55` — `if (measured !is BarcodeResult.Success) return BarcodeRender.Failed(measured)`, and `:63` — `if (!metrics.canRender) return BarcodeRender.ValueOnly(metrics)` — the ValueOnly path is only reached when the **metrics** cannot render, never when the **measurement** failed. So an over-length Code 39 takes the error screen, not the value-only screen. |
| 2 | No Compose UI test pins the barcode's on-screen placement | **ANCORA VALIDA** | `watch-android/app/src/main/kotlin/com/iferoporefi/myloyaltycards/wear/presentation/BarcodeScreen.kt:648-651` — `private fun Modifier.placeSymbol(metrics: BarcodeLayoutMetrics): Modifier = layout { measurable, _ -> … placeable.place(metrics.leadingQuietPx, 0) }`. `watch-android/app/build.gradle.kts:434-446` — the test dependencies are `libs.junit`, `libs.kotlinx.coroutines.test`, `libs.androidx.datastore.preferences.core`, `libs.robolectric` — no `androidTestImplementation`, no Compose UI-test artifact, and `find watch-android -type d -name androidTest` returns **nothing**. |

**Spec produced:** `docs/sprint-artifacts/stories/16-57-triage-wear-barcode-edge-cases.md` (both items).

---

### Issue #310

`chore(sync): follow-ups for 16-45-signout-keep-or-erase-cards — in-flight sync can restore erased cards` · 2026-11-25 · labels `backlog, needs-triage` ·
source: `docs/sprint-artifacts/stories/16-45-signout-keep-or-erase-cards.md` § "Found, not fixed"

**Problem.** `performSync` calls `batchUpsertCards` after its cloud fetch, and nothing cancels or awaits it on sign-out.

**Verdict: ANCORA VALIDA.**
`shared/hooks/useCloudSync.ts:148-208` — `performSync` awaits `downloadCloudCards(...)` (`:172-179`) and then, unconditionally, `await batchUpsertCards(downloadResult.mergeResult.merged);` (`:194`). There is **no** generation counter, abort signal or session check anywhere in the file: `grep -n "generation\|abort\|AbortController\|isStale\|sessionGeneration\|syncEpoch" shared/hooks/useCloudSync.ts shared/hooks/useAutoSync.ts core/sync/cloud-sync.ts` returns **nothing** (the only hit is the comment at `:70` explaining that the *unmount* hazard was removed — a different concern). The sign-out path (`features/settings/screens/SettingsScreen.tsx:177-215`) awaits `signOut()` and then `deleteAllCards()` (`:198`) with no coordination with an in-flight sync, and `clearLastSyncAt()` (`:190`) touches only the timestamp.

**Spec produced:** `docs/sprint-artifacts/stories/16-46-guard-sync-against-signout.md`.

---

### Issue #311

`chore(sync): follow-ups for 16-45-signout-keep-or-erase-cards — pending deletions survive sign-out` · 2026-11-25 · labels `backlog, needs-triage` ·
source: `docs/sprint-artifacts/stories/16-45-signout-keep-or-erase-cards.md` § "Found, not fixed"

**Problem.** The pending-deletion queue is kept on every sign-out, so a different account signing in next drains the previous account's queued deletions.

**Verdict: ANCORA VALIDA.**
`core/sync/deletion-tracker.ts:3` — `const PENDING_DELETIONS_KEY = 'syncPendingDeletions';` — a **single, account-agnostic** key in AsyncStorage; `addPendingDeletion` (`:9`), `getPendingDeletions` (`:20`), `clearPendingDeletions` (`:40`) and `removePendingDeletions` (`:52`) all read and write that one key, and none of them takes a user id. `clearPendingDeletions` has **no production caller**: `grep -rn "clearPendingDeletions" --include=*.ts --include=*.tsx .` (excluding `node_modules`) returns only its definition (`core/sync/deletion-tracker.ts:40`), the barrel export (`core/sync/index.ts:39`) and its own test (`core/sync/deletion-tracker.test.ts:69,71`). The sign-out path never clears it.

**Spec produced:** `docs/sprint-artifacts/stories/16-46-guard-sync-against-signout.md` (both #310 and #311 — one mechanism, one story).

---

### Issue #312

`chore(tooling): follow-ups for 16-45-signout-keep-or-erase-cards — typecheck fails after expo start` · 2026-11-25 · labels `backlog, needs-triage` ·
source: `docs/sprint-artifacts/stories/16-45-signout-keep-or-erase-cards.md` § "Found, not fixed"

**Problem.** Metro writes the git-ignored `expo-env.d.ts` and `.expo/types`; the `expo/types` reference narrows `process.env.NODE_ENV`, so `test/site-allow-list.test.ts:103` (`{ NODE_ENV: string }`) no longer type-checks.

**Verdict: ANCORA VALIDA.**
`tsconfig.json:23-24` includes `".expo/types/**/*.ts"` and `"expo-env.d.ts"`; `:26` excludes `".expo"` — so the generated types are picked up by the `**/*.ts` glob through the explicit include. `.gitignore:5` — `.expo/` and `:84` — `expo-env.d.ts` confirm both are generated and ignored. `test/site-allow-list.test.ts:98` — `NODE_ENV: 'test'` inside a `gitEnv` object literal built with `Object.fromEntries(...)`, whose inferred type widens `NODE_ENV` to `string`; the narrowing from Expo's types then breaks it.

*Partially verifiable:* the generated files are absent here (no `expo-env.d.ts`, no `.expo/types`), and `node_modules/` is not installed, so `yarn typecheck` could not be run to observe the failure. The structural cause (an un-narrowed `string` in a literal typed against a narrowed `NODE_ENV`) is confirmed by reading the test and the tsconfig. The fix — cast the literal or use `as const` — is independent of the diagnosis and is verifiable in CI.

**Spec produced:** `docs/sprint-artifacts/stories/16-47-fix-typecheck-after-expo-start.md`.

---

### Issue #313

`chore(design): follow-ups for 16-45-signout-keep-or-erase-cards — sign-out sheet frames` · 2026-11-25 · labels `backlog, needs-triage` ·
source: `docs/sprint-artifacts/stories/16-45-signout-keep-or-erase-cards.md` § "Found, not fixed"

**Problem.** The design files still show the old two-button sign-out sheet.

**Verdict: ANCORA VALIDA.**
`docs/design/cardi/frames/cardi-settings-frames.html:1481-1495` — frame D reads:
`<span class="sheet-title">Sign Out?</span>`, `<span class="sheet-body">You will return to guest mode. Your cards will remain on this device.</span>`,
`<button class="btn-destructive">Sign Out</button>`, `<button class="btn-outline">Cancel</button>` — two buttons and the old body.
`docs/design/cardi/stitch-prompts-settings.txt:213-217` — *"the title "Sign Out?" in Space Grotesk 20px bold…"* and *"CONFIRM (two buttons): ExportConfirmationSheet, SignOutSheet, ImportPreviewSheet,"* (`:31`).
The shipped sheet is now three stacked buttons — `features/settings/components/SignOutSheet.tsx:51` `signout-keep`, `:62` `signout-erase`, `:73` `signout-cancel` — with the new body at `shared/i18n/locales/en.ts:216`. Neither design file mentions "keep cards" or "erase cards" (`grep -n -i "erase\|keep cards"` on both files returns only the frame's unrelated lines).

The issue's own note also stands: **Keep and Cancel share the same outlined style.** `features/settings/components/SignOutSheet.tsx` — the keep button and the Cancel button are both secondary/outlined variants.

**Spec produced:** `docs/sprint-artifacts/stories/16-48-update-signout-sheet-frames.md`.

---

## Specs produced

Fourteen story files were written under the BMAD structure the repository already uses
(`docs/sprint-artifacts/stories/`, one file per story, frontmatter + `<frozen-after-approval>` +
`## Intent` + `## Boundaries & Constraints` + `## I/O & Edge-Case Matrix` + `## Code Map` +
`## Tasks & Acceptance` + `## Design Notes` + `## Implementation Notes`).

| Spec | Covers |
| ---- | ------ |
| `docs/sprint-artifacts/stories/16-46-guard-sync-against-signout.md` | #310, #311 (one mechanism, one story) |
| `docs/sprint-artifacts/stories/16-47-fix-typecheck-after-expo-start.md` | #312 |
| `docs/sprint-artifacts/stories/16-48-update-signout-sheet-frames.md` | #313 |
| `docs/sprint-artifacts/stories/16-49-triage-theme-followups.md` | #248 items 1-5, 7, 8, 10, 12, 13; #258 items 3, 7 |
| `docs/sprint-artifacts/stories/16-50-triage-design-system-followups.md` | #251 items 2, 5, 6, 9, 14; #268 item 12; #275 item 12 |
| `docs/sprint-artifacts/stories/16-51-triage-release-followups.md` | #253 items 1-6 |
| `docs/sprint-artifacts/stories/16-52-triage-wallet-followups.md` | #258 items 1, 2, 4, 5, 6, 8, 10, 11, 12, 13 |
| `docs/sprint-artifacts/stories/16-53-triage-capture-and-document-followups.md` | #266 items 1-5, 7, 9, 14, 15; #273 items 2-7, 9, 11-14, 16-23 |
| `docs/sprint-artifacts/stories/16-54-triage-onboarding-followups.md` | #281 (all items) |
| `docs/sprint-artifacts/stories/16-55-triage-watch-followups.md` | #284 items 1, 2, 4, 5, 6, 8, 9, 10, 11 |
| `docs/sprint-artifacts/stories/16-56-triage-store-and-ota-followups.md` | #294 (all items); #298 (all items) |
| `docs/sprint-artifacts/stories/16-57-triage-wear-barcode-edge-cases.md` | #303 (both items) |
| `docs/sprint-artifacts/stories/16-58-dedupe-concurrent-watch-barcode-generation.md` | #45 item 2 |
| `docs/sprint-artifacts/stories/16-59-triage-settings-followups.md` | #271 (all sixteen open items) |

Each spec carries verifiable acceptance criteria (Given/When/Then plus the exact file and line to
change), a code map, an explicit boundary list and an edge-case matrix. The tracker keys
(`16-46-…` … `16-59-…`) are added to `docs/sprint-artifacts/sprint-status.yaml` with status `backlog`,
and the matching `### Story 16.NN` sections are added to `docs/epics.md`, so
`node scripts/check-story-catalogue-sync.mjs` stays green (it reports 230 ↔ 230).

## What was NOT done, and why

- **No push, no branch, no commit.** Everything is left in the working tree for review.
- **No issue was created, edited, closed or commented on** — `gh` is unauthenticated here, and the task
  forbids it regardless.
- **No application code was touched.** Only documentation was written: this report, the story specs,
  the tracker keys and the catalogue sections.

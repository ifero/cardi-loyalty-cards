---
baseline_commit: '4bbfcbd1cd08640a3a80b08f6614744ee6cb8aac'
title: 'The capture and document follow-ups: a camera that never re-checks its permission, an image scan with no feedback, a back button an overlay blocks, and a FAQ that names a deleted screen'
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

**Problem:** The capture redesign (22.5) and the document screens (22.8) left fifteen and twenty-three items behind respectively. The ones still open share one shape: a piece of wiring that the redesign moved and did not re-connect.

- The camera's permission is read once on mount, so on Android a person who enables the camera in Settings and comes back still sees the refused screen.
- An image scan started from the camera-error state gives no feedback at all -- the processing indicator and the no-code banner live in the camera branch only.
- The image-processing overlay sits above the back button, so the person cannot go back while an image decodes.
- The camera keeps running under the card-setup screen, which is pushed over it.
- The FAQ's first answer names the "First-Card Guidance overlay", deleted in June 2026.
- `app/help-fallback.ts` is a route file with no default export; `features/privacy/index.ts` is imported by nothing.
- The policy says the local database is encrypted and that consent can be revoked in Settings; neither is true, and nothing in the app re-asks or revokes consent.

**Approach:** Re-connect the moved wiring, correct the copy that names things which no longer exist, and correct the two remaining privacy claims. The privacy claims are the sensitive ones: the policy's own text has to match what the code does, and the consent controls have to exist or the sentence has to go.

**Decisions (pending ifero's approval):**

- **The permission is re-checked on return to the foreground.** An `AppState` listener re-reads the permission when the app returns to the active state, so the Android "Open Settings" path recovers.
- **The image scan's feedback moves out of the camera branch**, so it is reachable from the camera-error state as well.
- **The processing overlay stops blocking the back button**, by making it non-interactive where it covers the back control rather than by moving the back control.
- **The consent sentence is corrected to the code.** Since no control revokes consent, the policy stops saying one exists -- or a control is added. The recommendation is to correct the sentence, because a revoke-consent control is a larger surface than the sentence is worth.

## Boundaries & Constraints

**Always:** Every user-visible string moves to `en.ts` and `it.ts` together. The privacy copy is corrected in every surface at once -- the two policy files, the two locale files, the public HTML and the store answers -- because `test/privacy-copy.test.ts` sweeps all of them. The camera's behaviour on iOS is unchanged (iOS relaunches the app whose privacy setting changed, so it never had the defect). The capture redesign's visual design is unchanged.

**Never:** Add a camera permission prompt the app does not already ask for. Change the scanner's frames. Change the privacy policy's _version_ (1.0.0) or its date without a product decision. Change the app's data collection -- this story makes the copy honest, it does not change what is sent. Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario                        | Input / State                                                             | Expected Output / Behavior                                                         | Error Handling                                              |
| ------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Android, Settings round trip    | The person refuses the camera, opens Settings, enables it, and comes back | The scanner re-reads the permission and shows the viewfinder                       | The refused screen stays if the permission is still refused |
| Image scan from the error state | The person taps "Scan from image" on the camera-error screen              | The processing indicator shows, and the no-code banner appears if nothing is found | The existing retry and manual-entry options stay reachable  |
| Image decoding                  | An image is decoding                                                      | The back button is still reachable                                                 | N/A                                                         |
| Card setup over the scanner     | The person scans and lands on setup                                       | The camera is not running behind the setup screen                                  | N/A                                                         |
| FAQ lookup                      | A person searches for "add a card"                                        | The answer names a screen that exists                                              | N/A                                                         |
| Help fallback route             | The app registers its routes                                              | The dead route file is gone; the routes register cleanly                           | N/A                                                         |
| Consent, reading the policy     | A person reads the policy                                                 | Every sentence about what is collected and what can be revoked is true             | N/A                                                         |
| Consent, changing it            | A person wants to revoke consent                                          | The policy says what can actually be done                                          | N/A                                                         |

</frozen-after-approval>

## Code Map

- `features/cards/hooks/useBarcodeScanner.ts:101` -- `const [permission, requestPermission] = useCameraPermissions();` -- read once, never re-read. `features/cards/hooks/useCardBrightnessBoost.ts:23,69` is the repo's existing `AppState` precedent (it registers a listener on focus and removes it on blur).
- `features/add-card/components/ScannerOverlay.tsx:584-618` -- the camera-error branch: it returns early with `<CameraMessage>` and the "Scan from image" button (`:594-603`), so the processing overlay (`:690-695`) and the `NoCodeFoundBanner` (`:713`) are unreachable from that state.
- `features/add-card/components/ScannerOverlay.tsx:838-845` -- `processingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', gap: SPACING.smMd, zIndex: 20 }`, with no `pointerEvents`; the back disc's row is at `zIndex: 10` (`:770`). The overlay covers the whole screen, so it also covers the back control.
- `features/add-card/components/ScannerOverlay.tsx:633` -- `<CameraView` with no `active` prop; the camera keeps running under the setup screen.
- `features/cards/hooks/useBarcodeScanner.ts:20-27` -- `BARCODE_FORMAT_MAP`, which knows `code39` but not `org.iso.code39` (the raw AVFoundation type expo-camera's ZXing fallback reports).
- `features/help/help-data.json:5` and `docs/help.json:5` -- _"If you have no cards yet, the First-Card Guidance overlay appears on the home screen."_ The overlay was deleted in `92235b1b fix(onboarding): keep signed-in users out of the welcome redirect loop (Story 13.7b) (#119)`.
- `app/help-fallback.ts` -- one line, `export { fallbackHelpItems, type HelpItem } from '@/features/help/help-fallback';`, with no default export; Expo Router skips it in development and registers an empty route in production.
- `features/privacy/index.ts` -- `export { default } from './PrivacyPolicyScreen';`, imported by nothing; it exports no `DataSummaryScreen`.
- `core/privacy/consent-repository.ts:79` -- `export const needsReConsent = (): boolean => {` -- its only callers are `core/privacy/consent-repository.test.ts:146,149`. `revokeConsent` and `logConsentEvent` appear only in that test file.
- `core/privacy/constants.ts:7-8` -- the comment says the app re-prompts on the next launch when the policy version changes; no control does.
- `assets/legal/privacy-policy.ts:87` -- _"The database itself is not encrypted"_ (already corrected by Story 24.1) and `:104-107` -- the rights section; the Italian at `assets/legal/privacy-policy.it.ts:75` — _"Diritto di revoca del consenso - puoi revocare il consenso eliminando il tuo account"_.
- `features/privacy/PrivacyPolicyScreen.tsx:115` -- the meta line shows the raw ISO date (`PRIVACY_POLICY_LAST_UPDATED`, `assets/legal/privacy-policy.ts:26` = `'2026-11-05'`); `:136` -- the contact paragraphs are not `selectable`.
- `shared/components/ui/SearchBar.tsx:100`, `:103`, `:114` -- the shared field's three default copy strings, taken from the wallet's; `:133` -- the fixed 48pt height that the typed text overflows at the largest text size.
- `shared/components/ui/DocumentScreen.tsx:60-75` -- the shared document ground; `features/settings/screens/SettingsScreen.tsx:341` renders `AboutSection` instead, so the two can drift.
- `features/help/FaqItem.tsx:121,191` -- the answer's measured height, animated but never scrolled into view.
- `shared/components/ui/ActionRow.tsx:17` -- the "1.5 is the first of the accessibility sizes" comment (also #275 item 17).
- `features/cards/hooks/useCardSearch.ts:41-42`, `features/add-card/hooks/useBrandSearch.ts:51-53`, `features/help/HelpScreen.tsx:73-78` -- three substring searches with no accent folding.
- `shared/components/ui/TextField.tsx` -- no `keyboardAppearance` prop is forwarded, so the keyboard draws light in the app's dark theme with the system in light.
- `test/privacy-copy.test.ts:20-33` -- the `SURFACES` list the privacy sweep reads; `:38-70` -- `RETIRED_CLAIMS`, the phrases the build now rejects.
- Do not change: the scanner's frames, `expo-camera`'s configuration, the privacy policy's version and date.

## Tasks & Acceptance

**Execution:**

- [ ] `features/cards/hooks/useBarcodeScanner.ts` -- re-read the camera permission when the app returns to the foreground, so the Android "Open Settings" path recovers; the listener is removed on unmount, as `useCardBrightnessBoost` does.
- [ ] `features/add-card/components/ScannerOverlay.tsx` -- the image scan's processing indicator and the no-code banner are reachable from the camera-error branch as well as the camera branch.
- [ ] `features/add-card/components/ScannerOverlay.tsx` -- the processing overlay does not block the back control (the overlay's pointer handling, or the back control's z-order, is corrected -- not the back control's position).
- [ ] `features/add-card/components/ScannerOverlay.tsx` -- the camera is not running while the card-setup screen is pushed over it.
- [ ] `features/cards/hooks/useBarcodeScanner.ts` -- `BARCODE_FORMAT_MAP` knows `org.iso.code39` (and any other raw AVFoundation type the ZXing fallback reports), so a Code 39 read by the camera is stored as Code 39.
- [ ] `features/help/help-data.json`, `docs/help.json`, `features/help/help-data.it.json`, `features/help/help-fallback.ts` -- the FAQ answers name screens that exist; the Italian mirror keeps its accent ("Perché").
- [ ] `app/help-fallback.ts` -- delete the dead route file; `features/privacy/index.ts` -- delete it, or export what its consumers need.
- [ ] `assets/legal/privacy-policy.ts`, `assets/legal/privacy-policy.it.ts`, `docs/privacy-policy.html`, `shared/i18n/locales/en.ts`, `it.ts` -- every claim about consent matches what the code does: the sentence about revoking consent in Settings is corrected, and the policy's date and the "last updated" line are corrected if the text changes.
- [ ] `core/privacy/consent-repository.ts` -- `needsReConsent` gets a production caller, or the constant's comment is corrected to say the app does not re-prompt.
- [ ] `features/privacy/PrivacyPolicyScreen.tsx` -- the meta line shows a formatted date, and the contact paragraphs are `selectable`.
- [ ] `shared/components/ui/SearchBar.tsx` -- the default copy props are required, or neutral; the field's height grows with the text at the largest size.
- [ ] `shared/components/ui/DocumentScreen.tsx`, `features/settings/screens/SettingsScreen.tsx` -- the settings document ground is either the shared one or a documented exception.
- [ ] `features/help/FaqItem.tsx` -- an answer opened near the bottom of the screen is scrolled into view.
- [ ] The three substring searches (`useCardSearch.ts`, `useBrandSearch.ts`, `HelpScreen.tsx`) fold accents before matching.
- [ ] `shared/components/ui/TextField.tsx` -- forward `keyboardAppearance`, so the keyboard follows the app's theme.
- [ ] `shared/components/ui/ActionRow.tsx:17` -- the comment is corrected (the 1.5 cut-off, not "the first of the accessibility sizes").
- [ ] `yarn lint`, `yarn typecheck`, `yarn test` -- green; `test/privacy-copy.test.ts` still passes.

**Acceptance Criteria:**

- Given an Android device where the camera was refused, when the person enables it in Settings and returns to the app, then the scanner shows the viewfinder instead of the refused screen.
- Given the camera-error screen, when the person taps "Scan from image", then a processing indicator appears, and a no-code banner appears if nothing is found.
- Given an image that is decoding, when the person taps the back control, then the back control is reachable and the back gesture works.
- Given a card setup screen pushed over the scanner, when it is open, then the camera is not running.
- Given an iOS camera scan of a Code 39, when the card is saved, then its format is Code 39, not Code 128.
- Given a search for "add a card" in Help, when the answer opens, then it names a screen that exists.
- Given the app's route list, when Expo Router registers it, then no empty route is registered from a dead file.
- Given the privacy policy in either language, when a person reads the consent paragraph, then it says what the app actually lets them do.
- Given the policy's meta line, when it renders, then the date is a formatted date, not an ISO string.
- Given the policy's contact address, when a person tries to copy it, then the text is selectable.
- Given a search for "perche" or "PERCHE" in Help, when the results appear, then the Italian answer is found.
- Given a person typing in a search field at the largest text size, then the text stays inside the field.
- Given the app in dark mode with the system in light, when a text field takes focus, then the keyboard is dark.

## Design Notes

The capture items are all the same thing: Story 22.5 rebuilt the scanner's states and moved the feedback into the camera branch, but the camera-error branch and the overlay layer were not revisited. The result is a path (image scan from the error state) that is reachable in the UI and silently does nothing.

The permission re-check is the one that matters most on a real device: the current behaviour strands someone who has done exactly what the app asked them to do.

The privacy items are delicate in a different way. Story 24.1 corrected most of the copy, but two claims survive because they are about _consent_ rather than about data: that the database is encrypted (already corrected) and that consent can be revoked in Settings (not corrected, because the Italian policy phrases the revocation as "delete your account"). The recommendation is to correct the sentence rather than build a revoke control, because a revoke control is a new surface with its own copy, its own state and its own edge cases -- and deleting the account already does what the sentence describes.

## Implementation Notes

- Source issues: #266 (items 1, 2, 3, 4, 5, 7, 9, 14, 15) and #273 (items 2, 3, 4, 5, 6, 7, 9, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22, 23).
- #266 item 6 is **closed**: `features/add-card/hooks/useImageScan.ts:108-109` routes a `upc_e` result through
  `expandUpcE`, landed in `87b0808 fix(add-card): store UPC-E image scans as EAN-13 (Story 16.25) (#301)`.
- #273 item 10 is **mostly closed** by Story 24.1 (`90f9de4`): the encrypted-database claim, the
  no-analytics claim, the device-ID claim and the guest claim are all corrected, and
  `test/privacy-copy.test.ts` now fails the build on the old wording. One residue survives:
  `docs/store/listing.md:315` still says "no tracking" and is not in the test's `SURFACES` list
  (`:20-33`) -- so it is unguarded. That is part of the privacy sweep in this story.
- #273 item 15 is **closed**: `app.json:12` is now `"supportsTablet": false` (Story 24.6, `da43fab`).
- #273 items 1 and 2 (the FAQ's dead screen, the missing accents) and #266 item 9 (the stale design note
  at `docs/ux-designs/2-9-scan-from-image.md:138`, which its own table at `:338` already contradicts) are
  documentation corrections with no behaviour change.
- The camera permission's `AppState` re-read is the same shape as `features/cards/hooks/useCardBrightnessBoost.ts:69`,
  which registers on focus and removes on blur -- the repo's precedent for a foreground listener.
- The iOS path was never affected (iOS relaunches an app whose privacy setting changes), so the re-read is
  an Android fix; it must not change iOS's behaviour.
- `features/help/help-data.it.json` and `features/help/help-fallback.ts` are the Italian FAQ's two homes;
  `docs/help.json` is the English copy that the site or another surface reads. All three must agree.
- `features/help/FaqItem.tsx` already measures the answer's content height (`:121`, `:191`) and animates it;
  the missing piece is scrolling the opened answer into view.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors
- `yarn lint` -- expected: no errors
- `yarn format:check` -- expected: clean
- `yarn test` -- expected: all suites pass

**Manual checks (if no CLI):**

- On an Android device: refuse the camera, enable it in Settings, come back, and confirm the scanner
  recovers.
- On an iOS simulator: from the camera-error screen, start an image scan and confirm the indicator appears.
- On an iOS simulator: start an image scan and confirm the back control is reachable while it decodes.
- Read the privacy policy in both languages and confirm every consent claim matches the app.

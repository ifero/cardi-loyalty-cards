---
title: 'Store listings and screenshots'
type: 'feature'
created: '2026-11-04'
status: 'in-review'
baseline_commit: '13530ce1308f50c1b46bcb98742e841881dad90f'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
  - '{project-root}/docs/sprint-artifacts/stories/24-1-privacy-copy-and-store-disclosures.md'
  - '{project-root}/assets/store/README.md'
  - '{project-root}/docs/design/wear-store-screenshots/README.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Neither store has a public-ready Cardì listing:

- No listing copy has been written.
- No phone or Apple Watch screenshots exist.
- The two Wear OS screenshots are 384 px debug placeholders showing fixture names (`Aztec (unsupported)`) and the pre-23.3 palette. That is 21.5's AC5, still open.
- `app.json` declares `supportsTablet: true`, which would make App Review test an iPad layout the design never drew.
- The landing page's store badges link to `#`, and its hero and Screenshots section still show placeholder SVG frames.

**Approach:**

- Make the app iPhone-only.
- Capture every screenshot set the two stores require, in English and Italian, from a fictional demo card set.
- Write the listing copy and the App Review note into `docs/store/listing.md`, which ifero pastes into the consoles.
- Point the landing page's badges at the listings, and replace its placeholder frames with web-sized copies of the real captures.

## Boundaries & Constraints

**Decisions (ifero, 2026-11-04):**

1. **iPhone only.** `supportsTablet: false`. iPad users run the app as an iPhone app in compatibility mode. This is decided at 1.0 because Apple does not let an app drop iPad support later.
2. **Two catalogue brands in the screenshots, none in the text** (revised by ifero 2026-11-13; the 2026-11-04 version allowed no brand at all). Competing wallets (Barcodes, ShowCards and others) show retailer logos because they are far more recognisable. ifero accepts the risk that App Review rejects third-party trademarks without permission (guidelines 5.2.1 and 4.1). So:
   - screenshots show the demo set with two catalogue brands, Esselunga and IKEA, beside invented shops; the Italian sets (and the Italian site images) also show a Codice Fiscale card;
   - the copy and keywords name no retailer;
   - the App Review note says the logos in the screenshots are shown as a user's own cards, that Cardì is not affiliated with those companies, and that the catalogue only helps users identify their own cards.
3. **Wear capture from a debug build with a demo seed** (a flag selects the demo set over the error-path fixtures). No keystore and no paired phone; the UI is the same as release.
4. **Listing copy lives in the repo:** `docs/store/listing.md`, a dated record of what was submitted. Nothing uploads it.
5. **The Codice Fiscale belongs in the Italian listing and site** (ifero, 2026-11-13): the Italian descriptions and the site say the app holds it too.

**Always:**

- **Required sets.** Every set is a capture of the real app UI, with no added text or device frames for Play, and no alpha channel.

  | Store     | Set                                                         | Count             |
  | --------- | ----------------------------------------------------------- | ----------------- |
  | App Store | iPhone 6.9" (1320×2868)                                     | 3 to 6 per locale |
  | App Store | Apple Watch (the largest current size)                      | 2 per locale      |
  | Play      | Phone, 9:16                                                 | 3 to 6 per locale |
  | Play      | Wear OS, 1:1, round, larger than 384 px where an AVD allows | 2 per locale      |

- **Barcode screenshots** are taken after 16.38 (Wear) has landed.
- **Copy:**
  - The name is `Cardì`.
  - Every listing claim matches Story 24.1's disclosures and `docs/store/privacy-disclosures.md`.
  - The copy states that the app works offline, that cloud sync is optional, and that it is open source.
  - Age rating 4+ / Everyone.
- **Privacy-policy URL:** `https://cardiapp.eu/privacy-policy.html` (18.9).
- **Assets:**
  - Screenshots are committed under `assets/store/screenshots/<store>/<locale>/`, with a README naming the device, build and date.
  - The generated `assets/store/` artwork is unchanged, and `icons:check` still passes.
  - `docs/design/wear-store-screenshots/` is retired, with a pointer to the new folder.
  - The landing page shows the real captures, per language, from web-sized copies in `docs/assets/screenshots/` (the site deploy publishes only `docs/`); the placeholder SVGs and the page's "placeholder" wording are gone.

**Never:**

- Use a catalogue brand other than Esselunga, IKEA and Codice Fiscale, or a real card number or a valid codice fiscale, in any asset.
- Upload anything to either console (that is ifero's step).
- Create `fastlane/metadata/`.
- Change app UI.
- Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario      | Input / State                           | Expected Output / Behavior                                           | Error Handling                     |
| ------------- | --------------------------------------- | -------------------------------------------------------------------- | ---------------------------------- |
| iPad install  | `supportsTablet: false`, app on an iPad | Runs in iPhone compatibility mode; no iPad screenshots required      | N/A                                |
| Demo seed     | Wear debug build with the flag on       | Only the demo set; no `(unsupported)` or `(invalid)` fixtures        | The flag is off → today's fixtures |
| Release build | Any release Wear build                  | No seeder at all (R8 strips it, as today)                            | N/A                                |
| Asset check   | Any committed screenshot                | Matches its store's size, aspect and no-alpha rule                   | The test fails                     |
| Badge links   | `docs/index.html` badges                | Point at the Play and App Store listing URLs                         | N/A                                |
| Site previews | `docs/index.html` hero and Screenshots  | Every image is a real capture in the page's language; no placeholder | A missing file → the test fails    |

</frozen-after-approval>

## Code Map

- `app.json` -- `expo.ios.supportsTablet: true`, becomes false. 24-2 also edits `app.json`; this lands after it.
- `assets/store/README.md` -- the artwork table and the "listing text is not here" section. Rewrite it to point at `docs/store/listing.md` and the screenshot folders.
- `scripts/build-brand-icons.mjs`, `test/store-artwork.test.ts` -- the artwork generator and its spec test. Extend the test pattern to the screenshot rules.
- `docs/design/wear-store-screenshots/README.md` -- the three historical blockers; 23.3 cleared the palette one.
- `watch-android/.../wear/MainActivity.kt`, `WearGraph.kt` (`seedSampleCardsIfEmpty`), `DebugSampleCards` -- the debug seeder. Add the demo set and a flag, for example the Gradle property `wearDemoSeed=true` read into `BuildConfig`.
- Phone and Apple Watch demo cards -- entered as custom cards through the app on the simulator. The Apple Watch receives them over the simulator pair; no code is needed.
- `docs/index.html:86-102` -- badge links with `href="#"`.
- `docs/store/privacy-disclosures.md` (Story 24.1) -- the claims the copy must match.

## Tasks & Acceptance

**Execution:**

- [x] `app.json` -- `supportsTablet: false`. Rationale: decision 1.
- [x] `watch-android/` -- the demo seed behind a flag, with a unit test that the release variant has no seeder and that the flag swaps the set. Rationale: decision 3.
- [x] `assets/store/screenshots/**` + README -- every required set, both locales. Rationale: the listings.
- [x] `test/store-screenshots.test.ts` (new) -- sizes, aspect, no alpha, and a full count per store and locale. Rationale: catches a wrong export.
- [x] `docs/store/listing.md` (new) -- EN/IT name, subtitle, short and full descriptions, keywords, promotional text, categories, age-rating answers, support and privacy URLs, and the App Review note. Rationale: decision 4.
- [x] `docs/index.html` -- badge URLs. The Play URL is derived from the package id; the App Store id comes from ifero once the app record exists. Rationale: a working landing page.
- [x] Docs -- `assets/store/README.md`, and retire `docs/design/wear-store-screenshots/`. Rationale: one source.
- [x] `docs/index.html`, `docs/style.css`, `docs/assets/screenshots/` -- the hero and Screenshots section show web-sized EN/IT copies of the iPhone and Apple Watch captures, framed in CSS; placeholder SVGs and wording removed; a test that every preview image exists and none is a placeholder. Rationale: the landing page shows the app (added 2026-11-13, ifero).

- [x] Brands and codice fiscale (added 2026-11-13, ifero) -- demo sets `assets/store/screenshots/demo-cards.json` (EN) and `demo-cards-it.json` (IT, adds the Codice Fiscale card) and `DebugSampleCards.DEMO` swap two invented shops for Esselunga and IKEA; every store set and the site images are recaptured; the Italian descriptions and site copy mention the codice fiscale; the App Review note and the tests follow decision 2 as revised. Rationale: decisions 2 and 5.
      **Acceptance Criteria:**

- Given `docs/store/listing.md`, when it is read against `docs/store/privacy-disclosures.md`, then no claim contradicts it, and no retailer is named.
- Given every screenshot, when it is inspected, then the only catalogue logos are Esselunga and IKEA (plus Codice Fiscale in the Italian sets), and no real card number, valid codice fiscale or test fixture appears.
- Given the Italian listing and the Italian landing page, when they are read, then they say the app holds the codice fiscale.
- Given a build with `supportsTablet: false`, when it runs on an iPad simulator, then it opens in iPhone compatibility mode.
- Given the landing page in either language, when it loads, then the hero and the Screenshots section show real captures in that language, and no placeholder image or wording remains.

## Implementation Notes

- **Implementation.** A subagent built most of the story. The orchestrator captured the two sets it could not: the Play phone set (the API 37 phone AVD hung because a stale emulator crash-report consent dialog was waiting; clearing `/tmp/android-<user>/emu-crash-*.db` let it boot) and the Apple Watch `watch-02-barcode` (a tap on the watch simulator, once ifero granted access). `scripts/flatten-store-screenshots.mjs` is the one file outside the Code Map; it makes the RGB flattening repeatable. `assets/store/screenshots/demo-cards.json` is the phone demo set, committed so the captures can be repeated.
- **Captures (2026-11-13), all from this branch:** iPhone 17 Pro Max + Apple Watch Ultra 3 simulators (Release build), AVD `cardi_phone_916` 1080 × 1920 API 37 (release APK), AVD `cardi_wear_xl_round_34` 480 × 480 (debug, `-PwearDemoSeed=true`). Each file was read back against decisions 1 to 3: invented shops only, no catalogue logo, no real card number, no fixture.
- **iPad:** the Release build with `supportsTablet: false` opened in iPhone compatibility mode on an iPad simulator (`TARGETED_DEVICE_FAMILY = 1`).
- **Decided by ifero (2026-11-13): the Google Play badge stays live.** It points at the listing as the spec's Badge-links row asks, accepting that until the Play production listing is public the link shows Play's "not found" page.
- **Device check (2026-11-13).** Changed paths that reach an app: iPhone-only (iPad simulator, Release build: the app opens in an iPhone-sized compatibility window) and the Wear demo seed (AVD `cardi_wear_xl_round_34`, debug with `-PwearDemoSeed=true`: only the six invented cards, no `(unsupported)` or `(invalid)` fixture). Phone app UI is unchanged; its light and dark states are in the committed screenshots. Wear OS has a dark theme only. Screenshots are outside the repository, in the session scratchpad (`ipad.png`, `wear/`, `watch/`, `play-en/`, `play-it/`). Unchecked: nothing that needs hardware is touched by this change. Every later fix (round 1 patches) is test- or docs-only and does not reach an app.

- **Landing-page previews (added 2026-11-13).** Six JPEGs in `docs/assets/screenshots/` (iPhone captures at 660 px wide, watch at 422 × 514, about 40 to 90 KB each) replace the six placeholder SVGs under the same names; the device bezel is CSS (`docs/style.css`), ink in both colour schemes, so no image assets had to be drawn. `test/landing-screenshots.test.ts` holds every preview to an existing JPEG of its declared size, an Italian twin for each English image, and no placeholder. Checked in the browser (local `python3 -m http.server` on `docs/`): EN light and dark at desktop width, IT at 375 px (all five visible images load, no horizontal scroll).

- **Brands and codice fiscale (2026-11-13, decisions 2 and 5).** Recaptured every screen that shows cards, on the same devices and builds as before: iPhone 01, 02, 04 and Apple Watch 01, 02 (EN: Esselunga detail and barcode; IT: Codice Fiscale detail and barcode), Play phone 01, 02, 04 (same split), Wear OS 01, 02 (Esselunga; Wear draws initials, not logos). `iphone-03` and `phone-03` show no cards and are unchanged. The site JPEGs were regenerated from the new iPhone and watch captures. The codice fiscale shown is `RSSMRA90A41H501N`: its check character is deliberately wrong (the valid one is `A`, checked against the published example `RSSMRA85T10A562S`), so it is no one's code. The phone emulator stopped answering adb mid-run and was cold-booted again; nothing else changed in the recipe.

### Found, not fixed

- Italian onboarding carousel, first slide: the last line of the body ("alla cassa") is clipped by the divider above the dots on a 1080 × 1920 Android phone. Existing app UI, out of scope (Never: change app UI); not in any screenshot.
- `scripts/flatten-store-screenshots.mjs` has no round-trip test of its PNG decoder (verification-gap review). A one-off capture tool whose output is reviewed by eye; worth a test if the screenshots are recaptured regularly.
- `WearGraph.seedSampleCardsIfEmpty(ctx, demo)` is not tested at the point where it uses `demo` (only `DebugSampleCards.forSeed` is). Debug-only one-hop pass-through; a Robolectric/Room test costs more than the risk.

## Spec Change Log

- **2026-11-13, during the walkthrough (ifero: "let's go with option 2 ... it's much more recognisable", and "include the codice fiscale for the italian store listings and website").** Decision 2 reversed in part: Esselunga and IKEA appear in every screenshot set, the copy and keywords still name no retailer. Decision 5 added. Amended (frozen block, with ifero's approval): decision 2, decision 5, the Never rule on brands, one task and two acceptance criteria. Known risk accepted by ifero: App Review may reject trademarked logos in screenshots (5.2.1, 4.1). KEEP: every capture recipe, test and tool already approved; the codice fiscale shown is never a valid one.

- **2026-11-13, during the walkthrough (ifero: "Yes, in 24-6").** Trigger: the landing page still showed placeholder frames labelled "ready for real captures", which the original spec never mentioned, so no review caught it. Amended (frozen block, with ifero's approval): the Problem and Approach bullets, an Assets requirement, a Site previews matrix row, one task and one acceptance criterion. Known-bad state avoided: a public page advertising placeholder frames beside live store badges. KEEP: every earlier task, test and screenshot as approved; the store captures under `assets/store/screenshots/` are not changed, only copied and resized for the web.

## Review Triage Log

Round 1 (step 4: blind, edge-case, verification-gap and conventions layers).

| #   | Source                   | Finding                                                                                             | Verdict | Route / evidence                                                                                                                                                                                               |
| --- | ------------------------ | --------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | verification-gap         | Landing-page click guard for live badges never executed by a test                                   | medium  | patch: `test/landing-store-badges.test.ts` runs the inline script in jsdom and clicks both badges; fails with the guard removed (checked)                                                                      |
| 2   | verification-gap         | Flattener's PNG decoding never tested                                                               | medium  | defer (filed disposition); under Found, not fixed                                                                                                                                                              |
| 3   | verification-gap         | Demo flag not verified where `WearGraph` uses it                                                    | low     | defer (filed disposition); under Found, not fixed                                                                                                                                                              |
| 4   | verification-gap (other) | Second PNG decoder beside `test/png-scanlines.ts`                                                   | low     | rejected: a standalone Node script cannot import the TS test helper; no named caller diverges                                                                                                                  |
| 5   | edge-case, blind         | Play badge live before the Play listing is public                                                   | medium  | to the human: ifero kept the badge live (2026-11-13); see Implementation Notes                                                                                                                                 |
| 6   | edge-case, blind         | Flattener drops colour-profile chunks, P3 captures shift                                            | false   | fresh `simctl` and `adb` captures carry only an `sRGB` chunk (no `iCCP`); an untagged PNG is read as sRGB, so nothing shifts                                                                                   |
| 7   | edge-case                | Truncated IDAT silently written as black rows                                                       | low     | rejected: captures come from `simctl`/`adb`, a truncated one is not met in use, and the fix is a new guard                                                                                                     |
| 8   | edge-case                | Chunk length past buffer end throws mid-batch                                                       | low     | rejected: same reasoning as 7                                                                                                                                                                                  |
| 9   | edge-case                | A set file in the wrong store folder escapes every rule                                             | low     | rejected: unlikely (files are named by hand to the README table) and the fix adds a guard                                                                                                                      |
| 10  | edge-case                | Empty set folder makes `it.each([])` error and hide the count failure                               | low     | rejected: the count test still fails beside it, and the fix adds a branch                                                                                                                                      |
| 11  | edge-case                | Keyword list with empty or case-duplicate entries passes                                            | low     | rejected: the two keyword fields are written once and reviewed; fix adds assertions for a case not met                                                                                                         |
| 12  | edge-case                | `aBuildWithoutTheProperty_hasTheFlagOff` fails under `-PwearDemoSeed=true`                          | low     | patch: test deleted; `test/wear-demo-seed.test.ts` already pins the default from source                                                                                                                        |
| 13  | edge-case                | Google Play "coming soon" copy now dead                                                             | false   | the entry serves the `#` fallback the script keeps, and depends on row 5's decision                                                                                                                            |
| 14  | edge-case (claim)        | "Release variant has no seeder" checked only from source                                            | false   | release exclusion is R8 stripping plus a `release` override, neither of which a JVM unit test can run; `test/wear-demo-seed.test.ts` pins both, which is what the task asks                                    |
| 15  | edge-case (claim)        | Listing says crash reports carry no account, email or card data, while disclosures' checks are open | false   | `docs/store/privacy-disclosures.md` states the same ("carry no user, account, install or device" identifiers); its open boxes are its own pre-submission gate, which says not to submit before they are ticked |
| 16  | blind                    | Phone demo export not in the repository                                                             | medium  | patch: committed as `assets/store/screenshots/demo-cards.json`, README points at it                                                                                                                            |
| 17  | blind                    | Flattener never checks the capture is opaque                                                        | low     | rejected: every capture is opaque (checked by eye) and the fix adds a guard                                                                                                                                    |
| 18  | blind                    | Italian claim checks satisfied by the English copy                                                  | low     | patch: the claim test now runs per language section                                                                                                                                                            |
| 19  | blind                    | "Nothing leaves the device" guard misses Italian phrasings                                          | low     | rejected: the copy is reviewed by hand and the guard is a backstop; widening it is speculative                                                                                                                 |
| 20  | blind                    | Kotlin test docstring claims more than it checks                                                    | low     | patch: reworded to what the tests assert                                                                                                                                                                       |
| 21  | blind                    | iPhone-only test reads `app.json`, not the resolved config                                          | false   | `app.config.ts` sets nothing under `ios` that touches tablets, and the prebuilt project has `TARGETED_DEVICE_FAMILY = 1`                                                                                       |
| 22  | blind                    | Wear barcode shots identical across locales, unexplained                                            | low     | patch: one README line                                                                                                                                                                                         |
| 23  | blind                    | "The UI is the same as release" unsupported                                                         | false   | that is decision 3 as ifero approved it; the debug-only difference is the empty-state seed button, which no screenshot shows                                                                                   |
| 24  | blind                    | "on top of `main` at `13530ce`" goes stale after a rebase                                           | false   | the README is a dated capture record; that commit is what the captures came from                                                                                                                               |
| 25  | blind                    | Listing omits the Wear OS form-factor answer                                                        | low     | patch: one row in the Shared answers table, with the manifest's `standalone = false`                                                                                                                           |
| 26  | blind                    | Play "Tags … if offered" is a hedge                                                                 | low     | patch: the row now says the tags are chosen at submission and recorded there                                                                                                                                   |
| 27  | blind                    | Spec and tracker missing from the diff                                                              | false   | excluded on purpose (DIFF FOR REVIEW)                                                                                                                                                                          |
| 28  | conventions              | No violations                                                                                       | n/a     | n/a                                                                                                                                                                                                            |

Review loops.

| #   | Round  | Finding                                                                                                                                                                         | Verdict            | Route / evidence                                                                                                                                           |
| --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1  | code 1 | Age-rating answer claims links to the privacy policy and GitHub the app does not open                                                                                           | medium             | fixed: the only `Linking.openURL` is `features/help/HelpScreen.tsx` with `mailto:support@cardiapp.eu`; the sentence now says so and names the Help buttons |
| L2  | code 2 | Descriptions say favourites stay on top for every sort                                                                                                                          | medium             | fixed in all four description blocks: `useCardSort.ts` pins favourites under A-Z and Frequently used, not under Recently added                             |
| L3  | code 3 | APPROVED, no findings                                                                                                                                                           | n/a                | code loop closed                                                                                                                                           |
| L4  | QA 1   | APPROVED, no findings: every matrix row and acceptance criterion mapped to a test, the device check or the screenshot inspection                                                | n/a                | QA loop closed                                                                                                                                             |
| L5  | code 4 | APPROVED, no findings, after the landing-page scope addition (Spec Change Log)                                                                                                  | n/a                | code loop closed again                                                                                                                                     |
| L6  | QA 2   | APPROVED, no findings, including the Site previews row and the landing-page criterion                                                                                           | n/a                | QA loop closed again                                                                                                                                       |
| L7  | code 5 | `build.gradle.kts` comment still described the demo set as brand-free                                                                                                           | low (comment only) | fixed: the comment names Esselunga and IKEA                                                                                                                |
| L8  | code 6 | `listing.md` said the test checks the whole file names no retailer; decision numbers in the spec did not match the code (decision 5 had been inserted as item 3 and renumbered) | low                | fixed: the paragraph says what the test checks; decision 5 moved to the end of the list, restoring 3 = Wear seed and 5 = codice fiscale as approved        |
| L9  | code 7 | APPROVED, no findings, after the brands and codice fiscale change                                                                                                               | n/a                | code loop closed again                                                                                                                                     |
| L10 | QA 3   | APPROVED, no findings, including the revised screenshot criterion and the codice fiscale criterion                                                                              | n/a                | QA loop closed again                                                                                                                                       |

## Verification

**Commands:**

- `yarn typecheck`, `yarn lint`, `yarn format:check`, `yarn test`, `yarn icons:check` -- expected: pass
- `cd watch-android && ./gradlew testDebugUnitTest assembleDebug` -- expected: green

**Manual checks (if no CLI):**

- Read every screenshot against the decisions above, in both locales. The iPad compatibility-mode launch.

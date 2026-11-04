---
title: 'Store listings and screenshots'
type: 'feature'
created: '2026-11-04'
status: 'ready-for-dev'
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
- The landing page's store badges link to `#`.

**Approach:**

- Make the app iPhone-only.
- Capture every screenshot set the two stores require, in English and Italian, from a fictional demo card set.
- Write the listing copy and the App Review note into `docs/store/listing.md`, which ifero pastes into the consoles.
- Point the landing page's badges at the listings.

## Boundaries & Constraints

**Decisions (ifero, 2026-11-04):**

1. **iPhone only.** `supportsTablet: false`. iPad users run the app as an iPhone app in compatibility mode. This is decided at 1.0 because Apple does not let an app drop iPad support later.
2. **No third-party brands in the listing.** Competing wallets (Barcodes, ShowCards and others) do show retailer logos, but App Review rejects third-party trademarks in screenshots and metadata without permission (guidelines 5.2.1 and 4.1). So:
   - screenshots show only a fictional demo set (invented shops, custom card colours, no catalogue logos);
   - the copy and keywords name no retailer;
   - the App Review note explains that catalogue logos only help users identify their own cards.
3. **Wear capture from a debug build with a demo seed** (a flag selects the demo set over the error-path fixtures). No keystore and no paired phone; the UI is the same as release.
4. **Listing copy lives in the repo:** `docs/store/listing.md`, a dated record of what was submitted. Nothing uploads it.

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

**Never:**

- Use catalogue brands or real card numbers in any asset.
- Upload anything to either console (that is ifero's step).
- Create `fastlane/metadata/`.
- Change app UI.
- Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario      | Input / State                           | Expected Output / Behavior                                      | Error Handling                     |
| ------------- | --------------------------------------- | --------------------------------------------------------------- | ---------------------------------- |
| iPad install  | `supportsTablet: false`, app on an iPad | Runs in iPhone compatibility mode; no iPad screenshots required | N/A                                |
| Demo seed     | Wear debug build with the flag on       | Only the demo set; no `(unsupported)` or `(invalid)` fixtures   | The flag is off → today's fixtures |
| Release build | Any release Wear build                  | No seeder at all (R8 strips it, as today)                       | N/A                                |
| Asset check   | Any committed screenshot                | Matches its store's size, aspect and no-alpha rule              | The test fails                     |
| Badge links   | `docs/index.html` badges                | Point at the Play and App Store listing URLs                    | N/A                                |

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

- [ ] `app.json` -- `supportsTablet: false`. Rationale: decision 1.
- [ ] `watch-android/` -- the demo seed behind a flag, with a unit test that the release variant has no seeder and that the flag swaps the set. Rationale: decision 3.
- [ ] `assets/store/screenshots/**` + README -- every required set, both locales. Rationale: the listings.
- [ ] `test/store-screenshots.test.ts` (new) -- sizes, aspect, no alpha, and a full count per store and locale. Rationale: catches a wrong export.
- [ ] `docs/store/listing.md` (new) -- EN/IT name, subtitle, short and full descriptions, keywords, promotional text, categories, age-rating answers, support and privacy URLs, and the App Review note. Rationale: decision 4.
- [ ] `docs/index.html` -- badge URLs. The Play URL is derived from the package id; the App Store id comes from ifero once the app record exists. Rationale: a working landing page.
- [ ] Docs -- `assets/store/README.md`, and retire `docs/design/wear-store-screenshots/`. Rationale: one source.

**Acceptance Criteria:**

- Given `docs/store/listing.md`, when it is read against `docs/store/privacy-disclosures.md`, then no claim contradicts it, and no retailer is named.
- Given every screenshot, when it is inspected, then no catalogue logo, real card number or test fixture appears.
- Given a build with `supportsTablet: false`, when it runs on an iPad simulator, then it opens in iPhone compatibility mode.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `yarn typecheck`, `yarn lint`, `yarn format:check`, `yarn test`, `yarn icons:check` -- expected: pass
- `cd watch-android && ./gradlew testDebugUnitTest assembleDebug` -- expected: green

**Manual checks (if no CLI):**

- Read every screenshot against the decisions above, in both locales. The iPad compatibility-mode launch.

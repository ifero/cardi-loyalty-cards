---
title: 'Give the Wear OS barcode the whole screen'
type: 'bugfix'
created: '2026-11-04'
status: 'done'
route: 'dispatch'
review_loop_iteration: 1
baseline_commit: 'afe7f7a90e7c648cb196351b9d3c7936289261c8'
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
  - '{project-root}/docs/design/cardi/cardi-watch-grammar.md'
  - '{project-root}/docs/sprint-artifacts/stories/16-27-fix-watch-barcode-geometry.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Wear OS sizes its barcode with the rules watchOS has since abandoned in Story 16.27:

- a bar height of 52 % of the screen, clamped to 88–110 dp;
- a 2 dp inner padding;
- a module sized against the symbol plus its quiet zone (ZXing's default margin sits in the divisor).

On round screens it is worse still. The circle maths runs on the ScreenScaffold-padded box rather than the screen, so the round penalty is applied twice. Result: on a 384 px round screen an EAN-13 draws at 1 px per module (95 px of bars), while square Wear screens get 3 px and watchOS 3–4 px. At 1 px the barcode may not scan at a checkout.

**Approach:**

- Port 16.27's sizing to `BarcodeLayoutMetrics` and the generator:
  - bars span the whole cross axis;
  - no inner padding;
  - the screen edges the system does not draw into are reclaimed;
  - the module is sized against the symbol's own modules, and the leftover becomes the quiet zone, split in the symbology's ratio with a floor of 4 modules per side.
- On round screens, solve against the real screen diameter. Pick the largest whole-pixel module whose box (title, bars, value) still fits the circle with the bar height at or above its floor.
- Add a debug geometry log, and measure the result.

**Decision (ifero, 2026-11-09, review pass 1):** a symbol that does not fit at even 1 px per module with its 4-module quiet zones is not drawn. As in watchOS's `canRender` contract (Story 16.28's "key it in by hand"), its place shows the value as large monospaced text, so the cashier can type it. The title row stays. It is not the error screen.

## Boundaries & Constraints

**Always:**

- **Module plan:**
  - whole-pixel modules;
  - EAN-13 at 2 px per module or more on the 384 px round AVD, and square no worse than today's 3 px;
  - quiet-zone ratios as 16.27's `quietZone(for:)`: EAN-13 11/7, EAN-8 7/7, UPC-A 9/9, Code 39 10/10, Code 128 10/10;
  - the round bar-height floor is 50 % of the symbol's drawn width (a common EAN truncation), in dp.
- **Unchanged:** the title and value rows stay (watch grammar), and QR keeps its square fill, now against the real diameter and with no inner padding.
- **Nothing is clipped** on any profile the tests cover.

**Never:**

- Change symbologies, the pager or the error screen.
- Hide the title.
- Change watchOS.
- Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario             | Input / State                                               | Expected Output / Behavior                                                         | Error Handling       |
| -------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------- |
| Round 384 px, EAN-13 | 192 dp diameter, density 2                                  | ≥ 2 px/module, box inside the circle, bar ≥ 50 % of symbol width                   | N/A                  |
| Square 360 px        | 180 dp, density 2                                           | ≥ 3 px/module, bars span the free height                                           | N/A                  |
| Long Code 128        | Many modules on a small round screen                        | Largest whole module that fits, ≥ 1 px; quiet zones never below 4 modules per side | N/A                  |
| Too long to draw     | Symbol + 8 modules wider than 1 px allows (square or round) | No symbol; the value shown as large monospaced text in its place, title kept       | Not the error screen |
| QR                   | Any shape                                                   | Square, integer-scaled, inside the circle on round                                 | N/A                  |
| Title or value off   | Empty value                                                 | Freed height goes to the bars or to the round module                               | N/A                  |

</frozen-after-approval>

## Code Map

Paths under `watch-android/app/src/main/kotlin/com/iferoporefi/myloyaltycards/wear/`.

- `barcode/BarcodeLayoutMetrics.kt`
  - `:70-84`: the constants to retire (`LINEAR_HEIGHT_RATIO`, `LINEAR_MIN/MAX_HEIGHT`, `BOX_INNER_PADDING`).
  - `:97-168`: `make(...)`. Header 24 dp and footer 16 dp when shown.
  - `:181-205`: the circle solvers.
  - Becomes a module plan (module px, symbol width, quiet zone per side, bar height), like watchOS's `WatchBarcodeModulePlan.resolve`.
- `barcode/WearBarcodeGenerator.kt`
  - `:76`: `MultiFormatWriter().encode(value, format, w, h, hints)`.
  - `:86-100`: hints (QR only; MARGIN unset).
  - ZXing 3.5.4 renders 1D as `multiple = floor(W / (code + margin))` with a default margin of 9 (UPC/EAN) or 10, so modules are already whole pixels but the margin competes with the bars.
  - For linear codes, pass `EncodeHintType.MARGIN = 0` and request exactly `module × symbolModules` wide; the layout draws the quiet zone as white space.
- `barcode/BarcodeBitmap.kt:21-33` -- a 1:1 BitMatrix-to-bitmap copy. Keep it.
- `presentation/BarcodeScreen.kt`
  - `:239-241`: ScreenScaffold, with TimeText hidden.
  - `:275`, `:341`: contentPadding applied before `BoxWithConstraints`. This is the double penalty.
  - `:343-354`: the `make` call and the px conversion.
  - `:423-475`: `BarcodeSuccessContent`, with its padding at `:434`.
  - `:449-455`: the `Image` with `FilterQuality.None`.
  - `:555`: the preview.
- `watch-android/app/src/test/.../barcode/BarcodeLayoutMetricsTest.kt` -- 9 tests. Rewrite `:38` (it pins the 88–110 clamp). Keep the fill, no-clip and title-off tests, adapted to the plan.
- `.../barcode/WearBarcodeGeneratorTest.kt` -- no test pins the module width yet.
- watchOS reference (read-only): `targets/watch/WatchPresentationLayout.swift` `WatchBarcodeModulePlan.resolve` and `canRender`, `targets/watch/BarcodeGenerator.swift` `quietZone(for:)`, the `BarcodeGeometry` log in `targets/watch/BarcodeFlashView.swift`.
- Too long to draw: watchOS's `barcodePlaceholder` (`targets/watch/BarcodeFlashView.swift:432-450`) draws the value in 14 pt semibold monospaced, one line, shrinking to 50 %, inside a thin 30 %-black rounded outline the size of the symbol frame. On Wear, port it the same way: no new strings, the card's title row kept, a `contentDescription` built from the existing `barcode_content_description`. Pick the frame from the plan's free area. Never route it through `BarcodeErrorContent`.
- `barcode/BarcodeCache.kt` / `WearBarcodeGenerator.DEFAULT_CACHE_ENTRIES` (8): a module-count measure per card would share this cache, so either raise it to 16 or keep counts apart.
- `watch-android/README.md:83-131` -- AVD recipes (round and square, API 30 and 34).

## Tasks & Acceptance

**Execution:**

- [x] `barcode/BarcodeLayoutMetrics.kt` -- the module-plan solver, with a `canRender` that is false when the symbol plus 4 modules per side does not fit at 1 px (square: `units + 8 > width`; round: no module gives a bar ≥ 1 px inside the circle). The 4-module floor is then a guarantee wherever `canRender` holds, and the KDoc says exactly that. The text rows are sized from `fontScale` as well as density (the title and value are sp). Rationale: one place owns the geometry.
- [x] `barcode/WearBarcodeGenerator.kt` -- linear codes with margin 0 at the exact planned width. Raise the cache so a module-count measure per card does not halve it. Rationale: whole modules sized against the symbol.
- [x] `barcode/` -- the pure measure → plan → encode pipeline (no Android types) lives here, not in the composable, so a JVM test can drive it end to end. Rationale: the plan and the drawn matrix are checked together.
- [x] `presentation/BarcodeScreen.kt` -- feed the real screen size, roundness and font scale to the pipeline. Reclaim the scaffold padding on the barcode page. Draw the quiet zones as the white box. When `canRender` is false, show the value placeholder (Code Map). Add a `BuildConfig.DEBUG` `Log.d("BarcodeGeometry", …)` with the planned and drawn values, `canRender` included. Rationale: removes the double penalty; measurement.
- [x] Tests (`BarcodeLayoutMetricsTest.kt`, `WearBarcodeGeneratorTest.kt`, plus one for the pipeline):
  - every I/O matrix row at the 192/227/240 round and 180 square profiles;
  - the generator's bar run equals `module × symbolModules`, with whole-pixel bars;
  - pinned expected modules per profile, not re-derived from the solver's formula: round 384 EAN-13 3 px and QR 6 px, square 360 EAN-13 3 px and QR 8 px;
  - the quiet-zone split checked against the 11:7 / 9:9 / 7:7 / 10:10 ratio where the floor does not bind;
  - the pipeline's matrix width, height and narrowest element equal the plan;
  - a too-long Code 128 and Code 39 give `canRender == false` on every profile.

  Rationale: pins the plan.

**Acceptance Criteria:**

- Given the round and square API 34 AVDs (`wearos5_round_34`, plus a square one created from the README recipe), when an EAN-13, a Code 128 and a QR are opened, then the `BarcodeGeometry` log shows the module px, and Implementation Notes records the narrowest element per AVD, before and after.
- Given the round AVD after the change, when its screen is photographed or scanned with a phone barcode scanner, then the EAN-13 decodes. This step is recorded; if no scanner is available, it says so.

## Implementation Notes

> **Re-derived after loopback 1.** The pass-1 design below is kept unchanged. On top of it:
>
> - **`canRender`:** square `units + 8 ≤ width` (and a bar of at least 1 px); round, some module leaves a bar of at least 1 px in the circle; QR, at least 1 px per module. When it is false, `make` returns no symbol and no quiet zone, and gives the placeholder its free area: the whole height the text rows leave on square, the inscribed square of the circle on round. The fallback and the `min(4·module, leftover/2)` clamp are gone. The 4-module floor is now unconditional wherever `canRender` holds, and the KDoc says so.
> - **Too long to draw:** `BarcodeValueOnlyContent` ports watchOS's `barcodePlaceholder`: 14 sp semibold monospaced, one line, auto-sized down to 50 % (`TextAutoSize.StepBased`) and then ellipsised as watchOS's one-line `Text` is, inside a 1 dp 30 %-black outline with a 6 dp radius. The title and value rows stay; `contentDescription` comes from `barcode_content_description`. It is not routed through `BarcodeErrorContent`, and it keeps the screen bright.
> - **Pure pipeline:** `barcode/BarcodeRenderPipeline.kt` (`BarcodeRenderRequest` → `BarcodeRender.Drawn | ValueOnly | Failed`). The screen only makes the bitmap.
> - **Font scale:** the text rows are `⌈(line dp × fontScale + 4 dp) × density⌉`, and the request is keyed on `fontScale`.
> - **Cache:** `DEFAULT_CACHE_ENTRIES` is 16.
> - **Log:** the `BarcodeGeometry` line adds `fontScale` and `canRender`. A value-only card logs `drawn: none`.
>
> **Re-measured on the API 34 AVDs after the re-derivation:** the numbers in the table below match the log exactly on both AVDs. A scratch build, never committed, seeded a 51-character Code 128 (607 modules). It logs `canRender=false`, and the screen shows the title, the outlined value (ellipsised: 51 characters do not fit even at 50 %) and the value row. This is the same on round (272×271 px frame) and square (360×280 px). ZXing decoding of the re-derived screencaps: EAN-13, UPC-A, EAN-8, Code 128, Code 39 and QR decode on both AVDs.
>
> **Known limit, as on watchOS:** a value this long cannot be shown in full on one line at 7 sp, so the cashier sees a truncated value in this case.

**Solver** (`BarcodeLayoutMetrics.make`, now in whole device pixels):

- The caller measures the symbol first. `WearBarcodeGenerator.measure` is a 1×1 encode, and its matrix width is the module count: 95 for EAN-13 and UPC-A, 67 for EAN-8, and for QR the matrix plus its own 4-module quiet zone.
- Square linear: `module = ⌊W / (units + 8)⌋`. The bars take `H − header − footer`.
- Round linear: the solver walks `m` down from `⌊D / (units + 8)⌋` and keeps the first `m` where `⌊√(D² − (m·(units+8))²)⌋ − chrome ≥ ⌈m·units / 2⌉`. The bar takes that whole free height. If no module meets the floor, it falls back to the largest module with a bar of at least 1 px.
- The box width is the circle's chord at the box's top edge. The title and value rows are capped to it.
- QR: the largest integer multiple of its matrix inside the free square, or inside the circle (`s² + (s + k)² ≤ D²`).
- Quiet zones: the leftover is split in the 16.27 ratios (now `BarcodeFormats.quietZone`), with each side clamped to at least 4 modules.
- The title and value rows are fixed-height boxes (24 dp and 16 dp), so the planned box is the laid-out box. The symbol is placed in exact pixels by a `layout` modifier, so there is no dp round trip.
- The QR floor (112 dp) and the 80 % fill ratio were removed. Both belonged to the old clamp model.
- Linear codes are encoded with `MARGIN = 0` at exactly `module × units` wide.
- The scaffold's `contentPadding` now applies only to the error state, so the error screen is unchanged. On-device screencaps of the error pages are byte-identical before and after.

**Measured** (API 34 AVDs, density 2, `adb logcat -s BarcodeGeometry`; the before figures come from baseline `afe7f7a` screencaps). Narrowest element in px:

| AVD                           | EAN-13 | UPC-A | EAN-8 | Code 128 | Code 39 | QR px/module |
| ----------------------------- | ------ | ----- | ----- | -------- | ------- | ------------ |
| `wearos5_round_34` 384 before | 1      | 1     | 1     | 1        | 1       | 4            |
| `wearos5_round_34` 384 after  | **3**  | **3** | **4** | **2**    | **2**   | **6**        |
| `wear_square_34` 360 before   | 3      | 3     | 4     | 2        | 2       | 6            |
| `wear_square_34` 360 after    | 3      | 3     | 4     | **3**    | 2       | **8**        |

- Round EAN-13 after: 285×147 px symbol, 12/12 px quiet zone (4/4 modules), box 309×227. The bar-height floor is 143 px.
- Square EAN-13 after: 285×280 px symbol (taller than before), 45/30 px quiet zone (15/10 modules).
- On both AVDs the drawn matrix, the laid-out image and the planned size match exactly.

**Scan check:** no phone barcode scanner was available.

- As a software proxy, the AVD screencaps were decoded with ZXing's `MultiFormatReader` (TRY_HARDER). Every after-screen decodes to its value on both AVDs: EAN-13, UPC-A, EAN-8, Code 128, Code 39 and QR.
- The before-screens also decode. A pixel-perfect screencap does not suffer the optics that make a 1 px module fail at a till.
- **A real scanner pass on the round AVD or a device is still owed.**

**Not captured on device:**

- Title or value off: the sample cards all carry a value. This case is covered by unit tests only.
- Light and dark: the barcode screen ignores the theme.

**Device check (final code, after the pass-2 patches)**

- **Setup:** API 34 AVDs `wearos5_round_34` (384 px) and `wear_square_34` (360 px), density 2, debug APK from this branch.
  - Every sample card was paged with rotary on each AVD, plus a 51-character Code 128 card that a scratch seeder build left in the AVD databases (607 modules, never committed).
  - Screenshots and logs are outside the repository, in the session scratchpad `final/` folder: `m-round.png`, `m-square.png`, `m-round-fs.png`, `round-geometry.log`, `square-geometry.log`.
- **Round, `BarcodeGeometry`:**
  - EAN-13 and UPC-A 3 px per module (285×147 px symbol, 12/12 px quiet zones), EAN-8 4 px, Code 128 and Code 39 2 px, QR 6 px.
  - The too-long card logs `canRender=false` with a 272×271 px placeholder.
- **Square, `BarcodeGeometry`:**
  - EAN-13 3 px (quiet zones 45/30 px, 15/10 modules), UPC-A 3 px, EAN-8 4 px, Code 128 3 px, Code 39 2 px, QR 8 px.
  - The too-long card shows a 360×280 px placeholder.
- **Placement:** on every drawn card the matrix, the laid-out image and the placed x offset equal the plan (`placedX` = planned leading quiet zone).
- **Font scale on round:** at 1.24 and 1.5 nothing overlaps or clips (Review Triage Log #17 settled false). The rows grow and the box narrows, so at 1.24 the EAN-13 value row ellipsises, and at 1.5 the title does too.
- **Error screens:** "Unsupported" and "Invalid" are unchanged.
- **Light and dark:** the barcode surface is fixed black on white, so there is nothing theme-dependent to capture.
- **ZXing decode** of the final screencaps (`MultiFormatReader`, TRY_HARDER):
  - every drawn symbol on both AVDs, and EAN-13 at font scales 1.24 and 1.5, decodes to its value;
  - placeholder and error pages give no symbol, except one artefact: the square "Unsupported" text misread as an EAN-8.
- **Unchecked:** a real phone or till scanner (none available), title-off on device (unit tests only), and real hardware.

**Review loops**

- **Code review, round 1 (Sonnet):** CHANGES_REQUESTED, 2 findings, both verified and fixed.
  - `watch-android/README.md`'s layout paragraph still described the 112 QR floor, the 0.52 / 88–110 clamp and `widthFillRatio`. It is rewritten to describe the module plan.
  - The `BarcodeLayoutMetrics` KDoc claimed the 4-module quiet-zone floor for QR too. It is qualified to linear symbols; a QR's quiet zone is inside its matrix.
  - Both are comment and doc changes, so the device check stands.
- **Code review, round 2 (Sonnet):** APPROVED, zero comments.
- **QA review, round 1 (Sonnet):** APPROVED, zero comments. Every I/O matrix row and acceptance criterion maps to a test that ran and passed, or to the device check above. The real-scanner step is still owed, as recorded.

### Found, not fixed

- **A Code 39 over 80 characters shows "Invalid barcode" instead of the value** (Review Triage Log #28). ZXing 3.5.4's `Code39Writer` rejects more than 80 characters, so `measure` returns `InvalidValue` before any layout. This predates the change. The fix would map that one case to the value placeholder.
- **No Compose UI test pins the symbol's on-screen placement** (#13). The repository has no Compose UI-test harness. The `BarcodeGeometry` log carries the placed offset for the device check instead.

## Spec Change Log

- **2026-11-09, loopback 1 (intent_gap).**
  - **Trigger:** Review Triage Log #1/#2. A linear symbol too long for 1 px per module was drawn wider than the screen, with no quiet zone and a 1 px bar.
  - **Amendment:** ifero chose the watchOS contract. It is now in the frozen block as a Decision, with an I/O matrix row "Too long to draw", and in the Code Map and Tasks: `canRender`, the value placeholder, the pure pipeline, font-scaled text rows, the cache size, and pinned test expectations (#3–#7 carried as patches).
  - **Known-bad state avoided:** an off-screen, quiet-zone-less symbol; a 4-module floor that the KDoc promised but the code did not keep.
  - **KEEP:** the pass-1 design, which measured correctly on both AVDs. Keep:
    - `measure` as a 1×1 encode whose matrix width is the module count;
    - `BarcodeFormats.quietZone` and `BarcodeQuietZone`;
    - an integer-pixel `make` (square `⌊W / (units + 8)⌋` with the bars taking `H − chrome`; round walking down from `⌊D / (units + 8)⌋` to the first module whose chord bar meets `⌈module·units / 2⌉`; QR the largest integer multiple in the free square or `s² + (s + k)² ≤ D²`);
    - the box width as the chord at the box edge;
    - leftover split in ratio, each side clamped to ≥ 4 modules;
    - MARGIN 0 for linear codes;
    - the full-screen `BoxWithConstraints`, with `contentPadding` only on the error state;
    - fixed header and footer rows, and a `layout` modifier placing the symbol in exact px at `leadingQuietPx`;
    - the `BarcodeGeometry` log, extended as tasked.

    A scratch copy of the pass-1 diff (this session only, not committed) is at `/private/tmp/claude-501/-Users-ifero-Developer-cardi-loyalty-cards--claude-worktrees-bmad-build-16-38-e551de/9a4f044c-e221-4460-bda7-54da297373a7/scratchpad/impl-pass1.patch`.

## Review Triage Log

Pass 1 (step 4, 2026-11-09). Layers: blind, edge-case, verification-gap, project-conventions (no findings).

| #   | Finding (layer)                                                                                                                                                                                              | Verdict | Route               | Evidence                                                                                                                                                                                                                                                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A linear symbol too long for even 1 px/module (square `units + 8 > width`, round no-candidate fallback) is drawn wider than the screen with 0 quiet zone and a 1 px bar (blind, edge-case, verification-gap) | medium  | intent_gap          | `make`'s square branch `max(width / (units + 8), 1)` and the round `fallback == 0` path give `leftover = 0`; `placeSymbol` lays out `maxOf(boxWidthPx, symbolWidthPx)`. Reached at ~29+ alphanumeric Code 128 characters on 360 px. The frozen matrix assumes a 1 px fit always exists. Asked ifero: "Show value only (watchOS)" — port 16.28's `canRender` contract. Loopback 1. |
| 2   | The KDoc promises a 4-module quiet-zone floor the code drops below (blind, edge-case)                                                                                                                        | medium  | intent_gap (with 1) | `floorPx = min(4·module, leftover / 2)` only undercuts 4 modules on the unfit paths of #1; same root cause.                                                                                                                                                                                                                                                                       |
| 3   | `renderBarcode` (measure → make → generate) and the `placeSymbol` offset have no test; the deleted EAN-13 white-edge test was not replaced at the new site (verification-gap, edge-case)                     | medium  | patch               | Pre-verified gap. Fix: move the pure measure → plan → encode into the `barcode` package and test that matrix size, narrowest element and EAN-13 quiet split match the plan. The Compose offset stays with the device check. Carried into the re-derivation.                                                                                                                       |
| 4   | Title/value rows are reserved in dp but drawn in sp; a large font scale clips them (blind, edge-case)                                                                                                        | low     | patch               | Device: at `font_scale 1.24` both rows fit; at 1.5 the title touches the bars and the value is cut. Fix: scale the text rows by `fontScale` and key the request on it. Carried.                                                                                                                                                                                                   |
| 5   | `measure` entries halve the 8-entry `BarcodeCache` (blind, edge-case)                                                                                                                                        | low     | patch               | True: two keys per card. Fix is a constant (16). Carried.                                                                                                                                                                                                                                                                                                                         |
| 6   | `nextModuleFitsRound` mirrors the solver's own maths; round QR is not shown to be the largest; the AC3 fill check has no replacement (blind)                                                                 | low     | patch               | True; the test re-derives the solver. Fix: pin expected modules per profile (round 384 EAN-13 3 px, QR 6 px; square EAN-13 3 px, QR 8 px — the device log values). Carried.                                                                                                                                                                                                       |
| 7   | The quiet-zone ratio test does not check the ratio (blind)                                                                                                                                                   | low     | patch               | True: only `leading ≥ trailing` is asserted. Fix: assert the 11:7 / 9:9 / 7:7 split where the floor does not bind. Carried.                                                                                                                                                                                                                                                       |
| 8   | Loading draws nothing; a stale render lingers when the key changes (blind, edge-case)                                                                                                                        | false   | —                   | The old `Spacer` also drew nothing on the white page, and `produceState` kept its last value before this change too.                                                                                                                                                                                                                                                              |
| 9   | The debug log's `image=` can only equal the plan (blind)                                                                                                                                                     | false   | —                   | The log also prints `matrix=` beside the planned `symbol=`, so a mismatch does show up.                                                                                                                                                                                                                                                                                           |
| 10  | Square screens with rounded corners clip the edge-to-edge box (blind)                                                                                                                                        | false   | —                   | The frozen intent requires reclaiming the edges the system does not draw into; the square AVD shows nothing clipped.                                                                                                                                                                                                                                                              |
| 11  | Square QR side goes ≤ 0 when chrome > height; a dense QR may not fit at 1 px (blind, edge-case)                                                                                                              | low     | rejected            | Unreachable: the largest QR (version 40, 185 modules) fits the smallest profile's free square (280 px) and circle (~230 px) at 1 px.                                                                                                                                                                                                                                              |
| 12  | `narrowestElementPx` reads only the middle row (blind)                                                                                                                                                       | low     | rejected            | Logging and test aid only; a linear symbol is uniform across rows, and QR is logged as an aid.                                                                                                                                                                                                                                                                                    |

Pass 2 (step 4 after loopback 1, 2026-11-09). Layers: blind, edge-case, verification-gap, project-conventions (no findings). Rows #8 and #10, raised again, are carried.

| #   | Finding (layer)                                                                                                                                                      | Verdict     | Route              | Evidence                                                                                                                                                                                                                                      |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13  | Nothing checks the symbol's on-screen x offset (`placeSymbol` at `leadingQuietPx`) (verification-gap)                                                                | low         | patch + defer      | No Compose UI-test harness exists (`app/build.gradle.kts` has junit, coroutines-test and Robolectric only). Patch: log the placed x offset in `BarcodeGeometry`, so the device check sees it next to the plan. A Compose UI test is deferred. |
| 14  | `quietZone` normalisation is untested for padded or lower-case strings (verification-gap)                                                                            | low         | patch              | True: every caller passes canonical keys. Add a case-and-whitespace test in `BarcodeFormatsTest`.                                                                                                                                             |
| 15  | A too-long card shows the value twice, in the placeholder and in the footer (blind)                                                                                  | false       | —                  | This is watchOS parity, as the decision asks: `BarcodeFlashView.swift` draws `Text(value)` under the frame whether `barcodePlaceholder` or the image fills it.                                                                                |
| 16  | `fitsBox` and "quiet zones take the whole leftover" are true by construction (blind)                                                                                 | low         | patch              | True: `trailing = leftover − leading`. Replace them with checks that can fail: each side ≥ 4 modules before the split, and trailing ≥ 0.                                                                                                      |
| 17  | The text rows are sized from assumed line heights; a large scale could spill (blind)                                                                                 | maybe-false | device check       | The 20/12 dp lines times `fontScale` are an assumption. The device check settles it at font scale 1.24 and 1.5 on round.                                                                                                                      |
| 18  | Huge font scales or tiny screens break `valueOnly` (chrome ≥ inscribed side); a short square symbol becomes value-only when `height − chrome < 1` (blind, edge-case) | low         | rejected           | Unreachable: round 384 at font scale 2.0 has 144 px of chrome against a 271 px inscribed side, and square 360 has 216 px free.                                                                                                                |
| 19  | A QR can become `ValueOnly` (blind, edge-case)                                                                                                                       | low         | rejected           | Unreachable: QR version 40 (185 modules) fits at 1 px at font scale 2.0 on round 384 (189 px side), as #11.                                                                                                                                   |
| 20  | Non-square or fractional-density screens are untested (blind)                                                                                                        | low         | rejected           | No such Wear profile is in scope; the fix would add speculative tests.                                                                                                                                                                        |
| 21  | Round 454 and 480 have no pinned modules; the fill check is gone (blind)                                                                                             | low         | patch              | True: only 384 and 360 are pinned. Pin the solver's current values for 454 and 480.                                                                                                                                                           |
| 22  | The request's "screen" size is really the pager page's (blind)                                                                                                       | false       | —                  | The page fills the screen: the device log shows `screen=384x384` and `360x360`.                                                                                                                                                               |
| 23  | Loading is blank; unbounded constraints; a stale render; a 0-size screen stays blank (blind, edge-case)                                                              | false       | —                  | Blank and stale are carried from #8. The `VerticalPager` page is `fillMaxSize` with bounded constraints, so the unbounded and 0-size cases do not arise.                                                                                      |
| 24  | Debug-only work in release; `narrowestElementPx` is public (blind)                                                                                                   | low         | patch (visibility) | The middle-row scan costs O(width) per render, which is negligible, so that part is rejected. Make the extension `internal`.                                                                                                                  |
| 25  | Import order is not lexicographic (blind)                                                                                                                            | false       | —                  | No ktlint, Spotless or detekt is configured; `lintDebug` is green.                                                                                                                                                                            |
| 26  | The KDoc says the leftover is split in ratio, but on round EAN-13 is always 4/4; the "until too shallow" claim is not enforced (blind)                               | low         | patch              | True: the round box is the chord at `units + 8`, so the floor always binds. Qualify both KDoc sentences.                                                                                                                                      |
| 27  | Duplicated test fixtures; `quietZone` repeats the format literals (blind)                                                                                            | low         | rejected           | Cosmetic. `BarcodeFormats` already keys on normalised literals (`QR`), and #14 tests the mapping.                                                                                                                                             |
| 28  | A Code 39 over 80 characters shows the error screen, not the value (edge-case)                                                                                       | medium      | defer              | Confirmed with ZXing 3.5.4 in jshell: Code 39 throws at 81 characters, while Code 128 accepts 120. This behaviour predates the change. The decision covers symbols that encode but do not fit.                                                |

## Verification

**Commands:**

- `cd watch-android && ./gradlew testDebugUnitTest lintDebug assembleDebug` -- expected: green
- `yarn typecheck`, `yarn lint`, `yarn format:check`, `yarn test` -- expected: clean (the house set; this change touches no JS, so they guard the tree, not the feature)

**Manual checks (if no CLI):**

- Device check on the round and square AVDs, in light and dark: the three symbologies, with title and value on and off, captured.
- Not OTA-eligible (native Kotlin).

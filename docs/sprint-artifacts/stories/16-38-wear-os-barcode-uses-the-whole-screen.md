---
title: 'Give the Wear OS barcode the whole screen'
type: 'bugfix'
created: '2026-11-04'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
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

| Scenario             | Input / State                        | Expected Output / Behavior                                                         | Error Handling |
| -------------------- | ------------------------------------ | ---------------------------------------------------------------------------------- | -------------- |
| Round 384 px, EAN-13 | 192 dp diameter, density 2           | ≥ 2 px/module, box inside the circle, bar ≥ 50 % of symbol width                   | N/A            |
| Square 360 px        | 180 dp, density 2                    | ≥ 3 px/module, bars span the free height                                           | N/A            |
| Long Code 128        | Many modules on a small round screen | Largest whole module that fits, ≥ 1 px; quiet zones never below 4 modules per side | N/A            |
| QR                   | Any shape                            | Square, integer-scaled, inside the circle on round                                 | N/A            |
| Title or value off   | Empty value                          | Freed height goes to the bars or to the round module                               | N/A            |

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
- watchOS reference (read-only): `targets/watch/WatchPresentationLayout.swift` `WatchBarcodeModulePlan.resolve`, `targets/watch/BarcodeGenerator.swift` `quietZone(for:)`, the `BarcodeGeometry` log in `targets/watch/BarcodeFlashView.swift`.
- `watch-android/README.md:83-131` -- AVD recipes (round and square, API 30 and 34).

## Tasks & Acceptance

**Execution:**

- [ ] `barcode/BarcodeLayoutMetrics.kt` -- the module-plan solver. Rationale: one place owns the geometry.
- [ ] `barcode/WearBarcodeGenerator.kt` -- linear codes with margin 0 at the exact planned width. Rationale: whole modules sized against the symbol.
- [ ] `presentation/BarcodeScreen.kt` -- feed the real screen size and roundness to the solver. Reclaim the scaffold padding on the barcode page. Draw the quiet zones as the white box. Add a `BuildConfig.DEBUG` `Log.d("BarcodeGeometry", …)` with the planned and drawn values. Rationale: removes the double penalty; measurement.
- [ ] Tests (`BarcodeLayoutMetricsTest.kt`, `WearBarcodeGeneratorTest.kt`) -- every I/O matrix row at the 192/227/240 round and 180 square profiles. The generator's bar run equals `module × symbolModules`, with whole-pixel bars. Rationale: pins the plan.

**Acceptance Criteria:**

- Given the round and square API 34 AVDs (`wearos5_round_34`, plus a square one created from the README recipe), when an EAN-13, a Code 128 and a QR are opened, then the `BarcodeGeometry` log shows the module px, and Implementation Notes records the narrowest element per AVD, before and after.
- Given the round AVD after the change, when its screen is photographed or scanned with a phone barcode scanner, then the EAN-13 decodes. This step is recorded; if no scanner is available, it says so.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `cd watch-android && ./gradlew testDebugUnitTest lintDebug assembleDebug` -- expected: green
- `yarn lint`, `yarn format:check` -- expected: clean

**Manual checks (if no CLI):**

- Device check on the round and square AVDs, in light and dark: the three symbologies, with title and value on and off, captured.
- Not OTA-eligible (native Kotlin).
  </content>
  </invoke>
  <invoke name="Bash">
  <parameter name="command">cd /Users/ifero/Developer/cardi-loyalty-cards/.claude/worktrees/bmad-sprint-planning-33e20f && f=docs/sprint-artifacts/stories/16-38-wear-os-barcode-uses-the-whole-screen.md; npx prettier --write $f >/dev/null; wc -c $f | awk '{print "~"int($1/4)" tokens"}'

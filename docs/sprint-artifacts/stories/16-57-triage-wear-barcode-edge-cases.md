---
baseline_commit: '4bbfcbd1cd08640a3a80b08f6614744ee6cb8aac'
title: 'A Code 39 over 80 characters shows the error screen instead of the value, and nothing pins the Wear barcode on-screen placement'
type: 'bugfix'
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

**Problem:** Story 16.38 (the Wear OS barcode uses the whole screen) left two items behind.

1. **A Code 39 over 80 characters shows "Invalid barcode" instead of the value.** ZXing 3.5.4's `Code39Writer` rejects content longer than 80 characters. `WearBarcodeGenerator.measure` returns `BarcodeResult.InvalidValue`, and `BarcodeRenderPipeline.render` turns a failed *measurement* into `BarcodeRender.Failed` -- the error screen -- before any layout runs. Story 16.38 decided that a symbol too long to draw shows its value as text, so it can be keyed in (watchOS's `canRender` contract). This case never reaches that decision: it is still the error screen.
2. **No Compose UI test pins the barcode's on-screen placement.** `Modifier.placeSymbol` places the symbol at the plan's leading quiet zone, in exact pixels. The JVM tests cover the plan and the drawn matrix, but nothing checks the composed layout. A regression such as `place(0, 0)` would pass every test.

**Approach:** Map an over-length Code 39 whose characters are otherwise valid onto the value-only path, so the value is shown instead of an error; and give the Wear module a Compose UI-test harness with one test that asserts the image's x offset and size against `BarcodeLayoutMetrics`.

**Decisions (pending ifero's approval):**

- **The over-length Code 39 is a value-only case, not an error.** The value is valid; only the symbology cannot carry it. That is exactly the distinction Story 16.38 already drew for a symbol that does not fit.
- **The Compose UI test is added to the Wear module**, which means adding the `androidTest` source set and the Compose UI-test artifact. The alternative -- leaving the placement unpinned and relying on the DEBUG log -- is what the issue records as the current mitigation.

## Boundaries & Constraints

**Always:** The value-only path is the one Story 16.38 built, with the same look and the same contract: the value as text, so it can be keyed in. The mapping is limited to Code 39 and to content whose characters the symbology can represent; a Code 39 with an unencodable character stays an error. The over-length case is decided **before** the layout runs, so no metrics are computed for a symbol that cannot exist. The Compose test asserts the placement against the same `BarcodeLayoutMetrics` the production code uses.

**Never:** Change the barcode's geometry, the symbol's quiet zone, the module quantisation or the 2 px/module floor. Change the error screen's copy or the unsupported-format screen. Change what a card stores (the format mapping is a different story). Change the phone's barcode rendering. Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| -------- | ------------- | ------------------------- | -------------- |
| Code 39, 80 characters | The value is exactly at the limit | The symbol draws | Unchanged |
| Code 39, 81 characters, all encodable | The value is over the limit | The value is shown as text, so it can be keyed in | Not an error |
| Code 39, over the limit, with an unencodable character | The value cannot be represented at all | The error screen | The existing invalid-value screen |
| Code 128, over its own limit | The value is long | The value-only path, as today | Unchanged |
| The symbol is placed | The barcode screen renders | The image's x offset equals the plan's leading quiet zone, and its size equals the plan's | The Compose test fails |

</frozen-after-approval>

## Code Map

- `watch-android/app/src/main/kotlin/com/iferoporefi/myloyaltycards/wear/barcode/WearBarcodeGenerator.kt:92-98` -- `encode` catches `WriterException` and `IllegalArgumentException` and returns `BarcodeResult.InvalidValue` for both: *"Content too large for the symbology, or otherwise unencodable"* and *"The 1D writers throw IAE for bad content (wrong length, failed checksum, out-of-charset)"*. `measure` (`:87-89`) is `generate(value, format, 1, 1)` -- the same path, so a measurement fails exactly where a render would.
- `watch-android/app/src/main/kotlin/com/iferoporefi/myloyaltycards/wear/barcode/BarcodeRenderPipeline.kt:55` -- `if (measured !is BarcodeResult.Success) return BarcodeRender.Failed(measured)`, and `:63` -- `if (!metrics.canRender) return BarcodeRender.ValueOnly(metrics)`. The value-only branch is only reachable when the **metrics** cannot render, never when the **measurement** failed -- which is why the over-length Code 39 lands on the error screen.
- `watch-android/app/src/main/kotlin/com/iferoporefi/myloyaltycards/wear/barcode/BarcodeRenderPipeline.kt:35` -- `data class ValueOnly(val metrics: BarcodeLayoutMetrics) : BarcodeRender`.
- `watch-android/app/src/main/kotlin/com/iferoporefi/myloyaltycards/wear/presentation/BarcodeScreen.kt:396-424` -- the `BarcodeRenderState.ValueOnly` branch and `:544` -- `BarcodeValueOnlyContent`; `:663` -- the `BarcodeResult.InvalidValue` branch of the error screen.
- `watch-android/app/src/main/kotlin/com/iferoporefi/myloyaltycards/wear/presentation/BarcodeScreen.kt:648-651` -- `private fun Modifier.placeSymbol(metrics: BarcodeLayoutMetrics): Modifier = layout { measurable, _ -> val placeable = measurable.measure(Constraints.fixed(metrics.symbolWidthPx, metrics.barHeightPx)); layout(metrics.boxWidthPx, metrics.barHeightPx) { placeable.place(metrics.leadingQuietPx, 0) } }`.
- `watch-android/app/src/main/kotlin/com/iferoporefi/myloyaltycards/wear/presentation/BarcodeScreen.kt:523-525` -- the DEBUG `BarcodeGeometry` log, which prints `placedX` beside the planned leading quiet zone; this is the issue's current mitigation.
- `watch-android/app/src/test/kotlin/com/iferoporefi/myloyaltycards/wear/barcode/BarcodeRenderPipelineTest.kt:80-91` -- `tooLong_isValueOnly_neverEncodedNorAnError`, which covers CODE128 and CODE39 over-length values; it passes today because those values fail the **metrics**, not the measurement.
- `watch-android/gradle/libs.versions.toml:34` -- `zxingCore = "3.5.4"`; `:88` -- `zxing-core = { module = "com.google.zxing:core", version.ref = "zxingCore" }`.
- `watch-android/app/build.gradle.kts:434-446` -- the test dependencies: `libs.junit`, `libs.kotlinx.coroutines.test`, `libs.androidx.datastore.preferences.core`, `libs.robolectric`. There is no `androidTestImplementation` and no Compose UI-test artifact.
- `watch-android/app/build.gradle.kts:428-430` -- `implementation(libs.wear.compose.ui.tooling)` and `debugImplementation(libs.androidx.compose.ui.tooling)`.
- `watch-android/app/src/main/kotlin/com/iferoporefi/myloyaltycards/wear/barcode/BarcodeLayoutMetrics.kt` -- the metrics the placement and the test both read.
- Do not change: the phone's barcode renderer, `core/utils/expandUpcE.ts`, the store's symbol mapping, the error screen's copy.

## Tasks & Acceptance

**Execution:**

- [ ] `watch-android/app/src/main/kotlin/com/iferoporefi/myloyaltycards/wear/barcode/BarcodeRenderPipeline.kt` -- an over-length Code 39 whose characters are otherwise valid maps to `BarcodeRender.ValueOnly`, so the value is shown as text; a Code 39 with an unencodable character stays `Failed`.
- [ ] `watch-android/app/src/test/kotlin/com/iferoporefi/myloyaltycards/wear/barcode/BarcodeRenderPipelineTest.kt` -- a test for an 81-character Code 39 that asserts the value-only path and that no matrix was encoded; the existing `tooLong_isValueOnly_neverEncodedNorAnError` test keeps passing.
- [ ] `watch-android/app/build.gradle.kts` -- the `androidTest` source set and the Compose UI-test artifact (`androidx.compose.ui:ui-test-junit4`), with the `debugImplementation` of the Compose test manifest.
- [ ] `watch-android/app/src/androidTest/` -- a Compose UI test that renders the barcode screen and asserts the image's x offset equals `metrics.leadingQuietPx` and its size equals `metrics.symbolWidthPx` by `metrics.barHeightPx`.
- [ ] `watch-android/app/src/androidTest/` -- the test runs on a device or an emulator in CI; the job that runs it is documented.
- [ ] `yarn lint`, `yarn typecheck`, `yarn test` -- green; the Wear OS unit tests pass.

**Acceptance Criteria:**

- Given a card whose barcode is a Code 39 longer than 80 characters, when the Wear OS barcode screen opens, then the value is shown as text -- not the "Invalid barcode" error screen -- so it can be keyed in.
- Given a Code 39 whose characters the symbology cannot represent, when the Wear OS barcode screen opens, then the invalid-value error screen is shown, as today.
- Given a Code 39 at exactly the limit, when the Wear OS barcode screen opens, then the symbol draws.
- Given the barcode screen is composed, when the image is placed, then its x offset equals the plan's leading quiet zone and its size equals the plan's -- and a Compose UI test fails if it does not.

## Design Notes

The two items are both about the same boundary: the boundary between "this value cannot be represented" and "this symbol cannot be drawn", and the boundary between what the plan says and what the screen does.

The first is a routing defect, not a rendering one. `BarcodeRenderPipeline` already distinguishes the two cases -- `Failed` for a value the symbology cannot carry, `ValueOnly` for a symbol that does not fit -- but the ZXing exception collapses "too long" into "invalid", and the pipeline reads that as the first case. The fix is to classify the exception: too long is a value-only case, unencodable is an error.

The second is the classic "the plan is right and the placement is wrong" gap. The metrics are computed and tested; the placement that consumes them is not. A Compose UI test is the smallest thing that closes it, and it is the same class of test the repository already reaches for elsewhere (the watch's `watch-layout-contract.test.ts` pins the watch layout in the same spirit).

## Implementation Notes

- Source issue: #303 (both items), filed from
  `docs/sprint-artifacts/stories/16-38-wear-os-barcode-uses-the-whole-screen.md` section "Found, not fixed",
  where the story's Review Triage Log covers them as #28 and #13.
- The ZXing limit is not documented in the codebase; the issue records it as confirmed in jshell -- Code 39
  throws at 81 characters, while Code 128 accepts 120. The fix's comment should name that limit and its
  source, so a future reader knows it is a symbology property and not a local choice.
- `BarcodeRenderPipelineTest.kt:80-91`'s existing `tooLong_isValueOnly_neverEncodedNorAnError` test already
  covers a 52-character CODE39 value, which is *under* 80 and therefore fails the metrics rather than the
  measurement. The new test uses a value over 80 so it exercises the new classification.
- The Compose UI-test harness needs an `androidTest` source set, which the Wear module does not have
  (`find watch-android -type d -name androidTest` returns nothing), and the `androidx.compose.ui:ui-test-junit4`
  artifact, which is not in `watch-android/gradle/libs.versions.toml`. Adding it is the story's cost, and it
  is why the issue calls the absence of the harness the reason there is no test.
- The DEBUG `BarcodeGeometry` log (`BarcodeScreen.kt:523-525`) prints `placedX` beside the planned leading
  quiet zone; it stays as the device-check instrument, and the Compose test is what makes it unnecessary.
- The Wear module's `robolectric` dependency (`:446`) supplies an Android runtime on the JVM; a Compose UI
  test needs the instrumented variant, so the Robolectric path does not serve here.
- The issue records that a `place(0, 0)` regression "would pass every test" -- the new test is what makes
  that false.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors
- `yarn lint` -- expected: no errors
- `yarn format:check` -- expected: clean
- `yarn test` -- expected: all suites pass
- `./gradlew -p watch-android testDebugUnitTest` -- expected: the Wear OS unit tests pass
- `./gradlew -p watch-android connectedDebugAndroidTest` -- expected: the Compose UI test passes on a device or emulator

**Manual checks (if no CLI):**

- On a Wear OS device or emulator: store a card with an 81-character Code 39, open its barcode, and confirm
  the value is shown as text rather than the error screen.

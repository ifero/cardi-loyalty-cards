---
baseline_commit: '4bbfcbd1cd08640a3a80b08f6614744ee6cb8aac'
title: 'Two concurrent requests for the same barcode each render it, because the generator caches results but never in-flight work'
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

**Problem:** `BarcodeGenerator.generateImage` caches its *results* in an `NSCache` but keeps no record of work *in progress*. Two requests for the same value, format, size and orientation that arrive before the first one caches its image each do the full render -- the module maths, the quiet zone, the `CGImage` construction and the rasterisation -- and the second one's work is thrown away when the first one populates the cache.

**Approach:** Keep a map of ongoing renders, keyed by the same cache key, so a concurrent request for the same barcode joins the render already running instead of starting a second one. The map is removed when the render finishes, whether it succeeded or failed.

**Decisions (pending ifero's approval):**

- **The in-flight map is keyed by the existing cache key**, so it cannot disagree with the cache about what "the same barcode" means.
- **Cancellation and error propagation follow the render's own outcome.** A request that joins an in-flight render gets the same image or the same `nil`, and a cancelled request does not leave a half-finished entry behind.

## Boundaries & Constraints

**Always:** The cache and the in-flight map share one key derivation. The map is emptied on every exit path -- success, failure and cancellation. A joined request behaves exactly as if it had rendered the image itself: same result, same `nil`, no new error surface. The existing cache contract (`cacheVersion` in the key, `NSCache` with a cost) is unchanged.

**Never:** Change the renderer's output, the module maths, the quiet zones, the cache key, or the `cacheVersion`. Change the watch's visual behaviour. Change the barcode's geometry. Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| -------- | ------------- | ------------------------- | -------------- |
| Two identical requests | They arrive before the first caches | One render; both callers get the same image | N/A |
| Two different barcodes | Two renders are needed | Both render; neither waits | N/A |
| The render fails | The value cannot be encoded | Both callers get `nil`; the map is emptied | As today |
| A caller is cancelled | The view's task is cancelled | The render is not left in the map; the caller gets `nil` | N/A |
| The cache is warm | The image is already cached | The cached image is returned; no render, no map entry | N/A |
| A third request joins | A render is in flight | It joins the same render | N/A |

</frozen-after-approval>

## Code Map

- `targets/watch/BarcodeGenerator.swift:80-124` -- `generateImage(value:formatString:pixelSize:orientation:)`: the cache key (`:88`), the cache lookup (`:90`), the QR branch (`:96-104`), the module render (`:106-113`), the `Task.isCancelled` check (`:115`), the `MainActor` hop (`:117-119`), and the cache write (`:122`).
- `targets/watch/BarcodeGenerator.swift:53-60` -- `cacheVersion = "watch-barcode-v5"` and the `NSCache<NSString, UIImage>`; `:671` -- `cacheKey(value:format:pixelSize:orientation:)`, which includes the version.
- `targets/watch/BarcodeGenerator.swift:827` -- `isCached` (the test helper that reads the cache).
- `targets/watch/BarcodeFlashView.swift:314-356` -- the `.task(id: renderTaskID)` that calls `generateImage` (`:344`) and the `Task.isCancelled` check after it (`:347`).
- `targets/watch/BarcodePagerView.swift:172` -- `.id(card.id)`, which re-keys each paged card.
- `watch-ios/Tests/BarcodeGeneratorTests.swift:12-34` -- `test_generateImage_isCached`; `:358-381` -- `test_generateImage_cachesOrientationsSeparately`; the file is the place for the concurrency test.
- `targets/watch/__tests__/watch-layout-contract.test.ts` -- the JS-side contract test for the watch layout; the generator's cache contract is pinned in Swift.
- `git log --all -S "inFlight" -- targets/watch/ watch-ios/` -- **no result**: no in-flight dedupe exists today.
- Do not change: the encoder functions, the quiet zones, the geometry, `BarcodeFlashView`, `BarcodePagerView`.

## Tasks & Acceptance

**Execution:**

- [ ] `targets/watch/BarcodeGenerator.swift` -- an in-flight map of ongoing renders, keyed by the existing cache key; `generateImage` checks it after the cache lookup and joins an existing render instead of starting a second one.
- [ ] `targets/watch/BarcodeGenerator.swift` -- the map entry is removed on every exit path: success, failure and cancellation.
- [ ] `targets/watch/BarcodeGenerator.swift` -- a joined caller receives the same result the render produced, including `nil` for a value that cannot be encoded.
- [ ] `watch-ios/Tests/BarcodeGeneratorTests.swift` -- a test that two concurrent calls for the same barcode perform one render and both receive the same image; a test that two different barcodes each render; a test that the map is empty after a failed render and after a cancellation.
- [ ] `yarn lint`, `yarn typecheck`, `yarn test` -- green; the watch tests pass.

**Acceptance Criteria:**

- Given two concurrent requests for the same barcode, when both are in flight, then the module rendering and the image rasterisation happen once, and both callers receive the same image.
- Given two requests for different barcodes, when they overlap, then neither waits for the other and both render.
- Given a render that fails, when it finishes, then both callers receive `nil` and no pending render is left behind.
- Given a cancelled request, when it is cancelled, then no pending render is left in the map and the next request renders normally.
- Given a warm cache, when a request arrives, then the cached image is returned and no render is started.

## Design Notes

This is the second half of an issue filed in February 2026 whose first half was closed by Story 16.28 (the EAN/UPC/CODE39 renderers). What remains is a small concurrency defect, and it is worth doing for one reason: the watch renders a barcode on a device whose CPU and battery budget are the tightest in the project, and the duplicate render is not free -- it is a second module render and a second rasterisation on a 40 mm watch.

Joining the in-flight render rather than cancelling it is the right shape, because the caller that started the render may itself be cancelled (the crown moves, the view goes away). A joined caller must still get a correct result, which means the render's outcome -- including `nil` -- is what everyone sees.

## Implementation Notes

- Source issue: #45 (item 2). Item 1 (the EAN/UPC/CODE39 renderers) was **closed** by Story 16.28
  (`9f52e66 fix(watch): render EAN-8, UPC-A and Code39 in their real symbologies (#212)`) and must not be
  re-opened here: `targets/watch/BarcodeGenerator.swift:160-164` dispatches per symbology and
  `watch-ios/Tests/BarcodeGeneratorTests.swift:120,135,153` pin the reference symbols.
- The issue's file paths (`watch-ios/MyLoyaltyCardsWatch/BarcodeGenerator.swift`) are stale: the watch
  sources moved to `targets/watch/` in `e775241 feat(11-6): remove watch-ios/, update all references, add
  watch README, tick ACs`. The test folders it names still exist (`watch-ios/Tests/`, `watch-ios/UITests/`).
- The issue also asks for "performance tests (measure display latency <= 1s under cold/cached conditions) and
  memory/cost assertions for the cache". The latency half is already covered by the UI test's own assertion
  (`watch-ios/UITests/CardListUITests.swift:95-96` -- the barcode must appear within 1s). The cache-cost half
  is not, and is a reasonable addition to the same test file if the map's memory profile is in doubt.
- The issue's third item -- "integration/UI tests on the watch simulator covering EAN/UPC rendering and
  repeated rapid taps (no duplicate generation)" -- is the same defect from the UI side, and belongs to
  `16-55-triage-watch-followups.md`, which adds the watch UI tests to CI.
- The `cacheVersion` (`"watch-barcode-v5"`, `targets/watch/BarcodeGenerator.swift:53`) is bumped whenever the
  renderer changes, because the cache key carries no renderer version of its own. **The in-flight map must
  not change the cache key**, so no bump is needed for this story -- but the map's own lifetime must not
  outlive a version change either, which is another reason to key it on the existing key (which carries the
  version).
- `BarcodeFlashView.swift:314` already runs the render inside `.task(id: renderTaskID)`, and SwiftUI cancels
  it when the id changes, so the *view* is protected against the most common duplicate. The gap is two
  requests that are not the same view -- a pager transition and a fresh mount can overlap.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors
- `yarn lint` -- expected: no errors
- `yarn format:check` -- expected: clean
- `yarn test` -- expected: all suites pass
- the watch unit tests -- expected: the new concurrency tests pass

**Manual checks (if no CLI):**

- On a watch simulator: open a card's barcode and page back and forth quickly; the symbol must not flicker
  and the display must not stutter.

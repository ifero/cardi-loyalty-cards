---
title: 'Map UPC-E so a UPC-E barcode is not stored as Code 128'
type: 'bugfix'
created: '2026-11-04'
status: 'in-review'
route: 'dispatch'
baseline_commit: 'bf26bd417ebd2b47c9152db07d2679a6246fc114'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Scanning a UPC-E barcode from an image stores the card as `CODE128` for good, with no error. `useImageScan` always requests `UPC_A`, so the iOS decoder also registers `.upce` and reports `"UPC_E"`. `BARCODE_FORMAT_MAP` has no `upc_e` key, so `mapFormat` falls back to `'CODE128'`. `normalizeBarcode` cannot rescue an 8-digit payload, because all three of its rules need 12 or 13 digits.

**Approach:** In `useImageScan`, before `mapFormat`, a `UPC_E` result is expanded losslessly to its 12-digit UPC-A form (GS1 zero-suppression). The hook then hands `{ value, 'UPCA' }` to the unchanged `normalizeBarcode`, whose Rule 1 turns UPC-A into EAN-13.

## Boundaries & Constraints

**Decision (ifero, 2026-11-04):** UPC-E is stored as EAN-13: no new schema member, no sync-contract change, no watch work. The card shows EAN-13 bars, which a checkout scanner reads as the same product code.

**Evidence (Sentry, read 2026-11-04):** zero "Barcode format fell back to CODE128" events in the last 90 days, across all 339 events in the project. UPC-E has never been seen in the field. The fix is a latent-defect repair, which confirms the decision.

**Always:**

- **`expandUpcE(raw)` in `core/utils/expandUpcE.ts`** is pure and exported from `core/utils/index.ts`. It trims its input. It accepts exactly 8 digits whose first digit (the number system) is 0 or 1, and returns `null` otherwise. Its output is the 12-digit UPC-A.
  - **Expansion.** Let the number system be N, the body d1..d6 and the check digit C.

    | d6        | UPC-A                      | Cases |
    | --------- | -------------------------- | ----- |
    | 0, 1 or 2 | N d1 d2 d6 0000 d3 d4 d5 C | three |
    | 3         | N d1 d2 d3 00000 d4 d5 C   | one   |
    | 4         | N d1 d2 d3 d4 00000 d5 C   | one   |
    | 5 to 9    | N d1 d2 d3 d4 d5 0000 d6 C | one   |

  - **Check digit.** The UPC-A check digit (3/1 weighting) of the expanded first 11 digits must equal C; otherwise `null`. Rule 1's EAN-13 checksum then holds by construction.

- **Hook behaviour.** When the decoder label lowercases to `upc_e` and `expandUpcE` returns a value, `mapFormat` is skipped and its fallback notify does not fire. When it returns `null`, today's path runs unchanged, CODE128 fallback and notify included. The same rule applies per code in a multi-code scan.
- **`normalizeBarcode` is untouched**, and so are its tests (Conad included). `selectCode`'s second `normalizeBarcode` pass stays safe, because its input is already a 13-digit EAN-13.
- **PII:** no barcode value reaches a log or Sentry.
- **Layering:** `core/` imports nothing from `features/`. Tests sit beside their files; no `__tests__/` folders.

**Never:**

- Touch `core/schemas/card.ts`, the format picker, `BarcodeRenderer`, the locales or the watch apps.
- Change the camera path (`useBarcodeScanner`). UPC-E cannot reach it: both `barcodeTypes` lists request only `code128, ean13, ean8, qr, code39, upc_a`, and expo-camera registers only the requested types.
- Widen the six supported formats.
- Fix 16-24's `exhaustive-deps` warnings.
- Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario            | Input / State                                       | Expected Output / Behavior                        | Error Handling       |
| ------------------- | --------------------------------------------------- | ------------------------------------------------- | -------------------- |
| Valid UPC-E         | `{ content: '01234565', format: 'UPC_E' }`          | Stored EAN-13 `0012345000065`; no fallback notify | N/A                  |
| Each expansion case | d6 = 0, 1, 2, 3, 4, and one of 5–9                  | The tabled UPC-A, then EAN-13                     | N/A                  |
| Number system 1     | A valid `1…` UPC-E                                  | EAN-13 starting `01`                              | N/A                  |
| Whitespace          | `'01234565\n'`                                      | Same as the valid case                            | N/A                  |
| Invalid UPC-E       | 7 or 9 digits, first digit 2, non-digits, bad check | Kept as today (CODE128)                           | Fallback notify once |
| Multi-code          | UPC_E beside EAN-13 and QR                          | UPC_E entry becomes EAN-13; the others unchanged  | N/A                  |
| Other formats       | UPC-A 12/13, EAN-13, CODE128 carrying EAN-13, Conad | Unchanged                                         | N/A                  |

</frozen-after-approval>

## Code Map

- `features/add-card/hooks/useImageScan.ts`
  - `:27`: `BARCODE_FORMAT_MAP`.
  - `:68-88`: `mapFormat`, with its per-scan `reportedFormats` dedupe (keep it).
  - `:346-347`: single code, `mapFormat` then `normalizeBarcode`.
  - `:352-353`: the multi-code loop (cap 6).
  - `:248`: `selectCode` re-normalizes.
  - Keep the cancel path.
- `core/utils/normalizeBarcode.ts:80-100` -- trims; Rule 1 (UPC-A 12 → EAN-13) is the precedent. Read-only.
- `core/utils/index.ts:10-14` -- file-by-file re-exports. Add `expandUpcE`.
- `features/add-card/hooks/useImageScan.test.ts`
  - `:808-831`: asserts today's wrong UPC_E fallback. Change it to the valid case.
  - `:858-915`: telemetry dedupe tests using UPC_E with the invalid contents `'A'`/`'B'`/`'C'`. They stay valid as the invalid-UPC-E path; keep them, and add a comment saying why.
  - `:833-856`: untouched.
- `node_modules/react-native-image-code-scanner/ios/ImageCodeScanner.swift` (patched) -- the `UPC_A` → `[.ean13, .upce]` registration and the `"UPC_E"` report. Grep for the symbol; line numbers shift with the patch.
- `docs/sprint-artifacts/stories/10-4-*.md` -- its note that EAN8/UPCA/CODE39 render nothing on the watch is stale (`targets/watch/BarcodeGenerator.swift:57-59` falls back to Code 128). Record this under Found, not fixed.

## Tasks & Acceptance

**Execution:**

- [x] `core/utils/expandUpcE.ts` + `expandUpcE.test.ts` + `core/utils/index.ts` -- the table, the check digit, every invalid case. Rationale: a pure, lossless step.
- [x] `features/add-card/hooks/useImageScan.ts` + test -- the hook behaviour above, at the single and multi-code sites. Rationale: the reachable path.

**Acceptance Criteria:**

- Given a valid `UPC_E` image result, when it is mapped, then `logger.notify('Barcode format fell back to CODE128')` is not called. Given an invalid one, it is called once.
- Given a UPC-E card of known expansion, scanned from an image on a real iPhone, when its rendered barcode is scanned by a second device, then the decoded value equals the expanded UPC-A (or its 13-digit EAN-13 form). Record the device, the OS, the build type and the payload length Vision returned.

## Implementation Notes

- `expandUpcE` (`core/utils/expandUpcE.ts`) is a pure arrow function: trim, `/^[01]\d{7}$/`, the four-row table, then the check digit, validated as ``isValidEAN13Checksum(`0${firstEleven}${C}`)`` (a 0-prefixed UPC-A is an EAN-13) so there is one checksum implementation. Number system 1 is accepted for decoder compatibility (GS1 assigns only 0; zxing accepts both). Test values were derived from the table and cross-checked against the published GS1 example `04252614` → `042100005264`.
- The hook gained `toSchemaBarcode(content, rawFormat, reportedFormats)`, called at both the single-code and the multi-code site in place of `mapFormat`. A `upc_e` label with an expandable payload returns `{ upcA, 'UPCA' }` and never calls `mapFormat`; everything else goes through `mapFormat` exactly as before. `normalizeBarcode` and its tests are untouched; `selectCode` is unchanged.
- The stale "reachable" comment in `mapFormat` now says a valid `UPC_E` never gets there and an invalid one still does.
- Tests: the old "UPC_E falls back" test now uses an invalid payload (`01234566`, bad check digit) and asserts one notify; the `'A'`/`'B'`/`'C'` dedupe tests are kept with a comment explaining they are the invalid-UPC-E path; a new `UPC-E expansion (Story 16.25)` block covers every expansion case, number system 1, lowercase label, trailing newline, the EAN13 hint, five invalid shapes, a PII check on the telemetry, a mixed multi-code scan (plus `selectCode`) and a valid + invalid UPC-E pair in one scan.

**Found, not fixed:**

- `docs/sprint-artifacts/stories/10-4-display-barcode-on-wear-os.md` (lines 76-78, 288, 325) still says watchOS returns `nil` for EAN8/CODE39/UPCA. That is stale — and the Code Map's correction ("falls back to Code 128") is stale too: since Story 16.28, `targets/watch/BarcodeGenerator.swift` encodes EAN-8, UPC-A and Code 39 in their own symbology (`modules(for:)`, around `:153-166`; see the `cacheVersion` comment). Not relevant to this story, since UPC-E is now stored as EAN-13.
- UNVERIFIED (medium if true): the patched `ImageCodeScanner.swift` passes Vision's `.upce` `payloadStringValue` through unchanged, and its length is unknown. If Vision ever returns 6 or 7 digits (number system or check digit dropped) or the expanded 12-digit UPC-A while still labelling it `UPC_E`, `expandUpcE` returns `null` and the card is still stored as CODE128 (with the fallback notify, so it would show in Sentry). Accepting those lengths would change the frozen "exactly 8 digits" rule. The device acceptance criterion settles it by recording the payload length Vision returned.

**Not done here:** the device round-trip acceptance criterion (real iPhone, rendered barcode read by a second device) needs a human with hardware.

**Device check (2026-11-09):**

- iOS Simulator, iPhone 17 Pro, iOS 26.4. A debug build loaded this branch's JS from Metro started in this worktree. The path was add card → Esselunga → "Scansiona da immagine".
- The synthetic UPC-E images `01234565` and `12345694` were added to the library with `simctl addmedia`. Beforehand, `zxing-wasm` decoded both as UPCE `0012345000065` / `0123456000094`, so the images are valid.
- Vision on the simulator detected no barcode in them. It also detected none in a real barcode photo already in the library. Every pick ended in the pre-existing "notFound" banner, so the simulator cannot reach the changed path.
- **Unchecked: iOS image scan of a UPC-E.** It needs a real iPhone, which is this story's device acceptance criterion and goes to the human. It also settles the payload-length question under Found, not fixed.
- **Android cannot reach the change.** `ImageCodeScannerModule.kt` registers `FORMAT_UPC_E` only when `UPC_E` is requested, and the app requests only `UPC_A`.
- The change has no UI, so there are no light or dark states to capture.
- Screenshots are kept outside the repository, in the session scratchpad: `device-check/ios-sim-upce-image-notfound.png` and `device-check/ios-sim-real-barcode-notfound.png`.

**Review loops (2026-11-09):**

- Code-review loop, round 1 (Sonnet): `VERDICT: APPROVED` with zero comments.
- QA loop, round 1 (Sonnet), which mapped every matrix row and acceptance criterion to its evidence: `VERDICT: APPROVED` with zero comments. The real-iPhone acceptance criterion maps to the device check's "unchecked" entry and goes to the human.

## Spec Change Log

## Review Triage Log

Step-4 review: blind hunter, edge-case hunter, verification-gap and project-conventions layers. The verification-gap and conventions layers reported nothing.

| #   | Layer       | Finding                                                                           | Verdict     | Route  | Evidence                                                                                                                                                                                                  |
| --- | ----------- | --------------------------------------------------------------------------------- | ----------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | edge, blind | A `UPC_E` payload of 12/13 digits is not expanded and falls back to CODE128       | maybe-false | defer  | Swift passes Vision's payload through raw (`ImageCodeScanner.swift`, `case .upce`); its length is unknown. Settled by the device AC's payload-length record. Under Found, not fixed (unverified, medium). |
| 2   | edge, blind | A 6- or 7-digit `UPC_E` payload is not expanded                                   | maybe-false | defer  | Same root cause as #1, grouped with it.                                                                                                                                                                   |
| 3   | edge        | Non-canonical UPC-E (d6=3 with d3≤2, d6=4 with d4=0, d6≥5 with d5=0) is accepted  | low         | reject | Conforming encoders never print these; the expansion is still lossless for what the symbol says. The fix adds guard branches the frozen rule does not ask for.                                            |
| 4   | blind       | A successful expansion leaves no telemetry trace                                  | low         | reject | New behaviour the intent does not ask for; an invalid UPC-E still notifies. Adding an event is more than a direct correction.                                                                             |
| 5   | blind       | `'upc_e'` literal instead of `ImageBarcodeFormat.UPC_E`                           | false       | reject | `BARCODE_FORMAT_MAP` keys the same decoder labels as lowercase literals (`upc_a`, `ean_13`, …); the literal follows that convention and breaks no caller.                                                 |
| 6   | blind       | `upcACheckDigit` duplicates the weighted checksum in `isValidEAN13Checksum`       | low         | patch  | Two checksum implementations can drift; replaced by `isValidEAN13Checksum('0' + upcA)`.                                                                                                                   |
| 7   | blind       | Multi-code results are not de-duplicated after expansion                          | false       | reject | One UPC-E symbol (51 modules) cannot also decode as EAN-13 (95 modules), so Vision yields one observation per symbol; duplicates need two printed symbols, which is unchanged behaviour.                  |
| 8   | blind       | EAN13-hint test does not assert the absence of the notify; no invalid + hint test | low         | patch  | Assertion added. An invalid UPC-E with a hint takes the unchanged pre-existing CODE128 path, so no new test is owed for it.                                                                               |
| 9   | blind       | The lowercase-label test copies `scanOne`'s setup                                 | low         | patch  | `scanOne` takes an optional format.                                                                                                                                                                       |
| 10  | blind       | Number system 1 is presented as standard                                          | low         | patch  | GS1 assigns only 0 to UPC-E; a header note now says number system 1 is accepted for decoder compatibility.                                                                                                |
| 11  | blind       | The diff leaves out the spec and tracker; the device AC is open                   | false       | reject | The exclusion is deliberate (DIFF FOR REVIEW). The device AC is open and goes to the human.                                                                                                               |
| 12  | blind       | No exhaustive round-trip / property test of the expansion                         | low         | reject | Every table row is pinned by fixed vectors plus a published GS1 example; a compressor for a property test adds code no requirement asks for.                                                              |

## Verification

**Commands:**

- `yarn typecheck`, `yarn lint`, `yarn format:check`, `yarn tokens:check` -- expected: clean
- `yarn test` -- expected: all pass, coverage at or above 80%, `normalizeBarcode` tests unchanged
- `yarn check:native-patches`, `yarn check:native-strings` -- expected: pass

**Manual checks (if no CLI):**

- The device round-trip above. JS only, so it can reach testers by OTA update.

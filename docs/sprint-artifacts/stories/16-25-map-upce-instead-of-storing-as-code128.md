---
title: 'Map UPC-E so a UPC-E barcode is not stored as Code 128'
type: 'bugfix'
created: '2026-11-04'
status: 'ready-for-dev'
route: 'dispatch'
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

- [ ] `core/utils/expandUpcE.ts` + `expandUpcE.test.ts` + `core/utils/index.ts` -- the table, the check digit, every invalid case. Rationale: a pure, lossless step.
- [ ] `features/add-card/hooks/useImageScan.ts` + test -- the hook behaviour above, at the single and multi-code sites. Rationale: the reachable path.

**Acceptance Criteria:**

- Given a valid `UPC_E` image result, when it is mapped, then `logger.notify('Barcode format fell back to CODE128')` is not called. Given an invalid one, it is called once.
- Given a UPC-E card of known expansion, scanned from an image on a real iPhone, when its rendered barcode is scanned by a second device, then the decoded value equals the expanded UPC-A (or its 13-digit EAN-13 form). Record the device, the OS, the build type and the payload length Vision returned.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `yarn typecheck`, `yarn lint`, `yarn format:check`, `yarn tokens:check` -- expected: clean
- `yarn test` -- expected: all pass, coverage at or above 80%, `normalizeBarcode` tests unchanged
- `yarn check:native-patches`, `yarn check:native-strings` -- expected: pass

**Manual checks (if no CLI):**

- The device round-trip above. JS only, so it can reach testers by OTA update.

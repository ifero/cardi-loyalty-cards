# Wear OS store-listing screenshots — PLACEHOLDERS, AND STILL BLOCKED

⚠️ **These are placeholders. Replace them before the listing goes public.**

Captured 2026-08-26 from the **debug** build on a round Wear OS emulator so that Story 16.35's Play
Console setup (Advanced settings → Form factors → Wear OS) is not blocked waiting on real assets.

## Why they are placeholders, specifically

The card data is the **DEBUG sample seeder**, not real content — the list shows fixtures named
`Aztec (unsupported)` and `Bad Checksum (invalid)`, which exist to exercise error paths and have no
business on a store page. The release build strips the seeder entirely, so a real capture needs a
signed build with cards synced from a paired phone.

| File               | Screen              | Notes                                                           |
| ------------------ | ------------------- | --------------------------------------------------------------- |
| `01-card-list.png` | Card list           | Shows the sort control and two rows; sample data is visible     |
| `02-barcode.png`   | Barcode (Esselunga) | The strongest of the two — real EAN-13 render, no fixture names |

If only one can be used, use `02-barcode.png`: it shows the app's actual purpose and contains no
test-fixture text.

## ⛔ Story 21.5 looked at regenerating these, and could not. Three blockers, all verified

Story 21.5's AC5 asked for these to be recaptured "from a RELEASE build with real card data". That
was attempted and abandoned on evidence rather than on effort. **Do not try again until all three
are cleared** — a capture made today is not merely no better than what is here, it is worse,
because it would replace an asset that announces itself as a placeholder with one that looks
finished while carrying colours the next story changes.

### 1. The release keystore is not in this repository

`watch-android/app/build.gradle.kts` carries no `signingConfig` for `release`, and says why:

> No `signingConfig`: the release keystore is @ifero's and must be the SAME key as the phone app
> (Play association + Data Layer both require it). Nothing signing-related is committed to this
> repo.

`assembleRelease` therefore produces an **unsigned** APK, which `adb install` refuses.

### 2. A release build has no cards to show

`BuildConfig.DEBUG` gates the seeder in `MainActivity`, so R8 strips `DebugSampleCards` and
`WearGraph.seedSampleCardsIfEmpty` from the release APK. Cards reach the watch **only** over the
Wearable Data Layer from a paired phone running the same-signed phone app — which needs the
keystore from (1), plus a phone emulator paired through the Wear OS companion app.

### 3. ✅ Cleared by Story 23.3: the Wear palette was knowingly stale

**Cleared.** Story 23.3 put the Cardì roles into `CarbonTheme.kt`: `primary` is beam `#FCCC0C`
with ink on it, the favourite star is beam, and `#4DA3FF` and `#F59E0B` appear in no Wear source
(`test/wear-cardi-palette.test.ts` asserts both). The committed PNGs still show the old palette, so
this page's warning about them stands until blockers 1 and 2 clear and they are recaptured. What
the blocker said, as it stood before Story 23.3:

This is the blocker that matters most, because it is invisible in a screenshot until you know to
look for it. `presentation/theme/CarbonTheme.kt` marks two values **KNOWINGLY STALE** in its own
comments:

| value              | current   | why it is wrong                                                                                      |
| ------------------ | --------- | ---------------------------------------------------------------------------------------------------- |
| `BrandPrimaryDark` | `#4DA3FF` | The phone's pre-rebrand dark `primary`. Story 21.2 made it beam `#FCCC0C`.                           |
| `FavoriteStarTint` | `#F59E0B` | Orange — and "the Cardì system bans orange by name". Bit-identical to the retired `orange` card key. |

They were left in place deliberately: _"The colour is left here rather than changed because moving
it needs the emulator pass 23.3 carries."_ `docs/sprint-artifacts/sprint-status.yaml` has
`23-3-wear-os-implementation: backlog`.

So the blue sort chip and the orange favourite star visible in `01-card-list.png` today are **still
what the app draws**. Recapturing now would bake both into a store listing that Story 23.3
invalidates as soon as it lands.

## Play's requirements for Wear OS screenshots

- **1:1 aspect ratio**, 384–3840 px per side. These are exactly **384 × 384** (the round emulator's
  native framebuffer), which is the minimum — acceptable, but a larger capture will look better.
- PNG or JPEG. These are PNG.
- App interface only: no device frames, no transparent backgrounds, no added text or graphics.

## Regenerating, once the three blockers are cleared

Prerequisites, in order:

1. ~~**Story 23.3 has landed**, so the chip is beam and the star is not orange.~~ Met by Story
   23.3.
2. **@ifero's release keystore** is available to sign both the Wear APK and the phone app with the
   same key.
3. A **paired phone** (device or emulator with the Wear OS companion app) holding genuine cards, so
   the Data Layer has a real snapshot to sync.

Then, per [`watch-android/README.md`](../../../watch-android/README.md):

```bash
emulator -avd wearos5_round_34 -no-snapshot-load -no-boot-anim -no-audio
```

```bash
cd watch-android && ./gradlew assembleRelease
```

```bash
adb shell am start -n com.iferoporefi.myloyaltycards/com.iferoporefi.myloyaltycards.wear.MainActivity
```

```bash
adb exec-out screencap -p > docs/design/wear-store-screenshots/01-card-list.png
```

Use `adb shell uiautomator dump /sdcard/ui.xml` + `adb shell cat /sdcard/ui.xml` to find a row's
`bounds` before tapping — the coordinates shift as the list scrolls, so do not hardcode them.

**Prefer a larger square device profile** so the images exceed Play's 384 px floor, and delete this
warning banner once the capture is genuinely from a release build with real cards.

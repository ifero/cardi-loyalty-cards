# Store screenshots (Story 24.6)

Captures of the real app UI for App Store Connect and the Play Console, in English (`en`) and
Italian (`it`). No added text, no device frames, no alpha channel. Uploaded **by hand**: nothing in
this repository uploads them (see [`../README.md`](../README.md)). The listing text that goes with
them is [`docs/store/listing.md`](../../../docs/store/listing.md).

`test/store-screenshots.test.ts` holds every file to its console's size, aspect, count and
no-alpha rules.

## Which file goes in which slot

| Folder              | Files             | Console slot                                           | Size        |
| ------------------- | ----------------- | ------------------------------------------------------ | ----------- |
| `app-store/<lang>/` | `iphone-NN-*.png` | iPhone 6.9" display                                    | 1320 × 2868 |
| `app-store/<lang>/` | `watch-NN-*.png`  | Apple Watch (Ultra 3, the largest size)                | 422 × 514   |
| `play/<lang>/`      | `phone-NN-*.png`  | Phone screenshots                                      | 9:16        |
| `play/<lang>/`      | `wear-NN-*.png`   | Wear OS screenshots (Advanced settings → Form factors) | 480 × 480   |

`en` is App Store "English (U.S.)" and Play `en-US`; `it` is App Store "Italiano" and Play `it-IT`.
Upload in file-name order. No iPad set: the app is iPhone-only (`supportsTablet: false`).

## The demo card set

Two catalogue brands, **Esselunga** and **IKEA**, beside four invented shops (Verde Mercato, Caffè
Lumen, Libreria Pagina, Palestra Onda): real brands are far more recognisable, and ifero accepted the
App Review risk on 2026-11-13 (decision 2 as revised; the listing text still names no retailer).
The Italian sets add a **Codice Fiscale** card (decision 5).

Every card number is made up. The EAN-13 values use the GS1 restricted-circulation prefix `20`,
which no real retailer card carries; the IKEA and the shop QR and Code 128/39 values are invented
strings; the codice fiscale `RSSMRA90A41H501N` has a deliberately wrong check character (the valid
one would be `A`), so it can never be a real person's code.

- Phone and Apple Watch: [`demo-cards.json`](demo-cards.json) (English, six cards) and
  [`demo-cards-it.json`](demo-cards-it.json) (Italian, the same plus the Codice Fiscale), read by
  Settings → Import Data.
- Wear OS: `DebugSampleCards.DEMO`, the English six (Wear shows initials, not logos).

## How each set was captured (2026-11-13)

All from this branch (Story 24.6), on top of `main` at `13530ce`. The screens that show cards were
recaptured the same day with the brand set; `iphone-03` and `phone-03` (the storage choice, no
cards) are unchanged.

### iPhone and Apple Watch

- **Build:** `npx expo prebuild --platform ios`, then `xcodebuild -workspace ios/Cardi.xcworkspace
-scheme Cardi -configuration Release -destination 'generic/platform=iOS Simulator'`, with
  `SENTRY_DISABLE_AUTO_UPLOAD=true` and `EXUpdatesEnabled` set to `false` in the generated
  `Expo.plist`, so the embedded bundle (this branch's JS) is what runs. A Release build: no dev
  menu, no LogBox.
- **Devices:** a fresh iPhone 17 Pro Max simulator (iOS 26.5) paired with a fresh Apple Watch Ultra
  3 (49 mm, watchOS 26.5). Status bar: `xcrun simctl status_bar … override --time 9:41
--batteryState charged --batteryLevel 100` (watchOS does not support the override, so the watch
  shows the real time).
- **Cards:** onboarding → Get Started → Keep cards on this device, then Settings → Import Data with
  `demo-cards.json` (`demo-cards-it.json` for Italian) copied into the app's Documents folder (Files → On My iPhone → Cardì). The watch
  received them from the phone over WatchConnectivity; nothing was seeded on the watch.
- **Language:** `defaults write -g AppleLanguages` on both simulators; Italian on a reinstalled app.
- **Screens:** `iphone-01-card-list` (light), `iphone-02-card-detail` (Esselunga; Codice Fiscale
  in Italian), `iphone-03-storage-choice` (onboarding's storage choice), `iphone-04-dark-mode` (the
  list in dark mode); `watch-01-card-list`, `watch-02-barcode` (Esselunga; Codice Fiscale in
  Italian).
- **Command:** `xcrun simctl io <device> screenshot <file>.png`.

### Wear OS

- **Build:** `cd watch-android && ./gradlew assembleDebug -PwearDemoSeed=true`. A debug build,
  because a release build carries no seeder and needs ifero's keystore and a paired phone (decision
  3); the UI is the same as release. The flag makes the seeder write `DebugSampleCards.DEMO`
  instead of the error-path fixtures.
- **Device:** a new AVD, `wearos_xl_round` profile (480 × 480, round), Wear OS 5 (API 34) image.
- **Cards:** the empty state's "Import sample cards" button.
- **Language:** `adb root`, `setprop persist.sys.locale it-IT`, restart.
- **Screens:** `wear-01-card-list` (unscrolled, so the localized title shows), `wear-02-barcode`
  (Esselunga). The barcode screen has no localized text, so its two locales are the same image.
- **Command:** `adb exec-out screencap -p > <file>.png`.

### Android phone

- **Build:** `npx expo prebuild --platform android`, then `./gradlew assembleRelease` with
  `expo.modules.updates.ENABLED` set to `false`, so the embedded bundle (this branch's JS) is what
  runs. A release build: no dev menu, no LogBox.
- **Device:** a new AVD, `cardi_phone_916`: 1080 × 1920 (9:16), 420 dpi, API 37
  Google Play image. Status bar: system UI demo mode (`com.android.systemui.demo`) with the clock at
  09:41, full battery and wifi, notifications hidden.
- **Cards:** onboarding → Get Started → Keep cards on this device, then Settings → Import Data with
  `demo-cards.json` (`demo-cards-it.json` for Italian) pushed to `/sdcard/Download`.
- **Language:** `adb shell cmd locale set-app-locales com.iferoporefi.myloyaltycards --locales it-IT`
  on a cleared app (`pm clear`), then the same steps.
- **Screens:** the same four as the iPhone set: `phone-01-card-list`, `phone-02-card-detail` (Esselunga;
  Codice Fiscale in Italian), `phone-03-storage-choice`, `phone-04-dark-mode` (`adb shell cmd uimode night yes`).
- **Command:** `adb exec-out screencap -p > <file>.png`.

### Every set

Simulator and emulator captures are RGBA. Each file was flattened to 8-bit RGB with:

```bash
node scripts/flatten-store-screenshots.mjs assets/store/screenshots/<store>/<lang>/*.png
```

The pixels do not change (every capture is opaque, and the round Wear corners are black).

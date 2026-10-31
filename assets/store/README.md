# Play Store artwork

Four files, uploaded to **Play Console by hand**. They are generated, gated and tested — none of
which was true before Story 21.5.

| file                                    | slot                   | frame       | format                   |
| --------------------------------------- | ---------------------- | ----------- | ------------------------ |
| `android-app-icon-512x512-alpha.png`    | App icon               | 512 × 512   | 32-bit PNG, fully opaque |
| `android-app-icon-512x512.png`          | App icon (24-bit twin) | 512 × 512   | 24-bit PNG               |
| `android-store-banner-1024x500.png`     | Feature graphic        | 1024 × 500  | 24-bit PNG, **no alpha** |
| `google-developer-banner-4096x2304.png` | Developer page header  | 4096 × 2304 | 24-bit PNG, **no alpha** |

**Upload `-alpha.png` as the app icon.** Google's specification says "Format: 32-bit PNG", and that
is the only difference between the two: both are the same opaque, full-bleed ink artwork, and only
`-alpha` carries an alpha channel (every byte 255). The unsuffixed file is the universally-safe
raster for anything that rejects an alpha channel.

## They are generated

```bash
yarn icons:build     # rewrite them from the mark
yarn icons:check     # fail if any has drifted
```

`scripts/build-brand-icons.mjs` is the generator of record, the same one that builds every app,
watchOS and Wear OS icon. Editing these PNGs by hand will be reverted by the next build and caught
by the next push.

### AC6 — the gating decision, and why

**They join `yarn icons:check`.** Recorded here because Story 21.5 asked for the decision to be
written down either way.

Nothing referenced or gated these four files before — not a script, not a config, not a workflow —
and the result is measurable rather than theoretical: they were committed on 2026-05-31 and never
touched again, so they still showed the pre-rebrand blue wallet three and a half months later, and
the rebrand shipped past them. Two of them were also simply **wrong**, which nobody could have seen
without opening them:

- the feature graphic's raster showed the wordmark **clipped** by the artwork beside it, letterboxed
  inside transparent bands, and carried an alpha channel the slot forbids;
- the `-alpha` icon was a **transparent** export. That mark's stem was white, so Play would have
  composited white bars onto its own white surface and shown an empty tile. The Tessera mark
  (Story 20.6) would fail in part: its beam card would stay visible, but its cream stem would all
  but vanish on Play's white surface, and its bar holes would show that surface through the card.

Generating them costs almost nothing — the icons are two rows in the generator's asset table, and
the banners share its PNG encoder — and `yarn icons:check` already runs in `.husky/pre-push` and in
`ci-quality-gates.yml`. So the gate came free with the generator, which is what the story predicted.

`yarn icons:check` only proves the committed bytes match the generator; it would defend a generator
that was wrong about Google's requirements. `test/store-artwork.test.ts` is the other half — it
asserts the published specification and the brand's own rules against the committed pixels.

## Listing TEXT is not here, and cannot be

There is **no `fastlane/metadata/`** in this repository and no `eas.json`, and every metadata and
image upload path is disabled in `fastlane/Fastfile`: `skip_metadata` / `skip_screenshots` on iOS,
and `skip_upload_metadata` / `_changelogs` / `_images` / `_screenshots` on both Android lanes.

Title, short description, full description and keywords are maintained **by hand in App Store
Connect and Play Console**. Do not create a `fastlane/metadata/` tree to make them look tracked: an
unuploaded shadow copy of the listing looks authoritative and is never read.

## Sources

- [App icon design specifications](https://developer.android.com/distribute/google-play/resources/icon-design-specifications)
- [Add preview assets to showcase your app](https://support.google.com/googleplay/android-developer/answer/9866151)

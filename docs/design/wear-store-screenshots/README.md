# Wear OS store screenshots — moved

**Retired by Story 24.6.** The Wear OS screenshots now live with every other store screenshot in
[`assets/store/screenshots/play/`](../../../assets/store/screenshots/) (`wear-01-card-list.png`,
`wear-02-barcode.png`, in `en/` and `it/`), and
[`assets/store/screenshots/README.md`](../../../assets/store/screenshots/README.md) says how they
were captured.

The two 384 px placeholders that sat here (debug fixtures such as `Aztec (unsupported)` on screen,
and the pre-23.3 palette) are deleted; git history keeps them. Their three blockers are settled:
the palette by Story 23.3, and the release keystore and paired phone by Story 24.6's decision 3,
which captures from a debug build seeded with the store demo card set (`-PwearDemoSeed=true`) instead.
The UI is the same as release.

# Landing-page screenshots

Web-sized copies of the store captures in
[`assets/store/screenshots/app-store/`](../../../assets/store/screenshots/README.md) (Story 24.6),
used by `docs/index.html`'s hero and Screenshots section. They live here because the site deploy
publishes only `docs/`. This README is excluded from the deploy.

| File                             | Source capture (`en` / `it`) | Size       |
| -------------------------------- | ---------------------------- | ---------- |
| `home-card-list.jpg`, `-it.jpg`  | `iphone-01-card-list.png`    | 660 × 1434 |
| `barcode-display.jpg`, `-it.jpg` | `iphone-02-card-detail.png`  | 660 × 1434 |
| `watch-card-list.jpg`, `-it.jpg` | `watch-01-card-list.png`     | 422 × 514  |

The device frames are drawn in `docs/style.css`, not in the images. To refresh them after a new
capture, from the repository root:

```bash
sips -s format jpeg -s formatOptions 82 --resampleWidth 660 assets/store/screenshots/app-store/en/iphone-01-card-list.png --out docs/assets/screenshots/home-card-list.jpg
```

(`iphone-02-card-detail` → `barcode-display`; the watch captures at their own size with
`formatOptions 85`; the Italian files from `it/` with the `-it` suffix.)

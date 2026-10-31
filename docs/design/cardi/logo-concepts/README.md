# Logo concepts

The exploration that replaced the barcode-stem mark, chosen by ifero on 2026-10-30. Every file is a
1024 SVG; `-mono` is the one-colour Android 13 themed layer of the file beside it. The review boards
(sizes, Android masks, watch, lockups, home-screen context and the brand-moment prototype) are on the
_Cardì logo concepts_ Design canvas.

| Round  | Files          | What it explored                                                                                                                                                                                                            |
| ------ | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1      | `1-…` to `5-…` | Five directions: Scatola (cards out of a box), Ventaglio (a fanned deck), La ì (the accent is a card), Timbro (a stamp card), Tasca (a card out of a C). Scatola and La ì went through.                                     |
| 2      | `round-2/`     | Three takes on each. Scatola: a tub, an open box on ink, an open box on beam. La ì: on beam, on ink with a bank-card stripe, on ink with a barcode. `wordmark-card-*` is La ì's card accent carried into the drawn ì.       |
| Chosen | `final/`       | **3C Tessera.** A cream capsule stem under a beam ID-1 card at 35° (grave), its five-bar barcode set low under a plain band, so it reads as a loyalty card rather than a bank card. The wordmark's ì carries the same card. |

`final/` is the reference the shipped assets are generated to match, not their source:
`scripts/lib/brand-mark.mjs` owns the geometry, and `scripts/build-brand-icons.mjs` and
`scripts/lib/brand-wordmark.mjs` draw from it (Story 20.6).

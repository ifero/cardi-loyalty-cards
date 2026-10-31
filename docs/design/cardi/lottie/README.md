# Onboarding animations

The Lottie files in [`assets/animations/onboarding/`](../../../../assets/animations/onboarding/) are **built**, not exported from an animation tool. `build-onboarding-lottie.py` writes all nine, and the committed JSON is its output byte for byte.

```bash
python3 docs/design/cardi/lottie/build-onboarding-lottie.py           # rebuild them
python3 docs/design/cardi/lottie/build-onboarding-lottie.py --check   # exit 1 if any is stale
```

No dependencies beyond the Python standard library, but it parses XML, so the interpreter needs a working `pyexpat`. If `import xml.etree.ElementTree` fails on your `python3`, run it with `uv run --python 3.12 --no-project python …` instead.

It is not in [`../tools/`](../tools/) on purpose: `verify.py` runs every script there as a frame generator, and this one writes animations.

## What it builds

| file                                          | size    | plays  |
| --------------------------------------------- | ------- | ------ |
| `onboarding-welcome-{light,dark}.json`        | 280×190 | 2.70 s |
| `onboarding-all-your-cards-{light,dark}.json` | 280×190 | 2.10 s |
| `onboarding-scan-or-type-{light,dark}.json`   | 280×190 | 2.46 s |
| `onboarding-your-data-{light,dark}.json`      | 280×190 | 2.22 s |
| `cardi-mark-intro.json`                       | 100×100 | 0.84 s |

Each one plays **once** and its last frame is the static drawing. Under Reduce Motion, show the last frame and nothing is lost. Do not loop them.

`cardi-mark-intro.json` is brand moment D, "scan, then settle", and replaces `<BrandedIcon size={100} iconSize={34} />` on Welcome: the same ink field and the same mark, at the app icon's proportion, so the mark's box takes 71.8 of the 100 field as it takes 735.70 of 1024 in `assets/images/cardi-mark.svg` (Story 22.10, decision 6). It serves both schemes, because the mark always brings its own ink ground. The Welcome illustration holds its fan closed for the first 0.9 s, so start both files together and the sequence lines up.

For the Tessera mark (Story 20.6) the moment is drawn this way. Frame 0 is the stem alone. At 0.12 s a horizontal beam cuts on just above where the card lies level; it is as wide as the card plus 34⁄166 of the card's height on each side, and 18⁄166 of that height thick. It sweeps down over the card at a steady pace, drawing the card in behind it, and cuts off just below it at 0.50 s. The card turns from 0.54 s, past the grave to 38.5° at 0.74 s, and settles on 35° at 0.84 s, so the last frame is the static mark. The beam sweeps top to bottom, as the **Motion** bullet under _Illustrations_ in [`cardi-design-system.md`](../cardi-design-system.md) says, and it never fades. The card is drawn whole from the start, its bars painted ink because the disc behind them is always ink, and an ink cover hides it: the cover's top edge rides the beam's centre line down, which reveals the card without a mask or a matte.

## Where the inputs come from

- **The drawings:** the `<template>` SVGs in `onboarding-illustrations.source.html`. This is the markup of the Design canvas the set was adopted on. Open the file in a browser to see each drawing at rest and a strip of frames through its motion.
- **The motion:** that file's CSS keyframes, restated per property in the generator's `motion()`. The CSS is the reference. Change both together.
- **The mark:** [`assets/images/cardi-mark-inline.svg`](../../../../assets/images/cardi-mark-inline.svg), which `yarn icons:build` generates from the one geometry the app icon and the launch screen share. The generator reads it and never copies it, so re-running after a mark change is enough. It expects exactly one stem rect and one card path turned about the card's centre, with `fill-rule="evenodd"`: the first subpath is the card and the others are its bars. Anything else raises a `ValueError` and the build fails rather than approximating it. Paths may use circular arcs (`A`, `a`), which become cubic Béziers of at most 90° each; an elliptical arc is refused.
- **Dark mode:** a rule, not a second drawing. Cream lines on black, the beam unchanged, every stroke 0.25 lighter. The fills that hide what is behind become black, never ink.

## Renderer subset

The generator uses only features that lottie-ios and lottie-android both draw:

- one shape layer per file;
- groups, and rect, ellipse and path shapes;
- solid fills, and strokes, dashed or not;
- trim paths and group transforms;
- eased, linear and hold keyframes; a held track ends on a held keyframe, because lottie-android drops an unheld last one.

It uses no masks, mattes, expressions, images or text.

`lottie-react-native` is not installed yet. The SDK pins `~7.3.4` (in `expo/bundledNativeModules.json`). It is a native module, so add it with `npx expo install lottie-react-native` and make a new dev build.

## Prettier

`assets/animations/` is listed in `.prettierignore`. The files are minified generator output, and Prettier would reflow them into something `--check` can never match again.

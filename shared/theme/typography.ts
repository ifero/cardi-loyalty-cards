/**
 * The Cardì type scale (Story 21.6).
 *
 * Re-derived from `docs/design/cardi/cardi-design-system.md#Typography` and the font rules of the
 * nine app-screen frames in `docs/design/cardi/frames/` — not a relabelling of the Apple HIG scale
 * this replaced. Story 21.6's Dev Agent Record holds the full old-to-new mapping and names what
 * was lost.
 *
 * **The faces are embedded at build time** by the `expo-font` config plugin in `app.json`, so the
 * OS registers them before any JavaScript runs. There is no loading state, no gate to compose into
 * boot readiness, and nothing that can delay the launch hand-off — text is in the brand faces on
 * the first frame it exists. `test/brand-fonts.test.ts` holds the tokens, the plugin entry and the
 * committed files to each other.
 *
 * Typography stays hand-authored here rather than joining the Style Dictionary pipeline in
 * `tokens/` — see "Typography is not a DTCG token" in `docs/design/CONTRIBUTING-DESIGN.md`.
 *
 * Phone only. Neither watch app reads this scale, and by design neither ships a custom face:
 * both keep their platform's system type (`docs/design/cardi/cardi-watch-grammar.md` §5.2).
 */

/**
 * The three brand families, spelled exactly as each face's own name table spells its family.
 * iOS resolves `fontFamily` by that name, and `app.json` registers the Android font family under
 * the same string, so one value selects the same face on both platforms and `fontWeight` picks
 * the weight within it.
 */
export const FONT_FAMILY = {
  /** Space Grotesk — display and large headlines. Ships one master: Bold. */
  display: 'Space Grotesk',
  /** Inter — everything else. Ships Regular, SemiBold and Bold. */
  text: 'Inter',
  /** JetBrains Mono — card numbers, so digits align while someone reads them aloud. Medium. */
  mono: 'JetBrains Mono'
} as const;

export type FontFamily = (typeof FONT_FAMILY)[keyof typeof FONT_FAMILY];

/**
 * `'800'` stays representable because the design system specified it for `display-lg` (AC4); it
 * now says 700 (Story 22.1), since Space Grotesk's heaviest master is 700 (its `wght` axis runs
 * 300–700). No token uses it, and `test/brand-fonts.test.ts` fails if one does without a face to
 * back it.
 */
export type FontWeight = '400' | '500' | '600' | '700' | '800';

export type TypographyToken = {
  fontFamily: FontFamily;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  fontWeight: FontWeight;
};

/**
 * Design-system tracking is specified in **em**; React Native's `letterSpacing` is in **points**.
 * Each value is resolved against its own token's size and rounded to 0.01pt. Copying the em number
 * across unconverted would shrink every value by its token's size — 12× to 34× too weak on this
 * scale, so `display-lg`'s tight tracking would all but vanish.
 */
export const emToPoints = (em: number, fontSize: number): number => {
  const points = Math.round(em * fontSize * 100) / 100;
  // `-0 === 0`, so this returns +0 for both, keeping zero-tracking tokens equal to a literal 0.
  return points === 0 ? 0 : points;
};

const token = (
  fontFamily: FontFamily,
  fontSize: number,
  lineHeight: number,
  fontWeight: FontWeight,
  trackingEm = 0
): TypographyToken => ({
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
  letterSpacing: emToPoints(trackingEm, fontSize)
});

export const TYPOGRAPHY = {
  // Space Grotesk — carries the personality.
  /** `display-lg` — the onboarding hero title, at the face's heaviest weight (see FontWeight). */
  displayLg: token(FONT_FAMILY.display, 34, 40, '700', -0.03),
  /** `headline-md` — screen and card titles. */
  headlineMd: token(FONT_FAMILY.display, 24, 32, '700', -0.01),
  /**
   * Titles of sheets, dialogs and self-contained panels (the settings guest block) — the eighth
   * token (AC5b). `headline-sm` is Inter and stays Inter: the same 20px tier sets the barcode
   * hero's store name, which the design system ratifies as NOT wearing the display face.
   * Untracked, as every frame that draws it is.
   */
  sheetTitle: token(FONT_FAMILY.display, 20, 28, '700'),

  // Inter — carries the legibility.
  /** `headline-sm` — the store name on the barcode hero, in-screen titles. */
  headlineSm: token(FONT_FAMILY.text, 20, 28, '700'),
  /** `body-lg` — rows, values and input text. */
  bodyLg: token(FONT_FAMILY.text, 17, 24, '400'),
  /** `body-lg` at semibold — button labels, row titles and messages that must be seen first. */
  bodyLgStrong: token(FONT_FAMILY.text, 17, 24, '600'),
  /** `body-md` — body copy, and the floor for any sentence a user reads (15px). */
  bodyMd: token(FONT_FAMILY.text, 15, 22, '400'),
  /** `body-md` at semibold — links inside a sentence, and short emphasised copy. */
  bodyMdStrong: token(FONT_FAMILY.text, 15, 22, '600'),

  // The chrome tier (Story 21.2 AC14) — text that labels, counts or annotates something already on
  // screen, and the only text allowed below the 15px floor. Never a sentence the user reads.
  /** Dismiss hints ("Tap anywhere to close"). */
  captionLg: token(FONT_FAMILY.text, 14, 20, '400'),
  /**
   * `label-bold` — form field labels (uppercase, which the positive tracking is the idiom for)
   * and short sentence-case labels: tile card names, the sort row, badges, counts.
   */
  labelBold: token(FONT_FAMILY.text, 13, 18, '600', 0.02),
  /** Field errors, helper text, format names and other annotations. */
  captionMd: token(FONT_FAMILY.text, 13, 18, '400'),
  /** Uppercase section headers and table heads: a label for the rows beneath it. */
  overline: token(FONT_FAMILY.text, 12, 16, '600', 0.05),
  /** Document metadata and footnotes. */
  captionSm: token(FONT_FAMILY.text, 12, 16, '400'),

  // JetBrains Mono — digits that do not jitter.
  /** `mono-code` — every card number, one token for all of them (AC8). */
  monoCode: token(FONT_FAMILY.mono, 16, 24, '500'),
  /** The one-field verification code: tracked ~8px so eight digits are countable at a glance. */
  monoCodeLg: token(FONT_FAMILY.mono, 22, 32, '500', 8 / 22)
} satisfies Record<string, TypographyToken>;

export type TypographyTokenName = keyof typeof TYPOGRAPHY;

/**
 * Native navigation-bar titles take `bodyLgStrong`'s face but deliberately NOT a size: iOS draws a
 * title at 17pt when none is given — the token's own size — and Android keeps its toolbar's. The
 * story that swaps the face is not the one that resizes the header: Epic 22 redesigns it screen by
 * screen. Home's title already takes `headlineMd`'s face, size and weight (Story 22.2, in
 * `app/_layout.tsx`); every other screen keeps this face at the platform's size until its own story.
 */
export const NAVIGATION_TITLE_FONT = {
  fontFamily: TYPOGRAPHY.bodyLgStrong.fontFamily,
  fontWeight: TYPOGRAPHY.bodyLgStrong.fontWeight
} as const;

/** The tokens allowed below the 15px body floor — Story 21.2's named chrome tier. */
export const CHROME_TIER = [
  'captionLg',
  'labelBold',
  'captionMd',
  'overline',
  'captionSm'
] as const satisfies readonly TypographyTokenName[];

/**
 * A token for a single-line `TextInput`: every metric except the line height. iOS lays out a
 * single-line field's text by the paragraph line height, so a line box taller than the field —
 * which Dynamic Type makes of any fixed-height field at its largest sizes — pushes the text,
 * placeholder included, out of view. Measured on device (Story 21.6): the wallet search placeholder
 * vanished at the largest size while it carried `bodyLg`'s line height. The field's own height
 * sets the line instead, as it did before the scale gave every token one.
 */
export const inputFont = ({ fontFamily, fontSize, fontWeight, letterSpacing }: TypographyToken) =>
  ({ fontFamily, fontSize, fontWeight, letterSpacing }) satisfies Omit<
    TypographyToken,
    'lineHeight'
  >;

/**
 * Initials in an avatar or a logo-less tile. These are marks sized to their container rather than
 * text on the scale, so they take the display face at its one weight and whatever size the
 * container gives them — and deliberately NO `lineHeight`: the face's natural line box keeps a
 * capital optically centred (Space Grotesk's ascent/descent midpoint sits within 0.01em of its
 * cap-height midpoint), which a fixed line height would not at every size.
 *
 * Not every initial takes it. The add-card brand list's circle initials (`bodyMdStrong`) and the
 * scanner pill's dot initial (`labelBold`) draw Inter, as the capture frames do — still with
 * `MONOGRAM_TEXT_PROPS` (Story 22.5). Neither is an oversight to bring back to this face.
 */
export const monogram = (fontSize: number) =>
  ({ fontFamily: FONT_FAMILY.display, fontWeight: '700', fontSize }) as const satisfies Omit<
    TypographyToken,
    'lineHeight' | 'letterSpacing'
  >;

/**
 * Props for a monogram's `<Text>`: it does not take Dynamic Type, any more than an icon does. The
 * container it is sized to does not grow, so a scaled glyph only overflows it — at the largest
 * size an 18pt initial becomes 64pt in a 48pt plate — and the information it carries is the
 * card's name, which is set in scaling text beside it.
 */
export const MONOGRAM_TEXT_PROPS = { allowFontScaling: false } as const;

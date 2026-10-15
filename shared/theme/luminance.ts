/**
 * Luminance Utility
 * Shared color contrast calculation for brand-colored headers and hero sections.
 *
 * Used by:
 * - BrandHero component (card detail hero section)
 * - Card Detail screen (branded navigation header)
 * - BrandPill / BrandRow (brand-coloured chips and the brand list's initials)
 * - ColorPicker (the check on the selected swatch)
 * - CardTile (the favourite badge's field)
 */
import { IDENTITY_COLORS } from './tokens.generated';

/**
 * Luminance above which a field counts as "light" and takes dark foregrounds.
 *
 * Shared by both decisions below so a field can never be light enough for dark
 * text and dark enough for a beam glyph at the same time.
 */
const LIGHT_FIELD_THRESHOLD = 0.5;

/**
 * Calculate relative luminance of a hex color (simplified linear approximation).
 * Sufficient for binary white/black foreground decisions.
 * @param hex - Hex color string (e.g., "#0C843C" or "0C843C")
 * @returns Luminance value between 0 (black) and 1 (white)
 */
export const getLuminance = (hex: string): number => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Get a contrast-appropriate foreground color for a given background.
 * Returns white for dark backgrounds, ink for light backgrounds.
 *
 * The dark branch is `#FFFFFF` rather than cream deliberately: this runs over
 * the 44 distinct catalogue brand colours and the card accents, not over the
 * app's own surfaces, so it is a legibility decision on somebody else's colour
 * rather than a theme one. The light branch is ink (Story 21.2) — it used to be
 * the pre-rebrand `#1F1F24`, which no palette contains any more.
 *
 * @param backgroundHex - Background hex color
 * @returns Foreground color hex string
 */
export const getContrastForeground = (backgroundHex: string): string =>
  getLuminance(backgroundHex) < LIGHT_FIELD_THRESHOLD ? '#FFFFFF' : IDENTITY_COLORS.ink;

/**
 * Colour for a FILLED favourite star drawn directly on a brand or accent field.
 *
 * The design system wants beam: on the card-detail screen the star "is the only
 * yellow on the screen". That holds on every dark field and breaks on a light
 * one — Esselunga is `#FFCC00`, three points from beam `#FCCC0C`, and it is
 * likely the most-used card in the app, so a beam star on an Esselunga header
 * is invisible rather than subtle. Falling back to ink keeps the star legible
 * and keeps the filled/outline distinction doing the work of saying
 * "favourite", which is the part the user actually reads.
 *
 * This also pre-answers a collision Story 21.2a creates one wave later: it
 * makes beam itself a user-pickable card accent, and a beam field resolves here
 * to an ink star by the same rule, with no further change.
 *
 * Only the *filled* (favourited) state goes through here. The unfavourited
 * outline star follows the field's own foreground via `getContrastForeground`.
 *
 * @param fieldHex - The hex of the field the star is drawn on
 * @returns Beam on dark fields, ink on light ones
 */
export const getFavouriteStarColor = (fieldHex: string): string =>
  getLuminance(fieldHex) < LIGHT_FIELD_THRESHOLD ? IDENTITY_COLORS.beam : IDENTITY_COLORS.ink;

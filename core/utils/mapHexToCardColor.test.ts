/**
 * mapHexToCardColor Tests
 * Story 3.3: Brand color mapping
 * Story 21.2a: buckets RE-DERIVED for the Cardì accents (AC3)
 *
 * The palette these assertions describe has two blues (deep `#0C3C84` and azure
 * `#0C84CC`), no neutral, and a yellow where the orange used to be — so the
 * question each case answers is "which of five fixed hues is this brand nearest",
 * not "which RGB channel is largest". Cases that moved are called out inline.
 */

import { DEFAULT_CARD_COLOR } from '@/core/schemas/card';

import { CARD_COLORS } from '@/shared/theme/tokens.generated';

import catalogue from '@/catalogue/italy.json';

import {
  ACCENT_PALETTE,
  ACHROMATIC_CHROMA_THRESHOLD,
  chromaOf,
  mapHexToCardColor
} from './mapHexToCardColor';

describe('mapHexToCardColor', () => {
  /**
   * The mapper cannot import the generated tokens: `core` may only import from
   * `core` and `catalogue` (eslint `boundaries/element-types`), and the tokens
   * live under `shared`. Its palette is therefore a local copy — and this test is
   * what stops that copy from drifting, because test files are exempt from the
   * boundary rule. Without it, re-running `yarn tokens:build` would repaint the
   * app and silently leave the mapper matching against the retired hexes, which
   * is exactly the defect Story 21.2a was split out to fix.
   */
  describe('the local palette is the token palette (AC3)', () => {
    it('matches CARD_COLORS exactly', () => {
      expect(ACCENT_PALETTE).toEqual(CARD_COLORS);
    });

    it('maps every accent to its own key', () => {
      for (const [key, hex] of Object.entries(CARD_COLORS)) {
        expect(mapHexToCardColor(hex)).toBe(key);
      }
    });
  });

  describe('Red colors', () => {
    it('should map pure red to red', () => {
      expect(mapHexToCardColor('#FF0000')).toBe('red');
    });

    it('should map Toys Center red to red', () => {
      expect(mapHexToCardColor('#E30613')).toBe('red');
    });

    it('should map dark red to red', () => {
      expect(mapHexToCardColor('#8B0000')).toBe('red');
    });

    // MOVED (was `orange`). Orange is banned from the design system, so a
    // red-orange has no orange to land on: it is nearer red `#E42424` than beam
    // yellow `#FCCC0C`.
    it('should map red-orange to red now that orange is banned', () => {
      expect(mapHexToCardColor('#FF6B35')).toBe('red');
    });
  });

  describe('Blue colors — the palette now holds two', () => {
    it('should map pure blue to the deep blue', () => {
      expect(mapHexToCardColor('#0000FF')).toBe('blue');
    });

    it('should map a navy to the deep blue', () => {
      expect(mapHexToCardColor('#1E3A8A')).toBe('blue');
    });

    // MOVED (was `blue`). The single blue bucket used to swallow every blue;
    // `#3B82F6` is a bright mid-blue and the palette now has an azure for exactly
    // that. This assertion is the two-blues split working.
    it('should map a bright mid-blue to the azure accent, not the deep blue', () => {
      expect(mapHexToCardColor('#3B82F6')).toBe('grey');
      expect(CARD_COLORS.grey).toBe('#0C84CC');
    });

    it('should keep catalogue navies on the deep blue and catalogue azures on the azure', () => {
      expect(mapHexToCardColor('#004E9F')).toBe('blue'); // Carrefour
      expect(mapHexToCardColor('#0082C3')).toBe('grey'); // Decathlon
    });
  });

  describe('Green colors', () => {
    it('should map pure green to green', () => {
      expect(mapHexToCardColor('#00FF00')).toBe('green');
    });

    it('should map medium green to green', () => {
      expect(mapHexToCardColor('#22C55E')).toBe('green');
    });

    it('should map dark green to green', () => {
      expect(mapHexToCardColor('#166534')).toBe('green');
    });
  });

  describe('Yellow — reached by the frozen `orange` key', () => {
    it('should map pure orange to the yellow accent', () => {
      expect(mapHexToCardColor('#FFA500')).toBe('orange');
      expect(CARD_COLORS.orange).toBe('#FCCC0C');
    });

    it('should map Esselunga yellow to the yellow accent', () => {
      expect(mapHexToCardColor('#FFCC00')).toBe('orange');
    });
  });

  describe('Achromatic input — no hue to place on a five-hue palette', () => {
    it('should map pure grey to the default accent', () => {
      expect(mapHexToCardColor('#808080')).toBe(DEFAULT_CARD_COLOR);
    });

    it('should map white to the default accent', () => {
      expect(mapHexToCardColor('#FFFFFF')).toBe(DEFAULT_CARD_COLOR);
    });

    it('should map black to the default accent', () => {
      expect(mapHexToCardColor('#000000')).toBe(DEFAULT_CARD_COLOR);
    });

    it('should map low saturation colors to the default accent', () => {
      expect(mapHexToCardColor('#CCCCCC')).toBe(DEFAULT_CARD_COLOR);
    });

    it('should map the near-neutral catalogue brands to the default accent', () => {
      expect(mapHexToCardColor('#333F48')).toBe(DEFAULT_CARD_COLOR); // Upim slate
      expect(mapHexToCardColor('#202124')).toBe(DEFAULT_CARD_COLOR); // Desigual near-black
      expect(mapHexToCardColor('#F4E9DB')).toBe(DEFAULT_CARD_COLOR); // Burger King cream
    });

    /**
     * The threshold has to sit below every accent's own chroma, or an accent
     * would classify itself as neutral and the palette would collapse to one
     * colour. The smallest is the deep blue's 0.1311, against a 0.04 threshold —
     * asserted directly rather than inferred from the mapping, so the margin is
     * visible if someone later widens the threshold.
     */
    it('leaves every accent comfortably clear of the achromatic threshold', () => {
      for (const hex of Object.values(CARD_COLORS)) {
        const chroma = chromaOf(hex);
        expect(chroma).not.toBeNull();
        expect(chroma!).toBeGreaterThan(ACHROMATIC_CHROMA_THRESHOLD * 2);
      }
    });
  });

  describe('Invalid input', () => {
    it('should return the default accent for invalid hex', () => {
      expect(mapHexToCardColor('invalid')).toBe(DEFAULT_CARD_COLOR);
    });

    it('should return the default accent for empty string', () => {
      expect(mapHexToCardColor('')).toBe(DEFAULT_CARD_COLOR);
    });

    it('should return the default accent for a malformed hex', () => {
      expect(mapHexToCardColor('#12345')).toBe(DEFAULT_CARD_COLOR);
      expect(mapHexToCardColor('#GGGGGG')).toBe(DEFAULT_CARD_COLOR);
    });
  });

  /**
   * The distribution the story records, asserted rather than written down.
   *
   * This exists because the number in the story WAS wrong once: it was computed
   * during the first experiment — plain Euclidean distance, no lightness weight, no
   * achromatic branch — and copied forward unchanged after the algorithm changed. A
   * figure that only a human re-derives is a figure that silently rots, and this one
   * is load-bearing: it is how anyone judges whether routing 46% of the catalogue to
   * the default accent is acceptable.
   *
   * If a brand is added or recoloured, this fails. Update the numbers HERE and in the
   * story's AC3 notes together — that coupling is the point.
   *
   * The 15 brands added on 2026-11-27 are all chromatic, so the default accent's
   * share DROPPED from 46% to 38% even though the catalogue grew by a quarter.
   */
  describe('the catalogue distribution the story documents (AC3)', () => {
    const tally = (keys: string[]): Record<string, number> =>
      keys.reduce<Record<string, number>>(
        (acc, key) => ({ ...acc, [key]: (acc[key] ?? 0) + 1 }),
        {}
      );

    it('matches the table in the story record', () => {
      const counts = tally(catalogue.brands.map((brand) => mapHexToCardColor(brand.color)));

      expect(counts).toEqual({ grey: 27, blue: 17, red: 15, orange: 7, green: 6 });
      expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(catalogue.brands.length);
    });

    it('routes the documented number of brands through the achromatic branch', () => {
      const achromatic = catalogue.brands.filter((brand) => {
        const chroma = chromaOf(brand.color);
        return chroma !== null && chroma < ACHROMATIC_CHROMA_THRESHOLD;
      });

      expect(achromatic).toHaveLength(20);
      // All of them land on the default accent, which is what makes its share large.
      for (const brand of achromatic) {
        expect(mapHexToCardColor(brand.color)).toBe(DEFAULT_CARD_COLOR);
      }
    });
  });

  describe('Determinism', () => {
    it('is stable and total over every catalogue brand colour', () => {
      const { brands } = catalogue;

      expect(brands.length).toBeGreaterThan(0);

      for (const brand of brands) {
        const first = mapHexToCardColor(brand.color);
        expect(Object.keys(CARD_COLORS)).toContain(first);
        expect(mapHexToCardColor(brand.color)).toBe(first);
        // Case must not change the answer — catalogue hexes are mixed case.
        expect(mapHexToCardColor(brand.color.toLowerCase())).toBe(first);
      }
    });
  });
});

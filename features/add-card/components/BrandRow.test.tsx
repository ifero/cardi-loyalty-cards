/**
 * BrandRow Component Tests
 * Story 13.4: Restyle Add Card Flow (AC1)
 * Story 22.5: Capture frame A's 64pt row
 */

import { render, screen, fireEvent } from '@testing-library/react-native';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { StyleSheet } from 'react-native';

import { TYPOGRAPHY } from '@/shared/theme/typography';

import { CatalogueBrand } from '@/catalogue/types';

import { BrandRow } from './BrandRow';

let mockIsDark = false;

// The real token values: the circle's outline and the row's text are checked against what the
// app paints, in both schemes.
jest.mock('@/shared/theme', () => {
  const { DARK_THEME, LIGHT_THEME } = jest.requireActual('@/shared/theme/colors');
  return {
    useTheme: () => ({ theme: mockIsDark ? DARK_THEME : LIGHT_THEME, isDark: mockIsDark })
  };
});

type Scheme = 'light' | 'dark';

const PALETTE: Record<Scheme, { textPrimary: string; textSecondary: string; border: string }> = {
  light: { textPrimary: '#181824', textSecondary: '#55555F', border: '#D6D6CB' },
  dark: { textPrimary: '#F0F0E8', textSecondary: '#B5B5AB', border: '#3A3A48' }
};

const INK = '#181824';
const WHITE = '#FFFFFF';

const brand = (name: string, color: string): CatalogueBrand => ({
  id: name.toLowerCase(),
  name,
  color,
  logo: name.toLowerCase(),
  aliases: []
});

const esselunga = brand('Esselunga', '#FFCC00');
const lidl = brand('Lidl', '#0050AA');
const coin = brand('Coin', '#ffffff');
const zara = brand('Zara', '#000000');

const styleOf = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

const renderRow = (subject: CatalogueBrand, onPress = jest.fn()) =>
  render(<BrandRow brand={subject} onPress={onPress} testID="brand-row" />);

describe('BrandRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockIsDark = false;
  });

  describe('rendering', () => {
    it('renders brand name', () => {
      renderRow(esselunga);
      expect(screen.getByText('Esselunga')).toBeTruthy();
    });

    it('renders the brand’s initial in its circle', () => {
      renderRow(esselunga);
      expect(screen.getByText('E')).toBeTruthy();
    });

    it('capitalises a lower-case initial', () => {
      renderRow(brand('ikea', '#0058A3'));
      expect(screen.getByText('I')).toBeTruthy();
    });

    it('draws a Lucide chevron, not a MaterialIcons glyph', () => {
      renderRow(esselunga);
      expect(screen.UNSAFE_getByType(ChevronRight)).toBeTruthy();
      expect(screen.queryByText('chevron-right')).toBeNull();
    });
  });

  describe('interactions', () => {
    it('calls onPress with brand when tapped', () => {
      const onPress = jest.fn();
      renderRow(esselunga, onPress);
      fireEvent.press(screen.getByTestId('brand-row'));
      expect(onPress).toHaveBeenCalledWith(esselunga);
    });

    // The design system's tap feedback: a 0.98× scale while held, back to rest on release.
    it('scales to 0.98 while pressed and back when released', () => {
      renderRow(esselunga);
      const row = screen.getByTestId('brand-row');
      const style = () => StyleSheet.flatten(row.props.style);

      expect(style().transform).toBeUndefined();
      fireEvent(row, 'pressIn');
      expect(style().transform).toEqual([{ scale: 0.98 }]);
      fireEvent(row, 'pressOut');
      expect(style().transform).toBeUndefined();
    });
  });

  describe('accessibility', () => {
    it('has button role', () => {
      renderRow(esselunga);
      expect(screen.getByTestId('brand-row').props.accessibilityRole).toBe('button');
    });

    it('has brand name as accessibility label', () => {
      renderRow(esselunga);
      expect(screen.getByTestId('brand-row').props.accessibilityLabel).toBe('Esselunga');
    });
  });

  // Story 22.5 — capture frame A.
  describe('frame A', () => {
    it('is 64pt tall, padded 0 16 with a 16pt gap', () => {
      renderRow(esselunga);

      expect(styleOf('brand-row')).toMatchObject({
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 64,
        paddingHorizontal: 16,
        gap: 16
      });
    });

    // Large text grows the row rather than clipping it: the row has no fixed height, and the name
    // wraps instead of being cut to one line with an ellipsis.
    it('grows with a name that wraps under large text, rather than clipping it', () => {
      renderRow(esselunga);

      expect(styleOf('brand-row').height).toBeUndefined();
      expect(screen.getByText('Esselunga').props.numberOfLines).toBeUndefined();
    });

    it('fills a 40pt circle with the brand’s own colour, untinted', () => {
      renderRow(esselunga);

      expect(styleOf('brand-row-circle')).toMatchObject({
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFCC00'
      });
    });

    it.each<[string, CatalogueBrand, string]>([
      ['ink on a light brand', esselunga, INK],
      ['white on a dark brand', lidl, WHITE]
    ])('sets the initial in body-md semibold, %s', (_, subject, foreground) => {
      renderRow(subject);

      expect(
        StyleSheet.flatten(screen.getByText(subject.name.charAt(0)).props.style)
      ).toMatchObject({ ...TYPOGRAPHY.bodyMdStrong, color: foreground });
    });

    // A mark sized to its circle: the name beside it scales, the initial does not.
    it('keeps the initial out of Dynamic Type', () => {
      renderRow(esselunga);

      expect(screen.getByText('E').props.allowFontScaling).toBe(false);
      expect(screen.getByText('Esselunga').props.allowFontScaling).not.toBe(false);
    });

    describe.each<Scheme>(['light', 'dark'])('in %s', (scheme) => {
      const roles = PALETTE[scheme];

      beforeEach(() => {
        mockIsDark = scheme === 'dark';
      });

      it('sets the name in body-lg textPrimary', () => {
        renderRow(esselunga);

        expect(StyleSheet.flatten(screen.getByText('Esselunga').props.style)).toMatchObject({
          ...TYPOGRAPHY.bodyLg,
          color: roles.textPrimary
        });
      });

      it('draws the chevron at 24 / 1.5 in textSecondary', () => {
        renderRow(esselunga);

        expect(
          screen.getByTestId('brand-row-chevron', { includeHiddenElements: true }).props
        ).toMatchObject({ width: 24, height: 24, strokeWidth: 1.5, stroke: roles.textSecondary });
      });

      // The card tile's rule: a very light brand takes the hairline in either scheme.
      it('outlines a very light brand’s circle', () => {
        renderRow(coin);
        expect(styleOf('brand-row-circle')).toMatchObject({
          borderWidth: 1,
          borderColor: roles.border
        });
      });

      it('leaves a mid-tone brand’s circle without an outline', () => {
        renderRow(lidl);
        expect(styleOf('brand-row-circle').borderWidth).toBeUndefined();
      });
    });

    // ...and a near-black one only against the dark scheme's ink surface.
    it('outlines a near-black brand’s circle in dark, and not in light', () => {
      const { rerender } = renderRow(zara);
      expect(styleOf('brand-row-circle').borderWidth).toBeUndefined();

      mockIsDark = true;
      rerender(<BrandRow brand={zara} onPress={jest.fn()} testID="brand-row" />);
      expect(styleOf('brand-row-circle')).toMatchObject({
        borderWidth: 1,
        borderColor: PALETTE.dark.border
      });
    });
  });
});

/**
 * OtherCardRow Component Tests
 * Story 13.4: Restyle Add Card Flow (AC1)
 * Story 22.5: Capture frame A's row
 */

import { render, screen, fireEvent } from '@testing-library/react-native';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { StyleSheet } from 'react-native';

import { TYPOGRAPHY } from '@/shared/theme/typography';

import { OtherCardRow } from './OtherCardRow';

let mockIsDark = false;

jest.mock('@/shared/theme', () => {
  const { DARK_THEME, LIGHT_THEME } = jest.requireActual('@/shared/theme/colors');
  return {
    useTheme: () => ({ theme: mockIsDark ? DARK_THEME : LIGHT_THEME, isDark: mockIsDark })
  };
});

type Scheme = 'light' | 'dark';

const PALETTE: Record<
  Scheme,
  { background: string; border: string; textPrimary: string; textSecondary: string }
> = {
  light: {
    background: '#F0F0E8',
    border: '#D6D6CB',
    textPrimary: '#181824',
    textSecondary: '#55555F'
  },
  dark: {
    background: '#000000',
    border: '#3A3A48',
    textPrimary: '#F0F0E8',
    textSecondary: '#B5B5AB'
  }
};

const styleOf = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

describe('OtherCardRow', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockIsDark = false;
  });

  it('renders "Other card" title', () => {
    render(<OtherCardRow onPress={mockOnPress} />);
    expect(screen.getByText('Other card')).toBeTruthy();
  });

  it('renders subtitle text', () => {
    render(<OtherCardRow onPress={mockOnPress} />);
    expect(screen.getByText('Add a custom loyalty card')).toBeTruthy();
  });

  it('carries a "+" in its circle, not a MaterialIcons glyph', () => {
    render(<OtherCardRow onPress={mockOnPress} />);
    expect(screen.getByText('+')).toBeTruthy();
    expect(screen.queryByText('add')).toBeNull();
  });

  it('draws a Lucide chevron', () => {
    render(<OtherCardRow onPress={mockOnPress} />);
    expect(screen.UNSAFE_getByType(ChevronRight)).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    render(<OtherCardRow onPress={mockOnPress} />);
    fireEvent.press(screen.getByTestId('other-card-row'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('has correct accessibility label', () => {
    render(<OtherCardRow onPress={mockOnPress} />);
    const row = screen.getByTestId('other-card-row');
    expect(row.props.accessibilityLabel).toBe('Other card. Add a custom loyalty card');
    expect(row.props.accessibilityRole).toBe('button');
  });

  // Story 22.5 — "The same row" as a brand's.
  describe('frame A', () => {
    it('is the brand row’s 64pt shape: padded 0 16 with a 16pt gap', () => {
      render(<OtherCardRow onPress={mockOnPress} />);

      expect(styleOf('other-card-row')).toMatchObject({
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 64,
        paddingHorizontal: 16,
        gap: 16
      });
      expect(styleOf('other-card-row').height).toBeUndefined();
    });

    it('scales to 0.98 while pressed and back when released', () => {
      render(<OtherCardRow onPress={mockOnPress} />);
      const row = screen.getByTestId('other-card-row');
      const style = () => StyleSheet.flatten(row.props.style);

      fireEvent(row, 'pressIn');
      expect(style().transform).toEqual([{ scale: 0.98 }]);
      fireEvent(row, 'pressOut');
      expect(style().transform).toBeUndefined();
    });

    // The subtitle wraps under large text rather than being cut: the row grows instead.
    it('lets the subtitle wrap', () => {
      render(<OtherCardRow onPress={mockOnPress} />);
      expect(screen.getByText('Add a custom loyalty card').props.numberOfLines).toBeUndefined();
    });

    it('keeps the "+" out of Dynamic Type, like a brand’s initial', () => {
      render(<OtherCardRow onPress={mockOnPress} />);
      expect(screen.getByText('+').props.allowFontScaling).toBe(false);
    });

    describe.each<Scheme>(['light', 'dark'])('in %s', (scheme) => {
      const roles = PALETTE[scheme];

      beforeEach(() => {
        mockIsDark = scheme === 'dark';
      });

      it('fills its 40pt circle with the ground inside a 1pt hairline', () => {
        render(<OtherCardRow onPress={mockOnPress} />);

        expect(styleOf('other-card-row-circle')).toMatchObject({
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: roles.background,
          borderWidth: 1,
          borderColor: roles.border
        });
      });

      it('sets the "+" in body-md semibold textPrimary', () => {
        render(<OtherCardRow onPress={mockOnPress} />);

        expect(StyleSheet.flatten(screen.getByText('+').props.style)).toMatchObject({
          ...TYPOGRAPHY.bodyMdStrong,
          color: roles.textPrimary
        });
      });

      it('sets the label in body-lg textPrimary and the subtitle in caption textSecondary', () => {
        render(<OtherCardRow onPress={mockOnPress} />);

        expect(StyleSheet.flatten(screen.getByText('Other card').props.style)).toMatchObject({
          ...TYPOGRAPHY.bodyLg,
          color: roles.textPrimary
        });
        expect(
          StyleSheet.flatten(screen.getByText('Add a custom loyalty card').props.style)
        ).toMatchObject({ ...TYPOGRAPHY.captionMd, color: roles.textSecondary });
      });

      it('draws the chevron at 24 / 1.5 in textSecondary', () => {
        render(<OtherCardRow onPress={mockOnPress} />);

        expect(
          screen.getByTestId('other-card-row-chevron', { includeHiddenElements: true }).props
        ).toMatchObject({ width: 24, height: 24, strokeWidth: 1.5, stroke: roles.textSecondary });
      });
    });
  });
});

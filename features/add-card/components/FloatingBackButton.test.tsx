/**
 * FloatingBackButton Component Tests
 * Story 13.4: Restyle Add Card Flow (AC4)
 * Story 22.5: Capture frames B and C — the 40pt disc in a 48pt target, in two looks
 */

import { render, screen, fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { FloatingBackButton } from './FloatingBackButton';

let mockIsDark = false;

// The real token values, so the ground look is checked against what the app paints. Dark is the
// scheme where `surface` and `textPrimary` move off white and ink.
jest.mock('@/shared/theme', () => {
  const { DARK_THEME, LIGHT_THEME } = jest.requireActual('@/shared/theme/colors');
  return {
    useTheme: () => ({ theme: mockIsDark ? DARK_THEME : LIGHT_THEME, isDark: mockIsDark })
  };
});

type Scheme = 'light' | 'dark';

const GROUND: Record<Scheme, { surface: string; border: string; textPrimary: string }> = {
  light: { surface: '#FFFFFF', border: '#D6D6CB', textPrimary: '#181824' },
  dark: { surface: '#181824', border: '#3A3A48', textPrimary: '#F0F0E8' }
};

const CREAM = '#F0F0E8';
const FEED_SCRIM = 'rgba(0, 0, 0, 0.4)';

const styleOf = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

/** The chevron is decorative — the button carries the name — so it is hidden from a reader. */
const chevron = () =>
  screen.getByTestId('floating-back-button-icon', { includeHiddenElements: true });

describe('FloatingBackButton', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockIsDark = false;
  });

  it('renders with default testID', () => {
    render(<FloatingBackButton onPress={mockOnPress} />);
    expect(screen.getByTestId('floating-back-button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    render(<FloatingBackButton onPress={mockOnPress} />);
    fireEvent.press(screen.getByTestId('floating-back-button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('has "Go back" accessibility label', () => {
    render(<FloatingBackButton onPress={mockOnPress} />);
    const button = screen.getByTestId('floating-back-button');
    expect(button.props.accessibilityLabel).toBe('Go back');
    expect(button.props.accessibilityRole).toBe('button');
  });

  it('accepts custom testID', () => {
    render(<FloatingBackButton onPress={mockOnPress} testID="custom-back" />);
    expect(screen.getByTestId('custom-back')).toBeTruthy();
  });

  describe('geometry', () => {
    it('is a 48pt target, placed where its caller says', () => {
      render(<FloatingBackButton onPress={mockOnPress} style={{ top: 63, left: 20 }} />);

      expect(styleOf('floating-back-button')).toMatchObject({
        position: 'absolute',
        width: 48,
        height: 48,
        top: 63,
        left: 20,
        alignItems: 'center',
        justifyContent: 'center'
      });
    });

    it('centres a fully round 40pt disc in the target', () => {
      render(<FloatingBackButton onPress={mockOnPress} />);

      expect(styleOf('floating-back-button-disc')).toMatchObject({
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center'
      });
    });

    it('draws a Lucide chevron at 24 / 1.5, kept from a screen reader', () => {
      render(<FloatingBackButton onPress={mockOnPress} />);

      expect(chevron().props).toMatchObject({ width: 24, height: 24, strokeWidth: 1.5 });
      expect(chevron().props['aria-hidden']).toBe('true');
    });

    // The design system's tap feedback, in place of the 0.7 dim it used to do.
    it('scales to 0.98 while pressed and back when released, never dimming', () => {
      render(<FloatingBackButton onPress={mockOnPress} />);
      const button = screen.getByTestId('floating-back-button');
      const style = () => StyleSheet.flatten(button.props.style);

      expect(style().transform).toBeUndefined();
      fireEvent(button, 'pressIn');
      expect(style().transform).toEqual([{ scale: 0.98 }]);
      expect(style().opacity).toBeUndefined();
      fireEvent(button, 'pressOut');
      expect(style().transform).toBeUndefined();
    });
  });

  // Frame B: over the camera, the same in both schemes.
  describe.each<Scheme>(['light', 'dark'])('on the feed, in %s', (scheme) => {
    beforeEach(() => {
      mockIsDark = scheme === 'dark';
    });

    it('fills the disc with the 40 % scrim, with no outline, and draws a cream chevron', () => {
      render(<FloatingBackButton onPress={mockOnPress} />);

      const disc = styleOf('floating-back-button-disc');
      expect(disc.backgroundColor).toBe(FEED_SCRIM);
      expect(disc.borderWidth).toBeUndefined();
      expect(chevron().props.stroke).toBe(CREAM);
    });
  });

  // Frame C and the camera-error state: no camera, so the scheme's own ground.
  describe.each<Scheme>(['light', 'dark'])('on the ground, in %s', (scheme) => {
    const roles = GROUND[scheme];

    beforeEach(() => {
      mockIsDark = scheme === 'dark';
    });

    it('takes the surface inside a 1pt border, with a textPrimary chevron', () => {
      render(<FloatingBackButton onPress={mockOnPress} appearance="ground" />);

      expect(styleOf('floating-back-button-disc')).toMatchObject({
        backgroundColor: roles.surface,
        borderWidth: 1,
        borderColor: roles.border
      });
      expect(chevron().props.stroke).toBe(roles.textPrimary);
    });
  });
});

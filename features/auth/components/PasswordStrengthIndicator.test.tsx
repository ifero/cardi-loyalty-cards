/**
 * PasswordStrengthIndicator — the strength meter, which counts rather than judges (Story 22.9).
 */
import { readFileSync } from 'fs';

import { act, render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import { changeAppLanguage } from '@/shared/i18n';
import { DARK_THEME, LIGHT_THEME, type Theme } from '@/shared/theme/colors';

import { PasswordStrengthIndicator, getPasswordStrength } from './PasswordStrengthIndicator';

let mockIsDark = false;

// The real token values, so every role is checked against what the app paints.
jest.mock('@/shared/theme', () => {
  const { DARK_THEME: dark, LIGHT_THEME: light } = jest.requireActual('@/shared/theme/colors');
  return {
    useTheme: () => ({ theme: mockIsDark ? dark : light, isDark: mockIsDark })
  };
});

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

const segmentColours = () =>
  [0, 1, 2].map(
    (segment) => flat(`password-strength-indicator-segment-${segment}`).backgroundColor
  );

const WEAK = 'abc';
const FAIR = 'Password12';
const STRONG = 'Password123!@#';

describe('getPasswordStrength', () => {
  it.each([
    ['', 'weak'],
    ['Pass1', 'weak'],
    ['password', 'weak'],
    ['12345678', 'weak'],
    ['Password1', 'fair'],
    ['Password1234', 'fair'],
    ['Password!1', 'fair'],
    ['Password123!', 'strong']
  ])('rates "%s" %s', (password, strength) => {
    expect(getPasswordStrength(password)).toBe(strength);
  });
});

describe('PasswordStrengthIndicator', () => {
  afterEach(async () => {
    mockIsDark = false;
    await act(async () => {
      await changeAppLanguage('en');
    });
  });

  it('draws nothing for an empty password', () => {
    render(<PasswordStrengthIndicator password="" />);
    expect(screen.queryByTestId('password-strength-indicator')).toBeNull();
  });

  it.each([
    [WEAK, 'Weak'],
    [FAIR, 'Fair'],
    [STRONG, 'Strong']
  ])('names the strength of "%s" "%s"', (password, word) => {
    render(<PasswordStrengthIndicator password={password} />);
    expect(screen.getByTestId('password-strength-indicator-label').props.children).toBe(word);
  });

  describe.each<[string, boolean, Theme]>([
    ['light', false, LIGHT_THEME],
    ['dark', true, DARK_THEME]
  ])('in %s', (_scheme, isDark, theme) => {
    beforeEach(() => {
      mockIsDark = isDark;
    });

    // One, two or three of three: the fill spans a third, two thirds or all of the track.
    it.each([
      [WEAK, 1],
      [FAIR, 2],
      [STRONG, 3]
    ])(
      'fills the first segments for "%s", %i of three, in textPrimary on border',
      (password, n) => {
        render(<PasswordStrengthIndicator password={password} />);
        const filled = Array.from({ length: 3 }, (_, segment) =>
          segment < n ? theme.textPrimary : theme.border
        );
        expect(segmentColours()).toEqual(filled);
      }
    );

    it('fills in the same colour at every strength', () => {
      const view = render(<PasswordStrengthIndicator password={WEAK} />);
      const weak = segmentColours()[0];
      view.rerender(<PasswordStrengthIndicator password={FAIR} />);
      const fair = segmentColours()[0];
      view.rerender(<PasswordStrengthIndicator password={STRONG} />);
      const strong = segmentColours()[0];
      expect([weak, fair, strong]).toEqual([
        theme.textPrimary,
        theme.textPrimary,
        theme.textPrimary
      ]);
    });

    it('sets the word in label-bold, textPrimary', () => {
      render(<PasswordStrengthIndicator password={FAIR} />);
      expect(flat('password-strength-indicator-label')).toMatchObject({
        fontFamily: 'Inter',
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.26,
        color: theme.textPrimary
      });
    });
  });

  // No traffic light: the meter reads no judging role at all, so no green, amber or red remains.
  // Only a read of the role counts, so a comment that names one cannot fail it.
  it('reads no error, warning or success colour', () => {
    const source = readFileSync(require.resolve('./PasswordStrengthIndicator'), 'utf8');
    expect(source).not.toMatch(/\btheme\.(?:error|warning|success)\b/);
  });

  // Frames B and E: a full-width track of three equal segments, 4 tall, fully rounded, 4 apart, then
  // the word 8 after it.
  it('lays out three equal, rounded 4pt segments, 4 apart, the word 8 after them', () => {
    render(<PasswordStrengthIndicator password={FAIR} />);
    expect(flat('password-strength-indicator')).toMatchObject({
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
    });
    expect(flat('password-strength-indicator-track')).toMatchObject({
      flex: 1,
      flexDirection: 'row',
      gap: 4
    });
    [0, 1, 2].forEach((segment) => {
      expect(flat(`password-strength-indicator-segment-${segment}`)).toMatchObject({
        flex: 1,
        height: 4,
        borderRadius: 2
      });
    });
    expect(screen.queryByTestId('password-strength-indicator-segment-3')).toBeNull();
    expect(screen.queryByTestId('password-strength-indicator-bar')).toBeNull();
  });

  it('is one element for assistive technology, "Password strength: Fair"', () => {
    render(<PasswordStrengthIndicator password={FAIR} />);
    const meter = screen.getByTestId('password-strength-indicator');
    expect(meter.props.accessible).toBe(true);
    expect(meter.props.accessibilityLabel).toBe('Password strength: Fair');
  });

  it('is named in the language the app speaks', async () => {
    await act(async () => {
      await changeAppLanguage('it');
    });
    render(<PasswordStrengthIndicator password={STRONG} />);
    expect(screen.getByTestId('password-strength-indicator').props.accessibilityLabel).toBe(
      'Sicurezza della password: Forte'
    );
    expect(screen.getByText('Forte')).toBeTruthy();
  });

  // Under large text the word wraps beside the track rather than pushing it off the row.
  it('lets the word wrap rather than pushing the track off the row', () => {
    render(<PasswordStrengthIndicator password={WEAK} />);
    expect(flat('password-strength-indicator-label').flexShrink).toBe(1);
  });
});

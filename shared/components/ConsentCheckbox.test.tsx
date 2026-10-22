/**
 * ConsentCheckbox — Unit Tests
 * Story 6-4: Privacy Policy & Consent Flow
 * Story 22.9: Authentication — auth frame B's consent row
 */

import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import Check from 'lucide-react-native/icons/check';
import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';

import { changeAppLanguage } from '@/shared/i18n';
import { DARK_THEME, LIGHT_THEME, type Theme } from '@/shared/theme/colors';

import ConsentCheckbox from './ConsentCheckbox';

let mockIsDark = false;

// The real token values, so every role is checked against what the app paints.
jest.mock('@/shared/theme', () => {
  const { DARK_THEME: dark, LIGHT_THEME: light } = jest.requireActual('@/shared/theme/colors');
  return {
    useTheme: () => ({ theme: mockIsDark ? dark : light, isDark: mockIsDark })
  };
});

// Mock router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush })
}));

/**
 * The text size, as `useWindowDimensions` reports it. React Native's Jest mock reports 2, an
 * accessibility size, so every test sets one: the device's default of 1 unless it says otherwise.
 */
let dimensions: jest.SpyInstance | undefined;
const setFontScale = (fontScale: number) => {
  dimensions?.mockRestore();
  dimensions = jest
    .spyOn(Dimensions, 'get')
    .mockReturnValue({ width: 393, height: 852, scale: 3, fontScale });
};

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

/** The nearest host view that holds the node with this testID. */
const hostParentOf = (testID: string) => {
  let node = screen.getByTestId(testID).parent;
  while (node && typeof node.type !== 'string') {
    node = node.parent;
  }
  return node;
};

describe('ConsentCheckbox', () => {
  const defaultProps = {
    checked: false,
    onToggle: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setFontScale(1);
  });

  afterEach(async () => {
    mockIsDark = false;
    dimensions?.mockRestore();
    dimensions = undefined;
    await act(async () => {
      await changeAppLanguage('en');
    });
  });

  it('renders the checkbox container', () => {
    render(<ConsentCheckbox {...defaultProps} />);
    expect(screen.getByTestId('consent-checkbox')).toBeTruthy();
  });

  it('displays the consent label text', () => {
    render(<ConsentCheckbox {...defaultProps} />);
    expect(screen.getByText(/I agree to the/)).toBeTruthy();
  });

  it('displays the Privacy Policy link', () => {
    render(<ConsentCheckbox {...defaultProps} />);
    expect(screen.getByText('Privacy Policy')).toBeTruthy();
  });

  it('calls onToggle with opposite value when pressed', async () => {
    const onToggle = jest.fn();
    render(<ConsentCheckbox checked={false} onToggle={onToggle} />);
    await userEvent.press(screen.getByTestId('consent-checkbox-toggle'));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('calls onToggle with false when unchecking', async () => {
    const onToggle = jest.fn();
    render(<ConsentCheckbox checked={true} onToggle={onToggle} />);
    await userEvent.press(screen.getByTestId('consent-checkbox-toggle'));
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  // ConsentCheckbox.test pins the policy link as a way into the policy (Story 22.8).
  it('navigates to privacy policy when link is pressed', () => {
    render(<ConsentCheckbox {...defaultProps} />);
    fireEvent.press(screen.getByTestId('consent-policy-link'));
    expect(mockPush).toHaveBeenCalledWith('/privacy-policy');
  });

  it('calls custom onPolicyPress instead of navigating when provided', () => {
    const customHandler = jest.fn();
    render(<ConsentCheckbox {...defaultProps} onPolicyPress={customHandler} />);
    fireEvent.press(screen.getByTestId('consent-policy-link'));
    expect(customHandler).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('has proper accessibility label', () => {
    render(<ConsentCheckbox {...defaultProps} />);
    expect(screen.getByLabelText('I agree to the Privacy Policy')).toBeTruthy();
  });

  it('is a checkbox with its name, hint and state', () => {
    const { rerender } = render(<ConsentCheckbox {...defaultProps} checked={false} />);
    const toggle = screen.getByTestId('consent-checkbox-toggle');
    expect(toggle.props.accessibilityRole).toBe('checkbox');
    expect(toggle.props.accessibilityHint).toBe('Toggles privacy consent');
    expect(toggle.props.accessibilityState?.checked).toBe(false);

    rerender(<ConsentCheckbox {...defaultProps} checked={true} />);
    expect(screen.getByTestId('consent-checkbox-toggle').props.accessibilityState?.checked).toBe(
      true
    );
  });

  describe.each<[string, boolean, Theme]>([
    ['light', false, LIGHT_THEME],
    ['dark', true, DARK_THEME]
  ])('the box, in %s', (_scheme, isDark, theme) => {
    beforeEach(() => {
      mockIsDark = isDark;
    });

    it('is 24 × 24 at radius 4, surface in a 1pt border outline, unticked', () => {
      render(<ConsentCheckbox {...defaultProps} />);
      expect(flat('consent-checkbox-box')).toMatchObject({
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 1,
        backgroundColor: theme.surface,
        borderColor: theme.border
      });
      expect(screen.UNSAFE_queryByType(Check)).toBeNull();
    });

    // White on ink in light; ink on beam in dark, where white would be 1.52:1.
    it('is primary with a 16 / 2 check in onPrimary, ticked', () => {
      render(<ConsentCheckbox {...defaultProps} checked />);
      expect(flat('consent-checkbox-box')).toMatchObject({
        backgroundColor: theme.primary,
        borderColor: theme.primary
      });
      expect(screen.UNSAFE_getByType(Check).props).toMatchObject({
        size: 16,
        strokeWidth: 2,
        color: theme.onPrimary
      });
    });

    it('sets the sentence in body-md muted and the policy in body-md semibold link, underlined', () => {
      render(<ConsentCheckbox {...defaultProps} />);
      expect(flat('consent-sentence')).toMatchObject({
        fontFamily: 'Inter',
        fontSize: 15,
        fontWeight: '400',
        color: theme.textSecondary
      });
      expect(flat('consent-policy-link')).toMatchObject({
        fontFamily: 'Inter',
        fontSize: 15,
        fontWeight: '600',
        color: theme.link,
        textDecorationLine: 'underline'
      });
    });

    it('outlines the box in error and shows the message under the row, until it is ticked', () => {
      const { rerender } = render(
        <ConsentCheckbox {...defaultProps} error="You must agree to the Privacy Policy." />
      );
      expect(flat('consent-checkbox-box').borderColor).toBe(theme.error);
      expect(screen.getByTestId('consent-error')).toBeTruthy();

      rerender(
        <ConsentCheckbox {...defaultProps} checked error="You must agree to the Privacy Policy." />
      );
      expect(flat('consent-checkbox-box').borderColor).toBe(theme.primary);
    });
  });

  it('keeps the policy link a link inside the sentence, with its hint', () => {
    render(<ConsentCheckbox {...defaultProps} />);
    const link = screen.getByTestId('consent-policy-link');
    expect(link.props.accessibilityRole).toBe('link');
    expect(link.props.accessibilityHint).toBe('Opens the Privacy Policy');
    let node = link.parent;
    while (node && node.props.testID !== 'consent-sentence') {
      node = node.parent;
    }
    expect(node).toBeTruthy();
  });

  // The message is the field-error idiom, under the row rather than beside the box.
  it('draws the message as a field error under the row', () => {
    render(<ConsentCheckbox {...defaultProps} error="You must agree to the Privacy Policy." />);
    const message = screen.getByTestId('consent-error');
    expect(message.props.accessibilityLiveRegion).toBe('polite');
    expect(flat('consent-error')).toMatchObject({ fontSize: 13, color: LIGHT_THEME.error });
    // Under the row: a sibling after it, not inside it.
    expect(hostParentOf('consent-error')?.props.testID).toBe('consent-checkbox');
    const tree = JSON.stringify(screen.toJSON());
    expect(tree.indexOf('"consent-sentence"')).toBeLessThan(tree.indexOf('"consent-error"'));
  });

  it('shows no message while consent is not refused', () => {
    render(<ConsentCheckbox {...defaultProps} />);
    expect(screen.queryByTestId('consent-error')).toBeNull();
  });

  describe('its target', () => {
    // A 48 target holding the 24 box centred: the row starts 12 into the margin, so the drawn box
    // sits on the margin and the sentence starts 12 after it.
    it('is 48 × 48 with the box centred, the box on the margin', () => {
      render(<ConsentCheckbox {...defaultProps} />);
      expect(flat('consent-checkbox-toggle')).toMatchObject({
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center'
      });
      const row = hostParentOf('consent-checkbox-toggle');
      expect(StyleSheet.flatten(row?.props.style)).toMatchObject({
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginLeft: -12
      });
      expect(flat('consent-sentence').flex).toBe(1);
    });

    // The box's centre is the sentence's first line's: 24 down the target, 22 / 2 down the line.
    it.each([
      [1, 13, 0],
      [2, 2, 0],
      [3, 0, 9]
    ])(
      'centres the box on the first line at a text size of %d (sentence %d down, target %d)',
      (fontScale, sentenceTop, targetTop) => {
        setFontScale(fontScale);
        render(<ConsentCheckbox {...defaultProps} />);
        expect(flat('consent-sentence').marginTop).toBe(sentenceTop);
        expect(flat('consent-checkbox-toggle').marginTop).toBe(targetTop);
        expect(sentenceTop + (22 * fontScale) / 2).toBe(targetTop + 24);
      }
    );
  });

  it('speaks the language the app speaks', async () => {
    await act(async () => {
      await changeAppLanguage('it');
    });
    render(<ConsentCheckbox {...defaultProps} />);
    expect(screen.getByText('Informativa sulla privacy')).toBeTruthy();
    expect(screen.getByLabelText("Accetto l'Informativa sulla privacy")).toBeTruthy();
  });
});

/**
 * PreferencesSection — settings frame A's PREFERENCES (Story 22.7), and the full-brightness switch
 * (Story 16.39).
 *
 * Rendered through the real `StoryDecorator` and the real primitives: the row icons are theme
 * roles, and the switch's role and state live in the real `ToggleSwitch` — a stub would let these
 * pass while the shipped switch announced nothing.
 */
import { render, screen, userEvent } from '@testing-library/react-native';
import Globe from 'lucide-react-native/icons/globe';
import Lightbulb from 'lucide-react-native/icons/lightbulb';
import Moon from 'lucide-react-native/icons/moon';
import React from 'react';
import { StyleSheet } from 'react-native';

import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { PreferencesSection } from './PreferencesSection';

type Scheme = 'light' | 'dark';
type PreferencesProps = React.ComponentProps<typeof PreferencesSection>;

const renderPreferences = (props: Partial<PreferencesProps> = {}, scheme: Scheme = 'light') => {
  const handlers = {
    onThemePress: jest.fn(),
    onLanguagePress: jest.fn(),
    onAutoBrightnessChange: jest.fn()
  };
  render(
    <StoryDecorator theme={scheme}>
      <PreferencesSection
        themeLabel="System"
        languageName="System (English)"
        isAutoBrightnessEnabled={false}
        {...handlers}
        {...props}
      />
    </StoryDecorator>
  );
  return handlers;
};

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

/** Lucide hides its icons from assistive technology, so a query has to look past that. */
const icon = (testID: string) => screen.getByTestId(testID, { includeHiddenElements: true });

describe('PreferencesSection (frame A)', () => {
  it('heads the group PREFERENCES, uppercase by style', () => {
    renderPreferences();
    const head = screen.getByRole('header', { name: 'Preferences' });
    expect(StyleSheet.flatten(head.props.style).textTransform).toBe('uppercase');
  });

  it('orders Theme, Language, then the full-brightness switch', () => {
    renderPreferences();
    const tree = JSON.stringify(screen.toJSON());
    const order = [
      'settings-theme-row',
      'settings-language-row',
      'settings-auto-brightness-toggle'
    ].map((testID) => tree.indexOf(`"${testID}"`));
    expect(order.every((index) => index > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('shows the current theme and language, each row named by its label and its value', () => {
    renderPreferences();
    expect(screen.getByText('System')).toBeTruthy();
    expect(screen.getByText('System (English)')).toBeTruthy();
    expect(screen.getByTestId('settings-theme-row').props.accessibilityLabel).toBe('Theme, System');
    expect(screen.getByTestId('settings-language-row').props.accessibilityLabel).toBe(
      'Language, System (English)'
    );
  });

  // Theme takes the frame's crescent, Language a globe, the switch the card screen's bulb.
  it('leads Theme with a moon, Language with a globe and the switch with a bulb', () => {
    renderPreferences();
    expect(screen.UNSAFE_getAllByType(Moon)).toHaveLength(1);
    expect(screen.UNSAFE_getAllByType(Globe)).toHaveLength(1);
    expect(screen.UNSAFE_getAllByType(Lightbulb)).toHaveLength(1);
    expect(icon('settings-theme-icon')).toBeTruthy();
    expect(icon('settings-language-icon')).toBeTruthy();
  });

  it.each<[Scheme, string]>([
    ['light', LIGHT_THEME.textPrimary],
    ['dark', DARK_THEME.textPrimary]
  ])('draws each icon at 24 / 1.5 in %s textPrimary', (scheme, hex) => {
    renderPreferences({}, scheme);
    ['settings-theme-icon', 'settings-language-icon', 'settings-auto-brightness-icon'].forEach(
      (testID) =>
        expect(icon(testID).props).toMatchObject({
          width: 24,
          height: 24,
          stroke: hex,
          strokeWidth: 1.5
        })
    );
  });

  it('opens each picker from its own row', async () => {
    const { onThemePress, onLanguagePress } = renderPreferences();

    await userEvent.press(screen.getByTestId('settings-theme-row'));
    expect(onThemePress).toHaveBeenCalledTimes(1);
    await userEvent.press(screen.getByTestId('settings-language-row'));
    expect(onLanguagePress).toHaveBeenCalledTimes(1);
  });

  describe('the full-brightness switch (Story 16.39)', () => {
    it('is padded 12/16 as the rows are, the bulb 12 from the switch', () => {
      renderPreferences();
      expect(flat('settings-auto-brightness-row')).toMatchObject({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 16
      });
      // The switch's wrapper takes the room the bulb leaves, and no more, so the switch's label
      // wraps beside the track rather than pushing it off the row.
      expect(flat('settings-auto-brightness-switch')).toMatchObject({ flex: 1 });
    });

    it('puts the bulb before the switch', () => {
      renderPreferences();
      const tree = JSON.stringify(screen.toJSON());
      const bulb = tree.indexOf('"settings-auto-brightness-icon"');
      expect(bulb).toBeGreaterThan(-1);
      expect(bulb).toBeLessThan(tree.indexOf('"settings-auto-brightness-toggle"'));
    });

    // The bulb's fill is its state, as on the card screen (Story 22.3): an outline while off,
    // filled while on — never left to Lucide's default, which fills black.
    it.each<[Scheme, string]>([
      ['light', LIGHT_THEME.textPrimary],
      ['dark', DARK_THEME.textPrimary]
    ])('fills the bulb only while the switch is on, in %s', (scheme, hex) => {
      renderPreferences({ isAutoBrightnessEnabled: false }, scheme);
      expect(icon('settings-auto-brightness-icon').props.fill).toBe('none');
      screen.unmount();

      renderPreferences({ isAutoBrightnessEnabled: true }, scheme);
      expect(icon('settings-auto-brightness-icon').props.fill).toBe(hex);
    });

    // The rows above get one stop for free — their icon sits inside the Pressable that carries the
    // label. This one is a sibling of the switch, so it is hidden from assistive technology on both
    // platforms, or it would read as an extra, unlabelled stop.
    it('keeps the row ONE screen-reader stop, hiding the bulb on iOS and Android', () => {
      renderPreferences();
      expect(screen.queryByTestId('settings-auto-brightness-icon')).toBeNull();
      let node = icon('settings-auto-brightness-icon').parent;
      while (node && node.props.accessibilityElementsHidden !== true) {
        node = node.parent;
      }
      expect(node?.props.importantForAccessibility).toBe('no-hide-descendants');
    });

    it.each([true, false])('reports on or off to assistive technology: checked %s', (enabled) => {
      renderPreferences({ isAutoBrightnessEnabled: enabled });
      const toggle = screen.getByTestId('settings-auto-brightness-toggle');
      expect(toggle.props.accessibilityRole).toBe('switch');
      expect(toggle.props.accessibilityState).toEqual(
        expect.objectContaining({ checked: enabled })
      );
    });

    // Reports the NEXT value: pressing a switch means "make it the other thing".
    it('reports the change it is pressed for', async () => {
      const { onAutoBrightnessChange } = renderPreferences({ isAutoBrightnessEnabled: false });
      await userEvent.press(screen.getByTestId('settings-auto-brightness-toggle'));
      expect(onAutoBrightnessChange).toHaveBeenCalledWith(true);
    });

    it('labels the switch "Full brightness on card details"', () => {
      renderPreferences();
      expect(screen.getByText('Full brightness on card details')).toBeTruthy();
    });
  });
});

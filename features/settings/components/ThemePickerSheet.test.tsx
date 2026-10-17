/**
 * ThemePickerSheet — pick one, settings frame C (Story 22.7).
 *
 * Rendered through the real `StoryDecorator`, the real sheet and the real option list.
 */
import { render, screen, userEvent, within } from '@testing-library/react-native';
import React from 'react';
import { AccessibilityInfo, StyleSheet } from 'react-native';
import { Svg } from 'react-native-svg';

import { Button } from '@/shared/components/ui/Button';
import { OptionList } from '@/shared/components/ui/OptionList';
import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { ThemePickerSheet } from './ThemePickerSheet';

type Scheme = 'light' | 'dark';
type PickerProps = React.ComponentProps<typeof ThemePickerSheet>;

const renderPicker = (props: Partial<PickerProps> = {}, scheme: Scheme = 'light') => {
  const handlers = { onSelect: jest.fn(), onClose: jest.fn() };
  render(
    <StoryDecorator theme={scheme}>
      <ThemePickerSheet visible selectedTheme="system" {...handlers} {...props} />
    </StoryDecorator>
  );
  return handlers;
};

describe('ThemePickerSheet (frame C)', () => {
  // What the option reads, beside the fuller name assistive technology is given.
  it.each([
    ['light', 'Light'],
    ['dark', 'Dark'],
    ['system', 'System']
  ])('reads the %s option as "%s"', (key, label) => {
    renderPicker();
    expect(within(screen.getByTestId(`theme-option-${key}`)).getByText(label)).toBeTruthy();
  });

  it('titles the sheet "Theme", a heading it is announced by', () => {
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => undefined);
    renderPicker();
    expect(screen.getByRole('header', { name: 'Theme' })).toBeTruthy();
    expect(announce).toHaveBeenCalledWith('Theme opened');
    announce.mockRestore();
  });

  it('lists Light, Dark, then System, keeping their names and testIDs', () => {
    renderPicker();
    expect(screen.UNSAFE_getByType(OptionList)).toBeTruthy();
    expect(screen.getAllByRole('button').map((option) => option.props.accessibilityLabel)).toEqual([
      'Light theme',
      'Dark theme',
      'System theme'
    ]);
    ['light', 'dark', 'system'].forEach((key) =>
      expect(screen.getByTestId(`theme-option-${key}`)).toBeTruthy()
    );
  });

  it.each(['light', 'dark', 'system'] as const)(
    'checks %s when it is the current theme, and reports it selected',
    (current) => {
      renderPicker({ selectedTheme: current });
      expect(screen.getByTestId(`theme-option-${current}`).props.accessibilityState).toEqual({
        selected: true
      });
      expect(
        screen.queryByTestId(`theme-option-${current}-check`, { includeHiddenElements: true })
      ).toBeTruthy();
      expect(screen.getAllByRole('button', { selected: true })).toHaveLength(1);
    }
  );

  // Choosing applies, saves, announces and closes — the hook's `selectTheme` does all four.
  it('hands the theme chosen to its caller', async () => {
    const { onSelect } = renderPicker();
    await userEvent.press(screen.getByTestId('theme-option-dark'));
    expect(onSelect).toHaveBeenCalledWith('dark');
  });

  it.each<[Scheme, string]>([
    ['light', LIGHT_THEME.textSecondary],
    ['dark', DARK_THEME.textSecondary]
  ])('sets the system helper 20 below the last option, in %s captionMd', (scheme, hex) => {
    renderPicker({}, scheme);
    expect(StyleSheet.flatten(screen.getByTestId('theme-picker-helper').props.style)).toMatchObject(
      { fontFamily: 'Inter', fontSize: 13, fontWeight: '400', marginTop: 20, color: hex }
    );
    expect(screen.getByText("System uses your device's appearance setting")).toBeTruthy();
    // After the options.
    const tree = JSON.stringify(screen.toJSON());
    expect(tree.indexOf('"theme-option-system"')).toBeLessThan(
      tree.indexOf('"theme-picker-helper"')
    );
  });

  // Pinned under the scrolling options, the helper took their room at the largest text size and
  // System opened out of view. As the list's footer it scrolls with them, so they come first.
  it('scrolls the helper with the options, so they take the room first', () => {
    renderPicker();
    const options = screen.getByTestId('theme-picker-options');
    expect(options.type).toBe('RCTScrollView');
    expect(within(options).getByTestId('theme-picker-helper')).toBeTruthy();
  });

  // The preview chips go, and the sheet holds no buttons and no icon but the selected check.
  it('draws no preview chip, no button and no icon but the check', () => {
    renderPicker();
    expect(screen.UNSAFE_queryAllByType(Button)).toHaveLength(0);
    expect(screen.queryByTestId('theme-picker-sheet-actions')).toBeNull();
    expect(screen.UNSAFE_queryAllByType(Svg)).toHaveLength(1);
  });
});

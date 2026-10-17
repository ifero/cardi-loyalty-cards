/**
 * AboutSection — settings frame A's ABOUT, with What We Collect restored after Privacy Policy
 * (Story 22.7).
 *
 * Rendered through the real `StoryDecorator` and the real rows, because what makes App Version and
 * Catalogue information rather than controls is the shared row's.
 */
import { render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Svg } from 'react-native-svg';

import { LIGHT_THEME } from '@/shared/theme/colors';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { AboutSection } from './AboutSection';

const renderAbout = () => {
  const handlers = {
    onHelpPress: jest.fn(),
    onPrivacyPress: jest.fn(),
    onWhatWeCollectPress: jest.fn()
  };
  render(
    <StoryDecorator>
      <AboutSection appVersion="1.4.0" catalogueVersion="v3 · Mar 2026" {...handlers} />
    </StoryDecorator>
  );
  return handlers;
};

/** Lucide hides its icons from assistive technology, so a query has to look past that. */
const chevron = (row: string) =>
  screen.queryByTestId(`${row}-chevron`, { includeHiddenElements: true });

const ROWS = [
  'settings-help-row',
  'settings-privacy-row',
  'settings-what-we-collect-row',
  'settings-app-version-row',
  'settings-catalogue-row'
];

describe('AboutSection (frame A)', () => {
  it('heads the group ABOUT', () => {
    renderAbout();
    expect(screen.getByRole('header', { name: 'About' })).toBeTruthy();
  });

  it('orders Help & FAQ, Privacy Policy, What We Collect, App Version, then Catalogue', () => {
    renderAbout();
    const tree = JSON.stringify(screen.toJSON());
    const order = ROWS.map((testID) => tree.indexOf(`"${testID}"`));
    expect(order.every((index) => index > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('gives the three links a chevron and makes each a button', () => {
    renderAbout();
    expect(screen.getAllByRole('button').map((row) => row.props.accessibilityLabel)).toEqual([
      'Help & FAQ',
      'Privacy Policy',
      'What We Collect'
    ]);
    ['settings-help-row', 'settings-privacy-row', 'settings-what-we-collect-row'].forEach((row) =>
      expect(chevron(row)).toBeTruthy()
    );
    // The three chevrons and nothing else: no ABOUT row leads with an icon.
    expect(screen.UNSAFE_queryAllByType(Svg)).toHaveLength(3);
  });

  it('opens each link from its own row', async () => {
    const { onHelpPress, onPrivacyPress, onWhatWeCollectPress } = renderAbout();

    await userEvent.press(screen.getByTestId('settings-help-row'));
    expect(onHelpPress).toHaveBeenCalledTimes(1);
    await userEvent.press(screen.getByTestId('settings-privacy-row'));
    expect(onPrivacyPress).toHaveBeenCalledTimes(1);
    await userEvent.press(screen.getByTestId('settings-what-we-collect-row'));
    expect(onWhatWeCollectPress).toHaveBeenCalledTimes(1);
  });

  // Information, not controls: no button role, nothing to press, no chevron, never dimmed.
  describe('App Version and Catalogue', () => {
    it.each([
      ['settings-app-version-row', 'App Version, 1.4.0'],
      ['settings-catalogue-row', 'Catalogue, v3 · Mar 2026']
    ])('%s is read as its label and its value', (testID, name) => {
      renderAbout();
      const row = screen.getByTestId(testID);
      expect(row.props.accessible).toBe(true);
      expect(row.props.accessibilityLabel).toBe(name);
      expect(row.props.accessibilityRole).toBeUndefined();
      expect(row.props.accessibilityState).toBeUndefined();
      expect(row.props.onPress).toBeUndefined();
    });

    it('draws them at full strength with their values, and no chevron', () => {
      renderAbout();
      ['settings-app-version-row', 'settings-catalogue-row'].forEach((row) => {
        expect(StyleSheet.flatten(screen.getByTestId(row).props.style).opacity).toBeUndefined();
        expect(chevron(row)).toBeNull();
      });
      expect(StyleSheet.flatten(screen.getByText('1.4.0').props.style).color).toBe(
        LIGHT_THEME.textSecondary
      );
      expect(StyleSheet.flatten(screen.getByText('App Version').props.style).color).toBe(
        LIGHT_THEME.textPrimary
      );
      expect(screen.getByText('v3 · Mar 2026')).toBeTruthy();
    });
  });
});

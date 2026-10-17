/**
 * OptionList — the pick-one list, settings frame C (Story 22.7).
 *
 * Rendered through the real `StoryDecorator`, because the rules, the label and the check are theme
 * roles that flip with the scheme.
 */
import { fireEvent, render, screen, userEvent, within } from '@testing-library/react-native';
import Check from 'lucide-react-native/icons/check';
import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { OptionList, type OptionListOption } from './OptionList';

type Scheme = 'light' | 'dark';
type Theme = 'light' | 'dark' | 'system';

const OPTIONS: OptionListOption<Theme>[] = [
  { value: 'light', label: 'Light', accessibilityLabel: 'Light theme', testID: 'option-light' },
  { value: 'dark', label: 'Dark', accessibilityLabel: 'Dark theme', testID: 'option-dark' },
  { value: 'system', label: 'System', testID: 'option-system' }
];

const renderList = (
  {
    selectedValue = 'system',
    onSelect = jest.fn()
  }: { selectedValue?: Theme; onSelect?: jest.Mock } = {},
  scheme: Scheme = 'light'
) => {
  render(
    <StoryDecorator theme={scheme}>
      <OptionList
        testID="options"
        options={OPTIONS}
        selectedValue={selectedValue}
        onSelect={onSelect}
      />
    </StoryDecorator>
  );
  return { onSelect };
};

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

/** Lucide hides its icons from assistive technology, so a query has to look past that. */
const check = (testID: string) =>
  screen.queryByTestId(`${testID}-check`, { includeHiddenElements: true });

describe('OptionList', () => {
  it('lists the options in the order it is given', () => {
    renderList();
    const labels = screen.getAllByRole('button').map((option) => option.props.accessibilityLabel);
    expect(labels).toEqual(['Light theme', 'Dark theme', 'System']);
  });

  // Edge to edge: the list reaches past the sheet's 24pt padding, and each option pads back to it.
  it('runs edge to edge, each option at least 48 and padded 12/24', () => {
    renderList();
    expect(flat('options')).toMatchObject({ marginHorizontal: -24 });
    expect(flat('option-light')).toMatchObject({
      minHeight: 48,
      paddingHorizontal: 24,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center'
    });
  });

  // Frame C: a rule above each option, including the first, and none under the last.
  it.each<[Scheme, string]>([
    ['light', LIGHT_THEME.border],
    ['dark', DARK_THEME.border]
  ])('rules a %s hairline above every option and none after the last', (scheme, hex) => {
    renderList({}, scheme);
    OPTIONS.forEach(({ testID }) => {
      expect(flat(testID!)).toMatchObject({ borderTopWidth: 1, borderTopColor: hex });
      expect(flat(testID!).borderBottomWidth).toBeUndefined();
    });
  });

  it.each<[Scheme, string]>([
    ['light', LIGHT_THEME.textPrimary],
    ['dark', DARK_THEME.textPrimary]
  ])('sets each label in body-lg %s textPrimary, free to wrap', (scheme, hex) => {
    renderList({}, scheme);
    const label = screen.getByText('Dark');
    expect(label.props.numberOfLines).toBeUndefined();
    expect(StyleSheet.flatten(label.props.style)).toMatchObject({
      fontFamily: 'Inter',
      fontSize: 17,
      fontWeight: '400',
      color: hex,
      flex: 1
    });
  });

  // The check is beam in dark: the selected state is the beam's job.
  it.each<[Scheme, string]>([
    ['light', LIGHT_THEME.primary],
    ['dark', DARK_THEME.primary]
  ])('checks only the selected option, in %s primary at 20 / 2', (scheme, hex) => {
    renderList({ selectedValue: 'system' }, scheme);
    expect(screen.UNSAFE_getAllByType(Check)).toHaveLength(1);
    expect(check('option-system')?.props).toMatchObject({
      width: 20,
      height: 20,
      stroke: hex,
      strokeWidth: 2
    });
    expect(check('option-light')).toBeNull();
    expect(check('option-dark')).toBeNull();
  });

  it('reports the selected option as selected, and only it', () => {
    renderList({ selectedValue: 'dark' });
    expect(screen.getByTestId('option-dark').props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByTestId('option-light').props.accessibilityState).toEqual({
      selected: false
    });
    expect(screen.getByRole('button', { name: 'Dark theme', selected: true })).toBeTruthy();
  });

  it('checks nothing when the selected value is not one of its options', () => {
    render(
      <StoryDecorator>
        <OptionList options={OPTIONS} selectedValue={undefined} onSelect={jest.fn()} />
      </StoryDecorator>
    );
    expect(screen.UNSAFE_queryAllByType(Check)).toHaveLength(0);
  });

  // Frame C: the label first, the check at the option's end.
  it('puts the label before the check', () => {
    renderList({ selectedValue: 'system' });
    const tree = JSON.stringify(screen.toJSON());
    expect(tree.indexOf('["System"]')).toBeGreaterThan(-1);
    expect(tree.indexOf('["System"]')).toBeLessThan(tree.indexOf('"option-system-check"'));
  });

  // Pressed through the option's own responder, as a finger does.
  it('reports the option chosen', async () => {
    const { onSelect } = renderList();
    await userEvent.press(screen.getByTestId('option-light'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('light');
  });

  it.each<[Scheme, string]>([
    ['light', LIGHT_THEME.surfaceElevated],
    ['dark', DARK_THEME.surfaceElevated]
  ])('takes %s surfaceElevated while held, as a row does', (scheme, hex) => {
    renderList({}, scheme);
    const option = screen.getByTestId('option-dark');
    expect(flat('option-dark').backgroundColor).toBe('transparent');
    fireEvent(option, 'pressIn');
    expect(flat('option-dark').backgroundColor).toBe(hex);
    fireEvent(option, 'pressOut');
    expect(flat('option-dark').backgroundColor).toBe('transparent');
  });

  // When they do not fit they scroll: a scroll view that shrinks inside its sheet and never grows,
  // since a growing child of the sheet's height cap would stretch a short list to the cap.
  it('scrolls when the options do not fit, and never grows past them', () => {
    renderList();
    const list = screen.UNSAFE_getByType(ScrollView);
    expect(list.props.testID).toBe('options');
    expect(StyleSheet.flatten(list.props.style)).toMatchObject({ flexGrow: 0, flexShrink: 1 });
    expect(list.props.alwaysBounceVertical).toBe(false);
  });

  // Theme's helper, pinned under the scrolling options, took their room at the largest text size
  // and hid the selected System. Inside the scroll view, after the last option, the options take
  // the room first and the footer scrolls with them.
  describe('footer', () => {
    const renderWithFooter = () =>
      render(
        <StoryDecorator>
          <OptionList
            testID="options"
            options={OPTIONS}
            selectedValue="system"
            onSelect={jest.fn()}
            footer={<Text testID="helper">System follows your device.</Text>}
          />
        </StoryDecorator>
      );

    it('scrolls with the options, after the last one', () => {
      renderWithFooter();
      const list = screen.getByTestId('options');
      expect(within(list).getByTestId('helper')).toBeTruthy();
      const tree = JSON.stringify(screen.toJSON());
      expect(tree.indexOf('"option-system"')).toBeLessThan(tree.indexOf('"helper"'));
    });

    // The list runs edge to edge, so its footer pads back to the sheet's 24 margin.
    it('sits on the sheet’s margin', () => {
      renderWithFooter();
      expect(flat('options-footer')).toMatchObject({ paddingHorizontal: 24 });
      expect(within(screen.getByTestId('options-footer')).getByTestId('helper')).toBeTruthy();
    });

    it('draws nothing after the options when it is given none', () => {
      renderList();
      expect(screen.queryByTestId('options-footer')).toBeNull();
    });
  });
});

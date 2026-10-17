/**
 * LanguagePickerSheet — pick one, settings frame C (Story 22.7).
 *
 * Rendered through the real `StoryDecorator`, the real sheet and the real option list.
 */
import { render, screen, userEvent, within } from '@testing-library/react-native';
import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { Svg } from 'react-native-svg';

import { Button } from '@/shared/components/ui/Button';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { LanguagePickerSheet } from './LanguagePickerSheet';
import type { LanguageOption } from '../types';

const OPTIONS: LanguageOption[] = [
  { code: 'system', name: 'System' },
  { code: 'en', name: 'English' },
  { code: 'it', name: 'Italian' }
];

const renderPicker = (currentCode = 'en') => {
  const handlers = { onSelect: jest.fn(), onClose: jest.fn() };
  render(
    <StoryDecorator>
      <LanguagePickerSheet visible currentCode={currentCode} options={OPTIONS} {...handlers} />
    </StoryDecorator>
  );
  return handlers;
};

describe('LanguagePickerSheet (frame C)', () => {
  // What the option reads: the language's own name, beside the fuller name assistive technology
  // is given.
  it.each(OPTIONS.map(({ code, name }) => [code, name]))(
    'reads the %s option as "%s"',
    (code, name) => {
      renderPicker();
      expect(within(screen.getByTestId(`language-option-${code}`)).getByText(name)).toBeTruthy();
    }
  );

  it('titles the sheet "Language", a heading it is announced by', () => {
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => undefined);
    renderPicker();
    expect(screen.getByRole('header', { name: 'Language' })).toBeTruthy();
    expect(announce).toHaveBeenCalledWith('Language opened');
    announce.mockRestore();
  });

  it('lists the languages it is given, keeping their names and testIDs', () => {
    renderPicker();
    expect(screen.getAllByRole('button').map((option) => option.props.accessibilityLabel)).toEqual([
      'System language',
      'English language',
      'Italian language'
    ]);
    OPTIONS.forEach(({ code }) =>
      expect(screen.getByTestId(`language-option-${code}`)).toBeTruthy()
    );
  });

  it('checks the current language and reports it selected', () => {
    renderPicker('it');
    expect(screen.getByTestId('language-option-it').props.accessibilityState).toEqual({
      selected: true
    });
    expect(screen.getAllByRole('button', { selected: true })).toHaveLength(1);
    expect(screen.UNSAFE_queryAllByType(Svg)).toHaveLength(1);
  });

  it('checks nothing for a code it does not list', () => {
    renderPicker('fr');
    expect(screen.queryAllByRole('button', { selected: true })).toHaveLength(0);
    expect(screen.UNSAFE_queryAllByType(Svg)).toHaveLength(0);
  });

  it('hands the language chosen to its caller', async () => {
    const { onSelect } = renderPicker();
    await userEvent.press(screen.getByTestId('language-option-it'));
    expect(onSelect).toHaveBeenCalledWith('it');
  });

  // No helper, and no buttons: choosing is the action.
  it('draws no helper and no button', () => {
    renderPicker();
    expect(screen.UNSAFE_queryAllByType(Button)).toHaveLength(0);
    expect(screen.queryByText("System uses your device's appearance setting")).toBeNull();
  });
});

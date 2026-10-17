/**
 * ImportErrorSheet — acknowledge, settings frame E (Story 22.7).
 *
 * Rendered through the real `StoryDecorator`, the real sheet and the real button.
 */
import { render, screen, userEvent, within } from '@testing-library/react-native';
import React from 'react';
import { Modal, StyleSheet } from 'react-native';
import { Svg } from 'react-native-svg';

import { Button } from '@/shared/components/ui/Button';
import { LIGHT_THEME } from '@/shared/theme/colors';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { ImportErrorSheet } from './ImportErrorSheet';

const INVALID = "This file doesn't contain valid card data. Please select a different file.";

const renderSheet = (title = 'Invalid File', message = INVALID) => {
  const onClose = jest.fn();
  render(
    <StoryDecorator>
      <ImportErrorSheet visible title={title} message={message} onClose={onClose} />
    </StoryDecorator>
  );
  return { onClose };
};

describe('ImportErrorSheet (frame E)', () => {
  // The sheet's own close — its scrim, Android back and the VoiceOver escape — reaches onClose.
  it('closes from its scrim and from Android back', async () => {
    const { onClose } = renderSheet();
    await userEvent.press(
      screen.getByTestId('import-error-sheet-scrim', { includeHiddenElements: true })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
    screen.UNSAFE_getByType(Modal).props.onRequestClose();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('reads OK on its OK', () => {
    renderSheet();
    expect(within(screen.getByTestId('import-error-ok')).getByText('OK')).toBeTruthy();
  });

  // The sheet's own action, pinned beneath its text, rather than content that scrolls with it.
  it('holds OK in the sheet’s actions', () => {
    renderSheet();
    const actions = screen.getByTestId('import-error-sheet-actions');
    expect(within(actions).getByTestId('import-error-ok')).toBeTruthy();
  });

  it.each([
    ['Invalid File', INVALID],
    ['No Card Data', 'This file contains no card data.']
  ])('titles it "%s" over the hook’s message, as a heading', (title, message) => {
    renderSheet(title, message);
    expect(screen.getByRole('header', { name: title })).toBeTruthy();
    expect(screen.getByText(message)).toBeTruthy();
  });

  // The message is the sheet's description: muted body text, with no tinted banner around it.
  it('sets the message as the description, with no tint and no icon', () => {
    renderSheet();
    expect(StyleSheet.flatten(screen.getByText(INVALID).props.style)).toMatchObject({
      fontSize: 15,
      color: LIGHT_THEME.textSecondary,
      marginTop: 8
    });
    expect(screen.queryByTestId('import-error-sheet-children')).toBeNull();
    expect(screen.UNSAFE_queryAllByType(Svg)).toHaveLength(0);
  });

  it('offers one primary OK, 52', () => {
    renderSheet();
    expect(screen.UNSAFE_getAllByType(Button).map(({ props }) => props)).toEqual([
      expect.objectContaining({ testID: 'import-error-ok', variant: 'primary', size: 'large' })
    ]);
  });

  it('closes on OK', async () => {
    const { onClose } = renderSheet();
    await userEvent.press(screen.getByTestId('import-error-ok'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

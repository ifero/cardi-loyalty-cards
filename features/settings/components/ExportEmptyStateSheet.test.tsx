/**
 * ExportEmptyStateSheet — acknowledge, settings frame E (Story 22.7).
 *
 * Rendered through the real `StoryDecorator`, the real sheet and the real button.
 */
import { render, screen, userEvent, within } from '@testing-library/react-native';
import React from 'react';
import { AccessibilityInfo, Modal, StyleSheet } from 'react-native';
import { Svg } from 'react-native-svg';

import { Button } from '@/shared/components/ui/Button';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { ExportEmptyStateSheet } from './ExportEmptyStateSheet';

const renderSheet = () => {
  const onClose = jest.fn();
  render(
    <StoryDecorator>
      <ExportEmptyStateSheet visible onClose={onClose} />
    </StoryDecorator>
  );
  return { onClose };
};

describe('ExportEmptyStateSheet (frame E)', () => {
  // Each sheet is announced by its title as it opens.
  it('is announced by its title as it opens', () => {
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => undefined);
    renderSheet();
    expect(announce).toHaveBeenCalledWith('Nothing to Export opened');
    announce.mockRestore();
  });

  // The sheet's own close — its scrim, Android back and the VoiceOver escape — reaches onClose.
  it('closes from its scrim and from Android back', async () => {
    const { onClose } = renderSheet();
    await userEvent.press(
      screen.getByTestId('export-empty-sheet-scrim', { includeHiddenElements: true })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
    screen.UNSAFE_getByType(Modal).props.onRequestClose();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('titles it "Nothing to Export" over its body, as a heading', () => {
    renderSheet();
    expect(screen.getByRole('header', { name: 'Nothing to Export' })).toBeTruthy();
    expect(
      screen.getByText("You don't have any cards yet. Add your first card to export your data.")
    ).toBeTruthy();
  });

  it('reads OK on its OK', () => {
    renderSheet();
    expect(within(screen.getByTestId('export-empty-close')).getByText('OK')).toBeTruthy();
  });

  // Exactly one button, and no icon: an empty export is not an error.
  it('offers one primary OK, 52, and nothing to cancel', () => {
    renderSheet();
    expect(screen.UNSAFE_getAllByType(Button).map(({ props }) => props)).toEqual([
      expect.objectContaining({ testID: 'export-empty-close', variant: 'primary', size: 'large' })
    ]);
    expect(
      StyleSheet.flatten(screen.getByTestId('export-empty-close-container').props.style).minHeight
    ).toBe(52);
    expect(screen.UNSAFE_queryAllByType(Svg)).toHaveLength(0);
  });

  // The actions sit 24 below the description, with no content between.
  it('holds no content between its body and its button', () => {
    renderSheet();
    expect(screen.queryByTestId('export-empty-sheet-children')).toBeNull();
    expect(
      StyleSheet.flatten(screen.getByTestId('export-empty-sheet-actions').props.style).marginTop
    ).toBe(24);
  });

  it('closes on OK', async () => {
    const { onClose } = renderSheet();
    await userEvent.press(screen.getByTestId('export-empty-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

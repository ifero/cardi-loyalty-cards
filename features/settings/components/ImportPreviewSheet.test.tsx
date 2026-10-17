/**
 * ImportPreviewSheet — confirm, settings frame D (Story 22.7).
 *
 * Rendered through the real `StoryDecorator`, the real sheet and the real buttons.
 */
import { render, screen, userEvent, within } from '@testing-library/react-native';
import React from 'react';
import { AccessibilityInfo, Modal, StyleSheet } from 'react-native';
import { Svg } from 'react-native-svg';

import { Button } from '@/shared/components/ui/Button';
import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { ImportPreviewSheet } from './ImportPreviewSheet';

type Scheme = 'light' | 'dark';
type Roles = typeof LIGHT_THEME | typeof DARK_THEME;
type SheetProps = React.ComponentProps<typeof ImportPreviewSheet>;

const renderSheet = (props: Partial<SheetProps> = {}, scheme: Scheme = 'light') => {
  const handlers = { onImport: jest.fn(), onClose: jest.fn() };
  render(
    <StoryDecorator theme={scheme}>
      <ImportPreviewSheet
        visible
        fileName="my-cards-backup.json"
        totalCards={8}
        newCardsCount={5}
        duplicateCount={3}
        invalidCount={1}
        isImporting={false}
        {...handlers}
        {...props}
      />
    </StoryDecorator>
  );
  return handlers;
};

const textStyle = (text: string) =>
  StyleSheet.flatten(screen.getByText(text).props.style) as Record<string, unknown>;

describe('ImportPreviewSheet (frame D)', () => {
  // Each sheet is announced by its title as it opens.
  it('is announced by its title as it opens', () => {
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => undefined);
    renderSheet();
    expect(announce).toHaveBeenCalledWith('Import Cards opened');
    announce.mockRestore();
  });

  it('titles it "Import Cards", as a heading', () => {
    renderSheet();
    expect(screen.getByRole('header', { name: 'Import Cards' })).toBeTruthy();
  });

  // The sheet's own actions, pinned beneath its text, rather than content that scrolls with it.
  it('holds Import and Cancel in the sheet’s actions', () => {
    renderSheet();
    const actions = screen.getByTestId('import-preview-sheet-actions');
    expect(within(actions).getByTestId('import-preview-confirm')).toBeTruthy();
    expect(within(actions).getByTestId('import-preview-cancel')).toBeTruthy();
  });

  // The sheet's own close — its scrim, Android back and the VoiceOver escape — reaches onClose.
  it('closes from its scrim and from Android back', async () => {
    const { onClose } = renderSheet();
    await userEvent.press(
      screen.getByTestId('import-preview-sheet-scrim', { includeHiddenElements: true })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
    screen.UNSAFE_getByType(Modal).props.onRequestClose();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('reads Import and Cancel on its buttons', () => {
    renderSheet();
    expect(within(screen.getByTestId('import-preview-confirm')).getByText('Import')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
  });

  it('shows the file and what importing it will do', () => {
    renderSheet();
    expect(screen.getByText('my-cards-backup.json')).toBeTruthy();
    expect(screen.getByText('8 cards found')).toBeTruthy();
    expect(screen.getByText('5 new cards will be added.')).toBeTruthy();
    expect(screen.getByText('3 duplicates will be skipped.')).toBeTruthy();
    expect(screen.getByText('1 invalid entry will be skipped.')).toBeTruthy();
  });

  // The file first, then what importing it will do, in that order.
  it('names the file before its counts', () => {
    renderSheet();
    const tree = JSON.stringify(screen.toJSON());
    const order = [
      'my-cards-backup.json',
      '8 cards found',
      '5 new cards will be added.',
      '3 duplicates will be skipped.',
      '1 invalid entry will be skipped.'
    ]
      .map((text) => `["${text}"]`)
      .map((needle) => tree.indexOf(needle));
    expect(order.every((index) => index > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('counts in the singular, and leaves out the invalid line when there are none', () => {
    renderSheet({ totalCards: 1, newCardsCount: 1, duplicateCount: 1, invalidCount: 0 });
    expect(screen.getByText('1 card found')).toBeTruthy();
    expect(screen.getByText('1 new card will be added.')).toBeTruthy();
    expect(screen.getByText('1 duplicate will be skipped.')).toBeTruthy();
    expect(screen.queryByText(/invalid entr/i)).toBeNull();
  });

  // Plain text on the margin: no chip, no icon, nothing centred.
  it.each<[Scheme, Roles]>([
    ['light', LIGHT_THEME],
    ['dark', DARK_THEME]
  ])('sets the counts in body-md %s textSecondary on the margin', (scheme, roles) => {
    renderSheet({}, scheme);
    [
      '8 cards found',
      '5 new cards will be added.',
      '3 duplicates will be skipped.',
      '1 invalid entry will be skipped.'
    ].forEach((count) => {
      expect(textStyle(count)).toMatchObject({
        fontFamily: 'Inter',
        fontSize: 15,
        fontWeight: '400',
        color: roles.textSecondary
      });
      expect(textStyle(count).textAlign).toBeUndefined();
    });
    expect(textStyle('my-cards-backup.json')).toMatchObject({ color: roles.textPrimary });
    expect(screen.UNSAFE_queryAllByType(Svg)).toHaveLength(0);
    expect(
      StyleSheet.flatten(screen.getByTestId('import-preview-summary').props.style).backgroundColor
    ).toBeUndefined();
  });

  it('puts Import, primary, above an outlined Cancel, both large', () => {
    renderSheet();
    expect(screen.UNSAFE_getAllByType(Button).map(({ props }) => props)).toEqual([
      expect.objectContaining({
        testID: 'import-preview-confirm',
        variant: 'primary',
        size: 'large'
      }),
      expect.objectContaining({
        testID: 'import-preview-cancel',
        variant: 'secondary',
        size: 'large'
      })
    ]);
  });

  // Import is never disabled: with no new card it imports nothing, and its toast says so.
  it('keeps Import live with no new card to add', async () => {
    const { onImport } = renderSheet({ newCardsCount: 0, duplicateCount: 8, invalidCount: 0 });
    const confirm = screen.getByTestId('import-preview-confirm');
    expect(confirm.props.accessibilityState).toMatchObject({ disabled: false });
    expect(
      screen
        .UNSAFE_getAllByType(Button)
        .find(({ props }) => props.testID === 'import-preview-confirm')?.props.disabled
    ).toBeUndefined();

    await userEvent.press(confirm);
    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it('cancels', async () => {
    const { onClose } = renderSheet();
    await userEvent.press(screen.getByTestId('import-preview-cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps Import its fill while busy, with a spinner, and leaves Cancel live', async () => {
    const { onImport, onClose } = renderSheet({ isImporting: true });
    const confirm = screen.getByTestId('import-preview-confirm');
    expect(screen.getByTestId('import-preview-confirm-spinner')).toBeTruthy();
    expect(confirm.props.accessibilityState).toEqual({ disabled: false, busy: true });
    expect(confirm.props.accessibilityLabel).toBe('Import');
    expect(
      StyleSheet.flatten(screen.getByTestId('import-preview-confirm-container').props.style)
        .backgroundColor
    ).toBe(LIGHT_THEME.primary);

    await userEvent.press(confirm);
    expect(onImport).not.toHaveBeenCalled();
    await userEvent.press(screen.getByTestId('import-preview-cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

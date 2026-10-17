/**
 * ExportConfirmationSheet — confirm, settings frame D (Story 22.7).
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

import { ExportConfirmationSheet } from './ExportConfirmationSheet';

type Scheme = 'light' | 'dark';
type SheetProps = React.ComponentProps<typeof ExportConfirmationSheet>;

const renderSheet = (props: Partial<SheetProps> = {}, scheme: Scheme = 'light') => {
  const handlers = { onExport: jest.fn(), onClose: jest.fn() };
  render(
    <StoryDecorator theme={scheme}>
      <ExportConfirmationSheet
        visible
        cardCount={3}
        isExporting={false}
        exportError={null}
        {...handlers}
        {...props}
      />
    </StoryDecorator>
  );
  return handlers;
};

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

describe('ExportConfirmationSheet (frame D)', () => {
  // Each sheet is announced by its title as it opens.
  it('is announced by its title as it opens', () => {
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => undefined);
    renderSheet();
    expect(announce).toHaveBeenCalledWith('Export Your Cards opened');
    announce.mockRestore();
  });

  it('titles it "Export Your Cards" over its body, as a heading', () => {
    renderSheet();
    expect(screen.getByRole('header', { name: 'Export Your Cards' })).toBeTruthy();
    expect(
      screen.getByText('All 3 cards will be exported as a JSON file that you can save or share.')
    ).toBeTruthy();
  });

  it('counts a single card in the singular', () => {
    renderSheet({ cardCount: 1 });
    expect(
      screen.getByText('Your 1 card will be exported as a JSON file that you can save or share.')
    ).toBeTruthy();
  });

  // The sheet's own actions, pinned beneath its text, rather than content that scrolls with it.
  it('holds Export and Cancel in the sheet’s actions', () => {
    renderSheet();
    const actions = screen.getByTestId('export-confirmation-sheet-actions');
    expect(within(actions).getByTestId('export-confirm-button')).toBeTruthy();
    expect(within(actions).getByTestId('export-cancel-button')).toBeTruthy();
  });

  // The sheet's own close — its scrim, Android back and the VoiceOver escape — reaches onClose.
  it('closes from its scrim and from Android back', async () => {
    const { onClose } = renderSheet();
    await userEvent.press(
      screen.getByTestId('export-confirmation-sheet-scrim', { includeHiddenElements: true })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
    screen.UNSAFE_getByType(Modal).props.onRequestClose();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('reads Export and Cancel on its buttons', () => {
    renderSheet();
    expect(within(screen.getByTestId('export-confirm-button')).getByText('Export')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
  });

  it.each<[Scheme, string]>([
    ['light', LIGHT_THEME.primary],
    ['dark', DARK_THEME.primary]
  ])('puts Export, primary, above an outlined Cancel, both 52, in %s', (scheme, primary) => {
    renderSheet({}, scheme);
    expect(screen.UNSAFE_getAllByType(Button).map(({ props }) => props)).toEqual([
      expect.objectContaining({
        testID: 'export-confirm-button',
        variant: 'primary',
        size: 'large'
      }),
      expect.objectContaining({
        testID: 'export-cancel-button',
        variant: 'secondary',
        size: 'large'
      })
    ]);
    expect(flat('export-confirm-button-container')).toMatchObject({
      minHeight: 52,
      backgroundColor: primary
    });
    expect(flat('export-cancel-button-container')).toMatchObject({ minHeight: 52, borderWidth: 1 });
  });

  it('draws no icon, and no banner while nothing has failed', () => {
    renderSheet();
    expect(screen.UNSAFE_queryAllByType(Svg)).toHaveLength(0);
    expect(screen.queryByTestId('export-error-text')).toBeNull();
  });

  it('shows a failed export as one banner, the first thing in the content, as an alert', () => {
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions')
      .mockImplementation(() => undefined);
    renderSheet({ exportError: 'Export failed' });
    const banner = screen.getByTestId('export-error-text');
    expect(banner.props.accessibilityRole).toBe('alert');
    expect(screen.getAllByText('Export failed')).toHaveLength(1);
    expect(screen.getByTestId('export-confirmation-sheet-children')).toBeTruthy();
    // Spoken on iOS, which does not speak the alert role: queued behind the opening announcement.
    expect(announce).toHaveBeenCalledWith('Export failed', { queue: true });
    announce.mockRestore();
  });

  it('exports, or cancels', async () => {
    const { onExport, onClose } = renderSheet();
    await userEvent.press(screen.getByTestId('export-confirm-button'));
    expect(onExport).toHaveBeenCalledTimes(1);
    await userEvent.press(screen.getByTestId('export-cancel-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps Export its fill while busy, with a spinner, and leaves Cancel live', async () => {
    const { onExport, onClose } = renderSheet({ isExporting: true });
    const confirm = screen.getByTestId('export-confirm-button');
    expect(screen.getByTestId('export-confirm-button-spinner')).toBeTruthy();
    expect(confirm.props.accessibilityState).toEqual({ disabled: false, busy: true });
    expect(confirm.props.accessibilityLabel).toBe('Export');
    expect(flat('export-confirm-button-container').backgroundColor).toBe(LIGHT_THEME.primary);

    await userEvent.press(confirm);
    expect(onExport).not.toHaveBeenCalled();
    await userEvent.press(screen.getByTestId('export-cancel-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

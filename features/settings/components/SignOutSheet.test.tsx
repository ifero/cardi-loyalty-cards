/**
 * SignOutSheet — confirm, settings frame D (Story 22.7).
 *
 * Rendered through the real `StoryDecorator`, the real sheet and the real buttons, because the
 * destructive text action, the outlined Cancel and the banner are all theme roles.
 */
import { render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';
import { AccessibilityInfo, Modal, StyleSheet } from 'react-native';
import { Svg } from 'react-native-svg';

import { Button } from '@/shared/components/ui/Button';
import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { SignOutSheet } from './SignOutSheet';

type Scheme = 'light' | 'dark';
type Roles = typeof LIGHT_THEME | typeof DARK_THEME;
type SheetProps = React.ComponentProps<typeof SignOutSheet>;

const renderSheet = (props: Partial<SheetProps> = {}, scheme: Scheme = 'light') => {
  const handlers = { onConfirm: jest.fn(), onClose: jest.fn() };
  render(
    <StoryDecorator theme={scheme}>
      <SignOutSheet visible isLoading={false} error={null} {...handlers} {...props} />
    </StoryDecorator>
  );
  return handlers;
};

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

describe('SignOutSheet (frame D)', () => {
  // The sheet's own close — its scrim, Android back and the VoiceOver escape — reaches onClose.
  it('closes from its scrim and from Android back', async () => {
    const { onClose } = renderSheet();
    await userEvent.press(
      screen.getByTestId('signout-sheet-scrim', { includeHiddenElements: true })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
    screen.UNSAFE_getByType(Modal).props.onRequestClose();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('reads Cancel on its Cancel', () => {
    renderSheet();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
  });

  it('titles it "Sign Out?" over its body, a heading it is announced by', () => {
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => undefined);
    renderSheet();
    expect(screen.getByRole('header', { name: 'Sign Out?' })).toBeTruthy();
    expect(
      screen.getByText('You will return to guest mode. Your cards will remain on this device.')
    ).toBeTruthy();
    expect(announce).toHaveBeenCalledWith('Sign Out? opened');
    announce.mockRestore();
  });

  // The destructive action above the outlined Cancel — the bordered control is the safe one.
  it('puts Sign Out, destructive, above an outlined Cancel, both large', () => {
    renderSheet();
    expect(screen.UNSAFE_getAllByType(Button).map(({ props }) => props)).toEqual([
      expect.objectContaining({ testID: 'signout-confirm', variant: 'destructive', size: 'large' }),
      expect.objectContaining({ testID: 'signout-cancel', variant: 'secondary', size: 'large' })
    ]);
    expect(flat('signout-sheet-actions')).toMatchObject({ marginTop: 24, gap: 8 });
  });

  it.each<[Scheme, Roles]>([
    ['light', LIGHT_THEME],
    ['dark', DARK_THEME]
  ])('draws Sign Out as borderless %s error text and Cancel outlined, both 52', (scheme, roles) => {
    renderSheet({}, scheme);
    expect(flat('signout-confirm-container')).toMatchObject({
      minHeight: 52,
      borderWidth: 0,
      backgroundColor: 'transparent'
    });
    expect(StyleSheet.flatten(screen.getByText('Sign Out').props.style).color).toBe(roles.error);
    expect(flat('signout-cancel-container')).toMatchObject({
      minHeight: 52,
      borderWidth: 1,
      borderColor: roles.primary
    });
  });

  it('draws no icon, and no banner while nothing has failed', () => {
    renderSheet();
    expect(screen.UNSAFE_queryAllByType(Svg)).toHaveLength(0);
    expect(screen.queryByTestId('signout-error')).toBeNull();
    expect(screen.queryByTestId('signout-sheet-children')).toBeNull();
  });

  it('shows a failed sign-out as one banner, the first thing in the content, as an alert', () => {
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions')
      .mockImplementation(() => undefined);
    renderSheet({ error: 'Unable to sign out' });
    const banner = screen.getByTestId('signout-error');
    expect(banner.props.accessibilityRole).toBe('alert');
    expect(screen.getAllByText('Unable to sign out')).toHaveLength(1);
    expect(screen.getByTestId('signout-sheet-children')).toBeTruthy();
    const tree = JSON.stringify(screen.toJSON());
    expect(tree.indexOf('"signout-error"')).toBeLessThan(tree.indexOf('"signout-confirm"'));
    // Spoken on iOS, which does not speak the alert role: queued behind the opening announcement.
    expect(announce).toHaveBeenCalledWith('Unable to sign out', { queue: true });
    announce.mockRestore();
  });

  it('signs out, or cancels', async () => {
    const { onConfirm, onClose } = renderSheet();
    await userEvent.press(screen.getByTestId('signout-confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await userEvent.press(screen.getByTestId('signout-cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // Busy is not disabled: Sign Out keeps its look, shows a spinner and ignores presses, and nothing
  // else in the sheet locks.
  it('keeps Sign Out its look while busy, with a spinner, and leaves Cancel live', async () => {
    const { onConfirm, onClose } = renderSheet({ isLoading: true });
    const confirm = screen.getByTestId('signout-confirm');
    expect(screen.getByTestId('signout-confirm-spinner')).toBeTruthy();
    expect(confirm.props.accessibilityState).toEqual({ disabled: false, busy: true });
    expect(confirm.props.accessibilityLabel).toBe('Sign Out');
    expect(flat('signout-confirm-container').opacity).toBeUndefined();
    // Its look kept: the borderless destructive label's transparent fill, the spinner in error.
    expect(flat('signout-confirm-container').backgroundColor).toBe('transparent');
    expect(screen.getByTestId('signout-confirm-spinner').props.color).toBe(LIGHT_THEME.error);

    await userEvent.press(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
    await userEvent.press(screen.getByTestId('signout-cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

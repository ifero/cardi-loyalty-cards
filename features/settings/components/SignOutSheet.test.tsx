/**
 * SignOutSheet — confirm, settings frame D (Story 22.7); keep or erase the cards (Story 16.45).
 *
 * Rendered through the real `StoryDecorator`, the real sheet and the real buttons, because the
 * destructive text action, the outlined Cancel and the banner are all theme roles.
 */
import { act, render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';
import { AccessibilityInfo, Modal, StyleSheet } from 'react-native';
import { Svg } from 'react-native-svg';

import { Button } from '@/shared/components/ui/Button';
import { changeAppLanguage } from '@/shared/i18n';
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
      <SignOutSheet visible busyAction={null} error={null} {...handlers} {...props} />
    </StoryDecorator>
  );
  return handlers;
};

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

const BODY =
  'You will return to guest mode. Keep your cards on this device, or erase them from this device and its paired watch. Your account keeps its copy, but cards not yet synced to it are lost for good if you erase.';

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
    expect(screen.getByText(BODY)).toBeTruthy();
    expect(announce).toHaveBeenCalledWith('Sign Out? opened');
    announce.mockRestore();
  });

  // Keep (outlined), then the destructive erase, then the outlined Cancel — all large.
  it('stacks keep, then the destructive erase, then an outlined Cancel, all large', () => {
    renderSheet();
    expect(screen.UNSAFE_getAllByType(Button).map(({ props }) => props)).toEqual([
      expect.objectContaining({ testID: 'signout-keep', variant: 'secondary', size: 'large' }),
      expect.objectContaining({ testID: 'signout-erase', variant: 'destructive', size: 'large' }),
      expect.objectContaining({ testID: 'signout-cancel', variant: 'secondary', size: 'large' })
    ]);
    expect(screen.getByRole('button', { name: 'Sign out, keep cards' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign out and erase cards' })).toBeTruthy();
    expect(flat('signout-sheet-actions')).toMatchObject({ marginTop: 24, gap: 8 });
  });

  it.each<[Scheme, Roles]>([
    ['light', LIGHT_THEME],
    ['dark', DARK_THEME]
  ])(
    'draws erase as borderless %s error text, keep and Cancel outlined, all 52',
    (scheme, roles) => {
      renderSheet({}, scheme);
      expect(flat('signout-erase-container')).toMatchObject({
        minHeight: 52,
        borderWidth: 0,
        backgroundColor: 'transparent'
      });
      expect(
        StyleSheet.flatten(screen.getByText('Sign out and erase cards').props.style).color
      ).toBe(roles.error);
      expect(flat('signout-keep-container')).toMatchObject({
        minHeight: 52,
        borderWidth: 1,
        borderColor: roles.primary
      });
      expect(flat('signout-cancel-container')).toMatchObject({
        minHeight: 52,
        borderWidth: 1,
        borderColor: roles.primary
      });
    }
  );

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
    expect(tree.indexOf('"signout-error"')).toBeLessThan(tree.indexOf('"signout-keep"'));
    // Spoken on iOS, which does not speak the alert role: queued behind the opening announcement.
    expect(announce).toHaveBeenCalledWith('Unable to sign out', { queue: true });
    announce.mockRestore();
  });

  it('reports keep or erase to onConfirm, or cancels', async () => {
    const { onConfirm, onClose } = renderSheet();
    await userEvent.press(screen.getByTestId('signout-keep'));
    expect(onConfirm).toHaveBeenLastCalledWith(false);
    await userEvent.press(screen.getByTestId('signout-erase'));
    expect(onConfirm).toHaveBeenLastCalledWith(true);
    expect(onConfirm).toHaveBeenCalledTimes(2);
    await userEvent.press(screen.getByTestId('signout-cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // Busy is not disabled for the pressed choice: it keeps its look, shows a spinner and ignores
  // presses. The other choice and Cancel are disabled, and the sheet's own close does nothing.
  it('keeps the busy erase its look with a spinner, and disables keep and Cancel', async () => {
    const { onConfirm, onClose } = renderSheet({ busyAction: 'erase' });
    const erase = screen.getByTestId('signout-erase');
    const keep = screen.getByTestId('signout-keep');
    expect(screen.getByTestId('signout-erase-spinner')).toBeTruthy();
    expect(screen.queryByTestId('signout-keep-spinner')).toBeNull();
    expect(erase.props.accessibilityState).toEqual({ disabled: false, busy: true });
    expect(erase.props.accessibilityLabel).toBe('Sign out and erase cards');
    expect(keep.props.accessibilityState).toEqual({ disabled: true, busy: false });
    // Its look kept: the borderless destructive label's transparent fill, the spinner in error.
    expect(flat('signout-erase-container').opacity).toBeUndefined();
    expect(flat('signout-erase-container').backgroundColor).toBe('transparent');
    expect(screen.getByTestId('signout-erase-spinner').props.color).toBe(LIGHT_THEME.error);

    expect(screen.getByTestId('signout-cancel').props.accessibilityState).toEqual({
      disabled: true,
      busy: false
    });

    await userEvent.press(erase);
    await userEvent.press(keep);
    expect(onConfirm).not.toHaveBeenCalled();
    await userEvent.press(screen.getByTestId('signout-cancel'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it.each(['keep', 'erase'] as const)(
    'ignores its scrim and Android back while %s is in flight',
    async (busyAction) => {
      const { onClose } = renderSheet({ busyAction });
      await userEvent.press(
        screen.getByTestId('signout-sheet-scrim', { includeHiddenElements: true })
      );
      screen.UNSAFE_getByType(Modal).props.onRequestClose();
      expect(onClose).not.toHaveBeenCalled();
    }
  );

  it('shows the spinner on keep alone while keeping, and ignores both choices', async () => {
    const { onConfirm } = renderSheet({ busyAction: 'keep' });
    expect(screen.getByTestId('signout-keep-spinner')).toBeTruthy();
    expect(screen.queryByTestId('signout-erase-spinner')).toBeNull();
    expect(screen.getByTestId('signout-keep').props.accessibilityState).toEqual({
      disabled: false,
      busy: true
    });
    expect(screen.getByTestId('signout-erase').props.accessibilityState).toEqual({
      disabled: true,
      busy: false
    });

    await userEvent.press(screen.getByTestId('signout-keep'));
    await userEvent.press(screen.getByTestId('signout-erase'));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  describe('in Italian', () => {
    afterEach(async () => {
      await act(async () => {
        await changeAppLanguage('en');
      });
    });

    it('draws its title, body and both choices in Italian', async () => {
      await act(async () => {
        await changeAppLanguage('it');
      });
      renderSheet();
      expect(screen.getByRole('header', { name: 'Vuoi uscire?' })).toBeTruthy();
      expect(
        screen.getByText(
          "Tornerai in modalità ospite. Puoi tenere le carte su questo dispositivo, oppure cancellarle da questo dispositivo e dallo smartwatch associato. L'account ne conserva una copia, ma se le cancelli le carte non ancora sincronizzate andranno perse per sempre."
        )
      ).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Esci e tieni le carte' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Esci e cancella le carte' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Annulla' })).toBeTruthy();
    });
  });
});

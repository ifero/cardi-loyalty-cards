/**
 * AccountSection — settings frame A's account group (Story 22.7).
 *
 * Rendered through the real `StoryDecorator` and the real primitives, because the group is its
 * theme roles: a hairline-outlined surface, a muted caption, ink text and red destructive rows.
 */
import { render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Svg } from 'react-native-svg';

import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { AccountSection } from './AccountSection';

type Scheme = 'light' | 'dark';
type Roles = typeof LIGHT_THEME | typeof DARK_THEME;
type AccountProps = React.ComponentProps<typeof AccountSection>;

const renderAccount = (props: Partial<AccountProps> = {}, scheme: Scheme = 'light') => {
  const handlers = {
    onSignOut: jest.fn(),
    onChangePassword: jest.fn(),
    onDeleteAccount: jest.fn()
  };
  render(
    <StoryDecorator theme={scheme}>
      <AccountSection email="andrea@example.com" {...handlers} {...props} />
    </StoryDecorator>
  );
  return handlers;
};

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

const textStyle = (text: string) =>
  StyleSheet.flatten(screen.getByText(text).props.style) as Record<string, unknown>;

/** Lucide hides its icons from assistive technology, so a query has to look past that. */
const chevron = (row: string) =>
  screen.queryByTestId(`${row}-chevron`, { includeHiddenElements: true });

describe('AccountSection (frame A)', () => {
  describe('the group', () => {
    it.each<[Scheme, Roles]>([
      ['light', LIGHT_THEME],
      ['dark', DARK_THEME]
    ])('is one %s hairline-outlined surface', (scheme, roles) => {
      renderAccount({}, scheme);
      expect(flat('settings-account-card')).toMatchObject({
        backgroundColor: roles.surface,
        borderColor: roles.border,
        borderWidth: 1,
        borderRadius: 16
      });
    });

    // Identity, not a category: no section head above it.
    it('has no head above it', () => {
      renderAccount();
      expect(screen.queryAllByRole('header')).toHaveLength(0);
    });

    // The head, then Change Password, Sign Out and Delete Account, each ruled from the last.
    it('orders the head, Change Password, Sign Out, then Delete Account, rule by rule', () => {
      renderAccount();
      const tree = JSON.stringify(screen.toJSON());
      const order = [
        'settings-account-head',
        'settings-change-password-row',
        'settings-signout-row',
        'settings-delete-row'
      ].map((testID) => tree.indexOf(`"${testID}"`));
      expect(order.every((index) => index > -1)).toBe(true);
      expect([...order].sort((a, b) => a - b)).toEqual(order);
      expect(screen.getAllByTestId('settings-account-card-divider')).toHaveLength(3);
    });

    // The avatar, the hard-coded "Synced" mark and the row icons are gone.
    it('draws no avatar, no "Synced" mark and no icon but the chevron', () => {
      renderAccount();
      expect(screen.queryByText('Synced')).toBeNull();
      expect(screen.queryByText('A')).toBeNull();
      expect(screen.UNSAFE_queryAllByType(Svg)).toHaveLength(1);
      expect(chevron('settings-change-password-row')).toBeTruthy();
    });
  });

  describe('the head', () => {
    it('is padded 12/16, the email 2 below its caption', () => {
      renderAccount();
      expect(flat('settings-account-head')).toMatchObject({
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 2
      });
    });

    // Exact needles, since the head's name holds both strings.
    it('puts its caption before the email', () => {
      renderAccount();
      const tree = JSON.stringify(screen.toJSON());
      expect(tree.indexOf('"Signed in"')).toBeGreaterThan(-1);
      expect(tree.indexOf('"Signed in"')).toBeLessThan(tree.indexOf('"andrea@example.com"'));
    });

    it.each<[Scheme, Roles]>([
      ['light', LIGHT_THEME],
      ['dark', DARK_THEME]
    ])(
      'captions it "Signed in" in overline %s textSecondary, uppercase by style',
      (scheme, roles) => {
        renderAccount({}, scheme);
        expect(textStyle('Signed in')).toMatchObject({
          fontFamily: 'Inter',
          fontSize: 12,
          fontWeight: '600',
          textTransform: 'uppercase',
          color: roles.textSecondary
        });
      }
    );

    it.each<[Scheme, Roles]>([
      ['light', LIGHT_THEME],
      ['dark', DARK_THEME]
    ])(
      'sets the email in body-lg %s textPrimary, wrapping rather than clipping',
      (scheme, roles) => {
        renderAccount({}, scheme);
        const email = screen.getByText('andrea@example.com');
        expect(email.props.numberOfLines).toBeUndefined();
        expect(textStyle('andrea@example.com')).toMatchObject({
          fontFamily: 'Inter',
          fontSize: 17,
          fontWeight: '400',
          color: roles.textPrimary
        });
      }
    );

    it('is one element for a screen reader, "Signed in, <email>"', () => {
      renderAccount();
      const head = screen.getByTestId('settings-account-head');
      expect(head.props.accessible).toBe(true);
      expect(head.props.accessibilityLabel).toBe('Signed in, andrea@example.com');
      expect(head.props.accessibilityRole).toBeUndefined();
    });
  });

  describe('the rows', () => {
    it('gives Change Password its chevron, and Sign Out and Delete Account none', () => {
      renderAccount();
      expect(chevron('settings-change-password-row')).toBeTruthy();
      expect(chevron('settings-signout-row')).toBeNull();
      expect(chevron('settings-delete-row')).toBeNull();
    });

    it.each<[Scheme, Roles]>([
      ['light', LIGHT_THEME],
      ['dark', DARK_THEME]
    ])('sets Sign Out and Delete Account as destructive text in %s', (scheme, roles) => {
      renderAccount({}, scheme);
      expect(textStyle('Sign Out').color).toBe(roles.error);
      expect(textStyle('Delete Account').color).toBe(roles.error);
      expect(textStyle('Change Password').color).toBe(roles.textPrimary);
      // Text only: no red fill and no red border on either row.
      expect(flat('settings-signout-row').backgroundColor).toBe('transparent');
      expect(flat('settings-delete-row').backgroundColor).toBe('transparent');
    });

    it('keeps the rows’ shipped names', () => {
      renderAccount();
      expect(screen.getByTestId('settings-change-password-row').props.accessibilityLabel).toBe(
        'Change Password'
      );
      expect(screen.getByTestId('settings-signout-row').props.accessibilityLabel).toBe('Sign Out');
      expect(screen.getByTestId('settings-delete-row').props.accessibilityLabel).toBe(
        'Delete Account, destructive action'
      );
    });

    // Pressed through each row's own responder, as a finger does.
    it('fires each row’s own handler', async () => {
      const { onSignOut, onChangePassword, onDeleteAccount } = renderAccount();

      await userEvent.press(screen.getByTestId('settings-change-password-row'));
      expect(onChangePassword).toHaveBeenCalledTimes(1);
      await userEvent.press(screen.getByTestId('settings-signout-row'));
      expect(onSignOut).toHaveBeenCalledTimes(1);
      await userEvent.press(screen.getByTestId('settings-delete-row'));
      expect(onDeleteAccount).toHaveBeenCalledTimes(1);
    });
  });

  // While its code is sent, Change Password is busy, not disabled: it keeps its look, shows the
  // spinner in its chevron's place and ignores presses.
  describe('while the code is sent', () => {
    it('shows the spinner in place of the chevron', () => {
      renderAccount({ isChangingPassword: true });
      expect(screen.getByTestId('settings-change-password-row-spinner')).toBeTruthy();
      expect(chevron('settings-change-password-row')).toBeNull();
    });

    it('keeps its look, is announced busy, and ignores presses', async () => {
      const { onChangePassword } = renderAccount({ isChangingPassword: true });
      const row = screen.getByTestId('settings-change-password-row');
      expect(row.props.accessibilityState).toEqual({ disabled: false, busy: true });
      expect(flat('settings-change-password-row').opacity).toBeUndefined();

      await userEvent.press(row);
      expect(onChangePassword).not.toHaveBeenCalled();
    });

    it('leaves the other rows live', async () => {
      const { onSignOut } = renderAccount({ isChangingPassword: true });
      await userEvent.press(screen.getByTestId('settings-signout-row'));
      expect(onSignOut).toHaveBeenCalledTimes(1);
    });
  });
});

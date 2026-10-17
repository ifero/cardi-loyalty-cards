/**
 * AccountSectionGuest — settings frame B's account group (Story 22.7).
 *
 * Rendered through the real `StoryDecorator` and the real primitives, because the group is its
 * theme roles: a surface, a display title, muted body copy, a primary and an outlined button.
 */
import { render, screen, userEvent, within } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Svg } from 'react-native-svg';

import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { AccountSectionGuest } from './AccountSectionGuest';

type Scheme = 'light' | 'dark';
type Roles = typeof LIGHT_THEME | typeof DARK_THEME;

const BODY = 'Sign in or create an account to back up your cards and sync across devices.';

const renderGuest = (scheme: Scheme = 'light') => {
  const handlers = { onCreateAccount: jest.fn(), onSignIn: jest.fn() };
  render(
    <StoryDecorator theme={scheme}>
      <AccountSectionGuest {...handlers} />
    </StoryDecorator>
  );
  return handlers;
};

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

const textStyle = (text: string) =>
  StyleSheet.flatten(screen.getByText(text).props.style) as Record<string, unknown>;

describe('AccountSectionGuest (frame B)', () => {
  it.each<[Scheme, Roles]>([
    ['light', LIGHT_THEME],
    ['dark', DARK_THEME]
  ])('is a %s hairline-outlined surface', (scheme, roles) => {
    renderGuest(scheme);
    expect(flat('settings-guest-card')).toMatchObject({
      backgroundColor: roles.surface,
      borderColor: roles.border,
      borderWidth: 1,
      borderRadius: 16
    });
  });

  it('pads its block 24 and centres it', () => {
    renderGuest();
    expect(flat('settings-guest-block')).toMatchObject({ padding: 24, alignItems: 'center' });
  });

  it.each<[Scheme, Roles]>([
    ['light', LIGHT_THEME],
    ['dark', DARK_THEME]
  ])('titles it "Not signed in yet" in the %s sheet title, as a heading', (scheme, roles) => {
    renderGuest(scheme);
    expect(screen.getByRole('header', { name: 'Not signed in yet' })).toBeTruthy();
    expect(textStyle('Not signed in yet')).toMatchObject({
      fontFamily: 'Space Grotesk',
      fontSize: 20,
      fontWeight: '700',
      textAlign: 'center',
      color: roles.textPrimary
    });
  });

  it.each<[Scheme, Roles]>([
    ['light', LIGHT_THEME],
    ['dark', DARK_THEME]
  ])('sets its body 8 below in body-md %s textSecondary', (scheme, roles) => {
    renderGuest(scheme);
    expect(textStyle(BODY)).toMatchObject({
      fontFamily: 'Inter',
      fontSize: 15,
      marginTop: 8,
      textAlign: 'center',
      color: roles.textSecondary
    });
  });

  // 24 below the body, full width, 8 apart: Create Account above Sign In.
  it('stacks Create Account above Sign In, 24 below the body and 8 apart, full width', () => {
    renderGuest();
    expect(flat('settings-guest-actions')).toMatchObject({
      marginTop: 24,
      gap: 8,
      alignSelf: 'stretch'
    });
    expect(flat('settings-guest-actions').flexDirection).toBeUndefined();
    const tree = JSON.stringify(screen.toJSON());
    expect(tree.indexOf('"settings-create-account-button"')).toBeLessThan(
      tree.indexOf('"settings-sign-in-button"')
    );
  });

  // The default 48, not the frame's 52: the design system gives 52 only to a footer's primary and
  // to a sheet's actions.
  it.each<[Scheme, Roles]>([
    ['light', LIGHT_THEME],
    ['dark', DARK_THEME]
  ])('draws Create Account primary and Sign In outlined, both 48, in %s', (scheme, roles) => {
    renderGuest(scheme);
    expect(flat('settings-create-account-button-container')).toMatchObject({
      minHeight: 48,
      backgroundColor: roles.primary
    });
    expect(flat('settings-sign-in-button-container')).toMatchObject({
      minHeight: 48,
      borderWidth: 1,
      borderColor: roles.primary,
      backgroundColor: 'transparent'
    });
  });

  // Neither button carries an accessibilityLabel, so what each reads is also its name.
  it('reads Create Account and Sign In on its buttons', () => {
    renderGuest();
    expect(
      within(screen.getByTestId('settings-create-account-button')).getByText('Create Account')
    ).toBeTruthy();
    expect(within(screen.getByTestId('settings-sign-in-button')).getByText('Sign In')).toBeTruthy();
  });

  // Frame B, top to bottom: the title, the body, then the buttons.
  it('puts the title, then the body, then the buttons', () => {
    renderGuest();
    const tree = JSON.stringify(screen.toJSON());
    const order = [
      '["Not signed in yet"]',
      '["Sign in or create an account to back up your cards and sync across devices."]',
      '"settings-guest-actions"'
    ].map((needle) => tree.indexOf(needle));
    expect(order.every((index) => index > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('draws no shield and no other icon', () => {
    renderGuest();
    expect(screen.UNSAFE_queryAllByType(Svg)).toHaveLength(0);
  });

  it('fires the create-account and sign-in handlers', async () => {
    const { onCreateAccount, onSignIn } = renderGuest();

    await userEvent.press(screen.getByTestId('settings-create-account-button'));
    expect(onCreateAccount).toHaveBeenCalledTimes(1);
    await userEvent.press(screen.getByTestId('settings-sign-in-button'));
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });
});

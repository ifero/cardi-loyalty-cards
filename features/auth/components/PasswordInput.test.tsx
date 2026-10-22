/**
 * PasswordInput — a password field with its eye (Story 22.9: the Lucide eye).
 */
import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import Eye from 'lucide-react-native/icons/eye';
import EyeOff from 'lucide-react-native/icons/eye-off';
import React, { createRef } from 'react';
import { StyleSheet, type TextInput } from 'react-native';

import { DARK_THEME, LIGHT_THEME, type Theme } from '@/shared/theme/colors';

import { PasswordInput } from './PasswordInput';

let mockIsDark = false;

// The real token values, so every role is checked against what the app paints.
jest.mock('@/shared/theme', () => {
  const { DARK_THEME: dark, LIGHT_THEME: light } = jest.requireActual('@/shared/theme/colors');
  return {
    useTheme: () => ({ theme: mockIsDark ? dark : light, isDark: mockIsDark })
  };
});

const flat = (style: unknown) => StyleSheet.flatten(style as never) as Record<string, unknown>;

const renderInput = (props: Partial<React.ComponentProps<typeof PasswordInput>> = {}) =>
  render(
    <PasswordInput
      testID="password-input"
      label="Password"
      value="Password1"
      onChangeText={jest.fn()}
      placeholder="Your password"
      {...props}
    />
  );

describe('PasswordInput', () => {
  afterEach(() => {
    mockIsDark = false;
  });

  it('hides the password at first, behind the eye named "Show password"', () => {
    renderInput();
    expect(screen.getByTestId('password-input').props.secureTextEntry).toBe(true);
    expect(screen.getByTestId('password-input-toggle').props.accessibilityLabel).toBe(
      'Show password'
    );
    expect(screen.UNSAFE_getByType(Eye)).toBeTruthy();
    expect(screen.UNSAFE_queryByType(EyeOff)).toBeNull();
  });

  it('shows the password behind eye-off named "Hide password", and hides it again', async () => {
    renderInput();
    await userEvent.press(screen.getByTestId('password-input-toggle'));
    expect(screen.getByTestId('password-input').props.secureTextEntry).toBe(false);
    expect(screen.getByLabelText('Hide password')).toBeTruthy();
    expect(screen.UNSAFE_getByType(EyeOff)).toBeTruthy();
    expect(screen.UNSAFE_queryByType(Eye)).toBeNull();

    await userEvent.press(screen.getByTestId('password-input-toggle'));
    expect(screen.getByTestId('password-input').props.secureTextEntry).toBe(true);
    expect(screen.getByLabelText('Show password')).toBeTruthy();
  });

  it.each<[string, boolean, Theme]>([
    ['light', false, LIGHT_THEME],
    ['dark', true, DARK_THEME]
  ])('draws the eye at 24 / 1.5 in textSecondary, in %s', (_scheme, isDark, theme) => {
    mockIsDark = isDark;
    renderInput();
    expect(screen.UNSAFE_getByType(Eye).props).toMatchObject({
      size: 24,
      strokeWidth: 1.5,
      color: theme.textSecondary
    });
  });

  it('centres the eye in a 48pt target', () => {
    renderInput();
    expect(flat(screen.getByTestId('password-input-toggle').props.style)).toMatchObject({
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center'
    });
  });

  it('scales the eye to 0.98 while pressed', () => {
    renderInput();
    const toggle = screen.getByTestId('password-input-toggle');
    expect(flat(toggle.props.style).transform).toBeUndefined();

    fireEvent(toggle, 'pressIn');
    expect(flat(screen.getByTestId('password-input-toggle').props.style).transform).toEqual([
      { scale: 0.98 }
    ]);
    fireEvent(toggle, 'pressOut');
    expect(flat(screen.getByTestId('password-input-toggle').props.style).transform).toBeUndefined();
  });

  it('keeps its name and its hint', () => {
    renderInput({ accessibilityHint: 'Enter your password' });
    const input = screen.getByTestId('password-input');
    expect(input.props.accessibilityLabel).toBe('Password');
    expect(input.props.accessibilityHint).toBe('Enter your password');
  });

  // A failed request no longer reddens it: only its own message does.
  it('errs only through its own message', () => {
    const view = renderInput();
    expect(flat(screen.getByTestId('password-input').props.style).borderColor).toBe(
      LIGHT_THEME.border
    );

    view.rerender(
      <PasswordInput
        testID="password-input"
        label="Password"
        value=""
        onChangeText={jest.fn()}
        placeholder="Your password"
        error="Password is required."
      />
    );
    expect(screen.getByTestId('password-input-error')).toBeTruthy();
    expect(flat(screen.getByTestId('password-input').props.style).borderColor).toBe(
      LIGHT_THEME.error
    );
  });

  it('hands its ref to the input, so a failed submit can focus it', () => {
    const ref = createRef<TextInput>();
    renderInput({ ref });
    expect(typeof ref.current?.focus).toBe('function');
  });
});

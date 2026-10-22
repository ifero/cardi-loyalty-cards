/**
 * AuthLink — an auth screen's text link (Story 22.9).
 */
import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import { DARK_THEME, LIGHT_THEME, type Theme } from '@/shared/theme/colors';

import { AuthLink } from './AuthLink';

let mockIsDark = false;

// The real token values, so every role is checked against what the app paints.
jest.mock('@/shared/theme', () => {
  const { DARK_THEME: dark, LIGHT_THEME: light } = jest.requireActual('@/shared/theme/colors');
  return {
    useTheme: () => ({ theme: mockIsDark ? dark : light, isDark: mockIsDark })
  };
});

const flat = (style: unknown) => StyleSheet.flatten(style as never) as Record<string, unknown>;

const renderLink = (props: Partial<React.ComponentProps<typeof AuthLink>> = {}) => {
  const onPress = jest.fn();
  render(
    <AuthLink
      prefixText="Don't have an account?"
      actionText="Create one"
      onPress={onPress}
      testID="create-account-link"
      accessibilityLabel="Create one"
      {...props}
    />
  );
  return { onPress };
};

describe('AuthLink', () => {
  afterEach(() => {
    mockIsDark = false;
  });

  it.each<[string, boolean, Theme]>([
    ['light', false, LIGHT_THEME],
    ['dark', true, DARK_THEME]
  ])(
    'sets the lead-in in body-md muted and the action in body-md semibold link, in %s',
    (_scheme, isDark, theme) => {
      mockIsDark = isDark;
      renderLink();
      const sentence = screen.getByText("Don't have an account? Create one");
      expect(flat(sentence.props.style)).toMatchObject({
        fontFamily: 'Inter',
        fontSize: 15,
        fontWeight: '400',
        color: theme.textSecondary
      });
      const action = screen.getByText('Create one');
      expect(flat(action.props.style)).toMatchObject({
        fontFamily: 'Inter',
        fontSize: 15,
        fontWeight: '600',
        color: theme.link
      });
      // A link outside prose carries no underline.
      expect(flat(action.props.style).textDecorationLine).toBeUndefined();
    }
  );

  it('is the action alone when it has no lead-in', () => {
    renderLink({ prefixText: undefined, actionText: 'Back to Sign In' });
    expect(screen.getByText('Back to Sign In')).toBeTruthy();
    expect(screen.queryByText(/account/)).toBeNull();
  });

  it('is one button, named and hinted as told, at least 48 tall and centred', async () => {
    const { onPress } = renderLink({ accessibilityHint: 'Opens account creation' });
    const link = screen.getByTestId('create-account-link');
    expect(link.props.accessibilityRole).toBe('button');
    expect(link.props.accessibilityLabel).toBe('Create one');
    expect(link.props.accessibilityHint).toBe('Opens account creation');
    expect(flat(link.props.style)).toMatchObject({ minHeight: 48, justifyContent: 'center' });
    expect(flat(link.props.style).alignSelf).toBeUndefined();
    expect(flat(screen.getByText("Don't have an account? Create one").props.style).textAlign).toBe(
      'center'
    );

    await userEvent.press(link);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('sits at the end of its row, sized to its words, when asked', () => {
    renderLink({ prefixText: undefined, actionText: 'Forgot password?', align: 'end' });
    const link = screen.getByTestId('create-account-link');
    expect(flat(link.props.style)).toMatchObject({
      alignSelf: 'flex-end',
      minHeight: 48,
      minWidth: 48
    });
    // The sentence: the link's outermost text.
    const [sentence] = link.findAll((node: { type: unknown }) => node.type === 'Text');
    expect(flat(sentence?.props.style).textAlign).toBe('right');
  });

  // Tap feedback is the design system's 0.98× scale, and only while pressed.
  it('scales to 0.98 while pressed', () => {
    renderLink();
    const link = screen.getByTestId('create-account-link');
    expect(flat(link.props.style).transform).toBeUndefined();

    fireEvent(link, 'pressIn');
    expect(flat(screen.getByTestId('create-account-link').props.style).transform).toEqual([
      { scale: 0.98 }
    ]);

    fireEvent(link, 'pressOut');
    expect(flat(screen.getByTestId('create-account-link').props.style).transform).toBeUndefined();
  });
});

/**
 * AuthBrandBlock — the mark, the heading and the subtitle that lead each auth screen (Story 22.9).
 */
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import { DARK_THEME, LIGHT_THEME, type Theme } from '@/shared/theme/colors';

import { AuthBrandBlock } from './AuthBrandBlock';

let mockIsDark = false;

// The real token values, so every role is checked against what the app paints.
jest.mock('@/shared/theme', () => {
  const { DARK_THEME: dark, LIGHT_THEME: light } = jest.requireActual('@/shared/theme/colors');
  return {
    useTheme: () => ({ theme: mockIsDark ? dark : light, isDark: mockIsDark })
  };
});

const flat = (style: unknown) => StyleSheet.flatten(style as never) as Record<string, unknown>;

const renderBlock = (props: Partial<React.ComponentProps<typeof AuthBrandBlock>> = {}) =>
  render(
    <AuthBrandBlock
      heading="Welcome Back"
      subtitle="Sign in to sync your loyalty cards across devices"
      headingTestID="sign-in-title"
      subtitleTestID="sign-in-subtitle"
      {...props}
    />
  );

describe('AuthBrandBlock', () => {
  afterEach(() => {
    mockIsDark = false;
  });

  it('draws the mark, then the heading, then the subtitle', () => {
    renderBlock();
    const tree = JSON.stringify(screen.toJSON());
    const mark = tree.indexOf('"auth-app-icon-circle"');
    expect(mark).toBeGreaterThan(-1);
    expect(mark).toBeLessThan(tree.indexOf('"sign-in-title"'));
    expect(tree.indexOf('"sign-in-title"')).toBeLessThan(tree.indexOf('"sign-in-subtitle"'));
    expect(screen.getByTestId('auth-app-icon')).toBeTruthy();
  });

  it.each<[string, boolean, Theme]>([
    ['light', false, LIGHT_THEME],
    ['dark', true, DARK_THEME]
  ])(
    'sets the heading in headline-md and the subtitle in body-md muted, in %s',
    (_s, dark, theme) => {
      mockIsDark = dark;
      renderBlock();
      const heading = screen.getByTestId('sign-in-title');
      expect(heading.props.accessibilityRole).toBe('header');
      expect(flat(heading.props.style)).toMatchObject({
        fontFamily: 'Space Grotesk',
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        color: theme.textPrimary
      });
      expect(flat(screen.getByTestId('sign-in-subtitle').props.style)).toMatchObject({
        fontFamily: 'Inter',
        fontSize: 15,
        fontWeight: '400',
        textAlign: 'center',
        marginTop: 8,
        color: theme.textSecondary
      });
    }
  );

  // Large text: both wrap rather than clipping.
  it('lets the heading and the subtitle wrap', () => {
    renderBlock();
    expect(screen.getByTestId('sign-in-title').props.numberOfLines).toBeUndefined();
    expect(screen.getByTestId('sign-in-subtitle').props.numberOfLines).toBeUndefined();
  });

  // Frame D: the address in body-md semibold ink, within the one sentence, whose words stay.
  it.each<[string, boolean, Theme]>([
    ['light', false, LIGHT_THEME],
    ['dark', true, DARK_THEME]
  ])('sets an emphasised part apart within the sentence, in %s', (_s, dark, theme) => {
    mockIsDark = dark;
    renderBlock({
      subtitle: 'We sent an 8-digit code to you@example.com',
      emphasis: 'you@example.com'
    });
    // One sentence, the subtitle, holding the address as a part of its own.
    expect(screen.getByText('We sent an 8-digit code to you@example.com').props.testID).toBe(
      'sign-in-subtitle'
    );
    const address = screen.getByText('you@example.com');
    expect(address.props.testID).toBeUndefined();
    expect(flat(address.props.style)).toMatchObject({
      fontSize: 15,
      fontWeight: '600',
      color: theme.textPrimary
    });
  });

  it('sets nothing apart when the emphasis is not in the sentence', () => {
    renderBlock({ emphasis: 'someone@else.com' });
    expect(screen.getByTestId('sign-in-subtitle').props.children).toBe(
      'Sign in to sync your loyalty cards across devices'
    );
  });
});

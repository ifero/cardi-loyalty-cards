/**
 * RequestErrorBanner — a failed request, in one banner for the submission (Story 22.6).
 *
 * Rendered through the real `StoryDecorator` stack, because the fill and the error colour flip with
 * the scheme and only the real `ThemeProvider` flips them.
 */
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { AccessibilityInfo, Platform, StyleSheet } from 'react-native';

import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { RequestErrorBanner } from './RequestErrorBanner';

type Scheme = 'light' | 'dark';

/** `body-md`: Inter 15 / 22, regular. */
const TYPOGRAPHY_BODY_MD = {
  fontFamily: 'Inter',
  fontSize: 15,
  lineHeight: 22,
  fontWeight: '400'
};

const banner = (message: string, scheme: Scheme = 'light') => (
  <StoryDecorator theme={scheme}>
    <RequestErrorBanner message={message} testID="banner" />
  </StoryDecorator>
);

const flat = (node: { props: { style: unknown } }) =>
  StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;

describe('RequestErrorBanner', () => {
  it('carries the message', () => {
    render(banner('Failed to add card'));
    expect(screen.getByText('Failed to add card')).toBeTruthy();
  });

  it.each<[Scheme, typeof LIGHT_THEME | typeof DARK_THEME]>([
    ['light', LIGHT_THEME],
    ['dark', DARK_THEME]
  ])(
    'is a surface card with a 1pt error outline and its message in the error colour, in %s',
    (scheme, roles) => {
      render(banner('Failed to add card', scheme));

      expect(flat(screen.getByTestId('banner'))).toMatchObject({
        backgroundColor: roles.surface,
        borderColor: roles.error,
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        width: '100%'
      });
      expect(flat(screen.getByText('Failed to add card'))).toMatchObject({
        ...TYPOGRAPHY_BODY_MD,
        color: roles.error
      });
    }
  );

  // At the largest text size the banner grows rather than clips: the sentence takes the lines it
  // needs and the card the height. Jest does no layout, so this pins the mechanism.
  it('grows with its sentence rather than clipping it', () => {
    render(banner('Failed to add card'));

    expect(screen.getByText('Failed to add card').props.numberOfLines).toBeUndefined();
    const card = flat(screen.getByTestId('banner'));
    expect(card).not.toHaveProperty('height');
    expect(card).not.toHaveProperty('maxHeight');
    expect(card).not.toHaveProperty('overflow');
  });

  // No tint, no icon and no dismiss: the outline and the sentence are the whole message.
  it('draws nothing but the sentence', () => {
    render(banner('Failed to add card'));
    const root = screen.getByTestId('banner');
    expect(root.children).toHaveLength(1);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('is an alert, and a polite live region for Android', () => {
    render(banner('Failed to add card'));
    const root = screen.getByTestId('banner');
    expect(root.props.accessibilityRole).toBe('alert');
    expect(root.props.accessibilityLiveRegion).toBe('polite');
  });

  // Queued on iOS, so it waits behind an announcement in progress rather than cutting it off.
  describe('the announcement', () => {
    const announce = AccessibilityInfo.announceForAccessibilityWithOptions as jest.Mock;
    const interrupting = AccessibilityInfo.announceForAccessibility as jest.Mock;

    it('is announced on iOS when it appears and when its message changes, queued', () => {
      const platform = jest.replaceProperty(Platform, 'OS', 'ios');
      try {
        const view = render(banner('Failed to add card'));
        expect(announce).toHaveBeenCalledTimes(1);
        expect(announce).toHaveBeenLastCalledWith('Failed to add card', { queue: true });

        view.rerender(banner('Failed to add card'));
        expect(announce).toHaveBeenCalledTimes(1);

        view.rerender(banner('Failed to update card'));
        expect(announce).toHaveBeenCalledTimes(2);
        expect(announce).toHaveBeenLastCalledWith('Failed to update card', { queue: true });
        expect(interrupting).not.toHaveBeenCalled();
      } finally {
        platform.restore();
      }
    });

    it('leaves Android to its live region', () => {
      const platform = jest.replaceProperty(Platform, 'OS', 'android');
      try {
        render(banner('Failed to add card'));
        expect(announce).not.toHaveBeenCalled();
        expect(interrupting).not.toHaveBeenCalled();
      } finally {
        platform.restore();
      }
    });
  });
});

/**
 * InlineScanButton Component Tests
 * Story 13.4: Restyle Add Card Flow (AC6)
 * Story 22.6: The form frame's scan button
 *
 * Rendered through the real `StoryDecorator` stack, because the fill, the outline and the glyph are
 * theme roles and only the real `ThemeProvider` flips them.
 */

import { render, screen, fireEvent, userEvent } from '@testing-library/react-native';
import Camera from 'lucide-react-native/icons/camera';
import React from 'react';
import { StyleSheet } from 'react-native';

import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { InlineScanButton } from './InlineScanButton';

type Scheme = 'light' | 'dark';

const renderButton = (onPress: () => void = jest.fn(), scheme: Scheme = 'light') =>
  render(
    <StoryDecorator theme={scheme}>
      <InlineScanButton onPress={onPress} />
    </StoryDecorator>
  );

const flat = () =>
  StyleSheet.flatten(screen.getByTestId('inline-scan-button').props.style) as Record<
    string,
    unknown
  >;

/** The glyph is decorative — the button carries the name — so lucide hides it. */
const icon = () => screen.getByTestId('inline-scan-button-icon', { includeHiddenElements: true });

describe('InlineScanButton', () => {
  it('renders with default testID', () => {
    renderButton();
    expect(screen.getByTestId('inline-scan-button')).toBeTruthy();
  });

  // Pressed through the button's own responder: `fireEvent.press` would climb to
  // `InlineScanButton`'s `onPress` prop and pass even if the Pressable lost it.
  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    renderButton(onPress);
    await userEvent.press(screen.getByTestId('inline-scan-button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('has correct accessibility attributes', () => {
    renderButton();
    const button = screen.getByTestId('inline-scan-button');
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toBe('Scan barcode with camera');
  });

  it.each<[Scheme, typeof LIGHT_THEME | typeof DARK_THEME]>([
    ['light', LIGHT_THEME],
    ['dark', DARK_THEME]
  ])(
    'is the frame’s 48pt square: a surface fill in a 1pt border, at 12pt, in %s',
    (scheme, roles) => {
      renderButton(jest.fn(), scheme);
      expect(flat()).toMatchObject({
        width: 48,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: roles.surface,
        borderColor: roles.border
      });
    }
  );

  it.each<[Scheme, string]>([
    ['light', LIGHT_THEME.textPrimary],
    ['dark', DARK_THEME.textPrimary]
  ])('draws Lucide camera at 24 / 1.5 in textPrimary, in %s', (scheme, hex) => {
    renderButton(jest.fn(), scheme);
    expect(screen.UNSAFE_getByType(Camera)).toBeTruthy();
    expect(icon().props).toMatchObject({
      width: 24,
      height: 24,
      stroke: hex,
      strokeWidth: 1.5
    });
  });

  // The 0.98× press replaced the 0.6 opacity dip, which the design system does not draw.
  it('scales to 0.98 while pressed, never dimming', () => {
    renderButton();
    const button = screen.getByTestId('inline-scan-button');

    expect(flat().transform).toBeUndefined();
    fireEvent(button, 'pressIn');
    expect(flat().transform).toEqual([{ scale: 0.98 }]);
    expect(flat().opacity).toBeUndefined();
    fireEvent(button, 'pressOut');
    expect(flat().transform).toBeUndefined();
  });

  // At 48pt the target is already the minimum, and a slop would take taps from the input beside it.
  it('takes no hit slop', () => {
    renderButton();
    expect(screen.getByTestId('inline-scan-button').props.hitSlop).toBeUndefined();
  });
});

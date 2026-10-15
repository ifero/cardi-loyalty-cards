/**
 * HeaderIconButton — the header's icon button (Stories 22.2, 22.3; moved to `shared/` in 22.6).
 *
 * Rendered through the real `StoryDecorator`, because the default glyph colour is the scheme's
 * `textPrimary` and only the real `ThemeProvider` flips it (ink in light, cream in dark).
 */
import { readFileSync } from 'fs';
import { dirname, relative } from 'path';

import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Star from 'lucide-react-native/icons/star';
import React from 'react';
import { StyleSheet } from 'react-native';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { HeaderIconButton } from './HeaderIconButton';

type Scheme = 'light' | 'dark';
type ButtonProps = React.ComponentProps<typeof HeaderIconButton>;

const renderButton = (props: Partial<ButtonProps> = {}, scheme: Scheme = 'light') => {
  const onPress = props.onPress ?? jest.fn();
  render(
    <StoryDecorator theme={scheme}>
      <HeaderIconButton
        icon={ChevronLeft}
        label="Go back"
        testID="button"
        {...props}
        onPress={onPress}
      />
    </StoryDecorator>
  );
  return { onPress };
};

// The icon is decorative — the button carries the name — so lucide hides it from assistive
// technology, and the query has to look past that.
const icon = () => screen.getByTestId('button-icon', { includeHiddenElements: true });

describe('HeaderIconButton', () => {
  // Pressed through the button's own responder: `fireEvent.press` would climb to
  // `HeaderIconButton`'s `onPress` prop and pass even if the Pressable lost it.
  it('is a button named by its label that calls onPress', async () => {
    const { onPress } = renderButton();
    const button = screen.getByLabelText('Go back');
    expect(button.props.accessibilityRole).toBe('button');

    await userEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is a 48 × 48 touch target', () => {
    renderButton();
    expect(StyleSheet.flatten(screen.getByTestId('button').props.style)).toMatchObject({
      width: 48,
      height: 48
    });
  });

  it('draws the icon it is given', () => {
    renderButton({ icon: Star });
    expect(screen.UNSAFE_getByType(Star)).toBeTruthy();
    expect(screen.UNSAFE_queryByType(ChevronLeft)).toBeNull();
  });

  it.each<[Scheme, string]>([
    ['light', '#181824'],
    ['dark', '#F0F0E8']
  ])('defaults to a 24pt outline at a 1.5 stroke in textPrimary in %s', (scheme, hex) => {
    renderButton({}, scheme);
    expect(icon().props).toMatchObject({
      width: 24,
      height: 24,
      fill: 'none',
      stroke: hex,
      strokeWidth: 1.5
    });
  });

  it('takes the colour and the fill it is given', () => {
    renderButton({ icon: Star, color: '#FCCC0C', fill: '#FCCC0C' });
    expect(icon().props).toMatchObject({ stroke: '#FCCC0C', fill: '#FCCC0C' });
  });

  // Lucide spreads an explicit `undefined` over its own `none`, and the glyph then fills black.
  it('keeps an outline when the fill is passed as undefined', () => {
    renderButton({ icon: Star, fill: undefined });
    expect(icon().props.fill).toBe('none');
  });

  it('keeps the icon out of what a screen reader announces', () => {
    renderButton();
    expect(icon().props['aria-hidden']).toBe('true');
  });

  it('reports the state it is given, and refuses presses while disabled', () => {
    const { onPress } = renderButton({ disabled: true, accessibilityState: { selected: true } });
    const button = screen.getByTestId('button');

    expect(button.props.accessibilityState).toMatchObject({ selected: true, disabled: true });
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  // The design system's tap feedback: a 0.98× scale while held, back to rest on release.
  it('scales to 0.98 while pressed and back when released', () => {
    renderButton();
    const button = screen.getByTestId('button');
    const scale = () => StyleSheet.flatten(button.props.style).transform;

    expect(scale()).toBeUndefined();
    fireEvent(button, 'pressIn');
    expect(scale()).toEqual([{ scale: 0.98 }]);
    fireEvent(button, 'pressOut');
    expect(scale()).toBeUndefined();
  });
});

/**
 * Everything drawn inside the NATIVE header must keep React Native's own `Pressable`: the Unistyles
 * Babel plugin's remapped one re-binds the native view on every press, a visible flicker inside
 * the bar. The plugin processes every file whose path contains `<root>/app` and every file that
 * imports `react-native-unistyles` in any form, so this file must stay outside both. Its own
 * comments may name the package; only an import, a re-export or a require counts. The native
 * header's other buttons are guarded the same way beside them (`HomeHeaderButtons.test.tsx`).
 */
describe('HeaderIconButton', () => {
  it('stays outside what the Unistyles Babel plugin processes', () => {
    const subject = require.resolve('./HeaderIconButton');
    const repoRoot = dirname(require.resolve('@/package.json'));

    // `^app`, not `^app/`: the plugin tests the path with `includes('<root>/app')`, a prefix.
    expect(relative(repoRoot, subject)).not.toMatch(/^app/);
    expect(readFileSync(subject, 'utf8')).not.toMatch(
      /(?:\bfrom|\bimport|\brequire)\s*\(?\s*['"]react-native-unistyles/
    );
  });
});

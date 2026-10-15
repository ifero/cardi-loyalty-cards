/**
 * ColorPicker — the app's one card-colour picker (Story 22.6, from the form frame).
 *
 * Rendered through the real `StoryDecorator` stack, because the selection ring and its gap are
 * theme roles and only the real `ThemeProvider` flips them (ink ring on cream in light, beam ring
 * on black in dark).
 */
import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import { CARD_COLOR_KEYS, type CardColor } from '@/core/schemas';

import { CARD_COLORS, DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';
import { TOUCH_TARGET } from '@/shared/theme/spacing';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { COLOR_PICKER_ORDER, ColorPicker } from './ColorPicker';

type Scheme = 'light' | 'dark';

const renderPicker = (
  value: CardColor = 'blue',
  scheme: Scheme = 'light',
  onChange: (color: CardColor) => void = jest.fn()
) =>
  render(
    <StoryDecorator theme={scheme}>
      <ColorPicker value={value} onChange={onChange} testID="picker" />
    </StoryDecorator>
  );

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

/** The check is decorative — the swatch carries the name — so lucide hides it from assistive tech. */
const check = (color: CardColor) =>
  screen.queryByTestId(`picker-${color}-check`, { includeHiddenElements: true });

describe('ColorPicker', () => {
  // The logo's bars, left to right: red, deep blue, azure, green, yellow.
  it('lays the swatches out in the logo’s bar order', () => {
    expect(COLOR_PICKER_ORDER).toEqual(['red', 'blue', 'grey', 'green', 'orange']);

    renderPicker();
    const row = screen.getByTestId('picker');
    expect(
      row.children.map((child: { props: { testID?: string } } | string) =>
        typeof child === 'string' ? child : child.props.testID
      )
    ).toEqual(['picker-red', 'picker-blue', 'picker-grey', 'picker-green', 'picker-orange']);
  });

  // A reordering of the frozen keys, never a fork of them: same members, each exactly once.
  it('is a permutation of CARD_COLOR_KEYS', () => {
    expect([...COLOR_PICKER_ORDER].sort()).toEqual([...CARD_COLOR_KEYS].sort());
    expect(new Set(COLOR_PICKER_ORDER).size).toBe(CARD_COLOR_KEYS.length);
  });

  // Pressed through the swatch's own responder, as a finger does: `fireEvent.press` climbs to the
  // nearest `onPress`, `Swatch`'s own prop, and would pass with the Pressable unwired.
  it('calls onChange with the swatch pressed', async () => {
    const onChange = jest.fn();
    renderPicker('blue', 'light', onChange);

    await userEvent.press(screen.getByTestId('picker-red'));
    expect(onChange).toHaveBeenCalledWith('red');
  });

  it('draws each swatch as a 48pt disc in its accent, spread across the width', () => {
    renderPicker();

    for (const color of COLOR_PICKER_ORDER) {
      expect(flat(`picker-${color}`)).toMatchObject({
        width: TOUCH_TARGET.min,
        height: TOUCH_TARGET.min,
        borderRadius: TOUCH_TARGET.min / 2,
        backgroundColor: CARD_COLORS[color],
        // The selected swatch's check sits at the disc's centre, not its top-left corner.
        alignItems: 'center',
        justifyContent: 'center'
      });
    }
    const row = flat('picker');
    expect(row.flexDirection).toBe('row');
    expect(row.justifyContent).toBe('space-between');
    expect(row.gap).toBeUndefined();
  });

  describe('the selection', () => {
    it('marks the selected swatch, and only it', () => {
      renderPicker('green');

      expect(screen.getByTestId('picker-green').props.accessibilityState.selected).toBe(true);
      expect(screen.getByTestId('picker-red').props.accessibilityState.selected).toBe(false);
      expect(check('green')).toBeTruthy();
      expect(check('red')).toBeNull();
      expect(screen.queryByTestId('picker-red-ring')).toBeNull();
    });

    it.each<[Scheme, string, string]>([
      ['light', LIGHT_THEME.primary, LIGHT_THEME.background],
      ['dark', DARK_THEME.primary, DARK_THEME.background]
    ])(
      'rings it 2pt in primary, held off the disc by a 2pt gap in background, in %s',
      (scheme, primary, background) => {
        renderPicker('blue', scheme);

        // Outside the disc, so the disc itself stays the full 48pt.
        expect(flat('picker-blue-gap')).toMatchObject({
          position: 'absolute',
          top: -2,
          right: -2,
          bottom: -2,
          left: -2,
          borderWidth: 2,
          borderRadius: TOUCH_TARGET.min / 2 + 2,
          borderColor: background
        });
        expect(flat('picker-blue-ring')).toMatchObject({
          position: 'absolute',
          top: -4,
          right: -4,
          bottom: -4,
          left: -4,
          borderWidth: 2,
          borderRadius: TOUCH_TARGET.min / 2 + 4,
          borderColor: primary
        });
        expect(flat('picker-blue')).toMatchObject({
          width: TOUCH_TARGET.min,
          height: TOUCH_TARGET.min
        });
      }
    );

    // Lucide `check` at 20 / 3 in the accent's contrast foreground: white on the dark accents, and
    // ink on yellow, where the frame's white is 1.52:1.
    it.each<[CardColor, string]>([
      ['red', '#FFFFFF'],
      ['blue', '#FFFFFF'],
      ['grey', '#FFFFFF'],
      ['green', '#FFFFFF'],
      ['orange', '#181824']
    ])('checks %s in %s, at 20 with a 3 stroke', (color, foreground) => {
      renderPicker(color);
      expect(check(color)?.props).toMatchObject({
        width: 20,
        height: 20,
        stroke: foreground,
        strokeWidth: 3
      });
    });
  });

  // The design system's tap feedback: a 0.98× scale while held, back to rest on release.
  it('scales a swatch to 0.98 while pressed and back when released', () => {
    renderPicker();
    const swatch = screen.getByTestId('picker-red');

    expect(flat('picker-red').transform).toBeUndefined();
    fireEvent(swatch, 'pressIn');
    expect(flat('picker-red').transform).toEqual([{ scale: 0.98 }]);
    fireEvent(swatch, 'pressOut');
    expect(flat('picker-red').transform).toBeUndefined();
  });

  describe('accessibility — unchanged since Story 21.2a', () => {
    // The labels describe the SWATCH, not the frozen key behind it: the `orange` key renders beam
    // yellow and the `grey` key renders azure, so announcing them by key would mislead.
    it('names each swatch by the colour it draws', () => {
      renderPicker('grey');

      expect(screen.getByLabelText('Red color')).toBeTruthy();
      expect(screen.getByLabelText('Deep blue color')).toBeTruthy();
      expect(screen.getByLabelText('Azure color, selected')).toBeTruthy();
      expect(screen.getByLabelText('Green color')).toBeTruthy();
      expect(screen.getByLabelText('Yellow color')).toBeTruthy();
    });

    it('makes every swatch a button', () => {
      renderPicker();
      for (const color of COLOR_PICKER_ORDER) {
        expect(screen.getByTestId(`picker-${color}`).props.accessibilityRole).toBe('button');
      }
    });
  });

  it('names its swatches from the default testID when given none', () => {
    render(
      <StoryDecorator>
        <ColorPicker value="blue" onChange={jest.fn()} />
      </StoryDecorator>
    );
    expect(screen.getByTestId('color-picker')).toBeTruthy();
    expect(screen.getByTestId('color-picker-blue')).toBeTruthy();
  });
});

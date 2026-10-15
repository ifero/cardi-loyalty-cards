/**
 * The header's icon button
 * Story 22.2: Wallet — Home's `+` and gear
 * Story 22.3: Card Detail — the back chevron and the favourite star
 * Story 22.6: The form pattern — moved here from `features/cards`, so `FormScreen`'s back can be one
 *
 * A 48 × 48 target holding a 24pt Lucide icon at a 1.5 stroke (`cardi-design-system.md` § _Icons_),
 * acknowledging a press with the 0.98× scale (§ _Elevation_). Every screen that draws its own header
 * buttons draws them with this one.
 *
 * Some render inside the NATIVE header, so this file deliberately imports nothing from
 * `react-native-unistyles` and lives outside `app/`. Either would make the Unistyles Babel plugin
 * swap React Native's `Pressable` for its own, which re-binds the native view on every press — a
 * visible flicker inside the header bar. The platform's own button treatment (on iOS 26, the
 * system's glass) is left exactly as the OS draws it.
 */

import type { LucideIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, type AccessibilityState } from 'react-native';

import { useTheme } from '@/shared/theme';
import { TOUCH_TARGET } from '@/shared/theme/spacing';

/** The design system's icon: 24pt, drawn at a 1.5 stroke (§ _Icons_). */
const ICON_SIZE = 24;
const ICON_STROKE_WIDTH = 1.5;

/** Tap feedback — the design system's 0.98× scale, never a shadow bloom (§ _Elevation_). */
const PRESSED_SCALE = 0.98;

type HeaderIconButtonProps = {
  icon: LucideIcon;
  /** The button's whole name for assistive technology: the icon itself is decorative. */
  label: string;
  onPress: () => void;
  testID: string;
  /** The glyph's colour. Defaults to `textPrimary`: ink in light, cream in dark. */
  color?: string;
  /**
   * The glyph's fill, for a state an outline cannot show (a favourited star). Defaults to `none`,
   * and is ALWAYS handed to the icon: Lucide spreads an explicit `undefined` over its own `none`,
   * and the glyph then fills black.
   */
  fill?: string;
  disabled?: boolean;
  /** State beyond `disabled`, which `Pressable` adds itself — e.g. the favourite star's `selected`. */
  accessibilityState?: AccessibilityState;
};

export const HeaderIconButton = ({
  icon: Icon,
  label,
  onPress,
  testID,
  color,
  fill = 'none',
  disabled,
  accessibilityState
}: HeaderIconButtonProps) => {
  const { theme } = useTheme();
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={accessibilityState}
      style={[styles.button, isPressed ? styles.pressed : null]}
    >
      <Icon
        testID={`${testID}-icon`}
        size={ICON_SIZE}
        strokeWidth={ICON_STROKE_WIDTH}
        color={color ?? theme.textPrimary}
        fill={fill}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: TOUCH_TARGET.min,
    height: TOUCH_TARGET.min,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pressed: {
    transform: [{ scale: PRESSED_SCALE }]
  }
});

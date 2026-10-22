import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/shared/theme';
import { TOUCH_TARGET } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

/** Tap feedback — the design system's 0.98× scale, as the system's text rows take it (§ _Elevation_). */
const PRESSED_SCALE = 0.98;

type AuthLinkProps = {
  /** The lead-in, muted: "Don't have an account?". A solo link is the action alone. */
  prefixText?: string;
  /** The link itself: "Create one". */
  actionText: string;
  onPress: () => void;
  testID: string;
  accessibilityLabel: string;
  accessibilityHint?: string;
  /**
   * `center` (the default) is the footer's way out, across the row; `end` is a solo link at the
   * end of its row, sized to its words: "Forgot password?" under the password field.
   */
  align?: 'center' | 'end';
};

/**
 * An auth screen's text link (`cardi-design-system.md` § _Authentication_, Story 22.9): the lead-in
 * in `body-md` muted, then the action in `body-md` semibold in `link` — ink in light, beam in dark —
 * with no underline, since it is not inside prose. One button, at least 48 tall, named as the
 * caller says. Its words wrap under large text rather than clipping, and a press scales it to 0.98.
 *
 * Like the shared primitives, it styles with React Native's `StyleSheet` and the theme's colours,
 * and imports nothing from `react-native-unistyles`, so its `Pressable` stays React Native's own.
 */
export const AuthLink = ({
  prefixText,
  actionText,
  onPress,
  testID,
  accessibilityLabel,
  accessibilityHint,
  align = 'center'
}: AuthLinkProps) => {
  const { theme } = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  const atEnd = align === 'end';

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={[styles.row, atEnd ? styles.rowAtEnd : null, isPressed ? styles.pressed : null]}
    >
      <Text
        style={[
          styles.text,
          atEnd ? styles.textAtEnd : styles.textCentred,
          { color: theme.textSecondary }
        ]}
      >
        {prefixText ? `${prefixText} ` : null}
        <Text style={[styles.action, { color: theme.link }]}>{actionText}</Text>
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    minHeight: TOUCH_TARGET.min,
    justifyContent: 'center'
  },
  // Sized to its words at the row's end, so a press beside it is not a press on it.
  rowAtEnd: {
    alignSelf: 'flex-end',
    minWidth: TOUCH_TARGET.min
  },
  pressed: {
    transform: [{ scale: PRESSED_SCALE }]
  },
  text: {
    ...TYPOGRAPHY.bodyMd
  },
  textCentred: {
    textAlign: 'center'
  },
  textAtEnd: {
    textAlign: 'right'
  },
  action: {
    ...TYPOGRAPHY.bodyMdStrong
  }
});

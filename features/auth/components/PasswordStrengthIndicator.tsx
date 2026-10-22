import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { SPACING } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

export type PasswordStrength = 'weak' | 'fair' | 'strong';

const hasSpecialCharacter = (value: string) => /[^a-zA-Z0-9]/.test(value);
const hasNumber = (value: string) => /\d/.test(value);
const hasLetter = (value: string) => /[a-zA-Z]/.test(value);

export const getPasswordStrength = (password: string): PasswordStrength => {
  if (password.length < 8 || !hasLetter(password) || !hasNumber(password)) {
    return 'weak';
  }

  if (password.length >= 12 && hasSpecialCharacter(password)) {
    return 'strong';
  }

  return 'fair';
};

/** The meter's three segments, and how many each strength fills. */
const SEGMENTS = [0, 1, 2] as const;
const FILLED_SEGMENTS: Record<PasswordStrength, number> = { weak: 1, fair: 2, strong: 3 };

/** Each segment is 4pt tall and fully rounded, 4pt from the next. */
const SEGMENT_HEIGHT = 4;

type PasswordStrengthIndicatorProps = {
  password: string;
  testID?: string;
};

/**
 * The strength meter (auth frames B and E, Story 22.9). It COUNTS rather than judges: a track of
 * three equal segments, of which weak fills one, fair two and strong three, so the fill spans a
 * third, two thirds or all of the track. Filled segments are `textPrimary` and empty ones `border`
 * at every strength — the palette has no "good" colour, and the meter needs none. The word follows
 * 8pt after the track in `label-bold`, the chrome tier, also in `textPrimary`. Assistive technology
 * reads it as one element: "Password strength: Fair". Nothing animates.
 *
 * It draws nothing for an empty password.
 */
export const PasswordStrengthIndicator = ({
  password,
  testID = 'password-strength-indicator'
}: PasswordStrengthIndicatorProps) => {
  // Hooks must run before any early return: NewPasswordScreen renders this
  // component unconditionally, so `password` goes '' -> non-empty on the first
  // keystroke. With the early return above the hooks, the empty render
  // allocated zero hooks, which left `fiber.memoizedState` null and made React
  // pick the *mount* dispatcher on the following render instead of throwing
  // "Rendered more hooks than during the previous render". That masked the
  // violation but silently remounted useTranslation's language subscription on
  // every empty<->non-empty transition, and any hook added above the return
  // would have turned it into a hard crash.
  const { theme } = useTheme();
  const { t } = useTranslation();

  if (!password.trim()) {
    return null;
  }

  const strength = getPasswordStrength(password);
  const filled = FILLED_SEGMENTS[strength];
  const word = t(`auth.passwordStrength.${strength}`);

  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={t('auth.passwordStrength.accessibilityLabel', { strength: word })}
      style={styles.meter}
    >
      <View testID={`${testID}-track`} style={styles.track}>
        {SEGMENTS.map((segment) => (
          <View
            key={segment}
            testID={`${testID}-segment-${segment}`}
            style={[
              styles.segment,
              { backgroundColor: segment < filled ? theme.textPrimary : theme.border }
            ]}
          />
        ))}
      </View>
      <Text testID={`${testID}-label`} style={[styles.word, { color: theme.textPrimary }]}>
        {word}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  meter: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm
  },
  track: {
    flex: 1,
    flexDirection: 'row',
    gap: SPACING.xs
  },
  segment: {
    flex: 1,
    height: SEGMENT_HEIGHT,
    borderRadius: SEGMENT_HEIGHT / 2
  },
  // Under large text the word wraps beside the track rather than pushing it off the row.
  word: {
    ...TYPOGRAPHY.labelBold,
    flexShrink: 1
  }
});

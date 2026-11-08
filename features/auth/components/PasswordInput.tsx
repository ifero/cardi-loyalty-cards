import Eye from 'lucide-react-native/icons/eye';
import EyeOff from 'lucide-react-native/icons/eye-off';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, type TextInput, View } from 'react-native';

import { TextField } from '@/shared/components/ui';
import { useTheme } from '@/shared/theme';
import { SPACING, TOUCH_TARGET } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

/** The eye: Lucide at the icon's 24 / 1.5, as the auth frames draw it on its 48pt target. */
const EYE_SIZE = 24;
const EYE_STROKE_WIDTH = 1.5;

/** Tap feedback — the design system's 0.98× scale (§ _Elevation_). */
const PRESSED_SCALE = 0.98;

type PasswordInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  error?: string;
  /**
   * A standing caption under the field — the rule a new password must meet. It shows from the
   * first render, and the field's error takes its place while one shows.
   */
  hint?: string;
  testID: string;
  accessibilityHint?: string;
  onBlur?: () => void;
  autoComplete?: 'password' | 'new-password' | 'current-password';
  /** React 19 passes `ref` as a prop: it reaches the input, so a failed submit can focus it. */
  ref?: React.Ref<TextInput>;
};

/**
 * A password field: a `TextField`, secure until its eye is pressed (Story 22.9). The eye sits at
 * the field's end, inside the box: Lucide `eye` while the password is hidden and `eye-off` while it
 * is shown, at 24 / 1.5 in `textSecondary`, centred in its 48pt target, scaling to 0.98 while
 * pressed. A failed request never reddens it: it errs only through its own message. Given a `hint`,
 * it stands under the field until an error takes its place.
 */
export const PasswordInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  hint,
  testID,
  accessibilityHint,
  onBlur,
  autoComplete = 'password',
  ref
}: PasswordInputProps) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const Icon = isVisible ? EyeOff : Eye;

  const field = (
    <TextField
      ref={ref}
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      error={error}
      secureTextEntry={!isVisible}
      autoComplete={autoComplete}
      autoCapitalize="none"
      autoCorrect={false}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      testID={testID}
      onBlur={onBlur}
      rightAdornment={
        <Pressable
          testID={`${testID}-toggle`}
          onPress={() => setIsVisible((previous) => !previous)}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          accessibilityRole="button"
          accessibilityLabel={
            isVisible ? t('auth.passwordInput.hide') : t('auth.passwordInput.show')
          }
          style={[styles.toggle, isPressed ? styles.pressed : null]}
        >
          <Icon
            testID={`${testID}-toggle-icon`}
            size={EYE_SIZE}
            strokeWidth={EYE_STROKE_WIDTH}
            color={theme.textSecondary}
          />
        </Pressable>
      }
    />
  );

  if (!hint) {
    return field;
  }

  // The caption is the field's error's twin: captionMd, 4pt below the input, in textSecondary. It
  // stays readable by assistive technology: the field's spoken hint is lost when hints are off.
  return (
    <View>
      {field}
      {error ? null : (
        <Text testID={`${testID}-hint`} style={[styles.hint, { color: theme.textSecondary }]}>
          {hint}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  toggle: {
    width: TOUCH_TARGET.min,
    height: TOUCH_TARGET.min,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pressed: {
    transform: [{ scale: PRESSED_SCALE }]
  },
  hint: {
    ...TYPOGRAPHY.captionMd,
    marginTop: SPACING.xs
  }
});

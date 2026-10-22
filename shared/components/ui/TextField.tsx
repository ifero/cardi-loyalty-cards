import React, { useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  Platform,
  ReturnKeyTypeOptions,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { SPACING, TOUCH_TARGET } from '@/shared/theme/spacing';
import { TYPOGRAPHY, inputFont } from '@/shared/theme/typography';

/** The input's side padding, and the room a `rightAdornment` takes on its side (Story 22.6). */
const INPUT_PADDING_X = SPACING.md;
const ADORNMENT_PADDING_RIGHT = 52;

type TextFieldProps = {
  /** Sentence case — the label idiom uppercases it by style (see `FieldLabel`). */
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  /** React 19 passes `ref` as a prop: it reaches the input, so a form library can focus it. */
  ref?: React.Ref<TextInput>;
  placeholder?: string;
  error?: string;
  hasError?: boolean;
  disabled?: boolean;
  testID?: string;
  secureTextEntry?: boolean;
  onBlur?: TextInputProps['onBlur'];
  onFocus?: TextInputProps['onFocus'];
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  autoCorrect?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** A control INSIDE the box, at its right edge — the password field's show/hide toggle. */
  rightAdornment?: React.ReactNode;
  /**
   * A control OUTSIDE the box, 8pt to its right and aligned with it — the card number's scan
   * button. The label spans the whole row above both; the message sits under the input alone.
   */
  trailing?: React.ReactNode;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  containerStyle?: StyleProp<ViewStyle>;
  maxLength?: number;
  /** Shows `length/maxLength` at the end of the label row. Has no effect without `maxLength`. */
  showCharacterCount?: boolean;
  /**
   * Card numbers: the value is set in JetBrains Mono (`monoCode`), so the digits align while
   * someone reads them; the placeholder stays in the body face, as the form frames set it.
   */
  mono?: boolean;
  /**
   * The one-field verification code (auth frame D, Story 22.9): the value in `monoCodeLg`, tracked
   * only once there are digits so that eight are countable at a glance, and the value and the
   * placeholder centred. The placeholder stays in the body face, as a card number's does.
   */
  code?: boolean;
  /** Selects the whole value when the field takes the focus, so a new code replaces the old. */
  selectTextOnFocus?: boolean;
};

type FieldTextProps = {
  children: string;
  testID?: string;
};

/**
 * The form label (`cardi-design-system.md` § _Typography_): `label-bold` in UPPERCASE, ink,
 * always above its field. The capitals are `textTransform`, never the string, so assistive
 * technology reads the words. Exported for fields that are not text inputs — the colour picker,
 * a read-only value — so every field in a form carries the same label.
 */
export const FieldLabel = ({ children, testID }: FieldTextProps) => (
  <Text testID={testID} style={styles.label}>
    {children}
  </Text>
);

/**
 * A field's validation message: `captionMd` in the error colour, 4pt below the input, announced
 * as it appears. Android announces it through the polite live region; iOS has no live region, so
 * the message is announced there when it appears and whenever it changes (Story 22.6) — queued, so
 * two errors raised by one Save are both heard rather than the second cutting off the first.
 */
export const FieldError = ({ children, testID }: FieldTextProps) => {
  useEffect(() => {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibilityWithOptions?.(children, { queue: true });
    }
  }, [children]);

  return (
    <Text testID={testID} accessibilityLiveRegion="polite" style={styles.error}>
      {children}
    </Text>
  );
};

export const TextField = ({
  label,
  value,
  onChangeText,
  ref,
  placeholder,
  error,
  hasError = false,
  disabled = false,
  testID,
  secureTextEntry = false,
  onBlur,
  onFocus,
  keyboardType,
  autoCapitalize,
  autoComplete,
  autoCorrect,
  accessibilityLabel,
  accessibilityHint,
  rightAdornment,
  trailing,
  returnKeyType,
  onSubmitEditing,
  containerStyle,
  maxLength,
  showCharacterCount = false,
  mono = false,
  code = false,
  selectTextOnFocus
}: TextFieldProps) => {
  const { theme } = useUnistyles();
  const [focused, setFocused] = useState(false);

  const state = useMemo(() => {
    if (disabled) return 'disabled';
    if (error || hasError) return 'error';
    if (focused) return 'focused';
    if (value.length > 0) return 'filled';
    return 'default';
  }, [disabled, error, focused, hasError, value.length]);

  const borderColor =
    state === 'error'
      ? theme.colors.error
      : state === 'focused'
        ? theme.colors.primary
        : theme.colors.border;

  const hasAdornment = Boolean(rightAdornment);
  const showCount = showCharacterCount && maxLength !== undefined;

  const input = (
    <>
      <View style={styles.inputWrapper}>
        <TextInput
          ref={ref}
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          editable={!disabled}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={autoCorrect}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityState={{ disabled }}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          maxLength={maxLength}
          selectTextOnFocus={selectTextOnFocus}
          style={[
            styles.input,
            // The value only: an empty mono field shows its placeholder in the body face.
            mono && value.length > 0 ? styles.inputMono : null,
            code ? styles.inputCentred : null,
            code && value.length > 0 ? styles.inputCode : null,
            {
              borderColor,
              backgroundColor: disabled ? theme.colors.backgroundSubtle : theme.colors.surface,
              paddingRight: hasAdornment ? ADORNMENT_PADDING_RIGHT : INPUT_PADDING_X
            }
          ]}
        />
        {hasAdornment ? <View style={styles.adornment}>{rightAdornment}</View> : null}
      </View>
      {error ? <FieldError testID={`${testID}-error`}>{error}</FieldError> : null}
    </>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.labelRow}>
        <FieldLabel>{label}</FieldLabel>
        {showCount ? (
          <Text style={styles.count}>
            {value.length}/{maxLength}
          </Text>
        ) : null}
      </View>
      {trailing ? (
        <View style={styles.trailingRow}>
          <View style={styles.inputColumn}>{input}</View>
          {trailing}
        </View>
      ) : (
        input
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    width: '100%'
  },
  // Under large text a label and its count can outgrow one line: the row wraps, the count drops
  // under the label and keeps the row's end, 8pt clear of it — never off the screen's edge.
  labelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    // The form frame's label-to-control gap (Story 22.6; it was 6, off the grid).
    marginBottom: SPACING.sm
  },
  label: {
    ...TYPOGRAPHY.labelBold,
    color: theme.colors.textPrimary,
    textTransform: 'uppercase'
  },
  count: {
    ...TYPOGRAPHY.captionMd,
    color: theme.colors.textTertiary,
    marginStart: 'auto'
  },
  // Top-aligned, as the frame's row draws it: at the default size the 48pt input and the 48pt
  // control share both edges, and an input grown by large text keeps its top edge on the control's.
  trailingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm
  },
  inputColumn: {
    flex: 1
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center'
  },
  input: {
    // The token itself, as `Button` reads it, so a test can feed an odd one.
    minHeight: TOUCH_TARGET.min,
    borderRadius: 12,
    borderWidth: 1,
    color: theme.colors.textPrimary,
    paddingHorizontal: INPUT_PADDING_X,
    ...inputFont(TYPOGRAPHY.bodyLg)
  },
  inputMono: {
    ...inputFont(TYPOGRAPHY.monoCode)
  },
  inputCentred: {
    textAlign: 'center'
  },
  // The token's tracking comes with its face, so an empty field's placeholder is untracked.
  inputCode: {
    ...inputFont(TYPOGRAPHY.monoCodeLg)
  },
  adornment: {
    position: 'absolute',
    right: 8,
    alignSelf: 'center'
  },
  error: {
    ...TYPOGRAPHY.captionMd,
    color: theme.colors.error,
    marginTop: SPACING.xs
  }
}));

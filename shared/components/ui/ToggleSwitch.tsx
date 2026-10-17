import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { SPACING, TOUCH_TARGET } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

type ToggleSwitchProps = {
  value: boolean;
  onValueChange: (nextValue: boolean) => void;
  disabled?: boolean;
  label?: string;
  testID?: string;
};

export const ToggleSwitch = ({
  value,
  onValueChange,
  disabled = false,
  label,
  testID
}: ToggleSwitchProps) => {
  const { theme } = useTheme();

  return (
    <Pressable
      testID={testID}
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={{
        minHeight: TOUCH_TARGET.min,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SPACING.smMd,
        opacity: disabled ? 0.6 : 1
      }}
    >
      {/* Shrinks, and wraps, beside the track: under large text a long label would otherwise push
          the track off the row (Story 22.7). */}
      {label ? (
        <Text
          testID={testID ? `${testID}-label` : undefined}
          style={{ ...TYPOGRAPHY.bodyLg, color: theme.textPrimary, flexShrink: 1 }}
        >
          {label}
        </Text>
      ) : null}
      <View
        testID={`${testID}-track`}
        style={{
          width: 52,
          height: 32,
          flexShrink: 0,
          borderRadius: 999,
          borderWidth: 2,
          borderColor: value ? theme.primary : theme.borderStrong,
          // 10%, not 20%: over a dark ground a 20% beam wash composites to
          // `#463C1F` (saturation 56%) — a dark olive, which the system forbids.
          // At 10% the composite is a warm near-neutral (saturation 28%) and
          // reads as a tonal layer, which is what the track is. The knob and the
          // border carry the on-state in beam at its true value.
          backgroundColor: value ? `${theme.primary}1A` : theme.surfaceElevated,
          justifyContent: 'center',
          paddingHorizontal: 2
        }}
      >
        <View
          testID={`${testID}-knob`}
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            backgroundColor: value ? theme.primary : theme.textTertiary,
            transform: [{ translateX: value ? 22 : 0 }]
          }}
        />
      </View>
    </Pressable>
  );
};

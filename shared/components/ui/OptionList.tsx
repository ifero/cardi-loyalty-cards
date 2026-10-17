/**
 * The pick-one list (`cardi-design-system.md` § _Settings_, Story 22.7) — settings frame C, inside
 * the shared `BottomSheet`. Choosing an option IS the action, so the list has no buttons: the
 * caller applies the choice and closes the sheet.
 */

import Check from 'lucide-react-native/icons/check';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { LAYOUT, SPACING, TOUCH_TARGET } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

/** The frame's check: 20pt at a 2 stroke, inside a row's text rather than on a target of its own. */
const CHECK_SIZE = 20;
const CHECK_STROKE_WIDTH = 2;

export type OptionListOption<T extends string> = {
  value: T;
  label: string;
  /** The option's name for assistive technology, when it says more than the label. */
  accessibilityLabel?: string;
  testID?: string;
};

type OptionListProps<T extends string> = {
  options: readonly OptionListOption<T>[];
  /** The current choice: it takes the check and reports `selected`. None, when it is not listed. */
  selectedValue?: T;
  onSelect: (value: T) => void;
  /**
   * What follows the last option — Theme's helper — on the sheet's margin. It scrolls with the
   * options, so they take the room first and the selected one shows when the sheet opens.
   */
  footer?: React.ReactNode;
  testID?: string;
};

type OptionRowProps<T extends string> = {
  option: OptionListOption<T>;
  isSelected: boolean;
  onSelect: (value: T) => void;
};

const OptionRow = <T extends string>({ option, isSelected, onSelect }: OptionRowProps<T>) => {
  const { theme } = useTheme();
  // Explicit pressed state rather than a `style={({ pressed }) => …}` callback (AGENTS.md).
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      testID={option.testID}
      onPress={() => onSelect(option.value)}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={option.accessibilityLabel ?? option.label}
      accessibilityState={{ selected: isSelected }}
      style={[
        styles.option,
        {
          borderTopColor: theme.border,
          backgroundColor: isPressed ? theme.surfaceElevated : 'transparent'
        }
      ]}
    >
      <Text style={[styles.label, { color: theme.textPrimary }]}>{option.label}</Text>
      {isSelected ? (
        <Check
          testID={option.testID ? `${option.testID}-check` : undefined}
          size={CHECK_SIZE}
          strokeWidth={CHECK_STROKE_WIDTH}
          color={theme.primary}
        />
      ) : null}
    </Pressable>
  );
};

/**
 * Each option is at least 48, padded 12/24, and runs edge to edge: its rule spans the sheet and its
 * label sits on the sheet's 24 margin, in line with the title. A rule sits above every option and
 * none after the last. The label is `body-lg` and wraps; the selected option takes Lucide `check`
 * in `primary` — ink in light, beam in dark. When the options outgrow the sheet, they scroll, and a
 * footer scrolls with them.
 */
export const OptionList = <T extends string>({
  options,
  selectedValue,
  onSelect,
  footer,
  testID
}: OptionListProps<T>) => (
  <ScrollView testID={testID} style={styles.list} alwaysBounceVertical={false}>
    {options.map((option) => (
      <OptionRow
        key={option.value}
        option={option}
        isSelected={option.value === selectedValue}
        onSelect={onSelect}
      />
    ))}
    {footer ? (
      <View testID={testID ? `${testID}-footer` : undefined} style={styles.footer}>
        {footer}
      </View>
    ) : null}
  </ScrollView>
);

const styles = StyleSheet.create({
  // Edge to edge: the list reaches past the sheet's padding, so the rules span the sheet; a negative
  // margin on a row could not, because the scroll view clips its rows to its own bounds. It never
  // grows, though a scroll view does by default: under Yoga's legacy stretch, which React Native
  // lays out with, a growing child of a height-capped container takes its spare height, and a short
  // list would leave its sheet 80 % tall. It shrinks, and scrolls, when the options do not fit.
  list: {
    flexGrow: 0,
    flexShrink: 1,
    marginHorizontal: -LAYOUT.screenHorizontalMargin
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.smMd,
    minHeight: TOUCH_TARGET.min,
    paddingHorizontal: LAYOUT.screenHorizontalMargin,
    paddingVertical: SPACING.smMd,
    borderTopWidth: 1
  },
  label: {
    ...TYPOGRAPHY.bodyLg,
    flex: 1
  },
  // Back on the sheet's margin, inside a list that runs edge to edge.
  footer: {
    paddingHorizontal: LAYOUT.screenHorizontalMargin
  }
});

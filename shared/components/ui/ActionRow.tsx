import ChevronRight from 'lucide-react-native/icons/chevron-right';
import React from 'react';
import { ActivityIndicator, useWindowDimensions } from 'react-native';
import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useTheme } from '@/shared/theme';
import { SPACING, TOUCH_TARGET } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

/** The design system's chevron for every row (§ _Icons_, Story 22.5): 24pt at a 1.5 stroke. */
const CHEVRON_SIZE = 24;
const CHEVRON_STROKE_WIDTH = 1.5;

/**
 * From this font scale up the value moves under the label. React Native puts iOS's xxxLarge at
 * 1.353 and the first accessibility size at 1.786, so 1.5 is the first of the accessibility sizes.
 */
const STACKED_VALUE_MIN_FONT_SCALE = 1.5;

/**
 * How much faster the value gives way than the label on a crowded line. Yoga shares an overflow out
 * by flex-shrink × width, so at a thousand to one the label shrinks only once the value has nothing
 * left to give, as frame A's CSS has it: a CSS flex item never shrinks below its longest word.
 */
const VALUE_SHRINK_WEIGHT = 1000;

type ActionRowProps = {
  prefix?: React.ReactNode;
  label: string;
  subtitle?: string;
  /**
   * The row's action. Without one the row is information, not a control: no button role, no press,
   * drawn at full strength and read as its label and its value (settings' App Version).
   */
  onPress?: () => void;
  variant?: 'outlined' | 'plain';
  /**
   * Beside the label: one line, ellipsised, at most 46 % of the row, and the first to give way on a
   * crowded line. At the accessibility text sizes it sits under the label and wraps. Announced after
   * the label.
   */
  value?: string;
  disabled?: boolean;
  destructive?: boolean;
  /** Defaults to whether the row has an action: a row that does nothing must not look tappable. */
  showChevron?: boolean;
  /**
   * Busy: the spinner takes the chevron's place, the row keeps its look, ignores presses and is
   * announced busy — never drawn or announced as disabled.
   */
  isLoading?: boolean;
  showBottomBorder?: boolean;
  /** Replaces the label in the row's name. The value is still announced after it. */
  accessibilityLabel?: string;
  testID?: string;
};

/**
 * A row (`cardi-design-system.md` § _Settings_, Story 22.7). A plain row is padded 12/16 with 12
 * between its parts, so a one-line row stays 48; its label wraps rather than clipping, and the row
 * grows with it. At the accessibility text sizes a value moves under its label, where it wraps too,
 * and the chevron stays at the row's end. It takes `surfaceElevated` while held.
 */
export const ActionRow = ({
  prefix,
  label,
  subtitle,
  onPress,
  variant = 'outlined',
  value,
  disabled = false,
  destructive = false,
  showChevron = onPress !== undefined,
  isLoading = false,
  showBottomBorder,
  accessibilityLabel,
  testID
}: ActionRowProps) => {
  const { theme } = useTheme();
  const { fontScale } = useWindowDimensions();
  const [isPressed, setIsPressed] = React.useState(false);
  const isValueStacked = Boolean(value) && fontScale >= STACKED_VALUE_MIN_FONT_SCALE;
  const rowTextColor = destructive ? theme.error : theme.textPrimary;
  const isOutlined = variant === 'outlined';
  const shouldShowBottomBorder = showBottomBorder ?? !isOutlined;
  const hasSubtitle = typeof subtitle === 'string' && subtitle.length > 0;
  const name = value ? `${accessibilityLabel ?? label}, ${value}` : (accessibilityLabel ?? label);

  // Refused here rather than through `disabled`, which would also announce a busy row as dimmed.
  const handlePress = () => {
    if (!isLoading) onPress?.();
  };

  const handlePressIn = () => {
    if (!isLoading) setIsPressed(true);
  };

  const rowStyle = [
    isOutlined ? styles.outlined : styles.plain,
    isOutlined && hasSubtitle ? styles.outlinedWithSubtitle : null,
    {
      borderColor: isOutlined ? theme.border : 'transparent',
      backgroundColor: isPressed
        ? theme.surfaceElevated
        : isOutlined
          ? theme.surface
          : 'transparent'
    },
    disabled ? styles.disabled : null
  ];

  // One line of parts, as frame A's row is one flex line: the icon, the label, the value and the
  // chevron. The value's 46 % is of this whole line, the icon's share included. At the
  // accessibility sizes the value leaves the line for the label's column.
  const content = (
    <>
      <View testID={testID ? `${testID}-content` : undefined} style={styles.content}>
        {prefix ?? null}
        <View testID={testID ? `${testID}-text` : undefined} style={styles.text}>
          <Text style={[styles.label, { color: rowTextColor }]}>{label}</Text>
          {hasSubtitle ? (
            <Text numberOfLines={1} style={[styles.subtitle, { color: theme.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}
          {isValueStacked ? (
            <Text style={[styles.stackedValue, { color: theme.textSecondary }]}>{value}</Text>
          ) : null}
        </View>
        {value && !isValueStacked ? (
          <Text numberOfLines={1} style={[styles.value, { color: theme.textSecondary }]}>
            {value}
          </Text>
        ) : null}
        {isLoading ? (
          // In the chevron's own 24-wide slot, so nothing beside it moves while the row is busy.
          <View testID={testID ? `${testID}-spinner-slot` : undefined} style={styles.spinnerSlot}>
            <ActivityIndicator
              testID={testID ? `${testID}-spinner` : undefined}
              size="small"
              color={theme.primary}
            />
          </View>
        ) : showChevron ? (
          <ChevronRight
            testID={testID ? `${testID}-chevron` : undefined}
            size={CHEVRON_SIZE}
            strokeWidth={CHEVRON_STROKE_WIDTH}
            color={theme.textSecondary}
          />
        ) : null}
      </View>
      {shouldShowBottomBorder ? (
        <View
          testID={testID ? `${testID}-rule` : undefined}
          style={[
            styles.bottomBorder,
            hasSubtitle ? styles.bottomBorderWithSubtitle : null,
            { backgroundColor: theme.border }
          ]}
        />
      ) : null}
    </>
  );

  if (!onPress) {
    return (
      <View testID={testID} accessible accessibilityLabel={name} style={rowStyle}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={() => setIsPressed(false)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ disabled, busy: isLoading }}
      style={rowStyle}
    >
      {content}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  plain: {
    minHeight: TOUCH_TARGET.min,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.smMd
  },
  outlined: {
    minHeight: TOUCH_TARGET.min,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: SPACING.smMd,
    paddingVertical: 6
  },
  outlinedWithSubtitle: {
    paddingVertical: SPACING.sm
  },
  disabled: {
    opacity: 0.6
  },
  // The parts, 12 apart. The label takes what the icon, the value and the chevron leave it.
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.smMd
  },
  // Frame A's `flex: 1 1 auto`: the label grows into the room the value leaves. On a crowded line
  // the value gives way first (`value`), so a short label keeps its words.
  text: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    minWidth: 0
  },
  // No line limit: under large text the label wraps and the row grows, as frame A sets it.
  label: {
    ...TYPOGRAPHY.bodyLg
  },
  subtitle: {
    ...TYPOGRAPHY.captionMd,
    marginTop: 1
  },
  // One line, and never more than 46 % of the row: past that it is cut with an ellipsis. It gives
  // way a thousand times as fast as the label, so it ellipsises before the label breaks a word.
  value: {
    ...TYPOGRAPHY.bodyLg,
    flexShrink: VALUE_SHRINK_WEIGHT,
    maxWidth: '46%'
  },
  // At the accessibility sizes: under the label, in its column, wrapping rather than cut.
  stackedValue: {
    ...TYPOGRAPHY.bodyLg
  },
  spinnerSlot: {
    width: CHEVRON_SIZE,
    alignItems: 'center'
  },
  bottomBorder: {
    height: 1,
    marginTop: SPACING.sm
  },
  bottomBorderWithSubtitle: {
    marginTop: 10
  }
});

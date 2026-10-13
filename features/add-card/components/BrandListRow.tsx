/**
 * BrandListRow
 * Story 22.5: Capture frame A's row, shared by a brand and "Other card"
 *
 * One row of the brand list, inside its section's outlined surface, which draws the rules between
 * rows. 64pt tall — growing rather than clipping under large text — padded 0 16 with a 16pt gap:
 * a 40pt circle, the label — one line at default sizes, wrapping under large text rather than being
 * cut — with an optional subtitle beneath, and a chevron at 24 / 1.5 in `textSecondary`, the size
 * of every other row chevron in the app rather than the frame's drawn 9 × 16. A press scales the
 * row 0.98×.
 */

import ChevronRight from 'lucide-react-native/icons/chevron-right';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { SPACING } from '@/shared/theme/spacing';
import { MONOGRAM_TEXT_PROPS, TYPOGRAPHY } from '@/shared/theme/typography';

/** Frame A's row height. */
const BRAND_LIST_ROW_HEIGHT = 64;

/** The leading circle's diameter. */
const BRAND_LIST_CIRCLE_SIZE = 40;

const CHEVRON_SIZE = 24;
const CHEVRON_STROKE_WIDTH = 1.5;

/** Tap feedback — the design system's 0.98× scale, never a fill or a shadow (§ _Elevation_). */
const PRESSED_SCALE = 0.98;

type BrandListCircleProps = {
  /** The circle's fill: a brand's own hex, never tinted — or, for "Other card", the ground. */
  fill: string;
  /** Takes the 1pt hairline, so a fill close to the surface does not dissolve into it. */
  isOutlined: boolean;
  /** The glyph it carries: a brand's initial, or "+". */
  glyph: string;
  glyphColor: string;
  testID?: string;
};

/**
 * The row's leading circle. Its glyph is a mark sized to the circle, like any avatar initial, so it
 * does not take Dynamic Type: the circle does not grow, and a scaled glyph would only overflow it.
 * The name beside it carries the same information, and that does scale.
 */
export const BrandListCircle = ({
  fill,
  isOutlined,
  glyph,
  glyphColor,
  testID
}: BrandListCircleProps) => {
  const { theme } = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.circle,
        { backgroundColor: fill },
        isOutlined ? { borderWidth: 1, borderColor: theme.border } : null
      ]}
    >
      <Text {...MONOGRAM_TEXT_PROPS} style={[styles.glyph, { color: glyphColor }]}>
        {glyph}
      </Text>
    </View>
  );
};

type BrandListRowProps = {
  /** The leading `BrandListCircle`. */
  circle: React.ReactNode;
  label: string;
  subtitle?: string;
  onPress: () => void;
  accessibilityLabel: string;
  testID?: string;
};

export const BrandListRow = ({
  circle,
  label,
  subtitle,
  onPress,
  accessibilityLabel,
  testID
}: BrandListRowProps) => {
  const { theme } = useTheme();
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.row, isPressed ? styles.pressed : null]}
    >
      {circle}
      <View style={styles.labels}>
        <Text style={[styles.label, { color: theme.textPrimary }]}>{label}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      <ChevronRight
        testID={testID ? `${testID}-chevron` : undefined}
        size={CHEVRON_SIZE}
        strokeWidth={CHEVRON_STROKE_WIDTH}
        color={theme.textSecondary}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: BRAND_LIST_ROW_HEIGHT,
    paddingHorizontal: SPACING.md,
    gap: SPACING.md
  },
  circle: {
    width: BRAND_LIST_CIRCLE_SIZE,
    height: BRAND_LIST_CIRCLE_SIZE,
    borderRadius: BRAND_LIST_CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  glyph: {
    ...TYPOGRAPHY.bodyMdStrong
  },
  labels: {
    flex: 1
  },
  label: {
    ...TYPOGRAPHY.bodyLg
  },
  subtitle: {
    ...TYPOGRAPHY.captionMd
  },
  pressed: {
    transform: [{ scale: PRESSED_SCALE }]
  }
});

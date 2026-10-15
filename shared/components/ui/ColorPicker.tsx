import Check from 'lucide-react-native/icons/check';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import type { CardColor } from '@/core/schemas';

import { useTheme } from '@/shared/theme';
import { CARD_COLORS } from '@/shared/theme/colors';
import { getContrastForeground } from '@/shared/theme/luminance';
import { TOUCH_TARGET } from '@/shared/theme/spacing';

/**
 * The swatches in the order of the logo's five bars, as the form frame and _Card accents_ list them:
 * red, deep blue, azure, green, yellow. The keys are frozen identifiers (Story 21.2a), so `grey`
 * draws azure and `orange` draws yellow. A permutation of `CARD_COLOR_KEYS`, which the test pins.
 */
export const COLOR_PICKER_ORDER = [
  'red',
  'blue',
  'grey',
  'green',
  'orange'
] as const satisfies readonly CardColor[];

/** The selection: a 2pt ring in `primary`, held off the disc by a 2pt gap in `background`. */
const RING_GAP = 2;
const RING_WIDTH = 2;

/** The check on the selected disc: Lucide `check` at 20, stroke 3 (the form frame's glyph). */
const CHECK_SIZE = 20;
const CHECK_STROKE_WIDTH = 3;

/** Tap feedback — the design system's 0.98× scale (§ _Elevation_). */
const PRESSED_SCALE = 0.98;

type ColorPickerProps = {
  value: CardColor;
  onChange: (nextValue: CardColor) => void;
  /** The row's; each swatch is `${testID}-<key>`. */
  testID?: string;
};

type SwatchProps = {
  color: CardColor;
  selected: boolean;
  accessibilityLabel: string;
  onPress: () => void;
  testID: string;
};

const Swatch = ({ color, selected, accessibilityLabel, onPress, testID }: SwatchProps) => {
  const { theme } = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  const fill = CARD_COLORS[color];

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      style={[styles.swatch, { backgroundColor: fill }, isPressed ? styles.pressed : null]}
    >
      {selected ? (
        <>
          {/* Outside the disc, so the disc itself stays the full 48pt target. */}
          <View testID={`${testID}-gap`} style={[styles.gap, { borderColor: theme.background }]} />
          <View testID={`${testID}-ring`} style={[styles.ring, { borderColor: theme.primary }]} />
          {/* Ink on yellow, where the frame's white is 1.52:1; white on the four dark accents. */}
          <Check
            testID={`${testID}-check`}
            size={CHECK_SIZE}
            strokeWidth={CHECK_STROKE_WIDTH}
            color={getContrastForeground(fill)}
          />
        </>
      ) : null}
    </Pressable>
  );
};

/**
 * The card-colour picker (`cardi-design-system.md` § _Forms_, Story 22.6): five 48pt discs in the
 * accents, spread across the width. The app's only picker — setup's and edit's both.
 */
export const ColorPicker = ({ value, onChange, testID = 'color-picker' }: ColorPickerProps) => {
  const { t } = useTranslation();
  const colorNames: Record<CardColor, string> = {
    blue: t('cards.colors.blue'),
    red: t('cards.colors.red'),
    green: t('cards.colors.green'),
    orange: t('cards.colors.orange'),
    grey: t('cards.colors.grey')
  };

  return (
    <View testID={testID} style={styles.row}>
      {COLOR_PICKER_ORDER.map((color) => {
        const selected = color === value;

        return (
          <Swatch
            key={color}
            color={color}
            selected={selected}
            testID={`${testID}-${color}`}
            accessibilityLabel={t('cards.colors.accessibilityLabel', {
              color: colorNames[color],
              selected: selected ? t('cards.colors.selectedSuffix') : ''
            })}
            onPress={() => onChange(color)}
          />
        );
      })}
    </View>
  );
};

const RING_INSET = RING_GAP + RING_WIDTH;

const styles = StyleSheet.create({
  // Spread across the content width, as the form frame draws them, rather than a fixed gap: five
  // 48pt targets with a 24pt gap need 336pt, more than a 375pt screen leaves inside 24pt margins.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  swatch: {
    width: TOUCH_TARGET.min,
    height: TOUCH_TARGET.min,
    borderRadius: TOUCH_TARGET.min / 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pressed: {
    transform: [{ scale: PRESSED_SCALE }]
  },
  gap: {
    position: 'absolute',
    top: -RING_GAP,
    right: -RING_GAP,
    bottom: -RING_GAP,
    left: -RING_GAP,
    borderRadius: TOUCH_TARGET.min / 2 + RING_GAP,
    borderWidth: RING_GAP
  },
  ring: {
    position: 'absolute',
    top: -RING_INSET,
    right: -RING_INSET,
    bottom: -RING_INSET,
    left: -RING_INSET,
    borderRadius: TOUCH_TARGET.min / 2 + RING_INSET,
    borderWidth: RING_WIDTH
  }
});

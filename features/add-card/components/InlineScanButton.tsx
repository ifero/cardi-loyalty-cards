/**
 * InlineScanButton Component
 * Story 13.4: Restyle Add Card Flow (AC6)
 * Story 22.6: The form frame's scan button
 *
 * The card number's scan button, in the field's trailing slot: it opens the scanner to capture a
 * barcode and return the value. The form frame's 48pt square — a `surface` fill inside a 1pt
 * `border` outline at the 12pt control radius — holding Lucide `camera` at 24 / 1.5 in
 * `textPrimary`, with the 0.98× press. At 48pt it needs no hit slop, and one would take taps from
 * the input beside it.
 */

import Camera from 'lucide-react-native/icons/camera';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/shared/theme';
import { TOUCH_TARGET } from '@/shared/theme/spacing';

/** The design system's icon: 24pt, drawn at a 1.5 stroke (§ _Icons_). */
const ICON_SIZE = 24;
const ICON_STROKE_WIDTH = 1.5;

/** Tap feedback — the design system's 0.98× scale, never an opacity dip (§ _Elevation_). */
const PRESSED_SCALE = 0.98;

interface InlineScanButtonProps {
  onPress: () => void;
  testID?: string;
}

export const InlineScanButton: React.FC<InlineScanButtonProps> = ({
  onPress,
  testID = 'inline-scan-button'
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        styles.button,
        { backgroundColor: theme.surface, borderColor: theme.border },
        isPressed ? styles.pressed : null
      ]}
      accessibilityRole="button"
      accessibilityLabel={t('addCard.setup.inlineScanAccessibilityLabel')}
    >
      <Camera
        testID={`${testID}-icon`}
        size={ICON_SIZE}
        strokeWidth={ICON_STROKE_WIDTH}
        color={theme.textPrimary}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: TOUCH_TARGET.min,
    height: TOUCH_TARGET.min,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  pressed: {
    transform: [{ scale: PRESSED_SCALE }]
  }
});

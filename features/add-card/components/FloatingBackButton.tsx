/**
 * FloatingBackButton Component
 * Story 13.4: Restyle Add Card Flow (AC4)
 * Story 22.5: Capture frames B and C — the 40pt disc in a 48pt target, in two looks
 *
 * The scanner's only navigation control: there is no header bar on a camera. A 40pt disc holding
 * a Lucide chevron at 24 / 1.5, centred in a 48pt target that the caller places under the status
 * bar, with the system's 0.98× press.
 *
 * - `feed` (frame B): the disc is the camera's flat scrim and the chevron cream, the same in both
 *   schemes, because it floats on a live feed.
 * - `ground` (frame C and the camera-error state): no camera, so no dark — the disc takes the
 *   scheme's `surface` inside a 1pt `border`, and the chevron `textPrimary`.
 */

import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/shared/theme';
import { CAMERA_OVERLAY } from '@/shared/theme/colors';
import { TOUCH_TARGET } from '@/shared/theme/spacing';

/** The disc the frames draw: 40pt, fully round. */
export const BACK_DISC_SIZE = 40;

/**
 * How far the disc sits inside its 48pt target on every side, so a caller can place the disc's
 * corner — the measurement the frames give — rather than the target's.
 */
export const BACK_DISC_INSET = (TOUCH_TARGET.min - BACK_DISC_SIZE) / 2;

const ICON_SIZE = 24;
const ICON_STROKE_WIDTH = 1.5;

/** Tap feedback — the design system's 0.98× scale, never a dim or a shadow (§ _Elevation_). */
const PRESSED_SCALE = 0.98;

type FloatingBackButtonAppearance = 'feed' | 'ground';

interface FloatingBackButtonProps {
  onPress: () => void;
  /** `feed` over the camera (the default); `ground` on the scheme's own ground. */
  appearance?: FloatingBackButtonAppearance;
  /** Where the 48pt target sits — the caller positions it against the safe-area insets. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const FloatingBackButton: React.FC<FloatingBackButtonProps> = ({
  onPress,
  appearance = 'feed',
  style,
  testID = 'floating-back-button'
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [isPressed, setIsPressed] = useState(false);
  const isOnFeed = appearance === 'feed';

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={t('addCard.scanner.floatingBackAccessibilityLabel')}
      style={[styles.target, style, isPressed ? styles.pressed : null]}
    >
      <View
        testID={`${testID}-disc`}
        style={[
          styles.disc,
          isOnFeed
            ? { backgroundColor: CAMERA_OVERLAY.scrim }
            : { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }
        ]}
      >
        <ChevronLeft
          testID={`${testID}-icon`}
          size={ICON_SIZE}
          strokeWidth={ICON_STROKE_WIDTH}
          color={isOnFeed ? CAMERA_OVERLAY.text : theme.textPrimary}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  target: {
    position: 'absolute',
    width: TOUCH_TARGET.min,
    height: TOUCH_TARGET.min,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10
  },
  disc: {
    width: BACK_DISC_SIZE,
    height: BACK_DISC_SIZE,
    borderRadius: BACK_DISC_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pressed: {
    transform: [{ scale: PRESSED_SCALE }]
  }
});

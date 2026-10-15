import React, { useEffect } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { SPACING } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

type RequestErrorBannerProps = {
  /** What failed, as one sentence: "Failed to add card". */
  message: string;
  testID?: string;
};

/**
 * A failed request (`cardi-design-system.md` § _Forms_, and the design README's 2026-08-21 error
 * rule): one banner for the submission, never a reddened field. Validation belongs to the field it
 * concerns; a dropped connection or a failed write has no field to attach to.
 *
 * A `surface` card with a 1pt `error` outline — no tint, no icon and no dismiss, so the error colour
 * is used twice, by the outline and the sentence. It clears itself when the next press starts a
 * save, because the hook resets its error then.
 *
 * An alert: a polite live region on Android, and announced on iOS — which has no live region —
 * when it appears and whenever its message changes, queued behind any announcement in progress.
 */
export const RequestErrorBanner = ({ message, testID }: RequestErrorBannerProps) => {
  const { theme } = useTheme();

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibilityWithOptions?.(message, { queue: true });
    }
  }, [message]);

  return (
    <View
      testID={testID}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.banner, { backgroundColor: theme.surface, borderColor: theme.error }]}
    >
      <Text style={[styles.message, { color: theme.error }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.md
  },
  message: {
    ...TYPOGRAPHY.bodyMd
  }
});

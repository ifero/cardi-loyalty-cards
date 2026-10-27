import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { SPACING } from '@/shared/theme/spacing';

type PaginationDotsProps = {
  total: number;
  /** The shown page, from 0. */
  current: number;
  testID?: string;
};

const DOT_SIZE = 8;

/**
 * The highlights' page dots (Story 22.10): 8 across and 8 apart, the shown page's in `primary` and
 * the rest in `border`. One element for assistive technology, named by page.
 */
export const PaginationDots = ({ total, current, testID }: PaginationDotsProps) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={t('onboarding.highlights.paginationAccessibilityLabel', {
        current: current + 1,
        total
      })}
      style={styles.row}
    >
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={`dot-${index}`}
          testID={`pagination-dot-${index}`}
          style={[
            styles.dot,
            { backgroundColor: index === current ? theme.primary : theme.border }
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2
  }
});

import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { BottomSheet, OptionList, type OptionListOption } from '@/shared/components/ui';
import { useTheme } from '@/shared/theme';
import { SPACING } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import type { ThemePreference } from '../types';

type ThemePickerSheetProps = {
  visible: boolean;
  selectedTheme: ThemePreference;
  onSelect: (theme: ThemePreference) => void;
  onClose: () => void;
};

const THEME_OPTIONS: readonly ThemePreference[] = ['light', 'dark', 'system'];

/**
 * Pick one (frame C): Light, Dark, then System, with the system helper beneath. The helper is the
 * list's footer, so it scrolls with the options and never takes their room at the largest sizes.
 */
export const ThemePickerSheet = ({
  visible,
  selectedTheme,
  onSelect,
  onClose
}: ThemePickerSheetProps) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const labels: Record<ThemePreference, string> = {
    light: t('common.theme.light'),
    dark: t('common.theme.dark'),
    system: t('common.theme.system')
  };
  const options: OptionListOption<ThemePreference>[] = THEME_OPTIONS.map((key) => {
    const label = labels[key];
    return {
      value: key,
      label,
      accessibilityLabel: t('settings.theme.optionAccessibilityLabel', { name: label }),
      testID: `theme-option-${key}`
    };
  });

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t('settings.theme.pickerTitle')}
      testID="theme-picker-sheet"
    >
      <OptionList
        testID="theme-picker-options"
        options={options}
        selectedValue={selectedTheme}
        onSelect={onSelect}
        footer={
          <Text
            testID="theme-picker-helper"
            style={[styles.helper, { color: theme.textSecondary }]}
          >
            {t('settings.theme.systemDescription')}
          </Text>
        }
      />
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  // 20 below the last option, as frame C sets it.
  helper: {
    ...TYPOGRAPHY.captionMd,
    marginTop: SPACING.smMd + SPACING.sm
  }
});

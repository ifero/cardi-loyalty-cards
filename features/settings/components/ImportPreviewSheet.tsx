import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet, Button } from '@/shared/components/ui';
import { useTheme } from '@/shared/theme';
import { SPACING } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

type ImportPreviewSheetProps = {
  visible: boolean;
  fileName: string;
  totalCards: number;
  newCardsCount: number;
  duplicateCount: number;
  invalidCount: number;
  isImporting: boolean;
  onImport: () => void;
  onClose: () => void;
};

/**
 * Confirm (frame D): the file and what importing it will do, as plain text on the margin, then
 * Import above an outlined Cancel. Import is never disabled — with no new card it imports nothing,
 * and its toast says so.
 */
export const ImportPreviewSheet = ({
  visible,
  fileName,
  totalCards,
  newCardsCount,
  duplicateCount,
  invalidCount,
  isImporting,
  onImport,
  onClose
}: ImportPreviewSheetProps) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const importLabel = t('common.actions.import');
  const countStyle = [styles.count, { color: theme.textSecondary }];

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t('settings.import.previewTitle')}
      testID="import-preview-sheet"
      actions={
        <>
          <Button
            testID="import-preview-confirm"
            variant="primary"
            size="large"
            onPress={onImport}
            loading={isImporting}
            accessibilityLabel={importLabel}
          >
            {importLabel}
          </Button>
          <Button testID="import-preview-cancel" variant="secondary" size="large" onPress={onClose}>
            {t('common.actions.cancel')}
          </Button>
        </>
      }
    >
      <View testID="import-preview-summary" style={styles.summary}>
        <Text style={[styles.fileName, { color: theme.textPrimary }]}>{fileName}</Text>
        <Text style={countStyle}>
          {t('settings.import.totalCardsFound', { count: totalCards })}
        </Text>
        <Text style={countStyle}>
          {t('settings.import.newCardsAdded', { count: newCardsCount })}
        </Text>
        <Text style={countStyle}>
          {t('settings.import.duplicatesSkipped', { count: duplicateCount })}
        </Text>
        {invalidCount > 0 ? (
          <Text style={countStyle}>
            {t('settings.import.invalidEntriesSkipped', { count: invalidCount })}
          </Text>
        ) : null}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  summary: {
    gap: SPACING.xs
  },
  fileName: {
    ...TYPOGRAPHY.bodyMdStrong
  },
  count: {
    ...TYPOGRAPHY.bodyMd
  }
});

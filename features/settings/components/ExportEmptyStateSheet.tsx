import React from 'react';
import { useTranslation } from 'react-i18next';

import { BottomSheet, Button } from '@/shared/components/ui';

type ExportEmptyStateSheetProps = {
  visible: boolean;
  onClose: () => void;
};

/** Acknowledge (frame E): nothing to export, and one OK. An empty export is not an error. */
export const ExportEmptyStateSheet = ({ visible, onClose }: ExportEmptyStateSheetProps) => {
  const { t } = useTranslation();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t('settings.export.emptyTitle')}
      description={t('settings.export.emptyBody')}
      testID="export-empty-sheet"
      actions={
        <Button testID="export-empty-close" variant="primary" size="large" onPress={onClose}>
          {t('common.actions.ok')}
        </Button>
      }
    />
  );
};

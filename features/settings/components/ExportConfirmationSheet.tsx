import React from 'react';
import { useTranslation } from 'react-i18next';

import { BottomSheet, Button, RequestErrorBanner } from '@/shared/components/ui';

type ExportConfirmationSheetProps = {
  visible: boolean;
  cardCount: number;
  isExporting: boolean;
  /** A failed export: one banner, the first thing in the sheet — and no toast besides. */
  exportError: string | null;
  onExport: () => void;
  onClose: () => void;
};

/** Confirm (frame D): Export, the primary action, above an outlined Cancel. */
export const ExportConfirmationSheet = ({
  visible,
  cardCount,
  isExporting,
  exportError,
  onExport,
  onClose
}: ExportConfirmationSheetProps) => {
  const { t } = useTranslation();
  const exportLabel = t('common.actions.export');

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t('settings.export.confirmTitle')}
      description={t('settings.export.confirmBody', { count: cardCount })}
      testID="export-confirmation-sheet"
      actions={
        <>
          <Button
            testID="export-confirm-button"
            variant="primary"
            size="large"
            onPress={onExport}
            loading={isExporting}
            accessibilityLabel={exportLabel}
          >
            {exportLabel}
          </Button>
          <Button testID="export-cancel-button" variant="secondary" size="large" onPress={onClose}>
            {t('common.actions.cancel')}
          </Button>
        </>
      }
    >
      {exportError ? <RequestErrorBanner testID="export-error-text" message={exportError} /> : null}
    </BottomSheet>
  );
};

import React from 'react';
import { useTranslation } from 'react-i18next';

import { BottomSheet, Button } from '@/shared/components/ui';

type ImportErrorSheetProps = {
  visible: boolean;
  /** The hook's title and message, as it words them: an invalid file, or one with no cards. */
  title: string;
  message: string;
  onClose: () => void;
};

/** Acknowledge (frame E): the import's problem, and one OK. No icon and no tint. */
export const ImportErrorSheet = ({ visible, title, message, onClose }: ImportErrorSheetProps) => {
  const { t } = useTranslation();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={title}
      description={message}
      testID="import-error-sheet"
      actions={
        <Button testID="import-error-ok" variant="primary" size="large" onPress={onClose}>
          {t('common.actions.ok')}
        </Button>
      }
    />
  );
};

import React from 'react';
import { useTranslation } from 'react-i18next';

import { BottomSheet, Button, RequestErrorBanner } from '@/shared/components/ui';

type SignOutSheetProps = {
  visible: boolean;
  isLoading: boolean;
  /** A failed sign-out: one banner, the first thing in the sheet. */
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

/** Confirm (frame D): Sign Out, the destructive text action, above an outlined Cancel. */
export const SignOutSheet = ({
  visible,
  isLoading,
  error,
  onConfirm,
  onClose
}: SignOutSheetProps) => {
  const { t } = useTranslation();
  const signOut = t('common.actions.signOut');

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t('settings.signOutSheet.title')}
      description={t('settings.signOutSheet.body')}
      testID="signout-sheet"
      actions={
        <>
          <Button
            testID="signout-confirm"
            variant="destructive"
            size="large"
            onPress={onConfirm}
            loading={isLoading}
            accessibilityLabel={signOut}
          >
            {signOut}
          </Button>
          <Button testID="signout-cancel" variant="secondary" size="large" onPress={onClose}>
            {t('common.actions.cancel')}
          </Button>
        </>
      }
    >
      {error ? <RequestErrorBanner testID="signout-error" message={error} /> : null}
    </BottomSheet>
  );
};

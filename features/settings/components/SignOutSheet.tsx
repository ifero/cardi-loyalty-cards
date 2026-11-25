import React from 'react';
import { useTranslation } from 'react-i18next';

import { BottomSheet, Button, RequestErrorBanner } from '@/shared/components/ui';

/** Which sign-out is in flight: keeping the cards on this device, or erasing them. */
export type SignOutBusyAction = 'keep' | 'erase' | null;

type SignOutSheetProps = {
  visible: boolean;
  /** The choice whose request is in flight; it shows the spinner, and the other choice locks. */
  busyAction: SignOutBusyAction;
  /** A failed sign-out: one banner, the first thing in the sheet. */
  error: string | null;
  /** `eraseCards` is true when the person chose to erase the cards on this device. */
  onConfirm: (eraseCards: boolean) => void;
  onClose: () => void;
};

/**
 * Confirm (frame D, Story 16.45): keep the cards (outlined), erase them (the destructive text
 * action), then an outlined Cancel.
 */
export const SignOutSheet = ({
  visible,
  busyAction,
  error,
  onConfirm,
  onClose
}: SignOutSheetProps) => {
  const { t } = useTranslation();
  const keepCards = t('settings.signOutSheet.keepCards');
  const eraseCards = t('settings.signOutSheet.eraseCards');
  const isBusy = busyAction !== null;
  // A sign-out in flight cannot be cancelled: Cancel is disabled and the sheet's own close (scrim,
  // Android back, the VoiceOver escape) does nothing until it settles.
  const close = () => {
    if (!isBusy) onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      title={t('settings.signOutSheet.title')}
      description={t('settings.signOutSheet.body')}
      testID="signout-sheet"
      actions={
        <>
          <Button
            testID="signout-keep"
            variant="secondary"
            size="large"
            onPress={() => onConfirm(false)}
            loading={busyAction === 'keep'}
            disabled={isBusy}
            accessibilityLabel={keepCards}
          >
            {keepCards}
          </Button>
          <Button
            testID="signout-erase"
            variant="destructive"
            size="large"
            onPress={() => onConfirm(true)}
            loading={busyAction === 'erase'}
            disabled={isBusy}
            accessibilityLabel={eraseCards}
          >
            {eraseCards}
          </Button>
          <Button
            testID="signout-cancel"
            variant="secondary"
            size="large"
            onPress={close}
            disabled={isBusy}
          >
            {t('common.actions.cancel')}
          </Button>
        </>
      }
    >
      {error ? <RequestErrorBanner testID="signout-error" message={error} /> : null}
    </BottomSheet>
  );
};

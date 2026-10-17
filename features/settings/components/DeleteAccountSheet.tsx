import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { BottomSheet, Button, RequestErrorBanner, TextField } from '@/shared/components/ui';
import { SPACING } from '@/shared/theme/spacing';

type DeleteAccountSheetProps = {
  visible: boolean;
  isLoading: boolean;
  /** A failed delete: one banner, the first thing in the sheet. */
  error: string | null;
  onConfirmDelete: () => Promise<void>;
  onClose: () => void;
};

/**
 * Deleting the account, in two steps (Story 6.10). Step 1 is a confirm (frame D): Continue, the
 * destructive text action, above an outlined Cancel. Step 2 is the type-to-confirm (frame F): a
 * labelled field, then Delete Account — the one control in settings drawn disabled — live only
 * while the field holds exactly the keyword, case included.
 */
export const DeleteAccountSheet = ({
  visible,
  isLoading,
  error,
  onConfirmDelete,
  onClose
}: DeleteAccountSheetProps) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmationText, setConfirmationText] = useState('');

  // Each opening starts at step 1 with an empty field. It resets when the sheet OPENS, never when
  // it closes: a closing sheet slides out still showing the step it was on.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setStep(1);
      setConfirmationText('');
    }
  }

  const isFirstStep = step === 1;
  const canDelete = confirmationText === t('settings.deleteAccountSheet.confirmKeyword');
  const deleteAccount = t('settings.account.deleteAccount');
  const banner = error ? <RequestErrorBanner testID="delete-error" message={error} /> : null;

  // The sheet changes in place, so it says so, as it announces its title when it opens.
  const continueToConfirm = () => {
    setStep(2);
    AccessibilityInfo.announceForAccessibility?.(t('settings.deleteAccountSheet.step2Title'));
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t(
        isFirstStep
          ? 'settings.deleteAccountSheet.step1Title'
          : 'settings.deleteAccountSheet.step2Title'
      )}
      description={t(
        isFirstStep
          ? 'settings.deleteAccountSheet.step1Body'
          : 'settings.deleteAccountSheet.step2Body'
      )}
      testID="delete-account-sheet"
      actions={
        <>
          {/* Keyed apart, so Delete Account is a control of its own, not Continue's reused: a
              screen reader's focus does not stay on a button that has changed under it. */}
          {isFirstStep ? (
            <Button
              key="continue"
              testID="delete-continue-step1"
              variant="destructive"
              size="large"
              onPress={continueToConfirm}
            >
              {t('common.actions.continue')}
            </Button>
          ) : (
            // The gate: disabled until the keyword is typed. Busy wins over it, so a delete in
            // flight keeps its spinner even if the field is edited meanwhile.
            <Button
              key="confirm"
              testID="delete-confirm-step2"
              variant="destructive"
              size="large"
              onPress={onConfirmDelete}
              disabled={!canDelete}
              loading={isLoading}
              accessibilityLabel={deleteAccount}
            >
              {deleteAccount}
            </Button>
          )}
          <Button
            testID={isFirstStep ? 'delete-cancel-step1' : 'delete-cancel-step2'}
            variant="secondary"
            size="large"
            onPress={onClose}
          >
            {t('common.actions.cancel')}
          </Button>
        </>
      }
    >
      {isFirstStep ? (
        banner
      ) : (
        <View style={styles.content}>
          {banner}
          {/* Stays editable while the delete runs: nothing but the pressed button locks. */}
          <TextField
            testID="delete-confirm-input"
            label={t('settings.deleteAccountSheet.confirmInputLabel')}
            value={confirmationText}
            onChangeText={setConfirmationText}
            autoCapitalize="characters"
            accessibilityLabel={t('settings.deleteAccountSheet.confirmInputLabel')}
            accessibilityHint={t('settings.deleteAccountSheet.confirmInputHint')}
          />
        </View>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  // The banner, when there is one, 16 above the field.
  content: {
    gap: SPACING.md
  }
});

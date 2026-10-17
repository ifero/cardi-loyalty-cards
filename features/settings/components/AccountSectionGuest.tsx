import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/shared/components/ui';
import { Surface } from '@/shared/components/ui/Surface';
import { useTheme } from '@/shared/theme';
import { SPACING } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

type AccountSectionGuestProps = {
  onCreateAccount: () => void;
  onSignIn: () => void;
};

/**
 * The account group, as a guest (frame B): a surface padded 24, centred — its title, its body, then
 * Create Account above Sign In. The buttons take the default 48: the design system gives 52 only to a
 * footer's primary and to a sheet's actions.
 */
export const AccountSectionGuest = ({ onCreateAccount, onSignIn }: AccountSectionGuestProps) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <Surface testID="settings-guest-card">
      <View testID="settings-guest-block" style={styles.guest}>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.textPrimary }]}>
          {t('settings.account.guestTitle')}
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          {t('settings.account.guestBody')}
        </Text>
        <View testID="settings-guest-actions" style={styles.actions}>
          <Button
            testID="settings-create-account-button"
            variant="primary"
            onPress={onCreateAccount}
          >
            {t('common.actions.createAccount')}
          </Button>
          <Button testID="settings-sign-in-button" variant="secondary" onPress={onSignIn}>
            {t('common.actions.signIn')}
          </Button>
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  guest: {
    padding: SPACING.lg,
    alignItems: 'center'
  },
  title: {
    ...TYPOGRAPHY.sheetTitle,
    textAlign: 'center'
  },
  body: {
    ...TYPOGRAPHY.bodyMd,
    marginTop: SPACING.sm,
    textAlign: 'center'
  },
  // Full width, though the block centres its text.
  actions: {
    alignSelf: 'stretch',
    marginTop: SPACING.lg,
    gap: SPACING.sm
  }
});

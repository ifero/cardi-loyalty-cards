import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { ActionRow } from '@/shared/components/ui';
import { Surface } from '@/shared/components/ui/Surface';
import { useTheme } from '@/shared/theme';
import { SPACING } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

type AccountSectionProps = {
  email: string;
  onSignOut: () => void;
  onChangePassword: () => void;
  onDeleteAccount: () => void;
  /** The verification code is being sent: the row shows the spinner and ignores presses. */
  isChangingPassword?: boolean;
};

/**
 * The account group, signed in (frame A): one hairline-outlined surface with no head above it —
 * identity, not a category. "Signed in" over the email, then Change Password, Sign Out and Delete
 * Account, the last two destructive text with no chevron.
 */
export const AccountSection = ({
  email,
  onSignOut,
  onChangePassword,
  onDeleteAccount,
  isChangingPassword = false
}: AccountSectionProps) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const signedIn = t('settings.account.signedIn');
  // One stop for a screen reader: the caption is the email's label, not a heading of its own.
  const headName = `${signedIn}, ${email}`;

  return (
    <Surface divided testID="settings-account-card">
      <View
        testID="settings-account-head"
        accessible
        accessibilityLabel={headName}
        style={styles.head}
      >
        <Text style={[styles.caption, { color: theme.textSecondary }]}>{signedIn}</Text>
        <Text style={[styles.email, { color: theme.textPrimary }]}>{email}</Text>
      </View>
      <ActionRow
        testID="settings-change-password-row"
        variant="plain"
        showBottomBorder={false}
        label={t('settings.account.changePassword')}
        accessibilityLabel={t('settings.account.changePasswordA11y')}
        onPress={onChangePassword}
        isLoading={isChangingPassword}
      />
      <ActionRow
        testID="settings-signout-row"
        variant="plain"
        showBottomBorder={false}
        destructive
        showChevron={false}
        label={t('common.actions.signOut')}
        accessibilityLabel={t('settings.account.signOutA11y')}
        onPress={onSignOut}
      />
      <ActionRow
        testID="settings-delete-row"
        variant="plain"
        showBottomBorder={false}
        destructive
        showChevron={false}
        label={t('settings.account.deleteAccount')}
        accessibilityLabel={t('settings.account.deleteAccountA11y')}
        onPress={onDeleteAccount}
      />
    </Surface>
  );
};

const styles = StyleSheet.create({
  // Padded as the rows are, the email 2 below its caption.
  head: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.smMd,
    gap: 2
  },
  // `overline`: the label for a group (`cardi-design-system.md` § _Section header_).
  caption: {
    ...TYPOGRAPHY.overline,
    textTransform: 'uppercase'
  },
  // No line limit: a long address wraps rather than clipping.
  email: {
    ...TYPOGRAPHY.bodyLg
  }
});

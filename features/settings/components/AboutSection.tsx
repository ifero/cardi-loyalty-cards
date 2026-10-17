import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { ActionRow } from '@/shared/components/ui';
import { useTheme } from '@/shared/theme';

import { SettingsSection } from './SettingsSection';

type AboutSectionProps = {
  appVersion: string;
  catalogueVersion: string;
  onHelpPress: () => void;
  onPrivacyPress: () => void;
};

export const AboutSection = ({
  appVersion,
  catalogueVersion,
  onHelpPress,
  onPrivacyPress
}: AboutSectionProps) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <SettingsSection title={t('settings.sections.about')}>
      <ActionRow
        testID="settings-app-version-row"
        variant="plain"
        prefix={<MaterialIcons name="info-outline" size={24} color={theme.primary} />}
        label={t('settings.about.appVersion')}
        value={appVersion}
        disabled
        showChevron={false}
        onPress={() => undefined}
      />
      <ActionRow
        testID="settings-catalogue-row"
        variant="plain"
        prefix={<MaterialIcons name="menu-book" size={24} color={theme.primary} />}
        label={t('settings.about.catalogue')}
        value={catalogueVersion}
        disabled
        showChevron={false}
        onPress={() => undefined}
      />
      <ActionRow
        testID="settings-help-row"
        variant="plain"
        prefix={<MaterialIcons name="help-outline" size={24} color={theme.primary} />}
        label={t('settings.about.helpFaq')}
        onPress={onHelpPress}
      />
      <ActionRow
        testID="settings-privacy-row"
        variant="plain"
        prefix={<MaterialIcons name="policy" size={24} color={theme.primary} />}
        label={t('settings.about.privacyPolicy')}
        onPress={onPrivacyPress}
      />
    </SettingsSection>
  );
};

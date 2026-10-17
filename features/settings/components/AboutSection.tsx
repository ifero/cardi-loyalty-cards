import React from 'react';
import { useTranslation } from 'react-i18next';

import { ActionRow } from '@/shared/components/ui';

import { SettingsSection } from './SettingsSection';

type AboutSectionProps = {
  appVersion: string;
  catalogueVersion: string;
  onHelpPress: () => void;
  onPrivacyPress: () => void;
  onWhatWeCollectPress: () => void;
};

/**
 * ABOUT (frame A, plus What We Collect after Privacy Policy — ifero, 2026-10-15). App Version and
 * Catalogue are information, not controls: no press, no chevron, at full strength, each read as
 * its label and its value.
 */
export const AboutSection = ({
  appVersion,
  catalogueVersion,
  onHelpPress,
  onPrivacyPress,
  onWhatWeCollectPress
}: AboutSectionProps) => {
  const { t } = useTranslation();

  return (
    <SettingsSection title={t('settings.sections.about')}>
      <ActionRow
        testID="settings-help-row"
        variant="plain"
        showBottomBorder={false}
        label={t('settings.about.helpFaq')}
        onPress={onHelpPress}
      />
      <ActionRow
        testID="settings-privacy-row"
        variant="plain"
        showBottomBorder={false}
        label={t('settings.about.privacyPolicy')}
        onPress={onPrivacyPress}
      />
      <ActionRow
        testID="settings-what-we-collect-row"
        variant="plain"
        showBottomBorder={false}
        label={t('navigation.whatWeCollect')}
        onPress={onWhatWeCollectPress}
      />
      <ActionRow
        testID="settings-app-version-row"
        variant="plain"
        showBottomBorder={false}
        label={t('settings.about.appVersion')}
        value={appVersion}
      />
      <ActionRow
        testID="settings-catalogue-row"
        variant="plain"
        showBottomBorder={false}
        label={t('settings.about.catalogue')}
        value={catalogueVersion}
      />
    </SettingsSection>
  );
};

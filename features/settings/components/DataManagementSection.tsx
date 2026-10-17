import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { ActionRow } from '@/shared/components/ui';
import { useTheme } from '@/shared/theme';

import { SettingsSection } from './SettingsSection';

type DataManagementSectionProps = {
  isAuthenticated: boolean;
  syncLabel: string;
  isSyncing: boolean;
  onExportPress: () => void;
  onImportPress: () => void;
  onSyncPress: () => void;
};

export const DataManagementSection = ({
  isAuthenticated,
  syncLabel,
  isSyncing,
  onExportPress,
  onImportPress,
  onSyncPress
}: DataManagementSectionProps) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <SettingsSection title={t('settings.sections.data')}>
      <ActionRow
        testID="settings-export-row"
        variant="plain"
        prefix={<MaterialIcons name="file-download" size={24} color={theme.primary} />}
        label={t('settings.data.exportData')}
        value={t('settings.data.format')}
        onPress={onExportPress}
      />
      <ActionRow
        testID="settings-import-row"
        variant="plain"
        prefix={<MaterialIcons name="file-upload" size={24} color={theme.primary} />}
        label={t('settings.data.importData')}
        value={t('settings.data.format')}
        onPress={onImportPress}
      />
      {isAuthenticated ? (
        <ActionRow
          testID="settings-sync-row"
          variant="plain"
          prefix={
            <MaterialCommunityIcons name="cloud-sync-outline" size={24} color={theme.primary} />
          }
          label={t('common.actions.sync')}
          value={syncLabel}
          showChevron={false}
          isLoading={isSyncing}
          onPress={onSyncPress}
        />
      ) : null}
    </SettingsSection>
  );
};

import React from 'react';
import { useTranslation } from 'react-i18next';

import { ActionRow } from '@/shared/components/ui';

import { SettingsSection } from './SettingsSection';

type DataManagementSectionProps = {
  isAuthenticated: boolean;
  syncLabel: string;
  isSyncing: boolean;
  /** The document picker is preparing: the Import row shows the spinner. */
  isPreparingImport: boolean;
  onExportPress: () => void;
  onImportPress: () => void;
  onSyncPress: () => void;
};

/**
 * DATA (frame A): Export Data, Import Data, then Sync — which a guest does not see (Stories 7.7 and
 * 13.6; frame B is overruled). Sync shows when it last ran, not the frame's "Synced", which is not
 * real data.
 */
export const DataManagementSection = ({
  isAuthenticated,
  syncLabel,
  isSyncing,
  isPreparingImport,
  onExportPress,
  onImportPress,
  onSyncPress
}: DataManagementSectionProps) => {
  const { t } = useTranslation();

  return (
    <SettingsSection title={t('settings.sections.data')}>
      <ActionRow
        testID="settings-export-row"
        variant="plain"
        showBottomBorder={false}
        label={t('settings.data.exportData')}
        value={t('settings.data.format')}
        onPress={onExportPress}
      />
      <ActionRow
        testID="settings-import-row"
        variant="plain"
        showBottomBorder={false}
        label={t('settings.data.importData')}
        isLoading={isPreparingImport}
        onPress={onImportPress}
      />
      {isAuthenticated ? (
        <ActionRow
          testID="settings-sync-row"
          variant="plain"
          showBottomBorder={false}
          label={t('common.actions.sync')}
          value={syncLabel}
          isLoading={isSyncing}
          onPress={onSyncPress}
        />
      ) : null}
    </SettingsSection>
  );
};

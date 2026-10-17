import Constants from 'expo-constants';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getAllCards, getCardCount } from '@/core/database/card-repository';
import { createExportPayload } from '@/core/settings/importCards';
import { logger } from '@/core/utils/logger';

import { showToast } from '@/shared/toast';

export const useExportData = () => {
  const { t } = useTranslation();
  const [cardCount, setCardCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const refreshCardCount = async () => {
    const count = await getCardCount();
    setCardCount(count);
  };

  useEffect(() => {
    refreshCardCount();
  }, []);

  const exportCards = async (): Promise<boolean> => {
    setIsExporting(true);
    setExportError(null);

    try {
      const cards = await getAllCards();
      const payload = createExportPayload(cards, Constants.expoConfig?.version ?? '1.0.0');

      const file = new File(Paths.document, `cardi-export-${Date.now()}.json`);
      file.create({ overwrite: true });
      file.write(JSON.stringify(payload, null, 2));

      let shareFailed = false;

      try {
        const canShare = await Sharing.isAvailableAsync();
        if (!canShare) {
          shareFailed = true;
        } else {
          await Sharing.shareAsync(file.uri, {
            mimeType: 'application/json',
            dialogTitle: t('settings.export.shareDialogTitle')
          });
        }
      } catch (error) {
        shareFailed = true;
        logger.warn('[useExportData] Sharing failed, keeping exported file locally', error);
      }

      await showToast({
        title: t('settings.export.successTitle'),
        message: shareFailed ? t('settings.export.localBackupMessage') : undefined,
        preset: 'done'
      });

      await refreshCardCount();
      return true;
    } catch (error) {
      logger.error('[useExportData] Export failed', error);
      // The export sheet shows it as its banner, and that is the one surface a failure gets — no
      // toast besides it (Story 22.7, as Story 22.6 ruled for the save hooks).
      setExportError(t('settings.export.failedMessage'));
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  /** Forgets the last failure, so the export sheet opens without it. */
  const clearExportError = () => setExportError(null);

  return {
    cardCount,
    hasCards: cardCount > 0,
    isExporting,
    exportError,
    clearExportError,
    refreshCardCount,
    exportCards
  };
};

/**
 * The Home header's two buttons
 * Story 22.2: Wallet — the four Cardì wallet frames
 *
 * `+` on the left opens Add Card and the gear on the right opens Settings — the only navigation
 * Home has (`cardi-design-system.md` § _Navigation_). Each is the shared `HeaderIconButton`: a
 * 48 × 48 target holding a 24pt outline icon at a 1.5 stroke in `textPrimary`, ink in light and
 * cream in dark.
 *
 * These render inside the NATIVE header, so this file deliberately imports nothing from
 * `react-native-unistyles` and lives outside `app/` (see `HeaderIconButton`).
 */

import { useRouter } from 'expo-router';
import Plus from 'lucide-react-native/icons/plus';
import Settings from 'lucide-react-native/icons/settings';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { HeaderIconButton } from '@/shared/components/ui/HeaderIconButton';

/** `+`, at the left of the Home header: opens Add Card. */
export const HomeAddButton = () => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <HeaderIconButton
      icon={Plus}
      label={t('navigation.addCard')}
      onPress={() => router.push('/add-card')}
      testID="home-add-button"
    />
  );
};

/** The gear, at the right of the Home header: opens Settings. */
export const HomeSettingsButton = () => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <HeaderIconButton
      icon={Settings}
      label={t('navigation.settings')}
      onPress={() => router.push('/settings')}
      testID="home-settings-button"
    />
  );
};

import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { catalogueRepository } from '@/core/catalogue/catalogue-repository';
import { clearLastSyncAt } from '@/core/sync/sync-timestamp';
import { logger } from '@/core/utils/logger';

import { ScreenHeader } from '@/shared/components/ui';
import { deleteAccount, getSession, sendPasswordResetOtp, signOut } from '@/shared/supabase/auth';
import { useAuthState } from '@/shared/supabase/useAuthState';
import { useTheme } from '@/shared/theme';
import { LAYOUT, SPACING } from '@/shared/theme/spacing';
import { showToast } from '@/shared/toast';

import { AboutSection } from '../components/AboutSection';
import { AccountSection } from '../components/AccountSection';
import { AccountSectionGuest } from '../components/AccountSectionGuest';
import { DataManagementSection } from '../components/DataManagementSection';
import { DeleteAccountSheet } from '../components/DeleteAccountSheet';
import { ExportConfirmationSheet } from '../components/ExportConfirmationSheet';
import { ExportEmptyStateSheet } from '../components/ExportEmptyStateSheet';
import { ImportErrorSheet } from '../components/ImportErrorSheet';
import { ImportPreviewSheet } from '../components/ImportPreviewSheet';
import { LanguagePickerSheet } from '../components/LanguagePickerSheet';
import { PreferencesSection } from '../components/PreferencesSection';
import { SignOutSheet } from '../components/SignOutSheet';
import { ThemePickerSheet } from '../components/ThemePickerSheet';
import { useAutoBrightnessPreference } from '../hooks/useAutoBrightnessPreference';
import { useExportData } from '../hooks/useExportData';
import { useImportData } from '../hooks/useImportData';
import { useLanguagePreference } from '../hooks/useLanguagePreference';
import { useSyncTrigger } from '../hooks/useSyncTrigger';
import { useThemePreference } from '../hooks/useThemePreference';

const SettingsScreen = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthState();

  const [email, setEmail] = useState('');
  const [isSignOutSheetOpen, setIsSignOutSheetOpen] = useState(false);
  const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false);
  const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
  const [isExportEmptyOpen, setIsExportEmptyOpen] = useState(false);

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const {
    themePreference,
    themePreferenceLabel,
    isThemePickerOpen,
    openThemePicker,
    closeThemePicker,
    selectTheme
  } = useThemePreference();

  const {
    languageCode,
    languageName,
    supportedLanguages,
    isLanguagePickerOpen,
    openLanguagePicker,
    closeLanguagePicker,
    selectLanguage
  } = useLanguagePreference();

  // Story 16.39 — the standing preference behind the card detail screen's brightness
  // boost. Off by default; the card screen also has an in-the-moment button.
  const { isAutoBrightnessEnabled, setAutoBrightness } = useAutoBrightnessPreference();

  const {
    cardCount,
    hasCards,
    isExporting,
    exportError,
    clearExportError,
    exportCards,
    refreshCardCount
  } = useExportData();
  const { isSyncing, syncLabel, triggerSync } = useSyncTrigger();

  const refreshAfterImport = async () => {
    await refreshCardCount();
  };

  const {
    preview,
    errorState,
    isPreparing,
    isImporting,
    pickImportFile,
    confirmImport,
    closePreview,
    closeError
  } = useImportData({
    isAuthenticated,
    onImportSuccess: refreshAfterImport,
    onSyncRequested: triggerSync
  });

  // A sheet keeps its content while it slides out: the hook empties `preview` and `errorState` in
  // the render that closes their sheets, so each sheet draws the last one it was given until the
  // next replaces it, rather than falling back to zeros and an empty message on the way out.
  const [shownPreview, setShownPreview] = useState(preview);
  if (preview !== null && preview !== shownPreview) {
    setShownPreview(preview);
  }
  const [shownImportError, setShownImportError] = useState(errorState);
  if (errorState !== null && errorState !== shownImportError) {
    setShownImportError(errorState);
  }

  useEffect(() => {
    const loadEmail = async () => {
      if (!isAuthenticated) {
        setEmail('');
        return;
      }

      const result = await getSession();
      if (result.success && result.data?.user.email) {
        setEmail(result.data.user.email);
      }
    };

    loadEmail();
  }, [isAuthenticated]);

  const appVersion = useMemo(() => Constants.expoConfig?.version ?? '1.0.0', []);
  const catalogueVersion = useMemo(() => catalogueRepository.getVersion(), []);

  // Each sheet that can show a failed request opens without the last one: the error clears when
  // its sheet opens, and again when the next press starts the request.
  const openExport = () => {
    if (hasCards) {
      clearExportError();
      setIsExportConfirmOpen(true);
      return;
    }

    setIsExportEmptyOpen(true);
  };

  const openSignOut = () => {
    setSignOutError(null);
    setIsSignOutSheetOpen(true);
  };

  const openDeleteAccount = () => {
    setDeleteError(null);
    setIsDeleteSheetOpen(true);
  };

  const confirmExport = async () => {
    const success = await exportCards();
    if (success) {
      setIsExportConfirmOpen(false);
    }
  };

  const confirmSignOut = async () => {
    setSignOutError(null);
    setIsSigningOut(true);

    try {
      const result = await signOut();

      if (!result.success) {
        setSignOutError(t('settings.account.signOutError'));
        return;
      }

      try {
        await clearLastSyncAt();
      } catch (error) {
        logger.error('[SettingsScreen] Failed to clear sync timestamp on sign out', error);
      }

      setIsSignOutSheetOpen(false);
      router.replace('/');
    } catch (error) {
      logger.error('[SettingsScreen] Failed to sign out', error);
      setSignOutError(t('settings.account.signOutError'));
    } finally {
      setIsSigningOut(false);
    }
  };

  const confirmDeleteAccount = async () => {
    setDeleteError(null);
    setIsDeleting(true);

    try {
      const result = await deleteAccount();

      if (!result.success) {
        setDeleteError(t('settings.account.deleteError'));
        return;
      }

      try {
        await clearLastSyncAt();
      } catch (error) {
        logger.error('[SettingsScreen] Failed to clear sync timestamp on delete account', error);
      }

      setIsDeleteSheetOpen(false);
      await showToast({ title: t('settings.account.accountDeleted'), preset: 'done' });
      router.replace('/');
    } catch (error) {
      logger.error('[SettingsScreen] Failed to delete account', error);
      setDeleteError(t('settings.account.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  // OTP-gated password change (Story 6.20, AD-6-20-01). Prove control of the
  // account email before allowing a change, then reuse the 6.19 recovery flow:
  // send the code here, hand off to the shared OTP screen tagged with
  // `origin: 'change-password'` so it routes back to /settings (not /) and the
  // back stack is preserved for a clean return. `isChangingPassword` makes the
  // row busy while the send is in flight — it shows the spinner and ignores
  // presses — so a double tap can't send twice (the same guard the sheets'
  // busy buttons give confirmSignOut/confirmDeleteAccount above). A
  // not-yet-loaded session email surfaces a toast rather than a dead tap
  // (retrying once it resolves succeeds).
  const startChangePassword = async () => {
    if (!email) {
      await showToast({ title: t('settings.account.changePasswordError'), preset: 'error' });
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await sendPasswordResetOtp(email);

      if (!result.success) {
        await showToast({ title: t('settings.account.changePasswordError'), preset: 'error' });
        return;
      }

      router.push({
        pathname: '/recovery-otp',
        params: { email, sentAt: String(Date.now()), origin: 'change-password' }
      });
    } catch (error) {
      logger.error('[SettingsScreen] Failed to start change-password', error);
      await showToast({ title: t('settings.account.changePasswordError'), preset: 'error' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <>
      {/* The ground under the top inset and the sides. The list runs on under the home
          indicator, so the bottom inset is in its padding instead. */}
      <SafeAreaView
        testID="settings-screen"
        edges={['top', 'left', 'right']}
        style={[styles.root, { backgroundColor: theme.background }]}
      >
        <ScreenHeader
          title={t('navigation.settings')}
          onBack={() => router.back()}
          testID="settings-header"
          backTestID="settings-back-button"
        />
        <ScrollView
          testID="settings-screen-scroll"
          contentContainerStyle={[styles.content, { paddingBottom: SPACING.lg + insets.bottom }]}
        >
          {isAuthenticated ? (
            <AccountSection
              email={email || t('settings.account.fallbackEmail')}
              onSignOut={openSignOut}
              onChangePassword={startChangePassword}
              onDeleteAccount={openDeleteAccount}
              isChangingPassword={isChangingPassword}
            />
          ) : (
            <AccountSectionGuest
              onCreateAccount={() => router.push('/create-account')}
              onSignIn={() => router.push('/sign-in')}
            />
          )}

          <PreferencesSection
            themeLabel={themePreferenceLabel}
            languageName={languageName}
            onThemePress={openThemePicker}
            onLanguagePress={openLanguagePicker}
            isAutoBrightnessEnabled={isAutoBrightnessEnabled}
            onAutoBrightnessChange={setAutoBrightness}
          />

          <DataManagementSection
            isAuthenticated={isAuthenticated}
            syncLabel={syncLabel}
            isSyncing={isSyncing}
            isPreparingImport={isPreparing}
            onExportPress={openExport}
            onImportPress={pickImportFile}
            onSyncPress={triggerSync}
          />

          <AboutSection
            appVersion={appVersion}
            catalogueVersion={catalogueVersion}
            onHelpPress={() => router.push('/help')}
            onPrivacyPress={() => router.push('/privacy-policy')}
            onWhatWeCollectPress={() => router.push('/data-summary')}
          />
        </ScrollView>
      </SafeAreaView>

      <ThemePickerSheet
        visible={isThemePickerOpen}
        selectedTheme={themePreference}
        onSelect={selectTheme}
        onClose={closeThemePicker}
      />

      <LanguagePickerSheet
        visible={isLanguagePickerOpen}
        currentCode={languageCode}
        options={supportedLanguages}
        onSelect={selectLanguage}
        onClose={closeLanguagePicker}
      />

      <ExportConfirmationSheet
        visible={isExportConfirmOpen}
        cardCount={cardCount}
        isExporting={isExporting}
        exportError={exportError}
        onExport={confirmExport}
        onClose={() => setIsExportConfirmOpen(false)}
      />

      <ExportEmptyStateSheet
        visible={isExportEmptyOpen}
        onClose={() => setIsExportEmptyOpen(false)}
      />

      <ImportPreviewSheet
        visible={preview !== null}
        fileName={shownPreview?.fileName ?? ''}
        totalCards={shownPreview?.totalCards ?? 0}
        newCardsCount={shownPreview?.newCardsCount ?? 0}
        duplicateCount={shownPreview?.duplicateCount ?? 0}
        invalidCount={shownPreview?.invalidCount ?? 0}
        isImporting={isImporting}
        onImport={confirmImport}
        onClose={closePreview}
      />

      <ImportErrorSheet
        visible={errorState !== null}
        title={shownImportError?.title ?? ''}
        message={shownImportError?.message ?? ''}
        onClose={closeError}
      />

      <SignOutSheet
        visible={isSignOutSheetOpen}
        isLoading={isSigningOut}
        error={signOutError}
        onConfirm={confirmSignOut}
        onClose={() => setIsSignOutSheetOpen(false)}
      />

      <DeleteAccountSheet
        visible={isDeleteSheetOpen}
        isLoading={isDeleting}
        error={deleteError}
        onConfirmDelete={confirmDeleteAccount}
        onClose={() => setIsDeleteSheetOpen(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  // 16 below the header, 24 at the sides, the groups 24 apart.
  content: {
    paddingTop: SPACING.md,
    paddingHorizontal: LAYOUT.screenHorizontalMargin,
    gap: SPACING.lg
  }
});

export default SettingsScreen;

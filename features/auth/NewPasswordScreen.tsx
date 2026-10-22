import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, StyleSheet, type TextInput, View } from 'react-native';

import { isValidPassword } from '@/core/auth/validation';

import { FormScreen, type FormScreenHandle } from '@/shared/components/ui';
import { updatePassword } from '@/shared/supabase/auth';
import { SPACING } from '@/shared/theme/spacing';
import { showToast } from '@/shared/toast';

import { AuthBrandBlock, PasswordInput, PasswordStrengthIndicator } from './components';
import { getSingleParam } from './routeParams';
import { useStackBack } from './useStackBack';

type NewPasswordErrors = { password?: string; confirmPassword?: string };

/** The form's fields, as `FormScreen` counts its children. */
const FIELD = { password: 0, confirmPassword: 1 } as const;

/**
 * Shared "set a new password" screen (Story 6.19; reused by Story 6.20) — auth frame E, on the form
 * pattern (Story 22.9): the brand block, then NEW PASSWORD with the strength meter and CONFIRM
 * PASSWORD; Update Password alone in the footer. After recovery begun from Home it is alone on the
 * stack, so it has no back and no header row. Begun from welcome, `dismissTo('/')` finds no Home, so
 * the screens beneath stay and its back shows, as the native header's did (Story 22.9, Found, not
 * fixed 22). Reached from Settings, Settings is beneath it and its back goes there.
 *
 * Assumes an authenticated session is already active — for recovery that is the
 * session returned by `verifyPasswordResetOtp`. It only validates the new
 * password and calls `updatePassword`; there is no deep-link/token handling
 * (that dead flow was removed with the old ResetPasswordScreen).
 *
 * Where a successful update navigates is driven by the `origin` route param so
 * the single `/new-password` route serves both flows without a wrapper (the
 * route file is a pure re-export). Recovery (6.19) lands on `/`; the Settings
 * change-password flow (6.20, `origin: 'change-password'`) confirms with a toast
 * and returns to the preserved `/settings` screen via `dismissTo`.
 */
const NewPasswordScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const onBack = useStackBack();
  const params = useLocalSearchParams<{ origin?: string | string[] }>();
  const origin = getSingleParam(params.origin);
  const isSettingsChangePassword = origin === 'change-password';

  const formRef = useRef<FormScreenHandle>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Errors appear at the first press of Update Password, then follow the typing.
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapUpdateError = useCallback(
    (message?: string) => {
      const normalizedMessage = message?.toLowerCase() ?? '';

      if (
        normalizedMessage.includes('network') ||
        normalizedMessage.includes('failed to fetch') ||
        normalizedMessage.includes('request failed')
      ) {
        return t('auth.newPassword.networkError');
      }

      return t('auth.newPassword.genericError');
    },
    [t]
  );

  const validate = useCallback((): NewPasswordErrors => {
    const errors: NewPasswordErrors = {};

    if (!password) {
      errors.password = t('auth.validation.passwordRequired');
    } else if (!isValidPassword(password)) {
      errors.password = t('auth.validation.passwordRule');
    }

    if (!confirmPassword) {
      errors.confirmPassword = t('auth.validation.confirmPasswordRequired');
    } else if (password !== confirmPassword) {
      errors.confirmPassword = t('auth.validation.passwordsMismatch');
    }

    return errors;
  }, [confirmPassword, password, t]);

  const fieldErrors = hasAttemptedSubmit ? validate() : {};

  const handleUpdatePassword = useCallback(async () => {
    setHasAttemptedSubmit(true);

    // Nothing is sent while a field is invalid. The first invalid field takes the focus and comes
    // into view with its message, even when it already had the focus; the keyboard stays.
    const errors = validate();
    if (errors.password) {
      passwordRef.current?.focus();
      formRef.current?.bringFieldIntoView(FIELD.password);
      return;
    }
    if (errors.confirmPassword) {
      confirmPasswordRef.current?.focus();
      formRef.current?.bringFieldIntoView(FIELD.confirmPassword);
      return;
    }

    // A request starts: the keyboard goes, and a failure's banner shows with the fields below it.
    // The banner stays until the next request starts.
    Keyboard.dismiss();
    setError(null);
    setLoading(true);

    try {
      const result = await updatePassword(password);

      if (!result.success) {
        setError(mapUpdateError(result.error.message));
        return;
      }

      if (isSettingsChangePassword) {
        // Story 6.20: confirm the change and return to the Settings screen that
        // launched the flow. The OTP screen preserved the back stack for this
        // origin, so dismissTo lands on the live /settings without duplicating it.
        await showToast({ title: t('settings.account.passwordChanged'), preset: 'done' });
        router.dismissTo('/settings');
        return;
      }

      router.replace('/');
    } catch {
      setError(t('auth.newPassword.genericError'));
    } finally {
      setLoading(false);
    }
  }, [isSettingsChangePassword, mapUpdateError, password, router, t, validate]);

  return (
    <FormScreen
      ref={formRef}
      testID="new-password-screen"
      onBack={onBack}
      openingBlock={
        <AuthBrandBlock
          heading={t('auth.newPassword.heading')}
          subtitle={t('auth.newPassword.subtitle')}
          headingTestID="new-password-title"
          subtitleTestID="new-password-subtitle"
        />
      }
      requestError={error}
      bannerTestID="server-error"
      keepFocusedFieldInView
      primaryAction={{
        label: t('auth.newPassword.button'),
        busyLabel: t('auth.busy.newPassword'),
        onPress: () => void handleUpdatePassword(),
        busy: loading,
        testID: 'update-password-button'
      }}
    >
      <View style={styles.passwordGroup}>
        <PasswordInput
          ref={passwordRef}
          testID="password-input"
          label={t('auth.fields.newPassword')}
          value={password}
          onChangeText={setPassword}
          placeholder={t('auth.placeholders.newPassword')}
          autoComplete="new-password"
          accessibilityHint={t('auth.accessibility.passwordRuleHint')}
          error={fieldErrors.password}
        />
        <PasswordStrengthIndicator password={password} />
      </View>

      <PasswordInput
        ref={confirmPasswordRef}
        testID="confirm-password-input"
        label={t('auth.fields.confirmPassword')}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder={t('auth.placeholders.confirmNewPassword')}
        autoComplete="new-password"
        accessibilityHint={t('auth.accessibility.confirmNewPasswordHint')}
        error={fieldErrors.confirmPassword}
      />
    </FormScreen>
  );
};

const styles = StyleSheet.create({
  // The meter sits 8 below the password field, below its message when one shows.
  passwordGroup: {
    gap: SPACING.sm
  }
});

export default NewPasswordScreen;

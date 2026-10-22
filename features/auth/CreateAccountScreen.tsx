import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, StyleSheet, type TextInput, View } from 'react-native';

import { isValidEmail, isValidPassword } from '@/core/auth/validation';
import { setConsentGiven } from '@/core/privacy/consent-repository';

import ConsentCheckbox from '@/shared/components/ConsentCheckbox';
import { FormScreen, type FormScreenHandle, TextField } from '@/shared/components/ui';
import { signUp } from '@/shared/supabase/auth';
import { SPACING } from '@/shared/theme/spacing';

import { AuthBrandBlock, AuthLink, PasswordInput, PasswordStrengthIndicator } from './components';
import { useStackBack } from './useStackBack';

type CreateAccountErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  consent?: string;
};

/** The form's fields, as `FormScreen` counts its children. */
const FIELD = { email: 0, password: 1, confirmPassword: 2, consent: 3 } as const;

/**
 * Create account — auth frame B, the longest form, on the form pattern (Story 22.9): the brand
 * block, then EMAIL; PASSWORD with the strength meter once something is typed; CONFIRM PASSWORD;
 * and the consent row. Create Account is the footer's, always enabled, with "Already have an
 * account? Sign in" under it. Unticked consent is a field error under its row, not a refusal.
 */
const CreateAccountScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const onBack = useStackBack();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const prefilledEmail = Array.isArray(params.email)
    ? (params.email[0] ?? '')
    : (params.email ?? '');

  const formRef = useRef<FormScreenHandle>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consent, setConsent] = useState(false);
  // Errors appear at the first press of Create Account, then follow the typing.
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapCreateAccountErrorMessage = useCallback(
    (code?: string, message?: string) => {
      const normalizedMessage = message?.toLowerCase() ?? '';

      if (
        code === 'user_already_exists' ||
        normalizedMessage.includes('already registered') ||
        normalizedMessage.includes('already been registered')
      ) {
        return t('auth.createAccount.accountExists');
      }

      if (
        normalizedMessage.includes('network') ||
        normalizedMessage.includes('failed to fetch') ||
        normalizedMessage.includes('request failed')
      ) {
        return t('auth.createAccount.networkError');
      }

      return t('auth.createAccount.genericError');
    },
    [t]
  );

  // A new email param (the code screen's "Wrong email? Go back") starts the form again.
  useEffect(() => {
    setEmail(prefilledEmail);
    setPassword('');
    setConfirmPassword('');
    setConsent(false);
    setLoading(false);
    setError(null);
    setHasAttemptedSubmit(false);
  }, [prefilledEmail]);

  const validate = useCallback((): CreateAccountErrors => {
    const errors: CreateAccountErrors = {};

    if (!email.trim()) {
      errors.email = t('auth.validation.emailRequired');
    } else if (!isValidEmail(email)) {
      errors.email = t('auth.validation.emailInvalid');
    }

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

    if (!consent) {
      errors.consent = t('auth.validation.consentRequired');
    }

    return errors;
  }, [confirmPassword, consent, email, password, t]);

  const fieldErrors = hasAttemptedSubmit ? validate() : {};

  const handleRegister = useCallback(async () => {
    setHasAttemptedSubmit(true);

    // Nothing is sent while a field is invalid. The first invalid field comes into view with its
    // message — a text field taking the focus, even when it already had it; the consent row, which
    // takes none, on its own — and the keyboard stays.
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      if (errors.email) {
        emailRef.current?.focus();
        formRef.current?.bringFieldIntoView(FIELD.email);
      } else if (errors.password) {
        passwordRef.current?.focus();
        formRef.current?.bringFieldIntoView(FIELD.password);
      } else if (errors.confirmPassword) {
        confirmPasswordRef.current?.focus();
        formRef.current?.bringFieldIntoView(FIELD.confirmPassword);
      } else {
        formRef.current?.bringFieldIntoView(FIELD.consent);
      }
      return;
    }

    // A request starts: the keyboard goes, and a failure's banner shows with the fields below it.
    // The banner stays until the next request starts.
    Keyboard.dismiss();
    setError(null);
    setLoading(true);

    try {
      const trimmedEmail = email.trim();
      const result = await signUp(trimmedEmail, password);

      if (!result.success) {
        setError(mapCreateAccountErrorMessage(result.error.code, result.error.message));
        return;
      }

      setConsentGiven();

      if (result.data.session) {
        router.replace('/');
      } else {
        router.push({
          pathname: '/verify-email',
          params: {
            email: trimmedEmail,
            sentAt: String(Date.now())
          }
        });
      }
    } catch {
      setError(t('auth.createAccount.genericError'));
    } finally {
      setLoading(false);
    }
  }, [email, mapCreateAccountErrorMessage, password, router, t, validate]);

  return (
    <FormScreen
      ref={formRef}
      testID="create-account-screen"
      onBack={onBack}
      openingBlock={
        <AuthBrandBlock
          heading={t('auth.createAccount.heading')}
          subtitle={t('auth.createAccount.subtitle')}
          headingTestID="create-account-title"
          subtitleTestID="create-account-subtitle"
        />
      }
      requestError={error}
      bannerTestID="server-error"
      keepFocusedFieldInView
      primaryAction={{
        label: t('auth.createAccount.button'),
        accessibilityLabel: t('common.actions.createAccount'),
        busyLabel: t('auth.busy.createAccount'),
        onPress: () => void handleRegister(),
        busy: loading,
        testID: 'register-button'
      }}
      footerLink={
        <AuthLink
          testID="sign-in-link"
          prefixText={t('auth.createAccount.alreadyHaveAccount')}
          actionText={t('auth.createAccount.signInAction')}
          onPress={() => router.push('/sign-in')}
          accessibilityLabel={t('common.actions.signIn')}
        />
      }
    >
      <TextField
        ref={emailRef}
        testID="email-input"
        label={t('auth.fields.email')}
        value={email}
        onChangeText={setEmail}
        placeholder={t('auth.placeholders.email')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        accessibilityLabel={t('auth.fields.email')}
        accessibilityHint={t('auth.accessibility.emailHint')}
        error={fieldErrors.email}
      />

      <View style={styles.passwordGroup}>
        <PasswordInput
          ref={passwordRef}
          testID="password-input"
          label={t('auth.fields.password')}
          value={password}
          onChangeText={setPassword}
          placeholder={t('auth.placeholders.newPassword')}
          autoComplete="new-password"
          accessibilityHint={t('auth.accessibility.passwordRuleHint')}
          error={fieldErrors.password}
        />
        {password.trim().length > 0 ? <PasswordStrengthIndicator password={password} /> : null}
      </View>

      <PasswordInput
        ref={confirmPasswordRef}
        testID="confirm-password-input"
        label={t('auth.fields.confirmPassword')}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder={t('auth.placeholders.confirmPassword')}
        autoComplete="new-password"
        accessibilityHint={t('auth.accessibility.confirmPasswordHint')}
        error={fieldErrors.confirmPassword}
      />

      <ConsentCheckbox checked={consent} onToggle={setConsent} error={fieldErrors.consent} />
    </FormScreen>
  );
};

const styles = StyleSheet.create({
  // The meter sits 8 below the password field, below its message when one shows.
  passwordGroup: {
    gap: SPACING.sm
  }
});

export default CreateAccountScreen;

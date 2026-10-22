import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, StyleSheet, type TextInput, View } from 'react-native';

import { isValidEmail } from '@/core/auth/validation';

import { FormScreen, type FormScreenHandle, TextField } from '@/shared/components/ui';
import { signInWithEmail } from '@/shared/supabase/auth';
import { SPACING } from '@/shared/theme/spacing';

import { AuthBrandBlock, AuthLink, PasswordInput } from './components';
import { useStackBack } from './useStackBack';

type SignInErrors = { email?: string; password?: string };

/** The form's fields, as `FormScreen` counts its children. */
const FIELD = { email: 0, password: 1 } as const;

/**
 * Sign in — auth frame A, the exemplar, on the form pattern (Story 22.9): the brand block leads the
 * body, then EMAIL and PASSWORD with "Forgot password?" under it at the row's end; Sign In is the
 * footer's, with "Don't have an account? Create one" under it. A failed request is the banner
 * (frame F) and reddens no field.
 */
const SignInScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const onBack = useStackBack();

  const formRef = useRef<FormScreenHandle>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Errors appear at the first press of Sign In, then follow the typing.
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapSignInErrorMessage = useCallback(
    (code?: string, message?: string) => {
      if (code === 'invalid_credentials') {
        return t('auth.signIn.incorrectCredentials');
      }

      if (code === 'email_not_confirmed') {
        return t('auth.signIn.emailNotConfirmed');
      }

      if (message?.toLowerCase().includes('invalid login credentials')) {
        return t('auth.signIn.incorrectCredentials');
      }

      if (message?.toLowerCase().includes('network')) {
        return t('auth.signIn.networkError');
      }

      if (message?.toLowerCase().includes('failed to fetch')) {
        return t('auth.signIn.networkError');
      }

      return t('auth.signIn.genericError');
    },
    [t]
  );

  const validate = useCallback((): SignInErrors => {
    const errors: SignInErrors = {};

    if (!email.trim()) {
      errors.email = t('auth.validation.emailRequired');
    } else if (!isValidEmail(email)) {
      errors.email = t('auth.validation.emailInvalid');
    }

    if (!password) {
      errors.password = t('auth.validation.passwordRequired');
    }

    return errors;
  }, [email, password, t]);

  const fieldErrors = hasAttemptedSubmit ? validate() : {};

  const handleSignIn = useCallback(async () => {
    setHasAttemptedSubmit(true);

    // Nothing is sent while a field is invalid. The first invalid field takes the focus and comes
    // into view with its message, even when it already had the focus; the keyboard stays.
    const errors = validate();
    if (errors.email) {
      emailRef.current?.focus();
      formRef.current?.bringFieldIntoView(FIELD.email);
      return;
    }
    if (errors.password) {
      passwordRef.current?.focus();
      formRef.current?.bringFieldIntoView(FIELD.password);
      return;
    }

    // A request starts: the keyboard goes, and a failure's banner shows with the fields below it.
    // The banner stays until the next request starts.
    Keyboard.dismiss();
    setError(null);
    setLoading(true);

    try {
      const result = await signInWithEmail(email.trim(), password);

      if (!result.success) {
        setError(mapSignInErrorMessage(result.error.code, result.error.message));
        return;
      }

      router.replace('/');
    } catch {
      setError(t('auth.signIn.networkError'));
    } finally {
      setLoading(false);
    }
  }, [email, mapSignInErrorMessage, password, router, t, validate]);

  return (
    <FormScreen
      ref={formRef}
      testID="sign-in-screen"
      onBack={onBack}
      openingBlock={
        <AuthBrandBlock
          heading={t('auth.signIn.heading')}
          subtitle={t('auth.signIn.subtitle')}
          headingTestID="sign-in-title"
          subtitleTestID="sign-in-subtitle"
        />
      }
      requestError={error}
      bannerTestID="server-error"
      keepFocusedFieldInView
      primaryAction={{
        label: t('auth.signIn.button'),
        accessibilityLabel: t('common.actions.signIn'),
        busyLabel: t('auth.busy.signIn'),
        onPress: () => void handleSignIn(),
        busy: loading,
        testID: 'sign-in-button'
      }}
      footerLink={
        <AuthLink
          testID="create-account-link"
          prefixText={t('auth.signIn.noAccountPrefix')}
          actionText={t('auth.signIn.noAccountAction')}
          onPress={() => router.push('/create-account')}
          accessibilityLabel={t('auth.signIn.noAccountAction')}
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
          placeholder={t('auth.placeholders.password')}
          autoComplete="current-password"
          accessibilityHint={t('auth.accessibility.passwordHint')}
          error={fieldErrors.password}
        />
        <AuthLink
          testID="forgot-password-link"
          align="end"
          actionText={t('auth.signIn.forgotPassword')}
          onPress={() => router.push('/forgot-password')}
          accessibilityLabel={t('auth.accessibility.forgotPassword')}
        />
      </View>
    </FormScreen>
  );
};

const styles = StyleSheet.create({
  // "Forgot password?" sits 8 below the password field, below its message when one shows.
  passwordGroup: {
    gap: SPACING.sm
  }
});

export default SignInScreen;

import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, type TextInput } from 'react-native';

import { isValidEmail } from '@/core/auth/validation';

import { FormScreen, type FormScreenHandle, TextField } from '@/shared/components/ui';
import { sendPasswordResetOtp } from '@/shared/supabase/auth';

import { AuthBrandBlock, AuthLink } from './components';
import { useStackBack } from './useStackBack';

/** The form's one field, as `FormScreen` counts its children. */
const EMAIL_FIELD = 0;

/**
 * Forgot password — auth frame C, the shortest form, on the form pattern (Story 22.9): the brand
 * block — the mark included, where it used to hide it — then EMAIL; Send Reset Code is the
 * footer's, with "Back to Sign In" under it. One back, the header's.
 */
const ForgotPasswordScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const onBack = useStackBack();

  const formRef = useRef<FormScreenHandle>(null);
  const emailRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  // The error appears at the first press of Send Reset Code, then follows the typing.
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapForgotPasswordErrorMessage = useCallback(
    (message?: string) => {
      const normalizedMessage = message?.toLowerCase() ?? '';

      if (
        normalizedMessage.includes('network') ||
        normalizedMessage.includes('failed to fetch') ||
        normalizedMessage.includes('request failed')
      ) {
        return t('auth.forgotPassword.networkError');
      }

      return t('auth.forgotPassword.genericError');
    },
    [t]
  );

  const validateEmail = useCallback((): string | undefined => {
    if (!email.trim()) {
      return t('auth.validation.emailRequired');
    }
    if (!isValidEmail(email)) {
      return t('auth.validation.emailInvalid');
    }
    return undefined;
  }, [email, t]);

  const emailError = hasAttemptedSubmit ? validateEmail() : undefined;

  const handleSendReset = useCallback(async () => {
    setHasAttemptedSubmit(true);

    // Nothing is sent while the email is invalid. The field takes the focus and comes into view
    // with its message, even when it already had the focus; the keyboard stays.
    if (validateEmail()) {
      emailRef.current?.focus();
      formRef.current?.bringFieldIntoView(EMAIL_FIELD);
      return;
    }

    // A request starts: the keyboard goes, and a failure's banner shows with the field below it.
    // The banner stays until the next request starts.
    Keyboard.dismiss();
    setError(null);
    setLoading(true);

    try {
      const trimmedEmail = email.trim();
      const result = await sendPasswordResetOtp(trimmedEmail);

      if (!result.success) {
        setError(mapForgotPasswordErrorMessage(result.error.message));
        return;
      }

      // Mirror the signup flow (CreateAccountScreen): hand off to the shared
      // OTP screen with the email + a send timestamp that seeds the resend
      // cooldown. This replaces the old "check your email" dead-end — the user
      // now enters the emailed code in-app.
      router.push({
        pathname: '/recovery-otp',
        params: {
          email: trimmedEmail,
          sentAt: String(Date.now())
        }
      });
    } catch {
      setError(t('auth.forgotPassword.genericError'));
    } finally {
      setLoading(false);
    }
  }, [email, mapForgotPasswordErrorMessage, router, t, validateEmail]);

  return (
    <FormScreen
      ref={formRef}
      testID="forgot-password-screen"
      onBack={onBack}
      openingBlock={
        <AuthBrandBlock
          heading={t('auth.forgotPassword.heading')}
          subtitle={t('auth.forgotPassword.subtitle')}
          headingTestID="forgot-password-title"
          subtitleTestID="forgot-password-subtitle"
        />
      }
      requestError={error}
      bannerTestID="server-error"
      keepFocusedFieldInView
      primaryAction={{
        label: t('auth.forgotPassword.sendResetCode'),
        accessibilityLabel: t('auth.accessibility.sendResetCode'),
        busyLabel: t('auth.busy.forgotPassword'),
        onPress: () => void handleSendReset(),
        busy: loading,
        testID: 'send-reset-button'
      }}
      footerLink={
        <AuthLink
          testID="back-to-sign-in-link"
          actionText={t('auth.forgotPassword.backToSignIn')}
          onPress={() => router.push('/sign-in')}
          accessibilityLabel={t('auth.accessibility.backToSignIn')}
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
        accessibilityHint={t('auth.accessibility.forgotPasswordEmailHint')}
        error={emailError}
      />
    </FormScreen>
  );
};

export default ForgotPasswordScreen;

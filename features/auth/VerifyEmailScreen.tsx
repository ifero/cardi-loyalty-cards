import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccessibilityInfo,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  type TextInput,
  View
} from 'react-native';

import { isValidEmail } from '@/core/auth/validation';

import { FormScreen, type FormScreenHandle, TextField } from '@/shared/components/ui';
import {
  type AuthResult,
  type AuthSession,
  resendVerificationEmail,
  sendPasswordResetOtp,
  verifyEmailOtp,
  verifyPasswordResetOtp
} from '@/shared/supabase/auth';
import { useTheme } from '@/shared/theme';
import { SPACING, TOUCH_TARGET } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import { AuthBrandBlock, AuthLink } from './components';
import { getSingleParam } from './routeParams';
import { useStackBack } from './useStackBack';

const OTP_LENGTH = 8;
const OTP_INPUT_MAX_LENGTH = OTP_LENGTH * 2;
const OTP_PATTERN = new RegExp(`^\\d{${OTP_LENGTH}}$`);
const RESEND_COOLDOWN_MS = 60_000;
const resendCooldownExpiryByFlow = new Map<string, number>();

/** The form's one field — the code, its resend row and the resent line — as `FormScreen` counts it. */
const CODE_FIELD = 0;

/** Tap feedback — the design system's 0.98× scale, as the system's text rows take it (§ _Elevation_). */
const PRESSED_SCALE = 0.98;

/**
 * The two OTP flows this screen serves (Story 6.19). `signup` verifies a new
 * account's email (`type: 'email'`); `recovery` verifies a password-reset code
 * (`type: 'recovery'`). The 8-digit field, cooldown and auto-submit are
 * identical — only the verify/resend calls, post-success route, wrong-email
 * fallback and display copy differ, all captured in `PURPOSE_CONFIG`.
 */
export type VerifyOtpPurpose = 'signup' | 'recovery';

type VerifyOtpRouter = ReturnType<typeof useRouter>;

type VerifyOtpConfig = {
  verify: (email: string, token: string) => Promise<AuthResult<AuthSession>>;
  resend: (email: string) => Promise<AuthResult<void>>;
  /** i18n keys — copy is the only thing that differs textually between flows. */
  copy: {
    heading: string;
    subtitle: string;
    confirm: string;
    resendCode: string;
    resendIn: string;
    wrongEmail: string;
    goBack: string;
    incorrectCode: string;
    expiredCode: string;
    verifyUnavailable: string;
    resendFailure: string;
    resendSuccess: string;
  };
  /**
   * Navigation after a successful verification. `context.origin` carries the
   * originating flow (Story 6.20): recovery clears the pushed screens, while
   * `change-password` (from Settings) preserves the back stack so the shared
   * NewPasswordScreen can return to /settings.
   */
  onVerified: (router: VerifyOtpRouter, context: { origin?: string }) => void;
  /**
   * Where the "wrong email?" link goes. Signup carries the current email back to
   * create-account; recovery goes to forgot-password — except the Settings
   * change-password origin (6.20), which cancels back to /settings.
   */
  onWrongEmail: (router: VerifyOtpRouter, context: { email: string; origin?: string }) => void;
  /** Auto-redirect when the email route param is missing/invalid. */
  onInvalidEmail: (router: VerifyOtpRouter) => void;
};

const PURPOSE_CONFIG: Record<VerifyOtpPurpose, VerifyOtpConfig> = {
  signup: {
    verify: verifyEmailOtp,
    resend: resendVerificationEmail,
    copy: {
      heading: 'auth.verifyEmail.heading',
      subtitle: 'auth.verifyEmail.subtitle',
      confirm: 'auth.verifyEmail.confirm',
      resendCode: 'auth.verifyEmail.resendCode',
      resendIn: 'auth.verifyEmail.resendIn',
      wrongEmail: 'auth.verifyEmail.wrongEmail',
      goBack: 'auth.verifyEmail.goBack',
      incorrectCode: 'auth.verifyEmail.incorrectCode',
      expiredCode: 'auth.verifyEmail.expiredCode',
      verifyUnavailable: 'auth.verifyEmail.verifyUnavailable',
      resendFailure: 'auth.verifyEmail.resendFailure',
      resendSuccess: 'auth.verifyEmail.resendSuccess'
    },
    onVerified: (router) => {
      router.dismissTo('/');
      router.replace('/');
    },
    onWrongEmail: (router, { email }) =>
      router.replace({ pathname: '/create-account', params: { email } }),
    onInvalidEmail: (router) => router.replace('/create-account')
  },
  recovery: {
    verify: verifyPasswordResetOtp,
    resend: sendPasswordResetOtp,
    copy: {
      heading: 'auth.recoveryOtp.heading',
      subtitle: 'auth.recoveryOtp.subtitle',
      confirm: 'auth.recoveryOtp.confirm',
      resendCode: 'auth.recoveryOtp.resendCode',
      resendIn: 'auth.recoveryOtp.resendIn',
      wrongEmail: 'auth.recoveryOtp.wrongEmail',
      goBack: 'auth.recoveryOtp.goBack',
      incorrectCode: 'auth.recoveryOtp.incorrectCode',
      expiredCode: 'auth.recoveryOtp.expiredCode',
      verifyUnavailable: 'auth.recoveryOtp.verifyUnavailable',
      resendFailure: 'auth.recoveryOtp.resendFailure',
      resendSuccess: 'auth.recoveryOtp.resendSuccess'
    },
    // The recovery session from verifyOtp is now active; hand off to the shared
    // new-password screen (which calls updatePassword). The stack handling
    // deliberately lives here, not in the shared NewPasswordScreen, because the
    // two origins need opposite behaviour.
    onVerified: (router, { origin }) => {
      if (origin === 'change-password') {
        // Story 6.20: reached from Settings. Preserve the back stack so the
        // shared NewPasswordScreen can dismissTo('/settings') on success, and
        // forward the origin so it picks the /settings destination + toast.
        router.replace({ pathname: '/new-password', params: { origin } });
        return;
      }

      // Recovery (6.19): clear the pushed forgot-password + recovery-otp screens
      // from the back stack (AC7, mirroring signup's dismiss) before replacing
      // the root with the new-password screen.
      router.dismissTo('/');
      router.replace('/new-password');
    },
    onWrongEmail: (router, { origin }) => {
      if (origin === 'change-password') {
        // Story 6.20: "wrong email?" from the Settings flow cancels back to the
        // preserved Settings screen rather than the anonymous recovery entry.
        router.dismissTo('/settings');
        return;
      }

      router.replace('/forgot-password');
    },
    onInvalidEmail: (router) => router.replace('/forgot-password')
  }
};

const buildCooldownFlowKey = (
  purpose: VerifyOtpPurpose,
  email: string,
  sentAt: string | undefined
) => `${purpose}::${email}::${sentAt ?? 'initial'}`;

const formatCooldown = (remainingSeconds: number) => {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const resolveInitialCooldownExpiry = (sentAt: string | undefined) => {
  const parsed = Number(sentAt);
  const baseTime = Number.isFinite(parsed) && parsed > 0 ? parsed : Date.now();
  return baseTime + RESEND_COOLDOWN_MS;
};

const resolvePersistedCooldownExpiry = (cooldownFlowKey: string, sentAt: string | undefined) =>
  resendCooldownExpiryByFlow.get(cooldownFlowKey) ?? resolveInitialCooldownExpiry(sentAt);

type ResendRowProps = {
  label: string;
  /** The cooldown has run out and no request is running: the row is a link. */
  available: boolean;
  /** A request is running — the resend's own, or the code's. */
  busy: boolean;
  onPress: () => void;
};

/**
 * The resend row (frame D), 16 below the code field and at least 48 tall, centred. While it counts
 * down it is text — "Resend in 0:42" in `body-md` muted — and cannot be pressed; the countdown is
 * what says why. While a request runs after the cooldown it reads "Resend code" in the same muted
 * text, disabled (review pass 2, row 34). Once available it is the link, "Resend code" in `body-md`
 * semibold `link`, and a press scales it to 0.98. Its name is the words it shows.
 */
const ResendRow = ({ label, available, busy, onPress }: ResendRowProps) => {
  const { theme } = useTheme();
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      testID="resend-code-button"
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={!available}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !available, busy }}
      style={[styles.resendRow, isPressed && available ? styles.pressed : null]}
    >
      <Text
        style={[
          available ? styles.resendLink : styles.resendCountdown,
          { color: available ? theme.link : theme.textSecondary }
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

/**
 * A resent code (frame D): one plain line, 8 below the resend row — `body-md` muted, centred, with
 * no box, icon or tint — announced politely: through the live region on Android and, queued, on
 * iOS, which has none.
 */
const ResentNotice = ({ message }: { message: string }) => {
  const { theme } = useTheme();

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibilityWithOptions?.(message, { queue: true });
    }
  }, [message]);

  return (
    <Text
      testID="resend-success"
      accessibilityLiveRegion="polite"
      style={[styles.resent, { color: theme.textSecondary }]}
    >
      {message}
    </Text>
  );
};

/**
 * The code — auth frame D, on the form pattern (Story 22.9), for both routes: `/verify-email` and,
 * through `RecoveryOtpScreen`, `/recovery-otp`. The brand block, its subtitle naming the address in
 * semibold ink; the one code field, labelled and focused; the resend row beneath it; Confirm in
 * the footer with "Wrong email? Go back" under it.
 *
 * - **The code.** 8 digits, digits only; a formatted paste of up to 16 characters is sanitised. The
 *   8th digit submits at once, and a request already running refuses a second. While either
 *   request runs — a code check or a resend — the field takes no input but does not dim.
 * - **Confirm** is always enabled. Pressed with fewer than 8 digits it says so under the field,
 *   which takes the focus and comes into view with the message. It is busy while either request
 *   runs, named for it: "Verifying..." or "Sending code..." (review pass 1).
 * - **A request** — the 8th digit, Confirm or a resend — dismisses the keyboard as it starts.
 * - **A failed request** — a wrong or expired code, the check or a resend failing — is the banner,
 *   and reddens nothing. It stays until the next request starts; an expired code also unlocks
 *   resend.
 * - **Resend** keeps its 60 s cooldown, whose absolute expiry survives a remount. A failed resend
 *   leaves it; a successful one clears the field, focuses it, restarts it and shows "Code resent…"
 *   as one plain line, which typing clears. The banner and that line never show together.
 */
const VerifyEmailScreen = ({ purpose = 'signup' }: { purpose?: VerifyOtpPurpose }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const onBack = useStackBack();
  const params = useLocalSearchParams<{
    email?: string | string[];
    sentAt?: string | string[];
    origin?: string | string[];
  }>();

  const config = PURPOSE_CONFIG[purpose];

  const email = getSingleParam(params.email) ?? '';
  const sentAt = getSingleParam(params.sentAt);
  const origin = getSingleParam(params.origin);
  const isEmailParamValid = isValidEmail(email);
  const cooldownFlowKey = useMemo(
    () => buildCooldownFlowKey(purpose, email, sentAt),
    [purpose, email, sentAt]
  );

  const formRef = useRef<FormScreenHandle>(null);
  const inputRef = useRef<TextInput | null>(null);
  const isVerifyingRef = useRef(false);

  const [otpValue, setOtpValue] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  // "Enter the 8-digit code." appears at a press of Confirm, then follows the typing.
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [resentMessage, setResentMessage] = useState<string | null>(null);
  const [cooldownExpiresAt, setCooldownExpiresAt] = useState(
    resolvePersistedCooldownExpiry(cooldownFlowKey, sentAt)
  );
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!isEmailParamValid) {
      config.onInvalidEmail(router);
    }
  }, [config, isEmailParamValid, router]);

  useEffect(() => {
    if (!isEmailParamValid) {
      return;
    }

    const nextExpiry = resolvePersistedCooldownExpiry(cooldownFlowKey, sentAt);
    resendCooldownExpiryByFlow.set(cooldownFlowKey, nextExpiry);
    setCooldownExpiresAt(nextExpiry);
    setNow(Date.now());
  }, [cooldownFlowKey, isEmailParamValid, sentAt]);

  useEffect(() => {
    if (cooldownExpiresAt <= Date.now()) {
      return undefined;
    }

    const interval = setInterval(() => {
      const nextNow = Date.now();
      setNow(nextNow);

      if (nextNow >= cooldownExpiresAt) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownExpiresAt]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const remainingSeconds = useMemo(
    () => Math.max(0, Math.ceil((cooldownExpiresAt - now) / 1000)),
    [cooldownExpiresAt, now]
  );
  const isOtpComplete = OTP_PATTERN.test(otpValue);
  const isRequestRunning = isVerifying || isResending;
  const isResendAvailable = !isRequestRunning && remainingSeconds === 0;
  const codeError =
    hasAttemptedSubmit && !isOtpComplete ? t('auth.validation.codeIncomplete') : undefined;

  const handleVerify = useCallback(
    async (code: string) => {
      if (
        !isEmailParamValid ||
        isVerifying ||
        isResending ||
        isVerifyingRef.current ||
        !OTP_PATTERN.test(code)
      ) {
        return;
      }

      // A request starts: the keyboard goes, and the banner and the resent line from the last one.
      // So does Confirm's short-code check, as a successful resend clears it: a code typed again
      // after this one is short until its eighth digit, which is no reason to say so (review pass 2).
      Keyboard.dismiss();
      setBannerMessage(null);
      setResentMessage(null);
      setHasAttemptedSubmit(false);
      isVerifyingRef.current = true;
      setIsVerifying(true);

      try {
        const result = await config.verify(email, code);

        if (!result.success) {
          if (result.error.code === 'invalid_otp') {
            setBannerMessage(t(config.copy.incorrectCode));
            return;
          }

          if (result.error.code === 'expired_otp') {
            const nextCooldownExpiresAt = Date.now();
            setBannerMessage(t(config.copy.expiredCode));
            resendCooldownExpiryByFlow.set(cooldownFlowKey, nextCooldownExpiresAt);
            setCooldownExpiresAt(nextCooldownExpiresAt);
            setNow(nextCooldownExpiresAt);
            return;
          }

          setBannerMessage(t(config.copy.verifyUnavailable));
          return;
        }

        config.onVerified(router, { origin });
      } catch {
        setBannerMessage(t(config.copy.verifyUnavailable));
      } finally {
        isVerifyingRef.current = false;
        setIsVerifying(false);
      }
    },
    [config, cooldownFlowKey, email, isEmailParamValid, isResending, isVerifying, origin, router, t]
  );

  const handleOtpChange = useCallback(
    (value: string) => {
      // While a request runs the field takes no input; it does not dim.
      if (isVerifying || isResending) {
        return;
      }

      const sanitized = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
      // Typing clears a resent line, as it always did; the banner waits for the next request.
      setResentMessage(null);
      setOtpValue(sanitized);

      if (sanitized.length === OTP_LENGTH) {
        void handleVerify(sanitized);
      }
    },
    [handleVerify, isResending, isVerifying]
  );

  const handleConfirm = useCallback(() => {
    setHasAttemptedSubmit(true);

    // Nothing is sent before the 8th digit: the field says so, takes the focus and comes into view
    // with the message, even when it already had the focus; the keyboard stays.
    if (!isOtpComplete) {
      inputRef.current?.focus();
      formRef.current?.bringFieldIntoView(CODE_FIELD);
      return;
    }

    void handleVerify(otpValue);
  }, [handleVerify, isOtpComplete, otpValue]);

  const handleResend = useCallback(async () => {
    if (!isResendAvailable || !isEmailParamValid) {
      return;
    }

    // A request starts: the keyboard goes, and the banner and the resent line from the last one.
    Keyboard.dismiss();
    setBannerMessage(null);
    setResentMessage(null);
    setIsResending(true);

    try {
      const result = await config.resend(email);

      if (!result.success) {
        setBannerMessage(t(config.copy.resendFailure));
        return;
      }

      const nextCooldownExpiresAt = Date.now() + RESEND_COOLDOWN_MS;
      resendCooldownExpiryByFlow.set(cooldownFlowKey, nextCooldownExpiresAt);
      setOtpValue('');
      setHasAttemptedSubmit(false);
      setResentMessage(t(config.copy.resendSuccess));
      setCooldownExpiresAt(nextCooldownExpiresAt);
      setNow(Date.now());
      inputRef.current?.focus();
    } catch {
      setBannerMessage(t(config.copy.resendFailure));
    } finally {
      setIsResending(false);
    }
  }, [config, cooldownFlowKey, email, isEmailParamValid, isResendAvailable, t]);

  if (!isEmailParamValid) {
    return null;
  }

  return (
    <FormScreen
      ref={formRef}
      testID="verify-email-screen"
      onBack={onBack}
      openingBlock={
        <AuthBrandBlock
          heading={t(config.copy.heading)}
          subtitle={t(config.copy.subtitle, { email })}
          emphasis={email}
          headingTestID="verify-email-title"
          subtitleTestID="verify-email-subtitle"
        />
      }
      requestError={bannerMessage}
      bannerTestID="verify-email-banner"
      keepFocusedFieldInView
      primaryAction={{
        label: t(config.copy.confirm),
        accessibilityLabel: t('auth.accessibility.confirmCode'),
        // Busy while either request runs, named for it, so a press or a keystroke the screen
        // refuses is never refused while it shows nothing at work (review pass 1).
        busyLabel: isResending ? t('auth.busy.resendCode') : t('auth.busy.verifyCode'),
        onPress: handleConfirm,
        busy: isRequestRunning,
        testID: 'confirm-code-button'
      }}
      footerLink={
        <AuthLink
          testID="wrong-email-link"
          prefixText={t(config.copy.wrongEmail)}
          actionText={t(config.copy.goBack)}
          onPress={() => config.onWrongEmail(router, { email, origin })}
          accessibilityLabel={t('auth.accessibility.wrongEmailGoBack')}
        />
      }
    >
      <View>
        <TextField
          ref={inputRef}
          testID="otp-input"
          label={t('auth.fields.verificationCode')}
          value={otpValue}
          onChangeText={handleOtpChange}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          maxLength={OTP_INPUT_MAX_LENGTH}
          selectTextOnFocus
          code
          placeholder={t('auth.placeholders.verificationCode')}
          accessibilityLabel={t('auth.accessibility.verificationCodeLabel')}
          accessibilityHint={t('auth.accessibility.verificationCodeHint')}
          error={codeError}
        />

        <View style={styles.resend}>
          <ResendRow
            label={
              remainingSeconds > 0
                ? t(config.copy.resendIn, { time: formatCooldown(remainingSeconds) })
                : t(config.copy.resendCode)
            }
            available={isResendAvailable}
            busy={isRequestRunning}
            onPress={() => void handleResend()}
          />
        </View>

        {resentMessage ? <ResentNotice message={resentMessage} /> : null}
      </View>
    </FormScreen>
  );
};

const styles = StyleSheet.create({
  // 16 below the code field, below its message when one shows.
  resend: {
    marginTop: SPACING.md
  },
  resendRow: {
    minHeight: TOUCH_TARGET.min,
    justifyContent: 'center',
    alignItems: 'center'
  },
  pressed: {
    transform: [{ scale: PRESSED_SCALE }]
  },
  resendCountdown: {
    ...TYPOGRAPHY.bodyMd,
    textAlign: 'center'
  },
  resendLink: {
    ...TYPOGRAPHY.bodyMdStrong,
    textAlign: 'center'
  },
  // 8 below the resend row.
  resent: {
    ...TYPOGRAPHY.bodyMd,
    textAlign: 'center',
    marginTop: SPACING.sm
  }
});

export default VerifyEmailScreen;

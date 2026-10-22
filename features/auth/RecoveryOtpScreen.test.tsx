/**
 * The recovery code — auth frame D on the form pattern (Story 22.9), the recovery purpose of the one
 * code screen (Story 6.19).
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { toast } from 'burnt';
import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';

import { FormScreen } from '@/shared/components/ui';
import { LIGHT_THEME } from '@/shared/theme/colors';

import RecoveryOtpScreen from './RecoveryOtpScreen';

// The real token values, so every role is checked against what the app paints.
jest.mock('@/shared/theme', () => {
  const { LIGHT_THEME: light } = jest.requireActual('@/shared/theme/colors');
  return {
    useTheme: () => ({ theme: light, isDark: false })
  };
});

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return {
    useSafeAreaInsets: () => ({ top: 59, right: 0, bottom: 34, left: 0 }),
    SafeAreaView: (props: Record<string, unknown>) => <View {...props} />
  };
});

const mockDismissTo = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn();
const mockParams: Record<string, string | undefined> = {};
let sentAtSeed = 0;

jest.mock('expo-router', () => ({
  useRouter: () => ({
    dismissTo: mockDismissTo,
    replace: mockReplace,
    back: mockBack,
    canGoBack: mockCanGoBack
  }),
  useLocalSearchParams: () => mockParams
}));

const mockVerifyPasswordResetOtp = jest.fn();
const mockSendPasswordResetOtp = jest.fn();
const mockVerifyEmailOtp = jest.fn();
const mockResendVerificationEmail = jest.fn();

jest.mock('@/shared/supabase/auth', () => ({
  verifyEmailOtp: (...args: unknown[]) => mockVerifyEmailOtp(...args),
  resendVerificationEmail: (...args: unknown[]) => mockResendVerificationEmail(...args),
  verifyPasswordResetOtp: (...args: unknown[]) => mockVerifyPasswordResetOtp(...args),
  sendPasswordResetOtp: (...args: unknown[]) => mockSendPasswordResetOtp(...args)
}));

const INCORRECT = 'Incorrect code. Please try again.';

/**
 * The text size, as `useWindowDimensions` reports it. React Native's Jest mock reports 2, an
 * accessibility size, at which the way-out link closes the body (decision 3), so every test here
 * runs at the device's default of 1, as the other auth suites do.
 */
let dimensions: jest.SpyInstance | undefined;

describe('RecoveryOtpScreen', () => {
  beforeEach(() => {
    dimensions = jest
      .spyOn(Dimensions, 'get')
      .mockReturnValue({ width: 393, height: 852, scale: 3, fontScale: 1 });
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(true);
    Object.keys(mockParams).forEach((key) => delete mockParams[key]);
    mockParams.email = 'test@example.com';
    mockParams.sentAt = String(Date.now() + sentAtSeed++);
  });

  afterEach(() => {
    dimensions?.mockRestore();
    dimensions = undefined;
    jest.useRealTimers();
  });

  it('draws frame D with the recovery heading and the sentence naming the address', () => {
    render(<RecoveryOtpScreen />);

    expect(screen.UNSAFE_getAllByType(FormScreen)).toHaveLength(1);
    expect(screen.getByTestId('auth-app-icon')).toBeTruthy();
    expect(screen.getByTestId('verify-email-title').props.children).toBe('Reset your password');
    expect(screen.getByText('We sent an 8-digit code to test@example.com')).toBeTruthy();
    expect(screen.getByTestId('otp-input')).toBeTruthy();
    expect(screen.getByText('Verification Code')).toBeTruthy();
    expect(screen.getByTestId('verify-email-screen-back')).toBeTruthy();
  });

  it('draws no header row with nothing beneath it', () => {
    mockCanGoBack.mockReturnValue(false);
    render(<RecoveryOtpScreen />);
    expect(screen.queryByTestId('verify-email-screen-header')).toBeNull();
  });

  it('auto-submits the recovery code and navigates to the new-password screen', async () => {
    mockVerifyPasswordResetOtp.mockResolvedValue({
      success: true,
      data: { user: { id: 'u1' }, session: { access_token: 'token' } }
    });

    render(<RecoveryOtpScreen />);

    fireEvent.changeText(screen.getByTestId('otp-input'), '12345678');

    await waitFor(() => {
      expect(mockVerifyPasswordResetOtp).toHaveBeenCalledWith('test@example.com', '12345678');
      // AC7: clear the pushed forgot-password + recovery-otp screens off the
      // back stack (dismissTo) before showing the new-password screen (replace).
      expect(mockDismissTo).toHaveBeenCalledWith('/');
      expect(mockReplace).toHaveBeenCalledWith('/new-password');
    });
    // Recovery must NOT reach the signup email-verify API.
    expect(mockVerifyEmailOtp).not.toHaveBeenCalled();
  });

  it('preserves the back stack and forwards origin when launched from Settings (Story 6.20)', async () => {
    mockVerifyPasswordResetOtp.mockResolvedValue({
      success: true,
      data: { user: { id: 'u1' }, session: { access_token: 'token' } }
    });
    mockParams.origin = 'change-password';

    render(<RecoveryOtpScreen />);

    fireEvent.changeText(screen.getByTestId('otp-input'), '12345678');

    await waitFor(() => {
      expect(mockVerifyPasswordResetOtp).toHaveBeenCalledWith('test@example.com', '12345678');
      // Change-password keeps Settings on the stack (no dismissTo) and forwards
      // the origin so NewPasswordScreen returns to /settings on success.
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/new-password',
        params: { origin: 'change-password' }
      });
    });
    expect(mockDismissTo).not.toHaveBeenCalled();
  });

  // Story 22.9: a wrong code is the banner, reddens no field, and stays until the next request.
  it('shows the incorrect-code error in the banner, keeping it while the code is edited', async () => {
    mockVerifyPasswordResetOtp.mockResolvedValue({
      success: false,
      error: { code: 'invalid_otp', message: 'bad code' }
    });

    render(<RecoveryOtpScreen />);

    fireEvent.changeText(screen.getByTestId('otp-input'), '12345678');

    await waitFor(() => {
      expect(screen.getByTestId('verify-email-banner')).toBeTruthy();
      expect(screen.getByText(INCORRECT)).toBeTruthy();
    });
    expect(StyleSheet.flatten(screen.getByTestId('otp-input').props.style).borderColor).toBe(
      LIGHT_THEME.border
    );
    expect(screen.queryByTestId('otp-input-error')).toBeNull();
    expect(toast).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByTestId('otp-input'), '1234567');
    expect(screen.getByText(INCORRECT)).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('shows the expired-code state and re-sends via sendPasswordResetOtp', async () => {
    mockVerifyPasswordResetOtp.mockResolvedValue({
      success: false,
      error: { code: 'expired_otp', message: 'expired' }
    });
    mockSendPasswordResetOtp.mockResolvedValue({ success: true, data: undefined });

    render(<RecoveryOtpScreen />);

    fireEvent.changeText(screen.getByTestId('otp-input'), '12345678');

    await waitFor(() => {
      expect(screen.getByText('This code has expired. Please request a new one.')).toBeTruthy();
      expect(screen.getByText('Resend code')).toBeTruthy();
    });
    expect(StyleSheet.flatten(screen.getByTestId('otp-input').props.style).borderColor).toBe(
      LIGHT_THEME.border
    );
    expect(screen.queryByTestId('otp-input-error')).toBeNull();
    expect(toast).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('resend-code-button'));

    await waitFor(() => {
      expect(mockSendPasswordResetOtp).toHaveBeenCalledWith('test@example.com');
      expect(mockResendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  it('shows a network banner when verification fails for connectivity', async () => {
    mockVerifyPasswordResetOtp.mockResolvedValue({
      success: false,
      error: { code: 'network_error', message: 'offline' }
    });

    render(<RecoveryOtpScreen />);

    fireEvent.changeText(screen.getByTestId('otp-input'), '12345678');

    await waitFor(() => {
      expect(
        screen.getByText("Couldn't verify right now. Check your connection and try again.")
      ).toBeTruthy();
    });
    expect(StyleSheet.flatten(screen.getByTestId('otp-input').props.style).borderColor).toBe(
      LIGHT_THEME.border
    );
    expect(screen.queryByTestId('otp-input-error')).toBeNull();
    expect(toast).not.toHaveBeenCalled();
  });

  it('redirects to forgot-password when the email param is missing', async () => {
    delete mockParams.email;

    render(<RecoveryOtpScreen />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/forgot-password');
    });
  });

  it('redirects to forgot-password when the email param is invalid', async () => {
    mockParams.email = 'not-an-email';

    render(<RecoveryOtpScreen />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/forgot-password');
    });
  });

  it('returns to forgot-password (no params) from the wrong-email link', () => {
    render(<RecoveryOtpScreen />);

    fireEvent.press(screen.getByTestId('wrong-email-link'));

    expect(mockReplace).toHaveBeenCalledWith('/forgot-password');
  });

  it('cancels back to /settings from the wrong-email link when launched from Settings (Story 6.20)', () => {
    mockParams.origin = 'change-password';

    render(<RecoveryOtpScreen />);

    fireEvent.press(screen.getByTestId('wrong-email-link'));

    expect(mockDismissTo).toHaveBeenCalledWith('/settings');
    expect(mockReplace).not.toHaveBeenCalledWith('/forgot-password');
  });

  it('tracks the resend cooldown seeded from sentAt', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-14T12:00:00.000Z'));
    mockParams.sentAt = String(Date.now());

    render(<RecoveryOtpScreen />);

    expect(screen.getByText('Resend in 1:00')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(18000);
    });

    expect(screen.getByText('Resend in 0:42')).toBeTruthy();
  });
});

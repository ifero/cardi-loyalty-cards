/**
 * The code — auth frame D, on the form pattern (Story 22.9), for the signup purpose; the recovery
 * purpose has its own suite (`RecoveryOtpScreen.test.tsx`).
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { toast } from 'burnt';
import React from 'react';
import {
  AccessibilityInfo,
  Dimensions,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput
} from 'react-native';

import { FormScreen, RequestErrorBanner } from '@/shared/components/ui';
import { changeAppLanguage } from '@/shared/i18n';
import { DARK_THEME, LIGHT_THEME, type Theme } from '@/shared/theme/colors';

import VerifyEmailScreen from './VerifyEmailScreen';

let mockIsDark = false;

// The real token values, so every role is checked against what the app paints.
jest.mock('@/shared/theme', () => {
  const { DARK_THEME: dark, LIGHT_THEME: light } = jest.requireActual('@/shared/theme/colors');
  return {
    useTheme: () => ({ theme: mockIsDark ? dark : light, isDark: mockIsDark })
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

const mockVerifyEmailOtp = jest.fn();
const mockResendVerificationEmail = jest.fn();
const mockVerifyPasswordResetOtp = jest.fn();
const mockSendPasswordResetOtp = jest.fn();

jest.mock('@/shared/supabase/auth', () => ({
  verifyEmailOtp: (...args: unknown[]) => mockVerifyEmailOtp(...args),
  resendVerificationEmail: (...args: unknown[]) => mockResendVerificationEmail(...args),
  verifyPasswordResetOtp: (...args: unknown[]) => mockVerifyPasswordResetOtp(...args),
  sendPasswordResetOtp: (...args: unknown[]) => mockSendPasswordResetOtp(...args)
}));

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

const expectInOrder = (testIDs: string[]) => {
  const tree = JSON.stringify(screen.toJSON());
  const order = testIDs.map((testID) => tree.indexOf(`"${testID}"`));
  expect(order.every((index) => index > -1)).toBe(true);
  expect([...order].sort((a, b) => a - b)).toEqual(order);
};

const typeCode = (value: string) => fireEvent.changeText(screen.getByTestId('otp-input'), value);
const pressConfirm = () => fireEvent.press(screen.getByTestId('confirm-code-button'));
const focusedInputs = (focus: jest.SpyInstance) =>
  focus.mock.contexts.map((input) => (input as { props: { testID?: string } }).props.testID);

/** A call that answers only when told to. */
const hold = (mock: jest.Mock) => {
  let answer: (value: unknown) => void = () => {};
  mock.mockImplementation(
    () =>
      new Promise((resolve) => {
        answer = resolve;
      })
  );
  return (value: unknown) => act(async () => answer(value));
};

/** Whether the node with this testID sits inside the one with `ancestorTestID`. */
const isInside = (testID: string, ancestorTestID: string) => {
  const ancestor = screen.getByTestId(ancestorTestID);
  let node = screen.getByTestId(testID).parent;
  while (node) {
    if (node === ancestor) return true;
    node = node.parent;
  }
  return false;
};

const CONTROL_ROLES = ['button', 'link', 'checkbox', 'switch', 'radio', 'imagebutton'];

type DrawnNode = {
  type: unknown;
  props: { testID?: string; onClick?: unknown; onPress?: unknown; accessibilityRole?: string };
};

/**
 * Every control the screen draws, by testID: whatever takes text, a press or a control's role. A
 * sign-in method added beside the form — another provider's button — would show up here.
 */
const controls = () =>
  screen.UNSAFE_root.findAll(
    (node: DrawnNode) =>
      typeof node.type === 'string' &&
      (node.type === 'TextInput' ||
        node.props.onClick !== undefined ||
        node.props.onPress !== undefined ||
        CONTROL_ROLES.includes(node.props.accessibilityRole ?? ''))
  ).map((node: DrawnNode) => node.props.testID ?? String(node.type));

const scrollTo = ScrollView.prototype.scrollTo as jest.Mock;

/** Reports a part of the form laid out, as React Native does: its top and its height. */
const layOut = (element: ReturnType<typeof screen.getByTestId>, y: number, height: number) =>
  fireEvent(element, 'layout', { nativeEvent: { layout: { x: 0, y, width: 345, height } } });

/**
 * Confirm's own handler, called as a press that reached it would call it: Confirm refuses presses
 * while it is busy, so only this reaches the guards behind it.
 */
const callConfirm = () =>
  act(() => {
    screen.UNSAFE_getByType(FormScreen).props.primaryAction.onPress();
  });

/**
 * The resend row's own handler, called as a press that reached it would call it: the row refuses
 * presses while it is not available, so only this reaches the guard behind it.
 */
const callResend = () =>
  act(() => {
    screen.UNSAFE_getAllByProps({ testID: 'resend-code-button' })[0]?.props.onPress();
  });

/**
 * The resend row while a request runs after the cooldown: "Resend code", but in the countdown's
 * `body-md` muted, not the link's semibold `link`, since it cannot be pressed. The old row read
 * "Resend in 0:00" then (#248 item 14).
 */
const expectBusyResendRow = () => {
  expect(screen.getByTestId('resend-code-button').props.accessibilityLabel).toBe('Resend code');
  expect(StyleSheet.flatten(screen.getByText('Resend code').props.style)).toMatchObject({
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '400',
    color: LIGHT_THEME.textSecondary
  });
};

const SESSION = { success: true, data: { user: { id: 'u1' }, session: { access_token: 't' } } };
const INCORRECT = 'Incorrect code. Please try again.';
const EXPIRED = 'This code has expired. Please request a new one.';
const UNAVAILABLE = "Couldn't verify right now. Check your connection and try again.";
const RESEND_FAILED = "Couldn't resend code. Try again.";
const RESENT = 'Code resent. Enter the newest code from your email.';

/**
 * The text size, as `useWindowDimensions` reports it. React Native's Jest mock reports 2, an
 * accessibility size, so every test sets one: the device's default of 1 unless it says otherwise.
 * From 1.5 the way-out link leaves the footer for the end of the body (decision 3).
 */
let dimensions: jest.SpyInstance | undefined;
const setFontScale = (fontScale: number) => {
  dimensions?.mockRestore();
  dimensions = jest
    .spyOn(Dimensions, 'get')
    .mockReturnValue({ width: 393, height: 852, scale: 3, fontScale });
};

describe('VerifyEmailScreen', () => {
  beforeEach(() => {
    setFontScale(1);
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(true);
    Object.keys(mockParams).forEach((key) => delete mockParams[key]);
    mockParams.email = 'test@example.com';
    mockParams.sentAt = String(Date.now() + sentAtSeed++);
  });

  afterEach(async () => {
    dimensions?.mockRestore();
    dimensions = undefined;
    jest.useRealTimers();
    mockIsDark = false;
    await act(async () => {
      await changeAppLanguage('en');
    });
  });

  describe('frame D', () => {
    it('draws one FormScreen, its header holding the back alone', () => {
      render(<VerifyEmailScreen />);
      expect(screen.UNSAFE_getAllByType(FormScreen)).toHaveLength(1);
      expect(screen.getByTestId('verify-email-screen')).toBeTruthy();
      expect(screen.queryByTestId('verify-email-screen-title')).toBeNull();
      fireEvent.press(screen.getByTestId('verify-email-screen-back'));
      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('draws no header row with nothing beneath it', () => {
      mockCanGoBack.mockReturnValue(false);
      render(<VerifyEmailScreen />);
      expect(screen.queryByTestId('verify-email-screen-header')).toBeNull();
    });

    it('leads with the mark, "Verify your email" and the sentence naming the address', () => {
      render(<VerifyEmailScreen />);
      expect(screen.getByTestId('auth-app-icon')).toBeTruthy();
      expect(screen.getByTestId('verify-email-title').props.children).toBe('Verify your email');
      expect(screen.getByTestId('verify-email-title').props.accessibilityRole).toBe('header');
      expect(screen.getByText('We sent an 8-digit code to test@example.com').props.testID).toBe(
        'verify-email-subtitle'
      );
    });

    it.each<[string, boolean, Theme]>([
      ['light', false, LIGHT_THEME],
      ['dark', true, DARK_THEME]
    ])('sets the address in semibold textPrimary within the sentence, in %s', (_s, dark, theme) => {
      mockIsDark = dark;
      render(<VerifyEmailScreen />);
      expect(StyleSheet.flatten(screen.getByText('test@example.com').props.style)).toMatchObject({
        fontWeight: '600',
        color: theme.textPrimary
      });
      expect(flat('verify-email-subtitle').color).toBe(theme.textSecondary);
      expect(flat('verify-email-screen').backgroundColor).toBe(theme.background);
    });

    it('draws the one code field, labelled, then the resend row, then Confirm and the way out', () => {
      render(<VerifyEmailScreen />);
      expect(screen.getByText('Verification Code')).toBeTruthy();
      expectInOrder([
        'verify-email-subtitle',
        'otp-input',
        'resend-code-button',
        'verify-email-screen-footer',
        'confirm-code-button',
        'wrong-email-link'
      ]);
      // Counting down from the minute the code was sent (pinned to the second under fake timers).
      expect(screen.getByText(/^Resend in \d:\d\d$/)).toBeTruthy();
      expect(screen.getByText('Wrong email? Go back')).toBeTruthy();
      expect(screen.getByTestId('confirm-code-button').props.accessibilityLabel).toBe('Confirm');
    });

    it('keeps the field’s name, hint, keyboard, autofill, paste room and select-on-focus', () => {
      render(<VerifyEmailScreen />);
      expect(screen.getByTestId('otp-input').props).toMatchObject({
        accessibilityLabel: '8-digit verification code',
        accessibilityHint: 'Enter the 8-digit code from your email',
        keyboardType: 'number-pad',
        autoComplete: 'one-time-code',
        maxLength: 16,
        selectTextOnFocus: true,
        placeholder: '8-digit code'
      });
    });

    it('sets the digits in mono-code-lg, tracked and centred, at least 48 tall', () => {
      render(<VerifyEmailScreen />);
      typeCode('2046');
      expect(flat('otp-input')).toMatchObject({
        fontFamily: 'JetBrains Mono',
        fontSize: 22,
        letterSpacing: 8,
        textAlign: 'center',
        minHeight: 48,
        borderWidth: 1
      });
    });

    it('focuses the field on mount', () => {
      const focus = jest.spyOn(TextInput.prototype, 'focus');
      try {
        render(<VerifyEmailScreen />);
        expect(focusedInputs(focus)).toEqual(['otp-input']);
      } finally {
        focus.mockRestore();
      }
    });

    it('speaks the language the app speaks', async () => {
      await act(async () => {
        await changeAppLanguage('it');
      });
      render(<VerifyEmailScreen />);
      expect(screen.getByText('Verifica la tua email')).toBeTruthy();
      expect(screen.getByText('Codice di verifica')).toBeTruthy();
      expect(
        screen.getByText('Abbiamo inviato un codice di 8 cifre a test@example.com')
      ).toBeTruthy();
      expect(screen.getByText(/^Invia di nuovo tra \d:\d\d$/)).toBeTruthy();
      expect(screen.getByText('Email sbagliata? Torna indietro')).toBeTruthy();
    });

    it('draws no MaterialIcons glyph', () => {
      render(<VerifyEmailScreen />);
      expect(screen.queryAllByTestId(/^icon-/, { includeHiddenElements: true })).toHaveLength(0);
    });

    // The Never list: no sign-in method is added, so these are all the controls there are.
    it('draws its own controls and no other', () => {
      render(<VerifyEmailScreen />);
      expect(controls()).toEqual([
        'verify-email-screen-back',
        'otp-input',
        'resend-code-button',
        'confirm-code-button',
        'wrong-email-link'
      ]);
    });

    // The focused field, with its label, is brought into view above the footer (Story 22.9): the
    // code with its resend row, one field.
    it('keeps the code in view as the focused field, its resend row with it', () => {
      render(<VerifyEmailScreen />);
      expect(isInside('otp-input', 'verify-email-screen-field-0')).toBe(true);
      expect(isInside('resend-code-button', 'verify-email-screen-field-0')).toBe(true);
    });
  });

  describe('the code', () => {
    // Regression guard (Story 6.19): with no `purpose` prop it stays the signup flow.
    it('defaults to the signup purpose — uses the email-verify API, not recovery', async () => {
      mockVerifyEmailOtp.mockResolvedValue(SESSION);
      render(<VerifyEmailScreen />);
      typeCode('12345678');

      await waitFor(() => {
        expect(mockVerifyEmailOtp).toHaveBeenCalledWith('test@example.com', '12345678');
        expect(mockDismissTo).toHaveBeenCalledWith('/');
        expect(mockReplace).toHaveBeenCalledWith('/');
      });
      expect(mockVerifyPasswordResetOtp).not.toHaveBeenCalled();
      expect(mockSendPasswordResetOtp).not.toHaveBeenCalled();
    });

    it('submits at the eighth digit and not before', async () => {
      mockVerifyEmailOtp.mockResolvedValue(SESSION);
      render(<VerifyEmailScreen />);
      ['1', '12', '123', '1234', '12345', '123456', '1234567'].forEach(typeCode);
      expect(mockVerifyEmailOtp).not.toHaveBeenCalled();

      typeCode('12345678');
      await waitFor(() =>
        expect(mockVerifyEmailOtp).toHaveBeenCalledWith('test@example.com', '12345678')
      );
    });

    it('sanitises a formatted paste of up to 16 characters before submitting', async () => {
      mockVerifyEmailOtp.mockResolvedValue(SESSION);
      render(<VerifyEmailScreen />);
      typeCode('1234 5678');
      await waitFor(() =>
        expect(mockVerifyEmailOtp).toHaveBeenCalledWith('test@example.com', '12345678')
      );
    });

    it('keeps digits only, and does not submit below 8', () => {
      render(<VerifyEmailScreen />);
      typeCode('ab12cd34e');
      expect(screen.getByTestId('otp-input').props.value).toBe('1234');
      expect(mockVerifyEmailOtp).not.toHaveBeenCalled();
    });

    it('does not fire a second verify while one is already in flight', async () => {
      const answer = hold(mockVerifyEmailOtp);
      render(<VerifyEmailScreen />);
      typeCode('12345678');
      await waitFor(() => expect(mockVerifyEmailOtp).toHaveBeenCalledTimes(1));

      pressConfirm();
      expect(mockVerifyEmailOtp).toHaveBeenCalledTimes(1);
      await answer(SESSION);
    });

    it('redirects to create-account and draws nothing when the email param is missing', async () => {
      delete mockParams.email;
      render(<VerifyEmailScreen />);
      await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/create-account'));
      expect(screen.toJSON()).toBeNull();
    });

    it('redirects to create-account when the email param is invalid', async () => {
      mockParams.email = 'not-an-email';
      render(<VerifyEmailScreen />);
      await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/create-account'));
      expect(screen.toJSON()).toBeNull();
    });

    it('returns to create-account with the address from the wrong-email link', () => {
      render(<VerifyEmailScreen />);
      fireEvent.press(screen.getByTestId('wrong-email-link'));
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/create-account',
        params: { email: 'test@example.com' }
      });
    });
  });

  describe('Confirm', () => {
    it('is always enabled, and with fewer than 8 digits says so under the field and focuses it', () => {
      const focus = jest.spyOn(TextInput.prototype, 'focus');
      try {
        render(<VerifyEmailScreen />);
        const button = screen.getByTestId('confirm-code-button');
        expect(button.props.accessibilityState).toMatchObject({ disabled: false, busy: false });

        typeCode('1234');
        focus.mockClear();
        pressConfirm();
        expect(screen.getByTestId('otp-input-error').props.children).toBe(
          'Enter the 8-digit code.'
        );
        expect(focusedInputs(focus)).toEqual(['otp-input']);
        expect(mockVerifyEmailOtp).not.toHaveBeenCalled();
        expect(flat('otp-input').borderColor).toBe(LIGHT_THEME.error);
      } finally {
        focus.mockRestore();
      }
    });

    it('keeps the message while the code is short, and submits at the eighth digit', async () => {
      mockVerifyEmailOtp.mockResolvedValue(SESSION);
      render(<VerifyEmailScreen />);
      pressConfirm();
      typeCode('1234567');
      expect(screen.getByText('Enter the 8-digit code.')).toBeTruthy();

      typeCode('12345678');
      expect(screen.queryByText('Enter the 8-digit code.')).toBeNull();
      await waitFor(() => expect(mockVerifyEmailOtp).toHaveBeenCalledTimes(1));
    });

    it('submits a whole code when pressed', async () => {
      mockVerifyEmailOtp.mockResolvedValue({ success: false, error: { code: 'invalid_otp' } });
      render(<VerifyEmailScreen />);
      typeCode('12345678');
      await waitFor(() => expect(screen.getByText(INCORRECT)).toBeTruthy());

      mockVerifyEmailOtp.mockResolvedValue(SESSION);
      pressConfirm();
      await waitFor(() => expect(mockVerifyEmailOtp).toHaveBeenCalledTimes(2));
    });

    // Review pass 2: a press on a whole code starts a check, which clears the short-code check, so
    // a code typed again after a rejected one is not called short, nor reddened, under the banner.
    it('does not call a code short while it is typed again after a rejected one', async () => {
      mockVerifyEmailOtp.mockResolvedValue({ success: false, error: { code: 'invalid_otp' } });
      render(<VerifyEmailScreen />);
      typeCode('12345678');
      await waitFor(() => expect(screen.getByText(INCORRECT)).toBeTruthy());

      pressConfirm();
      await waitFor(() => expect(mockVerifyEmailOtp).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(screen.getByText(INCORRECT)).toBeTruthy());

      typeCode('1234567');
      expect(screen.queryByTestId('otp-input-error')).toBeNull();
      expect(flat('otp-input').borderColor).not.toBe(LIGHT_THEME.error);
    });

    it('is busy while the code is checked: a spinner named "Verifying..." over its fill', async () => {
      const answer = hold(mockVerifyEmailOtp);
      render(<VerifyEmailScreen />);
      typeCode('12345678');

      const button = screen.getByTestId('confirm-code-button');
      expect(screen.getByTestId('confirm-code-button-spinner')).toBeTruthy();
      expect(button.props.accessibilityLabel).toBe('Verifying...');
      expect(button.props.accessibilityState).toMatchObject({ busy: true, disabled: false });
      expect(flat('confirm-code-button-container').backgroundColor).toBe(LIGHT_THEME.primary);

      // The field ignores input but does not dim.
      typeCode('87654321');
      expect(screen.getByTestId('otp-input').props.value).toBe('12345678');
      expect(screen.getByTestId('otp-input').props.editable).toBe(true);
      expect(flat('otp-input').backgroundColor).toBe(LIGHT_THEME.surface);
      expect(flat('verify-email-screen').opacity).toBeUndefined();

      await answer(SESSION);
    });

    it('is named in the language the app speaks while the code is checked', async () => {
      await act(async () => {
        await changeAppLanguage('it');
      });
      const answer = hold(mockVerifyEmailOtp);
      render(<VerifyEmailScreen />);
      typeCode('12345678');
      expect(screen.getByTestId('confirm-code-button').props.accessibilityLabel).toBe(
        'Verifica in corso...'
      );
      await answer(SESSION);
    });

    it('says a short code is short in the language the app speaks', async () => {
      await act(async () => {
        await changeAppLanguage('it');
      });
      render(<VerifyEmailScreen />);
      typeCode('1234');
      pressConfirm();
      expect(screen.getByTestId('otp-input-error').props.children).toBe(
        'Inserisci il codice a 8 cifre.'
      );
    });

    // Review pass 1: no press is refused out of sight. The field already has the focus, so focusing
    // it again moves nothing: the press brings it, its resend row and the message into view. The
    // keyboard up and large text leave the body 200 tall, the code's field 300 into the content.
    it('brings the code into view at a refused press, its message with it, keeping the keyboard', () => {
      const dismiss = jest.spyOn(Keyboard, 'dismiss');
      try {
        render(<VerifyEmailScreen />);
        layOut(screen.UNSAFE_getByType(ScrollView), 0, 200);
        layOut(screen.getByTestId('verify-email-screen-fields'), 300, 150);
        layOut(screen.getByTestId('verify-email-screen-field-0'), 0, 150);
        typeCode('1234');

        pressConfirm();
        // Its bottom is 450: 450 + 24 − 200.
        expect(scrollTo).toHaveBeenLastCalledWith({ y: 274, animated: true });
        // The message makes it 174 tall: the body spares 13 on each side.
        layOut(screen.getByTestId('verify-email-screen-field-0'), 0, 174);
        expect(scrollTo).toHaveBeenLastCalledWith({ y: 287, animated: true });
        expect(dismiss).not.toHaveBeenCalled();
      } finally {
        dismiss.mockRestore();
      }
    });

    // Review pass 1: nothing is typed while a request runs, and a failure's banner then shows with
    // the field below it rather than behind the footer.
    it('dismisses the keyboard as the eighth digit’s check starts', async () => {
      const dismiss = jest.spyOn(Keyboard, 'dismiss');
      try {
        const answer = hold(mockVerifyEmailOtp);
        render(<VerifyEmailScreen />);
        typeCode('1234567');
        expect(dismiss).not.toHaveBeenCalled();

        typeCode('12345678');
        expect(dismiss).toHaveBeenCalledTimes(1);
        expect(dismiss.mock.invocationCallOrder[0]).toBeLessThan(
          mockVerifyEmailOtp.mock.invocationCallOrder[0] ?? 0
        );
        await answer({ success: false, error: { code: 'invalid_otp' } });
      } finally {
        dismiss.mockRestore();
      }
    });

    // Review pass 1: a press that validation refuses starts no request, so the banner stays.
    it('keeps the banner through a press refused for a short code', async () => {
      mockVerifyEmailOtp.mockResolvedValue({ success: false, error: { code: 'invalid_otp' } });
      render(<VerifyEmailScreen />);
      typeCode('12345678');
      await waitFor(() => expect(screen.getByText(INCORRECT)).toBeTruthy());

      typeCode('1234');
      pressConfirm();
      expect(screen.getByTestId('otp-input-error')).toBeTruthy();
      expect(screen.getByText(INCORRECT)).toBeTruthy();
      expect(mockVerifyEmailOtp).toHaveBeenCalledTimes(1);
    });
  });

  describe('frame F: a failed request', () => {
    const failWith = async (outcome: unknown, shown: string) => {
      mockVerifyEmailOtp.mockResolvedValue(outcome);
      render(<VerifyEmailScreen />);
      typeCode('12345678');
      await waitFor(() => expect(screen.getByText(shown)).toBeTruthy());
    };

    it('shows a wrong code in one banner, above the field, reddening nothing', async () => {
      await failWith({ success: false, error: { code: 'invalid_otp', message: 'bad' } }, INCORRECT);
      expect(screen.UNSAFE_getAllByType(RequestErrorBanner)).toHaveLength(1);
      expect(screen.getByTestId('verify-email-banner').props.accessibilityRole).toBe('alert');
      expectInOrder(['verify-email-subtitle', 'verify-email-banner', 'otp-input']);
      expect(flat('otp-input').borderColor).toBe(LIGHT_THEME.border);
      expect(screen.queryByTestId('otp-input-error')).toBeNull();
      expect(toast).not.toHaveBeenCalled();
      expect(screen.getByTestId('confirm-code-button').props.accessibilityState.disabled).toBe(
        false
      );
    });

    it('keeps the banner while the code is edited, until the next request starts', async () => {
      await failWith({ success: false, error: { code: 'invalid_otp' } }, INCORRECT);
      typeCode('1234567');
      expect(screen.getByText(INCORRECT)).toBeTruthy();

      const answer = hold(mockVerifyEmailOtp);
      typeCode('12345670');
      expect(screen.queryByTestId('verify-email-banner')).toBeNull();
      await answer(SESSION);
    });

    it('shows an expired code in the banner, and unlocks resend', async () => {
      await failWith(
        { success: false, error: { code: 'expired_otp', message: 'expired' } },
        EXPIRED
      );
      expect(screen.getByTestId('verify-email-banner')).toBeTruthy();
      expect(screen.getByText('Resend code')).toBeTruthy();
      expect(flat('otp-input').borderColor).toBe(LIGHT_THEME.border);
      expect(screen.queryByTestId('otp-input-error')).toBeNull();
      expect(toast).not.toHaveBeenCalled();

      mockResendVerificationEmail.mockResolvedValue({ success: true, data: undefined });
      fireEvent.press(screen.getByTestId('resend-code-button'));
      await waitFor(() =>
        expect(mockResendVerificationEmail).toHaveBeenCalledWith('test@example.com')
      );
    });

    it('keeps resend unlocked after an expired code when the screen remounts', async () => {
      mockVerifyEmailOtp.mockResolvedValue({ success: false, error: { code: 'expired_otp' } });
      const view = render(<VerifyEmailScreen />);
      typeCode('12345678');
      await waitFor(() => expect(screen.getByText('Resend code')).toBeTruthy());

      view.unmount();
      render(<VerifyEmailScreen />);
      expect(screen.getByText('Resend code')).toBeTruthy();
    });

    it('shows a check that cannot be made in the banner', async () => {
      await failWith(
        { success: false, error: { code: 'network_error', message: 'offline' } },
        UNAVAILABLE
      );
      expect(screen.getByTestId('verify-email-banner')).toBeTruthy();
      expect(flat('otp-input').borderColor).toBe(LIGHT_THEME.border);
      expect(screen.queryByTestId('otp-input-error')).toBeNull();
      expect(toast).not.toHaveBeenCalled();
    });

    it('shows a check that throws in the banner', async () => {
      mockVerifyEmailOtp.mockRejectedValue(new Error('boom'));
      render(<VerifyEmailScreen />);
      typeCode('12345678');
      await waitFor(() => expect(screen.getByText(UNAVAILABLE)).toBeTruthy());
    });
  });

  describe('resend', () => {
    beforeEach(() => {
      // The cooldown has run out.
      mockParams.sentAt = String(Date.now() - 60_000);
    });

    it('is the link once available: body-md semibold in link, scaling 0.98 while pressed', () => {
      render(<VerifyEmailScreen />);
      expect(StyleSheet.flatten(screen.getByText('Resend code').props.style)).toMatchObject({
        fontFamily: 'Inter',
        fontSize: 15,
        fontWeight: '600',
        color: LIGHT_THEME.link
      });
      const row = screen.getByTestId('resend-code-button');
      expect(row.props.accessibilityLabel).toBe('Resend code');
      expect(row.props.accessibilityState).toMatchObject({ disabled: false, busy: false });
      expect(flat('resend-code-button')).toMatchObject({ minHeight: 48, alignItems: 'center' });

      fireEvent(row, 'pressIn');
      expect(flat('resend-code-button').transform).toEqual([{ scale: 0.98 }]);
      fireEvent(row, 'pressOut');
      expect(flat('resend-code-button').transform).toBeUndefined();
    });

    it('sits 16 below the field', () => {
      render(<VerifyEmailScreen />);
      let holder = screen.getByTestId('resend-code-button').parent;
      while (holder && typeof holder.type !== 'string') {
        holder = holder.parent;
      }
      expect(StyleSheet.flatten(holder?.props.style).marginTop).toBe(16);
    });

    it('clears and focuses the field and shows "Code resent…" as one plain line', async () => {
      const focus = jest.spyOn(TextInput.prototype, 'focus');
      const announce = AccessibilityInfo.announceForAccessibilityWithOptions as jest.Mock;
      const platform = jest.replaceProperty(Platform, 'OS', 'ios');
      try {
        mockResendVerificationEmail.mockResolvedValue({ success: true, data: undefined });
        render(<VerifyEmailScreen />);
        typeCode('1234');
        focus.mockClear();

        fireEvent.press(screen.getByTestId('resend-code-button'));
        await waitFor(() => expect(screen.getByTestId('resend-success')).toBeTruthy());

        expect(screen.getByTestId('otp-input').props.value).toBe('');
        expect(focusedInputs(focus)).toEqual(['otp-input']);
        expect(screen.getByText(/^Resend in /)).toBeTruthy();

        const line = screen.getByTestId('resend-success');
        expect(line.props.children).toBe(RESENT);
        expect(line.props.accessibilityLiveRegion).toBe('polite');
        expect(announce).toHaveBeenCalledWith(RESENT, { queue: true });
        const style = flat('resend-success');
        expect(style).toMatchObject({
          fontSize: 15,
          fontWeight: '400',
          color: LIGHT_THEME.textSecondary,
          textAlign: 'center',
          marginTop: 8
        });
        // No box, no tint, no icon.
        expect(style.backgroundColor).toBeUndefined();
        expect(style.borderWidth).toBeUndefined();
        expect(screen.queryAllByTestId(/^icon-/, { includeHiddenElements: true })).toHaveLength(0);
        expectInOrder(['otp-input', 'resend-code-button', 'resend-success']);
      } finally {
        platform.restore();
        focus.mockRestore();
      }
    });

    it('clears the resent line once the code is typed', async () => {
      mockResendVerificationEmail.mockResolvedValue({ success: true, data: undefined });
      render(<VerifyEmailScreen />);
      fireEvent.press(screen.getByTestId('resend-code-button'));
      await waitFor(() => expect(screen.getByTestId('resend-success')).toBeTruthy());

      typeCode('1');
      expect(screen.queryByTestId('resend-success')).toBeNull();
    });

    it('does not show "Enter the 8-digit code." for the field it has just cleared', async () => {
      mockResendVerificationEmail.mockResolvedValue({ success: true, data: undefined });
      render(<VerifyEmailScreen />);
      pressConfirm();
      expect(screen.getByTestId('otp-input-error')).toBeTruthy();

      fireEvent.press(screen.getByTestId('resend-code-button'));
      await waitFor(() => expect(screen.getByTestId('resend-success')).toBeTruthy());
      expect(screen.queryByTestId('otp-input-error')).toBeNull();
    });

    it('shows a failed resend in the banner and leaves the cooldown as it was', async () => {
      mockParams.email = 'failure@example.com';
      mockResendVerificationEmail.mockResolvedValue({
        success: false,
        error: { message: 'rate limited' }
      });
      render(<VerifyEmailScreen />);
      fireEvent.press(screen.getByTestId('resend-code-button'));

      await waitFor(() => expect(screen.getByText(RESEND_FAILED)).toBeTruthy());
      expect(mockResendVerificationEmail).toHaveBeenCalledWith('failure@example.com');
      expect(screen.getByTestId('verify-email-banner')).toBeTruthy();
      expect(screen.getByText('Resend code')).toBeTruthy();
      expect(flat('otp-input').borderColor).toBe(LIGHT_THEME.border);
      expect(screen.queryByTestId('otp-input-error')).toBeNull();
      expect(toast).not.toHaveBeenCalled();
    });

    it('shows a resend that throws in the banner', async () => {
      mockResendVerificationEmail.mockRejectedValue(new Error('boom'));
      render(<VerifyEmailScreen />);
      fireEvent.press(screen.getByTestId('resend-code-button'));
      await waitFor(() => expect(screen.getByText(RESEND_FAILED)).toBeTruthy());
    });

    // Review pass 1: Confirm is busy while either request runs, named for it, so a press on it, or a
    // keystroke, is never refused while the screen shows nothing at work.
    it('reports busy on the row while it resends, and Confirm is busy too, "Sending code..."', async () => {
      const answer = hold(mockResendVerificationEmail);
      render(<VerifyEmailScreen />);
      fireEvent.press(screen.getByTestId('resend-code-button'));

      expect(screen.getByTestId('resend-code-button').props.accessibilityState).toMatchObject({
        busy: true,
        disabled: true
      });
      expectBusyResendRow();
      const confirm = screen.getByTestId('confirm-code-button');
      expect(screen.getByTestId('confirm-code-button-spinner')).toBeTruthy();
      expect(confirm.props.accessibilityLabel).toBe('Sending code...');
      expect(confirm.props.accessibilityState).toMatchObject({ busy: true, disabled: false });
      expect(flat('confirm-code-button-container').backgroundColor).toBe(LIGHT_THEME.primary);
      // Nothing dims while it resends.
      expect(screen.getByTestId('otp-input').props.editable).toBe(true);
      expect(flat('otp-input').backgroundColor).toBe(LIGHT_THEME.surface);
      expect(flat('verify-email-screen').opacity).toBeUndefined();

      await answer({ success: true, data: undefined });
      expect(screen.getByTestId('confirm-code-button').props.accessibilityLabel).toBe('Confirm');
    });

    it('names Confirm in the language the app speaks while it resends', async () => {
      await act(async () => {
        await changeAppLanguage('it');
      });
      const answer = hold(mockResendVerificationEmail);
      render(<VerifyEmailScreen />);
      fireEvent.press(screen.getByTestId('resend-code-button'));
      expect(screen.getByTestId('confirm-code-button').props.accessibilityLabel).toBe(
        'Invio del codice...'
      );
      await answer({ success: true, data: undefined });
    });

    // An expired code leaves its eight digits in the field and unlocks resend, so both requests can
    // be asked for at once. While a resend runs, nothing checks a code.
    it('checks no code while a resend runs: not at Confirm, nor from the field', async () => {
      mockVerifyEmailOtp.mockResolvedValue({ success: false, error: { code: 'expired_otp' } });
      render(<VerifyEmailScreen />);
      typeCode('12345678');
      await waitFor(() => expect(screen.getByText(EXPIRED)).toBeTruthy());
      expect(mockVerifyEmailOtp).toHaveBeenCalledTimes(1);

      const answer = hold(mockResendVerificationEmail);
      fireEvent.press(screen.getByTestId('resend-code-button'));
      expect(mockResendVerificationEmail).toHaveBeenCalledTimes(1);
      // The resend clears the expired code's banner as it starts, not once it answers.
      expect(screen.queryByTestId('verify-email-banner')).toBeNull();
      pressConfirm();
      callConfirm();
      typeCode('87654321');
      expect(screen.getByTestId('otp-input').props.value).toBe('12345678');
      expect(mockVerifyEmailOtp).toHaveBeenCalledTimes(1);

      await answer({ success: true, data: undefined });
    });

    // The cooldown has run out, so the row is the link until the eighth digit starts a check.
    it('resends nothing while a code is checked', async () => {
      const answer = hold(mockVerifyEmailOtp);
      render(<VerifyEmailScreen />);
      expect(screen.getByText('Resend code')).toBeTruthy();
      typeCode('12345678');

      const row = screen.getByTestId('resend-code-button');
      expect(row.props.accessibilityState).toMatchObject({ busy: true, disabled: true });
      expectBusyResendRow();
      fireEvent.press(row);
      callResend();
      expect(mockResendVerificationEmail).not.toHaveBeenCalled();

      await answer({ success: false, error: { code: 'invalid_otp' } });
    });

    // Review pass 1: a resend is a request too. The keyboard comes back with the field's focus once
    // the new code is on its way.
    it('dismisses the keyboard as a resend starts', async () => {
      const dismiss = jest.spyOn(Keyboard, 'dismiss');
      try {
        const answer = hold(mockResendVerificationEmail);
        render(<VerifyEmailScreen />);
        fireEvent.press(screen.getByTestId('resend-code-button'));
        expect(dismiss).toHaveBeenCalledTimes(1);
        expect(dismiss.mock.invocationCallOrder[0]).toBeLessThan(
          mockResendVerificationEmail.mock.invocationCallOrder[0] ?? 0
        );
        await answer({ success: true, data: undefined });
      } finally {
        dismiss.mockRestore();
      }
    });

    // The banner and the resent line never show together: a successful resend clears the banner
    // the expired code left.
    it('clears an expired code’s banner when it succeeds', async () => {
      mockVerifyEmailOtp.mockResolvedValue({ success: false, error: { code: 'expired_otp' } });
      mockResendVerificationEmail.mockResolvedValue({ success: true, data: undefined });
      render(<VerifyEmailScreen />);
      typeCode('12345678');
      await waitFor(() => expect(screen.getByText(EXPIRED)).toBeTruthy());

      fireEvent.press(screen.getByTestId('resend-code-button'));
      await waitFor(() => expect(screen.getByTestId('resend-success')).toBeTruthy());
      expect(screen.queryByTestId('verify-email-banner')).toBeNull();
      expect(screen.queryByText(EXPIRED)).toBeNull();
    });

    it('never shows the resent line and the banner together', async () => {
      mockResendVerificationEmail.mockResolvedValue({ success: true, data: undefined });
      mockVerifyEmailOtp.mockResolvedValue({ success: false, error: { code: 'invalid_otp' } });
      render(<VerifyEmailScreen />);
      fireEvent.press(screen.getByTestId('resend-code-button'));
      await waitFor(() => expect(screen.getByTestId('resend-success')).toBeTruthy());

      typeCode('12345678');
      await waitFor(() => expect(screen.getByTestId('verify-email-banner')).toBeTruthy());
      expect(screen.queryByTestId('resend-success')).toBeNull();
    });
  });

  // Fake timers last: a fake-timer test early in a file can stall the async tests after it.
  describe('the cooldown', () => {
    it('counts down as text, then restarts after a successful resend', async () => {
      mockResendVerificationEmail.mockResolvedValue({ success: true, data: undefined });
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-04-29T12:00:00.000Z'));
      mockParams.sentAt = String(Date.now());

      render(<VerifyEmailScreen />);
      expect(screen.getByText('Resend in 1:00')).toBeTruthy();
      expect(StyleSheet.flatten(screen.getByText('Resend in 1:00').props.style)).toMatchObject({
        fontFamily: 'Inter',
        fontSize: 15,
        fontWeight: '400',
        color: LIGHT_THEME.textSecondary
      });
      expect(screen.getByTestId('resend-code-button').props.accessibilityState).toMatchObject({
        disabled: true
      });

      act(() => {
        jest.advanceTimersByTime(18000);
      });
      expect(screen.getByText('Resend in 0:42')).toBeTruthy();

      act(() => {
        jest.advanceTimersByTime(42000);
      });
      expect(screen.getByText('Resend code')).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByTestId('resend-code-button'));
      });

      expect(mockResendVerificationEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockSendPasswordResetOtp).not.toHaveBeenCalled();
      expect(screen.getByText(RESENT)).toBeTruthy();
      expect(screen.getByText('Resend in 1:00')).toBeTruthy();
    });

    it('does not resend while the cooldown runs', () => {
      render(<VerifyEmailScreen />);
      expect(screen.getByText(/Resend in/)).toBeTruthy();
      fireEvent.press(screen.getByTestId('resend-code-button'));
      expect(mockResendVerificationEmail).not.toHaveBeenCalled();
    });

    it('starts a fresh 60s cooldown when the sentAt param is missing', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-07-14T12:00:00.000Z'));
      delete mockParams.sentAt;

      render(<VerifyEmailScreen />);
      expect(screen.getByText('Resend in 1:00')).toBeTruthy();
    });
  });

  // Story 22.9, decision 3: from a font scale of 1.5 the way out closes the body.
  describe('the way out at the largest sizes', () => {
    it('sits under the primary in the footer just below a font scale of 1.5', () => {
      setFontScale(1.49);
      render(<VerifyEmailScreen />);
      expectInOrder(['verify-email-screen-footer', 'confirm-code-button', 'wrong-email-link']);
      expect(screen.queryByTestId('verify-email-screen-body-link')).toBeNull();
    });

    it('closes the body after the resend row, leaving the primary alone in the footer, from 1.5', () => {
      setFontScale(1.5);
      render(<VerifyEmailScreen />);
      expectInOrder([
        'resend-code-button',
        'verify-email-screen-body-link',
        'wrong-email-link',
        'verify-email-screen-footer',
        'confirm-code-button'
      ]);
    });
  });
});

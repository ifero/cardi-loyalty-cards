/**
 * Forgot password — auth frame C, the shortest form, on the form pattern (Story 22.9).
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { toast } from 'burnt';
import React from 'react';
import { Dimensions, Keyboard, ScrollView, StyleSheet, TextInput } from 'react-native';

import { FormScreen, HeaderIconButton } from '@/shared/components/ui';
import { changeAppLanguage } from '@/shared/i18n';
import { DARK_THEME, LIGHT_THEME, type Theme } from '@/shared/theme/colors';

import ForgotPasswordScreen from './ForgotPasswordScreen';

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

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockCanGoBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush, canGoBack: mockCanGoBack })
}));

const mockSendPasswordResetOtp = jest.fn();
jest.mock('@/shared/supabase/auth', () => ({
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

const pressSend = () => fireEvent.press(screen.getByTestId('send-reset-button'));

/** A send that answers only when told to. */
const holdSend = () => {
  let answer: (value: unknown) => void = () => {};
  mockSendPasswordResetOtp.mockImplementation(
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

const NETWORK = 'Unable to connect. Check your internet and try again.';
const GENERIC = 'An unexpected error occurred. Please try again.';

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

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    setFontScale(1);
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(true);
  });

  afterEach(async () => {
    dimensions?.mockRestore();
    dimensions = undefined;
    mockIsDark = false;
    await act(async () => {
      await changeAppLanguage('en');
    });
  });

  describe('frame C', () => {
    it('draws one FormScreen with one back, the header’s, and no title in it', () => {
      render(<ForgotPasswordScreen />);
      expect(screen.UNSAFE_getAllByType(FormScreen)).toHaveLength(1);
      expect(screen.UNSAFE_getAllByType(HeaderIconButton)).toHaveLength(1);
      expect(screen.getByTestId('forgot-password-screen-back')).toBeTruthy();
      expect(screen.queryByTestId('forgot-password-back-chevron')).toBeNull();
      expect(screen.queryByTestId('forgot-password-screen-title')).toBeNull();
    });

    it('draws no header row with nothing beneath it', () => {
      mockCanGoBack.mockReturnValue(false);
      render(<ForgotPasswordScreen />);
      expect(screen.queryByTestId('forgot-password-screen-header')).toBeNull();
    });

    // It used to hide the mark; frame C draws it.
    it('leads with the mark, "Forgot Password?" and its subtitle', () => {
      render(<ForgotPasswordScreen />);
      expect(screen.getByTestId('auth-app-icon')).toBeTruthy();
      expect(screen.getByTestId('forgot-password-title').props.children).toBe('Forgot Password?');
      expect(screen.getByTestId('forgot-password-title').props.accessibilityRole).toBe('header');
      expect(screen.getByTestId('forgot-password-subtitle').props.children).toBe(
        "No worries. Enter your email and we'll send you a reset code."
      );
    });

    it('draws EMAIL, then Send Reset Code in the footer with "Back to Sign In" under it', () => {
      render(<ForgotPasswordScreen />);
      expectInOrder([
        'forgot-password-subtitle',
        'email-input',
        'forgot-password-screen-footer',
        'send-reset-button',
        'back-to-sign-in-link'
      ]);
      expect(screen.getByText('Send Reset Code')).toBeTruthy();
      expect(screen.getByText('Back to Sign In')).toBeTruthy();
      // Its name stays the longer one it had.
      expect(screen.getByTestId('send-reset-button').props.accessibilityLabel).toBe(
        'Send password reset code'
      );
      expect(screen.getByTestId('email-input').props).toMatchObject({
        keyboardType: 'email-address',
        autoComplete: 'email',
        accessibilityLabel: 'Email',
        accessibilityHint: 'Enter your email address to receive a reset code'
      });
    });

    it.each<[string, boolean, Theme]>([
      ['light', false, LIGHT_THEME],
      ['dark', true, DARK_THEME]
    ])('sits on the %s ground', (_scheme, isDark, theme) => {
      mockIsDark = isDark;
      render(<ForgotPasswordScreen />);
      expect(flat('forgot-password-screen').backgroundColor).toBe(theme.background);
      expect(StyleSheet.flatten(screen.getByText('Back to Sign In').props.style).color).toBe(
        theme.link
      );
    });

    it('speaks the language the app speaks', async () => {
      await act(async () => {
        await changeAppLanguage('it');
      });
      render(<ForgotPasswordScreen />);
      expect(screen.getByText('Password dimenticata?')).toBeTruthy();
      expect(screen.getByText('Invia codice di reset')).toBeTruthy();
      expect(screen.getByText("Torna all'accesso")).toBeTruthy();
    });

    it('draws no MaterialIcons glyph', () => {
      render(<ForgotPasswordScreen />);
      expect(screen.queryAllByTestId(/^icon-/, { includeHiddenElements: true })).toHaveLength(0);
    });

    // The Never list: no sign-in method is added, so these are all the controls there are.
    it('draws its own controls and no other', () => {
      render(<ForgotPasswordScreen />);
      expect(controls()).toEqual([
        'forgot-password-screen-back',
        'email-input',
        'send-reset-button',
        'back-to-sign-in-link'
      ]);
    });

    // The focused field, with its label, is brought into view above the footer (Story 22.9).
    it('keeps EMAIL in view as the focused field, its one field', () => {
      render(<ForgotPasswordScreen />);
      expect(isInside('email-input', 'forgot-password-screen-field-0')).toBe(true);
    });
  });

  it('goes back through the header, and to sign in through its link', () => {
    render(<ForgotPasswordScreen />);
    fireEvent.press(screen.getByTestId('forgot-password-screen-back'));
    fireEvent.press(screen.getByTestId('back-to-sign-in-link'));
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/sign-in');
  });

  describe('validation', () => {
    it('blocks an empty email, focusing it, and never calls the send API', () => {
      const focus = jest.spyOn(TextInput.prototype, 'focus');
      try {
        render(<ForgotPasswordScreen />);
        pressSend();
        expect(screen.getByTestId('email-input-error').props.children).toBe('Email is required.');
        expect(
          focus.mock.contexts.map((input) => (input as { props: { testID?: string } }).props.testID)
        ).toEqual(['email-input']);
        expect(mockSendPasswordResetOtp).not.toHaveBeenCalled();
        expect(mockPush).not.toHaveBeenCalled();
        expect(screen.getByTestId('send-reset-button').props.accessibilityState.disabled).toBe(
          false
        );
      } finally {
        focus.mockRestore();
      }
    });

    // Review pass 1: no press is refused out of sight. At the largest text the brand block can put
    // EMAIL below a body the keyboard has shrunk to 200.
    it('brings EMAIL into view at a refused press, its message with it, keeping the keyboard', () => {
      const dismiss = jest.spyOn(Keyboard, 'dismiss');
      try {
        render(<ForgotPasswordScreen />);
        layOut(screen.UNSAFE_getByType(ScrollView), 0, 200);
        layOut(screen.getByTestId('forgot-password-screen-fields'), 260, 74);
        layOut(screen.getByTestId('forgot-password-screen-field-0'), 0, 74);

        pressSend();
        // Its bottom is 334: 334 + 24 − 200.
        expect(scrollTo).toHaveBeenLastCalledWith({ y: 158, animated: true });
        layOut(screen.getByTestId('forgot-password-screen-field-0'), 0, 98);
        expect(scrollTo).toHaveBeenLastCalledWith({ y: 182, animated: true });
        expect(dismiss).not.toHaveBeenCalled();
      } finally {
        dismiss.mockRestore();
      }
    });

    it('blocks a malformed email and never calls the send API', () => {
      render(<ForgotPasswordScreen />);
      fireEvent.changeText(screen.getByTestId('email-input'), 'not-an-email');
      pressSend();
      expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
      expect(mockSendPasswordResetOtp).not.toHaveBeenCalled();
    });

    it('follows the typing after the press, erring or clearing', () => {
      render(<ForgotPasswordScreen />);
      fireEvent.changeText(screen.getByTestId('email-input'), 'a');
      expect(screen.queryByTestId('email-input-error')).toBeNull();

      pressSend();
      expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
      fireEvent.changeText(screen.getByTestId('email-input'), '');
      expect(screen.getByText('Email is required.')).toBeTruthy();
      fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
      expect(screen.queryByTestId('email-input-error')).toBeNull();
    });
  });

  it('keeps the fill and shows a spinner named "Sending code..." while it sends', async () => {
    let answer: (value: unknown) => void = () => {};
    mockSendPasswordResetOtp.mockImplementation(
      () =>
        new Promise((resolve) => {
          answer = resolve;
        })
    );
    render(<ForgotPasswordScreen />);
    fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
    pressSend();

    const button = screen.getByTestId('send-reset-button');
    expect(screen.getByTestId('send-reset-button-spinner')).toBeTruthy();
    expect(button.props.accessibilityLabel).toBe('Sending code...');
    expect(button.props.accessibilityState).toMatchObject({ busy: true, disabled: false });
    expect(flat('send-reset-button-container').backgroundColor).toBe(LIGHT_THEME.primary);
    // Nothing dims.
    expect(flat('forgot-password-screen').opacity).toBeUndefined();
    expect(flat('email-input').backgroundColor).toBe(LIGHT_THEME.surface);
    expect(screen.getByTestId('email-input').props.editable).toBe(true);

    pressSend();
    expect(mockSendPasswordResetOtp).toHaveBeenCalledTimes(1);
    await act(async () => answer({ success: true, data: undefined }));
  });

  it('is named in the language the app speaks while it sends', async () => {
    await act(async () => {
      await changeAppLanguage('it');
    });
    const answer = holdSend();
    render(<ForgotPasswordScreen />);
    fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
    pressSend();
    expect(screen.getByTestId('send-reset-button').props.accessibilityLabel).toBe(
      'Invio del codice...'
    );
    await answer({ success: true, data: undefined });
  });

  // Review pass 1: the keyboard goes as a request starts, and a failure's banner then shows with
  // the field below it rather than behind the footer.
  it('dismisses the keyboard as the request starts', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    try {
      const answer = holdSend();
      render(<ForgotPasswordScreen />);
      fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
      pressSend();
      expect(dismiss).toHaveBeenCalledTimes(1);
      expect(dismiss.mock.invocationCallOrder[0]).toBeLessThan(
        mockSendPasswordResetOtp.mock.invocationCallOrder[0] ?? 0
      );
      await answer({ success: true, data: undefined });
    } finally {
      dismiss.mockRestore();
    }
  });

  it('sends the code for the trimmed email and opens the recovery code screen', async () => {
    mockSendPasswordResetOtp.mockResolvedValue({ success: true, data: undefined });
    render(<ForgotPasswordScreen />);
    fireEvent.changeText(screen.getByTestId('email-input'), '  test@example.com  ');
    pressSend();

    await waitFor(() => {
      expect(mockSendPasswordResetOtp).toHaveBeenCalledWith('test@example.com');
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/recovery-otp',
        params: { email: 'test@example.com', sentAt: expect.any(String) }
      });
    });
  });

  describe('a failed request', () => {
    const failWith = async (outcome: () => void) => {
      outcome();
      render(<ForgotPasswordScreen />);
      fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
      pressSend();
      await waitFor(() => expect(screen.getByTestId('server-error')).toBeTruthy());
    };

    it('shows the mapped message in one banner above the field, reddening nothing', async () => {
      await failWith(() =>
        mockSendPasswordResetOtp.mockResolvedValue({
          success: false,
          error: { message: 'Network request failed' }
        })
      );
      expect(screen.getAllByText(NETWORK)).toHaveLength(1);
      expectInOrder(['forgot-password-subtitle', 'server-error', 'email-input']);
      expect(flat('email-input').borderColor).toBe(LIGHT_THEME.border);
      expect(toast).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('stays while the email is edited, until the next request starts', async () => {
      await failWith(() =>
        mockSendPasswordResetOtp.mockResolvedValue({ success: false, error: { message: 'x' } })
      );
      fireEvent.changeText(screen.getByTestId('email-input'), 'other@example.com');
      expect(screen.getByText(GENERIC)).toBeTruthy();

      const answer = holdSend();
      pressSend();
      expect(screen.queryByTestId('server-error')).toBeNull();
      await answer({ success: false, error: { message: 'x' } });
      expect(screen.getByTestId('server-error')).toBeTruthy();
    });

    it('shows the generic message for any other failure, or a throw', async () => {
      await failWith(() => mockSendPasswordResetOtp.mockRejectedValue(new Error('boom')));
      expect(screen.getByText(GENERIC)).toBeTruthy();
    });

    // Review pass 1: a press that validation refuses starts no request, so the banner stays.
    it('stays through a press that validation refuses', async () => {
      await failWith(() =>
        mockSendPasswordResetOtp.mockResolvedValue({ success: false, error: { message: 'x' } })
      );
      fireEvent.changeText(screen.getByTestId('email-input'), '');
      pressSend();
      expect(screen.getByTestId('email-input-error')).toBeTruthy();
      expect(screen.getByText(GENERIC)).toBeTruthy();
      expect(mockSendPasswordResetOtp).toHaveBeenCalledTimes(1);
    });
  });

  // Story 22.9, decision 3: from a font scale of 1.5 the way out closes the body.
  describe('the way out at the largest sizes', () => {
    it('sits under the primary in the footer just below a font scale of 1.5', () => {
      setFontScale(1.49);
      render(<ForgotPasswordScreen />);
      expectInOrder(['forgot-password-screen-footer', 'send-reset-button', 'back-to-sign-in-link']);
      expect(screen.queryByTestId('forgot-password-screen-body-link')).toBeNull();
    });

    it('closes the body after EMAIL, leaving the primary alone in the footer, from 1.5', () => {
      setFontScale(1.5);
      render(<ForgotPasswordScreen />);
      expectInOrder([
        'email-input',
        'forgot-password-screen-body-link',
        'back-to-sign-in-link',
        'forgot-password-screen-footer',
        'send-reset-button'
      ]);
    });
  });
});

/**
 * Create account — auth frame B, the longest form, on the form pattern (Story 22.9).
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { toast } from 'burnt';
import React from 'react';
import { Dimensions, Keyboard, ScrollView, StyleSheet, TextInput } from 'react-native';

import ConsentCheckbox from '@/shared/components/ConsentCheckbox';
import { FormScreen } from '@/shared/components/ui';
import { changeAppLanguage } from '@/shared/i18n';
import { DARK_THEME, LIGHT_THEME, type Theme } from '@/shared/theme/colors';

import CreateAccountScreen from './CreateAccountScreen';

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

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn();
const mockParams: Record<string, string | undefined> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
    back: mockBack,
    canGoBack: mockCanGoBack
  }),
  useLocalSearchParams: () => mockParams
}));

const mockSignUp = jest.fn();
jest.mock('@/shared/supabase/auth', () => ({
  signUp: (...args: unknown[]) => mockSignUp(...args)
}));

const mockSetConsentGiven = jest.fn();
jest.mock('@/core/privacy/consent-repository', () => ({
  setConsentGiven: () => mockSetConsentGiven()
}));

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

const expectInOrder = (testIDs: string[]) => {
  const tree = JSON.stringify(screen.toJSON());
  const order = testIDs.map((testID) => tree.indexOf(`"${testID}"`));
  expect(order.every((index) => index > -1)).toBe(true);
  expect([...order].sort((a, b) => a - b)).toEqual(order);
};

const fillIn = ({
  email = 'test@example.com',
  password = 'Password1',
  confirm = 'Password1',
  consent = true
} = {}) => {
  fireEvent.changeText(screen.getByTestId('email-input'), email);
  fireEvent.changeText(screen.getByTestId('password-input'), password);
  fireEvent.changeText(screen.getByTestId('confirm-password-input'), confirm);
  if (consent) {
    fireEvent.press(screen.getByTestId('consent-checkbox-toggle'));
  }
};

const pressCreate = () => fireEvent.press(screen.getByTestId('register-button'));

/** A sign-up that answers only when told to. */
const holdSignUp = () => {
  let answer: (value: unknown) => void = () => {};
  mockSignUp.mockImplementation(
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
 * The keyboard up on a 393pt phone: the body above the footer 300 tall, the fields' column 260 into
 * it; EMAIL, PASSWORD and CONFIRM PASSWORD 74 tall at 0, 106 and 212, and the consent row 48 tall
 * at 318.
 */
const layOutForm = () => {
  layOut(screen.UNSAFE_getByType(ScrollView), 0, 300);
  layOut(screen.getByTestId('create-account-screen-fields'), 260, 366);
  layOut(screen.getByTestId('create-account-screen-field-0'), 0, 74);
  layOut(screen.getByTestId('create-account-screen-field-1'), 106, 74);
  layOut(screen.getByTestId('create-account-screen-field-2'), 212, 74);
  layOut(screen.getByTestId('create-account-screen-field-3'), 318, 48);
};

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

describe('CreateAccountScreen', () => {
  beforeEach(() => {
    setFontScale(1);
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(true);
    Object.keys(mockParams).forEach((key) => delete mockParams[key]);
  });

  afterEach(async () => {
    dimensions?.mockRestore();
    dimensions = undefined;
    mockIsDark = false;
    await act(async () => {
      await changeAppLanguage('en');
    });
  });

  describe('frame B', () => {
    it('draws one FormScreen, its header holding the back alone', () => {
      render(<CreateAccountScreen />);
      expect(screen.UNSAFE_getAllByType(FormScreen)).toHaveLength(1);
      expect(screen.getByTestId('create-account-screen-back')).toBeTruthy();
      expect(screen.queryByTestId('create-account-screen-title')).toBeNull();
    });

    it('goes back to the screen beneath', () => {
      render(<CreateAccountScreen />);
      fireEvent.press(screen.getByTestId('create-account-screen-back'));
      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('draws no header row with nothing beneath it', () => {
      mockCanGoBack.mockReturnValue(false);
      render(<CreateAccountScreen />);
      expect(screen.queryByTestId('create-account-screen-header')).toBeNull();
    });

    it('leads with the mark, "Create Account" and "Join Cardì"', () => {
      render(<CreateAccountScreen />);
      expect(screen.getByTestId('auth-app-icon')).toBeTruthy();
      expect(screen.getByTestId('create-account-title').props.children).toBe('Create Account');
      expect(screen.getByTestId('create-account-title').props.accessibilityRole).toBe('header');
      expect(screen.getByTestId('create-account-subtitle').props.children).toBe('Join Cardì');
    });

    it('draws EMAIL, PASSWORD, CONFIRM PASSWORD and the consent row, unticked', () => {
      render(<CreateAccountScreen />);
      expectInOrder([
        'create-account-subtitle',
        'email-input',
        'password-input',
        'confirm-password-input',
        'consent-checkbox'
      ]);
      expect(screen.getByTestId('consent-checkbox-toggle').props.accessibilityState.checked).toBe(
        false
      );
      expect(screen.UNSAFE_getAllByType(ConsentCheckbox)).toHaveLength(1);
    });

    it('draws each field’s label and keeps its name and hint', () => {
      render(<CreateAccountScreen />);
      expect(screen.getByText('Email')).toBeTruthy();
      expect(screen.getByText('Password')).toBeTruthy();
      expect(screen.getByText('Confirm Password')).toBeTruthy();
      expect(screen.getByTestId('email-input').props).toMatchObject({
        accessibilityLabel: 'Email',
        accessibilityHint: 'Enter your email address'
      });
      expect(screen.getByTestId('password-input').props).toMatchObject({
        accessibilityLabel: 'Password',
        accessibilityHint: 'Minimum 8 characters with at least one letter and one number'
      });
      expect(screen.getByTestId('confirm-password-input').props).toMatchObject({
        accessibilityLabel: 'Confirm Password',
        accessibilityHint: 'Re-enter your password to confirm'
      });
    });

    it('puts Create Account in the footer, with "Already have an account? Sign in" under it', () => {
      render(<CreateAccountScreen />);
      expectInOrder(['create-account-screen-footer', 'register-button', 'sign-in-link']);
      expect(screen.getByText('Already have an account? Sign in')).toBeTruthy();
      expect(screen.getByTestId('register-button').props.accessibilityLabel).toBe('Create Account');
    });

    // Frame B draws no caption: the rule is in the placeholder, the message and the hint.
    it('draws no password-requirements caption', () => {
      render(<CreateAccountScreen />);
      expect(screen.queryByTestId('password-requirements')).toBeNull();
      expect(screen.getByTestId('password-input').props).toMatchObject({
        placeholder: 'Min 8 chars, 1 letter, 1 number',
        accessibilityHint: 'Minimum 8 characters with at least one letter and one number',
        autoComplete: 'new-password'
      });
    });

    it('shows the meter only once a password is typed, 8 below the field', () => {
      render(<CreateAccountScreen />);
      expect(screen.queryByTestId('password-strength-indicator')).toBeNull();

      fireEvent.changeText(screen.getByTestId('password-input'), 'abc');
      expect(screen.getByTestId('password-strength-indicator-label').props.children).toBe('Weak');
      expectInOrder(['password-input', 'password-strength-indicator', 'confirm-password-input']);

      fireEvent.changeText(screen.getByTestId('password-input'), 'Password123!@#');
      expect(screen.getByTestId('password-strength-indicator-label').props.children).toBe('Strong');

      // 8 below the password field: the group's gap.
      let group = screen.getByTestId('password-strength-indicator').parent;
      while (group && typeof group.type !== 'string') {
        group = group.parent;
      }
      expect(StyleSheet.flatten(group?.props.style).gap).toBe(8);
    });

    it.each<[string, boolean, Theme]>([
      ['light', false, LIGHT_THEME],
      ['dark', true, DARK_THEME]
    ])('sits on the %s ground', (_scheme, isDark, theme) => {
      mockIsDark = isDark;
      render(<CreateAccountScreen />);
      expect(flat('create-account-screen').backgroundColor).toBe(theme.background);
      expect(StyleSheet.flatten(screen.getByText('Sign in').props.style).color).toBe(theme.link);
    });

    it('speaks the language the app speaks', async () => {
      await act(async () => {
        await changeAppLanguage('it');
      });
      render(<CreateAccountScreen />);
      expect(screen.getByTestId('create-account-title').props.children).toBe('Crea account');
      expect(screen.getByTestId('create-account-subtitle').props.children).toBe('Unisciti a Cardì');
      expect(screen.getByText('Hai già un account? Accedi')).toBeTruthy();
    });

    it('draws no MaterialIcons glyph', () => {
      render(<CreateAccountScreen />);
      fireEvent.press(screen.getByTestId('consent-checkbox-toggle'));
      expect(screen.queryAllByTestId(/^icon-/, { includeHiddenElements: true })).toHaveLength(0);
    });

    // The Never list: no sign-in method is added, so these are all the controls there are.
    it('draws its own controls and no other', () => {
      render(<CreateAccountScreen />);
      expect(controls()).toEqual([
        'create-account-screen-back',
        'email-input',
        'password-input',
        'password-input-toggle',
        'confirm-password-input',
        'confirm-password-input-toggle',
        'consent-checkbox-toggle',
        'consent-policy-link',
        'register-button',
        'sign-in-link'
      ]);
    });
  });

  // The focused field, with its label, is brought into view above the footer (Story 22.9).
  describe('the focused field', () => {
    it('is kept in view: EMAIL, PASSWORD with its meter, CONFIRM PASSWORD and consent, each one field', () => {
      render(<CreateAccountScreen />);
      fireEvent.changeText(screen.getByTestId('password-input'), 'abc');
      expect(isInside('email-input', 'create-account-screen-field-0')).toBe(true);
      expect(isInside('password-input', 'create-account-screen-field-1')).toBe(true);
      expect(isInside('password-strength-indicator', 'create-account-screen-field-1')).toBe(true);
      expect(isInside('confirm-password-input', 'create-account-screen-field-2')).toBe(true);
      expect(isInside('consent-checkbox', 'create-account-screen-field-3')).toBe(true);
    });

    // The lowest text field: the keyboard and the footer riding it would otherwise hide it.
    it('brings a field focused below the visible body up above the footer', () => {
      render(<CreateAccountScreen />);
      layOutForm();

      fireEvent(screen.getByTestId('create-account-screen-field-2'), 'focus');
      // CONFIRM PASSWORD's bottom is 546: 546 + 24 − 300.
      expect(scrollTo).toHaveBeenCalledTimes(1);
      expect(scrollTo).toHaveBeenLastCalledWith({ y: 270, animated: true });
    });
  });

  it('opens sign in from its link', () => {
    render(<CreateAccountScreen />);
    fireEvent.press(screen.getByTestId('sign-in-link'));
    expect(mockPush).toHaveBeenCalledWith('/sign-in');
  });

  it('prefills the email from the route, and starts again for a new one', () => {
    mockParams.email = 'saved@example.com';
    const view = render(<CreateAccountScreen />);
    expect(screen.getByTestId('email-input').props.value).toBe('saved@example.com');

    fireEvent.changeText(screen.getByTestId('password-input'), 'Password1');
    pressCreate();
    expect(screen.getByTestId('confirm-password-input-error')).toBeTruthy();

    mockParams.email = 'other@example.com';
    view.rerender(<CreateAccountScreen />);
    expect(screen.getByTestId('email-input').props.value).toBe('other@example.com');
    expect(screen.getByTestId('password-input').props.value).toBe('');
    expect(screen.queryByTestId('confirm-password-input-error')).toBeNull();
  });

  describe('validation', () => {
    // Story 22.9: no field errs on blur any more; errors wait for the press.
    it('does not err on blur', () => {
      render(<CreateAccountScreen />);
      fireEvent.changeText(screen.getByTestId('email-input'), 'invalid-email');
      fireEvent(screen.getByTestId('email-input'), 'blur');
      expect(screen.queryByText('Please enter a valid email address')).toBeNull();
    });

    it('reveals every rule at the press, consent under its row, and sends nothing', () => {
      render(<CreateAccountScreen />);
      pressCreate();
      expect(screen.getByTestId('email-input-error').props.children).toBe('Email is required.');
      expect(screen.getByTestId('password-input-error').props.children).toBe(
        'Password is required.'
      );
      expect(screen.getByTestId('confirm-password-input-error').props.children).toBe(
        'Please confirm your password.'
      );
      expect(screen.getByTestId('consent-error').props.children).toBe(
        'You must agree to the Privacy Policy.'
      );
      expect(flat('consent-checkbox-box').borderColor).toBe(LIGHT_THEME.error);
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it.each([
      [{ email: 'not-an-email' }, 'email-input-error', 'Please enter a valid email address'],
      [
        { password: 'short', confirm: 'short' },
        'password-input-error',
        'Min 8 characters, at least one letter and one number.'
      ],
      [{ confirm: 'Password2' }, 'confirm-password-input-error', 'Passwords do not match.'],
      [{ consent: false }, 'consent-error', 'You must agree to the Privacy Policy.']
    ])('holds back %j with "%s"', (values, errorTestID, message) => {
      render(<CreateAccountScreen />);
      fillIn(values);
      pressCreate();
      expect(screen.getByTestId(errorTestID).props.children).toBe(message);
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    // Create Account is never disabled: unticked consent is said, not refused in silence.
    it('stays enabled with consent unticked, and says why at the press', () => {
      render(<CreateAccountScreen />);
      fillIn({ consent: false });
      const button = screen.getByTestId('register-button');
      expect(button.props.accessibilityState).toMatchObject({ disabled: false, busy: false });
      expect(flat('register-button-container').backgroundColor).toBe(LIGHT_THEME.primary);

      pressCreate();
      expect(screen.getByTestId('consent-error')).toBeTruthy();

      // Ticking it clears the message and the outline.
      fireEvent.press(screen.getByTestId('consent-checkbox-toggle'));
      expect(screen.queryByTestId('consent-error')).toBeNull();
      expect(flat('consent-checkbox-box').borderColor).toBe(LIGHT_THEME.primary);
    });

    it('focuses the first invalid text field', () => {
      const focus = jest.spyOn(TextInput.prototype, 'focus');
      const focused = () =>
        focus.mock.contexts.map((input) => (input as { props: { testID?: string } }).props.testID);
      try {
        render(<CreateAccountScreen />);
        fillIn({ password: 'short', confirm: 'nope', consent: false });
        pressCreate();
        expect(focused()).toEqual(['password-input']);

        focus.mockClear();
        fillIn({ confirm: 'Password2', consent: false });
        pressCreate();
        expect(focused()).toEqual(['confirm-password-input']);

        // Consent alone is not a text field: nothing takes the focus.
        focus.mockClear();
        fillIn({ consent: false });
        pressCreate();
        expect(focused()).toEqual([]);
      } finally {
        focus.mockRestore();
      }
    });

    it('focuses an invalid email first, ahead of every other error', () => {
      const focus = jest.spyOn(TextInput.prototype, 'focus');
      try {
        render(<CreateAccountScreen />);
        fillIn({ email: 'not-an-email', password: 'short', confirm: 'nope', consent: false });
        pressCreate();
        expect(
          focus.mock.contexts.map((input) => (input as { props: { testID?: string } }).props.testID)
        ).toEqual(['email-input']);
      } finally {
        focus.mockRestore();
      }
    });

    // Review pass 1: no press is refused out of sight. With consent the only refusal there is no
    // field to focus, so its row, with its message, is brought into view on its own.
    it('brings the consent row into view, its message with it, when consent alone is missing', () => {
      const focus = jest.spyOn(TextInput.prototype, 'focus');
      try {
        render(<CreateAccountScreen />);
        layOutForm();
        fillIn({ consent: false });

        pressCreate();
        expect(focus).not.toHaveBeenCalled();
        // The row's bottom is 626: 626 + 24 − 300.
        expect(scrollTo).toHaveBeenLastCalledWith({ y: 350, animated: true });

        // Its message lays it out again, taller: its bottom is now 650.
        layOut(screen.getByTestId('create-account-screen-field-3'), 318, 72);
        expect(scrollTo).toHaveBeenLastCalledWith({ y: 374, animated: true });
      } finally {
        focus.mockRestore();
      }
    });

    // Each field's bottom, 24 above the footer: EMAIL's at 334, PASSWORD's at 440, CONFIRM's at 546.
    it.each([
      ['EMAIL', { email: 'not-an-email' }, 58],
      ['PASSWORD', { password: 'short', confirm: 'short' }, 164],
      ['CONFIRM PASSWORD', { confirm: 'Password2' }, 270]
    ])('brings %s into view when it is the first invalid field', (_field, values, y) => {
      render(<CreateAccountScreen />);
      layOutForm();
      fillIn(values);

      pressCreate();
      expect(scrollTo).toHaveBeenLastCalledWith({ y, animated: true });
    });

    it('keeps the keyboard at a refused press', () => {
      const dismiss = jest.spyOn(Keyboard, 'dismiss');
      try {
        render(<CreateAccountScreen />);
        pressCreate();
        fillIn({ consent: false });
        pressCreate();
        expect(dismiss).not.toHaveBeenCalled();
      } finally {
        dismiss.mockRestore();
      }
    });

    it('follows the typing after the first press', () => {
      render(<CreateAccountScreen />);
      pressCreate();
      fireEvent.changeText(screen.getByTestId('password-input'), 'Password1');
      expect(screen.queryByTestId('password-input-error')).toBeNull();
      fireEvent.changeText(screen.getByTestId('confirm-password-input'), 'Password');
      expect(screen.getByText('Passwords do not match.')).toBeTruthy();
      fireEvent.changeText(screen.getByTestId('confirm-password-input'), 'Password1');
      expect(screen.queryByTestId('confirm-password-input-error')).toBeNull();
    });
  });

  describe('busy', () => {
    it('keeps the fill, shows a spinner named "Creating account...", and refuses a second press', async () => {
      let answer: (value: unknown) => void = () => {};
      mockSignUp.mockImplementation(
        () =>
          new Promise((resolve) => {
            answer = resolve;
          })
      );
      render(<CreateAccountScreen />);
      fillIn();
      pressCreate();

      const button = screen.getByTestId('register-button');
      expect(screen.getByTestId('register-button-spinner')).toBeTruthy();
      expect(button.props.accessibilityLabel).toBe('Creating account...');
      expect(button.props.accessibilityState).toMatchObject({ busy: true, disabled: false });
      expect(flat('register-button-container').backgroundColor).toBe(LIGHT_THEME.primary);
      // Nothing dims.
      expect(flat('create-account-screen').opacity).toBeUndefined();
      expect(flat('email-input').backgroundColor).toBe(LIGHT_THEME.surface);
      expect(screen.getByTestId('email-input').props.editable).toBe(true);

      pressCreate();
      expect(mockSignUp).toHaveBeenCalledTimes(1);

      await act(async () => answer({ success: true, data: { user: { id: 'u1' }, session: {} } }));
    });

    it('is named in the language the app speaks', async () => {
      await act(async () => {
        await changeAppLanguage('it');
      });
      const answer = holdSignUp();
      render(<CreateAccountScreen />);
      fillIn();
      pressCreate();
      expect(screen.getByTestId('register-button').props.accessibilityLabel).toBe(
        "Creazione dell'account..."
      );
      await answer({ success: true, data: { user: { id: 'u1' }, session: {} } });
    });

    // Review pass 1: the keyboard goes as a request starts, and a failure's banner then shows with
    // the fields below it rather than behind the footer.
    it('dismisses the keyboard as the request starts', async () => {
      const dismiss = jest.spyOn(Keyboard, 'dismiss');
      try {
        const answer = holdSignUp();
        render(<CreateAccountScreen />);
        fillIn();
        pressCreate();
        expect(dismiss).toHaveBeenCalledTimes(1);
        expect(dismiss.mock.invocationCallOrder[0]).toBeLessThan(
          mockSignUp.mock.invocationCallOrder[0] ?? 0
        );
        await answer({ success: false, error: { message: 'boom' } });
      } finally {
        dismiss.mockRestore();
      }
    });
  });

  describe('a failed request', () => {
    const failWith = async (outcome: () => void) => {
      outcome();
      render(<CreateAccountScreen />);
      fillIn();
      pressCreate();
      await waitFor(() => expect(screen.getByTestId('server-error')).toBeTruthy());
    };

    it('stays while the fields are edited, until the next request starts', async () => {
      await failWith(() =>
        mockSignUp.mockResolvedValue({ success: false, error: { message: 'x' } })
      );
      fireEvent.changeText(screen.getByTestId('email-input'), 'other@example.com');
      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeTruthy();

      const answer = holdSignUp();
      pressCreate();
      expect(screen.queryByTestId('server-error')).toBeNull();
      await answer({ success: false, error: { message: 'x' } });
      expect(screen.getByTestId('server-error')).toBeTruthy();
    });

    it('shows the mapped message in one banner, above the fields, reddening none', async () => {
      await failWith(() =>
        mockSignUp.mockResolvedValue({
          success: false,
          error: { code: 'user_already_exists', message: 'User already registered' }
        })
      );
      expect(
        screen.getAllByText('An account with this email already exists. Sign in instead.')
      ).toHaveLength(1);
      expectInOrder(['create-account-subtitle', 'server-error', 'email-input']);
      expect(flat('email-input').borderColor).toBe(LIGHT_THEME.border);
      expect(flat('password-input').borderColor).toBe(LIGHT_THEME.border);
      expect(toast).not.toHaveBeenCalled();
      expect(mockSetConsentGiven).not.toHaveBeenCalled();
      expect(screen.getByTestId('register-button').props.accessibilityState.disabled).toBe(false);
    });

    it.each([
      ['Network request failed', 'Unable to connect. Check your internet and try again.'],
      ['already been registered', 'An account with this email already exists. Sign in instead.'],
      ['boom', 'An unexpected error occurred. Please try again.']
    ])('maps "%s" to "%s", as before', async (message, shown) => {
      await failWith(() => mockSignUp.mockResolvedValue({ success: false, error: { message } }));
      expect(screen.getByText(shown)).toBeTruthy();
    });

    it('maps a request that throws to the generic message', async () => {
      await failWith(() => mockSignUp.mockRejectedValue(new Error('Unexpected failure')));
      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeTruthy();
    });

    // Review pass 1: a press that validation refuses starts no request, so the banner stays.
    it('stays through a press that validation refuses', async () => {
      await failWith(() =>
        mockSignUp.mockResolvedValue({ success: false, error: { message: 'x' } })
      );
      fireEvent.press(screen.getByTestId('consent-checkbox-toggle'));
      pressCreate();
      expect(screen.getByTestId('consent-error')).toBeTruthy();
      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeTruthy();
      expect(mockSignUp).toHaveBeenCalledTimes(1);
    });
  });

  describe('success', () => {
    it('stores consent after signUp, then goes home with a session', async () => {
      mockSignUp.mockResolvedValue({
        success: true,
        data: { user: { id: 'u1' }, session: { access_token: 'token' } }
      });
      render(<CreateAccountScreen />);
      fillIn();
      pressCreate();

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'Password1');
        expect(mockSetConsentGiven).toHaveBeenCalled();
        expect(mockReplace).toHaveBeenCalledWith('/');
      });
    });

    it('opens the code screen with the address and the time sent, without a session', async () => {
      mockSignUp.mockResolvedValue({ success: true, data: { user: { id: 'u1' }, session: null } });
      render(<CreateAccountScreen />);
      fillIn();
      pressCreate();

      await waitFor(() => {
        expect(mockSetConsentGiven).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith({
          pathname: '/verify-email',
          params: { email: 'test@example.com', sentAt: expect.any(String) }
        });
      });
    });
  });

  // Story 22.9, decision 3: from a font scale of 1.5 the way out closes the body.
  describe('the way out at the largest sizes', () => {
    it('sits under the primary in the footer just below a font scale of 1.5', () => {
      setFontScale(1.49);
      render(<CreateAccountScreen />);
      expectInOrder(['create-account-screen-footer', 'register-button', 'sign-in-link']);
      expect(screen.queryByTestId('create-account-screen-body-link')).toBeNull();
    });

    it('closes the body after the consent row, leaving the primary alone in the footer, from 1.5', () => {
      setFontScale(1.5);
      render(<CreateAccountScreen />);
      expectInOrder([
        'consent-checkbox',
        'create-account-screen-body-link',
        'sign-in-link',
        'create-account-screen-footer',
        'register-button'
      ]);
    });
  });
});

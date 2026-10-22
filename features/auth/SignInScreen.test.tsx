/**
 * Sign in — auth frame A, on the form pattern; frame F, a failed request (Story 22.9).
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { toast } from 'burnt';
import React from 'react';
import { Dimensions, Keyboard, ScrollView, StyleSheet, TextInput } from 'react-native';

import { FormScreen, RequestErrorBanner } from '@/shared/components/ui';
import { changeAppLanguage } from '@/shared/i18n';
import { DARK_THEME, LIGHT_THEME, type Theme } from '@/shared/theme/colors';

import SignInScreen from './SignInScreen';

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
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
    back: mockBack,
    canGoBack: mockCanGoBack
  })
}));

const mockSignInWithEmail = jest.fn();
jest.mock('@/shared/supabase/auth', () => ({
  signInWithEmail: (...args: unknown[]) => mockSignInWithEmail(...args)
}));

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

/** The order the testIDs appear in the drawn tree. */
const expectInOrder = (testIDs: string[]) => {
  const tree = JSON.stringify(screen.toJSON());
  const order = testIDs.map((testID) => tree.indexOf(`"${testID}"`));
  expect(order.every((index) => index > -1)).toBe(true);
  expect([...order].sort((a, b) => a - b)).toEqual(order);
};

const fillIn = (email: string, password: string) => {
  fireEvent.changeText(screen.getByTestId('email-input'), email);
  fireEvent.changeText(screen.getByTestId('password-input'), password);
};

const pressSignIn = () => fireEvent.press(screen.getByTestId('sign-in-button'));

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

/** Reports the body scrolled to `y`. */
const scrollBodyTo = (y: number) =>
  fireEvent.scroll(screen.UNSAFE_getByType(ScrollView), {
    nativeEvent: { contentOffset: { x: 0, y } }
  });

/**
 * The keyboard up on a 393pt phone: the body above the footer 300 tall, the fields' column 260 into
 * it, EMAIL 74 tall at its top and PASSWORD, with its link, 122 tall at 106.
 */
const layOutForm = () => {
  layOut(screen.UNSAFE_getByType(ScrollView), 0, 300);
  layOut(screen.getByTestId('sign-in-screen-fields'), 260, 228);
  layOut(screen.getByTestId('sign-in-screen-field-0'), 0, 74);
  layOut(screen.getByTestId('sign-in-screen-field-1'), 106, 122);
};

/** A request that answers only when told to. */
const holdRequest = () => {
  let answer: (value: unknown) => void = () => {};
  mockSignInWithEmail.mockImplementation(
    () =>
      new Promise((resolve) => {
        answer = resolve;
      })
  );
  return (value: unknown) => act(async () => answer(value));
};

const INCORRECT = 'Incorrect email or password. Please try again.';

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

describe('SignInScreen', () => {
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

  describe('frame A', () => {
    it('draws one FormScreen, its header holding the back alone', () => {
      render(<SignInScreen />);
      expect(screen.UNSAFE_getAllByType(FormScreen)).toHaveLength(1);
      expect(screen.getByTestId('sign-in-screen')).toBeTruthy();
      expect(screen.getByTestId('sign-in-screen-back').props.accessibilityLabel).toBe('Go back');
      expect(screen.queryByTestId('sign-in-screen-title')).toBeNull();
    });

    it('leads the body with the mark, the heading and its subtitle', () => {
      render(<SignInScreen />);
      expect(screen.getByTestId('auth-app-icon')).toBeTruthy();
      const heading = screen.getByTestId('sign-in-title');
      expect(heading.props.children).toBe('Welcome Back');
      expect(heading.props.accessibilityRole).toBe('header');
      expect(screen.getByTestId('sign-in-subtitle').props.children).toBe(
        'Sign in to sync your loyalty cards across devices'
      );
      // The only heading on the screen.
      expect(screen.getAllByRole('header')).toHaveLength(1);
    });

    it('draws EMAIL, then PASSWORD with its eye, then "Forgot password?" at the row’s end', () => {
      render(<SignInScreen />);
      expectInOrder([
        'sign-in-title',
        'email-input',
        'password-input',
        'password-input-toggle',
        'forgot-password-link'
      ]);
      expect(screen.getByText('Email')).toBeTruthy();
      expect(screen.getByText('Password')).toBeTruthy();
      expect(flat('forgot-password-link').alignSelf).toBe('flex-end');
      expect(screen.getByText('Forgot password?')).toBeTruthy();
    });

    it('puts Sign In in the footer, with "Don’t have an account? Create one" under it', () => {
      render(<SignInScreen />);
      expectInOrder(['sign-in-screen-footer', 'sign-in-button', 'create-account-link']);
      expect(screen.getByText("Don't have an account? Create one")).toBeTruthy();
      expect(screen.getByTestId('sign-in-button').props.accessibilityLabel).toBe('Sign In');
    });

    it('keeps each field’s keyboard, autofill, name and hint', () => {
      render(<SignInScreen />);
      expect(screen.getByTestId('email-input').props).toMatchObject({
        keyboardType: 'email-address',
        autoComplete: 'email',
        autoCapitalize: 'none',
        accessibilityLabel: 'Email',
        accessibilityHint: 'Enter your email address'
      });
      expect(screen.getByTestId('password-input').props).toMatchObject({
        secureTextEntry: true,
        autoComplete: 'current-password',
        accessibilityLabel: 'Password',
        accessibilityHint: 'Enter your password'
      });
    });

    it('puts "Forgot password?" 8 below the password field', () => {
      render(<SignInScreen />);
      expectInOrder(['password-input', 'forgot-password-link']);
      // The group's gap.
      let group = screen.getByTestId('forgot-password-link').parent;
      while (group && typeof group.type !== 'string') {
        group = group.parent;
      }
      expect(StyleSheet.flatten(group?.props.style).gap).toBe(8);
    });

    it.each<[string, boolean, Theme]>([
      ['light', false, LIGHT_THEME],
      ['dark', true, DARK_THEME]
    ])('sits on the %s ground, its links in the link role', (_scheme, isDark, theme) => {
      mockIsDark = isDark;
      render(<SignInScreen />);
      expect(flat('sign-in-screen').backgroundColor).toBe(theme.background);
      expect(StyleSheet.flatten(screen.getByText('Forgot password?').props.style).color).toBe(
        theme.link
      );
      expect(StyleSheet.flatten(screen.getByText('Create one').props.style).color).toBe(theme.link);
    });

    it('speaks the language the app speaks', async () => {
      await act(async () => {
        await changeAppLanguage('it');
      });
      render(<SignInScreen />);
      expect(screen.getByText('Bentornato')).toBeTruthy();
      expect(screen.getByText('Password dimenticata?')).toBeTruthy();
      expect(screen.getByText('Accedi')).toBeTruthy();
      expect(screen.getByText('Non hai un account? Creane uno')).toBeTruthy();
    });

    it('draws no MaterialIcons glyph', () => {
      render(<SignInScreen />);
      expect(screen.queryAllByTestId(/^icon-/, { includeHiddenElements: true })).toHaveLength(0);
    });

    // The Never list: no sign-in method is added, so these are all the controls there are.
    it('draws its own controls and no other', () => {
      render(<SignInScreen />);
      expect(controls()).toEqual([
        'sign-in-screen-back',
        'email-input',
        'password-input',
        'password-input-toggle',
        'forgot-password-link',
        'sign-in-button',
        'create-account-link'
      ]);
    });
  });

  describe('the back', () => {
    it('goes back to the screen beneath', () => {
      render(<SignInScreen />);
      fireEvent.press(screen.getByTestId('sign-in-screen-back'));
      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('is not drawn with nothing beneath it', () => {
      mockCanGoBack.mockReturnValue(false);
      render(<SignInScreen />);
      expect(screen.queryByTestId('sign-in-screen-header')).toBeNull();
    });
  });

  describe('the links', () => {
    it('opens forgot password and create account', () => {
      render(<SignInScreen />);
      fireEvent.press(screen.getByTestId('forgot-password-link'));
      fireEvent.press(screen.getByTestId('create-account-link'));
      expect(mockPush).toHaveBeenCalledWith('/forgot-password');
      expect(mockPush).toHaveBeenCalledWith('/create-account');
    });

    it('toggles the password’s visibility', () => {
      render(<SignInScreen />);
      fireEvent.press(screen.getByTestId('password-input-toggle'));
      expect(screen.getByLabelText('Hide password')).toBeTruthy();
    });
  });

  // The focused field, with its label, is brought into view above the footer (Story 22.9).
  describe('the focused field', () => {
    it('is kept in view: EMAIL, then PASSWORD with its link, each one field', () => {
      render(<SignInScreen />);
      expect(isInside('email-input', 'sign-in-screen-field-0')).toBe(true);
      expect(isInside('password-input', 'sign-in-screen-field-1')).toBe(true);
      expect(isInside('forgot-password-link', 'sign-in-screen-field-1')).toBe(true);
    });
  });

  describe('validation', () => {
    it('reveals each invalid field’s message at the press, sends nothing, and stays enabled', () => {
      render(<SignInScreen />);
      expect(screen.queryByTestId('email-input-error')).toBeNull();

      pressSignIn();
      expect(screen.getByTestId('email-input-error').props.children).toBe('Email is required.');
      expect(screen.getByTestId('password-input-error').props.children).toBe(
        'Password is required.'
      );
      expect(mockSignInWithEmail).not.toHaveBeenCalled();
      expect(screen.getByTestId('sign-in-button').props.accessibilityState).toMatchObject({
        disabled: false,
        busy: false
      });
    });

    it('rejects an email that is not valid', () => {
      render(<SignInScreen />);
      fillIn('not-an-email', 'Password1');
      pressSignIn();
      expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
      expect(mockSignInWithEmail).not.toHaveBeenCalled();
    });

    it('sends nothing when only the password is missing', () => {
      render(<SignInScreen />);
      fillIn('test@example.com', '');
      pressSignIn();
      expect(screen.getByText('Password is required.')).toBeTruthy();
      expect(screen.queryByTestId('email-input-error')).toBeNull();
      expect(mockSignInWithEmail).not.toHaveBeenCalled();
    });

    it('focuses the first invalid field', () => {
      const focus = jest.spyOn(TextInput.prototype, 'focus');
      const focused = () =>
        focus.mock.contexts.map((input) => (input as { props: { testID?: string } }).props.testID);
      try {
        render(<SignInScreen />);
        pressSignIn();
        expect(focused()).toEqual(['email-input']);

        focus.mockClear();
        fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
        pressSignIn();
        expect(focused()).toEqual(['password-input']);
      } finally {
        focus.mockRestore();
      }
    });

    // Review pass 1: no press is refused out of sight. The first invalid field comes into view, with
    // its message, above the footer that rides the keyboard.
    it('brings the first invalid field into view, its message with it', () => {
      render(<SignInScreen />);
      layOutForm();

      pressSignIn();
      // EMAIL's bottom is 334: 334 + 24 − 300.
      expect(scrollTo).toHaveBeenLastCalledWith({ y: 58, animated: true });

      // Its message lays it out again, taller: its bottom is now 358.
      layOut(screen.getByTestId('sign-in-screen-field-0'), 0, 98);
      expect(scrollTo).toHaveBeenLastCalledWith({ y: 82, animated: true });
    });

    // A focused input focused again sends no focus event, so the press itself brings it back.
    it('brings back an invalid field that already had the focus, once scrolled away from', () => {
      render(<SignInScreen />);
      layOutForm();
      fireEvent(screen.getByTestId('sign-in-screen-field-1'), 'focus');
      // PASSWORD's bottom is 488: 488 + 24 − 300.
      expect(scrollTo).toHaveBeenLastCalledWith({ y: 212, animated: true });
      scrollBodyTo(212);
      scrollBodyTo(0);
      scrollTo.mockClear();

      fillIn('test@example.com', '');
      pressSignIn();
      expect(scrollTo).toHaveBeenCalledTimes(1);
      expect(scrollTo).toHaveBeenLastCalledWith({ y: 212, animated: true });
    });

    it('keeps the keyboard at a refused press', () => {
      const dismiss = jest.spyOn(Keyboard, 'dismiss');
      try {
        render(<SignInScreen />);
        pressSignIn();
        fillIn('test@example.com', '');
        pressSignIn();
        expect(dismiss).not.toHaveBeenCalled();
      } finally {
        dismiss.mockRestore();
      }
    });

    it('follows the typing after the first press, clearing or erring', () => {
      render(<SignInScreen />);
      // Nothing errs before the first press.
      fireEvent.changeText(screen.getByTestId('email-input'), 'a');
      expect(screen.queryByTestId('email-input-error')).toBeNull();

      pressSignIn();
      expect(screen.getByText('Please enter a valid email address')).toBeTruthy();

      fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
      expect(screen.queryByTestId('email-input-error')).toBeNull();
      fireEvent.changeText(screen.getByTestId('email-input'), '');
      expect(screen.getByText('Email is required.')).toBeTruthy();

      fireEvent.changeText(screen.getByTestId('password-input'), 'x');
      expect(screen.queryByTestId('password-input-error')).toBeNull();
    });
  });

  describe('busy', () => {
    it('keeps the fill, shows a spinner named "Signing in...", and refuses a second press', async () => {
      const answer = holdRequest();
      render(<SignInScreen />);
      fillIn('test@example.com', 'Password1');
      pressSignIn();

      const button = screen.getByTestId('sign-in-button');
      expect(screen.getByTestId('sign-in-button-spinner')).toBeTruthy();
      expect(button.props.accessibilityLabel).toBe('Signing in...');
      expect(button.props.accessibilityState).toMatchObject({ busy: true, disabled: false });
      expect(flat('sign-in-button-container').backgroundColor).toBe(LIGHT_THEME.primary);
      // Nothing dims.
      expect(flat('sign-in-screen').opacity).toBeUndefined();
      expect(flat('email-input').backgroundColor).toBe(LIGHT_THEME.surface);

      pressSignIn();
      expect(mockSignInWithEmail).toHaveBeenCalledTimes(1);

      await answer({ success: true, data: { user: { id: 'u1' }, session: {} } });
    });

    // Review pass 1: the keyboard goes as a request starts, and a failure's banner then shows with
    // the fields below it rather than behind the footer.
    it('dismisses the keyboard as the request starts', async () => {
      const dismiss = jest.spyOn(Keyboard, 'dismiss');
      try {
        const answer = holdRequest();
        render(<SignInScreen />);
        fillIn('test@example.com', 'Password1');
        pressSignIn();
        expect(dismiss).toHaveBeenCalledTimes(1);
        expect(dismiss.mock.invocationCallOrder[0]).toBeLessThan(
          mockSignInWithEmail.mock.invocationCallOrder[0] ?? 0
        );
        await answer({ success: false, error: { code: 'invalid_credentials' } });
      } finally {
        dismiss.mockRestore();
      }
    });

    it('is named in the language the app speaks', async () => {
      await act(async () => {
        await changeAppLanguage('it');
      });
      const answer = holdRequest();
      render(<SignInScreen />);
      fillIn('test@example.com', 'Password1');
      pressSignIn();
      expect(screen.getByTestId('sign-in-button').props.accessibilityLabel).toBe(
        'Accesso in corso...'
      );
      await answer({ success: true, data: { user: { id: 'u1' }, session: {} } });
    });
  });

  describe('frame F: a failed request', () => {
    const failWith = async (error: { code?: string; message?: string }) => {
      mockSignInWithEmail.mockResolvedValue({ success: false, error });
      render(<SignInScreen />);
      fillIn('test@example.com', 'Password1');
      pressSignIn();
      await waitFor(() => expect(screen.getByTestId('server-error')).toBeTruthy());
    };

    it('shows one banner with the mapped message, above the fields', async () => {
      await failWith({ code: 'invalid_credentials', message: 'Invalid login credentials' });
      expect(screen.UNSAFE_getAllByType(RequestErrorBanner)).toHaveLength(1);
      expect(screen.getAllByText(INCORRECT)).toHaveLength(1);
      expect(screen.getByTestId('server-error').props.accessibilityRole).toBe('alert');
      expectInOrder(['sign-in-subtitle', 'server-error', 'email-input']);
    });

    // The server's refusal is not a verdict on the typing.
    it('reddens no field, shows no toast, and leaves Sign In enabled', async () => {
      await failWith({ code: 'invalid_credentials' });
      expect(flat('email-input').borderColor).toBe(LIGHT_THEME.border);
      expect(flat('password-input').borderColor).toBe(LIGHT_THEME.border);
      expect(screen.queryByTestId('email-input-error')).toBeNull();
      expect(screen.queryByTestId('password-input-error')).toBeNull();
      expect(toast).not.toHaveBeenCalled();
      expect(screen.getByTestId('sign-in-button').props.accessibilityState).toMatchObject({
        disabled: false,
        busy: false
      });
    });

    // Review pass 1: a press that validation refuses starts no request, so the banner stays.
    it('stays through a press that validation refuses', async () => {
      await failWith({ code: 'invalid_credentials' });
      fireEvent.changeText(screen.getByTestId('password-input'), '');
      pressSignIn();
      expect(screen.getByTestId('password-input-error')).toBeTruthy();
      expect(screen.getByText(INCORRECT)).toBeTruthy();
      expect(mockSignInWithEmail).toHaveBeenCalledTimes(1);
    });

    it('stays while the fields are edited, until the next request starts', async () => {
      await failWith({ code: 'invalid_credentials' });
      fireEvent.changeText(screen.getByTestId('password-input'), 'Password2');
      expect(screen.getByText(INCORRECT)).toBeTruthy();

      const answer = holdRequest();
      pressSignIn();
      expect(screen.queryByTestId('server-error')).toBeNull();
      await answer({ success: false, error: { code: 'invalid_credentials' } });
      expect(screen.getByTestId('server-error')).toBeTruthy();
    });

    it.each([
      [{ code: 'email_not_confirmed' }, 'Please verify your email address first.'],
      [{ message: 'Invalid login credentials' }, INCORRECT],
      [
        { message: 'Network request failed' },
        'Unable to connect. Check your internet and try again.'
      ],
      [{ message: 'Failed to fetch' }, 'Unable to connect. Check your internet and try again.'],
      [{ message: 'Something else' }, 'Something went wrong. Please try again.']
    ])('maps %j to "%s", as before', async (error, message) => {
      await failWith(error);
      expect(screen.getByText(message)).toBeTruthy();
    });

    it('maps a request that throws to the network message', async () => {
      mockSignInWithEmail.mockRejectedValue(new Error('offline'));
      render(<SignInScreen />);
      fillIn('test@example.com', 'Password1');
      pressSignIn();
      await waitFor(() =>
        expect(
          screen.getByText('Unable to connect. Check your internet and try again.')
        ).toBeTruthy()
      );
    });
  });

  it('signs in with the trimmed email and goes home', async () => {
    mockSignInWithEmail.mockResolvedValue({
      success: true,
      data: { user: { id: 'u1' }, session: { access_token: 'token' } }
    });
    render(<SignInScreen />);
    fillIn('  test@example.com ', 'Password1');
    pressSignIn();
    await waitFor(() => {
      expect(mockSignInWithEmail).toHaveBeenCalledWith('test@example.com', 'Password1');
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  // Story 22.9, decision 3: from a font scale of 1.5 the way out closes the body.
  describe('the way out at the largest sizes', () => {
    it('sits under the primary in the footer just below a font scale of 1.5', () => {
      setFontScale(1.49);
      render(<SignInScreen />);
      expectInOrder(['sign-in-screen-footer', 'sign-in-button', 'create-account-link']);
      expect(screen.queryByTestId('sign-in-screen-body-link')).toBeNull();
    });

    it('closes the body after "Forgot password?", leaving the primary alone in the footer, from 1.5', () => {
      setFontScale(1.5);
      render(<SignInScreen />);
      expectInOrder([
        'forgot-password-link',
        'sign-in-screen-body-link',
        'create-account-link',
        'sign-in-screen-footer',
        'sign-in-button'
      ]);
    });
  });
});

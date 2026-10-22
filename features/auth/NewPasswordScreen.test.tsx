/**
 * New password — auth frame E, on the form pattern (Story 22.9).
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Keyboard, ScrollView, StyleSheet, TextInput } from 'react-native';

import { FormScreen } from '@/shared/components/ui';
import { changeAppLanguage } from '@/shared/i18n';
import { DARK_THEME, LIGHT_THEME, type Theme } from '@/shared/theme/colors';

import NewPasswordScreen from './NewPasswordScreen';

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
const mockDismissTo = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn();
const mockParams: Record<string, string | undefined> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    dismissTo: mockDismissTo,
    back: mockBack,
    canGoBack: mockCanGoBack
  }),
  useLocalSearchParams: () => mockParams
}));

const mockUpdatePassword = jest.fn();
jest.mock('@/shared/supabase/auth', () => ({
  updatePassword: (...args: unknown[]) => mockUpdatePassword(...args)
}));

const mockShowToast = jest.fn();
jest.mock('@/shared/toast', () => ({
  showToast: (...args: unknown[]) => mockShowToast(...args)
}));

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

const expectInOrder = (testIDs: string[]) => {
  const tree = JSON.stringify(screen.toJSON());
  const order = testIDs.map((testID) => tree.indexOf(`"${testID}"`));
  expect(order.every((index) => index > -1)).toBe(true);
  expect([...order].sort((a, b) => a - b)).toEqual(order);
};

const fillPasswords = (password: string, confirm: string) => {
  fireEvent.changeText(screen.getByTestId('password-input'), password);
  fireEvent.changeText(screen.getByTestId('confirm-password-input'), confirm);
};

const pressUpdate = () => fireEvent.press(screen.getByTestId('update-password-button'));

/** An update that answers only when told to. */
const holdUpdate = () => {
  let answer: (value: unknown) => void = () => {};
  mockUpdatePassword.mockImplementation(
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

const RULE = 'Min 8 characters, at least one letter and one number.';
const GENERIC = 'An unexpected error occurred. Please try again.';

describe('NewPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // After recovery begun from Home the screen is alone on the stack.
    mockCanGoBack.mockReturnValue(false);
    Object.keys(mockParams).forEach((key) => delete mockParams[key]);
  });

  afterEach(async () => {
    mockIsDark = false;
    await act(async () => {
      await changeAppLanguage('en');
    });
  });

  describe('frame E', () => {
    it('draws one FormScreen, with no header row when nothing is beneath it', () => {
      render(<NewPasswordScreen />);
      expect(screen.UNSAFE_getAllByType(FormScreen)).toHaveLength(1);
      expect(screen.queryByTestId('new-password-screen-header')).toBeNull();
      expect(screen.queryByTestId('new-password-screen-back')).toBeNull();
    });

    // From Settings, Settings is beneath it, and its back goes there.
    it('holds the back alone when there is a screen beneath it', () => {
      mockCanGoBack.mockReturnValue(true);
      mockParams.origin = 'change-password';
      render(<NewPasswordScreen />);
      fireEvent.press(screen.getByTestId('new-password-screen-back'));
      expect(mockBack).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('new-password-screen-title')).toBeNull();
    });

    it('leads with the mark, "Set New Password" and its subtitle', () => {
      render(<NewPasswordScreen />);
      expect(screen.getByTestId('auth-app-icon')).toBeTruthy();
      expect(screen.getByTestId('new-password-title').props.children).toBe('Set New Password');
      expect(screen.getByTestId('new-password-title').props.accessibilityRole).toBe('header');
      expect(screen.getByTestId('new-password-subtitle').props.children).toBe(
        'Choose a strong new password for your account.'
      );
    });

    it('draws NEW PASSWORD and CONFIRM PASSWORD, and Update Password alone in the footer', () => {
      render(<NewPasswordScreen />);
      expectInOrder([
        'new-password-subtitle',
        'password-input',
        'confirm-password-input',
        'new-password-screen-footer',
        'update-password-button'
      ]);
      expect(screen.getByText('New Password')).toBeTruthy();
      expect(screen.getByText('Confirm Password')).toBeTruthy();
      expect(screen.getByText('Update Password')).toBeTruthy();
      // No way out: the button is alone in the footer.
      let actions = screen.getByTestId('update-password-button').parent;
      while (actions && typeof actions.type !== 'string') {
        actions = actions.parent;
      }
      expect(actions?.children).toHaveLength(1);
    });

    it('draws no password-requirements caption', () => {
      render(<NewPasswordScreen />);
      expect(screen.queryByTestId('password-requirements')).toBeNull();
      expect(screen.getByTestId('password-input').props).toMatchObject({
        placeholder: 'Min 8 chars, 1 letter, 1 number',
        accessibilityHint: 'Minimum 8 characters with at least one letter and one number'
      });
    });

    // Always mounted, as shipped; it draws nothing until a password is typed.
    it('shows the meter once a password is typed, between the two fields', () => {
      render(<NewPasswordScreen />);
      expect(screen.queryByTestId('password-strength-indicator')).toBeNull();

      fireEvent.changeText(screen.getByTestId('password-input'), 'ValidPass123!');
      expect(screen.getByTestId('password-strength-indicator-label').props.children).toBe('Strong');
      expectInOrder(['password-input', 'password-strength-indicator', 'confirm-password-input']);

      // 8 below the password field: the group's gap.
      let group = screen.getByTestId('password-strength-indicator').parent;
      while (group && typeof group.type !== 'string') {
        group = group.parent;
      }
      expect(StyleSheet.flatten(group?.props.style).gap).toBe(8);
    });

    it('keeps each field’s name and hint', () => {
      render(<NewPasswordScreen />);
      expect(screen.getByTestId('password-input').props).toMatchObject({
        accessibilityLabel: 'New Password',
        accessibilityHint: 'Minimum 8 characters with at least one letter and one number'
      });
      expect(screen.getByTestId('confirm-password-input').props).toMatchObject({
        accessibilityLabel: 'Confirm Password',
        accessibilityHint: 'Re-enter your new password to confirm'
      });
    });

    it.each<[string, boolean, Theme]>([
      ['light', false, LIGHT_THEME],
      ['dark', true, DARK_THEME]
    ])('sits on the %s ground', (_scheme, isDark, theme) => {
      mockIsDark = isDark;
      render(<NewPasswordScreen />);
      expect(flat('new-password-screen').backgroundColor).toBe(theme.background);
    });

    it('speaks the language the app speaks', async () => {
      await act(async () => {
        await changeAppLanguage('it');
      });
      render(<NewPasswordScreen />);
      expect(screen.getByText('Imposta una nuova password')).toBeTruthy();
      expect(screen.getByText('Aggiorna password')).toBeTruthy();
    });

    it('draws no MaterialIcons glyph', () => {
      render(<NewPasswordScreen />);
      expect(screen.queryAllByTestId(/^icon-/, { includeHiddenElements: true })).toHaveLength(0);
    });

    // The Never list: nothing is added, so these are all the controls there are — after recovery,
    // with nothing beneath it, no back among them.
    it('draws its own controls and no other', () => {
      render(<NewPasswordScreen />);
      expect(controls()).toEqual([
        'password-input',
        'password-input-toggle',
        'confirm-password-input',
        'confirm-password-input-toggle',
        'update-password-button'
      ]);
    });

    // The focused field, with its label, is brought into view above the footer (Story 22.9).
    it('keeps the focused field in view: NEW PASSWORD with its meter, then CONFIRM PASSWORD', () => {
      render(<NewPasswordScreen />);
      fireEvent.changeText(screen.getByTestId('password-input'), 'abc');
      expect(isInside('password-input', 'new-password-screen-field-0')).toBe(true);
      expect(isInside('password-strength-indicator', 'new-password-screen-field-0')).toBe(true);
      expect(isInside('confirm-password-input', 'new-password-screen-field-1')).toBe(true);
    });
  });

  describe('validation', () => {
    // Nothing is flagged until the first press, however the fields are filled.
    it('flags nothing while the fields are typed, before the first press', () => {
      render(<NewPasswordScreen />);
      fillPasswords('weak', 'x');
      expect(screen.queryByTestId('password-input-error')).toBeNull();
      expect(screen.queryByTestId('confirm-password-input-error')).toBeNull();
    });

    it('flags empty fields at the press without calling updatePassword, and stays enabled', () => {
      render(<NewPasswordScreen />);
      pressUpdate();
      expect(screen.getByText('Password is required.')).toBeTruthy();
      expect(screen.getByText('Please confirm your password.')).toBeTruthy();
      expect(mockUpdatePassword).not.toHaveBeenCalled();
      expect(screen.getByTestId('update-password-button').props.accessibilityState.disabled).toBe(
        false
      );
    });

    it('blocks a weak password without calling updatePassword', () => {
      render(<NewPasswordScreen />);
      fillPasswords('weak', 'weak');
      pressUpdate();
      expect(screen.getByText(RULE)).toBeTruthy();
      expect(mockUpdatePassword).not.toHaveBeenCalled();
    });

    it('flags mismatched passwords without calling updatePassword', () => {
      render(<NewPasswordScreen />);
      fillPasswords('ValidPass1', 'ValidPass2');
      pressUpdate();
      expect(screen.getByText('Passwords do not match.')).toBeTruthy();
      expect(mockUpdatePassword).not.toHaveBeenCalled();
    });

    it('focuses the first invalid field', () => {
      const focus = jest.spyOn(TextInput.prototype, 'focus');
      const focused = () =>
        focus.mock.contexts.map((input) => (input as { props: { testID?: string } }).props.testID);
      try {
        render(<NewPasswordScreen />);
        pressUpdate();
        expect(focused()).toEqual(['password-input']);

        focus.mockClear();
        fillPasswords('ValidPass1', 'ValidPass2');
        pressUpdate();
        expect(focused()).toEqual(['confirm-password-input']);
      } finally {
        focus.mockRestore();
      }
    });

    // Review pass 1: no press is refused out of sight. The keyboard up leaves the body 300 tall;
    // the fields' column is 260 into it, NEW PASSWORD with its meter 104 tall and CONFIRM 74 at 136.
    it('brings the first invalid field into view at a refused press, keeping the keyboard', () => {
      const dismiss = jest.spyOn(Keyboard, 'dismiss');
      try {
        render(<NewPasswordScreen />);
        layOut(screen.UNSAFE_getByType(ScrollView), 0, 300);
        layOut(screen.getByTestId('new-password-screen-fields'), 260, 210);
        layOut(screen.getByTestId('new-password-screen-field-0'), 0, 104);
        layOut(screen.getByTestId('new-password-screen-field-1'), 136, 74);
        fillPasswords('ValidPass1', 'ValidPass2');

        pressUpdate();
        // CONFIRM's bottom is 470: 470 + 24 − 300.
        expect(scrollTo).toHaveBeenLastCalledWith({ y: 194, animated: true });
        layOut(screen.getByTestId('new-password-screen-field-1'), 136, 98);
        expect(scrollTo).toHaveBeenLastCalledWith({ y: 218, animated: true });
        expect(dismiss).not.toHaveBeenCalled();

        fillPasswords('weak', 'weak');
        pressUpdate();
        // NEW PASSWORD's bottom is 364: 364 + 24 − 300.
        expect(scrollTo).toHaveBeenLastCalledWith({ y: 88, animated: true });
      } finally {
        dismiss.mockRestore();
      }
    });

    it('follows the typing after the press, clearing or erring', () => {
      render(<NewPasswordScreen />);
      fillPasswords('weak', 'weak');
      pressUpdate();
      expect(screen.getByText(RULE)).toBeTruthy();

      fireEvent.changeText(screen.getByTestId('password-input'), 'ValidPass1');
      expect(screen.queryByText(RULE)).toBeNull();
      expect(screen.getByText('Passwords do not match.')).toBeTruthy();

      fireEvent.changeText(screen.getByTestId('confirm-password-input'), 'ValidPass1');
      expect(screen.queryByText('Passwords do not match.')).toBeNull();
    });
  });

  it('keeps the fill and shows a spinner named "Updating password..." while it updates', async () => {
    let answer: (value: unknown) => void = () => {};
    mockUpdatePassword.mockImplementation(
      () =>
        new Promise((resolve) => {
          answer = resolve;
        })
    );
    render(<NewPasswordScreen />);
    fillPasswords('ValidPass1', 'ValidPass1');
    pressUpdate();

    const button = screen.getByTestId('update-password-button');
    expect(screen.getByTestId('update-password-button-spinner')).toBeTruthy();
    expect(button.props.accessibilityLabel).toBe('Updating password...');
    expect(button.props.accessibilityState).toMatchObject({ busy: true, disabled: false });
    expect(flat('update-password-button-container').backgroundColor).toBe(LIGHT_THEME.primary);
    // Nothing dims.
    expect(flat('new-password-screen').opacity).toBeUndefined();
    expect(flat('password-input').backgroundColor).toBe(LIGHT_THEME.surface);
    expect(screen.getByTestId('password-input').props.editable).toBe(true);

    pressUpdate();
    expect(mockUpdatePassword).toHaveBeenCalledTimes(1);
    await act(async () => answer({ success: true, data: undefined }));
  });

  it('is named in the language the app speaks while it updates', async () => {
    await act(async () => {
      await changeAppLanguage('it');
    });
    const answer = holdUpdate();
    render(<NewPasswordScreen />);
    fillPasswords('ValidPass1', 'ValidPass1');
    pressUpdate();
    expect(screen.getByTestId('update-password-button').props.accessibilityLabel).toBe(
      'Aggiornamento della password...'
    );
    await answer({ success: true, data: undefined });
  });

  // Review pass 1: the keyboard goes as a request starts, and a failure's banner then shows with
  // the fields below it rather than behind the footer.
  it('dismisses the keyboard as the request starts', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    try {
      const answer = holdUpdate();
      render(<NewPasswordScreen />);
      fillPasswords('ValidPass1', 'ValidPass1');
      pressUpdate();
      expect(dismiss).toHaveBeenCalledTimes(1);
      expect(dismiss.mock.invocationCallOrder[0]).toBeLessThan(
        mockUpdatePassword.mock.invocationCallOrder[0] ?? 0
      );
      await answer({ success: true, data: undefined });
    } finally {
      dismiss.mockRestore();
    }
  });

  it('updates the password and goes home after recovery', async () => {
    mockUpdatePassword.mockResolvedValue({ success: true, data: undefined });
    render(<NewPasswordScreen />);
    fillPasswords('ValidPass1', 'ValidPass1');
    pressUpdate();

    await waitFor(() => {
      expect(mockUpdatePassword).toHaveBeenCalledWith('ValidPass1');
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('confirms with a toast and returns to /settings when origin=change-password (AC4)', async () => {
    mockUpdatePassword.mockResolvedValue({ success: true, data: undefined });
    mockParams.origin = 'change-password';
    render(<NewPasswordScreen />);
    fillPasswords('ValidPass1', 'ValidPass1');
    pressUpdate();

    await waitFor(() => {
      expect(mockUpdatePassword).toHaveBeenCalledWith('ValidPass1');
      expect(mockShowToast).toHaveBeenCalledWith({ title: 'Password changed', preset: 'done' });
      expect(mockDismissTo).toHaveBeenCalledWith('/settings');
    });
    // The recovery destination (replace to /) must not be used for this flow.
    expect(mockReplace).not.toHaveBeenCalled();
  });

  describe('a failed request', () => {
    const failWith = async (outcome: () => void) => {
      outcome();
      render(<NewPasswordScreen />);
      fillPasswords('ValidPass1', 'ValidPass1');
      pressUpdate();
      await waitFor(() => expect(screen.getByTestId('server-error')).toBeTruthy());
    };

    it('stays while the fields are edited, until the next request starts', async () => {
      await failWith(() =>
        mockUpdatePassword.mockResolvedValue({ success: false, error: { message: 'x' } })
      );
      fillPasswords('ValidPass2', 'ValidPass2');
      expect(screen.getByText(GENERIC)).toBeTruthy();

      const answer = holdUpdate();
      pressUpdate();
      expect(screen.queryByTestId('server-error')).toBeNull();
      await answer({ success: false, error: { message: 'x' } });
      expect(screen.getByTestId('server-error')).toBeTruthy();
    });

    it('shows a mapped network error in one banner, reddening nothing and with no toast', async () => {
      await failWith(() =>
        mockUpdatePassword.mockResolvedValue({
          success: false,
          error: { message: 'Network request failed' }
        })
      );
      expect(
        screen.getAllByText('Unable to connect. Check your internet and try again.')
      ).toHaveLength(1);
      expectInOrder(['new-password-subtitle', 'server-error', 'password-input']);
      expect(flat('password-input').borderColor).toBe(LIGHT_THEME.border);
      expect(flat('confirm-password-input').borderColor).toBe(LIGHT_THEME.border);
      expect(mockShowToast).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('surfaces a generic error for a non-network failure', async () => {
      await failWith(() =>
        mockUpdatePassword.mockResolvedValue({
          success: false,
          error: { message: 'Password too weak' }
        })
      );
      expect(screen.getByText(GENERIC)).toBeTruthy();
    });

    it('surfaces a generic error when updatePassword throws', async () => {
      await failWith(() => mockUpdatePassword.mockRejectedValue(new Error('boom')));
      expect(screen.getByText(GENERIC)).toBeTruthy();
    });

    // Review pass 1: a press that validation refuses starts no request, so the banner stays.
    it('stays through a press that validation refuses', async () => {
      await failWith(() =>
        mockUpdatePassword.mockResolvedValue({ success: false, error: { message: 'x' } })
      );
      fireEvent.changeText(screen.getByTestId('confirm-password-input'), 'ValidPass2');
      pressUpdate();
      expect(screen.getByText('Passwords do not match.')).toBeTruthy();
      expect(screen.getByText(GENERIC)).toBeTruthy();
      expect(mockUpdatePassword).toHaveBeenCalledTimes(1);
    });
  });
});

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

import {
  act,
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
  within
} from '@testing-library/react-native';
import React from 'react';
import { AccessibilityInfo, StyleSheet } from 'react-native';

import { ActionRow } from '@/shared/components/ui/ActionRow';
import { Button } from '@/shared/components/ui/Button';
import { ScreenHeader } from '@/shared/components/ui/ScreenHeader';
import { LIGHT_THEME } from '@/shared/theme/colors';

import SettingsScreen from './SettingsScreen';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

const mockUseAuthState = jest.fn();
const mockGetSession = jest.fn();
const mockSignOut = jest.fn();
const mockDeleteAccount = jest.fn();
const mockSendPasswordResetOtp = jest.fn();
const mockClearLastSyncAt = jest.fn();
const mockShowToast = jest.fn();

const mockUseThemePreference = jest.fn();
const mockUseLanguagePreference = jest.fn();
const mockUseExportData = jest.fn();
const mockUseImportData = jest.fn();
const mockUseSyncTrigger = jest.fn();
const mockUseAutoBrightnessPreference = jest.fn();

const BACKGROUND = LIGHT_THEME.background;
const INSETS = { top: 59, right: 0, bottom: 34, left: 0 };

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack })
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { version: '1.4.0' }
  }
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return {
    useSafeAreaInsets: () => INSETS,
    // The ground: a view that keeps the edges it is given, so the test can read them back.
    SafeAreaView: (props: Record<string, unknown>) => <View {...props} />
  };
});

// The real light theme, so what the screen draws is checked against the roles themselves.
jest.mock('@/shared/theme', () => ({
  useTheme: () => ({ theme: jest.requireActual('@/shared/theme/colors').LIGHT_THEME })
}));

jest.mock('@/shared/supabase/useAuthState', () => ({
  useAuthState: () => mockUseAuthState()
}));

jest.mock('@/shared/supabase/auth', () => ({
  getSession: () => mockGetSession(),
  signOut: () => mockSignOut(),
  deleteAccount: () => mockDeleteAccount(),
  sendPasswordResetOtp: (...args: unknown[]) => mockSendPasswordResetOtp(...args)
}));

jest.mock('@/shared/toast', () => ({
  showToast: (...args: unknown[]) => mockShowToast(...args)
}));

jest.mock('@/core/sync/sync-timestamp', () => ({
  clearLastSyncAt: () => mockClearLastSyncAt()
}));

jest.mock('@/core/catalogue/catalogue-repository', () => ({
  catalogueRepository: { getVersion: () => 'v3 · Mar 2026' }
}));

jest.mock('../hooks/useThemePreference', () => ({
  useThemePreference: () => mockUseThemePreference()
}));

jest.mock('../hooks/useLanguagePreference', () => ({
  useLanguagePreference: () => mockUseLanguagePreference()
}));

jest.mock('../hooks/useExportData', () => ({
  useExportData: () => mockUseExportData()
}));

// Forwards the options the screen hands the hook, so a test can read them back.
jest.mock('../hooks/useImportData', () => ({
  useImportData: (...args: unknown[]) => mockUseImportData(...args)
}));

jest.mock('../hooks/useSyncTrigger', () => ({
  useSyncTrigger: () => mockUseSyncTrigger()
}));

jest.mock('../hooks/useAutoBrightnessPreference', () => ({
  useAutoBrightnessPreference: () => mockUseAutoBrightnessPreference()
}));

// The jest.setup mock completes every animation at once; a closing test holds the slide-out open.
const reanimated = jest.requireMock<{
  withTiming: (value: number, config?: object, callback?: (finished?: boolean) => void) => number;
}>('react-native-reanimated');

const PREVIEW = {
  fileName: 'my-cards-backup.json',
  totalCards: 8,
  newCardsCount: 5,
  duplicateCount: 3,
  invalidCount: 1,
  importableCards: []
};

const INVALID_FILE = {
  title: 'Invalid File',
  message: "This file doesn't contain valid card data. Please select a different file.",
  variant: 'invalid' as const
};

const importData = (overrides: Record<string, unknown> = {}) => ({
  preview: null,
  errorState: null,
  isPreparing: false,
  isImporting: false,
  pickImportFile: jest.fn(),
  confirmImport: jest.fn(),
  closePreview: jest.fn(),
  closeError: jest.fn(),
  ...overrides
});

const exportData = (overrides: Record<string, unknown> = {}) => ({
  cardCount: 2,
  hasCards: true,
  isExporting: false,
  exportError: null,
  clearExportError: jest.fn(),
  refreshCardCount: jest.fn().mockResolvedValue(undefined),
  exportCards: jest.fn().mockResolvedValue(true),
  ...overrides
});

const signedIn = () =>
  mockUseAuthState.mockReturnValue({ isAuthenticated: true, authState: 'authenticated' });
const guest = () =>
  mockUseAuthState.mockReturnValue({ isAuthenticated: false, authState: 'guest' });

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

const testIDOrder = (testIDs: string[]) => {
  const tree = JSON.stringify(screen.toJSON());
  return testIDs.map((testID) => tree.indexOf(`"${testID}"`));
};

const expectInOrder = (testIDs: string[]) => {
  const order = testIDOrder(testIDs);
  expect(order.every((index) => index > -1)).toBe(true);
  expect([...order].sort((a, b) => a - b)).toEqual(order);
};

/** A sheet's content is hidden from assistive technology while it slides out. */
const hidden = { includeHiddenElements: true };

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseThemePreference.mockReturnValue({
      themePreference: 'system',
      themePreferenceLabel: 'System',
      isThemePickerOpen: false,
      openThemePicker: jest.fn(),
      closeThemePicker: jest.fn(),
      selectTheme: jest.fn()
    });

    mockUseLanguagePreference.mockReturnValue({
      languageCode: 'en',
      languageName: 'English',
      supportedLanguages: [{ code: 'en', name: 'English' }],
      isLanguagePickerOpen: false,
      openLanguagePicker: jest.fn(),
      closeLanguagePicker: jest.fn(),
      selectLanguage: jest.fn()
    });

    mockUseExportData.mockReturnValue(exportData());
    mockUseImportData.mockReturnValue(importData());

    mockUseSyncTrigger.mockReturnValue({
      isSyncing: false,
      syncLabel: 'just now',
      triggerSync: jest.fn()
    });

    mockUseAutoBrightnessPreference.mockReturnValue({
      isAutoBrightnessEnabled: false,
      setAutoBrightness: jest.fn()
    });

    mockGetSession.mockResolvedValue({
      success: true,
      data: { user: { email: 'maria@gmail.com' } }
    });

    mockSignOut.mockResolvedValue({ success: true, data: undefined });
    mockDeleteAccount.mockResolvedValue({ success: true, data: undefined });
    mockSendPasswordResetOtp.mockResolvedValue({ success: true, data: undefined });
    mockClearLastSyncAt.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders guest account section when unauthenticated', () => {
    guest();

    const { getByTestId, queryByTestId } = render(<SettingsScreen />);

    expect(getByTestId('settings-guest-card')).toBeTruthy();
    expect(queryByTestId('settings-account-card')).toBeNull();
    // Change Password is an account-only action — never shown to guests (AC1).
    expect(queryByTestId('settings-change-password-row')).toBeNull();
  });

  it('renders signed-in account section when authenticated', async () => {
    signedIn();

    const { getByTestId } = render(<SettingsScreen />);

    await waitFor(() => {
      expect(getByTestId('settings-account-card')).toBeTruthy();
    });
  });

  it('navigates to create-account from guest CTA', () => {
    guest();

    const { getByTestId } = render(<SettingsScreen />);

    fireEvent.press(getByTestId('settings-create-account-button'));

    expect(mockPush).toHaveBeenCalledWith('/create-account');
  });

  it('starts the import flow from the import action row', () => {
    const pickImportFile = jest.fn();
    guest();
    mockUseImportData.mockReturnValue(importData({ pickImportFile }));

    const { getByTestId } = render(<SettingsScreen />);

    fireEvent.press(getByTestId('settings-import-row'));

    expect(pickImportFile).toHaveBeenCalled();
  });

  it('renders import sheets from hook state', () => {
    guest();
    mockUseImportData.mockReturnValue(importData({ preview: PREVIEW, errorState: INVALID_FILE }));

    const { getByText } = render(<SettingsScreen />);

    expect(getByText('Import Cards')).toBeTruthy();
    expect(getByText('Invalid File')).toBeTruthy();
  });

  it('opens sign out sheet and signs out', async () => {
    signedIn();

    const { getByTestId } = render(<SettingsScreen />);

    fireEvent.press(getByTestId('settings-signout-row'));
    fireEvent.press(getByTestId('signout-confirm'));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('still navigates when clearLastSyncAt fails after sign-out success', async () => {
    signedIn();
    mockClearLastSyncAt.mockRejectedValueOnce(new Error('storage unavailable'));

    const { getByTestId } = render(<SettingsScreen />);

    fireEvent.press(getByTestId('settings-signout-row'));
    fireEvent.press(getByTestId('signout-confirm'));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('still navigates when clearLastSyncAt fails after delete success', async () => {
    signedIn();
    mockClearLastSyncAt.mockRejectedValueOnce(new Error('storage unavailable'));

    const { getByTestId } = render(<SettingsScreen />);

    fireEvent.press(getByTestId('settings-delete-row'));
    fireEvent.press(getByTestId('delete-continue-step1'));
    fireEvent.changeText(getByTestId('delete-confirm-input'), 'DELETE');
    fireEvent.press(getByTestId('delete-confirm-step2'));

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('starts change-password: sends the OTP and routes to recovery-otp tagged change-password (AC2)', async () => {
    signedIn();

    const { getByTestId, getByText } = render(<SettingsScreen />);

    // Wait for the session email to load so the guard passes.
    await waitFor(() => expect(getByText('maria@gmail.com')).toBeTruthy());

    fireEvent.press(getByTestId('settings-change-password-row'));

    await waitFor(() => {
      expect(mockSendPasswordResetOtp).toHaveBeenCalledWith('maria@gmail.com');
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/recovery-otp',
        params: expect.objectContaining({ email: 'maria@gmail.com', origin: 'change-password' })
      });
    });
  });

  it('ignores a second Change Password tap while the first send is in flight', async () => {
    signedIn();
    let resolveSend: (value: unknown) => void = () => {};
    mockSendPasswordResetOtp.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSend = resolve;
        })
    );

    const { getByTestId, getByText } = render(<SettingsScreen />);

    await waitFor(() => expect(getByText('maria@gmail.com')).toBeTruthy());

    // A rapid double tap must not fire two OTP sends (no duplicate emails).
    fireEvent.press(getByTestId('settings-change-password-row'));
    fireEvent.press(getByTestId('settings-change-password-row'));

    expect(mockSendPasswordResetOtp).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSend({ success: true, data: undefined });
    });
  });

  // Story 22.7: busy, not disabled — the row keeps its look and shows the spinner while it sends.
  it('shows the spinner on Change Password while its code is sent, never dimming it', async () => {
    signedIn();
    let resolveSend: (value: unknown) => void = () => {};
    mockSendPasswordResetOtp.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSend = resolve;
        })
    );

    render(<SettingsScreen />);
    await waitFor(() => expect(screen.getByText('maria@gmail.com')).toBeTruthy());

    fireEvent.press(screen.getByTestId('settings-change-password-row'));
    const row = screen.getByTestId('settings-change-password-row');
    expect(screen.getByTestId('settings-change-password-row-spinner')).toBeTruthy();
    expect(row.props.accessibilityState).toEqual({ disabled: false, busy: true });
    expect(flat('settings-change-password-row').opacity).toBeUndefined();

    await act(async () => {
      resolveSend({ success: true, data: undefined });
    });
    expect(screen.queryByTestId('settings-change-password-row-spinner')).toBeNull();
  });

  it('shows an error toast and does not navigate when the OTP send fails (AC5)', async () => {
    signedIn();
    mockSendPasswordResetOtp.mockResolvedValue({
      success: false,
      error: { message: 'rate limited' }
    });

    const { getByTestId, getByText } = render(<SettingsScreen />);

    await waitFor(() => expect(getByText('maria@gmail.com')).toBeTruthy());

    fireEvent.press(getByTestId('settings-change-password-row'));

    await waitFor(() => {
      expect(mockSendPasswordResetOtp).toHaveBeenCalledWith('maria@gmail.com');
      expect(mockShowToast).toHaveBeenCalledWith({
        title: 'Unable to send the verification code. Please try again.',
        preset: 'error'
      });
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows an error toast when the OTP send throws unexpectedly', async () => {
    signedIn();
    mockSendPasswordResetOtp.mockRejectedValue(new Error('boom'));

    const { getByTestId, getByText } = render(<SettingsScreen />);

    await waitFor(() => expect(getByText('maria@gmail.com')).toBeTruthy());

    fireEvent.press(getByTestId('settings-change-password-row'));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        title: 'Unable to send the verification code. Please try again.',
        preset: 'error'
      });
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('surfaces feedback and does not send when the session email has not loaded', async () => {
    signedIn();
    mockGetSession.mockResolvedValue({ success: true, data: { user: { email: undefined } } });

    const { getByTestId } = render(<SettingsScreen />);

    // The row renders immediately (fallback email), but with no real email the
    // guard must block the send AND give feedback rather than a dead tap.
    fireEvent.press(getByTestId('settings-change-password-row'));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        title: 'Unable to send the verification code. Please try again.',
        preset: 'error'
      });
    });
    expect(mockSendPasswordResetOtp).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  /** Story 22.7 — frames A and B. */
  describe('the screen', () => {
    // The ground runs under the top inset and the sides; the list runs on under the home
    // indicator, so the bottom inset is the list's padding instead.
    it('lays the ground under the top inset and the sides, but not the bottom', () => {
      guest();
      render(<SettingsScreen />);
      const ground = screen.getByTestId('settings-screen');
      expect(ground.props.edges).toEqual(['top', 'left', 'right']);
      expect(flat('settings-screen')).toMatchObject({ flex: 1, backgroundColor: BACKGROUND });
    });

    it('draws the shared header, "Settings", whose back goes back', async () => {
      guest();
      render(<SettingsScreen />);
      expect(screen.UNSAFE_getByType(ScreenHeader).props.title).toBe('Settings');
      expect(screen.getByRole('header', { name: 'Settings' })).toBeTruthy();

      const back = screen.getByTestId('settings-back-button');
      expect(back.props.accessibilityLabel).toBe('Go back');
      await userEvent.press(back);
      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('puts the header above the list', () => {
      guest();
      render(<SettingsScreen />);
      expectInOrder(['settings-header', 'settings-screen-scroll']);
    });

    // 16 at the top, 24 at the sides, 24 plus the home indicator at the bottom; groups 24 apart.
    it('pads the list 16/24 and 24 above the home indicator, the groups 24 apart', () => {
      guest();
      render(<SettingsScreen />);
      expect(
        StyleSheet.flatten(screen.getByTestId('settings-screen-scroll').props.contentContainerStyle)
      ).toEqual({
        paddingTop: 16,
        paddingHorizontal: 24,
        paddingBottom: 24 + INSETS.bottom,
        gap: 24
      });
    });

    it('orders the account group, PREFERENCES, DATA and ABOUT, signed in (frame A)', async () => {
      signedIn();
      render(<SettingsScreen />);
      await waitFor(() => expect(screen.getByText('maria@gmail.com')).toBeTruthy());

      expectInOrder([
        'settings-account-card',
        'settings-theme-row',
        'settings-language-row',
        'settings-auto-brightness-toggle',
        'settings-export-row',
        'settings-import-row',
        'settings-sync-row',
        'settings-help-row',
        'settings-privacy-row',
        'settings-what-we-collect-row',
        'settings-app-version-row',
        'settings-catalogue-row'
      ]);
      expect(screen.getAllByRole('header').map((header) => header.props.children)).toEqual([
        'Settings',
        'Preferences',
        'Data',
        'About'
      ]);
    });

    // Frame B, with no Sync row: a guest has no account to sync (Stories 7.7 and 13.6).
    it('orders the guest group first, with no Sync row, as a guest (frame B)', () => {
      guest();
      render(<SettingsScreen />);
      expectInOrder([
        'settings-guest-card',
        'settings-theme-row',
        'settings-export-row',
        'settings-import-row',
        'settings-help-row'
      ]);
      expect(screen.queryByTestId('settings-sync-row')).toBeNull();
      expect(screen.getByRole('header', { name: 'Not signed in yet' })).toBeTruthy();
    });

    it('reads App Version and Catalogue at full strength, by label and value', () => {
      guest();
      render(<SettingsScreen />);
      expect(screen.getByTestId('settings-app-version-row').props.accessibilityLabel).toBe(
        'App Version, 1.4.0'
      );
      expect(screen.getByTestId('settings-catalogue-row').props.accessibilityLabel).toBe(
        'Catalogue, v3 · Mar 2026'
      );
      expect(screen.queryByRole('button', { name: 'App Version, 1.4.0' })).toBeNull();
      // Neither is drawn dimmed: as disabled rows they drew at 0.6 until Story 22.7.
      ['settings-app-version-row', 'settings-catalogue-row'].forEach((row) => {
        expect(flat(row).opacity).toBeUndefined();
        expect(screen.getByTestId(row).props.accessibilityState?.disabled).toBeUndefined();
      });
    });

    it.each([
      ['settings-help-row', '/help'],
      ['settings-privacy-row', '/privacy-policy'],
      ['settings-what-we-collect-row', '/data-summary']
    ])('opens %s at %s', async (row, route) => {
      guest();
      render(<SettingsScreen />);
      await userEvent.press(screen.getByTestId(row));
      expect(mockPush).toHaveBeenCalledWith(route);
    });

    it('signs a guest in from the guest group', async () => {
      guest();
      render(<SettingsScreen />);
      await userEvent.press(screen.getByTestId('settings-sign-in-button'));
      expect(mockPush).toHaveBeenCalledWith('/sign-in');
    });

    // Disabled is the type-to-confirm gate's alone: no row on the screen is drawn disabled.
    it('draws no row disabled', async () => {
      signedIn();
      render(<SettingsScreen />);
      await waitFor(() => expect(screen.getByText('maria@gmail.com')).toBeTruthy());
      expect(screen.UNSAFE_getAllByType(ActionRow).filter(({ props }) => props.disabled)).toEqual(
        []
      );
    });

    // Design Notes: each row is a plain `ActionRow` with `showBottomBorder={false}`, its group's
    // `Surface` drawing the rules between rows. Named by testID, so a failure says which row.
    it.each<[string, () => void, string, number]>([
      ['signed in', signedIn, 'maria@gmail.com', 13],
      ['as a guest', guest, 'Not signed in yet', 9]
    ])(
      'draws every row plain, with no rule of its own, %s',
      async (_case, arrange, ready, count) => {
        arrange();
        render(<SettingsScreen />);
        await waitFor(() => expect(screen.getByText(ready)).toBeTruthy());
        const rows = screen.UNSAFE_getAllByType(ActionRow).map(({ props }) => props);
        expect(rows).toHaveLength(count);
        expect(
          rows.map(({ testID, variant, showBottomBorder }) => [testID, variant, showBottomBorder])
        ).toEqual(rows.map(({ testID }) => [testID, 'plain', false]));
      }
    );
  });

  // While the document picker prepares, the Import row shows the spinner — not the Sync row,
  // which a guest does not have.
  describe('the spinners', () => {
    it('spins the Import row while the picker prepares, and not the Sync row', async () => {
      signedIn();
      mockUseImportData.mockReturnValue(importData({ isPreparing: true }));
      render(<SettingsScreen />);
      await waitFor(() => expect(screen.getByText('maria@gmail.com')).toBeTruthy());

      expect(screen.getByTestId('settings-import-row-spinner')).toBeTruthy();
      expect(screen.queryByTestId('settings-sync-row-spinner')).toBeNull();
    });

    it('spins the Sync row only while it syncs', async () => {
      signedIn();
      mockUseSyncTrigger.mockReturnValue({
        isSyncing: true,
        syncLabel: 'just now',
        triggerSync: jest.fn()
      });
      render(<SettingsScreen />);
      await waitFor(() => expect(screen.getByText('maria@gmail.com')).toBeTruthy());

      expect(screen.getByTestId('settings-sync-row-spinner')).toBeTruthy();
      expect(screen.queryByTestId('settings-import-row-spinner')).toBeNull();
    });
  });

  /**
   * A failed request is one banner, the first thing in its sheet; the sheet stays open and no toast
   * repeats it. Reopening the sheet starts without it.
   */
  describe('a failed request', () => {
    it('keeps the sign-out sheet open on a failure, with its banner and no toast', async () => {
      signedIn();
      mockSignOut.mockResolvedValue({ success: false, error: { message: 'offline' } });
      render(<SettingsScreen />);

      await userEvent.press(screen.getByTestId('settings-signout-row'));
      await userEvent.press(screen.getByTestId('signout-confirm'));

      const banner = await screen.findByTestId('signout-error');
      expect(within(banner).getByText('Unable to sign out')).toBeTruthy();
      expect(screen.getByRole('header', { name: 'Sign Out?' })).toBeTruthy();
      expect(mockShowToast).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('reopens the sign-out sheet without the last failure', async () => {
      signedIn();
      mockSignOut.mockResolvedValue({ success: false, error: { message: 'offline' } });
      render(<SettingsScreen />);

      await userEvent.press(screen.getByTestId('settings-signout-row'));
      await userEvent.press(screen.getByTestId('signout-confirm'));
      await screen.findByTestId('signout-error');

      await userEvent.press(screen.getByTestId('signout-cancel'));
      await userEvent.press(screen.getByTestId('settings-signout-row'));
      expect(screen.queryByTestId('signout-error')).toBeNull();
    });

    // The next press clears it while it runs.
    it('clears the sign-out failure when the next press starts', async () => {
      signedIn();
      mockSignOut.mockResolvedValueOnce({ success: false, error: { message: 'offline' } });
      let resolveSecond: (value: unknown) => void = () => {};
      mockSignOut.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          })
      );
      render(<SettingsScreen />);

      await userEvent.press(screen.getByTestId('settings-signout-row'));
      await userEvent.press(screen.getByTestId('signout-confirm'));
      await screen.findByTestId('signout-error');

      await userEvent.press(screen.getByTestId('signout-confirm'));
      expect(screen.queryByTestId('signout-error')).toBeNull();
      expect(screen.getByTestId('signout-confirm-spinner')).toBeTruthy();

      await act(async () => {
        resolveSecond({ success: true, data: undefined });
      });
    });

    it('keeps the delete sheet open on a failure, with its banner and no toast', async () => {
      signedIn();
      mockDeleteAccount.mockResolvedValue({ success: false, error: { message: 'offline' } });
      render(<SettingsScreen />);

      await userEvent.press(screen.getByTestId('settings-delete-row'));
      await userEvent.press(screen.getByTestId('delete-continue-step1'));
      fireEvent.changeText(screen.getByTestId('delete-confirm-input'), 'DELETE');
      await userEvent.press(screen.getByTestId('delete-confirm-step2'));

      const banner = await screen.findByTestId('delete-error');
      expect(within(banner).getByText('Unable to delete account')).toBeTruthy();
      expect(screen.getByRole('header', { name: 'Confirm Account Deletion' })).toBeTruthy();
      expect(mockShowToast).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    // The next press clears it while it runs.
    it('clears the delete failure when the next press starts', async () => {
      signedIn();
      mockDeleteAccount.mockResolvedValueOnce({ success: false, error: { message: 'offline' } });
      let resolveSecond: (value: unknown) => void = () => {};
      mockDeleteAccount.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          })
      );
      render(<SettingsScreen />);

      await userEvent.press(screen.getByTestId('settings-delete-row'));
      await userEvent.press(screen.getByTestId('delete-continue-step1'));
      fireEvent.changeText(screen.getByTestId('delete-confirm-input'), 'DELETE');
      await userEvent.press(screen.getByTestId('delete-confirm-step2'));
      await screen.findByTestId('delete-error');

      await userEvent.press(screen.getByTestId('delete-confirm-step2'));
      expect(screen.queryByTestId('delete-error')).toBeNull();
      expect(screen.getByTestId('delete-confirm-step2-spinner')).toBeTruthy();

      await act(async () => {
        resolveSecond({ success: false, error: { message: 'offline' } });
      });
    });

    it('reopens the delete sheet at step 1, without the last failure', async () => {
      signedIn();
      mockDeleteAccount.mockResolvedValue({ success: false, error: { message: 'offline' } });
      render(<SettingsScreen />);

      await userEvent.press(screen.getByTestId('settings-delete-row'));
      await userEvent.press(screen.getByTestId('delete-continue-step1'));
      fireEvent.changeText(screen.getByTestId('delete-confirm-input'), 'DELETE');
      await userEvent.press(screen.getByTestId('delete-confirm-step2'));
      await screen.findByTestId('delete-error');

      await userEvent.press(screen.getByTestId('delete-cancel-step2'));
      await userEvent.press(screen.getByTestId('settings-delete-row'));
      expect(screen.getByRole('header', { name: 'Delete Account?' })).toBeTruthy();
      await userEvent.press(screen.getByTestId('delete-continue-step1'));
      expect(screen.queryByTestId('delete-error')).toBeNull();
    });

    // A failed export leaves its sheet open, its banner the one surface: no toast besides it.
    it('keeps the export sheet open on a failure, with no toast', async () => {
      guest();
      const data = exportData({ exportCards: jest.fn().mockResolvedValue(false) });
      mockUseExportData.mockReturnValue(data);
      render(<SettingsScreen />);

      await userEvent.press(screen.getByTestId('settings-export-row'));
      await userEvent.press(screen.getByTestId('export-confirm-button'));

      expect(data.exportCards).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('header', { name: 'Export Your Cards' })).toBeTruthy();
      expect(mockShowToast).not.toHaveBeenCalled();
    });

    it('shows the export hook’s failure as the export sheet’s banner', async () => {
      guest();
      mockUseExportData.mockReturnValue(exportData({ exportError: 'Export failed' }));
      render(<SettingsScreen />);

      await userEvent.press(screen.getByTestId('settings-export-row'));
      const banner = screen.getByTestId('export-error-text');
      expect(within(banner).getByText('Export failed')).toBeTruthy();
    });

    it('clears the export failure as its sheet opens', async () => {
      guest();
      const data = exportData();
      mockUseExportData.mockReturnValue(data);
      render(<SettingsScreen />);

      await userEvent.press(screen.getByTestId('settings-export-row'));
      expect(data.clearExportError).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('header', { name: 'Export Your Cards' })).toBeTruthy();
    });

    it('closes the export sheet once the export succeeds', async () => {
      guest();
      const data = exportData();
      mockUseExportData.mockReturnValue(data);
      render(<SettingsScreen />);

      await userEvent.press(screen.getByTestId('settings-export-row'));
      await userEvent.press(screen.getByTestId('export-confirm-button'));
      expect(data.exportCards).toHaveBeenCalledTimes(1);
      await waitFor(() =>
        expect(screen.queryByRole('header', { name: 'Export Your Cards' })).toBeNull()
      );
    });

    it('acknowledges an export with no cards, with nothing to clear', async () => {
      guest();
      const data = exportData({ cardCount: 0, hasCards: false });
      mockUseExportData.mockReturnValue(data);
      render(<SettingsScreen />);

      await userEvent.press(screen.getByTestId('settings-export-row'));
      expect(screen.getByRole('header', { name: 'Nothing to Export' })).toBeTruthy();
      expect(data.clearExportError).not.toHaveBeenCalled();
    });

    // A request that throws, rather than resolving a failure, lands on the same banner.
    it('keeps the sign-out sheet open with its banner when signing out throws', async () => {
      signedIn();
      mockSignOut.mockRejectedValue(new Error('offline'));
      render(<SettingsScreen />);

      await userEvent.press(screen.getByTestId('settings-signout-row'));
      await userEvent.press(screen.getByTestId('signout-confirm'));

      const banner = await screen.findByTestId('signout-error');
      expect(within(banner).getByText('Unable to sign out')).toBeTruthy();
      expect(screen.getByRole('header', { name: 'Sign Out?' })).toBeTruthy();
      expect(mockShowToast).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('keeps the delete sheet open with its banner when deleting throws', async () => {
      signedIn();
      mockDeleteAccount.mockRejectedValue(new Error('offline'));
      render(<SettingsScreen />);

      await userEvent.press(screen.getByTestId('settings-delete-row'));
      await userEvent.press(screen.getByTestId('delete-continue-step1'));
      fireEvent.changeText(screen.getByTestId('delete-confirm-input'), 'DELETE');
      await userEvent.press(screen.getByTestId('delete-confirm-step2'));

      const banner = await screen.findByTestId('delete-error');
      expect(within(banner).getByText('Unable to delete account')).toBeTruthy();
      expect(screen.getByRole('header', { name: 'Confirm Account Deletion' })).toBeTruthy();
      expect(mockShowToast).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe('a request that succeeds', () => {
    it('closes the sign-out sheet once signing out succeeds', async () => {
      signedIn();
      render(<SettingsScreen />);

      await userEvent.press(screen.getByTestId('settings-signout-row'));
      await userEvent.press(screen.getByTestId('signout-confirm'));

      await waitFor(() => expect(screen.queryByRole('header', { name: 'Sign Out?' })).toBeNull());
      expect(mockReplace).toHaveBeenCalledWith('/');
    });

    it('closes the delete sheet and says the account is deleted', async () => {
      signedIn();
      render(<SettingsScreen />);

      await userEvent.press(screen.getByTestId('settings-delete-row'));
      await userEvent.press(screen.getByTestId('delete-continue-step1'));
      fireEvent.changeText(screen.getByTestId('delete-confirm-input'), 'DELETE');
      await userEvent.press(screen.getByTestId('delete-confirm-step2'));

      await waitFor(() =>
        expect(screen.queryByRole('header', { name: 'Confirm Account Deletion' })).toBeNull()
      );
      expect(mockShowToast).toHaveBeenCalledWith({ title: 'Account deleted', preset: 'done' });
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  /**
   * The wiring: each handler and value the hooks hand the screen reaches the control that uses it.
   * With any of these props made a no-op, the suite above stayed green.
   */
  describe('the wiring', () => {
    const LANGUAGES = [
      { code: 'system', name: 'System' },
      { code: 'en', name: 'English' },
      { code: 'it', name: 'Italian' }
    ];

    const themeHook = (overrides: Record<string, unknown> = {}) => {
      const hook = {
        themePreference: 'system',
        themePreferenceLabel: 'System',
        isThemePickerOpen: false,
        openThemePicker: jest.fn(),
        closeThemePicker: jest.fn(),
        selectTheme: jest.fn(),
        ...overrides
      };
      mockUseThemePreference.mockReturnValue(hook);
      return hook;
    };

    const languageHook = (overrides: Record<string, unknown> = {}) => {
      const hook = {
        languageCode: 'en',
        languageName: 'English',
        supportedLanguages: LANGUAGES,
        isLanguagePickerOpen: false,
        openLanguagePicker: jest.fn(),
        closeLanguagePicker: jest.fn(),
        selectLanguage: jest.fn(),
        ...overrides
      };
      mockUseLanguagePreference.mockReturnValue(hook);
      return hook;
    };

    /** The scrim is hidden from assistive technology, so a tap on it reaches past that. */
    const scrim = (sheet: string) => screen.getByTestId(`${sheet}-scrim`, hidden);

    describe('the Theme picker', () => {
      it('opens from the Theme row', async () => {
        guest();
        const hook = themeHook();
        render(<SettingsScreen />);
        await userEvent.press(screen.getByTestId('settings-theme-row'));
        expect(hook.openThemePicker).toHaveBeenCalledTimes(1);
      });

      it('hands the option chosen to selectTheme', async () => {
        guest();
        const hook = themeHook({ isThemePickerOpen: true });
        render(<SettingsScreen />);
        await userEvent.press(screen.getByTestId('theme-option-dark'));
        expect(hook.selectTheme).toHaveBeenCalledWith('dark');
      });

      it('closes through closeThemePicker', async () => {
        guest();
        const hook = themeHook({ isThemePickerOpen: true });
        render(<SettingsScreen />);
        await userEvent.press(scrim('theme-picker-sheet'));
        expect(hook.closeThemePicker).toHaveBeenCalledTimes(1);
      });
    });

    describe('the Language picker', () => {
      it('opens from the Language row', async () => {
        guest();
        const hook = languageHook();
        render(<SettingsScreen />);
        await userEvent.press(screen.getByTestId('settings-language-row'));
        expect(hook.openLanguagePicker).toHaveBeenCalledTimes(1);
      });

      it('hands the language chosen to selectLanguage', async () => {
        guest();
        const hook = languageHook({ isLanguagePickerOpen: true });
        render(<SettingsScreen />);
        await userEvent.press(screen.getByTestId('language-option-it'));
        expect(hook.selectLanguage).toHaveBeenCalledWith('it');
      });

      it('closes through closeLanguagePicker', async () => {
        guest();
        const hook = languageHook({ isLanguagePickerOpen: true });
        render(<SettingsScreen />);
        await userEvent.press(scrim('language-picker-sheet'));
        expect(hook.closeLanguagePicker).toHaveBeenCalledTimes(1);
      });
    });

    it('closes the sign-out sheet on Cancel, signing nothing out', async () => {
      signedIn();
      render(<SettingsScreen />);
      await userEvent.press(screen.getByTestId('settings-signout-row'));
      expect(screen.getByRole('header', { name: 'Sign Out?' })).toBeTruthy();

      await userEvent.press(screen.getByTestId('signout-cancel'));
      await waitFor(() => expect(screen.queryByRole('header', { name: 'Sign Out?' })).toBeNull());
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it('closes the export sheet on Cancel, exporting nothing', async () => {
      guest();
      const data = exportData();
      mockUseExportData.mockReturnValue(data);
      render(<SettingsScreen />);
      await userEvent.press(screen.getByTestId('settings-export-row'));
      expect(screen.getByRole('header', { name: 'Export Your Cards' })).toBeTruthy();

      await userEvent.press(screen.getByTestId('export-cancel-button'));
      await waitFor(() =>
        expect(screen.queryByRole('header', { name: 'Export Your Cards' })).toBeNull()
      );
      expect(data.exportCards).not.toHaveBeenCalled();
    });

    it('closes nothing-to-export on OK', async () => {
      guest();
      mockUseExportData.mockReturnValue(exportData({ cardCount: 0, hasCards: false }));
      render(<SettingsScreen />);
      await userEvent.press(screen.getByTestId('settings-export-row'));
      expect(screen.getByRole('header', { name: 'Nothing to Export' })).toBeTruthy();

      await userEvent.press(screen.getByTestId('export-empty-close'));
      await waitFor(() =>
        expect(screen.queryByRole('header', { name: 'Nothing to Export' })).toBeNull()
      );
    });

    it('imports through confirmImport from the preview’s Import', async () => {
      guest();
      const data = importData({ preview: PREVIEW });
      mockUseImportData.mockReturnValue(data);
      render(<SettingsScreen />);
      await userEvent.press(screen.getByTestId('import-preview-confirm'));
      expect(data.confirmImport).toHaveBeenCalledTimes(1);
      expect(data.closePreview).not.toHaveBeenCalled();
    });

    it('closes the preview through closePreview from its Cancel', async () => {
      guest();
      const data = importData({ preview: PREVIEW });
      mockUseImportData.mockReturnValue(data);
      render(<SettingsScreen />);
      await userEvent.press(screen.getByTestId('import-preview-cancel'));
      expect(data.closePreview).toHaveBeenCalledTimes(1);
      expect(data.confirmImport).not.toHaveBeenCalled();
    });

    it('closes the import error through closeError from its OK', async () => {
      guest();
      const data = importData({ errorState: INVALID_FILE });
      mockUseImportData.mockReturnValue(data);
      render(<SettingsScreen />);
      await userEvent.press(screen.getByTestId('import-error-ok'));
      expect(data.closeError).toHaveBeenCalledTimes(1);
    });

    it('spins Export while the hook exports', async () => {
      guest();
      mockUseExportData.mockReturnValue(exportData({ isExporting: true }));
      render(<SettingsScreen />);
      await userEvent.press(screen.getByTestId('settings-export-row'));
      expect(screen.getByTestId('export-confirm-button-spinner')).toBeTruthy();
    });

    it('spins Import while the hook imports', () => {
      guest();
      mockUseImportData.mockReturnValue(importData({ preview: PREVIEW, isImporting: true }));
      render(<SettingsScreen />);
      expect(screen.getByTestId('import-preview-confirm-spinner')).toBeTruthy();
    });

    it('tells the export sheet how many cards the hook counts', async () => {
      guest();
      mockUseExportData.mockReturnValue(exportData({ cardCount: 7 }));
      render(<SettingsScreen />);
      await userEvent.press(screen.getByTestId('settings-export-row'));
      expect(
        screen.getByText('All 7 cards will be exported as a JSON file that you can save or share.')
      ).toBeTruthy();
    });

    // Values unlike the defaults, so a row fed anything else is caught.
    it('names the Theme, Language and Sync rows with the values the hooks give', async () => {
      signedIn();
      themeHook({ themePreference: 'dark', themePreferenceLabel: 'Dark' });
      languageHook({ languageCode: 'it', languageName: 'Italian' });
      mockUseSyncTrigger.mockReturnValue({
        isSyncing: false,
        syncLabel: '3 minutes ago',
        triggerSync: jest.fn()
      });
      render(<SettingsScreen />);
      await waitFor(() => expect(screen.getByText('maria@gmail.com')).toBeTruthy());

      expect(screen.getByTestId('settings-theme-row').props.accessibilityLabel).toBe('Theme, Dark');
      expect(screen.getByTestId('settings-language-row').props.accessibilityLabel).toBe(
        'Language, Italian'
      );
      expect(screen.getByTestId('settings-sync-row').props.accessibilityLabel).toBe(
        'Sync, 3 minutes ago'
      );
    });

    it('syncs through triggerSync from the Sync row', async () => {
      signedIn();
      const triggerSync = jest.fn();
      mockUseSyncTrigger.mockReturnValue({ isSyncing: false, syncLabel: 'just now', triggerSync });
      render(<SettingsScreen />);
      await waitFor(() => expect(screen.getByText('maria@gmail.com')).toBeTruthy());

      await userEvent.press(screen.getByTestId('settings-sync-row'));
      expect(triggerSync).toHaveBeenCalledTimes(1);
    });

    it('sets full brightness through setAutoBrightness from its switch', async () => {
      guest();
      const setAutoBrightness = jest.fn();
      mockUseAutoBrightnessPreference.mockReturnValue({
        isAutoBrightnessEnabled: false,
        setAutoBrightness
      });
      render(<SettingsScreen />);

      await userEvent.press(screen.getByTestId('settings-auto-brightness-toggle'));
      expect(setAutoBrightness).toHaveBeenCalledWith(true);
    });

    // The current choices, with values unlike the defaults, so a constant in their place fails.
    it('checks the Theme picker’s current choice', () => {
      guest();
      themeHook({ isThemePickerOpen: true, themePreference: 'dark', themePreferenceLabel: 'Dark' });
      render(<SettingsScreen />);
      expect(screen.getByTestId('theme-option-dark').props.accessibilityState).toEqual({
        selected: true
      });
      expect(screen.getByTestId('theme-option-system').props.accessibilityState).toEqual({
        selected: false
      });
    });

    it('checks the Language picker’s current choice', () => {
      guest();
      languageHook({ isLanguagePickerOpen: true, languageCode: 'it', languageName: 'Italian' });
      render(<SettingsScreen />);
      expect(screen.getByTestId('language-option-it').props.accessibilityState).toEqual({
        selected: true
      });
      expect(screen.getByTestId('language-option-en').props.accessibilityState).toEqual({
        selected: false
      });
    });

    it('sets the brightness switch to the hook’s value', () => {
      guest();
      mockUseAutoBrightnessPreference.mockReturnValue({
        isAutoBrightnessEnabled: true,
        setAutoBrightness: jest.fn()
      });
      render(<SettingsScreen />);
      expect(
        screen.getByTestId('settings-auto-brightness-toggle').props.accessibilityState
      ).toMatchObject({ checked: true });
    });

    // Counts unlike each other and the defaults, so a constant or a swapped prop fails.
    it('shows the preview’s own counts', () => {
      guest();
      mockUseImportData.mockReturnValue(
        importData({
          preview: {
            ...PREVIEW,
            totalCards: 12,
            newCardsCount: 6,
            duplicateCount: 4,
            invalidCount: 2
          }
        })
      );
      render(<SettingsScreen />);
      const summary = screen.getByTestId('import-preview-summary');
      expect(within(summary).getByText('12 cards found')).toBeTruthy();
      expect(within(summary).getByText('6 new cards will be added.')).toBeTruthy();
      expect(within(summary).getByText('4 duplicates will be skipped.')).toBeTruthy();
      expect(within(summary).getByText('2 invalid entries will be skipped.')).toBeTruthy();
    });

    // The import hook is mocked, so what the screen hands it is read back from the mock's call.
    it.each<[string, () => void, boolean]>([
      ['signed in', signedIn, true],
      ['as a guest', guest, false]
    ])(
      'hands the import hook the account state, its sync and a refresh, %s',
      async (_case, arrange, isAuthenticated) => {
        arrange();
        const triggerSync = jest.fn();
        mockUseSyncTrigger.mockReturnValue({
          isSyncing: false,
          syncLabel: 'just now',
          triggerSync
        });
        const data = exportData();
        mockUseExportData.mockReturnValue(data);
        render(<SettingsScreen />);
        await waitFor(() => expect(screen.getByTestId('settings-catalogue-row')).toBeTruthy());

        const options = mockUseImportData.mock.calls.at(-1)?.[0];
        expect(options.isAuthenticated).toBe(isAuthenticated);
        expect(options.onSyncRequested).toBe(triggerSync);
        await act(async () => {
          await options.onImportSuccess();
        });
        expect(data.refreshCardCount).toHaveBeenCalledTimes(1);
      }
    );
  });

  // The type-to-confirm gate is the one control in settings drawn disabled.
  it('draws the delete gate as the only disabled control', async () => {
    signedIn();
    render(<SettingsScreen />);

    await userEvent.press(screen.getByTestId('settings-delete-row'));
    expect(
      screen.UNSAFE_getAllByType(Button).filter(({ props }) => props.disabled === true)
    ).toHaveLength(0);

    await userEvent.press(screen.getByTestId('delete-continue-step1'));
    expect(
      screen
        .UNSAFE_getAllByType(Button)
        .filter(({ props }) => props.disabled === true)
        .map(({ props }) => props.testID)
    ).toEqual(['delete-confirm-step2']);
  });

  /**
   * A sheet keeps its content while it slides out: the hook empties `preview` and `errorState` in
   * the render that closes their sheets, and each sheet goes on drawing the last one it showed.
   */
  describe('closing', () => {
    const holdSlideOut = () =>
      jest.spyOn(reanimated, 'withTiming').mockImplementation((value) => value);

    // A failed request's banner stays drawn while its sheet slides out: closing clears nothing.
    it('keeps the sign-out failure drawn while its sheet slides out', async () => {
      signedIn();
      mockSignOut.mockResolvedValue({ success: false, error: { message: 'offline' } });
      render(<SettingsScreen />);
      await userEvent.press(screen.getByTestId('settings-signout-row'));
      await userEvent.press(screen.getByTestId('signout-confirm'));
      await screen.findByTestId('signout-error');

      holdSlideOut();
      await userEvent.press(screen.getByTestId('signout-cancel'));
      expect(screen.queryByRole('header', { name: 'Sign Out?' })).toBeNull();
      expect(screen.getByTestId('signout-error', hidden)).toBeTruthy();
    });

    it('keeps the delete failure drawn while its sheet slides out', async () => {
      signedIn();
      mockDeleteAccount.mockResolvedValue({ success: false, error: { message: 'offline' } });
      render(<SettingsScreen />);
      await userEvent.press(screen.getByTestId('settings-delete-row'));
      await userEvent.press(screen.getByTestId('delete-continue-step1'));
      fireEvent.changeText(screen.getByTestId('delete-confirm-input'), 'DELETE');
      await userEvent.press(screen.getByTestId('delete-confirm-step2'));
      await screen.findByTestId('delete-error');

      holdSlideOut();
      await userEvent.press(screen.getByTestId('delete-cancel-step2'));
      expect(screen.queryByRole('header', { name: 'Confirm Account Deletion' })).toBeNull();
      expect(screen.getByTestId('delete-error', hidden)).toBeTruthy();
    });

    it('keeps the export failure drawn while its sheet slides out', async () => {
      guest();
      const data = exportData({ exportError: 'Export failed' });
      mockUseExportData.mockReturnValue(data);
      render(<SettingsScreen />);
      await userEvent.press(screen.getByTestId('settings-export-row'));
      expect(data.clearExportError).toHaveBeenCalledTimes(1);

      holdSlideOut();
      await userEvent.press(screen.getByTestId('export-cancel-button'));
      expect(screen.queryByRole('header', { name: 'Export Your Cards' })).toBeNull();
      // Cleared as it opened, and not again as it closes.
      expect(data.clearExportError).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('export-error-text', hidden)).toBeTruthy();
    });

    it('keeps the preview’s file and counts while its sheet slides out', () => {
      holdSlideOut();
      guest();
      mockUseImportData.mockReturnValue(importData({ preview: PREVIEW }));
      const { rerender } = render(<SettingsScreen />);
      expect(screen.getByText('my-cards-backup.json')).toBeTruthy();

      mockUseImportData.mockReturnValue(importData({ preview: null }));
      rerender(<SettingsScreen />);
      expect(screen.getByText('my-cards-backup.json', hidden)).toBeTruthy();
      expect(screen.getByText('8 cards found', hidden)).toBeTruthy();
      expect(screen.getByText('5 new cards will be added.', hidden)).toBeTruthy();
      expect(screen.getByText('3 duplicates will be skipped.', hidden)).toBeTruthy();
      expect(screen.getByText('1 invalid entry will be skipped.', hidden)).toBeTruthy();
      expect(screen.queryByText('0 new cards will be added.', hidden)).toBeNull();
    });

    it('keeps the import error’s title and message while its sheet slides out', () => {
      holdSlideOut();
      guest();
      mockUseImportData.mockReturnValue(
        importData({
          errorState: {
            title: 'No Card Data',
            message: 'This file contains no card data.',
            variant: 'empty'
          }
        })
      );
      const { rerender } = render(<SettingsScreen />);
      expect(screen.getByText('No Card Data')).toBeTruthy();

      mockUseImportData.mockReturnValue(importData({ errorState: null }));
      rerender(<SettingsScreen />);
      expect(screen.getByText('No Card Data', hidden)).toBeTruthy();
      expect(screen.getByText('This file contains no card data.', hidden)).toBeTruthy();
      expect(screen.queryByText('Invalid File', hidden)).toBeNull();
    });

    it('shows the next preview, not the last one, when another file is picked', () => {
      guest();
      mockUseImportData.mockReturnValue(importData({ preview: PREVIEW }));
      const { rerender } = render(<SettingsScreen />);

      mockUseImportData.mockReturnValue(
        importData({ preview: { ...PREVIEW, fileName: 'second.json', newCardsCount: 2 } })
      );
      rerender(<SettingsScreen />);
      expect(screen.getByText('second.json')).toBeTruthy();
      expect(screen.queryByText('my-cards-backup.json')).toBeNull();
    });

    // In use the content comes after the screen mounts, once a file is picked: each sheet must take
    // what arrives, or it opens with an empty title, message or file name.
    it('opens the import error with the error that arrives after it mounts', () => {
      guest();
      mockUseImportData.mockReturnValue(importData({ errorState: null }));
      const { rerender } = render(<SettingsScreen />);
      expect(screen.queryByRole('header', { name: 'Invalid File' })).toBeNull();

      mockUseImportData.mockReturnValue(importData({ errorState: INVALID_FILE }));
      rerender(<SettingsScreen />);
      expect(screen.getByRole('header', { name: 'Invalid File' })).toBeTruthy();
      expect(screen.getByText(INVALID_FILE.message)).toBeTruthy();
    });

    it('opens the preview with the file that arrives after it mounts', () => {
      guest();
      mockUseImportData.mockReturnValue(importData({ preview: null }));
      const { rerender } = render(<SettingsScreen />);
      expect(screen.queryByRole('header', { name: 'Import Cards' })).toBeNull();

      mockUseImportData.mockReturnValue(importData({ preview: PREVIEW }));
      rerender(<SettingsScreen />);
      expect(screen.getByRole('header', { name: 'Import Cards' })).toBeTruthy();
      expect(screen.getByText('my-cards-backup.json')).toBeTruthy();
    });

    // The kept content is read past the hiding above, which a sheet that never closed would pass
    // too. With the default instant slide each sheet goes once the hook clears its state.
    it('closes the preview once the hook clears it', async () => {
      guest();
      mockUseImportData.mockReturnValue(importData({ preview: PREVIEW }));
      const { rerender } = render(<SettingsScreen />);
      expect(screen.getByRole('header', { name: 'Import Cards' })).toBeTruthy();

      mockUseImportData.mockReturnValue(importData({ preview: null }));
      rerender(<SettingsScreen />);
      await waitFor(() =>
        expect(screen.queryByRole('header', { name: 'Import Cards' })).toBeNull()
      );
    });

    it('closes the import error once the hook clears it', async () => {
      guest();
      mockUseImportData.mockReturnValue(importData({ errorState: INVALID_FILE }));
      const { rerender } = render(<SettingsScreen />);
      expect(screen.getByRole('header', { name: 'Invalid File' })).toBeTruthy();

      mockUseImportData.mockReturnValue(importData({ errorState: null }));
      rerender(<SettingsScreen />);
      await waitFor(() =>
        expect(screen.queryByRole('header', { name: 'Invalid File' })).toBeNull()
      );
    });

    // Its title is not a constant but the hook's error, held in render-phase state: the sheet
    // must open with it, so it is announced by it.
    it('announces the import error by its title as it arrives', () => {
      const announce = jest
        .spyOn(AccessibilityInfo, 'announceForAccessibility')
        .mockImplementation(() => undefined);
      guest();
      mockUseImportData.mockReturnValue(importData({ errorState: null }));
      const { rerender } = render(<SettingsScreen />);
      announce.mockClear();

      mockUseImportData.mockReturnValue(importData({ errorState: INVALID_FILE }));
      rerender(<SettingsScreen />);
      expect(announce).toHaveBeenCalledWith('Invalid File opened');
    });
  });
});

/** The frames' acceptance criterion: settings has moved off MaterialIcons, all of it. */
describe('features/settings', () => {
  const settingsRoot = join(__dirname, '..');

  const sourceFiles = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) return sourceFiles(path);
      return /\.(ts|tsx)$/.test(entry) ? [path] : [];
    });

  it('imports nothing from @expo/vector-icons', () => {
    const offenders = sourceFiles(settingsRoot)
      .filter((path) => /['"]@expo\/vector-icons/.test(readFileSync(path, 'utf8')))
      .map((path) => relative(settingsRoot, path));
    expect(offenders).toEqual([]);
    expect(sourceFiles(settingsRoot).length).toBeGreaterThan(20);
  });
});

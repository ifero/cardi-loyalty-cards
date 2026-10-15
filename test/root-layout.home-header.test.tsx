/**
 * Home's header — Story 22.2, the wallet frames.
 *
 * Home is the one route whose header the wallet frame redraws: the ground colour with no divider,
 * the title centred in `headline-md`, and the `+` and gear buttons. Every other route keeps the
 * shared `screenOptions` until its own story. `Stack.Screen` records the options it is given by
 * route name, so the header is read here exactly as the layout configures it.
 *
 * The theme mock gives `background` and `surface` DIFFERENT values, so a header that fell back to
 * the shared surface fill could not pass for the ground.
 */
import { act, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { changeAppLanguage } from '@/shared/i18n';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import RootLayout from '@/app/_layout';

import { HomeAddButton, HomeSettingsButton } from '@/features/cards/components/HomeHeaderButtons';

const BACKGROUND = '#F0F0E8';
const SURFACE = '#FFFFFF';

type HeaderOptions = {
  title?: string;
  headerShown?: boolean;
  headerStyle?: { backgroundColor?: string };
  headerShadowVisible?: boolean;
  headerTitleAlign?: string;
  headerTitleStyle?: Record<string, unknown>;
  headerLeft?: (props: { canGoBack?: boolean }) => React.ReactElement | undefined;
  headerRight?: () => React.ReactElement | undefined;
};

const mockScreenOptions = new Map<string, HeaderOptions>();
let mockSharedOptions: HeaderOptions | undefined;
const mockOnAuthStateChange = jest.fn();

jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

jest.mock('expo-updates', () => ({
  isEnabled: false,
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn()
}));

jest.mock('expo-router', () => {
  const Stack = ({
    children,
    screenOptions
  }: {
    children: React.ReactNode;
    screenOptions?: HeaderOptions;
  }) => {
    mockSharedOptions = screenOptions;
    return <>{children}</>;
  };
  (Stack as { Screen?: (props: { name: string; options?: HeaderOptions }) => null }).Screen = ({
    name,
    options
  }) => {
    mockScreenOptions.set(name, options ?? {});
    return null;
  };
  return { Stack, useRouter: () => ({ replace: jest.fn(), back: jest.fn(), push: jest.fn() }) };
});

jest.mock('@/core/database', () => ({
  initializeDatabase: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('@/core/database/card-repository', () => ({
  getAllCards: jest.fn().mockResolvedValue([])
}));

jest.mock('@/core/watch-connectivity', () => ({
  pushCardsToWatch: jest.fn().mockResolvedValue(undefined),
  subscribeToWatchMessages: jest.fn(() => jest.fn()),
  subscribeToWatchUserInfo: jest.fn(() => jest.fn())
}));

jest.mock('@/core/auth/guest-session-repository', () => ({
  getOrCreateGuestSessionId: jest.fn().mockResolvedValue('guest-1')
}));

jest.mock('@/features/settings', () => ({
  isFirstLaunch: () => false,
  completeFirstLaunch: jest.fn()
}));

jest.mock('@/shared/supabase/client', () => ({
  getSupabaseClient: jest.fn(() => ({
    auth: {
      onAuthStateChange: (callback: (event: string, session: unknown) => void) =>
        mockOnAuthStateChange(callback)
    }
  })),
  hasPersistedSession: () => Promise.resolve(false)
}));

jest.mock('@/shared/theme', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({
    isDark: false,
    theme: {
      primary: '#181824',
      textPrimary: '#181824',
      background: '#F0F0E8',
      surface: '#FFFFFF'
    }
  })
}));

/** Boots the layout signed out, past the welcome gate, and returns Home's header options. */
const renderHome = async (): Promise<HeaderOptions> => {
  mockOnAuthStateChange.mockImplementation(
    (callback: (event: string, session: unknown) => void) => {
      callback('INITIAL_SESSION', null);
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    }
  );
  render(<RootLayout />);
  await waitFor(() => expect(mockScreenOptions.has('index')).toBe(true));
  return mockScreenOptions.get('index')!;
};

describe('RootLayout — Home header (Story 22.2)', () => {
  beforeEach(async () => {
    mockScreenOptions.clear();
    mockSharedOptions = undefined;
    await act(async () => {
      await changeAppLanguage('en');
    });
  });

  it('sits on the ground colour, not the shared surface fill', async () => {
    const home = await renderHome();
    expect(home.headerStyle?.backgroundColor).toBe(BACKGROUND);
    expect(home.headerStyle?.backgroundColor).not.toBe(SURFACE);
  });

  it('draws no divider under the header', async () => {
    const home = await renderHome();
    expect(home.headerShadowVisible).toBe(false);
  });

  it('centres the title "Cardì" in headline-md’s family, size and weight', async () => {
    const home = await renderHome();
    expect(home.title).toBe('Cardì');
    expect(home.headerTitleAlign).toBe('center');
    // Exactly these three: no colour, so the title keeps the shared tint, and no letter spacing,
    // which a native title does not take.
    expect(home.headerTitleStyle).toEqual({
      fontFamily: TYPOGRAPHY.headlineMd.fontFamily,
      fontSize: TYPOGRAPHY.headlineMd.fontSize,
      fontWeight: TYPOGRAPHY.headlineMd.fontWeight
    });
  });

  it('puts + on the left and the gear on the right', async () => {
    const home = await renderHome();
    expect(home.headerLeft?.({ canGoBack: false })?.type).toBe(HomeAddButton);
    expect(home.headerRight?.()?.type).toBe(HomeSettingsButton);
  });

  // Every other route keeps the shared header until its own story restyles it.
  it('leaves the shared screen options on the surface fill', async () => {
    await renderHome();
    expect(mockSharedOptions?.headerStyle?.backgroundColor).toBe(SURFACE);
    expect(mockSharedOptions?.headerShadowVisible).toBeUndefined();
    expect(mockScreenOptions.get('settings')?.headerStyle).toBeUndefined();
  });
});

/**
 * Card edit's header — Story 22.6, the form pattern. The form draws its own header, so the route
 * hides the native one: set on the route rather than by the screen, so none flashes in the push.
 */
describe('RootLayout — card edit (Story 22.6)', () => {
  beforeEach(async () => {
    mockScreenOptions.clear();
    await act(async () => {
      await changeAppLanguage('en');
    });
  });

  it('hides the native header on card/[id]/edit', async () => {
    await renderHome();
    expect(mockScreenOptions.get('card/[id]/edit')?.headerShown).toBe(false);
  });

  // Only that route: card detail keeps the shared header the root stack draws.
  it('leaves the other card routes’ headers as they were', async () => {
    await renderHome();
    expect(mockScreenOptions.get('card/[id]')?.headerShown).toBeUndefined();
  });
});

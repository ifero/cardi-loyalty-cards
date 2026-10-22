import 'react-native-get-random-values'; // Must be imported before uuid
import '@/shared/theme/unistyles'; // Registers Unistyles themes (StyleSheet.configure)
import '@/shared/i18n';
import { MaterialIcons } from '@expo/vector-icons';
import * as Sentry from '@sentry/react-native';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { getOrCreateGuestSessionId } from '@/core/auth/guest-session-repository';
import { initializeDatabase } from '@/core/database';
import { applyWatchUsageEvents, getAllCards } from '@/core/database/card-repository';
import { initSentry } from '@/core/observability/sentry';
import { logger } from '@/core/utils/logger';
import { withTimeout } from '@/core/utils/with-timeout';
import { parseWatchUsageEvent } from '@/core/watch-connectivity';
import {
  createWearableInboundHandlers,
  pushCardsToWearable,
  subscribeToWearableInbound
} from '@/core/wearable-sync';

import { AppLaunchScreen } from '@/shared/components/launch/AppLaunchScreen';
import { EXIT_FADE_MS, SPLASH_HIDE_FALLBACK_MS } from '@/shared/components/launch/constants';
import { getSupabaseClient } from '@/shared/supabase/client';
import { useBootAuthGate } from '@/shared/supabase/useBootAuthGate';
import { ThemeProvider, useTheme } from '@/shared/theme';
import { NAVIGATION_TITLE_FONT, TYPOGRAPHY } from '@/shared/theme/typography';

import { HomeAddButton, HomeSettingsButton } from '@/features/cards/components/HomeHeaderButtons';
import { completeFirstLaunch, isFirstLaunch } from '@/features/settings';

export const unstable_settings = {
  initialRouteName: 'index'
};

// Hold the native splash until the JS launch surface has painted, so the two
// never overlap-cut (Story 16.17, AD-16-17-01). Both calls live at MODULE scope
// because Expo's docs are explicit that `preventAutoHideAsync` inside a component
// or hook can run too late — after the splash has already auto-hidden.
//
// Both are `.catch()`-ed for the same reason `logger.notify` is guarded in Story
// 16.14: adding a launch surface must not be able to introduce a NEW boot
// failure. `preventAutoHideAsync` and `hideAsync` both return rejectable
// promises, and an unhandled rejection here would be a permanent white/black
// screen — strictly worse than the flash this story deletes, and a regression of
// the "boot never hangs" guarantee from Stories 16.10/16.12.
SplashScreen.preventAutoHideAsync().catch(() => {});
// `duration` is cross-platform; `fade` is documented iOS-ONLY, which is why
// pixel-identity between the native PNG and the JS mark (not this fade) is what
// conceals the handoff on Android. Duration matches the JS→content cross-fade so
// both halves of the launch share one feel.
SplashScreen.setOptions({ duration: EXIT_FADE_MS, fade: true });

// Initialise Sentry as early as possible so errors during module evaluation and
// app startup are captured (no-op transmit in development; see initSentry).
initSentry();

// Eagerly validate Supabase env vars so misconfigurations surface early.
// Wrapped in try/catch to prevent a fatal crash when env vars are absent
// (e.g. CI build missing EXPO_PUBLIC_SUPABASE_* secrets).
try {
  getSupabaseClient();
} catch (error) {
  logger.error(
    'Supabase client initialisation failed — check EXPO_PUBLIC_SUPABASE_* env vars:',
    error
  );
}

/**
 * The Home title in `headline-md`'s face, size and weight (Story 22.2, frame A). No colour key, so
 * it keeps the shared `headerTintColor`; no letter spacing, which a native title does not take.
 */
const HOME_TITLE_FONT = {
  fontFamily: TYPOGRAPHY.headlineMd.fontFamily,
  fontSize: TYPOGRAPHY.headlineMd.fontSize,
  fontWeight: TYPOGRAPHY.headlineMd.fontWeight
} as const;

const RootLayoutContent = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const { isDark, theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  // Onboarding/welcome gate.
  //
  // The welcome screen must only appear for genuinely new, signed-out users.
  // A signed-in user must NEVER be bounced here — including one whose session
  // was silently restored from the Keychain after a reinstall (the first-launch
  // flag lives in expo-sqlite/kv-store, which a reinstall wipes, while the
  // Supabase session survives in SecureStore). For those users we also clear
  // the flag so later cold starts skip the gate too.
  //
  // Regression guard (testers stuck in a welcome loop): the routed-onboarding
  // refactor only cleared `first_launch` on the local-mode highlights path, so
  // account-creation / sign-in users never cleared it and got redirected here
  // on every launch. Gating on auth state fixes every path at once instead of
  // relying on each completion screen to remember to call completeFirstLaunch.
  useEffect(() => {
    if (isAuthenticated) {
      if (isFirstLaunch()) {
        completeFirstLaunch();
      }
      return;
    }

    if (isFirstLaunch()) {
      router.replace('/welcome');
    }
  }, [router, isAuthenticated]);

  return (
    <>
      {/* Offline indicator is now rendered by SyncStatusContainer in index.tsx */}
      <Stack
        screenOptions={{
          headerLeft: ({ canGoBack }: { canGoBack?: boolean }) =>
            canGoBack ? (
              <Pressable
                onPress={() => router.back()}
                accessibilityLabel={t('addCard.selection.backAccessibilityLabel')}
                accessibilityRole="button"
                style={styles.headerButton}
              >
                <MaterialIcons name="chevron-left" size={28} color={theme.textPrimary} />
              </Pressable>
            ) : undefined,
          headerStyle: {
            backgroundColor: theme.surface
          },
          headerTintColor: theme.textPrimary,
          // Face only — no colour key, so the title keeps `headerTintColor`, and no size, so
          // each platform keeps its native header title size (Story 21.6).
          headerTitleStyle: NAVIGATION_TITLE_FONT,
          contentStyle: {
            backgroundColor: theme.background
          },
          animation: 'slide_from_right',
          headerBackTitle: ''
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: t('navigation.home'),
            // The wallet frame's header, on Home only: the ground colour with no divider, the
            // title centred (Android needs telling; iOS always centres it). The buttons keep the
            // platform's own treatment — on iOS 26 the system draws its glass around them.
            headerStyle: { backgroundColor: theme.background },
            headerShadowVisible: false,
            headerTitleAlign: 'center',
            headerTitleStyle: HOME_TITLE_FONT,
            headerLeft: () => <HomeAddButton />,
            headerRight: () => <HomeSettingsButton />
          }}
        />
        <Stack.Screen
          name="welcome"
          options={{
            title: t('navigation.welcome'),
            headerShown: false,
            animation: 'fade'
          }}
        />
        <Stack.Screen
          name="onboarding/mode-selection"
          options={{
            title: t('navigation.getStarted'),
            headerShown: false
          }}
        />
        <Stack.Screen
          name="onboarding/highlights"
          options={{
            title: t('navigation.highlights'),
            headerShown: false
          }}
        />
        <Stack.Screen
          name="add-card"
          options={{
            title: t('navigation.addCard'),
            headerShown: false
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: t('navigation.settings'),
            // Settings draws its own header, `ScreenHeader` (Story 22.7). Hidden here rather than
            // by the screen, so no native header flashes in the push.
            headerShown: false
          }}
        />
        <Stack.Screen
          name="scan"
          options={{
            title: t('navigation.scanBarcode'),
            presentation: 'fullScreenModal',
            headerShown: false
          }}
        />
        <Stack.Screen
          name="barcode/[id]"
          options={{
            title: t('navigation.barcode'),
            presentation: 'fullScreenModal',
            headerShown: false,
            animation: 'fade'
          }}
        />
        <Stack.Screen
          name="card/[id]"
          options={{
            title: t('navigation.cardDetails')
          }}
        />
        <Stack.Screen
          name="card/[id]/edit"
          options={{
            title: t('navigation.editCard'),
            // The form pattern draws its own header (Story 22.6), whose back runs the discard
            // check. Hidden here rather than by the screen, so no native header flashes in the push.
            headerShown: false
          }}
        />
        {/* The auth screens draw the form pattern's own header, its back alone (Story 22.9). Hidden
            here rather than by the screens, so no native header flashes in the push. */}
        <Stack.Screen
          name="create-account"
          options={{
            title: t('navigation.createAccount'),
            headerShown: false
          }}
        />
        <Stack.Screen
          name="verify-email"
          options={{
            title: t('navigation.verifyEmail'),
            headerShown: false
          }}
        />
        <Stack.Screen
          name="sign-in"
          options={{
            title: t('navigation.signIn'),
            headerShown: false
          }}
        />
        <Stack.Screen
          name="forgot-password"
          options={{
            title: t('navigation.forgotPassword'),
            headerShown: false
          }}
        />
        <Stack.Screen
          name="recovery-otp"
          options={{
            title: t('navigation.recoveryOtp'),
            headerShown: false
          }}
        />
        <Stack.Screen
          name="new-password"
          options={{
            title: t('navigation.newPassword'),
            headerShown: false
          }}
        />
        {/* The document screens draw their own header, `DocumentScreen`'s (Story 22.8). Hidden
            here rather than by the screens, so no native header flashes in the push. */}
        <Stack.Screen
          name="help"
          options={{
            title: t('help.title'),
            headerShown: false
          }}
        />
        <Stack.Screen
          name="privacy-policy"
          options={{
            title: t('privacy.title'),
            headerShown: false
          }}
        />
        <Stack.Screen
          name="data-summary"
          options={{
            title: t('navigation.whatWeCollect'),
            headerShown: false
          }}
        />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
};

/**
 * Max time to wait for the Expo update manifest check before proceeding with
 * boot. `checkForUpdateAsync()` has no built-in JS timeout, so on a flaky
 * (connected-but-no-internet) network it can otherwise stall the loading
 * screen. Boot must never hang (Story 16.10, AC1).
 */
const UPDATE_CHECK_TIMEOUT_MS = 5000;

/**
 * Max time to wait for the Expo update bundle download before proceeding with
 * boot. Like the manifest check, `fetchUpdateAsync()` has no built-in JS
 * timeout, so a connection that serves the manifest then stalls mid-download
 * would otherwise hang the loading screen indefinitely. The budget is far more
 * generous than the manifest check because a bundle is much larger than a
 * manifest; `withTimeout` never aborts the native download, so a slow download
 * that exceeds the budget is not lost — it simply applies on a later cold start
 * (Story 16.12, AC1).
 */
const UPDATE_FETCH_TIMEOUT_MS = 30000;

/**
 * The exact rejection messages handed to `withTimeout` for each OTA step.
 *
 * They are named constants rather than inline literals because they do double
 * duty as the failure classifier below. `withTimeout` rejects with
 * `new Error(timeoutMessage)` verbatim (pinned by `with-timeout.test.ts`) and
 * exposes no distinguishable error type, so comparing against the exact literal
 * THIS file supplied is what separates "we gave up at our own budget" from
 * "expo-updates or the network failed outright".
 */
const UPDATE_CHECK_TIMEOUT_MESSAGE = 'Expo update check timed out';
const UPDATE_FETCH_TIMEOUT_MESSAGE = 'Expo update download timed out';

/**
 * Classify an OTA failure for the `otaFailureKind` Sentry tag (Story 16.14).
 *
 * Only a `'timeout'` speaks to whether the budgets above are calibrated — an
 * `'error'` is the network or the native module failing regardless of how long
 * we were willing to wait. The message is a fixed grouping key, so this tag is
 * the only thing that makes the two distinguishable in Sentry's UI: tags are
 * indexed and chartable, `extra.context` is not.
 */
const classifyOtaFailure = (error: unknown, timeoutMessage: string): 'timeout' | 'error' =>
  error instanceof Error && error.message === timeoutMessage ? 'timeout' : 'error';

const RootLayout = () => {
  const { t } = useTranslation();
  // Infra readiness (local, offline-safe): DB init + guest-session bootstrap.
  const [isInitialized, setIsInitialized] = useState(false);
  // Holds a translation KEY, not a translated string: translating here would make
  // the boot effect below close over `t`, whose identity changes on every language
  // change. That would force `t` into the effect's dep array and re-run database
  // initialisation and the watch subscription on each language switch. Translating
  // at render instead keeps the dep array honestly empty AND keeps the message in
  // the current language rather than the one active at mount. (Story 16.24)
  const [dbErrorKey, setDbErrorKey] = useState<string | null>(null);
  // Auth readiness resolved offline-safe by useBootAuthGate (a SecureStore
  // session probe + reactive onAuthStateChange + safety timeout) — replaces the
  // blocking getSession() that hung offline on an expired-token refresh.
  const { isReady: isAuthReady, isAuthenticated } = useBootAuthGate();
  const reducedMotion = useReducedMotion();
  const splashHiddenRef = useRef(false);
  const splashFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Hand the launch over from the native splash to the JS surface.
   *
   * Called on the launch surface's first paint (`onLayout`) — deliberately NOT
   * when `isReady` flips. The native layer cannot animate, so holding it to
   * readiness would leave nowhere to show the liveness signal the slow path
   * needs; hiding early moves the wait onto a surface we control, and because
   * that surface is pixel-identical the transfer is invisible.
   *
   * Idempotent, so the fallback timer below and `onLayout` can both fire without
   * hiding twice.
   */
  const hideSplashScreen = useCallback(() => {
    if (splashHiddenRef.current) {
      return;
    }
    splashHiddenRef.current = true;
    if (splashFallbackTimerRef.current) {
      clearTimeout(splashFallbackTimerRef.current);
      splashFallbackTimerRef.current = null;
    }
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Belt and braces (AD-16-17-01): `onLayout` never fires for a zero-size
  // layout, which would leave the native splash up forever. This deadline hides
  // it regardless, so no rendering accident can turn a launch polish story into
  // a boot hang.
  useEffect(() => {
    splashFallbackTimerRef.current = setTimeout(hideSplashScreen, SPLASH_HIDE_FALLBACK_MS);
    return () => {
      if (splashFallbackTimerRef.current) {
        clearTimeout(splashFallbackTimerRef.current);
        splashFallbackTimerRef.current = null;
      }
    };
  }, [hideSplashScreen]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check for updates first (if enabled) so any reload happens during the
        // loading screen. Neither checkForUpdateAsync (manifest) nor
        // fetchUpdateAsync (bundle download) has a reliable JS-level timeout, so
        // both are bounded with withTimeout — a flaky network (a manifest that
        // fetches, then stalls mid-download) must never stall the spinner. On
        // either timeout, boot proceeds on the CURRENT bundle and any staged
        // update applies on a later cold start (Story 16.10 AC1; Story 16.12
        // AC1). These calls run only with connectivity, so they don't affect the
        // pure-offline cold-start fixed in 16.10. Both failure paths report via
        // logger.notify — a NON-FATAL, warning-level Sentry message — so the
        // real-world failure rate is measurable instead of vanishing into the
        // __DEV__-only logger.warn (Story 16.14, AD-16-14-01), and each carries
        // an indexed otaFailureKind tag so a budget timeout can be counted
        // separately from an outright failure (AD-16-14-02) — that split is what
        // makes the budgets above calibratable from Sentry's UI. Neither path may
        // reach logger.error: that is the fatal dbErrorKey channel and would render
        // the boot-error screen.
        if (Updates.isEnabled) {
          try {
            const update = await withTimeout(
              Updates.checkForUpdateAsync(),
              UPDATE_CHECK_TIMEOUT_MS,
              UPDATE_CHECK_TIMEOUT_MESSAGE
            );
            if (update.isAvailable) {
              // Dedicated try/catch so a stalled or failed download — or a rare
              // reload failure — degrades gracefully: log and boot the current
              // bundle. reloadAsync runs only if the bounded fetch resolves.
              try {
                await withTimeout(
                  Updates.fetchUpdateAsync(),
                  UPDATE_FETCH_TIMEOUT_MS,
                  UPDATE_FETCH_TIMEOUT_MESSAGE
                );
                // reloadAsync is intentionally NOT wrapped in withTimeout: it
                // does no network I/O (the download already completed) and a JS
                // timeout cannot cancel a native runtime teardown. It is reached
                // only after the bounded fetch (Story 16.12, AC4).
                await Updates.reloadAsync();
              } catch (error) {
                logger.notify('Expo update download/reload failed:', {
                  tags: {
                    otaFailureKind: classifyOtaFailure(error, UPDATE_FETCH_TIMEOUT_MESSAGE)
                  },
                  context: [error]
                });
                // Boot the current bundle; the update applies on a later launch.
              }
            }
          } catch (error) {
            logger.notify('Expo update check failed:', {
              tags: { otaFailureKind: classifyOtaFailure(error, UPDATE_CHECK_TIMEOUT_MESSAGE) },
              context: [error]
            });
            // Continue with app initialization even if update check fails
          }
        }

        // Initialize database after update check completes
        await initializeDatabase();

        // Ensure a persistent guest session ID exists on this device (best-effort)
        try {
          await getOrCreateGuestSessionId();
        } catch (error) {
          logger.warn(
            'Guest session initialization failed (continuing without persistent guest ID):',
            error
          );
        }

        // Auth state is resolved separately by useBootAuthGate (an offline-safe
        // SecureStore probe + reactive onAuthStateChange), so boot no longer
        // blocks on a getSession() token refresh that never settled offline.
        // See Story 16.10 / AD-16-10-01.
        setIsInitialized(true);
      } catch (error) {
        logger.error('App initialization failed:', error);
        setDbErrorKey('common.errors.initializationFailed');
      }
    };

    let unsubscribeWearable: (() => void) | undefined;

    initializeApp().then(() => {
      // Push an initial snapshot so the wearable converges on launch, even if no
      // mutation happens this session. CRUD paths in card-repository keep it
      // in sync afterwards.
      getAllCards()
        .then((cards) => pushCardsToWearable(cards))
        .catch(() => {});

      try {
        // One seam, both platforms (Story 10-6, AC2): WCSession on iOS, the
        // Wearable Data Layer on Android. Subscribed after initializeApp so the
        // DB is ready even for the batch of events that queued while the app
        // wasn't running — the OS FIFO on iOS, the native durable inbox on
        // Android. The handler bodies (AC5's requestCards republish, AC10's
        // CARD_USED apply) live in `core/wearable-sync` so they are covered and
        // unit-tested; this layer only injects the repository functions they
        // need. Neither handler swallows its errors — see that module.
        unsubscribeWearable = subscribeToWearableInbound(
          createWearableInboundHandlers({
            getAllCards,
            parseWatchUsageEvent,
            applyWatchUsageEvents
          })
        );
      } catch {
        // ignore if native module missing
      }
    });
    return () => {
      if (typeof unsubscribeWearable === 'function') unsubscribeWearable();
    };
  }, []);

  // Gate the UI on BOTH local infra AND resolved auth state. Both are
  // offline-safe (local DB init + the SecureStore session probe in
  // useBootAuthGate), so this flips fast with no connectivity — and only once
  // auth is known, preserving the no-flash welcome gate (a signed-in user is
  // never bounced to /welcome).
  const isReady = isInitialized && isAuthReady;

  if (dbErrorKey) {
    return (
      <View style={styles.fullscreen}>
        <Text style={styles.errorTitle}>{t('common.errors.databaseErrorTitle')}</Text>
        <Text style={styles.errorBody}>{t(dbErrorKey)}</Text>
      </View>
    );
  }

  if (!isReady) {
    // testID retained verbatim: nine assertions in
    // test/root-layout.offline-boot.test.tsx key off `boot-loading`, and renaming
    // it would silently void the offline-boot regression suite (AC11).
    return <AppLaunchScreen onLayout={hideSplashScreen} testID="boot-loading" />;
  }

  return (
    // The launch surface exits by cross-fading into content over the same
    // duration as the native→JS handoff. Skipped entirely under reduced motion,
    // where every transition becomes an instant swap.
    <Animated.View
      entering={reducedMotion ? undefined : FadeIn.duration(EXIT_FADE_MS)}
      style={styles.contentRoot}
      testID="app-content-root"
    >
      <ThemeProvider>
        <RootLayoutContent isAuthenticated={isAuthenticated} />
      </ThemeProvider>
    </Animated.View>
  );
};

// Themed via Unistyles' function form even though these styles render OUTSIDE
// `ThemeProvider` (Story 16.17, AD-16-17-03). That works because Unistyles is
// engine-level, not context-level: the side-effect import at the top of this file
// runs `StyleSheet.configure` at module-evaluation time, so `theme` resolves here
// while `useTheme()` — which reads a React context — would throw. The hardcoded
// near-black background these styles used to carry was unowned debt from before
// that was true: not a design token, matching neither theme's background, and
// left behind when Story 13.10 corrected the spinner's colour.
const styles = StyleSheet.create((theme) => ({
  headerButton: {
    height: theme.touchTarget.min,
    width: theme.touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center'
  },
  // Carries the theme background explicitly, and that is load-bearing rather
  // than redundant: during the exit `FadeIn` this view is partially transparent,
  // so anything behind it composites through — and by then the launch surface has
  // unmounted, leaving the raw native window background. Without a colour here
  // the cross-fade would reveal a THIRD background mid-transition, reintroducing
  // in the exit exactly the flash this story deletes from the entrance. With it,
  // the fade runs straight into the theme's own field, which is also where a
  // forced-preference user's scheme override is meant to land (AD-16-17-05).
  contentRoot: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  // Now owned by the `dbErrorKey` branch only — the `!isReady` branch renders
  // AppLaunchScreen, which owns its own styles.
  fullscreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background
  },
  errorTitle: {
    ...TYPOGRAPHY.bodyLgStrong,
    color: theme.colors.error
  },
  errorBody: {
    ...TYPOGRAPHY.bodyMd,
    marginTop: 16,
    color: theme.colors.textSecondary
  }
}));

// Wrap the root component so Sentry can capture rendering errors and attach
// navigation/touch context (Story 16.2).
export default Sentry.wrap(RootLayout);

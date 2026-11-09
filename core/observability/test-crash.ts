/**
 * Sentry test crash (Story 24.5): proof that a release crash reaches Sentry symbolicated, without
 * shipping a crash button.
 *
 * The trigger exists only in a build made with `EXPO_PUBLIC_SENTRY_TEST_CRASH=1`. Expo inlines
 * `EXPO_PUBLIC_*` variables into the bundle at build time, so every other build carries the
 * literal `undefined === '1'` and the row never renders. No workflow sets the flag, and
 * `test/sentry-test-crash-flags.test.ts` pins that.
 */

/** Read on every call (not cached at module load) so tests can toggle it. */
export const isSentryTestCrashEnabled = (): boolean =>
  process.env.EXPO_PUBLIC_SENTRY_TEST_CRASH === '1';

/** Message of the deliberate crash, so the Sentry issue is easy to find. */
export const SENTRY_TEST_CRASH_MESSAGE = 'Cardì Sentry test crash (Story 24.5)';

/**
 * Throws an uncaught JS error. Called from a press handler, it reaches React Native's global
 * handler, which Sentry captures as a fatal crash with a JS stack the uploaded source maps
 * symbolicate.
 */
export const triggerSentryTestCrash = (): never => {
  throw new Error(SENTRY_TEST_CRASH_MESSAGE);
};

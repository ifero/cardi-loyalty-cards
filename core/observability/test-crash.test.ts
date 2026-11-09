import {
  SENTRY_TEST_CRASH_MESSAGE,
  isSentryTestCrashEnabled,
  triggerSentryTestCrash
} from './test-crash';

describe('Sentry test crash (Story 24.5)', () => {
  const original = process.env.EXPO_PUBLIC_SENTRY_TEST_CRASH;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.EXPO_PUBLIC_SENTRY_TEST_CRASH;
    } else {
      process.env.EXPO_PUBLIC_SENTRY_TEST_CRASH = original;
    }
  });

  it('is off when the flag is unset', () => {
    delete process.env.EXPO_PUBLIC_SENTRY_TEST_CRASH;
    expect(isSentryTestCrashEnabled()).toBe(false);
  });

  it.each(['0', 'true', '', ' 1'])('is off for %p: only exactly "1" opts in', (value) => {
    process.env.EXPO_PUBLIC_SENTRY_TEST_CRASH = value;
    expect(isSentryTestCrashEnabled()).toBe(false);
  });

  it('is on for exactly "1"', () => {
    process.env.EXPO_PUBLIC_SENTRY_TEST_CRASH = '1';
    expect(isSentryTestCrashEnabled()).toBe(true);
  });

  it('throws an Error with a findable message', () => {
    expect(() => triggerSentryTestCrash()).toThrow(new Error(SENTRY_TEST_CRASH_MESSAGE));
  });
});

import { useRouter } from 'expo-router';

/**
 * An auth screen's back (Story 22.9): `router.back()` wherever the stack has a screen beneath, as
 * the native header's back was; nothing where it has none — new password after recovery begun
 * from Home is alone on the stack — so the screen draws no header row. Android's back and the iOS
 * swipe stay the stack's own.
 *
 * Read at render: React Navigation's container state is a synchronous store, so a screen being
 * pushed already sees itself above the one it came from.
 */
export const useStackBack = (): (() => void) | undefined => {
  const router = useRouter();
  return router.canGoBack() ? () => router.back() : undefined;
};

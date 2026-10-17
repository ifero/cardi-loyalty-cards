import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccessibilityInfo,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { useTheme } from '@/shared/theme';
import { IDENTITY_COLORS, toRgbChannels } from '@/shared/theme/colors';
import { LAYOUT } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

/**
 * The sheet's motion, settled in Story 22.1 (AC8): the scrim FADES and only the sheet SLIDES, both
 * on the UI thread. A native Modal animation cannot do that, because it animates the whole modal:
 * `slide` (the shared sheet's) carried the dark scrim up the screen with the sheet like a curtain,
 * and `fade` (the multi-code picker's) faded the sheet too, so the rows behind it showed through
 * while it rose. So the Modal presents with no animation of its own. `withTiming` defaults to
 * `ReduceMotion.System`, so under Reduce Motion the sheet simply appears.
 */
export const SHEET_SLIDE_MS = 220;

/**
 * How far below its resting place the sheet sits, in % of its OWN height: 0 when shown, 100 (just
 * out of view) when not. The picker travelled a whole window height instead, so a short sheet was
 * off the screen for most of the 220 ms and seemed to blink out rather than slide.
 */
export const getSheetOffset = (visible: boolean): number => (visible ? 0 : 100);

/**
 * The slide as a style. A percentage `translate` resolves against the view's own size (React
 * Native 0.75+, New Architecture), so the sheet never has to be measured. A worklet, tested on
 * its own, because the Reanimated mock returns `{}` for animated styles.
 */
export const getSlideStyle = (offset: number): { transform: [{ translateY: `${number}%` }] } => {
  'worklet';
  return { transform: [{ translateY: `${offset}%` }] };
};

/** How much of the scrim shows: all of it when the sheet is shown, none when it is not. */
export const getScrimOpacity = (visible: boolean): number => (visible ? 1 : 0);

/** Ink at 40 % — the settings frames' scrim — split so it stays tied to the token. */
const SCRIM_COLOR = `rgba(${toRgbChannels(IDENTITY_COLORS.ink)}, 0.4)`;

/** The design system's grabber, from `stitch-prompts-settings.txt`: 36 × 4, fully rounded. */
const GRABBER_WIDTH = 36;
const GRABBER_HEIGHT = 4;

/** The sheet's bottom padding: 8 above the home indicator's inset, and never less than 20. */
const MIN_BOTTOM_PADDING = 20;
export const getSheetBottomPadding = (bottomInset: number, isKeyboardShown: boolean): number =>
  // The keyboard covers the home indicator, so the sheet resting on it keeps only the 20.
  isKeyboardShown ? MIN_BOTTOM_PADDING : Math.max(MIN_BOTTOM_PADDING, bottomInset + 8);

/**
 * Whether the keyboard is up, from the same events `KeyboardAvoidingView` follows on each platform
 * — the iOS `will` pair, the Android `did` pair — so the sheet's padding changes in the same update
 * as the avoiding view's.
 */
const useIsKeyboardShown = () => {
  const [isShown, setIsShown] = React.useState(() => Keyboard.isVisible());

  React.useEffect(() => {
    const [showEvent, hideEvent] =
      Platform.OS === 'ios'
        ? (['keyboardWillShow', 'keyboardWillHide'] as const)
        : (['keyboardDidShow', 'keyboardDidHide'] as const);
    const subscriptions = [
      Keyboard.addListener(showEvent, () => setIsShown(true)),
      Keyboard.addListener(hideEvent, () => setIsShown(false))
    ];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, []);

  return isShown;
};

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  /** What the sheet holds: an option list, a field, a failed request's banner first of all. */
  children?: React.ReactNode;
  /**
   * The sheet's buttons — its action, then Cancel — each a full-width large `Button`. They sit 24
   * below what precedes them, 8 apart, and stay on the sheet while the text above them scrolls.
   */
  actions?: React.ReactNode;
  testID?: string;
  accessibilityLabel?: string;
};

/**
 * The sheet (`cardi-design-system.md` § _Sheets_): anchored to the bottom edge, full width, white
 * (ink in dark) with a 16px radius on its TOP corners only, over a 40 % ink scrim. A 36 × 4 grabber
 * sits 8px from the top, then 24px margins hold a `sheetTitle` title, an optional description 8px
 * below it, and the content 16px below the text. It never grows taller than 80 % of the window: a
 * long list inside scrolls instead of pushing the title off the screen.
 *
 * **Actions (Story 22.7).** A sheet with actions pins them under its text: the title, the
 * description and the content scroll within the 80 % cap, and the actions never leave the sheet. A
 * sheet without actions draws exactly as it did.
 *
 * **The keyboard (Story 22.7).** While it is up, the sheet rests on the keyboard's top edge and may
 * take all the space above it, below the top safe-area inset — so even at the largest text sizes a
 * field shows whole above its actions, and that space is within 80 % of the window anyway — and its
 * bottom padding drops to 20. The keyboard-avoiding view
 * is the modal's full-screen root: `KeyboardAvoidingView` measures its overlap from its own
 * `onLayout` frame, which is relative to its PARENT, against the keyboard's top edge in SCREEN
 * coordinates, and only a view whose frame is the modal's whole screen gets the two to agree — one
 * inside the sheet pads about nothing. iOS takes `padding`; its keyboard events reach JS while a
 * modal is up. Android takes `padding` too, enabled only while the keyboard is up, as `FormScreen`
 * does: `keyboardDidHide` reports the visible frame's height rather than its bottom, which would
 * leave the status bar's height of padding under the sheet. ⚠️ Reasoned from the installed sources
 * and unverified on Android: the modal's dialog window is edge-to-edge, so it is not resized, and
 * its keyboard events reach JS only through the activity's root view.
 *
 * The scrim and the sheet are SIBLINGS. The scrim is a touch affordance only — hidden from
 * assistive technology, which gets the platform dismiss instead (Android back via
 * `onRequestClose`, the VoiceOver escape gesture) — and the sheet is a modal container, not an
 * accessibility element, so every control inside it stays reachable.
 */
export const BottomSheet = ({
  visible,
  onClose,
  title,
  description,
  children,
  actions,
  testID,
  accessibilityLabel
}: BottomSheetProps) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const isKeyboardShown = useIsKeyboardShown();
  const previousVisibleRef = React.useRef<boolean | null>(null);
  const offset = useSharedValue(getSheetOffset(false));
  const scrimOpacity = useSharedValue(getScrimOpacity(false));

  // The Modal outlives `visible` by the slide-out, so a closing sheet leaves on screen instead of
  // vanishing. It opens in the same render as `visible`, and closes when the slide has finished.
  const [isPresented, setIsPresented] = React.useState(visible);
  if (visible && !isPresented) {
    setIsPresented(true);
  }

  React.useEffect(() => {
    const timing = { duration: SHEET_SLIDE_MS, easing: Easing.out(Easing.ease) };
    scrimOpacity.value = withTiming(getScrimOpacity(visible), timing);
    offset.value = withTiming(getSheetOffset(visible), timing, (finished) => {
      // `finished` is false when a re-open cut this slide-out short. Its callback can still land
      // after the NEXT close has begun, and must not take that one's modal down with it.
      if (finished && !visible) {
        scheduleOnRN(setIsPresented, false);
      }
    });
  }, [offset, scrimOpacity, visible]);

  const slideStyle = useAnimatedStyle(() => getSlideStyle(offset.value));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrimOpacity.value }));

  React.useEffect(() => {
    const label = accessibilityLabel ?? title ?? t('sharedUi.bottomSheet.fallbackLabel');
    const previousVisible = previousVisibleRef.current;

    if (previousVisible === null) {
      previousVisibleRef.current = visible;
      if (visible) {
        AccessibilityInfo.announceForAccessibility?.(
          t('sharedUi.bottomSheet.openedAnnouncement', { label })
        );
      }
      return;
    }

    if (previousVisible !== visible) {
      AccessibilityInfo.announceForAccessibility?.(
        visible
          ? t('sharedUi.bottomSheet.openedAnnouncement', { label })
          : t('sharedUi.bottomSheet.closedAnnouncement', { label })
      );
      previousVisibleRef.current = visible;
    }
  }, [accessibilityLabel, t, title, visible]);

  const hasText = Boolean(title || description);
  // A null or false child — an error that is not there — leaves no 16pt gap behind it.
  const hasContent = React.Children.toArray(children).length > 0;
  const text = (
    <>
      {title ? (
        <Text accessibilityRole="header" style={[styles.title, { color: theme.textPrimary }]}>
          {title}
        </Text>
      ) : null}
      {description ? (
        <Text style={[styles.description, { color: theme.textSecondary }]}>{description}</Text>
      ) : null}
    </>
  );

  return (
    <Modal
      visible={isPresented}
      transparent
      animationType="none"
      onRequestClose={onClose}
      testID={testID}
      accessibilityElementsHidden={!visible}
    >
      <KeyboardAvoidingView
        testID={testID ? `${testID}-root` : undefined}
        behavior="padding"
        enabled={Platform.OS !== 'android' || isKeyboardShown}
        style={[
          styles.root,
          visible ? null : styles.leaving,
          // On the keyboard the sheet's cap is the space above it, kept below the top inset.
          isKeyboardShown ? { paddingTop: insets.top } : null
        ]}
      >
        <Animated.View style={[StyleSheet.absoluteFill, scrimStyle]}>
          <Pressable
            testID={testID ? `${testID}-scrim` : undefined}
            style={[StyleSheet.absoluteFill, styles.scrim]}
            onPress={onClose}
            accessible={false}
            importantForAccessibility="no"
            accessibilityElementsHidden
          />
        </Animated.View>
        <Animated.View
          testID={testID ? `${testID}-content` : undefined}
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          style={[
            styles.sheet,
            isKeyboardShown ? styles.sheetOnKeyboard : null,
            {
              backgroundColor: theme.surface,
              paddingBottom: getSheetBottomPadding(insets.bottom, isKeyboardShown)
            },
            slideStyle
          ]}
        >
          <View
            testID={testID ? `${testID}-grabber` : undefined}
            style={[styles.grabber, { backgroundColor: theme.border }]}
          />
          {actions ? (
            <>
              <ScrollView
                testID={testID ? `${testID}-body` : undefined}
                style={styles.scrollBody}
                contentContainerStyle={styles.scrollBodyContent}
                alwaysBounceVertical={false}
                keyboardShouldPersistTaps="handled"
              >
                {text}
                {hasContent ? (
                  <View
                    testID={testID ? `${testID}-children` : undefined}
                    style={hasText ? styles.contentBelowText : null}
                  >
                    {children}
                  </View>
                ) : null}
              </ScrollView>
              <View testID={testID ? `${testID}-actions` : undefined} style={styles.actions}>
                {actions}
              </View>
            </>
          ) : (
            <View style={styles.body}>
              {text}
              {hasContent ? (
                <View
                  testID={testID ? `${testID}-children` : undefined}
                  style={[styles.content, hasText ? styles.contentBelowText : null]}
                >
                  {children}
                </View>
              ) : null}
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // The keyboard-avoiding view, filling the modal: its `padding` lifts the sheet onto the keyboard.
  root: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  // A sheet on its way out takes no more touches, so none of its actions can fire a second time.
  leaving: {
    pointerEvents: 'none'
  },
  scrim: {
    backgroundColor: SCRIM_COLOR
  },
  sheet: {
    maxHeight: '80%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: LAYOUT.screenHorizontalMargin
  },
  // A percentage resolves inside the root's padding: the keyboard's height below, the top inset
  // above. So on the keyboard the sheet may fill the space between them, and no more.
  sheetOnKeyboard: {
    maxHeight: '100%'
  },
  grabber: {
    alignSelf: 'center',
    width: GRABBER_WIDTH,
    height: GRABBER_HEIGHT,
    borderRadius: GRABBER_HEIGHT / 2,
    marginTop: 8
  },
  body: {
    flexShrink: 1,
    paddingTop: 16
  },
  title: {
    ...TYPOGRAPHY.sheetTitle
  },
  description: {
    ...TYPOGRAPHY.bodyMd,
    marginTop: 8
  },
  // Shrinks so a scrolling child (a list) stays inside the 80 % cap instead of overflowing it.
  content: {
    flexShrink: 1
  },
  contentBelowText: {
    marginTop: 16
  },
  // The text above a sheet's actions. It shrinks, and scrolls, once the sheet reaches its cap, and
  // it never grows: React Native lays out with Yoga's legacy stretch, which hands a height-capped
  // container's spare height to a growing child, and a scroll view grows by default — so a short
  // sheet would stretch to 80 % of the window.
  scrollBody: {
    flexGrow: 0,
    flexShrink: 1
  },
  scrollBodyContent: {
    paddingTop: 16
  },
  actions: {
    marginTop: 24,
    gap: 8
  }
});

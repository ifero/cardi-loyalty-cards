/**
 * One question of help's FAQ (Story 22.8, document frame B): the question's row, and its answer
 * beneath it. It sits in the FAQ's divided `Surface`, whose rules run between the items, so the
 * answer sits above the next rule. No tint and no fill: the row takes `surfaceElevated` only while
 * held, as a settings row does.
 *
 * The answer opens and closes in motion, not at once (decision, 2026-10-19): it grows from beneath
 * its question to its full height, and everything below it moves with it. The question's chevron
 * turns on the same motion.
 */

import ChevronDown from 'lucide-react-native/icons/chevron-down';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type AccessibilityActionEvent,
  type LayoutChangeEvent,
  Platform,
  Pressable,
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

import { BulletList } from '@/shared/components/ui';
import { SHEET_SLIDE_MS } from '@/shared/components/ui/BottomSheet';
import { useTheme } from '@/shared/theme';
import { SPACING, TOUCH_TARGET } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import type { HelpItem } from './help-fallback';

/** The chevron of every row (`cardi-design-system.md` § _Settings_): 24pt at a 1.5 stroke. */
const CHEVRON_SIZE = 24;
const CHEVRON_STROKE_WIDTH = 1.5;

/**
 * How much of its answer shows, as a style. `progress` runs from 0, closed, to 1, open, and
 * `contentHeight` is the height the answer's content measures. Closed, the answer holds no space;
 * in motion, its share of that height, so everything below it moves with it; open and at rest, its
 * natural height, so it is whole from its first frame, measured or not, and grows with its text.
 * A worklet, tested on its own, because the Reanimated mock returns `{}` for animated styles.
 */
export const getAnswerRevealStyle = (
  progress: number,
  contentHeight: number
): { height: number | 'auto' } => {
  'worklet';
  return { height: progress === 1 ? 'auto' : progress * contentHeight };
};

/**
 * Where the answer's content lies, as a style. Open and at rest, in the flow, so it gives the window
 * its natural height. Closed and in motion, out of it, pinned to the window's top and sides: the same
 * frame, laid out at its own natural height whatever the window's. In the flow, a window held to a
 * height clamps its content to it — Yoga hands the children of a 0-tall view an at-most-0 height, and
 * React Native's text measures to that — so the content would measure short, and the motion would
 * creep and then snap. A worklet, tested on its own, as `getAnswerRevealStyle` is.
 */
export const getAnswerContentStyle = (progress: number): { position: 'relative' | 'absolute' } => {
  'worklet';
  return { position: progress === 1 ? 'relative' : 'absolute' };
};

/**
 * How far the chevron has turned, as a style, on the answer's own `progress`: pointing down while
 * closed, turned half a circle to point up while open, and turning with the answer between. Turned
 * half a circle, `chevron-down` is exactly `chevron-up`'s glyph, so an open question draws frame B's
 * chevron. A worklet, tested on its own, as `getAnswerRevealStyle` is.
 */
export const getChevronTurnStyle = (progress: number): { transform: { rotate: string }[] } => {
  'worklet';
  return { transform: [{ rotate: `${progress * 180}deg` }] };
};

type FaqItemProps = {
  item: HelpItem;
  /** Whether its answer shows. Several questions may be open at once. */
  isOpen: boolean;
  /** Opens a closed question and closes an open one. */
  onToggle: () => void;
};

export const FaqItem = ({ item, isOpen, onToggle }: FaqItemProps) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  // Where the answer's motion stands. A question that mounts open, back from a search that hid it,
  // starts open and whole.
  const progress = useSharedValue(isOpen ? 1 : 0);
  // Where the motion last headed: it runs when the question opens or closes, never when it mounts.
  const motionTargetRef = useRef(isOpen);
  // The height the answer's content measures: its natural height, laid out closed or open, so the
  // motion knows how far to go from its first frame.
  const contentHeight = useSharedValue(0);
  const revealStyle = useAnimatedStyle(() =>
    getAnswerRevealStyle(progress.value, contentHeight.value)
  );
  const contentStyle = useAnimatedStyle(() => getAnswerContentStyle(progress.value));
  const chevronStyle = useAnimatedStyle(() => getChevronTurnStyle(progress.value));
  const steps = item.steps ?? [];

  // The sheet's timing (`cardi-design-system.md` § _Sheets_): 220 ms ease-out on the UI thread,
  // opening and closing alike. `withTiming` follows the system's Reduce Motion unless it is told
  // otherwise, so there the answer opens and closes at once.
  useEffect(() => {
    if (motionTargetRef.current === isOpen) return;
    motionTargetRef.current = isOpen;
    progress.value = withTiming(isOpen ? 1 : 0, {
      duration: SHEET_SLIDE_MS,
      easing: Easing.out(Easing.ease)
    });
  }, [isOpen, progress]);

  const measureContent = (event: LayoutChangeEvent) => {
    contentHeight.value = event.nativeEvent.layout.height;
  };

  // How the question's state is said (`cardi-design-system.md` § _Documents_). On iOS, in the
  // app's own strings: React Native voices "expanded" from the state only while it is true, and in
  // English whatever the app's language, since its own strings ship empty, so iOS takes no state
  // and the value says it both ways, read after the name. On Android, in TalkBack's own words, in
  // the system's language: TalkBack voices the state both ways itself.
  const isIos = Platform.OS === 'ios';

  // TalkBack offers Expand while the question is closed and Collapse while it is open. On either,
  // React Native sets the state natively and reaches JS only for an action JS declares
  // (`ReactAccessibilityDelegate.kt`), so the question declares the one TalkBack offers, and it
  // opens or closes the question as a press does. One that no longer fits does nothing.
  const onAccessibilityAction = (event: AccessibilityActionEvent) => {
    const { actionName } = event.nativeEvent;
    if ((actionName === 'expand' && !isOpen) || (actionName === 'collapse' && isOpen)) {
      onToggle();
    }
  };

  return (
    <View>
      <Pressable
        testID={`help-question-${item.id}`}
        onPress={onToggle}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        accessibilityRole="button"
        accessibilityLabel={item.question}
        accessibilityState={isIos ? undefined : { expanded: isOpen }}
        accessibilityValue={
          isIos
            ? {
                text: t(
                  isOpen ? 'help.expandedAccessibilityValue' : 'help.collapsedAccessibilityValue'
                )
              }
            : undefined
        }
        accessibilityActions={isIos ? undefined : [{ name: isOpen ? 'collapse' : 'expand' }]}
        onAccessibilityAction={isIos ? undefined : onAccessibilityAction}
        style={[
          styles.question,
          { backgroundColor: isPressed ? theme.surfaceElevated : 'transparent' }
        ]}
      >
        <Text style={[styles.questionText, { color: theme.textPrimary }]}>{item.question}</Text>
        {/* One chevron, turning with its answer: down while closed, up while open. */}
        <Animated.View testID={`help-question-${item.id}-chevron-turn`} style={chevronStyle}>
          <ChevronDown
            testID={`help-question-${item.id}-chevron`}
            size={CHEVRON_SIZE}
            strokeWidth={CHEVRON_STROKE_WIDTH}
            color={theme.textSecondary}
          />
        </Animated.View>
      </Pressable>

      {/* A closed answer holds no space and is not read. */}
      <Animated.View
        testID={`help-answer-${item.id}-reveal`}
        accessibilityElementsHidden={!isOpen}
        importantForAccessibility={isOpen ? 'auto' : 'no-hide-descendants'}
        style={[styles.reveal, revealStyle]}
      >
        <Animated.View
          testID={`help-answer-${item.id}`}
          style={[styles.answer, contentStyle]}
          onLayout={measureContent}
        >
          <Text style={[styles.answerText, { color: theme.textSecondary }]}>{item.answer}</Text>
          {steps.length > 0 ? (
            <View style={styles.steps}>
              <BulletList items={steps} tone="muted" testID={`help-answer-${item.id}-steps`} />
            </View>
          ) : null}
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  // At least 48, padded 12/16, 12 between the question and the chevron, centred on the row: the
  // system row's measures, over the frame's 14/16.
  question: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOUCH_TARGET.min,
    paddingVertical: SPACING.smMd,
    paddingHorizontal: SPACING.md,
    gap: SPACING.smMd
  },
  // The rest of the row: under large text the question wraps and the row grows, and the chevron
  // stays at the row's end.
  questionText: {
    ...TYPOGRAPHY.bodyLgStrong,
    flex: 1
  },
  // The window the answer shows through: its height moves, and the content beneath it keeps its own,
  // clipped to what shows.
  reveal: {
    overflow: 'hidden'
  },
  // Pinned to the window's top and sides, so it keeps one frame in the flow and out of it.
  answer: {
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md
  },
  answerText: {
    ...TYPOGRAPHY.bodyMd
  },
  steps: {
    marginTop: SPACING.sm
  }
});

/**
 * One of onboarding's adopted drawings, or the mark's intro, played once (Story 22.10).
 *
 * The files in `assets/animations/onboarding/` play once and rest on their last frame, which is
 * exactly the static drawing (`docs/design/cardi/lottie/README.md`). So this player:
 *
 * - plays its file the first time `active` turns true, never looping, and rests on the last frame;
 * - shows that last frame at once, and never plays, under Reduce Motion — Reanimated's reading,
 *   taken once at launch, as the launch screen and the scanner's beam take it. lottie-ios plays in
 *   full under Reduce Motion unless it is told not to;
 * - rests once it has played: an `active` that turns false mid-play — a slide swiped away, Welcome
 *   covered by mode selection — settles it on its last frame, and an `active` that turns true again
 *   plays nothing (decision 1);
 * - rests for good once `rest` turns true, from any phase: on its last frame, never to play — Welcome
 *   left before its entrance ended, so coming back replays nothing (decision 5);
 * - takes the `-light` or `-dark` file by the scheme. A scheme change mounts the new file at its
 *   last frame if this one had started, and at its first if it had not;
 * - is decorative: hidden from assistive technology, since the titles carry the meaning;
 * - keeps its box and draws nothing when the file fails to load, throwing and announcing nothing.
 *
 * It lives in `features/onboarding/`, never `shared/components/ui/`: Storybook loads its stories
 * from that directory and cannot bundle the player, because lottie-react-native's web entry
 * (`src/LottieView/index.web.tsx`) imports the optional peer `@lottiefiles/dotlottie-react`, which
 * is not installed.
 */

import LottieView, { type AnimationObject } from 'lottie-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { useTheme } from '@/shared/theme';

/** Not yet played; playing; played, or settled, and resting on the last frame. */
type Phase = 'waiting' | 'playing' | 'rested';

type OnboardingAnimationProps = {
  /** The light scheme's file. A file that serves both schemes, the mark's, is passed twice. */
  light: AnimationObject;
  /** The dark scheme's file. */
  dark: AnimationObject;
  /**
   * Plays the first time this turns true. Welcome's turns true once its entrance has ended, while
   * the screen is focused (decision 5). A highlight's turns true when its page is shown: on mount
   * for the first page, at once on Next — as its page slides in, not once the page settles — or
   * when a swipe settles on it.
   */
  active: boolean;
  /** Once true, rests on the last frame for good, without playing, whatever the phase. */
  rest?: boolean;
  /** The box's testID. The player inside it takes `<testID>-lottie`. */
  testID: string;
};

/** The last frame, in the player's normalised progress. */
const LAST_FRAME = 1;
const FIRST_FRAME = 0;

export const OnboardingAnimation = ({
  light,
  dark,
  active,
  rest = false,
  testID
}: OnboardingAnimationProps) => {
  const { isDark } = useTheme();
  const reduceMotion = useReducedMotion();
  const lottieRef = React.useRef<LottieView>(null);
  const source = isDark ? dark : light;

  const [phase, setPhase] = React.useState<Phase>('waiting');
  const [hasFailed, setHasFailed] = React.useState(false);
  const [shownSource, setShownSource] = React.useState(source);

  // A new file has a fresh chance to load. One that swaps in mid-play rests on its last frame: the
  // new player mounts still, so it would otherwise sit on its first.
  if (shownSource !== source) {
    setShownSource(source);
    setHasFailed(false);
    if (phase === 'playing') {
      setPhase('rested');
    }
  }

  // Leaving mid-play settles it, so coming back finds it at rest.
  if (!active && phase === 'playing') {
    setPhase('rested');
  }

  // Told to rest, it rests for good — before it has played, too.
  if (rest && phase !== 'rested') {
    setPhase('rested');
  }

  React.useEffect(() => {
    if (!active || reduceMotion || hasFailed || phase !== 'waiting') {
      return;
    }
    lottieRef.current?.play();
    setPhase('playing');
  }, [active, hasFailed, phase, reduceMotion]);

  // Stable, so the player — a PureComponent that serialises its whole file on every render — only
  // renders again when what it shows changes.
  const handleFinish = React.useCallback(() => setPhase('rested'), []);
  const handleFailure = React.useCallback(() => setHasFailed(true), []);

  const isAtRest = reduceMotion || phase === 'rested';

  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      // The file's own size, so it is drawn 1:1: 280 × 190 for a drawing, 100 × 100 for the mark.
      style={{ width: source.w, height: source.h }}
    >
      {hasFailed ? null : (
        <LottieView
          // A scheme's file is a new player, mounted at the frame its phase says. The mark serves
          // both schemes, so it keeps one.
          key={source === light ? 'light' : 'dark'}
          ref={lottieRef}
          testID={`${testID}-lottie`}
          source={source}
          loop={false}
          autoPlay={false}
          progress={isAtRest ? LAST_FRAME : FIRST_FRAME}
          onAnimationFinish={handleFinish}
          onAnimationFailure={handleFailure}
          style={StyleSheet.absoluteFill}
        />
      )}
    </View>
  );
};

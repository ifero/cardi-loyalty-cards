import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import type { AnimationObject } from 'lottie-react-native';

import { completeFirstLaunch, isFirstLaunch } from '@/core/settings/settings-repository';

import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import FeatureHighlightsScreen from './FeatureHighlightsScreen';

let mockTheme: typeof LIGHT_THEME | typeof DARK_THEME = LIGHT_THEME;
let mockIsDark = false;

jest.mock('@/core/settings/settings-repository', () => ({
  isFirstLaunch: jest.fn(() => true),
  completeFirstLaunch: jest.fn()
}));

// A notched phone's insets, so each one the screen adds is observed.
const mockInsets = { top: 59, right: 0, bottom: 34, left: 0 };

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockInsets
}));

jest.mock('@/shared/theme', () => ({
  useTheme: () => ({ theme: mockTheme, isDark: mockIsDark })
}));

const reanimated = jest.requireMock<{ useReducedMotion: () => boolean }>('react-native-reanimated');

// The drawings are decorative, so their queries opt into hidden elements.
const HIDDEN = { includeHiddenElements: true } as const;

const SLIDES = [0, 1, 2] as const;
const FILES = ['onboarding-all-your-cards', 'onboarding-scan-or-type', 'onboarding-your-data'];

const player = (index: number) =>
  screen.getByTestId(`highlight-illustration-${index}-lottie`, HIDDEN);
const playCount = (index: number) =>
  (player(index).props.commands as { play: jest.Mock }).play.mock.calls.length;
const progress = (index: number) => player(index).props.progress as number;

/** A swipe that settles on a page, as the carousel reports it. */
const swipeTo = (index: number) =>
  fireEvent(screen.getByTestId('highlights-flatlist'), 'momentumScrollEnd', {
    nativeEvent: { contentOffset: { x: index * 400, y: 0 }, layoutMeasurement: { width: 400 } }
  });

/** The native player reporting the end of its one play. */
const finishPlay = (index: number) =>
  act(() => {
    player(index).props.onAnimationFinish(false);
  });

describe('FeatureHighlightsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    mockTheme = LIGHT_THEME;
    mockIsDark = false;
    (isFirstLaunch as jest.Mock).mockReturnValue(true);
  });

  it('renders first slide by default', () => {
    render(<FeatureHighlightsScreen />);
    expect(screen.getByTestId('highlight-slide-0')).toBeTruthy();
  });

  it("gives each slide its own drawing, the scheme's file", () => {
    render(<FeatureHighlightsScreen />);

    SLIDES.forEach((index) => {
      expect((player(index).props.source as AnimationObject).nm).toBe(`${FILES[index]}-light`);
      expect(player(index)).toHaveProp('loop', false);
      expect(screen.getByTestId(`highlight-illustration-${index}`, HIDDEN)).toHaveStyle({
        width: 280,
        height: 190
      });
    });
  });

  it('takes the dark drawings in dark', () => {
    mockIsDark = true;
    render(<FeatureHighlightsScreen />);

    SLIDES.forEach((index) => {
      expect((player(index).props.source as AnimationObject).nm).toBe(`${FILES[index]}-dark`);
    });
  });

  it('lies on the ground: the light one in light, the black one in dark', () => {
    const { unmount } = render(<FeatureHighlightsScreen />);
    expect(screen.getByTestId('feature-highlights-screen')).toHaveStyle({
      backgroundColor: LIGHT_THEME.background
    });
    unmount();

    mockTheme = DARK_THEME;
    mockIsDark = true;
    render(<FeatureHighlightsScreen />);
    expect(screen.getByTestId('feature-highlights-screen')).toHaveStyle({
      backgroundColor: DARK_THEME.background
    });
  });

  it("plays the first slide's drawing once on mount, and no other", () => {
    render(<FeatureHighlightsScreen />);

    expect(playCount(0)).toBe(1);
    expect(playCount(1)).toBe(0);
    expect(playCount(2)).toBe(0);
  });

  it("plays the next slide's drawing once on Next, and does not replay the first", () => {
    render(<FeatureHighlightsScreen />);
    finishPlay(0);

    fireEvent.press(screen.getByTestId('highlight-next-button'));

    expect(playCount(1)).toBe(1);
    expect(playCount(0)).toBe(1);
    expect(progress(0)).toBe(1);
  });

  it("plays a slide's drawing once when a swipe settles on it", () => {
    render(<FeatureHighlightsScreen />);

    swipeTo(2);

    expect(playCount(2)).toBe(1);
    expect(playCount(1)).toBe(0);
  });

  it('rests a slide already shown when a swipe brings it back (decision 1)', () => {
    render(<FeatureHighlightsScreen />);
    finishPlay(0);
    swipeTo(1);
    finishPlay(1);

    swipeTo(0);
    expect(playCount(0)).toBe(1);
    expect(progress(0)).toBe(1);

    swipeTo(1);
    expect(playCount(1)).toBe(1);
    expect(progress(1)).toBe(1);
  });

  it('rests a slide swiped away mid-play, so it is still when it comes back', () => {
    render(<FeatureHighlightsScreen />);

    swipeTo(1);
    expect(progress(0)).toBe(1);

    swipeTo(0);
    expect(playCount(0)).toBe(1);
    expect(progress(0)).toBe(1);
  });

  it('shows every drawing at its last frame under Reduce Motion, playing nothing', () => {
    jest.spyOn(reanimated, 'useReducedMotion').mockReturnValue(true);
    render(<FeatureHighlightsScreen />);
    fireEvent.press(screen.getByTestId('highlight-next-button'));

    SLIDES.forEach((index) => {
      expect(progress(index)).toBe(1);
      expect(playCount(index)).toBe(0);
    });
  });

  it('scrolls each page on its own, and anchors the dots and the action in the footer', () => {
    render(<FeatureHighlightsScreen />);
    const footer = screen.getByTestId('highlights-footer');
    const root = screen.getByTestId('feature-highlights-screen');

    expect(within(root).getByTestId('highlights-flatlist')).toBeTruthy();
    expect(within(root).getByTestId('highlights-footer')).toBeTruthy();

    SLIDES.forEach((index) => {
      const page = screen.getByTestId(`highlight-content-${index}`);
      expect(page.props.alwaysBounceVertical).toBe(false);
      expect(within(page).getByTestId(`highlight-illustration-${index}`, HIDDEN)).toBeTruthy();
    });
    expect(within(footer).getByTestId('pagination-dots')).toBeTruthy();
    // The dots sit 24 above the action.
    expect(within(footer).getByTestId('highlights-footer-actions')).toHaveStyle({ gap: 24 });
    expect(within(footer).getByTestId('highlight-next-button-container')).toHaveStyle({
      minHeight: 52,
      backgroundColor: LIGHT_THEME.primary
    });
  });

  it('draws Skip at the top right, 48 tall, in body-md semibold, 8 below the top inset', () => {
    render(<FeatureHighlightsScreen />);

    // The row runs on the screen margin, and Skip ends on it.
    expect(screen.getByTestId('highlights-skip-row')).toHaveStyle({
      paddingTop: mockInsets.top + 8,
      paddingHorizontal: 24,
      alignItems: 'flex-end'
    });
    expect(screen.getByTestId('highlights-skip')).toHaveStyle({
      minHeight: 48,
      minWidth: 48,
      alignItems: 'flex-end'
    });
    expect(screen.getByText('Skip')).toHaveStyle({
      fontSize: 15,
      fontWeight: '600',
      color: LIGHT_THEME.link
    });
  });

  it('next advances from first slide to second (pagination updates)', () => {
    render(<FeatureHighlightsScreen />);

    expect(screen.getByTestId('pagination-dots')).toHaveProp('accessibilityLabel', 'Page 1 of 3');
    fireEvent.press(screen.getByTestId('highlight-next-button'));

    expect(screen.getByTestId('pagination-dots')).toHaveProp('accessibilityLabel', 'Page 2 of 3');
    expect(screen.getByTestId('pagination-dot-1')).toHaveStyle({
      backgroundColor: LIGHT_THEME.primary
    });
  });

  it("finishes onboarding from the last slide's Let's go!", () => {
    const replaceSpy = useRouter().replace as jest.Mock;
    render(<FeatureHighlightsScreen />);

    fireEvent.press(screen.getByTestId('highlight-next-button'));
    fireEvent.press(screen.getByTestId('highlight-next-button'));
    expect(screen.getByText("Let's go!")).toBeTruthy();
    expect(completeFirstLaunch).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('highlight-next-button'));
    expect(completeFirstLaunch).toHaveBeenCalledTimes(1);
    expect(replaceSpy).toHaveBeenCalledWith('/');
  });

  it('skip completes onboarding and navigates home', () => {
    const replaceSpy = useRouter().replace as jest.Mock;
    render(<FeatureHighlightsScreen />);

    fireEvent.press(screen.getByTestId('highlights-skip'));
    expect(completeFirstLaunch).toHaveBeenCalled();
    expect(replaceSpy).toHaveBeenCalledWith('/');
  });

  it('redirects to home when onboarding is already completed', () => {
    const replaceSpy = useRouter().replace as jest.Mock;
    (isFirstLaunch as jest.Mock).mockReturnValue(false);

    render(<FeatureHighlightsScreen />);
    expect(replaceSpy).toHaveBeenCalledWith('/');
  });
});

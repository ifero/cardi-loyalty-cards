import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import type { AnimationObject } from 'lottie-react-native';
import { ScrollView } from 'react-native';

import { isFirstLaunch } from '@/core/settings/settings-repository';

import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import markIntro from '@/assets/animations/onboarding/cardi-mark-intro.json';

import WelcomeScreen from './WelcomeScreen';

let mockTheme: typeof LIGHT_THEME | typeof DARK_THEME = LIGHT_THEME;
let mockIsDark = false;

// A notched phone's insets, so each one the screen adds is observed.
const mockInsets = { top: 59, right: 0, bottom: 34, left: 0 };

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockInsets
}));

jest.mock('@/shared/theme', () => ({
  useTheme: () => ({ theme: mockTheme, isDark: mockIsDark })
}));

jest.mock('@/core/settings/settings-repository', () => ({
  isFirstLaunch: jest.fn(() => true)
}));

const reanimated = jest.requireMock<{ useReducedMotion: () => boolean }>('react-native-reanimated');
const navigation = jest.requireMock<{ useIsFocused: jest.Mock; useNavigation: () => unknown }>(
  'expo-router'
);

type TransitionEndListener = (event: { data: { closing: boolean } }) => void;

/** The stack's `transitionEnd` listeners Welcome holds, as `addListener` adds and removes them. */
const transitionEndListeners = new Set<TransitionEndListener>();
const mockNavigation = {
  addListener: jest.fn((type: string, listener: TransitionEndListener) => {
    if (type === 'transitionEnd') {
      transitionEndListeners.add(listener);
    }
    return () => transitionEndListeners.delete(listener);
  }),
  dispatch: jest.fn()
};

/** The stack reporting that one of Welcome's transitions has ended: its entrance when not closing. */
const endTransition = (closing = false) =>
  act(() => {
    transitionEndListeners.forEach((listener) => listener({ data: { closing } }));
  });

const WELCOME_ANIMATIONS = ['welcome-branded-icon', 'welcome-fanned-illustration'];

// The mark and the drawing are decorative, so their queries opt into hidden elements.
const HIDDEN = { includeHiddenElements: true } as const;

const player = (testID: string) => screen.getByTestId(`${testID}-lottie`, HIDDEN);
const shownFile = (testID: string) => (player(testID).props.source as AnimationObject).nm;
const commands = (testID: string) => player(testID).props.commands as { play: jest.Mock };

describe('WelcomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    mockTheme = LIGHT_THEME;
    mockIsDark = false;
    navigation.useIsFocused.mockReturnValue(true);
    (isFirstLaunch as jest.Mock).mockReturnValue(true);
    transitionEndListeners.clear();
    jest.spyOn(navigation, 'useNavigation').mockReturnValue(mockNavigation);
  });

  it('renders the mark, the title, the subtitle and the drawing', () => {
    render(<WelcomeScreen />);

    expect(screen.getByTestId('welcome-branded-icon', HIDDEN)).toBeTruthy();
    expect(screen.getByTestId('welcome-fanned-illustration', HIDDEN)).toBeTruthy();
    expect(screen.getByText('Cardì')).toBeTruthy();
    expect(screen.getByText('Your loyalty cards, always with you')).toBeTruthy();
  });

  it('plays nothing before its entrance has ended (decision 5)', () => {
    render(<WelcomeScreen />);

    WELCOME_ANIMATIONS.forEach((testID) => {
      expect(commands(testID).play).not.toHaveBeenCalled();
      expect(player(testID)).toHaveProp('progress', 0);
    });
  });

  it('starts the mark intro and the welcome drawing together once its entrance ends, each played once', () => {
    render(<WelcomeScreen />);
    endTransition();

    expect(shownFile('welcome-branded-icon')).toBe('cardi-mark-intro');
    expect(shownFile('welcome-fanned-illustration')).toBe('onboarding-welcome-light');
    expect(commands('welcome-branded-icon').play).toHaveBeenCalledTimes(1);
    expect(commands('welcome-fanned-illustration').play).toHaveBeenCalledTimes(1);
    expect(player('welcome-branded-icon')).toHaveProp('loop', false);
    expect(player('welcome-fanned-illustration')).toHaveProp('loop', false);
  });

  it('starts nothing when a transition of it ends closing', () => {
    render(<WelcomeScreen />);
    endTransition(true);

    WELCOME_ANIMATIONS.forEach((testID) => expect(commands(testID).play).not.toHaveBeenCalled());
  });

  it('rests both when it is left before its entrance ends, and keeps them at rest on return', () => {
    const { rerender } = render(<WelcomeScreen />);

    navigation.useIsFocused.mockReturnValue(false);
    rerender(<WelcomeScreen />);
    WELCOME_ANIMATIONS.forEach((testID) => expect(player(testID)).toHaveProp('progress', 1));

    navigation.useIsFocused.mockReturnValue(true);
    rerender(<WelcomeScreen />);
    endTransition();
    WELCOME_ANIMATIONS.forEach((testID) => {
      expect(player(testID)).toHaveProp('progress', 1);
      expect(commands(testID).play).not.toHaveBeenCalled();
    });
  });

  it('stops listening for its entrance once it unmounts', () => {
    const { unmount } = render(<WelcomeScreen />);
    expect(transitionEndListeners.size).toBeGreaterThan(0);

    unmount();
    expect(transitionEndListeners.size).toBe(0);
  });

  it('takes the dark drawing in dark, and the one mark file in both schemes', () => {
    mockIsDark = true;
    render(<WelcomeScreen />);

    expect(shownFile('welcome-branded-icon')).toBe('cardi-mark-intro');
    expect(shownFile('welcome-fanned-illustration')).toBe('onboarding-welcome-dark');
  });

  it('lies on the ground: the light one in light, the black one in dark', () => {
    const { unmount } = render(<WelcomeScreen />);
    expect(screen.getByTestId('welcome-screen')).toHaveStyle({
      backgroundColor: LIGHT_THEME.background
    });
    unmount();

    mockTheme = DARK_THEME;
    mockIsDark = true;
    render(<WelcomeScreen />);
    expect(screen.getByTestId('welcome-screen')).toHaveStyle({
      backgroundColor: DARK_THEME.background
    });
  });

  it("draws the mark in its intro at the app icon's proportion: its box 58.6 of the 100 field, centred (decision 6)", () => {
    const intro = markIntro as unknown as {
      w: number;
      h: number;
      layers: {
        shapes: { nm: string; it: { ty: string; p?: { k: number[] }; s?: { k: number[] } }[] }[];
      }[];
    };
    const mark = intro.layers[0]?.shapes.find((shape) => shape.nm === 'mark');
    const placement = mark?.it.find((item) => item.ty === 'tr');
    // The mark is drawn in the units of `cardi-mark-inline.svg`, whose viewBox is the mark's box:
    // 834.556 × 1024.
    const [scaleX = 0, scaleY = 0] = placement?.s?.k ?? [];
    const [left = 0, top = 0] = placement?.p?.k ?? [];
    const boxWidth = (834.556 * scaleX) / 100;
    const boxHeight = (1024 * scaleY) / 100;

    expect([intro.w, intro.h]).toEqual([100, 100]);
    expect(boxHeight).toBeCloseTo(58.6, 1);
    expect(left + boxWidth / 2).toBeCloseTo(50, 3);
    expect(top + boxHeight / 2).toBeCloseTo(50, 3);
  });

  it('shows both at their last frame under Reduce Motion, playing nothing', () => {
    jest.spyOn(reanimated, 'useReducedMotion').mockReturnValue(true);
    render(<WelcomeScreen />);
    endTransition();

    for (const testID of WELCOME_ANIMATIONS) {
      expect(player(testID)).toHaveProp('progress', 1);
      expect(commands(testID).play).not.toHaveBeenCalled();
    }
  });

  it('settles both on their last frames when mode selection covers it mid-play, and replays nothing on return', () => {
    const { rerender } = render(<WelcomeScreen />);
    endTransition();

    navigation.useIsFocused.mockReturnValue(false);
    rerender(<WelcomeScreen />);
    WELCOME_ANIMATIONS.forEach((testID) => expect(player(testID)).toHaveProp('progress', 1));

    navigation.useIsFocused.mockReturnValue(true);
    rerender(<WelcomeScreen />);
    // The stack reports its reappearance as another entrance.
    endTransition();
    WELCOME_ANIMATIONS.forEach((testID) => {
      expect(player(testID)).toHaveProp('progress', 1);
      expect(commands(testID).play).toHaveBeenCalledTimes(1);
    });
  });

  it('rests on its last frames after playing through, and replays nothing on return', () => {
    const { rerender } = render(<WelcomeScreen />);
    endTransition();
    act(() => {
      WELCOME_ANIMATIONS.forEach((testID) => player(testID).props.onAnimationFinish(false));
    });

    navigation.useIsFocused.mockReturnValue(false);
    rerender(<WelcomeScreen />);
    navigation.useIsFocused.mockReturnValue(true);
    rerender(<WelcomeScreen />);
    endTransition();

    WELCOME_ANIMATIONS.forEach((testID) => {
      expect(player(testID)).toHaveProp('progress', 1);
      expect(commands(testID).play).toHaveBeenCalledTimes(1);
    });
  });

  it('sets the mark 64 below the top inset, the title 32 below it and the drawing 40 below the subtitle', () => {
    render(<WelcomeScreen />);

    expect(screen.getByTestId('welcome-scroll').props.contentContainerStyle).toEqual(
      expect.arrayContaining([expect.objectContaining({ paddingTop: mockInsets.top + 64 })])
    );
    // The body is padded 24, on the screen margin.
    expect(screen.getByTestId('welcome-scroll').props.contentContainerStyle).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ paddingHorizontal: 24, paddingBottom: 24 })
      ])
    );
    expect(screen.getByTestId('welcome-branded-icon', HIDDEN)).toHaveStyle({
      width: 100,
      height: 100
    });
    expect(screen.getByTestId('welcome-title')).toHaveStyle({
      marginTop: 32,
      fontSize: 34,
      fontWeight: '700',
      color: LIGHT_THEME.textPrimary
    });
    expect(screen.getByTestId('welcome-subtitle')).toHaveStyle({
      marginTop: 8,
      fontSize: 17,
      fontWeight: '400',
      color: LIGHT_THEME.textSecondary
    });
    expect(screen.getByTestId('welcome-drawing')).toHaveStyle({ marginTop: 40 });
    expect(screen.getByTestId('welcome-fanned-illustration', HIDDEN)).toHaveStyle({
      width: 280,
      height: 190
    });
  });

  it('scrolls its body without bouncing, and anchors the actions in the footer below it', () => {
    render(<WelcomeScreen />);
    const scroll = screen.UNSAFE_getByType(ScrollView);
    const footer = screen.getByTestId('welcome-footer');
    const root = screen.getByTestId('welcome-screen');

    // `welcome-screen` names the root view, which holds the scroll and the footer.
    expect(within(root).getByTestId('welcome-scroll')).toBeTruthy();
    expect(within(root).getByTestId('welcome-footer')).toBeTruthy();
    expect(scroll.props.testID).toBe('welcome-scroll');
    expect(scroll.props.alwaysBounceVertical).toBe(false);
    expect(within(scroll).getByTestId('welcome-title')).toBeTruthy();
    expect(within(scroll).queryByTestId('welcome-get-started')).toBeNull();
    expect(within(footer).getByTestId('welcome-get-started')).toBeTruthy();
    expect(within(footer).getByTestId('welcome-sign-in')).toBeTruthy();
  });

  it('draws Get Started as the large primary, and the sign-in link 48 tall in link without an underline', () => {
    render(<WelcomeScreen />);

    expect(screen.getByTestId('welcome-get-started-container')).toHaveStyle({
      minHeight: 52,
      backgroundColor: LIGHT_THEME.primary
    });
    // The link sits 16 below the primary.
    expect(screen.getByTestId('welcome-footer-actions')).toHaveStyle({ gap: 16 });
    expect(screen.getByTestId('welcome-sign-in')).toHaveStyle({ minHeight: 48 });
    const link = screen.getByText('I already have an account');
    expect(link).toHaveStyle({ color: LIGHT_THEME.link, fontSize: 15, fontWeight: '600' });
    expect(link).not.toHaveStyle({ textDecorationLine: 'underline' });
  });

  it('Get Started navigates to Mode Selection', () => {
    const pushSpy = useRouter().push as jest.Mock;
    render(<WelcomeScreen />);

    fireEvent.press(screen.getByTestId('welcome-get-started'));
    expect(pushSpy).toHaveBeenCalledWith('/onboarding/mode-selection');
  });

  it('Sign In link navigates to Sign In route', () => {
    const pushSpy = useRouter().push as jest.Mock;
    render(<WelcomeScreen />);

    fireEvent.press(screen.getByTestId('welcome-sign-in'));
    expect(pushSpy).toHaveBeenCalledWith('/sign-in');
  });

  it('redirects to home when onboarding is already completed', () => {
    const replaceSpy = useRouter().replace as jest.Mock;
    (isFirstLaunch as jest.Mock).mockReturnValue(false);

    render(<WelcomeScreen />);
    expect(replaceSpy).toHaveBeenCalledWith('/');
  });
});

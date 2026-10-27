import { fireEvent, render, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import { completeFirstLaunch, isFirstLaunch } from '@/core/settings/settings-repository';

import FeatureHighlightsScreen from '@/features/onboarding/screens/FeatureHighlightsScreen';
import ModeSelectionScreen from '@/features/onboarding/screens/ModeSelectionScreen';
import WelcomeScreen from '@/features/onboarding/screens/WelcomeScreen';

jest.mock('@/core/settings/settings-repository', () => ({
  isFirstLaunch: jest.fn(() => true),
  completeFirstLaunch: jest.fn()
}));

// A notched phone's insets, so each one the screens add is observed.
const mockInsets = { top: 59, right: 0, bottom: 34, left: 0 };

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockInsets
}));

jest.mock('@/shared/theme', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { LIGHT_THEME: theme } = require('@/shared/theme/colors');
  return { useTheme: () => ({ theme, isDark: false }) };
});

/**
 * A primary-action footer's padded region holding the actions: its root's second child, after the
 * rule, read as `PrimaryActionFooter.test.tsx` reads it.
 */
const footerActionsPadding = (testID: string) => {
  const region = screen.getByTestId(testID).children[1];
  if (typeof region === 'string' || region === undefined) {
    throw new Error(`no actions in ${testID}`);
  }
  return (StyleSheet.flatten(region.props.style) as { paddingBottom: number }).paddingBottom;
};

describe('Onboarding flow integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isFirstLaunch as jest.Mock).mockReturnValue(true);
  });

  it('Welcome -> Mode Selection via Get Started', () => {
    const pushSpy = useRouter().push as jest.Mock;
    render(<WelcomeScreen />);

    fireEvent.press(screen.getByTestId('welcome-get-started'));
    expect(pushSpy).toHaveBeenCalledWith('/onboarding/mode-selection');
  });

  it('Welcome -> Sign In via the existing-account link', () => {
    const pushSpy = useRouter().push as jest.Mock;
    render(<WelcomeScreen />);

    fireEvent.press(screen.getByTestId('welcome-sign-in'));
    expect(pushSpy).toHaveBeenCalledWith('/sign-in');
  });

  it('Mode Selection back -> Welcome', () => {
    const backSpy = useRouter().back as jest.Mock;
    render(<ModeSelectionScreen />);

    fireEvent.press(screen.getByTestId('mode-selection-back'));
    expect(backSpy).toHaveBeenCalledTimes(1);
  });

  it('Mode Selection local option -> Highlights', () => {
    const pushSpy = useRouter().push as jest.Mock;
    render(<ModeSelectionScreen />);

    fireEvent.press(screen.getByTestId('mode-option-local'));
    expect(pushSpy).toHaveBeenCalledWith('/onboarding/highlights');
  });

  it('Mode Selection cloud option -> Create Account', () => {
    const pushSpy = useRouter().push as jest.Mock;
    render(<ModeSelectionScreen />);

    fireEvent.press(screen.getByTestId('mode-option-cloud'));
    expect(pushSpy).toHaveBeenCalledWith('/create-account');
  });

  it("Highlights Next, Next, Let's go! -> complete onboarding and home", () => {
    const replaceSpy = useRouter().replace as jest.Mock;
    render(<FeatureHighlightsScreen />);

    fireEvent.press(screen.getByTestId('highlight-next-button'));
    fireEvent.press(screen.getByTestId('highlight-next-button'));
    fireEvent.press(screen.getByTestId('highlight-next-button'));

    expect(completeFirstLaunch).toHaveBeenCalledTimes(1);
    expect(replaceSpy).toHaveBeenCalledWith('/');
  });

  it('Highlights skip -> complete onboarding and home', () => {
    const replaceSpy = useRouter().replace as jest.Mock;
    render(<FeatureHighlightsScreen />);

    fireEvent.press(screen.getByTestId('highlights-skip'));
    expect(completeFirstLaunch).toHaveBeenCalledTimes(1);
    expect(replaceSpy).toHaveBeenCalledWith('/');
  });

  it.each([
    ['Welcome', WelcomeScreen],
    ['Mode Selection', ModeSelectionScreen],
    ['Highlights', FeatureHighlightsScreen]
  ])('%s replaces to home once onboarding is complete', (_name, Screen) => {
    const replaceSpy = useRouter().replace as jest.Mock;
    (isFirstLaunch as jest.Mock).mockReturnValue(false);

    render(<Screen />);
    expect(replaceSpy).toHaveBeenCalledWith('/');
    expect(completeFirstLaunch).not.toHaveBeenCalled();
  });

  it('keeps every screen clear of the notch and the home indicator', () => {
    const welcome = render(<WelcomeScreen />);
    expect(screen.getByTestId('welcome-scroll').props.contentContainerStyle).toEqual(
      expect.arrayContaining([expect.objectContaining({ paddingTop: mockInsets.top + 64 })])
    );
    expect(footerActionsPadding('welcome-footer')).toBe(24 + mockInsets.bottom);
    welcome.unmount();

    const modeSelection = render(<ModeSelectionScreen />);
    expect(screen.getByTestId('mode-selection-screen')).toHaveStyle({
      paddingTop: mockInsets.top
    });
    expect(screen.getByTestId('mode-selection-scroll').props.contentContainerStyle).toEqual(
      expect.arrayContaining([expect.objectContaining({ paddingBottom: 24 + mockInsets.bottom })])
    );
    modeSelection.unmount();

    render(<FeatureHighlightsScreen />);
    expect(screen.getByTestId('highlights-skip-row')).toHaveStyle({
      paddingTop: mockInsets.top + 8
    });
    expect(footerActionsPadding('highlights-footer')).toBe(24 + mockInsets.bottom);
  });
});

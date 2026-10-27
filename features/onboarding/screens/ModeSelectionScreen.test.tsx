import { act, fireEvent, render, screen, userEvent, within } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import CloudUpload from 'lucide-react-native/icons/cloud-upload';
import Smartphone from 'lucide-react-native/icons/smartphone';
import { AccessibilityInfo, Modal, ScrollView } from 'react-native';

import { isFirstLaunch } from '@/core/settings/settings-repository';

import { changeAppLanguage } from '@/shared/i18n';
import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import ModeSelectionScreen from './ModeSelectionScreen';

let mockTheme: typeof LIGHT_THEME | typeof DARK_THEME = LIGHT_THEME;
let mockIsDark = false;

const mockSelectLocalMode = jest.fn();
const mockSelectCloudMode = jest.fn();

jest.mock('../hooks/useModeSelection', () => ({
  useModeSelection: () => ({
    selectLocalMode: mockSelectLocalMode,
    selectCloudMode: mockSelectCloudMode
  })
}));

jest.mock('@/core/settings/settings-repository', () => ({
  isFirstLaunch: jest.fn(() => true)
}));

// A notched phone's insets, so each one the screen adds is observed.
const mockInsets = { top: 59, right: 0, bottom: 34, left: 0 };

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockInsets
}));

jest.mock('@/shared/theme', () => ({
  useTheme: () => ({ theme: mockTheme, isDark: mockIsDark })
}));

const PARAGRAPHS = [
  "Keep cards on this device stores your loyalty cards only on this phone. It's fast, private, and works offline.",
  'Sync across all devices creates a free account so your cards are backed up and available on any device you sign in to.',
  'You can switch anytime from Settings.'
];

/** The nearest drawn (host) view holding this element: its layout container. */
const hostParent = (testID: string) => {
  let node = screen.getByTestId(testID).parent;
  while (node && typeof node.type !== 'string') {
    node = node.parent;
  }
  if (!node) throw new Error(`no host view holds ${testID}`);
  return node;
};

const isSheetShown = () => screen.UNSAFE_getByType(Modal).props.visible;

const openSheet = () => fireEvent.press(screen.getByTestId('mode-selection-whats-difference'));

describe('ModeSelectionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isFirstLaunch as jest.Mock).mockReturnValue(true);
    mockTheme = LIGHT_THEME;
    mockIsDark = false;
  });

  it('renders both mode option cards and the recommended pill', () => {
    render(<ModeSelectionScreen />);

    expect(screen.getByTestId('mode-option-local')).toBeTruthy();
    expect(screen.getByTestId('mode-option-cloud')).toBeTruthy();
    expect(within(screen.getByTestId('mode-option-local')).getByText('Recommended')).toBeTruthy();
  });

  it('gives the local card the smartphone and the cloud card the cloud upload', () => {
    render(<ModeSelectionScreen />);

    expect(screen.UNSAFE_getByType(Smartphone).props.testID).toBe('mode-option-local-icon');
    expect(screen.UNSAFE_getByType(CloudUpload).props.testID).toBe('mode-option-cloud-icon');
  });

  it('lies on the ground: the light one in light, the black one in dark', () => {
    const { unmount } = render(<ModeSelectionScreen />);
    expect(screen.getByTestId('mode-selection-screen')).toHaveStyle({
      backgroundColor: LIGHT_THEME.background
    });
    unmount();

    mockTheme = DARK_THEME;
    mockIsDark = true;
    render(<ModeSelectionScreen />);
    expect(screen.getByTestId('mode-selection-screen')).toHaveStyle({
      backgroundColor: DARK_THEME.background
    });
  });

  it('draws the shared header, titled "Get Started", whose back goes back', () => {
    const backSpy = useRouter().back as jest.Mock;
    render(<ModeSelectionScreen />);

    expect(screen.getByTestId('mode-selection-header-title')).toHaveTextContent('Get Started');
    fireEvent.press(screen.getByTestId('mode-selection-back'));
    expect(backSpy).toHaveBeenCalledTimes(1);
  });

  it('adds the top inset above its header, which has none, and the bottom inset below the body', () => {
    render(<ModeSelectionScreen />);

    expect(screen.getByTestId('mode-selection-screen')).toHaveStyle({
      paddingTop: mockInsets.top
    });
    expect(screen.getByTestId('mode-selection-scroll').props.contentContainerStyle).toEqual(
      expect.arrayContaining([expect.objectContaining({ paddingBottom: 24 + mockInsets.bottom })])
    );
  });

  it('scrolls its body without bouncing, so both options stay reachable at the largest text sizes', () => {
    render(<ModeSelectionScreen />);
    const scroll = screen.UNSAFE_getByType(ScrollView);

    expect(scroll.props.testID).toBe('mode-selection-scroll');
    expect(scroll.props.alwaysBounceVertical).toBe(false);
    expect(within(scroll).getByTestId('mode-option-local')).toBeTruthy();
    expect(within(scroll).getByTestId('mode-option-cloud')).toBeTruthy();
    expect(within(scroll).getByTestId('mode-selection-whats-difference')).toBeTruthy();
  });

  it('sets the heading 24 below the header, and the cards 24 below the subtitle and 16 apart', () => {
    render(<ModeSelectionScreen />);

    // The body is padded 24, on the screen margin.
    expect(screen.getByTestId('mode-selection-scroll').props.contentContainerStyle).toEqual(
      expect.arrayContaining([expect.objectContaining({ paddingTop: 24, paddingHorizontal: 24 })])
    );
    const cards = hostParent('mode-option-local');
    expect(within(cards).getByTestId('mode-option-cloud')).toBeTruthy();
    expect(cards).toHaveStyle({ marginTop: 24, gap: 16 });
  });

  it('sets the heading, subtitle, footer and link as frame B does', () => {
    render(<ModeSelectionScreen />);

    expect(screen.getByRole('header', { name: 'How would you like\nto use the app?' })).toHaveStyle(
      {
        fontSize: 24,
        fontWeight: '700',
        color: LIGHT_THEME.textPrimary,
        textAlign: 'center'
      }
    );
    expect(screen.getByText('You can always change this later in Settings.')).toHaveStyle({
      marginTop: 8,
      fontSize: 15,
      fontWeight: '400',
      color: LIGHT_THEME.textSecondary
    });
    expect(
      screen.getByText(
        'Your data is always yours. Export or import your cards anytime from Settings.'
      )
    ).toHaveStyle({
      marginTop: 32,
      fontSize: 15,
      fontWeight: '400',
      color: LIGHT_THEME.textSecondary
    });
    expect(screen.getByTestId('mode-selection-whats-difference')).toHaveStyle({
      marginTop: 8,
      minHeight: 48
    });
    expect(screen.getByText("What's the difference?")).toHaveStyle({
      color: LIGHT_THEME.link,
      fontSize: 15,
      fontWeight: '600',
      textDecorationLine: 'underline'
    });
  });

  it('announces itself on mount', () => {
    render(<ModeSelectionScreen />);

    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      'Mode selection screen'
    );
  });

  it('tapping local card triggers local mode setup', () => {
    render(<ModeSelectionScreen />);

    fireEvent.press(screen.getByTestId('mode-option-local'));
    expect(mockSelectLocalMode).toHaveBeenCalled();
  });

  it('tapping cloud card navigates to sign-up flow', () => {
    render(<ModeSelectionScreen />);

    fireEvent.press(screen.getByTestId('mode-option-cloud'));
    expect(mockSelectCloudMode).toHaveBeenCalled();
  });

  it('redirects to home when onboarding is already completed', () => {
    const replaceSpy = useRouter().replace as jest.Mock;
    (isFirstLaunch as jest.Mock).mockReturnValue(false);

    render(<ModeSelectionScreen />);
    expect(replaceSpy).toHaveBeenCalledWith('/');
  });

  describe('the difference', () => {
    it('is closed until the link is pressed', () => {
      render(<ModeSelectionScreen />);

      expect(isSheetShown()).toBe(false);
    });

    it('opens the shared sheet: the title, the three paragraphs and Got it', () => {
      render(<ModeSelectionScreen />);
      openSheet();

      expect(isSheetShown()).toBe(true);
      const sheet = screen.getByTestId('info-tooltip-modal-content');
      expect(within(sheet).getByRole('header', { name: "What's the difference?" })).toBeTruthy();
      PARAGRAPHS.forEach((paragraph) => {
        expect(within(sheet).getByText(paragraph)).toHaveStyle({
          fontSize: 15,
          fontWeight: '400',
          color: LIGHT_THEME.textPrimary
        });
      });
      expect(within(sheet).getByTestId('info-tooltip-got-it-container')).toHaveStyle({
        minHeight: 52,
        backgroundColor: LIGHT_THEME.primary
      });
    });

    it('stays open when the grabber is pressed, which is decoration (decision 2)', async () => {
      render(<ModeSelectionScreen />);
      openSheet();

      await userEvent.press(
        screen.getByTestId('info-tooltip-modal-grabber', { includeHiddenElements: true })
      );

      expect(isSheetShown()).toBe(true);
    });

    it('sets the three paragraphs 16 apart', () => {
      render(<ModeSelectionScreen />);
      openSheet();

      expect(screen.getByTestId('info-tooltip-paragraphs')).toHaveStyle({ gap: 16 });
    });

    describe('announces as every sheet does (decision 4)', () => {
      afterEach(async () => {
        await act(async () => {
          await changeAppLanguage('en');
        });
      });

      it('names the sheet as storage options information when it opens and when it closes', () => {
        render(<ModeSelectionScreen />);

        openSheet();
        expect(AccessibilityInfo.announceForAccessibility).toHaveBeenLastCalledWith(
          'Storage options information opened'
        );

        fireEvent.press(screen.getByTestId('info-tooltip-got-it'));
        expect(AccessibilityInfo.announceForAccessibility).toHaveBeenLastCalledWith(
          'Storage options information closed'
        );
      });

      it('names it in Italian in the masculine singular, so the participle agrees', async () => {
        await act(async () => {
          await changeAppLanguage('it');
        });
        render(<ModeSelectionScreen />);

        openSheet();
        expect(AccessibilityInfo.announceForAccessibility).toHaveBeenLastCalledWith(
          "Pannello informativo sull'archiviazione aperto"
        );

        fireEvent.press(screen.getByTestId('info-tooltip-got-it'));
        expect(AccessibilityInfo.announceForAccessibility).toHaveBeenLastCalledWith(
          "Pannello informativo sull'archiviazione chiuso"
        );
      });
    });

    it.each([
      ['Got it', () => fireEvent.press(screen.getByTestId('info-tooltip-got-it'))],
      [
        'the scrim',
        // The scrim is touch-only, hidden from assistive technology.
        () =>
          fireEvent.press(
            screen.getByTestId('info-tooltip-modal-scrim', { includeHiddenElements: true })
          )
      ],
      [
        'the back',
        () =>
          act(() => {
            screen.UNSAFE_getByType(Modal).props.onRequestClose();
          })
      ]
    ])('closes on %s', (_name, close) => {
      render(<ModeSelectionScreen />);
      openSheet();

      close();

      expect(isSheetShown()).toBe(false);
    });
  });
});

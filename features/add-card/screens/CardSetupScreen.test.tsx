/**
 * CardSetupScreen Tests
 * Story 13.4: Restyle Add Card Flow (AC5, AC6, T4, T5)
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { AccessibilityInfo, StyleSheet } from 'react-native';

import { CardSetupScreen } from './CardSetupScreen';

// Override expo-router mock to add useLocalSearchParams
const mockUseLocalSearchParams = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: (...args: unknown[]) => mockUseLocalSearchParams(...args),
  useNavigation: () => ({
    addListener: jest.fn(() => jest.fn()),
    dispatch: jest.fn()
  }),
  useFocusEffect: jest.fn()
}));

// Mock theme
jest.mock('@/shared/theme', () => ({
  useTheme: () => ({
    theme: {
      background: '#FFFFFF',
      primary: '#1A73E8',
      textPrimary: '#1F1F24',
      textSecondary: '#66666B',
      textTertiary: '#8F8F94',
      surfaceElevated: '#F5F5F5',
      border: '#E5E5EB'
    },
    isDark: false
  }),
  CARD_COLORS: {
    blue: '#0C3C84',
    red: '#E42424',
    green: '#0C843C',
    orange: '#FCCC0C',
    grey: '#0C84CC'
  }
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: { children?: React.ReactNode }) =>
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('react').createElement(View, props, children)
  };
});

// Mock catalogue repository
jest.mock('@/core/catalogue/catalogue-repository', () => ({
  CatalogueRepository: {
    getInstance: () => ({
      getBrandById: jest.fn((id: string) =>
        id === 'esselunga'
          ? {
              id: 'esselunga',
              name: 'Esselunga',
              color: '#FF0000',
              logo: 'esselunga',
              aliases: []
            }
          : undefined
      )
    })
  }
}));

// Mock useAddCard
const mockAddCard = jest.fn().mockResolvedValue(undefined);
jest.mock('@/features/cards/hooks/useAddCard', () => ({
  useAddCard: () => ({
    addCard: mockAddCard,
    isLoading: false
  })
}));

// Mock brandLogos
jest.mock('@/features/cards/utils/brandLogos', () => ({
  getBrandLogo: jest.fn(() => undefined)
}));

// Mock luminance
jest.mock('@/shared/theme/luminance', () => ({
  getContrastForeground: jest.fn(() => '#FFFFFF')
}));

// Mock mapHexToCardColor
jest.mock('@/core/utils', () => ({
  mapHexToCardColor: jest.fn(() => 'red')
}));

describe('CardSetupScreen', () => {
  const announceSpy = jest
    .spyOn(AccessibilityInfo, 'announceForAccessibility')
    .mockImplementation(jest.fn());

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('catalogue mode', () => {
    beforeEach(() => {
      mockUseLocalSearchParams.mockReturnValue({
        mode: 'catalogue',
        brandId: 'esselunga',
        brandName: 'Esselunga',
        brandColor: '#FF0000',
        brandLogo: 'esselunga',
        barcode: '1234567890',
        barcodeFormat: 'EAN13'
      });
    });

    it('renders "Card Setup" header title', () => {
      render(<CardSetupScreen />);
      expect(screen.getByText('Card Setup')).toBeTruthy();
    });

    it('announces catalogue setup screen for accessibility on mount', () => {
      render(<CardSetupScreen />);
      expect(announceSpy).toHaveBeenCalledWith('Card setup screen');
    });

    it('renders brand name in header', () => {
      render(<CardSetupScreen />);
      expect(screen.getByText('Esselunga')).toBeTruthy();
    });

    it('renders card number field with pre-filled barcode', () => {
      render(<CardSetupScreen />);
      const input = screen.getByTestId('card-number-field');
      expect(input).toBeTruthy();
    });

    it('does NOT show store name field in catalogue mode', () => {
      render(<CardSetupScreen />);
      expect(screen.queryByTestId('store-name-field')).toBeNull();
    });

    it('does NOT show color picker in catalogue mode', () => {
      render(<CardSetupScreen />);
      expect(screen.queryByTestId('color-picker')).toBeNull();
    });

    it('does NOT show inline scan button in catalogue mode', () => {
      render(<CardSetupScreen />);
      expect(screen.queryByTestId('inline-scan-button')).toBeNull();
    });

    it('renders Done button', () => {
      render(<CardSetupScreen />);
      expect(screen.getByTestId('done-button')).toBeTruthy();
    });

    it('renders back button', () => {
      render(<CardSetupScreen />);
      expect(screen.getByTestId('setup-back-button')).toBeTruthy();
    });

    it('calls addCard with catalogue data on Done', async () => {
      render(<CardSetupScreen />);
      fireEvent.press(screen.getByTestId('done-button'));

      await waitFor(() => {
        expect(mockAddCard).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Esselunga',
            brandId: 'esselunga',
            barcodeFormat: 'EAN13'
          })
        );
      });
    });

    /**
     * Story 21.2a — the brand-less catalogue branch, which this story deliberately
     * changed and which had no test either before or after.
     *
     * It used to map a hard-coded `'#1A73E8'` placeholder (a copy of the retired
     * CARD_COLORS.blue) and therefore always yielded `'blue'`; it now names
     * DEFAULT_CARD_COLOR. The path is abnormal — catalogue mode with no resolvable
     * brand also produces a card with an empty name — but it is reachable, and a
     * behaviour change with no test is a behaviour change nobody will notice
     * reverting.
     */
    it('falls back to the default accent when catalogue mode has no resolvable brand', async () => {
      mockUseLocalSearchParams.mockReturnValue({
        mode: 'catalogue',
        barcode: '1234567890',
        barcodeFormat: 'EAN13'
      });

      render(<CardSetupScreen />);
      fireEvent.press(screen.getByTestId('done-button'));

      await waitFor(() => {
        expect(mockAddCard).toHaveBeenCalledWith(
          expect.objectContaining({ color: 'grey', brandId: undefined })
        );
      });
    });
  });

  describe('custom mode', () => {
    beforeEach(() => {
      mockUseLocalSearchParams.mockReturnValue({
        mode: 'custom'
      });
    });

    it('renders "New Card" header title', () => {
      render(<CardSetupScreen />);
      expect(screen.getByText('New Card')).toBeTruthy();
    });

    it('announces custom setup screen for accessibility on mount', () => {
      render(<CardSetupScreen />);
      expect(announceSpy).toHaveBeenCalledWith('New card screen');
    });

    it('renders store name field', () => {
      render(<CardSetupScreen />);
      expect(screen.getByTestId('store-name-field')).toBeTruthy();
    });

    it('renders card number field', () => {
      render(<CardSetupScreen />);
      expect(screen.getByTestId('card-number-field')).toBeTruthy();
    });

    it('renders color picker', () => {
      render(<CardSetupScreen />);
      expect(screen.getByTestId('color-picker')).toBeTruthy();
    });

    // Story 22.1 (AC7): TextField's labels went uppercase, so the one field label this screen
    // draws itself takes the same shared idiom — or the form would mix two casings.
    it('labels the colour picker in the shared uppercase form-label idiom', () => {
      render(<CardSetupScreen />);
      expect(StyleSheet.flatten(screen.getByText('Card Color').props.style).textTransform).toBe(
        'uppercase'
      );
    });

    // Story 21.6's hand-off: a card number's value is set in the mono face, in both flows. The
    // placeholder keeps the body face, as the form frames draw it (Story 22.6).
    it('sets the card number’s value in the mono-code face, and its placeholder in Inter', () => {
      render(<CardSetupScreen />);
      const fontFamily = () =>
        StyleSheet.flatten(screen.getByTestId('card-number-field').props.style).fontFamily;
      expect(fontFamily()).toBe('Inter');

      fireEvent.changeText(screen.getByTestId('card-number-field'), '2000012345678');
      expect(fontFamily()).toBe('JetBrains Mono');
    });

    it('renders inline scan button', () => {
      render(<CardSetupScreen />);
      expect(screen.getByTestId('inline-scan-button')).toBeTruthy();
    });

    it('navigates to scanner when inline scan button is pressed', () => {
      render(<CardSetupScreen />);
      fireEvent.press(screen.getByTestId('inline-scan-button'));
      expect(router.push).toHaveBeenCalledWith({
        pathname: '/add-card/scan',
        params: expect.objectContaining({ returnToSetup: 'true' })
      });
    });

    it('shows validation error when store name is empty on Done', async () => {
      render(<CardSetupScreen />);
      fireEvent.press(screen.getByTestId('done-button'));

      await waitFor(() => {
        expect(screen.getByText('Store name is required')).toBeTruthy();
      });
      expect(mockAddCard).not.toHaveBeenCalled();
    });

    it('calls addCard with custom data when valid', async () => {
      render(<CardSetupScreen />);

      const storeInput = screen.getByTestId('store-name-field');
      fireEvent.changeText(storeInput, 'My Gym');

      fireEvent.press(screen.getByTestId('done-button'));

      await waitFor(() => {
        expect(mockAddCard).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'My Gym',
            color: 'blue',
            barcodeFormat: 'CODE128'
          })
        );
      });
    });

    it('navigates back when back button is pressed', () => {
      render(<CardSetupScreen />);
      fireEvent.press(screen.getByTestId('setup-back-button'));
      expect(router.back).toHaveBeenCalled();
    });
  });
});

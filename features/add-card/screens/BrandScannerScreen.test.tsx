/**
 * BrandScannerScreen Tests
 * Story 13.4: Restyle Add Card Flow (AC3, AC4, T3)
 * Story 22.5: The picker's visibility pauses the overlay (frame D)
 */

import { render, screen, fireEvent } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AccessibilityInfo } from 'react-native';

import { BrandScannerScreen } from './BrandScannerScreen';
import { useImageScan } from '../hooks/useImageScan';

// Override expo-router mock to add useLocalSearchParams
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: jest.fn(() => ({
    brandId: 'esselunga',
    brandName: 'Esselunga',
    brandColor: '#FF0000',
    brandLogo: 'esselunga'
  })),
  useNavigation: () => ({
    addListener: jest.fn(() => jest.fn()),
    dispatch: jest.fn()
  }),
  useFocusEffect: jest.fn(),
  // The scanner draws its light status bar only while it is the focused screen.
  useIsFocused: () => true
}));

// The real light theme, so the overlay's ground states and the sheet render as the app does.
jest.mock('@/shared/theme', () => {
  const { LIGHT_THEME } = jest.requireActual('@/shared/theme/colors');
  return { useTheme: () => ({ theme: LIGHT_THEME, isDark: false }) };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 })
}));

// Mock expo-camera
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView'
}));

// Override reanimated mock to add Easing and withRepeat
jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockReact = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockRN = require('react-native');

  const AnimatedView = mockReact.forwardRef((props: Record<string, unknown>, ref: unknown) =>
    mockReact.createElement(mockRN.View, { ...props, ref })
  );

  return {
    __esModule: true,
    default: { View: AnimatedView, Text: mockRN.Text },
    useSharedValue: (initial: number) => ({ value: initial }),
    useAnimatedStyle: () => ({}),
    withTiming: (value: number) => value,
    withRepeat: (value: number) => value,
    withSpring: (value: number) => value,
    useReducedMotion: () => false,
    Easing: {
      inOut: () => 'easing-fn',
      out: () => 'easing-fn',
      ease: 'ease'
    }
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

// Mock useBarcodeScanner — a spy, so what the overlay asks of it (`enabled`) can be read.
const mockUseBarcodeScanner = jest.fn<unknown, [{ enabled?: boolean }]>(() => ({
  permission: { status: 'granted', granted: true, canAskAgain: true, expires: 'never' },
  hasScanned: false,
  error: null,
  handleBarcodeScanned: jest.fn(),
  requestCameraPermission: jest.fn(),
  reset: jest.fn(),
  isReady: true
}));
jest.mock('@/features/cards/hooks/useBarcodeScanner', () => ({
  useBarcodeScanner: (options: { enabled?: boolean }) => mockUseBarcodeScanner(options),
  ScanResult: {}
}));

// Mock useImageScan
const mockPickAndScan = jest.fn();
const mockDismissError = jest.fn();
const mockDismissMultiPicker = jest.fn();
const mockSelectCode = jest.fn();

const mockUseImageScan = {
  isProcessing: false,
  showError: false,
  errorReason: null,
  multiCodes: [],
  pickAndScan: mockPickAndScan,
  dismissError: mockDismissError,
  dismissMultiPicker: mockDismissMultiPicker,
  selectCode: mockSelectCode
};

jest.mock('../hooks/useImageScan', () => ({
  useImageScan: jest.fn(() => mockUseImageScan)
}));

// Mock luminance util for BrandPill — keeping the rest of the module, which the pill's dot reads
// through the tile's legibility rule.
jest.mock('@/shared/theme/luminance', () => ({
  ...jest.requireActual('@/shared/theme/luminance'),
  getContrastForeground: jest.fn(() => '#FFFFFF')
}));

describe('BrandScannerScreen', () => {
  const announceSpy = jest
    .spyOn(AccessibilityInfo, 'announceForAccessibility')
    .mockImplementation(jest.fn());

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the scanner overlay', () => {
    render(<BrandScannerScreen />);
    // ScannerOverlay renders with testID="brand-scanner-screen"
    expect(screen.getByTestId('brand-scanner-screen')).toBeTruthy();
  });

  it('renders brand pill with brand name', () => {
    render(<BrandScannerScreen />);
    expect(screen.getByText('Esselunga')).toBeTruthy();
  });

  it('renders manual entry option', () => {
    render(<BrandScannerScreen />);
    expect(screen.getByText('Enter card number manually')).toBeTruthy();
  });

  it('renders floating back button', () => {
    render(<BrandScannerScreen />);
    expect(screen.getByTestId('floating-back-button')).toBeTruthy();
  });

  it('renders instruction text', () => {
    render(<BrandScannerScreen />);
    expect(screen.getByText('Point camera at barcode')).toBeTruthy();
  });

  it('announces scanner screen for accessibility on mount', () => {
    render(<BrandScannerScreen />);
    expect(announceSpy).toHaveBeenCalledWith('Barcode scanner screen');
  });

  it('replaces setup route when returnToSetup is true', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      returnToSetup: 'true'
    });

    render(<BrandScannerScreen />);
    fireEvent.press(screen.getByTestId('manual-entry-row'));

    expect(router.replace).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/add-card/setup' })
    );
  });

  describe('image scan integration', () => {
    /**
     * The scan banner shares the bottom region with the action rows (Story 22.5), so it shows on
     * the render that raises the error, with no measurement to wait for. The error state holds for
     * every render of the test — a persistent implementation, restored after each test.
     */
    const showImageError = (overrides: Record<string, unknown>) => {
      (useImageScan as jest.Mock).mockImplementation(() => ({ ...mockUseImageScan, ...overrides }));
      render(<BrandScannerScreen />);
    };

    afterEach(() => {
      (useImageScan as jest.Mock).mockImplementation(() => mockUseImageScan);
    });

    beforeEach(() => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        brandId: 'esselunga',
        brandName: 'Esselunga',
        brandColor: '#FF0000',
        brandLogo: 'esselunga'
      });
    });

    it('renders scan-from-image-row (onImageScan provided via useImageScan)', () => {
      render(<BrandScannerScreen />);
      expect(screen.getByTestId('scan-from-image-row')).toBeTruthy();
    });

    it('calls pickAndScan when scan-from-image-row is pressed', () => {
      render(<BrandScannerScreen />);
      fireEvent.press(screen.getByTestId('scan-from-image-row'));
      expect(mockPickAndScan).toHaveBeenCalledTimes(1);
    });

    it('shows processing indicator when isProcessing is true', () => {
      (useImageScan as jest.Mock).mockReturnValueOnce({
        ...mockUseImageScan,
        isProcessing: true
      });
      render(<BrandScannerScreen />);
      expect(screen.getByTestId('image-processing-indicator')).toBeTruthy();
    });

    it('shows no-code-found banner when showError is true', () => {
      showImageError({ showError: true });
      expect(screen.getByTestId('no-code-found-banner')).toBeTruthy();
    });

    // Story 16.23 (AC2). This screen is the ONLY place the hook's `errorReason`
    // meets the banner, and the prop is optional — so breaking the hand-off
    // (wrong variable, dropped `?? undefined`, deleted prop) would compile
    // cleanly and leave the hook, overlay and banner unit tests all green while
    // the app silently reverted to one message for both failures. That is the
    // defect this story exists to remove, so it gets an assertion of its own.
    it('renders the scanFailed copy when the hook reports errorReason scanFailed', () => {
      showImageError({ showError: true, errorReason: 'scanFailed' });
      expect(screen.getByText('Something went wrong reading that image')).toBeTruthy();
    });

    it('renders the notFound copy when the hook reports errorReason notFound', () => {
      showImageError({ showError: true, errorReason: 'notFound' });
      expect(
        screen.getByText("We couldn't read a barcode in this image — try scanning the card itself")
      ).toBeTruthy();
    });

    it('calls dismissError when banner close is pressed', () => {
      showImageError({ showError: true });
      fireEvent.press(screen.getByTestId('banner-close'));
      expect(mockDismissError).toHaveBeenCalledTimes(1);
    });

    it('renders MultiCodePickerSheet when multiCodes is non-empty', () => {
      (useImageScan as jest.Mock).mockReturnValueOnce({
        ...mockUseImageScan,
        multiCodes: [
          { value: 'CODE-A', format: 'CODE128' },
          { value: 'CODE-B', format: 'EAN13' }
        ]
      });
      render(<BrandScannerScreen />);
      expect(screen.getByTestId('multi-code-picker-sheet')).toBeTruthy();
    });

    it('calls dismissMultiPicker when MultiCodePickerSheet cancel is pressed', () => {
      (useImageScan as jest.Mock).mockReturnValueOnce({
        ...mockUseImageScan,
        multiCodes: [{ value: 'CODE-A', format: 'CODE128' }]
      });
      render(<BrandScannerScreen />);
      fireEvent.press(screen.getByTestId('multi-code-cancel'));
      expect(mockDismissMultiPicker).toHaveBeenCalledTimes(1);
    });

    it('calls selectCode when a code row is pressed in the sheet', () => {
      (useImageScan as jest.Mock).mockReturnValueOnce({
        ...mockUseImageScan,
        multiCodes: [{ value: 'CODE-A', format: 'CODE128' }]
      });
      render(<BrandScannerScreen />);
      fireEvent.press(screen.getByTestId('code-row-0'));
      expect(mockSelectCode).toHaveBeenCalledWith({ value: 'CODE-A', format: 'CODE128' });
    });

    // The hook resolves a picked code through the screen's own scan handler, so a pick opens
    // setup with that code, exactly as a camera scan does.
    it('opens setup with the code a pick resolves to', () => {
      render(<BrandScannerScreen />);
      const { onCodeResolved } = (useImageScan as jest.Mock).mock.calls.at(-1)?.[0] as {
        onCodeResolved: (result: { barcode: string; format: string }) => void;
      };

      onCodeResolved({ barcode: '1234567890128', format: 'EAN13' });

      expect(router.push).toHaveBeenCalledWith({
        pathname: '/add-card/setup',
        params: {
          mode: 'catalogue',
          brandId: 'esselunga',
          brandName: 'Esselunga',
          brandColor: '#FF0000',
          brandLogo: 'esselunga',
          barcode: '1234567890128',
          barcodeFormat: 'EAN13'
        }
      });
    });
  });

  // Story 22.5 — frame D: one list drives both the sheet and the overlay's pause.
  describe('the picker pauses the scanner', () => {
    afterEach(() => {
      (useImageScan as jest.Mock).mockImplementation(() => mockUseImageScan);
    });

    beforeEach(() => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        brandId: 'esselunga',
        brandName: 'Esselunga',
        brandColor: '#FF0000',
        brandLogo: 'esselunga'
      });
    });

    it('hides the viewfinder and stops scanning while the picker holds codes', () => {
      (useImageScan as jest.Mock).mockImplementation(() => ({
        ...mockUseImageScan,
        multiCodes: [
          { value: 'CODE-A', format: 'CODE128' },
          { value: 'CODE-B', format: 'EAN13' }
        ]
      }));
      render(<BrandScannerScreen />);

      expect(screen.getByTestId('multi-code-picker-sheet')).toBeTruthy();
      expect(screen.queryByTestId('viewfinder')).toBeNull();
      expect(screen.queryByText('Point camera at barcode')).toBeNull();
      expect(mockUseBarcodeScanner).toHaveBeenLastCalledWith(
        expect.objectContaining({ enabled: false })
      );
      // The back disc and the pill stay.
      expect(screen.getByTestId('floating-back-button')).toBeTruthy();
      expect(screen.getByTestId('brand-pill')).toBeTruthy();
    });

    it('scans, with the viewfinder up, while the picker holds none', () => {
      render(<BrandScannerScreen />);

      expect(screen.getByTestId('viewfinder')).toBeTruthy();
      expect(mockUseBarcodeScanner).toHaveBeenLastCalledWith(
        expect.objectContaining({ enabled: true })
      );
    });
  });

  // A custom card enters with no brand, and so with no pill.
  it('draws no brand pill for a custom card', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ mode: 'custom' });
    render(<BrandScannerScreen />);

    expect(screen.queryByTestId('brand-pill')).toBeNull();
    expect(screen.getByTestId('viewfinder')).toBeTruthy();
  });
});

/**
 * ScannerOverlay Component Tests
 * Story 13.4: Restyle Add Card Flow (AC3)
 * Story 22.5: Capture frames B and C, the pending and camera-error states, Reduce Motion, the
 *             status bar, the picker's pause and the bottom region
 */

import { act, render, screen, fireEvent, within } from '@testing-library/react-native';
import { StatusBar } from 'expo-status-bar';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import ImageIcon from 'lucide-react-native/icons/image';
import KeyboardIcon from 'lucide-react-native/icons/keyboard';
import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  PixelRatio,
  Platform,
  ScrollView,
  StyleSheet,
  Text
} from 'react-native';

import { BarcodeFormat } from '@/core/schemas';
import { logger } from '@/core/utils';

import { Button } from '@/shared/components/ui/Button';
import { PrimaryActionFooter } from '@/shared/components/ui/PrimaryActionFooter';
import { changeAppLanguage } from '@/shared/i18n';
import { TOUCH_TARGET } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import { BEAM_REST_RATIO, ScannerOverlay, getViewfinderSize } from './ScannerOverlay';

jest.mock('@/core/utils', () => {
  const actual = jest.requireActual('@/core/utils');
  return { ...actual, logger: { ...actual.logger, notify: jest.fn() } };
});

const mockNotify = logger.notify as jest.Mock;
const mockCameraView = jest.fn();

let mockIsDark = false;

// The real token values, so the camera's fixed roles are seen NOT to follow the scheme, and the
// ground states are seen to follow it.
jest.mock('@/shared/theme', () => {
  const { DARK_THEME, LIGHT_THEME } = jest.requireActual('@/shared/theme/colors');
  return {
    useTheme: () => ({ theme: mockIsDark ? DARK_THEME : LIGHT_THEME, isDark: mockIsDark })
  };
});

// The frames' real insets on a 393 × 852 phone: 59pt over the status bar, 34pt over the home
// indicator.
const INSETS = { top: 59, bottom: 34, left: 0, right: 0 };
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => INSETS
}));

// Whether the scanner is the focused screen: false once setup is pushed over it.
let mockIsFocused = true;
jest.mock('expo-router', () => ({
  useIsFocused: () => mockIsFocused
}));

// Mock expo-camera
jest.mock('expo-camera', () => ({
  CameraView: (props: unknown) => {
    mockCameraView(props);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require('react');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'camera-view' });
  }
}));

// The system's Reduce Motion, as Reanimated reports it.
let mockReducedMotion = false;

// What `useAnimatedStyle` hands back: a marker, so a test can see the animated style reach the beam.
const mockAnimatedStyle = { animatedStyleMarker: true };

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
    useAnimatedStyle: () => mockAnimatedStyle,
    // Spies, so the scan line's sweep can be read (Story 16.31, via 22.1). Created HERE, because
    // this factory runs when ScannerOverlay is imported — before any module-level const.
    withTiming: jest.fn((value: number) => value),
    withRepeat: jest.fn((value: number) => value),
    withSpring: (value: number) => value,
    useReducedMotion: () => mockReducedMotion,
    Easing: {
      inOut: () => 'easing-fn',
      ease: 'ease'
    }
  };
});

// Mock useBarcodeScanner
const mockUseBarcodeScanner = jest.fn();
jest.mock('@/features/cards/hooks/useBarcodeScanner', () => ({
  useBarcodeScanner: (opts: unknown) => mockUseBarcodeScanner(opts),
  ScanResult: {}
}));

/** `useCameraPermissions`' real response shapes (expo-modules-core `PermissionResponse`). */
const PERMISSION = {
  granted: { status: 'granted', granted: true, canAskAgain: true, expires: 'never' },
  undetermined: { status: 'undetermined', granted: false, canAskAgain: true, expires: 'never' },
  denied: { status: 'denied', granted: false, canAskAgain: false, expires: 'never' }
} as const;

type Permission = (typeof PERMISSION)[keyof typeof PERMISSION] | null;

const mockRequestCameraPermission = jest.fn();
const mockReset = jest.fn();

/** What the scanner hook reports: its permission, and an error from a request that failed. */
const givenScanner = (permission: Permission, error: string | null = null) => {
  mockUseBarcodeScanner.mockReturnValue({
    permission,
    hasScanned: false,
    error,
    handleBarcodeScanned: jest.fn(),
    requestCameraPermission: mockRequestCameraPermission,
    reset: mockReset,
    isReady: permission?.granted === true
  });
};

const failToMount = (message = 'Failed to start camera preview') => {
  const cameraProps = mockCameraView.mock.calls.at(-1)?.[0] as {
    onMountError?: (event: { message: string }) => void;
  };
  act(() => {
    cameraProps.onMountError?.({ message });
  });
};

const styleOf = (testID: string, options?: { includeHiddenElements: boolean }) =>
  StyleSheet.flatten(screen.getByTestId(testID, options).props.style) as Record<string, unknown>;

const glyph = (testID: string) => screen.getByTestId(testID, { includeHiddenElements: true });

/** The props a `Button` was rendered with, found by its testID. */
const buttonProps = (testID: string) =>
  screen.UNSAFE_getAllByType(Button).find((button) => button.props.testID === testID)?.props;

// Frame C's layout, structurally: the message centred in its own scroll view, and the actions
// anchored beneath it in the shared footer, never scrolling with the message.
const expectCentredMessageOverAnchoredFooter = () => {
  const message = screen.UNSAFE_getByType(ScrollView);
  expect(StyleSheet.flatten(message.props.contentContainerStyle)).toMatchObject({
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center'
  });
  expect(screen.UNSAFE_getByType(PrimaryActionFooter).props.testID).toBe('camera-message-footer');
  expect(screen.getByTestId('camera-message-footer')).toBeTruthy();
  expect(within(message).queryByTestId('camera-message-footer')).toBeNull();
};

const CREAM = '#F0F0E8';
const WHITE = '#FFFFFF';
const BEAM = '#FCCC0C';
const GROUND = '#000000';
const FEED_SCRIM = 'rgba(0, 0, 0, 0.4)';
const SHADOW = {
  textShadowColor: 'rgba(0, 0, 0, 0.75)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3
};

type Scheme = 'light' | 'dark';

const SCHEME: Record<
  Scheme,
  { background: string; textPrimary: string; textSecondary: string; error: string }
> = {
  light: {
    background: '#F0F0E8',
    textPrimary: '#181824',
    textSecondary: '#55555F',
    error: '#C41E1E'
  },
  dark: {
    background: '#000000',
    textPrimary: '#F0F0E8',
    textSecondary: '#B5B5AB',
    error: '#FF453A'
  }
};

describe('ScannerOverlay', () => {
  const defaultProps = {
    onScan: jest.fn(),
    onManualEntry: jest.fn(),
    onBack: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCameraView.mockClear();
  });

  afterEach(() => {
    mockIsDark = false;
    mockIsFocused = true;
    mockReducedMotion = false;
  });

  describe('camera ready state', () => {
    beforeEach(() => {
      givenScanner(PERMISSION.granted);
    });

    it('renders overlay container', () => {
      render(<ScannerOverlay {...defaultProps} />);
      expect(screen.getByTestId('scanner-overlay')).toBeTruthy();
    });

    it('mounts the camera', () => {
      render(<ScannerOverlay {...defaultProps} />);
      expect(screen.getByTestId('camera-view')).toBeTruthy();
    });

    it('renders instruction text', () => {
      render(<ScannerOverlay {...defaultProps} />);
      expect(screen.getByText('Point camera at barcode')).toBeTruthy();
    });

    it('renders floating back button', () => {
      render(<ScannerOverlay {...defaultProps} />);
      expect(screen.getByTestId('floating-back-button')).toBeTruthy();
    });

    it('renders manual entry row', () => {
      render(<ScannerOverlay {...defaultProps} />);
      expect(screen.getByTestId('manual-entry-row')).toBeTruthy();
      expect(screen.getByText('Enter card number manually')).toBeTruthy();
    });

    it('scans while nothing is over it', () => {
      render(<ScannerOverlay {...defaultProps} />);
      expect(mockUseBarcodeScanner).toHaveBeenLastCalledWith(
        expect.objectContaining({ enabled: true })
      );
    });

    it('falls back to error UI when the camera preview fails to mount', () => {
      const onImageScan = jest.fn();
      render(<ScannerOverlay {...defaultProps} onImageScan={onImageScan} />);

      failToMount();

      expect(screen.getByText('Camera Error')).toBeTruthy();
      // The localised message, never the native one: that stays with the classifier.
      expect(screen.getByText('Unable to start the camera preview.')).toBeTruthy();
      expect(screen.queryByText('Failed to start camera preview')).toBeNull();
      expect(screen.getByTestId('scan-from-image-fallback-button')).toBeTruthy();
      expect(screen.queryByTestId('camera-view')).toBeNull();
    });

    // Story 16.23 follow-up: a camera that will not start is a total scan failure,
    // and it left no production trace at all — only an on-screen message.
    it('notifies when the camera preview fails to mount', () => {
      render(<ScannerOverlay {...defaultProps} />);

      failToMount();

      expect(mockNotify).toHaveBeenCalledWith(
        'Camera preview failed to mount',
        expect.objectContaining({
          tags: expect.objectContaining({ surface: 'camera', outcome: 'mount-error' })
        })
      );
    });

    it.each([
      ['Camera component could not be rendered - is there any other instance running?', 'in-use'],
      ['Camera permissions not granted - component could not be rendered.', 'permission'],
      ['Camera session was reset', 'session-reset'],
      ['Camera could not be started - The operation could not be completed', 'start-failed'],
      ['Something upstream changed', 'other']
    ])('classifies the mount error %# as reason "%s"', (message, expectedReason) => {
      render(<ScannerOverlay {...defaultProps} />);

      failToMount(message);

      expect(mockNotify.mock.calls[0]?.[1]?.tags?.reason).toBe(expectedReason);
    });

    it('never forwards the raw mount-error message to telemetry', () => {
      // `CameraMountError` carries only a free-text `message`, and one of
      // expo-camera's emitters interpolates an AVError description into it. Safe
      // today, but tag values are the one field the PII scrubber never touches, so
      // the message is classified rather than forwarded. This is the lock on that.
      render(<ScannerOverlay {...defaultProps} />);

      failToMount('Camera could not be started - /var/mobile/secret-detail.txt');

      const serialised = JSON.stringify(mockNotify.mock.calls);
      expect(serialised).not.toContain('/var/mobile');
      expect(serialised).not.toContain('secret-detail');
      // The classification still landed, so this is not passing by emitting nothing.
      expect(mockNotify.mock.calls[0]?.[1]?.tags?.reason).toBe('start-failed');
    });

    it('records the message length so an unknown reason is not a black hole', () => {
      // The two sibling classifiers keep `nativeCode` for their `other` bucket;
      // this has no code to keep, so a single integer is the most that can be
      // retained without reintroducing the free text. It still separates two
      // different unknown causes, and a recurring one from a one-off.
      render(<ScannerOverlay {...defaultProps} />);

      failToMount('Some upstream wording we do not know');

      expect(mockNotify.mock.calls[0]?.[1]?.tags?.reason).toBe('other');
      expect(mockNotify.mock.calls[0]?.[1]?.context?.[0]).toEqual({
        messageLength: 'Some upstream wording we do not know'.length
      });
    });

    it('notifies only once when the camera reports repeated mount errors', () => {
      render(<ScannerOverlay {...defaultProps} />);

      const cameraProps = mockCameraView.mock.calls.at(-1)?.[0] as {
        onMountError?: (event: { message: string }) => void;
      };

      act(() => {
        cameraProps.onMountError?.({ message: 'Failed to start camera preview' });
        cameraProps.onMountError?.({ message: 'Failed to start camera preview' });
      });

      expect(mockNotify).toHaveBeenCalledTimes(1);
    });

    it('does not notify when the camera mounts successfully', () => {
      render(<ScannerOverlay {...defaultProps} />);
      expect(mockNotify).not.toHaveBeenCalled();
    });

    it('uses image scan from the fallback camera error UI', () => {
      const onImageScan = jest.fn();
      render(<ScannerOverlay {...defaultProps} onImageScan={onImageScan} />);

      failToMount();

      fireEvent.press(screen.getByTestId('scan-from-image-fallback-button'));
      expect(onImageScan).toHaveBeenCalledTimes(1);
    });

    it('calls onBack when floating back button is pressed', () => {
      render(<ScannerOverlay {...defaultProps} />);
      fireEvent.press(screen.getByTestId('floating-back-button'));
      expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
    });

    it('calls onManualEntry when manual entry row is pressed', () => {
      render(<ScannerOverlay {...defaultProps} />);
      fireEvent.press(screen.getByTestId('manual-entry-row'));
      expect(defaultProps.onManualEntry).toHaveBeenCalledTimes(1);
    });

    it('renders brand pill when provided', () => {
      const pill = <Text testID="test-pill">Brand</Text>;

      render(<ScannerOverlay {...defaultProps} brandPill={pill} />);
      expect(screen.getByTestId('test-pill')).toBeTruthy();
    });

    describe('image scan row', () => {
      it('does not render scan-from-image-row when onImageScan is not provided', () => {
        render(<ScannerOverlay {...defaultProps} />);
        expect(screen.queryByTestId('scan-from-image-row')).toBeNull();
      });

      it('renders scan-from-image-row when onImageScan is provided', () => {
        render(<ScannerOverlay {...defaultProps} onImageScan={jest.fn()} />);
        expect(screen.getByTestId('scan-from-image-row')).toBeTruthy();
        expect(screen.getByText('Scan from image')).toBeTruthy();
      });

      // The shipped accessibility label survives the redesign.
      it('names the scan-from-image row as it shipped', () => {
        render(<ScannerOverlay {...defaultProps} onImageScan={jest.fn()} />);
        expect(screen.getByLabelText('Scan a barcode from a photo or screenshot')).toBe(
          screen.getByTestId('scan-from-image-row')
        );
      });

      it('calls onImageScan when scan-from-image-row is pressed', () => {
        const onImageScan = jest.fn();
        render(<ScannerOverlay {...defaultProps} onImageScan={onImageScan} />);
        fireEvent.press(screen.getByTestId('scan-from-image-row'));
        expect(onImageScan).toHaveBeenCalledTimes(1);
      });
    });

    describe('processing indicator', () => {
      it('does not render processing indicator by default', () => {
        render(<ScannerOverlay {...defaultProps} />);
        expect(screen.queryByTestId('image-processing-indicator')).toBeNull();
      });

      it('renders processing indicator when isProcessingImage is true', () => {
        render(<ScannerOverlay {...defaultProps} isProcessingImage />);
        expect(screen.getByTestId('image-processing-indicator')).toBeTruthy();
        expect(screen.getByText('Scanning image…')).toBeTruthy();
      });

      // Text set straight on the feed: cream, semibold, with the one shadow.
      it('draws a cream spinner over "Scanning image…" in cream with the feed shadow', () => {
        render(<ScannerOverlay {...defaultProps} isProcessingImage />);

        expect(screen.UNSAFE_getByType(ActivityIndicator).props.color).toBe(CREAM);
        expect(StyleSheet.flatten(screen.getByText('Scanning image…').props.style)).toMatchObject({
          ...TYPOGRAPHY.bodyMdStrong,
          ...SHADOW,
          color: CREAM
        });
      });
    });

    describe('imageError / NoCodeFoundBanner', () => {
      it('does not render banner when imageError is false', () => {
        render(<ScannerOverlay {...defaultProps} onImageErrorDismiss={jest.fn()} />);
        expect(screen.queryByTestId('no-code-found-banner')).toBeNull();
      });

      it('renders NoCodeFoundBanner when imageError is true and onImageErrorDismiss provided', () => {
        render(<ScannerOverlay {...defaultProps} imageError onImageErrorDismiss={jest.fn()} />);
        expect(screen.getByTestId('no-code-found-banner')).toBeTruthy();
      });

      it('calls onImageErrorDismiss when banner close is pressed', () => {
        const onImageErrorDismiss = jest.fn();
        render(
          <ScannerOverlay {...defaultProps} imageError onImageErrorDismiss={onImageErrorDismiss} />
        );
        fireEvent.press(screen.getByTestId('banner-close'));
        expect(onImageErrorDismiss).toHaveBeenCalledTimes(1);
      });

      it('calls onImageErrorRetry when banner retry is pressed', () => {
        const onImageErrorRetry = jest.fn();
        render(
          <ScannerOverlay
            {...defaultProps}
            imageError
            onImageErrorDismiss={jest.fn()}
            onImageErrorRetry={onImageErrorRetry}
          />
        );
        fireEvent.press(screen.getByTestId('banner-retry-image'));
        expect(onImageErrorRetry).toHaveBeenCalledTimes(1);
      });

      it('calls onImageErrorManualEntry when banner manual entry is pressed', () => {
        const onImageErrorManualEntry = jest.fn();
        render(
          <ScannerOverlay
            {...defaultProps}
            imageError
            onImageErrorDismiss={jest.fn()}
            onImageErrorManualEntry={onImageErrorManualEntry}
          />
        );
        fireEvent.press(screen.getByTestId('banner-manual-entry'));
        expect(onImageErrorManualEntry).toHaveBeenCalledTimes(1);
      });

      // Story 16.23 (AC2): the overlay is the seam that carries the reason from
      // useImageScan to the banner, so a broken hand-off would silently restore
      // the old one-message-for-everything behaviour.
      it('forwards imageErrorReason to the banner', () => {
        render(
          <ScannerOverlay
            {...defaultProps}
            imageError
            imageErrorReason="scanFailed"
            onImageErrorDismiss={jest.fn()}
          />
        );
        expect(screen.getByText('Something went wrong reading that image')).toBeTruthy();
      });

      it("falls back to the banner's notFound copy when no reason is given", () => {
        render(<ScannerOverlay {...defaultProps} imageError onImageErrorDismiss={jest.fn()} />);
        expect(
          screen.getByText(
            "We couldn't read a barcode in this image — try scanning the card itself"
          )
        ).toBeTruthy();
      });

      // Frame E: the camera never stopped, so the viewfinder and the beam stay up.
      it('keeps the camera, the viewfinder and the beam while the banner is up', () => {
        render(<ScannerOverlay {...defaultProps} imageError onImageErrorDismiss={jest.fn()} />);

        expect(screen.getByTestId('camera-view')).toBeTruthy();
        expect(screen.getByTestId('viewfinder')).toBeTruthy();
        expect(screen.getByTestId('scan-beam')).toBeTruthy();
      });
    });
  });

  // Story 16.31, absorbed by 22.1 — the viewfinder is shaped to the code it expects. One scalar
  // drove both sides, so the brackets were always a ~275pt square: right for QR, wrong for the
  // linear symbologies that are most of the catalogue.
  describe('viewfinder geometry (16.31)', () => {
    const LINEAR: BarcodeFormat[] = ['EAN13', 'EAN8', 'CODE128', 'CODE39', 'UPCA'];

    it.each(LINEAR)('is a wide rectangle for %s, at the frame proportions', (format) => {
      const { width, height } = getViewfinderSize(393, format);
      expect(width).toBeGreaterThan(height);
      // The capture frame draws it 300 x 120 at 393pt; the code derives it from the width.
      expect({ width, height }).toEqual({ width: 300, height: 120 });
    });

    it('is a square for QR', () => {
      const { width, height } = getViewfinderSize(393, 'QR');
      expect(width).toBe(height);
    });

    // The custom-card path enters with no brand, so no format: a real case, not a defensive one.
    it('falls back to the wide rectangle when no format is expected', () => {
      const { width, height } = getViewfinderSize(393, undefined);
      expect(width).toBeGreaterThan(height);
    });

    it('scales with the screen rather than copying the frame constant', () => {
      expect(getViewfinderSize(360, 'EAN13').width).toBeLessThan(300);
      expect(getViewfinderSize(430, 'EAN13').width).toBeGreaterThan(300);
    });

    describe('in the overlay', () => {
      beforeEach(() => {
        givenScanner(PERMISSION.granted);
      });

      const { width: windowWidth } = Dimensions.get('window');
      const box = () => StyleSheet.flatten(screen.getByTestId('viewfinder').props.style);

      it('draws the brackets around the rectangle the expected format needs', () => {
        render(<ScannerOverlay {...defaultProps} expectedFormat="EAN13" />);
        expect(box()).toMatchObject(getViewfinderSize(windowWidth, 'EAN13'));
      });

      it('draws a square for an expected QR code', () => {
        render(<ScannerOverlay {...defaultProps} expectedFormat="QR" />);
        const { width, height } = box();
        expect(width).toBe(height);
      });

      it('sweeps the scan line over the frame HEIGHT, not a stale square side', () => {
        const { withTiming: mockWithTiming } = jest.requireMock('react-native-reanimated');
        render(<ScannerOverlay {...defaultProps} expectedFormat="EAN13" />);
        const { height } = getViewfinderSize(windowWidth, 'EAN13');
        expect(mockWithTiming).toHaveBeenCalledWith(height - 4, expect.anything());
      });

      it('keeps the sweep: 2 s each way, repeating forever and reversing', () => {
        const { withTiming: mockWithTiming, withRepeat: mockWithRepeat } =
          jest.requireMock('react-native-reanimated');
        render(<ScannerOverlay {...defaultProps} expectedFormat="EAN13" />);

        expect(mockWithTiming).toHaveBeenCalledWith(
          expect.any(Number),
          expect.objectContaining({ duration: 2000 })
        );
        expect(mockWithRepeat).toHaveBeenCalledWith(expect.anything(), -1, true);
      });

      // With motion allowed the beam moves: it carries the animated style, never the still
      // resting transform that Reduce Motion gives it.
      it('drives the beam with the animated style, not the resting transform', () => {
        render(<ScannerOverlay {...defaultProps} expectedFormat="EAN13" />);
        const beam = styleOf('scan-beam');

        expect(beam.animatedStyleMarker).toBe(true);
        expect(beam.transform).toBeUndefined();
      });

      it('keeps the brackets at 32 / 4 / 12 — the rectangle changes, not the mark', () => {
        render(<ScannerOverlay {...defaultProps} expectedFormat="EAN13" />);
        expect(styleOf('viewfinder-corner-tl')).toMatchObject({
          width: 32,
          height: 32,
          borderTopWidth: 4,
          borderLeftWidth: 4,
          borderTopLeftRadius: 12
        });
      });

      // Corners only, in white: a mark, not text.
      it('draws the brackets in white', () => {
        render(<ScannerOverlay {...defaultProps} expectedFormat="EAN13" />);
        expect(styleOf('viewfinder-corner-tl').borderColor).toBe(WHITE);
      });

      // The one place on the screen beam is a line: 2pt, at exactly #FCCC0C.
      it('draws the beam as a 2pt line of exactly #FCCC0C inside the box', () => {
        render(<ScannerOverlay {...defaultProps} expectedFormat="EAN13" />);
        expect(styleOf('scan-beam')).toMatchObject({
          position: 'absolute',
          left: 8,
          right: 8,
          height: 2,
          backgroundColor: BEAM
        });
      });

      // The box is centred on the whole screen: the instruction is absolute, so it no longer
      // shares the box's flex column and pushes it up by half its own height.
      it('centres the box on the screen, with the instruction out of its flow', () => {
        render(<ScannerOverlay {...defaultProps} expectedFormat="EAN13" />);

        expect(styleOf('viewfinder-layer')).toMatchObject({
          position: 'absolute',
          top: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center'
        });
        expect(styleOf('scanner-instruction').position).toBe('absolute');
      });

      // Its top 64pt below the box's bottom edge: from the screen's middle, half the box and 64.
      it.each<BarcodeFormat>(['EAN13', 'QR'])(
        'sets the instruction 64pt below the %s box',
        (format) => {
          render(<ScannerOverlay {...defaultProps} expectedFormat={format} />);
          const { height } = getViewfinderSize(windowWidth, format);

          expect(styleOf('scanner-instruction')).toMatchObject({
            top: '50%',
            marginTop: height / 2 + 64,
            textAlign: 'center'
          });
        }
      );

      it('takes no touches over the feed', () => {
        render(<ScannerOverlay {...defaultProps} expectedFormat="EAN13" />);
        expect(screen.getByTestId('viewfinder-layer').props.pointerEvents).toBe('none');
      });
    });

    // Story 22.5: Reanimated's `useReducedMotion`, read once at start-up.
    describe('under Reduce Motion', () => {
      beforeEach(() => {
        givenScanner(PERMISSION.granted);
        mockReducedMotion = true;
      });

      const { width: windowWidth } = Dimensions.get('window');

      it('starts no sweep', () => {
        const { withTiming: mockWithTiming, withRepeat: mockWithRepeat } =
          jest.requireMock('react-native-reanimated');
        render(<ScannerOverlay {...defaultProps} expectedFormat="EAN13" />);

        expect(mockWithRepeat).not.toHaveBeenCalled();
        expect(mockWithTiming).not.toHaveBeenCalled();
      });

      it.each<BarcodeFormat>(['EAN13', 'QR'])(
        'stands the beam still at 46/120 of the %s box’s height',
        (format) => {
          render(<ScannerOverlay {...defaultProps} expectedFormat={format} />);
          const { height } = getViewfinderSize(windowWidth, format);

          const transform = styleOf('scan-beam').transform as [{ translateY: number }];

          expect(transform).toHaveLength(1);
          expect(transform[0].translateY).toBeCloseTo((height * 46) / 120, 10);
        }
      );

      it('rests the wide box’s beam exactly where frame B draws it, 46pt down', () => {
        expect(getViewfinderSize(393, 'EAN13').height * BEAM_REST_RATIO).toBe(46);
      });
    });
  });

  // Story 16.30 + AC9, absorbed by 22.1 — and Story 22.5's bottom region (ifero, 2026-10-13). The
  // banner sat at a hardcoded `bottom: 96` while the action stack below it painted over both of its
  // links; 22.1 then derived its offset from the stack's measured height. It now shares one
  // container with the rows, so it sits 16pt above them by construction, and the container grows
  // with the text — scrolling once it reaches the pill.
  describe('the bottom region: the scan banner and the action rows (16.30, AC9)', () => {
    beforeEach(() => {
      givenScanner(PERMISSION.granted);
    });

    const withBanner = () =>
      render(
        <ScannerOverlay
          {...defaultProps}
          onImageScan={jest.fn()}
          imageError
          onImageErrorDismiss={jest.fn()}
        />
      );

    const pill = <Text testID="test-pill">Brand</Text>;
    const PILL_TOP = INSETS.top + 8 + 40 + 16;

    const layOutPill = (height: number) =>
      fireEvent(screen.getByTestId('brand-pill-container'), 'layout', {
        nativeEvent: { layout: { x: 0, y: PILL_TOP, width: 393, height } }
      });

    it('lays the region out in flow, anchored to the bottom — never absolutely (AC9)', () => {
      render(<ScannerOverlay {...defaultProps} />);
      expect(styleOf('scanner-bottom-region').position).not.toBe('absolute');
      expect(styleOf('scanner-overlay').justifyContent).toBe('flex-end');
    });

    // 16.30's acceptance criterion 4, as a structure rather than an offset.
    it('holds the banner and the rows in one container, the banner first, 16pt apart (16.30)', () => {
      withBanner();
      const region = screen.getByTestId('scanner-bottom-region');

      expect(
        within(region)
          .getAllByTestId(/^(no-code-found-banner-anchor|scanner-bottom-actions)$/)
          .map((element) => element.props.testID)
      ).toEqual(['no-code-found-banner-anchor', 'scanner-bottom-actions']);
      expect(StyleSheet.flatten(region.props.contentContainerStyle)).toMatchObject({ gap: 16 });
    });

    it('places the banner by its container, never by an offset', () => {
      withBanner();
      // The wrapper carries no style of its own; flattened, that is no style at all.
      const anchor = styleOf('no-code-found-banner-anchor') ?? {};

      expect(anchor.position).toBeUndefined();
      expect(anchor.bottom).toBeUndefined();
    });

    // 16.30 hid the banner until the stack had measured; there is nothing to wait for now.
    it('shows the banner at once, with no measurement to wait for', () => {
      withBanner();
      expect(screen.getByTestId('no-code-found-banner')).toBeTruthy();
    });

    it('holds the rows alone while there is no banner', () => {
      render(<ScannerOverlay {...defaultProps} onImageScan={jest.fn()} />);
      const region = within(screen.getByTestId('scanner-bottom-region'));

      expect(region.queryByTestId('no-code-found-banner-anchor')).toBeNull();
      expect(region.getByTestId('scanner-bottom-actions')).toBeTruthy();
    });

    // The I/O matrix's large-text row: the region is as tall as its content, and scrolls only once
    // it reaches its ceiling. At rest a drag does not rubber-band the rows.
    // At the largest text sizes — or on a short phone with the square box — the region rises above
    // the instruction, and its plate-less rows would draw over it: it hides beneath the region,
    // still laid out so its own measurement stays live. It hides only once the region reaches its
    // glyphs: the empty leading beneath them, (22 − 15) / 2 of `bodyMdStrong` at the default size,
    // may be covered, and it scales with the text as the line box does.
    describe('the instruction beneath the region', () => {
      const INSTRUCTION = { y: 550, height: 22 };
      const INSTRUCTION_BOTTOM = INSTRUCTION.y + INSTRUCTION.height;
      const LEADING = 3.5;

      // The jest preset reports a font scale of 2; the default iPhone text size is 1.
      let fontScaleSpy: jest.SpyInstance<number, []>;
      beforeEach(() => {
        fontScaleSpy = jest.spyOn(PixelRatio, 'getFontScale').mockReturnValue(1);
      });
      afterEach(() => {
        fontScaleSpy.mockRestore();
      });

      const layOut = (testID: string, y: number, height: number) =>
        fireEvent(screen.getByTestId(testID, { includeHiddenElements: true }), 'layout', {
          nativeEvent: { layout: { x: 0, y, width: 393, height } }
        });

      const instruction = () =>
        screen.getByTestId('scanner-instruction', { includeHiddenElements: true });

      it('stays visible while the region covers no more than the empty leading under its glyphs', () => {
        render(<ScannerOverlay {...defaultProps} />);
        layOut('scanner-instruction', INSTRUCTION.y, INSTRUCTION.height);
        layOut('scanner-bottom-region', INSTRUCTION_BOTTOM - LEADING, 280 + LEADING);

        expect(StyleSheet.flatten(instruction().props.style).opacity).toBeUndefined();
        expect(instruction().props.accessibilityElementsHidden).toBe(false);
        expect(instruction().props.importantForAccessibility).toBe('auto');
      });

      // The device case: on an 852pt phone at the default size, frame E's banner lifts the region
      // to 571.67, a third of a point into the line box that ends at 572.
      it('stays visible under frame E’s banner, a third of a point into its line box', () => {
        render(<ScannerOverlay {...defaultProps} />);
        layOut('scanner-instruction', INSTRUCTION.y, INSTRUCTION.height);
        layOut('scanner-bottom-region', 571.67, 280.33);

        expect(StyleSheet.flatten(instruction().props.style).opacity).toBeUndefined();
        expect(instruction().props.accessibilityElementsHidden).toBe(false);
        expect(screen.getByText('Point camera at barcode')).toBeTruthy();
      });

      it('hides — still mounted — once the region’s top rises past the leading into its glyphs', () => {
        render(<ScannerOverlay {...defaultProps} />);
        layOut('scanner-instruction', INSTRUCTION.y, INSTRUCTION.height);
        layOut('scanner-bottom-region', INSTRUCTION_BOTTOM - LEADING - 0.5, 280.5 + LEADING);

        expect(StyleSheet.flatten(instruction().props.style).opacity).toBe(0);
        expect(instruction().props.accessibilityElementsHidden).toBe(true);
        expect(instruction().props.importantForAccessibility).toBe('no-hide-descendants');
        expect(screen.queryByText('Point camera at barcode')).toBeNull();
      });

      it('scales the leading with the text size', () => {
        fontScaleSpy.mockReturnValue(2);
        render(<ScannerOverlay {...defaultProps} />);
        // At twice the size the line box is 44 tall, and 7 of it lies beneath the glyphs.
        layOut('scanner-instruction', INSTRUCTION.y, 2 * INSTRUCTION.height);
        const bottom = INSTRUCTION.y + 2 * INSTRUCTION.height;

        layOut('scanner-bottom-region', bottom - 2 * LEADING + 0.5, 300);
        expect(StyleSheet.flatten(instruction().props.style).opacity).toBeUndefined();

        layOut('scanner-bottom-region', bottom - 2 * LEADING - 0.5, 300);
        expect(StyleSheet.flatten(instruction().props.style).opacity).toBe(0);
        expect(instruction().props.accessibilityElementsHidden).toBe(true);
      });

      it('comes back when the region falls below it again', () => {
        render(<ScannerOverlay {...defaultProps} />);
        layOut('scanner-instruction', INSTRUCTION.y, INSTRUCTION.height);
        layOut('scanner-bottom-region', 300, 552);
        expect(StyleSheet.flatten(instruction().props.style).opacity).toBe(0);

        layOut('scanner-bottom-region', 697.67, 154.33);
        expect(StyleSheet.flatten(instruction().props.style).opacity).toBeUndefined();
        expect(screen.getByText('Point camera at barcode')).toBeTruthy();
      });
    });

    it('sizes the region to its content, shrinking — and scrolling — only at its ceiling', () => {
      render(<ScannerOverlay {...defaultProps} />);

      expect(screen.UNSAFE_getByType(ScrollView).props.testID).toBe('scanner-bottom-region');
      expect(styleOf('scanner-bottom-region')).toMatchObject({ flexGrow: 0, flexShrink: 1 });
      expect(screen.getByTestId('scanner-bottom-region').props.alwaysBounceVertical).toBe(false);
    });

    // The ceiling is the container's top padding: 16pt under the pill's bottom, read from its
    // layout, because large text grows the pill too.
    it('stops the region 16pt under the brand pill, following the pill as it grows', () => {
      render(<ScannerOverlay {...defaultProps} brandPill={pill} />);
      // Before the pill has laid out, its top stands in for its bottom.
      expect(styleOf('scanner-overlay').paddingTop).toBe(PILL_TOP + 16);

      layOutPill(36);
      expect(styleOf('scanner-overlay').paddingTop).toBe(PILL_TOP + 36 + 16);

      layOutPill(80);
      expect(styleOf('scanner-overlay').paddingTop).toBe(PILL_TOP + 80 + 16);
    });

    // A custom card has no pill: the back disc's bottom is the limit.
    it('stops the region 16pt under the back disc when there is no pill', () => {
      render(<ScannerOverlay {...defaultProps} />);
      expect(styleOf('scanner-overlay').paddingTop).toBe(INSETS.top + 8 + 40 + 16);
    });

    // The ceiling moves nothing drawn over the feed: every other layer is inset absolutely.
    it('leaves every layer over the feed where it was', () => {
      render(<ScannerOverlay {...defaultProps} brandPill={pill} />);

      expect(styleOf('scanner-scrim')).toMatchObject({ position: 'absolute', top: 0, bottom: 0 });
      expect(styleOf('viewfinder-layer')).toMatchObject({
        position: 'absolute',
        top: 0,
        bottom: 0
      });
      expect(styleOf('floating-back-button')).toMatchObject({
        position: 'absolute',
        top: INSETS.top + 8 - 4
      });
      expect(styleOf('brand-pill-container')).toMatchObject({
        position: 'absolute',
        top: PILL_TOP
      });
    });

    // At least the touch target tall (16.33), growing with a label that wraps rather than clips.
    it('keeps each action row at least the touch-target height, growing with its label', () => {
      render(<ScannerOverlay {...defaultProps} onImageScan={jest.fn()} />);

      for (const row of ['scan-from-image-row', 'manual-entry-row']) {
        expect(styleOf(row).minHeight).toBe(TOUCH_TARGET.min);
        expect(styleOf(row).height).toBeUndefined();
      }
      for (const label of ['Scan from image', 'Enter card number manually']) {
        expect(screen.getByText(label).props.numberOfLines).toBeUndefined();
      }
    });

    it('pads the stack by the bottom inset and 16, on the 24pt margins', () => {
      render(<ScannerOverlay {...defaultProps} />);
      expect(styleOf('scanner-bottom-actions')).toMatchObject({
        paddingBottom: INSETS.bottom + 16,
        paddingHorizontal: 24
      });
    });

    it('draws Lucide image and keyboard glyphs, each row ending in a chevron', () => {
      render(<ScannerOverlay {...defaultProps} onImageScan={jest.fn()} />);

      expect(
        within(screen.getByTestId('scan-from-image-row')).UNSAFE_getByType(ImageIcon)
      ).toBeTruthy();
      expect(
        within(screen.getByTestId('manual-entry-row')).UNSAFE_getByType(KeyboardIcon)
      ).toBeTruthy();
      expect(screen.UNSAFE_getAllByType(ChevronRight)).toHaveLength(2);
    });

    // The same in both schemes: everything on the feed is cream.
    describe.each<Scheme>(['light', 'dark'])('in %s', (scheme) => {
      beforeEach(() => {
        mockIsDark = scheme === 'dark';
      });

      it('draws every glyph at 24 / 1.5 in cream', () => {
        render(<ScannerOverlay {...defaultProps} onImageScan={jest.fn()} />);

        for (const testID of [
          'scan-from-image-row-icon',
          'scan-from-image-row-chevron',
          'manual-entry-row-icon',
          'manual-entry-row-chevron'
        ]) {
          expect(glyph(testID).props).toMatchObject({
            width: 24,
            height: 24,
            strokeWidth: 1.5,
            stroke: CREAM
          });
        }
      });

      // Plain rows on the feed carry no shadow, as the frame has them.
      it('sets the labels in body-lg semibold cream, with no shadow', () => {
        render(<ScannerOverlay {...defaultProps} onImageScan={jest.fn()} />);

        for (const label of ['Scan from image', 'Enter card number manually']) {
          const style = StyleSheet.flatten(screen.getByText(label).props.style);
          expect(style).toMatchObject({ ...TYPOGRAPHY.bodyLgStrong, color: CREAM });
          expect(style.textShadowColor).toBeUndefined();
        }
      });

      it('divides the two rows with the 25 % white rule', () => {
        render(<ScannerOverlay {...defaultProps} onImageScan={jest.fn()} />);
        expect(styleOf('scanner-row-divider').backgroundColor).toBe('rgba(255, 255, 255, 0.25)');
      });
    });

    it.each(['scan-from-image-row', 'manual-entry-row'])(
      'scales %s to 0.98 while pressed and back when released',
      (testID) => {
        render(<ScannerOverlay {...defaultProps} onImageScan={jest.fn()} />);
        const row = screen.getByTestId(testID);
        const scale = () => StyleSheet.flatten(row.props.style).transform;

        expect(scale()).toBeUndefined();
        fireEvent(row, 'pressIn');
        expect(scale()).toEqual([{ scale: 0.98 }]);
        fireEvent(row, 'pressOut');
        expect(scale()).toBeUndefined();
      }
    );
  });

  // Story 22.5 — frame B: the camera's own fixed roles, the same in both schemes.
  describe('frame B', () => {
    beforeEach(() => {
      givenScanner(PERMISSION.granted);
    });

    describe.each<Scheme>(['light', 'dark'])('in %s', (scheme) => {
      beforeEach(() => {
        mockIsDark = scheme === 'dark';
      });

      it('lays a flat 40 % scrim over the feed, on a #000000 ground', () => {
        render(<ScannerOverlay {...defaultProps} />);

        expect(styleOf('scanner-overlay').backgroundColor).toBe(GROUND);
        expect(styleOf('scanner-scrim')).toMatchObject({
          position: 'absolute',
          top: 0,
          bottom: 0,
          backgroundColor: FEED_SCRIM
        });
      });

      it('sets the instruction in body-md semibold cream with the feed shadow', () => {
        render(<ScannerOverlay {...defaultProps} />);

        expect(styleOf('scanner-instruction')).toMatchObject({
          ...TYPOGRAPHY.bodyMdStrong,
          ...SHADOW,
          color: CREAM
        });
      });

      it('floats the back disc in its feed look', () => {
        render(<ScannerOverlay {...defaultProps} />);

        expect(styleOf('floating-back-button-disc').backgroundColor).toBe(FEED_SCRIM);
        expect(glyph('floating-back-button-icon').props.stroke).toBe(CREAM);
      });

      it('draws a light status bar while the scanner is focused', () => {
        render(<ScannerOverlay {...defaultProps} />);
        expect(screen.UNSAFE_getByType(StatusBar).props.style).toBe('light');
      });
    });

    // React Native's status bar is a stack where the last mounted instance wins, and the scanner
    // stays mounted under setup.
    it('leaves the status bar to the screen above once it loses focus', () => {
      mockIsFocused = false;
      render(<ScannerOverlay {...defaultProps} />);
      expect(screen.UNSAFE_queryByType(StatusBar)).toBeNull();
    });

    // The disc's corner at the left inset + 24 and the top inset + 8; its 48pt target is 4pt
    // larger on every side.
    it('places the back disc 8pt under the status bar on the 24pt margin', () => {
      render(<ScannerOverlay {...defaultProps} />);

      expect(styleOf('floating-back-button')).toMatchObject({
        top: INSETS.top + 8 - 4,
        left: INSETS.left + 24 - 4,
        width: 48,
        height: 48
      });
    });

    it('places the pill 16pt below the disc, centred on the 24pt margins', () => {
      render(
        <ScannerOverlay {...defaultProps} brandPill={<Text testID="test-pill">Brand</Text>} />
      );

      expect(styleOf('brand-pill-container')).toMatchObject({
        position: 'absolute',
        top: INSETS.top + 8 + 40 + 16,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        alignItems: 'center'
      });
      expect(
        within(screen.getByTestId('brand-pill-container')).getByTestId('test-pill')
      ).toBeTruthy();
    });

    // A custom card has no brand, so no pill.
    it('draws no pill when there is none to draw', () => {
      render(<ScannerOverlay {...defaultProps} />);
      expect(screen.queryByTestId('brand-pill')).toBeNull();
    });
  });

  // Story 22.5 — permission `null` or `undetermined`: frame B's chrome, no camera, no refusal.
  describe.each<[string, Permission]>([
    ['not yet read', null],
    ['undetermined', PERMISSION.undetermined]
  ])('pending — permission %s', (_, permission) => {
    beforeEach(() => {
      givenScanner(permission);
    });

    it('mounts no camera, so no native session starts before the person answers', () => {
      render(<ScannerOverlay {...defaultProps} />);

      expect(screen.queryByTestId('camera-view')).toBeNull();
      expect(mockCameraView).not.toHaveBeenCalled();
    });

    it('shows no refusal for a question nobody has answered yet', () => {
      render(<ScannerOverlay {...defaultProps} />);

      expect(screen.queryByText('Camera Access Needed')).toBeNull();
      expect(screen.queryByTestId('open-settings-button')).toBeNull();
    });

    it('draws frame B’s chrome on the black ground under a light status bar', () => {
      render(<ScannerOverlay {...defaultProps} onImageScan={jest.fn()} />);

      expect(styleOf('scanner-overlay').backgroundColor).toBe(GROUND);
      expect(screen.getByTestId('viewfinder')).toBeTruthy();
      expect(screen.getByTestId('scan-beam')).toBeTruthy();
      expect(screen.getByText('Point camera at barcode')).toBeTruthy();
      expect(screen.getByTestId('floating-back-button')).toBeTruthy();
      expect(screen.getByTestId('scan-from-image-row')).toBeTruthy();
      expect(screen.getByTestId('manual-entry-row')).toBeTruthy();
      expect(screen.UNSAFE_getByType(StatusBar).props.style).toBe('light');
    });

    // A request that fails rather than being answered is a camera error, not a pending state.
    it('shows the camera-error state when the request fails', () => {
      givenScanner(permission, 'Failed to request camera permission');
      render(<ScannerOverlay {...defaultProps} />);

      expect(screen.getByText('Camera Error')).toBeTruthy();
      expect(screen.getByText('Unable to start the camera preview.')).toBeTruthy();
      expect(screen.queryByText('Failed to request camera permission')).toBeNull();
    });
  });

  it('asks for the camera on mount while the permission is still unread', () => {
    givenScanner(null);
    render(<ScannerOverlay {...defaultProps} />);
    expect(mockRequestCameraPermission).toHaveBeenCalledTimes(1);
  });

  it('mounts the camera once the answer is yes', () => {
    givenScanner(null);
    const { rerender } = render(<ScannerOverlay {...defaultProps} />);
    expect(screen.queryByTestId('camera-view')).toBeNull();

    givenScanner(PERMISSION.granted);
    rerender(<ScannerOverlay {...defaultProps} />);
    expect(screen.getByTestId('camera-view')).toBeTruthy();
  });

  // Story 22.5 — frame D: while the picker is up, the viewfinder, beam and instruction hide and
  // scanning pauses. The back disc and the pill stay.
  describe('under the multi-code picker', () => {
    beforeEach(() => {
      givenScanner(PERMISSION.granted);
    });

    const pill = () => <Text testID="test-pill">Brand</Text>;

    it('hides the viewfinder, the beam and the instruction', () => {
      render(<ScannerOverlay {...defaultProps} isPickerVisible brandPill={pill()} />);

      expect(screen.queryByTestId('viewfinder')).toBeNull();
      expect(screen.queryByTestId('scan-beam')).toBeNull();
      expect(screen.queryByText('Point camera at barcode')).toBeNull();
    });

    it('keeps the back disc and the pill', () => {
      render(<ScannerOverlay {...defaultProps} isPickerVisible brandPill={pill()} />);

      expect(screen.getByTestId('floating-back-button')).toBeTruthy();
      expect(screen.getByTestId('test-pill')).toBeTruthy();
    });

    // Through the hook's own gate: toggling `onBarcodeScanned` would recreate Android's camera.
    it('stops the camera scanning, without unmounting it', () => {
      render(<ScannerOverlay {...defaultProps} isPickerVisible />);

      expect(mockUseBarcodeScanner).toHaveBeenLastCalledWith(
        expect.objectContaining({ enabled: false })
      );
      expect(screen.getByTestId('camera-view')).toBeTruthy();
    });

    it('scans again once the picker closes', () => {
      const { rerender } = render(<ScannerOverlay {...defaultProps} isPickerVisible />);
      rerender(<ScannerOverlay {...defaultProps} isPickerVisible={false} />);

      expect(mockUseBarcodeScanner).toHaveBeenLastCalledWith(
        expect.objectContaining({ enabled: true })
      );
      expect(screen.getByTestId('viewfinder')).toBeTruthy();
    });
  });

  describe('permission denied state', () => {
    beforeEach(() => {
      givenScanner(PERMISSION.denied);
    });

    // The real hook answers a refusal with `status: 'denied'` AND sets `error` to "Camera
    // permission denied": the refusal (frame C) wins over the camera-error state.
    it('shows frame C, not the camera error, for the hook’s real denial output', () => {
      givenScanner(PERMISSION.denied, 'Camera permission denied');
      render(<ScannerOverlay {...defaultProps} />);

      expect(screen.getByText('Camera Access Needed')).toBeTruthy();
      expect(screen.getByTestId('open-settings-button')).toBeTruthy();
      expect(screen.queryByText('Camera Error')).toBeNull();
      expect(screen.queryByTestId('retry-button')).toBeNull();
    });

    it('shows "Camera Access Needed" message', () => {
      render(<ScannerOverlay {...defaultProps} />);
      expect(screen.getByText('Camera Access Needed')).toBeTruthy();
    });

    it('shows Open Settings button', () => {
      render(<ScannerOverlay {...defaultProps} />);
      expect(screen.getByTestId('open-settings-button')).toBeTruthy();
    });

    it('shows Enter Manually button', () => {
      render(<ScannerOverlay {...defaultProps} />);
      expect(screen.getByTestId('manual-entry-button')).toBeTruthy();
    });

    it('calls onManualEntry when Enter Manually is pressed', () => {
      render(<ScannerOverlay {...defaultProps} />);
      fireEvent.press(screen.getByTestId('manual-entry-button'));
      expect(defaultProps.onManualEntry).toHaveBeenCalledTimes(1);
    });

    it('renders back button in permission denied state', () => {
      render(<ScannerOverlay {...defaultProps} />);
      expect(screen.getByTestId('floating-back-button')).toBeTruthy();
    });

    it('calls onBack from the back button', () => {
      render(<ScannerOverlay {...defaultProps} />);
      fireEvent.press(screen.getByTestId('floating-back-button'));
      expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
    });

    // Story 22.5 — frame C.
    it('mounts no camera and draws no viewfinder', () => {
      render(<ScannerOverlay {...defaultProps} />);

      expect(screen.queryByTestId('camera-view')).toBeNull();
      expect(screen.queryByTestId('viewfinder')).toBeNull();
      expect(screen.queryByTestId('scan-beam')).toBeNull();
    });

    it('announces its title as a heading', () => {
      render(<ScannerOverlay {...defaultProps} />);
      expect(screen.getByRole('header', { name: 'Camera Access Needed' })).toBeTruthy();
    });

    it('centres the message, with the footer anchored outside its scroll view', () => {
      render(<ScannerOverlay {...defaultProps} />);
      expectCentredMessageOverAnchoredFooter();
    });

    it('anchors "Open Settings" (primary, 52pt) above "Enter card number manually" in the footer', () => {
      render(<ScannerOverlay {...defaultProps} />);

      const footer = within(screen.getByTestId('camera-message-footer'));
      expect(footer.getAllByRole('button').map((button) => button.props.testID)).toEqual([
        'open-settings-button',
        'manual-entry-button'
      ]);
      expect(buttonProps('open-settings-button')).toMatchObject({
        variant: 'primary',
        size: 'large'
      });
      expect(buttonProps('manual-entry-button')?.variant).toBe('secondary');
    });

    it('opens the system settings', async () => {
      render(<ScannerOverlay {...defaultProps} />);

      await act(async () => {
        fireEvent.press(screen.getByTestId('open-settings-button'));
      });

      expect(Linking.openSettings).toHaveBeenCalledTimes(1);
      expect(mockNotify).not.toHaveBeenCalled();
    });

    // `logger.warn` is a no-op in release, so the failure is reported where production counts it:
    // bounded tags, and none of the error's message text.
    it('reports a failure to open the settings, and never throws it', async () => {
      const failure = new Error('No settings app');
      (Linking.openSettings as jest.Mock).mockRejectedValueOnce(failure);
      render(<ScannerOverlay {...defaultProps} />);

      await act(async () => {
        fireEvent.press(screen.getByTestId('open-settings-button'));
      });

      expect(mockNotify).toHaveBeenCalledWith('Opening the system settings failed', {
        tags: { surface: 'camera', outcome: 'open-settings-failed', platform: Platform.OS }
      });
      expect(JSON.stringify(mockNotify.mock.calls)).not.toContain('No settings app');
      expect(screen.getByText('Camera Access Needed')).toBeTruthy();
    });

    describe.each<Scheme>(['light', 'dark'])('in %s', (scheme) => {
      const roles = SCHEME[scheme];

      beforeEach(() => {
        mockIsDark = scheme === 'dark';
      });

      // No camera, so no dark: the scheme's own ground, and its own status bar.
      it('takes the scheme’s ground with no status-bar override', () => {
        render(<ScannerOverlay {...defaultProps} />);

        expect(styleOf('scanner-overlay').backgroundColor).toBe(roles.background);
        expect(screen.UNSAFE_queryByType(StatusBar)).toBeNull();
      });

      it('draws the camera-off glyph at 48 with a 2pt stroke, in textSecondary', () => {
        render(<ScannerOverlay {...defaultProps} />);

        // Lucide's stroke is in its 24-unit grid: 1 unit at 48pt is the 2pt the frame draws.
        expect(glyph('camera-message-icon').props).toMatchObject({
          width: 48,
          height: 48,
          strokeWidth: 1,
          stroke: roles.textSecondary
        });
      });

      it('sets the title in headline-sm textPrimary, 16pt below the glyph', () => {
        render(<ScannerOverlay {...defaultProps} />);

        expect(
          StyleSheet.flatten(screen.getByText('Camera Access Needed').props.style)
        ).toMatchObject({
          ...TYPOGRAPHY.headlineSm,
          color: roles.textPrimary,
          marginTop: 16,
          textAlign: 'center'
        });
      });

      it('sets the body in body-md textSecondary, centred, 8pt below the title', () => {
        render(<ScannerOverlay {...defaultProps} />);

        expect(
          StyleSheet.flatten(screen.getByText(/Camera access is needed/).props.style)
        ).toMatchObject({
          ...TYPOGRAPHY.bodyMd,
          color: roles.textSecondary,
          marginTop: 8,
          textAlign: 'center'
        });
      });

      it('floats the back disc in its ground look', () => {
        render(<ScannerOverlay {...defaultProps} />);

        expect(styleOf('floating-back-button-disc')).toMatchObject({ borderWidth: 1 });
        expect(glyph('floating-back-button-icon').props.stroke).toBe(roles.textPrimary);
      });
    });

    it('places the back disc where frame B places it', () => {
      render(<ScannerOverlay {...defaultProps} />);
      expect(styleOf('floating-back-button')).toMatchObject({ top: 63, left: 20 });
    });
  });

  describe('error state', () => {
    beforeEach(() => {
      givenScanner(PERMISSION.granted, 'Camera failed to start');
    });

    it('shows "Camera Error" title', () => {
      render(<ScannerOverlay {...defaultProps} />);
      expect(screen.getByText('Camera Error')).toBeTruthy();
    });

    it('takes frame C’s layout: the message centred, the footer anchored outside its scroll view', () => {
      render(<ScannerOverlay {...defaultProps} />);
      expectCentredMessageOverAnchoredFooter();
    });

    // Story 22.5: the body is always the localised message; the native one stays with telemetry.
    it('shows the localised message, never the raw one', () => {
      render(<ScannerOverlay {...defaultProps} />);

      expect(screen.getByText('Unable to start the camera preview.')).toBeTruthy();
      expect(screen.queryByText('Camera failed to start')).toBeNull();
    });

    it('shows Retry button', () => {
      render(<ScannerOverlay {...defaultProps} />);
      expect(screen.getByTestId('retry-button')).toBeTruthy();
    });

    it('shows Enter Manually fallback button', () => {
      render(<ScannerOverlay {...defaultProps} />);
      expect(screen.getByTestId('manual-entry-fallback-button')).toBeTruthy();
    });

    it('calls onManualEntry from the fallback button', () => {
      render(<ScannerOverlay {...defaultProps} />);
      fireEvent.press(screen.getByTestId('manual-entry-fallback-button'));
      expect(defaultProps.onManualEntry).toHaveBeenCalledTimes(1);
    });

    it('clears the error and asks for the camera again on Retry', () => {
      render(<ScannerOverlay {...defaultProps} />);
      fireEvent.press(screen.getByTestId('retry-button'));

      expect(mockReset).toHaveBeenCalledTimes(1);
      expect(mockRequestCameraPermission).toHaveBeenCalledTimes(1);
    });

    it('keeps its shipped buttons and roles: Scan from image, then Retry, then manual entry', () => {
      render(<ScannerOverlay {...defaultProps} onImageScan={jest.fn()} />);

      const footer = within(screen.getByTestId('camera-message-footer'));
      expect(footer.getAllByRole('button').map((button) => button.props.testID)).toEqual([
        'scan-from-image-fallback-button',
        'retry-button',
        'manual-entry-fallback-button'
      ]);
      expect(buttonProps('scan-from-image-fallback-button')).toMatchObject({
        variant: 'primary',
        size: 'large'
      });
      expect(buttonProps('retry-button')).toMatchObject({ variant: 'secondary', size: 'default' });
      expect(buttonProps('manual-entry-fallback-button')?.variant).toBe('secondary');
    });

    // With no image scan offered, Retry is the footer's primary action, and 52pt like one.
    it('makes Retry the primary action when there is no image scan to offer', () => {
      render(<ScannerOverlay {...defaultProps} />);

      expect(screen.queryByTestId('scan-from-image-fallback-button')).toBeNull();
      expect(buttonProps('retry-button')).toMatchObject({ variant: 'primary', size: 'large' });
    });

    describe.each<Scheme>(['light', 'dark'])('in %s', (scheme) => {
      const roles = SCHEME[scheme];

      beforeEach(() => {
        mockIsDark = scheme === 'dark';
      });

      // Frame C's layout, with no red.
      it('takes frame C’s calm layout on the scheme’s ground, with no red', () => {
        render(<ScannerOverlay {...defaultProps} />);

        expect(styleOf('scanner-overlay').backgroundColor).toBe(roles.background);
        expect(glyph('camera-message-icon').props.stroke).toBe(roles.textSecondary);
        expect(JSON.stringify(screen.toJSON())).not.toContain(roles.error);
        expect(screen.UNSAFE_queryByType(StatusBar)).toBeNull();
      });
    });

    it('recovers from a mount error to the live camera on Retry', () => {
      givenScanner(PERMISSION.granted);
      render(<ScannerOverlay {...defaultProps} />);
      failToMount();
      expect(screen.queryByTestId('camera-view')).toBeNull();

      fireEvent.press(screen.getByTestId('retry-button'));
      expect(screen.getByTestId('camera-view')).toBeTruthy();
    });

    describe('in Italian', () => {
      afterEach(async () => {
        await act(async () => {
          await changeAppLanguage('en');
        });
      });

      it('shows the Italian message', async () => {
        await act(async () => {
          await changeAppLanguage('it');
        });
        render(<ScannerOverlay {...defaultProps} />);

        expect(screen.getByText("Impossibile avviare l'anteprima della fotocamera.")).toBeTruthy();
      });
    });
  });
});

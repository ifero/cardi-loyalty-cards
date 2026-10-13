/**
 * ScannerOverlay Component
 * Story 13.4: Restyle Add Card Flow (AC3)
 * Story 22.1: Viewfinder shaped to the expected format (16.31); banner clear of the actions
 *             (16.30); the action stack in flow, never absolute (AC9)
 * Story 22.5: Capture frames B and C, the pending and camera-error states, Reduce Motion, the
 *             status bar, the multi-code picker's pause, and one bottom region for the banner
 *             and the rows
 *
 * The scanner, in four states:
 *
 * - **Aim** (frame B, permission granted): the live feed under a flat scrim, the back disc, the
 *   brand pill, the viewfinder shaped to the expected format with the beam sweeping it, the
 *   instruction and the two action rows — the same in both schemes, under a light status bar.
 * - **Pending** (permission `null` or `undetermined`): frame B on the black ground with NO camera
 *   mounted, so no native session starts before the person has answered the system prompt — and
 *   no refusal is shown for a question nobody has answered yet.
 * - **Refused** (frame C, permission `denied`): no camera, so no dark — the scheme's own ground, a
 *   calm message and the two ways forward in the anchored footer.
 * - **Camera error** (a mount error, or a failed permission request): frame C's layout, with no red.
 *
 * While the multi-code picker is up, the viewfinder, beam and instruction hide and the camera stops
 * scanning — the picker's question is not answered by a code the camera happens to see.
 */

import { CameraView } from 'expo-camera';
import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { LucideIcon } from 'lucide-react-native';
import CameraOff from 'lucide-react-native/icons/camera-off';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import ImageIcon from 'lucide-react-native/icons/image';
import KeyboardIcon from 'lucide-react-native/icons/keyboard';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  Pressable,
  Linking,
  PixelRatio,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
  type LayoutChangeEvent,
  type ViewStyle
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withRepeat,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarcodeFormat } from '@/core/schemas';
import { logger } from '@/core/utils';

import { Button } from '@/shared/components/ui/Button';
import { PrimaryActionFooter } from '@/shared/components/ui/PrimaryActionFooter';
import { useTheme } from '@/shared/theme';
import { CAMERA_OVERLAY, IDENTITY_COLORS } from '@/shared/theme/colors';
import { LAYOUT, SPACING, TOUCH_TARGET } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import { useBarcodeScanner, ScanResult } from '@/features/cards/hooks/useBarcodeScanner';

import { BACK_DISC_INSET, BACK_DISC_SIZE, FloatingBackButton } from './FloatingBackButton';
import { NoCodeFoundBanner } from './NoCodeFoundBanner';
import type { ImageScanErrorReason } from '../hooks/useImageScan';

interface ScannerOverlayProps {
  onScan: (result: ScanResult) => void;
  onManualEntry: () => void;
  onBack: () => void;
  brandPill?: React.ReactNode;
  testID?: string;
  /** When provided, a 'Scan from image' row is shown in the bottom actions */
  onImageScan?: () => void;
  /** Shows a centered ActivityIndicator over the viewfinder while an image is being decoded */
  isProcessingImage?: boolean;
  /** Shows the NoCodeFoundBanner when true */
  imageError?: boolean;
  /**
   * Which failure the banner should describe (Story 16.23). Omitted falls back
   * to the banner's own `notFound` default.
   */
  imageErrorReason?: ImageScanErrorReason;
  onImageErrorDismiss?: () => void;
  onImageErrorRetry?: () => void;
  onImageErrorManualEntry?: () => void;
  /**
   * Optional catalogue-driven format hint forwarded to the scanner hook so a
   * stripped EAN-13 leading zero can be auto-restored.
   */
  expectedFormat?: BarcodeFormat;
  /**
   * The multi-code picker is open over the scanner (capture frame D): the viewfinder, beam and
   * instruction hide, and the camera stops scanning. The back disc and the pill stay.
   */
  isPickerVisible?: boolean;
}

/**
 * Classify an `onMountError` message into a bounded, indexable Sentry tag.
 *
 * `CameraMountError` carries a `message` and nothing else — `expo-camera` provides
 * no error code — so a prefix match is the only classification available. It is
 * still worth doing rather than forwarding the raw string: the message is free
 * text from a third party, and one of `expo-camera`'s four emitters interpolates
 * an `AVError` description into it. That is harmless today, but "safe because of
 * what this version happens to interpolate" is not the same as safe by
 * construction, and tag values are the one field the PII scrubber never touches.
 *
 * Prefixes verified against `expo-camera`'s own emitters — `CameraSessionManager`
 * (iOS) and `ExpoCameraView` (Android). An unrecognised message reports `'other'`,
 * which is itself the signal that upstream changed and this list needs revisiting.
 *
 * ⚠️ These prefixes are duplicated, deliberately, in two other places that must
 * move with them: `EXPECTED_STRINGS` in `scripts/verify-native-strings.mjs` (the
 * gate asserting they still exist upstream) and the classification cases in
 * `ScannerOverlay.test.tsx`. Nothing links the three mechanically — a shared
 * constant would have to span a component and a bare-Node script — so changing a
 * prefix here means changing all three.
 */
const classifyMountError = (
  message: string
): 'in-use' | 'permission' | 'session-reset' | 'start-failed' | 'other' => {
  if (message.startsWith('Camera component could not be rendered')) return 'in-use';
  if (message.startsWith('Camera permissions not granted')) return 'permission';
  if (message.startsWith('Camera session was reset')) return 'session-reset';
  if (message.startsWith('Camera could not be started')) return 'start-failed';
  return 'other';
};

/**
 * Which rectangle each symbology needs (Story 16.31, via 22.1). A `Record` over the whole union,
 * so a new format is a compile error here until someone decides its shape.
 */
const VIEWFINDER_SHAPE: Record<BarcodeFormat, 'wide' | 'square'> = {
  EAN13: 'wide',
  EAN8: 'wide',
  CODE128: 'wide',
  CODE39: 'wide',
  UPCA: 'wide',
  QR: 'square'
};

/**
 * The wide frame: 300 × 120 at the capture frame's 393pt — an EAN-13 is ~4.75 : 1, and a
 * viewfinder teaches people to fill it, so a square one sends them backing away from a linear
 * code until it is small. Derived from the width rather than copied, so it scales.
 */
const WIDE_WIDTH_RATIO = 300 / 393;
const WIDE_ASPECT = 300 / 120;

/** The square frame, for QR: the 70 % of the width every format used to get. */
const SQUARE_WIDTH_RATIO = 0.7;

export type ViewfinderSize = { width: number; height: number };

/**
 * The viewfinder's rectangle for the code about to be scanned. With no expected format — the
 * custom-card path enters with no brand — it is the WIDE one, because linear formats are the
 * large majority of the catalogue.
 */
export const getViewfinderSize = (
  screenWidth: number,
  expectedFormat: BarcodeFormat | undefined
): ViewfinderSize => {
  const shape = expectedFormat ? VIEWFINDER_SHAPE[expectedFormat] : 'wide';

  if (shape === 'square') {
    const side = Math.round(screenWidth * SQUARE_WIDTH_RATIO);
    return { width: side, height: side };
  }

  const width = Math.round(screenWidth * WIDE_WIDTH_RATIO);
  return { width, height: Math.round(width / WIDE_ASPECT) };
};

const CORNER_SIZE = 32;
const CORNER_THICKNESS = 4;
const CORNER_RADIUS = 12;

/** The beam's sweep (Story 16.31): 2 s each way, easing in and out, as a scanner dwells at its ends. */
const BEAM_SWEEP_MS = 2000;

/**
 * Where the beam stands still under Reduce Motion: 46 / 120 of the box's height — where frame B
 * draws it, a little above the middle, as though sweeping down.
 */
export const BEAM_REST_RATIO = 46 / 120;

/** The gap between the scan banner and the action rows below it (capture frame E). */
const BANNER_GAP = SPACING.md;

/**
 * How close the bottom region may come to the brand pill's bottom — or, for a custom card, which
 * has no pill, to the back disc's — before it scrolls instead of growing.
 */
const REGION_CLEARANCE = SPACING.md;

/**
 * How far below the box the instruction starts. Frame B sets it this low to clear the card being
 * scanned, which is larger than the box around its code.
 */
const INSTRUCTION_GAP = 64;

/**
 * The empty leading beneath the instruction's glyphs at the default text size: half of what its
 * line box adds to its font size. The bottom region may cover this much of the line box (scaled
 * with the text, as the line box is) before it reaches the glyphs, so frame E's banner can sit
 * right below the instruction without hiding it.
 */
const INSTRUCTION_BOTTOM_LEADING =
  (TYPOGRAPHY.bodyMdStrong.lineHeight - TYPOGRAPHY.bodyMdStrong.fontSize) / 2;

/** The back disc sits this far below the status bar, on the 24pt screen margin (frames B and C). */
const BACK_DISC_TOP_GAP = SPACING.sm;

/** The design system's icon: 24pt at a 1.5 stroke. */
const ICON_SIZE = 24;
const ICON_STROKE_WIDTH = 1.5;

/** Frame C's camera-off glyph: 48pt, drawn with a 2pt stroke. */
const MESSAGE_ICON_SIZE = 48;
const MESSAGE_ICON_STROKE = 2;

/** Tap feedback — the design system's 0.98× scale (§ _Elevation_). */
const PRESSED_SCALE = 0.98;

/**
 * The one shadow in the system: legibility over a background nobody controls, so it goes ONLY on
 * text set directly on the camera feed — never on the rows, the pill or the banner's plate.
 */
const ON_FEED_TEXT_SHADOW = {
  textShadowColor: CAMERA_OVERLAY.textShadow,
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3
} as const;

/** Corners only, whatever the rectangle — white, because they are a mark, not text. */
const ViewfinderCorners: React.FC<ViewfinderSize> = ({ width, height }) => {
  const cornerStyle = {
    position: 'absolute' as const,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: CAMERA_OVERLAY.mark
  };

  return (
    <View
      style={{
        width,
        height,
        alignSelf: 'center'
      }}
    >
      {/* Top-left */}
      <View
        testID="viewfinder-corner-tl"
        style={[
          cornerStyle,
          {
            top: 0,
            left: 0,
            borderTopWidth: CORNER_THICKNESS,
            borderLeftWidth: CORNER_THICKNESS,
            borderTopLeftRadius: CORNER_RADIUS
          }
        ]}
      />
      {/* Top-right */}
      <View
        style={[
          cornerStyle,
          {
            top: 0,
            right: 0,
            borderTopWidth: CORNER_THICKNESS,
            borderRightWidth: CORNER_THICKNESS,
            borderTopRightRadius: CORNER_RADIUS
          }
        ]}
      />
      {/* Bottom-left */}
      <View
        style={[
          cornerStyle,
          {
            bottom: 0,
            left: 0,
            borderBottomWidth: CORNER_THICKNESS,
            borderLeftWidth: CORNER_THICKNESS,
            borderBottomLeftRadius: CORNER_RADIUS
          }
        ]}
      />
      {/* Bottom-right */}
      <View
        style={[
          cornerStyle,
          {
            bottom: 0,
            right: 0,
            borderBottomWidth: CORNER_THICKNESS,
            borderRightWidth: CORNER_THICKNESS,
            borderBottomRightRadius: CORNER_RADIUS
          }
        ]}
      />
    </View>
  );
};

/**
 * The beam, sweeping the viewfinder's HEIGHT — or, under Reduce Motion, standing still at 46/120
 * of it. Reanimated reads that setting once, at start-up, so a change takes effect on the next
 * launch. Left to itself, Reanimated would hold a reversing infinite repeat at its START under
 * Reduce Motion, parking the line on the top edge of the box; the frame puts it inside.
 */
const ScanLine: React.FC<{ viewfinderHeight: number }> = ({ viewfinderHeight }) => {
  const isReducedMotion = useReducedMotion();
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (isReducedMotion) {
      return;
    }
    translateY.value = withRepeat(
      withTiming(viewfinderHeight - 4, {
        duration: BEAM_SWEEP_MS,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    );
  }, [isReducedMotion, viewfinderHeight, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  return (
    <Animated.View
      testID="scan-beam"
      style={[
        styles.beam,
        isReducedMotion
          ? { transform: [{ translateY: viewfinderHeight * BEAM_REST_RATIO }] }
          : animatedStyle
      ]}
    />
  );
};

/** One of the two action rows on the feed: a cream glyph, label and chevron, with no plate. */
const FeedRow: React.FC<{
  icon: LucideIcon;
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  testID: string;
}> = ({ icon: Icon, label, accessibilityLabel, onPress, testID }) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[styles.feedRow, isPressed ? styles.pressed : null]}
    >
      <Icon
        testID={`${testID}-icon`}
        size={ICON_SIZE}
        strokeWidth={ICON_STROKE_WIDTH}
        color={CAMERA_OVERLAY.text}
      />
      <Text style={styles.feedRowLabel}>{label}</Text>
      <ChevronRight
        testID={`${testID}-chevron`}
        size={ICON_SIZE}
        strokeWidth={ICON_STROKE_WIDTH}
        color={CAMERA_OVERLAY.text}
      />
    </Pressable>
  );
};

/**
 * Frame C's layout, for a refusal and for a camera that will not start: no camera, so the scheme's
 * own ground — the message centred between the top inset and the footer, which anchors the actions
 * as the design system requires of every screen with a primary action. Calm on purpose: no red.
 */
const CameraMessage: React.FC<{
  testID: string;
  title: string;
  body: string;
  onBack: () => void;
  backPosition: ViewStyle;
  children: React.ReactNode;
}> = ({ testID, title, body, onBack, backPosition, children }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View testID={testID} style={[styles.fill, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[styles.messageContent, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        <CameraOff
          testID="camera-message-icon"
          size={MESSAGE_ICON_SIZE}
          strokeWidth={MESSAGE_ICON_STROKE}
          absoluteStrokeWidth
          color={theme.textSecondary}
        />
        <Text
          accessibilityRole="header"
          style={[styles.messageTitle, { color: theme.textPrimary }]}
        >
          {title}
        </Text>
        <Text style={[styles.messageBody, { color: theme.textSecondary }]}>{body}</Text>
      </ScrollView>
      <PrimaryActionFooter testID="camera-message-footer">{children}</PrimaryActionFooter>
      <FloatingBackButton appearance="ground" onPress={onBack} style={backPosition} />
    </View>
  );
};

export const ScannerOverlay: React.FC<ScannerOverlayProps> = ({
  onScan,
  onManualEntry,
  onBack,
  brandPill,
  testID = 'scanner-overlay',
  onImageScan,
  isProcessingImage = false,
  imageError = false,
  imageErrorReason,
  onImageErrorDismiss,
  onImageErrorRetry,
  onImageErrorManualEntry,
  expectedFormat,
  isPickerVisible = false
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  // React Native's status bar is a stack where the last mounted instance wins, and this screen
  // stays mounted under setup — so it draws its own only while it is the focused screen.
  const isFocused = useIsFocused();
  const { width: screenWidth } = useWindowDimensions();
  const viewfinder = getViewfinderSize(screenWidth, expectedFormat);
  const [hasMountError, setHasMountError] = useState(false);
  // The pill's bottom edge, which the bottom region stops short of. Its height follows the text
  // size, so it is read from its layout; null until the pill has laid out.
  const [pillBottom, setPillBottom] = useState<number | null>(null);
  // The instruction's bottom edge and the bottom region's top, both from their layouts: once the
  // region rises into the instruction's glyphs, the instruction hides beneath it.
  const [instructionBottom, setInstructionBottom] = useState<number | null>(null);
  const [measuredRegionTop, setMeasuredRegionTop] = useState<number | null>(null);
  const hasReportedMountErrorRef = useRef(false);

  // Scanning pauses under the picker through the hook's own `enabled` gate. Toggling
  // `onBarcodeScanned` instead would recreate the camera on Android.
  const { permission, hasScanned, error, handleBarcodeScanned, requestCameraPermission, reset } =
    useBarcodeScanner({ onScan, enabled: !isPickerVisible, expectedFormat });

  const handleCameraMountError = useCallback((event: { message: string }) => {
    // A camera that will not start is a total scan failure, and it previously
    // left no production trace — only the on-screen message below. Reported once
    // per mount: `onMountError` can fire repeatedly for one broken session.
    if (!hasReportedMountErrorRef.current) {
      hasReportedMountErrorRef.current = true;
      logger.notify('Camera preview failed to mount', {
        tags: {
          surface: 'camera',
          outcome: 'mount-error',
          reason: classifyMountError(event.message),
          platform: Platform.OS
        },
        // A single integer, so a `reason: 'other'` event is not a total black
        // hole the way it would be with no residual signal at all: two unknown
        // messages of different lengths are visibly different causes, and a
        // recurring unknown is distinguishable from a one-off. Its two sibling
        // classifiers keep `nativeCode` for the same purpose; this is the most
        // that can be kept here without reintroducing the free text.
        context: [{ messageLength: event.message.length }]
      });
    }
    // The native message stays with the classifier: the person is shown the localised one.
    setHasMountError(true);
  }, []);

  const handlePillLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setPillBottom(y + height);
  }, []);

  const handleInstructionLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setInstructionBottom(y + height);
  }, []);

  const handleRegionLayout = useCallback((event: LayoutChangeEvent) => {
    setMeasuredRegionTop(event.nativeEvent.layout.y);
  }, []);

  const handleOpenSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch {
      // Countable in production (`warn` is a no-op there), with bounded tags and no message text.
      logger.notify('Opening the system settings failed', {
        tags: { surface: 'camera', outcome: 'open-settings-failed', platform: Platform.OS }
      });
    }
  }, []);

  // Request permission on mount
  useEffect(() => {
    if (permission === null) {
      requestCameraPermission();
    }
  }, [permission, requestCameraPermission]);

  // The disc's corner at the left inset + 24 and the top inset + 8; the target is 4pt larger all
  // round. The pill is placed off the disc's own measurements, 16pt below it.
  const backPosition: ViewStyle = {
    top: insets.top + BACK_DISC_TOP_GAP - BACK_DISC_INSET,
    left: insets.left + LAYOUT.screenHorizontalMargin - BACK_DISC_INSET
  };
  const discBottom = insets.top + BACK_DISC_TOP_GAP + BACK_DISC_SIZE;
  const pillTop = discBottom + SPACING.md;
  // The highest the bottom region may reach: 16 under the pill — under the disc, with no pill.
  // Until the pill has laid out, its top stands in for its bottom.
  const regionCeiling = (brandPill ? (pillBottom ?? pillTop) : discBottom) + REGION_CLEARANCE;
  // The plate-less rows would draw over the instruction, so it hides — still mounted, so its own
  // layout keeps reporting — once the region's top rises past the empty leading under its glyphs.
  // The leading scales with the text: iOS multiplies the line height by the same content-size
  // multiplier that `getFontScale` reports, and a change re-renders through `useWindowDimensions`.
  const isInstructionCovered =
    measuredRegionTop !== null &&
    instructionBottom !== null &&
    measuredRegionTop < instructionBottom - INSTRUCTION_BOTTOM_LEADING * PixelRatio.getFontScale();

  // Refused (frame C). Only an answer of `denied` — `undetermined` is a question still open.
  if (permission?.status === 'denied') {
    return (
      <CameraMessage
        testID={testID}
        title={t('addCard.scanner.cameraAccessTitle')}
        body={t('addCard.scanner.cameraAccessBody')}
        onBack={onBack}
        backPosition={backPosition}
      >
        <Button
          variant="primary"
          size="large"
          onPress={() => void handleOpenSettings()}
          testID="open-settings-button"
        >
          {t('common.actions.openSettings')}
        </Button>
        <Button variant="secondary" onPress={onManualEntry} testID="manual-entry-button">
          {t('addCard.scanner.manualEntry')}
        </Button>
      </CameraMessage>
    );
  }

  // Camera error: a mount error, or a permission request that failed rather than being answered.
  if (hasMountError || error !== null) {
    return (
      <CameraMessage
        testID={testID}
        title={t('addCard.scanner.cameraErrorTitle')}
        body={t('addCard.scanner.cameraStartError')}
        onBack={onBack}
        backPosition={backPosition}
      >
        {onImageScan ? (
          <Button
            variant="primary"
            size="large"
            onPress={onImageScan}
            testID="scan-from-image-fallback-button"
          >
            {t('addCard.scanner.scanFromImage')}
          </Button>
        ) : null}
        <Button
          variant={onImageScan ? 'secondary' : 'primary'}
          size={onImageScan ? 'default' : 'large'}
          onPress={() => {
            setHasMountError(false);
            reset();
            requestCameraPermission();
          }}
          testID="retry-button"
        >
          {t('common.actions.retry')}
        </Button>
        <Button variant="secondary" onPress={onManualEntry} testID="manual-entry-fallback-button">
          {t('addCard.scanner.manualEntry')}
        </Button>
      </CameraMessage>
    );
  }

  // Aim (frame B) — and, until the person has answered the system prompt, the same frame on the
  // black ground with no camera behind it.
  const isCameraAllowed = permission?.status === 'granted';

  return (
    // The top padding is the bottom region's ceiling. The layers drawn over the feed are all
    // inset absolutely, so it moves none of them.
    <View testID={testID} style={[styles.container, { paddingTop: regionCeiling }]}>
      {isFocused ? <StatusBar style="light" /> : null}

      {isCameraAllowed ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['code128', 'ean13', 'ean8', 'qr', 'code39', 'upc_a']
          }}
          onMountError={handleCameraMountError}
          onBarcodeScanned={hasScanned ? undefined : handleBarcodeScanned}
        />
      ) : null}

      {/* A flat scrim over the whole feed: no gradient, no cut-out */}
      <View testID="scanner-scrim" style={[StyleSheet.absoluteFill, styles.scrim]} />

      {/* Viewfinder: a layer centred on the whole screen, as the capture frame draws it. The
          instruction is absolute, so it never shifts the box off the centre. */}
      {isPickerVisible ? null : (
        <View
          testID="viewfinder-layer"
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.viewfinderLayer]}
        >
          <View testID="viewfinder" style={viewfinder}>
            <ViewfinderCorners {...viewfinder} />
            <ScanLine viewfinderHeight={viewfinder.height} />
          </View>
          <Text
            testID="scanner-instruction"
            onLayout={handleInstructionLayout}
            accessibilityElementsHidden={isInstructionCovered}
            importantForAccessibility={isInstructionCovered ? 'no-hide-descendants' : 'auto'}
            style={[
              styles.instruction,
              { marginTop: viewfinder.height / 2 + INSTRUCTION_GAP },
              isInstructionCovered ? styles.covered : null
            ]}
          >
            {t('addCard.scanner.instruction')}
          </Text>
        </View>
      )}

      <FloatingBackButton onPress={onBack} style={backPosition} />

      {/* Brand pill (if brand context) */}
      {brandPill ? (
        <View
          testID="brand-pill-container"
          pointerEvents="box-none"
          onLayout={handlePillLayout}
          style={[styles.brandPillContainer, { top: pillTop }]}
        >
          {brandPill}
        </View>
      ) : null}

      {/* Processing indicator overlay */}
      {isProcessingImage ? (
        <View style={styles.processingOverlay} testID="image-processing-indicator">
          <ActivityIndicator size="large" color={CAMERA_OVERLAY.text} />
          <Text style={styles.processingText}>{t('addCard.scanner.processingImage')}</Text>
        </View>
      ) : null}

      {/* The bottom region: the banner and the action rows in one container — the overlay's ONE
          in-flow child, anchored by its `justifyContent: 'flex-end'`, never `position: absolute`
          (AC9). The banner sits 16pt above the rows because they share it, not by a measured
          offset (Story 16.30's outcome, kept). The region grows with the text, and scrolls once it
          reaches the ceiling the container's top padding sets. */}
      <ScrollView
        testID="scanner-bottom-region"
        onLayout={handleRegionLayout}
        style={styles.bottomRegion}
        contentContainerStyle={styles.bottomRegionContent}
        // At rest the content fits, and a drag must not rubber-band the rows off their place.
        alwaysBounceVertical={false}
      >
        {/* No-code-found banner. Still over the live feed, so the camera never stops. */}
        {imageError && onImageErrorDismiss ? (
          <View testID="no-code-found-banner-anchor">
            <NoCodeFoundBanner
              reason={imageErrorReason}
              onDismiss={onImageErrorDismiss}
              onRetry={onImageErrorRetry ?? onImageErrorDismiss}
              onManualEntry={onImageErrorManualEntry ?? onManualEntry}
            />
          </View>
        ) : null}

        {/* Bottom actions: scan from image (optional) + manual entry */}
        <View
          testID="scanner-bottom-actions"
          style={[styles.bottomActions, { paddingBottom: insets.bottom + SPACING.md }]}
        >
          {onImageScan ? (
            <>
              <FeedRow
                icon={ImageIcon}
                label={t('addCard.scanner.scanFromImage')}
                accessibilityLabel={t('addCard.scanner.scanFromImageAccessibilityLabel')}
                onPress={onImageScan}
                testID="scan-from-image-row"
              />
              <View testID="scanner-row-divider" style={styles.rowDivider} />
            </>
          ) : null}
          <FeedRow
            icon={KeyboardIcon}
            label={t('addCard.scanner.manualEntry')}
            accessibilityLabel={t('addCard.scanner.manualEntryAccessibilityLabel')}
            onPress={onManualEntry}
            testID="manual-entry-row"
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CAMERA_OVERLAY.ground,
    justifyContent: 'flex-end'
  },
  fill: {
    flex: 1
  },
  scrim: {
    backgroundColor: CAMERA_OVERLAY.scrim
  },
  brandPillContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: LAYOUT.screenHorizontalMargin,
    alignItems: 'center',
    zIndex: 10
  },
  viewfinderLayer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  // The beam, fixed rather than `theme.primary`: this line is drawn on the camera's black ground,
  // which no theme touches, and light-mode `primary` is ink. The design system requires it by
  // name — the beam rule's "read" half: "the same 2px #FCCC0C line is forbidden on barcode/[id]
  // and mandatory on add-card/scan", because here we are the scanner.
  beam: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 0,
    height: 2,
    borderRadius: 1,
    backgroundColor: IDENTITY_COLORS.beam
  },
  // Its top 64pt below the box's bottom edge: `top` puts it at the centre, where the box's middle
  // is, and the margin adds half the box and the gap. Semibold, because the frame's Inter 500 is
  // not bundled and the extra weight is what holds it over the feed.
  instruction: {
    ...TYPOGRAPHY.bodyMdStrong,
    ...ON_FEED_TEXT_SHADOW,
    position: 'absolute',
    top: '50%',
    left: LAYOUT.screenHorizontalMargin,
    right: LAYOUT.screenHorizontalMargin,
    textAlign: 'center',
    color: CAMERA_OVERLAY.text
  },
  // Beneath the bottom region: invisible, but laid out, so it keeps measuring itself.
  covered: {
    opacity: 0
  },
  bottomActions: {
    paddingHorizontal: LAYOUT.screenHorizontalMargin
  },
  // At least the touch target tall (16.33), growing with a label that wraps rather than clips; the
  // bottom region scrolls when the rows outgrow it.
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOUCH_TARGET.min,
    gap: SPACING.smMd
  },
  // Plain rows on the feed, with no shadow, as the frame has them.
  feedRowLabel: {
    ...TYPOGRAPHY.bodyLgStrong,
    flex: 1,
    color: CAMERA_OVERLAY.text
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: CAMERA_OVERLAY.divider,
    marginVertical: SPACING.xs
  },
  // As tall as its content, and no taller: a ScrollView grows by default, which would stretch the
  // region to the ceiling and float the rows up from the bottom. It shrinks, and so scrolls, only
  // once its content would pass the ceiling.
  bottomRegion: {
    flexGrow: 0,
    flexShrink: 1
  },
  // One container, the banner first, 16pt above the rows.
  bottomRegionContent: {
    gap: BANNER_GAP
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.smMd,
    zIndex: 20
  },
  processingText: {
    ...TYPOGRAPHY.bodyMdStrong,
    ...ON_FEED_TEXT_SHADOW,
    color: CAMERA_OVERLAY.text
  },
  // Centred between the top inset (added inline) and the footer.
  messageContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: LAYOUT.screenHorizontalMargin
  },
  messageTitle: {
    ...TYPOGRAPHY.headlineSm,
    textAlign: 'center',
    marginTop: SPACING.md
  },
  messageBody: {
    ...TYPOGRAPHY.bodyMd,
    textAlign: 'center',
    marginTop: SPACING.sm
  },
  pressed: {
    transform: [{ scale: PRESSED_SCALE }]
  }
});

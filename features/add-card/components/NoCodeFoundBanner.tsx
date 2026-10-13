/**
 * NoCodeFoundBanner
 * Story 2.9: Scan Cards from Image or Screenshot (AC6)
 * Story 16.23: says WHICH failure occurred instead of one message for all of them
 * Story 21.2: the banner stops reading theme tokens (see below)
 * Story 22.5: Capture frame E's plate — no icon, 24pt margins, 48pt targets
 *
 * Inline error banner shown when an image scan does not yield a usable barcode.
 * Auto-dismisses after 5 seconds. Positioned inside the scanner overlay.
 *
 * Every colour here is FIXED (`CAMERA_OVERLAY`), not themed, and that is the point. The banner
 * floats on a dark plate over a live camera feed, so it never sees the app's ground: its own
 * surface is dark in both schemes, and a token that flips with the theme resolves to ink in light
 * and disappears. The design system independently puts beam on exactly this surface — "the scan
 * line and the banner links on our own viewfinder" — because on the viewfinder WE are the ones
 * scanning, which is the half of the beam rule that says yes.
 *
 * It carries no icon: the plate and the sentence are the whole message. The amber warning
 * triangle it used to carry was decoration doing no work, in a colour outside the palette.
 */

import X from 'lucide-react-native/icons/x';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { CAMERA_OVERLAY, IDENTITY_COLORS } from '@/shared/theme/colors';
import { LAYOUT, SPACING, TOUCH_TARGET } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import type { ImageScanErrorReason } from '../hooks/useImageScan';

const AUTO_DISMISS_MS = 5000;

/**
 * The dismiss ×: an 18pt glyph, as the frame draws it, on a 48pt target of its own. Its 1.8 stroke
 * is the search field's clear × — the system's other 18pt × (`cardi-design-system.md` § _Icons_).
 */
const DISMISS_ICON_SIZE = 18;
const DISMISS_STROKE_WIDTH = 1.8;

/**
 * How far the ×'s 48pt target overhangs its 18pt glyph on every side. The target takes that back
 * in negative margins, so it occupies the glyph's slot — where the frame draws it, on the plate's
 * 16pt padding — and the plate does not grow. It still fits inside the plate: 15 < 16.
 */
const DISMISS_OVERHANG = (TOUCH_TARGET.min - DISMISS_ICON_SIZE) / 2;

/** A link's own padding, from the frame: 4pt above and below its 13pt line. */
const LINK_PADDING_Y = SPACING.xs;

/**
 * What each link's `hitSlop` adds above and below it so its target reaches 48pt: the link is
 * `captionMd`'s 18pt line plus 4 + 4 of padding.
 */
const LINK_SLOP_Y = (TOUCH_TARGET.min - (TYPOGRAPHY.captionMd.lineHeight + 2 * LINK_PADDING_Y)) / 2;

/** Tap feedback — the design system's 0.98× scale (§ _Elevation_). */
const PRESSED_SCALE = 0.98;

/**
 * Message key per failure reason (Story 16.23).
 *
 * A `Record` over the reason union rather than a conditional, so adding a reason
 * is a compile error here until a key is named for it.
 *
 * ⚠️ That is all it guarantees. It does NOT prove the copy exists in either
 * locale: this repo has no `i18next` module augmentation, so `t()`'s argument is
 * an unchecked `string` and a key naming a missing translation compiles happily.
 * Locale parity is gated separately, by `card-colors.test.ts`.
 */
const MESSAGE_KEY: Record<ImageScanErrorReason, string> = {
  notFound: 'addCard.noCodeFound.notFoundMessage',
  scanFailed: 'addCard.noCodeFound.scanFailedMessage',
  pickerFailed: 'addCard.noCodeFound.pickerFailedMessage'
};

/**
 * Retry-label override per reason.
 *
 * The shared label is "Try another image", which presumes a first image — false
 * for `pickerFailed`, where the picker never opened and nothing was selected. The
 * button's behaviour is identical in every case (it re-invokes the picker); only
 * the wording needs to stop claiming something that did not happen.
 */
const RETRY_KEY: Partial<Record<ImageScanErrorReason, string>> = {
  pickerFailed: 'addCard.noCodeFound.pickerFailedRetry'
};

interface NoCodeFoundBannerProps {
  /**
   * Which failure to describe. Defaults to `notFound` — the overwhelmingly
   * common case, and the one this banner was originally written for.
   */
  reason?: ImageScanErrorReason;
  onDismiss: () => void;
  onRetry: () => void;
  onManualEntry: () => void;
  testID?: string;
}

/** One of the banner's two text links, in beam, scaled 0.98 while pressed. */
const BannerLink: React.FC<{
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  testID: string;
}> = ({ label, accessibilityLabel, onPress, testID }) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      hitSlop={{ top: LINK_SLOP_Y, bottom: LINK_SLOP_Y }}
      style={[styles.link, isPressed ? styles.pressed : null]}
    >
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
};

export const NoCodeFoundBanner: React.FC<NoCodeFoundBannerProps> = ({
  reason = 'notFound',
  onDismiss,
  onRetry,
  onManualEntry,
  testID = 'no-code-found-banner'
}) => {
  const { t } = useTranslation();
  const [isDismissPressed, setIsDismissPressed] = useState(false);
  const message = t(MESSAGE_KEY[reason]);
  const retryLabel = t(RETRY_KEY[reason] ?? 'addCard.noCodeFound.retry');

  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <View
      testID={testID}
      accessibilityLiveRegion="polite"
      accessibilityLabel={message}
      style={styles.plate}
    >
      {/* The message, with the dismiss × at the plate's top right */}
      <View style={styles.messageRow}>
        <Text style={styles.message}>{message}</Text>
        <Pressable
          onPress={onDismiss}
          onPressIn={() => setIsDismissPressed(true)}
          onPressOut={() => setIsDismissPressed(false)}
          accessibilityRole="button"
          accessibilityLabel={t('addCard.noCodeFound.dismissAccessibilityLabel')}
          testID="banner-close"
          style={[styles.dismiss, isDismissPressed ? styles.pressed : null]}
        >
          <X
            testID="banner-close-icon"
            size={DISMISS_ICON_SIZE}
            strokeWidth={DISMISS_STROKE_WIDTH}
            color={CAMERA_OVERLAY.dismiss}
          />
        </Pressable>
      </View>

      {/* The two links. Their row's frame is stretched by each link's slop — padding taken back
          in negative margins, so the plate does not grow — because neither platform delivers a
          touch to a view's slop where it lies outside the view's parent: slop beyond the row's
          own bounds would never be hit. (An overflowing frame is hit-tested; the × relies on
          that.) And the row itself takes no touches, so where it overlaps the ×'s target, the ×
          still wins. */}
      <View testID={`${testID}-links`} pointerEvents="box-none" style={styles.linkRow}>
        <BannerLink
          label={retryLabel}
          accessibilityLabel={t('addCard.noCodeFound.retryAccessibilityLabel')}
          onPress={onRetry}
          testID="banner-retry-image"
        />
        <BannerLink
          label={t('addCard.noCodeFound.manualEntry')}
          accessibilityLabel={t('addCard.noCodeFound.manualEntryAccessibilityLabel')}
          onPress={onManualEntry}
          testID="banner-manual-entry"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  plate: {
    marginHorizontal: LAYOUT.screenHorizontalMargin,
    borderRadius: 12,
    backgroundColor: CAMERA_OVERLAY.plate,
    padding: SPACING.md
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.smMd
  },
  message: {
    ...TYPOGRAPHY.bodyMd,
    flex: 1,
    color: CAMERA_OVERLAY.text
  },
  dismiss: {
    width: TOUCH_TARGET.min,
    height: TOUCH_TARGET.min,
    margin: -DISMISS_OVERHANG,
    alignItems: 'center',
    justifyContent: 'center'
  },
  linkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: SPACING.md,
    // Wrapped (Italian on a narrow phone, or large text), the links stay a full slop band apart
    // above and below, so neither target overlaps — and steals the taps of — the other.
    rowGap: 2 * LINK_SLOP_Y,
    // 8pt below the message, measured to the row's layout box; the slop band sits inside it.
    marginTop: SPACING.sm - LINK_SLOP_Y,
    marginBottom: -LINK_SLOP_Y,
    paddingVertical: LINK_SLOP_Y
  },
  // The slop is vertical only, so a short label (Italian "Riprova") still needs 48pt of width.
  link: {
    minWidth: TOUCH_TARGET.min,
    paddingVertical: LINK_PADDING_Y
  },
  linkText: {
    ...TYPOGRAPHY.captionMd,
    color: IDENTITY_COLORS.beam
  },
  pressed: {
    transform: [{ scale: PRESSED_SCALE }]
  }
});

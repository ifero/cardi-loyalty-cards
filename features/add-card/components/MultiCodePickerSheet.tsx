/**
 * MultiCodePickerSheet
 * Story 2.9: Scan Cards from Image or Screenshot (AC5)
 * Story 22.1: Drawn by the shared BottomSheet (AC8)
 * Story 22.5: Capture frame D's rows and Cancel
 *
 * Bottom sheet shown when multiple barcodes are detected in a single image.
 * Displays up to 6 CodeRow items. One tap resolves and routes to setup.
 * Cancel, the scrim or the platform dismiss closes it without action.
 *
 * It used to be the one hand-rolled sheet in the app — its own Modal, scrim, 220 ms slide and
 * handle. The shared sheet now does all four, and took this sheet's slide as its own (the scrim
 * fades, the sheet slides) along with its 36 × 4 handle, which was the spec size all along. Frame
 * D's centred title, its own spacing and its flat black scrim yield to that shared sheet.
 *
 * The app does not know which code is the loyalty card, so it asks plainly and shows enough of each
 * — the value, the format — that the person can tell them apart at a glance. It does not guess and
 * it does not rank.
 */

import Barcode from 'lucide-react-native/icons/barcode';
import QrCode from 'lucide-react-native/icons/qr-code';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';

import type { BarcodeFormat } from '@/core/schemas';

import { BottomSheet } from '@/shared/components/ui/BottomSheet';
import { useTheme } from '@/shared/theme';
import { LAYOUT, SPACING, TOUCH_TARGET } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import { DetectedCode } from '../hooks/useImageScan';

/** Frame D's rows: 64pt, with room to grow when large text needs it. */
const CODE_ROW_HEIGHT = 64;

/** A decoded value longer than this is cut, with an ellipsis, on screen; its label keeps it whole. */
const MAX_SHOWN_VALUE_LENGTH = 28;

const ICON_SIZE = 24;
const ICON_STROKE_WIDTH = 1.5;

/** Tap feedback — the design system's 0.98× scale, never a fill or a shadow (§ _Elevation_). */
const PRESSED_SCALE = 0.98;

/**
 * Each format's display name, as a key. A `Record` over the whole union, so a new format is a
 * compile error here until it is named — there is no English fallback for a code nobody named.
 */
const FORMAT_NAME_KEY: Record<BarcodeFormat, string> = {
  CODE128: 'addCard.multiCode.formats.CODE128',
  EAN13: 'addCard.multiCode.formats.EAN13',
  EAN8: 'addCard.multiCode.formats.EAN8',
  QR: 'addCard.multiCode.formats.QR',
  CODE39: 'addCard.multiCode.formats.CODE39',
  UPCA: 'addCard.multiCode.formats.UPCA'
};

interface MultiCodePickerSheetProps {
  visible: boolean;
  codes: DetectedCode[];
  onSelect: (code: DetectedCode) => void;
  onDismiss: () => void;
  testID?: string;
}

interface CodeRowProps {
  code: DetectedCode;
  index: number;
  onPress: () => void;
}

/**
 * One detected code: its kind's glyph, then the value exactly as decoded with its format beneath.
 * The glyph is a plain icon, not a drawing of the bars — a strip that is not the code would be a
 * fake barcode.
 */
const CodeRow: React.FC<CodeRowProps> = ({ code, index, onPress }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [isPressed, setIsPressed] = useState(false);
  const Glyph = code.format === 'QR' ? QrCode : Barcode;
  const formatName = t(FORMAT_NAME_KEY[code.format]);
  const shownValue =
    code.value.length > MAX_SHOWN_VALUE_LENGTH
      ? `${code.value.slice(0, MAX_SHOWN_VALUE_LENGTH)}…`
      : code.value;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={t('addCard.multiCode.codeAccessibilityLabel', {
        format: formatName,
        value: code.value
      })}
      testID={`code-row-${index}`}
      style={[
        styles.codeRow,
        { borderBottomColor: theme.border },
        isPressed ? styles.pressed : null
      ]}
    >
      <Glyph
        testID={`code-row-${index}-icon`}
        size={ICON_SIZE}
        strokeWidth={ICON_STROKE_WIDTH}
        color={theme.textPrimary}
      />
      <View style={styles.codeLabels}>
        <Text style={[styles.codeValue, { color: theme.textPrimary }]}>{shownValue}</Text>
        <Text style={[styles.codeFormat, { color: theme.textSecondary }]}>{formatName}</Text>
      </View>
    </Pressable>
  );
};

/** Frame D's Cancel: plain centred text on a 48pt row, scaled 0.98 while pressed. */
const CancelRow: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={t('addCard.multiCode.cancelAccessibilityLabel')}
      testID="multi-code-cancel"
      style={[styles.cancelRow, isPressed ? styles.pressed : null]}
    >
      <Text style={[styles.cancelText, { color: theme.textPrimary }]}>
        {t('common.actions.cancel')}
      </Text>
    </Pressable>
  );
};

export const MultiCodePickerSheet: React.FC<MultiCodePickerSheetProps> = ({
  visible,
  codes,
  onSelect,
  onDismiss,
  testID = 'multi-code-picker-sheet'
}) => {
  const { t } = useTranslation();

  // The caller empties `codes` in the same render that closes the sheet, so the sheet keeps the
  // last list it showed: it slides out with its rows, rather than vanishing or collapsing first.
  const [shownCodes, setShownCodes] = useState(codes);
  if (codes.length > 0 && codes !== shownCodes) {
    setShownCodes(codes);
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onDismiss}
      title={t('addCard.multiCode.title')}
      description={t('addCard.multiCode.subtitle')}
      testID={testID}
    >
      {/* Code list — scrolls whenever its rows, which grow with the text, outrun the sheet's height
          cap; at rest it does not bounce */}
      <FlatList
        data={shownCodes}
        keyExtractor={(_, i) => String(i)}
        alwaysBounceVertical={false}
        style={styles.list}
        renderItem={({ item, index }) => (
          <CodeRow code={item} index={index} onPress={() => onSelect(item)} />
        )}
      />

      <CancelRow onPress={onDismiss} />
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  // Edge to edge: the list reaches past the sheet's padding, so the rows' rules span the sheet. A
  // negative margin on a row could not: the list's own scroll view clips its rows to its bounds.
  list: {
    marginHorizontal: -LAYOUT.screenHorizontalMargin
  },
  // The rows keep the sheet's margin inside them, so their content stays in line with the title.
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: CODE_ROW_HEIGHT,
    paddingHorizontal: LAYOUT.screenHorizontalMargin,
    gap: SPACING.md,
    borderBottomWidth: 1
  },
  codeLabels: {
    flex: 1
  },
  // The decoded value is a card number, so it takes the one mono token (Story 21.6 AC8).
  codeValue: {
    ...TYPOGRAPHY.monoCode
  },
  codeFormat: {
    ...TYPOGRAPHY.captionMd
  },
  cancelRow: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TOUCH_TARGET.min
  },
  cancelText: {
    ...TYPOGRAPHY.bodyLg
  },
  pressed: {
    transform: [{ scale: PRESSED_SCALE }]
  }
});

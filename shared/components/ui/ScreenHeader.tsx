/**
 * The header of a stack-pushed screen that draws its own (Story 22.7, moved out of `FormScreen`).
 *
 * Capture frame A's header, which the form pattern took in Story 22.6 and settings takes now
 * (`cardi-design-system.md` § _Forms_, § _Settings_): at least 48 tall with no rule; the back
 * chevron on a 48pt target, its drawn stroke — not the target — on the 24pt margin; the title in
 * `body-lg` semibold, centred, announced as the screen's heading and wrapping rather than clipping
 * under large text; and a 48pt spacer on the right that keeps the title centred. Home's 24pt display
 * title is the one exception, and it is the native header's.
 *
 * Like `FormScreen` and `HeaderIconButton`, this file imports nothing from `react-native-unistyles`
 * (Story 22.7's task): it follows this directory's pattern, its geometry in React Native's
 * `StyleSheet` and its colours from `useTheme()`.
 */

import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { LAYOUT, TOUCH_TARGET } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import { HeaderIconButton } from './HeaderIconButton';

/**
 * Where the back chevron's ink starts inside its 48pt target: `HeaderIconButton` centres a 24pt
 * glyph (12pt in), and Lucide's chevron-left draws its leftmost point at x = 9 of 24, less half of
 * its 1.5 stroke. The header pads by the rest of the 24pt margin, so the drawn stroke — not the
 * target — lands on the margin, as capture frame A draws it. Both sides pad the same, so the 48pt
 * spacer on the right keeps the title centred.
 */
const BACK_GLYPH_INK_INSET = (TOUCH_TARGET.min - 24) / 2 + 9 - 1.5 / 2;
const HEADER_PADDING_X = LAYOUT.screenHorizontalMargin - BACK_GLYPH_INK_INSET;

type ScreenHeaderProps = {
  /** The screen's title: centred, and announced as its heading. */
  title: string;
  /** The back chevron's action. A screen with unsaved changes asks before it leaves. */
  onBack: () => void;
  /** The header row's testID. */
  testID?: string;
  /** The title's testID; `<testID>-title` unless named. */
  titleTestID?: string;
  /** The back's testID; `<testID>-back` unless named. */
  backTestID?: string;
};

export const ScreenHeader = ({
  title,
  onBack,
  testID = 'screen-header',
  titleTestID,
  backTestID
}: ScreenHeaderProps) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View testID={testID} style={styles.header}>
      <HeaderIconButton
        icon={ChevronLeft}
        label={t('sharedUi.screenHeader.backAccessibilityLabel')}
        onPress={onBack}
        testID={backTestID ?? `${testID}-back`}
      />
      <Text
        testID={titleTestID ?? `${testID}-title`}
        accessibilityRole="header"
        style={[styles.title, { color: theme.textPrimary }]}
      >
        {title}
      </Text>
      <View style={styles.spacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  // At least 48, with no rule; it grows rather than clipping its title under large text.
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOUCH_TARGET.min,
    paddingHorizontal: HEADER_PADDING_X
  },
  title: {
    ...TYPOGRAPHY.bodyLgStrong,
    flex: 1,
    textAlign: 'center'
  },
  spacer: {
    width: TOUCH_TARGET.min
  }
});

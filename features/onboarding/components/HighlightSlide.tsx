import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/shared/theme';
import { LAYOUT, SPACING } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

type HighlightSlideProps = {
  title: string;
  description: string;
  /** The slide's drawing, 280 × 190. */
  illustration: React.ReactNode;
  testID?: string;
};

/** The drawing's distance below the Skip row. */
const DRAWING_TOP = 96;
/** The description's widest measure, so its lines stay short enough to read centred. */
const DESCRIPTION_MAX_WIDTH = 310;

/**
 * One highlight's page — frames D–F, as `cardi-design-system.md` § _Onboarding_ rules them (Story
 * 22.10): the drawing, then the title and the description, centred. The page scrolls, without
 * bouncing, once it outgrows the space between Skip and the footer under large text; the dots and
 * the action stay in the screen's footer.
 */
export const HighlightSlide = ({
  title,
  description,
  illustration,
  testID
}: HighlightSlideProps) => {
  const { theme } = useTheme();

  return (
    <ScrollView
      testID={testID}
      style={styles.scroll}
      contentContainerStyle={styles.content}
      alwaysBounceVertical={false}
    >
      {illustration}

      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>

      <Text style={[styles.description, { color: theme.textSecondary }]}>{description}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1
  },
  content: {
    alignItems: 'center',
    paddingTop: DRAWING_TOP,
    paddingHorizontal: LAYOUT.screenHorizontalMargin,
    paddingBottom: SPACING.lg
  },
  title: {
    ...TYPOGRAPHY.headlineMd,
    marginTop: SPACING.xxl,
    textAlign: 'center'
  },
  description: {
    ...TYPOGRAPHY.bodyMd,
    marginTop: SPACING.smMd,
    maxWidth: DESCRIPTION_MAX_WIDTH,
    textAlign: 'center'
  }
});

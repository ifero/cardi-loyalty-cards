import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { SPACING } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import { AppIconHeader } from './AppIconHeader';

type AuthBrandBlockProps = {
  /** The screen's heading: "Welcome Back". */
  heading: string;
  /** The sentence under it: "Sign in to sync your loyalty cards across devices". */
  subtitle: string;
  /**
   * A part of the subtitle set in `body-md` semibold `textPrimary` within the sentence — the code
   * screen's address, the thing worth checking (frame D). The sentence's words do not change.
   */
  emphasis?: string;
  headingTestID: string;
  subtitleTestID: string;
};

/** The subtitle, with its emphasised part, if any, set apart within the one sentence. */
const subtitleParts = (subtitle: string, emphasis: string | undefined, emphasisColour: string) => {
  const at = emphasis ? subtitle.indexOf(emphasis) : -1;
  if (!emphasis || at < 0) {
    return subtitle;
  }

  return [
    subtitle.slice(0, at),
    <Text key="emphasis" style={[styles.emphasis, { color: emphasisColour }]}>
      {emphasis}
    </Text>,
    subtitle.slice(at + emphasis.length)
  ];
};

/**
 * What leads every auth screen's body (`cardi-design-system.md` § _Authentication_, Story 22.9,
 * frames A–E): the mark, the heading and the subtitle, centred.
 *
 * - **The mark.** `AppIconHeader` as shipped: the 40pt mark in its 80pt ink circle, 32 above the
 *   heading. The frames' hand-built ì is a stand-in for it (Story 20.4).
 * - **The heading.** `headline-md` in `textPrimary`, announced as the screen's heading. The header
 *   above holds no title, so this is the screen's only heading.
 * - **The subtitle.** `body-md` in `textSecondary`, 8 below the heading.
 *
 * Both wrap under large text rather than clipping. `FormScreen` sets the 32 below the block.
 */
export const AuthBrandBlock = ({
  heading,
  subtitle,
  emphasis,
  headingTestID,
  subtitleTestID
}: AuthBrandBlockProps) => {
  const { theme } = useTheme();

  return (
    <View style={styles.block}>
      <AppIconHeader />
      <Text
        testID={headingTestID}
        accessibilityRole="header"
        style={[styles.heading, { color: theme.textPrimary }]}
      >
        {heading}
      </Text>
      <Text testID={subtitleTestID} style={[styles.subtitle, { color: theme.textSecondary }]}>
        {subtitleParts(subtitle, emphasis, theme.textPrimary)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    width: '100%'
  },
  heading: {
    ...TYPOGRAPHY.headlineMd,
    textAlign: 'center'
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMd,
    textAlign: 'center',
    marginTop: SPACING.sm
  },
  emphasis: {
    ...TYPOGRAPHY.bodyMdStrong
  }
});

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/theme';
import { LAYOUT, SPACING } from '@/shared/theme/spacing';

import { ScreenHeader } from './ScreenHeader';

type DocumentScreenProps = {
  /**
   * The screen's title: centred in the header and announced as its heading. The body never repeats
   * it (frames A–C).
   */
  title: string;
  /** The header's back. */
  onBack: () => void;
  /**
   * The root's testID, and the prefix of its parts': `-header`, and `-title` and `-back` unless
   * `titleTestID` and `backTestID` name them.
   */
  testID?: string;
  titleTestID?: string;
  backTestID?: string;
  /** The scrolling body's testID. */
  bodyTestID?: string;
  /** The document, top to bottom. */
  children: React.ReactNode;
};

/**
 * The document ground (`cardi-design-system.md` § _Documents_, Story 22.8): the one shape help,
 * the privacy policy and What We Collect take — settings' header, ground and scroll.
 *
 * - **Ground.** `background`, in a safe-area view on the top, left and right edges. The page
 *   scrolls on under the home indicator, so the bottom inset goes into its padding instead.
 * - **Header.** `ScreenHeader`: the back, and the title in `body-lg` semibold, centred and
 *   announced as the heading — the 17pt title of every stack-pushed screen, over the frames' 24.
 * - **Body.** A scroll view, its content padded 16 at the top, 24 at the sides, and 24 plus the
 *   bottom inset at the bottom. A press while the keyboard is up acts at once, as on the wallet.
 */
export const DocumentScreen = ({
  title,
  onBack,
  testID = 'document-screen',
  titleTestID,
  backTestID,
  bodyTestID,
  children
}: DocumentScreenProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      testID={testID}
      edges={['top', 'left', 'right']}
      style={[styles.root, { backgroundColor: theme.background }]}
    >
      <ScreenHeader
        title={title}
        onBack={onBack}
        testID={`${testID}-header`}
        titleTestID={titleTestID ?? `${testID}-title`}
        backTestID={backTestID ?? `${testID}-back`}
      />
      <ScrollView
        testID={bodyTestID}
        contentContainerStyle={[styles.content, { paddingBottom: SPACING.lg + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  // 16 below the header and 24 at the sides; the bottom adds the inset at the call site.
  content: {
    paddingTop: SPACING.md,
    paddingHorizontal: LAYOUT.screenHorizontalMargin
  }
});

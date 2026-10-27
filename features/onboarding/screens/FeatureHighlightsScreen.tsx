import { useRouter } from 'expo-router';
import type { AnimationObject } from 'lottie-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccessibilityInfo,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ListRenderItemInfo
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { completeFirstLaunch, isFirstLaunch } from '@/core/settings/settings-repository';

import { Button, PrimaryActionFooter } from '@/shared/components/ui';
import { useTheme } from '@/shared/theme';
import { LAYOUT, SPACING, TOUCH_TARGET } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import allCardsDark from '@/assets/animations/onboarding/onboarding-all-your-cards-dark.json';
import allCardsLight from '@/assets/animations/onboarding/onboarding-all-your-cards-light.json';
import scanOrTypeDark from '@/assets/animations/onboarding/onboarding-scan-or-type-dark.json';
import scanOrTypeLight from '@/assets/animations/onboarding/onboarding-scan-or-type-light.json';
import yourDataDark from '@/assets/animations/onboarding/onboarding-your-data-dark.json';
import yourDataLight from '@/assets/animations/onboarding/onboarding-your-data-light.json';

import { HighlightSlide } from '../components/HighlightSlide';
import { OnboardingAnimation } from '../components/OnboardingAnimation';
import { PaginationDots } from '../components/PaginationDots';
import { useHighlightPagination } from '../hooks/useHighlightPagination';

type Slide = {
  id: string;
  title: string;
  description: string;
  light: AnimationObject;
  dark: AnimationObject;
};

/**
 * The feature highlights — frames D–F, as `cardi-design-system.md` § _Onboarding_ rules them (Story
 * 22.10).
 *
 * No header: Skip at the top right. A paging carousel of three pages, each scrolling on its own
 * under large text, over the primary-action footer holding the dots and Next / "Let's go!". Each
 * page's drawing plays the first time its page is shown — on mount for the first; for the others at
 * once on Next, as the page slides in rather than once it settles, or when a swipe settles on it —
 * and rests from then on, so a swipe back finds it still (decision 1).
 */
const FeatureHighlightsScreen = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const slideWidth = Math.max(1, windowWidth);
  const router = useRouter();
  const flatListRef = React.useRef<FlatList<Slide>>(null);
  const { currentIndex, next, goTo, isLast, total } = useHighlightPagination();
  const slides = React.useMemo<Slide[]>(
    () => [
      {
        id: 'all-cards',
        title: t('onboarding.highlights.allCardsTitle'),
        description: t('onboarding.highlights.allCardsDescription'),
        light: allCardsLight,
        dark: allCardsDark
      },
      {
        id: 'scan-or-manual',
        title: t('onboarding.highlights.scanOrManualTitle'),
        description: t('onboarding.highlights.scanOrManualDescription'),
        light: scanOrTypeLight,
        dark: scanOrTypeDark
      },
      {
        id: 'your-data',
        title: t('onboarding.highlights.yourDataTitle'),
        description: t('onboarding.highlights.yourDataDescription'),
        light: yourDataLight,
        dark: yourDataDark
      }
    ],
    [t]
  );

  React.useEffect(() => {
    if (!isFirstLaunch()) {
      router.replace('/');
    }
  }, [router]);

  React.useEffect(() => {
    AccessibilityInfo.announceForAccessibility?.(t('onboarding.highlights.screenAnnouncement'));
  }, [t]);

  const finishOnboarding = () => {
    completeFirstLaunch();
    router.replace('/');
  };

  const handleNext = () => {
    if (isLast) {
      finishOnboarding();
      return;
    }

    const nextIndex = currentIndex + 1;
    next();
    flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  };

  const renderSlide = ({ item, index }: ListRenderItemInfo<Slide>) => (
    <View testID={`highlight-slide-${index}`} style={{ width: slideWidth, flex: 1 }}>
      <HighlightSlide
        title={item.title}
        description={item.description}
        illustration={
          <OnboardingAnimation
            testID={`highlight-illustration-${index}`}
            light={item.light}
            dark={item.dark}
            active={index === currentIndex}
          />
        }
        testID={`highlight-content-${index}`}
      />
    </View>
  );

  return (
    <View
      testID="feature-highlights-screen"
      style={[styles.root, { backgroundColor: theme.background }]}
    >
      <View
        testID="highlights-skip-row"
        style={[styles.skipRow, { paddingTop: insets.top + SPACING.sm }]}
      >
        <Pressable
          testID="highlights-skip"
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.highlights.skipAccessibilityLabel')}
          onPress={finishOnboarding}
          style={styles.skip}
        >
          <Text style={[styles.skipLabel, { color: theme.link }]}>
            {t('onboarding.highlights.skip')}
          </Text>
        </Pressable>
      </View>

      <View
        style={styles.carousel}
        accessibilityRole="adjustable"
        accessibilityHint={t('onboarding.highlights.swipeAccessibilityHint')}
      >
        <FlatList
          ref={flatListRef}
          testID="highlights-flatlist"
          horizontal
          pagingEnabled
          data={slides}
          // Each page's drawing follows the shown page, which `renderItem` reads.
          extraData={currentIndex}
          keyExtractor={(item) => item.id}
          renderItem={renderSlide}
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: slideWidth, offset: slideWidth * index, index })}
          onScrollToIndexFailed={() => {
            goTo(currentIndex + 1);
          }}
          onMomentumScrollEnd={(event) => {
            const width = event.nativeEvent.layoutMeasurement.width;
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            goTo(index);
          }}
        />
      </View>

      <PrimaryActionFooter testID="highlights-footer">
        <View testID="highlights-footer-actions" style={styles.footerStack}>
          <PaginationDots total={total} current={currentIndex} testID="pagination-dots" />
          <Button
            variant="primary"
            size="large"
            onPress={handleNext}
            testID="highlight-next-button"
          >
            {isLast ? t('onboarding.highlights.letsGo') : t('onboarding.highlights.next')}
          </Button>
        </View>
      </PrimaryActionFooter>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  skipRow: {
    paddingHorizontal: LAYOUT.screenHorizontalMargin,
    alignItems: 'flex-end'
  },
  // Its label ends on the margin.
  skip: {
    minHeight: TOUCH_TARGET.min,
    minWidth: TOUCH_TARGET.min,
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  skipLabel: {
    ...TYPOGRAPHY.bodyMdStrong
  },
  carousel: {
    flex: 1
  },
  // The dots sit 24 above the action.
  footerStack: {
    gap: SPACING.lg
  }
});

export default FeatureHighlightsScreen;

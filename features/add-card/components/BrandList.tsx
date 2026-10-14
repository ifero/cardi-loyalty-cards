/**
 * BrandList Component
 * Story 13.4: Restyle Add Card Flow (AC1, AC2)
 * Story 22.5: Capture frame A — each section's rows in one outlined surface
 *
 * The scrolling part of the Card Type Selection screen; the search field above it stays pinned.
 * Default: POPULAR CARDS, then ALL CARDS with "Other card" as its last row. While searching: one
 * RESULTS surface holding the matches with "Other card" as its last row, then a line saying what
 * the results are — or that there are none.
 *
 * Each section is a `SectionHeader` 24pt below the field or the surface above it and 8pt above its
 * rows, which sit in one hairline-outlined `Surface` divided by full-width rules. The list's
 * content ends 24pt above the bottom inset, and scrolls under the home indicator to get there.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SectionHeader } from '@/shared/components/ui/SectionHeader';
import { Surface } from '@/shared/components/ui/Surface';
import { useTheme } from '@/shared/theme';
import { LAYOUT, SPACING } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import { CatalogueBrand } from '@/catalogue/types';

import { BrandRow } from './BrandRow';
import { OtherCardRow } from './OtherCardRow';

interface BrandListSection {
  key: 'popular' | 'all' | 'results';
  title: string;
  brands: CatalogueBrand[];
  /** "Other card" is the section's last row (Decided, 2026-10-12: as frame A draws it). */
  endsWithOtherCard: boolean;
}

interface BrandListProps {
  isSearching: boolean;
  query: string;
  popularBrands: CatalogueBrand[];
  allBrands: CatalogueBrand[];
  filteredBrands: CatalogueBrand[];
  onBrandPress: (brand: CatalogueBrand) => void;
  onOtherCardPress: () => void;
  testID?: string;
}

export const BrandList: React.FC<BrandListProps> = ({
  isSearching,
  query,
  popularBrands,
  allBrands,
  filteredBrands,
  onBrandPress,
  onOtherCardPress,
  testID = 'brand-list'
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const sections: BrandListSection[] = isSearching
    ? [
        {
          key: 'results',
          title: t('addCard.list.results'),
          brands: filteredBrands,
          endsWithOtherCard: true
        }
      ]
    : [
        {
          key: 'popular',
          title: t('addCard.list.popularCards'),
          brands: popularBrands,
          endsWithOtherCard: false
        },
        {
          key: 'all',
          title: t('addCard.list.allCards'),
          brands: allBrands,
          endsWithOtherCard: true
        }
      ];

  return (
    <ScrollView
      testID={testID}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: SPACING.lg + insets.bottom }}
    >
      {sections
        // A section with nothing to show draws no header over an empty outline.
        .filter((section) => section.brands.length > 0 || section.endsWithOtherCard)
        .map((section) => (
          <View
            key={section.key}
            testID={`${testID}-${section.key}-section`}
            style={styles.section}
          >
            <SectionHeader title={section.title} />
            <Surface divided testID={`${testID}-${section.key}`}>
              {section.brands.map((brand) => (
                <BrandRow
                  key={brand.id}
                  brand={brand}
                  onPress={onBrandPress}
                  testID={`brand-row-${brand.id}`}
                />
              ))}
              {section.endsWithOtherCard ? (
                <OtherCardRow key="other-card" onPress={onOtherCardPress} />
              ) : null}
            </Surface>
          </View>
        ))}

      {isSearching ? (
        filteredBrands.length === 0 ? (
          <Text
            testID={`${testID}-no-results`}
            style={[styles.note, styles.noResults, { color: theme.textSecondary }]}
          >
            {t('addCard.list.noCardsFound')}
          </Text>
        ) : (
          <Text
            testID={`${testID}-results-note`}
            style={[styles.note, { color: theme.textTertiary }]}
          >
            {t('addCard.list.showingResults', { query })}
          </Text>
        )
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingTop: SPACING.lg,
    paddingHorizontal: LAYOUT.screenHorizontalMargin,
    gap: SPACING.sm
  },
  // The two lines under RESULTS keep their copy, on the 24pt margin.
  note: {
    ...TYPOGRAPHY.bodyMd,
    paddingTop: SPACING.lg,
    paddingHorizontal: LAYOUT.screenHorizontalMargin
  },
  noResults: {
    textAlign: 'center'
  }
});

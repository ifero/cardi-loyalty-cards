/**
 * CardTypeSelectionScreen
 * Story 13.4: Restyle Add Card Flow (AC1, AC2, T2)
 * Story 22.5: Capture frame A — the header, the pinned search field, the outlined sections
 *
 * First screen in the add-card flow. Shows a searchable brand list with
 * popular cards, all catalogue brands, and "Other card" option.
 * Navigation: Brand tap → BrandScannerScreen, Other card → BrandScannerScreen (custom)
 *
 * Our furniture — the ground, white surfaces, hairlines, ink type — stays quiet, so the brand
 * colours in the list carry the page. The header is 48pt with no rule: the back chevron, "Add
 * Card" centred, and a 48pt spacer on the right that keeps it centred. The search field sits 16pt
 * below it, pinned; only the list scrolls.
 */

import { router } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet, AccessibilityInfo, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/theme';
import { SPACING, LAYOUT, TOUCH_TARGET } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import { HeaderIconButton } from '@/features/cards/components/HeaderIconButton';
import { SearchBar } from '@/features/cards/components/SearchBar';

import { CatalogueBrand } from '@/catalogue/types';

import { BrandList } from '../components/BrandList';
import { useBrandSearch } from '../hooks/useBrandSearch';

/**
 * Where the back chevron's ink starts inside its 48pt target: `HeaderIconButton` centres a 24pt
 * glyph (12pt in), and Lucide's chevron-left draws its leftmost point at x = 9 of 24, less half of
 * its 1.5 stroke. The header pads by the rest of the 24pt margin, so the drawn stroke — not the
 * target — lands on the margin, as frame A draws it. Both sides pad the same, so the 48pt spacer on
 * the right keeps the title centred.
 */
const BACK_GLYPH_INK_INSET = (TOUCH_TARGET.min - 24) / 2 + 9 - 1.5 / 2;
const HEADER_PADDING_X = LAYOUT.screenHorizontalMargin - BACK_GLYPH_INK_INSET;

export const CardTypeSelectionScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { query, setQuery, isSearching, popularBrands, allBrands, filteredBrands, clearSearch } =
    useBrandSearch();

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility?.(t('addCard.selection.screenAnnouncement'));
  }, [t]);

  const handleBrandPress = useCallback((brand: CatalogueBrand) => {
    router.push({
      pathname: '/add-card/scan',
      params: {
        brandId: brand.id,
        brandName: brand.name,
        brandColor: brand.color,
        brandLogo: brand.logo
      }
    });
  }, []);

  const handleOtherCardPress = useCallback(() => {
    router.push({
      pathname: '/add-card/scan',
      params: { mode: 'custom' }
    });
  }, []);

  const handleBackPress = useCallback(() => {
    router.back();
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Header */}
      <View testID="card-type-selection-header" style={styles.header}>
        <HeaderIconButton
          icon={ChevronLeft}
          label={t('addCard.selection.backAccessibilityLabel')}
          onPress={handleBackPress}
          testID="back-button"
        />
        <Text accessibilityRole="header" style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {t('addCard.selection.heading')}
        </Text>
        <View testID="card-type-selection-header-spacer" style={styles.headerSpacer} />
      </View>

      {/* Search field — pinned: only the list below it scrolls */}
      <View testID="card-type-selection-search" style={styles.searchContainer}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onClear={clearSearch}
          testID="brand-search-bar"
          placeholder={t('addCard.search.placeholder')}
          accessibilityLabel={t('addCard.search.accessibilityLabel')}
          clearAccessibilityLabel={t('addCard.search.clearAccessibilityLabel')}
        />
      </View>

      {/* Brand list */}
      <BrandList
        isSearching={isSearching}
        popularBrands={popularBrands}
        allBrands={allBrands}
        filteredBrands={filteredBrands}
        query={query}
        onBrandPress={handleBrandPress}
        onOtherCardPress={handleOtherCardPress}
        testID="brand-list"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  // 48pt with no rule; it grows rather than clipping its title under large text.
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOUCH_TARGET.min,
    paddingHorizontal: HEADER_PADDING_X
  },
  headerTitle: {
    ...TYPOGRAPHY.bodyLgStrong,
    flex: 1,
    textAlign: 'center'
  },
  headerSpacer: {
    width: TOUCH_TARGET.min
  },
  searchContainer: {
    paddingHorizontal: LAYOUT.screenHorizontalMargin,
    paddingTop: SPACING.md
  }
});

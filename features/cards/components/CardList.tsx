/**
 * CardList Component
 * Story 13.2: Restyle Home Screen (AC1, AC3, AC5, AC6, AC10)
 * Story 16.22: Fix card-grid tile overlap on narrow screens (AC1, AC2, AC3, AC10)
 * Story 22.2: The four Cardì wallet frames
 *
 * 2-column FlashList grid with search and sort, plus the single-card and
 * empty states.
 */

import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  RefreshControl,
  useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoyaltyCard } from '@/core/schemas';

import { SearchBar } from '@/shared/components/ui/SearchBar';
import { useCloudSync } from '@/shared/hooks/useCloudSync';
import { useTheme } from '@/shared/theme';
import { SPACING } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import { CardTile } from './CardTile';
import { EmptyState } from './EmptyState';
import { SortFilterRow } from './SortFilterRow';
import { useCards } from '../hooks/useCards';
import { useCardSearch } from '../hooks/useCardSearch';
import { useCardSort } from '../hooks/useCardSort';
import {
  GUTTER,
  LIST_CONTENT_PADDING,
  NUM_COLUMNS,
  getGridTileHeight,
  getGridTileWidth,
  getSingleTileHeight,
  getSingleTileWidth
} from '../utils/gridLayout';

/** How far below the controls the no-results line sits (frame D). */
const NO_RESULTS_OFFSET = 80;

/**
 * FlashList 2 anchors the first visible item whenever its data changes ("maintain visible content
 * position", on by default). A search is a data change: clearing one that had narrowed the wallet
 * to two cards kept the first match in place and scrolled the search field off the screen (seen on
 * device, Story 22.2). The wallet never inserts items above the viewport, so the anchoring is
 * switched off — FlashList's own documented fix for "data re-ordering can cause items to move".
 */
const KEEP_SCROLL_OFFSET = { disabled: true } as const;

/**
 * CardList Component
 *
 * The four wallet frames (`docs/design/cardi/frames/cardi-wallet-frames.html`):
 * - Empty (0 cards): `EmptyState` — type, then the add-card footer; no search, no sort
 * - Single (1 card): the enlarged centred tile with its tip; no search, no sort
 * - Populated (2+ cards): SearchBar + SortFilterRow, then a fixed 2-column FlashList
 *   grid (the column COUNT has no responsive breakpoint; the tile WIDTH is derived
 *   from the viewport — see utils/gridLayout.ts)
 * - No results: the same controls, then one line in the list's empty slot
 * - 16pt screen margins, 16pt gutters at every width, spent as
 *   LIST_CONTENT_PADDING on the list plus GUTTER / 2 on each tile wrapper
 * - Pull-to-refresh for cloud sync in the empty, single-card and grid states
 *
 * The grid geometry lives in utils/gridLayout.ts. Those values are intentionally
 * local to this feature and differ from the shared/theme/spacing LAYOUT tokens
 * used by other screens — the repo is canonical for design (see
 * docs/design/CONTRIBUTING-DESIGN.md). (Historical breadcrumb: originally derived
 * from Figma node 52:64 — Figma is now ideation-only.)
 */
export const CardList: React.FC<{
  highlightCardId?: string | null;
  /** Called once the just-added card's ring has ended, so its highlight can be cleared. */
  onHighlightEnd?: () => void;
}> = ({ highlightCardId, onHighlightEnd }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { cards, isLoading, error, refetch } = useCards();
  const { forceSync } = useCloudSync();
  const [isRefreshing, setIsRefreshing] = useState(false);
  // ONE subscription for the whole list. Never move this into CardTile — that
  // would create one subscription per rendered tile.
  const { width: windowWidth } = useWindowDimensions();

  const { searchQuery, setSearchQuery, clearSearch, filterCards } = useCardSearch();
  const { sortOption, setSortOption, sortCards, sortLabel, sortLabels } = useCardSort();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await forceSync();
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [forceSync, refetch]);

  // Refresh cards when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Derive data unconditionally (hooks must run on every render)
  const filtered = filterCards(cards);
  const sorted = sortCards(filtered);
  const totalCount = cards.length;

  // Tile geometry, derived from the viewport so a tile always fits the cell
  // FlashList assigns it. Exactly 171 x 140 at the 390 dp design reference width.
  const gridTile = useMemo(() => {
    const width = getGridTileWidth(windowWidth);
    return { width, height: getGridTileHeight(width) };
  }, [windowWidth]);

  const singleTile = useMemo(() => {
    const width = getSingleTileWidth(windowWidth);
    return { width, height: getSingleTileHeight(width) };
  }, [windowWidth]);

  const noResultsElement = useMemo(
    () => (
      <View style={styles.noResults}>
        <Text style={[styles.noResultsText, { color: theme.textSecondary }]}>
          {/* Trimmed, as the search itself is, so a trailing space never lands inside the quotes. */}
          {t('cards.home.noResults', { query: searchQuery.trim() })}
        </Text>
      </View>
    ),
    [searchQuery, t, theme.textSecondary]
  );

  const renderItem = useCallback(
    ({ item }: { item: LoyaltyCard }) => (
      <View style={styles.tileWrapper}>
        <CardTile
          card={item}
          highlighted={item.id === highlightCardId}
          onHighlightEnd={onHighlightEnd}
          tileWidth={gridTile.width}
          tileHeight={gridTile.height}
        />
      </View>
    ),
    [highlightCardId, onHighlightEnd, gridTile.width, gridTile.height]
  );

  // One pull-to-refresh for every state, tinted alike. `tintColor` is iOS's; `colors` and
  // `progressBackgroundColor` are Android's, whose spinner sits on a disc — the surface, so the
  // beam spinner of dark mode is drawn on ink, never on white.
  const refreshControl = (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
      tintColor={theme.primary}
      colors={[theme.primary]}
      progressBackgroundColor={theme.surface}
    />
  );

  // ---- Loading state ----
  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // ---- Error state ----
  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ ...TYPOGRAPHY.bodyMd, color: theme.textSecondary }}>{error}</Text>
      </View>
    );
  }

  // ---- Empty state (frame B): no search and no sort below two cards ----
  if (totalCount === 0) {
    return <EmptyState refreshControl={refreshControl} />;
  }

  // ---- Single-card state (frame C) ----
  if (totalCount === 1) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={[styles.singleCardContainer, { paddingBottom: insets.bottom }]}
        refreshControl={refreshControl}
      >
        <CardTile
          card={cards[0]!}
          enlarged
          highlighted={cards[0]!.id === highlightCardId}
          onHighlightEnd={onHighlightEnd}
          tileWidth={singleTile.width}
          tileHeight={singleTile.height}
        />
        <Text style={[styles.singleCardTip, { color: theme.textSecondary }]}>
          {t('cards.home.singleCardTip')}
        </Text>
      </ScrollView>
    );
  }

  // ---- Two or more cards (frames A and D): the controls, then the grid ----
  // The header stays when a search matches nothing — FlashList renders it with or
  // without data — so the field keeps its value and the count reads 0.
  const listHeader = (
    <View style={styles.headerContainer}>
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} onClear={clearSearch} />
      <SortFilterRow
        cardCount={filtered.length}
        sortOption={sortOption}
        onSortChange={setSortOption}
        sortLabel={sortLabel}
        sortLabels={sortLabels}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlashList
        testID="card-list-flashlist"
        data={sorted}
        renderItem={renderItem}
        numColumns={NUM_COLUMNS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom }]}
        showsVerticalScrollIndicator={false}
        // While the search keyboard is up, the first tap on the clear ×, the sort button or a tile
        // acts, rather than only dismissing the keyboard.
        keyboardShouldPersistTaps="handled"
        maintainVisibleContentPosition={KEEP_SCROLL_OFFSET}
        ListHeaderComponent={listHeader}
        // With two or more cards, the list is empty only when a search matched nothing.
        ListEmptyComponent={noResultsElement}
        refreshControl={refreshControl}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  listContent: {
    // Only the remainder of the 16 pt screen margin — the rest is on each
    // tileWrapper below, so two adjacent wrappers form the 16 pt gutter while the
    // outer edges still total 16 pt. FlashList measures its cells from a probe view
    // inside this container, so this padding is part of the cell-width arithmetic.
    paddingHorizontal: LIST_CONTENT_PADDING,
    // The frame's 8 pt between the header and the search field. The bottom takes the
    // safe-area inset at the call site, so the last row clears the home indicator.
    paddingTop: SPACING.sm
  },
  headerContainer: {
    // Restores the 16 pt visual margin for SearchBar + SortFilterRow, which sit in
    // the same content container but have no tileWrapper of their own. No gaps: the
    // sort row is the touch target tall, which sets its text about 16 pt from the
    // field above and from the grid below.
    paddingHorizontal: GUTTER / 2
  },
  tileWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: GUTTER / 2,
    marginBottom: GUTTER
  },
  // Frame C: the tile 32 pt below the header, its name 8 pt below it, the tip 16 pt below that.
  singleCardContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: SPACING.xl
  },
  singleCardTip: {
    ...TYPOGRAPHY.bodyMd,
    marginTop: SPACING.md,
    textAlign: 'center'
  },
  // Frame D: one line, top-aligned 80 pt below the controls — a search miss is not an
  // error, so nothing else, and nothing centred in the empty space.
  noResults: {
    paddingTop: NO_RESULTS_OFFSET,
    paddingHorizontal: GUTTER / 2
  },
  noResultsText: {
    ...TYPOGRAPHY.bodyMd,
    textAlign: 'center'
  }
});

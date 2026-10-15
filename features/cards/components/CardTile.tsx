/**
 * CardTile Component
 * Story 13.2: Restyle Home Screen (AC1, AC7, AC9)
 * Story 16.22: Fix card-grid tile overlap on narrow screens (AC1, AC5, AC9)
 * Story 21.2: Migrate the colour tokens to Ink & Beam (AC8, AC9)
 * Story 22.1: Composes the shared `Tile` primitive (AC1, AC3)
 * Story 22.6: Shares the mark it draws (`CardTileMark`), so card setup's preview draws the same one
 *
 * The WALLET's tile: binds a `LoyaltyCard` to the design system's card tile.
 * This file decides WHAT goes on the tile — the brand hex and logo for a
 * catalogue card, the accent and first-letter avatar for a custom card, the
 * favourite badge, the route it opens. `shared/components/ui/Tile` decides how a
 * tile LOOKS: flat, a hairline instead of a shadow, a 0.98× press, the name below.
 *
 * Sizing is supplied by the parent (`CardList`), which derives it from the
 * viewport via `utils/gridLayout`. The constants below are the design reference
 * at 390 dp and the fallback for callers that pass no size — they are NOT a
 * viewport-independent layout width. See gridLayout.ts for why that distinction
 * is the whole bug.
 *
 * The tile's own children follow the same rule: the two centred fallback plates
 * (brand abbreviation, first-letter avatar) are sized from the tile and capped so
 * they clear the right-pinned favourite badge, which stays fixed for legibility.
 * `gridLayout.getFallbackChildMetrics` owns that arithmetic.
 */

import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet } from 'react-native';

import { LoyaltyCard } from '@/core/schemas';

import { FavouriteBadge, Tile, getTileAppearance } from '@/shared/components/ui/Tile';
import { CARD_COLORS, DEFAULT_CARD_COLOR_HEX } from '@/shared/theme/colors';
import { MONOGRAM_TEXT_PROPS, monogram } from '@/shared/theme/typography';

import type { CatalogueBrand } from '@/catalogue/types';

import { BrandLogo } from './BrandLogo';
import { useBrandLogo } from '../hooks/useBrandLogo';
import { getBrandLogo } from '../utils/brandLogos';
import {
  AVATAR_SIZE,
  BADGE_INSET,
  BADGE_SIZE,
  LOGO_SLOT_SIZE,
  SINGLE_TILE_HEIGHT,
  SINGLE_TILE_RADIUS,
  SINGLE_TILE_WIDTH,
  TILE_HEIGHT,
  TILE_RADIUS,
  TILE_WIDTH,
  getFallbackChildMetrics
} from '../utils/gridLayout';

/**
 * Design reference tile dimensions (pt) at 390 dp, re-exported so this
 * component's public surface is unchanged. Canonical home: utils/gridLayout.ts.
 */
export {
  TILE_WIDTH,
  TILE_HEIGHT,
  TILE_RADIUS,
  SINGLE_TILE_WIDTH,
  SINGLE_TILE_HEIGHT,
  SINGLE_TILE_RADIUS
};

type CardTileMarkProps = {
  /** The card's catalogue brand, or none for a custom card. */
  brand: CatalogueBrand | undefined;
  /** The card's name: a custom card's initial is its first letter. */
  name: string;
  /** The tile the mark is drawn in: the logo takes 85 % of it, and the plates are sized from it. */
  tileWidth: number;
  tileHeight: number;
  /** The glyph colour, from the fill by the tile's own legibility rules (`getTileAppearance`). */
  color: string;
};

/**
 * The mark inside a card's tile: the brand's logo at 85 % of the tile; for a brand with no logo,
 * its two-letter plate; for a custom card, its first-letter avatar. The wallet's tile and card
 * setup's preview of the card being added both draw it, so the preview is the card exactly as it
 * will look in the wallet.
 *
 * The two centred fallback plates track the tile and are capped so they cannot reach the
 * right-pinned favourite badge; the glyph inside holds 18 pt unless the plate becomes too small for
 * it. Only one branch renders, so only its reference size is needed: a brand means the abbreviation
 * slot, no brand means the first-letter avatar. See gridLayout.getFallbackChildMetrics.
 *
 * That cap does NOT apply to the logo: at 85 % of the tile it has always run under the badge
 * (145 pt of 171 at the design reference). That overlap is pre-existing and accepted — the badge's
 * opaque plate reads fine over a largely transparent logo, where two translucent plates would not.
 */
export const CardTileMark = ({ brand, name, tileWidth, tileHeight, color }: CardTileMarkProps) => {
  const logo = brand ? getBrandLogo(brand.logo) : undefined;

  if (logo) {
    return (
      <BrandLogo
        source={logo}
        width={Math.round(tileWidth * 0.85)}
        height={Math.round(tileHeight * 0.85)}
        color={color}
      />
    );
  }

  const fallback = getFallbackChildMetrics(tileWidth, brand ? LOGO_SLOT_SIZE : AVATAR_SIZE);

  return brand ? (
    /* Catalogue card without SVG: brand name abbreviation fallback */
    <View style={[styles.logoSlot, { width: fallback.size, height: fallback.size }]}>
      <Text {...MONOGRAM_TEXT_PROPS} style={{ ...monogram(fallback.fontSize), color }}>
        {brand.name.substring(0, 2).toUpperCase()}
      </Text>
    </View>
  ) : (
    /* Custom card: first-letter circular avatar */
    <View style={[styles.avatarCircle, { width: fallback.size, height: fallback.size }]}>
      <Text {...MONOGRAM_TEXT_PROPS} style={{ ...monogram(fallback.fontSize), color }}>
        {name.trim().charAt(0).toUpperCase() || 'C'}
      </Text>
    </View>
  );
};

interface CardTileProps {
  /** The loyalty card to display */
  card: LoyaltyCard;
  /** Enlarged single-card mode */
  enlarged?: boolean;
  /** Beam border highlight for newly added card (fades after 2s) */
  highlighted?: boolean;
  /** Called once the highlight ring has ended, so the wallet can clear it and never replay it. */
  onHighlightEnd?: () => void;
  /**
   * Applied tile width (pt), derived from the viewport by the parent.
   * Omit to fall back to the design reference constant.
   */
  tileWidth?: number;
  /** Applied tile height (pt). Omit to fall back to the design reference constant. */
  tileHeight?: number;
}

/**
 * CardTile Component
 *
 * - Grid mode: viewport-derived width at the 171:140 ratio, 16pt radius
 *   (exactly 171x140pt at the 390 dp design reference width)
 * - Enlarged (single-card) mode: 220x180pt with 20pt radius
 * - Brand hex background + centered logo / first-letter avatar
 * - Card name below tile (not inside the shell)
 * - Flat: no shadow; a light brand takes the 1pt hairline, and a near-black
 *   brand takes the #3A3A48 one in dark mode (Story 22.1, AC3)
 */
export const CardTile: React.FC<CardTileProps> = ({
  card,
  enlarged = false,
  highlighted = false,
  onHighlightEnd,
  tileWidth: tileWidthProp,
  tileHeight: tileHeightProp
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const brand = useBrandLogo(card.brandId);

  const handlePress = () => {
    router.push(`/card/${card.id}`);
  };

  // Applied size comes from the parent (viewport-derived). The constants are the
  // fallback for callers that pass no size — never a viewport-independent width.
  const tileWidth = tileWidthProp ?? (enlarged ? SINGLE_TILE_WIDTH : TILE_WIDTH);
  const tileHeight = tileHeightProp ?? (enlarged ? SINGLE_TILE_HEIGHT : TILE_HEIGHT);
  // Radius is fixed by design and deliberately does not scale with the tile.
  const tileRadius = enlarged ? SINGLE_TILE_RADIUS : TILE_RADIUS;

  // Resolve background color: brand hex for catalogue, card palette color for custom
  const backgroundColor = brand ? brand.color : (CARD_COLORS[card.color] ?? DEFAULT_CARD_COLOR_HEX);
  // The same luminance rules the tile uses for its outline, so the glyph colour
  // and the outline can never disagree about what a brand colour is.
  const { foreground: foregroundColor } = getTileAppearance(backgroundColor);

  return (
    <Tile
      fill={backgroundColor}
      width={tileWidth}
      height={tileHeight}
      radius={tileRadius}
      label={card.name}
      highlighted={highlighted}
      onHighlightEnd={onHighlightEnd}
      onPress={handlePress}
      // The badge is drawn, not spoken, so a favourite says so in the tile's own name.
      accessibilityLabel={
        card.isFavorite
          ? t('cards.home.cardTileFavouriteAccessibilityLabel', { name: card.name })
          : card.name
      }
      accessibilityHint={t('cards.home.cardTileAccessibilityHint')}
      badge={
        /* Favourite badge (Story 9.2 — AC2, recoloured in Story 21.2 — AC9): shown
           only when pinned. Its size and inset come from gridLayout rather than
           from the primitive, because the same two numbers define the keep-out
           that the fallback plates below are capped against. */
        card.isFavorite ? (
          <FavouriteBadge size={BADGE_SIZE} inset={BADGE_INSET} testID="favourite-badge" />
        ) : undefined
      }
    >
      <CardTileMark
        brand={brand}
        name={card.name}
        tileWidth={tileWidth}
        tileHeight={tileHeight}
        color={foregroundColor}
      />
    </Tile>
  );
};

const styles = StyleSheet.create({
  // `width`/`height` for both fallback plates, and the monogram size inside them, are
  // applied inline from getFallbackChildMetrics(), because they depend on the tile. The
  // reference values (64 / 48 / 18 pt at a 171 pt tile) live in gridLayout.ts as the
  // ratio source.
  logoSlot: {
    // Fixed, like TILE_RADIUS — it degrades to a circle if the plate ever gets small
    // enough for that to bite, which is a graceful failure rather than a broken one.
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarCircle: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center'
  }
});

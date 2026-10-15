/**
 * Card Details Screen
 * Story 13.3: Restyle Card Detail Screen (AC5)
 * Story 21.2: Migrate the colour tokens to Ink & Beam (AC7, AC9)
 * Story 22.3: Card Detail — the four Cardì card-detail frames
 *
 * Displays full details of a loyalty card with:
 * - a transparent native bar over the card's own field, which blends to the ground colour once the
 *   hero has scrolled away (`CardDetailHeader`)
 * - the hero, the barcode with its fullscreen overlay, the details and the Manage actions
 *   (`CardDetails`)
 */

import { useHeaderHeight } from '@react-navigation/elements';
import { useLocalSearchParams, Stack, useFocusEffect, useIsFocused, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Star from 'lucide-react-native/icons/star';
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { getCardById } from '@/core/database';
import { LoyaltyCard } from '@/core/schemas';
import { logger } from '@/core/utils/logger';

import { HeaderIconButton } from '@/shared/components/ui/HeaderIconButton';
import { useTheme } from '@/shared/theme';
import { CARD_COLORS, DEFAULT_CARD_COLOR_HEX, NEUTRAL_COLORS } from '@/shared/theme/colors';
import { getContrastForeground, getFavouriteStarColor } from '@/shared/theme/luminance';
import { SPACING } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';
import { showToast } from '@/shared/toast';

import {
  CardDetailHeaderBackground,
  CardDetailHeaderTitle,
  isPastBlendMidpoint
} from '@/features/cards/components/CardDetailHeader';
import { CardDetails } from '@/features/cards/components/CardDetails';
import { useBrandLogo } from '@/features/cards/hooks/useBrandLogo';
import { useCardBrightnessBoost } from '@/features/cards/hooks/useCardBrightnessBoost';
import { useDeleteCard } from '@/features/cards/hooks/useDeleteCard';
import { useToggleFavorite } from '@/features/cards/hooks/useToggleFavorite';
import { useTrackCardUsage } from '@/features/cards/hooks/useTrackCardUsage';

const CardDetailsScreen = () => {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const headerHeight = useHeaderHeight();
  const isFocused = useIsFocused();

  const [card, setCard] = useState<LoyaltyCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete card hook
  const { deleteCard, isDeleting } = useDeleteCard(id ?? '');

  // Resolve brand data — MUST be called before any early returns (Rules of Hooks)
  const brand = useBrandLogo(card?.brandId ?? null);

  // Track a usage event each time this card's detail screen gains focus (Story 9.1)
  useTrackCardUsage(id ?? '');

  // Brightness boost for the barcode below, which is meant to be held up to a checkout
  // scanner (Story 16.39). Two sources, both handled by the hook: the Settings toggle
  // (a standing preference, OFF by default) and the button on the card (this visit
  // only). Focus-scoped, not mount-scoped — Expo Router keeps this screen mounted
  // underneath `/card/[id]/edit`, so a mount-scoped effect would leave the phone at
  // full brightness on the edit form.
  const { isBoosted: isBrightnessBoosted, toggle: toggleBrightness } = useCardBrightnessBoost();

  // Toggle favourite with optimistic update — setCard reflects the new state in
  // the header star instantly and rolls back on write failure (Story 9.2).
  // isPending disables the control briefly so a rapid double-tap can't desync
  // the optimistic UI from the persisted value.
  const { toggle: handleToggleFavorite, isPending: isFavoritePending } = useToggleFavorite(
    card,
    setCard
  );

  // The scroll offset, written by the content's scroll view on the UI thread and followed there by
  // the header's layers and title. Only the blend midpoint comes back to React: the controls, the
  // star and the status bar flip there, and their colours are props, which cannot animate.
  const scrollOffset = useSharedValue(0);
  const [isPastMidpoint, setIsPastMidpoint] = useState(false);
  useAnimatedReaction(
    () => isPastBlendMidpoint(scrollOffset.value),
    (isPast, wasPast) => {
      if (isPast !== wasPast) {
        scheduleOnRN(setIsPastMidpoint, isPast);
      }
    },
    [scrollOffset]
  );

  // iOS 26 draws a scroll-edge effect over the top of a scroll view under a transparent bar — a
  // dark gradient over the field. react-native-screens applies `scrollEdgeEffects` only when the
  // option CHANGES, which can come before the scroll view exists, so the option turns `hidden` once
  // the scroll view has laid out, and goes back to `automatic` on every reload.
  const [isScrollViewLaidOut, setIsScrollViewLaidOut] = useState(false);
  const handleScrollViewLayout = useCallback(() => {
    setIsScrollViewLaidOut(true);
  }, []);

  /**
   * Fetch card data from database
   * Uses useFocusEffect to refresh data when returning from edit screen
   */
  useFocusEffect(
    useCallback(() => {
      // The reload swaps the content for the spinner, and the card comes back at rest: the
      // header's state goes back with it, so no frame draws the scheme's colours over the field.
      scrollOffset.set(0);
      setIsPastMidpoint(false);
      setIsScrollViewLaidOut(false);

      const fetchCard = async () => {
        if (!id) {
          setError(t('cards.details.invalidId'));
          setIsLoading(false);
          return;
        }

        try {
          setIsLoading(true);
          const cardData = await getCardById(id);
          if (cardData) {
            setCard(cardData);
            setError(null);
          } else {
            setError(t('cards.details.notFound'));
          }
        } catch (err) {
          logger.error('Failed to fetch card:', err);
          setError(t('cards.details.loadFailed'));
        } finally {
          setIsLoading(false);
        }
      };

      fetchCard();
    }, [id, t, scrollOffset])
  );

  /**
   * Show toast notification when barcode is copied
   */
  const handleCopy = useCallback(() => {
    void showToast({
      title: t('cards.details.copiedToClipboard'),
      preset: 'done',
      haptic: 'success',
      duration: 2
    });
  }, [t]);

  const renderBackButton = (color: string) => (
    <HeaderIconButton
      icon={ChevronLeft}
      label={t('cards.details.backAccessibilityLabel')}
      onPress={() => router.back()}
      color={color}
      testID="card-details-back"
    />
  );

  // The bar is transparent in EVERY state, from the first frame of the push: pushed with the shared
  // opaque bar, the screen turned transparent only as the push ended, and the card jumped up under
  // it. And `Stack.Screen` options merge per route (`setOptions` spreads each call into the last),
  // so every state sets every key the card's header sets — a reload's loading or error state must
  // not inherit the card's title, field, star or field-coloured chevron.
  const sharedHeaderOptions = {
    headerTransparent: true,
    // The shared screen options paint the bar with the surface fill; transparent overrides it.
    headerStyle: { backgroundColor: 'transparent' },
    headerShadowVisible: false,
    headerTitleAlign: 'center',
    scrollEdgeEffects: { top: isScrollViewLaidOut ? 'hidden' : 'automatic' },
    headerTitle: undefined,
    headerBackground: undefined,
    headerLeft: () => renderBackButton(theme.textPrimary),
    headerRight: undefined
  } as const;

  // Loading state — below the transparent bar, over the ground, with no title: one would linger
  // over the card's field until the push ended.
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ ...sharedHeaderOptions, title: '' }} />
        <View
          testID="card-details-loading"
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: headerHeight,
            backgroundColor: theme.background
          }}
        >
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </>
    );
  }

  // Error state
  if (error || !card) {
    return (
      <>
        <Stack.Screen options={{ ...sharedHeaderOptions, title: t('navigation.cardDetails') }} />
        <View
          testID="card-details-error"
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: SPACING.lg,
            paddingTop: headerHeight + SPACING.lg,
            backgroundColor: theme.background
          }}
        >
          <Text
            style={{
              ...TYPOGRAPHY.bodyLgStrong,
              color: theme.textPrimary,
              marginBottom: SPACING.sm
            }}
          >
            {error || t('cards.details.notFound')}
          </Text>
          <Text
            style={{
              ...TYPOGRAPHY.bodyMd,
              color: theme.textSecondary,
              textAlign: 'center'
            }}
          >
            {t('cards.details.missingDescription')}
          </Text>
        </View>
      </>
    );
  }

  // The card's field: the brand's own hex for a catalogue card — never tinted, washed or overlaid —
  // and the card's accent for a custom one. It MUST match `BrandHero`'s, because the bar shows the
  // hero itself at rest and then takes over from it at the same colour: two fills would meet at a
  // seam. `?? DEFAULT_CARD_COLOR_HEX` keeps a card carrying an unmapped colour filled rather than
  // transparent; `BrandHero` also guards `brand?.color`, which is unreachable here because the
  // brand descriptor's `color` is non-optional.
  const headerBg = brand ? brand.color : (CARD_COLORS[card.color] ?? DEFAULT_CARD_COLOR_HEX);

  // The controls take the field's contrast foreground at rest and the scheme's past the midpoint,
  // where the bar is more ground than field. A favourited star is beam on a dark field and ink on a
  // light one (Esselunga's #FFCC00 would swallow a beam star), with no plate (design system
  // § _Card tile_); past the midpoint it is measured against the ground the same way — beam on
  // black, ink on cream — because the beam rule lists the filled favourite star.
  const fieldForeground = getContrastForeground(headerBg);
  const controlColor = isPastMidpoint ? theme.textPrimary : fieldForeground;
  const favouriteStarColor = getFavouriteStarColor(isPastMidpoint ? theme.background : headerBg);
  const statusBarStyle = isPastMidpoint
    ? isDark
      ? 'light'
      : 'dark'
    : fieldForeground === NEUTRAL_COLORS.white
      ? 'light'
      : 'dark';

  // Success state - render card details
  return (
    <>
      <Stack.Screen
        options={{
          ...sharedHeaderOptions,
          title: card.name,
          headerTitle: () => (
            <CardDetailHeaderTitle
              title={card.name}
              scrollOffset={scrollOffset}
              isPastMidpoint={isPastMidpoint}
            />
          ),
          headerBackground: () => (
            <CardDetailHeaderBackground fieldColor={headerBg} scrollOffset={scrollOffset} />
          ),
          headerLeft: () => renderBackButton(controlColor),
          headerRight: () => (
            // One fixed name: whether it is set is `selected`'s to say, so a screen reader hears
            // the state once rather than in the state and again in a label that flips with it.
            <HeaderIconButton
              icon={Star}
              label={t('cards.details.favoriteToggleLabel')}
              onPress={handleToggleFavorite}
              disabled={isFavoritePending}
              accessibilityState={{ selected: card.isFavorite }}
              color={card.isFavorite ? favouriteStarColor : controlColor}
              fill={card.isFavorite ? favouriteStarColor : undefined}
              testID="favourite-toggle"
            />
          )
        }}
      />
      {/* React Native's status bar is a stack where the last mounted instance wins, and this screen
          stays mounted under Edit — so it draws its own only while it is the focused screen. */}
      {isFocused ? <StatusBar style={statusBarStyle} /> : null}
      <CardDetails
        isBrightnessBoosted={isBrightnessBoosted}
        onToggleBrightness={toggleBrightness}
        card={card}
        onCopy={handleCopy}
        onDelete={deleteCard}
        isDeleting={isDeleting}
        scrollOffset={scrollOffset}
        headerHeight={headerHeight}
        onScrollViewLayout={handleScrollViewLayout}
      />
    </>
  );
};

export default CardDetailsScreen;

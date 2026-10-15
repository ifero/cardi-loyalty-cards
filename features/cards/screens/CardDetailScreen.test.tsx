/**
 * Card Details Screen Tests
 * Story 13.3 (screen); relocated + covered under Story 16.9.
 * Story 21.2: the header's fill and the favourite star — AC7, AC9.
 * Story 22.3: the four card-detail frames — the transparent bar, its blend and its controls.
 *
 * `Stack.Screen` is mocked to MERGE each set of options into the route's, as React Navigation's
 * `setOptions` does (`useNavigationCache.tsx`): a key set once persists until it is set again, so
 * a state that forgets a key inherits the last one — which only a merging mock can show. The
 * header's own choreography is asserted through its worklets in `CardDetailHeader.test.tsx`; here
 * the scroll offset is moved by hand, as the content's scroll view would move it.
 */

import { act, render, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Star from 'lucide-react-native/icons/star';
import React from 'react';
import { StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { getCardById } from '@/core/database';
import type { LoyaltyCard } from '@/core/schemas';

import { HeaderIconButton } from '@/shared/components/ui/HeaderIconButton';
import { showToast } from '@/shared/toast';

import {
  CardDetailHeaderBackground,
  CardDetailHeaderTitle
} from '@/features/cards/components/CardDetailHeader';
import { useCardBrightnessBoost } from '@/features/cards/hooks/useCardBrightnessBoost';

import CardDetailScreen from './CardDetailScreen';

type CardDetailsMockProps = {
  card: LoyaltyCard;
  isDeleting: boolean;
  onCopy: () => void;
  onDelete: () => void;
  /** Story 16.39 — the brightness boost state and its toggle, passed down. */
  isBrightnessBoosted: boolean;
  onToggleBrightness: () => void;
  /** Story 22.3 — the offset the content's scroll view writes, and the bar it runs under. */
  scrollOffset: SharedValue<number>;
  headerHeight: number;
  onScrollViewLayout: () => void;
};

type HeaderElement = React.ReactElement<Record<string, unknown>>;

type RouteOptions = {
  title?: string;
  headerTransparent?: boolean;
  headerStyle?: { backgroundColor?: string };
  headerShadowVisible?: boolean;
  headerTitleAlign?: string;
  scrollEdgeEffects?: { top?: string };
  headerTitle?: () => HeaderElement;
  headerBackground?: () => HeaderElement;
  headerLeft?: () => HeaderElement;
  headerRight?: () => HeaderElement;
};

const HEADER_HEIGHT = 113;

const mockBack = jest.fn();
const mockToggle = jest.fn();
const mockToggleBrightness = jest.fn();
const mockDeleteCard = jest.fn();
const mockCardDetails = jest.fn((props: CardDetailsMockProps) => {
  void props;
  return null;
});
const mockUseBrandLogo = jest.fn();
const mockStatusBar = jest.fn();
let mockRouteOptions: RouteOptions = {};
let mockIsFocused = true;
let mockIsDark = false;
let mockIsFavoritePending = false;
let mockFocusCallback: (() => void) | null = null;

jest.mock('expo-router', () => {
  const Stack = () => null;
  (Stack as { Screen?: (props: { options?: RouteOptions }) => null }).Screen = ({ options }) => {
    mockRouteOptions = { ...mockRouteOptions, ...options };
    return null;
  };
  return {
    Stack,
    useLocalSearchParams: jest.fn(),
    useRouter: () => ({ back: mockBack }),
    useIsFocused: () => mockIsFocused,
    // Focus-once semantics on mount, and `refocus()` below for a return from Edit. A bare
    // `(cb) => cb()` would re-run the fetch on every render — an update loop.
    useFocusEffect: (callback: () => void) => {
      mockFocusCallback = callback;
      jest.requireActual('react').useEffect(() => callback(), []);
    }
  };
});

jest.mock('expo-status-bar', () => ({
  StatusBar: (props: { style?: string }) => {
    mockStatusBar(props);
    return null;
  }
}));

jest.mock('@react-navigation/elements', () => ({
  useHeaderHeight: () => 113
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

jest.mock('@/core/database', () => ({
  getCardById: jest.fn()
}));

jest.mock('@/core/utils/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() }
}));

// The scheme's own roles, light and dark, from the generated tokens.
jest.mock('@/shared/theme', () => {
  const { LIGHT_THEME, DARK_THEME } = jest.requireActual('@/shared/theme/colors');
  return {
    useTheme: () => ({ theme: mockIsDark ? DARK_THEME : LIGHT_THEME, isDark: mockIsDark })
  };
});

jest.mock('@/shared/toast', () => ({ showToast: jest.fn() }));

jest.mock('@/features/cards/components/CardDetails', () => ({
  CardDetails: (props: CardDetailsMockProps) => mockCardDetails(props)
}));

jest.mock('@/features/cards/hooks/useBrandLogo', () => ({
  useBrandLogo: (brandId: string | null) => mockUseBrandLogo(brandId)
}));

jest.mock('@/features/cards/hooks/useDeleteCard', () => ({
  useDeleteCard: () => ({ deleteCard: mockDeleteCard, isDeleting: false })
}));

jest.mock('@/features/cards/hooks/useTrackCardUsage', () => ({
  useTrackCardUsage: jest.fn()
}));

jest.mock('@/features/cards/hooks/useToggleFavorite', () => ({
  useToggleFavorite: () => ({ toggle: mockToggle, isPending: mockIsFavoritePending })
}));

jest.mock('@/features/cards/hooks/useCardBrightnessBoost', () => ({
  useCardBrightnessBoost: jest.fn(() => ({ isBoosted: false, toggle: mockToggleBrightness }))
}));

const INK = '#181824';
const CREAM = '#F0F0E8';
const BEAM = '#FCCC0C';
const WHITE = '#FFFFFF';

const mockCard: LoyaltyCard = {
  id: 'card-1',
  name: 'Test Card',
  barcode: '123456789',
  barcodeFormat: 'EAN13',
  color: 'green',
  brandId: null,
  isFavorite: false,
  lastUsedAt: null,
  usageCount: 0,
  createdAt: '2026-01-07T10:00:00.000Z',
  updatedAt: '2026-01-07T10:00:00.000Z'
};

/** Catalogue brands, by their own catalogue hex. */
const ESSELUNGA = { id: 'esselunga', name: 'Esselunga', color: '#FFCC00' };
const DECATHLON = { id: 'decathlon', name: 'Decathlon', color: '#0082C3' };

const detailsProps = () => mockCardDetails.mock.calls[mockCardDetails.mock.calls.length - 1]![0];
const options = () => mockRouteOptions;
const element = (render?: () => HeaderElement) => render?.() as HeaderElement;
const backButton = () => element(options().headerLeft);
const star = () => element(options().headerRight);
const statusBarStyle = () => (mockStatusBar.mock.calls.at(-1)?.[0] as { style?: string })?.style;

/** Renders the screen for a card and waits for the card's own header. */
const renderCard = async (card: LoyaltyCard = mockCard, brand?: object) => {
  (getCardById as jest.Mock).mockResolvedValue(card);
  mockUseBrandLogo.mockReturnValue(brand);
  const view = render(<CardDetailScreen />);
  await waitFor(() => expect(options().title).toBe(card.name));
  return view;
};

/** Moves the content's scroll offset, as its scroll view would. */
const scrollTo = (offset: number) => {
  act(() => {
    detailsProps().scrollOffset.set(offset);
  });
};

/** A return from Edit: the focus effect runs again and reloads the card. */
const refocus = async () => {
  await act(async () => {
    mockFocusCallback?.();
  });
};

describe('CardDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteOptions = {};
    mockIsFocused = true;
    mockIsDark = false;
    mockIsFavoritePending = false;
    mockFocusCallback = null;
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'card-1' });
    (getCardById as jest.Mock).mockResolvedValue(mockCard);
    // `clearAllMocks` keeps a return value one test sets, so every test starts from the default.
    (useCardBrightnessBoost as jest.Mock).mockReturnValue({
      isBoosted: false,
      toggle: mockToggleBrightness
    });
    mockUseBrandLogo.mockReturnValue(undefined);
  });

  describe('loading the card', () => {
    it('loads the card and renders CardDetails on success', async () => {
      render(<CardDetailScreen />);

      await waitFor(() =>
        expect(mockCardDetails).toHaveBeenCalledWith(expect.objectContaining({ card: mockCard }))
      );
      expect(getCardById).toHaveBeenCalledWith('card-1');
    });

    it('shows an invalid-id error when no id param is present', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({});

      const { getByText } = render(<CardDetailScreen />);

      await waitFor(() => expect(getByText('cards.details.invalidId')).toBeTruthy());
      expect(getCardById).not.toHaveBeenCalled();
    });

    it('shows a not-found error when the card is missing', async () => {
      (getCardById as jest.Mock).mockResolvedValue(null);

      const { getByText } = render(<CardDetailScreen />);

      await waitFor(() => expect(getByText('cards.details.notFound')).toBeTruthy());
    });

    it('shows a load-failed error when the lookup throws', async () => {
      (getCardById as jest.Mock).mockRejectedValue(new Error('db error'));

      const { getByText } = render(<CardDetailScreen />);

      await waitFor(() => expect(getByText('cards.details.loadFailed')).toBeTruthy());
    });

    // Story 9.2 resolves the card's brand from the card itself: pinned to its own `brandId`.
    it('looks up the card’s own brand', async () => {
      await renderCard({ ...mockCard, brandId: 'esselunga' }, ESSELUNGA);
      expect(mockUseBrandLogo).toHaveBeenLastCalledWith('esselunga');
    });
  });

  it('shows a copied toast when the barcode is copied', async () => {
    await renderCard();

    detailsProps().onCopy();

    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'cards.details.copiedToClipboard' })
    );
  });

  it('forwards deletion to the useDeleteCard hook', async () => {
    await renderCard();

    detailsProps().onDelete();

    expect(mockDeleteCard).toHaveBeenCalledTimes(1);
  });

  // Story 16.39. The hook is covered by its own suite; what these pin is the WIRING —
  // that the screen calls it and hands its state down to the button. A screen that
  // called the hook but never passed `onToggleBrightness` would render no button at
  // all, and no hook test could see that.
  describe('the brightness boost (Story 16.39)', () => {
    it('runs the hook and passes its state to CardDetails', async () => {
      await renderCard();

      expect(useCardBrightnessBoost).toHaveBeenCalled();
      expect(detailsProps().isBrightnessBoosted).toBe(false);
      expect(detailsProps().onToggleBrightness).toBe(mockToggleBrightness);
    });

    it('reflects the boosted state down to CardDetails when it is on', async () => {
      (useCardBrightnessBoost as jest.Mock).mockReturnValue({
        isBoosted: true,
        toggle: mockToggleBrightness
      });

      await renderCard();

      expect(detailsProps().isBrightnessBoosted).toBe(true);
    });

    it('runs the hook even when the card fails to load', async () => {
      // Deliberate: the hook is not gated on the card, so the boost decision is made
      // with the screen rather than after the database read. Asserted on the error path
      // because that is where a future `if (card)` guard would show up first.
      (getCardById as jest.Mock).mockResolvedValue(null);

      render(<CardDetailScreen />);

      await waitFor(() => expect(getCardById).toHaveBeenCalled());
      expect(useCardBrightnessBoost).toHaveBeenCalled();
    });
  });

  /**
   * The bar is transparent in every state and draws only its own pieces: no shadow, no title
   * while loading, no iOS scroll-edge effect over the field once the content exists.
   */
  describe('the bar', () => {
    it('is transparent and shadowless over a card, with the content running under it', async () => {
      await renderCard();

      expect(options()).toMatchObject({
        headerTransparent: true,
        headerStyle: { backgroundColor: 'transparent' },
        headerShadowVisible: false,
        headerTitleAlign: 'center',
        title: 'Test Card'
      });
      expect(detailsProps().headerHeight).toBe(HEADER_HEIGHT);
    });

    // react-native-screens applies `scrollEdgeEffects` only when it changes, so it turns `hidden`
    // once the scroll view exists to take it.
    it('hides the iOS scroll-edge effect once the scroll view has laid out', async () => {
      await renderCard();
      expect(options().scrollEdgeEffects).toEqual({ top: 'automatic' });

      act(() => detailsProps().onScrollViewLayout());

      expect(options().scrollEdgeEffects).toEqual({ top: 'hidden' });
    });

    it('draws the field and the blend as its background, and the name as its title', async () => {
      await renderCard({ ...mockCard, brandId: 'esselunga' }, ESSELUNGA);
      const offset = detailsProps().scrollOffset;

      expect(element(options().headerBackground)).toMatchObject({
        type: CardDetailHeaderBackground,
        props: { fieldColor: '#FFCC00', scrollOffset: offset }
      });
      expect(element(options().headerTitle)).toMatchObject({
        type: CardDetailHeaderTitle,
        props: { title: 'Test Card', scrollOffset: offset, isPastMidpoint: false }
      });
    });

    it('goes back with a chevron, and favourites with a star', async () => {
      await renderCard();

      expect(backButton()).toMatchObject({
        type: HeaderIconButton,
        props: { icon: ChevronLeft, label: 'cards.details.backAccessibilityLabel' }
      });
      expect(star()).toMatchObject({
        type: HeaderIconButton,
        props: { icon: Star, label: 'cards.details.favoriteToggleLabel' }
      });

      (backButton().props.onPress as () => void)();
      expect(mockBack).toHaveBeenCalledTimes(1);
      (star().props.onPress as () => void)();
      expect(mockToggle).toHaveBeenCalledTimes(1);
    });
  });

  /** The I/O matrix, row by row. */
  describe('the frames', () => {
    // Frame A: the field's own colour behind both controls and the status bar.
    it.each([
      ['a light brand', ESSELUNGA, INK, 'dark'],
      ['a dark brand', DECATHLON, WHITE, 'light']
    ])('at rest, takes the foreground of %s', async (_label, brand, foreground, barStyle) => {
      await renderCard({ ...mockCard, brandId: brand.id }, brand);

      expect(element(options().headerBackground).props.fieldColor).toBe(brand.color);
      expect(backButton().props.color).toBe(foreground);
      expect(star().props).toMatchObject({ color: foreground, fill: undefined });
      expect(statusBarStyle()).toBe(barStyle);
    });

    // Hero scrolling and the first half of the blend: nothing in React changes — the bar follows
    // the offset on the UI thread, and the controls hold the field's colours until halfway.
    it('holds the field’s colours until the blend midpoint', async () => {
      await renderCard({ ...mockCard, brandId: 'decathlon' }, DECATHLON);

      for (const offset of [60, 150, 200, 223]) {
        scrollTo(offset);
        expect(backButton().props.color).toBe(WHITE);
        expect(statusBarStyle()).toBe('light');
        expect(element(options().headerTitle).props.isPastMidpoint).toBe(false);
      }
    });

    // The reaction runs on every scroll frame; only a crossing of the midpoint may reach the JS
    // thread, or every frame of every scroll would. The spy goes in before the render: the
    // worklets plugin captures `scheduleOnRN` in the reaction's closure as the render creates it.
    it('reaches the JS thread only when the scroll crosses the midpoint', async () => {
      const toJS = jest.spyOn(jest.requireMock('react-native-worklets'), 'scheduleOnRN');

      try {
        await renderCard({ ...mockCard, brandId: 'decathlon' }, DECATHLON);
        toJS.mockClear();

        for (const offset of [60, 150, 200, 223]) {
          scrollTo(offset);
        }
        expect(toJS).not.toHaveBeenCalled();

        scrollTo(224);
        scrollTo(300);
        expect(toJS).toHaveBeenCalledTimes(1);

        scrollTo(223);
        expect(toJS).toHaveBeenCalledTimes(2);
      } finally {
        toJS.mockRestore();
      }
    });

    // Frames B → C: past the midpoint the bar is more ground than field.
    it('flips the controls, the title and the status bar to the scheme at the midpoint', async () => {
      await renderCard({ ...mockCard, brandId: 'decathlon' }, DECATHLON);

      scrollTo(224);

      expect(backButton().props.color).toBe(INK);
      expect(star().props.color).toBe(INK);
      expect(statusBarStyle()).toBe('dark');
      expect(element(options().headerTitle).props.isPastMidpoint).toBe(true);

      scrollTo(400);
      expect(backButton().props.color).toBe(INK);
    });

    // Reverse: every step reverses with the scroll, and nothing is timed.
    it('reverses with the scroll, untimed', async () => {
      await renderCard({ ...mockCard, brandId: 'decathlon' }, DECATHLON);
      scrollTo(300);
      expect(backButton().props.color).toBe(INK);

      const reanimated = jest.requireMock('react-native-reanimated');
      const timers = [
        jest.spyOn(reanimated, 'withTiming'),
        jest.spyOn(reanimated, 'withSpring'),
        jest.spyOn(reanimated, 'withDelay'),
        jest.spyOn(global, 'setTimeout'),
        jest.spyOn(global, 'requestAnimationFrame')
      ];

      scrollTo(224);
      expect(backButton().props.color).toBe(INK);
      scrollTo(223);
      expect(backButton().props.color).toBe(WHITE);
      expect(statusBarStyle()).toBe('light');
      expect(element(options().headerTitle).props.isPastMidpoint).toBe(false);
      scrollTo(0);
      expect(backButton().props.color).toBe(WHITE);

      for (const timer of timers) {
        expect(timer).not.toHaveBeenCalled();
        timer.mockRestore();
      }
    });

    // Frame D: no catalogue brand, so the accent fills the field.
    it('fills a custom card’s field with its accent', async () => {
      await renderCard({ ...mockCard, color: 'red' });

      expect(element(options().headerBackground).props.fieldColor).toBe('#E42424');
      expect(backButton().props.color).toBe(WHITE);
    });

    it('falls back to the default accent for an unknown colour key', async () => {
      await renderCard({ ...mockCard, color: '#FF0000' as never });
      expect(element(options().headerBackground).props.fieldColor).toBe('#0C84CC');
    });

    it('treats a brand id the catalogue does not know as a custom card', async () => {
      await renderCard({ ...mockCard, brandId: 'gone', color: 'red' }, undefined);
      expect(element(options().headerBackground).props.fieldColor).toBe('#E42424');
    });

    // A branded card's colour is its brand's hex — the stored key is never used, and never tinted.
    it('fills a branded card’s field with its brand’s hex, whatever key it stores', async () => {
      await renderCard({ ...mockCard, brandId: 'esselunga', color: 'blue' }, ESSELUNGA);
      expect(element(options().headerBackground).props.fieldColor).toBe('#FFCC00');
    });

    // Dark: the field stays the brand; past the midpoint the controls are cream on the black bar.
    it('in dark, keeps the field and condenses to cream controls', async () => {
      mockIsDark = true;
      await renderCard({ ...mockCard, brandId: 'esselunga' }, ESSELUNGA);

      expect(element(options().headerBackground).props.fieldColor).toBe('#FFCC00');
      expect(backButton().props.color).toBe(INK);
      expect(statusBarStyle()).toBe('dark');

      scrollTo(260);

      expect(backButton().props.color).toBe(CREAM);
      expect(statusBarStyle()).toBe('light');
    });
  });

  /**
   * The favourite star: an outline in the controls' colour, or filled — beam on a dark field and
   * ink on a light one, with no plate. Past the midpoint it is measured against the ground the
   * same way: ink on cream, beam on black, because the beam rule lists the filled star.
   */
  describe('the favourite star', () => {
    it.each([
      ['a dark field', DECATHLON, BEAM],
      ['a light field', ESSELUNGA, INK]
    ])('is filled on %s at rest', async (_label, brand, colour) => {
      await renderCard({ ...mockCard, brandId: brand.id, isFavorite: true }, brand);

      expect(star().props).toMatchObject({ icon: Star, color: colour, fill: colour });
    });

    it.each([
      ['ink on the cream bar, in light', false, INK],
      ['beam on the black bar, in dark', true, BEAM]
    ])('past the midpoint, is %s', async (_label, isDark, colour) => {
      mockIsDark = isDark;
      await renderCard({ ...mockCard, brandId: 'decathlon', isFavorite: true }, DECATHLON);

      scrollTo(300);

      expect(star().props).toMatchObject({ color: colour, fill: colour });
    });

    // One fixed name, the state in `selected`: a label that flipped with the state as well would
    // have a screen reader announce it twice ("Selected, Remove from favorites").
    it('keeps one name and reports whether it is set as selected', async () => {
      const view = await renderCard({ ...mockCard, isFavorite: true });
      expect(star().props.label).toBe('cards.details.favoriteToggleLabel');
      expect(star().props.accessibilityState).toEqual({ selected: true });
      view.unmount();

      mockRouteOptions = {};
      await renderCard();
      expect(star().props.label).toBe('cards.details.favoriteToggleLabel');
      expect(star().props.accessibilityState).toEqual({ selected: false });
    });

    // Story 9.2: the optimistic toggle refuses a second tap until the write has landed.
    it('is disabled while a toggle is pending', async () => {
      mockIsFavoritePending = true;
      await renderCard();
      expect(star().props.disabled).toBe(true);
    });
  });

  describe('the status bar', () => {
    // React Native's status bar is a stack where the last mounted instance wins, and this screen
    // stays mounted under Edit.
    it('is this screen’s only while it is focused', async () => {
      mockIsFocused = false;
      await renderCard();
      expect(mockStatusBar).not.toHaveBeenCalled();
    });
  });

  /**
   * Load / missing: the spinner, or the error copy, below a bar transparent from the first frame
   * over the ground — no title while loading, "Card Details" on an error — and the same back
   * chevron as the card's, in the theme's text colour.
   */
  describe('loading and error headers', () => {
    const expectGroundHeader = () => {
      expect(options()).toMatchObject({
        headerTransparent: true,
        headerStyle: { backgroundColor: 'transparent' },
        headerShadowVisible: false,
        headerTitleAlign: 'center',
        scrollEdgeEffects: { top: 'automatic' }
      });
      expect(options().headerTitle).toBeUndefined();
      expect(options().headerBackground).toBeUndefined();
      expect(options().headerRight).toBeUndefined();
      expect(backButton()).toMatchObject({
        type: HeaderIconButton,
        props: { icon: ChevronLeft, color: INK }
      });
    };

    it('loads below a transparent bar with no title', () => {
      (getCardById as jest.Mock).mockReturnValue(new Promise(() => {}));
      const { getByTestId } = render(<CardDetailScreen />);

      expect(options().title).toBe('');
      expectGroundHeader();
      expect(StyleSheet.flatten(getByTestId('card-details-loading').props.style)).toMatchObject({
        paddingTop: HEADER_HEIGHT,
        backgroundColor: CREAM
      });
      expect(mockStatusBar).not.toHaveBeenCalled();
    });

    it('titles an error "Card Details" below the same bar', async () => {
      (getCardById as jest.Mock).mockResolvedValue(null);
      const { getByTestId } = render(<CardDetailScreen />);

      await waitFor(() => expect(options().title).toBe('navigation.cardDetails'));
      expectGroundHeader();
      expect(
        StyleSheet.flatten(getByTestId('card-details-error').props.style).paddingTop
      ).toBeGreaterThanOrEqual(HEADER_HEIGHT);
    });

    it('goes back from the error state', async () => {
      (getCardById as jest.Mock).mockResolvedValue(null);
      render(<CardDetailScreen />);
      await waitFor(() => expect(options().title).toBe('navigation.cardDetails'));

      (backButton().props.onPress as () => void)();
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Every focus reloads the card behind the spinner. Options merge per route, so the loading
   * state must clear what the card's header set — and the header's own state must go back to rest
   * with the card, or the first frames would draw the scheme's colours over the field.
   */
  describe('a reload', () => {
    it('clears the card’s header while it loads', async () => {
      await renderCard({ ...mockCard, brandId: 'decathlon', isFavorite: true }, DECATHLON);
      (getCardById as jest.Mock).mockReturnValue(new Promise(() => {}));

      await refocus();

      expect(options().title).toBe('');
      expect(options().headerTitle).toBeUndefined();
      expect(options().headerBackground).toBeUndefined();
      expect(options().headerRight).toBeUndefined();
      expect(backButton().props.color).toBe(INK);
    });

    it('leaves no stale star or title when the reload fails', async () => {
      await renderCard({ ...mockCard, isFavorite: true });
      (getCardById as jest.Mock).mockResolvedValue(null);

      await refocus();

      await waitFor(() => expect(options().title).toBe('navigation.cardDetails'));
      expect(options().headerRight).toBeUndefined();
      expect(options().headerTitle).toBeUndefined();
    });

    it('brings the card back at rest', async () => {
      // On a device the reaction's word that the offset is back at 0 crosses from the UI thread a
      // frame or more later, so the reload must reset the midpoint itself. Here the mock would
      // carry that word at once, so it is silenced for the reload: only the reload's own reset
      // can pass this. The spy goes in before the render, which captures it in the reaction.
      let isReactionSilenced = false;
      const toJS = jest
        .spyOn(jest.requireMock('react-native-worklets'), 'scheduleOnRN')
        .mockImplementation((...args: unknown[]) => {
          const [fn, ...rest] = args as [(...values: unknown[]) => void, ...unknown[]];
          if (!isReactionSilenced) {
            fn(...rest);
          }
        });

      try {
        await renderCard({ ...mockCard, brandId: 'decathlon' }, DECATHLON);
        act(() => detailsProps().onScrollViewLayout());
        scrollTo(300);
        expect(backButton().props.color).toBe(INK);
        expect(options().scrollEdgeEffects).toEqual({ top: 'hidden' });

        let resolveReload: (card: LoyaltyCard) => void = () => {};
        (getCardById as jest.Mock).mockReturnValue(
          new Promise<LoyaltyCard>((resolve) => {
            resolveReload = resolve;
          })
        );

        isReactionSilenced = true;
        await refocus();

        // Reset BEFORE the fetch resolves: the offset, the midpoint and the laid-out flag.
        expect(detailsProps().scrollOffset.value).toBe(0);
        expect(options().scrollEdgeEffects).toEqual({ top: 'automatic' });

        await act(async () => {
          resolveReload({ ...mockCard, brandId: 'decathlon' });
        });

        expect(backButton().props.color).toBe(WHITE);
        expect(statusBarStyle()).toBe('light');
        expect(element(options().headerTitle).props.isPastMidpoint).toBe(false);
      } finally {
        toJS.mockRestore();
      }
    });
  });
});

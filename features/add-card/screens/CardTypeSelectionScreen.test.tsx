/**
 * CardTypeSelectionScreen Tests
 * Story 13.4: Restyle Add Card Flow (AC1, AC2, T2)
 * Story 22.5: Capture frame A
 */

import { render, screen, fireEvent, within } from '@testing-library/react-native';
import { router } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import React from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet } from 'react-native';

import { TOUCH_TARGET } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import { SearchBar } from '@/features/cards/components/SearchBar';

import { CardTypeSelectionScreen } from './CardTypeSelectionScreen';

let mockIsDark = false;

// The real token values, so the screen is checked against what the app paints.
jest.mock('@/shared/theme', () => {
  const { DARK_THEME, LIGHT_THEME } = jest.requireActual('@/shared/theme/colors');
  return {
    useTheme: () => ({ theme: mockIsDark ? DARK_THEME : LIGHT_THEME, isDark: mockIsDark })
  };
});

// The frames' real insets on a 393 × 852 phone: 59pt over the status bar, 34pt over the home
// indicator. The SafeAreaView records the edges it was asked to pad.
const INSETS = { top: 59, bottom: 34, left: 0, right: 0 };
jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: { children?: React.ReactNode }) =>
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('react').createElement(View, { testID: 'safe-area', ...props }, children),
    useSafeAreaInsets: () => INSETS
  };
});

// Mock catalogue repository
const mockBrands = [
  {
    id: 'esselunga',
    name: 'Esselunga',
    color: '#FFCC00',
    logo: 'esselunga',
    aliases: ['fidaty'],
    defaultFormat: 'EAN13'
  },
  {
    id: 'conad',
    name: 'Conad',
    color: '#E2231A',
    logo: 'conad',
    aliases: [],
    defaultFormat: 'EAN13'
  },
  {
    id: 'coop',
    name: 'Coop',
    color: '#0C84CC',
    logo: 'coop',
    aliases: [],
    defaultFormat: 'CODE128'
  },
  {
    id: 'carrefour',
    name: 'Carrefour',
    color: '#004E9F',
    logo: 'carrefour',
    aliases: [],
    defaultFormat: 'EAN13'
  },
  {
    id: 'lidl',
    name: 'Lidl',
    color: '#0050AA',
    logo: 'lidl',
    aliases: [],
    defaultFormat: 'QR'
  },
  {
    id: 'auchan',
    name: 'Auchan',
    color: '#D4001B',
    logo: 'auchan',
    aliases: [],
    defaultFormat: 'EAN13'
  }
];

jest.mock('@/core/catalogue/catalogue-repository', () => ({
  CatalogueRepository: {
    getInstance: () => ({
      getBrands: () => mockBrands
    })
  }
}));

// Mock brandLogos
jest.mock('@/features/cards/utils/brandLogos', () => ({
  getBrandLogo: jest.fn(() => undefined)
}));

type Scheme = 'light' | 'dark';

const PALETTE: Record<Scheme, { background: string; textPrimary: string }> = {
  light: { background: '#F0F0E8', textPrimary: '#181824' },
  dark: { background: '#000000', textPrimary: '#F0F0E8' }
};

const styleOf = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

/** The rows of one section's surface, top to bottom, by testID. */
const rowsOf = (surfaceTestID: string) =>
  within(screen.getByTestId(surfaceTestID))
    .getAllByRole('button')
    .map((row) => row.props.testID as string);

const typeQuery = (text: string) =>
  fireEvent.changeText(screen.getByTestId('brand-search-bar-input'), text);

describe('CardTypeSelectionScreen', () => {
  const announceSpy = jest
    .spyOn(AccessibilityInfo, 'announceForAccessibility')
    .mockImplementation(jest.fn());

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockIsDark = false;
  });

  describe('rendering', () => {
    it('renders back button', () => {
      render(<CardTypeSelectionScreen />);
      expect(screen.getByTestId('back-button')).toBeTruthy();
    });

    it('renders search bar', () => {
      render(<CardTypeSelectionScreen />);
      expect(screen.getByTestId('brand-search-bar')).toBeTruthy();
    });

    it('renders brand list', () => {
      render(<CardTypeSelectionScreen />);
      expect(screen.getByTestId('brand-list')).toBeTruthy();
    });

    it('renders "Other card" row', () => {
      render(<CardTypeSelectionScreen />);
      expect(screen.getByText('Other card')).toBeTruthy();
    });

    // Story 22.1: the header is the shared `SectionHeader`, so the capitals come from the style
    // and the string stays sentence case — a screen reader reads "Popular cards", not letters.
    it('renders the Popular cards section header, uppercased by style', () => {
      render(<CardTypeSelectionScreen />);
      const header = screen.getByText('Popular cards');
      expect(header.props.accessibilityRole).toBe('header');
      expect(StyleSheet.flatten(header.props.style).textTransform).toBe('uppercase');
      expect(screen.queryByText('POPULAR CARDS')).toBeNull();
    });

    it('renders brand names from catalogue', () => {
      render(<CardTypeSelectionScreen />);
      expect(screen.getAllByText('Esselunga').length).toBeGreaterThan(0);
      expect(screen.getByText('Auchan')).toBeTruthy();
    });

    it('announces screen for accessibility on mount', () => {
      render(<CardTypeSelectionScreen />);
      expect(announceSpy).toHaveBeenCalledWith('Card type selection screen');
    });
  });

  describe('navigation', () => {
    it('navigates to scanner when brand is pressed', () => {
      render(<CardTypeSelectionScreen />);
      fireEvent.press(within(screen.getByTestId('brand-list-popular')).getByText('Esselunga'));
      expect(router.push).toHaveBeenCalledWith({
        pathname: '/add-card/scan',
        params: {
          brandId: 'esselunga',
          brandName: 'Esselunga',
          brandColor: '#FFCC00',
          brandLogo: 'esselunga'
        }
      });
    });

    it('navigates to scanner when "Other card" is pressed', () => {
      render(<CardTypeSelectionScreen />);
      fireEvent.press(screen.getByTestId('other-card-row'));
      expect(router.push).toHaveBeenCalledWith({
        pathname: '/add-card/scan',
        params: { mode: 'custom' }
      });
    });

    // From the RESULTS surface too, with the same exact params.
    it('navigates to scanner with exactly { mode: "custom" } from a search', () => {
      render(<CardTypeSelectionScreen />);
      typeQuery('zzz');
      fireEvent.press(screen.getByTestId('other-card-row'));
      expect(router.push).toHaveBeenCalledWith({
        pathname: '/add-card/scan',
        params: { mode: 'custom' }
      });
    });

    it('calls router.back when back button is pressed', () => {
      render(<CardTypeSelectionScreen />);
      fireEvent.press(screen.getByTestId('back-button'));
      expect(router.back).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('filters brands when typing in search bar', () => {
      render(<CardTypeSelectionScreen />);
      typeQuery('ess');

      // Should show the Results section instead of Popular cards
      expect(screen.getByText('Results')).toBeTruthy();
      expect(screen.queryByText('Popular cards')).toBeNull();
    });
  });

  // Story 22.5 — capture frame A.
  describe('frame A', () => {
    describe('header', () => {
      it('draws the back chevron in Lucide, named for a screen reader', () => {
        render(<CardTypeSelectionScreen />);

        expect(screen.UNSAFE_getByType(ChevronLeft)).toBeTruthy();
        expect(screen.queryByText('chevron-left')).toBeNull();
        expect(screen.getByLabelText('Go back')).toBe(screen.getByTestId('back-button'));
      });

      it('announces "Add Card" as the screen’s heading', () => {
        render(<CardTypeSelectionScreen />);
        expect(screen.getByRole('header', { name: 'Add Card' })).toBeTruthy();
      });

      // The chevron's drawn stroke — not its target — lands on the 24pt margin: the header pads
      // by the margin less where Lucide's chevron starts inside the 48pt target (12 + 9 − 0.75).
      it('is 48pt with no rule, its chevron stroke starting on the 24pt margin', () => {
        render(<CardTypeSelectionScreen />);
        const header = styleOf('card-type-selection-header') as Record<string, number | undefined>;

        expect(header.minHeight).toBe(48);
        expect(header.borderBottomWidth).toBeUndefined();
        expect((header.paddingHorizontal as number) + 12 + 9 - 0.75).toBe(24);
      });

      it('centres the title with a 48pt spacer balancing the back button', () => {
        render(<CardTypeSelectionScreen />);
        const title = screen.getByText('Add Card');
        const titleStyle = StyleSheet.flatten(title.props.style);

        expect(titleStyle).toMatchObject({ flex: 1, textAlign: 'center' });
        expect(StyleSheet.flatten(styleOf('back-button'))).toMatchObject({ width: 48 });
        expect(styleOf('card-type-selection-header-spacer').width).toBe(TOUCH_TARGET.min);
      });

      it('pads the top and both sides by the safe area, leaving the bottom to the list', () => {
        render(<CardTypeSelectionScreen />);
        const edges = screen.getByTestId('safe-area').props.edges as string[];

        expect(edges).toEqual(expect.arrayContaining(['top', 'left', 'right']));
        expect(edges).not.toContain('bottom');
      });

      describe.each<Scheme>(['light', 'dark'])('in %s', (scheme) => {
        beforeEach(() => {
          mockIsDark = scheme === 'dark';
        });

        it('sets the title in body-lg semibold textPrimary over the ground', () => {
          render(<CardTypeSelectionScreen />);

          expect(StyleSheet.flatten(screen.getByText('Add Card').props.style)).toMatchObject({
            ...TYPOGRAPHY.bodyLgStrong,
            color: PALETTE[scheme].textPrimary
          });
          expect(styleOf('safe-area').backgroundColor).toBe(PALETTE[scheme].background);
          expect(
            screen.getByTestId('back-button-icon', { includeHiddenElements: true }).props.stroke
          ).toBe(PALETTE[scheme].textPrimary);
        });
      });
    });

    describe('search field', () => {
      it('is the wallet’s field, with the brand list’s own copy', () => {
        render(<CardTypeSelectionScreen />);
        const field = screen.UNSAFE_getByType(SearchBar);

        expect(field.props).toMatchObject({
          testID: 'brand-search-bar',
          placeholder: 'Search by name',
          accessibilityLabel: 'Search brands by name',
          clearAccessibilityLabel: 'Clear search'
        });
        expect(screen.getByTestId('brand-search-bar-input').props.placeholder).toBe(
          'Search by name'
        );
        expect(screen.getByLabelText('Search brands by name')).toBe(
          screen.getByTestId('brand-search-bar-input')
        );
      });

      it('clears the query from its × and leaves the default sections', () => {
        render(<CardTypeSelectionScreen />);
        typeQuery('ess');
        fireEvent.press(screen.getByTestId('brand-search-bar-clear'));

        expect(screen.getByText('Popular cards')).toBeTruthy();
        expect(screen.queryByText('Results')).toBeNull();
      });

      // Pinned: the field is outside the list, so only the list scrolls.
      it('sits 16pt below the header, outside the scrolling list', () => {
        render(<CardTypeSelectionScreen />);

        expect(
          within(screen.getByTestId('brand-list')).queryByTestId('brand-search-bar')
        ).toBeNull();
        expect(styleOf('card-type-selection-search')).toMatchObject({
          paddingTop: 16,
          paddingHorizontal: 24
        });
      });
    });

    describe('sections', () => {
      it('puts POPULAR CARDS and ALL CARDS each in one outlined surface', () => {
        render(<CardTypeSelectionScreen />);

        expect(rowsOf('brand-list-popular')).toEqual([
          'brand-row-esselunga',
          'brand-row-conad',
          'brand-row-coop',
          'brand-row-carrefour',
          'brand-row-lidl'
        ]);
        expect(within(screen.getByTestId('brand-list-all')).getByText('Auchan')).toBeTruthy();
      });

      // Decided (ifero, 2026-10-12): "Other card" is the last row inside ALL CARDS, as frame A
      // draws it — not an untitled section of its own between the two.
      it('makes "Other card" the last row of ALL CARDS, and nowhere else', () => {
        render(<CardTypeSelectionScreen />);

        expect(rowsOf('brand-list-all').at(-1)).toBe('other-card-row');
        expect(rowsOf('brand-list-popular')).not.toContain('other-card-row');
        expect(screen.getAllByTestId('other-card-row')).toHaveLength(1);
      });

      it('sorts ALL CARDS by name, above "Other card"', () => {
        render(<CardTypeSelectionScreen />);

        expect(rowsOf('brand-list-all')).toEqual([
          'brand-row-auchan',
          'brand-row-carrefour',
          'brand-row-conad',
          'brand-row-coop',
          'brand-row-esselunga',
          'brand-row-lidl',
          'other-card-row'
        ]);
      });

      it('rules the rows apart with full-width hairlines inside each surface', () => {
        render(<CardTypeSelectionScreen />);

        // Five popular rows have four rules between them.
        expect(
          within(screen.getByTestId('brand-list-popular')).getAllByTestId(
            'brand-list-popular-divider'
          )
        ).toHaveLength(4);
      });

      it('sets each header 24pt below what is above it and 8pt above its rows', () => {
        render(<CardTypeSelectionScreen />);

        for (const key of ['popular', 'all']) {
          expect(styleOf(`brand-list-${key}-section`)).toMatchObject({
            paddingTop: 24,
            paddingHorizontal: 24,
            gap: 8
          });
        }
      });

      it('ends the list’s content 24pt above the bottom inset', () => {
        render(<CardTypeSelectionScreen />);

        expect(
          StyleSheet.flatten(screen.getByTestId('brand-list').props.contentContainerStyle)
        ).toMatchObject({ paddingBottom: 24 + INSETS.bottom });
      });

      // The I/O matrix's large-text row: the list scrolls.
      it('scrolls, keeping taps on rows while the keyboard is up', () => {
        render(<CardTypeSelectionScreen />);
        const list = screen.UNSAFE_getByType(ScrollView);

        expect(list.props.testID).toBe('brand-list');
        expect(list.props.keyboardShouldPersistTaps).toBe('handled');
      });

      it('names every row for a screen reader', () => {
        render(<CardTypeSelectionScreen />);

        expect(
          within(screen.getByTestId('brand-list-popular')).getByLabelText('Esselunga')
        ).toBeTruthy();
        expect(screen.getByLabelText('Other card. Add a custom loyalty card')).toBe(
          screen.getByTestId('other-card-row')
        );
      });
    });

    describe('searching', () => {
      it('shows one RESULTS surface holding the matches, then "Other card" last', () => {
        render(<CardTypeSelectionScreen />);
        typeQuery('co');

        expect(screen.queryByTestId('brand-list-popular')).toBeNull();
        expect(screen.queryByTestId('brand-list-all')).toBeNull();
        expect(rowsOf('brand-list-results')).toEqual([
          'brand-row-conad',
          'brand-row-coop',
          'other-card-row'
        ]);
        expect(screen.getByText('Showing results matching "co"')).toBeTruthy();
      });

      it('matches an alias as well as a name', () => {
        render(<CardTypeSelectionScreen />);
        typeQuery('fidaty');

        expect(rowsOf('brand-list-results')).toEqual(['brand-row-esselunga', 'other-card-row']);
      });

      it('says "No cards found" and still offers "Other card" when nothing matches', () => {
        render(<CardTypeSelectionScreen />);
        typeQuery('zzz');

        expect(rowsOf('brand-list-results')).toEqual(['other-card-row']);
        expect(screen.getByText('No cards found')).toBeTruthy();
        expect(screen.queryByText(/Showing results/)).toBeNull();
      });

      it('keeps the two result lines on the 24pt margin', () => {
        render(<CardTypeSelectionScreen />);
        typeQuery('zzz');

        expect(styleOf('brand-list-no-results')).toMatchObject({
          ...TYPOGRAPHY.bodyMd,
          paddingTop: 24,
          paddingHorizontal: 24
        });
      });
    });
  });
});

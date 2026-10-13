/**
 * BrandList Component Tests
 * Story 22.5: Capture frame A — each section's rows in one outlined surface
 *
 * The screen's own suite (`CardTypeSelectionScreen.test.tsx`) covers the sections with a full
 * catalogue; this one covers what only the list decides on its own.
 */

import { render, screen } from '@testing-library/react-native';

import { CatalogueBrand } from '@/catalogue/types';

import { BrandList } from './BrandList';

jest.mock('@/shared/theme', () => {
  const { LIGHT_THEME } = jest.requireActual('@/shared/theme/colors');
  return { useTheme: () => ({ theme: LIGHT_THEME, isDark: false }) };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 59, bottom: 34, left: 0, right: 0 })
}));

const brand = (name: string, color: string): CatalogueBrand => ({
  id: name.toLowerCase(),
  name,
  color,
  logo: name.toLowerCase(),
  aliases: []
});

describe('BrandList', () => {
  // A section with nothing to show draws no header over an empty outline.
  it('draws no POPULAR CARDS header or surface when there are no popular brands', () => {
    render(
      <BrandList
        isSearching={false}
        query=""
        popularBrands={[]}
        allBrands={[brand('Conad', '#E2231A'), brand('Lidl', '#0050AA')]}
        filteredBrands={[]}
        onBrandPress={jest.fn()}
        onOtherCardPress={jest.fn()}
      />
    );

    expect(screen.queryByText('Popular cards')).toBeNull();
    expect(screen.queryByTestId('brand-list-popular')).toBeNull();
    expect(screen.queryByTestId('brand-list-popular-section')).toBeNull();
    // ALL CARDS still shows, with "Other card" as its last row.
    expect(screen.getByText('All cards')).toBeTruthy();
    expect(screen.getByTestId('brand-list-all')).toBeTruthy();
    expect(screen.getByTestId('brand-row-conad')).toBeTruthy();
    expect(screen.getByTestId('other-card-row')).toBeTruthy();
  });
});

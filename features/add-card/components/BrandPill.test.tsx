/**
 * BrandPill Component Tests
 * Story 13.4: Restyle Add Card Flow (AC4)
 * Story 22.5: Capture frame B's pill
 */

import { render, screen } from '@testing-library/react-native';
import { Image, StyleSheet } from 'react-native';

import { TYPOGRAPHY } from '@/shared/theme/typography';

import { CatalogueBrand } from '@/catalogue/types';

import { BrandPill } from './BrandPill';

const INK = '#181824';
const WHITE = '#FFFFFF';

const esselunga: CatalogueBrand = {
  id: 'esselunga',
  name: 'Esselunga',
  color: '#FFCC00',
  logo: 'esselunga',
  aliases: []
};

const lidl: CatalogueBrand = {
  id: 'lidl',
  name: 'Lidl',
  color: '#0050AA',
  logo: 'lidl',
  aliases: []
};

const styleOf = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

const textStyle = (text: string) =>
  StyleSheet.flatten(screen.getByText(text).props.style) as Record<string, unknown>;

describe('BrandPill', () => {
  it('renders brand name', () => {
    render(<BrandPill brand={esselunga} />);
    expect(screen.getByText('Esselunga')).toBeTruthy();
  });

  it('renders with default testID', () => {
    render(<BrandPill brand={esselunga} />);
    expect(screen.getByTestId('brand-pill')).toBeTruthy();
  });

  it('accepts custom testID', () => {
    render(<BrandPill brand={esselunga} testID="custom-pill" />);
    expect(screen.getByTestId('custom-pill')).toBeTruthy();
  });

  it('is filled with the brand’s own colour, fully round, padded 6 / 12 / 6 / 6 with an 8pt gap', () => {
    render(<BrandPill brand={esselunga} />);

    expect(styleOf('brand-pill')).toMatchObject({
      backgroundColor: '#FFCC00',
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      borderRadius: 999,
      paddingVertical: 6,
      paddingLeft: 6,
      paddingRight: 12,
      gap: 8
    });
  });

  // Large text grows the pill rather than clipping its name.
  it('has no fixed height', () => {
    render(<BrandPill brand={esselunga} />);
    expect(styleOf('brand-pill').height).toBeUndefined();
  });

  it('holds a 24pt white dot carrying the initial in label-bold ink', () => {
    render(<BrandPill brand={esselunga} />);

    expect(styleOf('brand-pill-dot')).toMatchObject({
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: WHITE
    });
    expect(textStyle('E')).toMatchObject({ ...TYPOGRAPHY.labelBold, color: INK });
  });

  // The initial is a mark sized to its dot, like any avatar initial.
  it('keeps the initial out of Dynamic Type, and lets the name scale', () => {
    render(<BrandPill brand={esselunga} />);

    expect(screen.getByText('E').props.allowFontScaling).toBe(false);
    expect(screen.getByText('Esselunga').props.allowFontScaling).not.toBe(false);
  });

  it.each<[string, CatalogueBrand, string]>([
    ['ink on a light brand', esselunga, INK],
    ['white on a dark brand', lidl, WHITE]
  ])('sets the name in body-md semibold, %s', (_, brand, foreground) => {
    render(<BrandPill brand={brand} />);

    expect(textStyle(brand.name)).toMatchObject({ ...TYPOGRAPHY.bodyMdStrong, color: foreground });
    // The dot's initial stays ink on white whatever the brand.
    expect(textStyle(brand.name.charAt(0)).color).toBe(INK);
  });

  // A white dot on a white brand's pill would vanish (nine catalogue brands are #FFFFFF): it takes
  // the light hairline, in both schemes, because the pill sits on the camera feed.
  it('outlines the dot on a white brand’s pill with the light hairline', () => {
    render(<BrandPill brand={{ ...esselunga, name: 'Coin', color: '#FFFFFF' }} />);

    expect(styleOf('brand-pill-dot')).toMatchObject({ borderWidth: 1, borderColor: '#D6D6CB' });
  });

  it('leaves the dot unoutlined on a mid-tone brand’s pill', () => {
    render(<BrandPill brand={lidl} />);

    expect(styleOf('brand-pill-dot').borderWidth).toBeUndefined();
  });

  it('keeps a long name to one line', () => {
    render(<BrandPill brand={esselunga} />);
    expect(screen.getByText('Esselunga').props.numberOfLines).toBe(1);
  });

  // The dot and the name, and nothing else: the brand's logo went, with its 16pt slot.
  it('draws no logo', () => {
    render(<BrandPill brand={esselunga} />);

    expect(screen.UNSAFE_queryAllByType(Image)).toHaveLength(0);
    expect(screen.getByTestId('brand-pill').props.children).toHaveLength(2);
  });

  it('reads as the brand’s name alone, not its initial and then its name', () => {
    render(<BrandPill brand={esselunga} />);
    const pill = screen.getByTestId('brand-pill');

    expect(pill.props.accessible).toBe(true);
    expect(pill.props.accessibilityLabel).toBe('Esselunga');
  });
});

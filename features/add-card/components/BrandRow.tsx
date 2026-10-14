/**
 * BrandRow Component
 * Story 13.4: Restyle Add Card Flow (AC1)
 * Story 22.5: Capture frame A's 64pt row
 *
 * One catalogue brand in the brand list: a 40pt circle filled with the brand's own colour and
 * carrying its initial in whichever of white or ink reads on it, the name, and a chevron.
 *
 * The brand colours are the content of this screen, so the circle takes the card tile's legibility
 * rule (`getTileAppearance`) rather than a fill of its own: a very light brand takes the 1pt
 * hairline in either scheme, and a near-black one takes it against the dark scheme's ink surface.
 */

import React from 'react';

import { getTileAppearance } from '@/shared/components/ui/Tile';
import { useTheme } from '@/shared/theme';
import { getContrastForeground } from '@/shared/theme/luminance';

import { CatalogueBrand } from '@/catalogue/types';

import { BrandListCircle, BrandListRow } from './BrandListRow';

interface BrandRowProps {
  brand: CatalogueBrand;
  onPress: (brand: CatalogueBrand) => void;
  testID?: string;
}

export const BrandRow: React.FC<BrandRowProps> = ({ brand, onPress, testID }) => {
  const { isDark } = useTheme();
  const { isLight, isNearBlack } = getTileAppearance(brand.color);

  return (
    <BrandListRow
      testID={testID}
      circle={
        <BrandListCircle
          testID={testID ? `${testID}-circle` : undefined}
          fill={brand.color}
          isOutlined={isLight || (isDark && isNearBlack)}
          glyph={brand.name.charAt(0).toUpperCase()}
          glyphColor={getContrastForeground(brand.color)}
        />
      }
      label={brand.name}
      onPress={() => onPress(brand)}
      accessibilityLabel={brand.name}
    />
  );
};

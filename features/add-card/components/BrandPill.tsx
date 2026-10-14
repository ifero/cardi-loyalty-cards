/**
 * BrandPill Component
 * Story 13.4: Restyle Add Card Flow (AC4)
 * Story 22.5: Capture frame B's pill
 *
 * Says which card the scanner is looking for. The brand was chosen on the previous screen, so it is
 * stated, never asked — and a custom card, which has no brand, has no pill.
 *
 * Frame B draws it: a fully round pill in the brand's own colour, padded 6 / 12 / 6 / 6, holding a
 * 24pt white dot with the brand's initial in `label-bold` ink, then the name 8pt on in `body-md`
 * semibold, in whichever of white or ink reads on that colour. It draws no logo.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { getTileAppearance } from '@/shared/components/ui/Tile';
import { CAMERA_OVERLAY, IDENTITY_COLORS } from '@/shared/theme/colors';
import { getContrastForeground } from '@/shared/theme/luminance';
import { SPACING } from '@/shared/theme/spacing';
import { LIGHT_THEME_COLORS } from '@/shared/theme/tokens.generated';
import { MONOGRAM_TEXT_PROPS, TYPOGRAPHY } from '@/shared/theme/typography';

import { CatalogueBrand } from '@/catalogue/types';

interface BrandPillProps {
  brand: CatalogueBrand;
  testID?: string;
}

const DOT_SIZE = 24;

/** Fully round at any height, so the pill stays a pill when large text grows it. */
const PILL_RADIUS = 999;

export const BrandPill: React.FC<BrandPillProps> = ({ brand, testID = 'brand-pill' }) => {
  const foregroundColor = getContrastForeground(brand.color);
  // A white dot on a white (or near-white) brand would vanish into its pill: it takes the light
  // hairline, as such a brand's tile does. The pill is on the camera feed, so the light value
  // holds in both schemes.
  const isDotOutlined = getTileAppearance(brand.color).isLight;

  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={brand.name}
      style={[styles.pill, { backgroundColor: brand.color }]}
    >
      <View testID={`${testID}-dot`} style={[styles.dot, isDotOutlined ? styles.dotOutline : null]}>
        {/* A mark sized to its dot, like any avatar initial: it does not take Dynamic Type. */}
        <Text {...MONOGRAM_TEXT_PROPS} style={styles.initial}>
          {brand.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={[styles.name, { color: foregroundColor }]} numberOfLines={1}>
        {brand.name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: PILL_RADIUS,
    // The frame's 6 / 12 / 6 / 6: the dot sits as close to the round end as to the top and bottom.
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
    gap: SPACING.sm,
    // Never wider than the screen's margins: a long name ends in an ellipsis instead.
    maxWidth: '100%'
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: CAMERA_OVERLAY.mark,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dotOutline: {
    borderWidth: 1,
    borderColor: LIGHT_THEME_COLORS.border
  },
  initial: {
    ...TYPOGRAPHY.labelBold,
    color: IDENTITY_COLORS.ink
  },
  name: {
    ...TYPOGRAPHY.bodyMdStrong,
    flexShrink: 1
  }
});

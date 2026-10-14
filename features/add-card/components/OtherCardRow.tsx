/**
 * OtherCardRow Component
 * Story 13.4: Restyle Add Card Flow (AC1)
 * Story 22.5: Capture frame A's row — the last row of ALL CARDS, and of RESULTS while searching
 *
 * The way in to a custom card, a brand the catalogue does not have. The same row as a brand's: its
 * circle is the ground inside a 1pt hairline, holding a "+" in `textPrimary`, then "Other card"
 * with "Add a custom loyalty card" beneath it.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/shared/theme';

import { BrandListCircle, BrandListRow } from './BrandListRow';

interface OtherCardRowProps {
  onPress: () => void;
  testID?: string;
}

export const OtherCardRow: React.FC<OtherCardRowProps> = ({
  onPress,
  testID = 'other-card-row'
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <BrandListRow
      testID={testID}
      circle={
        <BrandListCircle
          testID={`${testID}-circle`}
          fill={theme.background}
          isOutlined
          glyph="+"
          glyphColor={theme.textPrimary}
        />
      }
      label={t('addCard.otherCard.label')}
      subtitle={t('addCard.otherCard.subtitle')}
      onPress={onPress}
      accessibilityLabel={t('addCard.otherCard.accessibilityLabel')}
    />
  );
};

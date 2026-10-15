/**
 * CardSetupScreen
 * Story 13.4: Restyle Add Card Flow (AC5, AC6, T4, T5)
 * Story 22.6: The form pattern — drawn by `FormScreen`, from the four form frames
 *
 * Dual-mode screen:
 * - Catalogue mode: the brand's own wallet tile + card number (pre-filled) + "Done"
 * - Custom mode: store name + card number with the scan button + colour picker + "Done"
 *
 * On "Done": saves the card via useAddCard, which replaces the stack with Home on success. A save
 * that fails shows in the form's request banner, and Done stays pressable.
 */

import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccessibilityInfo,
  StyleSheet,
  View,
  useWindowDimensions,
  type TextInput
} from 'react-native';

import { CatalogueRepository } from '@/core/catalogue/catalogue-repository';
import { BarcodeFormat, CardColor, DEFAULT_CARD_COLOR } from '@/core/schemas';
import { mapHexToCardColor } from '@/core/utils';

import { ColorPicker } from '@/shared/components/ui/ColorPicker';
import { FormField, FormScreen } from '@/shared/components/ui/FormScreen';
import { TextField } from '@/shared/components/ui/TextField';
import { Tile, getTileAppearance } from '@/shared/components/ui/Tile';

import { CardTileMark } from '@/features/cards/components/CardTile';
import { useAddCard } from '@/features/cards/hooks/useAddCard';
import {
  TILE_RADIUS,
  getGridTileHeight,
  getGridTileWidth
} from '@/features/cards/utils/gridLayout';

import { CatalogueBrand } from '@/catalogue/types';

import { InlineScanButton } from '../components/InlineScanButton';

/** The card schema's cap on a card's name (`loyaltyCardSchema`), which setup never applied. */
const STORE_NAME_MAX_LENGTH = 50;

type SetupParams = {
  mode: 'catalogue' | 'custom';
  brandId?: string;
  brandName?: string;
  brandColor?: string;
  brandLogo?: string;
  barcode?: string;
  barcodeFormat?: string;
};

/**
 * Catalogue mode's preview: the brand's own wallet tile, at the wallet grid's size on this device,
 * centred, with its name beneath — the card exactly as it will look in the wallet. It is a picture
 * of the card, not a control: the tile draws without a press, and a screen reader reads its name
 * once.
 */
const BrandTile = ({ brand }: { brand: CatalogueBrand }) => {
  const { width: windowWidth } = useWindowDimensions();
  const tileWidth = getGridTileWidth(windowWidth);
  const tileHeight = getGridTileHeight(tileWidth);

  return (
    <View style={styles.brandTile}>
      <Tile
        fill={brand.color}
        width={tileWidth}
        height={tileHeight}
        radius={TILE_RADIUS}
        label={brand.name}
        testID="setup-brand-tile"
      >
        <CardTileMark
          brand={brand}
          name={brand.name}
          tileWidth={tileWidth}
          tileHeight={tileHeight}
          color={getTileAppearance(brand.color).foreground}
        />
      </Tile>
    </View>
  );
};

export const CardSetupScreen: React.FC = () => {
  const { t } = useTranslation();
  const params = useLocalSearchParams<SetupParams>();
  const { addCard, isLoading, error: saveError } = useAddCard();
  const storeNameRef = useRef<TextInput>(null);

  const mode = params.mode ?? 'custom';

  useEffect(() => {
    const announcement =
      mode === 'catalogue'
        ? t('addCard.setup.catalogueAnnouncement')
        : t('addCard.setup.customAnnouncement');
    AccessibilityInfo.announceForAccessibility?.(announcement);
  }, [mode, t]);

  // Resolve brand for catalogue mode
  const brand = useMemo<CatalogueBrand | undefined>(() => {
    if (mode !== 'catalogue' || !params.brandId) return undefined;
    const catalogueBrand = CatalogueRepository.getInstance().getBrandById(params.brandId);
    if (catalogueBrand) return catalogueBrand;
    if (params.brandName && params.brandColor) {
      return {
        id: params.brandId,
        name: params.brandName,
        color: params.brandColor,
        logo: params.brandLogo ?? '',
        aliases: []
      };
    }
    return undefined;
  }, [mode, params.brandId, params.brandName, params.brandColor, params.brandLogo]);

  // Form state
  const [storeName, setStoreName] = useState('');
  const [cardNumber, setCardNumber] = useState(params.barcode ?? '');
  const [color, setColor] = useState<CardColor>(brand ? mapHexToCardColor(brand.color) : 'blue');
  const [storeNameError, setStoreNameError] = useState('');
  // Validation is revealed by Done; from then on the store name re-validates as it is typed.
  const [hasPressedDone, setHasPressedDone] = useState(false);
  const barcodeFormat = (params.barcodeFormat as BarcodeFormat) ?? 'CODE128';

  // Custom mode requires a store name; the card number stays optional (Story 13.4).
  const validateStoreName = useCallback(
    (name: string) => (name.trim() ? '' : t('addCard.setup.storeNameRequired')),
    [t]
  );

  const handleStoreNameChange = useCallback(
    (text: string) => {
      setStoreName(text);
      if (hasPressedDone) {
        setStoreNameError(validateStoreName(text));
      }
    },
    [hasPressedDone, validateStoreName]
  );

  const handleDone = useCallback(async () => {
    setHasPressedDone(true);

    // Validate custom mode required fields
    if (mode === 'custom') {
      const nameError = validateStoreName(storeName);
      setStoreNameError(nameError);
      if (nameError) {
        storeNameRef.current?.focus();
        return;
      }
    }

    const name = mode === 'catalogue' ? (brand?.name ?? '') : storeName.trim();
    // `#1A73E8` stood here until Story 21.2a: a hard-coded copy of the retired
    // CARD_COLORS.blue, used only as a placeholder to map when a catalogue card
    // somehow has no brand. Mapping a placeholder hex to find a key is a detour —
    // name the fallback key instead, so it cannot go stale with the palette again.
    //
    // ⚠️ This is a BEHAVIOUR CHANGE, not only a rename: that branch used to yield
    // `'blue'` (the placeholder mapped to the single blue bucket) and now yields
    // DEFAULT_CARD_COLOR. It is reachable but abnormal — catalogue mode with no
    // resolvable brand, which already produces a card with an empty name — and the
    // new value is the more honest one: an unresolvable colour is exactly what
    // DEFAULT_CARD_COLOR means.
    const catalogueColor = brand ? mapHexToCardColor(brand.color) : DEFAULT_CARD_COLOR;
    const cardColor = mode === 'catalogue' ? catalogueColor : color;

    await addCard({
      name,
      barcode: cardNumber.trim(),
      barcodeFormat,
      color: cardColor,
      brandId: brand?.id
    });

    // Pop entire add-card stack and go home
    // The useAddCard hook already navigates to '/'
  }, [mode, storeName, cardNumber, color, barcodeFormat, brand, addCard, validateStoreName]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleInlineScan = useCallback(() => {
    // Navigate to scanner, returning to this screen with result
    router.push({
      pathname: '/add-card/scan',
      params: {
        brandId: brand?.id ?? '',
        brandName: brand?.name ?? '',
        brandColor: brand?.color ?? '',
        brandLogo: brand?.logo ?? '',
        returnToSetup: 'true'
      }
    });
  }, [brand]);

  return (
    <FormScreen
      title={
        mode === 'catalogue'
          ? t('addCard.setup.catalogueHeading')
          : t('addCard.setup.customHeading')
      }
      onBack={handleBack}
      backTestID="setup-back-button"
      primaryAction={{
        label: t('common.actions.done'),
        onPress: handleDone,
        busy: isLoading,
        testID: 'done-button'
      }}
      requestError={saveError}
    >
      {mode === 'catalogue' && brand ? <BrandTile brand={brand} /> : null}

      {mode === 'custom' ? (
        <TextField
          ref={storeNameRef}
          label={t('addCard.setup.storeNameLabel')}
          value={storeName}
          onChangeText={handleStoreNameChange}
          placeholder={t('addCard.setup.storeNamePlaceholder')}
          maxLength={STORE_NAME_MAX_LENGTH}
          error={storeNameError}
          accessibilityLabel={t('addCard.setup.storeNameLabel')}
          testID="store-name-field"
        />
      ) : null}

      <TextField
        label={t('addCard.setup.cardNumberLabel')}
        value={cardNumber}
        onChangeText={setCardNumber}
        placeholder={t('addCard.setup.cardNumberPlaceholder')}
        mono
        accessibilityLabel={t('addCard.setup.cardNumberLabel')}
        trailing={
          mode === 'custom' ? (
            <InlineScanButton onPress={handleInlineScan} testID="inline-scan-button" />
          ) : undefined
        }
        testID="card-number-field"
      />

      {mode === 'custom' ? (
        <FormField label={t('addCard.setup.colorLabel')}>
          <ColorPicker value={color} onChange={setColor} testID="color-picker" />
        </FormField>
      ) : null}
    </FormScreen>
  );
};

const styles = StyleSheet.create({
  brandTile: {
    alignItems: 'center'
  }
});

/**
 * BrandScannerScreen
 * Story 13.4: Restyle Add Card Flow (AC3, AC4, T3)
 * Story 22.5: The picker's visibility pauses the overlay's viewfinder and scanning (frame D)
 *
 * Full-bleed camera scanner with brand pill, viewfinder corners, and scan line.
 * Reuses useBarcodeScanner hook. On scan → auto-navigate to CardSetupScreen.
 * "Enter card number manually" → CardSetupScreen without scan data.
 */

import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, View } from 'react-native';

import { CatalogueRepository } from '@/core/catalogue/catalogue-repository';

import { ScanResult } from '@/features/cards/hooks/useBarcodeScanner';

import { CatalogueBrand } from '@/catalogue/types';

import { BrandPill } from '../components/BrandPill';
import { MultiCodePickerSheet } from '../components/MultiCodePickerSheet';
import { ScannerOverlay } from '../components/ScannerOverlay';
import { useImageScan } from '../hooks/useImageScan';

type ScanParams = {
  brandId?: string;
  brandName?: string;
  brandColor?: string;
  brandLogo?: string;
  returnToSetup?: string;
};

export const BrandScannerScreen: React.FC = () => {
  const { t } = useTranslation();
  const params = useLocalSearchParams<ScanParams>();
  const shouldReturnToSetup = params.returnToSetup === 'true';

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility?.(t('addCard.scanner.screenAnnouncement'));
  }, [t]);

  // Reconstruct brand from params (or look up from catalogue)
  const brand = useMemo<CatalogueBrand | undefined>(() => {
    if (!params.brandId) return undefined;

    // Try catalogue first
    const catalogueBrand = CatalogueRepository.getInstance().getBrandById(params.brandId);
    if (catalogueBrand) return catalogueBrand;

    // Fallback: reconstruct from params
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
  }, [params.brandId, params.brandName, params.brandColor, params.brandLogo]);

  const handleScan = useCallback(
    (result: ScanResult) => {
      // Auto-navigate to setup with scanned data
      const navigate = shouldReturnToSetup ? router.replace : router.push;
      navigate({
        pathname: '/add-card/setup',
        params: {
          mode: brand ? 'catalogue' : 'custom',
          brandId: brand?.id ?? '',
          brandName: brand?.name ?? '',
          brandColor: brand?.color ?? '',
          brandLogo: brand?.logo ?? '',
          barcode: result.barcode,
          barcodeFormat: result.format
        }
      });
    },
    [brand, shouldReturnToSetup]
  );

  const handleManualEntry = useCallback(() => {
    const navigate = shouldReturnToSetup ? router.replace : router.push;
    navigate({
      pathname: '/add-card/setup',
      params: {
        mode: brand ? 'catalogue' : 'custom',
        brandId: brand?.id ?? '',
        brandName: brand?.name ?? '',
        brandColor: brand?.color ?? '',
        brandLogo: brand?.logo ?? ''
      }
    });
  }, [brand, shouldReturnToSetup]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const {
    isProcessing: isProcessingImage,
    showError: imageError,
    errorReason: imageErrorReason,
    multiCodes,
    pickAndScan,
    dismissError,
    dismissMultiPicker,
    selectCode
  } = useImageScan({ onCodeResolved: handleScan, expectedFormat: brand?.defaultFormat });

  // One list drives both: the picker shows while it holds codes, and the overlay pauses its
  // viewfinder and its scanning for exactly as long.
  const isPickerVisible = multiCodes.length > 0;

  return (
    <View style={{ flex: 1 }}>
      <ScannerOverlay
        onScan={handleScan}
        onManualEntry={handleManualEntry}
        onBack={handleBack}
        brandPill={brand ? <BrandPill brand={brand} /> : undefined}
        testID="brand-scanner-screen"
        onImageScan={pickAndScan}
        isProcessingImage={isProcessingImage}
        imageError={imageError}
        imageErrorReason={imageErrorReason ?? undefined}
        onImageErrorDismiss={dismissError}
        onImageErrorRetry={pickAndScan}
        onImageErrorManualEntry={handleManualEntry}
        expectedFormat={brand?.defaultFormat}
        isPickerVisible={isPickerVisible}
      />
      <MultiCodePickerSheet
        visible={isPickerVisible}
        codes={multiCodes}
        onSelect={selectCode}
        onDismiss={dismissMultiPicker}
      />
    </View>
  );
};

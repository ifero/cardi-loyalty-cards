/**
 * Edit Card Screen
 * Story 2.7: Edit Card
 * Story 22.6: The form pattern — the screen draws its own header, so its back runs the discard check
 *
 * Allows users to update their card's information including:
 * - Card name
 * - Barcode number
 * - Barcode format (auto-detected)
 * - Card color
 *
 * Draws the form with `CardForm`, whose one caller it is, on the shared form pattern
 * (`FormScreen`). The route hides the native header (`app/_layout.tsx`): every state, loading and
 * error included, draws the form pattern's header.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, BackHandler, StyleSheet, Text, View } from 'react-native';

import { getCardById } from '@/core/database';
import { LoyaltyCard } from '@/core/schemas';
import { logger } from '@/core/utils/logger';

import { FormScreen } from '@/shared/components/ui/FormScreen';
import { useTheme } from '@/shared/theme';
import { SPACING } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import { CardForm, CardFormInput } from '@/features/cards/components/CardForm';
import { useEditCard } from '@/features/cards/hooks/useEditCard';

const BACK_TEST_ID = 'edit-back-button';

const EditCardScreen = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [card, setCard] = useState<LoyaltyCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { editCard, isLoading: isUpdating, error: saveError } = useEditCard();

  // Track if form has unsaved changes for discard confirmation (AC10)
  const isDirtyRef = useRef(false);

  /**
   * Fetch card data from database
   */
  useEffect(() => {
    const fetchCard = async () => {
      if (!id) {
        setError(t('cards.edit.invalidId'));
        setIsLoading(false);
        return;
      }

      try {
        const cardData = await getCardById(id);
        if (cardData) {
          setCard(cardData);
        } else {
          setError(t('cards.edit.notFound'));
        }
      } catch (err) {
        logger.error('Failed to fetch card:', err);
        setError(t('cards.edit.loadFailed'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCard();
  }, [id, t]);

  /**
   * Handle form dirty state changes
   */
  const handleDirtyChange = useCallback((isDirty: boolean) => {
    isDirtyRef.current = isDirty;
  }, []);

  /**
   * Show discard confirmation dialog (AC10)
   */
  const showDiscardConfirmation = useCallback(() => {
    Alert.alert(t('cards.edit.discardTitle'), t('cards.edit.discardBody'), [
      { text: t('cards.edit.keepEditing'), style: 'cancel' },
      {
        text: t('cards.edit.discard'),
        style: 'destructive',
        onPress: () => router.back()
      }
    ]);
  }, [router, t]);

  /**
   * Handle back navigation with discard confirmation
   */
  const handleBackPress = useCallback(() => {
    if (isDirtyRef.current) {
      showDiscardConfirmation();
      return true; // Prevent default back behavior
    }
    return false; // Allow default back behavior
  }, [showDiscardConfirmation]);

  // Handle hardware back button on Android (AC10)
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => subscription.remove();
  }, [handleBackPress]);

  /**
   * The header's back: the same discard check as Android's back, then straight back when there is
   * nothing to lose. The native header's own back skipped the check (Story 22.6).
   */
  const handleHeaderBack = useCallback(() => {
    if (!handleBackPress()) {
      router.back();
    }
  }, [handleBackPress, router]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (data: CardFormInput) => {
    if (!id) return;
    await editCard(id, data);
  };

  // Loading state: the pattern's header over the ground, with nothing to submit.
  if (isLoading) {
    return (
      <FormScreen title={t('cards.edit.title')} onBack={handleHeaderBack} backTestID={BACK_TEST_ID}>
        <View style={styles.centred} testID="edit-card-loading">
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </FormScreen>
    );
  }

  // Error state: the same header, with the message where the form would be.
  if (error || !card) {
    return (
      <FormScreen title={t('cards.edit.title')} onBack={handleHeaderBack} backTestID={BACK_TEST_ID}>
        <View style={styles.centred} testID="edit-card-error">
          <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>
            {error || t('cards.edit.notFound')}
          </Text>
          <Text style={[styles.errorDescription, { color: theme.textSecondary }]}>
            {t('cards.edit.missingDescription')}
          </Text>
        </View>
      </FormScreen>
    );
  }

  // Success state - render edit form
  return (
    <CardForm
      title={t('cards.edit.title')}
      onBack={handleHeaderBack}
      backTestID={BACK_TEST_ID}
      defaultValues={{
        name: card.name,
        barcode: card.barcode,
        barcodeFormat: card.barcodeFormat,
        color: card.color
      }}
      onSubmit={handleSubmit}
      submitLabel={t('cards.edit.save')}
      isLoading={isUpdating}
      requestError={saveError}
      onDirtyChange={handleDirtyChange}
      focusNameOnMount={false}
      testID="edit-card-form"
    />
  );
};

const styles = StyleSheet.create({
  // The loading spinner and the error message, centred in the space below the header.
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  errorTitle: {
    ...TYPOGRAPHY.bodyLgStrong,
    marginBottom: SPACING.sm
  },
  errorDescription: {
    ...TYPOGRAPHY.bodyMd,
    textAlign: 'center'
  }
});

export default EditCardScreen;

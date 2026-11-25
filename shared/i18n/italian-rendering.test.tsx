import { act, render, screen } from '@testing-library/react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { changeAppLanguage } from './index';

const TranslationProbe = () => {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('settings.preferences.languageLabel')}</Text>
      <Text>{t('auth.signIn.heading')}</Text>
      <Text>{t('addCard.selection.heading')}</Text>
      <Text>{t('cards.home.emptyStateTitle')}</Text>
      <Text>{t('cards.details.manageSection')}</Text>
      {/*
        Story 21.2a, AC5 — the composed colour-picker announcement, which is the
        whole of what a screen-reader user gets when choosing a card colour. Both
        pickers build their `accessibilityLabel` exactly this way, so this probes
        the string the user actually hears rather than the raw label token.
      */}
      <Text>
        {t('cards.colors.accessibilityLabel', {
          color: t('cards.colors.orange'),
          selected: t('cards.colors.selectedSuffix')
        })}
      </Text>
      <Text>
        {t('cards.colors.accessibilityLabel', {
          color: t('cards.colors.grey'),
          selected: ''
        })}
      </Text>
      <Text>
        {t('cards.colors.accessibilityLabel', { color: t('cards.colors.blue'), selected: '' })}
      </Text>
    </View>
  );
};

describe('Italian localization rendering', () => {
  afterEach(async () => {
    await act(async () => {
      await changeAppLanguage('en');
    });
  });

  it('renders Italian copy across the main translated flows', async () => {
    await act(async () => {
      await changeAppLanguage('it');
    });

    render(<TranslationProbe />);

    expect(screen.getByText('Lingua')).toBeTruthy();
    expect(screen.getByText('Bentornato')).toBeTruthy();
    expect(screen.getByText('Aggiungi carta')).toBeTruthy();
    expect(screen.getByText('Nessuna carta ancora')).toBeTruthy();
    expect(screen.getByText('Gestisci')).toBeTruthy();
  });

  /**
   * Story 22.2 — the wallet frames' copy, decided in both locales. `locales/card-colors.test.ts`
   * holds the two files to the same KEYS; this pins the Italian VALUES the frames decided, as
   * they render.
   */
  it('renders the wallet frames’ Italian copy', async () => {
    await act(async () => {
      await changeAppLanguage('it');
    });

    const WalletProbe = () => {
      const { t } = useTranslation();
      return (
        <View>
          <Text>{t('cards.sort.count', { count: 1 })}</Text>
          <Text>{t('cards.sort.count', { count: 8 })}</Text>
          <Text>{t('cards.sort.sheetTitle')}</Text>
          <Text>{t('cards.home.emptyStateCta')}</Text>
          <Text>{t('cards.home.noResults', { query: 'Ikea' })}</Text>
          <Text>{t('cards.home.cardTileFavouriteAccessibilityLabel', { name: 'Esselunga' })}</Text>
        </View>
      );
    };
    render(<WalletProbe />);

    expect(screen.getByText('1 carta')).toBeTruthy();
    expect(screen.getByText('8 carte')).toBeTruthy();
    expect(screen.getByText('Ordina per')).toBeTruthy();
    expect(screen.getByText('Aggiungi la tua prima carta')).toBeTruthy();
    expect(screen.getByText('Nessuna carta corrisponde a “Ikea”')).toBeTruthy();
    expect(screen.getByText('Esselunga, preferita')).toBeTruthy();
  });

  /**
   * Story 21.2a, AC5 — the Italian half of the colour labels, as a screen reader
   * would announce it.
   *
   * Every ColorPicker test runs under the default English locale, so before this the
   * Italian labels were correct only by inspection. They carry unusual weight: the
   * five CardColor keys are frozen wire identifiers and two are deliberately
   * misnamed, so the label is the only thing standing between a user and being told
   * a yellow swatch is orange.
   */
  it('composes the Italian colour-picker accessibility announcement', async () => {
    await act(async () => {
      await changeAppLanguage('it');
    });

    render(<TranslationProbe />);

    // `orange` renders the beam yellow and `grey` renders the azure — the
    // announcement must say so, not echo the key.
    expect(screen.getByText('Colore Giallo, selezionato')).toBeTruthy();
    expect(screen.getByText('Colore Azzurro')).toBeTruthy();
    // Two blues in one picker, so the deep one is qualified.
    expect(screen.getByText('Colore Blu scuro')).toBeTruthy();
  });

  /**
   * Story 16.45 — the erase-failed toast is the only sign-out copy that never renders inside the
   * sheet, so `SignOutSheet`'s Italian test cannot reach it. Pin its Italian value here.
   */
  it('renders the Italian erase-failed sign-out toast', async () => {
    await act(async () => {
      await changeAppLanguage('it');
    });

    const ToastProbe = () => {
      const { t } = useTranslation();
      return <Text>{t('settings.signOutSheet.eraseFailed')}</Text>;
    };
    render(<ToastProbe />);

    expect(
      screen.getByText(
        'Disconnessione eseguita, ma non è stato possibile cancellare le carte da questo dispositivo'
      )
    ).toBeTruthy();
  });
});

/**
 * HelpScreen
 * Story 4.3: Help & FAQ Access
 * Story 22.8: Document frame B, the searchable FAQ
 *
 * Draws `DocumentScreen`, whose header carries "Help & FAQ", so the body opens with the subtitle.
 * Then the system's search field, the questions on one outlined surface, any number of them open at
 * once, and Contact Support above Submit Feedback. A search that matches nothing says so in one line
 * in the list's place, and the actions stay.
 */

import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { Button, DocumentScreen, SearchBar, Surface } from '@/shared/components/ui';
import { useTheme } from '@/shared/theme';
import { SPACING } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import { FaqItem } from './FaqItem';
import docHelpItemsIt from './help-data.it.json';
import docHelpItemsEn from './help-data.json';
import { fallbackHelpItemsEn, fallbackHelpItemsIt, type HelpItem } from './help-fallback';

const SUPPORT_MAIL_URL = 'mailto:support@myloyaltycards.app';
const FEEDBACK_URL = 'https://myloyaltycards.app/feedback';

/** How far below the field the no-results line sits: the wallet's frame D. */
const NO_RESULTS_OFFSET = 80;

type HelpLanguageCode = 'en' | 'it';

const resolveHelpLanguage = (language: string): HelpLanguageCode =>
  language.toLowerCase().startsWith('it') ? 'it' : 'en';

const sourceHelpItemsByLanguage: Record<HelpLanguageCode, HelpItem[]> = {
  en:
    Array.isArray(docHelpItemsEn) && docHelpItemsEn.length > 0
      ? docHelpItemsEn
      : fallbackHelpItemsEn,
  it:
    Array.isArray(docHelpItemsIt) && docHelpItemsIt.length > 0
      ? docHelpItemsIt
      : fallbackHelpItemsIt
};

const fallbackHelpItemsByLanguage: Record<HelpLanguageCode, HelpItem[]> = {
  en: fallbackHelpItemsEn,
  it: fallbackHelpItemsIt
};

type HelpScreenProps = {
  itemsOverride?: HelpItem[];
};

const HelpScreen = ({ itemsOverride }: HelpScreenProps) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const language = resolveHelpLanguage(i18n.language);
  const sourceHelpItems = sourceHelpItemsByLanguage[language];
  const fallbackHelpItems = fallbackHelpItemsByLanguage[language];
  const resolvedItems = itemsOverride ?? sourceHelpItems;
  const displayItems = resolvedItems.length > 0 ? resolvedItems : fallbackHelpItems;
  const [query, setQuery] = useState('');
  // The open questions: none at rest, and opening one closes no other (decision, 2026-10-19), so no
  // answer closing above a tapped question moves it. An open question stays open through a search.
  const [openIds, setOpenIds] = useState<readonly string[]>([]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return displayItems;

    return displayItems.filter((item) => {
      const haystack = [item.question, item.answer, ...item.tags].join(' ').toLowerCase();
      return haystack.includes(normalized);
    });
  }, [displayItems, query]);

  const toggleOpen = (id: string) => {
    setOpenIds((current) =>
      current.includes(id) ? current.filter((openId) => openId !== id) : [...current, id]
    );
  };

  const openExternal = async (url: string, fallbackMessage: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert(t('help.openFailedTitle'), fallbackMessage);
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('help.openFailedTitle'), fallbackMessage);
    }
  };

  return (
    <DocumentScreen
      title={t('help.title')}
      onBack={() => router.back()}
      testID="help-document"
      titleTestID="help-title"
      backTestID="help-back-button"
      bodyTestID="help-screen"
    >
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t('help.subtitle')}</Text>

      <View style={styles.search}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery('')}
          testID="help-search"
          placeholder={t('help.searchPlaceholder')}
          accessibilityLabel={t('help.searchPlaceholder')}
          clearAccessibilityLabel={t('help.clearSearchAccessibilityLabel')}
        />
      </View>

      {filteredItems.length > 0 ? (
        <View style={styles.list}>
          <Surface divided testID="help-faq-list">
            {filteredItems.map((item) => (
              <FaqItem
                key={item.id}
                item={item}
                isOpen={openIds.includes(item.id)}
                onToggle={() => toggleOpen(item.id)}
              />
            ))}
          </Surface>
        </View>
      ) : (
        // A miss is not an error: one line, where the list was.
        <Text testID="help-no-results" style={[styles.noResults, { color: theme.textSecondary }]}>
          {t('help.noResults', { query: query.trim() })}
        </Text>
      )}

      <View style={styles.actions}>
        <Button
          variant="primary"
          testID="help-contact-support"
          accessibilityLabel={t('help.contactSupportA11y')}
          onPress={() => void openExternal(SUPPORT_MAIL_URL, t('help.contactSupportUnavailable'))}
        >
          {t('help.contactSupport')}
        </Button>
        <Button
          variant="secondary"
          testID="help-submit-feedback"
          accessibilityLabel={t('help.submitFeedbackA11y')}
          onPress={() => void openExternal(FEEDBACK_URL, t('help.submitFeedbackUnavailable'))}
        >
          {t('help.submitFeedback')}
        </Button>
      </View>
    </DocumentScreen>
  );
};

const styles = StyleSheet.create({
  subtitle: {
    ...TYPOGRAPHY.bodyMd
  },
  search: {
    marginTop: SPACING.lg
  },
  list: {
    marginTop: SPACING.lg
  },
  noResults: {
    ...TYPOGRAPHY.bodyMd,
    marginTop: NO_RESULTS_OFFSET,
    textAlign: 'center'
  },
  // Full width and 8 apart, at the default 48: `Buttons` gives 52 only to a footer's primary and a
  // sheet's actions.
  actions: {
    marginTop: SPACING.xl,
    gap: SPACING.sm
  }
});

export default HelpScreen;

/**
 * PrivacyPolicyScreen
 * Story 6-4: Privacy Policy & Consent Flow
 * Story 22.8: Document frame A, the prose document
 *
 * Renders the bundled privacy policy as styled text, and works fully offline: all content is
 * imported from `assets/legal/`. It draws `DocumentScreen`, whose header carries the policy's title,
 * so the body opens with the meta line and never repeats the title. No link, icon, card or box: the
 * page is the ground and the words are ink.
 */

import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { BulletList, DocumentScreen } from '@/shared/components/ui';
import { useTheme } from '@/shared/theme';
import { SPACING } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import {
  PRIVACY_POLICY_CONTENT,
  PRIVACY_POLICY_LAST_UPDATED,
  PRIVACY_POLICY_VERSION
} from '@/assets/legal/privacy-policy';
import {
  PRIVACY_POLICY_CONTENT_IT,
  PRIVACY_POLICY_LAST_UPDATED_LABEL_IT,
  PRIVACY_POLICY_TITLE_IT
} from '@/assets/legal/privacy-policy.it';

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/** Regex to detect numbered section headers (e.g. "1. Introduction") */
const SECTION_HEADER_RE = /^\d+\.\s+.+$/;

/** How the policy's source marks a bullet line. `BulletList` draws its own glyph. */
const BULLET_MARK = '•';

/** The policy's first two lines, its title and "Last updated", which the header and meta show. */
const LINES_NOT_DRAWN = 2;

export type PolicyBlock =
  | { kind: 'section'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullets'; items: string[] };

/**
 * Splits the policy into the blocks frame A draws, as the screen always has read it: the first two
 * lines are not drawn, a numbered line is a section head, a `•` line is a bullet and any other
 * line a paragraph. Consecutive bullet lines make one list. A blank line draws nothing: the blocks
 * carry the spacing.
 */
export const parsePolicy = (content: string): PolicyBlock[] => {
  const blocks: PolicyBlock[] = [];
  // The list a bullet line joins: the one the line before it started, or none.
  let bullets: string[] | null = null;

  for (const line of content.split('\n').slice(LINES_NOT_DRAWN)) {
    const text = line.trim();

    if (text.startsWith(BULLET_MARK)) {
      const item = text.slice(BULLET_MARK.length).trim();
      if (bullets) {
        bullets.push(item);
      } else {
        bullets = [item];
        blocks.push({ kind: 'bullets', items: bullets });
      }
      continue;
    }

    bullets = null;
    if (text === '') continue;
    blocks.push(
      SECTION_HEADER_RE.test(text) ? { kind: 'section', text } : { kind: 'paragraph', text }
    );
  }

  return blocks;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PrivacyPolicyScreen = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const isItalian = i18n.language.toLowerCase().startsWith('it');
  const policyTitle = isItalian ? PRIVACY_POLICY_TITLE_IT : t('privacy.title');
  const policyLastUpdatedLabel = isItalian
    ? PRIVACY_POLICY_LAST_UPDATED_LABEL_IT
    : t('privacy.lastUpdated');
  const policyContent = isItalian ? PRIVACY_POLICY_CONTENT_IT : PRIVACY_POLICY_CONTENT;

  const blocks = useMemo(() => parsePolicy(policyContent), [policyContent]);

  return (
    <DocumentScreen
      title={policyTitle}
      onBack={() => router.back()}
      testID="privacy-policy-document"
      titleTestID="privacy-policy-title"
      backTestID="privacy-policy-back-button"
      bodyTestID="privacy-policy-screen"
    >
      {/* Meta: document metadata, the chrome tier */}
      <Text testID="privacy-policy-meta" style={[styles.meta, { color: theme.textSecondary }]}>
        {t('privacy.version', { version: PRIVACY_POLICY_VERSION })} · {policyLastUpdatedLabel}:{' '}
        {PRIVACY_POLICY_LAST_UPDATED}
      </Text>

      {blocks.map((block, index) => {
        // The last block leaves nothing below it, so the policy ends at the body's own 24 plus the
        // bottom inset, as help and the table do.
        const end = index === blocks.length - 1 ? styles.end : null;

        switch (block.kind) {
          case 'section':
            return (
              <Text
                key={index}
                accessibilityRole="header"
                style={[styles.section, end, { color: theme.textPrimary }]}
              >
                {block.text}
              </Text>
            );
          case 'paragraph':
            return (
              <Text key={index} style={[styles.paragraph, end, { color: theme.textPrimary }]}>
                {block.text}
              </Text>
            );
          case 'bullets':
            return (
              <View key={index} style={[styles.bullets, end]}>
                <BulletList items={block.items} tone="default" />
              </View>
            );
        }
      })}
    </DocumentScreen>
  );
};

/**
 * Every block but the last leaves 8 below it. A section head stands 32 below the block before it, as
 * frame A draws it: there the 8 under a paragraph and the 32 over a head collapse into 32, which
 * React Native's layout does not do, so the head takes the 24 that remain.
 */
const BLOCK_SPACE = SPACING.sm;
const SECTION_SPACE = SPACING.xl;

const styles = StyleSheet.create({
  meta: {
    ...TYPOGRAPHY.captionSm,
    marginBottom: BLOCK_SPACE
  },
  section: {
    ...TYPOGRAPHY.bodyLgStrong,
    marginTop: SECTION_SPACE - BLOCK_SPACE,
    marginBottom: BLOCK_SPACE
  },
  paragraph: {
    ...TYPOGRAPHY.bodyMd,
    marginBottom: BLOCK_SPACE
  },
  bullets: {
    marginBottom: BLOCK_SPACE
  },
  end: {
    marginBottom: 0
  }
});

export default PrivacyPolicyScreen;

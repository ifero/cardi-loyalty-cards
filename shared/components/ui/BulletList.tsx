import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { SPACING } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

/**
 * The glyph every item leads with, and the space after it: both set in the item's type, so the
 * space grows with the text, as frame A's "•&nbsp; " does, and at the accessibility sizes the
 * bullet never closes up against its text. The space is a non-breaking one, so it stays with the
 * glyph and in its measure. Drawn, never read.
 */
const BULLET = '•\u00A0';

/**
 * The document frames' hanging indent: the glyph starts 18 in from the list's edge, and the text
 * 32 in. The glyph's column holds the 14 between them, and widens once the glyph and its space,
 * scaled by the larger text sizes, outgrow it.
 */
const GLYPH_INSET = 18;
const TEXT_INSET = 32;

type BulletListProps = {
  /** The items, in order: each its text alone, without a bullet of its own. */
  items: readonly string[];
  /**
   * The text and the glyph's colour, as the caller asks: `default` (`textPrimary`) for prose,
   * `muted` (`textSecondary`) for the quieter lists, such as an FAQ answer's steps.
   */
  tone: 'default' | 'muted';
  /** The list's testID, and the prefix of its items': `<testID>-item-<index>`. */
  testID?: string;
};

/**
 * A bulleted list (`cardi-design-system.md` § _Documents_, Story 22.8): the frames' hanging indent,
 * so a wrapped line aligns under the text, not under the bullet. `body-md`, items 8 apart. Each item
 * is one element to assistive technology, read as its text: the glyph is not read.
 */
export const BulletList = ({ items, tone, testID }: BulletListProps) => {
  const { theme } = useTheme();
  const color = tone === 'default' ? theme.textPrimary : theme.textSecondary;

  return (
    <View testID={testID} style={styles.list}>
      {items.map((item, index) => (
        <View
          // The items are fixed text drawn in order, and two may read the same.
          key={index}
          testID={testID ? `${testID}-item-${index}` : undefined}
          accessible
          accessibilityLabel={item}
          style={styles.item}
        >
          <Text style={[styles.glyph, { color }]}>{BULLET}</Text>
          <Text style={[styles.text, { color }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: SPACING.sm
  },
  // The glyph and the text's first line share a top, and so a baseline: both are `body-md`.
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: GLYPH_INSET
  },
  // The glyph and its space, in a column at least as wide as the hanging indent.
  glyph: {
    ...TYPOGRAPHY.bodyMd,
    minWidth: TEXT_INSET - GLYPH_INSET
  },
  // The rest of the line: the text wraps inside its own column, under itself.
  text: {
    ...TYPOGRAPHY.bodyMd,
    flex: 1
  }
});

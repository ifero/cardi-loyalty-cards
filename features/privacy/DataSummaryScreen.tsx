/**
 * DataSummaryScreen
 * Story 6-11: Privacy & Consent
 * Story 22.8: Document frame C, the two-column table
 *
 * A read-only summary of the data the app collects, open to everyone, signed in or a guest: it
 * reads no session, so it draws at once, with nothing to wait for and nowhere to redirect. It draws
 * `DocumentScreen`, whose header carries "What We Collect", then the description and a ruled table,
 * which ends the screen.
 */

import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { DocumentScreen } from '@/shared/components/ui';
import { useTheme } from '@/shared/theme';
import { SPACING, TOUCH_TARGET } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

// ---------------------------------------------------------------------------
// Data table
// ---------------------------------------------------------------------------

type DataRow = {
  id: string;
  categoryKey: string;
  detailKey: string;
};

const DATA_ROWS: DataRow[] = [
  {
    id: 'account',
    categoryKey: 'privacy.dataSummary.rows.account.category',
    detailKey: 'privacy.dataSummary.rows.account.detail'
  },
  {
    id: 'cards',
    categoryKey: 'privacy.dataSummary.rows.cards.category',
    detailKey: 'privacy.dataSummary.rows.cards.detail'
  },
  {
    id: 'app',
    categoryKey: 'privacy.dataSummary.rows.app.category',
    detailKey: 'privacy.dataSummary.rows.app.detail'
  },
  {
    id: 'location',
    categoryKey: 'privacy.dataSummary.rows.location.category',
    detailKey: 'privacy.dataSummary.rows.location.detail'
  },
  {
    id: 'contacts',
    categoryKey: 'privacy.dataSummary.rows.contacts.category',
    detailKey: 'privacy.dataSummary.rows.contacts.detail'
  },
  {
    id: 'deviceId',
    categoryKey: 'privacy.dataSummary.rows.deviceId.category',
    detailKey: 'privacy.dataSummary.rows.deviceId.detail'
  }
];

/**
 * From this font scale up, each row sets its data under its category, as `ActionRow` sets its value
 * under its label. 1.5 is a cut-off between iOS's xxxLarge (1.353) and its first accessibility size
 * (1.786), the one `ActionRow` uses. Android's 150% setting sits on it, so there the rows stack.
 */
const STACKED_ROW_MIN_FONT_SCALE = 1.5;

/** The category column's share of the row, as frame C draws it; the data takes the rest. */
const CATEGORY_COLUMN_WIDTH = '40%';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DataSummaryScreen = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { fontScale } = useWindowDimensions();
  const isStacked = fontScale >= STACKED_ROW_MIN_FONT_SCALE;

  const headRowStyle = [
    styles.row,
    isStacked ? styles.stackedRow : null,
    { borderBottomColor: theme.border }
  ];
  const dataRowStyle = [...headRowStyle, styles.dataRow];
  const categoryColumn = isStacked ? null : styles.categoryColumn;
  const dataColumn = isStacked ? null : styles.dataColumn;

  const categoryHeader = t('privacy.dataSummary.table.categoryHeader');
  const dataCollectedHeader = t('privacy.dataSummary.table.dataCollectedHeader');

  return (
    <DocumentScreen
      title={t('privacy.dataSummary.title')}
      onBack={() => router.back()}
      testID="data-summary-document"
      titleTestID="data-summary-title"
      backTestID="data-summary-back-button"
      bodyTestID="data-summary-screen"
    >
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        {t('privacy.dataSummary.description')}
      </Text>

      {/* Ruled, not boxed: a rule under the head and under every row, the last included. */}
      <View testID="data-summary-table" style={styles.table}>
        <View
          testID="data-summary-table-head"
          accessible
          accessibilityLabel={`${categoryHeader}, ${dataCollectedHeader}`}
          style={headRowStyle}
        >
          <Text style={[styles.head, categoryColumn, { color: theme.textSecondary }]}>
            {categoryHeader}
          </Text>
          <Text style={[styles.head, dataColumn, { color: theme.textSecondary }]}>
            {dataCollectedHeader}
          </Text>
        </View>

        {DATA_ROWS.map((row) => {
          const category = t(row.categoryKey);
          const detail = t(row.detailKey);

          return (
            <View
              key={row.id}
              testID={`data-row-${row.id.toLowerCase().replace(/\s/g, '-')}`}
              accessible
              accessibilityLabel={`${category}, ${detail}`}
              style={dataRowStyle}
            >
              <Text style={[styles.category, categoryColumn, { color: theme.textPrimary }]}>
                {category}
              </Text>
              <Text style={[styles.data, dataColumn, { color: theme.textSecondary }]}>
                {detail}
              </Text>
            </View>
          );
        })}
      </View>
    </DocumentScreen>
  );
};

const styles = StyleSheet.create({
  description: {
    ...TYPOGRAPHY.bodyMd
  },
  table: {
    marginTop: SPACING.xl
  },
  // Every row, the head's included: 16 between the columns, padded 12 above and below and nothing
  // at the sides, with a 1pt rule beneath. The columns are top-aligned. The head takes no minimum
  // height, so it stands 40, its 16pt line between 12 and 12, as frame C draws it.
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: SPACING.md,
    paddingVertical: SPACING.smMd,
    borderBottomWidth: 1
  },
  // A data row stands at least 48 tall.
  dataRow: {
    minHeight: TOUCH_TARGET.min
  },
  // At the accessibility sizes: the data under its category, both full width, so no word breaks
  // in a 40 % column.
  stackedRow: {
    flexDirection: 'column',
    alignItems: 'stretch'
  },
  categoryColumn: {
    width: CATEGORY_COLUMN_WIDTH
  },
  dataColumn: {
    flex: 1
  },
  // A label for the rows beneath it: uppercase by style, so assistive technology reads the words.
  head: {
    ...TYPOGRAPHY.overline,
    textTransform: 'uppercase'
  },
  category: {
    ...TYPOGRAPHY.bodyMdStrong
  },
  data: {
    ...TYPOGRAPHY.bodyMd
  }
});

export default DataSummaryScreen;

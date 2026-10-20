/**
 * DataSummaryScreen — Unit Tests
 * Story 6-11: Privacy & Consent
 * Story 22.8: Document frame C, the two-column table
 */

import { act, render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';

import { DocumentScreen } from '@/shared/components/ui';
import { changeAppLanguage } from '@/shared/i18n';
import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import DataSummaryScreen from './DataSummaryScreen';

let mockIsDark = false;
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();

const INSETS = { top: 59, right: 0, bottom: 34, left: 0 };

// The real token values, so every role is checked against what the app paints.
jest.mock('@/shared/theme', () => {
  const { DARK_THEME: dark, LIGHT_THEME: light } = jest.requireActual('@/shared/theme/colors');
  return {
    useTheme: () => ({ theme: mockIsDark ? dark : light, isDark: mockIsDark })
  };
});

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return {
    useSafeAreaInsets: () => INSETS,
    SafeAreaView: (props: Record<string, unknown>) => <View {...props} />
  };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace, push: mockPush })
}));

// What We Collect is open to everyone (decision, 2026-10-18): it reads no session. Were it to read
// one, this would throw and fail every test below.
jest.mock('@/shared/supabase/useAuthState', () => ({
  useAuthState: () => {
    throw new Error('What We Collect reads no session');
  }
}));

/** The six rows, in order, as frame C and the strings name them. */
const ROWS = [
  ['account', 'Account', 'Email address'],
  ['cards', 'Cards', 'Card names, barcodes, timestamps'],
  ['app', 'App', 'App version, locale (for catalogue)'],
  ['location', 'Location', 'Not collected'],
  ['contacts', 'Contacts', 'Not collected'],
  ['deviceid', 'Device ID', 'Not collected']
] as const;

const ROW_IDS = ROWS.map(([id]) => `data-row-${id}`);

/** A host node of the rendered tree, as `toJSON` gives it. */
type JsonNode = {
  type: string;
  props: Record<string, unknown>;
  children: (JsonNode | string)[] | null;
};

const findJson = (node: JsonNode | string | null, testID: string): JsonNode | null => {
  if (!node || typeof node === 'string') return null;
  if (node.props.testID === testID) return node;
  for (const child of node.children ?? []) {
    const found = findJson(child, testID);
    if (found) return found;
  }
  return null;
};

const json = (testID: string) => findJson(screen.toJSON() as unknown as JsonNode, testID);

/** A host node's host children, in order. */
const partsOf = (testID: string) =>
  (json(testID)?.children ?? []).filter((part): part is JsonNode => typeof part !== 'string');

/** Every host `Text` under a node, in the order they draw. */
const texts = (
  node: JsonNode | string | null = screen.toJSON() as unknown as JsonNode
): JsonNode[] => {
  if (!node || typeof node === 'string') return [];
  const own = node.type === 'Text' ? [node] : [];
  return [...own, ...(node.children ?? []).flatMap((child) => texts(child))];
};

const flat = (node: { props: Record<string, unknown> }) =>
  StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;

/** Every host node under a node, itself included. */
const hostNodes = (node: JsonNode): JsonNode[] => [
  node,
  ...(node.children ?? []).flatMap((child) => (typeof child === 'string' ? [] : hostNodes(child)))
];

/** The style keys of a node that draw a fill, a border or a rounded box. */
const boxKeys = (node: JsonNode) => {
  const style = (flat(node) ?? {}) as Record<string, unknown>;
  return Object.keys(style).filter(
    (key) =>
      /^(backgroundColor|border\w*(Width|Radius))$/.test(key) &&
      ![undefined, 0, 'transparent'].includes(style[key] as never)
  );
};

/**
 * The text size, as `useWindowDimensions` reports it: it reads `Dimensions.get('window')`. React
 * Native's Jest mock reports 2, an accessibility size, so every test sets one: the device's default
 * of 1 unless it says otherwise.
 */
let dimensions: jest.SpyInstance | undefined;
const setFontScale = (fontScale: number) => {
  dimensions?.mockRestore();
  dimensions = jest
    .spyOn(Dimensions, 'get')
    .mockReturnValue({ width: 393, height: 852, scale: 3, fontScale });
};

describe('DataSummaryScreen', () => {
  beforeEach(async () => {
    mockIsDark = false;
    setFontScale(1);
    await act(async () => {
      await changeAppLanguage('en');
    });
  });

  afterEach(() => {
    dimensions?.mockRestore();
    dimensions = undefined;
  });

  describe('who sees it', () => {
    // Signed in or a guest: frame C at once, with no spinner and no redirect.
    it('draws the table at once, with no spinner and no redirect', () => {
      render(<DataSummaryScreen />);
      expect(screen.getByTestId('data-summary-table')).toBeTruthy();
      expect(screen.queryByTestId('data-summary-loading')).toBeNull();
      expect(mockReplace).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('frame C', () => {
    it('draws the document ground, titled "What We Collect" in the header', () => {
      render(<DataSummaryScreen />);
      expect(screen.UNSAFE_getByType(DocumentScreen).props).toMatchObject({
        title: 'What We Collect',
        bodyTestID: 'data-summary-screen'
      });
      expect(screen.getByTestId('data-summary-screen').type).toBe('RCTScrollView');
      expect(screen.getByTestId('data-summary-title')).toBe(
        screen.getByRole('header', { name: 'What We Collect' })
      );
      // Frame C: no title in the body.
      expect(screen.getAllByText('What We Collect')).toHaveLength(1);
    });

    it.each<[string, typeof LIGHT_THEME | typeof DARK_THEME]>([
      ['light', LIGHT_THEME],
      ['dark', DARK_THEME]
    ])('opens the body with the description, in body-md textSecondary, in %s', (s, roles) => {
      mockIsDark = s === 'dark';
      render(<DataSummaryScreen />);
      const description = screen.getByText(
        'This is a summary of the data Cardì collects when you have an account. Guest users have no cloud data — everything stays on device.'
      );
      // Pinned whole, so no margin, padding or fill can join it.
      expect(flat(description)).toEqual({
        fontFamily: 'Inter',
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '400',
        letterSpacing: 0,
        color: roles.textSecondary
      });
      const tree = JSON.stringify(screen.toJSON());
      expect(tree.indexOf('This is a summary')).toBeLessThan(tree.indexOf('"data-summary-table"'));
    });

    // Under large text the description wraps and grows: nothing clips it.
    it('lets the description wrap, with no line limit', () => {
      render(<DataSummaryScreen />);
      expect(screen.getByText(/^This is a summary/).props.numberOfLines).toBeUndefined();
    });

    it('goes back from its header’s back', async () => {
      render(<DataSummaryScreen />);
      const back = screen.getByTestId('data-summary-back-button');
      expect(back.props.accessibilityLabel).toBe('Go back');
      await userEvent.press(back);
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('the table', () => {
    // Strictly: a child with no testID would map to `undefined`, which `toEqual` lets pass.
    it('holds the head row, then the six rows in order, and nothing after them', () => {
      render(<DataSummaryScreen />);
      expect(partsOf('data-summary-table').map((row) => row.props.testID)).toStrictEqual([
        'data-summary-table-head',
        ...ROW_IDS
      ]);
      ROWS.forEach(([id, category, detail]) => {
        expect(partsOf(`data-row-${id}`).map((cell) => (cell.children ?? []).join(''))).toEqual([
          category,
          detail
        ]);
      });
    });

    // No card, box or fill behind the prose: the rows' bottom rules are the only lines drawn. Checked
    // in two columns and stacked, since the stacked rows take a style of their own.
    it.each([1, 1.5, 3.571])('draws no box or fill but the rows’ bottom rules, at %s', (scale) => {
      setFontScale(scale);
      render(<DataSummaryScreen />);
      expect(flat(json('data-row-account')!).flexDirection).toBe(scale >= 1.5 ? 'column' : 'row');
      const RULED = /^data-(summary-table-head|row-.+)$/;
      const body = findJson(screen.toJSON() as unknown as JsonNode, 'data-summary-screen')!;
      const boxed = hostNodes(body).flatMap((part) => {
        const keys = boxKeys(part).filter(
          (key) => !(key === 'borderBottomWidth' && RULED.test(String(part.props.testID)))
        );
        return keys.length > 0 ? [`${part.type} ${String(part.props.testID)}: ${keys}`] : [];
      });
      expect(boxed).toHaveLength(0);
    });

    // No icon but the header's back: the table draws none of its own. Each Lucide icon is one
    // react-native-svg root.
    it.each([1, 1.5, 3.571])('draws one icon, the header’s back, at %s', (scale) => {
      setFontScale(scale);
      render(<DataSummaryScreen />);
      const tree = screen.toJSON() as unknown as JsonNode;
      const isIcon = (part: JsonNode) => /^RNSVGSvgView/.test(part.type);
      expect(hostNodes(tree).filter(isIcon)).toHaveLength(1);
      expect(hostNodes(findJson(tree, 'data-summary-back-button')!).filter(isIcon)).toHaveLength(1);
    });

    // Ruled, not boxed: no outer border, card, fill or radius.
    it('stands 32 below the description, with no box around it', () => {
      render(<DataSummaryScreen />);
      expect(flat(json('data-summary-table')!)).toEqual({ marginTop: 32 });
    });

    // Every row, the head's included: 16 between the columns, padded 12 above and below and nothing
    // at the sides, a 1pt border rule beneath — the last row's included. A data row stands at least
    // 48 tall.
    it.each<[string, typeof LIGHT_THEME | typeof DARK_THEME]>([
      ['light', LIGHT_THEME],
      ['dark', DARK_THEME]
    ])('rules every row beneath, the last included, in %s’s border', (s, roles) => {
      mockIsDark = s === 'dark';
      render(<DataSummaryScreen />);
      const ruled = {
        flexDirection: 'row',
        alignItems: 'flex-start',
        columnGap: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: roles.border
      };
      expect(flat(json('data-summary-table-head')!)).toEqual(ruled);
      ROW_IDS.forEach((testID) => {
        expect(flat(json(testID)!)).toEqual({ ...ruled, minHeight: 48 });
      });
    });

    // Frame C draws the head 40 tall: its 16pt line between 12 and 12, with no minimum height.
    it('stands the head row 40 tall, with no minimum height', () => {
      render(<DataSummaryScreen />);
      const head = flat(json('data-summary-table-head')!);
      expect(head.minHeight).toBeUndefined();
      expect(head.height).toBeUndefined();
      const [category, data] = partsOf('data-summary-table-head');
      [category, data].forEach((label) => expect(flat(label!).lineHeight).toBe(16));
      expect((head.paddingVertical as number) * 2 + 16).toBe(40);
    });

    it.each<[string, typeof LIGHT_THEME | typeof DARK_THEME]>([
      ['light', LIGHT_THEME],
      ['dark', DARK_THEME]
    ])('sets the head in overline textSecondary, uppercased by style, in %s', (s, roles) => {
      mockIsDark = s === 'dark';
      render(<DataSummaryScreen />);
      const [category, data] = partsOf('data-summary-table-head');
      expect(category?.children).toEqual(['Category']);
      expect(data?.children).toEqual(['Data Collected']);
      // Each label pinned whole: the overline, uppercased, in its column.
      const overline = {
        fontFamily: 'Inter',
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '600',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        color: roles.textSecondary
      };
      expect(flat(category!)).toEqual({ ...overline, width: '40%' });
      expect(flat(data!)).toEqual({ ...overline, flex: 1 });
    });

    // The category in a 40 % column, in ink; the data the rest, muted. A row the app does not
    // collect draws like every other row.
    it.each<[string, typeof LIGHT_THEME | typeof DARK_THEME]>([
      ['light', LIGHT_THEME],
      ['dark', DARK_THEME]
    ])('sets every row’s category and data alike, in %s', (s, roles) => {
      mockIsDark = s === 'dark';
      render(<DataSummaryScreen />);
      ROW_IDS.forEach((testID) => {
        const [category, data] = partsOf(testID);
        expect(flat(category!)).toEqual({
          fontFamily: 'Inter',
          fontSize: 15,
          lineHeight: 22,
          fontWeight: '600',
          letterSpacing: 0,
          width: '40%',
          color: roles.textPrimary
        });
        expect(flat(data!)).toEqual({
          fontFamily: 'Inter',
          fontSize: 15,
          lineHeight: 22,
          fontWeight: '400',
          letterSpacing: 0,
          flex: 1,
          color: roles.textSecondary
        });
        // Wrapping, never cut.
        expect(category?.props.numberOfLines).toBeUndefined();
        expect(data?.props.numberOfLines).toBeUndefined();
      });
    });

    // Each row is one element, read as its category, then its data; the head as its two labels.
    it('reads each row as its category, then its data', () => {
      render(<DataSummaryScreen />);
      ROWS.forEach(([id, category, detail]) => {
        const row = screen.getByTestId(`data-row-${id}`);
        expect(row.props.accessible).toBe(true);
        expect(row.props.accessibilityLabel).toBe(`${category}, ${detail}`);
      });
      const head = screen.getByTestId('data-summary-table-head');
      expect(head.props.accessible).toBe(true);
      expect(head.props.accessibilityLabel).toBe('Category, Data Collected');
    });

    // Decided 2026-10-18: the disabled "Download My Data (coming soon)" and its footnote are gone.
    it('ends the screen', () => {
      render(<DataSummaryScreen />);
      const content = json('data-summary-screen')?.children?.[0] as JsonNode;
      const blocks = (content.children ?? []).filter(
        (block): block is JsonNode => typeof block !== 'string'
      );
      expect(blocks.at(-1)?.props.testID).toBe('data-summary-table');
      expect(blocks).toHaveLength(2);
      expect(screen.queryByTestId('download-data-placeholder')).toBeNull();
      expect(screen.queryByRole('button', { name: /Download/ })).toBeNull();
      expect(screen.queryByText(/coming soon|future update/)).toBeNull();
    });
  });

  /**
   * From a font scale of 1.5, each row sets its data under its category, full width, so no word
   * breaks in a 40 % column. 1.5 is a cut-off between iOS's xxxLarge (1.353) and its first
   * accessibility size (1.786), the one `ActionRow` uses, and Android's 150% setting sits on it.
   * iOS's largest size is 3.571.
   */
  describe('at the accessibility text sizes', () => {
    // Pinned from below as well as above: at xxxLarge, and just short of the breakpoint.
    it.each([1.353, 1.49])('keeps the two columns at a font scale of %s', (scale) => {
      setFontScale(scale);
      render(<DataSummaryScreen />);
      ['data-summary-table-head', ...ROW_IDS].forEach((testID) => {
        expect(flat(json(testID)!).flexDirection).toBe('row');
        expect(flat(partsOf(testID)[0]!).width).toBe('40%');
      });
    });

    it.each([1.5, 1.786, 3.571])('sets each row’s data under its category at %s', (scale) => {
      setFontScale(scale);
      render(<DataSummaryScreen />);
      // Each row pinned whole, as the two-column rows are: the data rows keep their 48, the head
      // keeps no minimum.
      const stacked = {
        flexDirection: 'column',
        alignItems: 'stretch',
        columnGap: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: LIGHT_THEME.border
      };
      const text = { fontFamily: 'Inter', fontSize: 15, lineHeight: 22, letterSpacing: 0 };
      ['data-summary-table-head', ...ROW_IDS].forEach((testID) => {
        const isHead = testID === 'data-summary-table-head';
        expect(flat(json(testID)!)).toEqual(isHead ? stacked : { ...stacked, minHeight: 48 });
        // Each cell full width: no column of its own.
        const [category, data] = partsOf(testID);
        if (isHead) {
          [category, data].forEach((label) =>
            expect(flat(label!)).toEqual({
              fontFamily: 'Inter',
              fontSize: 12,
              lineHeight: 16,
              fontWeight: '600',
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              color: LIGHT_THEME.textSecondary
            })
          );
          return;
        }
        expect(flat(category!)).toEqual({
          ...text,
          fontWeight: '600',
          color: LIGHT_THEME.textPrimary
        });
        expect(flat(data!)).toEqual({
          ...text,
          fontWeight: '400',
          color: LIGHT_THEME.textSecondary
        });
      });
      // Still read as one row: its category, then its data.
      expect(screen.getByTestId('data-row-account').props.accessibilityLabel).toBe(
        'Account, Email address'
      );
    });
  });

  // Story 21.2's floor: every sentence at 15 or more; the head row is the one chrome-tier text.
  // The head sits on the 12pt chrome tier. Any other text with no size of its own counts against the
  // floor: React Native draws it at 14.
  it('sets every text at 15pt or more but the table’s head', () => {
    render(<DataSummaryScreen />);
    const tree = screen.toJSON() as unknown as JsonNode;
    const head = texts(findJson(tree, 'data-summary-table-head'));
    expect(head).toHaveLength(2);
    head.forEach((text) => expect(flat(text).fontSize).toBe(12));
    const rest = texts(tree).filter((text) => !head.includes(text));
    expect(rest.length).toBeGreaterThan(0);
    const belowFloor = rest.filter((text) => {
      const { fontSize } = flat(text);
      return typeof fontSize !== 'number' || fontSize < 15;
    });
    expect(belowFloor.map((text) => text.children)).toHaveLength(0);
  });

  describe('in Italian', () => {
    beforeEach(async () => {
      await act(async () => {
        await changeAppLanguage('it');
      });
    });

    it('titles the header and draws the table in Italian', () => {
      render(<DataSummaryScreen />);
      expect(screen.getByRole('header', { name: 'Cosa raccogliamo' })).toBe(
        screen.getByTestId('data-summary-title')
      );
      expect(screen.getByTestId('data-summary-table-head').props.accessibilityLabel).toBe(
        'Categoria, Dati raccolti'
      );
      expect(screen.getByTestId('data-row-deviceid').props.accessibilityLabel).toBe(
        'ID dispositivo, Non raccolti'
      );
    });
  });
});

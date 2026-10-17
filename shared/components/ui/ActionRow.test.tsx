/**
 * ActionRow — the shared row (Story 22.7's rulings; card detail's MANAGE block is its other caller).
 *
 * Rendered through the real `StoryDecorator`, because the row's colours are theme roles and only
 * the real `ThemeProvider` flips them.
 */
import { fireEvent, render, screen, userEvent, within } from '@testing-library/react-native';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import React from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, View } from 'react-native';

import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { ActionRow } from './ActionRow';

type Scheme = 'light' | 'dark';
type RowProps = React.ComponentProps<typeof ActionRow>;

const renderRow = (props: Partial<RowProps> = {}, scheme: Scheme = 'light') =>
  render(
    <StoryDecorator theme={scheme}>
      <ActionRow label="Theme" variant="plain" testID="row" {...props} />
    </StoryDecorator>
  );

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

const flatStyle = (node: { props: { style: unknown } }) =>
  StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;

/** A host node of the rendered tree, as `toJSON` gives it. */
type JsonNode = { props: Record<string, unknown>; children: (JsonNode | string)[] | null };

/** The host node with this testID in a rendered tree. */
const findJson = (node: JsonNode | JsonNode[] | string | null, testID: string): JsonNode | null => {
  if (!node || typeof node === 'string') return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findJson(child, testID);
      if (found) return found;
    }
    return null;
  }
  if (node.props.testID === testID) return node;
  return findJson(node.children as JsonNode[] | null, testID);
};

/** Lucide hides its icons from assistive technology, so a query has to look past that. */
const chevron = () => screen.queryByTestId('row-chevron', { includeHiddenElements: true });

/**
 * The text size, as `useWindowDimensions` reports it: it reads `Dimensions.get('window')`, so the
 * real hook runs. React Native's Jest mock reports 2, an accessibility size, so every test sets
 * one: the device's default of 1 unless it says otherwise.
 */
let dimensions: jest.SpyInstance | undefined;
const setFontScale = (fontScale: number) => {
  dimensions?.mockRestore();
  dimensions = jest
    .spyOn(Dimensions, 'get')
    .mockReturnValue({ width: 393, height: 852, scale: 3, fontScale });
};

beforeEach(() => setFontScale(1));

afterEach(() => {
  dimensions?.mockRestore();
  dimensions = undefined;
});

describe('ActionRow', () => {
  describe('shape', () => {
    // 12 + a 24pt line + 12 is the 48pt touch target, so a one-line row is exactly 48.
    it('pads a plain row 12/16, at least 48 tall', () => {
      renderRow({ onPress: jest.fn() });
      expect(flat('row')).toMatchObject({
        minHeight: 48,
        paddingVertical: 12,
        paddingHorizontal: 16
      });
    });

    // Frame A's row is one flex line: the icon, the label, the value and the chevron, 12 apart.
    it('sets 12 between its parts: the icon, the label, the value and the chevron', () => {
      renderRow({ onPress: jest.fn(), prefix: <></>, value: 'System' });
      expect(flat('row-content')).toMatchObject({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
      });
    });

    // The value's 46 % is of the whole row, as the frame's is: so the value sits in the same line
    // as the icon, not in a narrower one beside it. "System (English)" fits beside the globe at 393.
    it('lays the icon and the value in one line, so the value’s 46 % is of the whole row', () => {
      renderRow({
        onPress: jest.fn(),
        prefix: <View testID="row-icon" />,
        value: 'System (English)'
      });
      const content = findJson(screen.toJSON() as unknown as JsonNode, 'row-content');
      const children = (content?.children ?? []).filter(
        (child): child is JsonNode => typeof child === 'object'
      );
      expect(children.some((child) => child.props.testID === 'row-icon')).toBe(true);
      expect(children.some((child) => child.children?.includes('System (English)'))).toBe(true);
    });

    // A plain row draws its own rule unless told not to; settings' rows are told, since their
    // group's Surface draws the rules between rows.
    it('draws its own rule by default', () => {
      renderRow({ onPress: jest.fn() });
      expect(screen.getByTestId('row-rule')).toBeTruthy();
    });

    it('draws no rule of its own when told not to', () => {
      renderRow({ onPress: jest.fn(), showBottomBorder: false });
      expect(screen.queryByTestId('row-rule')).toBeNull();
    });

    // Frame A's order along the line: the icon, the label, the value, then the chevron — or the
    // spinner in its place while busy.
    it.each<[string, Partial<RowProps>, string]>([
      ['the chevron', {}, '"row-chevron"'],
      ['the spinner', { isLoading: true }, '"row-spinner-slot"']
    ])('lays out the icon, the label, the value, then %s', (_part, props, last) => {
      renderRow({
        onPress: jest.fn(),
        prefix: <View testID="row-icon" />,
        value: 'System',
        ...props
      });
      const tree = JSON.stringify(screen.toJSON());
      const order = ['"row-icon"', '["Theme"]', '["System"]', last].map((needle) =>
        tree.indexOf(needle)
      );
      expect(order.every((index) => index > -1)).toBe(true);
      expect([...order].sort((a, b) => a - b)).toEqual(order);
    });
  });

  describe('text', () => {
    // Under large text the label wraps and the row grows, rather than cutting the label short.
    it('lets the label wrap', () => {
      renderRow({ onPress: jest.fn() });
      const label = screen.getByText('Theme');
      expect(label.props.numberOfLines).toBeUndefined();
      expect(flatStyle(label)).toMatchObject({ fontFamily: 'Inter', fontSize: 17 });
    });

    // Frame A's value: one line, cut with an ellipsis, never wider than 46 % of the row.
    it('keeps the value to one line, at most 46 % of the row', () => {
      renderRow({ onPress: jest.fn(), value: 'System (English)' });
      const value = screen.getByText('System (English)');
      expect(value.props.numberOfLines).toBe(1);
      expect(flatStyle(value)).toMatchObject({ maxWidth: '46%', fontSize: 17 });
    });

    // The label grows into the room left (`flex: 1 1 auto`). On a crowded line the value gives way
    // first: Yoga shares the overflow by flex-shrink × width, and at equal weights a value holding its
    // 46 % squeezed "Sync" to "Syn|c" at the largest size. A CSS flex item never shrinks below its
    // longest word, so frame A's label keeps its words.
    it('lets the label grow from its own width, and the value give way first when crowded', () => {
      renderRow({ onPress: jest.fn(), value: 'System' });
      const text = flat('row-text');
      expect(text).toMatchObject({ flexGrow: 1, flexShrink: 1, flexBasis: 'auto' });
      expect(flatStyle(screen.getByText('System')).flexShrink).toBeGreaterThanOrEqual(
        1000 * (text.flexShrink as number)
      );
    });

    it.each<[Scheme, typeof LIGHT_THEME | typeof DARK_THEME]>([
      ['light', LIGHT_THEME],
      ['dark', DARK_THEME]
    ])('sets the label in textPrimary and the value in textSecondary in %s', (scheme, roles) => {
      renderRow({ onPress: jest.fn(), value: 'JSON' }, scheme);
      expect(flatStyle(screen.getByText('Theme')).color).toBe(roles.textPrimary);
      expect(flatStyle(screen.getByText('JSON')).color).toBe(roles.textSecondary);
    });

    it.each<[Scheme, string]>([
      ['light', LIGHT_THEME.error],
      ['dark', DARK_THEME.error]
    ])('sets a destructive label in the %s error colour', (scheme, hex) => {
      renderRow({ onPress: jest.fn(), destructive: true, showChevron: false }, scheme);
      expect(flatStyle(screen.getByText('Theme')).color).toBe(hex);
    });
  });

  /**
   * At the accessibility text sizes a value takes its own line under the label. React Native's iOS
   * font scales: xxxLarge 1.353, the first accessibility size 1.786, the largest 3.571. Beside its
   * label at the largest size the value dropped to one letter, and some ellipses drew clipped.
   */
  describe('at the accessibility text sizes', () => {
    /** The host children of the node with this testID, in order. */
    const partsOf = (testID: string) =>
      (findJson(screen.toJSON() as unknown as JsonNode, testID)?.children ?? []).filter(
        (child): child is JsonNode => typeof child === 'object'
      );

    // xxxLarge is the last size below the accessibility ones: the row is exactly as at the default.
    it('keeps the value beside the label, one line, below the first accessibility size', () => {
      setFontScale(1.353);
      renderRow({ onPress: jest.fn(), value: 'System (English)' });
      const value = screen.getByText('System (English)');
      expect(within(screen.getByTestId('row-text')).queryByText('System (English)')).toBeNull();
      expect(value.props.numberOfLines).toBe(1);
      expect(flatStyle(value).maxWidth).toBe('46%');
    });

    it.each([1.5, 1.786, 3.571])(
      'moves the value under the label, in its column, at %s',
      (scale) => {
        setFontScale(scale);
        renderRow({ onPress: jest.fn(), value: 'System (English)' });
        const value = within(screen.getByTestId('row-text')).getByText('System (English)');
        expect(screen.getAllByText('System (English)')).toHaveLength(1);
        // The label, then the value, in the label's column; wrapping rather than cut.
        expect(partsOf('row-text').map((part) => part.children?.join(''))).toEqual([
          'Theme',
          'System (English)'
        ]);
        expect(value.props.numberOfLines).toBeUndefined();
        expect(flatStyle(value)).toMatchObject({ fontSize: 17, color: LIGHT_THEME.textSecondary });
        expect(flatStyle(value).maxWidth).toBeUndefined();
        // Still read as one row: its label, then its value.
        expect(screen.getByTestId('row').props.accessibilityLabel).toBe('Theme, System (English)');
      }
    );

    it.each<[string, Partial<RowProps>, string]>([
      ['the chevron', {}, 'row-chevron'],
      ['the spinner', { isLoading: true }, 'row-spinner-slot']
    ])('keeps %s at the row’s end, centred on the row', (_part, props, testID) => {
      setFontScale(3.571);
      renderRow({ onPress: jest.fn(), value: 'System (English)', ...props });
      expect(partsOf('row-content').at(-1)?.props.testID).toBe(testID);
      expect(flat('row-content').alignItems).toBe('center');
    });

    // Card detail's MANAGE rows have no value, so the accessibility sizes leave them as they were.
    it('draws a row with no value the same at every size', () => {
      const { unmount } = renderRow({ onPress: jest.fn() });
      const atDefault = JSON.stringify(screen.toJSON());
      unmount();

      setFontScale(3.571);
      renderRow({ onPress: jest.fn() });
      expect(JSON.stringify(screen.toJSON())).toBe(atDefault);
    });
  });

  describe('chevron', () => {
    it.each<[Scheme, string]>([
      ['light', LIGHT_THEME.textSecondary],
      ['dark', DARK_THEME.textSecondary]
    ])('is Lucide chevron-right at 24 / 1.5 in textSecondary in %s', (scheme, hex) => {
      renderRow({ onPress: jest.fn() }, scheme);
      expect(screen.UNSAFE_getByType(ChevronRight)).toBeTruthy();
      expect(chevron()?.props).toMatchObject({
        width: 24,
        height: 24,
        stroke: hex,
        strokeWidth: 1.5
      });
    });

    it('is left off when the row asks for none', () => {
      renderRow({ onPress: jest.fn(), showChevron: false });
      expect(chevron()).toBeNull();
    });
  });

  describe('name', () => {
    it('is named by its label and its value', () => {
      renderRow({ onPress: jest.fn(), value: 'System' });
      expect(screen.getByTestId('row').props.accessibilityLabel).toBe('Theme, System');
    });

    it('is named by its label alone when it has no value', () => {
      renderRow({ onPress: jest.fn() });
      expect(screen.getByTestId('row').props.accessibilityLabel).toBe('Theme');
    });

    // A caller's name replaces the label; the value is still read after it.
    it('reads the value after a name the caller gives', () => {
      renderRow({ onPress: jest.fn(), value: 'just now', accessibilityLabel: 'Sync now' });
      expect(screen.getByTestId('row').props.accessibilityLabel).toBe('Sync now, just now');
    });
  });

  describe('a control', () => {
    // Pressed through the row's own responder, as a finger does: `fireEvent.press` would climb to
    // the nearest `onPress` prop and pass even if the Pressable lost its handler.
    it('is a button that calls onPress', async () => {
      const onPress = jest.fn();
      renderRow({ onPress });
      expect(screen.getByRole('button', { name: 'Theme' })).toBeTruthy();

      await userEvent.press(screen.getByTestId('row'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it.each<[Scheme, typeof LIGHT_THEME | typeof DARK_THEME]>([
      ['light', LIGHT_THEME],
      ['dark', DARK_THEME]
    ])('takes surfaceElevated while held in %s, and nothing at rest', (scheme, roles) => {
      renderRow({ onPress: jest.fn() }, scheme);
      expect(flat('row').backgroundColor).toBe('transparent');
      fireEvent(screen.getByTestId('row'), 'pressIn');
      expect(flat('row').backgroundColor).toBe(roles.surfaceElevated);
      fireEvent(screen.getByTestId('row'), 'pressOut');
      expect(flat('row').backgroundColor).toBe('transparent');
    });

    // Unchanged, because card detail's Edit uses it while a delete runs.
    it('dims to 0.6 and refuses presses while disabled', async () => {
      const onPress = jest.fn();
      renderRow({ onPress, disabled: true });
      expect(flat('row').opacity).toBe(0.6);
      expect(screen.getByTestId('row').props.accessibilityState).toMatchObject({ disabled: true });

      await userEvent.press(screen.getByTestId('row'));
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('busy', () => {
    it('shows the spinner in the chevron’s place', () => {
      renderRow({ onPress: jest.fn(), isLoading: true });
      expect(screen.getByTestId('row-spinner')).toBeTruthy();
      expect(screen.UNSAFE_getAllByType(ActivityIndicator)).toHaveLength(1);
      expect(chevron()).toBeNull();
    });

    // The small spinner is 20 across and the chevron 24: held in the chevron's 24-wide slot, the
    // spinner leaves the value where it was, so Sync's time does not shift at every sync.
    it('holds the spinner in the chevron’s 24-wide slot, so nothing beside it moves', () => {
      renderRow({ onPress: jest.fn(), value: 'just now', isLoading: true });
      expect(flat('row-spinner-slot')).toMatchObject({ width: 24, alignItems: 'center' });
      expect(screen.getByTestId('row-spinner-slot').children).toHaveLength(1);
    });

    // Busy is not disabled: the row keeps its look, says it is working, and ignores presses.
    it('keeps its look, is announced busy and ignores presses', async () => {
      const onPress = jest.fn();
      renderRow({ onPress, isLoading: true });
      const row = screen.getByTestId('row');

      expect(flat('row').opacity).toBeUndefined();
      expect(row.props.accessibilityState).toEqual({ disabled: false, busy: true });

      await userEvent.press(row);
      expect(onPress).not.toHaveBeenCalled();
      fireEvent(row, 'pressIn');
      expect(flat('row').backgroundColor).toBe('transparent');
    });

    it('is announced idle, with no spinner, when it is not busy', () => {
      renderRow({ onPress: jest.fn() });
      expect(screen.getByTestId('row').props.accessibilityState).toEqual({
        disabled: false,
        busy: false
      });
      expect(screen.queryByTestId('row-spinner')).toBeNull();
    });
  });

  // Settings' App Version and Catalogue: values to read, not controls.
  describe('with no onPress', () => {
    it('is not a control: no button role and nothing to press', () => {
      renderRow({ value: '1.4.0' });
      const row = screen.getByTestId('row');
      expect(screen.queryByRole('button')).toBeNull();
      expect(row.props.accessibilityRole).toBeUndefined();
      expect(row.props.onPress).toBeUndefined();
      expect(row.props.onPressIn).toBeUndefined();
    });

    it('is read as one element, its label and its value', () => {
      renderRow({ value: '1.4.0' });
      const row = screen.getByTestId('row');
      expect(row.props.accessible).toBe(true);
      expect(row.props.accessibilityLabel).toBe('Theme, 1.4.0');
    });

    // A row that does nothing must not look tappable, and it is not a dimmed control either.
    it('draws at full strength, with no chevron', () => {
      renderRow({ value: '1.4.0' });
      expect(flat('row').opacity).toBeUndefined();
      expect(chevron()).toBeNull();
      expect(flatStyle(screen.getByText('Theme')).color).toBe(LIGHT_THEME.textPrimary);
    });
  });

  // The outlined row is unused in the app since Story 22.5, and keeps its shape.
  it('keeps the outlined row’s border and padding', () => {
    renderRow({ onPress: jest.fn(), variant: 'outlined', subtitle: 'Add a custom loyalty card' });
    expect(flat('row')).toMatchObject({
      borderWidth: 1,
      borderRadius: 14,
      borderColor: LIGHT_THEME.border,
      backgroundColor: LIGHT_THEME.surface,
      paddingHorizontal: 12,
      paddingVertical: 8
    });
    expect(screen.getByText('Add a custom loyalty card')).toBeTruthy();
  });
});

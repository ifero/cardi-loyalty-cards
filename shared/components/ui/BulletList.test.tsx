/**
 * BulletList — the document frames' bulleted list (Story 22.8).
 *
 * Rendered through the real `StoryDecorator`, because the list's colours are theme roles and only
 * the real `ThemeProvider` flips them.
 */
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { BulletList } from './BulletList';

type Scheme = 'light' | 'dark';
type ListProps = React.ComponentProps<typeof BulletList>;

const ITEMS = [
  'Email address — used for authentication and account recovery.',
  'Consent records — whether and when you accepted this Privacy Policy.'
];

const renderList = (props: Partial<ListProps> = {}, scheme: Scheme = 'light') =>
  render(
    <StoryDecorator theme={scheme}>
      <BulletList items={ITEMS} tone="default" testID="list" {...props} />
    </StoryDecorator>
  );

const flat = (node: { props: Record<string, unknown> }) =>
  StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;

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

/** The host parts of the node with this testID, in order: for an item, the glyph, then the text. */
const partsOf = (testID: string) =>
  (findJson(screen.toJSON() as unknown as JsonNode, testID)?.children ?? []).filter(
    (part): part is JsonNode => typeof part !== 'string'
  );

/** The glyph and the non-breaking space after it. */
const GLYPH = '•\u00A0';

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

/** `body-md`, as the type scale sets it. */
const BODY_MD = {
  fontFamily: 'Inter',
  fontSize: 15,
  lineHeight: 22,
  fontWeight: '400',
  letterSpacing: 0
};

describe('BulletList', () => {
  it('draws each item, in order, as a bullet then its text', () => {
    renderList();
    ITEMS.forEach((item, index) => {
      const [glyph, text] = partsOf(`list-item-${index}`);
      expect(glyph?.type).toBe('Text');
      expect(glyph?.children).toEqual([GLYPH]);
      expect(text?.type).toBe('Text');
      expect(text?.children).toEqual([item]);
    });
    expect(screen.queryByTestId('list-item-2')).toBeNull();
  });

  // As frame A's "•&nbsp; ": the space after the glyph is type, set with the glyph in the glyph's own
  // `body-md`, so it grows with the text, and the column widens to hold both rather than let the
  // bullet close up against its text at the accessibility sizes. Non-breaking, so it stays with the
  // glyph and in its measure.
  it('sets the space after the glyph in the glyph’s own type, so it grows with the text', () => {
    renderList();
    const [glyph, text] = partsOf('list-item-0');
    expect(glyph?.children).toEqual(['•\u00A0']);
    expect(flat(glyph!).fontSize).toBe(flat(text!).fontSize);
    // A floor, never a cap: the column grows with what it holds.
    expect(flat(glyph!).minWidth).toBe(14);
    expect(flat(glyph!).width).toBeUndefined();
    expect(flat(glyph!).maxWidth).toBeUndefined();
    // The text carries no space of its own.
    expect((text?.children?.[0] as string).startsWith(' ')).toBe(false);
  });

  // The frames' hanging indent: the glyph starts 18 in and the text 32 in, in a column of its own,
  // so a wrapped line sits under the text and not under the bullet.
  it('hangs the text 32 in, the glyph 18 in, so a wrapped line aligns under the text', () => {
    renderList();
    const item = screen.getByTestId('list-item-0');
    const [glyph, text] = partsOf('list-item-0');
    // Pinned whole, so no margin, padding or fill can join it.
    expect(flat(item)).toEqual({
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingLeft: 18
    });
    expect(flat(glyph!).minWidth).toBe(32 - 18);
    expect(flat(glyph!).width).toBeUndefined();
    expect(flat(text!)).toEqual({ ...BODY_MD, flex: 1, color: LIGHT_THEME.textPrimary });
    // The text wraps rather than clipping.
    expect(text?.props.numberOfLines).toBeUndefined();
  });

  it('sets the glyph and the text in body-md, items 8 apart', () => {
    renderList();
    const [glyph, text] = partsOf('list-item-0');
    // Each pinned whole: the glyph's column at least 14, the text the rest.
    expect(flat(glyph!)).toEqual({ ...BODY_MD, minWidth: 14, color: LIGHT_THEME.textPrimary });
    expect(flat(text!)).toEqual({ ...BODY_MD, flex: 1, color: LIGHT_THEME.textPrimary });
    expect(flat(screen.getByTestId('list'))).toEqual({ gap: 8 });
  });

  it.each<[Scheme, ListProps['tone'], string]>([
    ['light', 'default', LIGHT_THEME.textPrimary],
    ['dark', 'default', DARK_THEME.textPrimary],
    ['light', 'muted', LIGHT_THEME.textSecondary],
    ['dark', 'muted', DARK_THEME.textSecondary]
  ])('in %s, draws a %s list in its colour', (scheme, tone, hex) => {
    renderList({ tone }, scheme);
    ITEMS.forEach((_item, index) => {
      const [glyph, text] = partsOf(`list-item-${index}`);
      expect(flat(glyph!)).toEqual({ ...BODY_MD, minWidth: 14, color: hex });
      expect(flat(text!)).toEqual({ ...BODY_MD, flex: 1, color: hex });
    });
  });

  // Each item is one element, named by its text alone: the glyph is drawn, not read.
  it('reads each item as its text, and never the glyph', () => {
    renderList();
    ITEMS.forEach((item, index) => {
      const element = screen.getByTestId(`list-item-${index}`);
      expect(element.props.accessible).toBe(true);
      expect(element.props.accessibilityLabel).toBe(item);
      expect(screen.getByLabelText(item)).toBe(element);
    });
  });

  // No card, box or fill behind the list: neither it, its items, nor their parts draw one.
  it('draws no box or fill behind its items', () => {
    renderList();
    const drawn = hostNodes(findJson(screen.toJSON() as unknown as JsonNode, 'list')!);
    expect(drawn.length).toBeGreaterThan(ITEMS.length * 3);
    expect(drawn.filter((part) => boxKeys(part).length > 0).map((part) => part.type)).toHaveLength(
      0
    );
  });

  it('draws nothing for an empty list', () => {
    renderList({ items: [] });
    expect(partsOf('list')).toHaveLength(0);
  });
});

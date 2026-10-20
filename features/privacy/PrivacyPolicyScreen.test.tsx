/**
 * PrivacyPolicyScreen — Unit Tests
 * Story 6-4: Privacy Policy & Consent Flow
 * Story 22.8: Document frame A, the prose document
 */

import { act, render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import { BulletList, DocumentScreen } from '@/shared/components/ui';
import { changeAppLanguage } from '@/shared/i18n';
import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

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

import PrivacyPolicyScreen, { parsePolicy } from './PrivacyPolicyScreen';

let mockIsDark = false;
const mockBack = jest.fn();

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
  useRouter: () => ({ back: mockBack })
}));

/** A host node of the rendered tree, as `toJSON` gives it. */
type JsonNode = {
  type: string;
  props: Record<string, unknown>;
  children: (JsonNode | string)[] | null;
};

const tree = () => screen.toJSON() as unknown as JsonNode;

const findJson = (node: JsonNode | string | null | undefined, testID: string): JsonNode | null => {
  if (!node || typeof node === 'string') return null;
  if (node.props.testID === testID) return node;
  for (const child of node.children ?? []) {
    const found = findJson(child, testID);
    if (found) return found;
  }
  return null;
};

/** Every host `Text` under a node, in the order they draw. */
const textsOf = (node: JsonNode | string | null | undefined): JsonNode[] => {
  if (!node || typeof node === 'string') return [];
  const own = node.type === 'Text' ? [node] : [];
  return [...own, ...(node.children ?? []).flatMap((child) => textsOf(child))];
};

const contentOf = (node: JsonNode): string =>
  (node.children ?? [])
    .map((child) => (typeof child === 'string' ? child : contentOf(child)))
    .join('');

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

/** The blocks the scroll view's content draws, in order: the meta line, then the policy. */
const blocks = () => {
  const scroll = findJson(tree(), 'privacy-policy-screen');
  const content = scroll?.children?.[0];
  return typeof content === 'object' && content ? (content.children ?? []) : [];
};

/** The policy's source lines that frame A draws: past its title and date, and not blank. */
const sourceLines = (content: string) =>
  content
    .split('\n')
    .slice(2)
    .map((line) => line.trim())
    .filter((line) => line !== '');

/** `BulletList`'s glyph and the non-breaking space after it, drawn in a column of their own. */
const GLYPH = '•\u00A0';

/**
 * What the body draws after the meta line, as lines: each section head and paragraph, and each
 * bullet as its glyph and its text — the glyph is the list's, drawn in a column of its own.
 */
const drawnLines = () => {
  const texts = textsOf(findJson(tree(), 'privacy-policy-screen')).map(contentOf).slice(1);
  const lines: string[] = [];
  for (let index = 0; index < texts.length; index += 1) {
    if (texts[index] === GLYPH) {
      lines.push(`• ${texts[index + 1]}`);
      index += 1;
    } else {
      lines.push(texts[index]!);
    }
  }
  return lines;
};

const SECTION_RE = /^\d+\.\s+.+$/;

describe('PrivacyPolicyScreen', () => {
  beforeEach(async () => {
    mockIsDark = false;
    await act(async () => {
      await changeAppLanguage('en');
    });
  });

  describe('the ground (frame A)', () => {
    it('draws the document ground, titled by the policy, scrolling as privacy-policy-screen', () => {
      render(<PrivacyPolicyScreen />);
      expect(screen.UNSAFE_getByType(DocumentScreen).props).toMatchObject({
        title: 'Privacy Policy',
        bodyTestID: 'privacy-policy-screen'
      });
      expect(screen.getByTestId('privacy-policy-screen').type).toBe('RCTScrollView');
      expect(screen.getByRole('header', { name: 'Privacy Policy' })).toBeTruthy();
    });

    // The header names the policy; the body never repeats it, as frame A has it.
    it('draws the title once, in the header', () => {
      render(<PrivacyPolicyScreen />);
      const titles = screen.getAllByText('Privacy Policy');
      expect(titles).toHaveLength(1);
      expect(titles[0]).toBe(screen.getByTestId('privacy-policy-title'));
    });

    it('goes back from its header’s back', async () => {
      render(<PrivacyPolicyScreen />);
      const back = screen.getByTestId('privacy-policy-back-button');
      expect(back.props.accessibilityLabel).toBe('Go back');
      await userEvent.press(back);
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('the meta line', () => {
    it('opens the body with the version and the date, in caption-sm textSecondary', () => {
      render(<PrivacyPolicyScreen />);
      const meta = screen.getByTestId('privacy-policy-meta');
      expect(contentOf(blocks()[0] as JsonNode)).toBe(
        `Version ${PRIVACY_POLICY_VERSION} · Last updated: ${PRIVACY_POLICY_LAST_UPDATED}`
      );
      expect((blocks()[0] as JsonNode).props.testID).toBe('privacy-policy-meta');
      // Pinned whole, so no margin, padding or fill can join it.
      expect(flat(meta)).toEqual({
        fontFamily: 'Inter',
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '400',
        letterSpacing: 0,
        marginBottom: 8,
        color: LIGHT_THEME.textSecondary
      });
    });
  });

  describe('the policy', () => {
    // Every word stays, in order (decision, 2026-10-18): the body draws the policy's lines past its
    // title and date, and nothing else. A blank line draws nothing.
    it('draws every line of the policy, in order, and nothing more', () => {
      render(<PrivacyPolicyScreen />);
      expect(drawnLines()).toEqual(
        sourceLines(PRIVACY_POLICY_CONTENT).map((line) => line.replace(/^•\s*/, '• '))
      );
    });

    it('draws a block for each run of the policy, with no spacers between them', () => {
      render(<PrivacyPolicyScreen />);
      // The meta line, then the policy's own blocks.
      expect(blocks()).toHaveLength(1 + parsePolicy(PRIVACY_POLICY_CONTENT).length);
    });

    it('announces each of its ten section heads as a heading', () => {
      render(<PrivacyPolicyScreen />);
      const sections = sourceLines(PRIVACY_POLICY_CONTENT).filter((line) => SECTION_RE.test(line));
      expect(sections).toHaveLength(10);
      expect(screen.getAllByRole('header').map((header) => contentOf(header as never))).toEqual([
        'Privacy Policy',
        ...sections
      ]);
    });

    it('sets a section head in body-lg semibold, 8 above what follows it', () => {
      render(<PrivacyPolicyScreen />);
      const head = screen.getByText('2. Data We Collect');
      expect(flat(head)).toEqual({
        fontFamily: 'Inter',
        fontSize: 17,
        lineHeight: 24,
        fontWeight: '600',
        letterSpacing: 0,
        marginTop: 24,
        marginBottom: 8,
        color: LIGHT_THEME.textPrimary
      });
    });

    // Frame A's 32 above a head: there the 8 under a paragraph and the 32 over a head collapse into
    // 32. React Native does not collapse margins, so the two must add up to it.
    it('stands each section head 32 below the block before it, the meta line included', () => {
      render(<PrivacyPolicyScreen />);
      const drawn = blocks().filter((block): block is JsonNode => typeof block === 'object');
      let heads = 0;
      drawn.forEach((block, index) => {
        if (block.props.accessibilityRole !== 'header') return;
        heads += 1;
        const before = drawn[index - 1]!;
        expect((flat(before).marginBottom as number) + (flat(block).marginTop as number)).toBe(32);
      });
      expect(heads).toBe(10);
    });

    it('sets a paragraph in body-md textPrimary, 8 below', () => {
      render(<PrivacyPolicyScreen />);
      const paragraph = screen.getByText('When you create an account, we collect:');
      expect(flat(paragraph)).toEqual({
        fontFamily: 'Inter',
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '400',
        letterSpacing: 0,
        marginBottom: 8,
        color: LIGHT_THEME.textPrimary
      });
      expect(paragraph.props.accessibilityRole).toBeUndefined();
    });

    // Consecutive bullet lines are one list, in ink: 24 bullets in seven runs.
    it('sets each run of bullet lines as one list in textPrimary, 8 below', () => {
      render(<PrivacyPolicyScreen />);
      const lists = screen.UNSAFE_getAllByType(BulletList);
      expect(lists.map((list) => list.props.tone)).toEqual(Array(7).fill('default'));
      expect(lists.flatMap((list) => list.props.items)).toHaveLength(24);
      expect(lists[0]?.props.items).toEqual([
        'Email address — used for authentication and account recovery.',
        'Loyalty card data — card names, barcode values, barcode formats, brand references, and usage metadata (favourite status, usage count, timestamps).',
        'Consent records — whether and when you accepted this Privacy Policy.'
      ]);
      const wrapper = blocks().find(
        (block): block is JsonNode =>
          typeof block === 'object' && block.type === 'View' && textsOf(block).length > 0
      );
      expect(wrapper && flat(wrapper)).toEqual({ marginBottom: 8 });
    });

    // The body's own 24 plus the bottom inset, as help and the table end: the last block adds
    // nothing to it.
    it('ends at 24 plus the bottom inset, its last block leaving nothing below it', () => {
      render(<PrivacyPolicyScreen />);
      const drawn = blocks().filter((block): block is JsonNode => typeof block === 'object');
      expect(drawn.length).toBeGreaterThan(2);
      // The last block, the contact address's paragraph, pinned whole.
      expect(flat(drawn.at(-1)!)).toEqual({
        fontFamily: 'Inter',
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '400',
        letterSpacing: 0,
        marginBottom: 0,
        color: LIGHT_THEME.textPrimary
      });
      drawn.slice(0, -1).forEach((block) => expect(flat(block).marginBottom).toBe(8));
      expect(
        StyleSheet.flatten(screen.getByTestId('privacy-policy-screen').props.contentContainerStyle)
          .paddingBottom
      ).toBe(24 + INSETS.bottom);
    });

    // No card, box or fill behind the prose: no text, and nothing it sits in, draws one.
    it('draws no box or fill behind any of its text', () => {
      render(<PrivacyPolicyScreen />);
      const body = findJson(tree(), 'privacy-policy-screen')!;
      const drawn = hostNodes(body);
      expect(drawn.filter((part) => part.type === 'Text').length).toBeGreaterThan(30);
      const boxed = drawn
        .filter((part) => boxKeys(part).length > 0)
        .map(
          (part) => `${part.type} “${contentOf(part).slice(0, 24)}”: ${boxKeys(part).join(', ')}`
        );
      expect(boxed).toHaveLength(0);
    });

    // No icon but the header's back: the policy draws none of its own. Each Lucide icon is one
    // react-native-svg root.
    it('draws one icon, the header’s back', () => {
      render(<PrivacyPolicyScreen />);
      const isIcon = (part: JsonNode) => /^RNSVGSvgView/.test(part.type);
      expect(hostNodes(tree()).filter(isIcon)).toHaveLength(1);
      expect(
        hostNodes(findJson(tree(), 'privacy-policy-back-button')!).filter(isIcon)
      ).toHaveLength(1);
    });

    // No link, icon, card or box: the address is a paragraph like any other.
    it('leaves the e-mail address plain text', () => {
      render(<PrivacyPolicyScreen />);
      const address = screen.getByText('Email: privacy@myloyaltycards.app');
      expect(address.props.onPress).toBeUndefined();
      expect(address.props.accessibilityRole).toBeUndefined();
    });
  });

  describe('in dark', () => {
    it('sets the prose in the dark textPrimary and the meta in the dark textSecondary', () => {
      mockIsDark = true;
      render(<PrivacyPolicyScreen />);
      expect(flat(screen.getByTestId('privacy-policy-meta')).color).toBe(DARK_THEME.textSecondary);
      expect(flat(screen.getByText('2. Data We Collect')).color).toBe(DARK_THEME.textPrimary);
      expect(flat(screen.getByText('When you create an account, we collect:')).color).toBe(
        DARK_THEME.textPrimary
      );
      expect(flat(screen.getByText('Location data')).color).toBe(DARK_THEME.textPrimary);
      expect(flat(screen.getByTestId('privacy-policy-document')).backgroundColor).toBe(
        DARK_THEME.background
      );
    });
  });

  // Story 21.2's floor: every sentence at 15 or more. The meta line is the one chrome-tier text.
  // The meta line sits on the 12pt chrome tier. Any other text with no size of its own counts against
  // the floor: React Native draws it at 14.
  it('sets every text at 15pt or more but the meta line, and lets each wrap', () => {
    render(<PrivacyPolicyScreen />);
    const texts = textsOf(tree());
    const meta = texts.filter((text) => text.props.testID === 'privacy-policy-meta');
    expect(meta).toHaveLength(1);
    expect(flat(meta[0]!).fontSize).toBe(12);
    const rest = texts.filter((text) => !meta.includes(text));
    expect(rest.length).toBeGreaterThan(0);
    const belowFloor = rest.filter((text) => {
      const { fontSize } = flat(text);
      return typeof fontSize !== 'number' || fontSize < 15;
    });
    expect(belowFloor.map((text) => contentOf(text))).toHaveLength(0);
    expect(texts.filter((text) => text.props.numberOfLines !== undefined)).toEqual([]);
  });

  describe('in Italian', () => {
    beforeEach(async () => {
      await act(async () => {
        await changeAppLanguage('it');
      });
    });

    it('takes the Italian title in the header, and its meta label', () => {
      render(<PrivacyPolicyScreen />);
      expect(screen.getByRole('header', { name: 'Informativa sulla privacy' })).toBe(
        screen.getByTestId('privacy-policy-title')
      );
      expect(screen.getAllByText('Informativa sulla privacy')).toHaveLength(1);
      expect(contentOf(blocks()[0] as JsonNode)).toBe(
        `Versione ${PRIVACY_POLICY_VERSION} · Ultimo aggiornamento: ${PRIVACY_POLICY_LAST_UPDATED}`
      );
    });

    it('draws every line of the Italian policy, in order, its heads as headings', () => {
      render(<PrivacyPolicyScreen />);
      expect(drawnLines()).toEqual(
        sourceLines(PRIVACY_POLICY_CONTENT_IT).map((line) => line.replace(/^•\s*/, '• '))
      );
      expect(screen.getByRole('header', { name: '2. Dati che raccogliamo' })).toBeTruthy();
      expect(screen.getByRole('header', { name: '6. I tuoi diritti (GDPR)' })).toBeTruthy();
    });
  });
});

/**
 * The screen leaves each policy's first two lines undrawn, because the header and the meta line show
 * them. So each policy must open with exactly those two: a policy that gained a leading line would
 * draw its "Last updated" as a paragraph.
 */
describe('the bundled policies', () => {
  it.each([
    ['English', PRIVACY_POLICY_CONTENT, 'Privacy Policy', 'Last updated'],
    [
      'Italian',
      PRIVACY_POLICY_CONTENT_IT,
      PRIVACY_POLICY_TITLE_IT,
      PRIVACY_POLICY_LAST_UPDATED_LABEL_IT
    ]
  ])(
    'opens the %s policy with its title, then its "Last updated" line',
    (_language, content, title, label) => {
      const [first, second, third] = content.split('\n');
      expect(first).toBe(title);
      expect(second).toBe(`${label}: ${PRIVACY_POLICY_LAST_UPDATED}`);
      // What follows them is drawn: a blank line, then the first section.
      expect(third).toBe('');
    }
  );
});

describe('parsePolicy', () => {
  const policy = (...lines: string[]) => ['Title', 'Last updated: today', ...lines].join('\n');

  it('skips the first two lines, which the header and the meta line show', () => {
    expect(parsePolicy(policy('Body.'))).toEqual([{ kind: 'paragraph', text: 'Body.' }]);
  });

  it('reads a numbered line as a section head and any other as a paragraph, trimmed', () => {
    expect(parsePolicy(policy('', '1. Introduction', '', '  Some text.  '))).toEqual([
      { kind: 'section', text: '1. Introduction' },
      { kind: 'paragraph', text: 'Some text.' }
    ]);
  });

  it('makes one list of consecutive bullet lines, each without its mark', () => {
    expect(parsePolicy(policy('We collect:', '• One', '•Two', '• Three', 'After.'))).toEqual([
      { kind: 'paragraph', text: 'We collect:' },
      { kind: 'bullets', items: ['One', 'Two', 'Three'] },
      { kind: 'paragraph', text: 'After.' }
    ]);
  });

  it('starts a new list after a blank line or another block', () => {
    expect(parsePolicy(policy('• One', '', '• Two', 'Between.', '• Three'))).toEqual([
      { kind: 'bullets', items: ['One'] },
      { kind: 'bullets', items: ['Two'] },
      { kind: 'paragraph', text: 'Between.' },
      { kind: 'bullets', items: ['Three'] }
    ]);
  });

  it('draws nothing for blank lines', () => {
    expect(parsePolicy(policy('', '   ', ''))).toEqual([]);
  });
});

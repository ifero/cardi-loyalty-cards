/**
 * Help Screen Tests
 * Story 4.3: Help & FAQ Access
 * Story 22.8: Document frame B, the searchable FAQ
 */

import { act, fireEvent, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Search from 'lucide-react-native/icons/search';
import X from 'lucide-react-native/icons/x';
import React from 'react';
import { type AccessibilityActionEvent, Alert, Linking, Platform, StyleSheet } from 'react-native';

import { Button, DocumentScreen, SearchBar, Surface } from '@/shared/components/ui';
import { changeAppLanguage } from '@/shared/i18n';
import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import { FaqItem } from './FaqItem';
import bundledHelpItemsIt from './help-data.it.json';
import bundledHelpItems from './help-data.json';
import { fallbackHelpItemsEn, type HelpItem } from './help-fallback';
import HelpScreen from './HelpScreen';
import docsHelpItems from '../../docs/help.json';

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

/** The host node with this testID, and the host node it sits in. */
const findJson = (
  node: JsonNode | string | null,
  testID: string,
  parent: JsonNode | null = null
): { node: JsonNode; parent: JsonNode | null } | null => {
  if (!node || typeof node === 'string') return null;
  if (node.props.testID === testID) return { node, parent };
  for (const child of node.children ?? []) {
    const found = findJson(child, testID, node);
    if (found) return found;
  }
  return null;
};

/** Every host node under a node, itself included, but for the subtrees `skip` names. */
const hostNodes = (node: JsonNode, skip: (part: JsonNode) => boolean = () => false): JsonNode[] =>
  skip(node)
    ? []
    : [
        node,
        ...(node.children ?? []).flatMap((child) =>
          typeof child === 'string' ? [] : hostNodes(child, skip)
        )
      ];

/** The style keys of a node that draw a fill, a border or a rounded box. */
const boxKeys = (node: JsonNode) => {
  const style = (StyleSheet.flatten(node.props.style as never) ?? {}) as Record<string, unknown>;
  return Object.keys(style).filter(
    (key) =>
      /^(backgroundColor|border\w*(Width|Radius))$/.test(key) &&
      ![undefined, 0, 'transparent'].includes(style[key] as never)
  );
};

/** Each Lucide icon is one react-native-svg root. */
const isIcon = (node: JsonNode) => /^RNSVGSvgView/.test(node.type);

/** The host node that holds the node with this testID: the wrapper that spaces it. */
const holderOf = (testID: string) =>
  findJson(screen.toJSON() as unknown as JsonNode, testID)?.parent ?? null;

/** Every host `Text` on the screen, in the order they draw. */
const texts = (
  node: JsonNode | string | null = screen.toJSON() as unknown as JsonNode
): JsonNode[] => {
  if (!node || typeof node === 'string') return [];
  const own = node.type === 'Text' ? [node] : [];
  return [...own, ...(node.children ?? []).flatMap((child) => texts(child))];
};

const flat = (node: { props: Record<string, unknown> }) =>
  StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;

const expectInOrder = (testIDs: string[]) => {
  const tree = JSON.stringify(screen.toJSON());
  const order = testIDs.map((testID) => tree.indexOf(`"${testID}"`));
  expect(order.every((index) => index > -1)).toBe(true);
  expect([...order].sort((a, b) => a - b)).toEqual(order);
};

/** The questions the list shows, in order, by their FAQ item's id. */
const shownIds = () => screen.UNSAFE_queryAllByType(FaqItem).map((item) => item.props.item.id);

/** The ids of the questions whose answers show. */
const openIds = () =>
  screen
    .UNSAFE_queryAllByType(FaqItem)
    .filter((item) => item.props.isOpen)
    .map((item) => item.props.item.id);

const search = (text: string) =>
  fireEvent.changeText(screen.getByTestId('help-search-input'), text);

const ALL_IDS = bundledHelpItems.map((item) => item.id);

const reanimated: {
  useAnimatedStyle: (updater: () => Record<string, unknown>) => Record<string, unknown>;
  withTiming: (value: number, config?: unknown, callback?: unknown) => number;
} = jest.requireMock('react-native-reanimated');

/**
 * An animated style that evaluates its worklet whenever it is read, as the device draws it: the
 * Reanimated mock returns `{}`. Spied on before the render, which makes the worklets.
 */
const liveStyle = (updater: () => Record<string, unknown>) => {
  const style: Record<string, unknown> = {};
  for (const key of Object.keys(updater())) {
    Object.defineProperty(style, key, { enumerable: true, get: () => updater()[key] });
  }
  return style;
};

/** The ids of the questions whose chevrons point up: `chevron-down`, turned half a circle. */
const chevronsUp = () =>
  screen
    .getAllByTestId(/^help-question-.+-chevron-turn$/, { includeHiddenElements: true })
    .filter(
      (turn) => (flat(turn).transform as { rotate: string }[] | undefined)?.[0]?.rotate === '180deg'
    )
    .map((turn) => String(turn.props.testID).replace(/^help-question-(.+)-chevron-turn$/, '$1'));

/** A question's state as VoiceOver says it: the value it reads after the question's name. */
const spokenState = (id: string) =>
  screen.getByTestId(`help-question-${id}`).props.accessibilityValue?.text as string | undefined;

/** One of TalkBack's actions on a question, through the question's own handler. */
const performAction = (id: string, actionName: string) => {
  const onAccessibilityAction = screen.getByTestId(`help-question-${id}`).props
    .onAccessibilityAction as ((event: AccessibilityActionEvent) => void) | undefined;
  expect(onAccessibilityAction).toBeInstanceOf(Function);
  act(() => {
    onAccessibilityAction?.({ nativeEvent: { actionName } } as AccessibilityActionEvent);
  });
};

describe('HelpScreen', () => {
  beforeEach(async () => {
    mockIsDark = false;
    await act(async () => {
      await changeAppLanguage('en');
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('frame B, at rest', () => {
    it('draws the document ground, titled "Help & FAQ" in the header as help-title', () => {
      render(<HelpScreen />);
      expect(screen.UNSAFE_getByType(DocumentScreen).props).toMatchObject({
        title: 'Help & FAQ',
        bodyTestID: 'help-screen'
      });
      const title = screen.getByTestId('help-title');
      expect(title).toBe(screen.getByRole('header', { name: 'Help & FAQ' }));
      // Frame B: no title in the body.
      expect(screen.getAllByText('Help & FAQ')).toHaveLength(1);
      expect(screen.getByTestId('help-screen').type).toBe('RCTScrollView');
    });

    it('stacks the subtitle, the field, the questions, then the two actions', () => {
      render(<HelpScreen />);
      expectInOrder([
        'help-title',
        'help-search',
        'help-faq-list',
        'help-contact-support',
        'help-submit-feedback'
      ]);
      const tree = JSON.stringify(screen.toJSON());
      expect(tree.indexOf('"Find quick answers and troubleshooting steps."')).toBeLessThan(
        tree.indexOf('"help-search"')
      );
    });

    it.each<[string, typeof LIGHT_THEME | typeof DARK_THEME]>([
      ['light', LIGHT_THEME],
      ['dark', DARK_THEME]
    ])('sets the subtitle in body-md textSecondary in %s', (scheme, roles) => {
      mockIsDark = scheme === 'dark';
      render(<HelpScreen />);
      // Pinned whole, so no margin, padding or fill can join it.
      expect(flat(screen.getByText('Find quick answers and troubleshooting steps.'))).toEqual({
        fontFamily: 'Inter',
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '400',
        letterSpacing: 0,
        color: roles.textSecondary
      });
    });

    // Under large text the subtitle wraps and grows: nothing clips it.
    it('lets the subtitle wrap, with no line limit', () => {
      render(<HelpScreen />);
      expect(
        screen.getByText('Find quick answers and troubleshooting steps.').props.numberOfLines
      ).toBeUndefined();
    });

    // The system's field, 24 below the subtitle, with help's own copy: its placeholder names it.
    it('draws the system’s search field, 24 below the subtitle, named by its placeholder', () => {
      render(<HelpScreen />);
      expect(screen.UNSAFE_getByType(SearchBar).props).toMatchObject({
        testID: 'help-search',
        placeholder: 'Search help',
        accessibilityLabel: 'Search help',
        clearAccessibilityLabel: 'Clear search'
      });
      const input = screen.getByTestId('help-search-input');
      expect(input.props.placeholder).toBe('Search help');
      expect(screen.getByLabelText('Search help')).toBe(input);
      // Announced as a search field.
      expect(input.props.accessibilityRole).toBe('search');
      expect(flat(holderOf('help-search')!)).toEqual({ marginTop: 24 });
    });

    // No icon but the FAQ's chevrons and the search field's own glyphs: the header's back, the
    // field's magnifier, its clear × once there is text, and one chevron-down per question.
    it('draws only the back, the field’s glyphs and one chevron per question', async () => {
      render(<HelpScreen />);
      const icons = () => hostNodes(screen.toJSON() as unknown as JsonNode).filter(isIcon);
      expect(screen.UNSAFE_getAllByType(ChevronLeft)).toHaveLength(1);
      expect(screen.UNSAFE_getAllByType(Search)).toHaveLength(1);
      expect(screen.UNSAFE_queryAllByType(X)).toHaveLength(0);
      expect(screen.UNSAFE_getAllByType(ChevronDown)).toHaveLength(ALL_IDS.length);
      expect(icons()).toHaveLength(2 + ALL_IDS.length);

      // An open answer adds none.
      await userEvent.press(screen.getByTestId('help-question-1'));
      expect(icons()).toHaveLength(2 + ALL_IDS.length);

      // Text in the field adds its clear ×.
      search('card');
      expect(screen.UNSAFE_getAllByType(X)).toHaveLength(1);
      expect(screen.UNSAFE_getAllByType(ChevronDown)).toHaveLength(shownIds().length);
      expect(icons()).toHaveLength(3 + shownIds().length);
    });

    // No card, box or fill behind the prose: on the page, only the field, the FAQ's one surface and
    // the two buttons draw one. The field and the buttons are spared whole; the surface draws only its
    // outline and the rules between its questions, so everything it holds is walked.
    it.each(['at rest', 'with no match'])(
      'draws no box or fill but the field, the surface and the buttons, %s',
      (state) => {
        render(<HelpScreen />);
        if (state === 'with no match') search('zzzz');
        const SPARED = ['help-search', 'help-contact-support', 'help-submit-feedback'];
        const SURFACE = ['help-faq-list', 'help-faq-list-divider'];
        const body = findJson(screen.toJSON() as unknown as JsonNode, 'help-screen')!.node;
        const walked = hostNodes(body, (part) => SPARED.includes(String(part.props.testID)));
        expect(walked.some((part) => /^help-question-/.test(String(part.props.testID)))).toBe(
          state === 'at rest'
        );
        const boxed = walked
          .filter((part) => !SURFACE.includes(String(part.props.testID)))
          .filter((part) => boxKeys(part).length > 0)
          .map((part) => `${part.type} ${String(part.props.testID)}: ${boxKeys(part).join(', ')}`);
        expect(boxed).toHaveLength(0);
      }
    );

    it('lists every question closed, on one divided surface 24 below the field', () => {
      render(<HelpScreen />);
      expect(shownIds()).toEqual(ALL_IDS);
      expect(openIds()).toEqual([]);
      expect(screen.queryByTestId(/^help-answer-/)).toBeNull();

      const surface = screen.UNSAFE_getByType(Surface);
      expect(surface.props).toMatchObject({ divided: true, testID: 'help-faq-list' });
      expect(screen.getAllByTestId('help-faq-list-divider')).toHaveLength(ALL_IDS.length - 1);
      expect(flat(holderOf('help-faq-list')!)).toEqual({ marginTop: 24 });

      // The surface holds the questions themselves and the rules between them, nothing around them:
      // each of its children is a rule or an item whose first part is its question's row.
      const rows = (findJson(screen.toJSON() as unknown as JsonNode, 'help-faq-list')!.node
        .children ?? []) as JsonNode[];
      expect(
        rows.map((part) =>
          part.props.testID === 'help-faq-list-divider'
            ? 'rule'
            : String((part.children?.[0] as JsonNode | undefined)?.props.testID)
        )
      ).toStrictEqual(
        ALL_IDS.flatMap((id, index) =>
          index === 0 ? [`help-question-${id}`] : ['rule', `help-question-${id}`]
        )
      );
    });

    it.each<[string, typeof LIGHT_THEME | typeof DARK_THEME]>([
      ['light', LIGHT_THEME],
      ['dark', DARK_THEME]
    ])('draws the FAQ surface in %s’s surface, outlined in its border', (scheme, roles) => {
      mockIsDark = scheme === 'dark';
      render(<HelpScreen />);
      expect(flat(screen.getByTestId('help-faq-list'))).toMatchObject({
        backgroundColor: roles.surface,
        borderColor: roles.border,
        borderWidth: 1
      });
    });

    // Contact Support above Submit Feedback, full width and 8 apart, 32 below the list, at the
    // default 48: `Buttons` gives 52 only to a footer's primary and a sheet's actions.
    it('ends with Contact Support above Submit Feedback, 32 below the list, 8 apart', () => {
      render(<HelpScreen />);
      const buttons = screen.UNSAFE_getAllByType(Button).map((button) => button.props);
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toMatchObject({
        variant: 'primary',
        testID: 'help-contact-support',
        accessibilityLabel: 'Contact support',
        children: 'Contact Support'
      });
      expect(buttons[1]).toMatchObject({
        variant: 'secondary',
        testID: 'help-submit-feedback',
        accessibilityLabel: 'Submit feedback',
        children: 'Submit Feedback'
      });
      buttons.forEach((button) => expect(button.size).toBeUndefined());
      expect(flat(screen.getByTestId('help-contact-support-container')).minHeight).toBe(48);
      expect(flat(holderOf('help-contact-support')!)).toEqual({ marginTop: 32, gap: 8 });
    });

    it.each<[string, typeof LIGHT_THEME | typeof DARK_THEME]>([
      ['light', LIGHT_THEME],
      ['dark', DARK_THEME]
    ])(
      'fills Contact Support with primary and outlines Submit Feedback in it, in %s',
      (s, roles) => {
        mockIsDark = s === 'dark';
        render(<HelpScreen />);
        expect(flat(screen.getByTestId('help-contact-support-container'))).toMatchObject({
          backgroundColor: roles.primary
        });
        expect(flat(screen.getByText('Contact Support')).color).toBe(roles.onPrimary);
        expect(flat(screen.getByTestId('help-submit-feedback-container'))).toMatchObject({
          backgroundColor: 'transparent',
          borderColor: roles.primary,
          borderWidth: 1
        });
      }
    );

    it('goes back from its header’s back', async () => {
      render(<HelpScreen />);
      const back = screen.getByTestId('help-back-button');
      expect(back.props.accessibilityLabel).toBe('Go back');
      await userEvent.press(back);
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('a question', () => {
    // Read as VoiceOver hears it, the chevrons as the device turns them.
    beforeEach(() => {
      jest.replaceProperty(Platform, 'OS', 'ios');
      jest.spyOn(reanimated, 'useAnimatedStyle').mockImplementation(liveStyle);
    });

    it('opens on a press: its answer and steps beneath it, its chevron up, reported expanded', async () => {
      render(<HelpScreen />);
      expect(spokenState('1')).toBe('collapsed');
      expect(chevronsUp()).toEqual([]);

      await userEvent.press(screen.getByTestId('help-question-1'));

      const answer = screen.getByTestId('help-answer-1');
      expect(answer).toBeTruthy();
      expect(screen.getByText(/Tap Add Card on the main screen/)).toBeTruthy();
      expect(screen.getByText('Open the main screen')).toBeTruthy();
      expect(screen.getByText('Choose Scan Barcode or Add Manually')).toBeTruthy();
      expect(spokenState('1')).toBe('expanded');
      expect(chevronsUp()).toEqual(['1']);
      expectInOrder(['help-question-1', 'help-answer-1', 'help-question-2']);
    });

    // Several stay open at once (decision, 2026-10-19): opening a question closes no other, so no
    // answer closing above a tapped question moves it.
    it('leaves the other questions as they are when one opens', async () => {
      render(<HelpScreen />);
      await userEvent.press(screen.getByTestId('help-question-3'));
      expect(openIds()).toEqual(['3']);

      await userEvent.press(screen.getByTestId('help-question-1'));
      expect(openIds()).toEqual(['1', '3']);
      expect(screen.getByTestId('help-answer-1')).toBeTruthy();
      expect(screen.getByTestId('help-answer-3')).toBeTruthy();
      expect(spokenState('3')).toBe('expanded');
      expect(chevronsUp()).toEqual(['1', '3']);

      // Closing one leaves the other open.
      await userEvent.press(screen.getByTestId('help-question-3'));
      expect(openIds()).toEqual(['1']);
      expect(screen.queryByTestId('help-answer-3')).toBeNull();
      expect(screen.getByTestId('help-answer-1')).toBeTruthy();
      expect(spokenState('3')).toBe('collapsed');
      expect(chevronsUp()).toEqual(['1']);
    });

    it('closes when pressed again', async () => {
      render(<HelpScreen />);
      await userEvent.press(screen.getByTestId('help-question-2'));
      expect(openIds()).toEqual(['2']);

      await userEvent.press(screen.getByTestId('help-question-2'));
      expect(openIds()).toEqual([]);
      expect(
        screen.queryByText('Make sure the barcode is well lit and centered in the frame.')
      ).toBeNull();
    });

    // Animated, not jumpy (decision, 2026-10-19): a press runs the answer's motion on the question
    // pressed, and a search runs none, since each question keeps its own item through it. Spied
    // before the render: the worklets plugin captures what a worklet calls at render time.
    it('runs the answer’s motion on the question pressed, and none on a search', async () => {
      const withTiming = jest.spyOn(reanimated, 'withTiming');
      render(<HelpScreen />);
      expect(withTiming).not.toHaveBeenCalled();

      await userEvent.press(screen.getByTestId('help-question-1'));
      expect(withTiming).toHaveBeenCalledTimes(1);
      expect(withTiming).toHaveBeenCalledWith(1, expect.objectContaining({ duration: 220 }));

      withTiming.mockClear();
      search('scan a barcode');
      search('');
      expect(withTiming).not.toHaveBeenCalled();
      expect(openIds()).toStrictEqual(['1']);
    });

    // Every item's steps stay, shown with its answer as a muted bulleted list.
    it('shows each item’s own steps with its answer', async () => {
      render(<HelpScreen />);
      for (const item of bundledHelpItems) {
        await userEvent.press(screen.getByTestId(`help-question-${item.id}`));
        expect(screen.getByText(item.answer)).toBeTruthy();
        item.steps.forEach((step) => expect(screen.getByText(step)).toBeTruthy());
      }
    });

    // TalkBack's Expand and Collapse open and close a question as a press does, so the state it
    // reports is always the answer's.
    it('opens from TalkBack’s Expand and closes from its Collapse, on Android', () => {
      jest.replaceProperty(Platform, 'OS', 'android');
      render(<HelpScreen />);
      performAction('2', 'expand');
      expect(openIds()).toEqual(['2']);
      expect(screen.getByTestId('help-question-2').props.accessibilityState).toMatchObject({
        expanded: true
      });
      expect(screen.getByTestId('help-answer-2')).toBeTruthy();

      performAction('2', 'collapse');
      expect(openIds()).toEqual([]);
      expect(screen.getByTestId('help-question-2').props.accessibilityState).toMatchObject({
        expanded: false
      });
      expect(screen.queryByTestId('help-answer-2')).toBeNull();
    });
  });

  describe('the search', () => {
    it('keeps only the questions whose question holds the text', () => {
      render(<HelpScreen />);
      search('scan a barcode');
      expect(shownIds()).toEqual(['2']);
    });

    it('matches an answer', () => {
      render(<HelpScreen />);
      search('stored locally');
      expect(shownIds()).toEqual(['4']);
    });

    it('matches a tag', () => {
      render(<HelpScreen />);
      search('troubleshooting');
      expect(shownIds()).toEqual(
        bundledHelpItems.filter((item) => item.tags.includes('troubleshooting')).map((i) => i.id)
      );
      expect(shownIds().length).toBeGreaterThan(0);
    });

    // As shipped, and as ruled 2026-10-19 (`cardi-design-system.md` § _Documents_): the search
    // matches each question's question, answer and tags, and never its steps.
    it('does not search the steps', () => {
      render(<HelpScreen />);
      search('No background camera usage');
      expect(shownIds()).toEqual([]);
    });

    it('trims the text and ignores its case', () => {
      render(<HelpScreen />);
      search('   IS MY DATA PRIVATE   ');
      expect(shownIds()).toEqual(['4']);
    });

    it('keeps the open question open through a search', async () => {
      render(<HelpScreen />);
      await userEvent.press(screen.getByTestId('help-question-4'));
      search('privacy');
      expect(openIds()).toEqual(['4']);
      search('');
      expect(shownIds()).toEqual(ALL_IDS);
      expect(openIds()).toEqual(['4']);
    });

    // Hidden by a search, it is still open when the search clears, its answer read again.
    it('keeps a question open through a search that hides it', async () => {
      jest.replaceProperty(Platform, 'OS', 'ios');
      render(<HelpScreen />);
      await userEvent.press(screen.getByTestId('help-question-4'));
      search('scan a barcode');
      expect(shownIds()).toEqual(['2']);
      expect(screen.queryByTestId('help-question-4')).toBeNull();

      await userEvent.press(screen.getByTestId('help-search-clear'));
      expect(shownIds()).toEqual(ALL_IDS);
      expect(openIds()).toEqual(['4']);
      expect(spokenState('4')).toBe('expanded');
      expect(screen.getByTestId('help-answer-4')).toBeTruthy();
    });

    // Pressed while the list is filtered, a question opens itself, never the one the full list holds
    // in its place.
    it('opens the question pressed while the list is filtered', async () => {
      render(<HelpScreen />);
      search('scan a barcode');
      expect(shownIds()).toEqual(['2']);
      await userEvent.press(screen.getByTestId('help-question-2'));
      expect(openIds()).toStrictEqual(['2']);
    });

    it('empties the field and brings every question back from its clear ×', async () => {
      render(<HelpScreen />);
      search('privacy');
      expect(shownIds().length).toBeLessThan(ALL_IDS.length);

      const clear = screen.getByTestId('help-search-clear');
      expect(clear.props.accessibilityLabel).toBe('Clear search');
      await userEvent.press(clear);

      expect(screen.getByTestId('help-search-input').props.value).toBe('');
      expect(shownIds()).toEqual(ALL_IDS);
    });
  });

  describe('no match', () => {
    it('says so in one line where the list was, the query trimmed, and keeps the actions', () => {
      render(<HelpScreen />);
      search('  zzzz  ');
      expect(screen.queryByTestId('help-faq-list')).toBeNull();
      expect(shownIds()).toEqual([]);
      const line = screen.getByTestId('help-no-results');
      expect(line.props.children).toBe('No answers matching “zzzz”');
      expectInOrder([
        'help-search',
        'help-no-results',
        'help-contact-support',
        'help-submit-feedback'
      ]);
      // Still drawn, and still reachable: a query never hides the way to support.
      expect(screen.getByRole('button', { name: 'Contact support' })).toBe(
        screen.getByTestId('help-contact-support')
      );
      expect(screen.getByRole('button', { name: 'Submit feedback' })).toBe(
        screen.getByTestId('help-submit-feedback')
      );
    });

    // A query never hides the way to support, nor disables it: both actions still act.
    it('keeps both actions working', async () => {
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
      const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
      render(<HelpScreen />);
      search('zzzz');

      await userEvent.press(screen.getByTestId('help-contact-support'));
      await waitFor(() => {
        expect(openURL).toHaveBeenCalledWith('mailto:support@myloyaltycards.app');
      });

      await userEvent.press(screen.getByTestId('help-submit-feedback'));
      await waitFor(() => {
        expect(openURL).toHaveBeenCalledWith('https://myloyaltycards.app/feedback');
      });
    });

    // In the list's place, exactly one line; and no icon but the header's back and the field's own
    // glyphs, its clear × included.
    it('holds one line in the list’s place, and only the back and the field’s glyphs', () => {
      render(<HelpScreen />);
      search('zzzz');
      expect(screen.UNSAFE_getAllByType(ChevronLeft)).toHaveLength(1);
      expect(screen.UNSAFE_getAllByType(Search)).toHaveLength(1);
      expect(screen.UNSAFE_getAllByType(X)).toHaveLength(1);
      expect(screen.UNSAFE_queryAllByType(ChevronDown)).toHaveLength(0);
      expect(hostNodes(screen.toJSON() as unknown as JsonNode).filter(isIcon)).toHaveLength(3);

      // The body's blocks, top to bottom: each by its testID, its text, or the testIDs it holds.
      const body = findJson(screen.toJSON() as unknown as JsonNode, 'help-screen')!.node;
      const content = body.children?.[0] as JsonNode;
      const blocks = (content.children ?? []).filter(
        (block): block is JsonNode => typeof block !== 'string'
      );
      const named = blocks.map((block) => {
        if (block.props.testID) return String(block.props.testID);
        const parts = (block.children ?? []).filter(
          (part): part is JsonNode => typeof part !== 'string'
        );
        return block.type === 'Text'
          ? `Text: ${(block.children ?? []).join('')}`
          : `${block.type} > ${parts.map((part) => String(part.props.testID)).join(', ')}`;
      });
      expect(named).toStrictEqual([
        'Text: Find quick answers and troubleshooting steps.',
        'View > help-search',
        'help-no-results',
        'View > help-contact-support, help-submit-feedback'
      ]);
    });

    // The query as it was typed, trimmed: its case kept, though the match ignores it.
    it('echoes a mixed-case query as typed, trimmed', () => {
      render(<HelpScreen />);
      search('  ZzZ Nowhere  ');
      expect(screen.getByTestId('help-no-results').props.children).toBe(
        'No answers matching “ZzZ Nowhere”'
      );
    });

    it.each<[string, typeof LIGHT_THEME | typeof DARK_THEME]>([
      ['light', LIGHT_THEME],
      ['dark', DARK_THEME]
    ])('sets it in body-md textSecondary, centred, 80 below the field, in %s', (s, roles) => {
      mockIsDark = s === 'dark';
      render(<HelpScreen />);
      search('zzzz');
      expect(flat(screen.getByTestId('help-no-results'))).toEqual({
        fontFamily: 'Inter',
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '400',
        letterSpacing: 0,
        marginTop: 80,
        textAlign: 'center',
        color: roles.textSecondary
      });
    });

    // A long query wraps the line onto more: nothing clips it.
    it('lets the line wrap, with no line limit', () => {
      render(<HelpScreen />);
      search('zzzz');
      expect(screen.getByTestId('help-no-results').props.numberOfLines).toBeUndefined();
    });

    it('draws no line while anything matches', () => {
      render(<HelpScreen />);
      search('card');
      expect(screen.queryByTestId('help-no-results')).toBeNull();
    });
  });

  // While the field is focused, a press on a question or an action acts at once, as on the wallet.
  it('lets a press act while the keyboard is up', () => {
    render(<HelpScreen />);
    expect(screen.getByTestId('help-screen').props.keyboardShouldPersistTaps).toBe('handled');
  });

  describe('the actions', () => {
    it('opens mail to support, and the feedback page', async () => {
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
      const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
      render(<HelpScreen />);

      await userEvent.press(screen.getByTestId('help-contact-support'));
      await waitFor(() => {
        expect(openURL).toHaveBeenCalledWith('mailto:support@myloyaltycards.app');
      });

      await userEvent.press(screen.getByTestId('help-submit-feedback'));
      await waitFor(() => {
        expect(openURL).toHaveBeenCalledWith('https://myloyaltycards.app/feedback');
      });
    });

    it.each([
      ['help-contact-support', 'No email app available. Please try again later.'],
      ['help-submit-feedback', 'Feedback page unavailable. Please try again later.']
    ])('alerts when %s cannot open', async (testID, message) => {
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
      const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
      const alert = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
      render(<HelpScreen />);

      await userEvent.press(screen.getByTestId(testID));
      await waitFor(() => {
        expect(alert).toHaveBeenCalledWith('Unable to open', message);
      });
      expect(openURL).not.toHaveBeenCalled();
    });

    it('alerts when opening throws', async () => {
      jest.spyOn(Linking, 'canOpenURL').mockRejectedValue(new Error('no handler'));
      const alert = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
      render(<HelpScreen />);

      await userEvent.press(screen.getByTestId('help-contact-support'));
      await waitFor(() => {
        expect(alert).toHaveBeenCalledWith(
          'Unable to open',
          'No email app available. Please try again later.'
        );
      });
    });
  });

  // Story 21.2's floor: every sentence at 15 or more. Help has no chrome-tier text at all.
  // A text with no size of its own counts against the floor: React Native draws it at 14.
  it('sets every text at 15pt or more, at rest, open and with no match', async () => {
    render(<HelpScreen />);
    await userEvent.press(screen.getByTestId('help-question-1'));
    const drawn = texts();
    search('zzzz');
    drawn.push(...texts());
    expect(drawn.length).toBeGreaterThan(0);
    const belowFloor = drawn.filter((text) => {
      const { fontSize } = flat(text);
      return typeof fontSize !== 'number' || fontSize < 15;
    });
    expect(belowFloor.map((text) => text.children)).toHaveLength(0);
  });

  describe('its content', () => {
    it('keeps bundled help data in sync with docs source-of-truth', () => {
      expect(bundledHelpItems).toEqual(docsHelpItems);
    });

    it('falls back to its bundled items, with their steps, when the list it is given is empty', async () => {
      render(<HelpScreen itemsOverride={[]} />);
      expect(shownIds()).toEqual(fallbackHelpItemsEn.map((item) => item.id));

      await userEvent.press(screen.getByTestId('help-question-fallback-1'));
      expect(screen.getByText('Open the main screen')).toBeTruthy();
    });

    it('draws the items it is given', () => {
      const items: HelpItem[] = [
        { id: 'custom', question: 'A custom question?', answer: 'An answer.', tags: ['custom'] }
      ];
      render(<HelpScreen itemsOverride={items} />);
      expect(shownIds()).toEqual(['custom']);
      expect(screen.getByRole('button', { name: 'A custom question?' })).toBeTruthy();
    });
  });

  describe('in Italian', () => {
    beforeEach(async () => {
      await act(async () => {
        await changeAppLanguage('it');
      });
    });

    it('titles the header and lists the Italian questions', () => {
      render(<HelpScreen />);
      expect(screen.getByRole('header', { name: 'Aiuto e FAQ' })).toBe(
        screen.getByTestId('help-title')
      );
      expect(screen.getByText('Come posso aggiungere la mia prima carta?')).toBeTruthy();
      expect(shownIds()).toEqual(bundledHelpItemsIt.map((item) => item.id));
    });

    it('names the field and its clear × in Italian', () => {
      render(<HelpScreen />);
      search('carta');
      expect(screen.getByLabelText("Cerca nell'aiuto")).toBe(
        screen.getByTestId('help-search-input')
      );
      expect(screen.getByTestId('help-search-clear').props.accessibilityLabel).toBe(
        'Cancella ricerca'
      );
    });

    it('says no answer matches in Italian', () => {
      render(<HelpScreen />);
      search(' zzzz ');
      expect(screen.getByTestId('help-no-results').props.children).toBe(
        'Nessuna risposta corrisponde a “zzzz”'
      );
    });

    // Both states from the app's own strings, so VoiceOver says neither in English: React Native's
    // own "expanded" would be, whatever the app's language.
    it('says each question’s state in Italian on iOS: "chiuso", then "aperto"', async () => {
      jest.replaceProperty(Platform, 'OS', 'ios');
      render(<HelpScreen />);
      expect(spokenState('1')).toBe('chiuso');
      expect(screen.getByTestId('help-question-1').props.accessibilityState?.expanded).toBe(
        undefined
      );

      await userEvent.press(screen.getByTestId('help-question-1'));
      expect(spokenState('1')).toBe('aperto');
      expect(screen.getByTestId('help-question-1').props.accessibilityState?.expanded).toBe(
        undefined
      );
    });
  });
});

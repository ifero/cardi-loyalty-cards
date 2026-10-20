/**
 * FaqItem — one question of help's FAQ (Story 22.8, document frame B).
 *
 * Rendered through the real `StoryDecorator`, because the row's colours are theme roles and only
 * the real `ThemeProvider` flips them.
 *
 * The answer's motion runs on Reanimated, whose global mock completes every animation at once and
 * returns `{}` for an animated style. Where a test reads the answer's height, `useAnimatedStyle`
 * returns the style its worklet evaluates to whenever it is read, as `BarcodeFlash.test.tsx` does,
 * so a write to a shared value shows without another render. Spies go in before the render: the
 * worklets plugin captures what a worklet calls when the worklet is made.
 */
import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import ChevronDown, {
  __iconData as chevronDownGlyph
} from 'lucide-react-native/icons/chevron-down';
import ChevronUp, { __iconData as chevronUpGlyph } from 'lucide-react-native/icons/chevron-up';
import React from 'react';
import {
  type AccessibilityActionEvent,
  type LayoutChangeEvent,
  Platform,
  StyleSheet
} from 'react-native';

import { BulletList } from '@/shared/components/ui';
import { SHEET_SLIDE_MS } from '@/shared/components/ui/BottomSheet';
import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import {
  FaqItem,
  getAnswerContentStyle,
  getAnswerRevealStyle,
  getChevronTurnStyle
} from './FaqItem';
import type { HelpItem } from './help-fallback';

type Scheme = 'light' | 'dark';
type ItemProps = React.ComponentProps<typeof FaqItem>;
type TimingConfig = { duration?: number; easing?: unknown; reduceMotion?: unknown };

const reanimated: {
  withTiming: (value: number, config?: TimingConfig, callback?: unknown) => number;
  useAnimatedStyle: (updater: () => Record<string, unknown>) => Record<string, unknown>;
  Easing: { out: (easing: unknown) => unknown; ease: unknown };
} = jest.requireMock('react-native-reanimated');

/** The sheet's timing, as the jest.setup mock builds it: `Easing.out` hands back what it wraps. */
const SHEET_TIMING = {
  duration: SHEET_SLIDE_MS,
  easing: reanimated.Easing.out(reanimated.Easing.ease)
};

const ITEM: HelpItem = {
  id: '3',
  question: 'Why is my camera not working?',
  answer: 'Camera access is required to scan barcodes.',
  steps: ['Open Settings on your device', 'Find Cardì > Camera', 'Enable Camera access'],
  tags: ['camera', 'permissions', 'troubleshooting']
};

/** The height the answer's content measures in these tests. */
const CONTENT_HEIGHT = 120;

const renderItem = (props: Partial<ItemProps> = {}, scheme: Scheme = 'light') => {
  const onToggle = props.onToggle ?? jest.fn();
  const tree = (isOpen: boolean) => (
    <StoryDecorator theme={scheme}>
      <FaqItem item={ITEM} {...props} isOpen={isOpen} onToggle={onToggle} />
    </StoryDecorator>
  );
  const { rerender } = render(tree(props.isOpen ?? false));
  return { onToggle, setOpen: (isOpen: boolean) => rerender(tree(isOpen)) };
};

/** An animated style that evaluates its worklet whenever it is read. */
const liveStyle = (updater: () => Record<string, unknown>) => {
  const style: Record<string, unknown> = {};
  for (const key of Object.keys(updater())) {
    Object.defineProperty(style, key, { enumerable: true, get: () => updater()[key] });
  }
  return style;
};

const flat = (node: { props: Record<string, unknown> }) =>
  StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;

const row = () => screen.getByTestId('help-question-3');

/** Lucide hides its icons from assistive technology, so a query has to look past that. */
const chevron = () =>
  screen.getByTestId('help-question-3-chevron', { includeHiddenElements: true });

/** The view the chevron turns in, and how far it has turned. */
const turn = () =>
  screen.getByTestId('help-question-3-chevron-turn', { includeHiddenElements: true });
const turned = () =>
  (flat(turn()).transform as { rotate: string }[] | undefined)?.map(({ rotate }) => rotate);

/** The window the answer shows through, and the answer's content: drawn, if not read, closed. */
const reveal = () => screen.getByTestId('help-answer-3-reveal', { includeHiddenElements: true });
const content = () => screen.getByTestId('help-answer-3', { includeHiddenElements: true });

/**
 * The answer's content lays out at its natural height, as the device reports it: through the
 * content's own `onLayout`, called directly. `fireEvent` would climb to the nearest view with a
 * handler, so it would pass were the handler on the window around the content.
 */
const measure = (height = CONTENT_HEIGHT) => {
  const onLayout = content().props.onLayout as ((event: LayoutChangeEvent) => void) | undefined;
  expect(onLayout).toBeInstanceOf(Function);
  act(() => {
    onLayout?.({
      nativeEvent: { layout: { x: 0, y: 0, width: 345, height } }
    } as LayoutChangeEvent);
  });
};

/**
 * One of TalkBack's actions on the question, through the row's own handler, called directly so it
 * cannot climb to another's.
 */
const performAction = (actionName: string) => {
  const onAccessibilityAction = row().props.onAccessibilityAction as
    | ((event: AccessibilityActionEvent) => void)
    | undefined;
  expect(onAccessibilityAction).toBeInstanceOf(Function);
  act(() => {
    onAccessibilityAction?.({ nativeEvent: { actionName } } as AccessibilityActionEvent);
  });
};

/** The points a glyph's one open path visits: a relative move, then relative lines. */
const pathPoints = (glyph: typeof chevronDownGlyph) => {
  const [element, attributes] = glyph.node[0] ?? [];
  const d = String((attributes as { d?: string } | undefined)?.d);
  expect(glyph.node).toHaveLength(1);
  expect(element).toBe('path');
  expect(d).toMatch(/^m[-\d. ]+$/);
  const numbers = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  const points: [number, number][] = [];
  for (let index = 0; index < numbers.length; index += 2) {
    const [x, y] = points.at(-1) ?? [0, 0];
    points.push([x + numbers[index]!, y + numbers[index + 1]!]);
  }
  return points;
};

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

const json = (testID: string) => findJson(screen.toJSON() as unknown as JsonNode, testID);

/** The row's host parts, in order: the question, then the view the chevron turns in. */
const partsOfRow = () =>
  (json('help-question-3')?.node.children ?? []).filter(
    (part): part is JsonNode => typeof part !== 'string'
  );

/** Every host node under a node, itself included. */
const hostNodes = (node: JsonNode): JsonNode[] => [
  node,
  ...(node.children ?? []).flatMap((child) => (typeof child === 'string' ? [] : hostNodes(child)))
];

/** The icons drawn under a node: each Lucide icon is one react-native-svg root. */
const iconsIn = (node: JsonNode) =>
  hostNodes(node).filter((part) => /^RNSVGSvgView/.test(part.type));

/** The style keys of a node that draw a fill, a border or a rounded box. */
const boxKeys = (node: JsonNode) => {
  const style = (flat(node) ?? {}) as Record<string, unknown>;
  return Object.keys(style).filter(
    (key) =>
      /^(backgroundColor|border\w*(Width|Radius))$/.test(key) &&
      ![undefined, 0, 'transparent'].includes(style[key] as never)
  );
};

describe('FaqItem', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('the question’s row', () => {
    // At least 48, padded 12/16 with 12 between the question and the chevron, centred on the row:
    // the system row's measures over the frame's 14/16.
    it('is at least 48, padded 12/16, its parts 12 apart and centred', () => {
      renderItem();
      expect(flat(row())).toMatchObject({
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 48,
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12
      });
      expect(flat(row()).height).toBeUndefined();
    });

    // On the FAQ's one outlined surface, never a card of its own: the item adds no box around the
    // question and its answer, and the row's whole style is pinned, so no border or radius joins it.
    it('draws no card of its own: the item carries no style, and its row no box', () => {
      renderItem();
      expect(json('help-question-3')?.parent?.props.style).toBeUndefined();
      expect(flat(row())).toStrictEqual({
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 48,
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
        backgroundColor: 'transparent'
      });
    });

    // Under large text the question wraps and the row grows, the chevron staying at its end.
    it('sets the question in body-lg semibold, wrapping in the room the chevron leaves', () => {
      renderItem();
      const question = screen.getByText(ITEM.question);
      expect(question.props.numberOfLines).toBeUndefined();
      // Pinned whole, so no margin, padding or fill can join it.
      expect(flat(question)).toEqual({
        fontFamily: 'Inter',
        fontSize: 17,
        lineHeight: 24,
        fontWeight: '600',
        letterSpacing: 0,
        flex: 1,
        color: LIGHT_THEME.textPrimary
      });
    });

    it('puts the question first and the chevron at the row’s end', () => {
      renderItem();
      const tree = JSON.stringify(screen.toJSON());
      const question = tree.indexOf(`"${ITEM.question}"`);
      const glyph = tree.indexOf('"help-question-3-chevron"');
      expect(question).toBeGreaterThan(-1);
      expect(question).toBeLessThan(glyph);
      const parts = partsOfRow();
      expect(parts).toHaveLength(2);
      expect(parts[0]?.type).toBe('Text');
      expect(parts[1]?.props.testID).toBe('help-question-3-chevron-turn');
      // The chevron alone turns in it.
      expect(parts[1]?.children).toHaveLength(1);
      expect(findJson(parts[1]!, 'help-question-3-chevron')?.parent).toBe(parts[1]);
    });

    it.each<[Scheme, typeof LIGHT_THEME | typeof DARK_THEME]>([
      ['light', LIGHT_THEME],
      ['dark', DARK_THEME]
    ])('sets the question in textPrimary and the chevron in textSecondary in %s', (s, roles) => {
      renderItem({}, s);
      expect(flat(screen.getByText(ITEM.question)).color).toBe(roles.textPrimary);
      expect(chevron().props).toMatchObject({
        width: 24,
        height: 24,
        strokeWidth: 1.5,
        stroke: roles.textSecondary
      });
    });

    // One glyph, turned with its answer (_Documents_, ruled 2026-10-19), never swapped for another.
    it.each([false, true])('draws chevron-down, and never chevron-up (open: %s)', (isOpen) => {
      renderItem({ isOpen });
      expect(screen.UNSAFE_getAllByType(ChevronDown)).toHaveLength(1);
      expect(screen.UNSAFE_queryByType(ChevronUp)).toBeNull();
    });

    // So an open question draws frame B's chevron. Lucide draws on a 24 box, the chevron's own
    // size, so the view it turns in turns about the glyph's centre.
    it('turned half a circle, chevron-down is chevron-up’s glyph', () => {
      expect(chevronDownGlyph).toMatchObject({ size: 24 });
      expect(chevronUpGlyph).toMatchObject({ size: 24 });
      const turnedDown = pathPoints(chevronDownGlyph).map(([x, y]) => [24 - x, 24 - y]);
      expect(turnedDown).toEqual(pathPoints(chevronUpGlyph));
      expect(turnedDown).toHaveLength(3);
    });
  });

  describe('a control', () => {
    it.each([false, true])('is a button named by its question (open: %s)', (isOpen) => {
      renderItem({ isOpen });
      const button = screen.getByRole('button', { name: ITEM.question });
      expect(button).toBe(row());
      // `getByRole`'s name also matches the text inside the row, so the name itself is pinned too.
      expect(button.props.accessibilityLabel).toBe(ITEM.question);
    });

    // React Native's iOS view voices "expanded" only while it is true, and in English whatever the
    // app's language. So on iOS the state is not set, and the value says it both ways, in the app's
    // language: VoiceOver reads it after the name.
    describe('on iOS', () => {
      beforeEach(() => {
        jest.replaceProperty(Platform, 'OS', 'ios');
      });

      it('says "collapsed" while closed and "expanded" while open, through its value', () => {
        const { setOpen } = renderItem();
        expect(row().props.accessibilityValue).toEqual({ text: 'collapsed' });

        setOpen(true);
        expect(row().props.accessibilityValue).toEqual({ text: 'expanded' });

        setOpen(false);
        expect(row().props.accessibilityValue).toEqual({ text: 'collapsed' });
      });

      it.each([false, true])('takes no expanded state (open: %s)', (isOpen) => {
        renderItem({ isOpen });
        expect(row().props.accessibilityState?.expanded).toBeUndefined();
      });

      it('declares no actions', () => {
        renderItem();
        expect(row().props.accessibilityActions).toBeUndefined();
        expect(row().props.onAccessibilityAction).toBeUndefined();
      });
    });

    // TalkBack voices the state both ways itself, in the system's language: a value would be heard
    // twice. It offers Expand while closed and Collapse while open, and React Native reaches JS only
    // for an action JS declares.
    describe('on Android', () => {
      beforeEach(() => {
        jest.replaceProperty(Platform, 'OS', 'android');
      });

      it('reports its state, and carries no value', () => {
        const { setOpen } = renderItem();
        expect(row().props.accessibilityState).toMatchObject({ expanded: false });
        expect(row().props.accessibilityValue?.text).toBeUndefined();

        setOpen(true);
        expect(row().props.accessibilityState).toMatchObject({ expanded: true });
        expect(row().props.accessibilityValue?.text).toBeUndefined();
      });

      it('declares Expand while closed and Collapse while open', () => {
        const { setOpen } = renderItem();
        expect(row().props.accessibilityActions).toEqual([{ name: 'expand' }]);

        setOpen(true);
        expect(row().props.accessibilityActions).toEqual([{ name: 'collapse' }]);
      });

      it('opens from Expand while closed, as a press does', () => {
        const { onToggle } = renderItem();
        performAction('expand');
        expect(onToggle).toHaveBeenCalledTimes(1);
      });

      it('closes from Collapse while open, as a press does', () => {
        const { onToggle } = renderItem({ isOpen: true });
        performAction('collapse');
        expect(onToggle).toHaveBeenCalledTimes(1);
      });

      // An action that does not fit the state does nothing, so none ever does its opposite.
      it.each([
        [false, 'collapse'],
        [true, 'expand'],
        [false, 'activate'],
        [true, 'activate']
      ])('does nothing for an action that does not fit (open: %s, %s)', (isOpen, actionName) => {
        const { onToggle } = renderItem({ isOpen });
        performAction(actionName);
        expect(onToggle).not.toHaveBeenCalled();
      });
    });

    // Pressed through the row's own responder, as a finger does: `fireEvent.press` would climb to
    // an `onPress` above it.
    it('toggles when pressed', async () => {
      const { onToggle } = renderItem();
      await userEvent.press(row());
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it.each<[Scheme, typeof LIGHT_THEME | typeof DARK_THEME]>([
      ['light', LIGHT_THEME],
      ['dark', DARK_THEME]
    ])('takes surfaceElevated while held in %s, and nothing at rest', (scheme, roles) => {
      renderItem({}, scheme);
      expect(flat(row()).backgroundColor).toBe('transparent');
      fireEvent(row(), 'pressIn');
      expect(flat(row()).backgroundColor).toBe(roles.surfaceElevated);
      fireEvent(row(), 'pressOut');
      expect(flat(row()).backgroundColor).toBe('transparent');
    });
  });

  describe('the answer', () => {
    beforeEach(() => {
      jest.spyOn(reanimated, 'useAnimatedStyle').mockImplementation(liveStyle);
    });

    it('holds no space and is not read while the question is closed', () => {
      renderItem();
      measure();
      expect(flat(reveal())).toEqual({ overflow: 'hidden', height: 0 });
      // Out of the flow, pinned to the window's top and sides, so it still measures whole.
      expect(flat(content())).toMatchObject({ position: 'absolute', top: 0, left: 0, right: 0 });
      expect(reveal().props.accessibilityElementsHidden).toBe(true);
      expect(reveal().props.importantForAccessibility).toBe('no-hide-descendants');
      // Not read: assistive technology, and so these queries, reach none of it.
      expect(screen.queryByTestId('help-answer-3')).toBeNull();
      expect(screen.queryByText(ITEM.answer)).toBeNull();
      expect(screen.queryByText(ITEM.steps![0]!)).toBeNull();
    });

    it('is read, and takes its natural height, while open', () => {
      renderItem({ isOpen: true });
      measure();
      expect(flat(reveal())).toEqual({ overflow: 'hidden', height: 'auto' });
      // In the flow, so it gives the window its height.
      expect(flat(content()).position).toBe('relative');
      expect(reveal().props.accessibilityElementsHidden).toBe(false);
      expect(reveal().props.importantForAccessibility).toBe('auto');
      expect(screen.getByTestId('help-answer-3')).toBe(content());
      expect(screen.getByText(ITEM.answer)).toBeTruthy();
    });

    // The content's own layout sets how far the answer moves. Measured on the window instead, it
    // would read the window's moving height, so the opening would pause at 0 and then snap.
    it('measures its content through the content’s own layout, and never the window’s', () => {
      renderItem();
      expect(content().props.onLayout).toBeInstanceOf(Function);
      expect(reveal().props.onLayout).toBeUndefined();
    });

    it('sits beneath its question while open, padded 0 16 16, with no tint and no fill', () => {
      renderItem({ isOpen: true });
      const answer = screen.getByTestId('help-answer-3');
      // Pinned whole, open and at rest: pinned to the window's top and sides, in the flow, padded
      // 0 16 16, and nothing more.
      expect(flat(answer)).toEqual({
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingBottom: 16,
        position: 'relative'
      });
      expect(flat(reveal()).backgroundColor).toBeUndefined();
      // The open row keeps no fill either.
      expect(flat(row()).backgroundColor).toBe('transparent');

      const tree = JSON.stringify(screen.toJSON());
      expect(tree.indexOf('"help-question-3"')).toBeLessThan(tree.indexOf('"help-answer-3"'));
    });

    it.each<[Scheme, string]>([
      ['light', LIGHT_THEME.textSecondary],
      ['dark', DARK_THEME.textSecondary]
    ])('sets the answer in body-md textSecondary in %s', (scheme, hex) => {
      renderItem({ isOpen: true }, scheme);
      expect(flat(screen.getByText(ITEM.answer))).toEqual({
        fontFamily: 'Inter',
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '400',
        letterSpacing: 0,
        color: hex
      });
    });

    // Under large text the answer wraps and grows: nothing clips it.
    it('lets the answer wrap, with no line limit', () => {
      renderItem({ isOpen: true });
      expect(screen.getByText(ITEM.answer).props.numberOfLines).toBeUndefined();
    });

    // Frame B draws no steps, but every item has them, and they stay: under the answer, muted.
    it('sets its steps 8 below the answer, as a muted bulleted list', () => {
      renderItem({ isOpen: true });
      const steps = screen.UNSAFE_getByType(BulletList);
      expect(steps.props).toMatchObject({ items: ITEM.steps, tone: 'muted' });
      const wrapper = json('help-answer-3-steps')?.parent;
      expect(wrapper && flat(wrapper)).toEqual({ marginTop: 8 });

      const tree = JSON.stringify(screen.toJSON());
      expect(tree.indexOf(`"${ITEM.answer}"`)).toBeLessThan(tree.indexOf('"help-answer-3-steps"'));
    });

    // No tint and no fill, nor a border or a radius: neither the open answer, its window, nor anything
    // in it, nor the question's text, draws a box. The FAQ's one outlined surface draws the only one.
    it('draws no box or fill in the open answer, or on the question’s text', () => {
      renderItem({ isOpen: true });
      const answer = hostNodes(json('help-answer-3-reveal')!.node);
      const question = hostNodes(json('help-question-3')!.node).filter(
        (part) => part.type === 'Text'
      );
      expect(question).toHaveLength(1);
      // The window, the content, the answer, the steps' wrapper and list, and each step's two parts.
      expect(answer.length).toBeGreaterThanOrEqual(5 + ITEM.steps!.length * 3);
      const boxed = [...answer, ...question]
        .filter((part) => boxKeys(part).length > 0)
        .map((part) => `${part.type} ${String(part.props.testID)}: ${boxKeys(part).join(', ')}`);
      expect(boxed).toHaveLength(0);
    });

    // No icon but the FAQ's chevrons and the search field's own glyphs: an answer draws none.
    it('holds no icon while open', () => {
      renderItem({ isOpen: true });
      const answer = json('help-answer-3')?.node;
      expect(answer).toBeDefined();
      expect(iconsIn(answer!)).toHaveLength(0);
      // The row's one icon is its chevron.
      expect(iconsIn(json('help-question-3')!.node).map((icon) => icon.props.testID)).toStrictEqual(
        ['help-question-3-chevron']
      );
    });

    it('draws no list for an item without steps', () => {
      renderItem({ isOpen: true, item: { ...ITEM, steps: undefined } });
      expect(screen.getByText(ITEM.answer)).toBeTruthy();
      expect(screen.UNSAFE_queryByType(BulletList)).toBeNull();
    });
  });

  // Animated, not jumpy (decision, 2026-10-19): the answer grows from beneath its question to its
  // full height, and closes the same way.
  describe('its motion', () => {
    beforeEach(() => {
      jest.spyOn(reanimated, 'useAnimatedStyle').mockImplementation(liveStyle);
    });

    // The sheet's 220 ms ease-out, and no Reduce Motion setting of its own: `withTiming` follows
    // the system's, so under Reduce Motion the answer opens at once.
    it('opens on the sheet’s 220 ms ease-out, following the system’s Reduce Motion', () => {
      const withTiming = jest.spyOn(reanimated, 'withTiming');
      const { setOpen } = renderItem();
      withTiming.mockClear();
      // The mock's `Easing.out` and `Easing.inOut` both hand back what they wrap, so the curve is
      // read off the call that builds it.
      const easeOut = jest.spyOn(reanimated.Easing, 'out');

      setOpen(true);
      expect(withTiming).toHaveBeenCalledTimes(1);
      expect(withTiming).toHaveBeenCalledWith(1, SHEET_TIMING);
      expect(SHEET_TIMING).toEqual({ duration: 220, easing: 'ease' });
      expect(easeOut).toHaveBeenCalledTimes(1);
      expect(easeOut).toHaveBeenCalledWith(reanimated.Easing.ease);
      expect(withTiming.mock.calls[0]?.[1]?.easing).toBe(easeOut.mock.results[0]?.value);
      expect(withTiming.mock.calls[0]?.[1]).not.toHaveProperty('reduceMotion');
    });

    it('closes on the same motion, in reverse', () => {
      const withTiming = jest.spyOn(reanimated, 'withTiming');
      const { setOpen } = renderItem({ isOpen: true });
      withTiming.mockClear();
      const easeOut = jest.spyOn(reanimated.Easing, 'out');

      setOpen(false);
      expect(withTiming).toHaveBeenCalledTimes(1);
      expect(withTiming).toHaveBeenCalledWith(0, SHEET_TIMING);
      expect(easeOut).toHaveBeenCalledWith(reanimated.Easing.ease);
      expect(withTiming.mock.calls[0]?.[1]).not.toHaveProperty('reduceMotion');
    });

    // Held halfway: the answer shows half its content's height, so the rows below it move with it.
    // The content stays out of the flow while it moves, at its own height, clipped by the window.
    it('grows to the height its content measures, a share of it at each step', () => {
      const { setOpen } = renderItem();
      measure();
      expect(flat(reveal()).height).toBe(0);

      jest.spyOn(reanimated, 'withTiming').mockReturnValue(0.5);
      setOpen(true);
      expect(flat(reveal()).height).toBe(CONTENT_HEIGHT / 2);
      expect(flat(content()).position).toBe('absolute');
    });

    it('shrinks from that height while it closes', () => {
      const { setOpen } = renderItem({ isOpen: true });
      measure();
      expect(flat(reveal()).height).toBe('auto');

      jest.spyOn(reanimated, 'withTiming').mockReturnValue(0.25);
      setOpen(false);
      expect(flat(reveal()).height).toBe(CONTENT_HEIGHT / 4);
    });

    it('follows its content when that measures again', () => {
      const { setOpen } = renderItem();
      measure();
      measure(200);
      jest.spyOn(reanimated, 'withTiming').mockReturnValue(0.5);
      setOpen(true);
      expect(flat(reveal()).height).toBe(100);
    });

    it('opens and closes as often as it is pressed', () => {
      const withTiming = jest.spyOn(reanimated, 'withTiming');
      const { setOpen } = renderItem();
      measure();

      setOpen(true);
      expect(flat(reveal()).height).toBe('auto');
      setOpen(false);
      expect(flat(reveal()).height).toBe(0);
      setOpen(true);
      expect(flat(reveal()).height).toBe('auto');
      expect(withTiming.mock.calls.map(([value]) => value)).toEqual([1, 0, 1]);
    });

    // Mounting is not opening: a question drawn open or closed starts there, with no motion.
    it.each([false, true])('runs no motion when it mounts (open: %s)', (isOpen) => {
      const withTiming = jest.spyOn(reanimated, 'withTiming');
      renderItem({ isOpen });
      expect(withTiming).not.toHaveBeenCalled();
    });

    // A question back from a search that hid it while open: whole from its first frame, before its
    // content has measured.
    it('starts whole when it mounts open, before its content measures', () => {
      renderItem({ isOpen: true });
      expect(flat(reveal()).height).toBe('auto');
    });

    it('stays closed when it mounts closed, before its content measures', () => {
      renderItem();
      expect(flat(reveal()).height).toBe(0);
    });

    // The chevron turns on the answer's own motion (_Documents_, ruled 2026-10-19): halfway open, it
    // has turned a quarter circle while the answer shows half its height. Under Reduce Motion the
    // answer opens at once, so the chevron turns at once.
    it('turns the chevron up as the answer opens, on the answer’s own motion', () => {
      const { setOpen } = renderItem();
      measure();
      expect(turned()).toEqual(['0deg']);

      const withTiming = jest.spyOn(reanimated, 'withTiming').mockReturnValue(0.5);
      setOpen(true);
      expect(turned()).toEqual(['90deg']);
      expect(flat(reveal()).height).toBe(CONTENT_HEIGHT / 2);

      // At rest, open: turned half a circle, pointing up.
      withTiming.mockRestore();
      setOpen(false);
      setOpen(true);
      expect(turned()).toEqual(['180deg']);
    });

    it('turns the chevron back down as the answer closes', () => {
      const { setOpen } = renderItem({ isOpen: true });
      measure();
      expect(turned()).toEqual(['180deg']);

      jest.spyOn(reanimated, 'withTiming').mockReturnValue(0.25);
      setOpen(false);
      expect(turned()).toEqual(['45deg']);
      expect(flat(reveal()).height).toBe(CONTENT_HEIGHT / 4);
    });

    // A question drawn open, back from a search that hid it, points up from its first frame.
    it.each([
      [false, '0deg'],
      [true, '180deg']
    ])('starts its chevron where its answer starts (open: %s)', (isOpen, rotate) => {
      renderItem({ isOpen });
      expect(turned()).toEqual([rotate]);
      // The view it turns in has no style but the turn.
      expect(Object.keys(flat(turn()))).toEqual(['transform']);
    });
  });

  describe('getChevronTurnStyle', () => {
    it('points down while closed and up, turned half a circle, while open', () => {
      expect(getChevronTurnStyle(0)).toEqual({ transform: [{ rotate: '0deg' }] });
      expect(getChevronTurnStyle(1)).toEqual({ transform: [{ rotate: '180deg' }] });
    });

    it('turns with the answer between', () => {
      expect(getChevronTurnStyle(0.25)).toEqual({ transform: [{ rotate: '45deg' }] });
      expect(getChevronTurnStyle(0.5)).toEqual({ transform: [{ rotate: '90deg' }] });
    });
  });

  describe('getAnswerRevealStyle', () => {
    it('holds no space while closed', () => {
      expect(getAnswerRevealStyle(0, CONTENT_HEIGHT)).toEqual({ height: 0 });
      expect(getAnswerRevealStyle(0, 0)).toEqual({ height: 0 });
    });

    it('shows its share of the measured height in motion', () => {
      expect(getAnswerRevealStyle(0.5, CONTENT_HEIGHT)).toEqual({ height: 60 });
      expect(getAnswerRevealStyle(0.9, 200)).toEqual({ height: 180 });
    });

    // Natural, so it is whole whether or not it has measured, and grows with its text.
    it('takes its natural height open and at rest', () => {
      expect(getAnswerRevealStyle(1, CONTENT_HEIGHT)).toEqual({ height: 'auto' });
      expect(getAnswerRevealStyle(1, 0)).toEqual({ height: 'auto' });
    });
  });

  // In the flow, a window held to a height clamps its content's measure to it; out of the flow, the
  // content measures whole.
  describe('getAnswerContentStyle', () => {
    it('lays the content out of the flow while closed and in motion', () => {
      expect(getAnswerContentStyle(0)).toEqual({ position: 'absolute' });
      expect(getAnswerContentStyle(0.5)).toEqual({ position: 'absolute' });
      expect(getAnswerContentStyle(0.99)).toEqual({ position: 'absolute' });
    });

    it('puts it in the flow open and at rest, where it gives the window its height', () => {
      expect(getAnswerContentStyle(1)).toEqual({ position: 'relative' });
    });
  });
});

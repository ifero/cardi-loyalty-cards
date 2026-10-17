/**
 * BottomSheet — Story 22.1 (AC1, AC8, AC11).
 *
 * Through the real `StoryDecorator` stack, because the sheet's spec is mostly colour: an ink
 * scrim, a white-or-ink sheet and a #D6D6CB-or-#3A3A48 grabber, flipping with the theme. The
 * decorator also supplies a deterministic 34pt bottom inset.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import React from 'react';
import {
  AccessibilityInfo,
  DeviceEventEmitter,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text
} from 'react-native';

import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import {
  BottomSheet,
  SHEET_SLIDE_MS,
  getScrimOpacity,
  getSheetBottomPadding,
  getSheetOffset,
  getSlideStyle
} from './BottomSheet';
import { Button } from './Button';
import { StoryDecorator } from '../../../.storybook/StoryDecorator';

type Scheme = 'light' | 'dark';
type SheetProps = Partial<React.ComponentProps<typeof BottomSheet>>;
type TimingCallback = (finished?: boolean) => void;

// The jest.setup mock completes every animation at once; these tests hold the slide-out open.
const reanimated = jest.requireMock<{
  withTiming: (value: number, config?: object, callback?: TimingCallback) => number;
}>('react-native-reanimated');

/** Renders a titled sheet and returns a way to show or hide it, as its screen would. */
const renderToggle = (visible: boolean) => {
  const tree = (isVisible: boolean) => (
    <StoryDecorator>
      <BottomSheet visible={isVisible} onClose={jest.fn()} title="Theme" testID="sheet">
        <Text>Body</Text>
      </BottomSheet>
    </StoryDecorator>
  );
  const { rerender } = render(tree(visible));
  return { setVisible: (isVisible: boolean) => rerender(tree(isVisible)) };
};

/** Holds every slide back: the callbacks are the only way the test finishes an animation. */
const holdAnimations = () => {
  const callbacks: TimingCallback[] = [];
  jest.spyOn(reanimated, 'withTiming').mockImplementation((value, _config, callback) => {
    if (callback) callbacks.push(callback);
    return value;
  });
  return callbacks;
};

const presentedModal = () => screen.UNSAFE_getByType(Modal).props.visible;

/** A body unless the test names its own children — `null` and `undefined` included. */
const renderSheet = (props: SheetProps = {}, scheme: Scheme = 'light') =>
  render(
    <StoryDecorator theme={scheme}>
      <BottomSheet visible onClose={jest.fn()} title="Theme" testID="sheet" {...props}>
        {'children' in props ? props.children : <Text>Body</Text>}
      </BottomSheet>
    </StoryDecorator>
  );

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

/**
 * The scrim is hidden from assistive technology on purpose (see below), and RNTL's queries skip
 * hidden elements by default — so a test that TAPS it has to say it is reaching past that, which
 * is exactly what a sighted user's finger does.
 */
const scrim = () => screen.getByTestId('sheet-scrim', { includeHiddenElements: true });

describe('BottomSheet', () => {
  it('announces open and close on visibility transitions', () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => undefined);

    const { rerender } = render(
      <StoryDecorator>
        <BottomSheet visible={false} onClose={jest.fn()} title="Theme">
          <></>
        </BottomSheet>
      </StoryDecorator>
    );
    expect(announceSpy).not.toHaveBeenCalled();

    rerender(
      <StoryDecorator>
        <BottomSheet visible onClose={jest.fn()} title="Theme">
          <></>
        </BottomSheet>
      </StoryDecorator>
    );
    expect(announceSpy).toHaveBeenCalledWith('Theme opened');

    rerender(
      <StoryDecorator>
        <BottomSheet visible={false} onClose={jest.fn()} title="Theme">
          <></>
        </BottomSheet>
      </StoryDecorator>
    );
    expect(announceSpy).toHaveBeenCalledWith('Theme closed');

    announceSpy.mockRestore();
  });

  it('calls onClose when the scrim is pressed', () => {
    const onClose = jest.fn();
    renderSheet({ onClose });
    fireEvent.press(scrim());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // AC8 — the scrim FADES and only the sheet slides. A native Modal animation moves the WHOLE
  // modal: `slide` carried the dark scrim up the screen like a curtain, and `fade` faded the sheet
  // too, so the rows behind it showed through while it rose (seen frame by frame in the app).
  it('presents the modal with no native animation, leaving the motion to Reanimated (AC8)', () => {
    renderSheet();
    expect(screen.UNSAFE_getByType(Modal).props.animationType).toBe('none');
  });

  describe('motion (AC8)', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    // In % of the sheet's own height, so the whole 220 ms is motion the eye can see.
    it('slides the sheet up by its own height when shown, and back down when hidden', () => {
      expect(getSheetOffset(true)).toBe(0);
      expect(getSheetOffset(false)).toBe(100);
    });

    // A window height in points left a short sheet off the screen for most of the slide.
    it('moves the sheet in % of its own height, never in points', () => {
      expect(getSlideStyle(getSheetOffset(false))).toEqual({ transform: [{ translateY: '100%' }] });
      expect(getSlideStyle(getSheetOffset(true))).toEqual({ transform: [{ translateY: '0%' }] });
    });

    it('shows all of the scrim with the sheet, and none of it without', () => {
      expect(getScrimOpacity(true)).toBe(1);
      expect(getScrimOpacity(false)).toBe(0);
    });

    it('settles on the 220 ms the multi-code picker already used', () => {
      expect(SHEET_SLIDE_MS).toBe(220);
    });

    it('fades the scrim and slides the sheet on the same 220 ms ease-out, both ways', () => {
      const timing = jest.spyOn(reanimated, 'withTiming');
      // The jest.setup mock hands `Easing.out(Easing.ease)` back as the `ease` it wraps.
      const config = { duration: 220, easing: 'ease' };
      const { setVisible } = renderToggle(true);
      expect(timing).toHaveBeenCalledWith(1, config);
      expect(timing).toHaveBeenCalledWith(0, config, expect.any(Function));

      timing.mockClear();
      setVisible(false);
      expect(timing).toHaveBeenCalledWith(0, config);
      expect(timing).toHaveBeenCalledWith(100, config, expect.any(Function));
    });

    it('keeps the modal up while the sheet slides out, and takes it down when the slide ends', () => {
      const callbacks = holdAnimations();
      const { setVisible } = renderToggle(true);
      setVisible(false);
      // Still drawn, though already hidden from assistive technology (the Modal's
      // `accessibilityElementsHidden`), which is why these queries reach past that.
      expect(presentedModal()).toBe(true);
      expect(screen.getByText('Body', { includeHiddenElements: true })).toBeTruthy();

      act(() => callbacks.at(-1)?.(true));
      expect(presentedModal()).toBe(false);
      expect(screen.queryByText('Body', { includeHiddenElements: true })).toBeNull();
    });

    it('stays up when a re-open interrupts the slide-out', () => {
      const callbacks = holdAnimations();
      const { setVisible } = renderToggle(true);
      setVisible(false);
      const slideOut = callbacks.at(-1);
      setVisible(true);

      // Reanimated reports an interrupted animation as unfinished.
      act(() => slideOut?.(false));
      expect(presentedModal()).toBe(true);
    });

    // The callback hops to the JS thread (`scheduleOnRN`), so a cut-short slide-out can report in
    // after the sheet has been re-opened AND closed again.
    it('lets only the LAST slide-out take the modal down after close, re-open, close', () => {
      const callbacks = holdAnimations();
      const { setVisible } = renderToggle(true);
      setVisible(false);
      const firstSlideOut = callbacks.at(-1);
      setVisible(true);
      setVisible(false);
      const secondSlideOut = callbacks.at(-1);

      act(() => firstSlideOut?.(false));
      expect(presentedModal()).toBe(true);

      act(() => secondSlideOut?.(true));
      expect(presentedModal()).toBe(false);
    });

    it('takes no touches while it slides out, so no action fires a second time', () => {
      holdAnimations();
      const { setVisible } = renderToggle(true);
      expect(flat('sheet-root').pointerEvents).toBeUndefined();

      setVisible(false);
      expect(
        StyleSheet.flatten(
          screen.getByTestId('sheet-root', { includeHiddenElements: true }).props.style
        ).pointerEvents
      ).toBe('none');
    });

    it('opens in the same render as `visible`, with nothing to wait for', () => {
      holdAnimations();
      const { setVisible } = renderToggle(false);
      expect(presentedModal()).toBe(false);

      setVisible(true);
      expect(presentedModal()).toBe(true);
    });
  });

  // AC1 / AC11 — the grabber was the OFF-spec part: 40 × 4, radius 2, at 40 % opacity of
  // `textSecondary`. The spec (`stitch-prompts-settings.txt`) is 36 × 4, fully rounded, solid
  // #D6D6CB, 8px above.
  it.each<[Scheme, string]>([
    ['light', '#D6D6CB'],
    ['dark', '#3A3A48']
  ])(
    'draws the spec grabber in %s: 36 × 4, fully rounded, solid hairline, 8 above',
    (scheme, hex) => {
      renderSheet({}, scheme);
      const grabber = flat('sheet-grabber');
      expect(grabber).toMatchObject({
        width: 36,
        height: 4,
        borderRadius: 2,
        marginTop: 8,
        backgroundColor: hex
      });
      expect(grabber.opacity).toBeUndefined();
    }
  );

  it.each<[Scheme, string]>([
    ['light', '#FFFFFF'],
    ['dark', '#181824']
  ])('is a %s sheet rounded 16 on its TOP corners only, with 24pt margins', (scheme, fill) => {
    renderSheet({}, scheme);
    const sheet = flat('sheet-content');
    expect(sheet).toMatchObject({
      backgroundColor: fill,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingHorizontal: 24
    });
    expect(sheet.borderBottomLeftRadius).toBeUndefined();
    expect(sheet.borderBottomRightRadius).toBeUndefined();
    // 8pt above the home indicator's 34pt inset.
    expect(sheet.paddingBottom).toBe(34 + 8);
  });

  it('caps its height so a long list scrolls inside it rather than off the screen', () => {
    renderSheet();
    expect(flat('sheet-content').maxHeight).toBe('80%');
  });

  it('dims with ink at 40 %, never a flat black', () => {
    renderSheet();
    expect(StyleSheet.flatten(scrim().props.style).backgroundColor).toBe('rgba(24, 24, 36, 0.4)');
  });

  it.each<[Scheme, string]>([
    ['light', LIGHT_THEME.textPrimary],
    ['dark', DARK_THEME.textPrimary]
  ])(
    'sets the title in the sheet-title token as a %s textPrimary heading, the description 8pt under it',
    (scheme, textPrimary) => {
      renderSheet({ description: 'Choose how your cards look.' }, scheme);
      const title = screen.getByText('Theme');
      expect(title.props.accessibilityRole).toBe('header');
      expect(StyleSheet.flatten(title.props.style)).toMatchObject({
        fontFamily: 'Space Grotesk',
        fontSize: 20,
        fontWeight: '700',
        color: textPrimary
      });
      expect(
        StyleSheet.flatten(screen.getByText('Choose how your cards look.').props.style)
      ).toMatchObject({ marginTop: 8 });
    }
  );

  // Top to bottom: the title, the description, the content, then the actions.
  describe('order', () => {
    const expectInOrder = (needles: string[]) => {
      const tree = JSON.stringify(screen.toJSON());
      const order = needles.map((needle) => tree.indexOf(`["${needle}"]`));
      expect(order.every((index) => index > -1)).toBe(true);
      expect([...order].sort((a, b) => a - b)).toEqual(order);
    };
    const parts = {
      title: 'Order title',
      description: 'Order description',
      children: <Text>Order content</Text>
    };

    it('draws the title, the description, the content, then the actions', () => {
      renderSheet({ ...parts, actions: <Text>Order action</Text> });
      expectInOrder(['Order title', 'Order description', 'Order content', 'Order action']);
    });

    it('draws the title, the description, then the content, without actions', () => {
      renderSheet(parts);
      expectInOrder(['Order title', 'Order description', 'Order content']);
    });
  });

  describe('assistive technology', () => {
    // The content used to be a `Pressable`, which is an accessibility element by default — so on
    // iOS VoiceOver saw ONE element and could not reach the buttons inside any sheet.
    it('keeps the sheet a modal CONTAINER, so the controls inside it stay reachable', () => {
      renderSheet({
        children: (
          <Button variant="secondary" onPress={jest.fn()}>
            Cancel
          </Button>
        )
      });
      const content = screen.getByTestId('sheet-content');
      expect(content.props.accessible).not.toBe(true);
      expect(content.props.accessibilityViewIsModal).toBe(true);
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    });

    it('hides the scrim, which is a touch affordance with no name', () => {
      renderSheet();
      expect(screen.queryByTestId('sheet-scrim')).toBeNull();
      const { props } = scrim();
      expect(props.accessible).toBe(false);
      expect(props.importantForAccessibility).toBe('no');
      expect(props.accessibilityElementsHidden).toBe(true);
    });

    // With the scrim hidden, VoiceOver's own dismiss gesture is the equivalent of tapping it.
    it('closes on the VoiceOver escape gesture', () => {
      const onClose = jest.fn();
      renderSheet({ onClose });
      screen.getByTestId('sheet-content').props.onAccessibilityEscape();
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Story 22.7 — the actions slot: the sheet's action, then Cancel, 24 below what precedes them and
   * 8 apart, pinned under text that scrolls within the 80 % cap.
   */
  describe('actions', () => {
    const actions = (
      <>
        <Button variant="destructive" size="large" onPress={jest.fn()} testID="confirm">
          Sign Out
        </Button>
        <Button variant="secondary" size="large" onPress={jest.fn()} testID="cancel">
          Cancel
        </Button>
      </>
    );

    /** The nearest composite ancestor of a node rendered by the component `type`. */
    const ancestorOfType = (testID: string, type: unknown) => {
      let node = screen.getByTestId(testID).parent;
      while (node && node.type !== type) {
        node = node.parent;
      }
      return node;
    };

    const renderWithActions = (props: SheetProps = {}) =>
      renderSheet({
        title: 'Sign Out?',
        description: 'You will return to guest mode.',
        actions,
        ...props
      });

    it('sets them 24 below what precedes them and 8 apart, in the order given', () => {
      renderWithActions();
      expect(flat('sheet-actions')).toMatchObject({ marginTop: 24, gap: 8 });
      const tree = JSON.stringify(screen.toJSON());
      expect(tree.indexOf('"confirm"')).toBeGreaterThan(-1);
      expect(tree.indexOf('"confirm"')).toBeLessThan(tree.indexOf('"cancel"'));
    });

    // The text above scrolls; the actions are the sheet's own, so they never scroll away.
    it('scrolls the title, the description and the content, and pins the actions beneath', () => {
      renderWithActions({ children: <Text testID="body-text">Body</Text> });
      const body = screen.getByTestId('sheet-body');
      expect(body.type).toBe('RCTScrollView');
      expect(ancestorOfType('body-text', ScrollView)).toBeTruthy();
      expect(within(body).getByText('Sign Out?')).toBeTruthy();
      expect(within(body).getByText('You will return to guest mode.')).toBeTruthy();
      expect(within(body).queryByTestId('confirm')).toBeNull();
      expect(ancestorOfType('confirm', ScrollView)).toBeNull();
      expect(ancestorOfType('cancel', ScrollView)).toBeNull();
    });

    // A scroll view grows by default, and React Native's layout (Yoga's legacy stretch) hands a
    // height-capped container's spare height to a growing child: a short sheet would stand 80 %
    // tall. It shrinks, and so scrolls, only once the sheet reaches its cap.
    it('never grows the text past its content, and shrinks it at the cap', () => {
      renderWithActions();
      expect(flat('sheet-body')).toMatchObject({ flexGrow: 0, flexShrink: 1 });
      expect(flat('sheet-content').maxHeight).toBe('80%');
    });

    it('starts the text 16 below the grabber, does not bounce at rest, and keeps handled taps', () => {
      renderWithActions();
      const body = screen.getByTestId('sheet-body');
      expect(StyleSheet.flatten(body.props.contentContainerStyle)).toMatchObject({
        paddingTop: 16
      });
      expect(body.props.alwaysBounceVertical).toBe(false);
      expect(body.props.keyboardShouldPersistTaps).toBe('handled');
    });

    it('sets the content 16 below the text', () => {
      renderWithActions({ children: <Text>Body</Text> });
      expect(flat('sheet-children').marginTop).toBe(16);
    });

    // An acknowledge sheet, or a confirm whose request has not failed: the description, then the
    // actions 24 below it, with no content and no gap for one.
    it.each([
      ['nothing', undefined],
      ['an error that is not there', null],
      ['a false condition', false]
    ])('draws no content, and no gap for it, when it is given %s', (_case, children) => {
      renderWithActions({ children });
      expect(screen.queryByTestId('sheet-children')).toBeNull();
      expect(screen.getByTestId('sheet-actions')).toBeTruthy();
    });

    it('keeps the title a heading, announced by name when the sheet opens', () => {
      const announce = jest
        .spyOn(AccessibilityInfo, 'announceForAccessibility')
        .mockImplementation(() => undefined);
      renderWithActions();
      expect(screen.getByRole('header', { name: 'Sign Out?' })).toBeTruthy();
      expect(announce).toHaveBeenCalledWith('Sign Out? opened');
      announce.mockRestore();
    });
  });

  // A sheet without actions draws exactly as it did: the multi-code picker, the sort sheet and the
  // pickers hold their own lists, which scroll inside the sheet's shrinking body.
  describe('without actions', () => {
    it('keeps its body a plain shrinking view, adding no scroll view and no actions', () => {
      renderSheet();
      expect(screen.queryByTestId('sheet-body')).toBeNull();
      expect(screen.queryByTestId('sheet-actions')).toBeNull();
      expect(screen.UNSAFE_queryAllByType(ScrollView)).toHaveLength(0);
      expect(flat('sheet-children')).toMatchObject({ flexShrink: 1, marginTop: 16 });
    });

    // The body has no testID: it is the nearest view above the title. It shrinks, so a list inside
    // it scrolls within the cap, and it starts 16 below the grabber.
    it('pads its body 16 at the top, and lets it shrink', () => {
      renderSheet();
      let body = screen.getByText('Theme').parent;
      while (body && body.type !== 'View') {
        body = body.parent;
      }
      expect(StyleSheet.flatten(body?.props.style)).toMatchObject({
        flexShrink: 1,
        paddingTop: 16
      });
    });
  });

  /**
   * Story 22.7 — the keyboard. The keyboard-avoiding view is the modal's full-screen root: it
   * measures its overlap from its own frame, relative to its parent, against the keyboard's top in
   * screen coordinates, and only the modal's root makes the two agree.
   */
  describe('the keyboard', () => {
    const keyboardView = () => screen.UNSAFE_getByType(KeyboardAvoidingView);

    const keyboardEvent = (screenY: number, height: number) => ({
      endCoordinates: { screenX: 0, screenY, width: 393, height },
      duration: 0,
      easing: 'keyboard'
    });

    it('is the root, holding the scrim and the sheet, padding with no offset', () => {
      renderSheet();
      const avoiding = keyboardView();
      expect(avoiding.props.testID).toBe('sheet-root');
      expect(avoiding.props.behavior).toBe('padding');
      expect(avoiding.props.keyboardVerticalOffset).toBeUndefined();
      expect(flat('sheet-root')).toMatchObject({ flex: 1, justifyContent: 'flex-end' });
      expect(
        avoiding.findAll(
          (node: { props: { testID?: string } }) => node.props.testID === 'sheet-content'
        )
      ).not.toHaveLength(0);
      expect(
        avoiding.findAll(
          (node: { props: { testID?: string } }) => node.props.testID === 'sheet-scrim'
        )
      ).not.toHaveLength(0);
    });

    // The root's frame is the whole screen, so the padding it takes is exactly the keyboard's
    // height and the sheet rests on the keyboard's top edge.
    it('lifts the sheet by the keyboard’s height, on iOS', async () => {
      renderSheet();
      await act(async () => {
        fireEvent(screen.getByTestId('sheet-root'), 'layout', {
          persist: () => undefined,
          nativeEvent: { layout: { x: 0, y: 0, width: 393, height: 852 } }
        });
      });
      expect(flat('sheet-root').paddingBottom).toBe(0);

      await act(async () => {
        DeviceEventEmitter.emit('keyboardWillShow', keyboardEvent(852 - 336, 336));
      });
      expect(flat('sheet-root').paddingBottom).toBe(336);

      await act(async () => {
        DeviceEventEmitter.emit('keyboardWillHide', keyboardEvent(852, 0));
      });
      expect(flat('sheet-root').paddingBottom).toBe(0);
    });

    // The keyboard covers the home indicator, so the sheet on it keeps only its 20.
    it('drops its bottom padding to 20 while the keyboard is up, on iOS', () => {
      renderSheet();
      expect(flat('sheet-content').paddingBottom).toBe(34 + 8);

      act(() => {
        DeviceEventEmitter.emit('keyboardWillShow', keyboardEvent(852 - 336, 336));
      });
      expect(flat('sheet-content').paddingBottom).toBe(20);

      act(() => {
        DeviceEventEmitter.emit('keyboardWillHide', keyboardEvent(852, 0));
      });
      expect(flat('sheet-content').paddingBottom).toBe(34 + 8);
    });

    // Held to 80 % of the space above the keyboard, delete's field was clipped by about 6pt above
    // its actions at the largest text size. A percentage resolves inside the root's padding — the
    // keyboard's height below, the top inset above — so 100 % is the whole space between them.
    it('may take all the space above the keyboard, below the top inset, while it is up', () => {
      renderSheet({ actions: <Text>Delete Account</Text> });
      expect(flat('sheet-content').maxHeight).toBe('80%');
      expect(flat('sheet-root').paddingTop).toBeUndefined();

      act(() => {
        DeviceEventEmitter.emit('keyboardWillShow', keyboardEvent(852 - 336, 336));
      });
      expect(flat('sheet-content').maxHeight).toBe('100%');
      expect(flat('sheet-root').paddingTop).toBe(47);

      act(() => {
        DeviceEventEmitter.emit('keyboardWillHide', keyboardEvent(852, 0));
      });
      expect(flat('sheet-content').maxHeight).toBe('80%');
      expect(flat('sheet-root').paddingTop).toBeUndefined();
    });

    it('is always on, on iOS', () => {
      const platform = jest.replaceProperty(Platform, 'OS', 'ios');
      try {
        renderSheet();
        expect(keyboardView().props.enabled).toBe(true);
      } finally {
        platform.restore();
      }
    });

    // Android's `keyboardDidHide` reports the visible frame's height, not its bottom, so a view left
    // on after the keyboard had gone would keep the status bar's height of padding under the sheet.
    it('is on only while the keyboard is up, and pads 20 meanwhile, on Android', () => {
      const platform = jest.replaceProperty(Platform, 'OS', 'android');
      try {
        renderSheet();
        expect(keyboardView().props.behavior).toBe('padding');
        expect(keyboardView().props.enabled).toBe(false);
        expect(flat('sheet-content').paddingBottom).toBe(34 + 8);

        act(() => {
          DeviceEventEmitter.emit('keyboardDidShow', keyboardEvent(500, 300));
        });
        expect(keyboardView().props.enabled).toBe(true);
        expect(flat('sheet-content').paddingBottom).toBe(20);

        act(() => {
          DeviceEventEmitter.emit('keyboardDidHide', keyboardEvent(800, 0));
        });
        expect(keyboardView().props.enabled).toBe(false);
        expect(flat('sheet-content').paddingBottom).toBe(34 + 8);
      } finally {
        platform.restore();
      }
    });

    it('stops listening to the keyboard once it unmounts', () => {
      const listeners = () =>
        ['keyboardWillShow', 'keyboardWillHide'].map((event) =>
          DeviceEventEmitter.listenerCount(event)
        );
      const before = listeners();
      const { unmount } = renderSheet();
      expect(listeners()).not.toEqual(before);

      unmount();
      expect(listeners()).toEqual(before);
    });

    it('pads 8 above the home indicator, never under 20, and 20 on the keyboard', () => {
      expect(getSheetBottomPadding(34, false)).toBe(42);
      expect(getSheetBottomPadding(0, false)).toBe(20);
      expect(getSheetBottomPadding(34, true)).toBe(20);
      expect(getSheetBottomPadding(0, true)).toBe(20);
    });
  });
});

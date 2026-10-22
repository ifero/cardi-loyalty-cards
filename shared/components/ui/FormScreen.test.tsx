/**
 * FormScreen — the form pattern (Story 22.6).
 *
 * Rendered through the real `StoryDecorator` stack, because the ground, the title and the footer's
 * hairline are theme roles and only the real `ThemeProvider` flips them. The decorator also supplies
 * a deterministic 34pt bottom inset, which the footer must NOT add a second time.
 */
import { readFileSync } from 'fs';

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import React from 'react';
import {
  DeviceEventEmitter,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text
} from 'react-native';

import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { FormField, FormScreen, type FormScreenHandle } from './FormScreen';
import { HeaderIconButton } from './HeaderIconButton';
import { PrimaryActionFooter } from './PrimaryActionFooter';
import { ScreenHeader } from './ScreenHeader';
import { TextField } from './TextField';

type Scheme = 'light' | 'dark';
type FormScreenProps = React.ComponentProps<typeof FormScreen>;

const onBack = jest.fn();
const onSave = jest.fn();

const renderForm = (props: Partial<FormScreenProps> = {}, scheme: Scheme = 'light') => {
  const element = (overrides: Partial<FormScreenProps> = {}) => (
    <StoryDecorator theme={scheme}>
      <FormScreen
        title="New Card"
        onBack={onBack}
        primaryAction={{ label: 'Done', onPress: onSave, testID: 'done-button' }}
        bodyTestID="form-body"
        {...props}
        {...overrides}
      >
        <TextField label="Store name" value="" onChangeText={jest.fn()} testID="store-name" />
        <FormField label="Card color" testID="color-field">
          <Text>swatches</Text>
        </FormField>
      </FormScreen>
    </StoryDecorator>
  );
  const view = render(element());
  return {
    ...view,
    rerenderWith: (overrides: Partial<FormScreenProps>) => view.rerender(element(overrides))
  };
};

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

/** The nearest composite ancestor of a node rendered by the component `type`. */
const ancestorOfType = (testID: string, type: unknown) => {
  let node = screen.getByTestId(testID).parent;
  while (node && node.type !== type) {
    node = node.parent;
  }
  return node;
};

/** Whether the node with this testID sits inside the one with `ancestorTestID`. */
const isInside = (testID: string, ancestorTestID: string) => {
  const ancestor = screen.getByTestId(ancestorTestID);
  let node = screen.getByTestId(testID).parent;
  while (node) {
    if (node === ancestor) return true;
    node = node.parent;
  }
  return false;
};

/** The nearest host view that holds the node with this testID. */
const hostParentOf = (testID: string) => {
  let node = screen.getByTestId(testID).parent;
  while (node && typeof node.type !== 'string') {
    node = node.parent;
  }
  return node;
};

describe('FormScreen', () => {
  describe('the ground', () => {
    it.each<[Scheme, string]>([
      ['light', LIGHT_THEME.background],
      ['dark', DARK_THEME.background]
    ])('is the %s background under every inset', (scheme, hex) => {
      renderForm({}, scheme);
      const root = screen.getByTestId('form-screen');
      expect(StyleSheet.flatten(root.props.style).backgroundColor).toBe(hex);
      expect(root.props.edges).toEqual({
        top: 'additive',
        right: 'additive',
        bottom: 'additive',
        left: 'additive'
      });
    });
  });

  /**
   * The frame: header, body and footer stacked in that order. The ground and the keyboard-avoiding
   * view fill the screen, and the body's content and its fields grow into the height left, so a
   * state with nothing to submit centres in the space below the header.
   */
  describe('the layout', () => {
    it('stacks the header, the body and the footer, top to bottom', () => {
      renderForm();
      const tree = JSON.stringify(screen.toJSON());
      const header = tree.indexOf('"form-screen-header"');
      const body = tree.indexOf('"form-body"');
      const footer = tree.indexOf('"form-screen-footer"');
      expect(header).toBeGreaterThan(-1);
      expect(header).toBeLessThan(body);
      expect(body).toBeLessThan(footer);
    });

    it('fills the screen, the body’s content and its fields growing into the height left', () => {
      renderForm();
      expect(flat('form-screen').flex).toBe(1);
      expect(
        StyleSheet.flatten(screen.UNSAFE_getByType(KeyboardAvoidingView).props.style).flex
      ).toBe(1);
      expect(
        StyleSheet.flatten(screen.getByTestId('form-body').props.contentContainerStyle).flexGrow
      ).toBe(1);
      expect(flat('form-screen-fields').flexGrow).toBe(1);
    });
  });

  describe('the header', () => {
    it('titles the screen as its heading, centred, and lets it wrap rather than clip', () => {
      renderForm();
      const title = screen.getByText('New Card');
      expect(title.props.accessibilityRole).toBe('header');
      expect(title.props.numberOfLines).toBeUndefined();
      expect(StyleSheet.flatten(title.props.style)).toMatchObject({
        fontFamily: 'Inter',
        fontSize: 17,
        fontWeight: '600',
        textAlign: 'center',
        flex: 1
      });
    });

    it.each<[Scheme, string]>([
      ['light', LIGHT_THEME.textPrimary],
      ['dark', DARK_THEME.textPrimary]
    ])('sets the title in textPrimary in %s', (scheme, hex) => {
      renderForm({}, scheme);
      expect(StyleSheet.flatten(screen.getByText('New Card').props.style).color).toBe(hex);
    });

    it('has a back chevron named "Go back" that calls onBack', () => {
      renderForm({ backTestID: 'setup-back-button' });
      const back = screen.getByTestId('setup-back-button');
      expect(back.props.accessibilityLabel).toBe('Go back');
      expect(screen.UNSAFE_getByType(HeaderIconButton).props.icon).toBe(ChevronLeft);

      fireEvent.press(back);
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('names the back from its own testID when given none', () => {
      renderForm();
      expect(screen.getByTestId('form-screen-back')).toBeTruthy();
    });

    // Story 22.7: the header is the shared one settings draws too, under the form's own testIDs.
    it('draws the shared ScreenHeader, keeping the form’s testIDs', () => {
      renderForm({ backTestID: 'setup-back-button' });
      expect(screen.UNSAFE_getByType(ScreenHeader).props).toMatchObject({
        title: 'New Card',
        onBack,
        testID: 'form-screen-header',
        titleTestID: 'form-screen-title',
        backTestID: 'setup-back-button'
      });
      expect(screen.getByTestId('form-screen-title')).toBe(screen.getByText('New Card'));
    });

    // Story 22.9 — the auth screens' heading leads their body, so their header holds the back alone.
    it('holds the back alone when the heading leads the body, with no title', () => {
      renderForm({ title: undefined, openingBlock: <Text>Welcome Back</Text> });
      expect(screen.getByTestId('form-screen-header')).toBeTruthy();
      expect(screen.queryByTestId('form-screen-title')).toBeNull();
      expect(screen.UNSAFE_getByType(ScreenHeader).props.title).toBeUndefined();

      fireEvent.press(screen.getByTestId('form-screen-back'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    // New password after recovery begun from Home is alone on the stack: no back, no header row.
    it('draws no header row at all with neither a title nor a back', () => {
      renderForm({ title: undefined, onBack: undefined });
      expect(screen.queryByTestId('form-screen-header')).toBeNull();
      expect(screen.queryByTestId('form-screen-back')).toBeNull();
      expect(screen.UNSAFE_queryByType(ScreenHeader)).toBeNull();
      // The body starts at the top inset: the keyboard-avoiding view is the ground's first child.
      const [first] = screen.getByTestId('form-screen').children;
      expect(typeof first === 'string' ? first : first?.type).toBe(KeyboardAvoidingView);
    });

    // Capture frame A's header: at least 48, no rule, the chevron's stroke on the 24pt margin
    // (12pt to the glyph inside its 48pt target, then 9 − 0.75 to its ink), a 48pt spacer opposite.
    it('is at least 48 tall with no rule, its chevron’s stroke on the 24pt margin', () => {
      renderForm();
      const header = flat('form-screen-header');
      // `alignItems` centres the chevron and the title on one line; without it the title sits high.
      expect(header).toMatchObject({ flexDirection: 'row', alignItems: 'center', minHeight: 48 });
      expect(header.height).toBeUndefined();
      expect(header.paddingHorizontal).toBeCloseTo(24 - (12 + 9 - 0.75));
      expect(header.borderBottomWidth).toBeUndefined();
      expect(header.borderWidth).toBeUndefined();

      const children = screen.getByTestId('form-screen-header').children;
      const spacer = children[children.length - 1];
      expect(
        typeof spacer === 'string' ? undefined : StyleSheet.flatten(spacer?.props.style)
      ).toEqual({
        width: 48
      });
    });
  });

  /**
   * FormScreen imports nothing from `react-native-unistyles`, as this directory's pattern has it:
   * its geometry in React Native's `StyleSheet` and its colours from `useTheme()`. Story 22.7 moved
   * the header out without changing that.
   */
  it('stays outside what the Unistyles Babel plugin processes', () => {
    const subject = require.resolve('./FormScreen');
    expect(readFileSync(subject, 'utf8')).not.toMatch(
      /(?:\bfrom|\bimport|\brequire)\s*\(?\s*['"]react-native-unistyles/
    );
  });

  describe('the body', () => {
    it('scrolls, keeping taps that a field handles', () => {
      renderForm();
      const body = screen.getByTestId('form-body');
      expect(body.type).toBe('RCTScrollView');
      expect(body.props.keyboardShouldPersistTaps).toBe('handled');
    });

    // Top-aligned on 24pt margins, with no centring and no trailing padding beyond the 24.
    it('pads its content 24 on every side, top-aligned', () => {
      renderForm();
      const content = StyleSheet.flatten(
        screen.getByTestId('form-body').props.contentContainerStyle
      ) as Record<string, unknown>;
      expect(content).toMatchObject({
        paddingHorizontal: 24,
        paddingVertical: 24
      });
      expect(content.justifyContent).toBeUndefined();
      expect(content.alignItems).toBeUndefined();
      expect(content.paddingBottom).toBeUndefined();
    });

    it('sets the fields 32 apart, and a non-text field’s label 8 above its control', () => {
      renderForm();
      expect(flat('form-screen-fields').gap).toBe(32);
      expect(flat('color-field').gap).toBe(8);
      expect(StyleSheet.flatten(screen.getByText('Card color').props.style).textTransform).toBe(
        'uppercase'
      );
    });
  });

  /**
   * Story 22.9 — what leads the body: the auth screens' brand block. It comes first, above the
   * banner and the fields, and 32 above whichever of them comes first (frames A–F).
   */
  describe('the opening block', () => {
    const opening = <Text testID="brand-block">Welcome Back</Text>;

    it('leads the body, above the banner and the fields, 32 above them', () => {
      renderForm({ openingBlock: opening, requestError: 'Incorrect email or password.' });
      expect(ancestorOfType('form-screen-opening', ScrollView)).toBeTruthy();
      expect(flat('form-screen-opening').marginBottom).toBe(32);

      const tree = JSON.stringify(screen.toJSON());
      const block = tree.indexOf('"brand-block"');
      expect(block).toBeGreaterThan(-1);
      expect(block).toBeLessThan(tree.indexOf('"form-screen-banner"'));
      expect(tree.indexOf('"form-screen-banner"')).toBeLessThan(
        tree.indexOf('"form-screen-fields"')
      );
    });

    it('is not drawn when there is none', () => {
      renderForm();
      expect(screen.queryByTestId('form-screen-opening')).toBeNull();
    });
  });

  describe('a failed request', () => {
    const scrollTo = ScrollView.prototype.scrollTo as jest.Mock;

    it('draws no banner while there is none', () => {
      renderForm();
      expect(screen.queryByTestId('form-screen-banner')).toBeNull();
    });

    it('shows one banner, the first thing in the body, 16 above the first field', () => {
      renderForm({ requestError: 'Failed to add card' });
      expect(screen.getAllByText('Failed to add card')).toHaveLength(1);
      expect(flat('form-screen-banner-slot').marginBottom).toBe(16);

      // In the body, ahead of the fields.
      expect(ancestorOfType('form-screen-banner', ScrollView)).toBeTruthy();
      const tree = JSON.stringify(screen.toJSON());
      expect(tree.indexOf('"form-screen-banner"')).toBeGreaterThan(-1);
      expect(tree.indexOf('"form-screen-banner"')).toBeLessThan(
        tree.indexOf('"form-screen-fields"')
      );
    });

    // Validation stays on the field; a failed request never reddens one.
    it('reddens no field', () => {
      renderForm({ requestError: 'Failed to add card' });
      expect(flat('store-name').borderColor).toBe(LIGHT_THEME.border);
      expect(screen.queryByTestId('store-name-error')).toBeNull();
    });

    it('scrolls the body to the top to show it, each time a request fails', () => {
      const { rerenderWith } = renderForm();
      expect(scrollTo).not.toHaveBeenCalled();

      rerenderWith({ requestError: 'Failed to add card' });
      expect(scrollTo).toHaveBeenCalledTimes(1);
      expect(scrollTo).toHaveBeenLastCalledWith({ y: 0, animated: true });

      // The next press clears it while it saves; a second failure shows it, and scrolls, again.
      rerenderWith({ requestError: null });
      expect(screen.queryByTestId('form-screen-banner')).toBeNull();
      rerenderWith({ requestError: 'Failed to add card' });
      expect(screen.getByTestId('form-screen-banner')).toBeTruthy();
      expect(scrollTo).toHaveBeenCalledTimes(2);
    });

    it('names the banner as told', () => {
      renderForm({ requestError: 'Failed to add card', bannerTestID: 'server-error' });
      expect(screen.getByTestId('server-error')).toBeTruthy();
      expect(screen.queryByTestId('form-screen-banner')).toBeNull();
    });

    /**
     * Story 22.9 — below an opening block the banner is not at the top: a tall block, large text or
     * the keyboard can leave it below the fold. So a failure scrolls the body to the banner itself,
     * once it has been laid out, leaving it 24 below the body's top.
     */
    describe('below an opening block', () => {
      const layOutBanner = (y: number) =>
        fireEvent(screen.getByTestId('form-screen-banner-slot'), 'layout', {
          nativeEvent: { layout: { x: 24, y, width: 345, height: 78 } }
        });

      it('scrolls to the banner once it is laid out, not to the top', () => {
        const { rerenderWith } = renderForm({ openingBlock: <Text>Welcome Back</Text> });
        rerenderWith({ requestError: 'Incorrect email or password.' });
        expect(scrollTo).not.toHaveBeenCalled();

        layOutBanner(252);
        expect(scrollTo).toHaveBeenCalledTimes(1);
        expect(scrollTo).toHaveBeenLastCalledWith({ y: 252 - 24, animated: true });

        // A later layout of the same banner does not scroll the body again.
        layOutBanner(260);
        expect(scrollTo).toHaveBeenCalledTimes(1);
      });

      it('scrolls at once to a banner already laid out when its message changes', () => {
        const { rerenderWith } = renderForm({
          openingBlock: <Text>Welcome Back</Text>,
          requestError: 'Incorrect email or password.'
        });
        layOutBanner(252);
        expect(scrollTo).toHaveBeenCalledTimes(1);

        rerenderWith({ requestError: 'Unable to connect.' });
        expect(scrollTo).toHaveBeenCalledTimes(2);
        expect(scrollTo).toHaveBeenLastCalledWith({ y: 228, animated: true });
      });

      it('scrolls again for each new failure, measuring the new banner', () => {
        const { rerenderWith } = renderForm({
          openingBlock: <Text>Welcome Back</Text>,
          requestError: 'Incorrect email or password.'
        });
        layOutBanner(252);
        rerenderWith({ requestError: null });
        rerenderWith({ requestError: 'Incorrect email or password.' });
        expect(scrollTo).toHaveBeenCalledTimes(1);

        layOutBanner(300);
        expect(scrollTo).toHaveBeenCalledTimes(2);
        expect(scrollTo).toHaveBeenLastCalledWith({ y: 276, animated: true });
      });

      // Review pass 2: a field focused while the request ran would sit under the footer once the
      // body scrolls to the banner, so the keyboard goes first, each time a request fails.
      it('dismisses the keyboard before it scrolls to the banner when one of its fields holds it', () => {
        const dismiss = jest.spyOn(Keyboard, 'dismiss');
        try {
          const { rerenderWith } = renderForm({
            openingBlock: <Text>Welcome Back</Text>,
            keepFocusedFieldInView: true
          });
          fireEvent(screen.getByTestId('form-screen-field-0'), 'focus');
          expect(dismiss).not.toHaveBeenCalled();

          rerenderWith({ requestError: 'Incorrect email or password.' });
          expect(dismiss).toHaveBeenCalledTimes(1);
          layOutBanner(252);
          expect(dismiss.mock.invocationCallOrder[0]).toBeLessThan(
            scrollTo.mock.invocationCallOrder[0] ?? 0
          );

          // The dismissal blurs the field; the next failure finds the one focused again.
          fireEvent(screen.getByTestId('form-screen-field-0'), 'blur');
          fireEvent(screen.getByTestId('form-screen-field-1'), 'focus');
          rerenderWith({ requestError: 'Unable to connect.' });
          expect(dismiss).toHaveBeenCalledTimes(2);
          expect(dismiss.mock.invocationCallOrder[1]).toBeLessThan(
            scrollTo.mock.invocationCallOrder[1] ?? 0
          );
        } finally {
          dismiss.mockRestore();
        }
      });

      // Code-review loop, round 1: `Keyboard.dismiss()` blurs whichever input has the focus, and a
      // screen beneath a push still runs, so a request failing there must leave alone the keyboard
      // of the screen in front, whose field this form does not hold.
      it('leaves the keyboard alone when none of its fields holds the focus', () => {
        const dismiss = jest.spyOn(Keyboard, 'dismiss');
        try {
          const { rerenderWith } = renderForm({
            openingBlock: <Text>Welcome Back</Text>,
            keepFocusedFieldInView: true
          });

          rerenderWith({ requestError: 'Incorrect email or password.' });
          layOutBanner(252);
          expect(dismiss).not.toHaveBeenCalled();
          expect(scrollTo).toHaveBeenLastCalledWith({ y: 228, animated: true });

          // A field focused and then left, as when the person moved on to the screen in front.
          fireEvent(screen.getByTestId('form-screen-field-0'), 'focus');
          fireEvent(screen.getByTestId('form-screen-field-0'), 'blur');
          rerenderWith({ requestError: 'Unable to connect.' });
          expect(dismiss).not.toHaveBeenCalled();
          expect(scrollTo).toHaveBeenLastCalledWith({ y: 228, animated: true });
        } finally {
          dismiss.mockRestore();
        }
      });

      // Code-review loop, round 2: the field followed is not always the one focused. A refused
      // press reveals its first invalid field, which can be one that takes no focus, as the consent
      // row is.
      it('leaves the keyboard alone when the field followed is one the caller asked for', () => {
        const dismiss = jest.spyOn(Keyboard, 'dismiss');
        try {
          const form = React.createRef<FormScreenHandle>();
          const { rerenderWith } = renderForm({
            openingBlock: <Text>Welcome Back</Text>,
            keepFocusedFieldInView: true,
            ref: form
          });
          // The colour field, the second child, takes no focus.
          act(() => form.current?.bringFieldIntoView(1));

          rerenderWith({ requestError: 'Incorrect email or password.' });
          expect(dismiss).not.toHaveBeenCalled();
        } finally {
          dismiss.mockRestore();
        }
      });

      // The field the focus left can report its blur after the next one reports its focus; that
      // late blur leaves the focus where it went.
      it('dismisses the keyboard when the field it left blurs after the next takes the focus', () => {
        const dismiss = jest.spyOn(Keyboard, 'dismiss');
        try {
          const { rerenderWith } = renderForm({
            openingBlock: <Text>Welcome Back</Text>,
            keepFocusedFieldInView: true
          });
          fireEvent(screen.getByTestId('form-screen-field-0'), 'focus');
          fireEvent(screen.getByTestId('form-screen-field-1'), 'focus');
          fireEvent(screen.getByTestId('form-screen-field-0'), 'blur');

          rerenderWith({ requestError: 'Incorrect email or password.' });
          expect(dismiss).toHaveBeenCalledTimes(1);
        } finally {
          dismiss.mockRestore();
        }
      });
    });

    // Card setup and card edit have no opening block: their failure scrolls to the top, as it did.
    it('leaves the keyboard where it is without an opening block', () => {
      const dismiss = jest.spyOn(Keyboard, 'dismiss');
      try {
        const { rerenderWith } = renderForm();
        rerenderWith({ requestError: 'Failed to add card' });
        expect(scrollTo).toHaveBeenLastCalledWith({ y: 0, animated: true });
        expect(dismiss).not.toHaveBeenCalled();
      } finally {
        dismiss.mockRestore();
      }
    });
  });

  describe('the footer', () => {
    it('anchors the primary action under its hairline, outside the scroll', () => {
      renderForm();
      const button = screen.getByTestId('done-button');
      expect(ancestorOfType('done-button', PrimaryActionFooter)).toBeTruthy();
      expect(ancestorOfType('done-button', ScrollView)).toBeNull();
      expect(screen.getByTestId('form-screen-footer-rule')).toBeTruthy();
      expect(button.props.accessibilityLabel).toBe('Done');
    });

    // The SafeAreaView already pads the bottom inset, outside the keyboard-avoiding view: the
    // footer adds its 24 and not the decorator's 34 again.
    it('leaves the bottom inset to the ground', () => {
      renderForm();
      expect(ancestorOfType('done-button', PrimaryActionFooter)?.props.insetBottom).toBe(false);
    });

    it('is a large primary button, always enabled', () => {
      renderForm();
      const button = screen.getByTestId('done-button');
      expect(button.props.accessibilityState).toMatchObject({ disabled: false, busy: false });
      expect(flat('done-button-container').minHeight).toBe(52);
      expect(flat('done-button-container').backgroundColor).toBe(LIGHT_THEME.primary);

      fireEvent.press(button);
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    // Busy is not disabled: the fill stays, the label becomes a spinner, the name says so, and a
    // second press does nothing. Nothing else on the screen dims.
    it.each<[Scheme, string]>([
      ['light', LIGHT_THEME.primary],
      ['dark', DARK_THEME.primary]
    ])('keeps its %s fill while busy, named "Saving...", refusing presses', (scheme, fill) => {
      renderForm(
        { primaryAction: { label: 'Done', onPress: onSave, busy: true, testID: 'done-button' } },
        scheme
      );
      const button = screen.getByTestId('done-button');
      expect(screen.getByTestId('done-button-spinner')).toBeTruthy();
      expect(button.props.accessibilityLabel).toBe('Saving...');
      expect(button.props.accessibilityState).toMatchObject({ busy: true, disabled: false });
      expect(flat('done-button-container').backgroundColor).toBe(fill);

      fireEvent.press(button);
      expect(onSave).not.toHaveBeenCalled();

      expect(flat('form-screen').opacity).toBeUndefined();
      expect(flat('form-body').opacity).toBeUndefined();
      expect(flat('form-screen-fields').opacity).toBeUndefined();
      expect(flat('store-name').opacity).toBeUndefined();
    });

    it('is not drawn when there is nothing to submit', () => {
      renderForm({ primaryAction: undefined });
      expect(screen.queryByTestId('form-screen-footer')).toBeNull();
      expect(screen.UNSAFE_queryByType(PrimaryActionFooter)).toBeNull();
      expect(screen.getByText('New Card')).toBeTruthy();
    });

    // Story 22.9 — the busy name says what the button is doing, as the caller words it.
    it('is named as the caller says while busy, keeping its label otherwise', () => {
      const action = {
        label: 'Sign In',
        onPress: onSave,
        busyLabel: 'Signing in...',
        testID: 'sign-in-button'
      };
      const { rerenderWith } = renderForm({ primaryAction: action });
      expect(screen.getByTestId('sign-in-button').props.accessibilityLabel).toBe('Sign In');

      rerenderWith({ primaryAction: { ...action, busy: true } });
      expect(screen.getByTestId('sign-in-button').props.accessibilityLabel).toBe('Signing in...');
    });

    it('takes a name of its own when it differs from the label', () => {
      renderForm({
        primaryAction: {
          label: 'Send Reset Code',
          accessibilityLabel: 'Send password reset code',
          onPress: onSave,
          testID: 'send-reset-button'
        }
      });
      const button = screen.getByTestId('send-reset-button');
      expect(button.props.accessibilityLabel).toBe('Send password reset code');
      expect(screen.getByText('Send Reset Code')).toBeTruthy();
    });

    /**
     * Story 22.9 — the way out. Below a font scale of 1.5 it sits in the footer, under the primary
     * (decision 2); from 1.5 it closes the body instead, so the footer that rides the keyboard holds
     * the primary alone (decision 3). React Native's Jest mock reports a font scale of 2, so every
     * test here sets one.
     */
    describe('the way-out link', () => {
      let dimensions: jest.SpyInstance | undefined;
      const setFontScale = (fontScale: number) => {
        dimensions?.mockRestore();
        dimensions = jest
          .spyOn(Dimensions, 'get')
          .mockReturnValue({ width: 393, height: 852, scale: 3, fontScale });
      };
      const wayOut = <Text testID="way-out">Don’t have an account? Create one</Text>;

      afterEach(() => {
        dimensions?.mockRestore();
        dimensions = undefined;
      });

      it.each([1, 1.49])(
        'sits under the primary in the footer, 8 below it, at a font scale of %d',
        (fontScale) => {
          setFontScale(fontScale);
          renderForm({ footerLink: wayOut });
          expect(ancestorOfType('way-out', PrimaryActionFooter)).toBeTruthy();
          expect(ancestorOfType('way-out', ScrollView)).toBeNull();
          expect(screen.queryByTestId('form-screen-body-link')).toBeNull();

          const tree = JSON.stringify(screen.toJSON());
          expect(tree.indexOf('"done-button"')).toBeGreaterThan(-1);
          expect(tree.indexOf('"done-button"')).toBeLessThan(tree.indexOf('"way-out"'));

          // The footer's actions are 8 apart: the button, then the link.
          const actions = hostParentOf('way-out');
          expect(StyleSheet.flatten(actions?.props.style).gap).toBe(8);
          expect(actions?.children).toHaveLength(2);
        }
      );

      it.each([1.5, 2, 3.1])(
        'closes the body instead, 32 below the last field, at a font scale of %d',
        (fontScale) => {
          setFontScale(fontScale);
          renderForm({ footerLink: wayOut });
          expect(ancestorOfType('way-out', ScrollView)).toBeTruthy();
          expect(ancestorOfType('way-out', PrimaryActionFooter)).toBeNull();

          // The fields' last child, so the column's 32 sets it off from the last field.
          // Compared by testID: a failing comparison of two test instances crashes Jest's diff.
          expect(hostParentOf('form-screen-body-link')?.props.testID).toBe('form-screen-fields');
          expect(flat('form-screen-fields').gap).toBe(32);
          const tree = JSON.stringify(screen.toJSON());
          expect(tree.indexOf('"color-field"')).toBeLessThan(tree.indexOf('"way-out"'));
          expect(tree.indexOf('"way-out"')).toBeLessThan(tree.indexOf('"form-screen-footer"'));

          // The footer holds the primary alone.
          expect(hostParentOf('done-button')?.children).toHaveLength(1);
        }
      );

      it.each([1, 1.5])('is not drawn without a primary action, at a font scale of %d', (scale) => {
        setFontScale(scale);
        renderForm({ primaryAction: undefined, footerLink: wayOut });
        expect(screen.queryByTestId('way-out')).toBeNull();
        expect(screen.queryByTestId('form-screen-body-link')).toBeNull();
      });

      // Card setup and card edit pass no link: nothing moves for them at any size.
      it('leaves a form with no link as it was, at a font scale of 2', () => {
        setFontScale(2);
        renderForm();
        expect(screen.queryByTestId('form-screen-body-link')).toBeNull();
        expect(hostParentOf('done-button')?.children).toHaveLength(1);
      });
    });
  });

  /**
   * The body and the footer share one keyboard-avoiding view below the header, a direct child of
   * the full-screen ground, so the footer rests on the keyboard's top edge with no offset.
   */
  describe('the keyboard', () => {
    const keyboardView = () => screen.UNSAFE_getByType(KeyboardAvoidingView);

    it('holds the body and the footer, below the header, with no offset', () => {
      renderForm();
      const avoiding = keyboardView();
      expect(avoiding.props.behavior).toBe('padding');
      expect(avoiding.props.keyboardVerticalOffset).toBeUndefined();
      expect(avoiding.findByType(ScrollView)).toBeTruthy();
      expect(avoiding.findByType(PrimaryActionFooter)).toBeTruthy();
      // The header is outside it.
      expect(
        avoiding.findAll(
          (node: { props: { testID?: string } }) => node.props.testID === 'form-screen-header'
        )
      ).toHaveLength(0);
    });

    it('is always on, on iOS', () => {
      const platform = jest.replaceProperty(Platform, 'OS', 'ios');
      try {
        renderForm();
        expect(keyboardView().props.enabled).toBe(true);
      } finally {
        platform.restore();
      }
    });

    // Android's `keyboardDidHide` reports the visible frame's height, not its bottom, so a view left
    // on after the keyboard has gone would keep the status bar's height of padding under the footer.
    it('is on only while the keyboard is up, on Android', () => {
      const platform = jest.replaceProperty(Platform, 'OS', 'android');
      try {
        renderForm();
        // Android takes `padding` too — never no behaviour, and never `height` — with no offset.
        expect(keyboardView().props.behavior).toBe('padding');
        expect(keyboardView().props.keyboardVerticalOffset).toBeUndefined();
        expect(keyboardView().props.enabled).toBe(false);

        act(() => {
          DeviceEventEmitter.emit('keyboardDidShow', {
            endCoordinates: { screenX: 0, screenY: 500, width: 390, height: 300 }
          });
        });
        expect(keyboardView().props.enabled).toBe(true);

        act(() => {
          DeviceEventEmitter.emit('keyboardDidHide', {
            endCoordinates: { screenX: 0, screenY: 750, width: 390, height: 0 }
          });
        });
        expect(keyboardView().props.enabled).toBe(false);
      } finally {
        platform.restore();
      }
    });

    // The form's two listeners and the keyboard-avoiding view's leave with it, so a form that has
    // gone is not still listening under the screens after it. The count rising on mount shows it
    // sees keyboard listeners at all.
    it('stops listening to the keyboard once it unmounts, on Android', () => {
      const platform = jest.replaceProperty(Platform, 'OS', 'android');
      const listeners = () =>
        ['keyboardDidShow', 'keyboardDidHide'].map((event) =>
          DeviceEventEmitter.listenerCount(event)
        );
      try {
        const before = listeners();
        const { unmount } = renderForm();
        expect(listeners()).not.toEqual(before);

        unmount();
        expect(listeners()).toEqual(before);
      } finally {
        platform.restore();
      }
    });
  });

  /**
   * Story 22.9 — the focused field, with its label, brought into view above the footer. React Native
   * does nothing here (Fabric's iOS scroll view moves an input only with
   * `automaticallyAdjustKeyboardInsets`, and then above the keyboard, not above a footer that rides
   * it), so the form keeps its own geometry from layout and scroll events, which these tests feed.
   *
   * The body below is 300 tall; the fields' column starts 260 into the content, the first field
   * 74 tall at its top and the second at 106.
   */
  describe('the focused field', () => {
    const scrollTo = ScrollView.prototype.scrollTo as jest.Mock;

    const layout = (testID: string, y: number, height: number) =>
      fireEvent(screen.getByTestId(testID), 'layout', {
        nativeEvent: { layout: { x: 0, y, width: 345, height } }
      });
    const layOutForm = (bodyHeight = 300) => {
      layout('form-body', 0, bodyHeight);
      layout('form-screen-fields', 260, 180);
      layout('form-screen-field-0', 0, 74);
      layout('form-screen-field-1', 106, 74);
    };
    const scrollBodyTo = (y: number) =>
      fireEvent.scroll(screen.getByTestId('form-body'), {
        nativeEvent: { contentOffset: { x: 0, y } }
      });

    it('leaves the fields as they were when the caller does not ask for it', () => {
      renderForm();
      expect(screen.queryByTestId('form-screen-field-0')).toBeNull();
      const body = screen.getByTestId('form-body');
      expect(body.props.onScroll).toBeUndefined();
      expect(body.props.onLayout).toBeUndefined();
      expect(screen.getByTestId('form-screen-fields').props.onLayout).toBeUndefined();
    });

    it('holds each field in a wrapper of its own, skipping a field that is not there', () => {
      render(
        <StoryDecorator>
          <FormScreen title="Sign in" onBack={onBack} keepFocusedFieldInView bodyTestID="form-body">
            <TextField label="Email" value="" onChangeText={jest.fn()} testID="email" />
            {null}
            <TextField label="Password" value="" onChangeText={jest.fn()} testID="password" />
          </FormScreen>
        </StoryDecorator>
      );
      expect(isInside('email', 'form-screen-field-0')).toBe(true);
      expect(screen.queryByTestId('form-screen-field-1')).toBeNull();
      expect(isInside('password', 'form-screen-field-2')).toBe(true);
      // Still 32 apart: the wrappers are the column's children.
      expect(flat('form-screen-fields').gap).toBe(32);
    });

    it('brings a focused field below the body up until it sits 24 above the footer', () => {
      renderForm({ keepFocusedFieldInView: true });
      layOutForm();

      fireEvent(screen.getByTestId('form-screen-field-1'), 'focus');
      // Its top is 366 and its bottom 440: 440 + 24 − 300.
      expect(scrollTo).toHaveBeenCalledTimes(1);
      expect(scrollTo).toHaveBeenLastCalledWith({ y: 164, animated: true });
    });

    // Code-review loop, round 2: until the body is laid out nothing can be judged in view or not, so
    // nothing moves. The code screen focuses its field as it mounts.
    it('waits for the body to be laid out before it moves a focused field', () => {
      renderForm({ keepFocusedFieldInView: true });
      layout('form-screen-fields', 260, 180);
      layout('form-screen-field-0', 0, 74);
      fireEvent(screen.getByTestId('form-screen-field-0'), 'focus');
      expect(scrollTo).not.toHaveBeenCalled();

      layout('form-body', 0, 300);
      // Its bottom is 334: 334 + 24 − 300.
      expect(scrollTo).toHaveBeenCalledTimes(1);
      expect(scrollTo).toHaveBeenLastCalledWith({ y: 58, animated: true });
    });

    it('leaves a focused field that is already wholly in view where it is', () => {
      renderForm({ keepFocusedFieldInView: true });
      // The second field ends at 440, within the 450 the body shows.
      layOutForm(450);

      fireEvent(screen.getByTestId('form-screen-field-0'), 'focus');
      fireEvent(screen.getByTestId('form-screen-field-1'), 'focus');
      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('brings the focused field up when the keyboard leaves less of the body', () => {
      renderForm({ keepFocusedFieldInView: true });
      layOutForm(600);
      fireEvent(screen.getByTestId('form-screen-field-0'), 'focus');
      expect(scrollTo).not.toHaveBeenCalled();

      // The keyboard shows: the footer rides it, and the body above shrinks to 300.
      layout('form-body', 0, 300);
      expect(scrollTo).toHaveBeenLastCalledWith({ y: 334 + 24 - 300, animated: true });
    });

    it('brings a focused field above the visible body back down, 24 below its top', () => {
      renderForm({ keepFocusedFieldInView: true });
      layOutForm();
      scrollBodyTo(400);

      fireEvent(screen.getByTestId('form-screen-field-0'), 'focus');
      expect(scrollTo).toHaveBeenLastCalledWith({ y: 260 - 24, animated: true });
    });

    // Found on the 375pt simulator: iOS's strong-password panel left the body about 90 tall, and a
    // 24pt margin above the field pushed the bottom of its input under the footer.
    it('shows a field whole where the body cannot spare 24 on both sides, the margins shrunk evenly', () => {
      renderForm({ keepFocusedFieldInView: true });
      layOutForm(100);

      fireEvent(screen.getByTestId('form-screen-field-0'), 'focus');
      // 100 − 74 leaves 26: 13 above the field and 13 below it.
      expect(scrollTo).toHaveBeenLastCalledWith({ y: 260 - 13, animated: true });
    });

    it('shows the top of a field taller than the body, flush, where its label and input are', () => {
      renderForm({ keepFocusedFieldInView: true });
      layOutForm(100);
      layout('form-screen-field-0', 0, 160);
      expect(scrollTo).not.toHaveBeenCalled();

      fireEvent(screen.getByTestId('form-screen-field-0'), 'focus');
      expect(scrollTo).toHaveBeenLastCalledWith({ y: 260, animated: true });
    });

    // A message or a strength meter appearing under the focused field grows it.
    it('follows the focused field as it grows, and stops once it loses the focus', () => {
      renderForm({ keepFocusedFieldInView: true });
      layOutForm(500);
      fireEvent(screen.getByTestId('form-screen-field-1'), 'focus');
      expect(scrollTo).not.toHaveBeenCalled();

      layout('form-screen-field-1', 106, 200);
      // Its bottom is now 566: 566 + 24 − 500.
      expect(scrollTo).toHaveBeenLastCalledWith({ y: 90, animated: true });

      fireEvent(screen.getByTestId('form-screen-field-1'), 'blur');
      layout('form-body', 0, 200);
      layout('form-screen-field-1', 106, 260);
      expect(scrollTo).toHaveBeenCalledTimes(1);
    });

    // Only the focused field's own changes move the body: the banner appearing above the fields, or
    // another field changing, leave the banner's scroll alone.
    it('does not move the body when another field changes', () => {
      renderForm({ keepFocusedFieldInView: true });
      layOutForm(400);
      fireEvent(screen.getByTestId('form-screen-field-0'), 'focus');

      layout('form-screen-field-1', 106, 400);
      layout('form-screen-fields', 360, 600);
      expect(scrollTo).not.toHaveBeenCalled();
    });

    /**
     * Story 22.9, review pass 1 — a field the caller asks for, by its place among the children, by
     * the focused field's rule: how a refused press reveals its first invalid field. The colour
     * field, the second child, takes no focus, as the consent row takes none.
     */
    describe('a field the caller asks for', () => {
      /** Draws the form, keeping the focused field in view, and returns the caller's request. */
      const renderAsking = () => {
        const form = React.createRef<FormScreenHandle>();
        renderForm({ keepFocusedFieldInView: true, ref: form });
        return (index: number) => act(() => form.current?.bringFieldIntoView(index));
      };

      it('brings it up until it sits 24 above the footer, though it takes no focus', () => {
        const ask = renderAsking();
        layOutForm();

        ask(1);
        // Its bottom is 440: 440 + 24 − 300.
        expect(scrollTo).toHaveBeenCalledTimes(1);
        expect(scrollTo).toHaveBeenLastCalledWith({ y: 164, animated: true });
      });

      it('leaves it where it is when it is already wholly in view', () => {
        const ask = renderAsking();
        layOutForm(450);

        ask(1);
        expect(scrollTo).not.toHaveBeenCalled();
      });

      // A text field that already has the focus sends no focus event when focused again, so only
      // the request can bring it back once the body has been scrolled away from it.
      it('brings back a focused field that the body has been scrolled away from', () => {
        const ask = renderAsking();
        layOutForm(400);
        fireEvent(screen.getByTestId('form-screen-field-0'), 'focus');
        expect(scrollTo).not.toHaveBeenCalled();

        scrollBodyTo(400);
        ask(0);
        expect(scrollTo).toHaveBeenLastCalledWith({ y: 260 - 24, animated: true });
      });

      // The message the refused press brings lays the field out again, taller.
      it('keeps it in view as it grows, until another field takes the focus', () => {
        const ask = renderAsking();
        layOutForm(500);
        ask(1);
        expect(scrollTo).not.toHaveBeenCalled();

        layout('form-screen-field-1', 106, 200);
        // Its bottom is now 566: 566 + 24 − 500.
        expect(scrollTo).toHaveBeenLastCalledWith({ y: 90, animated: true });

        fireEvent(screen.getByTestId('form-screen-field-0'), 'focus');
        layout('form-screen-field-1', 106, 260);
        expect(scrollTo).toHaveBeenCalledTimes(1);
      });

      // Another field losing the focus, as the keyboard keeps the one it had, does not let it go.
      it('keeps it through another field’s blur', () => {
        const ask = renderAsking();
        layOutForm(500);
        fireEvent(screen.getByTestId('form-screen-field-0'), 'focus');
        ask(1);

        fireEvent(screen.getByTestId('form-screen-field-0'), 'blur');
        layout('form-screen-field-1', 106, 200);
        expect(scrollTo).toHaveBeenLastCalledWith({ y: 90, animated: true });
      });

      it('keeps it in view when the keyboard leaves the body less room', () => {
        const ask = renderAsking();
        layOutForm(600);
        ask(1);
        expect(scrollTo).not.toHaveBeenCalled();

        layout('form-body', 0, 300);
        expect(scrollTo).toHaveBeenLastCalledWith({ y: 164, animated: true });
      });
    });

    /**
     * Review pass 2 — a failed request's banner below an opening block takes the body: no field is
     * kept in view any more, the one asked for or the one focused, so neither the keyboard going nor
     * a field growing draws the body away from the banner.
     */
    it.each([
      ['asked for', (ask: (index: number) => void) => ask(1)],
      ['focused', () => fireEvent(screen.getByTestId('form-screen-field-1'), 'focus')]
    ])('keeps no field in view once a failure’s banner appears: the one %s', (_case, follow) => {
      const form = React.createRef<FormScreenHandle>();
      const { rerenderWith } = renderForm({
        keepFocusedFieldInView: true,
        openingBlock: <Text>Welcome Back</Text>,
        ref: form
      });
      layOutForm(500);
      follow((index) => act(() => form.current?.bringFieldIntoView(index)));
      expect(scrollTo).not.toHaveBeenCalled();

      rerenderWith({ requestError: 'Unable to connect.' });
      layout('form-screen-banner-slot', 252, 78);
      expect(scrollTo).toHaveBeenCalledTimes(1);
      expect(scrollTo).toHaveBeenLastCalledWith({ y: 228, animated: true });

      // The field grows below the body, and the keyboard going leaves the body taller.
      layout('form-screen-field-1', 106, 400);
      layout('form-body', 0, 600);
      expect(scrollTo).toHaveBeenCalledTimes(1);
    });
  });
});

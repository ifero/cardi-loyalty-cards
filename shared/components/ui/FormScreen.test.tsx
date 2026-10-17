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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text
} from 'react-native';

import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { FormField, FormScreen } from './FormScreen';
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
});

/**
 * DocumentScreen — the document ground help, the privacy policy and What We Collect draw (Story
 * 22.8).
 *
 * Rendered through the real `StoryDecorator`, because the ground and the title are theme roles and
 * only the real `ThemeProvider` flips them. The decorator also supplies a deterministic 34pt bottom
 * inset, which the body's padding takes.
 */
import { render, screen, userEvent } from '@testing-library/react-native';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { DocumentScreen } from './DocumentScreen';
import { HeaderIconButton } from './HeaderIconButton';
import { ScreenHeader } from './ScreenHeader';

type Scheme = 'light' | 'dark';
type DocumentProps = React.ComponentProps<typeof DocumentScreen>;

/** The decorator's bottom inset: its fallback metrics, a notched phone's 34pt. */
const BOTTOM_INSET = 34;

const renderDocument = (props: Partial<DocumentProps> = {}, scheme: Scheme = 'light') => {
  const onBack = props.onBack ?? jest.fn();
  render(
    <StoryDecorator theme={scheme}>
      <DocumentScreen title="Privacy Policy" bodyTestID="document-body" {...props} onBack={onBack}>
        <Text testID="document-content">Version 1.0.0 · Last updated: 2026-03-06</Text>
      </DocumentScreen>
    </StoryDecorator>
  );
  return { onBack };
};

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

const testIDOrder = (testIDs: string[]) => {
  const tree = JSON.stringify(screen.toJSON());
  return testIDs.map((testID) => tree.indexOf(`"${testID}"`));
};

describe('DocumentScreen', () => {
  describe('the ground', () => {
    it.each<[Scheme, string]>([
      ['light', LIGHT_THEME.background],
      ['dark', DARK_THEME.background]
    ])('is the %s background, filling the screen', (scheme, hex) => {
      renderDocument({}, scheme);
      expect(flat('document-screen')).toEqual({ flex: 1, backgroundColor: hex });
    });

    // The page scrolls on under the home indicator, so the bottom inset is the body's padding.
    it('sits under the top inset and the sides, but not the bottom', () => {
      renderDocument();
      expect(screen.getByTestId('document-screen').props.edges).toEqual({
        top: 'additive',
        right: 'additive',
        bottom: 'off',
        left: 'additive'
      });
    });
  });

  describe('the header', () => {
    it('draws the shared ScreenHeader, its parts named from the root’s testID', () => {
      const { onBack } = renderDocument({ testID: 'policy' });
      expect(screen.UNSAFE_getByType(ScreenHeader).props).toMatchObject({
        title: 'Privacy Policy',
        onBack,
        testID: 'policy-header',
        titleTestID: 'policy-title',
        backTestID: 'policy-back'
      });
    });

    it('names the title and the back as it is told', () => {
      renderDocument({ titleTestID: 'help-title', backTestID: 'help-back-button' });
      expect(screen.getByTestId('help-title')).toBe(screen.getByText('Privacy Policy'));
      expect(screen.getByTestId('help-back-button')).toBeTruthy();
      expect(screen.queryByTestId('document-screen-title')).toBeNull();
      expect(screen.queryByTestId('document-screen-back')).toBeNull();
    });

    // 17pt, as every stack-pushed screen's title is, over the frames' 24pt display title.
    it('titles the screen as its heading, in body-lg semibold', () => {
      renderDocument();
      const title = screen.getByRole('header', { name: 'Privacy Policy' });
      expect(title).toBe(screen.getByTestId('document-screen-title'));
      expect(StyleSheet.flatten(title.props.style)).toMatchObject({
        fontFamily: 'Inter',
        fontSize: 17,
        fontWeight: '600'
      });
    });

    it.each<[Scheme, string]>([
      ['light', LIGHT_THEME.textPrimary],
      ['dark', DARK_THEME.textPrimary]
    ])('sets the title in textPrimary in %s', (scheme, hex) => {
      renderDocument({}, scheme);
      expect(StyleSheet.flatten(screen.getByText('Privacy Policy').props.style).color).toBe(hex);
    });

    // Pressed through the button's own responder, as a finger does.
    it('has a back chevron named "Go back" that calls onBack', async () => {
      const { onBack } = renderDocument();
      const back = screen.getByTestId('document-screen-back');
      expect(back.props.accessibilityLabel).toBe('Go back');
      expect(screen.UNSAFE_getByType(HeaderIconButton).props.icon).toBe(ChevronLeft);

      await userEvent.press(back);
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    // Frames A–C: the header names the screen, and the body never repeats it.
    it('is the only place the title is drawn, above the body', () => {
      renderDocument();
      expect(screen.getAllByText('Privacy Policy')).toHaveLength(1);
      const order = testIDOrder(['document-screen-header', 'document-body', 'document-content']);
      expect(order.every((index) => index > -1)).toBe(true);
      expect([...order].sort((a, b) => a - b)).toEqual(order);
    });
  });

  describe('the body', () => {
    it('scrolls, holding the document', () => {
      renderDocument();
      const body = screen.getByTestId('document-body');
      expect(body.type).toBe('RCTScrollView');
      expect(
        screen.UNSAFE_getByType(ScrollView).findByProps({ testID: 'document-content' })
      ).toBeTruthy();
    });

    // 16 below the header, 24 at the sides, and 24 above the home indicator.
    it('pads its content 16 at the top, 24 at the sides and 24 plus the bottom inset', () => {
      renderDocument();
      expect(
        StyleSheet.flatten(screen.getByTestId('document-body').props.contentContainerStyle)
      ).toEqual({
        paddingTop: 16,
        paddingHorizontal: 24,
        paddingBottom: 24 + BOTTOM_INSET
      });
    });

    // No card, box or fill behind the document: the body scrolls on the ground itself.
    it('draws no box or fill of its own', () => {
      renderDocument();
      const body = screen.getByTestId('document-body');
      const drawn = [body.props.style, body.props.contentContainerStyle].flatMap((style) =>
        Object.keys((StyleSheet.flatten(style) ?? {}) as Record<string, unknown>).filter((key) =>
          /^(backgroundColor|border\w*(Width|Radius))$/.test(key)
        )
      );
      expect(drawn).toHaveLength(0);
    });

    // The wallet's and the brand list's rule: a press while the keyboard is up acts at once.
    it('lets a press act while the keyboard is up', () => {
      renderDocument();
      expect(screen.getByTestId('document-body').props.keyboardShouldPersistTaps).toBe('handled');
    });
  });
});

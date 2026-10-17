/**
 * ScreenHeader — the header a stack-pushed screen draws itself (Story 22.7, moved out of
 * `FormScreen`).
 *
 * Rendered through the real `StoryDecorator`, because the title's colour is the scheme's
 * `textPrimary` and only the real `ThemeProvider` flips it.
 */
import { readFileSync } from 'fs';
import { dirname, relative } from 'path';

import { act, render, screen, userEvent } from '@testing-library/react-native';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import React from 'react';
import { StyleSheet } from 'react-native';

import { changeAppLanguage } from '@/shared/i18n';
import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { HeaderIconButton } from './HeaderIconButton';
import { ScreenHeader } from './ScreenHeader';

type Scheme = 'light' | 'dark';
type HeaderProps = React.ComponentProps<typeof ScreenHeader>;

const renderHeader = (props: Partial<HeaderProps> = {}, scheme: Scheme = 'light') => {
  const onBack = props.onBack ?? jest.fn();
  render(
    <StoryDecorator theme={scheme}>
      <ScreenHeader title="Settings" testID="header" {...props} onBack={onBack} />
    </StoryDecorator>
  );
  return { onBack };
};

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

describe('ScreenHeader', () => {
  // The header is still mounted here, and re-renders in the language it is handed back.
  afterEach(async () => {
    await act(async () => {
      await changeAppLanguage('en');
    });
  });

  it('titles the screen as its heading, centred in body-lg semibold, wrapping rather than clipping', () => {
    renderHeader();
    const title = screen.getByText('Settings');
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
    renderHeader({}, scheme);
    expect(StyleSheet.flatten(screen.getByText('Settings').props.style).color).toBe(hex);
  });

  // Pressed through the button's own responder: `fireEvent.press` would climb to an `onPress` prop
  // above it and pass even if the chevron lost its handler.
  it('has a back chevron named "Go back" that calls onBack', async () => {
    const { onBack } = renderHeader();
    const back = screen.getByTestId('header-back');
    expect(back.props.accessibilityLabel).toBe('Go back');
    expect(screen.UNSAFE_getByType(HeaderIconButton).props.icon).toBe(ChevronLeft);

    await userEvent.press(back);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('names its back in the language the app speaks', async () => {
    await act(async () => {
      await changeAppLanguage('it');
    });
    renderHeader();
    expect(screen.getByTestId('header-back').props.accessibilityLabel).toBe('Torna indietro');
  });

  // Capture frame A's header: at least 48, no rule, the chevron's stroke on the 24pt margin (12pt to
  // the glyph inside its 48pt target, then 9 − 0.75 to its ink), a 48pt spacer opposite.
  it('is at least 48 tall with no rule, its chevron’s stroke on the 24pt margin', () => {
    renderHeader();
    const header = flat('header');
    expect(header).toMatchObject({ flexDirection: 'row', alignItems: 'center', minHeight: 48 });
    expect(header.height).toBeUndefined();
    expect(header.paddingHorizontal).toBeCloseTo(24 - (12 + 9 - 0.75));
    expect(header.borderBottomWidth).toBeUndefined();
    expect(header.borderWidth).toBeUndefined();
    expect(header.backgroundColor).toBeUndefined();

    const children = screen.getByTestId('header').children;
    const spacer = children[children.length - 1];
    expect(
      typeof spacer === 'string' ? undefined : StyleSheet.flatten(spacer?.props.style)
    ).toEqual({ width: 48 });
  });

  it('names its parts from its testID, or as it is told', () => {
    renderHeader({ titleTestID: 'custom-title', backTestID: 'custom-back' });
    expect(screen.getByTestId('custom-title')).toBeTruthy();
    expect(screen.getByTestId('custom-back')).toBeTruthy();
    expect(screen.queryByTestId('header-title')).toBeNull();
    expect(screen.queryByTestId('header-back')).toBeNull();
  });

  it('derives its parts’ testIDs when it is given none', () => {
    renderHeader();
    expect(screen.getByTestId('header-title')).toBeTruthy();
    expect(screen.getByTestId('header-back')).toBeTruthy();
  });

  // Capture frame A's header: the back on the left, then the title.
  it('puts the back before the title', () => {
    renderHeader();
    const tree = JSON.stringify(screen.toJSON());
    expect(tree.indexOf('"header-back"')).toBeGreaterThan(-1);
    expect(tree.indexOf('"header-back"')).toBeLessThan(tree.indexOf('"header-title"'));
  });
});

/**
 * Like `FormScreen` and `HeaderIconButton`, this file imports nothing from `react-native-unistyles`
 * (Story 22.7's task): it follows this directory's pattern, its geometry in React Native's
 * `StyleSheet` and its colours from `useTheme()`. Only an import, a re-export or a require counts;
 * its comments may name the package. It lives outside `app/` too, every file of which the Unistyles
 * Babel plugin processes.
 */
describe('ScreenHeader', () => {
  it('stays outside what the Unistyles Babel plugin processes', () => {
    const subject = require.resolve('./ScreenHeader');
    const repoRoot = dirname(require.resolve('@/package.json'));

    expect(relative(repoRoot, subject)).not.toMatch(/^app/);
    expect(readFileSync(subject, 'utf8')).not.toMatch(
      /(?:\bfrom|\bimport|\brequire)\s*\(?\s*['"]react-native-unistyles/
    );
  });
});

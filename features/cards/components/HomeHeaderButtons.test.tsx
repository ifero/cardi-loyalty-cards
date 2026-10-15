/**
 * HomeHeaderButtons — the Home header's `+` and gear (Story 22.2).
 *
 * Rendered through the real `StoryDecorator` stack, because the icon colour is the point of two of
 * these tests and only the real `ThemeProvider` flips it (ink in light, cream in dark). The guard
 * that keeps the native header's buttons out of the Unistyles plugin's reach covers this file and
 * `CardDetailHeader` at the end; `HeaderIconButton`'s own is beside it in `shared/components/ui/`.
 */
import { readFileSync } from 'fs';
import { dirname, relative } from 'path';

import { fireEvent, render, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import Plus from 'lucide-react-native/icons/plus';
import Settings from 'lucide-react-native/icons/settings';
import { StyleSheet } from 'react-native';

import { HeaderIconButton } from '@/shared/components/ui/HeaderIconButton';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { HomeAddButton, HomeSettingsButton } from './HomeHeaderButtons';

type Scheme = 'light' | 'dark';

const BUTTONS = [
  {
    name: 'HomeAddButton',
    Button: HomeAddButton,
    Glyph: Plus,
    testID: 'home-add-button',
    label: 'Add Card',
    route: '/add-card'
  },
  {
    name: 'HomeSettingsButton',
    Button: HomeSettingsButton,
    Glyph: Settings,
    testID: 'home-settings-button',
    label: 'Settings',
    route: '/settings'
  }
] as const;

const renderButton = (Button: () => React.JSX.Element, scheme: Scheme = 'light') =>
  render(
    <StoryDecorator theme={scheme}>
      <Button />
    </StoryDecorator>
  );

describe.each(BUTTONS)('$name', ({ Button, Glyph, testID, label, route }) => {
  it(`is a button named "${label}" that opens ${route}`, () => {
    renderButton(Button);
    const button = screen.getByLabelText(label);
    expect(button.props.accessibilityRole).toBe('button');

    fireEvent.press(button);
    expect(useRouter().push).toHaveBeenCalledWith(route);
  });

  it('is the shared header button, drawing its own glyph', () => {
    renderButton(Button);
    expect(screen.UNSAFE_getByType(HeaderIconButton).props).toMatchObject({ icon: Glyph, testID });
  });

  it('is a 48 × 48 touch target', () => {
    renderButton(Button);
    expect(StyleSheet.flatten(screen.getByTestId(testID).props.style)).toMatchObject({
      width: 48,
      height: 48
    });
  });

  // The icon is decorative — the button carries the name — so lucide hides it from assistive
  // technology, and the query has to look past that.
  const icon = () => screen.getByTestId(`${testID}-icon`, { includeHiddenElements: true });

  it.each<[Scheme, string]>([
    ['light', '#181824'],
    ['dark', '#F0F0E8']
  ])('draws a 24pt outline icon at a 1.5 stroke in textPrimary in %s', (scheme, hex) => {
    renderButton(Button, scheme);
    expect(icon().props).toMatchObject({
      width: 24,
      height: 24,
      fill: 'none',
      stroke: hex,
      strokeWidth: 1.5
    });
  });

  it('keeps the icon out of what a screen reader announces', () => {
    renderButton(Button);
    expect(icon().props['aria-hidden']).toBe('true');
  });

  // The design system's tap feedback: a 0.98× scale while held, back to rest on release.
  it('scales to 0.98 while pressed and back when released', () => {
    renderButton(Button);
    const button = screen.getByTestId(testID);
    const scale = () => StyleSheet.flatten(button.props.style).transform;

    expect(scale()).toBeUndefined();
    fireEvent(button, 'pressIn');
    expect(scale()).toEqual([{ scale: 0.98 }]);
    fireEvent(button, 'pressOut');
    expect(scale()).toBeUndefined();
  });
});

/**
 * Everything drawn inside the NATIVE header must keep React Native's own `Pressable`: the Unistyles
 * Babel plugin's remapped one re-binds the native view on every press, a visible flicker inside
 * the bar. The plugin processes every file whose path contains `<root>/app` and every file that
 * imports `react-native-unistyles` in any form, so each of these must stay outside both. Their own
 * comments may name the package; only an import, a re-export or a require counts.
 */
describe.each([
  ['HomeHeaderButtons', require.resolve('./HomeHeaderButtons')],
  ['CardDetailHeader', require.resolve('./CardDetailHeader')]
])('%s', (_name, subject) => {
  it('stays outside what the Unistyles Babel plugin processes', () => {
    const repoRoot = dirname(require.resolve('@/package.json'));

    // `^app`, not `^app/`: the plugin tests the path with `includes('<root>/app')`, a prefix.
    expect(relative(repoRoot, subject)).not.toMatch(/^app/);
    expect(readFileSync(subject, 'utf8')).not.toMatch(
      /(?:\bfrom|\bimport|\brequire)\s*\(?\s*['"]react-native-unistyles/
    );
  });
});

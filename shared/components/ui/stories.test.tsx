import { render } from '@testing-library/react-native';
import type { ComponentType } from 'react';

import * as ActionRowStories from './ActionRow.stories';
import * as BottomSheetStories from './BottomSheet.stories';
import * as ButtonStories from './Button.stories';
import * as CardShellStories from './CardShell.stories';
import * as ColorPickerStories from './ColorPicker.stories';
import * as FormScreenStories from './FormScreen.stories';
import * as HeaderIconButtonStories from './HeaderIconButton.stories';
import * as PrimaryActionFooterStories from './PrimaryActionFooter.stories';
import * as RequestErrorBannerStories from './RequestErrorBanner.stories';
import * as SectionHeaderStories from './SectionHeader.stories';
import * as SurfaceStories from './Surface.stories';
import * as TextFieldStories from './TextField.stories';
import * as TileStories from './Tile.stories';
import * as ToggleSwitchStories from './ToggleSwitch.stories';
import { StoryDecorator } from '../../../.storybook/StoryDecorator';

/**
 * Story smoke tests (Story 16.5).
 *
 * Storybook stories are Component Story Format (CSF) objects — plain data. These
 * tests import each stories module (type-only Storybook imports are erased by
 * babel, so no Storybook runtime is pulled into jest) and, for every story,
 * render it through the SAME decorator stack the Storybook preview uses, in both
 * light and dark. This validates AC1 (light/dark via ThemeProvider decorator)
 * and AC2 (a story module exists for each primitive — 7 at Story 16.5, 11 since Story 22.1
 * added the footer, section header, surface and tile, 14 since Story 22.6 added the form screen,
 * the request banner and the header icon button it moved here) inside the
 * existing test:coverage merge gate. The web-visual pipeline (build-storybook +
 * Chromatic) validates pixel-level rendering.
 */

type StoryObject = {
  args?: Record<string, unknown>;
};

type CsfModule = {
  default: {
    title?: string;
    component?: ComponentType<Record<string, unknown>>;
    args?: Record<string, unknown>;
  };
} & Record<string, unknown>;

const modules: Record<string, CsfModule> = {
  Button: ButtonStories as unknown as CsfModule,
  TextField: TextFieldStories as unknown as CsfModule,
  ToggleSwitch: ToggleSwitchStories as unknown as CsfModule,
  CardShell: CardShellStories as unknown as CsfModule,
  ActionRow: ActionRowStories as unknown as CsfModule,
  ColorPicker: ColorPickerStories as unknown as CsfModule,
  BottomSheet: BottomSheetStories as unknown as CsfModule,
  // Story 22.1 — the design-system primitives the Epic 22 screens consume.
  PrimaryActionFooter: PrimaryActionFooterStories as unknown as CsfModule,
  SectionHeader: SectionHeaderStories as unknown as CsfModule,
  Surface: SurfaceStories as unknown as CsfModule,
  Tile: TileStories as unknown as CsfModule,
  // Story 22.6 — the form pattern, the banner a failed request takes in it, and the header's icon
  // button, which moved here from `features/cards` to be the pattern's back.
  FormScreen: FormScreenStories as unknown as CsfModule,
  RequestErrorBanner: RequestErrorBannerStories as unknown as CsfModule,
  HeaderIconButton: HeaderIconButtonStories as unknown as CsfModule
};

const getStories = (mod: CsfModule): [string, StoryObject][] =>
  Object.entries(mod).filter(
    ([name, value]) => name !== 'default' && typeof value === 'object' && value !== null
  ) as [string, StoryObject][];

const renderStory = (mod: CsfModule, story: StoryObject, theme: 'light' | 'dark') => {
  const Component = mod.default.component as ComponentType<Record<string, unknown>>;
  const args = { ...(mod.default.args ?? {}), ...(story.args ?? {}) };
  return render(
    <StoryDecorator theme={theme}>
      <Component {...args} />
    </StoryDecorator>
  );
};

const canvasBackground = (theme: 'light' | 'dark'): unknown => {
  const { getByTestId } = render(
    <StoryDecorator theme={theme}>
      <></>
    </StoryDecorator>
  );
  const style = getByTestId('story-canvas').props.style;
  const flat = Array.isArray(style) ? Object.assign({}, ...style) : style;
  return flat.backgroundColor;
};

describe('shared/components/ui stories', () => {
  // Deliberate, not incidental: Story 22.1 took this from 7 to 11, and Story 22.6 to 14. Adding a
  // primitive means adding its story module here AND raising this count in the same change.
  it('defines a story module for each of the 14 primitives (AC2)', () => {
    expect(Object.keys(modules)).toHaveLength(14);
  });

  Object.entries(modules).forEach(([name, mod]) => {
    describe(name, () => {
      it('exports a valid CSF default (meta)', () => {
        expect(typeof mod.default.title).toBe('string');
        expect(mod.default.component).toBeDefined();
      });

      it('exports at least one story', () => {
        expect(getStories(mod).length).toBeGreaterThan(0);
      });

      getStories(mod).forEach(([storyName, story]) => {
        it(`renders "${storyName}" in light and dark without throwing (AC1)`, () => {
          const light = renderStory(mod, story, 'light');
          expect(light.toJSON()).toBeTruthy();
          light.unmount();

          const dark = renderStory(mod, story, 'dark');
          expect(dark.toJSON()).toBeTruthy();
          dark.unmount();
        });
      });
    });
  });

  // Light is cream `#F0F0E8`, not white, since Story 21.2: white is reserved for
  // cards sitting ON the cream ground, so a white canvas would render every
  // surface primitive against the wrong ground. Dark was already `#000000`.
  it('flips the canvas background token with the theme (AC1)', () => {
    expect(canvasBackground('light')).toBe('#F0F0E8');
    expect(canvasBackground('dark')).toBe('#000000');
  });

  // Regression guard: a Storybook toolbar toggle RE-RENDERS the same decorator
  // instance with a new `theme` prop (it does not remount it). The scheme must
  // still flip on re-render, not only on a fresh mount.
  it('flips the theme on re-render, not just on fresh mount (AC1)', () => {
    const readBg = (view: ReturnType<typeof render>): unknown => {
      const style = view.getByTestId('story-canvas').props.style;
      const flat = Array.isArray(style) ? Object.assign({}, ...style) : style;
      return flat.backgroundColor;
    };

    const view = render(
      <StoryDecorator theme="light">
        <></>
      </StoryDecorator>
    );
    expect(readBg(view)).toBe('#F0F0E8');

    view.rerender(
      <StoryDecorator theme="dark">
        <></>
      </StoryDecorator>
    );
    expect(readBg(view)).toBe('#000000');
  });
});

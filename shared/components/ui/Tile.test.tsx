/**
 * Tile — the card tile primitive (Story 22.1, AC1 + AC3).
 *
 * Rendered through the real `StoryDecorator` stack, because the outline colours are the point of
 * half of these tests and only the real `ThemeProvider` flips them (#D6D6CB light, #3A3A48 dark).
 */
import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import {
  FavouriteBadge,
  TILE_PRESSED_SCALE,
  Tile,
  getHighlightBorder,
  getTileAppearance
} from './Tile';
import { StoryDecorator } from '../../../.storybook/StoryDecorator';

type Scheme = 'light' | 'dark';
type TileProps = React.ComponentProps<typeof Tile>;

// A wallet tile: it opens its card, so it is a button. The static tile is checked on its own below.
const BASE: TileProps = {
  fill: '#DB1F26',
  width: 171,
  height: 140,
  radius: 16,
  label: 'Esselunga',
  onPress: () => {},
  testID: 'tile'
};

const renderTile = (props: Partial<TileProps> = {}, scheme: Scheme = 'light') =>
  render(
    <StoryDecorator theme={scheme}>
      <Tile {...BASE} {...props}>
        <Text>mark</Text>
      </Tile>
    </StoryDecorator>
  );

const shell = () =>
  StyleSheet.flatten(screen.getByTestId('tile-shell').props.style) as Record<string, unknown>;

describe('Tile', () => {
  it('fills the tile with the colour it is given, exactly — it is content, not theme', () => {
    renderTile({ fill: '#FFCC00' });
    expect(shell().backgroundColor).toBe('#FFCC00');
  });

  it('applies the geometry it is given', () => {
    renderTile({ width: 156, height: 128, radius: 20 });
    expect(shell()).toMatchObject({ width: 156, height: 128, borderRadius: 20 });
  });

  // The name labels THIS tile, so it truncates at the tile's edges — not at whatever its parent
  // happens to be. Unbound, a centring parent sized the column to the longer of the two, and a
  // long name ran wider than a single enlarged tile instead of ellipsizing under it.
  it('is exactly as wide as the tile, so the name truncates at the tile', () => {
    renderTile({ width: 220, height: 180, radius: 20 });
    expect(StyleSheet.flatten(screen.getByTestId('tile').props.style)).toMatchObject({
      width: 220
    });
  });

  it('renders the mark inside the tile and the name below it, in label-bold on one line', () => {
    renderTile();
    expect(screen.getByText('mark')).toBeTruthy();
    const name = screen.getByText('Esselunga');
    expect(name.props.numberOfLines).toBe(1);
    expect(name.props.ellipsizeMode).toBe('tail');
    expect(StyleSheet.flatten(name.props.style)).toMatchObject({
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600'
    });
  });

  // The wallet frame sets the name 8pt below the tile; the 6 it replaced was off the 8pt grid.
  it('sets the name 8pt below the tile (Story 22.2)', () => {
    renderTile();
    expect(StyleSheet.flatten(screen.getByText('Esselunga').props.style).marginTop).toBe(8);
  });

  // AC3 — "Flat. No drop shadows anywhere." Checked in both schemes because the shadow this
  // replaces was light-mode only (`!isDark && styles.shadow`).
  it.each<Scheme>(['light', 'dark'])('draws no shadow and no elevation in %s (AC3)', (scheme) => {
    renderTile({}, scheme);
    const style = shell();
    for (const key of [
      'shadowColor',
      'shadowOffset',
      'shadowOpacity',
      'shadowRadius',
      'elevation'
    ]) {
      expect(style[key]).toBeUndefined();
    }
  });

  describe('outline — the hairline that took over the removed shadow', () => {
    it.each<[Scheme, string]>([
      ['light', '#D6D6CB'],
      ['dark', '#3A3A48']
    ])('outlines a light fill with the %s hairline so it does not dissolve', (scheme, hex) => {
      renderTile({ fill: '#FFFFFF' }, scheme);
      expect(shell()).toMatchObject({ borderWidth: 1, borderColor: hex });
    });

    it('outlines a near-black fill against the black ground in dark mode', () => {
      renderTile({ fill: '#000000' }, 'dark');
      expect(shell()).toMatchObject({ borderWidth: 1, borderColor: '#3A3A48' });
    });

    it('leaves a near-black fill unoutlined on the cream ground in light mode', () => {
      renderTile({ fill: '#000000' }, 'light');
      expect(shell().borderWidth).toBe(0);
    });

    it.each<Scheme>(['light', 'dark'])('leaves a mid-tone fill unoutlined in %s', (scheme) => {
      renderTile({ fill: '#DB1F26' }, scheme);
      expect(shell().borderWidth).toBe(0);
    });
  });

  // AC3 — "Tap feedback is a 0.98× scale, never a shadow bloom."
  it('scales to 0.98 while pressed and back when released (AC3)', () => {
    renderTile();
    const pressable = screen.getByTestId('tile');

    expect(shell().transform).toEqual([{ scale: 1 }]);
    fireEvent(pressable, 'pressIn');
    expect(shell().transform).toEqual([{ scale: TILE_PRESSED_SCALE }]);
    expect(TILE_PRESSED_SCALE).toBe(0.98);
    fireEvent(pressable, 'pressOut');
    expect(shell().transform).toEqual([{ scale: 1 }]);
  });

  // Pressed through the tile's own responder: `fireEvent.press` would climb to `Tile`'s `onPress`
  // prop and pass even if the Pressable lost it.
  it('calls onPress', async () => {
    const onPress = jest.fn();
    renderTile({ onPress });
    await userEvent.press(screen.getByTestId('tile'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is a button named by its label unless told otherwise', () => {
    renderTile({ accessibilityHint: 'Opens card details' });
    const pressable = screen.getByTestId('tile');
    expect(pressable.props.accessibilityRole).toBe('button');
    expect(pressable.props.accessibilityLabel).toBe('Esselunga');
    expect(pressable.props.accessibilityHint).toBe('Opens card details');
  });

  /**
   * Story 22.6 — card setup draws the brand's own wallet tile as a picture of the card it is about
   * to add. It is not a control there: given no `onPress`, the tile is no button and does not press,
   * and a screen reader reads it once, by its name, rather than its mark and its name in turn.
   */
  describe('without onPress', () => {
    const renderStatic = (props: Partial<TileProps> = {}) =>
      render(
        <StoryDecorator theme="light">
          <Tile {...BASE} {...props} onPress={undefined}>
            <Text>ES</Text>
          </Tile>
        </StoryDecorator>
      );

    it('is no button', () => {
      renderStatic();
      const tile = screen.getByTestId('tile');
      expect(tile.props.accessibilityRole).toBeUndefined();
      expect(tile.props.onPress).toBeUndefined();
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('does not press', () => {
      renderStatic();
      expect(screen.UNSAFE_queryByType(Pressable)).toBeNull();

      const tile = screen.getByTestId('tile');
      fireEvent(tile, 'pressIn');
      fireEvent(tile, 'touchStart');
      expect(shell().transform).toEqual([{ scale: 1 }]);
    });

    it('is one element, named by its label', () => {
      renderStatic();
      const tile = screen.getByTestId('tile');
      expect(tile.props.accessible).toBe(true);
      expect(tile.props.accessibilityLabel).toBe('Esselunga');
      expect(tile.props.accessibilityHint).toBeUndefined();
    });

    it('draws the same tile: the fill, the geometry, the mark and the name below', () => {
      renderStatic({ fill: '#FFFFFF' });
      expect(shell()).toMatchObject({
        width: 171,
        height: 140,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D6D6CB'
      });
      expect(StyleSheet.flatten(screen.getByTestId('tile').props.style)).toMatchObject({
        width: 171
      });
      expect(screen.getByText('ES')).toBeTruthy();
      expect(screen.getByText('Esselunga').props.numberOfLines).toBe(1);
    });
  });

  it('renders the badge slot inside the tile', () => {
    render(
      <StoryDecorator>
        <Tile {...BASE} badge={<FavouriteBadge size={24} inset={6} testID="badge" />} />
      </StoryDecorator>
    );
    expect(screen.getByTestId('badge')).toBeTruthy();
  });

  /**
   * Story 22.2 (#251 item 15) — the just-added ring plays once. The tile reports the end of its
   * ring, however it ends, so the wallet can clear the highlight and nothing replays it. The
   * Reanimated mock in `jest.setup.js` completes every animation at once, reporting
   * `finished: true`, and its `useSharedValue` keeps one value for the life of the tile, as the
   * real hook does — so a re-render cannot pass for a replay.
   */
  describe('the end of the highlight ring', () => {
    const reanimated: {
      withTiming: (...args: unknown[]) => unknown;
      cancelAnimation: (sharedValue: unknown) => void;
    } = jest.requireMock('react-native-reanimated');

    it('reports the end of the ring once, when the fade has finished', () => {
      const onHighlightEnd = jest.fn();
      const view = renderTile({ highlighted: true, onHighlightEnd });
      expect(onHighlightEnd).toHaveBeenCalledTimes(1);

      view.rerender(
        <StoryDecorator theme="light">
          <Tile {...BASE} highlighted onHighlightEnd={onHighlightEnd}>
            <Text>mark</Text>
          </Tile>
        </StoryDecorator>
      );
      expect(onHighlightEnd).toHaveBeenCalledTimes(1);
    });

    it('reports nothing for a tile that is not highlighted', () => {
      const onHighlightEnd = jest.fn();
      renderTile({ onHighlightEnd });
      expect(onHighlightEnd).not.toHaveBeenCalled();
    });

    // A caller that hands over a new function on each render must not restart the ring: that
    // would replay it, and push its end further out on every render.
    it('does not replay the ring when the callback changes identity', () => {
      const first = jest.fn();
      const second = jest.fn();
      const view = renderTile({ highlighted: true, onHighlightEnd: first });

      view.rerender(
        <StoryDecorator theme="light">
          <Tile {...BASE} highlighted onHighlightEnd={second}>
            <Text>mark</Text>
          </Tile>
        </StoryDecorator>
      );

      expect(first).toHaveBeenCalledTimes(1);
      expect(second).not.toHaveBeenCalled();
    });

    // An unmount cancels the ring (`useSharedValue` does it), and a cancelled ring reports
    // `finished: false`. That is still the end of the ring: left unreported, the highlight would
    // stay armed and the ring would replay on the next tile drawn with it.
    it('reports the end of a ring that was cut short', () => {
      const cutShort = jest
        .spyOn(reanimated, 'withTiming')
        .mockImplementation((value: unknown, _config: unknown, callback: unknown) => {
          (callback as ((finished: boolean) => void) | undefined)?.(false);
          return value;
        });
      try {
        const onHighlightEnd = jest.fn();
        renderTile({ highlighted: true, onHighlightEnd });
        expect(onHighlightEnd).toHaveBeenCalledTimes(1);
      } finally {
        cutShort.mockRestore();
      }
    });

    // A recycled cell: the tile now draws another card, so `highlighted` turns false mid-ring.
    // The ring is cancelled at once — Reanimated then calls its callback with `finished: false`,
    // which the `cancelAnimation` stand-in below does — and its end is reported.
    it('ends the ring at once, and reports it, when highlighted turns false mid-ring', () => {
      let pending: ((finished: boolean) => void) | undefined;
      const holdRing = jest
        .spyOn(reanimated, 'withTiming')
        .mockImplementation((value: unknown, _config: unknown, callback: unknown) => {
          pending = callback as (finished: boolean) => void;
          return value;
        });
      const cancel = jest.spyOn(reanimated, 'cancelAnimation').mockImplementation(() => {
        pending?.(false);
        pending = undefined;
      });
      // The spy is the mock's own `jest.fn`, and the previous test's tile unmounts — cancelling
      // its ring — after the shared `afterEach` has cleared the mocks, so start the count here.
      cancel.mockClear();
      try {
        const onHighlightEnd = jest.fn();
        const view = renderTile({ highlighted: true, onHighlightEnd });
        expect(onHighlightEnd).not.toHaveBeenCalled();

        view.rerender(
          <StoryDecorator theme="light">
            <Tile {...BASE} highlighted={false} onHighlightEnd={onHighlightEnd}>
              <Text>mark</Text>
            </Tile>
          </StoryDecorator>
        );

        expect(cancel).toHaveBeenCalledTimes(1);
        expect(onHighlightEnd).toHaveBeenCalledTimes(1);
      } finally {
        holdRing.mockRestore();
        cancel.mockRestore();
      }
    });
  });
});

describe('FavouriteBadge', () => {
  const badge = () =>
    StyleSheet.flatten(screen.getByTestId('badge').props.style) as Record<string, unknown>;

  // The plate is OPAQUE ink so the beam star survives every brand colour, Esselunga's #FFCC00
  // (three points from beam) included — the design system's AC9 amendment from Story 21.2.
  it('is an opaque, round ink plate carrying a beam star', () => {
    render(<FavouriteBadge size={24} inset={6} testID="badge" />);
    expect(badge()).toMatchObject({
      backgroundColor: '#181824',
      width: 24,
      height: 24,
      borderRadius: 12
    });
    expect(JSON.stringify(screen.toJSON())).toContain('#FCCC0C');
  });

  it('pins itself top-right by the inset it is given, so the caller owns the keep-out', () => {
    render(<FavouriteBadge size={24} inset={6} testID="badge" />);
    expect(badge()).toMatchObject({ position: 'absolute', top: 6, right: 6 });
  });
});

describe('getTileAppearance', () => {
  it.each([
    ['#000000', true, false, '#FFFFFF'],
    ['#181824', true, false, '#FFFFFF'],
    ['#DB1F26', false, false, '#181824'],
    ['#FFCC00', false, false, '#181824'],
    ['#FFFFFF', false, true, '#181824']
  ])('classifies %s (near-black %s, light %s) → %s glyphs', (fill, isNearBlack, isLight, fg) => {
    expect(getTileAppearance(fill)).toEqual({ isNearBlack, isLight, foreground: fg });
  });
});

describe('getHighlightBorder', () => {
  const resting = { borderWidth: 1, borderColor: '#D6D6CB' };

  it('draws the 3pt beam ring at the current opacity while it is fading', () => {
    expect(getHighlightBorder(0.5, resting)).toEqual({
      borderWidth: 3,
      borderColor: 'rgba(252, 204, 12, 0.5)'
    });
  });

  // A tile stays `highlighted` after its ring has faded — until its caller clears it from
  // `onHighlightEnd`, or for good if it never does — so once the ring has faded the tile must get its
  // resting outline BACK. Dropping to 0 erased a light brand's only edge — which the shadow used to
  // hide, and which is all that separates it from the ground now.
  it('hands back the resting outline once the ring has faded', () => {
    expect(getHighlightBorder(0, resting)).toEqual(resting);
  });
});

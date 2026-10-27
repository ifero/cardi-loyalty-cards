/**
 * OnboardingAnimation — Story 22.10. One test per I/O matrix row the player owns: it plays once and
 * rests (Welcome, First slide, New slide), rests once seen (Seen slide, Back to Welcome), shows the
 * last frame under Reduce Motion, picks the scheme's file (Dark, Scheme change), and keeps an empty
 * box when the file fails (Load failure).
 *
 * `lottie-react-native` is the `jest.setup.js` mock: a View carrying every prop the player is
 * given, plus its own `commands` (`play`, `reset`, `pause`, `resume`), the same functions its ref
 * receives. The player is decorative, so every query opts into hidden elements — and the one that
 * does not proves the hiding.
 */
import { act, render, screen } from '@testing-library/react-native';
import type { AnimationObject } from 'lottie-react-native';
import React from 'react';
import { AccessibilityInfo } from 'react-native';

import { OnboardingAnimation } from './OnboardingAnimation';

let mockIsDark = false;

jest.mock('@/shared/theme', () => ({
  useTheme: () => ({ theme: {}, isDark: mockIsDark })
}));

const reanimated = jest.requireMock<{ useReducedMotion: () => boolean }>('react-native-reanimated');

const HIDDEN = { includeHiddenElements: true } as const;

const file = (name: string, w = 280, h = 190): AnimationObject => ({
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: 120,
  w,
  h,
  nm: name,
  assets: [],
  layers: []
});

const LIGHT = file('drawing-light');
const DARK = file('drawing-dark');
const MARK = file('mark', 100, 100);

type Commands = Record<'play' | 'reset' | 'pause' | 'resume', jest.Mock>;

const player = () => screen.getByTestId('drawing-lottie', HIDDEN);
const commands = (): Commands => player().props.commands as Commands;
const shownFile = (): string => (player().props.source as AnimationObject).nm ?? '';

const tree = (active: boolean, light = LIGHT, dark = DARK) => (
  <OnboardingAnimation testID="drawing" light={light} dark={dark} active={active} />
);

/** The player as Welcome holds it: `rest` once the screen is left (decision 5). */
const restingTree = (active: boolean, rest: boolean) => (
  <OnboardingAnimation testID="drawing" light={LIGHT} dark={DARK} active={active} rest={rest} />
);

/** The native player reporting the end of its one play. */
const finish = (isCancelled = false) =>
  act(() => {
    player().props.onAnimationFinish(isCancelled);
  });

beforeEach(() => {
  mockIsDark = false;
  jest.restoreAllMocks();
});

describe('OnboardingAnimation', () => {
  describe('playing once', () => {
    it('plays its file once when it mounts active, never looping, from the first frame', () => {
      render(tree(true));

      expect(commands().play).toHaveBeenCalledTimes(1);
      expect(player()).toHaveProp('loop', false);
      expect(player()).toHaveProp('autoPlay', false);
      expect(player()).toHaveProp('progress', 0);
    });

    it('rests on its last frame when the play finishes, and plays nothing more', () => {
      const { rerender } = render(tree(true));
      finish();

      expect(player()).toHaveProp('progress', 1);

      rerender(tree(true));
      expect(commands().play).toHaveBeenCalledTimes(1);
    });

    it('waits, on its first frame, until it turns active', () => {
      const { rerender } = render(tree(false));

      expect(commands().play).not.toHaveBeenCalled();
      expect(player()).toHaveProp('progress', 0);

      rerender(tree(true));
      expect(commands().play).toHaveBeenCalledTimes(1);
    });

    it('stays on its last frame when it turns active again after playing (decision 1)', () => {
      const { rerender } = render(tree(true));
      finish();

      rerender(tree(false));
      rerender(tree(true));

      expect(commands().play).toHaveBeenCalledTimes(1);
      expect(player()).toHaveProp('progress', 1);
    });

    it('settles on its last frame when it turns inactive mid-play, and never replays', () => {
      const { rerender } = render(tree(true));

      rerender(tree(false));
      expect(player()).toHaveProp('progress', 1);

      rerender(tree(true));
      expect(commands().play).toHaveBeenCalledTimes(1);
      expect(player()).toHaveProp('progress', 1);
    });

    it('rests when the native player reports a cancelled play', () => {
      render(tree(true));
      finish(true);

      expect(player()).toHaveProp('progress', 1);
    });
  });

  describe('resting for good', () => {
    it('rests on its last frame, without playing, when told to rest before it has played', () => {
      const { rerender } = render(restingTree(false, false));

      rerender(restingTree(false, true));
      expect(player()).toHaveProp('progress', 1);

      rerender(restingTree(true, false));
      expect(commands().play).not.toHaveBeenCalled();
      expect(player()).toHaveProp('progress', 1);
    });

    it('rests mid-play when told to while still active, and never replays', () => {
      const { rerender } = render(restingTree(true, false));
      expect(commands().play).toHaveBeenCalledTimes(1);

      rerender(restingTree(true, true));
      expect(player()).toHaveProp('progress', 1);

      rerender(restingTree(true, false));
      expect(commands().play).toHaveBeenCalledTimes(1);
      expect(player()).toHaveProp('progress', 1);
    });

    it('never plays when it mounts told to rest, even active', () => {
      render(restingTree(true, true));

      expect(commands().play).not.toHaveBeenCalled();
      expect(player()).toHaveProp('progress', 1);
    });
  });

  describe('Reduce Motion', () => {
    it('shows the last frame at once and never plays, even when active', () => {
      jest.spyOn(reanimated, 'useReducedMotion').mockReturnValue(true);
      const { rerender } = render(tree(false));

      expect(player()).toHaveProp('progress', 1);

      rerender(tree(true));
      expect(commands().play).not.toHaveBeenCalled();
      expect(player()).toHaveProp('progress', 1);
    });
  });

  describe('the scheme', () => {
    it('takes the light file in light', () => {
      render(tree(true));
      expect(shownFile()).toBe('drawing-light');
    });

    it('takes the dark file in dark', () => {
      mockIsDark = true;
      render(tree(true));
      expect(shownFile()).toBe('drawing-dark');
    });

    it('takes the one file in both schemes when it serves both, as the mark does', () => {
      const { rerender } = render(tree(true, MARK, MARK));
      const playing = commands();
      expect(shownFile()).toBe('mark');

      mockIsDark = true;
      rerender(tree(true, MARK, MARK));

      expect(shownFile()).toBe('mark');
      // The same player, still playing: a file that does not change is neither remounted nor
      // stopped.
      expect(commands()).toBe(playing);
      expect(player()).toHaveProp('progress', 0);
    });

    it('mounts the new file on its last frame after a play', () => {
      const { rerender } = render(tree(true));
      finish();

      mockIsDark = true;
      rerender(tree(true));

      expect(shownFile()).toBe('drawing-dark');
      expect(player()).toHaveProp('progress', 1);
      expect(commands().play).not.toHaveBeenCalled();
    });

    it('mounts the new file on its last frame when it changes mid-play', () => {
      const { rerender } = render(tree(true));

      mockIsDark = true;
      rerender(tree(true));

      expect(shownFile()).toBe('drawing-dark');
      expect(player()).toHaveProp('progress', 1);
      expect(commands().play).not.toHaveBeenCalled();
    });

    it('mounts the new file on its first frame before a play, and plays it when it turns active', () => {
      const { rerender } = render(tree(false));

      mockIsDark = true;
      rerender(tree(false));
      expect(shownFile()).toBe('drawing-dark');
      expect(player()).toHaveProp('progress', 0);

      rerender(tree(true));
      expect(commands().play).toHaveBeenCalledTimes(1);
    });
  });

  describe('the box', () => {
    it("is the file's own size, so the drawing is drawn 1:1", () => {
      render(tree(true));
      expect(screen.getByTestId('drawing', HIDDEN)).toHaveStyle({ width: 280, height: 190 });

      render(<OnboardingAnimation testID="mark" light={MARK} dark={MARK} active />);
      expect(screen.getByTestId('mark', HIDDEN)).toHaveStyle({ width: 100, height: 100 });
    });

    it('is hidden from assistive technology on both platforms', () => {
      render(tree(true));

      const box = screen.getByTestId('drawing', HIDDEN);
      expect(box).toHaveProp('accessibilityElementsHidden', true);
      expect(box).toHaveProp('importantForAccessibility', 'no-hide-descendants');
      // …and the hiding takes effect: a query that respects it cannot reach the drawing.
      expect(screen.queryByTestId('drawing')).toBeNull();
      expect(screen.queryByTestId('drawing-lottie')).toBeNull();
    });

    it('stays, empty and at its size, when the file fails to load', () => {
      const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
      render(tree(true));

      expect(() =>
        act(() => {
          player().props.onAnimationFailure('Unable to create the lottie animation');
        })
      ).not.toThrow();

      expect(announce).not.toHaveBeenCalled();
      expect(screen.queryByTestId('drawing-lottie', HIDDEN)).toBeNull();
      expect(screen.getByTestId('drawing', HIDDEN)).toHaveStyle({ width: 280, height: 190 });
    });

    it('tries the other file again after a failure when the scheme changes', () => {
      const { rerender } = render(tree(false));
      act(() => {
        player().props.onAnimationFailure('Unable to create the lottie animation');
      });

      mockIsDark = true;
      rerender(tree(false));

      expect(shownFile()).toBe('drawing-dark');
    });
  });
});

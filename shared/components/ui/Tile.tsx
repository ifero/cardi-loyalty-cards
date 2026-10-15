import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useTheme } from '@/shared/theme';
import { IDENTITY_COLORS, toRgbChannels } from '@/shared/theme/colors';
import { getLuminance } from '@/shared/theme/luminance';
import { TYPOGRAPHY } from '@/shared/theme/typography';

/** Above this luminance a fill is "light": it takes a hairline so it does not dissolve into the ground. */
const LIGHT_FILL_THRESHOLD = 0.85;

/**
 * Below this luminance a fill is "near-black": its glyphs flip to white, and in dark mode it takes
 * an outline against the black ground. 0.2 rather than the 0.5 `getContrastForeground` uses, because
 * this decides the colour of a mark sitting on ~85 % of the tile, not of text on a header.
 */
const NEAR_BLACK_THRESHOLD = 0.2;

/** Tap feedback — the design system's 0.98× scale, never a shadow bloom (§ Elevation). */
export const TILE_PRESSED_SCALE = 0.98;

/** The just-added ring: 3pt of beam, fading out after half a second. */
const HIGHLIGHT_WIDTH = 3;
const HIGHLIGHT_HOLD_MS = 500;
const HIGHLIGHT_FADE_MS = 1500;

/** The favourite star as a share of its plate — 16 on the design system's 24pt plate. */
const STAR_TO_PLATE = 2 / 3;

/**
 * Beam as `r, g, b`, so the highlight ring can animate its alpha on the UI thread. Every token is a
 * 6-digit hex by contract, and splitting the token here keeps the ring tied to it — it used to be
 * Material Green 500, a colour in no palette, which is how a literal survives four design reviews.
 */
const HIGHLIGHT_RGB = toRgbChannels(IDENTITY_COLORS.beam);

export type TileAppearance = {
  /** Takes the hairline outline in either scheme. */
  isLight: boolean;
  /** Takes white glyphs, and an outline in dark mode. */
  isNearBlack: boolean;
  /** The colour for the mark and any glyph drawn straight on the fill. */
  foreground: string;
};

/**
 * How a fill must be finished to stay legible — the design system's card-tile legibility rules, in
 * one place so the tile's outline and the caller's glyph colour cannot disagree about a colour.
 *
 * The dark branch is `#FFFFFF` rather than cream on purpose: this runs over ~45 brand colours and
 * the card accents, so it is a legibility decision on somebody else's colour, not a theme one.
 */
export const getTileAppearance = (fill: string): TileAppearance => {
  const luminance = getLuminance(fill);
  const isNearBlack = luminance < NEAR_BLACK_THRESHOLD;
  return {
    isLight: luminance > LIGHT_FILL_THRESHOLD,
    isNearBlack,
    foreground: isNearBlack ? '#FFFFFF' : IDENTITY_COLORS.ink
  };
};

type Border = { borderWidth: number; borderColor: string };

/**
 * The tile's border while `highlighted`: the fading beam ring, then the resting outline.
 *
 * A tile can stay `highlighted` after its ring has faded — until the caller clears it from
 * `onHighlightEnd`, or for good if it never does — so once the ring has faded this must hand the
 * RESTING outline back rather than drop to none. It used to drop to 0, which erased a light brand's
 * hairline; the light-mode shadow hid that, and with the shadow gone (AC3) the hairline is the only
 * thing separating a white tile from the cream ground.
 */
export const getHighlightBorder = (opacity: number, resting: Border): Border => {
  'worklet';
  return opacity > 0
    ? { borderWidth: HIGHLIGHT_WIDTH, borderColor: `rgba(${HIGHLIGHT_RGB}, ${opacity})` }
    : resting;
};

type TileProps = {
  /**
   * The card's own colour — a brand hex, or a custom card's accent. It is CONTENT, so it is drawn
   * exactly as given: never tinted, washed or recoloured, and never a theme token.
   */
  fill: string;
  width: number;
  height: number;
  /** Fixed by design; it does not scale with the tile. */
  radius: number;
  /** The card name, set in `label-bold` BELOW the tile — never inside it. */
  label: string;
  /** The mark inside the tile: a brand logo, or a fallback plate. */
  children?: React.ReactNode;
  /** An overlay pinned inside the tile above the mark — the `FavouriteBadge`. */
  badge?: React.ReactNode;
  /** The just-added beam ring, fading out. It plays when this turns true. */
  highlighted?: boolean;
  /**
   * Called once, when the ring has ended: run out, cut short by an unmount, or stopped by
   * `highlighted` turning false. A caller that clears `highlighted` here makes the ring play
   * exactly once: a remount, a scroll back or a recycled cell finds it cleared.
   */
  onHighlightEnd?: () => void;
  /**
   * Makes the tile a button, with the 0.98× press. Without it the tile is a picture of a card, not a
   * control — card setup's preview (Story 22.6): no button role and no press, read once by its name.
   */
  onPress?: () => void;
  /** Defaults to `label`. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
};

/**
 * The card tile (`cardi-design-system.md` § _Card tile_): the core component, and the one surface
 * whose colour the app does not choose.
 *
 * Flat by rule — depth is the fill plus a 1pt hairline, never a shadow — with a 0.98× press. A light
 * fill takes the hairline in both schemes; a near-black fill takes it only against the black ground.
 * Geometry comes from the caller, because the wallet derives it from the viewport
 * (`features/cards/utils/gridLayout.ts`) and this primitive must not freeze it again.
 */
export const Tile = ({
  fill,
  width,
  height,
  radius,
  label,
  children,
  badge,
  highlighted = false,
  onHighlightEnd,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  testID
}: TileProps) => {
  const { theme, isDark } = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  const { isLight, isNearBlack } = getTileAppearance(fill);

  const isOutlined = isLight || (isDark && isNearBlack);
  const resting: Border = {
    borderWidth: isOutlined ? 1 : 0,
    borderColor: isOutlined ? theme.border : 'transparent'
  };

  const highlightOpacity = useSharedValue(highlighted ? 1 : 0);

  // Read through a ref so the ring below depends only on `highlighted`: a caller passing a new
  // function on every render must not restart the ring, which would also postpone its end.
  const onHighlightEndRef = useRef(onHighlightEnd);
  useEffect(() => {
    onHighlightEndRef.current = onHighlightEnd;
  }, [onHighlightEnd]);

  useEffect(() => {
    if (!highlighted) {
      return undefined;
    }
    // A plain function, so the animation callback hands it back to the JS thread, where it
    // reads the latest callback from the ref.
    const notifyHighlightEnd = () => onHighlightEndRef.current?.();
    highlightOpacity.value = 1;
    highlightOpacity.value = withDelay(
      HIGHLIGHT_HOLD_MS,
      // However the ring ends — run out, or cut short by an unmount or by the cleanup below — it
      // has ended, and an end left unreported would leave the highlight armed to replay.
      withTiming(0, { duration: HIGHLIGHT_FADE_MS }, () => {
        scheduleOnRN(notifyHighlightEnd);
      })
    );
    // `highlighted` turning false — a recycled cell now drawing another card — ends the ring at
    // once, rather than letting it run on and later clear a highlight a re-drawn tile is showing.
    return () => {
      cancelAnimation(highlightOpacity);
    };
  }, [highlighted, highlightOpacity]);

  const highlightStyle = useAnimatedStyle(() =>
    getHighlightBorder(highlightOpacity.value, resting)
  );

  const content = (
    <>
      <Animated.View
        testID={testID ? `${testID}-shell` : undefined}
        style={[
          styles.shell,
          {
            width,
            height,
            borderRadius: radius,
            backgroundColor: fill,
            ...resting,
            transform: [{ scale: isPressed ? TILE_PRESSED_SCALE : 1 }]
          },
          highlighted && highlightStyle
        ]}
      >
        {children}
        {badge}
      </Animated.View>

      <Text
        style={[styles.label, { color: theme.textPrimary }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {label}
      </Text>
    </>
  );

  // The column is the tile's width, so the name below truncates at the tile it labels.
  const column = { width };

  if (!onPress) {
    // One element named by the card: the mark and the name below it are not read separately.
    return (
      <View
        testID={testID}
        accessible
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        style={column}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      style={column}
    >
      {content}
    </Pressable>
  );
};

type FavouriteBadgeProps = {
  /** Plate diameter — 24pt in the design system. */
  size: number;
  /** Distance from the tile's top and right edges. */
  inset: number;
  testID?: string;
};

/**
 * A favourite: a beam star on an OPAQUE ink plate, pinned top-right. Opaque is load-bearing —
 * Esselunga is `#FFCC00`, three points from beam, and the plate is the only thing between the star
 * and the tile people open most — and ink rather than white so it survives a light brand too.
 *
 * Size and inset are props rather than constants here because the wallet owns them: its
 * `gridLayout` keep-out caps the fallback plates against exactly these two numbers, so they must
 * come from the same place the arithmetic reads.
 */
export const FavouriteBadge = ({ size, inset, testID }: FavouriteBadgeProps) => (
  <View
    testID={testID}
    style={[
      styles.badge,
      { top: inset, right: inset, width: size, height: size, borderRadius: size / 2 }
    ]}
  >
    <MaterialIcons
      name="star"
      size={Math.round(size * STAR_TO_PLATE)}
      color={IDENTITY_COLORS.beam}
    />
  </View>
);

const styles = StyleSheet.create({
  shell: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  label: {
    ...TYPOGRAPHY.labelBold,
    textAlign: 'center',
    // The wallet frame's tile-to-name gap; 6 was off the 8pt grid (Story 22.2).
    marginTop: 8,
    paddingHorizontal: 2
  },
  badge: {
    position: 'absolute',
    backgroundColor: IDENTITY_COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center'
  }
});

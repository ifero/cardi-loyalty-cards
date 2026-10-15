import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Text } from 'react-native';

import { MONOGRAM_TEXT_PROPS, monogram } from '@/shared/theme/typography';

import { FavouriteBadge, Tile, getTileAppearance } from './Tile';

/** A stand-in mark in the colour the tile's own legibility rules pick for the fill. */
const mark = (fill: string, letters: string) => (
  <Text
    {...MONOGRAM_TEXT_PROPS}
    style={{ ...monogram(36), color: getTileAppearance(fill).foreground }}
  >
    {letters}
  </Text>
);

/** The wallet's badge geometry (`features/cards/utils/gridLayout.ts`): 24pt, 6pt in. */
const favourite = <FavouriteBadge size={24} inset={6} />;

const meta = {
  title: 'UI/Tile',
  component: Tile,
  args: {
    fill: '#DA291C',
    width: 171,
    height: 140,
    radius: 16,
    label: 'Conad',
    children: mark('#DA291C', 'CO'),
    // A wallet tile opens its card. Without a press the tile is the static preview (`Static`).
    onPress: () => {}
  }
} satisfies Meta<typeof Tile>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Brand: Story = {};

/** Esselunga's #FFCC00 is three points from beam: the opaque ink plate is what keeps the star. */
export const Favourite: Story = {
  args: { fill: '#FFCC00', label: 'Esselunga', children: mark('#FFCC00', 'ES'), badge: favourite }
};

/** A very light brand takes the hairline so it does not dissolve into the cream ground. */
export const LightBrand: Story = {
  args: { fill: '#FFFFFF', label: 'CRAI', children: mark('#FFFFFF', 'CR') }
};

/** A near-black brand: white glyphs, and an outline against the black ground in dark mode. */
export const NearBlackBrand: Story = {
  args: { fill: '#000000', label: 'Zara', children: mark('#000000', 'ZA') }
};

/** A custom card: no brand, so one of the five accents with a first-letter avatar. */
export const CustomCard: Story = {
  args: { fill: '#0C84CC', label: 'Gym', children: mark('#0C84CC', 'G') }
};

/** The single-card wallet: the enlarged 220 × 180 tile at a 20pt radius. */
export const Enlarged: Story = {
  args: { width: 220, height: 180, radius: 20, badge: favourite }
};

/** Card setup's preview of the card being added: no press, no button role, read once by its name. */
export const Static: Story = {
  args: { fill: '#FFCC00', label: 'Esselunga', children: mark('#FFCC00', 'ES'), onPress: undefined }
};

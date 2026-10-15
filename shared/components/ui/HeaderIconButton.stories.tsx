import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Star from 'lucide-react-native/icons/star';

import { IDENTITY_COLORS } from '@/shared/theme/colors';

import { HeaderIconButton } from './HeaderIconButton';

/**
 * A header's icon button: a 48 × 48 target holding a 24pt Lucide icon at a 1.5 stroke, in
 * `textPrimary` unless told otherwise, with the 0.98× press. The form pattern's back, Home's `+`
 * and gear, and card detail's back and favourite star are all this one.
 */
const meta = {
  title: 'UI/HeaderIconButton',
  component: HeaderIconButton,
  args: {
    icon: ChevronLeft,
    label: 'Go back',
    onPress: () => {},
    testID: 'header-icon-button'
  }
} satisfies Meta<typeof HeaderIconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The back chevron, as the form pattern's header draws it. */
export const Back: Story = {};

/** A favourite: the star filled through `fill`, the one state an outline cannot show. */
export const FavouriteStar: Story = {
  args: {
    icon: Star,
    label: 'Favorite',
    color: IDENTITY_COLORS.beam,
    fill: IDENTITY_COLORS.beam,
    accessibilityState: { selected: true }
  }
};

/** A glyph in the colour its caller hands it, as card detail does on a card's own field. */
export const CustomColor: Story = {
  args: { icon: Star, label: 'Favorite', color: IDENTITY_COLORS.beam }
};

/** Disabled: the target refuses presses, and says so to assistive technology. */
export const Disabled: Story = {
  args: { disabled: true }
};

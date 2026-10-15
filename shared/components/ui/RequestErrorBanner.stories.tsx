import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { RequestErrorBanner } from './RequestErrorBanner';

const meta = {
  title: 'UI/RequestErrorBanner',
  component: RequestErrorBanner,
  args: {
    message: 'Failed to add card'
  }
} satisfies Meta<typeof RequestErrorBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A failed add: the surface card, the 1pt error outline and the sentence — nothing else. */
export const AddFailed: Story = {};

export const UpdateFailed: Story = { args: { message: 'Failed to update card' } };

/** A long message wraps inside the card rather than clipping. */
export const LongMessage: Story = {
  args: {
    message: 'Unable to connect. Check your internet connection and try again in a moment.'
  }
};

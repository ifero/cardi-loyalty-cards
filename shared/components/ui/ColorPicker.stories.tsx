import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { ColorPicker } from './ColorPicker';

/**
 * The form frame's picker (Story 22.6): the logo's bars in order — red, deep blue, azure, green,
 * yellow — each a 48pt disc. The selected one takes a 2pt `primary` ring held off it by a 2pt gap in
 * `background`, and a check in its contrast foreground. One story per selection, in bar order.
 */
const meta = {
  title: 'UI/ColorPicker',
  component: ColorPicker,
  args: {
    value: 'blue',
    onChange: () => {}
  }
} satisfies Meta<typeof ColorPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Red: Story = { args: { value: 'red' } };

/** The default selection, in setup's custom form (frame 1). */
export const Blue: Story = { args: { value: 'blue' } };

/** The `grey` key, which draws azure (Story 21.2a). */
export const Grey: Story = { args: { value: 'grey' } };

export const Green: Story = { args: { value: 'green' } };

/** The `orange` key, which draws yellow — the one swatch whose check is ink, not white. */
export const Orange: Story = { args: { value: 'orange' } };

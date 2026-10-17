import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { ScreenHeader } from './ScreenHeader';

/**
 * The header a stack-pushed screen draws itself — settings, and the form pattern's. At least 48
 * tall with no rule: the back chevron's stroke on the 24pt margin, the title centred in `body-lg`
 * semibold, a 48pt spacer on the right.
 */
const meta = {
  title: 'UI/ScreenHeader',
  component: ScreenHeader,
  args: {
    title: 'Settings',
    onBack: () => {}
  }
} satisfies Meta<typeof ScreenHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Settings' header. */
export const Default: Story = {};

/** A title too long for one line wraps, and the header grows rather than clipping it. */
export const LongTitle: Story = {
  args: { title: 'Informativa sulla privacy e dati raccolti' }
};

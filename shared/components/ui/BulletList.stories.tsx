import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { BulletList } from './BulletList';

/**
 * A bulleted list, with the document frames' hanging indent: the glyph 18 in, the text 32 in, and
 * a wrapped line under the text rather than under the bullet. `body-md`, items 8 apart.
 */
const meta = {
  title: 'UI/BulletList',
  component: BulletList,
  args: {
    tone: 'default',
    items: [
      'Email address — used for authentication and account recovery.',
      'Loyalty card data — card names, barcode values, barcode formats, brand references, and usage metadata (favourite status, usage count, timestamps).',
      'Consent records — whether and when you accepted this Privacy Policy.'
    ]
  }
} satisfies Meta<typeof BulletList>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The privacy policy's prose: ink, and a long item wrapping under its own text. */
export const Prose: Story = {};

/** An FAQ answer's steps: muted. */
export const Steps: Story = {
  args: {
    tone: 'muted',
    items: ['Open the main screen', 'Tap Add Card', 'Choose Scan Barcode or Add Manually']
  }
};

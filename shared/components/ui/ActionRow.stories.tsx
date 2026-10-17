import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { ActionRow } from './ActionRow';

const meta = {
  title: 'UI/ActionRow',
  component: ActionRow,
  args: {
    label: 'Account',
    onPress: () => {}
  }
} satisfies Meta<typeof ActionRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: 'Account' } };

export const WithSubtitle: Story = {
  args: { label: 'Language', subtitle: 'Choose your preferred language' }
};

export const WithValue: Story = { args: { label: 'Language', value: 'English' } };

export const Destructive: Story = {
  args: { label: 'Delete account', destructive: true, showChevron: false }
};

/** Busy: the spinner in the chevron's place, the row otherwise as it was, and presses ignored. */
export const Loading: Story = { args: { label: 'Syncing…', isLoading: true } };

/** Settings' row: padded 12 / 16, the value in muted ink, the 24 / 1.5 chevron. */
export const Plain: Story = {
  args: { label: 'Export Data', value: 'JSON', variant: 'plain', showBottomBorder: false }
};

/** No action: information, not a control — no chevron, no press, at full strength. */
export const Information: Story = {
  args: {
    label: 'App Version',
    value: '1.4.0',
    variant: 'plain',
    showBottomBorder: false,
    onPress: undefined
  }
};

/** A label too long for one line wraps beside a value cut at 46 % of the row. */
export const LongLabel: Story = {
  args: {
    label: 'Luminosità massima nei dettagli della carta',
    value: 'Sistema (Italiano), quando disponibile',
    variant: 'plain',
    showBottomBorder: false
  }
};

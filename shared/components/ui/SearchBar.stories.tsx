import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { SearchBar } from './SearchBar';

/**
 * The system's search field — the wallet's, the brand list's and help's. 48 tall, a `surface` fill
 * inside a 1pt hairline at the 12pt control radius, a magnifier at the left and a clear × once
 * there is something to clear; its outline turns `primary` while focused. Its copy defaults to the
 * wallet's, and another screen passes its own.
 */
const meta = {
  title: 'UI/SearchBar',
  component: SearchBar,
  args: {
    value: '',
    onChangeText: () => {},
    onClear: () => {}
  }
} satisfies Meta<typeof SearchBar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The wallet's field at rest: its placeholder, and no clear button. */
export const Default: Story = {};

/** A query typed: the clear × appears at the right. */
export const Filled: Story = {
  args: { value: 'Esselunga' }
};

/** Help's field, with help's own copy (Story 22.8). */
export const Help: Story = {
  args: {
    placeholder: 'Search help',
    accessibilityLabel: 'Search help',
    clearAccessibilityLabel: 'Clear search'
  }
};

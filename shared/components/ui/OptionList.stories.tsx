import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { OptionList } from './OptionList';

/**
 * The pick-one list, settings frame C: options edge to edge with a rule above each, the current one
 * checked in `primary`. Choosing is the action, so there are no buttons. Shown on its own here; in
 * the app it sits in a `BottomSheet`, whose 24pt margin its negative margin reaches past — see the
 * sheet's `PickOne` story.
 */
const meta = {
  title: 'UI/OptionList',
  component: OptionList,
  args: {
    options: [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
      { value: 'system', label: 'System' }
    ],
    selectedValue: 'system',
    onSelect: () => {}
  }
} satisfies Meta<typeof OptionList>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The theme picker's three, System checked. */
export const Theme: Story = {};

/** The language picker's three, English checked. */
export const Language: Story = {
  args: {
    options: [
      { value: 'system', label: 'System (English)' },
      { value: 'en', label: 'English' },
      { value: 'it', label: 'Italian' }
    ],
    selectedValue: 'en'
  }
};

/** A label too long for one line wraps, and its option grows with it. */
export const LongLabel: Story = {
  args: {
    options: [
      { value: 'short', label: 'Short' },
      { value: 'long', label: 'An option whose label is far too long to fit on a single line' }
    ],
    selectedValue: 'long'
  }
};

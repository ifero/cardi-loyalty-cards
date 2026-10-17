import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Text } from 'react-native';

import { useTheme } from '@/shared/theme';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { OptionList } from './OptionList';
import { RequestErrorBanner } from './RequestErrorBanner';
import { TextField } from './TextField';

/** The theme picker's helper, 20 below the last option, as frame C sets it. */
const Helper = () => {
  const { theme } = useTheme();
  return (
    <Text style={{ ...TYPOGRAPHY.captionMd, color: theme.textSecondary, marginTop: 20 }}>
      System uses your device&apos;s appearance setting
    </Text>
  );
};

const confirmActions = (busy = false) => (
  <>
    <Button variant="destructive" size="large" onPress={() => {}} loading={busy}>
      Sign Out
    </Button>
    <Button variant="secondary" size="large" onPress={() => {}}>
      Cancel
    </Button>
  </>
);

const meta = {
  title: 'UI/BottomSheet',
  component: BottomSheet,
  // The sheet slides in with Reanimated, which Chromatic cannot pause the way it pauses CSS. Under
  // reduced motion the sheet simply appears, so every snapshot is of the settled sheet.
  parameters: { chromatic: { prefersReducedMotion: 'reduce' } },
  args: {
    visible: true,
    title: 'Sort cards',
    description: 'Choose how your cards are ordered.',
    onClose: () => {},
    children: (
      <Button variant="primary" onPress={() => {}}>
        Got it
      </Button>
    )
  }
} satisfies Meta<typeof BottomSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const TitleOnly: Story = { args: { description: undefined } };

/**
 * Pick one (frame C): the options edge to edge, the current one checked, and no buttons — choosing
 * is the action. The theme and language pickers. Theme's helper is the list's footer, so it scrolls
 * with the options, as `ThemePickerSheet` passes it.
 */
export const PickOne: Story = {
  args: {
    title: 'Theme',
    description: undefined,
    children: (
      <OptionList
        options={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'system', label: 'System' }
        ]}
        selectedValue="system"
        onSelect={() => {}}
        footer={<Helper />}
      />
    )
  }
};

/**
 * Confirm (frame D): the destructive action is the borderless label, ABOVE the outlined Cancel —
 * the bordered control is the safe one. Sign out, delete's first step, export and the import
 * preview.
 */
export const Confirm: Story = {
  args: {
    title: 'Sign Out?',
    description: 'You will return to guest mode. Your cards will remain on this device.',
    children: undefined,
    actions: confirmActions()
  }
};

/** The request failed: one banner, the first thing in the content, and the sheet stays open. */
export const ConfirmFailed: Story = {
  name: 'Confirm, failed',
  args: {
    ...Confirm.args,
    children: <RequestErrorBanner message="Unable to sign out" />,
    actions: confirmActions()
  }
};

/** Busy: the pressed button keeps its look and shows a spinner; nothing else dims. */
export const ConfirmBusy: Story = {
  name: 'Confirm, busy',
  args: {
    ...Confirm.args,
    actions: confirmActions(true)
  }
};

/** Acknowledge (frame E): one primary OK. Nothing to export, and the import error. */
export const Acknowledge: Story = {
  args: {
    title: 'Nothing to Export',
    description: "You don't have any cards yet. Add your first card to export your data.",
    children: undefined,
    actions: (
      <Button variant="primary" size="large" onPress={() => {}}>
        OK
      </Button>
    )
  }
};

/**
 * Type to confirm (frame F), delete's second step: the labelled field, then Delete Account — the
 * one control the system draws disabled, live only once the keyword is typed.
 */
export const TypeToConfirm: Story = {
  name: 'Type to confirm',
  args: {
    title: 'Confirm Account Deletion',
    description: 'Type DELETE to confirm permanent account deletion.',
    children: <TextField label="Type DELETE to confirm" value="" onChangeText={() => {}} />,
    actions: (
      <>
        <Button variant="destructive" size="large" disabled onPress={() => {}}>
          Delete Account
        </Button>
        <Button variant="secondary" size="large" onPress={() => {}}>
          Cancel
        </Button>
      </>
    )
  }
};

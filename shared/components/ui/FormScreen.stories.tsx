import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import Camera from 'lucide-react-native/icons/camera';
import { Pressable, Text, View } from 'react-native';

import type { CardColor } from '@/core/schemas';

import { useTheme } from '@/shared/theme';
import { IDENTITY_COLORS } from '@/shared/theme/tokens.generated';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import { ColorPicker } from './ColorPicker';
import { FormField, FormScreen } from './FormScreen';
import { TextField } from './TextField';

/**
 * The scan button's look, for the story only: the real one is card setup's `InlineScanButton`, which
 * lives in `features/add-card` and is out of this directory's reach. 48 square, `surface` fill, a
 * 1pt `border` outline at the 12pt radius, a 24 / 1.5 camera in `textPrimary`.
 */
const ScanButtonStandIn = () => {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Scan barcode with camera"
      style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surface,
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Camera size={24} strokeWidth={1.5} color={theme.textPrimary} />
    </Pressable>
  );
};

type Fields = {
  storeName?: string;
  storeNameError?: string;
  cardNumber?: string;
  color?: CardColor;
};

/** Card setup's custom form, the drawn exemplar (frames 1–4). */
const customCardFields = ({
  storeName = '',
  storeNameError,
  cardNumber = '',
  color = 'blue'
}: Fields = {}) => [
  <TextField
    key="store-name"
    label="Store name"
    value={storeName}
    placeholder="Enter store name"
    maxLength={50}
    error={storeNameError}
    onChangeText={() => {}}
  />,
  <TextField
    key="card-number"
    label="Card number"
    value={cardNumber}
    placeholder="Enter or scan card number"
    mono
    trailing={<ScanButtonStandIn />}
    onChangeText={() => {}}
  />,
  <FormField key="color" label="Card Color">
    <ColorPicker value={color} onChange={() => {}} />
  </FormField>
];

const filled = {
  storeName: 'Farmacia Centrale',
  cardNumber: '2000012345678',
  color: 'green'
} as const;

const meta = {
  title: 'UI/FormScreen',
  component: FormScreen,
  args: {
    title: 'New Card',
    onBack: () => {},
    primaryAction: { label: 'Done', onPress: () => {} },
    children: customCardFields()
  }
} satisfies Meta<typeof FormScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Frame 1: nothing filled in, deep blue selected, the empty gap above the anchored Done. */
export const Default: Story = {};

/** Frame 2: Done pressed with no store name. The error sits on that field alone. */
export const ErrorState: Story = {
  name: 'Error',
  args: {
    children: customCardFields({
      storeNameError: 'Store name is required',
      cardNumber: '2000012345678'
    })
  }
};

/** Frame 3: every field filled — values in ink, the number in mono, and no success mark. */
export const Filled: Story = {
  args: { children: customCardFields(filled) }
};

/** Frame 4: busy, not disabled — the fill stays, the label becomes a spinner, nothing dims. */
export const Saving: Story = {
  args: {
    children: customCardFields(filled),
    primaryAction: { label: 'Done', onPress: () => {}, busy: true }
  }
};

/** The save rejected: one banner above the first field, no field reddened, Done still enabled. */
export const RequestFailed: Story = {
  name: 'Request failed',
  args: {
    children: customCardFields(filled),
    requestError: 'Failed to add card'
  }
};

/**
 * The auth screens' brand block, for the stories only: the real one is `features/auth`'s, out of
 * this directory's reach, and draws the Cardì mark in this ink circle. The heading in `headline-md`,
 * centred and announced as the heading; the subtitle 8 below it in `body-md` muted.
 */
const BrandBlockStandIn = ({ heading, subtitle }: { heading: string; subtitle: string }) => {
  const { theme } = useTheme();
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          marginBottom: 32,
          backgroundColor: IDENTITY_COLORS.ink
        }}
      />
      <Text
        accessibilityRole="header"
        style={{ ...TYPOGRAPHY.headlineMd, color: theme.textPrimary, textAlign: 'center' }}
      >
        {heading}
      </Text>
      <Text
        style={{
          ...TYPOGRAPHY.bodyMd,
          color: theme.textSecondary,
          textAlign: 'center',
          marginTop: 8
        }}
      >
        {subtitle}
      </Text>
    </View>
  );
};

/** The way-out link, for the stories only: `features/auth`'s link row. */
const WayOutStandIn = () => {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Create one"
      style={{ minHeight: 48, justifyContent: 'center', alignItems: 'center' }}
    >
      <Text style={{ ...TYPOGRAPHY.bodyMd, color: theme.textSecondary, textAlign: 'center' }}>
        {"Don't have an account? "}
        <Text style={{ ...TYPOGRAPHY.bodyMdStrong, color: theme.link }}>Create one</Text>
      </Text>
    </Pressable>
  );
};

const signInFields = [
  <TextField
    key="email"
    label="Email"
    value=""
    placeholder="you@example.com"
    onChangeText={() => {}}
  />,
  <TextField
    key="password"
    label="Password"
    value=""
    placeholder="Your password"
    secureTextEntry
    onChangeText={() => {}}
  />
];

/**
 * Story 22.9 — the auth shape (frame A): the header holds the back alone, the brand block leads the
 * body, and the way out sits under the primary in the footer.
 */
export const OpeningBlock: Story = {
  name: 'Opening block (auth)',
  args: {
    title: undefined,
    openingBlock: (
      <BrandBlockStandIn
        heading="Welcome Back"
        subtitle="Sign in to sync your loyalty cards across devices"
      />
    ),
    primaryAction: { label: 'Sign In', onPress: () => {}, busyLabel: 'Signing in...' },
    footerLink: <WayOutStandIn />,
    keepFocusedFieldInView: true,
    children: signInFields
  }
};

/** Frame F: the request failed — the banner below the brand block, 16 above the first field. */
export const OpeningBlockRequestFailed: Story = {
  name: 'Opening block, request failed (auth)',
  args: {
    ...OpeningBlock.args,
    requestError: 'Incorrect email or password. Please try again.'
  }
};

/** Busy, named by the caller: the spinner keeps the fill, and the button is "Signing in...". */
export const OpeningBlockBusy: Story = {
  name: 'Opening block, busy (auth)',
  args: {
    ...OpeningBlock.args,
    primaryAction: { label: 'Sign In', onPress: () => {}, busy: true, busyLabel: 'Signing in...' }
  }
};

/**
 * Nothing beneath it on the stack — new password after recovery (frame E): no back, so no header
 * row, and the body starts at the top inset.
 */
export const NoHeader: Story = {
  name: 'No header (auth)',
  args: {
    title: undefined,
    onBack: undefined,
    openingBlock: (
      <BrandBlockStandIn
        heading="Set New Password"
        subtitle="Choose a strong new password for your account."
      />
    ),
    primaryAction: { label: 'Update Password', onPress: () => {} },
    children: signInFields
  }
};

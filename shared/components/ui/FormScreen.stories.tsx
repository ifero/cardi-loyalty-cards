import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import Camera from 'lucide-react-native/icons/camera';
import { Pressable } from 'react-native';

import type { CardColor } from '@/core/schemas';

import { useTheme } from '@/shared/theme';

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

import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import Camera from 'lucide-react-native/icons/camera';
import { Pressable } from 'react-native';

import { useTheme } from '@/shared/theme';

import { TextField } from './TextField';

/**
 * A control for the trailing slot, for the story only — the real one is card setup's scan button,
 * which lives in `features/add-card`, out of this directory's reach.
 */
const TrailingStandIn = () => {
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

const meta = {
  title: 'UI/TextField',
  component: TextField,
  args: {
    label: 'Card name',
    value: '',
    placeholder: 'e.g. ACME Rewards',
    onChangeText: () => {}
  }
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = { args: { value: '' } };

export const Filled: Story = { args: { value: 'ACME Rewards' } };

export const WithError: Story = { args: { value: 'A', error: 'Card name is too short' } };

export const Disabled: Story = { args: { value: 'Locked field', disabled: true } };

export const Password: Story = {
  args: { label: 'Password', value: 'sup3rsecret', secureTextEntry: true }
};

/** Card numbers are set in JetBrains Mono so the digits align (Story 21.6's hand-off). */
export const CardNumber: Story = {
  args: { label: 'Card number', value: '2000012345678', mono: true, keyboardType: 'number-pad' }
};

/** An empty card number keeps its placeholder in the body face, as the form frames set it. */
export const CardNumberEmpty: Story = {
  args: { label: 'Card number', placeholder: 'Enter or scan card number', mono: true }
};

/** The trailing slot: a control outside the box, 8pt to its right (card setup's scan button). */
export const WithTrailingControl: Story = {
  args: {
    label: 'Card number',
    placeholder: 'Enter or scan card number',
    mono: true,
    trailing: <TrailingStandIn />
  }
};

export const WithCharacterCount: Story = {
  args: { label: 'Card name', value: 'Esselunga', maxLength: 50, showCharacterCount: true }
};

/** The verification code (auth frame D): digits in mono, tracked and centred (Story 22.9). */
export const VerificationCode: Story = {
  args: {
    label: 'Verification Code',
    value: '20461532',
    code: true,
    keyboardType: 'number-pad',
    maxLength: 16
  }
};

/** An empty code keeps its placeholder in the body face, centred and untracked. */
export const VerificationCodeEmpty: Story = {
  args: { label: 'Verification Code', placeholder: '8-digit code', code: true }
};

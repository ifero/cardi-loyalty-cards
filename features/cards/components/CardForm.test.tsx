/**
 * CardForm Component Tests
 * Story 2.2: Add Card Manually - AC2, AC3, AC4, AC5, AC6
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { StyleSheet, TextInput } from 'react-native';

import { LIGHT_THEME } from '@/shared/theme/colors';

import { CardForm } from './CardForm';

// Mock ThemeProvider and CARD_COLORS
jest.mock('@/shared/theme', () => ({
  useTheme: () => ({
    theme: {
      background: '#FAFAFA',
      surface: '#FFFFFF',
      textPrimary: '#1F2937',
      textSecondary: '#6B7280',
      primary: '#1A73E8',
      border: '#E5E7EB'
    },
    isDark: false
  }),
  CARD_COLORS: {
    blue: '#0C3C84',
    red: '#E42424',
    green: '#0C843C',
    orange: '#FCCC0C',
    grey: '#0C84CC'
  }
}));

describe('CardForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnDirtyChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering - AC2', () => {
    it('renders all form fields', () => {
      render(<CardForm onSubmit={mockOnSubmit} submitLabel="Add Card" testID="card-form" />);

      expect(screen.getByTestId('card-name-input')).toBeTruthy();
      expect(screen.getByTestId('barcode-input')).toBeTruthy();
      expect(screen.getByTestId('format-display')).toBeTruthy(); // Format auto-detected, not picked
      expect(screen.getByTestId('color-picker-container')).toBeTruthy();
    });

    it('renders the submit button with correct label', () => {
      render(<CardForm onSubmit={mockOnSubmit} submitLabel="Add Card" />);

      expect(screen.getByText('Add Card')).toBeTruthy();
    });

    it('renders "Save" label when provided', () => {
      render(<CardForm onSubmit={mockOnSubmit} submitLabel="Save" />);

      expect(screen.getByText('Save')).toBeTruthy();
    });
  });

  describe('Card Name Validation - AC3', () => {
    it('shows character counter', () => {
      render(<CardForm onSubmit={mockOnSubmit} submitLabel="Add Card" />);

      expect(screen.getByText('0/50')).toBeTruthy();
    });

    it('updates character counter as user types', async () => {
      render(<CardForm onSubmit={mockOnSubmit} submitLabel="Add Card" />);

      const nameInput = screen.getByTestId('card-name-input');
      fireEvent.changeText(nameInput, 'Test Card');

      await waitFor(() => {
        expect(screen.getByText('9/50')).toBeTruthy();
      });
    });

    it('shows error when name is empty on blur', async () => {
      render(<CardForm onSubmit={mockOnSubmit} submitLabel="Add Card" />);

      const nameInput = screen.getByTestId('card-name-input');
      fireEvent.changeText(nameInput, '');
      fireEvent(nameInput, 'blur');

      await waitFor(() => {
        expect(screen.getByTestId('card-name-input-error')).toBeTruthy();
      });
    });

    it('limits name to 50 characters', () => {
      render(<CardForm onSubmit={mockOnSubmit} submitLabel="Add Card" />);

      const nameInput = screen.getByTestId('card-name-input');
      expect(nameInput.props.maxLength).toBe(50);
    });
  });

  describe('Barcode Input - AC4', () => {
    it('shows numeric keypad type', () => {
      render(<CardForm onSubmit={mockOnSubmit} submitLabel="Add Card" />);

      const barcodeInput = screen.getByTestId('barcode-input');
      expect(barcodeInput.props.keyboardType).toBe('number-pad');
    });

    it('shows error when barcode is empty', async () => {
      render(<CardForm onSubmit={mockOnSubmit} submitLabel="Add Card" />);

      const barcodeInput = screen.getByTestId('barcode-input');
      fireEvent.changeText(barcodeInput, '');
      fireEvent(barcodeInput, 'blur');

      await waitFor(() => {
        expect(screen.getByTestId('barcode-input-error')).toBeTruthy();
      });
    });
  });

  describe('Default Values', () => {
    it('uses CODE128 as default barcode format when empty', () => {
      render(<CardForm onSubmit={mockOnSubmit} submitLabel="Add Card" />);

      // Format is auto-detected - shows "Code 128 (Universal)" description when empty
      expect(screen.getByTestId('format-display')).toBeTruthy();
      expect(screen.getByText('Code 128 (Universal)')).toBeTruthy();
    });

    it('uses grey as default color', () => {
      render(<CardForm onSubmit={mockOnSubmit} submitLabel="Add Card" />);

      // Grey should be selected (has checkmark)
      const greyOption = screen.getByTestId('color-option-grey');
      expect(greyOption).toHaveTextContent('check');
    });

    it('accepts custom default values', () => {
      render(
        <CardForm
          onSubmit={mockOnSubmit}
          submitLabel="Save"
          defaultValues={{
            name: 'Existing Card',
            barcode: '123456',
            barcodeFormat: 'EAN13',
            color: 'blue'
          }}
        />
      );

      expect(screen.getByDisplayValue('Existing Card')).toBeTruthy();
      expect(screen.getByDisplayValue('123456')).toBeTruthy();
    });
  });

  describe('Form Submission', () => {
    // Story 22.1, AC2 — "The primary action is always enabled. Pressing it on an incomplete form
    // reveals the field errors; it never sits inert." This test asserted the opposite until then.
    it('keeps the save button enabled on an empty form (AC2)', () => {
      render(<CardForm onSubmit={mockOnSubmit} submitLabel="Add Card" />);

      const submitButton = screen.getByTestId('save-button');
      expect(submitButton.props.accessibilityState.disabled).toBe(false);
    });

    it('reveals every field error, and submits nothing, when saved incomplete (AC2)', async () => {
      render(<CardForm onSubmit={mockOnSubmit} submitLabel="Add Card" />);

      fireEvent.press(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(screen.getByTestId('card-name-input-error')).toBeTruthy();
        expect(screen.getByTestId('barcode-input-error')).toBeTruthy();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    /**
     * AC2 — the errors are revealed AND the first invalid field takes focus, so the keyboard lands
     * where the fix is. That is react-hook-form's `shouldFocusError` (on by default), reaching the
     * native input through `field.ref` → `TextField`'s `ref` prop — implicit enough that a
     * `shouldFocusError: false` or a broken ref forward would regress it silently, hence this test.
     *
     * The name is made VALID first, so a pass proves focus goes to the first INVALID field (the
     * barcode), not merely the first field. Mount auto-focus is off so it cannot mask the result.
     * RN's TextInput mock shares one `focus` jest.fn across instances; `mock.contexts` says which.
     */
    it('focuses the first invalid field when saved incomplete (AC2)', async () => {
      const focus = jest.spyOn(TextInput.prototype, 'focus');
      const focusedFields = () =>
        focus.mock.contexts.map((input) => (input as { props: { testID?: string } }).props.testID);

      render(<CardForm onSubmit={mockOnSubmit} submitLabel="Add Card" focusNameOnMount={false} />);
      fireEvent.changeText(screen.getByTestId('card-name-input'), 'Test Card');
      fireEvent.press(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(focusedFields()).toContain('barcode-input');
      });
      expect(focusedFields()).not.toContain('card-name-input');
      expect(mockOnSubmit).not.toHaveBeenCalled();
      focus.mockRestore();
    });

    it('calls onSubmit with form data when submitted', async () => {
      render(<CardForm onSubmit={mockOnSubmit} submitLabel="Add Card" />);

      fireEvent.changeText(screen.getByTestId('card-name-input'), 'Test Card');
      fireEvent.changeText(screen.getByTestId('barcode-input'), '1234567890');
      fireEvent.press(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Test Card',
          barcode: '1234567890',
          barcodeFormat: 'CODE128', // Auto-detected: 10 digits -> CODE128
          color: 'grey'
        });
      });
    });

    // AC2 — "Busy is not disabled": the button keeps its fill and swaps its label for a spinner.
    // It is announced as busy (named "Saving...") rather than as a disabled control.
    it('shows the busy state as a spinner, not a disabled button', () => {
      render(<CardForm onSubmit={mockOnSubmit} submitLabel="Add Card" isLoading={true} />);

      const submitButton = screen.getByTestId('save-button');
      expect(screen.getByTestId('save-button-spinner')).toBeTruthy();
      expect(submitButton.props.accessibilityState).toMatchObject({ busy: true, disabled: false });
      expect(submitButton.props.accessibilityLabel).toBe('Saving...');
    });

    it('does not submit again while busy', () => {
      render(<CardForm onSubmit={mockOnSubmit} submitLabel="Add Card" isLoading={true} />);

      fireEvent.press(screen.getByTestId('save-button'));
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  // Story 22.1, AC6 + AC7 — CardForm now draws its fields with the shared TextField, so the three
  // hand-rolled labels (hardcoded #6B7280), errors (#EF4444) and 8pt-radius boxes are gone.
  describe('Shared field idiom - Story 22.1 (AC6, AC7)', () => {
    const flat = (node: { props: { style: unknown } }) =>
      StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;

    it('sets every field label in uppercase label-bold ink', () => {
      render(<CardForm onSubmit={mockOnSubmit} submitLabel="Add Card" />);

      for (const label of ['Card Name', 'Barcode Number', 'Barcode Format (Auto-detected)']) {
        expect(flat(screen.getByText(label))).toMatchObject({
          textTransform: 'uppercase',
          fontSize: 13,
          fontWeight: '600',
          color: LIGHT_THEME.textPrimary
        });
      }
    });

    it('draws field errors in the error token, not a hardcoded red', async () => {
      render(<CardForm onSubmit={mockOnSubmit} submitLabel="Add Card" />);
      fireEvent.press(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(flat(screen.getByTestId('card-name-input-error')).color).toBe(LIGHT_THEME.error);
      });
    });

    it('gives the inputs the shared 12pt radius', () => {
      render(<CardForm onSubmit={mockOnSubmit} submitLabel="Add Card" />);
      expect(flat(screen.getByTestId('card-name-input')).borderRadius).toBe(12);
      expect(flat(screen.getByTestId('barcode-input')).borderRadius).toBe(12);
    });

    // Story 21.6's hand-off: the card number's value is set in the mono face, as in the add flow.
    it('sets the barcode number in the mono-code face', () => {
      render(
        <CardForm
          onSubmit={mockOnSubmit}
          submitLabel="Add Card"
          defaultValues={{ name: 'Gym', barcode: '123456', barcodeFormat: 'EAN13', color: 'blue' }}
        />
      );
      expect(flat(screen.getByTestId('barcode-input')).fontFamily).toBe('JetBrains Mono');
    });

    // A read-only value must not look like a control: nothing between the value and its row may
    // draw a border. (It sat in an input-styled box — radius 8, 24pt padding — until Story 22.1.)
    it('shows the detected format as a read-only value, not as an input box', () => {
      render(<CardForm onSubmit={mockOnSubmit} submitLabel="Add Card" />);

      let node = screen.getByText('Code 128 (Universal)').parent;
      while (node && node.props.testID !== 'format-display') {
        expect(flat(node).borderWidth ?? 0).toBe(0);
        node = node.parent;
      }
      expect(node?.props.testID).toBe('format-display');
      expect(flat(node!).borderWidth ?? 0).toBe(0);
    });
  });

  describe('Dirty State Tracking - AC8', () => {
    it('calls onDirtyChange when form becomes dirty', async () => {
      render(
        <CardForm
          onSubmit={mockOnSubmit}
          submitLabel="Add Card"
          onDirtyChange={mockOnDirtyChange}
        />
      );

      const nameInput = screen.getByTestId('card-name-input');
      fireEvent.changeText(nameInput, 'Test');

      await waitFor(() => {
        expect(mockOnDirtyChange).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('Accessibility', () => {
    it('has accessible labels for form fields', () => {
      render(<CardForm onSubmit={mockOnSubmit} submitLabel="Add Card" />);

      expect(screen.getByLabelText('Card name')).toBeTruthy();
      expect(screen.getByLabelText('Barcode number')).toBeTruthy();
    });

    it('has accessible submit button', () => {
      render(<CardForm onSubmit={mockOnSubmit} submitLabel="Add Card" />);

      const submitButton = screen.getByTestId('save-button');
      expect(submitButton.props.accessibilityRole).toBe('button');
      expect(submitButton.props.accessibilityLabel).toBe('Add Card');
    });
  });
});

/**
 * CardForm Component Tests
 * Story 2.2: Add Card Manually - AC2, AC3, AC4, AC5, AC6
 * Story 22.6: The form pattern — on `FormScreen`, with its header, footer and request banner
 *
 * Rendered through the real `StoryDecorator` stack — the real `ThemeProvider`, i18n and safe-area
 * insets — so the form is checked against the roles the app paints.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, TextInput } from 'react-native';

import { ColorPicker } from '@/shared/components/ui/ColorPicker';
import { FormScreen } from '@/shared/components/ui/FormScreen';
import { HeaderIconButton } from '@/shared/components/ui/HeaderIconButton';
import { PrimaryActionFooter } from '@/shared/components/ui/PrimaryActionFooter';
import { LIGHT_THEME } from '@/shared/theme/colors';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { CardForm } from './CardForm';

type CardFormProps = React.ComponentProps<typeof CardForm>;

const mockOnSubmit = jest.fn();
const mockOnDirtyChange = jest.fn();
const mockOnBack = jest.fn();

const renderForm = (props: Partial<CardFormProps> = {}) => {
  const element = (overrides: Partial<CardFormProps> = {}) => (
    <StoryDecorator>
      <CardForm
        title="Edit Card"
        onBack={mockOnBack}
        onSubmit={mockOnSubmit}
        submitLabel="Save"
        {...props}
        {...overrides}
      />
    </StoryDecorator>
  );
  const view = render(element());
  return {
    ...view,
    rerenderWith: (overrides: Partial<CardFormProps>) => view.rerender(element(overrides))
  };
};

const flat = (node: { props: { style: unknown } }) =>
  StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;

/** The ancestor of `testID` rendered by the component `type`, if there is one. */
const ancestorOfType = (testID: string, type: unknown) => {
  let node = screen.getByTestId(testID).parent;
  while (node && node.type !== type) {
    node = node.parent;
  }
  return node;
};

describe('CardForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering - AC2', () => {
    it('renders all form fields', () => {
      renderForm({ testID: 'card-form' });

      expect(screen.getByTestId('card-name-input')).toBeTruthy();
      expect(screen.getByTestId('barcode-input')).toBeTruthy();
      expect(screen.getByTestId('format-display')).toBeTruthy(); // Format auto-detected, not picked
      expect(screen.getByTestId('color-picker')).toBeTruthy();
    });

    it('renders the submit button with correct label', () => {
      renderForm({ submitLabel: 'Add Card' });

      expect(screen.getByText('Add Card')).toBeTruthy();
    });

    it('renders "Save" label when provided', () => {
      renderForm({ submitLabel: 'Save' });

      expect(screen.getByText('Save')).toBeTruthy();
    });
  });

  // Story 22.6 — the form draws the pattern: its header with the back, the fields in a scroll on
  // 24pt margins, and Save anchored in the footer, never in the scroll.
  describe('The form pattern - Story 22.6', () => {
    it('is one FormScreen, titled and with a back that calls onBack', () => {
      renderForm({ backTestID: 'edit-back-button' });

      expect(screen.UNSAFE_getAllByType(FormScreen)).toHaveLength(1);
      // The pattern's header, footer and keyboard handling are the only ones the form draws.
      expect(screen.UNSAFE_getAllByType(HeaderIconButton)).toHaveLength(1);
      expect(screen.UNSAFE_getAllByType(PrimaryActionFooter)).toHaveLength(1);
      expect(screen.UNSAFE_getAllByType(KeyboardAvoidingView)).toHaveLength(1);
      expect(screen.UNSAFE_getAllByType(ScrollView)).toHaveLength(1);
      expect(screen.getByText('Edit Card').props.accessibilityRole).toBe('header');

      fireEvent.press(screen.getByTestId('edit-back-button'));
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    // The frame's order: CARD NAME, BARCODE NUMBER, the detected format, then CARD COLOR — those
    // four and nothing else, and no scan button, which edit never has.
    it('draws the fields in the frame’s order, and nothing else', () => {
      renderForm();
      expect(screen.getByTestId('form-screen-fields').children).toHaveLength(4);
      expect(screen.queryByTestId('inline-scan-button')).toBeNull();
      const tree = JSON.stringify(screen.toJSON());
      const at = (testID: string) => tree.indexOf(`"${testID}"`);
      expect(at('card-name-input')).toBeGreaterThan(-1);
      expect(at('card-name-input')).toBeLessThan(at('barcode-input'));
      expect(at('barcode-input')).toBeLessThan(at('format-display'));
      expect(at('format-display')).toBeLessThan(at('color-picker'));
    });

    it('names the scrolling body with its testID', () => {
      renderForm({ testID: 'edit-card-form' });
      expect(screen.getByTestId('edit-card-form').props.keyboardShouldPersistTaps).toBe('handled');
      expect(ancestorOfType('card-name-input', ScrollView)).toBeTruthy();
    });

    it('anchors Save in the footer, outside the scroll', () => {
      renderForm();
      expect(ancestorOfType('save-button', PrimaryActionFooter)).toBeTruthy();
      expect(ancestorOfType('save-button', ScrollView)).toBeNull();
    });

    // The 24pt margin replaces the 32 the edit form used to draw — the one-off this story owns.
    it('sets the fields on the 24pt margins, 32 apart', () => {
      renderForm({ testID: 'edit-card-form' });
      const content = StyleSheet.flatten(
        screen.getByTestId('edit-card-form').props.contentContainerStyle
      ) as Record<string, unknown>;
      expect(content.paddingHorizontal).toBe(24);
      expect(content.paddingBottom).toBeUndefined();
      expect(flat(screen.getByTestId('form-screen-fields')).gap).toBe(32);
    });

    // A failed save is the hook's message in the banner. It reddens no field.
    it('shows a failed save in the banner, reddening no field', () => {
      renderForm({
        requestError: 'Failed to update card',
        defaultValues: { name: 'Gym', barcode: '123456', barcodeFormat: 'EAN13', color: 'blue' }
      });

      expect(screen.getByTestId('form-screen-banner')).toBeTruthy();
      expect(screen.getByText('Failed to update card')).toBeTruthy();
      expect(flat(screen.getByTestId('card-name-input')).borderColor).toBe(LIGHT_THEME.border);
      expect(flat(screen.getByTestId('barcode-input')).borderColor).toBe(LIGHT_THEME.border);
      expect(screen.getByTestId('save-button').props.accessibilityState.disabled).toBe(false);
    });

    it('draws no banner without a failed save', () => {
      renderForm();
      expect(screen.queryByTestId('form-screen-banner')).toBeNull();
    });

    // The banner arrives in a re-render, and card edit hands the form a fresh `defaultValues`
    // object on every render: the edits the person typed must survive both.
    it('keeps typed edits when a failed save’s banner arrives', () => {
      const savedCard = () => ({
        name: 'Gym',
        barcode: '123456',
        barcodeFormat: 'EAN13' as const,
        color: 'blue' as const
      });
      const { rerenderWith } = renderForm({ defaultValues: savedCard() });

      fireEvent.changeText(screen.getByTestId('card-name-input'), 'Gym Plus');
      rerenderWith({ defaultValues: savedCard(), requestError: 'Failed to update card' });

      expect(screen.getByTestId('form-screen-banner')).toBeTruthy();
      expect(screen.getByText('Failed to update card')).toBeTruthy();
      expect(screen.getByTestId('card-name-input').props.value).toBe('Gym Plus');
    });
  });

  describe('Card Name Validation - AC3', () => {
    it('shows character counter', () => {
      renderForm();

      expect(screen.getByText('0/50')).toBeTruthy();
    });

    it('updates character counter as user types', async () => {
      renderForm();

      const nameInput = screen.getByTestId('card-name-input');
      fireEvent.changeText(nameInput, 'Test Card');

      await waitFor(() => {
        expect(screen.getByText('9/50')).toBeTruthy();
      });
    });

    it('limits name to 50 characters', () => {
      renderForm();

      const nameInput = screen.getByTestId('card-name-input');
      expect(nameInput.props.maxLength).toBe(50);
    });
  });

  describe('Barcode Input - AC4', () => {
    it('shows numeric keypad type', () => {
      renderForm();

      const barcodeInput = screen.getByTestId('barcode-input');
      expect(barcodeInput.props.keyboardType).toBe('number-pad');
    });
  });

  /**
   * Story 22.6 — react-hook-form's `onSubmit` mode with `onChange` re-validation: the errors appear
   * at the first Save, then update while the user types, rather than on every keystroke from the
   * start. (They used to appear on `onChange` from the first keystroke.)
   */
  describe('Validation timing - Story 22.6', () => {
    it('shows no error while the user types and leaves a field, before the first Save', async () => {
      renderForm({ focusNameOnMount: false });

      const nameInput = screen.getByTestId('card-name-input');
      fireEvent.changeText(nameInput, 'A');
      fireEvent.changeText(nameInput, '');
      fireEvent(nameInput, 'blur');
      const barcodeInput = screen.getByTestId('barcode-input');
      fireEvent.changeText(barcodeInput, '');
      fireEvent(barcodeInput, 'blur');

      // Give any validation the chance to land before asserting it did not.
      await waitFor(() => expect(screen.getByText('0/50')).toBeTruthy());
      expect(screen.queryByTestId('card-name-input-error')).toBeNull();
      expect(screen.queryByTestId('barcode-input-error')).toBeNull();
    });

    it('reveals the errors at the first Save, then clears or errs as the user types', async () => {
      renderForm({ focusNameOnMount: false });

      fireEvent.press(screen.getByTestId('save-button'));
      await waitFor(() => {
        expect(screen.getByTestId('card-name-input-error')).toBeTruthy();
        expect(screen.getByTestId('barcode-input-error')).toBeTruthy();
      });

      fireEvent.changeText(screen.getByTestId('card-name-input'), 'Gym');
      await waitFor(() => {
        expect(screen.queryByTestId('card-name-input-error')).toBeNull();
      });
      // The barcode was not touched, so it still errs.
      expect(screen.getByTestId('barcode-input-error')).toBeTruthy();

      fireEvent.changeText(screen.getByTestId('card-name-input'), '');
      await waitFor(() => {
        expect(screen.getByText('Card name is required')).toBeTruthy();
      });
    });
  });

  describe('Default Values', () => {
    it('uses CODE128 as default barcode format when empty', () => {
      renderForm();

      // Format is auto-detected - shows "Code 128 (Universal)" description when empty
      expect(screen.getByTestId('format-display')).toBeTruthy();
      expect(screen.getByText('Code 128 (Universal)')).toBeTruthy();
    });

    it('uses grey as default color', () => {
      renderForm();

      // Grey (azure) is selected: its swatch carries the selected state and the check.
      expect(screen.UNSAFE_getByType(ColorPicker).props.value).toBe('grey');
      expect(screen.getByTestId('color-picker-grey').props.accessibilityState.selected).toBe(true);
      expect(
        screen.getByTestId('color-picker-grey-check', { includeHiddenElements: true })
      ).toBeTruthy();
    });

    it('accepts custom default values', () => {
      renderForm({
        defaultValues: {
          name: 'Existing Card',
          barcode: '123456',
          barcodeFormat: 'EAN13',
          color: 'blue'
        }
      });

      expect(screen.getByDisplayValue('Existing Card')).toBeTruthy();
      expect(screen.getByDisplayValue('123456')).toBeTruthy();
      expect(screen.getByTestId('color-picker-blue').props.accessibilityState.selected).toBe(true);
    });
  });

  describe('Form Submission', () => {
    // Story 22.1, AC2 — "The primary action is always enabled. Pressing it on an incomplete form
    // reveals the field errors; it never sits inert." This test asserted the opposite until then.
    it('keeps the save button enabled on an empty form (AC2)', () => {
      renderForm();

      const submitButton = screen.getByTestId('save-button');
      expect(submitButton.props.accessibilityState.disabled).toBe(false);
    });

    it('reveals every field error, and submits nothing, when saved incomplete (AC2)', async () => {
      renderForm();

      fireEvent.press(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(screen.getByTestId('card-name-input-error')).toBeTruthy();
        expect(screen.getByTestId('barcode-input-error')).toBeTruthy();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    /**
     * AC2 — the errors are revealed AND the first invalid field takes focus, so the keyboard lands
     * where the fix is. That is react-hook-form's `shouldFocusError`, reaching the native input
     * through `field.ref` → `TextField`'s `ref` prop — implicit enough that a
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

      renderForm({ focusNameOnMount: false });
      fireEvent.changeText(screen.getByTestId('card-name-input'), 'Test Card');
      fireEvent.press(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(focusedFields()).toContain('barcode-input');
      });
      expect(focusedFields()).not.toContain('card-name-input');
      expect(mockOnSubmit).not.toHaveBeenCalled();
      focus.mockRestore();
    });

    // The empty form's first invalid field is the name, so this one pins the name's own ref
    // forward, which the test above makes valid and never reaches.
    it('focuses the name when saved empty (AC2)', async () => {
      const focus = jest.spyOn(TextInput.prototype, 'focus');
      const focusedFields = () =>
        focus.mock.contexts.map((input) => (input as { props: { testID?: string } }).props.testID);

      renderForm({ focusNameOnMount: false });
      fireEvent.press(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(focusedFields()).toContain('card-name-input');
      });
      expect(focusedFields()).not.toContain('barcode-input');
      focus.mockRestore();
    });

    it('calls onSubmit with form data when submitted', async () => {
      renderForm();

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

    it('submits the colour picked in the shared picker', async () => {
      renderForm({
        defaultValues: { name: 'Gym', barcode: '123456', barcodeFormat: 'EAN13', color: 'blue' }
      });

      fireEvent.press(screen.getByTestId('color-picker-green'));
      fireEvent.press(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({ color: 'green' }));
      });
    });

    // AC2 — "Busy is not disabled": the button keeps its fill and swaps its label for a spinner.
    // It is announced as busy (named "Saving...") rather than as a disabled control.
    it('shows the busy state as a spinner, not a disabled button', () => {
      renderForm({ submitLabel: 'Add Card', isLoading: true });

      const submitButton = screen.getByTestId('save-button');
      expect(screen.getByTestId('save-button-spinner')).toBeTruthy();
      expect(submitButton.props.accessibilityState).toMatchObject({ busy: true, disabled: false });
      expect(submitButton.props.accessibilityLabel).toBe('Saving...');
      expect(flat(screen.getByTestId('save-button-container')).backgroundColor).toBe(
        LIGHT_THEME.primary
      );
      // The fields stay live: busy is the button's state, never a disabled form.
      expect(screen.getByTestId('card-name-input').props.editable).toBe(true);
      expect(screen.getByTestId('barcode-input').props.editable).toBe(true);
    });

    it('does not submit again while busy', () => {
      renderForm({ isLoading: true });

      fireEvent.press(screen.getByTestId('save-button'));
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  // Story 22.1, AC6 + AC7 — CardForm now draws its fields with the shared TextField, so the three
  // hand-rolled labels (hardcoded #6B7280), errors (#EF4444) and 8pt-radius boxes are gone.
  describe('Shared field idiom - Story 22.1 (AC6, AC7)', () => {
    it('sets every field label in uppercase label-bold ink', () => {
      renderForm();

      for (const label of [
        'Card Name',
        'Barcode Number',
        'Barcode Format (Auto-detected)',
        'Card Color'
      ]) {
        expect(flat(screen.getByText(label))).toMatchObject({
          textTransform: 'uppercase',
          fontSize: 13,
          fontWeight: '600',
          color: LIGHT_THEME.textPrimary
        });
      }
    });

    it('draws field errors in the error token, not a hardcoded red', async () => {
      renderForm();
      fireEvent.press(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(flat(screen.getByTestId('card-name-input-error')).color).toBe(LIGHT_THEME.error);
      });
    });

    it('gives the inputs the shared 12pt radius', () => {
      renderForm();
      expect(flat(screen.getByTestId('card-name-input')).borderRadius).toBe(12);
      expect(flat(screen.getByTestId('barcode-input')).borderRadius).toBe(12);
    });

    // Story 21.6's hand-off: the card number's value is set in the mono face, as in the add flow.
    it('sets the barcode number in the mono-code face', () => {
      renderForm({
        defaultValues: { name: 'Gym', barcode: '123456', barcodeFormat: 'EAN13', color: 'blue' }
      });
      expect(flat(screen.getByTestId('barcode-input')).fontFamily).toBe('JetBrains Mono');
    });

    // A read-only value must not look like a control: nothing between the value and its row may
    // draw a border. (It sat in an input-styled box — radius 8, 24pt padding — until Story 22.1.)
    it('shows the detected format as a read-only value, not as an input box', () => {
      renderForm();

      let node = screen.getByText('Code 128 (Universal)').parent;
      while (node && node.props.testID !== 'format-display') {
        expect(flat(node).borderWidth ?? 0).toBe(0);
        node = node.parent;
      }
      expect(node?.props.testID).toBe('format-display');
      expect(flat(node!).borderWidth ?? 0).toBe(0);
    });

    // Story 22.6 — a non-text field's label sits 8 above its control, as a text field's does.
    it('sets the format’s label and the colour’s 8 above their controls', () => {
      renderForm();
      expect(flat(screen.getByTestId('format-display')).gap).toBe(8);
      expect(flat(screen.getByText('Code 128 (Universal)')).marginTop).toBeUndefined();

      let colorField = screen.getByTestId('color-picker').parent;
      while (colorField && (flat(colorField) ?? {}).gap === undefined) {
        colorField = colorField.parent;
      }
      expect(flat(colorField!).gap).toBe(8);
    });
  });

  describe('Dirty State Tracking - AC8', () => {
    it('calls onDirtyChange when form becomes dirty', async () => {
      renderForm({ onDirtyChange: mockOnDirtyChange });

      const nameInput = screen.getByTestId('card-name-input');
      fireEvent.changeText(nameInput, 'Test');

      await waitFor(() => {
        expect(mockOnDirtyChange).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('Accessibility', () => {
    it('has accessible labels for form fields', () => {
      renderForm();

      expect(screen.getByLabelText('Card name')).toBeTruthy();
      expect(screen.getByLabelText('Barcode number')).toBeTruthy();
    });

    it('has accessible submit button', () => {
      renderForm({ submitLabel: 'Add Card' });

      const submitButton = screen.getByTestId('save-button');
      expect(submitButton.props.accessibilityRole).toBe('button');
      expect(submitButton.props.accessibilityLabel).toBe('Add Card');
    });
  });
});

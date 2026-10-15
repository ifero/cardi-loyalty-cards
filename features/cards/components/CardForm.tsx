/**
 * Card Form Component
 * Story 2.2: Add Card Manually
 * Story 22.1: Draws its fields with the shared TextField and saves with the shared Button (AC2, AC6)
 * Story 22.6: The form pattern — drawn by `FormScreen`, with its header, footer and request banner
 *
 * Card edit's form (Story 2.7): `CardEditScreen` is its one caller.
 * Uses react-hook-form with zod validation.
 *
 * Updated: Barcode format is auto-detected from value - user doesn't need to select it.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import * as z from 'zod';

import { barcodeFormatSchema, cardColorSchema } from '@/core/schemas';
import { inferBarcodeFormat } from '@/core/utils';

import { ColorPicker } from '@/shared/components/ui/ColorPicker';
import { FormField, FormScreen } from '@/shared/components/ui/FormScreen';
import { TextField } from '@/shared/components/ui/TextField';
import { TYPOGRAPHY } from '@/shared/theme/typography';

/**
 * Form validation schema per AC3 & AC4
 * Note: Defaults are handled via useForm defaultValues, not zod defaults
 * to ensure proper type compatibility with react-hook-form
 */
const createCardFormSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t('cards.form.nameRequired')).max(50, t('cards.form.nameMax')),
    barcode: z.string().min(1, t('cards.form.barcodeRequired')),
    barcodeFormat: barcodeFormatSchema,
    color: cardColorSchema,
    brandId: z.string().optional() // Story 3.3: Optional brand ID
  });

export type CardFormInput = z.infer<ReturnType<typeof createCardFormSchema>>;

interface CardFormProps {
  /** The screen's title, in the form's header. */
  title: string;
  /** The header's back: the caller decides whether unsaved changes need a prompt first. */
  onBack: () => void;
  backTestID?: string;
  defaultValues?: Partial<CardFormInput>;
  onSubmit: (data: CardFormInput) => Promise<void>;
  submitLabel: string;
  isLoading?: boolean;
  /** A failed save, as the save hook reports it: shown in the form's banner, never on a field. */
  requestError?: string | null;
  onDirtyChange?: (isDirty: boolean) => void;
  /** The scrolling body's testID. */
  testID?: string;
  /** Focus the name field on mount. Defaults to true; card edit, the one caller, turns it off. */
  focusNameOnMount?: boolean;
}

/**
 * CardForm - card edit's form, on the shared form pattern
 *
 * Features per acceptance criteria:
 * - AC2: Card Name, Barcode Number, Card Color fields
 * - AC3: Name validation with 50 char limit and character counter
 * - AC4: Numeric keypad for barcode input
 * - AC5: Format auto-detected from barcode value (user doesn't select)
 * - AC6: Color picker with 5 options, Grey default
 * - Save is ALWAYS enabled: pressing it on an incomplete form reveals the field
 *   errors and focuses the first one (Story 22.1, AC2 — it used to sit disabled)
 * - The errors appear at the first Save, then follow the typing (Story 22.6) — not on every
 *   keystroke from the start
 */
export const CardForm = ({
  title,
  onBack,
  backTestID,
  defaultValues,
  onSubmit,
  submitLabel,
  isLoading = false,
  requestError,
  onDirtyChange,
  testID,
  focusNameOnMount = true
}: CardFormProps) => {
  const { t } = useTranslation();
  const cardFormSchema = useMemo(() => createCardFormSchema(t), [t]);
  const barcodeFormatLabels = useMemo(
    () => ({
      CODE128: t('cards.form.barcodeFormat.CODE128'),
      EAN13: t('cards.form.barcodeFormat.EAN13'),
      EAN8: t('cards.form.barcodeFormat.EAN8'),
      QR: t('cards.form.barcodeFormat.QR'),
      CODE39: t('cards.form.barcodeFormat.CODE39'),
      UPCA: t('cards.form.barcodeFormat.UPCA')
    }),
    [t]
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setFocus,
    formState: { errors, isDirty }
  } = useForm<CardFormInput>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      name: '',
      barcode: '',
      barcodeFormat: defaultValues?.barcodeFormat || 'CODE128',
      color: 'grey',
      ...defaultValues
    },
    // Errors appear when Save is pressed, then re-validate as the user types (Story 22.6).
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    // Save on an incomplete form puts the keyboard where the fix is (Story 22.1, AC2).
    shouldFocusError: true
  });

  const barcodeValue = watch('barcode');
  const barcodeFormat = watch('barcodeFormat');

  // Auto-detect the barcode format as the number changes, unless the caller supplied one
  useEffect(() => {
    // Skip auto-detection when `defaultValues` carries a format. Card edit always passes the saved
    // card's, so an edited number keeps its old format.
    if (defaultValues?.barcodeFormat) {
      return;
    }

    const inferredFormat = inferBarcodeFormat(barcodeValue || '');
    if (inferredFormat !== barcodeFormat) {
      setValue('barcodeFormat', inferredFormat);
    }
  }, [barcodeValue, defaultValues?.barcodeFormat, setValue, barcodeFormat]);

  // Notify parent of dirty state changes for discard confirmation (AC8)
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Auto-focus the card name field on mount when asked (AC2). Through the form's own field ref —
  // the same one `handleSubmit` uses to focus the first invalid field — rather than a second ref to
  // the same input.
  useEffect(() => {
    if (focusNameOnMount) {
      const timeout = setTimeout(() => {
        setFocus('name');
      }, 100);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [focusNameOnMount, setFocus]);

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <FormScreen
      title={title}
      onBack={onBack}
      backTestID={backTestID}
      primaryAction={{
        label: submitLabel,
        onPress: handleFormSubmit,
        busy: isLoading,
        testID: 'save-button'
      }}
      requestError={requestError}
      bodyTestID={testID}
    >
      {/* Card Name Field - AC2, AC3 */}
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value, ref } }) => (
          <TextField
            ref={ref}
            label={t('cards.form.nameLabel')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={t('cards.form.namePlaceholder')}
            maxLength={50}
            showCharacterCount
            error={errors.name?.message}
            testID="card-name-input"
            accessibilityLabel={t('cards.form.nameAccessibilityLabel')}
          />
        )}
      />

      {/* Barcode Number Field - AC4 */}
      <Controller
        control={control}
        name="barcode"
        render={({ field: { onChange, onBlur, value, ref } }) => (
          <TextField
            ref={ref}
            label={t('cards.form.barcodeLabel')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={t('cards.form.barcodePlaceholder')}
            keyboardType="number-pad"
            mono
            error={errors.barcode?.message}
            testID="barcode-input"
            accessibilityLabel={t('cards.form.barcodeAccessibilityLabel')}
          />
        )}
      />

      {/* Barcode Format Display - AC5 (Auto-detected). Information, not a control: the
          uppercase label over a plain value is what keeps it from reading as an input. */}
      <FormField label={t('cards.form.barcodeFormatLabel')} testID="format-display">
        <Text style={styles.formatValue}>{barcodeFormatLabels[barcodeFormat]}</Text>
      </FormField>

      {/* Color Picker - AC6 */}
      <FormField label={t('addCard.setup.colorLabel')}>
        <Controller
          control={control}
          name="color"
          render={({ field: { onChange, value } }) => (
            <ColorPicker value={value} onChange={onChange} testID="color-picker" />
          )}
        />
      </FormField>
    </FormScreen>
  );
};

const styles = StyleSheet.create((theme) => ({
  // The format is a Text, not a field, so it keeps the token's line height.
  formatValue: {
    ...TYPOGRAPHY.bodyLg,
    color: theme.colors.textPrimary
  }
}));

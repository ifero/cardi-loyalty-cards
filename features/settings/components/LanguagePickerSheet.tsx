import React from 'react';
import { useTranslation } from 'react-i18next';

import { BottomSheet, OptionList, type OptionListOption } from '@/shared/components/ui';

import type { LanguageOption } from '../types';

type LanguagePickerSheetProps = {
  visible: boolean;
  currentCode: string;
  options: LanguageOption[];
  onSelect: (code: LanguageOption['code']) => void;
  onClose: () => void;
};

/** Pick one (frame C): the languages `useLanguagePreference` supplies, with no helper. */
export const LanguagePickerSheet = ({
  visible,
  currentCode,
  options,
  onSelect,
  onClose
}: LanguagePickerSheetProps) => {
  const { t } = useTranslation();
  const listOptions: OptionListOption<LanguageOption['code']>[] = options.map((option) => ({
    value: option.code,
    label: option.name,
    accessibilityLabel: t('settings.language.picker.optionAccessibilityLabel', {
      name: option.name
    }),
    testID: `language-option-${option.code}`
  }));
  // A code the list does not hold selects nothing, rather than the first option.
  const selected = options.find((option) => option.code === currentCode)?.code;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t('settings.language.picker.title')}
      testID="language-picker-sheet"
    >
      <OptionList
        testID="language-picker-options"
        options={listOptions}
        selectedValue={selected}
        onSelect={onSelect}
      />
    </BottomSheet>
  );
};

import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { useLanguagePreference } from './useLanguagePreference';

const mockGetLanguagePreference = jest.fn();
const mockSetLanguagePreference = jest.fn();
const mockChangeAppLanguage = jest.fn();

jest.mock('@/features/settings/settings-repository', () => ({
  getLanguagePreference: () => mockGetLanguagePreference(),
  setLanguagePreference: (value: string) => mockSetLanguagePreference(value)
}));

// The app's language is changed through this mock, so the test sees the call and the shared i18n
// instance keeps English for the tests after it.
jest.mock('@/shared/i18n', () => ({
  ...jest.requireActual('@/shared/i18n'),
  changeAppLanguage: (code: string) => mockChangeAppLanguage(code)
}));

describe('useLanguagePreference', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLanguagePreference.mockReturnValue('en');
    mockChangeAppLanguage.mockResolvedValue(undefined);
  });

  it('returns current language name and supported options', () => {
    const { result } = renderHook(() => useLanguagePreference());

    expect(result.current.languageCode).toBe('en');
    expect(result.current.languageName).toBe('English');
    expect(result.current.supportedLanguages).toEqual([
      { code: 'system', name: 'System' },
      { code: 'en', name: 'English' },
      { code: 'it', name: 'Italian' }
    ]);
  });

  it('updates and persists selected language', () => {
    const { result } = renderHook(() => useLanguagePreference());

    act(() => {
      result.current.selectLanguage('it');
    });

    expect(mockSetLanguagePreference).toHaveBeenCalledWith('it');
  });

  // Pick one: choosing applies, saves, announces and closes. The announcement is made in the
  // language being left, before the change lands.
  it('applies the language chosen, announces it and closes the picker', () => {
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => undefined);
    const { result } = renderHook(() => useLanguagePreference());

    act(() => {
      result.current.openLanguagePicker();
    });
    expect(result.current.isLanguagePickerOpen).toBe(true);

    act(() => {
      result.current.selectLanguage('it');
    });

    expect(mockChangeAppLanguage).toHaveBeenCalledTimes(1);
    expect(mockChangeAppLanguage).toHaveBeenCalledWith('it');
    expect(result.current.languageCode).toBe('it');
    expect(result.current.isLanguagePickerOpen).toBe(false);
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('Italian selected');
    announce.mockRestore();
  });
});

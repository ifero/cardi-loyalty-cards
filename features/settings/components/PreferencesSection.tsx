import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ActionRow, ToggleSwitch } from '@/shared/components/ui';
import { useTheme } from '@/shared/theme';

import { SettingsSection } from './SettingsSection';

type PreferencesSectionProps = {
  themeLabel: string;
  languageName: string;
  onThemePress: () => void;
  onLanguagePress: () => void;
  /** Whether the card detail screen goes to full brightness by itself (Story 16.39). */
  isAutoBrightnessEnabled: boolean;
  onAutoBrightnessChange: (value: boolean) => void;
};

export const PreferencesSection = ({
  themeLabel,
  languageName,
  onThemePress,
  onLanguagePress,
  isAutoBrightnessEnabled,
  onAutoBrightnessChange
}: PreferencesSectionProps) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <SettingsSection title={t('settings.sections.preferences')}>
      <ActionRow
        testID="settings-theme-row"
        variant="plain"
        prefix={<MaterialIcons name="brightness-6" size={24} color={theme.primary} />}
        label={t('settings.preferences.themeLabel')}
        value={themeLabel}
        onPress={onThemePress}
      />
      <ActionRow
        testID="settings-language-row"
        variant="plain"
        prefix={<MaterialIcons name="language" size={24} color={theme.primary} />}
        label={t('settings.preferences.languageLabel')}
        value={languageName}
        onPress={onLanguagePress}
      />
      {/* Story 16.39. Deliberately a `ToggleSwitch` rather than an `ActionRow`: this is
          a boolean the user sets in place, not a row that opens a picker, and the
          switch carries `accessibilityRole="switch"` so the platform announces on/off
          without any copy of ours. `ActionRow` has no trailing slot to host it. */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Hidden from assistive technology, so this row is ONE stop like the two
            above it. `ActionRow` gets that for free by wrapping its icon inside the
            Pressable that carries the label; here the icon is a SIBLING of the switch,
            and `MaterialIcons` renders a Text node with real glyph content — left
            exposed it would read as an extra, unlabelled swipe-stop before
            "Full brightness, switch". Both props are needed: one for iOS, one for
            Android. */}
        <View
          style={{ marginRight: 12 }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {/* A BULB, matching the card screen's control (Story 16.39). It was a sun
              (`light-mode`) until QA pointed out the app was then using two different
              glyphs for one feature, one screen apart: a user sets this row and then
              finds a bulb on the card with no visual line back to it. Worse, the Theme
              row directly above already uses `brightness-6`, so a sun here collided
              with that too. The card button is where the meaning is learned, so this
              row follows it rather than the reverse. Filled rather than outline: this
              is a category glyph, and the switch beside it is what carries state. */}
          <MaterialIcons name="lightbulb" size={24} color={theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <ToggleSwitch
            testID="settings-auto-brightness-toggle"
            label={t('settings.preferences.autoBrightnessLabel')}
            value={isAutoBrightnessEnabled}
            onValueChange={onAutoBrightnessChange}
          />
        </View>
      </View>
    </SettingsSection>
  );
};

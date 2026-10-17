import Globe from 'lucide-react-native/icons/globe';
import Lightbulb from 'lucide-react-native/icons/lightbulb';
import Moon from 'lucide-react-native/icons/moon';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ActionRow, ToggleSwitch } from '@/shared/components/ui';
import { useTheme } from '@/shared/theme';
import { SPACING } from '@/shared/theme/spacing';

import { SettingsSection } from './SettingsSection';

/** The design system's icon: 24pt at a 1.5 stroke (§ _Icons_). */
const ICON_SIZE = 24;
const ICON_STROKE_WIDTH = 1.5;

type PreferencesSectionProps = {
  themeLabel: string;
  languageName: string;
  onThemePress: () => void;
  onLanguagePress: () => void;
  /** Whether the card detail screen goes to full brightness by itself (Story 16.39). */
  isAutoBrightnessEnabled: boolean;
  onAutoBrightnessChange: (value: boolean) => void;
};

/**
 * PREFERENCES (frame A): Theme, Language, then the full-brightness switch. These are the only
 * settings rows that lead with an icon, each in `textPrimary` — ink in light, cream in dark.
 */
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
        showBottomBorder={false}
        prefix={
          <Moon
            testID="settings-theme-icon"
            size={ICON_SIZE}
            strokeWidth={ICON_STROKE_WIDTH}
            color={theme.textPrimary}
          />
        }
        label={t('settings.preferences.themeLabel')}
        value={themeLabel}
        onPress={onThemePress}
      />
      <ActionRow
        testID="settings-language-row"
        variant="plain"
        showBottomBorder={false}
        prefix={
          <Globe
            testID="settings-language-icon"
            size={ICON_SIZE}
            strokeWidth={ICON_STROKE_WIDTH}
            color={theme.textPrimary}
          />
        }
        label={t('settings.preferences.languageLabel')}
        value={languageName}
        onPress={onLanguagePress}
      />
      {/* Story 16.39. Deliberately a `ToggleSwitch` rather than an `ActionRow`: this is
          a boolean the user sets in place, not a row that opens a picker, and the
          switch carries `accessibilityRole="switch"` so the platform announces on/off
          without any copy of ours. `ActionRow` has no trailing slot to host it. */}
      <View testID="settings-auto-brightness-row" style={styles.switchRow}>
        {/* Hidden from assistive technology, so this row is ONE stop like the two
            above it. `ActionRow` gets that for free by wrapping its icon inside the
            Pressable that carries the label; here the icon is a SIBLING of the switch,
            and left exposed it would read as an extra, unlabelled swipe-stop before
            "Full brightness, switch". Both props are needed: one for iOS, one for
            Android. */}
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {/* A BULB, matching the card screen's control (Story 16.39): a user sets this row
              and then finds the same glyph on the card. It is filled only while the switch
              is on — the design system's brightness-bulb ruling (Story 22.3), where the fill
              is the state. The fill is always handed over: Lucide spreads an explicit
              `undefined` over its own `none`, and the glyph then fills black. */}
          <Lightbulb
            testID="settings-auto-brightness-icon"
            size={ICON_SIZE}
            strokeWidth={ICON_STROKE_WIDTH}
            color={theme.textPrimary}
            fill={isAutoBrightnessEnabled ? theme.textPrimary : 'none'}
          />
        </View>
        <View testID="settings-auto-brightness-switch" style={styles.switch}>
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

const styles = StyleSheet.create({
  // Padded as the rows above it are, the bulb 12 from the switch.
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.smMd,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.smMd
  },
  switch: {
    flex: 1
  }
});

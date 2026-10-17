import React from 'react';
import { StyleSheet, View } from 'react-native';

import { SectionHeader } from '@/shared/components/ui/SectionHeader';
import { Surface } from '@/shared/components/ui/Surface';
import { SPACING } from '@/shared/theme/spacing';

type SettingsSectionProps = {
  title: string;
  /** Plain `ActionRow`s with no rule of their own: the surface rules the hairlines between them. */
  children: React.ReactNode;
};

/**
 * One settings group (frame A): its uppercase head 8pt above a hairline-outlined surface, whose
 * rows are divided by full-width rules (`cardi-design-system.md` § _Settings_, Story 22.7).
 */
export const SettingsSection = ({ title, children }: SettingsSectionProps) => (
  <View style={styles.section}>
    <SectionHeader title={title} />
    <Surface divided>{children}</Surface>
  </View>
);

const styles = StyleSheet.create({
  // The design system's "sitting 8px above its rows" (Story 22.1).
  section: {
    gap: SPACING.sm
  }
});

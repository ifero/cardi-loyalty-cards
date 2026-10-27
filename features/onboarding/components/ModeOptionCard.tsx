import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/shared/theme';
// From the leaf module, not the `@/shared/theme` barrel, which several suites replace with a
// `useTheme`-only mock.
import { IDENTITY_COLORS } from '@/shared/theme/colors';
import { TOUCH_TARGET } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

type ModeOptionCardProps = {
  /** A Lucide icon, drawn at 24 / 1.5 in the card's disc. */
  icon: LucideIcon;
  title: string;
  subtitle: string;
  eyebrow?: string;
  recommended?: boolean;
  onPress: () => void;
  testID?: string;
};

/** The design system's icon: 24pt at a 1.5 stroke (§ _Icons_). */
const ICON_SIZE = 24;
const ICON_STROKE_WIDTH = 1.5;

/** The disc holding the icon: 48 across. */
const DISC_SIZE = 48;

/** The card's padding on every side. */
const CARD_PADDING = 20;
/** The pill straddles the card's top edge: its top sits this far above the border's inner edge. */
const PILL_OVERHANG = 11;
/**
 * The gap the pill leaves above the card's content at the default text size: a 26-tall pill, 11 of
 * it above the edge, inside the 20 padding.
 */
const PILL_CLEARANCE = 5;

/**
 * The recommended card's top padding: 20, until large text grows the pill past it — then enough to
 * keep the pill's clearance, so it never sits on the title.
 */
export const getRecommendedPaddingTop = (pillHeight: number): number =>
  Math.max(CARD_PADDING, pillHeight - PILL_OVERHANG + PILL_CLEARANCE);

/**
 * A storage option on mode selection — frame B, as `cardi-design-system.md` § _Onboarding_ rules
 * it (Story 22.10).
 *
 * `surface` at the card radius, padded 20, every card white on the ground: the recommended one is
 * told apart by a 2px `primary` outline and the beam "Recommended" pill on its top edge, not by a
 * wash. The pill is beam with ink text in both schemes — the brand's own pair, as the favourite
 * badge's plate is — because no theme role is beam in light.
 */
export const ModeOptionCard = ({
  icon: Icon,
  title,
  subtitle,
  eyebrow,
  recommended = false,
  onPress,
  testID
}: ModeOptionCardProps) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [pressed, setPressed] = React.useState(false);
  const [pillHeight, setPillHeight] = React.useState(0);

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}${recommended ? t('onboarding.modeOption.recommendedAccessibilitySuffix') : ''}`}
      accessibilityHint={t('onboarding.modeOption.accessibilityHint')}
      style={[
        styles.card,
        recommended ? styles.recommended : styles.plain,
        recommended ? { paddingTop: getRecommendedPaddingTop(pillHeight) } : null,
        {
          backgroundColor: theme.surface,
          borderColor: recommended ? theme.primary : theme.border
        },
        pressed ? styles.pressed : null
      ]}
    >
      <View style={styles.row}>
        <View
          testID={testID ? `${testID}-icon-disc` : undefined}
          style={[styles.disc, { backgroundColor: theme.background, borderColor: theme.border }]}
        >
          <Icon
            testID={testID ? `${testID}-icon` : undefined}
            size={ICON_SIZE}
            strokeWidth={ICON_STROKE_WIDTH}
            color={theme.textPrimary}
          />
        </View>

        <View style={styles.copy}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
          {eyebrow ? (
            <Text
              testID={testID ? `${testID}-eyebrow` : undefined}
              style={[
                styles.eyebrow,
                { color: recommended ? theme.textPrimary : theme.textSecondary }
              ]}
            >
              {eyebrow}
            </Text>
          ) : null}
        </View>
      </View>

      {recommended ? (
        <View
          testID={testID ? `${testID}-recommended` : undefined}
          onLayout={(event) => setPillHeight(event.nativeEvent.layout.height)}
          style={styles.pill}
        >
          <Text style={styles.pillLabel}>{t('onboarding.modeOption.recommended')}</Text>
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: TOUCH_TARGET.min,
    borderRadius: 16,
    padding: CARD_PADDING
  },
  recommended: {
    borderWidth: 2
  },
  plain: {
    borderWidth: 1
  },
  pressed: {
    opacity: 0.92
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16
  },
  disc: {
    width: DISC_SIZE,
    height: DISC_SIZE,
    borderRadius: DISC_SIZE / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  copy: {
    flex: 1,
    minWidth: 0
  },
  title: {
    ...TYPOGRAPHY.bodyLgStrong
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMd,
    marginTop: 4
  },
  eyebrow: {
    ...TYPOGRAPHY.labelBold,
    marginTop: 8
  },
  // Straddles the card's top edge, 16 in from its right.
  pill: {
    position: 'absolute',
    top: -PILL_OVERHANG,
    right: 16,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: IDENTITY_COLORS.beam
  },
  pillLabel: {
    ...TYPOGRAPHY.labelBold,
    color: IDENTITY_COLORS.ink
  }
});

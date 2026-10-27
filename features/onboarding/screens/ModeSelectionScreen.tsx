import { useRouter } from 'expo-router';
import CloudUpload from 'lucide-react-native/icons/cloud-upload';
import Smartphone from 'lucide-react-native/icons/smartphone';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isFirstLaunch } from '@/core/settings/settings-repository';

import { BottomSheet, Button, ScreenHeader } from '@/shared/components/ui';
import { useTheme } from '@/shared/theme';
import { LAYOUT, SPACING, TOUCH_TARGET } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import { ModeOptionCard } from '../components/ModeOptionCard';
import { useModeSelection } from '../hooks/useModeSelection';

/**
 * Mode selection — frame B, and the difference on the shared sheet (frame C), as
 * `cardi-design-system.md` § _Onboarding_ rules them (Story 22.10).
 *
 * `ScreenHeader` over a body that scrolls, without bouncing, once it outgrows the screen under
 * large text (Story 21.6). There is no primary action, so no footer: each card is the choice.
 */
const ModeSelectionScreen = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selectLocalMode, selectCloudMode } = useModeSelection();
  const [isDifferenceVisible, setIsDifferenceVisible] = React.useState(false);

  React.useEffect(() => {
    if (!isFirstLaunch()) {
      router.replace('/');
    }
  }, [router]);

  React.useEffect(() => {
    AccessibilityInfo.announceForAccessibility?.(t('onboarding.modeSelection.screenAnnouncement'));
  }, [t]);

  const closeDifference = () => setIsDifferenceVisible(false);

  return (
    <View
      testID="mode-selection-screen"
      style={[styles.root, { backgroundColor: theme.background, paddingTop: insets.top }]}
    >
      <ScreenHeader
        title={t('onboarding.modeSelection.title')}
        onBack={() => router.back()}
        testID="mode-selection-header"
        backTestID="mode-selection-back"
      />

      <ScrollView
        testID="mode-selection-scroll"
        style={styles.scroll}
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + SPACING.lg }]}
        alwaysBounceVertical={false}
      >
        <Text accessibilityRole="header" style={[styles.heading, { color: theme.textPrimary }]}>
          {t('onboarding.modeSelection.heading')}
        </Text>

        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t('onboarding.modeSelection.subtitle')}
        </Text>

        <View style={styles.cards}>
          <ModeOptionCard
            testID="mode-option-local"
            icon={Smartphone}
            title={t('onboarding.modeSelection.localTitle')}
            subtitle={t('onboarding.modeSelection.localSubtitle')}
            eyebrow={t('onboarding.modeSelection.localEyebrow')}
            recommended
            onPress={selectLocalMode}
          />

          <ModeOptionCard
            testID="mode-option-cloud"
            icon={CloudUpload}
            title={t('onboarding.modeSelection.cloudTitle')}
            subtitle={t('onboarding.modeSelection.cloudSubtitle')}
            eyebrow={t('onboarding.modeSelection.cloudEyebrow')}
            onPress={selectCloudMode}
          />
        </View>

        <Text style={[styles.footer, { color: theme.textSecondary }]}>
          {t('onboarding.modeSelection.footer')}
        </Text>

        <Pressable
          testID="mode-selection-whats-difference"
          onPress={() => setIsDifferenceVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.modeSelection.whatsDifferenceAccessibilityLabel')}
          style={styles.link}
        >
          <Text style={[styles.linkLabel, { color: theme.link }]}>
            {t('onboarding.modeSelection.whatsDifference')}
          </Text>
        </Pressable>
      </ScrollView>

      <BottomSheet
        visible={isDifferenceVisible}
        onClose={closeDifference}
        title={t('onboarding.infoTooltip.heading')}
        accessibilityLabel={t('onboarding.infoTooltip.accessibilityLabel')}
        testID="info-tooltip-modal"
        actions={
          <Button
            variant="primary"
            size="large"
            onPress={closeDifference}
            testID="info-tooltip-got-it"
          >
            {t('onboarding.infoTooltip.button')}
          </Button>
        }
      >
        <View testID="info-tooltip-paragraphs" style={styles.paragraphs}>
          <Text style={[styles.paragraph, { color: theme.textPrimary }]}>
            {t('onboarding.infoTooltip.bodyLocal')}
          </Text>
          <Text style={[styles.paragraph, { color: theme.textPrimary }]}>
            {t('onboarding.infoTooltip.bodyCloud')}
          </Text>
          <Text style={[styles.paragraph, { color: theme.textPrimary }]}>
            {t('onboarding.infoTooltip.bodySwitch')}
          </Text>
        </View>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  scroll: {
    flex: 1
  },
  body: {
    paddingHorizontal: LAYOUT.screenHorizontalMargin,
    paddingTop: SPACING.lg
  },
  heading: {
    ...TYPOGRAPHY.headlineMd,
    textAlign: 'center'
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMd,
    marginTop: SPACING.sm,
    textAlign: 'center'
  },
  cards: {
    marginTop: SPACING.lg,
    gap: SPACING.md
  },
  footer: {
    ...TYPOGRAPHY.bodyMd,
    marginTop: SPACING.xl,
    textAlign: 'center'
  },
  link: {
    marginTop: SPACING.sm,
    minHeight: TOUCH_TARGET.min,
    alignItems: 'center',
    justifyContent: 'center'
  },
  linkLabel: {
    ...TYPOGRAPHY.bodyMdStrong,
    textAlign: 'center',
    textDecorationLine: 'underline'
  },
  paragraphs: {
    gap: SPACING.md
  },
  paragraph: {
    ...TYPOGRAPHY.bodyMd
  }
});

export default ModeSelectionScreen;

import type { NavigationProp, NavigationState, ParamListBase } from '@react-navigation/native';
import { useIsFocused, useNavigation, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isFirstLaunch } from '@/core/settings/settings-repository';

import { Button, PrimaryActionFooter } from '@/shared/components/ui';
import { useTheme } from '@/shared/theme';
import { LAYOUT, SPACING, TOUCH_TARGET } from '@/shared/theme/spacing';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import markIntro from '@/assets/animations/onboarding/cardi-mark-intro.json';
import welcomeDark from '@/assets/animations/onboarding/onboarding-welcome-dark.json';
import welcomeLight from '@/assets/animations/onboarding/onboarding-welcome-light.json';

import { OnboardingAnimation } from '../components/OnboardingAnimation';

/** The mark's distance below the top inset. */
const MARK_TOP = 64;
/** The drawing's distance below the subtitle. */
const DRAWING_TOP = 40;

/**
 * The stack's `transitionEnd`, as `@react-navigation/native-stack` types it in
 * `NativeStackNavigationEventMap`. That package reaches this app through expo-router rather than as
 * a dependency of its own, so the one event read here is restated.
 */
type StackEvents = { transitionEnd: { data: { closing: boolean } } };
type WelcomeNavigation = NavigationProp<
  ParamListBase,
  string,
  string | undefined,
  NavigationState,
  object,
  StackEvents
>;

/**
 * Welcome — frame A, as `cardi-design-system.md` § _Onboarding_ rules it (Story 22.10).
 *
 * The mark's intro (brand moment D) and the welcome drawing start together once the screen's
 * entrance has ended (decision 5), so neither plays under its fade, and the drawing's fan opens as
 * the accent settles; they rest on their last frames from then on. The body
 * scrolls, without bouncing, once it outgrows the screen under large text (Story 21.6); the actions
 * are anchored in the primary-action footer, which overrules the frame's in-flow button as
 * capture's footer ruling did.
 */
const WelcomeScreen = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation<WelcomeNavigation>();
  const isFocused = useIsFocused();
  // Latches on the stack's first `transitionEnd` that is not closing: the entrance has ended.
  const [hasEntered, setHasEntered] = React.useState(false);

  React.useEffect(
    () =>
      navigation.addListener('transitionEnd', (event) => {
        if (!event.data.closing) {
          setHasEntered(true);
        }
      }),
    [navigation]
  );

  // Both play once the entrance has ended. Leaving before then, or mid-play — Get Started before
  // the drawing has finished — rests them, so coming back from mode selection replays nothing.
  const isActive = isFocused && hasEntered;
  const shouldRest = !isFocused;

  React.useEffect(() => {
    if (!isFirstLaunch()) {
      router.replace('/');
    }
  }, [router]);

  return (
    <View
      testID="welcome-screen"
      accessibilityLabel={t('onboarding.welcome.screenLabel')}
      style={[styles.root, { backgroundColor: theme.background }]}
    >
      <ScrollView
        testID="welcome-scroll"
        style={styles.scroll}
        contentContainerStyle={[styles.body, { paddingTop: insets.top + MARK_TOP }]}
        alwaysBounceVertical={false}
      >
        <OnboardingAnimation
          testID="welcome-branded-icon"
          light={markIntro}
          dark={markIntro}
          active={isActive}
          rest={shouldRest}
        />

        <Text
          testID="welcome-title"
          accessibilityRole="header"
          style={[styles.title, { color: theme.textPrimary }]}
        >
          {t('onboarding.welcome.title')}
        </Text>

        <Text testID="welcome-subtitle" style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t('onboarding.welcome.subtitle')}
        </Text>

        <View testID="welcome-drawing" style={styles.drawing}>
          <OnboardingAnimation
            testID="welcome-fanned-illustration"
            light={welcomeLight}
            dark={welcomeDark}
            active={isActive}
            rest={shouldRest}
          />
        </View>
      </ScrollView>

      <PrimaryActionFooter testID="welcome-footer">
        <View testID="welcome-footer-actions" style={styles.actions}>
          <Button
            variant="primary"
            size="large"
            onPress={() => router.push('/onboarding/mode-selection')}
            testID="welcome-get-started"
          >
            {t('onboarding.welcome.getStarted')}
          </Button>

          <Pressable
            testID="welcome-sign-in"
            onPress={() => router.push('/sign-in')}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.welcome.existingAccountAccessibilityLabel')}
            accessibilityHint={t('onboarding.welcome.existingAccountHint')}
            style={styles.link}
          >
            <Text style={[styles.linkLabel, { color: theme.link }]}>
              {t('onboarding.welcome.existingAccount')}
            </Text>
          </Pressable>
        </View>
      </PrimaryActionFooter>
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
    alignItems: 'center',
    paddingHorizontal: LAYOUT.screenHorizontalMargin,
    paddingBottom: SPACING.lg
  },
  title: {
    ...TYPOGRAPHY.displayLg,
    marginTop: SPACING.xl,
    textAlign: 'center'
  },
  subtitle: {
    ...TYPOGRAPHY.bodyLg,
    marginTop: SPACING.sm,
    textAlign: 'center'
  },
  drawing: {
    marginTop: DRAWING_TOP
  },
  // The link sits 16 below the primary. The footer's own 8 gap is for a stack of buttons.
  actions: {
    gap: SPACING.md
  },
  link: {
    minHeight: TOUCH_TARGET.min,
    alignItems: 'center',
    justifyContent: 'center'
  },
  linkLabel: {
    ...TYPOGRAPHY.bodyMdStrong,
    textAlign: 'center'
  }
});

export default WelcomeScreen;

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/theme';
import { LAYOUT, SPACING } from '@/shared/theme/spacing';

import { Button } from './Button';
import { PrimaryActionFooter } from './PrimaryActionFooter';
import { RequestErrorBanner } from './RequestErrorBanner';
import { ScreenHeader } from './ScreenHeader';
import { FieldLabel } from './TextField';

type FormPrimaryAction = {
  label: string;
  onPress: () => void;
  /**
   * A save in flight: the button keeps its fill, shows a spinner, is named "Saving..." and refuses
   * presses. Nothing else on the screen dims.
   */
  busy?: boolean;
  testID?: string;
};

type FormScreenProps = {
  /** The screen's title: centred in the header, and announced as its heading. */
  title: string;
  /** The header's back. A screen with unsaved changes asks before it leaves. */
  onBack: () => void;
  backTestID?: string;
  /**
   * The one primary action, anchored in the footer under its hairline and always enabled: pressing
   * it on an incomplete form is what reveals the field errors. Leave it out when there is nothing to
   * submit (edit's loading and error states) and the screen draws no footer.
   */
  primaryAction?: FormPrimaryAction;
  /**
   * A failed request, as the hook reports it: one banner above the first field, never a reddened
   * field. It clears when the next press starts a save, because the hook resets its error then.
   */
  requestError?: string | null;
  /** The scrolling body's testID. */
  bodyTestID?: string;
  /**
   * The root's testID, and the prefix of its parts': `-back` (unless `backTestID` names it),
   * `-header`, `-title`, `-banner-slot`, `-banner`, `-fields` and `-footer`.
   */
  testID?: string;
  /** The fields, top to bottom, 32pt apart. */
  children: React.ReactNode;
};

type FormFieldProps = {
  /** Sentence case — the form label uppercases it by style. */
  label: string;
  /** A control that is not a text input: the colour picker, a read-only value. */
  children: React.ReactNode;
  testID?: string;
};

/**
 * One field that is not a `TextField` — the colour picker, a read-only value — under the same
 * `label-bold` form label, 8pt above its control, as `TextField` sets its own.
 */
export const FormField = ({ label, children, testID }: FormFieldProps) => (
  <View testID={testID} style={styles.field}>
    <FieldLabel>{label}</FieldLabel>
    {children}
  </View>
);

/**
 * Whether the keyboard is up — tracked on Android only, where `KeyboardAvoidingView` must be
 * switched off once it has gone (see the keyboard note on `FormScreen`).
 */
const useIsAndroidKeyboardShown = () => {
  const [isShown, setIsShown] = useState(() => Platform.OS === 'android' && Keyboard.isVisible());

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }
    const subscriptions = [
      Keyboard.addListener('keyboardDidShow', () => setIsShown(true)),
      Keyboard.addListener('keyboardDidHide', () => setIsShown(false))
    ];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, []);

  return isShown;
};

/**
 * The form pattern (`cardi-design-system.md` § _Forms_, Story 22.6): the one shape every form
 * screen takes — a header, a top-aligned body of fields, and the primary action anchored in the
 * footer. Card setup and card edit draw it; the auth screens follow in Story 22.9.
 *
 * - **Ground.** `background` under every inset: a `SafeAreaView` on all four edges, outside the
 *   keyboard-avoiding view, so the footer's own bottom inset stays off.
 * - **Header.** `ScreenHeader` — capture frame A's: at least 48 tall with no rule, the back
 *   chevron's stroke on the 24pt margin, the title in `body-lg` semibold centred — wrapping rather
 *   than clipping under large text — and a 48pt spacer on the right.
 * - **Body.** A scroll view padded 24 on every side; fields 32 apart. A failed request is the first
 *   thing in it, 16 above the first field, and the body scrolls to the top to show it.
 * - **Footer.** `PrimaryActionFooter` holding one large primary `Button`, never in the scroll.
 *
 * **The keyboard.** The body and the footer share one `KeyboardAvoidingView` below the header, so
 * the footer rests on the keyboard's top edge and the body scrolls above it. `KeyboardAvoidingView`
 * measures its overlap from its own `onLayout` frame, which is relative to its PARENT, against the
 * keyboard's top edge in SCREEN coordinates. Its parent here is the full-screen `SafeAreaView` —
 * every form route hides the native header — so the two agree and no `keyboardVerticalOffset` is
 * needed. iOS takes `padding`.
 *
 * Android takes `padding` too, reasoned from the installed sources and unverified on an Android
 * device. SDK 55 makes edge-to-edge mandatory (`withEdgeToEdge` in `@expo/prebuild-config`), so
 * the root view runs from the top of the screen, as on iOS, and `padding` makes up only the
 * overlap that remains, whether or not the system also resizes the window. With no behaviour the
 * view would do nothing, and the keyboard would cover the footer. `keyboardDidShow` reports the
 * keyboard's top as its `screenY` (`ReactRootView`'s `checkForKeyboardEvents`), which is the edge
 * `padding` needs. `keyboardDidHide` instead reports the visible frame's HEIGHT — the status bar's
 * height short of that frame's bottom under edge-to-edge — and Android's `KeyboardAvoidingView`
 * runs the hide through the same overlap sum as a show, so it would keep that much padding under
 * the footer once the keyboard had gone. On Android the view is therefore enabled only while the
 * keyboard is up.
 */
export const FormScreen = ({
  title,
  onBack,
  backTestID,
  primaryAction,
  requestError,
  bodyTestID,
  testID = 'form-screen',
  children
}: FormScreenProps) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const isAndroidKeyboardShown = useIsAndroidKeyboardShown();

  // The banner is the first thing in the body: bring it into view whenever a request fails.
  useEffect(() => {
    if (requestError) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [requestError]);

  return (
    <SafeAreaView
      testID={testID}
      edges={['top', 'right', 'bottom', 'left']}
      style={[styles.root, { backgroundColor: theme.background }]}
    >
      <ScreenHeader
        title={title}
        onBack={onBack}
        testID={`${testID}-header`}
        titleTestID={`${testID}-title`}
        backTestID={backTestID ?? `${testID}-back`}
      />

      <KeyboardAvoidingView
        behavior="padding"
        enabled={Platform.OS !== 'android' || isAndroidKeyboardShown}
        style={styles.keyboard}
      >
        <ScrollView
          ref={scrollRef}
          testID={bodyTestID}
          style={styles.body}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {requestError ? (
            <View testID={`${testID}-banner-slot`} style={styles.banner}>
              <RequestErrorBanner message={requestError} testID={`${testID}-banner`} />
            </View>
          ) : null}
          <View testID={`${testID}-fields`} style={styles.fields}>
            {children}
          </View>
        </ScrollView>

        {primaryAction ? (
          <PrimaryActionFooter insetBottom={false} testID={`${testID}-footer`}>
            <Button
              variant="primary"
              size="large"
              onPress={primaryAction.onPress}
              loading={primaryAction.busy}
              testID={primaryAction.testID}
              accessibilityLabel={
                primaryAction.busy ? t('sharedUi.formScreen.saving') : primaryAction.label
              }
            >
              {primaryAction.label}
            </Button>
          </PrimaryActionFooter>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  keyboard: {
    flex: 1
  },
  body: {
    flex: 1
  },
  // Top-aligned, padded 24 on every side. `flexGrow` lets a state with nothing to submit centre
  // its message in the space below the header.
  content: {
    flexGrow: 1,
    paddingHorizontal: LAYOUT.screenHorizontalMargin,
    paddingVertical: SPACING.lg
  },
  banner: {
    marginBottom: SPACING.md
  },
  fields: {
    flexGrow: 1,
    gap: SPACING.xl
  },
  field: {
    gap: SPACING.sm
  }
});

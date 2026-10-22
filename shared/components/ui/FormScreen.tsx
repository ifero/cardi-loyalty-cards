import React, {
  Children,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  KeyboardAvoidingView,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/theme';
import { LAYOUT, SPACING } from '@/shared/theme/spacing';

import { Button } from './Button';
import { PrimaryActionFooter } from './PrimaryActionFooter';
import { RequestErrorBanner } from './RequestErrorBanner';
import { ScreenHeader } from './ScreenHeader';
import { FieldLabel } from './TextField';

/**
 * From this font scale up the way-out link closes the body instead of sitting in the footer (Story
 * 22.9, decision 3): at the largest sizes a footer holding the primary and its link, both wrapping,
 * took nearly the whole of a 375pt phone, and with the keyboard up left the body no room at all.
 * 1.5 is a cut-off between iOS's xxxLarge (1.353) and its first accessibility size (1.786), where
 * Android's 150% setting sits, as What We Collect's comment puts it: the breakpoint settings' rows
 * (`ActionRow`) and What We Collect restack at.
 */
const FOOTER_LINK_IN_BODY_MIN_FONT_SCALE = 1.5;

type FormPrimaryAction = {
  label: string;
  onPress: () => void;
  /**
   * A request in flight: the button keeps its fill, shows a spinner, is named for what it is doing
   * and refuses presses. Nothing else on the screen dims.
   */
  busy?: boolean;
  /**
   * The button's name while busy, saying what it is doing ("Signing in..."). "Saving..." when none
   * is given (Story 22.9).
   */
  busyLabel?: string;
  /** The button's name when it differs from its label: "Send password reset code". */
  accessibilityLabel?: string;
  testID?: string;
};

/** What a caller can ask of the form, through its `ref` (Story 22.9, review pass 1). */
export type FormScreenHandle = {
  /**
   * Brings one field — a child, counted from the first — into view by the focused field's rule,
   * whether or not it can take the focus, and keeps it there as the focused field is kept, as it
   * grows, until another field takes the focus. A refused press reveals its first invalid field
   * this way, with the message the press brings: the consent row, which takes no focus, or a text
   * field that already had it, which a second focus would not move. Needs `keepFocusedFieldInView`.
   */
  bringFieldIntoView: (index: number) => void;
};

/**
 * The header row. A screen is titled in its header (card setup, card edit) or by a heading that
 * leads its body, in the opening block (the auth screens, Story 22.9). A title always comes with a
 * back.
 */
type FormScreenHeaderProps =
  | {
      /** The screen's title: centred in the header, and announced as its heading. */
      title: string;
      /** The header's back. A screen with unsaved changes asks before it leaves. */
      onBack: () => void;
    }
  | {
      /** No title in the header: the screen's heading leads its body, in the opening block. */
      title?: undefined;
      /**
       * The back, alone in the header row, wherever the stack has a screen beneath. Without it there
       * is no header row at all, and the body starts at the top inset.
       */
      onBack?: () => void;
    };

type FormScreenProps = FormScreenHeaderProps & {
  /** React 19 passes `ref` as a prop: what the caller can ask of the form (`FormScreenHandle`). */
  ref?: React.Ref<FormScreenHandle>;
  backTestID?: string;
  /**
   * The one primary action, anchored in the footer under its hairline and always enabled: pressing
   * it on an incomplete form is what reveals the field errors. Leave it out when there is nothing to
   * submit (edit's loading and error states) and the screen draws no footer.
   */
  primaryAction?: FormPrimaryAction;
  /**
   * The way out, under the primary in the footer, 8 below it (Story 22.9): a link row such as "Don't
   * have an account? Create one". Drawn only with a primary action. From a font scale of 1.5 it
   * closes the body instead — the last thing in the scroll, 32 below the last field — so the footer
   * holds the primary alone (decision 3).
   */
  footerLink?: React.ReactNode;
  /**
   * What leads the body, above the banner and the fields and 32 above whichever comes first: the
   * auth screens' brand block (Story 22.9). With one, a failed request scrolls the body to the banner
   * rather than to the top, dismissing the keyboard first when one of the form's fields holds it —
   * which the form knows only with `keepFocusedFieldInView`.
   */
  openingBlock?: React.ReactNode;
  /**
   * A failed request, as the hook reports it: one banner above the first field, never a reddened
   * field. It clears when the next press starts a request, because the screen resets its error then.
   */
  requestError?: string | null;
  /** The banner's testID; `<testID>-banner` unless named. */
  bannerTestID?: string;
  /**
   * Brings the focused field, with its label, into view above the footer whenever focus moves or
   * the space the keyboard leaves changes (Story 22.9), and any field the caller asks for
   * (`FormScreenHandle`). Each child is then one field — a field and what hangs under it, such as
   * the password's strength meter — taking the 32pt gap as before. It is also how the form knows
   * that one of its fields holds the focus, which a failed request below an opening block needs
   * before it dismisses the keyboard.
   */
  keepFocusedFieldInView?: boolean;
  /** The scrolling body's testID. */
  bodyTestID?: string;
  /**
   * The root's testID, and the prefix of its parts': `-back` (unless `backTestID` names it),
   * `-header`, `-title`, `-opening`, `-banner-slot`, `-banner` (unless `bannerTestID` names it),
   * `-fields`, `-field-<n>` (with `keepFocusedFieldInView`), `-body-link` (the way out, from a font
   * scale of 1.5) and `-footer`.
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

/** Where one field sits inside the fields' column: its top, and its height down to its message. */
type FieldFrame = { y: number; height: number };

/**
 * The focused field brought into view (Story 22.9). React Native does not do it here: Fabric's iOS
 * scroll view moves a focused input only with `automaticallyAdjustKeyboardInsets`, and then above
 * the keyboard's top rather than above a footer that rides it, and the scroll responder's
 * `scrollResponderScrollNativeHandleToKeyboard` assumes a full-screen scroll view. So the form keeps
 * its own account of the geometry, from layout and scroll events:
 *
 * - each field's frame inside the fields' column, from its wrapper's layout, and the column's top
 *   inside the scrolled content;
 * - the visible body: the scroll view's height — what the keyboard-avoiding view leaves above the
 *   footer — and its offset;
 * - which field to keep in view: the one holding the focus, from the focus and blur events its
 *   text input sends up through the wrapper (both bubble, on iOS and on Android), or the one the
 *   caller last asked for (`bringFieldIntoView`, review pass 1), until another takes the focus.
 *
 * A field is brought into view when it takes the focus, when the caller asks for it, when the
 * visible body changes height — the keyboard showing or changing — and when the field kept in view
 * itself moves or grows. One that is already wholly in view does not move. One below the visible
 * body rises until its bottom sits 24pt above the footer, the body's own padding; one above it
 * comes down to 24pt below the body's top. Where the body cannot spare 24pt on both sides — iOS's
 * strong-password panel leaves a 375pt phone about 90 — the margins shrink evenly, so the field
 * still shows whole; and a field taller than the body shows its top, flush, where the label and the
 * input are.
 */
const useFocusedFieldInView = (scrollRef: React.RefObject<ScrollView | null>) => {
  const scrollY = useRef(0);
  const viewportHeight = useRef(0);
  const fieldsY = useRef(0);
  const frames = useRef(new Map<number, FieldFrame>());
  const followedIndex = useRef<number | null>(null);
  // The field holding the focus, from its own focus and blur alone: the one followed can also be a
  // field the caller asked for, which need not take the focus.
  const focusedIndex = useRef<number | null>(null);

  const bringIntoView = useCallback(
    (index: number) => {
      const frame = frames.current.get(index);
      if (!frame || viewportHeight.current <= 0) {
        return;
      }

      const top = fieldsY.current + frame.y;
      const bottom = top + frame.height;
      const visibleTop = scrollY.current;
      const visibleBottom = visibleTop + viewportHeight.current;
      if (top >= visibleTop && bottom <= visibleBottom) {
        return;
      }

      // 24pt on each side when the body can spare it; less, evenly, when it cannot; none when the
      // field is taller than the body.
      const margin = Math.max(0, Math.min(SPACING.lg, (viewportHeight.current - frame.height) / 2));
      const target =
        top < visibleTop
          ? top - margin
          : Math.min(bottom + margin - viewportHeight.current, top - margin);
      scrollRef.current?.scrollTo({ y: Math.max(0, target), animated: true });
    },
    [scrollRef]
  );

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
  }, []);

  const onViewportLayout = useCallback(
    (event: LayoutChangeEvent) => {
      viewportHeight.current = event.nativeEvent.layout.height;
      if (followedIndex.current !== null) {
        bringIntoView(followedIndex.current);
      }
    },
    [bringIntoView]
  );

  const onFieldsLayout = useCallback((event: LayoutChangeEvent) => {
    fieldsY.current = event.nativeEvent.layout.y;
  }, []);

  const fieldHandlers = useCallback(
    (index: number) => ({
      onLayout: (event: LayoutChangeEvent) => {
        const { y, height } = event.nativeEvent.layout;
        frames.current.set(index, { y, height });
        if (followedIndex.current === index) {
          bringIntoView(index);
        }
      },
      onFocus: () => {
        focusedIndex.current = index;
        followedIndex.current = index;
        bringIntoView(index);
      },
      onBlur: () => {
        if (focusedIndex.current === index) {
          focusedIndex.current = null;
        }
        if (followedIndex.current === index) {
          followedIndex.current = null;
        }
      }
    }),
    [bringIntoView]
  );

  // A field the caller asks for, focusable or not: in view now, and kept there as it grows — the
  // message a refused press brings lays it out again — until another field takes the focus.
  const bringFieldIntoView = useCallback(
    (index: number) => {
      followedIndex.current = index;
      bringIntoView(index);
    },
    [bringIntoView]
  );

  // No field is kept in view any more, until one takes the focus again: a failed request's banner
  // takes the body (review pass 2).
  const stopFollowing = useCallback(() => {
    followedIndex.current = null;
  }, []);

  const hasFocusedField = useCallback(() => focusedIndex.current !== null, []);

  return {
    onScroll,
    onViewportLayout,
    onFieldsLayout,
    fieldHandlers,
    bringFieldIntoView,
    stopFollowing,
    hasFocusedField
  };
};

/**
 * The form pattern (`cardi-design-system.md` § _Forms_, Story 22.6): the one shape every form
 * screen takes — a header, a top-aligned body of fields, and the primary action anchored in the
 * footer. Card setup and card edit draw it, and the six auth screens since Story 22.9.
 *
 * - **Ground.** `background` under every inset: a `SafeAreaView` on all four edges, outside the
 *   keyboard-avoiding view, so the footer's own bottom inset stays off.
 * - **Header.** `ScreenHeader` — capture frame A's: at least 48 tall with no rule, the back
 *   chevron's stroke on the 24pt margin, the title in `body-lg` semibold centred — wrapping rather
 *   than clipping under large text — and a 48pt spacer on the right. A screen whose heading leads
 *   its body passes no title, and the row holds the back alone; with no back either, there is no
 *   header row, and the body starts at the top inset.
 * - **Body.** A scroll view padded 24 on every side: the opening block when there is one, 32 above
 *   what follows; a failed request's banner, 16 above the first field; the fields 32 apart. A
 *   failure scrolls the body to show the banner: to the top, or to the banner itself below an
 *   opening block, the keyboard dismissed first when one of the form's fields holds it.
 * - **Footer.** `PrimaryActionFooter` holding one large primary `Button`, never in the scroll, and
 *   the way-out link 8 below it when there is one. From a font scale of 1.5 the link closes the
 *   body instead, 32 below the last field and scrolling with the fields, so the footer that rides
 *   the keyboard holds the primary alone (Story 22.9, decision 3).
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
 *
 * With `keepFocusedFieldInView`, the focused field is brought into view above the footer, and so is
 * any field the caller asks for through the form's `ref` (see `useFocusedFieldInView`).
 */
export const FormScreen = ({
  title,
  onBack,
  ref,
  backTestID,
  primaryAction,
  footerLink,
  openingBlock,
  requestError,
  bannerTestID,
  keepFocusedFieldInView = false,
  bodyTestID,
  testID = 'form-screen',
  children
}: FormScreenProps) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const isAndroidKeyboardShown = useIsAndroidKeyboardShown();
  const focusedField = useFocusedFieldInView(scrollRef);
  const { bringFieldIntoView, stopFollowing, hasFocusedField } = focusedField;
  useImperativeHandle(ref, () => ({ bringFieldIntoView }), [bringFieldIntoView]);
  const hasOpeningBlock = Boolean(openingBlock);
  const { fontScale } = useWindowDimensions();
  // The way out goes with a primary action, under it in the footer — or, from a font scale of 1.5,
  // closing the body (decision 3).
  const wayOut = primaryAction ? footerLink : null;
  const isWayOutInBody = fontScale >= FOOTER_LINK_IN_BODY_MIN_FONT_SCALE;

  // The banner's top inside the scrolled content, once it has been laid out, and whether a failure
  // is still waiting for that to scroll to it.
  const bannerY = useRef<number | null>(null);
  const isBannerScrollPending = useRef(false);

  // The banner sits 24pt below the body's top, where the first thing in it sits at rest.
  const scrollToBanner = useCallback((y: number) => {
    scrollRef.current?.scrollTo({ y: Math.max(0, y - SPACING.lg), animated: true });
  }, []);

  // Bring the banner into view whenever a request fails. It is the first thing in a body with no
  // opening block, so that is the top; below an opening block it is wherever the block leaves it,
  // which a tall block or large text can put below the fold. There the keyboard goes first, and no
  // field is kept in view any more (review pass 2): a field focused while the request ran would
  // otherwise sit under the footer once the body scrolls to the banner, and a field kept in view
  // would draw the body away from it at the next relayout. The keyboard goes only when one of this
  // form's own fields holds it (code-review loop, round 1): `Keyboard.dismiss()` blurs whichever
  // input has the focus, and a screen beneath a push still runs, so a request failing there would
  // close the keyboard of the screen in front. The form knows its fields' focus while it keeps the
  // focused field in view, as every screen with an opening block does.
  useEffect(() => {
    if (!requestError) {
      bannerY.current = null;
      isBannerScrollPending.current = false;
      return;
    }
    if (!hasOpeningBlock) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (hasFocusedField()) {
      Keyboard.dismiss();
    }
    stopFollowing();
    if (bannerY.current === null) {
      isBannerScrollPending.current = true;
    } else {
      scrollToBanner(bannerY.current);
    }
  }, [hasFocusedField, hasOpeningBlock, requestError, scrollToBanner, stopFollowing]);

  const handleBannerLayout = (event: LayoutChangeEvent) => {
    bannerY.current = event.nativeEvent.layout.y;
    if (isBannerScrollPending.current) {
      isBannerScrollPending.current = false;
      scrollToBanner(bannerY.current);
    }
  };

  const fields = keepFocusedFieldInView
    ? Children.map(children, (child, index) =>
        child === null || child === undefined || typeof child === 'boolean' ? null : (
          <View testID={`${testID}-field-${index}`} {...focusedField.fieldHandlers(index)}>
            {child}
          </View>
        )
      )
    : children;

  const primaryActionName = primaryAction?.busy
    ? (primaryAction.busyLabel ?? t('sharedUi.formScreen.saving'))
    : (primaryAction?.accessibilityLabel ?? primaryAction?.label);

  return (
    <SafeAreaView
      testID={testID}
      edges={['top', 'right', 'bottom', 'left']}
      style={[styles.root, { backgroundColor: theme.background }]}
    >
      {onBack ? (
        <ScreenHeader
          title={title}
          onBack={onBack}
          testID={`${testID}-header`}
          titleTestID={`${testID}-title`}
          backTestID={backTestID ?? `${testID}-back`}
        />
      ) : null}

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
          onLayout={keepFocusedFieldInView ? focusedField.onViewportLayout : undefined}
          onScroll={keepFocusedFieldInView ? focusedField.onScroll : undefined}
          scrollEventThrottle={keepFocusedFieldInView ? 16 : undefined}
        >
          {hasOpeningBlock ? (
            <View testID={`${testID}-opening`} style={styles.opening}>
              {openingBlock}
            </View>
          ) : null}
          {requestError ? (
            <View
              testID={`${testID}-banner-slot`}
              style={styles.banner}
              onLayout={hasOpeningBlock ? handleBannerLayout : undefined}
            >
              <RequestErrorBanner
                message={requestError}
                testID={bannerTestID ?? `${testID}-banner`}
              />
            </View>
          ) : null}
          <View
            testID={`${testID}-fields`}
            style={styles.fields}
            onLayout={keepFocusedFieldInView ? focusedField.onFieldsLayout : undefined}
          >
            {fields}
            {wayOut && isWayOutInBody ? <View testID={`${testID}-body-link`}>{wayOut}</View> : null}
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
              accessibilityLabel={primaryActionName}
            >
              {primaryAction.label}
            </Button>
            {isWayOutInBody ? null : wayOut}
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
  // 32 above the banner or the first field, as the auth frames set the first field below their
  // subtitle.
  opening: {
    marginBottom: SPACING.xl
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

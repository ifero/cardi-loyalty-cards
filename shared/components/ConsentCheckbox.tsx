/**
 * ConsentCheckbox
 * Story 6-4: Privacy Policy & Consent Flow
 * Story 22.9: Authentication — auth frame B's consent row
 *
 * Reusable controlled checkbox for privacy consent.
 * Renders "I agree to the Privacy Policy" with a tappable link
 * that navigates to `/privacy-policy`.
 *
 * Placed in `shared/components/` so that `features/auth/` (Story 6-6)
 * can use it during account creation without violating layer boundaries.
 */

import { useRouter } from 'expo-router';
import Check from 'lucide-react-native/icons/check';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { useTheme } from '../theme';
import { TOUCH_TARGET } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';
import { FieldError } from './ui/TextField';

/** The drawn box: 24 × 24 at radius 4 — the frame's proportion, since 12 would make it a radio. */
const BOX_SIZE = 24;
const BOX_RADIUS = 4;

/** The check, sized to its box as the colour picker's is to its swatch: Lucide `check` at 16 / 2. */
const CHECK_SIZE = 16;
const CHECK_STROKE_WIDTH = 2;

/**
 * The 48pt target holds the box centred, so it reaches this far past the box on every side. The row
 * starts that far into the margin, which puts the drawn box on the margin and the sentence 12 after
 * the box.
 */
const TARGET_INSET = (TOUCH_TARGET.min - BOX_SIZE) / 2;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConsentCheckboxProps = {
  /** Current checked state (controlled) */
  checked: boolean;
  /** Called with the new value when the user taps the checkbox area */
  onToggle: (value: boolean) => void;
  /** Optional custom handler for "Privacy Policy" link press. Defaults to navigating to /privacy-policy. */
  onPolicyPress?: () => void;
  /**
   * Consent refused at the press: the message shows under the row in the field-error idiom, and
   * the box's outline turns `error` until it is ticked.
   */
  error?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Auth frame B's consent row (`cardi-design-system.md` § _Authentication_, Story 22.9).
 *
 * - **The box**, 24 × 24 at radius 4. Unticked it is `surface` inside a 1pt `border` outline;
 *   ticked it is `primary` with Lucide `check` in `onPrimary` — white on ink, ink on beam.
 * - **Its target** is 48 × 48 with the box centred, and the box is centred on the sentence's first
 *   line at every text size. It stays the checkbox, with its name, hint and state.
 * - **The sentence** is `body-md` muted; "Privacy Policy" is `body-md` semibold in `link`,
 *   underlined, since it is a link inside prose. It is the one tappable under 48pt, as before: its
 *   target is its own words (Story 22.9, Found, not fixed 6).
 * - **Refused at the press**, the message shows under the row as a field error, and the box's
 *   outline turns `error` until it is ticked.
 */
const ConsentCheckbox = ({ checked, onToggle, onPolicyPress, error }: ConsentCheckboxProps) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { fontScale } = useWindowDimensions();

  // The sentence's first line grows with the text; the box's centre stays on it.
  const firstLineHeight = TYPOGRAPHY.bodyMd.lineHeight * fontScale;
  const centringOffset = (TOUCH_TARGET.min - firstLineHeight) / 2;

  const handleToggle = () => {
    onToggle(!checked);
  };

  const handlePolicyPress = () => {
    if (onPolicyPress) {
      onPolicyPress();
    } else {
      router.push('/privacy-policy');
    }
  };

  const outline = checked ? theme.primary : error ? theme.error : theme.border;

  return (
    <View testID="consent-checkbox">
      <View style={styles.row}>
        <Pressable
          testID="consent-checkbox-toggle"
          onPress={handleToggle}
          accessibilityRole="checkbox"
          accessibilityLabel={t('auth.consent.checkboxLabel')}
          accessibilityState={{ checked }}
          accessibilityHint={t('auth.consent.checkboxHint')}
          style={[styles.target, { marginTop: Math.max(0, -centringOffset) }]}
        >
          <View
            testID="consent-checkbox-box"
            style={[
              styles.box,
              { backgroundColor: checked ? theme.primary : theme.surface, borderColor: outline }
            ]}
          >
            {checked ? (
              <Check
                testID="consent-checkbox-check"
                size={CHECK_SIZE}
                strokeWidth={CHECK_STROKE_WIDTH}
                color={theme.onPrimary}
              />
            ) : null}
          </View>
        </Pressable>

        <Text
          testID="consent-sentence"
          style={[
            styles.sentence,
            { color: theme.textSecondary, marginTop: Math.max(0, centringOffset) }
          ]}
        >
          {`${t('auth.consent.labelPrefix')} `}
          <Text
            testID="consent-policy-link"
            onPress={handlePolicyPress}
            accessibilityRole="link"
            accessibilityHint={t('auth.consent.policyHint')}
            style={[styles.policy, { color: theme.link }]}
          >
            {t('auth.consent.policy')}
          </Text>
        </Text>
      </View>
      {error ? <FieldError testID="consent-error">{error}</FieldError> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  // Starts in the margin by the target's inset, so the drawn box, not the target, is on the margin.
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: -TARGET_INSET
  },
  target: {
    width: TOUCH_TARGET.min,
    height: TOUCH_TARGET.min,
    alignItems: 'center',
    justifyContent: 'center'
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: BOX_RADIUS,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sentence: {
    ...TYPOGRAPHY.bodyMd,
    flex: 1
  },
  policy: {
    ...TYPOGRAPHY.bodyMdStrong,
    textDecorationLine: 'underline'
  }
});

export default ConsentCheckbox;

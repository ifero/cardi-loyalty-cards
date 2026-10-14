/**
 * SearchBar Component
 * Story 13.2: Restyle Home Screen — AC3 (Search Bar)
 * Story 22.2: The wallet frames' search field
 * Story 22.5: Also the add-card brand list's field, which capture frame A draws exactly as this
 *
 * Visible when card count >= 2. The field from `cardi-wallet-frames.html`: the touch target tall,
 * a `surface` fill inside a 1px hairline at the 12pt control radius, a magnifier at the left and
 * a clear × at the right once there is something to clear. It is not a form field, so it carries
 * no visible label — its accessibility label names it instead.
 *
 * Its copy defaults to the wallet's. Another screen drawing the same field passes its own
 * placeholder and labels rather than drawing the field a second time.
 */

import Search from 'lucide-react-native/icons/search';
import X from 'lucide-react-native/icons/x';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View, Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/shared/theme';
import { SPACING, TOUCH_TARGET } from '@/shared/theme/spacing';
import { TYPOGRAPHY, inputFont } from '@/shared/theme/typography';

interface SearchBarProps {
  /** Current search text */
  value: string;
  /** Called when search text changes */
  onChangeText: (text: string) => void;
  /** Called when clear button is pressed */
  onClear: () => void;
  /** Test ID for testing */
  testID?: string;
  /** The placeholder. Defaults to the wallet's. */
  placeholder?: string;
  /** The field's name for assistive technology. Defaults to the wallet's. */
  accessibilityLabel?: string;
  /** The clear button's name for assistive technology. Defaults to the wallet's. */
  clearAccessibilityLabel?: string;
}

/** The control radius — buttons and inputs (`cardi-design-system.md` § _Shape_). */
const FIELD_RADIUS = 12;

/**
 * The frame's two glyphs. Their 1.8 stroke is in the icon's 24-unit grid, so the 20pt magnifier
 * draws it at 1.5px — the system's icon stroke — and the smaller × a touch finer.
 */
const SEARCH_ICON_SIZE = 20;
const CLEAR_ICON_SIZE = 18;
const ICON_STROKE_WIDTH = 1.8;

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  testID = 'search-bar',
  placeholder,
  accessibilityLabel,
  clearAccessibilityLabel
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;

  const handleClear = () => {
    onClear();
    inputRef.current?.focus();
  };

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          // Focus, as `TextField` shows it — not a value: a filled field at rest is still at rest.
          borderColor: isFocused ? theme.primary : theme.border
        }
      ]}
    >
      <Search
        testID={`${testID}-icon`}
        size={SEARCH_ICON_SIZE}
        strokeWidth={ICON_STROKE_WIDTH}
        color={theme.textSecondary}
      />
      <TextInput
        ref={inputRef}
        testID={`${testID}-input`}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder ?? t('cards.home.searchPlaceholder')}
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.textPrimary }]}
        accessibilityLabel={accessibilityLabel ?? t('cards.home.searchAccessibilityLabel')}
        accessibilityRole="search"
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {hasValue && (
        <Pressable
          testID={`${testID}-clear`}
          onPress={handleClear}
          accessibilityLabel={
            clearAccessibilityLabel ?? t('cards.home.clearSearchAccessibilityLabel')
          }
          accessibilityRole="button"
          style={styles.clearButton}
        >
          <X
            testID={`${testID}-clear-icon`}
            size={CLEAR_ICON_SIZE}
            strokeWidth={ICON_STROKE_WIDTH}
            color={theme.textSecondary}
          />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: TOUCH_TARGET.min,
    borderRadius: FIELD_RADIUS,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    // 16 + the 20pt magnifier + 8 starts the text 44pt in, where the frame's off-grid 14 / 10 put it.
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm
  },
  input: {
    ...inputFont(TYPOGRAPHY.bodyLg),
    flex: 1,
    // The full height of the field, so a tap above or below the text still focuses it. With no
    // platform padding, the field's own height sets the line, and the text starts where the
    // container's padding says.
    height: '100%',
    padding: 0
  },
  clearButton: {
    width: TOUCH_TARGET.min,
    height: TOUCH_TARGET.min,
    alignItems: 'center',
    justifyContent: 'center',
    // Flush with the field's right edge: the target takes back the field's own padding.
    marginRight: -SPACING.md
  }
});

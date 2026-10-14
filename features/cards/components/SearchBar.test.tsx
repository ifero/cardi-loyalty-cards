/**
 * SearchBar Component Tests
 * Story 13.2: Restyle Home Screen — AC3
 * Story 22.2: The wallet frames' search field
 */

import { render, screen, fireEvent } from '@testing-library/react-native';
import { StyleSheet, TextInput } from 'react-native';

import { SearchBar } from './SearchBar';

let mockIsDark = false;

// The real token values, so every role below is checked against what the app paints. Dark is the
// scheme where `primary` (beam) and `textPrimary` (cream) differ, so it is what catches a role
// swapped for its neighbour; in light both are ink.
jest.mock('@/shared/theme', () => {
  const { DARK_THEME, LIGHT_THEME } = jest.requireActual('@/shared/theme/colors');
  return {
    useTheme: () => ({ theme: mockIsDark ? DARK_THEME : LIGHT_THEME, isDark: mockIsDark })
  };
});

type Scheme = 'light' | 'dark';

const PALETTE: Record<
  Scheme,
  { surface: string; border: string; primary: string; textPrimary: string; textSecondary: string }
> = {
  light: {
    surface: '#FFFFFF',
    border: '#D6D6CB',
    primary: '#181824',
    textPrimary: '#181824',
    textSecondary: '#55555F'
  },
  dark: {
    surface: '#181824',
    border: '#3A3A48',
    primary: '#FCCC0C',
    textPrimary: '#F0F0E8',
    textSecondary: '#B5B5AB'
  }
};

const field = () =>
  StyleSheet.flatten(screen.getByTestId('search-bar').props.style) as Record<string, unknown>;

/** The icons are decorative — the field and the button carry the names — so they are hidden. */
const icon = (testID: string) => screen.getByTestId(testID, { includeHiddenElements: true });

describe('SearchBar', () => {
  const defaultProps = {
    value: '',
    onChangeText: jest.fn(),
    onClear: jest.fn()
  };

  afterEach(() => {
    mockIsDark = false;
  });

  describe('rendering', () => {
    it('renders the magnifier and the input', () => {
      render(<SearchBar {...defaultProps} />);

      expect(icon('search-bar-icon')).toBeTruthy();
      expect(screen.getByTestId('search-bar-input')).toBeTruthy();
    });

    it('shows placeholder text', () => {
      render(<SearchBar {...defaultProps} />);

      const input = screen.getByTestId('search-bar-input');
      expect(input.props.placeholder).toBe('Search loyalty cards');
    });

    it('does NOT show clear button when value is empty', () => {
      render(<SearchBar {...defaultProps} />);

      expect(screen.queryByTestId('search-bar-clear')).toBeNull();
    });

    it('shows clear button when value is non-empty', () => {
      render(<SearchBar {...defaultProps} value="test" />);

      expect(screen.getByTestId('search-bar-clear')).toBeTruthy();
    });

    it('draws no visible label: it is not a form field', () => {
      render(<SearchBar {...defaultProps} />);

      expect(screen.queryByText('Search loyalty cards')).toBeNull();
    });
  });

  describe('interactions', () => {
    it('calls onChangeText when typing', () => {
      const onChangeText = jest.fn();
      render(<SearchBar {...defaultProps} onChangeText={onChangeText} />);

      const input = screen.getByTestId('search-bar-input');
      fireEvent.changeText(input, 'ess');

      expect(onChangeText).toHaveBeenCalledWith('ess');
    });

    it('calls onClear when clear button is pressed', () => {
      const onClear = jest.fn();
      render(<SearchBar {...defaultProps} value="test" onClear={onClear} />);

      const clearBtn = screen.getByTestId('search-bar-clear');
      fireEvent.press(clearBtn);

      expect(onClear).toHaveBeenCalledTimes(1);
    });

    // The I/O matrix's Clear row: the query empties and focus stays in the field.
    it('keeps focus in the field when the query is cleared', () => {
      const focus = jest.spyOn(TextInput.prototype, 'focus');
      try {
        render(<SearchBar {...defaultProps} value="test" />);
        fireEvent.press(screen.getByTestId('search-bar-clear'));
        expect(focus).toHaveBeenCalledTimes(1);
      } finally {
        focus.mockRestore();
      }
    });
  });

  describe('accessibility', () => {
    it('has correct accessibility label on input', () => {
      render(<SearchBar {...defaultProps} />);

      const input = screen.getByLabelText('Search loyalty cards');
      expect(input).toBeTruthy();
    });

    // A screen reader announces it as a search field, not a plain text field.
    it('announces the input as a search field', () => {
      render(<SearchBar {...defaultProps} />);

      expect(screen.getByTestId('search-bar-input').props.accessibilityRole).toBe('search');
    });

    it('clear button has correct accessibility attributes', () => {
      render(<SearchBar {...defaultProps} value="test" />);

      const clearBtn = screen.getByLabelText('Clear search');
      expect(clearBtn).toBeTruthy();
      expect(clearBtn.props.accessibilityRole).toBe('button');
    });
  });

  // Story 22.5: the add-card brand list draws this same field with its own copy.
  describe('copy passed by another screen — Story 22.5', () => {
    const brandCopy = {
      placeholder: 'Search by name',
      accessibilityLabel: 'Search brands by name',
      clearAccessibilityLabel: 'Clear brand search'
    };

    it('takes the placeholder it is given', () => {
      render(<SearchBar {...defaultProps} {...brandCopy} />);

      expect(screen.getByTestId('search-bar-input').props.placeholder).toBe('Search by name');
    });

    it('names the field and the clear button with the labels it is given', () => {
      render(<SearchBar {...defaultProps} {...brandCopy} value="ess" />);

      expect(screen.getByLabelText('Search brands by name')).toBe(
        screen.getByTestId('search-bar-input')
      );
      expect(screen.getByLabelText('Clear brand search')).toBe(
        screen.getByTestId('search-bar-clear')
      );
      expect(screen.queryByLabelText('Search loyalty cards')).toBeNull();
    });

    it('keeps the wallet’s copy for any label it is not given', () => {
      render(<SearchBar {...defaultProps} placeholder="Search by name" value="ess" />);

      expect(screen.getByLabelText('Search loyalty cards')).toBeTruthy();
      expect(screen.getByLabelText('Clear search')).toBeTruthy();
    });
  });

  describe('the frame field — Story 22.2', () => {
    it('is the touch target tall, at the 12pt control radius, padded 16 with an 8pt gap', () => {
      render(<SearchBar {...defaultProps} />);

      expect(field()).toMatchObject({
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        gap: 8
      });
    });

    // The whole 48pt height is live: a tap above or below the text still lands in the input.
    it('fills the field’s height with the input, so the full target focuses it', () => {
      render(<SearchBar {...defaultProps} />);

      expect(StyleSheet.flatten(screen.getByTestId('search-bar-input').props.style)).toMatchObject({
        flex: 1,
        height: '100%'
      });
    });

    it('puts the clear × on a 48 × 48 target flush with the right edge', () => {
      render(<SearchBar {...defaultProps} value="test" />);

      expect(StyleSheet.flatten(screen.getByTestId('search-bar-clear').props.style)).toMatchObject({
        width: 48,
        height: 48,
        marginRight: -16
      });
    });

    describe.each<Scheme>(['light', 'dark'])('in %s', (scheme) => {
      const roles = PALETTE[scheme];

      beforeEach(() => {
        mockIsDark = scheme === 'dark';
      });

      it('fills with surface inside the hairline border at rest', () => {
        render(<SearchBar {...defaultProps} />);

        expect(field()).toMatchObject({
          backgroundColor: roles.surface,
          borderColor: roles.border
        });
      });

      // Focus, as TextField does — a value alone does not light the border.
      it('keeps the hairline border when filled but not focused', () => {
        render(<SearchBar {...defaultProps} value="Ikea" />);

        expect(field().borderColor).toBe(roles.border);
      });

      it('turns the border primary while focused, and back on blur', () => {
        render(<SearchBar {...defaultProps} value="Ikea" />);
        const input = screen.getByTestId('search-bar-input');

        fireEvent(input, 'focus');
        expect(field().borderColor).toBe(roles.primary);

        fireEvent(input, 'blur');
        expect(field().borderColor).toBe(roles.border);
      });

      it('sets the value in textPrimary and the placeholder in textSecondary', () => {
        render(<SearchBar {...defaultProps} />);
        const input = screen.getByTestId('search-bar-input');

        expect(StyleSheet.flatten(input.props.style).color).toBe(roles.textPrimary);
        expect(input.props.placeholderTextColor).toBe(roles.textSecondary);
      });

      it('draws the magnifier at 20 and the × at 18, both at a 1.8 stroke in textSecondary', () => {
        render(<SearchBar {...defaultProps} value="Ikea" />);

        expect(icon('search-bar-icon').props).toMatchObject({
          width: 20,
          height: 20,
          strokeWidth: 1.8,
          stroke: roles.textSecondary
        });
        expect(icon('search-bar-clear-icon').props).toMatchObject({
          width: 18,
          height: 18,
          strokeWidth: 1.8,
          stroke: roles.textSecondary
        });
      });
    });

    it('sets the input in body-lg without a line height, so iOS keeps it in the field', () => {
      render(<SearchBar {...defaultProps} />);
      const style = StyleSheet.flatten(screen.getByTestId('search-bar-input').props.style);

      expect(style).toMatchObject({ fontFamily: 'Inter', fontSize: 17, fontWeight: '400' });
      expect(style.lineHeight).toBeUndefined();
    });
  });
});

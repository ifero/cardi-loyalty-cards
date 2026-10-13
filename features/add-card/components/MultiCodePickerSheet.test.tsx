/**
 * MultiCodePickerSheet Tests
 * Story 2.9: Scan Cards from Image or Screenshot (AC5)
 * Story 22.5: Capture frame D's rows and Cancel
 */

import { act, render, fireEvent, screen, within } from '@testing-library/react-native';
import Barcode from 'lucide-react-native/icons/barcode';
import QrCode from 'lucide-react-native/icons/qr-code';
import React from 'react';
import { FlatList, Modal, StyleSheet, Text } from 'react-native';
import Svg from 'react-native-svg';

import { changeAppLanguage } from '@/shared/i18n';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import { MultiCodePickerSheet } from './MultiCodePickerSheet';
import { DetectedCode } from '../hooks/useImageScan';

let mockIsDark = false;

// The real token values, so every role below is checked against what the app paints. Dark is the
// scheme where `error` and `textPrimary` move apart from their light values.
jest.mock('@/shared/theme', () => {
  const { DARK_THEME, LIGHT_THEME } = jest.requireActual('@/shared/theme/colors');
  return {
    useTheme: () => ({ theme: mockIsDark ? DARK_THEME : LIGHT_THEME, isDark: mockIsDark })
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 })
}));

jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockReact = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockRN = require('react-native');

  const AnimatedView = mockReact.forwardRef((props: Record<string, unknown>, ref: unknown) =>
    mockReact.createElement(mockRN.View, { ...props, ref })
  );

  return {
    __esModule: true,
    default: { View: AnimatedView, Text: mockRN.Text },
    useSharedValue: (initial: number) => ({ value: initial }),
    useAnimatedStyle: () => ({}),
    // Holds every slide: a test finishes one by calling the callback it was handed.
    withTiming: jest.fn((value: number) => value),
    withRepeat: (value: number) => value,
    withSpring: (value: number) => value,
    useReducedMotion: () => false,
    Easing: {
      out: () => 'easing-fn',
      ease: 'ease'
    }
  };
});

type Scheme = 'light' | 'dark';

const PALETTE: Record<Scheme, { textPrimary: string; textSecondary: string; border: string }> = {
  light: { textPrimary: '#181824', textSecondary: '#55555F', border: '#D6D6CB' },
  dark: { textPrimary: '#F0F0E8', textSecondary: '#B5B5AB', border: '#3A3A48' }
};

const sampleCodes: DetectedCode[] = [
  { value: '1234567890128', format: 'EAN13' },
  { value: 'HTTPS://ESSELUNGA.IT', format: 'QR' }
];

const styleOf = (element: { props: { style?: unknown } }) =>
  StyleSheet.flatten(element.props.style) as Record<string, unknown>;

describe('MultiCodePickerSheet', () => {
  const defaultProps = {
    visible: true,
    codes: sampleCodes,
    onSelect: jest.fn(),
    onDismiss: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockIsDark = false;
  });

  it('presents nothing before the first multi-code scan', () => {
    const { UNSAFE_getByType, queryByTestId } = render(
      <MultiCodePickerSheet visible={false} codes={[]} onSelect={jest.fn()} onDismiss={jest.fn()} />
    );
    expect(UNSAFE_getByType(Modal).props.visible).toBe(false);
    expect(
      queryByTestId('multi-code-picker-sheet-content', { includeHiddenElements: true })
    ).toBeNull();
  });

  // Story 22.1, AC8 — BrandScannerScreen derives BOTH props from one list, and every way out
  // (Cancel, the scrim, a row, Android back) empties it. The picker used to return null on that
  // render, which unmounted the shared sheet before its slide-out could run.
  describe('closing', () => {
    const finishSlideOut = () => {
      const { withTiming } = jest.requireMock<{ withTiming: jest.Mock }>('react-native-reanimated');
      const slideOut = withTiming.mock.calls.at(-1)?.[2] as
        | ((finished: boolean) => void)
        | undefined;
      act(() => slideOut?.(true));
    };

    it('slides out with the rows it showed, though the caller empties them as it closes', () => {
      const { rerender, getByTestId, queryByTestId } = render(
        <MultiCodePickerSheet {...defaultProps} />
      );
      rerender(<MultiCodePickerSheet {...defaultProps} visible={false} codes={[]} />);
      expect(getByTestId('code-row-1', { includeHiddenElements: true })).toBeTruthy();

      finishSlideOut();
      expect(queryByTestId('code-row-0', { includeHiddenElements: true })).toBeNull();
    });

    it('shows the next scan its own codes', () => {
      const { rerender, getByText } = render(<MultiCodePickerSheet {...defaultProps} />);
      rerender(<MultiCodePickerSheet {...defaultProps} visible={false} codes={[]} />);
      finishSlideOut();

      rerender(
        <MultiCodePickerSheet
          {...defaultProps}
          codes={[{ value: '9780201379624', format: 'EAN13' }]}
        />
      );
      expect(getByText('9780201379624')).toBeTruthy();
    });
  });

  it('renders code rows when visible', () => {
    const { getByTestId } = render(<MultiCodePickerSheet {...defaultProps} />);
    expect(getByTestId('code-row-0')).toBeTruthy();
    expect(getByTestId('code-row-1')).toBeTruthy();
  });

  it('renders the correct number of code rows', () => {
    const { queryByTestId } = render(<MultiCodePickerSheet {...defaultProps} />);
    expect(queryByTestId('code-row-0')).toBeTruthy();
    expect(queryByTestId('code-row-1')).toBeTruthy();
    expect(queryByTestId('code-row-2')).toBeNull();
  });

  // Story 22.1, AC8 — the picker was the one hand-rolled sheet left: its own Modal, scrim, slide
  // and handle. It is now the shared BottomSheet, whose grabber is the spec's 36 × 4 (the size
  // this picker already drew; the shared sheet was the off-spec one).
  it('is drawn by the shared sheet, grabber included (AC8)', () => {
    const { getByTestId } = render(<MultiCodePickerSheet {...defaultProps} />);
    expect(getByTestId('multi-code-picker-sheet-content')).toBeTruthy();
    expect(
      StyleSheet.flatten(getByTestId('multi-code-picker-sheet-grabber').props.style)
    ).toMatchObject({ width: 36, height: 4 });
    expect(getByTestId('multi-code-cancel')).toBeTruthy();
  });

  it('announces its title as the sheet heading', () => {
    const { getByText } = render(<MultiCodePickerSheet {...defaultProps} />);
    expect(getByText('Multiple barcodes found').props.accessibilityRole).toBe('header');
  });

  it('renders the title and subtitle', () => {
    const { getByText } = render(<MultiCodePickerSheet {...defaultProps} />);
    expect(getByText('Multiple barcodes found')).toBeTruthy();
    expect(getByText('Tap the one that matches your loyalty card')).toBeTruthy();
  });

  it('calls onSelect with the correct code when a row is pressed', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(<MultiCodePickerSheet {...defaultProps} onSelect={onSelect} />);

    fireEvent.press(getByTestId('code-row-0'));

    expect(onSelect).toHaveBeenCalledWith(sampleCodes[0]);
  });

  it('calls onSelect with second code when second row is pressed', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(<MultiCodePickerSheet {...defaultProps} onSelect={onSelect} />);

    fireEvent.press(getByTestId('code-row-1'));

    expect(onSelect).toHaveBeenCalledWith(sampleCodes[1]);
  });

  // The shipped accessibility label survives the redesign.
  it('names Cancel as it shipped', () => {
    render(<MultiCodePickerSheet {...defaultProps} />);
    expect(screen.getByLabelText('Cancel, dismiss barcode picker')).toBe(
      screen.getByTestId('multi-code-cancel')
    );
  });

  // Rows grow with the text inside the sheet's 80 % cap, so the list must scroll whenever they
  // outrun it, however few there are — and must not rubber-band while they fit.
  it('keeps the list scrollable at any count, without bouncing at rest', () => {
    render(
      <MultiCodePickerSheet
        visible
        codes={[sampleCodes[0] as DetectedCode]}
        onSelect={jest.fn()}
        onDismiss={jest.fn()}
      />
    );
    const list = screen.UNSAFE_getByType(FlatList);

    expect(list.props.scrollEnabled).not.toBe(false);
    expect(list.props.alwaysBounceVertical).toBe(false);
  });

  it('calls onDismiss when cancel button is pressed', () => {
    const onDismiss = jest.fn();
    const { getByTestId } = render(
      <MultiCodePickerSheet {...defaultProps} onDismiss={onDismiss} />
    );

    fireEvent.press(getByTestId('multi-code-cancel'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when scrim is pressed', () => {
    const onDismiss = jest.fn();
    const { getByTestId } = render(
      <MultiCodePickerSheet {...defaultProps} onDismiss={onDismiss} />
    );

    // The shared sheet hides its scrim from assistive technology, so RNTL 13 skips it by
    // default; include hidden elements to locate and press it, as a finger would.
    fireEvent.press(getByTestId('multi-code-picker-sheet-scrim', { includeHiddenElements: true }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  // Android back reaches the sheet as the Modal's request to close.
  it('calls onDismiss when the platform asks the sheet to close', () => {
    const onDismiss = jest.fn();
    const { UNSAFE_getByType } = render(
      <MultiCodePickerSheet {...defaultProps} onDismiss={onDismiss} />
    );

    act(() => UNSAFE_getByType(Modal).props.onRequestClose());

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders EAN-13 format display name', () => {
    const { getByText } = render(<MultiCodePickerSheet {...defaultProps} />);
    expect(getByText('EAN-13')).toBeTruthy();
  });

  it('renders QR Code format display name', () => {
    const { getByText } = render(<MultiCodePickerSheet {...defaultProps} />);
    expect(getByText('QR Code')).toBeTruthy();
  });

  it.each<[DetectedCode['format'], string]>([
    ['CODE128', 'Code 128'],
    ['EAN13', 'EAN-13'],
    ['EAN8', 'EAN-8'],
    ['QR', 'QR Code'],
    ['CODE39', 'Code 39'],
    ['UPCA', 'UPC-A']
  ])('names the %s format "%s"', (format, name) => {
    render(<MultiCodePickerSheet {...defaultProps} codes={[{ value: 'X1', format }]} />);
    expect(screen.getByText(name)).toBeTruthy();
  });

  it('truncates long barcode values to 28 chars', () => {
    const longValue = 'A'.repeat(40);
    const { getByText } = render(
      <MultiCodePickerSheet
        visible
        codes={[{ value: longValue, format: 'CODE128' }]}
        onSelect={jest.fn()}
        onDismiss={jest.fn()}
      />
    );

    expect(getByText(`${'A'.repeat(28)}…`)).toBeTruthy();
  });

  it('does not truncate values at or under 28 chars', () => {
    const shortValue = 'A'.repeat(28);
    const { getByText } = render(
      <MultiCodePickerSheet
        visible
        codes={[{ value: shortValue, format: 'CODE128' }]}
        onSelect={jest.fn()}
        onDismiss={jest.fn()}
      />
    );

    expect(getByText(shortValue)).toBeTruthy();
  });

  it('renders up to 6 code rows', () => {
    const sixCodes: DetectedCode[] = Array.from({ length: 6 }, (_, i) => ({
      value: `CODE-${i}`,
      format: 'CODE128' as const
    }));

    const { getByTestId, queryByTestId } = render(
      <MultiCodePickerSheet visible codes={sixCodes} onSelect={jest.fn()} onDismiss={jest.fn()} />
    );

    for (let i = 0; i < 6; i++) {
      expect(getByTestId(`code-row-${i}`)).toBeTruthy();
    }
    expect(queryByTestId('code-row-6')).toBeNull();
  });

  it('uses the custom testID when provided', () => {
    const { getByTestId } = render(
      <MultiCodePickerSheet {...defaultProps} testID="custom-sheet" />
    );
    expect(getByTestId('custom-sheet')).toBeTruthy();
  });

  // Story 22.5 — capture frame D.
  describe('frame D', () => {
    // The rows run edge to edge — their rules span the sheet — with their content on the sheet's
    // 24pt margin, in line with the title above them. The LIST reaches past the sheet's padding:
    // its own scroll view clips the rows to its bounds, so a negative margin on a row never could.
    it('draws 64pt rows edge to edge with a 16pt gap, aligned with the title', () => {
      render(<MultiCodePickerSheet {...defaultProps} />);
      const row = styleOf(screen.getByTestId('code-row-0'));

      expect(styleOf(screen.UNSAFE_getByType(FlatList))).toMatchObject({ marginHorizontal: -24 });
      expect(row).toMatchObject({
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 64,
        paddingHorizontal: 24,
        gap: 16
      });
      expect(row.marginHorizontal).toBeUndefined();
    });

    // Large text grows a row rather than clipping it.
    it('lets a row grow rather than fixing its height', () => {
      render(<MultiCodePickerSheet {...defaultProps} />);
      expect(styleOf(screen.getByTestId('code-row-0')).height).toBeUndefined();
    });

    it('draws a barcode glyph for a linear code and a QR glyph for a QR code', () => {
      render(<MultiCodePickerSheet {...defaultProps} />);

      const linear = within(screen.getByTestId('code-row-0'));
      const qr = within(screen.getByTestId('code-row-1'));
      expect(linear.UNSAFE_getByType(Barcode)).toBeTruthy();
      expect(linear.UNSAFE_queryByType(QrCode)).toBeNull();
      expect(qr.UNSAFE_getByType(QrCode)).toBeTruthy();
      expect(qr.UNSAFE_queryByType(Barcode)).toBeNull();
    });

    // Nothing at the right: the old chevron went, and the glyph is the only icon.
    it('draws nothing after the labels', () => {
      render(<MultiCodePickerSheet {...defaultProps} />);
      expect(within(screen.getByTestId('code-row-0')).UNSAFE_queryAllByType(Svg)).toHaveLength(1);
    });

    it('puts the value above its format', () => {
      render(<MultiCodePickerSheet {...defaultProps} />);
      const texts = within(screen.getByTestId('code-row-0')).UNSAFE_getAllByType(Text);

      expect(texts.map((text) => text.props.children)).toEqual(['1234567890128', 'EAN-13']);
    });

    describe.each<Scheme>(['light', 'dark'])('in %s', (scheme) => {
      const roles = PALETTE[scheme];

      beforeEach(() => {
        mockIsDark = scheme === 'dark';
      });

      it('draws the glyph at 24 / 1.5 in textPrimary', () => {
        render(<MultiCodePickerSheet {...defaultProps} />);

        expect(
          screen.getByTestId('code-row-0-icon', { includeHiddenElements: true }).props
        ).toMatchObject({ width: 24, height: 24, strokeWidth: 1.5, stroke: roles.textPrimary });
      });

      it('sets the value in mono-code textPrimary and the format in caption textSecondary', () => {
        render(<MultiCodePickerSheet {...defaultProps} />);

        expect(styleOf(screen.getByText('1234567890128'))).toMatchObject({
          ...TYPOGRAPHY.monoCode,
          color: roles.textPrimary
        });
        expect(styleOf(screen.getByText('EAN-13'))).toMatchObject({
          ...TYPOGRAPHY.captionMd,
          color: roles.textSecondary
        });
      });

      it('rules each row with the system hairline', () => {
        render(<MultiCodePickerSheet {...defaultProps} />);

        for (const testID of ['code-row-0', 'code-row-1']) {
          expect(styleOf(screen.getByTestId(testID))).toMatchObject({
            borderBottomWidth: 1,
            borderBottomColor: roles.border
          });
        }
      });

      it('sets Cancel as plain centred body-lg textPrimary on a 48pt row, never red', () => {
        render(<MultiCodePickerSheet {...defaultProps} />);

        expect(styleOf(screen.getByTestId('multi-code-cancel'))).toMatchObject({
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48
        });
        expect(styleOf(screen.getByText('Cancel'))).toMatchObject({
          ...TYPOGRAPHY.bodyLg,
          color: roles.textPrimary
        });
      });
    });

    it.each(['code-row-0', 'multi-code-cancel'])(
      'scales %s to 0.98 while pressed and back when released, with no fill',
      (testID) => {
        render(<MultiCodePickerSheet {...defaultProps} />);
        const control = screen.getByTestId(testID);
        const style = () => styleOf(control);

        expect(style().transform).toBeUndefined();
        fireEvent(control, 'pressIn');
        expect(style().transform).toEqual([{ scale: 0.98 }]);
        expect(style().backgroundColor).toBeUndefined();
        fireEvent(control, 'pressOut');
        expect(style().transform).toBeUndefined();
      }
    );

    // The I/O matrix's screen-reader row: "{format}, code {value}", in the active language, with
    // the value whole even where the screen cuts it.
    describe('row names', () => {
      afterEach(async () => {
        await act(async () => {
          await changeAppLanguage('en');
        });
      });

      it('names each row "{format}, code {value}"', () => {
        render(<MultiCodePickerSheet {...defaultProps} />);

        expect(screen.getByTestId('code-row-0').props.accessibilityLabel).toBe(
          'EAN-13, code 1234567890128'
        );
        expect(screen.getByTestId('code-row-1').props.accessibilityLabel).toBe(
          'QR Code, code HTTPS://ESSELUNGA.IT'
        );
      });

      it('keeps the whole value in the name of a row whose value is cut on screen', () => {
        const longValue = 'A'.repeat(40);
        render(
          <MultiCodePickerSheet
            {...defaultProps}
            codes={[{ value: longValue, format: 'CODE128' }]}
          />
        );

        expect(screen.getByTestId('code-row-0').props.accessibilityLabel).toBe(
          `Code 128, code ${longValue}`
        );
      });

      it('names the rows and the formats in Italian', async () => {
        await act(async () => {
          await changeAppLanguage('it');
        });
        render(<MultiCodePickerSheet {...defaultProps} />);

        expect(screen.getByText('Codice QR')).toBeTruthy();
        expect(screen.getByTestId('code-row-1').props.accessibilityLabel).toBe(
          'Codice QR, codice HTTPS://ESSELUNGA.IT'
        );
        expect(screen.getByTestId('code-row-0').props.accessibilityLabel).toBe(
          'EAN-13, codice 1234567890128'
        );
      });
    });
  });
});

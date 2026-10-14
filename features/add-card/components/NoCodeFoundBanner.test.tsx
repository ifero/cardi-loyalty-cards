/**
 * NoCodeFoundBanner Tests
 * Story 2.9: Scan Cards from Image or Screenshot (AC6)
 * Story 22.5: Capture frame E's plate — no icon, 24pt margins, 48pt targets
 */

import { act, render, fireEvent, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import Svg from 'react-native-svg';

import { changeAppLanguage } from '@/shared/i18n';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import { NoCodeFoundBanner } from './NoCodeFoundBanner';

const CREAM = '#F0F0E8';
const BEAM = '#FCCC0C';

const styleOf = (element: { props: { style?: unknown } }) =>
  StyleSheet.flatten(element.props.style) as Record<string, unknown>;

describe('NoCodeFoundBanner', () => {
  const defaultProps = {
    onDismiss: jest.fn(),
    onRetry: jest.fn(),
    onManualEntry: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders with the correct default testID', () => {
    const { getByTestId } = render(<NoCodeFoundBanner {...defaultProps} />);
    expect(getByTestId('no-code-found-banner')).toBeTruthy();
  });

  it('renders with a custom testID', () => {
    const { getByTestId } = render(<NoCodeFoundBanner {...defaultProps} testID="custom-banner" />);
    expect(getByTestId('custom-banner')).toBeTruthy();
  });

  it('renders the notFound message by default', () => {
    const { getByText } = render(<NoCodeFoundBanner {...defaultProps} />);
    expect(
      getByText("We couldn't read a barcode in this image — try scanning the card itself")
    ).toBeTruthy();
  });

  // Story 16.23 (AC2): the two failure modes must not read the same. The old
  // single message claimed the image held no barcode even when it demonstrably
  // did, and even when the decoder never managed to open the file at all.
  it('renders the notFound message when reason is notFound', () => {
    const { getByText } = render(<NoCodeFoundBanner {...defaultProps} reason="notFound" />);
    expect(
      getByText("We couldn't read a barcode in this image — try scanning the card itself")
    ).toBeTruthy();
  });

  it('renders a distinct message when reason is scanFailed', () => {
    const { getByText, queryByText } = render(
      <NoCodeFoundBanner {...defaultProps} reason="scanFailed" />
    );
    expect(getByText('Something went wrong reading that image')).toBeTruthy();
    expect(
      queryByText("We couldn't read a barcode in this image — try scanning the card itself")
    ).toBeNull();
  });

  it('renders a distinct message when reason is pickerFailed', () => {
    // Deliberately does not mention "that image": the picker never handed us one,
    // so there is nothing about the user's choice for them to reconsider.
    const { getByText, queryByText } = render(
      <NoCodeFoundBanner {...defaultProps} reason="pickerFailed" />
    );
    expect(getByText("We couldn't open your photos")).toBeTruthy();
    expect(queryByText('Something went wrong reading that image')).toBeNull();
  });

  it('uses a retry label that does not presume a first image for pickerFailed', () => {
    const { getByText, queryByText } = render(
      <NoCodeFoundBanner {...defaultProps} reason="pickerFailed" />
    );
    expect(getByText('Try again')).toBeTruthy();
    expect(queryByText('Try another image')).toBeNull();
  });

  it.each(['notFound', 'scanFailed'] as const)(
    'keeps the shared retry label for reason %s',
    (reason) => {
      const { getByText } = render(<NoCodeFoundBanner {...defaultProps} reason={reason} />);
      expect(getByText('Try another image')).toBeTruthy();
    }
  );

  it('still calls onRetry from the pickerFailed retry button', () => {
    // Only the wording changes; the behaviour must be identical.
    const onRetry = jest.fn();
    const { getByTestId } = render(
      <NoCodeFoundBanner {...defaultProps} reason="pickerFailed" onRetry={onRetry} />
    );
    fireEvent.press(getByTestId('banner-retry-image'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('announces the reason-specific message to screen readers', () => {
    const { getByTestId } = render(<NoCodeFoundBanner {...defaultProps} reason="scanFailed" />);
    expect(getByTestId('no-code-found-banner').props.accessibilityLabel).toBe(
      'Something went wrong reading that image'
    );
  });

  it('renders close, retry, and manual entry controls', () => {
    const { getByTestId } = render(<NoCodeFoundBanner {...defaultProps} />);
    expect(getByTestId('banner-close')).toBeTruthy();
    expect(getByTestId('banner-retry-image')).toBeTruthy();
    expect(getByTestId('banner-manual-entry')).toBeTruthy();
  });

  it('renders correct action link labels', () => {
    const { getByText } = render(<NoCodeFoundBanner {...defaultProps} />);
    expect(getByText('Try another image')).toBeTruthy();
    expect(getByText('Enter it manually')).toBeTruthy();
  });

  describe('in Italian', () => {
    afterEach(async () => {
      await act(async () => {
        await changeAppLanguage('en');
      });
    });

    it('labels the manual-entry link "Inseriscilo manualmente"', async () => {
      await act(async () => {
        await changeAppLanguage('it');
      });
      render(<NoCodeFoundBanner {...defaultProps} />);

      expect(screen.getByText('Inseriscilo manualmente')).toBeTruthy();
    });
  });

  it('names each control for a screen reader', () => {
    render(<NoCodeFoundBanner {...defaultProps} />);

    expect(screen.getByLabelText('Dismiss error message')).toBe(screen.getByTestId('banner-close'));
    expect(screen.getByLabelText('Try scanning a different image')).toBe(
      screen.getByTestId('banner-retry-image')
    );
    expect(screen.getByLabelText('Enter the card number manually')).toBe(
      screen.getByTestId('banner-manual-entry')
    );
  });

  it('calls onDismiss when close button is pressed', () => {
    const onDismiss = jest.fn();
    const { getByTestId } = render(<NoCodeFoundBanner {...defaultProps} onDismiss={onDismiss} />);

    fireEvent.press(getByTestId('banner-close'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onRetry when "Try another image" is pressed', () => {
    const onRetry = jest.fn();
    const { getByTestId } = render(<NoCodeFoundBanner {...defaultProps} onRetry={onRetry} />);

    fireEvent.press(getByTestId('banner-retry-image'));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onManualEntry when "Enter it manually" is pressed', () => {
    const onManualEntry = jest.fn();
    const { getByTestId } = render(
      <NoCodeFoundBanner {...defaultProps} onManualEntry={onManualEntry} />
    );

    fireEvent.press(getByTestId('banner-manual-entry'));

    expect(onManualEntry).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after 5 seconds', () => {
    const onDismiss = jest.fn();
    render(<NoCodeFoundBanner {...defaultProps} onDismiss={onDismiss} />);

    expect(onDismiss).not.toHaveBeenCalled();

    jest.advanceTimersByTime(5000);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not auto-dismiss before 5 seconds', () => {
    const onDismiss = jest.fn();
    render(<NoCodeFoundBanner {...defaultProps} onDismiss={onDismiss} />);

    jest.advanceTimersByTime(4999);

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('clears the auto-dismiss timer on unmount', () => {
    const onDismiss = jest.fn();
    const { unmount } = render(<NoCodeFoundBanner {...defaultProps} onDismiss={onDismiss} />);

    unmount();
    jest.advanceTimersByTime(6000);

    expect(onDismiss).not.toHaveBeenCalled();
  });

  // Story 22.5 — capture frame E.
  describe('frame E', () => {
    it('is an 80 % black plate at the 12pt radius, padded 16, on the 24pt margins', () => {
      render(<NoCodeFoundBanner {...defaultProps} />);

      expect(styleOf(screen.getByTestId('no-code-found-banner'))).toMatchObject({
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 24
      });
    });

    // The plate grows with large text rather than clipping the message.
    it('has no fixed height', () => {
      render(<NoCodeFoundBanner {...defaultProps} />);
      const plate = styleOf(screen.getByTestId('no-code-found-banner'));

      expect(plate.height).toBeUndefined();
      expect(plate.maxHeight).toBeUndefined();
    });

    it('carries no icon: the dismiss × is the only glyph on the plate', () => {
      render(<NoCodeFoundBanner {...defaultProps} />);

      const glyphs = screen.UNSAFE_queryAllByType(Svg);
      expect(glyphs).toHaveLength(1);
      expect(glyphs[0]?.props.testID).toBe('banner-close-icon');
    });

    it('sets the message in body-md cream', () => {
      render(<NoCodeFoundBanner {...defaultProps} />);

      expect(
        styleOf(
          screen.getByText(
            "We couldn't read a barcode in this image — try scanning the card itself"
          )
        )
      ).toMatchObject({ ...TYPOGRAPHY.bodyMd, color: CREAM });
    });

    it('draws the × as Lucide x at 18 in the 60 % white dismiss role', () => {
      render(<NoCodeFoundBanner {...defaultProps} />);

      expect(
        screen.getByTestId('banner-close-icon', { includeHiddenElements: true }).props
      ).toMatchObject({ width: 18, height: 18, stroke: 'rgba(255, 255, 255, 0.6)' });
    });

    // A 48pt box that gives its overhang back in negative margins: it sits in the 18pt glyph's
    // slot on the plate's padding, so the plate does not grow — and the overhang fits the padding.
    it('puts the × on a 48pt target of its own without growing the plate', () => {
      render(<NoCodeFoundBanner {...defaultProps} />);

      const target = styleOf(screen.getByTestId('banner-close'));
      expect(target).toMatchObject({ width: 48, height: 48, margin: -15 });
      expect(-(target.margin as number)).toBeLessThan(16);
    });

    // The banner's two links are one of only two places beam is drawn on the scanner.
    it.each(['Try another image', 'Enter it manually'])('sets "%s" in caption beam', (label) => {
      render(<NoCodeFoundBanner {...defaultProps} />);

      expect(styleOf(screen.getByText(label))).toMatchObject({
        ...TYPOGRAPHY.captionMd,
        color: BEAM
      });
    });

    // Each link is its 18pt line plus 4 + 4 of padding (26pt); the slop adds 11 above and below.
    it.each(['banner-retry-image', 'banner-manual-entry'])(
      'gives the %s link a 48pt target through its hitSlop',
      (testID) => {
        render(<NoCodeFoundBanner {...defaultProps} />);
        const link = screen.getByTestId(testID);
        const { paddingVertical } = styleOf(link) as { paddingVertical: number };
        const { top, bottom } = link.props.hitSlop as { top: number; bottom: number };

        expect(TYPOGRAPHY.captionMd.lineHeight + 2 * paddingVertical + top + bottom).toBe(48);
      }
    );

    // The slop is vertical only, so each link is at least 48pt wide on its own: a short label
    // (Italian "Riprova", about 46pt) would otherwise leave a narrower target.
    it.each(['banner-retry-image', 'banner-manual-entry'])(
      'gives the %s link at least 48pt of width',
      (testID) => {
        render(<NoCodeFoundBanner {...defaultProps} />);
        expect(styleOf(screen.getByTestId(testID)).minWidth).toBe(48);
      }
    );

    // Wrapped, the links stay a full slop band apart (11 below the first + 11 above the second),
    // so neither target overlaps the other and steals its taps.
    it('keeps wrapped links a full slop band apart, so their targets never overlap', () => {
      render(<NoCodeFoundBanner {...defaultProps} />);
      const { top, bottom } = screen.getByTestId('banner-retry-image').props.hitSlop as {
        top: number;
        bottom: number;
      };

      expect(styleOf(screen.getByTestId('no-code-found-banner-links')).rowGap).toBe(bottom + top);
    });

    // Neither platform delivers a touch to a view's slop where it lies outside the view's parent
    // (an overflowing frame is hit-tested; slop is not), so the links' row must CONTAIN their
    // slop. It pads by the slop and takes it back in margins: 8pt below the message, and the
    // plate as tall as before.
    it('stretches the links’ row over their slop, 8pt below the message and 16pt apart', () => {
      render(<NoCodeFoundBanner {...defaultProps} />);
      const row = screen.getByTestId('no-code-found-banner-links');

      expect(styleOf(row)).toMatchObject({
        flexDirection: 'row',
        columnGap: 16,
        paddingVertical: 11,
        marginTop: 8 - 11,
        marginBottom: -11
      });
      // The row itself takes no touches, so where it overlaps the ×'s target the × still wins.
      expect(row.props.pointerEvents).toBe('box-none');
    });

    it.each(['banner-close', 'banner-retry-image', 'banner-manual-entry'])(
      'scales %s to 0.98 while pressed and back when released',
      (testID) => {
        render(<NoCodeFoundBanner {...defaultProps} />);
        const control = screen.getByTestId(testID);
        const scale = () => styleOf(control).transform;

        expect(scale()).toBeUndefined();
        fireEvent(control, 'pressIn');
        expect(scale()).toEqual([{ scale: 0.98 }]);
        fireEvent(control, 'pressOut');
        expect(scale()).toBeUndefined();
      }
    );
  });
});

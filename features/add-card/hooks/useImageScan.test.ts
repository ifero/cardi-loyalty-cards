/**
 * useImageScan Hook Tests
 * Story 2.9: Scan Cards from Image or Screenshot
 */

import { renderHook, act } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import ImageCodeScanner, {
  BarcodeFormat as ImageBarcodeFormat
} from 'react-native-image-code-scanner';

import { logger } from '@/core/utils';

import { ScanResult } from '@/features/cards/hooks/useBarcodeScanner';

import { useImageScan } from './useImageScan';

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn()
}));

// Only `logger.notify` is stubbed; `normalizeBarcode` / `applyExpectedFormat`
// stay REAL because most assertions below depend on their actual behaviour
// (the Conad leading-zero recovery in particular).
jest.mock('@/core/utils', () => {
  const actual = jest.requireActual('@/core/utils');
  return { ...actual, logger: { ...actual.logger, notify: jest.fn() } };
});

jest.mock('react-native-image-code-scanner', () => ({
  __esModule: true,
  default: {
    scan: jest.fn()
  },
  BarcodeFormat: {
    CODE_128: 'CODE_128',
    CODE_39: 'CODE_39',
    EAN_13: 'EAN_13',
    EAN_8: 'EAN_8',
    QR_CODE: 'QR_CODE',
    UPC_A: 'UPC_A'
  }
}));

const mockLaunch = ImagePicker.launchImageLibraryAsync as jest.Mock;
const mockScanImage = ImageCodeScanner.scan as jest.Mock;
const mockNotify = logger.notify as jest.Mock;

/** Shape of a React Native native-module rejection: an Error carrying a `code`. */
const nativeRejection = (code: string, message: string): Error =>
  Object.assign(new Error(message), { code });

const CANCELLED_RESULT: ImagePicker.ImagePickerResult = {
  canceled: true,
  assets: null
};

const assetResult = (uri: string): ImagePicker.ImagePickerResult => ({
  canceled: false,
  assets: [
    {
      uri,
      width: 800,
      height: 600,
      assetId: null,
      base64: null,
      duration: null,
      exif: null,
      fileName: 'test.jpg',
      fileSize: 12345,
      mimeType: 'image/jpeg',
      pairedVideoAsset: null,
      type: 'image'
    }
  ]
});

describe('useImageScan', () => {
  let onCodeResolved: jest.Mock<void, [ScanResult]>;

  beforeEach(() => {
    jest.clearAllMocks();
    onCodeResolved = jest.fn();
  });

  it('does nothing when user cancels the picker', async () => {
    mockLaunch.mockResolvedValueOnce(CANCELLED_RESULT);

    const { result } = renderHook(() => useImageScan({ onCodeResolved }));

    await act(async () => {
      await result.current.pickAndScan();
    });

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.showError).toBe(false);
    expect(result.current.multiCodes).toHaveLength(0);
    expect(onCodeResolved).not.toHaveBeenCalled();
  });

  it('sets showError when no barcodes found in image', async () => {
    mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
    mockScanImage.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useImageScan({ onCodeResolved }));

    await act(async () => {
      await result.current.pickAndScan();
    });

    expect(result.current.showError).toBe(true);
    expect(result.current.isProcessing).toBe(false);
    expect(onCodeResolved).not.toHaveBeenCalled();
  });

  it('calls onCodeResolved with correct args when exactly 1 barcode found', async () => {
    mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
    mockScanImage.mockResolvedValueOnce([
      { content: '1234567890128', format: ImageBarcodeFormat.EAN_13 }
    ]);

    const { result } = renderHook(() => useImageScan({ onCodeResolved }));

    await act(async () => {
      await result.current.pickAndScan();
    });

    expect(onCodeResolved).toHaveBeenCalledWith({
      barcode: '1234567890128',
      format: 'EAN13'
    });
    expect(result.current.showError).toBe(false);
    expect(result.current.multiCodes).toHaveLength(0);
  });

  it('preserves leading zeros in barcode data (AC3)', async () => {
    mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
    mockScanImage.mockResolvedValueOnce([
      { content: '0012345678901', format: ImageBarcodeFormat.EAN_13 }
    ]);

    const { result } = renderHook(() => useImageScan({ onCodeResolved }));

    await act(async () => {
      await result.current.pickAndScan();
    });

    expect(onCodeResolved).toHaveBeenCalledWith({
      barcode: '0012345678901',
      format: 'EAN13'
    });
  });

  it('sets multiCodes when 2+ barcodes found', async () => {
    mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
    mockScanImage.mockResolvedValueOnce([
      { content: 'CODE-A', format: ImageBarcodeFormat.CODE_128 },
      { content: 'CODE-B', format: ImageBarcodeFormat.CODE_39 }
    ]);

    const { result } = renderHook(() => useImageScan({ onCodeResolved }));

    await act(async () => {
      await result.current.pickAndScan();
    });

    expect(result.current.multiCodes).toHaveLength(2);
    expect(result.current.multiCodes[0]).toEqual({ value: 'CODE-A', format: 'CODE128' });
    expect(result.current.multiCodes[1]).toEqual({ value: 'CODE-B', format: 'CODE39' });
    expect(onCodeResolved).not.toHaveBeenCalled();
  });

  it('caps multiCodes at 6 when more than 6 barcodes present', async () => {
    mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
    mockScanImage.mockResolvedValueOnce(
      Array.from({ length: 9 }, (_, i) => ({
        content: `CODE-${i}`,
        format: ImageBarcodeFormat.CODE_128
      }))
    );

    const { result } = renderHook(() => useImageScan({ onCodeResolved }));

    await act(async () => {
      await result.current.pickAndScan();
    });

    expect(result.current.multiCodes).toHaveLength(6);
  });

  it('sets showError and clears isProcessing when ImageCodeScanner.scan throws', async () => {
    mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
    mockScanImage.mockRejectedValueOnce(new Error('Decode failed'));

    const { result } = renderHook(() => useImageScan({ onCodeResolved }));

    await act(async () => {
      await result.current.pickAndScan();
    });

    expect(result.current.showError).toBe(true);
    expect(result.current.isProcessing).toBe(false);
    expect(onCodeResolved).not.toHaveBeenCalled();
  });

  it('dismissError clears showError', async () => {
    mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
    mockScanImage.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useImageScan({ onCodeResolved }));

    await act(async () => {
      await result.current.pickAndScan();
    });

    expect(result.current.showError).toBe(true);

    act(() => {
      result.current.dismissError();
    });

    expect(result.current.showError).toBe(false);
  });

  it('dismissMultiPicker clears multiCodes', async () => {
    mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
    mockScanImage.mockResolvedValueOnce([
      { content: 'A', format: ImageBarcodeFormat.CODE_128 },
      { content: 'B', format: ImageBarcodeFormat.CODE_128 }
    ]);

    const { result } = renderHook(() => useImageScan({ onCodeResolved }));

    await act(async () => {
      await result.current.pickAndScan();
    });

    expect(result.current.multiCodes).toHaveLength(2);

    act(() => {
      result.current.dismissMultiPicker();
    });

    expect(result.current.multiCodes).toHaveLength(0);
  });

  it('selectCode clears multiCodes and calls onCodeResolved', async () => {
    mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
    mockScanImage.mockResolvedValueOnce([
      { content: 'SELECTED', format: ImageBarcodeFormat.QR_CODE },
      { content: 'OTHER', format: ImageBarcodeFormat.CODE_128 }
    ]);

    const { result } = renderHook(() => useImageScan({ onCodeResolved }));

    await act(async () => {
      await result.current.pickAndScan();
    });

    act(() => {
      result.current.selectCode({ value: 'SELECTED', format: 'QR' });
    });

    expect(result.current.multiCodes).toHaveLength(0);
    expect(onCodeResolved).toHaveBeenCalledWith({ barcode: 'SELECTED', format: 'QR' });
  });

  it('maps all supported barcode format types correctly', async () => {
    const formats: Array<{ type: ImageBarcodeFormat; expected: string }> = [
      { type: ImageBarcodeFormat.CODE_128, expected: 'CODE128' },
      { type: ImageBarcodeFormat.EAN_13, expected: 'EAN13' },
      { type: ImageBarcodeFormat.EAN_8, expected: 'EAN8' },
      { type: ImageBarcodeFormat.QR_CODE, expected: 'QR' },
      { type: ImageBarcodeFormat.CODE_39, expected: 'CODE39' },
      { type: ImageBarcodeFormat.UPC_A, expected: 'UPCA' }
    ];

    for (const { type, expected } of formats) {
      jest.clearAllMocks();
      const cb = jest.fn();

      mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
      mockScanImage.mockResolvedValueOnce([{ content: 'VALUE', format: type }]);

      const { result } = renderHook(() => useImageScan({ onCodeResolved: cb }));

      await act(async () => {
        await result.current.pickAndScan();
      });

      expect(cb).toHaveBeenCalledWith(expect.objectContaining({ format: expected }));
    }
  });

  it('auto-corrects CODE128 to EAN13 when code is valid EAN-13 (13 digits + valid checksum)', async () => {
    mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
    // 0226007855218 is a valid EAN-13 (from your Conad card example)
    mockScanImage.mockResolvedValueOnce([
      { content: '0226007855218', format: ImageBarcodeFormat.CODE_128 }
    ]);

    const { result } = renderHook(() => useImageScan({ onCodeResolved }));

    await act(async () => {
      await result.current.pickAndScan();
    });

    expect(onCodeResolved).toHaveBeenCalledWith({
      barcode: '0226007855218',
      format: 'EAN13'
    });
  });

  it('keeps CODE128 when code is 13 digits but invalid EAN-13 checksum', async () => {
    mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
    // Valid format but wrong checksum
    mockScanImage.mockResolvedValueOnce([
      { content: '0226007855219', format: ImageBarcodeFormat.CODE_128 }
    ]);

    const { result } = renderHook(() => useImageScan({ onCodeResolved }));

    await act(async () => {
      await result.current.pickAndScan();
    });

    expect(onCodeResolved).toHaveBeenCalledWith({
      barcode: '0226007855219',
      format: 'CODE128'
    });
  });

  it('keeps CODE128 when code is not 13 digits', async () => {
    mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
    mockScanImage.mockResolvedValueOnce([
      { content: 'SHORT123', format: ImageBarcodeFormat.CODE_128 }
    ]);

    const { result } = renderHook(() => useImageScan({ onCodeResolved }));

    await act(async () => {
      await result.current.pickAndScan();
    });

    expect(onCodeResolved).toHaveBeenCalledWith({
      barcode: 'SHORT123',
      format: 'CODE128'
    });
  });

  it('promotes UPC-A 12-digit to EAN-13 with leading zero (canonical)', async () => {
    mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
    // ML Kit on iOS often returns this Conad barcode as UPC-A (12 digits, leading 0 stripped)
    mockScanImage.mockResolvedValueOnce([
      { content: '226007855218', format: ImageBarcodeFormat.UPC_A }
    ]);

    const { result } = renderHook(() => useImageScan({ onCodeResolved }));

    await act(async () => {
      await result.current.pickAndScan();
    });

    expect(onCodeResolved).toHaveBeenCalledWith({
      barcode: '0226007855218',
      format: 'EAN13'
    });
  });

  it('restores stripped EAN-13 leading zero when expectedFormat=EAN13 (catalogue hint)', async () => {
    mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
    // Some scanners return CODE128 carrying 12 digits when the source is a leading-0 EAN-13
    mockScanImage.mockResolvedValueOnce([
      { content: '226007855218', format: ImageBarcodeFormat.CODE_128 }
    ]);

    const { result } = renderHook(() => useImageScan({ onCodeResolved, expectedFormat: 'EAN13' }));

    await act(async () => {
      await result.current.pickAndScan();
    });

    expect(onCodeResolved).toHaveBeenCalledWith({
      barcode: '0226007855218',
      format: 'EAN13'
    });
  });

  it('does not pad to EAN-13 when expectedFormat=EAN13 but checksum would be invalid', async () => {
    mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
    mockScanImage.mockResolvedValueOnce([
      { content: '226007855219', format: ImageBarcodeFormat.CODE_128 }
    ]);

    const { result } = renderHook(() => useImageScan({ onCodeResolved, expectedFormat: 'EAN13' }));

    await act(async () => {
      await result.current.pickAndScan();
    });

    expect(onCodeResolved).toHaveBeenCalledWith({
      barcode: '226007855219',
      format: 'CODE128'
    });
  });

  it('applies normalization to multi-code results too', async () => {
    mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
    mockScanImage.mockResolvedValueOnce([
      { content: '226007855218', format: ImageBarcodeFormat.UPC_A },
      { content: 'OTHER', format: ImageBarcodeFormat.CODE_128 }
    ]);

    const { result } = renderHook(() => useImageScan({ onCodeResolved }));

    await act(async () => {
      await result.current.pickAndScan();
    });

    expect(result.current.multiCodes).toEqual([
      { value: '0226007855218', format: 'EAN13' },
      { value: 'OTHER', format: 'CODE128' }
    ]);
  });

  // ─── Story 16.23 — honest, observable failure handling ──────────────────────
  // Before this story a decoder that ran and saw nothing, a native module that
  // threw, and a file that could not be opened at all were one `showError`
  // boolean rendering one message, with no telemetry. Diagnosing a single field
  // report cost an image-forensics session.

  describe('failure modes (Story 16.23, AC2/AC3)', () => {
    it('reports notFound when the decoder ran and returned zero results', async () => {
      mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
      mockScanImage.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useImageScan({ onCodeResolved }));

      await act(async () => {
        await result.current.pickAndScan();
      });

      expect(result.current.errorReason).toBe('notFound');
      expect(result.current.showError).toBe(true);
    });

    it('reports scanFailed when the native call throws', async () => {
      mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
      mockScanImage.mockRejectedValueOnce(new Error('Decode failed'));

      const { result } = renderHook(() => useImageScan({ onCodeResolved }));

      await act(async () => {
        await result.current.pickAndScan();
      });

      expect(result.current.errorReason).toBe('scanFailed');
      expect(result.current.showError).toBe(true);
    });

    it('notifies with a no-results outcome tag when the decoder finds nothing', async () => {
      mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
      mockScanImage.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useImageScan({ onCodeResolved }));

      await act(async () => {
        await result.current.pickAndScan();
      });

      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(
        'Image barcode scan found no codes',
        expect.objectContaining({
          tags: expect.objectContaining({ surface: 'image-scan', outcome: 'no-results' })
        })
      );
    });

    it('records the image dimensions on a no-results scan', async () => {
      // Dimensions are the attribute this failure class actually turns on — the
      // known root cause is a SMALL under-rasterised image, and the native decoder
      // only resamples above 2048 px. Asserted by name so a future refactor cannot
      // drop them and leave a triager unable to tell the known pattern from a new
      // one. `assetResult` reports 800 × 600.
      mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
      mockScanImage.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useImageScan({ onCodeResolved }));

      await act(async () => {
        await result.current.pickAndScan();
      });

      expect(mockNotify.mock.calls[0]?.[1]?.context?.[0]).toEqual(
        expect.objectContaining({ imageWidth: 800, imageHeight: 600 })
      );
    });

    it('tags an invalid-image reason when the native module cannot open the file', async () => {
      mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
      mockScanImage.mockRejectedValueOnce(
        nativeRejection('INVALID_IMAGE', 'Cannot load image from path: /var/mobile/IMG_0002.JPG')
      );

      const { result } = renderHook(() => useImageScan({ onCodeResolved }));

      await act(async () => {
        await result.current.pickAndScan();
      });

      // This tag is the fork in the road AC1 Q1 asks about: it separates "the
      // decoder looked and saw nothing" from "the decoder never got to look".
      expect(mockNotify).toHaveBeenCalledWith(
        'Image barcode scan failed',
        expect.objectContaining({
          tags: expect.objectContaining({
            surface: 'image-scan',
            outcome: 'native-error',
            reason: 'invalid-image'
          })
        })
      );
    });

    it('reports pickerFailed when the image picker itself rejects', async () => {
      // The picker call used to sit OUTSIDE the try block, so a rejection here
      // escaped as an unhandled promise rejection: no banner, no telemetry, and
      // nothing on screen at all. The reachable trigger is iOS having no view
      // controller to present the picker from (`classifyPickerFailure`).
      mockLaunch.mockRejectedValueOnce(
        nativeRejection('ERR_MISSING_CURRENT_VIEW_CONTROLLER', 'No current view controller')
      );

      const { result } = renderHook(() => useImageScan({ onCodeResolved }));

      await act(async () => {
        await result.current.pickAndScan();
      });

      expect(result.current.errorReason).toBe('pickerFailed');
      expect(result.current.showError).toBe(true);
      // The scan never started, so the spinner must never have been left on.
      expect(result.current.isProcessing).toBe(false);
      expect(mockScanImage).not.toHaveBeenCalled();
    });

    it('does not reject to the caller when the picker fails', async () => {
      // `onPress={onImageScan}` does not await, so a rejection escaping this hook
      // becomes an unhandled rejection rather than anything a user or Sentry sees.
      mockLaunch.mockRejectedValueOnce(new Error('picker exploded'));

      const { result } = renderHook(() => useImageScan({ onCodeResolved }));

      await act(async () => {
        await expect(result.current.pickAndScan()).resolves.toBeUndefined();
      });
    });

    it('notifies with a picker-error outcome when the picker rejects', async () => {
      mockLaunch.mockRejectedValueOnce(
        nativeRejection('E_PICKER_CANCELLED', 'failed at /var/mobile/Media/x.jpg')
      );

      const { result } = renderHook(() => useImageScan({ onCodeResolved }));

      await act(async () => {
        await result.current.pickAndScan();
      });

      expect(mockNotify).toHaveBeenCalledWith(
        'Image picker failed',
        expect.objectContaining({
          tags: expect.objectContaining({ surface: 'image-scan', outcome: 'picker-error' })
        })
      );
      expect(JSON.stringify(mockNotify.mock.calls)).not.toContain('/var/mobile');
    });

    it.each([
      ['ERR_USER_REJECTED_PERMISSIONS', 'permission'],
      ['ERR_MISSING_PHOTO_LIBRARY_PERMISSION', 'permission'],
      ['ERR_MISSING_CURRENT_VIEW_CONTROLLER', 'no-presenter'],
      ['ERR_SOMETHING_NEW', 'other']
    ])('classifies picker code %s as reason "%s"', async (code, expectedReason) => {
      // Codes verified against expo-image-picker's own exception classes. A denied
      // photo library and a picker that could not be presented need different
      // fixes, so a single bucket would hide the distinction.
      mockLaunch.mockRejectedValueOnce(nativeRejection(code, 'native detail'));

      const { result } = renderHook(() => useImageScan({ onCodeResolved }));

      await act(async () => {
        await result.current.pickAndScan();
      });

      expect(mockNotify.mock.calls[0]?.[1]?.tags?.reason).toBe(expectedReason);
    });

    it('clears a stale multi-code sheet when the picker fails', async () => {
      // Otherwise an open picker sheet and the new failure banner would compete.
      mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
      mockScanImage.mockResolvedValueOnce([
        { content: 'A', format: ImageBarcodeFormat.CODE_128 },
        { content: 'B', format: ImageBarcodeFormat.CODE_39 }
      ]);

      const { result } = renderHook(() => useImageScan({ onCodeResolved }));

      await act(async () => {
        await result.current.pickAndScan();
      });
      expect(result.current.multiCodes).toHaveLength(2);

      mockLaunch.mockRejectedValueOnce(new Error('picker failed'));
      await act(async () => {
        await result.current.pickAndScan();
      });

      expect(result.current.multiCodes).toHaveLength(0);
      expect(result.current.errorReason).toBe('pickerFailed');
    });

    it('survives a picker rejection that is not an Error', async () => {
      mockLaunch.mockRejectedValueOnce('picker string rejection');

      const { result } = renderHook(() => useImageScan({ onCodeResolved }));

      await act(async () => {
        await result.current.pickAndScan();
      });

      expect(result.current.errorReason).toBe('pickerFailed');
      expect(mockNotify.mock.calls[0]?.[1]?.context?.[0]).toEqual({
        errorName: 'string',
        nativeCode: undefined
      });
    });

    it('survives a rejection that is not an Error at all', async () => {
      // A TurboModule can reject with a bare value rather than an Error, so the
      // telemetry path must not assume `.name` exists.
      mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
      mockScanImage.mockRejectedValueOnce('decoder exploded');

      const { result } = renderHook(() => useImageScan({ onCodeResolved }));

      await act(async () => {
        await result.current.pickAndScan();
      });

      expect(result.current.errorReason).toBe('scanFailed');
      expect(mockNotify.mock.calls[0]?.[1]?.context?.[0]).toEqual({
        errorName: 'string',
        nativeCode: undefined
      });
    });

    it('ignores a non-string native code', async () => {
      mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
      mockScanImage.mockRejectedValueOnce(Object.assign(new Error('boom'), { code: 500 }));

      const { result } = renderHook(() => useImageScan({ onCodeResolved }));

      await act(async () => {
        await result.current.pickAndScan();
      });

      const [, options] = mockNotify.mock.calls[0] ?? [];
      expect(options?.tags?.reason).toBe('other');
      expect(options?.context?.[0]?.nativeCode).toBeUndefined();
    });

    it.each([
      ['INVALID_PATH', 'invalid-path'],
      ['IMAGE_LOAD_ERROR', 'load-error']
    ])('classifies the %s native code as reason "%s"', async (code, expectedReason) => {
      // Android emits these two alongside INVALID_IMAGE. They mean different
      // things — a missing path is a picker/URI problem, an undecodable file is a
      // file problem — so they must not collapse into one bucket.
      mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
      mockScanImage.mockRejectedValueOnce(nativeRejection(code, 'native detail with /a/path.jpg'));

      const { result } = renderHook(() => useImageScan({ onCodeResolved }));

      await act(async () => {
        await result.current.pickAndScan();
      });

      expect(mockNotify.mock.calls[0]?.[1]?.tags?.reason).toBe(expectedReason);
      expect(JSON.stringify(mockNotify.mock.calls)).not.toContain('/a/path.jpg');
    });

    it('classifies a throw carrying no native code as reason "other"', async () => {
      mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
      mockScanImage.mockRejectedValueOnce(new Error('Decode failed'));

      const { result } = renderHook(() => useImageScan({ onCodeResolved }));

      await act(async () => {
        await result.current.pickAndScan();
      });

      expect(mockNotify.mock.calls[0]?.[1]?.tags?.reason).toBe('other');
    });

    it('never sends the image path, file name or scanned value to telemetry', async () => {
      // The real native rejection interpolates the FILE PATH into its message,
      // and `scrubEvent` redacts by KEY, not by value — so a message copied into
      // tags or context would ship that path verbatim. This is the regression
      // lock on AC3's PII boundary.
      mockLaunch.mockResolvedValueOnce(
        assetResult('file:///var/mobile/Media/DCIM/100APPLE/IMG_0002.JPG')
      );
      mockScanImage.mockRejectedValueOnce(
        nativeRejection(
          'INVALID_IMAGE',
          'Cannot load image from path: /var/mobile/Media/DCIM/100APPLE/IMG_0002.JPG'
        )
      );

      const { result } = renderHook(() => useImageScan({ onCodeResolved }));

      await act(async () => {
        await result.current.pickAndScan();
      });

      const serialised = JSON.stringify(mockNotify.mock.calls);
      expect(serialised).not.toContain('IMG_0002');
      expect(serialised).not.toContain('/var/mobile');
      expect(serialised).not.toContain('test.jpg');
      expect(serialised).not.toContain('Cannot load image from path');
    });

    it('emits no telemetry when a scan succeeds', async () => {
      mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
      mockScanImage.mockResolvedValueOnce([
        { content: '1234567890128', format: ImageBarcodeFormat.EAN_13 }
      ]);

      const { result } = renderHook(() => useImageScan({ onCodeResolved }));

      await act(async () => {
        await result.current.pickAndScan();
      });

      expect(mockNotify).not.toHaveBeenCalled();
    });

    it('emits no telemetry when the user cancels the picker', async () => {
      mockLaunch.mockResolvedValueOnce(CANCELLED_RESULT);

      const { result } = renderHook(() => useImageScan({ onCodeResolved }));

      await act(async () => {
        await result.current.pickAndScan();
      });

      expect(mockNotify).not.toHaveBeenCalled();
    });

    it('dismissError clears errorReason as well as showError', async () => {
      mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
      mockScanImage.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useImageScan({ onCodeResolved }));

      await act(async () => {
        await result.current.pickAndScan();
      });

      expect(result.current.errorReason).toBe('notFound');

      act(() => {
        result.current.dismissError();
      });

      expect(result.current.errorReason).toBeNull();
      expect(result.current.showError).toBe(false);
    });

    it('clears a previous error when a later scan succeeds', async () => {
      mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
      mockScanImage.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useImageScan({ onCodeResolved }));

      await act(async () => {
        await result.current.pickAndScan();
      });
      expect(result.current.errorReason).toBe('notFound');

      mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
      mockScanImage.mockResolvedValueOnce([
        { content: '1234567890128', format: ImageBarcodeFormat.EAN_13 }
      ]);

      await act(async () => {
        await result.current.pickAndScan();
      });

      expect(result.current.errorReason).toBeNull();
      expect(result.current.showError).toBe(false);
    });
  });

  describe('unmapped format fallback (Story 16.23, AC4)', () => {
    it('notifies when a decoder format falls through to CODE128', async () => {
      // An INVALID UPC-E (bad check digit) still takes the old path: Story 16.25
      // only rescues payloads `expandUpcE` can expand losslessly.
      mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
      mockScanImage.mockResolvedValueOnce([{ content: '01234566', format: 'UPC_E' }]);

      const { result } = renderHook(() => useImageScan({ onCodeResolved }));

      await act(async () => {
        await result.current.pickAndScan();
      });

      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(
        'Barcode format fell back to CODE128',
        expect.objectContaining({
          tags: expect.objectContaining({ surface: 'image-scan' }),
          context: [expect.objectContaining({ unmappedFormat: 'UPC_E' })]
        })
      );
      expect(onCodeResolved).toHaveBeenCalledWith({ barcode: '01234566', format: 'CODE128' });
    });

    it('does not notify for any mapped format label', async () => {
      const mapped = [
        ImageBarcodeFormat.CODE_128,
        ImageBarcodeFormat.EAN_13,
        ImageBarcodeFormat.EAN_8,
        ImageBarcodeFormat.QR_CODE,
        ImageBarcodeFormat.CODE_39,
        ImageBarcodeFormat.UPC_A
      ];

      for (const format of mapped) {
        jest.clearAllMocks();
        mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
        mockScanImage.mockResolvedValueOnce([{ content: 'VALUE', format }]);

        const { result } = renderHook(() => useImageScan({ onCodeResolved: jest.fn() }));

        await act(async () => {
          await result.current.pickAndScan();
        });

        expect(mockNotify).not.toHaveBeenCalled();
      }
    });

    // The dedupe tests below use `UPC_E` with the contents 'A' / 'B' / 'C'. Those
    // are not valid UPC-E payloads, so `expandUpcE` rejects them and they still
    // reach the CODE128 fallback — exactly the invalid-UPC-E path (Story 16.25).
    it('reports each DISTINCT unmapped code in a multi-code result', async () => {
      mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
      mockScanImage.mockResolvedValueOnce([
        { content: 'A', format: 'UPC_E' },
        { content: 'B', format: ImageBarcodeFormat.CODE_128 },
        { content: 'C', format: 'CODE_93' }
      ]);

      const { result } = renderHook(() => useImageScan({ onCodeResolved }));

      await act(async () => {
        await result.current.pickAndScan();
      });

      expect(mockNotify).toHaveBeenCalledTimes(2);
      expect(result.current.multiCodes).toHaveLength(3);
    });

    it('reports a repeated unmapped label only once per scan', async () => {
      // A multi-code image holds up to six codes. Six identical events for one
      // user action would inflate the Sentry count without adding information,
      // so duplicates collapse WITHIN a scan while distinct labels do not.
      mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
      mockScanImage.mockResolvedValueOnce([
        { content: 'A', format: 'UPC_E' },
        { content: 'B', format: 'UPC_E' },
        { content: 'C', format: 'UPC_E' }
      ]);

      const { result } = renderHook(() => useImageScan({ onCodeResolved }));

      await act(async () => {
        await result.current.pickAndScan();
      });

      expect(mockNotify).toHaveBeenCalledTimes(1);
      // All three codes are still mapped and surfaced — dedupe is telemetry-only.
      expect(result.current.multiCodes).toHaveLength(3);
    });

    it('reports again on a later scan, so a recurring problem stays countable', async () => {
      mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
      mockScanImage.mockResolvedValueOnce([{ content: 'A', format: 'UPC_E' }]);

      const { result } = renderHook(() => useImageScan({ onCodeResolved }));

      await act(async () => {
        await result.current.pickAndScan();
      });
      expect(mockNotify).toHaveBeenCalledTimes(1);

      mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
      mockScanImage.mockResolvedValueOnce([{ content: 'A', format: 'UPC_E' }]);

      await act(async () => {
        await result.current.pickAndScan();
      });

      expect(mockNotify).toHaveBeenCalledTimes(2);
    });
  });
  describe('UPC-E expansion (Story 16.25)', () => {
    const scanOne = async (content: string, expectedFormat?: 'EAN13', format = 'UPC_E') => {
      mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
      mockScanImage.mockResolvedValueOnce([{ content, format }]);
      const { result } = renderHook(() => useImageScan({ onCodeResolved, expectedFormat }));
      await act(async () => {
        await result.current.pickAndScan();
      });
      return result;
    };

    it('stores a valid UPC-E as EAN-13 without the fallback notify', async () => {
      await scanOne('01234565');

      expect(onCodeResolved).toHaveBeenCalledWith({ barcode: '0012345000065', format: 'EAN13' });
      expect(mockNotify).not.toHaveBeenCalled();
    });

    it.each([
      ['d6 = 0', '01234505', '0012000003455'],
      ['d6 = 1', '01234514', '0012100003454'],
      ['d6 = 2', '01234523', '0012200003453'],
      ['d6 = 3', '01234531', '0012300000451'],
      ['d6 = 4', '01234543', '0012340000053'],
      ['d6 = 7', '01234572', '0012345000072'],
      ['number system 1', '12345694', '0123456000094']
    ])('expands %s to EAN-13', async (_case, upcE, ean13) => {
      await scanOne(upcE);

      expect(onCodeResolved).toHaveBeenCalledWith({ barcode: ean13, format: 'EAN13' });
      expect(mockNotify).not.toHaveBeenCalled();
    });

    it('accepts a lowercase decoder label', async () => {
      await scanOne('01234565', undefined, 'upc_e');

      expect(onCodeResolved).toHaveBeenCalledWith({ barcode: '0012345000065', format: 'EAN13' });
      expect(mockNotify).not.toHaveBeenCalled();
    });

    it('trims a trailing newline before expanding', async () => {
      await scanOne('01234565\n');

      expect(onCodeResolved).toHaveBeenCalledWith({ barcode: '0012345000065', format: 'EAN13' });
      expect(mockNotify).not.toHaveBeenCalled();
    });

    it('is unaffected by an EAN13 expectedFormat hint', async () => {
      await scanOne('01234565', 'EAN13');

      expect(onCodeResolved).toHaveBeenCalledWith({ barcode: '0012345000065', format: 'EAN13' });
      expect(mockNotify).not.toHaveBeenCalled();
    });

    it.each([
      ['7 digits', '0123456'],
      ['9 digits', '012345650'],
      ['number system 2', '21234565'],
      ['non-digits', '0123A565'],
      ['bad check digit', '01234566']
    ])('keeps an invalid UPC-E (%s) as CODE128 and notifies once', async (_case, content) => {
      await scanOne(content);

      expect(onCodeResolved).toHaveBeenCalledWith({ barcode: content, format: 'CODE128' });
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(
        'Barcode format fell back to CODE128',
        expect.anything()
      );
    });

    it('never puts the barcode value in the fallback telemetry', async () => {
      await scanOne('01234566');

      expect(JSON.stringify(mockNotify.mock.calls)).not.toContain('01234566');
    });

    it('expands the UPC-E entry of a multi-code scan and leaves the others alone', async () => {
      mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
      mockScanImage.mockResolvedValueOnce([
        { content: '01234565', format: 'UPC_E' },
        { content: '1234567890128', format: ImageBarcodeFormat.EAN_13 },
        { content: 'https://example.com', format: ImageBarcodeFormat.QR_CODE }
      ]);
      const { result } = renderHook(() => useImageScan({ onCodeResolved }));
      await act(async () => {
        await result.current.pickAndScan();
      });

      expect(result.current.multiCodes).toEqual([
        { value: '0012345000065', format: 'EAN13' },
        { value: '1234567890128', format: 'EAN13' },
        { value: 'https://example.com', format: 'QR' }
      ]);
      expect(mockNotify).not.toHaveBeenCalled();

      act(() => {
        result.current.selectCode(result.current.multiCodes[0]!);
      });
      expect(onCodeResolved).toHaveBeenCalledWith({ barcode: '0012345000065', format: 'EAN13' });
    });

    it('expands a valid UPC-E but still reports an invalid one in the same scan', async () => {
      mockLaunch.mockResolvedValueOnce(assetResult('file://test.jpg'));
      mockScanImage.mockResolvedValueOnce([
        { content: '01234565', format: 'UPC_E' },
        { content: '01234566', format: 'UPC_E' }
      ]);
      const { result } = renderHook(() => useImageScan({ onCodeResolved }));
      await act(async () => {
        await result.current.pickAndScan();
      });

      expect(result.current.multiCodes).toEqual([
        { value: '0012345000065', format: 'EAN13' },
        { value: '01234566', format: 'CODE128' }
      ]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
    });
  });
});

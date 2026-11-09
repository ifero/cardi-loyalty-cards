/**
 * useImageScan Hook
 * Story 2.9: Scan Cards from Image or Screenshot
 * Story 16.23: honest, observable failure handling
 *
 * Manages the full image-scan flow:
 *   1. Launch system image picker (photo library)
 *   2. Decode all barcodes in the selected image via react-native-image-code-scanner
 *   3. Normalize each detected barcode (UPC-A → EAN-13, CODE128-as-EAN-13, etc.)
 *   4. Optionally apply a catalogue-driven expectedFormat hint to recover a
 *      stripped EAN-13 leading zero
 *   5. Return state for single-code auto-resolve, multi-code selection, and error cases
 */

import * as ImagePicker from 'expo-image-picker';
import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import ImageCodeScanner, {
  BarcodeFormat as ImageBarcodeFormat
} from 'react-native-image-code-scanner';

import { BarcodeFormat } from '@/core/schemas';
import { applyExpectedFormat, expandUpcE, logger, normalizeBarcode } from '@/core/utils';

import { ScanResult } from '@/features/cards/hooks/useBarcodeScanner';

const BARCODE_FORMAT_MAP: Record<string, BarcodeFormat> = {
  code128: 'CODE128',
  code_128: 'CODE128',
  ean13: 'EAN13',
  ean_13: 'EAN13',
  ean8: 'EAN8',
  ean_8: 'EAN8',
  qr: 'QR',
  qrcode: 'QR',
  qr_code: 'QR',
  code39: 'CODE39',
  code_39: 'CODE39',
  upc_a: 'UPCA'
};

const SUPPORTED_IMAGE_SCAN_FORMATS = [
  ImageBarcodeFormat.CODE_128,
  ImageBarcodeFormat.EAN_13,
  ImageBarcodeFormat.EAN_8,
  ImageBarcodeFormat.QR_CODE,
  ImageBarcodeFormat.CODE_39,
  ImageBarcodeFormat.UPC_A
];

/**
 * Sentry tag identifying which scan surface produced an event (Story 16.23).
 *
 * The phone has three scan entry points sharing the same normalize pipeline, so
 * an event that does not say where it came from cannot be acted on.
 */
const SCAN_SURFACE = 'image-scan';

/**
 * Map a decoder format label to our schema, reporting any fallback.
 *
 * `reportedFormats` accumulates the labels already reported during the current
 * scan, so one user action cannot emit the same event several times: a
 * multi-code image carries up to six codes, and six identical Sentry events
 * would inflate the count without adding a single bit of information. Distinct
 * labels are still reported separately — that difference is the signal.
 */
function mapFormat(rawFormat: string, reportedFormats: Set<string>): BarcodeFormat {
  const normalizedFormat = rawFormat.toLowerCase();
  const mapped = BARCODE_FORMAT_MAP[normalizedFormat];

  if (mapped === undefined) {
    // CODE128 remains the fallback — the defect Story 16.23 fixes is that it was
    // SILENT. A mislabelled card is stored with the wrong `barcodeFormat` and
    // re-rendered as Code 128 forever; `normalizeBarcode` Rule 3 only rescues
    // the 13-digit-valid-EAN-13 case. A valid `UPC_E` result never gets here
    // (Story 16.25, see `toSchemaBarcode`); an invalid one still does, by design.
    if (!reportedFormats.has(normalizedFormat)) {
      reportedFormats.add(normalizedFormat);
      logger.notify('Barcode format fell back to CODE128', {
        tags: { surface: SCAN_SURFACE, platform: Platform.OS },
        // A decoder constant, never user data — but still runtime data, so it
        // cannot be a tag: tag values must be literals and are NOT scrubbed.
        context: [{ unmappedFormat: rawFormat }]
      });
    }
    return 'CODE128';
  }

  return mapped;
}

/**
 * Turn one decoder result into a value + schema format for `normalizeBarcode`.
 *
 * Story 16.25: the iOS decoder registers `.upce` whenever UPC_A is requested and
 * reports it back as `UPC_E`, which the schema has no member for. A valid UPC-E
 * is expanded losslessly to its UPC-A form and handed on as `UPCA`, so
 * `normalizeBarcode` Rule 1 stores it as EAN-13 — and `mapFormat` (with its
 * CODE128 fallback notify) is skipped. An invalid UPC-E takes the old path
 * unchanged: CODE128 fallback, reported.
 */
const toSchemaBarcode = (
  content: string,
  rawFormat: string,
  reportedFormats: Set<string>
): { value: string; format: BarcodeFormat } => {
  if (rawFormat.toLowerCase() === 'upc_e') {
    const upcA = expandUpcE(content);
    if (upcA !== null) {
      return { value: upcA, format: 'UPCA' };
    }
  }

  return { value: content, format: mapFormat(rawFormat, reportedFormats) };
};

/**
 * Why an image scan failed.
 *
 * These two outcomes were a single `showError` boolean until Story 16.23.
 * Collapsing them made the copy dishonest — a Penny Market card that Android
 * decodes fine was reported as containing no barcode — and left production
 * unable to tell a decoder miss from a file it never managed to open.
 */
export type ImageScanErrorReason =
  /** The decoder ran to completion and detected nothing. */
  | 'notFound'
  /** The native call threw before producing a result (unreadable file, IO, OOM). */
  | 'scanFailed'
  /**
   * The system image picker never handed us an image — so there is no "this
   * image" to talk about, which is why this is not folded into `scanFailed`.
   */
  | 'pickerFailed';

/**
 * Read the native rejection code off a thrown value.
 *
 * React Native surfaces `rejecter(code, message, error)` as an `Error` carrying
 * a `code`. The iOS decoder's only rejection is `INVALID_IMAGE` — the file could
 * not be opened at all — which is precisely the signal that distinguishes "the
 * decoder looked and saw nothing" from "the decoder never got to look".
 *
 * Deliberately does NOT read `message`: the native side interpolates the file
 * path into it (`"Cannot load image from path: …"`), and `scrubEvent` redacts by
 * KEY rather than by value, so a path carried inside a message would reach
 * Sentry verbatim.
 */
const nativeErrorCode = (err: unknown): string | undefined => {
  if (typeof err !== 'object' || err === null || !('code' in err)) {
    return undefined;
  }
  const { code } = err as { code?: unknown };
  return typeof code === 'string' ? code : undefined;
};

/**
 * Classify a scan throw into a low-cardinality, indexable Sentry tag value.
 *
 * Mirrors `classifyOtaFailure` (Story 16.14): the message is a fixed grouping
 * key, so an explicit literal-union return type is what makes the variants
 * countable and chartable in Sentry's UI.
 *
 * These are the rejection codes both native modules actually emit —
 * `INVALID_IMAGE` on iOS, and `INVALID_PATH` / `INVALID_IMAGE` /
 * `IMAGE_LOAD_ERROR` on Android. Keeping them distinct matters because they mean
 * genuinely different things: a path that does not exist is a picker or URI
 * problem, whereas an image that cannot be decoded is a file problem. Every one
 * of them interpolates the path (or an underlying message) into its own
 * `message`, which is exactly why only the CODE is ever read.
 */
const classifyScanFailure = (
  err: unknown
): 'invalid-image' | 'invalid-path' | 'load-error' | 'other' => {
  switch (nativeErrorCode(err)) {
    case 'INVALID_IMAGE':
      return 'invalid-image';
    case 'INVALID_PATH':
      return 'invalid-path';
    case 'IMAGE_LOAD_ERROR':
      return 'load-error';
    default:
      return 'other';
  }
};

/**
 * Classify a picker failure the same way {@link classifyScanFailure} classifies a
 * decode failure — a denied photo library and a picker that could not be
 * presented are as different from each other as "the path does not exist" is from
 * "the file will not decode", and a single bucket would hide that.
 *
 * Codes verified against `expo-image-picker`'s own exception classes; Expo derives
 * a code from the class name as `ERR_<CLASS_NAME_SNAKE_CASED>`
 * (`CodedException.kt`), so `UserRejectedPermissionsException` becomes
 * `ERR_USER_REJECTED_PERMISSIONS`.
 */
const classifyPickerFailure = (err: unknown): 'permission' | 'no-presenter' | 'other' => {
  switch (nativeErrorCode(err)) {
    // ⚠️ Mapped for forward-compatibility, but NOT currently expected from
    // `launchImageLibraryAsync` in expo-image-picker@55: iOS's multi-select
    // `PHPickerViewController` path performs no permission check at all (Apple's
    // modern picker needs none), and Android throws
    // `UserRejectedPermissionsException` only from its CAMERA launch path. Kept so
    // a future version that does check reports something better than `'other'` —
    // if these values start appearing in Sentry, upstream changed.
    case 'ERR_USER_REJECTED_PERMISSIONS':
    case 'ERR_MISSING_PHOTO_LIBRARY_PERMISSION':
      return 'permission';
    // Genuinely reachable today: iOS has no view controller to present the picker
    // from, e.g. mid-navigation (`ImagePickerModule.swift`).
    case 'ERR_MISSING_CURRENT_VIEW_CONTROLLER':
      return 'no-presenter';
    default:
      return 'other';
  }
};

export interface DetectedCode {
  value: string;
  format: BarcodeFormat;
}

interface UseImageScanOptions {
  onCodeResolved: (result: ScanResult) => void;
  /**
   * Optional catalogue-driven format hint. When provided as `EAN13` and the
   * scanner returns 12 digits whose `0`-prefixed form has a valid checksum,
   * the result is auto-promoted to EAN-13 with the leading zero restored.
   */
  expectedFormat?: BarcodeFormat;
}

export interface UseImageScanResult {
  isProcessing: boolean;
  /**
   * Whether a failure banner should be shown. Derived from {@link errorReason}
   * so the two can never disagree; kept in the public shape because it is what
   * `ScannerOverlay`'s visibility prop expects.
   */
  showError: boolean;
  /** Which failure occurred, or `null` when there is none (Story 16.23). */
  errorReason: ImageScanErrorReason | null;
  multiCodes: DetectedCode[];
  pickAndScan: () => Promise<void>;
  dismissError: () => void;
  dismissMultiPicker: () => void;
  selectCode: (code: DetectedCode) => void;
}

export const useImageScan = ({
  onCodeResolved,
  expectedFormat
}: UseImageScanOptions): UseImageScanResult => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorReason, setErrorReason] = useState<ImageScanErrorReason | null>(null);
  const [multiCodes, setMultiCodes] = useState<DetectedCode[]>([]);

  const dismissError = useCallback(() => setErrorReason(null), []);

  const dismissMultiPicker = useCallback(() => setMultiCodes([]), []);

  const selectCode = useCallback(
    (code: DetectedCode) => {
      setMultiCodes([]);
      // Re-run the full normalize → expectedFormat pipeline. Multi-code entries
      // are already normalized at the time they are pushed into state, but both
      // passes are idempotent, and re-applying here keeps `selectCode` a single
      // source of truth even if a future caller pushes raw values into
      // `multiCodes`.
      const canonical = normalizeBarcode(code.value, code.format);
      const final = applyExpectedFormat(canonical, expectedFormat);
      onCodeResolved({ barcode: final.value, format: final.format });
    },
    [onCodeResolved, expectedFormat]
  );

  const pickAndScan = useCallback(async () => {
    let result: ImagePicker.ImagePickerResult;

    // The picker call is guarded separately from the decode below, and must be:
    // it runs BEFORE `setIsProcessing(true)`, and `onPress={onImageScan}` does not
    // await this function — so a rejection escaping here surfaced as an unhandled
    // promise rejection with no banner, no telemetry and nothing on screen.
    //
    // The reachable trigger, read from `expo-image-picker`'s own exception classes
    // rather than guessed: `MissingCurrentViewControllerException` on iOS — no view
    // controller to present the picker from, e.g. mid-navigation. See
    // `classifyPickerFailure` for why the permission cases are mapped but not
    // currently expected.
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
        allowsEditing: false,
        exif: false,
        base64: false,
        aspect: [4, 3]
      });
    } catch (err) {
      // A distinct Sentry group from a decode failure: nothing was decoded, and
      // nothing was even opened, so the two are not variants of one problem.
      logger.notify('Image picker failed', {
        tags: {
          surface: SCAN_SURFACE,
          outcome: 'picker-error',
          reason: classifyPickerFailure(err),
          platform: Platform.OS
        },
        context: [
          {
            errorName: err instanceof Error ? err.name : typeof err,
            nativeCode: nativeErrorCode(err)
          }
        ]
      });
      setErrorReason('pickerFailed');
      // A previous multi-code sheet could still be open; the picker failing must
      // not leave it and the new failure banner competing to be believed.
      setMultiCodes([]);
      return;
    }

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0]!;
    const uri = asset.uri;
    setIsProcessing(true);
    setErrorReason(null);
    setMultiCodes([]);

    // Scoped to this one scan: see `mapFormat`. Deliberately not a ref — a fresh
    // set per scan is what keeps a recurring problem countable across scans while
    // still collapsing duplicates within one.
    const reportedFormats = new Set<string>();

    try {
      const scanned = await ImageCodeScanner.scan({
        path: uri,
        formats: SUPPORTED_IMAGE_SCAN_FORMATS
      });

      if (scanned.length === 0) {
        // The decoder ran and detected nothing. Reported because it is the
        // outcome we could previously not distinguish from an outright failure,
        // and because it recurs by construction: any brand publishing a
        // low-resolution digital card lands here on iOS (Apple Vision) while
        // decoding fine on Android (ML Kit).
        logger.notify('Image barcode scan found no codes', {
          tags: { surface: SCAN_SURFACE, outcome: 'no-results', platform: Platform.OS },
          // Dimensions are the one dimension this failure class actually turns
          // on: the known root cause is a SMALL, under-rasterised image, and the
          // native decoder only resamples above 2048 px — so an image's size is
          // what says "this is the known pattern" versus "this is something new".
          // Purely technical metadata about the picked asset, never its content.
          context: [
            {
              requestedFormats: SUPPORTED_IMAGE_SCAN_FORMATS,
              imageWidth: asset.width,
              imageHeight: asset.height
            }
          ]
        });
        setErrorReason('notFound');
      } else if (scanned.length === 1) {
        const firstBarcode = scanned[0]!;
        const decoded = toSchemaBarcode(firstBarcode.content, firstBarcode.format, reportedFormats);
        const canonical = normalizeBarcode(decoded.value, decoded.format);
        const final = applyExpectedFormat(canonical, expectedFormat);
        onCodeResolved({ barcode: final.value, format: final.format });
      } else {
        const codes: DetectedCode[] = scanned.slice(0, 6).map((r) => {
          const decoded = toSchemaBarcode(r.content, r.format, reportedFormats);
          const canonical = normalizeBarcode(decoded.value, decoded.format);
          const final = applyExpectedFormat(canonical, expectedFormat);
          return {
            value: final.value,
            format: final.format
          };
        });
        setMultiCodes(codes);
      }
    } catch (err) {
      logger.notify('Image barcode scan failed', {
        tags: {
          surface: SCAN_SURFACE,
          outcome: 'native-error',
          reason: classifyScanFailure(err),
          platform: Platform.OS
        },
        // The error's NAME and native code only. Never `err` itself and never
        // `err.message`: the decoder interpolates the image's file path into its
        // rejection message, and `scrubEvent` redacts by key, not by value.
        context: [
          {
            errorName: err instanceof Error ? err.name : typeof err,
            nativeCode: nativeErrorCode(err)
          }
        ]
      });
      setErrorReason('scanFailed');
    } finally {
      setIsProcessing(false);
    }
  }, [onCodeResolved, expectedFormat]);

  return {
    isProcessing,
    showError: errorReason !== null,
    errorReason,
    multiCodes,
    pickAndScan,
    dismissError,
    dismissMultiPicker,
    selectCode
  };
};

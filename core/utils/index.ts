/**
 * Core Utilities
 */

export { inferBarcodeFormat, getBarcodeFormatDescription } from './inferBarcodeFormat';
export { mapHexToCardColor } from './mapHexToCardColor';
export { logger } from './logger';
export { formatRelativeTime } from './relative-time';
export {
  normalizeBarcode,
  applyExpectedFormat,
  isValidEAN13Checksum,
  type NormalizedBarcode
} from './normalizeBarcode';
export { expandUpcE } from './expandUpcE';
export { withTimeout } from './with-timeout';

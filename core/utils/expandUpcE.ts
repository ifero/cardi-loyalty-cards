/**
 * UPC-E → UPC-A expansion (GS1 zero-suppression), Story 16.25.
 *
 * UPC-E is a zero-suppressed UPC-A: every valid UPC-E has exactly one 12-digit
 * UPC-A form, so expanding it loses nothing. The app has no UPC-E format; the
 * expanded UPC-A is then promoted to EAN-13 by `normalizeBarcode` Rule 1.
 *
 * Layout of the 8-digit input: number system N (0 or 1), body d1..d6, check C.
 * GS1 assigns only number system 0 to UPC-E; 1 is accepted for decoder
 * compatibility (zxing does the same), so do not narrow the check to 0.
 * The last body digit d6 selects where the suppressed zeros go:
 *
 *   d6 = 0, 1, 2 → N d1 d2 d6 0000 d3 d4 d5 C
 *   d6 = 3       → N d1 d2 d3 00000 d4 d5 C
 *   d6 = 4       → N d1 d2 d3 d4 00000 d5 C
 *   d6 = 5..9    → N d1 d2 d3 d4 d5 0000 d6 C
 */

import { isValidEAN13Checksum } from './normalizeBarcode';

const UPC_E_PATTERN = /^[01]\d{7}$/;

/**
 * Expand an 8-digit UPC-E payload to its 12-digit UPC-A form.
 *
 * Returns `null` unless the trimmed input is exactly 8 digits, its number
 * system is 0 or 1, and its check digit matches the expanded UPC-A.
 */
export const expandUpcE = (raw: string): string | null => {
  const value = raw.trim();
  if (!UPC_E_PATTERN.test(value)) return null;

  const numberSystem = value.charAt(0);
  const body = value.slice(1, 7);
  const checkDigit = value.charAt(7);
  const [d1, d2, d3, d4, d5, d6] = body.split('') as [
    string,
    string,
    string,
    string,
    string,
    string
  ];

  let manufacturerAndProduct: string;
  switch (d6) {
    case '0':
    case '1':
    case '2':
      manufacturerAndProduct = `${d1}${d2}${d6}0000${d3}${d4}${d5}`;
      break;
    case '3':
      manufacturerAndProduct = `${d1}${d2}${d3}00000${d4}${d5}`;
      break;
    case '4':
      manufacturerAndProduct = `${d1}${d2}${d3}${d4}00000${d5}`;
      break;
    default:
      manufacturerAndProduct = `${d1}${d2}${d3}${d4}${d5}0000${d6}`;
  }

  const firstEleven = `${numberSystem}${manufacturerAndProduct}`;
  // A 0-prefixed UPC-A is an EAN-13, so the EAN-13 checksum is the UPC-A one.
  if (!isValidEAN13Checksum(`0${firstEleven}${checkDigit}`)) return null;

  return `${firstEleven}${checkDigit}`;
};

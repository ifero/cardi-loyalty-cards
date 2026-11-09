/**
 * Tests for expandUpcE (Story 16.25).
 */

import { expandUpcE } from './expandUpcE';
import { isValidEAN13Checksum, normalizeBarcode } from './normalizeBarcode';

describe('expandUpcE', () => {
  describe('expansion table', () => {
    it.each([
      ['d6 = 0', '01234505', '012000003455'],
      ['d6 = 1', '01234514', '012100003454'],
      ['d6 = 2', '01234523', '012200003453'],
      ['d6 = 3', '01234531', '012300000451'],
      ['d6 = 4', '01234543', '012340000053'],
      ['d6 = 5..9 (6)', '01234565', '012345000065'],
      ['d6 = 5..9 (7)', '01234572', '012345000072'],
      ['d6 = 5..9 (9), number system 1', '12345694', '123456000094'],
      ['d6 = 3, number system 1', '12345639', '123400000569']
    ])('expands %s', (_case, upcE, upcA) => {
      expect(expandUpcE(upcE)).toBe(upcA);
    });

    it('expands a published GS1 example (04252614 → 042100005264)', () => {
      expect(expandUpcE('04252614')).toBe('042100005264');
    });
  });

  it('produces a value whose 0-prefixed EAN-13 checksum is valid', () => {
    for (const upcE of ['01234505', '01234531', '01234543', '01234565', '12345694']) {
      const upcA = expandUpcE(upcE);
      expect(upcA).not.toBeNull();
      expect(isValidEAN13Checksum(`0${upcA}`)).toBe(true);
    }
  });

  it('feeds normalizeBarcode Rule 1 to an EAN-13 (number system 0 and 1)', () => {
    expect(normalizeBarcode(expandUpcE('01234565')!, 'UPCA')).toEqual({
      value: '0012345000065',
      format: 'EAN13'
    });
    expect(normalizeBarcode(expandUpcE('12345694')!, 'UPCA')).toEqual({
      value: '0123456000094',
      format: 'EAN13'
    });
  });

  it('trims surrounding whitespace', () => {
    expect(expandUpcE('01234565\n')).toBe('012345000065');
    expect(expandUpcE('  01234565  ')).toBe('012345000065');
  });

  describe('invalid input', () => {
    it.each([
      ['7 digits', '0123456'],
      ['9 digits', '012345650'],
      ['empty', ''],
      ['whitespace only', '   '],
      ['number system 2', '21234565'],
      ['number system 9', '91234565'],
      ['non-digit', '0123A565'],
      ['letters only', 'ABCDEFGH'],
      ['wrong check digit', '01234566'],
      ['wrong check digit (d6 = 3)', '01234530'],
      ['internal whitespace', '0123 4565']
    ])('returns null for %s', (_case, input) => {
      expect(expandUpcE(input)).toBeNull();
    });
  });
});

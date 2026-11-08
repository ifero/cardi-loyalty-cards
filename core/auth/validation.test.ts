/**
 * Auth Validation Utilities — Unit Tests
 * Story 6-8: Password Reset
 */

import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_SYMBOLS,
  getUnmetPasswordRequirements,
  isValidEmail,
  isValidPassword
} from './validation';

// ---------------------------------------------------------------------------
// isValidEmail
// ---------------------------------------------------------------------------

describe('isValidEmail', () => {
  it('accepts standard email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('name.surname@domain.co.uk')).toBe(true);
    expect(isValidEmail('user+tag@example.com')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('rejects addresses without @ symbol', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
  });

  it('rejects addresses without domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('rejects addresses without TLD', () => {
    expect(isValidEmail('user@domain')).toBe(false);
  });

  it('trims whitespace before validation', () => {
    expect(isValidEmail('  user@example.com  ')).toBe(true);
  });

  it('rejects addresses with spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isValidPassword — Story 16.44: at least as strict as the hosted auth policy
// ---------------------------------------------------------------------------

describe('isValidPassword', () => {
  it.each(['Passw0rd!', 'P@ssw0rd!', 'Abcdef1!', 'aB3`~~~~', 'Zz9\\zzzz', 'Zz9"zzzz'])(
    'accepts "%s": 8+ characters, lower, upper, digit and a server symbol',
    (pw) => {
      expect(isValidPassword(pw)).toBe(true);
    }
  );

  it('accepts every symbol the server counts', () => {
    [...PASSWORD_SYMBOLS].forEach((symbol) => {
      expect(isValidPassword(`Passw0rd${symbol}`)).toBe(true);
    });
  });

  // Each passed the old "8+ characters, a letter and a digit" rule; the server rejects them all.
  it.each([
    ['password1', ['uppercase', 'symbol']],
    ['Password1', ['symbol']],
    ['PASSWORD1!', ['lowercase']],
    ['password1!', ['uppercase']],
    ['Password!!', ['digit']],
    ['Password12', ['symbol']]
  ])('rejects "%s", missing %j', (pw, unmet) => {
    expect(isValidPassword(pw)).toBe(false);
    expect(getUnmetPasswordRequirements(pw)).toEqual(unmet);
  });

  it.each(['Password1€', 'Password1£', 'Password1 ', 'Password1§'])(
    'rejects "%s": a symbol outside the server\'s set does not count',
    (pw) => {
      expect(isValidPassword(pw)).toBe(false);
      expect(getUnmetPasswordRequirements(pw)).toEqual(['symbol']);
    }
  );

  it('counts letters and digits only in ASCII, as the server does', () => {
    expect(isValidPassword('pàsswörd1!')).toBe(false);
    expect(getUnmetPasswordRequirements('ÀÉÎÕÜ1!a')).toEqual(['uppercase']);
    expect(getUnmetPasswordRequirements('Passwor١!')).toEqual(['digit']);
  });

  it('rejects a password shorter than 8 characters', () => {
    expect(isValidPassword('Pa1!')).toBe(false);
    expect(getUnmetPasswordRequirements('Pa1!')).toEqual(['length']);
  });

  it('holds the length boundary at 8', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
    expect(isValidPassword('Pass1!x')).toBe(false);
    expect(isValidPassword('Pass1!xy')).toBe(true);
  });

  it('rejects the empty string, missing every part of the rule', () => {
    expect(isValidPassword('')).toBe(false);
    expect(getUnmetPasswordRequirements('')).toEqual([
      'length',
      'lowercase',
      'uppercase',
      'digit',
      'symbol'
    ]);
  });
});

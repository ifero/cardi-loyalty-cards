/**
 * Auth Validation Utilities
 * Story 6-8: Password Reset (extracted to eliminate duplication)
 *
 * Shared validation helpers used by all auth screens:
 * - SignInScreen, CreateAccountScreen, ForgotPasswordScreen, NewPasswordScreen
 */

// ---------------------------------------------------------------------------
// Email validation
// ---------------------------------------------------------------------------

/** Loose RFC-5322-ish check — covers the practical 99 % of valid addresses. */
export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// ---------------------------------------------------------------------------
// Password validation
// ---------------------------------------------------------------------------

/** The fewest characters a new password may have — stricter than the hosted project's 6. */
export const PASSWORD_MIN_LENGTH = 8;

/**
 * The symbols the hosted Supabase project counts toward its "symbol" requirement: GoTrue's own set,
 * so a character outside it (`€`, `£`, a space) does not satisfy the rule here either. Source:
 * GoTrue's `lower_upper_letters_digits_symbols` password requirement, the hosted project's policy as
 * of 2026-11-08 (min 6, lower, upper, digits, symbols). If that policy changes, update this.
 */
export const PASSWORD_SYMBOLS = '!@#$%^&*()_+-=[]{};\'\\:"|<>?,./`~';

export type PasswordRequirement = 'length' | 'lowercase' | 'uppercase' | 'digit' | 'symbol';

/**
 * The parts of the new-password rule a password does not meet, in the order the rule states them.
 * Letters and digits are ASCII, as the server checks them.
 */
export const getUnmetPasswordRequirements = (pw: string): PasswordRequirement[] => {
  const unmet: PasswordRequirement[] = [];
  if (pw.length < PASSWORD_MIN_LENGTH) unmet.push('length');
  if (!/[a-z]/.test(pw)) unmet.push('lowercase');
  if (!/[A-Z]/.test(pw)) unmet.push('uppercase');
  if (!/[0-9]/.test(pw)) unmet.push('digit');
  if (![...pw].some((char) => PASSWORD_SYMBOLS.includes(char))) unmet.push('symbol');
  return unmet;
};

/**
 * The rule for a new password (Create Account, Set New Password): at least 8 characters, an ASCII
 * lowercase letter, an ASCII uppercase letter, a digit and one of the server's symbols. At least as
 * strict as the hosted auth policy, so a password this accepts is never `weak_password` (Story
 * 16.44). Sign In does not use it: an existing password is accepted as it is.
 */
export const isValidPassword = (pw: string): boolean =>
  getUnmetPasswordRequirements(pw).length === 0;

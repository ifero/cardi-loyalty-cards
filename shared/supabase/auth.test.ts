/**
 * Supabase Auth API Tests
 * Story 6-3: Configure App Client for Supabase
 *
 * Tests all auth operations with mocked Supabase client.
 * Validates typed AuthResult returns, error mapping, and guest mode.
 */

import { getCardCount } from '@/core/database/card-repository';
import { logger } from '@/core/utils/logger';

import {
  continueAsGuest,
  deleteAccount,
  getSession,
  sendPasswordResetOtp,
  signInWithEmail,
  signOut,
  signUp,
  updatePassword,
  verifyEmailOtp,
  verifyPasswordResetOtp,
  resendVerificationEmail
} from './auth';

// ---------------------------------------------------------------------------
// Mock Supabase client
// ---------------------------------------------------------------------------

const mockSignInWithPassword = jest.fn();
const mockSignUp = jest.fn();
const mockSignOut = jest.fn();
const mockGetSession = jest.fn();
const mockVerifyOtp = jest.fn();
const mockResend = jest.fn();
const mockResetPasswordForEmail = jest.fn();
const mockUpdateUser = jest.fn();
const mockFrom = jest.fn();
const mockUpsert = jest.fn();
const mockFunctionsInvoke = jest.fn();
const mockGetCardCount = jest.fn();
const mockDeleteAllCards = jest.fn();
const mockGetConsentStatus = jest.fn();
const mockGetConsentTimestamp = jest.fn();

const mockSupabaseAuth = {
  signInWithPassword: mockSignInWithPassword,
  signUp: mockSignUp,
  signOut: mockSignOut,
  getSession: mockGetSession,
  verifyOtp: mockVerifyOtp,
  resend: mockResend,
  resetPasswordForEmail: mockResetPasswordForEmail,
  updateUser: mockUpdateUser
};

jest.mock('./client', () => ({
  getSupabaseClient: jest.fn(() => ({
    auth: mockSupabaseAuth,
    functions: { invoke: mockFunctionsInvoke },
    from: mockFrom
  }))
}));

jest.mock('@/core/database/card-repository', () => ({
  getCardCount: (...args: unknown[]) => mockGetCardCount(...args),
  deleteAllCards: (...args: unknown[]) => mockDeleteAllCards(...args)
}));

jest.mock('@/core/privacy/consent-repository', () => ({
  getConsentStatus: (): boolean => mockGetConsentStatus(),
  getConsentTimestamp: (): string | null => mockGetConsentTimestamp()
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_USER = {
  id: 'user-123',
  email: 'test@example.com',
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00Z'
};

const MOCK_SESSION = {
  access_token: 'ACCESS_TOKEN_REDACTED',
  refresh_token: 'REFRESH_TOKEN_REDACTED',
  expires_at: 9999999999,
  user: MOCK_USER
};

// ---------------------------------------------------------------------------
// signInWithEmail
// ---------------------------------------------------------------------------

describe('signInWithEmail', () => {
  beforeEach(() => {
    mockSignInWithPassword.mockReset();
  });

  it('returns success with user and session on valid credentials', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: MOCK_USER, session: MOCK_SESSION },
      error: null
    });

    const result = await signInWithEmail('test@example.com', 'password123');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user).toEqual(MOCK_USER);
      expect(result.data.session).toEqual(MOCK_SESSION);
    }
  });

  it('returns failure when Supabase returns an error', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' }
    });

    const result = await signInWithEmail('bad@example.com', 'wrong');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Invalid login credentials');
    }
  });

  it('returns failure when session is null even if user is present', async () => {
    // Edge case: user returned but session is null
    mockSignInWithPassword.mockResolvedValue({
      data: { user: MOCK_USER, session: null },
      error: null
    });

    const result = await signInWithEmail('test@example.com', 'password123');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toMatch(/no session/i);
    }
  });

  it('returns failure when user is null', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: null
    });

    const result = await signInWithEmail('test@example.com', 'password123');

    expect(result.success).toBe(false);
  });

  it('returns failure and does not re-throw when network throws', async () => {
    mockSignInWithPassword.mockRejectedValue(new Error('Network error'));

    const result = await signInWithEmail('test@example.com', 'password123');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Network error');
    }
  });

  it('never exposes raw internal error objects to callers', async () => {
    const internalError = new Error('pg: connection refused [pool exhausted]');
    mockSignInWithPassword.mockRejectedValue(internalError);

    const result = await signInWithEmail('test@example.com', 'password123');

    // Result should be a clean AuthResult, not a thrown exception
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(typeof result.error.message).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// signUp
// ---------------------------------------------------------------------------

describe('signUp', () => {
  let mockWarn: jest.SpiedFunction<typeof logger.warn>;

  beforeEach(() => {
    mockSignUp.mockReset();
    mockFrom.mockReset();
    mockUpsert.mockReset();
    mockGetConsentStatus.mockReset();
    mockGetConsentTimestamp.mockReset();

    mockFrom.mockImplementation(() => ({ upsert: mockUpsert }));
    mockUpsert.mockResolvedValue({ data: null, error: null });
    mockGetConsentStatus.mockReturnValue(false);
    mockGetConsentTimestamp.mockReturnValue(null);
    mockWarn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    mockWarn.mockRestore();
  });

  it('returns success with user and session on registration and upserts the profile payload', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: MOCK_USER, session: MOCK_SESSION },
      error: null
    });

    const result = await signUp('new@example.com', 'Password123!');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user).toEqual(MOCK_USER);
      expect(result.data.session).toEqual(MOCK_SESSION);
    }

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'Password123!'
    });
    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        id: MOCK_USER.id,
        email: MOCK_USER.email,
        created_at: MOCK_USER.created_at
      },
      { onConflict: 'id' }
    );
  });

  it('returns success with null session when email confirmation is required', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: MOCK_USER, session: null },
      error: null
    });

    const result = await signUp('new@example.com', 'Password123!');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.session).toBeNull();
    }

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'Password123!'
    });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('passes consent metadata through signup when consent is already granted', async () => {
    const consentedAt = '2026-04-28T09:15:00.000Z';

    mockGetConsentStatus.mockReturnValue(true);
    mockGetConsentTimestamp.mockReturnValue(consentedAt);
    mockSignUp.mockResolvedValue({
      data: { user: MOCK_USER, session: null },
      error: null
    });

    const result = await signUp('new@example.com', 'Password123!');

    expect(result.success).toBe(true);
    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'Password123!',
      options: {
        data: {
          consent_status: true,
          consented_at: consentedAt
        }
      }
    });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('includes consent fields in the fallback profile upsert when a session is returned', async () => {
    const consentedAt = '2026-04-28T09:15:00.000Z';

    mockGetConsentStatus.mockReturnValue(true);
    mockGetConsentTimestamp.mockReturnValue(consentedAt);
    mockSignUp.mockResolvedValue({
      data: { user: MOCK_USER, session: MOCK_SESSION },
      error: null
    });

    const result = await signUp('new@example.com', 'Password123!');

    expect(result.success).toBe(true);
    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'Password123!',
      options: {
        data: {
          consent_status: true,
          consented_at: consentedAt
        }
      }
    });
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        id: MOCK_USER.id,
        email: MOCK_USER.email,
        created_at: MOCK_USER.created_at,
        consent_status: true,
        consented_at: consentedAt
      },
      { onConflict: 'id' }
    );
  });

  it('returns success when the profile row already exists and upsert resolves cleanly', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: MOCK_USER, session: MOCK_SESSION },
      error: null
    });
    mockUpsert.mockResolvedValue({
      data: { id: MOCK_USER.id },
      error: null
    });

    const result = await signUp('new@example.com', 'Password123!');

    expect(result.success).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        id: MOCK_USER.id,
        email: MOCK_USER.email,
        created_at: MOCK_USER.created_at
      },
      { onConflict: 'id' }
    );
  });

  it('returns success and logs a warning when the profile upsert fails', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: MOCK_USER, session: MOCK_SESSION },
      error: null
    });
    mockUpsert.mockResolvedValue({
      data: null,
      error: { message: 'profile insert failed' }
    });

    const result = await signUp('new@example.com', 'Password123!');

    expect(result.success).toBe(true);
    expect(mockWarn).toHaveBeenCalledWith('[auth] Failed to upsert signup profile:', {
      message: 'profile insert failed'
    });
  });

  it('returns failure when Supabase returns a registration error', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User already registered' }
    });

    const result = await signUp('existing@example.com', 'Password123!');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('User already registered');
    }
  });

  // Story 16.44: Create Account's weak-password banner reads this code.
  it('keeps the Supabase error code on a registration error', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Password is known to be weak and easy to guess', code: 'weak_password' }
    });

    const result = await signUp('new@example.com', 'password1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('weak_password');
    }
  });

  it('returns failure when user is null with no error', async () => {
    mockSignUp.mockResolvedValue({ data: { user: null, session: null }, error: null });

    const result = await signUp('new@example.com', 'Password123!');

    expect(result.success).toBe(false);
  });

  it('catches thrown exceptions and returns failure', async () => {
    mockSignUp.mockRejectedValue(new Error('Timeout'));

    const result = await signUp('new@example.com', 'Password123!');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Timeout');
    }
  });
});

// ---------------------------------------------------------------------------
// verifyEmailOtp
// ---------------------------------------------------------------------------

describe('verifyEmailOtp', () => {
  beforeEach(() => {
    mockVerifyOtp.mockReset();
  });

  it('returns success with user and session when OTP verification succeeds', async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { user: MOCK_USER, session: MOCK_SESSION },
      error: null
    });

    const result = await verifyEmailOtp('test@example.com', '12345678');

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      token: '12345678',
      type: 'email'
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user).toEqual(MOCK_USER);
      expect(result.data.session).toEqual(MOCK_SESSION);
    }
  });

  it('returns invalid_otp when provider rejects wrong token', async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Token is invalid or has expired', code: 'otp_invalid' }
    });

    const result = await verifyEmailOtp('test@example.com', '00000000');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('invalid_otp');
    }
  });

  it('returns expired_otp when provider reports expired token', async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Token has expired', code: 'otp_expired' }
    });

    const result = await verifyEmailOtp('test@example.com', '12345678');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('expired_otp');
    }
  });

  it('returns network_error when verification throws for connectivity issues', async () => {
    mockVerifyOtp.mockRejectedValue(new Error('Network request failed'));

    const result = await verifyEmailOtp('test@example.com', '12345678');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('network_error');
    }
  });

  it('returns unknown_error when provider error does not match known patterns', async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'OTP verification unavailable', code: 'provider_down' }
    });

    const result = await verifyEmailOtp('test@example.com', '12345678');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('unknown_error');
    }
  });
});

// ---------------------------------------------------------------------------
// resendVerificationEmail
// ---------------------------------------------------------------------------

describe('resendVerificationEmail', () => {
  beforeEach(() => {
    mockResend.mockReset();
  });

  it('returns success when signup verification email is resent', async () => {
    mockResend.mockResolvedValue({
      data: { user: null, session: null },
      error: null
    });

    const result = await resendVerificationEmail('test@example.com');

    expect(mockResend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'test@example.com'
    });
    expect(result.success).toBe(true);
  });

  it('returns failure when resend returns an error', async () => {
    mockResend.mockResolvedValue({
      data: null,
      error: { message: 'Email rate limit exceeded', code: 'over_email_send_rate_limit' }
    });

    const result = await resendVerificationEmail('test@example.com');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Email rate limit exceeded');
    }
  });
});

// ---------------------------------------------------------------------------
// signOut
// ---------------------------------------------------------------------------

describe('signOut', () => {
  beforeEach(() => {
    mockSignOut.mockReset();
  });

  it('returns success when sign-out succeeds', async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const result = await signOut();

    expect(result.success).toBe(true);
  });

  it('returns failure when Supabase returns an error', async () => {
    mockSignOut.mockResolvedValue({ error: { message: 'Not authenticated' } });

    const result = await signOut();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Not authenticated');
    }
  });

  it('returns failure when sign-out throws', async () => {
    mockSignOut.mockRejectedValue(new Error('Network failure'));

    const result = await signOut();

    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getSession
// ---------------------------------------------------------------------------

describe('getSession', () => {
  beforeEach(() => {
    mockGetSession.mockReset();
  });

  it('returns current session when user is authenticated', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: MOCK_SESSION },
      error: null
    });

    const result = await getSession();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(MOCK_SESSION);
    }
  });

  it('returns null session when no user is authenticated', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null
    });

    const result = await getSession();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });

  it('returns failure when Supabase returns an error', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'JWT expired' }
    });

    const result = await getSession();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('JWT expired');
    }
  });

  it('returns failure when getSession throws', async () => {
    mockGetSession.mockRejectedValue(new Error('Offline'));

    const result = await getSession();

    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sendPasswordResetOtp (Story 6.19)
// ---------------------------------------------------------------------------

describe('sendPasswordResetOtp', () => {
  beforeEach(() => {
    mockResetPasswordForEmail.mockReset();
  });

  it('calls resetPasswordForEmail with ONLY the email (no redirectTo) and returns success', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

    const result = await sendPasswordResetOtp('test@example.com');

    expect(result.success).toBe(true);
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com');
    // The recovery OTP template carries the code — there must be NO second
    // (redirectTo) argument, unlike the dead deep-link flow.
    expect(mockResetPasswordForEmail).toHaveBeenCalledTimes(1);
    expect(mockResetPasswordForEmail.mock.calls[0]).toHaveLength(1);
  });

  it('returns success even for an unregistered email (no user enumeration)', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

    const result = await sendPasswordResetOtp('unknown@example.com');

    expect(result.success).toBe(true);
  });

  it('returns failure when Supabase returns an error', async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      data: {},
      error: { message: 'Rate limit exceeded' }
    });

    const result = await sendPasswordResetOtp('test@example.com');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Rate limit exceeded');
    }
  });

  it('returns failure when network throws', async () => {
    mockResetPasswordForEmail.mockRejectedValue(new Error('Network error'));

    const result = await sendPasswordResetOtp('test@example.com');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Network error');
    }
  });
});

// ---------------------------------------------------------------------------
// verifyPasswordResetOtp (Story 6.19)
// ---------------------------------------------------------------------------

describe('verifyPasswordResetOtp', () => {
  beforeEach(() => {
    mockVerifyOtp.mockReset();
  });

  it('verifies with type "recovery" and returns the recovery session', async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { user: MOCK_USER, session: MOCK_SESSION },
      error: null
    });

    const result = await verifyPasswordResetOtp('test@example.com', '12345678');

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      token: '12345678',
      type: 'recovery'
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user).toEqual(MOCK_USER);
      expect(result.data.session).toEqual(MOCK_SESSION);
    }
  });

  it('returns invalid_otp when the provider rejects the code', async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Token is invalid or has expired', code: 'otp_invalid' }
    });

    const result = await verifyPasswordResetOtp('test@example.com', '00000000');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('invalid_otp');
    }
  });

  it('returns expired_otp when the provider reports an expired code', async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Token has expired', code: 'otp_expired' }
    });

    const result = await verifyPasswordResetOtp('test@example.com', '12345678');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('expired_otp');
    }
  });

  it('returns network_error when verification throws for connectivity issues', async () => {
    mockVerifyOtp.mockRejectedValue(new Error('Network request failed'));

    const result = await verifyPasswordResetOtp('test@example.com', '12345678');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('network_error');
    }
  });

  it('returns unknown_error for an unrecognized provider error', async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'OTP verification unavailable', code: 'provider_down' }
    });

    const result = await verifyPasswordResetOtp('test@example.com', '12345678');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('unknown_error');
    }
  });

  it('returns a normalized error when no session is returned despite no provider error', async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: null
    });

    const result = await verifyPasswordResetOtp('test@example.com', '12345678');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('unknown_error');
    }
  });

  it('maps to invalid_otp when only the message (not the code) signals invalidity', async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Token is invalid', code: 'bad_request' }
    });

    const result = await verifyPasswordResetOtp('test@example.com', '00000000');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('invalid_otp');
    }
  });
});

// ---------------------------------------------------------------------------
// updatePassword
// ---------------------------------------------------------------------------

describe('updatePassword', () => {
  beforeEach(() => {
    mockUpdateUser.mockReset();
  });

  it('returns success when password is updated', async () => {
    mockUpdateUser.mockResolvedValue({
      data: { user: MOCK_USER },
      error: null
    });

    const result = await updatePassword('NewPassword1');

    expect(result.success).toBe(true);
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'NewPassword1' });
  });

  it('returns failure when Supabase returns an error', async () => {
    mockUpdateUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Password too weak' }
    });

    const result = await updatePassword('weak');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Password too weak');
    }
  });

  // Story 16.44: Set New Password's weak-password banner reads this code.
  it('keeps the Supabase error code on an update error', async () => {
    mockUpdateUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Password is known to be weak and easy to guess', code: 'weak_password' }
    });

    const result = await updatePassword('password1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('weak_password');
    }
  });

  it('returns failure when network throws', async () => {
    mockUpdateUser.mockRejectedValue(new Error('Timeout'));

    const result = await updatePassword('NewPassword1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Timeout');
    }
  });
});

// ---------------------------------------------------------------------------
// continueAsGuest
// ---------------------------------------------------------------------------

describe('continueAsGuest', () => {
  it('returns success with isGuest set to true', () => {
    const result = continueAsGuest();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isGuest).toBe(true);
    }
  });

  it('returns a non-empty guestId', () => {
    const result = continueAsGuest();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.guestId).toBeTruthy();
      expect(typeof result.data.guestId).toBe('string');
    }
  });

  it('generates a unique guestId on each call', () => {
    const result1 = continueAsGuest();
    const result2 = continueAsGuest();

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    if (result1.success && result2.success) {
      expect(result1.data.guestId).not.toBe(result2.data.guestId);
    }
  });

  it('never makes a Supabase API call', () => {
    // Reset all mocks and verify none were called
    mockSignInWithPassword.mockReset();
    mockSignUp.mockReset();
    mockSignOut.mockReset();
    mockGetSession.mockReset();

    continueAsGuest();

    expect(mockSignInWithPassword).not.toHaveBeenCalled();
    expect(mockSignUp).not.toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it('is synchronous — returns AuthResult directly (not a Promise)', () => {
    const result = continueAsGuest();

    // If it were a Promise, result.success would be undefined
    expect(typeof result.success).toBe('boolean');
  });
});

// ---------------------------------------------------------------------------
// deleteAccount
// ---------------------------------------------------------------------------

describe('deleteAccount', () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockFunctionsInvoke.mockReset();
    mockSignOut.mockReset();
    mockGetCardCount.mockReset();
    mockDeleteAllCards.mockReset();
  });

  it('calls Edge Function with access token and signs out on success', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: MOCK_SESSION },
      error: null
    });
    mockFunctionsInvoke.mockResolvedValue({ data: { success: true }, error: null });
    mockSignOut.mockResolvedValue({ error: null });

    const result = await deleteAccount();

    expect(result.success).toBe(true);
    expect(mockFunctionsInvoke).toHaveBeenCalledWith('delete-account', {
      headers: { Authorization: `Bearer ${MOCK_SESSION.access_token}` }
    });
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('returns failure when Edge Function returns an error', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: MOCK_SESSION },
      error: null
    });
    mockFunctionsInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Failed to delete account' }
    });

    const result = await deleteAccount();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Failed to delete account');
    }
    // signOut should NOT be called on failure
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('returns auth error when no session exists', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null
    });

    const result = await deleteAccount();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Not authenticated');
    }
    // Should NOT invoke Edge Function without a session
    expect(mockFunctionsInvoke).not.toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('returns failure when network throws', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: MOCK_SESSION },
      error: null
    });
    mockFunctionsInvoke.mockRejectedValue(new Error('Network error'));

    const result = await deleteAccount();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Network error');
    }
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('returns failure when getSession throws', async () => {
    mockGetSession.mockRejectedValue(new Error('Session fetch failed'));

    const result = await deleteAccount();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Session fetch failed');
    }
    expect(mockFunctionsInvoke).not.toHaveBeenCalled();
  });

  it('returns failure when getSession returns an auth error', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Session lookup failed' }
    });

    const result = await deleteAccount();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Session lookup failed');
    }
    expect(mockFunctionsInvoke).not.toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('returns failure when local signOut fails after cloud deletion', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: MOCK_SESSION },
      error: null
    });
    mockFunctionsInvoke.mockResolvedValue({ data: { success: true }, error: null });
    mockSignOut.mockResolvedValue({ error: { message: 'Sign-out failed' } });

    const result = await deleteAccount();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Sign-out failed');
    }
  });

  it('keeps local SQLite cards unchanged after successful account deletion flow', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: MOCK_SESSION },
      error: null
    });
    mockFunctionsInvoke.mockResolvedValue({ data: { success: true }, error: null });
    mockSignOut.mockResolvedValue({ error: null });
    mockGetCardCount.mockResolvedValue(3);

    const beforeCount = await getCardCount();
    const result = await deleteAccount();
    const afterCount = await getCardCount();

    expect(result.success).toBe(true);
    expect(beforeCount).toBe(3);
    expect(afterCount).toBe(3);
    expect(mockDeleteAllCards).not.toHaveBeenCalled();
  });
});

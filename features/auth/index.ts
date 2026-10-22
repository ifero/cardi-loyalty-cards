// Auth Feature Module — DO NOT import from other features
export { default as CreateAccountScreen } from './CreateAccountScreen';
export { default as ForgotPasswordScreen } from './ForgotPasswordScreen';
export { default as MigrationBanner } from './MigrationBanner';
export { default as NewPasswordScreen } from './NewPasswordScreen';
export { default as RecoveryOtpScreen } from './RecoveryOtpScreen';
export { default as SignInScreen } from './SignInScreen';
export { default as VerifyEmailScreen } from './VerifyEmailScreen';
export {
  AppIconHeader,
  AuthLink,
  GuestModeBanner,
  PasswordInput,
  PasswordStrengthIndicator,
  getPasswordStrength
} from './components';
export { useGuestMigration } from './useGuestMigration';
export type { MigrationStatus, UseGuestMigrationReturn } from './useGuestMigration';

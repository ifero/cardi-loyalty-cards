/**
 * Privacy Policy — Bundled Offline Content
 * Story 6-4: Privacy Policy & Consent Flow
 *
 * This module exports the privacy policy as a plain string so it can be
 * rendered without network access.  The content is displayed in
 * `features/privacy/PrivacyPolicyScreen.tsx`.
 *
 * When updating this policy, update `PRIVACY_POLICY_LAST_UPDATED`. Bump
 * `PRIVACY_POLICY_VERSION` only when signed-in users must consent again: a new
 * version prompts every one of them (`core/privacy/consent-repository.ts`).
 * Story 24.1 corrected the copy without a bump (decision 2).
 *
 * `docs/privacy-policy.html` mirrors this text and the Italian one by hand.
 * Change every surface that describes the data together: both in-app policies,
 * `docs/privacy-policy.html`, the What We Collect strings
 * (`privacy.dataSummary` in `shared/i18n/locales/{en,it}.ts`), `docs/index.html`
 * and `docs/store/privacy-disclosures.md`. `SURFACES` in
 * `test/privacy-copy.test.ts` lists the files the copy checks read.
 */

/** Semantic version of the privacy policy document */
export const PRIVACY_POLICY_VERSION = '1.0.0';

/** ISO 8601 date of the last policy update */
export const PRIVACY_POLICY_LAST_UPDATED = '2026-11-05';

/**
 * Full privacy policy text.
 *
 * Structured sections:
 *  1. Introduction
 *  2. Data We Collect
 *  3. How We Use Your Data
 *  4. Data Storage & Security
 *  5. Data Sharing
 *  6. Your Rights (GDPR)
 *  7. Data Retention
 *  8. Children's Privacy
 *  9. Changes to This Policy
 * 10. Contact Us
 */
export const PRIVACY_POLICY_CONTENT = `Privacy Policy
Last updated: ${PRIVACY_POLICY_LAST_UPDATED}

1. Introduction

Cardì ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains what data we collect, how we use it, and your rights under the General Data Protection Regulation (GDPR) and other applicable laws.

By using Cardì you agree to the collection and use of information in accordance with this policy. You may use the app in guest mode, without an account: you give us no email address and your cards are never uploaded: they stay on your device, and on your own watch if you pair one.

2. Data We Collect

For everyone, guests included:
• Crash and error diagnostics — when the app crashes or an operation fails (for example, a check for an app update), a report is sent to Sentry. It holds the error and where it happened, the app version and build, and your device model and operating system. It holds nothing that identifies you: no name, email address, account ID, card data, device or install identifier, or location.
• App update checks — when the app checks for an update, Expo receives an identifier kept for this installation of the app, with the app version and platform. It is used only to deliver app updates.

When you create an account, we collect:
• Email address — used for authentication and account recovery, together with an account ID assigned when you sign up.
• Loyalty card data — card names, barcode values, barcode formats, brand references, colours, and usage metadata (favourite status, usage count, last-used time, and when each card was created and changed).
• Consent records — whether and when you accepted this Privacy Policy.

Without an account, your cards are never uploaded: they are stored on your device, and on your own watch if you pair one.

Watches: the Apple Watch app exchanges cards only with your iPhone and sends nothing to any server. The Wear OS app sends crash diagnostics to Sentry, limited in the same way as the phone's.

We do not collect:
• Location data
• Advertising identifiers
• Contacts, or photos (an image you scan for a barcode is read on your device and never uploaded)

Cardì shows no ads and uses no advertising identifiers.

3. How We Use Your Data

We use your data exclusively for the following purposes:
• Authentication — to identify you and secure your account.
• Cloud backup — to store your loyalty cards so they sync across your devices.
• Consent records — to keep proof of when you accepted this policy (legal obligation under GDPR).
• Diagnostics — to find and fix crashes and errors.
• App updates — to deliver updates to the app.

We do not use your data for advertising, profiling, or selling to third parties.

4. Data Storage & Security

• Local storage: card data is stored on your device in an SQLite database inside the app's private storage. The database itself is not encrypted; it is protected by your device's app sandbox and, where it is enabled, your device's own encryption. Session tokens are stored in the device Keychain (iOS) or Keystore (Android) via expo-secure-store.
• Cloud storage: if you create an account, your data is stored in Supabase (PostgreSQL) with Row-Level Security (RLS) ensuring only you can access your own data.
• Diagnostics: crash and error reports are stored by Sentry in its EU region. Sentry does not store the IP address a report arrives from.
• Encryption: data in transit is protected by TLS 1.2+. Data at rest in the cloud is encrypted by our hosting provider (AES-256).

5. Data Sharing

We do not sell or rent your personal data, and we do not share it for advertising. Your data is processed only by these service providers, on our behalf:
• Supabase — our cloud database and authentication provider, for account holders (data processing agreement in place).
• Sentry — crash and error diagnostics, for everyone, stored in the EU, with the app version and build, your device model and operating system, and nothing that identifies you.
• Expo — delivers app updates, and receives the update identifier described in section 2.

Like any server, Supabase and Expo also receive the IP address each request comes from.

6. Your Rights (GDPR)

Under the GDPR, you have the following rights:
• Right of access — You can view your cards and account details in the app, and export your cards. For anything else, contact us.
• Right to rectification — You can edit your loyalty card data at any time.
• Right to erasure — You can delete your account in Settings, which erases your account, your cards and your consent records from the cloud. Deletion is completed within 30 days.
• Right to data portability — You can export your data in a standard format.
• Right to withdraw consent — You can withdraw your consent by deleting your account; you can keep using Cardì as a guest, with your cards never uploaded. Withdrawing consent does not affect the lawfulness of processing based on consent before its withdrawal.
• Right to restriction of processing — You can sign out at any time, which stops your cards syncing to the cloud. Cards already in the cloud stay there until you delete your account.
• Right to lodge a complaint — You may file a complaint with your local data protection authority.

To exercise any of these rights, use the options in the app Settings or contact us at the address below.

7. Data Retention

• Guest mode: your cards are stored on your device, and on your own watch if you pair one. We keep none of them.
• Authenticated users: your data is retained as long as your account is active. When you delete your account, all cloud data, consent records included, is permanently erased within 30 days.
• Crash and error diagnostics: kept by Sentry for up to 90 days, then deleted automatically.
• Update identifier: used by Expo only to deliver app updates.

8. Children's Privacy

Cardì is not directed at children under 16 years of age. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.

9. Changes to This Policy

We may update this Privacy Policy from time to time. The updated version will be indicated by the "Last updated" date at the top. We encourage you to review this Privacy Policy periodically. Continued use of the app after changes constitutes acceptance of the updated policy.

10. Contact Us

If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at:

Email: privacy@cardiapp.eu
`;

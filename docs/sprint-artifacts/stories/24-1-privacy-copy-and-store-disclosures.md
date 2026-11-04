---
title: 'Privacy copy and store disclosures'
type: 'bugfix'
created: '2026-11-04'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The app, the in-app and public privacy policies and the landing page make claims the code contradicts: no analytics or tracking, no device identifier, an encrypted database, Supabase as the only processor, guests transmit nothing, consent revocable in Settings. Every contact (`support@`, `privacy@myloyaltycards.app`, `myloyaltycards.app/feedback`) points at a domain a third party owns and receives mail for.

**Approach:** Rewrite every claim to match what the code does, in English and Italian, on all four surfaces (What We Collect, both in-app policies, `docs/privacy-policy.html`, `docs/index.html`); move every contact to `support@cardiapp.eu` / `privacy@cardiapp.eu`; and write the App Store privacy answers and the Play Data safety answers as a repository document ifero copies into the consoles.

## Boundaries & Constraints

**Always:** The only "we do not" claims allowed are ones the code proves; "no ads, no advertising identifiers" is proven. The true picture: Sentry crash and error diagnostics from every release build, guests included (crashes plus handled-failure warnings such as a failed update check; EU region, `sendDefaultPii: false`, user and request scrubbed, and after decision 1 no IP-derived location and no install identifier: device model and OS only); EAS Update sends a per-install identifier on update checks; the local SQLite database is not encrypted; signed-in users' cards (including usage count and last-used time), email and consent records go to Supabase; the Apple Watch app sends nothing off the phone; the Wear OS app sends crash diagnostics straight to Sentry, trimmed the same way (Story 24-5, decision 2). The four surfaces and the store answers say the same thing. Italian matches English in substance.

**Decisions (ifero, 2026-11-04):**

1. **Crash and error diagnostics, trimmed** (amended by ifero 2026-11-04, replacing "crash reports only"; see Spec Change Log). Release builds stop sending performance traces (`tracesSampleRate` 0 outside `__DEV__`). Crash and handled-error events (`logger.notify`, `logger.error`) stay. Automatic session tracking is turned off (`enableAutoSessionTracking: false`), because session pings are per-install usage counts. `scrubEvent` also removes install and device identifiers (`contexts.app.device_app_hash`, `contexts.device.id`, any `app.device` tag), and ifero turns on the Sentry project's "Prevent Storing of IP Addresses" setting, so no location is derived. The copy discloses crash and error diagnostics with device model and OS. NFR-S6 is amended to allow crash and error diagnostics while still forbidding tracking, analytics and advertising.
2. **No re-consent.** `PRIVACY_POLICY_VERSION` stays 1.0.0; only the last-updated date changes, so no signed-in user is prompted.
3. **Feedback mails support.** Submit feedback opens `mailto:support@cardiapp.eu` with the subject "Cardì feedback" (URL-encoded); no `feedback@` mailbox.

**Never:** Change what the app collects beyond decision 1. Add a consent-revocation control. Encrypt the database. Touch `docs/` hosting (18-9). Fill in App Store Connect or the Play Console (ifero's step). Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario                               | Input / State           | Expected Output / Behavior                                                         | Error Handling             |
| -------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------- | -------------------------- |
| Contact support                        | Help → Contact support  | Opens `mailto:support@cardiapp.eu`                                                 | Existing unavailable alert |
| Feedback                               | Help → Submit feedback  | Opens `mailto:support@cardiapp.eu` with subject "Cardì feedback"                   | Existing unavailable alert |
| Guest reads What We Collect            | No account              | Says crash and error diagnostics leave the device; no "everything stays on device" | N/A                        |
| Signed-in user after the policy update | Consent stored at 1.0.0 | No re-consent prompt; the policy shows the new last-updated date                   | N/A                        |

</frozen-after-approval>

## Code Map

- `features/help/HelpScreen.tsx:27-28` -- `SUPPORT_MAIL_URL`, `FEEDBACK_URL`; buttons at `:147-159` (`help-contact-support`, `help-submit-feedback`) via `openExternal` `:90-95`
- `features/help/HelpScreen.test.tsx:623,628,722,727` -- assert both URLs
- `features/privacy/DataSummaryScreen.tsx:31-62` -- rows array; copy in `shared/i18n/locales/{en,it}.ts` `privacy.dataSummary.*` (en `:232-264`, it `:233-265`); test pins rows at `DataSummaryScreen.test.tsx:57-59`
- `assets/legal/privacy-policy.ts` -- false claims at `:45,54,55,69,75-76,85,86,93`; contact `:109`; `PRIVACY_POLICY_VERSION` `:14`, last-updated `:17` (Italian file imports the date)
- `assets/legal/privacy-policy.it.ts` -- same claims at `:21,30,31,45,51-52,61,62,69`; contact `:85`
- `features/privacy/PrivacyPolicyScreen.test.tsx:338` -- pins the contact line
- `docs/privacy-policy.html` -- hand-maintained mirror: EN `:95,110,111,134,151-156,178`, contact `:226`; IT `:264,265,288-289,298,311,348`, contact `:383`; date `:74`
- `docs/index.html:224,227` -- "No tracking, no analytics" (EN/IT)
- `core/observability/sentry.ts:89-103` -- init, `tracesSampleRate` `:100` (decision 1)
- `core/privacy/consent-repository.ts:82` -- `needsReConsent` compares versions; untouched (decision 2)
- `docs/prd.md:1049` -- NFR-S6 (decision 1)
- `docs/sprint-artifacts/stories/22-8-document-screens.md:629-645` -- FNF 10, the source audit
- Keep: the data-export claim (`features/settings/components/DataManagementSection.tsx` exists); account deletion within 30 days (`supabase/functions/delete-account`)

## Tasks & Acceptance

**Execution:**

- [ ] `features/help/HelpScreen.tsx` + test -- new support address; feedback per decision 3 -- the third-party domain must not receive user mail
- [ ] `shared/i18n/locales/en.ts`, `it.ts` + `DataSummaryScreen.tsx` + test -- true description (crash and error diagnostics for everyone, cloud data only with an account); Device ID row says an install identifier is used only to deliver app updates -- the screen guests read
- [ ] `assets/legal/privacy-policy.ts`, `.it.ts` + `PrivacyPolicyScreen.test.tsx` -- rewrite sections 2, 4, 5, 6, 7 to the true picture; processors Supabase, Sentry (crash and error diagnostics, EU, device model and OS only), Expo (app updates); replace "revoke consent in Settings" with account deletion and guest mode; new contact; version unchanged, new last-updated date (decision 2)
- [ ] `docs/privacy-policy.html` -- mirror both languages and the date
- [ ] `docs/index.html` -- replace the tracking claim with "no ads, no advertising identifiers" (EN/IT)
- [ ] `core/observability/sentry.ts`, `docs/prd.md` -- release `tracesSampleRate` 0; `scrubEvent` strips the install and device identifiers; NFR-S6 amended (decision 1); tests pin the release value and the stripped fields. Then confirm on one new production event in Sentry that it carries no `app.device` tag and no `user.geo`, after ifero has enabled the IP setting
- [ ] `docs/store/privacy-disclosures.md` (new) -- App Store privacy-label answers and Play Data safety answers derived from the same picture, with the privacy-policy URL `https://cardiapp.eu/privacy-policy.html` noted as live only after 18-9
- [ ] `test/privacy-copy.test.ts` (new) -- no locale or policy file, and neither HTML page, contains `myloyaltycards.app` or the retired claims (encrypted database, no device identifiers, no analytics or tracking)

**Acceptance Criteria:**

- Given any user-visible surface or the store document, when searched, then no `myloyaltycards.app` address and none of the retired claims remain.
- Given the in-app policy, the HTML policy and What We Collect, when read side by side in either language, then they state the same collection, processors and retention.
- Given `docs/store/privacy-disclosures.md`, when ifero fills both consoles from it, then every answer is traceable to a line of the policy.
- Given ifero has not confirmed that support@ and privacy@cardiapp.eu deliver mail, then implementation does not start.

## Implementation Notes

## Spec Change Log

- **2026-11-04, decision 1 amended by ifero before implementation.** Trigger: a Sentry read for Story 16.25 showed 330 of 339 events in 90 days were non-crash `logger.notify` warnings ("Wear OS card snapshot publish failed" 177, "Expo update check failed" 149, "Camera permission denied" 4), and every event carried an `app.device` install hash and an IP-derived `user.geo` city. "Crash reports only" would have been false copy. Amended: keep crash and error diagnostics, strip the identifiers in `scrubEvent`, stop IP storage in the Sentry project, disclose accordingly. KEEP: tracing off in release, no re-consent, feedback to support.
- **2026-11-04, second amendment, by ifero while refining 24-5.** The Wear OS app gains crash reporting (24-5 decision 2), so the copy discloses Wear crash diagnostics and only the Apple Watch app sends nothing. Session tracking is also turned off on the phone, under the same trimming decision.

## Review Triage Log

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors
- `yarn lint` -- expected: no errors
- `yarn format:check` -- expected: clean
- `yarn test` -- expected: all pass, including `test/privacy-copy.test.ts`

**Manual checks (if no CLI):**

- Device check: Help, What We Collect and the privacy policy on the iOS simulator and an Android emulator, light and dark, both languages; a signed-in user with consent at 1.0.0 sees no prompt.

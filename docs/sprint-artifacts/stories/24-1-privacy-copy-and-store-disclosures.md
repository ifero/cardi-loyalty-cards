---
title: 'Privacy copy and store disclosures'
type: 'bugfix'
created: '2026-11-04'
status: 'done'
baseline_commit: 'b41d9ded8731df5cce59820afc6e23a72f548a80'
route: 'dispatch'
review_loop_iteration: 1
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
4. **Trim the data to match the copy** (ifero, 2026-11-05, after review pass 1 found reports carry more than "device model and OS"). The code is trimmed; the copy is not widened. In JS: breadcrumbs keep no `console`, `touch` or `ui` entries and no URL query string or fragment; every UUID in an event's free text (exception values, message, breadcrumb messages and URLs) is masked; `contexts.device` and `contexts.app` keep an allow-list (device model, family, manufacturer, brand, simulator; app version, build, name, identifier) and `contexts.culture` is dropped. Native crashes never reach `scrubEvent`, so ifero adds Sentry Advanced Data Scrubbing rules that remove the same fields server-side, beside the IP setting, and confirms them on a native test crash from a release build before submission. The copy may then say a report holds the error, app version and build, device model and OS, and nothing that identifies the user.

5. **The Wear sentence ships with 24-1** (ifero, 2026-11-05). The copy discloses Wear OS crash diagnostics now, though Story 24-5 adds the code later; both ship before the store release, and over-disclosure for that window is accepted.

**Never:** Change what the app collects beyond decisions 1 and 4. Add a consent-revocation control. Encrypt the database. Touch `docs/` hosting (18-9). Fill in App Store Connect or the Play Console (ifero's step). Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario                               | Input / State                                                   | Expected Output / Behavior                                                                    | Error Handling                      |
| -------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------- |
| Contact support                        | Help → Contact support                                          | Opens `mailto:support@cardiapp.eu`                                                            | Existing unavailable alert          |
| Feedback                               | Help → Submit feedback                                          | Opens `mailto:support@cardiapp.eu` with subject "Cardì feedback"                              | Existing unavailable alert          |
| Guest reads What We Collect            | No account                                                      | Says crash and error diagnostics leave the device; no "everything stays on device"            | N/A                                 |
| Signed-in user after the policy update | Consent stored at 1.0.0                                         | No re-consent prompt; the policy shows the new last-updated date                              | N/A                                 |
| Signed-in sync fails                   | Supabase fetch to `…?user_id=eq.<uuid>` then `logger.error`     | The sent event's breadcrumbs, URLs and exception text hold no UUID and no query string        | N/A                                 |
| JS event with full device context      | SDK fills `contexts.device`, `contexts.app`, `contexts.culture` | Only the allow-listed fields leave; no culture, memory, timezone, install hash or device id   | N/A                                 |
| Native crash                           | Captured by sentry-cocoa / sentry-android                       | `scrubEvent` cannot run; the server-side rules remove the same fields (ifero's console check) | Store submission waits on the check |

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
- `core/observability/sentry.ts:89-103` -- init, `tracesSampleRate` `:100` (decision 1); `scrubEvent` `:66-83` touches only `user`, `request`, `extra`, `contexts`. Add a `beforeBreadcrumb` hook (decision 4) so breadcrumbs are cleaned when recorded: the RN SDK syncs the JS scope's breadcrumbs to the native SDK, so a native crash then carries the cleaned ones. Keep `redactValue` and `SENSITIVE_KEY_PATTERN` as they are
- `node_modules/@sentry/react-native/dist/js/wrapper.js:158` -- strips `beforeSend` and `beforeBreadcrumb` before `initNativeSdk`: why native crashes need the server-side rules (decision 4)
- `shared/supabase/cards.ts:33,61,84` -- `.eq('user_id', userId)`, the account UUID in every sync URL; `core/sync/cloud-sync.ts:604,629` -- `logger.error` text interpolating card row ids; `core/utils/logger.ts:33-41` -- `captureError` synthesises exception text from args
- Sentry Advanced Data Scrubbing (project Settings → Security & Privacy): rules use Sentry's PII selectors (`$user.id`, `contexts.app.device_app_hash`, `contexts.device.id`, `contexts.culture.**`, `&&`/`!` to keep the allow-list); the implementer writes the exact rules into the store document from Sentry's docs, without touching the console
- `core/privacy/consent-repository.ts:82` -- `needsReConsent` compares versions; untouched (decision 2)
- `docs/prd.md:1049` -- NFR-S6 (decision 1)
- `docs/sprint-artifacts/stories/22-8-document-screens.md:629-645` -- FNF 10, the source audit
- `features/help/help-data.json:30`, `.it.json:38` -- the FAQ privacy answer; out of scope (deferred), but `test/privacy-copy.test.ts` reads it
- Keep: the data-export claim (`features/settings/components/DataManagementSection.tsx` exists); account deletion within 30 days (`supabase/functions/delete-account`)

## Tasks & Acceptance

**Execution:**

- [x] `features/help/HelpScreen.tsx` + test -- new support address; feedback per decision 3 -- the third-party domain must not receive user mail
- [x] `shared/i18n/locales/en.ts`, `it.ts` + `DataSummaryScreen.tsx` + test -- true description (crash and error diagnostics for everyone, cloud data only with an account); the Account row names the email, the account ID and the consent record; Device ID row says an install identifier is used only to deliver app updates; fix "piu" to "più" in both Help unavailable strings; the Italian test block pins every row, as the English one does -- the screen guests read
- [x] `assets/legal/privacy-policy.ts`, `.it.ts` + `PrivacyPolicyScreen.test.tsx` -- rewrite sections 1–7 to the true picture; processors Supabase, Sentry (crash and error diagnostics, EU, decision 4's fields only), Expo (app updates); Expo and Supabase also receive the IP address a request comes from, as any server does; a guest's cards are never uploaded (they may sync to the user's own watch); replace "revoke consent in Settings" with account deletion and guest mode; consent records are deleted with the account; new contact; version unchanged, new last-updated date (decision 2)
- [x] `docs/privacy-policy.html` -- mirror both languages, word for word, and the date
- [x] `docs/index.html` -- replace the tracking claim with "no ads, no advertising identifiers" (EN/IT)
- [x] `core/observability/sentry.ts` + test, `docs/prd.md` -- release `tracesSampleRate` 0 and `enableAutoSessionTracking: false`; `scrubEvent` strips the identifiers (decision 1), applies decision 4's allow-list and UUID masking; a `beforeBreadcrumb` hook applies decision 4 to breadcrumbs; NFR-S6 amended (decisions 1 and 4); tests pin each rule, including a sync-failure event shaped like the matrix row
- [x] `docs/store/privacy-disclosures.md` (new) -- App Store privacy-label answers and Play Data safety answers derived from the same picture, plus a "Before submitting" checklist for ifero: IP setting on, the exact Advanced Data Scrubbing rules, Sentry retention at or under the 90 days the policy states, a native test crash and a JS event from a release build inspected for the removed fields, and the privacy-policy URL `https://cardiapp.eu/privacy-policy.html` live only after 18-9
- [x] `test/privacy-copy.test.ts` (new) -- no locale or policy file, neither HTML page, nor the store document contains `myloyaltycards.app` or a retired claim (encrypted database, no device identifiers, no analytics or tracking, guests send nothing, consent revocable in Settings, guest mode stops all cloud processing, consent logs kept 3 years, "Feedback page unavailable"); every bullet and paragraph of each in-app policy appears in its half of the HTML policy, whitespace and entities normalised

**Acceptance Criteria:**

- Given any user-visible surface or the store document, when searched, then no `myloyaltycards.app` address and none of the retired claims remain.
- Given the in-app policy, the HTML policy and What We Collect, when read side by side in either language, then they state the same collection, processors and retention.
- Given `docs/store/privacy-disclosures.md`, when ifero fills both consoles from it, then every answer is traceable to a line of the policy.
- Given ifero has not confirmed that support@ and privacy@cardiapp.eu deliver mail, then implementation does not start.

## Implementation Notes

### Device check (2026-11-05)

Run from this branch's code through Metro (`expo start --dev-client`), screenshots in `/private/tmp/claude-501/-Users-ifero-Developer-cardi-loyalty-cards--claude-worktrees-bmad-build-24-1-89a409/f270789f-d97a-4942-aa57-89dc637371e6/scratchpad/device-check/`, outside the repository.

- **iOS, iPhone 17 Pro simulator (iOS 26), dev build of 2026-10-30.** What We Collect, the privacy policy (top and contact) and Help in English dark and Italian light. Submit feedback and Contact support with no mail app show the email "unavailable" alert, the Italian one with "più". All copy matches the spec.
- **Android, Pixel 8 emulator (API 37), dev build made from this branch.** What We Collect, the policy and Help in English dark; What We Collect and the policy in Italian light. Submit feedback opened Gmail's compose with a `mailto:` intent whose masked address has the shape of `support@cardiapp.eu?subject=…`.
- **Not checked on a device:** a signed-in user at consent 1.0.0 seeing no prompt (no test account; covered by `test/privacy-copy.test.ts` pinning 1.0.0 and the existing `needsReConsent` tests), and anything Sentry sends from a release build (the native test crash in the store checklist is ifero's).

### Review loops (2026-11-05)

- Code review, round 1 (Sonnet): `VERDICT: APPROVED`, no comments.
- QA review, round 1 (Sonnet), every matrix row and acceptance criterion mapped to evidence: `VERDICT: APPROVED`, no comments.

### Found, not fixed

- GDPR Art. 13 gaps in the policy: no controller identity and address, no legal basis per purpose, no right to object, no international-transfer statement, no retention period for the Expo update identifier or request IP logs. Present before this story (triage rows 7, 26).
- The Help FAQ answer "Is my data private?" (`features/help/help-data.json:30`, `.it.json:38`) mentions only local storage (triage rows 9, 28).

### Going to ifero

- The Sentry console settings (IP setting, the seven Advanced Data Scrubbing rules, retention) must be in place before this copy reaches users by merge or OTA, not only before the store consoles are filled (triage row 22). The native test crash in `docs/store/privacy-disclosures.md` is the only check on the native path.
- The implementation masks UUIDs in `extra` as well as the fields decision 4 names, because `logger.error` copies its interpolated text into `extra.context`; a further trim, within decision 4.

## Spec Change Log

- **2026-11-04, decision 1 amended by ifero before implementation.** Trigger: a Sentry read for Story 16.25 showed 330 of 339 events in 90 days were non-crash `logger.notify` warnings ("Wear OS card snapshot publish failed" 177, "Expo update check failed" 149, "Camera permission denied" 4), and every event carried an `app.device` install hash and an IP-derived `user.geo` city. "Crash reports only" would have been false copy. Amended: keep crash and error diagnostics, strip the identifiers in `scrubEvent`, stop IP storage in the Sentry project, disclose accordingly. KEEP: tracing off in release, no re-consent, feedback to support.
- **2026-11-04, second amendment, by ifero while refining 24-5.** The Wear OS app gains crash reporting (24-5 decision 2), so the copy discloses Wear crash diagnostics and only the Apple Watch app sends nothing. Session tracking is also turned off on the phone, under the same trimming decision.
- **2026-11-05, decision 4 added by ifero after review pass 1 (intent_gap).** Trigger: triage rows 1–4. Native crashes skip `scrubEvent`, fetch breadcrumbs carry `user_id=eq.<uuid>`, and kept contexts include locale, timezone and memory, so "device model and OS, nothing that identifies you" was false. Amended: decision 4, three matrix rows, the Sentry and store-document tasks, and the carried patches 5, 6, 13, 15, 18, 19, 20 folded into the tasks. Known-bad state avoided: copy that promises less than Sentry stores. KEEP from the reverted pass (saved as a patch outside the repository): its policy wording in both languages, generated into the HTML so the three match; the What We Collect `app` row renamed `diagnostics`; the feedback "unavailable" string reworded for email; the store document's tables and section citations; `stripInstallIdentifiers` returning clones and never mutating the caller's event.

## Review Triage Log

Review pass 1 (2026-11-05), four layers. The implementation is saved as a patch outside the repository before the intent_gap revert.

| #   | Source          | Finding                                                                                            | Verdict | Evidence                                                                                                                                                                                                                                            | Route      |
| --- | --------------- | -------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | blind, edge, vg | Native iOS/Android crashes never pass through `scrubEvent`                                         | high    | `@sentry/react-native/dist/js/wrapper.js:158` strips `beforeSend` before `RNSentry.initNativeSdk`; native crashes keep their install/device identifiers, while the copy says reports hold none                                                      | intent_gap |
| 2   | blind, edge     | Breadcrumbs are unscrubbed and carry the account ID                                                | high    | `shared/supabase/cards.ts:33,61,84` query with `.eq('user_id', userId)`; fetch/xhr breadcrumbs record the URL `…?user_id=eq.<uuid>`, and `scrubEvent` touches only `user`, `request`, `extra`, `contexts`. The copy says reports hold no account ID | intent_gap |
| 3   | blind           | Reports carry more device context than "device model and OS"                                       | medium  | `scrubEvent` keeps the rest of `contexts.device`, `contexts.app`, `contexts.culture` (locale, timezone, screen, memory, boot time); the frozen picture says "device model and OS only"                                                              | intent_gap |
| 4   | vg, blind, edge | Wear OS crash reporting is disclosed before it exists                                              | medium  | No Sentry dependency under `watch-android/`; `watch-android/README.md:793` lists "No production telemetry". The frozen Always discloses it from 24-5, which merges after 24-1                                                                       | intent_gap |
| 5   | edge, blind     | "Sentry does not store the IP address" depends on a console setting nothing records                | low     | True only once ifero enables "Prevent Storing of IP Addresses" (a spec task); no pre-submission checklist names it                                                                                                                                  | patch      |
| 6   | blind           | Expo (and Supabase) receive the client IP with each request, undisclosed                           | low     | Every update check is an HTTPS request to Expo; the policy lists only identifier, version and platform                                                                                                                                              | patch      |
| 7   | blind           | No controller identity, legal basis per purpose or international-transfer statement (GDPR Art. 13) | medium  | Absent before this change too; not caused by it                                                                                                                                                                                                     | defer      |
| 8   | blind           | Version 1.0.0 now names two different texts                                                        | —       | Rejected: decision 2 keeps 1.0.0 on purpose                                                                                                                                                                                                         | reject     |
| 9   | blind           | Help FAQ "Is my data private?" omits sync and diagnostics                                          | low     | `features/help/help-data.json:30`, unchanged by this story; not one of the four surfaces                                                                                                                                                            | defer      |
| 10  | blind           | Apple and Play questionnaires give diagnostics different purposes                                  | false   | Apple's App Functionality explicitly covers minimising crashes; Play's Analytics covers app performance. Each answer fits its own store's definitions                                                                                               | reject     |
| 11  | blind           | Play deletion link points at a page that is not live                                               | false   | The store document already forbids submitting the URL before 18-9, and policy §6 explains the deletion route                                                                                                                                        | reject     |
| 12  | blind           | "Camera permission denied" is not "an operation fails"                                             | low     | Rejected: a denied permission is a failed scan; wording only                                                                                                                                                                                        | reject     |
| 13  | blind           | No TS↔HTML policy parity test; retired-claim list misses three removed claims                      | low     | `test/privacy-copy.test.ts` checks date, version, processors and an address count only                                                                                                                                                              | patch      |
| 14  | blind, edge     | Feedback subject is English for Italian users                                                      | —       | Rejected: decision 3 fixes the subject "Cardì feedback"                                                                                                                                                                                             | reject     |
| 15  | blind           | "Riprova piu tardi" lacks its accent                                                               | low     | `it.ts` contact and feedback strings; a direct correction                                                                                                                                                                                           | patch      |
| 16  | blind           | Italian " - " vs English em dash                                                                   | false   | The Italian policy used " - " before this change; house style of that file                                                                                                                                                                          | reject     |
| 17  | blind           | `enableAutoSessionTracking` untested in development                                                | false   | The option is the literal `false`, not conditional on `__DEV__`                                                                                                                                                                                     | reject     |
| 18  | blind           | What We Collect Account row omits the account ID the policy discloses                              | low     | `en.ts`/`it.ts` `rows.account.detail`                                                                                                                                                                                                               | patch      |
| 19  | vg              | Italian What We Collect rows are untested                                                          | medium  | Pre-verified: the Italian block asserts only the header and the deviceid row; no key-parity check exists                                                                                                                                            | patch      |
| 20  | edge            | "Your cards never leave your device" contradicts the guest's own watch sync                        | low     | Policy §1 and §7; the watch paragraph describes cards going to the watch                                                                                                                                                                            | patch      |

Findings 1–4 share one root cause: the frozen truth picture says what a Sentry report holds, and the code sends more. Entry routed intent_gap; `review_loop_iteration` 1. Patches 5, 6, 13, 15, 18, 19 and 20 carry into the re-derivation.

Review pass 2 (2026-11-05), on the re-derived code after decision 4. Conventions and verification-gap layers: no findings.

| #   | Source      | Finding                                                                                  | Verdict | Evidence                                                                                                                                                                                                                       | Route        |
| --- | ----------- | ---------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| 21  | blind       | Wear OS crash reports disclosed; the checklist has no box for them                       | low     | Decision 5 accepts the copy; `docs/store/privacy-disclosures.md` checklist covers phone crashes only                                                                                                                           | patch        |
| 22  | blind       | The copy reaches users (merge, OTA) before ifero applies the Sentry IP setting and rules | medium  | The checklist gates only the consoles; the in-app copy's native-crash and IP claims hold only once the console settings exist                                                                                                  | human        |
| 23  | blind, edge | `trimContexts` passes `os` and other contexts through                                    | false   | Decision 4 allow-lists `device` and `app` only; `os` is the OS the copy discloses; the rest (`react_native_context`, `expo_updates`, `trace`) is app build data, nothing that identifies the user                              | reject       |
| 24  | blind, edge | UUID masking skips tags, contexts, `transaction`, `fingerprint`, `logentry.params`       | false   | App-sourced text reaches only `extra` (`logger.ts:139-142`), the exception, the message and breadcrumbs, all masked; tags are compile-time literals (`FixedMessage`); tracing is off in release; nothing sets the other fields | reject       |
| 25  | blind       | Breadcrumbs also record `http.query`, `http.fragment`                                    | false   | Those are span attributes (`@sentry/core` `fetch.ts`, `getFetchSpanAttributes`); fetch and xhr breadcrumbs carry `url`, `method`, `status_code` (`@sentry/browser` `breadcrumbs.js:192,265`)                                   | reject       |
| 26  | blind       | Policy names no controller, legal basis, right to object or transfers                    | medium  | carried: row 7                                                                                                                                                                                                                 | defer        |
| 27  | blind       | Version 1.0.0 now names two texts                                                        | —       | carried: row 8                                                                                                                                                                                                                 | reject       |
| 28  | blind       | Help FAQ privacy answer not updated; `help-fallback.ts` not in the test's surfaces       | low     | FAQ: carried row 9. The fallback file is a missed surface in the guard test                                                                                                                                                    | defer, patch |
| 29  | blind       | Play deletion web link                                                                   | false   | carried: row 11                                                                                                                                                                                                                | reject       |
| 30  | blind       | Right of access promises an export of account details                                    | low     | `SettingsScreen` `useExportData` exports `getAllCards()` only                                                                                                                                                                  | patch        |
| 31  | blind       | The keep-in-sync comment names three of six surfaces                                     | low     | `assets/legal/privacy-policy.ts` header                                                                                                                                                                                        | patch        |
| 32  | blind       | The address count `toBe(4)` depends on markup                                            | low     | `test/privacy-copy.test.ts`; a direct correction                                                                                                                                                                               | patch        |
| 33  | blind, edge | The mirror test is one-way                                                               | low     | Rejected: a two-way check means parsing the HTML into blocks, more than a direct correction, for a file generated from the TS                                                                                                  | reject       |
| 34  | blind       | No test cross-checks the store document's numbers                                        | low     | Rejected: new test machinery for a hand-read document                                                                                                                                                                          | reject       |
| 35  | edge        | Non-string breadcrumb data is not masked                                                 | low     | `scrubBreadcrumb` copies non-string values as-is; one call fixes it                                                                                                                                                            | patch        |
| 36  | edge        | Non-UUID query strings in navigation data or error text                                  | low     | Rejected: such query text identifies no one; UUIDs in it are masked                                                                                                                                                            | reject       |
| 37  | edge        | Entity-encoded retired claims evade the guard test                                       | low     | `read()` collapses whitespace only; the mirror test already decodes entities                                                                                                                                                   | patch        |

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors
- `yarn lint` -- expected: no errors
- `yarn format:check` -- expected: clean
- `yarn test` -- expected: all pass, including `test/privacy-copy.test.ts`

**Manual checks (if no CLI):**

- Device check: Help, What We Collect and the privacy policy on the iOS simulator and an Android emulator, light and dark, both languages; a signed-in user with consent at 1.0.0 sees no prompt.

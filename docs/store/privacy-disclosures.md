# Store privacy disclosures (Story 24.1)

The answers to copy into App Store Connect (App Privacy) and the Play Console (Data safety) for
Cardì 1.0. They are derived from the privacy policy (`assets/legal/privacy-policy.ts`, mirrored in
`assets/legal/privacy-policy.it.ts` and `docs/privacy-policy.html`), and each answer names the
policy section it rests on. If the policy changes, change this file in the same commit.

**Privacy policy URL:** `https://cardiapp.eu/privacy-policy.html`. It is live only after Story 18-9
moves `docs/` hosting to `cardiapp.eu`; until then, do not submit it to either console.

**Support and privacy contacts:** `support@cardiapp.eu`, `privacy@cardiapp.eu` (policy §10).

## What leaves the device, in one table

| Data                                                                                                          | Who                  | Sent to            | Policy |
| ------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------ | ------ |
| Crash and error reports: the error, app version and build, device model and OS                                | Everyone, guests too | Sentry (EU region) | §2, §4 |
| Wear OS crash reports, limited the same way                                                                   | Wear OS users        | Sentry (EU region) | §2     |
| Per-install update identifier, with app version and platform                                                  | Everyone             | Expo (app updates) | §2, §5 |
| Email address                                                                                                 | Account holders      | Supabase           | §2     |
| Account ID (assigned at sign-up)                                                                              | Account holders      | Supabase           | §2     |
| Loyalty cards: names, barcodes, formats, brands, colours, favourites, usage count, last-used time, timestamps | Account holders      | Supabase           | §2     |
| Consent record: whether and when the policy was accepted                                                      | Account holders      | Supabase           | §2, §3 |

Like any server, Supabase and Expo also receive the IP address each request comes from (§5). Neither
is asked to derive a location from it, and Sentry does not store it (§4, once the setting below is on).

Not collected: location (§2; it depends on the Sentry project's "Prevent Storing of IP Addresses"
setting being on), advertising identifiers (§2), contacts, photos (§2). No ads, nothing used to track users across
other companies' apps, no data sold or shared for advertising (§2, §3, §5). The Apple Watch app
talks only to the iPhone (§2).

## Before submitting

Every box must be ticked before either console is filled in. The copy promises what a Sentry report
holds; the JS side is trimmed in `core/observability/sentry.ts`, but native iOS and Android crashes
never pass through it (the RN SDK strips `beforeSend` and `beforeBreadcrumb` before initialising the
native SDK), so the Sentry project has to trim them on the server.

- [ ] **IP addresses.** Sentry project → Settings → Security & Privacy → "Prevent Storing of IP
      Addresses" is on (§4: "Sentry does not store the IP address a report arrives from").
- [ ] **Advanced Data Scrubbing rules.** Same page → Advanced Data Scrubbing → add each rule below
      exactly, written as `[Method] [Data Type] from [Source]`:

  | #   | Method  | Data type     | Source                                                                                                                                                            | Removes                                                       |
  | --- | ------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
  | 1   | Remove  | Anything      | `$user.*`                                                                                                                                                         | User id, IP address, geo, any user field                      |
  | 2   | Remove  | Anything      | `contexts.device.* && !contexts.device.model && !contexts.device.family && !contexts.device.manufacturer && !contexts.device.brand && !contexts.device.simulator` | Device id, memory, boot time, screen, timezone: all but model |
  | 3   | Remove  | Anything      | `contexts.app.* && !contexts.app.app_version && !contexts.app.app_build && !contexts.app.app_name && !contexts.app.app_identifier`                                | Install hash (`device_app_hash`), start time, memory          |
  | 4   | Remove  | Anything      | `contexts.culture.**`                                                                                                                                             | Locale, timezone, calendar                                    |
  | 5   | Remove  | Anything      | `tags.'app.device'`                                                                                                                                               | The install hash as a tag                                     |
  | 6   | Replace | Regex Matches | `$breadcrumb.data.url` with regex `[?#].*`                                                                                                                        | URL query strings and fragments (`?user_id=eq.<uuid>`)        |
  | 7   | Replace | UUIDs         | `$error.value \|\| $message \|\| $logentry.formatted \|\| $breadcrumb.message \|\| $breadcrumb.data.** \|\| extra.**`                                             | Account and card IDs in free text                             |

  Data Scrubbing selects by path, not by value, so it cannot drop a breadcrumb by its category. JS
  `console`, `touch` and `ui` breadcrumbs are dropped on the device before the native SDK receives
  them; the test crash below checks that no native-recorded touch or UI breadcrumb carries anything
  personal.

- [ ] **Retention.** The Sentry organisation's event retention is 90 days or less (§7: "kept by
      Sentry for up to 90 days").
- [ ] **A native test crash** from a release build (TestFlight or an internal Play track), on iOS
      and on Android: open the event in Sentry and confirm it holds no `user`, no
      `contexts.culture`, no `contexts.device.id`, no `contexts.app.device_app_hash`, no `app.device`
      tag, only the allow-listed device and app fields, no IP address or location, and no UUID or
      URL query string in its breadcrumbs.
- [ ] **A JS event** from the same release build, signed in and with sync failing (for example,
      offline then back online with a bad network), checked the same way.
- [ ] **Privacy-policy URL.** `https://cardiapp.eu/privacy-policy.html` is live (Story 18-9), and
      shows the same last-updated date as the in-app policy.
- [ ] **Wear OS.** Story 24-5 has merged, and a Wear OS test crash from a release build is checked
      in Sentry the same way as the phone's native crash.
- [ ] **Mailboxes.** `support@cardiapp.eu` and `privacy@cardiapp.eu` deliver mail.

## App Store Connect: App Privacy

**Do you or your third-party partners collect data from this app?** Yes.

**Tracking (data used to track you):** No data type is used for tracking. Cardì has no ads SDK, no
advertising identifier and shares nothing with data brokers (§2, §5).

| Category     | Data type             | Collected | Linked to the user | Used for tracking | Purposes          | Policy |
| ------------ | --------------------- | --------- | ------------------ | ----------------- | ----------------- | ------ |
| Contact Info | Email Address         | Yes       | Yes                | No                | App Functionality | §2, §3 |
| Identifiers  | User ID               | Yes       | Yes                | No                | App Functionality | §2     |
| Identifiers  | Device ID             | Yes       | No                 | No                | App Functionality | §2, §5 |
| User Content | Other User Content    | Yes       | Yes                | No                | App Functionality | §2, §3 |
| Usage Data   | Product Interaction   | Yes       | Yes                | No                | App Functionality | §2     |
| Diagnostics  | Crash Data            | Yes       | No                 | No                | App Functionality | §2, §3 |
| Diagnostics  | Other Diagnostic Data | Yes       | No                 | No                | App Functionality | §2, §3 |

Every other data type: not collected. In particular Location (Precise and Coarse), Contacts,
Photos or Videos, Browsing and Search History, Purchases, Financial Info, Health and Fitness,
Sensitive Info, Advertising Data, and Diagnostics → Performance Data (release builds send no
performance traces).

Notes for the answers:

- **User ID** is the Supabase account ID that keys the user's cards and consent record.
- **Device ID** is Expo's per-install update identifier. It is not linked: Expo receives no
  account, email or card data with it.
- **Other User Content** is the loyalty cards (names, barcode values and formats, brands, colours).
- **Product Interaction** is the per-card usage count and last-used time synced with the cards.
- **Crash Data** is crashes; **Other Diagnostic Data** is handled-error reports (for example, a
  failed update check). Neither is linked: reports carry no user, account, install or device
  identifier and no IP address is stored (§2, §4).

## Play Console: Data safety

**Does your app collect or share any of the required user data types?** Yes.

**Is all of the user data collected by your app encrypted in transit?** Yes (§4, TLS).

**Which of the following methods of account creation does your app support?** Username and
password (email sign-up). Account creation is optional: guest mode needs none (§1).

**Do you provide a way for users to request that their data is deleted?** Yes. In-app account
deletion erases the account, cards and consent records within 30 days (§6, §7). The Console also
asks for a web link for deletion requests: use the policy URL (§6 and §10 give the request
route, `privacy@cardiapp.eu`).

**Data shared with third parties:** None. Supabase, Sentry and Expo process data on Cardì's behalf
as service providers (§5), which Play does not count as sharing.

| Category                 | Data type                    | Collected | Shared | Processed ephemerally | Required or optional | Purposes                              | Policy |
| ------------------------ | ---------------------------- | --------- | ------ | --------------------- | -------------------- | ------------------------------------- | ------ |
| Personal info            | Email address                | Yes       | No     | No                    | Optional             | App functionality, Account management | §2, §3 |
| Personal info            | User IDs                     | Yes       | No     | No                    | Optional             | App functionality, Account management | §2     |
| App activity             | Other user-generated content | Yes       | No     | No                    | Optional             | App functionality                     | §2, §3 |
| App activity             | App interactions             | Yes       | No     | No                    | Optional             | App functionality                     | §2     |
| App info and performance | Crash logs                   | Yes       | No     | No                    | Required             | Analytics                             | §2, §3 |
| App info and performance | Diagnostics                  | Yes       | No     | No                    | Required             | Analytics                             | §2, §3 |
| Device or other IDs      | Device or other IDs          | Yes       | No     | No                    | Required             | App functionality                     | §2, §5 |

Every other data type: not collected. In particular Location (approximate and precise), Financial
info, Health and fitness, Messages, Photos and videos, Audio, Files and docs, Calendar, Contacts,
Web browsing, and App info and performance → Other app performance data.

Notes for the answers:

- **Optional** means guest mode: a user who never signs in sends none of it (§2).
- **Required** means every user, guests included: crash and error reports and the update
  identifier are sent whether or not there is an account (§2).
- **Analytics** for crash logs and diagnostics is Play's own purpose for data "used to collect data
  about how … your app performs", which is what crash and error reports are for (§3, "Diagnostics").
  They are not used for usage analytics: release builds send no performance traces and no session
  data.
- **App interactions** is the per-card usage count and last-used time synced with the cards.
- **Device or other IDs** is Expo's per-install update identifier, used only to deliver updates.
- The Wear OS app ships in the same Play listing; its crash reports fall under **Crash logs** above.

---
title: 'Release device pass [Gate]'
type: 'chore'
created: '2026-11-04'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
  - '{project-root}/docs/sprint-artifacts/stories/21-7-single-rebrand-release.md'
  - '{project-root}/docs/cicd.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 21.7 closed on 2026-09-30 by decision, with its AC8 table still reading "not yet performed" on every row. Since then, Sprint 23 has added its own unproven items:

- the corrected disclosures (24.1);
- the privacy manifests (24.2);
- the watch deep link (24.3);
- the screens bump (24.4);
- crash reporting (24.5);
- the listings (24.6);
- the new site (18.9).

Google Play also will not publish this personal account to production until a closed test has run with at least 12 testers for 14 consecutive days.

**Approach:** Build one release candidate from `main` after every other Sprint 23 story has merged, and run one table covering all four platforms. Every row gets a result, or a recorded acceptance by ifero. Then publish the `v1.0.0` GitHub Release, which triggers `store-upload.yml` for both stores. Submitting for review in the consoles stays ifero's click.

## Boundaries & Constraints

**Decisions (ifero, 2026-11-04):**

1. **The Play closed test is required** (personal account, created after 2023-11-13). It must reach 14 consecutive days with at least 12 opted-in testers before the production release. Because it is the longest item, ifero starts it as soon as possible on the current nightly or RC; it does not wait for this story. 24.7 records the start date, the tester count and the date production access was granted.
2. **24.7 ends by publishing the `v1.0.0` GitHub Release**, not a tag push (`store-upload.yml`'s comment explains why). The submission click in App Store Connect and in the Play Console is ifero's.

**Always:**

- **The table** lives in this spec's Implementation Notes, one RC, one result per row. It carries 21.7's AC8 rows 1–17e and 18–24, with these updates:
  - row 20 is closed by 24.6;
  - row 21 is closed by 24.1;
  - row 23 is decision 1.

  It adds these rows:
  - **a.** TalkBack across the main flows, and the Android-only keyboard path in `shared/components/ui/FormScreen.tsx:170-187`.
  - **b.** Account deletion end to end: the account is gone, the cloud data is removed or queued for removal within 30 days, and sign-in afterwards fails.
  - **c.** The Apple Watch on the RC. ifero verified the nightlies on hardware on 2026-11-02; this row confirms that the release build behaves the same.
  - **d.** A TestFlight upload of the RC with no ITMS-91053 notice (24.2).
  - **e.** The 24.3 deep-link routes on the real watch.
  - **f.** No crash in a full Android navigation pass (24.4).
  - **g.** One symbolicated phone crash, and one Wear crash, already proven in 24.5 and linked here.
  - **h.** `https://cardiapp.eu/` and the privacy-policy URL live; the uptime monitor green (18.9).
  - **i.** support@ and privacy@cardiapp.eu deliver a test mail.
  - **j.** The Sentry "Prevent Storing of IP Addresses" setting is on for both projects, and one RC event shows no `app.device` tag and no `user.geo`.
  - **k.** On the RC, check whether "Wear OS card snapshot publish failed" and "Expo update check failed" still fire; file a story for each one that does.

- **Answers:** "Not performed" or "accepted by ifero" are valid answers; a blank is not.
- **Rollback:** 21.7's AC5 rollback position is re-read and confirmed, or updated, before publishing.
- **Version:** `expo.version` stays `1.0.0` and the tag is `v1.0.0`, per 21.7's decision.

**Never:**

- Publish with a blank row.
- Fix a defect found here inside this story. It becomes its own story, or an accepted row.
- Submit for review.
- Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario               | Input / State                                | Expected Output / Behavior                                               | Error Handling                                  |
| ---------------------- | -------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------- |
| All rows pass          | Every row has a result or an acceptance      | `v1.0.0` Release published; `store-upload.yml` runs green                | A failed upload stops the story and is reported |
| A row fails            | A defect on the RC                           | Not published; a new story is filed, or ifero accepts the row            | N/A                                             |
| Closed test incomplete | Fewer than 14 days, or fewer than 12 testers | Not published to Play production; iOS may go ahead only if ifero says so | Recorded                                        |
| Stale RC               | A merge lands on `main` after the RC was cut | The RC is re-cut and the affected rows are re-run                        | N/A                                             |

</frozen-after-approval>

## Code Map

- `docs/sprint-artifacts/stories/21-7-single-rebrand-release.md`
  - `:126-145`: AC5 and AC8.
  - `:437+`: the rollback position.
  - `:524-547`: device rows 1–17e.
  - `:563-571`: the before-publishing rows 18–24, with their notes after them.
- `.github/workflows/store-upload.yml:8-27` -- triggered by a published release, or by `workflow_dispatch` with a tag. It uploads iOS and Android, Wear included.
- `.github/workflows/beta-releases.yml`, `nightly-builds.yml` -- the RC and nightly lanes that feed the closed test and the TestFlight check (row d).
- `shared/components/ui/FormScreen.tsx:170-187` -- row a.
- `features/settings/components/DeleteAccountSheet.tsx`, `supabase/functions/delete-account` -- row b.
- `supabase/config.toml:231-243` -- row 18's email templates (a manual dashboard deploy).
- Sentry org `andrea-pacino` (`de.sentry.io`): issue REACT-NATIVE-6 (Wear snapshot publish failed) and REACT-NATIVE-5 (Expo update check failed) -- row k.

## Tasks & Acceptance

**Execution:**

- [ ] Confirm that every other Sprint 23 story is `done` (merged), then cut the RC. Rationale: one build for everything.
- [ ] Fill the table in Implementation Notes, ifero driving the device rows. Rationale: results, not decisions.
- [ ] Re-read and confirm the rollback position. Rationale: 21.7 AC5.
- [ ] Publish the `v1.0.0` GitHub Release and watch `store-upload.yml`. Rationale: decision 2.

**Acceptance Criteria:**

- Given the table, when it is reviewed, then no row is blank, and every acceptance names ifero and a date.
- Given the published Release, when `store-upload.yml` finishes, then both stores hold the build for review. Implementation Notes link the run.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `gh run list --workflow store-upload.yml --limit 1` -- expected: the `v1.0.0` run succeeded

**Manual checks (if no CLI):**

- The table itself. Console confirmation that the iOS build is processed and the Play release is drafted.

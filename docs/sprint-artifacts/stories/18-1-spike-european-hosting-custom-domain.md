---
title: 'Hosting and domain ADR (OVHcloud, cardiapp.eu)'
type: 'chore'
created: '2026-11-04'
status: 'done'
baseline_commit: 'c971139395beae3dce679eb54689d425b67c76ce'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** ifero chose OVHcloud and `cardiapp.eu` on 2026-11-03, ahead of this spike, and has bought the domain. Nothing written down yet says why, or what 18.9 and 18.10 need from the host: HTTPS, the `/.well-known/` content type, a deploy path from CI, and a redirect from GitHub Pages. Without that, 18.9 starts by rediscovering it.

**Approach:** Write `docs/adr-2026-11-04-share-page-hosting.md`. It records the decision and the reasons for it, verifies the concrete OVHcloud product the site will run on against the requirements 18.9 and 18.10 depend on, and lists the rejected alternatives with their reasons.

## Boundaries & Constraints

**Always:**

- **Sources:** every vendor fact (price, SLA, TLS, `.htaccess`, SFTP, facility) is checked against OVHcloud's own current pages and cited with its URL and the date it was read.
- **Plan tier:** the product scored is the one being bought. Check first whether the hosting included with the `.eu` domain is enough. If it is not, name the cheapest OVHcloud web-hosting tier that is, give its price, and leave the spend to ifero.
- **Downtime:** convert every SLA percentage into permitted downtime per month. State plainly that no host is free of downtime.
- **SBG2:** record the March 2021 Strasbourg fire, what has changed since, and which facility the plan would run in.
- **Residency:** the EU/EEA-only rule stands. OVHcloud SAS is French, so the CLOUD Act caveat that applied to the US-parented vendors does not apply here.

**Decision (ifero, 2026-11-04):** the ADR records the decision already made rather than re-scoring the five vendors. Each rejected vendor gets a short paragraph with its reason: Netsons, no published `.eu` price found; Namecheap and Spaceship, a US parent; Infomaniak, Switzerland, excluded by the residency rule. This narrows Story 18.1's scored-matrix and domain-shortlist criteria; `cardiapp.eu` is already bought.

**Never:** Buy, configure or deploy anything. Edit the site or `docs/` content beyond the new ADR. Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario                     | Input / State                                        | Expected Output / Behavior                                                           | Error Handling                                |
| ---------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------- |
| Included hosting is enough   | It offers HTTPS, `.htaccess` and an automated upload | ADR recommends it, at no extra cost                                                  | N/A                                           |
| Included hosting falls short | Any requirement is missing (e.g. no SFTP, no TLS)    | ADR names the cheapest tier that meets them, with its price, as a decision for ifero | Never assume a feature without a cited source |
| A fact can't be verified     | OVHcloud doesn't publish it                          | Recorded as unverified, with how to settle it (a support ticket or a test in 18.9)   | N/A                                           |

</frozen-after-approval>

## Code Map

- `docs/epics.md` Story 18.1 -- the original criteria. These stay requirements: AASA as `application/json`, `assetlinks.json` at the root, Apple's AASA CDN caching, CI deploy mechanism and secrets, no build step (Epic 15 AC1), the redirect from `ifero.github.io/myLoyaltyCards` (shipped in `og:url`), TLS auto-renewal and the renewal price
- `docs/adr-2026-06-09-watch-usage-events.md` -- the house ADR format to follow
- `docs/index.html:16` -- `og:url` = `https://ifero.github.io/myLoyaltyCards`
- `docs/cicd.md` -- where 18.9 documents the deploy; the ADR names the mechanism only
- GitHub Pages serves the whole `docs/` folder, so the ADR states which files the new host should publish (the public pages only, not the planning documents). 18.9 implements that.

## Tasks & Acceptance

**Execution:**

- [x] `docs/adr-2026-11-04-share-page-hosting.md` (new) -- decision, context, the verified OVHcloud product and its requirement checklist, cost (first year and renewal), SLA and downtime, SBG2, redirect strategy, the files to publish, rejected alternatives, consequences for 18.9 and 18.10. Rationale: 18.9 builds from it.

**Acceptance Criteria:**

- Given the ADR, when 18.9 is refined, then every hosting fact 18.9 needs (TLS, `.htaccess` content type, deploy method and credentials, facility, cost) is answered with a source, or explicitly marked unverified with how to settle it.
- Given the redirect section, when a visitor opens `ifero.github.io/myLoyaltyCards` after 18.9, then the ADR's specified mechanism reaches `cardiapp.eu`. GitHub Pages cannot send HTTP redirects, so the ADR says which method it uses.
- Given the cost section, when ifero reads it, then the first-year and renewal prices of both the domain and the hosting are stated, with VAT.

## Implementation Notes

- **Device check:** skipped. The change is one Markdown ADR under `docs/` and cannot reach the app.
- **Step 4 patches:** the 13 patch rows of the Review Triage Log were applied to the ADR by the implementation subagent. Namecheap's and Spaceship's US-parent claims are marked unverified in the ADR: both sites returned HTTP 403 to automated reads, so ifero confirms the contracting entity in a browser.

### Review loops

- **Code review, round 1** (Sonnet, diff after the step 4 patches): `VERDICT: APPROVED`, no comments.
- **QA review, round 1** (Sonnet, every matrix row, acceptance criterion and Always item mapped to the ADR, `yarn format:check`, `yarn lint` and the source-and-read-date manual check): `VERDICT: APPROVED`, no comments.
- **Walkthrough patch (ifero, 2026-11-09):** ifero had already activated the OVHcloud hosting and set up the domain's mailboxes. Read-only live checks (`dig`, `curl -sI`, `openssl s_client`) settled row 1b (`www` has its own Let's Encrypt certificate) and the mailbox host (OVHcloud email); the ADR gained a Live checks section and source [S25], and its activation and mailbox steps were removed. The plan tier and datacentre are not visible from outside and go to ifero (Control Panel).
- **Code review, round 2** and **QA review, round 2** (Sonnet, on the patched diff): `VERDICT: APPROVED`, no comments.

### Found, not fixed

- `docs/epics.md:3379` (the Hosting row of the Epic 18 summary) still says the host will be "chosen by the Story 18.1 spike across Netsons, Namecheap, Spaceship, Infomaniak and OVHcloud". Now that the ADR records OVHcloud and `cardiapp.eu`, that row (and `docs/architecture.md`, if it gains a hosting section) needs updating. This story may not edit `docs/` beyond the ADR, so it is a follow-up.

## Spec Change Log

## Review Triage Log

Step 4, round 1 (blind hunter, edge-case hunter, verification gap, project conventions). Verification gap and project conventions: no findings (one Markdown file, no executable change).

| #   | Source  | Finding                                                                                                                                                                                                            | Verdict | Route  | Evidence                                                                                                                                                                                          |
| --- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ECH, BH | `www.cardiapp.eu` never handled: no DNS record, certificate coverage or HTTPS redirect for `www`                                                                                                                   | medium  | patch  | The `.htaccess` rule only matches port 80 and the activation note ticks only the apex A record; `https://www.` gets no redirect and its certificate is unstated                                   |
| 2   | ECH     | `RewriteCond %{SERVER_PORT} 80` is unanchored, so it matches 8080 or 800                                                                                                                                           | low     | patch  | Apache conditions are unanchored regexes; anchoring is a direct correction                                                                                                                        |
| 3   | ECH     | The Starter fallback for row 4 may not fix the AASA content type, since Starter runs on the same shared Apache under the same contract                                                                             | medium  | patch  | The ADR states the plans share infrastructure and contract yet offers Starter as the fix for a `mod_mime` gap without evidence it differs                                                         |
| 4   | ECH, BH | Delete-on-mirror scope is underspecified: a rollback to an older ref deletes `.htaccess`/`.well-known/`; files placed in `www/` outside the allow-list are deleted; dotfiles must be in the staging set explicitly | medium  | patch  | Deploy section allows "a delete-on-mirror inside `www/`" with no exclusions; a pre-18.10 ref has no `.well-known/`                                                                                |
| 5   | ECH     | A cluster move (allowed by [S14]) changes the SFTP host and host key, blocking deploys                                                                                                                             | low     | patch  | Pinned `OVH_SFTP_KNOWN_HOSTS` would mismatch; one sentence covers it                                                                                                                              |
| 6   | ECH, BH | `privacy@cardiapp.eu` is assumed to work; the ADR never establishes a mailbox exists, who hosts it, or where                                                                                                       | medium  | patch  | `docs/privacy-policy.html:281,505` publish it; the ADR's MX note presumes a mail setup that nothing confirms                                                                                      |
| 7   | BH      | No HSTS decision                                                                                                                                                                                                   | low     | patch  | Neither decided nor deferred; a one-line deferral is a direct addition                                                                                                                            |
| 8   | BH      | Epic 18.1 criteria not scored and not listed as waived: 12-month status history, control-panel and DNS quality, support responsiveness                                                                             | medium  | patch  | The "Narrows" line names only the matrix and the shortlist; these are scoring criteria covered by the 2026-11-04 decision not to re-score, so the ADR must say so (ifero confirms at walkthrough) |
| 9   | BH      | Registrar and host not weighed as separable; the lock-in (moving the domain kills the free hosting) is not in Risks                                                                                                | low     | patch  | Mentioned only as an auto-renew reminder                                                                                                                                                          |
| 10  | BH      | Availability reason 2 overstates: without the app, or before 18.10, `/card/` needs the origin                                                                                                                      | medium  | patch  | ADR line "works without the server for anyone who has the app" is wrong before 18.10 and restates reason 1 after it                                                                               |
| 11  | BH      | Non-OVHcloud vendor facts carry no source (Namecheap US incorporation, Spaceship's parent, Netsons needing a paid plan)                                                                                            | medium  | patch  | The spec's manual check requires every vendor claim to carry a source URL and read date                                                                                                           |
| 12  | BH      | [S9] and [S13] cite an aggregate `llms-full.txt` instead of the specific guides                                                                                                                                    | low     | patch  | A reader cannot confirm the claims behind them; citing the guide URLs is a direct correction                                                                                                      |
| 13  | BH      | `assetlinks.json` test omits `Content-Type: application/json` and no-redirect                                                                                                                                      | medium  | patch  | Android verification requires both; row 5 checks reachability only                                                                                                                                |
| 14  | ECH     | Other `github.io` paths 404 after the switch                                                                                                                                                                       | low     | reject | Deliberate: 18.9's approved spec publishes two stubs only so the planning documents stop being public                                                                                             |
| 15  | BH      | 18.9 consequences omit updating `og:url` and store-listing URLs                                                                                                                                                    | false   | reject | 18.9's spec already requires `og:url` and every hard-coded URL to point to `cardiapp.eu` (lines 45, 86); the ADR's list is not the 18.9 task list                                                 |
| 16  | BH      | Stale hosting row in `docs/epics.md:3379`; no owner named                                                                                                                                                          | low     | defer  | Pre-existing text; the spec forbids editing `docs/` beyond the ADR. Under Found, not fixed                                                                                                        |
| 17  | BH      | No dedicated least-privilege CI FTP user or rotation note                                                                                                                                                          | low     | reject | Whether the free plan allows a second FTP user is unpublished; guidance would need new facts, and the CI secret is already scoped to the deploy                                                   |

## Verification

**Commands:**

- `yarn format:check` -- expected: clean
- `yarn lint` -- expected: no errors

**Manual checks (if no CLI):**

- Every vendor claim in the ADR carries a source URL and a read date.

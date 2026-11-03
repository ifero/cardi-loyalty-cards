---
title: 'Hosting and domain ADR (OVHcloud, cardiapp.eu)'
type: 'chore'
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

- [ ] `docs/adr-2026-11-04-share-page-hosting.md` (new) -- decision, context, the verified OVHcloud product and its requirement checklist, cost (first year and renewal), SLA and downtime, SBG2, redirect strategy, the files to publish, rejected alternatives, consequences for 18.9 and 18.10. Rationale: 18.9 builds from it.

**Acceptance Criteria:**

- Given the ADR, when 18.9 is refined, then every hosting fact 18.9 needs (TLS, `.htaccess` content type, deploy method and credentials, facility, cost) is answered with a source, or explicitly marked unverified with how to settle it.
- Given the redirect section, when a visitor opens `ifero.github.io/myLoyaltyCards` after 18.9, then the ADR's specified mechanism reaches `cardiapp.eu`. GitHub Pages cannot send HTTP redirects, so the ADR says which method it uses.
- Given the cost section, when ifero reads it, then the first-year and renewal prices of both the domain and the hosting are stated, with VAT.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `yarn format:check` -- expected: clean
- `yarn lint` -- expected: no errors

**Manual checks (if no CLI):**

- Every vendor claim in the ADR carries a source URL and a read date.

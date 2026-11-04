---
title: 'Migrate the public site to cardiapp.eu'
type: 'chore'
created: '2026-11-04'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
  - '{project-root}/docs/adr-2026-11-04-share-page-hosting.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The public site is served by GitHub Pages at `ifero.github.io/myLoyaltyCards`, straight from the whole `docs/` folder. That exposes the PRD, the architecture, the sprint artifacts and `ux-design-directions.html` along with the landing page and the privacy policy. The 1.0 store listings need a privacy-policy URL on `cardiapp.eu`, on OVHcloud, which ifero chose under the EU/EEA-only rule.

**Approach:**

- Deploy an explicit allow-list of public files to the OVHcloud host chosen in Story 18.1's ADR, on `cardiapp.eu`, with automatic TLS. A GitHub Actions workflow does this on every merge to `main` that touches one of those files, and on demand for a given ref, which is also the rollback path.
- Replace the GitHub Pages site with redirect stubs to `cardiapp.eu`.
- Watch the site with an uptime monitor.

## Boundaries & Constraints

**Decisions (ifero, 2026-11-04):**

1. **Redirect stubs only on GitHub Pages.**
   - Pages switches its source to a GitHub Actions build that publishes stubs and nothing else: `index.html` and `privacy-policy.html`, each with a meta refresh, a `rel=canonical` and a plain link to the same path on `https://cardiapp.eu/`.
   - The planning documents stop being public.
   - Switching the Pages source in the repository settings is ifero's step.
2. **Public pages only.** The allow-list is `index.html`, `privacy-policy.html`, `style.css` and `assets/**` without `README.md` files. These are published byte-identical. Nothing else is published, `ux-design-directions.html` and `help.json` included.

**Always:**

- **No build step** for the site (Epic 15 AC1). The workflow copies the allow-listed files; it does not transform them.
- **Credentials:**
  - deploy credentials live in GitHub Actions secrets (names recorded in `docs/cicd.md`);
  - no secret is ever written into the repository;
  - transfer is SFTP or FTPS as the ADR names, never plain FTP.
- **HTTPS:** HTTPS only. An `.htaccess` in the allow-list forces HTTPS, if the ADR confirms Apache. Apply exactly the ADR's hosting facts; if a needed fact is marked unverified there, settle it first and record the result.
- **URLs updated:**
  - `og:url` and every hard-coded site URL in the published pages point to `https://cardiapp.eu/`;
  - the app's Help contacts are Story 24.1's and are not touched here.
- **Uptime monitoring:** a Sentry uptime monitor (the existing EU organisation) on `https://cardiapp.eu/` and `/privacy-policy.html`, alerting ifero by email. Creating it is an account change: ifero does it, or Claude does it through the Sentry connection with ifero's go-ahead. The `/.well-known/apple-app-site-association` monitor waits for 18.10.
- **Rollback:** documented in `docs/cicd.md` as a manual run of the workflow on a previous ref, and exercised once.

**Never:**

- Add `/.well-known/` files (18.10).
- Change the site's content or copy (24.1).
- Publish anything outside the allow-list.
- Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario                | Input / State                                        | Expected Output / Behavior                                  | Error Handling                       |
| ----------------------- | ---------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------ |
| Merge touching the site | A change under the allow-list lands on `main`        | Deployed; `https://cardiapp.eu/` serves the new files       | A failed upload fails the job loudly |
| Merge not touching it   | Any other change                                     | No deploy                                                   | N/A                                  |
| Unlisted file           | `ux-design-directions.html`, `prd.md`                | 404 on `cardiapp.eu`; absent from the Pages stubs           | N/A                                  |
| Old URL                 | `ifero.github.io/myLoyaltyCards/privacy-policy.html` | Stub redirects to `https://cardiapp.eu/privacy-policy.html` | Plain link if refresh is blocked     |
| HTTP                    | `http://cardiapp.eu/`                                | Redirect to HTTPS                                           | N/A                                  |
| Rollback                | Manual run with `ref` set to a previous commit       | That commit's allow-listed files are live                   | N/A                                  |

</frozen-after-approval>

## Code Map

- `docs/index.html` -- `:16` `og:url` (`https://ifero.github.io/myLoyaltyCards`); `:18` `style.css`; `:25` and `:91-353` `assets/` images; `:376` the privacy-policy link. All relative except `og:url`.
- `docs/privacy-policy.html`, `docs/style.css`, `docs/assets/` (`badges/`, `cardi-mark-inline.svg`, `screenshots/` with a `README.md` to exclude) -- the rest of the allow-list.
- `docs/help.json` -- read only by `features/help/HelpScreen.test.tsx:24`; not published. Nothing in the app fetches from the site (checked across `app`, `features`, `shared`, `core`, `assets`, `app.json`, `app.config.ts`, `scripts` and `.github`).
- `.github/workflows/` -- no Pages workflow exists today; Pages serves `docs/` from the branch. Add `site-deploy.yml` (deploy to OVHcloud plus the Pages stubs job), with a concurrency group and `timeout-minutes`, following `nightly-builds.yml`'s `workflow_dispatch` and `ref` input pattern.
- `docs/adr-2026-11-04-share-page-hosting.md` (from Story 18.1) -- the host product, transfer protocol, TLS, `.htaccess` and cost facts this story applies.
- `docs/cicd.md` -- add the site pipeline, its secrets, the stubs and rollback.
- `.prettierignore:39` -- mentions the GitHub Pages URL; update it.
- `scripts/check-story-catalogue-sync.mjs` and similar CI checks read `docs/`. They are unaffected, because the files stay in place.

## Tasks & Acceptance

**Execution:**

- [ ] `.github/workflows/site-deploy.yml` (new) -- the allow-list copy and transfer, the path filter, `workflow_dispatch` with `ref`, and the Pages stubs job. Rationale: automated, rollback-able deploys.
- [ ] `docs/index.html` -- `og:url` set to `https://cardiapp.eu/`. Rationale: the canonical URL.
- [ ] `docs/.htaccess` (new, if the ADR confirms Apache) -- force HTTPS. Rationale: HTTPS only.
- [ ] `test/site-allow-list.test.ts` (new) -- the workflow's allow-list matches decision 2, and no listed file links to a path outside it. Rationale: nothing private leaks back.
- [ ] `docs/cicd.md`, `.prettierignore` -- documentation. Rationale: operability.

**Acceptance Criteria:**

- Given the first deploy, when `https://cardiapp.eu/` and `/privacy-policy.html` are fetched, then they are byte-identical to `docs/` at that commit and served over a valid certificate.
- Given the Pages source switched by ifero, when the old URLs are opened, then each lands on its `cardiapp.eu` counterpart, and `ifero.github.io/myLoyaltyCards/prd.md` returns 404.
- Given the uptime monitor, when it is listed in Sentry, then both URLs are monitored and alerts go to ifero.
- Given one rollback run, when it completes, then the previous commit's files are live; it is then rolled forward.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `yarn lint`, `yarn format:check`, `yarn test` -- expected: pass, including `test/site-allow-list.test.ts`
- `curl -sI https://cardiapp.eu/` and `curl -sI http://cardiapp.eu/` -- expected: 200 over HTTPS, and a redirect from HTTP

**Manual checks (if no CLI):**

- The old URLs in a browser; the certificate details; the Sentry monitor list.

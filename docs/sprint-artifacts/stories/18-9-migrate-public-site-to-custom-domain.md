---
title: 'Migrate the public site to cardiapp.eu'
type: 'chore'
created: '2026-11-04'
status: 'done'
baseline_commit: '83e82333cc4955f4ad9f917ccc90bd3a829c3213'
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

- [x] `.github/workflows/site-deploy.yml` (new) -- the allow-list copy and transfer, the path filter, `workflow_dispatch` with `ref`, and the Pages stubs job. Rationale: automated, rollback-able deploys.
- [x] `docs/index.html` -- `og:url` set to `https://cardiapp.eu/`. Rationale: the canonical URL.
- [x] `docs/.htaccess` (new, if the ADR confirms Apache) -- force HTTPS. Rationale: HTTPS only.
- [x] `test/site-allow-list.test.ts` (new) -- the workflow's allow-list matches decision 2, and no listed file links to a path outside it. Rationale: nothing private leaks back.
- [x] `docs/cicd.md`, `.prettierignore` -- documentation. Rationale: operability.

**Acceptance Criteria:**

- Given the first deploy, when `https://cardiapp.eu/` and `/privacy-policy.html` are fetched, then they are byte-identical to `docs/` at that commit and served over a valid certificate.
- Given the Pages source switched by ifero, when the old URLs are opened, then each lands on its `cardiapp.eu` counterpart, and `ifero.github.io/myLoyaltyCards/prd.md` returns 404.
- Given the uptime monitor, when it is listed in Sentry, then both URLs are monitored and alerts go to ifero.
- Given one rollback run, when it completes, then the previous commit's files are live; it is then rolled forward.

## Implementation Notes

- **Stubs location:** `.github/pages-redirect-stubs/` (`index.html`, `privacy-policy.html`). The spec does not name a folder; outside `docs/` so the stubs are never mistaken for site content, and the `pages` job always publishes them from the workflow's own commit, never from `inputs.ref`, so a rollback cannot republish `docs/` on Pages. No `robots noindex` on the stubs: Google advises against combining it with `rel=canonical`.
- **Allow-list lives in the workflow** as four single-line job env values (`SITE_FILES`, `SITE_OPTIONAL_FILES` = `.htaccess`, `SITE_TREES` = `assets`, `SITE_TREE_EXCLUDE` = `README.md`). The stage logic is inline in the workflow, not a repo script, so a rollback to a pre-18.9 ref (no script, no `.htaccess`) still works; a missing `.htaccess` keeps the live one. The test reads the workflow as text (no `js-yaml`: transitive only).
- **Deletion scope (ADR "Deploy mechanism"):** `lftp mirror --reverse --delete --transfer-all` per allow-listed tree only, `put` for single files; nothing else in `www/` or above it is touched. Upload order: trees and non-HTML first, pages last.
- **The job verifies itself:** after upload it fetches `index.html`, `privacy-policy.html` and `style.css` over HTTPS and `cmp`s them with the staged bytes (`curl -f` also rejects a bad certificate), and asserts 301s to `https://cardiapp.eu/` from `http://cardiapp.eu/`, `http://www.cardiapp.eu/` and `https://www.cardiapp.eu/` (ADR row 3 and the `www` smoke test).
- **`.htaccess`** is the ADR's snippet verbatim (Apache confirmed live, row 3). HSTS not added (ADR decision 7: `mod_headers` unverified; optional here).
- **Hosting facts not yet settled (ifero's Control Panel):** plan tier and datacentre are recorded in `docs/cicd.md` as "to be read by ifero". Live check 2026-11-10: Apache, Let's Encrypt `CN=cardiapp.eu` (expires 2027-02-02), OVHcloud placeholder still served, HTTP not yet redirected, `/prd.md` 404.
- **Not done here (human/account steps):** enabling SFTP and adding the four `OVH_SFTP_*` secrets; switching the Pages source to GitHub Actions; the Sentry uptime monitor (account change, needs ifero's go-ahead); the first deploy, the rollback exercise and roll-forward; the test message to `privacy@cardiapp.eu` (ADR consequence). The runbook for all of these is `docs/cicd.md` "Set up the site deploy" and "Roll back the site".
- **Orchestrator, step 3:** added a test pinning the rollback wiring (matrix row "Rollback"): `workflow_dispatch` has a `ref` input, the deploy checkout uses `inputs.ref || github.sha`, and the `pages` job needs `deploy` and never reads `inputs.ref`.
- **Live acceptance is post-merge.** A `workflow_dispatch` workflow can only run once it exists on the default branch, so ACs 1, 2 and 4 (first deploy, old URLs, rollback) and AC3 (the Sentry monitor, an account change) can only be checked after the merge and ifero's setup steps. They go to the human.
- **Device check: skipped.** The change cannot reach the app: it is a CI workflow, a test, documentation and the public website files, and nothing in the app fetches the site (Code Map).
- **Review loops:** code review round 1 (fresh Sonnet reviewer, diff since baseline) — APPROVED with zero comments. QA review round 1 (every matrix row and AC mapped to its evidence) — APPROVED with zero comments.

- **SFTP checked before the merge (ifero, 2026-11-13).** A local `lftp` run with the workflow's connection settings and the pinned host key of `ssh.cluster129.hosting.ovh.net` logged in, reached `www/`, and a `mirror --dry-run` listed the 11 allow-listed asset files to upload, with nothing to delete. It also found that OVHcloud's placeholder `www/index.html` is a symlink owned by `ovh`. An SFTP `put` would follow it rather than replace it, so `docs/cicd.md` ("Set up the site deploy", step 5) now says to delete it just before the merge. The Sentry uptime monitors exist in the `react-native` project: the landing page one is active, and the privacy policy one is paused until the first deploy.

### Found, not fixed

- The planning documents (`prd.md`, `architecture.md`, sprint artifacts) were public on `ifero.github.io/myLoyaltyCards/` and may be indexed or archived. The stubs make them 404 from now on, but removing indexed copies (a Google Search Console removal request) is a separate ifero action.
- Unverified, high if true: OVHcloud's documented `SERVER_PORT ^80$` redirect would loop if TLS terminated upstream and HTTPS reached Apache on port 80. The first deploy settles it; the verify step fails red on it.
- The deploy secrets are repository secrets. Scoping them to a protected `cardiapp-eu` environment limited to `main` would harden them further; it needs a repository-settings change and a spec decision.

## Spec Change Log

## Review Triage Log

| #   | Source                  | Finding                                                                                          | Verdict     | Route / evidence                                                                                                                                                                               |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | verification-gap        | The stage bash is never executed by a test; `publishedSet()` re-implements it                    | medium      | patch: a test runs the extracted `run:` block against a copy of `docs/` and compares `_site/`, plus symlink and missing-file failures                                                          |
| 2   | blind-hunter            | Secrets not scoped to a protected environment; any pushed branch can dispatch                    | low         | rejected: single-maintainer repo, and push rights already expose repo secrets to any workflow; recorded under Found, not fixed. The non-main dispatch half is row 13                           |
| 3   | blind-hunter, edge-case | `www.cardiapp.eu` has no certificate, so the HTTPS `www` check fails on TLS                      | false       | ADR live check 2026-11-09 (row 1b): `www.cardiapp.eu` serves its own verified Let's Encrypt certificate, `CN=www.cardiapp.eu`                                                                  |
| 4   | edge-case               | `curl` failure inside `headers="$(…)"` under `set -e` exits with no `::error::`                  | low         | patch: the assignment reports the unreachable URL and exits                                                                                                                                    |
| 5   | blind-hunter            | `.htaccess` may loop if OVHcloud terminates TLS upstream so HTTPS arrives on port 80             | maybe-false | deferred, high if true: the rule is OVHcloud's own documented snippet [S7]; the first deploy settles it and the verify step fails red on it                                                    |
| 6   | blind-hunter            | Verify step skips assets, deep-path redirects and an explicit "apex does not redirect"           | low         | rejected: the apex is covered by `cmp` (a 301 body never matches), path preservation is pinned by the `.htaccess` test (`$1`), and a missing asset is a visible 404, not a leak                |
| 7   | blind-hunter            | Published pages lack self-canonicals; `/` and `/index.html` both serve the homepage              | low         | rejected: changing the site's content is out of scope by intent (Never, 24.1)                                                                                                                  |
| 8   | blind-hunter            | Already-indexed planning docs are not addressed                                                  | low         | deferred: pre-existing exposure, not caused by this change; recorded under Found, not fixed                                                                                                    |
| 9   | blind-hunter, edge-case | The link check misses `srcset`, single-quoted attributes and JS-built paths                      | low         | rejected: neither published page uses `srcset` or single-quoted `href`/`src` (grep: 0); hypothetical, and widening the parser adds complexity                                                  |
| 10  | blind-hunter            | The test does not tie `mirror --delete` to `SITE_TREES` only                                     | low         | rejected: a hypothetical future edit; deletion scope is reviewed in the workflow and documented in `docs/cicd.md`                                                                              |
| 11  | blind-hunter            | A pending rollback dispatch can be cancelled by a newer pending run in the concurrency group     | low         | patch: "Roll back the site" says to check the run started and dispatch again if cancelled                                                                                                      |
| 12  | blind-hunter            | Runbook loose ends (monitor owner, tier placeholder, disclosures checklist, password rotation)   | low         | patch for the disclosures-checklist note; the rest rejected: the runbook is headed as ifero's, the tier and monitor are tracked in Implementation Notes, and rotation is a routine secret edit |
| 13  | edge-case               | Dispatch from a non-default branch: `pages` rejected by `github-pages` protection after a deploy | low         | patch: the deploy job fails fast unless `github.ref` is `refs/heads/main`; documented in the rollback runbook                                                                                  |
| 14  | edge-case               | Stale content right after upload makes `cmp` fail spuriously                                     | maybe-false | rejected: low even if true (a red, re-runnable run on a correct deploy); shared hosting serves from its filer with no CDN in front                                                             |
| 15  | edge-case               | A tree holding only excluded files is never created, so `mirror` fails                           | low         | rejected: hypothetical (`assets/` has many files and the test asserts it is non-empty); the failure is loud                                                                                    |
| 16  | edge-case               | A `SITE_FILES` entry with a subdirectory breaks `cp`/`put`                                       | low         | rejected: hypothetical; 18.8 and 18.10 add trees, which `SITE_TREES` handles; the failure is loud                                                                                              |
| 17  | edge-case               | `href="./"` would fail the link test falsely                                                     | low         | rejected: no such link exists; a false failure is loud, not a leak                                                                                                                             |
| 18  | edge-case               | A local `.DS_Store` in the stubs folder fails the "exactly two stubs" test on macOS              | low         | patch: dotfiles filtered out of that listing                                                                                                                                                   |
| 19  | edge-case (claim)       | Old `style.css` and `assets/*` URLs on Pages 404 rather than redirect                            | false       | not a defect: decision 1 publishes exactly two stubs, and the matrix row covers pages only                                                                                                     |
| 20  | project-conventions     | No violations                                                                                    | —           | nothing to route                                                                                                                                                                               |

## Verification

**Commands:**

- `yarn lint`, `yarn format:check`, `yarn test` -- expected: pass, including `test/site-allow-list.test.ts`
- `curl -sI https://cardiapp.eu/` and `curl -sI http://cardiapp.eu/` -- expected: 200 over HTTPS, and a redirect from HTTP

**Manual checks (if no CLI):**

- The old URLs in a browser; the certificate details; the Sentry monitor list.

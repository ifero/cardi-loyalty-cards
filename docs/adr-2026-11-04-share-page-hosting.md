# ADR-2026-11-04-001: Share-page hosting and domain (OVHcloud, cardiapp.eu)

- **Status:** **Accepted.** ifero decided on 2026-11-03, ahead of the spike: OVHcloud hosts the site and registers `cardiapp.eu`. The domain is bought, and ifero had already activated the hosting and set up the domain's mailboxes by 2026-11-09 ([live checks](#live-checks-2026-11-09)). This ADR records why, and checks the concrete OVHcloud product against what Stories 18.9 and 18.10 need. Deliverable of Story **18.1**; gates **18.9** and **18.10** only.
- **Date:** 2026-11-04 (vendor pages read 2026-11-09)
- **Drivers:** ifero (stakeholder); Epic 18 "Card Sharing & Web Handoff" (`docs/epics.md`, Story 18.1)
- **Narrows:** Story 18.1's scored five-vendor matrix and domain shortlist. ifero chose on 2026-11-04 to record the decision already made rather than re-score the vendors (see the story spec's "Decision" note). Three of the epic's 18.1 scoring criteria are therefore **not scored**: the public status-page history over the last 12 months, control-panel and DNS quality, and support responsiveness. ifero to confirm they are waived. The epic's other 18.1 requirements still stand, and the checklist below answers them.

---

## Context

The public site (landing page and privacy policy) is served by GitHub Pages at `https://ifero.github.io/myLoyaltyCards`, straight from the whole `docs/` folder. Two things force a move:

1. **`/.well-known/` must sit at a domain root we control.** Universal Links need `/.well-known/apple-app-site-association` served as `application/json`. Android App Links need `/.well-known/assetlinks.json`. A GitHub Pages _project_ page lives under `/myLoyaltyCards/`, not at a root, and serves the extensionless AASA file with the wrong content type.
2. **The 1.0 store listings need a privacy-policy URL on our own domain** (Sprint 23, Story 18.9).

Hard constraints, set by ifero: servers in the **EU/EEA only** (2026-08-02), maximum reliability, and **no build step** for the site (Epic 15 AC1).

A mitigating fact from the Epic 18 design: the share token travels in the URL **fragment** (`/card/#<token>`), which browsers never send to the server. No personal data reaches the host. Apart from that, the site is public marketing copy.

## Decision

1. **Registrar: OVHcloud**, domain **`cardiapp.eu`** (bought by ifero).
2. **Host: OVHcloud's free web hosting, included with the domain.** It is 100 MB of shared web hosting in OVHcloud's European web-hosting zone, at no extra cost. Registrar and host are one vendor and one account. That is deliberate: the free hosting exists only for a domain registered at OVHcloud.
3. **Deploy:** GitHub Actions uploads an allow-list of public files over **SFTP** into the hosting plan's site root folder (`www/` by default). No build step.
4. **TLS:** OVHcloud's managed **Let's Encrypt** certificate. It is free, enabled by default, and renewed automatically.
5. **Content type and redirects:** an **`.htaccess`** file at the site root. The host runs Apache.
6. **Canonical host: the apex `cardiapp.eu`.** `www.cardiapp.eu` answers too, and 301s to the apex on both HTTP and HTTPS. HTTPS on `www` needs the certificate to cover `www` (row 1b).
7. **HSTS: deferred.** 18.9 may add a `Strict-Transport-Security` header. Setting it from `.htaccess` needs `mod_headers`, which is **unverified** on the same terms as `mod_mime` (row 4).
8. **Old URL:** GitHub Pages becomes **redirect stubs**: an instant `meta refresh`, a `rel=canonical` and a plain link. GitHub Pages cannot send HTTP redirects.
9. **No CDN** in front for now (see [Availability](#availability-sla-and-permitted-downtime)).

Should the included hosting fail one of the checks marked _unverified_ below, the cheapest paid tier is **Starter**, priced under [Cost](#cost-vat-included). Starter runs on the same shared Apache and the same contract, so it is only a fallback if OVHcloud support first confirms that the missing feature (for row 4, `mod_mime` overrides in `.htaccess`) works on Starter. If shared hosting does not allow it at any tier, choosing another route goes back to ifero. Paying for anything is ifero's decision.

## Why OVHcloud

- **EU sovereignty.** The contracting entity is **OVH SAS**, a French _société par actions simplifiée_ headquartered in Roubaix and a subsidiary of OVH Groupe SA [S1]. There is no US parent, so the CLOUD Act caveat that applied to Namecheap and Spaceship does not apply. The web-hosting data sits in France (see [Facility](#facility-and-the-sbg2-fire)).
- **Everything 18.9 and 18.10 need is in the cheapest product:** HTTPS, Apache with `.htaccess`, SFTP, and automatic backups held in a second datacentre. Most of it is verified below; the gaps are marked.
- **Cost.** About €10 a year in total, for the domain alone.
- **Scale.** Europe's largest cloud provider. The 2021 Strasbourg fire is recorded below. It does not disqualify OVHcloud, and the plan does not run in Strasbourg.

## The product: OVHcloud free web hosting (included with the domain)

OVHcloud includes it with every domain bought from OVHcloud [S2][S3]. It is activated per domain from the Control Panel: _Web Cloud > Domain names > cardiapp.eu > General information > Free web hosting and email > Enable_ [S4]. It is only offered to OVHcloud customers in Europe [S4].

### Requirement checklist

| #   | Requirement (who needs it)                                                                        | Finding                                                                                                                                                                                                                                                                                                                         | Status                                                                                          |
| --- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | HTTPS with a valid certificate (18.9; Apple requires it)                                          | The free plan lists "SSL gratuiti illimitati" [S2][S3]. Let's Encrypt is installed on all web-hosting plans and enabled by default [S5][S6]. It lasts 90 days and OVHcloud renews it automatically at no charge [S5].                                                                                                           | **Verified**                                                                                    |
| 1b  | Certificate also covers `www.cardiapp.eu` (decision 6)                                            | Let's Encrypt is issued per domain or subdomain that points at the hosting and is declared as a site on it [S6]. Live: `www.cardiapp.eu` resolves to the hosting and serves its own Let's Encrypt certificate (`CN=www.cardiapp.eu`), which verifies [S25].                                                                     | **Verified live**                                                                               |
| 2   | TLS auto-renewal                                                                                  | Automatic, free, every 90 days [S5].                                                                                                                                                                                                                                                                                            | **Verified**                                                                                    |
| 3   | Apache with `.htaccess`: HTTP-to-HTTPS redirect (18.9)                                            | "Apache is installed on our entire shared hosting infrastructure" [S7], and `mod_rewrite` is preinstalled [S8]. [S7] gives the HTTPS redirect snippet. Live: the plan answers with `server: Apache` [S25].                                                                                                                      | **Verified.** The redirect itself is checked by `curl -sI http://cardiapp.eu/` in 18.9          |
| 4   | AASA served as `Content-Type: application/json` (18.10)                                           | This needs `ForceType`/`AddType` (`mod_mime`) in `.htaccess`. OVHcloud's `.htaccess` guides only cover `mod_rewrite`, authentication and IP blocking [S7][S8]. Nothing they publish confirms or rules out `mod_mime` overrides.                                                                                                 | **Unverified.** Settle in 18.10 (below)                                                         |
| 5   | `assetlinks.json` at the root (18.10): HTTPS, `Content-Type: application/json`, no redirect [S23] | It is a plain `.json` file under `www/.well-known/`, served from the site root folder [S9]. That Apache maps `.json` to `application/json` on OVHcloud is not documented.                                                                                                                                                       | Reachability **verified** in principle; content type **unverified**, checked by `curl` in 18.10 |
| 6   | Automated, encrypted upload from CI (18.9)                                                        | FTP is included [S2][S4]. SFTP can be switched on for the **Free hosting**, Starter, Personal and Startup plans in the Europe zone: _Hosting plans > FTP - SSH_, tick **SFTP** for the FTP user [S10]. Port 22 [S11]. SSH (and with it `rsync`) only comes with Professional and above [S2][S11].                               | **Verified**                                                                                    |
| 7   | Where the credentials live (18.9)                                                                 | The FTP user's login and password, plus the SFTP host, as GitHub Actions secrets. Pin the host key from `ssh-keyscan` as well. Whether SFTP takes key-based auth without SSH is not documented.                                                                                                                                 | Password auth **verified**; key auth **unverified** (not needed)                                |
| 8   | No build step (Epic 15 AC1)                                                                       | Plain static files over SFTP. Nothing runs on the host.                                                                                                                                                                                                                                                                         | **Satisfied by design**                                                                         |
| 9   | Storage                                                                                           | 100 MB [S2][S4]. The public files (`index.html`, `privacy-policy.html`, `style.css`, `assets/`) take about 144 KB today.                                                                                                                                                                                                        | **Verified**                                                                                    |
| 10  | EU/EEA facility (residency rule)                                                                  | European web-hosting plans run in **Gravelines (GRA), France**, and their backups are kept in **Roubaix (RBX), France** [S12]. The plan's own datacentre shows in the Control Panel under _General information > Datacentre_ [S13]. Live, the site is on `cluster029.hosting.ovh.net` [S25].                                    | **Verified** for the zone; check the plan's own field in 18.9                                   |
| 11  | Backups                                                                                           | Automatic copies at D-1, D-2, D-3, D-7 and D-14, stored in Roubaix [S12]. OVHcloud calls this "non-contractual" [S12], and the contract makes it a best-effort obligation with no RTO [S14]. **Our real backup is the git repository:** the site is byte-identical to `docs/` at any commit, and redeploying a ref restores it. | **Verified**                                                                                    |
| 12  | Git deploy from the host side                                                                     | Not on the free plan; Starter and above list Git with one repository [S2]. Not wanted anyway. It would pull the whole repository, not the allow-list.                                                                                                                                                                           | Not needed                                                                                      |

**Result:** the included hosting meets every requirement 18.9 needs, at no extra cost. Row 3's redirect is a smoke test at the start of 18.9. Rows 4 and 5 (content types) are the real open questions, and they belong to 18.10.

### How to settle the unverified items

- **Row 4 (AASA content type), in 18.10, before the entitlement ships:** upload `www/.well-known/apple-app-site-association` and an `.htaccess` holding

  ```apache
  <Files "apple-app-site-association">
    ForceType application/json
  </Files>
  ```

  then run `curl -sI https://cardiapp.eu/.well-known/apple-app-site-association`. The test passes on `HTTP/2 200` (or `HTTP/1.1 200`) with `content-type: application/json` and no redirect. Run the same check on `https://cardiapp.eu/.well-known/assetlinks.json`: 200 over HTTPS, `content-type: application/json`, no 301 or 302 [S23]. If an override is ignored, open an OVHcloud support ticket that asks whether `mod_mime` directives are allowed in `.htaccess` on the free plan **and on Starter**. Buy Starter only if support confirms they work there. If shared hosting allows them at no tier, the choice of another route goes back to ifero.

- **Row 3, at the start of 18.9:** after the first deploy, `curl -sI http://cardiapp.eu/` must return a 301 to `https://cardiapp.eu/`.
- **`www` redirect, in 18.9:** row 1b is settled live (DNS and certificate). Once the `.htaccess` is deployed, `curl -sI https://www.cardiapp.eu/` and `curl -sI http://www.cardiapp.eu/` must each return a 301 to `https://cardiapp.eu/`.
- **Row 10, in 18.9:** read _General information > Datacentre_ in the Control Panel and write it into `docs/cicd.md`.

### Live checks (2026-11-09)

ifero activated the hosting and set up the domain's mailboxes before this ADR was reviewed. Read-only checks from outside on 2026-11-09 [S25]:

- **DNS:** `cardiapp.eu` and `www.cardiapp.eu` both resolve to `178.32.137.139` (`cluster029.hosting.ovh.net`); the name servers are OVHcloud's (`ns103.ovh.net`, `dns103.ovh.net`).
- **TLS:** both hosts serve their own valid Let's Encrypt certificate (row 1, row 1b).
- **Server:** Apache (row 3). No redirect is in place yet: HTTP and HTTPS, apex and `www`, all return 200 with OVHcloud's placeholder page, which the first deploy overwrites [S24].
- **Mail:** the MX records are OVHcloud's (`mx0`–`mx3.mail.ovh.net`), so the mailboxes, `privacy@cardiapp.eu` included, are on OVHcloud email. Leave the MX records as they are. 18.9 still sends a test message to `privacy@` before the policy ships on `cardiapp.eu`.
- **`/.well-known/`:** both paths return 404, as expected until 18.10. Rows 4 and 5 remain open.
- **Not visible from outside:** the plan tier and its datacentre. ifero reads both in the Control Panel (_General information_); 18.9 records them in `docs/cicd.md`. If the plan is a paid tier rather than the free one, the cost table's hosting row changes accordingly. The free plan can only be upgraded in place to **Personal** [S4].

## Deploy mechanism (named here; 18.9 implements and documents it in `docs/cicd.md`)

- **Transport:** SFTP to the FTP server shown under _FTP - SSH_ (form `ftp.clusterNNN.hosting.ovh.net`), port 22 [S10][S11]. Never plain FTP.
- **Tool:** a scripted SFTP client on the GitHub-hosted Ubuntu runner, for example `lftp` (`mirror -R`) over `sftp://`. It copies the allow-listed files as they are, with no transform.
- **Target:** the site's **root folder** (`www/` by default, confirmed under _My sites > Root folder_ [S9]). Never sync or delete at the FTP root, which holds OVHcloud's own files (`.ovhconfig`).
- **Deletion scope:** a deploy only ever deletes allow-listed paths that the new ref no longer contains. It never deletes anything else in `www/`, whether OVHcloud or anyone else put it there. The staging set must list the dotfiles explicitly (`.htaccess`, `.well-known/`), because glob copies skip them by default. `.htaccess` and `.well-known/` are excluded from deletion, so a rollback to a ref from before 18.9 or 18.10 cannot remove them.
- **Secrets:** `OVH_SFTP_HOST`, `OVH_SFTP_USER`, `OVH_SFTP_PASSWORD`, `OVH_SFTP_KNOWN_HOSTS`. The names are a suggestion; 18.9 records the final ones in `docs/cicd.md`.
- **Cluster moves:** OVHcloud may move the site to another platform [S14 §4.1], which changes the SFTP host and its host key and blocks deploys. After a move, refresh `OVH_SFTP_HOST` and `OVH_SFTP_KNOWN_HOSTS`; 18.9 documents this in `docs/cicd.md`.
- **Rollback:** a `workflow_dispatch` run with `ref` set to an earlier commit, as 18.9 specifies.

## Files to publish

GitHub Pages serves the **whole** `docs/` folder today: the PRD, the architecture, the sprint artifacts, `ux-design-directions.html`, and so on. The new host publishes an **allow-list** and nothing else:

| Path                                                                    | When                                                   |
| ----------------------------------------------------------------------- | ------------------------------------------------------ |
| `index.html`                                                            | 18.9                                                   |
| `privacy-policy.html`                                                   | 18.9                                                   |
| `style.css`                                                             | 18.9                                                   |
| `assets/**`, without `README.md` files                                  | 18.9                                                   |
| `.htaccess`                                                             | 18.9 (HTTPS redirect); 18.10 adds the AASA `ForceType` |
| `card/**`                                                               | 18.8, once it ships                                    |
| `.well-known/apple-app-site-association`, `.well-known/assetlinks.json` | 18.10                                                  |

**Never published:** the `*.md` documents, `sprint-artifacts/`, `design/`, `ux-designs/`, `analysis/`, `store/`, `schemas/`, `ux-design-directions.html`, `bmm-workflow-status.yaml`, and `help.json` (only a test reads it; nothing fetches it from the site).

## Redirect from `ifero.github.io/myLoyaltyCards`

`https://ifero.github.io/myLoyaltyCards` is in the wild, in `og:url` (`docs/index.html:16`). **GitHub Pages cannot send an HTTP 3xx redirect for a project page.** Setting a custom domain on the Pages site would redirect to that domain, but only by serving the site from GitHub, which defeats the move.

**Mechanism: client-side redirect stubs on GitHub Pages.**

- Switch the Pages source from "branch `main`, `/docs`" to **GitHub Actions** [S15]. A workflow job uploads a small committed folder of stubs unchanged. That is no build step, and it stops publishing the planning documents.
- Each stub (`index.html`, `privacy-policy.html`) carries:
  - `<meta http-equiv="refresh" content="0; url=https://cardiapp.eu/<same path>">`. Google treats an **instant** meta refresh as a **permanent** redirect [S16], so ranking signals move to `cardiapp.eu`;
  - `<link rel="canonical" href="https://cardiapp.eu/<same path>">`;
  - a plain link to the same URL, for when the refresh is blocked.
- No share link was ever published on `github.io`: `docs/card/` does not exist yet, and 18.8 will only ship it after the move. So no catch-all `404.html` is needed to carry fragments across. This matches 18.9's decision: two stubs, nothing else.
- The stubs stay on GitHub, a US-parented host. They carry no personal data and exist only to forward visitors, so they do not breach the residency rule, which governs where the site is served from.
- Switching the Pages source in the repository settings is ifero's step (18.9).

## Cost (VAT included)

Prices from `ovhcloud.com/it`, read 2026-11-09, shown excluding Italian VAT (22 %) with the VAT-inclusive figure alongside [S2][S3]. OVHcloud's first-year hosting prices are promotional, so the renewal price is the one to budget.

| Item                                             | First year                         | Renewal, per year                          |
| ------------------------------------------------ | ---------------------------------- | ------------------------------------------ |
| Domain `cardiapp.eu` [S3]                        | €7.49 + VAT = **€9.14**            | €8.59 + VAT = **€10.48**                   |
| **Hosting: free 100 MB plan (recommended)** [S2] | **€0**                             | **€0**, while the domain stays at OVHcloud |
| TLS (Let's Encrypt) [S5]                         | €0                                 | €0                                         |
| **Total, as recommended**                        | **€9.14**                          | **€10.48**                                 |
| _Fallback only:_ Starter [S2]                    | €1.59/month: €19.08 + VAT = €23.28 | €2.59/month: €31.08 + VAT = €37.92         |
| _For reference:_ Personal [S2]                   | €2.99/month: €35.88 + VAT = €43.77 | €5.99/month: €71.88 + VAT = €87.69         |

`cardiapp.eu` is already paid for, so the actual first-year charge is whatever ifero's invoice shows. The domain row is the list price. Starter or Personal would also bring "1 dominio gratis il primo anno" [S2]. That offer does not apply here, because the domain is already registered.

**Paying for Starter buys nothing on availability.** Starter, Personal and the free plan share one contract with no SLA (below). They advertise the same 99.9 % observed availability and the same automatic backups [S2]. A paid tier is only worth buying if row 4 fails on the free plan **and** OVHcloud support confirms the paid tier fixes it. It runs on the same shared Apache, so that is not a given.

## Availability, SLA and permitted downtime

**No host is free of downtime. "Exempt from downtime" cannot be bought.** The achievable goal is a credited SLA plus redundancy. Neither is on offer at OVHcloud's shared-hosting level:

- **No contractual SLA, no service credits.** The web-hosting specific conditions (version of 04/05/2026) set a best-effort obligation (_obbligazione di mezzi_). They promise notice of incidents on `status-ovhcloud.com`, and allow OVHcloud to move a site to another platform during an incident, without compensation [S14]. No availability percentage appears in the contract, and the same contract covers every shared-hosting tier.
- **Advertised: "Disponibilità osservata del 99,9 %"** (observed, not guaranteed) on every tier, the free one included [S2]. As downtime, that allows:

| Availability                    | Permitted downtime per month (30.44 days) | Per year     |
| ------------------------------- | ----------------------------------------- | ------------ |
| **99.9 % (OVHcloud, observed)** | **≈ 43.8 minutes**                        | ≈ 8.8 hours  |
| _99.5 % (for comparison)_       | ≈ 3.65 hours                              | ≈ 43.8 hours |
| _99.99 % (for comparison)_      | ≈ 4.4 minutes                             | ≈ 53 minutes |

OVHcloud's own page for the free plan says it is not meant for critical or high-traffic projects [S3]. That is fair, and acceptable here, for three reasons:

1. **Apple caches the AASA on its own CDN.** Devices do not fetch it from our server. Apple's CDN fetches it within 24 hours, and devices check for updates about once a week [S17]. A short origin outage does not break Universal Links for existing installs. It lowers the availability requirement; it does not remove it.
2. **Once 18.10 ships, a Universal Link tap by someone with the app installed opens the app without fetching the page from the origin.** Everyone else (no app, or before 18.10) needs the origin to load `/card/`.
3. **We would notice an outage.** 18.9 adds a Sentry uptime monitor on `/` and `/privacy-policy.html`, and 18.10 adds one on the AASA path. That builds the 12-month record this ADR does not score. OVHcloud's incidents are published at `web-cloud.status-ovhcloud.com`.

**CDN in front: not now.** The epic asked to weigh "modest host + CDN" against "premium plan". A paid tier adds no SLA at all, so "premium" is not available at this product level. A CDN (OVHcloud sells a CDN option for web hosting [S2]) would cache static files at the edge. It would also add a cache-invalidation step to every deploy, and the CDN contract is a separate product to read. Revisit only if the uptime monitor shows outages that matter. Moving the static files to another EU host is cheap, because the deploy is one SFTP step.

## Facility and the SBG2 fire

**What happened.** On **10 March 2021**, fire destroyed OVHcloud's **SBG2** datacentre in Strasbourg and damaged SBG1. Customers whose only backups sat on the same campus lost data permanently [S18][S19].

**What changed since** (reported by the trade press; I found no current OVHcloud page that summarises it, so treat these as secondary sources):

- In May 2021 OVHcloud announced a "hyper-resilience" plan. It covers fire protection, internal backups kept off-site in a separate region, and fail-over across datacentres [S20].
- In September 2022 OVHcloud opened **SBG5** on the Strasbourg site. It is built in fire-compartmented rooms with walls rated for two hours [S21].

**Which facility this plan runs in.** European web hosting runs in **Gravelines (GRA)**, not Strasbourg. Its automatic backups are stored in a **different datacentre, Roubaix (RBX)** [S12]. That is exactly the separation SBG2's victims lacked. Shared _databases_ are replicated to Strasbourg [S12], but this site has no database. Our own off-site copy is the git repository, held by GitHub, and any commit redeploys.

## Residency

- The EU/EEA-only rule (ifero, 2026-08-02) **stands.**
- The servers are in France, in Gravelines with backups in Roubaix [S12]. The contracting entity is **OVH SAS** (Roubaix, France), part of OVH Groupe SA [S1].
- **The CLOUD Act caveat does not apply.** There is no US parent; the caveat was raised for the US-parented Namecheap and Spaceship.
- **Visitor IP addresses do reach OVHcloud,** like any host. OVHcloud builds anonymised visit statistics from access-log data. This is on by default and can be switched off, and OVHcloud acts as processor [S14 §9]. The share token never reaches the server (fragment design). The privacy policy wording on hosting logs belongs to Story 24.1, and ifero decides whether to switch the statistics off. See [Consequences](#consequences).

## Rejected alternatives

Each vendor named for the 18.1 spike, with ifero's reason (2026-11-03/04). They were not re-scored; ifero decided against it.

- **Netsons** (Italian company, Milan datacentres; inside the EU/EEA rule). **Reason given: no published `.eu` price found.** _Correction, found while writing this ADR:_ on 2026-11-09, `netsons.com/domini` lists `.eu` at **€14.51 + VAT** a year, with the same figure in all three of its price columns [S22]. The reason no longer holds as written. Netsons' `.eu` would still cost more than OVHcloud's €8.59 + VAT renewal. Its site menu also lists a "Free Hosting" product [S22], which this ADR has not assessed. **Routed to ifero to confirm the rejection.**
- **Namecheap: US parent.** Namecheap, Inc. is US-incorporated, so the CLOUD Act exposure stays even with servers in Amsterdam. Its EU region also has to be selected explicitly, because the default is US (desk check in `docs/epics.md`, Story 18.1). **Unverified today:** namecheap.com returned HTTP 403 to automated reads on 2026-11-09. Settle by reading the contracting entity on https://www.namecheap.com/legal/ in a browser, if the rejection is ever revisited.
- **Spaceship: US parent.** It is part of the same US group as Namecheap. The caveat is the same, and its EU region has to be pinned to Amsterdam, never Farnborough in the UK (desk check, ibid.). **Unverified today:** spaceship.com also returned HTTP 403 to automated reads on 2026-11-09. Settle the same way, via https://www.spaceship.com/legal/.
- **Infomaniak: Switzerland only** (Geneva, Zurich). That puts it outside the EU/EEA rule. Switzerland has a GDPR adequacy decision, so this is a sovereignty preference, not a compliance requirement. Recorded so that Infomaniak is not proposed again.
- **GitHub Pages (the incumbent, scored only as the baseline):** a project page cannot serve `/.well-known/` at a domain root, cannot set the AASA content type, and cannot send HTTP redirects. It is also US-hosted.

## Consequences

**For 18.9 (migrate the site):**

- The hosting is already active (see [Live checks](#live-checks-2026-11-09)). Switch on SFTP for the FTP user, then store the four secrets.
- Deploy the allow-list into `www/` over SFTP, never plain FTP. Add `docs/.htaccess` with OVHcloud's documented HTTPS redirect [S7], adapted to a permanent (301) redirect to the apex and extended to the `www` host:

  ```apache
  RewriteEngine On
  # www -> apex, on HTTP and HTTPS
  RewriteCond %{HTTP_HOST} ^www\.cardiapp\.eu$ [NC]
  RewriteRule ^(.*)$ https://cardiapp.eu/$1 [R=301,L]
  # HTTP -> HTTPS on the apex
  RewriteCond %{SERVER_PORT} ^80$
  RewriteRule ^(.*)$ https://cardiapp.eu/$1 [R=301,L]
  ```

  Neither rule touches `https://cardiapp.eu/`. Apple and Android fetch the `.well-known` files from the HTTPS apex and refuse any redirect [S17][S23], so no rule may redirect HTTPS apex requests.

- Smoke test: `curl -sI http://cardiapp.eu/` returns a 301; `https://cardiapp.eu/` returns 200 with a Let's Encrypt certificate; `curl -sI` on `http://www.cardiapp.eu/` and `https://www.cardiapp.eu/` each return a 301 to `https://cardiapp.eu/`. Record the plan's datacentre in `docs/cicd.md`.
- Before the privacy policy ships on `cardiapp.eu`, send a test message to `privacy@cardiapp.eu` (hosted on OVHcloud email).
- HSTS is optional here; if added, check `mod_headers` works first (decision 7).
- Replace GitHub Pages with the two stubs; ifero switches the Pages source.

**For 18.10 (Universal Links and App Links):**

- Settle rows 4 and 5 first with the `curl` tests above. They are the hosting facts still open for 18.10.
- Serve both `.well-known` files from `www/.well-known/` over HTTPS with `Content-Type: application/json` and no redirect, checked with `curl -sI` as under row 4 [S17][S23].

**For ifero:**

- **Decide** whether to switch off OVHcloud's visit statistics, and make sure Story 24.1's privacy policy covers hosting access logs.
- **Confirm** the Netsons rejection, now that a `.eu` price has turned up (see Rejected alternatives).
- **Read** the hosting plan's tier and datacentre in the Control Panel, for 18.9 to record. The free plan is assumed throughout.
- **Confirm** that the three unscored criteria in the "Narrows" line are waived.
- Keep `cardiapp.eu` on auto-renew at OVHcloud. **The free hosting lives and dies with the domain registration.**
- If row 4 fails and OVHcloud support confirms Starter fixes it, approve Starter (€37.92 a year with VAT at renewal). Otherwise choose another route.

**Risks:**

- No SLA and no service credits: availability is best effort. Mitigated by Apple's AASA cache, uptime monitoring, and a deploy that moves to another host in one step.
- The free plan can change or be withdrawn by OVHcloud. Mitigated the same way, and by the git repository being the source of truth.
- **Registrar and host are coupled.** Moving `cardiapp.eu` to another registrar ends the free hosting. Splitting registrar and host later means paying for a host.

## Sources (all read 2026-11-09)

| Ref   | Source                                                                                                                                                                                                                                                                            |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [S1]  | OVHcloud legal notices: https://www.ovhcloud.com/en-gb/terms-and-conditions/ and https://www.ovhcloud.com/fr/terms-and-conditions/                                                                                                                                                |
| [S2]  | OVHcloud web-hosting comparison (Italy, prices, free plan column): https://www.ovhcloud.com/it/web-hosting/compare/ , and the Eco range page https://www.ovhcloud.com/it/web-hosting/personal-offer/                                                                              |
| [S3]  | OVHcloud `.eu` domain page: https://www.ovhcloud.com/it/domains/tld/eu/ ; free web hosting page: https://www.ovhcloud.com/en-ie/domains/free-web-hosting/                                                                                                                         |
| [S4]  | Web Hosting: Activating the free hosting plan (updated 2026-06-08): https://docs.ovhcloud.com/en/guides/web-cloud/web-hosting/activate-start10m                                                                                                                                   |
| [S5]  | OVHcloud SSL option page (Let's Encrypt, 90-day automatic renewal): https://www.ovhcloud.com/en-ie/web-hosting/options/ssl/                                                                                                                                                       |
| [S6]  | Web Hosting: How to activate a free Let's Encrypt SSL certificate (updated 2025-12-16): https://docs.ovhcloud.com/en/guides/web-cloud/web-hosting/ssl-letsencrypt                                                                                                                 |
| [S7]  | Tutorial: Rewrite URLs with mod_rewrite via `.htaccess` (updated 2026-06-16): https://docs.ovhcloud.com/en/guides/web-cloud/web-hosting/htaccess-url-rewriting-using-mod-rewrite                                                                                                  |
| [S8]  | Tutorial: Operations achievable with a `.htaccess` file (updated 2023-05-23): https://docs.ovhcloud.com/en/guides/web-cloud/web-hosting/htaccess-what-else-can-you-do                                                                                                             |
| [S9]  | Root folder (`www`) per site, "My sites > Root folder": https://docs.ovhcloud.com/en/guides/web-cloud/web-hosting/access-websites-view and https://docs.ovhcloud.com/en/guides/web-cloud/web-hosting/hosting-how-to-get-my-website-online                                         |
| [S10] | Web hosting: How to enable SFTP access (updated 2026-06-08): https://docs.ovhcloud.com/en/guides/web-cloud/web-hosting/enable-sftp                                                                                                                                                |
| [S11] | Logging in to your web hosting plan's FTP storage space (updated 2026-06-08): https://docs.ovhcloud.com/en/guides/web-cloud/web-hosting/ftp-connection ; FileZilla guide (updated 2026-06-03): https://docs.ovhcloud.com/en/guides/web-cloud/web-hosting/ftp-filezilla-user-guide |
| [S12] | Technical specifications of Web Hostings, "Automatic backup information" (updated 2026-06-08): https://docs.ovhcloud.com/en/guides/web-cloud/web-hosting/hosting-technical-specificities                                                                                          |
| [S13] | "Find the datacentre of your web hosting plan" (General information > Datacentre): https://docs.ovhcloud.com/en/guides/web-cloud/web-hosting/diagnosis-database-errors ; Web Cloud Status: https://web-cloud.status-ovhcloud.com/                                                 |
| [S14] | _Condizioni Particolari del Servizio Hosting Web_, version of 04/05/2026 (§2.3 backup, §4.1 best-effort obligation, §9 statistics): https://contract.eu.ovhapis.com/1.0/pdf/contrat_partWeb-it.pdf                                                                                |
| [S15] | GitHub Docs: Configuring a publishing source for your GitHub Pages site: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site                                                                            |
| [S16] | Google Search Central: Redirects and Google Search: https://developers.google.com/search/docs/crawling-indexing/301-redirects                                                                                                                                                     |
| [S17] | Apple Developer: Supporting associated domains (HTTPS, no redirects, CDN fetch within 24 h, weekly device checks): https://developer.apple.com/documentation/xcode/supporting-associated-domains                                                                                  |
| [S18] | DCD, "OVH fire update: four halls in SBG1 destroyed, as well as all of SBG2": https://www.datacenterdynamics.com/en/news/ovh-fire-update-four-halls-sbg1-destroyed-well-all-sbg2                                                                                                  |
| [S19] | Computer Weekly, "OVHCloud confirms no casualties following fire at Strasbourg datacentre campus": https://www.computerweekly.com/news/252497578/OVHCloud-confirms-no-casualties-following-fire-at-Strasbourg-datacentre-campus                                                   |
| [S20] | The Register, "OVH outlines three-point hyper-resilience plan" (2021-05-06): https://www.theregister.com/2021/05/06/ovh_outlines_threepoint_hyper_resiliance/                                                                                                                     |
| [S21] | Computer Weekly, "OVHcloud opens new datacentre in Strasbourg at site of March 2021 fire": https://www.computerweekly.com/news/252524866/OVHcloud-opens-new-datacentre-in-Strasbourg-at-site-of-March-2021-fire                                                                   |
| [S22] | Netsons domain prices and site menu: https://www.netsons.com/domini                                                                                                                                                                                                               |
| [S23] | Android Developers: Configure website associations, "Publish the JSON verification file" (`application/json`, HTTPS, no 301/302): https://developer.android.com/training/app-links/configure-assetlinks                                                                           |
| [S24] | Web Hosting FAQ, OVHcloud holding page `index.html` in the `www` folder: https://docs.ovhcloud.com/en/guides/web-cloud/web-hosting/faq                                                                                                                                            |
| [S25] | Live checks of `cardiapp.eu` on 2026-11-09: `dig +short` (A, MX, NS) for the apex and `www`, `dig -x 178.32.137.139`, `curl -sI` on HTTP and HTTPS for the apex, `www` and both `/.well-known/` paths, and `openssl s_client` for each host's certificate                         |

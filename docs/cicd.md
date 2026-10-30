# CI/CD Pipeline & Quality Gates

_Last updated: 2026-09-03_

This document describes the current GitHub Actions and Fastlane CI/CD pipeline for the myLoyaltyCards repository. It is the single source of truth for how builds, tests, tags, and deploys run across iOS, Android, and watchOS.

## Table of Contents

- [Pipeline at a Glance](#pipeline-at-a-glance)
- [Workflow Details](#workflow-details)
  - [Quality Gates](#quality-gates)
  - [watchOS Tests](#watchos-tests)
  - [iOS AdHoc Build](#ios-adhoc-build)
  - [Android AdHoc Build](#android-adhoc-build)
  - [Beta Releases (RC)](#beta-releases-rc)
  - [Store Upload (Final Release)](#store-upload-final-release)
  - [Nightly Internal Builds](#nightly-internal-builds)
- [Fastlane & Native Build Notes](#fastlane--native-build-notes)
- [Release Runbooks](#release-runbooks)
  - [Why releases are published, not just tagged](#why-releases-are-published-not-just-tagged)
  - [Ship to TestFlight](#ship-to-testflight)
  - [Release to Production](#release-to-production)
  - [Run a nightly by hand](#run-a-nightly-by-hand)
  - [The nightly did not ship](#the-nightly-did-not-ship)
  - [Manual / AdHoc Build](#manual--adhoc-build)
- [watchOS CI/CD](#watchos-ci-cd)
- [Provisioning & match](#provisioning--match)
- [Troubleshooting](#troubleshooting)
- [References](#references)

## Pipeline at a Glance

```mermaid
flowchart LR
  PR["PR opened / updated"] -->|checks| QG["ci-quality-gates.yml"]
  PR -->|watchOS path changes| WT["watchos-tests.yml"]
  PUSH["Push to main"] -->|binary-affecting paths change| IOSA["ios-release.yml"]
  PUSH -->|binary-affecting paths change| ANDA["android-release.yml"]
  RCREL["Published pre-release v*.*.*-rc.*"] --> BETA["beta-releases.yml"]
  RELREL["Published release v*.*.*"] --> STORE["store-upload.yml"]
  CRON["Nightly cron 02:17 UTC<br/>or workflow_dispatch"] --> NIGHTLY["nightly-builds.yml"]
  NIGHTLY --> PRE{"preflight: anything<br/>binary-affecting changed<br/>since nightly/*?"}
  PRE -->|no| SKIP["skipped (green)"]
  PRE -->|yes| NB["TestFlight + Play internal + wear:internal"]
  BETA -->|builds| TF["TestFlight + Android Beta"]
  STORE -->|uploads| STORE2["App Store + Play Store"]
```

### Workflow names

- `.github/workflows/ci-quality-gates.yml`
- `.github/workflows/watchos-tests.yml`
- `.github/workflows/ios-release.yml`
- `.github/workflows/android-release.yml`
- `.github/workflows/beta-releases.yml`
- `.github/workflows/store-upload.yml`
- `.github/workflows/nightly-builds.yml`

## Workflow Details

### Quality Gates

File: `.github/workflows/ci-quality-gates.yml`

Triggers:

- `pull_request` on opened, synchronize, reopened, ready_for_review
- `push` to `main`

What it runs:

- `yarn install --frozen-lockfile`
- `yarn lint`
- `yarn typecheck`
- `yarn test:coverage --watchAll=false --runInBand`
- uploads the coverage report as an artifact

Notes:

- GitHub status checks are the primary notification mechanism.
- Slack notification is optional and only sent when `SLACK_WEBHOOK_URL` is configured.
- No email notifications are configured in the workflow.

### watchOS Tests

File: `.github/workflows/watchos-tests.yml`

Triggers:

- `pull_request` on opened, synchronize, reopened, ready_for_review
- `push` to `main`

Path filters — the generator's **inputs** as well as its outputs, or a brand-add PR that forgot to
regenerate would match nothing and skip the drift check entirely (Story 16.29):

- `targets/watch/**`
- `catalogue/**`
- `targets/watch-widget/**`
- `watch-ios/**`
- `ios/**`
- `app.json`
- `plugins/**` — the only workflow that runs an **iOS** `expo prebuild` on a PULL REQUEST, and
  therefore the only pre-merge gate that executes an iOS config plugin at all (Story 21.3). The
  release and nightly workflows prebuild for iOS too, but only after merge;
  `phone-wear-module-tests.yml` prebuilds on PRs but `--platform android`, where an iOS mod never
  runs.
- `fastlane/Fastfile`
- `tokens/color.json`, `shared/theme/tokens.generated.ts` — the widget's and the watch app's colour
  pins read the identity colours from the tokens, and `jest.config.js` ignores `targets/watch/`
  outside this workflow, so a token-only PR must still run it (Story 23.4).

What it runs:

- `yarn install --frozen-lockfile`
- Jest tests for `targets/watch/__tests__`
- `yarn check:catalogue-generated` — **against the pristine checkout, before anything regenerates.**
  Order is load-bearing: this step used to sit after a plain write-mode generator run, so it compared
  freshly generated output against output generated seconds earlier and could never fail.
- `npx expo prebuild --clean --platform ios`
- `yarn watch:build:ci` (its own `pre` hook regenerates the catalogue for the build)

Purpose:

- Verifies the watchOS companion target builds on macOS.
- Ensures watch target signing and generated catalogue code remain valid.

### iOS AdHoc Build

File: `.github/workflows/ios-release.yml`

Triggers:

- `push` to `main` when any path that can change the shipped binary changes:
  - JS bundle source — `app/**`, `core/**`, `features/**`, `shared/**`, `modules/**`
  - native + watch companion — `ios/**`, `targets/**`, `watch-ios/**`
  - compiled-in data and assets — `catalogue/**`, `assets/**`, `tokens/**`
  - build inputs — `app.json`, `app.config.ts`, `plugins/**`, `package.json`, `yarn.lock`, `babel.config.js`, `metro.config.js`, `patches/**`, `fastlane/**`
  - this workflow itself — `.github/workflows/ios-release.yml`
- …but **not** for files that cannot reach the binary, excluded with negative patterns: `!**/*.test.ts`, `!**/*.test.tsx`, `!**/*.test.js`, `!**/*.stories.tsx`. Tests are co-located beside their subject and stories are Storybook-only, so a test- or story-only change no longer costs a native build. A commit that _also_ touches real source still builds.
- `workflow_dispatch` for manual runs on any branch

Note: `catalogue/italy.json` is in the trigger list because `watch-ios/Scripts/generate-catalogue.swift` reads it during this build — a brand added to the catalogue alone still changes what ships.

What it runs:

- `yarn install --frozen-lockfile`
- `npx expo prebuild --platform ios`
- `xcrun --sdk macosx swift watch-ios/Scripts/generate-catalogue.swift`
- `bundle exec fastlane ios adhoc`

Output:

- `output/*.ipa` uploaded as a workflow artifact

### Android AdHoc Build

File: `.github/workflows/android-release.yml`

Triggers:

- `push` to `main` when any path that can change the shipped binary changes:
  - JS bundle source — `app/**`, `core/**`, `features/**`, `shared/**`, `modules/**`
  - native — `android/**` (the watch companion is iOS-only, so `targets/**` and `watch-ios/**` are deliberately absent)
  - compiled-in data and assets — `catalogue/**`, `assets/**`, `tokens/**`
  - build inputs — `app.json`, `app.config.ts`, `package.json`, `yarn.lock`, `babel.config.js`, `metro.config.js`, `patches/**`, `fastlane/**`
  - this workflow itself — `.github/workflows/android-release.yml`
- …but **not** `!**/*.test.ts`, `!**/*.test.tsx`, `!**/*.test.js`, `!**/*.stories.tsx` — see the iOS section above for the rationale. (`plugins/**` is deliberately absent from the Android set — the only config plugin there is registers an iOS mod — but the excludes are shared, so `!**/*.test.js` appears here too.)
- `workflow_dispatch` for manual runs on any branch

What it runs:

- `yarn install --frozen-lockfile`
- `npx expo prebuild --platform android`
- `bundle exec fastlane android adhoc`

Output:

- `android/app/build/outputs/apk/release/*.apk` uploaded as a workflow artifact

### Beta Releases (RC)

File: `.github/workflows/beta-releases.yml`

Triggers:

- a **published GitHub Release** whose tag contains `-rc.` — the intended trigger, see [Why releases are published, not just tagged](#why-releases-are-published-not-just-tagged)
- `push` tags matching `v*.*.*-rc.*` — kept as a fallback so a bare `git push --tags` is not a silent no-op
- `workflow_dispatch` with a required `tag` input, for a manual re-run

Because `on.release` cannot filter by tag pattern, the RC selection lives in a job-level `if:`. A published release whose tag is not an RC therefore produces a run whose jobs are all `skipped` — that is expected, not a failure. A `concurrency` group keyed on the tag name collapses the release and tag-push events into a single run, so one tag never produces two uploads.

Jobs:

- `ios-testflight-beta` builds and uploads the iOS app to TestFlight using `bundle exec fastlane ios beta`
- `android-beta` builds and uploads **both** the phone AAB (to the `alpha` track) and the Wear OS companion AAB (to its `wear:` form-factor track) using `bundle exec fastlane android beta`. It also publishes the signed Wear bundle as a workflow artifact, even when the job fails — see below.

Notes:

- The iOS job runs `npx expo prebuild --platform ios` and generates the watchOS catalogue before Fastlane.
- There is no separate `watch_beta` lane; the watch companion is included in the iOS `beta` lane.
- **Neither is there a separate Wear OS job, and that is deliberate (Story 16.35).** The two artifacts are one release intent, so a partial ship should be one red X rather than two independently-green jobs. The Android job therefore carries both toolchains — Node/Expo for the phone, JDK 17 + Android SDK 36 for `watch-android` — and the Fastfile builds and verifies both artifacts (`build_wear_bundle!`) before uploading either, so a Kotlin, R8 or signing failure cannot strand a phone-only release. `scripts/check-android-signing-parity.mjs` fails the job — while nothing has been uploaded yet — unless the Wear and phone artifacts carry the same signing certificate.
- **The Wear AAB goes to Play's dedicated `wear:` form-factor track, not the phone's track.** (An AAB, not an APK: this Play listing is App-Bundle-only and the API rejects raw APKs — `Invalid request - APKs are not allowed for this application`.) Play rejects an artifact declaring `uses-feature android.hardware.type.watch` uploaded to a mobile track; the track id is `wear:` + the mobile track name. **This listing has all four** — `wear:internal`, `wear:alpha`, `wear:beta`, `wear:production` — read live from the Play Publishing API on 2026-09-07, so the derivation is correct for every lane and no workflow sets `WEAR_PLAY_TRACK`. ⛔ **`wear:qa` does not exist here even though [Google's docs](https://developers.google.com/android-publisher/tracks) name `qa` as the internal-testing track — the docs contradict the API, and pinning `wear:qa` on their strength broke three nightlies. Do not reinstate it.** The derivation is still a default rather than a rule (a hand-created _closed_ track carries a custom name and pairs with no phone track), so the `WEAR_PLAY_TRACK` seam stays; `ensure_wear_track_exists!` validates the destination against Play's live track list **before anything is built** and prints that list on a mismatch. This needs a **one-time manual Play Console step** — Advanced settings → Form factors → Wear OS → Manage → "Use a dedicated release track for Wear OS" — without which every Wear upload fails with `Track not found`. Because it is a separate track it is a separate release, so nothing needs `version_codes_to_retain` and the Wear upload cannot disturb the phone's.

### Store Upload (Final Release)

File: `.github/workflows/store-upload.yml`

Triggers:

- a **published GitHub Release** that is _not_ flagged as a pre-release and whose tag is a bare `vX.Y.Z` — the intended trigger
- `push` tags matching `v*.*.*`, excluding pre-release tags via `!v*.*.*-*` — kept as a fallback
- `workflow_dispatch` with a required `tag` input, for a manual re-run

Both conditions — the `prerelease` flag **and** the tag shape — are checked in the job-level `if:`, so a release mis-flagged in the GitHub UI cannot reach production.

Jobs:

- `upload-ios-release` runs `bundle exec fastlane ios upload_release`
- `upload-android-release` runs `bundle exec fastlane android upload_release`

Notes:

- The iOS release job includes the watchOS companion app build and signing as part of the same lane.
- This workflow uploads to App Store Connect and Play Store production.

### Nightly Internal Builds

File: `.github/workflows/nightly-builds.yml` (Story 16.36)

Triggers:

- `schedule` — `17 2 * * *` (02:17 UTC). Off-peak and off-the-hour deliberately: GitHub queues every `0 * * * *` job on the hour and delays scheduled runs under load. Unlike `push`, a scheduled run is **not** suppressed by the `[skip ci]` marker `mark-story-done.yml` lands on `main` — that commit still reaches the preflight, which correctly classifies it as a docs-only change and skips.
- `workflow_dispatch` — a first-class entry point, not an escape hatch. Four inputs: `platform` (`both`/`ios`/`android`), `force` (**default true**), `dry_run`, `ref`.

⚠️ **`schedule:` only ever runs the default branch's copy of the file.** Nothing in this workflow can be exercised from a branch by the cron; use a dispatch with `ref` to test it before merge.

Jobs:

- `preflight` decides, per platform, whether anything binary-affecting changed. It cannot use `paths:` — GitHub applies those only to `push`/`pull_request` — so it runs `scripts/nightly-build-decision.mjs`, which diffs the current commit against that platform's baseline tag using the same committed definition in `.github/build-path-filters.json` that `yarn check:build-path-filters` holds the release workflows to.
- `ios` builds and uploads to TestFlight via `bundle exec fastlane ios nightly`. The Apple Watch app and complication ride along in the same IPA — there is no standalone watchOS upload (ADR-2026-04-11-002).
- `android` builds and uploads **both** Android artifacts via `bundle exec fastlane android nightly`: the phone AAB to Play `internal`, the Wear OS AAB to **`wear:internal`**. One job carrying both toolchains, for the same reason as the RC pipeline — the two artifacts are one release intent, so a partial ship is one red X.
- `record-baseline` moves the baseline tags. **Schedule only.**
- `notify-failure` posts a job-result table, and Slack when `SLACK_WEBHOOK_URL` is set.

Notes:

- **The Wear track is `wear:internal`, and it is derived — the workflow sets no override.** `wear:internal` is what this listing actually has (Play Publishing API, 2026-09-07). ⛔ **This previously read "the track is `wear:qa` and it is set explicitly", which was wrong and cost three nights.** [Google's docs](https://developers.google.com/android-publisher/tracks) do say the internal-testing track is named `qa`; the API disagrees, and the API wins. Each failed run uploaded the phone AAB _first_ and then died on `Track not found: wear:qa` — a silent phone-only release with unrecoverable version codes, three times. The protection now is `ensure_wear_track_exists!`, which asks Play for the real track list in `ship_android!` **before either artifact is built**, so a wrong destination costs seconds instead of a partial ship. An unreachable API is deliberately not a failure.
- **Nightly uploads are `release_status: "completed"`, not the RC lane's `draft`.** The RC lane uses a draft so promoting to testers stays a human action; a nightly whose whole purpose is unattended delivery cannot require a nightly human click. Do not "restore consistency" — it would turn the nightly into a queue of undelivered drafts that looks green from CI.
- **Two new versionCode bands.** `GITHUB_RUN_NUMBER` is scoped per workflow file, so this file starts a fifth independent counter. The phone uses `4_000_000 + run` (arithmetic in the workflow, as `store-upload.yml` does); Wear uses `5_000_000 + run` (applied in `watch-android/app/build.gradle.kts`, selected from the upload track so the band cannot disagree with the destination). ⚠️ Nightly codes are **higher than production codes**, so a device on a nightly never receives a production build as an update — leaving the nightly track means reinstalling.
- **iOS needs no band.** `fastlane ios nightly` derives its build number from `latest_testflight_build_number + 1`, the only build number in this repo read from remote state, so runs of different workflows number past each other as long as they do not overlap (see [Build number conflict](#build-number-conflict)).
- **Baselines are the moving tags `nightly/ios` and `nightly/android`**, force-pushed with the default `GITHUB_TOKEN` after a successful upload. They match no existing tag trigger (`v*.*.*-rc.*`, `v*.*.*`), and pushes made with `GITHUB_TOKEN` do not trigger workflow runs — two independent guards against a nightly tag firing a store upload. Each tag moves only if **its** platform succeeded, so a failed platform retries tomorrow rather than swallowing the change. **A `workflow_dispatch` never moves a tag**, whatever its inputs.
- **A skip is a green run**, never a red X and never a warning: the common case must not train everyone to ignore the signal. It explains itself in the job summary — baseline SHA, head SHA, file counts and the triggering files.
- Every job sets `timeout-minutes`. The older release workflows do not, which is worth fixing separately.

## Fastlane & Native Build Notes

Location:

- `fastlane/Fastfile`
- `fastlane/Appfile`
- `fastlane/Matchfile`

Important details:

- `setup_ci` runs automatically in iOS lanes on CI to create a temporary keychain for `match`.
- `npx expo prebuild` is required before iOS and Android Fastlane lanes to generate native projects.
- iOS signing is handled with `fastlane match` and `update_code_signing_settings` for both:
  - main iOS bundle ID
  - watchOS bundle ID (`#{app_identifier}.watch`)
- The watch app is built together with the iOS app in the same `ios` lane, not by a separate lane.

iOS lanes summary:

- `ios adhoc` — AdHoc distribution build
- `ios beta` — TestFlight upload
- `ios nightly` — the same build as `beta`; accepts `dry_run:true` to build without uploading
- `ios upload_release` — App Store release upload

Android lanes summary:

- `android adhoc` — Release APK build (phone only; no Wear artifact, nothing is uploaded)
- `android beta` — Builds the phone AAB and the Wear OS AAB; uploads them to the `alpha` track and `wear:alpha` respectively
- `android upload_release` — the same pair, to `production` and `wear:production`
- `android nightly` — the same pair, to `internal` and `wear:internal`, with `release_status: "completed"`; accepts `dry_run:true`
- `ship_ios!` / `ship_android!` (private) — the shared lane bodies. `beta`, `upload_release` and `nightly` differ only in whether they upload and where to: on Android the track and release status, on iOS the destination (TestFlight or the App Store)
- `build_wear_bundle!` (private) — builds and signing-parity-checks the Wear AAB; runs **before** either upload so a build failure cannot strand a phone-only release
- `upload_wear_bundle!` (private) — uploads that AAB to the `wear:` form-factor track, and translates Play's `Track not found` into the Console steps that fix it

## Release Runbooks

### Why releases are published, not just tagged

**Do not cut a release with a bare `git tag && git push --tags`.** It silently does nothing most of the time.

After nearly every merge, [`mark-story-done.yml`](../.github/workflows/mark-story-done.yml) pushes `chore(sprint): mark story done after merge [skip ci]` straight to `main`, so `main`'s tip usually carries a skip marker. GitHub honours `[skip ci]` (and `[ci skip]`, `[no ci]`, `[skip actions]`, `[actions skip]`, and the `skip-checks: true` trailer) for the `push` and `pull_request` events, and it evaluates them against the **commit the pushed ref points at** — including a pushed tag. Tag that tip, push the tag, and no workflow run is created at all: no red X, no notification, just silence.

Publishing a GitHub Release avoids this entirely, because the `release` event is not a `push` event and cannot be skipped. That is why both release workflows trigger on `release: [published]`, and why the runbooks below use `gh release create`.

The `push: tags` triggers are still in place as a fallback, so an out-of-habit tag push is not a silent no-op when the tip happens to be clean. If you ever _do_ end up with a tag that fired nothing, you have two ways out: publish a release for the existing tag (`gh release create <tag> --verify-tag …`), or run the workflow manually from the Actions tab and pass the tag as the `tag` input.

### Ship to TestFlight

1. Confirm `main` is green with passing CI.
2. Decide the release version.
3. Create and publish the RC as a **pre-release**:

```bash
gh release create v1.0.0-rc.1 --prerelease --generate-notes --target main
```

4. Monitor `.github/workflows/beta-releases.yml` in GitHub Actions. `Store Upload (Final Release)` will also appear with all jobs `skipped` — that is the pre-release guard working, not a failure.
5. Verify the iOS build appears in App Store Connect → TestFlight.
6. Verify the Android build appears in the Play Console alpha (testing) track (phone, version code `<run>`), **and** that the Wear form-factor track has a matching release (Wear OS AAB, version code `2000000 + <run>`). An empty Wear track means the watch app did not ship; see Story 16.35.
7. Distribute to testers.

### Release to Production

1. Validate the RC/TestFlight build, and note the commit it was built from: for an RC, the commit its tag points at; for a nightly, the `head` row of that run's job summary, the commit both platform jobs check out. That row shows 12 characters and `--target` in step 3 needs the full SHA, so expand it (`git fetch origin && git rev-parse <those 12>`); the run's Decide step logs it in full too. Do **not** read a local `nightly/*` tag. The workflow force-moves them, a plain `git fetch --tags` will not update a tag that already exists, and only scheduled runs move them at all; `git ls-remote --tags origin 'nightly/*'` shows the remote's. If the iOS and Android builds you validated came from different runs, pin the newer only if the job summary shows the older platform was skipped there, not failed. A commit from before Story 21.7 merged still carries the old `upload_release`, whose iOS upload App Store Connect refuses.
2. Publish only when no `Beta Releases (RC)` or `Nightly Internal Builds` run of any trigger is in progress and that day's scheduled nightly has finished, and start none until the release's iOS job has finished uploading. A release that overlaps either one, in either order, gives its iOS build the same number, and App Store Connect refuses the second upload (see `ship_ios!` in `fastlane/Fastfile`). Check Actions, not the clock: 25 scheduled nightlies from 2026-09-05 to 09-29 started between 06:58 and 08:45 UTC, not at the 02:17 cron time, and a release takes about 45 minutes. Check Play Console → Publishing overview for managed publishing and, if it is offered, turn it on before publishing: the Android lane uploads `completed` to both production tracks with no staged `rollout`, so without it Play's approval means live, at 100%. Google does not offer it for an app's first publication ("You can't use it when publishing an app for the first time"), and recommends a closed-testing release first.
3. Create and publish the final release (**no** `--prerelease`, and a bare `vX.Y.Z` tag — the workflow checks both), targeting the commit from step 1 rather than `main`, which may have moved since:

```bash
gh release create v1.0.0 --generate-notes --target "$(git rev-parse <commit-from-step-1>)"
```

4. Monitor `.github/workflows/store-upload.yml` in GitHub Actions. `Beta Releases (RC)` will appear with all jobs `skipped`.
5. Verify **both** Play Console production tracks: the mobile track (phone, version code `<run> + 1000000`) and `wear:production` (Wear OS AAB, version code `3000000 + <run>`). Shipping the phone without the Wear half would silently downgrade every tester who already has the watch app.
6. Submit the iOS build for review in App Store Connect: `upload_release` uploads it without submitting. Choose _Manually release this version_, so the iOS release can be timed with Android's. On Android, open Play Console → Publishing overview and confirm both production tracks are in review; send them if not. A green lane does not prove it: when Play answers the commit with "Please set the query parameter changesNotSentForReview to true", supply's `rescue_changes_not_sent_for_review` (default `true`) re-commits the edit unsent and says nothing. With managed publishing on, publish both once approved.
7. Once Apple approves the version, bump `expo.version` before the next nightly. Once a version is released, App Store Connect closes its train ("The train version … is closed for new build submissions") and refuses every later upload at that version, nightly and RC included, until the version moves. The forum explanations tie closure to release, Apple documents no trigger, and whether approval alone closes it is not established; bumping at approval is safe either way.

### Run a nightly by hand

Actions → **Nightly Internal Builds** → _Run workflow_. Useful combinations:

| Goal                                      | Inputs                                                                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Test the pipeline without shipping        | `dry_run: true` — builds and verifies everything, uploads nothing; the IPA and both AABs are attached as run artifacts |
| Get an Android build to testers right now | `platform: android` (skips the 10× macOS job)                                                                          |
| Exercise this workflow before it merges   | `ref: <your-branch>` — `schedule:` only ever runs the default branch's copy                                            |
| Re-ship an unchanged commit               | `force: true` (already the default on a dispatch)                                                                      |

A manual run **never moves a baseline tag**, so it cannot make the next scheduled run skip a change.

### The nightly did not ship

Check in this order:

1. **Did the run happen?** Actions → Nightly Internal Builds. GitHub disables scheduled workflows in repositories with no activity for 60 days; re-enable from the Actions tab.
2. **Was it a deliberate skip?** Open the run summary. A skip is green and states the baseline SHA, the head SHA and how many changed files were binary-affecting. `0 of N` means the gate worked.
3. **Is the baseline stale or wrong?** `git fetch --force --tags origin && git log nightly/ios..origin/main --oneline` shows exactly what the next nightly considers pending. The `--force` is load-bearing: the workflow force-moves these tags, and a plain `git fetch --tags` refuses to update one that already exists, so the `&&` never runs. Deleting the tag makes the next run fail open and build.
4. **Did the path definition drift?** `yarn check:build-path-filters`. If a new source directory is missing from `.github/build-path-filters.json`, changes inside it will never trigger a nightly.
5. **Did the Wear half fail alone?** Look for `Track not found` — the lane prints the tracks this app actually has. Note the phone AAB is uploaded before the Wear AAB, so this state means Play `internal` has a phone build with no matching watch build.

### Manual / AdHoc Build

Manual workflow:

- Open the GitHub Actions UI.
- Trigger `.github/workflows/ios-release.yml` or `.github/workflows/android-release.yml` via `workflow_dispatch`.

Local adhoc build:

```bash
bundle exec fastlane ios adhoc
bundle exec fastlane android adhoc
```

## watchOS CI/CD

The watchOS companion app is part of the iOS build pipeline.

Key points:

- `watchos-tests.yml` verifies watch target compilation and catalogue generation on macOS.
- It is a build verification path, not a full signed release validation.
- `beta-releases.yml` and `store-upload.yml` build the watch app as part of the same iOS lane.
- The watch app uses a separate watch bundle ID and provisioning profile managed by `match`.

watchOS signing path:

- `match(type: 'adhoc', app_identifier: watch_identifier, readonly: is_ci)` for AdHoc builds
- `match(type: 'appstore', app_identifier: watch_identifier, readonly: is_ci)` for beta/release uploads
- `update_code_signing_settings` targets the watch target explicitly

Note:

- There is no dedicated `watch_beta` or `watch_upload_release` lane in the current Fastfile.
- The watch companion is signed and built inside the iOS `beta` and `upload_release` lanes.

## Provisioning & match

fastlane match behavior:

- Local Fastlane work now requires Ruby `4.0.5`. CI uses `ruby/setup-ruby` with the same version, `Gemfile` reads it from `.ruby-version`, and local Fastlane helpers expect that exact toolchain.
- `match` is configured in `fastlane/Matchfile` and uses the certificate repository referenced there.
- CI runs `match` in readonly mode via `readonly: is_ci`.
- Local runs may use write mode if the developer has access to the certificate repo and the correct secrets.
- The iOS `fastlane` lanes call `setup_ci` on macOS CI runners to create a temporary keychain before `match` runs.

Local helper commands:

- `yarn fastlane:match:bootstrap` verifies that a compatible Ruby is available, installs Bundler `2.7.2` if needed, and runs `bundle install`.
- `yarn fastlane:match:fetch` installs Bundler `2.7.2` if needed, runs `bundle install`, and then syncs development, Ad Hoc, and App Store profiles for both the iOS app and watch target through the existing `ios fetch_certificates` lane.
- `yarn fastlane:match:development -- --readonly`
- `yarn fastlane:match:adhoc -- --force`
- `yarn fastlane:match:appstore -- --readonly`
- `yarn fastlane:match -- nuke distribution --skip-confirmation`

The helper script is `scripts/fastlane-match.sh`. It derives both bundle identifiers from `fastlane/Appfile`, requires Ruby `4.0.5`, prefers a matching Homebrew Ruby automatically when the shell is still on macOS system Ruby, bootstraps Bundler `2.7.2`, and then runs the requested `fastlane match` command.

CI environment variables used for `match` and signing:

- `MATCH_PASSWORD`
- `MATCH_GIT_BASIC_AUTHORIZATION`
- `MATCH_USERNAME`
- `FASTLANE_TEAM_ID`
- `APP_STORE_CONNECT_API_KEY_KEY_ID`
- `APP_STORE_CONNECT_API_KEY_ISSUER_ID`
- `APP_STORE_CONNECT_API_KEY_KEY`

For Android uploads, the CI secrets are:

- `ANDROID_PACKAGE_NAME`
- `PLAY_STORE_API_KEY` (service account JSON content)
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `PLAY_STORE_API_KEY`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_KEY`

Adding a new bundle ID in this repo:

1. Register the new app identifier in Apple Developer.
2. Create the app record in App Store Connect if needed.
3. Add the identifier to `fastlane/Matchfile` if the repo configuration is restrictive.
4. Run locally:

```bash
yarn fastlane:match:fetch
```

5. Confirm the new provisioning profile is committed to the certificate repository.

Project-specific notes:

- `fastlane/Appfile` defines the base iOS app identifier used by the Fastlane lanes.
- `fastlane/Matchfile` defines how `match` connects to the certificate repository and which app identifiers are synced.
- The watch bundle ID is derived from the base iOS app identifier as `#{app_identifier}.watch`.

CI keychain setup:

- `setup_ci` creates a temporary keychain on macOS CI runners.
- This temporary keychain is required before `match` can install certificates.
- It is enabled automatically in iOS lanes when `is_ci` is true.

## Troubleshooting

### Fastlane fails immediately (~1 second)

- Check GitHub Actions secrets.
- Verify `MATCH_PASSWORD`, App Store Connect API secrets, and platform-specific secrets are present.
- Confirm `SLACK_WEBHOOK_URL` is not causing unexpected failure in the quality gates workflow.

### Code signing error

- Check the app identifier and watch bundle ID in `fastlane/Appfile`.
- Verify `match` profile names match the bundle IDs.
- Confirm the correct Xcode project and target names are passed to `update_code_signing_settings`.

### Build number conflict

- Every iOS upload lane — `beta`, `nightly` and `upload_release`, all through `ship_ios!` — numbers its build one past the latest TestFlight upload of **any** version (`next_ios_build_number`). `upload_release` used to take `GITHUB_RUN_NUMBER` instead — five runs old when TestFlight had reached build 40 (2026-09-29) — so the first production upload would have been refused (Story 21.7).
- **Two overlapping runs collide.** A release and a nightly or RC that overlap, from one's lookup until the other's upload is done, number their iOS builds alike, and App Store Connect refuses the second as a duplicate. Re-run the refused run: a fresh lookup numbers past the upload that won. [Release to Production](#release-to-production) step 2 is the prevention.
- `adhoc` uses `GITHUB_RUN_NUMBER` on CI or a timestamp locally. AdHoc builds never reach App Store Connect, so that number cannot collide.
- Android `beta`/`upload_release` versionCode is set by `app.config.ts` at `expo prebuild` time from `ANDROID_VERSION_CODE` (`GITHUB_RUN_NUMBER`, with a `+1,000,000` production offset band so the two release workflows never collide in Play's shared versionCode space), falling back to a Unix timestamp for local builds.

### `expo prebuild` changes signing settings

- Always run `npx expo prebuild` in the workflow before Fastlane.
- watchOS and iOS native project generation must happen before `build_app`.

### watchOS build uses wrong destination

- Verify the watch target is still named `watch` in `update_code_signing_settings`.
- Confirm `watch-ios/Scripts/generate-catalogue.swift` runs successfully before the Xcode build.

## References

- `docs/sprint-artifacts/stories/11-6-watchos-testflight-pipeline.md`
- `docs/sprint-artifacts/stories/11-2-build-on-main-app-changes-only.md`
- `docs/sprint-artifacts/epic-11-cicd.yaml`
- `fastlane/Fastfile`
- `.github/workflows/ci-quality-gates.yml`
- `.github/workflows/watchos-tests.yml`
- `.github/workflows/ios-release.yml`
- `.github/workflows/android-release.yml`
- `.github/workflows/beta-releases.yml`
- `.github/workflows/store-upload.yml`
- `.github/workflows/nightly-builds.yml`

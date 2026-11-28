---
baseline_commit: 'edeab28add0f2dd5a947ce4f67758aaacac594b7'
title: 'EAS Update: publish the catalogue over the air instead of rebuilding a binary, and make the runtime version track the native layer'
type: 'chore'
created: '2026-11-28'
status: 'backlog'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
  - '{project-root}/docs/eas-update-setup.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The catalogue is bundled into the JavaScript, so a new brand should reach a user
without a store release. Nothing in this repository makes that possible. `expo-updates` is
installed and `app/_layout.tsx` performs a real boot-time update check, but:

1. **No workflow ever publishes an update.** `eas update` appears nowhere in
   `.github/workflows/`. Story 3.5 marked "Update Catalogue via OTA" **done** in February, and
   its own record says the flow was exercised — but the machinery it needed was never built.
   The runbook `docs/catalogue-ota-updates.md` tells a maintainer to run
   `eas update --branch <branch> --message "…"`, which **cannot work**: `--branch` publishes onto
   a branch that no channel points at, so no build ever receives it.
2. **The runtime version is pinned to a number that does not move.** `app.json` sets
   `runtimeVersion: { "policy": "appVersion" }` and `version` has been `1.0.0` since the first
   commit. Native dependencies have moved a long way since — `react-native-screens` to
   `~4.25.2` (Story 24.4), `expo-camera`, `expo-sqlite`, `expo-secure-store`,
   `expo-image-picker`, `expo-localization`, `@sentry/react-native`, `expo-sharing`,
   `expo-build-properties` (SDK 36), `@bacons/apple-targets`, and two local config plugins. Under
   `appVersion`, every one of those native changes leaves the runtime version at `1.0.0`, so an
   OTA bundle would be offered to binaries that lack the native module it calls. This is
   recorded three times in the tracker — stories 16.54, 16.56 and the 24.4 note — each as a
   reason not to publish.
3. **The app has no channel.** `app.json` sets `updates.url` and `runtimeVersion` but no
   `expo-channel-name`, so a shipped binary does not request a named channel. Without a channel
   the app cannot be told which branch to follow.
4. **Nothing verifies the update configuration.** No test asserts that `runtimeVersion` is
   compatible with the native layer, that a channel exists, or that `projectId` and
   `updates.url` agree. Every one of those can silently regress.

**Approach:** Make the OTA path real, in three parts:

- **Configuration** — `runtimeVersion` moves to the `fingerprint` policy, so the runtime
  version is derived from the native layer instead of from a human remembering to bump a
  store-facing number. A `fingerprint.config.js` neutralises the one source of churn in this
  repository (below), and `eas.json` declares the channels the builds will request.
- **A publishing workflow** — a new `ota-publish.yml` that publishes an EAS Update on a
  catalogue change, instead of the project needing a new binary for one.
- **Verification** — a test that fails when the update configuration is inconsistent, so the
  three findings above cannot come back quietly.

**Decisions (pending ifero's approval):**

- **The runtime version policy moves to `fingerprint`.** This is the only policy that
  increments the runtime version "whenever anything that may impact the native runtime
  changes", which is precisely this repository's failure mode. The cost, stated by Expo, is
  "making it necessary to create builds more often" — which for Cardì is the correct trade,
  because an OTA that crashes on the native layer is far more expensive than a build.
- **Publishing targets `--channel production`, not `--branch`.** The runbook's current
  instruction is wrong for a production rollout.
- **The publishing workflow is manual-first.** A catalogue change opens a pull request like any
  other change; the workflow publishes from `main` on a **tag**, and a maintainer can also
  dispatch it by hand. Nothing is published to users from an unmerged branch.
- **The workflow publishes, it does not build.** It does not touch `fastlane`, TestFlight or
  Play. A patch release or an RC still goes through the existing release workflows; this is an
  additional lane, not a replacement for them.
- **The first publish is a no-op until a store binary exists.** A channel with no build is a
  supported state, but no installed app receives an update for a runtime version that no
  installed binary has. The first OTA therefore needs a shipped binary on the same runtime
  version — which means shipping one binary before this lane can reach a user.

</frozen-after-approval>

## Boundaries & Constraints

**Always:** The `fingerprint` hash is **stable across two consecutive runs** — verified, not
assumed. The publish job runs `--non-interactive`, passes `--message` and `--channel`
explicitly, and passes `--environment production`. The workflow's trigger is a tag on `main`
or a manual dispatch, never an arbitrary pull request. The catalogue's `version` field stays
an ISO date. Every step of the manual procedure remains documented for a maintainer who
prefers to publish by hand.

**Never:** Publish to a channel other than `production` from this workflow. Use `--auto` in CI
(it derives the branch name from the git branch, and CI runs on a detached HEAD). Put the
`EXPO_TOKEN` in a file in the repository — it is a repository secret. Change the release
workflows (`beta-releases.yml`, `store-upload.yml`, `nightly-builds.yml`) — this story adds a
lane, it does not re-route the existing ones. Bump `expo.version` to satisfy the runtime
version — that is the whole point of the fingerprint policy. Publish an OTA from a branch that
is not `main`.

## I/O & Edge-Case Matrix

| Scenario                           | Input / State                                        | Expected Output / Behavior                                                                       | Error Handling                                      |
| ---------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| The fingerprint is computed twice  | Two runs seconds apart, `ANDROID_VERSION_CODE` unset | The same hash both times                                                                         | The CI check fails and says which source moved      |
| A native dependency is bumped      | `react-native-screens` is installed at a new version | The fingerprint changes; the next OTA is a new runtime version                                   | N/A                                                 |
| Only a JS file changes             | `features/cards/...` edited                          | The fingerprint does NOT change; the OTA applies to every existing binary                        | N/A                                                 |
| The catalogue changes              | `catalogue/italy.json` edited, `version` bumped      | The OTA carries the new catalogue; no binary is built                                            | N/A                                                 |
| The publish runs in CI             | A `v*-ota.*` tag on `main`                           | An update group is published to the `production` channel                                         | The job fails with the CLI's message                |
| The publish runs without a target  | `--channel` or `--branch` missing                    | The CLI refuses                                                                                  | The job fails before publishing                     |
| The channel does not exist         | First ever publish                                   | The channel and its branch are created and linked                                                | The job fails if creation is refused                |
| No binary has this runtime version | A brand-new fingerprint, no shipped build            | The publish succeeds; no installed app receives it yet                                           | The runbook says so; the workflow's summary says so |
| The token is missing or expired    | `EXPO_TOKEN` unset or revoked                        | The publish fails before bundling                                                                | The job fails with the CLI's auth error             |
| The OTA is bad                     | A user-visible regression in the published bundle    | `eas update:republish --destination-channel production` rolls the channel back to a known update | Documented in the runbook                           |

## Code Map

- `app.json` — the `expo` block. `runtimeVersion: { "policy": "appVersion" }` (the policy to
  change), `updates.url` (present, points at the project), `extra.eas.projectId` (present:
  `1861d36e-c8a8-4912-8ce4-67ac585e74ee` — the project is **already** linked to an Expo
  account, since commit `d68830b`). `expo.version` is `1.0.0`.
- `app.config.ts:30-41` — `resolveAndroidVersionCode()`: falls back to
  `Math.floor(Date.now() / 1000)` when `ANDROID_VERSION_CODE` is unset. **This is the churn
  that breaks the fingerprint** — see Design Notes.
- `app/_layout.tsx:429-468` — the existing boot-time update check: `Updates.isEnabled`,
  `checkForUpdateAsync` (bounded by `UPDATE_CHECK_TIMEOUT_MS = 5000`),
  `fetchUpdateAsync` (bounded by `UPDATE_FETCH_TIMEOUT_MS = 30000`), `reloadAsync`, with
  `logger.notify` on either failure path (Stories 16.10, 16.12, 16.14). **The client side
  already exists and is bounded; it is not this story's work to rewrite it.**
- `app/_layout.tsx:409-496` — `initializeApp()` runs inside a `useEffect`, so the check happens
  **once per cold start**, not on a timer and not on foreground.
- `docs/catalogue-ota-updates.md` — the runbook. Its `eas update --branch <branch> --message
"…"` step is the wrong command for a production rollout (see Design Notes).
- `docs/sprint-artifacts/stories/3-5-update-catalogue-via-ota.md` — marked `done`, with
  "Expo Updates integration" and "Validate new brand appears after OTA update" ticked. The
  client-side code it describes is real; the publishing side was never built.
- `docs/sprint-artifacts/stories/16-54-triage-onboarding-followups.md` and
  `docs/sprint-artifacts/stories/16-56-triage-store-and-ota-followups.md` — both record the
  `appVersion` hazard. 16.56 already proposes `fingerprint`; this story is that proposal,
  carried out.
- `package.json` — `expo-updates: ~55.0.21`, `expo: ^55.0.19`. `expo.install.exclude` holds
  `react-native-screens` (Story 16.56's item, with its exit condition).
- `.github/workflows/` — `beta-releases.yml` (RC → TestFlight + Play alpha),
  `store-upload.yml` (final → stores), `nightly-builds.yml` (nightly internal tracks). **None
  of them publishes an update.** The new workflow is a fourth lane.
- `.github/workflows/mark-story-done.yml` — lands `chore(sprint): mark story done after merge
[skip ci]` on `main` after most merges. **A `push`-triggered publish workflow would fire on
  that commit** — which is why this story's trigger is a tag, not a push.
- `.github/build-path-filters.json` — the committed path allow-list that
  `nightly-builds.yml` and the release workflows share, held in sync by
  `yarn check:build-path-filters`. The new workflow needs a catalogue-specific path list, and
  `yarn check:build-path-filters` must be taught about it (see Tasks).
- `docs/eas-update-setup.md` — the research this story is built on: 1107 lines, every claim
  quoted from live Expo docs or the `eas-cli` 27.11.0 source, fetched 2026-11-28.
- Do not change: the release workflows' triggers, the `fastlane` lanes, the boot-time update
  check in `app/_layout.tsx`, the catalogue's shape, `expo.version`.

## Tasks & Acceptance

**Execution:**

- [ ] `app.json` — `runtimeVersion` moves to `{ "policy": "fingerprint" }`. `updates.url`,
      `extra.eas.projectId` and `expo.version` are unchanged.
- [ ] `fingerprint.config.js` (new, repo root) — `sourceSkips: ['ExpoConfigVersions']`, with
      the reason written in a comment. This is what makes the hash stable: see Design Notes.
- [ ] **Verify the fingerprint is stable**: run it twice, seconds apart, with
      `ANDROID_VERSION_CODE` unset, and assert the hashes match. Then change an **installed**
      native dependency and assert the hash **does** change. A CI check does both.
- [ ] `eas.json` (new, repo root) — created by `eas build:configure`, then reconciled by hand:
      the `build` profiles carry their `channel`, and `cli.appVersionSource` is set
      deliberately (see Design Notes — it interacts with `app.config.ts`'s local
      `android.versionCode`).
- [ ] `app.json` — the channel the built binary requests. `expo-build-properties` or the
      native config sets `expo-channel-name`; the channel name and the one the workflow
      publishes to are the same string, and the CI check asserts it.
- [ ] `.github/workflows/ota-publish.yml` (new) — publishes an EAS Update: - **Trigger:** a `v*-ota.*` tag pushed to `main`, plus `workflow_dispatch` with a
      `channel` input defaulting to `production` and a `dry_run` input. **Not** a `push` on
      `main` — the `mark-story-done.yml` commit would fire it. - **Auth:** `EXPO_TOKEN` from the repository secrets, passed to the CLI as an environment
      variable only. It is never written to a file. - **Command:** `eas update --channel <channel> --message "…" --environment production
--non-interactive --json`. - **Guards before publishing:** the fingerprint-stability check; a check that the working
      tree is clean; a check that the catalogue's `version` is an ISO date and that it
      changed or the run is a re-publish; and an assertion that the runtime version being
      published matches the one the shipped binary has — see Design Notes for how that is
      expressed. - **Never** `--auto` (detached HEAD in CI) and never `--branch`. - **After publishing:** the update group's URL and id are surfaced in the job summary,
      and `eas update:list` is used to confirm what is live on the channel. - **The workflow does not build.** No `fastlane`, no TestFlight, no Play.
- [ ] `scripts/check-update-config.mjs` (new) + `yarn check:update-config` — the repository's
      own style of gate (see `scripts/verify-native-patches.mjs`): asserts that
      `runtimeVersion.policy` is `fingerprint`, that `extra.eas.projectId` and `updates.url`
      agree (both carry the same project id), that `eas.json` declares a channel matching the
      one the app requests, and that the fingerprint is **stable across two runs** and
      **changes when an installed native dependency changes**.
      **The gate needs `@expo/fingerprint` as a DIRECT dependency.** It is present only
      transitively today (`expo` → `expo-updates` → `@expo/fingerprint` 0.16.6), and a script
      that imports a transitive dependency is relying on someone else's dependency tree —
      it disappears the moment an upstream package stops pulling it in. Declare it explicitly
      (via `npx expo install @expo/fingerprint`, per AGENTS.md's install rule) rather than
      reaching into `node_modules`.
- [ ] `.github/workflows/ci-quality-gates.yml` — the new gate runs in the always-on job, so a
      broken update configuration is red on the pull request that causes it.
- [ ] `.github/build-path-filters.json` + `yarn check:build-path-filters` — the new
      workflow's paths are declared in the committed definition, not as a second copy in the
      workflow file. The catalogue is an input to the OTA lane, so `catalogue/**` joins the
      list.
- [ ] `docs/catalogue-ota-updates.md` — rewritten as the runbook it should have been: - the **manual** procedure, corrected to `--channel production` (the current
      `--branch` instruction cannot work); - the **automatic** procedure: tag a version, push it, the workflow publishes; - the **sequencing rule** from Design Notes — an OTA only reaches binaries that share its
      runtime version, so publish _after_ the binary that carries it is on the store; - **rollback**: `eas update:republish --destination-channel production`; - the **channel pause** kill-switch: `eas channel:pause production`.
- [ ] `docs/cicd.md` — the pipeline diagram gains the OTA lane, and the runbook section points
      at the new document.
- [ ] `AGENTS.md` — the rule that a native change moves the runtime version is stated
      mechanically (the fingerprint does it) rather than as a discipline.
- [ ] The **first publish** is performed by a human, with the workflow's dry-run output
      reviewed, before any OTA reaches a user.
- [ ] `yarn lint`, `yarn typecheck`, `yarn test`, `yarn format:check` — green.

**Acceptance Criteria:**

- Given two runs of the fingerprint seconds apart with `ANDROID_VERSION_CODE` unset, when the
  fingerprint is computed, then the hashes are identical — and the CI gate fails if they are
  not.
- Given an installed native dependency is changed, when the fingerprint is computed, then the
  hash changes — so an OTA built for the new native layer is never offered to an old binary.
- Given only a JavaScript file changed, when the fingerprint is computed, then the hash does
  **not** change — so a catalogue-only OTA still reaches every installed binary.
- Given `runtimeVersion.policy` is `appVersion`, when CI runs the update-config gate, then the
  job fails and names the policy.
- Given the `EXPO_TOKEN` is missing or revoked, when the publish job runs, then it fails
  **before** bundling, with the CLI's own message.
- Given the publish job runs, when it completes, then an update group exists on the
  `production` channel and the job summary carries its URL and id.
- Given a catalogue change merged to `main`, when a maintainer pushes a `v*-ota.*` tag, then
  the workflow publishes an update carrying that catalogue — and **no binary is built**.
- Given a regression in a published update, when a maintainer runs
  `eas update:republish --destination-channel production` with a known-good update id, then
  the channel serves the known-good bundle — documented, with the caveat that a client that
  already fetched the bad bundle needs the error-recovery path.
- Given `docs/catalogue-ota-updates.md`, when a maintainer follows it, then every command it
  gives is one that works — in particular `--channel`, not `--branch`.

## Reference implementation — the publishing workflow

The shape below is the deliverable the story describes. It is a **reference**, not a file to
copy verbatim: the real workflow adds the guards AC7 names, and the paths come from
`.github/build-path-filters.json` rather than being a second copy in the workflow file.

```yaml
# .github/workflows/ota-publish.yml
name: OTA Publish (Catalogue Update)

on:
  # A tag, NOT a push. `mark-story-done.yml` lands a `[skip ci]` commit on `main` after
  # most merges, and a push-triggered publish would fire on it and ship an update nobody
  # asked for. GitHub honours `[skip ci]` for push and pull_request events but NOT for tag
  # pushes -- which is why `beta-releases.yml` and `store-upload.yml` both use a published
  # release as their reliable trigger and keep the tag pattern as a fallback.
  push:
    tags:
      - 'v*-ota.*'
  workflow_dispatch:
    inputs:
      channel:
        description: 'Channel to publish to'
        required: true
        default: 'production'
      dry_run:
        description: 'Bundle and validate, but do not publish'
        type: boolean
        required: false
        default: false

concurrency:
  group: ${{ github.workflow }}-${{ github.ref_name }}
  cancel-in-progress: false # a publish is not something to cancel halfway

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: 'true'

jobs:
  publish:
    name: Publish EAS Update
    runs-on: ubuntu-latest
    permissions:
      contents: read
    env:
      EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
      NODE_ENV: development
    steps:
      - name: Check for EXPO_TOKEN
        run: |
          if [ -z "$EXPO_TOKEN" ]; then
            echo "::error::EXPO_TOKEN is not set. Add it as a repository secret."
            exit 1
          fi

      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      # The guards, before anything is published (AC7).
      - name: Verify the update configuration
        run: yarn check:update-config

      - name: Verify the working tree is clean
        run: |
          if [ -n "$(git status --porcelain)" ]; then
            echo "::error::The working tree is dirty; an update would not match the tag."
            git status --porcelain
            exit 1
          fi

      - name: Verify the catalogue version is an ISO date
        run: |
          VERSION=$(node -p "require('./catalogue/italy.json').version")
          if ! echo "$VERSION" | grep -Eq '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'; then
            echo "::error::catalogue/italy.json version '$VERSION' is not an ISO date."
            exit 1
          fi
          echo "Catalogue version: $VERSION"

      - name: Set up EAS CLI
        uses: expo/expo-github-action@v9
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      # NOT `--auto`: it derives the branch name from the git branch, and CI runs on a
      # detached HEAD. NOT `--branch`: that bypasses the channel, so no build would ever
      # receive the update. `--environment` is REQUIRED in SDK 55 and later.
      - name: Publish the update
        run: |
          eas update \
            --channel "${{ github.event.inputs.channel || 'production' }}" \
            --message "Catalogue ${{ github.ref_name }}" \
            --environment production \
            --non-interactive \
            --json > eas-update.json
          cat eas-update.json

      - name: Confirm what is live on the channel
        run: eas update:list --channel "${{ github.event.inputs.channel || 'production' }}" --non-interactive
```

**What this workflow deliberately does not do:** it builds no binary, touches no
`fastlane` lane, and uploads nothing to TestFlight or Play. It is a fourth lane beside
`beta-releases.yml`, `store-upload.yml` and `nightly-builds.yml` -- not a replacement for any
of them.

**What it cannot prove:** that the published update reached a device. An OTA is offered only to
a build whose runtime version matches exactly, so the first publish needs a shipped binary
carrying the same runtime version (AC10). The workflow's summary should say so, rather than
implying the change is live.

## Reference implementation — the runbook

`docs/catalogue-ota-updates.md` currently gives a command that cannot work. The replacement
carries the four things a maintainer needs and does not have today: the command that works,
the order in which things must happen, how to undo one, and how to stop serving updates
entirely.

```markdown
# Catalogue OTA Updates (EAS Update)

The catalogue ships inside the JavaScript bundle, so a new brand reaches installed apps as
an over-the-air update -- no store release, no review queue.

## Before anything: the runtime version rule

An update is offered to an app only when the runtime version matches **exactly**. The runtime
version is derived from the native layer (`runtimeVersion.policy: "fingerprint"`), so:

1. A native change moves the runtime version.
2. The new binary must be built **and shipped** before an update for it reaches anybody.
3. Only then does a published update for that runtime version reach installed apps.

Publishing an update for a runtime version no shipped binary has **succeeds and reaches
nobody**. This is the most common way an OTA lane looks broken when it is fine.

## Automatic (the CI lane)

    git tag v1.2.3-ota.1 && git push origin v1.2.3-ota.1

The `ota-publish.yml` workflow publishes to the `production` channel. The job summary carries
the update group's URL.

## Manual

    npx eas-cli@latest update \
      --channel production \
      --message "Catalogue 2026-11-28" \
      --environment production

`--environment` is required from SDK 55. `--channel`, **not** `--branch`: an update published
to a branch that no channel points at is never received by any build.

## Verify

- `npx eas-cli@latest update:list --channel production` -- what is live on the channel.
- In the app: Settings -> About shows the bundled catalogue version. Restart the app (the
  check runs on cold start) and confirm the version changed.

## Roll back

    npx eas-cli@latest update:republish --destination-channel production --group-id <id>

Pure-JavaScript rollback -- no store release. A client that already fetched the bad bundle
needs the error-recovery path, so this is not instant for devices mid-session.

## Stop serving updates entirely

    npx eas-cli@latest channel:pause production     # reversible
    npx eas-cli@latest channel:resume production
```

## Design Notes

### The fingerprint is unstable in this repository, and the reason is `Date.now()`

`@expo/fingerprint` hashes the **resolved** Expo config, and `app.config.ts:30-41` computes
`android.versionCode` as `Math.floor(Date.now() / 1000)` when `ANDROID_VERSION_CODE` is unset
— a value that changes every second. Measured on this repository:

- Two fingerprints 2.5 seconds apart, no `fingerprint.config.js`:
  `6af24a5195f564ec428f24eb7e3ec3a8f496ba3b` and
  `ed6e3ac9edadb4864512819fe592fcea647d80a7` — **different**.
- Diffing the two source lists, exactly **one** source differs: `expoConfig`, whose
  `versionCode` read `1795879028` in one run and `1795879036` in the other.
- With `fingerprint.config.js` containing `sourceSkips: ['ExpoConfigVersions']`, two runs
  3 seconds apart both produced `0c03bb3b2df0eda2f380e11e0af372906db748bc` — **stable**, and
  `expoConfig` is still hashed (only the version fields are skipped).

So the skip is not "exclude the config"; it is "exclude the version fields". That is exactly
what `ExpoConfigVersions` means, and it is one of the skip keys Expo's own documentation
recommends.

**This is why the stability check is an acceptance criterion and not a note.** A fingerprint
policy that changes every second would create a new runtime version every second, and no
binary would ever match an update. The failure is silent — the publish succeeds and reaches
nobody.

### The fingerprint tracks the _installed_ dependency, not the declared range

Worth stating, because it decides when a native change actually moves the runtime version.
Measured:

- Changing the **declared** range in `package.json` (`react-native-screens` → `~4.26.0`)
  without installing leaves the fingerprint at `0c03bb3b…`. The root `package.json` is not
  itself a hashed source; the fingerprint hashes the **installed** package directories
  (`node_modules/react-native-screens` → `532d1ad6597a…`) and each installed package's own
  `package.json`.
- Changing the **installed** version does move it: with
  `node_modules/react-native-screens/package.json` reporting `4.26.0`, the project hash became
  `8099c2ea1a1399c4f84bec69f274fa0de3f94761`.

The practical consequence is that the runtime version moves when `yarn install` brings a new
native package, which is when a native change actually reaches the app. That is the correct
semantics — but it means the CI check must **install** before fingerprinting, not merely edit
a range.

### The sequencing rule is the operational hazard of the fingerprint policy

An OTA is only offered to a build whose runtime version matches **exactly** (Expo's rule: "The
runtime version of the build and the target runtime version of an update must match exactly").
A fingerprint runtime version is computed from the project _at publish time_, so:

1. a native change moves the fingerprint;
2. the new binary must be built **and shipped** — only then does an installed app carry the
   new runtime version;
3. only then does a published update for that fingerprint reach anybody.

Publishing an update for a fingerprint no shipped binary has **succeeds and reaches nobody**.
That is the failure mode to write down, and the reason the first publish is a human decision
rather than a tag push.

`fingerprint` was chosen over `appVersion` because Expo's own documentation names this exact
failure: "if you forget to bump the app version when changing the native runtime, then you'll
have a runtime version mismatch… the update would make calls to code that does not exist
inside the build". Cardì's `version` is `1.0.0` and its native dependencies have moved
repeatedly. The counter-argument, stated in the same docs, is that `fingerprint` is
"experimental and not yet widely recommended" — but that guidance is about the general case,
and the incompatibility-avoidance guidance points at `fingerprint` for precisely Cardì's
situation. `nativeVersion` is not an option: it would tie the runtime to
`buildNumber`/`versionCode`, which under `cli.appVersionSource: "remote"` are server-managed
and invisible to the app config.

### `--branch` cannot reach a user; the runbook is wrong

From `packages/eas-cli/src/project/publish.ts`, `--channel` resolves the channel to its linked
branch and **creates and links both if they do not exist**; `--branch` publishes onto a branch
that no channel points at. Expo's own wording: "A channel can be linked to any branch. By
default, a channel is linked to a branch of the same name." So an update published with
`--branch production` sits on a branch, and a build requesting the `production` channel never
sees it. The existing runbook instructs exactly that, so following it today would produce a
successful publish that reaches nobody — the same silent no-op as the wrong runtime version.

### The app checks for updates on cold start only

`app/_layout.tsx:409-496` — the check runs inside `initializeApp`, in a `useEffect`, so it
happens **once per cold start**. Expo's default native behaviour is the same ("check for an
update when the app is cold booted"), and the docs note the downside: "it takes much longer
for users to adopt the latest version". For a catalogue that gains a brand every few weeks,
a cold start is frequent enough that this is acceptable; a Settings row offering a manual
"check for updates" would make the lane visible to a maintainer verifying a publish. That row
is **out of scope** here — it is a product decision, and the story records it as a
follow-up rather than adding it silently.

### What the workflow does NOT do

It does not build a binary, does not touch `fastlane`, TestFlight or Play, and does not
change the existing release workflows. The repository already has three release lanes
(`beta-releases.yml`, `store-upload.yml`, `nightly-builds.yml`); this adds a fourth that ships
JavaScript. A maintainer who prefers to publish by hand can still do so — the runbook keeps
the manual procedure, and the workflow is one command away from it.

### The trigger is a tag, not a push

`mark-story-done.yml` lands `chore(sprint): mark story done after merge [skip ci]` on `main`
after most merges. GitHub honours `[skip ci]` for `push` and `pull_request` events, but
**not** for tag pushes or `release` events — which is why `beta-releases.yml` and
`store-upload.yml` both use a published release as their reliable trigger and keep the tag
pattern as a fallback. A publish workflow triggered by `push` to `main` would fire on the
mark-story-done commit and publish an update nobody asked for. A `v*-ota.*` tag avoids that
and makes the intent explicit: a maintainer decided this catalogue is worth shipping.

### Source

Everything above is grounded in `docs/eas-update-setup.md` (1107 lines; every claim quoted
from live Expo documentation or the `eas-cli` 27.11.0 source, fetched 2026-11-28), plus the
measurements reproduced in Design Notes, which were taken on this repository at
`edeab28`.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors
- `yarn lint` -- expected: no errors
- `yarn format:check` -- expected: clean
- `yarn test` -- expected: all suites pass
- `yarn check:update-config` -- expected: the fingerprint is stable across two runs and moves
  when an installed native dependency changes
- `yarn wear:catalogue:check` -- expected: unchanged

**Manual checks (if no CLI):**

- Run the fingerprint twice, seconds apart, and confirm the hashes match.
- With a valid `EXPO_TOKEN`, run
  `npx eas-cli update --channel production --message "…" --environment production
--non-interactive --json` and confirm the update group is created and listed by
  `npx eas-cli update:list`.
- Confirm the shipped binary requests the channel the workflow publishes to, by reading the
  generated native config for `expo-channel-name` after `npx expo prebuild`.

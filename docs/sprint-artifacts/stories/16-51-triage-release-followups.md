---
baseline_commit: '4bbfcbd1cd08640a3a80b08f6614744ee6cb8aac'
title: 'The release follow-ups: the shipped binary is not the tested one, Play ships at 100 %, the App Store half cannot be dry-run, and the rebrand docs still carry the old palette and the old version rule'
type: 'chore'
created: '2026-11-25'
status: 'backlog'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 21.7 prepared the Cardì 1.0.0 rebrand release and left six items behind. Four are still open, and three of them sit on the release path itself.

1. **The binary that ships is never the binary that was tested.** `.github/workflows/store-upload.yml` checks out the tagged commit and rebuilds both platforms. It does not promote the build a person verified -- the TestFlight build on iOS, the internal or alpha AAB on Play. The build number and versionCode differ, and the runner's `latest-stable` Xcode may differ too.
2. **Every Play release goes to 100 % on approval.** The `upload_release` lane is `ship_android!(track: "production", release_status: "completed", upload: true)` with no `rollout`, so the launch included reaches every device at once.
3. **The App Store half cannot be dry-run.** `upload_to_app_store` offers `verify_only`, and the Fastfile uses none of it: `grep -c verify_only fastlane/Fastfile` is 0. A real release is the first exercise of that path.
4. **The rebrand's own documentation is stale.** `docs/epics.md` still requires `expo.version` to be bumped (ifero overruled that on 2026-09-29; the release ships as `1.0.0`), and still describes the in-app mark's stem as `currentColor`, a variant that was deleted before #219 merged. `docs/style.css` still carries the pre-rebrand `#1a73e8` / `#16a34a`, so the public site renders blue chrome through the rebrand release.

**Approach:** Fix the release mechanics that are safe to fix now (a staged rollout, an App Store dry-run mode, and the documentation), and treat "promote the tested binary" as the decision it is -- it changes what the release workflow is, so it needs ifero's ruling before it is built.

**Decisions (pending ifero's approval):**

- **The Play release gets a staged rollout.** A production release that reaches 100 % on approval has no brake; a staged rollout is the mechanism Play provides.
- **The App Store lane gets a dry-run mode that uploads nothing.** `verify_only` is the option the action already offers; the lane needs to be able to reach it.
- **The documentation is corrected to the decisions that were taken.** The version rule in `docs/epics.md` is corrected to what ifero decided on 2026-09-29, and the `currentColor` sentence is corrected to the mark that ships.
- **"Promote the tested binary" is scoped, not built, in this story.** The mechanism is a release workflow that builds once and promotes the same artifact -- a different workflow shape, and a decision about which build is authoritative.

## Boundaries & Constraints

**Always:** The release lanes keep their current triggers and their track names; the Wear OS companion's `wear:` track derivation and `ensure_wear_track_exists!` are untouched. A dry-run never uploads and never consumes a build number. The staged rollout applies to the production lane only -- the RC lane's deliberate `draft` and the nightly's `completed` to `internal` keep their behaviour. The documentation corrections state what the code does.

**Never:** Change the release tag patterns, the concurrency group, or the version-code bands (the phone's 2_000_000+ and the Wear's 3_000_000+ offsets, and the nightly's 4_000_000 / 5_000_000 bands, are load-bearing -- see the 16.35 and 16.36 tracker notes). Change the store listings or the release copy. Change `expo.version` in `app.json` -- 1.0.0 is the decision. Publish a release, a tag, or a store submission from this story. Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario                       | Input / State                              | Expected Output / Behavior                                                         | Error Handling                                           |
| ------------------------------ | ------------------------------------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Production release             | A `vX.Y.Z` release is published            | The Play release starts staged, not at 100 %                                       | The rollout fails loudly rather than silently completing |
| RC release                     | An RC tag is published                     | The lane still uploads a `draft` to `alpha`                                        | Unchanged                                                |
| Nightly                        | The nightly workflow fires                 | It still ships `completed` to `internal`                                           | Unchanged                                                |
| App Store dry run              | The lane runs with the dry-run flag        | The IPA is built and validated; nothing is uploaded; no build number is consumed   | The lane reports the dry run explicitly                  |
| App Store release              | The lane runs without the dry-run flag     | The IPA is uploaded to App Store Connect; submission for review stays a human step | Unchanged                                                |
| App Store verification failure | `verify_only` reports a validation problem | The run fails before any upload                                                    | The lane surfaces the error                              |

</frozen-after-approval>

## Code Map

- `.github/workflows/store-upload.yml:86` -- `ref: ${{ github.event.inputs.tag || github.ref }}`: the tagged commit is checked out and rebuilt. The trigger block (`:19-53`) covers `release`, `push` on tags and `workflow_dispatch`; the concurrency group (`:32`) collapses a duplicated event.
- `.github/workflows/store-upload.yml:115-118` -- `uses: maxim-lobanov/setup-xcode@v1` with `xcode-version: latest-stable`: the Xcode on the runner is not the one the build was verified with.
- `fastlane/Fastfile:697-762` -- `ship_android!`: `ensure_wear_track_exists!` (`:710`), `build_wear_bundle!` (`:725`), `upload_to_play_store` (`:738-741`, with `track` and `release_status` and **no** `rollout`), `upload_wear_bundle!` (`:762`).
- `fastlane/Fastfile:771-774` -- the `upload_release` lane: `ship_android!(track: "production", release_status: "completed", upload: true)`.
- `fastlane/Fastfile:766-769` -- the `beta` lane: `ship_android!(track: "alpha", release_status: "draft", upload: true)` -- the RC's deliberate draft.
- `fastlane/Fastfile:778-798` -- the `nightly` lane: `ship_android!(track: "internal", release_status: "completed", upload: !options[:dry_run])`, with the comment that a nightly's `completed` is deliberate and must not be made consistent with the RC's `draft`.
- `fastlane/Fastfile:180-215` -- `ship_ios!`: `build_number: next_ios_build_number(...)` (`:181`), `build_app` (`:183`), the `unless upload` dry-run branch (`:195-200`, which skips the upload but still consumes the build number query), and `upload_to_app_store` (`:206-211`) with `skip_metadata: true`, `skip_screenshots: true`, `precheck_include_in_app_purchases: false` -- and no `verify_only`.
- `fastlane/Fastfile.test.rb` -- the Fastfile's own test suite (`yarn test:fastlane`, run in CI by `.github/workflows/ci-quality-gates.yml:191-192`).
- `docs/epics.md:4278` -- _"⛔ **`expo.version` is bumped and the release tag is named.**"_ -- the rule ifero overruled on 2026-09-29.
- `docs/epics.md:3855` -- _"The in-app mark draws its stem in `currentColor` so one asset serves a cream surface and an ink one"_; `:4296` still asks for its device check. No shipped SVG uses `currentColor` (`grep -rn currentColor assets/images/*.svg` returns nothing).
- `docs/style.css:3` (`--color-primary: #1a73e8;`), `:4` (`--color-primary-strong: #1967d2;`), `:14` (`--color-accent: #16a34a;`), `:15-16`, `:40-41`, `:51-53` -- the pre-rebrand palette. The file is live: `docs/index.html:18` and `docs/privacy-policy.html:11` both link it.
- `docs/design/cardi/cardi-design-system.md` -- the Cardì palette the site should carry.
- Do not change: the tag patterns, the concurrency group, the version-code bands, the release copy, `app.json`'s `version`.

## Tasks & Acceptance

**Execution:**

- [ ] `fastlane/Fastfile` -- the `upload_release` lane ships a staged Play rollout instead of reaching 100 % on approval; the rollout fraction and its step schedule are recorded in the Fastfile's comment, as the lane's other decisions are.
- [ ] `fastlane/Fastfile` -- the App Store lane can run a dry run that validates the build without uploading and without consuming a build number; the `dry_run` input the nightly already uses is the same switch, and the lane reports the dry run explicitly.
- [ ] `fastlane/Fastfile.test.rb` (+ tests) -- a test that the production lane passes a rollout and that the App Store dry run performs no upload.
- [ ] `docs/epics.md` -- the `expo.version` rule is corrected to the decision of 2026-09-29 (the release ships as `1.0.0`), and the `currentColor` sentence is corrected to the mark that ships; the device-check line at `:4296` follows.
- [ ] `docs/style.css` -- the palette is migrated to the Cardì tokens (the primary, the accent and their derived washes), in both the light and the dark block; the site's HTML is unchanged.
- [ ] `yarn frames:check`, `yarn lint`, `yarn typecheck`, `yarn test:fastlane` -- green.
- [ ] **Scoped, not built:** the "promote the tested binary" mechanism -- build once, promote the same artifact, rather than rebuild on the tag -- is written up as a decision (which build is authoritative, how the Wear APK and the phone AAB are promoted together, what happens to the version-code bands) and handed to ifero.

**Acceptance Criteria:**

- Given a production release, when it is published, then the Play release starts staged rather than reaching 100 % on approval.
- Given the RC lane, when an RC is published, then it still uploads a `draft` to `alpha`, and the nightly still ships `completed` to `internal`.
- Given the App Store lane with the dry-run flag, when it runs, then the IPA is built and validated, nothing is uploaded, and no build number is consumed.
- Given `docs/epics.md`, when it is read, then it states the version rule that was decided and describes the mark that ships.
- Given the public site, when it is rendered, then it carries the Cardì palette -- no `#1a73e8` and no `#16a34a` remain in `docs/style.css`.

## Design Notes

The release path is the one place where a mistake is irreversible, so the three mechanics here all point the same way: build once, verify, and promote what was verified -- with a brake on the rollout.

"Promote the tested binary" is the deepest of the three and is deliberately left as a decision rather than a diff. It changes what the release workflow _is_: today it is a builder that uploads, and it would become a promoter that uploads an artifact built earlier. That has consequences for the version-code bands (a promoted build carries the number it was built with), for the Wear companion (the phone AAB and the Wear APK must be promoted together, and Play sees one app whose release must list both version codes -- the 16.35 failure class), and for the Xcode version the build was made with. The scoping note exists so the decision is made with those consequences in view.

The staged rollout and the dry run are the two halves of the same brake: one limits how many devices get a bad build, the other proves the upload path works before it runs for real.

## Implementation Notes

- Source issue: #253 (items 1-6). Story 21.7 is `done` by decision (`docs/sprint-artifacts/sprint-status.yaml`,
  `21-7-single-rebrand-release`), with its AC8 device and store table still at "not yet performed"; the
  release mechanics this story touches are the ones that table depends on.
- `docs/style.css` was last touched by `4f7b0c1 feat(brand): the Tessera mark across every icon, the wordmark
and brand moment D (Story 20.6) (#290)` and `da43fab feat(store): store listings, screenshots and site
captures (Story 24.6) (#308)`; neither migrated the palette. Story 18.9 (`7d6a0dd`) moved the site to
  cardiapp.eu but left the colours alone, and its own tracker note records that no story owned them.
- The Fastfile's dry-run branch (`fastlane/Fastfile:195-200`) already skips the upload for iOS, but the
  comment there is explicit that _"A TestFlight build number is consumed by an UPLOAD, not by asking for the
  last one"_ -- so the dry run costs minutes, not a build number. The App Store path is the one missing
  `verify_only`, which is what the action offers for exactly this.
- The `upload_to_play_store` action's `rollout` parameter is what the production lane needs; the RC lane's
  `draft` and the nightly's `completed` must not gain one, or the nightly's behaviour changes (the Fastfile's
  own comment warns against "restoring consistency" with the beta lane).
- The version-code bands are load-bearing and are documented in the 16.35 and 16.36 tracker notes: the
  phone uses `GITHUB_RUN_NUMBER + 2_000_000`, the Wear `+ 3_000_000`, and the nightly `+ 4_000_000` / `+ 5_000_000`.
  A promotion mechanism that reuses a build keeps the number it was built with, which is why the scoping
  note calls this out.
- `fastlane/Fastfile.test.rb` exists and runs in CI (`yarn test:fastlane`), so the new lanes can be pinned
  by tests rather than by inspection.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors
- `yarn lint` -- expected: no errors
- `yarn format:check` -- expected: clean
- `yarn test` -- expected: all suites pass
- `yarn test:fastlane` -- expected: the Fastfile helper tests pass

**Manual checks (if no CLI):**

- Run the App Store lane with the dry-run flag and confirm nothing is uploaded and no build number is
  consumed.
- Render `docs/index.html` and confirm the site carries the Cardì palette in light and dark.

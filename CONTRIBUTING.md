# Contributing to Cardì

Thank you for your interest in contributing! 🎉 Cardì is a community-driven, open-source project with no monetization — it grows through code, brand-catalogue additions, bug reports, and ideas from people like you.

> **On the name.** The app is **Cardì**. The repository, the clone directory and the npm
> package (`myloyaltycards`) keep the original `myLoyaltyCards` name deliberately — so the
> `git clone` below, every badge and every existing link keep working. Expect to see both,
> and do not "fix" one to match the other.

This project is built **spec-first** using the [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) **Spec-Driven Development (SDD)** methodology. Contributing here is a little different from a typical "fork and PR" project: **work follows a spec, and every code change traces back to a documented story.** This guide explains exactly how to do that.

> **The golden rule:** No production code is written without a spec. Before you write code, there must be a **story** (for changes inside an existing epic) or, for genuinely new scope, a planning artifact (PRD/epic) that the story derives from. This is non-negotiable and is what keeps the codebase coherent, testable, and contribution-friendly.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Design / UI Changes](#design--ui-changes)
- [The BMAD SDD Methodology](#the-bmad-sdd-methodology)
- [Where the Specs Live](#where-the-specs-live)
- [Local Setup](#local-setup)
- [The Contribution Workflow (step by step)](#the-contribution-workflow-step-by-step)
- [Branching Conventions](#branching-conventions)
- [Commit Conventions](#commit-conventions)
- [Quality Gates (never bypass)](#quality-gates-never-bypass)
- [Coding Standards](#coding-standards)
- [Code Review & Pull Requests](#code-review--pull-requests)
- [Contributing Brand Catalogue Entries](#contributing-brand-catalogue-entries)
- [Reporting Bugs & Requesting Features](#reporting-bugs--requesting-features)
- [Using the BMAD Agents](#using-the-bmad-agents)
- [Quick Reference](#quick-reference)

---

## Code of Conduct

Be respectful, constructive, and inclusive. This is a hobby project maintained in people's spare time — assume good intent, keep discussions focused on the work, and welcome newcomers. Harassment or hostile behavior is not tolerated.

---

## Ways to Contribute

| Contribution                 | Path                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| 🐛 **Bug report**            | Open a GitHub issue (see [Reporting Bugs](#reporting-bugs--requesting-features)).                      |
| 💡 **Feature idea**          | Open a GitHub issue/discussion. New features enter through **planning**, not a direct PR.              |
| 🏷️ **Brand catalogue entry** | The lightest path — see [Contributing Brand Catalogue Entries](#contributing-brand-catalogue-entries). |
| 💻 **Code change**           | Must follow the [SDD workflow](#the-contribution-workflow-step-by-step) below.                         |
| 🎨 **Design / UI change**    | Propose UX/UI by PR — no Figma seat needed. See [Design / UI Changes](#design--ui-changes).            |
| 📝 **Docs / specs**          | Same SDD workflow, using a `docs/` story or a `docs:` change.                                          |

---

## Design / UI Changes

UX/UI is contributed **in code**, by PR — the repository is the canonical source of truth
for design (Figma is ideation-only). You don't need a Figma seat.

See **[`docs/design/CONTRIBUTING-DESIGN.md`](docs/design/CONTRIBUTING-DESIGN.md)** for the
design-specific details: the three design layers (tokens / components / flows), how to
propose a change to each, the **story-vs-no-story** decision table (token/visual polish
uses a `design`-label fast-path; new screens/components/behavior follow the normal
spec-first flow), and how reviewers preview changes. The golden rules in this document
still apply — the design guide defers to them rather than repeating them.

---

## The BMAD SDD Methodology

BMAD is installed under [`_bmad/`](_bmad/) (6.12.0: modules `core`, `bmm`, `bmb`, `cis`, `tea`). It drives the project through **four phases**, each owned by a specialized agent and producing a tangible artifact:

```
Phase 0 — Discovery        (optional)
  Analyst:    brainstorming · research · product brief

Phase 1 — Planning
  PM:          PRD              → docs/prd.md            (Functional & Non-Functional Requirements)
  UX Designer: UX design        → docs/ux-design-specification.md

Phase 2 — Solutioning
  Architect:   Architecture     → docs/architecture.md
  PM:          Epics & Stories  → docs/epics.md
  Test Arch.:  Test design      → docs/test-design-system.md
  Architect:   Implementation Readiness gate → docs/implementation-readiness-report-*.md

Phase 3 — Implementation        (this is where most contributions happen)
  Planning:     Sprint tracker    → docs/sprint-artifacts/sprint-status.yaml
  bmad-build:   Draft story       → docs/sprint-artifacts/stories/<id>.md
  bmad-build:   Implement story   (code + tests, then its built-in review)
  Dev/QA:       Walkthrough / code review
  Maintainer:   Merge PR
  Team:         Retrospective     → docs/sprint-artifacts/epic-*-retro-*.md
```

**Why this matters for you as a contributor:**

- A **small change inside an existing epic** (bug fix, refinement, an already-planned story) → you work in **Phase 3**: create/claim a story, implement it, and PR.
- A **brand-new capability** (new screen, new platform behavior, new requirement) → it must first be reflected in **Planning/Solutioning** (PRD/epic) before a story can be drafted. Open an issue to discuss scope; a maintainer (or you, with the PM/Architect agents) updates the relevant spec, then a story is created.

This prevents "drive-by" features that don't fit the architecture and keeps every PR reviewable against clear, pre-agreed acceptance criteria.

---

## Where the Specs Live

| Artifact                                     | Location                                                                               | Phase |
| -------------------------------------------- | -------------------------------------------------------------------------------------- | ----- |
| Product Requirements (PRD)                   | [`docs/prd.md`](docs/prd.md)                                                           | 1     |
| UX Design                                    | [`docs/ux-design-specification.md`](docs/ux-design-specification.md)                   | 1     |
| Architecture                                 | [`docs/architecture.md`](docs/architecture.md)                                         | 2     |
| Epics & stories breakdown                    | [`docs/epics.md`](docs/epics.md)                                                       | 2     |
| Test design                                  | [`docs/test-design-system.md`](docs/test-design-system.md)                             | 2     |
| Enforced implementation rules                | [`docs/project-context.md`](docs/project-context.md)                                   | —     |
| Sprint status (source of truth for progress) | [`docs/sprint-artifacts/sprint-status.yaml`](docs/sprint-artifacts/sprint-status.yaml) | 3     |
| Individual story specs                       | [`docs/sprint-artifacts/stories/`](docs/sprint-artifacts/stories/)                     | 3     |
| Agent operating rules                        | [`AGENTS.md`](AGENTS.md)                                                               | —     |

Read [`docs/project-context.md`](docs/project-context.md) and [`AGENTS.md`](AGENTS.md) **before writing any code** — they contain the rules CI and reviewers enforce.

---

## Local Setup

See the [README — Getting Started](README.md#getting-started) for prerequisites (Node 24, Yarn, Ruby 4.0.5, Xcode/Android Studio) and install/run commands. In short:

```bash
git clone https://github.com/ifero/myLoyaltyCards.git
cd myLoyaltyCards
yarn install
cp .env.example .env   # fill in values
yarn ios               # or: yarn android / yarn start
```

---

## The Contribution Workflow (step by step)

Follow these steps for any **code or docs** contribution. Steps 1–2 are the SDD part; steps 3–9 are the implementation loop.

### 1. Find or define the work

- **Browse existing stories** in [`docs/sprint-artifacts/stories/`](docs/sprint-artifacts/stories/) and the current sprint in [`sprint-status.yaml`](docs/sprint-artifacts/sprint-status.yaml). If a story already exists for what you want to do, comment on the related issue/PR to claim it.
- **New scope?** Open a GitHub issue describing the problem and proposed change. A maintainer will confirm whether it fits the current epics or needs a planning update (PRD/epic) first. **Do not start coding new scope before this is agreed.**

### 2. Make sure a story exists (spec-first gate)

Every implementation needs a story file in `docs/sprint-artifacts/stories/<epic>-<n>-<slug>.md`. It is the story's **spec** — one file per story, and the one every merge gate reads — and it must contain, at minimum:

- **Status** — `status` in the frontmatter (`draft` → `ready-for-dev` before dev starts)
- **Intent** and **Boundaries & Constraints** (the user-facing goal, what is always true, what is out of scope)
- **Acceptance Criteria** (testable, Given/When/Then), plus an **I/O & Edge-Case Matrix** where there are meaningful scenarios
- **Tasks** (one per file: path — action — rationale) and **Verification** commands
- **Code Map** (the files that matter, found while planning)

Stories written before `bmad-build` use the classic layout (Story, Context, Acceptance Criteria, Tasks / Subtasks, Dev Notes) with a `Status:` line in the body. The merge automation reads both shapes, but `bmad-build` only resumes specs: pointed at a classic story file it stops and asks, and that story has to be converted or re-planned first.

Create it with `bmad-build <story-key>` (for example `bmad-build 22-2-wallet`). It writes the spec to that path, investigates the code, puts anything only you can decide to you as an **Open Question**, and stops at an approval checkpoint; choose _Approve and stop_ to leave the story `ready-for-dev` for a later session. You can also copy the structure of a recent story. A story must be **`ready-for-dev`** (acceptance criteria approved) before implementation begins.

### 3. Create a branch

Branch from `main` using the [naming convention](#branching-conventions):

```bash
git checkout main && git pull
git checkout -b feature/5-9-watch-complication
```

### 4. Implement the story

- Implement **only what the story's acceptance criteria require** — keep scope tight.
- Follow [`docs/project-context.md`](docs/project-context.md) and [`AGENTS.md`](AGENTS.md): layer boundaries, Zod-as-source-of-truth, client-side UUIDs, ISO-8601 UTC dates, transactional DB writes, the `logger` wrapper, etc.
- **Add/extend tests** co-located with the source (`Foo.tsx` → `Foo.test.tsx`). New behavior needs new tests.
- For libraries, consult the official docs (Context7 / Expo docs) and install with `npx expo install <pkg>` — **not** `yarn add` — for Expo-managed packages.

### 5. Keep commits atomic and conventional

Commit small, logical units using [Conventional Commits](#commit-conventions). Reference the story where relevant.

### 6. Pass the quality gates locally

The pre-push hook runs these — plus the rest of the [quality gates](#quality-gates-never-bypass) — automatically, but you can run them yourself:

```bash
yarn lint
yarn format:check   # or: yarn format  (to fix in place)
yarn typecheck
yarn test           # or: yarn test:all  (adds watchOS + fastlane helper tests)
yarn test:fastlane  # fastlane/Fastfile release helpers (needs `bundle install` once)
```

**Never use `--no-verify`.** If a gate fails, fix it.

### 7. Update sprint status

Move the story to `review` in [`sprint-status.yaml`](docs/sprint-artifacts/sprint-status.yaml) — `bmad-build` does this when its run ends. Its spec stays at `in-review` until the PR merges: in this repository `done` means merged, and the merge automation sets it.

### 8. Request a code review

Push your branch and request review. The project favors a **fresh-context review** (a different reviewer/agent than the author) against the [review checklist](#code-review--pull-requests). Address feedback with focused follow-up commits and re-request review until approved.

### 9. Open the Pull Request

Open a PR following the [PR requirements](#code-review--pull-requests). **Do not merge your own PR** — a maintainer reviews and merges. After merge, the story is marked `done`; once an epic completes, a retrospective is run.

---

## Branching Conventions

Branch from `main` with a descriptive, prefixed name. Where a story exists, include its id:

```
feature/<story-id>-<short-description>     # new feature / planned story
fix/<short-description>                     # bug fix
refactor/<short-description>                # behavior-preserving refactor
docs/<short-description>                     # documentation / specs
chore/<short-description>                    # tooling / config / maintenance

# examples
feature/5-9-watch-complication
fix/barcode-scanner-crash
docs/contributing-guide
chore/upgrade-ci-node
```

| Prefix      | Use for                                                   |
| ----------- | --------------------------------------------------------- |
| `feature/`  | New features or planned stories                           |
| `fix/`      | Bug fixes                                                 |
| `refactor/` | Refactors with no functional change                       |
| `docs/`     | Documentation & spec updates                              |
| `chore/`    | Tooling, config, or maintenance changes (no product code) |

---

## Commit Conventions

Use **[Conventional Commits](https://www.conventionalcommits.org/)**. Each commit should be small, focused, and self-contained.

```
<type>(<scope>): <short summary>

- what changed and why
- acceptance criteria addressed (e.g. AC2)
```

**Allowed types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.

Example:

```
feat(watch): render barcode complication on the watch face (Story 5.9)

- add ComplicationProvider entry for the active card
- map card color to complication tint
- covers AC1, AC2
```

---

## Quality Gates (never bypass)

Quality is enforced at three levels. **All must pass — bypassing them is forbidden.**

| Gate                    | When                                | What runs                                                                                        |
| ----------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| **pre-commit**          | `git commit`                        | `lint-staged` → ESLint `--fix` + Prettier on staged files                                        |
| **pre-push**            | `git push`                          | Typecheck, lint, format, drift checks, full test suite                                           |
| **CI — quality**        | every PR & push to `main`           | Everything `pre-push` runs, plus the repo-layout checks, with coverage                           |
| **CI — watchOS**        | PR/push touching watch or iOS paths | Watch contract tests, generated-catalogue + brand-logo mirror sync, watch-target build           |
| **CI — Wear OS**        | PR/push touching `watch-android/**` | JVM unit tests plus `assembleDebug` **and** `assembleRelease` for the standalone Wear OS project |
| **CI — PR conventions** | every PR                            | Conventional-Commit title, branch naming, and spec-first story link (see note below)             |

### Exactly what runs, in order

The pre-push hook and the quality-gates workflow run the **same set of checks in a different order** — CI adds the test-layout check, the fastlane helper tests, and collects coverage. If you add or remove a check, update both the file and this list.

> **Why the fastlane tests are CI-only.** They need Ruby and the bundled fastlane gem, and `.bundle/config` sets `BUNDLE_PATH: ./bundler`, which is **per-checkout and gitignored** — so a fresh git worktree has no gems until someone runs `bundle install`. In pre-push that would fail every push from a new worktree, for a suite that guards one directory. Run it by hand with `yarn test:fastlane` when you touch `fastlane/Fastfile`.

**pre-push** ([`.husky/pre-push`](.husky/pre-push)) — stops at the first failure:

1. `yarn typecheck`
2. `yarn tokens:check`
3. `yarn icons:check`
4. `yarn frames:check`
5. `yarn wear:catalogue:check`
6. `yarn check:build-path-filters`
7. `yarn lint`
8. `yarn check:native-patches`
9. `yarn check:native-strings`
10. `yarn format:check`
11. `yarn test`

**CI — quality** ([`ci-quality-gates.yml`](.github/workflows/ci-quality-gates.yml)):

1. `yarn check:native-patches`
2. `yarn check:native-strings`
3. `yarn lint`
4. `yarn format:check`
5. `yarn typecheck`
6. `yarn tokens:check`
7. `yarn icons:check`
8. `yarn frames:check`
9. `yarn wear:catalogue:check`
10. `yarn check:no-tests-folders`
11. `yarn check:build-path-filters`
12. `yarn check:story-catalogue-sync`
13. `yarn test:coverage`

Plus a second, parallel job in the same workflow — `fastlane-gates` — which sets up Ruby and runs `bundle exec ruby fastlane/Fastfile.test.rb`. It is a separate job so the Node-only gate above does not pay for a Ruby toolchain on every run. It guards `fastlane/Fastfile`'s release helpers, above all the Wear-track preflight: `available_play_tracks` swallows its own errors and returns `nil`, and `nil` means "cannot verify, carry on" — so anything that breaks that lookup silently disarms the preflight without failing a build. Three nightly builds shipped phone-only releases before it existed.

**CI — watchOS** ([`watchos-tests.yml`](.github/workflows/watchos-tests.yml)) is a **separate, path-filtered workflow** — it runs only when `targets/watch/**`, `catalogue/**`, `targets/watch-widget/**`, `watch-ios/**`, `ios/**`, `app.json`, `plugins/**`, `fastlane/Fastfile`, the colour tokens (`tokens/color.json`, `shared/theme/tokens.generated.ts`), or the workflow itself changes (the two middle entries are the generator's inputs — without them a brand-add PR that forgot to regenerate would skip the drift check; the tokens are there because the widget's and watch app's colour pins read them), so most PRs never trigger it. It runs the watch catalogue Jest tests, then `yarn check:catalogue-generated` **against the pristine checkout** — before anything regenerates, which is what makes it a real drift gate — then `expo prebuild`, then builds the watch target via `yarn watch:build:ci` (whose own `pre` hook regenerates the catalogue for the build). Locally, `yarn test:all` covers the watch tests.

**CI — Wear OS** ([`wear-os-build.yml`](.github/workflows/wear-os-build.yml)) is likewise path-filtered, to `watch-android/**` — it runs `./gradlew testDebugUnitTest assembleDebug bundleRelease` on the standalone Gradle project — the JVM unit tests, plus BOTH variants, since Story 16.35 made the release bundle the artifact users receive (the bundle built here is unsigned and uploaded nowhere). Note that the Wear brand-catalogue drift check is **not** here: `yarn wear:catalogue:check` runs in the always-on quality-gates job above, because a PR editing only `catalogue/italy.json` would never trigger a `watch-android/**`-filtered job. Locally, `cd watch-android && ./gradlew assembleDebug`.

**Nightly internal builds** ([`nightly-builds.yml`](.github/workflows/nightly-builds.yml)) ship `main` to TestFlight and Play `internal` every night — **but only when something that can reach a binary has changed**. That definition lives in [`.github/build-path-filters.json`](.github/build-path-filters.json) and is the same one `ios-release.yml` and `android-release.yml` duplicate into their `on.push.paths`; `yarn check:build-path-filters` fails when they disagree. **A change outside that set produces no nightly build** — if you add a new source directory, add it to the config in the same PR. Run one by hand from Actions → Nightly Internal Builds (`dry_run: true` builds everything and uploads nothing). See [docs/cicd.md](docs/cicd.md#nightly-internal-builds).

The **PR conventions** check ([`pr-conventions.yml`](.github/workflows/pr-conventions.yml)) fails the PR if the title isn't a Conventional Commit, the branch doesn't use an allowed prefix, or a **code change** references no story. `docs:`/`chore:` titles and catalogue- or `design`-labelled PRs are exempt from the story requirement (the `design` label covers token/visual polish — see [Design / UI Changes](#design--ui-changes)).

🚫 **`--no-verify` is strictly forbidden** for both `git commit` and `git push`. If a hook fails:

1. Read the error.
2. Fix the underlying issue (lint, type error, failing test).
3. Re-run the command.

Do not bypass gates "just this once" — CI will fail anyway, and it keeps shared branches green for everyone.

---

## Coding Standards

The authoritative rules are in [`docs/project-context.md`](docs/project-context.md) and [`AGENTS.md`](AGENTS.md). Highlights:

- **TypeScript, strict mode** for all new code. No `any` escapes without justification.
- **`const` arrow functions** everywhere (including exported/async) — no `function` declarations.
- **Layer boundaries** (ESLint-enforced): `app → features → shared → core` (+ `catalogue`). No cross-feature imports, no `core → features` imports.
- **Route files re-export only** — no `useState`/`useEffect`/business logic in `app/`.
- **Zod schemas are the source of truth** for data types.
- **Client-side UUIDs**, **ISO-8601 UTC** date strings, **all JSON fields present** (`null`, never omitted).
- **Transactional DB writes** (`withTransactionAsync`); use the `logger` wrapper, not `console.log`.
- **Tests co-located** with source; cross-platform fixtures live in `test-fixtures/`.
- **Apple Watch is read-only for card _data_** — never add card create/edit/delete/favourite paths to the watch. (It MAY emit `CARD_USED` usage events, which the phone applies commutatively — usage telemetry is not a card-data mutation. See ADR-2026-06-09-001.)
- **UI:** respect safe-area insets for edge controls; avoid `Pressable` `style={({pressed}) => …}` callbacks (use `onPressIn`/`onPressOut` + state) — see `AGENTS.md` for the rationale.

Run `yarn lint` and `yarn typecheck` to catch most violations automatically.

---

## Code Review & Pull Requests

### Before opening a PR

- [ ] A `ready-for-dev` story exists and its acceptance criteria are met.
- [ ] `yarn lint`, `yarn typecheck`, and `yarn test` all pass locally.
- [ ] New behavior has tests; coverage is not regressed.
- [ ] `sprint-status.yaml` and the story file are updated.

### PR description must include

- **Title:** `feat(scope): description (Story X.Y)` (or appropriate type).
- **Summary** of the changes.
- **Acceptance-criteria checklist** with completed items checked.
- **Test results** (counts / coverage where relevant).
- **Link** to the story and to any review approval.

### Reviewer checklist

- [ ] Follows project conventions, patterns, and layer boundaries.
- [ ] Acceptance criteria are fully satisfied.
- [ ] Test coverage is adequate (new tests for new behavior).
- [ ] No performance, security, or privacy/GDPR regressions.
- [ ] TypeScript types are sound; no unjustified `any`.
- [ ] Edge cases handled; comments/docs are clear and necessary.

### Merging

- **Do not merge your own PR.** A maintainer reviews and merges to `main`.
- **Status update is automated.** When a PR is **merged**, the [`mark-story-done`](.github/workflows/mark-story-done.yml) workflow reads the story referenced in the PR and commits its status → `done` (in both `sprint-status.yaml` and the story file) directly to the default branch, but only for a story that is waiting for the merge (`Status: review` in the body, `status: in-review` in a `bmad-build` spec's frontmatter, or a spec already at `done` while the tracker still says `review`); anything else is left alone. The commit is tagged `[skip ci]` so it doesn't re-run any pipelines. This works for fork PRs too. _(Maintainers can also apply it by hand: `node scripts/mark-story-done.mjs <story-id>`.)_
  - **Consequence for releases:** because that commit is usually `main`'s tip, a bare `git tag && git push --tags` will silently create no workflow run — GitHub applies the skip marker to tag pushes too. Cut releases with `gh release create` instead; see [Why releases are published, not just tagged](docs/cicd.md#why-releases-are-published-not-just-tagged).
- When an epic completes, run a **retrospective** and capture lessons in `docs/sprint-artifacts/`.

---

## Contributing Brand Catalogue Entries

Expanding the brand catalogue is the easiest and most-welcomed way to contribute — and it's how the app grows across the EU.

1. The catalogue source of truth lives in [`catalogue/`](catalogue/) (e.g. `catalogue/italy.json`).
2. Add or correct a brand entry, matching the existing JSON shape and the schema in `catalogue/types.ts`. Keep all fields present.

   **Where a new brand's logo PNGs go:** add the `BrandLogo-<brand-id>.imageset` to `targets/watch-widget/Assets.xcassets` **only**. The imageset must contain a `Contents.json` declaring every PNG it ships — copy an existing `BrandLogo-*.imageset`'s as a template and swap the filenames. Without it Xcode's asset compiler silently drops the image from the build (only a non-fatal "unassigned child" warning), so the watch would claim the brand has a logo and draw an empty circle; the generator refuses that rather than letting it ship. **Read the generator's warnings, not just its exit code:** it also warns when a PNG rasterized to a uniform rectangle — structurally a perfect imageset with no mark in it, which every gate otherwise passes. That happens when the source SVG is subtly broken (the committed `stroili` asset references an undefined `cls-1` class, so it renders blank), and the row then shows a blank disc, which is worse than the initials it replaces. If you see that warning for your brand, fix the SVG before committing the rasterized PNGs. That catalogue is the source of truth; the generator mirrors it into the watch app target, which is what makes the logo appear in the Apple Watch card list. Never hand-copy imagesets into `targets/watch/Assets.xcassets` — the mirror is byte-exact and `--check` will fail on anything it did not write. A catalogue brand with no imageset is fine: the card list falls back to initials. (The complication ships the same artwork but does not draw it. It draws the Cardì mark and the top card's name. Its brand-logo path is retained but dormant; see `targets/watch-widget/WatchComplicationWidget.swift`.)

3. **Regenerate the watchOS catalogue** so the Apple Watch app stays in sync (needs macOS + Xcode):

   ```bash
   yarn watch:catalogue:generate
   ```

   This also regenerates everything derived from the bundled logo assets, for **both** watch targets: the brand-logo catalog (`targets/watch-widget/Generated/BrandLogoCatalog.generated.swift` and `targets/watch/Generated/BrandLogoCatalog.generated.swift`), the watch app's mirror of the resolver (`targets/watch/Generated/BrandLogoCatalog.swift`), and the `BrandLogo-*.imageset` copies in `targets/watch/Assets.xcassets`. CI runs `yarn check:catalogue-generated` to ensure the generated watch sources — imagesets included — match the source, so commit the regenerated output.

4. **Regenerate the Wear OS catalogue** too — it is a separate generated file for a separate app, and forgetting it is the easiest mistake to make here:
   ```bash
   yarn wear:catalogue:generate
   ```
   This rewrites `watch-android/app/src/main/kotlin/com/iferoporefi/myloyaltycards/wear/Generated/Brands.kt`, which is committed on purpose. Pure Node, so it runs anywhere — unlike step 3. `yarn wear:catalogue:check` gates it in pre-push **and** CI; commit the regenerated output.
5. Run `yarn lint && yarn test` (catalogue files have tests, e.g. `catalogue/italy.test.ts`).
6. Open a PR titled `feat(catalogue): add <brand> to <country>`. Catalogue-only PRs are lighter-weight and usually don't need a full story, but please reference an issue if one exists.

---

## Reporting Bugs & Requesting Features

**Bugs** — open a GitHub issue with:

- What you expected vs. what happened.
- Steps to reproduce.
- Platform & version (iOS/Android/watchOS, app version, device/OS).
- Logs/screenshots if available. For watch-sync issues, Console.app traces are especially helpful (watch sync must be verified on a **physical device**, not just by code review).

**Features** — open an issue or discussion describing the problem to solve and the proposed value. Remember: features enter through **planning** (PRD/epic), so this is the first step toward a future story — not a direct PR.

---

## Using the BMAD Agents

You don't have to drive the methodology by hand. BMAD ships agents and skills you can invoke from your AI IDE (Claude Code, Cursor, or GitHub Copilot — all preconfigured under [`_bmad/_config/ides/`](_bmad/_config/)). The skills most relevant to contributors:

| You want to…                          | Skill                                                                                                                                         |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Draft and refine the next story       | `bmad-build <story-key>` — stop at the approval checkpoint                                                                                    |
| Implement a `ready-for-dev` story     | `bmad-build <story-key>` — resumes at implementation (a classic-layout story file is not a spec; it has to be converted first)                |
| Review code against the checklist     | built into `bmad-build` (its review step); ad hoc: `bmad-code-review`                                                                         |
| Review a change yourself, guided      | `bmad-walkthrough`                                                                                                                            |
| Check the tracker or sprint readiness | `bmad-sprint-planning` — readiness gate, `status` and `validate` only ([why](docs/sprint-artifacts/README.md#running-the-bmad-skills-safely)) |
| Add/refine requirements (new scope)   | `bmad-prd` / `bmad-create-epics-and-stories`                                                                                                  |
| Make a system design decision         | `bmad-architecture`                                                                                                                           |
| Handle a mid-sprint scope change      | `bmad-correct-course`                                                                                                                         |
| Close out an epic                     | `bmad-retrospective`                                                                                                                          |

`bmad-build` also has a **one-shot** shortcut for very small changes with no open questions: intent and implementation notes only, no approval checkpoint, a single review layer, and a commit of its own that this repository disables. It is for `chore:` and `docs:` work that has no story; every story takes the full route, so its acceptance criteria are approved before any code. How a story moves from `draft` to `done`, and what sets each status, is tabulated in [`docs/sprint-artifacts/README.md`](docs/sprint-artifacts/README.md#the-story-lifecycle-bmad-build).

---

## Quick Reference

**Story lifecycle:**

```
backlog → ready-for-dev → in-progress → review → done
```

**The loop, in one line:**

```
find/create story → branch → implement (+ tests) → atomic conventional commits
→ pass gates → update sprint-status → code review → PR → maintainer merges → done
```

**Three rules you must not break:**

1. **Spec-first** — no code without a `ready-for-dev` story (or an agreed planning update for new scope).
2. **Never bypass quality gates** — `--no-verify` is forbidden; fix the failure instead.
3. **Don't merge your own PR** — a maintainer reviews and merges.

Welcome aboard, and thank you for helping make checkout friction a thing of the past! 🚀

---
baseline_commit: '4bbfcbd1cd08640a3a80b08f6614744ee6cb8aac'
title: 'Typecheck fails locally after `expo start`, because the generated Expo types narrow `process.env.NODE_ENV`'
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

**Problem:** `yarn typecheck` passes on a clean checkout and fails after `expo start`. Metro writes two git-ignored files -- `expo-env.d.ts` and `.expo/types/**` -- and `tsconfig.json` includes both (`:23-24`). The generated `expo/types` reference narrows `process.env.NODE_ENV` to a literal union, and `test/site-allow-list.test.ts:98` builds a `gitEnv` object whose `NODE_ENV: 'test'` widens to `string`, which no longer satisfies the narrowed type. CI never sees the failure because CI never has the generated files.

**Approach:** Make the test's environment literal satisfy both the narrowed and the unnarrowed type. The fix belongs in the test, not in the tsconfig: the tsconfig's includes are deliberate (Expo's own types are wanted), and excluding them would undo the typing they provide.

**Decisions (pending ifero's approval):**

- **The fix is in the test, not the tsconfig.** `as const` on the literal, or an explicit cast on the object, makes the type satisfy Expo's narrowing and the plain `string` case alike. Widening the tsconfig's `include`/`exclude` would remove typing the project wants.
- **One assertion covers both states.** A test that runs with and without the generated types is impossible in one run, so the fix is written to type-check either way -- a cast, not a narrowing.

## Boundaries & Constraints

**Always:** The change is confined to the test's environment literal (or an equivalent, minimal type-level fix). The test must keep the behaviour it pins: a temp git repository whose hooks must not inherit the real repository's `GIT_DIR`. The literal stays `'test'`.

**Never:** Change `tsconfig.json`'s `include`/`exclude` to hide the generated types. Change the test's behaviour, the temp-repo setup or the `NODE_ENV` value. Add a dependency. Change any other test. Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario           | Input / State                                     | Expected Output / Behavior                                                   | Error Handling |
| ------------------ | ------------------------------------------------- | ---------------------------------------------------------------------------- | -------------- |
| Clean checkout     | No `expo-env.d.ts`, no `.expo/types`              | `yarn typecheck` reports no errors                                           | N/A            |
| After `expo start` | Both generated files present                      | `yarn typecheck` reports no errors                                           | N/A            |
| Test behaviour     | A temp git repo is created and staged by the test | The staging script runs with `NODE_ENV=test` and without `GIT_DIR` inherited | Unchanged      |

</frozen-after-approval>

## Code Map

- `test/site-allow-list.test.ts:94-105` -- the `gitEnv` literal: `Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_')))` plus `NODE_ENV: 'test'`. `Object.fromEntries` widens the value type to `string`, which is what breaks against Expo's narrowed `process.env.NODE_ENV`.
- `tsconfig.json:18-26` -- `include` lists `".expo/types/**/*.ts"` and `"expo-env.d.ts"`; `exclude` lists `".expo"` (which does not affect the explicit includes).
- `.gitignore:5` (`.expo/`) and `:84` (`expo-env.d.ts`) -- both generated files are ignored, which is why CI is green and the local run is not.
- `package.json:17` -- `"typecheck": "tsc --noEmit"`.
- Do not change: the rest of `test/site-allow-list.test.ts`, `tsconfig.json`, `.gitignore`.

## Tasks & Acceptance

**Execution:**

- [ ] `test/site-allow-list.test.ts` -- make the `gitEnv` literal type-check against both the narrowed and the unnarrowed `process.env.NODE_ENV` (`as const` on the literal, or an explicit cast on the object). The `GIT_` filter and the `'test'` value are unchanged.
- [ ] A note in the test's header comment recording why the cast is there (the generated Expo types narrow `NODE_ENV`; CI does not have them), so a future reader does not "simplify" it away.
- [ ] Verify with both states: `yarn typecheck` on a clean checkout, and again after `expo start` has written `expo-env.d.ts` and `.expo/types`.

**Acceptance Criteria:**

- Given a clean checkout, when `yarn typecheck` runs, then it reports no errors.
- Given a checkout where `expo start` has run, when `yarn typecheck` runs, then it reports no errors.
- Given either state, when the site allow-list test runs, then the temp git repository is created with `NODE_ENV=test` and without the outer repository's `GIT_*` variables.

## Design Notes

This is a local-only defect with a two-line fix, and it is worth a story because it makes the typecheck gate unreliable exactly where it is run most often -- on a developer's machine after a normal `expo start`. The gate must mean the same thing everywhere.

The cast is the right shape: the test genuinely wants a `NODE_ENV` of `'test'` and genuinely wants the rest of the environment filtered; the type system only objects because `Object.fromEntries` widens.

## Implementation Notes

- Source issue: #312, filed from
  `docs/sprint-artifacts/stories/16-45-signout-keep-or-erase-cards.md` section "Found, not fixed".
- The 16.45 story's own verification records the workaround it used:
  _"Typecheck was run after setting aside the Metro-generated files above"_ -- the story's final
  verification could not run `yarn typecheck` in the state a developer is normally in.
- The exact generated declaration could not be read in the environment this spec was drafted in
  (`node_modules/` was absent and `expo-env.d.ts` / `.expo/types` are git-ignored and not present), so
  the diagnosis is from the tsconfig includes and the test's literal rather than from the generated
  `.d.ts` itself. The fix (a cast or `as const`) is correct under either shape of the narrowing and must
  be verified in both states before the story closes.
- `expo/types` is Expo's own generated route-types reference; it is written by `expo start` and by
  `expo customize`, and it narrows `process.env.NODE_ENV` for the whole program.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors, both before and after `expo start`
- `yarn lint` -- expected: no errors
- `yarn format:check` -- expected: clean
- `yarn test` -- expected: all suites pass

**Manual checks (if no CLI):**

- Run `npx expo start` (or `npx expo customize`) so `expo-env.d.ts` and `.expo/types` exist, then run
  `yarn typecheck` and confirm it is clean.

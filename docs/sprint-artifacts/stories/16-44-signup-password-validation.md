---
baseline_commit: 'c5cce6fd4429229e85f4ee72d427bc772c60593f'
title: 'Sign-up accepts passwords the server rejects, and says only "An unexpected error occurred"'
type: 'bugfix'
created: '2026-11-08'
status: 'in-review'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The hosted Supabase project requires a password with a lowercase letter, an uppercase letter, a digit and a symbol (min 6). The app checks only "8+ characters, one letter, one digit", and states that rule only as the placeholder, which vanishes on the first keystroke. So `password1` passes on the device, the server rejects it with `weak_password`, and Create Account (and Set New Password) shows the generic "An unexpected error occurred".

**Approach:** One shared rule in `core/auth/validation.ts` that is at least as strict as the hosted policy, stated under the password field while the person types, enforced before submit on both screens. A `weak_password` the server still returns gets its own banner message, and the strength meter never rates a rule-failing password above Weak.

**Decisions (ifero, 2026-11-08):**

- **Minimum length stays 8**, stricter than the server's 6. The rule is: at least 8 characters, an ASCII lowercase letter, an ASCII uppercase letter, a digit and a server symbol.
- **The rule shows as one caption line** under the password field on both screens, e.g. "At least 8 characters, with upper and lower case letters, a number and a symbol.", in `captionMd` / `textSecondary`, visible from the moment the screen opens. While the field shows its red error, the error takes its place. The strength meter stays below.

## Boundaries & Constraints

**Always:** One rule definition, used by both screens, the meter and the copy. The symbol set is the server's own (GoTrue's `!@#$%^&*()_+-=[]{};'\:"|<>?,./` + backtick + `~`); letters and digits are ASCII, as the server checks them. English and Italian copy change together. Request failures stay in the form's banner (the form pattern: a failed request never reddens a field). Existing tests that pin the old rule or old copy are updated, not deleted.

**Never:** Change the hosted or local Supabase auth config (`supabase/config.toml` is out of scope). Touch Sign In (it must keep accepting any existing password). Add a dependency. Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario                     | Input / State                                          | Expected Output / Behavior                                        | Error Handling      |
| ---------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------- | ------------------- |
| Compliant                    | `Passw0rd!` + matching confirm + consent               | Request sent                                                      | N/A                 |
| Old-rule pass, new-rule fail | `password1`                                            | Not sent; password field shows the rule; meter Weak               | Field error         |
| Missing each class           | `PASSWORD1!`, `password1!`, `Password!!`, `Password12` | Not sent; rule error                                              | Field error         |
| Non-server symbol only       | `Password1€`                                           | Not sent (server would reject)                                    | Field error         |
| Too short                    | `Pa1!`                                                 | Not sent                                                          | Field error         |
| Server still rejects         | signUp / updateUser returns `code: 'weak_password'`    | Banner says the password is too weak and names the rule           | Banner, not generic |
| Empty field                  | `''`                                                   | Hint visible; no meter; "Password is required." only after submit | Field error         |

</frozen-after-approval>

## Code Map

- `core/auth/validation.ts` -- `isValidPassword` (line 25): the regex to replace; also the place for the exported symbol set / per-requirement checks. Tests: `core/auth/validation.test.ts` (cases at 50-74 pin the old rule; `P@ssw0rd!` stays valid).
- `features/auth/CreateAccountScreen.tsx` -- `validate` (104-105) uses `isValidPassword` + `auth.validation.passwordRule`; `mapCreateAccountErrorMessage` (56-79) has no `weak_password` branch; password field + meter in `passwordGroup` (229-243).
- `features/auth/NewPasswordScreen.tsx` -- same rule at 82-83; `mapUpdateError` (61-75) takes only `message`, so it must also receive `result.error.code`; field + meter at 169-180.
- `features/auth/components/PasswordStrengthIndicator.tsx` -- `getPasswordStrength` (15-25): return `weak` whenever `isValidPassword` fails; tests in `PasswordStrengthIndicator.test.tsx:37-48`.
- `shared/supabase/auth.ts` -- `toAuthError` (53-66) already passes Supabase's `code` through; `signUp` (147) and `updatePassword` (384) need no change.
- `shared/components/ui/TextField.tsx` -- `FieldError` (95) and its `error` style (294): the caption's spacing/typography reference. TextField has no helper-text prop; render the hint in the screen's `passwordGroup` (or add an optional `hint` prop to `PasswordInput` if both screens share it), hidden while `error` shows.
- `shared/i18n/locales/en.ts` / `it.ts` -- `placeholders.newPassword` (356), `accessibility.passwordRuleHint` (364), `validation.passwordRule` (380); add a `createAccount.weakPassword` and `newPassword.weakPassword` (or one shared `validation.passwordTooWeak`).
- `features/auth/CreateAccountScreen.test.tsx:248-253`, `NewPasswordScreen.test.tsx:194` -- pin the old placeholder and the "no caption" decision; update.
- Do not change: `SignInScreen`, `PasswordInput`'s eye, `FormScreen`'s banner/focus behaviour.

## Tasks & Acceptance

**Execution:**

- [x] `core/auth/validation.ts` -- rule: min 8, ASCII lower, ASCII upper, digit, one server symbol -- one definition at least as strict as the server.
- [x] `core/auth/validation.test.ts` -- every matrix row's input, plus `€`-only and length boundary.
- [x] `features/auth/components/PasswordStrengthIndicator.tsx` (+ test) -- rule-failing password is always `weak`.
- [x] `shared/i18n/locales/en.ts`, `it.ts` -- a caption string for the rule; `validation.passwordRule` and `accessibility.passwordRuleHint` restate the same rule; `placeholders.newPassword` becomes a neutral prompt (the caption now carries the rule, so it is not stated a fourth way); weak-password banner copy.
- [x] `features/auth/CreateAccountScreen.tsx` (+ test) -- render the caption (hidden while the field errs); map `weak_password` (code, or Supabase's "Password should" message when no code) to its message.
- [x] `features/auth/NewPasswordScreen.tsx` (+ test) -- same, passing `code` into `mapUpdateError`.

**Acceptance Criteria:**

- Given Create Account or Set New Password, when the screen opens and while the person types, then the password rule is visible under the password field without relying on the placeholder.
- Given a password that fails any part of the rule, when the primary action is pressed, then no request is sent and the password field shows the rule as its error.
- Given the server returns `weak_password`, when the request completes, then the banner shows the weak-password message, not the generic one.
- Given any password that fails the rule, when the meter renders, then it reads "Weak".
- Given the Italian locale, when either screen renders, then the rule, error and banner copy are Italian.

## Implementation Notes

- The rule lives in `core/auth/validation.ts` as `PASSWORD_MIN_LENGTH`, `PASSWORD_SYMBOLS` and `getUnmetPasswordRequirements`; `isValidPassword` is "nothing unmet". The copy takes the length from `PASSWORD_MIN_LENGTH` through `{{min}}`.
- The caption is a new optional `hint` prop on `PasswordInput` (testID `<field>-hint`), so both screens share it; without `hint` the component renders as before. It stays readable by screen readers, because the spoken hint is lost when hints are turned off.
- The field error alone names example symbols ("such as ! ? # or @"), so someone who typed `€` learns why it did not count. The caption and banner keep the plain wording.
- `weak_password` is matched by code, or by Supabase's "Password should" message when an older server sends no code. Server failures stay in the banner; no field turns red.
- The strength meter is Weak until the rule is met, then Fair below 12 characters and Strong from 12. The old "has a special character" test is gone, because every valid password has one.

- **Device check (2026-11-08), iPhone 17 Pro simulator, iOS 26.4, Italian locale, Debug build with Metro from this branch.** Create Account shows the caption under the password field from the start; typing brings the Weak meter under the caption; pressing Crea un account with a rule-failing password shows the red rule error in the caption's place, with the meter still Weak. Screenshots are in `/tmp/claude-501/16-44-shots/` (outside the repo).
- **Unchecked on a device:** dark mode (the app followed its own light appearance although the simulator was in dark mode; `PasswordInput.test.tsx` covers the caption in both themes); Set New Password (needs a signed-in recovery session); Android (no Android build of this branch on the host). Typing into the secure field on the simulator dropped characters, so the exact `password1` entry was not reproduced there; the screen tests pin it.

- **Review loops.** Code review round 1: approved, no comments. QA round 1: one finding, fixed: no Create Account test pinned that a coded error is never read by its message (Set New Password had one). Added a `same_password` test to `CreateAccountScreen.test.tsx`; it fails when the `!code` guard is loosened back to `includes`, and passes as written. A test-only change, so the device check stands; both loops run again.

- **Review loops, round 2.** Code review: approved, no comments. QA: approved, no comments. Both loops closed.

### Found, not fixed

- **Passwords over 72 bytes still get the generic error.** GoTrue (bcrypt) refuses them with a message the app does not map, and the meter can rate them Strong. Already true before this story; a byte-length cap plus its copy is a separate change.
- **The local stack does not match the hosted policy.** `supabase/config.toml` has `minimum_password_length = 6` and `password_requirements = ""`, so a local run never returns `weak_password`. Aligning it was ruled out of scope by this story's Never list.

## Spec Change Log

## Review Triage Log

Pass 1 (blind, edge-case, verification-gap, project-conventions):

| #   | Layer            | Finding                                                                                                                                            | Verdict | Route / evidence                                                                                                                                                |
| --- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | edge             | `includes('password should')` matches GoTrue's `same_password` message ("New password should be different…"), so Set New Password shows "too weak" | medium  | patch: `same_password` is a real auth-js `ErrorCode`; fall back to the message only without a code, `startsWith`                                                |
| 2   | edge             | Same over-broad fallback on Create Account for an unrelated message with another code                                                              | low     | patch, same root cause as 1                                                                                                                                     |
| 3   | verification-gap | Nothing pins `signUp`/`updatePassword` carrying `code` through `toAuthError`                                                                       | medium  | patch: add one error-path test to each describe in `shared/supabase/auth.test.ts`                                                                               |
| 4   | blind            | `PASSWORD_SYMBOLS` names no source, so drift goes unnoticed                                                                                        | low     | patch: comment naming GoTrue's requirement and the hosted policy date                                                                                           |
| 5   | edge, blind      | Passwords over 72 bytes get the generic error; meter rates them Strong                                                                             | medium  | defer: pre-existing (the old rule had no maximum either)                                                                                                        |
| 6   | blind            | Local `supabase/config.toml` policy differs from hosted                                                                                            | low     | defer: the frozen Never list excludes config changes                                                                                                            |
| 7   | conventions      | Hint style uses RN `StyleSheet` + inline `theme.textSecondary`, not Unistyles                                                                      | low     | rejected: `PasswordInput`'s existing styles and its sibling `PasswordStrengthIndicator` use the same pattern; converting the file is beyond a direct correction |
| 8   | blind            | `weakPassword` banner restates the composition rule, which a leaked-password rejection would already meet                                          | low     | rejected: the frozen matrix row requires the banner to name the rule, and the hosted policy given has no leaked-password check                                  |
| 9   | blind            | Hint hides on the "Password is required." error                                                                                                    | low     | rejected: the frozen decision says the error takes the caption's place                                                                                          |
| 10  | blind            | UI never says which requirement is unmet; ASCII-only letters not stated                                                                            | low     | rejected: the frozen decision chose one caption over a checklist; the error names example symbols                                                               |
| 11  | blind            | Caption not linked to the input for screen readers, rule read twice                                                                                | low     | rejected: deliberate (Implementation Notes), the spoken hint is lost when hints are off                                                                         |
| 12  | blind            | Mapping and `weakPassword` copy duplicated across the two screens                                                                                  | low     | rejected: follows the screens' existing per-screen mapping (`networkError`, `genericError` are duplicated the same way)                                         |
| 13  | blind            | Meter is now length-only once the rule is met                                                                                                      | low     | rejected: every rule-meeting password already has all four classes; length is the remaining signal                                                              |
| 14  | blind            | Diff omits sprint-status and the spec; statuses disagree                                                                                           | false   | the DIFF FOR REVIEW fact excludes both by design; spec `in-review` with tracker `in-progress` is the documented state during review                             |
| 15  | blind            | "Choose a password" placeholder echoes Set New Password's subtitle; no Storybook story for `hint`                                                  | low     | rejected: cosmetic; `PasswordInput` has no Storybook story to extend                                                                                            |

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors
- `yarn lint` -- expected: no errors
- `yarn format:check` -- expected: clean
- `yarn test` -- expected: all suites pass

**Manual checks (if no CLI):**

- On an iOS simulator and an Android emulator, light and dark: Create Account and Set New Password show the rule while typing; `password1` is blocked with the rule error and a Weak meter.

---
title: 'Story 22.9: Authentication — the six account screens on the Cardì form pattern'
type: 'feature'
created: '2026-10-20'
status: 'done'
route: 'dispatch'
review_loop_iteration: 1
baseline_commit: 'f42f1d6d915b693b9d21b724880818ecc1267620'
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The account screens still draw the pre-Cardì app:

- `AuthScreenLayout` centres each screen, with its button inside the scroll, under the root stack's
  native header and its MaterialIcons back. Forgot password draws a second back of its own, and no
  mark;
- a failed request is the tinted `ErrorBanner` with an icon, and sign in also reddens both fields
  (Story 22.6, Found, not fixed 9). A wrong or expired code reddens the code field, and a resent
  code is reported in a tinted box with an icon;
- create account ignores its button until consent is ticked, and the code screen until eight digits
  are typed. Neither looks disabled, and neither says why;
- the strength meter judges in colour (`error`, `warning` and `success` on one bar), so in light
  mode fair and strong are the same ink;
- the password's eye and the code screen's notices are MaterialIcons, and no link acknowledges a
  press.

**Approach:** Move the six onto `FormScreen` (Story 22.6), as `cardi-design-system.md` § _Forms_
rules ("the auth screens move onto it in Story 22.9"). Inside that shape, draw the content of
`docs/design/cardi/frames/cardi-auth-frames.html` frames A–F and `stitch-prompts-auth.txt`, in light
and dark: the mark, the heading, the subtitle, the fields, the links, the counting meter, the single
code field and the request banner. `cardi-design-system.md` wins any conflict, and the frames beat
the prompts. Extend `FormScreen` for what auth needs, and record every ruling in the design system.

## Boundaries & Constraints

**Always:**

- **The six frames:**
  - A, sign in: `/sign-in`;
  - B, create account: `/create-account`;
  - C, forgot password: `/forgot-password`;
  - D, the code: `/verify-email` and `/recovery-otp`, one component;
  - E, new password: `/new-password`;
  - F, a failed request, on every screen that sends one.
- **Keep what shipped:**
  - each screen's calls, success navigation and params, its links' routes, and every way in
    (welcome, mode selection, settings, the guest banner);
  - the validation rules:
    - email required and valid;
    - sign in's password required;
    - the password rule (at least 8 characters, a letter and a digit) on create account and new
      password;
    - confirm required and matching;
    - consent required to create an account;
  - the code:
    - 8 digits, digits only, and a formatted paste of up to 16 characters accepted;
    - the submit at the 8th digit and its double-submit guard;
    - focus on mount, and one-time-code autofill;
    - the 60 s resend cooldown: its absolute expiry survives a remount, an expired code unlocks it,
      a failed resend leaves it, and a successful one clears the field and restarts it;
  - `getPasswordStrength`'s rule and its three words. Create account shows the meter once a password
    is typed; new password always shows it;
  - each failure's message, mapped as today;
  - consent: `setConsentGiven()` after `signUp` succeeds, and the policy link to `/privacy-policy`;
  - `AppIconHeader`'s mark: `cardi-mark-inline.svg` at 40, in its 80 ink circle (Story 20.4). The
    frames' hand-built ì is a stand-in;
  - every testID the Code Map keeps, and the wording of every string that stays. Each new string
    goes in `en.ts` and `it.ts`.
- **House rules:**
  - theme roles only, with no hex literal in a component. `shared/theme/tokens.generated.ts` wins
    over `docs/project-context.md`'s pre-rebrand colour list;
  - type from `TYPOGRAPHY`;
  - Lucide icons, each imported from `lucide-react-native/icons/<name>`;
  - every tappable at least `TOUCH_TARGET.min`. The one exception is the consent sentence's inline
    policy link, as today;
  - no `Pressable` style callback. Pressed visuals come from `onPressIn`/`onPressOut` state;
  - safe-area insets on every edge control;
  - `const` arrow functions.
- **Library APIs.** Check every API against Context7 or the installed source in `node_modules/`
  before using it; nothing is implemented from memory. The pinned versions are:
  - Expo SDK 55, React Native 0.83.6, React 19.2.0, expo-router 55.0.13;
  - react-native-safe-area-context 5.6.2, react-native-unistyles 3.2.5, lucide-react-native 1.52.0.

**Decided (ifero, 2026-10-21):**

- **The screen's top** (decision 1): a back-only header, with the brand block leading the body. The
  header row holds only the back chevron, and only where there is a screen beneath; new password
  after recovery has none, and starts at the top inset. The body opens with the mark, the 24pt
  heading, announced as the heading, and the subtitle, as frames A–E draw them.
- **The way-out link** (decision 2): in the footer, under the primary.
- **The way-out link at the largest sizes** (decision 3, 2026-10-21, from step 3's device check):
  from a font scale of 1.5, the threshold settings and What We Collect already use, the way-out
  link leaves the footer and closes the body instead, after the last field and scrolling with it.
  Below 1.5, decision 2 holds as built.
- **Spec size:** kept whole, well over the 1,600-token target.

**Never:**

- Commit, push, or change `docs/sprint-artifacts/sprint-status.yaml` or any other tracker file. The
  orchestrator owns all three.
- Change any of these:
  - `shared/supabase/auth.ts`, `core/` (validation, consent, guest migration), or which message a
    failure maps to;
  - how card setup and card edit draw and behave. `FormScreen`'s existing callers stay as they are;
  - `Button`, `PrimaryActionFooter` or `RequestErrorBanner`, or how `ScreenHeader` draws for its
    existing callers;
  - the root stack's `screenOptions`, or any route's options other than the six auth routes';
  - Home, `GuestModeBanner`, `MigrationBanner`, `useGuestMigration`, settings, or the watch apps;
  - `auth.verifyEmail.goBack`, which the barcode screen borrows.
- Draw a control disabled, or ignore a press without saying why.
- Tint, box or add an icon to a message; colour the meter by strength; redden a field for a failed
  request; show a toast for a failed request; add a sign-in method.

## I/O & Edge-Case Matrix

| Scenario       | Input / State                                                                      | Expected Output / Behavior                                                                                                                                                                                                                                 | Error Handling                                                                 |
| -------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Sign in        | `/sign-in`, light or dark                                                          | Frame A: the mark, "Welcome Back" and its subtitle; EMAIL; PASSWORD with its eye; "Forgot password?" under it, at the end; in the anchored footer, Sign In with "Don't have an account? Create one" under it                                               | N/A                                                                            |
| Create account | `/create-account`                                                                  | Frame B: the mark, "Create Account" and "Join Cardì"; EMAIL; PASSWORD, with the meter once something is typed; CONFIRM PASSWORD; the consent row, unticked; in the footer, Create Account with "Already have an account? Sign in" under it                 | N/A                                                                            |
| Forgot         | `/forgot-password`                                                                 | Frame C: the mark, "Forgot Password?" and its subtitle; EMAIL; in the footer, Send Reset Code with "Back to Sign In" under it. One back chevron, not two                                                                                                   | N/A                                                                            |
| Code           | `/verify-email` or `/recovery-otp` with a valid email                              | Frame D: the mark, "Verify your email" or "Reset your password", and the subtitle with the address in strong; the code field, labelled and focused; "Resend in 1:00" counting down beneath it; in the footer, Confirm with "Wrong email? Go back" under it | an invalid email param redirects as today and draws nothing                    |
| New password   | `/new-password`                                                                    | Frame E: the mark, "Set New Password" and its subtitle; NEW PASSWORD with the meter; CONFIRM PASSWORD; Update Password alone in the footer                                                                                                                 | N/A                                                                            |
| Validation     | the primary pressed with a field invalid, consent unticked, or fewer than 8 digits | each invalid field shows its message in the error idiom, and consent's sits under its row; the first invalid text field takes focus; the button stays enabled, and nothing is sent                                                                         | after that press, the fields re-validate as the user types, clearing or erring |
| Busy           | the primary pressed on a valid form, or the 8th digit typed                        | the button keeps its fill and shows a spinner, named for its action ("Signing in..."); further presses do nothing; nothing dims                                                                                                                            | N/A                                                                            |
| Request failed | a call fails                                                                       | Frame F: one banner with today's message, 16 above the first field, brought into view and announced; no field reddens; no toast; the button stays enabled                                                                                                  | the next request clears it while it runs; an expired code also unlocks resend  |
| Strength       | a password typed on create account or new password                                 | one, two or three of three segments fill for weak, fair or strong, so the fill spans a third, two thirds or all of the track, with the word beside it; the same colour at every strength; read as one element, "Password strength: Fair"                   | N/A                                                                            |
| Resend         | the cooldown has run out, then "Resend code" pressed                               | as today. Success clears the field, focuses it, restarts the cooldown and shows "Code resent…" as one plain line                                                                                                                                           | a failure shows the banner, and the cooldown stays                             |
| Keyboard       | a field focused                                                                    | the footer rests on the keyboard, and the focused field, with its label, is scrolled into view above the footer                                                                                                                                            | N/A                                                                            |
| Back           | the header's back, Android's back or the iOS swipe                                 | the header row holds only the back chevron, with no title; each returns to the screen beneath, as today. New password after recovery has nothing beneath it: no header row, and the body starts at the top inset                                           | N/A                                                                            |
| Large text     | the largest accessibility size                                                     | the mark block, the labels, fields, meter, links, banner and footer wrap or grow, never clip; the body scrolls. From a font scale of 1.5 the way-out link closes the body, after the last field, instead of sitting in the footer (decision 3)             | N/A                                                                            |
| Screen reader  | VoiceOver or TalkBack                                                              | the heading is announced as a heading; every field keeps its name and hint; the eye is "Show password" or "Hide password"; the consent box is a checkbox with its state; the meter is one element; the banner is announced                                 | N/A                                                                            |

</frozen-after-approval>

## Code Map

- `shared/components/ui/FormScreen.tsx` (+ `FormScreen.test.tsx`, `FormScreen.stories.tsx`) -- the
  form pattern (Story 22.6).
  - Props (`:22-59`): `title` and `onBack`, both required; `primaryAction` (`label`, `onPress`,
    `busy`, `testID`); `requestError`; `bodyTestID`; `testID` (default `form-screen`), whose
    suffixes name the parts (`-back`, `-header`, `-title`, `-banner-slot`, `-banner`, `-fields`,
    `-footer`).
  - It draws a `SafeAreaView` on all four edges, `ScreenHeader`, one `KeyboardAvoidingView` with
    `padding` (on Android only while the keyboard is up, `:84-99`, `:170-174`), a `ScrollView` padded
    24 with `keyboardShouldPersistTaps="handled"`, the banner first and 16 above the fields
    (`:182-186`), the fields 32 apart, and `PrimaryActionFooter insetBottom={false}` holding one
    large primary `Button` (`:192-207`).
  - The busy name is fixed to `sharedUi.formScreen.saving`, "Saving..." (`:200-202`). It scrolls to
    y 0 whenever `requestError` becomes truthy (`:149-154`). Its keyboard note assumes the route
    hides the native header (`:115-120`).
  - Its suite pins all of this. Its callers, `features/add-card/screens/CardSetupScreen.tsx` and
    `features/cards/components/CardForm.tsx`, must draw and behave unchanged.
- `shared/components/ui/ScreenHeader.tsx` -- `title` and `onBack` required; the back is
  `HeaderIconButton` with Lucide `chevron-left`, named `sharedUi.screenHeader.backAccessibilityLabel`;
  the title `bodyLgStrong`, centred, `role=header`; a 48 spacer on the right.
- `shared/components/ui/TextField.tsx` (+ test) -- the field (Story 22.6).
  - Props (`:22-61`): `ref` as a prop; `error`, drawn through the exported `FieldError` (`captionMd`
    in `error`, 4 below, a polite live region, a queued iOS announcement) as `${testID}-error`;
    `hasError`; `disabled`, which also fills it `backgroundSubtle` (`:185`); `secureTextEntry`,
    `keyboardType`, `autoCapitalize`, `autoComplete`, `autoCorrect`, names and hints;
    `rightAdornment`, inside the box, with the input padded 52; `trailing`; `returnKeyType`,
    `onSubmitEditing`, `maxLength`; and `mono`, `monoCode` for the value only (`:181-182`).
  - Not passed through: `textContentType`, `selectTextOnFocus`, `textAlign`. The input is at least
    `TOUCH_TARGET.min` tall (`:259`). `FieldLabel` is `labelBold`, uppercased by style.
  - It styles with Unistyles (`useUnistyles`), and its suite's Unistyles mock renders light only.
- **Autofill and paste** (`node_modules/react-native/Libraries/Components/TextInput/TextInput.js`):
  `autoComplete="one-time-code"` alone becomes Android's `sms-otp` (`:847`) and, while
  `textContentType` is unset, iOS's `oneTimeCode` (`:887`, `:934-950`). `maxLength` is enforced
  natively, so 16 lets a formatted paste reach the sanitiser.
- **Scrolling a focused field into view.** Nothing in the app does it today.
  - Fabric's iOS `ScrollView` moves a focused input only when `automaticallyAdjustKeyboardInsets` is
    on, and then above the keyboard's top, not above a footer that rides it
    (`node_modules/react-native/React/Fabric/Mounting/ComponentViews/ScrollView/RCTScrollViewComponentView.mm:186-240`).
  - `scrollResponderScrollNativeHandleToKeyboard` assumes a full-screen scroll view
    (`node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js:1020-1060`).
- `features/auth/components/AppIconHeader.tsx` -- the mark: `cardi-mark-inline.svg`, 40 × 40, in an
  80 circle of `IDENTITY_COLORS.ink` in both schemes, with `marginBottom: 48`. Its testIDs are
  `auth-app-icon` (the SVG) and `auth-app-icon-circle`. Its comment explains the ink circle; keep
  it. No suite of its own.
- `features/auth/components/AuthScreenLayout.tsx` -- the centred shape. It goes.
- `features/auth/components/ErrorBanner.tsx` (+ test) -- tinted, with an icon. It goes;
  `RequestErrorBanner` replaces it.
- `features/auth/components/AuthLink.tsx` -- `prefixText?`, `actionText`, `onPress`, `testID`,
  `accessibilityLabel`, `accessibilityHint?`. A 48-tall `role=button` row: the lead-in in `bodyMd`
  `textSecondary`, the action in `bodyMdStrong` `link`, and no press feedback. No suite of its own.
- `features/auth/components/PasswordInput.tsx` (+ test) -- a `TextField`, secure until toggled. The
  toggle is `${testID}-toggle`, a 48 target holding MaterialIcons `visibility` or `visibility-off` at
  20, named `auth.passwordInput.show` or `hide`. Its `hasError` prop has one caller, sign in.
- `features/auth/components/PasswordStrengthIndicator.tsx` (+ test) -- `getPasswordStrength`
  (`:15-25`): weak under 8 characters or without a letter or a digit, strong at 12 or more with a
  character that is neither, fair otherwise. One bar on a 6pt `border` track, 33, 66 or 100 % wide
  (`:54`), in `error`, `warning` or `success` (`:55-56`), and the word in `labelBold` in the same
  colour. testIDs `password-strength-indicator`, `-track`, `-bar`, `-label`. It draws nothing for an
  empty password.
- `features/auth/components/index.ts`, `features/auth/index.ts` -- the barrels. Nothing imports
  `features/auth/index.ts`.
- `features/auth/SignInScreen.tsx` (+ test).
  - Validation on submit (`:58-73`); the failure mapper (`:31-56`).
  - `signInWithEmail(email.trim(), password)`, then `router.replace('/')` (`:85-92`).
  - `ErrorBanner` `server-error` (`:111`), with `hasError` reddening both fields (`:100`, `:134`,
    `:154`). Editing clears its field's error and the banner (`:117-124`, `:141-148`).
  - testIDs: `sign-in-screen`, `sign-in-title`, `sign-in-subtitle`, `email-input`, `password-input`,
    `forgot-password-link` (pushes `/forgot-password`), `sign-in-button`, `create-account-link`
    (pushes `/create-account`).
- `features/auth/CreateAccountScreen.tsx` (+ test).
  - The `email` param prefills, and a new one resets the form (`:28-31`, `:88-97`). Email is
    validated on blur (`:191-196`); the rules are at `:99-125`.
  - The meter once a password is typed (`:215`); the `password-requirements` caption (`:234-243`);
    `ConsentCheckbox` and `consent-error` (`:245-259`); the banner below the fields (`:261`).
  - `register-button` is `disabled={!consent}` (`:269`), and `Button` draws a disabled primary like
    an enabled one.
  - Submit (`:136-157`): `signUp`, then `setConsentGiven()`, then `router.replace('/')` with a
    session, else a push to `/verify-email` with `{ email, sentAt }`. The mapper is at `:63-86`.
  - testIDs: `create-account-screen`, `create-account-title`, `create-account-subtitle`,
    `email-input`, `password-input`, `confirm-password-input`, `consent-error`, `server-error`,
    `register-button`, `sign-in-link` (pushes `/sign-in`).
- `features/auth/ForgotPasswordScreen.tsx` (+ test).
  - `showAppIcon={false}` (`:100`), and its own MaterialIcons chevron, `forgot-password-back-chevron`,
    calling `router.back()` (`:102-117`).
  - Submit: `sendPasswordResetOtp`, then a push to `/recovery-otp` with `{ email, sentAt }`
    (`:67-84`).
  - testIDs: `forgot-password-screen`, `forgot-password-title`, `forgot-password-subtitle`,
    `server-error`, `email-input`, `send-reset-button`, `back-to-sign-in-link` (pushes `/sign-in`).
- `features/auth/VerifyEmailScreen.tsx` (+ test), and `RecoveryOtpScreen.tsx` (+ test), which is
  `<VerifyEmailScreen purpose="recovery" />`.
  - `PURPOSE_CONFIG` (`:76-150`) holds each purpose's calls, copy and routes. `OTP_LENGTH` 8,
    `OTP_INPUT_MAX_LENGTH` 16, `RESEND_COOLDOWN_MS` 60000 and the module-level expiry map are at
    `:25-28`.
  - `StatusNotice` (`:179-220`): MaterialIcons, and a tint when boxed.
  - The raw `TextInput` `otp-input` (`:440-472`): `number-pad`, `oneTimeCode`, `one-time-code`,
    `maxLength` 16, `selectTextOnFocus`, `editable={!loading}`, `monoCodeLg` tracked only once there
    are digits, centred, with its own border and tinted fill (`:295-309`). Focus on mount
    (`:285-287`); sanitising and the submit at 8 (`:370-386`).
  - `invalid_otp` and `expired_otp` set an inline error and redden the field (`:340-352`); any other
    failure sets the banner (`:355`). Each change clears every message (`clearFeedback`).
  - `confirm-code-button` is `disabled={!isOtpComplete}` (`:476-486`). `resend-code-button`
    (`:488-515`) carries its name and its disabled and busy states. Then the boxed success notice
    (`:517`), `verify-email-banner` (`:518-520`) and `wrong-email-link` (`:522-528`).
  - testIDs also: `verify-email-screen`, `verify-email-title`, `verify-email-subtitle`.
- `features/auth/NewPasswordScreen.tsx` (+ test).
  - The `origin` param (`:41-43`); the rules (`:71-88`); the meter, always mounted (`:151`); the
    `password-requirements` caption (`:170-178`).
  - Submit: `updatePassword`. From Settings it shows the toast and calls `dismissTo('/settings')`,
    otherwise `router.replace('/')` (`:100-116`).
  - testIDs: `new-password-screen`, `new-password-title`, `new-password-subtitle`, `server-error`,
    `password-input`, `confirm-password-input`, `update-password-button`.
- `shared/components/ConsentCheckbox.tsx` (+ test) -- Story 6.4's checkbox; create account is its
  only user.
  - A 48 box, radius 4, with a 2pt outline, filled `primary` when ticked. Its check is MaterialIcons
    `check` in `#FFFFFF`, which on dark mode's beam is 1.52:1.
  - The sentence is `bodyMd` `textPrimary`, with the nested `consent-policy-link` (`role=link`,
    `primary`, underlined) pushing `/privacy-policy`.
  - testIDs `consent-checkbox`, `consent-checkbox-toggle`, `consent-policy-link`; names
    `auth.consent.*`. `ConsentCheckbox.test.tsx:83-87` pins the policy link, a way into the policy
    (Story 22.8).
- `app/_layout.tsx` -- the six auth routes set only `title` (`:234-269`), so the native header shows,
  with the root's MaterialIcons back (`:124-134`). `settings`, `card/[id]/edit`, `help`,
  `privacy-policy` and `data-summary` set `headerShown: false`: the precedent, which
  `test/root-layout.home-header.test.tsx:177-272` pins route by route.
- `shared/i18n/locales/en.ts:341-473`, `it.ts:343-475` -- `auth.*`.
  - `auth.accessibility.back` is used only by forgot password's chevron, and
    `auth.createAccount.passwordRequirements` only by the caption.
  - `auth.validation.consentRequired` never renders today.
  - `auth.verifyEmail.goBack` is also `features/cards/screens/BarcodeScreen.tsx:124`'s.
  - `sharedUi.formScreen.saving` is at `en.ts:288`.
- `shared/theme/tokens.generated.ts:30-70` -- there is no green role. `success` is ink in light and
  cream in dark; `warning` ink and beam; `link` ink and beam; `border` `#D6D6CB` and `#3A3A48`;
  `onPrimary` white and ink.
- `shared/theme/typography.ts` -- `headlineMd` 24/32 Space Grotesk 700; `bodyLg`, `bodyMd`,
  `bodyMdStrong`; `labelBold` 13/18, the chrome tier; `monoCodeLg` 22/32 at 500, tracked 8.
- `shared/components/ui/stories.test.tsx:111-116` -- 19 story modules.
- **Tests that pin things:**
  - The six auth suites mock `react-native-safe-area-context` with `useSafeAreaInsets` only (e.g.
    `SignInScreen.test.tsx:6-8`), so `FormScreen`'s `SafeAreaView` needs the mock
    `features/help/HelpScreen.test.tsx:39-45` uses.
  - Their theme mocks carry the pre-Cardì palette (link `#1A73E8`, success `#16A34A`, a 44 touch
    target, `SignInScreen.test.tsx:10-34`), and their router mocks lack `back`.
  - `VerifyEmailScreen.test.tsx:284-302` pins the resend row's old colours.
    `PasswordStrengthIndicator.test.tsx:39-49` pins that weak and strong differ in colour.
  - React Native's Jest mock reports a font scale of 2. `fireEvent.press` climbs to the nearest
    `onPress`, so press tests go through `userEvent.press`.

## Tasks & Acceptance

**Execution:**

- [x] `shared/components/ui/FormScreen.tsx` (+ test, + stories) -- the extensions in Design Notes,
      the field brought into view on request included. Card setup and card edit draw and behave as
      before, and their suites pass unchanged.
- [x] `shared/components/ui/TextField.tsx` (+ test) -- only what the code field needs, per Design
      Notes. Every other field draws as before.
- [x] `features/auth/components/AppIconHeader.tsx` (+ new test) -- the mark's spacing, per Design
      Notes. Its test pins the SVG inside the ink circle.
- [x] `features/auth/components/AuthLink.tsx` (+ new test) -- the link row, per Design Notes.
- [x] `features/auth/components/PasswordInput.tsx` (+ test) -- the Lucide eye; drop `hasError`.
- [x] `features/auth/components/PasswordStrengthIndicator.tsx` (+ test) -- the counting meter.
- [x] `shared/components/ConsentCheckbox.tsx` (+ test) -- frame B's consent row.
- [x] `features/auth/SignInScreen.tsx`, `CreateAccountScreen.tsx`, `ForgotPasswordScreen.tsx`,
      `VerifyEmailScreen.tsx`, `NewPasswordScreen.tsx` (+ their tests, and
      `RecoveryOtpScreen.test.tsx`) -- frames A–F on `FormScreen`, per Design Notes. Their suites
      also pin, folded in from review pass 1:
  - each screen's fields wrapped for the focused field, and one check that focusing a field below
    the body scrolls it into view (row 4);
  - the banner kept through a press validation refuses (row 5);
  - the code screen's guards between a check and a resend, both ways, and Confirm busy during either
    (rows 6 and 10);
  - a successful resend clearing an expired-code banner (row 7);
  - each busy name, and the short-code message, in Italian (row 8);
  - create account focusing an invalid email first (row 9);
  - each screen's controls counted, so no sign-in method can be added unseen (row 30);
  - the keyboard dismissed as each request starts and kept at a refused press (row 12);
  - a refused press bringing its first invalid field into view, the consent row and an
    already-focused field included (rows 11 and 29).
- [x] Delete `features/auth/components/AuthScreenLayout.tsx`, `ErrorBanner.tsx` and
      `ErrorBanner.test.tsx`, and drop them from both barrels.
- [x] `app/_layout.tsx` (+ `test/root-layout.home-header.test.tsx`) -- the six auth routes take
      `headerShown: false` and keep their titles, so no native header flashes in the push.
- [x] `shared/i18n/locales/en.ts`, `it.ts` -- add the strings Design Notes name (`auth.busy.resendCode`
      among them), and delete
      `auth.accessibility.back` and `auth.createAccount.passwordRequirements`.
- [x] `docs/design/cardi/cardi-design-system.md` -- the record in Design Notes.

Unit-test every I/O row a test can observe, and every absence the Never list states. Each new check
must be seen to fail under its mutation.

**Acceptance Criteria:**

- **The frames:**
  - Given the six screens, in light and dark and in both languages,
  - when each is shown at rest, with field errors, busy, and after a failed request,
  - then each draws its frame as Design Notes rule it.
- **One pattern:**
  - Given the six routes,
  - when each is pushed,
  - then each draws `FormScreen`, no native header shows, and neither `AuthScreenLayout` nor
    `ErrorBanner` exists.
- **The meter (Story 22.9):**
  - Given a password at each strength,
  - when the meter draws,
  - then its fill spans 33, 66 or 100 % of the track by segment count, its colour is the same at
    every strength, and its word names the strength. No green and no colour ramp remain.
- **The mark (Story 22.9):**
  - Given any of the six screens,
  - when it draws,
  - then `AppIconHeader` shows `cardi-mark-inline.svg` in its ink circle.
- **The record:**
  - Given `cardi-design-system.md`,
  - when this change is read against it,
  - then it holds an `### Authentication` section; _Forms_ no longer says auth waits; and _Icons_
    records the auth screens leaving MaterialIcons.

## Implementation Notes

### Step 3 (2026-10-21)

- **Built** by a context-free subagent from this spec, about 68 minutes. It reported `yarn typecheck`,
  `yarn lint`, `yarn format:check` and `yarn test` (216 suites, 4,080 tests) all exiting 0, unpiped,
  and 94 single-line mutations, one per new check, each failing its suite (one survivor gained a
  test: sign in sending nothing when only the password is missing).
- **Read back against the diff** (44 files, every task done). The changed suites and their
  neighbours (auth, the ui primitives, `ConsentCheckbox`, card setup and edit, i18n, the root
  layout) ran again here: 39 suites, 1,033 tests, exit 0.
- **The implementer's own simulator pass** (iOS 26.5, "DS22-9 iPhone 16" at 393 and "DS22-9 SE" at
  375 × 667, this branch's bundle over Metro's debugger): frames A–F in light, the busy name, create
  account's errors, consent and meter, the code screen's short code, failure and resend, dark on
  create account and the code screen, new password with no header row, and the focused field
  brought into view on both phones. It found and fixed one defect: with iOS's strong-password
  panel up on the 375 phone, the confirm field's 24pt margins pushed its input under the footer, so
  the margins now shrink evenly when the body cannot spare them. Shots are in the session
  scratchpad (`shots/16-*`, `shots/se-*`).
- **To the human:** at the largest text size on the 375 phone, the footer (the primary and the
  way-out link, both wrapping) takes nearly the whole screen: sign in with the keyboard up leaves
  the body no room, the focused field out of sight and "Create one" running under the keyboard;
  create account at rest leaves about 60pt of body. The Large text row fails, and every fix changes
  decision 2.
  ifero chose a ("1a", 2026-10-21): recorded as decision 3, and sent back to the same
  implementer.
- **Decision 3, built** (the same implementer, about 11 minutes): `FormScreen` moves the way-out
  link to the end of the fields column from a font scale of 1.5, a local constant beside
  `ActionRow`'s and What We Collect's own. Its suite and the four screen suites pin both sides of
  the breakpoint (1 and 1.49 in the footer; 1.5, 2 and 3.1 closing the body), and every auth suite
  now pins a font scale of 1. Eleven new mutations each failed their suite. The four commands
  exited 0 (216 suites, 4,094 tests); 55 suites (1,326 tests) ran again here, exit 0. Re-shot in
  light (`shots/d3-*`): at the largest size the footer holds the button alone and the focused
  field shows whole with the keyboard up, on both phones; at the default size nothing moved. At
  the largest size on the 375 phone "Create Account" wraps to two lines, so the footer stands
  about 170pt, and with the keyboard up the body holds one field.
- **A real request.** Before the device pass blocked network calls inside the app, one
  `verifyEmailOtp` for `test@example.com` with `12345678` reached the dev Supabase project, which
  answered expired: evidence for Found, not fixed 2. Three other simulators running on the host
  (iPhone 17 Pro, DS22-1, DS22-8) also connected to this Metro while it ran.

### Step 4, review pass 1 (2026-10-21)

- Four layers reviewed derivation 1's diff (341 kB) in parallel: 28 findings, 30 rows in the
  Review Triage Log. Three groups route to `bad_spec`, so the pass loops back (Spec Change Log,
  loopback 1); `review_loop_iteration` is 1.
- Derivation 1's diff is saved, the KEEP pointer above, and the implementation was reverted path
  by path from its file list, leaving this spec and the tracker edit.
- **To the human:** Found, not fixed 12, the code's digits outgrowing their field from a font scale
  of about 2.6, contradicts the frozen Large text row. It is pre-existing.

### Step 3, derivation 2 (2026-10-21)

- **Built** by a fresh context-free subagent from loopback 1's KEEP pointer, about 40 minutes: it
  checked the saved diff's sha1, applied it, and changed only what loopback 1 lists, plus two
  things Design Notes asked for: the code screen's refused Confirm also reveals its field, and
  `shared/components/ui/index.ts` exports the `FormScreenHandle` type. It reported the four
  commands exiting 0 (216 suites, 4,143 tests) and 63 mutations, each failing its suite.
- **Read back against the interdiff** with derivation 1: only `FormScreen`, the five screens,
  `AppIconHeader`, `index.ts`, both locales and the record changed, with their tests; every other
  file is byte for byte derivation 1. 55 suites (1,375 tests) ran again here, exit 0.
- **Its simulator pass** (both phones, light and dark; every Supabase call answered inside the
  app): an already-focused field brought back at a refused press, the consent row revealed with
  its message, the keyboard down at each request with the failure's banner above the fields, and
  Confirm busy, "Sending code...", during a resend. Shots in the scratchpad (`d2/shots/`).
- **To the human:** at the largest text size on the 375 phone with the keyboard up, a refusal for
  consent alone shows only the top of the row, its red box and first line, since the row and its
  message are taller than the 157 the body has; the message is a scroll away. It follows the
  rule for a field taller than the body (`d2/shots/se-21-B-largest-consent-refused.png`).
- iOS offered "Save Password?" once, after a sign-in screen holding typed credentials was popped;
  a rerun without the pop showed none. It is AutoFill, not this change.

### Step 4, review pass 2 (2026-10-21)

- Four layers reviewed derivation 2's diff: 24 findings, 27 rows, two carried. Nothing routes to
  `intent_gap` or `bad_spec`, so there is no loopback. The 13 patch rows went to derivation 2's
  implementer, about 12 minutes, with 15 mutations; the 6 defer rows are Found, not fixed 18 to
  22, and `deferred-work.md`; 8 rows are rejected.
- **After the patches,** the four commands on the final tree, unpiped: `yarn typecheck` 0,
  `yarn lint` 0, `yarn format:check` 0, `yarn test` 0 (216 suites, 4,150 tests).
- In a combined run the implementer saw `features/cards/components/CardForm.test.tsx`'s "focuses
  the first invalid field when saved incomplete (AC2)" fail once on a stray `card-name-input`
  focus, then pass alone three times and in its rerun. `CardForm` passes no opening block, so
  this change cannot reach it, and the full run here passed (Found, not fixed 23).

### Device check (2026-10-21)

- **The final tree** (the review diff after pass 2's patches, sha1 `a7f9b6a`) was served by Metro
  from this worktree into the installed Debug build, on iOS 26.5. It ran on "DS22-9 iPhone 16"
  (393 × 852) and "DS22-9 SE" (375 × 667), with the live simulator view attached. Every Supabase
  request was answered on the device, failing or never answering on demand, so none left it.
- **174 shots** sit in the session scratchpad, with contact sheets beside them, and 8 more from the
  repeat below:
  - `final-shots/`: 89, taken by derivation 2's implementer after the patches.
    - On the 393 phone, in both themes: frames A–E at rest; each screen's field errors, busy state
      and failed request; the meter at weak, fair and strong; the code screen counting, after a
      resend, after a wrong and an expired code, and with Confirm busy during a resend; the keyboard
      on each field.
    - On the 393 phone, in light: Italian on A and D; the largest size on A, B and D.
    - On the 375 phone: the keyboard and the largest size on A and B.
    - Card setup and card edit.
  - `final-shots-dark/`: 10, the light-only states of that set in dark. These are the largest size
    on the 393 phone, and the 375 phone's states.
  - `final-shots-2/`: 70.
    - Italian on A–E at rest, in both themes, on both phones.
    - On the 375 phone, in both themes: every frame at rest, each refused press, each failed
      request, and new password's lowest field focused.
    - Forgot password, the code screen and new password at the largest size, on both phones, in both
      themes.
    - New password's confirm field focused on the 393 phone.
    - Card setup and card edit in dark.
  - `final-shots-main/`: 5. Card setup and card edit from `f42f1d6`, served into the same binary, in
    both themes, and main's new password in Italian.
- **Read back** against Design Notes, frames A–F and _Forms_. These held:
  - the back-only header and the 80 mark;
  - the uppercase labels, the eye, and "Forgot password?" at the end;
  - the footer's hairline, its 52 primary, and the way-out link under it;
  - the banner with no icon or tint;
  - the meter's segments in one colour, with its word;
  - the consent box;
  - the code field, labelled and centred in mono;
  - the plain resent line, and Confirm busy during a resend;
  - after a failure, the keyboard down and the banner in view;
  - a refused press's first invalid field brought into view;
  - from a font scale of 1.5, the way-out link closing the body (decision 3);
  - dark mode's roles throughout.
- **New password both ways.** Alone on the stack, as after a recovery begun from Home, it draws no
  header row, as the Back row rules. With a screen beneath it, its header row holds the back: that
  is how it opens from Settings, and how it opened when pushed from Home in this check. Both were
  shot.
- **Card setup and card edit are unchanged.** Against main's, served into the same binary, they are
  pixel-identical below the status bar in both themes: 0 of 2,801,304 pixels differ.
- Found, not fixed 11 and 12 show as recorded, on both phones. Found, not fixed 24 and 25 were found
  here; both are pre-existing. **No defect is in this change.**
- **Each forced failure shows the message its error maps to.** On new password the device has no
  session, so `updateUser` fails before any request and the 375 phone's banner reads "An unexpected
  error occurred. Please try again." Derivation 2's 393 shots show the network message.
- **A clone of the 375 phone**, made to split the work, shared that phone's app container and Metro
  device id. It was deleted unused, after one launch that dropped the phone's debugger connection
  for about 20 seconds; the two shots that spoiled were retaken.
- **Unchecked:**
  - Android, for which this host has no emulator;
  - VoiceOver and TalkBack (the Screen reader row rests on its tests);
  - one-time-code autofill from a real e-mail;
  - a real server's answers, since every request was answered on the device;
  - the iOS swipe back, and Android's back;
  - new password reached through a real recovery, since it was opened directly, both ways.
- **Repeated after code-review round 1's fix**, the one later change that reaches the app; the rest
  are comments, tests and docs. It ran on DS22-9 iPhone 16, in both themes, with each request held
  and then failed on cue (`patch-fetch-defer.js`). The 8 shots are in `final-shots-3/`.
  - **The fixed case.** Sign in's request was held, forgot password was pushed over the busy sign
    in, and its email took the focus. Then sign in's request failed beneath it. The keyboard stayed
    up in front (`Keyboard.isVisible()` true before and after), and sign in's banner appeared on the
    hidden screen.
  - **The case the fix keeps.** A sign-in field was refocused while the request ran, then the
    request failed. The keyboard went down, and the banner showed.
  - **Unchanged.** That refocused failure, and sign in's and forgot password's plain failures, are
    pixel-identical below the status bar to the shots before the fix, in both themes.
- **To the human:** Metro on 8081 also served three other sessions' simulators (DS22-8 iPhone 16,
  DS22-1 iPhone 16, iPhone 17 Pro) while it ran, as in derivation 1. A relaunch on any of them would
  have loaded this branch's bundle, or main's during the five baseline shots.

### Review loops (2026-10-21)

**Code review, round 1** (a Sonnet reviewer, on the diff of sha1 `a7f9b6a`): CHANGES_REQUESTED,
three findings. Each was verified at its cited location and fixed.

1. **A failure below an opening block dismissed the keyboard whether or not the form held it.**
   `Keyboard.dismiss()` blurs whichever input has the focus. A screen beneath a push keeps running:
   nothing enables freezing. Its links also work while the primary is busy. So a sign in failing
   late, behind a forgot password the person is typing on, closed their keyboard. This change caused
   it, in review pass 2's patch.
   - **The fix.** `FormScreen` now knows when one of its own fields holds the focus. A new
     `focusedIndex` is set by each field's focus and cleared by its blur; the field followed can be
     one the caller asked for, which need not take the focus. The form dismisses the keyboard only
     while one of its fields holds it.
   - **Tests.** Its test now focuses a field first. A new test leaves the keyboard alone with no
     field focused, and after a field's focus and blur.
   - **Docs.** The record's _Forms_ and _A failed request_ passages, and `FormScreen`'s comments,
     say so.
2. **Observables the I/O rows name went unpinned.** Tests now pin:
   - create account's field labels, names and hints, and its back;
   - new password's names and hints;
   - the 8 under sign in's and new password's password fields.
3. **The record's known gaps stopped at 22.** Gaps 24 and 25 are added, and the Large text paragraph
   names 24.

Evidence:

- 11 mutations, each one failing the test it targets.
- The four suites ran: 183 tests, exit 0.
- `yarn typecheck`, `yarn lint` and `yarn format:check` exited 0.
- The fix reaches the app, so the device check repeats on the final code before the handback.

**Code review, round 2** (on the diff of sha1 `6ee2080`): CHANGES_REQUESTED, four findings. Each was
verified and fixed; none changes behaviour.

1. **Round 1's tests left three mutations of its bookkeeping alive:** reading the followed field for
   the focused one; `bringFieldIntoView` setting the focus; and any blur clearing it. Two tests now
   pin them. The first follows a field the caller asked for, which takes no focus, and fails the
   request: the keyboard stays. The second has the field the focus left blur after the next one
   takes it, and fails the request: the keyboard goes.
2. **Four screens' comments, and their tests', said the keyboard's going at a request "so nothing is
   typed while it runs".** Row 35 found that untrue: the fields stay editable while busy. The clause
   is gone. The code screen's test keeps it, since its field does ignore input while busy.
3. **`FormScreen`'s `openingBlock` doc promised the dismissal unconditionally.** It and
   `keepFocusedFieldInView`'s doc now say the dismissal needs a field of the form holding the focus,
   which the form knows only with `keepFocusedFieldInView`.
4. **Nothing pinned `bringIntoView`'s wait for the body's height.** A test now focuses a laid-out
   field before the body is laid out: nothing moves until the body is.

Evidence: four mutations, each failing the test it targets; the five suites ran, 210 tests, exit 0;
`yarn typecheck`, `yarn lint` and `yarn format:check` exited 0.

**Code review, round 3** (on the diff of sha1 `3d3f82e`): CHANGES_REQUESTED, one finding, verified
and fixed. `shared/theme/colors.contrast.test.ts`'s registry of who reads `textTertiary` and
`backgroundSubtle` still named the code field's placeholder and `VerifyEmailScreen`'s `loading`
fill. This change made both untrue when it moved the code field onto `TextField`. The comment now
names `TextField`'s disabled fill as `backgroundSubtle`'s one consumer, and says where the other two
went. The file joins the diff, a comment-only change. Its suite ran: 18 tests, exit 0, and `yarn
typecheck`, `yarn lint` and `yarn format:check` exited 0.

**Code review, round 4** (on the diff of sha1 `5f966ee`): CHANGES_REQUESTED, one finding, verified.
Italian's consent sentence draws a space after its elision. Main joins the same prefix the same way,
so it is pre-existing: it is Found, not fixed 26, and the record's known gap 26.

The trend so far:

| Round | Findings | What they were                                           |
| ----- | -------- | -------------------------------------------------------- |
| 1     | 3        | one behaviour defect, observables unpinned, a record gap |
| 2     | 4        | two surviving mutations, two untrue comments             |
| 3     | 1        | a stale comment outside the diff                         |
| 4     | 1        | a pre-existing Italian spacing, deferred                 |

**The code-review loop ended after round 4, on ifero's call** ("1", 2026-10-21). He was shown that
trend and offered to stop. This was not the contract's nit-only ending: neither round 3 nor round 4
was nit-only. If the QA loop changes code, a final code-review round follows.

**QA, round 1** (on the diff of sha1 `7a4819b`): CHANGES_REQUESTED, three findings. Each was
verified and fixed.

1. **The Request failed row's "clears it while it runs" had no test on the code screen's resend.**
   The held resend that starts from an expired banner now asserts the banner gone as the resend
   starts, before it answers.
2. **Decided 1's "only where there is a screen beneath" was pinned only on sign in and new
   password.** Create account, forgot password and the code screen now each draw no header row with
   nothing beneath them. The code screen's test covers both of its routes.
3. **Three Design Notes sentences said what the review rounds had found untrue.** They are amended
   as the record words them, and logged in the Spec Change Log.

Evidence: five mutations, each failing the test it targets (the code screen's on both routes); the
four suites ran, 140 tests, exit 0; `yarn typecheck`, `yarn lint` and `yarn format:check` exited 0.

**QA, round 2** (on the diff of sha1 `be99c61`): CHANGES_REQUESTED, three findings. Each was
verified, and each was a row pinned on some screens but not on others. The fix swept each row across
every screen, not just the screens cited.

1. **Validation: clean until the first press.** New password had no pin; it now has one, as the
   other four screens do.
2. **Busy: nothing dims.** It was pinned on sign in and on the code field during a check. It is now
   pinned on create account, forgot password and new password, and on the code field during a
   resend: no opacity, the field's `surface` fill, and the field still editable.
3. **Request failed: no field reddens, no toast.** It was pinned for a wrong code only. It is now
   pinned on the code screen's expired code, unavailable check and failed resend, and on all three
   of recovery's failures.

Evidence: ten mutation runs, each failing the test it targets; the five suites ran, 170 tests, exit
0; `yarn typecheck`, `yarn lint` and `yarn format:check` exited 0.

**QA, round 3** (on the diff of sha1 `ae49891`): APPROVED, with no comments. The QA loop ends here.
Its rounds changed tests and this spec's text, and no app code. A final code-review round, round 5,
runs on the same diff, as the note after round 4 says.

**Code review, round 5**, the final round (on the diff of sha1 `ae49891`): CHANGES_REQUESTED, one finding, verified and fixed. `ResendRow`'s comment still said a request running shows the countdown. After the cooldown the row reads "Resend code", muted and disabled (row 34). Only the comment changed, so nothing reaches the app. A change after the QA loop's approval would strictly send both loops round again. Given ifero's stop after round 4, no further round ran; that is said at the handback.

**Final verification**, on the final tree after the last fix (review diff sha1 `5e04a3d`), each command run in full and without pipes: `yarn typecheck` 0, `yarn lint` 0, `yarn format:check` 0, and `yarn test` 0 (216 suites, 4,163 tests).

### Found, not fixed

Found while planning (2026-10-20). Each is outside this story's mechanism.

1. **A device's first account sends the server no consent.** `signUp` reads `getConsentStatus()`
   before it sends (`shared/supabase/auth.ts:153-166`). Create account stores consent only after
   `signUp` returns (`CreateAccountScreen.tsx:145`), and it is the only writer. So `consent_status`
   and `consented_at` reach the server only from a device that had consented before. Read from the
   code, not run.
2. **A mistyped code probably reads as expired.** auth-js knows only `otp_expired` and
   `otp_disabled` (`node_modules/@supabase/auth-js/src/lib/error-codes.ts:67-68`). GoTrue answers a
   wrong code with `otp_expired`, "Token has expired or is invalid" (inferred, not run against a
   server), and `normalizeOtpError` maps that to `expired_otp` (`shared/supabase/auth.ts:79-86`). A
   typo then shows "This code has expired…" and unlocks resend. The suite mocks an `otp_invalid`
   code auth-js never returns (`shared/supabase/auth.test.ts:427`).
3. **Sign in's "Please verify your email address first." leads nowhere.** Nothing takes that user to
   the code screen (`SignInScreen.tsx:31-56`).
4. **"An account with this email already exists" is likely unreachable.** With confirmations on
   (`supabase/config.toml:209`), Supabase answers a known address with an obfuscated user and no
   error, so that user lands on the code screen instead (inferred).
5. **The cross-links push** (`SignInScreen.tsx:189`, `CreateAccountScreen.tsx:279`,
   `ForgotPasswordScreen.tsx:156`). Toggling between sign in and create account grows the stack, and
   "Back to Sign In" pushes a new sign in rather than returning to the one beneath.
6. **The consent sentence's policy link has no 48pt target.** It is a nested `Text`
   (`ConsentCheckbox.tsx:80-88`).
7. **`TextField`'s `hasError` has no caller after this story.** Sign in was its only user.
8. **Connected but offline, a submit spins until the system's fetch timeout.** The client sets no
   timeout (`shared/supabase/client.ts:197-204`) (inferred).
9. **The guest-migration flag ignores the user** (`core/auth/guest-migration.ts:23`, `:68-82`). A
   second account on the same device never migrates its cards (inferred).
10. **Three design sources still describe the old icon or the hand-built ì:**
    `docs/design/cardi/README.md:1201-1207` (a dated entry), `stitch-prompts-auth.txt:45`, and
    frames A–F's ì (`cardi-auth-frames.html:349-381`).

Found in step 3 (2026-10-21):

11. **At the largest text size the 24pt heading breaks mid-word** ("Welcom / e Back", "Accoun /
    t") on the 375 and 393 phones: one word is wider than the column. It wraps rather than
    clips, and the old `AuthScreenLayout` set the same heading at the same width.

Deferred by review pass 1 (2026-10-21; the pass looped back, so they are recorded here rather than
in `deferred-work.md`; Review Triage Log rows in brackets). Each is pre-existing.

12. **The code's digits outgrow their field at the largest sizes** [13]. JetBrains Mono's digits are
    0.6 em, so eight at 22pt tracked 8 need about 340 at a font scale of 2.643 and about 440 at
    3.571, against a 313 input; the old field set the same face, tracking and width. It contradicts
    the frozen Large text row, so it goes to ifero.
13. **Strength changes are never announced** [15]: the meter is one labelled element with no live
    region, as the old one's word was plain text.
14. **"Wrong email? Go back" leaves the original form beneath, stale** [21]: `router.replace` swaps
    only the code screen, so its back returns to the old address, password and ticked consent.
15. **The code suites still depend on their fake-timer tests running last** [23] (#248 item 13).
16. **After a rejected code, appending a digit re-sends the same code on every keystroke** [26]:
    the handler slices to 8 and submits, as the old one did.

Found in derivation 2 (2026-10-21):

17. **`shared/components/ui/ActionRow.tsx:17` still calls 1.5 "the first of the accessibility
    sizes"**, the wording review pass 1 corrected here (row 18). The file is Story 22.7's.

Deferred by review pass 2 (2026-10-21; Review Triage Log rows in brackets). Each is pre-existing.

18. **Send Reset Code's spoken name lacks its visible words** [36]: "Send password reset code" over
    "Send Reset Code", against WCAG 2.5.3 (Label in Name).
19. **Setup and edit can leave a focused field under the footer after a failed save** [40], with
    the keyboard up, as Story 22.6 left them; neither keeps the rules this story gave auth.
20. **A request that finishes after the user has left still navigates** [43, 54]: the handlers
    navigate after the await without checking the screen is still focused.
21. **The return key moves nowhere and submits nothing** [44] (#268 item 17).
22. **Recovery begun from welcome leaves forgot password beneath new password** [55]:
    `dismissTo('/')` finds no Home there, so its back shows and returns to forgot password.
23. **`CardForm.test.tsx`'s "focuses the first invalid field when saved incomplete (AC2)" flaked
    once** in a combined run, on a stray `card-name-input` focus; it passed alone three times. The
    suite is unchanged by this story.

Found in the device check (2026-10-21). Each is pre-existing.

24. **At the largest sizes, UIKit shrinks a hint that is wider than its field.** New password's "Min
    8 chars, 1 letter, 1 number" and "Re-enter your new password" read near the regular size while
    their labels grow (`final-shots-2/393-E-largest-end-light.png`). React Native sets no font
    fitting on a single-line iOS input, and the old screens set the same hints in the same fields.
25. **New password's Italian confirm hint truncates.** `auth.placeholders.confirmNewPassword` shows
    as "Inserisci di nuovo la nuova pass…" at 393 and "…pa…" at 375. Main's screen truncates it the
    same way (`final-shots-main/main-393-E-rest-it-light.png`).

Found by the code-review loop (2026-10-21). It is pre-existing.

26. **Italian create account's consent sentence has a space after its elision:** "Accetto l'
    Informativa sulla privacy", while its spoken name reads "Accetto l'Informativa sulla privacy".
    `ConsentCheckbox` joins `auth.consent.labelPrefix` ("Accetto l'") to the link with a space
    (`ConsentCheckbox.tsx:135`), as main does. Its Italian test pins the link and the name, not the
    sentence. Seen in the device check's diagnostic shot `tmp/b2se-diag-B-scrolled-end-it.png`.

## Spec Change Log

**Loopback 1 (2026-10-21), from review pass 1.**

- **Triggers** (all `bad_spec`; the root cause sat in Design Notes):
  - rows 10, 14 and 27: during a resend Confirm kept its label, so a press on it, and a keystroke,
    were dropped while nothing on screen said the screen was at work. This spec ruled it "as today",
    but today's shared `loading` made Confirm busy then;
  - rows 11, 25 and 29: this spec revealed an invalid field only through its focus, so a press
    refused for consent alone, or for a field that already had the focus and was scrolled away,
    showed its message out of sight;
  - row 12: this spec scrolled a failed request to its banner and said nothing of the focused
    field, which the keyboard and the footer then hid while typing went on.
- **Amended** (Design Notes; the frozen block is unchanged): a field brought into view on request; a
  refused press revealing its first invalid field; every request dismissing the keyboard as it
  starts; Confirm busy during either of the code screen's requests, with `auth.busy.resendCode`; the
  request flags' names; the record's new rulings.
- **Folded in as requirements**, from the moot patch rows: the flags' names (row 2), `SPACING.xl`
  under the mark (row 3), the 1.5 cut-off's wording (row 18), the record's known gaps and Large text
  paragraph (row 20), and the tests of rows 4, 5, 6, 7, 8, 9 and 30.
- **Known-bad states avoided:** a press on Confirm or a keystroke dropped unseen during a resend;
  create account seeming to ignore its button when only consent is missing; an erring field left
  out of view at a second press; typing unseen behind the footer after a failed request; seven tests
  that could not fail; a record that misstates its breakpoint and omits a gap.
- **KEEP.** Derivation 1, with decision 3, passed step 3's audit, 105 single-line mutations, the full
  suite and a simulator pass on a 393 and a 375 × 667 iPhone. Its diff is saved at
  `/private/tmp/claude-501/-Users-ifero-Developer-myLoyaltyCards--claude-worktrees-bmad-build-22-9-4fd3ae/4e10eb03-b9c6-433e-abc6-2e4726f37a72/scratchpad/diffs/22-9-derivation-1.diff`
  (sha1 `5f2fed3beed7204cd85d8019706951795140366f`), and it applies cleanly to the baseline. Start
  from it with `git apply`, then change only what this entry lists:
  - `VerifyEmailScreen.tsx`: Confirm busy during either request, named for it; the flags' names; the
    keyboard dismissed as a check or a resend starts;
  - `FormScreen.tsx`: the field brought into view on request;
  - sign in, create account, forgot password and new password: the keyboard dismissed as their
    request starts, and a refused press revealing its first invalid field;
  - `AppIconHeader.tsx`: `SPACING.xl`;
  - `en.ts` and `it.ts`: `auth.busy.resendCode`;
  - the comments and the record that call 1.5 an accessibility size, and the record's new rulings,
    known gaps and Large text paragraph;
  - the tests the Tasks list folds in, and tests for everything above.

  Everything else stays byte for byte as derivation 1 has it.

**Amended after the review loops (2026-10-21), from the QA loop's round 1.** Three Design Notes
sentences still said what the review rounds had found untrue, though the code and the record had
moved on: "The back" (new password alone on the stack after any recovery; row 56), the resend row's
"names and states are as today" (row 34), and "nothing is typed while a request runs" (row 35).
Each now says what the record says. This is not a loopback: the code already holds each ruling, and
the frozen block is unchanged.

## Review Triage Log

**Pass 1 (2026-10-21).** Four layers reviewed one diff: Project Conventions (PC), Blind Hunter
(BH), Verification Gap (VG) and Edge Case Hunter (EC). They raised 28 findings; one holds three
separate claims, which gives 30 rows. Every one was verified at its cited location before routing.
Rows 10, 14 and 27 (one defect), rows 11, 25 and 29 (one root cause) and row 12 route to `bad_spec`,
so this pass loops back: its patch and defer rows are moot, the patch rows folded into the spec as
requirements and the defer rows recorded under Found, not fixed (12 to 16).

| #   | Layer | Location                                                                                                | Claim                                                                                                                                  | Verdict | Evidence                                                                                                                                                                                                                                                                                                                  | Route        |
| --- | ----- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1   | PC    | `features/auth/CreateAccountScreen.tsx:4` and six more                                                  | The screens and components style with React Native's `StyleSheet`, not Unistyles'                                                      | false   | Epic 22 does the same throughout: `FormScreen.test.tsx` pins that `shared/components/ui/` imports nothing from Unistyles, and settings, help and the document screens take colours as `useTheme()` roles. Stories 22.6, 22.7 and 22.8 ruled the same finding false; the stale written rule is 22.7's Found, not fixed 16  | reject       |
| 2   | PC    | `features/auth/VerifyEmailScreen.tsx:296-297`                                                           | The new request flags `verifying` and `resending` drop the `is` the loading-state rule gives such flags                                | low     | Real: `docs/project-context.md:318-323` names every such flag with `is` (`isPending` for a mutation). The old `loading` broke it too, but these names are new                                                                                                                                                             | patch (moot) |
| 3   | PC    | `features/auth/components/AppIconHeader.tsx:45`                                                         | The gap under the mark is a literal 32 where `SPACING.xl` exists                                                                       | low     | Real: the diff's other 32, `FormScreen`'s opening block, takes the token                                                                                                                                                                                                                                                  | patch (moot) |
| 4   | VG    | the five `keepFocusedFieldInView` call sites                                                            | No auth suite pins the opt-in, so dropping it from any screen passes                                                                   | medium  | Pre-verified: no auth test renders a `-field-<n>` wrapper or fires layout, scroll or focus at one                                                                                                                                                                                                                         | patch (moot) |
| 5   | VG    | `features/auth/SignInScreen.tsx:98-99` and three more                                                   | The banner staying through a press that validation refuses is unpinned                                                                 | low     | Pre-verified: moving `setError(null)` back above `validate()` passes every suite                                                                                                                                                                                                                                          | patch (moot) |
| 6   | VG    | `features/auth/VerifyEmailScreen.tsx:351`, `:360`, `:409`                                               | The guards between a resend and a code check are never exercised                                                                       | medium  | Pre-verified: dropping the `resending` guards lets a check and a resend overlap with no test failing                                                                                                                                                                                                                      | patch (moot) |
| 7   | VG    | `features/auth/VerifyEmailScreen.tsx:443`                                                               | The banner and the resent line never showing together is tested one way only                                                           | low     | Pre-verified: deleting the banner's reset at a resend's start keeps an expired-code banner beside "Code resent…" with no test failing                                                                                                                                                                                     | patch (moot) |
| 8   | VG    | `shared/i18n/locales/it.ts:382`, `:455-460`                                                             | No test renders four Italian busy names or the Italian short-code message                                                              | low     | Partly false: `shared/i18n/locales/card-colors.test.ts:31-44` fails on any key missing from either locale, so the demonstrated deletion is caught. The Italian wording itself is unpinned                                                                                                                                 | patch (moot) |
| 9   | VG    | `features/auth/CreateAccountScreen.tsx:125-126`                                                         | Create account's email branch of the focus rule never runs in a test                                                                   | low     | Pre-verified: every case of the focus test fills a valid email                                                                                                                                                                                                                                                            | patch (moot) |
| 10  | VG    | `features/auth/VerifyEmailScreen.tsx:495`, `:360`, `:409`                                               | During a resend Confirm is neither busy nor disabled, and a press on it, or a keystroke, is dropped unseen                             | medium  | Real: after an expired code the 8 digits stay and resend unlocks, so Resend then Confirm reaches `handleVerify`, which returns at its `resending` guard. This spec ruled "While a resend runs, Confirm keeps its label … as today", though today's shared `loading` made Confirm busy then                                | bad_spec     |
| 11  | BH    | `features/auth/CreateAccountScreen.tsx:124-133`                                                         | With consent the only invalid field, its message renders out of sight and the press seems to do nothing                                | medium  | Real: the consent row closes the body and is no text field, so nothing focuses or scrolls; with the keyboard up, or the meter showing on a 393 phone, it sits below the visible body. This spec revealed an invalid field only through its focus                                                                          | bad_spec     |
| 12  | BH    | `shared/components/ui/FormScreen.tsx` (`scrollToBanner`, `useFocusedFieldInView`)                       | A failed request with the keyboard up scrolls to the banner and leaves the focused field under the footer, where typing goes on unseen | medium  | Real: on a 393 phone with the keyboard up the body is about 252 tall, and the banner's scroll leaves the password input below it; nothing brings the field back, since its focus, its frame and the body's height are unchanged. This spec prescribed the banner's scroll with no rule for the focused field              | bad_spec     |
| 13  | BH    | `shared/components/ui/TextField.tsx` (`inputCode`)                                                      | The code's digits outgrow their field at the largest sizes                                                                             | medium  | Real, and pre-existing: JetBrains Mono's digits are 0.6 em, so eight at 22pt tracked 8 need about 340 at a font scale of 2.643 and about 440 at 3.571, against a 313 input. The old field set the same face, tracking and width                                                                                           | defer        |
| 14  | BH    | `features/auth/VerifyEmailScreen.tsx`                                                                   | During a resend Confirm and the code field ignore the user, and the field no longer reports a disabled state                           | medium  | As row 10: the same defect                                                                                                                                                                                                                                                                                                | bad_spec     |
| 15  | BH    | `features/auth/components/PasswordStrengthIndicator.tsx`                                                | Strength changes are never announced                                                                                                   | low     | Real, and pre-existing: the old meter's word was plain text with no live region either                                                                                                                                                                                                                                    | defer        |
| 16  | BH    | `shared/components/ConsentCheckbox.tsx:81-82`                                                           | The box's centring assumes text scales linearly, which Android 14 does not                                                             | low     | Real: React Native 0.83 converts sp through `TypedValue.applyDimension` (`PixelUtil.kt:43-44`), which applies Android 14's non-linear curve, while `fontScale` stays linear, so the box sits a few points low at large sizes there. Cosmetic, Android 14 only and unverified on a device; the fix measures the first line | reject       |
| 17  | BH    | `FormScreen.tsx` (`FOOTER_LINK_IN_BODY_MIN_FONT_SCALE`), `ActionRow.tsx:19`, `DataSummaryScreen.tsx:69` | The 1.5 breakpoint now lives in three copies                                                                                           | low     | Real, developer-only: it bites only if one copy changes, and the fix adds a shared export, as Story 22.8's row 11 ruled                                                                                                                                                                                                   | reject       |
| 18  | BH    | `FormScreen.tsx`'s comment, `cardi-design-system.md` _Authentication_                                   | Both call 1.5 "the first of the accessibility sizes" beside numbers that put it between two sizes                                      | low     | Real: 1.5 is a cut-off between iOS's xxxLarge (1.353) and its first accessibility size (1.786), as Story 22.8's row 55 corrected in What We Collect                                                                                                                                                                       | patch (moot) |
| 19  | BH    | `cardi-design-system.md` _Authentication_                                                               | The breakpoint's sentence ends mid-thought                                                                                             | false   | "the breakpoint settings' rows (`ActionRow`) and What We Collect already restack at" is a whole relative clause                                                                                                                                                                                                           | reject       |
| 20  | BH    | `cardi-design-system.md` _Authentication_                                                               | Its known gaps stop at item 10, and its Large text paragraph says nothing clips                                                        | low     | Real: Found, not fixed 11 is missing, and row 13's digits do clip                                                                                                                                                                                                                                                         | patch (moot) |
| 21  | BH    | `features/auth/VerifyEmailScreen.tsx` (`onWrongEmail`)                                                  | "Wrong email? Go back" leaves the original form beneath, stale, with the old address, password and consent                             | medium  | Real, and pre-existing: `router.replace` swaps only the code screen, and the native back reached the same stale form before                                                                                                                                                                                               | defer        |
| 22  | BH    | `shared/components/ui/FormScreen.stories.tsx` and the auth components                                   | The redesigned pieces have no visual coverage, and the stories draw stand-ins                                                          | low     | Real, but the design system gives stories to `shared/components/ui/` primitives only, as Story 22.8's row 15 ruled; the fix adds primitives                                                                                                                                                                               | reject       |
| 23  | BH    | `features/auth/VerifyEmailScreen.test.tsx`, `RecoveryOtpScreen.test.tsx`                                | The suites still depend on their fake-timer tests running last                                                                         | low     | Real, and pre-existing: #248 item 13. The rewrite keeps those tests last                                                                                                                                                                                                                                                  | defer        |
| 24  | BH    | `features/auth/CreateAccountScreen.test.tsx`                                                            | A test title pins Found, not fixed 1 as intended behaviour                                                                             | false   | The order it pins, consent stored after `signUp` succeeds, is a frozen Keep; changing it is Found, not fixed 1's own story                                                                                                                                                                                                | reject       |
| 25  | EC    | `features/auth/CreateAccountScreen.tsx:124-133`                                                         | Consent alone invalid with its row below the visible body: its message is out of sight                                                 | medium  | As row 11                                                                                                                                                                                                                                                                                                                 | bad_spec     |
| 26  | EC    | `features/auth/VerifyEmailScreen.tsx:406-421`                                                           | After a rejected code, appending a digit re-sends the same code on every keystroke                                                     | low     | Real, and pre-existing: the old handler sliced to 8 and submitted the same way                                                                                                                                                                                                                                            | defer        |
| 27  | EC    | `features/auth/VerifyEmailScreen.tsx:357-365`, `:425-435`                                               | Confirm pressed during a resend is dropped silently                                                                                    | medium  | As row 10                                                                                                                                                                                                                                                                                                                 | bad_spec     |
| 28  | EC    | `shared/components/ConsentCheckbox.tsx:81-82`                                                           | On Android 14 the box sits off the first line's centre                                                                                 | low     | As row 16                                                                                                                                                                                                                                                                                                                 | reject       |
| 29  | EC    | `shared/components/ui/FormScreen.tsx:249-252` and the screens' focus calls                              | An already-focused invalid field scrolled out of view stays out of view at the next press                                              | low     | Real: `focus()` on a focused input sends no focus event, so nothing scrolls. The same root as row 11: this spec revealed an invalid field only through its focus                                                                                                                                                          | bad_spec     |
| 30  | EC    | `features/auth/SignInScreen.test.tsx`, `CreateAccountScreen.test.tsx`                                   | No test pins the Never list's "add a sign-in method"                                                                                   | low     | Real: no auth suite counts its controls, against the task "every absence the Never list states"                                                                                                                                                                                                                           | patch (moot) |

**Pass 2 (2026-10-21).** The same four layers reviewed derivation 2's diff. They raised 24 findings;
three hold two separate claims, which gives 27 rows, two of them carried. Nothing routes to `intent_gap`
or `bad_spec`, so there is no loopback: the patch rows go to derivation 2's implementer, and the
defer rows are recorded under Found, not fixed (18 to 22) and in `deferred-work.md`.

| #   | Layer | Location                                                                                                | Claim                                                                                                                                                                | Verdict     | Evidence                                                                                                                                                                                                                                                                                                         | Route  |
| --- | ----- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 31  | PC    | `features/auth/SignInScreen.tsx:4` and eight more                                                       | The auth surfaces style with React Native's `StyleSheet`, not Unistyles'                                                                                             | false       | carried: row 1                                                                                                                                                                                                                                                                                                   | reject |
| 32  | VG    | `features/auth/CreateAccountScreen.tsx:149`, `ForgotPasswordScreen.tsx:79`, `NewPasswordScreen.tsx:115` | Nothing pins that the next request clears the banner while it runs on three screens                                                                                  | medium      | Pre-verified: deleting `setError(null)` from any of the three handlers passes every suite, against the frozen Request failed row; a repeated failure would then neither scroll nor announce again                                                                                                                | patch  |
| 33  | VG    | `features/auth/VerifyEmailScreen.tsx:220-224`, `:542-546`                                               | The resend row's look and words while a request runs are unpinned                                                                                                    | low         | Pre-verified: drawing the busy row as the link passes every suite                                                                                                                                                                                                                                                | patch  |
| 34  | VG    | `docs/design/cardi/cardi-design-system.md:1523`                                                         | The record says the resend row's names and states are as before, untrue while a request runs after the cooldown                                                      | low         | Real: the row now reads "Resend code", muted and disabled, where the old one read "Resend in 0:00" (#248 item 14), an improvement the record misstates                                                                                                                                                           | patch  |
| 35  | BH    | `shared/components/ui/FormScreen.tsx:260`, the screens' `Keyboard.dismiss()`                            | A field focused during a slow request is hidden behind the footer once the failure's banner scrolls into view, so "nothing is typed while a request runs" overclaims | medium      | Real: the fields stay editable while busy, and `useFocusedFieldInView` ignores the column moving, so after a refocus and a failure the banner's scroll leaves the focused field under the footer with the keyboard up. The code field's dropped keystrokes meanwhile are low, Confirm's spinner showing the work | patch  |
| 36  | BH    | `features/auth/ForgotPasswordScreen.tsx:127`                                                            | Send Reset Code's spoken name does not contain its visible words (WCAG 2.5.3)                                                                                        | medium      | Real, and pre-existing: the old button had the same name, "Send password reset code", over "Send Reset Code"                                                                                                                                                                                                     | defer  |
| 37  | BH    | `cardi-design-system.md:979`, `FormScreen`'s `primaryAction.accessibilityLabel`                         | The record lets a button take a name that differs from its label, inviting names without the visible words                                                           | low         | Real: the rule as written allows a name that drops the label's words                                                                                                                                                                                                                                             | patch  |
| 38  | BH    | `features/auth/VerifyEmailScreen.tsx:433-434`                                                           | Confirm pressed on a whole code arms "Enter the 8-digit code.", so retyping after a rejected code reddens the field under the banner                                 | low         | Real: `handleConfirm` sets `hasAttemptedSubmit` before it checks the code is whole, and nothing clears it when the check starts, as a successful resend does                                                                                                                                                     | patch  |
| 39  | BH    | `cardi-design-system.md:633-664`, `:1059-1066`                                                          | The record's footer and failed-request passages contradict the amendment                                                                                             | low         | Real: `:1062` still puts the banner first with a scroll to the top, `:1065` credits the hooks with clearing it, and the footer section names no link row and no decision 3, and says "Both form screens" after "all eight" (`:639`, `:656`)                                                                      | patch  |
| 40  | BH    | card setup and card edit (no `keepFocusedFieldInView`, no dismissal)                                    | A failed save with the keyboard up can leave the focused field under the footer                                                                                      | medium      | Real, and pre-existing: Story 22.6's setup and edit scroll a failure to the top with the keyboard up, as before this story                                                                                                                                                                                       | defer  |
| 41  | BH    | `cardi-design-system.md:1024-1025`                                                                      | The record exempts setup and edit because a save that succeeds leaves the screen, ignoring a failed save                                                             | low         | Real: a failed save stays, as row 40 shows                                                                                                                                                                                                                                                                       | patch  |
| 42  | BH    | `cardi-design-system.md` known gap 14                                                                   | The record's gap 14 names only create account, though recovery's "Go back" leaves a stale forgot password too                                                        | low         | Real: recovery's `onWrongEmail` replaces the code screen with a new forgot password over the first, which keeps the old address                                                                                                                                                                                  | patch  |
| 43  | BH    | `SignInScreen.tsx:119`, `CreateAccountScreen.tsx:164-166`, `ForgotPasswordScreen.tsx:95`                | A request finishing after the user has left still navigates                                                                                                          | medium      | Real, and pre-existing: the handlers navigated after the await the same way when the native back was there                                                                                                                                                                                                       | defer  |
| 44  | BH    | `features/auth/components/PasswordInput.tsx:18-30`                                                      | The return key moves nowhere and submits nothing                                                                                                                     | low         | Real, and pre-existing: #268 item 17                                                                                                                                                                                                                                                                             | defer  |
| 45  | BH    | the screens' `FIELD` maps                                                                               | `bringFieldIntoView(index)` ties each screen to its children's order by hand                                                                                         | low         | Real, developer-only: a reorder would scroll to the wrong field, and the fix names fields, a new API                                                                                                                                                                                                             | reject |
| 46  | BH    | the suites' `controls()`                                                                                | The controls check would miss a native sign-in button that takes its press under another name                                                                        | maybe-false | The cited button is not installed, and any provider arrives with a new import a review sees; if true, low                                                                                                                                                                                                        | reject |
| 47  | BH    | the five auth suites                                                                                    | About 100 lines of test helpers are repeated in five suites                                                                                                          | low         | Real, developer-only: as Story 22.8's row 40 ruled, the fix adds a shared test module                                                                                                                                                                                                                            | reject |
| 48  | BH    | `features/auth/RecoveryOtpScreen.test.tsx`                                                              | The suite runs every test at a font scale of 2                                                                                                                       | low         | Real: it never sets one, so its link always closes the body                                                                                                                                                                                                                                                      | patch  |
| 49  | BH    | `PasswordStrengthIndicator.test.tsx:127`, `AppIconHeader.test.tsx:65`                                   | Two tests that read source can fail on a comment or a reflow                                                                                                         | low         | Real: one bans three words anywhere in the file, comments included; the other matches one exact line                                                                                                                                                                                                             | patch  |
| 50  | EC    | `shared/components/ui/FormScreen.tsx:250-258`                                                           | A field the caller asked for stays followed through a request, so a later relayout can scroll away from the banner                                                   | low         | Real: `bringFieldIntoView` follows until another field takes the focus, and the dismissal's relayout brings the followed row back                                                                                                                                                                                | patch  |
| 51  | EC    | `shared/components/ui/FormScreen.tsx:264-283`                                                           | With consent followed and another field focused, consent moving scrolls the field being typed into away                                                              | low         | Real but unlikely: it needs a refused consent press and then edits to a field above it; the fix tracks two indexes                                                                                                                                                                                               | reject |
| 52  | EC    | `shared/components/ui/FormScreen.tsx:409-417`                                                           | A child rendering null still gets a wrapper and a 32 gap                                                                                                             | low         | No caller has one: every auth screen's direct children draw                                                                                                                                                                                                                                                      | reject |
| 53  | EC    | `shared/components/ui/FormScreen.tsx:264-294`                                                           | An unmounted wrapper keeps its frame and its follow                                                                                                                  | low         | No caller unmounts a direct child                                                                                                                                                                                                                                                                                | reject |
| 54  | EC    | `features/auth/CreateAccountScreen.tsx:153-172`                                                         | A late success navigates over the screen the user went to                                                                                                            | medium      | As row 43                                                                                                                                                                                                                                                                                                        | defer  |
| 55  | EC    | `features/auth/VerifyEmailScreen.tsx:151-152`                                                           | Recovery begun from welcome leaves forgot password beneath new password, whose back then shows                                                                       | low         | Real, and pre-existing: `dismissTo('/')` finds no Home there, so the screens beneath stay, and the native header's back showed the same                                                                                                                                                                          | defer  |
| 56  | EC    | `features/auth/NewPasswordScreen.tsx:42`, the record                                                    | New password's comment and the record say it is alone on the stack after recovery                                                                                    | low         | Real: not when recovery began from welcome (row 55)                                                                                                                                                                                                                                                              | patch  |
| 57  | EC    | `shared/components/ConsentCheckbox.tsx:81-82`                                                           | On Android 14 the box sits off the first line's centre                                                                                                               | low         | carried: rows 16 and 28                                                                                                                                                                                                                                                                                          | reject |

## Design Notes

Measurements are in pt. The frames are drawn at 393 × 852 in light; `cardi-design-system.md` wins
any conflict.

**The shape (`FormScreen`, extended).** All six screens draw it. Its ground, body padding, 32pt
field gap, banner, anchored footer, keyboard handling and always-enabled primary are _Forms_'.
`FormScreen` gains what auth needs, and nothing changes for a caller that passes none of it:

- **An opening block,** drawn first in the body, above the banner and the fields. Auth passes its
  brand block.
- **A header without a title** (decision 1), when the screen's heading is in the body: the back
  alone in its 48 row, its stroke on the 24 margin as `ScreenHeader` places it. `ScreenHeader` may
  take its title as optional for this. With no back either, there is no header row at all, and the
  body starts at the top inset.
- **A row under the primary in the footer** (decision 2): the way-out link, 8 below the button.
  From a font scale of 1.5 (decision 3) it leaves the footer and closes the body instead: the last
  thing in the scroll, 32 below the last field, as the fields are spaced, and scrolling with them.
  It is the breakpoint settings' rows and What We Collect restack at (`ActionRow.tsx:19`,
  `DataSummaryScreen.tsx:69`). 1.5 is a cut-off between iOS's xxxLarge (1.353) and its first
  accessibility size (1.786), where Android's 150% setting sits, as What We Collect's comment puts
  it; the code and the record say so (review pass 1, row 18). React Native's Jest mock reports a font
  scale of 2, so pin the scale in every test that depends on where the link sits.
- **The busy name from the caller**, "Saving..." when none is given.
- **The banner in view.** With an opening block above it, a failed request scrolls the body to the
  banner rather than to the top, so a tall block or large text cannot leave it below the fold.
- **The focused field in view.** When the keyboard shows, or focus moves, a field below the visible
  body, or behind the footer, is scrolled up until the field and its label sit above the footer.
  Nothing scrolls if it is already in view. See the Code Map for what React Native does and does
  not do; verify the route against the installed source, and see it work on a 375 × 667 iPhone as
  well as the 393 one.
- **A field brought into view on request** (review pass 1, rows 11, 25 and 29). The caller can ask
  the form to bring one of its fields (a child, counted from the first) into view by the focused
  field's rule, whether or not that field can take the focus. A refused press uses it (_Validation_).

**The back.** It runs `router.back()` and shows only where the stack has a screen beneath, as the
native header's did. New password after a recovery begun from Home is alone on the stack, so it has
none. Reached from Settings, or after a recovery begun from welcome (Found, not fixed 22), it has a
screen beneath and shows its back. The six routes take `headerShown: false` and keep their `title`
options.

**The brand block** (frames A–E):

- **The mark.** `AppIconHeader` as shipped, centred: the 80 ink circle with the 40 mark. The frames'
  hand-built ì is a stand-in for it (Story 20.4). Its 48 below becomes `SPACING.xl`, 32, as the
  frames draw (review pass 1, row 3).
- **The heading.** `headlineMd` in `textPrimary`, centred, announced as the screen's heading; it
  wraps under large text. It keeps its testID (`sign-in-title` and so on).
- **The subtitle.** `bodyMd` in `textSecondary`, centred, 8 below the heading, keeping its testID.
  On the code screen the address is set in `bodyMdStrong` `textPrimary` within the sentence (frame
  D); the sentence's wording does not change.
- 32 below the subtitle comes the first field or, after a failed request, the banner, with the first
  field 16 below it (frame F).
- Forgot password draws the mark too (frame C), where today it hides it.

**Fields.** `TextField` as _Forms_ rules it: labels uppercased by style, at least 48 tall, values in
`bodyLg`, 32 apart. That overrules the frames' Title Case labels, 52pt fields, 15pt values and 16pt
gaps. The fields keep their keyboards, autofill, names and hints.

- **The eye** (`PasswordInput`). Lucide `eye` while hidden and `eye-off` while shown, at 24 / 1.5 in
  `textSecondary`, centred in its 48 target at the field's end. A press scales it to 0.98. Its names
  are unchanged.
- **"Forgot password?"** A solo link at the end of the row, 8 below the password field (below its
  message when one shows): `bodyMdStrong` in `link`, in a 48 row.

**Links** (`AuthLink`). The lead-in is `bodyMd` in `textSecondary`, the action `bodyMdStrong` in
`link`: ink in light, beam in dark, with no underline. A solo link ("Back to Sign In") is the action
alone. The row is at least 48 tall, centred, and one button named as today. A press scales the row
to 0.98, as the system's text rows do.

**The strength meter** (`PasswordStrengthIndicator`, frames B and E). It counts rather than judges.

- 8 below the password field (below its message when one shows), full width: a track of three equal
  segments, then the word, 8 after it.
- Each segment is 4 tall, fully rounded, 4 apart. Weak fills one, fair two and strong three, so the
  fill spans a third, two thirds or all of the track. Filled segments are `textPrimary` and empty
  ones `border`, at every strength.
- The word is `labelBold` in `textPrimary`: a label, the chrome tier.
- It is one element for assistive technology, named by a new `auth.passwordStrength.accessibilityLabel`,
  "Password strength: {{strength}}" ("Sicurezza della password: {{strength}}"). Nothing animates.
- testIDs: `password-strength-indicator`, `-track`, `-label`, and `-segment-<n>` from 0. `-bar` goes.

**The consent row** (`ConsentCheckbox`, frame B), 32 below the confirm field.

- **The box,** drawn 24 × 24 at radius 4: the frames' proportion, since 12 would make it a radio.
  Unticked, it is `surface` with a 1 `border` outline. Ticked, it is `primary` with Lucide `check` at
  16 / 2 in `onPrimary`: white on ink, ink on beam. The glyph is sized to its box, as the colour
  picker's check is to its swatch (_Forms_).
- Its press target is 48 × 48, with the box centred, so the drawn box sits on the margin and the
  sentence starts 12 after it. The box is centred on the sentence's first line. It stays the
  checkbox, with its name, hint, state and testIDs.
- **The sentence** is `bodyMd` in `textSecondary`. "Privacy Policy" is `bodyMdStrong` in `link`,
  underlined, since it is a link inside prose. It keeps its role, hint, testID and route.
- **Unticked at the press.** `auth.validation.consentRequired` shows under the row as a
  `FieldError`, and the box's outline turns `error` until it is ticked.

**The code field** (frame D). A `TextField`, extended only as far as this needs:

- It is labelled `auth.fields.verificationCode`, "Verification Code" ("Codice di verifica"), since
  _Input fields_ gives every field a label. It keeps its name
  (`auth.accessibility.verificationCodeLabel`), its hint and `otp-input`.
- The digits are in `monoCodeLg`, centred, and tracked only once there are digits. The placeholder,
  "8-digit code", is in the body face, centred. The field is at least 48 tall, over the frame's 56.
- It keeps `number-pad`, `autoComplete="one-time-code"`, `maxLength` 16, selecting its text on focus,
  and focus on mount.
- While either of the screen's requests runs (a code check or a resend), it takes no input and
  does not dim (review pass 1, rows 10, 14 and 27).
- **Confirm** is always enabled. Pressed with fewer than 8 digits, a new
  `auth.validation.codeIncomplete`, "Enter the 8-digit code." ("Inserisci il codice a 8 cifre."),
  shows under the field, and the field takes focus. The 8th digit still submits at once.

**The resend row**, 16 below the field (below its message when one shows), centred, at least 48 tall.

- While counting, it shows "Resend in m:ss" in `bodyMd` `textSecondary`. Once available, it shows
  "Resend code" in `bodyMdStrong` `link`, and a press scales it to 0.98. While a request runs after
  the cooldown, it reads "Resend code" in the countdown's muted `bodyMd`, disabled, where the old row
  read "Resend in 0:00" (row 34). Otherwise its names and states are as today.
- **A resent code.** `resendSuccess` shows as one plain line, 8 below the row: `bodyMd` in
  `textSecondary`, centred, with no box, icon or tint, and announced politely. It clears as today.
- **Busy during either request** (review pass 1, rows 10, 14 and 27). While a code check or a resend
  runs, Confirm is busy, named for the request running: "Verifying..." for a check and, for a
  resend, a new `auth.busy.resendCode`, "Sending code..." ("Invio del codice..."). The resend row
  reports busy, as today. Today's shared `loading` already made Confirm busy during a resend, so a
  press on Confirm, or a keystroke, is never dropped while the screen shows nothing at work.
- **The request flags** are named `isVerifying` and `isResending`, with the `is` the loading-state
  rule gives every such flag (`docs/project-context.md:318-323`; review pass 1, row 2).

**Busy names** (new strings):

| Screen         | English              | Italian                         |
| -------------- | -------------------- | ------------------------------- |
| Sign in        | Signing in...        | Accesso in corso...             |
| Create account | Creating account...  | Creazione dell'account...       |
| Forgot         | Sending code...      | Invio del codice...             |
| Code           | Verifying...         | Verifica in corso...            |
| Code, resend   | Sending code...      | Invio del codice...             |
| New password   | Updating password... | Aggiornamento della password... |

**Validation**, the form pattern's. Errors appear at the first press of the primary, then follow
typing; the first invalid text field takes focus. Create account's email no longer errs on blur.
Nothing is sent while a field is invalid, and the button stays enabled. The `password-requirements`
caption goes from create account and new password, as frames B and E draw them: the rule stays in
the placeholder, the validation message and the field's hint.

A refused press brings its first invalid field into view (its label, its control and its message)
whether or not that field can take the focus. A text field takes the focus and is brought into view
even when it already had it; the consent row, which takes none, is brought into view. No press is
refused out of sight (review pass 1, rows 11, 25 and 29).

**A failed request** (frame F, _Forms_). One `RequestErrorBanner`, with today's message:

- it keeps `server-error`, or `verify-email-banner` on the code screen, and it is brought into view
  and announced;
- no field reddens, and there is no toast;
- it stays until the next request starts, and typing no longer clears it.

On the code screen that covers `incorrectCode`, `expiredCode` (which also unlocks resend),
`verifyUnavailable` and `resendFailure`. The banner and the resent line never show together.

**A request and the keyboard** (review pass 1, row 12). Every request (the primary's press on a
valid form, the code's 8th digit and a resend) dismisses the keyboard as it starts. The footer comes
down with it, and a failed request's banner is then brought into view with the fields below it,
none behind the footer. The fields stay editable while a request runs, so a failure below the brand
block dismisses the keyboard again, when one of the form's own fields holds it (row 35; code-review
loop, round 1). Only the code field ignores input while busy. A refused press keeps the keyboard,
and its first invalid field takes the focus. With the keyboard up, the banner and the focused field
could not both be in view on a 393 phone.

**Dark mode** (no frame draws it). Every value is a theme role:

- the ground `#000000`;
- the fields `surface` ink `#181824`, outlined `#3A3A48`, with the focus outline in beam;
- cream text, with muted `#B5B5AB`, and links in beam;
- the primary in beam, with an ink label and spinner;
- the banner ink, outlined and worded in `#FF453A`;
- the meter cream on `#3A3A48`;
- the consent box ink, outlined `#3A3A48`, and ticked in beam with an ink check;
- the mark's ink circle unchanged.

**Large text.** From a font scale of 1.5 the way-out link closes the body (decision 3). The heading,
subtitle, labels, links and the meter's word wrap; the fields and the
footer grow; the body scrolls. Nothing clips, but for two known gaps: the heading breaking
mid-word at the largest sizes (Found, not fixed 11) and the code's digits outgrowing their field
from a font scale of about 2.6 (Found, not fixed 12).

**Record** an `### Authentication` section in `cardi-design-system.md`, after `### Documents`, headed
"**RULED 2026-10-21 (Story 22.9)**, from `frames/cardi-auth-frames.html` and
`stitch-prompts-auth.txt`". It holds:

- every ruling above;
- the way-out link's move at the largest sizes (decision 3) as a ruling, replacing the ⚠️ OPEN
  note step 3 left in the _Authentication_ section;
- _Forms_ amended: the auth screens have moved onto it; the opening block, the header without a
  title, the footer's link row and the caller's busy name; and the focused field brought into view;
- _Components_' `FormScreen` row amended to match;
- _Icons_: the auth screens leave MaterialIcons (the root stack's back, forgot password's chevron,
  the eye, the code screen's notices and the consent check);
- the rules review pass 1 added, in _Forms_ and _Authentication_: the field brought into view on
  request, and a refused press revealing its first invalid field; the keyboard dismissed as a
  request starts; Confirm busy during either of the code screen's requests;
- the 1.5 breakpoint described as a cut-off (review pass 1, row 18);
- its known gaps, pointing at Found, not fixed by number and listing every item, 11 and those review
  pass 1 deferred included, with a Large text paragraph that names the two that clip or break
  (review pass 1, row 20); and its unverified list: Android, VoiceOver and TalkBack, and autofill
  from a real e-mail.

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors.
- `yarn lint` -- expected: no errors, no warnings.
- `yarn format:check` -- expected: clean, untracked docs included.
- `yarn test` -- expected: all suites green.

**Manual checks:**

- **iOS simulator, light and dark, at 393 and at 375 × 667.** Check:
  - frames A–E at rest, in English and in Italian;
  - each screen's field errors, busy state and a failed request (frame F), forcing the request to
    fail or hang over Metro's debugger;
  - the meter at weak, fair and strong;
  - the code screen counting, with resend available, after a resend and after a failed code;
  - the keyboard up on each field, the lowest field included;
  - the largest text size on every screen;
  - card setup and card edit against `main`.
- **Unchecked here:** Android, for which this host has no phone emulator; VoiceOver and TalkBack;
  one-time-code autofill from a real e-mail.

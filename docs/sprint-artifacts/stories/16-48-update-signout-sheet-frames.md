---
baseline_commit: '4bbfcbd1cd08640a3a80b08f6614744ee6cb8aac'
title: 'The sign-out design frames still draw the old two-button sheet, so the design source contradicts the shipped screen'
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

**Problem:** Story 16.45 replaced the sign-out sheet with three stacked buttons -- "Sign out, keep cards" (secondary), "Sign out and erase cards" (destructive), then Cancel -- and a body that says what each choice does to the cards on the device. The design source still draws the old sheet: two buttons ("Sign Out", "Cancel") and the old body ("Your cards will remain on this device."). The design files are the frame source for the Cardì system and are read by agents and by whoever implements the next screen, so a stale frame teaches the wrong thing.

**Approach:** Update frame D in `docs/design/cardi/frames/cardi-settings-frames.html` and the sign-out section of `docs/design/cardi/stitch-prompts-settings.txt` to the shipped three-button sheet and its body, and settle the one open question the sheet raises: Keep and Cancel are currently the same outlined variant.

**Decisions (pending ifero's approval):**

- **The frames match the shipped sheet.** Three stacked actions in the shipped order: keep (secondary), erase (destructive), Cancel (outlined). The body is the shipped copy.
- **Keep and Cancel must not look identical.** This is the note the issue raises and the 16.45 review logged as row 11 (_"Keep and Cancel are both outlined `secondary` buttons and look the same"_, routed _"to the human"_). The frame cannot be updated until this is settled, and the settled rule must also be applied to the shipped `SignOutSheet.tsx` so the frame and the screen agree.

## Boundaries & Constraints

**Always:** The frame's geometry follows the Cardì sheet pattern (the sheet body, the action stack, the 48pt targets). The Stitch prompt describes the same layout in the same terms as the other sheets in that file, so the two sources stay in step. Any change to the shipped sheet's button variants is applied to the frame and the prompt together.

**Never:** Change the sign-out _behaviour_ -- keep, erase and Cancel keep their 16.45 semantics, and the erase still runs only after a successful sign-out. Change the sign-out body copy. Touch the other settings sheets' frames. Change the shipped `SignOutSheet.tsx` behaviour to match the old frame. Commit, push, or change sprint-status.yaml or any other tracker file: the orchestrator owns all three.

## I/O & Edge-Case Matrix

| Scenario       | Input / State                | Expected Output / Behavior                                            | Error Handling |
| -------------- | ---------------------------- | --------------------------------------------------------------------- | -------------- |
| Frame D        | The settings frames are read | The sign-out sheet shows three actions and the shipped body           | N/A            |
| Stitch prompt  | The prompt is read           | The sign-out sheet is described as three actions, with the same order | N/A            |
| Keep vs Cancel | The sheet is open            | Keep and Cancel are visually distinguishable                          | N/A            |
| Shipped screen | The sign-out sheet is opened | It matches the updated frame                                          | N/A            |

</frozen-after-approval>

## Code Map

- `docs/design/cardi/frames/cardi-settings-frames.html:1479-1497` -- frame D, the sign-out sheet: `<span class="sheet-title">Sign Out?</span>`, the body _"You will return to guest mode. Your cards will remain on this device."_, `<button class="btn-destructive">Sign Out</button>`, `<button class="btn-outline">Cancel</button>`. The caption at `:1496` reads _"D -- Sheet: confirm"_.
- `docs/design/cardi/stitch-prompts-settings.txt:213-217` -- the sign-out sheet prompt: the title in Space Grotesk 20px bold and the two-button CONFIRM spec; `:31` lists the sheets that use the two-button CONFIRM pattern ("ExportConfirmationSheet, SignOutSheet, ImportPreviewSheet,").
- `docs/design/cardi/stitch-prompts-settings.txt:168` -- the frame that has no Sign Out at all (the guest settings frame); unchanged.
- `features/settings/components/SignOutSheet.tsx` -- the shipped sheet: `:51` `signout-keep`, `:62` `signout-erase`, `:73` `signout-cancel`. The variant each button uses decides the Keep-vs-Cancel ruling.
- `shared/i18n/locales/en.ts:214-220` -- `settings.signOutSheet.{title, body, keepCards, eraseCards, eraseFailed}`; the Italian copy is at `shared/i18n/locales/it.ts:214-220`.
- `features/settings/components/DeleteAccountSheet.tsx:19` -- the sibling sheet, whose header comment records the same inverted-CTA-order convention; the sign-out sheet's three-button layout is a different case and the frame must say so.
- `docs/design/cardi/cardi-design-system.md` -- the sheet and button sections the frame must satisfy.
- `docs/design/cardi/tools/verify.py` -- the frame checker (`yarn frames:check`), which compares the frames against their generators; the update must keep it green.
- Do not change: the shipped sheet's behaviour, the sign-out copy, the other frames.

## Tasks & Acceptance

**Execution:**

- [ ] Settle the Keep-vs-Cancel variant rule (the 16.45 review's row 11, routed to the human) and record it in `docs/design/cardi/cardi-design-system.md` or the sheet section of the design system, so the next sheet does not repeat the question.
- [ ] `features/settings/components/SignOutSheet.tsx` -- apply the settled rule to the shipped buttons, so the screen and the frame agree.
- [ ] `docs/design/cardi/frames/cardi-settings-frames.html` -- frame D: three stacked actions (keep / erase / Cancel) in the shipped order, with the shipped body; update the caption if it names the sheet's shape.
- [ ] `docs/design/cardi/stitch-prompts-settings.txt` -- the sign-out section describes the same three actions and the same body; remove `SignOutSheet` from the two-button CONFIRM list at `:31` if the list is meant to be exhaustive.
- [ ] `yarn frames:check` -- green.

**Acceptance Criteria:**

- Given the settings frames, when frame D is read, then the sign-out sheet shows three actions -- keep, erase and Cancel -- and the body states what each choice does to the cards on the device.
- Given the Stitch settings prompt, when the sign-out sheet is read, then it describes the same three actions in the same order as the frame.
- Given the shipped sign-out sheet, when it is opened, then its three actions are visually distinguishable from each other, and it matches the updated frame.
- Given `yarn frames:check`, when it runs, then it passes.

## Design Notes

A design file that contradicts the shipped screen is worse than no design file: the next person (or agent) reads it as the specification. This story is the smallest unit that makes the two agree.

The Keep-vs-Cancel collision is the one thing that needs a human ruling. Three buttons in a stack, two of them outlined, reads as one primary action that has vanished. The options are: Cancel becomes a tertiary (borderless, muted) action while Keep stays secondary; or Cancel keeps the outline and Keep becomes tertiary; or Cancel moves out of the stack entirely and becomes the sheet's close affordance. Whichever is chosen, the frame, the prompt and the component must show the same thing.

## Implementation Notes

- Source issue: #313, filed from
  `docs/sprint-artifacts/stories/16-45-signout-keep-or-erase-cards.md` section "Found, not fixed".
- The 16.45 review logged it as row 13: _"Frame D and the Stitch settings prompt still show the
  two-button sheet; story 22-7 names `signout-confirm`"_ -- verdict **defer**, with the note _"the design
  files (Found, not fixed); 22-7 is a historical record of a merged story, not a live reference"_. This
  story discharges that deferral.
- The shipped sheet's button order is keep (`:51`), erase (`:62`), Cancel (`:73`): destructive in the
  middle, Cancel last. The frame must show that order, not the conventional destructive-last one.
- The 16.45 story's frozen decision recorded the body as warning that _"cards not yet synced to it are
  lost for good if you erase"_. The frame's body must carry that warning, or the frame understates what
  the screen says.
- `docs/design/cardi/tools/verify.py` is the frame gate (`yarn frames:check` in
  `.github/workflows/ci-quality-gates.yml:106`). It compares the frames against their generators, so a
  hand-edited frame can fail it -- run it before the story closes.
- The frames are a local, committed source; the Figma canvas is a separate surface that this story does
  not touch (see #281 item 13, which records the same split for the onboarding canvas).

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**

- `yarn typecheck` -- expected: no errors
- `yarn lint` -- expected: no errors
- `yarn format:check` -- expected: clean
- `yarn test` -- expected: all suites pass
- `yarn frames:check` -- expected: the frames match their generators

**Manual checks (if no CLI):**

- Open `docs/design/cardi/frames/cardi-settings-frames.html` and read frame D against the shipped
  `SignOutSheet` on a simulator: the same three actions, in the same order, with the same body.

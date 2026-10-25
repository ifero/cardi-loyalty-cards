---
title: 'Story 23.4: The watch widget and complication — the four families on the watch grammar, with the top card'
type: 'feature'
created: '2026-10-25'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Apple Watch complication is a static "open the app" button. Inline is a bare
"Open Cardì"; rectangular a clipped icon and "Open app"; circular and corner the bitmap edge to
edge on a system fill, with no handling for tinted faces and a `#1A73E8` fallback. It reads none of
the App Group keys the watch app already writes and reloads, so it never shows a card. The watch
grammar (§10, Story 23.1) designs all four families around the top card. Its frames draw a
word-form ì that is not the shipped mark, and the choice between the full mark and a reduction is
still open: the epic requires it to be made against a rendered complication.

**Approach:** Wire the widget to the App Group snapshot and draw the four families as §10 rules
them, in beam on ink, legible when the face tints them. Render the full mark and a defined
reduction in every family, full colour and tinted, and let ifero choose at a planned halt. Ship the
chosen mark through the brand-icon generator, keep the 76 px budget, and correct the frames and the
budget comment.

## Boundaries & Constraints

**Always:**

- The job stays "into the wallet in one tap"; every family opens the app (`cardi://watch`).
- The data is the App Group's: `watch.complication.topCardName`, `hasCards`, `cards`. With no card
  or no data, each family falls back to the mark and today's open-app strings.
- Colours are the grammar's: ink `#181824` grounds and discs, beam `#FCCC0C` the mark's beam and the
  app-name label, cream `#F0F0E8` text. No system fill stands in for ink.
- Every family reads as a shape when tinted; that is verified on a tinted face.
- Images stay within the 76 px budget (`maxPoint 38`, `scale 2`); the mark asset comes from
  `scripts/build-brand-icons.mjs`, never by hand, and `yarn icons:check` gates it.
- The complication stays non-configurable (`StaticConfiguration`, no `selectedCard`).
- Every old value removed is asserted absent; each new assertion is seen to fail under its mutation.

**Never:**

- Commit, push, or change `sprint-status.yaml` or any other tracker file: the orchestrator owns all
  three.
- Edit the watch app's views (Story 23.2) or Wear OS (Story 23.3); this story reads the App Group
  the watch app writes and does not change the writer.
- Draw the frames' word-form ì (one cream stem, a floating tick): it is a stand-in for the mark.
- Grow `OpenAppIcon`'s sizes, add an `icon:` key to the widget's target config, or exceed 76 px.
- Show a store line, a card number or any part of one on the watch face (decision 2).

## I/O & Edge-Case Matrix

| Scenario      | Input / State                    | Expected Output / Behavior                                                                            | Error Handling |
| ------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------- |
| Circular      | Any                              | The chosen mark, beam on ink, in the inscribed square of a round disc                                 | N/A            |
| Corner        | A top card                       | The mark in the disc; the card's name on the arc in cream, truncated with "…"                         | N/A            |
| Rectangular   | A top card                       | The mark beside two lines: "CARDÌ" (beam label) over the card's name (cream); no third line           | N/A            |
| Inline        | A top card                       | The mark as the image, the card's name as the text                                                    | N/A            |
| No card       | `hasCards` false, or no snapshot | Circular and corner: the mark; rectangular: the mark and today's open-app title; inline: "Open Cardì" | N/A            |
| Sync          | The phone syncs new cards        | The watch app's existing reload refreshes the complication with the new top card                      | N/A            |
| Tinted face   | Accented or vibrant rendering    | Every family still reads as the mark and its text, by shape                                           | N/A            |
| Asset missing | The mark image fails to load     | The mark is not replaced by a blue glyph; the slot shows the text-only fallback                       | No `#1A73E8`   |
| Tap           | Any family                       | Opens the app at the card list                                                                        | N/A            |

**Decisions (ifero, 2026-10-25):**

1. **Two candidates are rendered, then ifero picks.** The full mark (21.3's `OpenAppIcon`: three
   bars, the beam crossing them) and a reduction: **one bar with the beam crossing it**, the mark's
   middle (widest) bar kept at its width, height and position and the beam unchanged, both from the
   generator's constants. Both are rendered in all four families, full colour and tinted, at the
   smallest size the simulator offers and at 46 mm. The build halts for the pick; only the chosen
   mark ships.
2. **The rectangular family has no third line.** It shows the mark, the app name and the card's
   name. No store and no card number join the snapshot or reach the face.

</frozen-after-approval>

## Code Map

- `targets/watch-widget/WatchComplicationWidget.swift` -- the whole widget: header `:4-10` (static
  by design); provider `:25-28` (one entry, `policy: .never`); view `:38-58` (inline text only
  `:38-39`; rectangular 24×24 icon radius 5 and "Open app" `:40-50`; circular and corner via
  `default:` `:51-55`); `.containerBackground(.fill.tertiary)` `:57`; `.widgetURL("cardi://watch")`
  `:58`; `.renderingMode(.original)` `:69`; the `creditcard.fill` fallback in `#1A73E8`
  `:71-76`; `.configurationDisplayName("Cardì")` `:87`; families `:89-94`. No
  `widgetRenderingMode`, `.widgetAccentable` or `.widgetLabel` anywhere in `targets/`.
- `targets/watch-widget/ComplicationImage.swift` -- ImageIO thumbnail to `maxPoint 38 × scale 2` =
  76 px (`:17`, `:45`); its comment states the corner ceiling two ways (`:11-16`), to be made one.
- `targets/watch-widget/WidgetCardPalette.swift` -- Cardì hexes (`:21-28`), `Color(hex:)`
  (`:87-98`); unused by the widget today.
- `targets/watch-widget/WatchWidgetLocalization.swift`, `en.lproj`/`it.lproj` -- 12 keys, 3 used
  (`inline.open`, `entry.open_app.title`, `.subtitle`); ASCII by convention.
- `targets/watch-widget/Assets.xcassets/OpenAppIcon.imageset` -- 64/128/192 px, opaque, the full
  mark on ink; generated by `scripts/build-brand-icons.mjs:528-539` from the mark constants at
  `:69-94` (`FULL` `:417`; the sizes must not grow, `:524-527`); `--check` at `:1036-1080`
  (`yarn icons:check`).
- `targets/watch/ComplicationProvider.swift:13-60` -- the writer: suite
  `group.com.iferoporefi.myloyaltycards.watch-complication`, keys `watch.complication.topCardName`,
  `.hasCards`, `.updatedAt`, `.cards` (`ComplicationCardSnapshot {id, name, brandId?, colorHex?}`);
  `ComplicationReloader.reloadAllActiveComplications()` reloads kind
  `MyLoyaltyCardsWatchComplication`, called from `WatchSessionManager.swift:291-296` and
  `CardListView.swift:266-272`. The top card is `sortedForDisplay(...).first`. Read-only here.
- Tests: `targets/watch/__tests__/watch-complication-contract.test.ts` (`:27-155`: no ClockKit,
  App Group keys, `StaticConfiguration`, three families asserted (not corner), no `selectedCard`,
  the URL, `ComplicationImage.make("OpenAppIcon")`, the three keys); `test/watch-icons.test.ts`
  (sizes, no alpha, the 76 px literals, containment in the inscribed circle); `test/watch-accent.test.ts`
  (the widget accent beam); `test/app-display-name.test.ts` (the display name).
- Design: `cardi-watch-grammar.md` §10 (`:625-684`), the tinted rule (`:678-681`), the budget
  (`:631-641`), Forbidden (`:716-730`), testing (`:688-712`);
  `frames/cardi-complication-frames.html` from `tools/watch_complication_frames.py` with
  `_watch_shared.py`, whose `mark()` (`:29-68`) draws the word-form ì. The shipped mark is
  `assets/images/cardi-mark-inline.svg`. Story 21.3's render method
  (`21-3-watchos-app-and-widget-icons.md:165-175`, `:282-317`): install with `xcrun simctl`, reboot
  the simulator before the app appears in the complication picker, shoot with `simctl io
screenshot`; inline was never placed on a face.

## Tasks & Acceptance

**Execution:**

- [ ] `scripts/build-brand-icons.mjs` -- the one-bar reduction (decision 1) from the same constants,
      at `OpenAppIcon`'s sizes and containment, for the comparison; after the pick, only the
      chosen mark ships as the widget's image and `icons:check` gates it.
- [ ] `targets/watch-widget/WatchComplicationWidget.swift` -- a provider that reads the snapshot; the
      four families per Design Notes; the empty fallback; tinted rendering; no `#1A73E8`.
- [ ] `targets/watch-widget/ComplicationImage.swift` -- the budget comment stated once (76 px).
- [ ] `targets/watch-widget/*.lproj` -- the strings the families need; unused keys stay.
- [ ] **HALT** after the renders: the comparison shown to ifero, who picks the mark.
- [ ] `docs/design/cardi/tools/_watch_shared.py` / `watch_complication_frames.py` -- the
      complication frames draw the chosen mark; regenerate; `yarn frames:check` passes.
- [ ] `targets/watch/__tests__/watch-complication-contract.test.ts`, `test/watch-icons.test.ts` --
      the families (corner included), the App Group reads, `.widgetLabel`, the absent `#1A73E8`
      and `.fill.tertiary`, the budget held.
- [ ] `docs/design/cardi/cardi-watch-grammar.md` -- §10 records the chosen mark and that the
      rectangular family has two lines (decision 2); repoint its stale widget notes.

**Acceptance Criteria:**

- Given the four families on a watch face at the smallest size the simulator offers and at 46 mm, full colour and tinted, when each is
  shown, then it draws §10 with the chosen mark and reads by shape when tinted.
- Given the renders of both candidates, when ifero picks, then the pick is recorded and only that
  mark ships.
- Given a sync that changes the top card, when the watch app reloads, then the complication shows
  the new name.
- Given `OpenAppIcon` or its replacement, when `yarn icons:check` runs, then it passes.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Design Notes

§10 governs; the frames encode its layout but not its mark, and where §10's prose and the frames
differ, these rulings stand (recorded in §10):

- **"Same avatar rules"** (rectangular) is the mark in a 30 pt round disc, as the frame draws; not
  the card's brand logo.
- **The app-name label** is the frame's: "CARDÌ", beam, 10 pt, 600, uppercase, tracked 0.06 em.
- **Corner arc**: `.widgetLabel` with the card's name, cream; truncation is the system's.
- **No card**: the mark, and today's open-app strings.
- **Reload**: the provider reads the snapshot on each timeline request and keeps `.never`; the
  watch app's existing reload calls drive it.
- **Tinted**: the mark and text are marked accentable as their roles need so the face tints them,
  and each family is checked desaturated.

**The comparison**: both candidates in all four families, full colour and tinted, at the smallest size the simulator offers and at 46 mm,
in one sheet of screenshots, shown inline at the halt. 21.3 measured the full mark at 0.672 of the
circle's radius; the reduction is measured the same way.

## Verification

**Commands:**

- `npx jest --testPathPattern="$PWD/targets/watch/__tests__" --no-coverage` -- expected: pass.
- `yarn watch:build` (after `yarn watch:prebuild` in a fresh worktree) -- expected: builds.
- `yarn icons:check`, `yarn frames:check`, `yarn typecheck`, `yarn lint`, `yarn format:check`,
  `yarn test` -- expected: all pass.

**Manual checks (if no CLI):**

- On the watch simulator at the smallest size the simulator offers and at 46 mm (rebooted after install): each family on a face, full
  colour and tinted, with a top card and with none.
- On ifero's Apple Watch: the chosen mark in every family, inline placed on a face that offers it.

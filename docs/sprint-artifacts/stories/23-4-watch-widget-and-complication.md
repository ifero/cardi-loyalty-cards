---
title: 'Story 23.4: The watch widget and complication — the four families on the watch grammar, with the top card'
type: 'feature'
created: '2026-10-25'
status: 'done'
baseline_commit: 'dcfd8051bca13e963bd5ddbc7ae7a0b2c07a6a79'
route: 'dispatch'
review_loop_iteration: 1
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
budget comment. A family that names a card opens that card's barcode when tapped, through the
per-card deep link the watch app already handles; with no card it opens the card list (decision 3).

## Boundaries & Constraints

**Always:**

- The job stays "into the wallet in one tap". Every family opens the app: on the named card's
  barcode (`cardi://watch-card?id=<id>`) when it names one, otherwise at the card list
  (`cardi://watch`) (decision 3).
- The data is the App Group's: `watch.complication.topCardName`, `hasCards`, `cards`, and the new
  `topCardId` (decision 3). With no card or no data, each family falls back to the mark and
  today's open-app strings.
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
- Edit the watch app's views or its deep-link handling (Story 23.2), or Wear OS (Story 23.3). This
  story reads the App Group the watch app writes. Its one change to the writer is publishing the top
  card's id beside its name (decision 3).
- Draw the frames' word-form ì (one cream stem, a floating tick): it is a stand-in for the mark.
- Grow `OpenAppIcon`'s sizes, add an `icon:` key to the widget's target config, or exceed 76 px.
- Show a store line, a card number or any part of one on the watch face (decision 2).

## I/O & Edge-Case Matrix

| Scenario       | Input / State                             | Expected Output / Behavior                                                                            | Error Handling |
| -------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------- |
| Circular       | Any                                       | The chosen mark, beam on ink, in the inscribed square of a round disc                                 | N/A            |
| Corner         | A top card                                | The mark in the disc; the card's name on the arc in cream, truncated with "…"                         | N/A            |
| Rectangular    | A top card                                | The mark beside two lines: "CARDÌ" (beam label) over the card's name (cream); no third line           | N/A            |
| Inline         | A top card                                | The mark as the image, the card's name as the text                                                    | N/A            |
| No card        | `hasCards` false, or no snapshot          | Circular and corner: the mark; rectangular: the mark and today's open-app title; inline: "Open Cardì" | N/A            |
| Sync           | The phone syncs new cards                 | The watch app's existing reload refreshes the complication with the new top card                      | N/A            |
| Tinted face    | Accented or vibrant rendering             | Every family still reads as the mark and its text, by shape                                           | N/A            |
| Asset missing  | The mark image fails to load              | The mark is not replaced by a blue glyph; the slot shows the text-only fallback                       | No `#1A73E8`   |
| Tap            | Any family naming a card                  | Opens the app on that card's barcode (the card list beneath it)                                       | N/A            |
| Tap, no card   | Any family with no card                   | Opens the app at the card list                                                                        | N/A            |
| Tap, card gone | The named card was removed before the tap | Opens the app at the card list; no barcode for a card that is gone                                    | N/A            |

**Decisions (ifero, 2026-10-25, and 3 on 2026-10-30):**

1. **Two candidates are rendered, then ifero picks.** The full mark (21.3's `OpenAppIcon`: three
   bars, the beam crossing them) and a reduction: **one bar with the beam crossing it**, the mark's
   middle (widest) bar kept at its width, height and position and the beam unchanged, both from the
   generator's constants. Both are rendered in all four families, full colour and tinted, at the
   smallest size the simulator offers and at 46 mm. The build halts for the pick; only the chosen
   mark ships.
2. **The rectangular family has no third line.** It shows the mark, the app name and the card's
   name. No store and no card number join the snapshot or reach the face.
3. **A tap opens the card the face names (ifero, 2026-10-30).** This decision was taken mid-build,
   after review. It replaces the original "every family opens the card list".
   - The watch app also publishes the top card's id: `watch.complication.topCardId`, written
     beside `topCardName` at both call sites.
   - The widget's tap goes to `cardi://watch-card?id=<id>`, the route `CardListView` already
     handles by opening that card's barcode pager.
   - With no card, the tap goes to `cardi://watch`, the card list.

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

**Decision 3: the per-card tap (added 2026-10-30).** The pre-decision code is built and reviewed.
Line numbers refer to the tree at this amendment.

- **The writer** is `targets/watch/ComplicationProvider.swift`, `ComplicationSharedState`
  (`:13-52`).
  - Add `topCardIdKey = "watch.complication.topCardId"`. Write it trimmed beside the name, and
    remove it when there is no card, as `persistTopCardName` handles the name.
  - Both call sites take the card from `WatchCard.sortedForDisplay(...).first` and write its
    name and id: `CardListView.swift:268-270` (`migrateUserDefaults`) and
    `WatchSessionManager.swift:293-295`. The reload after the writes stays as it is.
- **The app's route.** Reuse it as is and do not edit it.
  - `CardListView.swift:472-490` `WatchComplicationDeepLink` takes scheme `cardi`, host
    `watch-card` and query item `id`, trimmed and non-empty.
  - `.onOpenURL` (`:619-624`) calls `openCardRouteIfAvailable` (`:635-644`), which sets
    `navigationPath = [WatchCardRoute(cardId:)]`. That opens
    `BarcodePagerView(openedCardId:liveCards:).id(deepLinkGeneration)` (`:572-579`).
  - An id whose card has not loaded waits in `pendingDeepLinkCardId`, and
    `.onChange(of: displayCards.map(\.id))` (`:626-632`) resolves it. An id that never appears
    leaves the list on screen.
  - `watch-layout-contract.test.ts:473-537` pins this route.
- **The widget** is `WatchComplicationWidget.swift`.
  - `ComplicationSnapshot` also reads `topCardIdKey`, and decodes `id` beside `name` in the
    `cards` snapshot.
  - `WatchComplicationEntry` gains `topCardId`.
  - `.widgetURL` stays once, on the entry view's body, and takes the entry's URL. That is
    `cardi://watch-card?id=<id>`, built with `URLComponents` so the id is percent-encoded, when
    the entry carries an id, and `cardi://watch` otherwise.
- **The tests** are in `watch-complication-contract.test.ts`:
  - the writer's keys and helpers (`:66-75`);
  - the `widgetURL` pin (`:137-145`);
  - the reader-versus-writer literal check (`:150-168`), which gains `topCardIdKey`;
  - the Swift writer-then-reader harness (`:420-500`). Lift `WatchComplicationDeepLink` with
    `swiftDeclaration` so the widget's URL is parsed by the app's own parser.
- **The docs** that state the tap:
  - `cardi-watch-grammar.md` §10 (`:926`, "Every family opens the app at the card list");
  - `targets/watch/README.md:142-143` ("opens the app via `cardi://watch`", "no per-card deep
    link", the routing "that nothing constructs");
  - `docs/architecture.md:1204` ("Tap action");
  - the widget's header comment (`:6`).

## Tasks & Acceptance

**Execution:**

- [x] `scripts/build-brand-icons.mjs` -- the one-bar reduction (decision 1) from the same constants,
      at `OpenAppIcon`'s sizes and containment, for the comparison; after the pick, only the
      chosen mark ships as the widget's image and `icons:check` gates it.
- [x] `targets/watch-widget/WatchComplicationWidget.swift` -- a provider that reads the snapshot; the
      four families per Design Notes; the empty fallback; tinted rendering; no `#1A73E8`.
- [x] `targets/watch-widget/ComplicationImage.swift` -- the budget comment stated once (76 px).
- [x] `targets/watch-widget/*.lproj` -- the strings the families need; unused keys stay.
- [x] **HALT** after the renders: the comparison shown to ifero, who picks the mark.
- [x] `docs/design/cardi/tools/_watch_shared.py` / `watch_complication_frames.py` -- the
      complication frames draw the chosen mark; regenerate; `yarn frames:check` passes.
- [x] `targets/watch/__tests__/watch-complication-contract.test.ts`, `test/watch-icons.test.ts` --
      the families (corner included), the App Group reads, `.widgetLabel`, the absent `#1A73E8`
      and `.fill.tertiary`, the budget held.
- [x] `docs/design/cardi/cardi-watch-grammar.md` -- §10 records the chosen mark and that the
      rectangular family has two lines (decision 2); repoint its stale widget notes.
- [x] `targets/watch/ComplicationProvider.swift`, `CardListView.swift:268-270`,
      `WatchSessionManager.swift:293-295` -- publish `watch.complication.topCardId` beside the
      name (decision 3). No other change to the writer or the app.
- [x] `targets/watch-widget/WatchComplicationWidget.swift` -- the reader attaches the id under the
      Design Notes' tap rule; the entry carries it; `.widgetURL` (once, on the body) per entry.
- [x] `targets/watch/__tests__/watch-complication-contract.test.ts` -- cover the per-card tap
      (decision 3): - the writer publishes the id at both call sites; - the reader's `topCardIdKey` literal equals the writer's; - the tap rule, with the `cardi://watch` fallback; - the harness carries the id from writer to reader, including two cards with the same name; - the widget's URL, parsed by the app's `WatchComplicationDeepLink`, yields the card's id.
- [x] `cardi-watch-grammar.md` §10, `targets/watch/README.md`, `docs/architecture.md`, the widget
      header -- state the tap rule; drop "no per-card deep link" and "nothing constructs".

**Acceptance Criteria:**

- Given the four families on a watch face at the smallest size the simulator offers and at 46 mm, full colour and tinted, when each is
  shown, then it draws §10 with the chosen mark and reads by shape when tinted.
- Given the renders of both candidates, when ifero picks, then the pick is recorded and only that
  mark ships.
- Given a sync that changes the top card, when the watch app reloads, then the complication shows
  the new name.
- Given `OpenAppIcon` or its replacement, when `yarn icons:check` runs, then it passes.
- Given a family that names a card, when it is tapped, then the app opens on that card's barcode;
  given no card, or a card removed before the tap, then the app opens at the card list
  (decision 3).

## Implementation Notes

### The pick (ifero, 2026-10-29)

At the planned halt, ifero compared the two candidates on one sheet of watchOS 26.5 simulator
screenshots. The sheet covered all four families at 40 mm (SE 3, the smallest offered) and 46 mm
(Series 11), in full colour and tinted, with the top card "Esselunga".

- **The mark: the full mark ships.** The candidate is 21.3's `OpenAppIcon`: three bars with the beam
  crossing them. The one-bar reduction is dropped, and only the full mark ships.
  - Both candidates measured 0.679 of the circle's radius at @3x (0.672 on the 1024 icon, as in
    21.3), because the beam's tip, which both keep, is the farthest inked point.
  - In the 40 mm corner disc, the full mark's bars start to merge. ifero accepted that.
- **Rectangular with no card: the spec's single line.** It shows the disc and "Open app", today's
  open-app title. The "CARDÌ" label shows only above a card's name. ifero declined the two-line
  variant, which kept "CARDÌ" over "Open app".
- **Inline glyph (`OpenAppIconGlyph`).** This asset is new and the spec did not name it.
  - The inline family draws its image from the alpha channel alone, so the opaque `OpenAppIcon`
    rendered as a solid square.
  - The glyph is the same full mark, transparent and tightly framed, at 64/128/192 px within the
    76 px budget. `scripts/build-brand-icons.mjs` generates it and `yarn icons:check` gates it.

### State at the halt (what is built, what is left)

**Built and verified** on the watchOS 26.5 simulator (SE 3 40 mm, Series 11 46 mm):

- `yarn watch:build` passes. The watch suites, `icons:check`, `frames:check`, `typecheck`, `lint`,
  `format:check` and `yarn test` all pass.
- **The widget** (`WatchComplicationWidget.swift`):
  - The `ComplicationSnapshot` reader takes the name only when `hasCards` is set and the name is in
    the `cards` snapshot, so a stale name is never shown.
  - It covers the four families, the ink `containerBackground`, and `.widgetLabel` on the corner.
  - On watchOS 11+, the mark uses `.widgetAccentedRenderingMode(.accentedDesaturated)`; on 10 it
    uses `.widgetAccentable()`.
  - If the asset fails to load, the family falls back to text only.
  - Inline with no card shows the glyph and "Open Cardì".
- **The asset:** `OpenAppIconGlyph` is generated.
- **The contract suite** includes a Swift harness that runs the real writer, then the real reader,
  over an in-memory store.
- **Mutations:** all 24 on the contract suite and all 3 on the glyph checks failed as expected.

**Left after the pick** (now done; see "After the pick (done)" below):

- `scripts/build-brand-icons.mjs`: remove `ONE_BAR`, the `bars` option of `shapes()`/`render()`,
  the comparison-candidate entries, and the `OpenAppIconOneBar` and `OpenAppIconOneBarGlyph`
  imagesets. `OpenAppIcon` and `OpenAppIconGlyph` stay as they are.
- **Rectangular with no card:** the code still shows "CARDÌ" over "Open app". Make it the disc and
  "Open app" on one line, per the pick above, and pin that in the contract suite.
- **The complication frames:** draw the full mark in place of the word-form ì, drop the third line
  ("Fidaty · ends 7978") and the `#1A73E8` note, then regenerate.
- **§10:** record the pick, the two-line rectangular, the no-card rectangular, the inline glyph and
  the tinting findings. §10 now sits near `:851`, not at the Code Map's `:625`.

### After the pick (done)

- `scripts/build-brand-icons.mjs`: `ONE_BAR`, the `bars` option and the candidate entries are
  removed, and so are the `OpenAppIconOneBar` and `OpenAppIconOneBarGlyph` imagesets. The built
  widget's `Assets.car` holds only `OpenAppIcon` and `OpenAppIconGlyph`. `test/watch-icons.test.ts`
  pins that only those two mark imagesets exist and that the generator has no one-bar trace.
- **Rectangular with no card**: the disc and "Open app" on one line; "CARDÌ" shows only above a
  card's name. The contract suite pins both branches. Re-shot on the SE 3 40 mm simulator, full
  colour and tinted, with a card and without one (`postpick-rectangular-strip.png` in the scratch
  folder).
- **The frames** draw the shipped mark from the generator's constants (`_watch_shared.mark()`; the
  word-form standalone ì is gone, the wordmark's ì stays). They add a no-card row, drop the third
  line and the `#1A73E8` note, and state the budget once. `yarn frames:check` passes.
- **§10** records the pick, the two-line rectangular, the one-line no-card rectangular, the inline
  glyph and the tinting findings. The stale line references and the "flagged for 23.4" notes are
  repointed. §4.2 notes the widget palette (21.2a) and that no family draws a card colour.
  "How a downstream story proves it complied" gains the widget's suites.
- **Mutations**: 11 new mutations (`mutate2.mjs`) and the 22 original ones whose patterns still
  apply all fail their suite. The two original patterns that no longer match are covered by their
  rewritten forms in `mutate2.mjs`.

**Scratch tools** (outside the repo):
`/private/tmp/claude-501/-Users-ifero-Developer-cardi-loyalty-cards--claude-worktrees-bmad-build-23-4-1daba4/47746736-a995-4398-87cc-f10ec08f21a9/scratchpad/tools/`.

- `install_faces.py` writes watch faces as `face.json` into the simulator's NanoTimeKit face store.
  The colour picker needs the crown, which cannot be driven.
- `seed_group.py` seeds the App Group.
- `capture_set.sh` and `reshoot.sh` shoot the screenshots.
- `sheet.swift` and `strip.swift` compose them.
- `mutate.mjs` runs the mutations.
- The screenshots are in `shots/`, `shots-nocard/`, `story-23-4-mark-comparison.png`,
  `nocard-strip.png` and `sync-before-after.png` beside it.

### The Verification command for the contract suites

The command was missing `--testPathIgnorePatterns=/node_modules/`. `jest.config.js` ignores
`targets/watch/` (and `<rootDir>/.claude/`), so without the override it finds no tests in any
checkout. The command now carries the override, as CI's `watchos-tests.yml` does and as Story 23.2
found.

### Matrix test audit (step 3)

Every row was mapped to a test in `watch-complication-contract.test.ts`, and every one of those
tests ran and passed, 70/70, including the Swift harness:

| Row           | Covering test                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Circular      | "routes each family to its §10 design"; "draws circular and every disc as the mark clipped round"                                   |
| Corner        | "puts the card's name on the corner arc in cream"                                                                                   |
| Rectangular   | "gives the rectangular family the mark and two lines, never a third"                                                                |
| Inline        | "gives the inline family the glyph and the card's name"                                                                             |
| No card       | the no-card branches of the corner, rectangular and inline tests; the harness's `fresh` and `emptied` reads                         |
| Sync          | "names the top card the last sync wrote"; "reads the snapshot on every timeline request"; "reloads active complications after sync" |
| Tinted face   | "tints the mark by its shape" pins the modifier; the shape itself is the DEVICE CHECK's evidence                                    |
| Asset missing | the text fallback in the disc test; "draws the generated mark … and no stand-in glyph"                                              |
| Tap           | "opens the app at the card list from every family"                                                                                  |

### Device check (final build, 2026-10-30)

The check ran after the step 4 patches, on the final `yarn watch:build` output (built 2026-10-29
23:56). Every Swift change after it was comment-only. The devices were the watchOS 26.5 simulators
Apple Watch SE 3 40 mm (the smallest offered) and Series 11 46 mm.

- **Coverage:** five faces on each size:
  - Infograph full colour and tinted red: corner ×2, circular ×3.
  - Modular full colour and tinted red: rectangular, circular.
  - Utility full colour: corner ×2, inline.
- **States:** each face was shot with the top card "Esselunga" and with no card. Those 20 shots
  make up the sheet, and each was read back against §10 and the complication frames.
  - `shots-final/` also holds 11 further shots: the tinted-Utility attempts (`*-6-*`), the long
    name, the tap and the sync. That makes 31 in all.
- **Blank first renders** (QA round 1): three 40 mm no-card shots taken right after the clean
  install showed no complications at all. These were Infograph full colour, Infograph tinted and
  Utility.
  - The slots had not loaded within the capture's 25 s wait.
  - Reshot with a 75 to 90 s wait, all three render correctly, and the sheet uses the reshots.
  - The first two reshoots of Infograph tinted and Utility were blank again, though the same faces
    rendered at once in the long-name run, so the delay is intermittent harness timing.
  - The blank frames are kept in `shots-final/blank-first-render/`, and the retries in
    `shots-final/retry/`.
- **What they show:**
  - Every family draws §10 with the full mark.
  - The corner arc is in cream, and the rectangular family shows "CARDÌ" (beam) over the name
    (cream), with no third line.
  - Rectangular with no card shows the disc and "Open app" on one line. Corner with no card has no
    arc. Inline shows the glyph and the name, or "OPEN CARDÌ".
  - On tinted faces the mark reads by shape, and the "CARDÌ" label takes the tint.
  - In circular and rectangular the mark takes the face's tint. On the tinted Infograph face the
    system draws the corner's mark desaturated instead, white and grey on a dark grey disc, which
    QA round 1 caught. It still reads by shape, and §10 says so.
- **A long name** (QA round 1), seeded as "Metro Supermercati" at 40 mm, from a clean install:
  - Every corner arc truncates it to "METRO SUPER…", full colour and tinted.
  - Inline fits the whole name.
  - The shots are `shots-final/40-longname-{1,2,5}-*.png`.
- **The tap on this build.** Simulator access was granted on retry.
  - A tap on the Utility face's corner disc opened the app at its root, the card list. It showed
    "No cards yet": a clean install leaves the app's own store empty, and the App Group was
    seeded directly (`shots-final/40-tap-corner.png`).
  - A first tap on the inline showed no change within 4 s, so inline's own tap is not separately
    confirmed (`40-tap-inline.png`).
- **A live sync on this build:**
  - The face named "Metro Supermercati". The app's debug "Import sample cards" was run, then the
    app was relaunched.
  - The debug import writes only the app's `watch.cards` defaults. The relaunch runs
    `migrateUserDefaults`, the real writer: `persistCards`, `persistTopCardName`, then
    `reloadAllActiveComplications()`.
  - The face then showed "ESSELUNGA" on both corner arcs and the inline. Esselunga is the sample's
    favourite, so it is `sortedForDisplay`'s top.
  - The shots are `40-sync-after-import.png`, unchanged before the relaunch as expected, and
    `40-sync-after-relaunch.png`.
- **The first no-card pass at 40 mm** still drew the rectangular "CARDÌ / Esselunga".
  - The capture seeds the App Group directly, without the watch app's `reloadTimelines`, so
    WidgetKit served the rectangular family's archived timeline.
  - A reshoot from a clean install (`UNINSTALL=1`) shows the correct one-line "Open app", in full
    colour and tinted. The stale frames are kept in `shots-final/stale-40-nocard/`.
  - In the app every write is followed by a reload, and the Swift harness covers writer then
    reader, so this is a harness artefact, not a defect.
- **Light and dark:** watch faces have no light appearance, so the axis for complications is full
  colour against tinted, and both were captured.
- **Screenshots** (outside the repo):
  - The sheet:
    `/private/tmp/claude-501/-Users-ifero-Developer-cardi-loyalty-cards--claude-worktrees-bmad-build-23-4-1daba4/47746736-a995-4398-87cc-f10ec08f21a9/scratchpad/story-23-4-device-check.png`
  - The individual shots are in `shots-final/` beside the sheet.

**Unchecked, and named at the handback:**

- **The watchOS 10 tint path (`.widgetAccentable()`):** no watchOS 10 runtime is installed (only
  26.4 and 26.5).
- **The missing-asset fallback at runtime:** it is covered only by the source pins.
- ~~**The inline family's own tap.**~~ Confirmed by the decision 3 device check: an inline tap
  cold-launched the app onto the named card's barcode.
- **Inline on a tinted face.** Code-review round 2 raised it, and an attempt to capture it failed.
  - Inline was captured only on the full-colour Utility face, where it draws as a template
    silhouette.
  - A Utility face set to `standard.red` recolours only the second hand: its complications stay
    full colour (`shots-final/*-6-utility-tinted.png`, `story-23-4-inline-tinted.png`).
  - The faces that do tint (Infograph, Modular) carry no inline slot in this harness.
  - Choosing a colour on any other face needs the crown, which cannot be driven.
  - So acceptance criterion 1's "tinted" holds for circular, corner and rectangular, and inline
    tinted is left to the Apple Watch pass below.
- **Vibrant rendering.** QA round 1 raised it. The matrix's "Tinted face" row names "accented or
  vibrant".
  - Only the accented mode was captured: Infograph and Modular, tinted red.
  - The faces this harness can install render full colour or accented, and the widget has no
    `widgetRenderingMode` branch.
  - Whether a watchOS face draws accessory widgets in vibrant mode was not established here.
- **ifero's Apple Watch:** every family, with inline placed on a face that offers it, including a
  tinted face, and any face that renders in vibrant mode.

### Decision 3: the per-card tap (built 2026-10-30)

**The writer** (`ComplicationProvider.swift`) gains `topCardIdKey` and `persistTopCardId(_:)`.
`persistTopCardId(_:)` trims the id, writes it when one is left, and removes it otherwise, as
`persistTopCardName` handles the name. `persistTopCardName` itself is unchanged. Both call sites
(`CardListView.swift` `migrateUserDefaults`, `WatchSessionManager.swift`) take one card,
`WatchCard.sortedForDisplay(...).first`, and write its name, then its id. The one reload follows.
The app's deep-link route is untouched.

**The widget** (`WatchComplicationWidget.swift`):

- `ComplicationSnapshot.topCard()` replaces `topCardName()`. The name rule is unchanged. It decodes
  `CardSnapshot {id, name}` and returns `TopCard(name:id:)`. The id is set only when the `cards`
  snapshot holds a card with that id and that name (Design Notes' tap rule).
- `WatchComplicationEntry` gains `topCardId` and `tapURL`. `tapURL` is
  `cardi://watch-card?id=<id>`, built with `URLComponents`, when the entry has an id, and
  `cardi://watch` otherwise.
- `.widgetURL` is set once, on the entry view's body. Corner, rectangular and inline take
  `entry.tapURL`. Circular, which names no card, takes `cardi://watch` (`namesCard`, review SP1).
  The header comment states the tap.

**Tests** (`watch-complication-contract.test.ts`, 26 to 29 tests):

- The writer's key and helper are pinned. The id is written beside the name at both call sites,
  once each, before the reload, and the old name-only local is asserted absent.
- `topCardIdKey` joins the reader-versus-writer literal check.
- The tap rule is pinned on the entry and on the body. The fixed `.widgetURL(URL(string:` is
  asserted absent.
- The app's route opens no card it does not hold (`openCardRouteIfAvailable`'s guard, `.onOpenURL`).
- The Swift harness now also lifts the widget's entry and provider and the app's
  `WatchComplicationDeepLink`. Each read builds the entry through the real provider and parses its
  `tapURL` with the app's parser. It covers ten states: fresh, synced, resynced, trimmed, two
  cards with the same name (the id picks the second), a name not in the snapshot, a stored id that
  belongs to another card, no id written (an App Group from before this change), a percent-encoded
  id (`a b&c=d`), and emptied.

The matrix audit's **Tap** row now maps to "opens the named card from every family, and the card
list with none" and to the harness's "opens the named card by its id…". **Tap, no card** maps to the
harness's `fresh`, `not-in-snapshot` and `emptied` rows. **Tap, card gone** maps to "opens no barcode
for a card the watch no longer holds".

**Mutations:** 27 mutations (`tools/mutate4.mjs`) cover the writer, both call sites, the reader,
the provider, the URL, the body and the app's route, and all 27 turn the suite red.

**Verification:** the watch suites (8 suites, 182 tests), `yarn watch:build`, `yarn test` (217
suites, 4310 tests), `lint`, `typecheck`, `format:check`, `icons:check` and `frames:check` all pass.

**Device check** (Apple Watch SE 3 40 mm, watchOS 26.5, the Utility face: corner ×2 and inline),
clean install of this build. The shots are in `tap/` beside the other scratch shots:

- With no card, the face shows the mark in both corners and "OPEN CARDÌ". A tap on the corner opens
  the app at the card list (`d3-1`, `d3-2`).
- The app's debug "Import sample cards", then a relaunch, runs the real writer. The face then names
  ESSELUNGA on both arcs and the inline (`d3-3`). The App Group plist, read after shutdown, holds
  `topCardId` "1" beside `topCardName` "Esselunga".
- A tap on the corner disc opens Esselunga's barcode, with the back chevron to the list (`d3-4`).
- With the app terminated, a tap on the inline cold-launches it onto Esselunga's barcode (`d3-5`).
  This confirms the inline family's own tap, which the earlier pass left unchecked.
- **Card gone.** `simctl openurl` and the simulator tool's `open_url` are refused on watchOS (LS
  error 115), so the case was set up through the App Group instead.
  - A first try seeded the App Group directly on the running install. The face kept its archived
    ESSELUNGA timeline, because nothing called `reloadTimelines`, so that try is inconclusive
    (`d3-6-stale-archived-after-direct-seed.png`).
  - The second try started from a clean install, so the app's store is empty. The App Group was
    seeded with the top card "Coop", id `gone-1`, and the face named COOP on both arcs and the
    inline (`d3-7`).
  - A tap on the corner opened the card list ("No cards yet"). It showed no barcode and no "Card
    unavailable" pager (`d3-8`). That is the matrix's "Tap, card gone" row.

### Device check, decision-3 final build (after the step-4 second-pass patches, 2026-10-30)

The build was a fresh `yarn watch:build` after SP1–SP5, on the watchOS 26.5 simulators SE 3 40 mm
and Series 11 46 mm.

- **The 20-shot sheet:**
  - Every face was shot at both sizes, with the top card "Esselunga" and with no card, from a clean
    install, with a 60 s render wait.
  - Every family draws §10 as before: no visual change from decision 3.
  - **Two cells came back blank** on first render: the 46 mm no-card Infograph full colour and
    Modular tinted. They were reshot from a clean install with a 75 s wait, twice each, and every
    retry rendered.
    - The blanks are kept in `shots-d3/blank-first-render/`, and the retries in `shots-d3/retry/`.
  - **The 40 mm no-card faces 2–5 were not blank.** Their run stopped after face 1 with the device
    shut down, so they were never shot, and they were shot afterwards with a 60 s wait. QA round 2
    corrected an earlier count here that called them blanks.
  - Sheet:
    `/private/tmp/claude-501/-Users-ifero-Developer-cardi-loyalty-cards--claude-worktrees-bmad-build-23-4-1daba4/47746736-a995-4398-87cc-f10ec08f21a9/scratchpad/story-23-4-device-check-d3.png`
- **The taps,** on the 46 mm, through the simulator tool (`shots-d3/tap/`, and
  `story-23-4-tap-check.png` beside the sheet):
  1. **No card**, Utility inline: the card list ("No cards yet").
  2. "Import sample cards", then a relaunch, ran the real writer. The face then named ESSELUNGA on
     both corner arcs and the inline.
  3. **Inline, cold launch:** Esselunga's barcode (`5901234123457`), with the back chevron.
  4. **Corner, cold launch:** Esselunga's barcode.
  5. **Rectangular** (Modular face, "CARDÌ / Esselunga"): Esselunga's barcode.
  6. **Circular**, cold launch, with a top card: the card list (Esselunga, Healthy Market, Local
     Bakery). That is SP1: circular names no card, so it opens the list.
- **Tap to barcode timing** (asked by ifero): a cold-launch tap on the 46 mm rectangular, with a
  screenshot about every 0.2 s (`burst/`, `story-23-4-tap-timing.png`).
  - The system launch splash shows to +0.5 s, the screen is black at +0.7 s, and Esselunga's
    barcode is in place from +0.9 s.
  - No card-list frame and no part-way push was caught, so the route opens straight onto the
    barcode. The 0.9 s is the app's cold launch.
  - The simulator runs on a Mac, so a real watch's cold launch will differ. ifero's Apple Watch
    pass is where to judge it.
- **Card gone:** this run did not repeat it. It was shown on the decision-3 build before SP1
  (`d3-7`, `d3-8`), and SP1 changed only which families use the per-card URL.

### Review loops

**Code review, round 1: CHANGES_REQUESTED, 2 findings, both verified and fixed.**

1. `CONTRIBUTING.md:392` still said the complication "renders a static open-the-app glyph". It now
   says the complication draws the Cardì mark and the top card's name, with only its brand-logo
   path dormant.
2. Three comments described the system masking an edge-to-edge image, but the widget clips the
   artwork to a round disc itself. These were the `OpenAppIcon` comment in
   `scripts/build-brand-icons.mjs`, the no-alpha test comment in `test/watch-icons.test.ts`, and
   the `ComplicationColor.ink` doc. The `ink` doc also contradicted `disc`'s "no fill sits under
   it".
   - All three are reworded to say the artwork's own ink field is the disc.
   - The changes are comment and doc only. The targeted suites (255 tests) and `icons:check` pass.
   - No device recheck was needed (comment-only).

Not nit-only: both fixes correct stated facts.

**Code review, round 2: CHANGES_REQUESTED, 3 findings, all verified.**

1. The "WHAT IT PRODUCES" manifest in `scripts/build-brand-icons.mjs` omitted the
   `OpenAppIconGlyph` PNGs. Added.
2. §10 counted inline among the families "verified on accented faces", but no tinted inline was
   captured.
   - A capture on a red Utility face showed that face keeps its complications full colour (see
     Device check).
   - §10 now limits the verified claim to circular, corner and rectangular on tinted Infograph and
     Modular faces, and names inline on a tinted face as unverified. The spec's unchecked list
     names it too, and it goes to the Apple Watch pass.
3. The "no stand-in glyph" test did not guard against an SF Symbol stand-in. It now asserts
   `not.toContain('Image(systemName')`.
   - The assertion fails when `Image(systemName: "wallet.pass")` is put into the inline fallback,
     and passes again once restored (26/26).

The changes are a comment, a doc and a test assertion. No widget code changed, so no device
recheck was needed.

**Code review, round 3: APPROVED, zero comments.** The code loop is closed.

**QA review, round 1: CHANGES_REQUESTED, 4 findings, all verified.**

1. The corner arc's "…" truncation (the matrix's Corner row, and §10's table) had no evidence:
   only "Esselunga" had been shot.
   - "Metro Supermercati" was seeded and shot at 40 mm. Every corner arc truncates it to
     "METRO SUPER…", full colour and tinted, so §10's claim now stands on a capture.
2. §10 claimed the tint was verified for the corner, with the mark carrying the face's tint and its
   ink field falling away. On the tinted Infograph face the corner mark is white and grey on a
   dark grey disc, not in the tint.
   - Corrected in §10, in the `markArtwork` comment, in the watch README and in the frames
     (regenerated; `frames:check` passes). The Swift change is to a comment only.
   - Acceptance criterion 1 still holds: the corner reads by shape.
3. Three of the 40 mm no-card shots were blank, and the sheet carried them.
   - All three were reshot, and the sheet was rebuilt.
   - The Device check section now explains the blanks and gives the real count (20 on the sheet,
     31 in all).
4. The matrix row's "vibrant" rendering had no evidence. It is now named as unchecked and goes to
   the Apple Watch pass.

Once simulator access was granted, the same pass also verified the tap (corner disc to card list)
and a live sync (import, relaunch, the face renamed) on this build. Both are removed from the
unchecked list.

The QA fixes changed the reviewed diff after the code loop had approved, so both loops go round
again.

**Code review, round 4: CHANGES_REQUESTED, 1 finding, verified and fixed.**

- The "Wearable Quick Launch" block in `docs/architecture.md` still described a "simple icon
  complication (graphic circular)" with "no dynamic data displayed".
- It now describes the four-family widget showing the mark and the top card's name from the App
  Group snapshot. The tap still goes to the card list.
- The change is to a doc only. Not nit-only, because it corrects a stated fact.

**Decision 3 interrupts the loops.**

- ifero renegotiated the tap (see the Spec Change Log), and Checkpoint 1 approved it.
- Decision 3 was built, and step 4 ran a second pass (Review Triage Log, second pass), with
  patches SP1–SP5.
- The device check was repeated on the final build.
- Both loops then restart. The per-loop count of nit-only rounds is zero for each, since no round
  so far was nit-only.

**Code review, round 5: CHANGES_REQUESTED, 1 finding, verified and fixed.**

- SP2 added the two token paths to `watchos-tests.yml`'s filters. Two docs that list those filters
  were not updated: `targets/watch/README.md:123` and the "Path filters" list in `docs/cicd.md`.
- Both now include the token paths, with the reason: the colour pins read the tokens.
- A third copy of the list, in `CONTRIBUTING.md:313`, which the reviewer did not name, is updated
  the same way.
- The changes are to docs only. Not nit-only, because they correct a stated fact.

**Code review, round 6: APPROVED, zero comments.** The code loop is closed.

**QA review, round 2: CHANGES_REQUESTED, 3 findings, all verified and fixed.** The reviewer deleted
lines from a scratch copy of the widget to find surviving mutants.

1. **The inline family's text was not pinned.** The test matched only up to `glyph`, so dropping
   `Text(verbatim: text)` from the glyph branch, or the whole `else { Text(verbatim: text) }`
   fallback, left all 29 tests green.
   - The regex now spans the glyph, the `Text` beside it and the text-only fallback.
2. **Rectangular's "no third line" was not pinned.** Neither regex reached `.lineLimit(1)`, and no
   long name had been shot on the rectangular family.
   - Both regexes now end in `.lineLimit(1)`.
   - "Metro Supermercati" was shot on the 40 mm Modular face. It truncates to "Metro Super…" on one
     line, full colour and tinted (`shots-d3/40-longname-{3,4}-*`).
   - All four mutants (inline text dropped, inline fallback dropped, either `.lineLimit(1)`
     dropped) now fail the suite, and it is back to 29/29 once restored.
3. **The decision-3 device check miscounted the blank renders.** It said four, but only two were
   blank, the 46 mm ones. The 40 mm faces 2–5 were never shot, after their run stopped. Reworded.

The changes are test assertions and a spec note. No widget code changed, so no device recheck was
needed. The test change alters the reviewed diff, so the code loop goes round again.

**The loops end here, by ifero's decision (2026-10-30).**

- After QA round 2's fixes, ifero asked to commit and open the PR.
- At that point code-review round 7 was still running, on the diff with those fixes, and QA round 3
  had not run. Neither loop converged; ifero ended them.
- The final verification ran on the committed tree.
- Any round-7 finding that arrives after the commit is reported to ifero and is not applied
  silently.

**Code review, round 7 (after the commit): CHANGES_REQUESTED, 2 findings, both verified.** ifero
approved fixing them in a follow-up commit on the PR. Both were test-pin gaps, not defects in the
shipped code.

1. **The writers' `persistCards` call was not pinned at either call site.** The reader shows a name,
   and attaches an id, only when the `cards` snapshot holds the card. So dropping that write
   would leave the face on "Open app" and the tap on the list, with every test green.
   - The call-site regex now starts at `ComplicationSharedState.persistCards(...)`, and asserts it
     occurs once per site.
2. **The disc's text fallback was not tied to its `else`.** Deleting `} else {` would draw the
   app name beside the mark instead of in its place.
   - The disc regex now spans `} else { Text(... app_name ...)`.
   - The reviewer's optional point is done too: the tint regex now spans `markArtwork`'s watchOS 10
     `else` branch.
   - Each mutant fails the suite: `persistCards` dropped at either site, and either `else` dropped.
     The suite is back to 29/29 once restored.

### Matrix test audit, decision 3 (step 3, second pass)

The watch suites ran 182 tests and all passed, including the Swift harness.

| Row            | Covering test                                                                                                                                                                                                               | Device evidence                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Tap            | "opens the named card from every family, and the card list with none"; the harness parses the widget's URL with the app's own `WatchComplicationDeepLink`; "publishes the top card's id beside its name at both call sites" | Corner tap and cold-launch inline tap opened Esselunga's barcode (`tap/d3-*`) |
| Tap, no card   | the same test's no-card branch (`cardi://watch`)                                                                                                                                                                            | Corner tap opened the card list                                               |
| Tap, card gone | "opens no barcode for a card the watch no longer holds"; the harness's case where the stored id belongs to another card                                                                                                     | `gone-1` seeded and tapped, and the card list opened                          |

### Found, not fixed

These are adjacent problems the step 4 review surfaced (rows D1 to D7 of the Review Triage Log).
None was caused by this story. They are recorded here so a follow-up can be filed from them.

- **D1. No accessibility label on the mark.** Circular, and corner with no card, show an unlabelled
  image. The widget sets no `.accessibilityLabel` anywhere, so VoiceOver gets an unnamed image. The
  pre-23.4 icon in those families was unlabelled too.
- **D2. The face gallery's description says only "Cardì".** `.description(...)` uses
  `entry.open_app.subtitle` ("Cardì"), which repeats the display name and never says the
  complication shows your top card. It did so before 23.4.
- **D3. A stale comment in the writer.** `ComplicationProvider.swift:9` says that "the widget
  resolves [colorHex] into a background tint". No widget code has ever read it, before 23.4 or
  since. The writer is outside this story's bounds.
- **D4. Possible staleness with no background handler (unverified).** The watch app has no
  `WKWatchConnectivityRefreshBackgroundTask` handler, so the snapshot, and with it the face,
  updates only when the watch app process receives the context. A device test would settle how
  stale the face can get.
- **D5. `.never` relies on the reload (unverified).** If WidgetKit's background budget drops a
  `reloadTimelines` call, the face keeps the old name until the next reload. A device test across a
  background sync would settle it.
- **D6. The downsampler's failure path returns the full image.** In `ComplicationImage.swift`,
  `complicationDownsampled` returns `self` when `pngData()` or the thumbnail fails. The full-size
  bitmap would then hit `imageTooLarge`, and the slot would show a grey placeholder instead of the
  text fallback. This is pre-existing code.
- **D7. The frames' copy of the mark geometry has no drift check.** `_watch_shared.py` restates the
  generator's `BARS`/`BEAM` by hand, as it already restated the wordmark's constants. No check
  compares the Python with `scripts/build-brand-icons.mjs`, so a change to the generator would
  leave the design reference stale.
- **SD1. A `cardi://watch` tap does not pop a suspended barcode.**
  - `CardListView`'s `.onOpenURL` ignores `cardi://watch`. So a tap on a no-card complication
    (and, after SP1, on circular) while the app was left on a barcode reopens that barcode, not
    the list.
  - It has behaved this way since before 23.4, and the fix is in the app's deep-link handling,
    which 23.4 may not edit.
  - Acceptance criterion 5's "card list" holds from a cold launch or from the list.
- **SD2. The writer's call sites are not executed (unverified).** `migrateUserDefaults` and
  `WatchSessionManager.upsert` are pinned by a source regex only. A shared publish function both
  call, which the harness could lift, would close the gap.
- **SD3. The widget's provider and view wiring are source-pinned only (unverified).**
  `TimelineProviderContext` and the watchOS-only view API keep `getTimeline` and the view out of
  the macOS harness. The simulator captures are the only executed evidence.

## Spec Change Log

- **2026-10-30: ifero renegotiated the frozen intent (decision 3), mid-build.**
  - **Trigger:** during the review loops, ifero asked whether tapping the card complication opens
    that card. It opened the card list, as the approved spec said. Offered a follow-up or a fold-in,
    ifero chose to fold it in.
  - **Amended:**
    - Intent: Approach.
    - Always: the tap and the data keys.
    - Never: the writer's one exception, `topCardId`.
    - The matrix: Tap split into three rows.
    - Decision 3.
    - Outside the frozen block: the Code Map, the Tasks, a fifth acceptance criterion and a Tap
      ruling in Design Notes.
  - **Known-bad state avoided:** the face names a card, but the tap lands on the list and leaves
    the user to find it.
  - **KEEP:** everything built and reviewed before decision 3 stands:
    - the four families, the full mark and the inline glyph;
    - the reader's name rule;
    - the colours and tint handling;
    - the frames, §10's other rulings and every existing test.
  - The change is additive, so no code was reverted. REVERTS ARE SCOPED reverts only on a review
    loopback, and this was the human's renegotiation.
  - `review_loop_iteration` goes to 1.

## Review Triage Log

Step 4 ran four layers: Blind Hunter (BH), Edge Case Hunter (EC), Verification Gap (VG) and Project
Conventions (PC). Each finding was verified at its location before it got a verdict.

| #   | Source             | Finding                                                                          | Verdict                 | Route  | Evidence                                                                                                                                                                                                                                                                                                                                                            |
| --- | ------------------ | -------------------------------------------------------------------------------- | ----------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | PC1, BH2, VG2      | `ComplicationColor` is pinned to retyped hexes, not `IDENTITY_COLORS`            | medium                  | patch  | The test matches literal `#181824`/`#FCCC0C`/`#F0F0E8` and the enum's doc comments word for word. `watch-card-colour-contract.test.ts:432` reads the watch app's `WatchColor` from the tokens, but it is scoped to `targets/watch`. A token change would leave the widget stale and its test green.                                                                 |
| P2  | BH1, VG other      | Docs say the named card is "the top of the watch app's own list"                 | low                     | patch  | The writer uses `WatchCard.sortedForDisplay(...).first`, the `.frequent` order (`CardListView.swift:268`, `WatchSessionManager.swift:293`). The list sorts by `sortMode`, which defaults to `.az` (`:141`, `:503`). The code matches the spec's Code Map; the new comments at `WatchComplicationWidget.swift:9`, grammar `:895` and the README overstate it.        |
| P3  | BH3, EC3, VG3      | The watchOS 10 tint branch is unverified, but §10 states how it behaves          | low (code: maybe-false) | patch  | The deployment target is 10.0. Only watchOS 26.4 and 26.5 runtimes are installed, so the `else` branch (`.widgetAccentable()`) has never rendered. §10 and the `markArtwork` comment assert its luminance-to-alpha result. Patch: say it is unverified. Whether the code tints a solid disc on watchOS 10 would be medium if true, and it is recorded as unchecked. |
| P4  | BH6, EC5, VG other | §10 "Asset missing" claims the app name sits where the disc was, in every family | low                     | patch  | `rectangular` gates the disc on `mark != nil` (`WatchComplicationWidget.swift:143-146`), so it drops the disc and shows its own text. With no card, that is "Open app" alone. That is the matrix's "text-only fallback", but grammar `:971` claims more. Patch: correct §10, and pin the rectangular gate in the contract suite.                                    |
| P5  | BH16 (wording)     | §10 says "each write is followed by" a reload                                    | low                     | patch  | Both call sites do `persistCards`, then `persistTopCardName`, then one reload (`CardListView.swift:266-272`, `WatchSessionManager.swift:291-296`). Grammar `:885` misstates it.                                                                                                                                                                                     |
| P6  | VG1                | `OpenAppIconGlyph`'s Contents.json is never checked against the PNGs             | medium                  | patch  | Pre-verified gap: only `existsSync` and the PNG paths are tested, and `actool` passes a mistyped filename with warnings only. A drift would silently drop the inline mark while CI stays green. Patch: assert `images[]` against the `GLYPH` basenames and scales, and do the same for `OpenAppIcon`.                                                               |
| P7  | VG4                | `getSnapshot` now returns live data, and no test pins it                         | low                     | patch  | Pre-verified gap: reverting `getSnapshot` to a static entry fails no assertion. Patch: pin `completion(currentEntry())` in the provider test.                                                                                                                                                                                                                       |
| D1  | BH5 (labels)       | No accessibility label on the image-only families                                | medium                  | defer  | Verified: there is no `.accessibilityLabel` in the widget. The circular/corner icon was unlabelled before 23.4 too, so this is pre-existing.                                                                                                                                                                                                                        |
| D2  | BH11 (description) | The gallery description repeats "Cardì"                                          | low                     | defer  | `.description` used `open_app.subtitle` before 23.4. Pre-existing copy.                                                                                                                                                                                                                                                                                             |
| D3  | BH12               | The writer's `colorHex` comment claims the widget tints with it                  | low                     | defer  | `ComplicationProvider.swift:9`: no widget code read `colorHex` before 23.4 either. The writer is out of bounds ("does not change the writer").                                                                                                                                                                                                                      |
| D4  | BH19               | The face may stay stale until the watch app runs                                 | maybe-false (medium)    | defer  | There is no `WKWatchConnectivityRefreshBackgroundTask`/`.backgroundTask(.watchConnectivity)` in `targets/watch`. The delivery timing is pre-existing and unverified; a device test across a background sync would settle it.                                                                                                                                        |
| D5  | EC1                | `.never` with a dropped background reload leaves the old name                    | maybe-false (medium)    | defer  | §Design Notes rules `.never` with the app's reloads driving it. Whether the background budget drops those reloads is unverified; a device test would settle it.                                                                                                                                                                                                     |
| D6  | EC2                | The downsampler returns the full image on failure, giving a grey slot            | low                     | defer  | `ComplicationImage.swift:35`, `:46` return `self`. Those lines are unchanged by 23.4, so this is pre-existing.                                                                                                                                                                                                                                                      |
| D7  | BH9, VG5           | The Python frame constants have no drift check against the generator             | low                     | defer  | Real, and VG filed it as defer. `_watch_shared.py` already restated the wordmark geometry by hand with no cross-check, so the pattern predates 23.4. It affects the design reference only.                                                                                                                                                                          |
| R1  | BH4                | The frames' tinted plates don't model the shipped tint                           | false                   | reject | The plates claim only "the same set with colour removed", which is §10's own "verify them desaturated" check. The shipped tint is shown by the simulator screenshots.                                                                                                                                                                                               |
| R2  | BH5 (fonts), EC6   | Fixed 10/15 pt fonts dropped `.caption`'s Dynamic Type                           | maybe-false (low)       | reject | Design Notes rule the label at 10 pt, from the frame. Whether accessory slots grow text with Dynamic Type is unsettled here, and if true it would be low, because the slot size is fixed.                                                                                                                                                                           |
| R3  | BH7                | The inline glyph sits about 5 px low at @3x                                      | low                     | reject | `bounds()` measures the beam square-cornered. Fixing it means new rounded-end extents math for a 1 to 2 pt offset in a template glyph, so it is unlikely to be noticed and more than a direct correction.                                                                                                                                                           |
| R4  | BH8                | `tight` ignores `scale`                                                          | false                   | reject | Only `FULL` (scale 1) uses `tight`. No current entry misframes.                                                                                                                                                                                                                                                                                                     |
| R5  | BH10               | A third copy of the comment stripper                                             | low                     | reject | No current Swift literal is mis-stripped. Consolidating it means refactoring three suites, which is more than a direct correction.                                                                                                                                                                                                                                  |
| R6  | BH11 (keys)        | The `app_name` key duplicates `open_app.subtitle`                                | false                   | reject | It is a dedicated key for a distinct role, the label. No named harm.                                                                                                                                                                                                                                                                                                |
| R7  | BH11 (count)       | `toHaveLength(13)` locks in the dead keys                                        | false                   | reject | The spec rules "unused keys stay". The count pins that rule.                                                                                                                                                                                                                                                                                                        |
| R8  | BH13               | The gallery preview shows "Open app" to users with no cards                      | false                   | reject | That is the designed no-card state (the matrix's "No card"). A sample card would show a card the user does not have.                                                                                                                                                                                                                                                |
| R9  | BH14               | Both images load in every family                                                 | low                     | reject | The view renders only on reload (`.never`). The cost is negligible.                                                                                                                                                                                                                                                                                                 |
| R10 | BH15               | The absence assertions guard history                                             | false                   | reject | Boundaries: "Every old value removed is asserted absent". Decision 1: only the chosen mark ships.                                                                                                                                                                                                                                                                   |
| R11 | BH16 (harness)     | The harness lacks the corrupt-payload, missing-key and between-writes cases      | low                     | reject | Each case falls back gracefully to the no-card state (`try?`, a nil gate). The between-writes window is transient and closed by the single reload.                                                                                                                                                                                                                  |
| R12 | BH17               | No 40 mm in-situ plate shows the corner bar merge                                | low                     | reject | The trade-off is recorded in §10 and in the frames callout, and the 45 mm plate predates the story.                                                                                                                                                                                                                                                                 |
| R13 | BH18               | The card name is on a locked face with no `.privacySensitive()`                  | false                   | reject | The intent puts the top card's name on the face. Decision 2 drew the privacy line at the store and the card number.                                                                                                                                                                                                                                                 |
| R14 | EC4                | `corner(px <= 16, label=None)` raises a TypeError                                | false                   | reject | No caller passes `px <= 16` (84 and 64 only). A loud failure on an unreachable input is correct.                                                                                                                                                                                                                                                                    |

**Second pass (after decision 3).** The same four layers ran. Findings that match a first-pass row
at the same location with the same claim are carried, and keep that row's verdict and route.

| #       | Source          | Finding                                                                            | Verdict              | Route         | Evidence                                                                                                                                                                                                                                                                                                              |
| ------- | --------------- | ---------------------------------------------------------------------------------- | -------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SP1     | BH              | Circular opens the top card's barcode, though it names no card                     | medium               | patch         | `.widgetURL(entry.tapURL)` applies to every family, and circular draws only the mark. The frozen Always says the tap goes to the barcode "when it names one, otherwise at the card list". The Code Map's "once, on the body, takes the entry's URL" missed circular. The fix is one condition.                        |
| SP2     | VG other        | The `IDENTITY_COLORS` pin never runs on a token-only PR                            | low                  | patch         | `jest.config.js` ignores `targets/watch/`, and `watchos-tests.yml`'s path filters list neither `tokens/color.json` nor `shared/theme/tokens.generated.ts`, so a token change leaves `ComplicationColor` stale and CI green. Fix: add both paths to both filters.                                                      |
| SP3     | BH              | `tight` means two framings in one generator                                        | low                  | patch         | `buildSvg({ tight })` (`:395-401`) crops to the exact, non-square box with no margin. `render({ tight })` (`:224-230`) uses a centred square with a one-unit margin. Fix: one line noting the difference in `render`'s doc.                                                                                           |
| SP4     | BH              | §10 says the glyph ships "at 64/128/192 px within the 76 px budget"                | low                  | patch         | `cardi-watch-grammar.md:966`: the files are 64/128/192 px and stay within budget only through the runtime downsample. Fix: direct rewording.                                                                                                                                                                          |
| SP5     | BH              | §10 says the inline text is cream                                                  | low                  | patch         | `cardi-watch-grammar.md:971`: the inline `Text` has no `foregroundStyle`, so the face styles it. Fix: limit the cream claim to rectangular and the corner arc.                                                                                                                                                        |
| carried | BH, EC          | watchOS 10 tint path unverified, with a rendering-mode or glyph suggestion         | carried P3           | patch         | carried: `markArtwork`'s `else` branch is unchanged and still unverified, with no watchOS 10 runtime. The glyph-swap suggestion adds no evidence.                                                                                                                                                                     |
| carried | BH              | No VoiceOver label                                                                 | carried D1           | defer         | carried: there is still no `.accessibilityLabel`. The image-only families were unlabelled before 23.4 too.                                                                                                                                                                                                            |
| carried | BH              | Fixed 10/15/12 pt fonts                                                            | carried R2           | reject        | carried: unchanged, as ruled.                                                                                                                                                                                                                                                                                         |
| carried | BH              | The gallery description repeats "Cardì"; the brand string is in three places       | carried D2, R6       | defer, reject | carried: unchanged.                                                                                                                                                                                                                                                                                                   |
| carried | BH              | `toHaveLength(13)` locks in the dead keys                                          | carried R7           | reject        | carried: the spec rules "unused keys stay".                                                                                                                                                                                                                                                                           |
| carried | BH              | The frames' mark geometry has no drift check                                       | carried D7           | defer         | carried: unchanged.                                                                                                                                                                                                                                                                                                   |
| carried | BH              | Both images are decoded per render                                                 | carried R9           | reject        | carried: unchanged, and the render runs only on reload.                                                                                                                                                                                                                                                               |
| carried | BH, EC          | The downsampler returns the full image on failure                                  | carried D6           | defer         | carried: `ComplicationImage.swift:35`, `:46` are unchanged.                                                                                                                                                                                                                                                           |
| SD1     | EC (2 findings) | A `cardi://watch` tap while the app is suspended on a barcode reopens that barcode | medium               | defer         | `.onOpenURL` returns early for `cardi://watch` and never resets `navigationPath` (`CardListView.swift:620-625`). Every tap behaved this way before 23.4. The fix edits the app's deep-link handling, which the frozen Never excludes. Acceptance criterion 5's "card list" holds from a cold launch or from the list. |
| SD2     | VG              | The writer's two call sites are never executed, only regex-pinned                  | maybe-false (medium) | defer         | Pre-verified gap, filed as defer. The harness calls the writer helpers, not `migrateUserDefaults` or `upsert`. Executing either needs SwiftData in the harness, or a shared publish function both call.                                                                                                               |
| SD3     | VG              | The widget wiring past `currentEntry()` is source-pinned only                      | maybe-false (medium) | defer         | Pre-verified gap, filed as defer. `TimelineProviderContext` has no public initializer, and the views use watchOS-only API, so the macOS harness cannot run them. The simulator captures cover it.                                                                                                                     |
| SR1     | BH, EC          | The stored id is trimmed, but the snapshot and app ids are not                     | low                  | reject        | Card ids are `uuidv4()` (`features/cards/hooks/useAddCard.ts:66`) and never carry whitespace. Aligning them would mean editing the app's parser, which is out of bounds.                                                                                                                                              |
| SR2     | BH              | The behavioural harness never runs in CI                                           | false                | reject        | `watchos-tests.yml` runs on `macos-latest` for any PR touching `targets/watch/**` or `targets/watch-widget/**`, and its jest step includes this suite.                                                                                                                                                                |
| SR3     | BH              | The absence checks match substrings (`store`, `mark`)                              | low                  | reject        | No current false hit. A future one fails loudly, not silently.                                                                                                                                                                                                                                                        |
| SR4     | EC, VG other    | A pending deep link is never cleared                                               | low                  | reject        | It needs a removed card's id to come back in the same app session. That is rare, and the fix is in the out-of-bounds deep-link handling.                                                                                                                                                                              |
| SR5     | EC              | A deep link pushes beneath an open sort sheet                                      | low                  | reject        | It needs a complication tap while the app is suspended with the sheet open. That is rare, and the fix is in the out-of-bounds app views.                                                                                                                                                                              |

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
- **Tap (decision 3)**: the entry carries the top card's id only when the `cards` snapshot holds a
  card with that id and that name, so the tap never opens a card other than the one named.
  - Matching on the id, not the name, keeps two cards with the same name apart.
  - An App Group written before this change holds the name but no id. Until the watch app next
    writes, the face shows the name and the tap opens the list.
  - Circular draws only the mark and names no card, so its tap opens the list, as the frozen
    Always's "otherwise at the card list" says. The families that name a card (corner,
    rectangular, inline) open its barcode. Step 4's second pass caught this (SP1).

**The comparison**: both candidates in all four families, full colour and tinted, at the smallest size the simulator offers and at 46 mm,
in one sheet of screenshots, shown inline at the halt. 21.3 measured the full mark at 0.672 of the
circle's radius; the reduction is measured the same way.

## Verification

**Commands:**

- `npx jest --testPathPattern="$PWD/targets/watch/__tests__" --testPathIgnorePatterns=/node_modules/ --no-coverage` -- expected: pass.
- `yarn watch:build` (after `yarn watch:prebuild` in a fresh worktree) -- expected: builds.
- `yarn icons:check`, `yarn frames:check`, `yarn typecheck`, `yarn lint`, `yarn format:check`,
  `yarn test` -- expected: all pass.

**Manual checks (if no CLI):**

- On the watch simulator at the smallest size the simulator offers and at 46 mm (rebooted after install): each family on a face, full
  colour and tinted, with a top card and with none.
- On ifero's Apple Watch: the chosen mark in every family, inline placed on a face that offers it.

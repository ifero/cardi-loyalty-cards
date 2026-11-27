---
baseline_commit: 2ff3e23016a3ee6130e5e0c2b3651de62fa4ac5f
---

# Story 21.2a: Migrate the card accents — and decide whether the colour keys are a name or a contract

Status: done

Epic: 21 — Cardì Rebrand — Native Identity

> **📌 SPLIT OUT OF STORY 21.2 ON 2026-09-15, on evidence rather than instinct.** Eight review
> rounds found that roughly half of 21.2's defects lived in this one AC. Its scope had grown from
> "migrate the colour tokens" to: two `CardColor` union definition sites, a function that
> **produces** the keys, four runtime fallbacks, two pickers, two locale files, nine test files,
> three per-platform watch colour maps, and a cross-device wire contract with no test coverage.
> That is not a clause in a token migration; it is a story.
>
> **⛔ THE CENTRAL QUESTION IS A DECISION, AND IT MUST BE TAKEN BEFORE ANY CODE CHANGES.** Are the
> five `CardColor` keys **names** (renameable) or a **wire contract** (frozen)? Everything else in
> this story follows from that answer. AC1 takes it; AC2–AC8 implement whichever branch it chose.
>
> **⛔ THIS SHIPS IN THE ONE RELEASE THAT CANNOT BE CORRECTED BY AN OTA UPDATE.** A wrong answer
> mis-renders synced cards on both watches, and `runtimeVersion.policy` is `appVersion`.
>
> **Sequenced immediately after Story 21.2** (`wave_1b`): both stories edit `tokens/color.json`,
> and 21.2 is the keystone that establishes the palette this story's five accents come from.

## Story

As a user with custom cards,
I want my card colours to be the brand's own five accents,
so that a card I coloured myself looks like it belongs to the same app as the rest of the redesign.

## Story context

`tokens/color.json` holds a `CARD_COLORS` group — the five-colour palette for cards with no
official brand logo:

| key          | shipped       | Cardì accent                                     |
| ------------ | ------------- | ------------------------------------------------ |
| `blue`       | `#1A73E8`     | `#0C3C84` deep blue                              |
| `red`        | `#E2231A`     | `#E42424`                                        |
| `green`      | `#16A34A`     | `#0C843C`                                        |
| **`orange`** | **`#F59E0B`** | — **orange is banned from this system entirely** |
| `grey`       | `#64748B`     | — **there is no neutral among the five**         |

The design system's five accents are `#E42424` · `#0C3C84` · `#0C84CC` · `#0C843C` · `#FCCC0C`.
Two of the shipped keys have no equivalent, and `docs/design/cardi/README.md` already flagged the
consequence: _"This is not a repaint … The tokens PR needs a data migration decision, not just new
hexes."_

### Why this is not a rename

**The keys are persisted.** `core/schemas/card.ts:23` defines `CARD_COLOR_KEYS` and `:28` wraps it
in `cardColorSchema`, a zod enum that validates `card.color` **on every read** — so a dropped key
rejects an existing row. A hand-written duplicate of the union sits at `shared/theme/colors.ts:30`.

**The keys are produced, not just consumed.** `core/utils/mapHexToCardColor.ts` runs on every
catalogue-brand card creation (`CardSetupScreen.tsx:114,130`), returning `'grey'` at `:33,43` and
`'orange'` at `:48` from RGB-dominance buckets tuned to the **current** five hexes. A palette with
**two blues** (`#0C3C84`, `#0C84CC`), **no neutral** and a **yellow** needs re-derived buckets, not
renamed branches.

**`grey` is the runtime fallback**, not only a user choice: `BrandHero.tsx:51-52` (twice),
`CardTile.tsx:139` and `VirtualLogo.tsx:52` all resolve `?? CARD_COLORS.grey`. Remove the key
without naming a replacement and those render **transparent**, not recoloured.

### ⛔ And the keys cross the wire to both watches

`core/watch-connectivity.ts:252` sends `colorHex: card.color` — **the raw key, despite the field's
name** — and `core/wear-connectivity.ts` sends the identical payload by
importing `toBaseWatchCardPayload` from it (`:37`, applied at `:193`) — **one producer, two
transports**; that file contains no colour code of its own. The contract is documented at
`watch-android/…/wear/data/WearCard.kt:24` and `targets/watch/ComplicationProvider.swift:8`, and
resolved on the watch side **three different ways**:

- hard-coded hexes in `targets/watch-widget/WidgetCardPalette.swift:12-19`
- hard-coded hexes in `watch-android/…/presentation/CardVisuals.kt:28-35`
- **SwiftUI system colours** in `targets/watch/ColorHelpers.swift:27-33` (`Color.blue`, `.red`,
  `.green`, `.orange` — only `grey` is an RGB literal)

The canonical fixture is `test-fixtures/sync-message-v1.json` (`:31` `"colorHex": "green"`, `:43`
`"blue"`), named "the canonical v1 wire format" by `WearSyncContract.kt:14` and pinned by
`SyncFixtureContractTest.kt:105`. ⚠️ **That fixture sits at the repository root, while
`wear-os-build.yml` path-filters to the `watch-android` tree** — so a change touching only the
fixture runs no Kotlin test at all.

## Acceptance Criteria

- ⛔ **AC1 — DECIDE FIRST, in writing: are the keys names or a contract?** Record the answer and its
  reasoning in the PR before any code changes.
  - **Freeze** — the five keys keep their identifiers, only their hex values change. No persisted
    row is invalidated and no wire break is possible. Two costs, both real: two keys are
    permanently misnamed (`orange` renders a beam yellow, `grey` renders a colour that is not
    grey), which AC5 mitigates at the label layer; and ⚠️ **freeze does NOT mean the watches are
    untouched.** `WidgetCardPalette.swift:13` and `CardVisuals.kt:29` hold the shipped **hexes**
    (`"blue": "#1A73E8"`), which AC2 replaces on either branch — so leaving them alone makes the
    same custom card render `#0C3C84` on the phone and `#1A73E8` on both watches, permanently.
    Either re-point the two hex maps or defer the divergence explicitly and record it in Story
    21.7's AC2(a).
  - **Migrate** — the keys are renamed to match the accents. Then **every** consumer in AC2–AC7
    moves in this same release, including all three watch maps, and a data migration converts
    persisted rows.
- **AC2 — `CARD_COLORS` in `tokens/color.json` carries the five Cardì accents**, regenerated via
  `yarn tokens:build` and committed. `tokens.generated.ts` is never hand-edited.
  `shared/theme/tokens.generated.test.ts` is updated to the new values in the same commit.
- ⛔ **AC2b — The `CardColor` union's two definition sites move with the values, and persisted rows
  are migrated.** `core/schemas/card.ts:23` (`CARD_COLOR_KEYS`) and `:28` (`cardColorSchema`, a zod
  enum validating `card.color` on **every read**, so a dropped key rejects an existing row), plus
  the hand-written duplicate at `shared/theme/colors.ts:30`. On _migrate_ this AC also specifies the
  data migration across **both** surfaces — the local database and Supabase (see
  `shared/supabase/schemas.test.ts:126`). On _freeze_ neither file changes and the PR says so.
- **AC3 — `mapHexToCardColor.ts`'s buckets are RE-DERIVED, not renamed.** Its RGB-dominance
  branches are tuned to the shipped hexes; the target palette has two blues, no neutral and a
  yellow. ⚠️ **The whole mapping block churns, not one line**:
  `core/utils/mapHexToCardColor.test.ts:11-85` holds seventeen assertions, of which the six
  `.toBe('grey')` (`:63,67,71,75,81,85`) and both `'orange'` (`:53,57`) move on **either** branch,
  because the buckets are re-derived regardless. `core/utils/index.test.ts:11` is a second consumer.
  The PR states which brand hexes now land in which accent.
- **AC4 — All FIVE `?? CARD_COLORS.grey` fallbacks resolve to a NAMED default** —
  `BrandHero.tsx:51-52` (twice), `CardTile.tsx:139`, `VirtualLogo.tsx:52`, and ⚠️
  **`CardDetailScreen.tsx:188`, which does NOT exist at baseline**: Story 21.2's AC7 creates it one
  wave earlier (that line is `theme.primary` today). Miss it and the migrate branch either breaks
  the build or paints the detail header transparent — the failure this AC's guard sentence exists
  to prevent. None of the five accents is
  neutral, so this is a design decision the story records, not a substitution. **Keep the `??`
  guard** at every site; an unguarded lookup renders transparent.
- **AC5 — Both locale files are re-worded, on EITHER branch.**
  `shared/i18n/locales/en.ts:584-589` and `it.ts:585-590` feed
  `t('cards.colors.accessibilityLabel')` in both pickers. On _migrate_, a renamed key leaks the raw
  key into the accessibility label. On _freeze_, `orange: 'Orange'` / `'Arancione'` would announce
  a **beam-yellow swatch as "Orange"**, a hue this system bans. ⚠️ These are the two files Story
  21.1 also edits, which is why this story sequences behind it.
- **AC6 — Both 5-swatch pickers render the new accents**:
  `features/cards/components/ColorPicker.tsx:48` and `shared/components/ui/ColorPicker.tsx:61`.
- **AC7 — The wire contract is honoured and, for the first time, TESTED.**
  - On _freeze_: the **keys** do not move, but the two hex maps
    (`WidgetCardPalette.swift:12-19`, `CardVisuals.kt:28-35`) are either re-pointed to the new
    accents in this release, or the divergence is deferred explicitly and recorded in 21.7 AC2(a).
    The PR states which.
  - On _migrate_: all three watch maps move in this release —
    `WidgetCardPalette.swift:12-19`, `CardVisuals.kt:28-35` and `ColorHelpers.swift:27-33`'s
    named-colour switch — plus `CardVisualsTest.kt:36`, the fixture and
    `SyncFixtureContractTest.kt:105`.
  - **Either way**, pin the whole key set in `core/wear-sync-contract.test.ts` — **not** by growing
    the fixture. That file already reads the fixture (`:43`) and iterates `cardsSnapshot.payload`
    without asserting a count, so the addition is additive and it runs in `ci-quality-gates.yml`,
    which is **not** path-filtered. ⚠️ Growing the fixture instead trips
    `SyncFixtureContractTest.kt:90` and `:98` (both assert `cards.size == 2`) on a PR that runs no
    Kotlin — the exact silent break this AC exists to prevent.
- **AC8 — No BRANDED tile is touched.** The 44 distinct catalogue colours across 57 brands are
  content and flow `brand.color` → `backgroundColor` with no token interposed. This story changes
  only the **custom-card** palette. Screenshot the grid before and after to show the brand colours
  are identical.
- **AC9 — Verified on device in both schemes**, with a custom card in each of the five accents —
  ⚠️ **including a FAVOURITED card in the yellow accent, viewed on the card-detail header**, which
  is the beam-star-on-beam-field collision this story's AC2 creates by making `#FCCC0C` pickable
  (21.2's AC9 deliberately gives that header no plate),
  and — if _migrate_ was chosen — a card created **before** the change still rendering correctly
  after it.

## Tasks / Subtasks

- [x] **Task 1 — Take and record the AC1 decision.** Everything below branches on it. → **FREEZE**.
- [x] **Task 2 — `tokens/color.json` + `yarn tokens:build` + `tokens.generated.test.ts` (AC2).**
- [x] **Task 3 — Re-derive `mapHexToCardColor` and its test (AC3).**
- [x] **Task 4 — The five fallbacks and their named default (AC4).**
- [x] **Task 5 — Locale labels, both files (AC5).**
- [x] **Task 6 — Both pickers (AC6).**
- [x] **Task 7 — The wire contract and its new test (AC7).**
- [x] **Task 8 — Brand-tile audit (AC8); device pass (AC9) NOT satisfiable from the repository.**

## Dev Notes

### Guardrails

- **Never hand-edit `shared/theme/tokens.generated.ts`** — three gates catch it (`yarn tokens:check`
  in CI and pre-push, plus the value-parity test).
- **`tokens/color.json` is shared with Story 21.2**, which lands first (`wave_1`). Take this
  story's edit onto 21.2's output, not onto `main`.
- **`shared/i18n/locales/en.ts` + `it.ts` are shared with Story 21.1**, also `wave_1`. Sequence
  behind it.
- **Ships in the single rebrand release (Story 21.7). Do not release alone** — it is one of the
  seven stories that gate names.
- **Do not reach into `features/cards/utils/gridLayout.ts`.** Story 16.33's AC4 and Story 22.1 both
  fence its badge and tile geometry; its one font size belongs to Story 21.6's AC8b.

### Testing

`yarn tokens:check`, `yarn test`, `yarn format:check`. Expect churn in
`shared/components/ui/ColorPicker.test.tsx:8-13,32-33` (a hardcoded `CARD_COLORS` mock plus
`picker-orange` / `picker-grey` assertions), `features/cards/components/ColorPicker.test.tsx:24-25,67-68`
and its six `value="grey"` renders, `VirtualLogo.test.tsx:41`, `shared/supabase/schemas.test.ts:126`,
`core/settings/importCards.test.ts:164,240`, `core/utils/mapHexToCardColor.test.ts:11-85`,
`core/utils/index.test.ts:11`, `test-fixtures/sync-message-v1.json:31,43` with its Kotlin guard
`SyncFixtureContractTest.kt:105` (migrate branch only), and
`shared/components/ui/ColorPicker.stories.tsx:22,26` (exported `Orange` / `Grey` stories).
⚠️ That stories file is iterated by `shared/components/ui/stories.test.tsx`, which **Story 22.1's
AC4 also edits** — coordinate, or the two changes collide.

### References

- [Source: docs/epics.md#Story 21.2a: Migrate the Card Accents and the Colour Keys]
- [Source: docs/design/cardi/cardi-design-system.md] — the five accents, the orange ban
- [Source: docs/design/cardi/README.md] — "a data migration decision, not just new hexes"
- [Source: docs/sprint-artifacts/stories/21-2-migrate-colour-tokens-to-ink-and-beam.md] — the theme
  palette this story's accents sit beside

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (`claude-opus-5`)

### Debug Log References

- **Colour maths verified against published reference values, not assumed.** The Oklab
  implementation was checked against Ottosson's reference outputs for white, black and the three
  sRGB primaries — max deviation 5.7e-5.
- **The lightness weight was chosen empirically**, by sweeping 1.0 / 0.7 / 0.5 / 0.35 / 0.25 over
  the existing test corpus plus all 44 distinct catalogue colours. At 1.0 pure green `#00FF00`
  lands on yellow (it is very light, and the Cardì green is dark); at 0.25 mid-grey `#808080`
  starts moving. **0.5** is the only value where every case is defensible.
- **The achromatic threshold was chosen from a gap in the data.** Across the catalogue the genuine
  neutrals top out at chroma 0.0235 (`#151B26`) and the first chromatic value is 0.0458
  (`#001526`). 0.04 sits in that gap, and is 3.3× below the least-chromatic accent (deep blue,
  0.1311), so no accent can ever classify itself as neutral.
- **The new contract test was mutation-tested, not merely observed green.** Seven mutations, six
  caught: dropping `orange` from the Wear map, drifting Wear `blue` back to `#1A73E8`, dropping
  the watchOS `green` case, drifting watchOS `orange` to `#F59E0B`, dropping `red` from the widget
  palette, and diverging the theme module's fallback key. The seventh — editing `tokens/color.json`
  without regenerating — is caught by `yarn tokens:check` instead, which was also verified.
- **AC8's guard was mutation-tested too**: painting a branded tile from `CARD_COLORS` fails it.
- **Swift verified against the real watchOS SDK** (`swiftc -typecheck -sdk watchsimulator
-target arm64-apple-watchos26.0-simulator`), since `ios/` is not prebuilt in this worktree.
- **Wear OS**: `./gradlew testDebugUnitTest` (159 tests) and `assembleRelease` both pass.

### Completion Notes List

#### ⛔ AC1 — THE DECISION: the keys are a CONTRACT. They are FROZEN.

Four surfaces carry `card.color`, and **two of them cannot be migrated by anything we can ship**:

| surface                        | migratable? | evidence                                                                          |
| ------------------------------ | ----------- | --------------------------------------------------------------------------------- |
| local SQLite                   | ✅          | `DB_VERSION` / `runMigrations` exist (`core/database/migrations.ts:15`)           |
| Supabase `loyalty_cards.color` | ✅          | plain `text NOT NULL`, no CHECK (`supabase/migrations/001_initial_schema.sql:22`) |
| **user-held JSON backups**     | ❌          | they live on the user's device                                                    |
| **phone → Wear OS wire**       | ❌          | independently versioned, independently released artefact                          |

(The table groups by _reachability_, not by file: "the wire" ends in several
independent stores — watchOS SwiftData, the App Group complication cache and the Wear OS Room
database — but every one of them is unmigratable for the identical reason, so they collapse into
one row.)

1. **A rename silently destroys every existing backup.** `analyzeImportPayload` validates
   `color: cardColorSchema` on both the v2 and the legacy path
   (`core/settings/importCards.ts:143`); a card that fails falls to `invalidCount += 1` (`:150`)
   and is **dropped with no message naming the cause**. If every card in a file carries a renamed
   colour the whole file returns `status: 'invalid'` — _"This file doesn't contain valid card
   data."_ A backup that was valid yesterday becomes unreadable, permanently.
2. **The Wear APK is not in the phone binary.** `watch-android/app/build.gradle.kts:28-44` gives it
   its own versionCode bands (2M beta / 3M production / 5M nightly) on its own Play track, and
   notes that nightly testers sit **above** production and must reinstall to come back. A renamed
   key reaching an older APK falls through `NAMED_CARD_COLORS` → `parseHexColor("azure")` → `null`
   → the fallback accent: **every migrated card goes grey on the watch**, with
   `runtimeVersion.policy: appVersion` meaning no OTA can repair it.
3. **Migrate does not even buy the clean names.** To be safe it needs permanent legacy aliases in
   the zod enum, the importer and all three watch maps — the old keys survive anyway, and you have
   paid for two name sets instead of one.

Freeze's cost is two internal identifiers no user ever sees, and AC5 corrects the one place a key
reaches a person. **The keys are frozen; only their values moved.**

| key      | was       | now                   | name still true?     |
| -------- | --------- | --------------------- | -------------------- |
| `blue`   | `#1A73E8` | `#0C3C84` deep blue   | ✅                   |
| `red`    | `#E2231A` | `#E42424`             | ✅                   |
| `green`  | `#16A34A` | `#0C843C`             | ✅                   |
| `orange` | `#F59E0B` | `#FCCC0C` beam yellow | ❌ frozen identifier |
| `grey`   | `#64748B` | `#0C84CC` azure       | ❌ frozen identifier |

`grey` takes azure rather than yellow because it **remains the resolution fallback**: beam is the
brand's signature and would make the fallback the loudest thing on screen. `orange` takes yellow as
the nearest legal hue. The freeze is now enforced, not merely documented — see AC7.

**A property worth recording: no foreground decision changes.** Every accent keeps its light/dark
classification under `getLuminance`'s 0.5 threshold (old grey 0.448 → azure 0.438; old blue 0.410 →
deep blue 0.2157; old orange 0.651 → beam 0.786). Nothing that picks white-or-ink text flips.

#### AC2 / AC2b — values moved, union did not

`tokens/color.json` repainted and regenerated via `yarn tokens:build`; `tokens.generated.ts` never
hand-edited (`yarn tokens:check` green). **`core/schemas/card.ts` and `shared/theme/colors.ts` keep
every key and the union unchanged** — as the freeze branch requires. The only additions to those
two files are the freeze rationale (on `CARD_COLOR_KEYS`, where someone would go to break it) and
`DEFAULT_CARD_COLOR` / `DEFAULT_CARD_COLOR_HEX` for AC4. No data migration on either surface.

#### AC3 — buckets re-derived, and now tied to the palette

Replaced the RGB-dominance ladder with **nearest-accent matching in Oklab** (the space behind CSS
Color 4's `oklch()`), lightness weighted 0.5, plus an explicit achromatic branch. There are no
hand-fitted thresholds left: repaint the palette and the buckets re-derive themselves.

The old ladder's real defect was that **nothing tied its constants to the palette** — they were
fitted to the 2025 hexes and would have kept matching retired colours forever. The `core` →
`shared` boundary (`eslint.config.mjs:120`) forbids importing the generated tokens here, so the
palette is a local copy — but `boundaries/ignore` exempts test files, so the **test** reaches across
the boundary the module cannot and asserts `ACCENT_PALETTE` equals `CARD_COLORS`. Verified to fail
on drift.

**Only two of the seventeen existing assertions moved**, and both are corrections:

| input                     | was      | now            | why                                                                     |
| ------------------------- | -------- | -------------- | ----------------------------------------------------------------------- |
| `#3B82F6` bright mid-blue | `blue`   | `grey` (azure) | the palette now has an azure; the single blue bucket used to swallow it |
| `#FF6B35` red-orange      | `orange` | `red`          | orange is banned, and it is nearer `#E42424` than beam                  |

The six `.toBe('grey')` cases did **not** move: the key is frozen and the achromatic branch still
routes there. The story predicted otherwise, but that prediction assumed renaming.

Where the catalogue lands, **measured by calling the shipped function over all 72 brands** (an
earlier draft of this note quoted a tally from the first experiment, before the lightness weight and
the achromatic branch existed; it was wrong and is corrected here):

| accent             | brands | of which via the achromatic branch |
| ------------------ | ------ | ---------------------------------- |
| `grey` (azure)     | 27     | 20                                 |
| `blue` (deep blue) | 17     | —                                  |
| `red`              | 15     | —                                  |
| `orange` (yellow)  | 7      | —                                  |
| `green`            | 6      | —                                  |

Azure takes 27 of 72 (38%), because 20 brands are neutral — 15 of them pure `#000000` or `#FFFFFF` —
and a colour with no hue cannot be placed on a five-hue palette. **That concentration is invisible in
the app**: all of it is fallback-only, and a branded tile renders `brand.color` with no token
interposed (AC8). It matters only if a brand's catalogue entry goes missing.

> **Updated 2026-11-27 — 15 brands added.** The table above was measured over 57 brands; the
> catalogue now holds 72 (Famila, Sidis, Unes, NaturaSì, Brico OK, Bricofer, Brico io, Marionnaud,
> Thun, UCI Cinemas, Trenitalia, Telepass, Autogrill, Q8, Tamoil). Every one of the fifteen has a
> chromatic brand colour, so the achromatic count is unchanged at 20 and the default accent's share
> **fell** from 46% to 38% even though the catalogue grew by a quarter. The distribution assertion in
> `core/utils/mapHexToCardColor.test.ts` was updated in the same change — that coupling is the point
> of that test.

#### AC4 — five fallbacks, one named default

`BrandHero.tsx:51,52`, `CardTile.tsx:154`, `VirtualLogo.tsx:52` and `CardDetailScreen.tsx:204` (the
fifth, created by 21.2 — it **does** exist at this baseline) now read `DEFAULT_CARD_COLOR_HEX`. Every
`??` / `||` guard kept. Named rather than spelled `CARD_COLORS.grey`, because after the freeze that
expression reads as a lie.

Also removed a **sixth site the story did not list**: `CardSetupScreen.tsx:130` carried a
hard-coded `'#1A73E8'` — a copy of the retired blue — as the hex to map when a catalogue card has
no brand. It now names `DEFAULT_CARD_COLOR` directly.

#### AC5 — labels describe the swatch, not the key

`orange: 'Orange'/'Arancione'` → **`'Yellow'/'Giallo'`**; `grey: 'Grey'/'Grigio'` →
**`'Azure'/'Azzurro'`** (the design system's own name for `#0C84CC`). `blue` → **`'Deep blue'/'Blu
scuro'`**: the picker now shows **two blues side by side**, and "Blue" alone would not let a
screen-reader user tell them apart. These labels are all such a user gets.

#### AC6 — both pickers

Both already read `CARD_COLORS[color]`, so they render the new accents with no change. Removed a
**third hand-written copy of the key list** in `shared/components/ui/ColorPicker.tsx:17`, which now
iterates `CARD_COLOR_KEYS` like its sibling does.

#### AC7 — the contract is honoured AND, for the first time, tested

**All three watch resolvers re-pointed in this release**, not deferred:

- `WidgetCardPalette.swift` — hexes replaced.
- `CardVisuals.kt` — hexes replaced, and `NEUTRAL_GREY` renamed **`DEFAULT_CARD_ACCENT`**: a
  constant named "grey" holding an azure is precisely the misnaming this story exists to avoid.
- `ColorHelpers.swift` — the freeze branch does not require this one, and it is the **most
  important** of the three. It is the **live** watchOS card row (`CardListView.swift:324`) and it
  resolved keys to SwiftUI **system** colours, so `Color.orange` was painting a hue the design
  system bans outright while the phone painted beam. Leaving it would have shipped a banned colour
  on a watch. watchOS ships inside the phone binary, so there is no skew window.

**Eleven new assertions in `core/wear-sync-contract.test.ts`** pin the key set across the phone,
the zod enum that validates every read (via `cardColorSchema.options`, so it tests the real guard
rather than a copy of the list), the theme module's duplicate union and fallback key, all three
watch maps at the phone's own hexes, the Wear fallback constant, and the canonical fixture's
colours. Added there and **not** by growing `test-fixtures/sync-message-v1.json`, exactly as the AC
warns: `SyncFixtureContractTest.kt` asserts `cards.size == 2` twice while `wear-os-build.yml` is
path-filtered to `watch-android/**` and the fixture sits at the repo root. This file runs in
`ci-quality-gates.yml`, which is not path-filtered.

**The fixture and `SyncFixtureContractTest.kt` are untouched** — the freeze dividend.

#### AC8 — no branded tile touched

Branded cards take `brand.color` with no token interposed.

⚠️ **Deviation from the AC's literal text, stated rather than glossed:** AC8 asks for a before/after
screenshot of the grid. A screenshot proves it once, for whoever looks at it; a test proves it on
every future palette change. So `CardTile.test.tsx` asserts a branded tile carrying `color: 'blue'`
still paints `#DB1F26` and that its background equals none of the five accents. Mutation-verified —
painting a branded tile from `CARD_COLORS` fails it.

#### AC9 — NOT satisfiable from the repository

Device verification in both schemes, with a card in each accent, plus a favourited yellow card on
the detail header, needs a real build on real hardware. **The beam-star-on-beam-field collision it
names is already resolved in code**: `getFavouriteStarColor` (added by 21.2, which anticipated this
story) returns **ink** on any field above 0.5 luminance, and beam is 0.786 — so a favourited yellow
card gets an ink star, no change needed. That is a code proof, not a substitute for looking at it.

#### ⛔ ESCALATION — the azure accent cannot carry AA text, and it needs a DESIGN decision

Found in QA review, computable from committed hexes and now pinned in
`shared/theme/colors.contrast.test.ts`. **This is the one thing in this story I cannot decide.**

`#0C84CC` sits in the contrast dead zone: **no** foreground reaches WCAG AA 4.5:1 on it — white is
4.05:1 and ink, the better of the two, is 4.34:1. It is not a foreground bug and cannot be fixed by
choosing differently. The retired `#64748B` passed at 4.76:1, so this is a **regression**, and it
ships in the release with no OTA remedy.

| accent     | renders       | foreground             | contrast   | AA 4.5:1  |
| ---------- | ------------- | ---------------------- | ---------- | --------- |
| `blue`     | `#0C3C84`     | white                  | 10.53:1    | ✅        |
| `red`      | `#E42424`     | white                  | 4.59:1     | ✅ (thin) |
| `green`    | `#0C843C`     | white                  | 4.79:1     | ✅        |
| `orange`   | `#FCCC0C`     | ink                    | 11.53:1    | ✅        |
| **`grey`** | **`#0C84CC`** | white (best: ink 4.34) | **4.05:1** | ❌        |

It reaches a user through `CardDetailScreen`'s condensed header, which draws `card.name` at 17px
weight 600 — under both WCAG large-text thresholds (24px regular, 18.66px bold), so 4.5:1 applies
rather than 3:1. And `grey` is `DEFAULT_CARD_COLOR`, so every card whose colour cannot be resolved
lands there too.

The same colour also puts the favourite star at 2.66:1 against a 3:1 non-text floor (the retired
grey gave 3.12:1). ⚠️ **In aggregate the star situation still IMPROVES**, measured on the star the
app actually draws — `getFavouriteStarColor` returns beam below 0.5 `getLuminance` and ink above, so
a light accent never receives a beam star at all:

| key      | old field | old star | old CR      | new field | new star | new CR      |
| -------- | --------- | -------- | ----------- | --------- | -------- | ----------- |
| `blue`   | `#1A73E8` | beam     | **2.96 ❌** | `#0C3C84` | beam     | 6.91 ✅     |
| `red`    | `#E2231A` | beam     | 3.07 ✅     | `#E42424` | beam     | 3.01 ✅     |
| `green`  | `#16A34A` | beam     | **2.16 ❌** | `#0C843C` | beam     | 3.15 ✅     |
| `orange` | `#F59E0B` | ink      | 8.18 ✅     | `#FCCC0C` | ink      | 11.53 ✅    |
| `grey`   | `#64748B` | beam     | 3.12 ✅     | `#0C84CC` | beam     | **2.66 ❌** |

Two failures became one: the deep blue and the green were both failing before and are now fixed,
and azure regressed. (An earlier draft of this paragraph quoted 1.41:1 for old orange — that is
beam on old orange, a pairing the branch never produces, since old orange's `getLuminance` of 0.6505
resolved to an ink star. Corrected in QA review.)

**Why this story does not resolve it:** the five accents are fixed by
`docs/design/cardi/cardi-design-system.md` and were locked in 2026-08-26. Changing `#0C84CC`,
accepting a documented AA exception, or restricting the accent to large text are all design-system
decisions, not implementation ones. Options, for ifero:

1. **Accept and document** the exception for card accents, on the grounds that a card's own field is
   content rather than chrome. Cheapest; leaves a real AA failure on a default.
2. **Darken the azure** until white clears 4.5:1 (roughly `#0A6BA6` or below). Touches the locked
   palette and `docs/design/cardi/`, so it is a design-system amendment.
3. **Give the card-detail header large text** (≥18.66px bold), which moves the floor to 3:1 and the
   4.05:1 passes. Narrowest code change; does not help any other surface.

Everything else in this story is complete and gated either way — this is an open design question
recorded in a measurement, not an unfinished task.

**ESCALATED 2026-09-17, at ifero's direction**, into
`docs/design/cardi/cardi-design-system.md` under _Card accents — CUSTOM CARDS ONLY_, as an
`⛔ OPEN` block carrying the full table, the reachability argument, and all three options. Recorded
there rather than only here because that document is where this palette is decided and where a
future reader of `#0C84CC` will look. ⚠️ **The pinned test PASSES** — it records the measurement
rather than failing on it — so nothing mechanical stops this branch merging before the question is
answered. The note in the design system is the only thing holding it open.

#### ⚠️ Findings for the reviewer

1. **The deep blue crosses the near-black threshold, and the behaviour change is real.** `#0C3C84`
   has luminance **0.04976** against `isNearBlack`'s 0.05 — so a deep-blue custom card now draws
   the hairline border both watches give near-black avatars on their OLED-black surfaces
   (`CardListView.swift:363`, `CardRow.kt:72`). The retired `#1A73E8` sat at 0.183. This is the
   **right** outcome — at that luminance the avatar genuinely recedes — but the margin is 0.5% of
   the threshold, so it is pinned explicitly in `CardVisualsTest` rather than left to be
   rediscovered.
2. **Two pre-existing watchOS defects, NOT fixed here.** Both live in `CardListView.swift` and
   share one root cause — the raw wire value is used where a RESOLVED one belongs. `resolvedColorHex`
   (`:314-320`) returns `card.colorHex ?? ''`, which for a brandless card is the palette KEY, not a
   hex:
   - `:363` passes it to `isNearBlack(hex:)`, whose `relativeLuminance` returns `0.0` for anything
     that is not six hex digits. `"blue"` is four characters, so **every custom card already draws
     the near-black hairline regardless of colour**. After a fix that resolves first, `blue` KEEPS
     the hairline (luminance 0.04976, just under the 0.05 threshold) and the other four LOSE it
     (0.179 red, 0.169 green, 0.209 azure, 0.639 yellow) — a visible change on four of five accents,
     which is why it wants device verification rather than a green suite.
   - `:324` resolves `mapColor(hex:) ?? .gray` — SwiftUI's **system grey**, not this story's default
     accent. The phone and Wear OS both fall back to `#0C84CC`; watchOS does not. Unreachable while
     the phone emits one of the five keys, which it always does precisely because they are frozen —
     but it is a real divergence, and `DEFAULT_CARD_COLOR`'s comment was corrected in review to stop
     claiming otherwise.

   Deferred rather than widened into this diff: both belong to the watchOS **fallback** mechanism
   rather than to the palette, and this story otherwise does not touch `CardListView.swift`.
   `targets/watch-widget/WidgetCardPalette.swift` already has the right seam to copy — `hex(for:)`
   resolves a key or a hex to a normalised `#RRGGBB`. AC7's new block in
   `core/wear-sync-contract.test.ts` pins the three colour MAPS but does not reach this file;
   extending it there is what would keep the fix from regressing.

3. **`features/cards/components/VirtualLogo.tsx` is dead code carrying a latent contrast bug, NOT
   fixed here.** A repo-wide grep finds exactly one reference — its own barrel export at
   `features/cards/index.ts:34`. `CardTile` and `BrandHero` each render their own inline
   first-letter avatar instead. It hardcodes `color: '#FFFFFF'` for those initials regardless of
   the field beneath, which on the beam yellow this story makes pickable is **1.52:1** (it was
   already failing on the retired orange at 2.15:1). Zero user exposure while nothing renders it;
   a real trap the moment someone wires it up. Deliberately deferred because delete-versus-revive
   is a product call, not part of a palette migration — but the fix, if it is kept, is the one this
   story already applied to `features/cards/components/ColorPicker.tsx`: replace the literal with
   `getContrastForeground`, which gives ink on beam at 11.53:1.
4. **`WatchComplicationWidget.swift:75`** still tints a fallback SF Symbol `#1A73E8` — the retired
   primary. That is **chrome**, owned by 21.2/23.1, not a card accent; left alone deliberately.
5. **Two test mocks had silently drifted** to a Tailwind palette the app never shipped
   (`CardForm.test.tsx`, `CatalogueGrid.test.tsx`: `#3B82F6`/`#EF4444`/…). Corrected in passing —
   a mock claiming to be `CARD_COLORS` while holding colours that exist nowhere is a trap.
6. **Three theme mocks still carry `primary: '#1A73E8'`** (`CardDetails.test.tsx:56`,
   `CardDetails.brightness.test.tsx:109`, `CardSetupScreen.test.tsx:30`). Stale with respect to
   **21.2**, not this story — a different mechanism, left alone.

### File List

**Tokens & schema**

- `tokens/color.json`
- `shared/theme/tokens.generated.ts` (generated)
- `shared/theme/tokens.generated.test.ts`
- `core/schemas/card.ts`
- `core/schemas/index.ts`
- `shared/theme/colors.ts`
- `shared/theme/index.ts`

**Mapper**

- `core/utils/mapHexToCardColor.ts`
- `core/utils/mapHexToCardColor.test.ts`

**Fallbacks & UI**

- `features/cards/components/BrandHero.tsx`
- `features/cards/components/CardTile.tsx`
- `features/cards/components/VirtualLogo.tsx`
- `features/cards/screens/CardDetailScreen.tsx`
- `features/add-card/screens/CardSetupScreen.tsx`
- `shared/components/ui/ColorPicker.tsx`
- `shared/i18n/locales/en.ts`
- `shared/i18n/locales/it.ts`
- `features/cards/components/ColorPicker.tsx` — selection ring and checkmark derived rather than
  hard-coded white (QA finding; white was 1.52:1 on the beam yellow this story makes pickable)

**Wire contract (watchOS + Wear OS)**

- `core/wear-sync-contract.test.ts`
- `targets/watch/ColorHelpers.swift`
- `targets/watch-widget/WidgetCardPalette.swift`
- `watch-android/.../wear/presentation/CardVisuals.kt`
- `watch-android/.../wear/presentation/CardPresentation.kt`
- `watch-android/.../wear/data/DebugSampleCards.kt`
- `watch-android/.../wear/presentation/CardVisualsTest.kt`
- `watch-android/.../wear/presentation/CardPresentationTest.kt`

**Tests added (QA round)**

- `shared/theme/colors.contrast.test.ts` — the five accents measured against the foreground the app
  actually picks, AA and non-text floors, the favourite star, and the azure escalation pinned
- `shared/i18n/locales/card-colors.test.ts` (new) — en/it key parity across all 499 keys, plus the
  colour labels in both locales
- `shared/i18n/italian-rendering.test.tsx` — the composed Italian screen-reader announcement
- `features/cards/components/ColorPicker.test.tsx` — the derived selection foreground
- `features/cards/components/BrandHero.test.tsx` — both `??` fallback sites (AC4)
- `features/cards/components/CardTile.test.tsx` — its `??` fallback site (AC4)
- `features/add-card/screens/CardSetupScreen.test.tsx` — the brand-less catalogue branch this story
  changed

**Tests updated**

- `features/cards/components/CardTile.test.tsx`
- `features/cards/components/BrandHero.test.tsx`
- `features/cards/components/CardDetails.test.tsx`
- `features/cards/components/CardDetails.brightness.test.tsx`
- `features/cards/components/CardForm.test.tsx`
- `features/cards/components/CatalogueGrid.test.tsx`
- `features/cards/components/ColorPicker.test.tsx`
- `features/cards/screens/CardDetailScreen.test.tsx`
- `features/add-card/screens/CardSetupScreen.test.tsx`
- `shared/components/ui/ColorPicker.test.tsx`

**Deliberately NOT changed** — `test-fixtures/sync-message-v1.json`,
`watch-android/.../SyncFixtureContractTest.kt` (keys frozen), `shared/components/ui/ColorPicker.stories.tsx`
(the `Orange`/`Grey` story names are keys, so the Story 22.1 collision the Dev Notes warned about
does not arise), `features/cards/components/VirtualLogo.test.tsx`,
`core/settings/importCards.test.ts`, `shared/supabase/schemas.test.ts`, `core/utils/index.test.ts`
(all read keys, which did not move).

### Change Log

- **2026-09-17** — AC1 decided **FREEZE** on evidence: two of the four surfaces carrying
  `card.color` (user-held backups, the independently released Wear APK) cannot be migrated.
- **2026-09-17** — Five `CARD_COLORS` values repainted onto the Cardì accents; keys, union and zod
  enum unchanged; no data migration on either persistence surface.
- **2026-09-17** — `mapHexToCardColor` re-derived as Oklab nearest-accent matching with a
  lightness weight of 0.5 and an achromatic branch; its palette copy is now CI-pinned to the tokens.
- **2026-09-17** — All five runtime fallbacks, plus a sixth stale literal the story did not list,
  routed through `DEFAULT_CARD_COLOR` / `DEFAULT_CARD_COLOR_HEX`.
- **2026-09-17** — Locale labels re-worded to describe the swatch; `blue` qualified as "Deep blue"
  because the picker now shows two blues.
- **2026-09-17** — All three watch colour maps re-pointed, including `ColorHelpers.swift`, which the
  freeze branch did not require but which was painting a banned hue on the live watchOS card row.
- **2026-09-17** — The card colour key set is now pinned across the phone and all three watch
  resolvers in `core/wear-sync-contract.test.ts`; mutation-verified.
- **2026-09-17 (review round 1)** — Twelve findings addressed. Two mattered: the catalogue
  distribution quoted in AC3's notes was **wrong** — carried over from the first experiment, before
  the lightness weight and the achromatic branch existed — and is corrected from a measured run;
  and `DEFAULT_CARD_COLOR`'s comment claimed the phone and **both** watches agreed on the fallback,
  which watchOS does not (`CardListView.swift:324` resolves to SwiftUI's system grey). Also: the
  Kotlin source extractor's block terminator, an undisclosed behaviour change in
  `CardSetupScreen.tsx`, `#E2231A` misattributed to Conad rather than Coop, a `NeutralGrey`
  straggler in a Kotlin test name, the two sRGB gamma breakpoints now cross-referenced, and four
  wording corrections.
- **2026-09-17 (review round 2)** — The corrected distribution is now **asserted** in
  `mapHexToCardColor.test.ts` rather than only written down, so it cannot drift by hand again; the
  Kotlin extractor counts parentheses instead of matching a formatting habit (verified against three
  reformattings and two regressions); and the deferred watchOS defects are recorded here with their
  post-fix luminances and the seam to copy, rather than only in a follow-up task.
- **2026-09-17 (design escalation)** — The azure AA failure is recorded as an `⛔ OPEN` block in
  `docs/design/cardi/cardi-design-system.md`'s card-accents section, in the same inline style that
  document uses for its RETIRED and AMENDED decisions. Awaiting a ruling; the branch is complete
  and both review loops are approved.
- **2026-09-17 (QA review round 2)** — Corrected the favourite-star comparison: the retired orange
  resolved to an INK star at 8.18:1, not a beam one at 1.41:1, because its `getLuminance` of 0.6505
  sits above the branch threshold — the figure described a pairing the app never produced. Replaced
  the prose with a measured per-key before/after table. Also moved the `VirtualLogo` deferral out of
  an ephemeral task chip and into this story's findings list, to the same standard as the watchOS
  ones.
- **2026-09-17 (QA review round 1)** — Eleven findings addressed, two of them real accessibility
  defects that a green suite was hiding. ⛔ The azure accent cannot carry AA text with **any**
  foreground (white 4.05:1, ink 4.34:1, floor 4.5:1) where the retired grey passed at 4.76:1 —
  measured, pinned in `colors.contrast.test.ts`, and **escalated as a design decision** rather than
  papered over. The colour-picker's selection ring and checkmark were a hard-coded white, 1.52:1 on
  the beam yellow, and are now derived. Added the contrast guardrail that was missing (the existing
  `contrastRatio` helper had never been pointed at `CARD_COLORS`, which is the root cause that let
  both defects through), the three untested `??` fallback sites, en/it key parity, Italian label
  coverage, and a test for the `CardSetupScreen` behaviour change. Also corrected `getLuminance` for
  deep blue (0.2157, not 0.213) and stated the AC8 screenshot-versus-test deviation outright.
  ⚠️ Adding the fallback tests surfaced a gap in this story's own work: `DEFAULT_CARD_COLOR_HEX` was
  added to a module that seven test files mock, and no mock listed it — so the guarded path
  _crashed_ in `getLuminance` rather than falling back. Fixed in the two mocks that needed it.
- **2026-09-17 (review round 3)** — Corrected the post-fix luminance quoted for red in finding 2:
  `#E42424` is 0.17883, not the 0.169 first written, which had duplicated green's value. The
  conclusion is unchanged (red is far clear of the 0.05 hairline threshold either way), but it is
  the number whoever implements the `CardListView.swift` follow-up would check their fix against.

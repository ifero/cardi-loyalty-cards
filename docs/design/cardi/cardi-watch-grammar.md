# Cardì on the watch — the watch grammar

**This document is part of [`cardi-design-system.md`](cardi-design-system.md), not an appendix
to it.** Where the two disagree, this one wins _on the watch only_; everywhere else the phone
system is unchanged. It was written because the phone system's frame rule forbade every screen
the watch apps already ship, and because a second, older design language was still live in the
repository and the watch code was implementing that one.

A watch is not the phone scaled down. The phone system's central claim — **the content is the
colour** — earns its keep because forty-five brand colours share one grid and the chrome has to
get out of their way. A watch shows **one card at a time**. The claim does not transfer, and
almost everything downstream of it has to be re-derived rather than inherited.

---

## 0. What this settles, and what it does not

**Settles:** the frames, the two-systems question, the colour values, the type floor, the grid,
the input model, the barcode rule, the card row, and the complication. Stories 23.2 (watchOS),
23.3 (Wear OS) and 23.4 (widget and complication) implement against it.

**Does not settle, by design:**

- **The `CardColor` key set.** Story 21.2a owns it — whether the five keys are frozen or
  migrated, the data migration, and the phone→watch wire contract. This document records the
  watch palette **by accent hex**, never by key, so that it stays correct either way.
- **Any Swift or Kotlin.** This story writes no code. Everything here is a decision for 23.2–23.4
  to apply, and every behaviour change is flagged as one.

---

## 1. "Carbon Utility" is retired

`docs/ux-design-specification.md` describes a watch design language called **Carbon Utility**,
and `CarbonTheme.kt` cites it by name. It is **retired**, and this document supersedes it.

Four reasons, in order of weight:

1. **It is half of a decision whose other half is already gone.** The same paragraph that assigns
   "Carbon Utility" to wearables assigns **"Soft Sage Grid"** to mobile — and Soft Sage Grid was
   replaced by Cardì. Keeping one half of a two-halves direction alive is precisely what produced
   the divergence this document exists to close.
2. **It is a direction, not a system.** It is six lines of prose under a heading called _Design
   Direction Decision_, plus two component sketches. It never specified a colour value, a type
   scale, a radius or a spacing step. An implementer cannot build from it, which is why every
   watch colour is a literal at its call site.
3. **It is already not implemented.** Its own favourite-badge spec asks for _"a subtle contrasting
   plate/stroke behind the star"_ at the _"top-trailing corner"_ of the row. The shipped Wear row
   has **no plate** and puts the star **inline, mid-row** (`CardRow.kt:127-130`). "The watch code
   implements Carbon" was true of its spirit and not of its letter.
4. **Its one hard number is contradicted by both watch codebases and by this system.** It sets a
   watch touch target of **32 pt**. watchOS declares 44, Wear declares 48, and Cardì adjudicated
   **48**. No watch UI has ever been drawn to 32 — but the number is **not** merely stale prose, and §5.4 names the live token that still carries it.

**What survives, restated here as Cardì rules rather than as Carbon:** the true-black ground, the
high density, the refusal of heavy chrome and large imagery, and the reason for all three — a
watch app's budget is launch time and battery, and the wallet has to be on screen in under two
seconds. Those ideas were right. They are now §3 and §6 of this document.

> **Two pointers must move when this lands.** `docs/ux-design-specification.md` carries a
> superseded notice (this story). `CarbonTheme.kt`'s file comment still cites `§Carbon` and must
> be repointed **here** — that is a Kotlin edit and therefore **Story 23.3's**, not this story's.

---

## 2. The frames

The sizes and the amended frame rule live in
[`cardi-design-system.md` § Layout & Spacing](cardi-design-system.md). Three things about them
are worth repeating where a watch designer will read them:

- **Draw Wear at 192 × 192 dp**, not "384". 384 is the same screen in **pixels**. Google's
  guidance is explicit: design for the smallest supported round screen — **192 dp** — then let
  225 dp and larger grow.
- **Draw Wear round _and_ square.** Google's own guidance covers round only, so the square case
  has no external authority behind it and has to be decided here: see §2.1.
- **Draw watchOS at 40 mm (162 × 197 pt) first, then check 46 mm and 49 mm.** The **widest**
  watch is the 46 mm at 208 pt, not the 49 mm Ultra.

### The six screens are three surfaces, twice

The story names six screens. They are not six designs — they are **three surfaces, each built
twice**, and designing them as pairs is what keeps the two apps from drifting again:

| surface           | watchOS                                           | Wear OS            |
| ----------------- | ------------------------------------------------- | ------------------ |
| **Card list**     | `CardListView`                                    | `CardListScreen`   |
| **Barcode flash** | `BarcodeFlashView`                                | `BarcodeScreen`    |
| **Sort picker**   | `WatchSortPickerView` (a sheet, in the same file) | `SortPickerScreen` |

`ContentView.swift` is **not** a screen. It is twelve lines that mount `CardListView` on a black
ground. Counting it as one of three is what made the watchOS side look like it had a surface the
Wear side lacked.

The widget and complication are a **seventh** surface, in §10.

---

### 2.1 Square Wear screens are the same layout

Google's guidance is round-only, so this is decided here rather than cited. **Square Wear devices
get the same layout, not a different one** — the round design is drawn inside the inscribed square
of its own circle, so it already fits a square screen with margin to spare. Drawing both is how we
check that, not an invitation to diverge. The one thing square changes is that the **corners become
usable**, and the rule is: **leave them empty.** A layout that puts content in the corners cannot
be the same design as the round one, and two designs is what this document exists to prevent.

---

## 3. What carries over, and what does not

| from the phone system                                                         | on the watch              | why                                                                                                                                                        |
| ----------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ink `#181824`** as the card/sheet fill                                      | ✅ carries                | it is the dark-mode rule already, and the watch is permanently in dark mode                                                                                |
| **Beam `#FCCC0C`**, paired with ink text                                      | ✅ carries                | the dark ground makes beam the primary, exactly as the phone's dark mode does                                                                              |
| **Cream `#F0F0E8`** as body text on dark                                      | ✅ carries                | ≈15:1 against ink. There is no legibility case for pure white, and warmth is the whole point of cream                                                      |
| **The barcode rules** — white, true black, nothing overlaid, neutral surround | ✅ carries, **tightened** | §6. The constraint is stronger on a watch, not weaker                                                                                                      |
| **The refusal to overlay a scan target**                                      | ✅ carries                | non-negotiable on any surface                                                                                                                              |
| **The beam rule, both halves**                                                | ✅ carries                | neither watch is ever the scanner, so the beam is **never** drawn on either barcode screen                                                                 |
| **No bottom tab bar, no FAB**                                                 | ✅ carries                | trivially — there is no room for either, and inventing one would be worse here                                                                             |
| **Flat: no shadows, no gradients**                                            | ✅ carries                | and it costs nothing, since OLED black is already the ground                                                                                               |
| **The 2-column brand-tile grid**                                              | ❌ does not               | a 192 dp screen fits one tile. Two columns of 45 brand colours is a phone affordance; §7                                                                   |
| **The `+` / gear header**                                                     | ❌ does not               | neither action exists on the watch. Cards arrive by sync; there are no settings. The list's only chrome is a sort control                                  |
| **The anchored primary-action footer**                                        | ❌ does not               | there is no primary action on any watch screen. Every screen is a list or a barcode; the footer rule has nothing to anchor                                 |
| **Screen margin 24, 8px grid**                                                | ❌ does not               | §5                                                                                                                                                         |
| **Illustrations**                                                             | ❌ does not               | the set is commissioned for onboarding and empty states on the phone. The watch's empty state stays one glyph and one line of text — §3.2 gives its colour |
| **Tap feedback — the 0.98× scale**                                            | ❌ does not               | §3.1                                                                                                                                                       |
| **Space Grotesk / Inter / JetBrains Mono**                                    | ❌ does not               | §4                                                                                                                                                         |

### 3.1 Tap feedback is the platform's, not ours

The phone system specifies a **0.98× scale** on press, _"never a shadow bloom"_. **The watch uses
each platform's own press affordance** — watchOS's built-in button dimming, Wear's Material 3
ripple — and does **not** hand-roll the 0.98.

The half of that rule which matters carries intact: **feedback is never a shadow**, which is free
here because the system is flat and the ground is OLED black. What does not carry is the specific
transform. A watch press is briefer and the target smaller, so the native affordance is tuned to
the device in a way a borrowed constant is not — and on Wear, replacing the ripple with a scale
would be the one place this design stopped feeling like the platform it runs on.

### 3.2 The empty state

**One glyph, one line of title, one line of subtitle. No illustration.** Both platforms already do
this and should keep doing it; the commissioned illustration set is a phone deliverable.

Its colours were the one place the cream rule had not been carried through — both empty states
paint `.white` / `Color.White` with opacity variants. **They take cream `#F0F0E8` like every other
piece of watch body text**: full strength for the title, 60 % for the subtitle, 50 % for the glyph.
The glyph stays large (40–48) because it is the only thing on the screen.

✅ **APPLIED on watchOS (Story 23.2).** `CardListView`'s empty state paints `WatchColor.cream` at
50 % for the 48 pt light glyph, full for the title and `WatchColor.creamSecondary` (60 %) for the
subtitle; its spacing is unchanged. Wear OS is Story 23.3's.

---

## 4. Colour — every divergence resolved to one value

Four codebases disagreed. The table below is the settlement; the "shipped" columns are measured
from source, not summarised.

### 4.1 Chrome

| role                  | watchOS shipped                                    | Wear shipped                                  | **decided**                               |
| --------------------- | -------------------------------------------------- | --------------------------------------------- | ----------------------------------------- |
| Screen ground         | `Color.black`                                      | `Color.Black`                                 | **true black `#000000`** — unchanged      |
| Row / sheet fill      | `#1C1C1F` (`CardListView.swift:359`)               | `CarbonSurface #1C1C1F` (`CarbonTheme.kt:16`) | **ink `#181824`**                         |
| Body text             | `Color.white`                                      | `Color.White`                                 | **cream `#F0F0E8`**                       |
| Secondary text        | `.white.opacity(0.5–0.7)`                          | `#B0B3B8` (`CarbonTheme.kt:29`)               | **cream at 60 % opacity**                 |
| Primary / interactive | `Color.accentColor` → **system blue** (empty stub) | `#4DA3FF` (`CarbonTheme.kt:22`)               | **beam `#FCCC0C`** with ink text — §4.4   |
| Hairline              | `.white.opacity(0.15)`                             | `Color.White.copy(alpha = 0.15f)`             | **`#3A3A48`** — the system's dark outline |

**On `#1C1C1F` → ink `#181824`.** The two are visually identical — the contrast between them is
**1.03:1**, which is nothing. That is the point: the change costs no pixel anyone can see and buys
a value that is _in the system_ instead of a neutral grey-black that predates the identity. Cheap
changes that remove a special case are the ones worth making.

**On white → cream.** Cream on ink is **≈15.3:1**; pure white is ≈17.6:1. Both are far past
AA-large and past AAA for body text, so the 2-point difference buys nothing legibility can spend.
The system's reason stands unweakened on the watch: _"never pure white — it keeps the warmth."_

**On the secondary text.** One mechanism, not two. An opacity tracks the ground it sits on; a
fixed grey (`#B0B3B8`) does not, and is a fourth grey in a repository that already had three.

✅ **APPLIED on watchOS (Story 23.2).** The "watchOS shipped" column above is the state this
document measured, before Stories 21.2a, 21.3 and 23.2; its line references no longer hold. Every
decided value is now defined once in Swift, in `enum WatchColor` (`targets/watch/ColorHelpers.swift`)
— `ground`, `ink`, `beam`, `cream`, `creamSecondary` (cream at 0.6) and `hairline` — parsed through
`parseHexColor`, and every view reads it from there — except `BarcodeFlashView` itself, which reads
only `WatchColor.cream`, for its title: its white field, true-black bars and black surround are §6's
own values, not chrome. Its host, `BarcodePagerView`, adds `ground` under it and `creamSecondary`
for the unavailable line. Beam alone has a second home, `AccentColor.colorset`, which tints the
list's navigation title; both homes are pinned to the token
(`test/watch-accent.test.ts`), and no view reads `Color.accentColor`. In the views: the card row's
fill is ink, its name cream, its hairline `#3A3A48` (as is the dark logo chip's ring); the
"unavailable" line is cream 60 %; the sort picker's rows are ink on black. The "Primary /
interactive" row was already beam: Story 21.3 filled `AccentColor.colorset` (the "system blue"
above was in fact a flat grey; `test/watch-accent.test.ts` records why), and the list's title still
takes it from there. The sort picker's selection now reads `WatchColor.beam` rather than
`Color.accentColor`.

> ⚠️ **§4 as a whole is a BEHAVIOUR CHANGE, and it is the most visible one in this document.**
> Every value in the tables above and below is currently something else on a shipped device. Owners:
> **23.2** (watchOS), **23.3** (Wear OS), **23.4** (widget). The user-visible risk is that these are
> _colour_ changes to the surface a person looks at while a cashier waits — so they are judged by
> contrast, not by taste, and every ratio in this section is stated for that reason. Story 21.7's
> AC2(b)/(c) already records that these decisions ship **unapplied** through the rebrand release;
> that is expected, not a defect, because this story writes no code.

### 4.2 Card accents — and the three-way split nobody had noticed

The same custom card renders in **three different colours** across the three watch surfaces
today, because the watchOS app uses **system colours** while the Wear app and the widget use
**hexes**:

| key      | watchOS (`ColorHelpers.swift:28-33`) | Wear (`CardVisuals.kt:29-34`) | widget (`WidgetCardPalette.swift:13-18`) |
| -------- | ------------------------------------ | ----------------------------- | ---------------------------------------- |
| `blue`   | `Color.blue` (system)                | `#1A73E8`                     | `#1A73E8`                                |
| `red`    | `Color.red` (system)                 | `#E2231A`                     | `#E2231A`                                |
| `green`  | `Color.green` (system)               | `#16A34A`                     | `#16A34A`                                |
| `orange` | `Color.orange` (system)              | `#F59E0B`                     | `#F59E0B`                                |
| `gray`   | `#9CA3AF`                            | `#64748B`                     | `#64748B`                                |

**Decided, three rules:**

1. **Exact hexes on every surface. Never a system colour.** A system colour is not a value — it
   moves between OS releases and between light and dark, so the watchOS app cannot be relied on to
   draw the same card as its own complication. This alone is worth the change.
2. **The five values are the Cardì accents** — `#E42424` red · `#0C3C84` deep blue · `#0C84CC`
   azure · `#0C843C` green · `#FCCC0C` yellow — **recorded here by hex, not by key.** Story 21.2a
   decides which keys survive; the watch mirrors whatever it keeps. A key-indexed table here would
   go stale with no owner.
3. **There is no grey card.** The five accents contain no neutral, so both `#9CA3AF` and `#64748B`
   simply go. Story 21.2a's AC4 already requires a **named** default in place of the grey
   fallback; the watch takes that same named default, whatever it is.

✅ **APPLIED on watchOS.** Story 21.2a replaced the watchOS column above — the four system colours
and `#9CA3AF` — with the five Cardì hexes in `namedCardHex`. Story 23.2 removed the last system
colour, the fallback: a value that cannot be resolved (in `parseHexColor`, in `mapColor` and in the
card row) now takes **azure `#0C84CC`**, the phone's `DEFAULT_CARD_COLOR` and Wear's
`DEFAULT_CARD_ACCENT`, where it took SwiftUI's `.gray`.

### 4.3 `orange` goes — the value, not the key

The system bans orange by name: _"Coral, salmon, terracotta and orange are banned from this system
entirely."_ It ships on all three watch surfaces, and in **two different colours** —
`Color.orange` (system, watchOS) and `#F59E0B` (Wear and widget).

**Decided: no orange value ships on any watch surface.** The `orange` **key** may survive — that
is 21.2a's AC1 to freeze or migrate, and on the freeze branch a key named `orange` legitimately
renders a Cardì accent. What must not survive is an orange **colour**.

⚠️ **`#F59E0B` has a second job on Wear and it must go too.** `CarbonTheme.kt:19` defines
`FavoriteStarTint = #F59E0B` — **bit-identical to the `orange` card key** — and `CardRow.kt:129`
paints the favourite star with it. Removing orange from the palette does not remove it from the
star. Both sites move.

### 4.4 The favourite star — one value, three treatments today

| surface | shipped                                                                      | plate         |
| ------- | ---------------------------------------------------------------------------- | ------------- |
| watchOS | `star.fill`, `.yellow` = **`#FFCC00`**, 13 pt (`CardListView.swift:348-350`) | none          |
| Wear    | `ic_star_filled`, **`#F59E0B`**, 14 dp (`CardRow.kt:127-130`)                | none          |
| phone   | **ink plate carrying a beam `#FCCC0C` star** — already decided               | ink `#181824` |

⚠️ **This is a behaviour change on both watches** — owners **23.2** and **23.3**. The star is the
one marker a person uses to find their card without reading, so changing its colour changes a
recognition cue, not just a hue. The mitigation is that all three shipped values are wrong for
stated reasons (one is a brand's own colour, two are a banned amber), and the replacement is the
value the phone already decided.

**Decided: beam `#FCCC0C`, and no plate on the watch.**

- **The value** is settled already and not by this document: `README.md:549-552` records the
  favourite badge as _"an ink `#181824` plate carrying a beam `#FCCC0C` star"_, and Story 21.2's
  AC9 cites the same decision. The watch takes the star colour from it.
- **`#FFCC00` is the worst of the three** and would have to go regardless of Cardì: the system
  flags it by name as **Esselunga's exact yellow**, and Esselunga is likely the most-used card in
  the app. A favourite marker painted in a brand's own colour is a collision waiting for the one
  card it will happen on.
- **The plate does not carry over.** On the phone the plate exists so the star survives _"all 57
  brand colours, Esselunga's yellow included"_ — it sits on a brand-filled tile. On the watch the
  star sits on an **ink row**, never on a brand fill; the brand colour is confined to a 5 pt accent
  bar and a 30 pt avatar. Beam on ink is **11.5:1**. A plate would be chrome added to defeat a
  problem the watch layout does not have.
- **Position: trailing, vertically centred** — the shipped Wear behaviour. Carbon's "top-trailing
  corner" is retired with the rest of it; in a 48 pt row there is no meaningful "top corner", and
  optical centring is what the row's other elements already do.

✅ **APPLIED on watchOS (Story 23.2):** `star.fill`, 13 pt, `WatchColor.beam`, trailing and centred,
no plate. `#FFCC00` (`.yellow`) is gone from the target.

### 4.5 The accent colour — decided here, consumed by 21.3

**The watch accent colour is beam `#FCCC0C`.**

Both `AccentColor.colorset` files are **empty stubs** — `{"colors":[{"idiom":"universal"}]}` with
no colour key at all — so `Color.accentColor` resolves to system blue. Story 21.3 adds a real
definition to both; it takes this value as **settled**, not provisional.

The derivation is the system's own and needs no new reasoning: _"Primary actions become beam
`#FCCC0C` with ink text. This inversion is deliberate: when the lights go out, the beam is the
only thing left."_ A watch runs on black permanently. Beam on black is **13.8:1**.

> ⚠️ **And it has a consequence on the barcode screen that must be handled.** Apple's own
> documentation states that the accent colour is applied to _"the app's title string in the status
> bar"_. The watchOS barcode screen draws **the card's name** in exactly that strip
> (`BarcodeFlashView.swift:133-151`). So a beam accent puts **beam on the barcode screen**, which
> this system forbids outright.
>
> **Carve-out: the barcode screen overrides the tint to cream `#F0F0E8`.** This is not a new
> exception — the system already says _"the barcode modal ignores dark mode entirely and stays
> white."_ It ignores the accent for the same reason and in the same breath.
>
> **Cream, not ink**, and the reason is worth stating because ink is the instinctive answer and it
> is wrong here: on watchOS the reserved strip is part of the **black surround**, not part of the
> white field (§6a). Ink on black is invisible. The white field begins below the strip, and
> nothing in it is tinted at all. Verified against Apple's documentation rather than assumed;
> **23.2 must confirm it on device**, because a beam-tinted title on the hero screen is a defect
> no test would catch.

✅ **APPLIED (Story 21.3), re-sourced (Story 23.2).** The override is
`.toolbarForegroundStyle(WatchColor.cream, for: .navigationBar)`: the cream is now the watch's one
shared definition, not a second literal in `BarcodeFlashView.swift`, and `test/watch-accent.test.ts`
asserts that the file reads no other shared colour, no ink, no beam and no accent colour. Measured on
the watchOS 26.5 simulator at 40 mm, before and after the change: the title's glyphs are exactly
`#F0F0E8`, and the white field below the strip is pixel-identical.

**Device result (real Apple Watch): _pending — ifero's check (Story 23.2 AC4, before merge)._**
Record here whether the title renders cream, never beam, on hardware.

---

## 5. Type and grid

### 5.1 The 15 px body floor holds — and it is already met

The system mandates a 15 px minimum body size. Both card-name labels are **15**
(`CardListView.swift:338`, `CardRow.kt:118`). The floor is not in trouble; two values sit under it
and **neither is body text**:

| value  | where                                | verdict                                            |
| ------ | ------------------------------------ | -------------------------------------------------- |
| **12** | the initials inside the 30 pt avatar | **exception — it is a mark, not a label**          |
| **10** | the digits under the barcode         | **exception — measured, and it buys module width** |

**The 12 pt initials.** A one-or-two-character monogram inside a circular avatar is the
_substitute for a brand logo_, not text anyone reads as a sentence. The floor governs text you
read; artwork is sized by its container. It is bounded at two characters by construction, so it
cannot become a paragraph later.

**The 10 pt digits.** These exist so a cashier can key the number in when a scan fails — an escape
hatch, not a reading surface. The exception is granted on an arithmetic ground rather than a
taste one: on this screen every point given to type is taken from **module width**, and module
width is the only measurement that decides whether the scan succeeds at all (Story 16.23). The
40 mm has roughly 11.5 pt of slack in its module step; spending it on the digits costs a whole
module. **Conditions:** monospaced (both platforms already are — `design: .monospaced` and
`FontFamily.Monospace`), one line, and **10 is the floor of the floor** — nothing on either watch
goes below it.

### 5.2 No custom typeface ships to either watch

**Space Grotesk, Inter and JetBrains Mono do not reach the watch.** Story 21.6 defers the watch to
this epic; this is the answer.

Neither watch loads one today, and neither does so by omission: Wear passes **no `typography`
argument** to `MaterialTheme` (`CarbonTheme.kt:37`), and watchOS uses `.system(...)` throughout.
Three reasons to keep it that way:

1. **A font file is a boot-path asset**, and the watch's stated budget is a sub-two-second launch.
   On the phone, Story 21.6 is the sprint's highest-risk story for exactly this reason — faces must
   be ready before first paint. The watch has less headroom, not more.
2. **The system faces are optically sized for this device and Inter is not.** SF on watchOS and the
   platform face on Wear open their counters and widen their letterforms below ~17 pt. Substituting
   a face drawn for screens ten times the size is a downgrade dressed as consistency.
3. **There is no brand payoff.** The wordmark appears on **no watch screen**. The brand reaches the
   wrist through the **ì mark** in the app icon and the complication, and through beam — both of
   which this document keeps.

The one place the phone's type intent does carry is **monospaced digits under a barcode**, and
both platforms already honour it with the system mono. That is `mono-code`'s purpose — digits that
do not jitter while someone reads them aloud — served by the right face for the device.

### 5.3 The 8 px grid does not govern the watch. The row is **derived** instead

`WatchCardRowLayoutMetrics.compact` is `rowSpacing 10`, `padding 10/9`, `accentWidth 5`,
`accentHeight 28`, `avatarSize 30`, `cornerRadius 14`. Almost none of it is on an 8 grid, and
forcing it there would be the wrong fix twice over.

**Why the grid does not transfer.** 8 px buys rhythm across a 393 pt phone — **2.0 %** of the
width. The same 8 on a 162 pt watch is **4.9 %**. A step 2.5× coarser relative to its canvas stops
being a rhythm and becomes a quantiser: it leaves roughly twenty legal values for every dimension
on the screen. Google goes further for the same reason and asks for **percentage** margins on
round screens, because a fixed margin is clipped by the curve at different points on every device.

**The rule that replaces it:** on the watch, **the row is derived from its own content, and the
derivation is the spec**:

```
rowHeight = max(max(accentHeight, avatarSize) + 2 × verticalPadding, minimumTapHeight)
          = max(max(28, 30) + 18, …)
          = 48
```

**48 — the system's own touch target, arrived at from the other direction.** That is the number to
hold, and a designer changing the avatar changes the row, which is correct. Only one other value
in the row is genuinely derived today — `avatarLogoInset`, §7.2 — and the rest are literals that
happen to relate (`cornerRadius 14` is half `accentHeight 28`). Treat that relationship as the
intent and keep it; do not mistake it for something the code computes.

**The inter-row gap is 4.** The two lists disagree here as well — `6` on watchOS
(`CardListView.swift:502`) against `4` on Wear (`CardListScreen.kt:78`) — and 4 wins for the same
reason the grid does not transfer: at 192 dp every 2 dp of gap costs a fraction of a row over a
scroll, and the rows already separate themselves by their own ink fill against a true-black ground.
It is also the tighter of the two shipped values, so nothing has to grow.

✅ **APPLIED on watchOS (Story 23.2):** `LazyVStack(spacing: 4)`. The row itself is unchanged —
radius 14, the 30 pt avatar and logo chip, the derived inset — and its initials are now ink on an
accent above luminance 0.4 and cream otherwise (the frames' rule), where they were black and white.

On Wear, **outer margins are expressed as a percentage of the screen**, per Google's round-screen
guidance, pinned so that nothing moves at 192 dp today.

### 5.4 watchOS's 44 is not a violation — it is a dead constant

The system adjudicated **48**, and watchOS declares `minimumTapHeight: 44`. That reads as
non-compliance. It is not, and the arithmetic is worth having written down, because "fix the 44"
would change the layout for no reason:

`.frame(minHeight: 44)` is applied **after** `.padding(.vertical, 9)` around a **30 pt** avatar
(`CardListView.swift:354-356`). The content is already **30 + 9 + 9 = 48** tall, so a 44 pt floor
**never binds**. The shipped watchOS row is 48 pt — the same as Wear's, which declares 48 honestly.

**Decided: change the declared constant from 44 to 48 (Story 23.2). No pixel moves.** The value is
wrong only as a statement of intent, and a constant that contradicts the system while having no
effect is the kind that gets "fixed" in the harmful direction by the next reader.

✅ **APPLIED (Story 23.2):** `WatchCardRowLayoutMetrics.compact` declares `minimumTapHeight: 48`,
and `watch-layout-contract.test.ts` pins that it equals the content height, so on the card row the
floor still never binds and no row pixel moved. The sort picker's rows, which held their own `44`,
now read the same constant — and there the floor **does** bind: their content is shorter, so they
grew from 44 to 48 pt (measured on the 40 mm simulator).

#### And there is a fourth site, in TypeScript, still carrying the retired 32

`TOUCH_TARGET.watch` is **32**, and it is not stale prose: it is authored in `tokens/spacing.json`,
generated into `shared/theme/tokens.generated.ts`, hard-asserted by
`shared/theme/tokens.generated.test.ts`, and exported app-wide through `useTheme()`. It is
currently the **only semantically-named "watch touch target" constant in the repository** — the
Swift and Kotlin sides carry unlabelled local literals — so it is what a search finds.

**Decided: the key is RETIRED, not corrected to 48.** Two grounds, and the second is decisive:

1. **It has zero consumers.** `TOUCH_TARGET.min` is read at 40 sites; `TOUCH_TARGET.watch` at
   **none**. It has never sized anything.
2. **It could not be consumed even if someone tried.** It is a TypeScript export, and there is no
   watch UI in the React Native app — both watch surfaces are Swift and Kotlin and cannot read it.
   A "watch" token inside the phone's token pipeline names a surface that pipeline does not reach.
   Correcting it to 48 leaves a constant that is unreachable **and** now looks authoritative, which
   is worse than one that is unreachable and obviously wrong.

⚠️ **This needs an owner, and the nearest story currently decides the opposite.** Story 22.1
already edits this exact token group — it raises `TOUCH_TARGET.min` 44 → 48 and updates the
generated test in the same commit — and its notes say _"`TOUCH_TARGET.watch` stays 32"_, decided
before this document existed and with nothing pointing it here. **Retiring the key belongs in that
same commit**: same file, same regeneration, same test assertion. This story writes no code and
cannot make the change itself.

✅ **APPLIED 2026-09-27 (Story 22.1), on ifero's ruling for this document over the story's older
note.** `tokens/spacing.json` no longer has a `watch` key, so `TOUCH_TARGET` is `{ min: 48 }`,
and `tokens.generated.test.ts` asserts exactly that shape.

### 5.5 Shape and icons — two phone rules that do not survive unchanged

Neither of these was in the story's divergence table, and both still bind the watch as the phone
system is written.

**Radius: the card row is 14, not 16.** The system says _"Cards and sheets: 16px radius"_ and
_"Consistent everywhere; no mixed radii within one screen."_ Both watches ship **14**
(`WatchPresentationLayout.swift:48`, `CardRowMetrics.kt:21`) — and they agree with each other,
which is the part worth keeping. **Excepted at 14**, because a radius is a proportion of the thing
it rounds: 16 on a 171 × 140 phone tile is a soft corner, while 16 on a **48 pt** row is a third of
its height and starts reading as a pill. The consistency clause holds within a watch screen, which
is what it was for. The accent bar keeps its own **3**, and the avatar and the complication discs
stay **fully round** — which the phone rule already allows for virtual-logo tiles and chips.

**Icons: 14–18 on the watch, not 24.** The system says _"outline style, 1.5px stroke, 24px on a
48px target"_. The watch ships 13–14 for the favourite star and 18 for the sort glyph
(`CardListView.swift:349`, `CardRow.kt:130`, `CardListScreen.kt:118`). **Excepted**, and the ratio
is the reason: 24-on-48 is a **50 %** fill, which works when the 48 pt target is otherwise empty.
On a watch row the same 48 pt already carries a 30 pt avatar, a 5 pt accent bar and a 15 pt name,
so a 24 pt glyph beside them is a quarter of the row spent on a marker. **The rule that carries is
the one underneath it — an icon is chrome, and takes ink, cream or beam, never a card accent.**
The empty-state glyph is the exception to the exception: it is the only thing on its screen, so it
stays large (40–48).

**That 14–18 is a closed range, not a formula.** It describes the two glyphs that exist — the star
at 13/14, and Wear's sort toolbar glyph at 18 (watchOS's has no explicit size at all and inherits
the system default). **A new watch glyph takes 16 unless this section is amended** — the middle of
the range, clear of both ends. A range is a band to land in; the next person needs a number.

---

## 6. The barcode screen, re-derived

The phone rule says the surround must be neutral because at maximum brightness a saturated field
beside the scan target is glare. **On a watch the constraint is stronger, not weaker**, and for
three reasons that are about decoding rather than about glare:

1. **The modules are 2–3 device pixels wide, not 8–10.** Every 1D decoder normalises its digit
   classification against the **narrowest element**, so a one-pixel error on a watch is a 30–50 %
   error where on a phone it is 10 %. Story 16.23 is the whole forensic case: a barcode whose
   narrow elements varied by ±18 % was undecodable by Apple Vision while being perfectly valid.
2. **A watch is held out at an angle, and it is dimmer.** The phone is presented flat; the watch is
   presented on a wrist, off-axis, with a smaller aperture of light reaching the scanner.
3. **On Wear round the display is physically cropped.** Anything drawn edge-to-edge loses its
   corners to the mask, so the usable rectangle is inscribed, not full-bleed.

**The rule, therefore, unchanged in substance and tightened in application:** pure white container,
true-black bars, `.interpolation(.none)` / `FilterQuality.None`, **nothing overlaid — no beam, no
scan-line, no shimmer, no logo, no rounded mask cropping the code**, and a surround that is black
only. Both implementations already comply. **Do not "fix" them.**

### The three carve-outs, written into the rule

These are constraints the phone rule did not anticipate. They are part of the rule now, not
apologies in a source comment.

**(a) watchOS cannot suppress the system clock, so it keeps a reserved strip.** watchOS draws the
time in the top strip with no API to remove it. Measured on a 46 mm with the safe area fully
ignored, it renders **white glyphs straight through the black bars**
(`BarcodeFlashView.swift:133-151`). The screen therefore keeps that strip rather than reclaiming
it — and the cost is real and known: at 40 mm it gives up 95 px along the rotated length axis,
most of a module step. **A wider module bought by corrupting the symbol is not a wider module.**
Wear has no such constraint — it blanks the clock outright with `ScreenScaffold(timeText = {})`
— so Wear goes white edge-to-edge and watchOS does not. **That is one rule meeting two operating
systems, not two rules.**

> **One measurement would reopen this, and it is cheap.** If the clock renders plain white glyphs
> with **no scrim** on a white ground, then a white edge-to-edge field on watchOS would make the
> clock harmlessly invisible _and_ reclaim the strip — which buys module width on the one screen
> where module width is the product. If the system draws a **gradient or scrim** behind the time
> (it does in some contexts), that scrim would land on the bars and the current arrangement is
> correct. **Story 23.2: measure it on device before accepting the strip as permanent.** Do not
> change it on reasoning alone — the present arrangement is measured and the alternative is not.

**Story 23.2 kept the strip unchanged**, as this section requires: the measurement can reopen it,
and only a later story may act on the result. **Device measurement (real Apple Watch): _pending —
ifero's check (Story 23.2 AC4, before merge)._** Record here whether the clock draws a scrim or
gradient behind its glyphs over a white ground, and so whether the strip stays or is reopened.

**(b) watchOS has no brightness API, so "maximum brightness" is aspirational there.** Wear raises
the backlight with `BRIGHTNESS_OVERRIDE_FULL` plus `FLAG_KEEP_SCREEN_ON` and restores it on
dispose (`BarcodeScreen.kt:328-341`). watchOS has neither, and Story 16.26 shipped the closest
achievable behaviour. **The rule is therefore "the brightest field the platform will give you",
and on watchOS that is a full-white field and nothing else.** It is not a defect to be fixed later.

**(c) The barcode screen ignores the accent colour**, as it already ignores dark mode. See §4.5.

---

## 7. The card row — single column, and the mark under a round mask

### 7.1 The single-column list is correct, and now says so

The phone system forbids _"replacing the home grid with a single-column list of rows"_. The watch
list **is** single-column rows, and that is right: a 192 dp screen fits one tile, and the
two-column grid exists to let forty-five brand colours be scanned at a glance — a job that does not
exist when one card is on screen. The phone rule is now scoped to the phone in the Forbidden list
so that it cannot be cited against the watch.

What the watch keeps from the tile is the part that matters: **the brand's own colour and the
brand's own mark**, never a tint, wash or recolour.

### 7.2 The brand mark fills the **inscribed square**, which is 70.7 % — and that is not a reduction

The phone rule wants the mark at roughly **85 %** of the tile. The watch avatar is a 30 pt circle
and the artwork is inset by

```
avatarLogoInset = avatarSize × (1 − 1/√2) / 2 = 30 × 0.29289 / 2 ≈ 4.393 pt
```

leaving `30 − 2 × 4.393 = 21.21 pt`, which is **70.7 %** of the diameter. That looks like the rule
being weakened. It is not — the two numbers are measuring different things:

- The phone's **85 %** is a **fill target** against an unmasked rectangle. It says "go big".
- The watch's **70.7 %** is a **containment guarantee** against a circular mask. `30/√2` is the
  **largest square that fits inside the circle**. Any larger and a wide wordmark's ends are clipped
  by the mask — which is silent, and reads as a badly-cropped logo rather than as a bug.

**So the restated rule is:** _on a circular mask the mark fills the inscribed square — 1/√2 of the
diameter, exactly — and the inset is derived from the avatar size, never tuned by hand._ The
derivation already ships this way (`WatchPresentationLayout.swift:37-39`), and it is correct;
what was missing was the sentence saying so.

**The initials fallback takes no inset, and that is also correct.** A one-or-two-character monogram
is not wide, and is optically centred inside the circle already. Insetting it would shrink type
that is already at its exception floor, to solve a clipping problem it cannot have.

---

## 8. Input — the crown and the rotary scroll. They never act

### What ships today, and why it is incoherent

| surface       | watchOS                                                                                           | Wear OS                                                             |
| ------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Card list     | no crown handler; inherits the default scroll                                                     | no rotary modifier anywhere; inherits `ScreenScaffold(scrollState)` |
| Barcode flash | **crown dismisses** — single-shot latch on any movement > 0.01 (`BarcodeFlashView.swift:239-253`) | rotary does nothing (Open Decision 3)                               |
| Sort picker   | inherits the default scroll                                                                       | inherits the default scroll                                         |

The same physical gesture scrolls on one screen and **irreversibly dismisses** on another, and
which it does is not discoverable.

### The model

> **The crown and the rotary scroll. They never act.**

| surface           | crown / rotary                                                           |
| ----------------- | ------------------------------------------------------------------------ |
| **Card list**     | **scrolls** — and explicitly, not inherited                              |
| **Sort picker**   | **scrolls** — and explicitly, not inherited                              |
| **Barcode flash** | **scrolls through the cards**, one card per detent — and never dismisses |

**Why the crown must stop dismissing the barcode.** It binds a **continuous** input to a
**discrete, irreversible** action, at the one moment the product exists for. The latch fires on
`abs(value) > 0.01` with `sensitivity: .low` and `isContinuous: true` — a single detent, or a
sleeve, or the other hand steadying the watch. Losing the barcode mid-scan at a till is the
failure this whole app is built to prevent, and no other screen teaches the user that the crown
can destroy anything.

**Why the crown scrolls through the cards there (ifero, 2026-10-27, amending this section's first
ruling of "nothing").** Someone at a till who opened one card and needs the card beside it should
not have to go back to the list for it. So on the barcode screen the crown moves through the cards
the way it moves through the list's rows: the turn that scrolls the list onward shows the next card,
one card per detent, in the order the list showed when the barcode opened, held for the visit so a
sync or a usage re-sort cannot reshuffle it mid-scan. That is still scrolling, not acting: it is
reversible (turn back and the card returns), it stops at the first and the last card rather than
wrapping, and it never closes the barcode. What it admits that "nothing" did not is that a stray
detent mid-scan now shows a different card. Everything else in the rule answers that: whole detents
at low sensitivity, never continuous; the card's name in the title, a slide from the direction of
the turn and the crown's own detent haptic all mark the change; and only the crown pages: a tap or
a swipe still does nothing (Story 23.2's decision 1). A card the crown pages to counts as used only
after it has stayed on screen for 1 s, so skimming past cards does not inflate "Frequently used";
the card that was opened counts at once, as before. VoiceOver's adjust gesture pages the same way,
for those who do not use the crown.

**Wear OS pages the same way**, on its rotary input (crown or bezel), on `BarcodeScreen`. Story 23.3
builds it; its spec, refined on 2026-10-25, still says rotary does nothing on the barcode and has to
be amended to this before it is built.

⚠️ **This removes a shipped affordance, deliberately.** It is a behaviour change for Story 23.2,
and it is not a regression: the screen keeps **two** dismissals on each platform.

| dismiss        | watchOS                                                              | Wear OS                                         |
| -------------- | -------------------------------------------------------------------- | ----------------------------------------------- |
| **Swipe**      | system swipe-from-left                                               | system back gesture (`SwipeDismissableNavHost`) |
| **Second way** | the navigation-bar back chevron, already drawn in the reserved strip | tap anywhere (`BarcodeScreen.kt:135`)           |

**Why explicit rather than inherited.** Both lists scroll by rotary today only because a scaffold
happens to wire it — there is **no `rotaryScrollable` or `onRotaryScrollEvent` anywhere in the Wear
source**, and no crown handler in `CardListView.swift`. Behaviour that works by inheritance is
behaviour nobody decided, and it silently disappears when a container is swapped. 23.2 and 23.3
make it explicit; the implementation names are theirs to choose.

✅ **APPLIED on watchOS (Story 23.2).** The card list's `ScrollView` and the sort picker's `List`
each name themselves the crown's owner — `.focused($listHasCrown)` / `.focused($optionsHaveCrown)`
with `.defaultFocus(…, true)` — and neither reads the crown's value. Both scrolled by the crown
before this story too, by inheritance; what changed is that the owner is now declared, and
`watch-layout-contract.test.ts` pins the declaration (measured on the pre-23.2 build at 40 mm: the
list's first row moved from y 49 to −74, and the picker's options from y 47 to 38, under the
crown). The barcode screen lost its `.digitalCrownRotation` latch, and its crown now pages instead.
**`BarcodePagerView` hosts the barcode route and is the one crown reader in the target**: a
`.digitalCrownRotation(detent:)` over the reachable cards — `by: 1`, `sensitivity: .low`,
`isContinuous: false`, the detent haptic on — attached only while two or more cards are reachable.
It holds the list's order at opening (`@State`, initialised once) and skips a card gone since; it
stops at the first and the last card; each card slides in from the way the crown turned, clipped
below the title strip, with a crossfade under Reduce Motion; and VoiceOver's adjust gesture pages
through the same detent. Two platform defaults had to be turned off to keep the field clean, both
found on film: the crown's position capsule, which watchOS draws over the field's top-right corner
after every turn (`.scrollIndicators(.hidden)` hides it; `.digitalCrownAccessory(.hidden)` does
not), and a symbol drawn mid-slide that stayed at its card's final position while the card moved
(`.geometryGroup()` moves the card as one). `BarcodeFlashView` still draws one card and reads no
crown or focus: a card the crown pages to plays no open haptic and sends its `CARD_USED` only once
it has stayed 1 s, while the opened card counts at once, as before. Its view outlives the crown's
move by its exit slide and the close by the pop, so cancellation alone came late (measured); the
usage task also reads which card the pager shows now, moved on with the crown and cleared as the
screen starts to close. The arithmetic — the held order, the clamp at
both ends, when the crown pages at all, the two delays — is `WatchBarcodePaging`, pure Swift that
the contract suite lifts into `xcrun swift` and runs. **And, by ifero's decision of 2026-10-25, a
tap no longer dismisses the barcode either**: the three `.onTapGesture { dismiss() }` (the image
and both placeholders) went, so a stray touch while the code is held to a scanner cannot close it,
and no tap or swipe handler changes the card. The watchOS ways back are the two in the table above
— the swipe from the left and the back chevron. Driven on the watchOS 26.5 simulator at 40, 46 and
49 mm with XCUITest's `rotateDigitalCrown`: the list and the picker scroll, the barcode stays under
a tap on the code (the pre-23.2 build returned to the list on a crown rotation), and the back
chevron and a swipe from the left edge both return to the list. With the pager, at 40, 46 and
49 mm: a 0.2 rotation pages one card onward or back (0.1 none, at 40 mm) and a turn past either
end changes nothing; one card takes no crown; taps and swipes on the code change nothing; the crown
scrolls the list again after the barcode pops; and the barcode screen at rest is pixel-identical,
from the strip down, to the screen before the pager. VoiceOver's adjust gesture and the Reduce
Motion crossfade are pinned in the contract suites only: the simulator runs no VoiceOver. **Device
result (real Apple Watch): _pending — ifero's check (Story 23.2 AC4, before merge)._** Record here
the crown's detent feel on hardware, and whether a stray click of the crown pages a card at a till.

### 8.1 The sort picker keeps each platform's native selected control

The frames draw a generic beam dot in the sort picker. **That dot is schematic — it is not an
instruction to replace either platform's control.** Since this document elsewhere insists the
frames are 1:1 and that a measurement taken off them is real, the exception has to be said out
loud.

|             | shipped                                              | keep it |
| ----------- | ---------------------------------------------------- | ------- |
| **watchOS** | semibold label + a trailing `checkmark`, both tinted | **yes** |
| **Wear OS** | a Material 3 `RadioButton`                           | **yes** |

**What changes is the colour, not the control:** the tint becomes **beam `#FCCC0C`**, which is
already a beam role ("active and selected states"). What must survive is the **double encoding** —
the control's own state _and_ the label's weight both move, so selection is never carried by colour
alone. Swapping a checkmark or a radio for a drawn dot would be a visual-affordance change nobody
asked for, and it would cost the platform's own accessibility semantics.

✅ **APPLIED on watchOS (Story 23.2):** the native `List` and `checkmark` stay; the rows are ink
(radius 14) on black and at least 48 tall; unselected labels are cream, the selected one semibold
beam with a beam checkmark, and the `.isSelected` trait stays.

---

## 9. Frames

Reference frames for all six screens, both Wear shapes and the watchOS size classes, are in
[`frames/cardi-watch-frames.html`](frames/cardi-watch-frames.html). The complication, across all
four families, is in [`frames/cardi-complication-frames.html`](frames/cardi-complication-frames.html).

Both are **generated** — `tools/watch_frames.py` and `tools/watch_complication_frames.py`, sharing
`tools/_watch_shared.py`. `yarn frames:check` diffs them byte-for-byte. Do not hand-edit the HTML;
edit the generator and re-run it.

---

## 10. The complication — four families, one 76 px budget

`WatchComplicationWidget.swift:89-94` declares **all four** accessory families, so all four are
designed. (`ComplicationProvider.swift` declares none — it is App-Group state persistence, not a
widget.)

### The budget is a hard gate, not a guideline

`ComplicationImage.swift` downsamples to `maxPoint 38 × scale 2` = **76 px**. WidgetKit measures a
raster image's **native** pixel size and rejects anything over the per-family budget with
`imageTooLarge` — which renders the slot as a **grey placeholder**. `.frame` and `.scaledToFit`
change layout, not the archived bitmap, so **they do not help**.

> ⚠️ **Do not derive a looser budget from the source comment.** It states the `accessoryCorner`
> ceiling two ways — `≈ 46 pt` on one line and `≈ 81.6 px` three lines below — and those do not
> reconcile at ×2. **76 px is the shipped, working value; design to it.** Flagged for 23.4 to
> reconcile the comment; no design here depends on which reading is right, because 76 is under both.

### ⚠️ These four are a BEHAVIOUR CHANGE, not a re-skin

Every other shipped-versus-decided gap in this document is flagged as a behaviour change, and this
one is the largest. **The shipped complication is an "open the app" button and nothing more.**
`WatchComplicationWidget.swift`'s own header says so: _"There is intentionally NO configuration /
card selection… The card-specific infrastructure (App Group snapshot, BrandLogoCatalog,
WidgetCardPalette) is retained but dormant."_ `targets/watch/README.md` adds: _"Nothing in the
extension reads any of it today."_

Two consequences for **Story 23.4**, neither of them styling:

1. **The producer side already runs; the consumer side does not.** `ComplicationSharedState`
   **persists `topCardName` on every sync** — `ComplicationProvider.swift:20-31`, written from
   both `CardListView.swift:270` and `WatchSessionManager.swift:295`. The data is in the App Group
   today. The widget simply never reads it, and its `TimelineProvider` emits a single static entry
   with `policy: .never`. Making these designs real is **wiring a consumer and a reload policy**,
   not reactivating dead plumbing.
2. **`accessoryCorner`'s text arc needs an API the target does not use.** The curved label is
   `.widgetLabel`, and it appears **nowhere** in either watch target. It is new code, not a
   modifier on an existing view.

**This does not change the designs** — it changes the estimate. Design the four families as below;
budget 23.4 for behaviour, and expect the `accessoryCorner` arc to be the piece that surprises.

### The four designs

The complication has **one job**: get you into the wallet in one tap. It is not a data readout.

| family                     | what it is                                 | design                                                                                                                                                                                               |
| -------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`accessoryCircular`**    | a circle on the face                       | **the ì mark alone**, beam on ink, filling the inscribed square of the circle (§7.2). No text — at this size a word is a smudge                                                                      |
| **`accessoryCorner`**      | a small circle plus a curved text arc      | the **same ì mark** in the circle; the arc carries the **top card's name**, truncated. The tightest image budget of the four, so the mark must be legible at 76 px and is therefore the mark alone   |
| **`accessoryRectangular`** | three lines of content                     | line 1 the app name in `label-bold`; line 2 the **top card's name**; line 3 its store, dimmed. The only family with room for a brand mark beside the text — 30 pt circle, same avatar rules          |
| **`accessoryInline`**      | **one row of text plus an optional image** | the ì as the image, the **top card's name** as the text. Apple's own definition of the family — _"a flat widget that contains a single row of text and an optional image"_ — is the whole constraint |

**Colour.** Watch faces render complications in a **tinted** mode where the system recolours
content, so no design may depend on its own hue. Every one of the four must read as **shape** when
the colour is taken away — which the ì mark does, and which a beam-versus-ink distinction does not.
Draw them in beam on ink; verify them desaturated.

**The fallback tint `#1A73E8`** (`WatchComplicationWidget.swift:75`) is the pre-Cardì blue and goes
with the rest of §4.2.

---

## How a downstream story proves it complied

Most of this document is checkable by a human reading a screenshot, which means it is checkable by
nobody once the sprint is over. The repository already has the pattern that fixes that:
`targets/watch/__tests__/watch-layout-contract.test.ts` makes **string assertions against Swift
source text** and is what keeps the watchOS size table honest today.

**23.2, 23.3 and 23.4 should each extend that pattern to the decisions they apply.** These are the
ones worth guarding, because each is a single literal whose drift is silent:

| decision                   | assert                                                                      |
| -------------------------- | --------------------------------------------------------------------------- |
| Row fill is ink            | `#181824` present, `1C1C1F` **absent**                                      |
| Body text is cream         | `F0F0E8` present, no bare `Color.white` / `Color.White` in a row or label   |
| The five card accents      | the five hexes present; **no system `Color.blue/.red/.green/.orange`**      |
| Orange is gone             | `F59E0B` absent from both the palette **and** `FavoriteStarTint`            |
| The favourite star         | beam present; `FFCC00` and `.yellow` absent                                 |
| The crown does not dismiss | no `dismiss()` inside a `digitalCrownRotation` handler                      |
| Rotary is explicit         | a rotary modifier is present rather than inherited                          |
| The row is 48              | `minimumTapHeight: 48`                                                      |
| Radius is 14               | unchanged — assert it so it stays 14 rather than drifting to the phone's 16 |
| The barcode tint carve-out | the barcode screen sets its own tint                                        |

A test that asserts an **absence** is the valuable half here: the shipped colours are all literals,
so "the old value is gone" is the only thing that catches a half-done migration.

✅ **watchOS (Story 23.2)** carries its rows of this table in the existing suites under
`targets/watch/__tests__/`, plus `test/watch-accent.test.ts` for the barcode tint:
`watch-card-colour-contract.test.ts` (each colour defined once at its token value; the five accents
present; `1C1C1F`, `F59E0B`, `FFCC00` and every system colour absent; every foreground in the list
pinned; the beam star with no plate; the azure fallback; the barcode pager's ground, its
unavailable line and the absence of beam and ink there), `watch-layout-contract.test.ts` (48, 14,
gap 4; the crown's focus on the list and the picker; the barcode pager as the one crown reader in
the target, its detent crown pinned whole and attached only with two or more reachable cards, its
paging policy run in the Swift harness; no gesture handler and no `dismiss()` on the barcode
screen), `watch-usage-event-contract.test.ts` (the open haptic and an at-once `CARD_USED` for the
opened card only, the 1 s delay for a paged one and the on-screen check after it),
`watch-display-luminance-contract.test.ts` (no tap dismissal; no crown or focus in
`BarcodeFlashView`) and `watch-brand-logo-contract.test.ts` (the chip's `#3A3A48` ring). The orange
row is moot on watchOS since Story 21.2a, and `FavoriteStarTint` is Wear's (23.3).

---

## Forbidden on the watch

Everything in the phone system's `## Forbidden` still applies, plus:

**A crown or rotary gesture bound to any action other than scrolling** (moving through the cards
on the barcode screen is scrolling, §8; dismissing it is not) · **a beam drawn on either
barcode screen** (neither watch is ever the scanner) · **a system colour standing in for a brand
or accent value** · **orange as a colour, on any of the three surfaces, including as a favourite
tint** · **`#FFCC00` as the favourite star** (it is Esselunga's exact yellow) · **a plate behind
the watch favourite star** · **a custom typeface loaded on either watch** · **a second design for
square Wear** (same layout, empty corners) · **content in the corners of a square Wear screen** ·
**a hand-rolled 0.98× press scale** (§3.1 — each platform's native affordance) · **a drawn dot replacing a native selection control** (§8.1) · **a complication that depends on its own colour to be read** · **a complication image over 76 px**
· **the phone's two-column grid, header or anchored footer** · **body text below 15**, the initials
avatar and the barcode digits excepted by name in §5.1 · **a 24 pt icon inside a card row** ·
**mixed radii within one watch screen** (14 for rows, 3 for the accent bar, round for avatars and
complication discs — and nothing else).

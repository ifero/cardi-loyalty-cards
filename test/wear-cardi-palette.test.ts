import fs from 'node:fs';
import path from 'node:path';

import { DARK_THEME_COLORS, IDENTITY_COLORS } from '@/shared/theme/tokens.generated';

/**
 * The Wear OS app on the Cardì watch grammar (Story 23.3, `docs/design/cardi/cardi-watch-grammar.md`).
 *
 * Every colour the grammar retired was a literal at its call site, so a half-done migration is
 * silent: the app compiles, the screens look nearly right, and nothing fails. These assertions
 * read the Kotlin source as text — the technique `core/wear-sync-contract.test.ts` and
 * `test/wear-icons.test.ts` already use — and the valuable half is the ABSENCE checks: "the old
 * value is gone" is the only thing that catches a site the migration missed.
 *
 * ⚠️ It is a Jest suite rather than a Gradle test, deliberately. A Gradle test runs only in
 * `wear-os-build.yml`, which is path-filtered to `watch-android/**`; a Jest file runs in `yarn test`
 * and the pre-push hook, which are not, so this runs on every PR.
 */
const repoRoot = path.resolve(__dirname, '..');
const readText = (relative: string): string =>
  fs.readFileSync(path.join(repoRoot, relative), 'utf8');

const WEAR_SRC = 'watch-android/app/src';
const WEAR_KOTLIN = `${WEAR_SRC}/main/kotlin/com/iferoporefi/myloyaltycards/wear`;
const PRESENTATION = `${WEAR_KOTLIN}/presentation`;
const THEME = `${PRESENTATION}/theme/CarbonTheme.kt`;
const CARD_ROW = `${PRESENTATION}/CardRow.kt`;
const CARD_ROW_METRICS = `${PRESENTATION}/CardRowMetrics.kt`;
const CARD_LIST = `${PRESENTATION}/CardListScreen.kt`;
const SORT_PICKER = `${PRESENTATION}/SortPickerScreen.kt`;
const BARCODE = `${PRESENTATION}/BarcodeScreen.kt`;
const BARCODE_PAGING = `${PRESENTATION}/BarcodePaging.kt`;
const WEAR_APP = `${PRESENTATION}/WearApp.kt`;
const STRINGS_EN = `${WEAR_SRC}/main/res/values/strings.xml`;
const STRINGS_IT = `${WEAR_SRC}/main/res/values-it/strings.xml`;

/**
 * Kotlin `source` with its comments removed. The KDoc on these files explains the grammar, and an
 * explanation is allowed to name what it replaced; a presence or absence assertion about BEHAVIOUR
 * has to read code only. A `//` straight after a `:` is kept, so a URL in a string survives.
 */
const codeOnly = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/** `codeOnly`, with every run of whitespace collapsed to one space, so layout cannot hide a match. */
const flatCode = (relative: string): string => codeOnly(readText(relative)).replace(/\s+/g, ' ');

/** Every file under `dir` (repo-relative), recursively, with the given extensions. */
const filesUnder = (dir: string, extensions: readonly string[]): string[] =>
  fs
    .readdirSync(path.join(repoRoot, dir), { recursive: true, encoding: 'utf8' })
    .filter((relative) => extensions.some((extension) => relative.endsWith(extension)))
    .sort()
    .map((relative) => `${dir}/${relative}`);

/** Every Kotlin file the Wear app compiles, `Generated/` included. */
const wearKotlinFiles = (): string[] => filesUnder(WEAR_KOTLIN, ['.kt']);

/**
 * The text between `opener` — which must end in `(` or `{` — and its MATCHING closer, found by
 * counting. A regex cannot do this: a lazy match stops at the first nested `)` or `}`.
 */
const enclosed = (code: string, opener: string, file: string): string => {
  const open = opener.at(-1);
  const close = open === '(' ? ')' : open === '{' ? '}' : undefined;
  if (!close) throw new Error(`enclosed(): opener must end in ( or {, got \`${opener}\``);

  const start = code.indexOf(opener);
  if (start < 0) throw new Error(`${file}: \`${opener}\` not found`);

  let depth = 1;
  let index = start + opener.length;
  while (index < code.length && depth > 0) {
    if (code[index] === open) depth += 1;
    else if (code[index] === close) depth -= 1;
    index += 1;
  }
  if (depth !== 0) throw new Error(`${file}: \`${opener}\` is never closed`);
  return code.slice(start + opener.length, index - 1);
};

/**
 * The body of the Kotlin function whose declaration starts with `signature` (ending in its `(`):
 * the parameter list is skipped by counting, then the `{ … }` after it is returned.
 */
const functionBody = (code: string, signature: string, file: string): string => {
  const parameters = enclosed(code, signature, file);
  const afterParameters = code.indexOf(signature) + signature.length + parameters.length + 1;
  const rest = code.slice(afterParameters);
  if (!/^\s*\{/.test(rest)) throw new Error(`${file}: \`${signature}\` has no block body`);
  return enclosed(rest, '{', file);
};

/**
 * A Kotlin argument list (`a = x, b = f(y, z)`) as `{ a: 'x', b: 'f(y, z)' }`, split only at the
 * commas outside any parentheses, so a nested call stays one value.
 */
const namedArguments = (body: string): Record<string, string> => {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const character of body) {
    if (character === '(' || character === '{') depth += 1;
    if (character === ')' || character === '}') depth -= 1;
    if (character === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += character;
    }
  }
  parts.push(current);

  return Object.fromEntries(
    parts
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((part) => {
        const separator = part.indexOf('=');
        return [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
      })
  );
};

/** How many times `needle` occurs in `haystack`, case-insensitively. */
const occurrences = (haystack: string, needle: string): number =>
  haystack.toUpperCase().split(needle.toUpperCase()).length - 1;

/** The `#RRGGBB` a theme constant `val <name>: Color = Color(0xFFRRGGBB)` declares, or null. */
const themeHex = (name: string): string | null => {
  const match = new RegExp(`\\bval ${name}: Color = Color\\(0xFF([0-9A-Fa-f]{6})\\)`).exec(
    codeOnly(readText(THEME))
  );
  return match?.[1] ? `#${match[1].toUpperCase()}` : null;
};

/** The grammar's values (§4.1, §4.4), restated here so a drift in the theme has to fail. */
const ROLES: ReadonlyArray<readonly [string, string]> = [
  ['Ink', '#181824'],
  ['Beam', '#FCCC0C'],
  ['Cream', '#F0F0E8'],
  ['Hairline', '#3A3A48']
];

/**
 * What the Wear app painted before this story: the Carbon `primary`, the row surface, the fixed
 * secondary grey, and the amber star — bit-identical to the retired `orange` accent, and banned
 * by name.
 */
const RETIRED_HEXES = ['4DA3FF', '1C1C1F', 'B0B3B8', 'F59E0B'] as const;

describe('Wear OS on the Cardì watch grammar (Story 23.3)', () => {
  describe('the roles are defined once, in the theme, at the grammar’s values', () => {
    it.each(ROLES)('the theme declares %s as %s', (name, hex) => {
      expect(themeHex(name)).toBe(hex);
    });

    it('declares the grammar’s values, which are the phone’s own tokens', () => {
      // One identity, two pipelines that cannot read each other: the Wear module shares no build
      // with the phone. If the identity moves, the token moves and this fails, naming both.
      expect(themeHex('Ink')).toBe(IDENTITY_COLORS.ink.toUpperCase());
      expect(themeHex('Beam')).toBe(IDENTITY_COLORS.beam.toUpperCase());
      expect(themeHex('Cream')).toBe(IDENTITY_COLORS.cream.toUpperCase());
      expect(themeHex('Hairline')).toBe(DARK_THEME_COLORS.border.toUpperCase());
    });

    it('makes secondary text cream at 60 %, not a fixed grey', () => {
      expect(flatCode(THEME)).toContain('val CreamSecondary: Color = Cream.copy(alpha = 0.6f)');
    });

    it.each(ROLES)('%s is written once in the whole Wear app: in the theme', (_name, hex) => {
      // "Defined once" is the point of the theme: a second literal is a second definition that
      // will not move when the first one does. Comments are excluded — they may quote a value.
      const sites = wearKotlinFiles().filter(
        (file) => occurrences(codeOnly(readText(file)), hex.slice(1)) > 0
      );
      expect(sites).toEqual([THEME]);
      expect(occurrences(codeOnly(readText(THEME)), hex.slice(1))).toBe(1);
    });

    it('constructs no Compose colour outside the theme, but the row’s conversion of a card accent', () => {
      // Any `Color(` constructor call — hex, float or named arguments — not just `Color(0x…)`.
      // `\b` keeps `parseHexColor(` and `resolveCardColor(` out.
      const constructorSites = wearKotlinFiles().filter((file) =>
        /\bColor\(/.test(codeOnly(readText(file)))
      );
      expect(constructorSites).toEqual([CARD_ROW, THEME]);
      // The row's one call turns the card's own accent (data, from `CardVisuals.kt`) into a Color.
      expect(flatCode(CARD_ROW).match(/\bColor\(/g)).toHaveLength(1);
      expect(flatCode(CARD_ROW)).toContain(
        'private fun Rgb.toColor(): Color = Color(red = red, green = green, blue = blue)'
      );
    });

    it('builds the scheme on those roles and nothing else', () => {
      const scheme = namedArguments(
        enclosed(flatCode(THEME), 'private val CardiColorScheme: ColorScheme = ColorScheme(', THEME)
      );
      expect(scheme).toEqual({
        primary: 'Beam',
        onPrimary: 'Ink',
        primaryContainer: 'Ink',
        onPrimaryContainer: 'Beam',
        background: 'Color.Black',
        onBackground: 'Cream',
        surfaceContainer: 'Ink',
        onSurface: 'Cream',
        onSurfaceVariant: 'CreamSecondary'
      });
    });

    it('wraps the app in that scheme, with no custom typeface or shapes', () => {
      // §5.2: no custom typeface ships to the watch. Passing `typography` is how one would.
      expect(flatCode(THEME)).toContain(
        'MaterialTheme(colorScheme = CardiColorScheme, content = content)'
      );
      expect(fs.existsSync(path.join(repoRoot, WEAR_SRC, 'main/res/font'))).toBe(false);
    });
  });

  describe('the retired values are gone from the Wear source', () => {
    // Raw text, comments INCLUDED, and every file under `src/` — main and test, Kotlin and XML.
    // The acceptance criterion is "searched, they are gone", and a comment quoting a value is
    // exactly what a later reader copies back.
    const sources = (): string[] => filesUnder(WEAR_SRC, ['.kt', '.kts', '.xml']);

    it.each(RETIRED_HEXES)('#%s appears nowhere', (hex) => {
      const sites = sources().filter((file) => occurrences(readText(file), hex) > 0);
      expect(sites).toEqual([]);
    });

    it.each(['CarbonSurface', 'BrandPrimaryDark', 'CarbonColorScheme'])(
      'the retired name %s appears nowhere',
      (name) => {
        const sites = sources().filter((file) => readText(file).includes(name));
        expect(sites).toEqual([]);
      }
    );
  });

  describe('the card row (§5.3, §4.4, §7.2)', () => {
    const row = (): string => flatCode(CARD_ROW);

    it('paints no white: cream for the name, ink or cream for the initials', () => {
      expect(row()).not.toMatch(/\bColor\.White\b/);
      expect(row()).toMatch(/text = card\.name, color = Cream, fontSize = 15\.sp,/);
      expect(row()).toMatch(
        /text = presentation\.initials, color = if \(presentation\.useWhiteText\) Cream else Ink, fontSize = 12\.sp, fontWeight = FontWeight\.Bold,/
      );
    });

    it('is an ink row with the dark-outline hairline on a near-black accent', () => {
      expect(row()).toContain('colors = CardDefaults.cardColors(containerColor = Ink)');
      expect(row()).toMatch(
        /border = if \(presentation\.isNearBlackAvatar\) \{ BorderStroke\(1\.dp, Hairline\) \} else \{ null \}/
      );
    });

    it('draws the favourite star in beam, 14 dp, with nothing behind it', () => {
      expect(flatCode(THEME)).toContain('val FavoriteStarTint: Color = Beam');
      const star = enclosed(row(), 'if (card.isFavorite) {', CARD_ROW);
      expect(star).toMatch(
        /^ Icon\( painter = painterResource\(R\.drawable\.ic_star_filled\), contentDescription = null, tint = FavoriteStarTint, modifier = Modifier\.size\(14\.dp\), \) $/
      );
    });

    it('is 48 tall and rounded 14, from the metrics', () => {
      const metrics = flatCode(CARD_ROW_METRICS);
      expect(metrics).toContain('val minimumTapHeight = 48.dp');
      expect(metrics).toContain('val cornerRadius = 14.dp');
      expect(row()).toContain('shape = RoundedCornerShape(CardRowMetrics.cornerRadius)');
      expect(row()).toContain('.heightIn(min = CardRowMetrics.minimumTapHeight)');
    });
  });

  describe('the list and its empty state (§3, §3.2)', () => {
    const list = (): string => flatCode(CARD_LIST);

    it('keeps the rows 4 apart', () => {
      expect(list()).toContain('verticalArrangement = Arrangement.spacedBy(4.dp)');
    });

    it('draws the empty state in cream: glyph 50 %, title full, subtitle 60 %', () => {
      const body = functionBody(list(), 'private fun EmptyState(', CARD_LIST);
      expect(list()).not.toMatch(/\bColor\.White\b/);
      expect(body).toContain('tint = Cream.copy(alpha = 0.5f), modifier = Modifier.size(40.dp)');
      expect(body).toMatch(
        /text = stringResource\(R\.string\.cards_empty_title\), textAlign = TextAlign\.Center, style = MaterialTheme\.typography\.titleMedium, color = Cream,/
      );
      expect(body).toMatch(
        /text = stringResource\(R\.string\.cards_empty_subtitle\), textAlign = TextAlign\.Center, style = MaterialTheme\.typography\.bodySmall, color = CreamSecondary,/
      );
    });

    it('paints the sort control beam, with an ink label and glyph', () => {
      const button = functionBody(list(), 'private fun SortControlButton(', CARD_LIST);
      expect(
        namedArguments(enclosed(button, 'colors = ButtonDefaults.buttonColors(', CARD_LIST))
      ).toEqual({
        containerColor: 'MaterialTheme.colorScheme.primary',
        contentColor: 'MaterialTheme.colorScheme.onPrimary',
        iconColor: 'MaterialTheme.colorScheme.onPrimary'
      });
      // The glyph keeps its place and size; its colour is the button's iconColor above.
      expect(button).toContain(
        'Icon( painter = painterResource(R.drawable.ic_sort), contentDescription = null, modifier = Modifier.size(18.dp), )'
      );
    });
  });

  describe('the sort picker (§8.1)', () => {
    const picker = (): string => flatCode(SORT_PICKER);

    it('keeps the native RadioButton, on ink rows, the selection in beam', () => {
      expect(
        namedArguments(enclosed(picker(), 'RadioButtonDefaults.radioButtonColors(', SORT_PICKER))
      ).toEqual({
        selectedContainerColor: 'colorScheme.surfaceContainer',
        selectedContentColor: 'colorScheme.primary',
        selectedControlColor: 'colorScheme.primary',
        unselectedContainerColor: 'colorScheme.surfaceContainer',
        unselectedContentColor: 'colorScheme.onSurface',
        unselectedControlColor: 'colorScheme.onSurfaceVariant'
      });
      expect(picker()).toContain('val colorScheme = MaterialTheme.colorScheme');
      expect(picker()).toMatch(
        /RadioButton\( selected = isSelected, onSelect = \{ onModeSelected\(mode\) \}, colors = radioColors,/
      );
      // The frames' dot is schematic: nothing here draws a control of its own.
      expect(picker()).not.toMatch(/\bCanvas\b|drawCircle|CircleShape/);
    });

    it('shows the selection twice: the selected label semibold, the others regular', () => {
      expect(picker()).toContain('val isSelected = mode == selected');
      expect(picker()).toContain(
        'fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal'
      );
    });
  });

  describe('the crown and the rotary scroll; they never act (§8)', () => {
    const EXPLICIT_ROTARY =
      'rotaryScrollableBehavior = RotaryScrollableDefaults.behavior(scrollableState = listState)';

    it.each([
      ['the card list', CARD_LIST],
      ['the sort picker', SORT_PICKER]
    ])('%s names its rotary behaviour, once, on the list it scrolls', (_label, file) => {
      const code = flatCode(file);
      expect(occurrences(code, EXPLICIT_ROTARY)).toBe(1);
      expect(occurrences(code, 'rotaryScrollableBehavior')).toBe(1);
      // Wired twice is the column's parameter AND a modifier: two handlers on one input.
      expect(code).not.toMatch(
        /\.rotaryScrollable\(|onRotaryScrollEvent|onPreRotaryScrollEvent|rotaryHandler/
      );
      // The behaviour scrolls the very state the column and the scaffold are built on.
      expect(code).toContain('ScreenScaffold(scrollState = listState');
      expect(enclosed(code, 'TransformingLazyColumn(', file)).toMatch(/^ state = listState,/);
    });

    it('binds rotary in the two lists and the barcode, and nowhere else in the Wear app', () => {
      const rotarySites = wearKotlinFiles().filter((file) =>
        /rotary/i.test(codeOnly(readText(file)))
      );
      expect(rotarySites).toEqual([BARCODE, CARD_LIST, SORT_PICKER]);
    });
  });

  describe('rotary pages through the cards on the barcode (§8; decisions 4–6)', () => {
    const barcode = (): string => flatCode(BARCODE);
    const pager = (): string => enclosed(barcode(), 'VerticalPager(', BARCODE);

    it('has exactly one rotary reader: the snap behaviour at low sensitivity, on the pager', () => {
      expect(occurrences(barcode(), '.rotaryScrollable(')).toBe(1);
      expect(barcode()).not.toMatch(
        /onRotaryScrollEvent|onPreRotaryScrollEvent|rotaryHandler|rotaryScrollableBehavior/
      );
      expect(pager()).toContain(
        '.requestFocusOnHierarchyActive() .rotaryScrollable( behavior = RotaryScrollableDefaults.snapBehavior( scrollableState = pagerState, layoutInfoProvider = snapLayoutInfo, snapSensitivity = RotaryScrollableDefaults.LowSnapSensitivity, ), focusRequester = focusRequester, ),'
      );
      expect(occurrences(barcode(), 'LowSnapSensitivity')).toBe(1);
      expect(barcode()).not.toMatch(/HighSnapSensitivity/);
    });

    it('snaps one card per page: the provider reads one item per page off the pager', () => {
      const provider = enclosed(
        barcode(),
        'private class PagerSnapLayoutInfo(private val state: PagerState) : RotarySnapLayoutInfoProvider {',
        BARCODE
      );
      expect(provider.trim()).toBe(
        [
          'override val averageItemSize: Float get() = state.layoutInfo.pageSize.toFloat()',
          'override val currentItemIndex: Int get() = state.currentPage',
          'override val currentItemOffset: Float get() = state.currentPageOffsetFraction * averageItemSize',
          'override val totalItemCount: Int get() = state.pageCount'
        ].join(' ')
      );
    });

    it('is the foundation pager with swipe paging off, and nothing else scrolls or pages', () => {
      // wear-compose's pager wraps each page in a hierarchical focus group, which on the AVD
      // cleared the focus of a reader wired outside its pages: rotary then did nothing.
      expect(barcode()).toContain('import androidx.compose.foundation.pager.VerticalPager');
      expect(barcode()).not.toMatch(/androidx\.wear\.compose\.foundation\.pager/);
      expect(occurrences(barcode(), 'VerticalPager(')).toBe(1);
      expect(pager()).toMatch(/^ state = pagerState,/);
      expect(pager()).toContain('userScrollEnabled = false,');
      // The card on each side is composed, so its barcode has rendered by the time it slides in.
      expect(pager()).toContain('beyondViewportPageCount = 1,');
      expect(barcode()).not.toMatch(
        /HorizontalPager|verticalScroll|horizontalScroll|LazyColumn|LazyRow|\.scrollable\(|draggable|swipeable|detectDragGestures|detectVerticalDragGestures/
      );
    });

    it('overlays nothing on the field: no page indicator, no scroll indicator, no clock', () => {
      expect(barcode()).not.toMatch(/PageIndicator|ScrollIndicator|PositionIndicator/);
      // A scaffold given a scroll state draws a scroll indicator over the field.
      expect(barcode()).toContain('ScreenScaffold(modifier = modifier, timeText = {})');
      expect(barcode()).not.toMatch(/scrollState\s*=/);
    });

    it('holds the list’s order at opening, from the list’s own sort, for the visit', () => {
      expect(barcode()).toContain(
        'val heldOrder: List<String> = rememberSaveable { ArrayList(BarcodePaging.heldOrder(cards, sortMode, CardSorter())) }'
      );
      expect(barcode()).toContain(
        'val reachable = remember(heldOrder, cardsById) { BarcodePaging.reachableIds(heldOrder, cardsById.keys) }'
      );
      expect(pager()).toContain('key = { page -> currentReachable[page] },');
      expect(flatCode(BARCODE_PAGING)).toContain(
        'fun heldOrder(cards: List<WearCard>, sortMode: WatchSortMode, sorter: CardSorter): List<String> = sorter.sort(cards, sortMode).map { it.id }'
      );
      // The route hands the screen what the list sorted, not one resolved card.
      expect(flatCode(WEAR_APP)).toContain(
        'BarcodeScreen( openedCardId = backStackEntry.arguments?.getString(ARG_CARD_ID), cards = cards, sortMode = sortMode,'
      );
    });

    it('opens on the tapped card and keeps the visit’s state across a recreation', () => {
      expect(barcode()).toContain(
        'val pagerState = rememberPagerState(initialPage = reachable.indexOf(shownCardId).coerceAtLeast(0)) { currentReachable.size }'
      );
      expect(barcode()).toContain(
        'var shownId by rememberSaveable { mutableStateOf(openedCardId) } var arrival by rememberSaveable { mutableStateOf(BarcodeArrival.Opened) } var counted by rememberSaveable { mutableStateOf(false) }'
      );
    });

    it('re-anchors the pager on the live card at rest when a held card drops out', () => {
      // The live `shownId`, not the `shownCardId` captured at composition: a sync landing as the
      // pager settles on a new card would otherwise scroll it back to the card before.
      expect(barcode()).toContain(
        'LaunchedEffect(reachable) { val position = reachable.indexOf(shownId ?: return@LaunchedEffect) if (position >= 0 && position != pagerState.currentPage && !pagerState.isScrollInProgress) { pagerState.scrollToPage(position) } }'
      );
    });

    it('takes the card on screen from the pager only once it has come to rest', () => {
      expect(barcode()).toContain(
        'snapshotFlow { pagerState.isScrollInProgress to pagerState.settledPage } .collect { (moving, page) -> if (moving) return@collect val settledId = BarcodePaging.idAtPage(page, currentReachable) ?: return@collect if (settledId != shownId) { shownId = settledId arrival = BarcodeArrival.Paged counted = false } }'
      );
    });

    it('counts the card at rest: the opened one at once with the open haptic, a paged one after the policy’s delay', () => {
      expect(barcode()).toContain(
        'LaunchedEffect(shownCardId, arrival, counted, pageMoving) { if (counted || pageMoving) return@LaunchedEffect if (arrival == BarcodeArrival.Opened) haptics.performHapticFeedback(HapticFeedbackType.Confirm) delay(BarcodePaging.usageDelay(arrival)) usageRecorder.recordCardUsed(shownCardId, UsageTimestamps.now()) counted = true }'
      );
      expect(barcode()).toContain('val pageMoving = pagerState.isScrollInProgress');
      expect(occurrences(barcode(), 'recordCardUsed(')).toBe(1);
      expect(occurrences(barcode(), 'performHapticFeedback(')).toBe(1);
      const paging = flatCode(BARCODE_PAGING);
      expect(paging).toContain('val PAGED_USAGE_DELAY: Duration = 1.seconds');
      expect(paging).toContain(
        'when (arrival) { BarcodeArrival.Opened -> Duration.ZERO BarcodeArrival.Paged -> PAGED_USAGE_DELAY }'
      );
    });

    it('keeps every per-card effect off the pages, which the pager also composes beside', () => {
      const page = functionBody(barcode(), 'private fun BarcodePage(', BARCODE);
      expect(page).not.toMatch(/recordCardUsed|performHapticFeedback|KeepScreenAwakeAndBright/);
      // Full brightness follows the card at rest: one call site, released on an error card.
      expect(occurrences(barcode(), 'KeepScreenAwakeAndBright()')).toBe(2);
      expect(barcode()).toContain(
        'if (failedCardIds[shownCardId] != true) { KeepScreenAwakeAndBright() }'
      );
      // Each page reports a failed render; the screen records it by card, for the call above.
      expect(page).toContain(
        'val failed = state is BarcodeRenderState.Failed LaunchedEffect(failed) { currentOnRenderFailedChange(failed) }'
      );
      expect(barcode()).toContain(
        'onRenderFailedChange = { failed -> failedCardIds[card.id] = failed },'
      );
    });

    it('slides, or crossfades in place under reduce motion', () => {
      expect(barcode()).toContain('val reduceMotion = LocalReduceMotion.current');
      expect(barcode()).toContain(
        'modifier = if (reduceMotion) Modifier.crossfadeInPlace(pagerState, page) else Modifier,'
      );
      expect(barcode()).toContain(
        'translationY = offset * size.height alpha = 1f - offset.absoluteValue.coerceIn(0f, 1f)'
      );
    });

    it('offers TalkBack “Next card” and “Previous card”, each only where that move exists', () => {
      expect(barcode()).toContain(
        'BarcodePaging.pageAfter(shownCardId, reachable, step = 1)?.let { target -> add(CustomAccessibilityAction(nextCardLabel) { pageTo(target) }) }'
      );
      expect(barcode()).toContain(
        'BarcodePaging.pageAfter(shownCardId, reachable, step = -1)?.let { target -> add(CustomAccessibilityAction(previousCardLabel) { pageTo(target) }) }'
      );
      expect(barcode()).toContain('scope.launch { pagerState.animateScrollToPage(target) }');
      expect(barcode()).toContain(
        'accessibilityActions = if (card.id == shownCardId) pagingActions else emptyList(),'
      );
      // On the page node, merged, so TalkBack focuses one node per card that carries them.
      expect(functionBody(barcode(), 'private fun BarcodePage(', BARCODE)).toContain(
        '.semantics(mergeDescendants = true) { customActions = accessibilityActions }'
      );
      expect(readText(STRINGS_EN)).toContain('<string name="barcode_next_card">Next card</string>');
      expect(readText(STRINGS_EN)).toContain(
        '<string name="barcode_previous_card">Previous card</string>'
      );
      expect(readText(STRINGS_IT)).toContain(
        '<string name="barcode_next_card">Carta successiva</string>'
      );
      expect(readText(STRINGS_IT)).toContain(
        '<string name="barcode_previous_card">Carta precedente</string>'
      );
    });
  });

  describe('the barcode (§6) — and a tap no longer leaves it (decision 1)', () => {
    const barcode = (): string => flatCode(BARCODE);

    it('has no tap handler and no dismissal latch', () => {
      expect(barcode()).not.toMatch(
        /detectTapGestures|pointerInput|clickable|combinedClickable|onClick|dismissOnce|\bdismissed\b/
      );
    });

    it('returns to the list by itself only when the card on screen has gone', () => {
      expect(occurrences(barcode(), 'currentOnDismiss()')).toBe(1);
      expect(barcode()).toContain(
        'val shown = cards.firstOrNull { it.id == shownId } if (shown == null) { LaunchedEffect(Unit) { currentOnDismiss() } return }'
      );
    });

    it('stays as shipped: white edge to edge, crisp bars, black title, full brightness', () => {
      expect(barcode()).toMatch(
        /ScreenScaffold\(modifier = modifier, timeText = \{\}\) \{ contentPadding -> Box\( modifier = Modifier \.fillMaxSize\(\) \.background\(Color\.White\), contentAlignment = Alignment\.Center, \)/
      );
      expect(barcode()).toContain('filterQuality = FilterQuality.None');
      expect(barcode()).toMatch(
        /Text\( text = title, color = Color\.Black, style = MaterialTheme\.typography\.titleSmall,/
      );
      expect(barcode()).toContain('BRIGHTNESS_OVERRIDE_FULL');
      expect(barcode()).toContain('FLAG_KEEP_SCREEN_ON');
    });

    it('reads no Cardì role: no beam, ink or cream on the scan surface', () => {
      expect(barcode()).not.toMatch(/presentation\.theme|\bBeam\b|\bInk\b|\bCream\b|colorScheme/);
    });
  });

  describe('the theme’s KDoc names the grammar, not the retired system (§1)', () => {
    it('points at the grammar', () => {
      expect(readText(THEME)).toContain('docs/design/cardi/cardi-watch-grammar.md');
    });

    it('no longer cites Carbon Utility or the EdgeButton nothing uses', () => {
      // Raw text: the KDoc is exactly where the old citation lived.
      expect(readText(THEME)).not.toMatch(/Carbon|EdgeButton|ux-design-specification/);
    });
  });
});

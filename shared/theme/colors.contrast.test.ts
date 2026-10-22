import { CARD_COLORS, DARK_THEME, IDENTITY_COLORS, LIGHT_THEME, NEUTRAL_COLORS } from './colors';
import { getContrastForeground, getFavouriteStarColor } from './luminance';

const AA_TEXT = 4.5;
/** WCAG 1.4.11 — icons, glyphs and other non-text content. */
const AA_NON_TEXT = 3;

const hexToRgb = (hexColor: string) => {
  const cleaned = hexColor.replace('#', '');
  const value =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : cleaned;

  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);

  return { red, green, blue };
};

const linearize = (channel: number) => {
  const normalized = channel / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
};

const luminance = (hexColor: string) => {
  const { red, green, blue } = hexToRgb(hexColor);
  const r = linearize(red);
  const g = linearize(green);
  const b = linearize(blue);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrastRatio = (foregroundHex: string, backgroundHex: string) => {
  const l1 = luminance(foregroundHex);
  const l2 = luminance(backgroundHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

describe('Theme contrast compliance', () => {
  it('meets AA contrast for primary text on light and dark backgrounds (>= 4.5)', () => {
    expect(contrastRatio(LIGHT_THEME.textPrimary, LIGHT_THEME.background)).toBeGreaterThanOrEqual(
      4.5
    );
    expect(contrastRatio(DARK_THEME.textPrimary, DARK_THEME.background)).toBeGreaterThanOrEqual(
      4.5
    );
  });

  it('meets AA contrast for secondary text on light and dark backgrounds (>= 4.5)', () => {
    expect(contrastRatio(LIGHT_THEME.textSecondary, LIGHT_THEME.background)).toBeGreaterThanOrEqual(
      4.5
    );
    expect(contrastRatio(DARK_THEME.textSecondary, DARK_THEME.background)).toBeGreaterThanOrEqual(
      4.5
    );
  });

  /**
   * `textTertiary` was never asserted here, and it is not decoration: it is the
   * colour of `TextField`'s character count and the brand list's note. (The OTP
   * field's placeholder went with the code field's move onto `TextField` in
   * Story 22.9; `TextField`'s placeholder moved to `textSecondary` on `surface`
   * in Story 22.6 — asserted below; the wallet's search placeholder, empty-state
   * subtitle and single-card tip moved to `textSecondary` in Story 22.2, and the
   * brand list's search field became the wallet's in Story 22.5.) None of that
   * qualifies for the WCAG "large text" 3:1 exemption, so it is held to AA
   * against every ground a FIELD uses.
   * `backgroundSubtle` is deliberately absent: its one consumer is a genuinely
   * inactive field — `TextField`'s `disabled` branch (`editable={!disabled}`) —
   * which 1.4.3 exempts. (`VerifyEmailScreen`'s `loading` branch
   * (`editable={!loading}`) went with the same move in Story 22.9, and the
   * multi-code picker's pressed row took the 0.98× press instead in Story 22.5.)
   */
  it('meets AA contrast for tertiary text on every active ground (>= 4.5)', () => {
    (['background', 'surface', 'surfaceElevated'] as const).forEach((ground) => {
      expect(contrastRatio(LIGHT_THEME.textTertiary, LIGHT_THEME[ground])).toBeGreaterThanOrEqual(
        4.5
      );
      expect(contrastRatio(DARK_THEME.textTertiary, DARK_THEME[ground])).toBeGreaterThanOrEqual(
        4.5
      );
    });
  });

  /**
   * Story 22.6 — every `TextField`'s placeholder is `textSecondary` (the form frame's `#55555F`) on
   * the field's `surface` fill: white in light, ink in dark. A placeholder is text the person reads,
   * so it is held to AA on the ground it actually sits on.
   */
  it('meets AA contrast for a field placeholder — textSecondary on surface — in both schemes', () => {
    expect(contrastRatio(LIGHT_THEME.textSecondary, LIGHT_THEME.surface)).toBeGreaterThanOrEqual(
      AA_TEXT
    );
    expect(contrastRatio(DARK_THEME.textSecondary, DARK_THEME.surface)).toBeGreaterThanOrEqual(
      AA_TEXT
    );
  });

  it('keeps the text ramp ordered — primary is stronger than secondary is stronger than tertiary', () => {
    [LIGHT_THEME, DARK_THEME].forEach((theme) => {
      const onGround = (color: string) => contrastRatio(color, theme.background);
      expect(onGround(theme.textPrimary)).toBeGreaterThan(onGround(theme.textSecondary));
      expect(onGround(theme.textSecondary)).toBeGreaterThan(onGround(theme.textTertiary));
    });
  });

  it('meets minimum UI contrast for primary interactive color on backgrounds (>= 3)', () => {
    expect(contrastRatio(LIGHT_THEME.primary, LIGHT_THEME.background)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(DARK_THEME.primary, DARK_THEME.background)).toBeGreaterThanOrEqual(3);
  });
});

/**
 * The beam rule (Story 21.2, AC6).
 *
 * `cardi-design-system.md` states it as prose — beam "always pair[s] with ink
 * text (`#181824`), never white" — and prose does not fail a build. Beam is a
 * high-luminance yellow, so white on it is barely over 1.5:1: the kind of
 * defect that looks *brighter* in a screenshot and is unreadable in daylight.
 * Dark mode makes beam the fill of every primary action, which is exactly where
 * a hardcoded white label would land, so the rule needs teeth in both
 * directions — the failing case is asserted as failing on purpose. If a future
 * palette edit ever makes white-on-beam pass, beam has been lightened or
 * muddied and that test SHOULD go red.
 */
/**
 * The five card accents, measured — Story 21.2a.
 *
 * This block exists because it DIDN'T, and that is how two accessibility
 * regressions reached QA review. Story 21.2a repainted `CARD_COLORS` and checked
 * that no foreground DECISION flipped (every accent keeps its light/dark class, so
 * `getContrastForeground` returns the same side it always did). That was true, and
 * it was not enough: the decision staying put says nothing about whether the new
 * hex still clears the bar the old one did. Azure did not.
 *
 * Every number below was computed from the committed hexes — no device, no
 * screenshot, no judgement call. It could have been written before the palette
 * shipped, which is the whole point.
 */
describe('Card accent contrast — the five custom-card colours (Story 21.2a)', () => {
  const ACCENT_FOREGROUND: Record<keyof typeof CARD_COLORS, string> = {
    blue: NEUTRAL_COLORS.white,
    red: NEUTRAL_COLORS.white,
    green: NEUTRAL_COLORS.white,
    orange: IDENTITY_COLORS.ink,
    grey: NEUTRAL_COLORS.white
  };

  it('getContrastForeground picks the side this block measures', () => {
    // Guards the table above against the helper's threshold moving underneath it.
    for (const [key, hex] of Object.entries(CARD_COLORS)) {
      expect(getContrastForeground(hex)).toBe(ACCENT_FOREGROUND[key as keyof typeof CARD_COLORS]);
    }
  });

  it('four of the five accents carry AA body text', () => {
    for (const key of ['blue', 'red', 'green', 'orange'] as const) {
      expect(contrastRatio(ACCENT_FOREGROUND[key], CARD_COLORS[key])).toBeGreaterThanOrEqual(
        AA_TEXT
      );
    }
  });

  /**
   * ⛔ ESCALATED, NOT ACCEPTED. The azure `#0C84CC` is one of the five accents the
   * design system fixes, and NO foreground clears AA on it — white is 4.05:1 and ink,
   * the best available, is 4.34:1 against a 4.5:1 floor. It is not a foreground bug
   * and cannot be fixed by choosing differently; the colour sits in the dead zone
   * where neither black nor white reaches AA.
   *
   * It reaches a user on card detail mid-blend (Story 22.3): the condensed bar is the
   * ground, but while it blends from an azure field the title — `card.name` at 17px
   * weight 600, under both WCAG large-text thresholds (24px regular / 18.66px bold), so
   * the 4.5:1 floor applies rather than 3:1 — fades in over the azure. And the key
   * is `grey`, which is also `DEFAULT_CARD_COLOR`, so every card whose colour cannot
   * be resolved lands here too.
   *
   * ⚠️ The retired `#64748B` PASSED at 4.76:1, so this is a regression, and it ships
   * in a release with no OTA remedy. Pinned as a measurement rather than a passing
   * assertion so the number is visible in CI and cannot be lost again. Resolving it
   * needs a design decision — accept the exception, take a darker azure, or restrict
   * the accent to large text.
   */
  it('AZURE carries NO AA-compliant foreground — a design-system constraint, pinned', () => {
    expect(contrastRatio(NEUTRAL_COLORS.white, CARD_COLORS.grey)).toBeCloseTo(4.05, 2);
    expect(contrastRatio(IDENTITY_COLORS.ink, CARD_COLORS.grey)).toBeCloseTo(4.34, 2);

    const best = Math.max(
      contrastRatio(NEUTRAL_COLORS.white, CARD_COLORS.grey),
      contrastRatio(IDENTITY_COLORS.ink, CARD_COLORS.grey)
    );
    expect(best).toBeLessThan(AA_TEXT);

    // The colour it replaced did clear the bar. This is the regression, stated.
    expect(contrastRatio(NEUTRAL_COLORS.white, '#64748B')).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('every accent clears the 3:1 non-text floor, so icons and glyphs on it are legible', () => {
    for (const [key, hex] of Object.entries(CARD_COLORS)) {
      expect(
        contrastRatio(ACCENT_FOREGROUND[key as keyof typeof CARD_COLORS], hex)
      ).toBeGreaterThanOrEqual(AA_NON_TEXT);
    }
  });

  /**
   * The favourite star, which `getFavouriteStarColor` draws directly on the accent.
   *
   * Story 21.2a is a net IMPROVEMENT here and the aggregate is worth stating, because
   * a per-colour reading makes it look like a pure regression. Measured on the star
   * the app ACTUALLY draws — `getFavouriteStarColor` returns beam below 0.5
   * `getLuminance` and ink above, so a light accent never gets a beam star at all:
   *
   *   old: blue 2.96 FAIL · red 3.07 · green 2.16 FAIL · orange 8.18 (ink) · grey 3.12
   *   new: blue 6.91 · red 3.01 · green 3.15 · orange 11.53 (ink) · azure 2.66 FAIL
   *
   * Two failures became one. Azure is a genuine regression and is escalated above;
   * the deep blue and the green, which both failed before, are fixed.
   */
  it('the favourite star clears 3:1 on four accents, and fails on azure', () => {
    for (const key of ['blue', 'red', 'green', 'orange'] as const) {
      expect(
        contrastRatio(getFavouriteStarColor(CARD_COLORS[key]), CARD_COLORS[key])
      ).toBeGreaterThanOrEqual(AA_NON_TEXT);
    }

    // Same root cause as the AA failure above, same escalation: a beam star on azure
    // is 2.66:1, where the retired grey gave 3.12:1. Ink would give 4.34:1, but the
    // "beam star on a dark field" rule is Story 21.2's and covers 44 brand colours
    // too, so its threshold is not this story's to move.
    expect(contrastRatio(getFavouriteStarColor(CARD_COLORS.grey), CARD_COLORS.grey)).toBeCloseTo(
      2.66,
      2
    );
    expect(contrastRatio(IDENTITY_COLORS.beam, '#64748B')).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });
});

describe('The beam rule — text on beam is ink, never white', () => {
  it('ink on beam meets AA for body text', () => {
    expect(contrastRatio(IDENTITY_COLORS.ink, IDENTITY_COLORS.beam)).toBeGreaterThanOrEqual(
      AA_TEXT
    );
  });

  it('white on beam fails AA, so the rule has teeth', () => {
    expect(contrastRatio(NEUTRAL_COLORS.white, IDENTITY_COLORS.beam)).toBeLessThan(AA_TEXT);
  });

  it('the dark primary action is beam carrying ink, and it is legible', () => {
    expect(DARK_THEME.primary).toBe(IDENTITY_COLORS.beam);
    expect(DARK_THEME.onPrimary).toBe(IDENTITY_COLORS.ink);
    expect(contrastRatio(DARK_THEME.onPrimary, DARK_THEME.primary)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('the light primary action is ink carrying white, and it is legible', () => {
    expect(LIGHT_THEME.primary).toBe(IDENTITY_COLORS.ink);
    expect(LIGHT_THEME.onPrimary).toBe(NEUTRAL_COLORS.white);
    expect(contrastRatio(LIGHT_THEME.onPrimary, LIGHT_THEME.primary)).toBeGreaterThanOrEqual(
      AA_TEXT
    );
  });

  /**
   * `error` carries text in a dozen places AND fills a handful of buttons, and
   * the two want opposite labels once dark mode lifts the red far enough to read
   * on black: white then sits at 3.41:1 on it. That is the same shape as the
   * beam trap — a token that is safe as a foreground being assumed safe as a
   * field — so it gets the same guard rather than a comment.
   */
  it('the error fill carries onError, and white would not do in dark', () => {
    expect(contrastRatio(LIGHT_THEME.onError, LIGHT_THEME.error)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(DARK_THEME.onError, DARK_THEME.error)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(NEUTRAL_COLORS.white, DARK_THEME.error)).toBeLessThan(AA_TEXT);
  });

  it('error text stays legible on every ground it is drawn on', () => {
    expect(contrastRatio(LIGHT_THEME.error, LIGHT_THEME.background)).toBeGreaterThanOrEqual(
      AA_TEXT
    );
    expect(contrastRatio(LIGHT_THEME.error, LIGHT_THEME.surface)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(DARK_THEME.error, DARK_THEME.background)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(DARK_THEME.error, DARK_THEME.surface)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  /**
   * Which roles are beam is a decision, so it is written down rather than
   * implied. Light has NONE on purpose: beam is 1.33:1 on cream and 1.52:1 on
   * white, so it can be a field that carries ink but never a mark drawn on a
   * light ground. Dark gives it the roles that ask for an action. Adding a role
   * here should be a deliberate act, not a side effect of editing a hex.
   */
  it('names exactly the roles that resolve to beam, in each theme', () => {
    const beamRoles = (theme: typeof LIGHT_THEME | typeof DARK_THEME) =>
      Object.entries(theme)
        .filter(([, value]) => value === IDENTITY_COLORS.beam)
        .map(([role]) => role)
        .sort();

    expect(beamRoles(LIGHT_THEME)).toEqual([]);
    expect(beamRoles(DARK_THEME)).toEqual(['link', 'primary', 'warning']);
  });
});

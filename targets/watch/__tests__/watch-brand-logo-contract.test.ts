import fs from 'node:fs';
import path from 'node:path';

import {
  brandLogoImagesets,
  imagesetMembers,
  parseSwiftStringSet
} from './watch-catalogue-helpers';

// Story 16.29 — the watch card list draws real brand artwork instead of initials.
//
// These assertions guard the wiring, not the pixels: that the row resolves logos
// through the shared BrandLogoCatalog rather than a second copy of the rules, that
// both initials fallbacks survive, that the logo stays decorative, and that the
// watch app target actually ships the imagesets its generated data claims. Like
// the other watch contract suites this regex-parses Swift source; it does not run
// it, so keep the assertions about declarations that carry meaning.

const repoRoot = path.resolve(__dirname, '../../..');
const watchDir = path.join(repoRoot, 'targets', 'watch');
const widgetDir = path.join(repoRoot, 'targets', 'watch-widget');
const cardListViewPath = path.join(watchDir, 'CardListView.swift');
const layoutPath = path.join(watchDir, 'WatchPresentationLayout.swift');
const watchAssetsDir = path.join(watchDir, 'Assets.xcassets');
const widgetAssetsDir = path.join(widgetDir, 'Assets.xcassets');
const authoredResolverPath = path.join(widgetDir, 'BrandLogoCatalog.swift');
const mirroredResolverPath = path.join(watchDir, 'Generated', 'BrandLogoCatalog.swift');
const watchCatalogPath = path.join(watchDir, 'Generated', 'BrandLogoCatalog.generated.swift');
const cataloguePath = path.join(repoRoot, 'catalogue', 'italy.json');

describe('watch card list brand-logo contract', () => {
  it('resolves row artwork through the shared BrandLogoCatalog', () => {
    const source = fs.readFileSync(cardListViewPath, 'utf8');

    expect(source).toContain('BrandLogoCatalog.assetName(for: brand.id)');
    // The dark-chip decision is the generator's luminance analysis, shared with the
    // complication. Re-deriving it in the view is the thing AC3 forbids.
    expect(source).toContain('BrandLogoCatalog.prefersDarkBacking(for: brand.id)');
    // Reading the generated set directly, or recomputing luminance, would both be a
    // second copy of the decision. (Referring to the set in a comment is fine.)
    expect(source).not.toContain('lightLogoBrandIds.contains');
    expect(source).not.toContain('relativeLuminance(');
  });

  it('keeps both initials fallbacks', () => {
    const source = fs.readFileSync(cardListViewPath, 'utf8');

    // A catalogue brand with no bundled imageset, and a custom card. Neither may
    // degrade to an empty circle.
    expect(source).toContain('initials(from: brand.name ?? brand.id)');
    expect(source).toContain('initials(from: card.name)');
  });

  it('draws the logo as a decorative image so the row stays one accessibility element', () => {
    const source = fs.readFileSync(cardListViewPath, 'utf8');

    // Image(decorative:) is omitted from the accessibility tree entirely, so the
    // combined label stays "card name (+ favourite state)".
    expect(source).toContain('Image(decorative: assetName)');
    expect(source).toContain('.accessibilityElement(children: .combine)');
    expect(source).toContain(
      '.accessibilityLabel(WatchL10n.format(cardRowAccessibilityKey(isFavorite: card.isFavorite), card.name))'
    );
  });

  it('leaves the accent bar, favourite star and row geometry unchanged', () => {
    const source = fs.readFileSync(cardListViewPath, 'utf8');

    expect(source).toContain('.frame(width: metrics.accentWidth, height: metrics.accentHeight)');
    expect(source).toContain('Image(systemName: "star.fill")');
    expect(source).toContain('.frame(width: metrics.avatarSize, height: metrics.avatarSize)');
    expect(source).toContain('.clipShape(Circle())');
  });

  it('keeps the logo chip, and rings a dark chip with the Cardì hairline (Story 23.2)', () => {
    const source = fs.readFileSync(cardListViewPath, 'utf8');

    // The chip stays exactly as it was: a white plate for dark artwork, a black one for light
    // artwork. It is the backing a brand's mark was drawn for, so it is not chrome and does not
    // take cream or ink.
    expect(source).toContain('prefersDarkBacking ? Color.black : Color.white');

    // What changed is the ring around the dark chip, which keeps it apart from the ink row: the
    // system's dark outline `#3A3A48` (watch grammar §4.1), not white at 15 %.
    expect(source).toContain(
      '.strokeBorder(prefersDarkBacking ? WatchColor.hairline : Color.clear, lineWidth: 1)'
    );
    expect(source).not.toContain('Color.white.opacity(0.15)');
  });

  it('insets logo artwork to the circle inscribed square via a derived metric', () => {
    const source = fs.readFileSync(cardListViewPath, 'utf8');
    const layout = fs.readFileSync(layoutPath, 'utf8');

    expect(source).toContain('.padding(metrics.avatarLogoInset)');
    // Derived from avatarSize rather than hardcoded, so the two cannot drift.
    expect(layout).toContain('var avatarLogoInset: CGFloat');
    expect(layout).toContain('avatarSize * (1 - (1 / 2.0.squareRoot()))');
  });

  it('ships the widget brand-logo imagesets in the watch app target, byte for byte', () => {
    const widgetImagesets = brandLogoImagesets(widgetAssetsDir);
    expect(widgetImagesets.length).toBeGreaterThan(0);
    expect(brandLogoImagesets(watchAssetsDir)).toEqual(widgetImagesets);

    for (const imageset of widgetImagesets) {
      const widgetFiles = imagesetMembers(path.join(widgetAssetsDir, imageset));
      expect(imagesetMembers(path.join(watchAssetsDir, imageset))).toEqual(widgetFiles);
      for (const file of widgetFiles) {
        expect(fs.readFileSync(path.join(watchAssetsDir, imageset, file))).toEqual(
          fs.readFileSync(path.join(widgetAssetsDir, imageset, file))
        );
      }
    }
  });

  it('leaves the prebuild-owned AppIcon catalogue entry in place', () => {
    // expo prebuild rewrites this file; the mirror must only ever touch BrandLogo-*.
    expect(fs.existsSync(path.join(watchAssetsDir, 'AppIcon.appiconset', 'Contents.json'))).toBe(
      true
    );
    expect(fs.existsSync(path.join(watchAssetsDir, 'AccentColor.colorset'))).toBe(true);
  });

  it('generates the watch app resolver from the authored widget copy, not a second source', () => {
    const authored = fs.readFileSync(authoredResolverPath, 'utf8');
    const mirrored = fs.readFileSync(mirroredResolverPath, 'utf8');

    expect(mirrored).toContain('// DO NOT EDIT — This file is auto-generated.');
    expect(mirrored).toContain(authored);
  });

  it('claims a bundled imageset for exactly the brands that ship one', () => {
    const catalogue = JSON.parse(fs.readFileSync(cataloguePath, 'utf8')) as {
      brands: { id: string }[];
    };
    const known = parseSwiftStringSet(
      fs.readFileSync(watchCatalogPath, 'utf8'),
      'knownBrandIds',
      'the generated watch app catalog'
    );

    expect(known).toEqual(
      brandLogoImagesets(watchAssetsDir)
        .map((name) => name.replace(/^BrandLogo-/, '').replace(/\.imageset$/, ''))
        .sort()
    );
    // Full coverage today. If this ever fails, the card list falls back to initials
    // for the uncovered brand — correct behaviour, but worth knowing about.
    for (const brand of catalogue.brands) {
      expect(known).toContain(brand.id);
    }
  });
});

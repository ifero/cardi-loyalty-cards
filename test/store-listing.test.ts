import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The store listing copy and the landing page's store badges (Story 24.6).
 *
 * `docs/store/listing.md` is pasted into the consoles by hand, so the console is the first thing
 * that would notice a field over its limit, and nothing at all would notice a retailer's name in
 * the copy until App Review did. Each field is a `text` block under a `#### <field> · max N`
 * heading; this suite holds every block to its limit, and every pasted block (the fields and the
 * App Review note) to the no-brands rule and to the privacy picture of Story 24.1.
 */

const ROOT = join(__dirname, '..');
const read = (relative: string): string => readFileSync(join(ROOT, relative), 'utf8');

const LISTING = read('docs/store/listing.md');
const INDEX = read('docs/index.html');
const APP = JSON.parse(read('app.json')) as {
  expo: { name: string; ios: { supportsTablet: boolean }; android: { package: string } };
};
const CATALOGUE = JSON.parse(read('catalogue/italy.json')) as { brands: { name: string }[] };

type Field = { heading: string; limit: number; bytes: boolean; text: string };

const FIELDS: Field[] = [
  ...LISTING.matchAll(/^#### (.+?) · max (\d+)( bytes)?\n\n```text\n([\s\S]*?)\n```$/gm)
].map(([, heading = '', limit = '0', bytes, text = '']) => ({
  heading,
  limit: Number(limit),
  bytes: Boolean(bytes),
  text
}));

/** Everything pasted into a console: every field plus the App Review note. */
const PASTED = [...LISTING.matchAll(/^```text\n([\s\S]*?)\n```$/gm)]
  .map(([, text = '']) => text)
  .join('\n\n');

const escape = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

describe('store listing copy (Story 24.6)', () => {
  it('has every field in both languages, plus the App Review note', () => {
    expect(PASTED).toContain('Catalogue logos.');
    // Per language: App Store subtitle, promo, keywords, description, what's new; Play short,
    // full, release notes.
    expect(FIELDS).toHaveLength(16);
  });

  it.each(FIELDS.map((field) => [field.heading, field]))('%s fits its limit', (_, field) => {
    const { limit, bytes, text } = field as Field;
    const size = bytes ? Buffer.byteLength(text, 'utf8') : [...text].length;
    expect(text.trim()).not.toBe('');
    expect(size).toBeLessThanOrEqual(limit);
  });

  it('writes keywords as a comma list without spaces around the commas', () => {
    FIELDS.filter((field) => field.bytes).forEach(({ text }) => {
      expect(text).not.toMatch(/\s,|,\s/);
      const words = text.split(',');
      expect(new Set(words).size).toBe(words.length);
    });
  });

  it('uses the app name exactly as app.json spells it', () => {
    expect(APP.expo.name).toBe('Cardì');
    expect(LISTING).toMatch(/^\| App name +\| Cardì +\| Cardì +\|$/m);
    expect(LISTING).not.toMatch(/\bCardi\b(?!app)/);
  });

  // The codice fiscale is a catalogue entry, not a retailer, and the Italian copy names it on
  // purpose (decision 5); the lottery is a state scheme, not a brand either.
  const NOT_RETAILERS = ['Codice Fiscale', 'Lotteria degli scontrini'];
  // What the stores publish: every listing field. The App Review note goes to Apple's reviewers
  // only, and names the two brands in the screenshots on purpose (decision 2, revised 2026-11-13).
  const PUBLISHED = FIELDS.map(({ text }) => text).join('\n\n');

  it.each(CATALOGUE.brands.map(({ name }) => name).filter((name) => !NOT_RETAILERS.includes(name)))(
    'never names the catalogue brand %s in a published field',
    (name) => {
      expect(PUBLISHED).not.toMatch(new RegExp(`(^|[^\\p{L}])${escape(name)}($|[^\\p{L}])`, 'iu'));
    }
  );

  it('names only the two screenshot brands in the App Review note', () => {
    const named = CATALOGUE.brands
      .map(({ name }) => name)
      .filter((name) => !NOT_RETAILERS.includes(name))
      .filter((name) => new RegExp(`(^|[^\\p{L}])${escape(name)}($|[^\\p{L}])`, 'iu').test(PASTED));
    expect(named.sort()).toEqual(['Esselunga', 'IKEA']);
  });

  it.each([
    ['English', '## English', '## Italiano', ['offline', 'optional', 'open source', 'No ads']],
    [
      'Italian',
      '## Italiano',
      '## Age rating',
      ['offline', 'facoltativ', 'open source', 'Niente pubblicità', 'codice fiscale']
    ]
  ])('states offline use, optional sync, open source and no ads in %s', (_, from, to, claims) => {
    const section = LISTING.slice(LISTING.indexOf(from as string), LISTING.indexOf(to as string));
    expect(section.length).toBeGreaterThan(0);
    (claims as string[]).forEach((claim) => expect(section).toContain(claim));
  });

  it('never claims that nothing leaves the device (crash diagnostics do, Story 24.1)', () => {
    expect(PASTED).not.toMatch(/never leaves?|nothing leaves|no data (is )?(collected|sent)/i);
    expect(PASTED).not.toMatch(/nessun dato (viene )?(raccolto|inviato)/i);
  });

  it('points at the cardiapp.eu privacy policy (Story 18.9)', () => {
    expect(LISTING).toContain('https://cardiapp.eu/privacy-policy.html');
  });
});

describe('iPhone only (Story 24.6, decision 1)', () => {
  it('does not declare iPad support', () => {
    expect(APP.expo.ios.supportsTablet).toBe(false);
  });
});

describe('landing page store badges (Story 24.6)', () => {
  const linkFor = (store: string): string => {
    const tag = INDEX.match(new RegExp(`<a[^>]*data-store-link="${store}"[^>]*>`))?.[0] ?? '';
    return tag.match(/href="([^"]*)"/)?.[1] ?? '';
  };

  it('links Google Play to the listing for the app package', () => {
    expect(linkFor('google-play')).toBe(
      `https://play.google.com/store/apps/details?id=${APP.expo.android.package}`
    );
  });

  it('links the App Store to an apps.apple.com listing, or to # until the app record exists', () => {
    expect(linkFor('app-store')).toMatch(/^(#|https:\/\/apps\.apple\.com\/app\/id\d+)$/);
  });
});

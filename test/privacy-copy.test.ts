import fs from 'node:fs';
import path from 'node:path';

import { en } from '@/shared/i18n/locales/en';
import { it as itLocale } from '@/shared/i18n/locales/it';

import { PRIVACY_POLICY_CONTENT, PRIVACY_POLICY_VERSION } from '@/assets/legal/privacy-policy';
import { PRIVACY_POLICY_CONTENT_IT } from '@/assets/legal/privacy-policy.it';

/**
 * The privacy copy says only what the code does (Story 24.1).
 *
 * Every surface that tells a user what Cardì collects (both locale files, both in-app policies, the
 * public policy, the landing page and the store answers) is read as text and searched for the
 * third-party domain and for the claims the code contradicted. The HTML is searched with its
 * whitespace collapsed, so a claim wrapped across two lines is still found.
 */
const repoRoot = path.resolve(__dirname, '..');

const SURFACES = [
  'shared/i18n/locales/en.ts',
  'shared/i18n/locales/it.ts',
  'assets/legal/privacy-policy.ts',
  'assets/legal/privacy-policy.it.ts',
  'docs/privacy-policy.html',
  'docs/index.html',
  'docs/store/privacy-disclosures.md',
  'features/help/HelpScreen.tsx',
  'features/help/help-data.json',
  'features/help/help-data.it.json',
  'features/help/help-fallback.ts'
] as const;

/** A surface as text, its HTML entities decoded and its whitespace collapsed (see `normalise`). */
const read = (relativePath: string) =>
  normalise(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));

/** Claims the code disproves, in English and Italian. */
const RETIRED_CLAIMS: readonly [string, RegExp][] = [
  ['an encrypted local database', /encrypted SQLite database|SQLite cifrato/i],
  [
    'no device identifiers',
    /device identifiers or advertising IDs|identificatori del dispositivo o ID pubblicitari/i
  ],
  [
    'no analytics or tracking',
    /no tracking|no analytics|analytics or tracking data|nessun tracciamento|nessuna analisi|dati analitici o di tracciamento/i
  ],
  ['guests send nothing', /everything stays on device|tutto resta sul dispositivo/i],
  [
    'guests transmit no personal data',
    /we do not collect or transmit any personal data|non raccogliamo n[eé] trasmettiamo alcun dato personale/i
  ],
  [
    'consent revocable in Settings',
    /revoke your consent at any time in Settings|revocare il consenso in qualsiasi momento nelle Impostazioni/i
  ],
  [
    'guest mode stops all cloud processing',
    /stops all cloud data processing|interrompe ogni trattamento cloud/i
  ],
  ['consent logs kept 3 years', /typically 3 years|in genere 3 anni/i],
  [
    'guest cards never leave the device',
    /cards never leave your device|carte non lasciano mai il tuo dispositivo/i
  ],
  ['a feedback page', /Feedback page unavailable|Pagina feedback non disponibile/i]
];

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' '
};

/** Text with its HTML entities decoded and its whitespace collapsed. */
const normalise = (text: string) =>
  text
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) =>
      String.fromCodePoint(parseInt(code, 16))
    )
    .replace(/&([a-z]+);/gi, (match, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? match)
    .replace(/\s+/g, ' ')
    .trim();

/** One language's half of the public policy, as plain text. */
const htmlHalf = (lang: 'en' | 'it') => {
  const html = fs.readFileSync(path.join(repoRoot, 'docs/privacy-policy.html'), 'utf8');
  const start = html.indexOf(`<div class="legal-copy lang-${lang}">`);
  expect(start).toBeGreaterThan(-1);
  const end = lang === 'en' ? html.indexOf('<div class="legal-copy lang-it">') : html.length;
  return normalise(html.slice(start, end).replace(/<[^>]+>/g, ' '));
};

/** Every bullet and paragraph of an in-app policy, after its title and last-updated lines. */
const blocksOf = (content: string) =>
  content
    .split('\n')
    .map((line) => line.replace(/^•/, '').replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .slice(2);

describe('privacy copy (Story 24.1)', () => {
  describe.each(SURFACES)('%s', (surface) => {
    it('has no myloyaltycards.app address', () => {
      expect(read(surface)).not.toMatch(/myloyaltycards\.app/i);
    });

    it.each(RETIRED_CLAIMS)('does not claim %s', (_claim, pattern) => {
      expect(read(surface)).not.toMatch(pattern);
    });
  });

  it('gives the cardiapp.eu privacy address in both in-app policies and the public one', () => {
    expect(PRIVACY_POLICY_CONTENT).toContain('Email: privacy@cardiapp.eu');
    expect(PRIVACY_POLICY_CONTENT_IT).toContain('Email: privacy@cardiapp.eu');
    expect(htmlHalf('en')).toContain('privacy@cardiapp.eu');
    expect(htmlHalf('it')).toContain('privacy@cardiapp.eu');
  });

  it.each([
    ['en', PRIVACY_POLICY_CONTENT],
    ['it', PRIVACY_POLICY_CONTENT_IT]
  ] as const)('mirrors every %s bullet and paragraph in the public policy', (lang, content) => {
    const half = htmlHalf(lang);
    const blocks = blocksOf(content);
    expect(blocks.length).toBeGreaterThan(40);
    expect(blocks.filter((block) => !half.includes(block))).toEqual([]);
  });

  it('names every processor in both in-app policies and both halves of the public one', () => {
    const html = read('docs/privacy-policy.html');
    [PRIVACY_POLICY_CONTENT, PRIVACY_POLICY_CONTENT_IT, html].forEach((text) => {
      ['Supabase', 'Sentry', 'Expo'].forEach((processor) => expect(text).toContain(processor));
    });
  });

  // Decision 2: the corrected copy prompts no signed-in user to consent again.
  it('keeps the policy at 1.0.0, so no one is asked to consent again', () => {
    expect(PRIVACY_POLICY_VERSION).toBe('1.0.0');
    expect(read('docs/privacy-policy.html')).toContain('Version 1.0.0');
  });

  it('dates the public policy as the in-app one', () => {
    const date = PRIVACY_POLICY_CONTENT.match(/Last updated: (\d{4}-\d{2}-\d{2})/)?.[1];
    expect(date).toBeDefined();
    const html = read('docs/privacy-policy.html');
    expect(html).toContain(`Last updated: ${date}`);
    expect(html).toContain(`Ultimo aggiornamento: ${date}`);
  });

  it('tells What We Collect readers that diagnostics leave the device and the install ID is used', () => {
    expect(en.privacy.dataSummary.description).toMatch(/guests included/);
    expect(itLocale.privacy.dataSummary.description).toMatch(/ospiti inclusi/);
    expect(en.privacy.dataSummary.rows.deviceId.detail).not.toBe('Not collected');
    expect(itLocale.privacy.dataSummary.rows.deviceId.detail).not.toBe('Non raccolti');
  });
});

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The landing page's app previews are real captures (Story 24.6).
 *
 * The hero and the Screenshots section used to show placeholder SVG frames labelled "ready for
 * real captures". They now show web-sized copies of the store captures, one per language, from
 * `docs/assets/screenshots/` (the only tree the site deploy publishes). This suite holds every
 * preview image to that: the file exists, it is a JPEG whose size matches the `width`/`height`
 * the page declares, each English image has an Italian twin, and no placeholder is left.
 */

const DOCS = join(__dirname, '..', 'docs');
const HTML = readFileSync(join(DOCS, 'index.html'), 'utf8');

type Preview = { lang: string; src: string; width: number; height: number };

/** Every `<img>` inside a `.device-preview` or `.screenshot-card` figure. */
const PREVIEWS: Preview[] = [
  ...HTML.matchAll(/<figure class="(?:device-preview[^"]*|screenshot-card)">([\s\S]*?)<\/figure>/g)
].flatMap(([, figure = '']) =>
  [...figure.matchAll(/<img([\s\S]*?)\/>/g)].map(([, attributes = '']) => ({
    lang: attributes.match(/class="lang-(\w+)"/)?.[1] ?? '',
    src: attributes.match(/src="([^"]+)"/)?.[1] ?? '',
    width: Number(attributes.match(/width="(\d+)"/)?.[1]),
    height: Number(attributes.match(/height="(\d+)"/)?.[1])
  }))
);

/** Width and height from a baseline or progressive JPEG's start-of-frame segment. */
const jpegSize = (jpeg: Buffer): { width: number; height: number } => {
  let offset = 2;
  while (offset < jpeg.length) {
    const marker = jpeg.readUInt16BE(offset);
    const length = jpeg.readUInt16BE(offset + 2);
    if (marker === 0xffc0 || marker === 0xffc2) {
      return { height: jpeg.readUInt16BE(offset + 5), width: jpeg.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  throw new Error('no start-of-frame segment');
};

describe('landing page previews (Story 24.6)', () => {
  it('has the hero pair and the three Screenshots cards, in both languages', () => {
    expect(PREVIEWS.filter(({ lang }) => lang === 'en')).toHaveLength(5);
    expect(PREVIEWS.filter(({ lang }) => lang === 'it')).toHaveLength(5);
  });

  it('pairs every English image with its Italian capture', () => {
    const en = PREVIEWS.filter(({ lang }) => lang === 'en').map(({ src }) => src);
    const it = PREVIEWS.filter(({ lang }) => lang === 'it').map(({ src }) => src);
    expect(it).toEqual(en.map((src) => src.replace(/\.jpg$/, '-it.jpg')));
  });

  it.each(PREVIEWS.map((preview) => [preview.src, preview]))(
    '%s exists and matches its declared size',
    (_, preview) => {
      const { src, width, height } = preview as Preview;
      expect(src).toMatch(/^assets\/screenshots\/[a-z-]+\.jpg$/);
      const file = join(DOCS, src);
      expect(existsSync(file)).toBe(true);
      expect(jpegSize(readFileSync(file))).toEqual({ width, height });
    }
  );

  it('says in Italian that the app holds the codice fiscale (decision 5)', () => {
    expect(HTML).toMatch(/<span class="lang-it"[^>]*>[^<]*codice fiscale/);
  });

  it('leaves no placeholder image or wording on the page', () => {
    expect(readdirSync(join(DOCS, 'assets/screenshots')).filter((f) => f.endsWith('.svg'))).toEqual(
      []
    );
    expect(HTML).not.toMatch(/placeholder|segnaposto/i);
  });
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The landing page's store badges, run rather than read (Story 24.6).
 *
 * `test/store-listing.test.ts` pins each badge's `href`. This suite runs the page's inline script
 * in jsdom and clicks the badges: one with a real listing URL must navigate like any link, and one
 * still at `href="#"` must stay on the page and say "coming soon".
 */

const HTML = readFileSync(join(__dirname, '..', 'docs/index.html'), 'utf8');
const SCRIPT = HTML.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? '';

const click = (store: string): MouseEvent => {
  const link = document.querySelector(`[data-store-link="${store}"]`);
  if (!link) throw new Error(`no ${store} badge`);
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });
  link.dispatchEvent(event);
  return event;
};

describe('landing page store badges, clicked (Story 24.6)', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    document.documentElement.innerHTML = HTML.replace(/<script>[\s\S]*?<\/script>/g, '');
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => undefined);
    // The page's own inline script, run as the browser would after parsing.
    new Function(SCRIPT)();
  });

  afterEach(() => alertSpy.mockRestore());

  it('finds the inline script it runs', () => {
    expect(SCRIPT).toContain('storeLinks.forEach');
  });

  it.each(['app-store', 'google-play'])(
    '%s: a live link navigates, a "#" link says coming soon',
    (store) => {
      const href = document.querySelector(`[data-store-link="${store}"]`)?.getAttribute('href');
      const event = click(store);
      if (href === '#') {
        expect(event.defaultPrevented).toBe(true);
        expect(alertSpy).toHaveBeenCalledTimes(1);
      } else {
        expect(event.defaultPrevented).toBe(false);
        expect(alertSpy).not.toHaveBeenCalled();
      }
    }
  );
});

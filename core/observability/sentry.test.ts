/**
 * Tests for Sentry PII scrubbing and initialisation (Story 16.2).
 *
 * `@sentry/react-native` is mocked globally in jest.setup.js.
 */
import * as Sentry from '@sentry/react-native';

import { initSentry, REDACTED, scrubBreadcrumb, scrubEvent, UUID_MASK } from './sentry';

const mockedInit = jest.mocked(Sentry.init);

declare const global: { __DEV__: boolean } & typeof globalThis;
const originalDev = global.__DEV__;

afterEach(() => {
  global.__DEV__ = originalDev;
});

describe('scrubEvent', () => {
  it('drops user identifiers and the request payload', () => {
    const event = {
      user: { id: 'user-123', email: 'a@b.com' },
      request: { url: 'https://x', data: { foo: 'bar' } }
    } as unknown as Parameters<typeof scrubEvent>[0];

    const result = scrubEvent(event);

    expect(result.user).toBeUndefined();
    expect(result.request).toBeUndefined();
    // The caller's event must NOT be mutated (scrubEvent shallow-clones).
    expect(event.user).toBeDefined();
    expect(event.request).toBeDefined();
  });

  it('redacts sensitive keys (card data, tokens, email) inside extra', () => {
    const event = {
      extra: {
        cardNumber: '1234 5678 9012 3456',
        rawBarcodeValue: 'AZ-99887766',
        accessToken: 'secret-token',
        userEmail: 'person@example.com',
        storeName: 'Acme Rewards'
      }
    } as unknown as Parameters<typeof scrubEvent>[0];

    const { extra } = scrubEvent(event);

    expect(extra?.cardNumber).toBe(REDACTED);
    expect(extra?.rawBarcodeValue).toBe(REDACTED);
    expect(extra?.accessToken).toBe(REDACTED);
    expect(extra?.userEmail).toBe(REDACTED);
    // Non-sensitive keys are preserved for debugging.
    expect(extra?.storeName).toBe('Acme Rewards');
  });

  it('redacts sensitive keys nested deep inside arrays and objects', () => {
    const event = {
      extra: {
        context: [{ card: { barcode: 'TOPSECRET', label: 'Tesco' } }]
      }
    } as unknown as Parameters<typeof scrubEvent>[0];

    const { extra } = scrubEvent(event);
    const context = (extra as Record<string, unknown>).context as Array<{
      card: Record<string, unknown>;
    }>;

    expect(context[0]?.card.barcode).toBe(REDACTED);
    expect(context[0]?.card.label).toBe('Tesco');
  });

  it('scrubs contexts as well as extra', () => {
    const event = {
      contexts: { payment: { cardNumber: '4111111111111111' } }
    } as unknown as Parameters<typeof scrubEvent>[0];

    const { contexts } = scrubEvent(event);

    expect((contexts?.payment as Record<string, unknown>).cardNumber).toBe(REDACTED);
  });

  it('collapses cyclic references to REDACTED without corrupting sibling keys', () => {
    const cyclic: Record<string, unknown> = { label: 'loop' };
    cyclic.self = cyclic;
    const event = { extra: { cyclic } } as unknown as Parameters<typeof scrubEvent>[0];

    let result!: ReturnType<typeof scrubEvent>;
    expect(() => {
      result = scrubEvent(event);
    }).not.toThrow();

    const scrubbed = (result.extra as { cyclic: Record<string, unknown> }).cyclic;
    expect(scrubbed.self).toBe(REDACTED); // back-reference broken
    expect(scrubbed.label).toBe('loop'); // non-cyclic sibling preserved
  });

  it('strips the install and device identifiers, keeping the device model and OS (Story 24.1)', () => {
    const event = {
      contexts: {
        app: { app_version: '1.0.0', device_app_hash: 'abc123' },
        device: { id: 'device-uuid', model: 'iPhone16,1', family: 'iPhone' },
        os: { name: 'iOS', version: '18.1' }
      },
      tags: { 'app.device': 'abc123', otaFailureKind: 'timeout' }
    } as unknown as Parameters<typeof scrubEvent>[0];

    const { contexts, tags } = scrubEvent(event);

    expect(contexts?.app).toEqual({ app_version: '1.0.0' });
    expect(contexts?.device).toEqual({ model: 'iPhone16,1', family: 'iPhone' });
    expect(contexts?.os).toEqual({ name: 'iOS', version: '18.1' });
    expect(tags).toEqual({ otaFailureKind: 'timeout' });
    // The caller's event is not mutated.
    expect((event.contexts?.app as Record<string, unknown>).device_app_hash).toBe('abc123');
    expect(event.tags?.['app.device']).toBe('abc123');
  });

  it('keeps only the allow-listed device and app fields and drops the culture context (decision 4)', () => {
    const event = {
      contexts: {
        device: {
          model: 'iPhone16,1',
          family: 'iPhone',
          manufacturer: 'Apple',
          brand: 'Apple',
          simulator: false,
          id: 'device-uuid',
          memory_size: 8000000000,
          free_memory: 1000,
          boot_time: '2026-11-01T08:00:00.000Z',
          timezone: 'Europe/Rome',
          screen_resolution: '1179x2556'
        },
        app: {
          app_version: '1.0.0',
          app_build: '42',
          app_name: 'Cardì',
          app_identifier: 'eu.cardiapp',
          device_app_hash: 'abc123',
          app_start_time: '2026-11-01T08:00:00.000Z',
          app_memory: 1234
        },
        culture: { locale: 'it_IT', timezone: 'Europe/Rome' },
        os: { name: 'Android', version: '15' }
      }
    } as unknown as Parameters<typeof scrubEvent>[0];

    const { contexts } = scrubEvent(event);

    expect(contexts?.device).toEqual({
      model: 'iPhone16,1',
      family: 'iPhone',
      manufacturer: 'Apple',
      brand: 'Apple',
      simulator: false
    });
    expect(contexts?.app).toEqual({
      app_version: '1.0.0',
      app_build: '42',
      app_name: 'Cardì',
      app_identifier: 'eu.cardiapp'
    });
    expect(contexts?.culture).toBeUndefined();
    expect(contexts?.os).toEqual({ name: 'Android', version: '15' });
    // The caller's event is not mutated.
    expect(event.contexts?.culture).toEqual({ locale: 'it_IT', timezone: 'Europe/Rome' });
  });

  // The matrix row "Signed-in sync fails": a Supabase fetch keyed by the account ID, then a
  // logger.error interpolating a card row id.
  it('sends a sync-failure event with no UUID and no query string (decision 4)', () => {
    const accountId = '5f0c1a2b-3c4d-4e5f-8a9b-0c1d2e3f4a5b';
    const cardId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
    const event = {
      message: `Sync failed for ${accountId}`,
      logentry: { message: `Sync failed for ${accountId}` },
      exception: {
        values: [
          { type: 'Error', value: `[cloud-sync] Cloud deletion failed for id=${cardId}: boom` }
        ]
      },
      breadcrumbs: [
        {
          type: 'http',
          category: 'fetch',
          data: {
            method: 'GET',
            status_code: 500,
            url: `https://proj.supabase.co/rest/v1/loyalty_cards?user_id=eq.${accountId}&select=*`
          }
        },
        {
          type: 'http',
          category: 'xhr',
          data: { url: `https://proj.supabase.co/rest/v1/loyalty_cards/${cardId}#frag` }
        },
        { category: 'console', message: `deleting ${cardId}` },
        { category: 'navigation', data: { from: '/', to: `/card/${cardId}` } },
        { category: 'sync', message: `pushed ${cardId}` }
      ],
      extra: { context: [`[cloud-sync] Cloud deletion failed for id=${cardId}`] }
    } as unknown as Parameters<typeof scrubEvent>[0];

    const scrubbed = scrubEvent(event);
    const sent = JSON.stringify(scrubbed);

    expect(sent).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    expect(sent).not.toContain('user_id=');
    expect(sent).not.toContain('#frag');
    expect(scrubbed.exception?.values?.[0]?.value).toBe(
      `[cloud-sync] Cloud deletion failed for id=${UUID_MASK}: boom`
    );
    expect(scrubbed.message).toBe(`Sync failed for ${UUID_MASK}`);
    expect(scrubbed.extra).toEqual({
      context: [`[cloud-sync] Cloud deletion failed for id=${UUID_MASK}`]
    });
    expect(scrubbed.logentry?.message).toBe(`Sync failed for ${UUID_MASK}`);
    expect(scrubbed.breadcrumbs?.map((crumb) => crumb.category)).toEqual([
      'fetch',
      'xhr',
      'navigation',
      'sync'
    ]);
    expect(scrubbed.breadcrumbs?.[0]?.data).toEqual({
      method: 'GET',
      status_code: 500,
      url: 'https://proj.supabase.co/rest/v1/loyalty_cards'
    });
    expect(scrubbed.breadcrumbs?.[1]?.data?.url).toBe(
      `https://proj.supabase.co/rest/v1/loyalty_cards/${UUID_MASK}`
    );
    // The caller's event is not mutated.
    expect(event.breadcrumbs).toHaveLength(5);
    expect(event.exception?.values?.[0]?.value).toContain(cardId);
  });

  it('leaves an event without extra/contexts untouched', () => {
    const event = {} as unknown as Parameters<typeof scrubEvent>[0];
    expect(scrubEvent(event)).toEqual({});
  });

  it('does NOT redact tags — documents a real gap, so callers never put PII there (Story 16.14, AD-16-14-02)', () => {
    // scrubEvent walks `extra` and `contexts` only. `tags` are passed straight
    // through, so the scrubber offers them NO protection. This is pinned rather
    // than fixed: extending redaction to tags would change a shared hook used by
    // every event. The contract instead lives on `NotifyOptions.tags` — tag
    // values must be caller-controlled literals (e.g. 'timeout' | 'error'),
    // never runtime data. If this test ever starts failing because tags DID get
    // redacted, that is an improvement — update the docs on NotifyOptions.tags.
    const event = {
      tags: { otaFailureKind: 'timeout', userEmail: 'person@example.com' }
    } as unknown as Parameters<typeof scrubEvent>[0];

    const { tags } = scrubEvent(event);

    expect(tags?.otaFailureKind).toBe('timeout');
    expect(tags?.userEmail).toBe('person@example.com'); // NOT redacted — by design of scrubEvent's scope
  });

  it('scrubs a captureMessage-shaped event, not just exceptions (Story 16.14, AC4)', () => {
    // `logger.notify` emits via `Sentry.captureMessage`. The SDK applies
    // `beforeSend` to every event whose `type` is undefined — message events
    // included — so the scrubber is the same single authority for both. This
    // pins that the notify payload shape (message + level + extra.context, with
    // Errors already flattened to plain objects by the SDK's normalize step)
    // survives scrubbing with its diagnostics intact and its PII gone.
    const event = {
      message: 'Expo update download/reload failed:',
      level: 'warning',
      user: { id: 'user-123' },
      extra: {
        context: [
          { name: 'Error', message: 'Expo update download timed out', stack: 'at initializeApp' },
          { cardNumber: '1234 5678 9012 3456', accessToken: 'tok', storeName: 'Acme Rewards' }
        ]
      }
    } as unknown as Parameters<typeof scrubEvent>[0];

    const scrubbed = scrubEvent(event);
    const context = (scrubbed.extra as { context: Array<Record<string, unknown>> }).context;

    // Identity of the user never leaves the device...
    expect(scrubbed.user).toBeUndefined();
    // ...nor does anything card-shaped or credential-shaped...
    expect(context[1]?.cardNumber).toBe(REDACTED);
    expect(context[1]?.accessToken).toBe(REDACTED);
    // ...while the diagnostics that make the signal actionable are preserved.
    expect(context[0]?.message).toBe('Expo update download timed out');
    expect(context[0]?.stack).toBe('at initializeApp');
    expect(context[1]?.storeName).toBe('Acme Rewards');
    expect(scrubbed.message).toBe('Expo update download/reload failed:');
    expect(scrubbed.level).toBe('warning');
  });
});

describe('scrubBreadcrumb', () => {
  it.each(['console', 'touch', 'ui', 'ui.click', 'ui.input'])(
    'drops a %s breadcrumb',
    (category) => {
      expect(scrubBreadcrumb({ category, message: 'tapped' })).toBeNull();
    }
  );

  it('keeps other categories, such as navigation, http and a category merely starting with "ui"', () => {
    expect(scrubBreadcrumb({ category: 'navigation', message: 'opened' })).toEqual({
      category: 'navigation',
      message: 'opened'
    });
    expect(scrubBreadcrumb({ category: 'uikit', message: 'x' })).not.toBeNull();
    expect(scrubBreadcrumb({ message: 'no category' })).toEqual({ message: 'no category' });
  });

  it('strips the query string and fragment from a URL and masks UUIDs, without mutating', () => {
    const id = '5F0C1A2B-3C4D-4E5F-8A9B-0C1D2E3F4A5B';
    const breadcrumb = {
      category: 'fetch',
      message: `GET ${id}`,
      data: { url: `https://x.co/a/${id}?user_id=eq.${id}#top`, status_code: 200 }
    };

    expect(scrubBreadcrumb(breadcrumb)).toEqual({
      category: 'fetch',
      message: `GET ${UUID_MASK}`,
      data: { url: `https://x.co/a/${UUID_MASK}`, status_code: 200 }
    });
    expect(breadcrumb.data.url).toContain('?user_id=');
  });

  it('masks UUIDs nested in non-string breadcrumb data', () => {
    const id = '5f0c1a2b-3c4d-4e5f-8a9b-0c1d2e3f4a5b';
    const breadcrumb = {
      category: 'navigation',
      data: { params: { cardId: id }, ids: [id, 7], count: 3, ok: true }
    };

    expect(scrubBreadcrumb(breadcrumb)?.data).toEqual({
      params: { cardId: UUID_MASK },
      ids: [UUID_MASK, 7],
      count: 3,
      ok: true
    });
    expect(breadcrumb.data.params.cardId).toBe(id);
  });
});

describe('initSentry', () => {
  const TEST_DSN = 'https://examplePublicKey@o0.ingest.sentry.io/0';
  const originalDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  // Each case inspects mock.calls[0]; clear so the two runs stay isolated. The
  // DSN is read from env at init time, so set it here and restore afterwards.
  beforeEach(() => {
    mockedInit.mockClear();
    process.env.EXPO_PUBLIC_SENTRY_DSN = TEST_DSN;
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = originalDsn;
  });

  it('initialises with transmission disabled and dev environment in development', () => {
    global.__DEV__ = true;
    initSentry();

    expect(mockedInit).toHaveBeenCalledTimes(1);
    const options = mockedInit.mock.calls[0]![0];
    expect(options.enabled).toBe(false);
    expect(options.environment).toBe('development');
    expect(options.sendDefaultPii).toBe(false);
    expect(options.beforeSend).toBe(scrubEvent);
    expect(options.dsn).toBe(TEST_DSN);
  });

  it('passes through an undefined DSN when the env var is unset (graceful no-op)', () => {
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    global.__DEV__ = false;
    initSentry();

    const options = mockedInit.mock.calls[0]![0];
    expect(options.dsn).toBeUndefined();
  });

  it('enables transmission with production environment in a release build', () => {
    global.__DEV__ = false;
    initSentry();

    const options = mockedInit.mock.calls[0]![0];
    expect(options.enabled).toBe(true);
    expect(options.environment).toBe('production');
    // PII guards must hold in the prod branch too — this is where it matters.
    expect(options.sendDefaultPii).toBe(false);
    expect(options.beforeSend).toBe(scrubEvent);
  });

  // Crash and error diagnostics only: no performance traces and no per-install session pings in a
  // release build (Story 24.1, decision 1).
  it('sends no performance traces and tracks no sessions in a release build', () => {
    global.__DEV__ = false;
    initSentry();

    const options = mockedInit.mock.calls[0]![0];
    expect(options.tracesSampleRate).toBe(0);
    expect(options.enableAutoSessionTracking).toBe(false);
  });

  it('cleans breadcrumbs as they are recorded, in every build', () => {
    global.__DEV__ = false;
    initSentry();
    expect(mockedInit.mock.calls[0]![0].beforeBreadcrumb).toBe(scrubBreadcrumb);
  });
});

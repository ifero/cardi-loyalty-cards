/**
 * Sentry initialisation and PII scrubbing (Story 16.2).
 *
 * Sentry is configured per environment and MUST never receive PII or loyalty
 * card data (GDPR). All transmitted events pass through {@link scrubEvent} via
 * the `beforeSend` hook, which drops user identifiers and redacts any
 * sensitive-looking keys (card numbers, barcodes, tokens, emails, …) anywhere
 * in the event payload before it leaves the device. Story 24.1 trims events
 * further to what the privacy policy discloses: allow-listed device and app
 * contexts, no install hash, masked UUIDs, and breadcrumbs cleaned by the
 * `beforeBreadcrumb` hook ({@link scrubBreadcrumb}).
 *
 * The actual error routing lives in `core/utils/logger.ts` (`logger.error`),
 * which calls `Sentry.captureException` only in production builds.
 */
import * as Sentry from '@sentry/react-native';
import type { Breadcrumb, ErrorEvent } from '@sentry/react-native';

/** Placeholder substituted for any redacted (sensitive) value. */
export const REDACTED = '[Redacted]';

/**
 * Keys whose values are considered sensitive and must be redacted before an
 * event is sent. Matched case-insensitively as a substring of the key, so e.g.
 * `cardNumber`, `card_number`, `rawBarcodeValue` and `accessToken` all match.
 *
 * Personal names are matched via their qualified forms (`firstName`,
 * `displayName`, `nickName`, …). A BARE `name` key is deliberately NOT matched:
 * in this loyalty-card domain `name` is overwhelmingly a store / card name
 * (e.g. "Tesco"), not PII, and redacting it would gut error diagnostics.
 */
const SENSITIVE_KEY_PATTERN =
  /barcode|card.?number|raw.?value|password|secret|token|email|api.?key|authorization|cookie|phone|first.?name|last.?name|full.?name|display.?name|user.?name|nick.?name/i;

/** Guard against pathological / cyclic payloads when walking the event tree. */
const MAX_REDACT_DEPTH = 10;

/**
 * Recursively redact sensitive values by key. Returns a new structure (objects
 * and arrays are cloned) so the original event object is never mutated in place
 * beyond the top-level reassignments in {@link scrubEvent}. Cycles and
 * excessive depth collapse to `REDACTED` rather than recursing forever.
 */
const redactValue = (value: unknown, depth: number, seen: WeakSet<object>): unknown => {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (depth >= MAX_REDACT_DEPTH || seen.has(value)) {
    return REDACTED;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, depth + 1, seen));
  }

  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    result[key] = SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : redactValue(nested, depth + 1, seen);
  }
  return result;
};

/** Placeholder substituted for every UUID found in an event's free text. */
export const UUID_MASK = '[uuid]';

/**
 * Any UUID: account IDs (`user_id=eq.<uuid>` in every Supabase sync URL) and
 * card row IDs (interpolated into `logger.error` text by cloud sync).
 */
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

const maskUuids = (text: string): string => text.replace(UUID_PATTERN, UUID_MASK);

/**
 * Mask UUIDs in every string of an already-redacted (so acyclic) structure:
 * `logger.error` puts its interpolated text in `extra.context` as well as in
 * the exception. Returns a new structure.
 */
const maskUuidsDeep = (value: unknown, depth = 0): unknown => {
  if (typeof value === 'string') {
    return maskUuids(value);
  }
  if (value === null || typeof value !== 'object' || depth >= MAX_REDACT_DEPTH) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => maskUuidsDeep(item, depth + 1));
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [key, maskUuidsDeep(nested, depth + 1)])
  );
};

/** A URL without its query string or fragment, and with any UUID in its path masked. */
const cleanUrl = (url: string): string => maskUuids(url.replace(/[?#][\s\S]*$/, ''));

/**
 * Breadcrumb categories that never leave the device (Story 24.1, decision 4):
 * console output and touch / UI interactions. A category matches itself and
 * its dotted children (`ui.click`, `ui.input`, …).
 */
const DROPPED_BREADCRUMB_CATEGORIES = ['console', 'touch', 'ui'] as const;

const isDroppedCategory = (category: string | undefined): boolean =>
  category !== undefined &&
  DROPPED_BREADCRUMB_CATEGORIES.some(
    (dropped) => category === dropped || category.startsWith(`${dropped}.`)
  );

/** Breadcrumb `data` keys that hold URLs (fetch / xhr breadcrumbs). */
const URL_DATA_KEYS = new Set(['url']);

/**
 * `beforeBreadcrumb` hook (Story 24.1, decision 4), also applied to the
 * breadcrumbs of every sent event. Drops console, touch and UI breadcrumbs;
 * strips the query string and fragment from URLs; masks every UUID in the
 * message and in string data. Returns a clone: the SDK's breadcrumb is never
 * mutated. The RN SDK syncs the JS scope's breadcrumbs to the native SDK, so
 * cleaning them when they are recorded also cleans what a native crash
 * carries. Exported for tests.
 */
export const scrubBreadcrumb = (breadcrumb: Breadcrumb): Breadcrumb | null => {
  if (isDroppedCategory(breadcrumb.category)) {
    return null;
  }

  const scrubbed: Breadcrumb = { ...breadcrumb };
  if (typeof scrubbed.message === 'string') {
    scrubbed.message = maskUuids(scrubbed.message);
  }
  if (scrubbed.data) {
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(scrubbed.data)) {
      if (typeof value !== 'string') {
        data[key] = maskUuidsDeep(value);
      } else {
        data[key] = URL_DATA_KEYS.has(key) ? cleanUrl(value) : maskUuids(value);
      }
    }
    scrubbed.data = data;
  }
  return scrubbed;
};

/** The device fields a report may keep: the model, and nothing per device. */
const DEVICE_CONTEXT_ALLOW_LIST = ['model', 'family', 'manufacturer', 'brand', 'simulator'];

/** The app fields a report may keep: which app, version and build. */
const APP_CONTEXT_ALLOW_LIST = ['app_version', 'app_build', 'app_name', 'app_identifier'];

const pick = (source: object, keys: readonly string[]): Record<string, unknown> => {
  const picked: Record<string, unknown> = {};
  for (const key of keys) {
    if (key in source) {
      picked[key] = (source as Record<string, unknown>)[key];
    }
  }
  return picked;
};

/**
 * Trim the contexts to what the privacy policy discloses (Story 24.1,
 * decisions 1 and 4): `device` and `app` keep only their allow-lists, which
 * drops the install hash (`app.device_app_hash`), the device id, memory, boot
 * time, screen and timezone; `culture` (locale, timezone) is dropped whole.
 * Every other context passes through. Returns a new object.
 */
const trimContexts = (contexts: NonNullable<ErrorEvent['contexts']>): ErrorEvent['contexts'] => {
  const trimmed: Record<string, unknown> = { ...contexts };
  delete trimmed.culture;
  if (contexts.device) {
    trimmed.device = pick(contexts.device, DEVICE_CONTEXT_ALLOW_LIST);
  }
  if (contexts.app) {
    trimmed.app = pick(contexts.app, APP_CONTEXT_ALLOW_LIST);
  }
  return trimmed as ErrorEvent['contexts'];
};

/** The tags without `app.device`, the install hash Sentry also surfaces as a tag. Returns a new object. */
const stripInstallTags = (tags: NonNullable<ErrorEvent['tags']>): ErrorEvent['tags'] => {
  const stripped = { ...tags };
  delete stripped['app.device'];
  return stripped;
};

/**
 * Mask every UUID in the event's free text (Story 24.1, decision 4): the
 * exception values, the message and its log entry, and the breadcrumbs (which
 * also lose their console / touch / UI entries and URL query strings).
 * Mutates only `scrubbed`, the clone {@link scrubEvent} owns.
 */
const scrubFreeText = (scrubbed: ErrorEvent): void => {
  if (scrubbed.exception?.values) {
    scrubbed.exception = {
      ...scrubbed.exception,
      values: scrubbed.exception.values.map((value) =>
        typeof value.value === 'string' ? { ...value, value: maskUuids(value.value) } : value
      )
    };
  }
  if (typeof scrubbed.message === 'string') {
    scrubbed.message = maskUuids(scrubbed.message);
  }
  if (scrubbed.logentry) {
    scrubbed.logentry = {
      ...scrubbed.logentry,
      ...(typeof scrubbed.logentry.message === 'string'
        ? { message: maskUuids(scrubbed.logentry.message) }
        : {})
    };
  }
  if (scrubbed.breadcrumbs) {
    scrubbed.breadcrumbs = scrubbed.breadcrumbs
      .map(scrubBreadcrumb)
      .filter((breadcrumb): breadcrumb is Breadcrumb => breadcrumb !== null);
  }
};

/**
 * `beforeSend` scrubber: strip user identifiers and request payloads, trim the
 * contexts and tags to what the privacy policy discloses, mask UUIDs in the
 * free text, then redact sensitive keys throughout `extra` and `contexts` (and
 * mask UUIDs in `extra`'s strings).
 * Native crashes never pass through here (the RN SDK strips `beforeSend`
 * before initialising the native SDK); the Sentry project's server-side
 * scrubbing rules cover them (docs/store/privacy-disclosures.md). Exported for
 * tests.
 */
export const scrubEvent = (event: ErrorEvent): ErrorEvent => {
  // Work on a shallow clone so the caller's event object is never mutated (and
  // we don't `delete` on a potentially frozen SDK-owned object).
  const scrubbed: ErrorEvent = { ...event };

  // Never attach who the user is.
  delete scrubbed.user;
  delete scrubbed.request;

  if (scrubbed.contexts) {
    scrubbed.contexts = trimContexts(scrubbed.contexts);
  }
  if (scrubbed.tags) {
    scrubbed.tags = stripInstallTags(scrubbed.tags);
  }
  scrubFreeText(scrubbed);

  if (scrubbed.extra) {
    scrubbed.extra = maskUuidsDeep(
      redactValue(scrubbed.extra, 0, new WeakSet())
    ) as ErrorEvent['extra'];
  }
  if (scrubbed.contexts) {
    scrubbed.contexts = redactValue(scrubbed.contexts, 0, new WeakSet()) as ErrorEvent['contexts'];
  }

  return scrubbed;
};

/**
 * Initialise the Sentry SDK. Transmission is disabled in development
 * (`enabled: !__DEV__`) so only production builds report; the environment tag
 * still distinguishes the two for any locally-forced sends.
 */
export const initSentry = (): void => {
  Sentry.init({
    // Public client DSN, supplied via env (EXPO_PUBLIC_SENTRY_DSN) so builds can
    // target different projects without code changes. When absent, Sentry.init
    // disables transmission (no-op) rather than crashing — graceful degradation.
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    enabled: !__DEV__,
    environment: __DEV__ ? 'development' : 'production',
    // Do not let integrations attach PII (IP address, device name, …).
    sendDefaultPii: false,
    // Crash and error diagnostics only in release: no performance traces, and no
    // session pings, which would count usage per install (Story 24.1, decision 1).
    tracesSampleRate: __DEV__ ? 1.0 : 0,
    enableAutoSessionTracking: false,
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb
  });
};

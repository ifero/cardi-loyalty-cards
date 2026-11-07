import fs from 'node:fs';
import path from 'node:path';

import plist from '@expo/plist';

import appJson from '../app.json';

/**
 * Store platform requirements for the 1.0 release (Story 24.2).
 *
 * - App Store: every bundle that calls a required-reason API needs its own privacy manifest, or
 *   an upload raises ITMS-91053. The phone app's manifest is declared in `app.json` and written
 *   by `withPrivacyInfo` at prebuild; the SDK 55 template ships no `PrivacyInfo.xcprivacy`, so the
 *   declared manifest is the whole file. Each watchOS bundle carries a
 *   `PrivacyInfo.xcprivacy` in its target folder, which apple-targets' synchronized group copies
 *   into the bundle.
 * - Google Play: phone apps target API 36; Wear OS apps are carved out at API 35.
 *
 * Lives in `test/` (not `targets/watch/__tests__/`) so `yarn test` always runs it, as
 * `test/app-display-name.test.ts` explains.
 */
const repoRoot = path.resolve(__dirname, '..');
const read = (...segments: string[]): string =>
  fs.readFileSync(path.join(repoRoot, ...segments), 'utf8');

type AccessedApiType = {
  NSPrivacyAccessedAPIType: string;
  NSPrivacyAccessedAPITypeReasons: string[];
};

type CollectedDataType = {
  NSPrivacyCollectedDataType: string;
  NSPrivacyCollectedDataTypeLinked: boolean;
  NSPrivacyCollectedDataTypeTracking: boolean;
  NSPrivacyCollectedDataTypePurposes: string[];
};

type PrivacyManifest = {
  NSPrivacyTracking: boolean;
  NSPrivacyTrackingDomains: string[];
  NSPrivacyAccessedAPITypes: AccessedApiType[];
  NSPrivacyCollectedDataTypes: CollectedDataType[];
};

/**
 * Apple's published reason codes per required-reason API category (as of 2026), from
 * https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api
 * When Apple publishes a new code, add it here.
 */
const APPLE_REASON_CODES: Record<string, readonly string[]> = {
  NSPrivacyAccessedAPICategoryFileTimestamp: ['DDA9.1', 'C617.1', '3B52.1', '0A2A.1'],
  NSPrivacyAccessedAPICategorySystemBootTime: ['35F9.1', '8FFB.1', '3D61.1'],
  NSPrivacyAccessedAPICategoryDiskSpace: ['85F4.1', 'E174.1', '7D9E.1', 'B728.1'],
  NSPrivacyAccessedAPICategoryActiveKeyboards: ['3EC4.1', '54BD.1'],
  NSPrivacyAccessedAPICategoryUserDefaults: ['CA92.1', '1C8F.1', 'C56D.1', 'AC6B.1']
};

const USER_DEFAULTS = 'NSPrivacyAccessedAPICategoryUserDefaults';
const APP_ONLY_DEFAULTS = 'CA92.1';
const APP_GROUP_DEFAULTS = '1C8F.1';

const reasonsFor = (manifest: PrivacyManifest, category: string): string[] =>
  manifest.NSPrivacyAccessedAPITypes.find((t) => t.NSPrivacyAccessedAPIType === category)
    ?.NSPrivacyAccessedAPITypeReasons ?? [];

const expectValidManifest = (manifest: PrivacyManifest): void => {
  expect(manifest.NSPrivacyTracking).toBe(false);
  expect(manifest.NSPrivacyTrackingDomains ?? []).toEqual([]);

  const categories = manifest.NSPrivacyAccessedAPITypes.map((t) => t.NSPrivacyAccessedAPIType);
  expect(new Set(categories).size).toBe(categories.length);

  for (const {
    NSPrivacyAccessedAPIType,
    NSPrivacyAccessedAPITypeReasons
  } of manifest.NSPrivacyAccessedAPITypes) {
    const allowed = APPLE_REASON_CODES[NSPrivacyAccessedAPIType];
    expect(allowed).toBeDefined();
    expect(NSPrivacyAccessedAPITypeReasons.length).toBeGreaterThan(0);
    for (const reason of NSPrivacyAccessedAPITypeReasons) {
      expect(allowed).toContain(reason);
    }
  }

  for (const collected of manifest.NSPrivacyCollectedDataTypes) {
    expect(collected.NSPrivacyCollectedDataTypeTracking).toBe(false);
  }
};

describe('phone privacy manifest (app.json ios.privacyManifests)', () => {
  const manifest = appJson.expo.ios.privacyManifests as PrivacyManifest;

  it('declares no tracking and only valid reason codes', () => {
    expectValidManifest(manifest);
  });

  const expectedReasons: [string, string[]][] = [
    // expo-updates, expo-eas-client, react-native-unistyles: app-only UserDefaults
    ['NSPrivacyAccessedAPICategoryUserDefaults', ['CA92.1']],
    // expo-sqlite (fstat in the app container), expo-document-picker (picked file's mtime)
    ['NSPrivacyAccessedAPICategoryFileTimestamp', ['C617.1', '3B52.1']],
    // react-native's own native code calls mach_absolute_time
    // (ReactCommon/react/nativemodule/cputime/CPUTime.h), and React-Core's manifest
    // (React/Resources/PrivacyInfo.xcprivacy) does not declare SystemBootTime; only boost's does.
    ['NSPrivacyAccessedAPICategorySystemBootTime', ['35F9.1']],
    // expo-sqlite (fstatvfs)
    ['NSPrivacyAccessedAPICategoryDiskSpace', ['E174.1']]
  ];

  it('declares exactly the expected categories', () => {
    expect(
      manifest.NSPrivacyAccessedAPITypes.map((t) => t.NSPrivacyAccessedAPIType).sort()
    ).toEqual(expectedReasons.map(([category]) => category).sort());
  });

  it.each(expectedReasons)('declares %s with exactly %j', (category, reasons) => {
    expect([...reasonsFor(manifest, category)].sort()).toEqual([...reasons].sort());
  });

  it('declares exactly the collected data types of the Story 24.1 App Privacy table', () => {
    const doc = read('docs', 'store', 'privacy-disclosures.md');
    const start = doc.indexOf('## App Store Connect: App Privacy');
    const end = doc.indexOf('\n## ', start + 1);
    const section = doc.slice(start, end === -1 ? undefined : end);
    const yes = (cell: string | undefined): boolean => cell === 'Yes';
    const disclosed = section
      .split('\n')
      .filter((line) => line.startsWith('|'))
      .map((line) =>
        line
          .split('|')
          .slice(1, -1)
          .map((cell) => cell.trim())
      )
      // header: Category | Data type | Collected | Linked | Tracking | Purposes | Policy
      .filter((cells) => cells[2] === 'Yes')
      .map((cells) => ({
        NSPrivacyCollectedDataType: `NSPrivacyCollectedDataType${(cells[1] ?? '').replace(/\s/g, '')}`,
        NSPrivacyCollectedDataTypeLinked: yes(cells[3]),
        NSPrivacyCollectedDataTypeTracking: yes(cells[4]),
        NSPrivacyCollectedDataTypePurposes: (cells[5] ?? '')
          .split(',')
          .map((purpose) => `NSPrivacyCollectedDataTypePurpose${purpose.replace(/\s/g, '')}`)
      }));

    expect(disclosed).toHaveLength(7);
    const byType = (a: CollectedDataType, b: CollectedDataType): number =>
      a.NSPrivacyCollectedDataType.localeCompare(b.NSPrivacyCollectedDataType);
    expect([...manifest.NSPrivacyCollectedDataTypes].sort(byType)).toEqual(disclosed.sort(byType));
  });
});

it('registers the plugin that keeps the phone manifest out of watchOS targets', () => {
  expect(appJson.expo.plugins).toContain('./plugins/with-watch-privacy-manifest');
});

describe.each(['watch', 'watch-widget'])('watchOS target %s', (target) => {
  const manifestPath = path.join('targets', target, 'PrivacyInfo.xcprivacy');
  const manifest = plist.parse(read(manifestPath)) as PrivacyManifest;

  const swiftSources = (
    fs.readdirSync(path.join(repoRoot, 'targets', target), {
      recursive: true
    }) as string[]
  )
    .filter((file) => file.endsWith('.swift'))
    .map((file) => read('targets', target, file));

  it('has a manifest with no tracking, no collected data and valid reason codes', () => {
    expectValidManifest(manifest);
    // The Apple Watch app talks only to the iPhone (Story 24.1).
    expect(manifest.NSPrivacyCollectedDataTypes).toEqual([]);
  });

  it('declares every UserDefaults reason its Swift sources need', () => {
    const usesAppGroupSuite = swiftSources.some((src) =>
      /UserDefaults(\.init)?\(\s*suiteName\s*:/.test(src)
    );
    const usesAppOnlyDefaults = swiftSources.some((src) =>
      /UserDefaults\.standard|\?\?\s*\.standard|@AppStorage\(/.test(src)
    );
    expect(usesAppGroupSuite || usesAppOnlyDefaults).toBe(true);

    const reasons = reasonsFor(manifest, USER_DEFAULTS);
    if (usesAppGroupSuite) expect(reasons).toContain(APP_GROUP_DEFAULTS);
    if (usesAppOnlyDefaults) expect(reasons).toContain(APP_ONLY_DEFAULTS);
  });
});

describe('Android SDK levels', () => {
  const buildProperties = (appJson.expo.plugins as unknown[]).find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-build-properties'
  ) as [string, { android?: Record<string, number> }] | undefined;

  it('pins the phone app to compile and target API 36 (Play, 2026)', () => {
    expect(buildProperties?.[1].android).toMatchObject({
      compileSdkVersion: 36,
      targetSdkVersion: 36
    });
  });

  it('keeps Wear OS at or above API 35 (Play Wear OS rule), compiled against at least that', () => {
    const gradle = read('watch-android', 'app', 'build.gradle.kts');
    const targetSdk = Number(/^\s*targetSdk = (\d+)/m.exec(gradle)?.[1]);
    const compileSdk = Number(/^\s*compileSdk = (\d+)/m.exec(gradle)?.[1]);
    expect(targetSdk).toBeGreaterThanOrEqual(35);
    expect(compileSdk).toBeGreaterThanOrEqual(targetSdk);
  });
});

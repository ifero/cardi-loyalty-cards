import fs from 'node:fs';
import path from 'node:path';

/**
 * No pipeline builds a test crash into a shipped app (Story 24.5).
 *
 * The phone's test-crash row exists only in a bundle built with EXPO_PUBLIC_SENTRY_TEST_CRASH=1,
 * and the Wear app's only in a Gradle build with -PsentryTestCrash=true. Both are for a hand-made
 * build. This test reads every file a release build takes its configuration from and fails if
 * either flag appears in one of them.
 */
const repoRoot = path.resolve(__dirname, '..');

const FLAGS = ['EXPO_PUBLIC_SENTRY_TEST_CRASH', 'sentryTestCrash'];

const workflowDir = path.join(repoRoot, '.github/workflows');
const WORKFLOWS = fs
  .readdirSync(workflowDir)
  .filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'))
  .map((name) => `.github/workflows/${name}`);

const BUILD_CONFIG_FILES = [
  ...WORKFLOWS,
  'fastlane/Fastfile',
  'eas.json',
  'app.json',
  'app.config.ts',
  'package.json',
  '.env.example',
  'watch-android/gradle.properties'
].filter((file) => fs.existsSync(path.join(repoRoot, file)));

describe('Sentry test-crash flags (Story 24.5)', () => {
  it('finds the release workflows, the Fastfile, package.json and .env.example to check', () => {
    expect(BUILD_CONFIG_FILES).toEqual(
      expect.arrayContaining([
        '.github/workflows/beta-releases.yml',
        '.github/workflows/store-upload.yml',
        '.github/workflows/nightly-builds.yml',
        '.github/workflows/android-release.yml',
        'fastlane/Fastfile',
        'package.json',
        '.env.example'
      ])
    );
  });

  it.each(BUILD_CONFIG_FILES)('%s sets neither test-crash flag', (file) => {
    const text = fs.readFileSync(path.join(repoRoot, file), 'utf8');
    FLAGS.forEach((flag) => expect(text).not.toContain(flag));
  });
});

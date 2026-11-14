import fs from 'node:fs';
import path from 'node:path';

/**
 * The Wear OS store-screenshot demo seed never reaches a release build (Story 24.6, decision 3).
 *
 * `-PwearDemoSeed=true` swaps the debug seeder's error-path fixtures for the demo card set, so
 * the store screenshots can be captured from a debug build. Three things keep it out of release,
 * and each is pinned here from source, because a JVM unit test only ever runs the debug variant:
 *
 * 1. the `release` build type forces `BuildConfig.WEAR_DEMO_SEED` to `false`;
 * 2. the seeder is reachable only from a `BuildConfig.DEBUG` branch in `MainActivity`, so R8
 *    strips it, with `DebugSampleCards`, from the release APK;
 * 3. no file a release build takes its configuration from sets the property.
 *
 * `DebugSampleCardsTest.kt` covers the other half: the flag swaps the set, and the demo set holds
 * no fixture names, no catalogue brand but Esselunga and IKEA, and no real barcode value.
 */
const repoRoot = path.resolve(__dirname, '..');
const read = (file: string): string => fs.readFileSync(path.join(repoRoot, file), 'utf8');

const GRADLE = read('watch-android/app/build.gradle.kts');
const MAIN_ACTIVITY = read(
  'watch-android/app/src/main/kotlin/com/iferoporefi/myloyaltycards/wear/MainActivity.kt'
);
const WEAR_SRC = path.join(repoRoot, 'watch-android/app/src/main/kotlin');

const kotlinFiles = (dir: string): string[] =>
  fs
    .readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.kt'))
    .map((entry) => path.join(entry.parentPath, entry.name));

describe('Wear OS demo seed (Story 24.6)', () => {
  it('reads -PwearDemoSeed into BuildConfig.WEAR_DEMO_SEED, off unless exactly true', () => {
    expect(GRADLE).toContain('providers.gradleProperty("wearDemoSeed").orNull?.trim() == "true"');
    expect(GRADLE).toContain(
      'buildConfigField("boolean", "WEAR_DEMO_SEED", wearDemoSeed.toString())'
    );
  });

  it('forces the flag off in the release build type', () => {
    const release = GRADLE.match(/\n {8}release \{([\s\S]*?)\n {8}\}/)?.[1] ?? '';
    expect(release).toContain('buildConfigField("boolean", "WEAR_DEMO_SEED", "false")');
  });

  it('reaches the seeder only from the BuildConfig.DEBUG branch', () => {
    const calls = kotlinFiles(WEAR_SRC).filter((file) =>
      fs.readFileSync(file, 'utf8').includes('seedSampleCardsIfEmpty(')
    );
    expect(calls.map((file) => path.basename(file)).sort()).toEqual([
      'MainActivity.kt',
      'WearGraph.kt'
    ]);
    expect(MAIN_ACTIVITY).toMatch(
      /if \(BuildConfig\.DEBUG\) \{\s*\{ WearGraph\.seedSampleCardsIfEmpty\(applicationContext, BuildConfig\.WEAR_DEMO_SEED\) \}\s*\} else \{\s*null\s*\}/
    );
  });

  it('is set by no release workflow, lane or committed Gradle property', () => {
    const workflowDir = path.join(repoRoot, '.github/workflows');
    const files = [
      ...fs.readdirSync(workflowDir).map((name) => `.github/workflows/${name}`),
      'fastlane/Fastfile',
      'package.json',
      'watch-android/gradle.properties'
    ].filter((file) => fs.existsSync(path.join(repoRoot, file)));
    expect(files).toContain('.github/workflows/android-release.yml');
    files.forEach((file) => expect(read(file)).not.toContain('wearDemoSeed'));
  });
});

/**
 * Keep the phone's privacy manifest out of the watchOS bundles (Story 24.2).
 *
 * React Native's `post_install` aggregates every pod's required-reason entries into the
 * phone's `Cardi/PrivacyInfo.xcprivacy` and then adds that file to the Copy Bundle Resources
 * phase of EVERY application target (`privacy_manifest_utils.rb`, `ensure_reference`). The
 * watchOS app is an application target, so it received the phone's manifest, which declares
 * the phone's collected data and lacks the App Group UserDefaults reason (1C8F.1) the watch
 * needs. The watch now ships its own `targets/watch/PrivacyInfo.xcprivacy` through
 * apple-targets' synchronized folder, and the two copies collide at build time:
 * "Multiple commands produce .../watch.app/PrivacyInfo.xcprivacy".
 *
 * This plugin appends a step to `post_install`, after `react_native_post_install`, that removes
 * any `PrivacyInfo.xcprivacy` build file from every watchOS target's resources phase. The
 * watch's own manifest is not a build file (synchronized folders copy it implicitly), so it is
 * untouched, and the phone keeps the aggregated manifest.
 *
 * Aggregation re-adds the reference on every `pod install`, which is why this runs in
 * `post_install` rather than once at prebuild.
 *
 * Targets are selected by `SDKROOT = watchos`, not by name, for the reason
 * `with-watch-accent-color.js` gives.
 */
const { withPodfile } = require('@expo/config-plugins');

const TAG = 'with-watch-privacy-manifest';
const BEGIN = `# @generated begin ${TAG}`;
const END = `# @generated end ${TAG}`;

const RUBY = `    ${BEGIN}
    installer.aggregate_targets.map(&:user_project).compact.uniq.each do |user_project|
      changed = false
      user_project.targets.each do |target|
        next unless target.respond_to?(:resources_build_phase)
        next unless target.build_configurations.any? { |c| c.build_settings['SDKROOT'] == 'watchos' }
        phase = target.resources_build_phase
        phase.files.select { |f| f.file_ref&.path&.end_with?('PrivacyInfo.xcprivacy') }.each do |build_file|
          phase.remove_build_file(build_file)
          changed = true
        end
      end
      user_project.save if changed
    end
    ${END}`;

/** The `react_native_post_install(...)` call, through its closing parenthesis line. */
const RN_POST_INSTALL = /^([ \t]*)react_native_post_install\([\s\S]*?\n\1\)[ \t]*$/m;

const GENERATED_BLOCK = new RegExp(`\\n[ \\t]*${BEGIN}[\\s\\S]*?${END}`);

const addWatchPrivacyStrip = (podfile) => {
  const clean = podfile.replace(GENERATED_BLOCK, '');
  const match = RN_POST_INSTALL.exec(clean);
  if (!match) {
    throw new Error(
      `${TAG}: could not find the react_native_post_install(...) call in the Podfile. ` +
        "Without this step the watch app gets the phone's PrivacyInfo.xcprivacy and the iOS " +
        'build fails with "Multiple commands produce .../watch.app/PrivacyInfo.xcprivacy".'
    );
  }
  const end = match.index + match[0].length;
  return `${clean.slice(0, end)}\n${RUBY}${clean.slice(end)}`;
};

const withWatchPrivacyManifest = (config) =>
  withPodfile(config, (props) => {
    props.modResults.contents = addWatchPrivacyStrip(props.modResults.contents);
    return props;
  });

module.exports = withWatchPrivacyManifest;
module.exports.addWatchPrivacyStrip = addWatchPrivacyStrip;

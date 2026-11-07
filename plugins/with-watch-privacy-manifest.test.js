/**
 * `with-watch-privacy-manifest`: the Podfile edit (Story 24.2).
 *
 * The Ruby itself only runs inside `pod install`, so the device check is what proves it
 * strips the reference. These tests pin where it lands and that it fails loudly: placed
 * before `react_native_post_install` it would run before aggregation adds the reference and
 * strip nothing, and the build would fail again with no hint why.
 *
 * `.test.js` for the reason `with-watch-accent-color.test.js` gives.
 */
const { addWatchPrivacyStrip } = require('./with-watch-privacy-manifest');

// The post_install block of the SDK 55 bare template, as `expo prebuild` writes it.
const TEMPLATE = `target 'Cardi' do
  use_expo_modules!

  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false,
      :ccache_enabled => ccache_enabled?(podfile_properties),
    )
  end
end
`;

describe('addWatchPrivacyStrip', () => {
  it('inserts the strip step after the react_native_post_install call, inside post_install', () => {
    const result = addWatchPrivacyStrip(TEMPLATE);
    const rnEnd = result.indexOf('    )\n');
    const strip = result.indexOf('# @generated begin with-watch-privacy-manifest');
    const postInstallEnd = result.indexOf('\n  end\nend');

    expect(rnEnd).toBeGreaterThan(-1);
    expect(strip).toBeGreaterThan(rnEnd);
    expect(postInstallEnd).toBeGreaterThan(strip);
    expect(result).toContain('next unless target.respond_to?(:resources_build_phase)');
    expect(result).toContain("c.build_settings['SDKROOT'] == 'watchos'");
    expect(result).toContain("end_with?('PrivacyInfo.xcprivacy')");
    expect(result).toContain('phase.remove_build_file(build_file)');
    expect(result).toContain('user_project.save if changed');
  });

  it('is idempotent across repeated prebuilds', () => {
    const once = addWatchPrivacyStrip(TEMPLATE);
    expect(addWatchPrivacyStrip(once)).toBe(once);
  });

  it('throws when the Podfile has no react_native_post_install call', () => {
    expect(() => addWatchPrivacyStrip("target 'Cardi' do\nend\n")).toThrow(
      /react_native_post_install/
    );
  });
});

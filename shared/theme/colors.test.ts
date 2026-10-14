import { CAMERA_OVERLAY, IDENTITY_COLORS, toRgbChannels } from './colors';

describe('toRgbChannels', () => {
  it('splits a #RRGGBB token into the r, g, b an rgba() takes', () => {
    expect(toRgbChannels('#181824')).toBe('24, 24, 36');
    expect(toRgbChannels('#FFFFFF')).toBe('255, 255, 255');
  });

  it('reads either case of hex digit', () => {
    expect(toRgbChannels('#0c843c')).toBe(toRgbChannels('#0C843C'));
  });

  // The sheet's scrim and the tile's highlight ring are built from these two.
  it('splits the identity ink and beam', () => {
    const channels = (hex: string) => hex.match(/[0-9a-f]{2}/gi)!.map((pair) => parseInt(pair, 16));
    expect(toRgbChannels(IDENTITY_COLORS.ink)).toBe(channels(IDENTITY_COLORS.ink).join(', '));
    expect(toRgbChannels(IDENTITY_COLORS.beam)).toBe(channels(IDENTITY_COLORS.beam).join(', '));
  });
});

// Story 22.5 — the camera surfaces look the same in both schemes, so their colours are one fixed
// table rather than theme roles. Text on the feed is cream, never pure white; the corners are a
// mark, and stay white.
describe('CAMERA_OVERLAY', () => {
  it('holds the capture frames’ fixed roles', () => {
    expect(CAMERA_OVERLAY).toEqual({
      ground: '#000000',
      scrim: 'rgba(0, 0, 0, 0.4)',
      plate: 'rgba(0, 0, 0, 0.8)',
      text: '#F0F0E8',
      mark: '#FFFFFF',
      divider: 'rgba(255, 255, 255, 0.25)',
      dismiss: 'rgba(255, 255, 255, 0.6)',
      textShadow: 'rgba(0, 0, 0, 0.75)'
    });
  });

  it('sets text in the identity cream, so the two cannot drift apart', () => {
    expect(CAMERA_OVERLAY.text).toBe(IDENTITY_COLORS.cream);
  });
});

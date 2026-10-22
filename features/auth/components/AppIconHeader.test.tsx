/**
 * AppIconHeader — the mark above the auth forms (Story 20.4; spacing Story 22.9).
 */
import { readFileSync } from 'fs';

import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import { IDENTITY_COLORS } from '@/shared/theme/tokens.generated';

import { AppIconHeader } from './AppIconHeader';

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

describe('AppIconHeader', () => {
  it('draws the mark inside its ink circle, 40 in 80', () => {
    render(<AppIconHeader />);
    const circle = screen.getByTestId('auth-app-icon-circle');
    const mark = screen.getByTestId('auth-app-icon');

    let node = mark.parent;
    let isInsideCircle = false;
    while (node) {
      if (node === circle) isInsideCircle = true;
      node = node.parent;
    }
    expect(isInsideCircle).toBe(true);

    expect(mark.props).toMatchObject({ width: 40, height: 40 });
    expect(flat('auth-app-icon-circle')).toMatchObject({
      width: 80,
      height: 80,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center'
    });
    expect(flat('auth-app-icon-circle').borderRadius).toBeGreaterThanOrEqual(40);
  });

  // The beam is legible only on ink, so the circle is ink in both schemes: a token, not a theme role.
  it('fills the circle with ink, whatever the scheme', () => {
    render(<AppIconHeader />);
    expect(flat('auth-app-icon-circle').backgroundColor).toBe(IDENTITY_COLORS.ink);
    // No scheme reaches it: no theme hook and no themed style sheet.
    expect(readFileSync(require.resolve('./AppIconHeader'), 'utf8')).not.toMatch(
      /useTheme\(|useUnistyles\(|StyleSheet\.create\(\(\s*theme/
    );
  });

  // The real mark, not the frames' hand-built ì and not a stock glyph.
  it('is the Cardì mark, cardi-mark-inline.svg', () => {
    expect(readFileSync(require.resolve('./AppIconHeader'), 'utf8')).toMatch(
      /import CardiMark from '@\/assets\/images\/cardi-mark-inline\.svg';/
    );
  });

  // The auth frames set the heading 32 below the mark (Story 22.9; it was 48): the spacing token,
  // not a literal that would drift from it (review pass 1).
  it('leaves 32 below it, for the heading, as SPACING.xl', () => {
    render(<AppIconHeader />);
    expect(flat('auth-app-icon-circle').marginBottom).toBe(32);
    expect(readFileSync(require.resolve('./AppIconHeader'), 'utf8')).toMatch(
      /marginBottom:\s*SPACING\.xl\b/
    );
  });
});

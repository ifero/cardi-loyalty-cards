import { act, fireEvent, render, screen } from '@testing-library/react-native';
import CloudUpload from 'lucide-react-native/icons/cloud-upload';
import Smartphone from 'lucide-react-native/icons/smartphone';

import { DARK_THEME, IDENTITY_COLORS, LIGHT_THEME } from '@/shared/theme/colors';

import { ModeOptionCard, getRecommendedPaddingTop } from './ModeOptionCard';

let mockTheme: typeof LIGHT_THEME | typeof DARK_THEME = LIGHT_THEME;
let mockIsDark = false;

jest.mock('@/shared/theme', () => ({
  useTheme: () => ({ theme: mockTheme, isDark: mockIsDark })
}));

// Lucide hides its glyph from assistive technology, so the query opts into hidden elements.
const icon = () => screen.getByTestId('card-icon', { includeHiddenElements: true });

const renderLocal = () =>
  render(
    <ModeOptionCard
      testID="card"
      icon={Smartphone}
      title="Keep cards on this device"
      subtitle="Fast and private"
      eyebrow="You can create an account later"
      recommended
      onPress={jest.fn()}
    />
  );

const renderCloud = () =>
  render(
    <ModeOptionCard
      testID="card"
      icon={CloudUpload}
      title="Sync across all devices"
      subtitle="Create account"
      eyebrow="Free forever"
      onPress={jest.fn()}
    />
  );

beforeEach(() => {
  mockTheme = LIGHT_THEME;
  mockIsDark = false;
});

describe('ModeOptionCard', () => {
  it('renders its icon, title, subtitle and eyebrow', () => {
    renderLocal();

    expect(screen.getByText('Keep cards on this device')).toBeTruthy();
    expect(screen.getByText('Fast and private')).toBeTruthy();
    expect(screen.getByText('You can create an account later')).toBeTruthy();
    expect(screen.UNSAFE_getByType(Smartphone)).toBeTruthy();
  });

  it('draws the icon at 24 / 1.5 in on-surface, in a 48 disc on the ground with a hairline', () => {
    renderLocal();

    expect(icon().props).toMatchObject({
      width: 24,
      strokeWidth: 1.5,
      stroke: LIGHT_THEME.textPrimary
    });
    expect(screen.getByTestId('card-icon-disc')).toHaveStyle({
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      backgroundColor: LIGHT_THEME.background,
      borderColor: LIGHT_THEME.border
    });
  });

  it('sets the copy 16 beside the disc, the subtitle 4 below the title and the eyebrow 8 below it', () => {
    renderLocal();

    // The row holding the disc and the copy: the disc's nearest drawn parent.
    let row = screen.getByTestId('card-icon-disc').parent;
    while (row && typeof row.type !== 'string') {
      row = row.parent;
    }
    expect(row).toHaveStyle({ flexDirection: 'row', gap: 16 });
    expect(screen.getByText('Fast and private')).toHaveStyle({ marginTop: 4 });
    expect(screen.getByTestId('card-eyebrow')).toHaveStyle({ marginTop: 8 });
  });

  it('sets the title in body-lg semibold, the subtitle in body-md muted and the eyebrow in label-bold', () => {
    renderLocal();

    expect(screen.getByText('Keep cards on this device')).toHaveStyle({
      fontSize: 17,
      fontWeight: '600',
      color: LIGHT_THEME.textPrimary
    });
    expect(screen.getByText('Fast and private')).toHaveStyle({
      fontSize: 15,
      fontWeight: '400',
      color: LIGHT_THEME.textSecondary
    });
    expect(screen.getByTestId('card-eyebrow')).toHaveStyle({ fontSize: 13, fontWeight: '600' });
  });

  it('draws the recommended card on surface with a 2px primary outline and the beam pill', () => {
    renderLocal();

    expect(screen.getByTestId('card')).toHaveStyle({
      backgroundColor: LIGHT_THEME.surface,
      borderColor: LIGHT_THEME.primary,
      borderWidth: 2,
      borderRadius: 16,
      padding: 20
    });
    // The pill: label-bold in ink on beam, padded 4 / 12, fully round.
    expect(screen.getByText('Recommended')).toHaveStyle({
      color: IDENTITY_COLORS.ink,
      fontSize: 13,
      fontWeight: '600'
    });
    expect(screen.getByTestId('card-recommended')).toHaveStyle({
      position: 'absolute',
      top: -11,
      right: 16,
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: IDENTITY_COLORS.beam
    });
    expect(screen.getByText('You can create an account later')).toHaveStyle({
      color: LIGHT_THEME.textPrimary
    });
  });

  it('draws the other card on surface with a 1px border, a muted eyebrow and no pill', () => {
    renderCloud();

    expect(screen.getByTestId('card')).toHaveStyle({
      backgroundColor: LIGHT_THEME.surface,
      borderColor: LIGHT_THEME.border,
      borderWidth: 1,
      borderRadius: 16,
      padding: 20
    });
    expect(screen.queryByText('Recommended')).toBeNull();
    expect(screen.getByText('Free forever')).toHaveStyle({ color: LIGHT_THEME.textSecondary });
  });

  it('keeps the pill off the title when large text grows it past the padding', () => {
    renderLocal();

    // The default pill — 18 of label and 4 above and below — leaves the padding at 20.
    act(() => {
      fireEvent(screen.getByTestId('card-recommended'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 120, height: 26 } }
      });
    });
    expect(screen.getByTestId('card')).toHaveStyle({ paddingTop: 20 });

    act(() => {
      fireEvent(screen.getByTestId('card-recommended'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 200, height: 40 } }
      });
    });
    expect(screen.getByTestId('card')).toHaveStyle({ paddingTop: 34 });
  });

  it.each([
    [0, 20],
    [26, 20],
    [32, 26],
    [40, 34]
  ])('pads a card under a %ipt pill by %ipt at the top', (pillHeight, paddingTop) => {
    expect(getRecommendedPaddingTop(pillHeight)).toBe(paddingTop);
  });

  it('takes the dark roles in dark, the pill staying beam on ink', () => {
    mockTheme = DARK_THEME;
    mockIsDark = true;
    renderLocal();

    expect(screen.getByTestId('card')).toHaveStyle({
      backgroundColor: DARK_THEME.surface,
      borderColor: DARK_THEME.primary
    });
    expect(icon().props.stroke).toBe(DARK_THEME.textPrimary);
    expect(screen.getByTestId('card-recommended')).toHaveStyle({
      backgroundColor: IDENTITY_COLORS.beam
    });
    expect(screen.getByText('Recommended')).toHaveStyle({ color: IDENTITY_COLORS.ink });
  });

  it('names itself with the recommendation for assistive technology', () => {
    renderLocal();

    expect(screen.getByRole('button')).toHaveProp(
      'accessibilityLabel',
      'Keep cards on this device. Fast and private. Recommended option.'
    );
  });

  it('fires onPress', () => {
    const onPress = jest.fn();
    render(
      <ModeOptionCard
        icon={CloudUpload}
        title="Sync across all devices"
        subtitle="Create account"
        onPress={onPress}
      />
    );

    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalled();
  });
});

/**
 * CardSetupScreen Tests
 * Story 13.4: Restyle Add Card Flow (AC5, AC6, T4, T5)
 * Story 22.6: The form pattern — the four form frames, on `FormScreen`
 *
 * Rendered through the real `StoryDecorator` stack — the real `ThemeProvider`, i18n and safe-area
 * insets — so the screen is checked against the roles the app paints, in both schemes.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';
import {
  AccessibilityInfo,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TextInput
} from 'react-native';

import { ColorPicker } from '@/shared/components/ui/ColorPicker';
import { FormScreen } from '@/shared/components/ui/FormScreen';
import { HeaderIconButton } from '@/shared/components/ui/HeaderIconButton';
import { PrimaryActionFooter } from '@/shared/components/ui/PrimaryActionFooter';
import { Tile } from '@/shared/components/ui/Tile';
import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { CardTileMark } from '@/features/cards/components/CardTile';
import {
  TILE_RADIUS,
  getGridTileHeight,
  getGridTileWidth
} from '@/features/cards/utils/gridLayout';

import { CardSetupScreen } from './CardSetupScreen';
import { InlineScanButton } from '../components/InlineScanButton';

// Override expo-router mock to add useLocalSearchParams
const mockUseLocalSearchParams = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: (...args: unknown[]) => mockUseLocalSearchParams(...args),
  useNavigation: () => ({
    addListener: jest.fn(() => jest.fn()),
    dispatch: jest.fn()
  }),
  useFocusEffect: jest.fn()
}));

// Mock catalogue repository
jest.mock('@/core/catalogue/catalogue-repository', () => ({
  CatalogueRepository: {
    getInstance: () => ({
      getBrandById: jest.fn((id: string) =>
        id === 'esselunga'
          ? {
              id: 'esselunga',
              name: 'Esselunga',
              color: '#FF0000',
              logo: 'esselunga',
              aliases: []
            }
          : undefined
      )
    })
  }
}));

// Mock useAddCard: its busy state and its error are the screen's to draw.
const mockAddCard = jest.fn().mockResolvedValue(undefined);
let mockIsSaving = false;
let mockSaveError: string | null = null;
jest.mock('@/features/cards/hooks/useAddCard', () => ({
  useAddCard: () => ({
    addCard: mockAddCard,
    isLoading: mockIsSaving,
    error: mockSaveError
  })
}));

// No brand logos: a brand draws its two-letter plate.
jest.mock('@/features/cards/utils/brandLogos', () => ({
  getBrandLogo: jest.fn(() => undefined)
}));

// The catalogue colour, mapped from the brand's hex.
jest.mock('@/core/utils', () => ({
  ...jest.requireActual('@/core/utils'),
  mapHexToCardColor: jest.fn(() => 'red')
}));

type Scheme = 'light' | 'dark';

/** What a test reads of a rendered node. */
type TestNode = { props: { testID?: string } };

const renderSetup = (scheme: Scheme = 'light') =>
  render(
    <StoryDecorator theme={scheme}>
      <CardSetupScreen />
    </StoryDecorator>
  );

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

/** The rendered fields, in order: the pattern's field container's own children. */
const fieldOrder = () =>
  screen
    .getByTestId('form-screen-fields')
    .children.map((child: TestNode | string) =>
      typeof child === 'string' ? child : child.props.testID
    );

describe('CardSetupScreen', () => {
  const announceSpy = jest
    .spyOn(AccessibilityInfo, 'announceForAccessibility')
    .mockImplementation(jest.fn());

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsSaving = false;
    mockSaveError = null;
  });

  // One treatment: setup draws the form pattern, with no header, footer or keyboard handling of its
  // own.
  it.each(['catalogue', 'custom'])('draws the form pattern in %s mode', (mode) => {
    mockUseLocalSearchParams.mockReturnValue({ mode, brandId: 'esselunga' });
    renderSetup();
    expect(screen.UNSAFE_getAllByType(FormScreen)).toHaveLength(1);
    // The pattern's header, footer and keyboard handling are the only ones on the screen.
    expect(screen.UNSAFE_getAllByType(HeaderIconButton)).toHaveLength(1);
    expect(screen.UNSAFE_getAllByType(PrimaryActionFooter)).toHaveLength(1);
    expect(screen.UNSAFE_getAllByType(KeyboardAvoidingView)).toHaveLength(1);
    expect(screen.UNSAFE_getAllByType(ScrollView)).toHaveLength(1);
  });

  describe('catalogue mode', () => {
    beforeEach(() => {
      mockUseLocalSearchParams.mockReturnValue({
        mode: 'catalogue',
        brandId: 'esselunga',
        brandName: 'Esselunga',
        brandColor: '#FF0000',
        brandLogo: 'esselunga',
        barcode: '1234567890',
        barcodeFormat: 'EAN13'
      });
    });

    it('renders "Card Setup" header title', () => {
      renderSetup();
      const title = screen.getByText('Card Setup');
      expect(title.props.accessibilityRole).toBe('header');
    });

    it('announces catalogue setup screen for accessibility on mount', () => {
      renderSetup();
      expect(announceSpy).toHaveBeenCalledWith('Card setup screen');
    });

    it('renders card number field with pre-filled barcode', () => {
      renderSetup();
      expect(screen.getByTestId('card-number-field').props.value).toBe('1234567890');
    });

    it('does NOT show store name field in catalogue mode', () => {
      renderSetup();
      expect(screen.queryByTestId('store-name-field')).toBeNull();
    });

    it('does NOT show color picker in catalogue mode', () => {
      renderSetup();
      expect(screen.queryByTestId('color-picker')).toBeNull();
    });

    it('does NOT show inline scan button in catalogue mode', () => {
      renderSetup();
      expect(screen.queryByTestId('inline-scan-button')).toBeNull();
    });

    it('renders Done button', () => {
      renderSetup();
      expect(screen.getByTestId('done-button')).toBeTruthy();
      expect(screen.getByText('Done')).toBeTruthy();
    });

    it('renders back button', () => {
      renderSetup();
      expect(screen.getByTestId('setup-back-button').props.accessibilityLabel).toBe('Go back');
    });

    /**
     * Story 22.6 (Decided) — the brand's own wallet tile, at the wallet's size, centred, with its
     * name beneath: the card exactly as it will look in the wallet. CARD NUMBER sits 32 below it.
     */
    describe('the brand’s tile', () => {
      it('is the wallet’s tile: the brand’s hex at the grid’s size and radius, its name beneath', () => {
        renderSetup();
        // The wallet's grid on this device: the window the screen measures.
        const tileWidth = getGridTileWidth(Dimensions.get('window').width);

        expect(flat('setup-brand-tile-shell')).toMatchObject({
          width: tileWidth,
          height: getGridTileHeight(tileWidth),
          borderRadius: TILE_RADIUS,
          backgroundColor: '#FF0000'
        });
        expect(screen.getByText('Esselunga')).toBeTruthy();
      });

      it('is centred, the first field, 32 above CARD NUMBER', () => {
        renderSetup();
        // Centred by the field that holds it.
        let holder = screen.getByTestId('setup-brand-tile').parent;
        while (holder && StyleSheet.flatten(holder.props.style)?.alignItems !== 'center') {
          holder = holder.parent;
        }
        expect(holder).toBeTruthy();

        // Two fields, 32 apart: the tile, then CARD NUMBER.
        expect(flat('form-screen-fields').gap).toBe(32);
        expect(fieldOrder()).toHaveLength(2);
        const tree = JSON.stringify(screen.toJSON());
        expect(tree.indexOf('"setup-brand-tile"')).toBeLessThan(
          tree.indexOf('"card-number-field"')
        );
      });

      // It shares the wallet's mark rather than copying it: the plate for a brand with no logo.
      it('draws the brand’s mark with the wallet’s CardTileMark', () => {
        renderSetup();
        const tileWidth = getGridTileWidth(Dimensions.get('window').width);
        expect(screen.UNSAFE_getByType(CardTileMark).props).toMatchObject({
          brand: expect.objectContaining({ id: 'esselunga', color: '#FF0000' }),
          name: 'Esselunga',
          // The tile's own foreground for #FF0000 (`getTileAppearance`), at the tile's size.
          color: '#181824',
          tileWidth,
          tileHeight: getGridTileHeight(tileWidth)
        });
        expect(screen.getByText('ES')).toBeTruthy();
      });

      // Not a control: no press, no button role and no hint, read once by the brand's name.
      it('is not a control, and is read once by the brand’s name', () => {
        renderSetup();
        const tile = screen.getByTestId('setup-brand-tile');
        expect(screen.UNSAFE_getByType(Tile).props.onPress).toBeUndefined();
        expect(tile.props.accessibilityRole).toBeUndefined();
        expect(tile.props.accessibilityHint).toBeUndefined();
        expect(tile.props.accessible).toBe(true);
        expect(tile.props.accessibilityLabel).toBe('Esselunga');
      });

      it('draws a brand known only by its params', () => {
        mockUseLocalSearchParams.mockReturnValue({
          mode: 'catalogue',
          brandId: 'not-in-the-catalogue',
          brandName: 'Bottega',
          brandColor: '#0C843C',
          brandLogo: ''
        });
        renderSetup();
        expect(flat('setup-brand-tile-shell').backgroundColor).toBe('#0C843C');
        expect(screen.getByText('Bottega')).toBeTruthy();
      });

      it('is not drawn for a brand that cannot be resolved', () => {
        mockUseLocalSearchParams.mockReturnValue({ mode: 'catalogue', barcode: '1234567890' });
        renderSetup();
        expect(screen.queryByTestId('setup-brand-tile')).toBeNull();
        expect(fieldOrder()).toEqual(['card-number-field']);
      });
    });

    it('calls addCard with catalogue data on Done', async () => {
      renderSetup();
      fireEvent.press(screen.getByTestId('done-button'));

      await waitFor(() => {
        expect(mockAddCard).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Esselunga',
            brandId: 'esselunga',
            barcodeFormat: 'EAN13',
            color: 'red'
          })
        );
      });
    });

    /**
     * Story 21.2a — the brand-less catalogue branch, which this story deliberately
     * changed and which had no test either before or after.
     *
     * It used to map a hard-coded `'#1A73E8'` placeholder (a copy of the retired
     * CARD_COLORS.blue) and therefore always yielded `'blue'`; it now names
     * DEFAULT_CARD_COLOR. The path is abnormal — catalogue mode with no resolvable
     * brand also produces a card with an empty name — but it is reachable, and a
     * behaviour change with no test is a behaviour change nobody will notice
     * reverting.
     */
    it('falls back to the default accent when catalogue mode has no resolvable brand', async () => {
      mockUseLocalSearchParams.mockReturnValue({
        mode: 'catalogue',
        barcode: '1234567890',
        barcodeFormat: 'EAN13'
      });

      renderSetup();
      fireEvent.press(screen.getByTestId('done-button'));

      await waitFor(() => {
        expect(mockAddCard).toHaveBeenCalledWith(
          expect.objectContaining({ color: 'grey', brandId: undefined })
        );
      });
    });
  });

  describe('custom mode', () => {
    beforeEach(() => {
      mockUseLocalSearchParams.mockReturnValue({
        mode: 'custom'
      });
    });

    it('renders "New Card" header title', () => {
      renderSetup();
      expect(screen.getByText('New Card').props.accessibilityRole).toBe('header');
    });

    it('announces custom setup screen for accessibility on mount', () => {
      renderSetup();
      expect(announceSpy).toHaveBeenCalledWith('New card screen');
    });

    // Frame 1: STORE NAME, CARD NUMBER with the scan button, CARD COLOR — then the empty gap. No
    // card preview and no helper text in it.
    it('draws frame 1’s three fields in its order, and nothing else in the body', () => {
      renderSetup();
      expect(fieldOrder()).toHaveLength(3);
      const tree = JSON.stringify(screen.toJSON());
      expect(tree.indexOf('"store-name-field"')).toBeGreaterThan(-1);
      expect(tree.indexOf('"store-name-field"')).toBeLessThan(tree.indexOf('"card-number-field"'));
      // CARD COLOR's FormField holds the picker.
      expect(tree.indexOf('"card-number-field"')).toBeLessThan(tree.indexOf('"color-picker"'));
      expect(screen.getByText('Store name')).toBeTruthy();
      expect(screen.getByText('Card number')).toBeTruthy();
      expect(screen.getByText('Card Color')).toBeTruthy();
      expect(screen.getByTestId('store-name-field').props.placeholder).toBe('Enter store name');
      expect(screen.getByTestId('card-number-field').props.placeholder).toBe(
        'Enter or scan card number'
      );
    });

    // A screen reader names each field by its label, not only by its placeholder or value.
    it('names each field', () => {
      renderSetup();
      expect(screen.getByLabelText('Store name').props.testID).toBe('store-name-field');
      expect(screen.getByLabelText('Card number').props.testID).toBe('card-number-field');
    });

    it('selects deep blue by default', () => {
      renderSetup();
      expect(screen.UNSAFE_getByType(ColorPicker).props.value).toBe('blue');
      expect(screen.getByLabelText('Deep blue color, selected')).toBeTruthy();
    });

    // Story 22.1 (AC7): the form label idiom, on the one field that is not a text input.
    it('labels the colour picker in the shared uppercase form-label idiom', () => {
      renderSetup();
      expect(StyleSheet.flatten(screen.getByText('Card Color').props.style).textTransform).toBe(
        'uppercase'
      );
    });

    // Story 21.6's hand-off: a card number's value is set in the mono face, in both flows. The
    // placeholder keeps the body face, as the form frames draw it (Story 22.6).
    it('sets the card number’s value in the mono-code face, and its placeholder in Inter', () => {
      renderSetup();
      expect(flat('card-number-field').fontFamily).toBe('Inter');

      fireEvent.changeText(screen.getByTestId('card-number-field'), '2000012345678');
      expect(flat('card-number-field').fontFamily).toBe('JetBrains Mono');
    });

    it('caps the store name at the schema’s 50, with no counter', () => {
      renderSetup();
      expect(screen.getByTestId('store-name-field').props.maxLength).toBe(50);
      expect(screen.queryByText('0/50')).toBeNull();
    });

    // The scan button sits in the card number's trailing slot: beside the input, outside its box.
    it('puts the scan button beside the card number input', () => {
      renderSetup();
      expect(screen.UNSAFE_getByType(InlineScanButton)).toBeTruthy();
      let row = screen.getByTestId('inline-scan-button').parent;
      while (row && StyleSheet.flatten(row.props.style)?.flexDirection !== 'row') {
        row = row.parent;
      }
      expect(
        row?.findAll((node: TestNode) => node.props.testID === 'card-number-field').length
      ).toBeGreaterThan(0);
    });

    it('navigates to scanner when inline scan button is pressed', () => {
      renderSetup();
      fireEvent.press(screen.getByTestId('inline-scan-button'));
      expect(router.push).toHaveBeenCalledWith({
        pathname: '/add-card/scan',
        params: expect.objectContaining({ returnToSetup: 'true' })
      });
    });

    it('navigates back when back button is pressed', () => {
      renderSetup();
      fireEvent.press(screen.getByTestId('setup-back-button'));
      expect(router.back).toHaveBeenCalled();
    });

    describe('validation', () => {
      it('shows validation error when store name is empty on Done', async () => {
        renderSetup();
        fireEvent.press(screen.getByTestId('done-button'));

        await waitFor(() => {
          expect(screen.getByText('Store name is required')).toBeTruthy();
        });
        expect(mockAddCard).not.toHaveBeenCalled();
      });

      // The error sits on the field alone: its outline and its message in the error colour, the
      // label still ink, the button still enabled, and nothing else red.
      it('puts the error on the store name field alone', () => {
        renderSetup();
        fireEvent.press(screen.getByTestId('done-button'));

        expect(flat('store-name-field').borderColor).toBe(LIGHT_THEME.error);
        expect(flat('store-name-field-error').color).toBe(LIGHT_THEME.error);
        expect(StyleSheet.flatten(screen.getByText('Store name').props.style).color).toBe(
          LIGHT_THEME.textPrimary
        );
        expect(flat('card-number-field').borderColor).toBe(LIGHT_THEME.border);
        expect(screen.queryByTestId('form-screen-banner')).toBeNull();
        expect(screen.getByTestId('done-button').props.accessibilityState.disabled).toBe(false);
      });

      it('focuses the store name when Done finds it empty', () => {
        const focus = jest.spyOn(TextInput.prototype, 'focus');
        try {
          renderSetup();
          fireEvent.press(screen.getByTestId('done-button'));
          const focused = focus.mock.contexts.map(
            (input) => (input as { props: { testID?: string } }).props.testID
          );
          expect(focused).toContain('store-name-field');
        } finally {
          focus.mockRestore();
        }
      });

      // Nothing errs before the first press: typing and clearing reveals nothing.
      it('does not validate while typing before the first Done', () => {
        renderSetup();
        fireEvent.changeText(screen.getByTestId('store-name-field'), 'A');
        fireEvent.changeText(screen.getByTestId('store-name-field'), '');
        expect(screen.queryByTestId('store-name-field-error')).toBeNull();
      });

      // After the first press the field re-validates as the user types, clearing or erring.
      it('re-validates as the user types after the first Done', () => {
        renderSetup();
        fireEvent.press(screen.getByTestId('done-button'));
        expect(screen.getByTestId('store-name-field-error')).toBeTruthy();

        fireEvent.changeText(screen.getByTestId('store-name-field'), 'M');
        expect(screen.queryByTestId('store-name-field-error')).toBeNull();

        fireEvent.changeText(screen.getByTestId('store-name-field'), '   ');
        expect(screen.getByText('Store name is required')).toBeTruthy();
      });
    });

    it('calls addCard with custom data when valid', async () => {
      renderSetup();

      const storeInput = screen.getByTestId('store-name-field');
      fireEvent.changeText(storeInput, 'My Gym');

      fireEvent.press(screen.getByTestId('done-button'));

      // Story 13.4: the card number is optional, so an empty one saves.
      await waitFor(() => {
        expect(mockAddCard).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'My Gym',
            color: 'blue',
            barcodeFormat: 'CODE128',
            barcode: ''
          })
        );
      });
    });

    it('saves the colour picked', async () => {
      renderSetup();
      fireEvent.changeText(screen.getByTestId('store-name-field'), 'Farmacia Centrale');
      fireEvent.press(screen.getByTestId('color-picker-green'));
      fireEvent.press(screen.getByTestId('done-button'));

      await waitFor(() => {
        expect(mockAddCard).toHaveBeenCalledWith(expect.objectContaining({ color: 'green' }));
      });
    });
  });

  describe('saving and a failed save', () => {
    beforeEach(() => {
      mockUseLocalSearchParams.mockReturnValue({ mode: 'custom' });
    });

    // Busy is not disabled: the fill stays, a spinner, "Saving...", and another press does nothing.
    it.each<[Scheme, string]>([
      ['light', LIGHT_THEME.primary],
      ['dark', DARK_THEME.primary]
    ])('keeps Done’s %s fill while saving, named "Saving...", refusing presses', (scheme, fill) => {
      mockIsSaving = true;
      renderSetup(scheme);

      const done = screen.getByTestId('done-button');
      expect(screen.getByTestId('done-button-spinner')).toBeTruthy();
      expect(done.props.accessibilityLabel).toBe('Saving...');
      expect(done.props.accessibilityState).toMatchObject({ busy: true, disabled: false });
      expect(flat('done-button-container').backgroundColor).toBe(fill);
      // The fields stay live: busy is the button's state, never a disabled form.
      expect(screen.getByTestId('store-name-field').props.editable).toBe(true);
      expect(screen.getByTestId('card-number-field').props.editable).toBe(true);

      fireEvent.changeText(screen.getByTestId('store-name-field'), 'My Gym');
      fireEvent.press(done);
      expect(mockAddCard).not.toHaveBeenCalled();
    });

    // The hook's message, in the banner above the first field; no field red, Done still enabled.
    it('shows a failed save in the banner, reddening no field', () => {
      mockSaveError = 'Failed to add card';
      renderSetup();

      expect(screen.getByTestId('form-screen-banner')).toBeTruthy();
      expect(screen.getByText('Failed to add card')).toBeTruthy();
      expect(flat('store-name-field').borderColor).toBe(LIGHT_THEME.border);
      expect(flat('card-number-field').borderColor).toBe(LIGHT_THEME.border);
      expect(screen.getByTestId('done-button').props.accessibilityState.disabled).toBe(false);
    });

    it('draws no banner while nothing has failed', () => {
      renderSetup();
      expect(screen.queryByTestId('form-screen-banner')).toBeNull();
    });

    it('keeps Done pressable after a failed save, so it can be retried', async () => {
      mockSaveError = 'Failed to add card';
      renderSetup();
      fireEvent.changeText(screen.getByTestId('store-name-field'), 'My Gym');
      await act(async () => {
        fireEvent.press(screen.getByTestId('done-button'));
      });
      expect(mockAddCard).toHaveBeenCalledTimes(1);
    });
  });
});

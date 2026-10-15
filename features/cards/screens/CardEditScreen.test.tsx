/**
 * Edit Card Screen Tests
 * Story 2.7 (screen); relocated + covered under Story 16.9.
 * Story 22.6: the form pattern — the screen's own header, whose back runs the discard check
 *
 * Added when the screen moved from app/card/[id]/edit.tsx into
 * features/cards/screens/ (Story 16.9). app/ is excluded from coverage, so the
 * move surfaced a previously-unmeasured screen.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { Alert, BackHandler, StyleSheet } from 'react-native';

import { getCardById } from '@/core/database';

import { FormScreen } from '@/shared/components/ui/FormScreen';

import CardEditScreen from './CardEditScreen';

type CardFormMockProps = {
  title: string;
  onBack: () => void;
  backTestID?: string;
  defaultValues: { name: string; barcode: string; barcodeFormat: string; color: string };
  onSubmit: (data: unknown) => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
  submitLabel: string;
  isLoading: boolean;
  requestError?: string | null;
  focusNameOnMount?: boolean;
  testID?: string;
};

const mockBack = jest.fn();
const mockEditCard = jest.fn().mockResolvedValue(undefined);
const mockCardForm = jest.fn((props: CardFormMockProps) => {
  void props;
  return null;
});
const mockStackScreen = jest.fn((props: unknown) => {
  void props;
  return null;
});
let mockSaveError: string | null = null;
let mockIsUpdating = false;

jest.mock('expo-router', () => {
  const Stack = () => null;
  (Stack as { Screen?: (props: unknown) => null }).Screen = (props: unknown) =>
    mockStackScreen(props);
  return {
    Stack,
    useLocalSearchParams: jest.fn(),
    useRouter: () => ({ back: mockBack })
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

jest.mock('@/core/database', () => ({
  getCardById: jest.fn()
}));

jest.mock('@/core/utils/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() }
}));

jest.mock('@/shared/theme', () => ({
  useTheme: () => ({
    theme: { background: '#FFFFFF', primary: '#1A73E8', textPrimary: '#000', textSecondary: '#666' }
  })
}));

jest.mock('@/features/cards/components/CardForm', () => ({
  CardForm: (props: CardFormMockProps) => mockCardForm(props)
}));

jest.mock('@/features/cards/hooks/useEditCard', () => ({
  useEditCard: () => ({
    editCard: mockEditCard,
    isLoading: mockIsUpdating,
    error: mockSaveError
  })
}));

type BackHandlerFn = () => boolean | null | undefined;

const mockCard = {
  id: 'card-1',
  name: 'Test Card',
  barcode: '123456789',
  barcodeFormat: 'EAN13',
  color: '#FF0000'
};

const formProps = () => mockCardForm.mock.calls[mockCardForm.mock.calls.length - 1]![0];

/** The discard prompt's buttons: "Keep Editing" (cancel) first, "Discard" second. */
const alertButtons = () =>
  (Alert.alert as jest.Mock).mock.calls[0]![2] as Array<{ text: string; onPress?: () => void }>;

describe('CardEditScreen', () => {
  let capturedBackHandler: BackHandlerFn | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedBackHandler = undefined;
    mockSaveError = null;
    mockIsUpdating = false;
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'card-1' });
    (getCardById as jest.Mock).mockResolvedValue(mockCard);
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
      capturedBackHandler = handler;
      return { remove: jest.fn() } as ReturnType<typeof BackHandler.addEventListener>;
    });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads the card and renders the form with its values', async () => {
    render(<CardEditScreen />);

    // Every saved value, so an untouched Save writes the card back as it was.
    await waitFor(() => {
      expect(mockCardForm).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultValues: {
            name: 'Test Card',
            barcode: '123456789',
            barcodeFormat: 'EAN13',
            color: '#FF0000'
          }
        })
      );
    });
    expect(getCardById).toHaveBeenCalledWith('card-1');
  });

  // The form draws the pattern's header: titled "Edit Card", with the screen's own back, on the
  // scrolling body the screen has always named.
  it('hands the form its header, its body testID and Save', async () => {
    render(<CardEditScreen />);
    await waitFor(() => expect(mockCardForm).toHaveBeenCalled());

    expect(formProps()).toMatchObject({
      title: 'cards.edit.title',
      backTestID: 'edit-back-button',
      submitLabel: 'cards.edit.save',
      focusNameOnMount: false,
      testID: 'edit-card-form'
    });
  });

  // The native header is hidden (`app/_layout.tsx`), and the screen sets no route options of its own.
  it('sets no Stack.Screen options in any state', async () => {
    // Loading…
    (getCardById as jest.Mock).mockReturnValueOnce(new Promise(() => {}));
    const loading = render(<CardEditScreen />);
    loading.unmount();

    // …an error…
    (getCardById as jest.Mock).mockResolvedValueOnce(null);
    const failed = render(<CardEditScreen />);
    await waitFor(() => expect(screen.getByTestId('edit-card-error')).toBeTruthy());
    failed.unmount();

    // …and the form.
    render(<CardEditScreen />);
    await waitFor(() => expect(mockCardForm).toHaveBeenCalled());

    expect(mockStackScreen).not.toHaveBeenCalled();
  });

  it('shows an invalid-id error when no id param is present', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({});

    const { getByText } = render(<CardEditScreen />);

    await waitFor(() => expect(getByText('cards.edit.invalidId')).toBeTruthy());
    expect(getCardById).not.toHaveBeenCalled();
  });

  it('shows a not-found error when the card is missing', async () => {
    (getCardById as jest.Mock).mockResolvedValue(null);

    const { getByText } = render(<CardEditScreen />);

    await waitFor(() => expect(getByText('cards.edit.notFound')).toBeTruthy());
    expect(getByText('cards.edit.missingDescription')).toBeTruthy();
  });

  it('shows a load-failed error when the lookup throws', async () => {
    (getCardById as jest.Mock).mockRejectedValue(new Error('db error'));

    const { getByText } = render(<CardEditScreen />);

    await waitFor(() => expect(getByText('cards.edit.loadFailed')).toBeTruthy());
  });

  /**
   * Story 22.6 — edit not ready: the same header and back over the ground, with no footer and
   * today's content.
   */
  describe('before the form', () => {
    it('draws the header and a spinner while the card loads, with no footer', () => {
      (getCardById as jest.Mock).mockReturnValue(new Promise(() => {}));
      render(<CardEditScreen />);

      const form = screen.UNSAFE_getByType(FormScreen);
      expect(form.props.title).toBe('cards.edit.title');
      expect(form.props.primaryAction).toBeUndefined();
      expect(screen.getByTestId('edit-card-loading')).toBeTruthy();
      expect(screen.getByTestId('edit-back-button')).toBeTruthy();
      expect(screen.queryByTestId('save-button')).toBeNull();
      expect(mockCardForm).not.toHaveBeenCalled();
    });

    it.each([
      ['an invalid id', () => (useLocalSearchParams as jest.Mock).mockReturnValue({})],
      ['a missing card', () => (getCardById as jest.Mock).mockResolvedValue(null)],
      ['a failed load', () => (getCardById as jest.Mock).mockRejectedValue(new Error('db'))]
    ])('draws the header over %s, with no footer', async (_name, arrange) => {
      arrange();
      render(<CardEditScreen />);

      await waitFor(() => expect(screen.getByTestId('edit-card-error')).toBeTruthy());
      const form = screen.UNSAFE_getByType(FormScreen);
      expect(form.props.title).toBe('cards.edit.title');
      expect(form.props.primaryAction).toBeUndefined();
      expect(screen.queryByTestId('save-button')).toBeNull();
    });

    it.each([
      ['the spinner', 'edit-card-loading', () => new Promise(() => {})],
      ['the message', 'edit-card-error', () => Promise.resolve(null)]
    ])('centres %s in the space below the header', async (_name, testID, lookup) => {
      (getCardById as jest.Mock).mockImplementation(lookup);
      render(<CardEditScreen />);

      const state = await screen.findByTestId(testID);
      expect(StyleSheet.flatten(state.props.style)).toMatchObject({
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
      });
    });

    // Each state draws its own header, so each one's back is pressed.
    it.each([
      ['the spinner', 'edit-card-loading', () => new Promise(() => {})],
      ['the message', 'edit-card-error', () => Promise.resolve(null)]
    ])('goes straight back from the header while %s shows', async (_name, testID, lookup) => {
      (getCardById as jest.Mock).mockImplementation(lookup);
      render(<CardEditScreen />);
      await screen.findByTestId(testID);

      fireEvent.press(screen.getByTestId('edit-back-button'));
      expect(mockBack).toHaveBeenCalledTimes(1);
      expect(Alert.alert).not.toHaveBeenCalled();
    });
  });

  it('submits edits through the editCard hook', async () => {
    render(<CardEditScreen />);
    await waitFor(() => expect(mockCardForm).toHaveBeenCalled());

    await formProps().onSubmit({
      name: 'Updated',
      barcode: '999',
      barcodeFormat: 'EAN13',
      color: '#000'
    });

    expect(mockEditCard).toHaveBeenCalledWith('card-1', {
      name: 'Updated',
      barcode: '999',
      barcodeFormat: 'EAN13',
      color: '#000'
    });
  });

  // A failed save is the hook's `error`, which the form shows in its banner; and the hook's busy
  // state is the form's.
  it('hands the form the hook’s busy state and its error', async () => {
    mockSaveError = 'Failed to update card';
    mockIsUpdating = true;
    render(<CardEditScreen />);
    await waitFor(() => expect(mockCardForm).toHaveBeenCalled());

    expect(formProps()).toMatchObject({
      requestError: 'Failed to update card',
      isLoading: true
    });
  });

  it('hands the form no error while nothing has failed', async () => {
    render(<CardEditScreen />);
    await waitFor(() => expect(mockCardForm).toHaveBeenCalled());
    expect(formProps().requestError).toBeNull();
  });

  describe('leaving the form', () => {
    it('lets the hardware back button pass through when the form is pristine', async () => {
      render(<CardEditScreen />);
      await waitFor(() => expect(capturedBackHandler).toBeDefined());

      expect(capturedBackHandler!()).toBe(false);
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('intercepts hardware back and confirms discard when the form is dirty', async () => {
      render(<CardEditScreen />);
      await waitFor(() => expect(mockCardForm).toHaveBeenCalled());

      formProps().onDirtyChange(true);

      expect(capturedBackHandler!()).toBe(true);
      expect(Alert.alert).toHaveBeenCalledTimes(1);

      // Invoke the "discard" button's onPress → navigates back.
      alertButtons()[1]!.onPress?.();
      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    // Story 22.6 — the header's back is the screen's own, so it runs the discard check the native
    // header's back skipped.
    it('goes straight back from the header when the form is pristine', async () => {
      render(<CardEditScreen />);
      await waitFor(() => expect(mockCardForm).toHaveBeenCalled());

      formProps().onBack();
      expect(mockBack).toHaveBeenCalledTimes(1);
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('asks before leaving from the header when the form has unsaved changes', async () => {
      render(<CardEditScreen />);
      await waitFor(() => expect(mockCardForm).toHaveBeenCalled());

      formProps().onDirtyChange(true);
      formProps().onBack();

      expect(mockBack).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'cards.edit.discardTitle',
        'cards.edit.discardBody',
        expect.any(Array)
      );

      // "Keep Editing" stays on the form…
      const [keepEditing, discard] = alertButtons();
      expect(keepEditing).toMatchObject({ text: 'cards.edit.keepEditing', style: 'cancel' });
      expect(keepEditing!.onPress).toBeUndefined();
      expect(mockBack).not.toHaveBeenCalled();

      // …and "Discard" leaves it.
      discard!.onPress?.();
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });
});

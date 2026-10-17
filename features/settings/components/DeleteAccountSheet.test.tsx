/**
 * DeleteAccountSheet — delete account in two steps (Story 6.10): a confirm (frame D), then the
 * type-to-confirm (frame F) (Story 22.7).
 *
 * Rendered through the real `StoryDecorator`, the real sheet, buttons and field.
 */
import { act, fireEvent, render, screen, userEvent, within } from '@testing-library/react-native';
import React from 'react';
import { AccessibilityInfo, Modal, StyleSheet } from 'react-native';
import { Svg } from 'react-native-svg';

import { Button } from '@/shared/components/ui/Button';
import { TextField } from '@/shared/components/ui/TextField';
import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { DeleteAccountSheet } from './DeleteAccountSheet';

type Scheme = 'light' | 'dark';
type Roles = typeof LIGHT_THEME | typeof DARK_THEME;
type SheetProps = React.ComponentProps<typeof DeleteAccountSheet>;

// The jest.setup mock completes every animation at once; a closing test holds the slide-out open.
const reanimated = jest.requireMock<{
  withTiming: (value: number, config?: object, callback?: (finished?: boolean) => void) => number;
}>('react-native-reanimated');

const handlers = () => ({
  onConfirmDelete: jest.fn().mockResolvedValue(undefined),
  onClose: jest.fn()
});

const tree = (
  props: Partial<SheetProps>,
  callbacks: ReturnType<typeof handlers>,
  scheme: Scheme
) => (
  <StoryDecorator theme={scheme}>
    <DeleteAccountSheet visible isLoading={false} error={null} {...callbacks} {...props} />
  </StoryDecorator>
);

const renderSheet = (props: Partial<SheetProps> = {}, scheme: Scheme = 'light') => {
  const callbacks = handlers();
  const view = render(tree(props, callbacks, scheme));
  return {
    ...callbacks,
    rerenderWith: (next: Partial<SheetProps>) => view.rerender(tree(next, callbacks, scheme))
  };
};

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

const buttons = () => screen.UNSAFE_getAllByType(Button).map(({ props }) => props);

const continueToStep2 = async () => {
  await userEvent.press(screen.getByTestId('delete-continue-step1'));
};

const type = (text: string) => {
  fireEvent.changeText(screen.getByTestId('delete-confirm-input'), text);
};

describe('DeleteAccountSheet', () => {
  // Each step's buttons are the sheet's own actions, pinned beneath its text, rather than content
  // that scrolls with it.
  it('holds each step’s buttons in the sheet’s actions', async () => {
    renderSheet();
    const step1 = within(screen.getByTestId('delete-account-sheet-actions'));
    expect(step1.getByTestId('delete-continue-step1')).toBeTruthy();
    expect(step1.getByTestId('delete-cancel-step1')).toBeTruthy();

    await continueToStep2();
    const step2 = within(screen.getByTestId('delete-account-sheet-actions'));
    expect(step2.getByTestId('delete-confirm-step2')).toBeTruthy();
    expect(step2.getByTestId('delete-cancel-step2')).toBeTruthy();
  });

  // The sheet's own close — its scrim, Android back and the VoiceOver escape — reaches onClose.
  it('closes from its scrim and from Android back', async () => {
    const { onClose } = renderSheet();
    await userEvent.press(
      screen.getByTestId('delete-account-sheet-scrim', { includeHiddenElements: true })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
    screen.UNSAFE_getByType(Modal).props.onRequestClose();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('reads Continue on its Continue', () => {
    renderSheet();
    expect(within(screen.getByTestId('delete-continue-step1')).getByText('Continue')).toBeTruthy();
  });

  it('reads Cancel on its Cancel, at both steps', async () => {
    renderSheet();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    await continueToStep2();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
  });

  // Each sheet is announced by its title as it opens.
  it('is announced by its title as it opens', () => {
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => undefined);
    renderSheet();
    expect(announce).toHaveBeenCalledWith('Delete Account? opened');
    announce.mockRestore();
  });

  describe('step 1 (frame D)', () => {
    it('titles it "Delete Account?" over its body, as a heading', () => {
      renderSheet();
      expect(screen.getByRole('header', { name: 'Delete Account?' })).toBeTruthy();
      expect(
        screen.getByText(
          'This will permanently delete your account and all synced data. Cards stored locally on this device will remain.'
        )
      ).toBeTruthy();
    });

    it('puts Continue, destructive, above an outlined Cancel, both large', () => {
      renderSheet();
      expect(buttons()).toEqual([
        expect.objectContaining({
          testID: 'delete-continue-step1',
          variant: 'destructive',
          size: 'large'
        }),
        expect.objectContaining({
          testID: 'delete-cancel-step1',
          variant: 'secondary',
          size: 'large'
        })
      ]);
      expect(flat('delete-continue-step1-container').minHeight).toBe(52);
      expect(flat('delete-cancel-step1-container').minHeight).toBe(52);
    });

    it('draws no icon and no field', () => {
      renderSheet();
      expect(screen.UNSAFE_queryAllByType(Svg)).toHaveLength(0);
      expect(screen.queryByTestId('delete-confirm-input')).toBeNull();
    });

    it('cancels', async () => {
      const { onClose } = renderSheet();
      await userEvent.press(screen.getByTestId('delete-cancel-step1'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('step 2 (frame F)', () => {
    it('titles it "Confirm Account Deletion" over its body, as a heading', async () => {
      renderSheet();
      await continueToStep2();
      expect(screen.getByRole('header', { name: 'Confirm Account Deletion' })).toBeTruthy();
      expect(screen.getByText('Type DELETE to confirm permanent account deletion.')).toBeTruthy();
    });

    // The sheet changes in place, so a screen reader hears where it now is, as it hears a sheet's
    // title when it opens.
    it('announces its title when the sheet moves to it', async () => {
      const announce = jest
        .spyOn(AccessibilityInfo, 'announceForAccessibility')
        .mockImplementation(() => undefined);
      renderSheet();
      announce.mockClear();

      await continueToStep2();
      expect(announce).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenCalledWith('Confirm Account Deletion');
      announce.mockRestore();
    });

    // Delete Account is a control of its own, not Continue's button relabelled: what Continue held
    // — here, a press still down — does not carry over to it, so neither does a screen reader's focus.
    it('swaps in a fresh Delete Account button rather than reusing Continue’s', () => {
      renderSheet();
      const continueButton = screen.getByTestId('delete-continue-step1');
      fireEvent(continueButton, 'pressIn');
      expect(flat('delete-continue-step1-container').backgroundColor).not.toBe('transparent');
      fireEvent.press(continueButton);
      type('DELETE');

      expect(flat('delete-confirm-step2-container').backgroundColor).toBe('transparent');
    });

    // The field idiom: the label-bold label 8 above the input, no placeholder, the hint and capitals.
    it('asks for the keyword in a labelled field', async () => {
      renderSheet();
      await continueToStep2();
      const field = screen.UNSAFE_getByType(TextField);
      expect(field.props).toMatchObject({
        label: 'Type DELETE to confirm',
        autoCapitalize: 'characters',
        accessibilityLabel: 'Type DELETE to confirm',
        accessibilityHint: 'Type DELETE to enable account deletion'
      });
      expect(field.props.placeholder).toBeUndefined();
      // What the input itself receives, not only what the field is handed.
      const input = screen.getByTestId('delete-confirm-input');
      expect(input.props.autoCapitalize).toBe('characters');
      expect(input.props.accessibilityHint).toBe('Type DELETE to enable account deletion');
      expect(input.props.accessibilityLabel).toBe('Type DELETE to confirm');
      expect(input.props.placeholder).toBeUndefined();
      expect(
        StyleSheet.flatten(screen.getByText('Type DELETE to confirm').props.style)
      ).toMatchObject({ fontSize: 13, fontWeight: '600', textTransform: 'uppercase' });
    });

    it('puts Delete Account, destructive, above an outlined Cancel, both large', async () => {
      renderSheet();
      await continueToStep2();
      expect(buttons()).toEqual([
        expect.objectContaining({
          testID: 'delete-confirm-step2',
          variant: 'destructive',
          size: 'large'
        }),
        expect.objectContaining({
          testID: 'delete-cancel-step2',
          variant: 'secondary',
          size: 'large'
        })
      ]);
      expect(screen.getByText('Delete Account')).toBeTruthy();
    });

    // The one control in settings drawn disabled: the destructive label at 40 %, until the field
    // holds exactly the keyword.
    it.each<[Scheme, Roles]>([
      ['light', LIGHT_THEME],
      ['dark', DARK_THEME]
    ])('keeps the gate shut, at 40 %%, while the field is empty, in %s', async (scheme, roles) => {
      const { onConfirmDelete } = renderSheet({}, scheme);
      await continueToStep2();
      const confirm = screen.getByTestId('delete-confirm-step2');
      expect(confirm.props.accessibilityState).toMatchObject({ disabled: true });
      expect(flat('delete-confirm-step2-container').opacity).toBe(0.4);
      expect(StyleSheet.flatten(screen.getByText('Delete Account').props.style).color).toBe(
        roles.error
      );

      await userEvent.press(confirm);
      expect(onConfirmDelete).not.toHaveBeenCalled();
    });

    it.each(['delete', 'Delete', 'DELET', 'DELETE ', ' DELETE', 'DELETED'])(
      'keeps the gate shut for "%s": the keyword is exact, case included',
      async (text) => {
        const { onConfirmDelete } = renderSheet();
        await continueToStep2();
        type(text);
        expect(screen.getByTestId('delete-confirm-step2').props.accessibilityState).toMatchObject({
          disabled: true
        });
        await userEvent.press(screen.getByTestId('delete-confirm-step2'));
        expect(onConfirmDelete).not.toHaveBeenCalled();
      }
    );

    it('opens the gate for exactly DELETE, and deletes', async () => {
      const { onConfirmDelete } = renderSheet();
      await continueToStep2();
      type('DELETE');
      expect(screen.getByTestId('delete-confirm-step2').props.accessibilityState).toMatchObject({
        disabled: false
      });
      expect(flat('delete-confirm-step2-container').opacity).toBeUndefined();

      await userEvent.press(screen.getByTestId('delete-confirm-step2'));
      expect(onConfirmDelete).toHaveBeenCalledTimes(1);
    });

    it('cancels', async () => {
      const { onClose } = renderSheet();
      await continueToStep2();
      await userEvent.press(screen.getByTestId('delete-cancel-step2'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    // Busy wins over the gate: the spinner shows, presses are refused, and nothing else locks —
    // the field stays editable and Cancel live.
    it('shows the spinner while deleting, keeping the field editable and Cancel live', async () => {
      const { onConfirmDelete, onClose, rerenderWith } = renderSheet();
      await continueToStep2();
      type('DELETE');
      rerenderWith({ isLoading: true });

      const confirm = screen.getByTestId('delete-confirm-step2');
      expect(screen.getByTestId('delete-confirm-step2-spinner')).toBeTruthy();
      expect(confirm.props.accessibilityState).toEqual({ disabled: false, busy: true });
      expect(confirm.props.accessibilityLabel).toBe('Delete Account');
      // Its look kept: the borderless destructive label's transparent fill, the spinner in error.
      expect(flat('delete-confirm-step2-container').backgroundColor).toBe('transparent');
      expect(screen.getByTestId('delete-confirm-step2-spinner').props.color).toBe(
        LIGHT_THEME.error
      );
      expect(screen.getByTestId('delete-confirm-input').props.editable).toBe(true);
      await userEvent.press(confirm);
      expect(onConfirmDelete).not.toHaveBeenCalled();

      type('DELET');
      expect(screen.getByTestId('delete-confirm-step2-spinner')).toBeTruthy();
      await userEvent.press(screen.getByTestId('delete-cancel-step2'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('shows a failed delete as one banner, the first thing in the content, above the field', async () => {
      const { rerenderWith } = renderSheet();
      await continueToStep2();
      const announce = jest
        .spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions')
        .mockImplementation(() => undefined);
      rerenderWith({ error: 'Unable to delete account' });

      const banner = screen.getByTestId('delete-error');
      expect(banner.props.accessibilityRole).toBe('alert');
      expect(screen.getAllByText('Unable to delete account')).toHaveLength(1);
      const json = JSON.stringify(screen.toJSON());
      expect(json.indexOf('"delete-error"')).toBeLessThan(json.indexOf('"delete-confirm-input"'));
      // Spoken on iOS, which does not speak the alert role: queued behind the opening announcement.
      expect(announce).toHaveBeenCalledWith('Unable to delete account', { queue: true });
      announce.mockRestore();
    });
  });

  /**
   * The sheet keeps its content while it slides out: it resets its step and its text when it
   * OPENS, never when it closes, so a closing step 2 does not flip back to step 1 on screen.
   */
  describe('opening and closing', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('stays on its step, the text kept, while it closes', async () => {
      jest.spyOn(reanimated, 'withTiming').mockImplementation((value) => value);
      const { rerenderWith } = renderSheet();
      await continueToStep2();
      type('DELETE');

      rerenderWith({ visible: false });
      expect(
        screen.getByText('Confirm Account Deletion', { includeHiddenElements: true })
      ).toBeTruthy();
      expect(
        screen.getByTestId('delete-confirm-input', { includeHiddenElements: true }).props.value
      ).toBe('DELETE');
    });

    it('opens again at step 1 with an empty field', async () => {
      const { rerenderWith } = renderSheet();
      await continueToStep2();
      type('DELETE');

      rerenderWith({ visible: false });
      act(() => rerenderWith({ visible: true }));
      expect(screen.getByRole('header', { name: 'Delete Account?' })).toBeTruthy();
      await continueToStep2();
      expect(screen.getByTestId('delete-confirm-input').props.value).toBe('');
    });
  });
});

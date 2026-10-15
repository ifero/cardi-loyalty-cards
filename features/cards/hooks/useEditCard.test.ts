import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as Burnt from 'burnt';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

jest.mock('burnt');
jest.mock('expo-haptics');
jest.mock('expo-router', () => ({
  router: { back: jest.fn() }
}));

// Mock database functions
const mockExistingCard = {
  id: '1',
  name: 'Old',
  barcode: '000',
  barcodeFormat: 'EAN13',
  brandId: null,
  color: 'green',
  isFavorite: false,
  lastUsedAt: null,
  usageCount: 0,
  createdAt: '2020-01-01',
  updatedAt: '2020-01-01'
};

jest.mock('@/core/database', () => ({
  getCardById: jest.fn(() => Promise.resolve(mockExistingCard)),
  updateCard: jest.fn(() => Promise.resolve())
}));

jest.mock('@/core/sync', () => ({
  markDirty: jest.fn().mockResolvedValue(undefined)
}));

const mockUseAuthState = jest.fn().mockReturnValue({ authState: 'guest', isAuthenticated: false });
jest.mock('@/shared/supabase/useAuthState', () => ({
  useAuthState: (...args: unknown[]) => mockUseAuthState(...args)
}));

import { getCardById, updateCard as updateCardInDb } from '@/core/database';
import * as syncModule from '@/core/sync';
import { logger } from '@/core/utils/logger';

import { useEditCard } from './useEditCard';

describe('useEditCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Haptics.notificationAsync as jest.Mock).mockResolvedValue(undefined);
    (Burnt.toast as jest.Mock).mockReturnValue(undefined);
    jest.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (logger.error as jest.Mock).mockRestore();
  });

  it('updates card and shows success feedback', async () => {
    const { result } = renderHook(() => useEditCard());

    await act(async () => {
      await result.current.editCard('1', {
        name: 'New Name',
        barcode: '111',
        barcodeFormat: 'EAN13',
        color: 'blue'
      });
    });

    expect(getCardById).toHaveBeenCalledWith('1');
    expect(updateCardInDb).toHaveBeenCalled();
    expect(Haptics.notificationAsync).toHaveBeenCalled();
    expect(Burnt.toast).toHaveBeenCalled();
    expect(router.back).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it('handles missing card error path', async () => {
    (getCardById as jest.Mock).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useEditCard());

    await act(async () => {
      await result.current.editCard('not-found', {
        name: 'X',
        barcode: '1',
        barcodeFormat: 'EAN13',
        color: 'green'
      });
    });

    expect(result.current.error).toBe('Failed to update card');
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Error);
    expect(logger.error).toHaveBeenCalledWith(
      '[useEditCard] Failed to update card',
      expect.any(Error)
    );
    expect(router.back).not.toHaveBeenCalled();
  });

  // Story 22.6 — the form's request banner carries the failure, from `error`. A toast as well
  // would be two error surfaces for one failure.
  it('shows no toast on failure, leaving the failure to the form’s banner', async () => {
    (updateCardInDb as jest.Mock).mockRejectedValueOnce(new Error('db error'));

    const { result } = renderHook(() => useEditCard());

    await act(async () => {
      await result.current.editCard('1', {
        name: 'X',
        barcode: '1',
        barcodeFormat: 'EAN13',
        color: 'green'
      });
    });

    expect(result.current.error).toBe('Failed to update card');
    expect(Burnt.toast).not.toHaveBeenCalled();
  });

  // The banner clears when the next press starts a save, because the hook resets `error` then.
  it('clears the error when the next save starts', async () => {
    (updateCardInDb as jest.Mock).mockRejectedValueOnce(new Error('db error'));

    const { result } = renderHook(() => useEditCard());
    const input = {
      name: 'X',
      barcode: '1',
      barcodeFormat: 'EAN13' as const,
      color: 'green' as const
    };

    await act(async () => {
      await result.current.editCard('1', input);
    });
    expect(result.current.error).toBe('Failed to update card');

    let resolveUpdate: (value?: unknown) => void;
    (updateCardInDb as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve;
        })
    );
    let editPromise: Promise<void>;
    act(() => {
      editPromise = result.current.editCard('1', input);
    });
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(true);

    // The lookup resolves first; resolve the write, held open above, only once it has been made.
    await waitFor(() => expect(updateCardInDb).toHaveBeenCalledTimes(2));
    await act(async () => {
      resolveUpdate!();
      await editPromise;
    });
    expect(result.current.error).toBeNull();
  });

  describe('Sync Trigger (Story 7.3)', () => {
    it('calls markDirty after update when authenticated', async () => {
      mockUseAuthState.mockReturnValue({ authState: 'authenticated', isAuthenticated: true });

      const { result } = renderHook(() => useEditCard());

      await act(async () => {
        await result.current.editCard('1', {
          name: 'Updated',
          barcode: '111',
          barcodeFormat: 'EAN13',
          color: 'blue'
        });
      });

      expect(syncModule.markDirty).toHaveBeenCalledTimes(1);
    });

    it('does NOT call markDirty in guest mode', async () => {
      mockUseAuthState.mockReturnValue({ authState: 'guest', isAuthenticated: false });

      const { result } = renderHook(() => useEditCard());

      await act(async () => {
        await result.current.editCard('1', {
          name: 'Updated',
          barcode: '111',
          barcodeFormat: 'EAN13',
          color: 'blue'
        });
      });

      expect(syncModule.markDirty).not.toHaveBeenCalled();
    });
  });
});

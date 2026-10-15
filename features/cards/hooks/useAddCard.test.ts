/**
 * useAddCard Hook Tests
 * Story 2.2: Add Card Manually - AC7
 */

import { renderHook, act } from '@testing-library/react-native';
import * as Burnt from 'burnt';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { v4 as uuidv4 } from 'uuid';

import * as cardRepository from '@/core/database';
import * as syncModule from '@/core/sync';
import { logger } from '@/core/utils/logger';

import { useAddCard, AddCardInput } from './useAddCard';

// Mock card repository
jest.mock('@/core/database', () => ({
  insertCard: jest.fn()
}));

// Mock sync module
jest.mock('@/core/sync', () => ({
  markDirty: jest.fn().mockResolvedValue(undefined)
}));

// Mock auth state
const mockUseAuthState = jest.fn().mockReturnValue({ authState: 'guest', isAuthenticated: false });
jest.mock('@/shared/supabase/useAuthState', () => ({
  useAuthState: (...args: unknown[]) => mockUseAuthState(...args)
}));

// UUID is mocked in jest.setup.js
const mockUUID = '123e4567-e89b-12d3-a456-426614174000';

describe('useAddCard', () => {
  const mockCardInput: AddCardInput = {
    name: 'Test Store',
    barcode: '1234567890',
    barcodeFormat: 'CODE128',
    color: 'blue'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (cardRepository.insertCard as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Initial State', () => {
    it('returns initial state with isLoading false', () => {
      const { result } = renderHook(() => useAddCard());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.addCard).toBe('function');
    });
  });

  describe('addCard Function - AC7', () => {
    it('creates card with correct properties', async () => {
      const { result } = renderHook(() => useAddCard());

      await act(async () => {
        await result.current.addCard(mockCardInput);
      });

      expect(cardRepository.insertCard).toHaveBeenCalledTimes(1);

      const insertedCard = (cardRepository.insertCard as jest.Mock).mock.calls[0][0];

      // Verify card properties per AC7
      expect(insertedCard.id).toBe(mockUUID);
      expect(uuidv4).toHaveBeenCalled();
      expect(insertedCard.name).toBe('Test Store');
      expect(insertedCard.barcode).toBe('1234567890');
      expect(insertedCard.barcodeFormat).toBe('CODE128');
      expect(insertedCard.color).toBe('blue');
      expect(insertedCard.brandId).toBeNull(); // Custom card
      expect(insertedCard.isFavorite).toBe(false);
      expect(insertedCard.lastUsedAt).toBeNull();
      expect(insertedCard.usageCount).toBe(0);
      expect(insertedCard.createdAt).toBeDefined();
      expect(insertedCard.updatedAt).toBeDefined();
    });

    it('trims whitespace from name and barcode', async () => {
      const { result } = renderHook(() => useAddCard());

      await act(async () => {
        await result.current.addCard({
          ...mockCardInput,
          name: '  Test Store  ',
          barcode: '  1234567890  '
        });
      });

      const insertedCard = (cardRepository.insertCard as jest.Mock).mock.calls[0][0];
      expect(insertedCard.name).toBe('Test Store');
      expect(insertedCard.barcode).toBe('1234567890');
    });

    it('sets timestamps to current time', async () => {
      const beforeTime = new Date().toISOString();

      const { result } = renderHook(() => useAddCard());

      await act(async () => {
        await result.current.addCard(mockCardInput);
      });

      const afterTime = new Date().toISOString();
      const insertedCard = (cardRepository.insertCard as jest.Mock).mock.calls[0][0];

      // Timestamps should be between before and after
      expect(insertedCard.createdAt >= beforeTime).toBe(true);
      expect(insertedCard.createdAt <= afterTime).toBe(true);
      expect(insertedCard.updatedAt).toBe(insertedCard.createdAt);
    });
  });

  describe('Success Feedback - AC7', () => {
    it('triggers haptic feedback on success', async () => {
      const { result } = renderHook(() => useAddCard());

      await act(async () => {
        await result.current.addCard(mockCardInput);
      });

      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success
      );
    });

    it('shows toast notification on success', async () => {
      const { result } = renderHook(() => useAddCard());

      await act(async () => {
        await result.current.addCard(mockCardInput);
      });

      expect(Burnt.toast).toHaveBeenCalledWith({
        title: 'Card added',
        preset: 'done'
      });
    });

    it('navigates to main cards list on success', async () => {
      const { result } = renderHook(() => useAddCard());

      await act(async () => {
        await result.current.addCard(mockCardInput);
      });

      expect(router.replace).toHaveBeenCalledWith({
        pathname: '/',
        params: expect.objectContaining({
          newCardId: expect.any(String),
          newCardName: 'Test Store'
        })
      });
    });
  });

  describe('Loading State', () => {
    it('sets isLoading to true during operation', async () => {
      let resolveInsert: (value?: unknown) => void;
      (cardRepository.insertCard as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveInsert = resolve;
          })
      );

      const { result } = renderHook(() => useAddCard());

      // Start the operation but don't await it
      let addPromise: Promise<void>;
      act(() => {
        addPromise = result.current.addCard(mockCardInput);
      });

      // Check loading state is true
      expect(result.current.isLoading).toBe(true);

      // Complete the operation
      await act(async () => {
        resolveInsert!();
        await addPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('sets error state on failure', async () => {
      const errorMessage = 'Database error';
      (cardRepository.insertCard as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAddCard());

      await act(async () => {
        await result.current.addCard(mockCardInput);
      });

      expect(result.current.error).toBe('Failed to add card');
    });

    it('triggers error haptic on failure', async () => {
      (cardRepository.insertCard as jest.Mock).mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useAddCard());

      await act(async () => {
        await result.current.addCard(mockCardInput);
      });

      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Error
      );
    });

    // Story 22.6 — the form's request banner carries the failure, from `error`. A toast as well
    // would be two error surfaces for one failure.
    it('shows no toast on failure, leaving the failure to the form’s banner', async () => {
      (cardRepository.insertCard as jest.Mock).mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useAddCard());

      await act(async () => {
        await result.current.addCard(mockCardInput);
      });

      expect(Burnt.toast).not.toHaveBeenCalled();
      expect(result.current.error).toBe('Failed to add card');
    });

    it('logs the failure', async () => {
      const logged = jest.spyOn(logger, 'error').mockImplementation(() => {});
      try {
        const failure = new Error('Database error');
        (cardRepository.insertCard as jest.Mock).mockRejectedValue(failure);

        const { result } = renderHook(() => useAddCard());

        await act(async () => {
          await result.current.addCard(mockCardInput);
        });

        expect(logged).toHaveBeenCalledWith('[useAddCard] Failed to add card', failure);
      } finally {
        logged.mockRestore();
      }
    });

    // The banner clears when the next press starts a save, because the hook resets `error` then.
    it('clears the error when the next save starts', async () => {
      (cardRepository.insertCard as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      const { result } = renderHook(() => useAddCard());

      await act(async () => {
        await result.current.addCard(mockCardInput);
      });
      expect(result.current.error).toBe('Failed to add card');

      let resolveInsert: (value?: unknown) => void;
      (cardRepository.insertCard as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveInsert = resolve;
          })
      );
      let addPromise: Promise<void>;
      act(() => {
        addPromise = result.current.addCard(mockCardInput);
      });
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveInsert!();
        await addPromise;
      });
    });

    it('does not navigate on failure', async () => {
      (cardRepository.insertCard as jest.Mock).mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useAddCard());

      await act(async () => {
        await result.current.addCard(mockCardInput);
      });

      expect(router.replace).not.toHaveBeenCalled();
    });

    it('handles non-Error exceptions', async () => {
      (cardRepository.insertCard as jest.Mock).mockRejectedValue('String error');

      const { result } = renderHook(() => useAddCard());

      await act(async () => {
        await result.current.addCard(mockCardInput);
      });

      expect(result.current.error).toBe('Failed to add card');
    });
  });

  describe('Sync Trigger (Story 7.3)', () => {
    it('calls markDirty after insert when authenticated', async () => {
      mockUseAuthState.mockReturnValue({ authState: 'authenticated', isAuthenticated: true });

      const { result } = renderHook(() => useAddCard());

      await act(async () => {
        await result.current.addCard(mockCardInput);
      });

      expect(syncModule.markDirty).toHaveBeenCalledTimes(1);
    });

    it('does NOT call markDirty in guest mode', async () => {
      mockUseAuthState.mockReturnValue({ authState: 'guest', isAuthenticated: false });

      const { result } = renderHook(() => useAddCard());

      await act(async () => {
        await result.current.addCard(mockCardInput);
      });

      expect(syncModule.markDirty).not.toHaveBeenCalled();
    });
  });
});

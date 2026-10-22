import { renderHook } from '@testing-library/react-native';

import { useStackBack } from './useStackBack';

const mockBack = jest.fn();
const mockCanGoBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, canGoBack: mockCanGoBack })
}));

describe('useStackBack', () => {
  it('goes back where the stack has a screen beneath', () => {
    mockCanGoBack.mockReturnValue(true);
    const { result } = renderHook(() => useStackBack());

    expect(result.current).toEqual(expect.any(Function));
    result.current?.();
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  // New password after recovery begun from Home is alone on the stack: nothing beneath, no back.
  it('offers no back where there is nothing beneath', () => {
    mockCanGoBack.mockReturnValue(false);
    const { result } = renderHook(() => useStackBack());

    expect(result.current).toBeUndefined();
    expect(mockBack).not.toHaveBeenCalled();
  });
});

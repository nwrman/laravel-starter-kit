import { act, renderHook } from '@testing-library/react';
import { useClipboard } from './use-clipboard';

describe('useClipboard', () => {
  const originalClipboard = navigator.clipboard;

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
  });

  it('copies text to clipboard successfully', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useClipboard());

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current[1]('hello');
    });

    expect(success).toBe(true);
    expect(result.current[0]).toBe('hello');
    expect(writeTextMock).toHaveBeenCalledWith('hello');
  });

  it('returns false when clipboard write fails', async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error('fail'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useClipboard());

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current[1]('hello');
    });

    expect(success).toBe(false);
    expect(result.current[0]).toBeNull();
    warnSpy.mockRestore();
  });

  it('returns false when clipboard API is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useClipboard());

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current[1]('hello');
    });

    expect(success).toBe(false);
    warnSpy.mockRestore();
  });
});

import { router } from '@inertiajs/react';
import { act, renderHook } from '@testing-library/react';
import { useInertiaPolling } from './use-inertia-polling';

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', {
    value: state,
    writable: true,
    configurable: true,
  });
}

describe('useInertiaPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(router.reload).mockClear();
    setVisibility('visible');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reloads the listed props on the interval when enabled and visible', () => {
    renderHook(() => useInertiaPolling(['sends'], 5_000));

    expect(router.reload).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(router.reload).toHaveBeenCalledTimes(1);
    expect(router.reload).toHaveBeenCalledWith({ only: ['sends'] });

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(router.reload).toHaveBeenCalledTimes(2);
  });

  it('does not schedule reloads when enabled is false', () => {
    renderHook(() => useInertiaPolling(['sends'], 5_000, false));

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(router.reload).not.toHaveBeenCalled();
  });

  it('starts polling when enabled flips from false to true', () => {
    const { rerender } = renderHook(({ enabled }) => useInertiaPolling(['sends'], 5_000, enabled), {
      initialProps: { enabled: false },
    });

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(router.reload).not.toHaveBeenCalled();

    rerender({ enabled: true });

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(router.reload).toHaveBeenCalledTimes(1);
  });

  it('stops polling when enabled flips from true to false', () => {
    const { rerender } = renderHook(({ enabled }) => useInertiaPolling(['sends'], 5_000, enabled), {
      initialProps: { enabled: true },
    });

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(router.reload).toHaveBeenCalledTimes(1);

    rerender({ enabled: false });

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(router.reload).toHaveBeenCalledTimes(1);
  });

  it('fires a one-shot reload on refocus even when disabled', () => {
    renderHook(() => useInertiaPolling(['sends'], 5_000, false));

    setVisibility('hidden');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    setVisibility('visible');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(router.reload).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(router.reload).toHaveBeenCalledTimes(1);
  });

  it('stops the timer while the tab is hidden and resumes on refocus', () => {
    renderHook(() => useInertiaPolling(['sends'], 5_000));

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(router.reload).toHaveBeenCalledTimes(1);

    setVisibility('hidden');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(router.reload).toHaveBeenCalledTimes(1);

    setVisibility('visible');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(router.reload).toHaveBeenCalledTimes(2);

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(router.reload).toHaveBeenCalledTimes(3);
  });
});

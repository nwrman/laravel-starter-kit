import { renderHook } from '@testing-library/react';
import { useMobileNavigation } from './use-mobile-navigation';

describe('useMobileNavigation', () => {
  it('returns a cleanup function that removes pointer-events from body', () => {
    document.body.style.pointerEvents = 'none';

    const { result } = renderHook(() => useMobileNavigation());

    expect(document.body.style.pointerEvents).toBe('none');

    result.current();

    expect(document.body.style.pointerEvents).toBe('');
  });

  it('returns a stable function reference across re-renders', () => {
    const { result, rerender } = renderHook(() => useMobileNavigation());

    const first = result.current;
    rerender();
    const second = result.current;

    expect(first).toBe(second);
  });
});

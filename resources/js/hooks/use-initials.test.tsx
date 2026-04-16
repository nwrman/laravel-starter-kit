import { renderHook } from '@testing-library/react';
import { useInitials } from './use-initials';

describe('useInitials', () => {
  it('returns both initials for a full name', () => {
    const { result } = renderHook(() => useInitials());

    expect(result.current('Jonathan Fernández')).toBe('JF');
  });

  it('returns single initial for a single name', () => {
    const { result } = renderHook(() => useInitials());

    expect(result.current('Jonathan')).toBe('J');
  });

  it('returns empty string for blank input', () => {
    const { result } = renderHook(() => useInitials());

    expect(result.current('   ')).toBe('');
  });

  it('uses first and last initials for three names', () => {
    const { result } = renderHook(() => useInitials());

    expect(result.current('María del Carmen López')).toBe('ML');
  });
});

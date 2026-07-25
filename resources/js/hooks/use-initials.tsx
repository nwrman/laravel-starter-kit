import { useCallback } from 'react';

export type GetInitialsFn = (fullName: string) => string;

// Array.from splits by code point, so emoji/accented first characters survive
// (charAt would return half a surrogate pair).
function getInitial(name: string): string {
  return Array.from(name)[0] ?? '';
}

export function useInitials(): GetInitialsFn {
  return useCallback((fullName: string): string => {
    const names = fullName.trim().split(/\s+/u).filter(Boolean);

    if (names.length === 0) {
      return '';
    }

    if (names.length === 1) {
      return getInitial(names[0]).toUpperCase();
    }

    const firstInitial = getInitial(names[0]);
    const lastInitial = getInitial(names[names.length - 1]);

    return `${firstInitial}${lastInitial}`.toUpperCase();
  }, []);
}

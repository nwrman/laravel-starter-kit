import { renderHook } from '@testing-library/react';
import { setPageUrl } from '@/testing/helpers';
import { useCurrentUrl } from './use-current-url';

describe('useCurrentUrl', () => {
  it('returns the current URL path', () => {
    setPageUrl('/dashboard');
    const { result } = renderHook(() => useCurrentUrl());

    expect(result.current.currentUrl).toBe('/dashboard');
  });

  it('isCurrentUrl matches exact relative path', () => {
    setPageUrl('/settings/profile');
    const { result } = renderHook(() => useCurrentUrl());

    expect(result.current.isCurrentUrl('/settings/profile')).toBe(true);
    expect(result.current.isCurrentUrl('/settings')).toBe(false);
  });

  it('isCurrentUrl matches with startsWith mode', () => {
    setPageUrl('/settings/profile');
    const { result } = renderHook(() => useCurrentUrl());

    expect(result.current.isCurrentUrl('/settings', undefined, true)).toBe(true);
    expect(result.current.isCurrentUrl('/other', undefined, true)).toBe(false);
  });

  it('isCurrentUrl handles absolute URLs by comparing pathname', () => {
    setPageUrl('/settings/profile');
    const { result } = renderHook(() => useCurrentUrl());

    expect(result.current.isCurrentUrl('http://localhost/settings/profile')).toBe(true);
    expect(result.current.isCurrentUrl('http://localhost/other')).toBe(false);
  });

  it('isCurrentUrl accepts a custom currentUrl override', () => {
    setPageUrl('/');
    const { result } = renderHook(() => useCurrentUrl());

    expect(result.current.isCurrentUrl('/settings', '/settings')).toBe(true);
  });

  it('isCurrentUrl accepts RouteDefinition objects', () => {
    setPageUrl('/settings/profile');
    const { result } = renderHook(() => useCurrentUrl());

    expect(result.current.isCurrentUrl({ url: '/settings/profile', method: 'get' })).toBe(true);
  });

  it('isCurrentOrParentUrl delegates with startsWith=true', () => {
    setPageUrl('/settings/profile');
    const { result } = renderHook(() => useCurrentUrl());

    expect(result.current.isCurrentOrParentUrl('/settings')).toBe(true);
    expect(result.current.isCurrentOrParentUrl('/other')).toBe(false);
  });

  it('whenCurrentUrl returns ifTrue value when URL matches', () => {
    setPageUrl('/');
    const { result } = renderHook(() => useCurrentUrl());

    expect(result.current.whenCurrentUrl('/', 'active', 'inactive')).toBe('active');
  });

  it('whenCurrentUrl returns ifFalse value when URL does not match', () => {
    setPageUrl('/');
    const { result } = renderHook(() => useCurrentUrl());

    expect(result.current.whenCurrentUrl('/other', 'active', 'inactive')).toBe('inactive');
  });

  it('whenCurrentUrl returns null as default ifFalse', () => {
    setPageUrl('/');
    const { result } = renderHook(() => useCurrentUrl());

    expect(result.current.whenCurrentUrl('/other', 'active')).toBeNull();
  });

  it('isCurrentUrl gracefully handles invalid absolute URLs', () => {
    setPageUrl('/settings');
    const { result } = renderHook(() => useCurrentUrl());

    // 'http://[::1' is an invalid IPv6 address parser error in Node
    expect(result.current.isCurrentUrl('http://[::1')).toBe(false);
  });
});

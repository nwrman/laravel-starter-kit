describe('useIsMobile', () => {
  let listeners: Array<(event: MediaQueryListEvent) => void>;
  let matchesValue: boolean;

  beforeEach(() => {
    listeners = [];
    matchesValue = false;

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        get matches() {
          return matchesValue;
        },
        media: query,
        addEventListener: (_event: string, handler: (event: MediaQueryListEvent) => void) => {
          listeners.push(handler);
        },
        removeEventListener: (_event: string, handler: (event: MediaQueryListEvent) => void) => {
          listeners = listeners.filter((l) => l !== handler);
        },
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    vi.resetModules();
  });

  it('returns false on desktop widths', async () => {
    matchesValue = false;
    const { renderHook } = await import('@testing-library/react');
    const { useIsMobile } = await import('./use-mobile');
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it('returns true on mobile widths', async () => {
    matchesValue = true;
    const { renderHook } = await import('@testing-library/react');
    const { useIsMobile } = await import('./use-mobile');
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it('responds to breakpoint changes', async () => {
    matchesValue = false;
    const { renderHook, act } = await import('@testing-library/react');
    const { useIsMobile } = await import('./use-mobile');
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    act(() => {
      matchesValue = true;
      for (const listener of listeners) {
        listener({ matches: true } as MediaQueryListEvent);
      }
    });

    expect(result.current).toBe(true);
  });

  it('safely handles missing matchMedia during initialization', async () => {
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue(undefined),
      writable: true,
      configurable: true,
    });
    vi.resetModules();

    const { renderHook } = await import('@testing-library/react');
    const { useIsMobile } = await import('./use-mobile');
    const { result } = renderHook(() => useIsMobile());

    // Without mql, it falls back to false and the effect returns a no-op cleanup
    expect(result.current).toBe(false);
  });

  it('returns false during SSR getServerSnapshot', async () => {
    vi.resetModules();
    const { renderToString } = await import('react-dom/server');
    const { useIsMobile } = await import('./use-mobile');
    const React = await import('react');

    function TestSSR() {
      const isMobile = useIsMobile();
      return React.createElement('div', null, isMobile ? 'mobile' : 'desktop');
    }

    const html = renderToString(React.createElement(TestSSR));
    expect(html).toContain('desktop');
  });
});

import { router } from '@inertiajs/react';

type Listener = (event: { detail: unknown; preventDefault?: () => void }) => void;

function getListener(name: string): Listener {
  const calls = (router.on as unknown as { mock: { calls: [string, Listener][] } }).mock.calls;
  const entry = calls.find(([eventName]) => eventName === name);

  if (!entry) {
    throw new Error(`router.on('${name}') was never registered`);
  }

  return entry[1];
}

function extractUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.href;
  }

  return input.url;
}

async function loadHandlerFresh() {
  vi.resetModules();
  const mod = await import('./session-expired-handler');
  mod.initSessionExpiredHandler();
}

const originalFetch = globalThis.fetch;

describe('session-expired-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('registers before and httpException listeners on init', async () => {
    await loadHandlerFresh();

    const registered = (
      router.on as unknown as { mock: { calls: [string, Listener][] } }
    ).mock.calls.map(([name]) => name);

    expect(registered).toContain('before');
    expect(registered).toContain('httpException');
  });

  it('silently retries the original visit on 419 when csrf refresh + auth check succeed', async () => {
    await loadHandlerFresh();

    const beforeListener = getListener('before');
    const httpExceptionListener = getListener('httpException');

    beforeListener({
      detail: {
        visit: {
          url: { href: '/dashboard' },
          method: 'get',
          data: undefined,
        },
      },
    });

    globalThis.fetch = vi.fn((input: RequestInfo | URL) => {
      const url = extractUrl(input);

      if (url.includes('/csrf-token')) {
        return Promise.resolve(new Response(JSON.stringify({ token: 'fresh' }), { status: 200 }));
      }

      if (url.includes('/auth-check')) {
        return Promise.resolve(
          new Response(JSON.stringify({ authenticated: true }), { status: 200 }),
        );
      }

      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    }) as typeof fetch;

    const preventDefault = vi.fn();

    httpExceptionListener({
      detail: { response: { status: 419 } },
      preventDefault,
    });

    expect(preventDefault).toHaveBeenCalledOnce();

    await vi.waitFor(() => {
      expect(router.get).toHaveBeenCalledWith(
        '/dashboard',
        undefined,
        expect.objectContaining({
          preserveState: true,
          preserveScroll: true,
        }),
      );
    });

    expect(document.getElementById('session-expired-modal-root')).toBeNull();
  });

  it('mounts the session expired modal when auth check fails', async () => {
    await loadHandlerFresh();

    const beforeListener = getListener('before');
    const httpExceptionListener = getListener('httpException');

    beforeListener({
      detail: {
        visit: {
          url: { href: '/projects' },
          method: 'get',
          data: undefined,
        },
      },
    });

    globalThis.fetch = vi.fn((input: RequestInfo | URL) => {
      const url = extractUrl(input);

      if (url.includes('/csrf-token')) {
        return Promise.resolve(new Response(JSON.stringify({ token: 'fresh' }), { status: 200 }));
      }

      if (url.includes('/auth-check')) {
        return Promise.resolve(new Response('', { status: 401 }));
      }

      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    }) as typeof fetch;

    httpExceptionListener({
      detail: { response: { status: 419 } },
      preventDefault: vi.fn(),
    });

    await vi.waitFor(() => {
      expect(document.getElementById('session-expired-modal-root')).not.toBeNull();
    });

    expect(router.get).not.toHaveBeenCalled();
  });

  it('ignores non-401/419 http exceptions', async () => {
    await loadHandlerFresh();

    const httpExceptionListener = getListener('httpException');
    const preventDefault = vi.fn();

    httpExceptionListener({
      detail: { response: { status: 500 } },
      preventDefault,
    });

    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('mounts the modal immediately on 401 without attempting csrf refresh', async () => {
    await loadHandlerFresh();

    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as typeof fetch;

    const httpExceptionListener = getListener('httpException');
    const preventDefault = vi.fn();

    httpExceptionListener({
      detail: { response: { status: 401 } },
      preventDefault,
    });

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(document.getElementById('session-expired-modal-root')).not.toBeNull();
  });
});

import { act, renderHook } from '@testing-library/react';
import { useTwoFactorAuth } from './use-two-factor-auth';

describe('useTwoFactorAuth', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('has correct initial state', () => {
    const { result } = renderHook(() => useTwoFactorAuth());

    expect(result.current.qrCodeSvg).toBeNull();
    expect(result.current.manualSetupKey).toBeNull();
    expect(result.current.recoveryCodesList).toEqual([]);
    expect(result.current.hasSetupData).toBe(false);
    expect(result.current.errors).toEqual([]);
  });

  it('fetchQrCode sets qrCodeSvg on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ svg: '<svg>mock</svg>' }), { status: 200 }),
    );

    const { result } = renderHook(() => useTwoFactorAuth());

    await act(async () => {
      await result.current.fetchQrCode();
    });

    expect(result.current.qrCodeSvg).toBe('<svg>mock</svg>');
  });

  it('fetchQrCode sets error on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 500 }));

    const { result } = renderHook(() => useTwoFactorAuth());

    await act(async () => {
      await result.current.fetchQrCode();
    });

    expect(result.current.qrCodeSvg).toBeNull();
    expect(result.current.errors).toContain('Failed to fetch QR code');
  });

  it('fetchSetupKey sets manualSetupKey on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ secretKey: 'ABC123' }), { status: 200 }),
    );

    const { result } = renderHook(() => useTwoFactorAuth());

    await act(async () => {
      await result.current.fetchSetupKey();
    });

    expect(result.current.manualSetupKey).toBe('ABC123');
  });

  it('fetchSetupKey sets error on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 500 }));

    const { result } = renderHook(() => useTwoFactorAuth());

    await act(async () => {
      await result.current.fetchSetupKey();
    });

    expect(result.current.manualSetupKey).toBeNull();
    expect(result.current.errors).toContain('Failed to fetch a setup key');
  });

  it('fetchSetupData fetches both QR code and setup key in parallel', async () => {
    let callCount = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return new Response(JSON.stringify({ svg: '<svg/>' }), { status: 200 });
      }
      return new Response(JSON.stringify({ secretKey: 'KEY' }), { status: 200 });
    });

    const { result } = renderHook(() => useTwoFactorAuth());

    await act(async () => {
      await result.current.fetchSetupData();
    });

    expect(result.current.qrCodeSvg).toBe('<svg/>');
    expect(result.current.manualSetupKey).toBe('KEY');
    expect(result.current.hasSetupData).toBe(true);
  });

  it('fetchRecoveryCodes sets codes on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(['CODE1', 'CODE2']), { status: 200 }),
    );

    const { result } = renderHook(() => useTwoFactorAuth());

    await act(async () => {
      await result.current.fetchRecoveryCodes();
    });

    expect(result.current.recoveryCodesList).toEqual(['CODE1', 'CODE2']);
  });

  it('fetchRecoveryCodes sets error on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 500 }));

    const { result } = renderHook(() => useTwoFactorAuth());

    await act(async () => {
      await result.current.fetchRecoveryCodes();
    });

    expect(result.current.recoveryCodesList).toEqual([]);
    expect(result.current.errors).toContain('Failed to fetch recovery codes');
  });

  it('clearSetupData resets QR code, setup key, and errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ svg: '<svg/>' }), { status: 200 }),
    );

    const { result } = renderHook(() => useTwoFactorAuth());

    await act(async () => {
      await result.current.fetchQrCode();
    });

    expect(result.current.qrCodeSvg).not.toBeNull();

    act(() => {
      result.current.clearSetupData();
    });

    expect(result.current.qrCodeSvg).toBeNull();
    expect(result.current.manualSetupKey).toBeNull();
    expect(result.current.errors).toEqual([]);
  });

  it('clearErrors removes all errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 500 }));

    const { result } = renderHook(() => useTwoFactorAuth());

    await act(async () => {
      await result.current.fetchQrCode();
    });

    expect(result.current.errors.length).toBeGreaterThan(0);

    act(() => {
      result.current.clearErrors();
    });

    expect(result.current.errors).toEqual([]);
  });

  it('hasSetupData is true only when both qrCodeSvg and manualSetupKey are set', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ svg: '<svg/>' }), { status: 200 }),
    );

    const { result } = renderHook(() => useTwoFactorAuth());

    expect(result.current.hasSetupData).toBe(false);

    await act(async () => {
      await result.current.fetchQrCode();
    });

    // Only QR code set, not setup key
    expect(result.current.hasSetupData).toBe(false);
  });

  it('returns stable function references across re-renders', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 500 }));

    const { result, rerender } = renderHook(() => useTwoFactorAuth());

    const firstRender = {
      fetchQrCode: result.current.fetchQrCode,
      fetchSetupKey: result.current.fetchSetupKey,
      fetchSetupData: result.current.fetchSetupData,
      fetchRecoveryCodes: result.current.fetchRecoveryCodes,
      clearErrors: result.current.clearErrors,
      clearSetupData: result.current.clearSetupData,
    };

    // Trigger a state change to cause a re-render
    await act(async () => {
      await result.current.fetchQrCode();
    });

    rerender();

    expect(result.current.fetchQrCode).toBe(firstRender.fetchQrCode);
    expect(result.current.fetchSetupKey).toBe(firstRender.fetchSetupKey);
    expect(result.current.fetchSetupData).toBe(firstRender.fetchSetupData);
    expect(result.current.fetchRecoveryCodes).toBe(firstRender.fetchRecoveryCodes);
    expect(result.current.clearErrors).toBe(firstRender.clearErrors);
    expect(result.current.clearSetupData).toBe(firstRender.clearSetupData);
  });
});

import '@testing-library/jest-dom/vitest';
import { resetPageProps, resetPageUrl } from './helpers';
import './mocks/inertia';
import './mocks/routes';

// JSDOM doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// JSDOM doesn't implement elementFromPoint (needed by input-otp)
if (typeof document.elementFromPoint !== 'function') {
  document.elementFromPoint = () => null;
}

// JSDOM doesn't implement ResizeObserver
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Ensure matchMedia is available for components that need it at module eval time
if (typeof window.matchMedia === 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

afterEach(() => {
  resetPageProps();
  resetPageUrl();
});

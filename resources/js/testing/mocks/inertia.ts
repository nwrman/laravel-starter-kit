import React from 'react';
import { vi } from 'vitest';
import { getPageProps, getPageUrl } from '../helpers';

/**
 * Centralized mock for @inertiajs/react.
 *
 * - usePage() returns controllable props via setPageProps()
 * - Link renders as a plain <a> to avoid provider requirements
 * - Form renders as a <form> and calls children with default slot props
 * - router is a collection of vi.fn() stubs
 * - Head renders nothing (side-effect only in real Inertia)
 */
vi.mock('@inertiajs/react', () => {
  const mockRouter = {
    visit: vi.fn(),
    reload: vi.fn(),
    on: vi.fn(() => vi.fn()),
    flushAll: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  };

  return {
    usePage: () => ({
      props: getPageProps(),
      url: getPageUrl(),
      component: 'TestComponent',
      version: '1',
    }),

    Link: ({
      href,
      children,
      as,
      ...props
    }: {
      href: string;
      children?: React.ReactNode;
      as?: string;
      prefetch?: boolean | string;
      [key: string]: unknown;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { prefetch: _prefetch, ...domProps } = props;
      const Tag = as === 'button' ? 'button' : 'a';

      return React.createElement(
        Tag,
        { href: as === 'button' ? undefined : href, 'data-href': href, ...domProps },
        children,
      );
    },

    Form: ({
      children,
      className,
      ..._props
    }: {
      children?: React.ReactNode | ((slotProps: Record<string, unknown>) => React.ReactNode);
      className?: string;
      [key: string]: unknown;
    }) => {
      const slotProps = {
        processing: false,
        errors: {},
        recentlySuccessful: false,
        reset: vi.fn(),
        clearErrors: vi.fn(),
        setError: vi.fn(),
        data: {},
        setData: vi.fn(),
        transform: vi.fn(),
        submit: vi.fn(),
      };

      return React.createElement(
        'form',
        {
          className,
          'data-testid': 'inertia-form',
          onSubmit: (e: React.FormEvent) => {
            e.preventDefault();
            if (typeof _props.onSuccess === 'function') {
              _props.onSuccess();
            }
          },
        },
        typeof children === 'function' ? children(slotProps) : children,
      );
    },

    Head: (_props: { children?: React.ReactNode }) => null,

    router: mockRouter,
  };
});

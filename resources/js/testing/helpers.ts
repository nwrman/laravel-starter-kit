import type { User } from '@/types';

/**
 * Default page props returned by the mocked usePage() hook.
 * Tests can override these via setPageProps().
 */
let currentPageProps: Record<string, unknown> = {};

/**
 * Override usePage().props for the current test.
 * Merges with defaults (auth.user is always present unless explicitly overridden).
 */
export function setPageProps(overrides: Record<string, unknown>): void {
  currentPageProps = overrides;
}

/**
 * Reset usePage().props to defaults. Called in afterEach().
 */
export function resetPageProps(): void {
  currentPageProps = {};
}

/**
 * Returns the current merged page props.
 * Used internally by the Inertia mock.
 */
export function getPageProps(): Record<string, unknown> {
  return {
    auth: { user: createUser() },
    sidebarOpen: true,
    ...currentPageProps,
  };
}

let currentPageUrl = '/';

export function setPageUrl(url: string): void {
  currentPageUrl = url;
}

export function resetPageUrl(): void {
  currentPageUrl = '/';
}

export function getPageUrl(): string {
  return currentPageUrl;
}

/**
 * Factory for creating typed User objects with sensible defaults.
 */
export function createUser(overrides?: Partial<User>): User {
  return {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    avatar: undefined,
    email_verified_at: '2026-01-01T00:00:00.000000Z',
    two_factor_enabled: false,
    created_at: '2026-01-01T00:00:00.000000Z',
    updated_at: '2026-01-01T00:00:00.000000Z',
    ...overrides,
  };
}

/**
 * Factory for creating typed NavItem objects.
 */
export function createNavItem(overrides?: Record<string, unknown>) {
  return {
    title: 'Test Item',
    href: '/test',
    icon: undefined,
    ...overrides,
  };
}

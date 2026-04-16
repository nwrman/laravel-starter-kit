import { vi } from 'vitest';

/**
 * Creates a mock route helper function that mimics Wayfinder's RouteDefinition pattern.
 * Each route helper is callable (returns { url, method }) and has .url(), .form(), .definition properties.
 */
function createRouteHelper(url: string, method: string = 'get') {
  return Object.assign(
    vi.fn(() => ({
      url,
      method,
    })),
    {
      url: vi.fn(() => url),
      form: vi.fn(() => ({
        action: url,
        method,
      })),
      definition: { url, methods: [method] },
    },
  );
}

vi.mock('@/routes', () => ({
  login: createRouteHelper('/login'),
  logout: createRouteHelper('/logout', 'post'),
  dashboard: createRouteHelper('/'),
  placeholder: vi.fn((args: { module: string; section?: string }) => ({
    url: `/${args.module}${args.section ? `/${args.section}` : ''}`,
    method: 'get',
  })),
}));

vi.mock('@/routes/members', () => ({
  memberships: createRouteHelper('/members/memberships'),
  performance: createRouteHelper('/members/performance'),
}));

vi.mock('@/routes/quotes', () => ({
  index: createRouteHelper('/quotes'),
}));

vi.mock('@/routes/invoices', () => ({
  report: createRouteHelper('/invoices/report'),
}));

vi.mock('@/routes/providers', () => ({
  report: createRouteHelper('/providers/report'),
}));

vi.mock('@/routes/expenses', () => ({
  report: createRouteHelper('/expenses/report'),
}));

vi.mock('@/routes/stickers', () => ({
  shipment: createRouteHelper('/stickers/shipment'),
}));

vi.mock('@/routes/support', () => ({
  index: createRouteHelper('/support'),
}));

vi.mock('@/routes/members/memberships', () => ({
  show: createRouteHelper('/members/memberships/1'),
}));

vi.mock('@/routes/user-profile', () => ({
  edit: createRouteHelper('/settings/profile'),
  update: createRouteHelper('/settings/profile', 'patch'),
}));

vi.mock('@/routes/two-factor', () => ({
  login: createRouteHelper('/two-factor-challenge'),
  enable: createRouteHelper('/user/two-factor-authentication', 'post'),
  confirm: createRouteHelper('/user/confirmed-two-factor-authentication', 'post'),
  disable: createRouteHelper('/user/two-factor-authentication', 'delete'),
  qrCode: createRouteHelper('/user/two-factor-qr-code'),
  secretKey: createRouteHelper('/user/two-factor-secret-key'),
  recoveryCodes: createRouteHelper('/user/two-factor-recovery-codes'),
  regenerateRecoveryCodes: createRouteHelper('/user/two-factor-recovery-codes', 'post'),
  show: createRouteHelper('/settings/two-factor'),
}));

vi.mock('@/routes/verification', () => ({
  send: createRouteHelper('/email/verification-notification', 'post'),
}));

vi.mock('@/routes/password', () => ({
  email: createRouteHelper('/forgot-password', 'post'),
  request: createRouteHelper('/forgot-password'),
  update: createRouteHelper('/reset-password', 'post'),
  edit: createRouteHelper('/settings/password'),
}));

vi.mock('@/routes/password/confirm', () => ({
  store: createRouteHelper('/user/confirm-password', 'post'),
}));

vi.mock('@/routes/login', () => ({
  store: createRouteHelper('/login', 'post'),
}));

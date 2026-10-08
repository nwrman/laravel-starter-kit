import { render, screen } from '@testing-library/react';
import DefaultLayout from './default-layout';

const pageProps = vi.hoisted(() => ({ auth: { user: null as { name: string } | null } }));

vi.mock('@inertiajs/react', () => ({
  usePage: () => ({ props: pageProps }),
}));

vi.mock('@/layouts/app-layout', () => ({
  default: ({ children, breadcrumbs }: { children: React.ReactNode; breadcrumbs?: unknown[] }) => (
    <div data-testid="app-shell" data-breadcrumbs={breadcrumbs?.length ?? 0}>
      {children}
    </div>
  ),
}));

describe('DefaultLayout', () => {
  it('renders a guest the bare page, outside the authenticated shell', () => {
    pageProps.auth.user = null;

    render(<DefaultLayout>Page body</DefaultLayout>);

    expect(screen.queryByTestId('app-shell')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Page body');
  });

  it('renders a signed-in user the page inside the shell, passing layout props through', () => {
    pageProps.auth.user = { name: 'Ada' };

    render(
      <DefaultLayout breadcrumbs={[{ title: 'Inicio', href: '/dashboard' }]}>
        Page body
      </DefaultLayout>,
    );

    expect(screen.getByTestId('app-shell')).toHaveTextContent('Page body');
    expect(screen.getByTestId('app-shell')).toHaveAttribute('data-breadcrumbs', '1');
  });
});

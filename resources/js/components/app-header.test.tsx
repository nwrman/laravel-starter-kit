import { render, screen } from '@testing-library/react';
import { AppHeader } from './app-header';

describe('AppHeader', () => {
  it('renders the brand logo', () => {
    render(<AppHeader />);

    expect(screen.getByText('Laravel')).toBeInTheDocument();
  });

  it('renders the Inicio nav item', () => {
    render(<AppHeader />);

    expect(screen.getAllByText('Inicio').length).toBeGreaterThan(0);
  });

  it('renders the user avatar trigger', () => {
    render(<AppHeader />);

    expect(document.querySelector('[data-test="user-menu-trigger"]')).toBeInTheDocument();
  });

  it('does not render breadcrumbs when only one item', () => {
    const { container } = render(<AppHeader breadcrumbs={[{ title: 'Home', href: '/' }]} />);

    // Breadcrumb bar only renders when > 1 item
    const breadcrumbBars = container.querySelectorAll('.border-sidebar-border\\/70');
    expect(breadcrumbBars).toHaveLength(0);
  });

  it('renders breadcrumbs when more than one item', () => {
    render(
      <AppHeader
        breadcrumbs={[
          { title: 'Home', href: '/' },
          { title: 'Settings', href: '/settings' },
        ]}
      />,
    );

    expect(screen.getByText('Settings')).toBeInTheDocument();
  });
});

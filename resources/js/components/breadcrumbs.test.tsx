import { render, screen } from '@testing-library/react';
import { Breadcrumbs } from './breadcrumbs';

describe('Breadcrumbs', () => {
  it('renders nothing for an empty array', () => {
    const { container } = render(<Breadcrumbs breadcrumbs={[]} />);

    expect(container.querySelector('nav')).toBeNull();
  });

  it('renders a single item as the current page', () => {
    render(<Breadcrumbs breadcrumbs={[{ title: 'Home', href: '/' }]} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders multiple items with links and separators', () => {
    render(
      <Breadcrumbs
        breadcrumbs={[
          { title: 'Home', href: '/' },
          { title: 'Settings', href: '/settings' },
          { title: 'Profile', href: '/settings/profile' },
        ]}
      />,
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });
});

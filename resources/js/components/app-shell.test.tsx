import { render, screen } from '@testing-library/react';
import { AppShell } from './app-shell';

describe('AppShell', () => {
  it('renders children in a div for header variant', () => {
    render(<AppShell variant="header">Header content</AppShell>);

    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('renders children for sidebar variant', () => {
    render(<AppShell variant="sidebar">Sidebar content</AppShell>);

    expect(screen.getByText('Sidebar content')).toBeInTheDocument();
  });

  it('defaults to sidebar variant', () => {
    render(<AppShell>Default</AppShell>);

    expect(screen.getByText('Default')).toBeInTheDocument();
  });
});

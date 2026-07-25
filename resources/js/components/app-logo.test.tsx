import { render, screen } from '@testing-library/react';
import { setPageProps } from '@/testing/helpers';
import AppLogo from './app-logo';

describe('AppLogo', () => {
  it('renders the app name from shared page props', () => {
    render(<AppLogo />);

    expect(screen.getByText('Laravel')).toBeInTheDocument();
  });

  it('renders a custom app name', () => {
    setPageProps({ name: 'Acme App' });

    render(<AppLogo />);

    expect(screen.getByText('Acme App')).toBeInTheDocument();
  });
});

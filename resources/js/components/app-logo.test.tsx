import { render, screen } from '@testing-library/react';
import AppLogo from './app-logo';

describe('AppLogo', () => {
  it('renders the brand name', () => {
    render(<AppLogo />);

    expect(screen.getByText('Laravel')).toBeInTheDocument();
  });
});

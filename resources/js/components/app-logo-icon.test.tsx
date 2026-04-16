import { render } from '@testing-library/react';
import AppLogoIcon from './app-logo-icon';

describe('AppLogoIcon', () => {
  it('renders an SVG element', () => {
    const { container } = render(<AppLogoIcon />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<AppLogoIcon className="h-10 w-auto" />);

    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('h-10');
  });
});

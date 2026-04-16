import { render, screen } from '@testing-library/react';
import TextLink from './text-link';

describe('TextLink', () => {
  it('renders a link with the correct href', () => {
    render(<TextLink href="/settings">Settings</TextLink>);

    const link = screen.getByText('Settings');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/settings');
  });

  it('renders children content', () => {
    render(<TextLink href="/test">Click me</TextLink>);

    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies underline styling classes', () => {
    render(<TextLink href="/test">Link</TextLink>);

    const link = screen.getByText('Link');
    expect(link.className).toContain('underline');
  });

  it('merges custom className', () => {
    render(
      <TextLink href="/test" className="font-bold">
        Bold Link
      </TextLink>,
    );

    const link = screen.getByText('Bold Link');
    expect(link.className).toContain('font-bold');
  });
});

import { render, screen } from '@testing-library/react';
import Heading from './heading';

describe('Heading', () => {
  it('renders the title in an h2', () => {
    render(<Heading title="Page Title" />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Page Title');
  });

  it('renders the description when provided', () => {
    render(<Heading title="Title" description="A description" />);

    expect(screen.getByText('A description')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<Heading title="Title" />);

    expect(container.querySelector('p')).toBeNull();
  });

  it('applies small variant classes', () => {
    render(<Heading title="Small" variant="small" />);

    const heading = screen.getByRole('heading');
    expect(heading.className).toContain('text-base');
  });

  it('applies default variant classes', () => {
    render(<Heading title="Default" />);

    const heading = screen.getByRole('heading');
    expect(heading.className).toContain('text-xl');
  });
});

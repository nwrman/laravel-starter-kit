import { render, screen } from '@testing-library/react';
import InputError from './input-error';

describe('InputError', () => {
  it('renders nothing when no message is provided', () => {
    const { container } = render(<InputError />);

    expect(container.firstChild).toBeNull();
  });

  it('renders a paragraph with the error message', () => {
    render(<InputError message="This field is required." />);

    expect(screen.getByText('This field is required.')).toBeInTheDocument();
  });

  it('merges custom className', () => {
    render(<InputError message="Error" className="custom-class" />);

    const element = screen.getByText('Error');
    expect(element.className).toContain('custom-class');
    expect(element.className).toContain('text-red-600');
  });
});

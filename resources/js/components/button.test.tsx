import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('disables the button when processing is true', () => {
    render(<Button processing>Save</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows a spinner when processing is true', () => {
    render(<Button processing>Save</Button>);

    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('hides children visually when processing is true', () => {
    const { container } = render(<Button processing>Save</Button>);

    const hiddenSpan = container.querySelector('span.opacity-0');
    expect(hiddenSpan).toBeInTheDocument();
    expect(hiddenSpan).toHaveTextContent('Save');
  });

  it('does not show spinner when processing is false', () => {
    render(<Button>Save</Button>);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('passes through disabled prop when not processing', () => {
    render(<Button disabled>Save</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is not disabled when neither processing nor disabled', () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('is disabled when both processing and disabled are true', () => {
    render(
      <Button processing disabled>
        Save
      </Button>,
    );

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });
});

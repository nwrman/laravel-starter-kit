import { render, screen } from '@testing-library/react';
import AlertError from './alert-error';

describe('AlertError', () => {
  it('renders all error messages', () => {
    render(<AlertError errors={['Error one', 'Error two']} />);

    expect(screen.getByText('Error one')).toBeInTheDocument();
    expect(screen.getByText('Error two')).toBeInTheDocument();
  });

  it('deduplicates error messages', () => {
    render(<AlertError errors={['Same error', 'Same error', 'Different']} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
  });

  it('uses the provided title', () => {
    render(<AlertError errors={['test']} title="Custom Title" />);

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('falls back to default title when no title provided', () => {
    render(<AlertError errors={['test']} />);

    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });
});

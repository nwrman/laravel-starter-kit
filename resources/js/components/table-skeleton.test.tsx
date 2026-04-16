import { render } from '@testing-library/react';
import { TableSkeleton } from './table-skeleton';

describe('TableSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<TableSkeleton />);

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders custom number of rows', () => {
    const { container } = render(<TableSkeleton rows={3} />);

    // Header row (border-b) + 3 data rows + parent container = 5 elements with flex gap-4
    const flexRows = container.querySelectorAll('.flex.gap-4');
    expect(flexRows.length).toBe(4);
  });
});

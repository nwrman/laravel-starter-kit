import { render } from '@testing-library/react';
import { StatCardSkeleton } from './stat-card-skeleton';

describe('StatCardSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<StatCardSkeleton />);

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});

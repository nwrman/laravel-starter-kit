import { render } from '@testing-library/react';
import { ChartSkeleton } from './chart-skeleton';

describe('ChartSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<ChartSkeleton />);

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});

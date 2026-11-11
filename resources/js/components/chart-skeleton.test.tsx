import { render } from '@testing-library/react';
import { ChartBodySkeleton, ChartRingSkeleton } from './chart-skeleton';

describe('ChartBodySkeleton', () => {
  it('fills the plot area it is given and stays out of the accessibility tree', () => {
    const { container } = render(<ChartBodySkeleton className="h-[300px]" />);

    expect(container.firstChild).toHaveClass('h-[300px]');
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('ChartRingSkeleton', () => {
  it('draws one legend line per category, so the card is already its loaded height', () => {
    const { container } = render(<ChartRingSkeleton legendItems={6} />);

    expect(container.querySelectorAll('[data-test="ring-legend-item"]')).toHaveLength(6);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});

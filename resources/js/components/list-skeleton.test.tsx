import { render } from '@testing-library/react';
import { ListSkeleton } from './list-skeleton';

describe('ListSkeleton', () => {
  it('draws as many lines as the list will hold, hidden from assistive tech', () => {
    const { container } = render(<ListSkeleton rows={5} />);

    expect(container.firstChild?.childNodes).toHaveLength(5);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});

import { render, screen } from '@testing-library/react';
import { createUser } from '@/testing/helpers';
import { UserInfo } from './user-info';

describe('UserInfo', () => {
  it('renders the user name', () => {
    const user = createUser({ name: 'Jonathan' });
    render(<UserInfo user={user} />);

    expect(screen.getByText('Jonathan')).toBeInTheDocument();
  });

  it('does not render email by default', () => {
    const user = createUser({ email: 'test@example.com' });
    render(<UserInfo user={user} />);

    expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
  });

  it('renders email when showEmail is true', () => {
    const user = createUser({ email: 'test@example.com' });
    render(<UserInfo user={user} showEmail={true} />);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('renders avatar fallback with initials', () => {
    const user = createUser({ name: 'Jonathan Fernández' });
    render(<UserInfo user={user} />);

    expect(screen.getByText('JF')).toBeInTheDocument();
  });
});

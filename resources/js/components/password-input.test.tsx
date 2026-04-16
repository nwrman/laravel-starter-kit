import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordInput from './password-input';

describe('PasswordInput', () => {
  it('renders as a password input by default', () => {
    render(<PasswordInput />);

    const input = document.querySelector('input');
    expect(input?.type).toBe('password');
  });

  it('toggles to text input when visibility button is clicked', async () => {
    const user = userEvent.setup();
    render(<PasswordInput />);

    const toggleButton = screen.getByRole('button', { name: 'Show password' });
    await user.click(toggleButton);

    expect(document.querySelector('input')?.type).toBe('text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();
  });

  it('toggles back to password when clicked again', async () => {
    const user = userEvent.setup();
    render(<PasswordInput />);

    const toggleButton = screen.getByRole('button', { name: 'Show password' });
    await user.click(toggleButton);
    await user.click(screen.getByRole('button', { name: 'Hide password' }));

    expect(document.querySelector('input')?.type).toBe('password');
  });

  it('passes extra props to the input', () => {
    render(<PasswordInput placeholder="Enter password" id="pw" />);

    expect(document.querySelector('input')?.placeholder).toBe('Enter password');
    expect(document.querySelector('input')?.id).toBe('pw');
  });
});

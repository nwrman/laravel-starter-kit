import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TwoFactorRecoveryCodes from './two-factor-recovery-codes';

const defaultProps = {
  recoveryCodesList: ['CODE-001', 'CODE-002', 'CODE-003'],
  fetchRecoveryCodes: vi.fn().mockResolvedValue(undefined),
  errors: [],
};

describe('TwoFactorRecoveryCodes', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('renders the card title', () => {
    render(<TwoFactorRecoveryCodes {...defaultProps} />);

    expect(screen.getByText('Códigos de recuperación 2FA')).toBeInTheDocument();
  });

  it('renders toggle button to show codes', () => {
    render(<TwoFactorRecoveryCodes {...defaultProps} />);

    expect(screen.getByText(/Ver.*códigos de recuperación/)).toBeInTheDocument();
  });

  it('shows codes when toggle is clicked', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup();
    render(<TwoFactorRecoveryCodes {...defaultProps} />);

    await user.click(screen.getByText(/Ver.*códigos de recuperación/));

    expect(screen.getByText('CODE-001')).toBeInTheDocument();
    expect(screen.getByText('CODE-002')).toBeInTheDocument();
  });

  it('hides codes when toggle is clicked again', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup();
    render(<TwoFactorRecoveryCodes {...defaultProps} />);

    await user.click(screen.getByText(/Ver.*códigos de recuperación/));
    await user.click(screen.getByText(/Ocultar.*códigos de recuperación/));

    expect(screen.getByText(/Ver.*códigos de recuperación/)).toBeInTheDocument();
  });

  it('shows regenerate button when codes are visible', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup();
    render(<TwoFactorRecoveryCodes {...defaultProps} />);

    await user.click(screen.getByText(/Ver.*códigos de recuperación/));

    expect(screen.getByRole('button', { name: /Regenerar códigos/ })).toBeInTheDocument();
  });

  it('renders errors when present', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup();
    render(
      <TwoFactorRecoveryCodes {...defaultProps} errors={['Failed to fetch recovery codes']} />,
    );

    await user.click(screen.getByText(/Ver.*códigos de recuperación/));

    expect(screen.getByText('Failed to fetch recovery codes')).toBeInTheDocument();
  });

  it('fetches recovery codes on mount if list is empty', () => {
    render(<TwoFactorRecoveryCodes {...defaultProps} recoveryCodesList={[]} />);

    expect(defaultProps.fetchRecoveryCodes).toHaveBeenCalled();
  });

  it('fetches recovery codes again when clicking Ver if list is still empty', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchRecoveryCodesMock = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <TwoFactorRecoveryCodes
        {...defaultProps}
        recoveryCodesList={[]}
        fetchRecoveryCodes={fetchRecoveryCodesMock}
      />,
    );

    // useEffect fires fetch once on mount
    expect(fetchRecoveryCodesMock).toHaveBeenCalledTimes(1);

    // Simulate user clicking Ver immediately or when the list is still empty
    await user.click(screen.getByText(/Ver.*códigos de recuperación/));

    // It should have been called again by toggleCodesVisibility
    expect(fetchRecoveryCodesMock).toHaveBeenCalledTimes(2);
  });
});

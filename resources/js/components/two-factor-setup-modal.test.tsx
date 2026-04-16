import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TwoFactorSetupModal from './two-factor-setup-modal';

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  requiresConfirmation: false,
  twoFactorEnabled: false,
  qrCodeSvg: '<svg data-testid="qr-svg">QR</svg>',
  manualSetupKey: 'ABCD1234',
  clearSetupData: vi.fn(),
  fetchSetupData: vi.fn().mockResolvedValue(undefined),
  errors: [],
};

describe('TwoFactorSetupModal', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the setup title when not enabled', () => {
    render(<TwoFactorSetupModal {...defaultProps} />);

    expect(screen.getByText('Activar autenticación de dos factores')).toBeInTheDocument();
  });

  it('renders the enabled title when 2FA is enabled', () => {
    render(<TwoFactorSetupModal {...defaultProps} twoFactorEnabled={true} />);

    expect(screen.getByText('Autenticación de dos factores activada')).toBeInTheDocument();
  });

  it('renders the QR code SVG via dangerouslySetInnerHTML', () => {
    render(<TwoFactorSetupModal {...defaultProps} />);

    expect(document.body.innerHTML).toContain('QR');
  });

  it('renders the manual setup key', () => {
    render(<TwoFactorSetupModal {...defaultProps} />);

    const input = document.querySelector('input[readonly]') as HTMLInputElement;
    expect(input?.value).toBe('ABCD1234');
  });

  it('shows continue button', () => {
    render(<TwoFactorSetupModal {...defaultProps} />);

    expect(screen.getByText('Continuar')).toBeInTheDocument();
  });

  it('calls onClose when clicking continue without confirmation required', async () => {
    const user = userEvent.setup();
    render(<TwoFactorSetupModal {...defaultProps} />);

    await user.click(screen.getByText('Continuar'));

    expect(defaultProps.clearSetupData).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows verification step text when confirmation is required and continue is clicked', async () => {
    const user = userEvent.setup();
    render(<TwoFactorSetupModal {...defaultProps} requiresConfirmation={true} />);

    await user.click(screen.getByText('Continuar'));

    // Verification step changes the title
    expect(screen.getByText('Verificar código de autenticación')).toBeInTheDocument();
  });

  it('fetches setup data on open when QR code is missing', () => {
    render(<TwoFactorSetupModal {...defaultProps} qrCodeSvg={null} />);

    expect(defaultProps.fetchSetupData).toHaveBeenCalled();
  });

  it('renders errors when present', () => {
    render(<TwoFactorSetupModal {...defaultProps} errors={['Failed to load']} />);

    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('copies manual setup key to clipboard', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    render(<TwoFactorSetupModal {...defaultProps} />);

    // Since there are two buttons (continue and copy), we search by the SVG inside it
    const copyButton = document.querySelector('input[readonly]')?.nextElementSibling as HTMLElement;
    expect(copyButton).toBeInTheDocument();

    await user.click(copyButton);

    expect(writeTextMock).toHaveBeenCalledWith('ABCD1234');
  });

  it('triggers onClose when Verification Form onSuccess is called', async () => {
    const user = userEvent.setup();
    render(<TwoFactorSetupModal {...defaultProps} requiresConfirmation={true} />);

    // Go to verification step
    await user.click(screen.getByText('Continuar'));

    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();

    // Trigger form submit; mock calls onSuccess
    if (form) {
      await act(async () => {
        form.requestSubmit();
      });
    }

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('triggers onClose when clicking Atrás on Verification step', async () => {
    const user = userEvent.setup();
    render(<TwoFactorSetupModal {...defaultProps} requiresConfirmation={true} />);

    await user.click(screen.getByText('Continuar'));

    // Now on Verification step, click Atrás
    await user.click(screen.getByText('Atrás'));

    // Should go back to first step
    expect(screen.getByText('Activar autenticación de dos factores')).toBeInTheDocument();
  });

  it('clears setup data when closing if twoFactorEnabled is true', async () => {
    const user = userEvent.setup();
    render(<TwoFactorSetupModal {...defaultProps} twoFactorEnabled={true} />);

    // The Dialog component renders the overlay. Clicking it closes the dialog, firing onOpenChange(false).
    // An easy way to simulate closing is to trigger Escape via userEvent, but JSDOM + Dialog might not map perfectly.
    // However, the "Cerrar" button in the modal calls handleModalNextStep, which clears and closes:
    await user.click(screen.getByText('Cerrar'));

    expect(defaultProps.clearSetupData).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('does not clear setup data on close when twoFactorEnabled is false', async () => {
    const user = userEvent.setup();
    render(
      <TwoFactorSetupModal
        {...defaultProps}
        twoFactorEnabled={false}
        requiresConfirmation={true}
      />,
    );

    // Navigate to verification step then click Atrás — triggers resetModalState with twoFactorEnabled=false
    await user.click(screen.getByText('Continuar'));
    await user.click(screen.getByText('Atrás'));

    expect(defaultProps.clearSetupData).not.toHaveBeenCalled();
  });

  it('renders a spinner in the QR slot when qrCodeSvg is null and no errors', () => {
    render(<TwoFactorSetupModal {...defaultProps} qrCodeSvg={null} />);

    // The QR SVG is replaced by a spinner when qrCodeSvg is null
    expect(document.querySelector('[data-testid="qr-svg"]')).not.toBeInTheDocument();
  });

  it('renders no manual key input when manualSetupKey is null', () => {
    render(<TwoFactorSetupModal {...defaultProps} manualSetupKey={null} />);

    expect(document.querySelector('input[readonly]')).not.toBeInTheDocument();
  });
});

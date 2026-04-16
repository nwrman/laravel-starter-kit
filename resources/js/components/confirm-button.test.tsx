import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmButton } from './confirm-button';

describe('ConfirmButton', () => {
  it('renders as a regular button', () => {
    render(
      <ConfirmButton title="¿Eliminar?" onClick={vi.fn()}>
        Eliminar
      </ConfirmButton>,
    );

    expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument();
  });

  it('shows confirmation dialog on click instead of calling onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <ConfirmButton title="¿Eliminar foto?" description="No se puede deshacer." onClick={onClick}>
        Eliminar
      </ConfirmButton>,
    );

    await user.click(screen.getByRole('button', { name: /eliminar/i }));

    expect(screen.getByText('¿Eliminar foto?')).toBeInTheDocument();
    expect(screen.getByText('No se puede deshacer.')).toBeInTheDocument();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('calls onClick after confirmation is accepted', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <ConfirmButton title="¿Eliminar?" onClick={onClick} confirmLabel="Sí, eliminar">
        Eliminar
      </ConfirmButton>,
    );

    await user.click(screen.getByRole('button', { name: /^eliminar$/i }));
    await user.click(screen.getByRole('button', { name: /sí, eliminar/i }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <ConfirmButton title="¿Eliminar?" onClick={onClick}>
        Eliminar
      </ConfirmButton>,
    );

    await user.click(screen.getByRole('button', { name: /^eliminar$/i }));
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('uses default labels for confirm and cancel buttons', async () => {
    const user = userEvent.setup();

    render(
      <ConfirmButton title="¿Eliminar?" onClick={vi.fn()}>
        Eliminar
      </ConfirmButton>,
    );

    await user.click(screen.getByRole('button', { name: /^eliminar$/i }));

    expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('forwards button props like variant and size', () => {
    render(
      <ConfirmButton
        title="¿Eliminar?"
        onClick={vi.fn()}
        variant="ghost"
        size="sm"
        data-testid="my-btn"
      >
        Eliminar
      </ConfirmButton>,
    );

    expect(screen.getByTestId('my-btn')).toBeInTheDocument();
  });

  it('shows loading spinner on confirm button while onClick promise is pending', async () => {
    const user = userEvent.setup();
    let resolveClick: () => void;
    const onClick = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveClick = resolve;
        }),
    );

    render(
      <ConfirmButton title="¿Eliminar?" onClick={onClick} confirmLabel="Eliminar">
        Eliminar
      </ConfirmButton>,
    );

    // Open dialog and click confirm
    await user.click(screen.getByRole('button', { name: /^eliminar$/i }));
    const confirmBtn = screen.getByRole('button', { name: /^eliminar$/i });
    await user.click(confirmBtn);

    // Confirm button should show loading state
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();

    // Cancel button should be disabled while processing
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();

    // Resolve the promise
    await act(async () => {
      resolveClick!();
    });

    // Loading state should be gone
    expect(screen.queryByRole('status', { name: /loading/i })).not.toBeInTheDocument();
  });
});

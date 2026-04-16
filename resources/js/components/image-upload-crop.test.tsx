import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageUploadCrop } from './image-upload-crop';

function createTestFile(name = 'test.jpg'): File {
  return new File(['pixels'], name, { type: 'image/jpeg' });
}

describe('ImageUploadCrop', () => {
  it('renders empty state with "Subir foto" and no "Eliminar" or "Deshacer"', () => {
    render(<ImageUploadCrop onChange={vi.fn()} />);

    expect(screen.getAllByRole('button', { name: /subir foto/i })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /deshacer/i })).not.toBeInTheDocument();
  });

  it('shows "Cambiar foto" and "Eliminar" when imageUrl is provided, no "Deshacer"', () => {
    render(
      <ImageUploadCrop
        imageUrl="https://example.com/photo.webp"
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /cambiar foto/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /deshacer/i })).not.toBeInTheDocument();
  });

  it('hides "Eliminar" after a file is cropped and applied', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ImageUploadCrop
        imageUrl="https://example.com/photo.webp"
        onChange={onChange}
        onRemove={vi.fn()}
      />,
    );

    // Select a file — crop dialog opens
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, createTestFile());

    // Use original to skip crop (applies the file)
    const useOriginalBtn = screen.getByRole('button', { name: /usar original/i });
    await user.click(useOriginalBtn);

    // Now selectedFile is set — "Eliminar" should be hidden, "Deshacer" visible
    expect(screen.queryByRole('button', { name: /^eliminar$/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /deshacer/i })).toBeInTheDocument();
  });

  it('resets local state when imageUrl changes after upload is saved', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<ImageUploadCrop imageUrl={null} onChange={onChange} />);

    // Select and apply a file — "Deshacer" appears
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, createTestFile());
    await user.click(screen.getByRole('button', { name: /usar original/i }));

    expect(screen.getByRole('button', { name: /deshacer/i })).toBeInTheDocument();

    // Simulate Inertia redirect: imageUrl changes from null to a URL
    rerender(<ImageUploadCrop imageUrl="https://example.com/new-photo.webp" onChange={onChange} />);

    // Local state should reset — "Deshacer" disappears, "Cambiar foto" shows
    expect(screen.queryByRole('button', { name: /deshacer/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cambiar foto/i })).toBeInTheDocument();
  });

  it('resets local state when imageUrl changes after photo is deleted', () => {
    const onRemove = vi.fn();
    const { rerender } = render(
      <ImageUploadCrop
        imageUrl="https://example.com/photo.webp"
        onChange={vi.fn()}
        onRemove={onRemove}
      />,
    );

    // Verify "Eliminar" is there but "Deshacer" is not
    expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /deshacer/i })).not.toBeInTheDocument();

    // Simulate Inertia redirect after delete: imageUrl changes from URL to null
    rerender(<ImageUploadCrop imageUrl={null} onChange={vi.fn()} onRemove={onRemove} />);

    // Should show empty state — "Subir foto", no "Deshacer"
    expect(screen.getAllByRole('button', { name: /subir foto/i })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /deshacer/i })).not.toBeInTheDocument();
  });

  it('shows confirmation dialog when "Eliminar" is clicked, onRemove not called yet', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <ImageUploadCrop
        imageUrl="https://example.com/photo.webp"
        onChange={vi.fn()}
        onRemove={onRemove}
      />,
    );

    await user.click(screen.getByRole('button', { name: /eliminar/i }));

    // Confirmation dialog should appear
    expect(screen.getByText(/¿eliminar foto/i)).toBeInTheDocument();
    // onRemove should NOT have been called yet
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('calls onRemove after confirmation is accepted', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <ImageUploadCrop
        imageUrl="https://example.com/photo.webp"
        onChange={vi.fn()}
        onRemove={onRemove}
      />,
    );

    // Open confirmation dialog
    await user.click(screen.getByRole('button', { name: /eliminar/i }));

    // Click the destructive "Eliminar" button inside the dialog
    const confirmBtn = screen.getByRole('button', { name: /^eliminar$/i });
    await user.click(confirmBtn);

    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('does not call onRemove when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <ImageUploadCrop
        imageUrl="https://example.com/photo.webp"
        onChange={vi.fn()}
        onRemove={onRemove}
      />,
    );

    // Open confirmation dialog
    await user.click(screen.getByRole('button', { name: /eliminar/i }));

    // Click "Cancelar"
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onRemove).not.toHaveBeenCalled();
    // Image should still be shown
    expect(screen.getByRole('button', { name: /cambiar foto/i })).toBeInTheDocument();
  });

  it('calls onChange when a file is selected and applied', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ImageUploadCrop onChange={onChange} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, createTestFile());

    // Use original to skip crop
    await user.click(screen.getByRole('button', { name: /usar original/i }));

    expect(onChange).toHaveBeenCalledWith(expect.any(File));
  });
});

import { CameraIcon, CropIcon, RotateCcwIcon, Trash2Icon, UndoIcon } from 'lucide-react';
import {
  type CSSProperties,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type PercentCrop,
  type PixelCrop,
} from 'react-image-crop';
import { ConfirmButton } from '@/components/confirm-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import 'react-image-crop/dist/ReactCrop.css';

// ---------------------------------------------------------------------------
// Crop helpers (adapted from kibo-ui/image-crop)
// ---------------------------------------------------------------------------

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): PercentCrop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

function getCroppedBlob(imageSrc: HTMLImageElement, pixelCrop: PixelCrop): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context is null'));
      return;
    }

    const scaleX = imageSrc.naturalWidth / imageSrc.width;
    const scaleY = imageSrc.naturalHeight / imageSrc.height;

    canvas.width = pixelCrop.width * scaleX;
    canvas.height = pixelCrop.height * scaleY;

    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      imageSrc,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob returned null'));
        }
      },
      'image/jpeg',
      0.9,
    );
  });
}

// ---------------------------------------------------------------------------
// ImageUploadCrop component
// ---------------------------------------------------------------------------

interface ImageUploadCropProps {
  /** Current image URL from the server */
  imageUrl?: string | null;
  /** Callback with the cropped/selected file, or null when cleared */
  onChange: (file: File | null) => void;
  /** Callback to mark the server image for deletion. May return a Promise to show loading. */
  onRemove?: () => void | Promise<void>;
  /** Aspect ratio for crop (default: 1 = square) */
  aspectRatio?: number;
  /** Render the preview as a circle (default: false) */
  circularCrop?: boolean;
  /** Validation error string */
  error?: string;
  /** Field label */
  label?: string;
  /** Fallback name for initials when no image */
  fallbackName?: string;
}

export function ImageUploadCrop({
  imageUrl,
  onChange,
  onRemove,
  aspectRatio = 1,
  circularCrop = false,
  error,
  label = 'Foto',
  fallbackName = '',
}: ImageUploadCropProps) {
  const getInitials = useInitials();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // The file the user just selected (before or after crop)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // Preview URL for the selected file (blob URL)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Crop dialog state
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [fileToCrop, setFileToCrop] = useState<File | null>(null);
  const [cropImgSrc, setCropImgSrc] = useState('');
  const [crop, setCrop] = useState<PercentCrop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const cropImgRef = useRef<HTMLImageElement | null>(null);

  // The URL to display: local preview > server URL > nothing
  const displayUrl = previewUrl ?? imageUrl ?? null;

  // Reset local state when the server-provided imageUrl changes (e.g. after
  // an Inertia redirect following a successful upload or delete). This keeps
  // the component in sync with server reality.
  const prevImageUrlRef = useRef(imageUrl);
  useEffect(() => {
    if (prevImageUrlRef.current === imageUrl) return;
    prevImageUrlRef.current = imageUrl;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileToCrop(null);
    setCropDialogOpen(false);
  }, [imageUrl]); // eslint-disable-line react-hooks/exhaustive-deps -- intentionally only reacts to imageUrl

  // Cleanup blob URLs on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Read file for crop dialog
  useEffect(() => {
    if (!fileToCrop) {
      setCropImgSrc('');
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => setCropImgSrc((reader.result as string) ?? ''));
    reader.readAsDataURL(fileToCrop);
  }, [fileToCrop]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-selected
    e.target.value = '';

    // Open crop dialog
    setFileToCrop(file);
    setCrop(undefined);
    setCompletedCrop(null);
    setCropDialogOpen(true);
  };

  const onCropImageLoad = useCallback(
    (e: SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspectRatio));
    },
    [aspectRatio],
  );

  const applyCrop = async () => {
    if (!cropImgRef.current || !completedCrop) return;

    const blob = await getCroppedBlob(cropImgRef.current, completedCrop);
    const fileName = fileToCrop?.name ?? 'avatar.jpg';
    const croppedFile = new File([blob], fileName, { type: 'image/jpeg' });

    applyFile(croppedFile);
    setCropDialogOpen(false);
  };

  const useOriginal = () => {
    if (!fileToCrop) return;
    applyFile(fileToCrop);
    setCropDialogOpen(false);
  };

  const applyFile = (file: File) => {
    // Revoke previous blob URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);
    setFileToCrop(null);
    onChange(file);
  };

  const handleRemove = () => {
    return onRemove?.();
  };

  const handleUndo = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileToCrop(null);
    onChange(null);
  };

  const hasLocalChange = selectedFile !== null;
  const hasImage = displayUrl !== null;
  const hasServerImage = imageUrl != null;

  const cropStyles = {
    '--rc-border-color': 'var(--color-border)',
    '--rc-focus-color': 'var(--color-primary)',
  } as CSSProperties;

  return (
    <div className="space-y-2">
      {label && <span className="text-sm font-medium">{label}</span>}

      <div className="flex items-center gap-4">
        {/* Avatar preview */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'group relative flex shrink-0 items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-muted-foreground/50',
            circularCrop ? 'size-20 rounded-full' : 'size-20 rounded-lg',
          )}
        >
          {hasImage ? (
            <Avatar className="size-full rounded-[inherit]">
              <AvatarImage src={displayUrl} alt={label} className="object-cover" />
              <AvatarFallback className="rounded-[inherit] text-lg">
                {getInitials(fallbackName)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <CameraIcon className="size-5" />
              <span className="text-[10px] leading-tight">Subir foto</span>
            </div>
          )}

          {/* Hover overlay */}
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100',
              circularCrop ? 'rounded-full' : 'rounded-lg',
            )}
          >
            <CameraIcon className="size-5 text-white" />
          </div>
        </button>

        {/* Action buttons */}
        <div className="flex flex-col gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            {hasImage ? 'Cambiar foto' : 'Subir foto'}
          </Button>

          {hasServerImage && selectedFile === null && (
            <ConfirmButton
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              title="¿Eliminar foto de perfil?"
              description="Esta acción no se puede deshacer."
              confirmLabel="Eliminar"
              onClick={() => handleRemove()}
            >
              <Trash2Icon className="size-3.5" />
              Eliminar
            </ConfirmButton>
          )}

          {hasLocalChange && (
            <Button type="button" variant="ghost" size="sm" onClick={handleUndo}>
              <UndoIcon className="size-3.5" />
              Deshacer
            </Button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Validation error */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Crop dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Recortar imagen</DialogTitle>
            <DialogDescription>Ajusta el área de recorte y aplica los cambios.</DialogDescription>
          </DialogHeader>

          {cropImgSrc && (
            <div className="flex justify-center">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
                aspect={aspectRatio}
                circularCrop={circularCrop}
                className="max-h-[300px] max-w-full"
                style={cropStyles}
              >
                <img
                  ref={cropImgRef}
                  src={cropImgSrc}
                  alt="Recortar"
                  className="max-h-[300px]"
                  onLoad={onCropImageLoad}
                />
              </ReactCrop>
            </div>
          )}

          <DialogFooter>
            <div className="flex w-full items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (cropImgRef.current) {
                    const { width, height } = cropImgRef.current;
                    setCrop(centerAspectCrop(width, height, aspectRatio));
                    setCompletedCrop(null);
                  }
                }}
              >
                <RotateCcwIcon className="size-3.5" />
                Restablecer
              </Button>

              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={useOriginal}>
                  Usar original
                </Button>
                <DialogClose
                  render={
                    <Button type="button" size="sm" onClick={applyCrop}>
                      <CropIcon className="size-3.5" />
                      Aplicar recorte
                    </Button>
                  }
                />
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

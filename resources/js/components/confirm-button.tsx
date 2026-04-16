import { type ComponentProps, type MouseEvent, useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type ConfirmButtonProps = Omit<ComponentProps<typeof Button>, 'onClick'> & {
  /** Dialog title shown when asking for confirmation */
  title: string;
  /** Optional description below the title */
  description?: string;
  /** Label for the confirm action button (default: "Confirmar") */
  confirmLabel?: string;
  /** Label for the cancel button (default: "Cancelar") */
  cancelLabel?: string;
  /** Variant for the confirm action button (default: "destructive") */
  confirmVariant?: ComponentProps<typeof Button>['variant'];
  /** Called after confirmation. May return a Promise to show a loading spinner. */
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void | Promise<void>;
};

function ConfirmButton({
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmVariant = 'destructive',
  onClick,
  children,
  ...buttonProps
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleConfirm = async (e: MouseEvent<HTMLButtonElement>) => {
    if (!onClick) return;
    setProcessing(true);
    try {
      await Promise.resolve(onClick(e));
    } finally {
      setProcessing(false);
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !processing && setOpen(isOpen)}>
      <AlertDialogTrigger render={<Button {...buttonProps} />}>{children}</AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={processing}>{cancelLabel}</AlertDialogCancel>
          <Button
            variant={confirmVariant}
            disabled={processing}
            className="relative"
            onClick={handleConfirm}
          >
            <span
              className={cn('inline-flex items-center gap-[inherit]', processing && 'opacity-0')}
            >
              {confirmLabel}
            </span>
            {processing && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Spinner />
              </span>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { ConfirmButton };
export type { ConfirmButtonProps };

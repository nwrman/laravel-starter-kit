import { ShieldAlertIcon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface SessionExpiredModalProps {
  onConfirm: () => void;
  open: boolean;
}

export function SessionExpiredModal({ open, onConfirm }: SessionExpiredModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={() => {}}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-amber-100 dark:bg-amber-900/30">
            <ShieldAlertIcon className="text-amber-600 dark:text-amber-400" />
          </AlertDialogMedia>
          <AlertDialogTitle>Sesión expirada</AlertDialogTitle>
          <AlertDialogDescription>
            Por razones de seguridad, tu sesión ha expirado después de un periodo de inactividad.
            Por favor, inicia sesión nuevamente para continuar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-center">
          <AlertDialogAction render={<Button className="w-full" />} onClick={onConfirm}>
            Iniciar sesión
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

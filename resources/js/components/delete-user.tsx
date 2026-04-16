import { useState } from 'react';
import * as z from 'zod';
import DeleteUserController from '@/actions/App/Http/Controllers/DeleteUserController';
import { Button } from '@/components/button';
import { PasswordField } from '@/components/form-fields';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { useInertiaForm } from '@/hooks/use-inertia-form';

const deleteUserSchema = z.object({
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

function DeleteUser() {
  const [open, setOpen] = useState(false);

  const { form, processing } = useInertiaForm({
    schema: deleteUserSchema,
    defaultValues: { password: '' },
    action: DeleteUserController.delete(),
    options: {
      onError: () => {
        // Keep dialog open so user can see the error and retry
      },
    },
  });

  return (
    <Card data-testid="delete-user-card">
      <CardHeader>
        <CardTitle>Eliminar cuenta</CardTitle>
        <CardDescription>
          Elimina tu cuenta y todos tus datos de forma permanente. Esta acción no se puede deshacer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog
          open={open}
          onOpenChange={(isOpen) => {
            if (!processing) {
              setOpen(isOpen);
              if (!isOpen) {
                form.reset();
              }
            }
          }}
        >
          <AlertDialogTrigger render={<Button variant="destructive" />}>
            Eliminar cuenta
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar tu cuenta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción es permanente. Se eliminarán todos tus datos. Ingresa tu contraseña para
                confirmar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void form.handleSubmit();
              }}
            >
              <FieldGroup>
                <form.Field name="password">
                  {(field) => (
                    <PasswordField
                      field={field}
                      label="Contraseña"
                      placeholder="Contraseña"
                      autoComplete="current-password"
                      autoFocus
                    />
                  )}
                </form.Field>
              </FieldGroup>
              <AlertDialogFooter className="mt-6">
                <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
                <Button type="submit" variant="destructive" processing={processing}>
                  Eliminar cuenta
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

export { DeleteUser };

import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/button';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/password/confirm';

export default function Create() {
  return (
    <>
      <Head title="Confirmar contraseña" />

      <Form {...store.form()} resetOnSuccess={['password']}>
        {({ processing, errors }) => (
          <div className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <PasswordInput
                id="password"
                name="password"
                placeholder="Contraseña"
                autoComplete="current-password"
                autoFocus
              />

              <InputError message={errors.password} />
            </div>

            <div className="flex items-center">
              <Button
                type="submit"
                className="w-full"
                processing={processing}
                data-test="confirm-password-button"
              >
                Confirmar contraseña
              </Button>
            </div>
          </div>
        )}
      </Form>
    </>
  );
}

Create.layout = [
  AuthLayout,
  {
    title: 'Confirma tu contraseña',
    description:
      'Esta es un área segura de la aplicación. Por favor confirma tu contraseña antes de continuar.',
  },
];

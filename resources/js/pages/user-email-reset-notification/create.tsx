import { Form, Head } from '@inertiajs/react';
import { CheckCircleIcon } from 'lucide-react';
import { Button } from '@/components/button';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
  return (
    <>
      <Head title="Recuperar contraseña" />

      {status && (
        <Alert variant="default" className="mb-6">
          <CheckCircleIcon />
          <AlertDescription>{status}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <Form {...email.form()}>
          {({ processing, errors }) => (
            <>
              <div className="grid gap-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="off"
                  autoFocus
                  placeholder="name@example.com"
                />

                <InputError message={errors.email} />
              </div>

              <div className="my-6 flex items-center justify-start">
                <Button
                  type="submit"
                  className="w-full"
                  processing={processing}
                  data-test="email-password-reset-link-button"
                >
                  Enviar liga de recuperación
                </Button>
              </div>
            </>
          )}
        </Form>

        <div className="space-x-1 text-center text-sm text-muted-foreground">
          <span>O regresa a</span>
          <TextLink href={login()}>iniciar sesión</TextLink>
        </div>
      </div>
    </>
  );
}

ForgotPassword.layout = [
  AuthLayout,
  {
    title: 'Recuperar contraseña',
    description: 'Ingresa tu correo para recibir una liga de recuperación',
  },
];

import { Form, Head } from '@inertiajs/react';
import { AlertCircleIcon, CheckCircleIcon } from 'lucide-react';
import { Button } from '@/components/button';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
  status?: string;
  canResetPassword: boolean;
  sessionExpired?: boolean;
};

export default function Login({ status, canResetPassword, sessionExpired }: Props) {
  return (
    <>
      <Head title="Iniciar sesión" />

      {status && (
        <Alert variant="default" className="mb-6">
          <CheckCircleIcon />
          <AlertDescription>{status}</AlertDescription>
        </Alert>
      )}

      {sessionExpired && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircleIcon />
          <AlertDescription>
            Tu sesión ha expirado. <br /> Por favor, inicia sesión de nuevo.
          </AlertDescription>
        </Alert>
      )}

      <Form {...store.form()} resetOnSuccess={['password']} className="flex flex-col gap-6">
        {({ processing, errors }) => (
          <>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  required
                  autoFocus
                  tabIndex={1}
                  autoComplete="email"
                  placeholder="name@example.com"
                />
                <InputError message={errors.email} />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                  {canResetPassword && (
                    <TextLink href={request()} className="ml-auto text-sm" tabIndex={5}>
                      ¿Olvidaste tu contraseña?
                    </TextLink>
                  )}
                </div>
                <PasswordInput
                  id="password"
                  name="password"
                  required
                  tabIndex={2}
                  autoComplete="current-password"
                  placeholder="Contraseña"
                />
                <InputError message={errors.password} />
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox id="remember" name="remember" tabIndex={3} />
                <Label htmlFor="remember">Recordarme</Label>
              </div>

              <Button
                type="submit"
                className="mt-4 w-full"
                tabIndex={4}
                processing={processing}
                data-test="login-button"
              >
                Iniciar sesión
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              ¿No tienes una cuenta?{' '}
              <TextLink href={register()} tabIndex={6}>
                Regístrate
              </TextLink>
            </div>
          </>
        )}
      </Form>
    </>
  );
}

Login.layout = [
  AuthLayout,
  {
    title: 'Inicia sesión en tu cuenta',
    description: 'Ingresa tu correo y contraseña para iniciar sesión',
  },
];

import { Form, Head } from '@inertiajs/react';
import { CheckCircleIcon } from 'lucide-react';
import { Button } from '@/components/button';
import TextLink from '@/components/text-link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
  return (
    <>
      <Head title="Verificación de correo" />

      {status === 'verification-link-sent' && (
        <Alert variant="default" className="mb-6">
          <CheckCircleIcon />
          <AlertDescription>
            Se ha enviado una nueva liga de verificación al correo que proporcionaste durante el
            registro.
          </AlertDescription>
        </Alert>
      )}

      <Form {...send.form()} className="space-y-6 text-center">
        {({ processing }) => (
          <>
            <Button type="submit" processing={processing} variant="secondary">
              Reenviar correo de verificación
            </Button>

            <TextLink href={logout()} className="mx-auto block text-sm">
              Cerrar sesión
            </TextLink>
          </>
        )}
      </Form>
    </>
  );
}

VerifyEmail.layout = [
  AuthLayout,
  {
    title: 'Verificar correo',
    description:
      'Por favor verifica tu correo electrónico haciendo click en la liga que te enviamos.',
  },
];

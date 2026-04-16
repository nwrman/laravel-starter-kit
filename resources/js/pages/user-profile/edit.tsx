import { Head, Link, router, usePage } from '@inertiajs/react';
import { CheckCircleIcon } from 'lucide-react';
import { useRef } from 'react';
import * as z from 'zod';
import DeleteUserPhotoController from '@/actions/App/Http/Controllers/DeleteUserPhotoController';
import { update } from '@/actions/App/Http/Controllers/UserProfileController';
import { Button } from '@/components/button';
import { DeleteUser } from '@/components/delete-user';
import { TextField } from '@/components/form-fields';
import { ImageUploadCrop } from '@/components/image-upload-crop';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { useInertiaForm } from '@/hooks/use-inertia-form';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/user-profile';
import { send } from '@/routes/verification';
import type { BreadcrumbItem } from '@/types';

const profileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Ingresa un correo electrónico válido'),
});

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Configuración de perfil',
    href: edit(),
  },
];

export default function Edit({
  mustVerifyEmail,
  status,
}: {
  mustVerifyEmail: boolean;
  status?: string;
}) {
  const { auth } = usePage().props;

  const photoRef = useRef<File | null>(null);

  const { form, processing } = useInertiaForm({
    schema: profileSchema,
    defaultValues: { name: auth.user.name, email: auth.user.email },
    action: update(),
    extraData: () => {
      const extra: Record<string, unknown> = {};
      if (photoRef.current) {
        extra.photo = photoRef.current;
      }
      return extra;
    },
    options: {
      preserveScroll: true,
      onSuccess: () => {
        photoRef.current = null;
      },
    },
  });

  return (
    <>
      <Head title="Configuración de perfil" />

      <h1 className="sr-only">Configuración de perfil</h1>

      <SettingsLayout>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Información del perfil</CardTitle>
              <CardDescription>Actualiza tu nombre y correo electrónico</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <ImageUploadCrop
                imageUrl={auth.user.photo_url}
                circularCrop
                label="Foto de perfil"
                fallbackName={auth.user.name}
                onChange={(file) => {
                  photoRef.current = file;
                }}
                onRemove={() =>
                  new Promise<void>((resolve) => {
                    const route = DeleteUserPhotoController.delete();
                    router.delete(route.url, {
                      preserveScroll: true,
                      onFinish: () => resolve(),
                    });
                  })
                }
              />

              <FieldGroup>
                <form.Field name="name">
                  {(field) => (
                    <TextField
                      field={field}
                      label="Nombre"
                      autoComplete="name"
                      placeholder="Nombre completo"
                    />
                  )}
                </form.Field>

                <form.Field name="email">
                  {(field) => (
                    <TextField
                      field={field}
                      label="Correo electrónico"
                      type="email"
                      autoComplete="username"
                      placeholder="Correo electrónico"
                    />
                  )}
                </form.Field>
              </FieldGroup>

              {mustVerifyEmail && auth.user.email_verified_at === null && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Tu correo electrónico no ha sido verificado.{' '}
                    <Link
                      href={send()}
                      as="button"
                      className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current!"
                    >
                      Haz click aquí para reenviar el correo de verificación.
                    </Link>
                  </p>

                  {status === 'verification-link-sent' && (
                    <Alert variant="default" className="mt-2">
                      <CheckCircleIcon />
                      <AlertDescription>
                        Se ha enviado una nueva liga de verificación a tu correo electrónico.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="justify-end">
              <Button type="submit" processing={processing} data-test="update-profile-button">
                Guardar
              </Button>
            </CardFooter>
          </Card>
        </form>

        <DeleteUser />
      </SettingsLayout>
    </>
  );
}

Edit.layout = () => ({ breadcrumbs });

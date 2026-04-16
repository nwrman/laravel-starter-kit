import { Head } from '@inertiajs/react';
import type { StandardSchemaV1 } from '@tanstack/form-core';
import * as z from 'zod';
import { update } from '@/actions/App/Http/Controllers/UserPasswordController';
import { Button } from '@/components/button';
import { PasswordField } from '@/components/form-fields';
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
import { edit } from '@/routes/password';
import type { BreadcrumbItem } from '@/types';

type PasswordFormData = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Ingresa tu contraseña actual'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    password_confirmation: z.string().min(1, 'Confirma tu nueva contraseña'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Las contraseñas no coinciden',
    path: ['password_confirmation'],
  }) as unknown as StandardSchemaV1<PasswordFormData>;

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Configuración de contraseña',
    href: edit().url,
  },
];

export default function Password() {
  const { form, processing } = useInertiaForm({
    schema: passwordSchema,
    defaultValues: { current_password: '', password: '', password_confirmation: '' },
    action: update(),
    options: {
      preserveScroll: true,
      onError: (): void => form.reset(),
      onSuccess: (): void => form.reset(),
    },
  });

  return (
    <>
      <Head title="Configuración de contraseña" />

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
              <CardTitle>Actualizar contraseña</CardTitle>
              <CardDescription>
                Asegúrate de usar una contraseña larga y aleatoria para mantener tu cuenta segura
              </CardDescription>
            </CardHeader>

            <CardContent>
              <FieldGroup>
                <form.Field name="current_password">
                  {(field) => (
                    <PasswordField
                      field={field}
                      label="Contraseña actual"
                      autoComplete="current-password"
                      placeholder="Contraseña actual"
                    />
                  )}
                </form.Field>

                <form.Field name="password">
                  {(field) => (
                    <PasswordField
                      field={field}
                      label="Nueva contraseña"
                      autoComplete="new-password"
                      placeholder="Nueva contraseña"
                    />
                  )}
                </form.Field>

                <form.Field name="password_confirmation">
                  {(field) => (
                    <PasswordField
                      field={field}
                      label="Confirmar contraseña"
                      autoComplete="new-password"
                      placeholder="Confirmar contraseña"
                    />
                  )}
                </form.Field>
              </FieldGroup>
            </CardContent>

            <CardFooter className="justify-end">
              <Button type="submit" processing={processing} data-test="update-password-button">
                Guardar contraseña
              </Button>
            </CardFooter>
          </Card>
        </form>
      </SettingsLayout>
    </>
  );
}

Password.layout = () => ({ breadcrumbs });

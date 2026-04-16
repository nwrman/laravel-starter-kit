import { Form, Head } from '@inertiajs/react';
import type { StandardSchemaV1 } from '@tanstack/form-core';
import { ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import * as z from 'zod';
import { update } from '@/actions/App/Http/Controllers/Settings/SecurityController';
import { Button } from '@/components/button';
import { PasswordField } from '@/components/form-fields';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { useInertiaForm } from '@/hooks/use-inertia-form';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/security';
import { disable, enable } from '@/routes/two-factor';
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
    title: 'Seguridad',
    href: edit().url,
  },
];

type Props = {
  canManageTwoFactor?: boolean;
  requiresConfirmation?: boolean;
  twoFactorEnabled?: boolean;
};

export default function Security({
  canManageTwoFactor = false,
  requiresConfirmation = false,
  twoFactorEnabled = false,
}: Props) {
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

  const {
    qrCodeSvg,
    hasSetupData,
    manualSetupKey,
    clearSetupData,
    clearTwoFactorAuthData,
    fetchSetupData,
    recoveryCodesList,
    fetchRecoveryCodes,
    errors: twoFactorErrors,
  } = useTwoFactorAuth();
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
  const prevTwoFactorEnabled = useRef(twoFactorEnabled);

  useEffect(() => {
    if (prevTwoFactorEnabled.current && !twoFactorEnabled) {
      clearTwoFactorAuthData();
    }

    prevTwoFactorEnabled.current = twoFactorEnabled;
  }, [twoFactorEnabled, clearTwoFactorAuthData]);

  return (
    <>
      <Head title="Seguridad" />

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

        {canManageTwoFactor && (
          <Card>
            <CardHeader>
              <CardTitle>Autenticación de dos factores</CardTitle>
              <CardDescription>
                Administra la configuración de autenticación de dos factores
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {twoFactorEnabled ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Se te pedirá un PIN seguro y aleatorio durante el inicio de sesión, que puedes
                    obtener de la aplicación con soporte TOTP en tu teléfono.
                  </p>

                  <Separator />

                  <TwoFactorRecoveryCodes
                    recoveryCodesList={recoveryCodesList}
                    fetchRecoveryCodes={fetchRecoveryCodes}
                    errors={twoFactorErrors}
                  />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Cuando actives la autenticación de dos factores, se te pedirá un PIN seguro
                  durante el inicio de sesión. Este PIN lo puedes obtener de una aplicación con
                  soporte TOTP en tu teléfono.
                </p>
              )}
            </CardContent>

            <CardFooter className="justify-end">
              {twoFactorEnabled ? (
                <Form {...disable.form()}>
                  {({ processing: disableProcessing }) => (
                    <Button
                      variant="destructive"
                      type="submit"
                      processing={disableProcessing}
                      data-test="disable-two-factor-button"
                    >
                      Desactivar 2FA
                    </Button>
                  )}
                </Form>
              ) : hasSetupData ? (
                <Button
                  onClick={() => setShowSetupModal(true)}
                  data-test="continue-two-factor-button"
                >
                  <ShieldCheck />
                  Continuar configuración
                </Button>
              ) : (
                <Form {...enable.form()} onSuccess={() => setShowSetupModal(true)}>
                  {({ processing: enableProcessing }) => (
                    <Button
                      type="submit"
                      processing={enableProcessing}
                      data-test="enable-two-factor-button"
                    >
                      Activar 2FA
                    </Button>
                  )}
                </Form>
              )}
            </CardFooter>
          </Card>
        )}

        <TwoFactorSetupModal
          isOpen={showSetupModal}
          onClose={() => setShowSetupModal(false)}
          requiresConfirmation={requiresConfirmation}
          twoFactorEnabled={twoFactorEnabled}
          qrCodeSvg={qrCodeSvg}
          manualSetupKey={manualSetupKey}
          clearSetupData={clearSetupData}
          fetchSetupData={fetchSetupData}
          errors={twoFactorErrors}
        />
      </SettingsLayout>
    </>
  );
}

Security.layout = () => ({ breadcrumbs });

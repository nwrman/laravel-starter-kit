import { Form, Head } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/button';
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
import { Separator } from '@/components/ui/separator';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import SettingsLayout from '@/layouts/settings/layout';
import { disable, enable, show } from '@/routes/two-factor';
import type { BreadcrumbItem } from '@/types';

type Props = {
  canManageTwoFactor?: boolean;
  requiresConfirmation?: boolean;
  twoFactorEnabled?: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Autenticación de dos factores',
    href: show(),
  },
];

export default function TwoFactor({
  canManageTwoFactor = false,
  requiresConfirmation = false,
  twoFactorEnabled = false,
}: Props) {
  const {
    qrCodeSvg,
    hasSetupData,
    manualSetupKey,
    clearSetupData,
    fetchSetupData,
    recoveryCodesList,
    fetchRecoveryCodes,
    errors,
  } = useTwoFactorAuth();
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);

  return (
    <>
      <Head title="Autenticación de dos factores" />
      <SettingsLayout>
        {canManageTwoFactor && (
          <>
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
                      errors={errors}
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
                    {({ processing }) => (
                      <Button variant="destructive" type="submit" processing={processing}>
                        Desactivar 2FA
                      </Button>
                    )}
                  </Form>
                ) : hasSetupData ? (
                  <Button onClick={() => setShowSetupModal(true)}>
                    <ShieldCheck />
                    Continuar configuración
                  </Button>
                ) : (
                  <Form {...enable.form()} onSuccess={() => setShowSetupModal(true)}>
                    {({ processing }) => (
                      <Button type="submit" processing={processing}>
                        Activar 2FA
                      </Button>
                    )}
                  </Form>
                )}
              </CardFooter>
            </Card>

            <TwoFactorSetupModal
              isOpen={showSetupModal}
              onClose={() => setShowSetupModal(false)}
              requiresConfirmation={requiresConfirmation}
              twoFactorEnabled={twoFactorEnabled}
              qrCodeSvg={qrCodeSvg}
              manualSetupKey={manualSetupKey}
              clearSetupData={clearSetupData}
              fetchSetupData={fetchSetupData}
              errors={errors}
            />
          </>
        )}
      </SettingsLayout>
    </>
  );
}

TwoFactor.layout = () => ({ breadcrumbs });

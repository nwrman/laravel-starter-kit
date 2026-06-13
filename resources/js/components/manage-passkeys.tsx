import { router } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';
import PasskeyItem from '@/components/passkey-item';
import PasskeyRegister from '@/components/passkey-register';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Passkey } from '@/types/auth';

export type Props = {
  canManagePasskeys?: boolean;
  passkeys?: Passkey[];
};

function EmptyState() {
  return (
    <div className="p-8 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted">
        <KeyRound className="size-7 text-muted-foreground" />
      </div>
      <p className="font-medium">Aún no tienes llaves de acceso</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Agrega una llave para iniciar sesión sin contraseña
      </p>
    </div>
  );
}

export default function ManagePasskeys({ canManagePasskeys = false, passkeys = [] }: Props) {
  if (!canManagePasskeys) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Llaves de acceso</CardTitle>
        <CardDescription>
          Administra tus llaves de acceso para iniciar sesión sin contraseña
        </CardDescription>
      </CardHeader>

      <CardContent>
        {passkeys.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-border">
            {passkeys.map((passkey) => (
              <PasskeyItem key={passkey.id} passkey={passkey} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </CardContent>

      <CardFooter>
        <PasskeyRegister onSuccess={() => router.reload({ only: ['passkeys'] })} />
      </CardFooter>
    </Card>
  );
}

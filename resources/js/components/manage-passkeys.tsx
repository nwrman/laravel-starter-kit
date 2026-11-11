import { router } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { destroy } from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyRegistrationController';
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
  const focusAfterDelete = useRef<string | null>(null);

  // The deleted row takes its button, and the focus, with it. Once the list has re-rendered,
  // hand the focus to the neighbouring row's delete button, or to "add" when none is left.
  useEffect(() => {
    if (focusAfterDelete.current === null) {
      return;
    }

    document.querySelector<HTMLElement>(focusAfterDelete.current)?.focus();
    focusAfterDelete.current = null;
  }, [passkeys]);

  if (!canManagePasskeys) {
    return null;
  }

  // Optimistic: the row leaves at once. This is the kit's reference optimistic update (#43). Inertia puts
  // `passkeys` back when the visit ends without success, and the server's answer replaces
  // it when it succeeds. A refusal (403, 404, 500) shows an error toast instead: returning false stops
  // Inertia's error dialog (local) and error page (production), so the row simply returns.
  const deletePasskey = (passkey: Passkey) => {
    const index = passkeys.findIndex(({ id }) => id === passkey.id);
    const neighbour = passkeys[index + 1] ?? passkeys[index - 1];

    focusAfterDelete.current = neighbour
      ? `[data-passkey-delete="${neighbour.id}"]`
      : '[data-passkey-add]';

    router
      .optimistic<{ passkeys: Passkey[] }>((props) => ({
        passkeys: props.passkeys.filter(({ id }) => id !== passkey.id),
      }))
      .delete(destroy.url(passkey.id), {
        preserveScroll: true,
        onHttpException: () => {
          // The app's feedback channel (use-flash-toast shows server flashes the same way).
          toast.error(`No se pudo eliminar la llave "${passkey.name}".`, { duration: 6_000 });

          return false;
        },
      });
  };

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
              <PasskeyItem
                key={passkey.id}
                passkey={passkey}
                onDelete={() => deletePasskey(passkey)}
              />
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

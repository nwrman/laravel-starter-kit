import { router } from '@inertiajs/react';
import { KeyRound, Trash2 } from 'lucide-react';
import { destroy } from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyRegistrationController';
import { ConfirmButton } from '@/components/confirm-button';
import type { Passkey } from '@/types/auth';

type Props = {
  passkey: Passkey;
};

export default function PasskeyItem({ passkey }: Props) {
  return (
    <div className="flex items-center justify-between border-b p-4 last:border-b-0">
      <div className="flex items-center gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
          <KeyRound className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <p className="font-medium tracking-tight">{passkey.name}</p>
            {passkey.authenticator && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase ring-1 ring-border ring-inset">
                {passkey.authenticator}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Agregada {passkey.created_at_diff}
            {passkey.last_used_at_diff && (
              <>
                <span className="mx-1 text-muted-foreground/50">/</span> Último uso{' '}
                {passkey.last_used_at_diff}
              </>
            )}
          </p>
        </div>
      </div>

      <ConfirmButton
        variant="ghost"
        size="icon-sm"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        title="Eliminar llave de acceso"
        description={`¿Seguro que deseas eliminar la llave "${passkey.name}"? Ya no podrás usarla para iniciar sesión.`}
        confirmLabel="Eliminar"
        onClick={() => router.delete(destroy.url(passkey.id), { preserveScroll: true })}
        data-test={`delete-passkey-${passkey.id}`}
      >
        <Trash2 />
        <span className="sr-only">Eliminar</span>
      </ConfirmButton>
    </div>
  );
}

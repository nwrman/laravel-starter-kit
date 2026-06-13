import { usePasskeyRegister } from '@laravel/passkeys/react';
import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/button';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  onSuccess: () => void;
};

/** Suggest a friendly default name from the current browser + OS. */
function defaultPasskeyName(): string {
  const ua = navigator.userAgent;
  const browser = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'].find((b) =>
    new RegExp(b).test(ua),
  );
  const os = ['iPhone', 'iPad', 'Android', 'Mac', 'Windows'].find((o) => new RegExp(o).test(ua));

  return [browser, os].filter(Boolean).join(' en ') || '';
}

/**
 * Collects a name then runs the WebAuthn registration ceremony via the
 * `@laravel/passkeys` hook. There is no Inertia <Form> here because the submit
 * is a browser credential ceremony (navigator.credentials.create), not a plain
 * POST — the hook performs the Inertia/XHR round-trip itself.
 */
export default function PasskeyRegister({ onSuccess }: Props) {
  const [name, setName] = useState(defaultPasskeyName);
  const [showForm, setShowForm] = useState(false);

  const { register, isLoading, error, isSupported } = usePasskeyRegister({
    onSuccess: () => {
      setName(defaultPasskeyName());
      setShowForm(false);
      onSuccess();
    },
  });

  const submit = () => {
    if (name.trim()) {
      void register(name);
    }
  };

  if (!isSupported) {
    return (
      <p className="text-sm text-muted-foreground">
        Las llaves de acceso no son compatibles con este navegador.
      </p>
    );
  }

  if (!showForm) {
    return (
      <Button variant="outline" onClick={() => setShowForm(true)} data-test="add-passkey-button">
        <KeyRound />
        Agregar llave de acceso
      </Button>
    );
  }

  return (
    <div className="w-full space-y-4 rounded-lg border border-border bg-muted/50 p-4">
      <div className="grid gap-2">
        <Label htmlFor="passkey-name">Nombre de la llave</Label>
        <Input
          id="passkey-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="p. ej. MacBook Pro, iPhone"
          autoFocus
          data-test="passkey-name-input"
        />
        <p className="text-xs text-muted-foreground">
          Un nombre te ayuda a identificar esta llave más adelante.
        </p>
      </div>

      {error && <InputError message={error} />}

      <div className="flex gap-2">
        <Button
          onClick={submit}
          processing={isLoading}
          disabled={!name.trim()}
          data-test="register-passkey-button"
        >
          Registrar llave
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setShowForm(false);
            setName(defaultPasskeyName());
          }}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}

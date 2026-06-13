import { router } from '@inertiajs/react';
import { usePasskeyVerify } from '@laravel/passkeys/react';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/button';
import InputError from '@/components/input-error';
import { dashboard } from '@/routes';

/**
 * "Sign in with a passkey" button shown on the login page. The WebAuthn
 * ceremony (fetch options → navigator.credentials.get → submit assertion) is
 * driven by the `@laravel/passkeys` hook, which uses the Inertia/XHR client
 * under the hood. Renders nothing when the browser has no WebAuthn support.
 */
export default function PasskeyVerify() {
  const { verify, isLoading, error, isSupported } = usePasskeyVerify({
    onSuccess: (response) => {
      router.visit(response.redirect ?? dashboard().url);
    },
  });

  if (!isSupported) {
    return null;
  }

  return (
    <div>
      <div className="grid gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => void verify()}
          processing={isLoading}
          data-test="passkey-signin-button"
        >
          <KeyRound />
          Iniciar sesión con llave de acceso
        </Button>
        {error && <InputError message={error} className="text-center" />}
      </div>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-sm text-muted-foreground">O continúa con tu correo</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}

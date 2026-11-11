import {
  InvalidDomainError,
  NotSupportedError,
  PasskeyExistsError,
  type PasskeyError,
  UserCancelledError,
} from '@laravel/passkeys';

/**
 * The message for a failed passkey ceremony, in the app's language. @laravel/passkeys writes
 * its own messages in English, so the hooks' `error` string is never shown: this reads the
 * error's class (`errorInstance`) instead. Any other failure, a browser exception or a server
 * response, gets the generic message, since its text can be English too.
 */
export function passkeyErrorMessage(error: PasskeyError | null): string | null {
  if (error === null) {
    return null;
  }

  if (error instanceof UserCancelledError) {
    return 'Se canceló o se agotó el tiempo. Inténtalo de nuevo.';
  }

  if (error instanceof NotSupportedError) {
    return 'Tu navegador no admite llaves de acceso.';
  }

  if (error instanceof PasskeyExistsError) {
    return 'Este dispositivo ya tiene una llave de acceso registrada.';
  }

  if (error instanceof InvalidDomainError) {
    return 'Las llaves de acceso no funcionan en este dominio. En desarrollo local, usa localhost.';
  }

  return 'Algo salió mal con la llave de acceso. Inténtalo de nuevo.';
}

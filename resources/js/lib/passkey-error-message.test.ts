import {
  InvalidDomainError,
  NotSupportedError,
  PasskeyError,
  PasskeyExistsError,
  UserCancelledError,
} from '@laravel/passkeys';
import { passkeyErrorMessage } from './passkey-error-message';

describe('passkeyErrorMessage', () => {
  it.each([
    [new UserCancelledError(), 'Se canceló o se agotó el tiempo. Inténtalo de nuevo.'],
    [new NotSupportedError(), 'Tu navegador no admite llaves de acceso.'],
    [new PasskeyExistsError(), 'Este dispositivo ya tiene una llave de acceso registrada.'],
    [
      new InvalidDomainError('example.test'),
      'Las llaves de acceso no funcionan en este dominio. En desarrollo local, usa localhost.',
    ],
    [
      new PasskeyError('Request failed with status 500'),
      'Algo salió mal con la llave de acceso. Inténtalo de nuevo.',
    ],
  ])('shows %o in Spanish', (error, message) => {
    expect(passkeyErrorMessage(error)).toBe(message);
  });

  it('shows nothing when there is no error', () => {
    expect(passkeyErrorMessage(null)).toBeNull();
  });
});

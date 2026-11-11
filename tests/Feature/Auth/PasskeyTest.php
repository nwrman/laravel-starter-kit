<?php

declare(strict_types=1);

use App\Models\User;
use Laravel\Passkeys\Passkeys;

it('lets an authenticated user delete a passkey', function (): void {
    $user = User::factory()->create();

    $passkey = passkeyFor($user, 'Old Phone');

    $this->actingAs($user)->session(['auth.password_confirmed_at' => time()]);

    $this->fromRoute('security.edit')
        ->delete(route('passkey.destroy', $passkey))
        ->assertRedirect(route('security.edit'))
        ->assertInertiaFlash('success', 'Llave de acceso eliminada');

    expect($user->passkeys()->count())->toBe(0);
});

it("refuses to delete another user's passkey, and confirms nothing", function (): void {
    $owner = User::factory()->create();
    $passkey = passkeyFor($owner, 'Owner Phone');

    $this->actingAs(User::factory()->create())->session(['auth.password_confirmed_at' => time()]);

    $this->fromRoute('security.edit')
        ->delete(route('passkey.destroy', $passkey))
        ->assertForbidden()
        ->assertInertiaFlashMissing('success');

    expect($owner->passkeys()->count())->toBe(1);
});

it('answers a JSON passkey delete with its status and no toast', function (): void {
    $user = User::factory()->create();
    $passkey = passkeyFor($user, 'Old Key');

    $this->actingAs($user)->session(['auth.password_confirmed_at' => time()]);

    $this->deleteJson(route('passkey.destroy', $passkey))
        ->assertOk()
        ->assertExactJson(['status' => 'passkey-deleted'])
        ->assertInertiaFlashMissing('success');

    expect($user->passkeys()->count())->toBe(0);
});

it('sends a delete without a confirmed password to confirm it first, with no toast', function (): void {
    $user = User::factory()->create();
    $passkey = passkeyFor($user);

    $this->actingAs($user)
        ->fromRoute('security.edit')
        ->delete(route('passkey.destroy', $passkey))
        ->assertRedirect(route('password.confirm'))
        ->assertInertiaFlashMissing('success');

    expect($user->passkeys()->count())->toBe(1);
});

it('exposes passkey login options to guests', function (): void {
    $this->get(route('passkey.login-options'))
        ->assertOk();
});

it('does not authorize passkey login for a soft-deleted user', function (): void {
    $user = User::factory()->create();

    $passkey = passkeyFor($user, 'Old Phone');

    $user->delete();

    expect(Passkeys::allowsLogin(request(), $passkey->fresh()))->toBeFalse();
});

it('authorizes passkey login for an active user', function (): void {
    $user = User::factory()->create();

    $passkey = passkeyFor($user, 'Laptop');

    expect(Passkeys::allowsLogin(request(), $passkey->fresh()))->toBeTrue();
});

it('requires authentication for passkey registration options', function (): void {
    $this->getJson(route('passkey.registration-options'))->assertUnauthorized();
});

it('requires a confirmed password for passkey registration options', function (): void {
    $this->actingAs(User::factory()->create())
        ->get(route('passkey.registration-options'))
        ->assertRedirect(route('password.confirm'));
});

it('redirects authenticated users away from passkey login options', function (): void {
    $this->actingAs(User::factory()->create())
        ->get(route('passkey.login-options'))
        ->assertRedirect();
});

it('advertises passkey endpoints via the well-known url', function (): void {
    $this->getJson('/.well-known/passkey-endpoints')
        ->assertOk()
        ->assertExactJson([
            'enroll' => route('security.edit'),
            'manage' => route('security.edit'),
        ]);
});

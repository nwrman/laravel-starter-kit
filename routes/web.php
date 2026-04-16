<?php

declare(strict_types=1);

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeleteUserController;
use App\Http\Controllers\DeleteUserPhotoController;
use App\Http\Controllers\Project\ProjectController;
use App\Http\Controllers\Settings\SecurityController;
use App\Http\Controllers\Team\TeamController;
use App\Http\Controllers\UserProfileController;
use Illuminate\Support\Facades\Route;

Route::permanentRedirect('/', '/dashboard');

// Preserve legacy /verify-email URL used by UX copy and existing links.
// Fortify registers this endpoint at /email/verify.
Route::permanentRedirect('/verify-email', '/email/verify');

// CSRF token refresh endpoint for session expired handler
Route::get('csrf-token', fn () => response()->json(['token' => csrf_token()]))->name('csrf-token');

Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Auth check endpoint for session expired handler
    Route::get('auth-check', fn () => response()->json(['authenticated' => true]))->name('auth-check');

    Route::get('projects', [ProjectController::class, 'index'])->name('projects.index');
    Route::get('projects/create', [ProjectController::class, 'create'])->name('projects.create');
    Route::post('projects', [ProjectController::class, 'store'])->name('projects.store');
    Route::get('projects/{project}', [ProjectController::class, 'show'])->name('projects.show');

    Route::get('team', [TeamController::class, 'index'])->name('team.index');
});

Route::middleware('auth')->group(function (): void {
    // User...
    Route::delete('user', DeleteUserController::class)->name('user.destroy');

    // User Profile...
    Route::redirect('settings', '/settings/profile');
    Route::get('settings/profile', [UserProfileController::class, 'edit'])->name('user-profile.edit');
    Route::patch('settings/profile', [UserProfileController::class, 'update'])->name('user-profile.update');
    Route::delete('settings/profile/photo', DeleteUserPhotoController::class)->name('user-photo.destroy');

    // User Password...
    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    // User Security (password + two-factor)...
    Route::get('settings/security', [SecurityController::class, 'edit'])->name('security.edit');
});

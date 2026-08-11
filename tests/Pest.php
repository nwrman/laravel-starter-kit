<?php

declare(strict_types=1);

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Sleep;
use Illuminate\Support\Str;
use Pest\Browser\Api\ArrayablePendingAwaitablePage;
use Pest\Browser\Api\PendingAwaitablePage;
use Tests\TestCase;

pest()
    ->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->beforeEach(function (): void {
        Str::createRandomStringsNormally();
        Str::createUuidsNormally();
        Str::createUlidsNormally();
        Http::preventStrayRequests();
        Process::preventStrayProcesses();
        Sleep::fake();

        $this->freezeTime();
    })
    ->in('Browser', 'Feature', 'Unit');

/*
|--------------------------------------------------------------------------
| Test Impact Analysis
|--------------------------------------------------------------------------
|
| Replays only the tests a change can actually reach — `composer test:fast`.
|
| TIA only engages on a *full* run. Pest treats `--testsuite`, `--filter`,
| `--group` and friends as a partial selection and skips TIA entirely, so the
| per-suite wrappers (composer test:unit|feature|browser, which pass
| --testsuite) can never use it. That is why test:fast exists as its own
| command rather than the wrappers gaining a flag.
|
| `locally()` activates it on every local full run with no flag, and skips it
| on CI so the pipeline always verifies everything against a clean checkout.
| `filtered()` loads only the affected test files; Pest turns that off by
| itself whenever a coverage report is active and falls back to a full replay,
| which is what keeps preflight's --exactly=100.0 honest.
|
| The graph lives in ~/.pest/tia/<project-key>/, outside the repo — nothing to
| gitignore. First run records it (~2x, once); later runs replay in well under
| a second. It rebuilds itself when composer.lock, phpunit.xml, vite config or
| the node lockfile change.
|
| `baselined()` is deliberately omitted: it downloads a shared graph from a CI
| job we do not run. Add it here if that job is ever introduced.
|
*/

pest()->tia()
    ->locally()
    ->filtered();

expect()->extend('toBeOne', fn () => $this->toBe(1));

function visitWithoutAnimations(string|array $url): ArrayablePendingAwaitablePage|PendingAwaitablePage
{
    $pages = visit($url);

    $disableScript = "
        window.__testing = true;

        const style = document.createElement('style');
        style.textContent = `
            *, *::before, *::after {
                animation-duration: 0s !important;
                transition-duration: 0s !important;
            }
        `;
        document.head.appendChild(style);
    ";

    // If it's a single page, inject directly
    if (is_string($url)) {
        $pages->script($disableScript);

        return $pages;
    }

    // If it's multiple pages, inject into each page
    // The pages object supports iteration
    foreach ($pages as $page) {
        $page->script($disableScript);
    }

    return $pages;
}

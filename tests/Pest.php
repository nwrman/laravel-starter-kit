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

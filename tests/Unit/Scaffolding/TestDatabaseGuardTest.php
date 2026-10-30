<?php

declare(strict_types=1);

use Symfony\Component\Process\Process;

/*
 * Tests\TestCase is the backstop between RefreshDatabase and the development database:
 * nothing else fails if it goes, until a run wipes real data. See .ai/rules/database.md.
 *
 * It runs a fresh Pest process because that is how the leak happens — a parent exports a
 * development DB_* before .env.testing loads. Inside this process the env repository already
 * owns those keys and overwrites them on refresh. The names exist on no server, so even a
 * broken guard cannot touch data.
 */

it('refuses to boot the suite against a database not named *_test', function (string $key, string $value): void {
    $process = new Process(
        [PHP_BINARY, 'vendor/bin/pest', '--filter=EnvTestingTemplateTest'],
        dirname(__DIR__, 3),
        [
            $key => $value,
            'XDEBUG_MODE' => 'off',
            'LARAVEL_PARALLEL_TESTING' => false,
            'TEST_TOKEN' => false,
            'PARATEST' => false,
            // Its own Playwright state file: on exit the browser plugin deletes the one it
            // used, and the shared default belongs to the run this test is part of.
            'PEST_BROWSER_STATE_FILE' => sys_get_temp_dir().'/pest-browser-guard-test-'.getmypid().'.json',
        ],
    );

    $process->run();

    expect($process->isSuccessful())->toBeFalse()
        ->and($process->getOutput())->toContain("Refusing to run the suite against 'acme_dev'");
})->with([
    'DB_DATABASE names it' => ['DB_DATABASE', 'acme_dev'],
    'a DB_URL overrides DB_DATABASE' => ['DB_URL', 'pgsql://postgres@127.0.0.1:5432/acme_dev'],
]);

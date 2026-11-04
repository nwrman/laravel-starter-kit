<?php

declare(strict_types=1);

/*
 * A test command that passes --env=testing is a sign it boots Laravel before Pest, and an
 * artisan parent hands .env's DB_DATABASE to Pest, where it beats .env.testing (ADR 0017).
 * The flag stays only on migrate steps: they create the _test database and start no Pest.
 */

/**
 * @return list<string> every command line that passes --env=testing, as "<file>: <line>"
 */
function linesPassingEnvTesting(): array
{
    $root = dirname(__DIR__, 3);

    /** @var array{scripts: array<string, string|list<string>>} $composer */
    $composer = json_decode((string) file_get_contents($root.'/composer.json'), true, flags: JSON_THROW_ON_ERROR);

    $lines = [];

    foreach ($composer['scripts'] as $name => $commands) {
        foreach ((array) $commands as $command) {
            $lines[] = 'composer.json '.$name.': '.$command;
        }
    }

    foreach (['herd.yml', ...array_map(fn (string $path): string => 'scripts/'.basename($path), glob($root.'/scripts/*') ?: [])] as $file) {
        foreach (file($root.'/'.$file, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
            $lines[] = $file.': '.$line;
        }
    }

    return array_values(array_filter($lines, fn (string $line): bool => str_contains($line, '--env=testing')));
}

it('passes --env=testing only to migrate steps', function (): void {
    $lines = linesPassingEnvTesting();

    $notMigrate = array_values(array_filter(
        $lines,
        fn (string $line): bool => preg_match('/artisan migrate(:status)? [^;&|]*--env=testing/', $line) !== 1,
    ));

    expect($lines)->not->toBeEmpty()
        ->and($notMigrate)->toBe([]);
});

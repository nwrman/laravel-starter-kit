<?php

declare(strict_types=1);

use Symfony\Component\Yaml\Yaml;

/*
 * CI writes its .env.testing from the committed template with anchored sed. A sed whose key
 * the template no longer carries matches nothing, and CI silently keeps the template's value.
 * See .ai/rules/database.md.
 */

it('carries every key the CI workflow rewrites in .env.testing', function (): void {
    $root = dirname(__DIR__, 3);
    $template = (string) file_get_contents($root.'/.env.testing.example');
    $targeted = [];

    foreach (glob($root.'/.github/workflows/*.{yml,yaml}', GLOB_BRACE) ?: [] as $path) {
        foreach (Yaml::parseFile($path)['jobs'] ?? [] as $job) {
            foreach ($job['steps'] ?? [] as $step) {
                preg_match_all('/s\|\^([A-Z0-9_]+)=.*\.env\.testing$/m', (string) ($step['run'] ?? ''), $matches);

                array_push($targeted, ...$matches[1]);
            }
        }
    }

    $missing = array_values(array_filter(
        array_unique($targeted),
        fn (string $key): bool => preg_match('/^'.$key.'=/m', $template) !== 1,
    ));

    expect($targeted)->not->toBeEmpty()
        ->and($missing)->toBe([]);
});

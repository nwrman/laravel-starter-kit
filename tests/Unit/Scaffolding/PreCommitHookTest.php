<?php

declare(strict_types=1);

/*
 * Rector processes a file named on its command line even when it lies outside withPaths(),
 * so the pre-commit hook in vite.config.ts hands it only staged files inside RECTOR_PATHS.
 * A path added to rector.php and not there would go unchecked at commit time, silently.
 */

it("hands Rector the same paths rector.php's withPaths() lists", function (): void {
    $root = dirname(__DIR__, 3);

    preg_match('/->withPaths\(\[(.*?)\]\)/s', (string) file_get_contents($root.'/rector.php'), $rector);
    preg_match_all("/__DIR__\\.'\\/([^']+)'/", $rector[1], $rectorPaths);

    preg_match('/const RECTOR_PATHS = \[(.*?)\];/s', (string) file_get_contents($root.'/vite.config.ts'), $hook);
    preg_match_all("/'([^']+)'/", $hook[1], $hookPaths);

    $normalise = function (array $paths): array {
        $paths = array_map(fn (string $path): string => mb_rtrim($path, '/'), $paths);
        sort($paths);

        return $paths;
    };

    expect($normalise($hookPaths[1]))
        ->toBe($normalise($rectorPaths[1]))
        ->toContain('app', 'bootstrap/app.php');
});

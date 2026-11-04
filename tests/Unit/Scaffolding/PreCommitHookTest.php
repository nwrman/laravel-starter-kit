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

    // The hook matches a directory by prefix only when its entry ends in '/', and a file
    // exactly: so each rector.php path must appear in the form its kind needs.
    $expected = array_map(fn (string $path): string => is_dir($root.'/'.$path) ? $path.'/' : $path, $rectorPaths[1]);
    $actual = $hookPaths[1];
    sort($expected);
    sort($actual);

    expect($actual)->toBe($expected)
        ->toContain('app/', 'bootstrap/app.php');
});

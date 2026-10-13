<?php

declare(strict_types=1);

/**
 * TIA cache introspection for the worktree scripts.
 *
 * Pest keys its Test Impact Analysis cache by repository identity so that every
 * checkout of one repo shares a graph. It reads that identity from
 * `<root>/.git/config` — and in a git worktree `.git` is a FILE, not a
 * directory, so the lookup fails and the key silently falls back to the
 * worktree's own path. Every ticket therefore starts with an empty graph,
 * rebuilds it from a full run, and throws it away with the worktree.
 *
 * The scripts warm a new worktree by copying main's graph instead. Rather than
 * reimplement the key derivation and the fingerprint (and drift from it on the
 * next Pest release), this shells into Pest's own classes.
 *
 * Usage:
 *   php scripts/tia-helper.php dir   <projectRoot>   # cache directory Pest would use
 *   php scripts/tia-helper.php valid <projectRoot>   # exit 0 if a usable graph is there
 *   php scripts/tia-helper.php sha   <projectRoot>   # the commit the graph's baseline is pinned to
 */

use Pest\Plugins\Tia\Fingerprint;
use Pest\Plugins\Tia\Storage;

require __DIR__.'/../vendor/autoload.php';

$command = $argv[1] ?? '';
$root = $argv[2] ?? '';

if ($command === '' || $root === '') {
    fwrite(STDERR, "usage: tia-helper.php {dir|valid|sha} <projectRoot> [branch]\n");
    exit(2);
}

$root = mb_rtrim($root, '/');

if (! is_dir($root)) {
    fwrite(STDERR, "not a directory: $root\n");
    exit(2);
}

$dir = Storage::tempDir($root);

if ($command === 'dir') {
    echo $dir, PHP_EOL;
    exit(0);
}

// The commit Pest recorded the baseline at, which is what `since()` diffs a
// working tree against. Printed for `refresh-main.sh`, which re-records when it
// has fallen behind HEAD so that a fresh worktree starts level with main.
//
// The default branch's baseline, deliberately: `Graph::baseline()` has every
// other branch fall back to it, so it is the one a new worktree inherits.
if ($command === 'sha') {
    $graph = json_decode((string) @file_get_contents($dir.'/graph.json'), true);
    $sha = $graph['baselines'][$argv[3] ?? 'main']['sha'] ?? null;

    if (! is_string($sha) || $sha === '') {
        exit(1);
    }

    echo $sha, PHP_EOL;
    exit(0);
}

if ($command !== 'valid') {
    fwrite(STDERR, "unknown command: $command\n");
    exit(2);
}

// A graph without its coverage cache buys nothing for `composer preflight`:
// Tia::enterRecordMode() is taken whenever the coverage cache is absent, even
// with a valid graph on disk. Both files, or the warm is a lie.
$graphPath = $dir.'/graph.json';
$coveragePath = $dir.'/coverage.bin.gz';

if (! is_file($graphPath) || ! is_file($coveragePath)) {
    exit(1);
}

$graph = json_decode((string) @file_get_contents($graphPath), true);

if (! is_array($graph) || ! isset($graph['fingerprint']['structural'])) {
    exit(1);
}

$current = Fingerprint::compute($root);

// Structural only. The environmental bucket carries the PHP minor version,
// which Pest tolerates as drift (edges are reused) rather than invalidation.
exit($graph['fingerprint']['structural'] === ($current['structural'] ?? null) ? 0 : 1);

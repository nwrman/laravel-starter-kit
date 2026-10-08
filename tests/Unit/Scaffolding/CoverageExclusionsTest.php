<?php

declare(strict_types=1);

/*
 * The coverage gate demands 100%, so every <exclude> entry in phpunit.xml is a hole
 * in it. A hole nobody can see outlives its reason: two entries pointing at deleted
 * files survived here for months, excluding nothing while the gate stayed green.
 *
 * The contract runs both ways. An excluded file must carry the marker with its reason
 * and what removes it, and a file carrying the marker must actually be excluded.
 */
const COVERAGE_EXCLUSION_MARKER = 'COVERAGE-EXCLUDED:';
const COVERAGE_EXCLUSION_REMOVAL = 'Remove when:';

/**
 * Resolved from __DIR__, not base_path(): datasets are built before the application
 * boots, so the container is not available yet.
 */
function coverageRepositoryRoot(): string
{
    return dirname(__DIR__, 3);
}

/**
 * @return array{files: list<string>, directories: list<string>}
 */
function coverageExclusions(): array
{
    $phpunit = simplexml_load_file(coverageRepositoryRoot().'/phpunit.xml');

    if ($phpunit === false) {
        return ['files' => [], 'directories' => []];
    }

    $read = static fn (SimpleXMLElement $entries): array => array_map(
        static fn (SimpleXMLElement $entry): string => (string) $entry,
        iterator_to_array($entries, false),
    );

    return [
        'files' => $read($phpunit->source->exclude->file),
        'directories' => $read($phpunit->source->exclude->directory),
    ];
}

it('excludes only directories that exist', function (): void {
    $missing = array_filter(
        coverageExclusions()['directories'],
        static fn (string $path): bool => ! is_dir(coverageRepositoryRoot().'/'.$path),
    );

    expect(array_values($missing))->toBe([]);
});

it('excludes only files that exist and say why, in the file', function (string $path): void {
    $absolute = coverageRepositoryRoot().'/'.$path;

    // A stale entry is worse than none: it silently un-covers whatever is written there next.
    expect($absolute)->toBeReadableFile();

    // Excluded but silent about it. Add a COVERAGE-EXCLUDED: line naming the reason and a
    // "Remove when:" condition — or drop the phpunit.xml entry and cover the file.
    expect((string) file_get_contents($absolute))
        ->toContain(COVERAGE_EXCLUSION_MARKER)
        ->toContain(COVERAGE_EXCLUSION_REMOVAL);
})->with(fn (): array => coverageExclusions()['files']);

it('has no file claiming a coverage exclusion it does not have', function (): void {
    $claiming = [];

    /** @var SplFileInfo $file */
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator(coverageRepositoryRoot().'/app')) as $file) {
        if ($file->getExtension() !== 'php') {
            continue;
        }

        if (! str_contains((string) file_get_contents($file->getPathname()), COVERAGE_EXCLUSION_MARKER)) {
            continue;
        }

        $claiming[] = mb_ltrim(str_replace(coverageRepositoryRoot(), '', $file->getPathname()), '/');
    }

    // Left over: a marker with no phpunit.xml entry. Either the exclusion was dropped and
    // the marker was not, or the marker was copied into a file that is genuinely covered.
    expect(array_values(array_diff($claiming, coverageExclusions()['files'])))->toBe([]);
});

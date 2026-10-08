<?php

declare(strict_types=1);

/*
 * A vendor patch outlives its need in silence: once upstream ships the fix, the guard
 * in the composer script stops matching and the patch quietly stops applying, on every
 * install, indefinitely. So each patch names the release that retires it, and this
 * fails the moment composer.lock reaches it. See .ai/rules/patches.md.
 *
 * Header, anywhere before the diff (git apply ignores leading text):
 *
 *     Retire when: vendor/package >= 1.2.3
 */

function patchesRepositoryRoot(): string
{
    return dirname(__DIR__, 3);
}

/**
 * @return array<string, string> installed version, keyed by package name
 */
function installedPackageVersions(): array
{
    /** @var array{packages: list<array{name: string, version: string}>, "packages-dev": list<array{name: string, version: string}>} $lock */
    $lock = json_decode((string) file_get_contents(patchesRepositoryRoot().'/composer.lock'), true, flags: JSON_THROW_ON_ERROR);

    $versions = [];

    foreach ([...$lock['packages'], ...$lock['packages-dev']] as $package) {
        $versions[$package['name']] = mb_ltrim($package['version'], 'v');
    }

    return $versions;
}

it('keeps only patches that are still needed against composer.lock', function (): void {
    $installed = installedPackageVersions();
    $composerJson = (string) file_get_contents(patchesRepositoryRoot().'/composer.json');
    $problems = [];

    foreach (glob(patchesRepositoryRoot().'/patches/*.patch') ?: [] as $path) {
        $patch = basename($path);

        if (preg_match('/^Retire when: (\S+) >= v?(\S+)$/m', (string) file_get_contents($path), $retirement) !== 1) {
            $problems[] = $patch.': no "Retire when: vendor/package >= x.y.z" header';

            continue;
        }

        [, $package, $retiringVersion] = $retirement;

        if (! isset($installed[$package])) {
            $problems[] = $patch.": {$package} is not installed";
        } elseif (version_compare($installed[$package], $retiringVersion, '>=')) {
            $problems[] = $patch.": {$package} {$installed[$package]} ships the fix — delete the patch and its script entry";
        }

        // An unreferenced patch is applied by nothing.
        if (! str_contains($composerJson, 'patches/'.$patch)) {
            $problems[] = $patch.': not applied by any composer script';
        }
    }

    expect($problems)->toBe([]);
});

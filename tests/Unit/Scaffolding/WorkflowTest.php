<?php

declare(strict_types=1);

use Symfony\Component\Yaml\Yaml;

/*
 * Every check here guards a CI trap that fails open: the cache never hits, TIA quietly
 * skips, assert() lines read as uncovered — and the checkmark stays green. The reasoning
 * for each lives in .ai/rules/workflows.md.
 */

function workflowRepositoryRoot(): string
{
    return dirname(__DIR__, 3);
}

/**
 * @return array<string, array<string, mixed>> parsed workflows, keyed by file name
 */
function workflows(): array
{
    $parsed = [];

    foreach (glob(workflowRepositoryRoot().'/.github/workflows/*.{yml,yaml}', GLOB_BRACE) ?: [] as $path) {
        $parsed[basename($path)] = Yaml::parseFile($path);
    }

    return $parsed;
}

/**
 * @return list<array{workflow: string, job: string, steps: list<array<string, mixed>>, services: bool}>
 */
function workflowJobs(): array
{
    $jobs = [];

    foreach (workflows() as $workflow => $definition) {
        foreach ($definition['jobs'] ?? [] as $name => $job) {
            $jobs[] = [
                'workflow' => $workflow,
                'job' => (string) $name,
                'steps' => $job['steps'] ?? [],
                'services' => isset($job['services']),
            ];
        }
    }

    return $jobs;
}

/**
 * @param  array{steps: list<array<string, mixed>>}  $job
 */
function jobRuns(array $job, string $needle): bool
{
    foreach ($job['steps'] as $step) {
        if (str_contains((string) ($step['run'] ?? ''), $needle)) {
            return true;
        }
    }

    return false;
}

it('finds the workflows it guards', function (): void {
    expect(workflows())->not->toBeEmpty();
});

it('hashes only files that exist', function (): void {
    $missing = [];

    foreach (workflows() as $workflow => $definition) {
        $yaml = (string) json_encode($definition, JSON_UNESCAPED_SLASHES);

        preg_match_all('/hashFiles\\(([^)]*)\\)/', $yaml, $calls);

        foreach ($calls[1] as $arguments) {
            preg_match_all("/'([^']+)'/", $arguments, $patterns);

            foreach ($patterns[1] as $pattern) {
                // hashFiles() of nothing is '', which turns the cache key into a constant.
                if (glob(workflowRepositoryRoot().'/'.$pattern) === []) {
                    $missing[] = $workflow.': '.$pattern;
                }
            }
        }
    }

    expect($missing)->toBe([]);
});

it('passes --ci to every coverage run', function (): void {
    $coverageRuns = [];
    $missingFlag = [];

    foreach (workflowJobs() as $job) {
        foreach ($job['steps'] as $step) {
            $run = (string) ($step['run'] ?? '');

            if (! str_contains($run, '--coverage')) {
                continue;
            }

            $coverageRuns[] = $job['job'];

            // Pest reads this literal flag and nothing else to know it is on CI.
            if (! str_contains($run, '--ci')) {
                $missingFlag[] = $job['workflow'].': '.$job['job'];
            }
        }
    }

    expect($coverageRuns)->not->toBeEmpty()
        ->and($missingFlag)->toBe([]);
});

it('enables assertions wherever pest runs, if app/ uses assert()', function (): void {
    $usesAssert = false;

    /** @var SplFileInfo $file */
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator(workflowRepositoryRoot().'/app')) as $file) {
        if ($file->getExtension() === 'php' && preg_match('/\bassert\(/', (string) file_get_contents($file->getPathname())) === 1) {
            $usesAssert = true;

            break;
        }
    }

    $missing = [];

    foreach (workflowJobs() as $job) {
        if (! $usesAssert || ! jobRuns($job, 'pest')) {
            continue;
        }

        $iniValues = '';

        foreach ($job['steps'] as $step) {
            if (str_starts_with((string) ($step['uses'] ?? ''), 'shivammathur/setup-php')) {
                $iniValues .= (string) ($step['with']['ini-values'] ?? '');
            }
        }

        // setup-php installs the production ini, where zend.assertions=-1 strips assert().
        if (! str_contains($iniValues, 'zend.assertions=1')) {
            $missing[] = $job['workflow'].': '.$job['job'];
        }
    }

    expect($missing)->toBe([]);
});

it('neutralises the database driver in every lane that copies .env without a database service', function (): void {
    $unguarded = [];

    foreach (workflowJobs() as $job) {
        if ($job['services'] || ! jobRuns($job, 'cp .env.example .env')) {
            continue;
        }

        if (! jobRuns($job, 'DB_CONNECTION=sqlite')) {
            $unguarded[] = $job['workflow'].': '.$job['job'];
        }
    }

    expect($unguarded)->toBe([]);
});

<?php

declare(strict_types=1);

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    /**
     * phpunit.xml forces the pgsql driver but leaves DB_DATABASE to this checkout's
     * .env.testing, so each worktree owns its test database. The cost of that freedom
     * is that a missing or stale .env.testing resolves to the development database,
     * which RefreshDatabase would then wipe. This runs before the traits boot, so the
     * run dies ahead of the first migration instead of after it.
     */
    protected function refreshApplication(): void
    {
        parent::refreshApplication();

        $connection = config()->string('database.default');
        $database = config()->string("database.connections.{$connection}.database");

        throw_unless(
            str_ends_with($database, '_test'),
            RuntimeException::class,
            "Refusing to run the suite against '{$database}': a test database name must end in '_test'. "
            .'Write this checkout\'s .env.testing from .env.testing.example (see .ai/rules/database.md).',
        );
    }
}

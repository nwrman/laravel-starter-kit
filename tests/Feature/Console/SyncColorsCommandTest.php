<?php

declare(strict_types=1);

use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

beforeEach(function (): void {
    $this->tempDir = sys_get_temp_dir().'/sync-colors-'.Str::random(12);
    File::ensureDirectoryExists($this->tempDir);
    $this->output = $this->tempDir.'/filament-colors.php';
});

afterEach(function (): void {
    if (property_exists($this, 'tempDir') && $this->tempDir !== null && File::isDirectory($this->tempDir)) {
        File::deleteDirectory($this->tempDir);
    }
});

it('generates the filament-colors config file from the real app.css', function (): void {
    $this->artisan('filament:sync-colors', ['--output' => $this->output])
        ->assertSuccessful()
        ->expectsOutputToContain('Filament colors synced');

    expect($this->output)->toBeFile();
});

it('generates all 11 primary shades interpolated from a single --primary token', function (): void {
    $this->artisan('filament:sync-colors', ['--output' => $this->output])->assertSuccessful();

    $colors = require $this->output;

    expect($colors['primary'])
        ->toBeArray()
        ->toHaveKeys([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]);

    foreach ($colors['primary'] as $shade => $value) {
        expect($value)->toStartWith('oklch(', sprintf('Shade %s should be an oklch value', $shade));
    }
});

it('anchors the 500 shade to the source --primary token', function (): void {
    // Starter's --primary is oklch(0.35 0.14 250) — verify 500 preserves it.
    $this->artisan('filament:sync-colors', ['--output' => $this->output])->assertSuccessful();

    $colors = require $this->output;

    expect($colors['primary'][500])->toBe('oklch(0.350 0.140 250.000)');
});

it('extracts the chart colors', function (): void {
    $this->artisan('filament:sync-colors', ['--output' => $this->output])->assertSuccessful();

    $colors = require $this->output;

    expect($colors['chart'])
        ->toBeArray()
        ->toHaveKeys([1, 2, 3, 4, 5]);

    foreach ($colors['chart'] as $index => $value) {
        expect($value)->not->toContain('var(', sprintf('Chart color %s should not contain var() references', $index));
    }
});

it('emits an empty brand section by default', function (): void {
    $this->artisan('filament:sync-colors', ['--output' => $this->output])->assertSuccessful();

    $colors = require $this->output;

    expect($colors['brand'])->toBe([]);
});

it('fails when source css is missing the --primary token', function (): void {
    $source = $this->tempDir.'/app.css';
    File::put($source, "/* no primary token */\n:root { --chart-1: oklch(0.5 0.1 200); }\n");

    $this->artisan('filament:sync-colors', ['--source' => $source, '--output' => $this->output])
        ->assertFailed()
        ->expectsOutputToContain('Could not find --primary CSS variable');
});

it('fails when source css file does not exist', function (): void {
    $this->artisan('filament:sync-colors', ['--source' => $this->tempDir.'/missing.css', '--output' => $this->output])
        ->assertFailed()
        ->expectsOutputToContain('CSS file not found');
});

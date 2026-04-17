<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * Generates config/filament-colors.php from resources/css/app.css OKLCH tokens.
 *
 * Starter-kit adaptation of Minuta's SyncColorsCommand:
 *   - `primary` palette: interpolates an 11-shade ladder from a single
 *     `--primary: oklch(L C H)` token (starter has no --primary-50..900 ladder).
 *   - `brand` palette: keeps the section but with an empty name list; downstream
 *     projects extend BRAND_NAMES and add --color-<name>: ...; tokens to app.css.
 *   - `chart` palette: extracts numeric --chart-N tokens verbatim (matches both
 *     Minuta's ladder and the starter's --chart-1..5 tokens).
 */
final class SyncColorsCommand extends Command
{
    /**
     * Brand token names to extract. Empty by default; extend with names like
     * ['menta', 'lila', 'chartreuse'] and add matching --color-<name> tokens
     * to resources/css/app.css.
     *
     * @var list<string>
     */
    private const array BRAND_NAMES = [];

    protected $signature = 'filament:sync-colors
        {--source= : Path to the source CSS file (defaults to resources/css/app.css)}
        {--output= : Path to write the generated config (defaults to config/filament-colors.php)}';

    protected $description = 'Generate Filament color config from the main app CSS variables';

    public function handle(): int
    {
        $sourceOption = $this->option('source');
        $outputOption = $this->option('output');

        $cssPath = is_string($sourceOption) && $sourceOption !== ''
            ? $sourceOption
            : resource_path('css/app.css');

        $outputPath = is_string($outputOption) && $outputOption !== ''
            ? $outputOption
            : config_path('filament-colors.php');

        if (! file_exists($cssPath)) {
            $this->error('CSS file not found: '.$cssPath);

            return self::FAILURE;
        }

        $css = file_get_contents($cssPath);

        if ($css === false) {
            $this->error('Unable to read CSS file: '.$cssPath);

            return self::FAILURE;
        }

        $varMap = $this->buildVariableMap($css);

        $primary = $this->extractPrimaryBase($css);

        if ($primary === null) {
            $this->error('Could not find --primary CSS variable (oklch) in app.css');

            return self::FAILURE;
        }

        $colors = [
            'primary' => $this->interpolateShades($primary),
            'chart' => $this->extractChart($css, $varMap),
            'brand' => $this->extractBrand($css),
        ];

        file_put_contents($outputPath, $this->buildConfigFile($colors));

        $this->info('Filament colors synced to '.$outputPath);
        $this->table(
            ['Group', 'Keys'],
            collect($colors)->map(fn (array $values, string $group): array => [
                $group,
                $values === [] ? '(empty)' : implode(', ', array_keys($values)),
            ])->values()->all(),
        );

        return self::SUCCESS;
    }

    /**
     * Shade interpolation table. Each entry is [lightness_formula, chroma_scale].
     * Lightness formulas receive the source L (`--primary` lightness, in decimal).
     * Chroma is source_C * scale. Hue is preserved unchanged across the ladder.
     *
     * 500 is the anchor — it returns the source OKLCH verbatim.
     *
     * @return array<int, array{0: callable(float): float, 1: float}>
     */
    private function shadeTable(): array
    {
        return [
            50 => [fn (float $l): float => min(0.99, 0.95 + (1 - $l) * 0.05), 0.15],
            100 => [fn (float $l): float => min(0.98, 0.90 + (1 - $l) * 0.08), 0.30],
            200 => [fn (float $_l): float => 0.82, 0.55],
            300 => [fn (float $_l): float => 0.73, 0.75],
            400 => [fn (float $_l): float => 0.64, 0.90],
            500 => [fn (float $l): float => $l, 1.00],
            600 => [fn (float $l): float => max(0.32, $l * 0.85), 0.92],
            700 => [fn (float $l): float => max(0.26, $l * 0.70), 0.80],
            800 => [fn (float $l): float => max(0.20, $l * 0.55), 0.65],
            900 => [fn (float $l): float => max(0.14, $l * 0.40), 0.45],
            950 => [fn (float $l): float => max(0.08, $l * 0.28), 0.30],
        ];
    }

    /**
     * Extract the base --primary token as [L, C, H] in decimal form.
     *
     * @return array{0: float, 1: float, 2: float}|null
     */
    private function extractPrimaryBase(string $css): ?array
    {
        if (preg_match('/--primary:\s*oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*\)/', $css, $m) !== 1) {
            return null;
        }

        return [
            $this->toDecimalLightness($m[1]),
            (float) $m[2],
            (float) $m[3],
        ];
    }

    /**
     * Interpolate an 11-shade OKLCH ladder from the source [L, C, H].
     *
     * @param  array{0: float, 1: float, 2: float}  $base
     * @return array<int, string>
     */
    private function interpolateShades(array $base): array
    {
        [$l, $c, $h] = $base;

        $shades = [];
        foreach ($this->shadeTable() as $shade => [$lFn, $cScale]) {
            $lOut = $lFn($l);
            $cOut = $c * $cScale;
            $shades[$shade] = sprintf(
                'oklch(%s %s %s)',
                number_format($lOut, 3),
                number_format($cOut, 3),
                number_format($h, 3),
            );
        }

        ksort($shades);

        return $shades;
    }

    /**
     * Extract --chart-N tokens and resolve any var() references.
     *
     * @param  array<string, string>  $varMap
     * @return array<int, string>
     */
    private function extractChart(string $css, array $varMap): array
    {
        preg_match_all('/--chart-(\d+):\s*([^;]+);/', $css, $matches, PREG_SET_ORDER);

        $chart = [];
        foreach ($matches as $match) {
            $value = $this->normalizeValue(mb_trim($match[2]));
            $chart[(int) $match[1]] = $this->resolveVarReferences($value, $varMap);
        }

        ksort($chart);

        return $chart;
    }

    /**
     * Extract --color-<name> brand tokens from BRAND_NAMES.
     * Returns empty array when no BRAND_NAMES are configured.
     *
     * @return array<string, string>
     */
    private function extractBrand(string $css): array
    {
        /** @var list<string> $names */
        $names = self::BRAND_NAMES;

        if (count($names) === 0) {
            return [];
        }

        $pattern = '/--color-('.implode('|', array_map(preg_quote(...), $names)).'):\s*([^;]+);/';

        preg_match_all($pattern, $css, $matches, PREG_SET_ORDER);

        $brand = [];
        foreach ($matches as $match) {
            $brand[$match[1]] = mb_trim($match[2]);
        }

        return $brand;
    }

    /**
     * Convert an OKLCH lightness token (with or without %) to decimal.
     */
    private function toDecimalLightness(string $raw): float
    {
        if (str_ends_with($raw, '%')) {
            return (float) mb_rtrim($raw, '%') / 100;
        }

        return (float) $raw;
    }

    /**
     * Normalize OKLCH percentage notation to decimal (97.2% → 0.972).
     * Preserves non-oklch values verbatim.
     */
    private function normalizeValue(string $value): string
    {
        $value = (string) preg_replace('/\/\*.*?\*\//', '', $value);
        $value = mb_trim($value);

        return (string) preg_replace_callback(
            '/oklch\(\s*([\d.]+)%/',
            fn (array $m): string => sprintf('oklch(%s', number_format((float) $m[1] / 100, 3)),
            $value,
        );
    }

    /**
     * Build a lookup map of all CSS custom properties in the file.
     *
     * @return array<string, string>
     */
    private function buildVariableMap(string $css): array
    {
        preg_match_all('/--([\w-]+):\s*([^;]+);/', $css, $matches, PREG_SET_ORDER);

        $map = [];
        foreach ($matches as $match) {
            $map['--'.$match[1]] = $this->normalizeValue(mb_trim($match[2]));
        }

        return $map;
    }

    /**
     * Resolve var(--name) references to their actual values.
     *
     * @param  array<string, string>  $varMap
     */
    private function resolveVarReferences(string $value, array $varMap): string
    {
        return (string) preg_replace_callback(
            '/var\(\s*(--[\w-]+)\s*\)/',
            fn (array $m): string => $varMap[$m[1]] ?? $m[0],
            $value,
        );
    }

    /**
     * Build the PHP config file contents.
     *
     * @param  array{primary: array<int, string>, chart: array<int, string>, brand: array<string, string>}  $colors
     */
    private function buildConfigFile(array $colors): string
    {
        $lines = [
            '<?php',
            '',
            'declare(strict_types=1);',
            '',
            '// Auto-generated by `php artisan filament:sync-colors`',
            '// Source: resources/css/app.css',
            '',
            'return [',
        ];

        $lines[] = "    'primary' => [";
        foreach ($colors['primary'] as $shade => $value) {
            $lines[] = sprintf("        %d => '%s',", $shade, $value);
        }

        $lines[] = '    ],';
        $lines[] = '';

        $lines[] = "    'chart' => [";
        foreach ($colors['chart'] as $index => $value) {
            $lines[] = sprintf("        %d => '%s',", $index, $value);
        }

        $lines[] = '    ],';
        $lines[] = '';

        $lines[] = "    'brand' => [";
        foreach ($colors['brand'] as $name => $value) {
            $lines[] = sprintf("        '%s' => '%s',", $name, $value);
        }

        $lines[] = '    ],';

        $lines[] = '];';
        $lines[] = '';

        return implode("\n", $lines);
    }
}

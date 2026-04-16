<?php

declare(strict_types=1);

namespace App\Http\Controllers\Project;

use App\Services\DemoDataService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final readonly class ProjectController
{
    public function __construct(private DemoDataService $demo)
    {
        //
    }

    public function index(): Response
    {
        return Inertia::render('projects/index', [
            'kpiStats' => $this->demo->projectKpis(),
            'tableData' => Inertia::defer(function (): array {
                $this->demo->sleep('DEMO_LATENCY_TABLE_MS');

                return $this->demo->projectTableData();
            }, 'tableData'),
            'chartData' => Inertia::defer(function (): array {
                $this->demo->sleep('DEMO_LATENCY_CHARTS_MS');

                return $this->demo->projectTableData();
            }, 'chartData'),
        ]);
    }

    public function show(int $project): Response
    {
        $record = $this->demo->projectById($project);

        abort_unless($record !== null, 404);

        return Inertia::render('projects/show', [
            'project' => $record,
            'activity' => Inertia::defer(function () use ($project): array {
                $this->demo->sleep('DEMO_LATENCY_DETAIL_MS');

                return $this->demo->projectActivity($project);
            }, 'activity'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('projects/create');
    }

    public function store(): RedirectResponse
    {
        // Demo: no persistence, just flash success and redirect
        return to_route('projects.index')->with('success', 'Proyecto creado exitosamente.');
    }
}

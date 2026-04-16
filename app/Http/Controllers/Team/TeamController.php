<?php

declare(strict_types=1);

namespace App\Http\Controllers\Team;

use App\Services\DemoDataService;
use Inertia\Inertia;
use Inertia\Response;

final readonly class TeamController
{
    public function __construct(private DemoDataService $demo)
    {
        //
    }

    public function index(): Response
    {
        return Inertia::render('team/index', [
            'kpiStats' => $this->demo->teamKpis(),
            'tableData' => Inertia::defer(function (): array {
                $this->demo->sleep('DEMO_LATENCY_TABLE_MS');

                return $this->demo->teamTableData();
            }, 'tableData'),
        ]);
    }
}

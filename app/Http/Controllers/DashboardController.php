<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\DemoDataService;
use Inertia\Inertia;
use Inertia\Response;

final readonly class DashboardController
{
    public function __construct(private DemoDataService $demo)
    {
        //
    }

    public function index(): Response
    {
        return Inertia::render('dashboard', [
            'kpiStats' => $this->demo->dashboardKpis(),
            'charts' => Inertia::defer(function (): array {
                $this->demo->sleep('DEMO_LATENCY_CHARTS_MS');

                return $this->demo->dashboardCharts();
            }, 'charts'),
            'feed' => Inertia::defer(function (): array {
                $this->demo->sleep('DEMO_LATENCY_FEED_MS');

                return $this->demo->dashboardFeed();
            }, 'feed'),
        ]);
    }
}

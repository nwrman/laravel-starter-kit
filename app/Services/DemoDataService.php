<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Sleep;

/**
 * Provides hardcoded Acme Corp demo data for the starter kit.
 *
 * Configurable artificial latency per data group is controlled via env variables:
 *   DEMO_LATENCY_CHARTS_MS, DEMO_LATENCY_FEED_MS, DEMO_LATENCY_TABLE_MS, DEMO_LATENCY_DETAIL_MS
 *
 * Latency is disabled automatically in the testing environment.
 */
final class DemoDataService
{
    public function sleep(string $envKey): void
    {
        if (app()->environment('testing')) {
            return;
        }

        $ms = (int) env($envKey, 0); // @phpstan-ignore larastan.noEnvCallsOutsideOfConfig

        if ($ms > 0) {
            Sleep::usleep($ms * 1_000);
        }
    }

    // -------------------------------------------------------------------------
    // Dashboard
    // -------------------------------------------------------------------------

    /**
     * @return array<int, array{title: string, value: string, description: string, trend: array{direction: string, value: string}, icon: string}>
     */
    public function dashboardKpis(): array
    {
        return [
            [
                'title' => 'Ingresos Mensuales',
                'value' => '$1.2M',
                'description' => 'vs mes anterior',
                'trend' => ['direction' => 'up', 'value' => '+8%'],
                'icon' => 'banknote',
            ],
            [
                'title' => 'Proyectos Activos',
                'value' => '24',
                'description' => 'vs mes anterior',
                'trend' => ['direction' => 'up', 'value' => '+12%'],
                'icon' => 'folder',
            ],
            [
                'title' => 'Miembros del Equipo',
                'value' => '48',
                'description' => 'vs trimestre anterior',
                'trend' => ['direction' => 'up', 'value' => '+4%'],
                'icon' => 'users',
            ],
            [
                'title' => 'Tasa de Completados',
                'value' => '87.3%',
                'description' => 'vs año anterior',
                'trend' => ['direction' => 'down', 'value' => '-2%'],
                'icon' => 'check-circle',
            ],
        ];
    }

    /**
     * @return array{monthlyRevenue: array<int, array{month: string, revenue: int}>, revenueTotal: int, projectStatuses: array<int, array{status: string, count: int, fill: string}>, projectTotal: int}
     */
    public function dashboardCharts(): array
    {
        $monthlyRevenue = [
            ['month' => 'Ene', 'revenue' => 980_000],
            ['month' => 'Feb', 'revenue' => 870_000],
            ['month' => 'Mar', 'revenue' => 1_050_000],
            ['month' => 'Abr', 'revenue' => 1_120_000],
            ['month' => 'May', 'revenue' => 1_080_000],
            ['month' => 'Jun', 'revenue' => 1_230_000],
            ['month' => 'Jul', 'revenue' => 1_190_000],
            ['month' => 'Ago', 'revenue' => 1_100_000],
            ['month' => 'Sep', 'revenue' => 1_150_000],
            ['month' => 'Oct', 'revenue' => 1_200_000],
            ['month' => 'Nov', 'revenue' => 1_130_000],
            ['month' => 'Dic', 'revenue' => 1_300_000],
        ];

        $revenueTotal = array_sum(array_column($monthlyRevenue, 'revenue'));

        $projectStatuses = [
            ['status' => 'Activo', 'count' => 24, 'fill' => 'var(--color-activo)'],
            ['status' => 'Completado', 'count' => 38, 'fill' => 'var(--color-completado)'],
            ['status' => 'En Espera', 'count' => 8, 'fill' => 'var(--color-en-espera)'],
            ['status' => 'Planificación', 'count' => 5, 'fill' => 'var(--color-planificacion)'],
        ];

        $projectTotal = array_sum(array_column($projectStatuses, 'count'));

        return ['monthlyRevenue' => $monthlyRevenue, 'revenueTotal' => $revenueTotal, 'projectStatuses' => $projectStatuses, 'projectTotal' => $projectTotal];
    }

    /**
     * @return array{recentActivity: array<int, array{id: string, initials: string, name: string, action: string, timestamp: string}>, dashboardAlerts: array<int, array{id: string, type: string, title: string, description: string, metric: string|null}>}
     */
    public function dashboardFeed(): array
    {
        $recentActivity = [
            ['id' => '1', 'initials' => 'JS', 'name' => 'Jane Smith', 'action' => 'completó el hito de Rediseño Web', 'timestamp' => 'hace 2m'],
            ['id' => '2', 'initials' => 'CR', 'name' => 'Carlos Rivera', 'action' => 'creó el proyecto App Móvil v2', 'timestamp' => 'hace 15m'],
            ['id' => '3', 'initials' => 'AL', 'name' => 'Ana López', 'action' => 'aprobó presupuesto de $45,200 para Infraestructura Cloud', 'timestamp' => 'hace 32m'],
            ['id' => '4', 'initials' => 'MT', 'name' => 'Miguel Torres', 'action' => 'actualizó las especificaciones del API Gateway', 'timestamp' => 'hace 1h'],
            ['id' => '5', 'initials' => 'LM', 'name' => 'Laura Martínez', 'action' => 'cerró el proyecto de Migración de Base de Datos', 'timestamp' => 'hace 2h'],
        ];

        $dashboardAlerts = [
            ['id' => 'deadline', 'type' => 'warning', 'title' => 'Proyectos por vencer', 'description' => '3 proyectos se acercan a su fecha límite', 'metric' => '3'],
            ['id' => 'completion', 'type' => 'success', 'title' => 'Tasa de completados del trimestre', 'description' => '87.3% (↑ desde 82.1% trimestre anterior)', 'metric' => '87.3%'],
        ];

        return ['recentActivity' => $recentActivity, 'dashboardAlerts' => $dashboardAlerts];
    }

    // -------------------------------------------------------------------------
    // Projects
    // -------------------------------------------------------------------------

    /**
     * @return array<int, array{title: string, value: string, description: string, trend: array{direction: string, value: string}, icon: string}>
     */
    public function projectKpis(): array
    {
        return [
            [
                'title' => 'Proyectos Activos',
                'value' => '24',
                'description' => 'vs mes anterior',
                'trend' => ['direction' => 'up', 'value' => '+3'],
                'icon' => 'folder',
            ],
            [
                'title' => 'Presupuesto Total',
                'value' => '$2.4M',
                'description' => 'vs trimestre anterior',
                'trend' => ['direction' => 'up', 'value' => '+15%'],
                'icon' => 'banknote',
            ],
            [
                'title' => 'Completados este Mes',
                'value' => '7',
                'description' => 'vs mes anterior',
                'trend' => ['direction' => 'up', 'value' => '+2'],
                'icon' => 'check-circle',
            ],
        ];
    }

    /**
     * @return array{projectRows: array<int, array{id: int, name: string, status: string, teamLead: string, budget: int, deadline: string, progress: int}>, projectMonthly: array<int, array{month: string, completed: int, started: int}>}
     */
    public function projectTableData(): array
    {
        $projectRows = [
            ['id' => 1, 'name' => 'Rediseño Web Corporativo', 'status' => 'Activo', 'teamLead' => 'Jane Smith', 'budget' => 180_000, 'deadline' => '2026-06-15', 'progress' => 72],
            ['id' => 2, 'name' => 'App Móvil v2', 'status' => 'Activo', 'teamLead' => 'Carlos Rivera', 'budget' => 320_000, 'deadline' => '2026-08-30', 'progress' => 45],
            ['id' => 3, 'name' => 'Migración a Cloud', 'status' => 'Activo', 'teamLead' => 'Ana López', 'budget' => 450_000, 'deadline' => '2026-07-20', 'progress' => 60],
            ['id' => 4, 'name' => 'API Gateway', 'status' => 'Activo', 'teamLead' => 'Miguel Torres', 'budget' => 95_000, 'deadline' => '2026-05-10', 'progress' => 88],
            ['id' => 5, 'name' => 'Dashboard de Analytics', 'status' => 'Activo', 'teamLead' => 'Laura Martínez', 'budget' => 120_000, 'deadline' => '2026-06-28', 'progress' => 35],
            ['id' => 6, 'name' => 'Sistema de Pagos', 'status' => 'Activo', 'teamLead' => 'Roberto Sánchez', 'budget' => 280_000, 'deadline' => '2026-09-15', 'progress' => 20],
            ['id' => 7, 'name' => 'Portal de Clientes', 'status' => 'Completado', 'teamLead' => 'Jane Smith', 'budget' => 150_000, 'deadline' => '2026-03-01', 'progress' => 100],
            ['id' => 8, 'name' => 'Migración de Base de Datos', 'status' => 'Completado', 'teamLead' => 'Laura Martínez', 'budget' => 85_000, 'deadline' => '2026-02-15', 'progress' => 100],
            ['id' => 9, 'name' => 'Rediseño de Landing Page', 'status' => 'Completado', 'teamLead' => 'Carlos Rivera', 'budget' => 45_000, 'deadline' => '2026-01-30', 'progress' => 100],
            ['id' => 10, 'name' => 'Integración CRM', 'status' => 'En Espera', 'teamLead' => 'Miguel Torres', 'budget' => 200_000, 'deadline' => '2026-10-01', 'progress' => 10],
            ['id' => 11, 'name' => 'Automatización de Testing', 'status' => 'En Espera', 'teamLead' => 'Roberto Sánchez', 'budget' => 75_000, 'deadline' => '2026-11-15', 'progress' => 5],
            ['id' => 12, 'name' => 'Plataforma de E-learning', 'status' => 'Planificación', 'teamLead' => 'Ana López', 'budget' => 350_000, 'deadline' => '2027-01-15', 'progress' => 0],
            ['id' => 13, 'name' => 'App de Inventario', 'status' => 'Planificación', 'teamLead' => 'Jane Smith', 'budget' => 160_000, 'deadline' => '2027-03-01', 'progress' => 0],
            ['id' => 14, 'name' => 'Chatbot con IA', 'status' => 'Activo', 'teamLead' => 'Laura Martínez', 'budget' => 110_000, 'deadline' => '2026-07-01', 'progress' => 55],
            ['id' => 15, 'name' => 'Refactor del Monolito', 'status' => 'Activo', 'teamLead' => 'Miguel Torres', 'budget' => 500_000, 'deadline' => '2026-12-31', 'progress' => 30],
        ];

        $projectMonthly = [
            ['month' => 'Ene', 'completed' => 2, 'started' => 3],
            ['month' => 'Feb', 'completed' => 1, 'started' => 2],
            ['month' => 'Mar', 'completed' => 3, 'started' => 4],
            ['month' => 'Abr', 'completed' => 2, 'started' => 1],
            ['month' => 'May', 'completed' => 1, 'started' => 3],
            ['month' => 'Jun', 'completed' => 4, 'started' => 2],
            ['month' => 'Jul', 'completed' => 2, 'started' => 3],
            ['month' => 'Ago', 'completed' => 3, 'started' => 1],
            ['month' => 'Sep', 'completed' => 1, 'started' => 4],
            ['month' => 'Oct', 'completed' => 2, 'started' => 2],
            ['month' => 'Nov', 'completed' => 3, 'started' => 3],
            ['month' => 'Dic', 'completed' => 5, 'started' => 1],
        ];

        return ['projectRows' => $projectRows, 'projectMonthly' => $projectMonthly];
    }

    /**
     * @return array{activityStats: array<int, array{title: string, value: string, description: string, trend: array{direction: string, value: string}, icon: string}>, billingMonthly: array<int, array{month: string, amount: int}>}
     */
    public function projectActivity(int $id): array
    {
        $seed = $id * 137;
        $baseAmount = 10_000 + ($seed % 40_000);
        $months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        $factors = [88, 76, 95, 102, 91, 110, 105, 97, 108, 115, 99, 120];

        $billingMonthly = [];

        foreach ($months as $i => $month) {
            $variation = ($seed * ($i + 1)) % 5_000;
            $billingMonthly[] = [
                'month' => $month,
                'amount' => (int) ($baseAmount * $factors[$i] / 100) + $variation,
            ];
        }

        $totalSpent = array_sum(array_column($billingMonthly, 'amount'));
        $totalK = number_format($totalSpent / 1_000, 0);

        $record = $this->projectById($id);
        $progressPct = $record !== null ? $record['progress'] : 0;

        $trendPct = ($seed % 20) - 5;
        $trendDirection = $trendPct >= 0 ? 'up' : 'down';
        $trendValue = ($trendPct >= 0 ? '+' : '').$trendPct.'%';

        $activityStats = [
            [
                'title' => 'Gasto Total',
                'value' => sprintf('$%sK', $totalK),
                'description' => 'últimos 12 meses',
                'trend' => ['direction' => $trendDirection, 'value' => $trendValue],
                'icon' => 'banknote',
            ],
            [
                'title' => 'Progreso',
                'value' => $progressPct.'%',
                'description' => 'del proyecto',
                'trend' => ['direction' => 'neutral', 'value' => '─'],
                'icon' => 'trending-up',
            ],
            [
                'title' => 'Equipo Asignado',
                'value' => (string) (3 + ($seed % 8)),
                'description' => 'miembros activos',
                'trend' => ['direction' => 'up', 'value' => 'Completo'],
                'icon' => 'users',
            ],
        ];

        return ['activityStats' => $activityStats, 'billingMonthly' => $billingMonthly];
    }

    /**
     * @return array{id: int, name: string, status: string, teamLead: string, budget: int, deadline: string, progress: int}|null
     */
    public function projectById(int $id): ?array
    {
        $rows = $this->projectTableData()['projectRows'];

        foreach ($rows as $row) {
            if ($row['id'] === $id) {
                return $row;
            }
        }

        return null;
    }

    // -------------------------------------------------------------------------
    // Team
    // -------------------------------------------------------------------------

    /**
     * @return array<int, array{title: string, value: string, description: string, trend: array{direction: string, value: string}, icon: string}>
     */
    public function teamKpis(): array
    {
        return [
            [
                'title' => 'Total Miembros',
                'value' => '48',
                'description' => 'vs trimestre anterior',
                'trend' => ['direction' => 'up', 'value' => '+4'],
                'icon' => 'users',
            ],
            [
                'title' => 'Departamentos',
                'value' => '6',
                'description' => 'sin cambio',
                'trend' => ['direction' => 'neutral', 'value' => '0'],
                'icon' => 'building',
            ],
            [
                'title' => 'Utilización Promedio',
                'value' => '84%',
                'description' => 'vs mes anterior',
                'trend' => ['direction' => 'up', 'value' => '+3%'],
                'icon' => 'activity',
            ],
        ];
    }

    /**
     * @return array{teamRows: array<int, array{id: int, name: string, role: string, email: string, department: string, status: string, utilization: int}>, departmentDistribution: array<int, array{department: string, count: int, fill: string}>}
     */
    public function teamTableData(): array
    {
        $teamRows = [
            ['id' => 1, 'name' => 'Jane Smith', 'role' => 'Directora de Ingeniería', 'email' => 'jane@acmecorp.com', 'department' => 'Ingeniería', 'status' => 'Activo', 'utilization' => 92],
            ['id' => 2, 'name' => 'Carlos Rivera', 'role' => 'Desarrollador Senior', 'email' => 'carlos@acmecorp.com', 'department' => 'Ingeniería', 'status' => 'Activo', 'utilization' => 88],
            ['id' => 3, 'name' => 'Ana López', 'role' => 'Gerente de Proyectos', 'email' => 'ana@acmecorp.com', 'department' => 'Gestión', 'status' => 'Activo', 'utilization' => 95],
            ['id' => 4, 'name' => 'Miguel Torres', 'role' => 'Arquitecto de Software', 'email' => 'miguel@acmecorp.com', 'department' => 'Ingeniería', 'status' => 'Activo', 'utilization' => 78],
            ['id' => 5, 'name' => 'Laura Martínez', 'role' => 'Diseñadora UX/UI', 'email' => 'laura@acmecorp.com', 'department' => 'Diseño', 'status' => 'Activo', 'utilization' => 85],
            ['id' => 6, 'name' => 'Roberto Sánchez', 'role' => 'Ingeniero DevOps', 'email' => 'roberto@acmecorp.com', 'department' => 'Infraestructura', 'status' => 'Activo', 'utilization' => 90],
            ['id' => 7, 'name' => 'María García', 'role' => 'Analista de Datos', 'email' => 'maria@acmecorp.com', 'department' => 'Datos', 'status' => 'Activo', 'utilization' => 82],
            ['id' => 8, 'name' => 'Fernando Ruiz', 'role' => 'Desarrollador Frontend', 'email' => 'fernando@acmecorp.com', 'department' => 'Ingeniería', 'status' => 'Activo', 'utilization' => 75],
            ['id' => 9, 'name' => 'Sofía Hernández', 'role' => 'QA Lead', 'email' => 'sofia@acmecorp.com', 'department' => 'Calidad', 'status' => 'Activo', 'utilization' => 88],
            ['id' => 10, 'name' => 'Diego Morales', 'role' => 'Desarrollador Backend', 'email' => 'diego@acmecorp.com', 'department' => 'Ingeniería', 'status' => 'Activo', 'utilization' => 91],
            ['id' => 11, 'name' => 'Valentina Cruz', 'role' => 'Diseñadora Gráfica', 'email' => 'valentina@acmecorp.com', 'department' => 'Diseño', 'status' => 'Licencia', 'utilization' => 0],
            ['id' => 12, 'name' => 'Andrés Peña', 'role' => 'Ingeniero de Seguridad', 'email' => 'andres@acmecorp.com', 'department' => 'Infraestructura', 'status' => 'Activo', 'utilization' => 70],
        ];

        $departmentDistribution = [
            ['department' => 'Ingeniería', 'count' => 20, 'fill' => 'var(--color-ingenieria)'],
            ['department' => 'Diseño', 'count' => 8, 'fill' => 'var(--color-diseno)'],
            ['department' => 'Gestión', 'count' => 6, 'fill' => 'var(--color-gestion)'],
            ['department' => 'Infraestructura', 'count' => 5, 'fill' => 'var(--color-infraestructura)'],
            ['department' => 'Datos', 'count' => 5, 'fill' => 'var(--color-datos)'],
            ['department' => 'Calidad', 'count' => 4, 'fill' => 'var(--color-calidad)'],
        ];

        return ['teamRows' => $teamRows, 'departmentDistribution' => $departmentDistribution];
    }
}

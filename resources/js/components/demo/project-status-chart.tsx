import { Label, Pie, PieChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { ProjectStatus } from '@/types/demo';

const chartConfig = {
  count: { label: 'Proyectos' },
  activo: { label: 'Activo', color: '#2563eb' },
  completado: { label: 'Completado', color: '#16a34a' },
  'en-espera': { label: 'En Espera', color: '#f59e0b' },
  planificacion: { label: 'Planificación', color: '#94a3b8' },
} satisfies ChartConfig;

const statusColors = ['#2563eb', '#16a34a', '#f59e0b', '#94a3b8'];

type Props = {
  projectStatuses: ProjectStatus[];
  projectTotal: number;
};

export function ProjectStatusChart({ projectStatuses, projectTotal }: Props) {
  const chartData = projectStatuses.map((s) => ({
    status: s.status.toLowerCase().replace(/ /g, '-'),
    count: s.count,
    fill: `var(--color-${s.status
      .toLowerCase()
      .replace(/ /g, '-')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')})`,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>Estado actual</CardDescription>
        <CardTitle className="text-2xl">Proyectos</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              innerRadius={60}
              strokeWidth={4}
              stroke="hsl(var(--background))"
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {projectTotal.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 20}
                          className="fill-muted-foreground text-xs"
                        >
                          Proyectos
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {projectStatuses.map((s, i) => (
            <div key={s.status} className="flex items-center gap-2 text-sm">
              <div
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: statusColors[i] }}
              />
              <span className="text-muted-foreground">{s.status}</span>
              <span className="ml-auto font-medium tabular-nums">{s.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

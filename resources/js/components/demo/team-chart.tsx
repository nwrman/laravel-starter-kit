import { Label, Pie, PieChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { DepartmentDistribution } from '@/types/demo';

const chartConfig = {
  count: { label: 'Miembros' },
  ingenieria: { label: 'Ingeniería', color: '#2563eb' },
  diseno: { label: 'Diseño', color: '#8b5cf6' },
  gestion: { label: 'Gestión', color: '#16a34a' },
  infraestructura: { label: 'Infraestructura', color: '#f59e0b' },
  datos: { label: 'Datos', color: '#ec4899' },
  calidad: { label: 'Calidad', color: '#94a3b8' },
} satisfies ChartConfig;

const deptColors = ['#2563eb', '#8b5cf6', '#16a34a', '#f59e0b', '#ec4899', '#94a3b8'];

type Props = {
  departments: DepartmentDistribution[];
  total: number;
};

export function TeamChart({ departments, total }: Props) {
  const chartData = departments.map((d) => ({
    department: d.department
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ /g, '-'),
    count: d.count,
    fill: `var(--color-${d.department
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ /g, '-')})`,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>Distribución actual</CardDescription>
        <CardTitle className="text-2xl">Equipo por Departamento</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="department"
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
                          {total}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 20}
                          className="fill-muted-foreground text-xs"
                        >
                          Miembros
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
          {departments.map((d, i) => (
            <div key={d.department} className="flex items-center gap-2 text-sm">
              <div
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: deptColors[i] }}
              />
              <span className="text-muted-foreground">{d.department}</span>
              <span className="ml-auto font-medium tabular-nums">{d.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

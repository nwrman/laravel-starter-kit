import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { ProjectMonthly } from '@/types/demo';

const chartConfig = {
  completed: {
    label: 'Completados',
    color: '#16a34a',
  },
  started: {
    label: 'Iniciados',
    color: '#2563eb',
  },
} satisfies ChartConfig;

type Props = {
  data: ProjectMonthly[];
};

export function ProjectChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Últimos 12 meses</CardDescription>
        <CardTitle className="text-xl">Proyectos por Mes</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={30} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="completed" fill="var(--color-completed)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="started" fill="var(--color-started)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

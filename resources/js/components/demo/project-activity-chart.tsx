import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

type MonthlyAmount = {
  month: string;
  amount: number;
};

const chartConfig = {
  amount: {
    label: 'Gasto',
    color: '#2563eb',
  },
} satisfies ChartConfig;

function formatCurrency(value: number): string {
  return `$${(value / 1_000).toFixed(0)}K`;
}

type Props = {
  data: MonthlyAmount[];
};

export function ProjectActivityChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Últimos 12 meses</CardDescription>
        <CardTitle className="text-xl">Gasto del Proyecto</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-amount)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-amount)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatCurrency}
              width={50}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value) => (
                    <span className="font-mono font-medium">
                      ${Number(value).toLocaleString('es-MX')}
                    </span>
                  )}
                />
              }
            />
            <Area
              dataKey="amount"
              type="monotone"
              fill="url(#fillAmount)"
              stroke="var(--color-amount)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

import { TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { MonthlyRevenue } from '@/types/demo';

const chartConfig = {
  revenue: {
    label: 'Ingresos',
    color: '#2563eb',
  },
} satisfies ChartConfig;

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  return `$${(value / 1_000).toFixed(0)}K`;
}

type Props = {
  monthlyRevenue: MonthlyRevenue[];
  revenueTotal: number;
};

export function RevenueChart({ monthlyRevenue, revenueTotal }: Props) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardDescription>Últimos 12 meses</CardDescription>
        <CardTitle className="flex items-baseline gap-2 text-2xl">
          {formatCurrency(revenueTotal)}
          <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
            <TrendingUp className="size-4" />
            +8%
          </span>
        </CardTitle>
        <CardDescription>Ingresos Mensuales</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatCurrency}
              width={55}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value) => (
                    <span className="font-mono font-medium">
                      ${Number(value).toLocaleString('es-MX')} MXN
                    </span>
                  )}
                />
              }
            />
            <Area
              dataKey="revenue"
              type="monotone"
              fill="url(#fillRevenue)"
              stroke="var(--color-revenue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

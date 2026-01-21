"use client";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ReactElement } from "react";

interface CustomLineChartProps {
  data: any[];
  chartConfig: ChartConfig;
  title: string;
  icon: ReactElement;
  dataKey: string;
  xAxisKey: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
  yFormatter?: (value: number) => string;
}

export function CustomLineChart({ data, chartConfig, title, icon, dataKey, xAxisKey, yAxisLabel, xAxisLabel, yFormatter }: CustomLineChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
            <span className="flex justify-center items-center rounded-full bg-[#F9F7F8] size-10">
                {icon}
            </span>
            {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              label={{ value: xAxisLabel, position: "insideBottom", offset: 0 }}
            />
            <YAxis
                label={{ value: yAxisLabel, angle: -90, position: "insideLeft" }}
                tickFormatter={yFormatter}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey={dataKey}
              type="monotone"
              fill="var(--color-primary)"
              fillOpacity={0.4}
              stroke="var(--color-primary)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

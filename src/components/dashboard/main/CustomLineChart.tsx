"use client";

import { ReactElement } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { convertFromCanonical } from "@/lib/units";
import { formatNumber } from "@/lib/utils";

interface CustomLineChartProps {
  data: any[];
  chartConfig: ChartConfig;
  title: string;
  icon: ReactElement;
  /** Can be a single string or an array of strings for multiple lines */
  dataKey: string | string[];
  xAxisKey: string;
  isDate?: boolean;
}

const capitalizeFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const formatHeaderDate = (d: Date) => {
  const weekday = capitalizeFirst(
    new Intl.DateTimeFormat("es-ES", { weekday: "long" }).format(d)
  );
  const rest = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
  return `${weekday} ${rest}`;
};

function CustomTooltip({ active, payload, config }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const row = payload[0]?.payload;
  const dateVal = row?.date;
  let header = "";

  if (dateVal) {
    const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
    if (!isNaN(d.getTime())) {
      header = formatHeaderDate(d);
    }
  }

  return (
    <div className="grid min-w-[200px] gap-2 rounded-md border bg-background p-3 text-sm shadow-md">
      {header && (
        <div className="text-xs text-muted-foreground mb-1">{header}</div>
      )}
      <div className="grid gap-1.5">
        {payload.map((p: any) => {
          const key = p.dataKey;
          const label = config[key]?.label ?? key;
          const color = p.stroke || p.fill || "var(--foreground)";
          const value = Number(p.value ?? 0);

          return (
            <div key={key} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-muted-foreground">{label}</span>
              </div>
              <span className="font-medium tabular-nums">
                {`${formatNumber(convertFromCanonical(value, "kg"))} kg`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CustomLineChart({
  data,
  chartConfig,
  title,
  icon,
  dataKey,
  xAxisKey,
  isDate = false,
}: CustomLineChartProps) {
  const keys = Array.isArray(dataKey) ? dataKey : [dataKey];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <span className="flex justify-center items-center rounded-full bg-[#F9F7F8] size-10 text-muted-foreground">
            {icon}
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 20, // Space for labels
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                if (!isDate) return value;
                try {
                  return new Intl.DateTimeFormat("es-ES", {
                    day: "2-digit",
                    month: "short",
                  }).format(new Date(value));
                } catch {
                  return value;
                }
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={80} // Fixes the clipping issue
              tickFormatter={(value) =>
                `${convertFromCanonical(value, "kg").toFixed(0)} kg`
              }
            />
            <ChartTooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={<CustomTooltip config={chartConfig} />}
            />
            {keys.map((key) => (
              <Area
                key={key}
                dataKey={key}
                type="monotone"
                stroke={`var(--color-${key})`}
                fill={`var(--color-${key})`}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

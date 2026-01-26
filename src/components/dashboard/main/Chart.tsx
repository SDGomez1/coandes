"use client";

import { ChartColumnBig } from "lucide-react";
import {
  Area,
  AreaChart,
  XAxis,
  CartesianGrid,
  YAxis,
  type TooltipProps,
} from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { convertFromCanonical, convertToCanonical } from "@/lib/units";
import { formatNumber } from "@/lib/utils";

export const description = "Two-line area chart with real Date objects";

const chartConfig = {
  despachos: { label: "Despachos", color: "var(--chart-1)" },
  compras: { label: "Compras", color: "var(--chart-2)" },
} satisfies ChartConfig;

const formatInKg = (n: number) => `${(n / 1000).toFixed(2)} kg`;

const capitalizeFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const formatHeaderDate = (d: Date) => {
  const weekday = capitalizeFirst(
    new Intl.DateTimeFormat("es-ES", { weekday: "long" }).format(d),
  );
  const rest = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
  return `${weekday} ${rest}`;
};

// Fully custom tooltip content to match the screenshot
function CustomTooltip(props: any) {
  const { active, payload } = props;
  if (!active || !payload || payload.length === 0) return null;

  // Original row (contains the Date object)
  const row = payload[0]?.payload as {
    date?: Date | number | string;
    [k: string]: unknown;
  };

  // Safe date extraction
  const dateVal = row?.date;
  const d =
    dateVal instanceof Date
      ? dateVal
      : typeof dateVal === "number"
        ? new Date(dateVal)
        : typeof dateVal === "string"
          ? new Date(dateVal)
          : undefined;

  const header = d ? formatHeaderDate(d) : "";

  const total =
    payload.reduce((sum: any, p: any) => {
      const v = typeof p.value === "number" ? p.value : Number(p.value ?? 0);
      return sum + (Number.isFinite(v) ? v : 0);
    }, 0) ?? 0;

  return (
    <div className="grid min-w-[220px] gap-2 rounded-md border bg-background p-3 text-sm shadow-md">
      {header ? (
        <div className="text-xs text-muted-foreground">{header}</div>
      ) : null}

      <div className="grid gap-1">
        {payload.map((p: any) => {
          const key = String(p.dataKey ?? p.name);
          const label =
            chartConfig[key as keyof typeof chartConfig]?.label ?? key;
          const color =
            (p.color as string) ??
            (p.payload as any)?.stroke ??
            (p.payload as any)?.fill ??
            "var(--foreground)";
          const value =
            typeof p.value === "number" ? p.value : Number(p.value ?? 0);

          return (
            <div key={key} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
              <span className="text-sm font-medium tabular-nums">
                {`${formatNumber(convertFromCanonical(value, "kg"))} kg`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Chart({ chartData }: { chartData: any[] | undefined }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <span className="flex justify-center items-center rounded-full bg-[#F9F7F8] size-10">
            <ChartColumnBig className="h-5 w-5 text-muted-foreground" />
          </span>
          Compras y despachados en los ultimos 5 días{" "}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border)"
            />

            {/* Format X-axis as '07 oct' etc. */}
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value: number) =>
                new Intl.DateTimeFormat("es-ES", {
                  day: "2-digit",
                  month: "short",
                }).format(new Date(value))
              }
              type="number"
              domain={["auto", "auto"]}
              scale="time"
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              width={80}
              tickFormatter={(value) =>
                `${convertFromCanonical(value, "kg").toFixed(0)} kg`
              }
            />

            <ChartTooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={<CustomTooltip />}
            />

            {/* Despachos (green line) */}
            <Area
              dataKey="despachos"
              type="monotone"
              fill="var(--color-despachos, #22c55e)"
              fillOpacity={0.25}
              stroke="var(--color-despachos, #22c55e)"
              strokeWidth={2}
            />

            {/* Compras (blue line) */}
            <Area
              dataKey="compras"
              type="monotone"
              fill="var(--color-compras, #3b82f6)"
              fillOpacity={0.25}
              stroke="var(--color-compras, #3b82f6)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

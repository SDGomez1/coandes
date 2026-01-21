"use client";
import { Pie, PieChart as RechartsPieChart } from "recharts";
import {
  Card,
  CardContent,
  CardFooter,
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

interface CustomPieChartProps {
  data: any[];
  chartConfig: ChartConfig;
  title: string;
  icon: ReactElement;
}

export function CustomPieChart({ data, chartConfig, title, icon }: CustomPieChartProps) {
  const dataKey = Object.keys(chartConfig)[0];
  
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="flex gap-4 items-center">
          <span className="flex justify-center items-center rounded-full bg-[#F9F7F8] size-10">
            {icon}
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RechartsPieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie data={data} dataKey={dataKey} nameKey="name" />
          </RechartsPieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            {data.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                    <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.fill }}
                    />
                    {item.name}
                </div>
            ))}
        </div>
      </CardFooter>
    </Card>
  );
}

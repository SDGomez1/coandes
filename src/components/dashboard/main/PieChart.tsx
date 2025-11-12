"use client";
import { TrendingUp, Warehouse } from "lucide-react";
import { Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
export const description = "A simple pie chart";
const chartData = [
  { browser: "used", visitors: 50, fill: "var(--color-chart-1)" },
  { browser: "free", visitors: 50, fill: "var(--color-chart-2)" },
];
const chartConfig = {
  visitors: {
    label: "Espacio ocupado",
  },
  used: {
    label: "Bodega en uso ",
    color: "var(--chart-1)",
  },
  free: {
    label: "Espacio disponible ",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;
export function WarehouseDonut() {
  return (
    <Card className="flex flex-col w-96">
      <CardHeader className="items-center pb-0">
        <CardTitle className="flex gap-4 items-center">
          <span className="flex justify-center items-center rounded-full bg-[#F9F7F8] size-10">
            <Warehouse className="h-5 w-5 text-muted-foreground" />
          </span>
          Bodega
        </CardTitle>
        <Select defaultValue="villavicencio" disabled>
          <SelectTrigger className="h-8 w-[160px] flex mx-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="villavicencio">Villavicencio</SelectItem>
            <SelectItem value="bogota">Bogotá</SelectItem>
            <SelectItem value="medellin">Medellín</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie data={chartData} dataKey="visitors" nameKey="browser" />
          </PieChart>
        </ChartContainer>
        <CardFooter>
          {" "}
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-chart-1" />
              Bodega en uso
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-chart-2" />
              Espacio disponible
            </div>
          </div>
        </CardFooter>
      </CardContent>
    </Card>
  );
}

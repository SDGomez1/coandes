"use client";

import BreadCrumb from "@/components/dashboard/BreadCrumb";
import { CustomBarChart } from "@/components/dashboard/main/CustomBarChart";
import { CustomLineChart } from "@/components/dashboard/main/CustomLineChart";
import { CustomPieChart } from "@/components/dashboard/main/CustomPieChart";
import SideNav from "@/components/dashboard/sidenav/SideNav";
import { Separator } from "@/components/ui/separator";
import { BarChart, LineChart, PieChart } from "lucide-react";
import { useQuery } from "convex/react";
import { Chart as TrazabilityChart } from "@/components/dashboard/main/Chart";
import { ChartConfig } from "@/components/ui/chart";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

const pieChartConfig = {
  value: {
    label: "Inventario",
    color: "#FBBF24",
  },
  "Raw Material": {
    label: "Materia Prima",
    color: "#60A5FA",
  },
  "Finished Good": {
    label: "Producto Terminado",
    color: "#34D399",
  },
  "By-product": {
    label: "Subproducto",
    color: "#FBBF24",
  },
};

const colors = ["#60A5FA", "#34d399", "#fbbf24"];

const barChartConfig = {
  value: {
    label: "Compras",
  },
};

const lineChartConfig = {
  value: {
    label: "Producción",
  },
};

const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

const formatInKg = (value: number) => `${value.toFixed(2)} kg`;

export default function Page() {
  const organization = useQuery(api.organizations.getOrg);
  const orgId = organization?._id as Id<"organizations">;

  const inventoryByCategory = useQuery(
    api.inventory.getInventoryByCategory,
    orgId ? { organizationId: orgId } : "skip",
  );
  const topSuppliers = useQuery(
    api.purchases.getTopSuppliersByPurchase,
    orgId ? { organizationId: orgId } : "skip",
  );
  const productionVolume = useQuery(
    api.production.getProductionVolume,
    orgId ? { organizationId: orgId } : "skip",
  );
  const purchasesVsDispatches = useQuery(
    api.purchases.getPurchasesVsDispatches,
    orgId ? { organizationId: orgId, days: 5 } : "skip",
  );

  return (
    <>
      <div className="lg:px-8 px-4">
        <BreadCrumb />
        <Separator />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 lg:px-8 px-4">
        <TrazabilityChart chartData={purchasesVsDispatches} />
        <CustomPieChart
          data={
            inventoryByCategory?.map((item, index) => ({
              ...item,
              name:
                pieChartConfig[item.name as keyof typeof pieChartConfig]
                  ?.label || item.name,
              fill: colors[index],
            })) ?? []
          }
          chartConfig={pieChartConfig as ChartConfig}
          title="Inventario por Categoría"
          icon={<PieChart className="h-5 w-5 text-muted-foreground" />}
          yFormatter={formatInKg}
        />
        <CustomBarChart
          data={topSuppliers ?? []}
          chartConfig={barChartConfig}
          title="Top 5 Proveedores"
          icon={<BarChart className="h-5 w-5 text-muted-foreground" />}
          dataKey="value"
          xAxisKey="name"
          yAxisLabel="Valor de Compra"
          xAxisLabel="Proveedor"
        />
        <CustomLineChart
          data={productionVolume ?? []}
          chartConfig={lineChartConfig}
          title="Volumen de Producción Mensual"
          icon={<LineChart className="h-5 w-5 text-muted-foreground" />}
          dataKey="value"
          xAxisKey="name"
        />
      </div>
    </>
  );
}

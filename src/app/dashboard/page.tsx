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
import {
  ChartConfig,
} from "@/components/ui/chart";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

const pieChartConfig = {
  value: {
    label: "Inventario",
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

export default function Page() {
    const organization = useQuery(api.organizations.getOrg);
    const orgId = organization?._id as Id<"organizations">;

    const inventoryByCategory = useQuery(api.inventory.getInventoryByCategory, orgId ? { organizationId: orgId } : "skip");
    const topSuppliers = useQuery(api.purchases.getTopSuppliersByPurchase, orgId ? { organizationId: orgId } : "skip");
    const productionVolume = useQuery(api.production.getProductionVolume, orgId ? { organizationId: orgId } : "skip");
    const purchasesVsDispatches = useQuery(api.purchases.getPurchasesVsDispatches, orgId ? { organizationId: orgId } : "skip");

  return (
    <>
      <BreadCrumb />
      <Separator />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
        <TrazabilityChart chartData={purchasesVsDispatches} />
        <CustomPieChart
          data={inventoryByCategory?.map((item) => ({ ...item, fill: "#000" })) ?? []}
          chartConfig={pieChartConfig as ChartConfig}
          title="Inventario por Categoría"
          icon={<PieChart className="h-5 w-5 text-muted-foreground" />}
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
          yFormatter={formatCurrency}
        />
        <CustomLineChart
          data={productionVolume ?? []}
          chartConfig={lineChartConfig}
          title="Volumen de Producción"
          icon={<LineChart className="h-5 w-5 text-muted-foreground" />}
          dataKey="value"
          xAxisKey="name"
          yAxisLabel="Cantidad Producida"
          xAxisLabel="Mes"
          yFormatter={formatCurrency}
        />
      </div>
    </>
  );
}

import BreadCrumb from "@/components/dashboard/BreadCrumb";
import CreateProductionFlow from "@/components/dashboard/produccion/CreateProductionFlow";
import ProductionHistoryTable from "@/components/dashboard/produccion/ProductionHistoryTable";
import SideNav from "@/components/dashboard/sidenav/SideNav";
import { Separator } from "@/components/ui/separator";

export default function page() {
  return (
    <>
      <div className="lg:px-8 px-4">
        <BreadCrumb />
        <Separator />
      </div>
      <div className="py-12 px-8">
        <h2 className="text-lg font-semibold mb-6">Registro de Producción</h2>
        <CreateProductionFlow />
        <Separator className="my-12" />
        <h3 className="text-lg font-semibold mb-6">Historial de Producción</h3>
        <ProductionHistoryTable />
      </div>
    </>
  );
}

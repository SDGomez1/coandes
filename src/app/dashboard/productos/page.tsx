import BreadCrumb from "@/components/dashboard/BreadCrumb";
import CreateProductionFlow from "@/components/dashboard/produccion/CreateProductionFlow";
import ProductionHistoryTable from "@/components/dashboard/produccion/ProductionHistoryTable";
import SideNav from "@/components/dashboard/sidenav/SideNav";
import { Separator } from "@/components/ui/separator";

export default function page() {
  return (
    <section className="w-full h-svh overflow-hidden flex">
      <SideNav />
      <section className="h-full w-full overflow-x-hidden overflow-y-auto pl-11 pr-6">
        <div className="">
          <BreadCrumb />
        </div>
        <Separator />
        <div className="py-12 px-9">
          <h2 className="text-lg font-semibold mb-6">Registro de Producción</h2>
          <CreateProductionFlow />
          <Separator className="my-12" />
          <h3 className="text-lg font-semibold mb-6">Historial de Producción</h3>
          <ProductionHistoryTable />
        </div>
      </section>
    </section>
  );
}

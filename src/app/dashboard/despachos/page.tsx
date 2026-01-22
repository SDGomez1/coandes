import BreadCrumb from "@/components/dashboard/BreadCrumb";
import CreateDispatchFlow from "@/components/dashboard/despachos/CreateDispatchFlow";
import DispatchHistoryTable from "@/components/dashboard/despachos/DispatchHistoryTable";
import SideNav from "@/components/dashboard/sidenav/SideNav";
import { Separator } from "@/components/ui/separator";

export default function page() {
  return (
    <>
      <div className="px-4 lg:px-8">
        <BreadCrumb />
        <Separator />
      </div>
      <div className="py-12 px-4 lg:px-8">
        <h2 className="text-lg font-semibold mb-6">Registro de Despachos</h2>
        <CreateDispatchFlow />
        <Separator className="my-12" />
        <h3 className="text-lg font-semibold mb-6">Historial de Despachos</h3>
        <DispatchHistoryTable />
      </div>
    </>
  );
}

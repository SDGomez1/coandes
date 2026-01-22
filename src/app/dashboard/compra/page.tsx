import BreadCrumb from "@/components/dashboard/BreadCrumb";
import PurchaseFlow from "@/components/dashboard/compras/PurchaseFlow";
import PurchaseHistoryTable from "@/components/dashboard/compras/PurchaseHistoryTable";
import SideNav from "@/components/dashboard/sidenav/SideNav";
import { Separator } from "@/components/ui/separator";

export default function page() {
  return (
    <>
      <div className="px-4 lg:px-8">
        <BreadCrumb />
        <Separator />
      </div>
      <div className="px-4 py-12 lg:px-8">
        <h2 className="text-lg font-semibold mb-6">Registro de Compras</h2>
        <PurchaseFlow />
        <Separator className="my-12" />
        <h3 className="text-lg font-semibold mb-6">Historial de Compras</h3>
        <PurchaseHistoryTable />
      </div>
    </>
  );
}

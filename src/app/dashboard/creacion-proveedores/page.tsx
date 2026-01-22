import BreadCrumb from "@/components/dashboard/BreadCrumb";
import CreateNewSupplier from "@/components/dashboard/creacionProveedores/CreateNewSupplier";
import SupplierTable from "@/components/dashboard/creacionProveedores/SupplierTable";
import SideNav from "@/components/dashboard/sidenav/SideNav";
import { Separator } from "@/components/ui/separator";

export default function page() {
  return (
    <>
      <div className="px-4 lg:px-8">
        <BreadCrumb />
        <Separator />
      </div>
      <div className="py-12 lg:px-8 px-4">
        <h2 className="text-lg font-semibold">Gestión de Proveedores</h2>
        <CreateNewSupplier />
        <SupplierTable />
      </div>
    </>
  );
}


import BreadCrumb from "@/components/dashboard/BreadCrumb";
import CreateNewSupplier from "@/components/dashboard/creacionProveedores/CreateNewSupplier";
import SupplierTable from "@/components/dashboard/creacionProveedores/SupplierTable";
import SideNav from "@/components/dashboard/sidenav/SideNav";
import { Separator } from "@/components/ui/separator";

export default function page() {

  return (

    <>

      <div className="">

        <BreadCrumb />

      </div>

      <Separator />

      <div className="py-12 px-9">

        <h2 className="text-lg font-semibold">Gestión de Proveedores</h2>

        <CreateNewSupplier />

        <SupplierTable />

      </div>

    </>

  );

}
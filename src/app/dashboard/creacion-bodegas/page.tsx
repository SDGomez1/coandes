import BreadCrumb from "@/components/dashboard/BreadCrumb";
import CreateNewWarehouse from "@/components/dashboard/creacionBodegas/CreateNewWarehouse";
import WarehouseTable from "@/components/dashboard/creacionBodegas/WarehouseTable";
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
        <h2 className="text-lg font-semibold">Gestión de Bodegas</h2>
        <CreateNewWarehouse />
        <WarehouseTable />
      </div>
    </>
  );
}

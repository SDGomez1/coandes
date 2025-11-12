import BreadCrumb from "@/components/dashboard/BreadCrumb";
import CreateNewWarehouse from "@/components/dashboard/creacionBodegas/CreateNewWarehouse";
import WarehouseTable from "@/components/dashboard/creacionBodegas/WarehouseTable";
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
          <h2 className="text-lg font-semibold">Gestión de Bodegas</h2>
          <CreateNewWarehouse />
          <WarehouseTable />
        </div>
      </section>
    </section>
  );
}

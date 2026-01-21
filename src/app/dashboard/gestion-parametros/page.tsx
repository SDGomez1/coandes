import BreadCrumb from "@/components/dashboard/BreadCrumb";
import CreateNewParam from "@/components/dashboard/gestionParametros/CreateNewParam";
import ParamsTable from "@/components/dashboard/gestionParametros/ParamsTable";
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
        <h2 className="text-lg font-semibold mb-4">Gestión de parámetros</h2>
        <p className="text-gray-ligth">
          Administra los parámetros de los productos del catálogo de la
          empresa, defina parámetros de calidad.{" "}
        </p>
        <ParamsTable />
        <div className="flex justify-center">
          <CreateNewParam />
        </div>
      </div>
    </>
  );
}

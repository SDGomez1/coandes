import BreadCrumb from "@/components/dashboard/BreadCrumb";
import CreateNewProduct from "@/components/dashboard/creacionProductos/CreateNewProduct";
import ProductTable from "@/components/dashboard/creacionProductos/ProductTable";
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
          <h2 className="text-lg font-semibold mb-4">Creación de productos</h2>
          <p className="text-gray-ligth">
            Administra el catálogo de la empresa: crea productos, define
            parámetros de calidad y configura unidades o presentaciones.
          </p>
          <ProductTable />
          <div className="flex justify-center">
            <CreateNewProduct />
          </div>
        </div>
      </section>
    </section>
  );
}

import BreadCrumb from "@/components/dashboard/BreadCrumb";
import CreateNewProduct from "@/components/dashboard/creacionProductos/CreateNewProduct";
import ProductTable from "@/components/dashboard/creacionProductos/ProductTable";
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
    </>
  );
}

import BreadCrumb from "@/components/dashboard/BreadCrumb";
import ProductTypesManager from "@/components/dashboard/tiposProducto/ProductTypesManager";
import { Separator } from "@/components/ui/separator";

export default function Page() {
  return (
    <>
      <div className="px-4 lg:px-8">
        <BreadCrumb />
        <Separator />
      </div>
      <div className="py-12 px-4 lg:px-8 space-y-3">
        <h2 className="text-lg font-semibold">Gestión de Tipos de Producto</h2>
        <p className="text-sm text-gray-500">
          Este catálogo es independiente y no altera la lógica actual de producción.
        </p>
        <ProductTypesManager />
      </div>
    </>
  );
}

import BreadCrumb from "@/components/dashboard/BreadCrumb";
import MovementHistoryTable from "@/components/dashboard/movimientos/MovementHistoryTable";
import { Separator } from "@/components/ui/separator";

export default function Page() {
  return (
    <>
      <div className="px-4 lg:px-8">
        <BreadCrumb />
        <Separator />
      </div>
      <div className="px-4 py-12 lg:px-8">
        <h2 className="text-lg font-semibold mb-6">Historial de Movimientos</h2>
        <p className="text-sm text-gray-600 mb-6">
          Vista unificada de recepcion, produccion, despachos y ajustes.
        </p>
        <MovementHistoryTable />
      </div>
    </>
  );
}

import BreadCrumb from "@/components/dashboard/BreadCrumb";
import ExportsHistoryTable from "@/components/dashboard/exportaciones/ExportsHistoryTable";
import { Separator } from "@/components/ui/separator";

export default function Page() {
  return (
    <>
      <div className="px-4 lg:px-8">
        <BreadCrumb />
        <Separator />
      </div>
      <div className="px-4 py-12 lg:px-8 space-y-4">
        <h2 className="text-lg font-semibold">Exportaciones</h2>
        <ExportsHistoryTable />
      </div>
    </>
  );
}

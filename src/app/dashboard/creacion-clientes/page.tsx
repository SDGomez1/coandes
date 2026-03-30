import BreadCrumb from "@/components/dashboard/BreadCrumb";
import CreateNewCustomer from "@/components/dashboard/creacionClientes/CreateNewCustomer";
import CustomerTable from "@/components/dashboard/creacionClientes/CustomerTable";
import { Separator } from "@/components/ui/separator";

export default function page() {
  return (
    <>
      <div className="px-4 lg:px-8">
        <BreadCrumb />
        <Separator />
      </div>
      <div className="py-12 lg:px-8 px-4">
        <h2 className="text-lg font-semibold">Gestión de Clientes</h2>
        <CreateNewCustomer />
        <CustomerTable />
      </div>
    </>
  );
}

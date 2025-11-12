import BreadCrumb from "@/components/dashboard/BreadCrumb";
import CreateNewPurchase from "@/components/dashboard/compras/CreateNewPurchase";
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
          <CreateNewPurchase />
        </div>
      </section>
    </section>
  );
}

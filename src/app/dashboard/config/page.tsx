import BreadCrumb from "@/components/dashboard/BreadCrumb";
import SideNav from "@/components/dashboard/sidenav/SideNav";
import { Separator } from "@/components/ui/separator";

export default function page() {
  return (
    <>
      <div className="px-4 lg:px-8">
        <BreadCrumb />
        <Separator />
      </div>
      <div className="py-12 lg:px-8 px-4"></div>
    </>
  );
}

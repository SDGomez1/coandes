"use client";

import BreadCrumb from "@/components/dashboard/BreadCrumb";
import { Chart } from "@/components/dashboard/main/Chart";
import { WarehouseDonut } from "@/components/dashboard/main/PieChart";
import SideNav from "@/components/dashboard/sidenav/SideNav";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import {
  ChartColumnBig,
  CircleArrowUp,
  Tag,
  Users,
  Wallet,
} from "lucide-react";

export default function page() {
  return (
    <section className="w-full h-svh overflow-hidden flex">
      <SideNav />
      <section className="h-full w-full overflow-x-hidden overflow-y-auto pl-11 pr-6">
        <div className="">
          <BreadCrumb />
          <Separator />

          <div className="py-6 w-full flex justify-evenly">
            <div className="p-5 flex justify-center flex-col border border-blue-gray rounded-lg w-[350px]">
              <div className="flex items-center gap-4 mb-6">
                <span className="flex justify-center items-center rounded-full bg-[#F9F7F8] size-10">
                  <Wallet className="text-black size-5" />
                </span>
                <p className="text-sm font-semibold">
                  Promedio de Ventas / Mes actual
                </p>
              </div>
              <p className="font-semibold text-4xl mb-6 ">$ 19.425.718</p>
              <div className="flex  items-center ">
                <p className="text-green-grow flex text-xs items-center gap-1 mr-1">
                  <CircleArrowUp className="text-green-grow size-4" />
                  +9%
                </p>
                <p className="text-gray-ligth text-xs">
                  Con respecto al mes anterior: $15.246.126
                </p>
              </div>
            </div>
            <div className="p-5 flex justify-center flex-col border border-blue-gray rounded-lg w-[330px]">
              <div className="flex items-center gap-4 mb-6">
                <span className="flex justify-center items-center rounded-full bg-[#F9F7F8] size-10">
                  <Users className="text-black size-5" />
                </span>
                <p className="text-sm font-semibold">
                  Total Producido Neto / Kg{" "}
                </p>
              </div>
              <p className="font-semibold text-4xl mb-6 ">40.684</p>
              <div className="flex items-center ">
                <p className="text-destructive flex text-xs items-center gap-1 mr-1">
                  <CircleArrowUp className="text-destructive size-4 rotate-180" />
                  -7%
                </p>
                <p className="text-gray-ligth text-xs">
                  Con respecto al mes anterior: 46.723
                </p>
              </div>
            </div>
            <div className="p-5 flex justify-center flex-col border border-blue-gray rounded-lg">
              <div className="flex items-center gap-4 mb-6">
                <span className="flex justify-center items-center rounded-full bg-[#F9F7F8] size-10">
                  <Tag className="text-black size-5" />
                </span>
                <p className="text-sm font-semibold">
                  Promedio de Ventas / Mes actual
                </p>
              </div>
              <p className="font-semibold text-4xl mb-6 ">6.248</p>
              <div className="flex  items-center ">
                <p className="text-green-grow flex text-xs items-center gap-1 mr-1">
                  <CircleArrowUp className="text-green-grow size-4" />
                  +9%
                </p>
                <p className="text-gray-ligth text-xs">
                  Con respecto al mes anterior: $15.246.126
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-6 justify-center">
            <Chart />
             <WarehouseDonut/>
          </div>
        </div>
      </section>
    </section>
  );
}

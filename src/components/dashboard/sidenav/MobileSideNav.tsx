import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import SideNav from "./SideNav";
import Logo from "@/assets/img/Logo.png";
import Image from "next/image";
import UserCard from "./UserCard";
import LogOutButton from "./LogOutButton";
import Link from "next/link";

import { Bolt, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import SideNavLinks from "./SideNavLinks";

export default function MobileSideNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div
          className={`flex flex-col h-full shrink-0 bg-[#FAFAFA] gap-4 overflow-y-auto w-80 px-8 py-6 `}
        >
          <Image src={Logo} alt="logo" className={`w-full`} />

          <Separator />
          <SideNavLinks />
          <div className="mt-auto space-y-4">
            <div
              className={`flex text-gray gap-4 items-center text-sm mt-auto`}
            >
              <span
                className={
                  "flex items-center justify-center size-12 rounded-full"
                }
              >
                <Bolt />
              </span>
              <Link href={"/dashboard/config"}>Configuración</Link>
            </div>
            <LogOutButton />
            <UserCard />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

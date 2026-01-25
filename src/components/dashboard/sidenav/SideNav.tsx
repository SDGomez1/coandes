"use client";
import { Bolt, Menu } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import SideNavLinks from "./SideNavLinks";
import Logo from "@/assets/img/Logo.png";
import Image from "next/image";
import UserCard from "./UserCard";
import LogOutButton from "./LogOutButton";
import Link from "next/link";

export default function SideNav() {
  return (
    <div
      className={`lg:flex flex-col h-full shrink-0 bg-[#FAFAFA] gap-4 overflow-y-auto w-80 px-8 py-6 hidden`}
    >
      <Image src={Logo} alt="logo" className={`w-full`} />

      <Separator />
      <SideNavLinks />
      <div className="mt-auto space-y-4">
        <div className={`flex text-gray gap-4 items-center text-sm mt-auto`}>
          <span
            className={"flex items-center justify-center size-12 rounded-full"}
          >
            <Bolt />
          </span>
          <Link href={"/dashboard/config"}>Configuración</Link>
        </div>
        <LogOutButton />
        <UserCard />
      </div>
    </div>
  );
}

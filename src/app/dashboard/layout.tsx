"use client";
import SideNav from "@/components/dashboard/sidenav/SideNav";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <section className="w-full h-svh flex">
        <SideNav />
        <main className="h-full flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </section>
    );
  }

  return (
    <section className="w-full h-svh flex flex-col">
      <main className="h-full flex-1 overflow-x-hidden overflow-y-auto">
        {children}
      </main>
    </section>
  );
}

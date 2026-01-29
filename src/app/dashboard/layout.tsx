import SideNav from "@/components/dashboard/sidenav/SideNav";
import { isAuthenticated } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { ClientAuthBoundary } from "@/lib/auth-client";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!(await isAuthenticated())) {
    redirect("/");
  }
  return (
    <ClientAuthBoundary>
      <section className="w-full h-svh flex">
        <SideNav />
        <main className="h-full flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </section>
    </ClientAuthBoundary>
  );
}

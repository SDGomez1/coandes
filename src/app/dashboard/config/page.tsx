"use client";
import { ConfigPage } from "@/components/dashboard/config/ConfigPage";
import { api } from "../../../../convex/_generated/api";
import { fetchAuthQuery } from "@/lib/auth-server";
import { Id } from "../../../../convex/betterAuth/_generated/dataModel";
import { useQuery } from "convex/react";
import BreadCrumb from "@/components/dashboard/BreadCrumb";
import { Separator } from "@/components/ui/separator";

export function Config() {
  const userData = useQuery(api.auth.getAuthUser);
  if (!userData) {
    return <div>Loading...</div>;
  }

  const typedUserData = {
    ...userData,
    userId: userData?._id as Id<"user">,
  };

  return (
    <>
      <div className="px-4 lg:px-8">
        <BreadCrumb />
        <Separator />
      </div>
      <div className="p-4 md:p-10">
        <h1 className="text-2xl font-bold mb-6">Configuración</h1>
        <ConfigPage userData={typedUserData} />
      </div>
    </>
  );
}

export default Config;

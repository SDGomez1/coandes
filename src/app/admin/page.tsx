"use client";
import { useQuery } from "convex/react";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/dashboard/admin/AdminDashboard";
import { LoadingSpinner } from "@/assets/icons/LoadingSpinner";
import { api } from "../../../convex/_generated/api";

export default function AdminPage() {
  const userConfig = useQuery(api.userConfig.getCurrentUserConfig);

  if (userConfig === undefined) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <LoadingSpinner className="text-black" />
      </div>
    );
  }

  if (userConfig === null || userConfig.role !== "superAdmin") {
    redirect("/dashboard");
  }

  return <AdminDashboard />;
}

"use client";
import { authClient } from "@/lib/auth-client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LogOutButton() {
  const router = useRouter();
  return (
    <div
      className="flex text-gray gap-4 items-center text-sm cursor-pointer"
      onClick={() => {
        authClient.signOut();
        router.replace("/");
      }}
    >
      <span
        className={"flex items-center justify-center size-12 rounded-full "}
      >
        <LogOut />
      </span>
      <p>Cerrar sesión</p>
    </div>
  );
}

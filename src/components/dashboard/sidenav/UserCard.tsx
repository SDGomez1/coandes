"use client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function UserCard() {
  const user = useQuery(api.user.getUserData);
  return (
    <div className="flex bg-white border border-[#E5E9EA] p-2 gap-2 rounded-lg">
      <Avatar>
        <AvatarFallback>
          {user?.email ? user.email.slice(0, 2).toUpperCase() : ""}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col text-sm">
        <p className="font-bold">{user?.name || user?.email.split("@")[0]}</p>
        <p className="text-[10px] text-gray">{(user?.role == "admin" || user?.role == "superAdmin") ? "Administrador" : "Usuario"}</p>
      </div>
    </div>
  );
}

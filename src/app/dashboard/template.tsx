import { getToken } from "@/lib/auth-server";
import { fetchMutation } from "convex/nextjs";
import { ReactNode } from "react";
import { api } from "../../../convex/_generated/api";
import { redirect } from "next/navigation";
export default async function template({ children }: { children: ReactNode }) {
  const token = await getToken();
  const data = await fetchMutation(
    api.user.userLoggedIn,
    { user: "" },
    { token },
  );
    /*
  if (!data) {
    redirect("/auth/login");
  }*/
  return <>{children}</>;
}

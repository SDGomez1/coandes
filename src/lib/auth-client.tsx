"use client";
import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { emailOTPClient } from "better-auth/client/plugins";
import { PropsWithChildren } from "react";
import { AuthBoundary } from "@convex-dev/better-auth/react";
import { isAuthError } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";

export const authClient = createAuthClient({
  plugins: [convexClient(), emailOTPClient()],
});

export const ClientAuthBoundary = ({ children }: PropsWithChildren) => {
  const router = useRouter();
  return (
    <AuthBoundary
      authClient={authClient}
      onUnauth={() => router.push("/sign-in")}
      getAuthUserFn={api.auth.getAuthUser}
      isAuthError={isAuthError}
    >
      {children}
    </AuthBoundary>
  );
};

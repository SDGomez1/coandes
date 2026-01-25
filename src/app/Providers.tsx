"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { authClient } from "@/lib/auth-client";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { getToken } from "@/lib/auth-server";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children,initialToken }: { children: ReactNode, initialToken?: string | null }) {
  return (
    <ConvexBetterAuthProvider
      client={convex}
      authClient={authClient}
      initialToken={initialToken}
    >
      <Provider store={store}>{children}</Provider>
    </ConvexBetterAuthProvider>
  );
}

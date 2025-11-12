"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { authClient } from "@/lib/auth-client"; 
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react"; 
import { Provider } from "react-redux";
import { store } from "@/store/store";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!, {
  expectAuth: true, 
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      <Provider store={store}>{children}</Provider>
    </ConvexBetterAuthProvider>
  );
}

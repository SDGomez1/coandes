import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
export const userLoggedIn = mutation({
  args: { user: v.string() },
  handler: async (ctx, args) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
    const isLogged = await auth.api.getSession({ headers });
    if (!isLogged) {
      return false;
    } else {
      return true;
    }
  },
});

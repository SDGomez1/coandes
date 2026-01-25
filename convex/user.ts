import { query } from "./_generated/server";
import { authComponent } from "./auth";

export const getUserData = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    if (!user) {
      return null;
    }

    const userConfig = await ctx.db
      .query("userConfig")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!userConfig) {
      return null;
    }

    return {
      ...user,
      organizationId: userConfig.organizationId,
      role: userConfig.role,
    };
  },
});
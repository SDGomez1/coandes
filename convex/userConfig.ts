import { query } from "./_generated/server";

export const getCurrentUserConfig = query({
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      return null;
    }
    const userConfig = await ctx.db
      .query("userConfig")
      .withIndex("by_userId", (q) => q.eq("userId", user.subject))
      .first();
    return userConfig;
  },
});

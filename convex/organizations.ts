import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const getOrg = query({
  args: {},
  handler: async (ctx) => {
    const organizations = await ctx.db.query("organizations").take(1); // Get the first organization

    if (organizations.length === 0) {
      return null;
    }

    return organizations[0];
  },
});


import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createWarehouse = mutation({
  args: {
    organizationId: v.id("organizations"), // NEW ARG
    name: v.string(),
    capacity: v.number(),
    rows: v.number(),
    baseUnit: v.string(),
  },
  handler: async (ctx, args) => {
    // No need to query for org, organizationId is passed directly
    const warehouse = await ctx.db.insert("warehouse", {
      organizationId: args.organizationId, // Use direct arg
      name: args.name,
      capacity: args.capacity,
      row: args.rows,
      baseUnit: args.baseUnit,
    });

    return warehouse;
  },
});

export const getAvailableWarehose = query({
  args: {},
  handler: async (ctx, args) => {
    const org = await ctx.db.query("organizations").first();
        if (!org){
            return
        }
    const data = await ctx.db
      .query("warehouse")
      .withIndex("by_org", (q) => q.eq("organizationId", org?._id)) // Use direct arg
      .collect();

    return data;
  },
});

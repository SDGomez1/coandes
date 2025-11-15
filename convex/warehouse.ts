import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { handler } from "next/dist/build/templates/app-page";

export const createWarehouse = mutation({
  args: {
    name: v.string(),
    capacity: v.number(),
    rows: v.number(),
    baseUnit: v.string(),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db.query("organizations").first();

    if (!org) throw new Error("Organization not found");
    if (org.active === false) throw new Error("Organization is not active");

    const warehouse = await ctx.db.insert("warehouse", {
      organizationId: org._id,
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

    if (!org) throw new Error("Organization not found");
    if (org.active === false) throw new Error("Organization is not active");

    const data = await ctx.db
      .query("warehouse")
      .withIndex("by_org", (q) => q.eq("organizationId", org._id)).collect();

    return data;
  },
});

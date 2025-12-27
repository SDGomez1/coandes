import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createWarehouse = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    capacity: v.number(),
    row: v.number(),
    baseUnit: v.union(
      v.literal("g"),
      v.literal("kg"),
      v.literal("ton"),
      v.literal("lb"),
      v.literal("oz"),
    ),
  },
  handler: async (ctx, args) => {
    const warehouse = await ctx.db.insert("warehouse", {
      organizationId: args.organizationId,
      name: args.name,
      capacity: args.capacity,
      row: args.row,
      baseUnit: args.baseUnit,
    });

    return warehouse;
  },
});

export const editWarehouse = mutation({
  args: {
    warehouseId: v.id("warehouse"),
    name: v.optional(v.string()),
    capacity: v.optional(v.number()),
    row: v.optional(v.number()),
    baseUnit: v.union(
      v.literal("g"),
      v.literal("kg"),
      v.literal("ton"),
      v.literal("lb"),
      v.literal("oz"),
    ),  },
  handler: async (ctx, args) => {
    const { warehouseId, ...rest } = args;
    const warehouse = await ctx.db.patch(warehouseId, rest);
    return warehouse;
  },
});

export const deleteWarehouse = mutation({
  args: {
    warehouseId: v.id("warehouse"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.warehouseId);
  },
});

export const getAvailableWarehose = query({
  args: {},
  handler: async (ctx, args) => {
    const org = await ctx.db.query("organizations").first();
    if (!org) {
      return;
    }
    const data = await ctx.db
      .query("warehouse")
      .withIndex("by_org", (q) => q.eq("organizationId", org?._id))
      .collect();

    return data;
  },
});

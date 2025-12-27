import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";


export const createSupplier = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const supplierId = await ctx.db.insert("suppliers", {
      organizationId: args.organizationId,
      name: args.name,
      details: args.details,
    });
    return supplierId;
  },
});


export const editSupplier = mutation({
  args: {
    supplierId: v.id("suppliers"),
    name: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { supplierId, ...rest } = args;
    await ctx.db.patch(supplierId, rest);
    return supplierId;
  },
});


export const deleteSupplier = mutation({
  args: {
    supplierId: v.id("suppliers"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.supplierId);
  },
});


export const getSuppliers = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("suppliers")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .collect();
  },
});

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Creates a new supplier.
 *
 * @param organizationId - The ID of the organization this supplier belongs to.
 * @param name - The name of the supplier.
 * @param details - Optional details about the supplier.
 * @returns The ID of the newly created supplier.
 */
export const createSupplier = mutation({
  args: {
    // TODO: Get organizationId from user session/auth
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

/**
 * Fetches all suppliers for a given organization.
 *
 * @param organizationId - The ID of the organization.
 * @returns A list of suppliers.
 */
export const getSuppliers = query({
  args: {
    // TODO: Get organizationId from user session/auth
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

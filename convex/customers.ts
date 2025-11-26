import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Creates a new customer.
 *
 * @param organizationId - The ID of the organization this customer belongs to.
 * @param name - The name of the customer.
 * @param details - Optional details about the customer.
 * @returns The ID of the newly created customer.
 */
export const createCustomer = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("customers", {
      organizationId: args.organizationId,
      name: args.name,
      details: args.details,
    });
  },
});

/**
 * Fetches all customers for a given organization.
 *
 * @param organizationId - The ID of the organization.
 * @returns A list of customers.
 */
export const getCustomers = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .collect();
  },
});

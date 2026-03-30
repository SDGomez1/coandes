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
 * Updates an existing customer without modifying unrelated fields.
 *
 * @param customerId - The customer to update.
 * @param name - Optional updated customer name.
 * @param details - Optional updated customer details.
 * @returns The ID of the updated customer.
 */
export const editCustomer = mutation({
  args: {
    customerId: v.id("customers"),
    name: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: { name?: string; details?: string } = {};

    if (args.name !== undefined) {
      patch.name = args.name;
    }

    if (args.details !== undefined) {
      patch.details = args.details;
    }

    if (Object.keys(patch).length === 0) {
      return args.customerId;
    }

    await ctx.db.patch(args.customerId, patch);
    return args.customerId;
  },
});

/**
 * Deletes a customer only if it is not referenced by any existing dispatch.
 *
 * @param customerId - The customer to delete.
 */
export const deleteCustomer = mutation({
  args: {
    customerId: v.id("customers"),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.customerId);
    if (!customer) {
      throw new Error("Cliente no encontrado.");
    }

    const dispatches = await ctx.db
      .query("dispatches")
      .withIndex("by_org", (q) => q.eq("organizationId", customer.organizationId))
      .collect();

    const isCustomerInUse = dispatches.some(
      (dispatch) => dispatch.customerId === args.customerId,
    );

    if (isCustomerInUse) {
      throw new Error(
        "No se puede eliminar un cliente con despachos asociados.",
      );
    }

    await ctx.db.delete(args.customerId);
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

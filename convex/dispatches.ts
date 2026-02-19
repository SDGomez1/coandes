import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Creates a dispatch (sale), consuming inventory lots.
 * This is a transactional operation that handles the sale of finished goods.
 *
 * @param organizationId - The ID of the organization.
 * @param customerId - Optional ID of the customer.
 * @param dispatchDate - The timestamp of the dispatch.
 * @param items - An array of objects describing the lots being dispatched.
 *   - inventoryLotId: The specific lot being sold.
 *   - quantityDispatched: The quantity being sold from that lot.
 */
export const createDispatch = mutation({
  args: {
    organizationId: v.id("organizations"),
    customerId: v.optional(v.id("customers")),
    dispatchDate: v.number(),
    items: v.array(
      v.object({
        inventoryLotId: v.id("inventoryLots"),
        quantityDispatched: v.number(),
        ticketNumber: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // 1. Create the main dispatch record
    const dispatchId = await ctx.db.insert("dispatches", {
      organizationId: args.organizationId,
      customerId: args.customerId,
      dispatchDate: args.dispatchDate,
      status: "Shipped",
    });

    // 2. Process each item in the dispatch
    for (const item of args.items) {
      const lot = await ctx.db.get(item.inventoryLotId);
      if (!lot) {
        throw new Error(
          `Inventory lot with ID ${item.inventoryLotId} not found.`,
        );
      }
      if (lot.organizationId !== args.organizationId) {
        throw new Error(`Access denied to lot ${lot.lotNumber}.`);
      }
      if (lot.quantity < item.quantityDispatched) {
        throw new Error(
          `Insufficient quantity for lot ${lot.lotNumber}. Available: ${lot.quantity}, Required: ${item.quantityDispatched}`,
        );
      }

      // Create a line item for the dispatch
      await ctx.db.insert("dispatchLineItems", {
        dispatchId: dispatchId,
        inventoryLotId: item.inventoryLotId,
        quantityDispatched: item.quantityDispatched,
        ticketNumber: item.ticketNumber,
      });

      // Decrement the lot quantity
      await ctx.db.patch(item.inventoryLotId, {
        quantity: lot.quantity - item.quantityDispatched,
      });

      // Log the dispatch activity
      await ctx.db.insert("activityLog", {
        organizationId: args.organizationId,
        inventoryLotId: item.inventoryLotId,
        activityType: "dispatch",
        quantityChange: -item.quantityDispatched,
        relatedId: dispatchId,
        timestamp: Date.now(),
      });
    }

    return dispatchId;
  },
});

export const editDispatchEntry = mutation({
  args: {
    dispatchLineItemId: v.id("dispatchLineItems"),
    quantityDispatched: v.number(),
    ticketNumber: v.string(),
    customerId: v.optional(v.id("customers")),
    dispatchDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.quantityDispatched <= 0) {
      throw new Error("Quantity must be greater than zero.");
    }
    if (!args.ticketNumber.trim()) {
      throw new Error("Dispatch ticket number is required.");
    }

    const lineItem = await ctx.db.get(args.dispatchLineItemId);
    if (!lineItem) {
      throw new Error("Dispatch line item not found.");
    }

    const dispatch = await ctx.db.get(lineItem.dispatchId);
    if (!dispatch) {
      throw new Error("Dispatch not found.");
    }

    const lot = await ctx.db.get(lineItem.inventoryLotId);
    if (!lot) {
      throw new Error("Inventory lot not found.");
    }

    const availableBeforeDispatch = lot.quantity + lineItem.quantityDispatched;
    if (args.quantityDispatched > availableBeforeDispatch) {
      throw new Error(
        `Insufficient quantity for lot ${lot.lotNumber}. Available: ${availableBeforeDispatch}, Required: ${args.quantityDispatched}`,
      );
    }

    await ctx.db.patch(lineItem._id, {
      quantityDispatched: args.quantityDispatched,
      ticketNumber: args.ticketNumber,
    });

    await ctx.db.patch(lot._id, {
      quantity: availableBeforeDispatch - args.quantityDispatched,
    });

    await ctx.db.patch(dispatch._id, {
      customerId: args.customerId,
      dispatchDate: args.dispatchDate ?? dispatch.dispatchDate,
    });

    const quantityDelta = lineItem.quantityDispatched - args.quantityDispatched;
    if (quantityDelta !== 0) {
      await ctx.db.insert("activityLog", {
        organizationId: dispatch.organizationId,
        inventoryLotId: lot._id,
        activityType: "adjustment",
        quantityChange: quantityDelta,
        relatedId: dispatch._id,
        timestamp: Date.now(),
      });
    }
  },
});

/**
 * Fetches all dispatches for a given organization.
 */
export const getDispatches = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dispatches")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .collect();
  },
});

/**
 * Fetches a history of all dispatched items.
 */
export const getDispatchHistory = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    // This is a bit more complex as we start from the line items.
    // A more performant approach might involve denormalizing some data,
    // but this is the most flexible for querying.
    const allDispatches = await ctx.db
      .query("dispatches")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .collect();

    const history = [];

    for (const dispatch of allDispatches) {
      const lineItems = await ctx.db
        .query("dispatchLineItems")
        .withIndex("by_dispatch", (q) => q.eq("dispatchId", dispatch._id))
        .collect();

      const customer = dispatch.customerId
        ? await ctx.db.get(dispatch.customerId)
        : null;

      for (const item of lineItems) {
        const lot = await ctx.db.get(item.inventoryLotId);
        const product = lot ? await ctx.db.get(lot.productId) : null;

        history.push({
          _id: item._id,
          dispatchId: dispatch._id,
          inventoryLotId: item.inventoryLotId,
          customerId: dispatch.customerId,
          dispatchDate: dispatch.dispatchDate,
          customerName: customer?.name ?? "N/A",
          lotNumber: lot?.lotNumber ?? "N/A",
          lotNumberDispatch: item.ticketNumber,
          productName: product?.name ?? "Producto no encontrado",
          quantityDispatched: item.quantityDispatched,
          unit: product?.baseUnit ?? "N/A",
          presentation: product?.presentation ?? "",
          equivalence: product?.equivalence ?? "",
          averageWeight: product?.averageWeight ?? 0,
        });
      }
    }
    return history;
  },
});

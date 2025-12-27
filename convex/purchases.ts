import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

/**
 * Creates a new purchase order.
 * This function only logs the order; it does not create inventory lots yet.
 *
 * @param organizationId - The ID of the organization placing the purchase.
 * @param supplierId - Optional ID of the supplier.
 * @param orderDate - The timestamp of when the order was placed.
 * @returns The ID of the newly created purchase order.
 */
export const createPurchase = mutation({
  args: {
    organizationId: v.id("organizations"),
    supplierId: v.optional(v.id("suppliers")),
    orderDate: v.number(),
  },
  handler: async (ctx, args) => {
    const purchaseId = await ctx.db.insert("purchases", {
      organizationId: args.organizationId,
      supplierId: args.supplierId,
      orderDate: args.orderDate,
      status: "Ordered", // Initial status
    });
    return purchaseId;
  },
});

/**
 * Receives goods from a purchase, creating an inventory lot.
 * This is a transactional operation that creates the initial inventory record.
 *
 * @param purchaseId - The ID of the purchase order being received.
 * @param productId - The ID of the product being received.
 * @param warehouseId - The ID of the warehouse to store the goods.
 * @param lotNumber - A unique identifier for this batch/lot.
 * @param quantity - The quantity of the product received, in canonical units (grams).
 * @param qualityFactorValues - Optional: A record of quality factor IDs to their measured values for this lot.
 * @returns The ID of the newly created inventory lot.
 */
export const receivePurchase = mutation({
  args: {
    purchaseId: v.id("purchases"),
    productId: v.id("products"),
    warehouseId: v.id("warehouse"),
    vehicleInfo: v.string(),
    lotNumber: v.string(),
    quantity: v.number(),
    qualityFactorValues: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args) => {
    const purchase = await ctx.db.get(args.purchaseId);
    if (!purchase) {
      throw new Error("Purchase order not found.");
    }

    // Check for lot number uniqueness within the organization
    const existingLot = await ctx.db
      .query("inventoryLots")
      .withIndex("by_org", (q) =>
        q.eq("organizationId", purchase.organizationId),
      )
      .filter((q) => q.eq(q.field("lotNumber"), args.lotNumber))
      .first();

    if (existingLot) {
      throw new Error(`Lot number ${args.lotNumber} already exists.`);
    }

    // Create the new inventory lot
    const inventoryLotId = await ctx.db.insert("inventoryLots", {
      organizationId: purchase.organizationId,
      productId: args.productId,
      warehouseId: args.warehouseId,
      lotNumber: args.lotNumber,
      quantity: args.quantity,
      creationDate: Date.now(),
      qualityFactorValues: args.qualityFactorValues,
      vehicleInfo: args.vehicleInfo,
      source: {
        type: "purchase",
        purchaseId: args.purchaseId,
      },
    });

    // Log this activity
    await ctx.db.insert("activityLog", {
      organizationId: purchase.organizationId,
      inventoryLotId: inventoryLotId,
      activityType: "reception",
      quantityChange: args.quantity,
      relatedId: args.purchaseId,
      timestamp: Date.now(),
    });

    // Update the purchase status
    await ctx.db.patch(args.purchaseId, { status: "Received" });

    return inventoryLotId;
  },
});

/**
 * Fetches a history of all purchase lots.
 * This query denormalizes data from multiple tables to create a flat structure for the UI table.
 */
export const getPurchaseHistory = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const purchaseLots = await ctx.db
      .query("inventoryLots")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("source.type"), "purchase"))
      .order("desc")
      .collect();

    const history = await Promise.all(
      purchaseLots.map(async (lot) => {
        const product = await ctx.db.get(lot.productId);
        const warehouse = await ctx.db.get(lot.warehouseId);

        let supplierName = "N/A";
        // The source is always "purchase" because of the filter above, but we check to satisfy TypeScript
        if (lot.source.type === "purchase") {
          const purchase = await ctx.db.get(lot.source.purchaseId);
          if (purchase?.supplierId) {
            const supplier = await ctx.db.get(purchase.supplierId);
            supplierName = supplier?.name ?? "N/A";
          }
        }

        return {
          _id: lot._id,
          lotNumber: lot.lotNumber,
          productName: product?.name ?? "Producto no encontrado",
          supplierName: supplierName,
          creationDate: lot.creationDate,
          warehouseName: warehouse?.name ?? "Bodega no encontrada",
          quantity: lot.quantity,
          unit: product?.baseUnit ?? "N/A",
          vehicleInfo: lot.vehicleInfo,
        };
      }),
    );

    return history;
  },
});


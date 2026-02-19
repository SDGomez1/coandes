import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Fetches all active inventory lots in a specific warehouse.
 * "Active" means the quantity is greater than zero.
 *
 * @param warehouseId - The ID of the warehouse to query.
 * @returns A list of inventory lots, each joined with its product information.
 */
export const getWarehouseStock = query({
  args: {
    warehouseId: v.id("warehouse"),
  },
  handler: async (ctx, args) => {
    const lots = await ctx.db
      .query("inventoryLots")
      .withIndex("by_warehouse", (q) => q.eq("warehouseId", args.warehouseId))
      .filter((q) => q.gt(q.field("quantity"), 0))
      .order("desc")
      .collect();

    // Join product information for each lot
    const lotsWithProductInfo = await Promise.all(
      lots.map(async (lot) => {
        const product = await ctx.db.get(lot.productId);
        return {
          ...lot,
          productName: product?.name ?? "Unknown Product",
          productSku: product?.sku ?? "N/A",
        };
      }),
    );

    return lotsWithProductInfo;
  },
});

/**
 * Fetches inventory data for a specific warehouse, including product and supplier details.
 *
 * @param warehouseId - The ID of the warehouse to query.
 * @param organizationId - The ID of the organization.
 * @returns An object containing a list of flattened inventory items and the total quantity.
 */
export const getWarehouseInventory = query({
  args: {
    warehouseId: v.id("warehouse"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const lots = await ctx.db
      .query("inventoryLots")
      .withIndex("by_warehouse", (q) => q.eq("warehouseId", args.warehouseId))
      .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
      .filter((q) => q.gt(q.field("quantity"), 0)) // Only show active inventory
      .order("desc")
      .collect();

    let totalQuantity = 0;

    const inventoryData = await Promise.all(
      lots.map(async (lot) => {
        totalQuantity += lot.quantity; // Sum quantities
        const product = await ctx.db.get(lot.productId);
        let supplierName = "N/A";

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
          productType: product?.type ?? "Tipo desconocido",
          supplierName: supplierName,
          quantity: lot.quantity,
          presentation: product?.presentation ?? "",
          equivalence: product?.equivalence ?? "",
          averageWeight: product?.averageWeight ?? 0,
        };
      }),
    );

    return { items: inventoryData, totalQuantity: totalQuantity };
  },
});

/**
 * Fetches all active inventory lots for a specific product.
 *
 * @param productId - The ID of the product to query lots for.
 * @param organizationId - The ID of the organization.
 * @returns A list of active inventory lots for the given product.
 */
export const getLotsForProduct = query({
  args: {
    productId: v.id("products"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("inventoryLots")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
      .filter((q) => q.gt(q.field("quantity"), 0)) // Only active lots
      .collect();
  },
});

export const getProducibleStock = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const allProducibleProducts = await ctx.db
      .query("products")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) =>
        q.or(
          q.eq(q.field("type"), "Raw Material"),
          q.eq(q.field("type"), "By-product"),
        ),
      )
      .collect();

    const stockedProducts = [];

    for (const product of allProducibleProducts) {
      const activeLot = await ctx.db
        .query("inventoryLots")
        .withIndex("by_product", (q) => q.eq("productId", product._id))
        .filter((q) => q.gt(q.field("quantity"), 0))
        .first();

      if (activeLot) {
        stockedProducts.push(product);
      }
    }

    return stockedProducts;
  },
});

export const getInventoryByCategory = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const inventory = await ctx.db
      .query("inventoryLots")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    const inventoryByProduct = new Map<string, number>();
    for (const item of inventory) {
      const product = await ctx.db.get(item.productId);
      if (product) {
        const currentQuantity = inventoryByProduct.get(product.type) ?? 0;
        inventoryByProduct.set(product.type, currentQuantity + item.quantity);
      }
    }
    return Array.from(inventoryByProduct.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  },
});

/**
 * Fetches unified movement history for all inventory stages.
 * Results are sorted by timestamp descending (newest first).
 */
export const getMovementHistory = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db
      .query("activityLog")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const enriched = await Promise.all(
      activity.map(async (entry) => {
        const lot = await ctx.db.get(entry.inventoryLotId);
        const product = lot ? await ctx.db.get(lot.productId) : null;
        const warehouse = lot ? await ctx.db.get(lot.warehouseId) : null;

        return {
          _id: entry._id,
          activityType: entry.activityType,
          quantityChange: entry.quantityChange,
          timestamp: entry.timestamp,
          relatedId: entry.relatedId,
          lotId: entry.inventoryLotId,
          lotNumber: lot?.lotNumber ?? "N/A",
          productName: product?.name ?? "Producto no encontrado",
          warehouseName: warehouse?.name ?? "Bodega no encontrada",
          unit: product?.baseUnit ?? "kg",
        };
      }),
    );

    return enriched.sort((a, b) => b.timestamp - a.timestamp);
  },
});

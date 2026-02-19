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

export const editPurchaseEntry = mutation({
  args: {
    inventoryLotId: v.id("inventoryLots"),
    warehouseId: v.id("warehouse"),
    lotNumber: v.string(),
    quantity: v.number(),
    vehicleInfo: v.string(),
    supplierId: v.optional(v.id("suppliers")),
  },
  handler: async (ctx, args) => {
    if (args.quantity <= 0) {
      throw new Error("Quantity must be greater than zero.");
    }
    if (!args.lotNumber.trim()) {
      throw new Error("Lot number is required.");
    }
    if (!args.vehicleInfo.trim()) {
      throw new Error("Vehicle info is required.");
    }

    const lot = await ctx.db.get(args.inventoryLotId);
    if (!lot) {
      throw new Error("Inventory lot not found.");
    }
    if (lot.source.type !== "purchase") {
      throw new Error("Only purchase lots can be edited from this flow.");
    }

    const purchase = await ctx.db.get(lot.source.purchaseId);
    if (!purchase) {
      throw new Error("Purchase not found.");
    }

    const targetWarehouse = await ctx.db.get(args.warehouseId);
    if (!targetWarehouse) {
      throw new Error("Warehouse not found.");
    }
    if (targetWarehouse.organizationId !== lot.organizationId) {
      throw new Error("Warehouse does not belong to this organization.");
    }

    const duplicateLot = await ctx.db
      .query("inventoryLots")
      .withIndex("by_org", (q) => q.eq("organizationId", lot.organizationId))
      .filter((q) =>
        q.and(
          q.eq(q.field("lotNumber"), args.lotNumber),
          q.neq(q.field("_id"), args.inventoryLotId),
        ),
      )
      .first();

    if (duplicateLot) {
      throw new Error(`Lot number ${args.lotNumber} already exists.`);
    }

    const usedCapacity = await getUsedWarehouseCapacity(
      ctx,
      args.warehouseId,
      args.inventoryLotId,
    );
    if (usedCapacity + args.quantity > targetWarehouse.capacity) {
      throw new Error("Insufficient warehouse capacity for the edited lot.");
    }

    await ctx.db.patch(args.inventoryLotId, {
      warehouseId: args.warehouseId,
      lotNumber: args.lotNumber,
      quantity: args.quantity,
      vehicleInfo: args.vehicleInfo,
    });

    await ctx.db.patch(purchase._id, {
      supplierId: args.supplierId,
    });

    const quantityDelta = args.quantity - lot.quantity;
    if (quantityDelta !== 0) {
      await ctx.db.insert("activityLog", {
        organizationId: lot.organizationId,
        inventoryLotId: lot._id,
        activityType: "adjustment",
        quantityChange: quantityDelta,
        relatedId: purchase._id,
        timestamp: Date.now(),
      });
    }
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
        if (lot.source.type !== "purchase") {
          return null;
        }

        const product = await ctx.db.get(lot.productId);
        const warehouse = await ctx.db.get(lot.warehouseId);
        const purchase = await ctx.db.get(lot.source.purchaseId);

        let supplierName = "N/A";
        if (purchase?.supplierId) {
          const supplier = await ctx.db.get(purchase.supplierId);
          supplierName = supplier?.name ?? "N/A";
        }

        return {
          _id: lot._id,
          purchaseId: lot.source.purchaseId,
          productId: lot.productId,
          warehouseId: lot.warehouseId,
          supplierId: purchase?.supplierId,
          lotNumber: lot.lotNumber,
          productName: product?.name ?? "Producto no encontrado",
          supplierName: supplierName,
          creationDate: lot.creationDate,
          warehouseName: warehouse?.name ?? "Bodega no encontrada",
          quantity: lot.quantity,
          unit: product?.baseUnit ?? "N/A",
          presentation: product?.presentation ?? "",
          equivalence: product?.equivalence ?? "",
          averageWeight: product?.averageWeight ?? 0,
          vehicleInfo: lot.vehicleInfo,
        };
      }),
    );

    return history.filter((item) => item !== null);
  },
});

async function getUsedWarehouseCapacity(
  ctx: any,
  warehouseId: any,
  excludeLotId: any,
) {
  const lots = await ctx.db
    .query("inventoryLots")
    .withIndex("by_warehouse", (q: any) => q.eq("warehouseId", warehouseId))
    .filter((q: any) => q.gt(q.field("quantity"), 0))
    .collect();

  return lots.reduce((sum: number, current: any) => {
    if (current._id === excludeLotId) return sum;
    return sum + current.quantity;
  }, 0);
}

export const getTopSuppliersByPurchase = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const purchases = await ctx.db
      .query("inventoryLots")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("source.type"), "purchase"))
      .collect();
    const suppliers = new Map<string, { name: string; value: number }>();
    for (const purchase of purchases) {
      if (purchase.source.type === "purchase") {
        const p = await ctx.db.get(purchase.source.purchaseId);
        if (p?.supplierId) {
          const supplier = await ctx.db.get(p.supplierId);
          if (supplier) {
            const currentQuantity = suppliers.get(supplier._id)?.value ?? 0;
            suppliers.set(supplier._id, {
              name: supplier.name,
              value: currentQuantity + purchase.quantity,
            });
          }
        }
      }
    }

    return Array.from(suppliers.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  },
});

export const getPurchasesVsDispatches = query({
  args: {
    organizationId: v.id("organizations"),
    days: v.number(), // The timeframe parameter (e.g., 7, 30, 90)
  },
  handler: async (ctx, args) => {
    // 1. Calculate the start date based on the parameter
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - args.days);
    // Normalize to start of that day (00:00:00)
    startDate.setHours(0, 0, 0, 0);
    const startDateMs = startDate.getTime();

    // 2. Fetch purchases within range
    const purchases = await ctx.db
      .query("inventoryLots")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) =>
        q.and(
          q.eq(q.field("source.type"), "purchase"),
          q.gte(q.field("creationDate"), startDateMs),
        ),
      )
      .collect();

    // 3. Fetch dispatches within range
    const orgDispatches = await ctx.db
      .query("dispatches")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.gte(q.field("dispatchDate"), startDateMs))
      .collect();

    // 4. Optimized Line Item Fetching (Concurrent)
    const dispatchesWithItems = await Promise.all(
      orgDispatches.map(async (dispatch) => {
        const items = await ctx.db
          .query("dispatchLineItems")
          .withIndex("by_dispatch", (q) => q.eq("dispatchId", dispatch._id))
          .collect();
        return { ...dispatch, items };
      }),
    );

    // 5. Initialize the Map for the specified range (Oldest -> Newest)
    const data = new Map<string, { despachos: number; compras: number }>();
    for (let i = 0; i <= args.days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      data.set(key, { despachos: 0, compras: 0 });
    }

    // 6. Aggregate Purchase quantities
    for (const purchase of purchases) {
      const key = new Date(purchase.creationDate).toISOString().split("T")[0];
      const current = data.get(key);
      if (current) {
        data.set(key, {
          ...current,
          compras: current.compras + purchase.quantity,
        });
      }
    }

    // 7. Aggregate Dispatch quantities
    for (const dispatch of dispatchesWithItems) {
      const key = new Date(dispatch.dispatchDate).toISOString().split("T")[0];
      const dailyTotal = dispatch.items.reduce(
        (sum, item) => sum + item.quantityDispatched,
        0,
      );
      const current = data.get(key);
      if (current) {
        data.set(key, {
          ...current,
          despachos: current.despachos + dailyTotal,
        });
      }
    }

    // 8. Convert to array and ensure chronological order
    // Since the Map was built starting from startDate, it is already mostly ordered,
    // but we use localeCompare for final safety.
    return Array.from(data.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, values]) => ({
        date: new Date(date).getTime(),
        humanDate: date, // Helpful for debugging/tooltips
        ...values,
      }));
  },
});

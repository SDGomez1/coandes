import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

export const createWarehouse = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    capacity: v.number(), // Assuming capacity is in grams
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
    capacity: v.optional(v.number()), // Assuming capacity is in grams
    row: v.optional(v.number()),
    baseUnit: v.union(
      v.literal("g"),
      v.literal("kg"),
      v.literal("ton"),
      v.literal("lb"),
      v.literal("oz"),
    ),
  },
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

export const getAvailableWarehouse = query({
  args: {},
  handler: async (ctx) => {
    const org = await ctx.db.query("organizations").first();
    if (!org) {
      return [];
    }
    const warehouses = await ctx.db
      .query("warehouse")
      .withIndex("by_org", (q) => q.eq("organizationId", org._id))
      .collect();

    const warehousesWithCapacity = await Promise.all(
      warehouses.map(async (warehouse) => {
        const usedCapacityInGrams = await calculateUsedCapacityInGrams(
          ctx,
          warehouse,
        );
        return {
          ...warehouse,
          usedCapacityInGrams,
          capacityLeftInGrams: warehouse.capacity - usedCapacityInGrams,
        };
      }),
    );

    return warehousesWithCapacity;
  },
});

export const getWarehouseCapacity = query({
  args: {
    warehouseId: v.id("warehouse"),
  },
  handler: async (ctx, args) => {
    const warehouse = await ctx.db.get(args.warehouseId);
    if (!warehouse) {
      throw new Error("Warehouse not found");
    }

    const usedCapacityInGrams = await calculateUsedCapacityInGrams(
      ctx,
      warehouse,
    );

    return {
      capacityInGrams: warehouse.capacity,
      usedCapacityInGrams,
      capacityLeftInGrams: warehouse.capacity - usedCapacityInGrams,
    };
  },
});

async function calculateUsedCapacityInGrams(
  ctx: any,
  warehouse: Doc<"warehouse">,
): Promise<number> {
  const inventoryLots = await ctx.db
    .query("inventoryLots")
    .withIndex("by_warehouse", (q: any) =>
      q.eq("warehouseId", warehouse._id),
    )
    .filter((q: any) => q.gt(q.field("quantity"), 0))
    .collect();

  let totalWeightInGrams = 0;

  await Promise.all(
    inventoryLots.map(async (lot: any) => {
      const product = await ctx.db.get(lot.productId);
      if (product) {
        // Assuming product.averageWeight is in grams
        totalWeightInGrams += lot.quantity 
      }
    }),
  );

  return totalWeightInGrams;
}

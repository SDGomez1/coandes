import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getProductTypes = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("managedProductTypes")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .order("asc")
      .collect();
  },
});

export const createProductType = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    baseType: v.union(
      v.literal("Raw Material"),
      v.literal("Finished Good"),
      v.literal("By-product"),
    ),
  },
  handler: async (ctx, args) => {
    const normalized = args.name.trim();
    if (!normalized) {
      throw new Error("El nombre del tipo es obligatorio.");
    }

    const existing = await ctx.db
      .query("managedProductTypes")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const duplicate = existing.find(
      (t) => t.name.trim().toLowerCase() === normalized.toLowerCase(),
    );

    if (duplicate) {
      throw new Error("Ya existe un tipo de producto con ese nombre.");
    }

    return await ctx.db.insert("managedProductTypes", {
      organizationId: args.organizationId,
      name: normalized,
      baseType: args.baseType,
    });
  },
});

export const updateProductType = mutation({
  args: {
    productTypeId: v.id("managedProductTypes"),
    name: v.string(),
    baseType: v.union(
      v.literal("Raw Material"),
      v.literal("Finished Good"),
      v.literal("By-product"),
    ),
  },
  handler: async (ctx, args) => {
    const productType = await ctx.db.get(args.productTypeId);
    if (!productType) {
      throw new Error("Tipo de producto no encontrado.");
    }

    const normalized = args.name.trim();
    if (!normalized) {
      throw new Error("El nombre del tipo es obligatorio.");
    }

    const existing = await ctx.db
      .query("managedProductTypes")
      .withIndex("by_org", (q) => q.eq("organizationId", productType.organizationId))
      .collect();

    const duplicate = existing.find(
      (t) =>
        t._id !== args.productTypeId &&
        t.name.trim().toLowerCase() === normalized.toLowerCase(),
    );

    if (duplicate) {
      throw new Error("Ya existe un tipo de producto con ese nombre.");
    }

    await ctx.db.patch(args.productTypeId, {
      name: normalized,
      baseType: args.baseType,
    });
  },
});

export const deleteProductType = mutation({
  args: {
    productTypeId: v.id("managedProductTypes"),
  },
  handler: async (ctx, args) => {
    const productType = await ctx.db.get(args.productTypeId);
    if (!productType) {
      throw new Error("Tipo de producto no encontrado.");
    }

    await ctx.db.delete(args.productTypeId);
  },
});

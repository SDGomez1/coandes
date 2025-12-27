import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createProduct = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    sku: v.string(),
    type: v.union(
      v.literal("Raw Material"),
      v.literal("Finished Good"),
      v.literal("By-product"),
    ),
    baseUnit: v.union(
      v.literal("g"),
      v.literal("kg"),
      v.literal("ton"),
      v.literal("lb"),
      v.literal("oz"),
    ),
    presentation: v.optional(v.string()),
    equivalence: v.optional(v.string()),
    averageWeigth: v.optional(v.number()),
    qualityFactorsId: v.optional(v.array(v.id("qualityFactors"))),
  },
  handler: async (ctx, args) => {
    const productId = await ctx.db.insert("products", {
      organizationId: args.organizationId,
      name: args.name,
      sku: args.sku,
      type: args.type,
      baseUnit: args.baseUnit,
      presentation: args.presentation ?? "",
      equivalence: args.equivalence ?? "",
      averageWeight: args.averageWeigth ?? 0,
      qualityFactorsId: args.qualityFactorsId ?? [],
    });
    return productId;
  },
});

export const defineProductOutput = mutation({
  args: {
    organizationId: v.id("organizations"),
    inputProductId: v.id("products"),
    outputProductId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const inputProduct = await ctx.db.get(args.inputProductId);
    const outputProduct = await ctx.db.get(args.outputProductId);

    if (!inputProduct || inputProduct.organizationId !== args.organizationId) {
      throw new Error("Input product not found or access denied.");
    }
    if (
      !outputProduct ||
      outputProduct.organizationId !== args.organizationId
    ) {
      throw new Error("Output product not found or access denied.");
    }

    const existingDefinition = await ctx.db
      .query("productOutputDefinitions")
      .withIndex("by_input", (q) => q.eq("inputProductId", args.inputProductId))
      .filter((q) => q.eq(q.field("outputProductId"), args.outputProductId))
      .first();

    if (existingDefinition) {
      return existingDefinition._id;
    }

    const definitionId = await ctx.db.insert("productOutputDefinitions", {
      organizationId: args.organizationId,
      inputProductId: args.inputProductId,
      outputProductId: args.outputProductId,
    });
    return definitionId;
  },
});

export const getProducts = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();
  },
});

export const getProductsByType = query({
  args: {
    organizationId: v.id("organizations"),
    type: v.union(
      v.literal("Raw Material"),
      v.literal("Finished Good"),
      v.literal("By-product"),
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("type"), args.type))
      .collect();
  },
});

export const getPossibleOutputs = query({
  args: {
    inputProductId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const definitions = await ctx.db
      .query("productOutputDefinitions")
      .withIndex("by_input", (q) => q.eq("inputProductId", args.inputProductId))
      .collect();

    const outputProductIds = definitions.map((def) => def.outputProductId);

    const outputProducts = await Promise.all(
      outputProductIds.map((id) => ctx.db.get(id)),
    );

    return outputProducts.filter((p) => p !== null);
  },
});

export const getQualityFactorsForProduct = query({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      return [];
    }

    if (!product.qualityFactorsId || product.qualityFactorsId.length === 0) {
      return [];
    }

    const qualityFactors = await Promise.all(
      product.qualityFactorsId.map((id) => ctx.db.get(id)),
    );

    return qualityFactors.filter((qf) => qf !== null);
  },
});

export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    name: v.optional(v.string()),
    sku: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("Raw Material"),
        v.literal("Finished Good"),
        v.literal("By-product"),
      ),
    ),
    baseUnit: v.optional(
      v.union(
        v.literal("g"),
        v.literal("kg"),
        v.literal("ton"),
        v.literal("lb"),
        v.literal("oz"),
      ),
    ),
    presentation: v.optional(v.string()),
    equivalence: v.optional(v.string()),
    averageWeight: v.optional(v.number()),
    qualityFactorsId: v.optional(v.array(v.id("qualityFactors"))),
  },
  handler: async (ctx, args) => {
    const { productId, ...rest } = args;
    await ctx.db.patch(productId, rest);
  },
});

export const deleteProduct = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.productId);
  },
});

export const updateProductOutputs = mutation({
  args: {
    productId: v.id("products"),
    outputProductIds: v.array(v.id("products")),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    // Clear existing definitions
    const existing = await ctx.db
      .query("productOutputDefinitions")
      .withIndex("by_input", (q) => q.eq("inputProductId", args.productId))
      .collect();

    for (const def of existing) {
      await ctx.db.delete(def._id);
    }

    // Create new definitions
    for (const outputId of args.outputProductIds) {
      await ctx.db.insert("productOutputDefinitions", {
        organizationId: args.organizationId,
        inputProductId: args.productId,
        outputProductId: outputId,
      });
    }
  },
});

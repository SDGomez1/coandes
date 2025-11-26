import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Creates a new product definition in the system.
 *
 * @param organizationId - The ID of the organization this product belongs to.
 * @param name - The name of the product (e.g., "Green Coffee Beans").
 * @param sku - The Stock Keeping Unit.
 * @param type - The type of the product ("Raw Material", "Intermediate", "Finished Good", "By-product").
 * @param baseUnit - The base measurement unit (e.g., "kg", "liters").
 * @returns The ID of the newly created product.
 */
export const createProduct = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    sku: v.string(),
    type: v.union(
      v.literal("Raw Material"),
      v.literal("Intermediate"),
      v.literal("Finished Good"),
      v.literal("By-product")
    ),
    baseUnit: v.string(),
    // Optional fields from schema
    presentation: v.optional(v.string()),
    equivalence: v.optional(v.string()),
    averageWeigth: v.optional(v.string()),
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
      averageWeigth: args.averageWeigth ?? "",
      qualityFactorsId: args.qualityFactorsId ?? [],
    });
    return productId;
  },
});

/**
 * Defines a possible output for a given input product.
 *
 * @param organizationId - The ID of the organization.
 * @param inputProductId - The ID of the input product (e.g., "Green Coffee Beans").
 * @param outputProductId - The ID of the output product (e.g., "Roasted Coffee").
 */
export const defineProductOutput = mutation({
  args: {
    organizationId: v.id("organizations"),
    inputProductId: v.id("products"),
    outputProductId: v.id("products"),
  },
  handler: async (ctx, args) => {
    // Ensure both products exist and belong to the organization
    const inputProduct = await ctx.db.get(args.inputProductId);
    const outputProduct = await ctx.db.get(args.outputProductId);

    if (!inputProduct || inputProduct.organizationId !== args.organizationId) {
      throw new Error("Input product not found or access denied.");
    }
    if (!outputProduct || outputProduct.organizationId !== args.organizationId) {
      throw new Error("Output product not found or access denied.");
    }

    // Avoid creating duplicates
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

/**
 * Fetches all products for a given organization.
 */
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

/**
 * Fetches products filtered by their type.
 */
export const getProductsByType = query({
  args: {
    organizationId: v.id("organizations"),
    type: v.union(
      v.literal("Raw Material"),
      v.literal("Intermediate"),
      v.literal("Finished Good"),
      v.literal("By-product")
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

/**
 * Fetches all possible output products defined for a given input product.
 */
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
      outputProductIds.map((id) => ctx.db.get(id))
    );

    // Filter out any nulls if a product was deleted
    return outputProducts.filter((p) => p !== null);
  },
});

/**
 * Fetches all quality factors associated with a given product.
 */
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
      product.qualityFactorsId.map((id) => ctx.db.get(id))
    );

    // Filter out any nulls if a factor was deleted and return
    return qualityFactors.filter((qf) => qf !== null);
  },
});

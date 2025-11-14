import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createProductType = mutation({
  args: {
    name: v.string(),
    sku: v.string(),
    baseUnit: v.string(),
    presentation: v.string(),
    equivalence: v.string(),
    averageWeigth: v.string(),
    qualityFactorsId: v.array(v.id("qualityFactors")),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db.query("organizations").first();

    if (!org) throw new Error("Organization not found");
    if (org.active === false) throw new Error("Organization is not active");

    if (args.qualityFactorsId.length > 0) {
      const qfDocs = await Promise.all(
        args.qualityFactorsId.map((id) => ctx.db.get(id)),
      );
      const missingIdx = qfDocs.findIndex((d) => !d);
      if (missingIdx !== -1) {
        throw new Error(
          `qualityFactorsId[${missingIdx}] does not exist: ${
            args.qualityFactorsId[missingIdx]
          }`,
        );
      }
    }

    const existingBySku = await ctx.db
      .query("productTypes")
      .filter((q) => q.eq(q.field("sku"), args.sku))
      .first();
    if (existingBySku) {
      throw new Error(`Product with SKU "${args.sku}" already exists`);
    }

    const id = await ctx.db.insert("productTypes", {
      organizationId: org?._id,
      name: args.name,
      sku: args.sku,
      baseUnit: args.baseUnit,
      presentation: args.presentation,
      equivalence: args.equivalence,
      averageWeigth: args.averageWeigth,
      qualityFactorsId: args.qualityFactorsId,
    });

    return id;
  },
});
export const listProductTypes = query({
  args: {},
  handler: async (ctx) => {
    const org = await ctx.db.query("organizations").first();

    if (!org) throw new Error("Organization not found");
    if (org.active === false) throw new Error("Organization is not active");

    return await ctx.db
      .query("productTypes")
      .withIndex("by_org", (q) => q.eq("organizationId", org._id))
      .collect();
  },
});

export const createProductTypeWithParameters = mutation({
  args: {
    // product
    name: v.string(),
    sku: v.string(),
    baseUnit: v.string(),
    presentation: v.string(),
    equivalence: v.string(),
    averageWeigth: v.string(),

    // existing selected factors
    qualityFactorsId: v.array(v.id("qualityFactors")),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db.query("organizations").first();

    if (!org) throw new Error("Organization not found");
    if (org.active === false) throw new Error("Organization is not active");

    const existingBySku = await ctx.db
      .query("productTypes")
      .filter((q) => q.eq(q.field("sku"), args.sku))
      .first();
    if (existingBySku) {
      throw new Error(`Product with SKU "${args.sku}" already exists`);
    }

    const allFactorIds = new Set<string>(
      args.qualityFactorsId.map((id) => id as unknown as string),
    );

    const factorIdsArray = Array.from(allFactorIds).map(
      (s) => s as unknown as Id<"qualityFactors">,
    );

    const qfDocs = await Promise.all(
      factorIdsArray.map((id) => ctx.db.get(id)),
    );
    const missingIdx = qfDocs.findIndex((d) => !d);
    if (missingIdx !== -1) {
      throw new Error(
        `Collected quality factor does not exist: ${factorIdsArray[missingIdx]}`,
      );
    }

    const productTypeId = await ctx.db.insert("productTypes", {
      organizationId: org._id,
      name: args.name,
      sku: args.sku,
      baseUnit: args.baseUnit,
      presentation: args.presentation,
      equivalence: args.equivalence,
      averageWeigth: args.averageWeigth,
      qualityFactorsId: factorIdsArray,
    });

    return {
      productTypeId,
      qualityFactorIds: factorIdsArray,
    };
  },
});

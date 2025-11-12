import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createQualityFactorsCategory = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db.query("organizations").first();
    if (!org) throw new Error("Organization not found");
    if (org.active === false) throw new Error("Organization is not active");

    const existing = await ctx.db
      .query("qualityFactorsCategory")
      .withIndex("by_org", (q) => q.eq("organizationId", org._id))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existing) {
      throw new Error(
        `Quality factors category "${args.name}" already exists in this organization`,
      );
    }

    const id = await ctx.db.insert("qualityFactorsCategory", {
      organizationId: org._id,
      name: args.name,
    });

    return id;
  },
});

export const createQualityFactor = mutation({
  args: {
    qfCategoryId: v.id("qualityFactorsCategory"),
    name: v.string(),
    unit: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const cat = await ctx.db.get(args.qfCategoryId);
    if (!cat) throw new Error("Quality factors category not found");

    const existing = await ctx.db
      .query("qualityFactors")
      .withIndex("by_qfCat", (q) => q.eq("qfCategoryId", args.qfCategoryId))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existing) {
      throw new Error(
        `Quality factor "${args.name}" already exists in this category`,
      );
    }

    const id = await ctx.db.insert("qualityFactors", {
      qfCategoryId: args.qfCategoryId,
      name: args.name,
      unit: args.unit,
    });

    return id;
  },
});

export const listCategoriesByOrganization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const categories = await ctx.db
      .query("qualityFactorsCategory")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    return categories;
  },
});

export const listCategoriesWithFactorsByOrganization = query({
  args: {},
  handler: async (ctx, args) => {
    const org = await ctx.db.query("organizations").first();
    if (!org) throw new Error("Organization not found");
    if (org.active === false) throw new Error("Organization is not active");

    const categories = await ctx.db
      .query("qualityFactorsCategory")
      .withIndex("by_org", (q) => q.eq("organizationId", org._id))
      .collect();

    const results = await Promise.all(
      categories.map(async (cat) => {
        const factors = await ctx.db
          .query("qualityFactors")
          .withIndex("by_qfCat", (q) => q.eq("qfCategoryId", cat._id))
          .collect();
        return { category: cat, factors };
      }),
    );

    return results;
  },
});

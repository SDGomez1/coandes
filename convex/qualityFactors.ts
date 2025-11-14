import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createQualityCategoriesWithFactors = mutation({
  args: {
    categories: v.array(
      v.object({
        name: v.string(),
        factors: v.array(
          v.object({
            name: v.string(),
            unit: v.optional(v.string()),
          }),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { categories } = args;
        console.log("test")
    const org = await ctx.db.query("organizations").first();
    if (!org) throw new Error("Organization not found");
    if (org.active === false) throw new Error("Organization is not active");

    if (!categories.length) {
      throw new Error("Debe crear al menos una categoría.");
    }

    const results: {
      categoryId: string;
      factorIds: string[];
      name: string;
    }[] = [];

    for (const cat of categories) {
      if (!cat.factors.length) {
        throw new Error(
          `La categoría "${cat.name}" debe tener al menos un factor.`,
        );
      }

      const categoryId = await ctx.db.insert("qualityFactorsCategory", {
        organizationId: org._id,
        name: cat.name,
      });

      const factorIds: string[] = [];
      for (const factor of cat.factors) {
        const qfId = await ctx.db.insert("qualityFactors", {
          qfCategoryId: categoryId,
          name: factor.name,
          unit: factor.unit,
        });
        factorIds.push(qfId);
      }

      results.push({ categoryId, factorIds, name: cat.name });
    }

    return {
      created: results,
      count: results.length,
    };
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

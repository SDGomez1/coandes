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

export const editQualityCategoryWithFactors = mutation({
  args: {
    category: v.object({
      id: v.id("qualityFactorsCategory"),
      name: v.string(),
      factors: v.array(
        v.object({
          id: v.optional(v.id("qualityFactors")),
          name: v.string(),
          unit: v.optional(v.string()),
        }),
      ),
    }),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db.query("organizations").first();
    if (!org) throw new Error("Organization not found");
    if (org.active === false) throw new Error("Organization is not active");

    await ctx.db.patch(args.category.id, { name: args.category.name });
    const existingFactors = await ctx.db
      .query("qualityFactors")
      .withIndex("by_qfCat", (q) => q.eq("qfCategoryId", args.category.id))
      .collect();

    const newFactorIds = new Set(
      args.category.factors.filter((f) => f.id).map((f) => f.id!),
    );

    for (const factor of args.category.factors) {
      if (factor.id) {
        await ctx.db.patch(factor.id, {
          name: factor.name,
          unit: factor.unit,
        });
      } else {
        await ctx.db.insert("qualityFactors", {
          qfCategoryId: args.category.id,
          name: factor.name,
          unit: factor.unit,
        });
      }
    }

    for (const oldFactor of existingFactors) {
      if (!newFactorIds.has(oldFactor._id)) {
        await ctx.db.delete(oldFactor._id);
      }
    }

    return { success: true };
  },
});

export const deleteQualityCategory = mutation({
  args: {
    categoryId: v.id("qualityFactorsCategory"),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db.query("organizations").first();
    if (!org) throw new Error("Organization not found");
    if (org.active === false) throw new Error("Organization is not active");

    const categoryToDelete = await ctx.db.get(args.categoryId);
    if (!categoryToDelete) {
      throw new Error("Category not found");
    }
    if (categoryToDelete.organizationId !== org._id) {
      throw new Error("Unauthorized");
    }

    const factors = await ctx.db
      .query("qualityFactors")
      .withIndex("by_qfCat", (q) => q.eq("qfCategoryId", args.categoryId))
      .collect();

    for (const factor of factors) {
      await ctx.db.delete(factor._id);
    }

    await ctx.db.delete(args.categoryId);

    return { success: true };
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

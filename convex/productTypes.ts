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

    // custom parameters to be created
    qualityParameters: v.array(
      v.object({
        name: v.string(), // category name
        items: v.array(
          v.object({
            label: v.string(), // factor name
            selected: v.boolean(),
          }),
        ),
      }),
    ),
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

    for (const param of args.qualityParameters) {
      const selectedItems = param.items.filter((i) => i.selected);
      if (selectedItems.length === 0) continue;

      let category =
        (await ctx.db
          .query("qualityFactorsCategory")
          .withIndex("by_org", (q) => q.eq("organizationId", org._id))
          .filter((q) => q.eq(q.field("name"), param.name))
          .first()) ?? null;

      if (!category) {
        const catId = await ctx.db.insert("qualityFactorsCategory", {
          organizationId: org._id,
          name: param.name,
        });
        category = {
          _id: catId,
          organizationId: org._id,
          name: param.name,
          _creationTime: Number(new Date()),
        };
      }

      for (const item of selectedItems) {
        const existingFactor =
          (await ctx.db
            .query("qualityFactors")
            .withIndex("by_qfCat", (q) => q.eq("qfCategoryId", category._id))
            .filter((q) => q.eq(q.field("name"), item.label))
            .first()) ?? null;

        if (existingFactor) {
          allFactorIds.add(existingFactor._id as unknown as string);
        } else {
          const factorId = await ctx.db.insert("qualityFactors", {
            qfCategoryId: category._id,
            name: item.label,
            unit: undefined,
          });
          allFactorIds.add(factorId as unknown as string);
        }
      }
    }

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
